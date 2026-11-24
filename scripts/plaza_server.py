#!/usr/bin/env python3
"""Zero-dependency local WebSocket room server for HTL Island Multiplayer Plaza.

Run locally with standard Python 3.9+ (no pip packages required!):
    python scripts/plaza_server.py

Then in the browser's「👥 旅伴廣場 -> ⚙️ 網路」, enter:
    ws://localhost:8766
To play together across phones, tablets and laptops on the same Wi-Fi, opt in to listening
on the LAN explicitly (default is this computer only, so the relay is never exposed by accident):
    python scripts/plaza_server.py --host 0.0.0.0
and enter ws://<your-LAN-IP>:8766 . Only do this on a trusted network: the relay has no authentication.
"""
import asyncio
import base64
import hashlib
import json
import re
import struct
import time
from urllib.parse import parse_qs, urlparse

WS_GUID = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11"
BAD_RE = re.compile(r"幹你|靠北|三小|媽的|白痴|智障|垃圾|去死|fuck|shit|bitch|asshole", re.I)

rooms = {}       # room_id -> set of Client
snapshots = {}   # room_id -> { peer_id: state_dict }
last_chat = {}   # peer_id -> timestamp


class Client:
    def __init__(self, writer, room, peer_id):
        self.writer = writer
        self.room = room
        self.peer_id = peer_id

    async def send_text(self, text: str):
        data = text.encode("utf-8")
        n = len(data)
        if n < 126:
            header = struct.pack("!BB", 0x81, n)
        elif n < 65536:
            header = struct.pack("!BBH", 0x81, 126, n)
        else:
            header = struct.pack("!BBQ", 0x81, 127, n)
        self.writer.write(header + data)
        await self.writer.drain()


async def read_ws_frame(reader: asyncio.StreamReader):
    hdr = await reader.readexactly(2)
    b1, b2 = hdr[0], hdr[1]
    opcode = b1 & 0x0F
    masked = bool(b2 & 0x80)
    length = b2 & 0x7F
    if length == 126:
        length = struct.unpack("!H", await reader.readexactly(2))[0]
    elif length == 127:
        length = struct.unpack("!Q", await reader.readexactly(8))[0]
    if length > 16384:
        raise ValueError("Frame too large")
    mask = await reader.readexactly(4) if masked else b""
    payload = bytearray(await reader.readexactly(length))
    if masked:
        for i in range(length):
            payload[i] ^= mask[i & 3]
    return opcode, bytes(payload)


async def handle_conn(reader: asyncio.StreamReader, writer: asyncio.StreamWriter):
    client = None
    try:
        raw_req = await asyncio.wait_for(reader.readuntil(b"\r\n\r\n"), timeout=8.0)
        lines = raw_req.decode("utf-8", "replace").split("\r\n")
        req_line = lines[0].split(" ")
        path = req_line[1] if len(req_line) > 1 else "/"
        headers = {}
        for ln in lines[1:]:
            if ":" in ln:
                k, v = ln.split(":", 1)
                headers[k.strip().lower()] = v.strip()

        ws_key = headers.get("sec-websocket-key")
        if not ws_key:
            body = b'{"ok":true,"service":"htl-local-plaza"}'
            writer.write(
                b"HTTP/1.1 200 OK\r\nContent-Type: application/json\r\n"
                + f"Content-Length: {len(body)}\r\nConnection: close\r\n\r\n".encode()
                + body
            )
            await writer.drain()
            writer.close()
            return

        accept = base64.b64encode(hashlib.sha1((ws_key + WS_GUID).encode()).digest()).decode()
        writer.write(
            (
                "HTTP/1.1 101 Switching Protocols\r\n"
                "Upgrade: websocket\r\n"
                "Connection: Upgrade\r\n"
                f"Sec-WebSocket-Accept: {accept}\r\n\r\n"
            ).encode()
        )
        await writer.drain()

        qs = parse_qs(urlparse(path).query)
        room = re.sub(r"[^a-zA-Z0-9_-]", "", (qs.get("room", ["lobby"])[0]))[:24] or "lobby"
        peer_id = (qs.get("id", [f"p_{int(time.time()*1000)%100000}"])[0])[:32]

        client = Client(writer, room, peer_id)
        rooms.setdefault(room, set()).add(client)
        room_snaps = snapshots.setdefault(room, {})

        existing = [v for k, v in room_snaps.items() if k != peer_id]
        if existing:
            await client.send_text(json.dumps({"peers": existing}, ensure_ascii=False))

        while True:
            opcode, payload = await read_ws_frame(reader)
            if opcode == 0x8:  # Close
                break
            if opcode == 0x9:  # Ping -> Pong
                writer.write(struct.pack("!BB", 0x8A, len(payload)) + payload)
                await writer.drain()
                continue
            if opcode != 0x1:
                continue

            pkt = json.loads(payload.decode("utf-8", "replace"))
            if not isinstance(pkt, dict):
                continue
            pkt["id"] = peer_id
            pkt["room"] = room
            t = pkt.get("t")

            if t == "chat":
                now = time.monotonic()
                if now - last_chat.get(peer_id, 0) < 0.9:
                    continue
                last_chat[peer_id] = now
                txt = BAD_RE.sub("✦✦", str(pkt.get("text", "")).strip()[:90])
                if not txt:
                    continue
                pkt["text"] = txt
            elif t in ("hello", "welcome", "state", "look"):
                prev = room_snaps.get(peer_id, {})
                room_snaps[peer_id] = {
                    **prev,
                    "id": peer_id,
                    "room": room,
                    "look": pkt.get("look", prev.get("look")),
                    "x": pkt.get("x", prev.get("x", 0)),
                    "y": pkt.get("y", prev.get("y", 0.66)),
                    "z": pkt.get("z", prev.get("z", 0)),
                    "yaw": pkt.get("yaw", prev.get("yaw", 0)),
                    "moving": bool(pkt.get("moving", False)),
                    "sprint": bool(pkt.get("sprint", False)),
                    "jumpY": pkt.get("jumpY", 0),
                    "isl": str(pkt.get("isl", prev.get("isl", "")))[:32],
                }
            elif t == "bye":
                room_snaps.pop(peer_id, None)
            elif t == "dm":
                # 私訊只送給目標（與雲端 Worker 相同）；本機開發伺服器不保留離線角色
                to = str(pkt.get("to", ""))
                txt = BAD_RE.sub("✦✦", str(pkt.get("text", "")).strip()[:90])
                target = next((o for o in rooms.get(room, ()) if o.peer_id == to and o is not client), None)
                if not txt or not target:
                    await client.send_text(json.dumps({"t": "dm_ack", "to": to, "ok": False, "reason": "offline"}))
                    continue
                dm = {"t": "dm", "id": peer_id, "room": room, "text": txt, "name": str(pkt.get("name", ""))[:16], "_pid": str(pkt.get("_pid", ""))[:64]}
                await target.send_text(json.dumps(dm, ensure_ascii=False))
                continue
            elif t == "dmopt":
                continue

            out = json.dumps(pkt, ensure_ascii=False)
            for other in list(rooms.get(room, ())):
                if other is client:
                    continue
                try:
                    await other.send_text(out)
                except Exception:
                    rooms.get(room, set()).discard(other)
    except Exception:
        pass
    finally:
        if client:
            rooms.get(client.room, set()).discard(client)
            snapshots.get(client.room, {}).pop(client.peer_id, None)
            last_chat.pop(client.peer_id, None)
            bye = json.dumps({"t": "bye", "id": client.peer_id, "room": client.room})
            for other in list(rooms.get(client.room, ())):
                try:
                    await other.send_text(bye)
                except Exception:
                    pass
        try:
            writer.close()
        except Exception:
            pass


async def main(host="127.0.0.1", port=8766):
    srv = await asyncio.start_server(handle_conn, host, port)
    print(f"[HTL Plaza] Multiplayer WebSocket relay listening on ws://{host}:{port}")
    async with srv:
        await srv.serve_forever()


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="HTL Island Multiplayer WebSocket Relay")
    parser.add_argument("--host", default="127.0.0.1", help="Bind host (default: 127.0.0.1; use 0.0.0.0 to allow LAN devices)")
    parser.add_argument("--port", type=int, default=8766, help="Bind port (default: 8766)")
    args = parser.parse_args()
    try:
        asyncio.run(main(args.host, args.port))
    except KeyboardInterrupt:
        print("\n[HTL Plaza] Stopped.")

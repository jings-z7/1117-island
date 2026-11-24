// Security regression tests for the multiplayer plaza Worker (workers/plaza-server/worker.js).
// Run: node --test tests/
// No network, no Wrangler: the Durable Object runtime (WebSocketPair, ctx.getWebSockets, attachments)
// is replaced by small in-memory fakes, and Date.now is a controllable clock.
// ISO/IEC 27001:2022 Annex A 8.29 security testing — these keep the fixes from PR #2 from regressing.
import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";

// ── Runtime fakes ───────────────────────────────────────────────────────────
// Node's Response refuses status 101; Workers use it for WebSocket upgrades.
class TestResponse extends Response {
  constructor(body, init = {}) {
    if (init.status === 101) {
      super(null, { ...init, status: 200 });
      this._status = 101;
      this.webSocket = init.webSocket;
    } else {
      super(body, init);
    }
  }
  get status() {
    return this._status ?? super.status;
  }
}
globalThis.Response = TestResponse;

let ctx; // the current room's fake DurableObjectState
class FakeWS {
  constructor() {
    this.sent = [];
    this.att = null;
    this.closed = null;
  }
  send(m) {
    this.sent.push(m);
  }
  serializeAttachment(a) {
    this.att = structuredClone(a);
  }
  deserializeAttachment() {
    return this.att;
  }
  close(code, reason) {
    this.closed = { code, reason };
    ctx.sockets = ctx.sockets.filter((s) => s !== this);
  }
  msgs() {
    return this.sent.map((s) => JSON.parse(s));
  }
}
globalThis.WebSocketPair = function () {
  return { 0: new FakeWS(), 1: new FakeWS() };
};

// Durable Object storage fake (KV API + alarm); kept across "hibernation" by reusing ctx.storage.
function makeStorage() {
  const data = new Map();
  return {
    data,
    alarm: null,
    async get(k) {
      return structuredClone(data.get(k));
    },
    async put(k, v) {
      data.set(k, structuredClone(v));
    },
    async delete(k) {
      return data.delete(k);
    },
    async list({ prefix = "" } = {}) {
      return new Map([...data].filter(([k]) => k.startsWith(prefix)).map(([k, v]) => [k, structuredClone(v)]));
    },
    async setAlarm(t) {
      this.alarm = t;
    },
    async deleteAlarm() {
      this.alarm = null;
    },
  };
}

let now = 1_000_000;
Date.now = () => now;

const { default: worker, PlazaRoom } = await import("../workers/plaza-server/worker.js");

const SITE = "https://htl-island-navigator.pages.dev";
let room;
beforeEach(() => {
  ctx = {
    sockets: [],
    getWebSockets() {
      return [...this.sockets];
    },
    acceptWebSocket(ws) {
      this.sockets.push(ws);
    },
    storage: makeStorage(),
  };
  room = new PlazaRoom(ctx, {});
  now += 60_000;
});

async function connect({ id, key, origin = SITE } = {}) {
  const q = new URLSearchParams({ room: "intern" });
  if (id) q.set("id", id);
  if (key) q.set("key", key);
  const headers = { Upgrade: "websocket" };
  if (origin) headers.Origin = origin;
  const res = await room.fetch(new Request(`https://plaza.test/ws?${q}`, { headers }));
  const ws = res.status === 101 ? ctx.sockets.at(-1) : null;
  // the welcome "caps" packet is set aside so the older tests can keep counting relayed messages
  if (ws) {
    ws.caps = ws.sent.filter((m) => JSON.parse(m).t === "caps").map((m) => JSON.parse(m));
    ws.sent = ws.sent.filter((m) => JSON.parse(m).t !== "caps");
  }
  return { res, ws };
}
const send = (ws, obj) => room.webSocketMessage(ws, typeof obj === "string" ? obj : JSON.stringify(obj));
const ALICE = { id: "p_alice0001", key: "alicesecretkey000000000000" };
const BOB = { id: "p_bobbb0001", key: "bobsecretkey00000000000000" };

// ── Origin allowlist (R-04) ─────────────────────────────────────────────────
test("foreign Origin is rejected; site, Pages previews, localhost and no-Origin are allowed", async () => {
  assert.equal((await connect({ ...ALICE, origin: "https://evil.example" })).res.status, 403);
  assert.equal((await connect({ id: "p_prev00001", key: "k".repeat(20), origin: "https://abc123.htl-island-navigator.pages.dev" })).res.status, 101);
  assert.equal((await connect({ id: "p_local0001", key: "l".repeat(20), origin: "http://127.0.0.1:8765" })).res.status, 101);
  assert.equal((await connect({ id: "p_nohdr0001", key: "n".repeat(20), origin: null })).res.status, 101);
  // custom domain (canonical since 2026-11-14) is allowed; look-alikes are not
  assert.equal((await connect({ id: "p_cust00001", key: "c".repeat(20), origin: "https://nkuht-htl.drmjhsu.com" })).res.status, 101);
  assert.equal((await connect({ id: "p_cust00002", key: "d".repeat(20), origin: "https://nkuht-htl.drmjhsu.com.evil.example" })).res.status, 403);
  assert.equal((await connect({ id: "p_cust00003", key: "e".repeat(20), origin: "https://evil-nkuht-htl.drmjhsu.com" })).res.status, 403);
  assert.equal((await connect({ id: "p_cust00004", key: "g".repeat(20), origin: "http://nkuht-htl.drmjhsu.com" })).res.status, 403, "plain http is not allowed");
  // Look-alike hosts must not pass the preview pattern.
  assert.equal((await connect({ id: "p_fake00001", key: "f".repeat(20), origin: "https://htl-island-navigator.pages.dev.evil.example" })).res.status, 403);
});

test("top-level fetch rejects foreign Origin before reaching the room, and non-GET methods", async () => {
  const env = { PLAZA_ROOM: { idFromName: () => assert.fail("must not reach the Durable Object") } };
  const evil = await worker.fetch(new Request("https://plaza.test/ws", { headers: { Upgrade: "websocket", Origin: "https://evil.example" } }), env);
  assert.equal(evil.status, 403);
  assert.equal((await worker.fetch(new Request("https://plaza.test/stats", { method: "POST" }), env)).status, 405);
  const health = await worker.fetch(new Request("https://plaza.test/health"), env);
  assert.equal((await health.json()).ok, true);
});

// ── Identity binding (R-01) ─────────────────────────────────────────────────
test("a known player id cannot be hijacked without its key; the real player can reconnect", async () => {
  const a = await connect(ALICE);
  assert.equal(a.res.status, 101);
  assert.equal((await connect({ id: ALICE.id, key: "attackerkey000000000000000" })).res.status, 409);
  assert.equal((await connect({ id: ALICE.id })).res.status, 409);
  assert.equal(a.ws.closed, null, "Alice must stay connected");
  const a2 = await connect(ALICE);
  assert.equal(a2.res.status, 101);
  assert.ok(a.ws.closed, "same-key reconnect replaces the old socket");
});

test("invalid ids are replaced by a server-generated one", async () => {
  const { ws } = await connect({ id: "<script>", key: "x".repeat(20) });
  assert.match(ws.deserializeAttachment().id, /^p_[0-9a-f]{12}$/);
});

// ── Relay whitelist (R-03) ──────────────────────────────────────────────────
test("relayed state is bound to the server id and sanitised", async () => {
  const { ws: a } = await connect(ALICE);
  const { ws: b } = await connect(BOB);
  await send(a, {
    t: "state", id: BOB.id, room: "other", x: 1e308, y: "x", z: 3, yaw: 0.5,
    look: { name: "<img src=x onerror=alert(1)>Alice‮", role: "visitor", evil: { nested: 1 }, shirt: 123 },
    emote: "<script>", isl: "A".repeat(500), extra: "drop-me",
  });
  const st = b.msgs().find((m) => m.t === "state");
  assert.ok(st, "state relayed");
  assert.equal(st.id, ALICE.id, "spoofed id overwritten");
  assert.equal(st.room, "intern", "spoofed room overwritten");
  assert.equal(st.x, 1e4, "numbers clamped");
  assert.equal(typeof st.y, "number");
  assert.ok(!("extra" in st), "unknown field dropped");
  assert.ok(!("evil" in st.look), "nested look value dropped");
  assert.equal(st.look.shirt, 123);
  assert.ok(st.look.name.length <= 16 && !/‮/.test(st.look.name), "name capped, bidi stripped");
  assert.equal(st.emote, null);
  assert.equal(st.isl.length, 32);
});

test("unknown packet types are not relayed; chat is filtered; the key never leaves the server", async () => {
  const { ws: a } = await connect(ALICE);
  const { ws: b } = await connect(BOB);
  await send(a, { t: "admin", cmd: "kick" });
  await send(a, { t: "chat", text: "hello\nfuck world", look: { name: "A" } });
  const got = b.msgs();
  assert.ok(!got.some((m) => m.t === "admin"));
  assert.equal(got.find((m) => m.t === "chat")?.text, "hello ✦✦ world");
  assert.ok(!b.sent.join("").includes(ALICE.key));
});

test("chat is limited to about one message per second per player", async () => {
  const { ws: a } = await connect(ALICE);
  const { ws: b } = await connect(BOB);
  await send(a, { t: "chat", text: "one" });
  now += 200;
  await send(a, { t: "chat", text: "two" });
  now += 1000;
  await send(a, { t: "chat", text: "three" });
  assert.deepEqual(b.msgs().filter((m) => m.t === "chat").map((m) => m.text), ["one", "three"]);
});

test("oversized and non-object messages are ignored", async () => {
  const { ws: a } = await connect(ALICE);
  const { ws: b } = await connect(BOB);
  await send(a, JSON.stringify({ t: "chat", text: "x".repeat(5000) }));
  await send(a, "[1,2,3]");
  await send(a, "not json");
  assert.equal(b.sent.length, 0);
});

// ── Flood protection (R-03) ─────────────────────────────────────────────────
test("a burst of 300 packets is rate-limited", async () => {
  const { ws: a } = await connect(ALICE);
  const { ws: b } = await connect(BOB);
  for (let i = 0; i < 300; i++) await send(a, { t: "state", x: i, z: 0 });
  assert.ok(b.sent.length <= 40 && b.sent.length >= 30, `relayed ${b.sent.length}`);
});

test("the normal client cadence (one state every 90 ms) is never throttled", async () => {
  const { ws: a } = await connect(ALICE);
  const { ws: b } = await connect(BOB);
  for (let i = 0; i < 200; i++) {
    await send(a, { t: "state", x: i, z: 0 });
    now += 90;
  }
  assert.equal(b.sent.length, 200);
});

// ── Capacity ────────────────────────────────────────────────────────────────
test("a room accepts at most 50 connections", async () => {
  for (let i = 0; i < 50; i++) {
    assert.equal((await connect({ id: `p_user${String(i).padStart(5, "0")}`, key: `key${i}`.padEnd(20, "x") })).res.status, 101);
  }
  assert.equal((await connect({ id: "p_late00001", key: "late".padEnd(20, "x") })).res.status, 503);
});

// ── Offline "away" characters ──────────────────────────────────────────────
const HOUR = 3_600_000;
async function hello(ws, name = "A") {
  await send(ws, { t: "hello", x: 1, z: 2, look: { name } });
}
// 預設模擬「停留超過 1 分鐘後才斷線」；stay 可指定較短的停留時間
async function drop(ws, stay = 61_000) {
  now += stay;
  ws.close(1006, "gone");
  await room.webSocketClose(ws, 1006, "gone");
}

test("closing the tab leaves an offline character instead of removing the player", async () => {
  const { ws: a } = await connect(ALICE);
  const { ws: b } = await connect(BOB);
  await hello(a, "Alice");
  await drop(a);
  const away = b.msgs().find((m) => m.t === "away");
  assert.ok(away, "peers are told the player went offline");
  assert.equal(away.id, ALICE.id);
  assert.equal(away.look.name, "Alice");
  assert.equal(away.moving, false);
  assert.ok(!b.msgs().some((m) => m.t === "bye"), "no bye for a disconnect");
  assert.ok(!JSON.stringify([...ctx.storage.data.values()]).includes(ALICE.key), "only the key hash is stored");

  // A newcomer sees the offline character in the welcome list.
  const { ws: c } = await connect({ id: "p_carol0001", key: "carolsecretkey000000000000" });
  const welcome = c.msgs()[0];
  assert.deepEqual(welcome.away.map((g) => g.id), [ALICE.id]);
});

test("an explicit bye leaves no offline character", async () => {
  const { ws: a } = await connect(ALICE);
  const { ws: b } = await connect(BOB);
  await hello(a);
  await send(a, { t: "bye" });
  await drop(a);
  assert.ok(!b.msgs().some((m) => m.t === "away"));
  assert.equal(ctx.storage.data.size, 0);
});

test("only the key holder can take back an offline character; it survives hibernation", async () => {
  const { ws: a } = await connect(ALICE);
  await hello(a, "Alice");
  await drop(a);
  room = new PlazaRoom(ctx, {}); // Durable Object evicted and woken up: state reloads from storage
  assert.equal((await connect({ id: ALICE.id, key: "attackerkey000000000000000" })).res.status, 409);
  const back = await connect(ALICE);
  assert.equal(back.res.status, 101);
  assert.equal(back.ws.deserializeAttachment().snap.look.name, "Alice", "position and look are restored");
  assert.equal(ctx.storage.data.size, 0, "the offline character is consumed on return");
  assert.equal(ctx.storage.alarm, null);
});

test("offline characters expire after 6 hours via the alarm", async () => {
  const { ws: a } = await connect(ALICE);
  const { ws: b } = await connect(BOB);
  await hello(a);
  await drop(a);
  assert.equal(ctx.storage.alarm, now + 6 * HOUR);
  now += 5 * HOUR;
  await room.alarm();
  assert.equal(ctx.storage.data.size, 1, "still kept before 6 h");
  now += HOUR;
  await room.alarm();
  assert.equal(ctx.storage.data.size, 0);
  assert.ok(b.msgs().some((m) => m.t === "bye" && m.id === ALICE.id));
  // An expired character no longer blocks its id.
  assert.equal((await connect({ id: ALICE.id, key: "someoneelse000000000000000" })).res.status, 101);
});

test("at most 100 offline characters are kept; the oldest is removed first", async () => {
  const { ws: watcher } = await connect(BOB);
  for (let i = 0; i < 101; i++) {
    const { ws } = await connect({ id: `p_ghost${String(i).padStart(4, "0")}`, key: `ghostkey${i}`.padEnd(20, "x") });
    await hello(ws);
    now += 1000;
    await drop(ws);
  }
  assert.equal(ctx.storage.data.size, 100);
  assert.ok(!ctx.storage.data.has("g:p_ghost0000"));
  assert.ok(ctx.storage.data.has("g:p_ghost0001"), "only the single oldest is removed");
  assert.ok(watcher.msgs().some((m) => m.t === "bye" && m.id === "p_ghost0000"));
});

// ── Private messages (dm) ───────────────────────────────────────────────────
const CAROL = { id: "p_carol0001", key: "carolsecretkey000000000000" };

test("a dm reaches only its recipient, with the server-bound sender id", async () => {
  const { ws: a } = await connect(ALICE);
  const { ws: b } = await connect(BOB);
  const { ws: c } = await connect(CAROL);
  await hello(a, "Alice");
  await send(a, { t: "dm", to: BOB.id, id: CAROL.id, text: "hi\nfuck <b>", _pid: "x:1" });
  const got = b.msgs().filter((m) => m.t === "dm");
  assert.equal(got.length, 1);
  assert.equal(got[0].id, ALICE.id, "sender cannot be spoofed");
  assert.equal(got[0].name, "Alice");
  assert.equal(got[0].text, "hi ✦✦ <b>");
  assert.ok(!("to" in got[0]));
  assert.ok(!c.msgs().some((m) => m.t === "dm"), "nobody else receives it");
  assert.deepEqual(a.msgs().find((m) => m.t === "dm_ack"), { t: "dm_ack", to: BOB.id, ok: true, ref: "x:1" });
});

test("a dm to an offline or unknown player is not delivered and not stored", async () => {
  const { ws: a } = await connect(ALICE);
  const { ws: b } = await connect(BOB);
  await hello(b);
  await drop(b);
  const before = JSON.stringify([...ctx.storage.data]);
  await send(a, { t: "dm", to: BOB.id, text: "are you there?" });
  assert.equal(a.msgs().at(-1).reason, "offline");
  assert.equal(JSON.stringify([...ctx.storage.data]), before, "message is not kept for later");
  assert.ok(!JSON.stringify([...ctx.storage.data]).includes("are you there"));
});

test("dm rate limits: one per second, at most 8 per minute to the same player", async () => {
  const { ws: a } = await connect(ALICE);
  const { ws: b } = await connect(BOB);
  await send(a, { t: "dm", to: BOB.id, text: "1" });
  now += 200;
  await send(a, { t: "dm", to: BOB.id, text: "2" });
  assert.equal(a.msgs().at(-1).reason, "rate");
  for (let i = 0; i < 12; i++) {
    now += 1000;
    await send(a, { t: "dm", to: BOB.id, text: `m${i}` });
  }
  assert.equal(b.msgs().filter((m) => m.t === "dm").length, 8);
});

test("a player can close their inbox; dmopt is never relayed", async () => {
  const { ws: a } = await connect(ALICE);
  const { ws: b } = await connect(BOB);
  await send(b, { t: "dmopt", closed: true });
  assert.ok(!a.msgs().some((m) => m.t === "dmopt"));
  await send(a, { t: "dm", to: BOB.id, text: "hello" });
  assert.equal(a.msgs().at(-1).reason, "closed");
  assert.ok(!b.msgs().some((m) => m.t === "dm"));
});

// ── Star level on the name tag ──────────────────────────────────────────────
test("star level is relayed only as an integer from 1 to 5; titles are never relayed", async () => {
  const { ws: a } = await connect(ALICE);
  const { ws: b } = await connect(BOB);
  const cases = [[3, 3], [5, 5], [9, undefined], [0, undefined], [2.5, undefined], ["5", undefined], [-1, undefined]];
  for (const [lv, want] of cases) {
    now += 100;
    await send(a, { t: "look", look: { name: "A", lv, title: "五星官方認證" } });
    const got = b.msgs().filter((m) => m.t === "look").at(-1).look;
    assert.equal(got.lv, want, `lv ${JSON.stringify(lv)}`);
  }
  // a free-text "title" field is only a capped look string, never treated specially
  assert.ok(b.msgs().filter((m) => m.t === "look").every((m) => (m.look.title || "").length <= 32));
});

// ── Room allowlist (offline characters are persisted, so rooms must be bounded) ──
test("only the three client rooms exist; any other room name maps to the lobby", async () => {
  const seen = [];
  const env = { PLAZA_ROOM: { idFromName: (n) => (seen.push(n), n), get: () => ({ fetch: async () => new Response("ok") }) } };
  for (const r of ["lobby", "freshman", "intern", "INTERN", "attacker-room-123", "../x", ""]) {
    await worker.fetch(new Request(`https://plaza.test/stats?room=${encodeURIComponent(r)}`), env);
  }
  assert.deepEqual(seen, ["lobby", "freshman", "intern", "intern", "lobby", "lobby", "lobby"]);
});

test("a drive-by visitor who leaves within a minute leaves no offline character", async () => {
  const { ws: a } = await connect(ALICE);
  const { ws: b } = await connect(BOB);
  await hello(a, "Alice");
  await drop(a, 20_000);
  assert.ok(!b.msgs().some((m) => m.t === "away"));
  assert.ok(b.msgs().some((m) => m.t === "bye" && m.id === ALICE.id), "peers are told the player left");
  assert.equal(ctx.storage.data.size, 0);
});

test("only the returning player is told their offline character was restored", async () => {
  const { ws: a } = await connect(ALICE);
  const { ws: b } = await connect(BOB);
  await hello(a, "Alice");
  await drop(a);
  const back = await connect(ALICE);
  assert.equal(back.ws.msgs()[0].restored, true);
  assert.ok(!b.msgs().some((m) => "restored" in m), "nobody else gets the flag");
  // a brand-new player gets no restored flag
  const { ws: c } = await connect({ id: "p_carol0001", key: "carolsecretkey000000000000" });
  assert.ok(!c.msgs().some((m) => m.restored));
});

// ── Character transfer (/xfer) ──────────────────────────────────────────────
const slotOf = (n) => n.toString(16).padStart(64, "0");
async function xfer(body, { ip = "203.0.113.1" } = {}) {
  const res = await room.fetch(new Request("https://plaza.test/xfer", { method: "POST", headers: { "Content-Type": "application/json", "CF-Connecting-IP": ip }, body: JSON.stringify(body) }));
  return { status: res.status, body: await res.json() };
}

test("xfer: ciphertext is stored once and can be taken exactly once", async () => {
  const slot = slotOf(1);
  assert.equal((await xfer({ op: "put", slot, data: "QUJDRA==" })).status, 200);
  assert.deepEqual([...ctx.storage.data.values()][0], { data: "QUJDRA==", at: now }, "only the opaque ciphertext and a timestamp are stored");
  assert.equal((await xfer({ op: "put", slot, data: "QUJDRA==" })).status, 409, "a slot cannot be overwritten");
  const got = await xfer({ op: "take", slot });
  assert.equal(got.status, 200);
  assert.equal(got.body.data, "QUJDRA==");
  assert.equal((await xfer({ op: "take", slot })).status, 404, "second take fails");
  assert.equal(ctx.storage.data.size, 0);
});

test("xfer: entries expire after 10 minutes (take and alarm)", async () => {
  await xfer({ op: "put", slot: slotOf(2), data: "QQ==" });
  await xfer({ op: "put", slot: slotOf(3), data: "QQ==" });
  assert.equal(ctx.storage.alarm, now + 10 * 60 * 1000);
  now += 10 * 60 * 1000;
  assert.equal((await xfer({ op: "take", slot: slotOf(2) })).status, 404);
  await room.alarm();
  assert.equal(ctx.storage.data.size, 0, "alarm removes expired transfers");
});

test("xfer: malformed input is rejected", async () => {
  assert.equal((await xfer({ op: "put", slot: "abc", data: "QQ==" })).status, 400, "slot must be 64 hex chars");
  assert.equal((await xfer({ op: "put", slot: slotOf(4), data: "<script>" })).status, 400, "data must be base64");
  assert.equal((await xfer({ op: "put", slot: slotOf(4), data: "A".repeat(24 * 1024 + 4) })).status, 400, "data size is capped");
  assert.equal((await xfer({ op: "delete", slot: slotOf(4) })).status, 400, "unknown op");
  const big = await room.fetch(new Request("https://plaza.test/xfer", { method: "POST", body: "x".repeat(40 * 1024) }));
  assert.equal(big.status, 413);
  assert.equal(ctx.storage.data.size, 0);
});

test("xfer: per-IP rate limits for creating and taking", async () => {
  for (let i = 0; i < 5; i++) assert.equal((await xfer({ op: "put", slot: slotOf(100 + i), data: "QQ==" })).status, 200);
  assert.equal((await xfer({ op: "put", slot: slotOf(200), data: "QQ==" })).status, 429);
  assert.equal((await xfer({ op: "put", slot: slotOf(200), data: "QQ==" }, { ip: "198.51.100.7" })).status, 200, "other IPs are not affected");
  for (let i = 0; i < 10; i++) await xfer({ op: "take", slot: slotOf(900 + i) });
  assert.equal((await xfer({ op: "take", slot: slotOf(100) })).status, 429, "guessing is throttled");
});

test("xfer: at most 200 live transfers", async () => {
  for (let i = 0; i < 200; i++) assert.equal((await xfer({ op: "put", slot: slotOf(1000 + i), data: "QQ==" }, { ip: `10.0.${i >> 8}.${i & 255}` })).status, 200);
  assert.equal((await xfer({ op: "put", slot: slotOf(5000), data: "QQ==" }, { ip: "10.9.9.9" })).status, 503);
});

test("xfer: top-level route requires an allowed Origin and POST", async () => {
  const env = { PLAZA_ROOM: { idFromName: () => "x", get: () => ({ fetch: (r) => room.fetch(r) }) } };
  const call = (init) => worker.fetch(new Request("https://plaza.test/xfer", init), env);
  assert.equal((await call({ method: "POST", body: "{}" })).status, 403, "no Origin");
  assert.equal((await call({ method: "POST", headers: { Origin: "https://evil.example" }, body: "{}" })).status, 403);
  const pre = await call({ method: "OPTIONS", headers: { Origin: SITE } });
  assert.equal(pre.status, 204);
  assert.equal(pre.headers.get("Access-Control-Allow-Origin"), SITE, "CORS echoes the allowed origin, not *");
  assert.equal((await call({ method: "GET", headers: { Origin: SITE } })).status, 405);
  const custom = await call({ method: "OPTIONS", headers: { Origin: "https://nkuht-htl.drmjhsu.com" } });
  assert.equal(custom.status, 204, "custom domain may call /xfer");
  assert.equal(custom.headers.get("Access-Control-Allow-Origin"), "https://nkuht-htl.drmjhsu.com");
  assert.equal((await call({ method: "OPTIONS", headers: { Origin: "https://nkuht-htl.drmjhsu.com.evil.example" } })).status, 403);
  const ok = await call({ method: "POST", headers: { Origin: SITE, "Content-Type": "application/json" }, body: JSON.stringify({ op: "put", slot: slotOf(7), data: "QQ==" }) });
  assert.equal(ok.status, 200);
  assert.equal(ok.headers.get("Access-Control-Allow-Origin"), SITE);
});

// ── 第五期 multiplayer: caps, bell challenge, duel, party, report (2026-11-15) ──────────────────────────────
const DAVE = { id: "p_daveee001", key: "davesecretkey0000000000000" };
const ERIN = { id: "p_erinnn001", key: "erinsecretkey0000000000000" };
// campus bell id for "now" (Asia/Taipei = UTC+8): YYYYMMDDHHmm + s|e
function bellEv(offsetMs = 0, kind = "s") {
  const d = new Date(now - offsetMs + 8 * 3600 * 1000);
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}${p(d.getUTCMonth() + 1)}${p(d.getUTCDate())}${p(d.getUTCHours())}${p(d.getUTCMinutes())}${kind}`;
}
const tick = (ms = 400) => (now += ms);

test("a new connection is told which multiplayer features the server supports", async () => {
  const a = await connect(ALICE);
  assert.equal(a.ws.caps.length, 1);
  assert.deepEqual(a.ws.caps[0].caps, ["bell", "duel", "party", "report", "notice"]);
});

test("bell challenge: one bounded score per player per bell, ranked for the whole room", async () => {
  const a = await connect(ALICE),
    b = await connect(BOB);
  const ev = bellEv(60_000);
  await send(a.ws, { t: "bell", ev, s: 4, ms: 30000, name: "<b>x</b>", id: BOB.id });
  tick();
  await send(b.ws, { t: "bell", ev, s: 5, ms: 40000 });
  const board = b.ws.msgs().filter((m) => m.t === "board").at(-1);
  assert.equal(board.n, 2);
  assert.deepEqual(board.top.map((e) => [e.id, e.s]), [[BOB.id, 5], [ALICE.id, 4]]);
  assert.ok(!JSON.stringify(board).includes("<b>"), "client-sent names are not used");
  // a second score for the same bell is refused
  tick();
  await send(a.ws, { t: "bell", ev, s: 5, ms: 1 });
  assert.equal(a.ws.msgs().filter((m) => m.t === "bell_ack").at(-1).reason, "done");
  // out-of-range scores and times are dropped
  const c = await connect(CAROL);
  await send(c.ws, { t: "bell", ev, s: 9, ms: 1 });
  tick();
  await send(c.ws, { t: "bell", ev, s: 3, ms: -5 });
  assert.equal(c.ws.msgs().filter((m) => m.t === "board").length, 0);
});

test("bell challenge: only bells from the last 10 minutes and well-formed ids are accepted", async () => {
  const a = await connect(ALICE);
  await send(a.ws, { t: "bell", ev: bellEv(11 * 60_000), s: 3, ms: 100 });
  assert.equal(a.ws.msgs().filter((m) => m.t === "bell_ack").at(-1).reason, "closed");
  tick();
  await send(a.ws, { t: "bell", ev: bellEv(-60_000), s: 3, ms: 100 }); // in the future
  assert.equal(a.ws.msgs().filter((m) => m.t === "bell_ack").at(-1).reason, "closed");
  tick();
  await send(a.ws, { t: "bell", ev: "20261115081x", s: 3, ms: 100 });
  assert.equal(a.ws.msgs().filter((m) => m.t === "board").length, 0);
});

test("duel: relayed only to the invited online player with a bounded seed and score", async () => {
  const a = await connect(ALICE),
    b = await connect(BOB),
    c = await connect(CAROL);
  await send(a.ws, { t: "duel", op: "invite", to: BOB.id, seed: 12345, id: CAROL.id, extra: "x" });
  const got = b.ws.msgs().filter((m) => m.t === "duel");
  assert.equal(got.length, 1);
  assert.deepEqual([got[0].id, got[0].op, got[0].seed, got[0].extra], [ALICE.id, "invite", 12345, undefined]);
  assert.equal(c.ws.msgs().filter((m) => m.t === "duel").length, 0, "bystanders see nothing");
  tick();
  await send(b.ws, { t: "duel", op: "result", to: ALICE.id, s: 7, ms: 1000 }); // score out of range
  assert.equal(a.ws.msgs().filter((m) => m.t === "duel").length, 0);
  tick();
  await send(b.ws, { t: "duel", op: "result", to: ALICE.id, s: 4, ms: 21000 });
  assert.deepEqual(a.ws.msgs().filter((m) => m.t === "duel").map((m) => [m.op, m.s]), [["result", 4]]);
  tick();
  await send(a.ws, { t: "duel", op: "invite", to: "p_nobody001", seed: 1 });
  assert.equal(a.ws.msgs().filter((m) => m.t === "duel_ack").at(-1).reason, "offline");
});

test("duel: at most 6 messages a minute to the same player", async () => {
  const a = await connect(ALICE),
    b = await connect(BOB);
  for (let i = 0; i < 9; i++) {
    tick();
    await send(a.ws, { t: "duel", op: "invite", to: BOB.id, seed: i });
  }
  assert.equal(b.ws.msgs().filter((m) => m.t === "duel").length, 6);
  assert.equal(a.ws.msgs().filter((m) => m.t === "duel_ack").at(-1).reason, "rate");
});

test("party: invite, accept, at most four members, leader-only kick, leader hand-over", async () => {
  const a = await connect(ALICE),
    b = await connect(BOB),
    c = await connect(CAROL),
    d = await connect(DAVE),
    e = await connect(ERIN);
  // accepting without an invite does nothing
  await send(b.ws, { t: "party", op: "accept", to: ALICE.id });
  assert.equal(b.ws.msgs().filter((m) => m.t === "party_state").length, 0);
  for (const [w, who] of [
    [b, BOB],
    [c, CAROL],
    [d, DAVE],
  ]) {
    tick();
    await send(a.ws, { t: "party", op: "invite", to: who.id });
    tick();
    await send(w.ws, { t: "party", op: "accept", to: ALICE.id });
  }
  const st = a.ws.msgs().filter((m) => m.t === "party_state").at(-1);
  assert.equal(st.leader, ALICE.id);
  assert.deepEqual(st.members, [ALICE.id, BOB.id, CAROL.id, DAVE.id]);
  tick();
  await send(a.ws, { t: "party", op: "invite", to: ERIN.id });
  assert.equal(a.ws.msgs().filter((m) => m.t === "party_ack").at(-1).reason, "full");
  // a member cannot kick
  tick();
  await send(b.ws, { t: "party", op: "kick", to: CAROL.id });
  assert.equal(b.ws.msgs().filter((m) => m.t === "party_ack").at(-1).reason, "notleader");
  // the leader can
  tick();
  await send(a.ws, { t: "party", op: "kick", to: CAROL.id });
  assert.deepEqual(c.ws.msgs().filter((m) => m.t === "party_state").at(-1).members, []);
  // the leader leaves: the next member leads
  tick();
  await send(a.ws, { t: "party", op: "leave" });
  const st2 = b.ws.msgs().filter((m) => m.t === "party_state").at(-1);
  assert.equal(st2.leader, BOB.id);
  assert.deepEqual(st2.members, [BOB.id, DAVE.id]);
  // a closed tab leaves the party too; a party of one dissolves
  await room.webSocketClose(d.ws, 1000, "");
  assert.deepEqual(b.ws.msgs().filter((m) => m.t === "party_state").at(-1).members, []);
  assert.equal(e.ws.msgs().filter((m) => m.t === "party_state").length, 0);
});

test("party: invites expire after a minute", async () => {
  const a = await connect(ALICE),
    b = await connect(BOB);
  await send(a.ws, { t: "party", op: "invite", to: BOB.id });
  now += 61_000;
  await send(b.ws, { t: "party", op: "accept", to: ALICE.id });
  assert.equal(b.ws.msgs().filter((m) => m.t === "party_ack").at(-1).reason, "expired");
});

test("report: three distinct reporters mute chat, dm and emote for 30 minutes; repeats do not count twice", async () => {
  const a = await connect(ALICE),
    b = await connect(BOB),
    c = await connect(CAROL),
    d = await connect(DAVE);
  // free text and unknown reasons are ignored
  await send(b.ws, { t: "report", to: ALICE.id, reason: "I hate you" });
  assert.equal(b.ws.msgs().filter((m) => m.t === "report_ack").length, 0);
  for (let i = 0; i < 3; i++) {
    tick();
    await send(b.ws, { t: "report", to: ALICE.id, reason: "spam" }); // same reporter three times
  }
  tick(1200);
  await send(a.ws, { t: "chat", text: "still here" });
  assert.ok(d.ws.msgs().some((m) => m.t === "chat"), "one reporter alone does not mute");
  tick();
  await send(c.ws, { t: "report", to: ALICE.id, reason: "abuse" });
  tick();
  await send(d.ws, { t: "report", to: ALICE.id, reason: "other" });
  const before = d.ws.sent.length;
  tick(1200);
  await send(a.ws, { t: "chat", text: "hello" });
  tick(1200);
  await send(a.ws, { t: "emote", kind: "wave" });
  tick(1200);
  await send(a.ws, { t: "dm", to: DAVE.id, text: "hi" });
  assert.equal(d.ws.sent.length, before, "nothing from the muted player is relayed");
  assert.equal(a.ws.msgs().filter((m) => m.t === "dm_ack").at(-1).reason, "muted");
  now += 30 * 60_000 + 1000;
  await send(a.ws, { t: "chat", text: "back" });
  assert.equal(d.ws.msgs().filter((m) => m.t === "chat").at(-1).text, "back");
  // nobody can report themselves
  tick();
  await send(a.ws, { t: "report", to: ALICE.id, reason: "spam" });
  assert.equal(a.ws.msgs().filter((m) => m.t === "report_ack").length, 0);
});

test("game packets are rate-limited per player and level is relayed only as an integer from 1 to 30", async () => {
  const a = await connect(ALICE),
    b = await connect(BOB);
  for (let i = 0; i < 10; i++) await send(a.ws, { t: "duel", op: "invite", to: BOB.id, seed: i }); // same instant
  assert.equal(b.ws.msgs().filter((m) => m.t === "duel").length, 1);
  tick();
  await send(a.ws, { t: "look", look: { name: "A", lvl: 31 } });
  tick();
  await send(a.ws, { t: "look", look: { name: "A", lvl: 12 } });
  const looks = b.ws.msgs().filter((m) => m.t === "look");
  assert.equal(looks[0].look.lvl, undefined);
  assert.equal(looks.at(-1).look.lvl, 12);
});

// ── 旅伴交誼島 fixed-choice notices (2026-11-15) ────────────────────────────
test("notice: only whitelisted codes are broadcast, with the server-bound id and name and no free text", async () => {
  const a = await connect(ALICE),
    b = await connect(BOB);
  await send(a.ws, { t: "look", look: { name: "Alice" } });
  tick();
  await send(a.ws, { t: "notice", code: "hack", text: "free text" });
  assert.equal(b.ws.msgs().filter((m) => m.t === "notice").length, 0);
  tick();
  await send(a.ws, { t: "notice", code: "photo", text: "<b>free text</b>", id: BOB.id, name: "Mallory" });
  const n = b.ws.msgs().filter((m) => m.t === "notice");
  assert.equal(n.length, 1);
  assert.deepEqual([n[0].id, n[0].code, n[0].name, n[0].text], [ALICE.id, "photo", "Alice", undefined]);
});

test("notice: at most one per player per minute", async () => {
  const a = await connect(ALICE),
    b = await connect(BOB);
  await send(a.ws, { t: "notice", code: "party" });
  tick(5000);
  await send(a.ws, { t: "notice", code: "duel" });
  assert.equal(b.ws.msgs().filter((m) => m.t === "notice").length, 1);
  assert.equal(a.ws.msgs().filter((m) => m.t === "notice_ack").at(-1).reason, "rate");
  now += 61_000;
  await send(a.ws, { t: "notice", code: "duel" });
  assert.equal(b.ws.msgs().filter((m) => m.t === "notice").length, 2);
});

test("notice: a muted player cannot post notices", async () => {
  const a = await connect(ALICE),
    b = await connect(BOB),
    c = await connect(CAROL),
    d = await connect(DAVE);
  for (const w of [b, c, d]) {
    tick();
    await send(w.ws, { t: "report", to: ALICE.id, reason: "spam" });
  }
  tick();
  await send(a.ws, { t: "notice", code: "plaza" });
  assert.equal(b.ws.msgs().filter((m) => m.t === "notice").length, 0);
});

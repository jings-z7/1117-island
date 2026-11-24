// Cloudflare Worker + Durable Objects (WebSocket Hibernation API)
// HTL Island Navigator — 雲端跨裝置多人即時旅伴廣場伺服器 (PlazaRoom)
// 正式端點：wss://htl-island-plaza.dr-jacqueshsu.workers.dev/ws

//
// 資安強化（ISO/IEC 27001:2022 Annex A 8.26 應用程式安全要求、8.28 安全程式設計、8.20/8.22 網路安全）：
//  1. Origin 白名單：僅允許本站（含 Pages 預覽網域）與本機開發來源建立 WebSocket，避免他站盜連（CSWSH）。
//  2. 身分綁定：玩家 id 需搭配僅存在用戶端、永不廣播的 key（伺服器只保存其 SHA-256 雜湊），
//     他人即使看見 id 也無法冒用或把原玩家「擠下線」。
//  3. 輸入白名單：只轉發已知封包類型與欄位，數值限定為有限且在合理範圍內，字串一律截斷與過濾。
//  4. 速率限制：每條連線採 token bucket，防止洪水廣播造成阻斷服務（DoS）與費用暴增。
//  5. 不記錄聊天內容與個資（資料最小化，Annex A 5.34 / 8.11）。
//  6. 離線角色（away）：斷線後僅保存「暱稱／外觀／最後位置」與 key 雜湊於 Durable Object Storage，
//     最多 MAX_GHOSTS 位、保留 GHOST_TTL_MS，到期由 alarm 自動刪除；只有持有原 key 者能接回角色。
//  7. 私訊（dm，丟水球）：伺服器只送給目標連線，不廣播、不保存；對方離線即回報未送達。
//     每人每秒 1 則、對同一人每分鐘至多 DM_PAIR_MAX 則；收件者可關閉私訊（dmopt）。
//  8. 角色轉移（/xfer）：瀏覽器端以轉移碼加密（AES-GCM，金鑰由轉移碼經 PBKDF2 導出），伺服器只保存
//     「查詢代號＋密文」，讀不到內容、也不知道轉移碼。一次性、XFER_TTL_MS 到期、最多 XFER_MAX 筆、
//     只接受白名單來源、依 IP 限速；代號與轉移碼都不出現在網址。

const MAX_ROOM_SIZE = 50;
const MAX_MSG_BYTES = 4096;
/** Packet types the client sends; anything else is dropped instead of being fanned out to the whole room. */
const PACKET_TYPES = new Set(["hello", "welcome", "state", "look", "chat", "emote", "bye", "dm", "dmopt", "bell", "duel", "party", "report", "notice"]);
// 第五期 multiplayer (2026-11-15). The welcome "caps" packet tells clients which of these this server understands, so
// a client never shows a button an older server would silently drop.
const CAPS = ["bell", "duel", "party", "report", "notice"];
const MISC_MIN_GAP_MS = 300; // bell / duel / party / report: at most ~3 per second per player
// 鐘聲迎賓挑戰: ev = campus (Asia/Taipei) bell time "YYYYMMDDHHmm" + "s" (class starts) or "e" (class ends)
const BELL_EV_RE = /^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})([se])$/;
const BELL_WINDOW_MS = 10 * 60 * 1000; // scores are taken for 10 minutes after the bell
const BELL_TOP = 10;
const BELL_MAX_Q = 5;
const DUEL_OPS = new Set(["invite", "accept", "decline", "result"]);
const DUEL_PAIR_WINDOW_MS = 60_000;
const DUEL_PAIR_MAX = 6;
const PARTY_OPS = new Set(["invite", "accept", "leave", "kick"]);
const PARTY_MAX = 4;
const PARTY_INVITE_TTL_MS = 60_000;
const REPORT_REASONS = new Set(["spam", "abuse", "impersonation", "other"]);
const REPORT_WINDOW_MS = 10 * 60 * 1000;
const REPORT_THRESHOLD = 3; // distinct reporters within the window
const MUTE_MS = 30 * 60 * 1000;
// 旅伴交誼島 fixed-choice notices: only a code travels; every viewer looks the words up in a fixed table
const NOTICE_CODES = new Set(["party", "duel", "photo", "bell", "plaza", "help"]);
const NOTICE_GAP_MS = 60_000;
const RATE_CAPACITY = 40; // 突發上限（封包數）
const RATE_REFILL_PER_SEC = 20; // 用戶端正常約每 90ms 送一次狀態（≈11/s）
const GHOST_TTL_MS = 6 * 60 * 60 * 1000; // 離線角色保留 6 小時
const MAX_GHOSTS = 100; // 每個房間最多保留 100 位離線角色（超過時最早離線者先移除；防止大量連線灌爆儲存與進場清單）
const MIN_GHOST_SESSION_MS = 60_000; // 停留不到 1 分鐘就離開的「路過」訪客不留離線角色，避免場上擠滿無人角色
const DM_MIN_GAP_MS = 950; // 私訊：每人約每秒 1 則
const DM_PAIR_WINDOW_MS = 60_000;
const DM_PAIR_MAX = 8; // 私訊：對同一位玩家每分鐘至多 8 則（防騷擾洗版）
const XFER_TTL_MS = 10 * 60 * 1000; // 轉移資料 10 分鐘後失效
const XFER_MAX = 200; // 同時最多 200 筆待取的轉移資料
const XFER_MAX_DATA = 24 * 1024; // 密文（base64）上限 24 KB
const XFER_MAX_BODY = 32 * 1024;
const XFER_PUT_LIMIT = [5, 10 * 60 * 1000]; // 每個 IP 每 10 分鐘最多產生 5 組
const XFER_TAKE_LIMIT = [10, 60 * 1000]; // 每個 IP 每分鐘最多嘗試取回 10 次
const SLOT_RE = /^[0-9a-f]{64}$/;
const B64_RE = /^[A-Za-z0-9+/]+={0,2}$/;
const BAD_WORDS = /幹你|靠北|三小|媽的|白痴|智障|垃圾|去死|fuck|shit|bitch|asshole/gi;
const ID_RE = /^[A-Za-z0-9_-]{4,40}$/;
const KEY_RE = /^[A-Za-z0-9_-]{16,64}$/;
const TOKEN_RE = /^[a-z][a-z0-9_-]{0,15}$/i; // emote 名稱等短代碼

const DEFAULT_ALLOWED_ORIGINS = [
  "https://nkuht-htl.drmjhsu.com", // 正式網址（自訂網域）
  "https://htl-island-navigator.pages.dev", // 舊網址（仍可使用）
  /^https:\/\/[a-z0-9-]+\.htl-island-navigator\.pages\.dev$/, // Cloudflare Pages 預覽部署
  /^http:\/\/(localhost|127\.0\.0\.1)(:\d{1,5})?$/, // 本機開發（scripts/serve.sh）
];

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "X-Content-Type-Options": "nosniff",
  "Cache-Control": "no-store",
};

function cleanText(s, max = 90) {
  return String(s || "")
    .replace(/[\u0000-\u001f\u007f​-‏‪-‮⁦-⁩]+/g, " ")
    .trim()
    .slice(0, max)
    .replace(BAD_WORDS, "✦✦");
}

function originAllowed(origin, env) {
  // 非瀏覽器用戶端不帶 Origin；瀏覽器一定會帶，故只對「有帶且不在白名單」者拒絕。
  if (!origin) return true;
  const extra = String(env?.ALLOWED_ORIGINS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return [...DEFAULT_ALLOWED_ORIGINS, ...extra].some((rule) => (typeof rule === "string" ? rule === origin : rule.test(origin)));
}

// 只接受前端實際提供的房間（island-social.js 的 ROOMS）。離線角色會寫入 Durable Object Storage，
// 若接受任意房間名稱，他人可大量開房、各塞滿離線角色，造成儲存空間與費用無限成長（Annex A 8.6 容量管理）。
// 新增房間時請同步修改此處與前端 ROOMS。
const ROOMS = new Set(["lobby", "freshman", "intern"]);
function cleanRoom(v) {
  const r = String(v || "").toLowerCase();
  return ROOMS.has(r) ? r : "lobby";
}

function finiteNum(v, min, max, fallback) {
  return typeof v === "number" && Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : fallback;
}

// 外觀設定只允許「原始型別」欄位（字串／有限數字／布林），限制欄位數與長度，避免夾帶物件或超大負載。
function cleanLook(look) {
  if (!look || typeof look !== "object" || Array.isArray(look)) return undefined;
  const out = {};
  let n = 0;
  for (const [k, v] of Object.entries(look)) {
    if (n >= 40 || !/^[A-Za-z][A-Za-z0-9_]{0,23}$/.test(k)) continue;
    // 星等：只接受 1–5 的整數（稱號文字由觀看者端查固定表，不經網路傳送）
    if (k === "lv") {
      if (Number.isInteger(v) && v >= 1 && v <= 5) {
        out.lv = v;
        n++;
      }
      continue;
    }
    // 第四期 level inside the star rank: integer 1–30 only
    if (k === "lvl") {
      if (Number.isInteger(v) && v >= 1 && v <= 30) {
        out.lvl = v;
        n++;
      }
      continue;
    }
    if (typeof v === "string") out[k] = cleanText(v, k === "name" ? 16 : 32);
    else if (typeof v === "number" && Number.isFinite(v)) out[k] = v;
    else if (typeof v === "boolean") out[k] = v;
    else continue;
    n++;
  }
  return out;
}

// /xfer 只回應白名單來源（必須帶 Origin），CORS 回傳該來源本身而非 *
function xferHeaders(origin) {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "600",
    Vary: "Origin",
    "X-Content-Type-Options": "nosniff",
    "Cache-Control": "no-store",
  };
}

async function sha256Hex(s) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/xfer") {
      const origin = request.headers.get("Origin") || "";
      if (!origin || !originAllowed(origin, env)) {
        return new Response("Forbidden origin", { status: 403, headers: { "Cache-Control": "no-store" } });
      }
      const headers = xferHeaders(origin);
      if (request.method === "OPTIONS") return new Response(null, { status: 204, headers });
      if (request.method !== "POST") return new Response("Method Not Allowed", { status: 405, headers: { ...headers, Allow: "POST, OPTIONS" } });
      const stub = env.PLAZA_ROOM.get(env.PLAZA_ROOM.idFromName("__xfer"));
      const res = await stub.fetch(request);
      return new Response(res.body, { status: res.status, headers: { ...headers, "Content-Type": "application/json" } });
    }
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: CORS_HEADERS });
    }

    if (url.pathname === "/health") {
      return Response.json(
        { ok: true, service: "htl-island-plaza", mode: "durable-objects-sqlite" },
        { headers: CORS_HEADERS }
      );
    }

    if (request.method !== "GET") {
      return new Response("Method Not Allowed", { status: 405, headers: { ...CORS_HEADERS, Allow: "GET, OPTIONS" } });
    }

    const baseRoom = cleanRoom(url.searchParams.get("room"));

    if (url.pathname === "/stats") {
      const id = env.PLAZA_ROOM.idFromName(baseRoom);
      const stub = env.PLAZA_ROOM.get(id);
      return stub.fetch(request);
    }

    if (request.headers.get("Upgrade")?.toLowerCase() === "websocket") {
      if (!originAllowed(request.headers.get("Origin"), env)) {
        return new Response("Forbidden origin", { status: 403, headers: CORS_HEADERS });
      }
      const id = env.PLAZA_ROOM.idFromName(baseRoom);
      const stub = env.PLAZA_ROOM.get(id);
      return stub.fetch(request);
    }

    return Response.json(
      {
        ok: true,
        service: "HTL Island Multiplayer Plaza Server",
        usage: "Connect via WebSocket wss://<host>/ws?room=lobby&id=<player_id>",
      },
      { headers: CORS_HEADERS }
    );
  },
};

export class PlazaRoom {
  constructor(ctx, env) {
    this.ctx = ctx;
    this.env = env;
    this.peers = new Map(); // id -> last state snapshot
    this.rateMap = new Map(); // id -> last chat timestamp
    // keep-alive pings are answered by the runtime without waking this object from hibernation, so an
    // open-but-idle tab no longer keeps the Durable Object (and its billing) awake
    try {
      this.ctx.setWebSocketAutoResponse(new WebSocketRequestResponsePair("ping", '{"t":"pong"}'));
    } catch {}
    this.buckets = new WeakMap(); // ws -> { tokens, at } 每連線速率限制
    this.ghosts = null; // id -> { id, kh, snap, at } 離線角色（自 storage 延遲載入）
    this.dmRate = new Map(); // id -> last dm timestamp
    this.dmPairs = new Map(); // "from>to" -> [timestamps]
    this.xferHits = new Map(); // "put|ip" / "take|ip" -> [timestamps]（只在 __xfer 實例使用）
    // 第五期: in-memory only (a room that hibernates simply starts these afresh)
    this.miscRate = new Map(); // id -> last bell/duel/party/report timestamp
    this.boards = new Map(); // ev -> Map(id -> { id, name, s, ms, at })
    this.duelPairs = new Map(); // "from>to" -> [timestamps]
    this.parties = new Map(); // partyId -> { id, leader, members: [ids] }
    this.partyOf = new Map(); // id -> partyId
    this.partyInvites = new Map(); // "from>to" -> expiry timestamp
    this.reports = new Map(); // target id -> Map(reporter id -> timestamp)
    this.muted = new Map(); // id -> muted until timestamp
    this.noticeAt = new Map(); // id -> last notice timestamp

    // Hibernation 喚醒後，從現存 WebSocket attachment 還原所有線上玩家快照
    for (const ws of this.ctx.getWebSockets()) {
      try {
        const meta = ws.deserializeAttachment();
        if (meta?.id && meta?.snap) {
          this.peers.set(meta.id, meta.snap);
        }
      } catch {}
    }
  }

  // 離線角色只在斷線、回來與到期時讀寫 storage，平常移動不寫入，成本極低。
  async _ghostMap() {
    if (!this.ghosts) {
      const m = new Map();
      try {
        const rows = await this.ctx.storage.list({ prefix: "g:" });
        for (const [, g] of rows) if (g?.id) m.set(g.id, g);
      } catch {}
      if (!this.ghosts) this.ghosts = m;
    }
    return this.ghosts;
  }

  async _dropGhost(id) {
    const ghosts = await this._ghostMap();
    if (!ghosts.has(id)) return false;
    ghosts.delete(id);
    try {
      await this.ctx.storage.delete("g:" + id);
    } catch {}
    return true;
  }

  async _scheduleAlarm() {
    const ghosts = await this._ghostMap();
    try {
      const due = [...ghosts.values()].map((g) => g.at + GHOST_TTL_MS);
      const xfers = await this.ctx.storage.list({ prefix: "x:" });
      for (const [, x] of xfers) if (x?.at) due.push(x.at + XFER_TTL_MS);
      if (!due.length) {
        await this.ctx.storage.deleteAlarm?.();
        return;
      }
      await this.ctx.storage.setAlarm?.(Math.min(...due));
    } catch {}
  }

  _xferAllow(kind, ip) {
    const [max, win] = kind === "put" ? XFER_PUT_LIMIT : XFER_TAKE_LIMIT;
    const key = kind + "|" + ip;
    const now = Date.now();
    const hits = (this.xferHits.get(key) || []).filter((t) => now - t < win);
    if (hits.length >= max) {
      this.xferHits.set(key, hits);
      return false;
    }
    hits.push(now);
    this.xferHits.set(key, hits);
    if (this.xferHits.size > 5000) {
      for (const [k, v] of this.xferHits) if (!v.length || now - v[v.length - 1] > 10 * 60 * 1000) this.xferHits.delete(k);
    }
    return true;
  }

  // 角色轉移：put 存入密文、take 取出即刪（一次性）。伺服器不解密、不記錄內容。
  async _xfer(request) {
    const reply = (status, body) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
    if (request.method !== "POST") return reply(405, { ok: false });
    const ip = request.headers.get("CF-Connecting-IP") || "unknown";
    const raw = await request.text();
    if (raw.length > XFER_MAX_BODY) return reply(413, { ok: false, reason: "too-large" });
    let pkt;
    try {
      pkt = JSON.parse(raw);
    } catch {
      return reply(400, { ok: false });
    }
    if (!pkt || typeof pkt !== "object" || !SLOT_RE.test(pkt.slot || "")) return reply(400, { ok: false });
    const key = "x:" + pkt.slot;
    const now = Date.now();
    if (pkt.op === "put") {
      if (!this._xferAllow("put", ip)) return reply(429, { ok: false, reason: "rate" });
      const data = pkt.data;
      if (typeof data !== "string" || !data || data.length > XFER_MAX_DATA || !B64_RE.test(data)) return reply(400, { ok: false });
      const all = await this.ctx.storage.list({ prefix: "x:" });
      let live = 0;
      for (const [k, x] of all) {
        if (!x?.at || now - x.at >= XFER_TTL_MS) await this.ctx.storage.delete(k);
        else live++;
      }
      if (live >= XFER_MAX) return reply(503, { ok: false, reason: "busy" });
      if (await this.ctx.storage.get(key)) return reply(409, { ok: false });
      await this.ctx.storage.put(key, { data, at: now });
      await this._scheduleAlarm();
      return reply(200, { ok: true, ttl: XFER_TTL_MS });
    }
    if (pkt.op === "take") {
      if (!this._xferAllow("take", ip)) return reply(429, { ok: false, reason: "rate" });
      const x = await this.ctx.storage.get(key);
      if (x) await this.ctx.storage.delete(key);
      if (!x || now - x.at >= XFER_TTL_MS) return reply(404, { ok: false, reason: "not-found" });
      await this._scheduleAlarm();
      return reply(200, { ok: true, data: x.data });
    }
    return reply(400, { ok: false });
  }

  _broadcast(obj, except = null) {
    const out = JSON.stringify(obj);
    for (const peerWs of this.ctx.getWebSockets()) {
      if (peerWs === except) continue;
      try {
        peerWs.send(out);
      } catch {}
    }
  }

  // 到期（24 小時）的離線角色由 Durable Object alarm 自動刪除並通知房內玩家
  async alarm() {
    const ghosts = await this._ghostMap();
    const now = Date.now();
    try {
      for (const [k, x] of await this.ctx.storage.list({ prefix: "x:" })) {
        if (!x?.at || now - x.at >= XFER_TTL_MS) await this.ctx.storage.delete(k);
      }
    } catch {}
    for (const g of [...ghosts.values()]) {
      if (now - g.at >= GHOST_TTL_MS) {
        await this._dropGhost(g.id);
        this._broadcast({ t: "bye", id: g.id, room: g.snap?.room || "lobby" });
      }
    }
    await this._scheduleAlarm();
  }

  async fetch(request) {
    const url = new URL(request.url);
    if (url.pathname === "/xfer") return this._xfer(request);
    const room = cleanRoom(url.searchParams.get("room"));

    if (url.pathname === "/stats") {
      const activeIds = new Set();
      for (const s of this.ctx.getWebSockets()) {
        try {
          const m = s.deserializeAttachment();
          if (m?.id) activeIds.add(m.id);
        } catch {}
      }
      const ghosts = await this._ghostMap();
      return Response.json(
        { ok: true, room, online: activeIds.size, away: ghosts.size },
        { headers: CORS_HEADERS }
      );
    }

    if (request.headers.get("Upgrade")?.toLowerCase() !== "websocket") {
      return new Response("Expected Upgrade: websocket", { status: 426, headers: CORS_HEADERS });
    }

    if (!originAllowed(request.headers.get("Origin"), this.env)) {
      return new Response("Forbidden origin", { status: 403, headers: CORS_HEADERS });
    }

    const rawId = url.searchParams.get("id") || "";
    const clientId = ID_RE.test(rawId) ? rawId : "p_" + crypto.randomUUID().replace(/-/g, "").slice(0, 12);
    // key 只在用戶端與此處出現、永不轉發；未提供（舊版用戶端）時改用隨機值，等同無法被他人接管。
    const rawKey = url.searchParams.get("key") || "";
    const keyHash = await sha256Hex(KEY_RE.test(rawKey) ? rawKey : crypto.randomUUID());

    // 離線角色同樣綁定 key：他人即使知道 id，也無法「接收」別人留在場上的離線角色。
    const ghosts = await this._ghostMap();
    let ghost = ghosts.get(clientId) || null;
    if (ghost && Date.now() - ghost.at >= GHOST_TTL_MS) ghost = null;
    if (ghost && ghost.kh !== keyHash) {
      return new Response("Player id already in use", { status: 409, headers: CORS_HEADERS });
    }

    // 同一位玩家重複連線（例如網路切換重連）：只有持有相同 key 者可取代舊連線，避免他人冒用 id 踢人。
    for (const oldWs of this.ctx.getWebSockets()) {
      try {
        const m = oldWs.deserializeAttachment();
        if (m?.id === clientId) {
          if (m.kh && m.kh !== keyHash) {
            return new Response("Player id already in use", { status: 409, headers: CORS_HEADERS });
          }
          oldWs.close(1000, "Replaced by newer connection");
        }
      } catch {}
    }

    const sockets = this.ctx.getWebSockets();
    if (sockets.length >= MAX_ROOM_SIZE) {
      return new Response("Room is full", { status: 503, headers: CORS_HEADERS });
    }

    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);

    this.ctx.acceptWebSocket(server);
    const prevSnap = this.peers.get(clientId) || ghost?.snap || null;
    // since：連線開始時間。接回離線角色者視為已停留夠久（since = 0）
    server.serializeAttachment({ id: clientId, kh: keyHash, room, snap: prevSnap, since: ghost ? 0 : Date.now() });

    try {
      server.send(JSON.stringify({ t: "caps", caps: CAPS }));
    } catch {}
    // 傳送目前房間內其他線上玩家的快照給新加入者
    const existing = [];
    const seenIds = new Set([clientId]);
    for (const peerWs of this.ctx.getWebSockets()) {
      if (peerWs === server) continue;
      try {
        const m = peerWs.deserializeAttachment();
        const pid = m?.id;
        if (!pid || seenIds.has(pid)) continue;
        const snap = this.peers.get(pid) || m?.snap;
        if (snap) {
          seenIds.add(pid);
          existing.push(snap);
        }
      } catch {}
    }
    // 離線角色（不含自己）：最後位置與外觀，供新加入者顯示「（離線）」名牌
    const now = Date.now();
    const away = [];
    for (const g of ghosts.values()) {
      if (g.id === clientId || seenIds.has(g.id) || now - g.at >= GHOST_TTL_MS) continue;
      away.push({ ...g.snap, id: g.id, room, at: g.at });
    }
    // restored：本人接回了自己的離線角色（只送給本人，讓前端顯示「歡迎回來」）
    const restored = !!ghost;
    if (existing.length || away.length || restored) {
      const hello = { peers: existing };
      if (away.length) hello.away = away;
      if (restored) hello.restored = true;
      server.send(JSON.stringify(hello));
    }

    // 本人回來：收回自己的離線角色（其他人會在收到 hello 時把名牌改回上線）
    if (ghosts.has(clientId)) {
      await this._dropGhost(clientId);
      await this._scheduleAlarm();
    }

    return new Response(null, { status: 101, webSocket: client });
  }

  _allow(ws) {
    const now = Date.now();
    const b = this.buckets.get(ws) || { tokens: RATE_CAPACITY, at: now };
    b.tokens = Math.min(RATE_CAPACITY, b.tokens + ((now - b.at) / 1000) * RATE_REFILL_PER_SEC);
    b.at = now;
    if (b.tokens < 1) {
      this.buckets.set(ws, b);
      return false;
    }
    b.tokens -= 1;
    this.buckets.set(ws, b);
    return true;
  }

  async webSocketMessage(ws, message) {
    if (typeof message !== "string" || message.length > MAX_MSG_BYTES) return;
    if (!this._allow(ws)) return; // 超量封包直接丟棄
    if (message === "ping") {
      try {
        ws.send('{"t":"pong"}');
      } catch {}
      return;
    }
    let pkt;
    try {
      pkt = JSON.parse(message);
    } catch {
      return;
    }
    if (!pkt || typeof pkt !== "object" || Array.isArray(pkt)) return;
    if (pkt.t === "ping") {
      try {
        ws.send('{"t":"pong"}');
      } catch {}
      return;
    }
    if (!PACKET_TYPES.has(pkt.t)) return;
    const meta = ws.deserializeAttachment() || {};
    const senderId = meta.id; // 身分一律以伺服器端連線綁定的 id 為準，不信任封包內 id
    if (!senderId) return;
    const room = meta.room || "lobby";
    const base = { t: pkt.t, id: senderId, room };
    if (typeof pkt._pid === "string") base._pid = pkt._pid.slice(0, 64);

    const mutedUntil = this.muted.get(senderId) || 0;
    const isMuted = mutedUntil > Date.now();
    if (!isMuted && mutedUntil) this.muted.delete(senderId);
    if (isMuted && (pkt.t === "chat" || pkt.t === "emote" || pkt.t === "notice")) return;
    if (isMuted && pkt.t === "dm") {
      try {
        ws.send(JSON.stringify({ t: "dm_ack", to: ID_RE.test(pkt.to || "") ? pkt.to : "", ok: false, reason: "muted" }));
      } catch {}
      return;
    }
    if (pkt.t === "notice") {
      const now = Date.now();
      if (!NOTICE_CODES.has(pkt.code)) return;
      if (now - (this.noticeAt.get(senderId) || 0) < NOTICE_GAP_MS) {
        try {
          ws.send(JSON.stringify({ t: "notice_ack", ok: false, reason: "rate" }));
        } catch {}
        return;
      }
      this.noticeAt.set(senderId, now);
      this._broadcast({ t: "notice", id: senderId, room, name: this._nameOf(meta), code: pkt.code });
      return;
    }
    if (pkt.t === "bell" || pkt.t === "duel" || pkt.t === "party" || pkt.t === "report") {
      const now = Date.now();
      if (now - (this.miscRate.get(senderId) || 0) < MISC_MIN_GAP_MS) return;
      this.miscRate.set(senderId, now);
      return this._game(ws, meta, senderId, room, pkt, now);
    }

    let out;
    if (pkt.t === "chat") {
      const now = Date.now();
      const prev = this.rateMap.get(senderId) || 0;
      if (now - prev < 950) return;
      this.rateMap.set(senderId, now);
      const text = cleanText(pkt.text, 90);
      if (!text) return;
      out = { ...base, text, name: cleanText(pkt.name, 16), look: cleanLook(pkt.look) };
    } else if (pkt.t === "emote") {
      out = {
        ...base,
        kind: TOKEN_RE.test(pkt.kind || "") ? pkt.kind : "wave",
        targetId: ID_RE.test(pkt.targetId || "") ? pkt.targetId : undefined,
        look: cleanLook(pkt.look),
      };
    } else if (pkt.t === "dm") {
      // 私訊（丟水球）：只送給同房間、在線的目標連線；不廣播、不保存內容。
      const to = ID_RE.test(pkt.to || "") ? pkt.to : "";
      const ref = typeof pkt._pid === "string" ? pkt._pid.slice(0, 64) : undefined;
      const ack = (ok, reason) => {
        try {
          ws.send(JSON.stringify({ t: "dm_ack", to, ok, ...(reason ? { reason } : {}), ...(ref ? { ref } : {}) }));
        } catch {}
      };
      if (!to || to === senderId) return;
      const text = cleanText(pkt.text, 90);
      if (!text) return;
      const now = Date.now();
      const pairKey = senderId + ">" + to;
      const hist = (this.dmPairs.get(pairKey) || []).filter((ts) => now - ts < DM_PAIR_WINDOW_MS);
      if (now - (this.dmRate.get(senderId) || 0) < DM_MIN_GAP_MS || hist.length >= DM_PAIR_MAX) return ack(false, "rate");
      let target = null;
      let targetMeta = null;
      for (const s of this.ctx.getWebSockets()) {
        if (s === ws) continue;
        try {
          const m = s.deserializeAttachment();
          if (m?.id === to && !m.left) {
            target = s;
            targetMeta = m;
          }
        } catch {}
      }
      if (!target) return ack(false, "offline");
      if (targetMeta.nodm) return ack(false, "closed");
      this.dmRate.set(senderId, now);
      hist.push(now);
      this.dmPairs.set(pairKey, hist);
      if (this.dmPairs.size > 2000) {
        for (const [k, v] of this.dmPairs) if (!v.length || now - v[v.length - 1] >= DM_PAIR_WINDOW_MS) this.dmPairs.delete(k);
      }
      const name = cleanText((meta.snap?.look && meta.snap.look.name) || pkt.name, 16);
      try {
        target.send(JSON.stringify({ ...base, text, name }));
      } catch {
        return ack(false, "offline");
      }
      return ack(true);
    } else if (pkt.t === "dmopt") {
      // 收件設定：closed=true 時不接收任何私訊（只影響伺服器端，不轉發）
      try {
        ws.serializeAttachment({ ...meta, nodm: pkt.closed === true });
      } catch {}
      return;
    } else if (pkt.t === "hello" || pkt.t === "welcome" || pkt.t === "state" || pkt.t === "look") {
      const prevSnap = this.peers.get(senderId) || meta.snap || {};
      const merged = {
        id: senderId,
        room,
        look: cleanLook(pkt.look) || prevSnap.look,
        x: finiteNum(pkt.x, -1e4, 1e4, prevSnap.x || 0),
        y: finiteNum(pkt.y, -1e3, 1e3, prevSnap.y || 0.66),
        z: finiteNum(pkt.z, -1e4, 1e4, prevSnap.z || 0),
        yaw: finiteNum(pkt.yaw, -1e3, 1e3, prevSnap.yaw || 0),
        moving: !!pkt.moving,
        sprint: !!pkt.sprint,
        jumpY: finiteNum(pkt.jumpY, -50, 50, 0),
        emote: TOKEN_RE.test(pkt.emote || "") ? pkt.emote : null,
        isl: typeof pkt.isl === "string" ? cleanText(pkt.isl, 32) : prevSnap.isl || "",
        ts: Date.now(),
      };
      this.peers.set(senderId, merged);
      try {
        ws.serializeAttachment({ ...meta, id: senderId, room, snap: merged, left: false });
      } catch {}
      out = { ...merged, t: pkt.t, ...(base._pid ? { _pid: base._pid } : {}) };
    } else if (pkt.t === "bye") {
      // 主動「離開廣場」：不留下離線角色
      this.peers.delete(senderId);
      try {
        ws.serializeAttachment({ ...meta, left: true });
      } catch {}
      if (await this._dropGhost(senderId)) await this._scheduleAlarm();
      out = base;
    } else {
      return; // 未知封包類型不轉發
    }

    out = JSON.stringify(out);
    for (const peerWs of this.ctx.getWebSockets()) {
      if (peerWs === ws) continue;
      try {
        peerWs.send(out);
      } catch {}
    }
  }

  // ---- 第五期 multiplayer --------------------------------------------------------------------------------------
  _socketOf(id, except) {
    for (const s of this.ctx.getWebSockets()) {
      if (s === except) continue;
      try {
        const m = s.deserializeAttachment();
        if (m?.id === id && !m.left) return s;
      } catch {}
    }
    return null;
  }
  _sendTo(id, obj) {
    const s = this._socketOf(id);
    if (!s) return false;
    try {
      s.send(JSON.stringify(obj));
      return true;
    } catch {
      return false;
    }
  }
  _nameOf(meta) {
    return cleanText(meta?.snap?.look?.name || "", 16) || "高餐訪客";
  }
  _partyState(p) {
    const msg = p ? { t: "party_state", party: p.id, leader: p.leader, members: [...p.members] } : null;
    if (p) for (const m of p.members) this._sendTo(m, msg);
  }
  _partyLeave(id) {
    const pid = this.partyOf.get(id);
    if (!pid) return;
    this.partyOf.delete(id);
    const p = this.parties.get(pid);
    if (!p) return;
    p.members = p.members.filter((m) => m !== id);
    this._sendTo(id, { t: "party_state", party: null, leader: null, members: [] });
    if (p.members.length <= 1) {
      for (const m of p.members) {
        this.partyOf.delete(m);
        this._sendTo(m, { t: "party_state", party: null, leader: null, members: [] });
      }
      this.parties.delete(pid);
      return;
    }
    if (p.leader === id) p.leader = p.members[0];
    this._partyState(p);
  }

  _game(ws, meta, senderId, room, pkt, now) {
    const reply = (obj) => {
      try {
        ws.send(JSON.stringify(obj));
      } catch {}
    };
    const to = ID_RE.test(pkt.to || "") ? pkt.to : "";
    if (pkt.t === "bell") {
      // one score per player per bell; only for a real-looking bell time within the last 10 minutes
      const m = BELL_EV_RE.exec(typeof pkt.ev === "string" ? pkt.ev : "");
      if (!m) return;
      const at = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]) - 8 * 3600 * 1000; // Asia/Taipei (UTC+8, no DST)
      if (+m[4] > 23 || +m[5] > 59 || now - at < 0 || now - at > BELL_WINDOW_MS) return reply({ t: "bell_ack", ev: pkt.ev, ok: false, reason: "closed" });
      const s = Number.isInteger(pkt.s) && pkt.s >= 0 && pkt.s <= BELL_MAX_Q ? pkt.s : null;
      const ms = Number.isInteger(pkt.ms) && pkt.ms >= 0 && pkt.ms <= BELL_WINDOW_MS ? pkt.ms : null;
      if (s == null || ms == null) return;
      for (const [ev, b] of this.boards) if ([...b.values()].every((e) => now - e.at > BELL_WINDOW_MS * 2)) this.boards.delete(ev);
      if (!this.boards.has(pkt.ev)) this.boards.set(pkt.ev, new Map());
      const board = this.boards.get(pkt.ev);
      if (board.has(senderId)) return reply({ t: "bell_ack", ev: pkt.ev, ok: false, reason: "done" });
      if (board.size >= MAX_ROOM_SIZE) return;
      board.set(senderId, { id: senderId, name: this._nameOf(meta), s, ms, at: now });
      const top = [...board.values()]
        .sort((a, b) => b.s - a.s || a.ms - b.ms)
        .slice(0, BELL_TOP)
        .map(({ id, name, s, ms }) => ({ id, name, s, ms }));
      reply({ t: "bell_ack", ev: pkt.ev, ok: true });
      this._broadcast({ t: "board", ev: pkt.ev, top, n: board.size });
      return;
    }
    if (pkt.t === "duel") {
      // relayed only to one online player in this room; never stored
      if (!DUEL_OPS.has(pkt.op) || !to || to === senderId) return;
      const pairKey = senderId + ">" + to;
      const hist = (this.duelPairs.get(pairKey) || []).filter((ts) => now - ts < DUEL_PAIR_WINDOW_MS);
      if (hist.length >= DUEL_PAIR_MAX) return reply({ t: "duel_ack", to, ok: false, reason: "rate" });
      if (!this._socketOf(to, ws)) return reply({ t: "duel_ack", to, ok: false, reason: "offline" });
      hist.push(now);
      this.duelPairs.set(pairKey, hist);
      if (this.duelPairs.size > 2000) for (const [k, v] of this.duelPairs) if (!v.length || now - v[v.length - 1] >= DUEL_PAIR_WINDOW_MS) this.duelPairs.delete(k);
      const out = { t: "duel", op: pkt.op, id: senderId, room, name: this._nameOf(meta) };
      if (pkt.op === "invite" || pkt.op === "accept") {
        if (!Number.isInteger(pkt.seed) || pkt.seed < 0 || pkt.seed > 2147483647) return;
        out.seed = pkt.seed;
      }
      if (pkt.op === "result") {
        if (!Number.isInteger(pkt.s) || pkt.s < 0 || pkt.s > BELL_MAX_Q || !Number.isInteger(pkt.ms) || pkt.ms < 0 || pkt.ms > 600_000) return;
        out.s = pkt.s;
        out.ms = pkt.ms;
      }
      this._sendTo(to, out);
      return reply({ t: "duel_ack", to, ok: true, op: pkt.op });
    }
    if (pkt.t === "party") {
      if (!PARTY_OPS.has(pkt.op)) return;
      for (const [k, exp] of this.partyInvites) if (exp < now) this.partyInvites.delete(k);
      if (pkt.op === "leave") return this._partyLeave(senderId);
      if (!to || to === senderId) return;
      const myPid = this.partyOf.get(senderId);
      const myParty = myPid ? this.parties.get(myPid) : null;
      if (pkt.op === "invite") {
        if (myParty && myParty.leader !== senderId) return reply({ t: "party_ack", to, ok: false, reason: "notleader" });
        if (myParty && myParty.members.length >= PARTY_MAX) return reply({ t: "party_ack", to, ok: false, reason: "full" });
        if (this.partyOf.has(to)) return reply({ t: "party_ack", to, ok: false, reason: "busy" });
        if (!this._socketOf(to, ws)) return reply({ t: "party_ack", to, ok: false, reason: "offline" });
        this.partyInvites.set(senderId + ">" + to, now + PARTY_INVITE_TTL_MS);
        this._sendTo(to, { t: "party", op: "invite", id: senderId, room, name: this._nameOf(meta) });
        return reply({ t: "party_ack", to, ok: true, op: "invite" });
      }
      if (pkt.op === "accept") {
        // `to` is the inviter; the invite must exist and still be fresh
        const key = to + ">" + senderId;
        if (!(this.partyInvites.get(key) > now) || this.partyOf.has(senderId)) return reply({ t: "party_ack", to, ok: false, reason: "expired" });
        this.partyInvites.delete(key);
        if (!this._socketOf(to, ws)) return reply({ t: "party_ack", to, ok: false, reason: "offline" });
        let pid = this.partyOf.get(to),
          p = pid ? this.parties.get(pid) : null;
        if (!p) {
          pid = "pt_" + crypto.randomUUID().replace(/-/g, "").slice(0, 10);
          p = { id: pid, leader: to, members: [to] };
          this.parties.set(pid, p);
          this.partyOf.set(to, pid);
        }
        if (p.members.length >= PARTY_MAX) return reply({ t: "party_ack", to, ok: false, reason: "full" });
        p.members.push(senderId);
        this.partyOf.set(senderId, pid);
        this._partyState(p);
        return;
      }
      if (pkt.op === "kick") {
        if (!myParty || myParty.leader !== senderId || !myParty.members.includes(to)) return reply({ t: "party_ack", to, ok: false, reason: "notleader" });
        return this._partyLeave(to);
      }
      return;
    }
    if (pkt.t === "report") {
      // distinct reporters within 10 minutes; at the threshold the target's chat / dm / emote are dropped for 30 minutes
      if (!to || to === senderId || !REPORT_REASONS.has(pkt.reason)) return;
      const list = this.reports.get(to) || new Map();
      for (const [r, ts] of list) if (now - ts >= REPORT_WINDOW_MS) list.delete(r);
      list.set(senderId, now);
      this.reports.set(to, list);
      if (this.reports.size > 2000) for (const [k, v] of this.reports) if (![...v.values()].some((ts) => now - ts < REPORT_WINDOW_MS)) this.reports.delete(k);
      if (list.size >= REPORT_THRESHOLD && !((this.muted.get(to) || 0) > now)) {
        this.muted.set(to, now + MUTE_MS);
        list.clear();
      }
      return reply({ t: "report_ack", to, ok: true });
    }
  }

  async _cleanupSocket(ws) {
    let meta = null;
    try {
      meta = ws.deserializeAttachment();
    } catch {}
    const deadId = meta?.id;
    if (!deadId) return;

    // 確認沒有同 ID 的新連線仍在線才處理離線
    for (const other of this.ctx.getWebSockets()) {
      if (other === ws) continue;
      try {
        const om = other.deserializeAttachment();
        if (om?.id === deadId) return;
      } catch {}
    }

    this.peers.delete(deadId);
    this.rateMap.delete(deadId);
    this.dmRate.delete(deadId);
    this.miscRate.delete(deadId);
    this.noticeAt.delete(deadId);
    this._partyLeave(deadId);
    const room = meta?.room || "lobby";

    // 非主動離開（關閉分頁、斷網）：保留離線角色，其他人看到「（離線）」而不是消失
    const stayedLongEnough = typeof meta.since !== "number" || Date.now() - meta.since >= MIN_GHOST_SESSION_MS;
    if (!meta.left && meta.snap && stayedLongEnough) {
      const ghosts = await this._ghostMap();
      const g = {
        id: deadId,
        kh: meta.kh,
        at: Date.now(),
        snap: { ...meta.snap, id: deadId, room, moving: false, sprint: false, jumpY: 0, emote: null },
      };
      ghosts.set(deadId, g);
      try {
        await this.ctx.storage.put("g:" + deadId, g);
      } catch {}
      // 超過上限：最早離線者先移除
      while (ghosts.size > MAX_GHOSTS) {
        let oldest = null;
        for (const x of ghosts.values()) if (!oldest || x.at < oldest.at) oldest = x;
        await this._dropGhost(oldest.id);
        this._broadcast({ t: "bye", id: oldest.id, room }, ws);
      }
      await this._scheduleAlarm();
      if (ghosts.has(deadId)) {
        this._broadcast({ ...g.snap, t: "away", at: g.at }, ws);
        return;
      }
    }
    this._broadcast({ t: "bye", id: deadId, room }, ws);
  }

  async webSocketClose(ws, code, reason) {
    await this._cleanupSocket(ws);
    try {
      ws.close(code || 1000, reason || "Closed");
    } catch {}
  }

  async webSocketError(ws) {
    await this._cleanupSocket(ws);
    try {
      ws.close(1011, "WebSocket error");
    } catch {}
  }
}

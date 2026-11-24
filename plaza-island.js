// 旅伴交誼島（2026-11-15）：一座空曠的大廣場島，讓大家聊天、發公告，人物站在上面不會被建築或樹木擋住。
// - 不屬於 20 座系所島，不開系所卡片；島上顯示的系所內容只取自 official-data.js（系上活動、實習公告）與鐘聲時刻表。
// - 自動找群島外圍最空曠、離校園最近的一片海面，以木棧橋接回最近的校園島（步道給 heart-me 路網）。
// - 中央完全平坦（只有地面羅盤圖案）；有高度的地標都在北側邊緣（預設鏡頭從南往北看，它們在人物後方）。
import { createBaker, linkRoute, APO } from "./walk-links.js?v=20261114-01";
import { OFFICIAL } from "./official-data.js?v=20261115-01";

const PR = 2.6; // plaza hex circumradius (pointy-top like the campus islands)
const ARCH = 0.08,
  DECK = 0.04;
const segDist = (px, pz, a, b) => {
  const vx = b.x - a.x,
    vz = b.z - a.z,
    l2 = vx * vx + vz * vz || 1e-9;
  const t = Math.max(0, Math.min(1, ((px - a.x) * vx + (pz - a.z) * vz) / l2));
  return Math.hypot(px - (a.x + vx * t), pz - (a.z + vz * t));
};

// choose the site: open water (no island, islet, harbour island, shore or marina nearby), as close to the campus as
// possible, with a clear straight boardwalk to a campus island
export function planPlazaIsland({ centers, islandR, campusIds, solids = [], heightAt = null, waterY = -0.18, radius = PR, minRad = 8, maxRad = 22, maxLink = 6, dryPad = 0.6 }) {
  const PR_ = radius;
  let cx = 0,
    cz = 0;
  for (const id of campusIds) (cx += centers.get(id).x), (cz += centers.get(id).z);
  cx /= campusIds.length;
  cz /= campusIds.length;
  const dry = (x, z) => heightAt && heightAt(x, z) > waterY - 0.08;
  let best = null;
  for (let rad = minRad; rad <= maxRad && !best; rad += 0.75)
    for (let a = 0; a < Math.PI * 2; a += Math.PI / 18) {
      const x = cx + Math.cos(a) * rad,
        z = cz + Math.sin(a) * rad;
      let ok = true;
      for (const id of campusIds) if (Math.hypot(x - centers.get(id).x, z - centers.get(id).z) < islandR(id) + PR_ + 1.0) ok = false;
      for (const s of solids) if (Math.hypot(x - s.x, z - s.z) < (s.r || 1) + PR_ + 0.8) ok = false;
      if (ok) for (let k = 0; k < 12 && ok; k++) if (dry(x + Math.cos(k / 2) * (PR_ + dryPad), z + Math.sin(k / 2) * (PR_ + dryPad))) ok = false;
      if (ok && dry(x, z)) ok = false;
      if (!ok) continue;
      // nearest campus island with a clear boardwalk
      let link = null;
      for (const id of campusIds) {
        const c = centers.get(id);
        const d = Math.hypot(x - c.x, z - c.z);
        const ux = (x - c.x) / d,
          uz = (z - c.z) / d;
        const pa = { x: c.x + ux * (islandR(id) - 0.22) * APO, z: c.z + uz * (islandR(id) - 0.22) * APO };
        const pb = { x: x - ux * (PR_ * APO - 0.15), z: z - uz * (PR_ * APO - 0.15) };
        const len = Math.hypot(pb.x - pa.x, pb.z - pa.z);
        if (len > maxLink || len < 0.5) continue;
        let clear = true;
        for (const o of campusIds) if (o !== id && segDist(centers.get(o).x, centers.get(o).z, pa, pb) < islandR(o) + 0.25) clear = false;
        for (const s of solids) if (segDist(s.x, s.z, pa, pb) < (s.r || 1) + 0.3) clear = false;
        for (let t = 0.1; t < 0.95 && clear; t += 0.1) if (dry(pa.x + (pb.x - pa.x) * t, pa.z + (pb.z - pa.z) * t)) clear = false;
        if (clear && (!link || len < link.len)) link = { id, pa, pb, len, ux, uz };
      }
      if (!link) continue;
      const score = rad + link.len * 1.5;
      if (!best || score < best.score) best = { x, z, link, score };
    }
  return best ? { x: best.x, z: best.z, r: PR_, link: best.link } : null;
}

export function buildPlazaIsland(THREE, plan, { scene, top: G, english = false, CSS2DObject, frameHooks, camera, nextBell = null }) {
  const tr = (zh, en) => (english ? en : zh);
  const group = new THREE.Group();
  group.name = "plaza-island";
  const K = createBaker(THREE, ["solid", "glow"]);
  const { x: X, z: Z, link } = plan;
  const STONE = 0xe9e2d2,
    STONE_D = 0xcfc4ad,
    WALL = 0x1f3d35,
    BRASS = 0xc8a052,
    WOOD = 0xb48560,
    WOOD_D = 0x9a7050,
    POST = 0x7a5d44;

  // ---- island body: seawall to the water, flat plaza deck, brass rim ----
  K.add("solid", K.G.hex, STONE_D, X, (G - 0.9) / 2 - 0.05, Z, PR * 2, G + 0.9, PR * 2);
  K.add("solid", K.G.hex, STONE, X, G - 0.02, Z, PR * 2 - 0.06, 0.04, PR * 2 - 0.06);
  K.add("solid", K.G.hex, BRASS, X, G - 0.035, Z, PR * 2 + 0.04, 0.02, PR * 2 + 0.04);
  // flat compass rose on the floor: rings and points, all at floor height (nothing to stand behind)
  for (const [r, c] of [
    [1.25, 0xd8ccb2],
    [1.18, STONE],
    [0.62, 0x2f5f52],
    [0.56, STONE],
    [0.18, BRASS],
  ])
    K.add("solid", K.G.cyl, c, X, G + 0.002 + (1.25 - r) * 0.001, Z, r * 2, 0.004, r * 2);
  for (let k = 0; k < 8; k++) {
    const a = (k * Math.PI) / 4,
      long = k % 2 === 0;
    const L = long ? 1.15 : 0.7;
    K.add("solid", K.G.box, long ? 0x2f5f52 : BRASS, X + Math.sin(a) * L * 0.5, G + 0.004, Z + Math.cos(a) * L * 0.5, 0.06, 0.003, L, 0, a, 0);
  }

  // ---- north edge (−z): notice wall, low stage and two flagpoles; everything tall stays here ----
  const NZ = Z - PR * APO * 0.82;
  K.block("solid", WALL, X, G, NZ - 0.12, 1.9, 0.86, 0.08);
  K.block("solid", BRASS, X, G + 0.86, NZ - 0.12, 1.98, 0.05, 0.1);
  for (const sx of [-1, 1]) K.block("solid", BRASS, X + sx * 0.97, G, NZ - 0.12, 0.05, 0.9, 0.1);
  K.block("solid", STONE_D, X, G, NZ + 0.32, 1.5, 0.05, 0.55); // stage (5 cm)
  K.block("solid", BRASS, X, G + 0.05, NZ + 0.58, 1.5, 0.006, 0.02);
  for (const sx of [-1, 1]) {
    const fx = X + sx * 1.35;
    K.beam("solid", 0xd9dde0, [fx, G, NZ], [fx, G + 1.2, NZ], 0.012);
    K.block("solid", sx < 0 ? 0x1f3550 : 0x2f5f52, fx + 0.12, G + 0.95, NZ, 0.24, 0.16, 0.01);
  }
  // ---- low perimeter furniture on the other edges: benches, lamps, planters (all under knee height) ----
  for (let k = 0; k < 12; k++) {
    const a = (k / 12) * Math.PI * 2 + Math.PI / 12;
    const px = X + Math.sin(a) * PR * APO * 0.88,
      pz = Z + Math.cos(a) * PR * APO * 0.88;
    if (pz < Z - PR * APO * 0.55) continue; // keep the north edge for the wall
    if (k % 3 === 0) {
      K.beam("solid", 0x3d4a52, [px, G, pz], [px, G + 0.32, pz], 0.01);
      K.add("glow", K.G.sphere, 0xffe7b0, px, G + 0.33, pz, 0.05, 0.05, 0.05);
    } else if (k % 3 === 1) {
      K.block("solid", WOOD, px, G + 0.06, pz, 0.32, 0.025, 0.1, a);
      for (const sd of [-1, 1]) K.block("solid", POST, px + Math.cos(a) * sd * 0.12, G, pz - Math.sin(a) * sd * 0.12, 0.02, 0.06, 0.08, a);
    } else {
      K.block("solid", STONE_D, px, G, pz, 0.26, 0.1, 0.26, a);
      K.add("solid", K.G.sphere, 0x5f9466, px, G + 0.13, pz, 0.24, 0.1, 0.24);
    }
  }

  // ---- boardwalk to the campus ----
  const { pa, pb, ux, uz } = link;
  const len = Math.hypot(pb.x - pa.x, pb.z - pa.z);
  const yaw = Math.atan2(ux, uz);
  const n = Math.max(6, Math.round(len / 0.18));
  const at = (t, off = 0, dy = 0) => [pa.x + (pb.x - pa.x) * t + uz * off, G + 0.02 + Math.sin(t * Math.PI) * ARCH + dy, pa.z + (pb.z - pa.z) * t - ux * off];
  for (let s = 0; s < n; s++) {
    const a = at(s / n),
      b = at((s + 1) / n);
    const pitch = Math.atan2(b[1] - a[1], len / n);
    K.add("solid", K.G.box, s % 2 ? WOOD : WOOD_D, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2, 0.5, 0.035, len / n - 0.012, -pitch, yaw, 0);
  }
  for (const sd of [-1, 1]) {
    let last = null;
    for (let s = 0; s <= n; s += 2) {
      const p0 = at(s / n, sd * 0.23),
        p1 = at(s / n, sd * 0.23, 0.15);
      K.beam("solid", POST, p0, p1, 0.01);
      if (last) K.beam("solid", BRASS, last, p1, 0.005);
      last = p1;
      if (s % 6 === 0) K.beam("solid", POST, [p0[0], -0.5, p0[2]], [p0[0], p0[1] - 0.02, p0[2]], 0.022);
    }
  }

  const mats = {
    solid: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.78, metalness: 0.03 }),
    glow: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.3, emissive: 0xffffff, emissiveIntensity: 0 }),
  };
  mats.glow.customProgramCacheKey = () => "plaza-glow-v1";
  mats.glow.onBeforeCompile = (sh) => {
    sh.fragmentShader = sh.fragmentShader.replace("#include <emissivemap_fragment>", "#include <emissivemap_fragment>\n  totalEmissiveRadiance *= vColor.rgb;");
  };
  for (const m of Object.values(mats)) m.userData.noPalette = true;
  const meshes = K.finish(group, mats);
  for (const m of meshes) m.receiveShadow = true;
  scene.add(group);

  // ---- name plaque and the notice board (HTML laid over the wall) ----
  const plaque = document.createElement("span");
  plaque.className = "island-label plaza-island-label";
  plaque.textContent = tr("旅伴交誼島", "Plaza Island");
  const plaqueObj = new CSS2DObject(plaque);
  plaqueObj.position.set(X, G - 0.25, Z + PR * APO + 0.05);
  scene.add(plaqueObj);

  const board = document.createElement("div");
  board.className = "plaza-board";
  board.hidden = true;
  board.innerHTML = "";
  const boardObj = new CSS2DObject(board);
  boardObj.position.set(X, G + 0.48, NZ - 0.07);
  scene.add(boardObj);
  const official = [
    ...(OFFICIAL.activities || []).map((a) => ({ kind: tr("系上活動", "Activity"), text: String(a.title || "") })),
    ...(OFFICIAL.internshipNotices?.items || []).slice(0, 6).map((t) => ({ kind: tr("實習公告", "Internship"), text: String(t).replace(/👉.*$/u, "").trim() })),
  ].filter((x) => x.text);
  const playerNotices = []; // { name, code, at }
  const NOTICE_TEXT = {
    party: tr("找人組隊導覽", "Looking for a tour party"),
    duel: tr("來問答對戰", "Up for a quiz duel"),
    photo: tr("集合合照", "Group photo time"),
    bell: tr("鐘聲挑戰集合", "Meet for the bell challenge"),
    plaza: tr("來交誼島聊天", "Come chat on the plaza island"),
    help: tr("需要導覽協助", "Could use a guide"),
  };
  let idx = 0,
    lastRotate = 0;
  const el = (tag, cls, text) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  };
  function renderBoard() {
    const head = el("div", "pb-head");
    head.append(el("b", "", tr("旅伴交誼島公告牆", "Plaza notice board")));
    const nb = nextBell?.();
    if (nb) {
      const hm = `${String(Math.floor(nb.min / 60)).padStart(2, "0")}:${String(nb.min % 60).padStart(2, "0")}`;
      head.append(el("small", "", tr(`下一次鐘響 ${nb.today ? "今天" : ""} ${hm}（第 ${nb.period} 節${nb.kind === "start" ? "上課" : "下課"}）`, `Next bell ${hm} (period ${nb.period})`)));
    }
    const off = el("div", "pb-official");
    if (official.length) {
      const it = official[idx % official.length];
      off.append(el("span", "pb-kind", it.kind), el("span", "pb-text", it.text));
    }
    const list = el("ul", "pb-notices");
    const now = Date.now();
    for (const n of playerNotices.filter((p) => now - p.at < 3 * 60 * 1000).slice(-5).reverse()) list.append(el("li", "", `${n.name}：${NOTICE_TEXT[n.code] || ""}`));
    if (!list.children.length) list.append(el("li", "pb-empty", tr("還沒有廣場公告，用「發公告」找夥伴吧！", "No notices yet — post one to find company!")));
    const post = el("button", "pb-post", tr("發公告", "Post a notice"));
    post.type = "button";
    post.onclick = () => window.htlSocial?.games?.openNoticeMenu?.();
    post.hidden = !window.htlSocial?.games?.caps?.has?.("notice");
    board.replaceChildren(head, off, list, post);
  }
  addEventListener("htl:plaza-notice", (e) => {
    const d = e.detail || {};
    if (!NOTICE_TEXT[d.code]) return;
    playerNotices.push({ name: String(d.name || "").slice(0, 16), code: d.code, at: Date.now() });
    if (playerNotices.length > 20) playerNotices.shift();
    renderBoard();
  });

  // ---- NPCs: announcer at the wall, concierge at the boardwalk ----
  const npcs = [];
  let npcReady = false;
  const bubble = el("span", "bell-bubble plaza-say", "");
  const bubbleObj = new CSS2DObject(bubble);
  bubbleObj.visible = false;
  scene.add(bubbleObj);
  function makeHosts() {
    const av = window.heartIslandAvatar;
    if (!av?.buildFigure) return false;
    const spots = [
      { kind: "announcer", x: X - 0.55, z: NZ + 0.32, y: G + 0.05, look: { role: "staff", outfit: "nkuht-polo" } },
      { kind: "concierge", x: pb.x + ux * 0.45 + uz * 0.35, z: pb.z + uz * 0.45 - ux * 0.35, y: G, look: { role: "staff" } },
    ];
    for (const s of spots) {
      const fig = av.buildFigure({ ...(av.DEFAULT_LOOK || {}), ...s.look, name: "" });
      av.applyFigScale(fig);
      if (fig.ring) fig.ring.visible = false;
      if (fig.pin) fig.pin.visible = false;
      fig.group.position.set(s.x, s.y, s.z);
      fig.group.rotation.y = s.kind === "announcer" ? 0 : Math.atan2(-ux, -uz);
      fig.group.traverse((m) => {
        m.castShadow = false;
        m.userData.plazaHost = s.kind;
      });
      scene.add(fig.group);
      npcs.push({ ...s, fig });
    }
    return true;
  }
  // a click on a host opens its dialogue (official answers only)
  const ray = new THREE.Raycaster(),
    ndc = new THREE.Vector2();
  addEventListener(
    "pointerup",
    (e) => {
      if (!npcs.length || e.target?.tagName !== "CANVAS") return;
      const r = e.target.getBoundingClientRect();
      ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      ray.setFromCamera(ndc, camera);
      const hit = ray.intersectObjects(
        npcs.map((n) => n.fig.group),
        true,
      )[0];
      const kind = hit?.object?.userData?.plazaHost;
      if (!kind) return;
      const n = npcs.find((q) => q.kind === kind);
      window.htlSocial?.openHostDialogue?.({ kind, x: n.x, z: n.z });
    },
    true,
  );

  // ---- per frame: board rotation, announcer lines, "on the plaza island" state ----
  const inside = (x, z) => {
    const dx = Math.abs(x - X),
      dz = Math.abs(z - Z);
    return dz <= PR && dx <= PR * APO && dx * 0.5 + dz * APO <= PR * APO; // pointy-top hex
  };
  let onIsland = false,
    lastSay = 0;
  frameHooks.add((now) => {
    if (!npcReady) npcReady = makeHosts();
    const g = window.heartIslandAvatar?.S?.fig?.group;
    const here = !!(g && window.heartIslandAvatar?.S?.drive && inside(g.position.x, g.position.z));
    const near = camera.position.distanceTo(new THREE.Vector3(X, G, Z)) < 16;
    if (here !== onIsland) {
      onIsland = here;
      document.body.classList.toggle("on-plaza-island", here);
    }
    board.hidden = !near;
    if (near && now - lastRotate > 8000) {
      lastRotate = now;
      idx++;
      renderBoard();
    }
    const ann = npcs.find((n) => n.kind === "announcer");
    if (ann && near && official.length && now - lastSay > 20000) {
      lastSay = now;
      const it = official[idx % official.length];
      bubble.textContent = `${it.kind}：${it.text.length > 26 ? it.text.slice(0, 25) + "…" : it.text}`;
      bubbleObj.position.set(ann.x, G + 0.75, ann.z);
      bubbleObj.visible = true;
      bubbleObj.userData.until = now + 6000;
    }
    if (bubbleObj.visible && now > bubbleObj.userData.until) bubbleObj.visible = false;
    for (const n of npcs) if (((now / 500) | 0) % 4 === 0) window.heartIslandAvatar?.applyFigScale?.(n.fig);
    return false;
  });

  const id = "plaza-island";
  const nav = {
    islands: [{ id, x: X, z: Z, r: PR, name: tr("旅伴交誼島", "Plaza Island") }],
    bridges: [{ a: link.id, b: id, pa: { x: pa.x, y: G, z: pa.z }, pb: { x: pb.x, y: G, z: pb.z }, arch: ARCH, deck: DECK }],
    obstacles: [],
  };
  return {
    group,
    nav,
    center: { x: X, z: Z },
    r: PR,
    setNight(v) {
      mats.glow.emissiveIntensity = 0.06 + v * 2.4;
    },
    routes(existing, campus) {
      const r = linkRoute(existing, campus, { parent: link.id, pa, pb, bridgeAt: (t) => at(t), landing: { x: X, z: Z } }, G, DECK - 0.02);
      return r ? [r] : [];
    },
  };
}

// 高雄港灣區（城市地景）：群島北側五座可步行的港灣島（85大樓的島較小），各以橋接回校園島嶼；駁二與港埠旅運中心之間
// 另有會旋轉的大港橋（造景，不列入步道）。夜間或按「節慶燈光」時，地標打上粉紅、紫、藍燈光（只是燈色，不代表任何活動）。
//
// 資料規則例外（見 CLAUDE.md「城市地景例外」）：這裡只允許地標「名稱」與「外型」，不得寫入年份、樓高、
// 樓層數、面積、歷史、營運等任何事實；浮動牌與互動面板只顯示名稱與「高雄城市地景」，不開系所介紹卡、不給 XP。
// scripts/sync.py --verify 會讀取下方 SKYLINE-DATA 區塊並檢查只含允許的欄位。
//
// 結構：
//   planSkyline(centers)          → 每座地標的位置、母島、橋頭（decor.js 用來避開小島擺設）
//   buildKaohsiungSkyline(...)    → 建模（依材質合併成少數 Mesh）、浮動牌、互動面板、角色導覽資料（島、橋、障礙物、步道）
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { linkRoute } from "./walk-links.js?v=20261114-01";

/* SKYLINE-DATA */
const SKYLINE = [
  { "id": "kh-pier2", "icon": "🧱", "name": { "zh": "駁二藝術特區", "en": "The Pier-2 Art Center" } },
  { "id": "kh-exhibition", "icon": "🌊", "name": { "zh": "高雄展覽館", "en": "Kaohsiung Exhibition Center" } },
  { "id": "kh-music", "icon": "🎵", "name": { "zh": "高雄流行音樂中心（海洋文化及流行音樂中心）", "en": "Kaohsiung Music Center" } },
  { "id": "kh-85", "icon": "🏙️", "name": { "zh": "85大樓", "en": "85 Sky Tower" } },
  { "id": "kh-cruise", "icon": "🛳️", "name": { "zh": "高雄港埠旅運中心", "en": "Kaohsiung Port Cruise Terminal" } },
  { "id": "kh-bridge", "icon": "🌉", "name": { "zh": "大港橋", "en": "Great Harbor Bridge" } }
];
/* END-SKYLINE-DATA */

const WATER_Y = -0.18;
export const KH_R = 3.1; // 港灣島外接半徑（尖頂六角，與校園島同方位）
const APO = 0.8660254;
// 母島＋方向（度，x = cos、z = sin；240° 為西北、300° 為東北）＋中心距離；方向都對準母島的平邊，橋垂直於岸
const PLACES = {
  "kh-pier2": { parent: "ai", dir: 240, dist: 6.4, bridge: "glass" },
  // 旅運中心與駁二、母島 ai 排成正三角形：兩座港灣島相對的平邊正好平行，中間的水道由會旋轉的大港橋跨過
  "kh-cruise": { parent: "ai", dir: 180, dist: 6.4, bridge: "harbor", r: 2.3 },
  "kh-exhibition": { parent: "innovation", dir: 300, dist: 6.4, bridge: "glass" },
  "kh-music": { parent: "luxury", dir: 300, dist: 6.4, bridge: "wave" },
  "kh-85": { parent: "trails", dir: 300, dist: 7.7, bridge: "glass", r: 1.8 },
};
const PARENT_RING_APO = (2.02 - 0.22) * APO; // world.js 的橋頭位置（步道環的內切距離）

export function planSkyline(centers) {
  const out = [];
  for (const s of SKYLINE) {
    const P = PLACES[s.id];
    if (!P) continue;
    const c = centers.get(P.parent);
    if (!c) continue;
    const a = (P.dir * Math.PI) / 180,
      ux = Math.cos(a),
      uz = Math.sin(a);
    const x = c.x + ux * P.dist,
      z = c.z + uz * P.dist;
    const pa = { x: c.x + ux * PARENT_RING_APO, z: c.z + uz * PARENT_RING_APO };
    const r = P.r || KH_R;
    const pb = { x: x - ux * (r - 0.25) * APO, z: z - uz * (r - 0.25) * APO };
    out.push({ id: s.id, x, z, r, walk: true, parent: P.parent, pa, pb, ux, uz, yaw: Math.atan2(c.x - x, c.z - z), bridge: P.bridge, reserve: r + (s.id === "kh-cruise" ? 2.4 : 1.7) });
  }
  return out;
}

export function buildKaohsiungSkyline(THREE, opts) {
  const { scene, centers, top: G, quality = "high", english = false, reduced, CSS2DObject, camera, controls, actions = {} } = opts;
  const txt = (v) => (english ? v.en || v.zh : v.zh);
  const CITY = english ? "Kaohsiung cityscape" : "高雄城市地景";
  const low = quality === "low";
  const group = new THREE.Group();
  group.name = "kaohsiung-skyline";
  const pinGroup = new THREE.Group();
  const entries = new Map();
  const nav = { islands: [], bridges: [], obstacles: [] };

  // ---------- geometry builder: every part is baked into one of a few merged buckets ----------
  let buckets = { solid: [], roof: [], glass: [], darkglass: [], paint: [], steel: [], glow: [], show: [], brick: [], pave: [], fest: [] };
  const _m = new THREE.Matrix4(),
    _q = new THREE.Quaternion(),
    _s = new THREE.Vector3(),
    _p = new THREE.Vector3(),
    _e = new THREE.Euler(),
    _c = new THREE.Color(),
    _up = new THREE.Vector3(0, 1, 0);
  let frame = new THREE.Matrix4();
  let frameYaw = 0;
  const G_ = {
    box: new THREE.BoxGeometry(1, 1, 1),
    cyl: new THREE.CylinderGeometry(0.5, 0.5, 1, low ? 10 : 24),
    hex: new THREE.CylinderGeometry(0.5, 0.5, 1, 6),
    hexTile: new THREE.CircleGeometry(0.5, 6),
    sphere: new THREE.SphereGeometry(0.5, low ? 8 : 18, low ? 6 : 12),
    leaf: new THREE.ConeGeometry(0.5, 1, 5),
  };
  function bake(bucket, g, color) {
    g = g.index ? g.toNonIndexed() : g;
    g.applyMatrix4(frame);
    for (const k of Object.keys(g.attributes)) if (k !== "position" && k !== "normal") g.deleteAttribute(k);
    const pos = g.attributes.position,
      nrm = g.attributes.normal,
      n = pos.count,
      col = new Float32Array(n * 3);
    _c.set(color);
    for (let i = 0; i < n; i++) col.set([_c.r, _c.g, _c.b], i * 3);
    g.setAttribute("color", new THREE.BufferAttribute(col, 3));
    if (bucket === "brick" || bucket === "pave") {
      // world-projected UVs: brick courses / paving joints keep one size on every face
      const k = bucket === "brick" ? 3 : 1.6;
      const uv = new Float32Array(n * 2);
      for (let i = 0; i < n; i++) {
        const x = pos.getX(i),
          y = pos.getY(i),
          z = pos.getZ(i);
        if (Math.abs(nrm.getY(i)) > 0.6) uv.set([x * k, z * k], i * 2);
        else uv.set([(Math.abs(nrm.getX(i)) > Math.abs(nrm.getZ(i)) ? z : x) * k, y * k], i * 2);
      }
      g.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
    }
    buckets[bucket].push(g);
  }
  function add(bucket, geo, color, x, y, z, sx = 1, sy = 1, sz = 1, rx = 0, ry = 0, rz = 0) {
    const g = geo.clone();
    _m.compose(_p.set(x, y, z), _q.setFromEuler(_e.set(rx, ry, rz)), _s.set(sx, sy, sz));
    g.applyMatrix4(_m);
    bake(bucket, g, color);
  }
  // a box whose bottom sits at y (easier to stack)
  const block = (b, c, x, y, z, w, h, d, ry = 0) => add(b, G_.box, c, x, y + h / 2, z, w, h, d, 0, ry, 0);
  function beam(bucket, color, a, b, r, geo = G_.cyl) {
    const A = new THREE.Vector3(...a),
      B = new THREE.Vector3(...b);
    const len = A.distanceTo(B);
    if (len < 1e-4) return;
    const g = geo.clone();
    _q.setFromUnitVectors(_up, B.clone().sub(A).normalize());
    _m.compose(A.add(B).multiplyScalar(0.5), _q, _s.set(r * 2, len, r * 2));
    g.applyMatrix4(_m);
    bake(bucket, g, color);
  }
  const custom = (bucket, g, color) => bake(bucket, g, color);
  const tube = (bucket, color, pts, r, seg = 48, radial = 5) => custom(bucket, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p))), seg, r, radial, false), color);
  function setFrame(x, z, yaw) {
    frameYaw = yaw;
    frame = new THREE.Matrix4().compose(new THREE.Vector3(x, 0, z), new THREE.Quaternion().setFromAxisAngle(_up, yaw), new THREE.Vector3(1, 1, 1));
  }
  function setLocal(fn, x, y, z, ry) {
    const saved = frame,
      savedYaw = frameYaw;
    frame = saved.clone().multiply(new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromAxisAngle(_up, ry), new THREE.Vector3(1, 1, 1)));
    frameYaw = savedYaw + ry;
    fn();
    frame = saved;
    frameYaw = savedYaw;
  }
  const toWorld = (lx, lz) => new THREE.Vector3(lx, 0, lz).applyMatrix4(frame);
  // walking obstacles in the current local frame (heart-me.js: lx = dx·cos + dz·sin, lz = −dx·sin + dz·cos)
  function obs(lx, lz, hx, hz) {
    const w = toWorld(lx, lz);
    nav.obstacles.push({ type: "obb", island: null, owner: "skyline", x: w.x, z: w.z, hx, hz, cos: Math.cos(frameYaw), sin: -Math.sin(frameYaw) });
  }
  function obsC(lx, lz, r) {
    const w = toWorld(lx, lz);
    nav.obstacles.push({ type: "circle", island: null, owner: "skyline", x: w.x, z: w.z, r });
  }

  // ---------- textures ----------
  const canvasTex = (draw, size = 128) => {
    const cv = document.createElement("canvas");
    cv.width = cv.height = size;
    draw(cv.getContext("2d"), size);
    const t = new THREE.CanvasTexture(cv);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    return t;
  };
  const brickTex = canvasTex((g) => {
    g.fillStyle = "#d9cbb8";
    g.fillRect(0, 0, 128, 128);
    for (let r = 0; r < 8; r++) {
      const off = r % 2 ? 16 : 0;
      for (let c = -1; c < 5; c++) {
        const shade = 150 + ((r * 7 + c * 13) % 5) * 9;
        g.fillStyle = `rgb(${shade + 28}, ${Math.round(shade * 0.42)}, ${Math.round(shade * 0.3)})`;
        g.fillRect(c * 32 + off + 1.5, r * 16 + 1.5, 29, 13);
      }
    }
  });
  const paveTex = canvasTex((g, S) => {
    g.fillStyle = "#cfc6b6";
    g.fillRect(0, 0, S, S);
    const cols = ["#e8e2d6", "#e1d9cb", "#ece7dd", "#ddd4c4"];
    let k = 0;
    for (let y = 0; y < S; y += 32)
      for (let x = (y / 32) % 2 ? -16 : 0; x < S; x += 32) {
        g.fillStyle = cols[k++ % 4];
        g.fillRect(x + 1.5, y + 1.5, 29, 29);
      }
    g.fillStyle = "rgba(120,110,95,0.08)";
    for (let i = 0; i < 160; i++) g.fillRect((i * 53) % S, (i * 97) % S, 2, 2);
  });

  // ---------- shared pieces ----------
  function palm(x, z, s = 1) {
    const h = 0.42 * s;
    beam("solid", 0x8a6f55, [x, G, z], [x + 0.03 * s, G + h, z], 0.018 * s);
    for (let k = 0; k < 6; k++) {
      const a = (k / 6) * Math.PI * 2;
      add("solid", G_.leaf, k % 2 ? 0x5f9a58 : 0x6fae62, x + 0.03 * s + Math.sin(a) * 0.09 * s, G + h - 0.02 * s, z + Math.cos(a) * 0.09 * s, 0.07 * s, 0.24 * s, 0.035 * s, Math.PI / 2 - 0.35, a, 0);
    }
    obsC(x, z, 0.05);
  }
  function lamp(x, z, y = G, h = 0.3) {
    beam("solid", 0x3d4a52, [x, y, z], [x, y + h, z], 0.008);
    add("glow", G_.sphere, 0xffe7b0, x, y + h + 0.01, z, 0.045, 0.045, 0.045);
  }
  function bench(x, z, ry = 0) {
    setLocal(() => {
      block("solid", 0x9c7a58, 0, G + 0.05, 0, 0.22, 0.02, 0.07);
      block("solid", 0x3d4a52, -0.09, G, 0, 0.015, 0.05, 0.06);
      block("solid", 0x3d4a52, 0.09, G, 0, 0.015, 0.05, 0.06);
    }, x, 0, z, ry);
  }

  // Harbour island: a hexagonal quay in world orientation (same pointy-top hex as the campus islands), stone revetment
  // with course lines, paved top at walking height G, railing along the rim with a gap where the bridge lands.
  function harbourIsland(p) {
    setFrame(p.x, p.z, 0);
    const R = p.r || KH_R,
      bottom = WATER_Y - 0.85;
    add("solid", G_.hex, 0x6c716f, 0, (bottom + WATER_Y + 0.06) / 2, 0, R * 2.04, WATER_Y + 0.06 - bottom, R * 2.04); // wet foot
    add("solid", G_.hex, 0xb1a998, 0, (WATER_Y + 0.06 + G - 0.05) / 2, 0, R * 2, G - 0.05 - WATER_Y - 0.06, R * 2); // revetment
    for (let y = WATER_Y + 0.16; y < G - 0.08; y += 0.15) add("solid", G_.hex, 0x8f8778, 0, y, 0, R * 2 + 0.012, 0.012, R * 2 + 0.012); // stone courses
    add("solid", G_.hex, 0xece5d6, 0, G - 0.035, 0, R * 2 + 0.05, 0.05, R * 2 + 0.05); // kerb
    add("pave", G_.hex, 0xffffff, 0, G - 0.02, 0, R * 2 - 0.16, 0.04, R * 2 - 0.16); // paving, top exactly at G
    add("solid", G_.hex, 0xe9f3f2, 0, WATER_Y + 0.004, 0, R * 2 + 0.34, 0.008, R * 2 + 0.34); // foam line
    // rim railing + lamps; open where the bridge lands
    const land = { x: p.pb.x - p.x, z: p.pb.z - p.z };
    const verts = Array.from({ length: 7 }, (_, k) => [Math.sin((k * Math.PI) / 3) * (R - 0.1), Math.cos((k * Math.PI) / 3) * (R - 0.1)]);
    let prev = null;
    for (let k = 0; k < 6; k++) {
      const [ax, az] = verts[k],
        [bx, bz] = verts[k + 1];
      const n = Math.max(4, Math.round(R * 3));
      for (let i = k ? 1 : 0; i <= n; i++) {
        const t = i / n,
          x = ax + (bx - ax) * t,
          z = az + (bz - az) * t;
        if (Math.hypot(x - land.x, z - land.z) < 0.5 || (p.gaps || []).some((g) => Math.hypot(x - (g.x - p.x), z - (g.z - p.z)) < 0.45)) {
          prev = null;
          continue;
        }
        beam("solid", 0x48535a, [x, G, z], [x, G + 0.16, z], 0.007);
        if (prev) {
          beam("solid", 0x48535a, [prev[0], G + 0.16, prev[1]], [x, G + 0.16, z], 0.006);
          beam("solid", 0x6d7980, [prev[0], G + 0.08, prev[1]], [x, G + 0.08, z], 0.004);
        }
        prev = [x, z];
      }
      lamp(ax * 0.94, az * 0.94);
    }
    for (let k = 0; k < 6; k++) {
      const a = (k * Math.PI) / 3 + Math.PI / 6;
      add("solid", G_.cyl, 0x2f3438, Math.sin(a) * (R - 0.25), G + 0.025, Math.cos(a) * (R - 0.25), 0.05, 0.05, 0.05); // bollards
    }
    nav.islands.push({ id: p.id, x: p.x, z: p.z, r: R, name: txt(SKYLINE.find((s) => s.id === p.id).name) });
  }

  // Bridge from the campus island to the harbour island. Deck height follows the same arch the walking code uses.
  const ARCH = 0.12,
    DECK = 0.055;
  function bridge(p) {
    setFrame(0, 0, 0);
    const A = new THREE.Vector3(p.pa.x, 0, p.pa.z),
      B = new THREE.Vector3(p.pb.x, 0, p.pb.z);
    const len = A.distanceTo(B),
      yaw = Math.atan2(B.x - A.x, B.z - A.z);
    const dir = B.clone().sub(A).normalize(),
      side = new THREE.Vector3(dir.z, 0, -dir.x);
    const at = (t, off = 0, dy = 0) => {
      const q = A.clone().lerp(B, t).addScaledVector(side, off);
      return [q.x, G + 0.03 + Math.sin(t * Math.PI) * ARCH + dy, q.z];
    };
    const style = p.bridge;
    const DECK_C = style === "harbor" ? 0xf2f1ec : style === "wave" ? 0xdfe8ec : 0xd9d2c4;
    const W = 0.62,
      n = 14;
    for (let s = 0; s < n; s++) {
      const a = at(s / n),
        b = at((s + 1) / n);
      const mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2];
      const pitch = Math.atan2(b[1] - a[1], len / n);
      add("solid", G_.box, s % 2 ? DECK_C : new THREE.Color(DECK_C).multiplyScalar(0.94).getHex(), mid[0], mid[1], mid[2], W, 0.05, len / n + 0.01, -pitch, yaw, 0);
      add("solid", G_.box, 0x9aa4a8, mid[0], mid[1] - 0.05, mid[2], W + 0.04, 0.05, len / n + 0.01, -pitch, yaw, 0); // fascia
    }
    for (const t of [0.33, 0.67]) {
      const [x, y, z] = at(t);
      add("solid", G_.box, 0xa39b8c, x, (WATER_Y - 0.4 + y - 0.07) / 2, z, W * 0.7, y - 0.07 - WATER_Y + 0.4, 0.16, 0, yaw, 0); // piers
    }
    const RAIL = style === "wave" ? 0x2f7fb0 : style === "glass" ? 0x8b979d : 0xf6f6f2;
    for (const sd of [-1, 1]) {
      const off = sd * (W / 2 - 0.03);
      const pts = [];
      for (let s = 0; s <= n; s++) {
        const t = s / n;
        const wave = style === "wave" ? Math.sin(t * Math.PI * 6) * 0.025 : 0;
        pts.push(at(t, off, 0.17 + wave));
        if (s % 2 === 0) beam("solid", RAIL, at(t, off, 0.02), at(t, off, 0.17 + wave), 0.008);
      }
      tube("solid", RAIL, pts, 0.01, 40, 4);
      if (style === "glass") {
        for (let s = 0; s < n; s += 2) {
          const a = at(s / n, off, 0.1),
            b = at((s + 2) / n, off, 0.1);
          add("glass", G_.box, 0xa9d4e4, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2, 0.01, 0.13, len / (n / 2) - 0.02, 0, yaw, 0);
        }
      }
      for (const t of [0.02, 0.98]) {
        const e = at(t, off * 1.15);
        lamp(e[0], e[2], G, 0.34);
      }
    }
    nav.bridges.push({ a: p.parent, b: p.id, pa: { x: A.x, y: G, z: A.z }, pb: { x: B.x, y: G, z: B.z }, arch: ARCH, deck: DECK });
    return { at, len };
  }

  // ============================================================================================
  // 高雄展覽館：臨港長向玻璃大廳，上覆白色「雙峰」波浪屋頂（正面看像兩個隆起的 m，兩端圓弧一路包到地面），
  // 屋面三角菱格、正面整片玻璃帷幕與白色直櫺、中央一根白色立柱；屋簷下藏一條節慶燈帶
  // ============================================================================================
  function buildExhibition() {
    const L = 4.5, // length (local x)
      D = 1.75, // depth (local z; +z faces the bridge / campus)
      ZC = -0.45,
      H = 1.32;
    // roof height above G: two humps (peaks near u = ±0.5), a dip in the middle, both ends curling down to the ground
    const prof = (x) => {
      const u = Math.min(1, Math.abs(x) / (L / 2));
      const env = Math.pow(Math.max(0, 1 - Math.pow(u, 2.4)), 0.42);
      return H * env * (0.8 - 0.2 * Math.cos(2 * Math.PI * u));
    };
    // front/back edges dip a little and the front overhangs; the shell keeps one thickness
    const roofY = (x, z) => {
      const v = (z - ZC) / (D / 2);
      return G + prof(x) * (1 - 0.07 * v * v) + 0.02;
    };
    const sheet = (fy, w, d, zc, segX = 120, segZ = 18) => {
      const g = new THREE.PlaneGeometry(w, d, segX, segZ);
      g.rotateX(-Math.PI / 2);
      const rp = g.attributes.position;
      for (let i = 0; i < rp.count; i++) {
        const x = rp.getX(i),
          z = rp.getZ(i) + zc;
        rp.setXYZ(i, x, fy(x, z), z);
      }
      g.computeVertexNormals();
      return g;
    };
    block("solid", 0xbfb8ab, 0, G, ZC, L - 0.1, 0.035, D - 0.25); // plinth
    custom("roof", sheet(roofY, L, D, ZC), 0xf8f8f4);
    custom("roof", sheet((x, z) => roofY(x, z) - 0.05, L - 0.04, D - 0.04, ZC, 90, 10), 0xe7e9e8); // soffit = shell thickness
    // triangular-diamond lattice on the roof: two families of diagonal ribs plus lengthwise ribs
    const zA = ZC - D / 2 + 0.04,
      zB = ZC + D / 2 - 0.04;
    for (const k of [1, -1]) {
      for (let i = -16; i <= 16; i++) {
        const pts = [];
        for (let j = 0; j <= 10; j++) {
          const z = zA + (j / 10) * (zB - zA);
          const x = i * 0.28 + k * (z - ZC) * 0.62;
          if (Math.abs(x) > L / 2 - 0.05) continue;
          pts.push([x, roofY(x, z) + 0.008, z]);
        }
        if (pts.length >= 3) tube("paint", 0xdcdfdd, pts, 0.0055, 16, 3);
      }
    }
    for (const z of [ZC - D / 4, ZC, ZC + D / 4]) {
      const pts = [];
      for (let i = 0; i <= 60; i++) {
        const x = (-L / 2 + 0.06) + (i / 60) * (L - 0.12);
        pts.push([x, roofY(x, z) + 0.009, z]);
      }
      tube("paint", 0xdcdfdd, pts, 0.005, 70, 3);
    }
    // thick white rim along the front and back edges, festival light strip tucked under the front rim
    for (const sd of [1, -1]) {
      const z = ZC + sd * (D / 2);
      const pts = [];
      for (let i = 0; i <= 80; i++) {
        const x = -L / 2 + (i / 80) * L;
        pts.push([x, roofY(x, z) - 0.015, z]);
      }
      tube("paint", 0xf4f4f0, pts, 0.032, 120, 6);
      tube("fest", 0xffffff, pts.filter((q) => q[1] > G + 0.08).map(([x, y]) => [x, y - 0.06, z - sd * 0.05]), 0.016, 110, 4);
    }
    // glass curtain walls under the roof (front and back), following the profile; white mullions
    const fz = ZC + D / 2 - 0.2,
      bz = ZC - D / 2 + 0.22;
    for (const z of [fz, bz]) {
      const sh = new THREE.Shape();
      const n = 60,
        x0 = -L / 2 + 0.18;
      sh.moveTo(x0, 0);
      for (let i = 0; i <= n; i++) {
        const x = x0 + (i / n) * (L - 0.36);
        sh.lineTo(x, Math.max(0.02, roofY(x, z) - G - 0.06));
      }
      sh.lineTo(L / 2 - 0.18, 0);
      const g = new THREE.ShapeGeometry(sh);
      g.translate(0, G, z);
      custom("glass", g, 0x9fcfe3);
      for (let i = 0; i <= 30; i++) {
        const x = x0 + (i / 30) * (L - 0.36);
        const top = roofY(x, z) - 0.05;
        if (top - G > 0.06) block("paint", 0xf3f3ef, x, G, z, 0.016, top - G, 0.02);
      }
      for (const y of [0.32, 0.64]) {
        const pts = [];
        for (let i = 0; i <= 40; i++) {
          const x = x0 + (i / 40) * (L - 0.36);
          if (roofY(x, z) - G - 0.06 > y) pts.push([x, G + y, z]);
        }
        if (pts.length > 2) beam("paint", 0xf3f3ef, pts[0], pts[pts.length - 1], 0.007);
      }
    }
    // warm interior: floor glow and a few exhibition stands seen through the glass
    block("glow", 0xffe7b8, 0, G + 0.04, ZC, L - 0.8, 0.012, D - 0.6);
    for (let i = 0; i < 6; i++) block("solid", 0x7a8790, -1.6 + i * 0.64, G + 0.035, ZC, 0.34, 0.12, 0.4);
    // central white column under the dip of the roof, flaring into it
    beam("paint", 0xf7f7f3, [0, G, fz + 0.12], [0, roofY(0, fz + 0.12) - 0.03, fz + 0.12], 0.045);
    add("paint", G_.cyl, 0xf7f7f3, 0, roofY(0, fz + 0.12) - 0.07, fz + 0.12, 0.2, 0.06, 0.2);
    obsC(0, fz + 0.12, 0.08);
    obs(0, ZC, L / 2 - 0.05, D / 2 - 0.18);
    // forecourt on the bridge side: water features, palms, benches
    for (const x of [-1.5, 1.5]) {
      block("solid", 0x8ec3d0, x, G, 1.2, 0.95, 0.012, 0.3);
      obs(x, 1.2, 0.5, 0.17);
    }
    for (const x of [-2.15, -0.75, 0.75, 2.15]) palm(x, 1.75, 0.85);
    for (const x of [-0.6, 0.6]) bench(x, 1.55, 0);
  }

  // ============================================================================================
  // 高雄流行音樂中心：音浪塔（六角格塔、懸挑頂）、海音館（錯落六角量體）、珊瑚礁群（六角單元＋白色六角格柵頂棚）、
  // 鯨魚堤岸（波浪起伏的長形量體）；夜間六角燈片跑彩色燈光秀
  // ============================================================================================
  function hexCells(x, z, r, h, base, rows, cols, faces = [0, 1, 2, 3, 4, 5], tileK = 0.6) {
    for (const f of faces) {
      const th = ((f + 0.5) / 6) * Math.PI * 2; // CylinderGeometry vertices sit at k·60°, faces between them
      const ap = r * APO + 0.004;
      for (let rI = 0; rI < rows; rI++) {
        const y = base + ((rI + 0.6) / (rows + 0.2)) * h;
        for (let cI = 0; cI < cols; cI++) {
          const t = (cI + 0.5 + (rI % 2) * 0.25) / (cols + 0.25) - 0.5;
          if (Math.abs(t) > 0.44) continue;
          const lx = Math.sin(th) * ap + Math.cos(th) * t * r,
            lz = Math.cos(th) * ap - Math.sin(th) * t * r;
          const tile = Math.min((h / rows) * tileK, (r / cols) * 0.9);
          add("show", G_.hexTile, 0xffffff, x + lx, y, z + lz, tile, tile, tile, 0, th, Math.PI / 6);
        }
      }
    }
  }
  function hexMass(x, z, r, h, y0, rows, cols, faces, color = 0xf3f4f0) {
    add("paint", G_.hex, color, x, y0 + h / 2, z, r * 2, h, r * 2);
    add("solid", G_.hex, 0xe0e4e1, x, y0 + h + 0.012, z, r * 1.92, 0.024, r * 1.92);
    hexCells(x, z, r, h, y0, rows, cols, faces);
  }
  function buildMusic() {
    block("solid", 0x86b36a, -0.2, G, 0.25, 3.6, 0.012, 1.2);
    block("solid", 0xb79a76, 0, G, 1.75, 2.6, 0.016, 0.5);
    for (let i = 0; i < 14; i++) block("solid", 0x9c7f5d, -1.3 + i * 0.2, G + 0.016, 1.75, 0.012, 0.003, 0.48);
    // 音浪塔: two white hex-lattice towers side by side (a tall one with a cantilevered lantern, a shorter one),
    // stacked hex drums turned a little at each level, triangular lattice on every face, show tiles inside
    const tower = (tx, tz, levels, r0, dr, h, lantern) => {
      let y = G;
      for (let k = 0; k < levels; k++) {
        const r = r0 + k * dr,
          y0 = y;
        setLocal(() => {
          add("paint", G_.hex, 0xf4f5f1, 0, y0 + h / 2, 0, r * 2, h - 0.02, r * 2);
          hexCells(0, 0, r, h - 0.02, y0, 1, 3);
          for (let f = 0; f < 6; f++) {
            const a0 = (f * Math.PI) / 3,
              a1 = ((f + 1) * Math.PI) / 3,
              rr = r + 0.012;
            const A = [Math.sin(a0) * rr, Math.cos(a0) * rr],
              B = [Math.sin(a1) * rr, Math.cos(a1) * rr],
              M = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2];
            beam("paint", 0xffffff, [A[0], y0, A[1]], [M[0], y0 + h, M[1]], 0.007);
            beam("paint", 0xffffff, [B[0], y0, B[1]], [M[0], y0 + h, M[1]], 0.007);
            beam("paint", 0xffffff, [A[0], y0 + h - 0.01, A[1]], [B[0], y0 + h - 0.01, B[1]], 0.006);
          }
          if (k % 2 === 1) for (let f = 0; f < 6; f++) {
            const a = (f * Math.PI) / 3;
            beam("fest", 0xffffff, [Math.sin(a) * (r + 0.016), y0 + 0.01, Math.cos(a) * (r + 0.016)], [Math.sin(a) * (r + 0.016), y0 + h - 0.01, Math.cos(a) * (r + 0.016)], 0.007);
          }
        }, tx, 0, tz, k * 0.18);
        y += h;
      }
      if (lantern) {
        const yTop = y;
        setLocal(() => {
          add("paint", G_.hex, 0xf7f7f3, 0.12, yTop + 0.18, 0, 1.15, 0.36, 1.0);
          hexCells(0.12, 0, 0.55, 0.32, yTop + 0.02, 2, 4);
          add("glow", G_.hex, 0xc9ecff, 0.12, yTop + 0.37, 0, 1.0, 0.02, 0.88);
          add("fest", G_.hex, 0xffffff, 0.12, yTop + 0.005, 0, 1.17, 0.018, 1.02);
        }, tx, 0, tz, 0.6);
      } else {
        add("paint", G_.hex, 0xf7f7f3, tx, y + 0.04, tz, (r0 + levels * dr) * 2.3, 0.08, (r0 + levels * dr) * 2.3);
        add("fest", G_.hex, 0xffffff, tx, y + 0.005, tz, (r0 + levels * dr) * 2.32, 0.016, (r0 + levels * dr) * 2.32);
      }
      obsC(tx, tz, r0 + levels * dr);
    };
    tower(-1.85, -0.45, 8, 0.3, 0.022, 0.27, true);
    tower(-1.15, -1.1, 6, 0.22, 0.02, 0.26, false);
    // 海音館: a white shell-shaped hall roofed with hexagonal panels, lifted on dark slanted columns over a glass ring
    const SX = 2.0,
      SY = 1.25,
      SZ = 1.15,
      shX = 0.35,
      shZ = -0.75,
      shY = G + 0.3;
    block("glass", 0x5f7f92, shX, G, shZ, SX * 0.82, 0.3, SZ * 0.72);
    block("glow", 0xffe6b5, shX, G + 0.12, shZ + SZ * 0.36 + 0.004, SX * 0.78, 0.05, 0.01);
    for (let k = 0; k < 14; k++) {
      const a = (k / 14) * Math.PI * 2;
      const bx = shX + Math.cos(a) * SX * 0.42,
        bz = shZ + Math.sin(a) * SZ * 0.4;
      beam("steel", 0x2f3a42, [bx, G, bz], [shX + Math.cos(a + 0.28) * SX * 0.46, shY + 0.01, shZ + Math.sin(a + 0.28) * SZ * 0.44], 0.014);
    }
    const dome = new THREE.SphereGeometry(0.5, 36, 14, 0, Math.PI * 2, 0, Math.PI / 2);
    dome.scale(SX, SY, SZ);
    dome.translate(shX, shY, shZ);
    custom("roof", dome, 0xf6f7f4);
    const ring = new THREE.TorusGeometry(0.5, 0.012, 5, 48);
    ring.rotateX(Math.PI / 2);
    ring.scale(SX, 1, SZ);
    ring.translate(shX, shY + 0.005, shZ);
    custom("fest", ring, 0xffffff);
    const nrm = new THREE.Vector3(),
      zAx = new THREE.Vector3(0, 0, 1),
      q = new THREE.Quaternion();
    for (let i = 1; i <= 6; i++) {
      const th = 0.22 + (i / 6) * 1.12;
      const count = Math.round(8 + 20 * Math.sin(th));
      for (let j = 0; j < count; j++) {
        const ph = ((j + (i % 2) * 0.5) / count) * Math.PI * 2;
        const ux = Math.sin(th) * Math.cos(ph) * 0.5,
          uy = Math.cos(th) * 0.5,
          uz = Math.sin(th) * Math.sin(ph) * 0.5;
        nrm.set(ux / (SX * SX), uy / (SY * SY), uz / (SZ * SZ)).normalize();
        q.setFromUnitVectors(zAx, nrm);
        const g = G_.hexTile.clone();
        g.scale(0.085, 0.085, 0.085);
        g.applyQuaternion(q);
        g.translate(shX + ux * SX + nrm.x * 0.006, shY + uy * SY + nrm.y * 0.006, shZ + uz * SZ + nrm.z * 0.006);
        bake("show", g, 0xffffff);
      }
    }
    obs(shX, shZ, SX * 0.47, SZ * 0.45);
    // 珊瑚礁群: hex pods on stilts under a white hexagonal lattice canopy
    for (const [x, z, r, h] of [
      [1.45, 0.3, 0.26, 0.42],
      [2.0, -0.05, 0.24, 0.5],
      [1.75, 0.82, 0.22, 0.36],
      [2.3, 0.55, 0.2, 0.32],
      [1.15, 0.95, 0.18, 0.3],
    ]) {
      for (let k = 0; k < 3; k++) {
        const a = (k / 3) * Math.PI * 2 + 0.3;
        beam("solid", 0xd6d9d6, [x + Math.sin(a) * r * 0.5, G, z + Math.cos(a) * r * 0.5], [x + Math.sin(a) * r * 0.55, G + 0.12, z + Math.cos(a) * r * 0.55], 0.01);
      }
      hexMass(x, z, r, h, G + 0.12, 2, 2, [0, 1, 5]);
      obsC(x, z, r * 0.95);
    }
    const lat = 0.3,
      ly = G + 0.82;
    for (let q = -2; q <= 2; q++)
      for (let rr = -2; rr <= 2; rr++) {
        if (Math.abs(q + rr) > 2) continue;
        const cx = 1.72 + lat * 1.5 * q,
          cz = 0.45 + lat * APO * (2 * rr + q);
        for (let k = 0; k < 6; k++) {
          const a0 = (k * Math.PI) / 3,
            a1 = ((k + 1) * Math.PI) / 3;
          beam("paint", 0xf1f2ee, [cx + Math.cos(a0) * lat, ly, cz + Math.sin(a0) * lat], [cx + Math.cos(a1) * lat, ly, cz + Math.sin(a1) * lat], 0.01);
        }
      }
    for (const [x, z] of [[1.05, 0.1], [2.4, 0.05], [1.4, 1.25], [2.35, 1.0]]) {
      beam("paint", 0xe6e8e5, [x, G, z], [x, ly, z], 0.014);
      obsC(x, z, 0.03);
    }
    // 鯨魚堤岸: half tube rising and falling like breaching whales, with dark openings along its flank
    const whale = new THREE.CylinderGeometry(0.34, 0.34, 3.6, 18, 60, false, 0, Math.PI);
    whale.rotateZ(Math.PI / 2);
    const wy = (x) => 0.7 + 0.8 * (0.5 + 0.5 * Math.sin(x * 2.4 + 0.9));
    const wp = whale.attributes.position;
    for (let i = 0; i < wp.count; i++) {
      const x = wp.getX(i);
      const taper = Math.min(1, (1.8 - Math.abs(x)) / 0.4);
      wp.setY(i, Math.max(0, wp.getY(i)) * wy(x) * Math.max(0.12, taper));
    }
    whale.computeVertexNormals();
    whale.translate(0, G + 0.01, -1.9);
    custom("solid", whale, 0xe6ebee);
    for (let i = 0; i < 9; i++) {
      const x = -1.45 + i * 0.36;
      block("solid", 0x41505a, x, G + 0.03, -1.6, 0.16, 0.09 * wy(x), 0.02);
    }
    block("show", 0xffffff, 0, G + 0.01, -1.54, 3.4, 0.02, 0.02);
    obs(0, -1.9, 1.8, 0.36);
    palm(-2.2, 0.45, 0.95);
    palm(2.25, -1.2, 0.95);
    for (const x of [-0.8, 0.6]) bench(x, 1.3, 0);
  }

  // ============================================================================================
  // 駁二藝術特區：紅磚倉庫（雙坡／鋸齒屋頂、捲門、高窗、彩繪牆）、彩色貨櫃、方塊機器人公共藝術、草皮軌道與輕軌電車
  // ============================================================================================
  function gable(x, y, z, len, depth, rise, color) {
    const s = new THREE.Shape();
    s.moveTo(-depth / 2 - 0.03, 0);
    s.lineTo(depth / 2 + 0.03, 0);
    s.lineTo(0, rise);
    s.closePath();
    const g = new THREE.ExtrudeGeometry(s, { depth: len + 0.06, bevelEnabled: false });
    g.translate(0, 0, -(len + 0.06) / 2);
    g.rotateY(Math.PI / 2);
    g.translate(x, y, z);
    custom("solid", g, color);
  }
  function sawtooth(x, y, z, len, depth, n, color) {
    const step = len / n;
    for (let i = 0; i < n; i++) {
      const cx = x - len / 2 + step * (i + 0.5);
      const s = new THREE.Shape();
      s.moveTo(-step / 2, 0);
      s.lineTo(step / 2, 0);
      s.lineTo(step / 2, 0.13);
      s.closePath();
      const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: false });
      g.translate(cx, y, z - depth / 2);
      custom("solid", g, color);
      block("glass", 0xa8d2e4, cx + step / 2 - 0.006, y, z, 0.01, 0.12, depth * 0.94);
    }
  }
  function warehouse(x, z, w, d, h, roofType, mural) {
    block("brick", 0xffffff, x, G, z, w, h, d);
    block("solid", 0x8b4a3a, x, G + h - 0.03, z, w + 0.02, 0.035, d + 0.02);
    block("solid", 0x7a4033, x, G, z, w + 0.02, 0.04, d + 0.02); // plinth
    if (roofType === "saw") sawtooth(x, G + h, z, w, d, Math.round(w / 0.3), 0x60656c);
    else gable(x, G + h, z, w, d, 0.2, 0x5d6168);
    const nDoor = Math.max(2, Math.round(w / 0.45));
    for (let i = 0; i < nDoor; i++) {
      const dx = x - w / 2 + (i + 0.5) * (w / nDoor);
      block("solid", 0x3e4348, dx, G, z + d / 2 + 0.004, 0.22, 0.21, 0.012);
      for (let k = 1; k < 5; k++) block("solid", 0x555b61, dx, G + k * 0.042, z + d / 2 + 0.011, 0.22, 0.004, 0.004);
      block("solid", 0xe9e2d2, dx, G + 0.21, z + d / 2 + 0.006, 0.26, 0.02, 0.016);
      for (const sd of [1, -1]) block("glow", 0xffd89a, dx, G + h * 0.66, z + sd * (d / 2 + 0.006), 0.15, 0.055, 0.01);
    }
    if (mural) {
      const [c1, c2] = mural;
      block("solid", c1, x + w * 0.15, G + 0.05, z - d / 2 - 0.008, w * 0.42, h * 0.6, 0.008);
      block("solid", c2, x + w * 0.05, G + 0.12, z - d / 2 - 0.012, w * 0.16, h * 0.32, 0.006);
    }
    obs(x, z, w / 2 + 0.03, d / 2 + 0.03);
  }
  function container(x, y, z, color, ry = 0) {
    const L = 0.46,
      H = 0.19,
      D = 0.19;
    const dark = new THREE.Color(color).multiplyScalar(0.78).getHex();
    setLocal(() => {
      block("solid", color, 0, 0, 0, L, H, D);
      for (let i = 1; i < 8; i++) {
        const lx = -L / 2 + (i / 8) * L;
        for (const sd of [1, -1]) block("solid", dark, lx, 0.01, sd * (D / 2 + 0.003), 0.012, H - 0.02, 0.006);
      }
      block("solid", 0x3a3d40, L / 2 + 0.003, 0.01, 0, 0.006, H - 0.02, D - 0.03);
    }, x, y, z, ry);
  }
  let tramTrack = null;
  function buildPier2() {
    const TZ = 0.75;
    block("solid", 0x8fbb6c, 0, G, TZ, 5.0, 0.01, 0.3);
    for (let i = 0; i < 40; i++) block("solid", 0x8c7a66, -2.4 + i * 0.123, G + 0.01, TZ, 0.03, 0.008, 0.2);
    for (const dz of [-0.06, 0.06]) block("solid", 0x6e7378, 0, G + 0.016, TZ + dz, 5.0, 0.01, 0.012);
    for (let i = 0; i < 6; i++) {
      const x = -2.25 + i * 0.9;
      beam("solid", 0x5b6168, [x, G, TZ - 0.22], [x, G + 0.36, TZ - 0.22], 0.008);
      block("solid", 0x5b6168, x, G + 0.34, TZ - 0.11, 0.01, 0.01, 0.22);
      obsC(x, TZ - 0.22, 0.03);
    }
    block("solid", 0x2f3438, 0, G + 0.335, TZ, 5.0, 0.004, 0.004);
    // tram stop shelter
    block("solid", 0xe9eef0, -1.2, G, TZ + 0.32, 0.6, 0.03, 0.18);
    block("glass", 0xa8d2e4, -1.2, G + 0.03, TZ + 0.4, 0.56, 0.2, 0.01);
    block("solid", 0x3aa17e, -1.2, G + 0.24, TZ + 0.33, 0.66, 0.025, 0.22);
    tramTrack = { z: TZ, min: -2.2, max: 2.2, stop: -1.2 };
    warehouse(-1.1, -1.35, 1.9, 0.72, 0.42, "saw", [0xf2b544, 0x2e86ab]);
    warehouse(1.05, -1.35, 1.7, 0.72, 0.42, "gable", [0xe0684b, 0xf5d33a]);
    warehouse(-1.5, -0.25, 1.3, 0.6, 0.38, "gable", [0x3aa1a8, 0xf4f1e8]);
    warehouse(0.3, -0.25, 1.3, 0.6, 0.4, "saw", null);
    const C = [0xd9534f, 0xf0ad4e, 0x2e86ab, 0x3aa17e, 0x8e5ea2, 0xe8e4da];
    container(1.6, G, -0.42, C[0]);
    container(1.6, G, -0.2, C[2]);
    container(2.12, G, -0.42, C[3]);
    container(2.12, G, -0.2, C[1]);
    container(1.62, G + 0.19, -0.31, C[1], 0.12);
    container(2.12, G + 0.19, -0.3, C[4]);
    container(1.88, G + 0.38, -0.3, C[5], -0.2);
    obs(1.86, -0.31, 0.55, 0.2);
    // box robot sculpture on the forecourt
    const RX = 0.9,
      RZ = 1.55;
    block("solid", 0xf5d33a, RX - 0.07, G, RZ, 0.09, 0.2, 0.08);
    block("solid", 0xf5d33a, RX + 0.07, G, RZ, 0.09, 0.2, 0.08);
    block("solid", 0xdb6a41, RX, G + 0.2, RZ, 0.3, 0.26, 0.16);
    block("solid", 0xf4f1e8, RX, G + 0.46, RZ, 0.18, 0.15, 0.15);
    block("glow", 0x7fe3ff, RX, G + 0.52, RZ + 0.077, 0.13, 0.03, 0.01);
    for (const sd of [-1, 1]) beam("solid", 0xdb6a41, [RX + sd * 0.16, G + 0.42, RZ], [RX + sd * 0.26, G + 0.24, RZ + 0.04], 0.025);
    obsC(RX, RZ, 0.2);
    for (const x of [-2.0, -0.4]) palm(x, 1.5, 0.85);
    for (const x of [-1.2, 0.0]) bench(x, 1.25, 0);
  }

  // ============================================================================================
  // 85大樓（遠景）：「高」字形雙塔腳、跨接量體、中央逐段收分塔身與尖塔；深藍綠玻璃
  // ============================================================================================
  function buildSkyTower() {
    const qTop = G;
    const GLASS = 0x4c6b7c,
      FIN = 0xdfe3e2;
    let y = qTop;
    block("solid", 0xd2ccbf, 0, y, 0, 1.9, 0.3, 1.1);
    block("glow", 0xffe2a8, 0, y + 0.1, 0.556, 1.7, 0.08, 0.01);
    obs(0, 0, 0.98, 0.58);
    for (const x of [-0.8, 0.8]) palm(x, 0.95, 0.8);
    y += 0.3;
    const legH = 2.3;
    for (const sx of [-0.5, 0.5]) {
      block("darkglass", GLASS, sx, y, 0, 0.5, legH, 0.72);
      block("solid", 0x354e5c, sx, y, 0, 0.12, legH, 0.74); // dark spine
      for (const ex of [-0.25, 0.25]) for (const ez of [-0.36, 0.36]) block("steel", FIN, sx + ex, y, ez, 0.035, legH, 0.035);
      for (let k = 1; k < 14; k++) for (const z of [0.365, -0.365]) block("glow", 0xffe9bf, sx, y + (k / 14) * legH, z, 0.44, 0.012, 0.008);
    }
    y += legH;
    block("darkglass", GLASS, 0, y, 0, 1.52, 0.6, 0.76);
    for (let k = 1; k < 4; k++) block("glow", 0xffe9bf, 0, y + k * 0.15, 0.385, 1.44, 0.012, 0.008);
    block("steel", FIN, 0, y + 0.6, 0, 1.58, 0.035, 0.82);
    y += 0.635;
    for (const [w, h, d] of [
      [0.8, 1.15, 0.64],
      [0.64, 0.7, 0.52],
      [0.48, 0.5, 0.4],
      [0.34, 0.3, 0.3],
      [0.22, 0.18, 0.2],
    ]) {
      block("darkglass", GLASS, 0, y, 0, w, h, d);
      block("solid", 0x354e5c, 0, y, 0, w * 0.22, h, d + 0.01);
      for (const ex of [-w / 2, w / 2]) for (const ez of [-d / 2, d / 2]) block("steel", FIN, ex, y, ez, 0.03, h, 0.03);
      for (let k = 1; k < Math.round(h / 0.16); k++) block("glow", 0xffe9bf, 0, y + k * 0.16, d / 2 + 0.005, w - 0.06, 0.011, 0.008);
      block("steel", FIN, 0, y + h, 0, w + 0.05, 0.028, d + 0.05);
      y += h + 0.028;
    }
    beam("steel", 0xd0d4d6, [0, y, 0], [0, y + 0.8, 0], 0.02);
    add("glow", G_.sphere, 0xff5544, 0, y + 0.81, 0, 0.05, 0.05, 0.05);
    skyTop = y + 0.85;
  }
  let skyTop = 0;

  // ============================================================================================
  // 高雄港埠旅運中心：向上外擴、頂部斜切的高塔，外覆密集的白色水平鰭片（頂上一支雷達桅），
  // 塔後拖出起伏的波浪形低樓翼（兩道曲線屋脊、底層玻璃帶），港側停一艘白色郵輪（造型示意）
  // ============================================================================================
  const ell = new THREE.CylinderGeometry(0.5, 0.5, 1, low ? 28 : 48);
  function buildCruise() {
    // 依照片：整棟是深炭灰的水平百葉量體——左側一座向上斜切、略帶扭轉的高塔，以 S 形一路流進右側起伏的低矮波浪翼。
    // 做法：由下而上一層層「鰭片」切片（淺灰薄片＋深色內縮層），塔與翼在每一層各給一片橢圓／長條，自然接成一體。
    const TX = -0.9,
      TZ = -0.45,
      H = 2.75,
      STEP = 0.055,
      N = Math.round(H / STEP);
    const FIN = 0x7d848a,
      CORE = 0x22262a;
    add("glass", ell, 0x6f8e9d, TX + 0.4, G + 0.05, TZ, 2.4, 0.1, 1.0); // glass base band under the whole building
    // two humps flowing out of the tower, the first one tall, the far end sinking toward the quay
    const wingH = (u) => 0.45 + 0.95 * Math.pow(Math.max(0, Math.sin(u * Math.PI * 1.15 + 0.25)), 1.4) * (1 - 0.3 * u) + 0.4 * Math.max(0, Math.sin(u * Math.PI * 2.3 - 1.6)) * (1 - u * 0.5);
    let topX = TX,
      topY = G + 0.1;
    for (let i = 0; i < N; i++) {
      const y = G + 0.1 + i * STEP,
        f = i / N,
        fin = i % 2 === 0;
      const bucket = fin ? "paint" : "darkglass",
        col = fin ? FIN : CORE,
        h = fin ? 0.018 : STEP - 0.018 + 0.004,
        yy = fin ? y : y + 0.011,
        inset = fin ? 1 : 0.9;
      // tower: ellipse that leans toward the wing and twists as it rises; the last fifth is cut on a slant
      let rx = 0.5 - 0.1 * f,
        rz = 0.42 - 0.08 * f,
        cx = TX + 0.55 * f * f,
        cz = TZ;
      const cut = f - 0.8;
      if (cut > 0) {
        const k = cut / 0.2;
        cx += rx * 0.75 * k;
        rx *= 1 - 0.8 * k;
        rz *= 1 - 0.45 * k;
      }
      if (rx > 0.04) add(bucket, ell, col, cx, yy + h / 2, cz, rx * 2 * inset, h, rz * 2 * inset, 0, f * 0.55, 0);
      if (cut <= 0) [topX, topY] = [cx, yy];
      // wing: at this height, the stretch of x where the wave profile is taller than y
      const yRel = y - G,
        W0 = TX + 0.3,
        W1 = TX + 3.1;
      let runStart = null;
      for (let k = 0; k <= 40; k++) {
        const u = k / 40,
          xw = W0 + (W1 - W0) * u,
          inside = wingH(u) > yRel;
        if (inside && runStart === null) runStart = xw;
        if ((!inside || k === 40) && runStart !== null) {
          const xe = inside ? xw : xw - (W1 - W0) / 40;
          const len = xe - runStart;
          if (len > 0.05) {
            const mid = (runStart + xe) / 2,
              depth = 0.78 - 0.18 * ((mid - W0) / (W1 - W0));
            add(bucket, ell, col, mid, yy + h / 2, TZ - 0.28, (len + 0.12) * inset, h, depth * inset, 0, 0, 0);
          }
          runStart = null;
        }
      }
      if (fin && i % 6 === 3) tube("fest", 0xffffff, [[cx - rx, yy + 0.004, cz + rz * 0.2], [cx, yy + 0.004, cz + rz * 1.02], [cx + rx, yy + 0.004, cz + rz * 0.2]], 0.008, 20, 4);
    }
    // radar mast on the slanted top
    beam("steel", 0xd6dadc, [topX, topY, TZ], [topX, topY + 0.45, TZ], 0.012);
    block("steel", 0xd6dadc, topX, topY + 0.34, TZ, 0.2, 0.012, 0.012);
    add("glow", G_.sphere, 0xff5544, topX, topY + 0.46, TZ, 0.04, 0.04, 0.04);
    obsC(TX, TZ, 0.56);
    obs(TX + 1.65, TZ - 0.28, 1.5, 0.42);
    // a white cruise ship (shape only) moored along the seaward quay
    const SZ = -2.72;
    const hs = new THREE.Shape();
    hs.moveTo(-1.55, -0.26);
    hs.lineTo(1.2, -0.26);
    hs.quadraticCurveTo(1.75, -0.2, 1.85, 0);
    hs.quadraticCurveTo(1.75, 0.2, 1.2, 0.26);
    hs.lineTo(-1.55, 0.26);
    hs.quadraticCurveTo(-1.68, 0, -1.55, -0.26);
    const hull = new THREE.ExtrudeGeometry(hs, { depth: 0.3, bevelEnabled: false, curveSegments: 8 });
    hull.rotateX(-Math.PI / 2);
    hull.translate(0, WATER_Y - 0.08, SZ);
    custom("paint", hull, 0xf7f8f6);
    block("solid", 0x2c4a63, -0.05, WATER_Y - 0.06, SZ, 3.2, 0.06, 0.53);
    const decks = [
      [-1.25, 0.95, 0.44, 0.1],
      [-1.15, 0.8, 0.4, 0.1],
      [-1.0, 0.62, 0.36, 0.09],
      [-0.75, 0.36, 0.3, 0.08],
    ];
    let dy = WATER_Y + 0.22;
    for (const [x0, x1, w, h] of decks) {
      block("paint", 0xf2f4f3, (x0 + x1) / 2, dy, SZ, x1 - x0, h, w);
      for (const sd of [1, -1]) block("glow", 0xffe7b8, (x0 + x1) / 2, dy + h * 0.45, SZ + sd * (w / 2 + 0.003), x1 - x0 - 0.06, 0.02, 0.006);
      dy += h;
    }
    block("solid", 0x1f5f8a, -0.55, dy, SZ, 0.16, 0.16, 0.13);
    block("solid", 0x2b2f33, -0.55, dy + 0.16, SZ, 0.17, 0.03, 0.14);
    tube("fest", 0xffffff, [[-1.5, WATER_Y + 0.23, SZ - 0.27], [0, WATER_Y + 0.23, SZ - 0.27], [1.2, WATER_Y + 0.23, SZ - 0.27], [1.82, WATER_Y + 0.23, SZ]], 0.008, 40, 4);
    for (const x of [-1.2, -0.2, 0.8]) beam("solid", 0x6b5a48, [x, G - 0.02, -1.95], [x + 0.05, WATER_Y + 0.25, SZ + 0.26], 0.006);
    // forecourt toward the bridge
    for (const x of [-1.3, 0.2, 1.1]) palm(x, 1.25, 0.8);
    bench(-0.5, 1.0, 0);
    bench(0.7, 0.75, -0.5);
  }

  // ---------- build everything ----------
  const plan = planSkyline(centers);
  const BUILD = { "kh-pier2": buildPier2, "kh-exhibition": buildExhibition, "kh-music": buildMusic, "kh-85": buildSkyTower, "kh-cruise": buildCruise };
  const HEIGHT = { "kh-pier2": 0.95, "kh-exhibition": 1.45, "kh-music": 2.9, "kh-cruise": 2.75 };
  // 大港橋 spans the channel between Pier-2 and the cruise terminal (the two facing quays are parallel)
  const pPier = plan.find((p) => p.id === "kh-pier2"),
    pCruise = plan.find((p) => p.id === "kh-cruise");
  let swing = null;
  if (pPier && pCruise) {
    const dx = pCruise.x - pPier.x,
      dz = pCruise.z - pPier.z,
      dl = Math.hypot(dx, dz),
      ux = dx / dl,
      uz = dz / dl;
    const e1 = { x: pPier.x + ux * pPier.r * APO, z: pPier.z + uz * pPier.r * APO },
      e2 = { x: pCruise.x - ux * pCruise.r * APO, z: pCruise.z - uz * pCruise.r * APO };
    swing = { e1, e2, ux, uz, mx: (e1.x + e2.x) / 2, mz: (e1.z + e2.z) / 2, len: Math.hypot(e2.x - e1.x, e2.z - e1.z) + 0.18 };
    (pPier.gaps ||= []).push(e1);
    (pCruise.gaps ||= []).push(e2);
  }
  for (const p of plan) {
    const spec = SKYLINE.find((s) => s.id === p.id);
    if (low && p.id === "kh-85") continue;
    harbourIsland(p);
    const br = bridge(p);
    setFrame(p.x, p.z, p.yaw);
    BUILD[p.id]();
    // where a visitor stands on arrival: just inside the island past the bridge landing
    const inset = p.r < KH_R ? 0.35 : 0.7;
    const landing = { x: p.pb.x + p.ux * inset, z: p.pb.z + p.uz * inset };
    const height = p.id === "kh-85" ? skyTop : G + HEIGHT[p.id];
    entries.set(p.id, { ...spec, ...p, landing, bridgeAt: br.at, center: new THREE.Vector3(p.x, p.id === "kh-85" ? 2.4 : G + 0.5, p.z), height });
  }
  // ---------- 大港橋 (rotating swing bridge): static round pier in the channel + a rotating deck, mast and cables ----------
  let swingGroup = null;
  if (swing) {
    setFrame(swing.mx, swing.mz, 0);
    add("solid", G_.cyl, 0xbdb8ae, 0, (WATER_Y - 0.7 + G - 0.42) / 2, 0, 0.6, G - 0.42 - WATER_Y + 0.7, 0.6);
    add("solid", G_.cyl, 0x8c8a85, 0, G - 0.43, 0, 0.66, 0.03, 0.66);
    add("solid", G_.cyl, 0xe9f3f2, 0, WATER_Y + 0.004, 0, 0.9, 0.008, 0.9);
    const saved = buckets;
    buckets = { solid: [], roof: [], glass: [], darkglass: [], paint: [], steel: [], glow: [], show: [], brick: [], pave: [], fest: [] };
    setFrame(0, 0, 0);
    // 依照片：白色細長的錐形高桅（略向外傾）、兩側成排斜拉鋼索、白色橋身在桅柱側翻起成波浪形的實心護欄、圓形迴轉平台
    const L = swing.len,
      W = 0.5,
      n = 30;
    const deckY = (x) => G + 0.04 + 0.08 * (1 - Math.pow((2 * x) / L, 2));
    for (let i = 0; i < n; i++) {
      const xa = -L / 2 + (i / n) * L,
        xb = xa + L / n,
        xm = (xa + xb) / 2;
      const pitch = Math.atan2(deckY(xb) - deckY(xa), L / n);
      add("paint", G_.box, i % 2 ? 0xf3f3ef : 0xe9e9e4, xm, deckY(xm), 0, L / n + 0.01, 0.04, W, 0, 0, pitch);
      add("paint", G_.box, 0xf6f6f2, xm, deckY(xm) - 0.06, 0, L / n + 0.01, 0.08, W * 0.82, 0, 0, pitch); // box girder
    }
    add("paint", G_.cyl, 0xf4f4f0, 0, G + 0.02, 0, 1.0, 0.05, 1.0); // round pivot platform
    add("paint", G_.cyl, 0xe6e6e1, 0, G - 0.03, 0, 1.08, 0.05, 1.08);
    // mast side (−z): a solid white parapet that rises like a wave toward the mast; far side: a slim rail
    const par = (x) => 0.14 + 0.5 * Math.exp(-Math.pow(x / (L * 0.22), 2));
    for (let i = 0; i < n; i++) {
      const x = -L / 2 + ((i + 0.5) / n) * L,
        h = par(x);
      add("paint", G_.box, 0xfafaf7, x, deckY(x) + h / 2, -W / 2 + 0.02, L / n + 0.01, h, 0.035);
      if (i % 2 === 0) beam("paint", 0xf2f2ee, [x, deckY(x), W / 2 - 0.02], [x, deckY(x) + 0.15, W / 2 - 0.02], 0.006);
    }
    tube("paint", 0xf2f2ee, Array.from({ length: n + 1 }, (_, i) => [-L / 2 + (i / n) * L, deckY(-L / 2 + (i / n) * L) + 0.15, W / 2 - 0.02]), 0.009, 30, 4);
    tube("fest", 0xffffff, Array.from({ length: n + 1 }, (_, i) => [-L / 2 + (i / n) * L, deckY(-L / 2 + (i / n) * L) + par(-L / 2 + (i / n) * L) + 0.012, -W / 2 + 0.02]), 0.012, 30, 4);
    tube("fest", 0xffffff, Array.from({ length: n + 1 }, (_, i) => [-L / 2 + (i / n) * L, deckY(-L / 2 + (i / n) * L) - 0.025, W / 2 + 0.004]), 0.012, 30, 4);
    // the spire: a straight tapered white mast leaning a little away from the deck, on a drum at the pivot
    const MH = 2.7,
      lean = 0.1,
      base = [0, G + 0.05, -W / 2 - 0.1],
      tip = [0.0, G + 0.05 + MH * Math.cos(lean), -W / 2 - 0.1 - MH * Math.sin(lean)];
    add("paint", G_.cyl, 0xf4f4f0, base[0], G + 0.06, base[2], 0.26, 0.08, 0.26);
    const mastGeo = new THREE.CylinderGeometry(0.012, 0.055, MH, 18);
    mastGeo.translate(0, MH / 2, 0);
    mastGeo.rotateX(lean);
    mastGeo.translate(base[0], base[1], base[2]);
    custom("paint", mastGeo, 0xfbfbf8);
    tube("fest", 0xffffff, [[base[0] + 0.045, base[1] + 0.1, base[2]], [tip[0] + 0.015, tip[1] - 0.1, tip[2]]], 0.01, 8, 4);
    // harp of cables: from the upper half of the mast to anchor points along both deck edges
    const NC = 11;
    for (let k = 0; k < NC; k++) {
      const t = (k + 1) / (NC + 1);
      const my = base[1] + MH * (0.42 + 0.56 * t),
        mz = base[2] - MH * (0.42 + 0.56 * t) * Math.tan(lean);
      for (const sx of [-1, 1]) {
        const x = sx * (0.12 + t * (L / 2 - 0.2));
        for (const sd of [-1, 1]) beam("steel", 0xdfe3e5, [0, my, mz], [x, deckY(x) + (sd < 0 ? par(x) : 0.02), sd * (W / 2 - 0.03)], 0.0035);
      }
    }
    add("glow", G_.sphere, 0xff5544, tip[0], tip[1] + 0.02, tip[2], 0.035, 0.035, 0.035);
    swingGroup = { buckets, base: Math.atan2(-swing.uz, swing.ux) };
    buckets = saved;
    const bspec = SKYLINE.find((s) => s.id === "kh-bridge");
    const ca = centers.get(pPier.parent),
      cd = Math.hypot(swing.mx - ca.x, swing.mz - ca.z);
    entries.set("kh-bridge", { ...bspec, id: "kh-bridge", x: swing.mx, z: swing.mz, walk: false, ux: (swing.mx - ca.x) / cd, uz: (swing.mz - ca.z) / cd, center: new THREE.Vector3(swing.mx, G + 0.8, swing.mz), height: G + 2.1 });
  }
  for (const e of entries.values()) {
    if (!CSS2DObject) break;
    const el = document.createElement("button");
    el.type = "button";
    el.className = "landmark-pin landmark-pin-city";
    el.dataset.skyline = e.id;
    const ico = document.createElement("i");
    ico.className = "lm-pin-ico";
    ico.setAttribute("aria-hidden", "true");
    ico.textContent = e.icon;
    const span = document.createElement("span");
    span.className = "lm-pin-txt";
    const b = document.createElement("b");
    b.textContent = txt(e.name);
    const small = document.createElement("small");
    small.textContent = e.walk ? (english ? "Walk over · " : "走過去看看・") + CITY : CITY;
    span.append(b, small);
    el.append(ico, span);
    el.setAttribute("aria-label", `${txt(e.name)}（${CITY}）`);
    el.addEventListener("click", (ev) => {
      ev.stopPropagation();
      api.visit(e.id);
    });
    const pin = new CSS2DObject(el);
    pin.position.set(e.x, e.height + 0.35, e.z);
    pinGroup.add(pin);
    e.pinEl = el;
  }

  // ---------- materials + merged meshes ----------
  const emissiveByVertex = (m, key, extra) => {
    m.customProgramCacheKey = () => key;
    m.onBeforeCompile = (sh) => {
      if (extra) extra(sh);
      sh.fragmentShader = sh.fragmentShader.replace("#include <emissivemap_fragment>", "#include <emissivemap_fragment>\n  totalEmissiveRadiance *= vColor.rgb;" + (extra ? "\n  totalEmissiveRadiance *= khShow;" : ""));
    };
  };
  const mats = {
    solid: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.7, metalness: 0.04 }),
    roof: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.3, metalness: 0.08, side: THREE.DoubleSide }),
    glass: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.06, metalness: 0.45, transparent: true, opacity: 0.6 }),
    // 擬真材質（2026-11-15）：烤漆鋼（展覽館屋脊與直櫺、音樂中心格柵、大港橋橋身）、不鏽鋼（旅運中心鰭片、鋼索、85 大樓鰭柱）、
    // 深色反射玻璃（85 大樓帷幕、旅運中心核心）；反射強度由 fx.js 依 userData.fxEnvScale 放大
    paint: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.34, metalness: 0.1 }),
    steel: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.24, metalness: 0.92 }),
    darkglass: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.1, metalness: 0.65 }),
    brick: new THREE.MeshStandardMaterial({ vertexColors: true, map: brickTex, roughness: 0.92 }),
    pave: new THREE.MeshStandardMaterial({ vertexColors: true, map: paveTex, roughness: 0.9 }),
    glow: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.3, emissive: 0xffffff, emissiveIntensity: 0 }),
    show: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.3, emissive: 0xffffff, emissiveIntensity: 0, side: THREE.DoubleSide }),
    // festival light strips (pink / purple / blue at night); white trim by day
    fest: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.35, emissive: 0xff5fb0, emissiveIntensity: 0 }),
  };
  emissiveByVertex(mats.glow, "kh-glow-v2");
  for (const [k, v] of Object.entries({ roof: 1.5, glass: 2.2, paint: 1.6, steel: 2.8, darkglass: 2.6, fest: 1.2 })) mats[k].userData.fxEnvScale = v;
  const showUniforms = { uKhTime: { value: 0 }, uKhFest: { value: new THREE.Color(0xff5fb0) }, uKhFestMix: { value: 0 } };
  emissiveByVertex(mats.show, "kh-show-v3", (sh) => {
    sh.uniforms.uKhTime = showUniforms.uKhTime;
    sh.uniforms.uKhFest = showUniforms.uKhFest;
    sh.uniforms.uKhFestMix = showUniforms.uKhFestMix;
    sh.vertexShader = "varying vec3 vKhW;\n" + sh.vertexShader.replace("#include <begin_vertex>", "#include <begin_vertex>\n  vKhW = (modelMatrix * vec4(transformed, 1.0)).xyz;");
    sh.fragmentShader =
      "varying vec3 vKhW;\nuniform float uKhTime;\nuniform vec3 uKhFest;\nuniform float uKhFestMix;\n" +
      sh.fragmentShader.replace(
        "#include <emissivemap_fragment>",
        `vec3 khHue = clamp(abs(mod(fract(vKhW.y * 0.22 + vKhW.x * 0.07 - uKhTime * 0.12) * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);
  vec3 khShow = mix(khHue * 0.92 + 0.06, uKhFest * (0.75 + 0.25 * sin(vKhW.y * 3.0 - uKhTime * 1.4)), uKhFestMix);
  #include <emissivemap_fragment>`,
      );
  });
  const meshes = [];
  const mergeBuckets = (bk, parent) => {
  for (const [k, list] of Object.entries(bk)) {
    if (!list.length) continue;
    const merged = mergeGeometries(list, false);
    for (const g of list) g.dispose();
    if (!merged) continue;
    merged.computeBoundingSphere();
    if (k === "show") {
      const c = merged.attributes.color;
      for (let i = 0; i < c.count; i++) c.setXYZ(i, 0.62, 0.8, 0.9);
    }
    const mesh = new THREE.Mesh(merged, mats[k]);
    mesh.name = "kh-" + k;
    // the big merged meshes cast shadows on high quality (one shadow draw each; the shadow map only re-renders when the sun moves)
    mesh.castShadow = !low && (k === "solid" || k === "roof" || k === "paint" || k === "steel" || k === "darkglass" || k === "brick");
    mesh.receiveShadow = k === "pave" || k === "solid" || k === "roof" || k === "paint";
    mesh.matrixAutoUpdate = false;
    if (k === "glass") mesh.renderOrder = 1;
    parent.add(mesh);
    meshes.push(mesh);
  }
  };
  mergeBuckets(buckets, group);
  let swingPivot = null;
  if (swingGroup) {
    swingPivot = new THREE.Group();
    swingPivot.name = "kh-great-harbor-bridge";
    swingPivot.position.set(swing.mx, 0, swing.mz);
    swingPivot.rotation.y = swingGroup.base;
    mergeBuckets(swingGroup.buckets, swingPivot);
    for (const m of swingPivot.children) m.matrixAutoUpdate = true;
    group.add(swingPivot);
  }
  for (const g of Object.values(G_)) g.dispose();
  ell.dispose();

  // ---------- light-rail tram on the Pier-2 track ----------
  const pier = entries.get("kh-pier2");
  let tram = null;
  if (pier && tramTrack && !low) {
    const tg = [];
    const tb = (x, y, z, w, h, d, c) => {
      const g = new THREE.BoxGeometry(w, h, d).toNonIndexed();
      g.translate(x, y, z);
      g.deleteAttribute("uv");
      const n = g.attributes.position.count,
        col = new Float32Array(n * 3);
      _c.set(c);
      for (let i = 0; i < n; i++) col.set([_c.r, _c.g, _c.b], i * 3);
      g.setAttribute("color", new THREE.BufferAttribute(col, 3));
      tg.push(g);
    };
    for (let k = 0; k < 3; k++) {
      const x = (k - 1) * 0.29;
      tb(x, 0.075, 0, 0.27, 0.11, 0.12, 0xf6f7f4);
      tb(x, 0.095, 0, 0.272, 0.04, 0.122, 0x2f3f4a);
      tb(x, 0.045, 0, 0.274, 0.014, 0.124, 0x3aa17e);
      tb(x, 0.134, 0, 0.2, 0.012, 0.08, 0xd4d8da);
    }
    tb(0.45, 0.07, 0, 0.04, 0.09, 0.11, 0xf6f7f4);
    tb(-0.45, 0.07, 0, 0.04, 0.09, 0.11, 0xf6f7f4);
    const geo = mergeGeometries(tg, false);
    tg.forEach((g) => g.dispose());
    tram = new THREE.Mesh(geo, mats.solid);
    const holder = new THREE.Group();
    holder.position.set(pier.x, G + 0.02, pier.z);
    holder.rotation.y = pier.yaw;
    tram.position.set(tramTrack.min, 0, tramTrack.z);
    holder.add(tram);
    group.add(holder);
  }

  scene.add(group);
  scene.add(pinGroup);

  // ---------- interaction panel (shown while the avatar stands on a harbour island) ----------
  const panel = document.createElement("div");
  panel.id = "kh-panel";
  panel.setAttribute("role", "dialog");
  panel.hidden = true;
  (document.querySelector("#app") || document.body).appendChild(panel);
  let panelFor = null,
    dismissedFor = null;
  const sfx = () => window.__htlPassport?.sfx;
  const say = (title, body) => window.heartIslandAvatar?.showSay?.(title, body, 3200);
  function button(label, fn, primary = false) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "khp-btn" + (primary ? " is-primary" : "");
    b.textContent = label;
    b.addEventListener("click", (ev) => {
      ev.stopPropagation();
      fn();
    });
    return b;
  }
  function renderPanel(id) {
    const e = entries.get(id);
    panel.replaceChildren();
    const head = document.createElement("div");
    head.className = "khp-head";
    const ico = document.createElement("span");
    ico.className = "khp-ico";
    ico.textContent = e.icon;
    const t = document.createElement("div");
    t.className = "khp-title";
    const b = document.createElement("b");
    b.textContent = txt(e.name);
    const s = document.createElement("small");
    s.textContent = CITY + (english ? " · shape homage, not department info" : "・建築造型致敬，非系所資料");
    t.append(b, s);
    const close = button("×", () => {
      dismissedFor = id;
      hidePanel();
    });
    close.classList.add("khp-close");
    close.setAttribute("aria-label", english ? "Close" : "關閉");
    head.append(ico, t, close);
    const row = document.createElement("div");
    row.className = "khp-actions";
    const special = {
      "kh-music": [english ? "🌈 Light show" : "🌈 點亮燈光秀", () => api.lightShow()],
      "kh-cruise": [english ? "🌉 Swing the bridge" : "🌉 大港橋旋轉", () => api.spinBridge()],
      "kh-pier2": [english ? "🚋 Call the tram" : "🚋 呼叫輕軌", () => api.callTram()],
      "kh-exhibition": [english ? "🌊 Fly around the roof" : "🌊 環繞欣賞波浪屋頂", () => api.orbit(id)],
      "kh-85": [english ? "🌆 Look up at the tower" : "🌆 環繞仰望塔樓", () => api.orbit(id)],
    }[id];
    if (special) row.append(button(special[0], special[1], true));
    row.append(button(english ? "🎆 Festival lights" : "🎆 節慶燈光", () => api.festival()));
    if (id === "kh-pier2") row.append(button(english ? "🌉 Swing the bridge" : "🌉 大港橋旋轉", () => api.spinBridge()));
    row.append(
      button(english ? "📸 Photo framing" : "📸 取景合影", () => api.photo(id)),
      button(english ? "👋 Wave" : "👋 揮手", () => window.heartIslandAvatar?.api?.triggerEmote?.("wave")),
      button(english ? "🏝️ Back to campus" : "🏝️ 走回校園", () => api.backToCampus(id)),
    );
    panel.append(head, row);
    panel.setAttribute("aria-label", `${txt(e.name)}（${CITY}）`);
  }
  function showPanel(id) {
    if (panelFor === id && !panel.hidden) return;
    panelFor = id;
    renderPanel(id);
    panel.hidden = false;
    document.body.classList.add("kh-panel-open");
  }
  function hidePanel() {
    panelFor = null;
    panel.hidden = true;
    document.body.classList.remove("kh-panel-open");
  }
  const onIsland = (x, z) => {
    for (const isl of nav.islands) {
      const dx = x - isl.x,
        dz = z - isl.z;
      let m = 0;
      for (const a of [0, Math.PI / 3, (2 * Math.PI) / 3]) m = Math.max(m, Math.abs(dx * Math.cos(a) + dz * Math.sin(a)));
      if (m <= isl.r * APO + 0.05) return isl.id;
    }
    return null;
  };

  // ---------- state + animation ----------
  let night = 0,
    t = 0,
    last = 0,
    showBoostUntil = 0,
    tramU = tramTrack ? tramTrack.min : 0,
    tramDir = 1,
    tramCall = null,
    orbitState = null;
  // 節慶燈光：粉紅、紫、藍（只是燈光顏色，不代表任何活動）。夜間自動緩慢循環；面板按鈕可固定一色或循環，白天按下也會亮一陣子
  const FEST = [0xff5fb0, 0x9b5cff, 0x3f8cff].map((c) => new THREE.Color(c));
  const FEST_NAMES = english ? ["cycle", "pink", "purple", "blue"] : ["循環", "粉紅", "紫", "藍"];
  const festColor = new THREE.Color(FEST[0]);
  let festMode = -1,
    festBoostUntil = 0,
    swingAng = 0,
    swingPhase = "closed",
    swingT0 = 0,
    nextSwing = performance.now() + 90000;
  const smooth = (k) => k * k * (3 - 2 * k);
  const applyLights = () => {
    const now = performance.now();
    const boost = now < showBoostUntil ? 1 : 0;
    const fest = Math.max(smooth(Math.min(1, Math.max(0, (night - 0.2) / 0.4))), now < festBoostUntil ? 1 : 0);
    if (festMode >= 0) festColor.copy(FEST[festMode]);
    else {
      const ph = (t * 0.1) % 3,
        i = Math.floor(ph);
      festColor.lerpColors(FEST[i], FEST[(i + 1) % 3], smooth(ph - i));
    }
    const moving = swingPhase === "opening" || swingPhase === "closing" ? 0.6 + 0.4 * Math.sin(now / 160) : 0;
    mats.glow.emissiveIntensity = 0.06 + night * 2.6;
    mats.show.emissiveIntensity = 0.18 + Math.max(night, boost, fest) * 1.25;
    mats.fest.emissive.copy(festColor);
    mats.fest.emissiveIntensity = Math.max(fest, moving) * 4.2;
    mats.roof.emissive.copy(festColor);
    mats.roof.emissiveIntensity = fest * 0.48;
    showUniforms.uKhFest.value.copy(festColor);
    showUniforms.uKhFestMix.value = boost ? 0 : fest;
  };

  const api = {
    group,
    pinGroup,
    entries,
    meshes,
    nav,
    // walking routes for heart-me.js (bridge → landing); the islands are small enough to roam freely with WASD
    routes(existing, campus = {}) {
      const out = [];
      for (const e of entries.values()) {
        if (!e.walk) continue;
        const pts = linkRoute(existing, campus, e, G, DECK - 0.03);
        if (pts) out.push(pts);
      }
      return out;
    },
    setNight(n) {
      night = n;
      applyLights();
    },
    visit(id) {
      const e = entries.get(id);
      if (!e) return;
      actions.track?.(id);
      const av = window.heartIslandAvatar;
      if (e.walk && av?.api?.goToPoint) {
        dismissedFor = null;
        av.api.goToPoint(e.landing.x, e.landing.z, (english ? "To " : "前往") + txt(e.name), () => {
          if (av.S?.fig) av.S.fig.group.rotation.y = Math.atan2(e.x - e.landing.x, e.z - e.landing.z);
          showPanel(id);
          say(`${e.icon} ${txt(e.name)}`, english ? "Kaohsiung cityscape — look around!" : "高雄城市地景，四處走走看看吧！");
        });
        return;
      }
      api.flyTo(id);
      if (id === "kh-bridge") setTimeout(() => api.spinBridge(), reduced?.matches ? 0 : 1600);
    },
    // 大港橋：緩緩轉開 90° 讓船通過，停一陣子再轉回
    spinBridge() {
      if (!swingPivot) return;
      if (swingPhase !== "closed") {
        say("🌉", english ? "The bridge is already turning." : "大港橋正在轉動中。");
        return;
      }
      swingPhase = "opening";
      swingT0 = performance.now();
      sfx()?.bell?.();
      say("🌉", english ? "The Great Harbor Bridge is swinging open." : "大港橋緩緩轉開，讓船通過！");
    },
    festival() {
      const k = (festMode + 2) % 4; // cycle → pink → purple → blue → cycle
      festMode = k - 1;
      festBoostUntil = performance.now() + 30000;
      applyLights();
      say("🎆", (english ? "Festival lights: " : "節慶燈光：") + FEST_NAMES[k]);
    },
    flyTo(id) {
      const e = entries.get(id);
      if (!e) return;
      const tall = e.id === "kh-85";
      const target = tall ? e.center.clone() : new THREE.Vector3(e.x, G + 0.6, e.z);
      // view from the campus side (e.ux/uz points from the campus toward the landmark)
      const back = new THREE.Vector3(-e.ux, 0, -e.uz);
      const dist = tall ? 14 : 9;
      const pos = target.clone().addScaledVector(back, dist).add(new THREE.Vector3(0, dist * 0.62, 0));
      actions.fly?.(target, pos);
    },
    lightShow() {
      showBoostUntil = performance.now() + 25000;
      applyLights();
      const s = sfx();
      if (s?.bell) [0, 260, 520, 900].forEach((d) => setTimeout(() => s.bell(), d));
      say("🎆", english ? "Light show on for a while!" : "燈光秀點亮了！");
    },
    callTram() {
      if (!tram || !tramTrack) return;
      tramCall = { until: 0 };
      sfx()?.bell?.();
      say("🚋", english ? "The tram is on its way to the stop." : "輕軌往月台開過來了！");
    },
    orbit(id) {
      const e = entries.get(id);
      if (!e || !camera || !controls) return;
      window.heartIslandAvatar?.stopFollow?.();
      orbitState = { e, start: performance.now(), dur: 9000, a0: Math.atan2(-e.ux, -e.uz) };
    },
    photo(id) {
      const e = entries.get(id);
      const av = window.heartIslandAvatar;
      if (!e || !av?.api?.photoWith) return;
      // the avatar stands on the bridge side of the building and faces the camera; the landmark fills the background
      const tall = e.id === "kh-85" || e.id === "kh-cruise";
      av.api.photoWith({ x: e.x, z: e.z, h: Math.min(tall ? 1.9 : 1.6, (e.height || G + 1) - G), r: tall ? 0.9 : 1.6, dir: { x: -e.ux, z: -e.uz }, place: txt(e.name) });
    },
    backToCampus(id) {
      const e = entries.get(id);
      const av = window.heartIslandAvatar;
      if (!e || !av?.api?.goToPoint) return;
      hidePanel();
      av.startFollow?.();
      av.api.goToPoint(e.pa.x - e.ux * 0.4, e.pa.z - e.uz * 0.4, english ? "Back to campus" : "走回校園");
    },
    // per-frame: returns true while something moved (caller marks the frame dirty)
    tick(now) {
      const dt = last ? Math.min(0.08, (now - last) / 1000) : 0;
      last = now;
      let moved = false;
      const av = window.heartIslandAvatar;
      const p = av?.S?.fig?.group?.position;
      const here = p ? onIsland(p.x, p.z) : null;
      if (here && here !== dismissedFor) showPanel(here);
      else if (!here && panelFor) hidePanel();
      if (!here) dismissedFor = null;
      if (showBoostUntil && performance.now() >= showBoostUntil) {
        showBoostUntil = 0;
        applyLights();
      }
      if (orbitState && camera && controls) {
        const { e, start, dur, a0 } = orbitState;
        const k = Math.min(1, (now - start) / dur);
        const a = a0 + k * Math.PI * 2;
        const tall = e.id === "kh-85";
        const tgt = new THREE.Vector3(e.x, tall ? 2.8 : G + 0.7, e.z);
        controls.target.copy(tgt);
        camera.position.set(e.x + Math.sin(a) * (tall ? 7.5 : 6.6), tall ? 2.2 : G + 3.4, e.z + Math.cos(a) * (tall ? 7.5 : 6.6));
        camera.lookAt(tgt);
        if (k >= 1) {
          orbitState = null;
          av?.startFollow?.();
        }
        moved = true;
      }
      if (swingPivot && swingPhase !== "closed" || (swingPivot && now > nextSwing)) {
        if (swingPhase === "closed") {
          nextSwing = now + 300000;
          swingPhase = "opening";
          swingT0 = now;
        }
        const OPEN = reduced?.matches ? 1 : 7000;
        const k = Math.min(1, (now - swingT0) / OPEN);
        if (swingPhase === "opening") {
          swingAng = (Math.PI / 2) * smooth(k);
          if (k >= 1) [swingPhase, swingT0] = ["open", now];
        } else if (swingPhase === "open") {
          if (now - swingT0 > 20000) [swingPhase, swingT0] = ["closing", now];
        } else if (swingPhase === "closing") {
          swingAng = (Math.PI / 2) * (1 - smooth(k));
          if (k >= 1) [swingPhase, swingAng] = ["closed", 0];
        }
        swingPivot.rotation.y = swingGroup.base + swingAng;
        moved = true;
      }
      if (festBoostUntil && performance.now() >= festBoostUntil) festBoostUntil = 0;
      applyLights();
      if (reduced?.matches) return moved;
      t += dt;
      showUniforms.uKhTime.value = night > 0.15 || showBoostUntil ? t : 0;
      if (tram) {
        if (tramCall) {
          const d = tramTrack.stop - tramU;
          if (Math.abs(d) > 0.01 && !tramCall.until) tramU += Math.sign(d) * Math.min(Math.abs(d), dt * 0.5);
          else {
            tramCall.until ||= now + 4500;
            if (now > tramCall.until) tramCall = null;
          }
        } else {
          tramU += tramDir * dt * 0.22;
          if (tramU > tramTrack.max) {
            tramU = tramTrack.max;
            tramDir = -1;
          } else if (tramU < tramTrack.min) {
            tramU = tramTrack.min;
            tramDir = 1;
          }
        }
        tram.position.x = tramU;
      }
      return true;
    },
  };
  applyLights();
  return api;
}

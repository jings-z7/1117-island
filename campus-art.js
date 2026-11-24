// 高餐校園景觀藝術品（戶外立體雕塑）：名稱與代碼來自總務處「校園景觀藝術品」頁面
// （https://ga.nkuht.edu.tw/p/403-1006-172-1.php?Lang=zh-tw），英文名取自國立高雄餐旅大學校區配置圖。
//
// 資料規則例外（見 CLAUDE.md「Campus art exception」）：只允許作品「名稱」「代碼」與 3D「造型」；不得寫入作者、年份、
// 材質、尺寸、典故或任何自編說明。卡片、浮動牌與名牌只顯示名稱、「高餐校園景觀藝術・代碼」與所在島嶼；不給 XP。
// scripts/sync.py --verify 會讀取下方 ART-DATA 區塊，檢查只含 id / code / name / en，且名稱與總務處清單、英文名與配置圖一致。
// 壁面浮雕（A 聚、G 飛翔的雲、H 幻相、J 書香滿行囊、K 見樹又見林）在地圖上太小難以辨識，暫不建模。
//
// 擬真（2026-11-15）：作品不再用共用的 kit 零件（單一霧面材質），改為自己的 PBR 材質桶——青銅（金屬、帶鏽色）、拋光不鏽鋼、
// 大理石、花崗岩、烤漆鋼、金箔——並用旋轉體、沿曲線的管狀體與高分段球體建模，會投射與接收陰影。
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

/* ART-DATA */
export const ART = [
  { "id": "landmark:art-b", "code": "B", "name": "迎向新世界", "en": "Forwarding to a New World" },
  { "id": "landmark:art-c", "code": "C", "name": "同心", "en": "Heart to Heart" },
  { "id": "landmark:art-d", "code": "D", "name": "有鳳來儀", "en": "Auspicious Phoenix" },
  { "id": "landmark:art-e", "code": "E", "name": "太陽之子", "en": "Son of the Sun" },
  { "id": "landmark:art-f", "code": "F", "name": "心之旅", "en": "Journey of the Heart" },
  { "id": "landmark:art-i", "code": "I", "name": "山水", "en": "Scenery" },
  { "id": "landmark:art-l", "code": "L", "name": "天體", "en": "Body" },
  { "id": "landmark:art-m", "code": "M", "name": "春風化雨", "en": "Cultivating the Youths" },
  { "id": "landmark:art-n", "code": "N", "name": "初生", "en": "Origin" },
  { "id": "landmark:art-o", "code": "O", "name": "站立與橫躺", "en": "Standing & Lying" },
  { "id": "landmark:art-p", "code": "P", "name": "黑天鵝", "en": "Black Swan" },
  { "id": "landmark:art-q", "code": "Q", "name": "裸女", "en": "Nude" },
  { "id": "landmark:art-r", "code": "R", "name": "圓融", "en": "Completeness of Life" },
  { "id": "landmark:art-s", "code": "S", "name": "溝通", "en": "Communication" },
  { "id": "landmark:art-t", "code": "T", "name": "臺灣牛", "en": "Taiwan Buffalo" },
  { "id": "landmark:art-u", "code": "U", "name": "游刃有餘", "en": "Professionalism" },
  { "id": "landmark:art-v", "code": "V", "name": "許願", "en": "Wish" },
  { "id": "landmark:art-w", "code": "W", "name": "享宴", "en": "Enjoy the Feast" },
  { "id": "landmark:art-x", "code": "X", "name": "藍霓", "en": "Blue Neon" }
];
/* END-ART-DATA */

// earlier ids → the artwork now standing in that spot (old ?focus= links keep working)
export const ART_ALIASES = {
  "landmark:welcome": "landmark:art-b",
  "landmark:phoenix": "landmark:art-d",
  "landmark:giftbox": "landmark:art-v",
  "landmark:armillary": "landmark:art-c",
  "landmark:smilearch": "landmark:art-e",
  "landmark:sommelier": "landmark:art-w",
  "landmark:ecotree": "landmark:art-x",
  giftbox: "landmark:art-v",
};

// where each piece stands: island, offset from the island centre (lawn spots clear of building footprints), overall height
export const ART_PLACE = {
  B: { island: "family", lx: 0.0, lz: 0.22, h: 0.86, fp: 0.34 },
  C: { island: "luxury", lx: 0.92, lz: -0.34, h: 1.0, fp: 0.3 },
  D: { island: "institute", lx: 0.0, lz: 0.24, h: 0.98, fp: 0.44, hero: true },
  E: { island: "civil", lx: 0.0, lz: 1.14, h: 0.66, fp: 0.26 },
  F: { island: "transport", lx: 1.0, lz: -0.36, h: 0.72, fp: 0.22 },
  I: { island: "forest", lx: -1.12, lz: -0.42, h: 0.32, fp: 0.42 },
  L: { island: "trails", lx: 0.22, lz: -1.2, h: 0.78, fp: 0.22 },
  M: { island: "card", lx: 1.15, lz: -0.3, h: 0.56, fp: 0.3 },
  N: { island: "education", lx: 1.15, lz: -0.3, h: 0.7, fp: 0.2 },
  O: { island: "renewal", lx: 1.12, lz: -0.42, h: 0.56, fp: 0.3 },
  P: { island: "innovation", lx: -1.05, lz: -0.6, h: 0.66, fp: 0.18 },
  Q: { island: "water", lx: 0.16, lz: 0.94, h: 0.56, fp: 0.26 },
  R: { island: "diplomacy", lx: 0.0, lz: -1.08, h: 0.74, fp: 0.26 },
  S: { island: "welfare", lx: 1.06, lz: -0.6, h: 0.26, fp: 0.42 },
  T: { island: "hakka", lx: 1.0, lz: -0.38, h: 0.76, fp: 0.22 },
  U: { island: "ai", lx: 1.05, lz: 0.18, h: 0.66, fp: 0.22 },
  V: { island: "youth", lx: -0.76, lz: 0.52, h: 0.78, fp: 0.36 },
  W: { island: "lunch", lx: 0.96, lz: -0.38, h: 0.58, fp: 0.3 },
  X: { island: "esg", lx: 0.92, lz: -0.34, h: 0.86, fp: 0.36 },
};


// ---------- materials: one merged mesh per bucket, colours per part (vertex colours), PBR values per bucket ----------
const MATS = {
  bronze: { metalness: 0.88, roughness: 0.4, env: 2.4 }, // patinated bronze
  steel: { metalness: 1.0, roughness: 0.14, env: 3.4, double: true }, // polished stainless steel (ribbons are single sheets)
  gold: { metalness: 0.95, roughness: 0.26, env: 2.8 },
  marble: { metalness: 0.0, roughness: 0.28, env: 1.4 }, // polished white stone
  stone: { metalness: 0.0, roughness: 0.66, env: 1.0 }, // rough stone, granite, concrete
  paint: { metalness: 0.15, roughness: 0.36, env: 1.5 }, // painted steel (red frame, blue sculpture, ox)
  plant: { metalness: 0.0, roughness: 0.9, env: 0.7 },
  water: { metalness: 0.2, roughness: 0.06, env: 2.6, transparent: true, opacity: 0.78 },
};
const BRONZE = 0x5c4d41,
  BRONZE_D = 0x3d342e,
  BRONZE_G = 0x6f7f70, // green patina
  MARBLE = 0xf3f0ea,
  WHITE = 0xf8f7f3,
  STONE = 0xcbc6bb,
  GRANITE = 0x8c7a74,
  BLACK = 0x2a2725,
  STEEL = 0xe6eaec,
  GOLD = 0xe2b64c,
  LEAF = 0x5f9a58,
  HEDGE = 0x3f7a46,
  FLOWER = 0xd8433a;

export function createCampusArt(THREE, { quality = "high" } = {}) {
  const hi = quality !== "low";
  const seg = (n) => Math.max(6, Math.round(n * (hi ? 1 : 0.55)));
  const buckets = Object.fromEntries(Object.keys(MATS).map((k) => [k, []]));
  const _m = new THREE.Matrix4(),
    _q = new THREE.Quaternion(),
    _s = new THREE.Vector3(),
    _p = new THREE.Vector3(),
    _e = new THREE.Euler(),
    _c = new THREE.Color(),
    _up = new THREE.Vector3(0, 1, 0);
  const G = {
    box: new THREE.BoxGeometry(1, 1, 1),
    sphere: new THREE.SphereGeometry(0.5, seg(30), seg(20)),
    pebble: new THREE.SphereGeometry(0.5, 10, 7), // flowers and other tiny balls
    cyl: new THREE.CylinderGeometry(0.5, 0.5, 1, seg(30)),
    cone: new THREE.ConeGeometry(0.5, 1, seg(26)),
    torus: new THREE.TorusGeometry(0.5, 0.06, seg(14), seg(60)),
    ring: new THREE.TorusGeometry(0.5, 0.14, seg(16), seg(64)),
    rock: (() => {
      const g = new THREE.IcosahedronGeometry(0.5, 2);
      const pos = g.attributes.position,
        v = new THREE.Vector3();
      for (let i = 0; i < pos.count; i++) {
        v.fromBufferAttribute(pos, i);
        const n = Math.sin(v.x * 9.3 + v.y * 17.1 + v.z * 5.7) * 0.5 + Math.sin(v.y * 23.0 - v.x * 7.0) * 0.3;
        v.multiplyScalar(1 + n * 0.09);
        pos.setXYZ(i, v.x, v.y, v.z);
      }
      g.computeVertexNormals();
      return g;
    })(),
  };
  function bake(bucket, g, color) {
    g = g.index ? g.toNonIndexed() : g;
    for (const k of Object.keys(g.attributes)) if (k !== "position" && k !== "normal") g.deleteAttribute(k);
    const n = g.attributes.position.count,
      col = new Float32Array(n * 3);
    _c.set(color);
    for (let i = 0; i < n; i++) col.set([_c.r, _c.g, _c.b], i * 3);
    g.setAttribute("color", new THREE.BufferAttribute(col, 3));
    buckets[bucket].push(g);
  }
  function add(bucket, geo, color, x, y, z, sx = 1, sy = 1, sz = 1, rx = 0, ry = 0, rz = 0) {
    const g = geo.clone();
    _m.compose(_p.set(x, y, z), _q.setFromEuler(_e.set(rx, ry, rz)), _s.set(sx, sy, sz));
    g.applyMatrix4(_m);
    bake(bucket, g, color);
  }
  function beam(bucket, color, a, b, r) {
    const A = new THREE.Vector3(...a),
      B = new THREE.Vector3(...b);
    const len = A.distanceTo(B);
    if (len < 1e-4) return;
    const g = G.cyl.clone();
    _q.setFromUnitVectors(_up, B.clone().sub(A).normalize());
    _m.compose(A.add(B).multiplyScalar(0.5), _q, _s.set(r * 2, len, r * 2));
    g.applyMatrix4(_m);
    bake(bucket, g, color);
  }
  // solid of revolution from an [r, y] profile (y from the ground up)
  function lathe(bucket, color, profile, x, y, z, sx = 1, sy = 1, sz = 1, ry = 0) {
    const g = new THREE.LatheGeometry(profile.map(([r, h]) => new THREE.Vector2(Math.max(0.0005, r), h)), seg(36));
    g.computeVertexNormals();
    add(bucket, g, color, x, y, z, sx, sy, sz, 0, ry, 0);
  }
  // tube along a smooth curve whose radius tapers from r0 to r1
  function tube(bucket, color, pts, r0, r1 = r0, tubular = 64, radial = 12) {
    const curve = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p)), false, "centripetal");
    const T = seg(tubular),
      R = seg(radial);
    const g = new THREE.TubeGeometry(curve, T, r0, R, false);
    if (r1 !== r0) {
      const pos = g.attributes.position,
        c = new THREE.Vector3(),
        v = new THREE.Vector3();
      for (let i = 0; i <= T; i++) {
        const t = i / T,
          k = (r0 + (r1 - r0) * t) / r0;
        curve.getPointAt(t, c);
        for (let j = 0; j <= R; j++) {
          const idx = i * (R + 1) + j;
          v.fromBufferAttribute(pos, idx).sub(c).multiplyScalar(k).add(c);
          pos.setXYZ(idx, v.x, v.y, v.z);
        }
      }
      g.computeVertexNormals();
    }
    bake(bucket, g, color);
  }
  // a thin twisting sheet along a curve: width swells from a point to `w` and back (a leaf / blade), turning by `twist`
  function ribbon(bucket, color, pts, w, twist = 0, steps = 40) {
    const curve = new THREE.CatmullRomCurve3(pts.map((q) => new THREE.Vector3(...q)), false, "centripetal");
    const N = seg(steps),
      pos = [],
      idx = [];
    const frames = curve.computeFrenetFrames(N, false);
    for (let i = 0; i <= N; i++) {
      const t = i / N,
        c = curve.getPointAt(t),
        half = (w / 2) * Math.pow(Math.sin(Math.PI * Math.min(1, t * 1.15)), 0.7),
        a = twist * t;
      const side = frames.binormals[i].clone().multiplyScalar(Math.cos(a)).add(frames.normals[i].clone().multiplyScalar(Math.sin(a)));
      pos.push(c.x + side.x * half, c.y + side.y * half, c.z + side.z * half, c.x - side.x * half, c.y - side.y * half, c.z - side.z * half);
      if (i < N) idx.push(i * 2, i * 2 + 1, i * 2 + 2, i * 2 + 1, i * 2 + 3, i * 2 + 2);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    g.setIndex(idx);
    g.computeVertexNormals();
    bake(bucket, g, color);
  }
  const nav = { obstacles: [] };
  const pieces = [];

  function build(code, x, z, top, fp = 0.3) {
    const T = top;
    const P = (bucket, kind, c, px, py, pz, sx, sy, sz, rx = 0, ry = 0, rz = 0) => add(bucket, G[kind], c, x + px, T + py, z + pz, sx, sy, sz, rx, ry, rz);
    const box = (bucket, c, px, py, pz, w, h, d, rx = 0, ry = 0, rz = 0) => P(bucket, "box", c, px, py + h / 2, pz, w, h, d, rx, ry, rz);
    const cyl = (bucket, c, px, py, pz, w, h, rx = 0, ry = 0, rz = 0) => P(bucket, "cyl", c, px, py + h / 2, pz, w, h, w, rx, ry, rz);
    const ball = (bucket, c, px, py, pz, sx, sy, sz, rx = 0, ry = 0, rz = 0) => P(bucket, "sphere", c, px, py, pz, sx, sy, sz, rx, ry, rz);
    const bm = (bucket, c, a, b, r) => beam(bucket, c, [x + a[0], T + a[1], z + a[2]], [x + b[0], T + b[1], z + b[2]], r);
    const tb = (bucket, c, pts, r0, r1, tubular, radial) => tube(bucket, c, pts.map(([px, py, pz]) => [x + px, T + py, z + pz]), r0, r1, tubular, radial);
    const lt = (bucket, c, profile, px, py, pz, sx = 1, sy = 1, sz = 1, ry = 0) => lathe(bucket, c, profile, x + px, T + py, z + pz, sx, sy, sz, ry);
    const rb = (bucket, c, pts, w, twist, steps) => ribbon(bucket, c, pts.map(([px, py, pz]) => [x + px, T + py, z + pz]), w, twist, steps);
    // a standing human figure: lathe torso/robe, sphere head, arms as tapered beams
    const figure = (bucket, c, px, pz, y0, h, { arms = 0, yaw = 0, robe = true } = {}) => {
      const prof = robe
        ? [[0.0, 0], [0.11, 0], [0.1, 0.08], [0.07, 0.3], [0.06, 0.42], [0.075, 0.56], [0.08, 0.66], [0.055, 0.74], [0.045, 0.76], [0, 0.76]]
        : [[0, 0], [0.05, 0], [0.055, 0.3], [0.06, 0.42], [0.08, 0.56], [0.085, 0.66], [0.06, 0.74], [0.045, 0.76], [0, 0.76]];
      lt(bucket, c, prof.map(([r, hh]) => [r * h, hh * h]), px, y0, pz, 1, 1, 0.72, yaw);
      ball(bucket, c, px, y0 + h * 0.85, pz, h * 0.14, h * 0.17, h * 0.14);
      ball(bucket, c, px, y0 + h * 0.75, pz, h * 0.05, h * 0.05, h * 0.05);
      if (arms) {
        const cs = Math.cos(yaw),
          sn = Math.sin(yaw);
        for (const s of [-1, 1]) {
          const ax = px + cs * s * h * 0.1,
            az = pz - sn * s * h * 0.1;
          bm(bucket, c, [ax, y0 + h * 0.7, az], [ax + cs * s * h * 0.16, y0 + h * 0.7 + arms * h * 0.3, az - sn * s * h * 0.16], h * 0.022);
        }
      }
    };
    const flowerBed = (r, n = 16, y = 0.0) => {
      P("plant", "cyl", LEAF, 0, y + 0.02, 0, r * 2, 0.04, r * 2);
      P("plant", "torus", HEDGE, 0, y + 0.05, 0, r * 1.72, r * 1.72, 1.1, Math.PI / 2, 0, 0);
      for (let k = 0; k < n; k++) {
        const a = (k / n) * Math.PI * 2 + 0.2;
        P("plant", "pebble", k % 3 ? FLOWER : 0xf0a23a, Math.cos(a) * r * 0.82, y + 0.08, Math.sin(a) * r * 0.82, 0.07, 0.05, 0.07);
      }
    };
    switch (code) {
      case "B": {
        // 迎向新世界: red granite base, a thick dark-bronze oval ring, two figures raising their arms, rolling scrolls below
        box("stone", 0xa44d3f, 0, 0, 0, 0.62, 0.07, 0.26);
        box("stone", 0x8f4035, 0, 0.07, 0, 0.56, 0.015, 0.22);
        P("bronze", "ring", BRONZE_D, 0, 0.52, 0, 0.68, 0.88, 0.7);
        for (let k = 0; k < 4; k++) P("bronze", "ring", BRONZE, -0.21 + k * 0.14, 0.17, 0.0, 0.15, 0.15, 0.9, 0, 0, k * 0.7);
        box("bronze", BRONZE_D, 0, 0.1, 0, 0.46, 0.06, 0.1);
        figure("bronze", BRONZE, -0.07, 0.0, 0.16, 0.46, { arms: 0.9 });
        figure("bronze", BRONZE, 0.07, 0.01, 0.16, 0.42, { arms: 0.7 });
        break;
      }
      case "C": {
        // 同心: a tall rough white stone shaft, a white figure lifting a form overhead; flower bed at its foot
        flowerBed(0.3, 12);
        lt("stone", 0xe9e5dc, [[0.0, 0], [0.13, 0], [0.11, 0.1], [0.12, 0.22], [0.09, 0.34], [0.11, 0.46], [0.085, 0.6], [0.095, 0.68], [0.06, 0.72], [0, 0.72]], 0, 0.04, 0, 1, 1, 0.8, 0.3);
        for (let k = 0; k < 6; k++) box("stone", 0xdcd7cc, Math.cos(k * 1.1) * 0.09, 0.1 + k * 0.1, Math.sin(k * 1.1) * 0.06, 0.06, 0.09, 0.04, 0, k * 0.7, 0.2);
        figure("marble", WHITE, 0, 0, 0.76, 0.3, { arms: 1.1, robe: false });
        P("marble", "torus", WHITE, 0, 1.06, 0, 0.12, 0.12, 1.2, Math.PI / 2, 0, 0);
        break;
      }
      case "D": {
        // 有鳳來儀: a dark bronze shell that spirals up out of a pale stone block and flares into a sweeping horn
        flowerBed(0.44, 22);
        box("stone", 0xdad7d0, 0, 0.03, 0, 0.32, 0.22, 0.26);
        box("stone", 0xcfccc4, 0, 0.25, 0, 0.28, 0.015, 0.22);
        const sp = [];
        for (let i = 0; i <= 18; i++) {
          const t = i / 18,
            a = -0.6 + t * Math.PI * 2.4,
            r = 0.17 - t * 0.11;
          sp.push([Math.cos(a) * r, 0.3 + t * 0.34 + Math.sin(a) * 0.02, Math.sin(a) * r * 0.75]);
        }
        tb("bronze", BRONZE_D, sp, 0.11, 0.035, 72, 14);
        tb("bronze", BRONZE, [[-0.02, 0.6, 0.0], [0.08, 0.72, 0.0], [0.17, 0.84, -0.01], [0.24, 0.95, -0.02]], 0.06, 0.012, 32, 12);
        ball("bronze", BRONZE_D, 0.0, 0.36, 0.0, 0.26, 0.18, 0.2);
        break;
      }
      case "E": {
        // 太陽之子: a smooth white upright form — a narrow foot widening into a full body, a round head on the upper left,
        // and a real heart-shaped opening through the upper body — on a low black square base
        box("stone", 0x1e1f22, 0, 0, 0, 0.36, 0.1, 0.36);
        const sh = new THREE.Shape();
        sh.moveTo(-0.05, 0);
        sh.bezierCurveTo(-0.06, 0.12, -0.24, 0.2, -0.24, 0.38);
        sh.bezierCurveTo(-0.24, 0.48, -0.18, 0.52, -0.13, 0.53);
        sh.absarc(-0.1, 0.6, 0.085, -Math.PI * 0.62, Math.PI * 0.9, false); // the head
        sh.bezierCurveTo(-0.16, 0.66, -0.06, 0.6, 0.02, 0.6);
        sh.bezierCurveTo(0.16, 0.62, 0.24, 0.52, 0.24, 0.4);
        sh.bezierCurveTo(0.24, 0.2, 0.06, 0.12, 0.05, 0);
        sh.lineTo(-0.05, 0);
        const heart = new THREE.Path();
        const hx = 0.02,
          hy = 0.36,
          hs = 0.11;
        heart.moveTo(hx, hy - hs * 0.9);
        heart.bezierCurveTo(hx - hs * 0.35, hy - hs * 0.4, hx - hs * 1.1, hy - hs * 0.1, hx - hs * 0.95, hy + hs * 0.45);
        heart.bezierCurveTo(hx - hs * 0.8, hy + hs * 0.95, hx - hs * 0.15, hy + hs * 0.95, hx, hy + hs * 0.45);
        heart.bezierCurveTo(hx + hs * 0.15, hy + hs * 0.95, hx + hs * 0.8, hy + hs * 0.95, hx + hs * 0.95, hy + hs * 0.45);
        heart.bezierCurveTo(hx + hs * 1.1, hy - hs * 0.1, hx + hs * 0.35, hy - hs * 0.4, hx, hy - hs * 0.9);
        sh.holes.push(heart);
        const g = new THREE.ExtrudeGeometry(sh, { depth: 0.08, bevelEnabled: true, bevelThickness: 0.045, bevelSize: 0.035, bevelSegments: seg(6), curveSegments: seg(18) });
        g.translate(0, 0, -0.04);
        g.computeVertexNormals();
        add("marble", g, MARBLE, x, T + 0.12, z, 1, 1, 1, 0, 0, 0);
        break;
      }
      case "F": {
        // 心之旅: a slender dark bronze figure striding on a long white stone block
        box("marble", MARBLE, 0, 0, 0, 0.36, 0.12, 0.2);
        figure("bronze", BRONZE_D, 0, 0, 0.12, 0.54, { arms: 0.2, yaw: 0.4, robe: false });
        bm("bronze", BRONZE_D, [0.06, 0.52, 0.03], [0.1, 0.72, 0.05], 0.008);
        box("bronze", BRONZE, 0.0, 0.67, 0.0, 0.14, 0.02, 0.02, 0, 0.3, 0.2);
        break;
      }
      case "I": {
        // 山水: low white stones on a platform — a mountain, an arch, a boulder
        box("marble", MARBLE, 0, 0, 0, 0.56, 0.05, 0.26);
        P("marble", "rock", WHITE, -0.14, 0.17, 0.0, 0.2, 0.26, 0.16, 0, 0.4, 0);
        P("marble", "ring", WHITE, 0.12, 0.13, 0.0, 0.18, 0.18, 0.14, 0, 0, 0);
        P("marble", "rock", 0xeeebe4, 0.25, 0.1, 0.08, 0.12, 0.1, 0.1, 0.3, 1.1, 0);
        box("marble", MARBLE, 0.16, 0.05, -0.1, 0.2, 0.03, 0.06);
        break;
      }
      case "L": {
        // 天體: white stone blocks stacked into an irregular tower
        for (const [bx, by, bz, s, r] of [
          [0, 0.0, 0, 0.18, 0.1],
          [0.05, 0.14, 0.02, 0.14, -0.2],
          [-0.05, 0.26, -0.02, 0.15, 0.3],
          [0.04, 0.39, 0.03, 0.14, -0.1],
          [-0.07, 0.5, 0.0, 0.12, 0.4],
          [0.07, 0.54, -0.03, 0.11, -0.3],
          [0.0, 0.65, 0.02, 0.12, 0.15],
        ])
          box("marble", WHITE, bx, by, bz, s, s, s, 0, r, 0);
        break;
      }
      case "M": {
        // 春風化雨: a grass mound; a large white curl like a question mark and a small egg shell beside it
        P("plant", "sphere", 0x6fa260, 0, -0.06, 0, 0.7, 0.2, 0.52);
        const curl = [];
        for (let i = 0; i <= 14; i++) {
          const a = 3.4 - (i / 14) * 4.4;
          curl.push([0.06 + Math.cos(a) * 0.14, 0.3 + Math.sin(a) * 0.16, (i / 14) * 0.03]);
        }
        curl.push([0.02, 0.16, 0.04], [0.0, 0.1, 0.04]);
        tb("marble", MARBLE, curl, 0.055, 0.075, 64, 14);
        lt("marble", WHITE, [[0, 0], [0.07, 0], [0.095, 0.05], [0.09, 0.12], [0.06, 0.19], [0.03, 0.22], [0, 0.22]], -0.2, 0.04, 0.08, 1, 1, 1, 0);
        break;
      }
      case "N": {
        // 初生: a grey stone base; two leaves opening, a twisting form and a cube tumbling off the top — green-grey bronze
        box("stone", 0xa9aca6, 0, 0, 0, 0.18, 0.3, 0.18);
        for (const s of [-1, 1]) ball("bronze", BRONZE_G, s * 0.055, 0.44, 0, 0.09, 0.28, 0.035, 0, 0, s * 0.35);
        lt("bronze", 0x7c8c7e, [[0, 0], [0.05, 0], [0.07, 0.06], [0.03, 0.14], [0.06, 0.22], [0.02, 0.3], [0, 0.32]], 0, 0.3, 0, 1, 1, 1, 0.4);
        box("bronze", BRONZE_G, -0.02, 0.6, 0, 0.08, 0.08, 0.08, 0.4, 0.5, 0.3);
        break;
      }
      case "O": {
        // 站立與橫躺: one rough dark stone figure standing, one lying beside it, on a low slab
        box("stone", 0x4a4541, 0, 0, 0, 0.6, 0.04, 0.26);
        for (const [px, py, s, r] of [
          [-0.14, 0.11, 0.14, 0.2],
          [-0.13, 0.25, 0.13, -0.3],
          [-0.15, 0.37, 0.11, 0.5],
          [-0.12, 0.47, 0.1, 0.1],
        ])
          P("stone", "rock", BLACK, px, py, 0, s, s * 1.2, s * 0.8, 0, r, 0);
        P("stone", "rock", 0x34302c, 0.15, 0.11, 0.02, 0.34, 0.12, 0.16, 0, 0.2, 0);
        P("stone", "rock", BLACK, 0.26, 0.13, 0.02, 0.1, 0.09, 0.1, 0, 0.9, 0);
        break;
      }
      case "P": {
        // 黑天鵝: a dark bronze ballerina in a tutu sitting on a stone column, legs crossed over the edge
        cyl("stone", 0x9a8270, 0, 0, 0, 0.1, 0.36);
        P("bronze", "cone", BRONZE_D, 0, 0.385, 0, 0.24, 0.05, 0.22);
        lt("bronze", BRONZE_D, [[0, 0], [0.04, 0], [0.045, 0.06], [0.055, 0.14], [0.05, 0.19], [0.03, 0.21], [0, 0.21]], 0, 0.39, 0, 1, 1, 0.75, 0);
        ball("bronze", BRONZE_D, 0, 0.63, 0.0, 0.05, 0.06, 0.05);
        bm("bronze", BRONZE_D, [0.03, 0.56, 0.0], [0.08, 0.66, 0.0], 0.008);
        bm("bronze", BRONZE_D, [-0.03, 0.56, 0.0], [-0.07, 0.5, 0.03], 0.008);
        bm("bronze", BRONZE_D, [0.0, 0.4, 0.06], [0.02, 0.24, 0.12], 0.012);
        bm("bronze", BRONZE_D, [-0.02, 0.4, 0.07], [0.0, 0.26, 0.1], 0.012);
        break;
      }
      case "Q": {
        // 裸女: a simplified seated white marble figure on a pale rock (outline only)
        P("stone", "rock", 0xd8d3c9, 0, 0.08, 0, 0.34, 0.18, 0.26, 0, 0.3, 0);
        lt("marble", MARBLE, [[0, 0], [0.07, 0], [0.065, 0.1], [0.05, 0.2], [0.055, 0.26], [0.04, 0.3], [0, 0.3]], 0, 0.16, -0.02, 1, 1, 0.8, 0);
        ball("marble", MARBLE, -0.01, 0.5, -0.02, 0.055, 0.065, 0.055);
        bm("marble", MARBLE, [0.0, 0.42, 0.0], [-0.05, 0.47, 0.03], 0.012);
        for (const s of [-1, 1]) bm("marble", MARBLE, [0.02, 0.22, s * 0.03], [0.14, 0.14, s * 0.04], 0.02);
        for (const s of [-1, 1]) bm("marble", MARBLE, [0.14, 0.14, s * 0.04], [0.16, 0.0, s * 0.04], 0.016);
        break;
      }
      case "R": {
        // 圓融: a dark purple-bronze egg with a gold-lined opening and two gold tips, on a granite plinth
        box("stone", 0xb8b2a6, 0, 0, 0, 0.32, 0.12, 0.22);
        lt("bronze", 0x4e3b4a, [[0, 0], [0.09, 0], [0.15, 0.1], [0.165, 0.22], [0.15, 0.36], [0.1, 0.46], [0.04, 0.5], [0, 0.5]], 0, 0.12, 0, 1, 1, 0.45, 0);
        P("gold", "torus", GOLD, 0, 0.4, 0.07, 0.22, 0.26, 2.0);
        ball("bronze", 0x241c22, 0, 0.4, 0.06, 0.14, 0.18, 0.05);
        ball("gold", GOLD, 0, 0.4, 0.085, 0.02, 0.02, 0.02);
        for (const s of [-1, 1]) P("gold", "cone", GOLD, s * 0.06, 0.66, 0, 0.05, 0.12, 0.04, 0, 0, s * -0.45);
        break;
      }
      case "S": {
        // 溝通: two low white stone platforms on a wooden deck, each with a smooth white form lying down, facing each other
        box("stone", 0x8a6a4c, 0, 0, 0, 0.62, 0.03, 0.32);
        for (let k = -5; k <= 5; k++) box("stone", 0x7d5f44, k * 0.056, 0.03, 0, 0.004, 0.003, 0.32);
        for (const s of [-1, 1]) {
          box("marble", WHITE, s * 0.14, 0.03, 0, 0.26, 0.08, 0.2);
          ball("marble", MARBLE, s * 0.15, 0.14, 0, 0.24, 0.06, 0.11);
          ball("marble", MARBLE, s * 0.04, 0.17, 0, 0.06, 0.07, 0.07);
        }
        break;
      }
      case "T": {
        // 臺灣牛: an abstract red-brown painted-steel ox — zigzag legs, a short body, two chrome horns
        box("stone", 0x2d2a28, 0, 0, 0, 0.24, 0.02, 0.12);
        const R = 0x8a3326;
        box("paint", R, -0.05, 0.02, 0, 0.03, 0.24, 0.03, 0, 0, 0.5);
        box("paint", R, 0.0, 0.2, 0, 0.03, 0.2, 0.03, 0, 0, -0.6);
        box("paint", R, 0.05, 0.37, 0, 0.03, 0.2, 0.03, 0, 0, 0.35);
        for (let k = 0; k < 4; k++) box("paint", 0x6e2a20, 0.06 + k * 0.004, 0.335 + k * 0.05, 0, 0.05, 0.01, 0.02);
        box("paint", 0x6e2a20, 0.0, 0.57, 0, 0.12, 0.06, 0.06);
        for (const s of [-1, 1]) P("steel", "torus", STEEL, s * 0.04, 0.69, 0, 0.09, 0.09, 1.2, Math.PI / 2, 0, s * 0.4);
        ball("paint", 0x6e2a20, 0.1, 0.06, 0, 0.05, 0.05, 0.03);
        break;
      }
      case "U": {
        // 游刃有餘: a dark steel fish wrapped in gear-like rings, on a squared stone block
        box("stone", 0x8f7c66, 0, 0, 0, 0.22, 0.26, 0.22);
        cyl("stone", 0x5a4d40, 0, 0.14, 0.112, 0.08, 0.004, Math.PI / 2);
        ball("steel", 0x3a3b3e, 0, 0.44, 0, 0.3, 0.18, 0.09);
        P("steel", "cone", 0x3a3b3e, -0.19, 0.44, 0, 0.12, 0.14, 0.04, 0, 0, Math.PI / 2);
        P("steel", "torus", 0x50525a, 0.04, 0.46, 0, 0.26, 0.26, 1.4);
        P("steel", "torus", 0x50525a, 0.08, 0.5, 0, 0.14, 0.14, 1.4, 0, 0.6, 0);
        for (let k = 0; k < 6; k++) box("steel", 0x50525a, 0.03 + Math.cos(k) * 0.14, 0.445 + Math.sin(k) * 0.14, 0, 0.03, 0.03, 0.03);
        break;
      }
      case "V": {
        // 許願: an open red gift-box frame — corner posts, ribbon bands and a purple bow on top
        const S = 0.56,
          H = 0.62,
          RED = 0xc8242c;
        for (const sx of [-1, 1]) for (const sz of [-1, 1]) box("paint", RED, (sx * S) / 2, 0, (sz * S) / 2, 0.06, H, 0.06);
        for (const sz of [-1, 1]) {
          box("paint", RED, 0, H - 0.02, (sz * S) / 2, S, 0.05, 0.05);
          box("paint", 0xa81d24, 0, 0.02, (sz * S) / 2, S, 0.04, 0.04);
          box("paint", 0xe03a3a, 0, 0, (sz * S) / 2, 0.08, H, 0.03);
        }
        for (const sx of [-1, 1]) {
          box("paint", RED, (sx * S) / 2, H - 0.02, 0, 0.05, 0.05, S);
          box("paint", 0xa81d24, (sx * S) / 2, 0.02, 0, 0.04, 0.04, S);
          box("paint", 0xe03a3a, (sx * S) / 2, 0, 0, 0.03, H, 0.08);
        }
        for (const s of [-1, 1]) P("paint", "ring", 0xb24bb0, s * 0.09, H + 0.08, 0, 0.2, 0.15, 0.6, 0, 0, s * 0.5);
        ball("paint", 0x9a3a98, 0, H + 0.04, 0, 0.06, 0.05, 0.06);
        break;
      }
      case "W": {
        // 享宴: polished stainless steel — slender blades that rise, curl outward and twist like swans' necks or leaves,
        // and two long low crescents sweeping out to either side with raised tips, on a low round base
        cyl("stone", 0x9da3a6, 0, 0, 0, 0.36, 0.05);
        const blades = [
          [0.0, 0.62, 0.0, 1.6],
          [0.9, 0.5, 0.06, -1.3],
          [2.0, 0.56, -0.04, 1.2],
          [3.1, 0.46, 0.05, -1.5],
          [4.2, 0.52, 0.0, 1.4],
          [5.3, 0.44, -0.05, -1.1],
        ];
        for (const [a, hgt, lean, tw] of blades) {
          const ca = Math.cos(a),
            sa = Math.sin(a);
          const P = (r, y) => [ca * r, 0.05 + y, sa * r];
          rb("steel", STEEL, [P(0.02, 0), P(0.05 + lean, hgt * 0.35), P(0.12, hgt * 0.72), P(0.24, hgt * 0.95), P(0.32, hgt * 0.86)], 0.08, tw, 40);
        }
        for (const sd of [-1, 1]) {
          const pts = [];
          for (let i = 0; i <= 10; i++) {
            const t = i / 10;
            pts.push([sd * (0.06 + t * 0.62), 0.07 + 0.05 * Math.sin(t * Math.PI) + (t > 0.82 ? (t - 0.82) * 1.1 : 0), -0.05 + 0.18 * Math.sin(t * Math.PI * 0.9)]);
          }
          tb("steel", 0xeef1f3, pts, 0.022, 0.006, 48, 10);
          rb("steel", 0xf4f6f7, pts.map(([px, py, pz]) => [px, py + 0.02, pz]), 0.05, sd * 0.6, 32);
        }
        break;
      }
      case "X": {
        // 藍霓: a small pond with a stone rim; a slender blue painted-steel spiral rising from the middle, boulders by the edge
        cyl("stone", 0xaaa69c, 0, 0, 0, 0.74, 0.03);
        P("water", "cyl", 0x3f8f99, 0, 0.034, 0, 0.64, 0.01, 0.64);
        const hel = [];
        for (let i = 0; i <= 20; i++) {
          const t = i / 20,
            a = t * Math.PI * 2.6;
          hel.push([Math.cos(a) * 0.05 * (1 - t * 0.4), 0.04 + t * 0.7, Math.sin(a) * 0.05 * (1 - t * 0.4)]);
        }
        tb("paint", 0x2b56a8, hel, 0.035, 0.022, 72, 12);
        P("paint", "torus", 0x3c6fc4, 0, 0.76, 0, 0.16, 0.1, 1.0, 0.3, 0, 0.2);
        ball("paint", 0x1e3f86, 0, 0.68, 0, 0.05, 0.05, 0.05);
        P("stone", "rock", 0x8a857c, 0.28, 0.06, 0.18, 0.16, 0.12, 0.12);
        P("stone", "rock", 0x7c776f, -0.3, 0.05, -0.1, 0.12, 0.09, 0.1);
        break;
      }
    }
    nav.obstacles.push({ type: "circle", island: null, owner: "campus-art", x, z, r: Math.max(0.12, fp * 0.8) });
    pieces.push({ id: "landmark:art-" + code.toLowerCase(), x, z });
  }

  const meshes = [];
  function finish(scene) {
    const group = new THREE.Group();
    group.name = "campus-art";
    const resolve = (pt) => {
      let best = null,
        bd = Infinity;
      for (const p of pieces) {
        const d = Math.hypot(pt.x - p.x, pt.z - p.z);
        if (d < bd) [best, bd] = [p.id, d];
      }
      return best;
    };
    for (const [k, list] of Object.entries(buckets)) {
      if (!list.length) continue;
      const merged = mergeGeometries(list, false);
      list.forEach((g) => g.dispose());
      if (!merged) continue;
      merged.computeBoundingSphere();
      const spec = MATS[k];
      const mat = new THREE.MeshStandardMaterial({ vertexColors: true, metalness: spec.metalness, roughness: spec.roughness, transparent: !!spec.transparent, opacity: spec.opacity ?? 1, side: spec.double ? THREE.DoubleSide : THREE.FrontSide });
      mat.userData.noPalette = true;
      mat.userData.fxEnvScale = spec.env;
      const mesh = new THREE.Mesh(merged, mat);
      mesh.name = "campus-art-" + k;
      mesh.castShadow = k !== "water" && k !== "plant";
      mesh.receiveShadow = true;
      mesh.matrixAutoUpdate = false;
      mesh.userData = { type: "landmarkMesh", id: null, resolve };
      group.add(mesh);
      meshes.push(mesh);
    }
    Object.values(G).forEach((g) => g.dispose());
    scene.add(group);
    return meshes;
  }
  return { build, finish, nav, meshes, pieces };
}

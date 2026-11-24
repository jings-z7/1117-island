// 遊艇碼頭（2026-11-15）：實習島西角渡輪碼頭旁的遊艇港池。純造景與遊戲——不代表任何真實設施，不寫任何事實或數字，
// 不開系所卡片。
//   planMarina(...)  → 建造前呼叫：用 kit 零件畫出棧橋、浮動碼頭、售票亭、排隊欄杆、停泊帆船與燈，回傳碼頭幾何
//   startMarina(...) → 建造後呼叫：遊艇沿群島外圍閉合航線航行（碼頭 → 駁二港灣島 → 碼頭，各停靠 12 秒）、
//                      NPC 乘客排隊依序登船、玩家可排隊上船、在船上揮手、到站下船；回傳步道（給 heart-me 路網）
// 移動物件不進靜態陰影；開啟「減少動態」時遊艇照常航行，但乘客直接換位、船身不搖晃。

const DOCK_S = 12; // seconds at each stop
// sailing speed (world units / s); ?marinaSpeed=N speeds it up for QA only
const VMAX = 1.15 * Math.min(40, Math.max(1, Number(new URLSearchParams(location.search).get("marinaSpeed")) || 1));
const SEATS = [
  [-0.11, -0.42],
  [0.11, -0.42],
  [-0.11, -0.2],
  [0.11, -0.2],
  [0, -0.6],
]; // yacht-local (x, z) on the aft deck; bow is +z
const NPC_N = 5;
const PASSENGER_LOOKS = [
  { role: "student", outfit: "nkuht-polo" },
  { role: "student" },
  { role: "intern", outfit: "nkuht-polo" },
  { role: "visitor" },
  { role: "student" },
  { role: "intern" },
];

export function planMarina(THREE, { kit, top, center, R, h01, hexVertex, waterY }) {
  // the island corner nearest 海外實習 (the ferry pier from 第三期 starts there too); corners never carry bridges
  let best = 0,
    bd = Infinity;
  for (let k = 0; k < 6; k++) {
    const [vx, vz] = hexVertex(center.x, center.z, R, k);
    const d = Math.hypot(vx - h01.x, vz - h01.z);
    if (d < bd) (bd = d), (best = k);
  }
  const [vx, vz] = hexVertex(center.x, center.z, R, best);
  const o = { x: (vx - center.x) / R, z: (vz - center.z) / R }; // outward
  const p = { x: -o.z, z: o.x }; // along the shore; the ferry lies on +p, the marina on −p
  const at = (u, v) => ({ x: vx + o.x * u + p.x * v, z: vz + o.z * u + p.z * v });
  const yaw = Math.atan2(o.x, o.z);
  const pierY = top - 0.12; // existing ferry pier deck
  const floatY = waterY + 0.12; // floating pontoon deck
  const P0 = at(1.24, 0); // ferry pier head
  const ramp = [at(1.24, -0.18), at(1.24, -1.05)]; // ramp down from the pier head to the pontoon
  const pont = [at(1.24, -1.05), at(1.24, -4.6)]; // floating pontoon along the shore (rental berths at its far end)
  // two long spines run out to sea from the shore pontoon; the yacht berths in the channel between them
  const SPINE_A = -1.6,
    SPINE_B = -3.4,
    SPINE_END = 5.6;
  const berth = at(2.75, -1.98); // yacht centre when docked, heading out to sea (+o), alongside spine A
  const gang = at(2.75, SPINE_A - 0.12); // gangway foot on spine A
  const kiosk = at(1.0, -1.25);

  const C = { deck: 0x8d6f53, deck2: 0x9a7b5e, float: 0xd9d2c2, post: 0x5b4634, steel: 0x2f3a3c, rope: 0xd8c9a2, white: 0xf6f3ec, navy: 0x1f3550, brass: 0xc8a052, red: 0xb23a3a };
  const own = "district:marina"; // palette-exempt (colours here are already chosen)
  const box = (q, y, w, h, d, c, ry = yaw) => kit.hbox(q.x, y, q.z, w, h, d, c, own, [0, ry, 0]);
  // ramp: planks stepping down
  for (let k = 0; k <= 8; k++) {
    const t = k / 8;
    const q = { x: ramp[0].x + (ramp[1].x - ramp[0].x) * t, z: ramp[0].z + (ramp[1].z - ramp[0].z) * t };
    box(q, pierY + (floatY - pierY) * t, 0.3, 0.022, 0.13, k % 2 ? C.deck : C.deck2);
  }
  for (const s of [-1, 1]) {
    // ramp handrails
    const a = { x: ramp[0].x + o.x * s * 0.15, z: ramp[0].z + o.z * s * 0.15 },
      b = { x: ramp[1].x + o.x * s * 0.15, z: ramp[1].z + o.z * s * 0.15 };
    const m = { x: (a.x + b.x) / 2, z: (a.z + b.z) / 2 };
    const len = Math.hypot(b.x - a.x, b.z - a.z),
      rise = pierY - floatY;
    kit.hbox(m.x, (pierY + floatY) / 2 + 0.16, m.z, 0.02, 0.02, Math.hypot(len, rise), C.steel, own, [Math.atan2(rise, len) * -1, Math.atan2(b.x - a.x, b.z - a.z), 0]);
  }
  // floating pontoon: deck boards, white floats, cleats, lamps, life ring
  const n = 28;
  for (let k = 0; k < n; k++) {
    const t = (k + 0.5) / n;
    const q = { x: pont[0].x + (pont[1].x - pont[0].x) * t, z: pont[0].z + (pont[1].z - pont[0].z) * t };
    box(q, floatY, 0.42, 0.03, 0.125, k % 2 ? C.deck : C.deck2, yaw + Math.PI / 2);
    box(q, floatY - 0.05, 0.4, 0.06, 0.11, C.float, yaw + Math.PI / 2);
  }
  for (const v of [-1.2, -1.7, -2.2, -2.65]) {
    const q = at(1.42, v);
    kit.cyl(q.x, floatY + 0.035, q.z, 0.035, 0.05, C.steel, own);
  }
  for (const v of [-1.1, -2.7]) {
    const q = at(1.08, v);
    kit.cyl(q.x, floatY + 0.2, q.z, 0.016, 0.4, C.steel, own);
    kit.bulb(q.x, floatY + 0.42, q.z, 0.035);
  }
  {
    const q = at(1.06, -2.45);
    kit.part("torus", [q.x, floatY + 0.12, q.z], [0.11, 0.11, 0.22], C.red, own, [0, yaw, 0]);
  }
  // queue rails: three short switchbacks on the pontoon (posts + a rope), the line runs toward the gangway
  for (const u of [1.24]) {
    for (let k = 0; k < 6; k++) {
      const q = at(u, -1.15 - k * 0.15);
      kit.cyl(q.x, floatY + 0.07, q.z, 0.014, 0.12, C.brass, own);
    }
    const a = at(u, -1.15),
      b = at(u, -1.9);
    box({ x: (a.x + b.x) / 2, z: (a.z + b.z) / 2 }, floatY + 0.12, 0.008, 0.008, 0.75, C.rope, yaw + Math.PI / 2);
  }
  // ticket kiosk: small white booth with an emerald roof and brass trim
  kit.box(kiosk.x, floatY + 0.13, kiosk.z, 0.22, 0.24, 0.18, C.white, own, [0, yaw, 0]);
  kit.part("glowbox", [kiosk.x + o.x * 0.092, floatY + 0.16, kiosk.z + o.z * 0.092], [0.15, 0.07, 0.01], 0x9fc4c6, own, [0, yaw, 0]);
  kit.part("hip", [kiosk.x, floatY + 0.3, kiosk.z], [0.28, 0.1, 0.24], 0x2f5f52, own, [0, yaw, 0]);
  // ---- the marina basin: spines, finger piers, dark piles, feather flags and a full house of moored boats ----
  const spine = (v, u0, u1) => {
    const len = u1 - u0,
      m = at((u0 + u1) / 2, v);
    box(m, floatY, 0.2, 0.03, len, 0xe9e6de);
    box(m, floatY - 0.045, 0.18, 0.05, len, C.float);
  };
  spine(SPINE_A, 1.45, SPINE_END);
  spine(SPINE_B, 1.45, SPINE_END);
  // T-heads at the sea end for the big yachts
  for (const v of [SPINE_A, SPINE_B]) {
    const q = at(SPINE_END, v);
    box(q, floatY, 1.2, 0.03, 0.2, 0xe9e6de, yaw + Math.PI / 2);
  }
  const pile = (q) => kit.cyl(q.x, floatY + 0.06, q.z, 0.045, 0.38, 0x23292b, own);
  const finger = (u, v, side, len) => {
    const q = at(u, v + side * (0.1 + len / 2));
    box(q, floatY - 0.005, len, 0.025, 0.09, 0xe9e6de, yaw + Math.PI / 2);
    pile(at(u, v + side * (0.12 + len)));
  };
  // boat builders (bow = +o for boats berthed bow-out, i.e. along u)
  const HULL = [0xf7f5ef, 0xf3f1ea, 0x1f2a3a, 0xf7f5ef, 0xe8e2d4, 0x2b3a4a];
  const moor = (u, v, kind, k, ry = yaw) => {
    const q = at(u, v),
      wy = waterY;
    const hull = HULL[k % HULL.length],
      trim = k % 3 === 0 ? C.navy : k % 3 === 1 ? 0x8a2f35 : 0x2f5f52;
    const dir = { x: Math.sin(ry), z: Math.cos(ry) };
    const off = (d) => ({ x: q.x + dir.x * d, z: q.z + dir.z * d });
    if (kind === "big") {
      // motor yacht: long hull, two decks of cabin, dark glass band, flybridge
      kit.box(q.x, wy + 0.08, q.z, 0.4, 0.16, 1.25, hull, own, [0, ry, 0]);
      kit.part("tetra", [off(0.72).x, wy + 0.08, off(0.72).z], [0.4, 0.3, 0.16], hull, own, [Math.PI / 2, ry, Math.PI / 4]);
      kit.hbox(q.x, wy + 0.03, q.z, 0.41, 0.03, 1.26, trim, own, [0, ry, 0]);
      kit.box(off(0.05).x, wy + 0.24, off(0.05).z, 0.3, 0.14, 0.62, 0xfbfaf6, own, [0, ry, 0]);
      kit.part("glowbox", [off(0.05).x, wy + 0.25, off(0.05).z], [0.31, 0.05, 0.56], 0x22394a, own, [0, ry, 0]);
      kit.box(off(-0.05).x, wy + 0.36, off(-0.05).z, 0.24, 0.08, 0.36, 0xfbfaf6, own, [0, ry, 0]);
    } else if (kind === "small") {
      // day cruiser / RIB with a coloured bimini
      kit.box(q.x, wy + 0.05, q.z, 0.22, 0.09, 0.56, hull, own, [0, ry, 0]);
      kit.part("tetra", [off(0.32).x, wy + 0.05, off(0.32).z], [0.22, 0.16, 0.09], hull, own, [Math.PI / 2, ry, Math.PI / 4]);
      kit.hbox(off(-0.05).x, wy + 0.17, off(-0.05).z, 0.2, 0.012, 0.2, [C.navy, 0x8a2f35, 0x2f6f86][k % 3], own, [0, ry, 0]);
      for (const sx of [-1, 1]) kit.hbox(off(-0.05).x + Math.cos(ry) * sx * 0.09, wy + 0.13, off(-0.05).z - Math.sin(ry) * sx * 0.09, 0.008, 0.08, 0.008, 0xd9dde0, own);
    } else {
      // sailboat: slim hull, cabin top, tall mast, boom with a furled (navy) sail cover
      kit.box(q.x, wy + 0.06, q.z, 0.24, 0.1, 0.86, hull, own, [0, ry, 0]);
      kit.part("tetra", [off(0.5).x, wy + 0.06, off(0.5).z], [0.24, 0.22, 0.1], hull, own, [Math.PI / 2, ry, Math.PI / 4]);
      kit.box(off(0.05).x, wy + 0.15, off(0.05).z, 0.16, 0.07, 0.32, 0xf6f3ec, own, [0, ry, 0]);
      const mh = 1.0 + (k % 3) * 0.18;
      kit.cyl(off(0.12).x, wy + 0.1 + mh / 2, off(0.12).z, 0.014, mh, 0xe9ecef, own);
      kit.hbox(off(-0.12).x, wy + 0.24, off(-0.12).z, 0.035, 0.035, 0.46, k % 2 ? C.navy : 0x2f6f86, own, [0, ry, 0]);
    }
  };
  const boats = [];
  const KINDS = ["sail", "big", "small", "sail", "small", "sail", "big", "sail"];
  // spine A: fingers and boats on its shore side (+v), bow out; spine B: on its outer side (−v)
  // boats lie alongside the fingers (parallel to them, bow away from the spine), one per slip, like a real marina
  const yawPlusV = Math.atan2(p.x, p.z),
    yawMinusV = Math.atan2(-p.x, -p.z);
  let bk = 0;
  for (let u = 1.9; u < SPINE_END - 0.4; u += 0.42) {
    const kindA = KINDS[bk % KINDS.length] === "big" ? "small" : KINDS[bk % KINDS.length];
    finger(u, SPINE_A, +1, 0.46);
    moor(u + 0.21, SPINE_A + (kindA === "sail" ? 0.5 : 0.36), kindA, bk, yawPlusV);
    bk++;
    const kindB = KINDS[(bk + 3) % KINDS.length] === "big" ? "sail" : KINDS[(bk + 3) % KINDS.length];
    finger(u, SPINE_B, -1, 0.46);
    moor(u + 0.21, SPINE_B - (kindB === "sail" ? 0.5 : 0.36), kindB, bk + 5, yawMinusV);
    boats.push(at(u, SPINE_B - 0.36));
    bk++;
  }
  // big yachts on the T-heads
  moor(SPINE_END + 0.35, SPINE_A + 0.1, "big", 2, yaw + Math.PI / 2);
  moor(SPINE_END + 0.35, SPINE_B - 0.2, "big", 5, yaw + Math.PI / 2);
  // piles along the channel side of both spines, and navy feather flags (HTL only, no other names)
  for (let u = 1.7; u < SPINE_END; u += 0.7) {
    pile(at(u, SPINE_A - 0.14));
    pile(at(u, SPINE_B + 0.14));
  }
  for (const [u, v] of [
    [1.6, SPINE_A],
    [3.2, SPINE_A],
    [1.6, SPINE_B],
    [3.2, SPINE_B],
    [SPINE_END, SPINE_A],
    [SPINE_END, SPINE_B],
  ]) {
    const q = at(u, v);
    kit.cyl(q.x, floatY + 0.35, q.z, 0.012, 0.7, 0xd9dde0, own);
    kit.hbox(q.x + p.x * 0.05, floatY + 0.48, q.z + p.z * 0.05, 0.012, 0.42, 0.09, C.navy, own, [0, yaw + Math.PI / 2, 0.08]);
  }
  // lamps along the spines
  for (const v of [SPINE_A, SPINE_B])
    for (let u = 2.3; u < SPINE_END; u += 1.4) {
      const q = at(u, v + (v === SPINE_A ? -0.08 : 0.08));
      kit.cyl(q.x, floatY + 0.16, q.z, 0.012, 0.32, C.steel, own);
      kit.bulb(q.x, floatY + 0.33, q.z, 0.03);
    }
  // extent of the whole basin (for the camera bounds)
  const extents = [at(SPINE_END + 1.2, SPINE_A + 0.8), at(SPINE_END + 1.2, SPINE_B - 1.2), at(0, SPINE_B - 1.2)].map((q) => ({ ...q, r: 0.6 }));
  // rental berths (sailboat, speedboat) seaward of the pontoon's far end, and a short rental queue on the pontoon
  const rentBerths = [at(1.66, -3.85), at(1.66, -4.35)];
  const rentQueue = [at(1.24, -3.95), at(1.24, -3.7), at(1.24, -3.45)];
  {
    const q = at(1.06, -4.15);
    kit.box(q.x, floatY + 0.11, q.z, 0.18, 0.2, 0.16, C.white, own, [0, yaw, 0]);
    kit.part("hip", [q.x, floatY + 0.25, q.z], [0.24, 0.08, 0.22], C.navy, own, [0, yaw, 0]);
  }
  for (const b of rentBerths) {
    kit.cyl(b.x - o.x * 0.3 + p.x * 0.22, floatY + 0.06, b.z - o.z * 0.3 + p.z * 0.22, 0.045, 0.38, 0x23292b, own);
    kit.cyl(b.x - o.x * 0.3 - p.x * 0.22, floatY + 0.06, b.z - o.z * 0.3 - p.z * 0.22, 0.045, 0.38, 0x23292b, own);
  }
  return { vx, vz, o, p, at, yaw, pierY, floatY, P0, ramp, pont, berth, gang, kiosk, boats, center, top, SPINE_A, SPINE_B, SPINE_END, extents, rentBerths, rentQueue };

}

export function startMarina(THREE, plan, { scene, camera, frameHooks, waterY, campus, skylineNav, bounds, english = false, reduced, CSS2DObject, lands: landList = null, heightAt = null }) {
  const tr = (zh, en) => (english ? en : zh);
  const { o, p, at, floatY } = plan;
  const _v = new THREE.Vector3();

  // ---- route: berth → out to sea → around the archipelago → 駁二 港灣島 stop → around → back to the berth ----
  const pier2 = (skylineNav?.islands || []).find((i) => i.id === "kh-pier2") || null;
  const cx = (bounds.minX + bounds.maxX) / 2,
    cz = (bounds.minZ + bounds.maxZ) / 2;
  const rx = (bounds.maxX - bounds.minX) / 2 + 0.6,
    rz = (bounds.maxZ - bounds.minZ) / 2 + 0.6;
  const ell = (a) => new THREE.Vector3(cx + Math.cos(a) * rx, waterY, cz + Math.sin(a) * rz);
  const B = new THREE.Vector3(plan.berth.x, waterY, plan.berth.z);
  // out along the channel between the spines (seaward, +o), back in on its far lane, U-turn at the shore end
  const W = (u, v) => {
    const q = at(u, v);
    return new THREE.Vector3(q.x, waterY, q.z);
  };
  const midV = (plan.SPINE_A + plan.SPINE_B) / 2;
  const out1 = W(plan.SPINE_END - 0.4, -2.05);
  const out2 = W(plan.SPINE_END + 1.8, midV - 0.2);
  const back1 = W(plan.SPINE_END + 1.6, midV - 0.75);
  const backIn = W(plan.SPINE_END - 0.6, plan.SPINE_B + 0.55);
  const turn1 = W(1.9, plan.SPINE_B + 0.65);
  const back2 = W(1.75, -2.2);
  let S2 = null,
    S2land = null;
  if (pier2) {
    const dx = pier2.x - cx,
      dz = pier2.z - cz,
      L = Math.hypot(dx, dz) || 1;
    const ux = dx / L,
      uz = dz / L;
    S2 = new THREE.Vector3(pier2.x + ux * (pier2.r * 0.87 + 0.55), waterY, pier2.z + uz * (pier2.r * 0.87 + 0.55));
    S2land = { x: pier2.x + ux * pier2.r * 0.5, z: pier2.z + uz * pier2.r * 0.5 };
  }
  const aOf = (q) => Math.atan2(q.z - cz, q.x - cx);
  const aB = aOf(out2);
  const aS = S2 ? aOf(S2) : aB + Math.PI;
  const norm = (a) => ((a % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
  const pts = [B, out1, out2];
  const sweep = (a0, a1, skipNear) => {
    let span = norm(a1 - a0);
    if (span < 0.3) span += Math.PI * 2;
    for (let a = 0.35; a < span - 0.3; a += 0.32) pts.push(ell(a0 + a));
  };
  let iS = -1;
  if (S2) {
    sweep(aB, aS);
    const t1 = new THREE.Vector3().subVectors(S2, ell(aS - 0.25)).setY(0).normalize();
    pts.push(new THREE.Vector3().copy(S2).addScaledVector(t1, -0.9));
    iS = pts.length;
    pts.push(S2.clone());
    pts.push(new THREE.Vector3().copy(S2).addScaledVector(t1, 0.9));
    sweep(aS, aOf(back1));
  } else sweep(aB, aOf(back1));
  pts.push(back1, backIn, turn1, back2);
  const curve = new THREE.CatmullRomCurve3(pts, true, "centripetal", 0.5);
  const SAMPLES = 900;
  const lut = curve.getSpacedPoints(SAMPLES); // arc-length spaced
  const total = curve.getLength();
  const uAtPoint = (q) => {
    let bi = 0,
      bd = Infinity;
    for (let i = 0; i < lut.length; i++) {
      const d = lut[i].distanceToSquared(q);
      if (d < bd) (bd = d), (bi = i);
    }
    return bi / SAMPLES;
  };
  const stops = [{ u: uAtPoint(B), id: "berth" }];
  if (S2) stops.push({ u: uAtPoint(S2), id: "pier2" });

  // ---- yacht (bow = local +z) ----
  const yacht = new THREE.Group();
  const M = (c, o2 = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.5, metalness: 0.05, ...o2 });
  const hullShape = new THREE.Shape();
  hullShape.moveTo(-0.24, -0.72);
  hullShape.lineTo(0.24, -0.72);
  hullShape.lineTo(0.26, 0.2);
  hullShape.quadraticCurveTo(0.2, 0.62, 0, 0.84);
  hullShape.quadraticCurveTo(-0.2, 0.62, -0.26, 0.2);
  hullShape.closePath();
  const extr = (sh, depth, bevel = 0.015) => new THREE.ExtrudeGeometry(sh, { depth, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 1, curveSegments: 10 }).rotateX(Math.PI / 2);
  const hull = new THREE.Mesh(extr(hullShape, 0.16), M(0xf7f5ef));
  hull.position.y = 0.17;
  const band = new THREE.Mesh(extr(hullShape, 0.03, 0.02), M(0x1f3550));
  band.position.y = 0.06;
  const deckSh = new THREE.Shape(hullShape.getPoints(24).map((v) => new THREE.Vector2(v.x * 0.9, v.y * 0.93)));
  const deck = new THREE.Mesh(extr(deckSh, 0.012, 0.004), M(0xa27f5c, { roughness: 0.8 }));
  deck.position.y = 0.185;
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.15, 0.5), M(0xfbfaf6));
  cabin.position.set(0, 0.27, 0.12);
  const glass = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.06, 0.46), M(0x203a48, { roughness: 0.15, metalness: 0.4 }));
  glass.position.set(0, 0.29, 0.12);
  const fly = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.08, 0.3), M(0xfbfaf6));
  fly.position.set(0, 0.385, 0.06);
  const screen = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.05, 0.02), M(0x203a48, { roughness: 0.15, metalness: 0.4 }));
  screen.position.set(0, 0.45, 0.2);
  screen.rotation.x = -0.4;
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.16, 6), M(0xc8a052, { metalness: 0.5 }));
  mast.position.set(0, 0.5, 0.0);
  yacht.add(hull, band, deck, cabin, glass, fly, screen, mast);
  // rails along both sides of the aft deck
  const railMat = M(0xd9dde0, { metalness: 0.6, roughness: 0.3 });
  for (const s of [-1, 1]) {
    const r = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.008, 0.78), railMat);
    r.position.set(s * 0.215, 0.27, -0.3);
    yacht.add(r);
    for (let k = 0; k < 5; k++) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.08, 0.008), railMat);
      post.position.set(s * 0.215, 0.23, -0.66 + k * 0.17);
      yacht.add(post);
    }
  }
  // name board on the stern: only "HTL"
  {
    const cv = document.createElement("canvas");
    cv.width = 128;
    cv.height = 32;
    const g = cv.getContext("2d");
    g.fillStyle = "#f7f5ef";
    g.fillRect(0, 0, 128, 32);
    g.fillStyle = "#1f3550";
    g.font = "700 22px Georgia, serif";
    g.textAlign = "center";
    g.fillText("HTL", 64, 24);
    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    const nb = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.05), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6 }));
    nb.position.set(0, 0.12, -0.735);
    nb.rotation.y = Math.PI;
    yacht.add(nb);
  }
  // running lights (night)
  const lightMat = new THREE.MeshBasicMaterial({ color: 0xfff2c8, transparent: true, opacity: 0 });
  const navR = new THREE.MeshBasicMaterial({ color: 0xff4040, transparent: true, opacity: 0 }),
    navG = new THREE.MeshBasicMaterial({ color: 0x40ff80, transparent: true, opacity: 0 });
  const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 6), lightMat);
  lamp.position.set(0, 0.6, 0);
  const lr = new THREE.Mesh(new THREE.SphereGeometry(0.018, 6, 4), navR);
  lr.position.set(-0.2, 0.25, 0.4);
  const lg = new THREE.Mesh(new THREE.SphereGeometry(0.018, 6, 4), navG);
  lg.position.set(0.2, 0.25, 0.4);
  yacht.add(lamp, lr, lg);
  yacht.traverse((m) => {
    m.castShadow = false;
    m.receiveShadow = false;
    if (m.material) m.material.userData.noPalette = true;
  });
  scene.add(yacht);
  const DECK_Y = 0.195;
  const seatWorld = (k, out = new THREE.Vector3()) => out.set(SEATS[k][0], DECK_Y, SEATS[k][1]).applyMatrix4(yacht.matrixWorld);

  // ---- yacht motion: dock 12 s at each stop, sail between them with ease-in / ease-out ----
  // the first departure waits until the passengers exist and have boarded
  const st = { u: stops[0].u, phase: "dock", stop: 0, until: Infinity, from: stops[0].u, to: stops[0].u, onDock: null };
  const fwd = (a, b) => (((b - a) % 1) + 1) % 1; // forward distance along the loop (0..1)
  function moveYacht(now, dt) {
    if (st.phase === "dock") {
      if (now >= st.until) {
        const next = (st.stop + 1) % stops.length;
        st.phase = "sail";
        st.from = st.u;
        st.to = stops[next].u;
        st.next = next;
        events.depart(stops[st.stop].id);
      }
    } else {
      const span = fwd(st.from, st.to) * total;
      const done = fwd(st.from, st.u) * total;
      const left = span - done;
      const v = VMAX * Math.max(0.12, Math.min(1, (done + 0.15) / 1.2, (left + 0.05) / 1.6));
      const step = (v * dt) / total;
      if (left <= v * dt + 0.002) {
        st.u = st.to;
        st.phase = "dock";
        st.stop = st.next;
        st.until = now + DOCK_S * 1000;
        events.arrive(stops[st.stop].id);
      } else st.u = (st.u + step) % 1;
    }
    const pt = curve.getPointAt(st.u, _v);
    const tg = curve.getTangentAt(st.u);
    const t = now / 1000;
    const calm = reduced?.matches;
    yacht.position.set(pt.x, waterY + (calm ? 0 : Math.sin(t * 1.3) * 0.01), pt.z);
    yacht.rotation.set(calm ? 0 : Math.sin(t * 0.9) * 0.012, Math.atan2(tg.x, tg.z), calm ? 0 : Math.sin(t * 1.1 + 1) * 0.02);
    yacht.updateMatrixWorld();
  }

  // ---- passengers (NPCs) and the queue ----
  const pontDir = { x: plan.pont[1].x - plan.pont[0].x, z: plan.pont[1].z - plan.pont[0].z };
  // k = 0 is the front of the line (nearest the gangway): three places on the seaward lane, then three back along the
  // inner lane (a switchback between the rope rails), then by the kiosk
  const slot = (k) => {
    // along spine A from the gangway back to the shore, then along the shore pontoon by the kiosk
    if (k < 4) return at(2.5 - k * 0.26, plan.SPINE_A);
    if (k < 7) return at(1.24, plan.SPINE_A - 0.3 - (k - 4) * 0.26);
    return at(1.12, -1.2);
  };
  const tail = at(1.08, -1.0);
  const npcs = [];
  let figReady = false;
  const lookFor = (k) => {
    const av = window.heartIslandAvatar;
    const base = { ...(av?.DEFAULT_LOOK || {}), ...PASSENGER_LOOKS[k % PASSENGER_LOOKS.length] };
    const hair = ["#2b2220", "#3b2b25", "#1d1a1a", "#5a3d2b"][k % 4],
      skin = ["#f1c7a3", "#e0ac85", "#c68863"][k % 3];
    return { ...base, name: "", hair, skin, shirt: base.outfit ? base.shirt : ["#26324d", "#fafbfd", "#2b2e35", "#9a9ea6"][k % 4] };
  };
  function makeNpc(k) {
    const av = window.heartIslandAvatar;
    const fig = av.buildFigure(lookFor(k));
    av.applyFigScale(fig);
    fig.group.traverse((m) => (m.castShadow = false));
    if (fig.ring) fig.ring.visible = false;
    if (fig.pin) fig.pin.visible = false;
    scene.add(fig.group);
    return { k, fig, state: "queue", slot: k, pos: { ...slot(k) }, y: floatY + 0.02, path: null, seat: -1, phase: Math.random() * 6 };
  }
  // walk a figure along a few points; legs swing while it walks
  const walkTo = (n, list, then) => {
    n.path = { pts: list, i: 0, then };
  };
  function stepNpc(n, dt, t) {
    const g = n.fig.group;
    if (n.state === "aboard" && n.seat >= 0) {
      seatWorld(n.seat, _v);
      g.position.copy(_v);
      g.rotation.y = yacht.rotation.y + Math.PI;
      for (const l of n.fig.legs || []) l.rotation.x = 0;
      return;
    }
    let moving = false;
    if (n.path) {
      const tgt = n.path.pts[n.path.i];
      if (reduced?.matches) {
        n.pos = { x: tgt.x, z: tgt.z };
        n.y = tgt.y;
        n.path.i++;
      } else {
        const dx = tgt.x - n.pos.x,
          dz = tgt.z - n.pos.z,
          d = Math.hypot(dx, dz);
        const sp = 0.55 * dt;
        if (d <= sp) {
          n.pos = { x: tgt.x, z: tgt.z };
          n.y = tgt.y;
          n.path.i++;
        } else {
          n.pos.x += (dx / d) * sp;
          n.pos.z += (dz / d) * sp;
          n.y += (tgt.y - n.y) * Math.min(1, dt * 4);
          g.rotation.y = Math.atan2(dx, dz);
          moving = true;
        }
      }
      if (n.path.i >= n.path.pts.length) {
        const then = n.path.then;
        n.path = null;
        then?.();
      }
    }
    g.position.set(n.pos.x, n.y, n.pos.z);
    const sw = moving ? Math.sin(t * 9 + n.phase) * 0.6 : 0;
    (n.fig.legs || []).forEach((l, i) => (l.rotation.x = i ? -sw : sw));
    (n.fig.arms || []).forEach((a, i) => (a.rotation.x = i ? sw * 0.6 : -sw * 0.6));
    if (!moving && n.state === "queue") g.rotation.y = Math.atan2(-pontDir.x, -pontDir.z) * 0 + Math.atan2(plan.gang.x - n.pos.x, plan.gang.z - n.pos.z);
  }
  const Y = (q, y = floatY + 0.02) => ({ x: q.x, z: q.z, y });

  // ---- the player ----
  const me = { state: "free", slot: -1, seat: -1 }; // free | queue | aboard
  const av = () => window.heartIslandAvatar;
  function queueLength() {
    return npcs.filter((n) => n.state === "queue").length + (me.state === "queue" ? 1 : 0);
  }
  function joinQueue() {
    const a = av();
    if (!a?.api || me.state !== "free") return;
    if (!a.S.drive) a.api.toggleDrive?.(true);
    me.state = "queue";
    me.slot = queueLength() - 1;
    const q = slot(Math.min(me.slot, 5));
    a.api.goToPoint?.(q.x, q.z, tr("排隊上船", "Queue for the yacht"));
    say(tr("已排進隊伍，輪到你時會自動登船。", "You're in line — you'll board when it's your turn."));
    render();
  }
  function boardMe(seat) {
    const a = av();
    if (!a?.api?.ride) return;
    me.state = "aboard";
    me.seat = seat;
    me.loops = 0;
    a.api.ride(() => {
      seatWorld(seat, _v);
      return { x: _v.x, y: _v.y, z: _v.z, yaw: yacht.rotation.y + Math.PI };
    });
    say(tr("歡迎登船！遊艇將繞群島一圈，中途停靠駁二港灣島。", "Welcome aboard! The yacht circles the archipelago and stops at the Pier-2 harbour island."));
    render();
  }
  function leaveBoat(where) {
    const a = av();
    if (me.state !== "aboard") return;
    const land = where === "pier2" && S2land ? { x: S2land.x, z: S2land.z } : at(2.6, plan.SPINE_A);
    a?.api?.unride?.(land);
    me.state = "free";
    me.seat = -1;
    render();
  }

  // ---- docking events: unload, then board up to five from the front of the line ----
  const events = {
    arrive(id) {
      if (id === "berth") {
        // everyone aboard gets off and strolls back up the ramp; the player too, with a one-time reward for the full loop
        for (const n of npcs)
          if (n.state === "aboard") {
            n.state = "leaving";
            const sw = seatWorld(n.seat, new THREE.Vector3());
            n.pos = { x: sw.x, z: sw.z };
            n.y = sw.y;
            n.seat = -1;
            walkTo(n, [Y(plan.gang), Y(at(1.5, plan.SPINE_A)), Y(at(1.24, plan.SPINE_A)), Y(at(1.24, -1.05)), Y(at(1.24, -0.18), plan.pierY + 0.02)], () => {
              // back to the end of the line as a new passenger
              n.state = "queue";
              n.slot = queueLength() - 1;
              n.pos = { ...tail };
              n.y = floatY + 0.02;
              walkTo(n, [Y(slot(Math.min(n.slot, 5)))]);
            });
          }
        if (me.state === "aboard") {
          window.__htlPassport?.grantXp?.("marina:cruise", 10, tr("搭遊艇繞群島一圈", "Yacht cruise around the islands"));
          leaveBoat("berth");
          say(tr("回到遊艇碼頭，歡迎再次搭乘！", "Back at the marina — come aboard again any time!"));
        }
        setTimeout(boardFromQueue, 2600);
      } else if (id === "pier2") {
        if (me.state === "aboard") say(tr("已停靠駁二港灣島，可在這站下船，或留在船上回碼頭。", "Docked at the Pier-2 harbour island — get off here, or stay aboard back to the marina."));
      }
      render();
    },
    depart(id) {
      render();
    },
  };
  function boardFromQueue() {
    if (st.phase !== "dock" || stops[st.stop].id !== "berth") return;
    const line = [...npcs.filter((n) => n.state === "queue").map((n) => ({ n, slot: n.slot })), ...(me.state === "queue" ? [{ me: true, slot: me.slot }] : [])].sort((a, b) => a.slot - b.slot);
    const taken = new Set(npcs.filter((n) => n.state === "aboard" || n.state === "boarding").map((n) => n.seat));
    let seat = 0,
      delay = 0;
    for (const item of line) {
      while (taken.has(seat)) seat++;
      if (seat >= SEATS.length) break;
      const s = seat++;
      taken.add(s);
      if (item.me) {
        setTimeout(() => st.phase === "dock" && boardMe(s), delay);
      } else {
        const n = item.n;
        n.state = "boarding";
        n.seat = s;
        setTimeout(() => {
          const sw = seatWorld(s, new THREE.Vector3());
          walkTo(n, [Y(slot(0)), Y(plan.gang), { x: sw.x, z: sw.z, y: sw.y }], () => (n.state = "aboard"));
        }, delay);
      }
      delay += 900;
    }
    // everyone left in line steps forward
    let k = 0;
    for (const item of line) {
      if (item.n && item.n.state === "queue") {
        item.n.slot = k;
        walkTo(item.n, [Y(slot(k))]);
        k++;
      } else if (item.me && me.state === "queue") {
        me.slot = k++;
      }
    }
  }

  // ---- panel (same look as the harbour-island panel) ----
  const panel = document.createElement("div");
  panel.id = "marina-panel";
  panel.className = "khp";
  panel.hidden = true;
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-label", tr("遊艇碼頭", "Yacht marina"));
  document.body.append(panel);
  let sayText = "";
  const say = (t) => {
    sayText = t;
    render();
  };
  const btn = (label, fn, primary) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "khp-btn" + (primary ? " is-primary" : "");
    b.textContent = label;
    b.onclick = fn;
    return b;
  };
  function render() {
    if (panel.hidden) return;
    const head = document.createElement("div");
    head.className = "khp-head";
    const t = document.createElement("div");
    t.className = "khp-title";
    t.textContent = me.state === "aboard" ? tr("遊艇上", "On board") : tr("遊艇碼頭", "Yacht marina");
    const close = document.createElement("button");
    close.type = "button";
    close.className = "khp-close";
    close.setAttribute("aria-label", tr("關閉", "Close"));
    close.textContent = "×";
    close.onclick = () => ((panel.hidden = true), (dismissed = true));
    head.append(t, close);
    const status = document.createElement("p");
    status.className = "khp-sub";
    const where = st.phase === "dock" ? (stops[st.stop].id === "berth" ? tr("遊艇停靠在碼頭", "The yacht is at the marina") : tr("遊艇停靠在駁二港灣島", "The yacht is at the Pier-2 harbour island")) : tr("遊艇航行中", "The yacht is under way");
    status.textContent = `${where}・${tr(`排隊 ${queueLength()} 人`, `${queueLength()} in line`)}`;
    const row = document.createElement("div");
    row.className = "khp-actions";
    if (me.state === "sailing") {
      status.textContent = me.boat?.kind === "sail" ? tr(`駕駛帆船中・船速 ${(Math.abs(me.boat.speed) * 10).toFixed(0)} 節（遊戲刻度）`, `Sailing · speed ${(Math.abs(me.boat.speed) * 10).toFixed(0)} (game units)`) : tr(`駕駛快艇中・船速 ${(Math.abs(me.boat?.speed || 0) * 10).toFixed(0)} 節（遊戲刻度）`, `Driving · speed ${(Math.abs(me.boat?.speed || 0) * 10).toFixed(0)} (game units)`);
      row.append(btn(tr("返航", "Return"), returnRental, true));
      row.append(btn(tr("揮手", "Wave"), () => av()?.api?.triggerEmote?.("wave")));
    } else if (me.state === "rentQueue") {
      status.textContent = me.ahead ? tr(`租船排隊中・前面還有 ${me.ahead} 位`, `In the rental line · ${me.ahead} ahead`) : tr("輪到你了，準備上船！", "Your turn — boarding now!");
      row.append(
        btn(tr("離開隊伍", "Leave the line"), () => {
          av()?.api?.unride?.(plan.rentQueue[0]);
          me.state = "free";
          render();
        }),
      );
    } else if (me.state === "free") {
      row.append(btn(tr("排隊上遊艇", "Queue for the yacht"), joinQueue, true));
      row.append(btn(tr("租帆船", "Rent a sailboat"), () => joinRental("sail")));
      row.append(btn(tr("租快艇", "Rent a speedboat"), () => joinRental("motor")));
      row.append(btn(tr("看航線", "Show route"), showRoute));
    } else if (me.state === "queue") {
      row.append(
        btn(tr("離開隊伍", "Leave the line"), () => {
          me.state = "free";
          render();
        }),
      );
    } else {
      row.append(btn(tr("揮手", "Wave"), () => av()?.api?.triggerEmote?.("wave"), true));
      if (st.phase === "dock" && stops[st.stop].id === "pier2") row.append(btn(tr("在這站下船", "Get off here"), () => leaveBoat("pier2")));
      row.append(btn(tr("看航線", "Show route"), showRoute));
    }
    row.append(btn(tr("拍照", "Photo"), photo));
    const note = document.createElement("p");
    note.className = "khp-note";
    note.textContent = sayText;
    panel.replaceChildren(head, status, row, ...(sayText ? [note] : []));
  }
  // route preview: a dashed line over the water for 8 seconds
  let routeLine = null,
    routeUntil = 0;
  function showRoute() {
    if (!routeLine) {
      const g = new THREE.BufferGeometry().setFromPoints(lut.map((q) => new THREE.Vector3(q.x, waterY + 0.03, q.z)));
      routeLine = new THREE.Line(g, new THREE.LineDashedMaterial({ color: 0xc8a052, dashSize: 0.25, gapSize: 0.18, transparent: true, opacity: 0.9 }));
      routeLine.computeLineDistances();
      routeLine.material.userData.noPalette = true;
      scene.add(routeLine);
    }
    routeLine.visible = true;
    routeUntil = performance.now() + 8000;
  }
  function photo() {
    const av = window.heartIslandAvatar;
    if (av?.api?.photoWith && plan.berth) return av.api.photoWith({ x: plan.berth.x, z: plan.berth.z, h: 0.6, r: 0.5, stay: true, place: tr("遊艇碼頭", "Marina") });
    if (window.htlPhotoShare) return window.htlPhotoShare.open({ place: tr("遊艇碼頭", "Marina") });
    const c = document.querySelector("#stage canvas") || document.querySelector("canvas");
    try {
      const a = document.createElement("a");
      a.download = "htl-marina.png";
      a.href = c.toDataURL("image/png");
      a.click();
    } catch {
      say(tr("這個瀏覽器無法直接存圖，請改用螢幕截圖。", "This browser cannot save the picture — please take a screenshot."));
    }
  }
  let dismissed = false;

  // ---- boats: one realistic builder for sailboats (hull outline, mast, boom, curved mainsail and jib) and speedboats ----
  const MAT = {
    hull: new THREE.MeshStandardMaterial({ color: 0xf7f5ef, roughness: 0.45 }),
    navy: new THREE.MeshStandardMaterial({ color: 0x1f3550, roughness: 0.5 }),
    teak: new THREE.MeshStandardMaterial({ color: 0xa27f5c, roughness: 0.8 }),
    sail: new THREE.MeshStandardMaterial({ color: 0xfbfaf4, roughness: 0.8, side: THREE.DoubleSide }),
    mast: new THREE.MeshStandardMaterial({ color: 0xd9dde0, roughness: 0.3, metalness: 0.6 }),
    glass: new THREE.MeshStandardMaterial({ color: 0x22394a, roughness: 0.15, metalness: 0.4 }),
    red: new THREE.MeshStandardMaterial({ color: 0xb23a3a, roughness: 0.5 }),
    wake: new THREE.MeshBasicMaterial({ color: 0xf3fbf7, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide }),
  };
  for (const m of Object.values(MAT)) m.userData.noPalette = true;
  const hullGeo = (L, W, D) => {
    const sh = new THREE.Shape();
    sh.moveTo(-W * 0.42, -L / 2);
    sh.lineTo(W * 0.42, -L / 2);
    sh.quadraticCurveTo(W * 0.55, -L * 0.05, W * 0.38, L * 0.22);
    sh.quadraticCurveTo(W * 0.2, L * 0.44, 0, L / 2);
    sh.quadraticCurveTo(-W * 0.2, L * 0.44, -W * 0.38, L * 0.22);
    sh.quadraticCurveTo(-W * 0.55, -L * 0.05, -W * 0.42, -L / 2);
    const g = new THREE.ExtrudeGeometry(sh, { depth: D, bevelEnabled: true, bevelThickness: D * 0.25, bevelSize: W * 0.06, bevelSegments: 2, curveSegments: 10 });
    g.rotateX(Math.PI / 2).translate(0, D, 0);
    return g;
  };
  // a sail as a gently curved triangle: tack, head and clew, bellied sideways by `belly`
  const sailGeo = (a, b, c, belly) => {
    const N = 6,
      pos = [],
      idx = [];
    const P = (u, v) => {
      // u along a→b (luff), v toward c (foot); belly is largest in the middle of the sail
      const x = a.x + (b.x - a.x) * u + (c.x - a.x) * v,
        y = a.y + (b.y - a.y) * u + (c.y - a.y) * v,
        z = a.z + (b.z - a.z) * u + (c.z - a.z) * v;
      return [x + belly * Math.sin(Math.PI * Math.min(1, v / Math.max(1e-3, 1 - u))) * (1 - u) * 0.9, y, z];
    };
    for (let i = 0; i <= N; i++)
      for (let j = 0; j <= N - i; j++) pos.push(...P(i / N, j / N));
    const id = (i, j) => {
      let k = 0;
      for (let r = 0; r < i; r++) k += N - r + 1;
      return k + j;
    };
    for (let i = 0; i < N; i++)
      for (let j = 0; j < N - i; j++) {
        idx.push(id(i, j), id(i + 1, j), id(i, j + 1));
        if (j < N - i - 1) idx.push(id(i + 1, j), id(i + 1, j + 1), id(i, j + 1));
      }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    g.setIndex(idx);
    g.computeVertexNormals();
    return g;
  };
  // bow = local +z. returns { g, rig, sails, wake, seat }
  function makeSailboat(L = 0.62, trim = MAT.navy) {
    const g = new THREE.Group();
    const W = L * 0.34,
      D = L * 0.1;
    const hull = new THREE.Mesh(hullGeo(L, W, D), MAT.hull);
    hull.position.y = -D * 0.55;
    const stripe = new THREE.Mesh(hullGeo(L * 1.005, W * 1.01, D * 0.18), trim);
    stripe.position.y = -D * 0.62;
    const deck = new THREE.Mesh(new THREE.BoxGeometry(W * 0.62, D * 0.15, L * 0.55), MAT.teak);
    deck.position.set(0, D * 0.5, -L * 0.08);
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(W * 0.5, D * 0.7, L * 0.22), MAT.hull);
    cabin.position.set(0, D * 0.85, L * 0.06);
    g.add(hull, stripe, deck, cabin);
    // rig turns as one (sheeting); mast stepped a little forward of the middle
    const rig = new THREE.Group();
    rig.position.set(0, D * 0.55, L * 0.12);
    const H = L * 1.45;
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.009, H, 6), MAT.mast);
    mast.position.y = H / 2;
    const boom = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, L * 0.5, 6), MAT.mast);
    boom.rotation.x = Math.PI / 2;
    boom.position.set(0, H * 0.1, -L * 0.25);
    const main = new THREE.Mesh(sailGeo(new THREE.Vector3(0, H * 0.11, 0), new THREE.Vector3(0, H * 0.97, 0), new THREE.Vector3(0, H * 0.11, -L * 0.5), L * 0.05), MAT.sail);
    rig.add(mast, boom, main);
    const jib = new THREE.Mesh(sailGeo(new THREE.Vector3(0, D * 0.6, L * 0.47 - L * 0.12), new THREE.Vector3(0, H * 0.78, 0.01), new THREE.Vector3(0, D * 0.6, L * 0.02), L * 0.04), MAT.sail);
    g.add(rig, jib);
    const wake = new THREE.Mesh(new THREE.PlaneGeometry(W * 1.2, L * 1.4).rotateX(-Math.PI / 2).translate(0, -D * 0.5 + 0.004, -L * 1.1), MAT.wake.clone());
    g.add(wake);
    g.traverse((m) => (m.castShadow = false));
    scene.add(g);
    return { g, rig, jib, wake, seat: new THREE.Vector3(0, D * 0.6, -L * 0.3), L };
  }
  function makeSpeedboat(L = 0.56) {
    const g = new THREE.Group();
    const W = L * 0.42,
      D = L * 0.13;
    const hull = new THREE.Mesh(hullGeo(L, W, D), MAT.hull);
    hull.position.y = -D * 0.55;
    const stripe = new THREE.Mesh(hullGeo(L * 1.005, W * 1.01, D * 0.2), MAT.red);
    stripe.position.y = -D * 0.62;
    const deck = new THREE.Mesh(new THREE.BoxGeometry(W * 0.7, D * 0.15, L * 0.5), MAT.teak);
    deck.position.set(0, D * 0.5, -L * 0.12);
    const screen = new THREE.Mesh(new THREE.BoxGeometry(W * 0.75, D * 0.7, 0.01), MAT.glass);
    screen.position.set(0, D * 0.95, L * 0.08);
    screen.rotation.x = -0.5;
    const motor = new THREE.Mesh(new THREE.BoxGeometry(W * 0.22, D * 1.1, W * 0.2), MAT.navy);
    motor.position.set(0, D * 0.3, -L * 0.52);
    const wake = new THREE.Mesh(new THREE.PlaneGeometry(W * 1.6, L * 2).rotateX(-Math.PI / 2).translate(0, -D * 0.5 + 0.004, -L * 1.4), MAT.wake.clone());
    g.add(hull, stripe, deck, screen, motor, wake);
    g.traverse((m) => (m.castShadow = false));
    scene.add(g);
    return { g, wake, seat: new THREE.Vector3(0, D * 0.6, -L * 0.15), L };
  }

  // ---- open-water areas: anything on the water stays clear of the islands and of the HTL yacht's course ----
  const lands = landList?.length ? landList : Object.values(window.heartCity?.navData?.islandCenters || {});
  // islands, plus the hills and beaches that ring the harbour (terrain above the water line, with a margin)
  const shore = (x, z, pad) => {
    if (!heightAt) return false;
    for (const [dx, dz] of [[0, 0], [pad, 0], [-pad, 0], [0, pad], [0, -pad]]) if (heightAt(x + dx, z + dz) > waterY - 0.02) return true;
    return false;
  };
  const onLand = (x, z, pad = 0.35) => lands.some((l) => Math.hypot(x - l.x, z - l.z) < (l.r || 1) * 1.0 + pad) || shore(x, z, pad + 0.3);
  const nearCourse = (x, z, pad) => {
    for (let i = 0; i < lut.length; i += 3) if (Math.hypot(lut[i].x - x, lut[i].z - z) < pad) return true;
    return false;
  };
  const marinaBox = (x, z) => {
    const dx = x - plan.vx,
      dz = z - plan.vz;
    const u = dx * o.x + dz * o.z,
      v = dx * p.x + dz * p.z;
    return u > 0.6 && u < plan.SPINE_END + 1.0 && v < -0.6 && v > plan.SPINE_B - 1.0;
  };
  const clearWater = (x, z, coursePad = 0.9) => !onLand(x, z) && !nearCourse(x, z, coursePad) && !marinaBox(x, z);
  // find an ellipse (in the marina frame) whose whole loop is clear water, searching outward from the marina
  function findLoop(rx, rz, startU, startV) {
    for (let r = 0; r < 14; r += 0.5)
      for (let a = 0; a < Math.PI * 2; a += Math.PI / 6) {
        const c = at(startU + Math.cos(a) * r, startV + Math.sin(a) * r);
        let ok = true;
        for (let k = 0; k < 24 && ok; k++) {
          const t = (k / 24) * Math.PI * 2;
          const x = c.x + o.x * Math.cos(t) * rx + p.x * Math.sin(t) * rz,
            z = c.z + o.z * Math.cos(t) * rx + p.z * Math.sin(t) * rz;
          ok = clearWater(x, z, 1.0);
        }
        if (ok) return c;
      }
    return null;
  }
  const fleet = [];
  {
    const oc = findLoop(1.3, 0.8, plan.SPINE_END + 3.5, midV);
    if (oc) for (let k = 0; k < 6; k++) fleet.push({ ...makeSailboat(0.36 + (k % 3) * 0.05, k % 2 ? MAT.navy : MAT.red), cx: oc.x, cz: oc.z, rx: 1.3, rz: 0.8, w: 0.1, ph: (k / 6) * Math.PI * 2, sail: true });
    const yc = findLoop(2.2, 1.3, plan.SPINE_END + 5.5, plan.SPINE_B - 2.5);
    if (yc) {
      fleet.push({ ...makeSpeedboat(0.62), cx: yc.x, cz: yc.z, rx: 2.2, rz: 1.3, w: 0.16, ph: 0 });
      fleet.push({ ...makeSailboat(0.7), cx: yc.x, cz: yc.z, rx: 1.6, rz: 0.9, w: -0.07, ph: 2.4, sail: true });
    }
  }
  const WIND = { x: 0.6, z: -0.8 }; // a steady breeze; sails set to it and sailing speed depends on it
  function trimSail(b, heading) {
    // apparent wind angle → boom angle (sheeted out on a run, in when close-hauled) and heel
    const hx = Math.sin(heading),
      hz = Math.cos(heading);
    const cross = hx * WIND.z - hz * WIND.x,
      along = hx * WIND.x + hz * WIND.z;
    const ang = Math.acos(Math.max(-1, Math.min(1, -along))); // 0 = head to wind, π = running
    const side = Math.sign(cross) || 1;
    if (b.rig) b.rig.rotation.y = side * (0.12 + (ang / Math.PI) * 1.05);
    if (b.jib) b.jib.rotation.y = side * (0.08 + (ang / Math.PI) * 0.5);
    return { ang, side };
  }
  function moveFleet(t, dt) {
    const calm = reduced?.matches;
    for (const f of fleet) {
      const a = f.ph + t * f.w;
      const lu = Math.cos(a) * f.rx,
        lv = Math.sin(a) * f.rz;
      const x = f.cx + o.x * lu + p.x * lv,
        z = f.cz + o.z * lu + p.z * lv;
      const du = -Math.sin(a) * f.rx * Math.sign(f.w),
        dv = Math.cos(a) * f.rz * Math.sign(f.w);
      const heading = Math.atan2(o.x * du + p.x * dv, o.z * du + p.z * dv);
      let heel = 0;
      if (f.sail) {
        const tr2 = trimSail(f, heading);
        heel = calm ? 0 : -tr2.side * 0.16 * Math.sin(Math.min(Math.PI / 2, tr2.ang));
      } else heel = calm ? 0 : 0.03 * Math.sign(f.w);
      f.g.position.set(x, waterY + (calm ? 0 : Math.sin(t * 1.6 + f.ph) * 0.006), z);
      f.g.rotation.set(calm ? 0 : -0.02, heading, heel);
      f.wake.material.opacity = calm ? 0 : 0.35;
    }
  }

  // ---- rentals: queue on the pontoon, then sail a dinghy or drive the speedboat yourself ----
  const rent = {
    boats: [
      { kind: "sail", ...makeSailboat(0.6, MAT.navy), berth: plan.rentBerths[0] },
      { kind: "motor", ...makeSpeedboat(0.6), berth: plan.rentBerths[1] },
    ],
    queue: [], // NPC renters ahead of the player
    nextNpcAt: 0,
  };
  for (const b of rent.boats) {
    b.x = b.berth.x;
    b.z = b.berth.z;
    b.heading = Math.atan2(o.x, o.z);
    b.speed = 0;
    b.out = false;
    b.g.position.set(b.x, waterY, b.z);
    b.g.rotation.y = b.heading;
  }
  // two NPC renters waiting on the pontoon; each leaves (walks to the berth, is gone a while) and comes back later
  function makeRenter(k) {
    const n = makeNpc(10 + k);
    n.state = "renter";
    n.rq = k;
    n.pos = { ...plan.rentQueue[Math.min(k, 2)] };
    n.y = floatY + 0.02;
    return n;
  }
  function rentalFree(kind) {
    return rent.boats.find((b) => b.kind === kind && !b.out) || null;
  }
  function joinRental(kind) {
    const a = av();
    if (!a?.api || me.state !== "free") return;
    if (!rentalFree(kind)) return say(tr("這艘船目前出航中，請稍候。", "That boat is out right now — please wait."));
    if (!a.S.drive) a.api.toggleDrive?.(true);
    me.state = "rentQueue";
    me.rentKind = kind;
    me.ahead = rent.queue.filter((n) => n.state === "renter").length;
    // the player is led to their place in the line and moves up with it (held there like a passenger, so the walk on
    // the floating pontoon never depends on the island path network)
    const g0 = a.S.fig.group.position.clone();
    const t0 = performance.now();
    const spot = new THREE.Vector3();
    a.api.ride?.(() => {
      const q = plan.rentQueue[Math.min(2, Math.max(0, me.ahead))];
      spot.set(q.x, floatY + 0.02, q.z);
      const k = Math.min(1, (performance.now() - t0) / 1600);
      const e = k * k * (3 - 2 * k);
      return { x: g0.x + (spot.x - g0.x) * e, y: g0.y + (spot.y - g0.y) * e, z: g0.z + (spot.z - g0.z) * e, yaw: Math.atan2(plan.rentBerths[0].x - spot.x, plan.rentBerths[0].z - spot.z) };
    });
    say(me.ahead ? tr(`已排隊，前面還有 ${me.ahead} 位。`, `In line — ${me.ahead} ahead of you.`) : tr("輪到你了，走到碼頭邊就能上船！", "Your turn — walk to the edge of the pontoon to board!"));
    render();
  }
  function boardRental() {
    const a = av(),
      b = rentalFree(me.rentKind);
    if (!a?.api?.ride || !b) return;
    b.out = true;
    b.speed = 0;
    me.state = "sailing";
    me.boat = b;
    const w = new THREE.Vector3();
    a.api.ride(() => {
      w.copy(b.seat).applyMatrix4(b.g.matrixWorld);
      return { x: w.x, y: w.y, z: w.z, yaw: b.heading };
    });
    say(b.kind === "sail" ? tr("出航！用 WASD／方向鍵或搖桿操舵；逆風時帆船會變慢，斜風最快。", "Cast off! Steer with WASD / arrows / joystick; a sailboat slows head-to-wind and is fastest on a reach.") : tr("出發！用 WASD／方向鍵或搖桿駕駛快艇，注意避開其他船隻。", "Off you go! Drive with WASD / arrows / joystick and keep clear of other boats."));
    render();
  }
  function returnRental() {
    const a = av(),
      b = me.boat;
    if (!b) return;
    b.x = b.berth.x;
    b.z = b.berth.z;
    b.heading = Math.atan2(o.x, o.z);
    b.speed = 0;
    b.out = false;
    b.g.position.set(b.x, waterY, b.z);
    b.g.rotation.set(0, b.heading, 0);
    b.g.updateMatrixWorld();
    a?.api?.unride?.(plan.rentQueue[0]);
    window.__htlPassport?.grantXp?.(b.kind === "sail" ? "marina:sail" : "marina:motor", 10, b.kind === "sail" ? tr("第一次駕駛帆船", "First sail") : tr("第一次駕駛快艇", "First speedboat drive"));
    me.state = "free";
    me.boat = null;
    say(tr("已返航，歡迎再來！", "Back at the pontoon — come again!"));
    render();
  }
  // steering: camera-relative like walking; a sailboat's speed follows the wind angle, the speedboat is faster
  const outerR = Math.max((bounds.maxX - bounds.minX) / 2, (bounds.maxZ - bounds.minZ) / 2) + 6;
  function steer(b, dt) {
    const a = av(),
      S = a?.S;
    if (!S) return;
    const kx = (S.keys?.r || S.padHold?.r ? 1 : 0) - (S.keys?.l || S.padHold?.l ? 1 : 0),
      kz = (S.keys?.u || S.padHold?.u ? 1 : 0) - (S.keys?.d || S.padHold?.d ? 1 : 0);
    const joy = S.joy && S.joy.mag > 0.08;
    const mx = joy ? S.joy.x : kx,
      mz = joy ? S.joy.z : kz;
    const f = new THREE.Vector3().subVectors(window.heartCity.controls.target, camera.position).setY(0).normalize();
    const r = { x: -f.z, z: f.x };
    let throttle = 0;
    if (mx || mz) {
      const dx = r.x * mx + f.x * mz,
        dz = r.z * mx + f.z * mz;
      const want = Math.atan2(dx, dz);
      const d = Math.atan2(Math.sin(want - b.heading), Math.cos(want - b.heading));
      b.heading += Math.sign(d) * Math.min(Math.abs(d), dt * (b.kind === "sail" ? 1.4 : 2.2));
      throttle = Math.min(1, Math.hypot(mx, mz));
    }
    let vmax = b.kind === "sail" ? 1.25 : 2.1;
    if (b.kind === "sail") {
      const tr2 = trimSail(b, b.heading);
      vmax *= tr2.ang < 0.7 ? 0.12 : 0.3 + 0.7 * Math.sin(Math.min(Math.PI / 2, tr2.ang));
      b.heel = reduced?.matches ? 0 : -tr2.side * 0.2 * Math.sin(Math.min(Math.PI / 2, tr2.ang)) * (b.speed / 1.25);
    }
    b.speed += (throttle * vmax - b.speed) * Math.min(1, dt * (throttle ? 1.2 : 0.8));
    const nx = b.x + Math.sin(b.heading) * b.speed * dt,
      nz = b.z + Math.cos(b.heading) * b.speed * dt;
    const yp = yacht.position;
    const blocked =
      onLand(nx, nz, 0.25) ||
      Math.hypot(nx - plan.center.x, nz - plan.center.z) > outerR ||
      Math.hypot(nx - yp.x, nz - yp.z) < 0.75 ||
      fleet.some((fb) => Math.hypot(nx - fb.g.position.x, nz - fb.g.position.z) < 0.45);
    if (blocked) {
      b.speed *= -0.25; // bump and drift back
      if (!b.bumpSaid || performance.now() - b.bumpSaid > 2500) {
        b.bumpSaid = performance.now();
        say(tr("前方有障礙，請轉向。", "Something is in the way — turn away."));
      }
    } else {
      b.x = nx;
      b.z = nz;
    }
  }
  function stepRental(now, dt) {
    if (!figReady) return;
    if (!rent.made) {
      rent.made = true;
      for (let k = 0; k < 2; k++) rent.queue.push(makeRenter(k));
      rent.nextNpcAt = now + 7000;
    }
    // the front NPC renter heads off every 7 s; the player moves up one place each time
    if (now > rent.nextNpcAt) {
      rent.nextNpcAt = now + 7000;
      const front = rent.queue.find((n) => n.state === "renter");
      if (front && !(me.state === "rentQueue" && me.ahead <= 0)) {
        front.state = "leaving";
        walkTo(front, [Y(plan.rentQueue[0]), Y(plan.rentBerths[0], floatY + 0.02)], () => {
          front.fig.group.visible = false;
          front.state = "away";
          front.back = now + 26000;
        });
        rent.queue = rent.queue.filter((n) => n !== front).concat(front);
        if (me.state === "rentQueue") me.ahead = Math.max(0, me.ahead - 1);
        let k = 0;
        for (const n of rent.queue) if (n.state === "renter") walkTo(n, [Y(plan.rentQueue[Math.min(2, k++ + (me.state === "rentQueue" ? 1 : 0))])]);
        render();
      }
    }
    for (const n of rent.queue)
      if (n.state === "away" && now > n.back) {
        n.state = "renter";
        n.fig.group.visible = true;
        n.pos = { ...plan.rentQueue[2] };
        n.y = floatY + 0.02;
      }
    for (const n of rent.queue) if (n.state !== "away") stepNpc(n, dt, now / 1000);
    // player at the front of the rental line → board
    const g = av()?.S?.fig?.group;
    if (me.state === "rentQueue" && me.ahead <= 0 && g && Math.hypot(g.position.x - plan.rentQueue[0].x, g.position.z - plan.rentQueue[0].z) < 0.15) boardRental();
    // boats
    for (const b of rent.boats) {
      if (me.state === "sailing" && me.boat === b) steer(b, dt);
      const t = now / 1000,
        calm = reduced?.matches;
      b.g.position.set(b.x, waterY + (calm ? 0 : Math.sin(t * 1.5 + b.berth.x) * 0.006), b.z);
      b.g.rotation.set(0, b.heading, b.heel || 0);
      if (b.kind === "sail" && !b.out) trimSail(b, b.heading);
      b.wake.material.opacity = calm ? 0 : Math.min(0.5, Math.abs(b.speed) * 0.3);
      b.g.updateMatrixWorld();
    }
  }

  // ---- per frame ----
  let last = performance.now();
  frameHooks.add((now) => {
    const dt = Math.min(0.08, (now - last) / 1000);
    last = now;
    moveYacht(now, dt);
    const t = now / 1000;
    moveFleet(t, dt);
    stepRental(now, dt);
    // passengers appear once the avatar module (shared character builder) is ready
    if (!figReady && window.heartIslandAvatar?.buildFigure) {
      figReady = true;
      for (let k = 0; k < NPC_N; k++) npcs.push(makeNpc(k));
      st.until = now + DOCK_S * 1000;
      setTimeout(boardFromQueue, 1500);
    }
    for (const n of npcs) {
      stepNpc(n, dt, t);
      if (((now / 400) | 0) % 5 === 0) window.heartIslandAvatar?.applyFigScale?.(n.fig);
    }
    // night lights
    const night = document.body.classList.contains("night") ? 1 : 0;
    lightMat.opacity = navR.opacity = navG.opacity = night;
    if (routeLine && routeLine.visible && now > routeUntil) routeLine.visible = false;
    // panel: near the kiosk / pontoon on foot, or always while aboard
    const a = av();
    const g = a?.S?.fig?.group;
    if (g) {
      const near = Math.hypot(g.position.x - plan.kiosk.x, g.position.z - plan.kiosk.z) < 1.1 || Math.hypot(g.position.x - plan.berth.x, g.position.z - plan.berth.z) < 1.1 || Math.hypot(g.position.x - plan.rentQueue[0].x, g.position.z - plan.rentQueue[0].z) < 1.2;
      const want = me.state !== "free" || (near && a.S.drive);
      if (!want) dismissed = false;
      if (want && !dismissed && panel.hidden) {
        panel.hidden = false;
        render();
      } else if (!want && !panel.hidden) panel.hidden = true;
      // a queued player who wandered off leaves the line
      if (me.state === "queue" && Math.hypot(g.position.x - plan.kiosk.x, g.position.z - plan.kiosk.z) > 2.5 && !a.S.walk) me.state = "free";
      if (((now / 500) | 0) !== ((last / 500) | 0)) render();
    }
    return true;
  });
  // a 下課 bell brings two more people to the marina
  addEventListener("htl:clocktower", (e) => {
    if (e.detail?.kind !== "end" || !figReady || npcs.length >= NPC_N + 2) return;
    for (let i = 0; i < 2; i++) {
      const n = makeNpc(npcs.length);
      n.slot = queueLength();
      n.pos = { ...tail };
      walkTo(n, [Y(slot(Math.min(n.slot, 5)))]);
      npcs.push(n);
    }
  });

  return {
    yacht,
    curve,
    stops,
    get state() {
      return { phase: st.phase, stop: stops[st.stop]?.id, u: st.u, me: me.state, queue: queueLength(), npcs: npcs.map((n) => n.state) };
    },
    joinQueue,
    leaveBoat,
    joinRental,
    returnRental,
    plan,
    fleet: () => fleet.map((f) => f.g),
    get rental() {
      return { me: me.state, ahead: me.ahead, boat: me.boat ? { kind: me.boat.kind, x: me.boat.x, z: me.boat.z, speed: me.boat.speed } : null, renters: rent.queue.map((n) => n.state) };
    },
    // QA: jump the yacht to the next stop now
    skip() {
      st.until = 0;
    },
    // walking routes for heart-me: island corner → ferry pier → ramp → pontoon (to the gangway)
    routes(existing, link) {
      const pts = [plan.P0, plan.ramp[1], at(1.24, plan.SPINE_A), at(2.75, plan.SPINE_A)];
      const parts = [];
      const lerp = (a, b, t) => ({ x: a.x + (b.x - a.x) * t, z: a.z + (b.z - a.z) * t });
      const route = link(existing, campus, {
        parent: "sport",
        pa: { x: plan.vx - o.x * 0.45, z: plan.vz - o.z * 0.45 },
        bridgeAt: (t) => {
          // 0..0.45 the ferry pier (top − 0.12), 0.45..0.7 the ramp down, 0.7..1 the pontoon
          if (t <= 0.45) {
            const q = lerp({ x: plan.vx, z: plan.vz }, plan.P0, t / 0.45);
            return [q.x, plan.pierY + 0.012, q.z];
          }
          if (t <= 0.7) {
            const k = (t - 0.45) / 0.25,
              q = lerp(plan.P0, plan.ramp[1], k);
            return [q.x, plan.pierY + (floatY - plan.pierY) * k + 0.012, q.z];
          }
          // ramp foot → along the shore pontoon to spine A → out along spine A to the gangway
          const k = (t - 0.7) / 0.3;
          const q = k < 0.25 ? lerp(plan.ramp[1], pts[2], k / 0.25) : lerp(pts[2], pts[3], (k - 0.25) / 0.75);
          return [q.x, floatY + 0.015, q.z];
        },
        landing: pts[3],
      });
      if (route) parts.push(route);
      // to the rental line at the far end of the shore pontoon
      const rq = plan.rentQueue[0];
      const route2 = link(existing, campus, {
        parent: "sport",
        pa: { x: plan.vx - o.x * 0.45, z: plan.vz - o.z * 0.45 },
        bridgeAt: (t) => {
          if (t <= 0.45) {
            const q = lerp({ x: plan.vx, z: plan.vz }, plan.P0, t / 0.45);
            return [q.x, plan.pierY + 0.012, q.z];
          }
          if (t <= 0.7) {
            const k = (t - 0.45) / 0.25,
              q = lerp(plan.P0, plan.ramp[1], k);
            return [q.x, plan.pierY + (floatY - plan.pierY) * k + 0.012, q.z];
          }
          const q = lerp(plan.ramp[1], rq, (t - 0.7) / 0.3);
          return [q.x, floatY + 0.015, q.z];
        },
        landing: rq,
      });
      if (route2) parts.push(route2);
      return parts;
    },
  };
}

// Walkways of the marina for free (RPG) walking: island corner → ferry pier → ramp → shore pontoon → both spines.
// They are below island height, so each carries its own deck heights (heart-me.js reads y0 / y1 and halfW).
export function marinaNav(plan, top) {
  const { at, o, vx, vz, pierY, floatY, SPINE_A, SPINE_B, SPINE_END } = plan;
  const P = (q) => ({ x: q.x, y: 0, z: q.z });
  const inside = { x: vx - o.x * 0.35, z: vz - o.z * 0.35 };
  const pier = pierY + 0.013,
    fl = floatY + 0.016;
  const seg = (a, b, y0, y1, halfW) => ({ a: "sport", b: "marina", pa: P(a), pb: P(b), y0, y1, halfW, arch: 0, deck: 0 });
  return [
    seg(inside, at(1.24, 0), top + 0.0175, pier, 0.15),
    seg(at(1.24, 0), at(1.24, -1.05), pier, fl, 0.14),
    seg(at(1.24, -1.0), at(1.24, -4.55), fl, fl, 0.2),
    seg(at(1.24, SPINE_A), at(SPINE_END + 0.5, SPINE_A), fl, fl, 0.13),
    seg(at(1.24, SPINE_B), at(SPINE_END + 0.5, SPINE_B), fl, fl, 0.13),
    // wide funnels where each spine leaves the pontoon: stepping off the pontoon toward a spine catches it even when
    // the avatar is a little to the side of the spine's centreline (WASD diagonals, the touch joystick)
    seg(at(1.0, SPINE_A), at(2.1, SPINE_A), fl, fl, 0.3),
    seg(at(1.0, SPINE_B), at(2.1, SPINE_B), fl, fl, 0.3),
    // T-heads at the sea end of both spines
    seg(at(SPINE_END, SPINE_A - 0.58), at(SPINE_END, SPINE_A + 0.58), fl, fl, 0.1),
    seg(at(SPINE_END, SPINE_B - 0.58), at(SPINE_END, SPINE_B + 0.58), fl, fl, 0.1),
  ];
}

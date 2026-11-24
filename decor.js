// Decorative scatter, waterfront ledges, themed surroundings and islets.
// Purely scenic: no item here represents a policy, a facility location or a schedule.
import { R, TOP, RING_R, NEIGHBORS, islandR, islandRingR, islandInnerR, dirOf, hexVertex, insideHex } from "./world.js?v=20261115-03";
import { WATER_Y, mulberry } from "./environment.js?v=20261115-02";
import { EDGE_ITEMS } from "./decor-items.js?v=20261113-01";
let THREE;

export function buildDecor(T, kit, D, centers, neighbors, footprints, colors, opts = {}) {
  const heightAt = opts.heightAt || (() => -1);
  const bridges = opts.bridges || [];
  // water areas taken by other scenery (the Kaohsiung harbour islands and their bridges): no islets, boats or coast vignettes there
  const reserved = opts.reserved || [];
  const isReserved = (x, z, pad = 0) => reserved.some(([rx, rz, rr]) => Math.hypot(rx - x, rz - z) < rr + pad);
  THREE = T;
  const rnd = mulberry(99);
  const ambientSpots = [];
  const diplomacyMarkers = [];
  const C = colors;
  const W = WATER_Y;
  const { box, hbox, cyl, sphere, ico, part, bulb, glow } = kit;
  const TREE_GREENS = [0x9cc27a, 0xa9c98a, 0x8db86f, 0xb3cf8e, 0x86ad6a];
  let treeIsland = null;
  // rounded broadleaf canopy: tapered trunk with branch stubs, a root mound, and 4–6 lumpy clumps
  // (shadow side darker & cooler, crown lighter) so no tree reads as a single smooth ball
  const canopy = (x, z, s, y, g) => {
    const base = new THREE.Color(g);
    const dark = base.clone().offsetHSL(0.02, -0.05, -0.09).getHex(),
      mid = base.getHex(),
      light = base.clone().offsetHSL(-0.01, 0.04, 0.08).getHex();
    part("dome", [x, y, z], [s * 0.42, s * 0.09, s * 0.42], 0x8a7058);
    part("trunk", [x, y + s * 0.33, z], [s * 0.2, s * 0.66, s * 0.2], 0x8a6a4e);
    part("trunk", [x + s * 0.1, y + s * 0.58, z + s * 0.04], [s * 0.08, s * 0.3, s * 0.08], 0x8a6a4e, null, [0.2, 0, -0.7]);
    part("trunk", [x - s * 0.09, y + s * 0.62, z - s * 0.03], [s * 0.07, s * 0.26, s * 0.07], 0x8a6a4e, null, [-0.2, 0, 0.7]);
    const n = 4 + Math.floor(rnd() * 3);
    for (let t = 0; t < n; t++) {
      const a = (t / n) * Math.PI * 2 + rnd() * 0.6;
      const r = s * (0.24 + rnd() * 0.12);
      const lo = t % 2 === 0;
      const k = s * (0.5 + rnd() * 0.22);
      part("leaf", [x + Math.cos(a) * r, y + s * (lo ? 0.82 : 0.98) + rnd() * s * 0.08, z + Math.sin(a) * r], [k, k * 0.86, k], lo ? dark : mid, null, [rnd(), rnd() * 6, rnd()]);
    }
    part("leaf", [x, y + s * 1.12, z], [s * 0.62, s * 0.52, s * 0.62], light, null, [rnd(), rnd() * 6, 0]);
    part("leaf", [x + s * 0.12, y + s * 1.2, z + s * 0.14], [s * 0.34, s * 0.3, s * 0.34], base.clone().offsetHSL(-0.02, 0.06, 0.13).getHex());
  };
  const tree = (x, z, s = 0.4, y = TOP, tint = 0) => {
    const g = TREE_GREENS[(tint + Math.floor(rnd() * TREE_GREENS.length)) % TREE_GREENS.length];
    // 第三期: a harbour campus — royal palms join the round canopies on the islands without a set tree style
    const style = { forest: rnd() < 0.55 ? "conifer" : "round", card: "blossom", lunch: "fruit", family: "topiary", education: "poplar", welfare: "willow", civil: rnd() < 0.4 ? "palm" : "clipped", youth: "palm", sport: rnd() < 0.7 ? "palm" : "topiary", luxury: rnd() < 0.5 ? "palm" : "topiary", innovation: "clipped", esg: rnd() < 0.5 ? "conifer" : "round", water: "palm", diplomacy: "palm" }[treeIsland] || (rnd() < 0.4 ? "palm" : "round");
    if (style === "conifer") {
      const h = s * (1.3 + rnd() * 0.8);
      cyl(x, y + h * 0.15, z, s * 0.1, h * 0.3, 0x7a5d44);
      for (let t = 0; t < 3; t++) part("cone6", [x, y + h * (0.35 + t * 0.22), z], [s * (0.9 - t * 0.22), h * 0.42, s * (0.9 - t * 0.22)], [0x5f826c, 0x6f8a62, 0x58785f][t]);
      return;
    }
    if (style === "poplar") {
      cyl(x, y + s * 0.2, z, s * 0.09, s * 0.4, 0x9a7454);
      part("leaf", [x, y + s * 0.95, z], [s * 0.5, s * 1.3, s * 0.5], g, null, [0, rnd() * 6, 0]);
      part("leaf", [x + s * 0.06, y + s * 1.3, z + s * 0.05], [s * 0.3, s * 0.6, s * 0.3], new THREE.Color(g).offsetHSL(0, 0.04, 0.08).getHex());
      return;
    }
    if (style === "topiary" || style === "clipped") {
      cyl(x, y + s * 0.3, z, s * 0.08, s * 0.6, 0x9a7454);
      if (style === "clipped") {
        part("leaf", [x, y + s * 0.82, z], [s * 0.78, s * 0.62, s * 0.78], 0x86ad6a, null, [0, rnd() * 6, 0]);
        part("leaf", [x, y + s * 1.08, z], [s * 0.5, s * 0.4, s * 0.5], 0xa3c486, null, [0, rnd() * 6, 0]);
      }
      else {
        part("leaf", [x, y + s * 0.7, z], [s * 0.55, s * 0.55, s * 0.55], 0x86ad6a, null, [rnd(), rnd() * 6, 0]);
        part("leaf", [x, y + s * 1.15, z], [s * 0.38, s * 0.38, s * 0.38], 0xa9c98a, null, [rnd(), rnd() * 6, 0]);
      }
      kit.box(x, y + 0.05, z, s * 0.4, 0.1, s * 0.4, 0xd08a64);
      return;
    }
    if (style === "palm") {
      // 第三期: royal palm (大王椰子) — slim pale trunk, green crownshaft and eight arching two-segment fronds
      // (was a brown stick with five flat boards)
      const H = s * (1.45 + rnd() * 0.35);
      cyl(x, y + H * 0.28, z, s * 0.085, H * 0.56, 0xcfc6b3);
      cyl(x, y + H * 0.7, z, s * 0.07, H * 0.3, 0xc3baa6);
      cyl(x, y + H * 0.9, z, s * 0.075, H * 0.12, 0x6f9a5c);
      const top0 = y + H * 0.96,
        spin = rnd() * Math.PI;
      for (let t = 0; t < 8; t++) {
        const a = spin + (t / 8) * Math.PI * 2,
          ca = Math.cos(a),
          sa = Math.sin(a);
        const L1 = s * 0.4,
          L2 = s * 0.46,
          t1 = 0.28 + (t % 2) * 0.12,
          t2 = -0.7 - (t % 3) * 0.08;
        const r1 = s * 0.04 + (L1 / 2) * Math.cos(t1),
          y1 = top0 + (L1 / 2) * Math.sin(t1);
        const ex = s * 0.04 + L1 * Math.cos(t1),
          ey = top0 + L1 * Math.sin(t1);
        const r2 = ex + (L2 / 2) * Math.cos(t2),
          y2 = ey + (L2 / 2) * Math.sin(t2);
        const fc = t % 2 ? 0x4f8a5a : 0x5c9a63;
        part("box", [x + ca * r1, y1, z + sa * r1], [L1, s * 0.03, s * 0.2], fc, null, [0, -a, t1]);
        part("box", [x + ca * r2, y2, z + sa * r2], [L2, s * 0.025, s * 0.17], fc, null, [0, -a, t2]);
      }
      return;
    }
    if (style === "willow") {
      cyl(x, y + s * 0.35, z, s * 0.11, s * 0.7, 0x8a6a4e);
      part("leaf", [x, y + s * 0.85, z], [s * 1.1, s * 0.6, s * 1.1], 0x9cc27a, null, [0, rnd() * 6, 0]);
      part("leaf", [x, y + s * 1.02, z], [s * 0.7, s * 0.4, s * 0.7], 0xb3cf8e, null, [0, rnd() * 6, 0]);
      for (let t = 0; t < 6; t++) {
        const a = (t / 6) * Math.PI * 2;
        cyl(x + Math.cos(a) * s * 0.75, y + s * 0.55, z + Math.sin(a) * s * 0.75, s * 0.08, s * 0.5, 0x9cc27a);
      }
      return;
    }
    canopy(x, z, s, y, g);
    if (style === "blossom") for (let t = 0; t < 7; t++) sphere(x + (rnd() - 0.5) * s, y + s * (0.7 + rnd() * 0.5), z + (rnd() - 0.5) * s, s * 0.22, [0xf2b5c6, 0xf7cfda, 0xffffff][t % 3]);
    if (style === "fruit") for (let t = 0; t < 6; t++) sphere(x + (rnd() - 0.5) * s * 0.9, y + s * (0.65 + rnd() * 0.5), z + s * 0.35 + (rnd() - 0.5) * s * 0.3, s * 0.1, [0xf2a33a, 0xdb6a41][t % 2]);
  };
  const bush = (x, z, s = 0.12, y = TOP) => {
    const g = [0x9cc27a, 0xa9c98a, 0x8db86f][Math.floor(rnd() * 3)];
    part("leaf", [x, y + s * 0.42, z], [s, s * 0.8, s], g, null, [rnd(), rnd() * 6, 0]);
    part("leaf", [x + s * 0.55, y + s * 0.32, z + s * 0.2], [s * 0.7, s * 0.6, s * 0.7], new THREE.Color(g).offsetHSL(0, 0, 0.04).getHex());
  };
  const flowers = (x, z, y = TOP) => {
    for (let k = 0; k < 5; k++) sphere(x + (rnd() - 0.5) * 0.14, y + 0.03, z + (rnd() - 0.5) * 0.14, 0.03, [0xf2b5c6, 0xfcea8b, 0xffffff, 0xd9c6f0, 0xf4a46a][Math.floor(rnd() * 5)]);
    ico(x, y + 0.015, z, [0.12, 0.03, 0.12], 0x8fa67a);
  };
  const pebble = (x, z, y = TOP) => ico(x, y + 0.012, z, [0.05 + rnd() * 0.04, 0.025, 0.05], [0xc9bba6, 0xb7a993, 0xd8ccba][Math.floor(rnd() * 3)]);
  const lampSpots = [];
  const lighthouses = [];
  const stringLights = [];
  const lamp = (x, z, y = TOP) => {
    lampSpots.push([x, y, z]);
    cyl(x, y + 0.18, z, 0.016, 0.36, 0x4a514d);
    hbox(x, y + 0.365, z, 0.05, 0.012, 0.05, 0x4a514d);
    bulb(x, y + 0.345, z, 0.035);
  };
  const bench = (x, z, yaw = 0, y = TOP) => {
    hbox(x, y + 0.07, z, 0.22, 0.02, 0.07, 0xb48560, null, [0, yaw, 0]);
    hbox(x - Math.cos(yaw) * 0 + Math.sin(yaw) * -0.035, y + 0.11, z - Math.cos(yaw) * 0.035, 0.22, 0.06, 0.012, 0xb48560, null, [0, yaw, 0]);
    for (const s of [-1, 1]) hbox(x + Math.cos(yaw) * 0.085 * s, y + 0.035, z - Math.sin(yaw) * 0.085 * s, 0.018, 0.07, 0.06, 0x7a807c, null, [0, yaw, 0]);
  };
  const bin = (x, z, y = TOP) => {
    cyl(x, y + 0.05, z, 0.05, 0.1, 0x5f7d6e);
    cyl(x, y + 0.105, z, 0.056, 0.012, C.ink);
  };
  const bikeRack = (x, z, yaw = 0, y = TOP) => {
    for (let k = 0; k < 3; k++) part("torus", [x + Math.cos(yaw) * (k - 1) * 0.05, y + 0.03, z - Math.sin(yaw) * (k - 1) * 0.05], [0.055, 0.055, 0.055], 0x7a807c, null, [0, yaw + Math.PI / 2, 0]);
  };
  const planter = (x, z, y = TOP) => {
    box(x, y + 0.04, z, 0.14, 0.08, 0.14, 0xb79a7b);
    ico(x, y + 0.1, z, [0.12, 0.08, 0.12], 0x8fa67a);
  };

  // ---------- footprint test ----------
  const fpByIsland = new Map();
  for (const f of footprints) {
    if (!fpByIsland.has(f.island)) fpByIsland.set(f.island, []);
    fpByIsland.get(f.island).push(f);
  }
  const blocked = (id, x, z, m = 0.05) => (fpByIsland.get(id) || []).some((f) => x > f.minX - m && x < f.maxX + m && z > f.minZ - m && z < f.maxZ + m);
  const occupied = new Map(); // island -> [[x,z,r]]
  const free = (id, x, z, r) => {
    const list = occupied.get(id) || [];
    if (list.some(([a, b, rr]) => Math.hypot(a - x, b - z) < r + rr)) return false;
    list.push([x, z, r]);
    occupied.set(id, list);
    return true;
  };

  // keep the youth island's skate strip and stage-front audience spots clear of trees and vignettes
  if (centers.get("youth")) {
    const yc = centers.get("youth");
    for (const dx of [-1.06, -0.8, -0.54]) free("youth", yc.x + dx, yc.z + 1.04, 0.2);
    free("youth", yc.x + 0.3, yc.z + 1.33, 0.3);
  }
  const nearBridgeAt = (id, x, z, rad = 0.36) =>
    bridges.some(
      (br) =>
        (br.a === id && Math.hypot(br.pa.x - x, br.pa.z - z) < rad) ||
        (br.b === id && Math.hypot(br.pb.x - x, br.pb.z - z) < rad),
    );
  for (const i of D.islands) {
    const c = centers.get(i.id);
    const r = islandR(i.id),
      rr = islandRingR(i.id),
      inr = islandInnerR(i.id),
      span = inr * 2.08;
    kit.setIsland(i.id);
    treeIsland = i.id;
    const nb = neighbors.get(i.id);
    // --- band furniture: lamps at ring vertices (pushed to outer band), planters between ---
    for (let k = 0; k < 6; k++) {
      const [vx, vz] = hexVertex(c.x, c.z, rr + 0.1, k);
      kit.decor(i.id, "lamp", () => lamp(vx, vz));
      if (i.id === "sport") {
        const [wx, wz] = hexVertex(c.x, c.z, rr + 0.1, k + 1);
        for (const t of [0.34, 0.66]) {
          const lx = vx + (wx - vx) * t,
            lz = vz + (wz - vz) * t;
          if (!nearBridgeAt(i.id, lx, lz, 0.42)) kit.decor(i.id, "lamp", () => lamp(lx, lz));
        }
      }
    }
    for (let k = 0; k < 6; k++) {
      // edge k between vertex k and k+1; skip bridge landings
      const [ax, az] = hexVertex(c.x, c.z, rr + 0.1, k),
        [bx, bz] = hexVertex(c.x, c.z, rr + 0.1, k + 1);
      const mx = (ax + bx) / 2 - c.x,
        mz = (az + bz) / 2 - c.z;
      const isBridge =
        r === R &&
        nb.some(
          (n) =>
            n.id &&
            (() => {
              const [dx, dz] = dirOf(n.dq, n.dr);
              return dx * mx + dz * mz > 1.2;
            })(),
        );
      for (const t of i.id === "sport" ? [0.18, 0.5, 0.82] : [0.27, 0.73]) {
        const x = ax + (bx - ax) * t,
          z = az + (bz - az) * t;
        if (nearBridgeAt(i.id, x, z, 0.38)) continue;
        kit.decor(i.id, "planter", () => (k % 2 ? planter(x, z) : bush(x, z, 0.08)));
      }
      if (!isBridge && !nearBridgeAt(i.id, c.x + mx, c.z + mz, 0.38)) {
        kit.decor(i.id, "flowers", () => flowers(c.x + mx, c.z + mz));
      }
    }
    // --- a few big round canopy trees along the outer zone (B-style greenery) ---
    {
      let made = 0;
      const maxTrees = i.id === "sport" ? 28 : 6,
        attempts = i.id === "sport" ? 56 : 12;
      for (let k = 0; k < attempts && made < maxTrees; k++) {
        const a = Math.PI / 2 + (k * Math.PI * 2) / attempts + (rnd() - 0.5) * 0.25;
        const rad = inr - 0.22 + rnd() * 0.12;
        const lx = Math.cos(a) * rad,
          lz = Math.sin(a) * rad;
        if (!insideHex(lx, lz, inr - 0.04)) continue;
        const x = c.x + lx,
          z = c.z + lz;
        if (blocked(i.id, x, z, 0.22)) continue;
        if (!free(i.id, x, z, 0.24)) continue;
        kit.decor(i.id, "bigTree", () => tree(x, z, 0.36 + rnd() * 0.12));
        made++;
      }
    }
    // --- island-specific edge vignettes (outer zone, inside the walking ring) ---
    {
      const items = EDGE_ITEMS[i.id] || [];
      const cands = [];
      for (let k = 0; k < 2400; k++) {
        const lx = (rnd() - 0.5) * span,
          lz = (rnd() - 0.5) * span;
        if (!insideHex(lx, lz, inr + 0.02) || insideHex(lx, lz, Math.max(0.7, inr - 0.72))) continue;
        cands.push([lx, lz]);
      }
      let placedE = 0;
      const maxEdge = i.id === "sport" ? 44 : 14;
      for (const [lx, lz] of cands) {
        if (placedE >= maxEdge || !items.length) break;
        const x = c.x + lx,
          z = c.z + lz;
        if (blocked(i.id, x, z, 0.14)) continue;
        if (!free(i.id, x, z, 0.14)) continue;
        const [type, fn] = items[placedE % items.length];
        const yaw = Math.atan2(lx, lz) + Math.PI;
        kit.decor(i.id, type, () => fn(kit, x, z, TOP, yaw, rnd));
        placedE++;
      }
    }
    // --- stepping-stone paths from each building front to the walking ring ---
    for (const f of fpByIsland.get(i.id) || []) {
      const fx = (f.minX + f.maxX) / 2;
      const zLimit = i.id === "sport" ? f.maxZ + 0.22 : c.z + inr + 0.2;
      for (let zz = f.maxZ + 0.06; zz < zLimit; zz += 0.1) {
        const lx = fx - c.x,
          lz = zz - c.z;
        if (!insideHex(lx, lz, inr + 0.02)) break;
        if ((fpByIsland.get(i.id) || []).some((o) => o !== f && fx > o.minX - 0.04 && fx < o.maxX + 0.04 && zz > o.minZ - 0.04 && zz < o.maxZ + 0.04)) break;
        free(i.id, fx, zz, 0.05);
        kit.decor(i.id, "doorPath", () => kit.hbox(fx, TOP + 0.006, zz, 0.11, 0.008, 0.07, 0xe9dcc8));
      }
    }
    // --- inner scatter (Poisson-ish) ---
    let placed = 0,
      tries = 0;
    const MIX = {
      forest: ["tree", "tree", "bush", "tree", "fern", "tree", "flowers", "tree", "pebble", "tree", "bush", "fern"],
      sport: ["planter", "flowers", "tree", "bench", "planter", "flowers", "tree"],
      trails: ["tree", "flowers", "planter", "tree", "bench", "flowers", "bush", "tree", "planter"],
      lunch: ["veg", "veg", "bush", "flowers", "veg", "tree", "pebble", "veg", "planter"],
      welfare: ["flowers", "flowers", "bush", "bench", "flowers", "tree", "planter", "flowers", "bush"],
      youth: ["planter", "bench", "bikeRack", "flowers", "bin", "bush", "planter", "tree"],
      civil: ["planter", "tree", "bench", "bush", "planter", "tree", "flowers"],
    };
    const types = MIX[i.id] || ["bush", "flowers", "bush", "tree", "pebble", "flowers", "bench", "bush", "planter", "tree", "bin", "flowers", "bikeRack"];
    const targetScatter = i.id === "sport" ? 148 : i.id === "forest" ? 64 : ["civil", "institute", "transport"].includes(i.id) ? 26 : 40;
    while (placed < targetScatter && tries < 2600) {
      tries++;
      const lx = (rnd() - 0.5) * span,
        lz = (rnd() - 0.5) * span;
      if (!insideHex(lx, lz, inr)) continue;
      // Allow lush resort palms, flowerbeds, benches, and planters along the hotel avenues and outer promenade halo
      const x = c.x + lx,
        z = c.z + lz;
      if (blocked(i.id, x, z, 0.06)) continue;
      const t = types[placed % types.length];
      const rad = t === "tree" ? (i.id === "forest" ? 0.12 : 0.18) : t === "bench" ? 0.14 : 0.08;
      if (blocked(i.id, x, z, rad)) continue;
      if (!free(i.id, x, z, rad)) continue;
      placed++;
      kit.decor(i.id, t, () => {
        if (t === "bush") bush(x, z, 0.07 + rnd() * 0.05);
        else if (t === "flowers") flowers(x, z);
        else if (t === "pebble") pebble(x, z);
        else if (t === "tree") tree(x, z, (i.id === "forest" ? 0.34 : 0.28) + rnd() * 0.12);
        else if (t === "fern") ico(x, TOP + 0.05, z, [0.14, 0.1, 0.14], [0x6f8a62, 0x7f9a6a][Math.floor(rnd() * 2)]);
        else if (t === "rock") ico(x, TOP + 0.05, z, [0.12 + rnd() * 0.06, 0.09, 0.11], [0x9c8a7a, 0xb7a993][Math.floor(rnd() * 2)]);
        else if (t === "veg") {
          hbox(x, TOP + 0.02, z, 0.16, 0.04, 0.1, 0x7a5a42);
          for (let q = 0; q < 3; q++) ico(x - 0.05 + q * 0.05, TOP + 0.06, z, [0.045, 0.04, 0.045], [0x8fb37a, 0xa9c47f, 0xdb6a41][q]);
        }
        else if (t === "bin") bin(x, z);
        else if (t === "bench") bench(x, z, Math.round(rnd() * 3) * (Math.PI / 2));
        else if (t === "bikeRack") bikeRack(x, z, Math.round(rnd()) * (Math.PI / 2));
        else planter(x, z);
      });
    }
    // grass tufts everywhere free (tiny; skipped on paved granite islands like sport)
    if (i.id !== "sport") {
      for (let k = 0; k < 40; k++) {
        const lx = (rnd() - 0.5) * span,
          lz = (rnd() - 0.5) * span;
        if (!insideHex(lx, lz, inr + 0.02)) continue;
        const x = c.x + lx,
          z = c.z + lz;
        if (blocked(i.id, x, z, 0.02)) continue;
        kit.decor(i.id, "tuft", () => ico(x, TOP + 0.01, z, [0.05, 0.02, 0.05], 0x93ab76));
      }
    }
  }

  // ---------- pennant bunting strung between corner lamps (card, family, education, youth) ----------
  const BUNT = { card: [0xdb6a41, 0xe8c547, 0x58a6a6, 0xf2a1a1], youth: [0xdb6a41, 0xe8b04a, 0xf3e2c6, 0x3e7c8c] };
  for (const [id, cols] of Object.entries(BUNT)) {
    const c = centers.get(id);
    kit.setIsland(id);
    for (let k = 0; k < 6; k++) {
      const [ax, az] = hexVertex(c.x, c.z, RING_R + 0.1, k),
        [bx, bz] = hexVertex(c.x, c.z, RING_R + 0.1, k + 1);
      kit.decor(id, "bunting", () => {
        const n = 9;
        for (let s = 1; s < n; s++) {
          const t = s / n,
            sag = Math.sin(t * Math.PI) * 0.08;
          const x = ax + (bx - ax) * t,
            z = az + (bz - az) * t;
          part("tetra", [x, TOP + 0.33 - sag, z], [0.06, 0.07, 0.012], cols[s % cols.length], null, [Math.PI, Math.atan2(bx - ax, bz - az) + Math.PI / 2, 0]);
        }
        const len = Math.hypot(bx - ax, bz - az);
        part("box", [(ax + bx) / 2, TOP + 0.33, (az + bz) / 2], [0.006, 0.006, len], 0x5a4a3e, null, [0, Math.atan2(bx - ax, bz - az), 0]);
      });
    }
  }
  // ---------- island-specific edge trims and canal features ----------
  const TRIM = {
    civil: { kind: "balustrade", c: 0xe6d8c2, c2: 0xcdbb9f },
    institute: { kind: "glassrail", c: 0x3e7c8c, c2: 0xcfe6e6 },
    renewal: { kind: "barrier", c: 0xdb6a41, c2: 0xf2efe8 },
    transport: { kind: "bollards", c: 0xe8c547, c2: 0x3b3a42 },
    education: { kind: "picket", c: 0xf6e7a8, c2: 0xffffff },
    lunch: { kind: "bamboo", c: 0xc9b27a, c2: 0x9c7a4e },
    family: { kind: "picket", c: 0xf2b5c6, c2: 0x9fc4e6 },
    card: { kind: "planterwall", c: 0xd4a07e, c2: 0x9cc27a },
    welfare: { kind: "hedge", c: 0x8db86f, c2: 0x9cc27a },
    sport: { kind: "balustrade", c: 0xf3ead8, c2: 0xd8a848 },
    trails: { kind: "glassrail", c: 0xb88b4a, c2: 0xd5ecee },
    forest: { kind: "ferns", c: 0x7f9a6a, c2: 0x9a7454 },
    youth: { kind: "paintwall", c: 0xe8c547, c2: 0x58a6a6 },
    diplomacy: { kind: "pilings", c: 0x8a6a4e, c2: 0xd8c39a },
    hakka: { kind: "stonewall", c: 0xc77b5c, c2: 0xe2cdb3 },
    water: { kind: "ferns", c: 0x6f9a7a, c2: 0x8a6a4e },
    ai: { kind: "glassrail", c: 0x2f5a6a, c2: 0xd5ecee },
    luxury: { kind: "balustrade", c: 0xf4ecdc, c2: 0xd8a848 },
    innovation: { kind: "glassrail", c: 0x3b6978, c2: 0xd8eef2 },
    esg: { kind: "planterwall", c: 0x8fb37a, c2: 0xa9c98a },
  };
  const CANAL = {
    welfare: "barge",
    family: "duck",
    forest: "duck",
    lunch: "raft",
    sport: "kayak",
    education: "paperboat",
    youth: "lantern",
    card: "paperboat",
    trails: "stones",
    institute: "buoy",
    civil: "barge",
    transport: "ferry",
    diplomacy: "buoy",
    renewal: "boom",
    hakka: "paperboat",
    water: "kayak",
    ai: "buoy",
    luxury: "lantern",
    innovation: "buoy",
    esg: "paperboat",
  };
  for (const i of D.islands) {
    const c = centers.get(i.id),
      r = islandR(i.id),
      T = TRIM[i.id];
    if (!T) continue;
    kit.setIsland(i.id);
    treeIsland = i.id;
    const nb = neighbors.get(i.id);
    const bridgeDirs = nb.filter((n) => n.id).map((n) => dirOf(n.dq, n.dr));
    for (let e = 0; e < 6; e++) {
      const [ax, az] = hexVertex(c.x, c.z, r - 0.05, e),
        [bx, bz] = hexVertex(c.x, c.z, r - 0.05, e + 1);
      const mx = (ax + bx) / 2 - c.x,
        mz = (az + bz) / 2 - c.z,
        ml = Math.hypot(mx, mz);
      const hasBridge = r === R && bridgeDirs.some(([dx, dz]) => (dx * mx + dz * mz) / ml > 0.95);
      const yaw = Math.atan2(bx - ax, bz - az);
      const N = i.id === "sport" ? 18 : 9;
      for (let s = 0; s <= N; s++) {
        const t = s / N;
        if (hasBridge && Math.abs(t - 0.5) < 0.17) continue;
        const x = ax + (bx - ax) * t,
          z = az + (bz - az) * t;
        if (nearBridgeAt(i.id, x, z, 0.36)) continue;
        const nextX = ax + ((bx - ax) * (s + 1)) / N,
          nextZ = az + ((bz - az) * (s + 1)) / N;
        const skipSeg = s >= N || nearBridgeAt(i.id, (x + nextX) / 2, (z + nextZ) / 2, 0.32);
        const seg = Math.hypot(bx - ax, bz - az) / N;
        kit.decor(i.id, "trim:" + T.kind, () => {
          switch (T.kind) {
            case "balustrade":
              cyl(x, TOP + 0.09, z, 0.05, 0.16, T.c);
              if (!skipSeg) hbox(x + (bx - ax) / N / 2, TOP + 0.175, z + (bz - az) / N / 2, 0.05, 0.03, seg, T.c2, null, [0, yaw, 0]);
              break;
            case "glassrail":
              cyl(x, TOP + 0.07, z, 0.014, 0.14, T.c);
              if (s < N) hbox(x + (bx - ax) / N / 2, TOP + 0.08, z + (bz - az) / N / 2, 0.008, 0.1, seg, T.c2, null, [0, yaw, 0]);
              break;
            case "barrier":
              if (s < N) box(x + (bx - ax) / N / 2, TOP + 0.05, z + (bz - az) / N / 2, 0.05, 0.08, seg * 0.85, s % 2 ? T.c : T.c2, null, [0, yaw, 0]);
              break;
            case "bollards":
              cyl(x, TOP + 0.05, z, 0.04, 0.09, T.c2);
              cyl(x, TOP + 0.08, z, 0.042, 0.02, T.c);
              break;
            case "picket":
              for (const q of [0, 0.5]) if (s < N || q === 0) {
                const px = x + ((bx - ax) / N) * q,
                  pz = z + ((bz - az) / N) * q;
                hbox(px, TOP + 0.09, pz, 0.035, 0.17, 0.035, (s * 2 + q * 2) % 2 ? T.c : T.c2, null, [0, yaw, 0]);
                part("tetra", [px, TOP + 0.19, pz], [0.05, 0.04, 0.05], (s * 2 + q * 2) % 2 ? T.c : T.c2, null, [0, yaw + Math.PI / 4, 0]);
              }
              if (s < N) for (const hh of [0.06, 0.13]) hbox(x + (bx - ax) / N / 2, TOP + hh, z + (bz - az) / N / 2, 0.016, 0.022, seg, T.c2, null, [0, yaw, 0]);
              break;
            case "bamboo":
              for (const d of [-0.025, 0.025]) cyl(x + Math.cos(yaw) * d, TOP + 0.1, z - Math.sin(yaw) * d, 0.022, 0.2 + (s % 3) * 0.03, T.c);
              if (s < N) for (const hh of [0.08, 0.15]) hbox(x + (bx - ax) / N / 2, TOP + hh, z + (bz - az) / N / 2, 0.016, 0.016, seg, T.c2, null, [0, yaw, 0]);
              break;
            case "planterwall":
              if (s < N) {
                box(x + (bx - ax) / N / 2, TOP + 0.06, z + (bz - az) / N / 2, 0.12, 0.11, seg * 0.92, T.c, null, [0, yaw, 0]);
                sphere(x + (bx - ax) / N / 2, TOP + 0.14, z + (bz - az) / N / 2, [0.11, 0.08, seg * 0.48], [0x9cc27a, 0xf2b5c6, 0xfcea8b][s % 3]);
              }
              break;
            case "hedge":
              if (s < N) sphere(x + (bx - ax) / N / 2, TOP + 0.09, z + (bz - az) / N / 2, [0.16, 0.16, seg * 0.66], s % 2 ? T.c : T.c2);
              break;
            case "trackedge":
              if (s < N) {
                hbox(x + (bx - ax) / N / 2, TOP + 0.01, z + (bz - az) / N / 2, 0.08, 0.012, seg, T.c, null, [0, yaw, 0]);
                hbox(x + (bx - ax) / N / 2, TOP + 0.017, z + (bz - az) / N / 2, 0.006, 0.004, seg, T.c2, null, [0, yaw, 0]);
              }
              break;
            case "stonewall":
              ico(x, TOP + 0.04, z, [0.09 + rnd() * 0.03, 0.07, 0.08], rnd() < 0.5 ? T.c : T.c2);
              break;
            case "ferns":
              ico(x, TOP + 0.07, z, [0.17, 0.13, 0.17], [0x7f9a6a, 0x6f8a62, 0x8db86f][s % 3]);
              if (s % 3 === 0) tree(x, z, 0.3 + rnd() * 0.1);
              if (s % 4 === 1) part("cylinder", [x, TOP + 0.03, z], [0.04, 0.16, 0.04], T.c2, null, [Math.PI / 2, yaw, 0]);
              break;
            case "paintwall":
              if (s < N) box(x + (bx - ax) / N / 2, TOP + 0.09, z + (bz - az) / N / 2, 0.05, 0.16, seg * 0.94, [0xe8b04a, 0xf3e2c6, 0xdb6a41, 0x3e7c8c][s % 4], null, [0, yaw, 0]);
              break;
            case "pilings":
              cyl(x, TOP - 0.02, z, 0.045, 0.2, T.c);
              if (s % 2 === 0 && s < N) part("cylinder", [x + (bx - ax) / N, TOP + 0.05, z + (bz - az) / N], [0.012, seg * 2, 0.012], T.c2, null, [Math.PI / 2, yaw, 0]);
              break;
          }
        });
      }
      // canal features on the water just outside this edge (away from bridge centre)
      const feat = CANAL[i.id];
      for (const t of [0.15, 0.32, 0.68, 0.85]) {
        const ox = (mx / ml) * 0.24,
          oz = (mz / ml) * 0.24;
        const x = ax + (bx - ax) * t + ox,
          z = az + (bz - az) * t + oz;
        kit.decor(i.id, "canal:" + feat, () => canalFeature(kit, feat, x, z, yaw, rnd));
      }
    }
  }
  // ---------- waterfront ledges and themed surroundings ----------
  const islandIds = D.islands.map((i) => i.id);
  const nearOther = (id, x, z, clear) => islandIds.some((o) => o !== id && Math.hypot(centers.get(o).x - x, centers.get(o).z - z) < islandR(o) + clear);
  const ledgeInfo = new Map();
  for (const i of D.islands) {
    const c = centers.get(i.id);
    const nb = neighbors.get(i.id);
    const ledges = [];
    for (const n of nb) {
      if (n.id) continue;
      const [dx, dz] = dirOf(n.dq, n.dr);
      const inr = islandR(i.id) * 0.8660254;
      const mx = c.x + dx * (inr + 0.34),
        mz = c.z + dz * (inr + 0.34);
      const yaw = Math.atan2(dx, dz);
      const tx = Math.cos(yaw),
        tz = -Math.sin(yaw); // along edge
      const ends = [-0.75, 0.75].map((s) => [mx + tx * s + dx * 0.3, mz + tz * s + dz * 0.3]);
      if (ends.some(([x, z]) => nearOther(i.id, x, z, 0.5)) || nearOther(i.id, mx, mz, 0.4)) continue;
      ledges.push({ mx, mz, dx, dz, tx, tz, yaw });
    }
    ledgeInfo.set(i.id, ledges);
    kit.setIsland(i.id);
    treeIsland = i.id;
    const theme = THEMES[i.id] || { ledge: 0xd8ccb8, fn() {} };
    for (const [li, L] of ledges.entries()) {
      const ledgeTop = W + 0.13;
      const BASE = { sport: "terrace", trails: "terrace", luxury: "terrace", innovation: "slab", esg: "mangrove", forest: "mangrove", education: "beach", family: "playdock", welfare: "pond", civil: "terrace", institute: "amphi", lunch: "farmshore", youth: "seawall", card: "playdock" };
      const base = BASE[i.id] || "slab";
      kit.decor(i.id, "v:ledge:" + base, () => {
        const along = (u, v) => [L.mx + L.tx * u + L.dx * v, L.mz + L.tz * u + L.dz * v];
        if (base === "rocks") {
          // rocky shore with a trailhead ramp, no paved slab
          for (let s = 0; s < 16; s++) {
            const [x, z] = along(-0.8 + rnd() * 1.6, -0.25 + rnd() * 0.6);
            ico(x, W + 0.04 + rnd() * 0.08, z, [0.12 + rnd() * 0.16, 0.1 + rnd() * 0.12, 0.12 + rnd() * 0.14], [0x9c8a7a, 0xb7a993, 0x8f8172, 0xa59a8a][s % 4]);
          }
          for (let s = 0; s < 6; s++) {
            const [x, z] = along(-0.1 + s * 0.12, -0.28 + s * 0.02);
            hbox(x, W + 0.15 + (5 - s) * 0.075, z, 0.14, 0.04, 0.14, 0xb7a993, null, [0, L.yaw, 0]);
          }
          return;
        }
        if (base === "mangrove") {
          for (let s = 0; s < 9; s++) {
            const [x, z] = along(-0.75 + s * 0.19, -0.05 + (s % 2) * 0.22);
            for (let r = 0; r < 3; r++) part("cylinder", [x + (r - 1) * 0.04, W + 0.06, z], [0.02, 0.16, 0.02], 0x7a5d44, null, [0, 0, (r - 1) * 0.35]);
            tree(x, z, 0.28 + rnd() * 0.08, W + 0.12, 1);
          }
          for (let s = 0; s < 8; s++) {
            const [x, z] = along(-0.7 + s * 0.2, 0.3);
            hbox(x, W + 0.09, z, 0.2, 0.025, 0.12, s % 2 ? 0xa77a55 : 0xb48560, null, [0, L.yaw, 0]);
          }
          return;
        }
        if (base === "farmshore") {
          const [x0, z0] = along(0, 0.02);
          ico(x0, W + 0.02, z0, [1.8, 0.12, 0.62], 0x9c7a5a);
          for (let r = 0; r < 3; r++)
            for (let s = 0; s < 7; s++) {
              const [x, z] = along(-0.6 + s * 0.2, -0.15 + r * 0.17);
              ico(x, W + 0.12, z, [0.07, 0.06, 0.07], [0x8fb37a, 0xa9c47f, 0x6f8a62][r]);
            }
          for (let s = 0; s < 3; s++) {
            const [x, z] = along(-0.5 + s * 0.5, 0.33);
            kit.box(x, W + 0.05, z, 0.22, 0.06, 0.14, 0xb48560, null, [0, L.yaw, 0]);
            sphere(x, W + 0.1, z, [0.08, 0.05, 0.06], [0xdb6a41, 0xe8c547, 0x8fb37a][s]);
          }
          return;
        }
        if (base === "seawall") {
          for (let s = 0; s < 8; s++) {
            const [x, z] = along(-0.75 + s * 0.215, 0.2);
            kit.box(x, W + 0.15, z, 0.2, 0.3, 0.12, [0xdb6a41, 0xf3e2c6, 0xe8b04a, 0xe7a383, 0x3e7c8c][s % 5], null, [0, L.yaw, 0]);
          }
          for (let s = 0; s < 4; s++) {
            const [x, z] = along(-0.6 + s * 0.4, -0.05);
            ico(x, W + 0.06, z, [0.16, 0.1, 0.14], 0x9c8a7a);
          }
          return;
        }
        if (base === "amphi") {
          for (let s = 0; s < 4; s++) {
            const [x, z] = along(0, -0.22 + s * 0.13);
            kit.hbox(x, W + 0.24 - s * 0.055, z, 1.5 - s * 0.12, 0.05, 0.12, s % 2 ? 0xe6edea : 0xcfd8d3, null, [0, L.yaw, 0]);
          }
          const [bx, bz] = along(0, 0.36);
          cyl(bx, W + 0.05, bz, 0.4, 0.06, 0x3e7c8c);
          for (const u of [-0.6, 0.6]) {
            const [x, z] = along(u, 0.3);
            cyl(x, W + 0.3, z, 0.02, 0.4, 0x3e7c8c);
            bulb(x, W + 0.52, z, 0.03, 0x9fffd0);
          }
          return;
        }
        if (base === "instruments") {
          for (let s = 0; s < 3; s++) {
            const [x, z] = along(-0.55 + s * 0.55, 0.15 + (s % 2) * 0.15);
            cyl(x, W + 0.06, z, 0.16, 0.12, 0xf2efe8);
            cyl(x, W + 0.3, z, 0.02, 0.4, 0x3e7c8c);
            sphere(x, W + 0.52, z, 0.05, 0x3e7c8c);
            bulb(x, W + 0.58, z, 0.03, 0x9fffd0);
            kit.hbox(x, W + 0.4, z, 0.18, 0.01, 0.01, 0x211d1d);
          }
          const [px, pz] = along(0, -0.15);
          kit.hbox(px, W + 0.12, pz, 1.4, 0.03, 0.16, 0xcfd8d3, null, [0, L.yaw, 0]);
          return;
        }
        if (base === "playdock") {
          const [x0, z0] = along(0, 0.02);
          kit.hbox(x0, W + 0.1, z0, 1.6, 0.06, 0.6, i.id === "card" ? 0x8fc8cf : 0xf2d0b4, null, [0, L.yaw, 0]);
          for (let s = 0; s < 6; s++) {
            const [x, z] = along(-0.65 + s * 0.26, 0.0);
            sphere(x, W + 0.17, z, 0.06, [0xdb6a41, 0xe8c547, 0x58a6a6, 0xf2a1a1][s % 4]);
          }
          const [sx, sz] = along(0.45, 0.12);
          kit.box(sx, W + 0.24, sz, 0.12, 0.24, 0.12, 0xe8c547);
          kit.part("box", [sx - L.tx * 0.14, W + 0.22, sz - L.tz * 0.14], [0.08, 0.02, 0.3], 0xdb6a41, null, [0.55, L.yaw + Math.PI / 2, 0]);
          return;
        }
        if (base === "beach" || base === "pond") {
          const [x0, z0] = along(0, 0.02);
          ico(x0, W + 0.02, z0, [1.9, 0.12, 0.7], base === "beach" ? 0xead7a6 : 0xb4c993);
          if (base === "beach") {
            for (let s = 0; s < 3; s++) {
              const [x, z] = along(-0.55 + s * 0.5, -0.05);
              cyl(x, W + 0.25, z, 0.018, 0.36, 0x8a6a4e);
              part("cone", [x, W + 0.44, z], [0.36, 0.1, 0.36], [0xdb6a41, 0xe8c547, 0x58a6a6][s]);
            }
            for (let s = 0; s < 4; s++) {
              const [x, z] = along(-0.6 + s * 0.38, 0.2);
              hbox(x, W + 0.1, z, 0.08, 0.008, 0.16, [0xf2a1a1, 0x9fc4e6, 0xfcea8b, 0xffffff][s], null, [0, L.yaw, 0]);
            }
          } else {
            const [px, pz] = along(0, 0.05);
            cyl(px, W + 0.07, pz, 0.9, 0.012, 0x8fc8cf);
            for (let s = 0; s < 7; s++) {
              const [x, z] = along(-0.35 + rnd() * 0.7, -0.08 + rnd() * 0.26);
              cyl(x, W + 0.082, z, 0.09, 0.006, 0x7f9a6a);
              if (s % 2) sphere(x, W + 0.1, z, 0.03, 0xf2b5c6);
            }
            for (const s of [-0.65, 0.65]) {
              const [x, z] = along(s, -0.05);
              hbox(x, W + 0.15, z, 0.2, 0.025, 0.07, 0xb48560, null, [0, L.yaw, 0]);
            }
          }
          return;
        }
        // paved slab (default) or terrace with fountain (scaled to full hex edge on sport)
        const lw = i.id === "sport" ? 3.88 * (islandR("sport") / 3.68) : 1.7;
        hbox(L.mx, (ledgeTop + W - 0.12) / 2, L.mz, lw, ledgeTop - W + 0.12, 0.64, new THREE.Color(theme.ledge).offsetHSL(0, 0, -0.08).getHex(), null, [0, L.yaw, 0]);
        hbox(L.mx, ledgeTop - 0.01, L.mz, lw - 0.02, 0.03, 0.62, theme.ledge, null, [0, L.yaw, 0]);
        hbox(L.mx + L.dx * 0.31, ledgeTop + 0.03, L.mz + L.dz * 0.31, lw - 0.04, 0.05, 0.03, 0xe4d6c3, null, [0, L.yaw, 0]);
        const seam = new THREE.Color(theme.ledge).offsetHSL(0, 0, -0.06).getHex();
        const seamN = i.id === "sport" ? 7 : 3;
        for (let s = -seamN; s <= seamN; s++) hbox(L.mx + L.tx * s * 0.24, ledgeTop + 0.006, L.mz + L.tz * s * 0.24, 0.012, 0.004, 0.6, seam, null, [0, L.yaw, 0]);
        if (base === "terrace") {
          const bannerU = i.id === "sport" ? [-1.65, -1.2, -0.7, -0.35, 0.35, 0.7, 1.2, 1.65] : [-0.7, -0.35, 0.35, 0.7];
          for (const u of bannerU) {
            const [x, z] = along(u, 0.24);
            cyl(x, ledgeTop + 0.3, z, 0.012, 0.6, 0x5a4a3e);
            kit.hbox(x + L.tx * 0.05, ledgeTop + 0.48, z + L.tz * 0.05, 0.1, 0.2, 0.008, [0xdb6a41, 0xfcea8b][Math.abs(Math.round(u * 10)) % 2], null, [0, L.yaw, 0]);
          }
          for (const fu of i.id === "sport" ? [-1.32, 0, 1.32] : [0]) {
            const [fx, fz] = along(fu, 0.02);
            const fs = fu === 0 ? 1 : 0.76;
            cyl(fx, ledgeTop + 0.03, fz, 0.42 * fs, 0.05, 0xe6d8c2);
            cyl(fx, ledgeTop + 0.056, fz, 0.36 * fs, 0.01, 0x8fc8cf);
            cyl(fx, ledgeTop + 0.13, fz, 0.05 * fs, 0.16, 0xe6d8c2);
            sphere(fx, ledgeTop + 0.22, fz, [0.1 * fs, 0.05, 0.1 * fs], 0xcfe6e6);
          }
          return;
        }
        hbox(L.mx - L.dx * 0.25, ledgeTop + 0.02, L.mz - L.dz * 0.25, 1.6, 0.04, 0.1, 0x9fb684, null, [0, L.yaw, 0]);
        for (let s = -3; s <= 3; s++) {
          const bx = L.mx + L.tx * (s * 0.23 + 0.05) - L.dx * 0.25,
            bz = L.mz + L.tz * (s * 0.23 + 0.05) - L.dz * 0.25;
          sphere(bx, ledgeTop + 0.07, bz, [0.09, 0.07, 0.08], [0x9cc27a, 0x8db86f, 0xa9c98a][(s + 3) % 3]);
        }
        for (const s of [-0.7, 0, 0.7]) cyl(L.mx + L.tx * s + L.dx * 0.29, ledgeTop + 0.04, L.mz + L.tz * s + L.dz * 0.29, 0.035, 0.06, C.ink);
        if (li % 2 === 0)
          for (let s = 0; s < 7; s++) {
            const u = 0.25 + s * 0.085,
              v = -0.24,
              yTopStep = TOP - (s + 0.5) * ((TOP - ledgeTop) / 7);
            const hgt = Math.max(0.03, yTopStep - ledgeTop);
            hbox(L.mx + L.tx * u + L.dx * v, ledgeTop + hgt / 2, L.mz + L.tz * u + L.dz * v, 0.09, hgt, 0.16, 0xd2c3ad, null, [0, L.yaw, 0]);
          }
      });
      const P = (u, v) => [L.mx + L.tx * u + L.dx * v, L.mz + L.tz * u + L.dz * v];
      if ((base === "slab" || base === "playdock" || i.id === "sport" || i.id === "trails") && theme.fn) theme.fn({ P, L, y: ledgeTop, li, id: i.id, kit, markers: diplomacyMarkers, helpers: { tree, bush, flowers, lamp, bench, bin, bikeRack, planter, pebble }, rnd, C, ambientSpots, W, nearOther });
    }
    // themed items on top band (unique per island) — around island at band corners
    if (theme.top) theme.top({ c, id: i.id, kit, helpers: { tree, bush, flowers, lamp, bench, bin, bikeRack, planter, pebble }, rnd, C, ambientSpots });
  }

  // ---------- islets (organic, non-hexagonal, decorative) ----------
  const islets = [];
  const isletInfo = [];
  const cc = new THREE.Vector3();
  for (const v of centers.values()) cc.add(v);
  cc.divideScalar(centers.size);
  let tries = 0,
    sector = 0,
    sectorTries = 0;
  kit.setIsland(null);
  // evenly spread around the city (one per 30° sector), jittered. A sector that keeps failing (e.g. the water reserved for
  // the Kaohsiung harbour islands) is skipped after 40 tries instead of using up every try on the same angle.
  const nextSector = () => {
    sector++;
    sectorTries = 0;
  };
  while (sector < 12 && islets.length < 12 && tries++ < 900) {
    const a = (sector / 12) * Math.PI * 2 + (rnd() - 0.5) * 0.35,
      r = 10 + rnd() * 4.5;
    const x = cc.x + Math.cos(a) * r * 1.05,
      z = cc.z + Math.sin(a) * r * 0.95;
    const blocked =
      islandIds.some((o) => Math.hypot(centers.get(o).x - x, centers.get(o).z - z) < islandR(o) + 2.4) ||
      islets.some(([ix, iz]) => Math.hypot(ix - x, iz - z) < 3) ||
      isReserved(x, z, 1.2);
    if (blocked) {
      if (++sectorTries > 40) nextSector();
      continue;
    }
    nextSector();
    islets.push([x, z]);
    const s = 0.6 + rnd() * 0.9;
    const theme = ["grove", "lighthouse", "sandbar", "rocks", "teahill", "pavilion", "currentShip", "windmill", "fishhut", "orchardIslet", "rocks", "pavilion"][islets.length - 1];
    isletInfo.push({ x, z, s, theme });
    kit.decor("_islets", "islet:" + theme, () => {
      const sand = theme === "sandbar";
      cyl(x, W + 0.02, z, s * (sand ? 1.6 : 2.2), 0.32, 0xd9c9a3);
      if (!sand) ico(x, W + 0.16, z, [s * 1.9, s * 0.55, s * 1.7], theme === "rocks" ? 0xb7a993 : 0xa9bf8e);
      if (theme === "grove" || theme === "pavilion") for (let k = 0; k < 2 + Math.floor(s * 3); k++) tree(x + (rnd() - 0.5) * s * 1.2, z + (rnd() - 0.5) * s * 1.0, 0.35 + rnd() * 0.3, W + 0.35);
      if (theme === "rocks") for (let k = 0; k < 6; k++) ico(x + (rnd() - 0.5) * s * 1.6, W + 0.25 + rnd() * 0.2, z + (rnd() - 0.5) * s * 1.4, [0.3 + rnd() * 0.3, 0.25 + rnd() * 0.3, 0.3], [0x9c8a7a, 0xb7a993, 0x8f8172][k % 3]);
      if (theme === "lighthouse") {
        cyl(x, W + 0.75, z, 0.32, 1.0, 0xffffff);
        for (let k = 0; k < 3; k++) cyl(x, W + 0.4 + k * 0.32, z, 0.33, 0.1, 0xdb6a41);
        cyl(x, W + 1.32, z, 0.26, 0.16, 0x3e7c8c);
        bulb(x, W + 1.32, z, 0.12, 0xfff0c2);
        lighthouses.push([x, W + 1.32, z]);
        part("cone6", [x, W + 1.5, z], [0.36, 0.22, 0.36], 0xdb6a41);
        tree(x + s * 0.6, z + s * 0.3, 0.4, W + 0.35);
      }
      if (sand) {
        ico(x, W + 0.17, z, [s * 1.5, s * 0.16, s * 1.2], 0xead7a6);
        for (let k = 0; k < 3; k++) reeds(kit, x + (k - 1) * s * 0.45, z - s * 0.35 + (k % 2) * 0.12, W + 0.24, rnd);
        for (let k = 0; k < 3; k++) kit.hbox(x - 0.3 + k * 0.28, W + 0.255, z + s * 0.3, 0.16, 0.01, 0.26, [0xdb6a41, 0x3e7c8c, 0xe8b04a][k], null, [0, 0.2, 0]);
        for (let k = 0; k < 2; k++) {
          cyl(x + (k - 0.5) * 0.5, W + 0.45, z, 0.02, 0.5, 0x8a6a4e);
          part("cone", [x + (k - 0.5) * 0.5, W + 0.68, z], [0.4, 0.14, 0.4], [0xdb6a41, 0xe8c547][k]);
        }
      }
      if (theme === "windmill") {
        for (let k = 0; k < 2; k++) {
          const tx = x + (k - 0.5) * s * 0.9, tz = z + (k - 0.5) * 0.3;
          cyl(tx, W + 0.9, tz, 0.05, 1.3, 0xf6f4ef);
          kit.box(tx, W + 1.55, tz + 0.06, 0.1, 0.08, 0.12, 0xf6f4ef);
          for (let b = 0; b < 3; b++) part("box", [tx, W + 1.55, tz + 0.13], [0.04, 0.62, 0.012], 0xffffff, null, [0, 0, (b * Math.PI * 2) / 3 + k]);
        }
      }
      if (theme === "fishhut") {
        for (let k = 0; k < 2; k++) {
          kit.box(x + (k - 0.5) * 0.6, W + 0.48, z, 0.42, 0.34, 0.36, [0xf4ebdd, 0xe9dcc4][k]);
          part("hip", [x + (k - 0.5) * 0.6, W + 0.78, z], [0.5, 0.26, 0.44], [0x5f9aa6, 0xdb6a41][k]);
        }
        for (let k = 0; k < 4; k++) hbox(x + s * 0.9 + k * 0.28, W + 0.14, z + 0.3, 0.3, 0.04, 0.24, k % 2 ? 0xa77a55 : 0xb48560);
        for (let k = 0; k < 3; k++) cyl(x - s * 0.7 + k * 0.12, W + 0.5, z - 0.4, 0.012, 0.5, 0x8a6a4e);
      }
      if (theme === "orchardIslet") for (let k = 0; k < 5; k++) {
        const ox = x + (k - 2) * 0.32, oz = z + ((k % 2) - 0.5) * 0.4;
        cyl(ox, W + 0.45, oz, 0.035, 0.22, 0x8a6a4e);
        part("leaf", [ox, W + 0.64, oz], [0.3, 0.24, 0.3], [0x8db86f, 0x9cc27a][k % 2]);
        sphere(ox + 0.08, W + 0.62, oz + 0.1, 0.035, 0xf2a33a);
      }
      if (theme === "teahill") for (let r = 0; r < 4; r++) cyl(x, W + 0.3 + r * 0.12, z, s * (1.7 - r * 0.35), 0.1, [0x93ad74, 0x86a26a][r % 2]);
      if (theme === "reeds") for (let k = 0; k < 4; k++) reeds(kit, x + (rnd() - 0.5) * s * 1.4, z + (rnd() - 0.5) * s * 1.2, W + 0.25, rnd);
      if (theme === "currentShip") {
        for (let k = 0; k < 80; k++) rnd(); // 原本的蘆葦小島用掉 80 個亂數；照樣消耗，後面的船、海岸景物位置才不會變
        currentShip(kit, x, z, W, s);
      }
      if (theme === "pavilion") {
        for (const [dx, dz] of [
          [-0.15, -0.15],
          [0.15, -0.15],
          [-0.15, 0.15],
          [0.15, 0.15],
        ])
          cyl(x + dx, W + 0.55, z + dz, 0.025, 0.3, 0xa34e34);
        part("cone6", [x, W + 0.78, z], [0.55, 0.2, 0.55], 0xa34e34);
      }
    });
  }
  // a few boats & buoys in open water
  for (let k = 0; k < 16; k++) {
    const a = (k / 16) * Math.PI * 2 + (rnd() - 0.5) * 0.3,
      r = 9 + rnd() * 6;
    const x = cc.x + Math.cos(a) * r,
      z = cc.z + Math.sin(a) * r;
    if (islandIds.some((o) => Math.hypot(centers.get(o).x - x, centers.get(o).z - z) < islandR(o) + 1)) continue;
    if (isReserved(x, z, 0.6)) continue;
    kit.decor("_islets", "boat", () => boat(kit, x, z, rnd() * 6.28, W, rnd));
  }
  // ---------- A8: coastal scenery all the way round (8 sectors × 3 vignettes) ----------
  const COAST = ["fishingVillage", "pier", "wetland", "beach", "lookout", "seaRocks", "orchard", "floatGarden"];
  const coastStats = Array.from({ length: 8 }, () => ({ types: new Set(), items: 0 }));
  for (let k = 0; k < 24; k++) {
    const a = (k / 24) * Math.PI * 2 + 0.07;
    // march outward to the shoreline of the terrain
    let r = 11, y = -1;
    while (r < 40 && (y = heightAt(cc.x + Math.sin(a) * r, cc.z + Math.cos(a) * r)) < W + 0.12) r += 0.25;
    if (r >= 40) continue;
    const type = COAST[(k * 3 + Math.floor(k / 8)) % COAST.length];
    const dx = Math.sin(a), dz = Math.cos(a);
    const sx = cc.x + dx * r, sz = cc.z + dz * r; // shoreline point
    if (isReserved(sx - dx * 1.5, sz - dz * 1.5, 0.5)) continue;
    const yaw = Math.atan2(dx, dz) + Math.PI; // facing the city
    const land = (d) => [cc.x + dx * (r + d), cc.z + dz * (r + d)];
    const sector = Math.floor((((Math.atan2(dx, dz) + Math.PI * 2) % (Math.PI * 2)) / (Math.PI * 2)) * 8) % 8;
    const before = kit.batches ? [...kit.batches.values()].reduce((n, v) => n + v.length, 0) : 0;
    kit.decor("_coast", "coast:" + type, () => {
      const gy = (x, z) => Math.max(W, heightAt(x, z));
      if (type === "fishingVillage") {
        for (let j = 0; j < 4; j++) {
          const [x, z] = land(0.8 + (j % 2) * 0.9);
          const ox = Math.cos(a) * (j - 1.5) * 0.9, oz = -Math.sin(a) * (j - 1.5) * 0.9;
          const yy = gy(x + ox, z + oz);
          box(x + ox, yy + 0.22, z + oz, 0.5, 0.44, 0.42, [0xf4ebdd, 0xe9dcc4, 0xf2e2cf][j % 3], null, [0, yaw, 0]);
          part("hip", [x + ox, yy + 0.59, z + oz], [0.58, 0.3, 0.5], [0xdb6a41, 0xa34e34, 0x5f9aa6][j % 3], null, [0, yaw, 0]);
          glow(x + ox + Math.sin(yaw) * 0.215, yy + 0.24, z + oz + Math.cos(yaw) * 0.215, 0.1, 0.1, 0.01, 0xffe2a8);
        }
        for (let j = 0; j < 2; j++) boat(kit, sx - dx * (0.8 + j * 0.5) + Math.cos(a) * (j - 0.5) * 0.9, sz - dz * (0.8 + j * 0.5) - Math.sin(a) * (j - 0.5) * 0.9, yaw + 1.2, W, rnd, false);
      } else if (type === "pier") {
        for (let j = 0; j < 7; j++) {
          const x = sx - dx * j * 0.32, z = sz - dz * j * 0.32;
          hbox(x, W + 0.16, z, 0.36, 0.05, 0.3, j % 2 ? 0xb48560 : 0xa77a55, null, [0, yaw, 0]);
          if (j % 2 === 0) for (const sd of [-1, 1]) cyl(x + Math.cos(a) * sd * 0.17, W + 0.05, z - Math.sin(a) * sd * 0.17, 0.05, 0.3, 0x7a5d44);
        }
        cyl(sx - dx * 2.2, W + 0.5, sz - dz * 2.2, 0.02, 0.7, 0x211d1d);
        bulb(sx - dx * 2.2, W + 0.88, sz - dz * 2.2, 0.06, 0xfff0c2);
        boat(kit, sx - dx * 2.0 + Math.cos(a) * 0.5, sz - dz * 2.0 - Math.sin(a) * 0.5, yaw + 1.57, W, rnd, true);
      } else if (type === "wetland") {
        for (let j = 0; j < 7; j++) reeds(kit, sx - dx * (0.3 + rnd() * 1.2) + Math.cos(a) * (rnd() - 0.5) * 2.2, sz - dz * (0.3 + rnd() * 1.2) - Math.sin(a) * (rnd() - 0.5) * 2.2, W + 0.02, rnd);
        for (let j = 0; j < 3; j++) {
          const x = sx - dx * (1.2 + j * 0.3), z = sz - dz * (1.2 + j * 0.3) + (j - 1) * 0.4;
          cyl(x, W + 0.12, z, 0.02, 0.16, 0xf6efe3);
          sphere(x, W + 0.24, z, [0.08, 0.06, 0.12], 0xffffff);
        }
        for (let j = 0; j < 4; j++) hbox(sx + dx * 0.2 + Math.cos(a) * (j - 1.5) * 0.3, gy(sx, sz) + 0.06, sz + dz * 0.2 - Math.sin(a) * (j - 1.5) * 0.3, 0.28, 0.03, 0.2, 0xb48560, null, [0, yaw + Math.PI / 2, 0]);
      } else if (type === "beach") {
        ico(sx - dx * 0.2, W + 0.05, sz - dz * 0.2, [1.6, 0.12, 0.9], 0xead7a6);
        for (let j = 0; j < 3; j++) {
          const x = sx + Math.cos(a) * (j - 1) * 0.6, z = sz - Math.sin(a) * (j - 1) * 0.6;
          cyl(x, W + 0.32, z, 0.02, 0.5, 0x8a6a4e);
          part("cone", [x, W + 0.58, z], [0.42, 0.14, 0.42], [0xdb6a41, 0xe8b04a, 0x3e7c8c][j], null);
          hbox(x + 0.18, W + 0.1, z, 0.16, 0.01, 0.3, [0xffffff, 0xf3e2c6, 0xe7a383][j], null, [0, yaw, 0]);
        }
      } else if (type === "lookout") {
        const [x, z] = land(0.9);
        const yy = gy(x, z);
        for (const [ox, oz] of [[-0.2, -0.2], [0.2, -0.2], [-0.2, 0.2], [0.2, 0.2]]) cyl(x + ox, yy + 0.4, z + oz, 0.035, 0.8, 0x8a6a4e);
        hbox(x, yy + 0.82, z, 0.6, 0.05, 0.6, 0xb48560);
        part("cone6", [x, yy + 1.15, z], [0.8, 0.4, 0.8], 0xa34e34);
        for (let j = 0; j < 4; j++) box(x - dx * (0.4 + j * 0.25), gy(x, z) + 0.02, z - dz * (0.4 + j * 0.25), 0.2, 0.04, 0.12, 0xd2c3ad, null, [0, yaw, 0]);
      } else if (type === "seaRocks") {
        for (let j = 0; j < 5; j++) ico(sx - dx * (0.6 + rnd() * 1.4) + Math.cos(a) * (rnd() - 0.5) * 1.8, W + 0.15, sz - dz * (0.6 + rnd() * 1.4) - Math.sin(a) * (rnd() - 0.5) * 1.8, [0.35 + rnd() * 0.35, 0.3 + rnd() * 0.45, 0.35 + rnd() * 0.3], [0x9c8a7a, 0xb7a993, 0x8f8172][j % 3]);
        const [x, z] = [sx - dx * 1.6, sz - dz * 1.6];
        cyl(x, W + 0.45, z, 0.16, 0.7, 0xffffff);
        cyl(x, W + 0.45, z, 0.17, 0.12, 0xdb6a41);
        bulb(x, W + 0.86, z, 0.08, 0xfff0c2);
        lighthouses.push([x, W + 0.86, z]);
      } else if (type === "orchard") {
        for (let j = 0; j < 6; j++) {
          const [x, z] = land(0.8 + (j % 2) * 0.7);
          const ox = Math.cos(a) * (Math.floor(j / 2) - 1) * 0.7, oz = -Math.sin(a) * (Math.floor(j / 2) - 1) * 0.7;
          const yy = gy(x + ox, z + oz);
          cyl(x + ox, yy + 0.12, z + oz, 0.04, 0.24, 0x8a6a4e);
          part("leaf", [x + ox, yy + 0.34, z + oz], [0.32, 0.26, 0.32], [0x8db86f, 0x9cc27a][j % 2]);
          for (let f = 0; f < 3; f++) sphere(x + ox + (rnd() - 0.5) * 0.2, yy + 0.32 + rnd() * 0.08, z + oz + 0.14, 0.035, 0xf2a33a);
        }
      } else if (type === "floatGarden") {
        for (let j = 0; j < 3; j++) {
          const x = sx - dx * (1.0 + j * 0.55) + Math.cos(a) * (j - 1) * 0.5, z = sz - dz * (1.0 + j * 0.55) - Math.sin(a) * (j - 1) * 0.5;
          cyl(x, W + 0.04, z, 0.42, 0.08, 0xb48560);
          for (let f = 0; f < 4; f++) sphere(x + (rnd() - 0.5) * 0.3, W + 0.12, z + (rnd() - 0.5) * 0.3, 0.08, [0xf2b5c6, 0xfcea8b, 0x9cc27a, 0xffffff][f]);
        }
      }
    });
    const after = kit.batches ? [...kit.batches.values()].reduce((n, v) => n + v.length, 0) : 0;
    coastStats[sector].types.add(type);
    coastStats[sector].items += Math.max(1, after - before);
  }
  // islets and boats also count toward their sector
  for (const [x, z] of islets) {
    const sct = Math.floor((((Math.atan2(x - cc.x, z - cc.z) + Math.PI * 2) % (Math.PI * 2)) / (Math.PI * 2)) * 8) % 8;
    coastStats[sct].types.add("islet");
    coastStats[sct].items += 1;
  }
  // route ends: partner-city islets, positions handed to app.js for name tags
  const routeEnds = [];
  const routes = [];
  for (const { P, L } of diplomacyMarkers) {
    for (const [side, k] of [
      [-2.4, 5],
      [2.6, 5],
    ]) {
      const [x, z] = P(side + Math.sin(k * 0.35) * 0.15, 1.3 + k * 0.42);
      // overseas hospitality partner islets: Asian luxury onsen/skyscraper resort & European palace hotel marina
      const which = routeEnds.length;
      kit.decor("_islets", "partnerIslet", () => {
        cyl(x, WATER_Y + 0.02, z, 2.4, 0.3, 0xd9c9a3);
        ico(x, WATER_Y + 0.14, z, [2.1, 0.4, 1.9], 0xa9bf8e);
        if (which % 2 === 0) {
          // Islet 0: Asian 5-star luxury skyscraper hotel + hot-spring ryokan pavilions
          ico(x - 0.15, WATER_Y + 0.38, z - 0.15, [1.05, 0.55, 0.95], 0x8db86f);
          box(x - 0.18, WATER_Y + 0.92, z - 0.15, 0.42, 0.96, 0.36, 0xdbe7ec);
          hbox(x - 0.18, WATER_Y + 1.42, z - 0.15, 0.46, 0.05, 0.4, 0xd8a848);
          part("dome", [x - 0.18, WATER_Y + 1.5, z - 0.15], [0.28, 0.12, 0.28], 0xffe49e);
          for (let r = 0; r < 5; r++) glow(x - 0.18, WATER_Y + 0.56 + r * 0.16, z + 0.035, 0.32, 0.08, 0.01, 0xffe49e);
          for (let b = 0; b < 3; b++) {
            const bx = x + 0.35 + b * 0.2,
              bz = z + 0.35 - b * 0.12;
            box(bx, WATER_Y + 0.44, bz, 0.22, 0.18, 0.18, 0xf4ebdd);
            part("hip", [bx, WATER_Y + 0.58, bz], [0.28, 0.1, 0.24], 0x4a3f35);
          }
        } else {
          // Islet 1: European 5-star grand palace hotel facing a yacht marina pier
          for (let b = 0; b < 3; b++) {
            const bx = x - 0.38 + b * 0.38,
              h = b === 1 ? 0.72 : 0.56;
            box(bx, WATER_Y + 0.3 + h / 2, z - 0.1, 0.34, h, 0.32, 0xf5ebd6);
            part("hip", [bx, WATER_Y + 0.3 + h + 0.07, z - 0.1], [0.38, 0.12, 0.36], 0x37474f);
            for (let r = 0; r < 3; r++) glow(bx, WATER_Y + 0.42 + r * 0.16, z + 0.065, 0.24, 0.07, 0.01, 0xfff1c8);
          }
          part("dome", [x, WATER_Y + 1.18, z - 0.1], [0.22, 0.14, 0.22], 0xd8a848);
          for (let s = 0; s < 6; s++) hbox(x - 0.1, WATER_Y + 0.1, z + 0.6 + s * 0.16, 0.3, 0.03, 0.14, s % 2 ? 0xa77a55 : 0xb48560);
        }
        tree(x - 0.75, z + 0.45, 0.32, WATER_Y + 0.3);
        tree(x + 0.8, z - 0.45, 0.3, WATER_Y + 0.3);
        cyl(x + 0.6, WATER_Y + 0.55, z + 0.55, 0.02, 0.5, 0xd8a848);
        part("prism", [x + 0.7, WATER_Y + 0.72, z + 0.55], [0.18, 0.2, 0.02], 0xdb6a41, null, [0, 0, -Math.PI / 2]);
      });
      routeEnds.push([x, z]);
      const cv = seaCurve(P, which);
      routes.push({ start: cv.start, ctrl: cv.ctrl, end: cv.end, islet: [x, z] });
    }
  }
  // string lights along every island's outer edge (night only; drawn by app.js)
  for (const i of D.islands) {
    const c = centers.get(i.id),
      r = islandR(i.id),
      nStr = i.id === "sport" ? 16 : 8;
    for (let e = 0; e < 6; e++) {
      const [ax, az] = hexVertex(c.x, c.z, r - 0.02, e),
        [bx, bz] = hexVertex(c.x, c.z, r - 0.02, e + 1);
      for (let s2 = 0; s2 < nStr; s2++) {
        const t = (s2 + 0.5) / nStr;
        stringLights.push([ax + (bx - ax) * t, TOP + 0.3 - Math.sin(t * Math.PI * (nStr / 2)) * 0.025, az + (bz - az) * t]);
      }
    }
  }
  return { islets: isletInfo, lighthouses, stringLights, ambientSpots, ledgeInfo, lampSpots, routeEnds, routes, coastStats: coastStats.map((c) => ({ types: [...c.types], items: c.items })) };
}

function canalFeature(kit, kind, x, z, yaw, rnd) {
  const W = WATER_Y;
  switch (kind) {
    case "lily":
      for (let k = 0; k < 3; k++) kit.cyl(x + (rnd() - 0.5) * 0.18, W + 0.008, z + (rnd() - 0.5) * 0.18, 0.08, 0.008, 0x7f9a6a);
      kit.sphere(x, W + 0.025, z, 0.03, 0xf2b5c6);
      break;
    case "stones":
      for (let k = 0; k < 3; k++) kit.cyl(x + Math.sin(yaw) * (k - 1) * 0.1, W + 0.03, z + Math.cos(yaw) * (k - 1) * 0.1, 0.08, 0.05, 0xb7a993);
      break;
    case "barge":
      kit.box(x, W + 0.03, z, 0.14, 0.05, 0.24, 0xe6d8c2, null, [0, yaw, 0]);
      kit.sphere(x, W + 0.09, z, [0.1, 0.07, 0.18], 0xf2b5c6);
      break;
    case "duck":
      kit.sphere(x, W + 0.03, z, [0.07, 0.045, 0.1], 0xfff8f0);
      kit.sphere(x, W + 0.075, z + 0.04, 0.035, 0xfff8f0);
      kit.hbox(x, W + 0.075, z + 0.075, 0.02, 0.012, 0.03, 0xf2a33a);
      break;
    case "raft":
      kit.box(x, W + 0.02, z, 0.18, 0.03, 0.14, 0xb48560, null, [0, yaw, 0]);
      kit.ico(x, W + 0.06, z, [0.07, 0.05, 0.07], 0x8fb37a);
      break;
    case "kayak":
      kit.sphere(x, W + 0.02, z, [0.05, 0.03, 0.22], 0xdb6a41);
      kit.hbox(x, W + 0.05, z, 0.16, 0.006, 0.012, 0x3b3a42, null, [0, yaw + 0.6, 0]);
      break;
    case "paperboat":
      kit.part("prism", [x, W + 0.03, z], [0.08, 0.05, 0.1], 0xffffff, null, [0, yaw, Math.PI]);
      kit.part("tetra", [x, W + 0.06, z], [0.05, 0.05, 0.05], 0xfffdf6, null, [0, yaw, 0]);
      break;
    case "lantern":
      kit.cyl(x, W + 0.012, z, 0.08, 0.012, 0xb48560);
      kit.glow(x, W + 0.05, z, 0.05, 0.06, 0.05, 0xffb36b);
      break;
    case "buoy":
      kit.cyl(x, W + 0.04, z, 0.06, 0.08, 0xdb6a41);
      kit.cyl(x, W + 0.08, z, 0.06, 0.015, 0xffffff);
      break;
    case "ferry":
      kit.box(x, W + 0.03, z, 0.1, 0.05, 0.22, 0xf2efe8, null, [0, yaw, 0]);
      kit.box(x, W + 0.075, z, 0.07, 0.04, 0.1, 0x3e7c8c, null, [0, yaw, 0]);
      break;
    case "boom":
      for (let k = 0; k < 4; k++) kit.cyl(x + Math.sin(yaw) * (k - 1.5) * 0.06, W + 0.015, z + Math.cos(yaw) * (k - 1.5) * 0.06, 0.04, 0.03, k % 2 ? 0xf2a33a : 0xffffff);
      break;
  }
}
// A10: shared geometry for the diplomacy sea routes (pier head → partner-islet quay)
const ISLET_SIDES = [-2.4, 2.6],
  PIER_SIDES = [0.05, 0.35];
export function seaCurve(P, k) {
  const start = P(PIER_SIDES[k], 0.8);
  const isl = P(ISLET_SIDES[k] + Math.sin(5 * 0.35) * 0.15, 1.3 + 5 * 0.42);
  const dx = start[0] - isl[0],
    dz = start[1] - isl[1],
    dl = Math.hypot(dx, dz);
  const end = [isl[0] + (dx / dl) * 1.25, isl[1] + (dz / dl) * 1.25];
  const out = P(PIER_SIDES[k] + (ISLET_SIDES[k] - PIER_SIDES[k]) * 0.35, 2.2);
  return { start, ctrl: out, end, islet: isl };
}
export function bez(c, t) {
  const u = 1 - t;
  return [u * u * c.start[0] + 2 * u * t * c.ctrl[0] + t * t * c.end[0], u * u * c.start[1] + 2 * u * t * c.ctrl[1] + t * t * c.end[1]];
}
function boat(kit, x, z, yaw, W, rnd, sail = true) {
  const col = [0xffffff, 0xdb6a41, 0x3e7c8c][Math.floor(rnd() * 3)];
  kit.box(x, W + 0.05, z, 0.16, 0.08, 0.42, col, null, [0, yaw, 0]);
  kit.hbox(x, W + 0.095, z, 0.12, 0.012, 0.34, 0xb48560, null, [0, yaw, 0]);
  if (sail) {
    kit.cyl(x, W + 0.32, z, 0.012, 0.48, 0x5a4a3e);
    kit.part("prism", [x + Math.sin(yaw) * 0.04, W + 0.32, z + Math.cos(yaw) * 0.04], [0.26, 0.42, 0.01], 0xfff8f0, null, [0, yaw + Math.PI / 2, 0]);
  }
}
// 五星級海上渡假村別墅與遊艇碼頭小島（純景觀微縮：白金星級水上行館、無邊際泳池與私人遊艇）
function currentShip(kit, x, z, W, s) {
  const { box, hbox, cyl, sphere, part } = kit;
  const G = W + 0.52;
  cyl(x, G - 0.03, z + 0.08, s * 1.58, 0.06, 0xf3ead8);
  // 前方無邊際海景泳池與遮陽傘躺椅
  hbox(x, G + 0.018, z + 0.36, 1.32, 0.025, 0.42, 0x6ec3d0);
  hbox(x, G + 0.032, z + 0.36, 1.22, 0.006, 0.34, 0xb8f2fa);
  for (const sx of [-0.42, 0.42]) {
    hbox(x + sx, G + 0.05, z + 0.36, 0.12, 0.025, 0.22, 0xffffff);
    cyl(x + sx, G + 0.16, z + 0.26, 0.015, 0.24, 0xb48560);
    part("cone6", [x + sx, G + 0.29, z + 0.26], [0.28, 0.08, 0.28], 0xd8a848);
  }
  // 中央五星級海濱渡假行館主樓 + 金色孟莎屋頂 + 五顆金星冠冕
  box(x, G + 0.36, z - 0.14, 1.18, 0.64, 0.46, 0xf7f2e7);
  part("hip", [x, G + 0.74, z - 0.14], [1.28, 0.16, 0.54], 0x37474f);
  hbox(x, G + 0.69, z - 0.14, 1.24, 0.035, 0.5, 0xd8a848);
  for (let k = -2; k <= 2; k++) {
    kit.bulb(x + k * 0.12, G + 0.85, z + 0.06, 0.038, 0xd8a848);
  }
  for (let r = 0; r < 3; r++) {
    for (let c = -2; c <= 2; c++) {
      hbox(x + c * 0.2, G + 0.16 + r * 0.18, z + 0.095, 0.12, 0.11, 0.008, 0xffe49e);
    }
  }
  // 迎賓紅毯與金頂門廊
  hbox(x, G + 0.14, z + 0.16, 0.34, 0.03, 0.16, 0xd8a848);
  hbox(x, G + 0.01, z + 0.18, 0.24, 0.008, 0.18, 0xb83a3a);
  // 兩側熱帶棕櫚樹與停泊豪華遊艇
  for (const sx of [-0.72, 0.72]) {
    cyl(x + sx, G + 0.22, z - 0.05, 0.035, 0.44, 0x8a6a4e);
    sphere(x + sx, G + 0.46, z - 0.05, [0.24, 0.12, 0.24], 0x7aa56b);
  }
  sphere(x + 0.88, W + 0.06, z + 0.45, [0.36, 0.08, 0.14], 0xffffff);
  hbox(x + 0.88, W + 0.12, z + 0.45, 0.16, 0.06, 0.09, 0xd8a848);
}
function reeds(kit, x, z, W, rnd) {
  for (let k = 0; k < 6; k++) kit.cyl(x + (rnd() - 0.5) * 0.3, W + 0.12, z + (rnd() - 0.5) * 0.3, 0.012, 0.22 + rnd() * 0.12, 0x9cae6e);
  kit.ico(x, W + 0.02, z, [0.28, 0.03, 0.24], 0x93ab76);
}
function egret(kit, x, z, W) {
  kit.sphere(x, W + 0.12, z, [0.06, 0.05, 0.1], 0xffffff);
  kit.cyl(x, W + 0.05, z, 0.008, 0.1, 0x2a2524);
  kit.sphere(x, W + 0.2, z + 0.05, 0.03, 0xffffff);
  kit.hbox(x, W + 0.2, z + 0.085, 0.008, 0.008, 0.04, 0xe8c547);
}
function lily(kit, x, z, W, rnd) {
  for (let k = 0; k < 4; k++) kit.cyl(x + (rnd() - 0.5) * 0.4, W + 0.01, z + (rnd() - 0.5) * 0.4, 0.09, 0.01, 0x7f9a6a);
  kit.sphere(x, W + 0.03, z, 0.035, 0xf2b5c6);
}
function buoy(kit, x, z, W) {
  kit.cyl(x, W + 0.05, z, 0.07, 0.1, 0xdb6a41);
  kit.cyl(x, W + 0.1, z, 0.07, 0.02, 0xffffff);
}

// Themed surroundings: fn() decorates each waterfront ledge; top() adds island-unique band pieces.
// Every item is scenic and must not be read as a policy facility.
const THEMES = {
  // 校園專業教室景觀 (2026-10-29): a reed bank, a wooden fishing platform and an egret on the waterfront
  water: {
    ledge: 0xb9c9a8,
    fn({ P, y, kit, helpers: h, L, li, rnd }) {
      kit.decor("water", "v:reedBank", () => {
        for (const u of [-0.6, 0.62]) {
          const [x, z] = P(u, 0.06);
          for (let k = 0; k < 7; k++) kit.cyl(x + (rnd() - 0.5) * 0.2, y + 0.1, z + (rnd() - 0.5) * 0.12, 0.01, 0.18 + rnd() * 0.1, 0x9cae6e);
          for (let k = 0; k < 3; k++) kit.sphere(x + (rnd() - 0.5) * 0.16, y + 0.24 + rnd() * 0.04, z + (rnd() - 0.5) * 0.1, [0.012, 0.035, 0.012], 0x8a6a4e);
        }
      });
      if (li % 2 === 0)
        kit.decor("water", "v:fishingDeck", () => {
          const [x, z] = P(0.05, -0.04);
          kit.hbox(x, y + 0.03, z, 0.42, 0.02, 0.16, 0xb48560, null, [0, L.yaw, 0]);
          for (let k = 0; k < 3; k++) {
            const [px, pz] = P(-0.18 + k * 0.18, -0.1);
            kit.cyl(px, y + 0.06, pz, 0.012, 0.12, 0x8a6a4e);
          }
          const [rx, rz] = P(-0.1, -0.02);
          kit.part("cylinder", [rx, y + 0.16, rz], [0.006, 0.3, 0.006], 0x3b3a42, null, [0.9, L.yaw, 0]);
        });
      else
        kit.decor("water", "v:egretPost", () => {
          const [x, z] = P(0.1, 0.02);
          kit.cyl(x, y + 0.08, z, 0.02, 0.16, 0x8a6a4e);
          kit.sphere(x, y + 0.24, z, [0.05, 0.045, 0.085], 0xffffff);
          kit.sphere(x, y + 0.31, z + 0.04, 0.026, 0xffffff);
          kit.hbox(x, y + 0.31, z + 0.075, 0.007, 0.007, 0.04, 0xe8c547);
        });
      kit.decor("water", "v:bench", () => h.bench(...P(0.38, -0.12), L.yaw, y));
    },
  },
  // 智慧旅宿景觀 (2026-10-29): glass-roofed bike shelters, cube planters and a laptop bench along the waterfront
  ai: {
    ledge: 0xdfe4e1,
    fn({ P, y, kit, helpers: h, L, li }) {
      kit.decor("ai", "v:cubePlanters", () => {
        for (const u of [-0.58, 0.58]) {
          const [x, z] = P(u, 0.05);
          kit.box(x, y + 0.06, z, 0.14, 0.12, 0.14, 0xeef3f2);
          kit.box(x, y + 0.17, z, 0.12, 0.1, 0.12, 0x7f9a6a);
        }
      });
      if (li % 2 === 0)
        kit.decor("ai", "v:glassShelter", () => {
          const [x, z] = P(-0.1, -0.06);
          for (const d of [-0.16, 0.16]) kit.cyl(x + L.tx * d, y + 0.12, z + L.tz * d, 0.01, 0.24, 0x2f5a6a);
          kit.hbox(x, y + 0.25, z, 0.4, 0.012, 0.14, 0xbfe0e2, null, [0, L.yaw, 0]);
          h.bikeRack(x, z, L.yaw, y);
        });
      else
        kit.decor("ai", "v:laptopBench", () => {
          const [x, z] = P(0.0, -0.08);
          h.bench(x, z, L.yaw, y);
          kit.hbox(x, y + 0.095, z, 0.06, 0.006, 0.045, 0x3b3a42, null, [0, L.yaw, 0]);
        });
      kit.decor("ai", "v:glassLamp", () => {
        const [x, z] = P(0.34, -0.12);
        kit.cyl(x, y + 0.16, z, 0.012, 0.32, 0x2f5a6a);
        kit.box(x, y + 0.33, z, 0.05, 0.05, 0.05, 0xd5ecee);
        kit.bulb(x, y + 0.33, z, 0.025);
      });
    },
  },
  // 外語跨文化景觀 (2026-10-20): tung-blossom trees and an indigo cloth line along the waterfront; elders and kids on the ledge
  hakka: {
    ledge: 0xd9b08c,
    fn({ P, y, kit, helpers: h, L, li, ambientSpots }) {
      kit.decor("hakka", "v:tungTrees", () => {
        for (const u of [-0.55, 0.55]) {
          const [x, z] = P(u, 0.02);
          kit.cyl(x, y + 0.12, z, 0.03, 0.24, 0x7a5c42);
          kit.ico(x, y + 0.3, z, [0.24, 0.16, 0.24], 0x8fae7a);
          for (let k = 0; k < 6; k++) kit.sphere(x + Math.cos(k) * 0.09, y + 0.37 + (k % 2) * 0.03, z + Math.sin(k) * 0.09, 0.035, 0xfbf6ee);
        }
      });
      if (li % 2 === 0)
        kit.decor("hakka", "v:clothLine", () => {
          const [x, z] = P(0, -0.05);
          for (const d of [-0.22, 0.22]) kit.cyl(x + L.tx * d, y + 0.13, z + L.tz * d, 0.012, 0.26, 0x7a5c42);
          kit.hbox(x, y + 0.255, z, 0.46, 0.006, 0.006, 0x211d1d, null, [0, L.yaw, 0]);
          for (let k = 0; k < 3; k++) {
            const [cx, cz] = P(-0.13 + k * 0.13, -0.05);
            kit.hbox(cx, y + 0.2, cz, 0.1, 0.1, 0.008, [0x3f5a8a, 0xd76b8a, 0x3f5a8a][k], null, [0, L.yaw, 0]);
          }
        });
      else {
        const [x, z] = P(0.1, 0.05);
        h.bench(x, z, L.yaw, y);
        kit.decor("hakka", "v:bambooBaskets", () => {
          for (let k = 0; k < 3; k++) {
            const [bx, bz] = P(-0.28 + k * 0.1, -0.08);
            kit.cyl(bx, y + 0.035, bz, 0.08, 0.07, [0xc9b27a, 0xb89f68, 0xc9b27a][k]);
            kit.ico(bx, y + 0.08, bz, [0.06, 0.03, 0.06], [0x8fae7a, 0xe8c547, 0xd76b8a][k]);
          }
        });
      }
      kit.decor("hakka", "v:lanternPost", () => {
        const [x, z] = P(0.32, -0.12);
        kit.cyl(x, y + 0.16, z, 0.014, 0.32, 0x7a5c42);
        kit.hbox(x, y + 0.31, z, 0.12, 0.012, 0.012, 0x7a5c42, null, [0, L.yaw, 0]);
        kit.sphere(x, y + 0.26, z, [0.07, 0.09, 0.07], 0xd76b4a);
        kit.bulb(x, y + 0.26, z, 0.03);
      });
    },
  },
  civil: {
    ledge: 0xd9cbb4,
    fn({ P, L, y, kit, helpers: h, rnd }) {
      for (let u = -0.6; u <= 0.61; u += 0.3) kit.decor("civil", "v:streetTree", () => h.tree(...P(u, 0.1), 0.24, y));
      kit.decor("civil", "v:coffeeCart", () => {
        const [x, z] = P(0.15, -0.08);
        kit.box(x, y + 0.09, z, 0.2, 0.14, 0.12, 0xdb6a41);
        kit.hbox(x, y + 0.2, z, 0.24, 0.02, 0.16, 0xfff1de);
        for (const d of [-0.07, 0.07]) kit.part("torus", [x + d, y + 0.03, z + 0.06], [0.05, 0.05, 0.05], 0x211d1d);
      });
      kit.decor("civil", "v:bikeRack", () => h.bikeRack(...P(-0.35, -0.12), L.yaw, y));
      kit.decor("civil", "v:bench", () => h.bench(...P(0.5, -0.12), L.yaw, y));
    },
    top({ c, kit, helpers: h, ambientSpots }) {
      ambientSpots.push({ role: "officeworker", island: "civil", pos: [c.x - 0.15, 0, c.z + 0.28], yaw: 0.4 });
      ambientSpots.push({ role: "officeworker", island: "civil", pos: [c.x + 0.2, 0, c.z + 0.3], yaw: -0.6 });
    },
  },
  institute: {
    ledge: 0xcfd8d3,
    fn({ P, y, kit, helpers: h, rnd }) {
      kit.decor("institute", "v:greenhouse", () => {
        const [x, z] = P(-0.45, 0);
        kit.box(x, y + 0.12, z, 0.34, 0.24, 0.22, 0xd5ecee);
        kit.part("prism", [x, y + 0.29, z], [0.24, 0.34, 0.24], 0xbfe0e2, null, [0, 0, Math.PI / 2]);
        for (let k = 0; k < 3; k++) kit.ico(x - 0.1 + k * 0.1, y + 0.05, z, [0.07, 0.06, 0.07], 0x7f9a6a);
      });
      kit.decor("institute", "v:readingTable", () => {
        const [x, z] = P(0.25, -0.05);
        kit.cyl(x, y + 0.1, z, 0.22, 0.02, 0xb48560);
        kit.cyl(x, y + 0.05, z, 0.03, 0.1, 0x211d1d);
        kit.hbox(x + 0.03, y + 0.115, z, 0.08, 0.01, 0.06, 0xffffff);
      });
      kit.decor("institute", "v:sensorPole", () => {
        const [x, z] = P(0.6, 0.1);
        kit.cyl(x, y + 0.25, z, 0.018, 0.5, 0x211d1d);
        kit.box(x, y + 0.48, z, 0.08, 0.06, 0.08, 0x3e7c8c);
        kit.bulb(x, y + 0.53, z, 0.03, 0x9fffd0);
      });
      for (const u of [-0.7, 0.0]) kit.decor("institute", "v:bush", () => h.bush(...P(u, 0.18), 0.08, y));
    },
  },
  renewal: {
    ledge: 0xc7b08f,
    fn({ P, y, kit, helpers: h, rnd, ambientSpots, L, li }) {
      kit.decor("renewal", "v:communityGarden", () => {
        for (let k = 0; k < 4; k++) {
          const [x, z] = P(-0.6 + k * 0.4, -0.12);
          kit.box(x, y + 0.04, z, 0.3, 0.07, 0.16, 0xb48560);
          kit.ico(x, y + 0.1, z, [0.26, 0.07, 0.13], [0x8fb37a, 0xa9c47f, 0xf2b5c6, 0x9cc27a][k]);
        }
      });
      kit.decor("renewal", "v:shadeCanopy", () => {
        const [x, z] = P(0.35, 0.12);
        for (const d of [-0.2, 0.2]) kit.cyl(x + L.tx * d, y + 0.15, z + L.tz * d, 0.015, 0.3, 0x211d1d);
        kit.box(x, y + 0.31, z, 0.5, 0.03, 0.24, 0xf2a33a, null, [0, L.yaw, 0]);
        kit.hbox(x, y + 0.07, z, 0.4, 0.03, 0.08, 0xb48560, null, [0, L.yaw, 0]);
      });
      if (li === 0)
        for (const [u, v] of [
          [0.25, 0.1],
          [0.45, 0.14],
          [-0.3, 0.12],
        ]) {
          const [x, z] = P(u, v);
          ambientSpots.push({ role: "officeworker", island: "renewal", pos: [x, y + 0.02, z], yaw: L.yaw + Math.PI });
        }
      for (let k = 0; k < 4; k++) kit.decor("renewal", "v:cone", () => {
        const [x, z] = P(-0.6 + k * 0.4, 0.15);
        kit.part("cone", [x, y + 0.06, z], [0.07, 0.12, 0.07], 0xf2a33a);
        kit.cyl(x, y + 0.07, z, 0.045, 0.015, 0xffffff);
      });
      kit.decor("renewal", "v:boxes", () => {
        for (let k = 0; k < 4; k++) {
          const [x, z] = P(0.3 + (k % 2) * 0.14, -0.08 + Math.floor(k / 2) * 0.12);
          kit.box(x, y + 0.05 + Math.floor(k / 2) * 0.0, z, 0.12, 0.1, 0.1, 0xc9a27a);
        }
      });
      kit.decor("renewal", "v:coveredWalk", () => {
        const [x, z] = P(-0.25, -0.12);
        for (const d of [-0.2, 0.2]) kit.cyl(x + d, y + 0.12, z, 0.015, 0.24, 0x211d1d);
        kit.hbox(x, y + 0.25, z, 0.5, 0.02, 0.16, 0xf2a33a);
      });
    },
  },
  transport: {
    ledge: 0x9c9690,
    fn({ P, y, kit, helpers: h, L }) {
      kit.decor("transport", "v:bikeLane", () => {
        const [x, z] = P(0, 0.05);
        kit.hbox(x, y + 0.012, z, 1.6, 0.012, 0.2, 0x7aa58f, null, [0, L.yaw, 0]);
        for (let k = 0; k < 6; k++) {
          const [x2, z2] = P(-0.7 + k * 0.28, 0.05);
          kit.hbox(x2, y + 0.02, z2, 0.1, 0.004, 0.012, 0xffffff, null, [0, L.yaw, 0]);
        }
      });
      kit.decor("transport", "v:youbike", () => {
        for (let k = 0; k < 3; k++) {
          const [x, z] = P(0.45 + k * 0.1, -0.15);
          for (const d of [-0.04, 0.04]) kit.part("torus", [x, y + 0.05, z + d], [0.08, 0.08, 0.08], 0x211d1d, null, [0, L.yaw + Math.PI / 2, 0]);
          kit.hbox(x, y + 0.07, z, 0.01, 0.01, 0.1, 0xe8c547, null, [0, L.yaw, 0]);
        }
      });
      kit.decor("transport", "v:busSign", () => {
        const [x, z] = P(-0.6, -0.15);
        kit.cyl(x, y + 0.2, z, 0.015, 0.4, 0x211d1d);
        kit.box(x, y + 0.38, z, 0.12, 0.1, 0.02, 0xdb6a41, null, [0, L.yaw, 0]);
      });
      kit.decor("transport", "v:leveeSteps", () => {
        for (let s = 0; s < 3; s++) {
          const [x, z] = P(-0.2, 0.22 + s * 0.05);
          kit.hbox(x, y - s * 0.06, z, 0.5, 0.05, 0.06, 0xd2c3ad, null, [0, L.yaw, 0]);
        }
      });
    },
  },
  education: {
    ledge: 0xd9cbb4,
    fn({ P, y, kit, helpers: h, L }) {
      kit.decor("education", "v:track", () => {
        const [x, z] = P(0, 0.02);
        kit.hbox(x, y + 0.01, z, 1.5, 0.012, 0.36, 0xc8775a, null, [0, L.yaw, 0]);
        for (const v of [-0.08, 0.08]) {
          const [x2, z2] = P(0, 0.02 + v);
          kit.hbox(x2, y + 0.018, z2, 1.5, 0.004, 0.008, 0xffffff, null, [0, L.yaw, 0]);
        }
      });
      kit.decor("education", "v:schoolWall", () => {
        for (let k = 0; k < 6; k++) {
          const [x, z] = P(-0.7 + k * 0.28, -0.25);
          kit.box(x, y + 0.07, z, 0.25, 0.14, 0.04, k % 2 ? 0xe8c547 : 0xf2efe8, null, [0, L.yaw, 0]);
        }
      });
      for (const u of [-0.5, 0.5]) kit.decor("education", "v:flowerBed", () => h.flowers(...P(u, 0.24), y));
    },
  },
  lunch: {
    ledge: 0x9c7a5a,
    fn({ P, y, kit, L, rnd }) {
      for (let r = 0; r < 3; r++)
        kit.decor("lunch", "v:vegRows", () => {
          const [x, z] = P(-0.25, -0.15 + r * 0.15);
          kit.hbox(x, y + 0.02, z, 0.9, 0.04, 0.08, 0x7a5a42, null, [0, L.yaw, 0]);
          for (let k = 0; k < 6; k++) {
            const [x2, z2] = P(-0.65 + k * 0.16, -0.15 + r * 0.15);
            kit.ico(x2, y + 0.07, z2, [0.07, 0.06, 0.07], [0x8fb37a, 0x7f9a6a, 0xa9c47f][r]);
          }
        });
      kit.decor("lunch", "v:rainBarrel", () => {
        const [x, z] = P(0.45, 0.1);
        kit.cyl(x, y + 0.08, z, 0.1, 0.16, 0x3e7c8c);
      });
      kit.decor("lunch", "v:bambooFence", () => {
        for (let k = 0; k < 7; k++) {
          const [x, z] = P(0.35 + k * 0.05, -0.2);
          kit.cyl(x, y + 0.09, z, 0.014, 0.18, 0xc9b27a);
        }
      });
    },
  },
  family: {
    ledge: 0xdcc7a8,
    fn({ P, y, kit, L }) {
      kit.decor("family", "v:slide", () => {
        const [x, z] = P(-0.4, 0);
        kit.cyl(x, y + 0.03, z, 0.24, 0.05, 0xe6dccb);
        kit.cyl(x, y + 0.06, z, 0.2, 0.015, 0x7fd0d8);
        kit.sphere(x, y + 0.12, z, 0.045, 0xd5ecee);
      });
      kit.decor("family", "v:swing", () => {
        const [x, z] = P(0.15, 0);
        kit.cyl(x, y + 0.16, z, 0.018, 0.32, 0xb48560);
        kit.part("cone6", [x, y + 0.34, z], [0.34, 0.1, 0.34], 0xf3ead8);
        kit.cyl(x, y + 0.09, z, 0.18, 0.02, 0xffffff);
      });
      kit.decor("family", "v:sandbox", () => {
        const [x, z] = P(0.55, 0.05);
        kit.hbox(x, y + 0.03, z, 0.24, 0.02, 0.14, 0xd8a848, null, [0, L.yaw, 0]);
        kit.part("torus", [x, y + 0.14, z], [0.14, 0.18, 0.08], 0xd8a848, null, [0, L.yaw, 0]);
      });
      kit.decor("family", "v:laundry", () => {
        const [x, z] = P(-0.7, 0.15);
        kit.hbox(x, y + 0.01, z, 0.32, 0.01, 0.16, 0xb83a3a, null, [0, L.yaw, 0]);
        for (const d of [-0.12, 0.12]) kit.cyl(x + L.tx * d, y + 0.08, z + L.tz * d, 0.014, 0.16, 0xd8a848);
      });
    },
  },
  card: {
    ledge: 0xdcb79a,
    fn({ P, y, kit, L }) {
      kit.decor("card", "v:bookCart", () => {
        const [x, z] = P(-0.4, 0);
        kit.box(x, y + 0.08, z, 0.26, 0.08, 0.12, 0xb48560, null, [0, L.yaw, 0]);
        for (let k = 0; k < 5; k++) kit.hbox(x + L.tx * (-0.09 + k * 0.045), y + 0.16, z + L.tz * (-0.09 + k * 0.045), 0.03, 0.09, 0.08, [0xdb6a41, 0xe8c547, 0x58a6a6, 0x6f7fb5, 0xf2a1a1][k], null, [0, L.yaw, 0]);
      });
      kit.decor("card", "v:posterColumn", () => {
        const [x, z] = P(0.1, -0.1);
        kit.cyl(x, y + 0.22, z, 0.1, 0.44, 0xf2efe8);
        kit.cyl(x, y + 0.3, z, 0.105, 0.16, 0xdb6a41);
        kit.part("cone", [x, y + 0.48, z], [0.14, 0.08, 0.14], 0x211d1d);
      });
      kit.decor("card", "v:pool", () => {
        const [x, z] = P(0.55, 0.05);
        kit.box(x, y + 0.03, z, 0.4, 0.06, 0.26, 0xf2efe8, null, [0, L.yaw, 0]);
        kit.hbox(x, y + 0.062, z, 0.34, 0.006, 0.2, 0x7fc8d6, null, [0, L.yaw, 0]);
      });
    },
  },
  welfare: {
    ledge: 0xc9d1b4,
    fn({ P, y, kit, helpers: h, L }) {
      kit.decor("welfare", "v:communityGarden", () => {
        for (let k = 0; k < 3; k++) {
          const [x, z] = P(-0.55 + k * 0.22, 0);
          kit.box(x, y + 0.05, z, 0.18, 0.1, 0.18, 0xb48560);
          kit.ico(x, y + 0.12, z, [0.15, 0.08, 0.15], [0x8fb37a, 0xd9c6f0, 0xfcea8b][k]);
        }
      });
      kit.decor("welfare", "v:handrailPath", () => {
        const [x, z] = P(0.3, 0.15);
        kit.hbox(x, y + 0.012, z, 0.7, 0.01, 0.12, 0xd9cbb4, null, [0, L.yaw, 0]);
        kit.hbox(x, y + 0.12, z + 0, 0.7, 0.012, 0.012, 0x3e7c8c, null, [0, L.yaw, 0]);
        for (let k = 0; k < 4; k++) {
          const [x2, z2] = P(0.0 + k * 0.2, 0.15);
          kit.cyl(x2, y + 0.06, z2, 0.012, 0.12, 0x3e7c8c);
        }
      });
      kit.decor("welfare", "v:shelter", () => {
        const [x, z] = P(0.55, -0.15);
        for (const d of [-0.12, 0.12]) kit.cyl(x + L.tx * d, y + 0.13, z + L.tz * d, 0.015, 0.26, 0x211d1d);
        kit.box(x, y + 0.27, z, 0.34, 0.03, 0.14, 0x7aa58f, null, [0, L.yaw, 0]);
        h.bench(x, z, L.yaw, y);
      });
    },
  },
  sport: {
    ledge: 0xe6dccb,
    top({ c, kit, ambientSpots }) {
      // On-island hospitality staff & international interns along the 4 grand plazas
      ambientSpots.push({ role: "officeworker", island: "sport", pos: [c.x - 1.15, 0, c.z + 3.05], yaw: 0.25, wander: 0.08 });
      ambientSpots.push({ role: "worker", island: "sport", pos: [c.x + 1.15, 0, c.z + 3.05], yaw: -0.25, wander: 0.08 });
      ambientSpots.push({ role: "hiker", island: "sport", pos: [c.x, 0, c.z - 3.05], yaw: 0, pose: "wave" });
      ambientSpots.push({ role: "traveller", island: "sport", pos: [c.x - 3.45, 0, c.z], yaw: 1.5, wander: 0.08 });
      ambientSpots.push({ role: "traveller", island: "sport", pos: [c.x + 3.45, 0, c.z], yaw: -1.5, wander: 0.08 });
      // 1. SOUTH GRAND ARRIVAL PLAZA: Five-Star Welcome Arch, Red Carpet, Twin Golden Fountains & VIP Limousines
      kit.decor("sport", "v:hotelArch", () => {
        const ax = c.x, az = c.z + 3.25, ay = 0.65;
        kit.hbox(ax, ay + 0.008, az - 0.12, 0.68, 0.01, 0.42, 0xb83232);
        for (const dx of [-0.32, 0.32]) {
          kit.cyl(ax + dx, ay + 0.22, az, 0.04, 0.44, 0xf7f2e7);
          kit.hbox(ax + dx, ay + 0.025, az, 0.11, 0.05, 0.11, 0xd8a848);
        }
        kit.box(ax, ay + 0.46, az, 0.78, 0.075, 0.11, 0x235e73);
        kit.hbox(ax, ay + 0.51, az, 0.84, 0.03, 0.13, 0xd8a848);
        for (let s = -2; s <= 2; s++) kit.bulb(ax + s * 0.11, ay + 0.56, az, 0.026, 0xffe49e);
        // Twin arrival fountains flanking the South Welcome Arch
        for (const fx of [c.x - 1.38, c.x + 1.38]) {
          kit.cyl(fx, ay + 0.03, az - 0.06, 0.32, 0.05, 0xf4ebdd);
          kit.cyl(fx, ay + 0.055, az - 0.06, 0.27, 0.012, 0x6ec3d0);
          kit.cyl(fx, ay + 0.12, az - 0.06, 0.045, 0.14, 0xd8a848);
          kit.bulb(fx, ay + 0.21, az - 0.06, 0.03, 0xffe49e);
        }
      });
      // 2. NORTH OVERSEAS INTERNSHIP PAVILION: Global Direction Compass, Japan Torii & Sakura Garden, Maldives Cabana Deck & VIP Limo
      kit.decor("sport", "v:overseasCompass", () => {
        const gx = c.x, gz = c.z - 3.24, gy = 0.65;
        kit.cyl(gx, gy + 0.03, gz, 0.24, 0.05, 0xf4ebdd);
        kit.cyl(gx, gy + 0.18, gz, 0.024, 0.3, 0xd8a848);
        kit.sphere(gx, gy + 0.36, gz, 0.095, 0x3e7c8c);
        kit.part("torus", [gx, gy + 0.36, gz], [0.13, 0.13, 0.13], 0xd8a848, null, [0.45, 0.3, 0]);
        for (let k = 0; k < 4; k++) {
          kit.hbox(gx + (k % 2 ? 0.09 : -0.09), gy + 0.14 + k * 0.045, gz, 0.18, 0.024, 0.035, [0xdb6a41, 0x235e73, 0x2e6f56, 0xd8a848][k], null, [0, k * 0.55, 0]);
        }
        // Japan Vermilion Torii & Sakura Garden on North-West Plaza
        const tx = c.x - 1.42, tz = c.z - 3.16;
        kit.cyl(tx, gy + 0.02, tz, 0.32, 0.03, 0xd9c59a);
        for (const d of [-0.09, 0.09]) kit.cyl(tx + d, gy + 0.16, tz, 0.02, 0.28, 0xd93b2b);
        kit.hbox(tx, gy + 0.31, tz, 0.28, 0.03, 0.04, 0xd93b2b);
        kit.hbox(tx, gy + 0.24, tz, 0.22, 0.02, 0.03, 0xd93b2b);
        kit.cyl(tx - 0.18, gy + 0.12, tz + 0.06, 0.02, 0.18, 0x6b4c35);
        kit.sphere(tx - 0.18, gy + 0.24, tz + 0.06, [0.14, 0.11, 0.14], 0xf7b2c4);
      });
      kit.decor("sport", "v:vipLimo", () => {
        for (const [lx, lz] of [[c.x + 1.38, c.z - 3.16], [c.x + 2.25, c.z + 3.12]]) {
          const ly = 0.65;
          kit.box(lx, ly + 0.05, lz, 0.38, 0.065, 0.15, 0x1f2630);
          kit.box(lx, ly + 0.105, lz, 0.22, 0.055, 0.13, 0x3a4a5e);
          kit.hbox(lx, ly + 0.085, lz, 0.39, 0.014, 0.155, 0xd8a848);
        }
      });
      // 3. WEST & EAST PROMENADE RESORT LOUNGES: Infinity Pool Cabana Deck (West) & Helipad / Champagne Pavilion (East)
      kit.decor("sport", "v:sideResortPlazas", () => {
        const wy = 0.65, wx = c.x - 3.56, wz = c.z;
        kit.hbox(wx, wy + 0.025, wz, 0.34, 0.03, 0.92, 0x5ec8d8);
        kit.hbox(wx, wy + 0.012, wz, 0.4, 0.015, 0.98, 0xf7f2e7);
        for (const dz of [-0.62, 0.62]) {
          kit.cyl(wx, wy + 0.15, wz + dz, 0.018, 0.28, 0xb48560);
          kit.part("cone6", [wx, wy + 0.3, wz + dz], [0.28, 0.09, 0.28], 0xd8a848);
        }
        const ex = c.x + 3.56, ez = c.z;
        kit.cyl(ex, wy + 0.02, ez, 0.34, 0.03, 0x2c3e50);
        kit.part("torus", [ex, wy + 0.038, ez], [0.26, 0.26, 0.26], 0xd8a848, null, [Math.PI / 2, 0, 0]);
        for (const dz of [-0.62, 0.62]) {
          kit.cyl(ex, wy + 0.06, ez + dz, 0.16, 0.09, 0xf4ebdd);
          kit.sphere(ex, wy + 0.18, ez + dz, [0.13, 0.16, 0.13], 0x6f9a6a);
        }
      });
    },
    fn({ P, y, kit, L, W, li, nearOther }) {
      // Four waterfront infinity pools across the full 3.88-unit terrace width
      kit.decor("sport", "v:infinityPool", () => {
        for (const u of [-1.56, -0.68, 0.68, 1.56]) {
          const [x, z] = P(u, 0.06);
          kit.hbox(x, y + 0.022, z, 0.48, 0.026, 0.22, 0x5ec8d8, null, [0, L.yaw, 0]);
          kit.hbox(x, y + 0.012, z, 0.52, 0.014, 0.26, 0xf7f2e7, null, [0, L.yaw, 0]);
        }
      });
      // Eight resort beach cabanas & parasols spanning the full terrace
      kit.decor("sport", "v:cabanas", () => {
        const uList = [-1.72, -1.12, -0.78, -0.32, 0.32, 0.78, 1.12, 1.72];
        for (let s = 0; s < uList.length; s++) {
          const [x, z] = P(uList[s], -0.14);
          kit.cyl(x, y + 0.14, z, 0.015, 0.28, 0xb48560);
          kit.part("cone6", [x, y + 0.29, z], [0.24, 0.08, 0.24], [0xd8a848, 0xf7f2e7, 0xdb6a41, 0x3e7c8c][s % 4]);
        }
      });
      // Twin Five-Star Monument Pillars at both ends of each terrace
      kit.decor("sport", "v:starMonument", () => {
        for (const u of [-1.82, 1.82]) {
          const [x, z] = P(u, -0.08);
          kit.box(x, y + 0.14, z, 0.14, 0.26, 0.08, 0xf7f2e7, null, [0, L.yaw, 0]);
          kit.hbox(x, y + 0.28, z, 0.16, 0.03, 0.1, 0xd8a848, null, [0, L.yaw, 0]);
          kit.bulb(x, y + 0.33, z, 0.03, 0xffe49e);
        }
      });
      // Waterfront Luxury Yacht moored in the surrounding channel on every clear side
      const [yx, yz] = P(-0.42, 0.72);
      if (!nearOther(yx, yz, 2.08)) {
        kit.decor("sport", "v:luxuryYacht", () => {
          kit.part("rbox", [yx, W + 0.05, yz], [0.42, 0.08, 0.16], 0xfaf7f0, null, [0, L.yaw + 0.25, 0]);
          kit.hbox(yx, W + 0.1, yz, 0.34, 0.016, 0.15, 0xd8a848, null, [0, L.yaw + 0.25, 0]);
          kit.box(yx, W + 0.14, yz, 0.22, 0.07, 0.12, 0xffffff, null, [0, L.yaw + 0.25, 0]);
          kit.glow(yx, W + 0.14, yz, 0.18, 0.035, 0.125, 0x7fd8e8);
          kit.hbox(yx, W + 0.19, yz, 0.16, 0.02, 0.1, 0x235e73, null, [0, L.yaw + 0.25, 0]);
          kit.bulb(yx, W + 0.24, yz, 0.025, 0xffe49e);
        });
      }
      // Overseas Cruise Pier, Golden Sea Route & Satellite Overseas Resort Atolls in the surrounding ocean
      const [ax, az] = P(0.18, 1.42);
      if (!nearOther(ax, az, 2.28)) {
        // Wooden Resort Cruise Pier extending from ledge into the sea
        kit.decor("sport", "v:overseasJetty", () => {
          for (let k = 0; k < 5; k++) {
            const [jx, jz] = P(0.18, 0.34 + k * 0.11);
            kit.hbox(jx, W + 0.08, jz, 0.22, 0.025, 0.09, k % 2 ? 0xa77a55 : 0xb48560, null, [0, L.yaw, 0]);
          }
          for (const d of [-0.09, 0.09]) {
            const [px, pz] = P(0.18 + d, 0.78);
            kit.cyl(px, W + 0.12, pz, 0.022, 0.24, 0xd8a848);
            kit.bulb(px, W + 0.26, pz, 0.024, 0xffe49e);
          }
        });
        // Dashed Golden Overseas Flight / Cruise Sea Route from pier to satellite atoll
        kit.decor("sport", "v:overseasRoute", () => {
          for (let k = 0; k < 4; k++) {
            const [rx, rz] = P(0.18, 0.88 + k * 0.1);
            kit.hbox(rx, W + 0.015, rz, 0.05, 0.01, 0.06, 0xd8a848, null, [0, L.yaw, 0]);
          }
        });
        // Satellite Overseas Resort Atoll (Singapore SkyPark / Japan Torii Onsen / Maldives Overwater Villa)
        kit.decor("sport", "v:overseasAtoll", () => {
          const kind = li % 3;
          // Coral sandbank & turquoise reef lagoon ring
          kit.cyl(ax, W + 0.012, az, 0.54, 0.024, 0x5ec8d8);
          kit.cyl(ax, W + 0.032, az, 0.42, 0.045, 0xead7a6);
          kit.ico(ax, W + 0.065, az, [0.36, 0.06, 0.32], 0xd9c59a);
          if (kind === 0) {
            // Singapore-style triple-tower skyline atoll (decorative)
            for (const d of [-0.12, 0, 0.12]) {
              kit.box(ax + L.tx * d, W + 0.2, az + L.tz * d, 0.065, 0.26, 0.08, 0xd8e6ee, null, [0, L.yaw, 0]);
              kit.glow(ax + L.tx * d, W + 0.21, az + L.tz * d, 0.05, 0.2, 0.084, 0x7fc8d8);
            }
            kit.hbox(ax, W + 0.35, az, 0.38, 0.03, 0.12, 0xf7f2e7, null, [0, L.yaw, 0]);
            kit.hbox(ax, W + 0.37, az, 0.32, 0.014, 0.08, 0x4fc3dc, null, [0, L.yaw, 0]);
            kit.bulb(ax, W + 0.42, az, 0.03, 0xffe49e);
          } else if (kind === 1) {
            // Japan Onsen Ryokan & Seaside Vermilion Torii Atoll
            kit.box(ax - L.tx * 0.08, W + 0.15, az - L.tz * 0.08, 0.22, 0.14, 0.16, 0xf5ecdc, null, [0, L.yaw, 0]);
            kit.part("hip", [ax - L.tx * 0.08, W + 0.26, az - L.tz * 0.08], [0.28, 0.09, 0.22], 0x353b45, null, [0, L.yaw, 0]);
            // Vermilion Torii Gate by the water
            const tx = ax + L.tx * 0.15, tz = az + L.tz * 0.15;
            for (const d of [-0.05, 0.05]) kit.cyl(tx + L.tx * d, W + 0.15, tz + L.tz * d, 0.014, 0.18, 0xd93b2b);
            kit.hbox(tx, W + 0.24, tz, 0.15, 0.022, 0.03, 0xd93b2b, null, [0, L.yaw, 0]);
            kit.hbox(tx, W + 0.2, tz, 0.12, 0.015, 0.022, 0xd93b2b, null, [0, L.yaw, 0]);
            // Sakura blossom tree
            kit.cyl(ax, W + 0.12, az - L.dx * 0.12, 0.016, 0.12, 0x6b4c35);
            kit.sphere(ax, W + 0.21, az - L.dx * 0.12, [0.1, 0.08, 0.1], 0xf7b2c4);
          } else {
            // Maldives & Vietnam Overwater Bungalow Lagoon Atoll
            for (const d of [-0.11, 0.11]) {
              const bx = ax + L.tx * d, bz = az + L.tz * d;
              kit.cyl(bx, W + 0.08, bz, 0.016, 0.12, 0x8a6a4e);
              kit.box(bx, W + 0.14, bz, 0.14, 0.09, 0.14, 0xf7efe0, null, [0, L.yaw, 0]);
              kit.part("cone6", [bx, W + 0.22, bz], [0.2, 0.09, 0.2], 0xc89658);
            }
            kit.hbox(ax, W + 0.09, az, 0.34, 0.018, 0.06, 0xb48560, null, [0, L.yaw, 0]);
            kit.bulb(ax, W + 0.26, az, 0.028, 0xffe49e);
          }
        });
      }
    },
  },
  trails: {
    ledge: 0xe6dccb,
    fn({ P, y, kit, helpers: h, L, rnd }) {
      kit.decor("trails", "v:resortGate", () => {
        const [x, z] = P(-0.45, 0);
        for (const d of [-0.14, 0.14]) kit.cyl(x + L.tx * d, y + 0.17, z + L.tz * d, 0.03, 0.34, 0xf3ead8);
        kit.box(x, y + 0.36, z, 0.38, 0.06, 0.08, 0xd8a848, null, [0, L.yaw, 0]);
        kit.bulb(x, y + 0.42, z, 0.03, 0xffe49e);
      });
      kit.decor("trails", "v:poolDeck", () => {
        const [x, z] = P(0.32, -0.02);
        kit.hbox(x, y + 0.02, z, 0.68, 0.025, 0.22, 0x6ec3d0, null, [0, L.yaw, 0]);
        for (const u of [0.14, 0.5]) {
          const [ux, uz] = P(u, -0.16);
          kit.cyl(ux, y + 0.14, uz, 0.015, 0.28, 0xb48560);
          kit.part("cone6", [ux, y + 0.29, uz], [0.26, 0.08, 0.26], 0xd8a848);
        }
      });
      kit.decor("trails", "v:hotSpringSteam", () => {
        const [x, z] = P(-0.75, 0.15);
        kit.cyl(x, y + 0.02, z, 0.24, 0.04, 0xb7a993);
        kit.cyl(x, y + 0.04, z, 0.2, 0.01, 0x9fd8e6);
        for (let k = 0; k < 3; k++) kit.ico(x + (k - 1) * 0.04, y + 0.12 + k * 0.08, z, [0.08 + k * 0.03, 0.06, 0.08], 0xffffff);
      });
    },
  },
  forest: {
    ledge: 0x8fa67a,
    fn({ P, y, kit, helpers: h, L, rnd }) {
      for (let k = 0; k < 3; k++) kit.decor("forest", "v:woods", () => h.tree(...P(-0.65 + k * 0.25, 0.1), 0.32 + rnd() * 0.12, y));
      kit.decor("forest", "v:nursery", () => {
        for (let k = 0; k < 8; k++) {
          const [x, z] = P(0.2 + (k % 4) * 0.12, -0.1 + Math.floor(k / 4) * 0.14);
          kit.cyl(x, y + 0.03, z, 0.05, 0.06, 0x8a6a4e);
          kit.part("cone6", [x, y + 0.12, z], [0.06, 0.13, 0.06], 0x7f9a6a);
        }
      });
      kit.decor("forest", "v:logPile", () => {
        for (let k = 0; k < 5; k++) {
          const [x, z] = P(-0.15, -0.15);
          kit.part("cylinder", [x + L.tx * ((k % 3) - 1) * 0.07, y + 0.035 + (k > 2 ? 0.06 : 0), z + L.tz * ((k % 3) - 1) * 0.07], [0.06, 0.26, 0.06], 0xa77a55, null, [Math.PI / 2, L.yaw, 0]);
        }
      });
      kit.decor("forest", "v:birdhouse", () => {
        const [x, z] = P(0.7, 0.2);
        kit.cyl(x, y + 0.15, z, 0.012, 0.3, 0x8a6a4e);
        kit.box(x, y + 0.32, z, 0.07, 0.07, 0.07, 0xdb6a41);
        kit.part("cone6", [x, y + 0.38, z], [0.1, 0.06, 0.1], 0x8a6a4e);
      });
    },
  },
  youth: {
    ledge: 0xd9a77a,
    fn({ P, y, kit, L, rnd, ambientSpots, id }) {
      kit.decor("youth", "v:graffitiWall", () => {
        for (let k = 0; k < 4; k++) {
          const [x, z] = P(-0.6 + k * 0.22, -0.2);
          kit.box(x, y + 0.13, z, 0.21, 0.26, 0.04, [0xe8c547, 0xdb6a41, 0x58a6a6, 0xf3e2c6][k], null, [0, L.yaw, 0]);
        }
      });
      kit.decor("youth", "v:skateRamp", () => {
        const [x, z] = P(0.35, 0.05);
        kit.part("box", [x, y + 0.06, z], [0.4, 0.02, 0.2], 0xb7a993, null, [0.35, L.yaw, 0]);
        kit.box(x, y + 0.04, z, 0.4, 0.08, 0.06, 0xb7a993, null, [0, L.yaw, 0]);
      });
      kit.decor("youth", "v:marketTent", () => {
        const [x, z] = P(-0.15, 0.15);
        for (const d of [-0.12, 0.12]) kit.cyl(x + L.tx * d, y + 0.11, z + L.tz * d, 0.012, 0.22, 0x211d1d);
        kit.part("prism", [x, y + 0.26, z], [0.3, 0.32, 0.22], 0xfff1de, null, [0, L.yaw, Math.PI / 2]);
        kit.box(x, y + 0.08, z, 0.26, 0.04, 0.14, 0xb48560, null, [0, L.yaw, 0]);
      });
      kit.decor("youth", "v:neon", () => {
        const [x, z] = P(0.65, -0.18);
        kit.cyl(x, y + 0.2, z, 0.015, 0.4, 0x211d1d);
        kit.glow(x, y + 0.42, z, 0.18, 0.08, 0.02, 0xe7a383);
      });
    },
    top({ c, ambientSpots }) {
      // open-air dream stage audience + a skater on the free strip west of the stage (clear of every model footprint)
      ambientSpots.push({ role: "youth", island: "youth", pos: [c.x - 0.8, 0, c.z + 1.04], yaw: Math.PI / 2, wander: 0.12, pose: "wave" });
      ambientSpots.push({ role: "youth", island: "youth", pos: [c.x + 0.12, 0, c.z + 1.32], yaw: Math.PI, pose: "sit" });
      ambientSpots.push({ role: "youth", island: "youth", pos: [c.x + 0.5, 0, c.z + 1.36], yaw: Math.PI - 0.25, pose: "wave" });
    },
  },
  diplomacy: {
    ledge: 0xb48560,
    top({ c, ambientSpots, kit }) {
      for (const [x, z, yaw] of [
        [-0.25, -0.25, 2.6],
        [0.35, -0.2, -2.4],
        [-0.45, 0.25, 0.4],
      ])
        ambientSpots.push({ role: "traveller", island: "diplomacy", pos: [c.x + x, 0, c.z + z], yaw, wander: 0.08 });
    },
    fn({ P, y, kit, L, rnd, W, li, markers, ambientSpots }) {
      kit.decor("diplomacy", "v:jetty", () => {
        for (let k = 0; k < 6; k++) {
          const [x, z] = P(0.2, 0.3 + k * 0.12);
          kit.hbox(x, y - 0.02, z, 0.22, 0.03, 0.1, k % 2 ? 0xa77a55 : 0xb48560, null, [0, L.yaw, 0]);
        }
        for (let k = 0; k < 3; k++) {
          const [x, z] = P(0.2 + 0.13, 0.35 + k * 0.25);
          kit.cyl(x, y - 0.1, z, 0.03, 0.3, 0x8a6a4e);
        }
      });
      if (li === 0) {
        markers.push({ P, L });
        for (const [u, v, yaw] of [
          [0.05, 0.1, 0.3],
          [0.3, 0.15, -0.4],
          [0.45, -0.05, 2.8],
        ]) {
          const [x, z] = P(u, v);
          ambientSpots.push({ role: "traveller", island: "diplomacy", pos: [x, y + 0.02, z], yaw: L.yaw + yaw });
        }
        kit.decor("diplomacy", "v:shelter", () => {
          const [x, z] = P(-0.45, 0.05);
          for (const d of [-0.16, 0.16]) kit.cyl(x + L.tx * d, y + 0.16, z + L.tz * d, 0.015, 0.32, 0x211d1d);
          kit.box(x, y + 0.33, z, 0.44, 0.03, 0.2, 0x3e7c8c, null, [0, L.yaw, 0]);
          kit.hbox(x, y + 0.07, z, 0.36, 0.03, 0.08, 0xb48560, null, [0, L.yaw, 0]);
        });
      }
      if (li === 0) kit.decor("diplomacy", "v:seaRoute", () => {
        // A10: dashed routes run from the pier head to each partner islet's quay
        for (const [k, col] of [
          [0, 0xdb6a41],
          [1, 0x3e7c8c],
        ]) {
          const c = seaCurve(P, k);
          for (let j = 1; j < 22; j++) {
            const t = j / 22;
            const [x, z] = bez(c, t),
              [x2, z2] = bez(c, t + 0.01);
            kit.hbox(x, W + 0.012, z, 0.07, 0.008, 0.2, col, null, [0, Math.atan2(x2 - x, z2 - z), 0]);
          }
          // quay markers at both ends
          for (const [x, z] of [c.start, c.end]) {
            kit.cyl(x, W + 0.12, z, 0.06, 0.28, col);
            kit.bulb(x, W + 0.3, z, 0.05, 0xfff0c2);
          }
        }
      });
      kit.decor("diplomacy", "v:sailboat", () => boat(kit, ...P(-0.3, 0.9), L.yaw + 0.4, W, rnd));
      kit.decor("diplomacy", "v:sailboat", () => boat(kit, ...P(0.55, 1.1), L.yaw - 0.3, W, rnd));
      kit.decor("diplomacy", "v:buoy", () => buoy(kit, ...P(-0.7, 0.6), W));
      kit.decor("diplomacy", "v:luggageCart", () => {
        const [x, z] = P(-0.4, -0.05);
        kit.hbox(x, y + 0.05, z, 0.22, 0.02, 0.12, 0x58585f, null, [0, L.yaw, 0]);
        for (let k = 0; k < 3; k++) kit.box(x + L.tx * (-0.06 + k * 0.06), y + 0.12, z + L.tz * (-0.06 + k * 0.06), 0.05, 0.12, 0.09, [0xdb6a41, 0x3e7c8c, 0xe8c547][k], null, [0, L.yaw, 0]);
      });
      if (li === 0)
        kit.decor("diplomacy", "v:balloon", () => {
          const [x, z] = P(-0.75, 0.4);
          kit.sphere(x, y + 1.0, z, [0.24, 0.28, 0.24], 0xdb6a41);
          kit.sphere(x, y + 1.0, z, [0.245, 0.08, 0.245], 0xfff1de);
          for (const d of [-0.04, 0.04]) kit.cyl(x + d, y + 0.8, z, 0.006, 0.16, 0x5a4a3e);
          kit.box(x, y + 0.7, z, 0.08, 0.06, 0.08, 0xb48560);
        });
    },
  },
  luxury: {
    ledge: 0xe6d7bd,
    fn({ P, y, kit, helpers: h, L }) {
      kit.decor("luxury", "v:topiaryPair", () => {
        for (const u of [-0.56, 0.56]) {
          const [x, z] = P(u, 0.04);
          kit.box(x, y + 0.06, z, 0.14, 0.12, 0.14, 0xf4ecdc);
          kit.hbox(x, y + 0.125, z, 0.15, 0.015, 0.15, 0xd8a848);
          kit.sphere(x, y + 0.22, z, [0.11, 0.15, 0.11], 0x5c8258);
        }
      });
      kit.decor("luxury", "v:goldLamp", () => {
        const [x, z] = P(0.32, -0.1);
        kit.cyl(x, y + 0.18, z, 0.013, 0.36, 0xb88b4a);
        kit.sphere(x, y + 0.38, z, 0.036, 0xfff3cf);
        kit.bulb(x, y + 0.38, z, 0.028);
      });
      kit.decor("luxury", "v:bench", () => h.bench(...P(-0.18, -0.1), L.yaw, y));
    },
  },
  innovation: {
    ledge: 0xcbd8df,
    fn({ P, y, kit, helpers: h, L }) {
      kit.decor("innovation", "v:smartBollards", () => {
        for (const u of [-0.54, 0.54]) {
          const [x, z] = P(u, 0.05);
          kit.cyl(x, y + 0.1, z, 0.028, 0.2, 0x2f5a6a);
          kit.bulb(x, y + 0.22, z, 0.026, 0x9fffd0);
        }
      });
      kit.decor("innovation", "v:bench", () => h.bench(...P(0.0, -0.09), L.yaw, y));
    },
  },
  esg: {
    ledge: 0xcfd9c5,
    fn({ P, y, kit, helpers: h, L }) {
      kit.decor("esg", "v:herbPlanters", () => {
        for (const u of [-0.52, 0.52]) {
          const [x, z] = P(u, 0.04);
          kit.box(x, y + 0.05, z, 0.18, 0.1, 0.12, 0xa87c56, null, [0, L.yaw, 0]);
          kit.ico(x, y + 0.13, z, [0.15, 0.08, 0.1], 0x7da468);
        }
      });
      kit.decor("esg", "v:solarPost", () => {
        const [x, z] = P(0.28, -0.1);
        kit.cyl(x, y + 0.15, z, 0.012, 0.3, 0x4b6050);
        kit.hbox(x, y + 0.31, z, 0.08, 0.01, 0.06, 0x2a4858, null, [0.25, L.yaw, 0]);
        kit.bulb(x, y + 0.28, z, 0.024, 0xfff0c2);
      });
      kit.decor("esg", "v:bench", () => h.bench(...P(-0.2, -0.1), L.yaw, y));
    },
  },
};

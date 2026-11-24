// 海上小島觀景台：每座裝飾小島（decor.js 的 islets）靠校園那一側蓋一座木造六角觀景台，以木棧橋接回最近的校園島，
// 角色可以走過去。小島本身維持原樣（燈塔、風車、涼亭等道具都在島中央），觀景台只佔島緣，不與道具重疊。
// 名稱只是景觀描述（例如「燈塔小島觀景台」），不是系所資料。
import { createBaker, linkRoute, APO } from "./walk-links.js?v=20261114-01";

const DECK_R = 0.78; // 觀景台外接半徑（尖頂六角，與校園島同方位）
const ARCH = 0.07,
  DECK = 0.04;
const NAMES = {
  grove: ["樹林小島", "Grove islet"],
  lighthouse: ["燈塔小島", "Lighthouse islet"],
  sandbar: ["沙洲小島", "Sandbar"],
  rocks: ["礁岩小島", "Rocky islet"],
  teahill: ["茶園小島", "Tea-terrace islet"],
  pavilion: ["涼亭小島", "Pavilion islet"],
  currentShip: ["帆船小島", "Sailing-ship islet"],
  windmill: ["風車小島", "Windmill islet"],
  fishhut: ["漁屋小島", "Fishing-hut islet"],
  orchardIslet: ["果園小島", "Orchard islet"],
};

// distance from point (px,pz) to segment a-b
const segDist = (px, pz, a, b) => {
  const vx = b.x - a.x,
    vz = b.z - a.z,
    l2 = vx * vx + vz * vz || 1e-9;
  const t = Math.max(0, Math.min(1, ((px - a.x) * vx + (pz - a.z) * vz) / l2));
  return Math.hypot(px - (a.x + vx * t), pz - (a.z + vz * t));
};

export function buildIsletWalks(THREE, { scene, islets, centers, islandR, campusIds, top: G, english = false, avoid = [] }) {
  const group = new THREE.Group();
  group.name = "islet-walks";
  const nav = { islands: [], bridges: [], obstacles: [] };
  const links = [];
  const K = createBaker(THREE, ["solid", "glow"]);
  const WOOD = 0xb48560,
    WOOD_D = 0x9a7050,
    POST = 0x7a5d44;
  const placed = []; // decks already built (for spacing checks)

  for (const isl of islets) {
    const ri = 1.1 * isl.s; // islet radius (decor.js cylinder diameter is 2.2·s)
    // nearest campus island whose straight boardwalk would not cross another island, deck or harbour island
    let best = null;
    for (const id of campusIds) {
      const c = centers.get(id);
      const d = Math.hypot(isl.x - c.x, isl.z - c.z);
      const ux = (isl.x - c.x) / d,
        uz = (isl.z - c.z) / d;
      const ringApo = (islandR(id) - 0.22) * APO;
      // distance of the deck centre from the islet centre (toward the campus): on the rim by default; islets with a large
      // central prop get it further out (fishing huts, windmills) or just off the shore (the sailing ship)
      const off = isl.theme === "currentShip" ? ri + DECK_R * 0.75 : isl.theme === "fishhut" || isl.theme === "windmill" ? ri * 0.9 : ri * 0.55;
      const deck = { x: isl.x - ux * off, z: isl.z - uz * off };
      const pa = { x: c.x + ux * ringApo, z: c.z + uz * ringApo };
      const pb = { x: deck.x - ux * (DECK_R * APO - 0.12), z: deck.z - uz * (DECK_R * APO - 0.12) };
      const len = Math.hypot(pb.x - pa.x, pb.z - pa.z);
      if (len > 6.5 || len < 0.4) continue;
      let clear = true;
      for (const o of campusIds) {
        if (o === id) continue;
        const oc = centers.get(o);
        if (segDist(oc.x, oc.z, pa, pb) < islandR(o) + 0.15 || Math.hypot(deck.x - oc.x, deck.z - oc.z) < islandR(o) + DECK_R + 0.2) clear = false;
      }
      for (const a of avoid) if (segDist(a.x, a.z, pa, pb) < a.r + 0.2 || Math.hypot(deck.x - a.x, deck.z - a.z) < a.r + DECK_R) clear = false;
      for (const q of placed) if (segDist(q.deck.x, q.deck.z, pa, pb) < DECK_R + 0.3 || segDist(deck.x, deck.z, q.pa, q.pb) < DECK_R + 0.3) clear = false;
      if (clear && (!best || len < best.len)) best = { id, c, ux, uz, deck, pa, pb, len };
    }
    if (!best) continue;
    placed.push(best);
    const { deck, pa, pb, ux, uz } = best;
    const yaw = Math.atan2(ux, uz);

    // ---- deck: hexagonal timber platform on piles, plank lines, rail with a gap toward the bridge, lamp and bench
    K.add("solid", K.G.hex, WOOD, deck.x, G - 0.02, deck.z, DECK_R * 2, 0.04, DECK_R * 2);
    K.add("solid", K.G.hex, WOOD_D, deck.x, G - 0.055, deck.z, DECK_R * 2 + 0.04, 0.03, DECK_R * 2 + 0.04);
    for (let k = -3; k <= 3; k++) {
      const off = k * 0.2,
        half = Math.sqrt(Math.max(0, (DECK_R * APO) ** 2 - off * off)) * 0.98;
      K.add("solid", K.G.box, WOOD_D, deck.x + Math.cos(yaw) * off, G + 0.001, deck.z - Math.sin(yaw) * off, 0.008, 0.004, half * 2, 0, yaw, 0);
    }
    for (let k = 0; k < 6; k++) {
      const a = (k * Math.PI) / 3;
      const px = deck.x + Math.sin(a) * DECK_R * 0.82,
        pz = deck.z + Math.cos(a) * DECK_R * 0.82;
      K.beam("solid", POST, [px, -0.6, pz], [px, G - 0.06, pz], 0.035);
    }
    const verts = Array.from({ length: 7 }, (_, k) => [deck.x + Math.sin((k * Math.PI) / 3) * (DECK_R - 0.05), deck.z + Math.cos((k * Math.PI) / 3) * (DECK_R - 0.05)]);
    let prev = null;
    for (let k = 0; k < 6; k++) {
      const [ax, az] = verts[k],
        [bx, bz] = verts[k + 1];
      for (let i = k ? 1 : 0; i <= 3; i++) {
        const x = ax + ((bx - ax) * i) / 3,
          z = az + ((bz - az) * i) / 3;
        if (Math.hypot(x - pb.x, z - pb.z) < 0.32) {
          prev = null;
          continue;
        }
        K.beam("solid", POST, [x, G, z], [x, G + 0.15, z], 0.008);
        if (prev) K.beam("solid", WOOD_D, [prev[0], G + 0.15, prev[1]], [x, G + 0.15, z], 0.007);
        prev = [x, z];
      }
    }
    const far = { x: deck.x + ux * DECK_R * 0.45, z: deck.z + uz * DECK_R * 0.45 };
    K.beam("solid", 0x3d4a52, [far.x + uz * 0.3, G, far.z - ux * 0.3], [far.x + uz * 0.3, G + 0.3, far.z - ux * 0.3], 0.008);
    K.add("glow", K.G.sphere, 0xffe7b0, far.x + uz * 0.3, G + 0.31, far.z - ux * 0.3, 0.045, 0.045, 0.045);
    K.block("solid", WOOD_D, far.x - uz * 0.15, G + 0.045, far.z + ux * 0.15, 0.24, 0.02, 0.07, yaw + Math.PI / 2);
    for (const sd of [-1, 1]) K.block("solid", POST, far.x - uz * (0.15 + sd * 0.1), G, far.z + ux * (0.15 + sd * 0.1), 0.02, 0.045, 0.06, yaw + Math.PI / 2);
    // coin-operated binocular stand facing the islet
    K.beam("solid", 0x5b6168, [far.x, G, far.z], [far.x, G + 0.16, far.z], 0.012);
    K.add("solid", K.G.box, 0x3e7c8c, far.x, G + 0.18, far.z, 0.06, 0.04, 0.08, 0, yaw, 0);
    nav.obstacles.push({ type: "circle", island: null, owner: "islet", x: far.x, z: far.z, r: 0.05 });

    // ---- boardwalk bridge (deck height = the walking code's arch formula)
    const len = Math.hypot(pb.x - pa.x, pb.z - pa.z);
    const n = Math.max(6, Math.round(len / 0.18));
    const at = (t, off = 0, dy = 0) => [pa.x + (pb.x - pa.x) * t + uz * off, G + 0.02 + Math.sin(t * Math.PI) * ARCH + dy, pa.z + (pb.z - pa.z) * t - ux * off];
    for (let s = 0; s < n; s++) {
      const a = at(s / n),
        b = at((s + 1) / n);
      const pitch = Math.atan2(b[1] - a[1], len / n);
      K.add("solid", K.G.box, s % 2 ? WOOD : WOOD_D, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2, 0.42, 0.035, len / n - 0.012, -pitch, yaw, 0);
    }
    for (const sd of [-1, 1]) {
      let last = null;
      for (let s = 0; s <= n; s += 2) {
        const p0 = at(s / n, sd * 0.19),
          p1 = at(s / n, sd * 0.19, 0.15);
        K.beam("solid", POST, p0, p1, 0.01);
        if (last) K.beam("solid", 0xd9c7a6, last, p1, 0.004); // rope rail
        last = p1;
        if (s % 6 === 0) K.beam("solid", POST, [p0[0], -0.5, p0[2]], [p0[0], p0[1] - 0.02, p0[2]], 0.02); // piles
      }
    }
    const [zh, en] = NAMES[isl.theme] || ["小島", "Islet"];
    const id = "islet-" + nav.islands.length;
    nav.islands.push({ id, x: deck.x, z: deck.z, r: DECK_R, name: english ? `${en} lookout` : `${zh}觀景台` });
    nav.bridges.push({ a: best.id, b: id, pa: { x: pa.x, y: G, z: pa.z }, pb: { x: pb.x, y: G, z: pb.z }, arch: ARCH, deck: DECK });
    links.push({ id, parent: best.id, pa, pb, bridgeAt: (t) => at(t), landing: { x: deck.x, z: deck.z } });
  }

  const mats = {
    solid: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.82, metalness: 0.02 }),
    glow: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.3, emissive: 0xffffff, emissiveIntensity: 0 }),
  };
  mats.glow.customProgramCacheKey = () => "islet-glow-v1";
  mats.glow.onBeforeCompile = (sh) => {
    sh.fragmentShader = sh.fragmentShader.replace("#include <emissivemap_fragment>", "#include <emissivemap_fragment>\n  totalEmissiveRadiance *= vColor.rgb;");
  };
  K.finish(group, mats);
  scene.add(group);

  return {
    group,
    nav,
    count: links.length,
    setNight(n) {
      mats.glow.emissiveIntensity = 0.06 + n * 2.4;
    },
    routes(existing, campus) {
      return links.map((l) => linkRoute(existing, campus, l, G, DECK - 0.02)).filter(Boolean);
    },
  };
}

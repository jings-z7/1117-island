// Instanced part kit: every static part is collected by geometry kind and drawn as one InstancedMesh.
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { tone } from "./palette.js?v=20261115-01";

export function createKit(THREE, top) {
  const geo = {
    box: new THREE.BoxGeometry(1, 1, 1),
    rbox: new RoundedBoxGeometry(1, 1, 1, 2, 0.12),
    cylinder: new THREE.CylinderGeometry(0.5, 0.5, 1, 14),
    cone: new THREE.ConeGeometry(0.5, 1, 10),
    cone6: new THREE.ConeGeometry(0.5, 1, 6),
    sphere: new THREE.SphereGeometry(0.5, 12, 8), // 2026-10-26: 14×10 → 12×8 (−33% triangles on ~850 small round parts; same look at map scale)
    ico: new THREE.IcosahedronGeometry(0.5, 1),
    dome: new THREE.SphereGeometry(0.5, 18, 9, 0, Math.PI * 2, 0, Math.PI / 2),
    torus: new THREE.TorusGeometry(0.5, 0.055, 6, 24),
    tetra: new THREE.ConeGeometry(0.5, 1, 4),
    // hip roof: square pyramid whose base is exactly a 1×1 square aligned to the axes, so any w×d scale stays a clean
    // rectangle (a scaled, 45°-turned round cone made lumpy, broken-looking roofs)
    hipPoint: new THREE.ConeGeometry(0.5, 1, 4).rotateY(Math.PI / 4).scale(Math.SQRT2, 1, Math.SQRT2),
    // 第三期 (2026-11-15): mansard instead of a pointed hip — a steep lower slope breaking into a shallow cap, the
    // classic grand-hotel roof; same 1×1 axis-aligned base so every existing w×d scale still fits its building
    hip: (() => {
      const g = new THREE.LatheGeometry([new THREE.Vector2(0.5, -0.5), new THREE.Vector2(0.43, 0.18), new THREE.Vector2(0.001, 0.5)], 4)
        .rotateY(Math.PI / 4)
        .scale(Math.SQRT2, 1, Math.SQRT2)
        .toNonIndexed();
      g.computeVertexNormals();
      return g;
    })(),
    prism: new THREE.CylinderGeometry(0.5, 0.5, 1, 3),
    glowbox: new THREE.BoxGeometry(1, 1, 1),
    glowsphere: new THREE.SphereGeometry(0.5, 10, 8),
    leaf: (() => {
      // lumpy low-poly foliage clump: icosahedron with deterministic vertex jitter
      const g = new THREE.IcosahedronGeometry(0.5, 1);
      const pos = g.attributes.position;
      const v = new THREE.Vector3();
      for (let i = 0; i < pos.count; i++) {
        v.fromBufferAttribute(pos, i);
        const n = Math.sin(v.x * 12.9 + v.y * 78.2 + v.z * 37.7) * 43758.5;
        const j = 1 + ((n - Math.floor(n)) - 0.5) * 0.16;
        v.multiplyScalar(j);
        pos.setXYZ(i, v.x, v.y, v.z);
      }
      // merge duplicate vertices' normals smoothly enough but keep facets visible
      g.computeVertexNormals();
      return g;
    })(),
    trunk: new THREE.CylinderGeometry(0.32, 0.5, 1, 9),
  };
  const glowKinds = new Set(["glowbox", "glowsphere"]);
  const SMALL = new Set(["tuft", "pebble", "flowers", "planter", "bin", "bench", "bikeRack", "doorPath", "bush", "bunting", "fern", "rock", "veg", "lamp"]);
  const batches = new Map();
  const visual = new Map();
  const footprints = []; // {owner, island, minX,maxX,minZ,maxZ}
  let currentIsland = null;
  let decorCount = new Map(); // island -> {count, types:Set}
  let decorTag = null; // when set, parts are counted as decor for an island/type
  // real places keep real colours: campus landmarks, the partner hotels (sport-h02…h25) and 群賢會館; district:* parts
  // are already chosen from the palette
  const REAL = /^(landmark:|district:|sport-h(0[2-9]|1\d|2[0-5])$|family-station$)/;
  const keepOriginal = (owner) => (typeof owner === "string" && REAL.test(owner)) || (decorTag && String(decorTag.type).startsWith("landmark:"));
  function part(kind, pos, scale, color, owner = null, rotation = null) {
    const real = keepOriginal(owner);
    if (kind === "hip" && real) kind = "hipPoint"; // real buildings keep their own pointed roofs
    // every static part goes through the 港都典藏 palette, except light bulbs / glow panels and the real NKUHT campus
    // landmarks (朝陽鐘樓 and the public artworks), which keep the colours modelled on the real campus
    const entry = { pos: new THREE.Vector3(...pos), scale: new THREE.Vector3(...scale), color: new THREE.Color(glowKinds.has(kind) || real ? color : tone(color)), owner, rotation: rotation || [0, 0, 0], island: currentIsland };
    const key = decorTag && SMALL.has(decorTag.type) ? kind + "|lod" : kind;
    if (!batches.has(key)) batches.set(key, []);
    batches.get(key).push(entry);
    // every mansard roof sits on a thin ivory cornice a little wider than the roof (the eave line hotels read by)
    if (kind === "hip" && scale[1] > 0.05) {
      const c = { pos: entry.pos.clone().setY(entry.pos.y - scale[1] * 0.5 + 0.008), scale: new THREE.Vector3(scale[0] * 1.06, 0.022, scale[2] * 1.06), color: new THREE.Color(0xeee4cf), owner, rotation: entry.rotation, island: currentIsland };
      if (!batches.has("box")) batches.set("box", []);
      batches.get("box").push(c);
    }
    return entry;
  }
  const k = {
    geo,
    top,
    part,
    batches,
    visual,
    footprints,
    setIsland: (id) => (currentIsland = id),
    box: (x, y, z, w, h, d, c, o, r) => part(w > 0.07 && h > 0.07 && d > 0.07 ? "rbox" : "box", [x, y, z], [w, h, d], c, o, r),
    hbox: (x, y, z, w, h, d, c, o, r) => part("box", [x, y, z], [w, h, d], c, o, r),
    cyl: (x, y, z, w, h, c, o, r) => part("cylinder", [x, y, z], [w, h, w], c, o, r),
    sphere: (x, y, z, s, c, o) => part("sphere", [x, y, z], Array.isArray(s) ? s : [s, s, s], c, o),
    ico: (x, y, z, s, c, o) => part("ico", [x, y, z], Array.isArray(s) ? s : [s, s, s], c, o),
    glow: (x, y, z, w, h, d, c, o) => part("glowbox", [x, y, z], [w, h, d], c, o),
    bulb: (x, y, z, s, c = 0xfff0c2, o) => part("glowsphere", [x, y, z], [s, s, s], c, o),
    decor(island, type, fn) {
      const prev = decorTag;
      decorTag = { island, type };
      const before = countAll();
      fn();
      const added = countAll() - before;
      if (!decorCount.has(island)) decorCount.set(island, { count: 0, types: new Set(), vignette: 0, vignetteTypes: new Set() });
      const dc = decorCount.get(island);
      if (type.startsWith("v:")) {
        dc.vignette += 1;
        dc.vignetteTypes.add(type);
      } else {
        dc.count += 1;
        dc.types.add(type);
      }
      decorTag = prev;
      return added;
    },
    decorStats: () => Object.fromEntries([...decorCount].map(([i, v]) => [i, { scatter: v.count, scatterTypes: v.types.size, vignette: v.vignette, vignetteTypes: [...v.vignetteTypes] }])),
  };
  function countAll() {
    let n = 0;
    for (const v of batches.values()) n += v.length;
    return n;
  }
  // 2026-10-29: z-fight resolver. Two flat tops of the same depth class (same polygon offset) that overlap in plan and
  // sit within 4 mm of each other shimmer as the camera moves (ledge seams, ∞ path tiles, pier planks, stacked crates,
  // painted lines). Before batching, the smaller of each such pair has its top raised to 7 mm above the other (its
  // bottom stays put), which is invisible at map scale but gives the depth buffer a clear winner. heartCity.debug.zfight()
  // reports what is left.
  function resolveCoplanar() {
    const PRI = { glowbox: -6, box: -3, cylinder: -1, rbox: 0 };
    const tops = [];
    for (const [key, items] of batches) {
      const kind = key.split("|")[0];
      if (!(kind in PRI)) continue;
      for (const e of items) {
        const [rx, ry, rz] = e.rotation;
        if (Math.abs(rx) > 1e-3 || Math.abs(rz) > 1e-3) continue;
        const hx = e.scale.x / 2, hz = e.scale.z / 2, c = Math.abs(Math.cos(ry)), s = Math.abs(Math.sin(ry));
        const ex = kind === "cylinder" ? hx : hx * c + hz * s, ez = kind === "cylinder" ? hz : hx * s + hz * c;
        tops.push({ e, pri: PRI[kind], x0: e.pos.x - ex, x1: e.pos.x + ex, z0: e.pos.z - ez, z1: e.pos.z + ez, area: 4 * ex * ez });
      }
    }
    const G = 0.5, grid = new Map();
    tops.forEach((t, i) => {
      for (let gx = Math.floor(t.x0 / G); gx <= Math.floor(t.x1 / G); gx++)
        for (let gz = Math.floor(t.z0 / G); gz <= Math.floor(t.z1 / G); gz++) {
          const key = gx * 100003 + gz;
          let l = grid.get(key);
          if (!l) grid.set(key, (l = []));
          l.push(i);
        }
    });
    const top = (t) => t.e.pos.y + t.e.scale.y / 2;
    let lifted = 0;
    for (let pass = 0; pass < 4; pass++) {
      const done = new Set();
      for (const list of grid.values())
        for (let a = 0; a < list.length; a++)
          for (let b = a + 1; b < list.length; b++) {
            const A = tops[list[a]], B = tops[list[b]];
            if (A.pri !== B.pri || A.e.color.equals(B.e.color)) continue;
            const dy = top(A) - top(B);
            if (Math.abs(dy) >= 0.004) continue;
            if (Math.min(A.x1, B.x1) - Math.max(A.x0, B.x0) <= 0.005 || Math.min(A.z1, B.z1) - Math.max(A.z0, B.z0) <= 0.005) continue;
            const pk = list[a] < list[b] ? list[a] * 1e6 + list[b] : list[b] * 1e6 + list[a];
            if (done.has(pk)) continue;
            done.add(pk);
            // lift the smaller part (ties: the later one) so its top clears the other by 7 mm
            const [lo, hi] = A.area < B.area || (A.area === B.area && list[a] > list[b]) ? [A, B] : [B, A];
            const need = top(hi) + 0.007 - top(lo);
            if (need <= 0) continue;
            lo.e.scale.y += need;
            lo.e.pos.y += need / 2;
            lifted++;
          }
    }
    return lifted;
  }
  k.build = function build(scene, mats) {
    const t0 = performance.now();
    k.coplanarLifted = resolveCoplanar();
    k.coplanarMs = performance.now() - t0;
    const dummy = new THREE.Object3D();
    const meshes = [];
    for (const [key, items] of batches) {
      const kind = key.split("|")[0];
      // depth priority per part kind: decals / panels / windows drawn onto other parts win their shared faces
      const PRI = { glowbox: -6, glowsphere: -3, box: -3, prism: -1, tetra: -1, hip: 0, cylinder: -1, rbox: 0, cone: 0, cone6: 0, torus: -1, sphere: 0.5, ico: 0.5, leaf: 0.5, dome: 0, trunk: 0 };
      const base = glowKinds.has(kind) ? mats.glow : mats.solid;
      const pr = PRI[kind] ?? 0;
      let material = base;
      if (pr !== 0) {
        material = base.clone();
        if (base.onBeforeCompile) material.onBeforeCompile = base.onBeforeCompile;
        if (base.customProgramCacheKey) material.customProgramCacheKey = base.customProgramCacheKey;
        (base.userData.clones ||= []).push(material);
        material.polygonOffset = true;
        material.polygonOffsetFactor = pr * 0.5;
        material.polygonOffsetUnits = pr * 2;
      }
      // 2026-10-26: big batches are split into spatial groups (k-d split on x then z) so the camera can cull the parts it
      // does not see. An InstancedMesh is drawn whole or not at all; in close-up views only ~10% of the city's
      // triangles are on screen, but every batch used to be drawn in full. Small batches stay as one mesh.
      for (const group of splitSpatially(items, 160, 4)) {
        const mesh = buildBatch(key, kind, material, group);
        scene.add(mesh);
        meshes.push(mesh);
      }
    }
    return meshes;
    function buildBatch(key, kind, material, items) {
      const mesh = new THREE.InstancedMesh(geo[kind], material, items.length);
      mesh.userData.lod = key.endsWith("|lod");
      mesh.castShadow = !glowKinds.has(kind);
      mesh.receiveShadow = true;
      items.forEach((p, n) => {
        dummy.position.copy(p.pos);
        // tiny deterministic size jitter so two same-kind parts never share an exact face (z-fighting)
        dummy.scale.copy(p.scale).multiplyScalar(1 + (((n * 7) % 9) - 4) * 0.0018);
        dummy.rotation.set(...p.rotation);
        dummy.updateMatrix();
        mesh.setMatrixAt(n, dummy.matrix);
        mesh.setColorAt(n, p.color);
        if (p.owner && visual.has(p.owner)) visual.get(p.owner).parts.push({ mesh, index: n, color: p.color });
      });
      mesh.userData = { type: "buildingBatch", items, kind, lod: key.endsWith("|lod") };
      mesh.computeBoundingSphere();
      return mesh;
    }
  };
  // split a list of parts into spatially coherent groups: halve along the longer horizontal axis at the median,
  // recursively, while a group is larger than `max` (at most `depth` levels → up to 2^depth groups)
  function splitSpatially(items, max, depth) {
    if (items.length <= max || depth <= 0) return [items];
    let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
    for (const p of items) {
      if (p.pos.x < minX) minX = p.pos.x;
      if (p.pos.x > maxX) maxX = p.pos.x;
      if (p.pos.z < minZ) minZ = p.pos.z;
      if (p.pos.z > maxZ) maxZ = p.pos.z;
    }
    const axis = maxX - minX >= maxZ - minZ ? "x" : "z";
    const sorted = [...items].sort((a, b) => a.pos[axis] - b.pos[axis]);
    const mid = sorted.length >> 1;
    return [...splitSpatially(sorted.slice(0, mid), max, depth - 1), ...splitSpatially(sorted.slice(mid), max, depth - 1)];
  }
  return k;
}

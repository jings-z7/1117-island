// Shared helpers for scenery the avatar can walk to (Kaohsiung harbour islands, islet viewing decks).
//
//   createBaker(THREE)  → bake small parts into a few merged meshes (one per material bucket); vertex colours, no shadows
//   linkRoute(...)      → a walking route for heart-me.js that starts on an existing campus route point (so it joins the
//                         main path network), crosses a bridge and ends at a landing point
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

export const APO = 0.8660254;

export function createBaker(THREE, bucketNames = ["solid", "glow"]) {
  const buckets = Object.fromEntries(bucketNames.map((k) => [k, []]));
  const _m = new THREE.Matrix4(),
    _q = new THREE.Quaternion(),
    _s = new THREE.Vector3(),
    _p = new THREE.Vector3(),
    _e = new THREE.Euler(),
    _c = new THREE.Color(),
    _up = new THREE.Vector3(0, 1, 0);
  const G = {
    box: new THREE.BoxGeometry(1, 1, 1),
    cyl: new THREE.CylinderGeometry(0.5, 0.5, 1, 10),
    hex: new THREE.CylinderGeometry(0.5, 0.5, 1, 6),
    sphere: new THREE.SphereGeometry(0.5, 8, 6),
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
  const api = {
    G,
    add(bucket, geo, color, x, y, z, sx = 1, sy = 1, sz = 1, rx = 0, ry = 0, rz = 0) {
      const g = geo.clone();
      _m.compose(_p.set(x, y, z), _q.setFromEuler(_e.set(rx, ry, rz)), _s.set(sx, sy, sz));
      g.applyMatrix4(_m);
      bake(bucket, g, color);
    },
    // box whose bottom sits at y
    block(bucket, color, x, y, z, w, h, d, ry = 0) {
      api.add(bucket, G.box, color, x, y + h / 2, z, w, h, d, 0, ry, 0);
    },
    beam(bucket, color, a, b, r) {
      const A = new THREE.Vector3(...a),
        B = new THREE.Vector3(...b);
      const len = A.distanceTo(B);
      if (len < 1e-4) return;
      const g = G.cyl.clone();
      _q.setFromUnitVectors(_up, B.clone().sub(A).normalize());
      _m.compose(A.add(B).multiplyScalar(0.5), _q, _s.set(r * 2, len, r * 2));
      g.applyMatrix4(_m);
      bake(bucket, g, color);
    },
    // merge every bucket into one mesh with the given materials; returns the meshes (already added to group)
    finish(group, mats) {
      const meshes = [];
      for (const [k, list] of Object.entries(buckets)) {
        if (!list.length || !mats[k]) continue;
        const merged = mergeGeometries(list, false);
        list.forEach((g) => g.dispose());
        if (!merged) continue;
        merged.computeBoundingSphere();
        const mesh = new THREE.Mesh(merged, mats[k]);
        mesh.castShadow = false;
        mesh.matrixAutoUpdate = false;
        group.add(mesh);
        meshes.push(mesh);
      }
      Object.values(G).forEach((g) => g.dispose());
      return meshes;
    },
  };
  return api;
}

// Points along a campus island's hex ring path (pointy-top vertices at 90° + k·60°), short way round.
function ringWalk(c, rr, from, to, footY) {
  const ang = (q) => Math.atan2(q.z - c.z, q.x - c.x);
  const a0 = ang(from);
  let d = ang(to) - a0;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  const pts = [];
  for (let k = -12; k <= 12; k++) {
    const va = Math.PI / 2 + (k * Math.PI) / 3;
    let rel = va - a0;
    while (rel > Math.PI) rel -= Math.PI * 2;
    while (rel < -Math.PI) rel += Math.PI * 2;
    if ((d > 0 && rel > 0.01 && rel < d - 0.01) || (d < 0 && rel < -0.01 && rel > d + 0.01)) pts.push({ rel: Math.abs(rel), x: c.x + Math.cos(va) * rr, z: c.z + Math.sin(va) * rr, footY });
  }
  return pts.sort((u, v) => u.rel - v.rel).map(({ x, z, footY: f }) => ({ x, z, footY: f }));
}

// Points of the existing routes that belong to the largest connected path network, merged on the same 0.06 grid
// heart-me.js uses (buildNet), so a new route that starts on one of them is guaranteed to join the main network.
const mainCache = new WeakMap();
function mainPoints(existing) {
  if (mainCache.has(existing)) return mainCache.get(existing);
  const eps = 0.06,
    key = (q) => Math.round(q.x / eps) + "," + Math.round(q.z / eps);
  const parent = new Map();
  const find = (k) => {
    while (parent.get(k) !== k) {
      parent.set(k, parent.get(parent.get(k)));
      k = parent.get(k);
    }
    return k;
  };
  const union = (a, b) => parent.set(find(a), find(b));
  for (const r of existing) {
    let prev = null;
    for (const q of r) {
      const k = key(q);
      if (!parent.has(k)) parent.set(k, k);
      if (prev) union(prev, k);
      prev = k;
    }
  }
  const size = new Map();
  for (const k of parent.keys()) size.set(find(k), (size.get(find(k)) || 0) + 1);
  let bestRoot = null;
  for (const [root, n] of size) if (!bestRoot || n > size.get(bestRoot)) bestRoot = root;
  const pts = [];
  for (const r of existing) for (const q of r) if (find(key(q)) === bestRoot) pts.push(q);
  mainCache.set(existing, pts);
  return pts;
}

// existing: campus pedestrian routes ([{x,z,footY}]); campus: { centers, ringR(id), bridges }
// link: { parent, pa:{x,z}, bridgeAt(t) → [x, y, z] (deck surface), landing:{x,z} }; G = walking height, deckLift = deck − 0.03
export function linkRoute(existing, campus, link, G, deckLift) {
  const pool = mainPoints(existing);
  const nearest = (x, z) => {
    let best = null,
      bd = Infinity;
    for (const q of pool) {
      const d = Math.hypot(q.x - x, q.z - z);
      if (d < bd) {
        bd = d;
        best = q;
      }
    }
    return { best, bd };
  };
  let head;
  const { best, bd } = nearest(link.pa.x, link.pa.z);
  if (best && bd <= 1.2) head = [{ x: best.x, z: best.z, footY: best.footY }];
  else {
    // no campus route near the bridge head: walk the parent's ring path to one of its other bridges, cross it first
    const c = campus.centers?.get(link.parent);
    const rr = campus.ringR?.(link.parent) ?? 1.8;
    let pick = null;
    for (const b of campus.bridges || []) {
      if (b.a !== link.parent && b.b !== link.parent) continue;
      const near = b.a === link.parent ? b.pa : b.pb,
        far = b.a === link.parent ? b.pb : b.pa;
      const r = nearest(far.x, far.z);
      if (r.best && r.bd < 1.6 && (!pick || r.bd < pick.r.bd)) pick = { b, near, far, r };
    }
    if (!pick || !c) return null;
    const foot = pick.r.best.footY ?? G;
    head = [
      { x: pick.r.best.x, z: pick.r.best.z, footY: pick.r.best.footY },
      { x: pick.far.x, z: pick.far.z, footY: foot },
      { x: (pick.near.x + pick.far.x) / 2, z: (pick.near.z + pick.far.z) / 2, footY: foot + (pick.b.arch || 0.08) },
      { x: pick.near.x, z: pick.near.z, footY: foot },
      ...ringWalk(c, rr, pick.near, link.pa, foot),
    ];
  }
  const foot = head[0].footY ?? G;
  const pts = head;
  for (let s = 0; s <= 10; s++) {
    const [x, y, z] = link.bridgeAt(s / 10);
    pts.push({ x, z, footY: y + deckLift + (foot - G) });
  }
  pts.push({ x: link.landing.x, z: link.landing.z, footY: foot });
  return pts;
}

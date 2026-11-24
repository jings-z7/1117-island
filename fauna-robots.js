// Hospitality-tech robots & Taiwan fauna for the HTL island city (stand-alone add-on).
// - 服務機器人 Service robots glide along short open-ground paths on the campus islands (innovation / family / sport …)
// - 掃地機器人 Cleaning robots wander in gentle loops with a spinning side brush
// - 黑面琵鷺 Black-faced spoonbills cruise in a loose V and now and then land to wade (bill sweeping) near a shore
// - 臺灣藍鵲 Taiwan blue magpies hop between islands with long white-tipped tails
// - 中華白海豚 Taiwanese humpback dolphins porpoise along an open-water loop; 綠蠵龜 green sea turtles paddle at the surface
// Every visible part is one instance of a handful of shared InstancedMeshes (≈9 draw calls in total);
// animation only moves part transforms. Each agent root carries userData.label (bilingual) and each
// InstancedMesh carries userData.labels[instanceId] for future picking.
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { WATER_Y } from "./environment.js?v=20261115-02";

const LABELS = {
  service: { zh: "旅館送物服務機器人", en: "Hotel delivery service robot" },
  vacuum: { zh: "掃地清潔機器人", en: "Cleaning robot vacuum" },
  spoonbill: { zh: "黑面琵鷺", en: "Black-faced spoonbill" },
  magpie: { zh: "臺灣藍鵲", en: "Taiwan blue magpie" },
  dolphin: { zh: "中華白海豚", en: "Taiwanese humpback dolphin" },
  turtle: { zh: "綠蠵龜", en: "Green sea turtle" },
};

function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const TAU = Math.PI * 2;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const smooth = (t) => t * t * (3 - 2 * t);
const lerp = (a, b, t) => a + (b - a) * t;
function angLerp(a, b, t) {
  let d = ((b - a + Math.PI) % TAU + TAU) % TAU - Math.PI;
  return a + d * t;
}

function waitForCity(cb) {
  const t0 = performance.now();
  const tick = () => {
    // wait for the reveal too: before it the city's matrices are not final and ground sampling would miss
    const loading = document.getElementById("loading");
    if (window.heartCity && window.heartCity.scene && window.heartCity.navData && (!loading || loading.hidden))
      return requestAnimationFrame(() => requestAnimationFrame(() => cb(window.heartCity)));
    if (performance.now() - t0 > 60000) return;
    setTimeout(tick, 200);
  };
  tick();
}

waitForCity((city) => {
  init(city).catch((e) => console.warn("fauna-robots init", e));
});

async function init(city) {
  if (window.heartFauna || window.__heartFaunaInit) return;
  window.__heartFaunaInit = true;
  const tInit = performance.now();
  // site sampling raycasts the city; spread it over several short tasks so the page never stalls
  let lastYield = tInit,
    rays = 0,
    rayMs = 0;
  const yieldNow = async () => {
    if (performance.now() - lastYield > 8) {
      await new Promise((r) => setTimeout(r, 0));
      lastYield = performance.now();
    }
  };
  const ground = (x, z, y0, drop) => {
    const t = performance.now();
    const g = city.groundAt(x, z, y0, drop);
    rays++;
    rayMs += performance.now() - t;
    return g;
  };
  const { scene, camera, controls, navData } = city;
  const TOP = navData.top;
  scene.updateMatrixWorld();
  const centers = navData.islandCenters;
  const ids = Object.keys(centers);
  const st0 = city.state || {};
  const mqReduce = window.matchMedia ? matchMedia("(prefers-reduced-motion: reduce)") : null;
  const reducedNow = () => !!(mqReduce?.matches || st0.reducedMotion);
  const small = (window.matchMedia && matchMedia("(pointer: coarse)").matches) || innerWidth <= 820 || st0.quality === "low";
  const N = small
    ? { service: 3, vacuum: 2, spoonbill: 5, magpie: 2, dolphin: 2, turtle: 1 }
    : { service: 5, vacuum: 4, spoonbill: 7, magpie: 3, dolphin: 3, turtle: 2 };
  const R = rng(20261113);

  // ---------- site helpers ----------
  let cx = 0,
    cz = 0;
  for (const id of ids) {
    cx += centers[id].x / ids.length;
    cz += centers[id].z / ids.length;
  }
  const obsBy = new Map();
  for (const o of navData.obstacles || []) {
    if (!obsBy.has(o.island)) obsBy.set(o.island, []);
    obsBy.get(o.island).push(o);
  }
  const islandR = (id) => centers[id].r || navData.islandRadius;
  function blocked(id, x, z, clr) {
    for (const o of obsBy.get(id) || []) {
      const dx = x - o.x,
        dz = z - o.z;
      if (o.type === "circle") {
        if (dx * dx + dz * dz < (o.r + clr) ** 2) return true;
      } else {
        const lx = dx * o.cos - dz * o.sin,
          lz = dx * o.sin + dz * o.cos;
        if (Math.abs(lx) < o.hx + clr && Math.abs(lz) < o.hz + clr) return true;
      }
    }
    return false;
  }
  const groundOK = (x, z) => {
    const g = ground(x, z, TOP + 3, 4);
    return g !== null && g > TOP - 0.03 && g < TOP + 0.06 ? g : null;
  };
  function insideIsland(id, x, z, k) {
    const c = centers[id];
    return Math.hypot(x - c.x, z - c.z) < islandR(id) * k;
  }
  function openSpot(id, kMin, kMax, clr, tries = 40) {
    const c = centers[id];
    for (let i = 0; i < tries; i++) {
      const a = R() * TAU,
        rr = islandR(id) * lerp(kMin, kMax, Math.sqrt(R()));
      const x = c.x + Math.cos(a) * rr,
        z = c.z + Math.sin(a) * rr;
      if (blocked(id, x, z, clr)) continue;
      const g = groundOK(x, z);
      if (g !== null) return { x, z, y: g, id };
    }
    return null;
  }
  function segmentClear(id, a, b, clr) {
    for (let i = 0; i <= 8; i++) {
      const t = i / 8,
        x = lerp(a.x, b.x, t),
        z = lerp(a.z, b.z, t);
      if (!insideIsland(id, x, z, 0.86) || blocked(id, x, z, clr)) return false;
    }
    for (const t of [0.33, 0.66, 1]) if (groundOK(lerp(a.x, b.x, t), lerp(a.z, b.z, t)) === null) return false;
    return true;
  }
  function isWater(x, z, margin) {
    for (const id of ids) {
      const c = centers[id];
      if (Math.hypot(x - c.x, z - c.z) < islandR(id) + margin) return false;
    }
    const g = ground(x, z, 2, 5);
    return g === null || g < WATER_Y - 0.03;
  }
  const inBounds = (x, z, lim = 19.5) => Math.hypot(x, z) < lim && Math.hypot(x - cx, z - cz) < lim;

  // ---------- part kit: shared instanced batches ----------
  const GEO = {
    rbox: new RoundedBoxGeometry(1, 1, 1, 2, 0.2),
    sphere: new THREE.SphereGeometry(0.5, 12, 8),
    cyl: new THREE.CylinderGeometry(0.5, 0.5, 1, 14),
    cone: new THREE.ConeGeometry(0.5, 1, 8),
    box: new THREE.BoxGeometry(1, 1, 1),
    blob: new THREE.CircleGeometry(0.5, 16).rotateX(-Math.PI / 2),
    ring: new THREE.TorusGeometry(0.5, 0.035, 4, 24).rotateX(Math.PI / 2),
  };
  const MAT = {
    std: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.55, metalness: 0.04 }),
    glow: new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false }),
    shadow: new THREE.MeshBasicMaterial({ color: 0x0b1a22, transparent: true, opacity: 0.22, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }),
    foam: new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.7, depthWrite: false }),
  };
  const root = new THREE.Object3D(); // logical hierarchy only (not rendered, not in the scene)
  const parts = [];
  let owner = null;
  function part(parent, geo, mat, color, pos, scl, rot) {
    const n = new THREE.Object3D();
    n.position.set(pos[0], pos[1], pos[2]);
    n.scale.set(scl[0], scl[1], scl[2]);
    if (rot) n.rotation.set(rot[0], rot[1], rot[2]);
    parent.add(n);
    parts.push({ node: n, key: geo + "|" + mat, color, owner });
    return n;
  }
  function pivot(parent, pos = [0, 0, 0], rot) {
    const n = new THREE.Object3D();
    n.position.set(pos[0], pos[1], pos[2]);
    if (rot) n.rotation.set(rot[0], rot[1], rot[2]);
    parent.add(n);
    return n;
  }
  const agents = [];
  function agent(kind, extra = {}) {
    const g = new THREE.Object3D();
    g.rotation.order = "YXZ";
    g.userData.label = { ...LABELS[kind] };
    g.userData.kind = kind;
    root.add(g);
    const a = { kind, g, ...extra };
    owner = a;
    agents.push(a);
    return a;
  }

  // ---------- models (local +z = forward, y = up, units ≈ world units before zoom scaling) ----------
  const ROBOT_ACCENT = [0x2bb5a6, 0xf08a3c, 0x4b7fe0, 0xe0567a, 0x8a63d2];
  function buildService(i) {
    const a = agent("service");
    const accent = ROBOT_ACCENT[i % ROBOT_ACCENT.length];
    a.shadow = part(root, "blob", "shadow", 0xffffff, [0, 0, 0], [0.2, 1, 0.2]);
    const b = pivot(a.g);
    a.body = b;
    part(b, "cyl", "std", 0x3c4652, [0, 0.025, 0], [0.17, 0.04, 0.15]);
    part(b, "rbox", "std", 0xf5f7f9, [0, 0.13, 0], [0.16, 0.18, 0.14]);
    part(b, "box", "std", accent, [0, 0.105, 0], [0.165, 0.014, 0.145]); // tray shelf stripes
    part(b, "box", "std", accent, [0, 0.165, 0], [0.165, 0.014, 0.145]);
    part(b, "box", "std", 0xdfe6ec, [0, 0.135, 0.071], [0.11, 0.1, 0.006]); // compartment door
    part(b, "box", "std", 0x7c8794, [0.04, 0.135, 0.076], [0.008, 0.04, 0.006]); // handle
    const head = pivot(b, [0, 0.27, 0]);
    a.head = head;
    part(head, "rbox", "std", 0xf5f7f9, [0, 0, 0], [0.15, 0.1, 0.12]);
    part(head, "box", "std", 0x17222f, [0, 0, 0.061], [0.12, 0.072, 0.008]); // screen
    a.eyes = [part(head, "box", "glow", 0x7ff6ff, [-0.026, 0.008, 0.066], [0.02, 0.028, 0.004]), part(head, "box", "glow", 0x7ff6ff, [0.026, 0.008, 0.066], [0.02, 0.028, 0.004])];
    part(head, "box", "glow", 0x7ff6ff, [0, -0.02, 0.066], [0.03, 0.006, 0.004]); // smile
    part(head, "cyl", "std", 0x9aa4ae, [0, 0.07, 0], [0.008, 0.05, 0.008]);
    a.lamp = part(head, "sphere", "glow", accent, [0, 0.1, 0], [0.026, 0.026, 0.026]);
    part(b, "cyl", "std", accent, [0, 0.335, 0], [0.11, 0.012, 0.09]); // serving tray on top of the head
    return a;
  }
  function buildVacuum() {
    const a = agent("vacuum");
    a.shadow = part(root, "blob", "shadow", 0xffffff, [0, 0, 0], [0.17, 1, 0.17]);
    part(a.g, "cyl", "std", 0x2c3138, [0, 0.016, 0], [0.15, 0.026, 0.15]);
    part(a.g, "cyl", "std", 0xd7dce2, [0, 0.032, -0.005], [0.12, 0.008, 0.12]);
    part(a.g, "box", "std", 0x55606b, [0, 0.022, 0.06], [0.1, 0.018, 0.03]); // front bumper
    part(a.g, "cyl", "std", 0x2c3138, [0, 0.04, 0.02], [0.03, 0.012, 0.03]); // lidar puck
    a.led = part(a.g, "sphere", "glow", 0x63ff9b, [0, 0.038, 0.045], [0.012, 0.012, 0.012]);
    a.brush = pivot(a.g, [0.055, 0.008, 0.06]);
    for (let k = 0; k < 3; k++) part(a.brush, "box", "std", 0xf2c14e, [0, 0, 0], [0.06, 0.004, 0.008], [0, (k * TAU) / 3, 0]);
    return a;
  }
  function buildSpoonbill() {
    const a = agent("spoonbill");
    const W = 0xf8f8f2,
      K = 0x1b1b1d;
    a.shadow = part(root, "blob", "shadow", 0xffffff, [0, 0, 0], [0, 1, 0]);
    part(a.g, "sphere", "std", W, [0, 0, 0], [0.13, 0.11, 0.28]);
    part(a.g, "cone", "std", W, [0, 0.005, -0.17], [0.09, 0.12, 0.03], [-Math.PI / 2, 0, 0]); // tail
    a.neck = pivot(a.g, [0, 0.025, 0.12]);
    part(a.neck, "cyl", "std", W, [0, 0, 0.06], [0.04, 0.13, 0.04], [Math.PI / 2, 0, 0]);
    part(a.neck, "sphere", "std", W, [0, 0.01, 0.13], [0.075, 0.07, 0.08]);
    part(a.neck, "sphere", "std", K, [0, 0.008, 0.155], [0.06, 0.055, 0.06]); // black face
    part(a.neck, "box", "std", K, [0, 0.0, 0.23], [0.018, 0.014, 0.14]); // bill
    part(a.neck, "sphere", "std", K, [0, 0.0, 0.305], [0.05, 0.014, 0.05]); // spoon tip
    part(a.neck, "cone", "std", 0xf1e2b8, [0, 0.045, 0.115], [0.03, 0.05, 0.03], [-0.9, 0, 0]); // small crest
    a.wings = [];
    for (const s of [1, -1]) {
      const w = pivot(a.g, [s * 0.05, 0.035, 0.02]);
      part(w, "box", "std", W, [s * 0.1, 0, 0], [0.2, 0.016, 0.16]);
      part(w, "box", "std", W, [s * 0.26, 0, -0.025], [0.15, 0.013, 0.11], [0, s * 0.18, 0]);
      part(w, "box", "std", 0xe6e6de, [s * 0.36, 0, -0.05], [0.07, 0.011, 0.075], [0, s * 0.3, 0]);
      w.userData.s = s;
      a.wings.push(w);
    }
    a.legs = [];
    for (const s of [1, -1]) {
      const l = pivot(a.g, [s * 0.025, -0.04, -0.02]);
      part(l, "cyl", "std", K, [0, -0.085, 0], [0.012, 0.17, 0.012]);
      a.legs.push(l);
    }
    return a;
  }
  function buildMagpie() {
    const a = agent("magpie");
    const B = 0x1d5cc8,
      K = 0x121418,
      RED = 0xd8262c;
    a.shadow = part(root, "blob", "shadow", 0xffffff, [0, 0, 0], [0, 1, 0]);
    part(a.g, "sphere", "std", B, [0, 0, 0], [0.085, 0.08, 0.17]);
    part(a.g, "sphere", "std", 0xc9d4e6, [0, -0.02, 0.01], [0.06, 0.05, 0.11]); // pale belly
    part(a.g, "sphere", "std", K, [0, 0.035, 0.085], [0.07, 0.07, 0.075]); // black head & neck
    part(a.g, "cone", "std", RED, [0, 0.03, 0.14], [0.022, 0.05, 0.022], [Math.PI / 2, 0, 0]); // red bill
    part(a.g, "sphere", "glow", 0xfff3a8, [0.026, 0.045, 0.108], [0.012, 0.012, 0.012]); // yellow eye
    part(a.g, "sphere", "glow", 0xfff3a8, [-0.026, 0.045, 0.108], [0.012, 0.012, 0.012]);
    // 2026-11-15: the long tail is a tapered central pair plus two side feathers on their own pivots, so it fans out
    // in flight and trails the body with a little lag (it read as a rigid rocket exhaust before)
    a.g.rotation.order = "YXZ";
    a.tail = pivot(a.g, [0, 0.01, -0.07]);
    part(a.tail, "sphere", "std", B, [0, 0, -0.16], [0.042, 0.012, 0.34]);
    part(a.tail, "box", "std", K, [0, 0.001, -0.32], [0.04, 0.011, 0.028]);
    part(a.tail, "sphere", "std", 0xffffff, [0, 0.001, -0.35], [0.046, 0.012, 0.05]); // white tip
    a.tailSides = [];
    for (const s of [1, -1]) {
      const f = pivot(a.tail, [s * 0.012, -0.003, -0.01]);
      part(f, "sphere", "std", B, [0, 0, -0.1], [0.028, 0.009, 0.2]);
      part(f, "sphere", "std", 0xffffff, [0, 0.001, -0.2], [0.03, 0.01, 0.03]);
      f.userData.s = s;
      a.tailSides.push(f);
    }
    // two-segment rounded wings (inner arm + outer hand with the white patch); the hand lags the arm when flapping
    a.wings = [];
    for (const s of [1, -1]) {
      const w = pivot(a.g, [s * 0.035, 0.03, 0.01]);
      part(w, "sphere", "std", B, [s * 0.058, 0, -0.005], [0.12, 0.014, 0.1]);
      const o = pivot(w, [s * 0.112, 0, -0.006]);
      part(o, "sphere", "std", B, [s * 0.06, 0, -0.012], [0.13, 0.012, 0.085]);
      part(o, "sphere", "std", 0xffffff, [s * 0.075, 0.003, -0.02], [0.05, 0.01, 0.045]); // white wing patch
      part(o, "sphere", "std", K, [s * 0.11, 0.001, -0.02], [0.04, 0.011, 0.05]); // dark primaries
      w.userData.s = s;
      w.userData.outer = o;
      a.wings.push(w);
    }
    a.legs = [];
    for (const s of [1, -1]) {
      const l = pivot(a.g, [s * 0.02, -0.05, 0]);
      part(l, "cyl", "std", RED, [0, -0.025, 0], [0.01, 0.05, 0.01]);
      a.legs.push(l);
    }
    return a;
  }
  function buildDolphin() {
    const a = agent("dolphin");
    const P = 0xf6cfc8,
      PK = 0xf0aaa4;
    a.body = pivot(a.g);
    part(a.body, "sphere", "std", P, [0, 0, 0], [0.16, 0.15, 0.6]);
    part(a.body, "sphere", "std", P, [0, 0.055, -0.02], [0.11, 0.09, 0.22]); // hump
    part(a.body, "cone", "std", PK, [0, 0.13, -0.05], [0.03, 0.12, 0.1], [-0.35, 0, 0]); // dorsal fin
    part(a.body, "sphere", "std", P, [0, 0.01, 0.27], [0.12, 0.11, 0.14]); // melon
    part(a.body, "cone", "std", PK, [0, -0.005, 0.38], [0.05, 0.14, 0.05], [Math.PI / 2, 0, 0]); // long beak
    part(a.body, "sphere", "std", 0x8f9aa3, [0.05, 0.03, -0.12], [0.03, 0.03, 0.04]); // speckles
    part(a.body, "sphere", "std", 0x8f9aa3, [-0.04, 0.05, 0.08], [0.025, 0.025, 0.03]);
    part(a.body, "sphere", "glow", 0x1b1b1d, [0.05, 0.02, 0.29], [0.014, 0.014, 0.014]);
    part(a.body, "sphere", "glow", 0x1b1b1d, [-0.05, 0.02, 0.29], [0.014, 0.014, 0.014]);
    for (const s of [1, -1]) part(a.body, "box", "std", PK, [s * 0.09, -0.04, 0.12], [0.12, 0.012, 0.05], [0, -s * 0.5, -s * 0.4]);
    a.tail = pivot(a.body, [0, 0, -0.26]);
    part(a.tail, "sphere", "std", P, [0, 0, -0.06], [0.07, 0.07, 0.16]);
    part(a.tail, "box", "std", PK, [0, 0, -0.15], [0.24, 0.014, 0.07]);
    return a;
  }
  function buildTurtle() {
    const a = agent("turtle");
    part(a.g, "sphere", "std", 0x55652c, [0, 0, 0], [0.32, 0.12, 0.38]);
    part(a.g, "sphere", "std", 0x8a8f45, [0, 0.03, 0], [0.22, 0.09, 0.27]);
    part(a.g, "sphere", "std", 0x6e7a34, [0, 0.055, 0.02], [0.1, 0.05, 0.12]);
    part(a.g, "cyl", "std", 0xe8d79a, [0, -0.025, 0], [0.3, 0.02, 0.34]); // plastron rim
    a.head = pivot(a.g, [0, 0.0, 0.19]);
    part(a.head, "sphere", "std", 0x9ba86a, [0, 0, 0.05], [0.09, 0.07, 0.11]);
    part(a.head, "sphere", "glow", 0x1b1b1d, [0.03, 0.015, 0.08], [0.012, 0.012, 0.012]);
    part(a.head, "sphere", "glow", 0x1b1b1d, [-0.03, 0.015, 0.08], [0.012, 0.012, 0.012]);
    a.flips = [];
    for (const [s, zf, len] of [
      [1, 0.09, 0.22],
      [-1, 0.09, 0.22],
      [1, -0.13, 0.1],
      [-1, -0.13, 0.1],
    ]) {
      const f = pivot(a.g, [s * 0.13, -0.01, zf]);
      part(f, "box", "std", 0x9ba86a, [s * len * 0.5, 0, -len * 0.15], [len, 0.014, len * 0.38], [0, s * 0.35, 0]);
      f.userData = { s, front: zf > 0 };
      a.flips.push(f);
    }
    return a;
  }

  // ---------- placement ----------
  const pick = (pref) => pref.filter((id) => centers[id]);
  const robotIslands = pick(["innovation", "family", "sport", "luxury", "civil", "ai"]);
  const vacIslands = pick(["sport", "family", "innovation", "luxury"]);
  const service = [];
  for (let i = 0, tries = 0; service.length < N.service && robotIslands.length && tries < robotIslands.length * 2; i++, tries++) {
    const id = robotIslands[i % robotIslands.length];
    let path = null;
    for (let t = 0; t < 14 && !path; t++) {
      await yieldNow();
      const A = openSpot(id, 0.1, 0.72, 0.1, 12);
      if (!A) continue;
      const ang = R() * TAU,
        L = lerp(0.7, 1.3, R());
      const B = { x: A.x + Math.cos(ang) * L, z: A.z + Math.sin(ang) * L };
      if (segmentClear(id, A, B, 0.09)) path = { A, B: { ...B, y: groundOK(B.x, B.z) ?? A.y }, L };
    }
    if (!path) continue;
    const a = buildService(service.length);
    a.island = id;
    a.path = path;
    a.s = R() * path.L;
    a.dir = 1;
    a.wait = R() * 2;
    a.turn = 0;
    a.blinkAt = 1 + R() * 3;
    a.g.userData.island = id;
    service.push(a);
  }
  const vacuums = [];
  for (let i = 0; i < N.vacuum && vacIslands.length; i++) {
    const id = vacIslands[i % vacIslands.length];
    await yieldNow();
    const C = openSpot(id, 0.05, 0.7, 0.32, 30) || openSpot(id, 0.05, 0.7, 0.2, 30);
    if (!C) continue;
    const a = buildVacuum();
    a.island = id;
    a.c = C;
    a.x = C.x;
    a.z = C.z;
    a.y = C.y;
    a.yaw = R() * TAU;
    a.turnRate = 0;
    a.g.userData.island = id;
    vacuums.push(a);
  }

  // open-water loop for the dolphin pod
  let route = null;
  for (const [rx, rz] of [
    [12.5, 14],
    [11.5, 13],
    [13, 12.5],
  ]) {
    const pts = [];
    let ok = 0;
    for (let k = 0; k < 48; k++) {
      if (k % 6 === 0) await yieldNow();
      const t = (k / 48) * TAU,
        x = cx + Math.cos(t) * rx,
        z = cz + Math.sin(t) * rz;
      const v = inBounds(x, z, 21) && isWater(x, z, 1.4);
      pts.push({ x, z, v });
      if (v) ok++;
    }
    if (!route || ok > route.ok) route = { rx, rz, pts, ok };
    if (ok >= 36) break;
  }
  const routeLen = TAU * Math.sqrt((route.rx ** 2 + route.rz ** 2) / 2);
  const routeAt = (u) => {
    const t = (((u % 1) + 1) % 1) * TAU;
    return { x: cx + Math.cos(t) * route.rx, z: cz + Math.sin(t) * route.rz };
  };
  const routeValid = (u) => {
    const n = route.pts.length,
      k = Math.floor(((((u % 1) + 1) % 1) * n)) % n;
    return route.pts[k].v && route.pts[(k + 1) % n].v;
  };
  const dolphins = [];
  for (let i = 0; i < N.dolphin && route.ok > 8; i++) {
    const a = buildDolphin();
    a.lane = (i - (N.dolphin - 1) / 2) * 0.45;
    a.lag = i * 0.012 + (i % 2) * 0.004;
    a.period = 3.6 + i * 0.7;
    a.phase = R() * a.period;
    a.jumpN = i;
    a.prevY = WATER_Y - 0.3;
    dolphins.push(a);
  }

  // shore spots (water just outside an outer island): spoonbill wading flat & turtle patches
  const outer = ids
    .map((id) => ({ id, d: Math.hypot(centers[id].x - cx, centers[id].z - cz) }))
    .sort((p, q) => q.d - p.d)
    .map((p) => p.id);
  function shoreSpot(id, off, avoid = []) {
    const c = centers[id];
    const base = Math.atan2(c.z - cz, c.x - cx);
    for (let k = 0; k < 9; k++) {
      const a = base + ((k % 2 ? 1 : -1) * Math.ceil(k / 2) * Math.PI) / 9;
      const x = c.x + Math.cos(a) * (islandR(id) + off),
        z = c.z + Math.sin(a) * (islandR(id) + off);
      if (!inBounds(x, z, 19) || avoid.some((p) => Math.hypot(p.x - x, p.z - z) < 3)) continue;
      if (isWater(x, z, off * 0.55) && isWater(x + Math.cos(a) * 0.5, z + Math.sin(a) * 0.5, 0.2)) return { x, z, a };
    }
    return null;
  }
  let wade = null;
  for (const id of outer) {
    await yieldNow();
    if ((wade = shoreSpot(id, 0.75))) break;
  }
  const turtles = [];
  for (const id of outer) {
    if (turtles.length >= N.turtle) break;
    await yieldNow();
    const s = shoreSpot(id, 1.7, [...turtles.map((t) => t.c), ...(wade ? [wade] : [])]);
    // the paddling loop (≈0.7 wide) must stay clear of islets and piers too
    if (!s || ![0, 1, 2, 3].every((q) => isWater(s.x + Math.cos((q * TAU) / 4) * 0.8, s.z + Math.sin((q * TAU) / 4) * 0.6, 0.2))) continue;
    const a = buildTurtle();
    a.c = s;
    a.rad = 0.45 + R() * 0.25;
    a.speed = (0.05 + R() * 0.03) * (R() < 0.5 ? 1 : -1);
    a.t = R() * TAU;
    turtles.push(a);
  }

  // spoonbill flock
  const flock = { t: R() * 40, phase: "cruise", pt: 0, rx: 9.2, rz: 10.5, y: TOP + 2.75, speed: 1.0, nextLand: 22 + R() * 10 };
  const birds = [];
  for (let i = 0; i < N.spoonbill; i++) {
    const a = buildSpoonbill();
    const side = i === 0 ? 0 : i % 2 ? 1 : -1,
      rank = Math.ceil(i / 2);
    a.off = { x: side * rank * 0.38, y: rank * 0.035 + (R() - 0.5) * 0.06, z: -rank * 0.42 };
    a.wob = R() * TAU;
    a.flapPh = R() * TAU;
    a.yaw = 0;
    a.wadeOff = { x: (R() - 0.5) * 1.1, z: (R() - 0.5) * 0.8 };
    a.sweep = R() * TAU;
    a.pos = new THREE.Vector3();
    birds.push(a);
  }
  const flockAt = (t, out) => {
    const u = (t * flock.speed) / (TAU * Math.sqrt((flock.rx ** 2 + flock.rz ** 2) / 2));
    const ang = -u * TAU; // counter-clockwise when seen from above
    out.x = cx + Math.cos(ang) * flock.rx;
    out.z = cz + 1 + Math.sin(ang) * flock.rz;
    out.y = flock.y + Math.sin(t * 0.21) * 0.25;
    out.hx = -Math.sin(ang) * -flock.rx;
    out.hz = Math.cos(ang) * -flock.rz;
    return out;
  };
  if (wade) {
    // keep each wading bird in water
    for (const b of birds) {
      for (let k = 0; k < 6; k++) {
        const x = wade.x + b.wadeOff.x,
          z = wade.z + b.wadeOff.z;
        if (isWater(x, z, 0.15)) break;
        b.wadeOff.x *= 0.6;
        b.wadeOff.z *= 0.6;
        b.wadeOff.x += Math.cos(wade.a) * 0.15;
        b.wadeOff.z += Math.sin(wade.a) * 0.15;
      }
    }
  }

  // magpie perches on open ground across the islands
  const perches = [];
  for (const id of ids) {
    if (perches.length >= 12) break;
    await yieldNow();
    const s = openSpot(id, 0.55, 0.85, 0.16, 8);
    if (s) perches.push(s);
  }
  const magpies = [];
  for (let i = 0; i < N.magpie && perches.length >= 3; i++) {
    const a = buildMagpie();
    a.at = perches[(i * 5) % perches.length];
    a.to = null;
    a.wait = 1 + R() * 4;
    a.fly = 0;
    a.yaw = R() * TAU;
    a.hop = 0;
    a.flapPh = 0;
    a.foldK = 1;
    magpies.push(a);
  }

  // splash / ripple pool
  const rings = [];
  for (let i = 0; i < 14; i++) {
    owner = { g: { userData: { label: { zh: "水花", en: "Splash" } } } };
    rings.push({ n: part(root, "ring", "foam", 0xffffff, [0, -50, 0], [0, 0, 0]), age: 2, size: 0.4 });
  }
  let ringIx = 0;
  function splash(x, z, size) {
    const r = rings[ringIx++ % rings.length];
    r.n.position.set(x, WATER_Y + 0.01, z);
    r.age = 0;
    r.size = size;
  }

  // ---------- instanced meshes ----------
  const groups = new Map();
  for (const p of parts) {
    if (!groups.has(p.key)) groups.set(p.key, []);
    groups.get(p.key).push(p);
  }
  const meshes = [];
  const col = new THREE.Color();
  for (const [key, list] of groups) {
    const [g, m] = key.split("|");
    const im = new THREE.InstancedMesh(GEO[g], MAT[m], list.length);
    im.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    im.frustumCulled = false;
    im.name = "fauna-robots:" + key;
    im.userData.labels = [];
    list.forEach((p, i) => {
      p.mesh = im;
      p.ix = i;
      im.setColorAt(i, col.setHex(p.color));
      im.userData.labels[i] = p.owner?.g?.userData?.label || null;
    });
    if (m === "shadow") im.renderOrder = 1;
    if (m === "foam") im.renderOrder = 2;
    meshes.push(im);
  }
  const holder = new THREE.Group();
  holder.name = "fauna-robots";
  holder.userData.label = { zh: "旅館科技機器人與臺灣動物", en: "Hotel-tech robots & Taiwan wildlife" };
  for (const im of meshes) holder.add(im);
  scene.add(holder);
  function flush() {
    root.updateMatrixWorld(true);
    for (const p of parts) p.mesh.setMatrixAt(p.ix, p.node.matrixWorld);
    for (const im of meshes) im.instanceMatrix.needsUpdate = true;
  }

  // ---------- animation ----------
  const freezeBtn = document.querySelector('[data-toggle="freeze"]');
  let last = 0,
    T = 0;
  const tmp = {},
    tmp2 = {};
  function zoomK() {
    const d = camera.position.distanceTo(controls.target);
    return clamp(d / 20, 1, 1.45);
  }
  // animals: smaller than the figures when the camera is close, exaggerated from the map overview so they still read
  function zoomA() {
    const d = camera.position.distanceTo(controls.target);
    return clamp(d / 16, 0.72, 1.7);
  }
  function setShadow(s, x, y, z, r) {
    s.position.set(x, y + 0.004, z);
    s.scale.set(r, 1, r);
  }

  function updService(a, dt, zk) {
    const { A, B, L } = a.path;
    if (a.wait > 0) {
      a.wait -= dt;
      a.head.rotation.y = Math.sin(T * 1.3 + a.s) * 0.5 * Math.min(1, a.wait);
    } else if (a.turn > 0) {
      a.turn -= dt;
    } else {
      a.s += a.dir * dt * 0.13;
      a.head.rotation.y *= 0.9;
      if (a.s > L || a.s < 0) {
        a.s = clamp(a.s, 0, L);
        a.dir *= -1;
        a.wait = 1.5 + R() * 2.5;
        a.turn = 0.9;
      }
    }
    const t = a.s / L;
    const x = lerp(A.x, B.x, t),
      z = lerp(A.z, B.z, t),
      y = lerp(A.y, B.y, t);
    const yaw = Math.atan2((B.x - A.x) * a.dir, (B.z - A.z) * a.dir);
    a.g.rotation.y = a.turn > 0 ? angLerp(a.g.rotation.y, yaw, Math.min(1, dt * 5)) : angLerp(a.g.rotation.y, yaw, Math.min(1, dt * 8));
    const moving = a.wait <= 0 && a.turn <= 0;
    a.g.position.set(x, y, z);
    a.g.scale.setScalar(zk * 1.05);
    a.body.position.y = moving ? Math.abs(Math.sin(T * 9 + a.s * 20)) * 0.004 : 0;
    a.body.rotation.x = moving ? 0.04 : 0;
    a.blinkAt -= dt;
    const blink = a.blinkAt < 0 && a.blinkAt > -0.14;
    if (a.blinkAt < -0.14) a.blinkAt = 1.6 + R() * 3.5;
    for (const e of a.eyes) e.scale.y = blink ? 0.004 : 0.028;
    const pulse = 0.024 + 0.008 * (0.5 + 0.5 * Math.sin(T * (moving ? 6 : 2.5)));
    a.lamp.scale.setScalar(pulse);
    setShadow(a.shadow, x, y, z, 0.2 * zk);
  }
  function updVacuum(a, dt, zk) {
    const sp = 0.09;
    a.turnRate += (R() - 0.5) * dt * 4;
    a.turnRate = clamp(a.turnRate * 0.98, -1.2, 1.2);
    let yaw = a.yaw + a.turnRate * dt;
    const nx = a.x + Math.sin(yaw) * sp * dt * 4,
      nz = a.z + Math.cos(yaw) * sp * dt * 4;
    const far = Math.hypot(nx - a.c.x, nz - a.c.z) > 0.38;
    if (far || blocked(a.island, nx, nz, 0.07) || !insideIsland(a.island, nx, nz, 0.88)) {
      // bump: gently steer back toward home
      const home = Math.atan2(a.c.x - a.x, a.c.z - a.z);
      yaw = angLerp(yaw, home, Math.min(1, dt * 3));
      a.turnRate = 0.9 * Math.sign(a.turnRate || 1);
    } else {
      a.x += Math.sin(yaw) * sp * dt;
      a.z += Math.cos(yaw) * sp * dt;
    }
    a.yaw = yaw;
    a.g.position.set(a.x, a.y, a.z);
    a.g.rotation.y = yaw;
    a.g.scale.setScalar(zk * 1.05);
    a.brush.rotation.y -= dt * 14;
    a.led.scale.setScalar(Math.sin(T * 3) > 0 ? 0.013 : 0.008);
    setShadow(a.shadow, a.x, a.y, a.z, 0.17 * zk);
  }

  function birdPose(a, flying, dt, flapAmp, flapHz) {
    // wings: spread & flap while flying, folded back on the body when standing
    const fold = a.foldK ?? (flying ? 0 : 1);
    const k = flying ? Math.max(0, fold - dt * 2.5) : Math.min(1, fold + dt * 2.5);
    a.foldK = k;
    a.flapPh += dt * flapHz * TAU;
    const flap = Math.sin(a.flapPh) * flapAmp * (1 - k);
    for (const w of a.wings) {
      const s = w.userData.s;
      w.rotation.set(0, s * 1.45 * k, s * (flap + 0.12 * k));
      w.scale.set(1 - 0.55 * k, 1, 1);
    }
    for (const l of a.legs) l.rotation.x = lerp(1.45, 0, k);
    return k;
  }

  function updFlock(dt, zk) {
    flock.t += dt;
    flock.pt += dt;
    if (flock.phase === "cruise" && wade && flock.pt > flock.nextLand) (flock.phase = "descend"), (flock.pt = 0);
    else if (flock.phase === "descend" && flock.pt > 8) (flock.phase = "wade"), (flock.pt = 0);
    else if (flock.phase === "wade" && flock.pt > 18) (flock.phase = "ascend"), (flock.pt = 0);
    else if (flock.phase === "ascend" && flock.pt > 8) (flock.phase = "cruise"), (flock.pt = 0), (flock.nextLand = 35 + R() * 25);
    let w = 0; // 0 = in the V, 1 = wading
    if (flock.phase === "descend") w = smooth(clamp(flock.pt / 8, 0, 1));
    else if (flock.phase === "wade") w = 1;
    else if (flock.phase === "ascend") w = 1 - smooth(clamp(flock.pt / 8, 0, 1));
    const L = flockAt(flock.t, tmp);
    const hl = Math.hypot(L.hx, L.hz) || 1;
    const fx = L.hx / hl,
      fz = L.hz / hl; // forward
    const rx = fz,
      rz = -fx; // right
    const s = zoomA();
    birds.forEach((b, i) => {
      const wob = Math.sin(T * 0.7 + b.wob) * 0.06;
      const vx = L.x + rx * (b.off.x + wob) + fx * b.off.z,
        vz = L.z + rz * (b.off.x + wob) + fz * b.off.z,
        vy = L.y + b.off.y + Math.sin(T * 0.9 + b.wob) * 0.04;
      let x = vx,
        y = vy,
        z = vz;
      if (wade && w > 0) {
        const wx = wade.x + b.wadeOff.x,
          wz = wade.z + b.wadeOff.z,
          wy = WATER_Y + 0.15 * s;
        const e = w;
        x = lerp(vx, wx, e);
        z = lerp(vz, wz, e);
        y = lerp(vy, wy, Math.pow(e, 0.7)) + Math.sin(e * Math.PI) * 0.35;
      }
      const px = b.pos.x,
        pz = b.pos.z,
        py = b.pos.y;
      b.pos.set(x, y, z);
      const standing = w > 0.985;
      const dx = x - px,
        dz = z - pz,
        dy = y - py;
      const hs = Math.hypot(dx, dz);
      if (!standing && hs > 1e-5) b.yaw = angLerp(b.yaw, Math.atan2(dx, dz), Math.min(1, dt * 4));
      else if (standing) b.yaw = angLerp(b.yaw, wade.a + Math.PI * 0.5 + b.wob, dt * 0.4);
      const k = birdPose(b, !standing && w < 0.93, dt, 0.5, (i + T * 0.5) % 9 < 5 ? 2.1 : 0.4);
      b.g.position.set(x, y, z);
      b.g.rotation.set(standing ? 0 : clamp(-Math.atan2(dy, hs + 1e-4), -0.5, 0.5) * 0.6, b.yaw, 0);
      b.g.scale.setScalar(s);
      // flight: neck straight forward; wading: neck down, bill sweeping side to side in the shallows
      b.neck.rotation.set(lerp(0, 0.95, k), k * Math.sin(T * 1.6 + b.sweep) * 0.6, 0);
      if (standing && Math.sin(T * 1.6 + b.sweep) > 0.995 && R() < 0.2) splash(x + Math.sin(b.yaw) * 0.25 * s, z + Math.cos(b.yaw) * 0.25 * s, 0.25);
      setShadow(b.shadow, x, WATER_Y, z, standing ? 0.2 * s : 0);
    });
  }

  // magpie wing / tail / leg pose. Flap: fast downstroke (40% of the beat), slower upstroke; the outer hand lags the
  // arm so the wing bends. Glide: wings spread with a slight dihedral. Flare: wings high and wide, legs forward.
  function magpiePose(a, mode, dt) {
    const flying = mode === "flap" || mode === "glide" || mode === "flare";
    const k = flying ? Math.max(0, (a.foldK ?? 1) - dt * 4) : Math.min(1, (a.foldK ?? 1) + dt * 4); // 1 = folded
    a.foldK = k;
    if (mode === "flap") a.flapPh = (a.flapPh + dt * 6.5) % 1;
    const beat = (ph) => {
      ph = ((ph % 1) + 1) % 1;
      return ph < 0.4 ? lerp(0.85, -0.65, smooth(ph / 0.4)) : lerp(-0.65, 0.85, smooth((ph - 0.4) / 0.6));
    };
    let inner = 0.1,
      outer = -0.04;
    if (mode === "flap") (inner = beat(a.flapPh)), (outer = beat(a.flapPh - 0.12) * 1.15 - inner);
    else if (mode === "flare") (inner = 0.55), (outer = 0.2);
    else if (mode === "crouch") (inner = 0.3), (outer = 0);
    for (const w of a.wings) {
      const sd = w.userData.s;
      w.rotation.set(0, sd * 1.45 * k, sd * lerp(inner, 0.12, k));
      w.userData.outer.rotation.set(0, sd * 2.2 * k, sd * lerp(outer, -0.1, k));
      w.scale.set(1 - 0.45 * k, 1, 1);
    }
    const fan = mode === "flare" ? 0.38 : flying ? 0.16 : 0.04;
    for (const f of a.tailSides) f.rotation.y = lerp(f.rotation.y, f.userData.s * fan, Math.min(1, dt * 8));
    for (const l of a.legs) l.rotation.x = mode === "flare" ? -0.5 : lerp(1.45, 0, k);
  }

  function updMagpie(a, dt, zk) {
    const s = zoomA() * 1.05;
    if (!a.to) {
      a.wait -= dt;
      a.hop = Math.max(0, a.hop - dt * 3);
      if (R() < dt * 0.8 && a.hop === 0) a.hop = 1;
      const hopY = Math.sin(a.hop * Math.PI) * 0.03;
      magpiePose(a, "perch", dt);
      a.tail.rotation.x = -0.25 + Math.sin(T * 5) * 0.08;
      if (a.hop > 0) a.yaw += dt * 1.5 * Math.sin(a.wait * 3);
      a.g.position.set(a.at.x, a.at.y + 0.055 * s + hopY, a.at.z);
      a.g.rotation.set(-0.15, a.yaw, 0);
      setShadow(a.shadow, a.at.x, a.at.y, a.at.z, 0.12 * s);
      if (a.wait <= 0) {
        const cand = perches.filter((p) => p !== a.at && Math.hypot(p.x - a.at.x, p.z - a.at.z) < 9 && !magpies.some((m) => m !== a && (m.at === p || m.to === p)));
        a.to = cand.length ? cand[Math.floor(R() * cand.length)] : perches[Math.floor(R() * perches.length)];
        if (a.to === a.at) a.to = null, (a.wait = 2);
        else (a.fly = 0), (a.dist = Math.hypot(a.to.x - a.at.x, a.to.z - a.at.z));
      }
    } else {
      // 2026-11-15 natural flight (was a near-vertical launch along a straight line): crouch → 30° take-off along a
      // low curved path, flap-and-glide undulation, pitch from the real climb rate, banking into the curve, a flare
      // with the tail fanned before landing
      if (a.fly === 0) {
        const side = R() < 0.5 ? -1 : 1;
        const dx = a.to.x - a.at.x,
          dz = a.to.z - a.at.z;
        a.ctl = { x: (a.at.x + a.to.x) / 2 - (dz / (a.dist || 1)) * side * a.dist * 0.22, z: (a.at.z + a.to.z) / 2 + (dx / (a.dist || 1)) * side * a.dist * 0.22 };
        a.crouch = 0.16;
        a.prevY = a.at.y + 0.055 * s;
        a.prevYaw = a.yaw;
        a.tailPitch = 0;
      }
      if (a.crouch > 0) {
        a.crouch -= dt;
        magpiePose(a, "crouch", dt);
        a.g.position.set(a.at.x, a.at.y + 0.04 * s, a.at.z);
        a.g.rotation.set(0.25, a.yaw, 0);
        a.g.scale.setScalar(s);
        a.fly = 1e-6;
        return;
      }
      const dur = 1.0 + a.dist / 1.6;
      a.fly += dt / dur;
      const u = Math.min(1, a.fly);
      const e = u * u * (3 - 2 * u); // ease in-out
      const q = 1 - e;
      const x = q * q * a.at.x + 2 * q * e * a.ctl.x + e * e * a.to.x,
        z = q * q * a.at.z + 2 * q * e * a.ctl.z + e * e * a.to.z;
      // tangent of the curve for heading and banking
      const tx = 2 * q * (a.ctl.x - a.at.x) + 2 * e * (a.to.x - a.ctl.x),
        tz = 2 * q * (a.ctl.z - a.at.z) + 2 * e * (a.to.z - a.ctl.z);
      const peak = 0.6 + a.dist * 0.06;
      const glide = !reducedNow() && Math.floor(a.fly * dur * 1.6) % 2 === 1 && u > 0.18 && u < 0.82;
      const y = lerp(a.at.y, a.to.y, e) + 0.055 * s + peak * Math.sin(e * Math.PI) - (glide ? 0.03 : 0) + (glide ? 0 : Math.sin(a.flapPh * TAU) * 0.012);
      const yaw = Math.atan2(tx, tz);
      const yawRate = ((yaw - a.prevYaw + Math.PI * 3) % TAU) - Math.PI;
      a.prevYaw = yaw;
      a.yaw = angLerp(a.yaw, yaw, Math.min(1, dt * 10));
      const vy = (y - a.prevY) / Math.max(dt, 1e-3);
      a.prevY = y;
      const pitch = Math.max(-0.26, Math.min(0.26, -vy * 0.18));
      const roll = Math.max(-0.5, Math.min(0.5, (-yawRate / Math.max(dt, 1e-3)) * 0.12));
      magpiePose(a, u > 0.86 ? "flare" : glide || reducedNow() ? "glide" : "flap", dt);
      // tail trails the body's pitch with a damped lag, and fans out when landing
      a.tailPitch = lerp(a.tailPitch || 0, -pitch * 0.8 + (u > 0.86 ? -0.35 : 0.05), Math.min(1, dt * 6));
      a.tail.rotation.x = a.tailPitch;
      a.g.position.set(x, y, z);
      a.g.rotation.set(pitch + (u > 0.86 ? -0.2 : 0), a.yaw, roll);
      setShadow(a.shadow, x, lerp(a.at.y, a.to.y, e), z, 0);
      if (u >= 1) (a.at = a.to), (a.to = null), (a.wait = 2.5 + R() * 5);
    }
    a.g.scale.setScalar(s);
  }

  let podU = R();
  function updDolphins(dt, zk) {
    podU += (dt * 0.75) / routeLen;
    const s = zoomA() * 1.05;
    for (const a of dolphins) {
      const u = podU - a.lag;
      const p = routeAt(u),
        q = routeAt(u + 0.002);
      const tx = q.x - p.x,
        tz = q.z - p.z,
        tl = Math.hypot(tx, tz) || 1;
      const x = p.x + (tz / tl) * a.lane,
        z = p.z - (tx / tl) * a.lane;
      a.phase += dt;
      const cyc = a.phase % a.period;
      const air = 1.25 + (a.jumpN % 3 === 2 ? 0.35 : 0);
      let y = WATER_Y - 0.5,
        vis = false,
        pitch = 0;
      if (cyc < air && routeValid(u)) {
        const v = cyc / air;
        const A = a.jumpN % 3 === 2 ? 0.55 : 0.24;
        y = WATER_Y - 0.1 + A * Math.sin(v * Math.PI);
        pitch = -Math.atan2(A * Math.PI * Math.cos(v * Math.PI), air * 0.75) * 0.9;
        vis = true;
        if (!a.inAir) splash(x, z, 0.5);
        a.inAir = true;
      } else {
        if (a.inAir) {
          splash(x + (tx / tl) * 0.3, z + (tz / tl) * 0.3, a.jumpN % 3 === 2 ? 0.9 : 0.55);
          a.jumpN++;
        }
        a.inAir = false;
      }
      a.g.position.set(x, y, z);
      a.g.rotation.set(pitch, Math.atan2(tx, tz), Math.sin(T + a.lane) * 0.1);
      a.g.scale.setScalar(vis ? s : 0);
      a.tail.rotation.x = Math.sin(T * 7 + a.lane) * 0.25;
    }
  }
  function updTurtles(dt, zk) {
    for (const a of turtles) {
      a.t += a.speed * dt;
      const x = a.c.x + Math.cos(a.t) * a.rad,
        z = a.c.z + Math.sin(a.t) * a.rad * 0.7;
      const dx = -Math.sin(a.t) * a.rad * Math.sign(a.speed),
        dz = Math.cos(a.t) * a.rad * 0.7 * Math.sign(a.speed);
      a.g.position.set(x, WATER_Y - 0.012 + Math.sin(T * 0.8 + a.rad * 9) * 0.008, z);
      a.g.rotation.set(0, Math.atan2(dx, dz), Math.sin(T * 0.9) * 0.05);
      a.g.scale.setScalar(zoomA() * 1.3);
      const stroke = Math.sin(T * 1.6 + a.rad);
      for (const f of a.flips) {
        const sgn = f.userData.s;
        f.rotation.set(0, (f.userData.front ? stroke * 0.55 : -stroke * 0.3) * sgn, sgn * (f.userData.front ? 0.15 + Math.max(0, stroke) * 0.35 : 0.05));
      }
      a.head.rotation.x = Math.sin(T * 0.35 + a.rad * 3) > 0.85 ? -0.35 : 0.05;
      if (Math.sin(T * 0.35 + a.rad * 3) > 0.995 && R() < 0.1) splash(x, z, 0.35);
    }
  }
  function updRings(dt) {
    for (const r of rings) {
      if (r.age > 1) {
        r.n.scale.set(0, 0, 0);
        continue;
      }
      r.age += dt * 0.9;
      const k = smooth(Math.min(1, r.age));
      const sc = r.size * (0.25 + k);
      r.n.scale.set(sc, 1, sc);
      r.n.position.y = WATER_Y + 0.012 - (r.age > 0.75 ? (r.age - 0.75) * 0.08 : 0);
      if (r.age > 1) r.n.scale.set(0, 0, 0);
    }
  }

  function step(dt) {
    T += dt;
    const zk = zoomK();
    for (const a of service) updService(a, dt, zk);
    for (const a of vacuums) updVacuum(a, dt, zk);
    updFlock(dt, zk);
    for (const a of magpies) updMagpie(a, dt, zk);
    updDolphins(dt, zk);
    updTurtles(dt, zk);
    updRings(dt);
    flush();
  }
  // initial pose (also the still frame shown with reduced motion): a dolphin mid-arc so the pod is visible
  for (const b of birds) b.pos.set(0, 0, 0);
  step(0.016);
  for (let i = 0; i < 3; i++) updFlock(0.016, zoomK()); // settle bird headings
  dolphins.forEach((a, i) => (a.phase = i === 0 ? 0.6 : a.phase));
  step(0.001);
  for (const b of birds) b.foldK = 0;
  flush();

  let needFirst = true,
    lastZk = zoomK() + zoomA();
  city.onFrame((now) => {
    if (document.hidden) {
      last = now;
      return false;
    }
    const dt = last ? Math.min(0.08, (now - last) / 1000) : 0.016;
    last = now;
    const frozen = freezeBtn && freezeBtn.getAttribute("aria-pressed") === "true";
    if (reducedNow() || frozen) {
      // no motion: only keep the zoom-dependent size in step with the camera
      const zk = zoomK() + zoomA();
      if (needFirst || Math.abs(zk - lastZk) > 0.01) {
        lastZk = zk;
        needFirst = false;
        step(0);
        return true;
      }
      return false;
    }
    needFirst = false;
    step(dt);
    return true;
  });

  window.heartFauna = {
    group: holder,
    meshes,
    agents: agents.map((a) => ({ kind: a.kind, label: a.g.userData.label, island: a.island || null, object: a.g })),
    initMs: Math.round(performance.now() - tInit),
    rays,
    rayMs: Math.round(rayMs),
    counts: { service: service.length, vacuum: vacuums.length, spoonbill: birds.length, magpie: magpies.length, dolphin: dolphins.length, turtle: turtles.length },
    debug: {
      // QA: make magpie i take off now (its next perch is chosen as usual); returns its 3D object
      flyMagpie(i = 0) {
        const m = magpies[i];
        if (!m) return null;
        if (!m.to) m.wait = 0;
        return m.g;
      },
      land() {
        if (wade) (flock.phase = "wade"), (flock.pt = 0);
      },
    },
    sites: { wade, dolphinRoute: { rx: route.rx, rz: route.rz, waterSamples: route.ok }, turtles: turtles.map((t) => t.c), perches: perches.length },
  };
}

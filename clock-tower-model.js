// 朝陽鐘樓（精誠勤樸鐘樓）擬真模型（2026-11-15）：取代原本用 kit 方塊拼成的塔身。
// 尺寸沿用舊模型，因為 clock-tower.js 的鐘擺掛在 top + 2.615、鐘面指針與校訓牌匾貼在塔身四面 ±0.248 處（app.js）。
// 磚紋與石材用 Canvas 貼圖、世界座標投影 UV（同 kaohsiung-skyline.js 的 brick 桶）；拱圈、柱子用真正的環與旋轉體。
// 這裡只有造型與材質，沒有任何文字或數字資料。
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

export function createClockTowerModel(THREE, { quality = "high" } = {}) {
  const hi = quality !== "low";
  const seg = (n) => Math.max(6, Math.round(n * (hi ? 1 : 0.6)));
  const MATS = {
    brick: { roughness: 0.86, metalness: 0.0, env: 0.9, tex: "brick", k: 6.2 },
    stone: { roughness: 0.6, metalness: 0.0, env: 1.1, tex: "stone", k: 2.4 },
    column: { roughness: 0.36, metalness: 0.0, env: 1.4 },
    slate: { roughness: 0.48, metalness: 0.12, env: 1.4 },
    bronze: { roughness: 0.42, metalness: 0.85, env: 2.2 },
    gold: { roughness: 0.26, metalness: 0.95, env: 2.8 },
    shade: { roughness: 0.9, metalness: 0.0, env: 0.5 },
  };
  const C = {
    brick: 0xe48a6b,
    brickLt: 0xf0a88c,
    stone: 0xf1ede4,
    stoneD: 0xdcd6ca,
    white: 0xfcfbf7,
    belfry: 0x8f8e87,
    belfryD: 0x74736d,
    teal: 0x1f7488,
    tealD: 0x165c6c,
    bronze: 0x3b322a,
    gold: 0xf0c452,
    step: 0x2c2f35,
    stepMid: 0x454a54,
    inner: 0xc8b9a8,
  };
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
    cyl: new THREE.CylinderGeometry(0.5, 0.5, 1, seg(28)),
    sphere: new THREE.SphereGeometry(0.5, seg(24), seg(16)),
    pyramid: new THREE.ConeGeometry(0.5, 1, 4).rotateY(Math.PI / 4).scale(Math.SQRT2, 1, Math.SQRT2),
    arch: new THREE.TorusGeometry(0.5, 0.08, seg(10), seg(48), Math.PI), // upper half ring in the XY plane
  };
  function bake(bucket, g, color) {
    g = g.index ? g.toNonIndexed() : g;
    for (const k of Object.keys(g.attributes)) if (k !== "position" && k !== "normal") g.deleteAttribute(k);
    const pos = g.attributes.position,
      nrm = g.attributes.normal,
      n = pos.count,
      col = new Float32Array(n * 3);
    _c.set(color);
    for (let i = 0; i < n; i++) col.set([_c.r, _c.g, _c.b], i * 3);
    g.setAttribute("color", new THREE.BufferAttribute(col, 3));
    const spec = MATS[bucket];
    if (spec.tex) {
      // world-projected UVs so brick courses stay one size on every face
      const k = spec.k,
        uv = new Float32Array(n * 2);
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
  const block = (b, c, x, y, z, w, h, d, ry = 0) => add(b, G.box, c, x, y + h / 2, z, w, h, d, 0, ry, 0);
  function lathe(bucket, color, profile, x, y, z, ry = 0) {
    const g = new THREE.LatheGeometry(profile.map(([r, h]) => new THREE.Vector2(Math.max(0.0005, r), h)), seg(28));
    g.computeVertexNormals();
    add(bucket, g, color, x, y, z, 1, 1, 1, 0, ry, 0);
  }
  // ---------- textures ----------
  const canvasTex = (draw, size = 256) => {
    const cv = document.createElement("canvas");
    cv.width = cv.height = size;
    draw(cv.getContext("2d"), size);
    const t = new THREE.CanvasTexture(cv);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    return t;
  };
  const rnd = (seed) => {
    let s = seed;
    return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
  };
  const brickTex = () =>
    canvasTex((g, S) => {
      g.fillStyle = "#e9d9cf"; // mortar
      g.fillRect(0, 0, S, S);
      const rows = 8,
        cols = 4,
        bh = S / rows,
        bw = S / cols,
        r = rnd(7);
      for (let y = 0; y < rows; y++) {
        const off = y % 2 ? bw / 2 : 0;
        for (let x = -1; x <= cols; x++) {
          const v = r(),
            red = 222 + Math.round(v * 22) - 10,
            grn = 132 + Math.round(v * 26) - 12,
            blu = 104 + Math.round(v * 20) - 10;
          g.fillStyle = `rgb(${red},${grn},${blu})`;
          g.fillRect(x * bw + off + 2, y * bh + 2, bw - 4, bh - 4);
          // slight shading on the lower edge of each brick
          g.fillStyle = "rgba(90,40,30,0.12)";
          g.fillRect(x * bw + off + 2, y * bh + bh - 7, bw - 4, 4);
          g.fillStyle = "rgba(255,235,225,0.14)";
          g.fillRect(x * bw + off + 2, y * bh + 2, bw - 4, 3);
        }
      }
      // speckle
      g.fillStyle = "rgba(60,30,20,0.08)";
      for (let i = 0; i < 400; i++) g.fillRect(Math.floor(r() * S), Math.floor(r() * S), 2, 1);
    });
  const stoneTex = () =>
    canvasTex((g, S) => {
      g.fillStyle = "#efeae0";
      g.fillRect(0, 0, S, S);
      const r = rnd(11);
      for (let i = 0; i < 2600; i++) {
        const v = r();
        g.fillStyle = v > 0.5 ? "rgba(120,110,95,0.07)" : "rgba(255,255,250,0.12)";
        g.fillRect(Math.floor(r() * S), Math.floor(r() * S), 1 + Math.floor(r() * 3), 1);
      }
      g.strokeStyle = "rgba(120,110,95,0.18)";
      g.lineWidth = 1;
      for (let y = 0; y < S; y += S / 4) {
        g.beginPath();
        g.moveTo(0, y + 0.5);
        g.lineTo(S, y + 0.5);
        g.stroke();
      }
    }, 128);

  const nav = { obstacles: [] };
  let built = null;

  // ---------- the tower, centred on (x, z), ground at `top` ----------
  function build(x, z, top) {
    const T = top;
    const B = (b, c, px, py, pz, w, h, d, ry = 0) => block(b, c, x + px, T + py, z + pz, w, h, d, ry);
    const A = (b, kind, c, px, py, pz, sx, sy, sz, rx = 0, ry = 0, rz = 0) => add(b, G[kind], c, x + px, T + py, z + pz, sx, sy, sz, rx, ry, rz);
    const L = (b, c, prof, px, py, pz, ry = 0) => lathe(b, c, prof, x + px, T + py, z + pz, ry);

    // amphitheatre: three semicircular dark-slate steps facing the front (+z), each with a pale nosing line
    const half = new THREE.CylinderGeometry(0.5, 0.5, 1, seg(48), 1, false, -Math.PI / 2, Math.PI);
    for (const [r, y, h, c] of [
      [0.86, 0.026, 0.032, C.step],
      [0.74, 0.052, 0.032, C.stepMid],
      [0.62, 0.078, 0.03, 0xe2ddd2],
    ]) {
      add("shade", half, c, x, T + y + h / 2, z + 0.03, r * 2, h, r * 2);
      B("shade", c, 0, y, 0.03 - 0.0, r * 2, h, 0.02); // closes the straight edge
      add("stone", G.box, 0xf4f0e7, x, T + y + h - 0.004, z + 0.03 + r * 0.5, r * 2 * 0.02, 0.008, r * 0.98, 0, 0, 0); // nosing hint
    }
    // plinth and four banded piers (brick courses alternating with limestone bands)
    B("stone", C.stoneD, 0, 0.114, 0, 0.66, 0.056, 0.66);
    for (const sx of [-1, 1])
      for (const sz of [-1, 1]) {
        const px = sx * 0.222,
          pz = sz * 0.222;
        B("stone", C.stone, px, 0.168, pz, 0.17, 0.02, 0.17);
        for (let b = 0; b < 10; b++) {
          const y = 0.188 + b * 0.054;
          if (b % 2 === 0) B("brick", C.brick, px, y, pz, 0.156, 0.054, 0.156);
          else B("stone", C.stone, px, y, pz, 0.164, 0.054, 0.164);
        }
      }
    // arcade on each of the four faces
    for (let side = 0; side < 4; side++) {
      const yaw = (side * Math.PI) / 2,
        nx = Math.sin(yaw),
        nz = Math.cos(yaw),
        tx = Math.cos(yaw),
        tz = -Math.sin(yaw);
      // twin classical columns: base, entasis shaft, capital, plus shallow flutes
      for (const sgn of [-1, 1])
        for (const off of [-0.022, 0.022]) {
          const u = sgn * 0.128 + off,
            cx = nx * 0.282 + tx * u,
            cz = nz * 0.282 + tz * u;
          L("column", C.white, [[0, 0], [0.026, 0], [0.026, 0.012], [0.02, 0.02], [0.019, 0.04], [0.0185, 0.2], [0.0165, 0.37], [0.019, 0.39], [0.024, 0.405], [0.027, 0.42], [0, 0.42]], cx, 0.16, cz);
          B("column", C.white, cx, 0.58, cz, 0.054, 0.032, 0.054, yaw);
          for (let f = 0; f < 8; f++) {
            const a = (f / 8) * Math.PI * 2;
            B("column", 0xe9e6de, cx + Math.cos(a) * 0.0175, 0.2, cz + Math.sin(a) * 0.0175, 0.004, 0.17, 0.004, -a);
          }
        }
      // the arch: a true half ring with an inner moulding, resting on the column capitals, keystone on top
      const ax = nx * 0.28,
        az = nz * 0.28;
      A("column", "arch", C.white, ax, 0.575, az, 0.25, 0.25, 0.5, 0, yaw, 0);
      A("column", "arch", 0xeeebe3, ax - nx * 0.012, 0.575, az - nz * 0.012, 0.2, 0.2, 0.3, 0, yaw, 0);
      B("column", C.white, nx * 0.294, 0.665, nz * 0.294, 0.05, 0.07, 0.06, yaw);
      // spandrel brickwork and a limestone band above the arch
      for (const sgn of [-1, 1]) B("brick", C.brick, nx * 0.255 + tx * sgn * 0.185, 0.6, nz * 0.255 + tz * sgn * 0.185, 0.1, 0.16, 0.07, yaw);
      B("stone", C.stone, nx * 0.258, 0.74, nz * 0.258, 0.5, 0.022, 0.05, yaw);
      // open arch: recessed arcade wall behind the columns, no grille
      B("shade", C.inner, nx * 0.2, 0.17, nz * 0.2, 0.3, 0.6, 0.03, yaw);
      B("stone", C.stoneD, nx * 0.31, 0.17, nz * 0.31, 0.2, 0.012, 0.06, yaw);
      nav.obstacles.push({ type: "obb", island: null, owner: "clocktower", x: x + nx * 0.2, z: z + nz * 0.2, hx: 0.16, hz: 0.03, cos: Math.cos(yaw), sin: -Math.sin(yaw) });
    }
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) nav.obstacles.push({ type: "circle", island: null, owner: "clocktower", x: x + sx * 0.222, z: z + sz * 0.222, r: 0.12 });
    // triple-tier projecting cornice (moulded)
    B("stone", C.stoneD, 0, 0.76, 0, 0.66, 0.044, 0.66);
    L("column", C.white, [[0.33, 0], [0.375, 0.018], [0.375, 0.034], [0.355, 0.048], [0.31, 0.048], [0, 0.048]], 0, 0.804, 0);
    B("stone", 0xd8d3c8, 0, 0.852, 0, 0.6, 0.026, 0.6);
    // brick shaft with corner pilasters, limestone string courses and a waist band
    B("brick", C.brick, 0, 0.86, 0, 0.48, 1.4, 0.48);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) B("brick", C.brickLt, sx * 0.214, 0.86, sz * 0.214, 0.082, 1.41, 0.082);
    // limestone string courses only where they don't cross the motto plaques (1.43–2.07) or the clock / emblem faces
    // (1.02–1.24), which app.js mounts on the shaft faces at ±0.248
    for (const hy of [0.93, 1.33, 2.16]) B("stone", C.stone, 0, hy, 0, 0.508, 0.022, 0.508);
    // plaque surrounds: limestone frames where app.js places the motto plaques and the clock / emblem faces
    for (let side = 0; side < 4; side++) {
      const yaw = (side * Math.PI) / 2,
        nx = Math.sin(yaw),
        nz = Math.cos(yaw);
      // frames stay behind the plaque planes app.js puts at ±0.248 (frame faces end at 0.246)
      B("stone", C.stone, nx * 0.242, 1.41, nz * 0.242, 0.23, 0.69, 0.008, yaw);
      B("stone", C.stone, nx * 0.242, 1.005, nz * 0.242, 0.25, 0.25, 0.008, yaw);
    }
    // belfry: grey stone base, four corner piers with caps, louvres, a bronze railing
    B("stone", C.belfry, 0, 2.295, 0, 0.465, 0.068, 0.465);
    B("stone", 0x9c9b94, 0, 2.352, 0, 0.405, 0.046, 0.405);
    for (const sx of [-1, 1])
      for (const sz of [-1, 1]) {
        B("stone", C.belfry, sx * 0.156, 2.375, sz * 0.156, 0.066, 0.29, 0.066);
        B("stone", 0x9c9b94, sx * 0.156, 2.655, sz * 0.156, 0.08, 0.03, 0.08);
      }
    for (let side = 0; side < 4; side++) {
      const yaw = (side * Math.PI) / 2,
        nx = Math.sin(yaw),
        nz = Math.cos(yaw);
      for (let k = 0; k < 4; k++) B("stone", C.belfryD, nx * 0.16, 2.4 + k * 0.028, nz * 0.16, 0.245, 0.014, 0.026, yaw);
      B("bronze", C.bronze, nx * 0.165, 2.51, nz * 0.165, 0.245, 0.006, 0.006, yaw);
      for (let i = -3; i <= 3; i++) B("bronze", C.bronze, nx * 0.165 + Math.cos(yaw) * i * 0.035, 2.46, nz * 0.165 - Math.sin(yaw) * i * 0.035, 0.005, 0.05, 0.005, yaw);
    }
    // lintel, slate pyramid roof with ridge caps and an eave board, golden finial and lightning rod
    B("stone", C.belfry, 0, 2.685, 0, 0.408, 0.05, 0.408);
    B("stone", 0xa7a69f, 0, 2.735, 0, 0.5, 0.016, 0.5);
    A("slate", "pyramid", C.teal, 0, 2.86, 0, 0.475, 0.25, 0.475);
    for (let side = 0; side < 4; side++) {
      const a = (side * Math.PI) / 2 + Math.PI / 4;
      const len = Math.hypot(0.2375 * Math.SQRT2, 0.25);
      add("slate", G.box, C.tealD, x + Math.cos(a) * 0.12, T + 2.86, z + Math.sin(a) * 0.12, len, 0.012, 0.012, 0, -a, Math.atan2(0.25, 0.336));
    }
    A("gold", "sphere", C.gold, 0, 2.995, 0, 0.07, 0.07, 0.07);
    L("gold", C.gold, [[0, 0], [0.03, 0], [0.012, 0.03], [0, 0.03]], 0, 3.02, 0);
    B("column", 0xe8ecf0, 0, 3.05, 0, 0.012, 0.26, 0.012);
    built = { x, z };
  }

  const meshes = [];
  function finish(scene) {
    if (!built) return meshes;
    const group = new THREE.Group();
    group.name = "clock-tower-model";
    for (const [k, list] of Object.entries(buckets)) {
      if (!list.length) continue;
      const merged = mergeGeometries(list, false);
      list.forEach((g) => g.dispose());
      if (!merged) continue;
      merged.computeBoundingSphere();
      const spec = MATS[k];
      const mat = new THREE.MeshStandardMaterial({ vertexColors: true, metalness: spec.metalness, roughness: spec.roughness });
      if (spec.tex === "brick") mat.map = brickTex();
      if (spec.tex === "stone") mat.map = stoneTex();
      mat.userData.noPalette = true;
      mat.userData.fxEnvScale = spec.env;
      const mesh = new THREE.Mesh(merged, mat);
      mesh.name = "clock-tower-" + k;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.matrixAutoUpdate = false;
      mesh.userData = { type: "landmarkMesh", id: "landmark:clocktower", item: "landmark:clocktower" };
      group.add(mesh);
      meshes.push(mesh);
    }
    Object.values(G).forEach((g) => g.dispose());
    scene.add(group);
    return meshes;
  }
  return { build, finish, nav, meshes };
}

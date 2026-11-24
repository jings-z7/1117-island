// 地圖鏡頭操控：整張地圖（校園島＋港灣島＋海上小島）的包圍盒限制平移、依畫面比例算出「全圖」距離、
// 左鍵／單指拖曳＝移動地圖（可切換成旋轉）、游標位置縮放、鍵盤平移與旋轉、指北、全圖、小地圖用的視野框。
// 只處理鏡頭，不讀也不顯示任何系所資料。

const DRAG_KEY = "htl-drag-mode";
const DEFAULT_DIR = { x: 0.24, y: 0.33, z: 0.87 }; // the overview direction app.js already uses (north = −z is "up")

export function installMapCamera(THREE, { camera, controls, stage, isMobile = false, reduced, getDriving = () => false, startFly, onPan }) {
  const box = { minX: -20, maxX: 20, minZ: -20, maxZ: 20, top: 0.65 };
  const center = new THREE.Vector3();
  const theta0 = Math.atan2(DEFAULT_DIR.x, DEFAULT_DIR.z);

  // ---- world bounds ---------------------------------------------------------------------------------------------
  function setBounds(points, margin = 1.6) {
    let a = Infinity,
      b = -Infinity,
      c = Infinity,
      d = -Infinity;
    for (const p of points) {
      const r = p.r || 0;
      a = Math.min(a, p.x - r);
      b = Math.max(b, p.x + r);
      c = Math.min(c, p.z - r);
      d = Math.max(d, p.z + r);
    }
    if (!Number.isFinite(a)) return;
    Object.assign(box, { minX: a - margin, maxX: b + margin, minZ: c - margin, maxZ: d + margin });
    center.set((box.minX + box.maxX) / 2, 0, (box.minZ + box.maxZ) / 2);
    // keep the built-in sphere limit as a loose safety net around the real centre; the rectangle below is the real limit
    controls.cursor.copy(center);
    controls.maxTargetRadius = Math.hypot(box.maxX - box.minX, box.maxZ - box.minZ) / 2 + 2;
    refit();
  }

  // shift camera and target together so the target stays inside the map rectangle (no rotation, no jump)
  const _d = new THREE.Vector3();
  function clamp() {
    const t = controls.target;
    const x = Math.min(box.maxX, Math.max(box.minX, t.x)),
      z = Math.min(box.maxZ, Math.max(box.minZ, t.z));
    if (x === t.x && z === t.z) return false;
    _d.set(x - t.x, 0, z - t.z);
    t.add(_d);
    camera.position.add(_d);
    return true;
  }

  // ---- full-map distance ----------------------------------------------------------------------------------------
  const _cam = new THREE.PerspectiveCamera();
  const _v = new THREE.Vector3();
  const FULL_POLAR = THREE.MathUtils.degToRad(42);
  function dirFor(theta, phi) {
    return new THREE.Vector3(Math.sin(phi) * Math.sin(theta), Math.cos(phi), Math.sin(phi) * Math.cos(theta));
  }
  // smallest distance at which every corner of the map box (ground to roof height) is on screen
  function fitDistance(theta = theta0, phi = FULL_POLAR, fill = 0.92) {
    const w = stage.clientWidth || innerWidth,
      h = stage.clientHeight || innerHeight;
    _cam.fov = camera.fov;
    _cam.aspect = w / h;
    _cam.near = camera.near;
    _cam.far = 2000;
    _cam.updateProjectionMatrix();
    const dir = dirFor(theta, phi);
    const corners = [];
    for (const x of [box.minX, box.maxX]) for (const z of [box.minZ, box.maxZ]) for (const y of [-0.2, 3]) corners.push([x, y, z]);
    const fits = (dist) => {
      _cam.position.copy(center).addScaledVector(dir, dist);
      _cam.lookAt(center);
      _cam.updateMatrixWorld();
      for (const [x, y, z] of corners) {
        _v.set(x, y, z).project(_cam);
        if (_v.z > 1 || Math.abs(_v.x) > fill || Math.abs(_v.y) > fill) return false;
      }
      return true;
    };
    let lo = 5,
      hi = 400;
    for (let i = 0; i < 28; i++) {
      const mid = (lo + hi) / 2;
      if (fits(mid)) hi = mid;
      else lo = mid;
    }
    return hi;
  }
  let fullDist = 60;
  function refit() {
    fullDist = fitDistance();
    controls.maxDistance = Math.max(60, fullDist * 1.12);
  }
  function fullMapView() {
    const pos = center.clone().setY(0.3).addScaledVector(dirFor(theta0, FULL_POLAR), fullDist);
    startFly(center.clone().setY(0.3), pos);
  }

  // fog recedes with the camera so the far islands are not washed out in the full-map view
  function updateFog(scene, camDist) {
    const f = scene.fog;
    if (!f) return;
    f.near = Math.max(42, camDist * 0.95);
    f.far = Math.max(150, camDist * 2.6);
  }

  // ---- drag mode ------------------------------------------------------------------------------------------------
  let mode = "pan";
  try {
    mode = localStorage.getItem(DRAG_KEY) === "rotate" ? "rotate" : "pan";
  } catch {}
  function applyMouse() {
    // while walking the camera follows the avatar: a drag that moved the map would break the follow, so drag rotates
    const pan = mode === "pan" && !getDriving();
    controls.mouseButtons = pan
      ? { LEFT: THREE.MOUSE.PAN, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.ROTATE }
      : { LEFT: THREE.MOUSE.ROTATE, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.PAN };
    controls.touches = pan ? { ONE: THREE.TOUCH.PAN, TWO: THREE.TOUCH.DOLLY_ROTATE } : { ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN };
    stage.classList.toggle("drag-pan", pan);
  }
  function setDragMode(m) {
    mode = m === "rotate" ? "rotate" : "pan";
    try {
      localStorage.setItem(DRAG_KEY, mode);
    } catch {}
    applyMouse();
    return mode;
  }
  applyMouse();
  new MutationObserver(applyMouse).observe(document.body, { attributes: true, attributeFilter: ["class"] });
  controls.zoomToCursor = true;

  // ---- moving the view ------------------------------------------------------------------------------------------
  // ground-plane forward / right of the current view
  const _f = new THREE.Vector3(),
    _r = new THREE.Vector3();
  function axes() {
    _f.copy(controls.target).sub(camera.position).setY(0);
    if (_f.lengthSq() < 1e-6) _f.set(0, 0, -1);
    _f.normalize();
    _r.set(-_f.z, 0, _f.x);
  }
  function panBy(dx, dz) {
    _d.set(dx, 0, dz);
    controls.target.add(_d);
    camera.position.add(_d);
    clamp();
    onPan?.();
  }
  function panTo(x, z) {
    panBy(x - controls.target.x, z - controls.target.z);
  }
  function rotateBy(dTheta) {
    const off = camera.position.clone().sub(controls.target);
    const s = new THREE.Spherical().setFromVector3(off);
    s.theta += dTheta;
    camera.position.copy(controls.target).add(_v.setFromSpherical(s));
  }
  function azimuth() {
    const off = camera.position.clone().sub(controls.target);
    return Math.atan2(off.x, off.z) - theta0;
  }
  function faceNorth() {
    const off = camera.position.clone().sub(controls.target);
    const s = new THREE.Spherical().setFromVector3(off);
    s.theta = theta0;
    startFly(controls.target.clone(), controls.target.clone().add(new THREE.Vector3().setFromSpherical(s)));
  }

  // keyboard: held keys pan / rotate smoothly every frame (outside walking mode, never while typing or in a dialog)
  const held = new Set();
  const KEYS = {
    KeyW: "up",
    ArrowUp: "up",
    KeyS: "down",
    ArrowDown: "down",
    KeyA: "left",
    ArrowLeft: "left",
    KeyD: "right",
    ArrowRight: "right",
    KeyQ: "rotL",
    KeyE: "rotR",
  };
  const typing = (t) => t && (/INPUT|TEXTAREA|SELECT/.test(t.tagName) || t.isContentEditable);
  const blocked = () => getDriving() || document.body.classList.contains("tour") || document.querySelector('[aria-modal="true"]:not([hidden])')?.offsetParent;
  addEventListener("keydown", (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey || typing(e.target) || blocked()) return;
    const k = KEYS[e.code];
    if (k) {
      // arrow keys on a focused button / slider keep their own meaning
      if (e.key.startsWith("Arrow") && e.target !== document.body && e.target.tagName !== "CANVAS") return;
      held.add(k);
      e.preventDefault();
      return;
    }
    if (e.key === "+" || e.key === "=") api.onZoomKey?.(0.8), e.preventDefault();
    else if (e.key === "-" || e.key === "_") api.onZoomKey?.(1 / 0.8), e.preventDefault();
    else if (e.key === "0") fullMapView(), e.preventDefault();
    else if (e.key === "n" || e.key === "N") faceNorth();
  });
  addEventListener("keyup", (e) => held.delete(KEYS[e.code]));
  addEventListener("blur", () => held.clear());
  function tick(dt) {
    if (!held.size) return false;
    if (getDriving()) {
      held.clear();
      return false;
    }
    axes();
    const dist = camera.position.distanceTo(controls.target);
    const sp = dist * 0.85 * dt;
    let fx = 0,
      rx = 0;
    if (held.has("up")) fx += 1;
    if (held.has("down")) fx -= 1;
    if (held.has("right")) rx += 1;
    if (held.has("left")) rx -= 1;
    if (fx || rx) panBy((_f.x * fx + _r.x * rx) * sp, (_f.z * fx + _r.z * rx) * sp);
    if (held.has("rotL")) rotateBy(-1.4 * dt);
    if (held.has("rotR")) rotateBy(1.4 * dt);
    return true;
  }

  // ---- what the camera sees on the ground (for the minimap's view frame) --------------------------------------
  const _ray = new THREE.Raycaster();
  const _plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.65);
  const _ndc = new THREE.Vector2();
  function viewQuad() {
    const out = [];
    for (const [x, y] of [
      [-1, -1],
      [1, -1],
      [1, 1],
      [-1, 1],
    ]) {
      _ray.setFromCamera(_ndc.set(x, y), camera);
      const hit = _ray.ray.intersectPlane(_plane, new THREE.Vector3());
      if (hit && hit.distanceTo(camera.position) < 140) out.push({ x: hit.x, z: hit.z });
      else {
        // above the horizon: cut the frame off at a fixed distance along the ray's ground direction
        const g = _ray.ray.direction.clone().setY(0).normalize().multiplyScalar(60);
        out.push({ x: camera.position.x + g.x, z: camera.position.z + g.z });
      }
    }
    return out;
  }

  const api = {
    box,
    center,
    setBounds,
    clamp,
    refit,
    fitDistance,
    get fullDist() {
      return fullDist;
    },
    fullMapView,
    updateFog,
    get dragMode() {
      return mode;
    },
    setDragMode,
    panBy,
    panTo,
    faceNorth,
    azimuth,
    tick,
    viewQuad,
    onZoomKey: null,
  };
  if (isMobile) controls.panSpeed = 1.15;
  return api;
}

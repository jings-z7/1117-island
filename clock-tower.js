// 朝陽鐘樓 會動、會響（2026-11-15）
// - 鐘面時針、分針跟著裝置的本地時間走
// - 平日依上下課時間自動敲鐘（bell-schedule.json，鐘聲時刻例外：使用者提供的課表節數時段，只有節次與起訖時間），
//   以台北時間計算：每節開始響上課鐘、結束響下課鐘，播放校園常見的西敏寺鐘聲（4 句 16 音，WebAudio 即時合成，
//   不用音檔），鐘擺動、鐘室亮起、一圈圈聲波從鐘樓擴散；週末不響
// - 點擊鐘樓也能手動敲一句
// 音效跟隨護照的「音效」開關，未與頁面互動前瀏覽器不允許出聲，此時只有動畫。
// 每次鐘響發出 window 事件 "htl:clocktower" { kind: "start" | "end" | "manual", period }，人物據此做出反應。

const NOTE = { G3: 196.0, C4: 261.63, D4: 293.66, E4: 329.63 };
// Westminster hour chime (changes 2–5), the tune most Taiwanese campuses ring
const PHRASES = [
  ["C4", "E4", "D4", "G3"],
  ["C4", "D4", "E4", "C4"],
  ["E4", "C4", "D4", "G3"],
  ["G3", "D4", "E4", "C4"],
];
const NOTE_GAP = 0.78,
  PHRASE_GAP = 0.9;

// campus time: weekday (1 = Mon … 7 = Sun), hour, minute, second in Asia/Taipei whatever the viewer's own zone is
const TPE = (() => {
  try {
    return new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Taipei", weekday: "short", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" });
  } catch {
    return null;
  }
})();
const WD = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 };
export function campusTime(d = new Date()) {
  if (!TPE) return { wd: ((d.getDay() + 6) % 7) + 1, h: d.getHours(), m: d.getMinutes(), s: d.getSeconds() };
  const o = {};
  for (const p of TPE.formatToParts(d)) o[p.type] = p.value;
  return { wd: WD[o.weekday] || 1, h: Number(o.hour) % 24, m: Number(o.minute), s: Number(o.second) };
}
// every bell of the schedule as minutes after midnight: [{ min, kind: "start" | "end", period }]
export function bellTimes(schedule) {
  const out = [];
  const hm = (t) => {
    const m = /^(\d{2}):(\d{2})$/.exec(String(t || ""));
    return m ? Number(m[1]) * 60 + Number(m[2]) : null;
  };
  for (const p of schedule?.periods || []) {
    const a = hm(p.start),
      b = hm(p.end);
    if (a != null) out.push({ min: a, kind: "start", period: p.period });
    if (b != null) out.push({ min: b, kind: "end", period: p.period });
  }
  return out.sort((x, y) => x.min - y.min);
}
// the next bell from campus time `t` (searching up to a week ahead): { wd, min, kind, period, inMin }
export function nextBell(schedule, t = campusTime()) {
  const bells = bellTimes(schedule),
    days = new Set(schedule?.days || []);
  if (!bells.length || !days.size) return null;
  const now = t.h * 60 + t.m;
  for (let k = 0; k < 8; k++) {
    const wd = ((t.wd - 1 + k) % 7) + 1;
    if (!days.has(wd)) continue;
    for (const b of bells) if (k > 0 || b.min > now) return { ...b, wd, today: k === 0, inMin: k * 1440 + b.min - now };
  }
  return null;
}

export function installClockTower(THREE, { scene, top, x, z, faces = [], bellColor = 0xe6a832, camera, frameHooks, reduced, schedule = null }) {
  // ---- bell on a pivot (replaces the static kit bell) ----
  const pivot = new THREE.Group();
  pivot.position.set(x, top + 2.615, z);
  const bellMat = new THREE.MeshStandardMaterial({ color: bellColor, metalness: 0.55, roughness: 0.32, emissive: 0x6b4a10, emissiveIntensity: 0 });
  bellMat.userData.noPalette = true;
  const bell = new THREE.Mesh(new THREE.ConeGeometry(0.075, 0.16, 18, 1, true), bellMat);
  bell.position.y = -0.085;
  const crown = new THREE.Mesh(new THREE.SphereGeometry(0.03, 12, 8), bellMat);
  crown.position.y = -0.005;
  const lip = new THREE.Mesh(new THREE.TorusGeometry(0.074, 0.008, 6, 24).rotateX(Math.PI / 2), bellMat);
  lip.position.y = -0.163;
  const clapperMat = new THREE.MeshStandardMaterial({ color: 0xf8d264, metalness: 0.4, roughness: 0.4 });
  clapperMat.userData.noPalette = true;
  const clapper = new THREE.Mesh(new THREE.SphereGeometry(0.02, 10, 8), clapperMat);
  clapper.position.y = -0.165;
  pivot.add(bell, crown, lip, clapper);
  scene.add(pivot);

  // ---- clock hands on the clock faces ----
  const handMat = new THREE.MeshStandardMaterial({ color: 0x14382e, roughness: 0.6 });
  handMat.userData.noPalette = true;
  const mkHand = (len, w) => new THREE.Mesh(new THREE.BoxGeometry(w, len, 0.004).translate(0, len / 2 - 0.006, 0), handMat);
  const hands = [];
  for (const f of faces) {
    const g = new THREE.Group();
    g.position.set(f.x + Math.sin(f.yaw) * 0.004, f.y, f.z + Math.cos(f.yaw) * 0.004);
    g.rotation.y = f.yaw;
    const h = mkHand(0.04, 0.009),
      m = mkHand(0.058, 0.006),
      hub = new THREE.Mesh(new THREE.CylinderGeometry(0.007, 0.007, 0.006, 10).rotateX(Math.PI / 2), handMat);
    m.position.z = 0.002;
    g.add(h, m, hub);
    scene.add(g);
    hands.push({ h, m });
  }

  // ---- sound rings ----
  const ringMat = new THREE.MeshBasicMaterial({ color: 0xffe2a0, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide });
  ringMat.userData.noPalette = true;
  const rings = [];
  for (let k = 0; k < 3; k++) {
    const r = new THREE.Mesh(new THREE.RingGeometry(0.9, 1, 48).rotateX(-Math.PI / 2), ringMat.clone());
    r.material.userData.noPalette = true;
    r.position.set(x, top + 2.5, z);
    r.visible = false;
    r.renderOrder = 6;
    scene.add(r);
    rings.push({ mesh: r, t0: -1 });
  }

  // ---- audio ----
  let ac = null;
  const soundOn = () => {
    try {
      const o = JSON.parse(localStorage.getItem("htl-passport:v1") || "null");
      return !o || o.soundOn !== false;
    } catch {
      return true;
    }
  };
  function audio() {
    if (ac) return ac.state === "running" ? ac : null;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    try {
      ac = new AC();
    } catch {
      return null;
    }
    return ac.state === "running" ? ac : null;
  }
  // the first click / key anywhere unlocks audio, so the next chime can be heard
  const unlock = () => {
    try {
      if (!ac) audio();
      ac?.resume?.();
    } catch {}
  };
  addEventListener("pointerdown", unlock, { passive: true });
  addEventListener("keydown", unlock);

  // a church-bell tone: inharmonic partials (hum, prime, tierce, quint, nominal) with long exponential decay
  function strike(ctx, freq, when, gain) {
    const out = ctx.createGain();
    out.gain.value = gain;
    out.connect(ctx.destination);
    for (const [mul, amp, dec] of [
      [0.5, 0.35, 4.2],
      [1, 0.6, 3.2],
      [1.19, 0.28, 2.4],
      [1.5, 0.22, 2.0],
      [2, 0.32, 1.8],
      [2.74, 0.12, 1.1],
    ]) {
      const o = ctx.createOscillator(),
        g = ctx.createGain();
      o.type = "sine";
      o.frequency.value = freq * mul;
      g.gain.setValueAtTime(0, when);
      g.gain.linearRampToValueAtTime(amp, when + 0.008);
      g.gain.exponentialRampToValueAtTime(0.0001, when + dec);
      o.connect(g).connect(out);
      o.start(when);
      o.stop(when + dec + 0.05);
    }
  }
  // louder when the camera is near the tower
  const loudness = () => {
    const d = camera.position.distanceTo(pivot.position);
    return Math.max(0.05, Math.min(0.32, 2.4 / (d + 4)));
  };

  // ---- ringing state ----
  let strikes = []; // times (ms, performance.now) of each note, for the swing animation
  let ringing = false,
    endAt = 0;
  function ring(kind = "manual", period = null) {
    const phrases = kind === "manual" ? [PHRASES[0]] : PHRASES;
    const now = performance.now();
    strikes = [];
    let t = 0.05;
    const ctx = soundOn() ? audio() : null;
    const vol = loudness();
    for (const ph of phrases) {
      for (const n of ph) {
        strikes.push(now + t * 1000);
        if (ctx) strike(ctx, NOTE[n], ctx.currentTime + t, vol);
        t += NOTE_GAP;
      }
      t += PHRASE_GAP - NOTE_GAP;
    }
    ringing = true;
    endAt = now + t * 1000 + 2200;
    rings.forEach((r, k) => (r.t0 = now + k * 700));
    window.dispatchEvent(new CustomEvent("htl:clocktower", { detail: { kind, period, x, z } }));
    return true;
  }

  // ---- per frame ----
  let lastMinute = -1,
    lastHandKey = "",
    lastTick = 0,
    t = campusTime();
  const bells = bellTimes(schedule),
    bellDays = new Set(schedule?.days || []);
  frameHooks.add((now) => {
    // campus clock read four times a second (Intl formatting is not free)
    if (now - lastTick > 250) {
      lastTick = now;
      t = campusTime();
    }
    const min = t.h * 60 + t.m;
    // schedule bells: only when the minute actually turns onto a bell time (never on page load), weekdays only
    if (lastMinute >= 0 && min !== lastMinute && !document.hidden && bellDays.has(t.wd)) {
      const b = bells.find((x) => x.min === min);
      if (b) ring(b.kind, b.period);
    }
    lastMinute = min;
    let dirty = false;
    // hands: update once a second, on campus (Taipei) time
    const key = `${t.h}:${t.m}:${t.s}`;
    if (key !== lastHandKey) {
      lastHandKey = key;
      const mm = t.m + t.s / 60,
        hh = (t.h % 12) + mm / 60;
      // the hand points "up" at 12 and turns clockwise as seen from the front of each face
      for (const { h, m } of hands) {
        h.rotation.z = -(hh / 12) * Math.PI * 2;
        m.rotation.z = -(mm / 60) * Math.PI * 2;
      }
      dirty = true;
    }
    if (!ringing) return dirty;
    // swing: each strike kicks the bell; damped pendulum between strikes
    let swing = 0,
      glow = 0;
    for (const s of strikes) {
      const dt = (now - s) / 1000;
      if (dt < 0 || dt > 3) continue;
      const amp = reduced?.matches ? 0.05 : 0.32;
      swing += amp * Math.exp(-dt * 1.6) * Math.sin(dt * 7.5);
      glow = Math.max(glow, Math.exp(-dt * 2.2));
    }
    pivot.rotation.z = swing;
    clapper.position.x = -Math.sin(swing * 2.2) * 0.02;
    bellMat.emissiveIntensity = glow * 0.9;
    for (const r of rings) {
      if (r.t0 < 0) continue;
      const dt = (now - r.t0) / 1000;
      const life = 2.6;
      if (dt < 0) continue;
      const p = dt / life;
      if (p > 1 || reduced?.matches) {
        r.mesh.visible = false;
        if (now < endAt - 2200) r.t0 = now + 300; // keep rings going while the tune plays
        else r.t0 = -1;
        continue;
      }
      r.mesh.visible = true;
      const s = 0.12 + p * 1.6;
      r.mesh.scale.set(s, 1, s);
      r.mesh.position.y = top + 2.5 - p * 1.4;
      r.mesh.material.opacity = 0.55 * (1 - p) * (1 - p);
    }
    if (now > endAt) {
      ringing = false;
      pivot.rotation.z = 0;
      clapper.position.x = 0;
      bellMat.emissiveIntensity = 0;
      for (const r of rings) (r.mesh.visible = false), (r.t0 = -1);
    }
    return true;
  });

  return {
    ring,
    pivot,
    next: () => nextBell(schedule, campusTime()),
    get ringing() {
      return ringing;
    },
  };
}

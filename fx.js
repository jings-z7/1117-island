// Rendering polish for the island (app.js): image-based lighting, ambient occlusion, night bloom, SMAA.
//
// Purely visual; it adds no geometry and changes no data. Everything degrades gracefully:
// - The environment map (RoomEnvironment → PMREM) is cheap and is used on every quality level.
// - The post chain (N8AO ambient occlusion → night bloom → tone mapping → SMAA) runs only on "high" quality
//   with WebGL2, or when forced with ?fx=1. ?fx=0 (or the ✨ toggle, remembered in localStorage) turns it off.
// - A watchdog drops ambient occlusion, then the whole chain, if frames stay slow (never steps back up on its own,
//   so the picture does not pump).
//
// Third-party code (vendored, no build step):
// - N8AO by N8python, CC0 1.0 — vendor/n8ao/N8AO.js (https://github.com/N8python/n8ao)
// - three.js examples (EffectComposer, UnrealBloomPass, OutputPass, SMAAPass, RoomEnvironment), MIT
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

const STORE_KEY = "htl-fx";
const ENV_DAY = 0.42; // envMapIntensity at noon; RoomEnvironment is a bright neutral room, so keep it a soft fill
const ENV_NIGHT = 0.08; // and almost none at night so the blue night palette stays blue
const SLOW_MS = 34; // mean frame time (≈ under 30 fps) that counts as "too slow" for the watchdog
const WARMUP_MS = 6000;
const WINDOW_FRAMES = 90;

const smooth = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

function readPref() {
  try {
    return localStorage.getItem(STORE_KEY);
  } catch {
    return null;
  }
}
function savePref(v) {
  try {
    localStorage.setItem(STORE_KEY, v);
  } catch {}
}

/**
 * @param {typeof import("three")} THREE
 * @param {{ renderer: any, scene: any, camera: any, env: any, quality: string, params: URLSearchParams,
 *           debug: string|null, english: boolean, onChange?: () => void }} o
 */
export async function createFX(THREE, { renderer, scene, camera, env, quality, params, debug, english, onChange = () => {} }) {
  const fx = {
    level: 0, // 0 = plain render, 1 = bloom + SMAA, 2 = AO + bloom + SMAA
    render: (cam) => renderer.render(scene, cam),
    setSize: () => {},
    info: () => ({ level: fx.level, env: !!scene.environment }),
  };
  if (debug) return fx;

  // ---------- image-based lighting (all quality levels) ----------
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envTex = pmrem.fromScene(new RoomEnvironment(renderer), 0.04).texture;
  pmrem.dispose();
  scene.environment = envTex;
  // three r160 has no scene.environmentIntensity, so set it per material. Materials are created lazily
  // (residents, the avatar, thumbnails), so the scene is re-scanned every couple of seconds.
  let envK = -1,
    lastScan = 0;
  const isMobile =
    innerWidth <= 820 ||
    (typeof matchMedia === "function" && matchMedia("(pointer: coarse)").matches) ||
    /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
  const scanInterval = isMobile ? 10000 : 5000;
  const tuneEnv = (now, force = false) => {
    const k = ENV_DAY + (ENV_NIGHT - ENV_DAY) * smooth(0.05, 0.9, env.night || 0);
    if (!force && Math.abs(k - envK) < 0.01 && now - lastScan < scanInterval) return;
    envK = k;
    lastScan = now;
    scene.traverse((o) => {
      const mats = o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : null;
      if (!mats) return;
      // userData.fxEnvScale: metals and glass (campus art, Kaohsiung landmarks) reflect more of the room than plaster does
      for (const m of mats) {
        if (!m || !m.isMeshStandardMaterial || m.userData.fxEnvSkip) continue;
        const want = k * (m.userData.fxEnvScale || 1);
        if (m.envMapIntensity !== want) m.envMapIntensity = want;
      }
    });
  };
  tuneEnv(0, true);

  // ---------- post-processing chain ----------
  const pref = readPref();
  const force = params.get("fx");
  const isWebGL2 = renderer.capabilities.isWebGL2;
  // Keep mobile GPU lightweight by default (no multi-pass AO/Bloom/SMAA unless ?fx=1 or the visitor switched 光影 on).
  // 2026-11-13: a phone visitor who turned 光影 on keeps it on the next visit (the watchdog below still steps it down
  // if frames stay slow); before, the choice was forgotten on every reload.
  const wanted = force === "0" ? false : force === "1" ? true : pref === "off" ? false : pref === "on" ? true : isMobile ? false : quality === "high";
  const supported = isWebGL2;

  let composer = null,
    aoPass = null,
    bloomPass = null,
    renderPass = null,
    smaaPass = null,
    finalPass = null,
    tiltShiftOn = false,
    built = false;

  async function build() {
    if (built) return true;
    try {
      const [{ EffectComposer }, { RenderPass }, { ShaderPass }, { OutputPass }, { UnrealBloomPass }, { SMAAPass }, { N8AOPass }] = await Promise.all([
        import("three/addons/postprocessing/EffectComposer.js"),
        import("three/addons/postprocessing/RenderPass.js"),
        import("three/addons/postprocessing/ShaderPass.js"),
        import("three/addons/postprocessing/OutputPass.js"),
        import("three/addons/postprocessing/UnrealBloomPass.js"),
        import("three/addons/postprocessing/SMAAPass.js"),
        import("./vendor/n8ao/N8AO.js?v=1.9.4"),
      ]);
      const size = renderer.getDrawingBufferSize(new THREE.Vector2());
      composer = new EffectComposer(renderer);
      composer.setPixelRatio(renderer.getPixelRatio());

      aoPass = new N8AOPass(scene, camera, size.x, size.y);
      // N8AO renders the scene once into its own target (colour + depth) and reconstructs normals from depth,
      // so it costs one scene draw, unlike GTAO/SSAO which need an extra normal pass over ~2M triangles.
      aoPass.autoDetectTransparency = false; // glows/pools are transparent; a second transparency pass is not worth it
      Object.assign(aoPass.configuration, {
        aoRadius: 0.42,
        distanceFalloff: 0.35,
        intensity: 2.6,
        aoSamples: 12,
        denoiseSamples: 6,
        denoiseRadius: 10,
        halfRes: true,
        depthAwareUpsampling: true,
        gammaCorrection: false, // OutputPass does tone mapping + sRGB
        color: new THREE.Color(0x2a1c14), // warm, not grey: reads as a sunlit miniature
      });
      renderPass = new RenderPass(scene, camera);
      bloomPass = new UnrealBloomPass(new THREE.Vector2(size.x / 2, size.y / 2), 0, 0.35, 1.05);
      smaaPass = new SMAAPass(size.x, size.y);

      composer.addPass(aoPass);
      composer.addPass(renderPass);
      composer.addPass(bloomPass);
      composer.addPass(new OutputPass());
      composer.addPass(smaaPass);
      // The canvas is created with alpha: true (transparent clear). Post passes can leave alpha < 1, which the page
      // then blends with the light background behind the canvas (washed-out picture). Write an opaque final image,
      // with optional WebGL Tilt-Shift miniature depth-of-field blur (inspired by ybouane/tiltshift-in-html & pmndrs/postprocessing).
      finalPass = new ShaderPass({
        uniforms: {
          tDiffuse: { value: null },
          uTilt: { value: tiltShiftOn ? 1.0 : 0.0 },
        },
        vertexShader: "varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
        fragmentShader: `
          uniform sampler2D tDiffuse;
          uniform float uTilt;
          varying vec2 vUv;
          void main(){
            vec3 col = texture2D(tDiffuse, vUv).rgb;
            if (uTilt > 0.01) {
              float dist = smoothstep(0.18, 0.48, abs(vUv.y - 0.5));
              float r = dist * 0.0042 * uTilt;
              if (r > 0.0002) {
                vec3 acc = col * 0.24;
                acc += texture2D(tDiffuse, vUv + vec2( r,  0.0)).rgb * 0.12;
                acc += texture2D(tDiffuse, vUv + vec2(-r,  0.0)).rgb * 0.12;
                acc += texture2D(tDiffuse, vUv + vec2( 0.0,  r)).rgb * 0.12;
                acc += texture2D(tDiffuse, vUv + vec2( 0.0, -r)).rgb * 0.12;
                acc += texture2D(tDiffuse, vUv + vec2( r * 0.7,  r * 0.7)).rgb * 0.07;
                acc += texture2D(tDiffuse, vUv + vec2(-r * 0.7,  r * 0.7)).rgb * 0.07;
                acc += texture2D(tDiffuse, vUv + vec2( r * 0.7, -r * 0.7)).rgb * 0.07;
                acc += texture2D(tDiffuse, vUv + vec2(-r * 0.7, -r * 0.7)).rgb * 0.07;
                col = acc;
              }
            }
            gl_FragColor = vec4(col, 1.0);
          }`,
      });
      composer.addPass(finalPass);
      built = true;
      return true;
    } catch (e) {
      console.warn("fx: post-processing unavailable", e);
      return false;
    }
  }

  function applyLevel(level) {
    fx.level = level;
    if (composer) {
      aoPass.enabled = level >= 2;
      renderPass.enabled = level === 1;
    }
    syncButton();
    onChange();
  }

  // ---------- watchdog ----------
  let startAt = null,
    lastFrame = 0,
    sum = 0,
    count = 0;
  function watch(now) {
    if (startAt === null) startAt = now;
    const dt = now - lastFrame;
    lastFrame = now;
    if (now - startAt < WARMUP_MS || dt > 250 || document.hidden) return; // skip idle gaps (renders only when dirty)
    sum += dt;
    count++;
    if (count < WINDOW_FRAMES) return;
    const mean = sum / count;
    sum = 0;
    count = 0;
    if (mean > SLOW_MS && fx.level > 0) {
      console.info(`fx: frames ${mean.toFixed(1)} ms, dropping to level ${fx.level - 1}`);
      applyLevel(fx.level - 1);
      startAt = now - WARMUP_MS + 2500; // give the new level a moment before judging it
    }
  }

  fx.render = (cam) => {
    const now = performance.now();
    tuneEnv(now);
    if (!composer || fx.level === 0) {
      renderer.render(scene, cam);
      return;
    }
    watch(now);
    const night = env.night || 0;
    const bloom = smooth(0.35, 0.9, night) * 0.38;
    bloomPass.enabled = bloom > 0.01;
    bloomPass.strength = bloom;
    aoPass.camera = cam;
    renderPass.camera = cam;
    // AO darkens less at night, where lamp light (not the sky) is the main source
    const ao = 2.6 - 1.2 * night;
    if (Math.abs(aoPass.configuration.intensity - ao) > 0.05) aoPass.configuration.intensity = ao;
    composer.render();
  };
  // Follows the renderer (call after renderer.setSize / setPixelRatio); reads the size back from the renderer so the
  // fixed 1080×1920 ?ratio=9x16 recording mode and the adaptive pixel ratio are both respected.
  const sizeV = new THREE.Vector2();
  fx.setSize = () => {
    if (!composer) return;
    renderer.getSize(sizeV);
    composer.setPixelRatio(renderer.getPixelRatio());
    composer.setSize(sizeV.x, sizeV.y);
  };
  fx.info = () => ({ level: fx.level, env: !!scene.environment, envIntensity: envK, supported, built });
  fx.setLevel = async (level) => {
    if (level > 0 && !(await build())) level = 0;
    fx.setSize();
    applyLevel(level);
  };

  // ---------- ✨ lighting & 📷 tilt-shift toggles in the layers bar ----------
  let btn = null,
    tiltBtn = null;
  function syncButton() {
    if (btn) {
      btn.setAttribute("aria-pressed", String(fx.level > 0));
      btn.title = fx.level > 0 ? (english ? "Cinematic lighting on (AO, night glow)" : "電影級光影：開（環境光遮蔽、夜間光暈）") : english ? "Cinematic lighting off" : "電影級光影：關（較省電）";
    }
    if (tiltBtn) {
      tiltBtn.setAttribute("aria-pressed", String(tiltShiftOn && fx.level > 0));
      tiltBtn.title = tiltShiftOn ? (english ? "Tilt-Shift miniature lens: ON" : "微縮移軸景深：開") : english ? "Tilt-Shift miniature lens: OFF" : "微縮移軸景深：關";
    }
  }
  const seg = document.querySelector(".hud .seg2");
  if (seg && supported) {
    btn = document.createElement("button");
    btn.className = "tg";
    btn.id = "fx-toggle";
    btn.type = "button";
    btn.setAttribute("aria-label", english ? "Cinematic lighting" : "電影級光影");
    btn.innerHTML = `<svg viewBox="0 0 24 24"><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 16l.7 1.8 1.8.7-1.8.7L19 21l-.7-1.8-1.8-.7 1.8-.7z"/></svg><span>${english ? "Lighting" : "光影"}</span>`;
    btn.onclick = async () => {
      const on = fx.level === 0;
      savePref(on ? "on" : "off");
      await fx.setLevel(on ? 2 : 0);
    };
    seg.appendChild(btn);

    tiltBtn = document.createElement("button");
    tiltBtn.className = "tg";
    tiltBtn.id = "tilt-toggle";
    tiltBtn.type = "button";
    tiltBtn.setAttribute("aria-label", english ? "Tilt-Shift miniature lens" : "微縮移軸景深");
    tiltBtn.innerHTML = `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M3 7h18M3 17h18"/></svg><span>${english ? "Tilt-Shift" : "移軸"}</span>`;
    tiltBtn.onclick = async () => {
      tiltShiftOn = !tiltShiftOn;
      if (tiltShiftOn && fx.level === 0) await fx.setLevel(2);
      if (finalPass) finalPass.uniforms.uTilt.value = tiltShiftOn ? 1.0 : 0.0;
      syncButton();
      onChange();
    };
    seg.appendChild(tiltBtn);
  }

  if (wanted && supported) await fx.setLevel(2);
  else syncButton();
  window.__htlFx = fx;
  return fx;
}

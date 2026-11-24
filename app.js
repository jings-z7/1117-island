import { sceneSpecs, createPolicyModel } from "./scene-models.js?v=20261115-01";
import { createKit } from "./kit.js?v=20261115-04";
import { PAL, ACCENT, applyPalette } from "./palette.js?v=20261115-01";
import { createEnvironment, WATER_Y } from "./environment.js?v=20261115-02";
import { planMarina, startMarina, marinaNav } from "./marina.js?v=20261116-01";
import { linkRoute } from "./walk-links.js?v=20261114-01";
import { FLOW_THEMES, HUB_FLOWS, WEAK_FLOWS, themeOf, flowTitle } from "./flow-themes.js?v=20261115-01";
import { buildIslands, buildGraph, resolveIslandPlacements, hexVertex, GROUND, R, R_SPORT, TOP, islandR, islandInnerR } from "./world.js?v=20261115-03";
import { buildDecor, bez } from "./decor.js?v=20261115-04";
import { createPeople, ROLE_LABEL, CARRY_LABEL, FACULTY, FACULTY_BY_ID } from "./people.js?v=20261115-04";
import { OFFICIAL } from "./official-data.js?v=20261115-01";
import { icon, HEART_COLORS } from "./icons.js?v=20261113-01";
import { track } from "./analytics.js?v=20261113-01";
import { createResolutionGovernor } from "./resolution.js?v=20261113-01";
import { createFX } from "./fx.js?v=20261115-01";
import { ART, ART_PLACE, ART_ALIASES, createCampusArt } from "./campus-art.js?v=20261116-02";
import { createClockTowerModel } from "./clock-tower-model.js?v=20261116-02";
import { buildKaohsiungSkyline, planSkyline } from "./kaohsiung-skyline.js?v=20261115-08";
import { buildIsletWalks } from "./islet-walks.js?v=20261114-01";
import { planPlazaIsland, buildPlazaIsland } from "./plaza-island.js?v=20261115-03";
import { installMapCamera } from "./map-camera.js?v=20261114-01";
import { installClockTower } from "./clock-tower.js?v=20261115-02";
const $ = (s) => document.querySelector(s),
  $$ = (s) => [...document.querySelectorAll(s)];
const params = new URLSearchParams(location.search),
  english = params.get("lang") === "en",
  isRatio9x16 = params.get("ratio") === "9x16";
const reduced = matchMedia("(prefers-reduced-motion: reduce)"),
  app = $("#app");
const tr = (zh, en) => (english ? en : zh),
  txt = (v) => (typeof v === "string" ? v : (english ? v?.en || v?.zh : v?.zh) || "");
const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
// small avatars (name tags, roster, chips) use the 160 px WebP thumbnails from scripts/make_thumbs.py; cards keep the original
const thumb = (src) => (/\/teachers\/[^/]+\.(jpe?g|png)$/i.test(src || "") ? src.replace(/\/teachers\/([^/]+)\.(jpe?g|png)$/i, "/teachers/thumb/$1.webp") : src);
document.addEventListener(
  "error",
  (e) => {
    const img = e.target;
    if (!img || img.tagName !== "IMG" || img.dataset.fbApplied) return;
    img.dataset.fbApplied = "1";
    if (img.closest(".icon-tile.thumb, .teacher-3d-avatar, .icon-tile.role.portrait, .is-npc-avatar")) {
      img.remove();
      return;
    }
    img.src = "./assets/nkuht_htl_logo.png";
    img.style.objectFit = "contain";
  },
  true,
);
if (isRatio9x16) document.body.classList.add("ratio");
if (english) {
  document.documentElement.lang = "en";
  document.title = "HOTEL Island | NKUHT Dept. of Hotel Management 3D Navigator";
  $$("[data-en]").forEach((e) => (e.innerHTML = e.dataset.en));
  $("#search").placeholder = "Search courses, faculty, partner hotels…";
  const tb2d = $("#tb-2d-link");
  if (tb2d) tb2d.href = "./timeline.html?lang=en";

  $$(".tg").forEach((b) => {
    const t = b.querySelector("span")?.dataset.en;
    if (t) {
      b.title = t;
      b.setAttribute("aria-label", t);
    }
  });
  const tn = { 360: "Dawn", 720: "Day", 1080: "Dusk", 1260: "Night" };
  $$("[data-time]").forEach((b) => {
    b.title = tn[b.dataset.time];
    b.setAttribute("aria-label", tn[b.dataset.time]);
  });
}
try {
  const [THREE, { OrbitControls }, { CSS2DRenderer, CSS2DObject }, D] = await Promise.all([
    import("three"),
    import("three/addons/controls/OrbitControls.js?v=20261110-15"),
    import("three/addons/renderers/CSS2DRenderer.js"),
    fetch("./policies.json?v=20261115-01", { cache: "no-store" }).then((r) => {
      if (!r.ok) throw Error(`policies.json: ${r.status}`);
      return r.json();
    }),
  ]);
  // 鐘聲時刻例外 (CLAUDE.md): weekday class periods for the clock tower; the tower still works without it
  const bellSchedule = await fetch("./bell-schedule.json?v=20261115-01")
    .then((r) => (r.ok ? r.json() : null))
    .catch(() => null);
  // 港都典藏 (palette.js): `coral` keeps its name for the many call sites but is now the brass selection accent
  const colors = { coral: ACCENT, ink: PAL.ink, cream: PAL.ivory, yellow: PAL.brass, stone: PAL.ivoryShade, green: PAL.foliage };
  const islands = new Map(D.islands.map((i) => [i.id, i])),
    buildings = new Map(D.islands.flatMap((i) => i.buildings.map((b) => [b.id, { ...b, island: i.id }]))),
    sources = new Map(D.sources.map((s) => [s.id, s])),
    flows = new Map(D.flows.map((f) => [f.id, f])),
    quotes = new Map(D.quotes.map((q) => [q.id, q]));
  const debug = params.get("debug"),
    debugIsland = params.get("island"),
    isMobileDevice =
      innerWidth <= 820 ||
      matchMedia("(pointer: coarse)").matches ||
      /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent),
    quality =
      params.get("quality") ||
      (isMobileDevice ? "medium" : "high");
  if (debug) document.body.classList.add("debug");
  if (isMobileDevice) document.body.classList.add("is-mobile-device");
  const scene = new THREE.Scene(),
    stage = $("#stage");
  const renderer = new THREE.WebGLRenderer({
    // 2026-11-13: MSAA on every device. Phones render at a capped pixel ratio (≤ 1.25), so without MSAA the
    // high-DPI screens showed jagged roof lines and railings; tile-based mobile GPUs resolve MSAA almost for free.
    antialias: true,
    alpha: true,
    powerPreference: "high-performance",
    preserveDrawingBuffer: !!debug,
  });
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(
    isRatio9x16
      ? 1
      : isMobileDevice
        ? Math.min(devicePixelRatio || 1, 1.5) // 2026-11-13: was 1.25 (soft on 3× screens); the resolution governor steps it down to 0.85 when frames run long
        : Math.min(devicePixelRatio || 1, quality === "high" ? 1.75 : 1.4),
  );
  // production builds skip the per-program info-log queries (each one waits for the driver to finish linking);
  // ?debug=1 keeps the full shader error report
  renderer.debug.checkShaderErrors = !!debug;
  renderer.shadowMap.enabled = !debug;
  renderer.shadowMap.type = isMobileDevice ? THREE.PCFShadowMap : THREE.PCFSoftShadowMap;
  // 2026-10-25: the shadow map holds only static geometry (buildings, trees, islands); moving people, ferries and the
  // avatar use soft blob shadows instead. So it is re-rendered only when something that casts actually changes —
  // the sun's 10-minute step, or the near-camera detail (LOD) switching — instead of redrawing ~2M triangles every frame.
  renderer.shadowMap.autoUpdate = false;
  renderer.shadowMap.needsUpdate = true;
  let shadowSig = "";
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  // AgX keeps the ivory walls from clipping and the emerald roofs and turquoise harbour from turning neon (ACES
  // pushed every warm colour toward orange, which read like the reference site's coral)
  const tmAces = params.get("tm") === "aces" || !THREE.AgXToneMapping;
  renderer.toneMapping = tmAces ? THREE.ACESFilmicToneMapping : THREE.AgXToneMapping;
  renderer.toneMappingExposure = tmAces ? 1.0 : Number(params.get("exp")) || 1.0;
  stage.appendChild(renderer.domElement);
  renderer.domElement.tabIndex = 0;
  renderer.domElement.setAttribute(
    "aria-label",
    tr("3D 群島地圖：拖曳或 WASD／方向鍵移動、Q/E 旋轉、＋／－ 縮放、0 看全圖、N 指北；清單提供完整鍵盤操作", "3D map: drag or WASD / arrow keys to move, Q/E to rotate, +/- to zoom, 0 for the whole map, N to face north; use the index for full keyboard access."),
  );
  const labelRenderer = new CSS2DRenderer();
  labelRenderer.domElement.id = "labels";
  stage.appendChild(labelRenderer.domElement);
  const camera = new THREE.PerspectiveCamera(32, 1, 0.3, 320),
    controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = !reduced.matches;
  controls.dampingFactor = isMobileDevice ? 0.16 : 0.07;
  controls.enablePan = true;
  controls.screenSpacePanning = false;
  controls.keyPanSpeed = 12;
  controls.minPolarAngle = THREE.MathUtils.degToRad(25);
  controls.maxPolarAngle = THREE.MathUtils.degToRad(70);
  controls.minDistance = 3.8;
  controls.maxDistance = 60;
  controls.rotateSpeed = isMobileDevice ? 0.88 : 1.0;
  controls.panSpeed = isMobileDevice ? 0.95 : 1.0;
  controls.zoomSpeed = isMobileDevice ? 1.05 : 0.85;
  const frameHooks = new Set(); // per-frame callbacks (declared early so modules built below can register)
  controls.maxTargetRadius = 22; // replaced by the whole-map rectangle once the scenery is built (map-camera.js)

  // ---------- world ----------
  const top = TOP;
  const kit = createKit(THREE, top);
  const { centers, neighbors, bridges, islandViews: islandBodies } = buildIslands(THREE, scene, D, kit, colors, { hiResTextures: !isMobileDevice && quality === "high" });
  const cityCenter = new THREE.Vector3();
  for (const i of D.islands) cityCenter.add(centers.get(i.id));
  cityCenter.divideScalar(D.islands.length);
  const env = createEnvironment(THREE, scene, { reduced, quality, cityCenter, isMobile: isMobileDevice });
  const pickables = [],
    visual = kit.visual;
  function tree(x, z, size = 0.55, owner = null) {
    kit.part("trunk", [x, top + size * 0.38, z], [0.09, size * 0.76, 0.09], 0x89705c, owner);
    for (const [dx, dy, dz, ss, c] of [
      [0, 1.02, 0, 0.7, 0x86a56c],
      [-0.25, 0.84, 0.08, 0.52, 0x728f5f],
      [0.24, 0.88, -0.1, 0.55, 0x7f9a6a],
      [0.05, 0.86, 0.26, 0.5, 0x7a9664],
      [0.06, 1.2, 0.04, 0.4, 0xa3bf86],
    ])
      kit.part("leaf", [x + dx * size, top + dy * size, z + dz * size], [ss * size, ss * size * 0.88, ss * size], c, owner, [dx * 5, dz * 7, dy]);
  }
  function roof(x, y, z, w, d, owner) {
    // clean hip roof sitting on a thin eave band of the same footprint
    kit.part("hip", [x, y + 0.012, z], [w, 0.26, d], colors.coral, owner);
    kit.hbox(x, y - 0.13, z, w * 1.02, 0.03, d * 1.02, 0xa34e34, owner);
  }
  function house(x, z, w, h, owner, color = 0xf4ebdd) {
    kit.box(x, top + h / 2, z, w, h, w * 0.8, color, owner);
    roof(x, top + h + 0.13, z, w * 1.16, w * 0.96, owner);
    kit.hbox(x, top + h * 0.25, z + w * 0.415, w * 0.2, h * 0.5, 0.028, colors.ink, owner);
    for (const dx of [-0.29, 0.29]) {
      kit.part("glowbox", [x + w * dx, top + h * 0.67, z + w * 0.41], [w * 0.2, h * 0.26, 0.025], 0xa8c4c2, owner);
      kit.hbox(x + w * dx, top + h * 0.52, z + w * 0.45, w * 0.26, 0.025, 0.075, 0xf4ebdd, owner);
    }
    for (const dz of [-0.2, 0.16]) kit.part("glowbox", [x + w * 0.51, top + h * 0.62, z + w * dz], [0.02, h * 0.29, w * 0.18], 0xa8c4c2, owner);
    kit.hbox(x - w * 0.23, top + h + 0.2, z - w * 0.16, w * 0.12, 0.23, w * 0.14, colors.stone, owner);
  }
  function scaffold() {}
  const buildPolicyModel = createPolicyModel({ part: kit.part, top, colors, tree, house, scaffold });
  const SPORT_K = R_SPORT / 3.68;
  const COMPOSE = {
    civil: { "civil-office": [0, -0.62, 1.45, 0.56, 0.36], "civil-flex": [0, 0.3, 0.62], "civil-eap": [-0.92, 0.12, 0.48], "civil-award": [0.92, 0.12, 0.48], "civil-health": [-0.5, 0.82, 0.46], "civil-ai": [0.5, 0.82, 0.46] },
    institute: { "institute-research": [0.0, -0.62, 1.05], "institute-child": [-0.74, 0.3, 0.82], "institute-access": [0.74, 0.3, 0.82], "institute-dementia": [0, 0.98, 0.74] },
    family: { "family-station": [0.0, -0.66, 1.14], "family-hotline": [-0.94, -0.08, 0.56], "family-manager": [0.94, -0.08, 0.56], "family-respite": [-0.76, 0.74, 0.54], "family-counsel": [0.0, 0.94, 0.54], "family-home": [0.76, 0.74, 0.54] },
    water: { "water-active": [-0.64, -0.68, 0.84], "water-culture": [-0.98, 0.08, 0.56], "water-clean": [0.94, -0.24, 0.56], "water-detention": [-0.68, 0.82, 0.56], "water-eco": [0.76, 0.78, 0.56] },
    youth: { "youth-ai": [-0.3, -0.42, 1.25, 0.56], "youth-fund": [0.88, -0.2, 0.5], "youth-dream": [0.34, 0.64, 0.88] },
    diplomacy: { "diplomacy-forum": [0, -0.02, 1.1, 0.62], "diplomacy-exchange": [-0.68, -0.64, 0.6], "diplomacy-hoboken": [0.72, -0.66, 0.54], "diplomacy-talent": [0.75, 0.72, 0.5] },
    // 都更與住宅 (v51): a fenced construction site; 循環都更 at the back, 都更 items in the middle row, 住宅 items at the front
    renewal: { "renewal-loop": [0, -0.52, 1.1], "renewal-zombie": [-0.6, 0.4, 0.66], "renewal-review": [0.6, 0.4, 0.66], "housing-old": [-0.34, 1.0, 0.48], "housing-social": [0.34, 1.0, 0.48] },
    // 09 實習旅館專島 (第三期, 2026-11-15): one island, four districts read off the official partner table's region
    // column, laid out like the map of Taiwan — 北部 across the back (12), 中部 in the middle (6), 南部 at the front (5),
    // 東部 on the east (right) shore (1); sport-h01 (海外實習) stands at the ferry pier on the west corner.
    // Ids h02…h25 follow the official table order, so the region of each slot is checked against official-data.js below.
    sport: Object.fromEntries(
      [
        ["sport-h01", -1.32, 1.84, 0.62],
        // 北部 12
        ...[-1.32, -0.44, 0.44, 1.32].map((x, k) => [`sport-h0${2 + k}`, x, -1.84 + (k % 2) * 0.08]),
        ...[-2.2, -1.32, -0.44, 0.44, 1.32, 2.2].map((x, k) => [`sport-h${String(6 + k).padStart(2, "0")}`, x, -0.92 + (k % 2) * 0.08]),
        ["sport-h12", -1.76, 0],
        ["sport-h13", -0.88, 0.06],
        // 中部 6
        ["sport-h14", 0, 0],
        ["sport-h15", 0.88, 0.06],
        ["sport-h16", 1.76, 0],
        ...[-2.2, -1.32, -0.44].map((x, k) => [`sport-h${17 + k}`, x, 0.92 + (k % 2) * 0.08]),
        // 南部 5
        ...[0.44, 1.32, 2.2].map((x, k) => [`sport-h${20 + k}`, x, 0.92 + (k % 2) * 0.08]),
        ["sport-h23", -0.44, 1.84],
        ["sport-h24", 0.44, 1.9],
        // 東部 1
        ["sport-h25", 1.32, 1.84],
      // the grid was laid out for a 3.68 hex; positions follow the current island size, towers shrink a little less
      ].map(([id, x, z, size = 0.62]) => [id, [x * SPORT_K, z * SPORT_K, size * Math.pow(SPORT_K, 0.6), id === "sport-h01" ? 0.48 : 0.4, id === "sport-h01" ? 0.48 : 0.4]]),
    ),
    // 10 菁英實習3.0：品牌育才合作、雙軌選才、客房培訓與輪調、薪酬考核與校外實習輔導小組五區配置
    trails: { "trails-north": [-0.66, -0.54, 0.9], "trails-east": [0.66, -0.54, 0.88], "trails-history": [-0.66, 0.52, 0.88], "trails-diverse": [0.66, 0.52, 0.88], "trails-card": [0.0, 0.02, 0.92] },
    // 18 奢華體驗與金鑰匙管家：微學分沙龍、金鑰匙管家殿堂、神秘客稽核與奢華酒店企業學苑
    luxury: { "luxury-micro": [0.0, -0.52, 1.04], "luxury-butler": [-0.68, 0.42, 0.84], "luxury-mystery": [0.68, 0.42, 0.82], "luxury-academy": [0.0, 0.92, 0.78] },
    // 19 數位智慧服務與創新基地：D 棟 8 樓創新基地、AIoT 智慧客房與機器人、共創聯盟與 OPERA/AI 雙軌認證
    innovation: { "innovation-base": [0.0, -0.54, 1.06], "innovation-robot": [-0.68, 0.42, 0.84], "innovation-alliance": [0.68, 0.42, 0.82], "innovation-dualcert": [0.0, 0.92, 0.78] },
    // 20 永續旅宿治理、研發與 USR：ISO 永續治理課程館、教師國科會研究計畫塔、觀光局星級旅館評鑑革新研究與 USR 國小陪伴
    esg: { "esg-iso": [0.0, -0.54, 1.04], "esg-research": [-0.68, 0.42, 0.84], "esg-industry": [0.68, 0.42, 0.82], "esg-usr": [0.0, 0.92, 0.78] },
  };
  const PLOT = { schoolyard: 0xe6d8c8, farmland: 0xd3c4aa, softpad: 0xf4ece4, granite: 0xcdbb9f, lawn: 0xd3c4aa, gravel: 0xb8a07e, street: 0xbfb2a0, meadow: 0xd3c4aa, terracotta: 0xcfa88a, garden: 0xd3c4aa, forest: 0xc9b99f, rubber: 0xd99560, boardwalk: 0xa9b8b6, wetland: 0xc2d6b4, techpad: 0xcdd6d2, lane: 0xdcc3ae };
  const districtHeroes = { hakka: "hakka-elders", water: "water-active", ai: "ai-cluster", civil: "civil-office", institute: "institute-research", renewal: "renewal-loop", transport: "transport-hub", education: "education-class", lunch: "lunch-farm", family: "family-station", card: "card-culture", welfare: "welfare-care", sport: "sport-h01", trails: "trails-card", forest: "forest-parks", youth: "youth-ai", diplomacy: "diplomacy-forum", luxury: "luxury-micro", innovation: "innovation-base", esg: "esg-iso" };
  const silhouetteMode = debug === "silhouette";
  for (const i of D.islands) {
    const c = centers.get(i.id);
    kit.setIsland(i.id);
    const comp = COMPOSE[i.id];
    const usesComposition = comp && i.buildings.every((b) => Array.isArray(comp[b.id]));
    const placements = resolveIslandPlacements(i.buildings, comp, districtHeroes[i.id]);
    for (const [b, lx, lz, size, fpk = 0.5, fpz = 0.5] of placements) {
      const x = c.x + lx,
        z = c.z + lz;
      visual.set(b.id, { id: b.id, center: new THREE.Vector3(x, top + 0.35, z), parts: [], size });
      kit.footprints.push({ owner: b.id, island: i.id, minX: x - size * fpk, maxX: x + size * fpk, minZ: z - size * fpz, maxZ: z + size * fpz });
      buildPolicyModel(b.id, x, z, size, usesComposition ? {} : { plot: PLOT[GROUND[i.id]] });
    }
  }
  // 09 實習旅館專島 districts (第三期): paving tint per official region, a region plaque per district and a ferry pier
  // for 海外實習. Region of sport-hNN = OFFICIAL.partners[NN − 2].region (official table order); counts are computed.
  const sportDistricts = [];
  let marinaPlan = null,
    marina = null;
  if (!silhouetteMode && centers.get("sport")) {
    const sc = centers.get("sport");
    const REGION_PAVE = { 北部: 0xcbd5d8, 中部: 0xd9d6c6, 南部: 0xe4d4b6, 東部: 0xc6dcd6 };
    const byRegion = new Map();
    for (let n = 2; n <= 25; n++) {
      const id = `sport-h${String(n).padStart(2, "0")}`,
        v = visual.get(id),
        partner = OFFICIAL.partners?.[n - 2];
      if (!v || !partner?.region) continue;
      if (!byRegion.has(partner.region)) byRegion.set(partner.region, []);
      byRegion.get(partner.region).push(v.center);
      kit.hbox(v.center.x, top + 0.008, v.center.z, 0.84 * SPORT_K, 0.016, 0.84 * SPORT_K, REGION_PAVE[partner.region] ?? 0xd9d2c4, `district:${partner.region}`);
    }
    // plaques sit in the gap in front of each district's first row (east: beside its single hotel)
    const PLAQUE_AT = Object.fromEntries(Object.entries({ 北部: [0, -1.38], 中部: [0.88, 0.48], 南部: [1.32, 1.4], 東部: [2.2, 1.66] }).map(([k, [x, z]]) => [k, [x * SPORT_K, z * SPORT_K]]));
    for (const [region, pts] of byRegion) {
      const [ox, oz] = PLAQUE_AT[region] || [pts[0].x - sc.x, pts[0].z - sc.z];
      const el = document.createElement("span");
      el.className = "region-plaque";
      el.textContent = english ? `${{ 北部: "North", 中部: "Central", 南部: "South", 東部: "East" }[region] || region} · ${pts.length} hotels` : `${region}・${pts.length} 家`;
      const lab = new CSS2DObject(el);
      lab.position.set(sc.x + ox, top + 0.06, sc.z + oz);
      lab.visible = false;
      scene.add(lab);
      sportDistricts.push({ region, label: lab, count: pts.length });
    }
    // plaques only when the camera is close to the internship island (they would clutter the full map)
    let plaqueOn = null;
    frameHooks.add(() => {
      const on = controls.target.distanceTo(sc) < 4.8 && camera.position.distanceTo(controls.target) < 18;
      if (on === plaqueOn) return;
      plaqueOn = on;
      for (const d of sportDistricts) d.label.visible = on;
      return true;
    });
    // ferry pier at the island corner nearest 海外實習 (corners never carry bridges)
    const h01 = visual.get("sport-h01");
    if (h01) {
      let best = 0,
        bd = Infinity;
      for (let k = 0; k < 6; k++) {
        const [vx, vz] = hexVertex(sc.x, sc.z, R_SPORT, k);
        const d = Math.hypot(vx - h01.center.x, vz - h01.center.z);
        if (d < bd) (bd = d), (best = k);
      }
      const [vx, vz] = hexVertex(sc.x, sc.z, R_SPORT, best);
      const ox = (vx - sc.x) / R_SPORT,
        oz = (vz - sc.z) / R_SPORT,
        yaw = Math.atan2(ox, oz);
      const deckY = top - 0.12;
      for (let k = 0; k < 9; k++) {
        const t = 0.1 + k * 0.13;
        kit.hbox(vx + ox * t, deckY, vz + oz * t, 0.3, 0.025, 0.11, k % 2 ? 0x8a6a4e : 0x957559, "district:pier", [0, yaw, 0]);
        if (k % 3 === 1) for (const sd of [-1, 1]) kit.cyl(vx + ox * t - oz * sd * 0.15, (deckY - 0.75) / 2, vz + oz * t + ox * sd * 0.15, 0.035, deckY + 0.75, 0x6b5038, "district:pier");
      }
      // bollards and a lamp at the head, then a small white ferry moored alongside
      const hx = vx + ox * 1.2,
        hz = vz + oz * 1.2;
      for (const sd of [-1, 1]) kit.cyl(hx - oz * sd * 0.12, deckY + 0.04, hz + ox * sd * 0.12, 0.045, 0.06, 0x2c3436, "district:pier");
      kit.cyl(hx, deckY + 0.2, hz, 0.018, 0.4, 0x2c3436, "district:pier");
      kit.bulb(hx, deckY + 0.42, hz, 0.04);
      const fx = hx - oz * 0.42 - ox * 0.25,
        fz = hz + ox * 0.42 - oz * 0.25,
        fy = -0.18 + 0.06;
      kit.box(fx, fy, fz, 0.32, 0.12, 0.9, 0xf4f1ea, "district:pier", [0, yaw, 0]);
      kit.hbox(fx, fy + 0.035, fz, 0.335, 0.03, 0.92, 0x2f5f52, "district:pier", [0, yaw, 0]);
      kit.box(fx, fy + 0.15, fz - oz * 0.05 - ox * 0.0, 0.24, 0.14, 0.42, 0xfbfaf6, "district:pier", [0, yaw, 0]);
      kit.part("glowbox", [fx, fy + 0.16, fz], [0.25, 0.05, 0.36], 0x9fc4c6, "district:pier", [0, yaw, 0]);
      kit.cyl(fx - ox * 0.12, fy + 0.27, fz - oz * 0.12, 0.05, 0.1, 0xc8a052, "district:pier");
      // 遊艇碼頭 (marina.js): pontoon, kiosk, queue rails and moored sailboats beside the ferry pier
      if (!debug) {
        try {
          marinaPlan = planMarina(THREE, { kit, top, center: sc, R: R_SPORT, h01: h01.center, hexVertex, waterY: WATER_Y });
        } catch (e) {
          console.warn("marina plan", e);
        }
      }
    }
  }
  // Shop-front signs on the policy models whose shape alone is ambiguous (names = official item names)
  const SIGNS = {
    "institute-child": ["教學理念", 0x4a6fa5],
    "institute-access": ["教材教學", 0x3f6fb5],
    "institute-dementia": ["培育目標", 0xdb6a41],
    "institute-research": ["五項特色目標", 0x3e7c8c],
    "family-station": ["群賢會館", 0xdb6a41],
    "hakka-elders": ["精通外國語言", 0x3f5a8a],
    "hakka-points": ["外語課程抵免", 0x3f5a8a],
    "hakka-hiring": ["進階高階英日文", 0x3e7c8c],
    "hakka-taigi-unit": ["旅館英文", 0x3f5a8a],
    "hakka-taigi-service": ["旅館日文", 0x5f9aa6],
    "ai-cluster": ["OPERA／德安PMS", 0x3e7c8c],
    "ai-midlife": ["餐旅人工智慧管理", 0xdb6a41],
    "housing-old": ["儲備幹部MT直通車", 0x3e7c8c],
    "housing-social": ["研究所升學與系友網", 0x58a6a6],
    "welfare-care": ["黃啟揚老師", 0xdb6a41],
    "civil-health": ["導師時間", 0xd76b8a],
    "civil-eap": ["系學會", 0x3e7c8c],
    // 09 實習旅館專島：25 棟實習旅館全數顯示獨立專屬 3D 招牌名稱（不整併）
    "sport-h01": ["國外海外星級實習酒店", 0xd8a848],
    "sport-h02": ["臺北文華東方酒店", 0x8b6b3e],
    "sport-h03": ["台北W飯店", 0x8c2d56],
    "sport-h04": ["臺北嘉佩樂酒店", 0xb88b4a],
    "sport-h05": ["台北君悅酒店", 0x2c4a6e],
    "sport-h06": ["台北遠東香格里拉", 0x9c6e32],
    "sport-h07": ["台北喜來登大飯店", 0x7c3238],
    "sport-h08": ["台北寒舍艾美酒店", 0x2f5a68],
    "sport-h09": ["台北漢來大飯店", 0x8c6239],
    "sport-h10": ["新竹豐邑喜來登大飯店", 0x7c3238],
    "sport-h11": ["新北北海溫泉洲際酒店", 0x1e5c72],
    "sport-h12": ["礁溪老爺酒店", 0x3e6f58],
    "sport-h13": ["礁溪寒沐酒店", 0x4a6b5d],
    "sport-h14": ["臺中勤美洲際酒店", 0x1e5c72],
    "sport-h15": ["台中李芳艾美酒店", 0x2f5a68],
    "sport-h16": ["雲品溫泉酒店", 0x2e6f66],
    "sport-h17": ["虹夕諾雅 谷關", 0x3a5a40],
    "sport-h18": ["裕元花園酒店", 0x6b4e3d],
    "sport-h19": ["台中豐邑MOXY酒店", 0xa82b68],
    "sport-h20": ["台南遠東香格里拉", 0x9c6e32],
    "sport-h21": ["台南大員皇冠假日酒店", 0x7a3b58],
    "sport-h22": ["然一酒店", 0x2c3e50],
    "sport-h23": ["高雄漢來大飯店", 0x8c6239],
    "sport-h24": ["高雄中央公園英迪格酒店", 0x235e73],
    "sport-h25": ["瑞穗天合國際觀光酒店", 0xb88b4a],
    "trails-north": ["國際品牌育才合作", 0xb88b4a],
    "trails-east": ["雙軌選才與面試媒合", 0x3e7c8c],
    "trails-history": ["客房培訓與部門輪調", 0x2c3e50],
    "trails-diverse": ["實習薪酬與考核調薪", 0xdb6a41],
    "trails-card": ["校外實習輔導小組", 0xd8a848],
    "transport-hub": ["校外實習星級酒店", 0xb88b4a],
    "luxury-micro": ["奢華體驗微學分 8門", 0xb88b4a],
    "luxury-butler": ["金鑰匙管家培訓", 0x2c3e50],
    "luxury-mystery": ["神秘客品質檢核", 0x8c2d38],
    "luxury-academy": ["奢華酒店企業學苑", 0xd8a848],
    "innovation-base": ["D棟8樓創新基地", 0x235e73],
    "innovation-robot": ["AIoT智慧客房與機器人", 0x3e7c8c],
    "innovation-alliance": ["智能科技共創聯盟", 0x2c3e50],
    "innovation-dualcert": ["OPERA與AI雙軌認證", 0xb88b4a],
    "esg-iso": ["ISO永續旅宿治理", 0x2e6f56],
    "esg-research": ["教師國科會研究計畫", 0x235e73],
    "esg-industry": ["星級評鑑研修與專業服務", 0xb88b4a],
    "esg-usr": ["USR國小陪伴服務", 0xdb6a41],
  };
  const signGroup = new THREE.Group();
  const postMats = [];
  for (const [id, [label, col]] of Object.entries(SIGNS)) {
    const v = visual.get(id);
    if (!v || silhouetteMode) continue;
    const cv = document.createElement("canvas");
    cv.width = 64 * Math.max(4, label.length + 1);
    cv.height = 96;
    const g = cv.getContext("2d");
    g.fillStyle = "#fffdf8";
    g.beginPath();
    g.roundRect(0, 0, cv.width, cv.height, 18);
    g.fill();
    g.fillStyle = "#" + col.toString(16).padStart(6, "0");
    g.fillRect(0, 0, 22, cv.height);
    g.fillStyle = "#211d1d";
    g.font = "800 56px 'Noto Sans TC','PingFang TC',sans-serif";
    g.textBaseline = "middle";
    g.fillText(label, 40, cv.height / 2 + 2);
    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    const isSportSign = id.startsWith("sport-h");
    const w = (isSportSign ? Math.min(0.84, 0.064 * label.length + 0.11) : Math.min(0.9, 0.085 * label.length + 0.12)) * Math.max(0.8, v.size || 0.6),
      h = (w * cv.height) / cv.width;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: tex, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 0.3, roughness: 0.7, side: THREE.DoubleSide }));
    const sz = v.size || 0.6;
    const signBaseH = isSportSign ? sz * 0.74 : sz * 0.62;
    const signYaw = isSportSign ? 0.24 : 0.42;
    m.position.set(v.center.x, top + signBaseH + h / 2, v.center.z + sz * (isSportSign ? 0.38 : 0.42));
    m.rotation.y = signYaw;
    m.userData.item = id;
    signGroup.add(m);
    for (const d of [-w * 0.42, w * 0.42]) postMats.push(new THREE.Matrix4().compose(new THREE.Vector3(v.center.x + d * Math.cos(signYaw), top + signBaseH / 2, v.center.z + sz * (isSportSign ? 0.38 : 0.42) - d * Math.sin(signYaw)), new THREE.Quaternion(), new THREE.Vector3(1, signBaseH + 0.02, 1)));
  }
  const posts = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.012, 0.012, 1, 6), new THREE.MeshStandardMaterial({ color: 0x211d1d }), Math.max(1, postMats.length));
  postMats.forEach((m, n) => posts.setMatrixAt(n, m));
  signGroup.add(posts);
  scene.add(signGroup);
  // Renewal: a construction-site showcase. Decorative only — no counts, floors, areas or dates.
  const renewalGhosts = new THREE.Group();
  var renewalSign = null;
  // 2026-10-15: renewal tile paused and removed from launch; the construction-site showcase lives in app_backup_20261015_prerenewal.js
  // City diplomacy: exchange-cycle board at the pier (text from the policy summary wording)
  {
    const c = centers.get("diplomacy");
    const cv = document.createElement("canvas");
    cv.width = 512;
    cv.height = 256;
    const g = cv.getContext("2d");
    g.fillStyle = "#2f3a46";
    g.fillRect(0, 0, 512, 256);
    g.fillStyle = "#fcea8b";
    g.font = "700 30px 'Noto Sans TC','PingFang TC',sans-serif";
    g.fillText(tr("高餐旅館・國際交流", "NKUHT HTL · Global Exchange"), 26, 52);
    const rows = [
      [tr("出發", "Depart"), "#db6a41", tr("國(海)外實習及研習", "Overseas internship & study")],
      [tr("課程", "Course"), "#58a6a6", tr("海外參訪(一)(二)選修", "Field Study I & II")],
      [tr("帶回", "Return"), "#8fb37a", tr("把國際經驗帶回高餐", "Bring global standards back")],
    ];
    rows.forEach(([k, col, v], n) => {
      const y = 100 + n * 52;
      g.fillStyle = col;
      g.beginPath();
      g.roundRect(26, y - 30, 104, 40, 10);
      g.fill();
      g.fillStyle = "#fff";
      g.font = "700 26px 'Noto Sans TC','PingFang TC',sans-serif";
      g.fillText(k, 44, y);
      g.fillStyle = "#e9eef0";
      g.font = "500 26px 'Noto Sans TC','PingFang TC',sans-serif";
      g.fillText(v, 150, y);
    });
    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    const board = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.31), new THREE.MeshStandardMaterial({ map: tex, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 0.35, roughness: 0.6 }));
    board.position.set(c.x + 0.55, top + 0.48, c.z + 1.0);
    board.rotation.y = -0.35;
    if (!debug) scene.add(board);
    kit.setIsland("diplomacy");
    kit.decor("diplomacy", "landmark:board", () => {
      for (const d of [-0.27, 0.27]) kit.cyl(c.x + 0.55 + d * Math.cos(0.35), top + 0.24, c.z + 1.0 + d * Math.sin(0.35), 0.02, 0.48, colors.ink);
    });
    kit.footprints.push({ owner: "_board", island: "diplomacy", minX: c.x + 0.25, maxX: c.x + 0.85, minZ: c.z + 0.88, maxZ: c.z + 1.12 });
  }
  // ---------- Iconic NKUHT Campus Landmarks & Public Art Installations (高餐校園代表地標與裝置藝術) ----------
  const LANDMARKS = new Map();
  let selectedLandmark = null;
  const clockTowerFaces = [];
  let clockTowerAt = null,
    clockTower = null;
  const landmarkPickMeshes = [];
  const landmarkSignGroup = new THREE.Group();
  const landmarkPinGroup = new THREE.Group();
  const landmarkHaloGroup = new THREE.Group();
  const landmarkPinViews = new Map();
  const landmarkPinLineMat = new THREE.LineBasicMaterial({ color: 0xf4c84b, transparent: true, opacity: 0.95, depthTest: false });
  const landmarkPinBeadGeo = new THREE.SphereGeometry(0.032, 10, 8);
  const landmarkPinBeadMat = new THREE.MeshBasicMaterial({ color: 0xffe48f });
  {
    const lmPostMats = [];
    const lmCanHover = matchMedia("(hover: hover) and (pointer: fine)").matches;
    const lmHaloTex = (() => {
      const cv = document.createElement("canvas");
      cv.width = cv.height = 128;
      const g = cv.getContext("2d");
      const grd = g.createRadialGradient(64, 64, 10, 64, 64, 64);
      grd.addColorStop(0, "rgba(255, 224, 130, 0.52)");
      grd.addColorStop(0.62, "rgba(238, 186, 72, 0.26)");
      grd.addColorStop(0.86, "rgba(218, 148, 42, 0.12)");
      grd.addColorStop(1, "rgba(218, 148, 42, 0)");
      g.fillStyle = grd;
      g.fillRect(0, 0, 128, 128);
      const t = new THREE.CanvasTexture(cv);
      t.colorSpace = THREE.SRGBColorSpace;
      return t;
    })();
    const lmHaloMat = new THREE.MeshBasicMaterial({
      map: lmHaloTex,
      transparent: true,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -3,
      polygonOffsetUnits: -6,
    });
    const lmRingMat = new THREE.MeshStandardMaterial({
      color: 0xe8bc4e,
      emissive: 0xc99224,
      emissiveIntensity: 0.28,
      roughness: 0.35,
      metalness: 0.38,
      polygonOffset: true,
      polygonOffsetFactor: -4,
      polygonOffsetUnits: -8,
    });
    lmRingMat.userData.noPalette = true; // campus landmarks keep their original colours
    const registerLandmark = (spec) => {
      const islCenter = centers.get(spec.island);
      if (!islCenter) return;
      const wx = islCenter.x + spec.lx;
      const wz = islCenter.z + spec.lz;
      const entry = {
        ...spec,
        x: wx,
        z: wz,
        center: new THREE.Vector3(wx, top + (spec.focusY || 0.46), wz),
        parts: [],
      };
      LANDMARKS.set(spec.id, entry);
      if (!silhouetteMode) {
        kit.setIsland(spec.island);
        kit.decor(spec.island, spec.id, () => spec.build(wx, wz, spec.id));
        if (spec.footprints) {
          for (const fp of spec.footprints(wx, wz)) {
            kit.footprints.push({ owner: spec.id, island: spec.island, ...fp });
          }
        } else {
          const r = spec.fpRadius || 0.38;
          kit.footprints.push({ owner: spec.id, island: spec.island, minX: wx - r, maxX: wx + r, minZ: wz - r, maxZ: wz + r });
        }
        // Golden monument plaza ring + warm luminous ground halo so every landmark stands out on the 3D map
        if (!debug) {
          const pr = spec.plazaR || 0.5;
          const haloPlane = new THREE.Mesh(new THREE.PlaneGeometry(pr * 2.55, pr * 2.55).rotateX(-Math.PI / 2), lmHaloMat);
          haloPlane.position.set(wx, top + 0.009, wz + (spec.haloDz || 0));
          haloPlane.renderOrder = 2;
          const goldRing = new THREE.Mesh(new THREE.RingGeometry(pr * 0.93, pr, 36).rotateX(-Math.PI / 2), lmRingMat);
          goldRing.position.set(wx, top + 0.013, wz + (spec.haloDz || 0));
          goldRing.renderOrder = 3;
          goldRing.userData = { type: "landmarkMesh", id: spec.id, item: spec.id };
          landmarkHaloGroup.add(haloPlane, goldRing);
          landmarkPickMeshes.push(goldRing);
        }
        // Always-visible floating HTML CSS2DObject wayfinding plaque + golden vertical stem
        if (!debug) {
          const pinY = top + (spec.pinY || 1.08);
          const pinBaseY = top + (spec.pinBaseY || (spec.pinY || 1.08) - 0.24);
          const stemGeo = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(wx, pinBaseY, wz),
            new THREE.Vector3(wx, pinY, wz),
          ]);
          const stemLine = new THREE.Line(stemGeo, landmarkPinLineMat);
          stemLine.renderOrder = 7;
          const stemBead = new THREE.Mesh(landmarkPinBeadGeo, landmarkPinBeadMat);
          stemBead.position.set(wx, pinBaseY, wz);
          stemBead.renderOrder = 7;
          const pinEl = document.createElement("button");
          pinEl.type = "button";
          pinEl.className = "landmark-pin" + (spec.hero ? " landmark-pin-hero" : "");
          pinEl.dataset.landmark = spec.id;
          const pTitle = txt(spec.pinTitle || spec.name);
          const pSub = txt(spec.pinSub || spec.category);
          pinEl.innerHTML = `<i class="lm-pin-ico" aria-hidden="true">${esc(spec.badge)}</i><span class="lm-pin-txt"><b>${esc(pTitle)}</b><small>${esc(pSub)}</small></span>`;
          pinEl.setAttribute("aria-label", `${txt(spec.name)} (${txt(spec.category)})`);
          pinEl.onclick = (e) => {
            e.stopPropagation();
            if (window.heartIslandAvatar?.S?.drive && window.heartIslandAvatar?.api?.visitLandmark) {
              window.heartIslandAvatar.api.visitLandmark(spec.id, { walkIfNear: true });
            } else {
              selectLandmark(spec.id);
            }
          };
          if (lmCanHover) {
            pinEl.onmouseenter = () => hoverItem(spec.id, true);
            pinEl.onmouseleave = () => hoverItem(spec.id, false);
          }
          const pinObj = new CSS2DObject(pinEl);
          pinObj.position.set(wx, pinY, wz);
          landmarkPinGroup.add(stemLine, stemBead, pinObj);
          landmarkPinViews.set(spec.id, { label: pinObj, line: stemLine, bead: stemBead, el: pinEl, island: spec.island, hero: !!spec.hero });
        }
        // Close-range golden-accented 3D campus nameplate at plaza level (shown when zoomed in close)
        const label = english ? spec.signEn : spec.signZh;
        const cv = document.createElement("canvas");
        cv.width = 64 * Math.max(5, label.length + 2);
        cv.height = 96;
        const g = cv.getContext("2d");
        g.fillStyle = "#173f3c";
        g.beginPath();
        g.roundRect(0, 0, cv.width, cv.height, 20);
        g.fill();
        g.lineWidth = 6;
        g.strokeStyle = "#e6be53";
        g.stroke();
        g.fillStyle = "#e6be53";
        g.fillRect(0, 0, 24, cv.height);
        g.fillStyle = "#fffdf6";
        g.font = "800 50px 'Noto Sans TC','PingFang TC',sans-serif";
        g.textBaseline = "middle";
        g.fillText(label, 40, cv.height / 2 + 2);
        const tex = new THREE.CanvasTexture(cv);
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = 4;
        const sw = Math.min(0.62, 0.055 * label.length + 0.14);
        const sh = (sw * cv.height) / cv.width;
        const signY = top + (spec.signPosts === false ? (spec.signLift || 0.68) : Math.min(0.22, spec.signLift || 0.22));
        const sx = wx + (spec.signDx || 0);
        const sz = wz + (spec.signDz ?? 0.36);
        const sm = new THREE.Mesh(
          new THREE.PlaneGeometry(sw, sh),
          new THREE.MeshStandardMaterial({ map: tex, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 0.28, roughness: 0.65, side: THREE.DoubleSide }),
        );
        sm.position.set(sx, signY + sh / 2, sz);
        sm.rotation.y = spec.signYaw ?? 0.32;
        sm.userData = { type: "landmarkMesh", id: spec.id, item: spec.id };
        landmarkSignGroup.add(sm);
        landmarkPickMeshes.push(sm);
        if (spec.signPosts !== false) {
          for (const d of [-sw * 0.4, sw * 0.4]) {
            lmPostMats.push(
              new THREE.Matrix4().compose(
                new THREE.Vector3(sx + d * Math.cos(sm.rotation.y), top + (signY - top) / 2, sz - d * Math.sin(sm.rotation.y)),
                new THREE.Quaternion(),
                new THREE.Vector3(1, Math.max(0.12, signY - top + 0.02), 1),
              ),
            );
          }
        }
      }
    };

    // Helper: create authentic Clock Tower vertical motto ("精誠勤樸") & NKUHT circular green emblem textures
    const makeMottoPlaqueTex = () => {
      const cv = document.createElement("canvas");
      cv.width = 192;
      cv.height = 600;
      const g = cv.getContext("2d");
      g.fillStyle = "#f7f6f1";
      g.fillRect(0, 0, 192, 600);
      g.strokeStyle = "#b5b0a4";
      g.lineWidth = 8;
      g.strokeRect(4, 4, 184, 592);
      const chars = ["精", "誠", "勤", "樸"];
      for (let i = 0; i < 4; i++) {
        if (i > 0) {
          g.strokeStyle = "#cac5ba";
          g.lineWidth = 4;
          g.beginPath();
          g.moveTo(12, i * 150);
          g.lineTo(180, i * 150);
          g.stroke();
        }
        g.fillStyle = "#0b5c3e";
        g.font = "900 102px 'Noto Serif TC','PMingLiU','Noto Sans TC',serif";
        g.textAlign = "center";
        g.textBaseline = "middle";
        g.fillText(chars[i], 96, i * 150 + 78);
      }
      const t = new THREE.CanvasTexture(cv);
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = 4;
      return t;
    };

    const makeEmblemPlaqueTex = (isClockFace = false) => {
      const cv = document.createElement("canvas");
      cv.width = 256;
      cv.height = 256;
      const g = cv.getContext("2d");
      g.fillStyle = "#f5f4ef";
      g.fillRect(0, 0, 256, 256);
      g.strokeStyle = "#b8b4aa";
      g.lineWidth = 8;
      g.strokeRect(4, 4, 248, 248);
      if (isClockFace) {
        g.fillStyle = "#0d5e40";
        g.beginPath();
        g.arc(128, 128, 98, 0, Math.PI * 2);
        g.fill();
        g.fillStyle = "#fcfbf7";
        g.beginPath();
        g.arc(128, 128, 82, 0, Math.PI * 2);
        g.fill();
        g.fillStyle = "#0d5e40";
        for (let k = 0; k < 12; k++) {
          const a = (k / 12) * Math.PI * 2;
          g.beginPath();
          g.arc(128 + Math.sin(a) * 66, 128 - Math.cos(a) * 66, k % 3 === 0 ? 6.5 : 4, 0, Math.PI * 2);
          g.fill();
        }
        // hands are real 3D meshes now (clock-tower.js), turning with the local time
      } else {
        // NKUHT circular dark-green & white school emblem (校徽)
        g.fillStyle = "#0d6947";
        g.beginPath();
        g.arc(128, 128, 100, 0, Math.PI * 2);
        g.fill();
        g.strokeStyle = "#ffffff";
        g.lineWidth = 8;
        g.beginPath();
        g.arc(128, 128, 85, 0, Math.PI * 2);
        g.stroke();
        g.strokeStyle = "#ffffff";
        g.lineWidth = 11;
        g.beginPath();
        g.arc(128, 132, 60, 0.25 * Math.PI, 0.85 * Math.PI);
        g.stroke();
        g.beginPath();
        g.arc(128, 132, 60, 0.15 * Math.PI, 0.75 * Math.PI, true);
        g.stroke();
        g.fillStyle = "#ffffff";
        g.beginPath();
        g.arc(128, 106, 29, 0, Math.PI * 2);
        g.fill();
        g.fillRect(107, 125, 42, 38);
        g.fillStyle = "#0d6947";
        g.fillRect(119, 129, 6.5, 30);
        g.fillRect(132, 129, 6.5, 30);
      }
      const t = new THREE.CanvasTexture(cv);
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = 4;
      if (!isClockFace) {
        // 2026-11-13: the official NKUHT school logo (assets/nkuht_school_logo.png) replaces the hand-drawn stand-in;
        // the drawn emblem above stays only until the image loads (or if it fails to load)
        const logo = new Image();
        logo.decoding = "async";
        logo.onload = () => {
          g.fillStyle = "#f5f4ef";
          g.fillRect(8, 8, 240, 240);
          const s = Math.min(212 / logo.naturalWidth, 212 / logo.naturalHeight);
          const w = logo.naturalWidth * s,
            h = logo.naturalHeight * s;
          g.drawImage(logo, 128 - w / 2, 128 - h / 2, w, h);
          t.needsUpdate = true;
          try {
            dirty = true;
          } catch {}
        };
        logo.src = "./assets/nkuht_school_logo.png?v=20261113-01";
      }
      return t;
    };

    // the tower body is a merged PBR model (clock-tower-model.js: brick and stone textures, real arches and columns);
    // the lawn, palms, plaques, clock faces and lights stay here
    const clockTowerModel = silhouetteMode ? null : createClockTowerModel(THREE, { quality });
    // 1. 朝陽鐘樓（精誠勤樸鐘樓廣場） — Island 15 (water, front-center foreground of the campus map)
    registerLandmark({
      id: "landmark:clocktower",
      island: "water",
      lx: 0.12,
      lz: 0.16,
      fpRadius: 0.56,
      plazaR: 1.02,
      haloDz: 0.04,
      focusY: 1.44,
      thumbSize: 1.98,
      hero: true,
      pinBaseY: 3.18,
      pinY: 3.52,
      pinTitle: { zh: "朝陽鐘樓・精誠勤樸", en: "Chaoyang Clock Tower" },
      pinSub: { zh: "高餐最高精神象徵地標", en: "NKUHT Motto Tower" },
      signZh: "朝陽鐘樓・精誠勤樸",
      signEn: "NKUHT Clock Tower",
      signLift: 0.22,
      signDx: 0.52,
      signDz: 0.62,
      signYaw: 0.35,
      badge: "🕰️",
      category: { zh: "高餐精神象徵地標", en: "Iconic Campus Monument" },
      name: { zh: "朝陽鐘樓（精誠勤樸鐘樓廣場）", en: "Chaoyang Clock Tower (NKUHT Motto Plaza)" },
      summary: {
        zh: "矗立於高餐大校園核心軸線與太陽之子大草坪畔的最高代表性地標。鮭魚粉紅磚塔身四面鑲嵌白底深綠字「精誠勤樸」校訓牌匾與圓形校徽，基座採粉橘磚與白石水平飾帶、四向古典雙白柱圓拱門與半圓形深色階梯看台，頂部設灰石敞開式鐘室與青藍尖頂，見證高餐人晨昏勤學的歲月。",
        en: "Towering beside NKUHT's central lawn, this iconic salmon-terracotta clock tower bears the vertical green-on-white school motto '精誠勤樸' (Sincerity, Integrity, Diligence, Simplicity) and school emblem above a banded terracotta-and-stone four-way twin-columned arch base, semicircular amphitheater steps, royal palms, and a slate-teal pyramidal belfry.",
      },
      features: [
        { zh: "塔身四面鑲嵌高餐校訓「精誠勤樸」白底深綠字直式牌匾與圓形綠底校徽／鐘面", en: "Four-sided vertical school motto plaques ('精誠勤樸') and circular green NKUHT school emblem & clock faces" },
        { zh: "基座完整還原粉橘紅磚與淺灰石材水平飾帶、四向古典雙白圓柱、圓拱門廊與梯形拱心石", en: "Banded terracotta-and-limestone base with twin classical white columns, rounded arches, and prominent keystones" },
        { zh: "前方展開三層半圓弧深灰石階看台廣場，兩側環繞挺拔大王椰子樹列與翠綠草坪", en: "Three-tier semicircular dark-slate stepped amphitheater flanked by stately royal palm trees" },
      ],
      build(x, z, owner) {
        const BRICK = 0xe88d6e;
        const BRICK_LT = 0xf4ae94;
        const STONE = 0xf2eee5;
        const WHITE_COL = 0xfcfbf7;
        const BELFRY = 0x8e8d86;
        const TEAL_ROOF = 0x22788e;
        const STEP_DARK = 0x2c2f35;
        const STEP_MID = 0x434852;

        // Lush emerald campus lawn pad + 3-tier semicircular dark-slate stepped amphitheater plaza (Photo 2)
        kit.cyl(x, top + 0.01, z + 0.05, 0.96, 0.018, 0x6ea850, owner);
        if (clockTowerModel) clockTowerModel.build(x, z, top);
        else {
          kit.cyl(x, top + 0.026, z + 0.055, 0.86, 0.032, STEP_DARK, owner);
          kit.box(x, top + 1.56, z, 0.48, 1.4, 0.48, BRICK, owner);
          kit.part("hip", [x, top + 2.835, z], [0.475, 0.25, 0.475], TEAL_ROOF, owner);
        }

        // Giant high-contrast CanvasTexture plaques ("精誠勤樸" + green circular NKUHT emblem / clock face)
        if (!debug) {
          const mottoTex = makeMottoPlaqueTex();
          const embTex = makeEmblemPlaqueTex(false);
          const clkTex = makeEmblemPlaqueTex(true);
          const mottoMat = new THREE.MeshStandardMaterial({ map: mottoTex, emissive: 0xffffff, emissiveMap: mottoTex, emissiveIntensity: 0.26, roughness: 0.5 });
          const embMat = new THREE.MeshStandardMaterial({ map: embTex, emissive: 0xffffff, emissiveMap: embTex, emissiveIntensity: 0.24, roughness: 0.48 });
          const clkMat = new THREE.MeshStandardMaterial({ map: clkTex, emissive: 0xffffff, emissiveMap: clkTex, emissiveIntensity: 0.24, roughness: 0.48 });
          for (let side = 0; side < 4; side++) {
            const yaw = (side * Math.PI) / 2;
            const nx = Math.sin(yaw);
            const nz = Math.cos(yaw);
            const mMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.196, 0.64), mottoMat);
            mMesh.position.set(x + nx * 0.248, top + 1.75, z + nz * 0.248);
            mMesh.rotation.y = yaw;
            mMesh.userData = { type: "landmarkMesh", id: owner };
            scene.add(mMesh);
            landmarkPickMeshes.push(mMesh);

            const eMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.216, 0.216), side % 2 === 0 ? embMat : clkMat);
            eMesh.position.set(x + nx * 0.248, top + 1.13, z + nz * 0.248);
            if (side % 2 === 1) clockTowerFaces.push({ x: eMesh.position.x, y: eMesh.position.y, z: eMesh.position.z, yaw });
            eMesh.rotation.y = yaw;
            eMesh.userData = { type: "landmarkMesh", id: owner };
            scene.add(eMesh);
            landmarkPickMeshes.push(eMesh);
          }
        }

        // Suspended antique bronze-gold bell inside belfry: a swinging mesh from clock-tower.js (debug renders keep the
        // static kit bell)
        if (debug) {
          kit.part("cone", [x, top + 2.53, z], [0.15, 0.16, 0.15], 0xe6a832, owner);
          kit.sphere(x, top + 2.445, z, 0.038, 0xf8d264, owner);
        }
        clockTowerAt = { x, z };
        kit.bulb(x, top + 2.53, z, 0.062, 0xffeab3);
        kit.bulb(x, top + 0.44, z, 0.048, 0xffeab3);

        // 4 Stately Royal Palm Trees (大王椰子) flanking the Clock Tower amphitheater without blocking the motto shaft (Photo 2)
        for (const [px, pz, hScale] of [
          [x - 0.66, z + 0.36, 1.0],
          [x + 0.66, z + 0.36, 0.96],
          [x - 0.68, z - 0.26, 0.92],
          [x + 0.68, z - 0.26, 0.95],
        ]) {
          const th = 0.88 * hScale;
          kit.cyl(px, top + th * 0.5, pz, 0.052, th, 0xa29f96, owner);
          kit.cyl(px, top + th + 0.08, pz, 0.046, 0.16, 0x55843c, owner);
          for (let f = 0; f < 7; f++) {
            const fa = (f / 7) * Math.PI * 2 + px;
            kit.box(
              px + Math.sin(fa) * 0.17,
              top + th + 0.165,
              pz + Math.cos(fa) * 0.17,
              0.06,
              0.02,
              0.32,
              f % 2 === 0 ? 0x4b7d38 : 0x659849,
              owner,
              [0.42, fa, 0],
            );
          }
        }
      },
    });

    // 2–20. 高餐校園景觀藝術品（戶外立體雕塑，campus-art.js）：名稱與代碼取自總務處清單，卡片只顯示名稱、代碼與島嶼
    // （CLAUDE.md「Campus art exception」）；造型依照片以 kit 零件建模。
    // the artworks have their own PBR materials (bronze / steel / marble …) and merged meshes, not kit parts
    const campusArt = createCampusArt(THREE, { quality });
    for (const art of ART) {
      const pl = ART_PLACE[art.code];
      if (!pl || !centers.get(pl.island)) continue;
      registerLandmark({
        id: art.id,
        island: pl.island,
        lx: pl.lx,
        lz: pl.lz,
        fpRadius: pl.fp,
        plazaR: pl.fp + 0.1,
        focusY: pl.h * 0.5,
        thumbSize: Math.max(0.7, pl.h * 1.05),
        hero: !!pl.hero,
        pinBaseY: pl.h + 0.04,
        pinY: pl.h + 0.3,
        pinTitle: { zh: `《${art.name}》`, en: art.en || art.name },
        pinSub: { zh: `高餐校園景觀藝術・${art.code}`, en: `Campus art ${art.code}` },
        signZh: art.name,
        signEn: art.en || `Campus art ${art.code}`,
        signLift: 0.12,
        signDz: pl.fp + 0.16,
        badge: art.code,
        category: { zh: `高餐校園景觀藝術・${art.code}`, en: `NKUHT campus art · ${art.code}` },
        name: { zh: `《${art.name}》`, en: art.en ? `${art.en} (${art.code})` : `Campus art ${art.code} · ${art.name}` },
        build(x, z) {
          campusArt.build(art.code, x, z, top, pl.fp);
        },
      });
    }
    window.__landmarkNav = { obstacles: [...campusArt.nav.obstacles, ...(clockTowerModel?.nav.obstacles || [])] };
    if (!silhouetteMode) {
      campusArt.finish(scene);
      for (const m of campusArt.meshes) pickables.push(m);
      if (clockTowerModel) {
        clockTowerModel.finish(scene);
        for (const m of clockTowerModel.meshes) pickables.push(m);
      }
    }

    if (lmPostMats.length && !silhouetteMode) {
      const lmPosts = new THREE.InstancedMesh(
        new THREE.CylinderGeometry(0.012, 0.012, 1, 6),
        new THREE.MeshStandardMaterial({ color: 0x1e2b2a }),
        lmPostMats.length,
      );
      lmPostMats.forEach((m, n) => lmPosts.setMatrixAt(n, m));
      landmarkSignGroup.add(lmPosts);
    }
    // 朝陽鐘樓: swinging bell, real-time hands, Westminster chime on the hour (clock-tower.js)
    if (!debug && !silhouetteMode && clockTowerAt) {
      try {
        clockTower = installClockTower(THREE, { scene, top, x: clockTowerAt.x, z: clockTowerAt.z, faces: clockTowerFaces, camera, frameHooks, reduced, schedule: bellSchedule });
      } catch (e) {
        console.warn("clock tower", e);
      }
    }
    if (!silhouetteMode) {
      scene.add(landmarkSignGroup);
      if (!debug) {
        scene.add(landmarkHaloGroup);
        scene.add(landmarkPinGroup);
      }
    }
  }
  const routeTags = [];
  const WATER_Y_ = -0.18;
  // 高雄港灣區的水域先保留，小島擺設、船隻與海岸小景都避開
  const skylinePlan = silhouetteMode || debug ? [] : planSkyline(centers);
  const skylineReserved = skylinePlan.flatMap((p) => [[p.x, p.z, p.reserve], ...(p.walk ? [[(p.pa.x + p.pb.x) / 2, (p.pa.z + p.pb.z) / 2, 1.3]] : [])]);
  const decor = silhouetteMode ? { ambientSpots: [] } : buildDecor(THREE, kit, D, centers, neighbors, kit.footprints, colors, { heightAt: env.heightAt, bridges, reserved: skylineReserved });
  // 高雄港灣區（城市地景：只有名稱與外型，見 CLAUDE.md 例外條款）：五座可步行的港灣島以橋接回校園，另有會旋轉的大港橋造景。
  // 點浮動牌：有角色時走過去、抵達後出現互動面板；沒有角色時只移動鏡頭。不開系所介紹卡、不給 XP。
  let skyline = null;
  if (skylinePlan.length) {
    try {
      skyline = buildKaohsiungSkyline(THREE, {
        scene,
        centers,
        top,
        quality,
        english,
        reduced,
        CSS2DObject,
        camera,
        controls,
        actions: {
          track: (id) => track("htl_select", { item_type: "skyline", item_id: id }),
          fly: (target, pos) => {
            if (reduced.matches) {
              camera.position.copy(pos);
              controls.target.copy(target);
              controls.update();
              dirty = true;
            } else fly = { time: performance.now(), from: camera.position.clone(), to: pos, old: controls.target.clone(), target };
          },
        },
      });
    } catch (e) {
      console.warn("kaohsiung skyline", e);
    }
  }
  // 海上小島觀景台：每座裝飾小島都以木棧橋接回最近的校園島（避開港灣島與它們的橋）
  let isletWalks = null;
  if (!silhouetteMode && !debug && decor.islets?.length) {
    try {
      const avoid = [];
      for (const p of skylinePlan) {
        avoid.push({ x: p.x, z: p.z, r: p.r || 3.1 });
        if (p.walk) for (let t = 0; t <= 1.001; t += 0.12) avoid.push({ x: p.pa.x + (p.pb.x - p.pa.x) * t, z: p.pa.z + (p.pb.z - p.pa.z) * t, r: 0.4 });
      }
      isletWalks = buildIsletWalks(THREE, { scene, islets: decor.islets, centers, islandR, campusIds: D.islands.map((i) => i.id), top, english, avoid });
    } catch (e) {
      console.warn("islet walks", e);
    }
  }
  // 旅伴交誼島: a wide, open plaza island on the emptiest open water near the campus, bridged to the nearest island
  let plazaIsland = null;
  if (!silhouetteMode && !debug) {
    try {
      const solids = [
        ...skylinePlan.map((p) => ({ x: p.x, z: p.z, r: (p.r || 3.1) + 0.6 })),
        ...(decor.islets || []).map((i) => ({ x: i.x, z: i.z, r: 1.1 * (i.s || 1) + 0.4 })),
        ...(isletWalks?.nav.islands || []).map((i) => ({ x: i.x, z: i.z, r: i.r + 0.4 })),
        ...(marinaPlan?.extents || []).map((q) => ({ x: q.x, z: q.z, r: 2.4 })),
      ];
      const plan = planPlazaIsland({ centers, islandR, campusIds: D.islands.map((i) => i.id), solids, heightAt: env.heightAt, waterY: WATER_Y });
      if (plan) plazaIsland = buildPlazaIsland(THREE, plan, { scene, top, english, CSS2DObject, frameHooks, camera, nextBell: () => clockTower?.next?.() || null });
    } catch (e) {
      console.warn("plaza island", e);
    }
  }
  // 地圖鏡頭：整張地圖（校園島、港灣島、海上小島）都能平移到，全圖距離依畫面比例計算
  const mapCam = installMapCamera(THREE, {
    camera,
    controls,
    stage,
    isMobile: isMobileDevice,
    reduced,
    getDriving: () => !!window.heartIslandAvatar?.S?.drive || document.body.classList.contains("hm-driving"),
    startFly: (target, pos) => {
      zoomTargetDist = null;
      if (reduced.matches) {
        camera.position.copy(pos);
        controls.target.copy(target);
        controls.update();
      } else fly = { time: performance.now(), from: camera.position.clone(), to: pos, old: controls.target.clone(), target };
      dirty = true;
    },
    onPan: () => {
      fly = null;
      releaseAvatarFly();
      dirty = true;
    },
  });
  mapCam.setBounds([
    ...D.islands.map((i) => ({ x: centers.get(i.id).x, z: centers.get(i.id).z, r: islandR(i.id) })),
    ...(skyline?.nav.islands || []).map((i) => ({ x: i.x, z: i.z, r: i.r })),
    ...(decor.islets || []).map((i) => ({ x: i.x, z: i.z, r: 1.1 * (i.s || 1) })),
    ...(marinaPlan?.extents || []),
    ...(plazaIsland ? [{ x: plazaIsland.center.x, z: plazaIsland.center.z, r: plazaIsland.r }] : []),
  ]);
  // 遊艇碼頭: the yacht sails a loop around everything above (marina → 駁二 harbour island → marina)
  if (marinaPlan) {
    try {
      marina = startMarina(THREE, marinaPlan, {
        scene,
        camera,
        frameHooks,
        waterY: WATER_Y,
        campus: { bridges, centers, ringR: (id) => islandR(id) - 0.22 },
        skylineNav: skyline?.nav,
        bounds: mapCam.box,
        english,
        reduced,
        heightAt: env.heightAt,
        // everything solid on the water: campus islands, harbour islands and islets (boats keep clear of these)
        lands: [
          ...D.islands.map((i) => ({ x: centers.get(i.id).x, z: centers.get(i.id).z, r: islandR(i.id) })),
          ...(skyline?.nav.islands || []).map((i) => ({ x: i.x, z: i.z, r: i.r })),
          ...(decor.islets || []).map((i) => ({ x: i.x, z: i.z, r: 1.1 * (i.s || 1) })),
          ...(plazaIsland ? [{ x: plazaIsland.center.x, z: plazaIsland.center.z, r: plazaIsland.r + 0.3 }] : []),
        ],
      });
    } catch (e) {
      console.warn("marina", e);
    }
  }
  if (!silhouetteMode)
    decor.ambientSpots.push(
      ...(centers.has("renewal") ? [
        [-1.02, -0.02],
        [0.98, 0.72],
        [-0.38, -1.05],
        [0.42, -1.02],
      ] : []).map(([x, z]) => ({ role: "worker", island: "renewal", pos: [centers.get("renewal").x + x, 0, centers.get("renewal").z + z], yaw: x * 3, wander: 0.04 })),
      // residents moving boxes once, from the moving truck toward the planned forecourt (renewal: "move only once")
      ...(centers.has("renewal") ? [
        [-0.15, -1.0, 0.0],
        [0.15, 0.05, 0.35],
      ] : []).map(([x, z, yaw]) => ({ role: "citizen", island: "renewal", pos: [centers.get("renewal").x + x, 0, centers.get("renewal").z + z], yaw, wander: 0.1, pose: "boxes" })),
      ...[0, 1].map((k) => ({ role: "traveller", island: "trails", pos: [centers.get("trails").x - 0.4 + k * 0.8, 0, centers.get("trails").z + 1.75], yaw: Math.PI / 2, wander: 0.25 })),
      // NKUHT students gathering at Chaoyang Clock Tower Plaza, Big Gift Box Lawn & Qunxian Welcome Sculpture
      ...(centers.has("water") ? [
        [0.68, 0.68, -0.62, "citizen"],
        [-0.48, 0.66, 0.58, "youth"],
        [0.12, 0.86, 3.12, "child"],
      ] : []).map(([x, z, yaw, role]) => ({ role, island: "water", pos: [centers.get("water").x + x, 0, centers.get("water").z + z], yaw, wander: 0.08 })),
      ...(centers.has("youth") ? [
        [-0.34, 0.58, -2.2, "youth"],
        [-0.44, 0.84, -0.7, "child"],
      ] : []).map(([x, z, yaw, role]) => ({ role, island: "youth", pos: [centers.get("youth").x + x, 0, centers.get("youth").z + z], yaw, wander: 0.08 })),
      ...(centers.has("family") ? [
        [-0.38, 0.54, 0.45, "citizen"],
        [0.38, 0.54, -0.45, "parent"],
      ] : []).map(([x, z, yaw, role]) => ({ role, island: "family", pos: [centers.get("family").x + x, 0, centers.get("family").z + z], yaw, wander: 0.06 })),
    );
  // warm light pools under lamps at night (additive, decorative)
  const poolTex = (() => {
    const c = document.createElement("canvas");
    c.width = c.height = 64;
    const g = c.getContext("2d");
    const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    grd.addColorStop(0, "rgba(255,214,150,1)");
    grd.addColorStop(1, "rgba(255,214,150,0)");
    g.fillStyle = grd;
    g.fillRect(0, 0, 64, 64);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  })();
  const poolMat = new THREE.MeshBasicMaterial({ map: poolTex, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -8 });
  const poolGeo = new THREE.PlaneGeometry(1.15, 1.15).rotateX(-Math.PI / 2);
  const pools = new THREE.InstancedMesh(poolGeo, poolMat, Math.max(1, (decor.lampSpots || []).length));
  (decor.lampSpots || []).forEach(([x, y, z], n) => {
    const m = new THREE.Matrix4().makeTranslation(x, Math.max(y, top) + 0.06, z);
    pools.setMatrixAt(n, m);
  });
  pools.renderOrder = 3;
  if (!debug) scene.add(pools);
  // A1: soft warm glow over each island at night + rotating lighthouse beams + string lights
  // warm window spill under every policy model
  const spillMat = new THREE.MeshBasicMaterial({ map: poolTex, color: 0xffc98a, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -8 });
  const spill = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), spillMat, visual.size);
  [...visual.values()].forEach((v, n) => spill.setMatrixAt(n, new THREE.Matrix4().compose(new THREE.Vector3(v.center.x, top + 0.065, v.center.z), new THREE.Quaternion(), new THREE.Vector3(2.2 * (v.size || 0.6), 1, 2.2 * (v.size || 0.6)))));
  spill.renderOrder = 3;
  if (!debug) scene.add(spill);
  const islandGlowGeo = new THREE.PlaneGeometry(4.2, 4.2).rotateX(-Math.PI / 2);
  const islandGlowMat = poolMat.clone();
  const islandGlow = new THREE.InstancedMesh(islandGlowGeo, islandGlowMat, D.islands.length);
  D.islands.forEach((i, n) => {
    const gs = islandR(i.id) / R;
    islandGlow.setMatrixAt(
      n,
      new THREE.Matrix4().compose(
        new THREE.Vector3(centers.get(i.id).x, top + 0.07, centers.get(i.id).z),
        new THREE.Quaternion(),
        new THREE.Vector3(gs, 1, gs),
      ),
    );
  });
  islandGlow.renderOrder = 3;
  if (!debug) scene.add(islandGlow);
  const beamMat = new THREE.MeshBasicMaterial({ color: 0xfff1c4, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
  const beamGeo = new THREE.ConeGeometry(0.45, 2.6, 16, 1, true).translate(0, -1.3, 0).rotateZ(Math.PI / 2);
  const beams = [];
  for (const [x, y, z] of decor.lighthouses || []) {
    const b = new THREE.Mesh(beamGeo, beamMat);
    b.position.set(x, y, z);
    b.renderOrder = 4;
    if (!debug) scene.add(b);
    beams.push(b);
  }
  const stringMat = new THREE.MeshBasicMaterial({ color: 0xffd58a, transparent: true, opacity: 0 });
  const stringGeo = new THREE.SphereGeometry(0.03, 6, 4);
  const strings = new THREE.InstancedMesh(stringGeo, stringMat, Math.max(1, (decor.stringLights || []).length));
  (decor.stringLights || []).forEach(([x, y, z], n) => strings.setMatrixAt(n, new THREE.Matrix4().makeTranslation(x, y, z)));
  if (!debug) scene.add(strings);
  // partner-city name tags at sea-route ends (names from the city-diplomacy policy page only)
  // partner-city name tags removed (2026-10-14); the hill-tower and rowhouse models stay
  // two ferries shuttling out and back along the exchange routes (animation only)
  const ferries = [];
  (decor.routes || []).slice(0, 2).forEach((r, k) => {
    const g = new THREE.Group();
    const hull = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.09, 0.5), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6 }));
    hull.position.y = 0.04;
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.1, 0.22), new THREE.MeshStandardMaterial({ color: k % 2 ? 0x3e7c8c : colors.coral, roughness: 0.6 }));
    cabin.position.set(0, 0.13, -0.05);
    const crate = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.07, 0.08), new THREE.MeshStandardMaterial({ color: 0xc9a27a }));
    crate.position.set(0, 0.12, 0.15);
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), new THREE.MeshBasicMaterial({ color: 0xfff0c2, transparent: true, opacity: 0 }));
    lamp.position.set(0, 0.24, -0.05);
    g.add(hull, cabin, crate, lamp);
    g.traverse((m) => (m.castShadow = false)); // moving: kept out of the static shadow map (a boat's shadow on water is barely visible)
    g.position.set(r.start[0], WATER_Y_ + 0.02, r.start[1]);
    if (!debug) scene.add(g);
    ferries.push({ g, r, phase: k * 0.37, crate, lamp });
  });
  // materials for the instanced kit
  const solidMat = new THREE.MeshStandardMaterial({ roughness: 0.72, metalness: 0.04 });
  solidMat.customProgramCacheKey = () => "htl-solid-v2";
  solidMat.onBeforeCompile = (sh) => {
    sh.vertexShader = `varying vec3 vHtlWPos;\nvarying vec3 vHtlLPos;\n` + sh.vertexShader.replace(
      "#include <worldpos_vertex>",
      `#include <worldpos_vertex>\n  vHtlLPos = position;\n  #ifdef USE_INSTANCING\n    vHtlWPos = (modelMatrix * instanceMatrix * vec4(position, 1.0)).xyz;\n  #else\n    vHtlWPos = (modelMatrix * vec4(position, 1.0)).xyz;\n  #endif`
    );
    sh.fragmentShader = `varying vec3 vHtlWPos;\nvarying vec3 vHtlLPos;\n` + sh.fragmentShader.replace(
      "#include <color_fragment>",
      `#include <color_fragment>
      float htlGroundAO = smoothstep(0.64, 0.92, vHtlWPos.y) * 0.14 + 0.86;
      float htlTopBevel = smoothstep(0.32, 0.5, vHtlLPos.y) * 0.045;
      float htlGrain = fract(sin(dot(floor(vHtlWPos.xz * 38.0), vec2(12.9898, 78.233))) * 43758.5453);
      diffuseColor.rgb = diffuseColor.rgb * htlGroundAO + vec3(htlTopBevel) + (htlGrain - 0.5) * 0.018;`
    );
  };
  const glowMat = new THREE.MeshStandardMaterial({ roughness: 0.25, metalness: 0.12, emissive: 0xffc777, emissiveIntensity: 0 });
  glowMat.customProgramCacheKey = () => "htl-glow-v2";
  glowMat.onBeforeCompile = (sh) => {
    sh.vertexShader = `varying vec3 vHtlLPos;\n` + sh.vertexShader.replace(
      "#include <begin_vertex>",
      `#include <begin_vertex>\n  vHtlLPos = position;`
    );
    sh.fragmentShader = `varying vec3 vHtlLPos;\n` + sh.fragmentShader.replace(
      "#include <color_fragment>",
      `#include <color_fragment>
      float mullionX = smoothstep(0.43, 0.49, abs(vHtlLPos.x));
      float mullionY = smoothstep(0.41, 0.48, abs(vHtlLPos.y));
      float frame = max(mullionX, mullionY);
      float roomGrad = 0.88 + 0.18 * (vHtlLPos.y + 0.5);
      diffuseColor.rgb = mix(diffuseColor.rgb * roomGrad, diffuseColor.rgb * 0.58, frame * 0.55);`
    );
  };
  const setGlow = (v) => {
    glowMat.emissiveIntensity = v;
    for (const m of glowMat.userData.clones || []) m.emissiveIntensity = v;
  };
  const staticMeshes = kit.build(scene, { solid: silhouetteMode ? new THREE.MeshBasicMaterial({ color: 0x000000 }) : solidMat, glow: silhouetteMode ? new THREE.MeshBasicMaterial({ color: 0x000000 }) : glowMat });
  pickables.push(...staticMeshes, ...landmarkPickMeshes, ...(env.skyFleet?.pickables || []));
  for (const m of staticMeshes) {
    (m.userData.items || []).forEach((p, idx) => {
      if (p.owner && LANDMARKS.has(p.owner)) LANDMARKS.get(p.owner).parts.push({ mesh: m, index: idx, color: p.color });
    });
  }
  for (const v of islandBodies.values()) pickables.push(v.top, v.cliff);
  // island sides use the sea's own material, so the edge below the rim reads as water from every angle and time
  if (!debug) for (const v of islandBodies.values()) v.cliff.material = env.waterMat;
  // island labels hang on the front cliff
  const shortNames = { hakka: "外語跨文化", water: "校園專業教室", ai: "PMS資訊系統", renewal: "升學就業", civil: "系務核心沿革", institute: "教育理念目標", transport: "三明治與實習", education: "課程標準表", lunch: "餐飲與酒類", family: "群賢會館", card: "1+3畢業條件", welfare: "專任師資陣容", sport: "實習旅館專島", trails: "菁英實習制度", forest: "系務規章", youth: "講座競賽活動", diplomacy: "國際交流", luxury: "奢華體驗管家", innovation: "數位創新基地", esg: "永續研發USR" };
  const islandViews = new Map();
  for (const i of D.islands) {
    const c = centers.get(i.id),
      body = islandBodies.get(i.id);
    const el = document.createElement("button");
    el.className = "island-label";
    el.innerHTML = `<strong>${String(i.number).padStart(2, "0")}</strong>${esc(english ? txt(i.name) : shortNames[i.id])}`;
    el.setAttribute("aria-label", txt(i.name));
    el.onclick = () => selectIsland(i.id);
    const label = new CSS2DObject(el);
    label.position.set(c.x, top - 0.25, c.z + islandR(i.id) + 0.05);
    scene.add(label);
    islandViews.set(i.id, { ...body, label, el });
  }
  const portPositions = { housing: [-7.0, 0.8, 7.5], "street-retail": [-7.7, 0.8, 5.4], police: [7.0, 0.8, 0.8], community: [1.0, 0.8, 18.2], farm: [7.0, 0.8, -6.6] };
  const portViews = new Map();
  for (const p of D.ports) {
    const c = new THREE.Vector3(...portPositions[p.id]);
    centers.set(p.id, c);
    const el = document.createElement("span");
    el.className = "port-label";
    el.textContent = txt(p.name);
    const label = new CSS2DObject(el);
    label.position.copy(c);
    label.visible = false;
    scene.add(label);
    portViews.set(p.id, label);
  }
  // flow edges (same evidence rules as before), drawn along the real walking routes
  const graph = buildGraph(THREE, D, centers, neighbors, bridges);
  const paths = [];
  for (const f of D.flows)
    for (const from of f.from)
      for (const to of f.to) {
        if (f.excludedEdges?.includes(to) || from === to) continue;
        const tier = f.edgeNotes?.find((e) => e.to === to)?.tier || f.evidenceTier;
        if (tier === "unverified_no_animation") continue;
        if (!centers.get(from) || !centers.get(to)) continue;
        paths.push({ flow: f.id, from, to, tier });
      }
  const islandsMap = islands;
  // 2026-10-26 彩蛋：旅館島島主大約每 10 次造訪出現 1 次；網址加 ?islandlord 或 #islandlord 可強制出現（預覽、QA 用）
  window.__heartTrack = (name) => track(name);
  const islandLord = false; // 移除非旅館系之虛構高爾夫彩蛋角色，僅保留旅館管理系 10 位專任師長與學生實習角色
  const peopleSys = createPeople(THREE, scene, { graph, flowsData: D.flows, paths, islandsMap, centers, top, reduced, quality, colors, ambientSpots: decor.ambientSpots, islandLord });
  for (const m of peopleSys.meshes) pickables.push(m);
  const routeScene = new THREE.Scene();
  // chevrons along the tube (u runs from the start of the route to its end); weak links get dots instead
  const routeTexCache = {};
  function routeTex(weak) {
    const k = weak ? "w" : "s";
    if (routeTexCache[k]) return routeTexCache[k];
    const cv = document.createElement("canvas");
    cv.width = 64;
    cv.height = 16;
    const g = cv.getContext("2d");
    if (weak) {
      g.fillStyle = "#fff";
      g.beginPath();
      g.arc(20, 8, 5, 0, Math.PI * 2);
      g.fill();
    } else {
      g.fillStyle = "rgba(255,255,255,0.86)";
      g.fillRect(0, 0, 64, 16);
      g.fillStyle = "#fff";
      g.beginPath();
      g.moveTo(22, 0);
      g.lineTo(40, 8);
      g.lineTo(22, 16);
      g.lineTo(30, 16);
      g.lineTo(48, 8);
      g.lineTo(30, 0);
      g.closePath();
      g.fill();
    }
    const t = new THREE.CanvasTexture(cv);
    t.colorSpace = THREE.SRGBColorSpace;
    t.wrapS = THREE.RepeatWrapping;
    t.wrapT = THREE.ClampToEdgeWrapping;
    routeTexCache[k] = t;
    return t;
  }
  for (const p of paths) {
    if (p.degenerate) continue; // 路線縮在同一座島上（例如 F8 運動 → 社區）：不畫線、不派人（見 people.js）
    // 2026-10-29: follow the route's own height (walkway + 0.03; over a bridge the arched deck) instead of one flat height
    const pts = (p.route ? p.route.pts : [centers.get(p.from), centers.get(p.to)]).map((v) => v.clone().setY((p.route ? v.y : top + 0.03) + 0.03));
    const curve = new THREE.CurvePath();
    for (let k = 1; k < pts.length; k++) curve.add(new THREE.LineCurve3(pts[k - 1], pts[k]));
    if (!curve.curves.length) continue;
    // 學習路線 (flow-themes.js): colour by theme; weak links are thin dashes; the F1 hub is drawn faint
    const theme = themeOf(p.flow),
      weak = WEAK_FLOWS.has(p.flow),
      hub = HUB_FLOWS.has(p.flow);
    // standard material + a scrolling chevron texture (direction of travel); colour by theme, no fog / tone mapping
    const len = curve.getLength();
    const tex = routeTex(weak).clone();
    tex.needsUpdate = true;
    tex.repeat.set(Math.max(1, Math.round(len * (weak ? 3.2 : 2.4))), 1);
    const pathMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(theme ? theme.color : colors.coral).lerp(new THREE.Color(0xffffff), 0.12).multiplyScalar(1.15),
      map: tex,
      transparent: true,
      opacity: hub ? 0.42 : weak ? 0.75 : 0.95,
      depthWrite: false,
      depthTest: false,
      fog: false,
      toneMapped: false,
    });
    pathMat.userData.noPalette = true;
    const mesh = new THREE.Mesh(new THREE.TubeGeometry(curve, Math.max(24, pts.length * 6), weak ? 0.04 : hub ? 0.045 : 0.08, 6, false), pathMat);
    mesh.visible = false;
    // 2026-10-29: a fixed draw order per line. Lines sharing a walkway were transparent at the same depth, so their
    // order was re-sorted by distance every frame and the overlap flickered as the camera moved.
    mesh.renderOrder = 2 + paths.indexOf(p) / 1000;
    mesh.userData = { type: "flow", id: p.flow };
    // white casing under the coloured line (as on a printed map), so every theme colour reads on water, lawn or roofs
    if (!weak) {
      const casing = new THREE.Mesh(new THREE.TubeGeometry(curve, Math.max(24, pts.length * 6), hub ? 0.07 : 0.125, 6, false), new THREE.MeshBasicMaterial({ color: 0xfffaf0, transparent: true, opacity: hub ? 0.5 : 0.92, depthWrite: false, depthTest: false, fog: false, toneMapped: false }));
      casing.material.userData.noPalette = true;
      casing.renderOrder = mesh.renderOrder - 0.5;
      casing.raycast = () => {};
      mesh.add(casing);
    }
    // routes live in their own overlay scene, drawn after the main frame: the post chain (AO / bloom) dropped these
    // depth-less transparent tubes, so on desktop the selected route never showed at all
    routeScene.add(mesh);
    pickables.push(mesh);
    p.mesh = mesh;
  }
  const flowPaths = paths.filter((p) => p.mesh);

  // ---------- debug renders (QA only) ----------
  if (debug) {
    for (const v of islandBodies.values()) {
      v.ring.visible = debug !== "silhouette";
      v.curb.visible = debug !== "silhouette";
    }
    env.setVisible(false);
    for (const m of peopleSys.meshes) m.visible = debug === "ground";
    if (debug === "occupancy" || debug === "silhouette") for (const m of peopleSys.meshes) m.visible = false;
    if (debug === "occupancy") for (const [id, v] of islandBodies) if (id === debugIsland) v.top.material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    if (debug === "silhouette") for (const v of islandBodies.values()) v.top.material = new THREE.MeshBasicMaterial({ color: 0xffffff });
    if (debug !== "ground") for (const v of islandBodies.values()) (v.cliff.visible = false), (v.band.visible = false);
    if (debug !== "ground") {
      renderer.toneMapping = THREE.NoToneMapping;
      scene.add(new THREE.AmbientLight(0xffffff, 1.6));
    }
    if ((debug === "occupancy" || debug === "silhouette") && centers.get(debugIsland)) {
      const c = centers.get(debugIsland);
      const dr = islandR(debugIsland);
      const pad = 0.02;
      renderer.localClippingEnabled = false;
      renderer.clippingPlanes = [
        new THREE.Plane(new THREE.Vector3(1, 0, 0), -(c.x - dr - pad)),
        new THREE.Plane(new THREE.Vector3(-1, 0, 0), c.x + dr + pad),
        new THREE.Plane(new THREE.Vector3(0, 0, 1), -(c.z - dr - pad)),
        new THREE.Plane(new THREE.Vector3(0, 0, -1), c.z + dr + pad),
      ];
      const s = dr * 1.05;
      debugCam = new THREE.OrthographicCamera(-s, s, s, -s, 0.1, 100);
      if (debug === "occupancy") {
        debugCam.position.set(c.x, 30, c.z);
        debugCam.up.set(0, 0, -1);
        debugCam.lookAt(c.x, 0, c.z);
      } else {
        debugCam.top = 3.2;
        debugCam.bottom = -0.2;
        debugCam.position.set(c.x, top + 1.5, c.z + 20);
        debugCam.lookAt(c.x, top + 1.5, c.z);
        debugCam.top = 1.75;
        debugCam.bottom = -1.75;
      }
      debugCam.updateProjectionMatrix();
    }
  }
  const dummy = new THREE.Object3D();
  var debugCam = debugCam || null;
  function setGhosts(v) {
    renewalGhosts.traverse((o) => (o.visible = v));
    renewalGhosts.visible = v;
  }
  setGhosts(false);
  let selectedIsland = null,
    selectedBuilding = null,
    selectedFlows = new Set(),
    selectedHeart = new Set(),
    mode = "day",
    termIndex = 0,
    dayPlaying = false,
    dayMinutes = 600,
    fly = null,
    tourActive = false,
    tourPlaying = false,
    tourSeconds = 0,
    tourCue = -1,
    treeMode = "policies",
    motionTime = 0,
    dirty = true,
    selectedWalker = null,
    selectedSkyCraft = null,
    skyFollowAnchor = null;
  let lastTime = performance.now(),
    fpsFrames = 0,
    fpsStart = lastTime,
    fps = 0;
  const safeSel = [".brand", ".mob-top-actions", ".hero-note", ".toolbar", ".hud", ".card:not([hidden])", ".controls", ".log.open", ".hm-panel.open", ".hm-pad.open", ".map-meta", "#sidebar", ".tour-caption", ".tour-controls", ".mascot", ".zoom-ui", ".qp-hud"];
  let lastClip = -1e9,
    clipSig = "",
    clipCost = 0;
  function labelSignature() {
    // inline styles only (no layout): which CSS2D labels are shown, plus selection, panels and viewport
    let shown = 0;
    for (const el of labelRenderer.domElement.children) if (el.style.display !== "none") shown++;
    return `${shown}|${selectedIsland}|${selectedBuilding}|${selectedLandmark}|${[...selectedFlows].join()}|${document.body.className}|${innerWidth}x${innerHeight}`;
  }
  // 2026-10-25 rewrite: same decisions as before, but without layout thrashing. The old version wrote a style and then
  // measured, label by label and offset by offset (dozens of forced layouts per call, ~5ms when following the avatar).
  // Now: (1) read every rect once, (2) work out each label's natural box from its current box minus its current margins
  // (sizes of the shrunk "number only"/"mini" variants are measured once and cached), (3) decide arithmetically,
  // (4) write only what changed. Moving a label by a margin moves its box by exactly that much (labels are absolutely
  // positioned and centred by CSS2DRenderer), so the arithmetic matches what measuring would have returned.
  const boxAt = (cx, cy, w, h, dx = 0, dy = 0) => ({ left: cx - w / 2 + dx, right: cx + w / 2 + dx, top: cy - h / 2 + dy, bottom: cy + h / 2 + dy, width: w, height: h });
  function variantSize(el, cls, key, on = true) {
    // measure the size of a label with a class switched on (e.g. "numonly", "mini") or off (its full size) once;
    // the text never changes, so the cache holds (full sizes are refreshed whenever a label is seen at full size)
    if (el[key]) return el[key];
    const had = el.classList.contains(cls);
    if (had !== on) el.classList.toggle(cls, on);
    const r = el.getBoundingClientRect();
    if (had !== on) el.classList.toggle(cls, had);
    return (el[key] = [r.width, r.height]);
  }
  const setStyle = (el, k, v) => { if (el.style[k] !== v) el.style[k] = v; };
  const setClass = (el, c, on) => { if (el.classList.contains(c) !== on) el.classList.toggle(c, on); };
  let uiRectsCache = null,
    stageRectCache = null,
    uiRectsCacheAt = 0,
    uiRectsCacheSig = "";
  addEventListener("resize", () => {
    uiRectsCache = null;
  });
  function clipLabels(forceUIRefresh = false) {
    // ---- 1. read: UI rects (cached across steady camera pans), then every label's current box (one layout pass)
    const nowPerf = performance.now();
    const isMobScreen = innerWidth <= 800;
    const isVisUI = (e) => {
      if (!e || e.hidden) return false;
      const cs = getComputedStyle(e);
      if (cs.display === "none" || cs.visibility === "hidden" || parseFloat(cs.opacity) < 0.05) return false;
      const r = e.getBoundingClientRect();
      return r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth;
    };
    const curLayoutSig = `${innerWidth}x${innerHeight}|${document.body.className}|${$("#card")?.hidden ? 0 : 1}|${$("#sidebar")?.className || ""}`;
    if (forceUIRefresh || !uiRectsCache || curLayoutSig !== uiRectsCacheSig || nowPerf - uiRectsCacheAt > 320) {
      const uiList = safeSel.flatMap((s) => [...document.querySelectorAll(s)]).filter(isVisUI).map((e) => e.getBoundingClientRect());
      for (const b of document.querySelectorAll(".toolbar button, .toolbar .tb-link, .hud button, .toggles button")) {
        if (!isVisUI(b)) continue;
        uiList.push(b.getBoundingClientRect());
      }
      uiRectsCache = uiList;
      stageRectCache = stage.getBoundingClientRect();
      uiRectsCacheAt = nowPerf;
      uiRectsCacheSig = curLayoutSig;
    }
    const ui = uiRectsCache;
    const sr = stageRectCache;
    const over = (a, q, m = 2) => a.right > q.left - m && a.left < q.right + m && a.bottom > q.top - m && a.top < q.bottom + m;
    const root = labelRenderer.domElement;
    const lmPins = [...root.querySelectorAll(".landmark-pin")].filter((el) => el.style.display !== "none");
    const isl = [...root.querySelectorAll(".island-label")].filter((el) => el.style.display !== "none");
    const pins = [...root.querySelectorAll(".item-pin")].filter((el) => el.style.display !== "none");
    const extras = [...root.querySelectorAll(".puma-extra")].filter((el) => el.style.display !== "none");
    const tags = [...root.querySelectorAll(".name-tag,.ghost-label,.route-tag")].filter((el) => el.style.display !== "none");
    const cur = new Map();
    for (const el of [...lmPins, ...isl, ...pins, ...tags]) cur.set(el, el.getBoundingClientRect());
    for (const el of extras) cur.set(el, el.firstElementChild.getBoundingClientRect());
    // natural centre = current centre minus the margins we applied last time
    const centre = (el) => {
      const r = cur.get(el);
      return [(r.left + r.right) / 2 - (parseFloat(el.style.marginLeft) || 0), (r.top + r.bottom) / 2 - (parseFloat(el.style.marginTop) || 0)];
    };
    // full-size boxes are re-cached whenever a label is currently full size (so a language switch updates them)
    for (const el of lmPins) { const r = cur.get(el); if (r.width) el._full = [r.width, r.height]; }
    for (const el of isl) if (!el.classList.contains("numonly")) { const r = cur.get(el); if (r.width) el._full = [r.width, r.height]; }
    for (const el of pins) if (!el.classList.contains("mini")) { const r = cur.get(el); if (r.width) el._full = [r.width, r.height]; }

    // ---- 2. decide
    // campus landmark & public art pins: selected/hovered first, then hero monuments (Clock Tower & Gift Box), then remaining art
    const lmRank = (el) => (el.classList.contains("sel") || el.classList.contains("hot") ? 0 : el.classList.contains("landmark-pin-hero") ? 1 : 2);
    lmPins.sort((a, b) => lmRank(a) - lmRank(b));
    const keptLmPins = [];
    const lmOut = new Map();
    const lmPad = isMobScreen ? 4 : 2;
    for (const el of lmPins) {
      const cr = cur.get(el);
      if (!cr?.width && !el._full) continue;
      const [cx, cy] = centre(el);
      const forced = el.classList.contains("sel") || el.classList.contains("hot");
      const full = el._full || [cr.width, cr.height];
      const badLm = (rr) =>
        rr.left < sr.left + lmPad ||
        rr.right > sr.right - lmPad ||
        rr.top < sr.top + lmPad ||
        rr.bottom > sr.bottom - lmPad ||
        ui.some((q) => over(rr, q, 1)) ||
        (!forced && keptLmPins.some((q) => over(rr, q, 3)));
      let r = boxAt(cx, cy, full[0], full[1]);
      let hit = badLm(r), dx = 0, dy = 0;
      if (hit) {
        const lmOffs = [[0, -20], [0, 20], [-38, 0], [38, 0], [-32, -18], [32, -18], [-32, 18], [32, 18], [0, -38], [0, 38]];
        for (const [ox, oy] of lmOffs) {
          const rr = boxAt(cx, cy, full[0], full[1], ox, oy);
          if (!badLm(rr)) {
            dx = ox;
            dy = oy;
            r = rr;
            hit = false;
            break;
          }
        }
      }
      if (hit && forced) {
        const q = ui.find((qq) => over(r, qq, 1));
        if (q) {
          const toR = q.right + 8 - r.left, toL = q.left - 8 - r.right;
          const d = Math.abs(toR) < Math.abs(toL) && r.right + toR <= sr.right - 2 ? toR : r.left + toL >= sr.left + 2 ? toL : 0;
          if (d && Math.abs(d) < 260) {
            dx = d;
            r = boxAt(cx, cy, full[0], full[1], dx, dy);
            hit = ui.some((qq) => over(r, qq, 1));
          }
        }
      }
      if (!hit) keptLmPins.push(r);
      lmOut.set(el, { dx, dy, hit, r });
    }
    // island labels: selected first, then active, then by number; hide those under UI or colliding with a kept label
    const rank = (el) => (el.classList.contains("selected") ? 0 : el.classList.contains("dim") ? 2 : 1);
    isl.sort((a, b) => rank(a) - rank(b));
    const keptIsl = [];
    const islOut = new Map();
    for (const el of isl) {
      if (!cur.get(el).width && !el._full) continue;
      const [cx, cy] = centre(el);
      const full = el._full || variantSize(el, "numonly", "_full", false);
      // hysteresis: a shown label needs a clear overlap to hide, a hidden one needs clear space to come back
      const m = el.dataset.vis === "0" ? 8 : -2;
      const bad = (rr) => ui.some((q) => over(rr, q, m)) || keptLmPins.some((q) => over(rr, q, 2)) || keptIsl.some((q) => over(rr, q, 3 + m)) || rr.left < sr.left - m || rr.right > sr.right + m || rr.top < sr.top - m;
      let r = boxAt(cx, cy, full[0], full[1]);
      let hit = bad(r), dx = 0, dy = 0, numonly = false;
      // 先試上次用的位移：鏡頭移動時標籤不會在幾個位置之間跳來跳去
      const offs = [[0, 26], [0, -26], [-46, 0], [46, 0], [-46, -14], [46, 14], [0, 50]];
      const last = el.dataset.off === undefined ? -1 : +el.dataset.off;
      const order = offs.map((_, i) => i);
      if (last >= 0 && last < offs.length) order.splice(order.indexOf(last), 1), order.unshift(last);
      let used = -1;
      for (const i of order) {
        if (!hit) break;
        [dx, dy] = offs[i];
        r = boxAt(cx, cy, full[0], full[1], dx, dy);
        hit = bad(r);
        if (!hit) used = i;
      }
      if (hit) {
        // last resort: shrink to the number badge only (full name on hover / in the list)
        const small = variantSize(el, "numonly", "_num");
        numonly = true;
        for (const [ox, oy] of [[0, 0], [0, 22], [0, -22], [-30, 0], [30, 0]]) {
          [dx, dy] = [ox, oy];
          r = boxAt(cx, cy, small[0], small[1], dx, dy);
          hit = bad(r);
          if (!hit) break;
        }
        if (hit) (numonly = false), (dx = dy = 0), (r = boxAt(cx, cy, full[0], full[1]));
      }
      if (!hit) keptIsl.push(r);
      islOut.set(el, { dx, dy, numonly, hit, used, r });
    }
    // item pins
    // 2026-11-12 (island 09 LOD): hotel names nearest the selected hotel (or the stage centre) claim space first; the rest
    // collapse to their number badge instead of piling up, and show their name again on hover or as the camera comes closer
    const pinForced = (el) => el.classList.contains("hot") || el.classList.contains("sel");
    const selPin = pins.find((el) => el.classList.contains("sel") && cur.get(el).width);
    const focusXY = selPin ? centre(selPin) : [(sr.left + sr.right) / 2, (sr.top + sr.bottom) / 2];
    const focusD = (el) => {
      const [x, y] = centre(el);
      return Math.hypot(x - focusXY[0], y - focusXY[1]);
    };
    const isHotelEl = (el) => el.classList.contains("hotel-name-pin");
    pins.sort((a, b) => (pinForced(b) ? 1 : 0) - (pinForced(a) ? 1 : 0) || (isHotelEl(a) && isHotelEl(b) ? focusD(a) - focusD(b) : 0));
    const keptPins = [];
    const pinOut = new Map();
    for (const el of pins) {
      if (!cur.get(el).width) continue;
      const [cx, cy] = centre(el);
      const forced = el.classList.contains("hot") || el.classList.contains("sel");
      const isHotelPin = el.classList.contains("hotel-zone-pin") || el.classList.contains("hotel-name-pin");
      const full = el._full || variantSize(el, "mini", "_full", false);
      const mini0 = !isHotelPin && el.classList.contains("compact") && !forced; // compact pins are always the small badge
      let mini = mini0;
      let size = mini ? variantSize(el, "mini", "_mini") : full;
      let r = boxAt(cx, cy, size[0], size[1]);
      const edgePad = isMobScreen ? 5 : 2;
      const outStage = (rr) => rr.left < sr.left + edgePad || rr.right > sr.right - edgePad || rr.top < sr.top + edgePad || rr.bottom > sr.bottom - edgePad;
      // hysteresis: a pin that was collapsed last frame needs clear space (8px) to expand again
      const pm = isHotelPin ? (el.dataset.mini === "1" ? 6 : -3) : el.dataset.mini === "1" ? 8 : -2;
      const hits = (rr) => outStage(rr) || ui.some((q) => over(rr, q, isHotelPin ? 0 : pm)) || (!forced && !isHotelPin && keptLmPins.some((q) => over(rr, q, 2))) || (!forced && keptPins.some((q) => over(rr, q, isHotelPin ? (el.dataset.mini === "1" ? 6 : isMobScreen ? -1 : -2) : 1 + pm)));
      let hit = hits(r);
      let dx = 0, dy = 0, slid = false;
      // Clamp horizontal viewport bleed first so pins near screen left/right edges tuck cleanly inside
      if (outStage(r) && !mini) {
        let clampX = 0;
        if (r.left < sr.left + edgePad) clampX = sr.left + edgePad - r.left;
        else if (r.right > sr.right - edgePad) clampX = sr.right - edgePad - r.right;
        if (clampX && Math.abs(clampX) < 120) {
          const rc = boxAt(cx, cy, size[0], size[1], clampX, 0);
          if (!hits(rc)) {
            dx = clampX;
            slid = true;
            r = rc;
            hit = false;
          }
        }
      }
      if (hit && !mini) {
        // Try multi-direction offsets so full text stays visible before collapsing to number-only
        const offsets = isHotelPin
          ? [
              // short hops only: on the compact island a name pushed 40–60 px away reads as the neighbouring tower's
              [0, -22], [0, 22], [-34, 0], [34, 0],
              [-28, -20], [28, 20], [-28, 20], [28, -20],
            ]
          : [[0, -24], [0, 24], [-38, 0], [38, 0], [-30, -22], [30, 22], [-30, 22], [30, -22], [0, -46], [0, 46]];
        for (const [ox, oy] of offsets) {
          const rr = boxAt(cx, cy, size[0], size[1], ox, oy);
          if (!hits(rr)) {
            dx = ox;
            dy = oy;
            r = rr;
            hit = false;
            break;
          }
        }
      }
      if (hit && !forced) {
        // collapse to the number badge (island 09 hotels included since its 2026-11-12 compaction); a badge is never
        // dropped unless it sits under the UI
        mini = true;
        dx = dy = 0;
        size = variantSize(el, "mini", "_mini");
        r = boxAt(cx, cy, size[0], size[1]);
        hit = outStage(r) || ui.some((q) => over(r, q));
      }
      if (hit) {
        // still under a panel: slide the badge just clear of the panel edge (left or right)
        const q = ui.find((q) => over(r, q));
        if (q) {
          const toRight = q.right + 6 - r.left,
            toLeft = q.left - 6 - r.right;
          // keep sliding to the same side as last frame unless the other side is clearly shorter
          // and never onto a side that would push it off the stage
          const fitsR = r.right + toRight <= sr.right - 2,
            fitsL = r.left + toLeft >= sr.left + 2;
          let side = el.dataset.side === "L" ? (Math.abs(toRight) + 40 < Math.abs(toLeft) ? "R" : "L") : el.dataset.side === "R" ? (Math.abs(toLeft) + 40 < Math.abs(toRight) ? "L" : "R") : Math.abs(toRight) < Math.abs(toLeft) ? "R" : "L";
          if (side === "R" && !fitsR && fitsL) side = "L";
          else if (side === "L" && !fitsL && fitsR) side = "R";
          el.dataset.side = side;
          const d = side === "R" ? toRight : toLeft;
          if (Math.abs(d) < 260) {
            dx = d;
            slid = true;
            r = boxAt(cx, cy, size[0], size[1], dx, dy);
            hit = ui.some((qq) => over(r, qq)) || r.left < sr.left || r.right > sr.right;
          }
        }
      }
      if (!hit) keptPins.push(r);
      pinOut.set(el, { mini, mini0, dx, dy, slid, hit });
    }
    // other islands' labels give way to the explored island's item pins
    if (keptPins.length)
      for (const [el, o] of islOut) {
        if (el.classList.contains("selected") || o.hit) continue;
        if (keptPins.some((q) => over(o.r, q, 2))) o.hit = true;
      }

    // ---- 3. write (only what changed)
    for (const [el, o] of lmOut) {
      setStyle(el, "marginLeft", o.dx ? o.dx + "px" : "");
      setStyle(el, "marginTop", o.dy ? o.dy + "px" : "");
      setStyle(el, "visibility", o.hit ? "hidden" : "");
    }
    for (const [el, o] of islOut) {
      setClass(el, "numonly", o.numonly);
      setStyle(el, "marginLeft", o.dx ? o.dx + "px" : "");
      setStyle(el, "marginTop", o.dy ? o.dy + "px" : "");
      setStyle(el, "visibility", o.hit ? "hidden" : "");
      el.dataset.vis = o.hit ? "0" : "1";
      el.dataset.off = String(o.used);
    }
    for (const [el, o] of pinOut) {
      setClass(el, "mini", o.mini);
      setClass(el, "slid", o.slid);
      setStyle(el, "marginLeft", o.dx ? o.dx + "px" : "");
      setStyle(el, "marginTop", o.dy ? o.dy + "px" : "");
      setStyle(el, "visibility", o.hit ? "hidden" : "");
      el.dataset.mini = o.mini && !el.classList.contains("compact") ? "1" : "0";
    }
    const keptExtras = [];
    for (const el of extras) {
      const r = cur.get(el);
      if (!r.width) continue;
      const hit = ui.some((q) => over(r, q, 4)) || keptLmPins.some((q) => over(r, q, 2)) || keptIsl.some((q) => over(r, q, 2)) || keptPins.some((q) => over(r, q, 2)) || keptExtras.some((q) => over(r, q, 6)) || r.top < sr.top + 4 || r.left < sr.left + 4 || r.right > sr.right - 4;
      setStyle(el, "visibility", hit ? "hidden" : "");
      if (!hit) keptExtras.push(r);
    }
    const rects = [...ui, ...keptLmPins, ...keptIsl, ...keptPins, ...keptExtras];
    const tagRank = (el) => (el.classList.contains("talking") ? 0 : el.classList.contains("faculty-tag") ? 1 : 2);
    tags.sort((a, b) => tagRank(a) - tagRank(b));
    for (const el of tags) {
      const r = cur.get(el);
      if (!r.width) continue;
      const m = el.dataset.vis === "0" ? 8 : -2;
      const hit = rects.some((q) => over(r, q, m)) || r.left < sr.left - m || r.right > sr.right + m || r.top < sr.top - m || r.bottom > sr.bottom + m;
      setStyle(el, "visibility", hit ? "hidden" : "");
      el.dataset.vis = hit ? "0" : "1";
      if (!hit) rects.push(r);
    }
  }
  function zoomFactor() {
    // toy-city legibility: figures grow slightly when the camera pulls far back
    const d = camera.position.distanceTo(controls.target);
    return Math.min(1.45, Math.max(1, d / 20));
  }
  function updateWalkers() {
    peopleSys.setFilter(selectedFlows.size ? selectedFlows : null);
    peopleSys.update(0, motionTime, false, zoomFactor());
  }

  // rendering polish (fx.js); null until it has loaded, then resize() and animate() hand drawing to it
  let fx = null;
  function resize() {
    const w = stage.clientWidth,
      h = stage.clientHeight;
    if (!w || !h) return;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    mapCam.refit();
    if (isRatio9x16) {
      renderer.setPixelRatio(1);
      renderer.setSize(1080, 1920, false);
      renderer.domElement.style.width = "100%";
      renderer.domElement.style.height = "100%";
    } else renderer.setSize(w, h);
    labelRenderer.setSize(w, h);
    fx?.setSize();
    dirty = true;
  }
  new ResizeObserver(resize).observe(stage);
  function defaultOverviewDist() {
    const aspect = (stage.clientWidth || innerWidth) / (stage.clientHeight || innerHeight);
    return aspect < 0.85 ? 51 : aspect < 1.3 ? 38.5 : 30.5;
  }
  function overviewPosition() {
    const dist = defaultOverviewDist();
    return overviewTarget().add(new THREE.Vector3(0.24, 0.33, 0.87).normalize().multiplyScalar(dist));
  }
  function overviewTarget() {
    const narrow = stage.clientWidth / stage.clientHeight < 0.85;
    return cityCenter.clone().setY(0.3).add(new THREE.Vector3(0, 0, narrow ? 6.1 : 2.4)); // no bottom panel any more: city sits centred
  }
  function flyTo(id = "all") {
    if (id === "all-card") {
      // whole-city view with the detail card open: slide the city right so west-side tiles are not hidden under the card
      const shift = new THREE.Vector3();
      if (stage.clientWidth > 800 && !tourActive) {
        // measure where the westmost tile lands on screen, then slide just enough to clear the card's right edge
        const sr = stage.getBoundingClientRect();
        const cardRight = Math.max(390, ($("#card") && !$("#card").hidden ? $("#card").getBoundingClientRect().right : 390)) - sr.left + 40;
        const cam = camera.clone();
        const leftmost = (dx) => {
          const t = overviewTarget().add(new THREE.Vector3(dx, 0, 0));
          cam.position.copy(overviewPosition().add(new THREE.Vector3(dx, 0, 0)));
          cam.lookAt(t);
          cam.updateMatrixWorld();
          let m = Infinity;
          for (const [iid, c] of centers) {
            if (!islands.has(iid)) continue;
            const v = c.clone().setY(top).add(new THREE.Vector3(-islandR(iid) * 0.75, 0, 0)).project(cam);
            m = Math.min(m, ((v.x + 1) / 2) * sr.width);
          }
          return m;
        };
        const x0 = leftmost(0),
          x1 = leftmost(-4);
        const perUnit = (x1 - x0) / 4;
        if (x0 < cardRight && perUnit > 1) shift.x = -Math.min(8, (cardRight - x0) / perUnit);
      }
      const target = overviewTarget().add(shift),
        pos = overviewPosition().add(shift);
      if (reduced.matches) {
        camera.position.copy(pos);
        controls.target.copy(target);
        controls.update();
        dirty = true;
      } else fly = { time: performance.now(), from: camera.position.clone(), to: pos, old: controls.target.clone(), target };
      return;
    }
    if (id === "diplomacy" && decor.routeEnds?.length) {
      const c = centers.get("diplomacy");
      const mid = decor.routeEnds.reduce((s, [x, z]) => s.add(new THREE.Vector3(x, 0, z)), new THREE.Vector3()).divideScalar(decor.routeEnds.length);
      const target = c.clone().lerp(mid, 0.38).setY(0.4);
      if (stage.clientWidth > 800 && !tourActive) target.add(new THREE.Vector3(-2.2, 0, 0.6));
      const pos = target.clone().add(new THREE.Vector3(-2.4, 10.5, 9.5));
      if (reduced.matches) {
        camera.position.copy(pos);
        controls.target.copy(target);
        controls.update();
        dirty = true;
      } else fly = { time: performance.now(), from: camera.position.clone(), to: pos, old: controls.target.clone(), target };
      return;
    }
    const lm = LANDMARKS.get(id);
    const detail = visual.get(id) || (lm ? { center: lm.center, isLm: true, size: lm.thumbSize || 0.72 } : null);
    const isSportIsl = id === "sport";
    const target =
      id === "all" ? overviewTarget() : detail ? detail.center.clone() : centers.get(id)?.clone() || new THREE.Vector3();
    target.y = id === "all" ? 0.3 : lm ? lm.center.y : detail ? top + 0.3 : 0.7;
    const off = lm
      ? new THREE.Vector3(1.32, 1.42, 2.25).multiplyScalar(Math.max(1.32, (lm.thumbSize || 0.84) / 0.68))
      : detail
      ? new THREE.Vector3(1.6, 2.5, 3.2)
      : isSportIsl
        ? sportFitOffset()
        : new THREE.Vector3(2.75, 5.3, 6.2);
    let pos = id === "all" ? overviewPosition() : target.clone().add(off);
    if (id !== "all") {
      // full-height canvas: nudge the subject up, clear of the bottom time panel / mobile bottom sheet
      const mobShift = stage.clientWidth <= 800 && !tourActive ? (detail ? 0.68 : isSportIsl ? 0.2 * off.length() : 1.45) : detail ? 0.3 : isSportIsl ? 0.04 * off.length() : 0.9;
      const up = new THREE.Vector3(off.x, 0, off.z).normalize().multiplyScalar(mobShift);
      target.add(up);
      pos.add(up);
    }
    if (id !== "all" && stage.clientWidth > 800 && !tourActive) {
      // keep the subject clear of the detail card on the left; island 09 is centred in the free strip between card and sidebar
      const right = new THREE.Vector3(off.z, 0, -off.x).normalize().multiplyScalar(detail ? 0.75 : isSportIsl ? sportFreeStrip().shift * off.length() : 1.5);
      target.sub(right);
      pos = pos.sub(right);
    }
    if (reduced.matches) {
      camera.position.copy(pos);
      controls.target.copy(target);
      controls.update();
      dirty = true;
    } else fly = { time: performance.now(), from: camera.position.clone(), to: pos, old: controls.target.clone(), target };
  }
  // 2026-11-12: island 09 framing. Fit the whole (compacted) hex into the part of the stage the cards leave free instead of a
  // fixed far offset, so selecting the island shows all 25 towers on desktop and phone alike.
  function sportFreeStrip() {
    const W = stage.clientWidth || innerWidth,
      H = stage.clientHeight || innerHeight;
    if (W <= 800 || tourActive) return { w: W, h: H * 0.56, shift: 0 };
    const cardR = 400; // #card is a ~360 px panel docked at the left
    // the sidebar only costs room when it overlaps the stage (at 1440 px it sits beside the stage, not over it)
    const sb = app.classList.contains("sidebar-hidden") ? null : $("#sidebar")?.getBoundingClientRect(),
      st = stage.getBoundingClientRect();
    const side = sb && sb.width ? Math.max(0, Math.min(st.right - sb.left, sb.width)) : 0;
    const free = Math.max(320, W - cardR - side);
    // world-per-pixel at unit distance, used to slide the target so the island sits in the free strip's centre
    const pxShift = cardR + free / 2 - W / 2;
    const perPx = (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))) / H;
    return { w: free, h: H * 0.8, shift: pxShift * perPx };
  }
  function sportFitOffset() {
    const r = islandR("sport"),
      H = stage.clientHeight || innerHeight,
      strip = sportFreeStrip(),
      tanV = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)),
      tanH = (tanV * strip.w) / H,
      mob = (stage.clientWidth || innerWidth) <= 800;
    const halfW = r * (mob ? 0.78 : 0.84), // hex inradius ≈ 0.87 r; towers reach ≈ 0.72 r
      halfD = r * 0.78; // depth foreshortened at the ~38° view, plus tower height
    const d = Math.max(halfW / tanH, halfD / ((tanV * strip.h) / H), 8.5);
    return new THREE.Vector3(2.75, 5.3, 6.2).normalize().multiplyScalar(d);
  }
  function sourceLinks(ids) {
    return `<div class="sources">${[...new Set(ids)]
      .map((id) => {
        const s = sources.get(id);
        return s && s.url ? `<a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">↗ ${esc(txt(s.title) || id)}</a>` : "";
      })
      .join("")}</div>`;
  }
  const cardFooter = () =>
    "";
  var cardFull = false;
  function cardShow(html) {
    flowCardId = null; // a new card ends any running route tour
    $("#card-content").innerHTML = html + cardFooter();
    $("#card-content [data-ring-clock]")?.addEventListener("click", () => clockTower?.ring("manual"));
    $("#card-content [data-photo-with]")?.addEventListener("click", (ev) => photoWithSubject(ev.currentTarget.dataset.photoWith));
    $("#card").hidden = false;
    document.body.classList.add("card-open");
    $("#sidebar").classList.remove("mobile-open");
    document.body.classList.remove("m-time");
    if (innerWidth <= 800 && toggleState.log) setToggle("log", false);
    $$(".mob-only[aria-pressed]").forEach((b) => {
      if (b.id !== "card-size") b.setAttribute("aria-pressed", "false");
    });
    if (innerWidth <= 800) $("#sidebar-toggle")?.setAttribute("aria-pressed", "false");
    $("#card-content").scrollTop = 0;
    $("#card-content")
      .querySelectorAll("[data-building]")
      .forEach((b) => (b.onclick = () => (window.heartIslandAvatar?.S?.drive && window.heartIslandAvatar?.api?.visitBuildingInDrive ? window.heartIslandAvatar.api.visitBuildingInDrive(b.dataset.building) : selectBuilding(b.dataset.building))));
    $("#card-content")
      .querySelectorAll("[data-flow]")
      .forEach((b) => (b.onclick = () => selectFlow(b.dataset.flow)));
    $("#card-content")
      .querySelectorAll("[data-island]")
      .forEach((b) => (b.onclick = () => (window.heartIslandAvatar?.S?.drive && window.heartIslandAvatar?.api?.teleportToIsland ? (window.heartIslandAvatar.api.teleportToIsland(b.dataset.island), selectIsland(b.dataset.island)) : selectIsland(b.dataset.island))));
    $("#card-content")
      .querySelectorAll("[data-teacher]")
      .forEach((b) => (b.onclick = () => selectTeacher(b.dataset.teacher)));
    $("#card-content")
      .querySelectorAll("[data-landmark]")
      .forEach((b) => (b.onclick = () => (window.heartIslandAvatar?.S?.drive && window.heartIslandAvatar?.api?.visitLandmark ? window.heartIslandAvatar.api.visitLandmark(b.dataset.landmark) : selectLandmark(b.dataset.landmark))));
    wireHotelPicker();
    $("#card-content")
      .querySelectorAll("[data-sky-craft]")
      .forEach((b) => (b.onclick = () => selectSkyCraft(b.dataset.skyCraft, { summonIfHidden: true })));
    $("#card-content")
      .querySelectorAll("[data-sky-salute]")
      .forEach((b) => {
        b.onclick = () => {
          const cid = b.dataset.skySalute;
          env.skyFleet?.saluteCraft?.(cid);
          if (window.__htlPassport?.sfx?.fanfare) window.__htlPassport.sfx.fanfare();
          else window.__htlPassport?.sfx?.bell?.();
          dirty = true;
        };
      });
    $("#card-content")
      .querySelectorAll("[data-sky-hold]")
      .forEach((b) => {
        b.onclick = () => {
          const cid = b.dataset.skyHold;
          const held = env.skyFleet?.toggleHold?.(cid);
          b.classList.toggle("active", !!held);
          b.innerHTML = held
            ? tr("▶️ 恢復空中巡航", "▶️ Resume Cruise")
            : tr("⏸️ 空中懸停細看布條", "⏸️ Hold in Mid-Air");
          window.__htlPassport?.sfx?.bell?.();
          dirty = true;
        };
      });
    $("#card-content")
      .querySelectorAll("[data-sky-time]")
      .forEach((b) => {
        b.onclick = () => {
          const mins = Number(b.dataset.skyTime);
          if (!Number.isFinite(mins)) return;
          dayPlaying = false;
          if ($("#day-play")) $("#day-play").textContent = "▶";
          dayMinutes = mins;
          updateDay();
          if (selectedSkyCraft) env.skyFleet?.focusCraft?.(selectedSkyCraft);
          $("#card-content")
            .querySelectorAll("[data-sky-time]")
            .forEach((x) => x.classList.toggle("on", Number(x.dataset.skyTime) === mins));
          window.__htlPassport?.sfx?.bell?.();
          dirty = true;
        };
      });
    $("#card-content")
      .querySelectorAll("[data-sky-planner]")
      .forEach((b) => {
        b.onclick = () => {
          const tab = b.dataset.skyPlanner || "sky";
          window.__htlConciergePro?.openPlanner?.(tab);
        };
      });
    $("#card-content")
      .querySelectorAll("[data-speak-teacher]")
      .forEach((b) => (b.onclick = () => speakTeacher(b.dataset.speakTeacher, b, b.dataset.speakLang || null)));
    $("#card-content")
      .querySelectorAll(matchMedia("(hover: hover) and (pointer: fine)").matches ? "[data-hover-flow]" : "[data-hover-flow-none]")
      .forEach((b) => {
        b.onmouseenter = () => {
          for (const p of flowPaths) p.mesh.visible = selectedFlows.has(p.flow) || p.flow === b.dataset.hoverFlow;
          dirty = true;
        };
        b.onmouseleave = () => {
          for (const p of flowPaths) p.mesh.visible = selectedFlows.has(p.flow) || showAllFlows;
          dirty = true;
        };
      });
    $("#card").scrollTop = 0;
    if ($("#card-content")) $("#card-content").scrollTop = 0;
    const tt = $("#card-content [data-thumb]");
    if (tt && !thumbCache.has(tt.dataset.thumb) && params.get("thumbs") !== "0")
      setTimeout(() => {
        const url = thumbnail(tt.dataset.thumb);
        if (url && tt.isConnected) tt.insertAdjacentHTML("afterbegin", `<img src="${url}" alt="">`), tt.querySelector(":scope > .ico")?.remove();
      }, 60);
  }
  // ---------- HUD: status, display toggles, island dock, city log ----------
  let showAllFlows = false,
    frozen = false,
    showNames = false;
  const nameTags = [];
  const hudStatusEl = $("#status");
  const hudTimeBtns = $$("[data-time]");
  let hudTimeSpan = null;
  function updateHud() {
    const h = Math.floor(dayMinutes / 60),
      m = Math.floor(dayMinutes % 60);
    const period = dayMinutes < 330 || dayMinutes >= 1170 ? tr("夜晚", "Night") : dayMinutes < 480 ? tr("清晨", "Dawn") : dayMinutes < 1020 ? tr("白天", "Day") : tr("黃昏", "Dusk");
    let on = 0;
    const hasFlowSel = selectedFlows.size > 0;
    for (let i = 0; i < peopleSys.people.length; i++) {
      const w = peopleSys.people[i];
      if (w.kind === "flow" && (!hasFlowSel || selectedFlows.has(w.flow))) on++;
    }
    // rebuild the counters only when they change; the clock ticks ~10×/s and only needs its own text updated
    const timeTxt = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    const statusKey = `${on}|${selectedFlows.size}|${english}`;
    const st = hudStatusEl;
    if (st) {
      if (st.dataset.k !== statusKey || !hudTimeSpan || !hudTimeSpan.isConnected) {
        st.dataset.k = statusKey;
        st.innerHTML = [
          [D.islands.length, tr("座主題島", "themes"), "#db6a41"],
          [buildings.size, tr("個亮點", "items"), "#b8920f"],
          [D.flows.length, tr("條路線連結", "route links"), "#3e7c8c"],
          [on, hasFlowSel ? tr("位在這條路線上", "on this route") : tr("位高餐師生在路上", "members walking"), "#5e9a6f"],
        ]
          .map(([n, l, c]) => `<span class="st" style="--c:${c}"><i></i><b>${n}</b>${l}</span>`)
          .join("") + `<span class="st time"><b>${timeTxt}</b><span class="per">${period}</span></span>`;
        hudTimeSpan = st.querySelector(".st.time");
      } else {
        if (hudTimeSpan.firstChild.textContent !== timeTxt) hudTimeSpan.firstChild.textContent = timeTxt;
        if (hudTimeSpan.lastChild.textContent !== period) hudTimeSpan.lastChild.textContent = period;
      }
    }
    for (let i = 0; i < hudTimeBtns.length; i++) {
      const b = hudTimeBtns[i];
      const v = String(Math.abs(Number(b.dataset.time) - dayMinutes) < 1);
      if (b.getAttribute("aria-pressed") !== v) b.setAttribute("aria-pressed", v);
    }
  }
  hudTimeBtns.forEach(
    (b) =>
      (b.onclick = () => {
        // jump to that light; the clock keeps running from there
        dayMinutes = Number(b.dataset.time);
        updateDay();
        dirty = true;
      }),
  );
  const toggleState = { names: false, badges: true, flows: false, freeze: false, bird: false, log: false };
  function setToggle(k, v) {
    toggleState[k] = v;
    $(`[data-toggle="${k}"]`)?.setAttribute("aria-pressed", String(v));
    if (k === "names") showNames = v;
    if (k === "badges") badgesOn = v;
    if (k === "flows") {
      showAllFlows = v;
      for (const p of flowPaths) p.mesh.visible = v || selectedFlows.has(p.flow);
    }
    if (k === "freeze") frozen = v;
    if (k === "bird") {
      const t = controls.target.clone();
      const pos = v ? t.clone().add(new THREE.Vector3(0.01, 42, 6)) : overviewPosition();
      controls.maxPolarAngle = THREE.MathUtils.degToRad(v ? 70 : 70);
      controls.minPolarAngle = THREE.MathUtils.degToRad(v ? 5 : 25);
      if (reduced.matches) camera.position.copy(pos);
      else fly = { time: performance.now(), from: camera.position.clone(), to: pos, old: controls.target.clone(), target: v ? t : overviewTarget() };
    }
    if (k === "log") {
      $("#log").classList.toggle("open", v);
      document.body.classList.toggle("log-open", v);
      $("#mob-log-btn")?.setAttribute("aria-pressed", String(v));
      if (v) {
        $(`[data-toggle="log"]`)?.classList.remove("has-unread");
        $("#mob-log-btn")?.classList.remove("has-unread");
        $("#mob-time")?.classList.remove("has-unread");
        if (innerWidth <= 800) {
          $("#card").hidden = true;
          document.body.classList.remove("card-open", "m-time");
          $("#sidebar").classList.remove("mobile-open");
          $("#sidebar-toggle")?.setAttribute("aria-pressed", "false");
          $("#mob-time")?.setAttribute("aria-pressed", "false");
          window.heartIslandAvatar?.api?.close?.();
          renderOverview();
        }
        if (typeof syncLogToolbar === "function") syncLogToolbar();
        renderLog();
      } else {
        $("#log").classList.remove("full");
      }
    }
    dirty = true;
  }
  let badgesOn = true;
  $$("[data-toggle]").forEach(
    (b) =>
      (b.onclick = () => {
        setToggle(b.dataset.toggle, !toggleState[b.dataset.toggle]);
        track("htl_toggle", { toggle: b.dataset.toggle, active: toggleState[b.dataset.toggle] });
      }),
  );
  $("#log-close").onclick = () => setToggle("log", false);
  // dock
  for (const i of D.islands) {
    const b = document.createElement("button");
    b.className = "dock-btn";
    b.innerHTML = `${icon(i.id)}<span class="tip">${esc(english ? txt(i.name) : shortNames[i.id])}</span>`;
    b.setAttribute("aria-label", txt(i.name));
    b.onclick = () => selectIsland(i.id);
    $("#dock").appendChild(b);
  }
  // name tags (CSS2D, only near the camera)
  for (const [pi, w] of peopleSys.people.entries()) {
    const el = document.createElement("button");
    const teacher = w.teacherId ? FACULTY_BY_ID.get(w.teacherId) : null;
    el.className =
      "name-tag" +
      (w.kind === "flow"
        ? " bubble"
        : w.kind === "puma"
          ? " puma-tag faculty-tag chair-tag"
          : w.kind === "faculty"
            ? " puma-tag faculty-tag"
            : w.kind === "lord"
              ? " puma-tag lord-tag"
              : " ambient");
    el.innerHTML = teacher
      ? `<img class="tag-avatar" src="${esc(thumb(teacher.photo))}" alt="" decoding="async"><b class="pn">${esc(txt(teacher.shortTitle))}</b><span class="stop"></span>`
      : w.kind === "puma"
        ? `<i>✦</i><b class="pn">${esc(tr("謝文欽 主任", "Chair Hsieh"))}</b><span class="stop"></span>`
        : w.kind === "lord"
          ? `<i>✦</i><b class="pn">${esc(tr("群賢館長", "Qunxian Master"))}</b>`
          : w.kind === "flow"
            ? `<i>${roleGlyph(w.role)}</i><span class="doing">${esc(tr("正在搬", "Carrying"))} <b>${esc(tr(...(CARRY_LABEL[w.carry] || [w.carry, w.carry])))}</b></span>`
            : `<i>${roleGlyph(w.role)}</i>${esc(tr(...ROLE_LABEL[w.role]))}`;
    el.tabIndex = -1;
    if (teacher) el.title = `${txt(teacher.name)}｜${txt(teacher.title)}（點擊聽老師解說課程與系所介紹）`;
    else if (w.kind === "flow") el.title = `${tr(...ROLE_LABEL[w.role])}｜${english ? nameOf(w.from) : shortNames[w.from] || nameOf(w.from)} ↔ ${english ? nameOf(w.to) : shortNames[w.to] || nameOf(w.to)}｜${w.flow} ${txt(D.flows.find((f) => f.id === w.flow)?.text || "")}`;
    el.onclick = () => selectWalker(pi);
    const o = new CSS2DObject(el);
    o.visible = false;
    scene.add(o);
    nameTags.push(o);
  }
  // 10 位專任師長頭上的課程解說雲與互動導覽按鈕（只引用旅館管理系官網原文）
  const PUMA_QUOTES = [
    ["本系（科）為全國首創，以實用至上為理念，結合突破性之新學制如：三明治教學法、勞作教育等。", "旅館管理系官網・本系介紹"],
    ["為培養具有國際觀且兼具專業知識、技能、服務道德及敬業樂群的中階旅館管理專業幹部人才。", "旅館管理系官網・教育理念"],
    ["兼具旅館專業與管理知識之整合；理論與實務並重；熟悉現代旅館內之軟硬體；精通外國語言；落實職業道德與服務精神。", "旅館管理系官網・特色目標"],
    ["建構「產業學院」為現今本系發展特色目標。", "旅館管理系官網・發展特色"],
    ["為達到「校外實習乃校內學習之延伸」的教育功能，本系教師均定期赴學生實習場所訪視，並與旅館業界保持密切連繫。", "旅館管理系官網・行政與系務"],
  ];
  const PUMA_QUOTES_EN = [
    ["Founded as Taiwan's first Hotel Management program, combining the Sandwich Cooperative System with hands-on service education.", "Official Site · Overview"],
    ["Cultivating mid-level hotel management cadres with a global outlook, professional skills, and strong service ethics.", "Official Site · Philosophy"],
    ["Integrating hotel & management knowledge, balancing theory & practice, mastering hotel systems, and excelling in foreign languages.", "Official Site · Program Goals"],
    ["Building the 'Industry Academy' and Elite Internship Program 3.0 with 24 premier partner hotels.", "Official Site · Features"],
    ["Faculty regularly visit internship hotels across Taiwan to ensure off-campus internships extend on-campus learning.", "Official Site · Administration"],
  ];
  const CLOUD_FIRST = 300, CLOUD_EVERY = 300, CLOUD_FOR = 30;
  const pumaIdx = peopleSys.people.findIndex((w) => w.kind === "puma");
  const facultyExtras = new Map();
  for (const [pi, w] of peopleSys.people.entries()) {
    if (w.kind !== "puma" && w.kind !== "faculty") continue;
    const teacher = FACULTY_BY_ID.get(w.teacherId) || FACULTY[0];
    const el = document.createElement("div");
    el.className = "puma-extra faculty-extra";
    el.innerHTML = `<div class="px-col"><div class="puma-cloud" hidden><span class="q"></span><small class="src"></small><i class="d1"></i><i class="d2"></i></div><button type="button" class="puma-advice" hidden>🎙️ ${esc(tr(`聽${teacher.name.zh}老師解說`, `Ask ${teacher.shortTitle.en}`))}</button></div>`;
    el.querySelector(".puma-advice").addEventListener("click", (e) => {
      e.stopPropagation();
      selectWalker(pi);
      track("htl_advice_click", { teacher: teacher.id });
    });
    const o = new CSS2DObject(el);
    o.visible = false;
    scene.add(o);
    facultyExtras.set(pi, { o, el, teacher, cloud: el.querySelector(".puma-cloud"), q: el.querySelector(".q"), src: el.querySelector(".src"), btn: el.querySelector(".puma-advice"), shownKey: "", cloudOn: false, btnOn: false });
  }
  const pumaExtra = facultyExtras.get(pumaIdx) || null;
  const pumaT0 = performance.now();
  let pumaForce = -1; // QA：強制顯示第幾句（heartCity.debug.pumaQuote(k)）
  function updatePumaExtra(now) {
    const camDist = camera.position.distanceTo(controls.target);
    const near = camDist < 24;
    // Choose at most ONE primary teacher to display the speech cloud & action button so clouds never overlap
    let bestPi = -1;
    let bestScore = 1e9;
    if (near && !tourActive) {
      if (pumaForce >= 0 && pumaIdx >= 0) {
        bestPi = pumaIdx;
      } else if (selectedWalker !== null && facultyExtras.has(selectedWalker)) {
        bestPi = selectedWalker;
      } else {
        for (const [pi] of facultyExtras.entries()) {
          const w = peopleSys.people[pi];
          if (!w || !w.world || !w.waiting) continue;
          const dist = w.world.distanceTo(controls.target);
          const onSelIsl = selectedIsland && w.atIsland === selectedIsland;
          if (!onSelIsl && dist > 4.8) continue;
          const score = (onSelIsl ? -100 : 0) + dist;
          if (score < bestScore) {
            bestScore = score;
            bestPi = pi;
          }
        }
      }
    }
    for (const [pi, X] of facultyExtras.entries()) {
      const w = peopleSys.people[pi];
      if (!w || !w.world || tourActive || !near || pi !== bestPi) {
        if (X.cloudOn) X.cloud.hidden = !(X.cloudOn = false);
        if (X.btnOn) X.btn.hidden = !(X.btnOn = false);
        X.o.visible = false;
        continue;
      }
      let cloudOn = false;
      let quoteText = "";
      let fromText = "";
      if (pi === pumaIdx && pumaForce >= 0) {
        cloudOn = true;
        const qList = english ? PUMA_QUOTES_EN : PUMA_QUOTES;
        const [q, f] = qList[pumaForce % qList.length];
        quoteText = q;
        fromText = f ? tr(`出自：${f}`, `From: ${f}`) : "";
      } else if (w.waiting) {
        cloudOn = true;
        const islGuide = X.teacher.islandGuides?.[w.atIsland] || txt(islands.get(w.atIsland)?.summary);
        const tQuotes = english ? X.teacher.quotesEn || X.teacher.quotes : X.teacher.quotes;
        const useQuote = Math.floor(now / 6500 + pi) % 2 === 1 && tQuotes?.length;
        if (islGuide && !useQuote) {
          quoteText = islGuide;
          const islLabel = english ? txt(islands.get(w.atIsland)?.name) : shortNames[w.atIsland] || "";
          fromText = `${txt(X.teacher.shortTitle)} · ${islLabel}${tr("導覽", " Guide")}`;
        } else if (tQuotes?.length) {
          const [q, f] = tQuotes[Math.floor(now / 6500 + pi) % tQuotes.length];
          quoteText = q;
          fromText = f;
        }
      }
      const btnOn = !!w.waiting;
      const key = `${quoteText}|${fromText}`;
      if (cloudOn && X.shownKey !== key) {
        X.shownKey = key;
        X.q.textContent = quoteText;
        X.src.textContent = fromText;
      }
      if (cloudOn !== X.cloudOn) X.cloud.hidden = !(X.cloudOn = cloudOn);
      if (btnOn !== X.btnOn) X.btn.hidden = !(X.btnOn = btnOn);
      X.o.visible = cloudOn || btnOn;
      if (X.o.visible) X.o.position.set(w.world.x, w.world.y + 0.5 * (w.drawScale || 0.9), w.world.z);
    }
  }
  // ---------- Upgraded Multi-Tier Concierge Live Log (Real Players vs. Eco-Throttled NPCs) ----------
  const logFlow = $("#log-flow");
  logFlow.innerHTML = `<option value="">${tr("全部學習路線", "All routes")}</option>` + D.flows.map((f) => `<option value="${f.id}">${f.id}｜${esc(txt(f.text)).slice(0, 18)}</option>`).join("");
  const MAX_LOG_ITEMS = 72;
  const MAX_LOG_DOM_ROWS = 36;
  const logItems = [];
  let logSeq = 0;
  let logSrc = "all"; // "all" | "players" | "peer" | "npc"
  let logNpcPaused = false;
  try {
    logNpcPaused = sessionStorage.getItem("htl_log_npc_paused") === "1";
  } catch {}
  let onlinePeerCount = Number(window.__htlOnlinePeers || 0);
  let isHoveringLogList = false;
  let pendingHoverFlush = false;
  let npcSampleAcc = 0;
  let npcCursor = 0;
  let npcSampleStep = 0;
  const logPerfStats = {
    tickCalls: 0,
    skippedClosed: 0,
    skippedThrottle: 0,
    npcSamples: 0,
    playerEvents: 0,
    fullRenders: 0,
    incrementalPrepends: 0,
  };
  const flowWalkerPool = [];
  const facultyWalkerPool = [];
  for (let i = 0; i < peopleSys.people.length; i++) {
    const w = peopleSys.people[i];
    if (w.kind === "flow") flowWalkerPool.push({ idx: i, w });
    else if (w.kind === "puma" || w.kind === "faculty") facultyWalkerPool.push({ idx: i, w });
  }

  function formatCityLogTime(useWallClock = false) {
    if (useWallClock) {
      const now = new Date();
      return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;
    }
    const cm = Math.floor(dayMinutes) % 1440;
    const ss = String(Math.floor(motionTime) % 60).padStart(2, "0");
    const hh = String(Math.floor(cm / 60)).padStart(2, "0");
    const mm = String(cm % 60).padStart(2, "0");
    return `${hh}:${mm}:${ss}`;
  }

  function resolveLogIslandId(islId, islName) {
    if (islId && islands.has(islId)) return islId;
    if (!islName) return "";
    const raw = String(islName).trim();
    if (!raw) return "";
    if (islands.has(raw)) return raw;
    for (const isl of D.islands) {
      const zh = isl.name?.zh || "";
      const en = isl.name?.en || "";
      const sh = shortNames[isl.id] || "";
      if (raw === zh || raw === en || raw === sh) return isl.id;
      if ((sh && raw.includes(sh)) || (zh && zh.includes(raw))) return isl.id;
    }
    return "";
  }

  function matchesLogFilter(item) {
    if (logSrc === "players" && item.actor !== "peer" && item.actor !== "me") return false;
    if (logSrc === "peer" && item.actor !== "peer") return false;
    if (logSrc === "npc" && item.actor !== "npc") return false;
    const f = logFlow.value;
    if (f && (logSrc === "all" || logSrc === "npc")) {
      if (item.flow !== f) return false;
    }
    return true;
  }

  function createLogRowEl(item) {
    const li = document.createElement("li");
    li.className = `log-item actor-${item.actor}${item.subActor ? ` sub-${item.subActor}` : ""}${item.clickable ? " is-clickable" : ""}`;
    li.dataset.seq = String(item.seq);
    li.dataset.actor = item.actor;
    li.dataset.type = item.type;
    if (item.peerId) li.dataset.peer = item.peerId;
    if (item.skyCraft) li.dataset.sky = item.skyCraft;
    if (item.building) li.dataset.bldg = item.building;
    if (item.island) li.dataset.isl = item.island;
    if (item.flow) li.dataset.flowId = item.flow;
    if (item.walkerIdx != null) li.dataset.walker = String(item.walkerIdx);
    const islIcon = item.island && islands.has(item.island) ? icon(item.island, "sm") : "";
    li.innerHTML = `<div class="lp-col"><span class="actor-tag ${esc(item.actor)}${item.subActor ? ` ${esc(item.subActor)}` : ""}">${esc(item.actorBadge)}</span><span class="lp ${esc(item.type)}">${esc(item.kindLabel)}</span></div><div class="lt"><div class="lt-meta"><time>${esc(item.time)}</time>${islIcon}${item.headHtml || ""}</div><div class="lt-msg">${item.bodyHtml}</div></div>`;
    return li;
  }

  function syncLogCounts() {
    const body = $("#log-body");
    if (!body) return;
    let cAll = logItems.length,
      cPlayers = 0,
      cPeer = 0,
      cNpc = 0;
    for (let i = 0; i < logItems.length; i++) {
      const a = logItems[i].actor;
      if (a === "peer") {
        cPeer++;
        cPlayers++;
      } else if (a === "me") {
        cPlayers++;
      } else {
        cNpc++;
      }
    }
    const map = { all: cAll, players: cPlayers, peer: cPeer, npc: cNpc };
    body.querySelectorAll("[data-logcnt]").forEach((el) => {
      const k = el.dataset.logcnt;
      const val = String(map[k] ?? 0);
      if (el.textContent !== val) el.textContent = val;
    });
    const clearBtn = $("#log-clear-btn");
    if (clearBtn) clearBtn.disabled = cAll === 0;
  }

  function syncLogToolbar() {
    const body = $("#log-body");
    if (!body) return;
    body.querySelectorAll("[data-logsrc]").forEach((btn) => {
      const on = btn.dataset.logsrc === logSrc;
      btn.classList.toggle("active", on);
      btn.setAttribute("aria-selected", String(on));
    });
    const showFlowSel = logSrc === "all" || logSrc === "npc";
    logFlow.hidden = !showFlowSel;
    const pauseBtn = $("#log-npc-pause");
    if (pauseBtn) {
      pauseBtn.hidden = !showFlowSel;
      pauseBtn.classList.toggle("paused", logNpcPaused);
      pauseBtn.setAttribute("aria-pressed", String(logNpcPaused));
      pauseBtn.textContent = logNpcPaused ? tr("▶️ 恢復NPC", "▶️ Resume NPC") : tr("⏸️ 暫停NPC", "⏸️ Pause NPC");
      pauseBtn.title = logNpcPaused
        ? tr("恢復校園 NPC 低頻模擬動態", "Resume eco-throttled campus NPC updates")
        : tr("暫停校園 NPC 刷新，僅保留真人動態", "Pause campus NPC updates and show only real players");
    }
    const clearBtn = $("#log-clear-btn");
    if (clearBtn) {
      clearBtn.textContent = tr("🧹 清空", "🧹 Clear");
      clearBtn.title = tr("清空目前畫面上的歷史動態紀錄", "Clear current log history");
      clearBtn.disabled = logItems.length === 0;
    }
    const livePill = $("#log-live-pill");
    if (livePill) {
      if (onlinePeerCount > 0) {
        livePill.className = "live is-multi";
        livePill.innerHTML = `<i></i><span>${esc(tr(`線上 ${1 + onlinePeerCount} 人旅伴 · NPC 自動降頻`, `${1 + onlinePeerCount} Online · NPC Throttled`))}</span>`;
      } else if (logNpcPaused || !showFlowSel) {
        livePill.className = "live is-player-only";
        livePill.innerHTML = `<i></i><span>${esc(logNpcPaused ? tr("NPC 已暫停 · 僅收錄真人", "NPC Paused · Players Only") : tr("真人專區 · 0 NPC 耗能", "Players Feed · 0 NPC Load"))}</span>`;
      } else {
        livePill.className = "live";
        livePill.innerHTML = `<i></i><span>${esc(tr("節能即時", "Eco Live"))}</span>`;
      }
    }
    syncLogCounts();
  }

  function pushLogRecord(rec) {
    if (!rec) return null;
    if (!rec.noDedupe && rec.key) {
      const lookback = rec.actor === "npc" ? 22 : 6;
      for (let i = 0; i < Math.min(lookback, logItems.length); i++) {
        if (logItems[i].key === rec.key) return null;
      }
    }
    const item = {
      seq: ++logSeq,
      key: rec.key || `seq-${logSeq}`,
      actor: rec.actor || "npc",
      subActor: rec.subActor || "",
      actorBadge:
        rec.actorBadge ||
        (rec.actor === "peer"
          ? tr("🟢 線上玩家", "🟢 Online")
          : rec.actor === "me"
            ? tr("⭐ 我的足跡", "⭐ You")
            : rec.subActor === "faculty"
              ? tr("🎓 師長導覽", "🎓 Faculty")
              : tr("🤖 校園NPC", "🤖 NPC")),
      type: rec.type || "depart",
      kindLabel: rec.kindLabel || tr("動態", "Event"),
      time: rec.time || formatCityLogTime(rec.actor === "peer" || rec.actor === "me"),
      island: rec.island || "",
      building: rec.building || "",
      skyCraft: rec.skyCraft || "",
      flow: rec.flow || "",
      walkerIdx: rec.walkerIdx ?? null,
      peerId: rec.peerId || "",
      headHtml: rec.headHtml || "",
      bodyHtml: rec.bodyHtml || "",
      clickable: !!(rec.peerId || rec.skyCraft || rec.building || rec.island || rec.flow || rec.walkerIdx != null),
    };
    logItems.unshift(item);
    if (logItems.length > MAX_LOG_ITEMS) logItems.pop();
    if (item.actor !== "npc") logPerfStats.playerEvents++;

    const logOpen = toggleState.log && $("#log")?.classList.contains("open");
    if (!logOpen) {
      if (item.actor === "peer") {
        $(`[data-toggle="log"]`)?.classList.add("has-unread");
        $("#mob-log-btn")?.classList.add("has-unread");
        $("#mob-time")?.classList.add("has-unread");
      }
      return item;
    }

    syncLogCounts();
    if ($("#log-body")?.hidden) return item;
    if (!matchesLogFilter(item)) return item;

    // Hover-freeze for ambient NPC items so list never jumps under user's pointer while reading
    if (item.actor === "npc" && isHoveringLogList) {
      pendingHoverFlush = true;
      return item;
    }

    const listEl = $("#log-list");
    if (!listEl) return item;
    listEl.querySelector(".log-empty-state")?.remove();
    listEl.prepend(createLogRowEl(item));
    logPerfStats.incrementalPrepends++;
    while (listEl.children.length > MAX_LOG_DOM_ROWS) {
      listEl.lastElementChild?.remove();
    }
    return item;
  }

  function pushLog(w, type, walkerIdx = null) {
    if (!w) return;
    const kindMap = { depart: tr("出發", "Depart"), arrive: tr("抵達", "Arrive"), handoff: tr("交接", "Hand-off") };
    const dest = type === "depart" ? (w.dirSign > 0 ? w.to : w.from) : w.dirSign > 0 ? w.from : w.to;
    const key = `npc|${w.flow}|${w.role}|${type}|${dest}`;
    const flowTitle = txt(flows.get(w.flow)?.text || "");
    const carryTxt = tr(...(CARRY_LABEL[w.carry] || [w.carry, w.carry]));
    const roleTxt = tr(...(ROLE_LABEL[w.role] || [w.role, w.role]));
    pushLogRecord({
      key,
      actor: "npc",
      type,
      kindLabel: kindMap[type] || kindMap.depart,
      flow: w.flow,
      island: dest,
      walkerIdx,
      headHtml: `<b class="lt-flow" title="${esc(flowTitle)}">${esc(w.flow)}</b><span class="lt-who">${esc(roleTxt)}</span>`,
      bodyHtml: `${esc(type === "depart" ? tr("前往", "Heading to") : tr("抵達", "Arrived at"))} <strong>${esc(english ? nameOf(dest) : shortNames[dest] || nameOf(dest))}</strong><span class="nw"> · ${esc(carryTxt)}</span>`,
    });
  }
  // 官網「教育理念・特色目標」五項（字母沿用 HEART 色票）
  const PILLAR_NAME = { H: ["服務精神", "Service ethics"], E: ["專業整合", "Integrated expertise"], A: ["旅館軟硬體", "Hotel systems"], R: ["理論實務並重", "Theory & practice"], T: ["精通外語", "Foreign languages"] };
  function renderOverview() {
    const heartCount = {};
    for (const i of D.islands) for (const h of i.heart) heartCount[h] = (heartCount[h] || 0) + 1;
    const walking = peopleSys.people.filter((w) => w.kind === "flow").length;
    const tiers = {};
    for (const f of D.flows) tiers[f.evidenceTier] = (tiers[f.evidenceTier] || 0) + 1;
    $("#overview-panel").innerHTML = `<div class="stat-row four">${[
      [D.islands.length, tr("座主題島嶼", "themes"), "#db6a41"],
      [buildings.size, tr("個教學與實習亮點", "highlights"), "#b8920f"],
      [D.flows.length, tr("條學習路線連結", "route links"), "#3e7c8c"],
      [walking, tr("位高餐師生在路上", "members"), "#5e9a6f"],
    ]
      .map(([n, l, c]) => `<div class="stat" style="--accent:${c}"><b>${n}</b><span class="lbl">${l}</span></div>`)
      .join("")}</div>
      <h4>${tr("✦ 辦學雙軸特色定位（智慧旅館科技 × 奢華體驗管理）", "✦ Dual-Axis Positioning (Smart Tech × Luxury Management)")}</h4>
      <div class="credit-box" style="margin-bottom:8px;padding:10px 12px;font-size:12.5px;line-height:1.55">
        <b>${tr("第一軸｜智慧旅館科技", "Axis 1 | Smart Hospitality Tech")}</b>：${tr("教育部紫領計畫（108）→ 智能服務中心（D808）→ 群賢智慧客房 → 餐旅數位智慧服務與創新基地（D 棟 8 樓，114.3 啟用）；整合 OPERA／德安兩套 PMS、Power BI 數據分析、生成式 AI 與服務機器人，推動 OPERA 證書與 AI-900／AWS 雙軌認證。", "MOE Purple-Collar Project → Smart Service Lab (D808) → Qunxian AIoT Guestrooms → Digital Service & Innovation Base (Bldg D 8F, Mar 2025); integrates OPERA/Dean PMS, Power BI, Generative AI, and service robots.")}<br>
        <b>${tr("第二軸｜奢華體驗管理", "Axis 2 | Luxury Experience Management")}</b>：${tr("攜手文華東方、W 飯店、嘉佩樂、萬豪國際集團育才學院（Marriott Class）、萬豪夢想家儲備幹部培訓與洲際 IHG Academy，開設 8 門「奢華體驗管理微學分」（顧客體驗設計與情緒價值創造），串聯大一二探索、大三校外實習輪調、大四儲備主管培訓至畢業儲備幹部直通（月薪 4 萬元以上）。", "Partners with Mandarin Oriental, W Taipei, Capella, Marriott Class, and IHG Academy across 8 Luxury Experience Management micro-credits and a 4-year fast-track to Management Trainee roles (NT$40,000+/mo).")}
      </div>
      <h4>${tr("✦ 公開辦學績效與學習成果亮點", "✦ Key Educational & Career Outcomes")}</h4>
      <div class="stat-row four" style="margin-bottom:8px">${[
        ["1,037", tr("人次專業證照取得（考照班 100% 通過）", "certifications (100% prep pass)"), "#b88b4a"],
        ["158", tr("次業界專家協同教學（67 位業師）", "industry co-teaching sessions"), "#235e73"],
        ["70", tr("所國際合作學府與機構（海外實習與研修 67 人次，112–114 學年合計）", "global partners (67 overseas internship & study placements, AY 112–114)"), "#2e6844"],
        ["86.79%", tr("畢業生就業率（雇主滿意度 4.33/5）", "employment (4.33/5 employer rating)"), "#8c3d2b"],
      ]
        .map(([n, l, c]) => `<div class="stat" style="--accent:${c}"><b>${n}</b><span class="lbl">${l}</span></div>`)
        .join("")}</div>
      <p class="small">${tr("🏆 榮譽亮點：第 54 屆全國技能競賽青年組「旅館接待」職類全國第二名｜本校獲《遠見》企業最愛大學生「觀光休閒類」第 1 名（校級排名）｜教師主持國科會研究計畫，如 114–115 年多年期「基於小語言模型(SLM)與檢索增強生成(RAG)的服務溫度感知對話式餐旅機器人」（GRB 可查）。", "🏆 Honors: 2nd Place Nationally in Hotel Reception at the 54th National Skills Competition | NKUHT ranked #1 in Tourism & Leisure (university-level) in Global Views' Most Wanted Graduates | Faculty lead NSTC research such as the 2025–2026 multi-year SLM/RAG conversational hospitality robot project (listed in GRB).")}</p>
      <h4>${tr("NKUHT · Hospitality 五項特色目標與 A–H 八大核心能力", "NKUHT · Hospitality 5 Goals & A–H Core Competencies")}</h4><div class="heart-bars">${"HEART".split("").map((h) => `<div><span class="pill heart" style="--c:${HEART_COLORS[h]}"><i></i>${esc(tr(...(PILLAR_NAME[h] || [h, h])))}</span><i class="bar"><b style="width:${((heartCount[h] || 0) / D.islands.length) * 100}%;background:${HEART_COLORS[h]}"></b></i><em>${heartCount[h] || 0}</em></div>`).join("")}</div>
      <p class="small">${tr("對應 113 版課程地圖八大核心能力：A 社會基礎知識・B 餐旅基礎知識・C 旅館實務管理・D 旅館餐飲服務・E 旅館公關管理・F 旅館危機處理・G 數位資訊應用・H 旅館行政管理。", "Mapped to 8 Core Competencies (A–H): Social Foundation, Hospitality Foundation, Hotel Operations, F&B Service, Public Relations, Crisis Management, Digital & IT Application, and Hotel Administration.")}</p>
      <h4>${tr("路線依據", "EVIDENCE")}</h4><div class="pills">${Object.entries(tiers).map(([t, n]) => `<span class="pill soft">${esc(tierLabel(t))} · ${n}</span>`).join("")}</div>
      <h4>${tr("各島教學與實習細項數", "ITEMS PER THEME")}</h4><div class="mini-list">${D.islands.map((i) => `<button data-island-ov="${i.id}">${icon(i.id, "sm")}<span>${esc(english ? txt(i.name) : shortNames[i.id])}</span><em>${i.buildings.length}</em></button>`).join("")}</div>`;
    $$("[data-island-ov]").forEach((b) => (b.onclick = () => selectIsland(b.dataset.islandOv)));
  }
  // Mount enhanced Source Filter Tabs + Pause Toggle + Eco Legend inside #log-body
  {
    const logBody = $("#log-body");
    const filtersRow = logBody?.querySelector(".log-filters");
    if (logBody && filtersRow && !logBody.querySelector(".log-src-bar")) {
      const liveSpan = filtersRow.querySelector(".live");
      if (liveSpan) liveSpan.id = "log-live-pill";
      const pauseBtn = document.createElement("button");
      pauseBtn.type = "button";
      pauseBtn.id = "log-npc-pause";
      pauseBtn.className = "log-pause-btn";
      pauseBtn.setAttribute("aria-pressed", String(logNpcPaused));
      filtersRow.appendChild(pauseBtn);

      const clearBtn = document.createElement("button");
      clearBtn.type = "button";
      clearBtn.id = "log-clear-btn";
      clearBtn.className = "log-clear-btn";
      filtersRow.appendChild(clearBtn);

      const srcBar = document.createElement("div");
      srcBar.className = "log-src-bar";
      srcBar.setAttribute("role", "tablist");
      srcBar.setAttribute("aria-label", tr("篩選動態來源（真人玩家與校園模擬）", "Filter log source (Real players vs. Campus NPCs)"));
      srcBar.innerHTML = [
        ["all", tr("全部", "All")],
        ["players", tr("👥 真人", "👥 Players")],
        ["peer", tr("🟢 線上", "🟢 Online")],
        ["npc", tr("🤖 NPC", "🤖 NPC")],
      ]
        .map(
          ([id, lbl]) =>
            `<button type="button" role="tab" class="log-src-btn${id === logSrc ? " active" : ""}" data-logsrc="${id}" aria-selected="${id === logSrc}"><span>${esc(lbl)}</span><em data-logcnt="${id}">0</em></button>`,
        )
        .join("");
      logBody.insertBefore(srcBar, filtersRow);

      const ecoNote = document.createElement("p");
      ecoNote.className = "log-eco-note";
      ecoNote.textContent = tr(
        "🟢 線上真人 · ⭐ 我的足跡 · 🤖 校園模擬（面板收合時背景 0 刷新型節能）",
        "🟢 Online Peers · ⭐ Your Footprints · 🤖 Eco NPCs (0 background CPU when closed)",
      );
      logBody.appendChild(ecoNote);

      srcBar.addEventListener("click", (e) => {
        const btn = e.target.closest?.("[data-logsrc]");
        if (!btn) return;
        logSrc = btn.dataset.logsrc;
        syncLogToolbar();
        renderLog();
      });

      pauseBtn.addEventListener("click", () => {
        logNpcPaused = !logNpcPaused;
        try {
          sessionStorage.setItem("htl_log_npc_paused", logNpcPaused ? "1" : "0");
        } catch {}
        syncLogToolbar();
      });

      clearBtn.addEventListener("click", () => {
        logItems.length = 0;
        pendingHoverFlush = false;
        renderLog();
      });
    }

    const listEl = $("#log-list");
    if (listEl) {
      listEl.addEventListener("pointerenter", () => {
        isHoveringLogList = true;
      });
      listEl.addEventListener("pointerleave", () => {
        isHoveringLogList = false;
        if (pendingHoverFlush) {
          pendingHoverFlush = false;
          renderLog();
        }
      });
      listEl.addEventListener("click", (e) => {
        const plazaBtn = e.target.closest?.("[data-open-plaza]");
        if (plazaBtn) {
          window.htlSocial?.toggleChat?.(true);
          return;
        }
        const row = e.target.closest?.("li.log-item");
        if (!row) return;
        if (row.dataset.peer && window.htlSocial?.focusPeer) {
          if (window.htlSocial.focusPeer(row.dataset.peer)) return;
        }
        if (row.dataset.sky) {
          selectSkyCraft(row.dataset.sky, { summonIfHidden: true });
          return;
        }
        if (row.dataset.bldg && buildings.has(row.dataset.bldg)) {
          selectBuilding(row.dataset.bldg);
          return;
        }
        if (row.dataset.walker != null && row.dataset.walker !== "") {
          const wi = Number(row.dataset.walker);
          if (Number.isFinite(wi) && peopleSys.people[wi]) {
            selectWalker(wi);
            return;
          }
        }
        if (row.dataset.isl && islands.has(row.dataset.isl)) {
          selectIsland(row.dataset.isl);
          return;
        }
        if (row.dataset.flowId && flows.has(row.dataset.flowId)) {
          selectFlow(row.dataset.flowId);
        }
      });
    }
  }

  $$("[data-logtab]").forEach(
    (b) =>
      (b.onclick = () => {
        $$("[data-logtab]").forEach((x) => x.setAttribute("aria-selected", String(x === b)));
        const ov = b.dataset.logtab === "overview";
        $("#overview-panel").hidden = !ov;
        $("#log-body").hidden = ov;
        if (ov) renderOverview();
        else {
          syncLogToolbar();
          renderLog();
        }
      }),
  );

  function renderLog() {
    const listEl = $("#log-list");
    if (!listEl) return;
    logPerfStats.fullRenders++;
    syncLogToolbar();
    const matched = logItems.filter(matchesLogFilter).slice(0, MAX_LOG_DOM_ROWS);
    listEl.replaceChildren();
    if (!matched.length) {
      const emptyLi = document.createElement("li");
      emptyLi.className = "log-empty-state";
      if (logSrc === "peer") {
        emptyLi.innerHTML = `<div class="les-box"><b>${esc(tr("目前尚無其他線上玩家動態", "No other online players yet"))}</b><p>${esc(tr("目前日誌中的校園協作與巡講皆為節能模擬 NPC。開啟「旅伴互動廣場」（或同瀏覽器開第二分頁／連上 WebSocket）即可即時看見真人夥伴進場、登島與對話！", "Campus routes are simulated by eco-throttled NPCs. Open the Multiplayer Plaza (or open a second browser tab) to see live players join, walk islands, and chat!"))}</p><button type="button" class="les-btn" data-open-plaza="1">${esc(tr("👥 開啟多人旅伴廣場", "👥 Open Multiplayer Plaza"))}</button></div>`;
      } else {
        emptyLi.innerHTML = `<div class="les-box"><b>${esc(tr("尚無符合篩選條件的動態", "No matching activity yet"))}</b><p>${esc(tr("請切換上方篩選分頁，或在島上點擊建築、布條與角色展開探索。", "Try another filter tab above or explore islands, sky banners, and landmarks."))}</p></div>`;
      }
      listEl.appendChild(emptyLi);
      return;
    }
    const frag = document.createDocumentFragment();
    for (const item of matched) frag.appendChild(createLogRowEl(item));
    listEl.appendChild(frag);
  }
  logFlow.onchange = renderLog;

  function sampleOneCampusNpc() {
    npcSampleStep++;
    // Every 3rd sample (when no flow filter is active), spotlight a faculty member briefing on an island so passerby chatter stays calm
    if (!logFlow.value && facultyWalkerPool.length && npcSampleStep % 3 === 1) {
      for (let k = 0; k < facultyWalkerPool.length; k++) {
        const entry = facultyWalkerPool[(npcCursor + k) % facultyWalkerPool.length];
        const fw = entry.w;
        if (fw.waiting && fw.atIsland && islands.has(fw.atIsland)) {
          npcCursor++;
          const teacher = FACULTY_BY_ID.get(fw.teacherId);
          if (teacher) {
            const islName = english ? nameOf(fw.atIsland) : shortNames[fw.atIsland] || nameOf(fw.atIsland);
            pushLogRecord({
              key: `fac|${teacher.id}|${fw.atIsland}`,
              actor: "npc",
              subActor: "faculty",
              type: "guide",
              kindLabel: tr("巡講", "Briefing"),
              island: fw.atIsland,
              walkerIdx: entry.idx,
              headHtml: `<span class="lt-who">${esc(txt(teacher.shortTitle))}</span>`,
              bodyHtml: `${esc(tr("駐點導覽", "Guiding at"))} <strong>${esc(islName)}</strong>`,
            });
            return;
          }
        }
      }
    }
    if (!flowWalkerPool.length) return;
    const filterFlow = logFlow.value;
    for (let tries = 0; tries < flowWalkerPool.length; tries++) {
      const entry = flowWalkerPool[npcCursor++ % flowWalkerPool.length];
      const w = entry.w;
      if (filterFlow && w.flow !== filterFlow) continue;
      if (!filterFlow && !w.interactive) continue;
      const waiting = (w.wait || 0) > 0;
      const evType = waiting ? (w.s >= w.route.total - 0.001 ? "arrive" : "handoff") : "depart";
      pushLog(w, evType, entry.idx);
      return;
    }
  }

  function tickLog(dt = 0.016) {
    logPerfStats.tickCalls++;
    // Zero CPU & zero DOM cost whenever #log is closed, on Overview tab, paused, or filtered to Real Players / Online Peers
    if (!toggleState.log || $("#log-body")?.hidden || logNpcPaused || logSrc === "players" || logSrc === "peer") {
      logPerfStats.skippedClosed++;
      return;
    }
    // Calm adaptive eco interval: 6.5s solo, auto-deferred to 15.0s when real online peers are present
    const intervalSec = onlinePeerCount > 0 ? 15.0 : 6.5;
    npcSampleAcc += dt;
    if (npcSampleAcc < intervalSec) {
      logPerfStats.skippedThrottle++;
      return;
    }
    npcSampleAcc = 0;
    logPerfStats.npcSamples++;
    sampleOneCampusNpc();
  }

  function pushExternalLog(detail) {
    if (!detail || typeof detail !== "object") return null;
    const actor = detail.actor === "peer" ? "peer" : detail.actor === "me" ? "me" : "npc";
    const islId = resolveLogIslandId(detail.islandId, detail.islandName);
    const kindLabels = {
      join: tr("進場", "Join"),
      leave: tr("離場", "Leave"),
      arrive: tr("登島", "Arrive"),
      chat: tr("發言", "Chat"),
      emote: tr("互動", "Emote"),
      explore: tr("探索", "Explore"),
      achieve: tr("成就", "Badge"),
      guide: tr("導覽", "Guide"),
    };
    const type = detail.type || "explore";
    const rawWho = detail.who ? String(detail.who).trim() : "";
    const who =
      actor === "me"
        ? !rawWho || rawWho === "我"
          ? tr("我（本人）", "You")
          : rawWho
        : rawWho || tr("旅伴", "Visitor");
    const roleTag = detail.role ? `<span class="lt-role">${esc(detail.role)}</span>` : "";
    const msgTxt = english ? detail.textEn || detail.text || detail.textZh || "" : detail.textZh || detail.text || detail.textEn || "";
    return pushLogRecord({
      key: detail.key || `${actor}|${type}|${detail.peerId || who}|${islId}|${msgTxt}`,
      noDedupe: !!detail.noDedupe,
      actor,
      type,
      kindLabel: detail.kindLabel || kindLabels[type] || tr("動態", "Live"),
      island: islId,
      building: detail.buildingId || "",
      skyCraft: detail.skyCraftId || "",
      flow: detail.flowId || "",
      peerId: detail.peerId || "",
      headHtml: `<b class="lt-player">${esc(who)}</b>${roleTag}`,
      bodyHtml: esc(msgTxt),
    });
  }

  window.__htlLog = {
    push: pushExternalLog,
    clear() {
      logItems.length = 0;
      pendingHoverFlush = false;
      renderLog();
    },
    setOnlineCount(n) {
      const next = Math.max(0, Number(n) || 0);
      if (onlinePeerCount !== next) {
        onlinePeerCount = next;
        if (toggleState.log) syncLogToolbar();
      }
    },
    getStats() {
      return {
        ...logPerfStats,
        totalItems: logItems.length,
        onlinePeerCount,
        logSrc,
        logNpcPaused,
        isOpen: !!toggleState.log,
      };
    },
  };
  window.addEventListener("htl:log", (e) => {
    if (e?.detail) pushExternalLog(e.detail);
  });

  // Listen to local RPG avatar walking onto a new island
  window.addEventListener("htl:avatar-island", (e) => {
    const d = e?.detail;
    if (!d?.id) return;
    const islLabel = english ? nameOf(d.id) : shortNames[d.id] || d.name || nameOf(d.id);
    const myName = d.playerName || window.heartIslandAvatar?.S?.look?.name || tr("我", "You");
    pushExternalLog({
      actor: "me",
      type: "arrive",
      who: myName,
      islandId: d.id,
      textZh: `操控 3D 角色漫遊抵達「${islLabel}」`,
      textEn: `Walked 3D avatar onto "${islLabel}"`,
    });
  });

  // Listen to local Passport XP / Stamps / Sky Banner / Achievements
  window.addEventListener("htl:xp", (e) => {
    const d = e?.detail;
    if (!d) return;
    const myName = window.heartIslandAvatar?.S?.look?.name || tr("我", "You");
    if (Array.isArray(d.freshChapters) && d.freshChapters.length) {
      const ch = d.freshChapters[0];
      pushExternalLog({
        actor: "me",
        type: "achieve",
        who: myName,
        islandId: selectedIsland || "",
        textZh: `${ch.ico || "🏆"} 完成主線「${ch.zh}」+${ch.xp} XP`,
        textEn: `${ch.ico || "🏆"} Cleared "${ch.en}" +${ch.xp} XP`,
      });
      return;
    }
    if (Array.isArray(d.freshBadges) && d.freshBadges.length) {
      const b = d.freshBadges[0];
      pushExternalLog({
        actor: "me",
        type: "achieve",
        who: myName,
        islandId: selectedIsland || "",
        textZh: `${b.ico || "🏅"} 解鎖成就徽章「${b.zh}」`,
        textEn: `${b.ico || "🏅"} Unlocked badge "${b.en}"`,
      });
    }
    if (Array.isArray(d.gained) && d.gained.length) {
      const topGain = [...d.gained].sort((a, b) => (b.xp || 0) - (a.xp || 0))[0];
      if (topGain?.label) {
        pushExternalLog({
          actor: "me",
          type: "explore",
          who: myName,
          islandId: selectedIsland || "",
          buildingId: selectedBuilding || "",
          skyCraftId: selectedSkyCraft || "",
          flowId: selectedFlows.size === 1 ? [...selectedFlows][0] : "",
          text: `${topGain.label} (+${topGain.xp} XP)`,
        });
      }
    }
  });

  // Seed lightweight initial entries (3 curated eco NPC context rows + 1 local welcome row) without DOM thrashing
  const interactiveSeedPool = flowWalkerPool.filter((e) => e.w.interactive);
  const seedPool = interactiveSeedPool.length ? interactiveSeedPool : flowWalkerPool;
  for (let i = 0; i < Math.min(3, seedPool.length); i++) {
    const entry = seedPool[i * Math.max(1, Math.floor(seedPool.length / 3))];
    if (entry) pushLog(entry.w, i % 2 === 0 ? "depart" : "arrive", entry.idx);
  }
  pushExternalLog({
    key: "me|welcome-boot",
    actor: "me",
    type: "explore",
    who: tr("您（本機訪客）", "You (Visitor)"),
    islandId: "civil",
    textZh: "已進入旅館島 · 點擊探索或開啟「👥 旅伴」皆會獨立標示於此",
    textEn: "Entered Hotel Island · Your discoveries & live peers appear distinctly here",
  });
  if (Array.isArray(window.__htlLogQueue)) {
    for (const qItem of window.__htlLogQueue.splice(0)) pushExternalLog(qItem);
  }
  function flowButtons(ids, from = null) {
    return `<div class="flow-chips">${ids
      .map((id) => {
        const f = flows.get(id);
        if (!f) return "";
        const others = [...f.from, ...f.to].filter((x) => x !== from && islands.has(x));
        const dir = f.from.includes(from) ? "→" : "←";
        const dest = others.length ? `${dir} ${english ? nameOf(others[0]) : shortNames[others[0]] || nameOf(others[0])}` + (others.length > 1 ? ` ${tr("等", "+")}${others.length}${tr("處", "")}` : "") : "";
        const th = themeOf(id);
        return `<button class="flow-chip" data-flow="${id}" data-hover-flow="${id}" title="${esc(txt(f.text))}"><i class="fl-dot" style="background:${th?.css || "#888"}" aria-hidden="true"></i><span>${esc(flowTitle(txt(f.text)))}<small> ${esc(dest)}${WEAK_FLOWS.has(id) ? tr("・延伸", " · related") : ""}</small></span><i aria-hidden="true">↗</i></button>`;
      })
      .join("")}</div>`;
  }
  function heartPills(list) {
    return list.length
      ? list.map((h) => `<span class="pill heart" style="--c:${HEART_COLORS[h]}"><i></i>${esc(tr("NKUHT", "Hospitality"))} · ${esc(tr(...(PILLAR_NAME[h] || [h, h])))}</span>`).join("")
      : "";
  }
  const NUM_RE = /[0-9０-９][0-9０-９,，.．]*\s*(?:萬|億|千)?\s*(?:公尺|公里|公頃|萬元|億元|元|歲|年|所|人|次|座|處|點|分鐘|個月|%|％|班|位|週|項|倍|成|棵|個|間|床|天|小時)?/;
  let tiledFacts = new Set();
  function statTiles(facts) {
    tiledFacts = new Set();
    const tiles = [];
    for (const f of facts) {
      const t = txt(f);
      if (f.tile && !f.tile.zh) continue; // explicitly not a tile (e.g. "台北 101" is a place, not a number)
      // a fact may name its own tile headline (e.g. "尖峰時段" instead of the first number found)
      const m = f.tile ? [txt(f.tile)] : t.match(NUM_RE);
      if (m && tiles.length < 3) tiledFacts.add(t), tiles.push(`<div class="stat${f.tile ? " long named" : ""}" style="--accent:${["#db6a41", "#3e7c8c", "#b8920f"][tiles.length]}"><b>${esc(m[0].trim())}</b><span class="lbl">${esc(t)}</span></div>`);
    }
    return tiles.length ? `<div class="stat-row">${tiles.join("")}</div>` : "";
  }
  function highlight() {
    for (const [id, v] of islandViews) {
      const i = islands.get(id),
        dim = selectedHeart.size && i.heart.length && !i.heart.some((h) => selectedHeart.has(h));
      if (!debug) v.top.material.color.set(dim ? 0x9a9590 : 0xffffff);
      v.outline.visible = selectedIsland === id;
      v.el.classList.toggle("selected", selectedIsland === id);
      {
        const c = centers.get(id),
          ir = islandR(id);
        if (selectedIsland === id) v.label.position.set(c.x, top + 0.06, c.z + ir * (id === "sport" ? 0.92 : 0.8));
        else v.label.position.set(c.x, top - 0.25, c.z + ir + 0.05);
      }
      v.el.classList.toggle("dim", !!dim || (!!selectedIsland && selectedIsland !== id));
    }
    document.querySelectorAll("#tree details[data-isl]").forEach((d) => {
      const cur = d.dataset.isl === selectedIsland;
      if (cur && !d.classList.contains("current")) {
        // scroll only the list itself (scrollIntoView would also scroll the page on mobile)
        const tree = d.closest("#tree");
        if (tree && tree.clientHeight) {
          const top = d.offsetTop - tree.offsetTop,
            bottom = top + d.offsetHeight;
          if (top < tree.scrollTop || bottom > tree.scrollTop + tree.clientHeight) tree.scrollTo({ top: Math.max(0, top - tree.clientHeight / 3), behavior: reduced.matches || innerWidth <= 800 ? "auto" : "smooth" });
        }
      }
      d.classList.toggle("current", cur);
    });
    for (const lm of LANDMARKS.values()) {
      const selected = lm.id === selectedLandmark || lm.id === hoverBuilding;
      const lmPin = landmarkPinViews.get(lm.id);
      if (lmPin) {
        lmPin.el.classList.toggle("sel", lm.id === selectedLandmark);
        lmPin.el.classList.toggle("hot", lm.id === hoverBuilding);
      }
      const i = islands.get(lm.island);
      const dim = selectedHeart.size && i?.heart.length && !i.heart.some((h) => selectedHeart.has(h));
      for (const p of lm.parts) {
        const c = selected ? p.color.clone().lerp(new THREE.Color(colors.coral), 0.24) : p.color.clone();
        if (dim) c.lerp(new THREE.Color(0xcfc5bf), 0.8);
        p.mesh.setColorAt(p.index, c);
        p.mesh.instanceColor.needsUpdate = true;
      }
    }
    for (const b of buildings.values()) {
      const active = dayLightIds.has(b.id) && mode === "day",
        selected = b.id === selectedBuilding || b.id === hoverBuilding,
        unknown = mode === "term" && !b.phase?.stages?.length;
      const i = islands.get(b.island),
        dim = selectedHeart.size && i.heart.length && !i.heart.some((h) => selectedHeart.has(h));
      for (const p of visual.get(b.id).parts) {
        const c = selected
          ? p.color.clone().lerp(new THREE.Color(colors.coral), 0.22)
          : unknown
            ? new THREE.Color(0xb8b0ac)
            : p.color.clone();
        if (active && !selected) c.lerp(new THREE.Color(colors.yellow), 0.22);
        if (dim) c.lerp(new THREE.Color(0xcfc5bf), 0.8);
        p.mesh.setColorAt(p.index, c);
        p.mesh.instanceColor.needsUpdate = true;
      }
    }
    dirty = true;
  }
  function showFlows(ids) {
    selectedFlows = new Set(ids);
    for (const p of flowPaths) p.mesh.visible = selectedFlows.has(p.flow) || showAllFlows;
    if (typeof updateHud === "function") updateHud();
    setGhosts(selectedIsland === "renewal");
    for (const [id, label] of portViews)
      label.visible =
        paths.some((p) => selectedFlows.has(p.flow) && (p.from === id || p.to === id));
    if ($("#legend")) $("#legend").hidden = !selectedFlows.size; // 2026-10-24：圖例已移除
    document.body.classList.toggle("flows-on", !!selectedFlows.size);
    updateWalkers();
    dirty = true;
  }
  // ---------- A7: numbered item pins for the explored island ----------
  let hoverBuilding = null;
  const canHover = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const pinGroup = new THREE.Group();
  scene.add(pinGroup);
  const pinViews = new Map();
  const pinLineMat = new THREE.LineBasicMaterial({ color: colors.coral, transparent: true, opacity: 0.85, depthTest: false });
  const CIRC = "①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮⑯⑰⑱⑲⑳㉑㉒㉓㉔㉕";
  // 2026-11-12: Island 09 hotel picker. The old directory was 25 full-width cards (≈1,400 px of scrolling) under an
  // island card that also listed the same 25 rows; this is one compact, searchable chip grid grouped by the region column
  // of the official partner table (OFFICIAL.partners → 北部／中部／南部／東部). Every chip is a [data-building] button, so
  // cardShow() wires it to selectBuilding() (or the RPG drive visit) like every other row.
  const HOTEL_REGION_EN = { 北部: "North", 中部: "Central", 南部: "South", 東部: "East" };
  function hotelRegions() {
    const sportIsl = islands.get("sport");
    if (!sportIsl) return [];
    const regionOf = new Map((OFFICIAL.partners || []).map((p) => [p.name, p.region]));
    const groups = new Map();
    sportIsl.buildings.forEach((b, idx) => {
      const region = regionOf.get(b.name?.zh) || "";
      const key = region || (b.id === "sport-h01" ? "__overseas" : "__other");
      if (!groups.has(key)) groups.set(key, { key, region, items: [] });
      groups.get(key).items.push({ b, no: String(idx + 1).padStart(2, "0") });
    });
    return [...groups.values()];
  }
  function hotelOrder() {
    return islands.get("sport")?.buildings.map((b) => b.id) || [];
  }
  function hotelDirectoryHTML(activeId = null) {
    const groups = hotelRegions();
    if (!groups.length) return "";
    const total = groups.reduce((n, g) => n + g.items.length, 0);
    const groupLabel = (g) =>
      g.key === "__overseas" ? tr("國（海）外實習與研修", "Overseas") : g.region ? tr(g.region, HOTEL_REGION_EN[g.region] || g.region) : tr("其他", "Other");
    const body = groups
      .map(
        (g) => `<div class="htl-pick-group" data-htl-group>
          <div class="htl-pick-region">${esc(groupLabel(g))}<span>${g.items.length}</span></div>
          <div class="htl-pick-grid">${g.items
            .map(({ b, no }) => {
              const cur = b.id === activeId;
              const search = `${b.name?.zh || ""} ${b.name?.en || ""} ${no} ${g.region}`.toLowerCase();
              return `<button type="button" class="htl-pick-chip${cur ? " active" : ""}" data-building="${esc(b.id)}" data-htl-search="${esc(search)}"${cur ? ' aria-current="true"' : ""} title="${esc(txt(b.name))}"><b>${esc(no)}</b><span>${esc(txt(b.name))}</span></button>`;
            })
            .join("")}</div>
        </div>`,
      )
      .join("");
    return `<div class="htl-pick" data-htl-pick>
      <div class="htl-pick-head">
        <div class="htl-dir-eyebrow">🏨 ${esc(tr(`實習旅館快速選單 · ${total} 棟`, `HOTEL PICKER · ${total} BUILDINGS`))}</div>
        <input type="search" class="htl-pick-search" data-htl-filter placeholder="${esc(tr("搜尋旅館名稱或地區…", "Search hotel or region…"))}" aria-label="${esc(tr("搜尋實習旅館", "Search internship hotels"))}">
      </div>
      ${body}
      <p class="htl-pick-empty" data-htl-empty hidden>${esc(tr("找不到符合的旅館", "No matching hotel"))}</p>
    </div>`;
  }
  // prev / next bar for the hotel building card (wraps around the island's official order)
  function hotelStepHTML(id) {
    const order = hotelOrder(),
      k = order.indexOf(id);
    if (k < 0) return "";
    const prev = order[(k - 1 + order.length) % order.length],
      next = order[(k + 1) % order.length];
    const nm = (bid) => txt(buildings.get(bid)?.name) || bid;
    return `<nav class="htl-step" aria-label="${esc(tr("切換實習旅館", "Step through hotels"))}">
      <button type="button" class="htl-step-btn" data-building="${esc(prev)}" data-hotel-step="prev" title="${esc(nm(prev))}" aria-label="${esc(tr("上一家：", "Previous: ") + nm(prev))}">‹ <span>${esc(tr("上一家", "Prev"))}</span></button>
      <button type="button" class="htl-step-pos" data-island="sport" title="${esc(tr("回到全島總覽", "Back to the island overview"))}"><b>${String(k + 1).padStart(2, "0")}</b> / ${order.length}</button>
      <button type="button" class="htl-step-btn" data-building="${esc(next)}" data-hotel-step="next" title="${esc(nm(next))}" aria-label="${esc(tr("下一家：", "Next: ") + nm(next))}"><span>${esc(tr("下一家", "Next"))}</span> ›</button>
    </nav>`;
  }
  function wireHotelPicker() {
    const root = $("#card-content")?.querySelector("[data-htl-pick]");
    const input = root?.querySelector("[data-htl-filter]");
    if (!input) return;
    input.addEventListener("input", () => {
      const q = input.value.trim().toLowerCase();
      let shown = 0;
      root.querySelectorAll("[data-htl-group]").forEach((g) => {
        let n = 0;
        g.querySelectorAll("[data-htl-search]").forEach((c) => {
          const ok = !q || c.dataset.htlSearch.includes(q);
          c.hidden = !ok;
          n += ok;
        });
        g.hidden = !n;
        shown += n;
      });
      root.querySelector("[data-htl-empty]").hidden = !!shown;
    });
    input.addEventListener("keydown", (e) => {
      if (e.key !== "Enter") return;
      const first = root.querySelector("[data-htl-search]:not([hidden])");
      if (first) (e.preventDefault(), first.click());
    });
  }
  function showPins(islandId) {
    for (const v of pinViews.values()) {
      pinGroup.remove(v.label, v.line);
      v.line.geometry.dispose();
    }
    pinViews.clear();
    if (!islandId) return syncSigns(), (dirty = true);
    const isl = islands.get(islandId);
    const n = isl.buildings.length;
    const isSport = islandId === "sport";
    isl.buildings.forEach((b, k) => {
      const v = visual.get(b.id);
      if (!v) return;
      const baseY = isSport ? top + 0.64 : top + Math.min(0.62, Math.max(0.32, (v.size || 0.6) * 0.6));
      const base = v.center.clone().setY(baseY);
      const lift = isSport ? 0.12 + (k % 4) * 0.1 : 0.32 + (k % 2) * 0.2 + (n > 8 ? (k % 3) * 0.1 : 0);
      const tip = base.clone().add(new THREE.Vector3(0, lift, 0));
      const geo = new THREE.BufferGeometry().setFromPoints([base, tip]);
      const line = new THREE.Line(geo, pinLineMat);
      line.renderOrder = 6;
      const el = document.createElement("button");
      el.className = "item-pin" + (isSport ? " hotel-name-pin" : n > 7 ? " compact" : "");
      el.dataset.pin = b.id;
      const pinNo = isSport ? String(k + 1).padStart(2, "0") : CIRC[k] || k + 1;
      el.innerHTML = `<b>${pinNo}</b><span>${esc(txt(b.name))}</span>`;
      el.setAttribute("aria-label", txt(b.name));
      el.onclick = (e) => (e.stopPropagation(), selectBuilding(b.id));
      if (canHover) {
        el.onmouseenter = () => hoverItem(b.id, true);
        el.onmouseleave = () => hoverItem(b.id, false);
      }
      const label = new CSS2DObject(el);
      label.position.copy(tip);
      pinGroup.add(line, label);
      pinViews.set(b.id, { label, line, el, tip, base });
    });
    syncSigns();
    dirty = true;
  }
  function syncSigns() {
    for (const m of signGroup.children) if (m.userData.item) m.visible = !pinViews.has(m.userData.item);
  }
  function hoverItem(id, on) {
    hoverBuilding = on ? id : null;
    for (const [bid, v] of pinViews) v.el.classList.toggle("hot", on && bid === id);
    for (const [lid, v] of landmarkPinViews) v.el.classList.toggle("hot", on && lid === id);
    document.querySelectorAll(`#tree [data-id="${id}"], #tree [data-lm-tree="${id}"]`).forEach((b) => b.classList.toggle("hot", on));
    highlight();
  }
  window.__pins = { showPins, pinViews, hoverItem };
  // read-only data + navigation for add-ons (quest.js: island passport); fired once the site data is ready
  window.__htl = {
    D,
    OFFICIAL,
    FACULTY,
    centers,
    shortNames,
    selectIsland,
    selectBuilding,
    selectLandmark: (id) => selectLandmark(id),
    selectSkyCraft: (id, opts) => selectSkyCraft(id, opts),
    skyFleet: env.skyFleet,
    skyline,
    isletWalks,
    decorIslets: decor.islets,
    LANDMARKS,
    selectTeacher: (id) => selectTeacher(id),
    startTour: () => startTour(),
    switchSiteLanguage: () => switchSiteLanguage(),
    icon,
  };
  window.dispatchEvent(new Event("htl:ready"));
  // The guided tour moves the camera on its own; only a viewer's own picks count.
  function trackSelect(type, id) {
    if (!tourActive) track("htl_select", { item_type: type, item_id: id });
  }
  function selectIsland(id, { silent = false } = {}) {
    const i = islands.get(id);
    if (!i) return;
    clearWalker();
    selectedIsland = id;
    selectedBuilding = null;
    selectedLandmark = null;
    showPins(id);
    document.querySelectorAll("#tree details[data-isl]").forEach((d) => {
      if (d.dataset.isl !== id && d.open) d.open = false;
    });
    highlight();
    flyTo(id);
    const fl = D.flows.filter((f) => f.from.includes(id) || f.to.includes(id)).map((f) => f.id);
    // 學習路線: an island shows its own routes; the F1 hub (16 spokes) only on the department-core island
    showFlows(fl.filter((fid) => !HUB_FLOWS.has(fid) || D.flows.find((f) => f.id === fid)?.from.includes(id)));
    const showHotelBoard = id === "sport";
    cardShow(
      `<div class="card-head"><div class="icon-tile">${icon(id)}</div><div><div class="eyebrow">ISLAND ${String(i.number).padStart(2, "0")} · ${esc(tr("系所主題", "THEME"))}</div><h2>${esc(txt(i.name))}</h2></div></div>
      <p class="lede">${esc(txt(i.summary))}</p>${txt(i.vision) ? `<blockquote class="vision">「${esc(txt(i.vision))}」</blockquote>` : ""}<div class="pills">${heartPills(i.heart)}<span class="pill soft">${i.buildings.length} ${tr("個細項", "items")}</span><span class="pill soft">${fl.length} ${tr("條路線連結", "route links")}</span></div>
      ${showHotelBoard ? hotelDirectoryHTML(null) : ""}
      ${showHotelBoard ? "" : (() => {
        const phases = new Set(i.buildings.map(shortPhase));
        const same = phases.size === 1 && !!shortPhase(i.buildings[0]);
        return `<h3>${tr("主題細項與亮點", "KEY HIGHLIGHTS")}</h3>${same ? `<p class="shared-phase"><b>${tr("共同階段", "Shared stage")}</b>${esc([...phases][0])}</p>` : ""}<div class="rows">${i.buildings.map((b) => `<button class="row" data-building="${b.id}"><span class="dot"></span><span class="nm">${esc(txt(b.name))}</span><span class="ph">${same ? "" : esc(stageChip(b))}</span><i aria-hidden="true">›</i></button>`).join("")}</div>`;
      })()}
      ${islandLandmarkHTML(id)}
      ${islandFacultyHTML(id)}
      <h3>${tr("和誰一起做", "CONNECTED WITH")}</h3>${flowButtons(fl, id)}
      <h3>${tr("官方系網來源", "OFFICIAL SOURCES")}</h3>${sourceLinks(i.sources)}`,
    );
    if (!silent) trackSelect("island", id);
  }
  const STAGE_CHIP = { "m8-18": tr("第二學年", "Year 2"), "year3-4": tr("第三學年", "Year 3"), "year5-8": tr("第四學年", "Year 4") }; // only stages stated on the official site (see policies.json phase.label)
  function stageChip(b) {
    const st = b.phase?.stages || [];
    if (!st.length) return "";
    const a = STAGE_CHIP[st[0]] || "",
      z = STAGE_CHIP[st[st.length - 1]] || "";
    return st.length > 1 && a !== z ? tr(`${a}起`, `${a}+`) : a;
  }
  function shortPhase(b) {
    return b.phase ? txt(b.phase.label) || "" : "";
  }
  // 📸 合照: the avatar stands in front of a landmark or building and faces the camera (heart-me.js photoWith)
  function photoWithSubject(id) {
    const api = window.heartIslandAvatar?.api;
    if (!api?.photoWith) return;
    const lm = LANDMARKS.get(id);
    if (lm) return api.photoWith({ x: lm.x, z: lm.z, h: Math.min(3.2, Math.max(0.5, (lm.pinBaseY || 0.9) - 0.02)), r: lm.fpRadius || 0.38, place: txt(lm.name).replace(/（.*）/, "") });
    const b = buildings.get(id),
      v = visual.get(id);
    if (b && v?.center) return api.photoWith({ x: v.center.x, z: v.center.z, h: Math.max(0.5, (v.size || 0.6) * 1.1), r: Math.max(0.3, (v.size || 0.6) * 0.55), place: txt(b.name) });
  }
  const photoBtnHTML = (id) => `<button type="button" class="pill soft photo-with-btn" data-photo-with="${esc(id)}" style="cursor:pointer;border:none">📸 ${esc(tr("和它合照", "Take a photo here"))}</button>`;
  function selectBuilding(id, { keepCamera = false } = {}) {
    const b = buildings.get(id);
    if (!b) return;
    clearWalker();
    clearSkyCraft();
    selectedIsland = b.island;
    selectedBuilding = id;
    selectedLandmark = null;
    if (![...pinViews.keys()].includes(id)) showPins(b.island);
    for (const [bid, v] of pinViews) v.el.classList.toggle("sel", bid === id);
    highlight();
    if (!keepCamera) flyTo(id);
    showFlows([]);
    const isl = islands.get(b.island);
    const isHotelItem = b.island === "sport";
    cardShow(
      `<div class="card-head"><div class="icon-tile thumb" data-thumb="${b.id}">${thumbCache.has(b.id) ? `<img src="${thumbCache.get(b.id)}" alt="">` : icon(b.island)}<span class="badge-ico">${icon(b.island, "sm")}</span></div><div><div class="eyebrow">${esc(txt(isl.name))} · ${tr("教學與實習細項", "HIGHLIGHT ITEM")}</div><h2>${esc(txt(b.name))}</h2></div></div>
      ${isHotelItem ? hotelStepHTML(b.id) : ""}
      <div class="pills">${heartPills(isl.heart)}<span class="pill status">${tr("系所亮點", "Highlight")}</span>${b.who ? `<span class="pill soft">${esc(tr("對象：", "For: "))}${esc(txt(b.who))}</span>` : ""}${photoBtnHTML(b.id)}</div>
      ${buildingFacultyHeroHTML(b)}
      ${b.plain ? `<p class="plain">${esc(txt(b.plain))}</p>` : ""}
      ${statTiles(b.facts)}
      <h3>${tr("重點", "KEY POINTS")}</h3><ul class="facts">${b.facts.filter((f) => !tiledFacts.has(txt(f))).map((f) => `<li>${esc(txt(f))}</li>`).join("") || `<li>${esc(txt(b.facts[0]))}</li>`}</ul>
      ${isHotelItem ? hotelDirectoryHTML(b.id) : ""}
      ${b.phase ? `<h3>${tr("四年學習階段", "LEARNING STAGE")}</h3>${timelineBar(b)}` : ""}
      <h3>${tr("和誰一起做", "CONNECTED WITH")}</h3>${flowButtons(b.flows, b.island)}
      <h3>${tr("真實資料專頁與官方來源", "DATA PAGE & OFFICIAL SOURCES")}</h3>
      <div class="sources"><a href="./p/${encodeURIComponent(b.id)}/${english ? "?lang=en" : ""}" target="_blank" rel="noopener noreferrer">📄 ${esc(tr(`開啟「${txt(b.name)}」獨立真實資料專頁（含完整事實與法規預覽）`, `Open "${txt(b.name)}" standalone data page`))} ↗</a></div>
      ${sourceLinks(b.sources)}`,
    );
    trackSelect("building", id);
  }
  function islandLandmarkHTML(islandId) {
    const lms = [...LANDMARKS.values()].filter((l) => l.island === islandId);
    if (!lms.length) return "";
    return `<h3>🏛️ ${esc(tr("高餐校園地標與景觀藝術", "NKUHT CAMPUS LANDMARKS & PUBLIC ART"))}</h3>
      <div class="rows">${lms
        .map(
          (l) => `<button type="button" class="row" data-landmark="${esc(l.id)}"><span class="dot" style="background:#d98b2b"></span><span class="nm">${esc(l.badge)} <b>${esc(txt(l.name))}</b></span><span class="ph">${esc(txt(l.category))}</span><i aria-hidden="true">›</i></button>`,
        )
        .join("")}</div>`;
  }
  function selectLandmark(id, { keepCamera = false } = {}) {
    const lm = LANDMARKS.get(id);
    if (!lm) return;
    clearWalker();
    clearSkyCraft();
    selectedIsland = lm.island;
    selectedBuilding = null;
    selectedLandmark = id;
    showPins(null);
    for (const [, v] of pinViews) v.el.classList.remove("sel");
    highlight();
    if (!keepCamera) flyTo(id);
    showFlows([]);
    const isl = islands.get(lm.island);
    const allLmRows = [...LANDMARKS.values()]
      .map((other) => {
        const oIsl = islands.get(other.island);
        const cur = other.id === lm.id;
        return `<button type="button" class="row${cur ? " active" : ""}" data-landmark="${esc(other.id)}" style="${cur ? "border-color:#d98b2b;background:rgba(230,190,83,0.12);" : ""}"><span class="dot" style="background:${cur ? "#db6a41" : "#173f3c"}"></span><span class="nm">${esc(other.badge)} <b>${esc(txt(other.name))}</b></span><span class="ph">${oIsl ? String(oIsl.number).padStart(2, "0") + " " + esc(english ? txt(oIsl.name) : shortNames[other.island]) : ""}</span><i aria-hidden="true">›</i></button>`;
      })
      .join("");
    cardShow(
      `<div class="card-head"><div class="icon-tile thumb" data-thumb="${esc(lm.id)}">${thumbCache.has(lm.id) ? `<img src="${thumbCache.get(lm.id)}" alt="">` : `<span class="ico" style="font-size:26px">${esc(lm.badge)}</span>`}<span class="badge-ico">${isl ? icon(lm.island, "sm") : ""}</span></div><div><div class="eyebrow">NKUHT CAMPUS LANDMARK · ${esc(txt(lm.category))}</div><h2>${esc(txt(lm.name))}</h2></div></div>
      <div class="pills">${isl ? heartPills(isl.heart) : ""}<span class="pill status">🏛️ ${esc(tr("高餐校園地標", "Campus Landmark"))}</span>${isl ? `<button type="button" class="pill soft" data-island="${esc(lm.island)}" style="cursor:pointer;border:none">📍 ${String(isl.number).padStart(2, "0")} ${esc(txt(isl.name))} ›</button>` : ""}${photoBtnHTML(lm.id)}</div>
      ${lm.id === "landmark:clocktower" && clockTower ? `<div class="clk-ring-row"><button type="button" class="clk-ring" data-ring-clock>${esc(tr("🔔 敲鐘", "🔔 Ring the bell"))}</button><small>${esc(
        (() => {
          const nb = clockTower.next?.();
          const dayZh = ["", "週一", "週二", "週三", "週四", "週五", "週六", "週日"],
            dayEn = ["", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
          const hm = nb ? `${String(Math.floor(nb.min / 60)).padStart(2, "0")}:${String(nb.min % 60).padStart(2, "0")}` : "";
          const when = nb ? tr(`下一次：${nb.today ? "今天" : dayZh[nb.wd]} ${hm} 第 ${nb.period} 節${nb.kind === "start" ? "上課" : "下課"}`, `Next: ${nb.today ? "today" : dayEn[nb.wd]} ${hm}, period ${nb.period} ${nb.kind === "start" ? "starts" : "ends"}`) : "";
          return tr(`平日依上下課時間自動敲鐘（台北時間）。${when}`, `Rings by itself at class start and end on weekdays (Taipei time). ${when}`);
        })(),
      )}</small></div>` : ""}
      ${lm.summary ? `<p class="plain">${esc(txt(lm.summary))}</p>` : ""}
      ${lm.features?.length ? `<h3>${esc(tr("3D 造型與校園意象亮點", "3D DESIGN & CAMPUS SYMBOLISM"))}</h3><ul class="facts">${lm.features.map((f) => `<li>${esc(txt(f))}</li>`).join("")}</ul>` : ""}
      ${lm.id.startsWith("landmark:art-") ? `<p class="plain">${esc(tr("作品名稱與代碼取自總務處「校園景觀藝術品」清單；3D 造型為依照片建模的示意。", "Title and code from the NKUHT General Affairs campus art list; the 3D model is a shape homage based on photos."))} <a href="https://ga.nkuht.edu.tw/p/403-1006-172-1.php?Lang=zh-tw" target="_blank" rel="noopener">${esc(tr("總務處校園景觀藝術品 ↗", "Campus art list ↗"))}</a></p>` : ""}
      <h3>🗺️ ${esc(tr(`巡禮全島 ${LANDMARKS.size} 座高餐校園地標與景觀藝術`, `TOUR ALL ${LANDMARKS.size} NKUHT CAMPUS LANDMARKS & ART`))}</h3>
      <div class="rows">${allLmRows}</div>`,
    );
    trackSelect("landmark", id);
  }
  function clearSkyCraft() {
    selectedSkyCraft = null;
    skyFollowAnchor = null;
    env.skyFleet?.clearFocus?.();
  }
  function flyToSkyCraft(id) {
    if (!env.skyFleet) return;
    const item = env.skyFleet.getCraft?.(id);
    if (!item) return;
    const rawTarget = env.skyFleet.getLookTarget(id, new THREE.Vector3());
    const target = rawTarget.clone();
    const off =
      item.kind === "airship"
        ? new THREE.Vector3(0.18, 0.95, 16.2)
        : item.kind === "balloon"
          ? new THREE.Vector3(0.22, 0.45, 6.4)
          : new THREE.Vector3(0.16, 0.78, 13.4);
    const pos = target.clone().add(off);
    if (stage.clientWidth > 800 && !tourActive) {
      const sideHidden = app.classList.contains("sidebar-hidden");
      const shiftX =
        item.kind === "airship"
          ? sideHidden ? 1.7 : 2.28
          : item.kind === "balloon"
            ? sideHidden ? 0.68 : 0.92
            : sideHidden ? 1.42 : 1.88;
      target.x -= shiftX;
      pos.x -= shiftX;
    } else if (stage.clientWidth <= 800 && !tourActive) {
      target.y -= 0.42;
      pos.y -= 0.18;
    }
    skyFollowAnchor = rawTarget.clone();
    if (reduced.matches) {
      camera.position.copy(pos);
      controls.target.copy(target);
      controls.update();
      dirty = true;
    } else {
      fly = { time: performance.now(), from: camera.position.clone(), to: pos, old: controls.target.clone(), target };
    }
  }
  function selectSkyCraft(id, { summonIfHidden = false } = {}) {
    if (!env.skyFleet) return;
    const prevSky = selectedSkyCraft;
    clearWalker();
    const item = env.skyFleet.focusCraft?.(id, { forceSummon: summonIfHidden || prevSky !== id });
    if (!item) return;
    selectedSkyCraft = id;
    selectedIsland = null;
    selectedBuilding = null;
    selectedLandmark = null;
    showPins(null);
    showFlows([]);
    highlight();
    flyToSkyCraft(id);
    renderTree();

    const sp = item.spec;
    const isl = sp.targetIsland ? islands.get(sp.targetIsland) : null;
    const bld = sp.targetBuilding ? buildings.get(sp.targetBuilding) : null;
    const held = env.skyFleet.isHeld?.(id);
    const bannerHeadline = sp.title || `✦ ${sp.label} ✦`;
    const bgCol = sp.bannerBg || sp.sashBg || "#122820";
    const bdCol = sp.bannerBorder || sp.sashBorder || "#e6b84c";
    const fgCol = sp.bannerText || sp.sashText || "#fff8e7";
    const subCol = sp.bannerSub || sp.sashBorder || "#f5d27a";

    const saluteLabel =
      item.kind === "balloon"
        ? tr("🔥 噴火光雕致敬", "🔥 Burner Salute")
        : item.kind === "airship"
          ? tr("✨ 皇家霓虹致敬", "✨ Blimp Salute")
          : tr("🛩️ 翻滾閃燈致敬", "🛩️ Wing Salute");

    const plannerTab = sp.plannerTab || "sky";
    const plannerBtnLabel =
      plannerTab === "sim"
        ? tr("🧮 1+3 證照試算", "🧮 1+3 Simulator")
        : plannerTab === "intern"
          ? tr("🏨 學分＆實習志願", "🏨 Credits & Intern")
          : tr("🗓️ 天空排程總表", "🗓️ Sky Timetable");

    const catalog = env.skyFleet.catalog || [];
    const fleetRows = catalog
      .map((c) => {
        const cur = c.id === id;
        const cTitle = txt(c.spec.name);
        const cKindTag =
          c.kind === "airship"
            ? tr("禮賓飛船", "Sky Blimp")
            : c.kind === "balloon"
              ? tr("光雕熱氣球", "Balloon")
              : tr("拉布條專機", "Banner Plane");
        return `<button type="button" class="row${cur ? " active" : ""}" data-sky-craft="${esc(c.id)}" style="${cur ? "border-color:#d98b2b;background:rgba(230,190,83,0.14);" : ""}"><span class="dot" style="background:${cur ? "#db6a41" : "#1b4338"}"></span><span class="nm">${esc(c.spec.badge)} <b>${esc(cTitle)}</b></span><span class="ph">${esc(cKindTag)}</span><i aria-hidden="true">›</i></button>`;
      })
      .join("");

    cardShow(
      `<div class="card-head">
        <div class="icon-tile" style="background:${esc(bgCol)};border:2px solid ${esc(bdCol)};color:${esc(fgCol)};font-size:26px">${esc(sp.badge)}</div>
        <div>
          <div class="eyebrow">NKUHT SKY FLEET · ${esc(txt(sp.category))}</div>
          <h2>${esc(txt(sp.name))}</h2>
        </div>
      </div>
      <div class="pills">
        <span class="pill status">🕒 ${esc(txt(sp.schedule))}</span>
        <span class="pill soft">🛂 ${esc(tr("首次點擊 +15 XP", "First Discovery +15 XP"))}</span>
        ${isl ? `<button type="button" class="pill soft" data-island="${esc(isl.id)}" style="cursor:pointer;border:none">📍 ${String(isl.number).padStart(2, "0")} ${esc(english ? txt(isl.name) : shortNames[isl.id])} ›</button>` : ""}
      </div>
      <div class="sky-banner-plaque" style="--bg:${esc(bgCol)};--bd:${esc(bdCol)};--fg:${esc(fgCol)};--sub:${esc(subCol)}">
        <div class="sbp-kicker">${esc(tr("3D 雙面布條／球身橫幅即時文字", "LIVE 3D DOUBLE-SIDED SKY BANNER TEXT"))}</div>
        <div class="sbp-title">${esc(bannerHeadline)}</div>
        <div class="sbp-sub">${esc(sp.sub || "")}</div>
      </div>
      <div class="sky-ctrl-box">
        <div class="sky-ctrl-label">
          <span>🎮 ${esc(tr("飛行器即時互動操控（可拖曳 360° 環視雙面布條）", "LIVE 3D SKY CRAFT INTERACTION"))}</span>
        </div>
        <div class="sky-ctrl-grid">
          <button type="button" class="sky-ctrl-btn primary" data-sky-salute="${esc(id)}">${saluteLabel}</button>
          <button type="button" class="sky-ctrl-btn${held ? " active" : ""}" data-sky-hold="${esc(id)}">${held ? tr("▶️ 恢復空中巡航", "▶️ Resume Flight") : tr("⏸️ 空中懸停細看", "⏸️ Hold Mid-Air")}</button>
          ${bld ? `<button type="button" class="sky-ctrl-btn" data-building="${esc(bld.id)}">🏛️ ${esc(tr("前往 3D 亮點", "Visit 3D Spot"))}</button>` : isl ? `<button type="button" class="sky-ctrl-btn" data-island="${esc(isl.id)}">🏝️ ${esc(tr("前往主題島", "Visit Island"))}</button>` : ""}
          <button type="button" class="sky-ctrl-btn" data-sky-planner="${esc(plannerTab)}">${plannerBtnLabel}</button>
        </div>
        <div class="sky-time-row" role="group" aria-label="${esc(tr("切換飛行光影時段", "Switch Sky Lighting"))}">
          <button type="button" class="sky-time-chip${dayMinutes >= 330 && dayMinutes < 540 ? " on" : ""}" data-sky-time="390"><span class="stc-lbl">🌅 ${esc(tr("晨飛", "Dawn"))}</span><small class="stc-tm">06:30</small></button>
          <button type="button" class="sky-time-chip${dayMinutes >= 540 && dayMinutes < 960 ? " on" : ""}" data-sky-time="720"><span class="stc-lbl">☀️ ${esc(tr("晴空", "Noon"))}</span><small class="stc-tm">12:00</small></button>
          <button type="button" class="sky-time-chip${dayMinutes >= 960 && dayMinutes < 1170 ? " on" : ""}" data-sky-time="1080"><span class="stc-lbl">🌇 ${esc(tr("霞光", "Dusk"))}</span><small class="stc-tm">18:00</small></button>
          <button type="button" class="sky-time-chip${dayMinutes >= 1170 || dayMinutes < 330 ? " on" : ""}" data-sky-time="1230"><span class="stc-lbl">🌙 ${esc(tr("光雕", "Glow"))}</span><small class="stc-tm">20:30</small></button>
        </div>
      </div>
      <p class="plain">${esc(txt(sp.summary))}</p>
      <h3>${esc(tr("布條宣導重點與官方系所事實", "BANNER HIGHLIGHTS & OFFICIAL FACTS"))}</h3>
      <ul class="facts">${(sp.facts || []).map((f) => `<li>${esc(txt(f))}</li>`).join("")}</ul>
      ${sp.officialUrl ? `<h3>${esc(tr("官方系網佐證專區", "OFFICIAL PORTAL LINK"))}</h3><div class="sources"><a href="${esc(sp.officialUrl)}" target="_blank" rel="noopener noreferrer">↗ ${esc(txt(sp.officialLabel) || sp.officialUrl)}</a></div>` : ""}
      <h3>✈️ ${esc(tr(`召喚與切換全島 ${catalog.length} 架空中宣導機隊＆熱氣球`, `DISPATCH & SWITCH ALL ${catalog.length} SKY BANNERS & BALLOONS`))}</h3>
      <div class="rows">${fleetRows}</div>`,
    );
    if (!tourActive) track("htl_select", { item_type: "skyCraft", item_id: id, item_label: txt(sp.name) });
  }
  // Single-sample offscreen render target: WebGL2 readPixels on multisampled FBOs (samples > 0)
  // fails with GL_INVALID_OPERATION on iOS WebKit & mobile Chrome, producing solid-black/broken 160x160 JPEGs.
  const thumbRT = new THREE.WebGLRenderTarget(160, 160);
  thumbRT.texture.colorSpace = THREE.SRGBColorSpace;
  const thumbCam = new THREE.PerspectiveCamera(30, 1, 0.05, 60);
  const thumbCache = new Map();
  function pixelsToJpegDataUrl(px) {
    let lit = 0;
    for (let i = 0; i < px.length; i += 64) {
      if (px[i] > 6 || px[i + 1] > 6 || px[i + 2] > 6) {
        if (++lit >= 12) break;
      }
    }
    if (lit < 12) return null;
    const cv = document.createElement("canvas");
    cv.width = cv.height = 160;
    const g = cv.getContext("2d");
    if (!g) return null;
    const img = g.createImageData(160, 160);
    for (let y = 0; y < 160; y++) img.data.set(px.subarray((159 - y) * 640, (160 - y) * 640), y * 640);
    g.putImageData(img, 0, 0);
    return cv.toDataURL("image/jpeg", 0.85);
  }
  function portrait(w) {
    if (!w?.world || params.get("thumbs") === "0") return null;
    const sc = w.drawScale || 0.8;
    const isFac = w.kind === "puma" || w.kind === "faculty";
    const c = w.world.clone().add(new THREE.Vector3(0, (isFac ? 0.38 : 0.3) * sc, 0));
    thumbCam.position.copy(c).add(new THREE.Vector3(isFac ? 0.46 : 0.38, isFac ? 0.26 : 0.22, isFac ? 0.84 : 0.62).multiplyScalar(sc));
    thumbCam.lookAt(c);
    const wasRing = selRing.visible;
    selRing.visible = false;
    const px = new Uint8Array(160 * 160 * 4);
    try {
      renderer.setRenderTarget(thumbRT);
      renderer.render(scene, thumbCam);
      renderer.readRenderTargetPixels(thumbRT, 0, 0, 160, 160, px);
    } catch {
      return null;
    } finally {
      renderer.setRenderTarget(null);
      selRing.visible = wasRing;
    }
    return pixelsToJpegDataUrl(px);
  }
  function thumbnail(id) {
    if (params.get("thumbs") === "0") return null;
    if (thumbCache.has(id)) return thumbCache.get(id);
    if (LANDMARKS.has(id)) {
      const lm = LANDMARKS.get(id);
      const s = lm.thumbSize || 0.72;
      const c = lm.center.clone();
      thumbCam.position.copy(c).add(new THREE.Vector3(0.95, 0.72, 1.42).multiplyScalar(s * 1.48));
      thumbCam.lookAt(c);
      for (const m of peopleSys.meshes) m.visible = false;
      const px = new Uint8Array(160 * 160 * 4);
      try {
        renderer.setRenderTarget(thumbRT);
        renderer.render(scene, thumbCam);
        renderer.readRenderTargetPixels(thumbRT, 0, 0, 160, 160, px);
      } catch {
        return null;
      } finally {
        renderer.setRenderTarget(null);
        for (const m of peopleSys.meshes) m.visible = true;
        dirty = true;
      }
      const url = pixelsToJpegDataUrl(px);
      if (url) thumbCache.set(id, url);
      return url;
    }
    const v = visual.get(id);
    if (!v) return null;
    const s = v.size || 0.6;
    const c = v.center.clone().setY(top + s * 0.28);
    thumbCam.position.copy(c).add(new THREE.Vector3(0.95, 0.85, 1.35).multiplyScalar(s * 1.55));
    thumbCam.lookAt(c);
    for (const m of peopleSys.meshes) m.visible = false;
    const px = new Uint8Array(160 * 160 * 4);
    try {
      renderer.setRenderTarget(thumbRT);
      renderer.render(scene, thumbCam);
      renderer.readRenderTargetPixels(thumbRT, 0, 0, 160, 160, px);
    } catch {
      return null;
    } finally {
      renderer.setRenderTarget(null);
      for (const m of peopleSys.meshes) m.visible = true;
      dirty = true;
    }
    const url = pixelsToJpegDataUrl(px);
    if (url) thumbCache.set(id, url);
    return url;
  }
  const STAGE_SEG = { "m1-8": [1, 2], "m8-18": [2], "m18-28": [2, 3], year1: [2], "year1-2": [2], "year2-3": [2, 3], "year3-4": [3], "year5-8": [4], "year4+": [3, 4] };
  function stageSegs(b) {
    const out = new Set();
    for (const st of b.phase?.stages || []) for (const n of STAGE_SEG[st] || []) out.add(n);
    return out;
  }
  function timelineBar(b) {
    if (!b.phase) return "";
    const label = txt(b.phase.label) || "";
    const on = stageSegs(b);
    const segs = D.termTimeline.map((t, n) => (english ? ["Overview", "Year 1", "Year 2", "Year 3", "Year 4"][n] : txt(t.label)));
    const bar = on.size ? `<div class="timeline">${segs.map((t, n) => `<span class="${on.has(n) ? "on" : ""}">${esc(t)}</span>`).join("")}</div>` : "";
    return `${bar}<div class="phase">${esc(label)}</div>`;
  }
  const tierLabels = {
    official_explicit: ["官網明文", "Stated on the official site"],
    official_thematic: ["官網內容關聯", "Related official content"],
    transcript_pending: ["三明治核心精神", "Sandwich core"],
    mixed: ["產學與課程整合", "Industry-academia integration"],
  };
  function tierLabel(t) {
    return tr(...(tierLabels[t] || [t, t]));
  }
  function nameOf(id) {
    return txt(islands.get(id)?.name || D.ports.find((p) => p.id === id)?.name) || id;
  }
  function quoteHTML(q) {
    return `<div class="quote"><p>「${esc(txt(q.text))}」</p><p class="small">${esc(txt(q.program))} · ${esc(q.timecode)}</p><a href="${esc(q.url)}" target="_blank" rel="noopener noreferrer">${tr("開啟訪談 ↗", "Open interview ↗")}</a></div>`;
  }
  function selectFlow(id) {
    const f = flows.get(id);
    if (!f) return;
    clearWalker();
    selectedBuilding = null;
    selectedLandmark = null;
    selectedIsland = f.from.find((x) => islands.has(x)) || null;
    highlight();
    showFlows([id]);
    flyTo("all-card");
    // 2026-11-13: the connection card used to show game jargon (搬運圖示 / 角色) and a static from→to strip, so the
    // feature read as decoration. It is now a route you can follow: every stop is clickable (camera flies there,
    // the card stays), 「沿線導覽」 tours the stops in order, and ‹ › step through all connections.
    const walkersOn = peopleSys.people.filter((w) => w.kind === "flow" && w.flow === id);
    const stops = [...f.from, ...f.to].filter((x, i, a) => islands.has(x) && a.indexOf(x) === i);
    // ‹ › step through the routes of the same theme
    const theme = themeOf(id);
    const order = theme ? theme.ids : D.flows.map((x) => x.id);
    const at = order.indexOf(id);
    const prevId = order[(at - 1 + order.length) % order.length],
      nextId = order[(at + 1) % order.length];
    const stopHTML = (x, i) => {
      const isl = islands.get(x);
      const role = i < f.from.filter((y) => islands.has(y)).length ? tr("起點", "From") : tr("連結", "To");
      return `<li class="fl-stop" data-fl-i="${i}"><button type="button" class="fl-go" data-fl-stop="${esc(x)}">${icon(x, "sm")}<span class="fl-txt"><small>${esc(role)} · ${String(isl.number).padStart(2, "0")}</small><b>${esc(nameOf(x))}</b></span></button><button type="button" class="fl-open" data-island="${esc(x)}" title="${esc(tr("開啟島嶼介紹", "Open island"))}" aria-label="${esc(tr("開啟島嶼介紹", "Open island"))}">›</button></li>`;
    };
    cardShow(
      `<div class="card-head"><div class="icon-tile flow" style="background:${theme?.css || ""};color:#fff"><b>${id}</b></div><div><div class="eyebrow">${tr("學習路線", "LEARNING ROUTE")} · ${esc(theme ? tr(theme.zh, theme.en) : "")} · ${at + 1} / ${order.length}</div><h2>${esc(flowTitle(txt(f.text)))}</h2></div></div>
      <p class="plain">${esc(txt(f.text))}</p>
      <div class="pills"><span class="pill">${esc(tierLabel(f.evidenceTier))}</span>${WEAK_FLOWS.has(id) ? `<span class="pill soft">${tr("延伸關聯", "Related")}</span>` : ""}<span class="pill soft">${stops.length} ${tr("個島嶼", "islands")}</span>${walkersOn.length ? `<span class="pill soft">${walkersOn.length} ${tr("位師生沿線移動", "people on the route")}</span>` : ""}</div>
      <div class="fl-bar">
        <button type="button" class="fl-play" data-fl-play>▶ ${tr("沿線導覽", "Tour this route")}</button>
        <button type="button" class="fl-step" data-flow="${esc(prevId)}" aria-label="${esc(tr("上一條路線", "Previous route"))}">‹</button>
        <button type="button" class="fl-step" data-flow="${esc(nextId)}" aria-label="${esc(tr("下一條路線", "Next route"))}">›</button>
      </div>
      <ol class="fl-stops">${stops.map(stopHTML).join("")}</ol>
      ${f.edgeNotes?.length ? `<h3>${tr("各段依據", "BASIS BY BRANCH")}</h3><ul class="facts">${f.edgeNotes.map((e) => `<li>${esc(nameOf(e.to))}：${esc(tierLabel(e.tier))}</li>`).join("")}</ul>` : ""}
      <h3>${tr("關係出處", "SOURCES")}</h3>${sourceLinks(f.sources)}${f.quotes.map((qid) => quoteHTML(quotes.get(qid))).join("")}`,
    );
    const root = $("#card-content");
    const mark = (i) => root.querySelectorAll(".fl-stop").forEach((li) => li.classList.toggle("on", +li.dataset.flI === i));
    let tourTimer = null;
    const stopTour = () => {
      clearTimeout(tourTimer);
      tourTimer = null;
      const b = root.querySelector("[data-fl-play]");
      if (b) b.textContent = `▶ ${tr("沿線導覽", "Tour this route")}`;
    };
    const visit = (x, i) => {
      if (flowCardId !== id) return stopTour();
      mark(i);
      flyTo(x);
    };
    flowCardId = id;
    root.querySelectorAll("[data-fl-stop]").forEach((b, i) =>
      b.addEventListener("click", () => {
        stopTour();
        visit(b.dataset.flStop, i);
      }),
    );
    root.querySelector("[data-fl-play]")?.addEventListener("click", (e) => {
      if (tourTimer) {
        stopTour();
        return flyTo("all-card");
      }
      e.currentTarget.textContent = `■ ${tr("停止導覽", "Stop tour")}`;
      const step = (i) => {
        if (flowCardId !== id) return stopTour();
        if (i >= stops.length) {
          stopTour();
          mark(-1);
          return flyTo("all-card");
        }
        visit(stops[i], i);
        tourTimer = setTimeout(() => step(i + 1), reduced.matches ? 1800 : 2600);
      };
      step(0);
    });
    trackSelect("flow", id);
  }
  let flowCardId = null;
  function matchSearchTokens(hayObj, qStr) {
    if (!qStr) return true;
    const hay = (typeof hayObj === "string" ? hayObj : JSON.stringify(hayObj)).toLowerCase();
    const tokens = qStr.split(/[\s,，、・/]+/).filter(Boolean);
    return tokens.every((tok) => hay.includes(tok));
  }
  function renderTree() {
    const q = $("#search").value.trim().toLowerCase(),
      root = $("#tree");
    root.innerHTML = "";
    if (treeMode === "landmarks") {
      [...LANDMARKS.values()]
        .filter((l) => matchSearchTokens([l.name, l.category, l.summary, l.signZh, l.signEn], q))
        .forEach((l) => {
          const isl = islands.get(l.island);
          const islLabel = isl ? `${String(isl.number).padStart(2, "0")} ${english ? txt(isl.name) : shortNames[l.island] || txt(isl.name)}` : l.island;
          const b = document.createElement("button");
          b.type = "button";
          b.dataset.lmTree = l.id;
          b.className = "flow-item landmark-tree-item" + (selectedLandmark === l.id ? " active" : "");
          b.innerHTML = `<div class="lmt-row"><span class="lmt-ico" aria-hidden="true">${esc(l.badge)}</span><div class="lmt-meta"><div class="lmt-cat">${esc(txt(l.category))}</div><div class="lmt-title">${esc(txt(l.name))}</div><div class="lmt-loc">${esc(islLabel)} · ${esc(tr("點擊 3D 巡禮 ↗", "3D Focus ↗"))}</div></div></div>`;
          b.onclick = () =>
            window.heartIslandAvatar?.S?.drive && window.heartIslandAvatar?.api?.visitLandmark
              ? window.heartIslandAvatar.api.visitLandmark(l.id, { walkIfNear: true })
              : selectLandmark(l.id);
          if (canHover) {
            b.onmouseenter = () => hoverItem(l.id, true);
            b.onmouseleave = () => hoverItem(l.id, false);
          }
          root.appendChild(b);
        });
      if (!root.children.length) root.textContent = tr("沒有符合的地標或裝置藝術", "No matching landmarks");
      return;
    }
    if (treeMode !== "faculty" && treeMode !== "flows" && LANDMARKS.size) {
      const lmMatches = [...LANDMARKS.values()].filter((l) => matchSearchTokens([l.name, l.category, l.summary, l.signZh, l.signEn], q));
      if (lmMatches.length) {
        const lmDet = document.createElement("details");
        lmDet.className = "landmarks-tree";
        lmDet.open = true;
        lmDet.innerHTML = `<summary><span class="index" style="background:#173f3c;color:#e6be53">🏛️</span><span class="item-name"><b>${esc(tr("高餐校園地標與景觀藝術", "NKUHT Landmarks & Art"))}</b></span><span class="count">${lmMatches.length} ${esc(tr("處 ↗", "↗"))}</span></summary><div class="children">${lmMatches
          .map((l) => `<button type="button" data-lm-tree="${esc(l.id)}" class="${selectedLandmark === l.id ? "hot" : ""}"><b class="pin-no">${esc(l.badge)}</b>${esc(txt(l.name))}</button>`)
          .join("")}</div>`;
        lmDet.querySelectorAll("[data-lm-tree]").forEach((b) => {
          b.onclick = () => (window.heartIslandAvatar?.S?.drive && window.heartIslandAvatar?.api?.visitLandmark ? window.heartIslandAvatar.api.visitLandmark(b.dataset.lmTree) : selectLandmark(b.dataset.lmTree));
        });
        root.appendChild(lmDet);
      }
      const skyCat = env.skyFleet?.catalog || [];
      if (skyCat.length) {
        const skyMatches = skyCat.filter((c) =>
          matchSearchTokens(
            [c.spec.name, c.spec.category, c.spec.title || c.spec.label, c.spec.sub, c.spec.summary, "飛行器 飛機 布條 飛船 熱氣球 sky banner plane blimp balloon"],
            q,
          ),
        );
        if (skyMatches.length) {
          const skyDet = document.createElement("details");
          skyDet.className = "landmarks-tree sky-fleet-tree";
          skyDet.open = !!q || selectedSkyCraft !== null;
          skyDet.innerHTML = `<summary><span class="index" style="background:#15362c;color:#ecc056">✈️</span><span class="item-name"><b>${esc(tr("空中宣導機隊與光雕熱氣球", "Sky Banner Fleet & Balloons"))}</b></span><span class="count">${skyMatches.length} ${esc(tr("架 ↗", "↗"))}</span></summary><div class="children">${skyMatches
            .map((c) => `<button type="button" data-sky-tree="${esc(c.id)}" class="${selectedSkyCraft === c.id ? "hot" : ""}"><b class="pin-no">${esc(c.spec.badge)}</b>${esc(txt(c.spec.name))}</button>`)
            .join("")}</div>`;
          skyDet.querySelectorAll("[data-sky-tree]").forEach((b) => {
            b.onclick = () => selectSkyCraft(b.dataset.skyTree, { summonIfHidden: true });
          });
          root.appendChild(skyDet);
        }
      }
    }
    if (treeMode === "faculty") {
      FACULTY.filter((t) => matchSearchTokens(t, q)).forEach((t, idx) => {
        const w = peopleSys.people.find((p) => p.teacherId === t.id || (t.id === "hsieh-wc" && p.kind === "puma"));
        const curIsl = w?.atIsland ? (english ? nameOf(w.atIsland) : shortNames[w.atIsland] || nameOf(w.atIsland)) : (english ? nameOf(t.islands[0]) : shortNames[t.islands[0]]);
        const b = document.createElement("button");
        b.className = "flow-item faculty-tree-item";
        b.innerHTML = `<div class="ft-row"><img class="ft-avatar" src="${esc(thumb(t.photo))}" loading="lazy" decoding="async" alt="${esc(txt(t.name))}"><div class="ft-meta"><div class="ft-title"><b>${String(idx + 1).padStart(2, "0")}</b> ${esc(txt(t.name))} <span class="ft-role">${esc(txt(t.title))}</span></div><div class="ft-spec">${esc((english ? t.specialties.en : t.specialties.zh).slice(0, 4).join(" · "))}</div><div class="ft-loc">📍 ${esc(tr("目前巡講：", "Now at: "))}<strong>${esc(curIsl)}</strong> · ${esc(tr("點擊 3D 導覽解說 ↗", "3D Guide ↗"))}</div></div></div>`;
        b.onclick = () => selectTeacher(t.id);
        root.appendChild(b);
      });
    } else if (treeMode === "flows") {
      // 學習路線: five theme groups; "show route" lights the whole theme on the map
      for (const th of FLOW_THEMES) {
        const list = th.ids.map((id) => flows.get(id)).filter((f) => f && matchSearchTokens(f, q));
        if (!list.length) continue;
        const sec = document.createElement("section");
        sec.className = "route-group";
        sec.style.setProperty("--rc", th.css);
        sec.innerHTML = `<div class="route-head"><i class="fl-dot" aria-hidden="true"></i><b>${esc(tr(th.zh, th.en))}</b><span class="count">${list.length} ${tr("條", "links")}</span><button type="button" class="route-show">${tr("顯示路線", "Show route")}</button></div>`;
        sec.querySelector(".route-show").onclick = () => {
          selectedIsland = null;
          highlight();
          showFlows(th.ids.filter((id) => !HUB_FLOWS.has(id)));
          flyTo("all-card");
        };
        for (const f of list) {
          const b = document.createElement("button");
          b.className = "flow-item";
          b.innerHTML = `<span class="fl-t">${esc(flowTitle(txt(f.text)))}</span><span class="count">${f.id}${HUB_FLOWS.has(f.id) ? tr("・總覽", " · overview") : WEAK_FLOWS.has(f.id) ? tr("・延伸", " · related") : ""}</span>`;
          b.onclick = () => selectFlow(f.id);
          sec.appendChild(b);
        }
        root.appendChild(sec);
      }
    } else
      for (const i of D.islands) {
        const matchName = matchSearchTokens(i.name, q),
          bs = i.buildings.filter((b) => matchName || matchSearchTokens(b, q));
        if (!bs.length) continue;
        const details = document.createElement("details");
        details.open = !!q;
        if (q) details.dataset.auto = "1"; // opened by the search filter, not by the reader
        details.dataset.isl = i.id;
        if (i.id === selectedIsland) details.classList.add("current");
        details.innerHTML = `<summary><span class="index">${String(i.number).padStart(2, "0")}</span><span class="item-name">${esc(english ? txt(i.name) : shortNames[i.id])}</span><span class="count">${i.id === "sport" ? tr("25家 ↗", "25 ↗") : `${bs.length} ↗`}</span></summary><div class="children"><button class="island-open">${tr("探索此主題島", "Explore this island")} ↗</button>${bs
          .map((b) => `<button data-id="${b.id}"><b class="pin-no">${CIRC[i.buildings.indexOf(b)] || i.buildings.indexOf(b) + 1}</b>${esc(txt(b.name))}</button>`)
          .join("")}</div>`;
        const islLms = [...LANDMARKS.values()].filter((l) => l.island === i.id);
        details.querySelector(".island-open").insertAdjacentHTML("afterend", islLms.map((l) => `<button type="button" data-lm-tree="${esc(l.id)}"><b class="pin-no">${esc(l.badge)}</b>${esc(txt(l.name))}</button>`).join(""));
        details.querySelectorAll("[data-lm-tree]").forEach((b) => (b.onclick = () => selectLandmark(b.dataset.lmTree)));
        details.querySelector(".island-open").onclick = () => selectIsland(i.id);
        details.querySelectorAll("[data-id]").forEach((b) => {
          b.onclick = () => selectBuilding(b.dataset.id);
          if (canHover) {
            b.onmouseenter = () => hoverItem(b.dataset.id, true);
            b.onmouseleave = () => hoverItem(b.dataset.id, false);
            b.onfocus = () => hoverItem(b.dataset.id, true);
            b.onblur = () => hoverItem(b.dataset.id, false);
          }
        });
        details.addEventListener("toggle", () => {
          if (details.dataset.auto) return void delete details.dataset.auto;
          if (details.open) {
            root.querySelectorAll("details[open]").forEach((o) => o !== details && (o.open = false));
            if (selectedIsland !== i.id) selectIsland(i.id);
            else showPins(i.id);
          }
        });
        root.appendChild(details);
      }
    if (!root.children.length) root.textContent = tr("沒有符合的項目", "No matching items");
  }
  $("#search").oninput = renderTree;
  // `change` fires once the viewer commits a query (Enter or leaving the field), not per keystroke.
  $("#search").addEventListener("change", () => {
    const term = $("#search").value.trim();
    if (term) track("htl_search", { search_term: term });
  });
  for (const mode of ["policies", "landmarks", "flows", "faculty"]) {
    const btn = $("#tab-" + mode);
    if (!btn) continue;
    btn.onclick = () => {
      treeMode = mode;
      $("#tab-policies")?.classList.toggle("active", mode === "policies");
      $("#tab-landmarks")?.classList.toggle("active", mode === "landmarks");
      $("#tab-flows")?.classList.toggle("active", mode === "flows");
      $("#tab-faculty")?.classList.toggle("active", mode === "faculty");
      renderTree();
      track("htl_list_tab", { tab: mode });
    };
  }
  if ($("#faculty-btn")) {
    $("#faculty-btn").onclick = () => {
      treeMode = "faculty";
      $("#tab-policies")?.classList.remove("active");
      $("#tab-landmarks")?.classList.remove("active");
      $("#tab-flows")?.classList.remove("active");
      $("#tab-faculty")?.classList.add("active");
      renderTree();
      if (innerWidth <= 800) $("#sidebar").classList.add("mobile-open");
      else app.classList.remove("sidebar-hidden");
      selectTeacher(FACULTY[0].id);
    };
  }
  if ($("#landmarks-btn")) {
    $("#landmarks-btn").onclick = () => {
      treeMode = "landmarks";
      $("#tab-policies")?.classList.remove("active");
      $("#tab-flows")?.classList.remove("active");
      $("#tab-faculty")?.classList.remove("active");
      $("#tab-landmarks")?.classList.add("active");
      const ids = [...LANDMARKS.keys()];
      const curIdx = selectedLandmark ? ids.indexOf(selectedLandmark) : -1;
      const nextId = ids[(curIdx + 1) % ids.length] || "landmark:clocktower";
      if (innerWidth > 800) app.classList.remove("sidebar-hidden");
      if (window.heartIslandAvatar?.S?.drive && window.heartIslandAvatar?.api?.visitLandmark) {
        window.heartIslandAvatar.api.visitLandmark(nextId, { walkIfNear: true });
      } else {
        selectLandmark(nextId);
      }
      renderTree();
    };
  }
  renderTree();
  let dayLightIds = new Set();
  let dayLightKey = "";
  function updateDay(fromClock = false) {
    const value = Math.floor(dayMinutes),
      h = Math.floor(value / 60),
      m = value % 60;
    $("#clock").value = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    $("#day").value = value;
    const now = value,
      mins = (s) => {
        const [h, m] = s.split(":").map(Number);
        return h * 60 + m;
      };
    const active = D.dayCycle.filter((s) => now >= mins(s.from) && now < mins(s.to));
    dayLightIds = new Set(active.flatMap((s) => s.lights));
    const lightKey = [...dayLightIds].join();
    const lightsChanged = lightKey !== dayLightKey;
    dayLightKey = lightKey;
    $("#day-note").textContent =
      active.map((s) => txt(s.label)).join(" / ") || tr("城市日常", "City life");
    env.setTime(value);
    // night balance: windows and lamps glow, but the ground keeps its detail (no wash-out)
    setGlow(env.night * 3.2);
    skyline?.setNight(env.night);
    isletWalks?.setNight(env.night);
    plazaIsland?.setNight(env.night);
    poolMat.opacity = env.night * 0.5;
    spillMat.opacity = env.night * 0.22;
    islandGlowMat.opacity = env.night * 0.1;
    beamMat.opacity = 0; // beams read as white streaks from above; lighthouse lamps glow instead
    stringMat.opacity = env.night * 0.85;
    for (const f of ferries) f.lamp.material.opacity = env.night;
    document.body.classList.toggle("night", env.night > 0.5);
    if (typeof updateHud === "function") updateHud();
    // the running clock calls this about 10×/s; highlight() walks every building part, so only redo it when the set of
    // lit-up places actually changed (other callers — sliders, panels — always refresh)
    if (!fromClock || lightsChanged) highlight();
  }
  $("#day").oninput = (e) => {
    dayMinutes = Number(e.target.value);
    updateDay();
  };
  $("#day-play").onclick = () => {
    dayPlaying = !dayPlaying;
    $("#day-play").textContent = dayPlaying ? "Ⅱ" : "▶";
    $("#day-play").setAttribute("aria-label", dayPlaying ? tr("暫停一天", "Pause day") : tr("播放一天", "Play day"));
    dirty = true;
  };
  function setPanel(next) {
    mode = next;
    $$("[data-panel]").forEach((b) => {
      b.classList.toggle("active", b.dataset.panel === next);
      b.setAttribute("aria-selected", b.dataset.panel === next);
    });
    $$(".panel").forEach((p) => p.classList.toggle("active", p.id === "panel-" + next));
    if (next !== "day") {
      dayPlaying = false;
      $("#day-play").textContent = "▶";
      env.setTime(720);
      setGlow(0);
    } else updateDay();
    highlight();
  }
  $$("[data-panel]").forEach(
    (b) =>
      (b.onclick = () => {
        setPanel(b.dataset.panel);
        track("htl_panel", { panel: b.dataset.panel });
      }),
  );
  const termEN = ["Overview", "Year 1", "Year 2", "Year 3", "Year 4"];
  function setTerm(index) {
    termIndex = index;
    $$("#term-buttons button").forEach((b, n) => b.classList.toggle("active", n === index));
    const text =
      index === 1
        ? tr(
            "",
            "",
          )
        : tr(
            "",
            "",
          );
    $("#term-note").textContent = text;
    const termList = [];
    for (const lm of LANDMARKS.values()) {
      const selected = lm.id === selectedLandmark || lm.id === hoverBuilding;
      const i = islands.get(lm.island);
      const dim = selectedHeart.size && i?.heart.length && !i.heart.some((h) => selectedHeart.has(h));
      for (const p of lm.parts) {
        const c = selected ? p.color.clone().lerp(new THREE.Color(colors.coral), 0.24) : p.color.clone();
        if (dim) c.lerp(new THREE.Color(0xcfc5bf), 0.8);
        p.mesh.setColorAt(p.index, c);
        p.mesh.instanceColor.needsUpdate = true;
      }
    }
    for (const b of buildings.values()) {
      if (stageSegs(b).has(index)) termList.push(b);
    }
    if (index === 1) flyTo("civil");
    else flyTo("all");
    highlight();
    if (index !== 0)
      cardShow(
        `<div class="eyebrow">TERM / ${esc(english ? termEN[index] : txt(D.termTimeline[index].label))}</div><h2>${tr("四年三明治培育階段", "4-Year Sandwich Stages")}</h2><p class="small">${esc(text)}</p>${termList.length ? termList.map((b) => `<h3>${esc(txt(b.name))}</h3><p>${esc(txt(b.phase.label))}</p><button data-building="${b.id}">${tr("查看內容與來源", "Details and source")} ↗</button>`).join("") : `<p>${tr("此區間沒有可精確對應的官方時程。", "No official schedule can be precisely mapped to this interval.")}</p>`}<p class="small">${tr("", "Only items with stated stages are listed; qualitative phases are not converted.")}</p>`,
      );
  }
  D.termTimeline.forEach((t, n) => {
    const b = document.createElement("button");
    b.textContent = english ? termEN[n] : txt(t.label);
    b.className = n === 0 ? "active" : "";
    b.onclick = () => setTerm(n);
    $("#term-buttons").appendChild(b);
  });
  for (const h of "HEART") {
    const b = document.createElement("button");
    b.textContent = tr(...(PILLAR_NAME[h] || [h, h]));
    b.setAttribute("aria-pressed", "false");
    b.onclick = () => {
      selectedHeart.has(h) ? selectedHeart.delete(h) : selectedHeart.add(h);
      b.setAttribute("aria-pressed", selectedHeart.has(h));
      highlight();
      track("htl_heart_filter", { heart_letter: h, active: selectedHeart.has(h) });
    };
    $("#heart-buttons").appendChild(b);
  }
  const reset = document.createElement("button");
  reset.textContent = tr("全部", "All");
  reset.className = "reset";
  reset.onclick = () => {
    selectedHeart.clear();
    $$("#heart-buttons [aria-pressed]").forEach((b) => b.setAttribute("aria-pressed", "false"));
    highlight();
    track("htl_heart_filter", { heart_letter: "all", active: false });
  };
  $("#heart-buttons").appendChild(reset);
  var followAnchor = null;
  function clearWalker() {
    followAnchor = null;
    selectedWalker = null;
    selRing.visible = false;
    clearSkyCraft();
  }
  function home() {
    clearWalker();
    document.body.classList.remove("card-open", "m-time");
    $("#sidebar").classList.remove("mobile-open");
    $("#sidebar-toggle")?.setAttribute("aria-pressed", "false");
    $("#mob-time")?.setAttribute("aria-pressed", "false");
    if (innerWidth <= 800 && toggleState.log) setToggle("log", false);
    window.heartIslandAvatar?.api?.close?.();
    selectedIsland = null;
    selectedBuilding = null;
    selectedLandmark = null;
    showPins(null);
    $("#card").hidden = true;
    showFlows([]);
    highlight();
    flyTo("all");
  }
  $("#home").onclick = home;
  $("#card").addEventListener("click", (e) => {
    const link = e.target.closest(".sources a, .quote a");
    if (link) track("htl_source_click", { link_url: link.href });
  });
  $("#card-close").onclick = () => {
    document.body.classList.remove("card-open");
    $("#card").hidden = true;
    selectedBuilding = null;
    selectedLandmark = null;
    clearSkyCraft();
    highlight();
  };
  $("#sidebar-toggle").onclick = () => {
    if (innerWidth <= 800) {
      const open = !$("#sidebar").classList.contains("mobile-open");
      if (open) {
        $("#card").hidden = true;
        document.body.classList.remove("card-open", "m-time");
        $("#mob-time")?.setAttribute("aria-pressed", "false");
        if (toggleState.log) setToggle("log", false);
        window.heartIslandAvatar?.api?.close?.();
      }
      $("#sidebar").classList.toggle("mobile-open", open);
      $("#sidebar-toggle").setAttribute("aria-pressed", String(open));
    } else if (innerWidth <= 960 && innerHeight <= 540 && document.body.classList.contains("card-open")) {
      $("#card").hidden = true;
      document.body.classList.remove("card-open");
      app.classList.remove("sidebar-hidden");
    } else app.classList.toggle("sidebar-hidden");
  };
  $("#mobile-close").onclick = () => {
    $("#sidebar").classList.remove("mobile-open");
    $("#sidebar-toggle")?.setAttribute("aria-pressed", "false");
  };
  const ray = new THREE.Raycaster();
  ray.params.Line = { threshold: 0.1 };
  let down = null;
  let zoomTargetDist = null;
  const zoomRangeEl = $("#zoom-range"),
    zoomPctEl = $("#zoom-pct"),
    zoomInBtn = $("#zoom-in"),
    zoomOutBtn = $("#zoom-out");
  function releaseAvatarFly() {
    const av = window.heartIslandAvatar;
    if (av?.S?.follow && !av.S.follow.landed) {
      av.S.follow.landed = true;
      if (av.cap?.controls) av.S.follow.tgt = av.cap.controls.target.clone();
    }
  }
  function setCameraDistanceImmediate(dist) {
    const minD = Math.max(1.6, controls.minDistance || 3.8),
      maxD = controls.maxDistance || 54,
      clamped = THREE.MathUtils.clamp(dist, minD, maxD);
    fly = null;
    zoomTargetDist = null;
    releaseAvatarFly();
    const dir = camera.position.clone().sub(controls.target);
    if (dir.lengthSq() < 1e-6) dir.set(0.24, 0.33, 0.87);
    dir.normalize().multiplyScalar(clamped);
    camera.position.copy(controls.target).add(dir);
    controls.update();
    dirty = true;
  }
  function stepZoomTo(targetDist) {
    const minD = Math.max(1.6, controls.minDistance || 3.8),
      maxD = controls.maxDistance || 54,
      clamped = THREE.MathUtils.clamp(targetDist, minD, maxD);
    fly = null;
    releaseAvatarFly();
    if (reduced.matches) {
      setCameraDistanceImmediate(clamped);
      return;
    }
    zoomTargetDist = clamped;
    dirty = true;
  }
  let lastSyncZoomDist = -1;
  function syncZoomUI(camDist) {
    if (Math.abs(camDist - lastSyncZoomDist) < 0.03) return;
    lastSyncZoomDist = camDist;
    const minD = Math.max(1.6, controls.minDistance || 3.8),
      maxD = controls.maxDistance || 54,
      clamped = THREE.MathUtils.clamp(camDist, minD, maxD),
      refD = defaultOverviewDist();
    const sliderVal = Math.round((100 * Math.log(maxD / clamped)) / Math.log(maxD / minD));
    const pct = Math.round(100 * Math.pow(refD / clamped, 0.55));
    if (zoomRangeEl && document.activeElement !== zoomRangeEl) zoomRangeEl.value = String(THREE.MathUtils.clamp(sliderVal, 0, 100));
    if (zoomPctEl) zoomPctEl.textContent = `${pct}%`;
    if (zoomInBtn) zoomInBtn.disabled = clamped <= minD + 0.08;
    if (zoomOutBtn) zoomOutBtn.disabled = clamped >= maxD - 0.08;
    // Smooth CSS2D label scale so labels neither crowd when zoomed out nor pop abruptly when zooming in
    const labelScale = camDist > 28 ? Math.max(0.84, 1 - (camDist - 28) * 0.006) : camDist < 10 ? Math.min(1.06, 1 + (10 - camDist) * 0.009) : 1;
    labelRenderer.domElement.style.setProperty("--zoom-ui-scale", labelScale.toFixed(3));
  }
  if (zoomInBtn) {
    zoomInBtn.onclick = () => {
      const base = zoomTargetDist ?? camera.position.distanceTo(controls.target);
      stepZoomTo(base * 0.8);
    };
  }
  if (zoomOutBtn) {
    zoomOutBtn.onclick = () => {
      const base = zoomTargetDist ?? camera.position.distanceTo(controls.target);
      stepZoomTo(base / 0.8);
    };
  }
  if (zoomPctEl) {
    zoomPctEl.onclick = () => {
      stepZoomTo(defaultOverviewDist());
    };
  }
  if (zoomRangeEl) {
    zoomRangeEl.addEventListener("input", (e) => {
      const minD = Math.max(1.6, controls.minDistance || 3.8),
        maxD = controls.maxDistance || 54,
        t = Number(e.target.value) / 100,
        dist = maxD * Math.pow(minD / maxD, t);
      setCameraDistanceImmediate(dist);
    });
  }
  mapCam.onZoomKey = (f) => stepZoomTo((zoomTargetDist ?? camera.position.distanceTo(controls.target)) * f);
  // 縮放列加上：全圖、指北（依目前方位旋轉的指針）、拖曳模式切換（移動地圖／旋轉視角）
  const zoomUi = $("#zoom-ui");
  let compassNeedle = null;
  if (zoomUi) {
    const mk = (id, cls, html, title, onclick) => {
      const b = document.createElement("button");
      b.type = "button";
      b.id = id;
      b.className = `zoom-btn ${cls}`;
      b.innerHTML = html;
      b.title = title;
      b.setAttribute("aria-label", title);
      b.onclick = onclick;
      return b;
    };
    const fullBtn = mk("zoom-full", "zoom-full", '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>', tr("看整張地圖（0）", "Whole map (0)"), () => {
      releaseAvatarFly();
      mapCam.fullMapView();
    });
    const northBtn = mk("zoom-north", "zoom-north", '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><g class="needle"><path d="M12 3l3.6 9H8.4z" fill="#c8483a"/><path d="M12 21l-3.6-9h7.2z" fill="currentColor" opacity=".55"/></g></svg>', tr("指北：轉回正北方向（N）", "Face north (N)"), () => mapCam.faceNorth());
    compassNeedle = northBtn.querySelector(".needle");
    const dragBtn = mk("zoom-drag", "zoom-drag", "", "", () => {
      mapCam.setDragMode(mapCam.dragMode === "pan" ? "rotate" : "pan");
      syncDragBtn();
    });
    const syncDragBtn = () => {
      const pan = mapCam.dragMode === "pan";
      dragBtn.innerHTML = pan
        ? '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 2v20M2 12h20M12 2l-3 3M12 2l3 3M12 22l-3-3M12 22l3-3M2 12l3-3M2 12l3 3M22 12l-3-3M22 12l-3 3"/></svg>'
        : '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12a9 9 0 1 1-3-6.7"/><path d="M21 3v6h-6"/></svg>';
      const t = pan ? tr("拖曳＝移動地圖（點一下改成旋轉視角）", "Drag moves the map (tap to drag-rotate instead)") : tr("拖曳＝旋轉視角（點一下改成移動地圖）", "Drag rotates the view (tap to drag-move instead)");
      dragBtn.title = t;
      dragBtn.setAttribute("aria-label", t);
      dragBtn.setAttribute("aria-pressed", String(pan));
    };
    syncDragBtn();
    zoomUi.prepend(dragBtn, northBtn, fullBtn);
  }
  frameHooks.add(() => {
    if (compassNeedle) compassNeedle.setAttribute("transform", `rotate(${((-mapCam.azimuth() * 180) / Math.PI).toFixed(1)} 12 12)`);
    return false;
  });
  renderer.domElement.addEventListener("pointerdown", () => document.body.classList.add("interacted"), { once: true });
  setTimeout(() => document.body.classList.add("interacted"), 12000);
  renderer.domElement.addEventListener("pointerdown", (e) => {
    down = { x: e.clientX, y: e.clientY, t: performance.now(), type: e.pointerType };
    fly = null;
    zoomTargetDist = null;
  });
  renderer.domElement.addEventListener(
    "wheel",
    () => {
      fly = null;
      zoomTargetDist = null;
    },
    { passive: true },
  );
  const skyHoverTip = document.createElement("div");
  skyHoverTip.id = "sky-hover-tip";
  skyHoverTip.hidden = true;
  document.body.appendChild(skyHoverTip);
  let hoveredSkyId = null;
  let _hoveredTipW = 260;
  let _lastSkyHoverCheck = 0;
  let _skyHoverTimer = 0;
  let _pendingSkyPtr = null;
  const _rayNdc = new THREE.Vector2();
  const _visSkyPickables = [];
  function positionSkyHoverTip(cx, cy) {
    const tx = Math.min(innerWidth - _hoveredTipW - 12, Math.max(12, cx + 14));
    const ty = Math.max(12, cy - 38);
    skyHoverTip.style.transform = `translate3d(${Math.round(tx)}px, ${Math.round(ty)}px, 0)`;
  }
  function hideSkyHoverTip() {
    if (_skyHoverTimer) {
      clearTimeout(_skyHoverTimer);
      _skyHoverTimer = 0;
    }
    _pendingSkyPtr = null;
    if (hoveredSkyId !== null) {
      hoveredSkyId = null;
      env.skyFleet?.setHover?.(null);
      if (renderer.domElement.style.cursor === "pointer") renderer.domElement.style.cursor = "";
      dirty = true;
    }
    if (!skyHoverTip.hidden) skyHoverTip.hidden = true;
  }
  function runSkyHoverRaycast(cx, cy) {
    _lastSkyHoverCheck = performance.now();
    const skyPickables = env.skyFleet?.pickables;
    if (!skyPickables || !skyPickables.length) return;
    _visSkyPickables.length = 0;
    for (let i = 0; i < skyPickables.length; i++) {
      const m = skyPickables[i];
      if (m.visible && m.parent?.visible !== false) _visSkyPickables.push(m);
    }
    if (!_visSkyPickables.length) {
      hideSkyHoverTip();
      return;
    }
    const rect = renderer.domElement.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    _rayNdc.set(((cx - rect.left) / rect.width) * 2 - 1, (-(cy - rect.top) / rect.height) * 2 + 1);
    ray.setFromCamera(_rayNdc, camera);
    const hits = ray.intersectObjects(_visSkyPickables, false);
    if (!hits.length) {
      hideSkyHoverTip();
      return;
    }
    const cid = hits[0].object.userData?.id;
    const craft = env.skyFleet?.getCraft?.(cid);
    if (!craft) {
      hideSkyHoverTip();
      return;
    }
    const changed = hoveredSkyId !== cid;
    if (changed) {
      hoveredSkyId = cid;
      env.skyFleet?.setHover?.(cid);
      const headline = craft.spec.title || craft.spec.label || txt(craft.spec.name);
      skyHoverTip.innerHTML = `<span class="sht-ico">${esc(craft.spec.badge)}</span><span class="sht-title">${esc(headline)}</span><span class="sht-cta">${esc(tr("點擊查看說明與互動", "Click to interact"))}</span>`;
      dirty = true;
    }
    renderer.domElement.style.cursor = "pointer";
    skyHoverTip.hidden = false;
    if (changed) _hoveredTipW = skyHoverTip.offsetWidth || 260;
    positionSkyHoverTip(cx, cy);
  }
  renderer.domElement.addEventListener(
    "pointermove",
    (e) => {
      if (tourActive || (e.buttons & 1) || e.pointerType === "touch") {
        hideSkyHoverTip();
        return;
      }
      if (hoveredSkyId !== null && !skyHoverTip.hidden) {
        positionSkyHoverTip(e.clientX, e.clientY);
      }
      const now = performance.now();
      const elapsed = now - _lastSkyHoverCheck;
      if (elapsed >= 32) {
        if (_skyHoverTimer) {
          clearTimeout(_skyHoverTimer);
          _skyHoverTimer = 0;
        }
        _pendingSkyPtr = null;
        runSkyHoverRaycast(e.clientX, e.clientY);
      } else {
        _pendingSkyPtr = { x: e.clientX, y: e.clientY };
        if (!_skyHoverTimer) {
          _skyHoverTimer = setTimeout(() => {
            _skyHoverTimer = 0;
            if (_pendingSkyPtr && !tourActive) {
              const pt = _pendingSkyPtr;
              _pendingSkyPtr = null;
              runSkyHoverRaycast(pt.x, pt.y);
            }
          }, Math.max(8, 32 - Math.floor(elapsed)));
        }
      }
    },
    { passive: true },
  );
  renderer.domElement.addEventListener("pointerleave", hideSkyHoverTip, { passive: true });
  renderer.domElement.addEventListener("pointerup", (e) => {
    const maxTapSlop = e.pointerType === "touch" || down?.type === "touch" ? 16 : 6;
    if (tourActive || !down || Math.hypot(e.clientX - down.x, e.clientY - down.y) > maxTapSlop) return;
    hideSkyHoverTip();
    if (!window.heartIslandAvatar?.S?.drive && window.htlSocial?.tapPeerAt?.(e.clientX, e.clientY)) return;
    const rect = renderer.domElement.getBoundingClientRect();
    _rayNdc.set(((e.clientX - rect.left) / rect.width) * 2 - 1, (-(e.clientY - rect.top) / rect.height) * 2 + 1);
    ray.setFromCamera(_rayNdc, camera);
    const hits = ray.intersectObjects(pickables, false).filter((h) => h.object.visible);
    for (const hit of hits) {
      const u = hit.object.userData;
      if (u.type === "skyCraft") {
        selectSkyCraft(u.id);
        return;
      } else if (u.type === "buildingBatch") {
        const owner = u.items[hit.instanceId]?.owner;
        const inDrive = !!window.heartIslandAvatar?.S?.drive;
        if (owner && LANDMARKS.has(owner)) {
          if (inDrive && window.heartIslandAvatar?.api?.visitLandmark) window.heartIslandAvatar.api.visitLandmark(owner, { walkIfNear: true });
          else selectLandmark(owner);
          return;
        }
        if (owner) {
          if (inDrive && window.heartIslandAvatar?.api?.visitBuildingInDrive) window.heartIslandAvatar.api.visitBuildingInDrive(owner);
          else selectBuilding(owner);
          return;
        }
      } else if (u.type === "walker") {
        const pi = peopleSys.personFromHit(hit.object, hit.instanceId);
        if (pi !== null) {
          const w = peopleSys.people[pi];
          const canPickWalker =
            w &&
            (w.kind === "puma" ||
              w.kind === "faculty" ||
              w.kind === "lord" ||
              (w.kind === "flow" && (w.interactive || toggleState.flows || selectedFlows.size > 0)));
          if (!canPickWalker) continue;
          selectWalker(pi);
          return;
        }
      } else if (u.type === "landmarkMesh" && (u.resolve || LANDMARKS.has(u.id))) {
        const lmId = u.resolve ? u.resolve(hit.point) : u.id; // merged campus-art mesh: the piece nearest the hit point
        if (!LANDMARKS.has(lmId)) continue;
        if (window.heartIslandAvatar?.S?.drive && window.heartIslandAvatar?.api?.visitLandmark) window.heartIslandAvatar.api.visitLandmark(lmId, { walkIfNear: true });
        else selectLandmark(lmId);
        return;
      } else if (u.type === "flow") {
        selectFlow(u.id);
        return;
      } else if (u.type === "island") {
        selectIsland(u.id);
        return;
      }
    }
  });
  // 方向鍵／WASD 平移、Q/E 旋轉由 map-camera.js 處理（不限焦點在畫布上）
  document.addEventListener("keydown", (e) => {
    if (e.key === "Tab" && !$("#intro").hidden) {
      e.preventDefault();
      (document.activeElement === $("#intro-next") ? $("#intro-skip") : $("#intro-next")).focus();
      return;
    }
    if (e.key === "Escape") {
      if (tourActive) stopTour();
      else if (!$("#intro").hidden) closeIntro();
      else {
        $("#card").hidden = true;
        document.body.classList.remove("card-open");
        $("#sidebar").classList.remove("mobile-open");
      }
    }
    if (e.code === "Space" && tourActive && !["INPUT", "BUTTON"].includes(document.activeElement.tagName)) {
      e.preventDefault();
      toggleTour();
    }
    if (e.key.toLowerCase() === "h" && tourActive) app.classList.toggle("capture");
  });
  const introSteps = [
    [
      `<span class="nw">每座六角島，</span><span class="nw">都是一個旅館系主題</span>`,
      `${D.islands.length} 座主題島嶼與 ${buildings.size} 座立體微縮建築；內容依國立高雄餐旅大學旅館管理系官網與餐旅學院師資頁整理，含校內「群賢會館」與菁英實習計畫3.0 合作夥伴 ${OFFICIAL.partners.length} 家。`,
      `<span class="nw">Each hex island</span> is an <span class="nw">NKUHT HTL theme</span>`,
      `${D.islands.length} hexagonal islands and ${buildings.size} 3D miniatures, built from the official department website and faculty directory (incl. Elite House & ${OFFICIAL.partners.length} Elite Internship 3.0 partners).`,
    ],
    [
      `<span class="nw">師生與專任師長，</span><span class="nw">串起產學協作</span>`,
      "點選任一座島嶼即可亮出相關的學習路線（5 種顏色代表 5 條主題）；點擊橋上的高餐師生或 10 位專任師長 3D 角色，可聆聽雙語導覽並進行互動對話。",
      `<span class="nw">Students &amp; faculty</span> <span class="nw">connect every island</span>`,
      "Select an island to light up curriculum & internship connections. Click any walker or 3D faculty guide for bilingual voice tours and RPG chat.",
    ],
    [
      `<span class="nw">高餐人的一天</span>・<span class="nw">四年三明治時間軸</span>`,
      "上方可切換清晨、白天、黃昏、夜晚光影，下方可探索「01 高餐人的一天」、「02 四年時間軸」、「03 五大指標」，或點「🕹️ 角色漫遊」走進島嶼集章！",
      `<span class="nw">A Day at NKUHT</span> &amp; <span class="nw">4-Year Timeline</span>`,
      "Switch lighting above, explore the Day Cycle, 4-Year Timeline & 5 Program Goals below, or launch 3D Walk Mode to collect island stamps!",
    ],
  ];
  let introStep = 0;
  function showIntro() {
    const s = introSteps[introStep];
    $("#intro-count").textContent = `CONCIERGE CHECK-IN · 0${introStep + 1} / 03`;
    $("#intro-title").innerHTML = english ? s[2] : s[0];
    $("#intro-body").textContent = english ? s[3] : s[1];
    $("#intro-next").textContent = introStep === 2 ? tr("走進禮賓島 →", "Enter Island →") : tr("下一步 →", "Next →");
    $("#intro-skip").textContent = tr("略過", "Skip");
    $$(".intro-dot").forEach((d, idx) => {
      const on = idx === introStep;
      d.classList.toggle("active", on);
      if (on) d.setAttribute("aria-current", "step");
      else d.removeAttribute("aria-current");
    });
    $("#intro").hidden = false;
    $("#intro-next").focus();
  }
  function closeIntro() {
    $("#intro").hidden = true;
    try {
      localStorage.setItem("heart-city-onboarded", "1");
    } catch {}
    renderer.domElement.focus();
    // 介紹結束後請新訪客取名（heart-me.js 只會問一次；若角色模組尚未載入，載入時會補問）
    window.__htlIntroClosed = true;
    window.dispatchEvent(new CustomEvent("htl:intro-closed"));
  }
  $$(".intro-dot").forEach((d) => {
    d.onclick = () => {
      const idx = Number(d.dataset.introStep);
      if (idx >= 0 && idx < introSteps.length) {
        introStep = idx;
        showIntro();
      }
    };
  });
  if ($("#intro-drive")) {
    $("#intro-drive").onclick = () => {
      closeIntro();
      track("htl_intro", { action: "drive" });
      setTimeout(() => document.getElementById("hm-drive")?.click(), 60);
    };
  }
  $("#intro-next").onclick = () => {
    if (introStep === 2) {
      closeIntro();
      track("htl_intro", { action: "complete" });
    } else {
      introStep++;
      showIntro();
    }
  };
  $("#intro-skip").onclick = () => {
    closeIntro();
    track("htl_intro", { action: "skip", step: introStep + 1 });
  };
  $("#help").onclick = () => {
    introStep = 0;
    showIntro();
  };
  if ($("#mob-help"))
    $("#mob-help").onclick = () => {
      introStep = 0;
      showIntro();
    };
  if ($("#mob-log-btn"))
    $("#mob-log-btn").onclick = () => {
      setToggle("log", !toggleState.log);
      track("htl_toggle", { toggle: "log", active: toggleState.log });
    };
  function showCredits() {
    clearWalker();
    selectedIsland = null;
    selectedBuilding = null;
    selectedLandmark = null;
    showPins(null);
    highlight();
    cardShow(
      `<div class="card-head"><div class="icon-tile" style="background:transparent;box-shadow:none"><img src="./assets/nkuht_htl_logo.png" alt="系徽" style="width:44px;height:44px;border-radius:50%;object-fit:contain;background:transparent"></div><div><div class="eyebrow">CREDITS &amp; OPEN-SOURCE ATTRIBUTION</div><h2>${esc(tr("系所資料來源與開源技術引用宣告", "Official Data & Open-Source Attribution"))}</h2></div></div>
      <p class="lede">${esc(tr("本「HOTEL 旅館島 — 國立高雄餐旅大學旅館管理系 3D 學習與職涯導覽系統」純供高等教育與系所導覽展示使用，無涉任何外部商業或特定立場；謹向以下系所官方資料與國際開源技術專案致謝：", "This NKUHT Department of Hotel Management 3D Island Navigator is built strictly for higher-education hospitality instruction and academic showcase. We gratefully acknowledge the following official sources and international open-source projects:"))}</p>
      <h3>01 · ${esc(tr("系所內容與識別來源", "Official Department Data & Identity"))}</h3>
      <div class="credit-box">
        <b>${esc(tr("國立高雄餐旅大學 旅館管理系（NKUHT Department of Hotel Management）", "NKUHT Department of Hotel Management"))}</b>
        ${tr(
          `系所沿革、教育理念、行政與系務、課程標準表、1+3 畢業條件、群賢會館與「菁英實習計畫3.0」合作夥伴（目前 ${OFFICIAL.partners.length} 家）及系徽圖像，均引用自 <a href="https://hotel.nkuht.edu.tw/?Lang=zh-tw" target="_blank" rel="noopener noreferrer">旅館管理系官網 ↗</a>；專任(案)教師資料引用自 <a href="https://shm.nkuht.edu.tw/p/412-1016-854.php?Lang=zh-tw" target="_blank" rel="noopener noreferrer">餐旅學院師資頁 ↗</a>。`,
          `Program history, educational philosophy, curriculum standards, 1+3 graduation criteria, Elite House practicum hotel, ${OFFICIAL.partners.length} Elite Internship 3.0 partner hotels, and official emblem are sourced from the <a href="https://hotel.nkuht.edu.tw/?Lang=zh-tw" target="_blank" rel="noopener noreferrer">Official Dept. Website ↗</a> and <a href="https://shm.nkuht.edu.tw/p/412-1016-854.php?Lang=zh-tw" target="_blank" rel="noopener noreferrer">College of Hospitality Faculty Page ↗</a>.`
        )}
      </div>
      <h3>02 · ${esc(tr("軸向六角格網幾何與即時雷達導覽演算法", "Hexagonal Grid Geometry & Archipelago Radar"))}</h3>
      <div class="credit-box">
        <b>Amit Patel · Red Blob Games &amp; Honeycomb Grid</b>
        ${tr(
          `20 座主題島嶼之尖頂軸向六角座標系（Pointy-Top Axial Coordinates）、跨島橋樑鄰接拓樸與即時六角群島雷達圖（<code>hex-radar.js</code>），演算法參考自史丹佛電腦科學經典教學資源 <a href="https://www.redblobgames.com/grids/hexagons/" target="_blank" rel="noopener noreferrer">Red Blob Games: Hexagonal Grids ↗</a>（作者：Amit Patel）與開源六角網格函式庫 <a href="https://github.com/flauwekeul/honeycomb" target="_blank" rel="noopener noreferrer">flauwekeul/honeycomb ↗</a>（MIT License）。`,
          `Pointy-top axial hexagonal coordinates, cross-island bridge topology, and the live 20-island Hexagonal Archipelago Radar (<code>hex-radar.js</code>) are grounded in <a href="https://www.redblobgames.com/grids/hexagons/" target="_blank" rel="noopener noreferrer">Red Blob Games: Hexagonal Grids ↗</a> by Amit Patel and <a href="https://github.com/flauwekeul/honeycomb" target="_blank" rel="noopener noreferrer">flauwekeul/honeycomb ↗</a> (MIT License).`
        )}
      </div>
      <h3>03 · ${esc(tr("3D 微縮立體世界、渲染引擎與程序化建築（MIT / CC0）", "3D Miniature World, WebGL Engine & Procedural Architecture"))}</h3>
      <div class="credit-box">
        <b>① Three.js WebGL 渲染引擎與後製光影</b>
        ${tr(
          `採用 <a href="https://github.com/mrdoob/three.js" target="_blank" rel="noopener noreferrer">mrdoob/three.js ↗</a>（MIT License）建構即時 3D 場景、<code>InstancedMesh</code> 批次渲染、<code>RoomEnvironment</code> 物理光照與 <code>SimplexNoise</code> 地形波浪；螢幕空間環境光遮蔽採用 <a href="https://github.com/N8python/n8ao" target="_blank" rel="noopener noreferrer">N8python/n8ao ↗</a>（CC0 1.0）。`,
          `Powered by <a href="https://github.com/mrdoob/three.js" target="_blank" rel="noopener noreferrer">mrdoob/three.js ↗</a> (MIT License) with <code>InstancedMesh</code>, <code>RoomEnvironment</code> PBR lighting, and <a href="https://github.com/N8python/n8ao" target="_blank" rel="noopener noreferrer">N8python/n8ao ↗</a> (CC0 1.0) ambient occlusion.`
        )}
      </div>
      <div class="credit-box">
        <b>② 3D 微縮互動世界與低多邊形建築設計語彙</b>
        ${tr(
          `微縮模型立體島嶼探索、地面導航光環與溫暖移軸景深互動美學，參考自經典 WebGL 開源作品 <a href="https://github.com/bruno-simon/folio-2019" target="_blank" rel="noopener noreferrer">bruno-simon/folio-2019 ↗</a>（Bruno Simon，MIT License）、<a href="https://github.com/ybouane/tiltshift-in-html" target="_blank" rel="noopener noreferrer">ybouane/tiltshift-in-html ↗</a>（MIT License）及 <a href="https://github.com/KenneyNL" target="_blank" rel="noopener noreferrer">KenneyNL（Kenney Game Assets）↗</a>（CC0 1.0）模組化微縮道具風格；星級酒店玻璃帷幕、窗框格柵（Mullions）與迎賓雨棚幾何參考自 <a href="https://github.com/achrefelouafi/ProceduralBuildingsThreeJS" target="_blank" rel="noopener noreferrer">achrefelouafi/ProceduralBuildingsThreeJS ↗</a>（MIT License）。`,
          `Interactive 3D miniature world exploration, ground navigation rings, and tilt-shift diorama aesthetics draw inspiration from <a href="https://github.com/bruno-simon/folio-2019" target="_blank" rel="noopener noreferrer">bruno-simon/folio-2019 ↗</a> (MIT), <a href="https://github.com/ybouane/tiltshift-in-html" target="_blank" rel="noopener noreferrer">ybouane/tiltshift-in-html ↗</a> (MIT), <a href="https://github.com/KenneyNL" target="_blank" rel="noopener noreferrer">KenneyNL Game Assets ↗</a> (CC0 1.0), and <a href="https://github.com/achrefelouafi/ProceduralBuildingsThreeJS" target="_blank" rel="noopener noreferrer">achrefelouafi/ProceduralBuildingsThreeJS ↗</a> (MIT).`
        )}
      </div>
      <h3>04 · ${esc(tr("3D 角色操控、浮動搖桿與 2D 智慧檢索介面", "3D Avatar Controls, Virtual Joystick & 2D Smart Search"))}</h3>
      <div class="credit-box">
        <b>③ 360° 動態浮動搖桿與低多邊形角色換裝骨架</b>
        ${tr(
          `行動端 360° 動態浮動原點類比搖桿人體工學與衝刺曲線參考自 <a href="https://github.com/yoannmoinet/nipplejs" target="_blank" rel="noopener noreferrer">yoannmoinet/nipplejs ↗</a>（MIT License）；Three.js 低多邊形角色換裝骨架基礎改編自開源開發者 <code>readper</code> 之 MIT 授權角色幾何模組，並由本專案獨立擴充 RPG 主線尋路、20 島瞬間傳送與雙語禮賓互動系統。`,
          `360° floating-origin virtual joystick ergonomics reference <a href="https://github.com/yoannmoinet/nipplejs" target="_blank" rel="noopener noreferrer">yoannmoinet/nipplejs ↗</a> (MIT); Three.js low-poly avatar wardrobe rig adapts MIT-licensed character geometry by open-source developer <code>readper</code>, extended with RPG quest pathfinding, 20-island teleportation, and bilingual concierge interactions.`
        )}
      </div>
      <div class="credit-box">
        <b>④ 2D 多關鍵字權重檢索、向量圖示與無障礙設計規範</b>
        ${tr(
          `2D 四年學習時間軸與卡片總覽之多關鍵字權重與容錯模糊搜尋參考自 <a href="https://github.com/krisk/Fuse" target="_blank" rel="noopener noreferrer">krisk/Fuse（Fuse.js）↗</a>（Apache-2.0）；介面向量圖示參考 <a href="https://github.com/lucide-icons/lucide" target="_blank" rel="noopener noreferrer">lucide-icons/lucide ↗</a>（ISC License），並遵循 <a href="https://www.w3.org/WAI/ARIA/apg/" target="_blank" rel="noopener noreferrer">W3C WAI-ARIA Authoring Practices ↗</a> 無障礙互動標準。`,
          `2D Timeline multi-keyword weighted fuzzy search is inspired by <a href="https://github.com/krisk/Fuse" target="_blank" rel="noopener noreferrer">krisk/Fuse (Fuse.js) ↗</a> (Apache-2.0), with vector iconography from <a href="https://github.com/lucide-icons/lucide" target="_blank" rel="noopener noreferrer">lucide-icons/lucide ↗</a> (ISC License) and <a href="https://www.w3.org/WAI/ARIA/apg/" target="_blank" rel="noopener noreferrer">W3C WAI-ARIA APG ↗</a> accessibility patterns.`
        )}
      </div>
      <h3>05 · ${esc(tr("遊戲化集章護照、程序化音效與開源字體", "Gamified Passport, Procedural WebAudio & Open Fonts"))}</h3>
      <div class="credit-box">
        <b>⑤ 程序化飯店服務鈴音效、慶祝彩帶與編輯式字體排印</b>
        ${tr(
          `程序化 WebAudio 飯店櫃檯黃銅服務鈴（🛎️）與升星禮號角靈感來自 <a href="https://github.com/KilledByAPixel/ZzFX" target="_blank" rel="noopener noreferrer">KilledByAPixel/ZzFX ↗</a>（Frank Force，MIT License）；徽章解鎖彩帶粒子採用 <a href="https://github.com/catdad/canvas-confetti" target="_blank" rel="noopener noreferrer">catdad/canvas-confetti ↗</a>（MIT License）；中英雙語字體採用開源 <a href="https://github.com/notofonts/noto-cjk" target="_blank" rel="noopener noreferrer">Google Noto Serif TC / Noto Sans TC ↗</a> 與 Cormorant Garamond（SIL Open Font License 1.1）。`,
          `Procedural WebAudio hotel service bell chimes are inspired by <a href="https://github.com/KilledByAPixel/ZzFX" target="_blank" rel="noopener noreferrer">KilledByAPixel/ZzFX ↗</a> (MIT); celebration confetti uses <a href="https://github.com/catdad/canvas-confetti" target="_blank" rel="noopener noreferrer">catdad/canvas-confetti ↗</a> (MIT); typography uses <a href="https://github.com/notofonts/noto-cjk" target="_blank" rel="noopener noreferrer">Google Noto Serif TC / Noto Sans TC ↗</a> &amp; Cormorant Garamond (SIL OFL 1.1).`
        )}
      </div>
      <h3>06 · ${esc(tr("本專案原始碼與線上部署", "Repository & Live Deployment"))}</h3>
      <div class="sources">
        <a href="https://github.com/drjacqueshsu/HTL_island_navigator" target="_blank" rel="noopener noreferrer">↗ GitHub 專案原始碼（drjacqueshsu/HTL_island_navigator）</a>
        <a href="https://nkuht-htl.drmjhsu.com/" target="_blank" rel="noopener noreferrer">↗ Cloudflare Pages 線上展示版</a>
        <a href="https://hotel.nkuht.edu.tw/" target="_blank" rel="noopener noreferrer">↗ 國立高雄餐旅大學旅館管理系官方網站</a>
      </div>`,
    );
  }
  if ($("#credits-btn")) $("#credits-btn").onclick = showCredits;
  if ($("#side-credits-btn")) $("#side-credits-btn").onclick = showCredits;
  if ($("#mob-credits")) $("#mob-credits").onclick = showCredits;
  window.__showCredits = showCredits;
  function switchSiteLanguage() {
    stopTeacherVoice();
    const nextParams = new URLSearchParams(location.search);
    if (english) nextParams.delete("lang");
    else nextParams.set("lang", "en");
    if (selectedWalker !== null && peopleSys.people[selectedWalker]?.teacherId) {
      nextParams.set("teacher", peopleSys.people[selectedWalker].teacherId);
      nextParams.delete("focus");
    } else if (selectedLandmark) {
      nextParams.set("focus", selectedLandmark);
      nextParams.delete("teacher");
    } else if (selectedBuilding) {
      nextParams.set("focus", selectedBuilding);
      nextParams.delete("teacher");
    } else if (selectedIsland) {
      nextParams.set("focus", selectedIsland);
      nextParams.delete("teacher");
    }
    const qs = nextParams.toString();
    location.href = (qs ? `?${qs}` : location.pathname) + location.hash;
  }
  if ($("#lang-btn")) $("#lang-btn").onclick = switchSiteLanguage;
  if ($("#mob-lang-btn")) $("#mob-lang-btn").onclick = switchSiteLanguage;
  function startTour() {
    closeIntro();
    tourActive = true;
    tourPlaying = !reduced.matches;
    tourSeconds = 0;
    tourCue = -1;
    app.classList.add("tour");
    controls.enabled = false;
    $("#card").hidden = true;
    dayPlaying = false;
    selectedHeart.clear();
    $$("#heart-buttons [aria-pressed]").forEach((b) => b.setAttribute("aria-pressed", "false"));
    mode = "day";
    updateTour(true);
    resize();
    $("#tour-pause").textContent = tourPlaying ? tr("暫停", "Pause") : tr("播放", "Play");
    $("#tour-replay").textContent = tr("重播", "Replay");
    $("#tour-exit").textContent = tr("離開", "Exit");
    dirty = true;
    track("htl_tour_start");
  }
  function stopTour() {
    tourActive = false;
    tourPlaying = false;
    app.classList.remove("tour", "capture");
    controls.enabled = true;
    setPanel("day");
    home();
    resize();
  }
  function toggleTour() {
    tourPlaying = !tourPlaying;
    $("#tour-pause").textContent = tourPlaying ? tr("暫停", "Pause") : tr("播放", "Play");
    dirty = true;
  }
  function updateTour(force = false) {
    const n = Math.min(
      D.tour.cues.length - 1,
      D.tour.cues.findIndex((c) => tourSeconds >= c.from && tourSeconds < c.to) === -1
        ? D.tour.cues.length - 1
        : D.tour.cues.findIndex((c) => tourSeconds >= c.from && tourSeconds < c.to),
    );
    $("#tour-time").textContent = `${String(Math.floor(tourSeconds)).padStart(2, "0")} / 78`;
    if (n !== tourCue || force) {
      tourCue = n;
      const cue = D.tour.cues[n];
      selectedIsland = cue.target === "all" ? null : cue.target;
      selectedBuilding = null;
    selectedLandmark = null;
      showFlows(cue.flows);
      flyTo(cue.target);
      dayMinutes = cue.target === "lunch" ? 720 : cue.target === "family" ? 1200 : cue.target === "card" ? 900 : 480;
      updateDay();
      const q = cue.quotes.map((id) => quotes.get(id));
      $("#tour-caption").innerHTML = q.length
        ? `${q.map((q) => `<div class="quote-text">「${esc(txt(q.text))}」</div><div class="quote-source">${esc(txt(q.program))} · ${esc(q.timecode)}</div>`).join("")}`
        : `<div class="caption">${esc(txt(cue.caption))}</div><div class="tour-stage">${cue.target === "transport" ? tr("三明治培育：大一至大四", "Sandwich Program: Years 1–4") : n === D.tour.cues.length - 1 ? "hotel.nkuht.edu.tw · NKUHT Hospitality" : ""}</div>`;
      highlight();
    }
  }
  $("#tour-pause").onclick = toggleTour;
  $("#tour-replay").onclick = startTour;
  $("#tour-exit").onclick = stopTour;
  controls.addEventListener("change", () => {
    dirty = true;
  });
  reduced.addEventListener("change", () => {
    controls.enableDamping = !reduced.matches;
    // (learning routes read reduced motion every frame)
    if (reduced.matches) {
      fly = null;
      dayPlaying = false;
      tourPlaying = false;
      $("#day-play").textContent = "▶";
      $("#tour-pause").textContent = tr("播放", "Play");
    }
    dirty = true;
  });
  // Read-only QA snapshot plus explicit navigation hooks used for reproducible local screenshots.
  function walkerScreenStats() {
    const w = renderer.domElement.clientWidth,
      h = renderer.domElement.clientHeight;
    const blockers = pickables.filter((m) => m.userData.type === "buildingBatch" || m.userData.type === "island");
    let visible = 0,
      total = 0,
      minPx = Infinity;
    const r2 = new THREE.Raycaster();
    for (const p of peopleSys.people) {
      if (p.kind !== "flow" || !p.world) continue;
      total++;
      const head = p.world.clone().setY(p.world.y + 0.41 * (p.drawScale || 0.8));
      const foot = p.world.clone();
      const a = head.clone().project(camera),
        f = foot.clone().project(camera);
      if (Math.abs(a.x) > 1 || Math.abs(a.y) > 1 || a.z > 1) continue;
      const px = Math.abs(a.y - f.y) * 0.5 * h;
      const dir = head.clone().sub(camera.position);
      const dist = dir.length();
      r2.set(camera.position, dir.normalize());
      r2.far = dist - 0.05;
      const hit = r2.intersectObjects(blockers, false)[0];
      if (hit) continue;
      if (px < 1) continue;
      visible++;
      minPx = Math.min(minPx, px);
    }
    return { total, visible, minHeightPx: Math.round(minPx * 10) / 10 };
  }
  function selectTeacher(teacherId) {
    const idx = peopleSys.people.findIndex((w) => w.teacherId === teacherId || (teacherId === "hsieh-wc" && w.kind === "puma"));
    if (idx >= 0) selectWalker(idx);
  }
  let activeUtterance = null;
  let activeAudio = null;
  let activeSpeechTeacherId = null;
  let activeSpeechLang = null;
  function voiceBtnLabel(t, lang = null) {
    const targetLang = lang || (english ? "en" : "zh");
    const isFemale = t?.gender === "female";
    if (targetLang === "en") {
      return `🔊 ${isFemale ? "English Female Voice" : "English Male Voice"}`;
    }
    return `🔊 ${isFemale ? "中文擬真女聲" : "中文擬真男聲"}`;
  }
  function resetAllVoiceButtons() {
    document.querySelectorAll("[data-speak-teacher]").forEach((b) => {
      const bt = FACULTY_BY_ID.get(b.dataset.speakTeacher) || FACULTY[0];
      b.innerHTML = voiceBtnLabel(bt, b.dataset.speakLang || null);
      b.classList.remove("playing");
    });
  }
  function syncCardSpeechText(t, targetLang) {
    const isEn = targetLang === "en";
    document.querySelectorAll(`[data-teacher-intro="${t.id}"]`).forEach((el) => {
      el.textContent = isEn ? `“${t.intro.en}”` : `「${t.intro.zh}」`;
    });
    document.querySelectorAll(`[data-teacher-cur="${t.id}"]`).forEach((el) => {
      const islId = el.dataset.islId;
      const isl = islands.get(islId);
      if (!isl) return;
      const headB = el.querySelector("b");
      const bodyP = el.querySelector("p");
      if (headB) {
        headB.textContent = `📍 ${isEn ? "Currently at: " : "目前巡講站點："}${String(isl.number).padStart(2, "0")} ${isEn ? isl.name.en || isl.name.zh : shortNames[islId] || isl.name.zh}`;
      }
      if (bodyP) {
        const g = t.islandGuides?.[islId] || (isEn ? isl.summary?.en || t.intro.en : isl.summary?.zh || t.intro.zh);
        bodyP.textContent = isEn ? `“${g}”` : `「${g}」`;
      }
    });
  }
  function stopTeacherVoice() {
    if (activeAudio) {
      try {
        activeAudio.pause();
        activeAudio.currentTime = 0;
      } catch {}
      activeAudio = null;
    }
    if ("speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {}
    }
    activeUtterance = null;
    activeSpeechTeacherId = null;
    activeSpeechLang = null;
    resetAllVoiceButtons();
  }
  function pickNaturalBrowserVoice(gender, isEn) {
    if (!("speechSynthesis" in window)) return null;
    const voices = window.speechSynthesis.getVoices() || [];
    if (!voices.length) return null;
    const langPrefix = isEn ? "en" : "zh";
    const pool = voices.filter((v) => v.lang && v.lang.toLowerCase().startsWith(langPrefix));
    const candidates = pool.length ? pool : voices;
    const malePatterns = isEn
      ? [/andrew/i, /brian/i, /christopher/i, /eric/i, /roger/i, /steffan/i, /guy/i, /daniel/i, /alex/i, /david/i, /mark/i, /male/i]
      : [/yunjhe/i, /yunxi/i, /yunjian/i, /yunyang/i, /wanlung/i, /kangkang/i, /zhiwei/i, /male/i, /男/];
    const femalePatterns = isEn
      ? [/ava/i, /emma/i, /jenny/i, /aria/i, /michelle/i, /samantha/i, /victoria/i, /zira/i, /female/i]
      : [/hsiaochen/i, /hsiaoyu/i, /xiaoxiao/i, /xiaoyi/i, /hiugaai/i, /meijia/i, /sin-ji/i, /ting-ting/i, /hanhan/i, /yaoyao/i, /huihui/i, /female/i, /女/];
    const targetPatterns = gender === "female" ? femalePatterns : malePatterns;
    const oppositePatterns = gender === "female" ? malePatterns : femalePatterns;
    let best = null;
    let bestScore = -999;
    for (const v of candidates) {
      const name = `${v.name} ${v.voiceURI}`;
      let score = 0;
      if (!isEn && /zh[-_]?tw/i.test(v.lang)) score += 30;
      if (/natural|neural|online|premium|enhanced/i.test(name)) score += 50;
      if (targetPatterns.some((rx) => rx.test(name))) score += 45;
      if (oppositePatterns.some((rx) => rx.test(name))) score -= 80;
      if (score > bestScore) {
        bestScore = score;
        best = v;
      }
    }
    return best;
  }
  function speakTeacher(teacherId, btnEl = null, forceLang = null) {
    const t = FACULTY_BY_ID.get(teacherId) || FACULTY[0];
    const targetLang = forceLang || btnEl?.dataset?.speakLang || (english ? "en" : "zh");
    const isEn = targetLang === "en";
    if (
      activeSpeechTeacherId === teacherId &&
      activeSpeechLang === targetLang &&
      (activeAudio || ("speechSynthesis" in window && window.speechSynthesis.speaking))
    ) {
      stopTeacherVoice();
      return;
    }
    stopTeacherVoice();
    syncCardSpeechText(t, targetLang);
    activeSpeechTeacherId = teacherId;
    activeSpeechLang = targetLang;
    if (btnEl) {
      btnEl.innerHTML = `⏹️ ${isEn ? "Stop Voice" : "停止語音"}`;
      btnEl.classList.add("playing");
    }
    const audioSrc = isEn ? t.audio?.en : t.audio?.zh;
    if (audioSrc && typeof Audio !== "undefined") {
      try {
        const audio = new Audio(audioSrc);
        activeAudio = audio;
        audio.onended = () => {
          if (activeAudio === audio) {
            activeAudio = null;
            activeSpeechTeacherId = null;
            activeSpeechLang = null;
            resetAllVoiceButtons();
          }
        };
        audio.onerror = () => {
          if (activeAudio === audio) {
            activeAudio = null;
            speakTeacherFallback(t, btnEl, isEn);
          }
        };
        const playPromise = audio.play();
        if (playPromise && typeof playPromise.catch === "function") {
          playPromise.catch(() => {
            if (activeAudio === audio) {
              activeAudio = null;
              speakTeacherFallback(t, btnEl, isEn);
            }
          });
        }
        track("htl_teacher_voice", { teacher: teacherId, mode: "neural_mp3", gender: t.gender, lang: targetLang });
        return;
      } catch {}
    }
    speakTeacherFallback(t, btnEl, isEn);
  }
  function speakTeacherFallback(t, btnEl = null, isEn = english) {
    if (!("speechSynthesis" in window)) {
      resetAllVoiceButtons();
      return;
    }
    const w = peopleSys.people.find((p) => p.teacherId === t.id || (t.id === "hsieh-wc" && p.kind === "puma"));
    const curGuide = w?.atIsland && t.islandGuides?.[w.atIsland] ? t.islandGuides[w.atIsland] : "";
    const textToSpeak = isEn
      ? t.intro.en
      : `${t.intro.zh} ${curGuide ? "目前我所在的主題島嶼重點：" + curGuide : ""}`;
    const u = new SpeechSynthesisUtterance(textToSpeak);
    u.lang = isEn ? "en-US" : "zh-TW";
    const chosenVoice = pickNaturalBrowserVoice(t.gender || "male", isEn);
    if (chosenVoice) u.voice = chosenVoice;
    u.rate = 1.0;
    u.pitch = t.gender === "female" ? 1.08 : 0.92;
    activeUtterance = u;
    if (btnEl) {
      btnEl.innerHTML = `⏹️ ${isEn ? "Stop Voice" : "停止語音"}`;
      btnEl.classList.add("playing");
    }
    u.onend = u.onerror = () => {
      activeSpeechTeacherId = null;
      activeSpeechLang = null;
      resetAllVoiceButtons();
    };
    window.speechSynthesis.speak(u);
    track("htl_teacher_voice", { teacher: t.id, mode: "web_speech_fallback", gender: t.gender, lang: isEn ? "en" : "zh" });
  }
  function islandFacultyHTML(islandId) {
    const list =
      islandId === "welfare"
        ? FACULTY
        : FACULTY.filter((t) => t.islands.includes(islandId));
    const shown = list.length ? list : [FACULTY[0]];
    return `<h3>${tr("👩‍🏫 授課與導覽師長（點擊召喚 3D 老師解說）", "👩‍🏫 FACULTY GUIDES (CLICK FOR 3D GUIDE)")}</h3>
      <div class="island-faculty-list">
        ${shown
          .map((t) => {
            const guide = t.islandGuides?.[islandId] || (english ? t.intro.en : t.intro.zh);
            return `<button type="button" class="island-faculty-card" data-teacher="${esc(t.id)}">
              <img class="ifc-photo" src="${esc(t.photo)}" decoding="async" alt="${esc(txt(t.name))}">
              <div class="ifc-body">
                <div class="ifc-head"><b>${esc(txt(t.name))}</b><span>${esc(txt(t.title))}</span><em class="ifc-cta">🎙️ 3D 開講 ›</em></div>
                <p class="ifc-quote">「${esc(guide)}」</p>
              </div>
            </button>`;
          })
          .join("")}
      </div>`;
  }
  function buildingFacultyHeroHTML(b) {
    const directTeacher = FACULTY.find((t) => t.buildingId === b.id);
    if (directTeacher) {
      const t = directTeacher;
      const courses = (english ? t.courses.en : t.courses.zh).map((c) => `<span class="pill soft">📘 ${esc(c)}</span>`).join("");
      return `<div class="teacher-building-hero">
        <div class="tbh-top">
          <img class="tbh-photo" src="${esc(t.photo)}" decoding="async" alt="${esc(txt(t.name))}">
          <div class="tbh-info">
            <div class="tbh-badge">👔 ${esc(tr("3D 師長角色：", "3D Faculty Look: "))}${esc(txt(t.appearanceNote))}</div>
            <p class="tbh-intro" data-teacher-intro="${esc(t.id)}">${english ? `“${esc(t.intro.en)}”` : `「${esc(t.intro.zh)}」`}</p>
          </div>
        </div>
        <div class="pills" style="margin:8px 0">${courses}</div>
        <div class="tbh-actions">
          <button type="button" class="tbh-btn primary" data-teacher="${esc(t.id)}">🎯 ${esc(tr(`在 3D 場景中跟隨${t.name.zh}老師巡講`, `Follow ${t.shortTitle.en} in 3D`))}</button>
          <button type="button" class="tbh-btn" data-speak-teacher="${esc(t.id)}" data-speak-lang="zh">${voiceBtnLabel(t, "zh")}</button>
          <button type="button" class="tbh-btn" data-speak-teacher="${esc(t.id)}" data-speak-lang="en">${voiceBtnLabel(t, "en")}</button>
        </div>
      </div>`;
    }
    const islTeachers = FACULTY.filter((t) => t.islands.includes(b.island));
    if (!islTeachers.length) return "";
    return `<div class="building-faculty-bar">
      <span class="bfb-label">${esc(tr("👩‍🏫 相關授課與指導老師：", "👩‍🏫 Related Faculty:"))}</span>
      <div class="bfb-chips">
        ${islTeachers
          .map(
            (t) =>
              `<button type="button" class="bfb-chip" data-teacher="${esc(t.id)}"><img src="${esc(thumb(t.photo))}" alt="" decoding="async"><span>${esc(txt(t.shortTitle))}</span></button>`,
          )
          .join("")}
      </div>
    </div>`;
  }
  function selectWalker(index) {
    const w = peopleSys.people[index];
    if (!w) return;
    clearSkyCraft();
    if (w.kind === "puma" || w.kind === "faculty" || w.kind === "lord") {
      selectedWalker = index;
      selRing.visible = true;
      followAnchor = null;
      if (w.kind === "puma" || w.kind === "faculty") {
        // Pause the teacher on their podium for 12s so the user can view their 3D character and speech cloud
        w.wait = Math.max(w.wait || 0, 12);
        w.waiting = true;
        w.pose = "wave";
      }
      const at = (w.world || new THREE.Vector3()).clone();
      const off = new THREE.Vector3(0.9, 2.3, 2.2);
      const target = at.clone();
      let pos = target.clone().add(off);
      if (stage.clientWidth > 800) {
        const right = new THREE.Vector3(off.z, 0, -off.x).normalize().multiplyScalar(0.6);
        target.sub(right);
        pos.sub(right);
      } else {
        const fwd = new THREE.Vector3(0.2, 0, 0.5);
        target.add(fwd);
        pos.add(fwd);
      }
      if (reduced.matches) {
        camera.position.copy(pos);
        controls.target.copy(target);
      } else fly = { time: performance.now(), from: camera.position.clone(), to: pos, old: controls.target.clone(), target };
      cardShow(w.kind === "lord" ? lordCard(w) : pumaCard(w));
      if (w.kind === "lord") track("htl_lord_found");
      else if (w.teacherId) track("htl_teacher_select", { teacher: w.teacherId });
      requestAnimationFrame(() => {
        try {
          const url = portrait(w),
            badge3d = document.querySelector("#card .teacher-3d-avatar");
          if (url && badge3d) {
            badge3d.innerHTML = `<img src="${url}" alt="3D 角色"><span>3D</span>`;
          }
        } catch {}
      });
      return;
    }
    if (w.kind !== "flow") {
      selectedWalker = index;
      selRing.visible = true;
      const isl = w.island ? islands.get(w.island) : null;
      const islLm = w.island ? [...LANDMARKS.values()].find((l) => l.island === w.island) : null;
      cardShow(`<div class="card-head"><div class="icon-tile role">${roleGlyph(w.role)}</div><div><div class="eyebrow">${esc(tr("高餐校園人物 · 實景制服", "NKUHT Campus Member · Uniform"))}</div><h2>${esc(tr(...ROLE_LABEL[w.role]))}</h2><div class="pills">${w.uniformLabel ? `<span class="pill status">👔 ${esc(tr(...w.uniformLabel))}</span>` : ""}${isl ? `<button type="button" class="pill soft" data-island="${esc(w.island)}" style="cursor:pointer;border:none">📍 ${String(isl.number).padStart(2, "0")} ${esc(english ? txt(isl.name) : shortNames[w.island])}</button>` : ""}</div></div></div><p class="plain">${esc(tr("身穿國立高雄餐旅大學代表制服，正在校園地標與專業實習場域之間交流學習。", "Dressed in authentic NKUHT student uniform, engaging in hospitality learning across the campus."))}</p>${islLm ? `<div class="rows"><button type="button" class="row" data-landmark="${esc(islLm.id)}"><span class="dot" style="background:#d98b2b"></span><span class="nm">${esc(islLm.badge)} <b>${esc(txt(islLm.name))}</b></span><span class="ph">${esc(tr("鄰近地標 ›", "Nearby Landmark ›"))}</span><i aria-hidden="true">›</i></button></div>` : ""}`);
      requestAnimationFrame(() => {
        try {
          const url = portrait(w),
            t = document.querySelector("#card .icon-tile.role");
          if (url && t) {
            t.classList.add("portrait");
            t.innerHTML = `<img src="${url}" alt=""><span class="glyph">${roleGlyph(w.role)}</span>`;
          }
        } catch {}
      });
      return;
    }
    selectedWalker = index;
    selRing.visible = true;
    const f = flows.get(w.flow);
    showFlows([w.flow]);
    const at = w.world || w.route.pts[0];
    const target = at.clone();
    const off = new THREE.Vector3(1.6, 1.9, 2.4);
    let pos = target.clone().add(off);
    if (stage.clientWidth > 800) {
      const right = new THREE.Vector3(off.z, 0, -off.x).normalize().multiplyScalar(0.7);
      target.sub(right);
      pos.sub(right);
    }
    if (reduced.matches) {
      camera.position.copy(pos);
      controls.target.copy(target);
    } else fly = { time: performance.now(), from: camera.position.clone(), to: pos, old: controls.target.clone(), target };
    cardShow(walkerCard(w, f));
    requestAnimationFrame(() => {
      try {
        const url = portrait(w),
          t = document.querySelector("#card .icon-tile.role");
        if (url && t) {
          t.classList.add("portrait");
          t.innerHTML = `<img src="${url}" alt=""><span class="glyph">${roleGlyph(w.role)}</span>`;
        }
      } catch {}
    });
  }
  // 彩蛋角色：旅館島島主（虛構角色）
  function lordCard(w) {
    const stops = w.order.map((id) => `<span class="pill soft">${String(islands.get(id).number).padStart(2, "0")} ${esc(english ? txt(islands.get(id).name) : shortNames[id])}</span>`).join("");
    return `<div class="card-head"><div class="icon-tile role puma-tile lord-tile">✦</div><div><div class="eyebrow">${esc(tr("彩蛋角色・10% 機率出現", "EASTER EGG · 10% CHANCE"))}</div><h2>${esc(tr("群賢館長（彩蛋角色）", "The Qunxian Master"))}</h2></div></div>
      <p class="lede">${esc(tr("恭喜，你遇到傳說中的群賢館長了！他只有 10% 的機率出現在旅館島上巡視。", "Lucky you: the Qunxian Master turns up on only 1 visit in 10."))}</p>
      <h3>${esc(tr("關於他", "ABOUT"))}</h3>
      <ul class="facts">
        <li>${esc(tr("一眼就能看出床單包角有沒有呈標準 45 度、玻璃杯有沒有水痕的傳奇房務與客務達人。", "A legendary hotelier who can spot a bed corner off by one degree at a single glance."))}</li>
        <li>${esc(tr(`每天在 ${D.islands.length} 座主題島嶼之間巡視，確保從校內群賢會館到 ${OFFICIAL.partners.length} 家菁英實習合作旅館的動線暢通無阻。`, `He patrols all ${D.islands.length} islands daily, from Qunxian Hotel to the ${OFFICIAL.partners.length} Elite Internship partner hotels.`))}</li>
        <li>${esc(tr("熱愛高爾夫與俱樂部管理，常常勉勵同學：「把基本功練好，全世界的五星級飯店都為你敞開大門！」", "Passionate about club management and hospitality excellence."))}</li>
      </ul>
      <h3>${esc(tr("館長私房推薦", "MASTER'S RECOMMENDATION"))}</h3>
      <p>${esc(tr("歡迎造訪國立高雄餐旅大學旅館管理系官方網站，掌握最新課程與招生資訊。", "Visit the official NKUHT Department of Hotel Management website."))}</p>
      <p><a class="lord-link" href="https://hotel.nkuht.edu.tw/" target="_blank" rel="noopener noreferrer">${esc(tr("前往旅館管理系官網 ↗", "Visit NKUHT HTL Official Site ↗"))}</a></p>
      <h3>${esc(tr("今天的巡視路線", "TODAY'S ROUTE"))}</h3><div class="pills">${stops}</div>`;
  }
  function pumaCard(w) {
    const t = FACULTY_BY_ID.get(w.teacherId) || FACULTY[0];
    const curIslId = w.atIsland || t.islands[0] || "welfare";
    const curIsl = islands.get(curIslId);
    const curGuide = t.islandGuides?.[curIslId] || txt(t.intro);
    const specs = (english ? t.specialties.en : t.specialties.zh).map((s) => `<span class="pill">${esc(s)}</span>`).join("");
    const courses = (english ? t.courses.en : t.courses.zh).map((c) => `<span class="pill soft">📘 ${esc(c)}</span>`).join("");
    const guideIslands = t.islands.map((islId) => {
      const isl = islands.get(islId);
      if (!isl) return "";
      const gText = t.islandGuides?.[islId] || "";
      return `<button type="button" class="row teacher-isl-row" data-island="${esc(islId)}">
        <span class="dot"></span>
        <span class="nm"><b>${String(isl.number).padStart(2, "0")} ${esc(english ? txt(isl.name) : shortNames[islId])}</b>${gText ? `<small class="tig-sub">${esc(gText)}</small>` : ""}</span>
        <span class="ph">${islId === curIslId ? tr("📍 所在島嶼", "📍 Current") : tr("前往島嶼", "Visit")}</span>
        <i aria-hidden="true">›</i>
      </button>`;
    }).join("");
    const roster = FACULTY.map((other) => {
      const active = other.id === t.id ? " active" : "";
      return `<button type="button" class="faculty-mini-btn${active}" data-teacher="${esc(other.id)}" title="${esc(txt(other.name))}｜${esc(txt(other.title))}">
        <img src="${esc(thumb(other.photo))}" alt="${esc(txt(other.name))}" decoding="async">
        <span>${esc(english ? other.shortTitle.en : other.name.zh)}</span>
      </button>`;
    }).join("");
    return `<div class="card-head teacher-card-head">
        <div class="teacher-avatar-wrap">
          <img class="teacher-real-photo" src="${esc(t.photo)}" alt="${esc(txt(t.name))}">
          <div class="teacher-3d-avatar" title="3D 即時角色模型"><span>3D</span></div>
        </div>
        <div>
          <div class="eyebrow">FACULTY &amp; COURSE GUIDE · ${esc(tr("專任師資導覽角色", "3D FACULTY GUIDE"))}</div>
          <h2>${esc(txt(t.name))}</h2>
          <div class="teacher-title-sub">${esc(txt(t.title))}</div>
        </div>
      </div>
      <div class="pills">
        <span class="pill status">📞 ${esc(tr("分機 ", "Ext. "))}${esc(t.ext)}</span>
        <a class="pill soft" href="mailto:${esc(t.email)}" style="text-decoration:none">✉️ ${esc(t.email)}</a>${t.education ? `<span class="pill soft">🎓 ${esc(t.education)}</span>` : ""}
      </div>
      <div class="teacher-look-banner">👔 <b>${esc(tr("3D 角色形象特徵：", "3D Look:"))}</b>${esc(txt(t.appearanceNote))}</div>
      <div class="teacher-speech-box">
        <div class="tsb-head">
          <span>🎙️ ${esc(tr(`${t.name.zh}老師開講：中／英文擬真語音導覽`, `${t.shortTitle.en}'s Bilingual Voice & Dept. Guide`))}</span>
          <div class="tsb-voice-group">
            <button type="button" class="tsb-voice-btn" data-speak-teacher="${esc(t.id)}" data-speak-lang="zh">${voiceBtnLabel(t, "zh")}</button>
            <button type="button" class="tsb-voice-btn" data-speak-teacher="${esc(t.id)}" data-speak-lang="en">${voiceBtnLabel(t, "en")}</button>
          </div>
        </div>
        <p class="tsb-intro" data-teacher-intro="${esc(t.id)}">${english ? `“${esc(t.intro.en)}”` : `「${esc(t.intro.zh)}」`}</p>
        ${curIsl ? `<div class="tsb-current" data-teacher-cur="${esc(t.id)}" data-isl-id="${esc(curIslId)}"><b>📍 ${esc(tr("目前巡講站點：", "Currently at: "))}${String(curIsl.number).padStart(2, "0")} ${esc(english ? txt(curIsl.name) : shortNames[curIslId])}</b><p>${english ? `“${esc(txt(curIsl.summary) || curGuide)}”` : `「${esc(txt(curIsl.summary) || curGuide)}」`}</p></div>` : ""}
      </div>
      ${courses ? `<h3>${esc(tr("授課領域（官網）", "TEACHING AREAS (OFFICIAL)"))}</h3>
      <div class="pills">${courses}</div>` : ""}
      <h3>${esc(tr("研究與專業領域", "RESEARCH & EXPERTISE"))}</h3>
      <div class="pills">${specs}</div>
      <h3>${esc(tr("負責解說之主題島嶼與研究室", "GUIDED ISLANDS & LAB"))}</h3>
      <div class="rows">
        <button type="button" class="row" data-building="${esc(t.buildingId)}"><span class="dot" style="background:#e5a922"></span><span class="nm">🏛️ ${esc(tr(`前往${t.name.zh}老師研究室細項`, `Visit ${t.shortTitle.en}'s Office`))}</span><span class="ph">${esc(tr("08 師資陣容", "08 Faculty"))}</span><i aria-hidden="true">›</i></button>
        ${guideIslands}
      </div>
      <h3>${esc(tr("切換全系 10 位專任師長 3D 角色", "SWITCH 3D FACULTY CHARACTER (10)"))}</h3>
      <div class="faculty-mini-grid">${roster}</div>
      <h3>${esc(tr("官方師資簡介與真實資料專頁", "OFFICIAL FACULTY PROFILE & DATA PAGE"))}</h3>
      <div class="sources">
        <a href="./p/${encodeURIComponent(t.buildingId)}/${english ? "?lang=en" : ""}" target="_blank" rel="noopener noreferrer">📄 ${esc(tr(`開啟${t.name.zh}老師獨立真實資料專頁`, `Open ${t.shortTitle.en}'s standalone data page`))} ↗</a>
        <a href="${esc(t.url)}" target="_blank" rel="noopener noreferrer">↗ ${esc(txt(t.name))} — ${esc(tr("餐旅學院師資個人頁", "Official faculty profile (College of Hospitality)"))}</a>
        <a href="https://shm.nkuht.edu.tw/p/412-1016-854.php?Lang=zh-tw" target="_blank" rel="noopener noreferrer">↗ ${esc(tr("國立高雄餐旅大學餐旅學院・旅館管理系專任(案)教師", "NKUHT College of Hospitality — Hotel Management faculty"))}</a>
      </div>`;
  }
  const selRing = new THREE.Mesh(new THREE.RingGeometry(0.11, 0.15, 28).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: colors.coral, transparent: true, opacity: 0.9, depthWrite: false }));
  selRing.visible = false;
  selRing.renderOrder = 4;
  scene.add(selRing);
  function walkerCard(w, f) {
    const prog = w.route.total ? Math.round((w.s / w.route.total) * 100) : 0;
    return `<div class="card-head"><div class="icon-tile role">${roleGlyph(w.role)}</div><div><div class="eyebrow">${esc(tr("教學與實習動線上的旅館系學員", "HTL Member on a Learning Flow"))}</div><h2>${esc(tr(...ROLE_LABEL[w.role]))}</h2><div class="pills"><span class="pill flow">${f.id}</span><span class="pill">${esc(tierLabel(f.evidenceTier))}</span>${w.uniformLabel ? `<span class="pill status">👔 ${esc(tr(...w.uniformLabel))}</span>` : ""}</div></div></div>
    <div class="stat-row"><div class="stat${tr(...(CARRY_LABEL[w.carry] || [w.carry, w.carry])).length > 4 ? " long" : ""}" style="--accent:#db6a41"><span class="lbl">${esc(tr("正在搬", "Carrying"))}</span><b>${esc(tr(...(CARRY_LABEL[w.carry] || [w.carry, w.carry])))}</b></div><div class="stat${(shortNames[w.from] || "").length > 4 ? " long" : ""}" style="--accent:#3e7c8c"><span class="lbl">${esc(tr("從", "From"))}</span><b>${esc(english ? nameOf(w.from) : shortNames[w.from] || nameOf(w.from))}</b></div><div class="stat${(shortNames[w.to] || "").length > 4 ? " long" : ""}" style="--accent:#e8c547"><span class="lbl">${esc(tr("到", "To"))}</span><b>${esc(english ? nameOf(w.to) : shortNames[w.to] || nameOf(w.to))}</b></div></div>
    <p class="doing"><i></i>${esc(w.wait > 0 ? tr("在", "At ") + nameOf(w.s >= w.route.total - 0.001 ? w.to : w.from) + tr("交接", ", handing over") : tr("正在前往 ", "Heading to ") + nameOf(w.dirSign > 0 ? w.to : w.from))}</p>
    <h3>${esc(tr("路程", "Route"))}</h3><div class="meter"><i style="width:${prog}%"></i></div>
    <h3>${esc(tr("這條路線在說什麼", "About this route"))}</h3><p>${esc(txt(f.text))}</p>
    <h3>${esc(tr("關係出處", "SOURCES"))}</h3>${sourceLinks(f.sources)}${f.quotes.map((id) => quoteHTML(quotes.get(id))).join("")}`;
  }
  function roleGlyph(role) {
    const m = { "civil-servant": "師", researcher: "研", elder: "導", child: "新", parent: "幹", cyclist: "參", farmer: "侍", citizen: "生", hiker: "渡", worker: "房", officeworker: "儲", youth: "競", traveller: "際" };
    return `<span>${m[role] || "人"}</span>`;
  }
  // Ground height for add-ons (the 「我的角色」 avatar): static scene only — walkers, connection lines, labels,
  // foliage canopies, cliffs and see-through effects are skipped — and instanced meshes get fresh bounds once.
  let groundMeshes = null;
  const groundRay = new THREE.Raycaster();
  function groundAt(x, z, fromY = 3, maxDrop = 6) {
    if (!groundMeshes) {
      const skip = new Set([
        ...peopleSys.meshes,
        ...flowPaths.map((p) => p.mesh),
        ...Array.from(islandBodies.values()).flatMap((v) => [v.cliff, v.band]),
      ]);
      signGroup.traverse((o) => skip.add(o));
      landmarkSignGroup.traverse((o) => skip.add(o));
      landmarkHaloGroup.traverse((o) => skip.add(o));
      env.skyFleet?.group?.traverse((o) => skip.add(o));
      groundMeshes = [];
      scene.traverse((o) => {
        if (!o.isMesh || skip.has(o) || o.isSprite) return;
        if (o.userData?.kind === "leaf" || o.userData?.kind === "glowsphere") return;
        const m = o.material;
        if (!m || Array.isArray(m) || m.transparent || m.depthWrite === false || m.isShaderMaterial) return;
        if (o.isInstancedMesh) o.computeBoundingSphere();
        groundMeshes.push(o);
      });
    }
    groundRay.set(new THREE.Vector3(x, fromY, z), new THREE.Vector3(0, -1, 0));
    groundRay.far = maxDrop;
    const shown = (o) => { for (let p = o; p; p = p.parent) if (!p.visible) return false; return true; };
    for (const h of groundRay.intersectObjects(groundMeshes, false)) {
      if (!shown(h.object)) continue;
      // a top surface, not the side of a wall or a trunk
      const ny = h.face ? h.face.normal.clone().transformDirection(h.object.matrixWorld).y : 1;
      if (ny > 0.5 || h.object.isInstancedMesh) return h.point.y;
    }
    return null;
  }
  groundAt(0, 0); // snapshot the site's own meshes now, before any add-on (the avatar) puts its figures in the scene
  const navObstacles = [];
  {
    const roundKinds = new Set(["cylinder", "trunk", "cone", "cone6", "sphere", "dome", "ico"]);
    for (const [key, items] of kit.batches) {
      const kind = key.split("|")[0];
      if (kind === "leaf" || kind === "glowsphere" || kind === "torus") continue;
      for (const e of items) {
        if (!e.island || !islands.has(e.island)) continue;
        const botY = e.pos.y - e.scale.y / 2,
          topY = e.pos.y + e.scale.y / 2;
        const hex = e.color.getHex();
        const isWater =
          (hex === 0x6fb3c4 ||
            hex === 0x8ec9d4 ||
            hex === 0x9fd3de ||
            hex === 0x7fb0ae ||
            (hex === 0x86a8a6 && topY <= top + 0.075 && e.scale.x >= 0.35 && e.scale.z >= 0.14)) &&
          botY <= top + 0.08;
        const isWall = topY > top + 0.165 && botY < top + 0.3;
        if (!isWater && !isWall) continue;
        const maxHoriz = Math.max(e.scale.x, e.scale.z);
        if (!isWater && maxHoriz < 0.075 && e.scale.y < 0.28) continue;
        if (e.owner && LANDMARKS.has(e.owner)) {
          // Keep campus landmark plazas, steps, mirror pools & walkthrough arches freely walkable for WASD visits
          if (isWater || e.owner === "landmark:smilearch" || botY > top + 0.12) continue;
          const lm = LANDMARKS.get(e.owner);
          if (lm && Math.hypot(e.pos.x - lm.x, e.pos.z - lm.z) > 0.36) continue;
          if (maxHoriz > 0.68) continue;
        }
        const ic = centers.get(e.island);
        if (!isWater && !e.owner && ic && Math.hypot(e.pos.x - ic.x, e.pos.z - ic.z) > islandInnerR(e.island) + 0.14 && maxHoriz < 0.24) continue;
        const [rx, ry, rz] = e.rotation || [0, 0, 0];
        if (roundKinds.has(kind) && Math.abs(rx) < 0.25 && Math.abs(rz) < 0.25 && Math.abs(e.scale.x - e.scale.z) < 0.06) {
          navObstacles.push({
            type: "circle",
            island: e.island,
            owner: e.owner,
            water: isWater,
            x: e.pos.x,
            z: e.pos.z,
            r: Math.max(0.03, maxHoriz * 0.48),
          });
        } else {
          const hx = Math.max(0.025, (Math.abs(rz) > 0.4 ? Math.max(e.scale.x, e.scale.y * Math.abs(Math.sin(rz))) : e.scale.x) * 0.48);
          const hz = Math.max(0.025, (Math.abs(rx) > 0.4 ? Math.max(e.scale.z, e.scale.y * Math.abs(Math.sin(rx))) : e.scale.z) * 0.48);
          navObstacles.push({
            type: "obb",
            island: e.island,
            owner: e.owner,
            water: isWater,
            x: e.pos.x,
            z: e.pos.z,
            hx,
            hz,
            cos: Math.cos(ry || 0),
            sin: Math.sin(ry || 0),
          });
        }
      }
    }
  }
  window.heartCity = {
    // photo-share.js: draw one frame now and hand back the WebGL canvas (read it in the same task, before the browser clears it)
    photoWith: (id) => photoWithSubject(id),
    peopleNear: () => peopleSys.people.filter((w) => w.world).map((w) => [w.world.x, w.world.z]), // photo framing avoids passers-by // heart-me.js: 📸 button when the avatar arrives at a landmark / building
    capture() {
      try {
        if (fx) fx.render(camera);
        else renderer.render(scene, camera);
      } catch (e) {
        console.warn("capture", e);
      }
      dirty = true;
      return renderer.domElement;
    },
    routeScene, // QA: the overlay scene that holds the learning-route tubes
    plazaIsland,
    skyline,
    get marina() {
      return marina;
    },
    ringClockTower: (kind = "manual", period = null) => clockTower?.ring(kind, period) ?? false,
    scene,
    camera,
    controls,
    renderer,
    groundAt,
    navData: {
      top,
      islandRadius: R,
      islandCenters: Object.fromEntries([
        ...D.islands.map((i) => { const c = centers.get(i.id); return [i.id, { x: c.x, y: c.y, z: c.z, r: islandR(i.id) }]; }),
        ...[...(skyline?.nav.islands || []), ...(isletWalks?.nav.islands || []), ...(plazaIsland?.nav.islands || [])].map((i) => [i.id, { x: i.x, y: top, z: i.z, r: i.r, name: i.name }]),
      ]),
      bridges: bridges.map((b) => ({ a: b.a, b: b.b, pa: { x: b.pa.x, y: b.pa.y, z: b.pa.z }, pb: { x: b.pb.x, y: b.pb.y, z: b.pb.z }, arch: b.arch || 0.08, deck: b.deck || 0.02 })).concat(skyline?.nav.bridges || [], isletWalks?.nav.bridges || [], plazaIsland?.nav.bridges || [], marinaPlan ? marinaNav(marinaPlan, top) : []),
      obstacles: navObstacles.concat(skyline?.nav.obstacles || [], isletWalks?.nav.obstacles || [], window.__landmarkNav?.obstacles || []),
    },
    mapCamera: {
      box: mapCam.box,
      viewQuad: () => mapCam.viewQuad(),
      panTo: (x, z) => mapCam.panTo(x, z),
      fullMapView: () => mapCam.fullMapView(),
    },
    policies: D, // heart-me.js reads the same data instead of fetching policies.json a second time
    pedestrianRoutes: peopleSys.people
      .filter((w) => w.kind === "flow")
      .map((w) =>
        Array.from({ length: 120 }, (_, n) => {
          const { p } = peopleSys.sample(w, n / 120);
          return { x: p.x, z: p.z, footY: p.y };
        }),
      ),
    footprints: kit.footprints,
    get extraWalkRoutes() {
      const campus = { bridges, centers, ringR: (id) => islandR(id) - 0.22 };
      return [...(skyline ? skyline.routes(this.pedestrianRoutes, campus) : []), ...(isletWalks ? isletWalks.routes(this.pedestrianRoutes, campus) : []), ...(marina ? marina.routes(this.pedestrianRoutes, linkRoute) : []), ...(plazaIsland ? plazaIsland.routes(this.pedestrianRoutes, campus) : [])];
    },
    routeIslands: peopleSys.routeIslands,
    districtHeroes,
    sceneModels: Object.fromEntries(
      [...visual].map(([id, v]) => [id, { kind: sceneSpecs[id][0], description: sceneSpecs[id][1], parts: v.parts.length, island: buildings.get(id).island }]),
    ),
    view: (id, dx = 1.2, dy = 1.1, dz = 1.6, ox = 0, oz = 0) => {
      // QA close-up: look at an island (or [x,z]) from a fixed offset
      const c = Array.isArray(id) ? new THREE.Vector3(id[0], 0, id[1]) : centers.get(id).clone();
      const t = c.setY(top + 0.25).add(new THREE.Vector3(ox, 0, oz));
      fly = null;
      controls.target.copy(t);
      camera.position.copy(t).add(new THREE.Vector3(dx, dy, dz));
      controls.update();
      dirty = true;
    },
    nudge: (deg) => {
      // QA: turn the current view a little around its own target (simulates a slow finger drag)
      const off = camera.position.clone().sub(controls.target).applyAxisAngle(new THREE.Vector3(0, 1, 0), THREE.MathUtils.degToRad(deg));
      fly = null;
      camera.position.copy(controls.target).add(off);
      controls.update();
      dirty = true;
    },
    orbit: (deg) => {
      // rotate the overview camera around the city centre (QA shots of all four sides)
      const t = overviewTarget();
      const off = overviewPosition().sub(t);
      off.applyAxisAngle(new THREE.Vector3(0, 1, 0), THREE.MathUtils.degToRad(deg));
      fly = null;
      camera.position.copy(t).add(off);
      controls.target.copy(t);
      controls.update();
      dirty = true;
    },
    debug: {
      walkerScreenStats,
      pumaQuote: (k = 0) => {
        pumaForce = k;
        dirty = true;
      },
      people: () => peopleSys.people.map((w, i) => ({ i, kind: w.kind, role: w.role, flow: w.flow, pos: w.world ? [w.world.x, w.world.y, w.world.z] : null })),
      islets: () => (decor.islets || []).map((o) => ({ ...o, screen: (() => { const v = new THREE.Vector3(o.x, 0.3, o.z).project(camera); return [Math.round(((v.x + 1) / 2) * innerWidth), Math.round(((1 - v.y) / 2) * innerHeight)]; })() })),
      timeClip: (n = 5) => {
        const t = performance.now();
        for (let k = 0; k < n; k++) clipLabels();
        return +((performance.now() - t) / n).toFixed(2);
      },
      flowRouteCheck: () => {
        // QA: every drawn branch follows the walkway graph, and every walker on a branch walks exactly that line
        const key = (v) => `${v.x.toFixed(3)},${v.z.toFixed(3)}`;
        const nodeAt = new Map(graph.nodes.map((n, i) => [key(n.p), i]));
        const bad = [];
        let branches = 0, walkers = 0, unwalked = [];
        for (const p of paths) {
          if (!p.mesh) continue;
          branches++;
          const pts = p.route.pts;
          // 2026-10-29: points between two graph nodes are the arched-deck samples of a bridge crossing; they must sit on
          // the straight line between those nodes (in plan), and the nodes themselves must be walkway edges
          const ids = [];
          for (let k = 0; k < pts.length; k++) {
            const n = nodeAt.get(key(pts[k]));
            if (n != null) ids.push([n, k]);
          }
          for (let j = 1; j < ids.length; j++) {
            const [a, ka] = ids[j - 1], [b, kb] = ids[j];
            let ok = graph.isEdge(a, b);
            for (let k = ka + 1; ok && k < kb; k++) {
              const A = pts[ka], B = pts[kb], Q = pts[k];
              ok = Math.abs((B.x - A.x) * (Q.z - A.z) - (B.z - A.z) * (Q.x - A.x)) / Math.hypot(B.x - A.x, B.z - A.z) < 0.01;
            }
            if (!ok) { bad.push([p.flow, p.from, p.to, "off-walkway", kb]); break; }
          }
          if (ids.length < 2 || ids[0][1] !== 0 || ids[ids.length - 1][1] !== pts.length - 1) bad.push([p.flow, p.from, p.to, "ends-off-walkway"]);
          const ws = peopleSys.people.filter((w) => w.kind === "flow" && w.flow === p.flow && w.from === p.from && w.to === p.to);
          if (!ws.length) unwalked.push(`${p.flow}:${p.from}>${p.to}`);
          for (const w of ws) { walkers++; if (w.route !== p.route) bad.push([p.flow, p.from, p.to, "walker-off-line"]); }
        }
        return { branches, walkers, bad, unwalked };
      },
      // QA (2026-10-29): coplanar top faces of the same depth class that overlap in plan — the parts that shimmer (z-fight)
      coplanarLifted: () => [kit.coplanarLifted, Math.round(kit.coplanarMs)],
      zfight: (tol = 0.004) => {
        const PRI = { glowbox: -6, glowsphere: -3, box: -3, prism: -1, tetra: -1, hip: 0, cylinder: -1, rbox: 0 };
        const tops = [];
        for (const [key, items] of kit.batches) {
          const kind = key.split("|")[0];
          if (!["box", "rbox", "cylinder", "glowbox"].includes(kind)) continue;
          for (const e of items) {
            const [rx, ry, rz] = e.rotation;
            if (Math.abs(rx) > 1e-3 || Math.abs(rz) > 1e-3) continue;
            const hx = e.scale.x / 2, hz = e.scale.z / 2, c = Math.abs(Math.cos(ry)), s2 = Math.abs(Math.sin(ry));
            const ex = kind === "cylinder" ? hx : hx * c + hz * s2, ez = kind === "cylinder" ? hz : hx * s2 + hz * c;
            tops.push({ y: e.pos.y + e.scale.y / 2, x0: e.pos.x - ex, x1: e.pos.x + ex, z0: e.pos.z - ez, z1: e.pos.z + ez, pri: PRI[kind], col: e.color.getHex(), owner: e.owner, island: e.island, kind });
          }
        }
        const grid = new Map(), G = 0.5, hits = [];
        tops.forEach((t, i) => {
          for (let gx = Math.floor(t.x0 / G); gx <= Math.floor(t.x1 / G); gx++)
            for (let gz = Math.floor(t.z0 / G); gz <= Math.floor(t.z1 / G); gz++) {
              const k = gx + "," + gz;
              if (!grid.has(k)) grid.set(k, []);
              grid.get(k).push(i);
            }
        });
        const seen = new Set();
        for (const list of grid.values())
          for (let a = 0; a < list.length; a++)
            for (let b = a + 1; b < list.length; b++) {
              const A = tops[list[a]], B = tops[list[b]];
              if (A.pri !== B.pri || A.col === B.col || Math.abs(A.y - B.y) >= tol) continue;
              const ox = Math.min(A.x1, B.x1) - Math.max(A.x0, B.x0), oz = Math.min(A.z1, B.z1) - Math.max(A.z0, B.z0);
              if (ox <= 0.005 || oz <= 0.005) continue;
              const k = list[a] < list[b] ? list[a] + "-" + list[b] : list[b] + "-" + list[a];
              if (seen.has(k)) continue;
              seen.add(k);
              hits.push({ owner: A.owner || B.owner || "(decor)", island: A.island || B.island, kinds: A.kind + "/" + B.kind, dy: +(A.y - B.y).toFixed(4), cols: [A.col.toString(16), B.col.toString(16)], sizes: [[+(A.x1 - A.x0).toFixed(2), +(A.z1 - A.z0).toFixed(2)], [+(B.x1 - B.x0).toFixed(2), +(B.z1 - B.z0).toFixed(2)]], area: +(ox * oz).toFixed(4), at: [+((A.x0 + A.x1) / 2).toFixed(2), +A.y.toFixed(3), +((A.z0 + A.z1) / 2).toFixed(2)] });
            }
        return hits.sort((a, b) => b.area - a.area);
      },
      flowAudit: () =>
        paths.map((p) => {
          const pts = p.route.pts, a = pts[0], b = pts[pts.length - 1];
          const near = (v) => { let best = null, bd = 1e9; for (const id of islands.keys()) { const d = Math.hypot(centers.get(id).x - v.x, centers.get(id).z - v.z); if (d < bd) { bd = d; best = id; } } return [best, +bd.toFixed(2)]; };
          const ws = peopleSys.people.filter((w) => w.kind === "flow" && w.flow === p.flow && w.from === p.from && w.to === p.to);
          return { flow: p.flow, from: p.from, to: p.to, len: +p.route.total.toFixed(2), ratio: +(p.route.total / Math.max(0.01, Math.hypot(a.x - b.x, a.z - b.z))).toFixed(2), start: near(a), end: near(b), toDist: +Math.hypot(centers.get(p.to).x - b.x, centers.get(p.to).z - b.z).toFixed(2), fromDist: +Math.hypot(centers.get(p.from).x - a.x, centers.get(p.from).z - a.z).toFixed(2), via: [...p.route.islands], walkers: ws.map((w) => w.role) };
        }),
      firstWalker: (flow) => peopleSys.people.findIndex((w) => w.kind === "flow" && w.flow === flow),
      decorStats: () => kit.decorStats(),
      envStats: () => env.stats,
      renewalLabels: () => !renewalSign ? [] : [...renewalGhosts.children.filter((o) => o.isCSS2DObject).map((o) => o.element.textContent), renewalSign.element.textContent],
      coast: () => decor.coastStats,
      center: (id) => [centers.get(id).x, centers.get(id).z, islandR(id)],
      puma: () => {
        const i = peopleSys.people.findIndex((w) => w.kind === "puma");
        const w = peopleSys.people[i];
        return { index: i, at: w?.atIsland, waiting: w?.waiting, leg: w?.leg, legs: w?.legs.map((l) => +l.total.toFixed(2)), world: w?.world && [+w.world.x.toFixed(2), +w.world.z.toFixed(2)] };
      },
      pins: () => [...pinViews.keys()],
      routes: () => ({ routes: decor.routes, ends: decor.routeEnds, diplomacy: [centers.get("diplomacy").x, centers.get("diplomacy").z], R }),
      bridges: () => bridges.map((b) => ({ a: b.a, b: b.b, pa: [b.pa.x, b.pa.z], pb: [b.pb.x, b.pb.z], ca: [centers.get(b.a).x, centers.get(b.a).z], cb: [centers.get(b.b).x, centers.get(b.b).z] })),
      luminance: () => {
        renderer.render(scene, camera);
        const gl = renderer.getContext();
        const w = gl.drawingBufferWidth,
          h = gl.drawingBufferHeight;
        const px = new Uint8Array(w * h * 4);
        gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, px);
        let sum = 0,
          n = 0;
        for (let i = 0; i < px.length; i += 4 * 7) {
          sum += 0.2126 * px[i] + 0.7152 * px[i + 1] + 0.0722 * px[i + 2];
          n++;
        }
        return sum / n;
      },
      lightKinds: () => ({ windows: kit.batches.get("glowbox")?.length || 0, bulbs: kit.batches.get("glowsphere")?.length || 0, lampPools: (decor.lampSpots || []).length, lighthouses: (decor.lighthouses || []).length, strings: (decor.stringLights || []).length, ferryLamps: ferries.length }),
      cyclist: () => {
        const w = peopleSys.people.find((p) => p.role === "cyclist");
        if (!w) return null;
        return { role: w.role, parts: w.plan.parts.length };
      },
      trees: () => ({ leaf: kit.batches.get("leaf")?.length || 0, bigTrees: kit.decorStats ? Object.values(kit.decorStats()).length : 0, smoothCrowns: (kit.batches.get("sphere") || []).filter((p) => p.scale.x > 0.3 && p.scale.y > 0.25 && p.color.g > p.color.r * 1.15 && p.color.g > p.color.b * 1.2).length }),
    },
    get state() {
      return {
        islands: islands.size,
        buildings: buildings.size,
        flows: flows.size,
        walkers: peopleSys.people.filter((w) => w.kind === "flow").length,
        ambient: peopleSys.people.filter((w) => w.kind === "ambient").length,
        visibleWalkers: peopleSys.people.filter((w) => w.kind === "flow" && (!selectedFlows.size || selectedFlows.has(w.flow))).length,
        selectedIsland,
        selectedBuilding,
        selectedFlows: [...selectedFlows],
        tourActive,
        tourSeconds,
        reducedMotion: reduced.matches,
        quality,
        drawBuffer: [renderer.domElement.width, renderer.domElement.height],
        fps,
        drawCalls: renderer.info.render.calls,
        triangles: renderer.info.render.triangles,
        excludedRetailAnimated: flowPaths.some((p) => p.to === "street-retail"),
        cameraElevation:
          90 - THREE.MathUtils.radToDeg(new THREE.Spherical().setFromVector3(camera.position.clone().sub(controls.target)).phi),
      };
    },
    selectIsland,
    selectBuilding: (id, opts) => selectBuilding(id, opts),
    selectLandmark: (id, opts) => selectLandmark(id, opts),
    closeIntro,
    LANDMARKS,
    selectFlow,
    selectWalker,
    selectTeacher,
    speakTeacher,
    faculty: FACULTY,
    landmarks: [...LANDMARKS.values()].map((l) => ({ id: l.id, island: l.island, x: l.x, z: l.z, badge: l.badge, name: l.name, category: l.category, summary: l.summary })),
    getFacultyPositions() {
      const out = [];
      for (let i = 0; i < peopleSys.people.length; i++) {
        const w = peopleSys.people[i];
        if (!w.world) continue;
        if (w.kind === "puma" || w.kind === "faculty") {
          const t = w.teacherId ? FACULTY_BY_ID.get(w.teacherId) : FACULTY[0];
          if (t) {
            out.push({
              walkerIndex: i,
              kind: w.kind,
              id: t.id,
              name: t.name,
              shortTitle: t.shortTitle,
              buildingId: t.buildingId,
              x: w.world.x,
              y: w.world.y,
              z: w.world.z,
              atIsland: w.atIsland,
            });
          }
        } else if (w.kind === "lord") {
          out.push({
            walkerIndex: i,
            kind: "lord",
            id: "lord",
            name: { zh: "群賢館長", en: "The Qunxian Master" },
            shortTitle: { zh: "群賢館長", en: "Qunxian Master" },
            x: w.world.x,
            y: w.world.y,
            z: w.world.z,
            atIsland: w.atIsland,
          });
        }
      }
      return out;
    },
    getCameraFocus() {
      return {
        x: controls.target.x,
        z: controls.target.z,
        dx: controls.target.x - camera.position.x,
        dz: controls.target.z - camera.position.z,
      };
    },
    getNpcWalkers() {
      const out = [];
      for (let i = 0; i < peopleSys.people.length; i++) {
        const w = peopleSys.people[i];
        if (!w.world || w.kind !== "flow") continue;
        const fl = flows.get(w.flow);
        out.push({
          walkerIndex: i,
          kind: "flow",
          interactive: !!w.interactive,
          role: w.role,
          roleLabel: ROLE_LABEL[w.role]?.[0] || "旅館系學長姐",
          roleLabelEn: ROLE_LABEL[w.role]?.[1] || "HTL Senior",
          flow: w.flow,
          flowTitle: fl ? txt(fl.text) : "",
          carry: w.carry,
          carryLabel: CARRY_LABEL[w.carry]?.[0] || "",
          uniformLabel: w.uniformLabel?.[0] || "",
          uniformLabelEn: w.uniformLabel?.[1] || "",
          x: w.world.x,
          y: w.world.y,
          z: w.world.z,
        });
      }
      return out;
    },
    getNpcStats() {
      let faculty = 0,
        flowTotal = 0,
        flowInteractive = 0,
        ambient = 0;
      for (const w of peopleSys.people) {
        if (w.kind === "puma" || w.kind === "faculty") faculty++;
        else if (w.kind === "flow") {
          flowTotal++;
          if (w.interactive) flowInteractive++;
        } else if (w.kind === "ambient") ambient++;
      }
      return { total: peopleSys.people.length, faculty, flowTotal, flowInteractive, ambient };
    },
    engageWalker(walkerIndex, lookX, lookZ, durationMs = 14000) {
      const w = peopleSys.people[walkerIndex];
      if (!w) return false;
      if (durationMs <= 0) {
        w.chatLookAt = null;
      } else {
        w.chatLookAt = { x: lookX, z: lookZ, until: performance.now() + durationMs };
      }
      dirty = true;
      return true;
    },
    getWalkerPortrait(walkerIndex) {
      const w = peopleSys.people[walkerIndex];
      return w ? portrait(w) : null;
    },
    // 2026-10-24：外掛（角色）接手鏡頭前，停掉站方進行中的鏡頭飛行與居民追隨，避免兩邊同時移動鏡頭
    onFrame(fn) {
      frameHooks.add(fn);
      return () => frameHooks.delete(fn);
    },
    releaseCamera() {
      fly = null;
      if (selectedWalker !== null) clearWalker();
      if (selectedSkyCraft) clearSkyCraft();
    },
    home,
    startTour,
    stopTour,
    setTime(m) {
      setPanel("day");
      dayMinutes = m;
      updateDay();
      dirty = true;
    },
    peopleCloseup() {
      const c = centers.get("civil");
      const target = new THREE.Vector3(c.x - 0.9, top + 0.2, c.z + 1.9);
      fly = null;
      camera.position.copy(target.clone().add(new THREE.Vector3(1.4, 1.15, 2.3)));
      controls.target.copy(target);
      controls.update();
      showBadgesForce = true;
      dirty = true;
    },
    horizonView() {
      fly = null;
      controls.maxPolarAngle = THREE.MathUtils.degToRad(80);
      controls.minPolarAngle = THREE.MathUtils.degToRad(60);
      controls.target.copy(cityCenter).add(new THREE.Vector3(0, 3.0, -10));
      camera.position.copy(cityCenter.clone().add(new THREE.Vector3(4, 5.2, 24)));
      controls.update();
      dirty = true;
    },
    openLog() {
      setToggle("log", true);
    },
    getLogStats() {
      return window.__htlLog?.getStats?.() || null;
    },
    selectSkyCraft,
    getSkyCatalog: () => env.skyFleet?.catalog || [],
    seekTour(seconds) {
      if (!tourActive) startTour();
      tourSeconds = Math.max(0, Math.min(78, seconds));
      tourPlaying = false;
      $("#tour-pause").textContent = tr("播放", "Play");
      updateTour(true);
      dirty = true;
    },
  };
  let showBadgesForce = false;
  // 2026-10-24：外掛（角色）的每幀更新改由這裡呼叫，排在鏡頭控制與繪製之前；
  // 原本外掛自己用 requestAnimationFrame，會排在站方繪製之後，名牌與鏡頭比畫面晚一幀，移動時會抖動閃爍
  if (skyline) frameHooks.add((now) => !frozen && skyline.tick(now));
  // 鐘聲反應: nearby walkers look up at 朝陽鐘樓 (and hurry or wave), a few say 上課囉／下課囉, the avatar bows or
  // cheers, and a small sign over the belfry names the period
  {
    const bubbles = [];
    let towerSign = null;
    const say = (w, text) => {
      const el = document.createElement("span");
      el.className = "bell-bubble";
      el.textContent = text;
      const o = new CSS2DObject(el);
      scene.add(o);
      bubbles.push({ o, w, until: performance.now() + 3200 });
    };
    addEventListener("htl:clocktower", (e) => {
      const d = e.detail || {};
      if (d.x == null) return;
      const kind = d.kind === "start" ? "start" : d.kind === "end" ? "end" : "manual";
      const near = peopleSys.bellReact?.(kind === "manual" ? "end" : kind, d.x, d.z, { reduced: reduced.matches }) || [];
      if (kind !== "manual") {
        const text = kind === "start" ? tr("上課囉！", "Class time!") : tr("下課囉！", "Break time!");
        near.slice(0, 4).forEach((w, k) => setTimeout(() => say(w, text), 300 + k * 260));
        if (!towerSign) {
          const el = document.createElement("span");
          el.className = "bell-bubble bell-sign";
          towerSign = new CSS2DObject(el);
          scene.add(towerSign);
        }
        towerSign.element.textContent = tr(`第 ${d.period} 節${kind === "start" ? "上課" : "下課"}`, `Period ${d.period} ${kind === "start" ? "begins" : "ends"}`);
        towerSign.position.set(d.x, top + 3.45, d.z);
        towerSign.visible = true;
        towerSign.userData.until = performance.now() + 5000;
      }
      const av = window.heartIslandAvatar;
      if (av?.S?.drive && av.api?.triggerEmote) setTimeout(() => av.api.triggerEmote(kind === "start" ? "bow" : "cheer"), 600);
    });
    frameHooks.add((now) => {
      if (!bubbles.length && !towerSign?.visible) return false;
      for (let k = bubbles.length - 1; k >= 0; k--) {
        const b = bubbles[k];
        if (now > b.until || b.w._px == null) {
          scene.remove(b.o);
          b.o.element.remove();
          bubbles.splice(k, 1);
          continue;
        }
        b.o.position.set(b.w._px, top + 0.62, b.w._pz);
      }
      if (towerSign?.visible && now > towerSign.userData.until) towerSign.visible = false;
      return true;
    });
  }
  // 2026-10-25: adaptive resolution (busy laptop GPU, big retina window); the rules live in resolution.js.
  const prMax = renderer.getPixelRatio();
  const resolution = createResolutionGovernor(
    isMobileDevice
      ? { max: prMax, min: Math.min(prMax, 0.85), step: 0.15, settleMs: 1600, slowMs: 21, fastMs: 13.5, warmupMs: 1800 }
      : { max: prMax, min: Math.min(prMax, 1) },
  );
  function adaptResolution(now, frameMs) {
    const next = resolution.sample(now, frameMs, document.hidden);
    if (next === null) return;
    renderer.setPixelRatio(next);
    resize();
    dirty = true;
  }
  const _animDir = new THREE.Vector3(),
    _animDelta = new THREE.Vector3(),
    _animSkyTgt = new THREE.Vector3(),
    _projTmp = new THREE.Vector3();
  const _nameCand = [],
    _nameKept = [];
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      lastTime = performance.now();
      dirty = true;
    }
  });
  function animate(now) {
    requestAnimationFrame(animate);
    if (document.hidden && !debug) {
      lastTime = now;
      return;
    }
    if (!debug) adaptResolution(now, now - lastTime);
    for (const f of frameHooks) {
      try {
        if (f(now)) dirty = true;
      } catch (e) {
        console.warn("frame hook", e);
        frameHooks.delete(f);
      }
    }
    const dt = Math.min(0.08, (now - lastTime) / 1000);
    lastTime = now;
    fpsFrames++;
    if (now - fpsStart > 1200) {
      fps = Math.round((fpsFrames * 1000) / (now - fpsStart));
      fpsFrames = 0;
      fpsStart = now;
    }
    if (mapCam.tick(dt)) dirty = true;
    if (fly) {
      zoomTargetDist = null;
      const t = Math.min(1, (now - fly.time) / 800),
        v = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      camera.position.lerpVectors(fly.from, fly.to, v);
      controls.target.lerpVectors(fly.old, fly.target, v);
      if (t === 1) fly = null;
      dirty = true;
    } else if (zoomTargetDist !== null) {
      const curDist = camera.position.distanceTo(controls.target),
        diff = zoomTargetDist - curDist;
      if (Math.abs(diff) < 0.04) {
        setCameraDistanceImmediate(zoomTargetDist);
        zoomTargetDist = null;
      } else {
        const nextDist = curDist + diff * Math.min(1, dt * 14);
        _animDir.copy(camera.position).sub(controls.target);
        if (_animDir.lengthSq() < 1e-6) _animDir.set(0.24, 0.33, 0.87);
        _animDir.normalize().multiplyScalar(nextDist);
        camera.position.copy(controls.target).add(_animDir);
        dirty = true;
      }
    }
    // the city clock runs on its own (about 2.4 minutes per day); 暫停 freezes it with everything else
    if (dayPlaying && !frozen && !tourActive) {
      const before = Math.floor(dayMinutes);
      dayMinutes = (dayMinutes + dt * 10) % 1440;
      if (Math.floor(dayMinutes) !== before) updateDay(true);
    }
    if (tourActive && tourPlaying) {
      tourSeconds = Math.min(78, tourSeconds + dt);
      updateTour();
      if (tourSeconds === 78) {
        tourPlaying = false;
        $("#tour-pause").textContent = tr("播放", "Play");
      }
    }
    if (!reduced.matches && !frozen) {
      motionTime += dt;
      // chevrons crawl toward the end of each route
      if (!reduced.matches) for (const p of flowPaths) if (p.mesh.visible) p.mesh.material.map.offset.x = -motionTime * 0.6;
      peopleSys.setFilter(selectedFlows.size ? selectedFlows : null);
      peopleSys.update(dt, motionTime, true, zoomFactor());
      env.update(dt, true);
      if (typeof tickLog === "function") tickLog(dt);
      dirty = true;
    } else if (env.skyFleet?.isAnimating?.()) {
      env.update(dt, false);
      dirty = true;
    }
    const camDist = camera.position.distanceTo(controls.target);
    syncZoomUI(camDist);
    labelRenderer.domElement.classList.toggle("compact", camDist > 24);
    document.body.classList.toggle("zoomed", camDist < 22);
    const lodOn = camDist < 26;
    landmarkSignGroup.visible = false;
    landmarkPinGroup.visible = !tourActive;
    if (skyline) {
      // city pins only in wide views or when the camera looks at the harbour; never over a close-up of the campus
      let nearHarbour = false;
      for (const e of skyline.entries.values()) if (Math.hypot(controls.target.x - e.x, controls.target.z - e.z) < 7) nearHarbour = true;
      const show = !tourActive && !selectedLandmark && (nearHarbour || (camDist >= 16 && (!selectedIsland || camDist >= 20)));
      if (skyline.pinGroup.visible !== show) {
        skyline.pinGroup.visible = show;
        for (const e of skyline.entries.values()) if (e.pinEl) setStyle(e.pinEl, "display", show ? "" : "none");
      }
    }
    for (const [lid, v] of landmarkPinViews) {
      // 20 landmarks: the wide view shows only the hero pins (朝陽鐘樓、有鳳來儀); the campus artworks appear when the
      // camera comes close or their island is selected
      const vis = !tourActive && (selectedLandmark ? lid === selectedLandmark : selectedIsland ? v.island === selectedIsland || (v.hero && camDist >= 20) : v.hero || camDist < 14);
      v.label.visible = vis;
      v.line.visible = vis;
      if (v.bead) v.bead.visible = vis;
      v.el.classList.toggle("is-hidden", !vis);
      setStyle(v.el, "display", vis ? "" : "none");
    }
    signGroup.visible = camDist > 4.8 && camDist < 28 && !tourActive;
    if (signGroup.visible) {
      for (const m of signGroup.children) {
        const itemId = m.userData.item;
        if (itemId) {
          m.visible =
            !pinViews.has(itemId) &&
            (!selectedIsland || buildings.get(itemId)?.island === selectedIsland) &&
            m.position.distanceToSquared(camera.position) > (m.visible ? 12.96 : 16.0);
        }
      }
    }
    for (const m of staticMeshes) if (m.userData.lod && m.visible !== lodOn) m.visible = lodOn;
    for (const o of routeTags) o.visible = selectedIsland === "diplomacy" || selectedFlows.has("F5") || selectedFlows.has("F15");
    for (const [n, b] of beams.entries()) b.rotation.y = motionTime * 0.6 + n * 1.3;
    for (const f of ferries) {
      const t = (motionTime * 0.035 + f.phase) % 1,
        u = t < 0.5 ? t * 2 : 2 - t * 2; // out then back
      const sx = f.r.start[0],
        sz = f.r.start[1],
        ex = f.r.end[0],
        ez = f.r.end[1];
      const tt = 0.04 + u * 0.92;
      const [px, pz] = bez(f.r, tt),
        [qx, qz] = bez(f.r, Math.min(1, tt + 0.01));
      f.g.position.x = px;
      f.g.position.z = pz;
      f.g.rotation.y = Math.atan2(qx - px, qz - pz) + (t < 0.5 ? 0 : Math.PI);
      f.crate.visible = t >= 0.5; // returns carrying cargo
    }
    peopleSys.setBadges(badgesOn && (showBadgesForce || camDist < 16), selectedIsland);
    if (selectedWalker !== null && peopleSys.people[selectedWalker]?.world) {
      const w = peopleSys.people[selectedWalker];
      if (!fly && !reduced.matches && !frozen && followAnchor) {
        // gently follow the selected resident
        _animDelta.copy(w.world).sub(followAnchor);
        controls.target.add(_animDelta);
        camera.position.add(_animDelta);
      }
      if (!followAnchor) followAnchor = w.world.clone();
      else followAnchor.copy(w.world);
      selRing.position.set(w.world.x, w.world.y + 0.012, w.world.z);
      selRing.scale.setScalar((w.drawScale || 0.8) / 0.8);
    }
    if (selectedSkyCraft && env.skyFleet) {
      const curSkyTarget = env.skyFleet.getLookTarget(selectedSkyCraft, _animSkyTgt);
      if (!fly && skyFollowAnchor) {
        _animDelta.copy(curSkyTarget).sub(skyFollowAnchor);
        const dSq = _animDelta.lengthSq();
        if (dSq > 1e-9 && dSq < 4.0) {
          controls.target.add(_animDelta);
          camera.position.add(_animDelta);
          dirty = true;
        } else if (dSq >= 4.0) {
          flyToSkyCraft(selectedSkyCraft);
        }
      }
      if (!skyFollowAnchor) skyFollowAnchor = curSkyTarget.clone();
      else skyFollowAnchor.copy(curSkyTarget);
    }
    updatePumaExtra(now);
    const namesNow = (showNames || showBadgesForce) && camDist < 14;
    {
      _nameCand.length = 0;
      _nameKept.length = 0;
      for (let pi = 0; pi < nameTags.length; pi++) {
        const o = nameTags[pi];
        const w = peopleSys.people[pi];
        const isPuma = w.kind === "puma" || w.kind === "faculty" || w.kind === "lord";
        const vis = isPuma ? !!w.world && camDist < 26 && !tourActive : namesNow && w.world && (w.kind !== "flow" || !selectedFlows.size || selectedFlows.has(w.flow)) && w.world.distanceToSquared(controls.target) < 20.25;
        o.visible = false;
        if (!vis) continue;
        if (w.kind === "puma" || w.kind === "faculty") {
          const stop = w.waiting ? `${String(islands.get(w.atIsland).number).padStart(2, "0")} ${english ? txt(islands.get(w.atIsland).name) : shortNames[w.atIsland]}` : "";
          if (o.userData.stop !== stop) {
            o.userData.stop = stop;
            const stopEl = o.userData.stopEl ?? (o.userData.stopEl = o.element.querySelector(".stop"));
            if (stopEl) stopEl.textContent = stop ? tr("開講 ", "at ") + stop : "";
            o.element.classList.toggle("talking", !!stop);
          }
        }
        o.position.set(w.world.x, w.world.y + 0.5 * (w.drawScale || 0.8), w.world.z);
        const sp = _projTmp.copy(o.position).project(camera);
        const pri = (w.kind === "puma" ? -240 : isPuma ? -200 : 0) + (pi === selectedWalker ? -150 : 0) + (w.kind === "flow" ? 0 : 10) + sp.z - (o.userData.wasShown ? 5 : 0);
        _nameCand.push({ o, x: ((sp.x + 1) / 2) * innerWidth, y: ((1 - sp.y) / 2) * innerHeight, pri, wd: w.kind === "flow" ? 170 : isPuma ? 140 : 90 });
      }
      _nameCand.sort((a, b) => a.pri - b.pri);
      for (let i = 0; i < _nameCand.length; i++) {
        const c = _nameCand[i];
        let hit = false;
        for (let j = 0; j < _nameKept.length; j++) {
          const k = _nameKept[j];
          if (Math.abs(k.y - c.y) < 40 && Math.abs(k.x - c.x) < (k.wd + c.wd) / 2 + 10) {
            hit = true;
            break;
          }
        }
        if (hit) continue;
        _nameKept.push(c);
        c.o.visible = true;
      }
      for (let i = 0; i < _nameCand.length; i++) {
        const c = _nameCand[i];
        c.o.userData.wasShown = c.o.visible;
      }
    }

    controls.update();
    if (mapCam.clamp()) {
      controls.update();
      dirty = true;
    }
    mapCam.updateFog(scene, camera.position.distanceTo(controls.target));
    env.cullClouds?.(camera);
    if (dirty) {
      const sp = env.sun.position;
      const shSig = `${sp.x.toFixed(2)},${sp.y.toFixed(2)},${sp.z.toFixed(2)}|${lodOn}`;
      if (shSig !== shadowSig) {
        shadowSig = shSig;
        renderer.shadowMap.needsUpdate = true;
      }
      if (fx) fx.render(debugCam || camera);
      else renderer.render(scene, debugCam || camera);
      if (selectedFlows.size || showAllFlows) {
        const ac = renderer.autoClear;
        renderer.autoClear = false;
        renderer.render(routeScene, debugCam || camera);
        renderer.autoClear = ac;
      }
      labelRenderer.render(scene, camera);
      // Label collision checks measure every label (write → read → forced layout, ~120 per frame when zoomed in).
      // Run them about 8×/s, or at once when the shown labels, the selection or the layout change.
      // 跑得快的裝置（上次 < 3ms）每幀都檢查，標籤跟著鏡頭移動時才不會先壓到介面、隔一下才消失（看起來像閃一下）
      const sig = labelSignature();
      const sigChanged = sig !== clipSig;
      const clipInterval = isMobileDevice ? 160 : 120;
      if ((!isMobileDevice && clipCost < 3) || now - lastClip > clipInterval || sigChanged) {
        const t0 = performance.now();
        clipLabels(sigChanged);
        clipCost = clipCost * 0.7 + (performance.now() - t0) * 0.3;
        lastClip = now;
        clipSig = sig;
      }
      dirty = false;
    }
  }
  // ---------- mobile chrome: time panel / layers bar on demand, 3-stage bottom sheets ----------
  const isMobile = () => innerWidth <= 800;
  const setMobPanel = (which) => {
    for (const k of ["time"]) {
      const on = which === k && !document.body.classList.contains("m-" + k);
      if (on && isMobile()) {
        $("#card").hidden = true;
        document.body.classList.remove("card-open");
        $("#sidebar").classList.remove("mobile-open");
        $("#sidebar-toggle")?.setAttribute("aria-pressed", "false");
        if (toggleState.log) setToggle("log", false);
        window.heartIslandAvatar?.api?.close?.();
      }
      document.body.classList.toggle("m-" + k, on);
      $("#mob-" + k)?.setAttribute("aria-pressed", String(on));
    }
    dirty = true;
  };
  $("#mob-time").onclick = () => setMobPanel("time");
  const sheet = $("#sidebar");
  $("#sheet-handle").onclick = () => sheet.classList.toggle("full");
  const logEl = $("#log");
  if ($("#log-handle")) $("#log-handle").onclick = () => logEl.classList.toggle("full");

  function bindSheetSwipe(container, getScrollEl, { isFull, setFull, close }) {
    let y0 = null,
      x0 = null,
      s0 = 0,
      inHeader = false;
    container.addEventListener(
      "touchstart",
      (e) => {
        if (e.touches.length !== 1 || !isMobile()) return;
        const t = e.target;
        if (t.closest?.("input, select, textarea, a")) return;
        y0 = e.touches[0].clientY;
        x0 = e.touches[0].clientX;
        const sc = getScrollEl();
        s0 = sc ? sc.scrollTop : 0;
        inHeader = !!t.closest?.(".sheet-handle, .side-head, .card-head, .log-head");
      },
      { passive: true },
    );
    container.addEventListener(
      "touchend",
      (e) => {
        if (y0 === null) return;
        const dy = e.changedTouches[0].clientY - y0;
        const dx = e.changedTouches[0].clientX - x0;
        y0 = null;
        if (Math.abs(dx) > Math.abs(dy) * 1.2) return;
        const sc = getScrollEl();
        const atTop = !sc || (s0 <= 2 && sc.scrollTop <= 2);
        if (inHeader) {
          if (dy < -28) setFull(true);
          else if (dy > 28) isFull() ? setFull(false) : close();
        } else if (atTop && dy > 48) {
          isFull() ? setFull(false) : close();
        }
      },
      { passive: true },
    );
  }

  // phone detail card: two sizes — half/peek height (map stays visible) or full screen; the choice sticks
  {
    const card = $("#card");
    const szBtn = $("#card-size");
    const setCardFull = (full) => {
      cardFull = full;
      card.classList.toggle("full", full);
      $("#card-handle").setAttribute("aria-expanded", String(full));
      if (szBtn) {
        szBtn.setAttribute("aria-pressed", String(full));
        szBtn.textContent = full ? tr("收合", "Collapse") : tr("展開", "Expand");
      }
      dirty = true;
    };
    window.__setCardFull = setCardFull;
    $("#card-handle").onclick = () => setCardFull(!cardFull);
    if (szBtn) szBtn.onclick = () => setCardFull(!cardFull);
    bindSheetSwipe(card, () => $("#card-content"), {
      isFull: () => cardFull,
      setFull: setCardFull,
      close: () => $("#card-close").click(),
    });
    setCardFull(false);
  }
  bindSheetSwipe(sheet, () => $("#tree"), {
    isFull: () => sheet.classList.contains("full"),
    setFull: (f) => sheet.classList.toggle("full", f),
    close: () => {
      sheet.classList.remove("mobile-open");
      $("#sidebar-toggle")?.setAttribute("aria-pressed", "false");
    },
  });
  if (logEl) {
    bindSheetSwipe(
      logEl,
      () => (!$("#overview-panel").hidden ? $("#overview-panel") : $("#log-list")),
      {
        isFull: () => logEl.classList.contains("full"),
        setFull: (f) => logEl.classList.toggle("full", f),
        close: () => setToggle("log", false),
      },
    );
  }
  new MutationObserver(() => {
    const isOpen = sheet.classList.contains("mobile-open");
    if (!isOpen && sheet.classList.contains("full")) sheet.classList.remove("full");
    if (isMobile()) $("#sidebar-toggle")?.setAttribute("aria-pressed", String(isOpen));
  }).observe(sheet, { attributes: true, attributeFilter: ["class"] });
  const syncBrand = () => {
    const br = document.querySelector(".brand");
    if (!br || !br.offsetParent) return;
    const r = br.getBoundingClientRect(),
      st = document.documentElement.style;
    const mobAct = document.querySelector(".mob-top-actions");
    let bottomEdge = r.bottom;
    if (mobAct && mobAct.offsetParent) {
      const mr = mobAct.getBoundingClientRect();
      st.setProperty("--mob-actions-w", Math.round(mr.width) + "px");
      bottomEdge = Math.max(bottomEdge, mr.bottom);
    }
    st.setProperty("--brand-bottom", Math.round(bottomEdge) + "px");
    st.setProperty("--brand-left", Math.round(r.left) + "px");
    st.setProperty("--brand-w", Math.round(r.width) + "px");
    // right-hand button group: its left edge & bottom bound the top bar (add-ons such as 「我的角色」 and 「護照」 widen it)
    const tb = document.querySelector("nav.toolbar");
    if (tb && tb.offsetParent) {
      const tr2 = tb.getBoundingClientRect();
      st.setProperty("--toolbar-left", Math.round(tr2.left) + "px");
      st.setProperty("--toolbar-bottom", Math.round(tr2.bottom) + "px");
    }
    const hud = document.querySelector("#hud");
    if (hud && hud.offsetParent) {
      st.setProperty("--hud-bottom", Math.round(hud.getBoundingClientRect().bottom) + "px");
    }
  };
  syncBrand();
  addEventListener("resize", syncBrand);
  {
    const br = document.querySelector(".brand");
    if (br) new ResizeObserver(syncBrand).observe(br, { box: "border-box" });
    const mobAct = document.querySelector(".mob-top-actions");
    if (mobAct) {
      new ResizeObserver(syncBrand).observe(mobAct, { box: "border-box" });
      new MutationObserver(() => requestAnimationFrame(syncBrand)).observe(mobAct, { childList: true, subtree: true });
    }
    const tb = document.querySelector("nav.toolbar");
    if (tb) {
      new ResizeObserver(syncBrand).observe(tb, { box: "border-box" });
      new MutationObserver(() => requestAnimationFrame(syncBrand)).observe(tb, { childList: true, subtree: true });
    }
    const hud = document.querySelector("#hud");
    if (hud) new ResizeObserver(syncBrand).observe(hud, { box: "border-box" });
    new MutationObserver(() => requestAnimationFrame(syncBrand)).observe(document.body, { attributes: true, attributeFilter: ["class"] });
  }
  // touch screens: fire the tap on touchend ourselves. Mobile browsers sometimes spend the first tap on an emulated
  // :hover (or lose it when the label under the finger moves a pixel, or when a second thumb is holding the RPG joystick).
  if (!matchMedia("(hover: hover) and (pointer: fine)").matches) {
    const touchMap = new Map();
    document.addEventListener(
      "touchstart",
      (e) => {
        for (const t of e.changedTouches) {
          const el = t.target.closest?.("button, summary, a.tb-link, .cpro-cmd-row, .hx-cell");
          if (el && !el.dataset?.instantTouch) {
            touchMap.set(t.identifier, { el, x: t.clientX, y: t.clientY, t: performance.now() });
          } else {
            touchMap.delete(t.identifier);
          }
        }
      },
      { passive: true, capture: true },
    );
    document.addEventListener(
      "touchmove",
      (e) => {
        for (const t of e.changedTouches) {
          const s = touchMap.get(t.identifier);
          if (s && Math.hypot(t.clientX - s.x, t.clientY - s.y) > 16) touchMap.delete(t.identifier);
        }
      },
      { passive: true, capture: true },
    );
    document.addEventListener(
      "touchend",
      (e) => {
        for (const p of e.changedTouches) {
          const s = touchMap.get(p.identifier);
          touchMap.delete(p.identifier);
          if (!s || !e.cancelable || s.el.disabled || !s.el.isConnected) continue;
          if (Math.hypot(p.clientX - s.x, p.clientY - s.y) > 16 || performance.now() - s.t > 750) continue;
          e.preventDefault(); // suppress the emulated hover/click pair; we deliver exactly one click immediately
          s.el.click();
        }
      },
      { passive: false, capture: true },
    );
    document.addEventListener("touchcancel", () => touchMap.clear(), { passive: true, capture: true });
  }
  document.fonts?.ready?.then(syncBrand);
  resize();
  camera.position.copy(overviewPosition());
  controls.target.copy(overviewTarget());
  controls.update();
  updateDay();
  updateWalkers();
  // 2026-11-13: sharper textures at grazing angles (banners, signs, ground) — sampler setting only, no extra draws.
  {
    const maxAniso = Math.min(8, renderer.capabilities.getMaxAnisotropy?.() || 1);
    const seenTex = new Set();
    scene.traverse((o) => {
      const mats = o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : null;
      if (!mats) return;
      for (const m of mats) {
        if (!m) continue;
        for (const key of ["map", "emissiveMap", "alphaMap"]) {
          const t = m[key];
          if (t && !seenTex.has(t) && t.anisotropy < maxAniso) {
            seenTex.add(t);
            t.anisotropy = maxAniso;
            t.needsUpdate = true;
          }
        }
      }
    });
  }
  // rendering polish (fx.js). 2026-11-13: started before the reveal and awaited (bounded) below, so its passes
  // (N8AO ambient occlusion, bloom, SMAA) compile behind the loading crest. It used to start after the reveal and
  // its first frame froze the page for ~3–5 s while those shaders linked — same picture, now without the stall.
  const fxReady = createFX(THREE, { renderer, scene, camera, env, quality, params, debug, english, onChange: () => (dirty = true) })
    .then((f) => {
      fx = f;
      fx.setSize();
      dirty = true;
      return f;
    })
    .catch((e) => (console.warn("fx", e), null));
  // 2026-11-13: compile every shader while the loading crest is still on screen. Without this the first frame
  // compiled ~all programs synchronously and froze the page for 1–4 s right after it appeared (worst on phones).
  // compileAsync uses KHR_parallel_shader_compile where available; capped so a slow driver never blocks start-up.
  // one palette sweep over everything built so far (plain materials only; kit parts were toned when created)
  if (!debug) applyPalette(scene);
  if (!debug && typeof renderer.compileAsync === "function") {
    try {
      await Promise.race([renderer.compileAsync(scene, camera), new Promise((r) => setTimeout(r, 6000))]);
    } catch (e) {
      console.warn("compileAsync", e);
    }
    await Promise.race([fxReady, new Promise((r) => setTimeout(r, 8000))]);
    // one warm-up draw behind the loader (through the post chain when it is on): uploads geometry/textures, links
    // the remaining programs and builds the shadow map, so the first frame the visitor actually sees is not the slow one
    try {
      if (fx) fx.render(camera);
      else renderer.render(scene, camera);
    } catch {}
  }
  $("#loading").hidden = true;
  // time panel removed (2026-10-15): the clock always runs unless the viewer pauses or prefers reduced motion
  dayPlaying = !reduced.matches && params.get("clock") !== "stop";
  // ?time=0..1439 opens at that minute of the day (e.g. ?time=1260 for the night view)
  const startMinute = Number(params.get("time"));
  if (params.has("time") && startMinute >= 0 && startMinute < 1440) {
    dayMinutes = startMinute;
    updateDay();
  }
  requestAnimationFrame(animate);
  const focusAliases = { overview: "civil", philosophy: "institute", faculty: "welfare", admin: "civil", "curriculum-std": "education", graduation: "card", "curriculum-map": "transport", facilities: "water", qunxian: "family", "elite-internship": "sport", regulations: "forest", career: "renewal", "luxury-butler": "luxury", "micro-credit": "luxury", d808: "innovation", "smart-tech": "innovation", sustainability: "esg", clocktower: "landmark:clocktower", landmarks: "landmark:clocktower", ...ART_ALIASES };
  const rawFocus = params.get("focus") || params.get("p");
  const focus = focusAliases[rawFocus] || rawFocus;
  if (params.get("credits") === "1") {
    showCredits();
  } else if (params.get("sky")) {
    selectSkyCraft(params.get("sky"), { summonIfHidden: true });
  } else if (params.get("teacher")) {
    selectTeacher(params.get("teacher"));
  } else if (focus) {
    if (LANDMARKS.has(focus)) selectLandmark(focus);
    else if (buildings.has(focus)) selectBuilding(focus);
    else {
      const i = D.islands.find((i) => i.id === focus || txt(i.name).includes(focus) || i.name.zh.includes(focus));
      if (i) selectIsland(i.id, { silent: true });
    }
  } else if (params.get("drive") !== "1") {
    let seen = false;
    try {
      seen = localStorage.getItem("heart-city-onboarded") === "1";
    } catch {}
    if (!seen) showIntro();
  }
} catch (error) {
  console.error(error);
  $("#loading").innerHTML =
    `<div class="loading-crest"><img class="loading-logo" src="./assets/nkuht_htl_logo.png" alt="系徽" width="68" height="68"><h2><span class="nw">國立高雄餐旅大學</span>・<span class="nw">旅館管理系</span></h2><p>${tr("城市載入失敗，請重新整理頁面。", "The city could not load. Please reload the page.")}</p><p style="font-size:12px;opacity:.75">${esc(error.message)}</p><button type="button" id="loading-reload" style="margin-top:12px;padding:9px 20px;border-radius:999px;border:1px solid #ecc056;background:#ecc056;color:#14251e;font-weight:800;cursor:pointer">${tr("重新整理 ↻", "Reload ↻")}</button></div>`;
  document.getElementById("loading-reload")?.addEventListener("click", () => location.reload());
}

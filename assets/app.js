// Turns NKUHT Department of Hotel Management (hotel.nkuht.edu.tw) curriculum, internship, and
// resource data into an interactive 4-year learning & career navigator with full Chinese / English UI & Neural Voice support.

const MAP_URL = "https://hotel.nkuht.edu.tw/";
let english = new URLSearchParams(location.search).get("lang") === "en";
const tr = (zhStr, enStr) => (english ? enStr : zhStr);
const txt = (v) => (typeof v === "string" ? v : (english ? v?.en || v?.zh : v?.zh || v?.en) || "");
const zh = (v) => (typeof v === "string" ? v : v?.zh || "");
const en = (v) => (typeof v === "string" ? v : v?.en || v?.zh || "");

document.addEventListener(
  "error",
  (e) => {
    const img = e.target;
    if (!img || img.tagName !== "IMG" || img.dataset.fbApplied) return;
    img.dataset.fbApplied = "1";
    img.src = "assets/nkuht_htl_logo.png";
    img.style.objectFit = "contain";
  },
  true
);

const PASSPORT_KEY = "htl-passport:v1";
const PASSPORT_STARS = [0, 160, 480, 960, 1600];
const PASSPORT_TITLES = [
  ["一星旅人・餐旅新鮮人", "1-Star Traveller · Freshman"],
  ["二星旅人・群賢見習生", "2-Star Traveller · Qunxian Trainee"],
  ["三星旅人・三明治實習生", "3-Star Explorer · Sandwich Intern"],
  ["四星旅人・1+3 認證達人", "4-Star Explorer · 1+3 Certified"],
  ["五星領航員・菁英實習儲備幹部", "5-Star Navigator · Elite 3.0 Trainee"],
];

function loadPassport() {
  const base = {
    v: 1,
    xp: 0,
    islands: [],
    items: [],
    flows: [],
    teachers: [],
    voices: [],
    checkins: [],
    counters: { source: 0, search: 0, avatar: 0, night: 0, topWin: 0 },
    badges: {},
    chapters: {},
    daily: { day: "", target: "", done: false, streak: 0, last: "" },
    quizPassed: false,
    bestQuizScore: 0,
    certName: "",
  };
  try {
    const raw = JSON.parse(localStorage.getItem(PASSPORT_KEY) || "null");
    if (!raw || typeof raw !== "object") return base;
    return {
      ...base,
      ...raw,
      islands: Array.isArray(raw.islands) ? [...raw.islands] : [],
      items: Array.isArray(raw.items) ? [...raw.items] : [],
      flows: Array.isArray(raw.flows) ? [...raw.flows] : [],
      teachers: Array.isArray(raw.teachers) ? [...raw.teachers] : [],
      voices: Array.isArray(raw.voices) ? [...raw.voices] : [],
      checkins: Array.isArray(raw.checkins) ? [...raw.checkins] : [],
      counters: { ...base.counters, ...(raw.counters || {}) },
      badges: { ...(raw.badges || {}) },
      chapters: { ...(raw.chapters || {}) },
      daily: { ...base.daily, ...(raw.daily || {}) },
    };
  } catch {
    return base;
  }
}

function savePassport(P) {
  try {
    localStorage.setItem(PASSPORT_KEY, JSON.stringify(P));
  } catch {}
}

function getPassportStar(xp = 0) {
  let s = 1;
  for (let i = 0; i < PASSPORT_STARS.length; i++) {
    if (xp >= PASSPORT_STARS[i]) s = i + 1;
  }
  return s;
}

function recordPolicyPassport(p, opts = {}) {
  const P = loadPassport();
  let gained = 0;
  const islId = p?.island?.id;
  if (islId && !P.islands.includes(islId)) {
    P.islands.push(islId);
    gained += 40;
  }
  if (p?.id && !P.items.includes(p.id)) {
    P.items.push(p.id);
    gained += 10;
  }
  const tv = p?.id ? TEACHER_VOICE_MAP[p.id] : null;
  if (tv?.id && !P.teachers.includes(tv.id)) {
    P.teachers.push(tv.id);
    gained += 25;
  }
  if (opts.voice && tv?.id && !P.voices.includes(tv.id)) {
    P.voices.push(tv.id);
    gained += 15;
  }
  if (opts.source) {
    if (!P.counters.source) gained += 10;
    P.counters.source = (P.counters.source || 0) + 1;
  }
  if (gained > 0 || opts.source) {
    P.xp = (P.xp || 0) + gained;
    savePassport(P);
  }
  return { gained, P };
}

const TEACHER_VOICE_MAP = {
  "welfare-elder": {
    id: "hsieh-wc",
    gender: "male",
    photo: "assets/teachers/hsieh-wc.jpg",
    zhAudio: "assets/voices/hsieh-wc-zh.mp3?v=20261110-16",
    enAudio: "assets/voices/hsieh-wc-en.mp3?v=20261110-16",
    zhLabel: "🔊 中文擬真男聲（謝文欽主任）",
    enLabel: "🔊 English Male Voice (Chair Hsieh)",
    zhIntro: "大家好，我是國立高雄餐旅大學旅館管理系副教授兼系主任兼學務長，謝文欽。我的專長領域為旅館服務業管理、旅館行銷管理與賭場管理。歡迎來到高餐大旅館管理系 3D 學習與職涯導覽島！",
    enIntro: "Hello everyone! I am Wen-Chin Hsieh, Associate Professor, Department Chair, and Dean of Student Affairs in the Department of Hotel Management at NKUHT. Welcome to our 3D Hotel Management Island!",
  },
  "welfare-respite": {
    id: "yang-jt",
    gender: "male",
    photo: "assets/teachers/yang-jt.svg",
    zhAudio: "assets/voices/yang-jt-zh.mp3?v=20261110-16",
    enAudio: "assets/voices/yang-jt-en.mp3?v=20261110-16",
    zhLabel: "🔊 中文擬真男聲（楊仁德教授）",
    enLabel: "🔊 English Male Voice (Prof. Yang)",
    zhIntro: "同學好，我是旅館管理系專任教授，楊仁德。我的專長涵蓋知識經濟與管理、管理心理學、組織行為、策略管理與服務業管理，陪伴大家奠定扎實的理論與實務基礎。",
    enIntro: "Greetings! I am Professor Jen-Te Yang in the Department of Hotel Management. My expertise spans knowledge economy, managerial psychology, organizational behavior, strategic management, and service management.",
  },
  "welfare-home": {
    id: "sha-c",
    gender: "male",
    photo: "assets/teachers/sha-c.jpg",
    zhAudio: "assets/voices/sha-c-zh.mp3?v=20261110-16",
    enAudio: "assets/voices/sha-c-en.mp3?v=20261110-16",
    zhLabel: "🔊 中文擬真男聲（沙荃老師）",
    enLabel: "🔊 English Male Voice (Dr. Roger Sha)",
    zhIntro: "大家好，我是旅館管理系助理教授級專技人員，沙荃。我的專長為旅館管理、人力資源與組織行為，並長期指導全國技能競賽旅館接待選手，歡迎同學一起挑戰自我！",
    enIntro: "Hello! I am Dr. Roger Sha, Assistant Professor (Specialist Track) in the Department of Hotel Management. My specialties include hotel management, human resources, and organizational behavior.",
  },
  "welfare-hourly": {
    id: "hsieh-jl",
    gender: "female",
    photo: "assets/teachers/hsieh-jl.jpg",
    zhAudio: "assets/voices/hsieh-jl-zh.mp3?v=20261110-16",
    enAudio: "assets/voices/hsieh-jl-en.mp3?v=20261110-16",
    zhLabel: "🔊 中文擬真女聲（謝家黎副教授）",
    enLabel: "🔊 English Female Voice (Assoc. Prof. Hsieh)",
    zhIntro: "大家好，我是旅館管理系專任副教授，謝家黎。我的專長領域為人力資源管理、客務實務與國際禮儀，帶領大家認識國際商務禮儀與星級客務接待。",
    enIntro: "Hello everyone! I am Associate Professor Amber Hsieh in the Department of Hotel Management. I specialize in human resource management, front office practice, and international etiquette.",
  },
  "welfare-care": {
    id: "huang-cy",
    gender: "male",
    photo: "assets/teachers/huang-cy.jpg",
    zhAudio: "assets/voices/huang-cy-zh.mp3?v=20261110-16",
    enAudio: "assets/voices/huang-cy-en.mp3?v=20261110-16",
    zhLabel: "🔊 中文擬真男聲（黃啟揚老師）",
    enLabel: "🔊 English Male Voice (Asst. Prof. Huang)",
    zhIntro: "嗨，大家好！我是旅館管理系專任助理教授，黃啟揚。我的專長是旅館資訊管理、旅館行銷管理與餐廳管理，歡迎跟著我一起認識這些領域！",
    enIntro: "Hi everyone! I am Assistant Professor Chi-Yang Huang in the Department of Hotel Management. My expertise covers hotel information management, hotel marketing management, and restaurant management.",
  },
  "welfare-shingles": {
    id: "yu-mf",
    gender: "female",
    photo: "assets/teachers/yu-mf.jpg",
    zhAudio: "assets/voices/yu-mf-zh.mp3?v=20261110-16",
    enAudio: "assets/voices/yu-mf-en.mp3?v=20261110-16",
    zhLabel: "🔊 中文擬真女聲（游明鳳老師）",
    enLabel: "🔊 English Female Voice (Asst. Prof. Yu)",
    zhIntro: "各位同學好，我是旅館管理系專任助理教授，游明鳳。我的專長領域為旅館採購與旅館財務管理，歡迎同學一起認識旅館的採購與財務管理。",
    enIntro: "Hello students! I am Assistant Professor Sally Yu in the Department of Hotel Management. I specialize in hotel purchasing and hotel financial management.",
  },
  "welfare-counsel": {
    id: "hsieh-cl",
    gender: "male",
    photo: "assets/teachers/hsieh-cl.jpg",
    zhAudio: "assets/voices/hsieh-cl-zh.mp3?v=20261110-16",
    enAudio: "assets/voices/hsieh-cl-en.mp3?v=20261110-16",
    zhLabel: "🔊 中文擬真男聲（謝金龍老師）",
    enLabel: "🔊 English Male Voice (Asst. Prof. Benson Hsieh)",
    zhIntro: "大家好，我是旅館管理系助理教授兼實習輔導組長，謝金龍。我的專長是旅館客務管理與旅館行銷管理。第三學年的校外實習與菁英實習計畫 3.0 都會由我們陪伴同學順利銜接產業！",
    enIntro: "Hello! I am Assistant Professor Benson Hsieh, Head of Internship Guidance in the Department of Hotel Management, supporting students across our 24 Elite Internship 3.0 partner hotels.",
  },
  "welfare-work": {
    id: "hsu-mj",
    gender: "male",
    photo: "assets/teachers/hsu-mj.jpg",
    zhAudio: "assets/voices/hsu-mj-zh.mp3?v=20261110-16",
    enAudio: "assets/voices/hsu-mj-en.mp3?v=20261110-16",
    zhLabel: "🔊 中文擬真男聲（許孟鈞老師）",
    enLabel: "🔊 English Male Voice (Dr. Jacques Hsu)",
    zhIntro: "大家好，我是旅館管理系助理教授兼校務策略研究組長，許孟鈞。我的專長涵蓋雲端科技應用、資訊管理、知識管理、電子商務、餐旅資訊系統與數位行銷！",
    enIntro: "Hello everyone! I am Dr. Jacques Hsu, Assistant Professor and Head of Institutional Strategy Research. My expertise spans cloud technology, information management, e-commerce, hospitality information systems, and digital marketing.",
  },
  "welfare-vaccine": {
    id: "chang-hc",
    gender: "female",
    photo: "assets/teachers/chang-hc.jpg",
    zhAudio: "assets/voices/chang-hc-zh.mp3?v=20261110-16",
    enAudio: "assets/voices/chang-hc-en.mp3?v=20261110-16",
    zhLabel: "🔊 中文擬真女聲（張慧貞老師）",
    enLabel: "🔊 English Female Voice (Asst. Prof. Winnie Chang)",
    zhIntro: "同學好，我是旅館管理系專案助理教授，張慧貞。我的專長包括旅館會計學、旅館財務管理、會議管理與客務實務，很高興在旅館島上與大家見面！",
    enIntro: "Hello! I am Project Assistant Professor Winnie Chang in the Department of Hotel Management. My expertise includes hotel accounting, financial management, meeting management, and front office practice.",
  },
  "welfare-child": {
    id: "lo-sk",
    gender: "female",
    photo: "assets/teachers/lo-sk.jpg",
    zhAudio: "assets/voices/lo-sk-zh.mp3?v=20261110-16",
    enAudio: "assets/voices/lo-sk-en.mp3?v=20261110-16",
    zhLabel: "🔊 中文擬真女聲（盧小琴老師）",
    enLabel: "🔊 English Female Voice (Dr. Jamie Lo)",
    zhIntro: "大家好，我是旅館管理系專案助理教授，盧小琴。我的研究與教學專長涵蓋餐飲管理、消費者行為、觀光發展、餐旅教育與餐旅產業管理！",
    enIntro: "Hello everyone! I am Dr. Jamie Lo, Project Assistant Professor in the Department of Hotel Management. My expertise covers food and beverage management, consumer behavior, tourism development, and hospitality education.",
  },
};

const query = (params) => Object.entries(params).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join("&");
const SHARE_TARGETS = [
  { label: "Threads", href: (url, text) => `https://www.threads.com/intent/post?${query({ text, url })}` },
  { label: "LINE", href: (url, text) => `https://social-plugins.line.me/lineit/share?${query({ url, text })}` },
  { label: "Facebook", href: (url) => `https://www.facebook.com/sharer/sharer.php?${query({ u: url })}` },
];
const FACEBOOK_SHARE = false;
if (!FACEBOOK_SHARE && !new URLSearchParams(location.search).has("fb")) {
  SHARE_TARGETS.splice(SHARE_TARGETS.findIndex((t) => t.label === "Facebook"), 1);
}
const nativeShare = !!navigator.share && matchMedia("(pointer: coarse)").matches;
const SHARE_MENU = false;
const showMenu = SHARE_MENU || new URLSearchParams(location.search).has("menu");

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {}
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.readOnly = true;
  ta.style.cssText = "position:fixed;top:0;left:0;opacity:0";
  document.body.append(ta);
  ta.select();
  ta.setSelectionRange(0, text.length);
  let ok = false;
  try {
    ok = document.execCommand("copy");
  } catch {}
  ta.remove();
  return ok;
}

const count = (path) => window.goatcounter?.count?.({ path, event: true });
const countPolicy = (name, id) => {
  count(`${name}/${id}`);
  count(name);
};
const sharedId = new URLSearchParams(location.search).get("p");
if (sharedId) {
  const countShared = () => {
    const canonical = document.querySelector('link[rel="canonical"]').href;
    window.goatcounter.count({ path: new URL(`p/${encodeURIComponent(sharedId)}/`, canonical).pathname });
    count("shared");
  };
  if (window.goatcounter?.count) countShared();
  else document.getElementById("goatcounter")?.addEventListener("load", countShared);
}
document.addEventListener("click", (e) => {
  const el = e.target.closest("[data-count]");
  if (!el) return;
  if (el.dataset.policy) countPolicy(el.dataset.count, el.dataset.policy);
  else count(el.dataset.count);
});

let toastTimer;
function toast(message) {
  const el = $("#toast");
  el.textContent = message;
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), 3500);
}

// NKUHT · Hospitality 五大教育核心指標（官網教育理念・特色目標）
const HEART_BI = {
  H: { zh: "服務精神", en: "Service Ethics" },
  E: { zh: "專業整合", en: "Integrated Expertise" },
  A: { zh: "旅館軟硬體", en: "Hotel Systems" },
  R: { zh: "理論實務並重", en: "Theory & Practice" },
  T: { zh: "精通外語", en: "Foreign Languages" },
};
const heartLetter = (h) => `<span class="heart-l" data-h="${esc(h)}">✦</span>`;
const islandNo = (n) => String(n).padStart(2, "0");
const heartBadge = (h) => `<span class="heart-b" data-h="${esc(h)}"><b>NKUHT</b>${esc(txt(HEART_BI[h]) || "")}</span>`;

function getGroups() {
  return [
    { id: "term", label: tr("依官網標示學年", "By Official Academic Year") },
    { id: "whole", label: tr("未標示學年", "Core Curriculum & Faculty") },
  ];
}
function getBuckets() {
  return [
    {
      id: "short",
      group: "term",
      title: tr("第一、二學年", "Years 1–2"),
      sub: tr("官網標示於第二學年的項目（實習前一年度選才、日文選修）", "Items scheduled in Year 2 (pre-internship selection, Japanese elective)"),
    },
    {
      id: "mid",
      group: "term",
      title: tr("第三學年", "Year 3"),
      sub: tr("校外實習（一）（二），各 10 學分（115 學年度課程標準表）", "Off-Campus Internship I & II, 10 credits each (AY 115 Curriculum)"),
    },
    {
      id: "long",
      group: "term",
      title: tr("第四學年與畢業後", "Year 4 & Beyond"),
      sub: tr("進階／高階旅館英日文、畢業條件配套措施、就業與升學", "Advanced hotel English/Japanese, 1+3 graduation support, career & graduate study"),
    },
    {
      id: "direction",
      group: "whole",
      title: tr("未標示學年", "Core Curriculum, Faculty & Facilities"),
      sub: tr("官網未指定學年的系所制度、課程、師資與資源", "Department history, 10 faculty members, Qunxian Hotel, and partner hotels"),
    },
    {
      id: "other",
      group: "whole",
      title: tr("其他階段", "Other Stages"),
      sub: tr("其他時程標記", "Additional timeline markers"),
    },
  ];
}
const HASH_ALIASES = { y2027: "short", y2028: "short", y2029: "mid", y2030: "mid", y2031: "long", none: "direction" };

function getStages() {
  return {
    "m8-18": { buckets: ["short"], when: tr("第二學年", "Year 2"), at: 3 },
    "year3-4": { buckets: ["mid"], when: tr("第三學年", "Year 3"), at: 7 },
    "year5-8": { buckets: ["long"], when: tr("第四學年／畢業後", "Year 4 / Post-Grad"), at: 9 },
  };
}

const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
const esc = (v) =>
  String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

function splitLabel(label, n) {
  if (n < 2) return null;
  for (const sep of [/；/, /[；、;]/]) {
    const parts = label.split(sep).map((s) => s.trim()).filter(Boolean);
    if (parts.length === n) return parts;
  }
  return null;
}

function build(D) {
  const STAGES = getStages();
  const sources = new Map(D.sources.map((s) => [s.id, s]));
  const policies = [];
  for (const isl of D.islands) {
    for (const b of isl.buildings) {
      const label = txt(b.phase?.label);
      const stages = b.phase?.stages || [];
      const parts = splitLabel(label, stages.length);
      const placements = new Map();
      const add = (bucket, step) => {
        if (!placements.has(bucket)) placements.set(bucket, []);
        placements.get(bucket).push(step);
      };
      if (!stages.length) add("direction", null);
      stages.forEach((st, n) => {
        const def = STAGES[st];
        const step = { when: def ? def.when : st, at: def?.at ?? 99, text: parts ? parts[n] : label };
        for (const bucket of def?.buckets || ["other"]) add(bucket, step);
      });
      const srcList = (b.sources || []).map((id) => sources.get(id)).filter((s) => s && s.url);
      const src = srcList[0];
      policies.push({
        id: b.id,
        name: txt(b.name),
        desc: txt(b.plain),
        who: txt(b.who),
        facts: (b.facts || []).map(txt).filter(Boolean),
        label,
        splitShown: !!parts,
        island: isl,
        islandName: txt(isl.name),
        heart: isl.heart || [],
        sources: srcList.map((s) => ({ url: s.url, title: txt(s.title) || tr("系網專區", "Official Page") })),
        sourceUrl: src?.url || isl.url || MAP_URL,
        sourceTitle: txt(src?.title) || tr("系網專區", "Official Page"),
        mapUrl: `./?focus=${encodeURIComponent(b.id)}${english ? "&lang=en" : ""}`,
        standaloneUrl: `p/${encodeURIComponent(b.id)}/${english ? "?lang=en" : ""}`,
        placements,
        haystack: [
          b.name?.zh,
          b.name?.en,
          b.plain?.zh,
          b.plain?.en,
          b.who?.zh,
          b.who?.en,
          b.phase?.label?.zh,
          b.phase?.label?.en,
          isl.name?.zh,
          isl.name?.en,
          ...(b.facts || []).flatMap((f) => [zh(f), en(f)]),
        ]
          .join(" ")
          .toLowerCase(),
      });
    }
  }
  return policies;
}

const state = { q: "", heart: new Set(), island: new Set(), p: "", unseen: false };
function readState() {
  const p = new URLSearchParams(location.search);
  state.q = p.get("q") || "";
  state.heart = new Set((p.get("heart") || "").split(",").filter(Boolean));
  state.island = new Set((p.get("island") || "").split(",").filter(Boolean));
  state.p = p.get("p") || "";
  english = p.get("lang") === "en";
}
function writeState() {
  const p = new URLSearchParams();
  if (english) p.set("lang", "en");
  if (state.p && !state.q && !state.heart.size && !state.island.size) p.set("p", state.p);
  if (state.q) p.set("q", state.q);
  if (state.heart.size) p.set("heart", [...state.heart].join(","));
  if (state.island.size) p.set("island", [...state.island].join(","));
  const qs = p.toString();
  history.replaceState(null, "", (qs ? `?${qs}` : location.pathname) + location.hash);
}

// Multi-token weighted & subsequence fuzzy matcher (inspired by krisk/Fuse Apache-2.0)
function fuzzyTokenHit(hay, tok) {
  if (!tok) return 1;
  if (hay.includes(tok)) return 2;
  if (tok.length < 3) return 0;
  let hi = 0;
  for (let ti = 0; ti < tok.length; ti++) {
    hi = hay.indexOf(tok[ti], hi);
    if (hi === -1) return 0;
    hi++;
  }
  return 1;
}

function queryScore(p, rawQ) {
  const q = (rawQ || "").trim().toLowerCase();
  if (!q) return 1;
  const tokens = q.split(/[\s,，、・/]+/).filter(Boolean);
  if (!tokens.length) return 1;
  const titleHay = `${p.name || ""} ${p.islandName || ""}`.toLowerCase();
  let total = 0;
  for (const tok of tokens) {
    const tHit = fuzzyTokenHit(titleHay, tok);
    const bHit = tHit ? tHit : fuzzyTokenHit(p.haystack, tok);
    if (!bHit) return 0;
    total += tHit ? tHit * 3 : bHit;
  }
  return total;
}

function matches(p) {
  if (state.unseen && loadPassport().items.includes(p.id)) return false;
  if (state.island.size && !state.island.has(p.island.id)) return false;
  if (state.heart.size && !p.heart.some((h) => state.heart.has(h))) return false;
  if (state.q && queryScore(p, state.q) <= 0) return false;
  return true;
}

const shareUrl = (p) => new URL(`p/${encodeURIComponent(p.id)}/${english ? "?lang=en" : ""}`, location.href).href;
const shareText = (p) =>
  [
    tr(`高餐大旅館管理系：「${p.name}」`, `NKUHT Hotel Management: "${p.name}"`),
    p.desc,
    "",
    tr("點入看更多系所課程、菁英實習與職涯亮點 — 高餐大旅館管理系 島嶼導覽器", "Explore curriculum, Elite Internship 3.0 & faculty — NKUHT HTL Island Navigator"),
  ]
    .filter((line, i) => i !== 1 || line)
    .join("\n");

function teacherVoiceHtml(p) {
  const tv = TEACHER_VOICE_MAP[p.id];
  if (!tv) return "";
  const defaultSrc = english ? tv.enAudio : tv.zhAudio;
  const defaultIntro = english ? tv.enIntro : tv.zhIntro;
  return `<div class="tl-voice-box" data-tv-id="${esc(p.id)}">
    <div class="tl-vb-top">
      <img class="tl-vb-photo" src="${esc(tv.photo)}" alt="${esc(p.name)}">
      <div class="tl-vb-meta">
        <b>🎙️ ${esc(tr("師長擬真人聲導覽（中／英切換）", "Lifelike Neural Voice Guide (ZH / EN)"))}</b>
        <p class="tl-vb-intro">${english ? `“${esc(defaultIntro)}”` : `「${esc(defaultIntro)}」`}</p>
      </div>
    </div>
    <div class="tl-vb-btns">
      <button type="button" class="tl-vb-btn${!english ? " active" : ""}" data-tl-voice="${esc(p.id)}" data-tl-lang="zh">${esc(tv.zhLabel)}</button>
      <button type="button" class="tl-vb-btn${english ? " active" : ""}" data-tl-voice="${esc(p.id)}" data-tl-lang="en">${esc(tv.enLabel)}</button>
    </div>
    <audio controls preload="none" class="tl-vb-audio" src="${esc(defaultSrc)}"></audio>
  </div>`;
}

function card(p, bucketId) {
  const steps = p.placements.get(bucketId).filter(Boolean);
  const stepsHtml = steps.length
    ? `<ul class="steps">${steps.map((s) => `<li>${s.when ? `<span class="when">${esc(s.when)}</span>` : ""}${esc(s.text)}</li>`).join("")}</ul>`
    : "";
  const full = p.splitShown ? `<p class="who">${esc(tr("完整規劃：", "Full schedule: "))}${esc(p.label)}</p>` : "";
  const facts = p.facts.length
    ? `<details open><summary>${esc(tr("重點細節", "Key Details"))}</summary><ul>${p.facts.map((f) => `<li>${esc(f)}</li>`).join("")}</ul></details>`
    : "";
  const url = shareUrl(p);
  const share = !showMenu
    ? `<button type="button" class="share-copy" data-share="${esc(p.id)}">${esc(tr("複製並分享", "Copy & Share"))}</button>`
    : `<details class="share">
      <summary>${esc(tr("分享", "Share"))}</summary>
      <div class="share-menu">
        ${SHARE_TARGETS.map((t) => `<a href="${esc(t.href(url, shareText(p)))}" target="_blank" rel="noopener">${t.label}</a>`).join("")}
        <button type="button" data-copy="${esc(p.id)}">${esc(tr("複製連結", "Copy Link"))}</button>
        ${nativeShare ? `<button type="button" data-native="${esc(p.id)}">${esc(tr("其他…", "More…"))}</button>` : ""}
      </div>
    </details>`;
  const isCollected = loadPassport().items.includes(p.id);
  const collectBtn = `<button type="button" class="tl-collect-btn${isCollected ? " done" : ""}" data-tl-collect="${esc(p.id)}">${esc(isCollected ? tr("✓ 已蓋章收藏", "✓ Stamped") : tr("🛂 蓋章收藏 +10 XP", "🛂 Stamp +10 XP"))}</button>`;
  return `<article class="card${isCollected ? " collected" : ""}" data-id="${esc(p.id)}">
    <div class="tag"><span>${islandNo(p.island.number)} ${esc(p.islandName)}</span><span class="heart">${p.heart.map(heartBadge).join("")}</span></div>
    <h3>${esc(p.name)}</h3>
    ${teacherVoiceHtml(p)}
    ${stepsHtml}
    ${p.desc ? `<p class="desc">${esc(p.desc)}</p>` : ""}
    ${p.who ? `<p class="who">${esc(tr("適用對象：", "Target: "))}${esc(p.who)}</p>` : ""}
    ${full}
    ${facts}
    <div class="links">
      <a href="${esc(p.mapUrl)}" data-count="visit" data-policy="${esc(p.id)}" title="${esc(tr(`在 3D 旅館島開啟「${p.name}」`, `Open "${p.name}" in 3D Hotel Island`))}">${esc(tr("在 3D 旅館島開啟 ↗", "Open in 3D Island ↗"))}</a>
      <a href="${esc(p.standaloneUrl)}" target="_blank" rel="noopener" title="${esc(tr(`在新分頁開啟「${p.name}」獨立真實資料專頁`, `Open "${p.name}" standalone data page`))}">${esc(tr("📄 獨立資料頁 ↗", "📄 Data Page ↗"))}</a>
      ${(p.sources && p.sources.length ? p.sources : [{ url: p.sourceUrl, title: p.sourceTitle }]).map((s) => `<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.title)} ↗</a>`).join("")}
      ${collectBtn}
      ${share}
    </div>
  </article>`;
}

function renderPassportBar(policies) {
  const bar = $("#tl-passport-bar");
  if (!bar) return;
  const P = loadPassport();
  const n = getPassportStar(P.xp);
  const lo = PASSPORT_STARS[n - 1];
  const hi = PASSPORT_STARS[n] ?? null;
  const pct = hi ? Math.min(100, Math.round(((P.xp - lo) / (hi - lo)) * 100)) : 100;
  const title = tr(...PASSPORT_TITLES[n - 1]);
  const totalItems = policies.length || 133;
  const totalIslands = new Set(policies.map((p) => p.island.id)).size || 20;
  const collectedCount = policies.filter((p) => P.items.includes(p.id)).length;
  const unseenCount = Math.max(0, totalItems - collectedCount);
  const passportHref = english ? "./?passport=1&lang=en" : "./?passport=1";

  bar.innerHTML = `<div class="tl-pb-inner">
    <div class="tl-pb-left">
      <span class="tl-pb-badge">🛂 ISLAND PASSPORT</span>
      <div class="tl-pb-meta">
        <div class="tl-pb-stars"><b>${"★".repeat(n)}<span>${"★".repeat(5 - n)}</span></b> <strong>${esc(title)}</strong></div>
        <div class="tl-pb-xp-row">
          <div class="tl-pb-xp-track"><i style="width:${pct}%"></i></div>
          <small>${P.xp} XP · ${esc(
            tr(
              `已蓋章 ${P.islands.length}/${totalIslands} 島 · 已收藏 ${collectedCount}/${totalItems} 細項 · 已拜訪 ${P.teachers.length}/10 師長`,
              `Stamped ${P.islands.length}/${totalIslands} Islands · Collected ${collectedCount}/${totalItems} Items · ${P.teachers.length}/10 Faculty`
            )
          )}</small>
        </div>
      </div>
    </div>
    <div class="tl-pb-actions">
      <button type="button" class="tl-pb-filter${state.unseen ? " active" : ""}" data-tl-unseen aria-pressed="${state.unseen}">
        ${esc(
          state.unseen
            ? tr(`✨ 顯示全部細項 (${totalItems})`, `✨ Show All Items (${totalItems})`)
            : tr(`✨ 僅看未收藏細項 (${unseenCount})`, `✨ Uncollected Only (${unseenCount})`)
        )}
      </button>
      <a class="tl-pb-open" href="${esc(passportHref)}">${esc(tr("🛂 開啟 3D 學習護照 ↗", "🛂 Open 3D Passport ↗"))}</a>
    </div>
  </div>`;
}

function render(policies) {
  renderPassportBar(policies);
  const GROUPS = getGroups();
  const BUCKETS = getBuckets();
  const shown = policies.filter(matches);
  const start = (p, id) => Math.min(...p.placements.get(id).map((s) => s?.at ?? 99));
  const byBucket = BUCKETS.map((b) => ({
    ...b,
    items: shown.filter((p) => p.placements.has(b.id)).sort((x, y) => (state.q ? queryScore(y, state.q) - queryScore(x, state.q) : 0) || start(x, b.id) - start(y, b.id)),
  }));
  const max = Math.max(1, ...byBucket.map((b) => b.items.length));

  $("#summary").innerHTML = GROUPS.map((g) => {
    const tiles = byBucket
      .filter((b) => b.group === g.id && (b.id !== "other" || b.items.length))
      .map(
        (b) => `<a href="#${b.id}" class="${b.items.length ? "" : "empty"}">
          <b>${b.items.length}</b>${esc(b.title)}
          <div class="bar" style="width:${(b.items.length / max) * 100}%"></div></a>`
      )
      .join("");
    return `<div class="sum-group"><span class="sum-label">${esc(g.label)}</span><div class="sum-tiles">${tiles}</div></div>`;
  }).join("");

  $("#timeline").innerHTML =
    byBucket
      .filter((b) => b.items.length)
      .map(
        (b) => `<section class="bucket" id="${b.id}">
          <h2>${esc(b.title)}<small>${esc(b.sub)} · ${b.items.length} ${esc(tr("項", "items"))}</small></h2>
          <div class="cards">${b.items.map((p) => card(p, b.id)).join("")}</div>
        </section>`
      )
      .join("") || `<p class="no-match">${esc(tr("沒有符合條件的項目。", "No matching items found."))}</p>`;
}

function chips(el, items, set, rerender, available = () => true) {
  el.innerHTML = "";
  const all = document.createElement("button");
  all.textContent = tr("全部", "All");
  el.append(all);
  const buttons = items.map(({ value, label, heart, num }) => {
    const btn = document.createElement("button");
    if (heart) {
      btn.dataset.h = heart;
      btn.innerHTML = `${heartLetter(heart)} ${esc(label)}`;
    } else if (num) btn.innerHTML = `<span class="num">${islandNo(num)}</span> ${esc(label)}`;
    else btn.textContent = label;
    btn.onclick = () => {
      set.has(value) ? set.delete(value) : set.add(value);
      rerender();
    };
    el.append(btn);
    return [value, btn];
  });
  all.onclick = () => {
    set.clear();
    rerender();
  };
  return () => {
    all.setAttribute("aria-pressed", String(!set.size));
    for (const [value, btn] of buttons) {
      btn.setAttribute("aria-pressed", String(set.has(value)));
      btn.disabled = !set.has(value) && !available(value);
    }
  };
}

function applyStaticLang(D, policies, sync) {
  document.documentElement.lang = english ? "en" : "zh-Hant-TW";
  document.title = english
    ? "NKUHT Hotel Management 2D Timeline & Card Overview"
    : "高餐大旅館管理系 2D 時間軸與卡片總覽｜NKUHT HTL Island Navigator";
  $$("[data-zh][data-en]").forEach((el) => {
    el.innerHTML = english ? el.dataset.en : el.dataset.zh;
  });
  const qEl = $("#q");
  if (qEl) {
    qEl.placeholder = english
      ? "Search courses, partner hotels (Mandarin Oriental, InterContinental, W Taipei, Fleur de Chine), certificates, faculty…"
      : "搜尋課程、實習飯店（如文華東方、勤美洲際、W飯店、雲品）、證照、師資、關鍵字…";
  }
  const langBtn = $("#tl-lang-btn");
  if (langBtn) langBtn.textContent = english ? "🌐 中文 / EN" : "🌐 EN / 中文";
  const cta3d = $("#tl-3d-cta");
  if (cta3d) cta3d.href = english ? "./?lang=en" : "./";
  const mob3d = $("#tl-mob-3d");
  if (mob3d) mob3d.href = english ? "./?lang=en" : "./";
  const mobDrive = $("#tl-mob-drive");
  if (mobDrive) mobDrive.href = english ? "./?drive=1&lang=en" : "./?drive=1";
  const mobPassport = $("#tl-mob-passport");
  if (mobPassport) mobPassport.href = english ? "./?passport=1&lang=en" : "./?passport=1";
  const day = (t) => (t ? new Date(t).toLocaleDateString(english ? "en-US" : "zh-TW") : "—");
  const checked = sync.checkedAt ? tr(` · 最後核對 ${day(sync.checkedAt)}`, ` · Checked ${day(sync.checkedAt)}`) : "";
  $("#meta").textContent = english
    ? `${D.islands.length} Theme Islands · ${policies.length} Highlights · Verified ${D.meta?.verifiedAt || "—"} · Updated ${day(sync.fetchedAt)}${checked}`
    : `${D.islands.length} 大主題島嶼 · ${policies.length} 個重點細項 · 系網資料基準日 ${D.meta?.verifiedAt || "—"} · 本站資料更新 ${day(sync.fetchedAt)}${checked}`;
}

async function main() {
  const [D, sync] = await Promise.all([
    fetch("data/policies.json?v=20261112-10", { cache: "no-store" }).then((r) => r.json()),
    fetch("data/sync.json?v=20261112-01", { cache: "no-store" }).then((r) => r.json()).catch(() => ({})),
  ]);
  readState();
  let policies = build(D);
  applyStaticLang(D, policies, sync);

  const linked = policies.find((p) => p.id === new URLSearchParams(location.search).get("p"));
  if (linked && !matches(linked)) {
    state.q = "";
    state.heart.clear();
    state.island.clear();
  }
  $("#q").value = state.q;
  const islandHeart = new Map(D.islands.map((i) => [i.id, i.heart || []]));
  const sharesHeart = (id) => !state.heart.size || (islandHeart.get(id) || []).some((h) => state.heart.has(h));
  let syncHeart, syncIsland;
  const rebuildChipsAndRender = () => {
    policies = build(D);
    applyStaticLang(D, policies, sync);
    syncHeart = chips(
      $("#heart-chips"),
      Object.entries(HEART_BI).map(([h, w]) => ({ value: h, label: txt(w), heart: h })),
      state.heart,
      rerender
    );
    syncIsland = chips(
      $("#island-chips"),
      D.islands.map((i) => ({ value: i.id, label: txt(i.name), num: i.number })),
      state.island,
      rerender,
      sharesHeart
    );
    rerender();
  };
  const rerender = () => {
    for (const id of state.island) if (!sharesHeart(id)) state.island.delete(id);
    syncHeart();
    syncIsland();
    writeState();
    render(policies);
  };
  rebuildChipsAndRender();

  const toggleLang = () => {
    english = !english;
    rebuildChipsAndRender();
  };
  if ($("#tl-lang-btn")) $("#tl-lang-btn").onclick = toggleLang;
  if ($("#tl-mob-lang")) $("#tl-mob-lang").onclick = toggleLang;

  // Handle passport bar filter and cross-tab sync
  $("#tl-passport-bar")?.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-tl-unseen]");
    if (!btn) return;
    state.unseen = !state.unseen;
    rerender();
  });
  window.addEventListener("storage", (e) => {
    if (e.key === PASSPORT_KEY) rerender();
  });

  // Handle in-card collect button, teacher voice playback, and source link passport stamping
  $("#timeline").addEventListener("click", (e) => {
    const cBtn = e.target.closest("[data-tl-collect]");
    if (cBtn) {
      const pid = cBtn.dataset.tlCollect;
      const p = policies.find((x) => x.id === pid);
      if (!p) return;
      const { gained } = recordPolicyPassport(p);
      if (gained > 0) {
        toast(
          tr(
            `🛎️ 已蓋章收入學習護照！「${p.name}」+${gained} XP`,
            `🛎️ Stamped into Island Passport! "${p.name}" +${gained} XP`
          )
        );
      } else {
        toast(
          tr(
            `✅ 「${p.name}」已在您的旅館島學習護照中`,
            `✅ "${p.name}" is already in your Island Passport`
          )
        );
      }
      rerender();
      return;
    }
    const extLink = e.target.closest(".links a");
    if (extLink) {
      const cardEl = extLink.closest(".card[data-id]");
      const p = cardEl ? policies.find((x) => x.id === cardEl.dataset.id) : null;
      if (p) {
        const { gained } = recordPolicyPassport(p, { source: extLink.target === "_blank" });
        if (gained > 0) renderPassportBar(policies);
      }
    }
  });
  $("#timeline").addEventListener(
    "play",
    (e) => {
      if (e.target.tagName !== "AUDIO") return;
      const cardEl = e.target.closest(".card[data-id]");
      const p = cardEl ? policies.find((x) => x.id === cardEl.dataset.id) : null;
      if (p) {
        const { gained } = recordPolicyPassport(p, { voice: true });
        if (gained > 0) {
          toast(
            tr(
              `🎙️ 聆聽師長擬真語音導覽！護照經驗值 +${gained} XP`,
              `🎙️ Listened to Faculty Voice Guide! Passport +${gained} XP`
            )
          );
          rerender();
        }
      }
    },
    true
  );

  // Handle in-card teacher voice language button clicks
  $("#timeline").addEventListener("click", (e) => {
    const vBtn = e.target.closest("[data-tl-voice]");
    if (!vBtn) return;
    const pid = vBtn.dataset.tlVoice;
    const lang = vBtn.dataset.tlLang;
    const tv = TEACHER_VOICE_MAP[pid];
    if (!tv) return;
    const box = vBtn.closest(".tl-voice-box");
    if (!box) return;
    box.querySelectorAll(".tl-vb-btn").forEach((b) => b.classList.toggle("active", b === vBtn));
    const introEl = box.querySelector(".tl-vb-intro");
    if (introEl) {
      introEl.textContent = lang === "en" ? `“${tv.enIntro}”` : `「${tv.zhIntro}」`;
    }
    const audioEl = box.querySelector("audio");
    if (audioEl) {
      const nextSrc = lang === "en" ? tv.enAudio : tv.zhAudio;
      if (audioEl.getAttribute("src") !== nextSrc) {
        audioEl.setAttribute("src", nextSrc);
      }
      audioEl.play().catch(() => {});
    }
  });

  $("#q").oninput = (e) => {
    const q = e.target.value.trim();
    if (q && !state.q) {
      state.heart.clear();
      state.island.clear();
    }
    state.q = q;
    rerender();
    const resultsTop = $(".top-band").offsetHeight;
    if (scrollY > resultsTop) window.scrollTo({ top: resultsTop });
  };
  const jumpToHash = () => {
    let id = location.hash.slice(1);
    if (!id) return;
    if (HASH_ALIASES[id]) {
      id = HASH_ALIASES[id];
      history.replaceState(null, "", `#${id}`);
    }
    requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView());
  };
  if (location.hash || linked) history.scrollRestoration = "manual";
  if (linked) {
    requestAnimationFrame(() => {
      const cards = document.querySelectorAll(`.card[data-id="${CSS.escape(linked.id)}"]`);
      cards[0]?.scrollIntoView({ block: "start" });
      for (const c of cards) c.classList.add("linked");
    });
  } else jumpToHash();
  addEventListener("hashchange", jumpToHash);

  const closeMenus = (except) => {
    for (const d of document.querySelectorAll("details.share[open]")) if (d !== except) d.open = false;
  };
  $("#timeline").addEventListener(
    "toggle",
    (e) => {
      if (!e.target.matches("details.share") || !e.target.open) return;
      closeMenus(e.target);
      const menu = e.target.querySelector(".share-menu");
      menu.classList.remove("flip");
      if (menu.getBoundingClientRect().right > document.documentElement.clientWidth - 8) menu.classList.add("flip");
    },
    true
  );
  document.addEventListener("click", (e) => closeMenus(e.target.closest("details.share")));
  document.addEventListener("keydown", (e) => {
    const open = document.querySelector("details.share[open]");
    if (e.key !== "Escape" || !open) return;
    open.open = false;
    open.querySelector("summary").focus();
  });
  $("#timeline").addEventListener("click", async (e) => {
    const item = e.target.closest(".share-menu a, .share-menu button");
    if (!item) return;
    const menu = item.closest("details");
    const p = policies.find((x) => x.id === (item.dataset.copy || item.dataset.native));
    if (item.dataset.native) {
      menu.open = false;
      try {
        await navigator.share({ title: p.name, text: shareText(p), url: shareUrl(p) });
      } catch {}
    } else if (item.dataset.copy) {
      item.textContent = (await copyText(shareUrl(p))) ? tr("已複製 ✓", "Copied ✓") : tr("複製失敗", "Failed");
      setTimeout(() => {
        item.textContent = tr("複製連結", "Copy Link");
        menu.open = false;
      }, 1200);
    } else menu.open = false;
  });

  $("#timeline").addEventListener("click", async (e) => {
    const btn = e.target.closest("button.share-copy");
    if (!btn) return;
    const p = policies.find((x) => x.id === btn.dataset.share);
    countPolicy("copy-share", p.id);
    if (await copyText(`${shareText(p)}
${shareUrl(p)}`)) {
      toast(tr("已複製！貼到 LINE、Threads 或任何地方分享吧", "Copied! Paste to share anywhere."));
      btn.textContent = tr("已複製 ✓", "Copied ✓");
      setTimeout(() => (btn.textContent = tr("複製並分享", "Copy & Share")), 2000);
    } else toast(tr("複製失敗，請改用瀏覽器開啟本頁再試一次", "Copy failed, please try again."));
  });
}

function backToTop() {
  const btn = $("#to-top");
  const reduce = matchMedia("(prefers-reduced-motion: reduce)");
  new IntersectionObserver(([entry]) => {
    const show = !entry.isIntersecting;
    btn.classList.toggle("show", show);
    btn.tabIndex = show ? 0 : -1;
    btn.setAttribute("aria-hidden", String(!show));
  }).observe($(".top-band"));
  btn.onclick = () => {
    window.scrollTo({ top: 0, behavior: reduce.matches ? "auto" : "smooth" });
    if (location.hash) history.replaceState(null, "", location.pathname + location.search);
  };
}

backToTop();
main().catch((err) => {
  console.error(err);
  $("#meta").textContent = tr("資料載入失敗。", "Failed to load data.");
});

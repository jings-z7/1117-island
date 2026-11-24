// NKUHT Department of Hotel Management — Concierge Pro Upgrade Suite
// 1. Global Concierge Quick-Jump Command Palette (Ctrl+K / ⌘K / /)
// 2. Interactive 1+3 Graduation Certificate Simulator (111+ AY Standard, 1140528 Approved)
// 3. Interactive 115 AY 128-Credit Curriculum & Elite Internship 3.0 Wishlist Planner
// 4. High-Resolution 1600×1120 Canvas PNG Honorary Certificate Generator
// Strictly grounded in https://shm.nkuht.edu.tw/p/412-1016-854.php?Lang=zh-tw & https://hotel.nkuht.edu.tw/?Lang=zh-tw

const SIM_KEY = "htl_sim_1plus3_v1";
const WISH_KEY = "htl_intern_wishlist_v1";

const isEn = () =>
  document.documentElement.lang === "en" || new URLSearchParams(location.search).get("lang") === "en";
const tr = (zh, en) => (isEn() ? en || zh : zh);
const txt = (v) => (typeof v === "string" ? v : isEn() ? v?.en || v?.zh || "" : v?.zh || v?.en || "");
const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

// Official 1+3 Graduation Standard (111+ AY applicable, passed by Academic Affairs Meeting 114.05.28)
// Source: https://hotel.nkuht.edu.tw/p/450-1018-38352,c0.php?Lang=zh-tw
const SIM_CAT_B = [
  { id: "b01", dom: "hosp", zh: "勞動部勞動力發展署餐飲服務丙級技術士", en: "MOL Level C Technician — Food & Beverage Service" },
  { id: "b02", dom: "hosp", zh: "勞動部勞動力發展署旅館客房服務丙級技術士", en: "MOL Level C Technician — Hotel Room Service" },
  { id: "b03", dom: "hosp", zh: "美國飯店業教育學院(AHLEI)一般課程證書(含職業證照 CGSP)", en: "AHLEI Course Certificate (incl. CGSP)" },
  { id: "b04", dom: "hosp", zh: "英國葡萄酒與烈酒教育基金會 WSET Level 1 證書", en: "WSET Level 1 Award in Wines / Spirits" },
  { id: "b05", dom: "hosp", zh: "國際專業調酒師 IBA 初級證書 (Foundation Course in Bartending)", en: "IBA Foundation Course in Bartending" },
  { id: "b06", dom: "hosp", zh: "美國國際侍酒師協會 ISG Wine Fundamentals I 證書", en: "ISG Wine Fundamentals Level I" },
  { id: "b07", dom: "ai", zh: "AI-900: Microsoft Azure AI Fundamentals 證照", en: "AI-900: Microsoft Azure AI Fundamentals" },
  { id: "b08", dom: "ai", zh: "PL-900: Microsoft Power Platform Fundamentals", en: "PL-900: Microsoft Power Platform Fundamentals" },
  { id: "b09", dom: "ai", zh: "SC-900: Microsoft Security, Compliance, Identity", en: "SC-900: Microsoft Security, Compliance, and Identity" },
  { id: "b10", dom: "hosp", zh: "北美教育學院「英式管家證照」", en: "British Butler Certificate (North America Institute)" },
  { id: "b11", dom: "ai", zh: "Google Ads Search Certification", en: "Google Ads Search Certification" },
  { id: "b12", dom: "ai", zh: "Google Analytics Certification", en: "Google Analytics Certification" },
  { id: "b13", dom: "ai", zh: "AI-powered performance ads certification", en: "Google AI-Powered Performance Ads Certification" },
  { id: "b14", dom: "ai", zh: "LINE 官方帳號專家認證", en: "LINE Official Account Expert Certification" },
  { id: "b15", dom: "lang", zh: "【外語】英語能力檢定相當於 TOEIC 700 分(含)以上", en: "[Language] English equivalent to TOEIC 700+" },
  { id: "b16", dom: "lang", zh: "【外語】日本語能力測驗 N3 級(含)以上", en: "[Language] JLPT N3 or above" },
  {
    id: "b17",
    dom: "remedy",
    zh: "【B類配套】丙級未過2次＋必修「房務實務與管理」及「餐飲實務」均達 80 分以上",
    en: "[Remedy] 2 attempts + Housekeeping & F&B Practice >= 80",
  },
  {
    id: "b18",
    dom: "remedy",
    zh: "【B類配套】TOEIC 700未過2次＋大四選修「進階旅館英文」及「高階旅館英文」及格",
    en: "[Remedy] 2 attempts + Senior Advanced & High-Level Hotel English passed",
  },
  {
    id: "b19",
    dom: "remedy",
    zh: "【B類配套】JLPT N3未過2次＋大四選修「進階旅館日文」及「高階旅館日文」及格",
    en: "[Remedy] 2 attempts + Senior Advanced & High-Level Hotel Japanese passed",
  },
];

const SIM_CAT_C = [
  { id: "c01", dom: "hosp", zh: "餐旅類相關乙級證照（國家證照）", en: "National Level B Hospitality Technician License" },
  { id: "c02", dom: "hosp", zh: "美國飯店業協會(AH&LA) CHS 證書", en: "AH&LA Certified Hospitality Supervisor (CHS)" },
  { id: "c03", dom: "lang", zh: "英語能力檢定相當於 TOEIC 850 分(含)以上", en: "English equivalent to TOEIC 850+" },
  { id: "c04", dom: "lang", zh: "日本語能力測驗 N2 級(含)以上", en: "JLPT N2 or above" },
  { id: "c05", dom: "hosp", zh: "英國葡萄酒與烈酒教育基金會 WSET Level 2", en: "WSET Level 2 Award" },
  { id: "c06", dom: "hosp", zh: "IBA 國際專業吧台調酒師(中階)證書", en: "IBA Intermediate Bartender Certificate" },
  { id: "c07", dom: "hosp", zh: "IBA 國際葡萄酒(Wine of the World)認證證書", en: "IBA Wine of the World Certificate" },
  { id: "c08", dom: "hosp", zh: "美國國際侍酒師協會 ISG Wine Fundamentals II 證書", en: "ISG Wine Fundamentals Level II" },
  { id: "c09", dom: "hosp", zh: "美國旅館暨住宿業協會(AHLEI)-餐旅部門培訓課程(CHDT)", en: "AHLEI Certified Hospitality Department Trainer (CHDT)" },
  { id: "c10", dom: "ai", zh: "PL-300: Microsoft Power BI Data Analyst", en: "PL-300: Microsoft Power BI Data Analyst" },
  { id: "c11", dom: "ai", zh: "PL-500: Microsoft Power Automate RPA Developer", en: "PL-500: Microsoft Power Automate RPA Developer" },
  { id: "c12", dom: "ai", zh: "AWS Certified AI Practitioner", en: "AWS Certified AI Practitioner" },
  { id: "c13", dom: "ai", zh: "PL-200: Microsoft Power Platform Functional Consultant", en: "PL-200: Microsoft Power Platform Functional Consultant" },
  {
    id: "c14",
    dom: "ai",
    zh: "Google Digital Marketing & E-commerce Professional Certificate",
    en: "Google Digital Marketing & E-commerce Professional Certificate",
  },
  { id: "c15", dom: "ai", zh: "LINE 企業解決方案大師認證", en: "LINE Enterprise Solution Master Certification" },
];

const HOTEL_BRAND_GROUP = {
  台北W飯店: "萬豪國際集團 Marriott",
  台北喜來登大飯店: "萬豪國際集團 Marriott / 寒舍",
  台北寒舍艾美酒店: "萬豪國際集團 Marriott / 寒舍",
  新竹豐邑喜來登大飯店: "萬豪國際集團 Marriott / 豐邑",
  台中李芳艾美酒店: "萬豪國際集團 Marriott",
  台中豐邑MOXY酒店: "萬豪國際集團 Marriott / 豐邑",
  然一酒店: "萬豪國際集團 The Luxury Collection",
  新北北海溫泉洲際酒店: "洲際酒店集團 IHG",
  臺中勤美洲際酒店: "洲際酒店集團 IHG",
  台南大員皇冠假日酒店: "洲際酒店集團 IHG",
  高雄中央公園英迪格酒店: "洲際酒店集團 IHG",
  台北遠東香格里拉: "香格里拉集團 Shangri-La",
  台南遠東香格里拉: "香格里拉集團 Shangri-La",
  台北君悅酒店: "凱悅酒店集團 Hyatt",
  臺北文華東方酒店: "文華東方酒店集團 Mandarin Oriental",
  臺北嘉佩樂酒店: "嘉佩樂酒店集團 Capella",
  "虹夕諾雅 谷關": "日本星野集團 Hoshino Resorts",
  台北漢來大飯店: "漢來美食／飯店事業群",
  高雄漢來大飯店: "漢來美食／飯店事業群",
  礁溪老爺酒店: "老爺酒店集團",
  礁溪寒沐酒店: "寒舍餐旅管理顧問",
  雲品溫泉酒店: "雲朗觀光集團",
  裕元花園酒店: "寶成國際集團",
  瑞穗天合國際觀光酒店: "天成飯店集團",
};

function loadJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? { ...fallback, ...JSON.parse(raw) } : { ...fallback };
  } catch {
    return { ...fallback };
  }
}
function saveJson(key, val) {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch {}
}

let simState = loadJson(SIM_KEY, { a: false, b: [], c: [], dom: "all", rewarded: false });
let wishList = (() => {
  try {
    const arr = JSON.parse(localStorage.getItem(WISH_KEY) || "[]");
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
})();

function saveWish() {
  try {
    localStorage.setItem(WISH_KEY, JSON.stringify(wishList));
  } catch {}
}

function evalSim(st = simState) {
  const bCount = (st.b || []).length;
  const cCount = (st.c || []).length;
  const eqB = bCount + cCount * 2;
  const ok = !!st.a && (bCount >= 2 || cCount >= 1);
  return { a: !!st.a, bCount, cCount, eqB, ok };
}

function getHtl() {
  return window.__htl || null;
}

function resolveHotelBuildingId(hotelName) {
  const htl = getHtl();
  if (!htl?.D?.islands) return "family-station";
  const sportIsl = htl.D.islands.find((i) => i.id === "sport");
  if (sportIsl?.buildings?.length) {
    const norm = hotelName.replace(/李芳/g, "李方").trim();
    const hit = sportIsl.buildings.find((b) => {
      const zh = (b.name?.zh || "").replace(/李芳/g, "李方");
      const en = b.name?.en || "";
      return zh.includes(norm) || norm.includes(zh) || (en && norm.toLowerCase().includes(en.toLowerCase()));
    });
    if (hit) return hit.id;
  }
  const EXPLICIT_HOTEL_MAP = [
    ["群賢", "family-station"],
    ["海外", "sport-h01"],
    ["國外", "sport-h01"],
    ["新加坡", "sport-h01"],
    ["日本", "sport-h01"],
    ["馬爾地夫", "sport-h01"],
    ["越南", "sport-h01"],
    ["文華東方", "sport-h02"],
    ["台北W", "sport-h03"],
    ["W Taipei", "sport-h03"],
    ["嘉佩樂", "sport-h04"],
    ["君悅", "sport-h05"],
    ["台北遠東香格里拉", "sport-h06"],
    ["台北喜來登", "sport-h07"],
    ["寒舍艾美", "sport-h08"],
    ["台北漢來", "sport-h09"],
    ["新竹豐邑喜來登", "sport-h10"],
    ["北海溫泉洲際", "sport-h11"],
    ["礁溪老爺", "sport-h12"],
    ["礁溪寒沐", "sport-h13"],
    ["勤美洲際", "sport-h14"],
    ["李芳艾美", "sport-h15"],
    ["李方艾美", "sport-h15"],
    ["雲品", "sport-h16"],
    ["虹夕諾雅", "sport-h17"],
    ["裕元花園", "sport-h18"],
    ["MOXY", "sport-h19"],
    ["台南遠東香格里拉", "sport-h20"],
    ["大員皇冠", "sport-h21"],
    ["然一", "sport-h22"],
    ["AMNIS", "sport-h22"],
    ["高雄漢來", "sport-h23"],
    ["英迪格", "sport-h24"],
    ["瑞穗天合", "sport-h25"],
  ];
  for (const [kw, id] of EXPLICIT_HOTEL_MAP) {
    if (hotelName.includes(kw)) return id;
  }
  if (/新加坡|日本|馬爾地夫|越南|海外|國外|Capella Singapore|Marina Bay|Prince|Hoshino/i.test(hotelName)) return "diplomacy-exchange";
  return "sport-h01";
}

function getAllBuildingsMap() {
  const map = new Map();
  const D = getHtl()?.D;
  if (!D?.islands) return map;
  for (const isl of D.islands) {
    for (const b of isl.buildings || []) {
      map.set(b.id, { ...b, islandObj: isl });
    }
  }
  return map;
}

// ============================================================================
// 1. Global Concierge Quick-Jump Command Palette (Ctrl+K / ⌘K / /)
// ============================================================================
let cmdBackdrop = null;
let cmdInput = null;
let cmdListEl = null;
let cmdTabsEl = null;
let cmdCat = "all";
let cmdSel = 0;
let cmdFiltered = [];

function buildCorpus() {
  const htl = getHtl();
  if (!htl?.D) return [];
  const rows = [];
  const D = htl.D;
  const OFFICIAL = htl.OFFICIAL || {};
  const FACULTY = htl.FACULTY || [];
  const bMap = getAllBuildingsMap();

  // Quick Concierge Actions
  rows.push(
    {
      cat: "act",
      ico: "🧮",
      title: tr("開啟「1+3 畢業證照門檻互動試算器」", "Open 1+3 Graduation Certificate Simulator"),
      sub: tr("依 1140528 教務會議通過標準表（A類 + 2張B類 或 1張C類）即時試算", "Check A + 2B or A + 1C official graduation eligibility"),
      kw: "1+3 證照 畢業條件 門檻 多益 TOEIC 丙級 WSET AI-900 simulator certificate",
      run: () => openPlannerModal("sim"),
    },
    {
      cat: "act",
      ico: "📚",
      title: tr("開啟「115 學年度 128 學分架構 ＆ 菁英實習志願收藏夾」", "Open 128-Credit Curriculum & Elite Internship Wishlist"),
      sub: tr("校訂36・院訂12・系訂必修55・系訂選修25＋24 家菁英實習合作旅館與群賢會館志願清單", "128-credit structure & wishlist of 24 partner hotels + Elite House"),
      kw: "128 學分 課程標準表 實習志願 選修 免修 菁英實習 3.0 wishlist credits",
      run: () => openPlannerModal("intern"),
    },
    {
      cat: "act",
      ico: "🗓️",
      title: tr("開啟「天空飛行器與熱氣球分時排程表」", "Open Scheduled Sky Banner Fleet & Hot Air Balloon Timetable"),
      sub: tr("單航道分時排程輪播：5 架拉布條專機、2 艘禮賓飛船與 8 顆熱氣球依時段登場，支援單機即時召喚", "Staggered sky timetable for 5 banner planes, 2 blimps & 8 balloons with instant dispatch"),
      kw: "飛機 飛行器 拉布條 飛船 飛艇 熱氣球 光雕 天空 排程 時刻表 sky schedule plane banner blimp balloon",
      run: () => openPlannerModal("sky"),
    },
    {
      cat: "act",
      ico: "🛂",
      title: tr("開啟「高餐大旅館島・學習護照與知識王挑戰」", "Open NKUHT Hotel Island Passport & Quiz"),
      sub: tr("查看五星進度、三明治四章節養成、知識王挑戰與結業證書下載", "View stars, 4-year storyline, quiz & HD PNG certificate"),
      kw: "護照 任務 知識王 證書 徽章 passport quest quiz certificate",
      run: () => window.__htlPassport?.open?.(),
    },
    {
      cat: "act",
      ico: "🗺️",
      title: tr("開啟「20 島軸向六角群島即時雷達導覽圖 (M)」", "Toggle 20-Island Hexagonal Archipelago Radar (M)"),
      sub: tr("即時追蹤玩家面向、10 位專任師長漫遊位置、任務島嶼與 20 島探索進度", "Live avatar/camera heading, 10 faculty positions, quest target & 20-island stamps"),
      kw: "雷達 地圖 小地圖 六角 20島 radar minimap hex map teleport",
      run: () => window.htlHexRadar?.toggle?.(true),
    },
    {
      cat: "act",
      ico: "🎬",
      title: tr("啟動 78 秒全島 3D 自動導覽", "Start 78-Second Guided 3D Island Tour"),
      sub: tr("自動巡航高餐大旅館管理系重點主題島與產學亮點", "Automated 3D fly-through across NKUHT Hotel Management"),
      kw: "導覽 自動播放 巡禮 tour autoplay fly",
      run: () => htl.startTour?.(),
    },
    {
      cat: "act",
      ico: "🌐",
      title: tr("切換中／英文雙語介面與擬真語音 (ZH ↔ EN)", "Switch Chinese / English UI & Neural Voice"),
      sub: tr("即時切換全站雙語介面與 10 位專任師長中英導覽語音", "Toggle bilingual interface & faculty neural voices"),
      kw: "英文 中文 語言 雙語 english chinese language switch",
      run: () => htl.switchSiteLanguage?.(),
    },
    {
      cat: "act",
      ico: "◫",
      title: tr("前往 2D 四年學習時間軸與卡片總覽 (timeline.html)", "Open 2D 4-Year Timeline & Card Directory"),
      sub: tr(`一頁瀏覽 ${D.islands.length} 座主題島嶼與 ${bMap.size} 個真實資料細項卡片`, `Browse all ${D.islands.length} themes & ${bMap.size} verified cards in 2D`),
      kw: "2d 時間軸 總覽 列表 timeline directory",
      run: () => {
        location.href = isEn() ? "./timeline.html?lang=en" : "./timeline.html";
      },
    }
  );

  // 10 HTL Faculty Members (strictly 旅館管理系專任(案)教師)
  const offFacByName = new Map((OFFICIAL.faculty || []).map((f) => [f.name, f]));
  for (const f of FACULTY) {
    const zhName = f.name?.zh || "";
    const off = offFacByName.get(zhName) || {};
    const specs = (off.specialties || []).join("、");
    const extDisp = off.extDisplay || (off.ext || []).join("、");
    const email = off.email || "";
    rows.push({
      cat: "faculty",
      ico: "👨‍🏫",
      title: `${txt(f.name)}｜${txt(f.role) || off.title || ""}`,
      sub: `${tr("分機", "Ext.")} ${extDisp} · ${email}${specs ? ` · ${specs}` : ""}`,
      extUrl: off.departmentProfileUrl || off.profileUrl || "https://shm.nkuht.edu.tw/p/412-1016-854.php?Lang=zh-tw",
      extLabel: tr("師資頁 ↗", "Profile ↗"),
      kw: `${zhName} ${f.name?.en || ""} ${off.title || ""} ${extDisp} ${email} ${specs} ${(off.courses || []).join(" ")} 老師 教授 主任`,
      run: () => htl.selectTeacher?.(f.id),
    });
  }

  // 1 + 24 Internship Hotels (校內群賢會館 + 菁英實習計畫 3.0 24 家合作旅館)
  const qxBldg = resolveHotelBuildingId("群賢會館");
  rows.push({
    cat: "hotel",
    ico: "🏛️",
    title: tr("群賢會館（校內實習旅館・12 間客房）", "Elite House / Qunxian Hall (On-Campus Training Hotel · 12 Rooms)"),
    sub: tr("校內實務基地 · 12 間實習客房 · OPERA 與德安雙旅館管理系統(PMS)", "On-campus practicum hotel · 12 guestrooms · OPERA & 德安 PMS"),
    extUrl: "https://hotel.nkuht.edu.tw/p/403-1018-608.php?Lang=zh-tw",
    extLabel: tr("會館法規 ↗", "Rules ↗"),
    kw: "群賢會館 校內實習旅館 12間客房 德安 OPERA PMS Elite House Qunxian",
    run: () => htl.selectBuilding?.(qxBldg),
  });

  for (const p of OFFICIAL.partners || []) {
    const bId = resolveHotelBuildingId(p.name);
    const grp = HOTEL_BRAND_GROUP[p.name] || tr("菁英實習計畫 3.0 合作旅館", "Elite Internship 3.0 Partner");
    const altName = p.name.includes("李芳") ? p.name.replace("李芳", "李方") : "";
    rows.push({
      cat: "hotel",
      ico: "🏨",
      title: p.name,
      sub: `${grp} · ${tr("09 實習旅館專島｜大三全學年校外實習（一）（二）共 20 學分合作夥伴", "09 Practicum & Partner Hotels Island · Junior Off-Campus Internship Partner")}`,
      extUrl: p.url,
      extLabel: tr("飯店官網 ↗", "Hotel ↗"),
      kw: `${p.name} ${altName} ${grp} 實習 飯店 酒店 旅館 hotel internship`,
      run: () => htl.selectBuilding?.(bId),
    });
  }

  // 20 Islands
  for (const isl of [...D.islands].sort((a, b) => a.number - b.number)) {
    const no = String(isl.number).padStart(2, "0");
    rows.push({
      cat: "island",
      ico: "🏝️",
      title: `${no} ${txt(isl.name)}`,
      sub: txt(isl.summary) || "",
      kw: `${no} ${isl.name?.zh || ""} ${isl.name?.en || ""} ${isl.summary?.zh || ""} ${isl.summary?.en || ""}`,
      run: () => htl.selectIsland?.(isl.id),
    });
  }

  // 15 Sky Fleet Banners, Luxury Blimps & Hot Air Balloons
  for (const c of window.__htlSkyFleet?.catalog || []) {
    const sp = c.spec;
    rows.push({
      cat: "act",
      ico: sp.badge || "✈️",
      title: `${txt(sp.name)}`,
      sub: `${sp.title || sp.label || ""} · ${txt(sp.schedule) || ""}`,
      extUrl: sp.officialUrl || "",
      extLabel: txt(sp.officialLabel) || tr("官網 ↗", "Portal ↗"),
      kw: `${c.id} ${sp.name?.zh || ""} ${sp.name?.en || ""} ${sp.title || ""} ${sp.label || ""} ${sp.sub || ""} 飛行器 飛機 拉布條 飛船 熱氣球 sky banner blimp balloon`,
      run: () => htl.selectSkyCraft?.(c.id, { summonIfHidden: true }),
    });
  }

  // All Highlight Buildings (excluding sport-hXX individual hotel duplicates if present so hotels stay clean)
  for (const [id, b] of bMap.entries()) {
    if (id.startsWith("sport-h")) continue;
    const islNo = String(b.islandObj.number).padStart(2, "0");
    rows.push({
      cat: "item",
      ico: "📍",
      title: txt(b.name),
      sub: `${islNo} ${txt(b.islandObj.name)} · ${txt(b.plain) || ""}`,
      extUrl: `./p/${encodeURIComponent(id)}/${isEn() ? "?lang=en" : ""}`,
      extLabel: tr("資料頁 ↗", "Page ↗"),
      kw: `${id} ${b.name?.zh || ""} ${b.name?.en || ""} ${b.plain?.zh || ""} ${b.plain?.en || ""} ${(b.facts || []).map(txt).join(" ")}`,
      run: () => htl.selectBuilding?.(id),
    });
  }

  return rows;
}

function ensureCmdPalette() {
  if (cmdBackdrop) return;
  cmdBackdrop = document.createElement("div");
  cmdBackdrop.className = "cpro-cmd-backdrop";
  cmdBackdrop.hidden = true;
  cmdBackdrop.innerHTML = `
    <div class="cpro-cmd-box" role="dialog" aria-modal="true" aria-label="${tr("禮賓全域快速搜尋與跳轉", "Concierge Global Quick-Jump")}">
      <div class="cpro-cmd-top">
        <span class="cpro-cmd-ico">🛎️</span>
        <input type="search" class="cpro-cmd-input" autocomplete="off" spellcheck="false"
          placeholder="${tr("搜尋 10 位師長分機、24 家合作旅館＋群賢會館、1+3 證照、天空機隊、主題島或輸入指令…", "Search 10 faculty, 24 partner hotels + Elite House, 1+3 certs, sky fleet, islands or commands…")}">
        <button type="button" class="cpro-cmd-esc" data-cmd-close>ESC</button>
      </div>
      <div class="cpro-cmd-tabs" role="tablist"></div>
      <ul class="cpro-cmd-list" role="listbox"></ul>
      <div class="cpro-cmd-foot">
        <span><kbd>↑</kbd><kbd>↓</kbd> ${tr("移動選擇", "Navigate")} · <kbd>Enter</kbd> ${tr("立即前往／執行", "Jump / Run")} · <kbd>Esc</kbd> ${tr("關閉", "Close")}</span>
        <span>NKUHT HTL Concierge · Est. 1995</span>
      </div>
    </div>`;
  document.body.appendChild(cmdBackdrop);

  cmdInput = cmdBackdrop.querySelector(".cpro-cmd-input");
  cmdListEl = cmdBackdrop.querySelector(".cpro-cmd-list");
  cmdTabsEl = cmdBackdrop.querySelector(".cpro-cmd-tabs");

  cmdBackdrop.addEventListener("click", (e) => {
    if (e.target === cmdBackdrop || e.target.closest("[data-cmd-close]")) {
      closeCmdPalette();
      return;
    }
    const tabBtn = e.target.closest("[data-cmd-cat]");
    if (tabBtn) {
      cmdCat = tabBtn.dataset.cmdCat;
      cmdSel = 0;
      renderCmdPalette();
      cmdInput.focus();
      return;
    }
    if (e.target.closest(".cpro-cmd-ext")) return;
    const rowEl = e.target.closest("[data-cmd-idx]");
    if (rowEl) {
      const item = cmdFiltered[Number(rowEl.dataset.cmdIdx)];
      if (item) {
        closeCmdPalette();
        item.run();
      }
    }
  });

  cmdInput.addEventListener("input", () => {
    cmdSel = 0;
    renderCmdPalette();
  });

  cmdInput.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (cmdFiltered.length) {
        cmdSel = (cmdSel + 1) % cmdFiltered.length;
        syncCmdSelection();
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (cmdFiltered.length) {
        cmdSel = (cmdSel - 1 + cmdFiltered.length) % cmdFiltered.length;
        syncCmdSelection();
      }
    } else if (e.key === "Enter") {
      e.preventDefault();
      const item = cmdFiltered[cmdSel];
      if (item) {
        closeCmdPalette();
        item.run();
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      closeCmdPalette();
    }
  });
}

function renderCmdPalette() {
  const corpus = buildCorpus();
  const q = (cmdInput?.value || "").trim().toLowerCase();
  const tokens = q ? q.split(/\s+/).filter(Boolean) : [];

  const matchedByQuery = corpus.filter((r) => {
    if (!tokens.length) return true;
    const hay = `${r.title} ${r.sub} ${r.kw}`.toLowerCase();
    return tokens.every((t) => hay.includes(t));
  });

  const nIsl = getHtl()?.D?.islands?.length || 20;
  const cats = [
    ["all", tr("✨ 全部", "✨ All")],
    ["act", tr("⚡ 快捷工具", "⚡ Tools")],
    ["faculty", tr("👨‍🏫 專任師資 10", "👨‍🏫 Faculty 10")],
    ["hotel", tr("🏨 實習旅館 24＋1", "🏨 Hotels 24+1")],
    ["island", tr(`🏝️ 主題島 ${nIsl}`, `🏝️ Islands ${nIsl}`)],
    ["item", tr("📍 教學細項", "📍 Highlights")],
  ];
  cmdTabsEl.innerHTML = cats
    .map(([id, label]) => {
      const cnt = id === "all" ? matchedByQuery.length : matchedByQuery.filter((x) => x.cat === id).length;
      return `<button type="button" class="cpro-cmd-tab${cmdCat === id ? " active" : ""}" data-cmd-cat="${id}">${esc(label)} (${cnt})</button>`;
    })
    .join("");

  cmdFiltered = (cmdCat === "all" ? matchedByQuery : matchedByQuery.filter((x) => x.cat === cmdCat)).slice(0, 60);
  if (cmdSel >= cmdFiltered.length) cmdSel = 0;

  if (!cmdFiltered.length) {
    cmdListEl.innerHTML = `<li class="cpro-cmd-empty">${tr("找不到符合的項目，試試搜尋「許孟鈞」、「文華東方」、「WSET」或「群賢會館」。", "No matches found. Try searching faculty names, partner hotels, or certificates.")}</li>`;
    return;
  }

  cmdListEl.innerHTML = cmdFiltered
    .map(
      (r, idx) => `<li class="cpro-cmd-row${idx === cmdSel ? " sel" : ""}" role="option" data-cmd-idx="${idx}">
        <span class="cpro-cmd-badge">${r.ico}</span>
        <div class="cpro-cmd-main">
          <b>${esc(r.title)}</b>
          <small>${esc(r.sub)}</small>
        </div>
        <div class="cpro-cmd-acts">
          ${r.extUrl ? `<a class="cpro-cmd-ext" href="${esc(r.extUrl)}" target="_blank" rel="noopener noreferrer">${esc(r.extLabel || "↗")}</a>` : ""}
          <span class="cpro-cmd-go">${tr("前往 →", "Go →")}</span>
        </div>
      </li>`
    )
    .join("");
}

function syncCmdSelection() {
  if (!cmdListEl) return;
  const items = cmdListEl.querySelectorAll(".cpro-cmd-row");
  items.forEach((el, i) => {
    el.classList.toggle("sel", i === cmdSel);
    if (i === cmdSel) el.scrollIntoView({ block: "nearest" });
  });
}

function openCmdPalette(initialCat = "all") {
  ensureCmdPalette();
  cmdCat = initialCat;
  cmdSel = 0;
  cmdBackdrop.hidden = false;
  window.__htlPassport?.sfx?.bell?.();
  renderCmdPalette();
  requestAnimationFrame(() => {
    cmdInput.focus();
    cmdInput.select();
  });
}

function closeCmdPalette() {
  if (cmdBackdrop) cmdBackdrop.hidden = true;
}

// ============================================================================
// 2. Interactive 1+3 Graduation Certificate Simulator & 128-Credit / Hotel Modal
// ============================================================================
let plannerBackdrop = null;
let plannerTab = "sim";
let hotelViewFilter = "all";

function renderSimulatorHTML() {
  const res = evalSim(simState);
  const doms = [
    ["all", tr("全部類別", "All")],
    ["hosp", tr("🍽️ 餐旅／侍酒／管家", "🍽️ Hospitality & Wine")],
    ["ai", tr("🤖 AI 雲端／數位行銷", "🤖 AI, Cloud & Digital")],
    ["lang", tr("🌐 外語檢定", "🌐 Foreign Languages")],
    ["remedy", tr("🛟 大四課程配套", "🛟 Senior Course Remedy")],
  ];
  const filterFn = (item) => simState.dom === "all" || item.dom === simState.dom;
  const bShown = SIM_CAT_B.filter(filterFn);
  const cShown = SIM_CAT_C.filter((item) => simState.dom === "all" || item.dom === simState.dom);

  let gapMsg = "";
  if (res.ok) {
    gapMsg = tr(
      `已通過 A 類外語標準，並具備 ${res.bCount} 張 B 類 ＋ ${res.cCount} 張 C 類（折合 ${res.eqB} 張 B 類），符合本系畢業證照門檻！`,
      `Passed Cat A + ${res.bCount} Cat B + ${res.cCount} Cat C (equiv. ${res.eqB} B). Official 1+3 threshold met!`
    );
  } else {
    const parts = [];
    if (!res.a) parts.push(tr("「A 類：相當於 TOEIC 600 分(含)以上」", "Category A (TOEIC 600+)"));
    if (res.bCount < 2 && res.cCount < 1) {
      const needB = Math.max(0, 2 - res.bCount);
      parts.push(tr(`「再 ${needB} 張 B 類證照（或任 1 張 C 類證照）」`, `${needB} more Cat B (or 1 Cat C)`));
    }
    gapMsg = tr(`目前尚需：${parts.join(" ＋ ")}`, `Still needed: ${parts.join(" + ")}`);
  }

  return `<div class="cpro-sim" data-cpro-sim-root>
    <div class="cpro-sim-status${res.ok ? " ok" : ""}">
      <div>
        <b>${res.ok ? `🎉 ${tr("恭喜達成「1+3」畢業證照門檻！", "1+3 Graduation Certificate Requirement Met!")}` : `🧮 ${tr("1+3 畢業證照門檻即時試算（111學年度起入學適用・1140528通過）", "1+3 Graduation Certificate Simulator (AY 111+ Official Standard)")}`}</b>
        <small>${esc(gapMsg)}</small>
      </div>
      <a class="cpro-btn-outline" href="https://hotel.nkuht.edu.tw/p/450-1018-38352,c0.php?Lang=zh-tw" target="_blank" rel="noopener noreferrer">${tr("📄 官方標準表 ↗", "📄 Official Table ↗")}</a>
    </div>

    <div class="cpro-sim-presets">
      <button type="button" class="cpro-sim-preset" data-sim-preset="classic">✨ ${tr("範例一：A類 ＋ 餐服丙級＆客房丙級", "Preset 1: Cat A + Dual Level-C")}</button>
      <button type="button" class="cpro-sim-preset" data-sim-preset="somm">🍷 ${tr("範例二：A類 ＋ WSET Level 2 (1張C抵2張B)", "Preset 2: Cat A + WSET L2 (1C = 2B)")}</button>
      <button type="button" class="cpro-sim-preset" data-sim-preset="digital">🤖 ${tr("範例三：A類 ＋ AI-900 ＆ Google Analytics", "Preset 3: Cat A + AI-900 & GA4")}</button>
      <button type="button" class="cpro-sim-preset" data-sim-preset="clear">↺ ${tr("清空重設", "Reset")}</button>
    </div>

    <label class="cpro-sim-cat-a${simState.a ? " checked" : ""}">
      <input type="checkbox" data-sim-a ${simState.a ? "checked" : ""}>
      <div>
        <b>${tr("【必備 A 類：外語檢定標準】相當於 TOEIC 600 分（含）以上", "[Required Category A] Foreign Language Equivalent to TOEIC 600+")}</b>
        <div style="font-size:11.5px;opacity:.82;margin-top:2px">${tr("依「國立高雄餐旅大學四技學生英文能力檢定實施要點」辦理（外籍生及僑生不適用 1+3）", "Administered per NKUHT Four-Year English Proficiency Guidelines")}</div>
      </div>
    </label>

    <div class="cpro-sim-filter-row">
      ${doms
        .map(
          ([id, label]) =>
            `<button type="button" class="cpro-sim-fbtn${simState.dom === id ? " active" : ""}" data-sim-dom="${id}">${esc(label)}</button>`
        )
        .join("")}
    </div>

    <div class="cpro-sim-cols">
      <div class="cpro-sim-col">
        <h4>
          <b>${tr("B 類：一般專業／外語證照（選 2 張）", "Category B: General / Language (Pick 2)")}</b>
          <span>${tr(`已勾選 ${res.bCount} 項`, `${res.bCount} selected`)}</span>
        </h4>
        <div class="cpro-sim-items">
          ${
            bShown.length
              ? bShown
                  .map((it) => {
                    const ck = simState.b.includes(it.id);
                    return `<label class="cpro-sim-item${ck ? " checked" : ""}">
                      <input type="checkbox" data-sim-b="${it.id}" ${ck ? "checked" : ""}>
                      <span>${esc(tr(it.zh, it.en))}</span>
                    </label>`;
                  })
                  .join("")
              : `<div style="font-size:12px;opacity:.7;padding:8px">${tr("此分類無 B 類項目", "No Cat B items in this filter")}</div>`
          }
        </div>
      </div>

      <div class="cpro-sim-col">
        <h4>
          <b>${tr("C 類：中高階／國際證照（1 張抵 2 張 B 類）", "Category C: Advanced / Intl (1 C = 2 B)")}</b>
          <span>${tr(`已勾選 ${res.cCount} 項`, `${res.cCount} selected`)}</span>
        </h4>
        <div class="cpro-sim-items">
          ${
            cShown.length
              ? cShown
                  .map((it) => {
                    const ck = simState.c.includes(it.id);
                    return `<label class="cpro-sim-item${ck ? " checked" : ""}">
                      <input type="checkbox" data-sim-c="${it.id}" ${ck ? "checked" : ""}>
                      <span>${esc(tr(it.zh, it.en))}<em class="cpro-sim-tag">1抵2B</em></span>
                    </label>`;
                  })
                  .join("")
              : `<div style="font-size:12px;opacity:.7;padding:8px">${tr("此分類無 C 類項目（大四課程配套僅適用 B 類）", "Course remedies apply to Category B only")}</div>`
          }
        </div>
      </div>
    </div>

    <p class="cpro-sim-note">
      📌 <b>${tr("官網備註：", "Official Notes:")}</b>
      ${tr(
        "B 類專業證書於「入學前」取得者不得列入計算；111–113 學年度入學學生於 114 年 7 月 31 日前取得之舊表過渡證照（如 Meta 100-101、AWS Cloud Practitioner 等）亦得依標準表備註六認列。詳參 ",
        "Category B professional certificates obtained prior to enrollment are excluded. See full official table at "
      )}
      <a href="https://hotel.nkuht.edu.tw/p/403-1018-416.php?Lang=zh-tw" target="_blank" rel="noopener noreferrer">${tr("旅館系畢業條件標準表專區 ↗", "Graduation Requirements Portal ↗")}</a>
    </p>
  </div>`;
}

function handleSimInteraction(e) {
  const presetBtn = e.target.closest("[data-sim-preset]");
  if (presetBtn) {
    const p = presetBtn.dataset.simPreset;
    if (p === "classic") {
      simState.a = true;
      simState.b = ["b01", "b02"];
      simState.c = [];
    } else if (p === "somm") {
      simState.a = true;
      simState.b = [];
      simState.c = ["c05"];
    } else if (p === "digital") {
      simState.a = true;
      simState.b = ["b07", "b12"];
      simState.c = [];
    } else {
      simState.a = false;
      simState.b = [];
      simState.c = [];
    }
    simState.dom = "all";
    afterSimChange();
    return true;
  }
  const domBtn = e.target.closest("[data-sim-dom]");
  if (domBtn) {
    simState.dom = domBtn.dataset.simDom;
    refreshAllSimulators();
    return true;
  }
  if (e.target.matches("[data-sim-a]")) {
    simState.a = e.target.checked;
    afterSimChange();
    return true;
  }
  if (e.target.matches("[data-sim-b]")) {
    const id = e.target.dataset.simB;
    const set = new Set(simState.b);
    if (e.target.checked) set.add(id);
    else set.delete(id);
    simState.b = [...set];
    afterSimChange();
    return true;
  }
  if (e.target.matches("[data-sim-c]")) {
    const id = e.target.dataset.simC;
    const set = new Set(simState.c);
    if (e.target.checked) set.add(id);
    else set.delete(id);
    simState.c = [...set];
    afterSimChange();
    return true;
  }
  return false;
}

function afterSimChange() {
  const res = evalSim(simState);
  if (res.ok && !simState.rewarded) {
    simState.rewarded = true;
    try {
      // 2026-11-15: was written to an unused storage key ("htl_quest_v2"), so the 25 XP never counted; now a one-time
      // passport award
      const qp = window.__htlPassport;
      qp?.grantXp?.("sim:1plus3", 25, tr("1+3 畢業條件模擬通過", "1+3 graduation simulator passed"));
      qp?.sfx?.fanfare?.();
    } catch {}
  } else {
    window.__htlPassport?.sfx?.bell?.();
  }
  saveJson(SIM_KEY, simState);
  refreshAllSimulators();
}

function refreshAllSimulators() {
  document.querySelectorAll("[data-cpro-sim-host]").forEach((host) => {
    host.innerHTML = renderSimulatorHTML();
  });
}

function renderInternshipAndCreditsHTML() {
  const OFFICIAL = getHtl()?.OFFICIAL || {};
  const getHotelRegion = (name) => {
    if (name.includes("國外") || name.includes("海外")) return "overseas";
    if (name.includes("群賢")) return "campus";
    if (/瑞穗天合|花蓮/.test(name)) return "east";
    if (/台南|臺南|高雄|大員|然一|AMNIS|英迪格/.test(name)) return "south";
    if (/台中|臺中|勤美|李芳|李方|雲品|虹夕諾雅|裕元|MOXY/i.test(name)) return "central";
    return "north";
  };

  const allHotels = [
    {
      name: "國外／海外實習與研修（新加坡・日本・澳洲・美加）",
      url: "https://hotel.nkuht.edu.tw/p/403-1018-413.php?Lang=zh-tw",
      group: tr("新加坡為主要成長來源・日本實習・澳洲與美加研修（112–114 學年 67 人次）", "Singapore · Japan · Australia · US/Canada (67 placements, AY 112–114)"),
      reg: "overseas",
    },
    {
      name: "群賢會館（第 06 島・校內實習旅館）",
      url: "https://hotel.nkuht.edu.tw/p/403-1018-608.php?Lang=zh-tw",
      group: tr("校內實習旅館（12 間實習客房・OPERA 與德安雙 PMS）", "On-Campus Practicum Hotel (12 Rooms · OPERA & De-An PMS)"),
      reg: "campus",
    },
    ...(OFFICIAL.partners || []).map((p) => ({
      name: p.name,
      url: p.url,
      group: HOTEL_BRAND_GROUP[p.name] || tr("菁英實習計畫 3.0 合作旅館", "Elite Internship 3.0 Partner"),
      reg: getHotelRegion(p.name),
    })),
  ];

  const viewFilters = [
    ["all", `${tr("全部國內外實習旅館", "All Domestic & Overseas")} (${allHotels.length})`],
    ["overseas", `🌐 ${tr("國外海外星級酒店", "Overseas Luxury")} (1)`],
    ["north", `${tr("北部", "North")} (12)`],
    ["central", `${tr("中部", "Central")} (6)`],
    ["south", `${tr("南部", "South")} (5)`],
    ["east", `${tr("東部", "East")} (1)`],
    ["campus", `🏫 ${tr("校內群賢會館", "On-Campus")} (1)`],
    ["wish", `⭐ ${tr("我的實習志願", "My Wishlist")} (${wishList.length})`],
  ];

  const shown = allHotels.filter((h) => {
    if (hotelViewFilter === "wish") return wishList.includes(h.name);
    if (hotelViewFilter !== "all" && h.reg !== hotelViewFilter) return false;
    return true;
  });

  return `
    <h3 style="margin:0 0 8px;font-size:15px">📚 ${tr("115 學年度日間部四年制課程標準表（畢業總學分 128 學分）", "AY 115 4-Year Curriculum Structure (128 Credits Total)")}</h3>
    <div class="cpro-cred-grid">
      <div class="cpro-cred-card">
        <big>36</big>
        <b>${tr("校訂必修學分", "University Required")}</b>
        <small>${tr("通識博雅與基礎英文等共同核心", "General education & core English")}</small>
      </div>
      <div class="cpro-cred-card">
        <big>12</big>
        <b>${tr("院訂必修學分", "College Required")}</b>
        <small>${tr("餐旅學院跨域管理與餐旅概論核心", "School of Hospitality core courses")}</small>
      </div>
      <div class="cpro-cred-card">
        <big>55</big>
        <b>${tr("系訂必修學分", "Department Required")}</b>
        <small>${tr("含群賢會館實務＆大三校外實習(一)(二)共20學分", "Includes Practicum & Junior Internship 20 cr.")}</small>
      </div>
      <div class="cpro-cred-card">
        <big>25</big>
        <b>${tr("系訂選修學分", "Department Electives")}</b>
        <small>${tr("跨系／跨校／跨領域微學分至多承認 6 學分", "Up to 6 cross-dept credits recognized")}</small>
      </div>
    </div>
    <p class="cpro-sim-note" style="margin:0 0 14px">
      💡 <b>${tr("外語必修免修規定（115 課程標準表備註 2、3）：", "Course Exemption Highlights (AY 115 Notes 2 & 3):")}</b>
      ${tr(
        "TOEIC 850 分(含)以上得申請免修『旅館英文(一)』（須選修餐旅學院其他必修補足）；JLPT N3(含)以上得申請免修『旅館日文(一)、(二)』（須選修應日系或本系大二、大四日文選修補足）。",
        "TOEIC 850+ may exempt Hotel English I; JLPT N3+ may exempt Hotel Japanese I & II (credits must be supplemented per official rules)."
      )}
      <a href="https://hotel.nkuht.edu.tw/var/file/18/1018/img/455909285.pdf" target="_blank" rel="noopener noreferrer">${tr("下載 115 課程標準表 PDF ↗", "115 Curriculum PDF ↗")}</a>
    </p>

    <div class="cpro-card-cta" style="margin:0 0 16px;align-items:flex-start;flex-direction:column;gap:8px">
      <div class="cpro-card-cta-info" style="width:100%">
        <b>✨ ${tr("奢華體驗管理微學分（共 8 門・皆已完成三級三審）", "Luxury Experience Management Micro-Credits (8 Courses · Three-Level Review)")}</b>
        <small>${tr(
          "113-2：《人格特質剖析與旅館職業》・《行為面談解析及實務應用》・《國際連鎖品牌導論及領導統御》・《奢華酒店管家服務》；114-1：《旅館禮賓諮詢技巧》・《客房向上銷售技巧》；114-2：《實習職前準備與職場認知》・《國際品牌連鎖旅館發展史》",
          "113-2: Personality Analysis & Hotel Careers · Behavioural Interviews · International Hotel Brands & Leadership · Luxury Hotel Butler Service; 114-1: Concierge Consultation Skills · Room Upselling Skills; 114-2: Pre-Internship Preparation · History of International Hotel Chains"
        )}</small>
      </div>
      <div style="display:flex;gap:7px;flex-wrap:wrap">
        <button type="button" class="cpro-btn-gold" data-sky-isl="luxury">👑 ${tr("飛往 18 奢華體驗與金鑰匙島", "18 Luxury & Butler Island")}</button>
        <button type="button" class="cpro-btn-outline" data-sky-isl="innovation">🤖 ${tr("飛往 19 數位智慧服務與創新基地島", "19 Smart Innovation Base Island")}</button>
        <button type="button" class="cpro-btn-outline" data-sky-isl="esg">🌿 ${tr("飛往 20 永續治理與研發島", "20 ESG & Research Island")}</button>
      </div>
    </div>

    <h3 style="margin:0 0 8px;font-size:15px">🏨 ${tr("校內群賢會館 ＋ 菁英實習計畫 3.0 合作旅館志願收藏夾", "On-Campus Elite House + 24 Elite Internship 3.0 Partner Hotels")}</h3>
    <div class="cpro-sim-filter-row">
      ${viewFilters
        .map(
          ([id, label]) =>
            `<button type="button" class="cpro-sim-fbtn${hotelViewFilter === id ? " active" : ""}" data-hotel-reg="${esc(id)}">${esc(label)}</button>`
        )
        .join("")}
    </div>
    ${
      shown.length
        ? `<div class="cpro-hotel-grid">
            ${shown
              .map((h) => {
                const wished = wishList.includes(h.name);
                return `<div class="cpro-hotel-card${wished ? " wished" : ""}">
                  <div>
                    <div class="cpro-hotel-top">
                      <b>${esc(h.name)}</b>
                      <button type="button" class="cpro-wish-btn${wished ? " on" : ""}" data-wish-hotel="${esc(h.name)}" title="${tr("加入／移除實習志願清單", "Toggle Internship Wishlist")}">
                        ${wished ? "★ 已收藏" : "☆ 志願"}
                      </button>
                    </div>
                    <div class="cpro-hotel-meta">🏨 ${esc(h.group)}</div>
                  </div>
                  <div class="cpro-hotel-links">
                    <button type="button" data-fly-hotel="${esc(h.name)}">🧭 ${tr("飛往 3D 實習旅館專島", "Fly in 3D")}</button>
                    <a href="${esc(h.url)}" target="_blank" rel="noopener noreferrer">${tr("官方網站 ↗", "Official ↗")}</a>
                  </div>
                </div>`;
              })
              .join("")}
          </div>`
        : `<div class="cpro-cmd-empty">${tr("尚未收藏任何實習志願旅館，點擊任一飯店右上角「☆ 志願」即可加入！", "No hotels in your wishlist yet. Click '☆' on any hotel card to save it!")}</div>`
    }`;
}

function renderSkyAirshowHTML() {
  const skyItems = [
    {
      ico: "🛩️",
      tag: tr("05:30–19:30 單機排程 01", "05:30–19:30 Slot 01"),
      title: "★ 國立高雄餐旅大學・旅館管理系 ★ 務實致用・理論與實務並重",
      sub: "84 年（1995 年）核定成立旅館管理科、89 年升格為系、91 年增設四年制，以實務與理論並重培育旅宿經營管理專才。",
      island: "civil",
      summon: "plane:0",
    },
    {
      ico: "🛩️",
      tag: tr("05:30–19:30 單機排程 02", "05:30–19:30 Slot 02"),
      title: "🏨 菁英實習計畫 3.0｜串聯全臺 24 家國際標竿合作旅館",
      sub: "大三全學年校外實習（一）（二）共 20 學分，校內群賢會館與 24 家頂級合作旅館同島並立於「09 實習旅館專島」。",
      island: "sport",
      summon: "plane:1",
    },
    {
      ico: "✈️",
      tag: tr("05:30–19:30 單機排程 03", "05:30–19:30 Slot 03"),
      title: "🎓 1+3 畢業證照門檻｜1 張畢業證書 ＋ 3 張專業與外語證照",
      sub: "通過 A 類外語檢定標準（TOEIC 600+）並搭配 2 張 B 類證照或 1 張 C 類中高階國際證照。",
      island: "card",
      summon: "plane:2",
    },
    {
      ico: "🛩️",
      tag: tr("05:30–19:30 單機排程 04", "05:30–19:30 Slot 04"),
      title: "🏛️ 校內實習旅館「群賢會館」｜12 間實習客房・OPERA＆德安雙 PMS",
      sub: "大一、大二於校內 12 間實習客房實作客務、房務與 OPERA、德安雙套旅館管理系統。",
      island: "family",
      summon: "plane:3",
    },
    {
      ico: "✈️",
      tag: tr("05:30–19:30 單機排程 05", "05:30–19:30 Slot 05"),
      title: "🌏 115 學年度 128 學分跨域養成｜服務精神・專業整合・精通外語",
      sub: "10 位旅館管理系專任(案)師資領航，結合 AI 雲端數位行銷與國際侍酒師雙軌課程。",
      island: "welfare",
      summon: "plane:4",
    },
    {
      ico: "🛸",
      tag: tr("16:00–22:30 黃昏／星夜排程", "16:00–22:30 Dusk & Night Blimps"),
      title: "✦ 高餐旅館號 ＆ 群賢領航號禮賓飛船｜單艘慢速巡禮 ✦",
      sub: "午後黃昏與星夜時段排程單艘升空（日間淨空留白），雙側發光船身看板與空中布條點亮夜空。",
      island: "institute",
      summon: "airship:0",
    },
    {
      ico: "🎈",
      tag: tr("晨飛 05:30–09:00 ／ 光雕 16:00–22:30", "Dawn & Dusk/Night-Glow Fiesta"),
      title: "八彩高餐旅館主題熱氣球（分組雙球輪替升空・日間單球留白）",
      sub: "依時段於遠海天際線分批緩緩升空與降落：高餐旅館系、群賢會館、菁英實習 3.0、1+3 證照、三明治教學、雙 PMS、精通外語、款待之心。",
      island: "diplomacy",
      summon: "balloon:0",
    },
  ];

  return `
    <div class="cpro-sim-status ok" style="margin-bottom:14px">
      <div>
        <b>🗓️ ${tr("高餐大旅館島・天空飛行器與熱氣球分時排程表", "NKUHT Hotel Island · Scheduled Sky Airshow & Balloon Timetable")}</b>
        <small>${tr("採單航道淨空排程：同時間最多僅 1 架宣導機（或 1 艘禮賓飛船）搭配 1～2 顆遠海熱氣球輪替登場，航次間保留晴空留白；22:30–05:30 深夜靜謐休航。", "Single-corridor ATC schedule: at most 1 banner craft + 1–2 distant horizon balloons appear at once with calm clear-sky intervals; quiet hours 22:30–05:30.")}</small>
      </div>
      <div style="display:flex;gap:6px;flex-wrap:wrap">
        <button type="button" class="cpro-btn-outline" data-sky-time="390">🌅 ${tr("06:30 晨飛排程", "06:30 Dawn")}</button>
        <button type="button" class="cpro-btn-outline" data-sky-time="720">☀️ ${tr("12:00 日間單機", "12:00 Midday")}</button>
        <button type="button" class="cpro-btn-outline" data-sky-time="1080">🌇 ${tr("18:00 黃昏飛船", "18:00 Sunset Blimp")}</button>
        <button type="button" class="cpro-btn-gold" data-sky-time="1260">🌙 ${tr("21:00 星夜光雕", "21:00 Night Glow")}</button>
        <button type="button" class="cpro-btn-outline" data-sky-time="1380">🌌 ${tr("23:00 深夜休航", "23:00 Quiet Sky")}</button>
      </div>
    </div>
    <div class="cpro-hotel-grid">
      ${skyItems
        .map(
          (it) => `<div class="cpro-hotel-card">
            <div>
              <div class="cpro-hotel-top">
                <b>${it.ico} ${esc(it.title)}</b>
              </div>
              <div class="cpro-hotel-meta" style="margin-top:4px"><span class="cpro-sim-tag" style="margin-left:0">${esc(it.tag)}</span> ${esc(it.sub)}</div>
            </div>
            <div class="cpro-hotel-links">
              <button type="button" data-sky-summon="${esc(it.summon)}">📡 ${tr("召喚單機飛越", "Dispatch Flight Now")}</button>
              <button type="button" data-sky-isl="${esc(it.island)}">🏝️ ${tr("前往主題島", "Visit Theme Island")}</button>
            </div>
          </div>`
        )
        .join("")}
    </div>`;
}

function ensurePlannerModal() {
  if (plannerBackdrop) return;
  plannerBackdrop = document.createElement("div");
  plannerBackdrop.className = "cpro-modal-backdrop";
  plannerBackdrop.hidden = true;
  plannerBackdrop.innerHTML = `
    <div class="cpro-modal-box" role="dialog" aria-modal="true" aria-labelledby="cpro-modal-title">
      <header class="cpro-modal-head">
        <div>
          <div class="cpro-modal-eyebrow">NKUHT HOTEL MANAGEMENT · CONCIERGE PLANNER</div>
          <h2 id="cpro-modal-title">${tr("高餐大旅館管理系・畢業門檻與菁英實習規劃儀表板", "NKUHT HTL Graduation & Elite Internship Planner")}</h2>
        </div>
        <button type="button" class="cpro-modal-close" data-cpro-close aria-label="Close">×</button>
      </header>
      <div class="cpro-modal-tabs" role="tablist">
        <button type="button" class="cpro-modal-tab" data-cpro-tab="sim">🧮 ${tr("1+3 畢業證照門檻試算器", "1+3 Certificate Simulator")}</button>
        <button type="button" class="cpro-modal-tab" data-cpro-tab="intern">🏨 ${tr("128 學分架構 ＆ 24＋1 家實習旅館志願", "128 Credits & 24+1 Hotels Wishlist")}</button>
        <button type="button" class="cpro-modal-tab" data-cpro-tab="sky">🗓️ ${tr("天空排程 ＆ 熱氣球宣導", "Sky Timetable & Balloons")}</button>
      </div>
      <div class="cpro-modal-body" data-cpro-body></div>
    </div>`;
  document.body.appendChild(plannerBackdrop);

  plannerBackdrop.addEventListener("click", (e) => {
    if (e.target === plannerBackdrop || e.target.closest("[data-cpro-close]")) {
      plannerBackdrop.hidden = true;
      return;
    }
    const tBtn = e.target.closest("[data-cpro-tab]");
    if (tBtn) {
      plannerTab = tBtn.dataset.cproTab;
      renderPlannerModal();
      return;
    }
    const skyTimeBtn = e.target.closest("[data-sky-time]");
    if (skyTimeBtn) {
      const mins = Number(skyTimeBtn.dataset.skyTime);
      plannerBackdrop.hidden = true;
      document.getElementById("home")?.click();
      const presetBtn = document.querySelector(`[data-time="${mins}"]`);
      if (presetBtn) {
        presetBtn.click();
      } else {
        const dayEl = document.getElementById("day");
        if (dayEl) {
          dayEl.value = String(mins);
          dayEl.dispatchEvent(new Event("input", { bubbles: true }));
        }
      }
      return;
    }
    const summonBtn = e.target.closest("[data-sky-summon]");
    if (summonBtn) {
      const [kind, idxStr] = (summonBtn.dataset.skySummon || "plane:0").split(":");
      const idx = Number(idxStr) || 0;
      const craftId = `sky-${kind}-${idx}`;
      plannerBackdrop.hidden = true;
      if (getHtl()?.selectSkyCraft) {
        getHtl().selectSkyCraft(craftId, { summonIfHidden: true });
      } else {
        document.getElementById("home")?.click();
        window.__htlSkyFleet?.summonFlight?.({ kind, index: idx });
        window.__htlPassport?.sfx?.bell?.();
      }
      return;
    }
    const skyIslBtn = e.target.closest("[data-sky-isl]");
    if (skyIslBtn) {
      plannerBackdrop.hidden = true;
      getHtl()?.selectIsland?.(skyIslBtn.dataset.skyIsl);
      return;
    }
    const regBtn = e.target.closest("[data-hotel-reg]");
    if (regBtn) {
      hotelViewFilter = regBtn.dataset.hotelReg;
      renderPlannerModal();
      return;
    }
    const wishBtn = e.target.closest("[data-wish-hotel]");
    if (wishBtn) {
      const nm = wishBtn.dataset.wishHotel;
      if (wishList.includes(nm)) wishList = wishList.filter((x) => x !== nm);
      else wishList.push(nm);
      saveWish();
      window.__htlPassport?.sfx?.bell?.();
      renderPlannerModal();
      return;
    }
    const flyBtn = e.target.closest("[data-fly-hotel]");
    if (flyBtn) {
      const bId = resolveHotelBuildingId(flyBtn.dataset.flyHotel);
      plannerBackdrop.hidden = true;
      getHtl()?.selectBuilding?.(bId);
      return;
    }
    handleSimInteraction(e);
  });
}

function renderPlannerModal() {
  if (!plannerBackdrop) return;
  plannerBackdrop.querySelectorAll("[data-cpro-tab]").forEach((b) => {
    b.classList.toggle("active", b.dataset.cproTab === plannerTab);
  });
  const body = plannerBackdrop.querySelector("[data-cpro-body]");
  if (plannerTab === "sim") {
    body.innerHTML = `<div data-cpro-sim-host>${renderSimulatorHTML()}</div>`;
  } else if (plannerTab === "intern") {
    body.innerHTML = renderInternshipAndCreditsHTML();
  } else {
    body.innerHTML = renderSkyAirshowHTML();
  }
}

function openPlannerModal(tab = "sim") {
  ensurePlannerModal();
  plannerTab = tab;
  plannerBackdrop.hidden = false;
  window.__htlPassport?.sfx?.bell?.();
  renderPlannerModal();
}

// ============================================================================
// 3. High-Resolution 1600×1120 Canvas PNG Honorary Certificate Export
// ============================================================================
async function downloadHonoraryCertificatePng() {
  const qp = window.__htlPassport;
  const S = qp?.state?.() || {};
  const st = qp?.getPlayerStatus?.() || { stars: 5, xp: S.xp || 0, title: "五星領航總監", stamps: 20, totalIslands: 20 };
  const holder =
    (document.querySelector("[data-qp-cert-name]")?.value || S.certName || "").trim() ||
    tr("高餐旅館領航員", "NKUHT Hospitality Navigator");

  const W = 1600,
    H = 1120;
  const cv = document.createElement("canvas");
  cv.width = W;
  cv.height = H;
  const g = cv.getContext("2d");

  // Luxury parchment background
  const bg = g.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, "#fdf8ec");
  bg.addColorStop(0.5, "#f8efda");
  bg.addColorStop(1, "#efe1bf");
  g.fillStyle = bg;
  g.fillRect(0, 0, W, H);

  // Subtle emerald & gold double border
  g.strokeStyle = "#17372c";
  g.lineWidth = 14;
  g.strokeRect(44, 44, W - 88, H - 88);

  g.strokeStyle = "#c79228";
  g.lineWidth = 4;
  g.strokeRect(66, 66, W - 132, H - 132);

  // Corner ornaments
  const corners = [
    [66, 66, 1, 1],
    [W - 66, 66, -1, 1],
    [66, H - 66, 1, -1],
    [W - 66, H - 66, -1, -1],
  ];
  g.strokeStyle = "#b8841e";
  g.lineWidth = 3;
  for (const [cx, cy, sx, sy] of corners) {
    g.beginPath();
    g.moveTo(cx + sx * 14, cy + sy * 48);
    g.lineTo(cx + sx * 14, cy + sy * 14);
    g.lineTo(cx + sx * 48, cy + sy * 14);
    g.stroke();
  }

  // Top emerald header ribbon
  g.fillStyle = "#16352a";
  g.fillRect(140, 108, W - 280, 58);
  g.fillStyle = "#f2cf7e";
  g.font = "700 21px 'Plus Jakarta Sans', 'Segoe UI', sans-serif";
  g.textAlign = "center";
  g.fillText("NATIONAL KAOHSIUNG UNIVERSITY OF HOSPITALITY AND TOURISM · EST. 1995", W / 2, 145);

  // Load NKUHT HTL Logo if available
  try {
    const img = new Image();
    img.crossOrigin = "anonymous";
    await new Promise((res) => {
      img.onload = res;
      img.onerror = res;
      img.src = "./assets/nkuht_htl_logo.png";
    });
    if (img.naturalWidth > 0) {
      g.drawImage(img, W / 2 - 52, 188, 104, 104);
    }
  } catch {}

  g.fillStyle = "#16352a";
  g.font = "900 48px 'Noto Serif TC', 'Microsoft JhengHei', serif";
  g.fillText("國立高雄餐旅大學 旅館管理系", W / 2, 352);

  g.fillStyle = "#9b6c14";
  g.font = "700 28px 'Cormorant Garamond', 'Noto Serif TC', serif";
  g.fillText("HONORARY HOSPITALITY ISLAND NAVIGATOR CERTIFICATE · 榮譽領航結業證書", W / 2, 398);

  // Divider
  g.strokeStyle = "rgba(184, 134, 43, 0.55)";
  g.lineWidth = 2;
  g.beginPath();
  g.moveTo(320, 426);
  g.lineTo(W - 320, 426);
  g.stroke();

  g.fillStyle = "#4b5d55";
  g.font = "600 24px 'Noto Sans TC', 'Microsoft JhengHei', sans-serif";
  g.fillText("茲證明領航學員 / This is to certify that", W / 2, 482);

  // Recipient Name
  g.fillStyle = "#122a22";
  g.font = "900 66px 'Noto Serif TC', 'Microsoft JhengHei', serif";
  g.fillText(holder, W / 2, 572);

  g.strokeStyle = "#c79228";
  g.lineWidth = 3;
  g.beginPath();
  g.moveTo(470, 596);
  g.lineTo(W - 470, 596);
  g.stroke();

  // Body description
  g.fillStyle = "#243b32";
  g.font = "500 25px 'Noto Sans TC', 'Microsoft JhengHei', sans-serif";
  const bMapSize = getAllBuildingsMap().size || 133;
  const line1 = `完成高餐大旅館管理系 3D 禮賓領航島「四年三明治教學實務巡禮」，熟稔 1+3 畢業條件標準、`;
  const line2 = `校內實習旅館「群賢會館」（12 間客房・OPERA／德安雙 PMS）與「菁英實習計畫 3.0」24 家國際標竿合作旅館體系。`;
  g.fillText(line1, W / 2, 658);
  g.fillText(line2, W / 2, 698);

  // Stat Boxes
  const stats = [
    ["星等榮銜 RANK", `${"★".repeat(st.stars || 5)} ${st.title || ""}`],
    ["累積經驗 TOTAL XP", `${S.xp || 0} XP`],
    ["主題島印章 ISLANDS", `${(S.islands || []).length} / ${st.totalIslands || 20}`],
    ["探索細項 HIGHLIGHTS", `${(S.items || []).length} / ${bMapSize}`],
    ["知識王最高 QUIZ BEST", `${S.bestQuizScore || 0} 分`],
  ];
  const boxW = 244,
    gap = 20;
  const startX = (W - (stats.length * boxW + (stats.length - 1) * gap)) / 2;
  stats.forEach(([lbl, val], i) => {
    const x = startX + i * (boxW + gap);
    const y = 748;
    g.fillStyle = "rgba(22, 53, 42, 0.06)";
    g.fillRect(x, y, boxW, 108);
    g.strokeStyle = "rgba(199, 146, 40, 0.55)";
    g.lineWidth = 2;
    g.strokeRect(x, y, boxW, 108);
    g.fillStyle = "#8a6114";
    g.font = "700 15px 'Plus Jakarta Sans', 'Noto Sans TC', sans-serif";
    g.fillText(lbl, x + boxW / 2, y + 36);
    g.fillStyle = "#16352a";
    g.font = "800 24px 'Noto Sans TC', 'Plus Jakarta Sans', sans-serif";
    g.fillText(val, x + boxW / 2, y + 78);
  });

  // Gold Wax Seal
  const sx = W - 230,
    sy = 955;
  g.beginPath();
  g.arc(sx, sy, 62, 0, Math.PI * 2);
  g.fillStyle = "#c79228";
  g.fill();
  g.lineWidth = 4;
  g.strokeStyle = "#fff3cf";
  g.stroke();
  g.fillStyle = "#16352a";
  g.font = "900 18px 'Plus Jakarta Sans', sans-serif";
  g.fillText("NKUHT HTL", sx, sy - 6);
  g.font = "700 14px 'Plus Jakarta Sans', sans-serif";
  g.fillText("EST. 1995", sx, sy + 18);

  // Footer official address & date
  const today = new Date().toISOString().slice(0, 10);
  g.textAlign = "left";
  g.fillStyle = "#4c5e56";
  g.font = "600 18px 'Noto Sans TC', sans-serif";
  g.fillText("地址：812301 高雄市小港區松和路一號・第一教學大樓 (F棟) 1樓｜電話：07-8060505 轉 20202、20201", 120, 955);
  g.fillText(`簽發日期 Date Issued: ${today} · https://hotel.nkuht.edu.tw/`, 120, 988);

  const link = document.createElement("a");
  const safeName = holder.replace(/[\\/:*?"<>|\s]+/g, "_").slice(0, 24) || "Navigator";
  link.download = `NKUHT_HTL_Certificate_${safeName}.png`;
  link.href = cv.toDataURL("image/png");
  link.click();
  qp?.sfx?.fanfare?.();
}

// ============================================================================
// 4. Seamless DOM Augmentation (Toolbar, Passport Modal & Island Detail Card)
// ============================================================================
function mountToolbarTriggers() {
  const tb = document.querySelector("nav.toolbar");
  if (tb && !document.getElementById("cmd-btn")) {
    const btn = document.createElement("button");
    btn.id = "cmd-btn";
    btn.type = "button";
    btn.className = "wide";
    btn.title = tr("全域禮賓搜尋：師長分機、24 家合作旅館＋群賢會館、1+3 證照試算、天空機隊 (Ctrl+K)", "Global Concierge Search, 1+3 Simulator & Sky Fleet (Ctrl+K)");
    btn.dataset.zh = '<i class="tb-ic" aria-hidden="true">🔍</i><span class="tb-lbl">快搜</span> <kbd>Ctrl K</kbd>';
    btn.dataset.en = '<i class="tb-ic" aria-hidden="true">🔍</i><span class="tb-lbl">Search</span> <kbd>Ctrl K</kbd>';
    btn.innerHTML = isEn() ? btn.dataset.en : btn.dataset.zh;
    btn.addEventListener("click", () => openCmdPalette("all"));
    const anchor = document.getElementById("tb-2d-link") || tb.children[2] || null;
    tb.insertBefore(btn, anchor);
  }

  const mob = document.querySelector(".mob-top-actions");
  if (mob && !document.getElementById("mob-cmd-btn")) {
    const mbtn = document.createElement("button");
    mbtn.id = "mob-cmd-btn";
    mbtn.type = "button";
    mbtn.title = tr("快速搜尋師資、實習旅館與 1+3 證照試算", "Quick Search & 1+3 Simulator");
    mbtn.setAttribute("aria-label", "Quick Search");
    mbtn.textContent = "🔍";
    mbtn.addEventListener("click", () => openCmdPalette("all"));
    mob.insertBefore(mbtn, mob.firstChild);
  }
}

function augmentPassportOverlay() {
  const box = document.querySelector(".qp-box");
  if (!box) return;

  // 1) Inject inline 1+3 Simulator right after .qp-pillars
  const pillars = box.querySelector(".qp-pillars");
  if (pillars && !box.querySelector("[data-cpro-passport-sim]")) {
    const wrap = document.createElement("div");
    wrap.dataset.cproPassportSim = "1";
    wrap.innerHTML = `
      <div class="cpro-card-cta" style="margin-top:10px">
        <div class="cpro-card-cta-info">
          <b>🧮 ${tr("1+3 畢業證照門檻互動試算器（A 類 ＋ 2 張 B 類 或 1 張 C 類）", "Interactive 1+3 Graduation Certificate Simulator")}</b>
          <small>${tr("勾選已取得或預計報考之證照，即時檢核是否符合 1140528 教務會議通過標準", "Select your certificates to check official 1+3 graduation eligibility")}</small>
        </div>
        <button type="button" class="cpro-btn-gold" data-cpro-toggle-inline-sim>${tr("展開試算器 ▾", "Open Simulator ▾")}</button>
        <button type="button" class="cpro-btn-outline" data-cpro-open-intern>${tr("🏨 24 家合作旅館＋群賢會館志願夾", "🏨 24 Partner Hotels + Elite House Wishlist")}</button>
      </div>
      <div data-cpro-sim-host hidden></div>`;
    pillars.insertAdjacentElement("afterend", wrap);

    wrap.addEventListener("click", (e) => {
      if (e.target.closest("[data-cpro-toggle-inline-sim]")) {
        const host = wrap.querySelector("[data-cpro-sim-host]");
        const btn = wrap.querySelector("[data-cpro-toggle-inline-sim]");
        host.hidden = !host.hidden;
        if (!host.hidden) host.innerHTML = renderSimulatorHTML();
        btn.textContent = host.hidden ? tr("展開試算器 ▾", "Open Simulator ▾") : tr("收合試算器 ▴", "Hide Simulator ▴");
        return;
      }
      if (e.target.closest("[data-cpro-open-intern]")) {
        openPlannerModal("intern");
        return;
      }
      handleSimInteraction(e);
    });
  }

  // 2) Inject High-Resolution PNG Download button inside .qp-cert-controls
  const certCtrls = box.querySelector(".qp-cert-controls");
  if (certCtrls && !certCtrls.querySelector("[data-cpro-dl-cert]")) {
    const dlBtn = document.createElement("button");
    dlBtn.type = "button";
    dlBtn.className = "cpro-btn-gold";
    dlBtn.dataset.cproDlCert = "1";
    dlBtn.innerHTML = `📥 ${tr("下載高畫質證書 PNG", "Download HD PNG")}`;
    dlBtn.addEventListener("click", () => downloadHonoraryCertificatePng());
    certCtrls.appendChild(dlBtn);
  }
}

function augmentDetailCard() {
  const cardContent = document.getElementById("card-content");
  if (!cardContent || cardContent.querySelector("[data-cpro-card-banner]")) return;
  const text = cardContent.textContent || "";
  const isGrad = text.includes("1+3") || text.includes("畢業條件");
  const isIntern = text.includes("菁英實習") || text.includes("群賢會館") || text.includes("課程標準表") || text.includes("微學分");
  if (!isGrad && !isIntern) return;

  const banner = document.createElement("div");
  banner.className = "cpro-card-cta";
  banner.dataset.cproCardBanner = "1";
  if (isGrad) {
    banner.innerHTML = `
      <div class="cpro-card-cta-info">
        <b>🧮 ${tr("互動工具：1+3 畢業證照門檻試算器", "Interactive 1+3 Certificate Simulator")}</b>
        <small>${tr("勾選 TOEIC、丙級、WSET、AI-900 或大四配套課程，立即試算畢業資格！", "Test combinations of Cat A, B, and C certificates right now!")}</small>
      </div>
      <button type="button" class="cpro-btn-gold">${tr("立即試算 →", "Simulate →")}</button>`;
    banner.querySelector("button").addEventListener("click", () => openPlannerModal("sim"));
  } else {
    banner.innerHTML = `
      <div class="cpro-card-cta-info">
        <b>🏨 ${tr("互動工具：128 學分架構 ＆ 24 家合作旅館＋群賢會館志願收藏夾", "128-Credit Structure & 24+1 Hotels Wishlist")}</b>
        <small>${tr("一覽 115 學年度必修／選修規定，並收藏你的大三校外實習夢幻飯店志願！", "Explore AY 115 credit rules & build your Junior internship hotel wishlist!")}</small>
      </div>
      <button type="button" class="cpro-btn-gold">${tr("開啟規劃器 →", "Open Planner →")}</button>`;
    banner.querySelector("button").addEventListener("click", () => openPlannerModal("intern"));
  }
  const firstH3 = cardContent.querySelector("h3");
  if (firstH3) firstH3.insertAdjacentElement("beforebegin", banner);
  else cardContent.appendChild(banner);
}

function boot() {
  mountToolbarTriggers();

  // Global keyboard shortcuts: Ctrl+K / Cmd+K or '/' (when not typing in an input)
  window.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      if (cmdBackdrop && !cmdBackdrop.hidden) closeCmdPalette();
      else openCmdPalette("all");
      return;
    }
    const tag = (e.target?.tagName || "").toUpperCase();
    const editing = tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || e.target?.isContentEditable;
    if (!editing && e.key === "/" && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault();
      openCmdPalette("all");
    }
  });

  // Observe passport modal & detail card updates cleanly
  const mo = new MutationObserver(() => {
    augmentPassportOverlay();
    augmentDetailCard();
  });
  mo.observe(document.body, { childList: true, subtree: true });

  window.__htlConciergePro = {
    openSearch: openCmdPalette,
    openPlanner: openPlannerModal,
    downloadCertificate: downloadHonoraryCertificatePng,
  };
}

if (window.__htl) boot();
else window.addEventListener("htl:ready", boot, { once: true });

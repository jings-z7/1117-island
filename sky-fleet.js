// Sky Hospitality Airshow & Hot Air Balloon Fleet for NKUHT Department of Hotel Management
// Interactive 3D sky celebration grounded 100% in official NKUHT Hotel Management facts:
// - 5 Sightseeing Biplanes / Cruisers towing fluttering double-sided promotional banners
// - 2 Grand Hotel Luxury Blimps / Airships with illuminated sky-sign banners
// - 8 Multi-Gore Festive Hot Air Balloons with wrap-around waist sashes & night-glow burner flames
// Every craft & banner is raycast-clickable with bilingual explanations, camera tracking, mid-air hold & 3D salute!

const PLANE_SPECS = [
  {
    id: "sky-plane-0",
    badge: "🛩️",
    name: {
      zh: "雙翼宣導專機 01｜高餐旅館領航號",
      en: "Biplane Banner 01 · NKUHT Hospitality Pioneer",
    },
    category: { zh: "雙翼拉布條宣導機", en: "Sightseeing Banner Biplane" },
    schedule: { zh: "05:30–19:30 日間晴空單航道輪播", en: "05:30–19:30 Daytime Single-Corridor Pass" },
    bodyColor: 0x164a3b,
    wingColor: 0xf6ebd2,
    trimColor: 0xe5a922,
    biplane: true,
    bannerBg: "#12382c",
    bannerBorder: "#ecc056",
    bannerText: "#fff7df",
    bannerSubColor: "#f3cb68",
    title: "★ 國立高雄餐旅大學・旅館管理系 ★ 務實致用・理論與實務並重",
    sub: "NKUHT DEPARTMENT OF HOTEL MANAGEMENT · EST. 1995",
    summary: {
      zh: "本系於民國 84 年（1995 年）核定成立「旅館管理科」，85 年 3 月 1 日正式開課，89 年 8 月升格為「旅館管理系」，91 年增設四年制，秉持「務實致用、理論與實務並重」之辦學精神，培育具備國際視野與專業服務素養之現代旅館經營管理人才。",
      en: "Founded in 1995, upgraded to a department in 2000 and offering a four-year programme since 2002, NKUHT's Department of Hotel Management integrates academic theory with hands-on hospitality practice to cultivate global hotel leaders.",
    },
    facts: [
      {
        zh: "歷史沿革：84 年（1995 年）核定成立旅館管理科，85 年 3 月 1 日正式開課，89 年 8 月升格為系，91 年（2002 年）增設四年制，深耕台灣星級旅宿人才培育三十年。",
        en: "Heritage: Established in 1995, classes began in 1996, upgraded to a department in 2000 and a 4-year bachelor's programme added in 2002.",
      },
      {
        zh: "五大特色培育目標：涵蓋「服務精神、專業整合、旅館軟硬體、理論實務並重、精通外語」五大核心支柱。",
        en: "Five Core Pillars: Service Ethics, Integrated Expertise, Hotel Systems, Theory & Practice, and Foreign Languages.",
      },
      {
        zh: "系辦基地：位於高餐大第一教學大樓（F 棟）1 樓，串聯專業技術教室、OPERA／德安資訊教室與校內實習旅館群賢會館。",
        en: "Department Hub: Headquartered on 1F of Academic Building I (F Building), linking specialized labs and Qunxian Practicum Hotel.",
      },
    ],
    targetIsland: "civil",
    targetBuilding: "civil-office",
    plannerTab: "sky",
    officialUrl: "https://hotel.nkuht.edu.tw/?Lang=zh-tw",
    officialLabel: { zh: "旅館管理系官方網站 ↗", en: "Department Official Site ↗" },
    rx: 10.0,
    rz: 7.2,
    zOffset: -0.8,
    yBase: 4.05,
    yAmp: 0.18,
    speed: 0.16,
    dir: 1,
    phase: 4.55,
    scale: 0.74,
  },
  {
    id: "sky-plane-1",
    badge: "🛩️",
    name: {
      zh: "雙翼宣導專機 02｜菁英實習 3.0 領航號",
      en: "Biplane Banner 02 · Elite Internship 3.0 Express",
    },
    category: { zh: "雙翼拉布條宣導機", en: "Sightseeing Banner Biplane" },
    schedule: { zh: "05:30–19:30 日間晴空單航道輪播", en: "05:30–19:30 Daytime Single-Corridor Pass" },
    bodyColor: 0xc84b38,
    wingColor: 0xfff7e8,
    trimColor: 0xf0b941,
    biplane: true,
    bannerBg: "#fff8eb",
    bannerBorder: "#c84b38",
    bannerText: "#17352b",
    bannerSubColor: "#9c3626",
    title: "🏨 菁英實習計畫 3.0｜串聯全臺 24 家國際標竿合作旅館",
    sub: "ELITE INTERNSHIP 3.0 · 大三全學年校外實習（一）（二）共 20 學分",
    summary: {
      zh: "配合高餐大招牌「三明治教學」，大三實施全學年必修「校外實習（一）（二）」（共 20 學分）。「旅館菁英實習計畫 3.0」精選全臺 24 家國際連鎖與本土五星標竿飯店，與校內群賢會館共同匯聚於「09 實習旅館專島」。",
      en: "Supporting NKUHT's signature Sandwich Education, Junior students complete a full-year 20-credit Off-Campus Internship across 24 premier Elite Internship 3.0 partner hotels showcased alongside Qunxian Hall on Island 09.",
    },
    facts: [
      {
        zh: "培訓輪調機制：前 6 個月於客房部（櫃檯、服務中心、客服中心／總機、訂房、商務樓層貴賓廳、房務）培訓，通過考核後自第 7 個月起依五種輪調型態轉調並配置職場導師（Mentor）。",
        en: "Rotation & Mentorship: First 6 months in Rooms Division, followed by rotation from Month 7 with a dedicated workplace Mentor.",
      },
      {
        zh: "兩階段薪酬保障：起（本）薪至少高於勞基法最低工資 5%，實習第 7 個月起調薪新臺幣 1,000 元（含）以上，並享每年 10–12 月優先選才媒合。",
        en: "Pay Guarantee: Starting base pay >= 5% above minimum wage, plus a NT$1,000+ raise from Month 7 and Oct–Dec priority matching.",
      },
      {
        zh: "25 棟等比例星級大樓：點擊下方按鈕即可直飛「09 實習旅館專島」走訪群賢會館與 24 家合作酒店模型，或開啟實習志願收藏夾。",
        en: "25 Uniform 3D Hotel Towers: Fly straight to Island 09 to inspect all 25 3D hotels or save your favorites in the Internship Wishlist.",
      },
    ],
    targetIsland: "sport",
    targetBuilding: "sport-h01",
    plannerTab: "intern",
    officialUrl: "https://hotel.nkuht.edu.tw/p/404-1018-37998.php?Lang=zh-tw",
    officialLabel: { zh: "菁英實習 3.0 合作夥伴名錄 ↗", en: "Elite Internship 3.0 Partners ↗" },
    rx: 10.2,
    rz: 7.5,
    zOffset: -0.6,
    yBase: 4.15,
    yAmp: 0.2,
    speed: 0.145,
    dir: -1,
    phase: 1.45,
    scale: 0.74,
  },
  {
    id: "sky-plane-2",
    badge: "✈️",
    name: {
      zh: "巡航宣導專機 03｜1+3 證照門檻號",
      en: "Cruiser Banner 03 · 1+3 Certificate Navigator",
    },
    category: { zh: "高翼巡航拉布條機", en: "High-Wing Banner Cruiser" },
    schedule: { zh: "05:30–19:30 日間晴空單航道輪播", en: "05:30–19:30 Daytime Single-Corridor Pass" },
    bodyColor: 0x1f4e78,
    wingColor: 0xfdf6e6,
    trimColor: 0xe8b236,
    biplane: false,
    bannerBg: "#173758",
    bannerBorder: "#f0c35a",
    bannerText: "#ffffff",
    bannerSubColor: "#f6d479",
    title: "🎓 1+3 畢業證照門檻｜1 張畢業證書 ＋ 3 張專業與外語證照",
    sub: "A 類外語檢定 ＋ 2 張 B 類證照（或 1 張 C 類中高階國際證照）",
    summary: {
      zh: "依 114 年 5 月 28 日教務會議通過之「國立高雄餐旅大學旅館管理系畢業條件標準表」（111 學年度起入學適用），畢業生除修滿學分外，須通過 A 類外語標準並取得 2 張 B 類證照（或 1 張 C 類中高階證照），鍛造「1 張文憑＋3 張證照」實戰力。",
      en: "Under the official 1+3 Graduation Standard (approved 2025.05.28 for AY 111+ cohorts), graduates pair their diploma with Category A English proficiency plus 2 Category B certificates (or 1 Category C advanced credential).",
    },
    facts: [
      {
        zh: "必備 A 類外語標準：通過相當於多益（TOEIC）600 分（含）以上之外語能力檢定。",
        en: "Required Category A: Foreign language proficiency equivalent to TOEIC 600 or above.",
      },
      {
        zh: "B 類多元專業／外語證照（選 2 張）：涵蓋餐服／客房丙級、AHLEI CGSP、WSET L1、IBA 初級調酒、英式管家、AI-900、PL-900、Google Analytics、TOEIC 700+、JLPT N3+ 等。",
        en: "Category B (Pick 2): Includes MOL Level C, CGSP, WSET L1, IBA Bartending, British Butler, AI-900, GA4, TOEIC 700+, JLPT N3+, and course remedies.",
      },
      {
        zh: "C 類中高階國際證照（1 張抵 2 張 B 類）：涵蓋餐旅乙級、AH&LA CHS／CHDT、WSET L2、TOEIC 850+、JLPT N2+、PL-300 Power BI、AWS AI Practitioner 等。",
        en: "Category C (1 C = 2 B): Includes National Level B, CHS/CHDT, WSET L2, TOEIC 850+, JLPT N2+, PL-300, and AWS Certified AI Practitioner.",
      },
    ],
    targetIsland: "card",
    targetBuilding: "card-culture",
    plannerTab: "sim",
    officialUrl: "https://hotel.nkuht.edu.tw/p/450-1018-38352,c0.php?Lang=zh-tw",
    officialLabel: { zh: "官方 1+3 畢業條件標準表 ↗", en: "Official 1+3 Standard Table ↗" },
    rx: 10.6,
    rz: 7.8,
    zOffset: -1.4,
    yBase: 4.35,
    yAmp: 0.18,
    speed: 0.155,
    dir: 1,
    phase: 2.95,
    scale: 0.72,
  },
  {
    id: "sky-plane-3",
    badge: "🛩️",
    name: {
      zh: "雙翼宣導專機 04｜群賢會館實務號",
      en: "Biplane Banner 04 · Qunxian Practicum Wing",
    },
    category: { zh: "雙翼拉布條宣導機", en: "Sightseeing Banner Biplane" },
    schedule: { zh: "05:30–19:30 日間晴空單航道輪播", en: "05:30–19:30 Daytime Single-Corridor Pass" },
    bodyColor: 0x7b2938,
    wingColor: 0xfaf1df,
    trimColor: 0xe5b13a,
    biplane: true,
    bannerBg: "#fdf5e4",
    bannerBorder: "#8a6116",
    bannerText: "#233830",
    bannerSubColor: "#7b2938",
    title: "🏛️ 校內實習旅館「群賢會館」｜12 間實習客房・OPERA＆德安雙 PMS",
    sub: "SANDWICH EDUCATION · 四年三明治教學・校內實務築基直通國際飯店",
    summary: {
      zh: "「群賢會館」為高餐大校內實習旅館，設有 12 間實習客房，並建置 Oracle OPERA 與德安資訊雙套旅館管理系統（PMS），讓學生在大一、大二修讀「校內實習（一）（二）（三）」時即可在真實接待情境中熟練客務、房務與禮賓流程。",
      en: "Qunxian Practicum Hotel (Elite House) is NKUHT's on-campus training hotel equipped with 12 guestrooms and two PMS platforms (Oracle OPERA PMS and 德安資訊 PMS), preparing freshmen and sophomores for real-world hotel operations.",
    },
    facts: [
      {
        zh: "真實營運場域：設有 12 間實習客房，供示範模擬教學與實務及外賓接待。",
        en: "Live Training Hotel: 12 practicum guestrooms for demonstration teaching, practice and guest reception.",
      },
      {
        zh: "雙島聯動呈現：第 06 島「群賢會館」完整解析客務、房務與營運輪調；第 09 島「實習旅館專島」更將群賢會館置於島嶼核心與 24 家合作飯店同島輝映。",
        en: "Dual-Island Presence: Explore detailed operations on Island 06 or see Qunxian Hall standing at the center of 24 partner hotels on Island 09.",
      },
      {
        zh: "公開規章與預約：系網「群賢會館」專區提供線上訂房連結、導覽預約系統及場地／設備使用管理要點。",
        en: "Booking & Guidelines: Official department portal offers online room booking, guided tour reservations, and venue management rules.",
      },
    ],
    targetIsland: "family",
    targetBuilding: "family-station",
    plannerTab: "intern",
    officialUrl: "https://hotel.nkuht.edu.tw/p/403-1018-608.php?Lang=zh-tw",
    officialLabel: { zh: "群賢會館專區與法規 ↗", en: "Qunxian Hall Portal ↗" },
    rx: 11.2,
    rz: 8.2,
    zOffset: -1.2,
    yBase: 4.65,
    yAmp: 0.22,
    speed: 0.132,
    dir: -1,
    phase: 4.85,
    scale: 0.76,
  },
  {
    id: "sky-plane-4",
    badge: "✈️",
    name: {
      zh: "巡航宣導專機 05｜128 學分跨域號",
      en: "Cruiser Banner 05 · 128-Credit Interdisciplinary Cruiser",
    },
    category: { zh: "高翼巡航拉布條機", en: "High-Wing Banner Cruiser" },
    schedule: { zh: "05:30–19:30 日間晴空單航道輪播", en: "05:30–19:30 Daytime Single-Corridor Pass" },
    bodyColor: 0x2b6e68,
    wingColor: 0xfff9ec,
    trimColor: 0xe6ad2c,
    biplane: false,
    bannerBg: "#184642",
    bannerBorder: "#ecc056",
    bannerText: "#fff9ec",
    bannerSubColor: "#f5cf70",
    title: "🌏 115 學年度 128 學分跨域養成｜服務精神・專業整合・精通外語",
    sub: "10 位專任(案)師資領航 · AI 雲端數位行銷與國際侍酒師雙軌加值",
    summary: {
      zh: "依 115 學年度四技日間部課程標準表，畢業總學分為 128 學分（校訂必修 36、院訂必修 12、系訂必修 55、系訂選修 25），由 10 位專任（案）師長領航，融合旅館營運財務、AI 雲端數位行銷、奢華管家與侍酒品評跨域實務。",
      en: "The AY 115 4-year curriculum totals 128 credits (36 University, 12 College, 55 Department Required, 25 Electives), led by 10 dedicated faculty members across hotel management, AI digital marketing, finance, and beverage arts.",
    },
    facts: [
      {
        zh: "128 學分結構：系訂必修 55 學分內含校內實習與大三全學年校外實習（一）（二）共 20 學分；系訂選修 25 學分至多承認跨系／跨領域微學分 6 學分。",
        en: "128-Credit Structure: Includes 20 credits of Junior off-campus internships and recognizes up to 6 cross-disciplinary micro-credits.",
      },
      {
        zh: "外語免修激勵：TOEIC 850 分（含）以上得申請免修「旅館英文（一）」；JLPT N3（含）以上得申請免修「旅館日文（一）、（二）」（依規定選修補足學分）。",
        en: "Language Exemptions: TOEIC 850+ may exempt Hotel English I; JLPT N3+ may exempt Hotel Japanese I & II per curriculum notes.",
      },
      {
        zh: "10 位專任（案）師資：點擊可前往「04 課程標準表」或「08 專任師資陣容」聆聽師長中英雙語擬真語音導覽。",
        en: "10 Faculty Guides: Jump to Island 04 (Curriculum) or Island 08 (Faculty) for bilingual voice introductions.",
      },
    ],
    targetIsland: "education",
    targetBuilding: "education-class",
    plannerTab: "intern",
    officialUrl: "https://hotel.nkuht.edu.tw/var/file/18/1018/img/455909285.pdf",
    officialLabel: { zh: "下載 115 課程標準表 PDF ↗", en: "AY 115 Curriculum PDF ↗" },
    rx: 9.4,
    rz: 6.9,
    zOffset: 0.0,
    yBase: 3.8,
    yAmp: 0.18,
    speed: 0.156,
    dir: 1,
    phase: 0.35,
    scale: 0.7,
  },
];

const AIRSHIP_SPECS = [
  {
    id: "sky-airship-0",
    badge: "🛸",
    name: {
      zh: "五星禮賓飛船 01｜高餐旅館號",
      en: "Luxury Sky Blimp 01 · Spirit of NKUHT HTL",
    },
    category: { zh: "五星發光禮賓飛船", en: "Illuminated Luxury Sky Blimp" },
    schedule: { zh: "16:00–22:30 黃昏霞光與星夜巡航", en: "16:00–22:30 Sunset & Starlight Cruise" },
    hullColor: 0x153d30,
    stripeColor: 0xeac058,
    finColor: 0x9e3428,
    bannerBg: "#102d23",
    bannerBorder: "#f2ca65",
    bannerText: "#fff7df",
    bannerSubColor: "#f2ca65",
    hullTitle: "國立高雄餐旅大學・旅館管理系",
    hullSub: "NKUHT HOTEL MANAGEMENT · EST. 1995",
    title: "✦ 歡迎蒞臨 高餐大旅館島｜培育國際五星旅宿經營管理領袖 ✦",
    sub: "1995 創科 · 2002 增設四技 · 立體六角群島完整呈現系所特色",
    summary: {
      zh: "「高餐旅館號」為黃昏與星夜時段限定升空的旗艦禮賓飛船，採用高餐旅館深祖母綠與榮耀香檳金塗裝，配備雙側自發光船身看板、暖金觀景座艙與巨幅空中布條，象徵本系引領台灣餐旅高等教育的標竿地位。",
      en: "Cruising during sunset and starlight hours, the emerald-and-gold flagship blimp 'Spirit of NKUHT HTL' features dual illuminated hull signboards, a warm passenger gondola, and a grand sky banner celebrating NKUHT's hospitality leadership.",
    },
    facts: [
      {
        zh: "全島領航視野：串聯 20 座系所主題六角島、133 個真實教學與實習細項，從高空俯瞰大一至大四完整養成藍圖。",
        en: "20-Island Panorama: Overlooks all 20 hexagonal theme islands and 133 verified academic & internship highlights.",
      },
      {
        zh: "夜間光雕模式：切換至「18:00 黃昏」或「21:00 星夜」時段，船身招牌、觀景艙窗與尾曳布條將自動點亮璀璨暖光。",
        en: "Night Illumination: Switch to Sunset or Night mode to watch the hull signboards, gondola windows, and banner glow against the stars.",
      },
    ],
    targetIsland: "institute",
    targetBuilding: "institute-research",
    plannerTab: "sky",
    officialUrl: "https://hotel.nkuht.edu.tw/?Lang=zh-tw",
    officialLabel: { zh: "旅館管理系教育理念與沿革 ↗", en: "NKUHT HTL Overview ↗" },
    rx: 11.8,
    rz: 8.6,
    zOffset: -2.0,
    yBase: 5.05,
    yAmp: 0.16,
    speed: 0.082,
    dir: 1,
    phase: 4.65,
    scale: 0.82,
  },
  {
    id: "sky-airship-1",
    badge: "🛸",
    name: {
      zh: "五星禮賓飛船 02｜群賢領航號",
      en: "Luxury Sky Blimp 02 · Grand Hotel Navigator",
    },
    category: { zh: "五星發光禮賓飛船", en: "Illuminated Luxury Sky Blimp" },
    schedule: { zh: "16:00–22:30 黃昏霞光與星夜巡航", en: "16:00–22:30 Sunset & Starlight Cruise" },
    hullColor: 0xf9f1de,
    stripeColor: 0x1a4738,
    finColor: 0xc99222,
    bannerBg: "#fff8ea",
    bannerBorder: "#1a4738",
    bannerText: "#16352a",
    bannerSubColor: "#9b6c14",
    hullTitle: "GRAND HOTEL · 群賢會館 × 菁英實習 3.0",
    hullSub: "THEORY & PRACTICE · HOSPITALITY EXCELLENCE",
    title: "✦ 群賢會館實務 × 24 家菁英實習合作旅館｜把理論與實務連起來 ✦",
    sub: "服務精神 · 專業整合 · 旅館軟硬體 · 理論實務並重 · 精通外語",
    summary: {
      zh: "「群賢領航號」以象牙珍珠白搭配森林綠腰帶打造，宣導本系最具代表性的「把理論與實務連起來」核心價值——從校內群賢會館 12 間實習客房實作，無縫接軌全臺 24 家菁英實習合作旅館與國際品牌儲備幹部（MT）職涯。",
      en: "Finished in ivory pearl and forest emerald, 'Grand Hotel Navigator' celebrates NKUHT's bridge between theory and practice—connecting Qunxian Hall's 12 training rooms with 24 premier partner hotels and global MT careers.",
    },
    facts: [
      {
        zh: "產學無縫串聯：大二校內實習築基 → 大三菁英實習 3.0（客房部培訓、第 7 個月起輪調與 Mentor 指導）→ 大四高階策略管理與產業學院直通就業。",
        en: "Seamless Career Pipeline: Sophomore Qunxian practicum -> Junior Elite Internship 3.0 -> Senior strategic capstone & fast-track MT placement.",
      },
      {
        zh: "五大教育支柱徽章：布條副標完整呼應系網公告之五大特色培育指標，點擊下方可直飛「09 實習旅館專島」或「10 菁英實習制度」。",
        en: "Five Educational Pillars: Embodies all 5 official program goals; jump directly to Island 09 or Island 10 below.",
      },
    ],
    targetIsland: "sport",
    targetBuilding: "sport-h01",
    plannerTab: "intern",
    officialUrl: "https://hotel.nkuht.edu.tw/p/404-1018-37996.php?Lang=zh-tw",
    officialLabel: { zh: "旅館菁英實習計畫 3.0 專區 ↗", en: "Elite Internship 3.0 Portal ↗" },
    rx: 12.6,
    rz: 9.2,
    zOffset: -2.4,
    yBase: 5.45,
    yAmp: 0.18,
    speed: 0.075,
    dir: -1,
    phase: 1.65,
    scale: 0.8,
  },
];

const BALLOON_SPECS = [
  {
    id: "sky-balloon-0",
    badge: "🎈",
    name: { zh: "主題熱氣球 01｜高餐大旅館管理系", en: "Hot Air Balloon 01 · NKUHT Hotel Management" },
    category: { zh: "八彩光雕主題熱氣球", en: "Night-Glow Theme Hot Air Balloon" },
    schedule: { zh: "晨飛 05:30–09:00 ／ 霞光光雕 16:00–22:30", en: "Dawn Fiesta & Sunset / Night-Glow" },
    colors: [0x174b3b, 0xecc056, 0xfdf6e4, 0xc84b38],
    sashBg: "#13382c",
    sashBorder: "#ecc056",
    sashText: "#fff8e6",
    label: "高餐大旅館管理系 · NKUHT HTL",
    sub: "DEPARTMENT OF HOTEL MANAGEMENT · EST. 1995",
    summary: {
      zh: "以高餐旅館經典綠金紅四色球皮縫製的主題熱氣球，360 度環繞腰帶印有「高餐大旅館管理系 · NKUHT HTL」，於清晨與黃昏星夜緩緩升空，夜晚更會隨燃燒器噴火呈現溫暖燈籠光雕效果。",
      en: "Crafted in NKUHT's signature emerald, gold, cream, and coral gores with a 360° wrap-around sash, glowing like a sky lantern with rhythmic burner bursts at dusk and night.",
    },
    facts: [
      { zh: "對應主題島：01 系務核心與歷史沿革（第一教學大樓 F 棟系辦、導師制與系學會傳統）。", en: "Linked Island: 01 Department Core & History (F Building HQ, mentorship & student association)." },
      { zh: "光雕互動：點擊上方「🔥 噴火光雕致敬」可立即點燃熱氣球火焰並欣賞球體內部暖光呼吸燈效！", en: "Interactive Burner: Click 'Burner Glow Salute' above to fire a bright Night-Glow flame burst!" },
    ],
    targetIsland: "civil",
    targetBuilding: "civil-office",
    plannerTab: "sky",
    officialUrl: "https://hotel.nkuht.edu.tw/?Lang=zh-tw",
    officialLabel: { zh: "旅館管理系官網首頁 ↗", en: "Department Home ↗" },
    freq: 0.42,
    phase: 0.0,
    scale: 0.78,
  },
  {
    id: "sky-balloon-1",
    badge: "🎈",
    name: { zh: "主題熱氣球 02｜群賢會館・12 間客房", en: "Hot Air Balloon 02 · Qunxian Hall 12 Rooms" },
    category: { zh: "八彩光雕主題熱氣球", en: "Night-Glow Theme Hot Air Balloon" },
    schedule: { zh: "晨飛 05:30–09:00 ／ 霞光光雕 16:00–22:30", en: "Dawn Fiesta & Sunset / Night-Glow" },
    colors: [0xd6543e, 0xfff6e5, 0xe8ad2d, 0xfff6e5],
    sashBg: "#fff8eb",
    sashBorder: "#c84b38",
    sashText: "#17352b",
    label: "群賢會館 · 12 間實習客房",
    sub: "ON-CAMPUS PRACTICUM HOTEL · 12 PRACTICUM ROOMS & DUAL PMS",
    summary: {
      zh: "暖陽珊瑚橘與香檳金配色的「群賢會館」主題熱氣球，象徵大一、大二學生於校內 12 間實習客房中紮實演練客務接待與房務實作的熱情與專業。",
      en: "Finished in warm coral and champagne gold, celebrating NKUHT's 12-room on-campus Qunxian Practicum Hotel where students master Front Office and Housekeeping operations.",
    },
    facts: [
      { zh: "校內實務核心：12 間實習客房與 Oracle OPERA PMS、德安資訊 PMS 雙系統，支援客務、房務與校內實習課程。", en: "Practicum Core: 12 guestrooms with Oracle OPERA PMS and De-An PMS supporting Front Office, Housekeeping and on-campus practicum courses." },
      { zh: "快速跳轉：可前往「06 群賢會館」查看營運細項，或前往「09 實習旅館專島」中央定位群賢會館大樓。", en: "Quick Jump: Visit Island 06 for operational details or locate Qunxian Hall at the center of Island 09." },
    ],
    targetIsland: "family",
    targetBuilding: "family-station",
    plannerTab: "intern",
    officialUrl: "https://hotel.nkuht.edu.tw/p/403-1018-608.php?Lang=zh-tw",
    officialLabel: { zh: "群賢會館專區 ↗", en: "Qunxian Hall Portal ↗" },
    freq: 0.38,
    phase: 1.3,
    scale: 0.75,
  },
  {
    id: "sky-balloon-2",
    badge: "🎈",
    name: { zh: "主題熱氣球 03｜菁英實習 3.0・24 家標竿旅館", en: "Hot Air Balloon 03 · Elite Internship 3.0" },
    category: { zh: "八彩光雕主題熱氣球", en: "Night-Glow Theme Hot Air Balloon" },
    schedule: { zh: "晨飛 05:30–09:00 ／ 霞光光雕 16:00–22:30", en: "Dawn Fiesta & Sunset / Night-Glow" },
    colors: [0x1f4e78, 0xf2c659, 0xfaf3e3, 0x2e6f95],
    sashBg: "#163858",
    sashBorder: "#f2c659",
    sashText: "#ffffff",
    label: "菁英實習 3.0 · 24 家標竿旅館",
    sub: "24 PREMIER PARTNER HOTELS · JUNIOR 20-CREDIT INTERNSHIP",
    summary: {
      zh: "皇家海藍與金黃條紋熱氣球，代表大三全學年「旅館菁英實習計畫 3.0」串聯萬豪、洲際、香格里拉、凱悅、文華東方、嘉佩樂、星野等 24 家頂級國際與本土觀光飯店。",
      en: "Royal navy and gold stripes honor the 24 premier global and domestic partner hotels in NKUHT's Junior-year Elite Internship Program 3.0.",
    },
    facts: [
      { zh: "同島無分區呈現：24 家合作酒店與群賢會館共 25 棟等比例 3D 飯店大樓齊聚於「09 實習旅館專島」。", en: "Unified 25-Hotel Island: All 24 partner hotels and Qunxian Hall stand at equal scale on Island 09." },
      { zh: "志願收藏互動：點擊上方規劃器按鈕可將心儀實習飯店加入「我的實習志願」清單！", en: "Wishlist Planner: Open the Internship Planner above to bookmark your dream partner hotels!" },
    ],
    targetIsland: "sport",
    targetBuilding: "sport-h01",
    plannerTab: "intern",
    officialUrl: "https://hotel.nkuht.edu.tw/p/404-1018-37998.php?Lang=zh-tw",
    officialLabel: { zh: "24 家合作旅館名單 ↗", en: "24 Partner Hotels List ↗" },
    freq: 0.36,
    phase: 2.4,
    scale: 0.78,
  },
  {
    id: "sky-balloon-3",
    badge: "🎈",
    name: { zh: "主題熱氣球 04｜1+3 畢業證照・跨域競爭力", en: "Hot Air Balloon 04 · 1+3 Graduation Certificates" },
    category: { zh: "八彩光雕主題熱氣球", en: "Night-Glow Theme Hot Air Balloon" },
    schedule: { zh: "晨飛 05:30–09:00 ／ 霞光光雕 16:00–22:30", en: "Dawn Fiesta & Sunset / Night-Glow" },
    colors: [0x2a7558, 0xf6cf69, 0xfff9ec, 0x1a4f3b],
    sashBg: "#184534",
    sashBorder: "#f6cf69",
    sashText: "#fff9ec",
    label: "1+3 畢業證照 · 跨域競爭力",
    sub: "DIPLOMA + CAT A ENGLISH + 2 CAT B / 1 CAT C CERTIFICATES",
    summary: {
      zh: "翠玉綠與香檳金熱氣球，象徵本系「1 張畢業證書 ＋ 3 張外語與專業證照」之畢業門檻制度，涵蓋餐旅實務、侍酒調飲與 AI 雲端數位行銷多元認證。",
      en: "Emerald and gold balloon highlighting NKUHT's 1+3 Graduation Certificate system combining English proficiency, hospitality licenses, wine sommelier awards, and AI/cloud certifications.",
    },
    facts: [
      { zh: "即時門檻試算：點擊上方「🧮 開啟 1+3 證照試算器」即可勾選 TOEIC、丙級、WSET、AI-900 立即檢核畢業資格！", en: "Interactive Simulator: Launch the 1+3 Certificate Simulator above to test your graduation eligibility in real time!" },
      { zh: "對應主題島：07 畢業條件（1+3 證照標準表與大四配套措施）。", en: "Linked Island: 07 Graduation Requirements (1+3 Standard Table & Senior Course Remedies)." },
    ],
    targetIsland: "card",
    targetBuilding: "card-culture",
    plannerTab: "sim",
    officialUrl: "https://hotel.nkuht.edu.tw/p/450-1018-38352,c0.php?Lang=zh-tw",
    officialLabel: { zh: "畢業條件標準表專區 ↗", en: "1+3 Requirements Portal ↗" },
    freq: 0.44,
    phase: 3.6,
    scale: 0.74,
  },
  {
    id: "sky-balloon-4",
    badge: "🎈",
    name: { zh: "主題熱氣球 05｜四年三明治教學・務實致用", en: "Hot Air Balloon 05 · 4-Year Sandwich Education" },
    category: { zh: "八彩光雕主題熱氣球", en: "Night-Glow Theme Hot Air Balloon" },
    schedule: { zh: "晨飛 05:30–09:00 ／ 霞光光雕 16:00–22:30", en: "Dawn Fiesta & Sunset / Night-Glow" },
    colors: [0x7c2d46, 0xf4cb68, 0xfdf5e6, 0xb85252],
    sashBg: "#5d1f33",
    sashBorder: "#f4cb68",
    sashText: "#fff7e4",
    label: "四年三明治教學 · 務實致用",
    sub: "CAMPUS LEARNING → JUNIOR INTERNSHIP → SENIOR CAPSTONE",
    summary: {
      zh: "勃根地酒紅與暖金熱氣球，詮釋高餐大獨具特色的「三明治教學法」：大一與大二校內理論實作築基、大三全學年業界實習驗證、大四返校深化經營策略與營收管理。",
      en: "Burgundy and gold balloon representing NKUHT's signature Sandwich Education: Years 1–2 campus foundation, Year 3 full-year industry internship, and Year 4 executive management capstone.",
    },
    facts: [
      { zh: "雙導師與定期訪視：實習期間由班級實習輔導教師定期赴各合作飯店實地訪視關懷，把關學習品質。", en: "Faculty Site Visits: Dedicated faculty advisors conduct regular on-site visits to support interns nationwide." },
      { zh: "對應主題島：03 三明治教學與實習動線（四年進階塔與黃金雙塔拱橋）。", en: "Linked Island: 03 Sandwich Education & Internship Pathways." },
    ],
    targetIsland: "transport",
    targetBuilding: "transport-bridge",
    plannerTab: "intern",
    officialUrl: "https://hotel.nkuht.edu.tw/?Lang=zh-tw",
    officialLabel: { zh: "系所教學特色介紹 ↗", en: "Sandwich Program Info ↗" },
    freq: 0.4,
    phase: 4.5,
    scale: 0.75,
  },
  {
    id: "sky-balloon-5",
    badge: "🎈",
    name: { zh: "主題熱氣球 06｜OPERA＆德安雙 PMS・智慧旅宿", en: "Hot Air Balloon 06 · Dual PMS & Smart Hospitality" },
    category: { zh: "八彩光雕主題熱氣球", en: "Night-Glow Theme Hot Air Balloon" },
    schedule: { zh: "晨飛 05:30–09:00 ／ 霞光光雕 16:00–22:30", en: "Dawn Fiesta & Sunset / Night-Glow" },
    colors: [0x287271, 0xefb843, 0xfef8ea, 0x3e928f],
    sashBg: "#194b4a",
    sashBorder: "#efb843",
    sashText: "#fff9ec",
    label: "OPERA＆德安雙 PMS · 智慧旅宿",
    sub: "OPERA & 德安 (DE-AN) PMS · BLDG D 8F SMART INNOVATION BASE",
    summary: {
      zh: "青碧藍綠與琥珀金熱氣球，展現本系「旅館軟硬體」與數位智慧轉型實力——結合 Oracle OPERA PMS 與德安資訊 PMS、D 棟 8 樓數位智慧服務與創新基地（含 D808 智能服務中心）及 AIoT 智慧客房應用。",
      en: "Teal and amber balloon showcasing NKUHT's hotel technology ecosystem—combining OPERA & 德安 (De-An) PMS training with the Building D 8F Digital Innovation Base (incl. the D808 Smart Service Lab) and AIoT smart hospitality.",
    },
    facts: [
      { zh: "雙軌系統實作：系訂必修涵蓋「旅館資產管理系統與操作實務」，無縫對接國際連鎖與本土五星飯店前台作業。", en: "Dual-Track PMS Labs: Required hands-on PMS courses prepare students for both international chains and domestic luxury hotels." },
      { zh: "對應主題島：16 旅館資訊系統（PMS）與 19 數位智慧服務與創新基地（D 棟 8 樓）。", en: "Linked Islands: 16 Hotel PMS Systems & 19 Smart Hospitality Innovation Base (Bldg D 8F)." },
    ],
    targetIsland: "ai",
    targetBuilding: "ai-cluster",
    plannerTab: "sim",
    officialUrl: "https://hotel.nkuht.edu.tw/?Lang=zh-tw",
    officialLabel: { zh: "專業教室與數位資源 ↗", en: "PMS & Smart Labs ↗" },
    freq: 0.39,
    phase: 5.2,
    scale: 0.74,
  },
  {
    id: "sky-balloon-6",
    badge: "🎈",
    name: { zh: "主題熱氣球 07｜精通英日外語・國際移動力", en: "Hot Air Balloon 07 · English & Japanese Global Mobility" },
    category: { zh: "八彩光雕主題熱氣球", en: "Night-Glow Theme Hot Air Balloon" },
    schedule: { zh: "晨飛 05:30–09:00 ／ 霞光光雕 16:00–22:30", en: "Dawn Fiesta & Sunset / Night-Glow" },
    colors: [0x5a3e7a, 0xf3c862, 0xfcf6ea, 0x845ec2],
    sashBg: "#3d2757",
    sashBorder: "#f3c862",
    sashText: "#fff8eb",
    label: "精通英日外語 · 國際移動力",
    sub: "HOTEL ENGLISH & JAPANESE · OVERSEAS INTERNSHIPS & STUDY",
    summary: {
      zh: "皇家紫與璀璨金熱氣球，象徵本系「精通外語」與跨國移動力——從必修旅館英文（一）、旅館日文（一）（二）與進階、高階旅館英日文選修，延伸至新加坡、日本等國（海）外實習、澳洲與美加研修及海外參訪。",
      en: "Regal violet and gold balloon celebrating foreign language mastery in Hotel English & Japanese alongside overseas luxury hotel internships and international field studies.",
    },
    facts: [
      { zh: "英日雙語深耕：開設旅館英文、旅館日文及大四進階／高階英日文課程，銜接國際外賓禮賓接待。", en: "Bilingual Curriculum: Progressive Hotel English and Hotel Japanese courses tailored for international VIP guest service." },
      { zh: "海外實習與參訪：每年 10–12 月優先選才納入國（海）外實習及研習，並開設海外參訪（一）（二）選修。", en: "Global Exchange: Priority selection supports overseas hotel internships alongside Field Study I & II courses." },
    ],
    targetIsland: "diplomacy",
    targetBuilding: "diplomacy-exchange",
    plannerTab: "intern",
    officialUrl: "https://hotel.nkuht.edu.tw/?Lang=zh-tw",
    officialLabel: { zh: "國際交流與海外實習 ↗", en: "Global Exchange Info ↗" },
    freq: 0.43,
    phase: 0.9,
    scale: 0.73,
  },
  {
    id: "sky-balloon-7",
    badge: "🎈",
    name: { zh: "主題熱氣球 08｜服務精神・款待之心 EST.1995", en: "Hot Air Balloon 08 · Heart of Hospitality Est. 1995" },
    category: { zh: "八彩光雕主題熱氣球", en: "Night-Glow Theme Hot Air Balloon" },
    schedule: { zh: "晨飛 05:30–09:00 ／ 霞光光雕 16:00–22:30", en: "Dawn Fiesta & Sunset / Night-Glow" },
    colors: [0xd97236, 0xfff5e2, 0xe3a82b, 0xb8432e],
    sashBg: "#fdf4e2",
    sashBorder: "#b8432e",
    sashText: "#1c362c",
    label: "服務精神 · 款待之心 EST.1995",
    sub: "GOLD TOUCH BUTLER · LUXURY EXPERIENCE MICRO-CREDITS",
    summary: {
      zh: "暖陽橘金與象牙白熱氣球，傳遞高餐旅館自 1995 年創科以來不變的「款待之心（Heart of Hospitality）」——結合奢華體驗管理微學分、金鑰匙管家精神與永續旅宿治理。",
      en: "Warm amber-orange and ivory balloon embodying NKUHT's enduring Heart of Hospitality since 1995—uniting Luxury Experience micro-credits, Gold Key butler service, and sustainable ESG hospitality.",
    },
    facts: [
      { zh: "奢華款待美學：開設 8 門奢華體驗管理微學分（如奢華酒店管家服務、旅館禮賓諮詢技巧、客房向上銷售技巧），並推動 S3 實習旅館神秘客培訓與反饋。", en: "Luxury Micro-Credits: 8 courses such as Luxury Hotel Butler Service, Hotel Concierge Consultation Skills and Room Upselling Skills, plus the S3 Mystery Guest training." },
      { zh: "對應主題島：18 奢華體驗與金鑰匙管家、20 永續旅宿治理與 USR。", en: "Linked Islands: 18 Luxury Experience & Gold Key Butler and 20 Sustainable Hospitality & USR." },
    ],
    targetIsland: "luxury",
    targetBuilding: "luxury-micro",
    plannerTab: "sky",
    officialUrl: "https://hotel.nkuht.edu.tw/?Lang=zh-tw",
    officialLabel: { zh: "旅館管理系官方網站 ↗", en: "Department Official Site ↗" },
    freq: 0.41,
    phase: 2.9,
    scale: 0.75,
  },
];

// Distant sea-sky horizon flank slots (framed cleanly below top HUD/toolbar and clear of all islands & sidebar)
const BALLOON_FLANK_SLOTS = [
  { x: -9.8, y: 2.55, z: -4.8, driftX: 0.5, driftZ: 0.38, bobAmp: 0.14 },
  { x: 4.8, y: 2.42, z: -5.2, driftX: 0.5, driftZ: 0.38, bobAmp: 0.14 },
];

function makeBannerTexture(THREE, spec) {
  const W = 1280,
    H = 256;
  const cv = document.createElement("canvas");
  cv.width = W;
  cv.height = H;
  const g = cv.getContext("2d");

  g.clearRect(0, 0, W, H);

  const pad = 8;
  g.fillStyle = spec.bannerBg;
  roundRect(g, pad, pad, W - pad * 2, H - pad * 2, 22);
  g.fill();

  // Outer gold border + inner hairline
  g.lineWidth = 8;
  g.strokeStyle = spec.bannerBorder;
  roundRect(g, pad + 4, pad + 4, W - (pad + 4) * 2, H - (pad + 4) * 2, 18);
  g.stroke();

  g.lineWidth = 2.5;
  g.strokeStyle = spec.bannerBorder;
  g.globalAlpha = 0.55;
  roundRect(g, pad + 16, pad + 16, W - (pad + 16) * 2, H - (pad + 16) * 2, 12);
  g.stroke();
  g.globalAlpha = 1;

  // Decorative side vertical end-caps
  g.fillStyle = spec.bannerBorder;
  g.fillRect(pad + 4, pad + 4, 22, H - (pad + 4) * 2);
  g.fillRect(W - pad - 26, pad + 4, 22, H - (pad + 4) * 2);

  // Main headline
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillStyle = spec.bannerText;
  g.font = "900 48px 'Noto Sans TC', 'Microsoft JhengHei', 'PingFang TC', sans-serif";
  g.fillText(spec.title, W / 2, H * 0.41, W - 120);

  // Sub-headline
  g.fillStyle = spec.bannerSubColor;
  g.font = "800 27px 'Plus Jakarta Sans', 'Noto Sans TC', 'Microsoft JhengHei', sans-serif";
  g.fillText(spec.sub, W / 2, H * 0.75, W - 130);

  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function makeSashTexture(THREE, spec) {
  const W = 2400,
    H = 224;
  const cv = document.createElement("canvas");
  cv.width = W;
  cv.height = H;
  const g = cv.getContext("2d");

  g.fillStyle = spec.sashBg;
  g.fillRect(0, 0, W, H);

  g.fillStyle = spec.sashBorder;
  g.fillRect(0, 0, W, 16);
  g.fillRect(0, H - 16, W, 16);

  g.fillStyle = spec.sashText;
  g.font = "900 50px 'Noto Sans TC', 'Microsoft JhengHei', sans-serif";
  g.textAlign = "center";
  g.textBaseline = "middle";
  // Repeat 3 times around the 360-degree cylinder so every viewing angle shows the full slogan clearly
  for (const frac of [1 / 6, 3 / 6, 5 / 6]) {
    g.fillText(`✦ ${spec.label} ✦`, W * frac, H * 0.52, W * 0.31);
  }

  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.anisotropy = 4;
  return tex;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// Build double-sided non-mirrored waving cloth banner trailing along -Z (from z = -zStart to z = -zStart - width)
function buildTrailingBanner(THREE, tex, { zStart, width, height, ropeAnchorY = 0 }) {
  const holder = new THREE.Group();
  const segX = 24,
    segY = 2;

  const mat = new THREE.MeshStandardMaterial({
    map: tex,
    roughness: 0.55,
    metalness: 0.04,
    emissive: new THREE.Color(0xffffff),
    emissiveMap: tex,
    emissiveIntensity: 0.28,
    side: THREE.FrontSide,
  });

  // Side A: faces Local -X (visible & left-to-right when flying West -> East, yaw ~ +pi/2)
  const geoA = new THREE.PlaneGeometry(width, height, segX, segY);
  // Side B: faces Local +X (visible & left-to-right when flying East -> West, yaw ~ -pi/2)
  const geoB = new THREE.PlaneGeometry(width, height, segX, segY);

  const meshA = new THREE.Mesh(geoA, mat);
  meshA.rotation.y = -Math.PI / 2;
  meshA.position.set(-0.012, ropeAnchorY, -zStart - width / 2);

  const meshB = new THREE.Mesh(geoB, mat);
  meshB.rotation.y = Math.PI / 2;
  meshB.position.set(0.012, ropeAnchorY, -zStart - width / 2);

  // Leading rigid spreader bar + tow V-ropes from aircraft tail
  const barMat = new THREE.MeshStandardMaterial({ color: 0xd9a432, roughness: 0.4, metalness: 0.5 });
  const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, height * 0.96, 6), barMat);
  bar.position.set(0, ropeAnchorY, -zStart + 0.02);
  holder.add(bar, meshA, meshB);

  const ropeMat = new THREE.LineBasicMaterial({ color: 0xcfa23e, transparent: true, opacity: 0.85 });
  const tailZ = Math.max(0.35, zStart - 0.85);
  const ropePts = [
    new THREE.Vector3(0, ropeAnchorY, -tailZ),
    new THREE.Vector3(0, ropeAnchorY + height * 0.44, -zStart + 0.02),
    new THREE.Vector3(0, ropeAnchorY, -tailZ),
    new THREE.Vector3(0, ropeAnchorY - height * 0.44, -zStart + 0.02),
  ];
  const ropeGeo = new THREE.BufferGeometry().setFromPoints(ropePts);
  const ropes = new THREE.LineSegments(ropeGeo, ropeMat);
  holder.add(ropes);

  const baseA = geoA.attributes.position.array.slice();
  const baseB = geoB.attributes.position.array.slice();

  const wave = (time, turnBend = 0, ampBoost = 1) => {
    const posA = geoA.attributes.position;
    const posB = geoB.attributes.position;
    for (let i = 0; i < posA.count; i++) {
      const pxA = baseA[i * 3];
      const pyA = baseA[i * 3 + 1];
      const dA = Math.max(0, Math.min(1, (width * 0.5 - pxA) / width));
      const flutterA =
        (Math.sin(dA * 7.5 - time * 7.8) * 0.09 * Math.pow(dA, 1.15) +
          Math.sin(dA * 13.0 - time * 11.5 + pyA * 2.0) * 0.025 * dA) *
          ampBoost +
        turnBend * dA * dA;
      posA.setZ(i, -flutterA);

      const pxB = baseB[i * 3];
      const pyB = baseB[i * 3 + 1];
      const dB = Math.max(0, Math.min(1, (pxB + width * 0.5) / width));
      const flutterB =
        (Math.sin(dB * 7.5 - time * 7.8) * 0.09 * Math.pow(dB, 1.15) +
          Math.sin(dB * 13.0 - time * 11.5 + pyB * 2.0) * 0.025 * dB) *
          ampBoost +
        turnBend * dB * dB;
      posB.setZ(i, flutterB);
    }
    posA.needsUpdate = true;
    posB.needsUpdate = true;
  };

  return { holder, mat, wave, meshA, meshB };
}

function makeHitboxMat(THREE) {
  return new THREE.MeshBasicMaterial({
    transparent: true,
    opacity: 0,
    depthWrite: false,
    colorWrite: false,
    side: THREE.DoubleSide,
  });
}

function buildPlane(THREE, spec, skyIndex, hitMat) {
  const root = new THREE.Group();
  root.rotation.order = "YXZ";
  const craft = new THREE.Group();
  root.add(craft);

  const bodyMat = new THREE.MeshStandardMaterial({ color: spec.bodyColor, roughness: 0.45, metalness: 0.12 });
  const wingMat = new THREE.MeshStandardMaterial({ color: spec.wingColor, roughness: 0.55, metalness: 0.05 });
  const trimMat = new THREE.MeshStandardMaterial({ color: spec.trimColor, roughness: 0.35, metalness: 0.35 });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x222c2a, roughness: 0.7 });
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x9ad8eb,
    roughness: 0.15,
    metalness: 0.25,
    emissive: new THREE.Color(0xffdfa0),
    emissiveIntensity: 0.15,
  });

  const fuse = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.09, 1.08, 10), bodyMat);
  fuse.rotation.x = Math.PI / 2;
  craft.add(fuse);

  const cowl = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.155, 0.22, 10), trimMat);
  cowl.rotation.x = Math.PI / 2;
  cowl.position.z = 0.62;
  craft.add(cowl);

  const spinner = new THREE.Mesh(new THREE.ConeGeometry(0.085, 0.16, 8), trimMat);
  spinner.rotation.x = Math.PI / 2;
  spinner.position.z = 0.78;
  craft.add(spinner);

  const canopy = new THREE.Mesh(new THREE.SphereGeometry(0.125, 10, 8), glassMat);
  canopy.scale.set(0.9, 0.78, 1.55);
  canopy.position.set(0, 0.13, 0.12);
  craft.add(canopy);

  const mainWing = new THREE.Mesh(new THREE.BoxGeometry(1.68, 0.04, 0.32), wingMat);
  mainWing.position.set(0, spec.biplane ? 0.22 : 0.14, 0.14);
  craft.add(mainWing);

  const wingStripe = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.044, 0.07), trimMat);
  wingStripe.position.copy(mainWing.position).setZ(0.24);
  craft.add(wingStripe);

  if (spec.biplane) {
    const lowWing = new THREE.Mesh(new THREE.BoxGeometry(1.48, 0.038, 0.28), wingMat);
    lowWing.position.set(0, -0.08, 0.1);
    craft.add(lowWing);
    for (const sx of [-0.52, 0.52, -0.18, 0.18]) {
      const strut = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.3, 5), trimMat);
      strut.position.set(sx, 0.07, 0.12);
      craft.add(strut);
    }
  } else {
    for (const sx of [-0.36, 0.36]) {
      const strut = new THREE.Mesh(new THREE.CylinderGeometry(0.013, 0.013, 0.26, 5), trimMat);
      strut.rotation.z = sx > 0 ? -0.65 : 0.65;
      strut.position.set(sx * 0.65, 0.03, 0.12);
      craft.add(strut);
    }
  }

  const hStab = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.032, 0.2), wingMat);
  hStab.position.set(0, 0.04, -0.46);
  const vFin = new THREE.Mesh(new THREE.BoxGeometry(0.036, 0.28, 0.24), trimMat);
  vFin.position.set(0, 0.16, -0.45);
  craft.add(hStab, vFin);

  for (const sx of [-0.17, 0.17]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.18, 5), darkMat);
    leg.position.set(sx, -0.16, 0.24);
    const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.035, 8), darkMat);
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(sx, -0.25, 0.24);
    craft.add(leg, wheel);
  }

  const prop = new THREE.Group();
  prop.position.set(0, 0, 0.74);
  const blade1 = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.052, 0.014), darkMat);
  const blade2 = new THREE.Mesh(new THREE.BoxGeometry(0.052, 0.56, 0.014), trimMat);
  prop.add(blade1, blade2);
  craft.add(prop);

  const navPort = new THREE.Mesh(new THREE.SphereGeometry(0.038, 6, 6), new THREE.MeshBasicMaterial({ color: 0xff3b30 }));
  navPort.position.set(0.84, mainWing.position.y, 0.14);
  const navStar = new THREE.Mesh(new THREE.SphereGeometry(0.038, 6, 6), new THREE.MeshBasicMaterial({ color: 0x30d158 }));
  navStar.position.set(-0.84, mainWing.position.y, 0.14);
  const strobeMat = new THREE.MeshBasicMaterial({ color: 0xfff6cc, transparent: true, opacity: 0.9 });
  const strobe = new THREE.Mesh(new THREE.SphereGeometry(0.042, 6, 6), strobeMat);
  strobe.position.set(0, 0.31, -0.48);
  craft.add(navPort, navStar, strobe);

  // Towed Promotional Banner
  const tex = makeBannerTexture(THREE, spec);
  const banner = buildTrailingBanner(THREE, tex, { zStart: 1.35, width: 4.85, height: 0.96, ropeAnchorY: 0.02 });
  root.add(banner.holder);

  // Generous invisible raycast hitbox spanning fuselage + wings + tow ropes + entire 4.85m fluttering banner
  const pickMesh = new THREE.Mesh(new THREE.BoxGeometry(1.9, 1.48, 7.65), hitMat);
  pickMesh.position.set(0, 0.04, -2.75);
  pickMesh.visible = false;
  pickMesh.userData = { type: "skyCraft", id: spec.id, skyKind: "plane", skyIndex };
  root.add(pickMesh);

  root.scale.setScalar(spec.scale || 0.9);
  return { id: spec.id, kind: "plane", index: skyIndex, root, craft, prop, glassMat, strobeMat, banner, pickMesh, spec };
}

function buildAirship(THREE, spec, skyIndex, hitMat) {
  const root = new THREE.Group();
  root.rotation.order = "YXZ";
  const ship = new THREE.Group();
  root.add(ship);

  const hullMat = new THREE.MeshStandardMaterial({
    color: spec.hullColor,
    roughness: 0.42,
    metalness: 0.08,
    emissive: new THREE.Color(spec.hullColor),
    emissiveIntensity: 0.06,
  });
  const stripeMat = new THREE.MeshStandardMaterial({
    color: spec.stripeColor,
    roughness: 0.35,
    metalness: 0.3,
    emissive: new THREE.Color(spec.stripeColor),
    emissiveIntensity: 0.12,
  });
  const finMat = new THREE.MeshStandardMaterial({ color: spec.finColor, roughness: 0.48 });

  const hull = new THREE.Mesh(new THREE.SphereGeometry(0.68, 24, 16), hullMat);
  hull.scale.set(1.0, 0.96, 2.35);
  ship.add(hull);

  const belt = new THREE.Mesh(new THREE.SphereGeometry(0.688, 24, 12, 0, Math.PI * 2, Math.PI * 0.43, Math.PI * 0.14), stripeMat);
  belt.scale.set(1.002, 0.962, 2.352);
  ship.add(belt);

  const hullSignTex = makeBannerTexture(THREE, {
    bannerBg: spec.bannerBg,
    bannerBorder: spec.bannerBorder,
    bannerText: spec.bannerText,
    bannerSubColor: spec.bannerSubColor,
    title: spec.hullTitle,
    sub: spec.hullSub,
  });
  const signMat = new THREE.MeshStandardMaterial({
    map: hullSignTex,
    roughness: 0.4,
    emissive: new THREE.Color(0xffffff),
    emissiveMap: hullSignTex,
    emissiveIntensity: 0.35,
  });
  const signGeo = new THREE.PlaneGeometry(1.75, 0.38);
  const signRight = new THREE.Mesh(signGeo, signMat);
  signRight.rotation.y = -Math.PI / 2;
  signRight.position.set(-0.69, 0.04, 0.05);
  const signLeft = new THREE.Mesh(signGeo, signMat);
  signLeft.rotation.y = Math.PI / 2;
  signLeft.position.set(0.69, 0.04, 0.05);
  ship.add(signRight, signLeft);

  for (const [rx, ry, rz, px, py] of [
    [0, 0, 0, 0, 0.44],
    [0, 0, 0, 0, -0.44],
    [0, 0, Math.PI / 2, 0.46, 0],
    [0, 0, Math.PI / 2, -0.46, 0],
  ]) {
    const fin = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.42, 0.56), finMat);
    fin.rotation.set(rx, ry, rz);
    fin.position.set(px, py, -1.25);
    ship.add(fin);
  }

  const gondMat = new THREE.MeshStandardMaterial({ color: 0x263832, roughness: 0.5 });
  const gond = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.22, 0.86), gondMat);
  gond.position.set(0, -0.72, 0.08);
  ship.add(gond);

  const winMat = new THREE.MeshBasicMaterial({ color: 0xffe6a3 });
  const winStripL = new THREE.Mesh(new THREE.PlaneGeometry(0.68, 0.09), winMat);
  winStripL.rotation.y = Math.PI / 2;
  winStripL.position.set(0.165, -0.7, 0.08);
  const winStripR = new THREE.Mesh(new THREE.PlaneGeometry(0.68, 0.09), winMat);
  winStripR.rotation.y = -Math.PI / 2;
  winStripR.position.set(-0.165, -0.7, 0.08);
  ship.add(winStripL, winStripR);

  // Trailing sky-banner behind the blimp
  const tex = makeBannerTexture(THREE, spec);
  const banner = buildTrailingBanner(THREE, tex, { zStart: 2.35, width: 5.4, height: 1.05, ropeAnchorY: 0 });
  root.add(banner.holder);

  // Generous invisible raycast hitbox spanning blimp envelope + gondola + entire 5.4m sky banner
  const pickMesh = new THREE.Mesh(new THREE.BoxGeometry(2.05, 1.95, 10.1), hitMat);
  pickMesh.position.set(0, -0.05, -3.15);
  pickMesh.visible = false;
  pickMesh.userData = { type: "skyCraft", id: spec.id, skyKind: "airship", skyIndex };
  root.add(pickMesh);

  root.scale.setScalar(spec.scale || 1.05);
  return { id: spec.id, kind: "airship", index: skyIndex, root, ship, hullMat, signMat, banner, pickMesh, spec };
}

function buildHotAirBalloon(THREE, spec, skyIndex, hitMat) {
  const root = new THREE.Group();

  const radialSegs = 24;
  const profile = [
    new THREE.Vector2(0.0, -0.78),
    new THREE.Vector2(0.24, -0.74),
    new THREE.Vector2(0.46, -0.45),
    new THREE.Vector2(0.72, -0.05),
    new THREE.Vector2(0.88, 0.36),
    new THREE.Vector2(0.86, 0.72),
    new THREE.Vector2(0.68, 1.02),
    new THREE.Vector2(0.36, 1.2),
    new THREE.Vector2(0.0, 1.26),
  ];
  const envGeo = new THREE.LatheGeometry(profile, radialSegs).toNonIndexed();
  const pos = envGeo.attributes.position;
  const cols = new Float32Array(pos.count * 3);
  const palette = spec.colors.map((h) => new THREE.Color(h));

  for (let i = 0; i < pos.count; i += 3) {
    const mx = (pos.getX(i) + pos.getX(i + 1) + pos.getX(i + 2)) / 3;
    const my = (pos.getY(i) + pos.getY(i + 1) + pos.getY(i + 2)) / 3;
    const mz = (pos.getZ(i) + pos.getZ(i + 1) + pos.getZ(i + 2)) / 3;
    const ang = (Math.atan2(mz, mx) + Math.PI) / (Math.PI * 2);
    const goreIdx = Math.floor(ang * 12) % palette.length;
    const c = (my > 1.06 || my < -0.58 ? palette[1] : palette[goreIdx]).clone();
    for (let k = 0; k < 3; k++) {
      cols[(i + k) * 3] = c.r;
      cols[(i + k) * 3 + 1] = c.g;
      cols[(i + k) * 3 + 2] = c.b;
    }
  }
  envGeo.setAttribute("color", new THREE.BufferAttribute(cols, 3));
  envGeo.computeVertexNormals();

  const envMat = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.62,
    metalness: 0.03,
    flatShading: true,
    emissive: new THREE.Color(0xffb454),
    emissiveIntensity: 0.05,
  });
  const envelope = new THREE.Mesh(envGeo, envMat);
  envelope.position.y = 0.78;
  root.add(envelope);

  const sashTex = makeSashTexture(THREE, spec);
  const sashMat = new THREE.MeshStandardMaterial({
    map: sashTex,
    roughness: 0.45,
    emissive: new THREE.Color(0xffffff),
    emissiveMap: sashTex,
    emissiveIntensity: 0.28,
    side: THREE.DoubleSide,
  });
  const sash = new THREE.Mesh(new THREE.CylinderGeometry(0.892, 0.888, 0.36, 24, 1, true), sashMat);
  sash.position.y = 1.22;
  root.add(sash);

  const ropeMat = new THREE.MeshStandardMaterial({ color: 0x8b6f4e, roughness: 0.9 });
  for (const [sx, sz] of [
    [-0.16, -0.16],
    [0.16, -0.16],
    [-0.16, 0.16],
    [0.16, 0.16],
  ]) {
    const cable = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.46, 4), ropeMat);
    cable.position.set(sx, -0.18, sz);
    cable.rotation.z = sx * 0.25;
    cable.rotation.x = -sz * 0.25;
    root.add(cable);
  }

  const flameMat = new THREE.MeshBasicMaterial({ color: 0xffb84d, transparent: true, opacity: 0.9 });
  const flame = new THREE.Mesh(new THREE.ConeGeometry(0.095, 0.24, 8), flameMat);
  flame.position.y = -0.02;
  root.add(flame);

  const basketMat = new THREE.MeshStandardMaterial({ color: 0x9c6f44, roughness: 0.92 });
  const rimMat = new THREE.MeshStandardMaterial({ color: 0x6b4728, roughness: 0.85 });
  const basket = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.28, 0.36), basketMat);
  basket.position.y = -0.52;
  const rim = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.05, 0.4), rimMat);
  rim.position.y = -0.38;
  root.add(basket, rim);

  const bagMat = new THREE.MeshStandardMaterial({ color: 0xd9b37c, roughness: 0.9 });
  for (const [bx, bz] of [
    [-0.2, -0.1],
    [0.2, 0.1],
    [-0.1, 0.2],
    [0.1, -0.2],
  ]) {
    const bag = new THREE.Mesh(new THREE.SphereGeometry(0.045, 6, 5), bagMat);
    bag.scale.set(0.9, 1.25, 0.9);
    bag.position.set(bx, -0.45, bz);
    root.add(bag);
  }

  // Generous invisible raycast cylinder covering balloon envelope + sash + burner + basket
  const pickMesh = new THREE.Mesh(new THREE.CylinderGeometry(1.16, 0.84, 2.95, 12), hitMat);
  pickMesh.position.set(0, 0.72, 0);
  pickMesh.visible = false;
  pickMesh.userData = { type: "skyCraft", id: spec.id, skyKind: "balloon", skyIndex };
  root.add(pickMesh);

  root.scale.setScalar(spec.scale || 1.0);
  return { id: spec.id, kind: "balloon", index: skyIndex, root, envMat, sashMat, flame, flameMat, pickMesh, spec };
}

function smooth01(a, b, x) {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

export function createSkyFleet(THREE, scene, { cx, cz, quality, reduced }) {
  const group = new THREE.Group();
  group.name = "htl-sky-fleet";
  scene.add(group);

  const hitMat = makeHitboxMat(THREE);
  const planeSpecs = quality === "low" ? PLANE_SPECS.slice(0, 3) : PLANE_SPECS;
  const balloonSpecs = quality === "low" ? BALLOON_SPECS.slice(0, 4) : BALLOON_SPECS;

  const planes = planeSpecs.map((sp, idx) => {
    const p = buildPlane(THREE, sp, idx, hitMat);
    p.scheduledVisible = false;
    p.root.visible = false;
    group.add(p.root);
    return p;
  });

  const airships = AIRSHIP_SPECS.map((sp, idx) => {
    const a = buildAirship(THREE, sp, idx, hitMat);
    a.scheduledVisible = false;
    a.root.visible = false;
    group.add(a.root);
    return a;
  });

  const balloons = balloonSpecs.map((sp, idx) => {
    const b = buildHotAirBalloon(THREE, sp, idx, hitMat);
    b.scheduledVisible = false;
    b.root.visible = false;
    group.add(b.root);
    return b;
  });

  const allItems = [...planes, ...airships, ...balloons];
  const byId = new Map(allItems.map((it) => [it.id, it]));
  const pickables = allItems.map((it) => it.pickMesh);

  let elapsed = 0;
  let corridorClock = 9.6; // Starts ~40% into the first scheduled coastal pass
  let balloonClock = 10.5; // Starts serenely floating in the prime horizon window
  let dayMinutes = 480; // Default 08:00 campus clock
  let nightLevel = 0;
  let lastCam = null;

  // Optional on-demand single-flight dispatch & interactive focus state
  let manualFlight = null; // { kind: 'plane' | 'airship', index, t, dur, dir }
  let manualBalloonPair = null; // { pairIdx, t, dur }
  let activeFocusId = null; // Currently inspected craft id (gentle 0.3x slow-cruise & near-cull exemption)
  let heldCraftId = null; // Explicitly paused mid-air craft id (0x position freeze while banner still ripples)
  let hoverCraftId = null; // Hovered craft id for emissive highlight
  let saluteState = null; // { id, t, dur }

  // Place a single scheduled aircraft or blimp along the upper-back coastal corridor (u in [0..1])
  function placeCoastalFlyby(item, u, dir, yBase, zBase, dt = 0.016) {
    const xStart = dir > 0 ? cx - 23.5 : cx + 22.0;
    const xEnd = dir > 0 ? cx + 25.5 : cx - 27.0;
    const x = xStart + (xEnd - xStart) * u;
    const z = cz + zBase - Math.sin(u * Math.PI) * 1.15;
    let y = yBase + Math.sin(u * Math.PI * 2.5 + item.spec.phase) * 0.14;

    const dx = xEnd - xStart;
    const dz = -Math.cos(u * Math.PI) * Math.PI * 1.15;
    const dy = Math.cos(u * Math.PI * 2.5 + item.spec.phase) * Math.PI * 2.5 * 0.14;

    const isSaluting = saluteState && saluteState.id === item.id;
    const salP = isSaluting ? Math.min(1, saluteState.t / saluteState.dur) : 0;
    if (isSaluting) {
      y += Math.sin(salP * Math.PI) * 0.28;
    }

    item.root.position.set(x, y, z);
    item.root.rotation.y = Math.atan2(dx, dz);
    item.root.rotation.x =
      -Math.atan2(dy, Math.max(0.001, Math.hypot(dx, dz))) * 0.5 -
      (isSaluting && item.ship ? Math.sin(salP * Math.PI * 2) * 0.09 : 0);

    const gentleBank = -dir * 0.045 * Math.sin(u * Math.PI);
    // Celebratory 360-degree aileron barrel-roll on planes, or majestic royal wave on blimps!
    if (item.craft) {
      const roll = isSaluting ? Math.sin(salP * Math.PI) * Math.sin(salP * Math.PI * 4) * 0.72 + salP * Math.PI * 2 : 0;
      item.craft.rotation.z = gentleBank + roll;
    }
    if (item.ship) {
      item.ship.rotation.z = gentleBank * 0.5 + (isSaluting ? Math.sin(salP * Math.PI * 3) * 0.16 : 0);
    }

    if (item.prop) {
      item.prop.rotation.z += Math.max(0.012, dt) * (isSaluting ? 52 : 32);
      const blink = isSaluting ? 1.0 : Math.sin(elapsed * 9 + item.spec.phase * 3) > 0.55 ? 1.0 : 0.2;
      item.strobeMat.opacity = 0.25 + blink * 0.75;
    }

    const hoverBoost = hoverCraftId === item.id || activeFocusId === item.id ? 0.14 : 0;
    const saluteGlow = isSaluting ? Math.sin(salP * Math.PI) * 0.35 : 0;
    item.banner.mat.emissiveIntensity = (item.kind === "airship" ? 0.26 + nightLevel * 0.52 : 0.24 + nightLevel * 0.48) + hoverBoost + saluteGlow;
    if (item.signMat) item.signMat.emissiveIntensity = 0.35 + nightLevel * 0.35 + hoverBoost + saluteGlow;

    item.banner.wave(elapsed, dir * 0.05, isSaluting ? 1.65 : 1.0);
    item.lastU = u;
    item.lastDir = dir;
    item.scheduledVisible = true;
  }

  function placeScheduledBalloon(b, slot, u) {
    const fadeIn = smooth01(0.0, 0.15, u);
    const fadeOut = smooth01(1.0, 0.82, u);
    const presence = Math.min(fadeIn, fadeOut);
    if (presence <= 0.015) {
      b.scheduledVisible = false;
      return;
    }

    const sp = b.spec;
    const t = elapsed * sp.freq + sp.phase;
    const riseOffset = (1 - fadeIn) * -1.25 + (1 - fadeOut) * 0.55;
    const farOffset = (1 - fadeOut) * -1.8;

    const isSaluting = saluteState && saluteState.id === b.id;
    const salP = isSaluting ? Math.min(1, saluteState.t / saluteState.dur) : 0;
    const saluteHop = isSaluting ? Math.sin(salP * Math.PI) * 0.36 : 0;
    const saluteSpin = isSaluting ? Math.sin(salP * Math.PI) * 0.9 : 0;

    b.root.position.set(
      cx + slot.x + Math.sin(t * 0.45) * slot.driftX,
      slot.y + riseOffset + Math.sin(t * 1.05) * slot.bobAmp + saluteHop,
      cz + slot.z + farOffset + Math.cos(t * 0.38) * slot.driftZ
    );
    b.root.scale.setScalar((sp.scale || 0.76) * (0.25 + 0.75 * presence));
    b.root.rotation.y = Math.sin(t * 0.26) * 0.48 + elapsed * 0.055 * (sp.phase % 2 > 1 ? 1 : -1) + saluteSpin;
    b.root.rotation.z = Math.sin(t * 0.85) * 0.03;

    const burst = Math.max(0, Math.sin(elapsed * 2.5 + sp.phase * 2.1));
    const saluteFlame = isSaluting ? Math.sin(salP * Math.PI) * 1.45 : 0;
    const hoverBoost = hoverCraftId === b.id || activeFocusId === b.id ? 0.16 : 0;
    const scaleFlame = 0.65 + burst * 0.75 + nightLevel * 0.38 + saluteFlame;
    b.flame.scale.set(scaleFlame * 0.9, scaleFlame * 1.32, scaleFlame * 0.9);
    b.flameMat.opacity = Math.min(1, (0.45 + burst * 0.5 + nightLevel * 0.25 + saluteFlame * 0.5) * presence);
    b.envMat.emissiveIntensity = 0.04 + burst * 0.08 + nightLevel * (0.3 + burst * 0.24) + saluteFlame * 0.42 + hoverBoost * 0.6;
    b.sashMat.emissiveIntensity = 0.24 + nightLevel * 0.46 + hoverBoost + saluteFlame * 0.25;
    b.lastU = u;
    b.scheduledVisible = true;
  }

  function applyVisibility() {
    for (const p of planes) {
      const minDist = p.id === activeFocusId ? 1.8 : 7.5;
      p.root.visible = Boolean(p.scheduledVisible) && (!lastCam || p.root.position.distanceTo(lastCam.position) > minDist);
      p.pickMesh.visible = p.root.visible;
    }
    for (const a of airships) {
      const minDist = a.id === activeFocusId ? 2.2 : 9.0;
      a.root.visible = Boolean(a.scheduledVisible) && (!lastCam || a.root.position.distanceTo(lastCam.position) > minDist);
      a.pickMesh.visible = a.root.visible;
    }
    for (const b of balloons) {
      const minDist = b.id === activeFocusId ? 1.8 : 6.5;
      b.root.visible = Boolean(b.scheduledVisible) && (!lastCam || b.root.position.distanceTo(lastCam.position) > minDist);
      b.pickMesh.visible = b.root.visible;
    }
  }

  function applySchedulePose(dt = 0.016) {
    for (const p of planes) p.scheduledVisible = false;
    for (const a of airships) a.scheduledVisible = false;
    for (const b of balloons) b.scheduledVisible = false;

    const min = ((dayMinutes % 1440) + 1440) % 1440;
    const isQuietNight = min >= 1350 || min < 330;

    // 1. Single-Corridor Scheduled Aircraft / Blimp Controller
    if (manualFlight) {
      const u = manualFlight.t / manualFlight.dur;
      if (u <= 1.0) {
        if (manualFlight.kind === "airship") {
          const a = airships[manualFlight.index % airships.length];
          if (a) placeCoastalFlyby(a, u, manualFlight.dir, 3.05, -7.4, dt);
        } else {
          const p = planes[manualFlight.index % planes.length];
          if (p) placeCoastalFlyby(p, u, manualFlight.dir, 2.82, -6.6, dt);
        }
      } else {
        const finishedId =
          manualFlight.kind === "airship"
            ? airships[manualFlight.index % airships.length]?.id
            : planes[manualFlight.index % planes.length]?.id;
        if (finishedId && activeFocusId === finishedId) {
          // Loop gently while user is still inspecting this craft's card!
          manualFlight.t = manualFlight.dur * 0.18;
          const uLoop = manualFlight.t / manualFlight.dur;
          if (manualFlight.kind === "airship") placeCoastalFlyby(airships[manualFlight.index % airships.length], uLoop, manualFlight.dir, 3.05, -7.4, dt);
          else placeCoastalFlyby(planes[manualFlight.index % planes.length], uLoop, manualFlight.dir, 2.82, -6.6, dt);
        } else {
          manualFlight = null;
          corridorClock = 28.0;
        }
      }
    } else if (!isQuietNight) {
      if (min >= 1170) {
        const slotSec = 44;
        const passSec = 32;
        const slotIdx = Math.floor(corridorClock / slotSec);
        const localT = corridorClock % slotSec;
        if (localT <= passSec && airships.length) {
          const aIdx = slotIdx % airships.length;
          const dir = slotIdx % 2 === 0 ? 1 : -1;
          placeCoastalFlyby(airships[aIdx], localT / passSec, dir, 3.05, -7.4, dt);
        }
      } else if (min >= 960) {
        const slotSec = 40;
        const passSec = 29;
        const slotIdx = Math.floor(corridorClock / slotSec);
        const localT = corridorClock % slotSec;
        if (localT <= passSec) {
          const dir = slotIdx % 2 === 0 ? -1 : 1;
          if (slotIdx % 2 === 0 && airships.length) {
            const aIdx = (1 + Math.floor(slotIdx / 2)) % airships.length;
            placeCoastalFlyby(airships[aIdx], localT / passSec, dir, 3.02, -7.3, dt);
          } else if (planes.length) {
            const pIdx = (Math.floor(slotIdx / 2) + 3) % planes.length;
            placeCoastalFlyby(planes[pIdx], localT / passSec, dir, 2.82, -6.6, dt);
          }
        }
      } else {
        const slotSec = 34;
        const passSec = 24;
        const slotIdx = Math.floor(corridorClock / slotSec);
        const localT = corridorClock % slotSec;
        if (localT <= passSec && planes.length) {
          const hourShift = Math.floor((min - 330) / 90);
          const pIdx = (slotIdx + hourShift) % planes.length;
          const dir = (slotIdx + hourShift) % 2 === 0 ? 1 : -1;
          placeCoastalFlyby(planes[pIdx], localT / passSec, dir, 2.82, -6.6, dt);
        }
      }
    }

    // 2. Scheduled Horizon Hot Air Balloon Fiesta
    if (manualBalloonPair) {
      const u = manualBalloonPair.t / manualBalloonPair.dur;
      if (u <= 1.0 && balloons.length) {
        const bL = balloons[(manualBalloonPair.pairIdx * 2) % balloons.length];
        placeScheduledBalloon(bL, BALLOON_FLANK_SLOTS[0], u);
        if (balloons.length > 1) {
          const bR = balloons[(manualBalloonPair.pairIdx * 2 + 1) % balloons.length];
          placeScheduledBalloon(bR, BALLOON_FLANK_SLOTS[1], Math.max(0, Math.min(1, u * 1.04 - 0.02)));
        }
      } else {
        const leftId = balloons[(manualBalloonPair.pairIdx * 2) % balloons.length]?.id;
        const rightId = balloons[(manualBalloonPair.pairIdx * 2 + 1) % balloons.length]?.id;
        if (activeFocusId && (activeFocusId === leftId || activeFocusId === rightId)) {
          manualBalloonPair.t = manualBalloonPair.dur * 0.25;
          const uLoop = manualBalloonPair.t / manualBalloonPair.dur;
          placeScheduledBalloon(balloons[(manualBalloonPair.pairIdx * 2) % balloons.length], BALLOON_FLANK_SLOTS[0], uLoop);
          if (balloons.length > 1) placeScheduledBalloon(balloons[(manualBalloonPair.pairIdx * 2 + 1) % balloons.length], BALLOON_FLANK_SLOTS[1], uLoop);
        } else {
          manualBalloonPair = null;
          balloonClock = 32.0;
        }
      }
    } else if (!isQuietNight && balloons.length) {
      const isMiddaySingle = (min >= 540 && min < 960) || quality === "low";
      const bSlotSec = 38;
      const bActiveSec = isMiddaySingle ? 26 : 30;
      const bSlotIdx = Math.floor(balloonClock / bSlotSec);
      const bLocalT = balloonClock % bSlotSec;

      if (bLocalT <= bActiveSec) {
        const u = bLocalT / bActiveSec;
        if (isMiddaySingle) {
          const bIdx = (bSlotIdx + Math.floor(min / 120)) % balloons.length;
          const flank = BALLOON_FLANK_SLOTS[bSlotIdx % 2];
          placeScheduledBalloon(balloons[bIdx], flank, u);
        } else {
          const numPairs = Math.max(1, Math.floor(balloons.length / 2));
          const pairIdx = (bSlotIdx + Math.floor(min / 180)) % numPairs;
          const bLeft = balloons[(pairIdx * 2) % balloons.length];
          const bRight = balloons[(pairIdx * 2 + 1) % balloons.length];
          placeScheduledBalloon(bLeft, BALLOON_FLANK_SLOTS[0], u);
          if (bRight && bRight !== bLeft) {
            const uRight = Math.max(0, Math.min(1, (bLocalT - 1.6) / (bActiveSec - 1.6)));
            if (bLocalT >= 1.6) placeScheduledBalloon(bRight, BALLOON_FLANK_SLOTS[1], uRight);
          }
        }
      }
    }

    applyVisibility();
  }

  function update(dt = 0.016) {
    const step = reduced ? dt * 0.35 : dt;
    // Elapsed always advances so propellers spin, cloth banners ripple in the breeze, and balloon flames flicker!
    elapsed += step;

    if (saluteState) {
      saluteState.t += dt;
      if (saluteState.t >= saluteState.dur) saluteState = null;
    }

    const focusedItem = activeFocusId ? byId.get(activeFocusId) : null;
    const isCorridorFocused = focusedItem && (focusedItem.kind === "plane" || focusedItem.kind === "airship");
    const isBalloonFocused = focusedItem && focusedItem.kind === "balloon";

    const corridorRate = heldCraftId && isCorridorFocused && heldCraftId === activeFocusId ? 0 : isCorridorFocused ? 0.32 : 1.0;
    const balloonRate = heldCraftId && isBalloonFocused && heldCraftId === activeFocusId ? 0 : isBalloonFocused ? 0.25 : 1.0;

    corridorClock += step * corridorRate;
    balloonClock += step * balloonRate;
    if (manualFlight) manualFlight.t += step * corridorRate;
    if (manualBalloonPair) manualBalloonPair.t += step * balloonRate;
    applySchedulePose(step);
  }

  function setNight(night) {
    nightLevel = night;
    for (const p of planes) {
      p.glassMat.emissiveIntensity = 0.12 + night * 0.65;
      p.banner.mat.emissiveIntensity = 0.24 + night * 0.48;
    }
    for (const a of airships) {
      a.hullMat.emissiveIntensity = 0.05 + night * 0.22;
      a.banner.mat.emissiveIntensity = 0.26 + night * 0.52;
    }
    for (const b of balloons) {
      b.sashMat.emissiveIntensity = 0.24 + night * 0.46;
    }
  }

  function setTime(minutes, night) {
    const prev = dayMinutes;
    dayMinutes = ((minutes % 1440) + 1440) % 1440;
    if (typeof night === "number") setNight(night);
    if (Math.abs(dayMinutes - prev) >= 35 && !manualFlight && !activeFocusId) {
      corridorClock = 9.8;
      balloonClock = 10.5;
    }
    applySchedulePose(0.016);
  }

  function summonFlight({ kind = "plane", index = 0 } = {}) {
    if (kind === "balloon") {
      const pairIdx = Math.floor(index / 2);
      manualBalloonPair = { pairIdx, t: 8.5, dur: 30 };
    } else if (kind === "airship") {
      manualFlight = { kind: "airship", index, t: 10.5, dur: 30, dir: index % 2 === 0 ? 1 : -1 };
    } else {
      manualFlight = { kind: "plane", index, t: 8.8, dur: 24, dir: index % 2 === 0 ? 1 : -1 };
    }
    applySchedulePose(0.016);
  }

  // Ensure a clicked or chosen sky craft is comfortably positioned & kept in view while its card is open
  function focusCraft(id, { forceSummon = false } = {}) {
    const item = byId.get(id);
    if (!item) return null;
    activeFocusId = id;
    if (heldCraftId && heldCraftId !== id) heldCraftId = null;

    const needsSummon =
      forceSummon ||
      !item.scheduledVisible ||
      (typeof item.lastU === "number" && (item.lastU < 0.16 || item.lastU > 0.8));

    if (needsSummon) {
      if (item.kind === "balloon") {
        manualBalloonPair = { pairIdx: Math.floor(item.index / 2), t: 9.5, dur: 32 };
      } else if (item.kind === "airship") {
        manualFlight = { kind: "airship", index: item.index, t: 11.2, dur: 30, dir: item.index % 2 === 0 ? 1 : -1 };
      } else {
        manualFlight = { kind: "plane", index: item.index, t: 9.2, dur: 24, dir: item.index % 2 === 0 ? 1 : -1 };
      }
    } else if (item.kind === "plane" || item.kind === "airship") {
      // Lock current scheduled pass into manualFlight at its exact current u so time-of-day toggles won't make it vanish!
      if (!manualFlight) {
        const dur = item.kind === "airship" ? 30 : 24;
        manualFlight = {
          kind: item.kind,
          index: item.index,
          t: Math.max(4.0, Math.min(dur * 0.78, (item.lastU ?? 0.4) * dur)),
          dur,
          dir: item.lastDir || 1,
        };
      }
    } else if (item.kind === "balloon" && !manualBalloonPair) {
      manualBalloonPair = {
        pairIdx: Math.floor(item.index / 2),
        t: Math.max(6.0, Math.min(24.0, (item.lastU ?? 0.45) * 30)),
        dur: 30,
      };
    }

    applySchedulePose(0.016);
    return item;
  }

  function clearFocus() {
    activeFocusId = null;
    heldCraftId = null;
    applyVisibility();
  }

  function toggleHold(id = activeFocusId) {
    if (!id || !byId.has(id)) return false;
    activeFocusId = id;
    heldCraftId = heldCraftId === id ? null : id;
    return heldCraftId === id;
  }

  function isHeld(id = activeFocusId) {
    return Boolean(id && heldCraftId === id);
  }

  function saluteCraft(id = activeFocusId) {
    if (!id || !byId.has(id)) return false;
    focusCraft(id);
    saluteState = { id, t: 0, dur: 2.3 };
    applySchedulePose(0.016);
    return true;
  }

  function setHover(id) {
    if (hoverCraftId === id) return;
    hoverCraftId = id || null;
    applySchedulePose(0.001);
  }

  // Visual midpoint of aircraft + trailing banner (or balloon envelope) in world coordinates
  function getLookTarget(id, out = new THREE.Vector3()) {
    const item = byId.get(id);
    if (!item) return out.set(cx, 3, cz);
    item.root.updateMatrixWorld(true);
    if (item.kind === "plane") {
      return out.set(0, 0.04, -2.15).applyMatrix4(item.root.matrixWorld);
    }
    if (item.kind === "airship") {
      return out.set(0, -0.05, -2.55).applyMatrix4(item.root.matrixWorld);
    }
    return out.set(0, 0.62, 0).applyMatrix4(item.root.matrixWorld);
  }

  function getScheduleStatus() {
    const min = ((dayMinutes % 1440) + 1440) % 1440;
    const visPlanes = planes.filter((p) => p.root.visible).length;
    const visAirships = airships.filter((a) => a.root.visible).length;
    const visBalloons = balloons.filter((b) => b.root.visible).length;
    let slotName = "日間晴空單機輪播";
    if (min >= 1350 || min < 330) slotName = "深夜靜謐休航";
    else if (min >= 1170) slotName = "星夜飛船＆熱氣球火焰光雕";
    else if (min >= 960) slotName = "黃昏禮賓飛船＆雙球霞光";
    else if (min < 540) slotName = "清晨熱氣球晨飛＆晨間首航";
    return { dayMinutes: min, slotName, visPlanes, visAirships, visBalloons, totalVisible: visPlanes + visAirships + visBalloons };
  }

  function cullNearCamera(cam) {
    if (!cam) return;
    lastCam = cam;
    applyVisibility();
  }

  const catalog = allItems.map((it) => ({
    id: it.id,
    kind: it.kind,
    index: it.index,
    spec: it.spec,
  }));

  applySchedulePose(0.001);

  const api = {
    group,
    planes,
    airships,
    balloons,
    pickables,
    catalog,
    getCraft: (id) => byId.get(id) || null,
    getLookTarget,
    focusCraft,
    clearFocus,
    toggleHold,
    isHeld,
    saluteCraft,
    setHover,
    isAnimating: () => Boolean(saluteState),
    update,
    setNight,
    setTime,
    summonFlight,
    getScheduleStatus,
    cullNearCamera,
  };
  if (typeof window !== "undefined") window.__htlSkyFleet = api;
  return api;
}

// 旅館島護照（Island Passport）: 四年三明治職涯養成主線任務（4-Year Sandwich Career Questline）、
// 1+3 畢業門檻四大支柱、旅館知識王＆禮賓情境挑戰（含連對 Combo 加成）、3D 浮動任務導航膠囊（HUD）、
// 20 座主題島嶼印章、30 枚成就徽章、榮譽領航結業證書與 ZzFX 風格程序化飯店服務鈴音效。
//
// Gamification only — every fact in the storyline, quiz, and 1+3 tracker comes strictly from the official site data
// (window.__htl.D: islands / buildings / flows) and data/official.json.
// Progress lives in this browser only (localStorage "htl-passport:v1"); nothing is sent anywhere.
//
// Open-source references & credits:
// - Celebration confetti: canvas-confetti by Kiril Vatev, ISC/MIT License (vendor/canvas-confetti)
// - Procedural WebAudio Hotel Service Bell & Chimes: inspired by KilledByAPixel/ZzFX by Frank Force, MIT License

import { OFFICIAL } from "./official-data.js?v=20261115-01";
import { drawRound, regionQuestion } from "./quiz-gen.js?v=20261115-01";
import { FLOW_THEMES } from "./flow-themes.js?v=20261115-01";

const STORE_KEY = "htl-passport:v1";
const english = new URLSearchParams(location.search).get("lang") === "en";
const tr = (zh, en) => (english ? en : zh);
const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const txt = (v) => (v && typeof v === "object" ? (english ? v.en || v.zh : v.zh || v.en) : v || "");
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");

// XP per first-time discovery. Repeat visits give nothing, so the score measures breadth, not clicking.
const XP = {
  island: 40,
  building: 10,
  flow: 15,
  teacher: 25,
  voice: 15,
  source: 10,
  daily: 60,
  badge: 30,
  quiz: 80,
  quizCorrect: 5,
  checkin: 15,
  skyCraft: 15,
  plazaGreet: 10,
};
// 旅伴廣場社交 XP：每天最多向 5 位「不同」的線上夥伴打招呼計分；聊天與私訊不計分，避免鼓勵洗版。
const PLAZA_GREET_DAILY_MAX = 5;

// 第四期: Lv 1–30 inside the five star ranks (stars stay the rank shown to other players; Lv is local only)
const LEVEL_MAX = 30;
const xpForLevel = (L) => Math.round(4200 * Math.pow((Math.min(LEVEL_MAX, Math.max(1, L)) - 1) / (LEVEL_MAX - 1), 1.6));
function levelOf(xp) {
  for (let L = LEVEL_MAX; L > 1; L--) if (xp >= xpForLevel(L)) return L;
  return 1;
}
const INTERN_STAMP_XP = 20;

// Hotel-star rating as the level badge (a game metaphor, not a claim about any hotel).
const STARS = [0, 160, 480, 960, 1600];
const STAR_TITLE = [
  ["一星旅人・餐旅新鮮人", "1-Star Traveller · Freshman"],
  ["二星旅人・群賢見習生", "2-Star Traveller · Qunxian Trainee"],
  ["三星旅人・三明治實習生", "3-Star Explorer · Sandwich Intern"],
  ["四星旅人・1+3 認證達人", "4-Star Explorer · 1+3 Certified"],
  ["五星領航員・菁英實習儲備幹部", "5-Star Navigator · Elite 3.0 Trainee"],
];

// 1+3 畢業條件標準表四大核心支柱（嚴格依據 data/policies.json 07 畢業條件標準 1+3）
// 1+3 係指學生畢業時應具備 1 張畢業證書及 3 張相關證照（A 類語文證照＋2 張 B 類，或 A 類語文證照＋1 張 C 類）
const ONE_PLUS_THREE_PILLARS = [
  {
    key: "deg",
    code: "1",
    ico: "🎓",
    zh: "1 張學士畢業證書（含三明治實習）",
    en: "1 Bachelor's Degree & Sandwich Curriculum",
    subZh: "修畢四年課程標準表與第三學年校外實習(一)(二)各 10 學分",
    subEn: "Complete 4-year curriculum & Year-3 Off-Campus Internship (I)(II) 10+10 credits",
    island: "transport",
  },
  {
    key: "catA",
    code: "+A",
    ico: "🌐",
    zh: "A 類：外語檢定必備證照（1 張）",
    en: "Category A: Mandatory Foreign Language Cert",
    subZh: "不論哪種組合皆必備 1 張 A 類語文證照（相當於多益 TOEIC 600 分含以上）",
    subEn: "Mandatory in all combinations: equivalent to TOEIC 600+ or above",
    island: "hakka",
  },
  {
    key: "catB",
    code: "+B",
    ico: "🍽️",
    zh: "B 類：一般專業或外語證照（2 張）",
    en: "Category B: General Professional / Language Certs",
    subZh: "列餐飲服務丙級、旅館客房服務丙級、WSET L1、AHLEI 等 14 項或 TOEIC 700+／日檢 N3+",
    subEn: "14 hospitality/IT certs (F&B/Room Class C, WSET L1, AHLEI) or TOEIC 700+ / JLPT N3+",
    island: "lunch",
  },
  {
    key: "catC",
    code: "+C",
    ico: "👑",
    zh: "C 類：中高階或國際證照（1 張抵 2 張 B 類）",
    en: "Category C: Advanced Cert (1 substitutes for 2 B-class)",
    subZh: "列餐旅乙級、CHS、CHDT、WSET L2、TOEIC 850+、日檢 N2+、AWS AI 等 15 項",
    subEn: "15 advanced certs (Class B technician, CHS, CHDT, WSET L2, TOEIC 850+, JLPT N2+, AWS AI)",
    island: "card",
  },
];

// 四年三明治職涯養成主線任務（4-Year Sandwich Career Storyline）
const SANDWICH_CHAPTERS = [
  {
    id: "ch1",
    year: "YEAR 1",
    ico: "🏨",
    xp: 100,
    zh: "第一章｜大一・初入高餐與群賢見習",
    en: "Chapter 1 | Freshman · Campus & Elite House Check-In",
    descZh: "從第一教學大樓(F棟)1樓系辦出發，認識 1995 年全國首創沿革，走進校內實習旅館「群賢會館」與專業技術教室。",
    descEn: "Start at the Dept. Office (Building F, 1F), learn our 1995 founding history, and explore the on-campus Elite House & professional classrooms.",
    steps: [
      {
        id: "c1s1",
        zh: "造訪「01 系務核心與沿革」",
        en: "Visit '01 Dept. Office & History'",
        check: (s) => s.islands.includes("civil"),
        go: { type: "island", id: "civil" },
      },
      {
        id: "c1s2",
        zh: "造訪「06 群賢會館（校內實習旅館）」",
        en: "Visit '06 Elite House (Practicum Hotel)'",
        check: (s) => s.islands.includes("family"),
        go: { type: "island", id: "family" },
      },
      {
        id: "c1s3",
        zh: "造訪「15 校園與專業教室」",
        en: "Visit '15 Campus & Professional Classrooms'",
        check: (s) => s.islands.includes("water"),
        go: { type: "island", id: "water" },
      },
    ],
  },
  {
    id: "ch2",
    year: "YEAR 2",
    ico: "🎙️",
    xp: 120,
    zh: "第二章｜大二・專業核心、PMS 與師門請益",
    en: "Chapter 2 | Sophomore · Core Curriculum, PMS & Mentorship",
    descZh: "深入四年課程標準表、餐飲與酒類專業、OPERA／德安 PMS 系統，並在島上拜會師長、聆聽擬真語音導覽。",
    descEn: "Master curriculum standards, F&B & beverage expertise, OPERA/De-An PMS systems, and listen to faculty voice introductions.",
    steps: [
      {
        id: "c2s1",
        zh: "巡禮「04 課程標準表」與「05 餐飲服務與酒類專業」",
        en: "Visit '04 Curriculum' & '05 F&B & Beverage'",
        check: (s) => s.islands.includes("education") && s.islands.includes("lunch"),
        go: (s) => ({ type: "island", id: s.islands.includes("education") ? "lunch" : "education" }),
      },
      {
        id: "c2s2",
        zh: "造訪「16 旅館資訊系統」、「18 奢華體驗管家」或「19 數位智慧創新基地」",
        en: "Visit '16 Hotel IT', '18 Luxury Butler' or '19 Smart Innovation Base'",
        check: (s) => s.islands.includes("ai") || s.islands.includes("luxury") || s.islands.includes("innovation"),
        go: (s) => ({ type: "island", id: !s.islands.includes("luxury") ? "luxury" : !s.islands.includes("innovation") ? "innovation" : "ai" }),
      },
      {
        id: "c2s3",
        zh: "在 3D 島上認識 3 位老師並播放 1 段語音導覽",
        en: "Meet 3 faculty members & play 1 voice intro",
        check: (s) => s.teachers.length >= 3 && s.voices.length >= 1,
        go: { type: "island", id: "welfare" },
      },
    ],
  },
  {
    id: "ch3",
    year: "YEAR 3",
    ico: "🌟",
    xp: 150,
    zh: "第三章｜大三・三明治校外實習與菁英計畫 3.0",
    en: "Chapter 3 | Junior · Sandwich Off-Campus Internship & Elite 3.0",
    descZh: "體驗三明治教學法精髓：大三上下學期校外實習(一)(二)各 10 學分，同島巡禮校內群賢會館與 24 家菁英實習合作旅館。",
    descEn: "Experience the Sandwich Method: Year-3 Off-Campus Internship (I)(II) (10+10 credits) across Qunxian Hotel & 24 Elite Internship 3.0 partner hotels.",
    steps: [
      {
        id: "c3s1",
        zh: "造訪「03 三明治教學與實習動線」",
        en: "Visit '03 Sandwich Teaching & Internship Path'",
        check: (s) => s.islands.includes("transport"),
        go: { type: "island", id: "transport" },
      },
      {
        id: "c3s2",
        zh: "造訪「09 實習旅館專島：群賢會館與24家合作旅館」",
        en: "Visit '09 Practicum & Partner Hotels Island (25 Standalone Hotels)'",
        check: (s) => s.islands.includes("sport"),
        go: { type: "island", id: "sport" },
      },
      {
        id: "c3s3",
        zh: "造訪「10 菁英實習3.0：品牌學苑、雙軌選才與輪調制度」",
        en: "Visit '10 Elite Internship 3.0: Brand Academies, Selection & Rotation'",
        check: (s) => s.islands.includes("trails"),
        go: { type: "island", id: "trails" },
      },
    ],
  },
  {
    id: "ch4",
    year: "YEAR 4",
    ico: "👑",
    xp: 200,
    zh: "第四章｜大四・1+3 畢業認證與國際職涯領航",
    en: "Chapter 4 | Senior · 1+3 Certification & Global Career",
    descZh: "完成 1+3 畢業條件四大支柱、拓展國際交流視野、掌握三合一就業策略，並通過「旅館知識王挑戰」取得榮譽領航結業證書！",
    descEn: "Complete the 1+3 Graduation Pillars, explore International Exchange & Career paths, and score 80+ in the Hospitality Quiz!",
    steps: [
      {
        id: "c4s1",
        zh: "造訪「07 畢業條件標準（1+3）」與「14 外語與跨文化服務」",
        en: "Visit '07 Graduation (1+3)' & '14 Foreign Languages'",
        check: (s) => s.islands.includes("card") && s.islands.includes("hakka"),
        go: (s) => ({ type: "island", id: s.islands.includes("card") ? "hakka" : "card" }),
      },
      {
        id: "c4s2",
        zh: "巡禮「13 國際交流」、「17 升學就業」與「20 永續旅宿治理與研發」",
        en: "Visit '13 International', '17 Careers' & '20 ESG Governance & Research'",
        check: (s) => s.islands.includes("diplomacy") && s.islands.includes("renewal") && s.islands.includes("esg"),
        go: (s) => ({ type: "island", id: !s.islands.includes("diplomacy") ? "diplomacy" : !s.islands.includes("renewal") ? "renewal" : "esg" }),
      },
      {
        id: "c4s3",
        zh: "在「旅館知識王挑戰」取得 80 分以上",
        en: "Score 80+ in the Hospitality Knowledge Quiz",
        check: (s) => (s.bestQuizScore || 0) >= 80,
        go: { type: "quiz" },
      },
    ],
  },
];

// 嚴格依據 data/official.json 與 data/policies.json 編製之 12 題官方事實＆禮賓情境決策題庫
const QUIZ_POOL = [
  {
    cat: tr("🏛️ 創系沿革", "🏛️ History"),
    q: tr("國立高雄餐旅大學旅館管理系為全國首創，於民國 84 年（1995 年）奉教育部核定成立時的初始科系名稱為何？", "Founded in 1995 as the first of its kind in Taiwan, what was the department's original name?"),
    opts: [
      tr("旅館管理科", "Department of Hotel Management (Junior College)"),
      tr("企業管理科", "Department of Business Administration"),
      tr("休閒事業科", "Department of Leisure Management"),
      tr("航空服務科", "Department of Aviation Services"),
    ],
    ans: 0,
    exp: tr(
      "本系於民國 84 年（1995 年）7 月 1 日奉准成立「旅館管理科」，民國 99 年（2010 年）8 月改名國立高雄餐旅大學。",
      "Approved on July 1, 1995 as the Junior College Department of Hotel Management, and upgraded to NKUHT in August 2010."
    ),
  },
  {
    cat: tr("👨‍🏫 師資領航", "👨‍🏫 Leadership"),
    q: tr("目前本系由哪一位師長擔任副教授兼系主任兼學務長，領航系務發展？", "Who currently serves as Associate Professor, Department Chair, and Dean of Student Affairs of the department?"),
    opts: [
      tr("謝文欽 副教授兼系主任兼學務長", "Assoc. Prof. Wen-Chin Hsieh (Chair & Dean of Student Affairs)"),
      tr("楊仁德 教授", "Prof. Jen-Te Yang"),
      tr("沙荃 助理教授級專技人員", "Asst. Prof. Dr. Roger Sha"),
      tr("謝家黎 副教授", "Assoc. Prof. Amber Hsieh"),
    ],
    ans: 0,
    exp: tr(
      "謝文欽老師現任本系副教授兼系主任兼學務長，專長為旅館服務業管理、旅館行銷管理與賭場管理。",
      "Assoc. Prof. Wen-Chin Hsieh serves as Department Chair and Dean of Student Affairs, specializing in hotel service management, marketing, and casino management."
    ),
  },
  {
    cat: tr("📜 1+3 畢業條件", "📜 1+3 Graduation"),
    q: tr("依據本系「畢業條件標準表」，四技日間部及進修部實施的「1+3 畢業條件」定義為何？", "According to the official Graduation Requirements Standard, what does the '1+3' requirement stand for?"),
    opts: [
      tr("1 張畢業證書 ＋ 3 張相關證照（A 類語文必備＋2 張 B 類，或 A 類＋1 張 C 類）", "1 Diploma + 3 Certificates (Mandatory Cat-A Language + 2 Cat-B, or Cat-A + 1 Cat-C)"),
      tr("1 篇學位論文 ＋ 3 次海外志工服務", "1 Thesis + 3 Overseas Volunteer Trips"),
      tr("1 張汽車駕照 ＋ 3 張體育救生證照", "1 Driver License + 3 Lifeguard Certificates"),
      tr("1 次社團會長 ＋ 3 場校慶運動會錦標", "1 Club Presidency + 3 Sports Meet Awards"),
    ],
    ans: 0,
    exp: tr(
      "官網明訂「1+3」係指學生畢業時應具備 1 張畢業證書及 3 張相關證照（A 類語文證照必備＋2 張 B 類，或 A 類語文證照＋1 張 C 類）。",
      "The official '1+3' standard requires 1 Graduation Diploma plus 3 Certificates (Mandatory Category A Language + 2 Category B, or Category A + 1 Category C)."
    ),
  },
  {
    cat: tr("🌐 外語檢定標準", "🌐 Language Standard"),
    q: tr("在「1+3 畢業條件」中，不論選擇哪種證照組合皆必備 1 張「A 類外語檢定證照」，其英語檢定標準相當於多益（TOEIC）幾分以上？", "In the '1+3' graduation standard, the mandatory Category A foreign language certificate requires a score equivalent to at least what TOEIC score?"),
    opts: [
      tr("相當於 TOEIC 600 分（含）以上", "Equivalent to TOEIC 600 or above"),
      tr("相當於 TOEIC 250 分以上", "Equivalent to TOEIC 250 or above"),
      tr("相當於 TOEIC 350 分以上", "Equivalent to TOEIC 350 or above"),
      tr("相當於 TOEIC 990 分滿分", "Equivalent to TOEIC 990 full score"),
    ],
    ans: 0,
    exp: tr(
      "依據畢業條件標準表，A 類外語檢定標準相當於 TOEIC 600 分(含)以上；B 類外語為 TOEIC 700 分或日檢 N3 以上；C 類外語為 TOEIC 850 分或日檢 N2 以上。",
      "Category A requires TOEIC 600+; Category B language requires TOEIC 700+ or JLPT N3+; Category C language requires TOEIC 850+ or JLPT N2+."
    ),
  },
  {
    cat: tr("🛎️ 禮賓教務情境", "🛎️ Concierge Scenario"),
    q: tr("【情境題】大三同學已取得 A 類語文證照，並考取 1 張「C 類中高階或國際證照」（如餐旅乙級、WSET L2 或 AWS AI 認證），請問還需要幾張 B 類證照即可達成 1+3 證照門檻？", "[Scenario] A junior student holds the Category A language cert and 1 Category C advanced cert (e.g., WSET L2 or AWS AI). How many Category B certs do they still need?"),
    opts: [
      tr("0 張（1 張 C 類證照可直接抵 2 張 B 類證照）", "0 (1 Category C certificate substitutes for 2 Category B certificates)"),
      tr("還需要 2 張 B 類證照", "Still needs 2 Category B certificates"),
      tr("還需要 3 張 B 類證照", "Still needs 3 Category B certificates"),
      tr("還需要 4 張 B 類證照", "Still needs 4 Category B certificates"),
    ],
    ans: 0,
    exp: tr(
      "畢業條件標準表明訂：C 類中高階或國際證照 1 張可抵 2 張 B 類證照，因此「A 類 1 張 ＋ C 類 1 張」即滿足 3 張相關證照要求！",
      "1 Category C certificate substitutes for 2 Category B certificates, so 1 Cat-A + 1 Cat-C fulfills the entire certificate requirement!"
    ),
  },
  {
    cat: tr("🥪 三明治教學法", "🥪 Sandwich Curriculum"),
    q: tr("依據本系日間部四年制課程標準表，第三學年（大三）上下學期系訂必修「校外實習(一)」、「校外實習(二)」各為幾學分？", "In the 4-year curriculum standard, how many credits are awarded for each semester of Year-3 required 'Off-Campus Internship (I) & (II)'?"),
    opts: [
      tr("各 10 學分（學年共 20 學分）", "10 credits each (20 credits total for Year 3)"),
      tr("各 1 學分（學年共 2 學分）", "1 credit each (2 credits total)"),
      tr("各 2 學分（學年共 4 學分）", "2 credits each (4 credits total)"),
      tr("0 學分（不列計學分）", "0 credits"),
    ],
    ans: 0,
    exp: tr(
      "課程標準表將大三上下學期「校外實習(一)(二)」列為系訂必修，各 10 學分（共 20 學分），實踐理論與實務並重之三明治教學法。",
      "Year-3 Off-Campus Internship (I) and (II) are required 10-credit courses each semester (20 credits total), embodying the Sandwich Teaching Method."
    ),
  },
  {
    cat: tr("🏨 校內實習旅館", "🏨 Practicum Hotel"),
    q: tr("本系特殊教學設備中，供學生進行示範模擬教學、客務房務實務及外賓接待的「校內實習旅館」名稱為何？", "What is the name of the department's on-campus practicum hotel used for simulated instruction, rooms/front-office practice, and VIP reception?"),
    opts: [
      tr("群賢會館（Elite House）", "Elite House (Qunxian Practicum Hotel)"),
      tr("迎曦會館", "Yingxi Hall"),
      tr("晨光會館", "Chenguang Hall"),
      tr("海景會館", "Seaview Hall"),
    ],
    ans: 0,
    exp: tr(
      "校內實習旅館「群賢會館」提供住宿、示範模擬教學與外賓接待，系網選單設有群賢會館官網連結、訂房連結、導覽預約系統與相關法規。",
      "Elite House (Qunxian Practicum Hotel) on campus serves as the core practicum venue for rooms, front office, and guest reception."
    ),
  },
  {
    cat: tr("🌟 菁英實習 3.0", "🌟 Elite Internship 3.0"),
    q: tr("本系「旅館菁英實習計畫 3.0」串聯全臺共幾家國際品牌與星級標竿合作旅館？", "How many premier partner hotels across Taiwan participate in the 'Elite Internship Program 3.0'?"),
    opts: [
      tr("24 家標竿合作旅館", "24 partner luxury hotels"),
      tr("5 家合作旅館", "5 partner hotels"),
      tr("8 家合作旅館", "8 partner hotels"),
      tr("12 家合作旅館", "12 partner hotels"),
    ],
    ans: 0,
    exp: tr(
      "官網「菁英實習合作機構」共列全臺 24 家頂級國際品牌與觀光旅館。",
      "The official Elite Internship 3.0 partner directory lists 24 premier luxury and resort hotels across Taiwan."
    ),
  },
  {
    cat: tr("💼 菁英培訓情境", "💼 Elite 3.0 Scenario"),
    q: tr("【情境題】依據「旅館菁英實習計畫 3.0 實施方式」，學生前 6 個月於客房部培訓且起薪至少高於勞基法最低工資 5%；第 7 個月起轉調新部門並由職場導師（Mentor）指導，同時調薪至少多少？", "[Scenario] Under Elite Internship 3.0 rules, after 6 months in Housekeeping (starting salary ≥5% above minimum wage), interns rotate to a new department in Month 7 with a Mentor and receive a raise of at least how much?"),
    opts: [
      tr("自第 7 個月起調薪新臺幣 1,000 元（含）以上", "A raise of NT$1,000 or more from Month 7"),
      tr("調薪新臺幣 100 元", "A raise of NT$100"),
      tr("不予調薪", "No salary adjustment"),
      tr("減薪 5%", "5% reduction"),
    ],
    ans: 0,
    exp: tr(
      "依據「旅館菁英實習計畫 3.0 實施方式」，前 6 個月於客房部培訓，第 5 個月考核通過具菁英生資格，第 7 個月起轉調新部門、指派職場導師個別指導，並調薪新臺幣 1,000 元(含)以上。",
      "Under Elite Internship 3.0, interns passing the Month-5 evaluation rotate to a new department in Month 7 with a dedicated Mentor and a pay raise of at least NT$1,000."
    ),
  },
  {
    cat: tr("💻 智慧餐旅 PMS", "💻 Hotel PMS Systems"),
    q: tr("本系「旅館資訊管理專業教室」配備哪兩套業界主流旅館前台資訊管理系統（PMS）供學生實機操作？", "Which two industry-standard Property Management Systems (PMS) are installed in the department's Hotel Information Management classroom?"),
    opts: [
      tr("Oracle Hospitality OPERA PMS 與 德安資訊 PMS", "Oracle Hospitality OPERA PMS & De-An Information PMS"),
      tr("Photoshop 與 Illustrator", "Photoshop & Illustrator"),
      tr("AutoCAD 與 SolidWorks", "AutoCAD & SolidWorks"),
      tr("Final Cut 與 Premiere", "Final Cut & Premiere"),
    ],
    ans: 0,
    exp: tr(
      "本系特殊設備列有國際連鎖飯店主流之 Oracle Hospitality OPERA PMS 與國內各大飯店廣泛採用之德安資訊 PMS 飯店前台管理系統。",
      "The department equips students with hands-on training in both Oracle Hospitality OPERA PMS and De-An Information PMS."
    ),
  },
  {
    cat: tr("📍 系辦與校園", "📍 Campus & Office"),
    q: tr("本系辦公室位於國立高雄餐旅大學（高雄市小港區松和路 1 號）校園內的哪一棟建築？", "In which campus building is the Department of Hotel Management office located?"),
    opts: [
      tr("第一教學大樓（F 棟）1 樓（分機 20202、20201）", "First Teaching Building (Building F), 1st Floor (Ext. 20202, 20201)"),
      tr("體育館地下 3 樓", "Gymnasium B3"),
      tr("圖書館頂樓", "Library Rooftop"),
      tr("校門警衛室", "Main Gate Guardhouse"),
    ],
    ans: 0,
    exp: tr(
      "系辦公室位於高雄市小港區松和路 1 號「第一教學大樓(F棟)1樓」，聯絡電話 07-8060505 轉 20202、20201，傳真 07-8062361。",
      "The Department Office is located on the 1st Floor of the First Teaching Building (Building F), tel: 07-8060505 ext. 20202, 20201."
    ),
  },
  {
    cat: tr("🛟 證照配套情境", "🛟 Cert Remedy Scenario"),
    q: tr("【情境題】若同學報考丙級技術士未通過 2 次以上，依本系「B 類配套措施」，修習哪兩門系訂必修且應屆成績達 80 分以上，即等同通過 B 類一般專業證照？", "[Scenario] If a student fails the Class-C technician exam twice, scoring 80+ in which two required courses counts as passing a Category B general certificate?"),
    opts: [
      tr("「餐飲實務」與「房務實務與管理」", "'Food and Beverage Service' & 'Housekeeping Operations and Management'"),
      tr("「體育(一)」與「全民國防教育」", "'Physical Education (I)' & 'National Defense Education'"),
      tr("「微積分」與「普通物理」", "'Calculus' & 'General Physics'"),
      tr("「書法藝術」與「陶藝鑑賞」", "'Calligraphy' & 'Pottery Appreciation'"),
    ],
    ans: 0,
    exp: tr(
      "依據畢業條件標準表 B 類配套措施：丙級技術士報考未通過 2 次以上者，須修「餐飲實務」、「房務實務與管理」，應屆成績達 80 分以上等同通過 B 類一般專業證照。",
      "Under the Category B remedy policy, students who fail the Class-C exam twice can qualify by scoring 80+ in 'Food and Beverage Service' and 'Housekeeping Operations and Management'."
    ),
  },
  {
    cat: tr("🧭 雙主軸定位", "🧭 Dual-Axis Positioning"),
    q: tr("本系最新課程發展與人才培育定位，聚焦於哪兩大核心雙主軸？", "What are the two core strategic axes of the department's curriculum and talent cultivation?"),
    opts: [
      tr("「智慧旅館科技」與「奢華體驗管理」雙主軸", "'Smart Hotel Technology' & 'Luxury Experience Management'"),
      tr("「遠洋漁業捕撈」與「造船工程管理」", "'Deep-Sea Fishery' & 'Shipbuilding Engineering'"),
      tr("「重機械操作」與「土木結構設計」", "'Heavy Machinery' & 'Civil Structural Design'"),
      tr("「半導體封裝」與「光電材料研發」", "'Semiconductor Packaging' & 'Optoelectronic Materials'"),
    ],
    ans: 0,
    exp: tr(
      "本系以「智慧旅館科技」與「奢華體驗管理」雙主軸推進課程革新，結合智慧科技、奢華管家款待與永續營運治理。",
      "The department advances curriculum innovation around the dual axes of 'Smart Hotel Technology' and 'Luxury Experience Management'."
    ),
  },
  {
    cat: tr("🔑 奢華微學分", "🔑 Luxury Micro-Credits"),
    q: tr("本系 8 門「奢華體驗管理微學分」（皆已完成三級三審）中，下列哪一門是 113-2 學期開設的課程？", "Which of these is one of the department's 8 Luxury Experience Management micro-credits (offered in 113-2)?"),
    opts: [
      tr("奢華酒店管家服務", "Luxury Hotel Butler Service"),
      tr("深海潛水教練實務", "Deep-Sea Diving Instruction"),
      tr("航空引擎維修實務", "Aircraft Engine Maintenance"),
      tr("鋼筋混凝土結構設計", "Reinforced Concrete Design"),
    ],
    ans: 0,
    exp: tr(
      "8 門奢華體驗管理微學分：113-2 人格特質剖析與旅館職業、行為面談解析及實務應用、國際連鎖品牌導論及領導統御、奢華酒店管家服務；114-1 旅館禮賓諮詢技巧、客房向上銷售技巧；114-2 實習職前準備與職場認知、國際品牌連鎖旅館發展史，皆已完成三級三審。",
      "The 8 micro-credits: Personality Analysis & Hotel Careers, Behavioural Interviews, International Hotel Brands & Leadership, Luxury Hotel Butler Service (113-2); Concierge Consultation Skills, Room Upselling Skills (114-1); Pre-Internship Preparation, History of International Hotel Chains (114-2)."
    ),
  },
  {
    cat: tr("🤖 智慧創新基地", "🤖 Smart Innovation Base"),
    q: tr("本系於 114 年 3 月揭牌、位於 D 棟 8 樓的智慧旅館實作場域名稱為何？", "What is the name of the smart hospitality base on the 8th floor of Building D, opened in March 2025?"),
    opts: [
      tr("餐旅數位智慧服務與創新基地", "Hospitality Digital Smart Service & Innovation Base"),
      tr("高空跳傘模擬訓練艙", "High-Altitude Skydiving Simulator"),
      tr("深海潛水減壓實驗室", "Deep-Sea Diving Decompression Lab"),
      tr("傳統鐵工廠鍛造車間", "Traditional Iron Forging Workshop"),
    ],
    ans: 0,
    exp: tr(
      "D 棟 8 樓「餐旅數位智慧服務與創新基地」於 114 年 3 月揭牌，設有 D808 智能服務中心等空間，智慧設備包含 AI 語音助理、服務型機器人、TMS 任務管理、智慧門鎖與清潔機器人。",
      "The 'Hospitality Digital Smart Service & Innovation Base' on Building D 8F opened in March 2025; it includes the D808 Smart Service Lab, with AI voice assistants, service robots, TMS, smart locks and cleaning robots."
    ),
  },
  {
    cat: tr("🕵️ 金鑰匙與神秘客", "🕵️ Gold Key & Mystery Audit"),
    q: tr("本系在奢華款待實務中，除了「Gold Touch 金鑰匙管家款待服務培訓」，更依中程發展計畫 S3 於群賢會館推動哪一項服務品質檢核訓練？", "Alongside Gold Touch Butler Training, what service quality programme does the department run at Elite House under mid-term plan S3?"),
    opts: [
      tr("實習旅館神秘客培訓（Mystery Guest Audit）", "Practicum Hotel Mystery Guest Training & Quality Audit"),
      tr("水質重金屬化學滴定檢測", "Heavy Metal Water Titration Analysis"),
      tr("高壓電塔絕緣測試", "High-Voltage Pylon Insulation Testing"),
      tr("航空渦輪葉片非破壞檢測", "Turbine Blade Non-Destructive Testing"),
    ],
    ans: 0,
    exp: tr(
      "中程發展計畫 S3「實習旅館神秘客培訓與反饋」由四班輪流試住群賢會館，回收評分表 92 份、提出改善建議 52 項（硬體 22 項、服務 30 項）。",
      "Under plan S3, four classes took turns staying at Elite House as mystery guests, returning 92 scoring sheets and 52 improvement suggestions (22 hardware, 30 service)."
    ),
  },
  {
    cat: tr("🌿 永續旅宿治理", "🌿 ESG Hospitality Governance"),
    q: tr("為培育綠色旅宿管理人才，本系「智慧餐旅永續營運治理」課程涵蓋哪些國際永續與能源管理標準？", "Which international sustainability and energy management standards does the Smart Hospitality for Sustainable Governance course cover?"),
    opts: [
      tr("ISO 14064 溫室氣體盤查、ISO 14067 碳足跡、ISO 50001 能源管理", "ISO 14064 GHG Inventory, ISO 14067 Carbon Footprint & ISO 50001 Energy Management"),
      tr("汽車駕照、機車駕照、遊艇駕照", "Car, Motorcycle & Yacht Licenses"),
      tr("游泳裁判證、潛水教練證、衝浪證", "Swimming Referee, Diving & Surfing Certificates"),
      tr("園藝丙級、木工丙級、泥水丙級", "Horticulture, Carpentry & Masonry Class-C"),
    ],
    ans: 0,
    exp: tr(
      "本系開設「智慧餐旅永續營運治理」課程，涵蓋 ISO 14064、ISO 14067 與 ISO 50001 等永續治理標準，並承接企業 ISO 14064 溫室氣體盤查產學案。",
      "The Smart Hospitality for Sustainable Governance course covers ISO 14064, ISO 14067 and ISO 50001, and the department carried out an ISO 14064 greenhouse-gas inventory industry project."
    ),
  },
  {
    cat: tr("🏆 頂尖研發與就業", "🏆 Research & Career Excellence"),
    q: tr("依政府研究資訊系統（GRB），本系許孟鈞老師主持的國科會 114–115 年多年期計畫研究什麼？", "According to the government GRB database, what does the 2025–2026 multi-year NSTC project led by Dr. Meng-Jun Hsu study?"),
    opts: [
      tr("以小語言模型（SLM）與檢索增強生成（RAG）打造服務溫度感知的對話式餐旅機器人", "A service-warmth-aware conversational hospitality robot built on small language models (SLM) and retrieval-augmented generation (RAG)"),
      tr("奧林匹克田徑訓練", "Olympic track training"),
      tr("流行音樂製作", "Pop music production"),
      tr("電影剪輯技術", "Film editing"),
    ],
    ans: 0,
    exp: tr(
      "許孟鈞老師主持國科會 114–115 年多年期計畫「基於小語言模型(SLM)與檢索增強生成(RAG)的服務溫度感知對話式餐旅機器人：跨世代生成式AI素養教學模式的實證研究」。另外，楊仁德教授曾入選 2021–2023 年發布之「全球前 2% 科學家」單年度榜。",
      "Dr. Meng-Jun Hsu leads the 2025–2026 multi-year NSTC project on SLM & RAG service-warmth-aware conversational hospitality robots. Prof. Jen-Te Yang also appeared in the single-year World's Top 2% Scientists lists released 2021–2023."
    ),
  },
];

// ---------- Procedural WebAudio Synthesizer (inspired by KilledByAPixel/ZzFX) ----------
const sfx = {
  ctx: null,
  enabled: true,
  init() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) this.ctx = new AC();
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
  },
  // 飯店櫃檯黃銅服務鈴 "Ding! 🛎️"
  bell() {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const freqs = [1318.5, 2637.0, 3951.1];
      const gains = [0.2, 0.1, 0.045];
      const decays = [0.9, 0.5, 0.28];
      freqs.forEach((f, idx) => {
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = idx === 0 ? "sine" : "triangle";
        osc.frequency.setValueAtTime(f, now);
        g.gain.setValueAtTime(0.001, now);
        g.gain.linearRampToValueAtTime(gains[idx], now + 0.008);
        g.gain.exponentialRampToValueAtTime(0.0001, now + decays[idx]);
        osc.connect(g).connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + decays[idx] + 0.02);
      });
    } catch {}
  },
  // 蓋章雙音提示
  stamp() {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      [587.33, 880].forEach((f, i) => {
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(f, now + i * 0.065);
        g.gain.setValueAtTime(0.14, now + i * 0.065);
        g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.065 + 0.25);
        osc.connect(g).connect(this.ctx.destination);
        osc.start(now + i * 0.065);
        osc.stop(now + i * 0.065 + 0.27);
      });
    } catch {}
  },
  // 連對 Combo 上升和弦音
  combo(streak = 1) {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const scale = [523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1174.66, 1318.5];
      const base = scale[Math.min(scale.length - 1, Math.max(0, streak - 1))];
      [base, base * 1.25].forEach((f, i) => {
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(f, now + i * 0.05);
        g.gain.setValueAtTime(0.15, now + i * 0.05);
        g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.05 + 0.28);
        osc.connect(g).connect(this.ctx.destination);
        osc.start(now + i * 0.05);
        osc.stop(now + i * 0.05 + 0.3);
      });
    } catch {}
  },
  // 升星／徽章／主線章節解鎖禮號角
  fanfare() {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(f, now + i * 0.08);
        g.gain.setValueAtTime(0.16, now + i * 0.08);
        g.gain.exponentialRampToValueAtTime(0.0008, now + i * 0.08 + 0.42);
        osc.connect(g).connect(this.ctx.destination);
        osc.start(now + i * 0.08);
        osc.stop(now + i * 0.08 + 0.45);
      });
    } catch {}
  },
  // 3D 角色跳躍音效（ZzFX 風格上揚彈跳音）
  jump() {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(280, now);
      osc.frequency.exponentialRampToValueAtTime(620, now + 0.16);
      g.gain.setValueAtTime(0.14, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      osc.connect(g).connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.19);
    } catch {}
  },
};

function blank() {
  return {
    v: 1,
    islands: [],
    items: [],
    flows: [],
    teachers: [],
    voices: [],
    checkins: [],
    skyCrafts: [],
    chapters: {},
    xp: 0,
    badges: {},
    counters: {},
    soundOn: true,
    hudMin: false,
    certName: "",
    bestQuizScore: 0,
    bestCombo: 0,
    daily: { day: "", done: false, streak: 0, last: "" },
    plaza: { day: "", met: [] },
    awards: {}, // one-time XP from other modules (grantXp), keyed so a reward is never paid twice
    intern: [], // 菁英實習護照: names of partner hotels stamped after the region question
  };
}
function load() {
  try {
    const o = JSON.parse(localStorage.getItem(STORE_KEY) || "null");
    if (o && o.v === 1) {
      return {
        ...blank(),
        ...o,
        checkins: Array.isArray(o.checkins) ? o.checkins : [],
        skyCrafts: Array.isArray(o.skyCrafts) ? o.skyCrafts : [],
        chapters: o.chapters && typeof o.chapters === "object" ? o.chapters : {},
        daily: { ...blank().daily, ...(o.daily || {}) },
        awards: o.awards && typeof o.awards === "object" ? o.awards : {},
        intern: Array.isArray(o.intern) ? o.intern.filter((x) => typeof x === "string").slice(0, 64) : [],
        plaza: o.plaza && typeof o.plaza === "object" && Array.isArray(o.plaza.met) ? { day: String(o.plaza.day || ""), met: o.plaza.met.slice(0, PLAZA_GREET_DAILY_MAX) } : blank().plaza,
      };
    }
  } catch {}
  return blank();
}
function save(s) {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(s));
  } catch {}
}
const dayKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619);
  return h >>> 0;
}

function waitForData() {
  return new Promise((resolve) => {
    if (window.__htl?.D) return resolve(window.__htl);
    window.addEventListener("htl:ready", () => resolve(window.__htl), { once: true });
  });
}

let S = load();
sfx.enabled = S.soundOn !== false;
let ctx = null; // { api, D, islands: Map, buildings: Map, flows: Map, teachers: Map }
const pending = []; // events that arrive before the data is ready

// Quiz session with shuffled 8-question draw, shuffled options, and combo streak tracking
const QUIZ_ROUND_LEN = 8;
let quizSession = {
  active: false,
  questions: [],
  idx: 0,
  score: 0,
  streak: 0,
  maxStreak: 0,
  bonusXpEarned: 0,
  answered: false,
  picked: -1,
  finished: false,
};

function startNewQuizRound() {
  // 第四期: 6 questions generated from official-data.js (quiz-gen.js: faculty, partner regions and groups, curriculum
  // credits, regulation pages) + 2 from the hand-checked scenario pool; options are shuffled per round
  const shuffleIn = (a) => {
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };
  let generated = [];
  try {
    generated = drawRound(OFFICIAL, QUIZ_ROUND_LEN - 2, { seed: (Math.random() * 2 ** 31) | 0, english });
  } catch (e) {
    console.warn("quiz-gen", e);
  }
  const hand = shuffleIn([...QUIZ_POOL]).slice(0, QUIZ_ROUND_LEN - generated.length).map((item) => {
    const indexed = shuffleIn(item.opts.map((text, origIdx) => ({ text, isAns: origIdx === item.ans })));
    return { cat: item.cat, q: item.q, opts: indexed.map((x) => x.text), ans: indexed.findIndex((x) => x.isAns), exp: item.exp };
  });
  const questions = shuffleIn([...generated, ...hand]);
  quizSession = {
    active: true,
    questions,
    idx: 0,
    score: 0,
    streak: 0,
    maxStreak: 0,
    bonusXpEarned: 0,
    answered: false,
    picked: -1,
    finished: false,
  };
}

window.addEventListener("htl:track", (e) => {
  if (!ctx) pending.push(e.detail);
  else onTrack(e.detail);
});

waitForData().then((api) => {
  const D = api.D;
  ctx = {
    api,
    D,
    islands: new Map(D.islands.map((i) => [i.id, i])),
    buildings: new Map(D.islands.flatMap((i) => i.buildings.map((b) => [b.id, { ...b, island: i.id }]))),
    flows: new Map(D.flows.map((f) => [f.id, f])),
    teachers: window.HTL_FACULTY_BY_ID instanceof Map ? window.HTL_FACULTY_BY_ID : new Map(),
  };
  S.islands = S.islands.filter((id) => ctx.islands.has(id));
  S.items = S.items.filter((id) => ctx.buildings.has(id));
  S.flows = S.flows.filter((id) => ctx.flows.has(id));
  S.teachers = S.teachers.filter((id) => !ctx.teachers.size || ctx.teachers.has(id));
  S.checkins = (S.checkins || []).filter((id) => ctx.islands.has(id));
  rollDaily();
  mountButton();
  mountQuestHud();
  for (const d of pending.splice(0)) onTrack(d);
  checkChaptersAndBadges(stars(), []);
  syncButton();
  syncQuestHud();

  // WASD / 搖桿 3D RPG 角色巡島與靠近建築／師長自動蓋章與探索感應
  if (new URLSearchParams(location.search).get("passport") === "1" || location.hash === "#passport") {
    setTimeout(() => openPassport(), 180);
  }
  setInterval(checkProximityNow, 850);
});

function checkProximityNow() {
  if (!ctx || document.hidden) return;
  const av = window.heartIslandAvatar;
  const hc = window.heartCity;
  const myPos = av?.S?.fig?.group?.position || av?.S?.me?.pos;
  if (!myPos || !hc) return;
  const centersObj = hc.navData?.islandCenters;
  const r = hc.navData?.islandRadius || 1.95;
  for (const id of ctx.islands.keys()) {
    if (S.islands.includes(id)) continue;
    try {
      let cx, cz, ir = r;
      if (centersObj && centersObj[id]) {
        cx = centersObj[id].x;
        cz = centersObj[id].z;
        ir = centersObj[id].r || r;
      } else if (hc.debug?.center) {
        [cx, cz, ir] = hc.debug.center(id);
      }
      if (cx !== undefined && Math.hypot(myPos.x - cx, myPos.z - cz) < (ir || r) * 0.92) {
        onTrack({ name: "htl_select", params: { item_type: "island", item_id: id } });
      }
    } catch {}
  }
  // 在 RPG 自由操控模式下，操控角色實地走近未解鎖的 3D 建築（< 0.52）或 3D 專任師長（< 0.58）時自動觸發探索紀錄與 +XP
  if (av?.S?.drive) {
    if (Array.isArray(av.buildings)) {
      for (const b of av.buildings) {
        if (S.items.includes(b.id)) continue;
        if (Math.hypot(myPos.x - b.cx, myPos.z - b.cz) < 0.52) {
          onTrack({ name: "htl_select", params: { item_type: "building", item_id: b.id } });
          break;
        }
      }
    }
    const facList = hc.getFacultyPositions?.() || [];
    for (const f of facList) {
      if (!f.id || f.id === "lord" || S.teachers.includes(f.id)) continue;
      if (Math.hypot(myPos.x - f.x, myPos.z - f.z) < 0.58) {
        onTrack({ name: "htl_teacher_select", params: { teacher: f.id } });
        break;
      }
    }
  }
}

// ---------- helper: current active chapter & next objective ----------
function getActiveChapterInfo() {
  for (let idx = 0; idx < SANDWICH_CHAPTERS.length; idx++) {
    const ch = SANDWICH_CHAPTERS[idx];
    const nextStep = ch.steps.find((st) => !st.check(S));
    if (nextStep) {
      const doneCount = ch.steps.filter((st) => st.check(S)).length;
      const target = typeof nextStep.go === "function" ? nextStep.go(S) : nextStep.go;
      return { chapter: ch, chapterIndex: idx + 1, step: nextStep, doneCount, totalSteps: ch.steps.length, target, allDone: false };
    }
  }
  return {
    chapter: SANDWICH_CHAPTERS[SANDWICH_CHAPTERS.length - 1],
    chapterIndex: SANDWICH_CHAPTERS.length,
    step: null,
    doneCount: 3,
    totalSteps: 3,
    target: null,
    allDone: true,
  };
}

// 解析當前主線任務目標的 3D 世界座標（供 3D 角色腳下黃金羅盤箭頭與 RPG 任務尋路使用）
function getTargetPos() {
  if (!ctx) return null;
  const hc = window.heartCity;
  const av = window.heartIslandAvatar;
  const centersObj = hc?.navData?.islandCenters || {};
  const info = getActiveChapterInfo();
  let target = info.target;
  let label = info.step ? tr(info.step.zh, info.step.en) : "";
  if (!target) {
    const unvisitedIsl = [...ctx.islands.keys()].find((id) => !S.islands.includes(id));
    if (unvisitedIsl) {
      target = { type: "island", id: unvisitedIsl };
      label = txt(ctx.islands.get(unvisitedIsl)?.name);
    } else {
      const unvisitedBld = [...ctx.buildings.keys()].find((id) => !S.items.includes(id));
      if (unvisitedBld) {
        target = { type: "building", id: unvisitedBld };
        label = txt(ctx.buildings.get(unvisitedBld)?.name);
      }
    }
  }
  if (!target) return null;
  if (target.type === "island") {
    const c = centersObj[target.id];
    const isl = ctx.islands.get(target.id);
    if (c) return { x: c.x, z: c.z, type: "island", id: target.id, label: label || txt(isl?.name) };
  } else if (target.type === "building") {
    const b = av?.buildings?.find((x) => x.id === target.id);
    const bMeta = ctx.buildings.get(target.id);
    if (b) return { x: b.cx, z: b.cz, type: "building", id: target.id, islandId: bMeta?.island, label: label || txt(bMeta?.name) };
    if (bMeta && centersObj[bMeta.island]) {
      const c = centersObj[bMeta.island];
      return { x: c.x, z: c.z, type: "building", id: target.id, islandId: bMeta.island, label: label || txt(bMeta.name) };
    }
  }
  return null;
}

function executeQuestTarget(target, useRpgWalk = false) {
  if (!ctx || !target) return;
  sfx.bell();
  const av = window.heartIslandAvatar;
  if (target.type === "quiz") {
    if (!quizSession.active || quizSession.finished) startNewQuizRound();
    openPassport();
    setTimeout(() => {
      overlay?.querySelector(".qp-quiz-card, .qp-quiz-banner")?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 80);
    return;
  }
  closePassport();
  if ((useRpgWalk || av?.S?.drive) && av?.api?.walkToQuestTarget) {
    av.api.walkToQuestTarget(target);
    return;
  }
  if (target.type === "island") {
    ctx.api.selectIsland?.(target.id);
  } else if (target.type === "building") {
    ctx.api.selectBuilding?.(target.id);
  }
}

function hopToNextUnexplored() {
  if (!ctx) return;
  sfx.bell();
  // Prefer unvisited islands first, otherwise unvisited buildings
  const unvisitedIslands = [...ctx.islands.keys()].filter((id) => !S.islands.includes(id));
  if (unvisitedIslands.length) {
    const pick = unvisitedIslands[Math.floor(Math.random() * unvisitedIslands.length)];
    closePassport();
    ctx.api.selectIsland?.(pick);
    return;
  }
  const unvisitedBlds = [...ctx.buildings.keys()].filter((id) => !S.items.includes(id));
  if (unvisitedBlds.length) {
    const pick = unvisitedBlds[Math.floor(Math.random() * unvisitedBlds.length)];
    closePassport();
    ctx.api.selectBuilding?.(pick);
    return;
  }
  toast(`<b>🎉 ${tr(`全島 ${ctx.islands.size || 20} 主題與 ${ctx.buildings.size || 133} 細項已全數制霸！`, `All ${ctx.islands.size || 20} islands & ${ctx.buildings.size || 133} items mastered!`)}</b>`, "level");
}

// ---------- achievements ----------
function badgeList() {
  const nI = ctx.islands.size,
    nB = ctx.buildings.size,
    nT = ctx.teachers.size || 10,
    half = Math.ceil(nB / 2);
  const c = S.counters;
  const pillarsDone = ONE_PLUS_THREE_PILLARS.filter((p) => S.islands.includes(p.island)).length;
  const eliteDone = ["sport", "trails", "renewal"].filter((k) => S.islands.includes(k)).length;
  const chaptersDone = SANDWICH_CHAPTERS.filter((ch) => ch.steps.every((st) => st.check(S))).length;
  return [
    { id: "first-island", ico: "🏝️", zh: "初次登島", en: "First landing", dzh: "造訪第一座主題島", den: "Visit your first theme island", ok: S.islands.length >= 1 },
    { id: "qunxian", ico: "🏨", zh: "群賢會館見習", en: "Qunxian Trainee", dzh: "造訪 06 群賢會館實習旅館專區", den: "Visit Island 06 Qunxian Hotel", ok: S.islands.includes("family") },
    { id: "ch1-clear", ico: "🎒", zh: "大一初探結業", en: "Freshman Clear", dzh: "完成主線第一章：大一初入高餐與群賢見習", den: "Complete Chapter 1: Freshman Check-In", ok: chaptersDone >= 1 },
    { id: "ch2-clear", ico: "💻", zh: "大二智慧款待", en: "Sophomore Clear", dzh: "完成主線第二章：專業核心、PMS 與師門請益", den: "Complete Chapter 2: Core Skills & PMS", ok: chaptersDone >= 2 },
    { id: "ch3-clear", ico: "🧳", zh: "大三三明治實習", en: "Junior Intern Clear", dzh: "完成主線第三章：三明治校外實習與菁英 3.0", den: "Complete Chapter 3: Sandwich Internship", ok: chaptersDone >= 3 },
    { id: "ch4-clear", ico: "🎓", zh: "四年養成全通關", en: "4-Year Master", dzh: "完成全部四章三明治職涯養成主線任務", den: "Complete all 4 Sandwich Career Chapters", ok: chaptersDone >= 4, p: [chaptersDone, 4] },
    { id: "oneplus3", ico: "📜", zh: "1+3 畢業門檻解鎖", en: "1+3 Certified", dzh: "巡禮完成 1+3 四大畢業條件對應島嶼", den: "Visit all 4 islands of the 1+3 Graduation Pillars", ok: pillarsDone >= 4, p: [pillarsDone, 4] },
    { id: "elite24", ico: "🌟", zh: "菁英實習 3.0 領航", en: "Elite 3.0 Navigator", dzh: "巡禮實習旅館專島、菁英實習 3.0 與升學就業島", den: "Explore Internship Hotels, Elite 3.0 & Career Islands", ok: eliteDone >= 3, p: [eliteDone, 3] },
    { id: "dual-axis", ico: "🔑", zh: "奢華智慧永續領航", en: "Luxury · Smart · ESG", dzh: "巡禮奢華體驗、數位智慧基地與永續治理三座新島", den: "Visit Luxury, Innovation Base & ESG Islands", ok: ["luxury", "innovation", "esg"].every((k) => S.islands.includes(k)), p: [["luxury", "innovation", "esg"].filter((k) => S.islands.includes(k)).length, 3] },
    { id: "quiz-champ", ico: "👑", zh: "高餐旅館知識王", en: "HTL Quiz Champion", dzh: "在護照「旅館知識王挑戰」取得 80 分以上", den: "Score 80+ in the Hospitality Knowledge Quiz", ok: (S.bestQuizScore || 0) >= 80, p: [Math.min(80, S.bestQuizScore || 0), 80] },
    { id: "quiz-combo5", ico: "⚡", zh: "禮賓連對王", en: "Combo Master", dzh: "在知識王挑戰達成連續答對 5 題 Combo", den: "Reach a 5x answer streak in the Quiz", ok: (S.bestCombo || 0) >= 5, p: [Math.min(5, S.bestCombo || 0), 5] },
    { id: "checkin-5", ico: "🛎️", zh: "禮賓打卡達人", en: "Concierge Bell Hop", dzh: "在 5 座主題島資訊卡按響禮賓打卡鈴", den: "Check in at 5 islands via the Concierge Bell", ok: (S.checkins?.length || 0) >= 5, p: [Math.min(5, S.checkins?.length || 0), 5] },
    { id: "islands-5", ico: "⛵", zh: "跳島旅人", en: "Island hopper", dzh: "造訪 5 座主題島", den: "Visit 5 theme islands", ok: S.islands.length >= 5, p: [S.islands.length, 5] },
    { id: "islands-all", ico: "🗺️", zh: "全島制霸", en: "All islands", dzh: `集滿 ${nI} 座主題島印章`, den: `Collect all ${nI} island stamps`, ok: S.islands.length >= nI, p: [S.islands.length, nI] },
    { id: "items-10", ico: "🔎", zh: "細項探索家", en: "Item explorer", dzh: "打開 10 個教學與實習細項", den: "Open 10 highlight items", ok: S.items.length >= 10, p: [S.items.length, 10] },
    { id: "items-half", ico: "📚", zh: "半程達人", en: "Halfway there", dzh: `打開 ${half} 個細項`, den: `Open ${half} items`, ok: S.items.length >= half, p: [S.items.length, half] },
    { id: "items-all", ico: "🏆", zh: "百項全通", en: "Completionist", dzh: `打開全部 ${nB} 個細項`, den: `Open all ${nB} items`, ok: S.items.length >= nB, p: [S.items.length, nB] },
    { id: "teachers-3", ico: "👩‍🏫", zh: "拜會師長", en: "Office hours", dzh: "在 3D 島上認識 3 位老師", den: "Meet 3 teachers on the island", ok: S.teachers.length >= 3, p: [S.teachers.length, 3] },
    { id: "teachers-all", ico: "👨‍🏫", zh: "師資巡禮", en: "Faculty tour", dzh: `認識全部 ${nT} 位專任(案)教師`, den: `Meet all ${nT} faculty members`, ok: S.teachers.length >= nT, p: [S.teachers.length, nT] },
    { id: "voice", ico: "🎧", zh: "聆聽師長", en: "Listener", dzh: "播放一段老師語音介紹", den: "Play a teacher's voice intro", ok: S.voices.length >= 1 },
    { id: "flows-5", ico: "🔗", zh: "產學連線", en: "Connector", dzh: "查看 5 條學習路線連結", den: "Open 5 route links", ok: S.flows.length >= 5, p: [S.flows.length, 5] },
    { id: "source", ico: "✅", zh: "查證小達人", en: "Fact checker", dzh: "點開一個官方來源連結", den: "Open an official source link", ok: (c.source || 0) >= 1 },
    { id: "search", ico: "🧭", zh: "精準搜尋", en: "Searcher", dzh: "用清單搜尋課程、師資或實習旅館", den: "Use the index search", ok: (c.search || 0) >= 1 },
    { id: "night", ico: "🌙", zh: "夜遊旅館島", en: "Night owl", dzh: "在夜晚時段打開一個主題或細項", den: "Open a theme or item at night", ok: (c.night || 0) >= 1 },
    { id: "avatar", ico: "👔", zh: "換裝登場", en: "Dressed up", dzh: "打開角色換裝或操控 3D 角色", den: "Open the avatar wardrobe", ok: (c.avatar || 0) >= 1 },
    { id: "top-win", ico: "🌀", zh: "陀螺高手", en: "Top spinner", dzh: "在陀螺對決中獲勝", den: "Win a spinning-top duel", ok: (c.topWin || 0) >= 1 },
    { id: "plaza-friends", ico: "🤝", zh: "旅伴交流", en: "Plaza mixer", dzh: "在旅伴廣場向 5 位不同的線上夥伴打招呼", den: "Greet 5 different online visitors in the plaza", ok: (c.plazaGreet || 0) >= 5, p: [Math.min(5, c.plazaGreet || 0), 5] },
    { id: "plaza-mentor", ico: "🧭", zh: "學長姐帶路", en: "Mentor", dzh: "三星以上時，與一位一星新手同在一座主題島", den: "At 3★ or above, share an island with a 1★ newcomer", ok: (c.plazaMentor || 0) >= 1 },
    { id: "plaza-guided", ico: "🎒", zh: "新生同行", en: "Guided newcomer", dzh: "一星時，與一位三星以上的夥伴同在一座主題島", den: "As a 1★ newcomer, share an island with a 3★+ visitor", ok: (c.plazaGuided || 0) >= 1 },
    { id: "streak-3", ico: "🔥", zh: "連續三天", en: "3-day streak", dzh: "連續 3 天完成每日任務", den: "Finish the daily quest 3 days in a row", ok: (S.daily.streak || 0) >= 3, p: [Math.min(3, S.daily.streak || 0), 3] },
  ];
}

function stars() {
  let n = 1;
  for (let i = 0; i < STARS.length; i++) if (S.xp >= STARS[i]) n = i + 1;
  return n;
}

// ---------- daily quest ----------
function rollDaily() {
  const today = dayKey();
  if (S.daily.day === today) return;
  const ids = [...ctx.islands.keys()];
  S.daily.day = today;
  S.daily.target = ids[hash(today) % ids.length];
  S.daily.done = false;
  save(S);
}

// ---------- check & award newly unlocked chapters, badges, and stars ----------
function checkChaptersAndBadges(beforeStars, gained = []) {
  const freshChapters = [];
  for (const ch of SANDWICH_CHAPTERS) {
    if (!S.chapters[ch.id] && ch.steps.every((st) => st.check(S))) {
      S.chapters[ch.id] = Date.now();
      S.xp += ch.xp;
      freshChapters.push(ch);
    }
  }
  const freshBadges = [];
  for (const b of badgeList()) {
    if (b.ok && !S.badges[b.id]) {
      S.badges[b.id] = Date.now();
      S.xp += XP.badge;
      freshBadges.push(b);
    }
  }
  save(S);
  syncButton();
  syncQuestHud();
  if (overlay && !overlay.hidden) renderPassport();
  for (const g of gained) toast(`<b>+${g.xp} XP</b> ${esc(g.label)}`, "xp");
  for (const ch of freshChapters) {
    toast(
      `<span class="qp-t-ico">${ch.ico}</span><span><small>${tr("主線章節通關", "Chapter Completed")} +${ch.xp} XP</small><b>${esc(tr(ch.zh, ch.en))}</b></span>`,
      "level"
    );
    sfx.fanfare();
    celebrate(0.85);
  }
  for (const b of freshBadges) {
    toast(`<span class="qp-t-ico">${b.ico}</span><span><small>${tr("解鎖成就", "Achievement unlocked")}</small><b>${esc(tr(b.zh, b.en))}</b></span>`, "badge");
    sfx.fanfare();
    celebrate(0.6);
  }
  const after = stars();
  if (after > beforeStars) {
    toast(`<span class="qp-t-ico">${"★".repeat(after)}</span><span><small>${tr("星等升級", "Level up")}</small><b>${esc(tr(...STAR_TITLE[after - 1]))}</b></span>`, "level");
    sfx.fanfare();
    celebrate(1);
  }
  if (gained.length || freshChapters.length || freshBadges.length || after > beforeStars) {
    try {
      window.dispatchEvent(
        new CustomEvent("htl:xp", {
          detail: {
            gained,
            freshChapters,
            freshBadges,
            xp: S.xp,
            stars: after,
            title: tr(...STAR_TITLE[after - 1]),
          },
        })
      );
    } catch {}
  }
}

// ---------- event handling ----------
function onTrack({ name, params = {} }) {
  rollDaily();
  const before = stars();
  const gained = [];
  const add = (list, id, xp, label) => {
    if (!id || S[list].includes(id)) return false;
    S[list].push(id);
    S.xp += xp;
    gained.push({ xp, label });
    return true;
  };
  const night = document.body.classList.contains("night");
  if (name === "htl_select") {
    const { item_type: type, item_id: id } = params;
    if (type === "island" && ctx.islands.has(id)) {
      if (add("islands", id, XP.island, tr(`新印章：${txt(ctx.islands.get(id).name)}`, `New stamp: ${txt(ctx.islands.get(id).name)}`))) stampFx(id);
      dailyCheck(id, gained);
      if (night) bump("night");
      injectCard("island", id);
    } else if (type === "building" && ctx.buildings.has(id)) {
      const b = ctx.buildings.get(id);
      if (add("islands", b.island, XP.island, tr(`新印章：${txt(ctx.islands.get(b.island).name)}`, `New stamp: ${txt(ctx.islands.get(b.island).name)}`))) stampFx(b.island);
      add("items", id, XP.building, tr(`收藏細項：${txt(b.name)}`, `Item collected: ${txt(b.name)}`));
      dailyCheck(b.island, gained);
      if (night) bump("night");
      injectCard("building", id);
    } else if (type === "flow" && ctx.flows.has(id)) {
      if (add("flows", id, XP.flow, tr("新學習路線", "New route link"))) {
        // 學習路線章: every link of a theme opened → one stamp (+40 XP, once)
        for (const th of FLOW_THEMES) if (th.ids.includes(id) && th.ids.every((x) => S.flows.includes(x))) setTimeout(() => grantXp(`route:${th.id}`, 40, tr(`學習路線章：${th.zh}`, `Route stamp: ${th.en}`)), 600);
      }
    } else if (type === "skyCraft" && id) {
      S.skyCrafts ||= [];
      if (
        add(
          "skyCrafts",
          id,
          XP.skyCraft,
          tr(`發現空中宣導布條：${params.item_label || id}`, `Sky banner spotted: ${params.item_label || id}`)
        )
      ) {
        sfx.bell();
      }
      if (night) bump("night");
    }
  } else if (name === "htl_teacher_select") {
    const t = ctx.teachers.get(params.teacher);
    add("teachers", params.teacher, XP.teacher, tr(`認識 ${txt(t?.name) || "師長"}`, `Met ${txt(t?.name) || "faculty"}`));
  } else if (name === "htl_teacher_voice") {
    add("voices", params.teacher, XP.voice, tr("聆聽擬真語音導覽", "Listened to voice guide"));
  } else if (name === "htl_source_click") {
    if (!S.counters.source) {
      S.xp += XP.source;
      gained.push({ xp: XP.source, label: tr("查證官方來源", "Checked official source") });
    }
    bump("source");
  } else if (name === "htl_search") bump("search");
  else if (name === "htl_avatar_open") bump("avatar");
  else if (name === "htl_top_play" && params.result === "win") bump("topWin");
  else if (name === "htl_plaza_greet") {
    // 只由 island-social.js 在「主動向線上夥伴揮手／鞠躬／舉杯」時觸發（不經過 analytics，不外送夥伴 id）
    const peer = typeof params.peer === "string" ? params.peer.slice(0, 40) : "";
    const today = dayKey();
    if (S.plaza.day !== today) S.plaza = { day: today, met: [] };
    if (!peer || S.plaza.met.includes(peer) || S.plaza.met.length >= PLAZA_GREET_DAILY_MAX) return;
    S.plaza.met.push(peer);
    S.xp += XP.plazaGreet;
    gained.push({ xp: XP.plazaGreet, label: tr(`旅伴交流（今日 ${S.plaza.met.length}/${PLAZA_GREET_DAILY_MAX} 位）`, `Plaza greeting (${S.plaza.met.length}/${PLAZA_GREET_DAILY_MAX} today)`) });
    bump("plazaGreet");
  } else if (name === "htl_plaza_mentor") {
    if (S.counters.plazaMentor) return;
    bump("plazaMentor");
  } else if (name === "htl_plaza_guided") {
    if (S.counters.plazaGuided) return;
    bump("plazaGuided");
  } else return;

  checkChaptersAndBadges(before, gained);
}
function bump(k) {
  S.counters[k] = (S.counters[k] || 0) + 1;
}
// 第四期: two more daily tasks beside the island visit — finish one quiz round, and stamp one internship hotel
const DAILY_EXTRA_XP = 30;
function dailyExtra(kind) {
  const today = dayKey();
  if (!S.daily.extra || S.daily.extra.day !== today) S.daily.extra = { day: today, quiz: false, intern: false };
  if (!kind || S.daily.extra[kind]) return false;
  S.daily.extra[kind] = true;
  S.xp += DAILY_EXTRA_XP;
  save(S);
  toast(`<b>+${DAILY_EXTRA_XP} XP</b> ${esc(kind === "quiz" ? tr("每日任務：完成一輪知識挑戰", "Daily: finished a quiz round") : tr("每日任務：蓋一枚實習章", "Daily: one internship stamp"))}`, "xp");
  return true;
}
function dailyCheck(islandId, gained) {
  if (S.daily.done || S.daily.target !== islandId) return;
  S.daily.done = true;
  const y = new Date();
  y.setDate(y.getDate() - 1);
  S.daily.streak = S.daily.last === dayKey(y) ? (S.daily.streak || 0) + 1 : 1;
  S.daily.last = S.daily.day;
  S.xp += XP.daily;
  gained.push({ xp: XP.daily, label: tr(`完成每日任務（連續 ${S.daily.streak} 天）`, `Daily quest done (${S.daily.streak}-day streak)`) });
}

// ---------- island card: per-island progress, concierge bell check-in & chain discovery ----------
function injectCard(type, id) {
  requestAnimationFrame(() => {
    const root = document.querySelector("#card-content");
    if (!root) return;
    root.querySelector(".qp-card")?.remove();
    const islandId = type === "island" ? id : ctx.buildings.get(id)?.island;
    const isl = ctx.islands.get(islandId);
    if (!isl) return;
    const seen = isl.buildings.filter((b) => S.items.includes(b.id)).length;
    const nextUnseen = isl.buildings.find((b) => !S.items.includes(b.id));
    const checkedIn = (S.checkins || []).includes(islandId);
    const dots = isl.buildings
      .map(
        (b) =>
          `<button type="button" class="qp-dot${S.items.includes(b.id) ? " on" : ""}${b.id === id ? " cur" : ""}" data-qp-bldg="${esc(b.id)}" title="${esc(txt(b.name))}"></button>`
      )
      .join("");
    const el = document.createElement("div");
    el.className = "qp-card";
    el.innerHTML = `
      <div class="qp-card-top">
        <button type="button" class="qp-card-btn" data-qp-open-passport aria-label="${tr("開啟旅館島護照", "Open passport")}">
          <span class="qp-stamp-mini">🛂</span>
          <span>${tr("本島探索進度", "Island progress")} <b>${seen}/${isl.buildings.length}</b> ${seen === isl.buildings.length ? `<em class="qp-mastered">★ ${tr("全制霸", "Mastered")}</em>` : ""}</span>
        </button>
        <div class="qp-dots" role="group" aria-label="${tr("本島細項點選切換", "Switch island items")}">${dots}</div>
      </div>
      <div class="qp-card-actions">
        <button type="button" class="qp-card-act${checkedIn ? " done" : ""}" data-qp-checkin="${esc(islandId)}">
          ${checkedIn ? `🛎️ ${tr("本島已禮賓打卡", "Checked In")}` : `🛎️ ${tr(`禮賓鈴打卡 +${XP.checkin} XP`, `Concierge Check-In +${XP.checkin} XP`)}`}
        </button>
        ${
          nextUnseen
            ? `<button type="button" class="qp-card-act primary" data-qp-next-bldg="${esc(nextUnseen.id)}">
                ➡️ ${tr(`探索下一細項 +${XP.building} XP`, `Next Item +${XP.building} XP`)}
              </button>`
            : `<button type="button" class="qp-card-act primary" data-qp-hop>
                🚀 ${tr("飛往下一未探索島嶼", "Hop to Next Unexplored")}
              </button>`
        }
      </div>`;
    el.addEventListener("click", (ev) => {
      const bldgBtn = ev.target.closest("[data-qp-bldg]");
      if (bldgBtn) {
        sfx.stamp();
        ctx.api.selectBuilding?.(bldgBtn.dataset.qpBldg);
        return;
      }
      if (ev.target.closest("[data-qp-open-passport]")) {
        sfx.bell();
        openPassport();
        return;
      }
      const nextBtn = ev.target.closest("[data-qp-next-bldg]");
      if (nextBtn) {
        sfx.stamp();
        ctx.api.selectBuilding?.(nextBtn.dataset.qpNextBldg);
        return;
      }
      if (ev.target.closest("[data-qp-hop]")) {
        hopToNextUnexplored();
        return;
      }
      const checkBtn = ev.target.closest("[data-qp-checkin]");
      if (checkBtn) {
        const targetIsl = checkBtn.dataset.qpCheckin;
        sfx.bell();
        if (!S.checkins.includes(targetIsl)) {
          const before = stars();
          S.checkins.push(targetIsl);
          S.xp += XP.checkin;
          checkChaptersAndBadges(before, [
            {
              xp: XP.checkin,
              label: tr(`禮賓打卡：${txt(isl.name)}`, `Checked in: ${txt(isl.name)}`),
            },
          ]);
          injectCard(type, id);
        } else {
          toast(`<b>🛎️ Ding!</b> ${esc(tr(`已完成「${txt(isl.name)}」禮賓打卡！`, `Already checked in at ${txt(isl.name)}!`))}`, "xp");
        }
      }
    });
    const anchor = root.querySelector(".pills") || root.querySelector(".card-head");
    anchor?.after(el);
  });
}

// ---------- floating quest tracker HUD (#qp-hud) on 3D view ----------
let hudEl = null;
function mountQuestHud() {
  if (hudEl) return;
  const app = document.querySelector("#app") || document.body;
  hudEl = document.createElement("aside");
  hudEl.id = "qp-hud";
  hudEl.className = "qp-hud";
  hudEl.setAttribute("aria-label", tr("四年三明治養成任務導航", "4-Year Sandwich Quest Tracker"));
  hudEl.addEventListener("click", (e) => {
    if (e.target.closest("[data-qp-hud-toggle]")) {
      S.hudMin = !S.hudMin;
      save(S);
      syncQuestHud();
      return;
    }
    if (e.target.closest("[data-qp-hud-go]")) {
      const info = getActiveChapterInfo();
      if (info.target) executeQuestTarget(info.target);
      else hopToNextUnexplored();
      return;
    }
    if (e.target.closest("[data-qp-hud-rpg]")) {
      const av = window.heartIslandAvatar;
      if (av?.api) {
        const info = getActiveChapterInfo();
        if (!av.S.drive) av.api.toggleDrive(true);
        if (info.target && info.target.type !== "quiz" && av.api.walkToQuestTarget) {
          av.api.walkToQuestTarget(info.target);
        }
        syncQuestHud();
      }
      return;
    }
    if (e.target.closest("[data-qp-hud-hop]")) {
      hopToNextUnexplored();
      return;
    }
    if (e.target.closest("[data-qp-hud-passport]")) {
      sfx.bell();
      openPassport();
    }
  });
  app.appendChild(hudEl);
}

function syncQuestHud() {
  if (!hudEl || !ctx) return;
  const n = stars();
  const lo = STARS[n - 1],
    hi = STARS[n] ?? null;
  const pct = hi ? Math.min(100, Math.round(((S.xp - lo) / (hi - lo)) * 100)) : 100;
  const info = getActiveChapterInfo();
  hudEl.classList.toggle("min", !!S.hudMin);

  if (S.hudMin) {
    hudEl.innerHTML = `
      <div class="qp-hud-min-bar">
        <button type="button" class="qp-hud-pill-btn" data-qp-hud-passport title="${tr("開啟旅館島學習護照", "Open Island Passport")}">
          <span>${info.chapter.ico}</span>
          <b>${"★".repeat(n)}</b>
          <span>${S.xp} XP</span>
        </button>
        <button type="button" class="qp-hud-go-mini" data-qp-hud-go title="${tr("前往下一主線任務目標", "Go to next quest objective")}">
          🎯 ${tr("任務導航", "Quest")}
        </button>
        <button type="button" class="qp-hud-min-btn" data-qp-hud-toggle aria-label="${tr("展開任務面板", "Expand quest tracker")}" title="${tr("展開任務面板", "Expand")}">＋</button>
      </div>`;
    return;
  }

  const chDoneCount = SANDWICH_CHAPTERS.filter((c) => c.steps.every((st) => st.check(S))).length;
  const rpgActive = !!window.heartIslandAvatar?.S?.drive;
  hudEl.innerHTML = `
    <div class="qp-hud-head">
      <button type="button" class="qp-hud-lvl" data-qp-hud-passport title="${tr("點擊開啟完整旅館島護照", "Click to open full Passport")}">
        <span class="qp-hud-stars">${"★".repeat(n)}</span>
        <span class="qp-hud-title"><b class="qp-lv">Lv ${levelOf(S.xp)}</b> ${esc(tr(...STAR_TITLE[n - 1]))}</span>
        <b class="qp-hud-xp-num">${S.xp} XP</b>
      </button>
      <button type="button" class="qp-hud-min-btn" data-qp-hud-toggle aria-label="${tr("收合任務面板", "Minimize quest tracker")}" title="${tr("收合為膠囊", "Minimize")}">－</button>
    </div>
    <div class="qp-hud-bar" title="${hi ? tr(`距離下一星等還差 ${hi - S.xp} XP`, `${hi - S.xp} XP to next star`) : tr("已達最高五星領航員", "Max 5-star rating")}"><i style="width:${pct}%"></i></div>
    <div class="qp-hud-quest">
      <div class="qp-hud-q-meta">
        <span class="qp-hud-tag">${info.allDone ? "👑 MASTERED" : `${info.chapter.year} · ${info.doneCount}/${info.totalSteps}`}</span>
        <small>${tr(`四年養成主線 (${chDoneCount}/4 章)`, `Main Story (${chDoneCount}/4)`)}</small>
      </div>
      <b class="qp-hud-q-name">${esc(info.allDone ? tr("🎉 四年三明治養成主線全數通關！", "🎉 All 4 Sandwich Chapters Completed!") : tr(info.step.zh, info.step.en))}</b>
    </div>
    <div class="qp-hud-actions">
      <button type="button" class="qp-hud-btn primary" data-qp-hud-go>
        🎯 ${info.allDone ? tr("隨機探索未解鎖", "Explore Remaining") : tr("引導前往 →", "Objective →")}
      </button>
      <button type="button" class="qp-hud-btn${rpgActive ? " active" : ""}" data-qp-hud-rpg title="${tr("啟動 3D 角色 RPG 操控並自動走向任務目標", "Launch 3D RPG Avatar & walk to quest objective")}">
        🕹️ ${tr("RPG 走訪", "RPG Walk")}
      </button>
      <button type="button" class="qp-hud-btn" data-qp-hud-passport title="${tr("開啟學習護照與知識王問答", "Open Passport & Quiz")}">
        🛂 ${tr("護照", "Passport")}
      </button>
    </div>`;
}

// ---------- toolbar button ----------
let btn = null;
function mountButton() {
  const bar = document.querySelector("nav.toolbar");
  if (!bar || btn) return;
  btn = document.createElement("button");
  btn.id = "passport-btn";
  btn.type = "button";
  btn.className = "qp-btn";
  btn.onclick = () => {
    sfx.bell();
    openPassport();
  };
  bar.insertBefore(btn, document.querySelector("#sidebar-toggle"));
}
function syncButton() {
  if (!btn || !ctx) return;
  const n = stars();
  btn.innerHTML = `<i class="tb-ic" aria-hidden="true">🛂</i><span class="qp-btn-l">${tr("護照", "Passport")}</span><b class="tb-lbl">${S.islands.length}/${ctx.islands.size}</b><span class="qp-btn-s" aria-hidden="true">${"★".repeat(n)}</span>`;
  btn.title = tr(`旅館島護照：${S.islands.length}/${ctx.islands.size} 島、${S.items.length}/${ctx.buildings.size} 細項，${S.xp} XP`, `Passport: ${S.islands.length}/${ctx.islands.size} islands, ${S.items.length}/${ctx.buildings.size} items, ${S.xp} XP`);
  btn.setAttribute("aria-label", btn.title);
  btn.classList.toggle("daily", !S.daily.done);
}

// ---------- passport dialog ----------
let overlay = null,
  lastFocus = null;
function openPassport() {
  if (!ctx) return;
  rollDaily();
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.className = "qp-overlay";
    overlay.hidden = true;
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) closePassport();
      if (onInternClick(e)) return;
      const isl = e.target.closest("[data-qp-island]");
      if (isl) {
        closePassport();
        ctx.api.selectIsland?.(isl.dataset.qpIsland);
      }
      const chGo = e.target.closest("[data-qp-ch-go]");
      if (chGo) {
        const chId = chGo.dataset.qpChGo;
        const ch = SANDWICH_CHAPTERS.find((c) => c.id === chId);
        const st = ch?.steps.find((s) => !s.check(S)) || ch?.steps[0];
        if (st) {
          const target = typeof st.go === "function" ? st.go(S) : st.go;
          executeQuestTarget(target);
        }
      }
      if (e.target.closest("[data-qp-top]")) {
        closePassport();
        window.__htlTop?.open?.();
        return;
      }
      if (e.target.closest("[data-qp-bell]")) {
        sfx.bell();
        toast(`<b>🛎️ Ding!</b> ${esc(tr("歡迎光臨國立高雄餐旅大學旅館管理系・群賢會館禮賓檯！", "Welcome to NKUHT Department of Hotel Management Concierge!"))}`, "xp");
      }
      if (e.target.closest("[data-qp-sound]")) {
        sfx.enabled = !sfx.enabled;
        S.soundOn = sfx.enabled;
        save(S);
        if (sfx.enabled) sfx.bell();
        renderPassport();
      }
      if (e.target.closest("[data-qp-cert-celebrate]")) {
        sfx.fanfare();
        celebrate(1.2);
        toast(`<b>🎓 ${tr("恭喜榮獲高餐大旅館管理系・旅館島榮譽領航認證！", "Congratulations on earning the NKUHT HTL Honorary Navigator Certificate!")}</b>`, "level");
      }
      if (e.target.closest("[data-qp-quiz-start]")) {
        startNewQuizRound();
        sfx.bell();
        renderPassport();
      }
      const optBtn = e.target.closest("[data-qp-quiz-opt]");
      if (optBtn && quizSession.active && !quizSession.answered) {
        const picked = Number(optBtn.dataset.qpQuizOpt);
        const cur = quizSession.questions[quizSession.idx];
        quizSession.answered = true;
        quizSession.picked = picked;
        if (picked === cur.ans) {
          quizSession.score++;
          quizSession.streak++;
          if (quizSession.streak > quizSession.maxStreak) quizSession.maxStreak = quizSession.streak;
          if (quizSession.streak > (S.bestCombo || 0)) S.bestCombo = quizSession.streak;
          const comboBonus = quizSession.streak >= 2 ? quizSession.streak * 2 : 0;
          quizSession.bonusXpEarned += XP.quizCorrect + comboBonus;
          sfx.combo(quizSession.streak);
        } else {
          quizSession.streak = 0;
        }
        renderPassport();
      }
      if (e.target.closest("[data-qp-quiz-next]")) {
        const totalQ = quizSession.questions.length;
        if (quizSession.idx + 1 < totalQ) {
          quizSession.idx++;
          quizSession.answered = false;
          quizSession.picked = -1;
          renderPassport();
        } else {
          quizSession.finished = true;
          dailyExtra("quiz");
          const pctScore = Math.round((quizSession.score / totalQ) * 100);
          const before = stars();
          const gained = [];
          // Award first-time high score improvement XP + passing bonus
          if (pctScore > (S.bestQuizScore || 0)) {
            const diffBonus = Math.min(40, quizSession.bonusXpEarned);
            if (diffBonus > 0) {
              S.xp += diffBonus;
              gained.push({
                xp: diffBonus,
                label: tr(`知識王答題與 Combo 獎勵（最高 ${quizSession.maxStreak} 連對）`, `Quiz & Combo Bonus (${quizSession.maxStreak}x streak)`),
              });
            }
            if ((S.bestQuizScore || 0) < 80 && pctScore >= 80) {
              S.xp += XP.quiz;
              gained.push({ xp: XP.quiz, label: tr("通過旅館知識王挑戰（80分以上）", "Passed Hospitality Quiz (80+)") });
            }
            S.bestQuizScore = pctScore;
          }
          checkChaptersAndBadges(before, gained);
          renderPassport();
        }
      }
      if (e.target.closest("[data-qp-close]")) closePassport();
      if (e.target.closest("[data-qp-reset]") && confirm(tr("確定要清除這台裝置上的護照進度嗎？", "Reset passport progress on this device?"))) {
        S = blank();
        quizSession = { active: false, questions: [], idx: 0, score: 0, streak: 0, maxStreak: 0, bonusXpEarned: 0, answered: false, picked: -1, finished: false };
        rollDaily();
        save(S);
        syncButton();
        syncQuestHud();
        renderPassport();
      }
    });
    overlay.addEventListener("input", (e) => {
      const certInput = e.target.closest("[data-qp-cert-name]");
      if (certInput) {
        S.certName = certInput.value.slice(0, 24);
        save(S);
      }
    });
    overlay.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        closePassport();
      }
    });
    document.body.appendChild(overlay);
  }
  lastFocus = document.activeElement;
  renderPassport();
  overlay.hidden = false;
  overlay.querySelector(".qp-close")?.focus();
  window.__heartTrack?.("htl_passport_open");
}
function closePassport() {
  if (!overlay) return;
  overlay.hidden = true;
  lastFocus?.focus?.();
}

function renderChaptersSection() {
  return `<div class="qp-chapters">
    ${SANDWICH_CHAPTERS.map((ch) => {
      const doneSteps = ch.steps.filter((st) => st.check(S)).length;
      const allDone = doneSteps === ch.steps.length;
      const stepsHtml = ch.steps
        .map((st) => {
          const ok = st.check(S);
          return `<li class="${ok ? "done" : ""}"><span>${ok ? "✅" : "⬜"}</span> ${esc(tr(st.zh, st.en))}</li>`;
        })
        .join("");
      return `<article class="qp-chapter${allDone ? " done" : ""}">
        <div class="qp-chapter-head">
          <span class="qp-chapter-yr">${esc(ch.year)}</span>
          <span class="qp-chapter-ico">${ch.ico}</span>
          <div class="qp-chapter-title">
            <b>${esc(tr(ch.zh, ch.en))}</b>
            <small>${esc(tr(ch.descZh, ch.descEn))}</small>
          </div>
          <span class="qp-chapter-xp">${allDone ? `✅ +${ch.xp} XP` : `+${ch.xp} XP`}</span>
        </div>
        <ul class="qp-chapter-steps">${stepsHtml}</ul>
        <div class="qp-chapter-foot">
          <span>${tr(`章節進度：${doneSteps}/${ch.steps.length}`, `Progress: ${doneSteps}/${ch.steps.length}`)}</span>
          ${
            allDone
              ? `<span class="qp-chapter-cleared">🏅 ${tr("已完成本章養成", "Chapter Completed")}</span>`
              : `<button type="button" class="qp-go sm" data-qp-ch-go="${esc(ch.id)}">🎯 ${tr("引導前往下一步 →", "Go to Next Step →")}</button>`
          }
        </div>
      </article>`;
    }).join("")}
  </div>`;
}

function renderCertificateSection() {
  const n = stars();
  const chaptersDone = SANDWICH_CHAPTERS.filter((ch) => ch.steps.every((st) => st.check(S))).length;
  const unlocked = n >= 4 || chaptersDone >= 4 || (S.bestQuizScore || 0) >= 80;
  if (!unlocked) {
    return `<div class="qp-cert-locked">
      <span class="qp-cert-ico">🎓</span>
      <div>
        <b>${tr("高餐大旅館管理系・榮譽領航結業證書（尚未解鎖）", "NKUHT HTL Honorary Navigator Certificate (Locked)")}</b>
        <small>${tr("達成「四星旅人」、「完成四章三明治養成主線」或「旅館知識王 80 分以上」任一條件即可解鎖專屬結業證書！", "Reach 4 Stars, complete all 4 Sandwich Chapters, or score 80+ in the Quiz to unlock your certificate!")}</small>
      </div>
    </div>`;
  }
  const holder = S.certName?.trim() || tr("高餐旅館領航員", "NKUHT Hospitality Navigator");
  return `<div class="qp-cert">
    <div class="qp-cert-ribbon">NKUHT DEPARTMENT OF HOTEL MANAGEMENT · HONORARY CERTIFICATE</div>
    <div class="qp-cert-main">
      <div class="qp-cert-seal">🏆<span>SINCE 1995</span></div>
      <div class="qp-cert-body">
        <h4>${tr("國立高雄餐旅大學 旅館管理系・旅館島榮譽領航結業證書", "NKUHT Dept. of Hotel Management · Honorary Island Navigator Certificate")}</h4>
        <p>${tr(
          `茲證明 <b>${esc(holder)}</b> 完成旅館島三明治教學實務巡禮（累積 <b>${S.xp} XP</b>・<b>${S.islands.length}/${ctx.islands.size}</b> 座主題島・知識王最高 <b>${S.bestQuizScore || 0}</b> 分），熟稔 1+3 畢業條件、群賢會館實務與 24 家菁英實習計畫 3.0 標竿旅館體系。`,
          `This certifies that <b>${esc(holder)}</b> has mastered the NKUHT Hotel Management 3D Island (${S.xp} XP · ${S.islands.length}/${ctx.islands.size} Islands · Quiz Best ${S.bestQuizScore || 0} pts), demonstrating excellence in the 1+3 Graduation Standard, Elite House Practicum, and 24 Elite Internship 3.0 Partner Hotels.`
        )}</p>
        <div class="qp-cert-controls">
          <label>${tr("證書署名：", "Name on Certificate:")}
            <input type="text" data-qp-cert-name value="${esc(S.certName || window.heartIslandAvatar?.S?.look?.name || "")}" placeholder="${tr("輸入您的姓名或暱稱…", "Enter your name...")}" maxlength="24">
          </label>
          <button type="button" class="qp-go" data-qp-cert-celebrate>🎉 ${tr("鳴響禮賓鐘＆施放禮花", "Ring Bell & Celebrate")}</button>
        </div>
      </div>
    </div>
  </div>`;
}

function renderQuizSection() {
  if (!quizSession.active) {
    return `<div class="qp-quiz-banner">
      <div class="qp-quiz-banner-info">
        <b>🧠 ${tr("高餐旅館知識王 ＆ 群賢禮賓情境挑戰（隨機 8 題・含連對 Combo 加成）", "NKUHT Hospitality & Concierge Scenario Quiz (8 Shuffled Questions + Combo Bonus)")}</b>
        <small>${tr(
          `目前最高紀錄：${S.bestQuizScore || 0} 分（最高連對 ${S.bestCombo || 0} Combo）・達 80 分可獲 +${XP.quiz} XP 並解鎖「👑 高餐旅館知識王」與第四章主線！`,
          `Best score: ${S.bestQuizScore || 0} pts (Max ${S.bestCombo || 0}x Combo) · Score 80+ for +${XP.quiz} XP, Quiz Champion badge & Chapter 4!`
        )}</small>
      </div>
      <button type="button" class="qp-go" data-qp-quiz-start>${tr("開始挑戰 🛎️", "Start Quiz 🛎️")}</button>
    </div>`;
  }
  const totalQ = quizSession.questions.length;
  if (quizSession.finished) {
    const finalScore = Math.round((quizSession.score / totalQ) * 100);
    return `<div class="qp-quiz-card">
      <div class="qp-quiz-result">
        <span class="qp-quiz-trophy">${finalScore >= 80 ? "🏆" : "🛎️"}</span>
        <div>
          <b>${tr(
            `挑戰完成！本次得分：${finalScore} 分（答對 ${quizSession.score}/${totalQ} 題・最高連對 ${quizSession.maxStreak} Combo 🔥）`,
            `Quiz Complete! Score: ${finalScore} pts (${quizSession.score}/${totalQ} · Max ${quizSession.maxStreak}x Combo 🔥)`
          )}</b>
          <small>${
            finalScore >= 80
              ? tr("恭喜熟稔高餐大旅館系沿革、1+3 畢業條件、PMS 系統與菁英實習 3.0！", "Great job mastering NKUHT Hotel Management official facts & scenarios!")
              : tr("每次挑戰皆會隨機抽選題目並洗牌選項，達 80 分即可解鎖「高餐旅館知識王」徽章！", "Questions and options shuffle every round—score 80+ to unlock the Quiz Champion badge!")
          }</small>
        </div>
        <button type="button" class="qp-go" data-qp-quiz-start>${tr("再挑戰一輪 🔄", "Play Another Round 🔄")}</button>
      </div>
    </div>`;
  }
  const cur = quizSession.questions[quizSession.idx];
  return `<div class="qp-quiz-card">
    <div class="qp-quiz-top">
      <span><em class="qp-quiz-cat">${esc(cur.cat)}</em> · QUESTION ${quizSession.idx + 1} / ${totalQ}</span>
      <span>${quizSession.streak >= 2 ? `<b class="qp-combo-tag">🔥 Combo ×${quizSession.streak}</b> · ` : ""}${tr("答對：", "Correct: ")}${quizSession.score}</span>
    </div>
    <p class="qp-quiz-q">${esc(cur.q)}</p>
    <div class="qp-quiz-opts">
      ${cur.opts
        .map((opt, i) => {
          let cls = "";
          if (quizSession.answered) {
            if (i === cur.ans) cls = " ok";
            else if (i === quizSession.picked) cls = " bad";
          }
          return `<button type="button" class="qp-quiz-opt${cls}" data-qp-quiz-opt="${i}" ${quizSession.answered ? "disabled" : ""}><b>${String.fromCharCode(65 + i)}.</b> ${esc(opt)}</button>`;
        })
        .join("")}
    </div>
    ${
      quizSession.answered
        ? `<div class="qp-quiz-exp">💡 <b>${tr("官網依據：", "Official Fact:")}</b> ${esc(cur.exp)}${/^https:\/\/[a-z0-9.-]*nkuht\.edu\.tw\//i.test(cur.src || "") ? ` <a href="${esc(cur.src)}" target="_blank" rel="noopener noreferrer">${tr("查看官網 ↗", "Source ↗")}</a>` : ""}</div>
           <div style="text-align:right;margin-top:8px"><button type="button" class="qp-go" data-qp-quiz-next>${quizSession.idx + 1 < totalQ ? tr("下一題 →", "Next →") : tr("查看總分 🏆", "Finish 🏆")}</button></div>`
        : ""
    }
  </div>`;
}

// ---------- 菁英實習護照 (第四期) ----------
// 24 partner hotels from official-data.js grouped by the official region column. A stamp needs two steps: open the
// hotel on the internship island (sport-hNN in S.items), then answer which region the official table lists it under.
let internQ = null; // { name, q }
function internHotels() {
  return (OFFICIAL.partners || []).map((p, k) => ({ ...p, bid: `sport-h${String(k + 2).padStart(2, "0")}` }));
}
function renderInternSection() {
  const hotels = internHotels();
  if (!hotels.length) return "";
  const regions = [...new Set(hotels.map((h) => h.region))];
  const regionEn = { 北部: "North", 中部: "Central", 南部: "South", 東部: "East" };
  const quiz = internQ
    ? `<div class="qp-quiz-card qp-intern-q">
        <p class="qp-quiz-q">${esc(internQ.q.q)}</p>
        <div class="qp-quiz-opts">${internQ.q.opts
          .map((o, i) => {
            const cls = internQ.picked == null ? "" : i === internQ.q.ans ? " ok" : i === internQ.picked ? " bad" : "";
            return `<button type="button" class="qp-quiz-opt${cls}" data-qp-intern-opt="${i}" ${internQ.picked == null ? "" : "disabled"}><b>${String.fromCharCode(65 + i)}.</b> ${esc(o)}</button>`;
          })
          .join("")}</div>
        ${internQ.picked == null ? "" : `<div class="qp-quiz-exp">💡 ${esc(internQ.q.exp)} <a href="${esc(OFFICIAL.partnersUrl)}" target="_blank" rel="noopener noreferrer">${tr("查看官網 ↗", "Source ↗")}</a></div><div style="text-align:right;margin-top:8px"><button type="button" class="qp-go" data-qp-intern-close>${tr("繼續", "Continue")}</button></div>`}
      </div>`
    : "";
  const groups = regions
    .map((g) => {
      const list = hotels.filter((h) => h.region === g);
      const got = list.filter((h) => S.intern.includes(h.name)).length;
      return `<div class="qp-intern-region"><h4>${esc(english ? regionEn[g] || g : g)} <small>${got}/${list.length}</small></h4><ul>${list
        .map((h) => {
          const stamped = S.intern.includes(h.name),
            visited = S.items.includes(h.bid);
          const act = stamped
            ? `<span class="qp-intern-done" aria-label="${tr("已蓋章", "Stamped")}">✓</span>`
            : visited
              ? `<button type="button" class="qp-go sm" data-qp-intern-ask="${esc(h.name)}">${tr("答題蓋章", "Stamp")} +${INTERN_STAMP_XP}</button>`
              : `<button type="button" class="qp-ghost sm" data-qp-bldg-go="${esc(h.bid)}">${tr("前往", "Visit")}</button>`;
          return `<li class="${stamped ? "got" : ""}"><span>${esc(h.name)}</span>${act}</li>`;
        })
        .join("")}</ul></div>`;
    })
    .join("");
  const n = S.intern.length;
  return `<h3>${tr("菁英實習護照", "ELITE INTERNSHIP PASSPORT")} <small>${tr(`${n}/${hotels.length} 枚・在實習島打開旅館，再答出它在官網列於哪一區即可蓋章`, `${n}/${hotels.length} · open a hotel on the internship island, then name its region in the official table`)}</small></h3>
    ${quiz}<div class="qp-intern">${groups}</div>`;
}
function onInternClick(e) {
  const go = e.target.closest("[data-qp-bldg-go]");
  if (go) {
    closePassport();
    ctx.api.selectBuilding?.(go.dataset.qpBldgGo);
    return true;
  }
  const ask = e.target.closest("[data-qp-intern-ask]");
  if (ask) {
    const q = regionQuestion(OFFICIAL, ask.dataset.qpInternAsk, { seed: (Math.random() * 2 ** 31) | 0, english });
    if (q) internQ = { name: ask.dataset.qpInternAsk, q, picked: null };
    sfx.bell();
    renderPassport();
    overlay.querySelector(".qp-intern-q")?.scrollIntoView({ block: "center", behavior: reducedMotion.matches ? "auto" : "smooth" });
    return true;
  }
  const opt = e.target.closest("[data-qp-intern-opt]");
  if (opt && internQ && internQ.picked == null) {
    internQ.picked = Number(opt.dataset.qpInternOpt);
    if (internQ.picked === internQ.q.ans && !S.intern.includes(internQ.name)) {
      const before = stars();
      S.intern.push(internQ.name);
      S.xp += INTERN_STAMP_XP;
      dailyExtra("intern");
      save(S);
      stampFx();
      toast(`<b>+${INTERN_STAMP_XP} XP</b> ${esc(tr(`實習護照蓋章：${internQ.name}`, `Internship stamp: ${internQ.name}`))}`, "xp");
      checkChaptersAndBadges(before, []);
      syncButton();
      syncQuestHud();
    } else if (internQ.picked !== internQ.q.ans) sfx.bell();
    renderPassport();
    return true;
  }
  if (e.target.closest("[data-qp-intern-close]")) {
    internQ = null;
    renderPassport();
    return true;
  }
  return false;
}

// 系上活動與實習公告布告欄：只列官網「系上活動」與「實習公告」頁的標題與連結（scripts/sync.py 自動更新），不給 XP
function renderBulletin() {
  const acts = OFFICIAL.activities || [],
    notes = OFFICIAL.internshipNotices?.items || [];
  if (!acts.length && !notes.length) return "";
  const safe = (u) => (/^https:\/\/[a-z0-9.-]*nkuht\.edu\.tw\//i.test(u || "") ? u : null);
  const actHtml = acts
    .map((a) => (safe(a.url) ? `<li><a href="${esc(a.url)}" target="_blank" rel="noopener noreferrer">${esc(a.title)} ↗</a></li>` : `<li>${esc(a.title)}</li>`))
    .join("");
  const noteHtml = notes
    .slice(0, 6)
    .map((n) => `<li>${esc(String(n).replace(/👉.*$/u, "").trim())}</li>`)
    .join("");
  return `<h3>${tr("系上活動與實習公告", "DEPARTMENT NOTICE BOARD")} <small>${tr("取自旅館系官網，隨官網更新", "from the department site, updated with it")}</small></h3>
    <div class="qp-board">
      ${actHtml ? `<div><h4>${tr("系上活動", "Activities")}</h4><ul>${actHtml}</ul></div>` : ""}
      ${noteHtml ? `<div><h4>${tr("實習公告（最新 6 則）", "Internship notices (latest 6)")}</h4><ul>${noteHtml}</ul>${safe(OFFICIAL.internshipNotices?.url) ? `<a class="qp-board-more" href="${esc(OFFICIAL.internshipNotices.url)}" target="_blank" rel="noopener noreferrer">${tr("看全部公告 ↗", "All notices ↗")}</a>` : ""}</div>` : ""}
    </div>`;
}

// one-time XP for other modules (concierge simulator, clock tower …): the key makes it idempotent
function grantXp(key, xp, label) {
  const k = String(key || "").slice(0, 64),
    n = Math.max(0, Math.min(100, Math.round(Number(xp) || 0)));
  if (!k || !n || S.awards[k]) return false;
  const before = stars();
  S.awards[k] = 1;
  S.xp += n;
  save(S);
  toast(`<b>+${n} XP</b> ${esc(label || "")}`, "xp");
  checkChaptersAndBadges(before, []);
  syncButton();
  syncQuestHud();
  window.dispatchEvent(new CustomEvent("htl:xp", { detail: { xp: n, label, total: S.xp } }));
  return true;
}

function renderPassport() {
  const n = stars();
  const lo = STARS[n - 1],
    hi = STARS[n] ?? null;
  const pct = hi ? Math.round(((S.xp - lo) / (hi - lo)) * 100) : 100;
  const target = ctx.islands.get(S.daily.target);
  const pillarsHTML = ONE_PLUS_THREE_PILLARS.map((p) => {
    const done = S.islands.includes(p.island);
    return `<button type="button" class="qp-pillar${done ? " got" : ""}" data-qp-island="${esc(p.island)}" title="${esc(tr(p.subZh, p.subEn))}">
      <span class="qp-pillar-code">${esc(p.code)}</span>
      <span class="qp-pillar-ico">${p.ico}</span>
      <span class="qp-pillar-body">
        <b>${esc(tr(p.zh, p.en))} ${done ? "✅" : "↗"}</b>
        <small>${esc(tr(p.subZh, p.subEn))}</small>
      </span>
    </button>`;
  }).join("");
  const stamps = [...ctx.islands.values()]
    .sort((a, b) => a.number - b.number)
    .map((i, k) => {
      const got = S.islands.includes(i.id);
      const seen = i.buildings.filter((b) => S.items.includes(b.id)).length;
      const rot = ((hash(i.id) % 17) - 8) * 1.2;
      return `<button type="button" class="qp-stamp${got ? " got" : ""}${seen === i.buildings.length ? " full" : ""}" data-qp-island="${esc(i.id)}" style="--rot:${got ? rot : 0}deg;--d:${k * 18}ms" title="${esc(txt(i.name))}">
        <span class="qp-stamp-ring"><span class="qp-stamp-ico">${window.__htl?.icon ? window.__htl.icon(i.id) : ""}</span></span>
        <span class="qp-stamp-no">${String(i.number).padStart(2, "0")}</span>
        <span class="qp-stamp-nm">${esc(txt(i.name))}</span>
        <span class="qp-stamp-pr">${seen}/${i.buildings.length}</span>
      </button>`;
    })
    .join("");
  const badges = badgeList()
    .map((b) => {
      const got = !!S.badges[b.id];
      const prog = !got && b.p ? `<span class="qp-badge-p"><i style="width:${Math.min(100, Math.round((b.p[0] / b.p[1]) * 100))}%"></i></span>` : "";
      return `<li class="qp-badge${got ? " got" : ""}" title="${esc(tr(b.dzh, b.den))}"><span class="qp-badge-ico">${b.ico}</span><b>${esc(tr(b.zh, b.en))}</b><small>${esc(tr(b.dzh, b.den))}</small>${prog}</li>`;
    })
    .join("");
  const nBadges = Object.keys(S.badges).length;
  overlay.innerHTML = `<div class="qp-box" role="dialog" aria-modal="true" aria-labelledby="qp-title">
    <div class="qp-top-actions">
      <button type="button" class="qp-bell-btn" data-qp-top title="${tr("跟師長領航員切磋陀螺小遊戲（贏得勝利可解鎖「🌀 陀螺高手」徽章）", "Play Spinning-Top Duel with Faculty Navigator")}">🌀 ${tr("陀螺對決", "Spin Top")}</button>
      <button type="button" class="qp-bell-btn" data-qp-bell title="${tr("按響群賢會館櫃檯服務鈴", "Ring Front Desk Service Bell")}">🛎️ ${tr("服務鈴", "Bell")}</button>
      <button type="button" class="qp-bell-btn" data-qp-sound title="${tr("切換音效", "Toggle Sound")}">${sfx.enabled ? "🔊" : "🔇"}</button>
      <button type="button" class="qp-close" data-qp-close aria-label="${tr("關閉", "Close")}">×</button>
    </div>
    <header class="qp-head">
      <div class="qp-cover"><span>NKUHT</span><b>HOTEL</b><small>PASSPORT</small></div>
      <div class="qp-who">
        <div class="eyebrow">ISLAND PASSPORT · 旅館島巡禮護照</div>
        <h2 id="qp-title">${tr("高餐大旅館管理系・學習護照", "NKUHT Hotel Island Passport")}</h2>
        <div class="qp-stars" aria-label="${n} ${tr("星", "stars")}">${"★".repeat(n)}<span>${"★".repeat(5 - n)}</span> <em><b class="qp-lv">Lv ${levelOf(S.xp)}</b>/${LEVEL_MAX} ${esc(tr(...STAR_TITLE[n - 1]))}</em></div>
        <div class="qp-xp"><i style="width:${pct}%"></i></div>
        <small class="qp-xp-l">${S.xp} XP${hi ? tr(`・距離下一顆星還差 ${hi - S.xp} XP`, ` · ${hi - S.xp} XP to next star`) : tr("・已達最高五星領航員星等", " · max 5-star rating")}</small>
      </div>
    </header>
    <section class="qp-daily${S.daily.done ? " done" : ""}">
      <span class="qp-daily-ico">${S.daily.done ? "✅" : "🎯"}</span>
      <div><small>${tr("每日任務", "DAILY QUEST")} · ${esc(S.daily.day)}${S.daily.streak ? tr(`・連續 ${S.daily.streak} 天 🔥`, ` · ${S.daily.streak}-day streak 🔥`) : ""}</small>
      <b>${S.daily.done ? tr("今日任務完成！明天再來看看新的目的地。", "Done for today! Come back tomorrow for a new one.") : tr(`前往「${esc(txt(target?.name))}」並打開它`, `Visit “${esc(txt(target?.name))}”`)}</b></div>
      ${S.daily.done ? "" : `<button type="button" class="qp-go" data-qp-island="${esc(S.daily.target)}">${tr("出發", "Go")} +${XP.daily} XP →</button>`}
    </section>
    ${(() => {
      dailyExtra(null);
      const x = S.daily.extra;
      const row = (done, zh, en) => `<li class="${done ? "done" : ""}"><span aria-hidden="true">${done ? "✓" : "○"}</span>${esc(tr(zh, en))}<b>+${DAILY_EXTRA_XP} XP</b></li>`;
      return `<ul class="qp-daily-extra">${row(x.quiz, "完成一輪旅館知識挑戰", "Finish one quiz round")}${row(x.intern, "在菁英實習護照蓋一枚章", "Earn one internship stamp")}</ul>`;
    })()}
    <div class="qp-stats">
      <span><b>${S.islands.length}</b>/${ctx.islands.size}<small>${tr("島嶼印章", "stamps")}</small></span>
      <span><b>${S.items.length}</b>/${ctx.buildings.size}<small>${tr("細項", "items")}</small></span>
      <span><b>${S.teachers.length}</b>/${ctx.teachers.size || 10}<small>${tr("師長", "teachers")}</small></span>
      <span><b>${FLOW_THEMES.filter((th) => S.awards?.[`route:${th.id}`]).length}</b>/${FLOW_THEMES.length}<small>${tr("路線章", "route stamps")}</small></span>
    </div>
    <h3>${tr("四年三明治職涯養成主線任務", "4-YEAR SANDWICH CAREER STORYLINE")} <small>${tr("依序完成大一至大四養成目標，領取章節獎勵 XP", "complete Freshman to Senior milestones for bonus XP")}</small></h3>
    ${renderChaptersSection()}
    <h3>${tr("1+3 畢業門檻養成進度", "1+3 GRADUATION PILLARS")} <small>${tr("1 張畢業證書 + 3 張相關證照（點擊前往對應主題島）", "1 Diploma + 3 Certificates (click to visit island)")}</small></h3>
    <div class="qp-pillars">${pillarsHTML}</div>
    <h3>${tr("旅館知識王 ＆ 群賢禮賓情境挑戰", "HOSPITALITY & CONCIERGE SCENARIO QUIZ")} <small>${tr("每輪 8 題：6 題由官網資料即時出題（師資、合作旅館、課程學分、規章），2 題情境題・連對享 Combo 加成", "8 per round: 6 generated live from the official data (faculty, partner hotels, credits, regulations) + 2 scenarios · combo bonus")}</small></h3>
    ${renderQuizSection()}
    ${renderInternSection()}
    ${renderBulletin()}
    <h3>${tr("榮譽領航結業證書", "HONORARY NAVIGATOR CERTIFICATE")} <small>${tr("達成四星、完成主線或知識王 80 分即可署名領取", "unlock at 4-Star, Story Clear, or Quiz 80+")}</small></h3>
    ${renderCertificateSection()}
    <h3>${tr(`${ctx.islands.size} 座主題島嶼印章`, `${ctx.islands.size} ISLAND STAMPS`)} <small>${tr("點印章直接飛過去（操控 3D 角色走近也會自動蓋章）", "tap a stamp to fly there, or walk nearby in 3D")}</small></h3>
    <div class="qp-stamps">${stamps}</div>
    <h3>${tr("成就徽章", "ACHIEVEMENTS")} <small>${nBadges}/${badgeList().length}</small></h3>
    <ul class="qp-badges">${badges}</ul>
    <footer class="qp-foot"><small>${tr("進度只存在這台裝置的瀏覽器中，不會上傳。", "Progress is stored only in this browser.")}</small><button type="button" data-qp-reset>${tr("重設進度", "Reset")}</button></footer>
  </div>`;
}

// ---------- feedback ----------
let toastBox = null;
function toast(html, kind) {
  if (!toastBox) {
    toastBox = document.createElement("div");
    toastBox.className = "qp-toasts";
    toastBox.setAttribute("aria-live", "polite");
    document.body.appendChild(toastBox);
  }
  const el = document.createElement("div");
  el.className = `qp-toast ${kind}`;
  el.innerHTML = html;
  toastBox.appendChild(el);
  while (toastBox.children.length > 4) toastBox.firstChild.remove();
  setTimeout(() => el.classList.add("out"), kind === "xp" ? 2200 : 3800);
  setTimeout(() => el.remove(), kind === "xp" ? 2700 : 4300);
}
function stampFx() {
  sfx.stamp();
  if (!btn || reducedMotion.matches) return;
  btn.classList.remove("stamped");
  void btn.offsetWidth;
  btn.classList.add("stamped");
}
let confettiP = null;
async function celebrate(power) {
  if (reducedMotion.matches) return;
  try {
    confettiP ||= import("./vendor/canvas-confetti/confetti.module.js?v=1.9.3").then((m) => m.default);
    const confetti = await confettiP;
    const colors = ["#f5d33a", "#e5a922", "#db6a41", "#fff6cf", "#3e7c8c"];
    confetti({ particleCount: Math.round(70 * power), spread: 70, startVelocity: 38, origin: { x: 0.5, y: 0.25 }, colors, zIndex: 60, disableForReducedMotion: true });
    if (power >= 1) {
      setTimeout(() => confetti({ particleCount: 50, angle: 60, spread: 60, origin: { x: 0, y: 0.6 }, colors, zIndex: 60 }), 180);
      setTimeout(() => confetti({ particleCount: 50, angle: 120, spread: 60, origin: { x: 1, y: 0.6 }, colors, zIndex: 60 }), 320);
    }
  } catch {}
}

window.__htlPassport = {
  open: openPassport,
  grantXp,
  level: () => levelOf(S.xp),
  state: () => S,
  sfx,
  ringBell: () => sfx.bell(),
  hop: hopToNextUnexplored,
  getTargetPos,
  getActiveChapterInfo,
  executeQuestTarget,
  syncQuestHud,
  checkProximityNow,
  visitIsland: (id, openCard = false) => {
    if (!ctx || !ctx.islands.has(id)) return;
    onTrack({ name: "htl_select", params: { item_type: "island", item_id: id } });
  },
  getPlayerStatus: () => {
    const n = stars();
    const lo = STARS[n - 1],
      hi = STARS[n] ?? null;
    const pct = hi ? Math.min(100, Math.round(((S.xp - lo) / (hi - lo)) * 100)) : 100;
    return { stars: n, xp: S.xp, pct, title: tr(...STAR_TITLE[n - 1]), stamps: S.islands.length, totalIslands: ctx?.islands?.size || 20 };
  },
  // 依固定表回傳星等稱號；廣場上其他玩家只傳 1–5 的整數，稱號文字一律在觀看者端查表，無法自訂
  starTitle: (n) => {
    const k = Math.min(5, Math.max(1, Math.round(Number(n) || 1)));
    return tr(...STAR_TITLE[k - 1]);
  },
};

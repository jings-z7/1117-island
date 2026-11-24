// Chibi pedestrians. Flow walkers take their role from flows[].walker and their badge from flows[].carry.
// Ambient figures are decorative, belong to no flow, and open no policy card.
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { mulberry } from "./environment.js?v=20261115-02";
import { OFFICIAL } from "./official-data.js?v=20261115-01";

export const ROLE_LABEL = {
  "civil-servant": ["系務與行政師長", "Dept. Faculty & Staff"],
  researcher: ["智慧餐旅與PMS學員", "Smart Hospitality & PMS Trainee"],
  elder: ["星級飯店業師", "5-Star Hotel Mentor"],
  child: ["旅館系大一新生", "HTL Freshman"],
  parent: ["群賢會館實習幹部", "Qunxian Intern Leader"],
  cyclist: ["企業參訪學生", "Hotel Visit Student"],
  farmer: ["餐飲與宴會實習生", "F&B & Banquet Intern"],
  citizen: ["旅館系學生與訪客", "HTL Student & Visitor"],
  hiker: ["合作飯店門僮禮賓員", "Partner-Hotel Doorman & Concierge"],
  worker: ["客務與房務實習生", "Front Office & Housekeeping Intern"],
  officeworker: ["儲備幹部與系辦同仁", "Management Trainee & Dept. Staff"],
  traveller: ["海外實習、交換生與訪客", "Overseas Intern, Exchange Student & Visitor"],
  youth: ["旅館接待競賽選手", "Hotel Reception Competitor"],
  puma: ["謝文欽 系主任（領航師長）", "Chair Wen-Chin Hsieh"],
  "faculty-yang-jt": ["楊仁德 專任教授", "Prof. Jen-Te Yang"],
  "faculty-sha-c": ["沙荃 專任助理教授級專技人員", "Asst. Prof. Dr. Roger Sha"],
  "faculty-hsieh-jl": ["謝家黎 專任副教授", "Assoc. Prof. Amber Hsieh"],
  "faculty-huang-cy": ["黃啟揚 專任助理教授", "Asst. Prof. Chi-Yang Huang"],
  "faculty-yu-mf": ["游明鳳 專任助理教授", "Asst. Prof. Sally Yu"],
  "faculty-hsieh-cl": ["謝金龍 實習輔導組長", "Asst. Prof. Benson Hsieh"],
  "faculty-hsu-mj": ["許孟鈞 校務策略研究組長", "Dr. Jacques Hsu"],
  "faculty-chang-hc": ["張慧貞 專案助理教授", "Asst. Prof. Winnie Chang"],
  "faculty-lo-sk": ["盧小琴 專案助理教授", "Dr. Jamie Lo"],
};

export const FACULTY = [
  {
    id: "hsieh-wc",
    role: "puma",
    buildingId: "welfare-elder",
    name: { zh: "謝文欽", en: "Wen-Chin Hsieh" },
    shortTitle: { zh: "謝文欽 主任", en: "Chair Hsieh" },
    badge: "主",
    photo: "./assets/teachers/hsieh-wc.jpg",
    appearanceNote: {
      zh: "銀灰側分短髮、炭灰西裝外套搭配淡粉襯衫，親切微笑走訪全系 20 座主題島嶼",
      en: "Silver-grey side-parted hair, charcoal blazer over light pink dress shirt",
    },
    islands: ["civil", "welfare", "sport", "trails", "institute", "luxury", "innovation", "esg"],
    look: {
      skin: 0, hairStyle: "side", hair: 0x6e6a66,
      eyeStyle: "happy", browStyle: "soft", mouthStyle: "grin", blush: false,
      hat: "none", hatColor: 0x484b52, glasses: "none", glassColor: 0x221c1c,
      topStyle: "vest", shirt: 0xf4dce6, coat: 0x484b52,
      bottomStyle: "pants", pants: 0x283040, shoe: 0x25201e,
      bag: "none", bagColor: 0x3e7c8c, hand: "coffee", handColor: 0xf6efe3,
    },
  },
  {
    id: "yang-jt",
    role: "faculty-yang-jt",
    buildingId: "welfare-respite",
    name: { zh: "楊仁德", en: "Prof. Jen-Te Yang" },
    shortTitle: { zh: "楊仁德 教授", en: "Prof. Yang" },
    badge: "授",
    photo: "./assets/teachers/yang-jt.svg",
    appearanceNote: {
      zh: "學者風範深灰短髮、知性黑框眼鏡、深藍西裝配酒紅領帶與服務品質專書",
      en: "Scholarly dark-grey hair, glasses, classic navy suit with burgundy tie and strategy tome",
    },
    islands: ["institute", "family", "welfare", "renewal", "esg"],
    look: {
      skin: 0, hairStyle: "short", hair: 0x383434,
      eyeStyle: "calm", browStyle: "flat", mouthStyle: "smile", blush: false,
      hat: "none", hatColor: 0x263348, glasses: "round", glassColor: 0x26211f,
      topStyle: "vest", shirt: 0xffffff, coat: 0x263348,
      bottomStyle: "pants", pants: 0x1e2838, shoe: 0x221d1a,
      bag: "none", bagColor: 0x8c2d38, hand: "book", handColor: 0x8c2d38,
    },
  },
  {
    id: "sha-c",
    role: "faculty-sha-c",
    buildingId: "welfare-home",
    name: { zh: "沙荃", en: "Dr. Roger Sha" },
    shortTitle: { zh: "沙荃 老師", en: "Dr. Roger Sha" },
    badge: "沙",
    photo: "./assets/teachers/sha-c.jpg",
    appearanceNote: {
      zh: "俐落黑髮、深棕條紋西裝配白襯衫與深藍金點領帶",
      en: "Neat side-parted dark hair, dark brown pinstripe suit, white shirt, navy gold-dotted tie",
    },
    islands: ["card", "youth", "civil", "welfare", "esg"],
    look: {
      skin: 1, hairStyle: "side", hair: 0x222022,
      eyeStyle: "dot", browStyle: "raised", mouthStyle: "smile", blush: false,
      hat: "none", hatColor: 0x46352b, glasses: "none", glassColor: 0x221c1c,
      topStyle: "vest", shirt: 0xfbfbf7, coat: 0x46352b,
      bottomStyle: "pants", pants: 0x362820, shoe: 0x241b16,
      bag: "none", bagColor: 0x22334d, hand: "book", handColor: 0xe5a922,
    },
  },
  {
    id: "hsieh-jl",
    role: "faculty-hsieh-jl",
    buildingId: "welfare-hourly",
    name: { zh: "謝家黎", en: "Assoc. Prof. Jia-Li (Amber) Hsieh" },
    shortTitle: { zh: "謝家黎 副教授", en: "Assoc. Prof. Hsieh" },
    badge: "黎",
    photo: "./assets/teachers/hsieh-jl.jpg",
    appearanceNote: {
      zh: "浪漫栗棕長捲髮、經典紅黑毛呢套裝外套搭配珍珠項鍊，展現優雅國際禮儀風範",
      en: "Voluminous wavy chestnut-auburn long hair, red-and-black tweed jacket, pearl necklace",
    },
    islands: ["hakka", "forest", "family", "welfare", "luxury"],
    look: {
      skin: 0, hairStyle: "curly", hair: 0x4a251d,
      eyeStyle: "wink", browStyle: "soft", mouthStyle: "smile", blush: true,
      hat: "none", hatColor: 0xc82829, glasses: "none", glassColor: 0x221c1c,
      topStyle: "vest", shirt: 0xf7efe2, coat: 0xc82829,
      bottomStyle: "skirt", pants: 0x252329, shoe: 0x252329,
      bag: "cross", bagColor: 0x1f1d22, hand: "flower", handColor: 0xf2a1a1,
    },
  },
  {
    id: "huang-cy",
    role: "faculty-huang-cy",
    buildingId: "welfare-care",
    name: { zh: "黃啟揚", en: "Asst. Prof. Chi-Yang Huang" },
    shortTitle: { zh: "黃啟揚 老師", en: "Asst. Prof. Huang" },
    badge: "揚",
    photo: "./assets/teachers/huang-cy.jpg",
    appearanceNote: {
      zh: "斯文方框眼鏡、米橘格紋捲袖襯衫搭配卡其長褲与皮帶，手持數位行銷平板",
      en: "Rectangular glasses, warm cream-and-coral plaid shirt with rolled sleeves, khaki pants",
    },
    islands: ["lunch", "education", "ai", "welfare", "innovation"],
    look: {
      skin: 1, hairStyle: "short", hair: 0x3a3532,
      eyeStyle: "happy", browStyle: "soft", mouthStyle: "smile", blush: false,
      hat: "none", hatColor: 0xd97a54, glasses: "round", glassColor: 0x302b28,
      topStyle: "stripes", shirt: 0xf2e4d0, coat: 0xd97a54,
      bottomStyle: "pants", pants: 0x9c8e78, shoe: 0x5c3c24,
      bag: "none", bagColor: 0x5c3c24, hand: "phone", handColor: 0x303846,
    },
  },
  {
    id: "yu-mf",
    role: "faculty-yu-mf",
    buildingId: "welfare-shingles",
    name: { zh: "游明鳳", en: "Asst. Prof. Ming-Feng (Sally) Yu" },
    shortTitle: { zh: "游明鳳 老師", en: "Asst. Prof. Yu" },
    badge: "鳳",
    photo: "./assets/teachers/yu-mf.jpg",
    appearanceNote: {
      zh: "深棕長直髮、俐落深藍西裝外套內搭純白上衣、銀色項鍊與手錶，展現財務專業知性美",
      en: "Medium-long straight dark-brown hair, tailored dark-navy blazer over crisp white top, silver watch",
    },
    islands: ["education", "renewal", "forest", "welfare"],
    look: {
      skin: 0, hairStyle: "long", hair: 0x46291c,
      eyeStyle: "calm", browStyle: "soft", mouthStyle: "smile", blush: true,
      hat: "none", hatColor: 0x222836, glasses: "none", glassColor: 0x221c1c,
      topStyle: "vest", shirt: 0xfbfbf7, coat: 0x222836,
      bottomStyle: "pants", pants: 0x222836, shoe: 0x1e1d21,
      bag: "tote", bagColor: 0xe5a922, hand: "book", handColor: 0x3e7c8c,
    },
  },
  {
    id: "hsieh-cl",
    role: "faculty-hsieh-cl",
    buildingId: "welfare-counsel",
    name: { zh: "謝金龍", en: "Asst. Prof. Chin-Lung (Benson) Hsieh" },
    shortTitle: { zh: "謝金龍 組長", en: "Asst. Prof. Benson Hsieh" },
    badge: "龍",
    photo: "./assets/teachers/hsieh-cl.jpg",
    appearanceNote: {
      zh: "俐落側分油頭、細框眼鏡、深藍格紋西裝配紅藍條紋領帶與白色口袋巾",
      en: "Neat side-parted hair, thin glasses, navy check suit, red-and-navy striped tie, white pocket square",
    },
    islands: ["transport", "sport", "trails", "welfare", "luxury", "esg"],
    look: {
      skin: 1, hairStyle: "side", hair: 0x221d1a,
      eyeStyle: "dot", browStyle: "flat", mouthStyle: "smile", blush: false,
      hat: "none", hatColor: 0x2c384a, glasses: "round", glassColor: 0x2c2623,
      topStyle: "vest", shirt: 0xffffff, coat: 0x2c384a,
      bottomStyle: "pants", pants: 0x232d3c, shoe: 0x1f1a18,
      bag: "none", bagColor: 0xa63429, hand: "book", handColor: 0xdb6a41,
    },
  },
  {
    id: "hsu-mj",
    role: "faculty-hsu-mj",
    buildingId: "welfare-work",
    name: { zh: "許孟鈞", en: "Dr. Meng-Jun (Jacques) Hsu" },
    shortTitle: { zh: "許孟鈞 老師", en: "Dr. Jacques Hsu" },
    badge: "鈞",
    photo: "./assets/teachers/hsu-mj.jpg",
    appearanceNote: {
      zh: "蓬鬆側分黑髮、標誌性黑金圓框眼鏡、深藍西裝配藍色條紋領帶與藍花口袋巾",
      en: "Voluminous side-parted dark hair, round black-and-gold glasses, dark suit, blue striped tie & pocket square",
    },
    islands: ["ai", "water", "youth", "welfare", "innovation", "esg"],
    look: {
      skin: 0, hairStyle: "side", hair: 0x1a181b,
      eyeStyle: "happy", browStyle: "raised", mouthStyle: "grin", blush: false,
      hat: "none", hatColor: 0x282d38, glasses: "round", glassColor: 0x1e1b18,
      topStyle: "vest", shirt: 0xffffff, coat: 0x282d38,
      bottomStyle: "pants", pants: 0x1f242d, shoe: 0x1a181b,
      bag: "none", bagColor: 0x2b579a, hand: "phone", handColor: 0x3e7c8c,
    },
  },
  {
    id: "chang-hc",
    role: "faculty-chang-hc",
    buildingId: "welfare-vaccine",
    name: { zh: "張慧貞", en: "Asst. Prof. Hui-Chen (Winnie) Chang" },
    shortTitle: { zh: "張慧貞 老師", en: "Asst. Prof. Winnie Chang" },
    badge: "貞",
    photo: "./assets/teachers/chang-hc.jpg",
    appearanceNote: {
      zh: "氣質紅棕側分鮑伯短髮、黑色V領上衣搭配銀灰圖騰下著与翠綠玉鐲",
      en: "Stylish reddish-brown side-swept bob hair, black V-neck top, silver necklace, and green jade bangle",
    },
    islands: ["family", "welfare", "card", "renewal"],
    look: {
      skin: 0, hairStyle: "bob", hair: 0x54281c,
      eyeStyle: "happy", browStyle: "soft", mouthStyle: "smile", blush: true,
      hat: "none", hatColor: 0x1e1d21, glasses: "none", glassColor: 0x221c1c,
      topStyle: "plain", shirt: 0x1e1d21, coat: 0x46484e,
      bottomStyle: "skirt", pants: 0x46484e, shoe: 0x1e1d21,
      bag: "tote", bagColor: 0x8fd4b8, hand: "book", handColor: 0xe8c547,
    },
  },
  {
    id: "lo-sk",
    role: "faculty-lo-sk",
    buildingId: "welfare-child",
    name: { zh: "盧小琴", en: "Dr. Siu-Kam (Jamie) Lo" },
    shortTitle: { zh: "盧小琴 老師", en: "Dr. Jamie Lo" },
    badge: "琴",
    photo: "./assets/teachers/lo-sk.jpg",
    appearanceNote: {
      zh: "深棕及肩鮑伯髮型、純白蕾絲雕花上衣搭配金色愛心項鍊，展現國際酒店學者丰采",
      en: "Shoulder-length dark-brown bob hair, pure white lace blouse, golden heart pendant necklace",
    },
    islands: ["diplomacy", "lunch", "water", "welfare"],
    look: {
      skin: 0, hairStyle: "bob", hair: 0x3b2316,
      eyeStyle: "happy", browStyle: "soft", mouthStyle: "smile", blush: true,
      hat: "none", hatColor: 0xfaf8f5, glasses: "none", glassColor: 0x221c1c,
      topStyle: "collar", shirt: 0xfaf8f5, coat: 0xe8c547,
      bottomStyle: "pants", pants: 0x2a303c, shoe: 0xd9c2a6,
      bag: "cross", bagColor: 0xe8c547, hand: "camera", handColor: 0x3e7c8c,
    },
  },
];

// Official faculty data (title, extension, e-mail, specialties, courses, education, profile links) comes from
// official-data.js, which scripts/sync.py generates from the two official sites — never type these by hand here.
// Entries above only carry presentation (3D look, photo, which islands the guide walks).
const TITLE_EN = {
  "副教授兼系主任兼學務長": "Associate Professor, Department Chair & Dean of Student Affairs",
  "教授": "Professor",
  "助理教授級專技人員": "Assistant Professor (Specialist Track)",
  "副教授": "Associate Professor",
  "助理教授": "Assistant Professor",
  "助理教授兼實習輔導組長": "Assistant Professor & Head of Internship Guidance",
  "助理教授兼校務策略研究組長": "Assistant Professor & Head of Institutional Strategy Research",
  "專案助理教授": "Project Assistant Professor",
};
const TERM_EN = {
  旅館服務業管理: "Hotel service management", 旅館行銷管理: "Hotel marketing management", 賭場管理: "Casino management",
  知識經濟與管理: "Knowledge economy & management", 管理心理學: "Managerial psychology", 組織行為: "Organizational behavior",
  策略管理: "Strategic management", 服務業管理: "Service industry management", 旅館管理: "Hotel management",
  人力資源: "Human resources", 人力資源管理: "Human resource management", 客務實務: "Front office practice",
  國際禮儀: "International etiquette", 旅館資訊管理: "Hotel information management", 餐廳管理: "Restaurant management",
  旅館採購: "Hotel purchasing", 旅館財務管理: "Hotel financial management", 旅館客務管理: "Hotel front office management",
  雲端科技應用: "Cloud technology applications", 資訊管理: "Information management", 知識管理: "Knowledge management",
  電子商務: "E-commerce", 餐旅資訊系統: "Hospitality information systems", 數位行銷: "Digital marketing",
  旅館會計學: "Hotel accounting", 會議管理: "Meeting management", 客房管理: "Rooms management", 餐飲管理: "F&B management",
  旅館管家實務: "Hotel butler practice", 服務中心實務: "Concierge practice", 客房營收管理: "Rooms revenue management",
};
const en = (t) => TERM_EN[t] || t;
const VOICE_META = {
  "hsieh-wc": {
    gender: "male",
    voiceName: { zh: "台灣自然男聲（YunJhe Neural）", en: "Natural Male Voice (Andrew Neural)" },
    spoken: {
      zh: "大家好，我是國立高雄餐旅大學旅館管理系副教授兼系主任兼學務長，謝文欽。我的專長領域為旅館服務業管理、旅館行銷管理與賭場管理。歡迎來到高餐大旅館管理系 3D 學習與職涯導覽島，和我們一起探索四年三明治教學與星級旅館實務！",
      en: "Hello everyone! I am Wen-Chin Hsieh, Associate Professor, Department Chair, and Dean of Student Affairs in the Department of Hotel Management at NKUHT. My expertise covers hotel service management, hotel marketing management, and casino management. Welcome to our 3D Hotel Management Island!",
    },
  },
  "yang-jt": {
    gender: "male",
    voiceName: { zh: "台灣自然男聲（YunJhe Neural）", en: "Natural Male Voice (Christopher Neural)" },
    spoken: {
      zh: "同學好，我是旅館管理系專任教授，楊仁德。我的專長涵蓋知識經濟與管理、管理心理學、組織行為、策略管理與服務業管理；在系上授課領域包含客房管理、餐飲管理、旅館管家實務、服務中心實務與客房營收管理，陪伴大家奠定扎實的理論與實務基礎。",
      en: "Greetings! I am Professor Jen-Te Yang in the Department of Hotel Management. My expertise spans knowledge economy, managerial psychology, organizational behavior, strategic management, and service management, teaching rooms management, food and beverage management, and butler practice.",
    },
  },
  "sha-c": {
    gender: "male",
    voiceName: { zh: "台灣自然男聲（YunJhe Neural）", en: "Natural Male Voice (Eric Neural)" },
    spoken: {
      zh: "大家好，我是旅館管理系助理教授級專技人員，沙荃。我的專長為旅館管理、人力資源與組織行為，並長期投入旅館客房服務與全國技能競賽旅館接待選手指導，歡迎同學一起挑戰自我、精進旅宿專業！",
      en: "Hello! I am Dr. Roger Sha, Assistant Professor (Specialist Track) in the Department of Hotel Management. My specialties include hotel management, human resources, and organizational behavior, as well as coaching national skills competition champions in hotel reception.",
    },
  },
  "hsieh-jl": {
    gender: "female",
    voiceName: { zh: "台灣自然女聲（HsiaoChen Neural）", en: "Natural Female Voice (Ava Neural)" },
    spoken: {
      zh: "大家好，我是旅館管理系專任副教授，謝家黎。我的專長領域為人力資源管理、客務實務與國際禮儀。在旅館島上，我將帶領大家認識國際商務禮儀、外語跨文化溝通與星級客務接待的核心素養。",
      en: "Hello everyone! I am Associate Professor Amber Hsieh in the Department of Hotel Management. I specialize in human resource management, front office practice, and international etiquette, guiding students in refined hospitality service.",
    },
  },
  "huang-cy": {
    gender: "male",
    voiceName: { zh: "台灣自然男聲（YunJhe Neural）", en: "Natural Male Voice (Brian Neural)" },
    spoken: {
      zh: "嗨，大家好！我是旅館管理系專任助理教授，黃啟揚。我的專長是旅館資訊管理、旅館行銷管理與餐廳管理。歡迎跟著我一起探索餐飲服務、旅館數位行銷與智慧旅宿系統的實務應用！",
      en: "Hi everyone! I am Assistant Professor Chi-Yang Huang in the Department of Hotel Management. My expertise covers hotel information management, hotel marketing management, and restaurant management.",
    },
  },
  "yu-mf": {
    gender: "female",
    voiceName: { zh: "台灣自然女聲（HsiaoYu Neural）", en: "Natural Female Voice (Aria Neural)" },
    spoken: {
      zh: "各位同學好，我是旅館管理系專任助理教授，游明鳳。我的專長領域為旅館採購與旅館財務管理，帶領同學從財務報表、採購與成本控制的角度，培養現代星級飯店不可或缺的經營管理決策力。",
      en: "Hello students! I am Assistant Professor Sally Yu in the Department of Hotel Management. I specialize in hotel purchasing and hotel financial management, helping students build strong analytical skills for hotel operations.",
    },
  },
  "hsieh-cl": {
    gender: "male",
    voiceName: { zh: "台灣自然男聲（YunJhe Neural）", en: "Natural Male Voice (Steffan Neural)" },
    spoken: {
      zh: "大家好，我是旅館管理系助理教授兼實習輔導組長，謝金龍。我的專長是旅館客務管理與旅館行銷管理。大三一整年的校外實習與菁英實習計畫 3.0 的 24 家星級合作酒店，都會由我們陪伴同學順利銜接產業！",
      en: "Hello! I am Assistant Professor Benson Hsieh, Head of Internship Guidance in the Department of Hotel Management. My specialties are hotel front office management and hotel marketing, supporting students across our 24 Elite Internship 3.0 partner hotels.",
    },
  },
  "hsu-mj": {
    gender: "male",
    voiceName: { zh: "台灣自然男聲（YunJhe Neural）", en: "Natural Male Voice (Roger Neural)" },
    spoken: {
      zh: "大家好，我是旅館管理系助理教授兼校務策略研究組長，許孟鈞。我的專長涵蓋雲端科技應用、資訊管理、知識管理、電子商務、餐旅資訊系統與數位行銷。歡迎大家在 3D 旅館島中體驗智慧旅宿科技與 OPERA、德安資訊系統的整合應用！",
      en: "Hello everyone! I am Dr. Jacques Hsu, Assistant Professor and Head of Institutional Strategy Research. My expertise spans cloud technology, information management, e-commerce, hospitality information systems, and digital marketing.",
    },
  },
  "chang-hc": {
    gender: "female",
    voiceName: { zh: "台灣自然女聲（HsiaoChen Neural）", en: "Natural Female Voice (Jenny Neural)" },
    spoken: {
      zh: "同學好，我是旅館管理系專案助理教授，張慧貞。我的專長包括旅館會計學、旅館財務管理、會議管理與客務實務。從校內群賢會館實習旅館到專業證照養成，都很高興能陪伴大家一路成長！",
      en: "Hello! I am Project Assistant Professor Winnie Chang in the Department of Hotel Management. My expertise includes hotel accounting, financial management, meeting management, and front office practice.",
    },
  },
  "lo-sk": {
    gender: "female",
    voiceName: { zh: "台灣自然女聲（HsiaoYu Neural）", en: "Natural Female Voice (Emma Neural)" },
    spoken: {
      zh: "大家好，我是旅館管理系專案助理教授，盧小琴。我的研究與教學專長涵蓋餐飲管理、消費者行為、觀光發展、餐旅教育與餐旅產業管理，歡迎同學一起探索國際交流與全球餐旅產業的多元視野！",
      en: "Hello everyone! I am Dr. Jamie Lo, Project Assistant Professor in the Department of Hotel Management. My expertise covers food and beverage management, consumer behavior, tourism development, hospitality education, and hospitality industry management.",
    },
  },
};
const OFFICIAL_BY_NAME = new Map(OFFICIAL.faculty.map((o) => [o.name, o]));
for (const t of FACULTY) {
  const o = OFFICIAL_BY_NAME.get(t.name.zh);
  if (!o) {
    console.warn(`[people] ${t.name.zh} is not on the official faculty page`);
    continue;
  }
  const specs = o.specialties || [];
  const courses = o.courses || [];
  t.official = o;
  const vm = VOICE_META[t.id] || { gender: "male", voiceName: { zh: "自然人聲", en: "Natural Voice" } };
  t.gender = vm.gender;
  t.voiceName = vm.voiceName;
  t.audio = {
    zh: `./assets/voices/${t.id}-zh.mp3?v=20261110-16`,
    en: `./assets/voices/${t.id}-en.mp3?v=20261110-16`,
  };
  t.spokenIntro = vm.spoken;
  t.unit = { zh: "旅館管理系", en: "Department of Hotel Management" };
  t.title = { zh: `旅館管理系・${o.title}`, en: `Department of Hotel Management · ${TITLE_EN[o.title] || o.title}` };
  t.ext = o.extDisplay || (o.ext || []).join("、"); // 系網為主；本人確認的更正見 data/corrections.json
  t.extNote = o.extNote || null;
  t.email = o.email;
  t.url = o.profileUrl;
  t.specialties = { zh: specs, en: specs.map(en) };
  t.courses = { zh: courses, en: courses.map(en) };
  // What the guide says: only the official record (teaching unit + job title + expertise/courses), in the first person.
  t.intro = {
    zh: vm.spoken?.zh || `我是旅館管理系${o.name}（職稱：${o.title}）。專長：${specs.join("、")}。${courses.length ? `授課領域：${courses.join("、")}。` : ""}`,
    en: vm.spoken?.en || `I am ${t.name.en}, ${TITLE_EN[o.title] || o.title} in the Department of Hotel Management. Expertise: ${specs.map(en).join(", ")}.`,
  };
  t.islandGuides = {}; // the 3D guide reads each island's own (official) summary instead
  t.quotes = [
    [`教學單位：旅館管理系｜職稱：${o.title}`, `${o.name}・旅館管理系`],
    [`專長：${specs.join("、")}`, `${o.name}・餐旅學院師資頁`],
    ...(courses.length ? [[`授課領域：${courses.join("、")}`, `${o.name}・餐旅學院師資頁`]] : []),
  ];
  t.quotesEn = [
    [`Unit: Dept. of Hotel Management | Title: ${TITLE_EN[o.title] || o.title}`, `${t.name.en} · Dept. of Hotel Management`],
    [`Expertise: ${specs.map(en).join(", ")}`, `${t.name.en} · College of Hospitality`],
    ...(courses.length ? [[`Courses: ${courses.map(en).join(", ")}`, `${t.name.en} · College of Hospitality`]] : []),
  ];
}
export const FACULTY_BY_ID = new Map(FACULTY.map((t) => [t.id, t]));
if (typeof window !== "undefined") {
  window.HTL_FACULTY = FACULTY;
  window.HTL_FACULTY_BY_ID = FACULTY_BY_ID;
}

export const CARRY_LABEL = {
  bed: ["房務標準", "Room standard"],
  crosswalk: ["實習動線", "Intern route"],
  energy: ["服務熱忱", "Service passion"],
  clock: ["三明治時程", "Sandwich schedule"],
  blueprint: ["課程藍圖", "Curriculum plan"],
  folder: ["教學檔案", "Course dossier"],
  globe: ["國際視野", "Global vision"],
  schoolbag: ["專業學分", "Course credits"],
  towel: ["星級備品", "Hotel amenities"],
  dumbbell: ["實務歷練", "Field training"],
  cards: ["1+3 證照", "1+3 Certificates"],
  "book-heart": ["款待初心", "Hospitality heart"],
  counseling: ["導師輔導", "Mentorship"],
  chip: ["PMS 系統", "PMS system"],
  sapling: ["綠色永續", "ESG green"],
  basket: ["餐服與侍酒", "F&B & Sommelier"],
  passport: ["海外實習", "Overseas intern"],
  droplet: ["美學素養", "Aesthetics"],
  toolbox: ["空間活化", "Renovation"],
  key: ["飯店房卡", "Room keycard"],
};

const SKIN = [0xf3cfae, 0xe6b48f, 0xcf9670, 0xf0c4a0];
const HAIR = [0x2e2522, 0x4a3426, 0x1f1d22, 0x6b4a33];
const CASUAL = [0x26324d, 0xfafbfd, 0xb9a27e, 0x9a9ea6, 0x2b2e35, 0xd9b04a]; // restrained campus palette (navy, white, khaki, grey, charcoal, NKUHT gold)

// 2026-11-14 人物精緻化（與 heart-me.js 的玩家角色一致）：五官貼著頭部弧面並轉向表面法線（側面看不再浮在臉外）、
// 眼睛反光點、眉毛、耳朵與腮紅。add 為各人物組裝函式的 (geo, offset, scale, color, channel, rotation)。
function addFace(add, THREE, skin, hair) {
  const HX = 0.095, HY = 0.089, HZ = 0.086, HC = 0.345;
  const face = (g, x, y, sc, col, lift = 0.0015, rz = 0) => {
    const u = x / HX, v = (y - HC) / HY;
    const z = HZ * Math.sqrt(Math.max(0.04, 1 - u * u - v * v));
    const nx = x / (HX * HX), ny = (y - HC) / (HY * HY), nz = z / (HZ * HZ);
    add(g, [x, y, z + lift], sc, col, "head", [-Math.atan2(ny, Math.hypot(nx, nz)), Math.atan2(nx, nz), rz]);
  };
  const skinShade = new THREE.Color(skin).multiplyScalar(0.86).getHex();
  for (const sx of [-1, 1]) {
    face("eye", 0.036 * sx, 0.348, [0.021, 0.027, 0.012], 0x221c1c);
    face("eye", 0.036 * sx + 0.006, 0.355, [0.008, 0.008, 0.004], 0xffffff, 0.0075);
    face("box", 0.038 * sx, 0.37, [0.026, 0.0065, 0.006], hair, 0.003, -0.12 * sx);
    face("eye", 0.056 * sx, 0.324, [0.024, 0.013, 0.008], 0xf2a1a1);
    add("eye", [0.093 * sx, 0.338, 0.002], [0.026, 0.042, 0.03], skin, "head");
    add("eye", [0.098 * sx, 0.338, 0.004], [0.012, 0.022, 0.014], skinShade, "head");
  }
}

export function createPeople(THREE, scene, opts) {
  const { graph, flowsData, paths, islandsMap, centers, top, reduced, quality, colors } = opts;
  const rnd = mulberry(41);
  const G = {
    // 2026-10-26: ~200 residents × ~25 parts are drawn every frame (never culled: they are everywhere), ~460K triangles.
    // Rounded boxes 2 → 1 bevel segment, head 16×12 → 14×10, hair cap 16×8 → 14×7: about 45% fewer triangles,
    // no visible difference at map scale.
    leg: new RoundedBoxGeometry(1, 1, 1, 1, 0.3),
    body: new THREE.CapsuleGeometry(0.5, 0.6, 4, 10),
    arm: new RoundedBoxGeometry(1, 1, 1, 1, 0.35),
    head: new THREE.SphereGeometry(0.5, 14, 10),
    cap: new THREE.SphereGeometry(0.5, 14, 7, 0, Math.PI * 2, 0, Math.PI * 0.55),
    eye: new THREE.SphereGeometry(0.5, 8, 6),
    box: new RoundedBoxGeometry(1, 1, 1, 1, 0.2),
    cyl: new THREE.CylinderGeometry(0.5, 0.5, 1, 10),
    cone: new THREE.ConeGeometry(0.5, 1, 14),
    torus: new THREE.TorusGeometry(0.5, 0.09, 6, 18),
    band: new THREE.CylinderGeometry(0.5, 0.5, 1, 32, 1, true), // smooth open band (the island keeper's visor)
    brim: new THREE.SphereGeometry(0.5, 24, 12),
    shadow: new THREE.CircleGeometry(0.5, 20),
  };
  G.shadow.rotateX(-Math.PI / 2);
  const mat = new THREE.MeshStandardMaterial({ roughness: 0.7 });
  const shadowMat = new THREE.MeshBasicMaterial({ color: 0x2a2018, transparent: true, opacity: 0.22, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -8 });
  // slots: one InstancedMesh per geometry; capacity grows per registration
  const slotDefs = {};
  const people = [];
  const NKUHT_HAIR = [0x1c1b20, 0x26201d, 0x35251c, 0x463022];
  // 2026-11-13 outfits by VENUE (department owner's brief): hotel-management students wear either the
  // front-office practicum uniform (navy / charcoal blazer, white shirt, gold tie or bow scarf, name badge)
  // or restrained campus casual (navy, white, khaki, grey, NKUHT gold accent); housekeeping tunics only
  // at the partner-hotel island; F&B service students wear waistcoat + bistro apron (never chef whites);
  // faculty & staff and hotel managers wear suits; partner-hotel doormen wear a greatcoat and peaked cap;
  // visitors / guests / travelling students wear smart casual. Labels are shown on the resident cards.
  const UNIFORM_LABELS = {
    "fo-navy": ["旅館系實習制服（藏青西裝・客務）", "HTL Practicum Uniform (Navy Front-Office Blazer)"],
    "fo-charcoal": ["旅館系實習制服（炭灰西裝・客務）", "HTL Practicum Uniform (Charcoal Front-Office Blazer)"],
    "fo-summer": ["旅館系夏季實習制服（白襯衫・領帶／領巾）", "HTL Summer Practicum Uniform (White Shirt & Tie / Scarf)"],
    "campus-casual": ["旅館系校園休閒服", "HTL Campus Casual"],
    "smart-casual": ["訪客與旅行學生商務休閒服", "Visitor / Travelling Student Smart Casual"],
    "practicum-fb": ["餐飲服務實習制服（背心・圍裙）", "F&B Service Practicum Uniform (Waistcoat & Apron)"],
    "practicum-rooms": ["客房房務實習制服", "Housekeeping Practicum Uniform"],
    "mentor-suit": ["飯店主管與業師西裝", "Hotel Manager / Industry Mentor Suit"],
    "staff-suit": ["系上師長與行政同仁西裝", "Faculty & Staff Suit"],
    doorman: ["合作飯店門僮禮賓制服", "Partner-Hotel Doorman Uniform"],
  };
  const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
  // role (+ venue island for ambient residents) → outfit
  function outfitFor(role, island) {
    switch (role) {
      case "civil-servant": // 系辦師長與行政同仁 (F1/F2/F12… start or end at 01 系務核心)
        return "staff-suit";
      case "elder": // 星級飯店業師 visiting faculty / curriculum islands
        return "mentor-suit";
      case "officeworker": // at 01 系務核心 they are department staff; elsewhere hotel management trainees / managers
        return island === "civil" ? "staff-suit" : "mentor-suit";
      case "farmer": // 餐飲與宴會實習生 (群賢會館 → 05 餐飲服務與酒類專業)
        return "practicum-fb";
      case "worker": // rooms intern: housekeeping only inside the partner hotels, front office elsewhere
        return island === "sport" ? "practicum-rooms" : pick(["fo-navy", "fo-charcoal"]);
      case "hiker": // partner-hotel doorman / bell staff greeting at 09 實習旅館專島
        return "doorman";
      case "parent": // 群賢會館實習幹部
        return pick(["fo-navy", "fo-navy", "fo-charcoal"]);
      case "youth": // 旅館接待競賽選手 / event hosts
      case "cyclist": // 企業參訪學生 (dressed for the hotel visit)
        return pick(["fo-navy", "fo-charcoal", "fo-summer"]);
      case "traveller": // overseas interns, exchange students and hotel guests with luggage
        return "smart-casual";
      case "citizen": // 旅館系學生; at 群賢會館 the resident is a hotel guest / visiting parent
        return island === "family" ? "smart-casual" : "campus-casual";
      default: // researcher, child (freshman) and anything else: classroom & campus
        return "campus-casual";
    }
  }
  function buildNkuhtNpcPlan(role, kind, opts2, skin) {
    const P = [];
    const add = (g, off, s, c, ch = null, r = null) => P.push({ g, off, s, c, ch, r });
    let sc = role === "child" ? 0.96 : 1;
    const hair = role === "elder" ? 0x343030 : NKUHT_HAIR[Math.floor(rnd() * NKUHT_HAIR.length)];
    const isFemale = opts2?.gender ? opts2.gender === "F" : rnd() < 0.54;
    const uStyle = outfitFor(role, opts2?.island);

    const NAVY = 0x1b2540;
    const NAVY_DARK = 0x121a2e;
    const CHARCOAL = 0x2b2e35;
    const CHARCOAL_DARK = 0x1c1e23;
    const WHITE = 0xfafbfd;
    const GOLD = 0xd9b04a; // NKUHT gold accent
    const GOLD_BADGE = 0xe6be53;
    const TIE_YELLOW = 0xf0c033;
    const BLACK_SHOE = 0x18171b;
    const BROWN_SHOE = 0x4a3324;
    const WHITE_SHOE = 0xf4f4f0;
    const isFO = uStyle === "fo-navy" || uStyle === "fo-charcoal" || uStyle === "fo-summer";
    const casualSub = uStyle === "campus-casual" ? Math.floor(rnd() * 4) : 0; // 0 navy dept tee · 1 grey hoodie · 2 white polo · 3 navy hoodie
    const smartSub = uStyle === "smart-casual" ? (isFemale ? pick([0, 1, 3]) : pick([0, 2, 3])) : 0; // 0 oxford shirt · 1 knit cardigan · 2 unstructured blazer · 3 knit sweater
    const staffSuit = uStyle === "staff-suit" ? pick([0x232c40, 0x2e3138, 0x50555e]) : 0;
    const wearSkirt = isFemale && (isFO || uStyle === "staff-suit" || (uStyle === "smart-casual" && smartSub === 1));
    const bottomCol = {
      "fo-navy": NAVY,
      "fo-charcoal": CHARCOAL,
      "fo-summer": NAVY,
      "campus-casual": [0xb9a27e, 0x26324d, 0x5d636c, 0x3c4e6e][casualSub],
      "smart-casual": [0x2b3140, 0x2b2d33, 0xa89272, 0x4a4d52][smartSub],
      "practicum-fb": 0x1c1c20,
      "practicum-rooms": 0x3a3f47,
      "mentor-suit": 0x2a2f38,
      "staff-suit": staffSuit,
      doorman: 0x1a2238,
    }[uStyle];
    const shoeCol = uStyle === "campus-casual" ? WHITE_SHOE : uStyle === "smart-casual" ? BROWN_SHOE : BLACK_SHOE;

    // 1. Legs & footwear (skirts show calves + court pumps; trousers cover the full leg)
    if (wearSkirt) {
      for (const [ch, x] of [["legL", -0.032], ["legR", 0.032]]) {
        add("leg", [x, 0.106, 0], [0.052, 0.052, 0.058], bottomCol, ch);
        add("leg", [x, 0.052, 0], [0.044, 0.084, 0.048], skin, ch);
        add("box", [x, 0.012, 0.012], [0.052, 0.023, 0.084], BLACK_SHOE, ch);
        add("box", [x, 0.022, 0.018], [0.034, 0.008, 0.036], skin, ch); // pump instep
      }
      add("box", [0, 0.132, 0], [0.138, 0.064, 0.114], bottomCol); // knee-length skirt
    } else {
      add("leg", [-0.032, 0.065, 0], [0.05, 0.13, 0.058], bottomCol, "legL");
      add("leg", [0.032, 0.065, 0], [0.05, 0.13, 0.058], bottomCol, "legR");
      add("box", [-0.032, 0.012, 0.012], [0.055, 0.025, 0.085], shoeCol, "legL");
      add("box", [0.032, 0.012, 0.012], [0.055, 0.025, 0.085], shoeCol, "legR");
      if (uStyle === "campus-casual") {
        for (const x of [-0.032, 0.032]) add("box", [x, 0.002, 0.012], [0.056, 0.005, 0.086], 0xd8d5ce, x < 0 ? "legL" : "legR"); // sneaker soles
      } else if (uStyle !== "doorman") {
        add("cyl", [0, 0.137, 0], [0.136, 0.014, 0.115], 0x1e1b1b); // leather belt
        add("box", [0, 0.137, 0.058], [0.019, 0.013, 0.005], 0xd4d7dc); // buckle
      }
    }

    // neckwear: men a tie (main colour, tip colour), women a bow scarf
    const addCollar = (c = WHITE) => {
      for (const sx of [-1, 1]) add("box", [sx * 0.018, 0.264, 0.052], [0.026, 0.013, 0.012], c, null, [0, 0, sx * -0.45]);
    };
    const addNeckwear = (mainCol, tipCol) => {
      addCollar();
      if (isFemale) {
        add("eye", [0, 0.253, 0.061], [0.02, 0.016, 0.01], mainCol);
        for (const sx of [-1, 1]) {
          add("box", [sx * 0.022, 0.236, 0.06], [0.018, 0.04, 0.006], mainCol, null, [0, 0, sx * -0.42]);
          add("box", [sx * 0.03, 0.219, 0.061], [0.017, 0.016, 0.006], tipCol, null, [0, 0, sx * -0.42]);
        }
      } else {
        add("eye", [0, 0.255, 0.06], [0.017, 0.015, 0.008], mainCol);
        add("box", [0, 0.214, 0.059], [0.017, 0.074, 0.006], mainCol);
        add("box", [0, 0.172, 0.06], [0.018, 0.016, 0.006], tipCol);
      }
    };
    const addNameBadge = (zOff = 0.06) => {
      add("box", [0.035, 0.226, zOff], [0.028, 0.011, 0.005], GOLD_BADGE);
      add("box", [0.035, 0.226, zOff + 0.002], [0.022, 0.004, 0.003], 0x3a2e14);
    };
    const addSleeves = (c) => {
      add("arm", [-0.077, 0.205, 0], [0.035, 0.1, 0.039], c, "armL");
      add("arm", [0.077, 0.205, 0], [0.035, 0.1, 0.039], c, "armR");
    };
    const addShortSleeves = (c) => {
      for (const [ch, x] of [["armL", -0.077], ["armR", 0.077]]) {
        add("arm", [x, 0.205, 0], [0.032, 0.1, 0.035], skin, ch);
        add("arm", [x, 0.233, 0], [0.039, 0.05, 0.042], c, ch);
      }
    };
    const addTorso = (c) => {
      add("body", [0, 0.2, 0], [0.135, 0.11, 0.114], c);
      add("box", [0, 0.203, 0.003], [0.134, 0.11, 0.106], c);
    };
    // tailored blazer: shirt V-zone, neckwear, notched lapels, pocket flaps, buttons
    const addBlazer = (suit, lapel, tie, tip, buttons = 0x2a2a2e) => {
      addTorso(suit);
      add("box", [0, 0.236, 0.056], [0.048, 0.056, 0.006], WHITE);
      if (tie) addNeckwear(tie, tip);
      else addCollar();
      for (const sx of [-1, 1]) {
        add("box", [sx * 0.026, 0.228, 0.059], [0.015, 0.068, 0.006], lapel, null, [0, 0, sx * -0.24]);
        add("box", [sx * 0.042, 0.168, 0.056], [0.028, 0.012, 0.005], lapel);
      }
      for (const by of [0.194, 0.172]) add("eye", [0, by, 0.061], [0.009, 0.009, 0.005], buttons);
      addSleeves(suit);
    };
    let handCol = skin;

    // 2. Torso & arms
    if (uStyle === "fo-navy" || uStyle === "fo-charcoal") {
      const navy = uStyle === "fo-navy";
      addBlazer(navy ? NAVY : CHARCOAL, navy ? NAVY_DARK : CHARCOAL_DARK, TIE_YELLOW, navy ? NAVY_DARK : 0x1b1a1f, GOLD);
      addNameBadge(0.061);
    } else if (uStyle === "fo-summer") {
      addTorso(WHITE);
      add("box", [0, 0.2, 0.055], [0.012, 0.1, 0.004], 0xeef1f6); // placket
      addNeckwear(TIE_YELLOW, NAVY_DARK);
      addNameBadge(0.058);
      addShortSleeves(WHITE);
    } else if (uStyle === "campus-casual") {
      const top = [NAVY, 0x9a9ea6, WHITE, 0x223050][casualSub];
      addTorso(top);
      if (casualSub === 1 || casualSub === 3) {
        // hoodie: hood on the back, drawstrings, NKUHT gold chest mark, long sleeves
        add("box", [0, 0.262, -0.06], [0.11, 0.05, 0.045], top, null, [0.3, 0, 0]);
        for (const sx of [-1, 1]) add("box", [sx * 0.014, 0.236, 0.058], [0.004, 0.03, 0.004], 0xf2efe8);
        add("box", [0, 0.212, 0.059], [0.05, 0.012, 0.004], GOLD);
        add("box", [0, 0.15, 0.056], [0.07, 0.03, 0.006], top); // kangaroo pocket
        addSleeves(top);
      } else if (casualSub === 2) {
        // white polo: navy-tipped collar + gold crest
        addCollar(WHITE);
        add("box", [0, 0.238, 0.056], [0.015, 0.044, 0.005], 0xd9dee6);
        add("box", [0, 0.264, 0.052], [0.05, 0.005, 0.012], NAVY);
        add("eye", [0.034, 0.232, 0.058], [0.014, 0.014, 0.005], GOLD);
        addShortSleeves(WHITE);
      } else {
        // navy department tee with a gold chest stripe
        add("box", [0, 0.264, 0.05], [0.05, 0.012, 0.012], 0x2f3a58);
        add("box", [0.03, 0.228, 0.058], [0.036, 0.008, 0.004], GOLD);
        addShortSleeves(top);
      }
    } else if (uStyle === "smart-casual") {
      if (smartSub === 0) {
        addTorso(0xc9d8ea); // light-blue oxford shirt
        addCollar(0xc9d8ea);
        add("box", [0, 0.2, 0.055], [0.01, 0.1, 0.004], 0xb6c7dc);
        addSleeves(0xc9d8ea);
      } else if (smartSub === 1) {
        addTorso(0xd9c9ae); // oatmeal knit cardigan over a white top
        add("box", [0, 0.226, 0.056], [0.044, 0.07, 0.006], WHITE);
        for (const by of [0.2, 0.176]) add("eye", [0, by, 0.06], [0.007, 0.007, 0.004], 0x8a7556);
        addSleeves(0xd9c9ae);
      } else if (smartSub === 2) {
        addTorso(0x857560); // unstructured stone blazer over a white tee
        add("box", [0, 0.232, 0.056], [0.046, 0.062, 0.006], WHITE);
        for (const sx of [-1, 1]) add("box", [sx * 0.026, 0.226, 0.059], [0.014, 0.064, 0.006], 0x6f604d, null, [0, 0, sx * -0.24]);
        addSleeves(0x857560);
      } else {
        addTorso(0x7f8a80); // sage-grey knit sweater with shirt collar
        addCollar(WHITE);
        addSleeves(0x7f8a80);
      }
    } else if (uStyle === "practicum-fb") {
      // F&B service: white shirt, black waistcoat, bow tie, long black bistro apron, gold badge (never chef whites)
      add("body", [0, 0.2, 0], [0.135, 0.11, 0.114], WHITE);
      add("box", [0, 0.204, 0.003], [0.132, 0.11, 0.105], 0x1f1f24);
      add("box", [0, 0.236, 0.056], [0.04, 0.054, 0.005], WHITE);
      addCollar();
      add("box", [0, 0.254, 0.06], [0.026, 0.012, 0.006], 0x141316); // bow tie
      for (const by of [0.214, 0.19, 0.166]) add("eye", [0, by, 0.058], [0.007, 0.007, 0.004], 0x8a8f99);
      add("box", [0, 0.1, 0.062], [0.13, 0.13, 0.008], 0x18181c); // bistro apron
      add("box", [0, 0.136, 0.064], [0.134, 0.01, 0.008], 0x2a2a30); // apron tie band
      addNameBadge(0.059);
      addSleeves(WHITE);
    } else if (uStyle === "practicum-rooms") {
      // housekeeping tunic in muted slate with white collar + half apron and gold badge
      const TUNIC = 0x66727e;
      addTorso(TUNIC);
      addCollar();
      add("box", [0, 0.2, 0.056], [0.01, 0.1, 0.004], 0x58636e);
      add("box", [0, 0.128, 0.06], [0.112, 0.07, 0.008], 0xe9ebee);
      addNameBadge(0.059);
      addSleeves(TUNIC);
    } else if (uStyle === "mentor-suit") {
      addBlazer(0x2c323d, 0x22272f, 0x8c2d38, 0x6e2129);
      add("box", [-0.04, 0.214, 0.061], [0.02, 0.008, 0.004], WHITE); // pocket square
      add("eye", [0.036, 0.232, 0.062], [0.013, 0.013, 0.005], GOLD_BADGE); // lapel pin
    } else if (uStyle === "staff-suit") {
      // faculty / department staff: navy, charcoal or grey suit; navy tie or bow scarf; ID lanyard
      const lapel = staffSuit === 0x50555e ? 0x42464e : 0x1a1d24;
      addBlazer(staffSuit, lapel, 0x2b3f6b, isFemale ? GOLD : 0x1d2a48);
      if (isFemale) {
        for (const sx of [-1, 1]) add("box", [sx * 0.02, 0.232, 0.062], [0.005, 0.05, 0.003], 0x2b579a, null, [0, 0, sx * 0.3]); // lanyard
        add("box", [0, 0.196, 0.064], [0.026, 0.034, 0.004], WHITE); // staff ID card
      } else addNameBadge(0.061);
    } else {
      // doorman: navy double-breasted greatcoat to the knee, gold buttons & epaulettes, peaked cap, white gloves
      const COAT = 0x1d2a44;
      addTorso(COAT);
      add("box", [0, 0.116, 0.002], [0.142, 0.088, 0.12], COAT); // coat skirt
      add("box", [0, 0.236, 0.056], [0.034, 0.05, 0.006], WHITE);
      add("box", [0, 0.252, 0.06], [0.02, 0.01, 0.006], 0x141316);
      for (const sx of [-1, 1]) for (const by of [0.214, 0.186, 0.158]) add("eye", [sx * 0.028, by, 0.06], [0.009, 0.009, 0.005], GOLD);
      addSleeves(COAT);
      for (const [ch, x] of [["armL", -0.077], ["armR", 0.077]]) add("box", [x, 0.252, 0], [0.042, 0.01, 0.044], GOLD, ch); // epaulettes
      add("cyl", [0, 0.448, 0.004], [0.2, 0.05, 0.2], COAT, "head"); // cap crown
      add("cyl", [0, 0.432, 0.004], [0.204, 0.014, 0.204], GOLD, "head"); // gold band
      add("box", [0, 0.424, 0.096], [0.12, 0.008, 0.05], 0x141316, "head"); // peak
      handCol = WHITE;
    }

    // Hands
    add("eye", [-0.077, 0.15, 0], [0.034, 0.034, 0.034], handCol, "armL");
    add("eye", [0.077, 0.15, 0], [0.034, 0.034, 0.034], handCol, "armR");

    // 3. Head & neat hospitality grooming (uniformed women mostly wear a bun)
    add("head", [0, 0.345, 0], [0.19, 0.178, 0.172], skin, "head");
    add("cap", [0, 0.352, -0.006], [0.206, 0.19, 0.204], hair, "head", [-0.32, 0, 0]);
    const formal = uStyle !== "campus-casual" && uStyle !== "smart-casual";
    const fStyles = formal ? ["bun", "bun", "pony", "bob"] : ["long", "pony", "bun", "bob"];
    const st = uStyle === "doorman" ? "short" : opts2?.hairStyle || (isFemale ? fStyles[Math.floor(rnd() * fStyles.length)] : "short");
    if (st === "short") {
      add("eye", [0.02, 0.425, 0.034], [0.13, 0.038, 0.078], hair, "head", [-0.18, 0, -0.16]);
    } else if (st === "long") {
      add("box", [0, 0.305, -0.07], [0.192, 0.14, 0.052], hair, "head", [0.12, 0, 0]);
      for (const sx of [-1, 1]) add("box", [sx * 0.086, 0.318, 0.02], [0.03, 0.11, 0.044], hair, "head");
    } else if (st === "bun") {
      add("eye", [0, 0.438, -0.072], [0.078, 0.072, 0.072], hair, "head");
      add("torus", [0, 0.428, -0.066], [0.068, 0.068, 0.068], NAVY_DARK, "head", [0.9, 0, 0]); // hairnet ribbon
    } else if (st === "pony") {
      add("eye", [0, 0.332, -0.114], [0.056, 0.104, 0.05], hair, "head", [0.35, 0, 0]);
    } else if (st === "bob") {
      for (const sx of [-1, 1]) add("eye", [sx * 0.09, 0.334, 0.014], [0.042, 0.098, 0.084], hair, "head");
    }
    addFace(add, THREE, skin, hair);

    // 4. Carried flow items
    const CARRY_PROP = {
      bed: ["box", [0.09, 0.05, 0.06], 0xffffff],
      crosswalk: ["box", [0.1, 0.015, 0.07], 0xf2efe8],
      energy: ["box", [0.05, 0.07, 0.04], 0xf1c232],
      clock: ["cyl", [0.07, 0.025, 0.07], 0xf1c232],
      folder: ["box", [0.08, 0.06, 0.015], 0x3e7c8c],
      globe: ["eye", [0.075, 0.075, 0.075], 0x5f9aa6],
      towel: ["box", [0.08, 0.03, 0.05], 0xfbfbf7],
      dumbbell: ["cyl", [0.025, 0.1, 0.025], 0x3b3a42],
      cards: ["box", [0.07, 0.045, 0.012], 0xe8c547],
      "book-heart": ["box", [0.07, 0.08, 0.02], colors.coral],
      counseling: ["eye", [0.06, 0.05, 0.03], 0xffffff],
      chip: ["box", [0.06, 0.012, 0.06], 0x2f5a46],
      droplet: ["eye", [0.055, 0.075, 0.055], 0x6fb3d4],
    };
    if (kind && CARRY_PROP[kind]) {
      const [g, s, c] = CARRY_PROP[kind];
      add(g, [0, 0.19, 0.085], s, c, "carry");
      if (kind === "dumbbell") for (const d of [-0.045, 0.045]) add("cyl", [d, 0.19, 0.085], [0.045, 0.02, 0.045], 0x3b3a42, "carry");
    }

    // 5. Role-specific hospitality props
    switch (role) {
      case "civil-servant":
        add("box", [0.1, 0.2, 0.02], [0.02, 0.08, 0.06], 0x3e7c8c, "armR");
        break;
      case "researcher":
        // 智慧餐旅與PMS學員：斯文眼鏡與平板資料夾
        add("box", [-0.1, 0.19, 0.02], [0.022, 0.085, 0.065], 0x3e7c8c, "armL");
        add("eye", [0, 0.352, 0.086], [0.09, 0.012, 0.008], 0x2e2522, "head");
        break;
      case "elder":
        add("box", [0.1, 0.19, 0.02], [0.022, 0.08, 0.065], 0x5a4332, "armR");
        break;
      case "child":
        add("box", [0, 0.2, -0.07], [0.096, 0.108, 0.048], pick([0x243454, 0x3b3a42, 0x8a7a5c])); // campus backpack
        break;
      case "parent":
        add("box", [-0.1, 0.19, 0.02], [0.02, 0.08, 0.06], 0xe5a922, "armL");
        add("box", [0.11, 0.08, 0.0], [0.05, 0.13, 0.1], 0x243454, "trolley");
        add("cyl", [0.11, 0.17, 0.0], [0.008, 0.06, 0.008], 0x2a2524, "trolley");
        break;
      case "cyclist":
        add("box", [0.1, 0.19, 0.02], [0.02, 0.075, 0.055], 0xe5a922, "armR");
        break;
      case "farmer":
        add("cyl", [0.11, 0.165, 0.03], [0.09, 0.008, 0.09], 0xd8dce2, "armR");
        add("cyl", [0.11, 0.195, 0.03], [0.026, 0.048, 0.026], 0x8b2635, "armR");
        break;
      case "hiker":
        // doorman wheeling a guest's suitcase
        add("box", [0.11, 0.08, 0.0], [0.05, 0.13, 0.1], 0x6b4a33, "trolley");
        add("cyl", [0.11, 0.17, 0.0], [0.008, 0.06, 0.008], 0x2a2524, "trolley");
        break;
      case "worker":
        if (uStyle === "practicum-rooms") add("box", [0.1, 0.18, 0.03], [0.05, 0.045, 0.065], 0xffffff, "armR"); // folded linen
        else add("box", [0.1, 0.19, 0.02], [0.02, 0.08, 0.06], 0x243454, "armR"); // front-office folder
        break;
      case "traveller":
        add("box", [0.11, 0.08, 0.0], [0.05, 0.13, 0.1], pick([0x8c2d38, 0x243454, 0xa89272]), "trolley");
        add("cyl", [0.11, 0.17, 0.0], [0.008, 0.06, 0.008], 0x2a2524, "trolley");
        break;
      case "officeworker":
        add("cyl", [0.1, 0.16, 0.03], [0.03, 0.05, 0.03], 0xf6efe3, "armR");
        break;
      case "youth":
        add("eye", [-0.034, 0.224, 0.063], [0.018, 0.018, 0.006], 0xf5d33a); // 競賽金牌徽章
        break;
      case "citizen":
        if (kind === "passport") {
          add("box", [0.11, 0.08, 0.0], [0.05, 0.13, 0.1], pick([0x8c2d38, 0x243454]), "trolley");
          add("cyl", [0.11, 0.17, 0.0], [0.008, 0.06, 0.008], 0x2a2524, "trolley");
        }
        if (kind === "sapling") {
          add("box", [0, 0.19, 0.085], [0.08, 0.06, 0.02], 0x5e9a6f, "carry");
        }
        break;
    }
    if (role === "wheelchair") {
      for (const pt of P) {
        if (pt.ch === "legL") pt.ch = "sitL";
        else if (pt.ch === "legR") pt.ch = "sitR";
      }
      const frame = 0x3e7c8c, dark = 0x2a2524, steel = 0xbfbfc4, seat = 0x3b3a42;
      for (const x of [-0.102, 0.102]) {
        add("torus", [x, 0.1, -0.015], [0.2, 0.2, 0.2], dark, "wheelX");
        add("torus", [x * 1.12, 0.1, -0.015], [0.165, 0.165, 0.165], steel, "wheelX");
        add("box", [x, 0.1, -0.015], [0.006, 0.17, 0.012], steel, "spoke");
        add("box", [x, 0.1, -0.015], [0.006, 0.012, 0.17], steel, "spoke");
        add("torus", [x * 0.68, 0.024, 0.15], [0.048, 0.048, 0.048], dark, "wheelX");
        add("box", [x * 0.84, 0.1, 0.06], [0.012, 0.012, 0.19], frame);
        add("box", [x * 0.84, 0.07, 0.15], [0.012, 0.07, 0.012], frame);
        add("box", [x * 0.7, 0.275, -0.085], [0.012, 0.012, 0.045], dark);
      }
      add("box", [0, 0.116, 0.0], [0.15, 0.02, 0.125], seat);
      add("box", [0, 0.2, -0.074], [0.145, 0.13, 0.014], seat);
      add("box", [0, 0.042, 0.165], [0.11, 0.012, 0.05], frame);
    }
    return { parts: P, scale: sc, uniformStyle: uStyle, uniformLabel: UNIFORM_LABELS[uStyle] || UNIFORM_LABELS["campus-casual"] };
  }

  function plan(role, kind, opts2) {
    // returns list of part descriptors (geometry, local offset, scale, colour, animation channel)
    const P = [];
    const skin = SKIN[Math.floor(rnd() * SKIN.length)];
    const isFacultyRole = role === "puma" || role.startsWith("faculty-");
    if (!isFacultyRole && role !== "islandlord") {
      return buildNkuhtNpcPlan(role, kind, opts2, skin);
    }
    let hair = HAIR[Math.floor(rnd() * HAIR.length)];
    let shirt = CASUAL[Math.floor(rnd() * CASUAL.length)],
      pants = [0x3b3a42, 0x4a5a78, 0x6b5a4a][Math.floor(rnd() * 3)];
    let sc = 1;
    if (role === "puma") {
      // 謝文欽 副教授兼系主任兼學務長 (teacher_1.jpg): silver-grey hair, charcoal blazer over light pink shirt, dark navy trousers
      sc = 1.15;
      shirt = 0xf4dce6;
      pants = 0x283040;
      hair = 0x6e6a66;
    } else if (role === "faculty-yang-jt") {
      // 楊仁德 專任教授: scholarly dark-grey hair, navy suit, white shirt, burgundy tie
      sc = 1.12;
      shirt = 0xffffff;
      pants = 0x1e2838;
      hair = 0x383434;
    } else if (role === "faculty-sha-c") {
      // 沙荃 助理教授級專技人員 (teacher_2.jpg): black side-parted hair, dark brown pinstripe suit, white shirt, navy gold-dotted tie
      sc = 1.12;
      shirt = 0xfbfbf7;
      pants = 0x362820;
      hair = 0x222022;
    } else if (role === "faculty-hsieh-jl") {
      // 謝家黎 副教授 (teacher_3.png): long wavy chestnut-auburn hair, red tweed jacket with black trim, cream blouse
      sc = 1.1;
      shirt = 0xf7efe2;
      pants = 0x252329;
      hair = 0x4a251d;
    } else if (role === "faculty-huang-cy") {
      // 黃啟揚 助理教授 (teacher_4.jpg): short dark-grey hair, glasses, cream/coral plaid shirt, khaki pants
      sc = 1.11;
      shirt = 0xf2e4d0;
      pants = 0x9c8e78;
      hair = 0x3a3532;
    } else if (role === "faculty-yu-mf") {
      // 游明鳳 助理教授 (teacher_5.jpg): long straight dark-brown hair, dark navy blazer over white top
      sc = 1.09;
      shirt = 0xfbfbf7;
      pants = 0x222836;
      hair = 0x46291c;
    } else if (role === "faculty-hsieh-cl") {
      // 謝金龍 助理教授兼實習輔導組長 (teacher_6.jpg): neat side-parted dark hair, glasses, navy check suit, red/navy tie, pocket square
      sc = 1.11;
      shirt = 0xffffff;
      pants = 0x232d3c;
      hair = 0x221d1a;
    } else if (role === "faculty-hsu-mj") {
      // 許孟鈞 助理教授兼校務策略研究組長 (teacher_7.png): voluminous side-parted black hair, round glasses, dark suit, blue striped tie & pocket square
      sc = 1.12;
      shirt = 0xffffff;
      pants = 0x1f242d;
      hair = 0x1a181b;
    } else if (role === "faculty-chang-hc") {
      // 張慧貞 專案助理教授 (teacher_8.jpg): reddish-brown side-swept bob hair, black V-neck sweater, silver-black patterned skirt, jade bangle
      sc = 1.09;
      shirt = 0x1e1d21;
      pants = 0x46484e;
      hair = 0x54281c;
    } else if (role === "faculty-lo-sk") {
      // 盧小琴 專案助理教授 (teacher_9.png): shoulder-length dark-brown bob hair, white lace blouse, gold heart necklace
      sc = 1.09;
      shirt = 0xfaf8f5;
      pants = 0x2a303c;
      hair = 0x3b2316;
    }
    if (role === "islandlord") {
      // easter-egg figure (2026-10-26): loose wavy hair, golf outfit — sky-blue polo, khaki chinos, white visor and shoes
      sc = 1.08;
      shirt = 0x9fcbe3; // polo
      pants = 0xcdb68e; // khaki chinos
      hair = 0x2a221f;
    }
    const add = (g, off, s, c, ch = null, r = null) => P.push({ g, off, s, c, ch, r });
    // legs (pivot at hip y=.13)
    add("leg", [-0.032, 0.065, 0], [0.05, 0.13, 0.058], pants, "legL");
    add("leg", [0.032, 0.065, 0], [0.05, 0.13, 0.058], pants, "legR");
    const shoe = role === "puma" || role === "islandlord" ? 0xf6f4ef : 0x2a2524; // Navigator wears white trainers (the island keeper, golf shoes)
    add("box", [-0.032, 0.012, 0.012], [0.055, 0.025, 0.085], shoe, "legL");
    add("box", [0.032, 0.012, 0.012], [0.055, 0.025, 0.085], shoe, "legR");
    // body
    add("body", [0, 0.2, 0], [0.135, 0.11, 0.115], shirt);
    if (role === "civil-servant") {
      add("box", [0, 0.205, 0.004], [0.128, 0.11, 0.104], colors.coral); // vest
      add("box", [0, 0.2, 0.056], [0.03, 0.04, 0.008], 0xffffff); // badge
      add("box", [0, 0.235, 0.054], [0.006, 0.05, 0.004], 0x3e7c8c); // lanyard
    }
    if (role === "worker") {
      // 客房與房務實習生：深藍灰房務背心與白色名牌（無工地反光條）
      add("box", [0, 0.205, 0.003], [0.128, 0.11, 0.104], 0x3b495e);
      add("box", [0.032, 0.225, 0.056], [0.026, 0.012, 0.006], 0xe5a922);
    }
    if (role === "farmer") {
      // 餐飲與宴會實習生：酒紅侍酒師馬甲背心與領結
      add("box", [0, 0.205, 0.003], [0.128, 0.11, 0.104], 0x5c2434);
      add("box", [0, 0.23, 0.056], [0.036, 0.06, 0.005], 0xfbfbf7);
      add("box", [0, 0.252, 0.059], [0.024, 0.01, 0.006], 0x221c1c);
    }
    if (role === "parent") {
      // 群賢會館實習幹部：深藍禮賓背心與金色名牌
      add("box", [0, 0.205, 0.003], [0.128, 0.11, 0.104], 0x283244);
      add("box", [0.032, 0.228, 0.056], [0.026, 0.012, 0.006], 0xe5a922);
    }
    if (role === "hiker") {
      // 渡假酒店實習生：湖水綠渡假村禮賓背心與名牌
      add("box", [0, 0.205, 0.003], [0.128, 0.11, 0.104], 0x3e7c8c);
      add("box", [0.032, 0.228, 0.056], [0.026, 0.012, 0.006], 0xe5a922);
    }
    if (role === "cyclist") {
      // 企業參訪學生：深藍學院背心與參訪識別證
      add("box", [0, 0.205, 0.003], [0.128, 0.11, 0.104], 0x2f3a4a);
      add("box", [0, 0.2, 0.056], [0.028, 0.038, 0.008], 0xffffff);
    }
    // arms (pivot at shoulder y=.255)
    add("arm", [-0.077, 0.205, 0], [0.034, 0.1, 0.038], role === "civil-servant" ? colors.coral : shirt, "armL");
    add("arm", [0.077, 0.205, 0], [0.034, 0.1, 0.038], role === "civil-servant" ? colors.coral : shirt, "armR");
    add("eye", [-0.077, 0.15, 0], [0.034, 0.034, 0.034], skin, "armL");
    add("eye", [0.077, 0.15, 0], [0.034, 0.034, 0.034], skin, "armR");
    // head
    add("head", [0, 0.345, 0], [0.19, 0.178, 0.172], skin, "head");
    // hair: a shell clearly larger than the head (the old near-equal shell z-fought and read as bald patches),
    // tipped back so a fringe sits above the eyes; plus a per-person style
    const hatted = role === "puma" || isFacultyRole;
    add("cap", [0, 0.352, -0.006], [0.206, hatted ? 0.17 : 0.19, 0.204], hair, "head", [-0.32, 0, 0]);
    if (!hatted) {
      const styles = role === "elder" ? ["short", "bun", "short"] : role === "youth" ? ["short", "long", "pony", "bun"] : ["short", "long", "bun", "pony", "short"];
      const st = opts2?.hairStyle || styles[Math.floor(rnd() * styles.length)];
      if (st === "long") add("box", [0, 0.31, -0.07], [0.19, 0.13, 0.05], hair, "head", [0.12, 0, 0]);
      if (st === "bun") add("eye", [0, 0.44, -0.07], [0.075, 0.07, 0.07], hair, "head");
      if (st === "pony") add("eye", [0, 0.33, -0.115], [0.055, 0.1, 0.05], hair, "head", [0.35, 0, 0]);
      if (st === "puff") for (const [dx, dy] of [[-0.07, 0.4], [0.07, 0.4], [0, 0.435]]) add("eye", [dx, dy, -0.02], [0.09, 0.08, 0.09], hair, "head");
      if (st === "beanie") {
        const knit = [0xdb6a41, 0x58a6a6, 0xe8c547, 0x6f7fb5][Math.floor(rnd() * 4)];
        add("cap", [0, 0.376, -0.008], [0.222, 0.17, 0.218], knit, "head", [-0.2, 0, 0]);
        add("eye", [0, 0.465, -0.02], [0.045, 0.045, 0.045], 0xfff8f0, "head");
      }
    }
    addFace(add, THREE, skin, hair);
    // carried item held in front (flow walkers), coloured by carry type
    const CARRY_PROP = {
      bed: ["box", [0.09, 0.05, 0.06], 0xffffff],
      crosswalk: ["box", [0.1, 0.015, 0.07], 0xf2efe8],
      energy: ["box", [0.05, 0.07, 0.04], 0xf1c232],
      clock: ["cyl", [0.07, 0.025, 0.07], 0xf1c232],
      folder: ["box", [0.08, 0.06, 0.015], 0x3e7c8c],
      globe: ["eye", [0.075, 0.075, 0.075], 0x5f9aa6],
      towel: ["box", [0.08, 0.03, 0.05], 0xfbfbf7],
      dumbbell: ["cyl", [0.025, 0.1, 0.025], 0x3b3a42],
      cards: ["box", [0.07, 0.045, 0.012], 0xe8c547],
      "book-heart": ["box", [0.07, 0.08, 0.02], colors.coral],
      counseling: ["eye", [0.06, 0.05, 0.03], 0xffffff],
      chip: ["box", [0.06, 0.012, 0.06], 0x2f5a46],
      droplet: ["eye", [0.055, 0.075, 0.055], 0x6fb3d4],
    };
    if (kind && CARRY_PROP[kind]) {
      const [g, s, c] = CARRY_PROP[kind];
      add(g, [0, 0.19, 0.085], s, c, "carry");
      if (kind === "dumbbell") for (const d of [-0.045, 0.045]) add("cyl", [d, 0.19, 0.085], [0.045, 0.02, 0.045], 0x3b3a42, "carry");
    }
    // role accessories
    switch (role) {
      case "civil-servant":
        add("box", [0.1, 0.2, 0.02], [0.02, 0.08, 0.06], 0x3e7c8c, "armR");
        break;
      case "researcher":
        // 旅館管理專題生：配戴斯文眼鏡、手持專題企劃書（無化學試管）
        add("box", [0, 0.22, 0.056], [0.036, 0.06, 0.006], 0xffffff);
        add("box", [-0.1, 0.19, 0.02], [0.022, 0.085, 0.065], 0x3e7c8c, "armL");
        add("eye", [0, 0.352, 0.086], [0.09, 0.012, 0.008], 0x2e2522, "head"); // glasses bar
        break;
      case "elder":
        // 星級飯店業師：深灰西裝外套、金質徽章、手持高階管理公事夾（無拐杖）
        add("box", [0, 0.205, 0.003], [0.134, 0.11, 0.11], 0x3d434d);
        add("eye", [0.036, 0.23, 0.06], [0.016, 0.016, 0.006], 0xe5a922);
        add("box", [0.1, 0.19, 0.02], [0.022, 0.08, 0.065], 0x5a4332, "armR");
        break;
      case "child":
        // 旅館系大一新生：背負學院後背包與名牌（無國小黃帽）
        add("box", [0, 0.2, -0.07], [0.1, 0.11, 0.05], [colors.coral, 0x4a6fa5, 0x58a6a6][Math.floor(rnd() * 3)]);
        add("box", [0.032, 0.225, 0.056], [0.024, 0.014, 0.006], 0xffffff);
        break;
      case "parent":
        // 群賢會館實習幹部：手持房務與客務交接夾、身旁拉動貴賓行李箱（無嬰兒推車）
        add("box", [-0.1, 0.19, 0.02], [0.02, 0.08, 0.06], 0xe5a922, "armL");
        add("box", [0.11, 0.08, 0.0], [0.05, 0.13, 0.1], 0x3e7c8c, "trolley");
        add("cyl", [0.11, 0.17, 0.0], [0.008, 0.06, 0.008], 0x2a2524, "trolley");
        break;
      case "cyclist":
        // 企業參訪學生：手持參訪手冊（無單車安全帽）
        add("box", [0.1, 0.19, 0.02], [0.02, 0.075, 0.055], 0xe5a922, "armR");
        break;
      case "farmer":
        // 餐飲與宴會實習生：右手托持銀色侍酒托盤與高腳杯（無斗笠與菜籃）
        add("cyl", [0.11, 0.165, 0.03], [0.09, 0.008, 0.09], 0xd8dce2, "armR");
        add("cyl", [0.11, 0.195, 0.03], [0.026, 0.048, 0.026], 0x8b2635, "armR");
        break;
      case "hiker":
        // 渡假酒店實習生：拉動渡假村貴賓行李箱（無登山帽與登山杖）
        add("box", [0.11, 0.08, 0.0], [0.05, 0.13, 0.1], 0xc06a3a, "trolley");
        add("cyl", [0.11, 0.17, 0.0], [0.008, 0.06, 0.008], 0x2a2524, "trolley");
        break;
      case "worker":
        // 客房與房務實習生：手持潔白房務布巾備品（無工地帽）
        add("box", [0.1, 0.18, 0.03], [0.05, 0.045, 0.065], 0xffffff, "armR");
        break;
      case "traveller":
        add("box", [0.11, 0.08, 0.0], [0.05, 0.13, 0.1], [colors.coral, 0x3e7c8c, 0xe8c547][Math.floor(rnd() * 3)], "trolley");
        add("cyl", [0.11, 0.17, 0.0], [0.008, 0.06, 0.008], 0x2a2524, "trolley");
        break;
      case "officeworker":
        add("box", [0, 0.22, 0.056], [0.032, 0.065, 0.005], 0xffffff);
        add("box", [0, 0.215, 0.059], [0.012, 0.055, 0.005], colors.coral);
        add("cyl", [0.1, 0.16, 0.03], [0.03, 0.05, 0.03], 0xf6efe3, "armR");
        break;
      case "youth":
        // 旅館接待競賽選手：金色榮譽胸章與證書夾
        add("box", [0, 0.22, 0.056], [0.032, 0.06, 0.005], 0xffffff);
        add("eye", [0.034, 0.23, 0.06], [0.018, 0.018, 0.006], 0xe5a922);
        break;
      case "puma": {
        // 謝文欽 副教授兼系主任兼學務長 (teacher_1.jpg):
        // Silver-grey side-parted hair with salt-and-pepper temple highlights, no glasses,
        // charcoal-grey blazer (0x484b52) over light-pink dress shirt (0xf4dce6), gold NKUHT lapel pin
        const SILVER = 0xa8a4a0, BLAZER = 0x484b52, PINK = 0xf4dce6;
        add("eye", [0.022, 0.428, 0.035], [0.13, 0.042, 0.085], hair, "head", [-0.2, 0, -0.18]); // side-swept top hair
        add("eye", [-0.048, 0.418, 0.025], [0.075, 0.035, 0.065], SILVER, "head", [-0.15, 0, 0.25]); // silver part accent
        for (const sx of [-1, 1]) add("box", [sx * 0.094, 0.358, 0.01], [0.016, 0.065, 0.07], SILVER, "head"); // silver temples
        for (const pt of P) if (pt.g === "arm") pt.c = BLAZER;
        add("box", [0, 0.205, 0.003], [0.136, 0.114, 0.108], BLAZER); // charcoal blazer body
        add("box", [0, 0.215, 0.056], [0.044, 0.092, 0.006], PINK); // light-pink shirt front
        for (const sx of [-1, 1]) add("box", [sx * 0.026, 0.222, 0.058], [0.016, 0.078, 0.006], 0x383b42, null, [0, 0, sx * -0.18]); // blazer lapels
        add("eye", [0.038, 0.232, 0.061], [0.016, 0.016, 0.006], 0xe5a922); // NKUHT gold lapel pin
        add("box", [0, 0.035, 0], [0.2, 0.07, 0.16], 0xb48560, "soap");
        add("box", [0, 0.035, 0.081], [0.12, 0.03, 0.004], 0xfff1de, "soap");
        break;
      }
      case "faculty-yang-jt": {
        // 楊仁德 專任教授: scholarly dark-grey hair with silver temples, rectangular glasses,
        // dark-navy suit (0x263348), white shirt, burgundy tie (0x8c2d38), holding strategy tome
        const SUIT = 0x263348, TIE = 0x8c2d38;
        add("eye", [0, 0.426, 0.028], [0.14, 0.038, 0.08], hair, "head", [-0.15, 0, 0]);
        for (const sx of [-1, 1]) add("box", [sx * 0.094, 0.356, 0.008], [0.015, 0.06, 0.065], 0x7d7976, "head");
        for (const dx of [-0.038, 0.038]) add("box", [dx, 0.35, 0.088], [0.044, 0.028, 0.008], 0x26211f, "head");
        add("box", [0, 0.352, 0.09], [0.024, 0.006, 0.006], 0x26211f, "head");
        for (const pt of P) if (pt.g === "arm") pt.c = SUIT;
        add("box", [0, 0.205, 0.003], [0.136, 0.114, 0.108], SUIT);
        add("box", [0, 0.22, 0.056], [0.042, 0.085, 0.006], 0xffffff);
        add("box", [0, 0.21, 0.059], [0.016, 0.075, 0.006], TIE); // burgundy tie
        add("eye", [0.038, 0.232, 0.061], [0.015, 0.015, 0.006], 0xe5a922);
        add("box", [-0.1, 0.18, 0.03], [0.025, 0.085, 0.065], TIE, "armL"); // hardcover book
        add("box", [0, 0.035, 0], [0.2, 0.07, 0.16], 0xb48560, "soap");
        add("box", [0, 0.035, 0.081], [0.12, 0.03, 0.004], 0xfff1de, "soap");
        break;
      }
      case "faculty-sha-c": {
        // 沙荃 助理教授級專技人員 (teacher_2.jpg): black side-parted hair, dark-brown pinstripe suit (0x46352b),
        // white shirt, dark-navy tie with gold dots (0x22334d), National Skills Judge badge
        const SUIT = 0x46352b, STRIPE = 0x634c3f, TIE = 0x22334d;
        add("eye", [0.02, 0.426, 0.034], [0.135, 0.04, 0.082], hair, "head", [-0.18, 0, -0.15]);
        for (const pt of P) if (pt.g === "arm") pt.c = SUIT;
        add("box", [0, 0.205, 0.003], [0.136, 0.114, 0.108], SUIT);
        for (const dx of [-0.048, -0.028, 0.028, 0.048]) add("box", [dx, 0.205, 0.056], [0.004, 0.106, 0.004], STRIPE); // pinstripes
        add("box", [0, 0.222, 0.056], [0.04, 0.082, 0.006], 0xfbfbf7);
        add("box", [0, 0.21, 0.059], [0.016, 0.074, 0.006], TIE);
        for (const dy of [0.228, 0.208, 0.188]) add("eye", [0, dy, 0.063], [0.006, 0.006, 0.004], 0xe5a922); // gold dots on tie
        add("eye", [0.038, 0.235, 0.061], [0.02, 0.02, 0.006], 0xf5d33a); // Gold medal coach badge
        add("box", [0, 0.035, 0], [0.2, 0.07, 0.16], 0xb48560, "soap");
        add("box", [0, 0.035, 0.081], [0.12, 0.03, 0.004], 0xfff1de, "soap");
        break;
      }
      case "faculty-hsieh-jl": {
        // 謝家黎 副教授 (teacher_3.png): voluminous long wavy chestnut-auburn hair (0x4a251d),
        // bright red tweed jacket (0xc82829) with black trim (0x1f1d22), cream blouse, pearl necklace
        const RED = 0xc82829, TRIM = 0x1f1d22, CREAM = 0xf7efe2;
        add("box", [0, 0.295, -0.072], [0.205, 0.16, 0.058], hair, "head", [0.1, 0, 0]); // long back hair
        for (const sx of [-1, 1]) {
          add("eye", [sx * 0.088, 0.31, 0.025], [0.058, 0.13, 0.058], hair, "head", [0.1, 0, sx * 0.12]); // wavy shoulder curls
          add("eye", [sx * 0.075, 0.39, 0.03], [0.07, 0.065, 0.07], hair, "head");
        }
        for (const pt of P) if (pt.g === "arm") pt.c = RED;
        add("box", [0, 0.205, 0.003], [0.134, 0.112, 0.106], RED); // red tweed jacket
        add("box", [0, 0.212, 0.056], [0.044, 0.09, 0.006], CREAM); // cream inner blouse
        for (const sx of [-1, 1]) {
          add("box", [sx * 0.024, 0.212, 0.058], [0.009, 0.092, 0.006], TRIM); // black tweed placket trim
          add("box", [sx * 0.077, 0.162, 0], [0.038, 0.014, 0.042], TRIM, sx < 0 ? "armL" : "armR"); // black cuff trim
        }
        for (const dx of [-0.022, -0.011, 0, 0.011, 0.022]) add("eye", [dx, 0.256 - Math.abs(dx) * 0.25, 0.059], [0.009, 0.009, 0.009], 0xffffff); // pearl necklace
        add("box", [0, 0.035, 0], [0.2, 0.07, 0.16], 0xb48560, "soap");
        add("box", [0, 0.035, 0.081], [0.12, 0.03, 0.004], 0xfff1de, "soap");
        break;
      }
      case "faculty-huang-cy": {
        // 黃啟揚 助理教授 (teacher_4.jpg): short dark-grey hair, rectangular glasses,
        // cream/tan/coral plaid shirt with rolled-up sleeves, brown belt with silver buckle, khaki pants
        const PLAID_BASE = 0xf2e4d0, CORAL_LINE = 0xd97a54, GREY_LINE = 0x6e6a66;
        for (const dx of [-0.038, 0.038]) add("box", [dx, 0.35, 0.088], [0.044, 0.026, 0.008], 0x302b28, "head");
        add("box", [0, 0.352, 0.09], [0.024, 0.005, 0.006], 0x302b28, "head");
        for (const pt of P) if (pt.g === "arm") pt.c = skin; // rolled-up sleeves show forearms
        for (const ch of ["armL", "armR"]) {
          const x = ch === "armL" ? -0.077 : 0.077;
          add("arm", [x, 0.23, 0], [0.04, 0.052, 0.043], PLAID_BASE, ch);
          add("box", [x, 0.205, 0], [0.042, 0.012, 0.045], CORAL_LINE, ch); // rolled cuff
        }
        add("box", [0, 0.205, 0.003], [0.134, 0.112, 0.106], PLAID_BASE);
        // Plaid stripes (vertical & horizontal)
        for (const dx of [-0.042, 0, 0.042]) add("box", [dx, 0.205, 0.057], [0.007, 0.11, 0.004], CORAL_LINE);
        for (const dy of [0.235, 0.195, 0.16]) add("box", [0, dy, 0.057], [0.13, 0.007, 0.004], dy === 0.195 ? GREY_LINE : CORAL_LINE);
        add("cyl", [0, 0.138, 0], [0.137, 0.015, 0.116], 0x5c3c24); // brown belt
        add("box", [0, 0.138, 0.059], [0.02, 0.014, 0.005], 0xd3d6da); // silver buckle
        add("box", [0, 0.035, 0], [0.2, 0.07, 0.16], 0xb48560, "soap");
        add("box", [0, 0.035, 0.081], [0.12, 0.03, 0.004], 0xfff1de, "soap");
        break;
      }
      case "faculty-yu-mf": {
        // 游明鳳 助理教授 (teacher_5.jpg): medium-long straight dark-brown hair (0x46291c),
        // dark-navy tailored blazer (0x222836) over crisp white top, silver necklace & silver wristwatch
        const NAVY = 0x222836, WHITE = 0xfbfbf7, SILVER = 0xd8dde6;
        add("box", [0, 0.3, -0.07], [0.195, 0.15, 0.052], hair, "head", [0.08, 0, 0]);
        for (const sx of [-1, 1]) add("box", [sx * 0.086, 0.315, 0.022], [0.032, 0.12, 0.045], hair, "head");
        for (const pt of P) if (pt.g === "arm") pt.c = NAVY;
        add("box", [0, 0.205, 0.003], [0.134, 0.112, 0.106], NAVY);
        add("box", [0, 0.215, 0.056], [0.046, 0.09, 0.006], WHITE);
        add("eye", [0, 0.252, 0.059], [0.012, 0.012, 0.006], SILVER); // silver pendant
        add("cyl", [-0.077, 0.162, 0], [0.038, 0.01, 0.04], SILVER, "armL"); // silver wristwatch
        add("box", [0, 0.035, 0], [0.2, 0.07, 0.16], 0xb48560, "soap");
        add("box", [0, 0.035, 0.081], [0.12, 0.03, 0.004], 0xfff1de, "soap");
        break;
      }
      case "faculty-hsieh-cl": {
        // 謝金龍 助理教授兼實習輔導組長 (teacher_6.jpg): neat side-parted dark hair, thin glasses,
        // navy check suit (0x2c384a), white shirt, red/navy striped tie (0xa63429), white pocket square
        const SUIT = 0x2c384a, TIE = 0xa63429;
        add("eye", [0.024, 0.426, 0.032], [0.13, 0.038, 0.08], hair, "head", [-0.16, 0, -0.18]);
        for (const dx of [-0.038, 0.038]) add("box", [dx, 0.35, 0.088], [0.042, 0.024, 0.007], 0x2c2623, "head");
        add("box", [0, 0.352, 0.09], [0.024, 0.005, 0.006], 0x2c2623, "head");
        for (const pt of P) if (pt.g === "arm") pt.c = SUIT;
        add("box", [0, 0.205, 0.003], [0.136, 0.114, 0.108], SUIT);
        add("box", [0, 0.222, 0.056], [0.04, 0.082, 0.006], 0xffffff);
        add("box", [0, 0.21, 0.059], [0.016, 0.074, 0.006], TIE);
        add("box", [0.038, 0.228, 0.059], [0.022, 0.012, 0.005], 0xffffff); // crisp white pocket square
        add("box", [0, 0.035, 0], [0.2, 0.07, 0.16], 0xb48560, "soap");
        add("box", [0, 0.035, 0.081], [0.12, 0.03, 0.004], 0xfff1de, "soap");
        break;
      }
      case "faculty-hsu-mj": {
        // 許孟鈞 助理教授兼校務策略研究組長 (teacher_7.png): voluminous side-parted black hair,
        // round black-and-gold glasses, dark charcoal-navy suit (0x282d38), blue striped tie (0x2b579a), blue pocket square
        const SUIT = 0x282d38, TIE = 0x2b579a, POCKET = 0x5b9bd5;
        add("eye", [0.018, 0.434, 0.034], [0.145, 0.052, 0.09], hair, "head", [-0.22, 0, -0.15]); // voluminous quiff
        add("eye", [-0.04, 0.425, 0.02], [0.09, 0.044, 0.08], hair, "head", [-0.1, 0, 0.2]);
        for (const dx of [-0.038, 0.038]) add("torus", [dx, 0.35, 0.09], [0.048, 0.044, 0.048], 0x1e1b18, "head"); // round glasses
        add("box", [0, 0.352, 0.091], [0.024, 0.006, 0.006], 0xe5a922, "head"); // gold bridge
        for (const pt of P) if (pt.g === "arm") pt.c = SUIT;
        add("box", [0, 0.205, 0.003], [0.136, 0.114, 0.108], SUIT);
        add("box", [0, 0.222, 0.056], [0.04, 0.082, 0.006], 0xffffff);
        add("box", [0, 0.21, 0.059], [0.016, 0.074, 0.006], TIE);
        for (const dy of [0.226, 0.206]) add("box", [0, dy, 0.062], [0.016, 0.005, 0.003], 0x8ab4f8); // blue tie stripes
        add("box", [0.038, 0.228, 0.059], [0.022, 0.012, 0.005], POCKET); // blue pocket square
        add("box", [0, 0.035, 0], [0.2, 0.07, 0.16], 0xb48560, "soap");
        add("box", [0, 0.035, 0.081], [0.12, 0.03, 0.004], 0xfff1de, "soap");
        break;
      }
      case "faculty-chang-hc": {
        // 張慧貞 專案助理教授 (teacher_8.jpg): reddish-brown side-swept bob hair (0x54281c),
        // black V-neck top (0x1e1d21), silver necklace, black-and-silver patterned skirt, green jade bangle on left wrist
        const BLACK = 0x1e1d21, JADE = 0x8fd4b8, SILVER = 0xd8dde6;
        for (const sx of [-1, 1]) add("eye", [sx * 0.092, 0.34, 0.015], [0.042, 0.095, 0.085], hair, "head", [0, 0, sx * -0.08]); // bob sides
        add("eye", [0.025, 0.422, 0.042], [0.13, 0.04, 0.075], hair, "head", [-0.25, 0, -0.2]); // side-swept fringe
        for (const pt of P) if (pt.g === "arm") pt.c = BLACK;
        add("box", [0, 0.205, 0.003], [0.132, 0.11, 0.104], BLACK);
        add("box", [0, 0.246, 0.056], [0.034, 0.032, 0.006], skin); // V-neck skin neckline
        add("eye", [0, 0.242, 0.059], [0.01, 0.01, 0.005], SILVER); // silver necklace pendant
        add("box", [0, 0.145, 0.002], [0.138, 0.038, 0.11], 0x46484e); // patterned skirt waist
        for (const dx of [-0.04, 0, 0.04]) add("box", [dx, 0.145, 0.058], [0.014, 0.022, 0.004], SILVER); // silver skirt motif
        add("torus", [-0.077, 0.162, 0], [0.042, 0.042, 0.042], JADE, "armL", [Math.PI / 2, 0, 0]); // green jade bangle!
        add("box", [0, 0.035, 0], [0.2, 0.07, 0.16], 0xb48560, "soap");
        add("box", [0, 0.035, 0.081], [0.12, 0.03, 0.004], 0xfff1de, "soap");
        break;
      }
      case "faculty-lo-sk": {
        // 盧小琴 專案助理教授 (teacher_9.png): shoulder-length dark-brown bob hair (0x3b2316),
        // pure white lace blouse (0xfaf8f5), golden heart pendant necklace (0xe8c547)
        const LACE = 0xfaf8f5, LACE_TRIM = 0xe8e0d2, GOLD = 0xe8c547;
        for (const sx of [-1, 1]) add("eye", [sx * 0.09, 0.33, 0.012], [0.044, 0.105, 0.088], hair, "head", [0, 0, sx * -0.05]);
        add("eye", [-0.022, 0.422, 0.04], [0.125, 0.038, 0.072], hair, "head", [-0.22, 0, 0.18]);
        for (const pt of P) if (pt.g === "arm") pt.c = LACE;
        add("box", [0, 0.205, 0.003], [0.134, 0.112, 0.106], LACE);
        for (const dy of [0.232, 0.202, 0.172]) add("box", [0, dy, 0.057], [0.11, 0.008, 0.004], LACE_TRIM); // lace horizontal texture
        add("box", [0, 0.248, 0.056], [0.032, 0.026, 0.006], skin); // neckline
        add("eye", [0, 0.242, 0.06], [0.016, 0.014, 0.006], GOLD); // golden heart pendant
        add("box", [0, 0.035, 0], [0.2, 0.07, 0.16], 0xb48560, "soap");
        add("box", [0, 0.035, 0.081], [0.12, 0.03, 0.004], 0xfff1de, "soap");
        break;
      }
      case "islandlord": {
        // textured quiff: longer hair on top lifted off the forehead and swept back and over to his left,
        // a little overhang above the faded side, a few textured ends at the back
        // loose waves under a visor (2026-10-26): every wave sits on the crown, above the visor band and inside its
        // outline, so no hair sticks out at the sides or the back; the back of the head is the smooth hair shell
        {
          const W2 = 0x352b27;
          for (let k = 0; k < 8; k++) {
            const a = (k / 8) * Math.PI * 2 + 0.2;
            if (Math.cos(a) > 0.8) continue; // the front is covered by the fringe
            add("eye", [Math.sin(a) * 0.06, 0.414, Math.cos(a) * 0.056 - 0.012], [0.07, 0.042, 0.052], k % 3 ? hair : W2, "head", [Math.cos(a) * 0.3, a, -Math.sin(a) * 0.3]);
          }
          for (const [x, z, sx, ry] of [[-0.028, -0.02, 0.08, 0.4], [0.032, -0.028, 0.076, -0.5], [0.0, 0.025, 0.084, 0.15], [0.008, -0.058, 0.074, 0.9]])
            add("eye", [x, 0.435, z], [sx, 0.044, 0.06], hair, "head", [0, ry, 0]); // waves on top
          for (const [x, y, z, rz, c] of [[-0.03, 0.43, 0.042, 0.35, hair], [0.02, 0.436, 0.046, -0.25, W2], [0.05, 0.424, 0.034, -0.5, hair]])
            add("eye", [x, y, z], [0.064, 0.03, 0.04], c, "head", [-0.35, 0, rz]); // wavy fringe, above the band
        }
        // golf outfit (refined 2026-10-26): sky-blue polo with a soft white collar, a three-button placket, a small coral
        // chest logo and slim side seams; short sleeves with ribbed cuffs (bare forearms); khaki chinos with front creases
        // and back pockets, a tan belt with a silver buckle; a one-piece white visor (no dark band) with a coral logo;
        // a white glove; white golf shoes with tan saddles and dark soles; a driver held in the left hand.
        const POLO = shirt, WHITE = 0xf7f6f2, RIB = 0x8fbfda, SEAM = 0x8cb9d2, CORAL = colors.coral;
        for (const pt of P) if (pt.g === "arm") pt.c = skin; // short sleeves: bare forearms
        for (const ch of ["armL", "armR"]) {
          const x = ch === "armL" ? -0.077 : 0.077;
          add("arm", [x, 0.232, 0], [0.04, 0.05, 0.043], POLO, ch); // sleeve
          add("box", [x, 0.207, 0], [0.042, 0.009, 0.045], RIB, ch); // ribbed cuff
        }
        // collar: a soft band and two rounded points lying on the chest
        add("cyl", [0, 0.283, -0.004], [0.092, 0.018, 0.084], WHITE);
        for (const sx of [-1, 1]) add("eye", [0.018 * sx, 0.27, 0.05], [0.036, 0.012, 0.03], WHITE, null, [0.55, 0, -0.45 * sx]);
        add("box", [0, 0.24, 0.0585], [0.016, 0.046, 0.004], RIB); // placket
        for (const y of [0.255, 0.24, 0.225]) add("eye", [0, y, 0.0612], [0.006, 0.006, 0.003], WHITE); // buttons
        add("eye", [0.04, 0.235, 0.0595], [0.016, 0.012, 0.004], CORAL); // chest logo
        for (const sx of [-1, 1]) add("box", [0.069 * sx, 0.19, 0], [0.003, 0.09, 0.05], SEAM); // side seams
        // belt and trousers
        add("cyl", [0, 0.137, 0], [0.137, 0.015, 0.117], 0x9a6b44); // belt
        add("box", [0, 0.137, 0.0585], [0.018, 0.013, 0.004], 0xd3d6da); // buckle
        for (const ch of ["legL", "legR"]) {
          const x = ch === "legL" ? -0.032 : 0.032;
          add("box", [x, 0.072, 0.0295], [0.003, 0.1, 0.002], 0xb59f78, ch); // front crease
          add("box", [x, 0.112, -0.0295], [0.024, 0.022, 0.002], 0xb59f78, ch); // back pocket
          add("box", [x, 0.013, 0.0], [0.057, 0.018, 0.04], 0xb88a5f, ch); // shoe saddle
          add("box", [x, 0.001, 0.012], [0.056, 0.004, 0.086], 0x3a3438, ch); // sole
        }
        // visor: one white piece — a band round the head and a curved brim, small coral logo on the front
        add("band", [0, 0.376, -0.004], [0.214, 0.044, 0.206], WHITE, "head"); // smooth band, wide enough to hide the hair shell edge
        add("band", [0, 0.376, -0.004], [0.206, 0.044, 0.198], 0xeceae4, "head"); // inner face (the band is open), slightly shaded
        add("brim", [0, 0.36, 0.1], [0.166, 0.014, 0.094], WHITE, "head", [-0.18, 0, 0]);
        add("eye", [0, 0.376, 0.097], [0.022, 0.014, 0.006], CORAL, "head", [-0.05, 0, 0]);
        add("eye", [-0.077, 0.15, 0], [0.038, 0.038, 0.038], WHITE, "armL"); // glove
        // driver in the left hand: steel shaft angled to the ground, black grip, rounded black head
        add("cyl", [-0.1, 0.085, 0.035], [0.006, 0.15, 0.006], 0xc4c8ce, "armL", [0.25, 0, -0.22]);
        add("cyl", [-0.086, 0.15, 0.02], [0.011, 0.035, 0.011], 0x1f1d22, "armL", [0.25, 0, -0.22]);
        add("eye", [-0.119, 0.014, 0.054], [0.034, 0.022, 0.042], 0x1f1d22, "armL", [0, 0.4, 0]);
        break;
      }
      case "citizen":
        if (kind === "passport") {
          add("box", [0.11, 0.08, 0.0], [0.05, 0.13, 0.1], [colors.coral, 0x3e7c8c][Math.floor(rnd() * 2)], "trolley");
          add("cyl", [0.11, 0.17, 0.0], [0.008, 0.06, 0.008], 0x2a2524, "trolley");
        }
        if (kind === "sapling") {
          add("box", [0, 0.19, 0.085], [0.08, 0.06, 0.02], 0x5e9a6f, "carry");
        }
        break;
    }
    if (false && role === "cyclist") {
      // riding pose: the rider sits on the saddle (body lifted), hands on the bars, feet on the pedals
      const LIFT = 0.095;
      for (const pt of P) {
        pt.off = [pt.off[0], pt.off[1] + LIFT, pt.off[2] - 0.01];
        if (pt.ch === "legL") pt.ch = "pedalL";
        else if (pt.ch === "legR") pt.ch = "pedalR";
        else if (pt.ch === "armL" || pt.ch === "armR") pt.ch = "ride" + pt.ch.slice(3);
        else if (pt.ch === "carry") pt.off = [pt.off[0], pt.off[1] - 0.02, pt.off[2] + 0.06];
      }
      const frame = colors.coral,
        dark = 0x2a2524;
      for (const dz of [-0.15, 0.15]) {
        add("torus", [0, 0.078, dz], [0.155, 0.155, 0.155], dark, "wheelX");
        add("box", [0, 0.078, dz], [0.006, 0.13, 0.012], 0xbfbfc4, "spoke");
        add("box", [0, 0.078, dz], [0.006, 0.012, 0.13], 0xbfbfc4, "spoke");
      }
      add("box", [0, 0.14, 0.0], [0.022, 0.022, 0.28], frame); // top tube
      add("box", [0, 0.11, -0.07], [0.02, 0.09, 0.02], frame, null); // seat tube
      add("box", [0, 0.15, 0.13], [0.02, 0.15, 0.02], frame); // fork / head tube
      add("box", [0, 0.088, 0.055], [0.012, 0.012, 0.14], frame, null, [0.5, 0, 0]);
      add("box", [0, 0.162, -0.05], [0.05, 0.018, 0.07], dark); // saddle (just under the hips)
      add("box", [0, 0.255, 0.135], [0.13, 0.014, 0.014], dark); // handlebar
      add("cyl", [0, 0.068, 0.0], [0.035, 0.012, 0.035], 0x8a8a90, "crank");
      add("box", [0.04, 0.068, 0.0], [0.012, 0.012, 0.06], 0x8a8a90, "crankR");
      add("box", [-0.04, 0.068, 0.0], [0.012, 0.012, 0.06], 0x8a8a90, "crankL");
      add("box", [0.0, 0.16, 0.135], [0.05, 0.04, 0.04], 0x7aa0b0); // front basket
    }
    if (role === "wheelchair") {
      // seated on a wheelchair: legs fold forward from the hip (constant angle), arms push the rims while moving
      for (const pt of P) {
        if (pt.ch === "legL") pt.ch = "sitL";
        else if (pt.ch === "legR") pt.ch = "sitR";
      }
      const frame = 0x3e7c8c, dark = 0x2a2524, steel = 0xbfbfc4, seat = 0x3b3a42;
      for (const x of [-0.102, 0.102]) {
        add("torus", [x, 0.1, -0.015], [0.2, 0.2, 0.2], dark, "wheelX"); // big rear wheels
        add("torus", [x * 1.12, 0.1, -0.015], [0.165, 0.165, 0.165], steel, "wheelX"); // push rims
        add("box", [x, 0.1, -0.015], [0.006, 0.17, 0.012], steel, "spoke");
        add("box", [x, 0.1, -0.015], [0.006, 0.012, 0.17], steel, "spoke");
        add("torus", [x * 0.68, 0.024, 0.15], [0.048, 0.048, 0.048], dark, "wheelX"); // front casters
        add("box", [x * 0.84, 0.1, 0.06], [0.012, 0.012, 0.19], frame); // side rails
        add("box", [x * 0.84, 0.07, 0.15], [0.012, 0.07, 0.012], frame); // caster forks
        add("box", [x * 0.7, 0.275, -0.085], [0.012, 0.012, 0.045], dark); // push handles
      }
      add("box", [0, 0.116, 0.0], [0.15, 0.02, 0.125], seat); // seat
      add("box", [0, 0.2, -0.074], [0.145, 0.13, 0.014], seat); // backrest
      add("box", [0, 0.042, 0.165], [0.11, 0.012, 0.05], frame); // footrest
    }
    return { parts: P, scale: sc };
  }

  // ---------- routes ----------
  const routeCache = new Map();
  function routeFor(from, to, salt) {
    const key = `${from}>${to}>${salt}`;
    if (routeCache.has(key)) return routeCache.get(key);
    const fromIsland = islandsMap.has(from) ? from : nearestIsland(centers.get(from));
    const toIsland = islandsMap.has(to) ? to : nearestIsland(centers.get(to));
    const ringA = graph.ringIndex.get(fromIsland),
      ringB = graph.ringIndex.get(toIsland);
    // 2026-10-29: leave from the side of the island that faces the destination and arrive on the side facing the source
    // (a ring spot picked by salt made many lines loop half way round an island first: 市府核心 → 教育 was 15 long, now ~6)
    const a = islandsMap.has(from) ? graph.nodeNear(fromIsland, centers.get(toIsland)) : graph.nodeNear(fromIsland, centers.get(from));
    const b = islandsMap.has(to) ? graph.nodeNear(toIsland, centers.get(fromIsland)) : graph.nodeNear(toIsland, centers.get(to));
    let ids = graph.shortest(a, b);
    // neighbouring islands: facing-to-facing is just the bridge (too short to read or walk), so start and finish a
    // quarter of the way round each ring and let the line sweep over the bridge between them
    if (islandsMap.has(from) && islandsMap.has(to) && ids.length <= 2) {
      const ia = ringA.indexOf(a),
        ib = ringB.indexOf(b);
      ids = graph.shortest(ringA[(ia + 3) % ringA.length], ringB[(ib + ringB.length - 3) % ringB.length]);
    }
    const pts = graph.pathPoints(ids);
    // lateral offset so two-way traffic doesn't overlap
    const off = ((salt % 3) - 1) * 0.07;
    const res = [];
    for (let k = 0; k < pts.length; k++) {
      const prev = pts[Math.max(0, k - 1)],
        next = pts[Math.min(pts.length - 1, k + 1)];
      const d = new THREE.Vector3().subVectors(next, prev).setY(0).normalize();
      res.push(pts[k].clone().add(new THREE.Vector3(-d.z * off, 0, d.x * off)));
    }
    const lens = [0];
    for (let k = 1; k < res.length; k++) lens.push(lens[k - 1] + res[k].distanceTo(res[k - 1]));
    const r = { pts: res, lens, total: lens[lens.length - 1], islands: new Set(ids.map((n) => graph.nodes[n].island)) };
    routeCache.set(key, r);
    return r;
  }
  function nearestIsland(p) {
    let best = null,
      bd = 1e9;
    for (const id of islandsMap.keys()) {
      const d = centers.get(id).distanceToSquared(p);
      if (d < bd) {
        bd = d;
        best = id;
      }
    }
    return best;
  }
  function sample(route, s) {
    if (route.total < 0.001) return { p: route.pts[0].clone(), dir: new THREE.Vector3(0, 0, 1) };
    let k = 1;
    while (k < route.lens.length - 1 && route.lens[k] < s) k++;
    const a = route.pts[k - 1],
      b = route.pts[k],
      seg = route.lens[k] - route.lens[k - 1] || 1;
    const t = Math.min(1, Math.max(0, (s - route.lens[k - 1]) / seg));
    return { p: a.clone().lerp(b, t), dir: new THREE.Vector3().subVectors(b, a).setY(0).normalize() };
  }

  // ---------- flow walkers ----------
  // One canonical walkway route per connection branch: the drawn line and every walker on that branch share it,
  // so people never walk a different path from the one shown, and no branch is drawn as a straight line over water.
  paths.forEach((p, idx) => (p.route = routeFor(p.from, p.to, idx * 3 + 1))); // salt ≡ 1 (mod 3) → no lateral offset
  // 2026-10-25: a branch whose route collapses onto its own island (an off-map port such as 社區, whose nearest island is
  // the source island itself) has nowhere to walk: F8 運動 → 社區 was 0.9 long and its walkers just paced on the sport tile.
  // Such branches get no walkers and no drawn line (app.js skips them too); the flow keeps its other branches.
  const MIN_BRANCH = 1.5;
  for (const p of paths) p.degenerate = p.route.total < MIN_BRANCH;
  const flowEdges = new Map();
  for (const p of paths) {
    if (p.degenerate) continue;
    if (!flowEdges.has(p.flow)) flowEdges.set(p.flow, []);
    flowEdges.get(p.flow).push(p);
  }
  // 2026-11-12: 精簡步道路人 NPC 密度（保留每條協作線 1~2 位代表，並從中精選約半數佩戴素養徽章作為可對話學長姐代表），讓跨裝置真人玩家更醒目、橋面更清爽
  const perFlow = 1;
  const WHEELCHAIR_FLOWS = {};
  for (const [flowIdx, f] of flowsData.entries()) {
    const edges = flowEdges.get(f.id) || [];
    if (!edges.length) continue;
    const n = Math.max(perFlow, Math.min(edges.length, quality === "low" ? 1 : 2));
    for (let k = 0; k < n; k++) {
      const e = edges[k % edges.length];
      const route = e.route;
      const every = WHEELCHAIR_FLOWS[f.id];
      const role = every && k % every === 1 ? "wheelchair" : f.walker;
      const pl = plan(role, f.carry);
      const interactive = k === 0 && flowIdx % 2 === 0;
      people.push({ kind: "flow", flow: f.id, role, carry: f.carry, interactive, from: e.from, to: e.to, route, plan: pl, uniformLabel: pl.uniformLabel, uniformStyle: pl.uniformStyle, phase: rnd(), speed: 0.34 + rnd() * 0.08, s: 0, dirSign: 1 });
    }
  }
  // ---------- ambient figures (精簡半數定點背景學生，維持適度校園生機而不擁擠) ----------
  const ambientSpots = (opts.ambientSpots || []).filter((_, aIdx) => aIdx % 2 === 0);
  const POSES = ["sit", "read", "wave", null, "sit", "read"];
  for (const a of ambientSpots) {
    const pl = plan(a.role, null, { island: a.island });
    // stationary figures do something in place: picnic-sit, read, wave
    const pose = a.pose !== undefined ? a.pose : !a.wander && !["traveller", "worker", "cyclist"].includes(a.role) ? POSES[Math.floor(rnd() * POSES.length)] : null;
    if (pose === "boxes") {
      pl.parts.push({ g: "box", off: [0, 0.2, 0.09], s: [0.11, 0.09, 0.08], c: 0xc9a27a, ch: "carry" });
      pl.parts.push({ g: "box", off: [0, 0.2, 0.131], s: [0.06, 0.012, 0.002], c: 0xb0855c, ch: "carry" });
    }
    if (pose === "skate") {
      // rider stands on the deck; the deck runs along the facing direction
      for (const pt of pl.parts) pt.off = [pt.off[0], pt.off[1] + 0.032, pt.off[2]];
      pl.parts.push({ g: "box", off: [0, 0.022, 0], s: [0.08, 0.014, 0.24], c: [0xdb6a41, 0x3e7c8c, 0x211d1d][Math.floor(rnd() * 3)], ch: null });
      for (const [dx, dz] of [[-0.03, -0.08], [0.03, -0.08], [-0.03, 0.08], [0.03, 0.08]]) pl.parts.push({ g: "eye", off: [dx, 0.009, dz], s: [0.018, 0.018, 0.018], c: 0xf2efe8, ch: null });
    }
    if (pose === "read") pl.parts.push({ g: "box", off: [0, 0.21, 0.085], s: [0.08, 0.06, 0.015], c: [0xdb6a41, 0x3e7c8c, 0xe8c547][Math.floor(rnd() * 3)], ch: "carry", r: [-0.5, 0, 0] });
    people.push({ kind: "ambient", role: a.role, island: a.island, pos: a.pos, yaw: a.yaw || 0, plan: pl, uniformLabel: pl.uniformLabel, uniformStyle: pl.uniformStyle, phase: rnd(), wander: a.wander || 0, pose });
  }

  // ---------- easter egg: Lead faculty navigator walks every theme island in number order, pausing at each on his soapbox ----------
  if (opts.puma !== false) {
    const order = [...islandsMap.values()].sort((a, b) => a.number - b.number).map((i) => i.id);
    // each island's stop = its walkway-ring node nearest the viewer (south side), so legs join end-to-start with no jumps
    const stopNode = new Map(order.map((id) => [id, graph.ringIndex.get(id).reduce((a, b) => (graph.nodes[b].p.z > graph.nodes[a].p.z ? b : a))]));
    const legs = order.map((id, k) => {
      const next = order[(k + 1) % order.length];
      const ids = graph.shortest(stopNode.get(id), stopNode.get(next));
      const pts = graph.pathPoints(ids);
      // step off the walkway a little toward the island centre to stop (clear of the lamp posts on the ring)
      const inward = (isl, q) => q.clone().lerp(centers.get(isl).clone().setY(q.y), 0.1);
      pts.unshift(inward(id, pts[0]));
      pts.push(inward(next, pts[pts.length - 1]));
      const lens = [0];
      for (let j = 1; j < pts.length; j++) lens.push(lens[j - 1] + pts[j].distanceTo(pts[j - 1]));
      return { pts, lens, total: lens[lens.length - 1] };
    });
    people.push({ kind: "puma", role: "puma", teacherId: "hsieh-wc", order, legs, leg: 0, s: 0, wait: 3.5, plan: plan("puma", null), phase: rnd(), speed: 0.42, pose: "wave", waiting: true });
    // Spawn the other 9 department faculty members patrolling their specialty islands & Island 08 (welfare)
    FACULTY.slice(1).forEach((t, idx) => {
      const tOrder = t.islands.filter((id) => islandsMap.has(id));
      if (tOrder.length < 2) return;
      const tStopNode = (id, stepIdx) => {
        const ring = graph.ringIndex.get(id);
        const baseIdx = ring.reduce((best, node, rIdx) => (graph.nodes[node].p.z > graph.nodes[ring[best]].p.z ? rIdx : best), 0);
        // Offset each teacher around the southern half of the island ring so multiple teachers never overlap
        const offset = ((idx + stepIdx) % 3) - 1;
        return ring[(baseIdx + offset + ring.length) % ring.length];
      };
      const tLegs = tOrder.map((id, k) => {
        const nextK = (k + 1) % tOrder.length;
        const next = tOrder[nextK];
        const ids = graph.shortest(tStopNode(id, k), tStopNode(next, nextK));
        const pts = graph.pathPoints(ids);
        const inward = (isl, q) => q.clone().lerp(centers.get(isl).clone().setY(q.y), 0.12);
        pts.unshift(inward(id, pts[0]));
        pts.push(inward(next, pts[pts.length - 1]));
        const lens = [0];
        for (let j = 1; j < pts.length; j++) lens.push(lens[j - 1] + pts[j].distanceTo(pts[j - 1]));
        return { pts, lens, total: lens[lens.length - 1] };
      });
      people.push({
        kind: "faculty",
        role: t.role,
        teacherId: t.id,
        order: tOrder,
        legs: tLegs,
        leg: 0,
        s: 0,
        wait: 2.5 + (idx % 4) * 1.2,
        plan: plan(t.role, null),
        phase: rnd(),
        speed: 0.36 + (idx % 3) * 0.03,
        pose: "wave",
        waiting: true,
      });
    });
  }
  // ---------- easter egg (2026-10-25): the island keeper, present on about 1 visit in 100 (decided by app.js) ----------
  // He strolls between islands in a shuffled order and pauses to wave. Uses Math.random so the seeded city stays identical.
  if (false && opts.islandLord) {
    const ids = [...islandsMap.keys()];
    for (let k = ids.length - 1; k > 0; k--) {
      const j = Math.floor(Math.random() * (k + 1));
      [ids[k], ids[j]] = [ids[j], ids[k]];
    }
    const stop = (id) => graph.ringIndex.get(id)[Math.floor(Math.random() * 12)];
    const stops = ids.map(stop);
    const legs = ids.map((id, k) => {
      const nodes = graph.shortest(stops[k], stops[(k + 1) % ids.length]);
      const pts = graph.pathPoints(nodes);
      if (pts.length < 2) pts.push(pts[0].clone());
      const lens = [0];
      for (let j = 1; j < pts.length; j++) lens.push(lens[j - 1] + pts[j].distanceTo(pts[j - 1]));
      return { pts, lens, total: lens[lens.length - 1] };
    });
    people.push({ kind: "lord", role: "islandlord", order: ids, legs, leg: 0, s: 0, wait: 2, plan: plan("islandlord", null), phase: Math.random(), speed: 0.36, pose: "wave", waiting: true });
  }

  // allocate instanced meshes
  const counts = {};
  for (const w of people) for (const pt of w.plan.parts) counts[pt.g] = (counts[pt.g] || 0) + 1;
  const meshes = {};
  for (const [g, n] of Object.entries(counts)) {
    const m = new THREE.InstancedMesh(G[g], mat, n);
    m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    m.castShadow = false; // 2026-10-25: walkers use their blob shadows (shadowMesh); the shadow map is static (app.js)
    m.frustumCulled = false;
    m.userData = { type: "walker", owners: [] };
    scene.add(m);
    meshes[g] = { mesh: m, n: 0 };
  }
  const shadowMesh = new THREE.InstancedMesh(G.shadow, shadowMat, people.length);
  shadowMesh.frustumCulled = false;
  shadowMesh.renderOrder = 1;
  scene.add(shadowMesh);
  for (const [pi, w] of people.entries())
    for (const pt of w.plan.parts) {
      const slot = meshes[pt.g];
      pt.idx = slot.n++;
      slot.mesh.setColorAt(pt.idx, new THREE.Color(pt.c));
      slot.mesh.userData.owners[pt.idx] = pi;
    }
  for (const s of Object.values(meshes)) s.mesh.instanceColor.needsUpdate = true;

  // ---------- carry badges (sprites) ----------
  const badgeTex = new Map();
  function badge(kind) {
    if (badgeTex.has(kind)) return badgeTex.get(kind);
    const c = document.createElement("canvas");
    c.width = c.height = 128;
    const g = c.getContext("2d");
    g.fillStyle = "#ffffff";
    g.beginPath();
    g.arc(64, 64, 56, 0, Math.PI * 2);
    g.fill();
    g.lineWidth = 8;
    g.strokeStyle = "#db6a41";
    g.stroke();
    g.fillStyle = "#211d1d";
    g.strokeStyle = "#211d1d";
    g.lineWidth = 7;
    g.lineCap = g.lineJoin = "round";
    drawGlyph(g, kind);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    badgeTex.set(kind, t);
    return t;
  }
  const badgeMats = new Map();
  const sprites = [];
  for (const w of people) {
    if (w.kind !== "flow") continue;
    if (!badgeMats.has(w.carry)) badgeMats.set(w.carry, new THREE.SpriteMaterial({ map: badge(w.carry), depthTest: true, transparent: true, alphaTest: 0.35 }));
    const s = new THREE.Sprite(badgeMats.get(w.carry));
    s.scale.set(0.11, 0.11, 0.11);
    scene.add(s);
    w.sprite = s;
    sprites.push(s);
  }

  // ---------- animation ----------
  const dummy = new THREE.Object3D(),
    base = new THREE.Matrix4(),
    local = new THREE.Matrix4(),
    tmp = new THREE.Matrix4(),
    piv = new THREE.Matrix4(),
    unpiv = new THREE.Matrix4(),
    rot = new THREE.Matrix4(),
    scl = new THREE.Matrix4(),
    spinM = new THREE.Matrix4(),
    hide = new THREE.Matrix4().makeScale(0, 0, 0);
  const pivots = { sitL: 0.13, sitR: 0.13, legL: 0.13, legR: 0.13, armL: 0.255, armR: 0.255, head: 0.27, pedalL: 0.225, pedalR: 0.225, rideL: 0.35, rideR: 0.35 };
  let filter = null,
    showBadges = true,
    badgeFocus = null;
  const state = { positions: [] };
  for (const w of people) if (w.kind === "flow") w.s = w.phase * w.route.total;

  function update(dt, time, motion, zoom = 1) {
    const nowPerf = typeof performance !== "undefined" ? performance.now() : 0;
    for (const [pi, w] of people.entries()) {
      let p,
        dir,
        moving = 0,
        visible = true;
      const chatting = !!(w.chatLookAt && nowPerf < w.chatLookAt.until);
      if (w.chatLookAt && !chatting) w.chatLookAt = null;
      if (w.kind === "flow") {
        visible = !filter || filter.has(w.flow);
        if (motion && !chatting) {
          w.wait = (w.wait || 0) - dt;
          if (w.wait <= 0) {
            w.s += w.dirSign * w.speed * dt * (w.bellUntil > nowPerf ? w.bellMul : 1);
            if (w.s >= w.route.total) {
              w.s = w.route.total;
              w.dirSign = -1;
              w.wait = 1.4;
            } else if (w.s <= 0) {
              w.s = 0;
              w.dirSign = 1;
              w.wait = 1.4;
            }
          }
        }
        const smp = sample(w.route, w.s);
        p = smp.p;
        if (chatting) {
          dir = new THREE.Vector3(w.chatLookAt.x - p.x, 0, w.chatLookAt.z - p.z);
          if (dir.lengthSq() < 1e-6) dir.set(0, 0, 1);
          // a bell glance: look up at the tower; only the 下課 bell gets a wave
          w.pose = w.chatLookAt.bell === "start" ? null : "wave";
          moving = 0;
        } else {
          dir = smp.dir.multiplyScalar(w.dirSign);
          w.pose = null;
          moving = motion && w.wait <= 0 ? 1 : 0;
        }
      } else if (w.kind === "puma" || w.kind === "faculty" || w.kind === "lord") {
        if (motion && !chatting) {
          if (w.wait > 0) w.wait -= dt;
          else {
            w.s += w.speed * dt * (w.bellUntil > nowPerf ? w.bellMul : 1);
            const L = w.legs[w.leg];
            if (w.s >= L.total) {
              w.leg = (w.leg + 1) % w.legs.length;
              w.s = 0;
              w.wait = w.kind === "puma" ? 6 : w.kind === "faculty" ? 5.5 : 4.5;
            }
          }
        }
        w.waiting = w.wait > 0;
        w.pose = (w.waiting || chatting) && w.chatLookAt?.bell !== "start" ? "wave" : null;
        w.atIsland = w.order[w.leg];
        const smp = sample(w.legs[w.leg], w.s);
        p = smp.p;
        if (chatting) {
          dir = new THREE.Vector3(w.chatLookAt.x - p.x, 0, w.chatLookAt.z - p.z);
          if (dir.lengthSq() < 1e-6) dir.set(0, 0, 1);
        } else {
          // while stopped, face the camera-side (south) so the wave reads
          dir = w.waiting ? new THREE.Vector3(0, 0, 1) : smp.dir;
        }
        moving = motion && !w.waiting && !chatting ? 1 : 0;
      } else {
        const sk = w.pose === "skate";
        const tt = (motion ? time : 0) * (sk ? 0.85 : 0.4) + w.phase * 6;
        const wob = w.wander ? Math.sin(tt) * w.wander : 0;
        p = new THREE.Vector3(w.pos[0] + wob, w.pos[1] ? w.pos[1] : top + 0.03, w.pos[2]);
        // a skater rolls back and forth along x and turns at each end
        dir = sk ? new THREE.Vector3(Math.cos(tt) >= 0 ? 1 : -1, 0, 0.0001) : new THREE.Vector3(Math.sin(w.yaw), 0, Math.cos(w.yaw));
        moving = !sk && w.wander && motion ? 0.5 : 0;
      }
      const yaw = Math.atan2(dir.x, dir.z);
      const ph = (time * 9 + w.phase * 20) * moving;
      const bob = moving ? Math.abs(Math.sin(ph)) * 0.012 : 0;
      const sc = w.plan.scale * 0.8 * zoom;
      w.drawScale = sc;
      const lift = (w.kind === "puma" || w.kind === "faculty") && w.waiting ? 0.07 * sc : 0;
      w._px = p.x;
      w._pz = p.z;
      dummy.position.set(p.x, p.y + bob + lift - (w.pose === "sit" ? 0.105 * sc : 0), p.z);
      dummy.rotation.set(0, yaw, 0);
      dummy.scale.setScalar(visible ? sc : 0);
      dummy.updateMatrix();
      base.copy(dummy.matrix);
      w.world = p;
      for (const pt of w.plan.parts) {
        let ang = 0,
          axis = "x";
        if (moving) {
          if (pt.ch === "legL") ang = Math.sin(ph) * 0.55;
          if (pt.ch === "legR") ang = -Math.sin(ph) * 0.55;
          if (pt.ch === "armL") ang = -Math.sin(ph) * 0.45;
          if (pt.ch === "armR") ang = Math.sin(ph) * 0.45;
        }
        if (pt.ch === "head") ang = Math.sin(time * 1.3 + w.phase * 9) * 0.06;
        if (w.pose === "sit" && (pt.ch === "legL" || pt.ch === "legR")) ang = -1.5;
        if (pt.ch === "sitL" || pt.ch === "sitR") ang = -1.2; // wheelchair: thighs forward, feet on the footrest
        if ((w.pose === "read" || w.pose === "boxes") && (pt.ch === "armL" || pt.ch === "armR")) ang = -0.95;
        if (w.pose === "skate" && (pt.ch === "armL" || pt.ch === "armR")) {
          axis = "z";
          ang = pt.ch === "armR" ? 0.75 : -0.75;
        }
        if (w.pose === "wave" && pt.ch === "armR") {
          axis = "z";
          ang = 2.5 + Math.sin(time * 5 + w.phase * 9) * 0.35;
        }
        // cyclists: thighs forward over the pedals, alternating pedal stroke; arms reach the bars
        const pedal = time * 7 + w.phase * 20;
        if (pt.ch === "pedalL") ang = -1.0 + (moving ? Math.sin(pedal) * 0.42 : 0.2);
        if (pt.ch === "pedalR") ang = -1.0 - (moving ? Math.sin(pedal) * 0.42 : 0.2);
        if (pt.ch === "rideL" || pt.ch === "rideR") ang = -1.05;
        // a part's own offset/rotation/scale never changes: compose it once, then copy (was 4 allocations per part per frame)
        if (!pt.L0) pt.L0 = new THREE.Matrix4().compose(new THREE.Vector3(...pt.off), pt.r ? new THREE.Quaternion().setFromEuler(new THREE.Euler(...pt.r)) : new THREE.Quaternion(), new THREE.Vector3(...pt.s));
        local.copy(pt.L0);
        if (pt.ch === "wheelX") local.multiply(rot.makeRotationY(Math.PI / 2));
        if (pt.ch === "spoke" || pt.ch === "crankL" || pt.ch === "crankR") {
          // spin about the axle (x axis) at the part's own centre
          const spin = (moving ? time * (pt.ch === "spoke" ? 14 : 7) : 0) + w.phase * 20 + (pt.ch === "crankL" ? Math.PI : 0);
          const cx = pt.ch === "spoke" ? pt.off[0] : 0, cy = pt.off[1], cz = pt.off[2];
          tmp.makeTranslation(cx, cy, cz).multiply(rot.makeRotationX(spin)).multiply(spinM.makeTranslation(-cx, -cy, -cz));
          if (pt.ch !== "spoke") tmp.multiply(spinM.makeTranslation(0, 0, 0.03));
          local.premultiply(tmp);
        }
        if (ang && pivots[pt.ch] !== undefined) {
          const py = pivots[pt.ch];
          // sideways (z-axis) swings pivot at the shoulder itself, not the body's centre line — otherwise a raised
          // arm swung through the torso and vanished (waving faculty navigator)
          const px = axis === "z" && (pt.ch === "armL" || pt.ch === "armR") ? (pt.ch === "armL" ? -0.077 : 0.077) : 0;
          piv.makeTranslation(px, py, 0);
          unpiv.makeTranslation(-px, -py, 0);
          if (axis === "z") rot.makeRotationZ(ang);
          else rot.makeRotationX(ang);
          tmp.multiplyMatrices(piv, rot).multiply(unpiv).multiply(local);
          local.copy(tmp);
        }
        if (pt.ch === "soap") {
          if (!w.waiting) local.makeScale(0, 0, 0);
          else local.premultiply(rot.makeTranslation(0, -0.07, 0)); // the box stays on the ground while he stands on it
        }
        tmp.multiplyMatrices(base, local);
        meshes[pt.g].mesh.setMatrixAt(pt.idx, tmp);
      }
      dummy.position.set(p.x, p.y + 0.02, p.z);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.setScalar(visible ? 0.2 * sc : 0);
      dummy.updateMatrix();
      shadowMesh.setMatrixAt(pi, dummy.matrix);
      if (w.sprite) {
        w.sprite.visible = visible && showBadges && (w.interactive || !!filter || (!!badgeFocus && (w.from === badgeFocus || w.to === badgeFocus)));
        w.sprite.position.set(p.x, p.y + 0.6 * sc + 0.03 + bob, p.z);
      }
    }
    for (const s of Object.values(meshes)) s.mesh.instanceMatrix.needsUpdate = true;
    shadowMesh.instanceMatrix.needsUpdate = true;
  }
  return {
    people,
    meshes: Object.values(meshes).map((s) => s.mesh),
    update,
    setFilter(set) {
      filter = set && set.size ? set : null;
    },
    setBadges(v, focus = null) {
      showBadges = v;
      badgeFocus = focus;
    },
    personFromHit(mesh, instanceId) {
      const pi = mesh.userData.owners?.[instanceId];
      return pi === undefined ? null : pi;
    },
    // 鐘聲反應 (clock-tower.js "htl:clocktower"): walkers within `radius` of the tower stop and look up at it for
    // 2.5 s; after a 上課 bell they hurry for 20 s, after a 下課 bell they wave and stroll. Returns up to `max` of the
    // nearest walkers (for speech bubbles). Reduced motion: the glance only.
    bellReact(kind, x, z, { radius = 12, max = 6, reduced = false } = {}) {
      const now = typeof performance !== "undefined" ? performance.now() : 0;
      const near = [];
      for (const w of people) {
        if (w._px == null || !(w.kind === "flow" || w.kind === "puma" || w.kind === "faculty" || w.kind === "lord")) continue;
        const d = Math.hypot(w._px - x, w._pz - z);
        if (d > radius) continue;
        const k = kind === "start" ? "start" : "end";
        w.chatLookAt = { x, z, until: now + 1800 + Math.random() * 1400, bell: k };
        if (!reduced) {
          w.bellUntil = now + 20000;
          w.bellMul = k === "start" ? 1.6 : 0.8;
        }
        near.push([d, w]);
      }
      return near
        .sort((a, b) => a[0] - b[0])
        .slice(0, max)
        .map(([, w]) => w);
    },
    routeIslands: () => people.filter((w) => w.kind === "flow").map((w) => ({ flow: w.flow, islands: [...w.route.islands] })),
    sample: (w, u) => sample(w.route, u * w.route.total),
  };
}

function drawGlyph(g, kind) {
  const L = (pts) => {
    g.beginPath();
    pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
    g.stroke();
  };
  const R = (x, y, w, h, fill = false) => {
    g.beginPath();
    g.roundRect(x, y, w, h, 6);
    fill ? g.fill() : g.stroke();
  };
  const C = (x, y, r, fill = false) => {
    g.beginPath();
    g.arc(x, y, r, 0, Math.PI * 2);
    fill ? g.fill() : g.stroke();
  };
  switch (kind) {
    case "bed":
      R(30, 62, 68, 20);
      L([[30, 50], [30, 92]]);
      L([[98, 70], [98, 92]]);
      R(36, 54, 18, 10, true);
      break;
    case "crosswalk":
      for (let i = 0; i < 4; i++) R(34 + i * 16, 36, 8, 56, true);
      break;
    case "energy":
      g.beginPath();
      g.moveTo(70, 26);
      g.lineTo(42, 70);
      g.lineTo(62, 70);
      g.lineTo(54, 102);
      g.lineTo(88, 54);
      g.lineTo(66, 54);
      g.closePath();
      g.fill();
      break;
    case "clock":
      C(64, 64, 32);
      L([[64, 64], [64, 44]]);
      L([[64, 64], [80, 72]]);
      break;
    case "blueprint":
      R(34, 40, 60, 48);
      L([[46, 52], [82, 52]]);
      L([[46, 64], [70, 64]]);
      L([[46, 76], [78, 76]]);
      break;
    case "folder":
      R(32, 44, 64, 46);
      L([[32, 52], [56, 52], [62, 44]]);
      break;
    case "globe":
      C(64, 64, 32);
      L([[32, 64], [96, 64]]);
      g.beginPath();
      g.ellipse(64, 64, 14, 32, 0, 0, Math.PI * 2);
      g.stroke();
      break;
    case "schoolbag":
      R(40, 46, 48, 50);
      L([[52, 46], [52, 36], [76, 36], [76, 46]]);
      L([[40, 66], [88, 66]]);
      break;
    case "towel":
      R(38, 34, 52, 60);
      L([[38, 80], [90, 80]]);
      break;
    case "dumbbell":
      L([[40, 64], [88, 64]]);
      R(30, 48, 12, 32, true);
      R(86, 48, 12, 32, true);
      break;
    case "cards":
      R(30, 44, 44, 32);
      R(54, 56, 44, 32);
      break;
    case "book-heart":
      R(34, 40, 30, 52);
      R(64, 40, 30, 52);
      g.fillStyle = "#db6a41";
      g.beginPath();
      g.arc(58, 30, 9, Math.PI, 0);
      g.arc(76, 30, 9, Math.PI, 0);
      g.lineTo(67, 46);
      g.closePath();
      g.fill();
      break;
    case "counseling":
      R(30, 36, 50, 34);
      R(52, 62, 46, 30);
      break;
    case "chip":
      R(42, 42, 44, 44);
      for (let i = 0; i < 3; i++) {
        L([[50 + i * 14, 32], [50 + i * 14, 42]]);
        L([[50 + i * 14, 86], [50 + i * 14, 96]]);
      }
      break;
    case "sapling":
      L([[64, 98], [64, 56]]);
      g.beginPath();
      g.ellipse(52, 50, 14, 8, -0.6, 0, Math.PI * 2);
      g.fill();
      g.beginPath();
      g.ellipse(76, 44, 14, 8, 0.6, 0, Math.PI * 2);
      g.fill();
      break;
    case "basket":
      L([[32, 60], [96, 60], [86, 96], [42, 96], [32, 60]]);
      g.beginPath();
      g.arc(64, 60, 24, Math.PI, 0);
      g.stroke();
      break;
    case "droplet":
      g.beginPath();
      g.moveTo(64, 26);
      g.bezierCurveTo(84, 54, 90, 66, 90, 76);
      g.arc(64, 76, 26, 0, Math.PI);
      g.bezierCurveTo(38, 66, 44, 54, 64, 26);
      g.stroke();
      break;
    case "passport":
      R(42, 30, 44, 68);
      C(64, 58, 12);
      L([[52, 84], [76, 84]]);
      break;
    default:
      C(64, 64, 20, true);
  }
}

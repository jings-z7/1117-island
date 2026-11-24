import { extraModel } from "./models-extra.js?v=20261115-01";
// Symbolic policy miniatures. These are not proposed building designs or locations.
// Explicit IDs prevent array ordering from silently changing a policy's visual meaning.
export const sceneSpecs = {
  "civil-office": ["cityhall", "雙翼系務辦公樓、玻璃帷幕與屋頂花園"],
  "civil-flex": ["clocktower", "彈性上下班鐘塔"],
  "civil-eap": ["kiosk", "EAP 點數自選亭"],
  "civil-award": ["podium", "廣場專案獎勵頒獎台"],
  "civil-health": ["clinicpod", "健檢小診間"],
  "civil-ai": ["aipod", "AI 支援小隊工作艙"],
  "institute-child": ["childcenter", "盾牌標誌的中心：教育、社政、警政三條資料管線匯入中控螢幕，門口有牽手過馬路的孩子"],
  "institute-access": ["rampcenter", "無障礙坡道、輪椅使用者與城市設計藍圖"],
  "institute-dementia": ["loopgarden", "暖光小屋、環狀花園步道、長者與陪伴者、彩色定向柱"],
  "institute-research": ["researchdome", "玻璃圓頂研究館、模型沙盤與圍桌研究員"],
  "renewal-scaffold": ["renewal", "施工鷹架與塔吊"],
  "transport-school": ["curriculumFourTowers", "四年三明治課程進階塔：大一基礎、大二群賢會館、大三星級酒店實習、大四高階管理四座漸高建築"],
  "transport-bus": ["hotelTourShuttle", "星級酒店企業參訪專車與奢華飯店迎賓大廳：高餐參訪巴士停靠五星級玻璃帷幕酒店金銅雨棚"],
  "transport-bridge": ["sandwichArchBridge", "三明治教學法黃金雙塔橋：連結高餐校園教學樓與國際五星級觀光大飯店之雙向實務拱橋"],
  "transport-maintain": ["mentorVisitTower", "全國星級酒店實習訪視與海外實習連線中心：五星級飯店大廳訪視圓桌與全球連線光球"],
  "transport-bike": ["campusPracticeHub", "校內實習三大星級實務館：客務禮賓中心、星級客房示範樓與精緻餐飲宴會館"],
  "transport-scooter": ["hotelCareerPlaza", "實習接軌就業星級飯店廣場：合作國際連鎖酒店旗艦大樓與儲備幹部直通紅毯"],
  "transport-hub": ["internHotelSkyline", "大三全學年校外實習合作五星級酒店群：國際連鎖酒店雙子星摩天塔與迎賓大廳"],
  "education-class": ["classroom", "小班座位與教學黑板"],
  "education-teachers": ["teachers", "雙教師講桌與學生座位"],
  "education-admin": ["admin", "精簡行政：文件櫃與減量文件"],
  "education-mediation": ["meeting", "親師第三方圓桌"],
  "education-eap": ["counsel", "教師諮商雙座空間"],
  "education-preschool": ["nursery", "幼兒活動室與園長辦公桌"],
  "education-special": ["access", "無障礙學習坡道"],
  "education-prevention": ["safe", "校園安全守護站"],
  "education-ai": ["computer", "AI 教學螢幕"],
  "education-usr": ["campus", "大學與社區合作廣場"],
  "lunch-law": ["lawbook", "攤開的專法書冊與餐盤"],
  "lunch-farm": ["procurementLab", "餐旅採購與冷鏈驗收實驗室：不鏽鋼倉儲架、數位磅秤、生鮮驗收檯與品管螢幕"],
  "lunch-literacy": ["fineDiningClass", "西餐與宴會細緻服務示範廳：星級白桌巾西餐桌、銀製餐蓋、桌邊服務推車與侍酒服務"],
  "lunch-price": ["sommelierCellar", "葡萄酒品評與侍酒師酒窖：法國橡木桶、背光恆溫酒牆、水晶醒酒器與高腳品酒桌"],
  "lunch-subsidy": ["beverageCertBar", "調酒與咖啡拉花專業證照吧台：大理石吧台、雙孔義式咖啡機、背光酒牆與雪克杯"],
  "family-station": ["qunxianHotel", "群賢會館實習旅館大樓：歐式古典石材基座、五層玻璃客房樓、金銅迎賓雨棚、旋轉門與黃銅鳥籠行李推車"],
  "family-hotline": ["conciergeDesk", "客務管理與禮賓服務檯：大理石禮賓櫃台、金鑰匙徽章、雙PMS入住終端機與服務鈴"],
  "family-manager": ["hotelAdminCenter", "群賢會館營運中樞：住房率與收益管理儀表板牆、實習幹部圓桌與會館模型"],
  "family-courses": ["classroom", "親子課程教室"],
  "family-respite": ["housekeepingSuite", "房務實務示範套房：星級雙床鋪設、香檳金床尾巾、床頭閱讀燈與專業房務布巾推車"],
  "family-counsel": ["trainingRotation", "群賢會館四大部門環狀輪調實務工作站與金色循環光環"],
  "family-home": ["banquetVenue", "群賢廳國際宴會與會議廳：水晶吊燈、勃根地紅圓桌宴席與致詞講台"],
  "family-night": ["nightcare", "夜間托育床與月亮標誌"],
  "card-culture": ["culturecoin", "印著戲劇面具的金色文化幣，四周是它能使用的地方：小劇場、畫展畫架、獨立書店書攤、兒童電影銀幕"],
  "card-sport": ["court", "運動球場與點數標誌"],
  "card-reading": ["books", "分齡書冊與閱讀禮袋"],
  "card-learning": ["classroom", "家庭共同學習桌"],
  "card-shops": ["shop", "認證小店的條紋雨棚"],
  "card-elders": ["generations", "高低座椅與祖孫閱讀桌"],
  "welfare-elder": ["chairSuite", "謝文欽主任研究室（旅館服務業管理、旅館行銷管理、賭場管理）"],
  "welfare-respite": ["profLibrary", "楊仁德教授研究室（知識經濟與管理、組織行為、策略管理）"],
  "welfare-home": ["execStudio", "沙荃老師研究室（旅館管理、人力資源、組織行為）"],
  "welfare-hourly": ["etiquetteSalon", "謝家黎老師研究室（人力資源管理、客務實務、國際禮儀）"],
  "welfare-care": ["digitalLab", "黃啟揚老師研究室（旅館資訊管理、旅館行銷管理、餐廳管理）"],
  "welfare-shingles": ["financeCenter", "游明鳳老師研究室（旅館採購、旅館財務管理）"],
  "welfare-counsel": ["internHub", "謝金龍老師研究室（旅館客務管理、旅館行銷管理）"],
  "welfare-work": ["strategyLab", "許孟鈞老師研究室（雲端科技應用、資訊管理、數位行銷）"],
  "welfare-vaccine": ["clubSuite", "張慧貞老師研究室（旅館會計學、旅館財務管理、會議管理）"],
  "welfare-child": ["sommelierPavilion", "盧小琴老師研究室（food and beverage management、consumer behaviours）"],
  "welfare-power": ["power", "備援電池與供電設備"],
  "welfare-stairlift": ["stairlift", "樓梯爬梯機與輪椅"],
  "welfare-safety": ["lighting", "安全步道與照明檢視站"],
  "welfare-single": ["phone", "支持專線電話亭"],
  "sport-h01": ["overseasLuxuryCluster", "國外／海外實習與研修（新加坡、日本、澳洲、美加；城市天際線・日本鳥居溫泉旅館・水上屋與跨國金航線）"],
  "sport-h02": ["htlMandarin", "臺北文華東方酒店：歐式新古典米白石材立面、板岩孟莎斜頂與香檳金圓頂冠冕"],
  "sport-h03": ["htlWTaipei", "台北W飯店：時尚銀灰玻璃帷幕大樓、珊瑚紅 W 頂樓標誌與 WET 碧波泳池露台"],
  "sport-h04": ["htlCapella", "臺北嘉佩樂酒店：溫潤萊姆石拱廊立面、古銅格柵冠頂與空中花園露台"],
  "sport-h05": ["htlGrandHyatt", "台北君悅酒店：氣派暖砂花崗岩地標大樓、古銅斜頂與迎賓圓形噴泉廣場"],
  "sport-h06": ["htlShangriLaTpe", "台北遠東香格里拉：後現代香檳花崗岩大樓與標誌性雙金尖塔冠冕"],
  "sport-h07": ["htlSheratonTpe", "台北喜來登大飯店：經典星級商務大飯店、水平石材遮陽飾帶與金銅冠頂"],
  "sport-h08": ["htlMeridienTpe", "台北寒舍艾美酒店：珍珠白與冰藍玻璃帷幕立面、當代藝術迎賓雕塑"],
  "sport-h09": ["htlHilaiTpe", "台北漢來大飯店：現代銀白玻璃帷幕結合香檳金格柵立面與無邊際泳池露台"],
  "sport-h10": ["htlSheratonHsz", "新竹豐邑喜來登大飯店：對稱雙子星現代玻璃帷幕大樓與高空光雕連通廊橋"],
  "sport-h11": ["htlICNewTaipei", "新北北海溫泉洲際酒店：金山依山傍海木石星級渡假本館與海景無邊際溫泉池"],
  "sport-h12": ["htlRoyalJiaoxi", "礁溪老爺酒店：日式禪風暖木斜頂星級溫泉本館與露天石砌風呂湯池"],
  "sport-h13": ["htlMuJiaoxi", "礁溪寒沐酒店：當代灰白石材結合原木幾何格柵陽台星級溫泉大樓"],
  "sport-h14": ["htlICTaichung", "臺中勤美洲際酒店：草悟道垂直綠意奢華大樓、層疊植栽露台與香檳金冠頂"],
  "sport-h15": ["htlMeridienTxg", "台中李芳艾美酒店：冰藍玻璃帷幕地標大樓與金色圓筒光冠圓頂"],
  "sport-h16": ["htlFleurDeChine", "雲品溫泉酒店：日月潭湖畔木紋格柵星級本館、湖景水鏡露台與金蓮冠頂"],
  "sport-h17": ["htlHoshinoya", "虹夕諾雅 谷關：檜木縱格柵山林奢華溫泉樓閣、切妻斜頂與水之庭園"],
  "sport-h18": ["htlWindsor", "裕元花園酒店：對稱雙子星寶藍玻璃帷幕大樓與高空景觀連通廊橋"],
  "sport-h19": ["htlMoxy", "台中豐邑MOXY酒店：潮流炭黑工業風精品大樓、桃紅霓虹窗光與頂樓酒吧燈牌"],
  "sport-h20": ["htlShangriLaTnn", "台南遠東香格里拉：圓柱摩天星級大樓、360 度環景光帶窗與皇冠金環頂"],
  "sport-h21": ["htlCrownePlaza", "台南大員皇冠假日酒店：安平魚簍斜交格柵立面與皇冠紫紅冠頂星級大樓"],
  "sport-h22": ["htlAmnis", "然一酒店 The AMNIS：黑金水岸奢華藝術大樓與鏡面迎賓水池"],
  "sport-h23": ["htlHilaiKhh", "高雄漢來大飯店：新古典象牙白石材地標大樓與金色宮廷斜頂皇冠"],
  "sport-h24": ["htlIndigoKhh", "高雄中央公園英迪格酒店：海港貨櫃繽紛陽台飾帶設計精品大樓與高空酒吧"],
  "sport-h25": ["htlGrandCosmos", "瑞穗天合國際觀光酒店：歐風莊園城堡星級主樓、松石綠尖塔鐘樓與黃金湯池"],
  "trails-north": ["marriottBrandCluster", "國際品牌企業學苑共育中心：萬豪、洲際、國際奢華與本土星級四大企業學苑殿堂"],
  "trails-east": ["chainHotelExpo", "雙軌選才與中英文面試媒合博覽館：一般生與菁英生雙軌媒合四塔環拱與紅毯面試舞台"],
  "trails-history": ["rotationHub", "客房部培訓與第七個月起部門輪調塔：四層部門輪調透明培訓塔與職場導師（Mentor）金階"],
  "trails-diverse": ["eliteEvalCenter", "實習薪酬保障與滿半年考核調薪中心：薪酬保障金盾、滿半年考核評鑑殿堂與退場輔導圓桌"],
  "trails-card": ["brandStarPavilion", "校外實習輔導小組與雙導師訪視殿堂：五星級實習品質把關榮耀星環與三明治雙導師圓桌"],
  "forest-law": ["law", "樹木與法規冊"],
  "forest-committee": ["forestmeeting", "樹下治理圓桌"],
  "forest-fund": ["forestfund", "樹木維運與基金堆疊"],
  "forest-parks": ["garden", "口袋公園與環狀步道"],
  "forest-twin": ["twin", "實體路樹與數位螢幕"],
  "forest-cool": ["cool", "樹蔭與涼感地圖"],
  "forest-consult": ["forestmeeting", "樹木移除前協作圓桌"],
  "forest-wood": ["wood", "回收原木與再利用木料架"],
  "youth-fund": ["jars", "兩個存錢罐（不示金額）"],
  "youth-ai": ["containers", "貨櫃共享工作空間與 AI 筆電吧台"],
  "youth-dream": ["stage", "露天圓夢舞台與紙飛機發射坡"],
  "diplomacy-forum": ["infinityforum", "∞ 形步道交會處的論壇圓桌"],
  "diplomacy-exchange": ["overseasInternResort", "海外五星級海濱渡假村酒店塔、無邊際泳池與國際出發航廈"],
  "diplomacy-hoboken": ["globalHotelStudy", "海外國際連鎖五星級宮殿酒店與現代玻璃摩天酒店參訪建築群"],
  "diplomacy-talent": ["vietnamGlobalHotel", "海外視野與越南生專班：海濱渡假酒店與國際航廈"],
  "hakka-elders": ["bogongcare", "伙房式照護站：禾埕、藍布門簾，長輩與孩子同桌"],
  "hakka-schools": ["sisterschools", "城市學校與客庄學校，中間是互訪小巴"],
  "hakka-points": ["hakkapoints", "藍布遮陽的友善店家、集點螢幕與代幣"],
  "hakka-hiring": ["hiringdesk", "服務櫃台、耳機櫃員與加分星章"],
  "hakka-forum": ["hakkaforum", "油桐花棚下的圓桌論壇與小地球"],
  "hakka-taigi-unit": ["taigiunit", "屋頂有大對話框的專責單位辦公樓"],
  "hakka-taigi-service": ["taigiservice", "兩個服務窗口、叫號板與候位長椅，櫃台上方有對話框"],
  "hakka-taigi-school": ["taigiclass", "黑板、老師與課桌前的學童，老師頭上有對話框"],
  "water-active": ["fBuildingHq", "高餐大第一教學大樓（F棟）旅館系核心總部：藍瓦斜頂、白牆拱窗與1樓系辦迎賓門廊"],
  "water-culture": ["smartServiceCenter", "高餐大智能服務中心：現代玻璃帷幕智慧星級酒店示範大廳与AI自助入住機台"],
  "water-clean": ["pmsLabSuite", "旅館資訊管理專業教室：OPERA PMS 環形實作電腦教室與飯店房態中控大螢幕"],
  "water-detention": ["hotelTechStudio", "旅館專業技術教室與授課教室：星級客房實務示範區與禮賓講堂"],
  "water-eco": ["secondPracLounge", "專業教室管理與第二實習教室：五星級酒店行政酒廊 Executive Lounge 實境吧台與沙龍"],
  "ai-cluster": ["pmsHotelCluster", "旅館資訊管理系統（OPERA／德安PMS）：三棟連線國際連鎖五星級酒店大樓與雲端訂房中樞"],
  "ai-youth": ["aiplatform", "大螢幕上的多個模型圖塊，學生在方塊座椅上用筆電"],
  "ai-midlife": ["smartHotelRobotHub", "餐旅人工智慧、機器人與大數據：五星級智慧酒店AI迎賓送物機器人與收益管理大廳"],
  "ai-institute": ["aiinstitute", "圓形研究館與四色研究側翼"],
  "ai-civic": ["aicivic", "區公所辦公樓、屋頂循環箭頭，三位拿平板的支援團隊"],
  "renewal-loop": ["industryAcademy", "高餐大產業學院總部與星級酒店雙向黃金拱橋"],
  "renewal-review": ["hospitalityCareerTower", "培育具專業服務技能與經營管理能力之人才：國際連鎖五星級酒店經營管理實務總部"],
  "renewal-zombie": ["careerTriad", "三合一策略：業界互動、校外實習與畢業就業三座階梯台"],
  "housing-old": ["mtFastTrackPlaza", "國際品牌儲備幹部（MT）直通車廣場：雙翼全球總部大樓、三階晉升紅毯金台與月薪4萬+榮耀拱門"],
  "housing-social": ["alumniGradAcademy", "國內外研究所升學與系友兼任授課殿堂：歐式學術圓頂殿堂、系友傳承高塔與黃金傳承天橋"],
  "luxury-micro": ["luxuryMicroSalon", "奢華體驗管理微學分八大主題沙龍：香檳金玻璃穹頂、侍酒調飲與五感美學實作吧台"],
  "luxury-butler": ["goldKeyButlerPavilion", "Gold Touch 金鑰匙管家款待殿堂：雙金鑰匙交叉徽章門樓、紅毯禮賓車道與英式下午茶管家推車"],
  "luxury-mystery": ["mysteryGuestAuditCenter", "實習旅館神秘客服務品質檢核中心：星級檢核放大鏡地標、群賢會館微縮套房與 MOT 評分儀表板"],
  "luxury-academy": ["luxuryCorporateAcademy", "國際奢華酒店企業學苑雙子塔：文華東方古典冠頂、嘉佩樂現代拱廊與儲備幹部金階大道"],
  "innovation-base": ["d808SmartBase", "D棟8樓餐旅數位智慧服務與創新基地：科技玻璃旗艦館、服務型機器人與智慧設備展示牆"],
  "innovation-robot": ["aiotSmartSuite", "AIoT 智慧客房與人機協作示範中心：智慧聲控示範套房、迎賓導引機器人與智慧送物機器人車隊"],
  "innovation-alliance": ["smartTechAllianceHub", "國際奢華旅館智能科技服務共創聯盟：產官學研四環共創星環圓頂館與雲端數據光塔"],
  "innovation-dualcert": ["operaAiCertArena", "OPERA PMS 系列研習與 AI 雙軌認證中心：環形 PMS 操作席、AI-900 與 AWS AI 認證金牌與營運曲線"],
  "esg-iso": ["isoNetZeroPavilion", "智慧餐旅永續營運治理館（ISO 14064・14067・50001）：垂直森林綠建築星級飯店、太陽能斜頂與碳盤查儀表板"],
  "esg-research": ["topScientistResearchTower", "教師學術研發與國科會計畫塔：研究計畫金冠地球儀、國科會計畫與期刊典藏牆與研究觀測塔"],
  "esg-industry": ["starHotelThinkTank", "星級旅館評鑑制度革新研究與教師專業服務中心：五顆金星評鑑拱門、研究圓桌與研習講堂"],
  "esg-usr": ["usrElementaryGarden", "USR 國小陪伴服務與永續旅宿觀摩廣場：國小陪伴小學堂、彩虹故事亭與永續觀摩參訪巴士"],
};

export function createPolicyModel({ part, top, colors, tree, house, scaffold }) {
  return function build(id, x, z, scale = 0.78, opts = {}) {
    const spec = sceneSpecs[id];
    if (!spec) throw new Error(`Missing policy scene: ${id}`);
    const [kind] = spec,
      C = colors,
      glass = 0x86a8a6,
      wood = 0xb48560,
      green = C.green;
    // A common exhibition scale keeps dense policy tiles legible.

    const p = (g, a, s, c, r) =>
      part(
        g,
        [x + a[0] * scale, top + a[1] * scale, z + a[2] * scale],
        s.map((v) => v * scale),
        c,
        id,
        r,
      );
    const b = (a, s, c = C.cream, r) => p(s[0] * scale > 0.05 && s[1] * scale > 0.05 && s[2] * scale > 0.05 ? "rbox" : "box", a, s, c, r);
    const hb = (a, s, c, r) => p("box", a, s, c, r);
    const glow = (a, s, c) => p("glowbox", a, s, c);
    const bulb = (a, sz, c = 0xfff0c2) => p("glowsphere", a, [sz, sz, sz], c);
    const cy = (a, w, h, c) => p("cylinder", a, [w, h, w], c);
    const sphere = (a, s, c) => p("sphere", a, Array.isArray(s) ? s : [s, s, s], c);
    const ring = (a, s, c, r = [Math.PI / 2, 0, 0]) => p("torus", a, [s, s, s], c, r);
    const person = (xx, zz, h = 0.38) => {
      // HTL department dress (2026-11-13): navy / charcoal practicum blazer, white uniform shirt, navy dept tee,
      // grey hoodie — restrained palette instead of bright T-shirts
      const o = Math.abs(Math.round((xx * 7 + zz * 13) * 10)) % 5;
      const shirt = [0x1b2540, 0x2b2e35, 0xfafbfd, 0x26324d, 0x9a9ea6][o];
      const pants = [0x1b2540, 0x2b2e35, 0x1b2540, 0xb9a27e, 0x26324d][o];
      for (const d of [-0.025, 0.025]) p("box", [xx + d, h * 0.16, zz], [0.035, h * 0.32, 0.04], pants);
      p("rbox", [xx, h * 0.5, zz], [0.11, h * 0.38, 0.08], shirt);
      p("sphere", [xx, h * 0.84, zz], [0.12, 0.12, 0.12], [0xf1c7a3, 0xe0ac85, 0xc68863][Math.abs(Math.round(xx * 100)) % 3]);
      // hair shell clearly larger than the head (a near-equal shell let the scalp show through as bald patches)
      const k = Math.abs(Math.round((xx * 31 + zz * 17) * 10));
      const hc = [0x3b2f2a, 0x1f1d22, 0x5a3d2b, 0x2e2522][k % 4];
      p("dome", [xx, h * 0.84 + 0.004, zz - 0.006], [0.134, 0.13, 0.134], hc);
      const st = k % 3;
      if (st === 1) p("sphere", [xx, h * 0.84 + 0.05, zz - 0.04], [0.05, 0.05, 0.05], hc); // bun
      if (st === 2) p("rbox", [xx, h * 0.8, zz - 0.045], [0.11, 0.08, 0.035], hc); // shoulder-length
    };
    const seat = (xx, zz) => {
      b([xx, 0.14, zz], [0.18, 0.06, 0.19], C.coral);
      b([xx, 0.25, zz - 0.08], [0.18, 0.2, 0.04], C.coral);
      for (const d of [-0.06, 0.06]) b([xx + d, 0.06, zz], [0.02, 0.12, 0.12], C.ink);
    };
    const desk = (xx = 0, zz = 0) => {
      b([xx, 0.28, zz], [0.38, 0.04, 0.24], wood);
      for (const d of [-0.14, 0.14]) b([xx + d, 0.14, zz], [0.025, 0.28, 0.18], C.cream);
    };
    const screen = (xx = 0, zz = 0) => {
      b([xx, 0.47, zz], [0.29, 0.23, 0.045], C.ink);
      b([xx, 0.47, zz + 0.025], [0.25, 0.18, 0.008], glass);
      b([xx, 0.33, zz], [0.025, 0.1, 0.025], C.ink);
      for (let j = 0; j < 3; j++) b([xx - 0.055 + j * 0.055, 0.45, zz + 0.032], [0.028, 0.035 + j * 0.035, 0.008], C.yellow);
    };
    const roof = (h = 0.67) => {
      for (const xx of [-0.34, 0.34]) b([xx, h / 2, -0.2], [0.035, h, 0.035], C.ink);
      b([0, h, -0.08], [0.8, 0.055, 0.64], C.coral);
    };
    const clock = () => {
      cy([0, 0.38, 0], 0.16, 0.7, C.cream);
      p("cylinder", [0, 0.82, 0.02], [0.45, 0.07, 0.45], C.ink, [Math.PI / 2, 0, 0]);
      p("cylinder", [0, 0.82, 0.063], [0.38, 0.012, 0.38], C.yellow, [Math.PI / 2, 0, 0]);
      b([0, 0.89, 0.076], [0.02, 0.16, 0.012], C.ink);
      b([0.06, 0.82, 0.076], [0.14, 0.02, 0.012], C.ink);
    };
    const cross = (xx, yy, zz) => {
      b([xx, yy, zz], [0.23, 0.06, 0.035], C.coral);
      b([xx, yy, zz], [0.06, 0.23, 0.035], C.coral);
    };
    const book = (xx, yy, zz, col = C.coral) => {
      b([xx, yy, zz], [0.22, 0.3, 0.055], col, [0, 0, -0.12]);
      b([xx + 0.012, yy, zz + 0.034], [0.17, 0.25, 0.013], C.cream, [0, 0, -0.12]);
    };
    const coin = (xx = 0, zz = 0) => {
      for (let j = 0; j < 4; j++) cy([xx, 0.06 + j * 0.045, zz], 0.24, 0.04, C.yellow);
    };
    const plant = (xx, zz, s = 0.45) => tree(x + xx * scale, z + zz * scale, s * scale, id);
    const globe = () => {
      sphere([0, 0.63, 0], [0.43, 0.43, 0.43], glass);
      ring([0, 0.63, 0], 0.5, C.cream, [0, 0, 0.35]);
      ring([0, 0.63, 0], 0.44, C.yellow, [0, Math.PI / 2, 0]);
      cy([0, 0.3, 0], 0.04, 0.3, C.ink);
      cy([0, 0.14, 0], 0.25, 0.04, C.ink);
    };
    const road = () => {
      b([0, 0.035, 0], [0.87, 0.04, 0.68], 0x918780);
      for (let j = 0; j < 4; j++) b([-0.3 + j * 0.2, 0.06, 0], [0.1, 0.01, 0.024], C.yellow);
    };
    const bus = () => {
      b([0, 0.23, 0], [0.68, 0.27, 0.28], C.coral);
      b([0, 0.39, 0], [0.67, 0.05, 0.3], C.cream);
      for (let j = 0; j < 4; j++) b([-0.24 + j * 0.16, 0.29, 0.148], [0.12, 0.12, 0.012], glass);
      b([0.347, 0.29, 0], [0.012, 0.14, 0.22], glass);
      for (const xx of [-0.22, 0.22])
        for (const zz of [-0.15, 0.15]) p("cylinder", [xx, 0.12, zz], [0.14, 0.035, 0.14], C.ink, [Math.PI / 2, 0, 0]);
      b([0.35, 0.17, 0.09], [0.013, 0.04, 0.06], C.yellow);
    };
    const bike = (zz = 0, motor = false) => {
      for (const xx of [-0.2, 0.2]) ring([xx, 0.14, zz], 0.24, C.ink, [0, 0, 0]);
      b([0, 0.18, zz], [0.34, 0.035, 0.035], C.coral, [0, 0, 0.32]);
      b([-0.1, 0.23, zz], [0.025, 0.22, 0.025], C.ink, [0, 0, 0.3]);
      b([0.18, 0.28, zz], [0.025, 0.33, 0.025], C.ink, [0, 0, -0.2]);
      b([-0.09, 0.36, zz], [0.15, 0.04, 0.09], C.ink);
      b([0.23, 0.43, zz], [0.12, 0.025, 0.025], C.ink);
      if (motor) b([0, 0.22, zz], [0.27, 0.17, 0.13], C.yellow);
    };
    const court = (football = false) => {
      b([0, 0.04, 0], [0.92, 0.07, 0.67], green);
      for (const zz of [-0.29, 0.29]) b([0, 0.081, zz], [0.85, 0.012, 0.014]);
      for (const xx of [-0.41, 0, 0.41]) b([xx, 0.081, 0], [0.013, 0.012, 0.6]);
      ring([0, 0.087, 0], 0.22, C.cream);
      for (const xx of [-0.43, 0.43]) {
        b([xx, 0.2, 0], [0.025, 0.025, 0.31]);
        for (const zz of [-0.15, 0.15]) b([xx, 0.14, zz], [0.025, 0.18, 0.025]);
        if (football) for (let j = 0; j < 5; j++) b([xx, 0.14, -0.12 + j * 0.06], [0.012, 0.15, 0.012]);
      }
      if (football) for (let j = 0; j < 3; j++) b([0, 0.08 + j * 0.07, -0.39 - j * 0.05], [0.72, 0.06, 0.05], C.stone);
    };
    const bed = () => {
      b([0, 0.19, 0], [0.31, 0.13, 0.55], C.cream);
      b([0, 0.265, 0.07], [0.32, 0.025, 0.34], C.coral);
      b([0, 0.28, -0.18], [0.23, 0.055, 0.12], C.yellow);
      for (const xx of [-0.18, 0.18]) {
        b([xx, 0.28, 0], [0.025, 0.025, 0.5], C.ink);
        for (const zz of [-0.2, 0.2]) b([xx, 0.16, zz], [0.025, 0.25, 0.025], C.ink);
      }
    };
    const nursery = () => {
      bed();
      for (let j = 0; j < 4; j++) for (const xx of [-0.18, 0.18]) b([xx, 0.35, -0.2 + j * 0.13], [0.025, 0.2, 0.025], C.cream);
      b([-0.18, 0.46, 0], [0.025, 0.03, 0.57], C.cream);
      b([0.18, 0.46, 0], [0.025, 0.03, 0.57], C.cream);
      for (let j = 0; j < 3; j++) b([0.31, 0.08 + j * 0.035, -0.12 + j * 0.13], [0.12, 0.14, 0.12], j % 2 ? C.yellow : C.coral);
    };
    const meeting = () => {
      cy([0, 0.27, 0], 0.42, 0.04, wood);
      cy([0, 0.14, 0], 0.04, 0.26, C.ink);
      for (const [xx, zz] of [
        [-0.3, 0],
        [0.3, 0],
        [0, -0.3],
      ]) {
        seat(xx, zz);
        person(xx, zz, 0.38);
      }
    };
    const farm = () => {
      b([0, 0.04, 0], [0.72, 0.08, 0.63], wood);
      for (let row = 0; row < 3; row++) {
        b([-0.24 + row * 0.24, 0.09, 0], [0.08, 0.06, 0.58], 0x715944);
        for (let j = 0; j < 4; j++) sphere([-0.24 + row * 0.24, 0.16, -0.23 + j * 0.15], [0.15, 0.17, 0.13], green);
      }
    };
    const river = () => {
      b([0, 0.04, 0], [0.9, 0.045, 0.3], glass);
      for (let j = 0; j < 4; j++) b([-0.3 + j * 0.2, 0.067, 0.015], [0.1, 0.008, 0.012], C.cream);
      b([0, 0.065, 0.27], [0.9, 0.055, 0.19], C.stone);
    };
    const classroom = (dual = false) => {
      b([0, 0.32, -0.3], [0.73, 0.49, 0.04], green);
      b([0, 0.56, -0.27], [0.77, 0.025, 0.06], wood);
      for (const xx of [-0.18, 0.18])
        for (const zz of [0.08, 0.32]) {
          b([xx, 0.21, zz], [0.23, 0.035, 0.15], wood);
          b([xx, 0.11, zz], [0.04, 0.2, 0.06]);
          seat(xx, zz + 0.12);
        }
      person(-0.2, -0.12);
      if (dual) person(0.2, -0.12);
    };
    if (opts.plot) p("box", [0, 0.022, 0], [opts.plotW || 0.98, 0.03, opts.plotD || 0.84], opts.plot);
    if (extraModel(kind, { b, hb, cy, sphere, ring, p, glow, bulb, seat, person, plant, C, glass, wood, green })) return spec;
    switch (kind) {
      case "renewal":
        for (const xx of [-0.3, 0.3]) for (const zz of [-0.25, 0.25]) b([xx, 0.5, zz], [0.03, 1, 0.03], C.ink);
        for (let j = 0; j < 4; j++) {
          b([0, 0.08 + j * 0.3, 0], [0.65, 0.035, 0.55]);
          b([0, 0.22 + j * 0.3, 0.27], [0.62, 0.025, 0.025], C.coral, [0, 0, 0.25]);
        }
        // green safety netting wraps the frame (no countable floors)
        p("box", [0, 0.56, 0.285], [0.66, 1.0, 0.012], 0x7fa38a);
        p("box", [0.33, 0.56, 0], [0.012, 1.0, 0.56], 0x6f957b);
        p("box", [-0.33, 0.56, 0], [0.012, 1.0, 0.56], 0x6f957b);
        for (let j = 0; j < 6; j++) hb([0, 0.12 + j * 0.18, 0.293], [0.66, 0.006, 0.004], 0x5f856b);
        b([0.4, 0.72, -0.18], [0.06, 1.44, 0.06], C.coral);
        b([0.12, 1.44, -0.18], [1, 0.05, 0.06], C.coral);
        b([-0.3, 1.25, -0.18], [0.02, 0.38, 0.02], C.ink);
        b([0.48, 1.36, -0.18], [0.19, 0.14, 0.17], C.ink);
        break;
      case "office":
      case "computer":
      case "research":
      case "laptop":
      case "talent":
        desk();
        screen();
        seat(0, 0.28);
        if (kind === "office") {
          b([-0.38, 0.35, -0.3], [0.045, 0.7, 0.6]);
          b([0, 0.4, -0.32], [0.7, 0.6, 0.04], glass);
          plant(0.34, 0.24, 0.36);
        } else if (kind === "research") {
          book(-0.32, 0.22, -0.14);
          b([0.31, 0.27, -0.1], [0.16, 0.5, 0.18], C.stone);
        } else if (kind === "laptop") coin(0.34, 0.2);
        else if (kind === "talent") {
          ring([0.3, 0.66, -0.12], 0.23, C.coral, [0, 0, 0]);
        }
        break;
      case "clock":
        clock();
        break;
      case "clockcare":
        clock();
        seat(-0.31, 0.2);
        seat(0.31, 0.2);
        cross(0.32, 0.5, -0.12);
        break;
      case "counsel":
        seat(-0.25, 0);
        seat(0.25, 0);
        cy([0, 0.2, 0.12], 0.18, 0.035, wood);
        plant(0.3, -0.27, 0.45);
        b([0, 0.32, -0.36], [0.82, 0.6, 0.04], C.cream);
        break;
      case "award":
        cy([0, 0.08, 0], 0.65, 0.12, C.coral);
        cy([0, 0.29, 0], 0.055, 0.3, wood);
        p("cone", [0, 0.5, 0], [0.32, 0.3, 0.32], C.yellow, [Math.PI, 0, 0]);
        for (const xx of [-0.19, 0.19]) ring([xx, 0.48, 0], 0.18, C.yellow, [0, 0, 0]);
        break;
      case "clinic":
      case "care":
        bed();
        b([0.3, 0.24, -0.12], [0.15, 0.43, 0.17]);
        cross(0.3, 0.37, -0.025);
        if (kind === "care") seat(-0.32, 0.1);
        break;
      case "access":
        b([-0.18, 0.16, 0], [0.4, 0.3, 0.57]);
        b([0.26, 0.095, 0.05], [0.5, 0.04, 0.32], C.stone, [0, 0, 0.36]);
        ring([-0.18, 0.4, 0.15], 0.27, C.ink, [0, 0, 0]);
        b([-0.18, 0.48, 0.1], [0.18, 0.06, 0.15], C.coral);
        b([-0.27, 0.57, 0.1], [0.04, 0.22, 0.16], C.coral);
        b([0.16, 0.25, 0.25], [0.63, 0.025, 0.025], C.ink, [0, 0, 0.36]);
        break;
      case "garden":
        ring([0, 0.04, 0], 0.68, C.stone);
        plant(0, -0.1, 0.6);
        seat(0.28, 0.22);
        break;
      case "safe":
        roof();
        b([0, 0.32, -0.28], [0.52, 0.54, 0.045]);
        ring([0, 0.43, -0.24], 0.3, C.coral, [0, 0, 0]);
        person(-0.15, 0.14);
        person(0.14, 0.15, 0.26);
        break;
      case "crossing":
        road();
        for (let j = 0; j < 6; j++) b([-0.26 + j * 0.1, 0.065, 0.13], [0.04, 0.012, 0.35]);
        for (const xx of [-0.34, 0.34]) {
          b([xx, 0.27, -0.26], [0.06, 0.5, 0.06]);
          b([xx, 0.52, -0.26], [0.12, 0.12, 0.04], C.yellow);
        }
        b([0, 0.57, -0.26], [0.77, 0.1, 0.08], C.coral);
        break;
      case "bus":
        road();
        bus();
        break;
      case "busstop":
        bus();
        for (const xx of [-0.34, 0.34]) b([xx, 0.3, -0.28], [0.025, 0.6, 0.025]);
        b([0, 0.61, -0.28], [0.85, 0.04, 0.29], C.coral);
        b([0, 0.34, -0.4], [0.7, 0.4, 0.025], glass);
        break;
      case "bridge":
        river();
        b([0, 0.3, 0], [0.85, 0.07, 0.26], C.cream);
        for (const xx of [-0.32, 0.32]) b([xx, 0.18, 0], [0.065, 0.28, 0.21], C.stone);
        for (const zz of [-0.15, 0.15]) {
          b([0, 0.48, zz], [0.87, 0.025, 0.025], C.coral);
          for (let j = 0; j < 7; j++) b([-0.39 + j * 0.13, 0.39, zz], [0.02, 0.18, 0.02], C.coral);
        }
        break;
      case "bike":
      case "scooter":
        road();
        bike(0.1, kind === "scooter");
        for (const xx of [-0.3, 0, 0.3]) {
          b([xx, 0.17, -0.22], [0.06, 0.3, 0.08], C.cream);
          b([xx, 0.3, -0.22], [0.08, 0.07, 0.1], C.yellow);
        }
        break;
      case "hub":
        roof();
        bike(0.19);
        b([-0.25, 0.21, -0.21], [0.14, 0.4, 0.14], glass);
        cy([-0.25, 0.42, -0.21], 0.18, 0.025, C.cream);
        seat(0.23, -0.15);
        break;
      case "classroom":
      case "teachers":
        classroom(kind === "teachers");
        break;
      case "meeting":
      case "service":
        meeting();
        if (kind === "service") {
          b([0, 0.25, 0.29], [0.72, 0.4, 0.15], C.cream);
          b([0, 0.48, 0.29], [0.8, 0.045, 0.22], C.coral);
        }
        break;
      case "nursery":
      case "nightcare":
        nursery();
        if (kind === "nightcare") {
          b([-0.3, 0.45, -0.27], [0.025, 0.9, 0.025], C.ink);
          ring([-0.3, 0.86, -0.26], 0.26, C.yellow, [0, 0, 0]);
          sphere([-0.25, 0.9, -0.25], [0.17, 0.17, 0.05], C.cream);
        }
        break;
      case "campus":
        for (const xx of [-0.3, 0.3]) {
          b([xx, 0.26, 0], [0.22, 0.5, 0.36]);
          b([xx, 0.53, 0], [0.27, 0.06, 0.42], C.coral);
        }
        b([0, 0.44, -0.12], [0.42, 0.08, 0.2]);
        person(0, 0.2);
        break;
      case "kitchen":
        b([0, 0.26, -0.17], [0.82, 0.46, 0.28], C.cream);
        b([0, 0.51, -0.17], [0.88, 0.035, 0.32], C.ink);
        for (const xx of [-0.23, 0.1]) {
          cy([xx, 0.57, -0.17], 0.18, 0.1, C.stone);
          cy([xx, 0.63, -0.17], 0.19, 0.025, C.cream);
        }
        b([0, 0.9, -0.17], [0.82, 0.15, 0.35], C.stone);
        b([0, 1.02, -0.17], [0.14, 0.12, 0.14], C.stone);
        cy([0.26, 0.08, 0.22], 0.26, 0.025, C.cream);
        break;
      case "farm":
        farm();
        break;
      case "foodclass":
        farm();
        desk(0, 0.3);
        book(0, 0.43, 0.3, green);
        break;
      case "meal":
      case "subsidy":
        b([0, 0.12, 0], [0.74, 0.1, 0.49], C.stone);
        for (const xx of [-0.22, 0, 0.22]) {
          cy([xx, 0.18, 0], 0.2, 0.03, C.cream);
          sphere([xx, 0.22, 0], [0.14, 0.08, 0.14], xx === 0 ? green : C.yellow);
        }
        coin(0.29, -0.26);
        if (kind === "meal") {
          b([-0.3, 0.4, -0.24], [0.07, 0.6, 0.07], C.coral);
          for (let j = 0; j < 4; j++) b([-0.24, 0.22 + j * 0.13, -0.24], [0.12, 0.02, 0.025], C.ink);
        }
        break;
      case "homecare":
        house(x - 0.08, z, 0.4, 0.4, id);
        b([0.32, 0.14, 0.24], [0.28, 0.24, 0.13]);
        ring([0.32, 0.29, 0.24], 0.13, C.ink, [0, 0, 0]);
        cross(0.32, 0.15, 0.315);
        break;
      case "phone":
        roof(0.8);
        b([0, 0.37, -0.16], [0.35, 0.6, 0.12], C.yellow);
        b([0, 0.48, -0.087], [0.23, 0.16, 0.015], glass);
        for (const xx of [-0.11, 0.11]) b([xx, 0.31, -0.06], [0.065, 0.18, 0.06], C.ink);
        b([0, 0.27, -0.06], [0.22, 0.05, 0.06], C.ink);
        break;
      case "culture":
        b([0, 0.09, 0], [0.85, 0.17, 0.6], wood);
        for (const xx of [-0.35, 0.35]) b([xx, 0.43, -0.23], [0.14, 0.65, 0.1], C.coral);
        b([0, 0.77, -0.23], [0.84, 0.1, 0.13], C.coral);
        person(0, 0);
        break;
      case "court":
      case "football":
        court(kind === "football");
        break;
      case "books":
      case "law":
        for (let j = 0; j < 3; j++) book(-0.24 + j * 0.22, 0.22, 0, j % 2 ? C.yellow : C.coral);
        if (kind === "law") plant(0.22, -0.2, 0.6);
        else {
          b([0, 0.16, 0.25], [0.4, 0.28, 0.14], wood);
          ring([0, 0.34, 0.25], 0.2, C.ink, [0, 0, 0]);
        }
        break;
      case "shop":
        b([0, 0.26, 0], [0.64, 0.5, 0.44]);
        b([0, 0.3, 0.23], [0.48, 0.28, 0.02], glass);
        for (let j = 0; j < 6; j++) b([-0.3 + j * 0.12, 0.54, 0.15], [0.12, 0.045, 0.47], j % 2 ? C.cream : C.coral, [0.18, 0, 0]);
        sphere([0.22, 0.68, 0.14], [0.14, 0.14, 0.05], C.yellow);
        break;
      case "generations":
        desk();
        seat(-0.27, 0.2);
        seat(0.26, 0.2);
        person(-0.27, 0.2, 0.44);
        person(0.26, 0.2, 0.27);
        book(0, 0.44, 0);
        break;
      case "card":
        b([0, 0.42, 0], [0.7, 0.45, 0.055], C.yellow, [0, 0, -0.15]);
        b([-0.19, 0.46, 0.04], [0.12, 0.11, 0.025], C.coral);
        for (let j = 0; j < 2; j++) b([0.12, 0.4 + j * 0.07, 0.04], [0.26, 0.02, 0.015], C.ink);
        b([0, 0.08, 0], [0.64, 0.13, 0.23], C.stone);
        break;
      case "vaccine":
        desk();
        cy([-0.15, 0.46, 0], 0.17, 0.3, glass);
        cy([-0.15, 0.63, 0], 0.18, 0.06, C.coral);
        b([-0.15, 0.48, 0.09], [0.12, 0.1, 0.015], C.cream);
        b([0.2, 0.47, 0], [0.045, 0.3, 0.045], C.cream, [0, 0, -0.25]);
        b([0.15, 0.69, 0], [0.02, 0.19, 0.02], C.ink, [0, 0, -0.25]);
        cross(-0.15, 0.49, 0.106);
        break;
      case "power":
        for (const xx of [-0.2, 0.2]) {
          b([xx, 0.3, 0], [0.28, 0.55, 0.32], C.ink);
          b([xx, 0.6, 0], [0.12, 0.06, 0.15], C.stone);
          b([xx, 0.35, 0.17], [0.16, 0.3, 0.02], C.yellow);
        }
        b([0, 0.1, 0.27], [0.7, 0.025, 0.025], C.coral);
        break;
      case "lighting":
        road();
        for (const xx of [-0.3, 0.3]) {
          b([xx, 0.4, -0.2], [0.025, 0.8, 0.025], C.ink);
          b([xx, 0.8, -0.13], [0.22, 0.035, 0.22], C.yellow);
          cy([xx, 0.068, 0.1], 0.28, 0.01, C.yellow);
        }
        break;
      case "fitness":
        for (const xx of [-0.28, 0.28]) b([xx, 0.32, 0], [0.045, 0.64, 0.045], C.coral);
        b([0, 0.65, 0], [0.62, 0.045, 0.045], C.ink);
        b([0, 0.24, 0.24], [0.5, 0.06, 0.16], wood);
        person(0, -0.05);
        break;
      case "river":
        river();
        plant(-0.28, -0.25, 0.48);
        seat(0.24, 0.3);
        break;
      case "arena":
        court();
        p("dome", [0, 0.44, -0.1], [0.92, 0.62, 0.66], C.cream);
        for (const xx of [-0.36, 0.36]) b([xx, 0.25, -0.1], [0.045, 0.5, 0.045], C.coral);
        break;
      case "exchange":
      case "forum":
        globe();
        if (kind === "forum") {
          meeting();
        } else {
          b([0.3, 0.22, 0.2], [0.22, 0.35, 0.14], C.coral);
          ring([0.3, 0.43, 0.2], 0.12, C.ink, [0, 0, 0]);
          person(-0.3, 0.1);
        }
        break;
      case "mountain": {
        // trailhead hiking-service centre: timber lodge with a gable roof and big windows, a trail gate arch
        // opening onto a zig-zag stone path up a wooded slope, gear-rental rack (trekking poles), lockers,
        // a boot-wash basin and a trail map board. Variant by centre: north = pines, east = city view deck,
        // south = tea terraces.
        const variant = id.endsWith("north") ? 0 : id.endsWith("east") ? 1 : 2;
        // wooded slope behind (low, irregular, not a stacked cone)
        p("leaf", [-0.18, 0.12, -0.3], [0.86, 0.34, 0.44], 0x8fa67a, [0.2, 0.4, 0]);
        p("leaf", [0.22, 0.1, -0.34], [0.6, 0.28, 0.38], 0x9cb684, [0, 1.1, 0.1]);
        p("ico", [-0.36, 0.2, -0.36], [0.24, 0.2, 0.2], 0xb7a993);
        if (variant === 0) for (const [tx, tz] of [[-0.42, -0.22], [-0.05, -0.42], [0.32, -0.36]]) { cy([tx, 0.18, tz], 0.03, 0.12, 0x7a5d44); p("cone6", [tx, 0.33, tz], [0.16, 0.3, 0.16], 0x5f826c); }
        if (variant === 2) for (let r = 0; r < 3; r++) b([0.18, 0.05 + r * 0.06, -0.18 - r * 0.07], [0.5 - r * 0.08, 0.05, 0.08], [0x93ad74, 0x86a26a][r % 2]);
        // zig-zag stone trail up the slope
        for (let k = 0; k < 6; k++) p("box", [-0.3 + (k % 2) * 0.16, 0.05 + k * 0.045, -0.06 - k * 0.055], [0.16, 0.025, 0.07], 0xd8ccba, [0, k % 2 ? -0.5 : 0.5, 0]);
        // trail gate arch with sign
        for (const sx of [-0.42, -0.2]) cy([sx, 0.17, 0.02], 0.025, 0.34, 0x8a6a4e);
        b([-0.31, 0.35, 0.02], [0.3, 0.04, 0.05], 0x8a6a4e);
        b([-0.31, 0.29, 0.03], [0.18, 0.06, 0.012], 0x5f826c);
        // timber lodge
        b([0.2, 0.16, 0.12], [0.42, 0.3, 0.28], 0xc49a6c);
        for (let k = 0; k < 4; k++) hb([0.2, 0.06 + k * 0.07, 0.262], [0.42, 0.008, 0.006], 0xa77a55);
        p("prism", [0.2, 0.38, 0.12], [0.38, 0.5, 0.3], variant === 1 ? 0x3e7c8c : C.coral, [-Math.PI / 2, 0, Math.PI / 2]);
        glow([0.12, 0.17, 0.264], [0.14, 0.12, 0.008], 0xfff1c8);
        hb([0.3, 0.12, 0.264], [0.07, 0.17, 0.008], C.ink);
        // porch deck + sign board over the door
        b([0.2, 0.025, 0.32], [0.46, 0.03, 0.1], 0xb48560);
        b([0.2, 0.33, 0.272], [0.22, 0.05, 0.01], 0xfff8ee);
        // gear rental rack with trekking poles and a backpack
        b([0.46, 0.1, 0.36], [0.03, 0.18, 0.12], 0x8a6a4e);
        for (let k = 0; k < 4; k++) p("cylinder", [0.44 - k * 0.012, 0.15, 0.31 + k * 0.03], [0.008, 0.26, 0.008], [0x3e7c8c, C.coral, 0xe8c547, 0x3b3a42][k], [0.12, 0, 0.1]);
        b([0.47, 0.07, 0.43], [0.06, 0.09, 0.05], 0xdb6a41);
        // lockers + boot-wash basin with tap
        for (let k = 0; k < 3; k++) b([-0.04 + k * 0.07, 0.11, 0.28], [0.06, 0.2, 0.05], [0x5f9aa6, 0x7aa0b0, 0x5f9aa6][k]);
        b([-0.1, 0.05, 0.42], [0.18, 0.06, 0.08], 0xd2c3ad);
        b([-0.1, 0.075, 0.42], [0.14, 0.01, 0.05], 0x8fc6d0);
        cy([-0.1, 0.12, 0.38], 0.012, 0.08, 0x8a8a90);
        // trail map board
        for (const sx of [-0.46, -0.3]) cy([sx, 0.1, 0.32], 0.012, 0.2, C.ink);
        b([-0.38, 0.2, 0.32], [0.18, 0.11, 0.012], 0xf6efe3);
        for (let k = 0; k < 3; k++) hb([-0.38, 0.17 + k * 0.025, 0.327], [0.12 - k * 0.03, 0.006, 0.003], [0x5f826c, C.coral, 0x3e7c8c][k]);
        if (variant === 1) { // view deck toward the city
          for (const sx of [0.34, 0.46]) cy([sx, 0.22, -0.1], 0.015, 0.44, 0x8a6a4e);
          b([0.4, 0.44, -0.1], [0.2, 0.025, 0.14], 0xb48560);
        }
        person(-0.2, 0.2, 0.34);
        break;
      }
      case "heritage":
        house(x, z, 0.48, 0.45, id);
        b([-0.33, 0.2, 0.22], [0.14, 0.26, 0.035], wood);
        break;
      case "tower":
        for (let j = 0; j < 5; j++) b([0, 0.11 + j * 0.2, 0], [0.42 - j * 0.055, 0.18, 0.4 - j * 0.055], j % 2 ? glass : C.cream);
        b([0, 1.12, 0], [0.025, 0.22, 0.025], C.ink);
        break;
      case "factory":
        b([0, 0.23, 0], [0.62, 0.42, 0.42], wood);
        cy([-0.22, 0.54, -0.12], 0.11, 0.9, wood);
        for (const xx of [-0.15, 0.1, 0.27]) b([xx, 0.29, 0.22], [0.11, 0.15, 0.012], glass);
        break;
      case "forestmeeting":
        plant(0, -0.23, 0.75);
        meeting();
        break;
      case "forestfund":
        plant(-0.18, -0.1, 0.7);
        coin(0.24, 0.2);
        break;
      case "twin":
        plant(-0.25, 0, 0.65);
        desk(0.25, 0.06);
        screen(0.25, 0.06);
        break;
      case "cool":
        plant(-0.2, -0.12, 0.8);
        b([0.15, 0.14, 0.2], [0.55, 0.035, 0.42], glass, [0.2, 0, 0]);
        for (let j = 0; j < 3; j++) b([0.02 + j * 0.13, 0.16, 0.2], [0.045, 0.012, 0.4], C.yellow, [0.2, 0, 0]);
        break;
      case "wood":
        for (let j = 0; j < 5; j++) p("cylinder", [-0.24 + j * 0.12, 0.13, 0], [0.11, 0.62, 0.11], wood, [Math.PI / 2, 0, 0]);
        for (const xx of [-0.3, 0.3]) b([xx, 0.26, 0], [0.035, 0.45, 0.65], C.ink);
        break;
      case "fund":
        coin(-0.23, 0);
        coin(0, 0.15);
        coin(0.23, 0);
        b([0, 0.36, -0.15], [0.7, 0.28, 0.05], C.coral);
        break;
      case "launch":
        cy([0, 0.13, 0], 0.64, 0.22, C.stone);
        cy([0, 0.51, 0], 0.24, 0.55, C.cream);
        p("cone", [0, 0.89, 0], [0.25, 0.25, 0.25], C.coral);
        ring([0, 0.55, 0.13], 0.12, glass, [0, 0, 0]);
        for (const xx of [-0.16, 0.16]) b([xx, 0.32, 0], [0.09, 0.27, 0.11], C.coral, [0, 0, xx]);
        break;
      default:
        throw new Error(`Unimplemented model ${kind}`);
    }
    return spec;
  };
}

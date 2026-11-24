// ============================================================================
// HTL Island Social Engine (island-social.js)
// Phase 2: RPG Immersive NPC Dialogue & 100% Official-Data Grounded Q&A
// Phase 3: Real-time Multiplayer Virtual Avatar Plaza (BroadcastChannel + WS)
// ============================================================================
import { OFFICIAL } from "./official-data.js?v=20261115-01";
import { uiIcon } from "./ui-icons.js?v=20261115-01";
import { installPlazaGames } from "./plaza-games.js?v=20261115-03";

(() => {
  if (window.htlSocial) return;

  // 以密碼學安全亂數產生代碼（ISO/IEC 27001 Annex A 8.24）；crypto.getRandomValues 在所有現代瀏覽器皆可用。
  const randToken = (len) => {
    const abc = "abcdefghijklmnopqrstuvwxyz0123456789";
    const buf = new Uint8Array(len);
    crypto.getRandomValues(buf);
    let s = "";
    for (const b of buf) s += abc[b % abc.length];
    return s;
  };
  const sessionToken = (storageKey, make) => {
    try {
      const saved = sessionStorage.getItem(storageKey);
      if (saved) return saved;
      const v = make();
      sessionStorage.setItem(storageKey, v);
      return v;
    } catch {
      return make();
    }
  };
  // SESSION_ID 會公開廣播給同房間玩家；SESSION_KEY 只送往伺服器用來證明「這個 id 是我的」，絕不放入封包。
  // 先以分頁專屬（sessionStorage）身分啟動；連線前由 claimIdentity() 嘗試接回本瀏覽器上次的身分，
  // 讓關閉分頁後留在場上的「離線角色」能在下次回來時接回。
  let SESSION_ID = sessionToken("htl-social-sid", () => "p_" + randToken(12));
  let SESSION_KEY = sessionToken("htl-social-key", () => randToken(32));
  const IDENT_KEY = "htl-plaza-ident";
  const ID_OK = /^[A-Za-z0-9_-]{4,40}$/;
  const KEY_OK = /^[A-Za-z0-9_-]{16,64}$/;

  // 以 Web Locks 確保同一身分同時只被一個分頁使用（另一分頁會自動改用新身分，可在同瀏覽器測試兩人連線）。
  // 鎖在分頁存活期間一直持有，分頁關閉時由瀏覽器自動釋放。
  const holdLock = (id) =>
    new Promise((resolve) => {
      try {
        navigator.locks
          .request(`htl-plaza-ident:${id}`, { ifAvailable: true }, (lock) => {
            resolve(!!lock);
            return lock ? new Promise(() => {}) : null;
          })
          .catch(() => resolve(false));
      } catch {
        resolve(false);
      }
    });
  async function claimIdentity() {
    if (!navigator.locks?.request) return; // 不支援時維持分頁專屬身分
    const setTab = (id, key) => {
      SESSION_ID = id;
      SESSION_KEY = key;
      try {
        sessionStorage.setItem("htl-social-sid", id);
        sessionStorage.setItem("htl-social-key", key);
      } catch {}
    };
    let saved = null;
    try {
      saved = JSON.parse(localStorage.getItem(IDENT_KEY) || "null");
    } catch {}
    const savedOk = saved && ID_OK.test(saved.id || "") && KEY_OK.test(saved.key || "");
    const tabIsFresh = !savedOk || saved.id !== SESSION_ID;
    // 1) 本分頁重新整理：沿用分頁身分（若未被複製分頁佔用）
    if (!tabIsFresh || !savedOk) {
      if (await holdLock(SESSION_ID)) {
        if (!savedOk) {
          try {
            localStorage.setItem(IDENT_KEY, JSON.stringify({ id: SESSION_ID, key: SESSION_KEY }));
          } catch {}
        }
        return;
      }
    }
    // 2) 新開分頁：接回本瀏覽器上次的身分（含場上的離線角色）
    if (savedOk && saved.id !== SESSION_ID && (await holdLock(saved.id))) {
      setTab(saved.id, saved.key);
      return;
    }
    // 3) 分頁身分可用（例如另一分頁已在使用上次的身分）
    if (tabIsFresh && savedOk && (await holdLock(SESSION_ID))) return;
    // 4) 全被佔用（複製分頁）：產生全新身分
    const id = "p_" + randToken(12);
    await holdLock(id);
    setTab(id, randToken(32));
  }

  const STORAGE_ROOM_KEY = "htl-plaza-room";
  const STORAGE_WS_KEY = "htl-plaza-ws";
  const BC_PREFIX = "htl-island-plaza:v1:";

  const ROOMS = [
    { id: "lobby", label: "迎賓大廳", icon: "landmark" },
    { id: "freshman", label: "新生導覽團", icon: "faculty" },
    { id: "intern", label: "實習交流廳", icon: "briefcase" },
  ];

  const QUICK_PHRASES = [
    "大家好！我是來參觀高餐旅館系的新生 👋",
    "有人想一起去群賢會館逛逛嗎？🏨",
    "請問大三菁英實習 3.0 推薦哪一區？🌟",
    "1+3 畢業證照大家準備得如何？📜",
    "一起來地標前鞠躬合照吧！📸",
  ];

  // 禮貌詞彙過濾（維持友善校園參訪環境）
  const BAD_PATTERNS = [
    /幹你|靠北|三小|媽的|白痴|智障|垃圾|去死|fuck|shit|bitch|asshole/gi,
  ];
  function sanitizeText(raw, maxLen = 90) {
    let s = String(raw || "").replace(/[\r\n\t]+/g, " ").trim().slice(0, maxLen);
    for (const pat of BAD_PATTERNS) {
      s = s.replace(pat, "✦✦");
    }
    return s;
  }

  const h = (tag, attrs = {}, ...kids) => {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (v == null || v === false) continue;
      if (k === "class") el.className = v;
      else if (k === "style") el.style.cssText = v;
      else if (k.startsWith("on") && typeof v === "function") el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, v === true ? "" : v);
    }
    for (const kid of kids.flat()) {
      if (kid == null || kid === false) continue;
      el.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
    }
    return el;
  };

  const txt = (v) => (v && typeof v === "object" ? v.zh || v.en || "" : String(v || ""));
  const wrapAngle = (a) => Math.atan2(Math.sin(a), Math.cos(a));

  // ── 五星禮賓情境演練題庫（結合旅館管理系客務、房務與禮賓核心素養）
  const ROLEPLAY_SCENARIOS = [
    {
      id: "rp-vip",
      title: "🛎️ 情境一：國際貴賓提早抵達（Front Office 客務接待）",
      prompt: "一位預訂下午 15:00 入住的外籍貴賓於上午 11:30 抵達大廳，神情略顯疲憊並詢問能否提前進房，但目前同房型仍在房務清潔中。身為高餐旅館系培訓的禮賓接待人員，哪種應對最符合五星款待精神？",
      options: [
        {
          label: "微笑致意並主動辦理預先登記與行李寄存，引導貴賓至休息區享用迎賓茶點，同時透過 PMS 優先協調房務搶房，房號備妥後立即通知。",
          ok: true,
          reply: "太出色了！結合「同理心款待」與「PMS 客房跨部門協調」，正是本系客務實務與群賢會館實作最重視的標準流程！",
        },
        {
          label: "直接告知規定就是下午三點才能入住，請貴賓自己在大廳沙發等到三點再來排隊。",
          ok: false,
          reply: "這樣雖然守了規定，但缺乏款待溫度喔！建議先辦理預先登記、寄存行李並協調房務優先清潔，讓貴賓感受賓至如歸。",
        },
        {
          label: "未確認房況就直接把還沒檢查完的房間鑰匙交給貴賓。",
          ok: false,
          reply: "千萬不可！未完成房務雙重查房（Inspection）即放房會嚴重影響住宿安全與品質，務必透過 PMS 確認 Clean/Inspected 狀態。",
        },
      ],
    },
    {
      id: "rp-pms",
      title: "💻 情境二：團體入住與特殊需求註記（PMS 資訊系統應用）",
      prompt: "明日有一組家庭旅遊貴賓備註「攜帶嬰兒同行且對堅果過敏」。在飯店資訊系統（如 OPERA Cloud 或德安系統）作業中，最重要的前置步驟為何？",
      options: [
        {
          label: "於貴賓 Profile 與訂房單設定 Alerts／Traces 跨部門提醒，同步通知房務備妥嬰兒床與消毒備品、餐飲部門留意過敏原。",
          ok: true,
          reply: "完全正確！善用 PMS 的 Traces 與客史紀錄（Guest Profile）串聯前檯、房務與餐飲實務，就是智慧旅宿管理的精髓！",
        },
        {
          label: "不用特別輸入系統，等明天客人自己跟櫃檯再講一次就好。",
          ok: false,
          reply: "口頭記憶容易因交班遺漏！將特殊需求寫入系統 Traces 才能確保早晚班與各部門無縫接軌。",
        },
      ],
    },
    {
      id: "rp-intern",
      title: "🌟 情境三：大三校外實習面試準備（菁英實習 3.0）",
      prompt: "準備參加大三「三明治教學」校外實習面試時，面對國際品牌酒店人資主管詢問「你想從一年實習中帶走什麼？」，哪個回答最能展現高餐旅館系學生的優勢？",
      options: [
        {
          label: "結合大一二在群賢會館與專業課程打下的基礎，期許在第一線深化跨部門溝通、外語應對與危機處理能力，大四回校後進一步銜接營收與經營策略課程。",
          ok: true,
          reply: "滿分回答！完整呼應本系「理論 → 校內實作 → 大三校外實習 → 大四經營管理深化」的三明治養成脈絡！",
        },
        {
          label: "只是因為學校規定要實習才來，沒有特別想法。",
          ok: false,
          reply: "太可惜啦！本系合作夥伴涵蓋北中南東多家指標國際星級酒店，主動設定學習目標更能獲得儲備幹部青睞喔！",
        },
      ],
    },
  ];
  let rpCursor = 0;

  // ── 100% 官網實證知識檢索與回答引擎（嚴格基於 OFFICIAL 與 policies.json）
  function answerOfficialQuestion(rawQuery, speaker) {
    const q = String(rawQuery || "").trim();
    const ql = q.toLowerCase();
    const htl = window.__htl;
    const D = htl?.D;
    const facMetaList = htl?.FACULTY || [];
    const av = window.heartIslandAvatar;

    const findBldg = (id) => av?.buildings?.find((b) => b.id === id) || null;
    const makeNavAction = (bId, customLabel) => {
      const b = findBldg(bId);
      if (!b) return null;
      return {
        label: customLabel || `🧭 帶我前往「${b.name}」`,
        onClick: () => {
          closeNpcModal();
          av?.api?.goToPoint?.(b.cx, b.cz, `前往：${b.name}`, () => {
            window.heartCity?.selectBuilding?.(b.id);
          });
        },
      };
    };

    // 1. 檢查是否詢問特定師長（動態比對 OFFICIAL.faculty，絕不硬編碼）
    const matchedTeacher = (OFFICIAL.faculty || []).find((f) => q.includes(f.name))
      || (speaker?.facultyData && /分機|信箱|email|聯絡|研究室|專長|研究|課程|教什麼|開什麼課|哪位|您是|自我介紹/i.test(q) ? speaker.facultyData : null);

    if (matchedTeacher) {
      const fm = facMetaList.find((x) => txt(x.name) === matchedTeacher.name);
      const specs = [...new Set([...(matchedTeacher.specialties || []), ...(matchedTeacher.departmentSpecialties || [])])];
      const courses = matchedTeacher.courses || [];
      const parts = [
        `${matchedTeacher.name}（${matchedTeacher.title}）`,
        specs.length ? `📌 專業與研究領域：${specs.join("、")}。` : "",
        courses.length ? `📚 開設課程包含：${courses.join("、")}。` : "",
        matchedTeacher.education ? `🎓 學歷：${matchedTeacher.education}。` : "",
        `☎️ 聯絡分機：${matchedTeacher.extDisplay}｜✉️ 信箱：${matchedTeacher.email}`,
      ].filter(Boolean);
      const actions = [];
      if (fm?.buildingId) {
        const nav = makeNavAction(fm.buildingId, `🧭 前往${matchedTeacher.name}研究室地標`);
        if (nav) actions.push(nav);
      }
      if (matchedTeacher.departmentProfileUrl || matchedTeacher.profileUrl) {
        actions.push({
          label: "🔗 官方師資專頁 ↗",
          href: matchedTeacher.departmentProfileUrl || matchedTeacher.profileUrl,
        });
      }
      return {
        tag: "官網師資實證資料",
        text: parts.join("\n"),
        actions,
      };
    }

    // 2. 詢問師資陣容總覽
    if (/師資|師長|幾位|教師|系主任/.test(q)) {
      const list = OFFICIAL.faculty || [];
      const chair = list[0];
      const names = list.map((f) => `${f.name}（${f.title}）`).join("、");
      return {
        tag: `餐旅學院師資頁實證（共 ${list.length} 位）`,
        text: `本系目前共有 ${list.length} 位專任（案）師長：${names}。\n${chair ? `現任系主任為 ${chair.name}（分機 ${chair.extDisplay}，信箱 ${chair.email}）。` : ""}\n您可以直接在島上走向任一位師長按 E 請益，或直接輸入師長姓名查詢分機與專長！`,
        actions: [
          { label: "🔗 餐旅學院官方師資頁 ↗", href: OFFICIAL.sources?.faculty },
        ],
      };
    }

    // 3. 詢問 1+3 畢業門檻與證照
    if (/1\+3|畢業門檻|畢業條件|證照|檢定|多益|英檢|外語/.test(ql)) {
      const isl = D?.islands?.find((i) => i.id === "culture");
      const summary = isl ? txt(isl.summary) : "";
      const bFacts = isl ? isl.buildings.slice(0, 4).map((b) => `• ${txt(b.name)}：${txt(b.plain) || txt(b.facts?.[0])}`).join("\n") : "";
      const firstBldg = isl?.buildings?.[0]?.id;
      const actions = [];
      if (firstBldg) {
        const nav = makeNavAction(firstBldg, "🧭 帶我前往「1+3 畢業門檻島」");
        if (nav) actions.push(nav);
      }
      actions.push({
        label: "🛂 開啟護照 1+3 試算器",
        onClick: () => {
          closeNpcModal();
          window.__htlPassport?.open?.();
        },
      });
      return {
        tag: "官網畢業條件標準表",
        text: `高餐旅館管理系著名的「1+3 畢業條件」核心為「1 張畢業證書 + 3 張相關證照」（含外語能力檢定、餐旅專業證照與資訊軟體應用證照等規範，依入學年度畢業條件標準表為準）。\n${summary}\n${bFacts}`,
        actions,
      };
    }

    // 4. 詢問 09 國內外實習旅館專島（全臺北中南東 24 家星級合作旅館 ＋ 國外跨國奢華實習酒店）
    if (/實習|飯店|酒店|合作|菁英|三明治|大三|海外|國外/.test(q) && !/群賢|會館|校內實習/.test(q)) {
      const partners = OFFICIAL.partners || [];
      const allNames = partners.map((p) => p.name);
      const detail = `• 國內菁英實習計畫 3.0 合作星級旅館（共 ${allNames.length} 家，同島等比例呈現）：${allNames.join("、")}\n• 國（海）外實習與研修：以新加坡為主要成長來源（112–114 學年分別為 13、20、21 人），另有日本實習與澳洲、美加研修（112–114 學年度累計 67 人次）。`;
      const sportIsl = D?.islands?.find((i) => i.id === "sport");
      const firstB = sportIsl?.buildings?.find((b) => b.id === "sport-h01")?.id || sportIsl?.buildings?.[0]?.id || "sport-h01";
      const actions = [];
      if (firstB) {
        const nav = makeNavAction(firstB, "🧭 前往「09 實習旅館專島（25 棟星級飯店）」");
        if (nav) actions.push(nav);
      }
      if (OFFICIAL.partnersUrl) {
        actions.push({ label: `🔗 官網合作機構名錄（國內 ${partners.length} 家）↗`, href: OFFICIAL.partnersUrl });
      }
      return {
        tag: `09 國內外實習旅館專島（全臺 ${partners.length} 家 ＋ 海外實習與研修）`,
        text: `本系採高餐特色「三明治教學」，大一、大二於第 06 島校內實習旅館「群賢會館」打底，大三實施全學年國內外校外實習，「09 國內外實習旅館專島」於「09 實習旅館專島」不分區呈現校內群賢會館與 24 家合作旅館共 25 棟等比例星級大樓，外圍海域並環繞海外實習據點：\n${detail}`,
        actions,
      };
    }

    // 5. 詢問群賢會館（第 06 島：校內實習旅館）
    if (/群賢|會館|校內實習|實習旅館/.test(q)) {
      const qb = D?.islands?.flatMap((i) => i.buildings).find((b) => b.id === "family-station" || txt(b.name).includes("群賢"));
      const actions = [];
      if (qb) {
        const nav = makeNavAction(qb.id, `🧭 帶我走訪「${txt(qb.name)}」`);
        if (nav) actions.push(nav);
      }
      actions.push({ label: "🔗 群賢會館相關法規 ↗", href: "https://hotel.nkuht.edu.tw/p/403-1018-608.php?Lang=zh-tw" });
      return {
        tag: "校內實習旅館・群賢會館",
        text: `「群賢會館」是高餐大校內實習旅館，讓學生在大一、大二階段即能在真實營運環境中演練客務接待、房務管理與館內服務流程，為大三前往國際品牌酒店校外實習奠定紮實基礎！${qb ? `\n📌 重點：${txt(qb.plain) || txt(qb.facts?.[0])}` : ""}`,
        actions,
      };
    }

    // 6. 詢問 D 棟 8 樓數位智慧服務與創新基地 / PMS / OPERA / AIoT 機器人
    if (/d808|創新基地|機器人|aiot|智慧客房|共創聯盟/.test(ql)) {
      const actions = [];
      const nav = makeNavAction("innovation-base", "🧭 前往「19 數位智慧服務與創新基地島（D 棟 8 樓）」");
      if (nav) actions.push(nav);
      actions.push({ label: "🔗 本系介紹與特殊設備 ↗", href: "https://hotel.nkuht.edu.tw/p/412-1018-6657.php?Lang=zh-tw" });
      return {
        tag: "19 數位智慧服務與創新基地（D 棟 8 樓）",
        text: "D 棟 8 樓「餐旅數位智慧服務與創新基地」於 114 年 3 月揭牌，設有 D808 智能服務中心、D803 數位轉型教室等空間，配置 AI 語音助理、服務型機器人、TMS 任務管理、智慧門鎖與清潔機器人，並與「國際奢華旅館智能科技服務共創聯盟」科技夥伴合作、辦理 OPERA 系列研習！",
        actions,
      };
    }

    if (/奢華|微學分|金鑰匙|管家|神秘客|clefs|butler/.test(ql)) {
      const actions = [];
      const nav = makeNavAction("luxury-micro", "🧭 前往「18 奢華體驗與金鑰匙管家島」");
      if (nav) actions.push(nav);
      actions.push({ label: "🔗 課程標準表專區 ↗", href: "https://hotel.nkuht.edu.tw/p/412-1018-2489.php?Lang=zh-tw" });
      return {
        tag: "18 奢華體驗與金鑰匙管家（雙主軸亮點）",
        text: "呼應本系「智慧旅館科技 × 奢華體驗管理」雙主軸，開設 8 門奢華體驗管理微學分（皆已完成三級三審）：113-2 人格特質剖析與旅館職業、行為面談解析及實務應用、國際連鎖品牌導論及領導統御、奢華酒店管家服務；114-1 旅館禮賓諮詢技巧、客房向上銷售技巧；114-2 實習職前準備與職場認知、國際品牌連鎖旅館發展史。並推動 S1「Gold Touch 金鑰匙管家款待服務培訓」（10 梯次 234 人次）與 S3 實習旅館神秘客培訓與反饋！",
        actions,
      };
    }

    if (/永續|esg|iso|碳盤查|碳足跡|usr|頂尖科學家|國科會/.test(ql)) {
      const actions = [];
      const nav = makeNavAction("esg-iso", "🧭 前往「20 永續旅宿治理、研發與 USR 島」");
      if (nav) actions.push(nav);
      actions.push({ label: "🔗 專任師資學術實績 ↗", href: "https://shm.nkuht.edu.tw/p/412-1016-854.php?Lang=zh-tw" });
      return {
        tag: "20 永續旅宿治理、研發與 USR",
        text: "本系開設「智慧餐旅永續營運治理」課程（ISO 14064 等永續治理），並承接企業 ISO 14064 溫室氣體盤查產學案；沙荃老師曾主持交通部觀光局（現觀光署）委託「星級旅館評鑑制度革新之研究」，許孟鈞老師主持國科會 114–115 年 SLM／RAG 對話式餐旅機器人計畫；楊仁德教授曾入選 2021–2023 年發布之「全球前 2% 科學家」單年度榜，學生並至金山、龍目、華山國小辦理陪伴活動！",
        actions,
      };
    }

    if (/pms|opera|德安|資訊|系統|電腦|智慧/.test(ql)) {
      const targetB = D?.islands?.flatMap((i) => i.buildings).find((b) => /OPERA|德安|資訊|PMS/i.test(JSON.stringify(b)));
      const actions = [];
      if (targetB) {
        const nav = makeNavAction(targetB.id, `🧭 前往「${txt(targetB.name)}」`);
        if (nav) actions.push(nav);
      }
      return {
        tag: "旅宿資訊系統教學",
        text: targetB
          ? `本系重視國際與本土旅宿資訊系統雙軌實作：${txt(targetB.plain) || txt(targetB.facts?.[0])}`
          : "本系課程結合旅宿資訊系統（含國際飯店常用 PMS 與國內德安資訊系統實務），強化訂房、排房、客史與營收管理數位能力。",
        actions,
      };
    }

    // 7. 詢問系辦聯絡方式、地址、電話
    if (/系辦|電話|地址|在哪|怎麼去|傳真|聯絡/.test(q)) {
      const c = OFFICIAL.contact || {};
      return {
        tag: "系辦公室官方聯絡資訊",
        text: `📍 系辦位置：${c.address || ""}\n☎️ 聯絡電話：${c.phone || ""}\n📠 傳真：${c.fax || ""}`,
        actions: [{ label: "🔗 旅館管理系官網首頁 ↗", href: OFFICIAL.sources?.department }],
      };
    }

    // 8. 全域搜尋 policies.json 所有主題島與細項關鍵字
    if (D?.islands) {
      const tokens = q.replace(/[？?！!。，,、\s]+/g, " ").split(" ").filter((t) => t.length >= 2);
      let bestB = null, bestScore = 0;
      for (const isl of D.islands) {
        for (const b of isl.buildings) {
          const hay = `${txt(b.name)} ${txt(b.plain)} ${(b.facts || []).map(txt).join(" ")}`.toLowerCase();
          let sc = 0;
          if (hay.includes(ql) && ql.length >= 2) sc += 6;
          for (const tk of tokens) {
            if (txt(b.name).toLowerCase().includes(tk.toLowerCase())) sc += 4;
            else if (hay.includes(tk.toLowerCase())) sc += 2;
          }
          if (sc > bestScore) {
            bestScore = sc;
            bestB = { b, isl };
          }
        }
      }
      if (bestB && bestScore >= 2) {
        const { b, isl } = bestB;
        const factsTxt = (b.facts || []).slice(0, 2).map((f) => `• ${txt(f)}`).join("\n");
        const nav = makeNavAction(b.id, `🧭 帶我走向「${txt(b.name)}」`);
        const actions = nav ? [nav] : [];
        if (b.sources?.[0]?.url) {
          actions.push({ label: "🔗 官方資料出處 ↗", href: b.sources[0].url });
        }
        return {
          tag: `${txt(isl.name)}・官網實證`,
          text: `關於「${txt(b.name)}」：\n${txt(b.plain) || ""}\n${factsTxt}`.trim(),
          actions,
        };
      }
    }

    // 9. 嚴守零幻覺原則：不在官網明文範圍內的問題，誠實說明並提供系網與系辦電話
    const c = OFFICIAL.contact || {};
    return {
      tag: "官方資料查證提醒",
      text: `這個問題涉及最新年度簡章或個別行政細節，為確保資訊 100% 準確不誤導，建議直接參閱國立高雄餐旅大學旅館管理系官網公告，或致電系辦公室（${c.phone || "07-8060505"}）查詢。\n您也可以問我：「1+3 畢業條件」、「大三菁英實習飯店」、「群賢會館」、「師資陣容」或「OPERA 系統」！`,
      actions: [
        { label: "🔗 旅館管理系官網 ↗", href: OFFICIAL.sources?.department || "https://hotel.nkuht.edu.tw/?Lang=zh-tw" },
      ],
    };
  }

  // NPC 回答一律由本地「官網實證引擎」產生：只依據 official-data.js，不呼叫任何外部 AI 服務、不需金鑰、
  // 提問內容不離開使用者瀏覽器（資料最小化，ISO/IEC 27001 Annex A 5.34、8.12）。
  async function queryNpcReply(question, speaker) {
    return answerOfficialQuestion(question, speaker);
  }

  // ==========================================================================
  // UI 建構：1) RPG NPC 對話視窗  2) 頭頂名牌圖層  3) 多人旅伴廣場抽屜
  // ==========================================================================
  const peerLayer = h("div", { class: "is-peer-layer", "aria-hidden": "true" });
  document.body.append(peerLayer);

  // ── 1) RPG NPC 對話視窗
  const npcAvatarEl = h("div", { class: "is-npc-avatar" }, "🎩");
  const npcEyebrowEl = h("div", { class: "is-npc-eyebrow" }, "CONCIERGE DIALOGUE");
  const npcNameText = h("span", {}, "");
  const npcBadgeEl = h("span", { class: "is-npc-badge" }, "");
  const npcNameEl = h("h3", { class: "is-npc-name" }, npcNameText, npcBadgeEl);
  const npcSubEl = h("div", { class: "is-npc-sub" }, "");

  const npcVoiceBtn = h("button", { class: "is-btn-top", type: "button", style: "display:none" }, "🔊 語音導覽");
  const npcCardBtn = h("button", { class: "is-btn-top", type: "button" }, "📄 完整卡片");
  const npcCloseBtn = h("button", { class: "is-btn-close", type: "button", "aria-label": "關閉對話", onclick: () => closeNpcModal() }, "×");

  const npcLogEl = h("div", { class: "is-npc-log", role: "log", "aria-live": "polite" });
  const npcChipsEl = h("div", { class: "is-npc-chips" });
  const npcInputEl = h("input", {
    class: "is-npc-input",
    type: "text",
    maxlength: "100",
    placeholder: "輸入問題請益（如：1+3 證照、菁英實習 3.0）・請勿輸入個人資料",
  });
  const npcFormEl = h(
    "form",
    {
      class: "is-npc-form",
      onsubmit: async (e) => {
        e.preventDefault();
        const q = npcInputEl.value.trim();
        if (!q || !activeNpc) return;
        npcInputEl.value = "";
        await handleAskNpc(q);
      },
    },
    npcInputEl,
    h("button", { class: "is-npc-send", type: "submit" }, "請益送出")
  );

  const npcModalEl = h(
    "div",
    { class: "is-npc-modal", role: "dialog", "aria-modal": "true", onclick: (e) => e.stopPropagation() },
    h(
      "div",
      { class: "is-npc-head" },
      npcAvatarEl,
      h("div", { class: "is-npc-meta" }, npcEyebrowEl, npcNameEl, npcSubEl),
      h("div", { class: "is-npc-actions" }, npcVoiceBtn, npcCardBtn, npcCloseBtn)
    ),
    npcLogEl,
    npcChipsEl,
    npcFormEl
  );
  const npcBackdropEl = h("div", { class: "is-npc-backdrop", onclick: () => closeNpcModal() }, npcModalEl);
  document.body.append(npcBackdropEl);

  let activeNpc = null;
  let npcKeepAliveTimer = null;

  function appendNpcMessage(role, text, opts = {}) {
    const msg = h("div", { class: `is-msg ${role}` });
    if (opts.tag) {
      msg.append(h("div", { class: "is-msg-tag" }, `✅ ${opts.tag}`));
    }
    const lines = String(text || "").split("\n");
    lines.forEach((ln, idx) => {
      if (idx > 0) msg.append(h("br"));
      msg.append(document.createTextNode(ln));
    });
    if (opts.actions && opts.actions.length) {
      const bar = h("div", { class: "is-msg-links" });
      for (const act of opts.actions) {
        if (act.href) {
          bar.append(
            h("a", { class: "is-msg-go", href: act.href, target: "_blank", rel: "noopener noreferrer" }, act.label)
          );
        } else if (typeof act.onClick === "function") {
          bar.append(
            h("button", { class: "is-msg-go", type: "button", onclick: act.onClick }, act.label)
          );
        }
      }
      msg.append(bar);
    }
    npcLogEl.append(msg);
    npcLogEl.scrollTop = npcLogEl.scrollHeight;
  }

  function startRoleplayInModal() {
    const sc = ROLEPLAY_SCENARIOS[rpCursor % ROLEPLAY_SCENARIOS.length];
    rpCursor++;
    appendNpcMessage("me", "我想進行「五星禮賓情境演練」！");
    appendNpcMessage("npc", `${sc.title}\n\n${sc.prompt}`, {
      tag: "高餐款待實務情境演練",
      actions: sc.options.map((opt, idx) => ({
        label: `選項 ${idx + 1}：${opt.label.slice(0, 22)}…`,
        onClick: () => {
          appendNpcMessage("me", opt.label);
          if (opt.ok) {
            window.__htlPassport?.sfx?.bell?.();
            window.heartIslandAvatar?.api?.triggerEmote?.("bow");
            appendNpcMessage("npc", `🎉 ${opt.reply}`, {
              tag: "演練通過・五星款待認證",
              actions: [
                { label: "🛎️ 再挑戰下一題情境", onClick: () => startRoleplayInModal() },
              ],
            });
          } else {
            appendNpcMessage("npc", `💡 ${opt.reply}`, {
              tag: "師長溫馨指導",
              actions: [
                { label: "🔄 重新思考本題或其他情境", onClick: () => startRoleplayInModal() },
              ],
            });
          }
        },
      })),
    });
  }

  async function handleAskNpc(question) {
    if (!activeNpc) return;
    keepNpcFacingPlayer();
    appendNpcMessage("me", question);
    const ans = await queryNpcReply(question, activeNpc);
    window.__htlPassport?.sfx?.stamp?.();
    appendNpcMessage("npc", ans.text, { tag: ans.tag, actions: ans.actions });
  }

  function keepNpcFacingPlayer() {
    if (!activeNpc || activeNpc.walkerIndex == null) return;
    const hc = window.heartCity;
    const av = window.heartIslandAvatar;
    const myPos = av?.S?.fig?.group?.position;
    if (hc?.engageWalker && myPos) {
      hc.engageWalker(activeNpc.walkerIndex, myPos.x, myPos.z, 18000);
    }
  }

  function setNpcPortrait(walkerIndex, fallbackEmoji = "🎩") {
    npcAvatarEl.replaceChildren();
    const url = walkerIndex != null ? window.heartCity?.getWalkerPortrait?.(walkerIndex) : null;
    if (url) {
      npcAvatarEl.append(h("img", { src: url, alt: "NPC Portrait" }));
    } else {
      npcAvatarEl.textContent = fallbackEmoji;
    }
  }

  function openNpcModalBase(cfg) {
    activeNpc = cfg;
    clearInterval(npcKeepAliveTimer);
    keepNpcFacingPlayer();
    npcKeepAliveTimer = setInterval(keepNpcFacingPlayer, 4000);

    // 讓玩家自己的角色也轉向這位 NPC 禮貌致意
    const av = window.heartIslandAvatar;
    if (av?.S?.fig?.group && cfg.worldPos) {
      const g = av.S.fig.group;
      g.rotation.y = Math.atan2(cfg.worldPos.x - g.position.x, cfg.worldPos.z - g.position.z);
    }

    setNpcPortrait(cfg.walkerIndex, cfg.emoji || "🎩");
    npcEyebrowEl.textContent = cfg.eyebrow || "NKUHT HOSPITALITY DIALOGUE";
    npcNameText.textContent = cfg.name;
    npcBadgeEl.textContent = cfg.badge || "";
    npcSubEl.textContent = cfg.sub || "";

    if (cfg.onVoice) {
      npcVoiceBtn.style.display = "";
      npcVoiceBtn.onclick = cfg.onVoice;
    } else {
      npcVoiceBtn.style.display = "none";
    }
    if (cfg.onCard) {
      npcCardBtn.style.display = "";
      npcCardBtn.textContent = cfg.cardLabel || "📄 完整卡片";
      npcCardBtn.onclick = () => {
        const fn = cfg.onCard;
        closeNpcModal();
        fn();
      };
    } else {
      npcCardBtn.style.display = "none";
    }

    npcLogEl.replaceChildren();
    appendNpcMessage("npc", cfg.greeting, { tag: cfg.greetingTag, actions: cfg.greetingActions });

    npcChipsEl.replaceChildren();
    for (const chip of cfg.chips || []) {
      npcChipsEl.append(
        h(
          "button",
          {
            class: "is-q-chip" + (chip.gold ? " gold" : ""),
            type: "button",
            onclick: () => {
              if (chip.onClick) chip.onClick();
              else if (chip.q) handleAskNpc(chip.q);
            },
          },
          chip.label
        )
      );
    }

    npcFormEl.style.display = cfg.hideInput ? "none" : "";
    npcBackdropEl.classList.add("open");
    window.__htlPassport?.sfx?.bell?.();
  }

  function closeNpcModal() {
    if (!npcBackdropEl.classList.contains("open")) return false;
    npcBackdropEl.classList.remove("open");
    clearInterval(npcKeepAliveTimer);
    if (activeNpc?.walkerIndex != null) {
      window.heartCity?.engageWalker?.(activeNpc.walkerIndex, 0, 0, 0);
    }
    activeNpc = null;
    return true;
  }

  // 開啟專任師長或群賢館長沉浸式對話
  function openTeacherDialogue(teacherRef) {
    const hc = window.heartCity;
    const htl = window.__htl;
    if (!teacherRef) return;

    if (teacherRef.kind === "lord" || teacherRef.id === "lord") {
      openNpcModalBase({
        walkerIndex: teacherRef.walkerIndex,
        worldPos: { x: teacherRef.x, z: teacherRef.z },
        emoji: "👑",
        eyebrow: "QUNXIAN PRACTICUM HOTEL · 彩蛋人物",
        name: "群賢館長",
        badge: "五星款待領航員",
        sub: `巡視全島 ${htl?.D?.islands?.length || 20} 座主題島嶼 · 守護高餐款待初心`,
        greetingTag: "群賢會館禮賓接待",
        greeting: "歡迎蒞臨高餐大旅館管理系群島！我是巡島的群賢館長。無論想了解校內實習旅館「群賢會館」、大三「菁英實習計畫 3.0」或「1+3 畢業條件」，都可以隨時問我，或來場五星禮賓情境演練！",
        onCard: teacherRef.walkerIndex != null ? () => hc?.selectWalker?.(teacherRef.walkerIndex) : null,
        cardLabel: "📄 館長介紹卡",
        chips: [
          { label: "🛎️ 禮賓情境演練", gold: true, onClick: () => startRoleplayInModal() },
          { label: "🏨 群賢會館介紹", q: "群賢會館校內實習在做什麼？" },
          { label: "🌟 菁英實習 3.0 飯店", q: "大三菁英實習合作飯店有哪些？" },
          { label: "📜 1+3 畢業條件", q: "請問 1+3 畢業條件怎麼規定？" },
        ],
      });
      return;
    }

    const facMeta = (htl?.FACULTY || []).find((f) => f.id === teacherRef.id);
    const tName = txt(facMeta?.name || teacherRef.name);
    const offData = (OFFICIAL.faculty || []).find((f) => f.name === tName) || null;
    const specs = offData
      ? [...new Set([...(offData.specialties || []), ...(offData.departmentSpecialties || [])])]
      : [];
    const courses = offData?.courses || [];

    const introLines = [
      `同學你好！我是${tName}${offData ? `（${offData.title}）` : ""}，歡迎來到旅館管理系 3D 學習群島！`,
      specs.length ? `我的專業領域涵蓋「${specs.slice(0, 4).join("、")}」${courses.length ? `，並授課「${courses.slice(0, 3).join("、")}」` : ""}。` : "",
      facMeta?.quote?.zh ? `「${facMeta.quote.zh}」` : "",
      "想詢問課程規劃、研究室聯絡分機、1+3 畢業證照或大三實習方向，請直接點選下方主題或自由提問！",
    ].filter(Boolean);

    const av = window.heartIslandAvatar;
    const bldg = facMeta?.buildingId ? av?.buildings?.find((b) => b.id === facMeta.buildingId) : null;
    const greetingActions = [];
    if (bldg) {
      greetingActions.push({
        label: `🧭 帶我前往「${bldg.name}」`,
        onClick: () => {
          closeNpcModal();
          av?.api?.goToPoint?.(bldg.cx, bldg.cz, `前往：${bldg.name}`, () => hc?.selectBuilding?.(bldg.id));
        },
      });
    }

    openNpcModalBase({
      teacherId: teacherRef.id,
      facultyData: offData,
      walkerIndex: teacherRef.walkerIndex,
      worldPos: { x: teacherRef.x, z: teacherRef.z },
      emoji: "🎓",
      eyebrow: "FACULTY OFFICE HOURS · 師門請益",
      name: tName,
      badge: offData?.title || txt(facMeta?.shortTitle) || "本系專任師資",
      sub: offData ? `分機 ${offData.extDisplay} · ${offData.email}` : "",
      greetingTag: "官網師資實證檔案",
      greeting: introLines.join("\n"),
      greetingActions,
      onVoice: () => hc?.speakTeacher?.(teacherRef.id, "zh"),
      onCard: () => hc?.selectTeacher?.(teacherRef.id),
      cardLabel: "📄 完整師資卡",
      chips: [
        { label: "🛎️ 禮賓情境演練", gold: true, onClick: () => startRoleplayInModal() },
        { label: "🎓 您的專長與聯絡分機", q: `請問${tName}的研究專長、課程與聯絡分機？` },
        { label: "🌟 大三菁英實習飯店", q: "請問大三菁英實習計畫 3.0 合作飯店有哪些？" },
        { label: "📜 1+3 畢業門檻", q: "請問 1+3 畢業條件有哪些證照規定？" },
        { label: "💻 旅宿資訊系統 PMS", q: "系上會教 OPERA 或德安資訊系統嗎？" },
      ],
    });
  }

  // 開啟校園學長姐／實習幹部／儲備幹部 NPC 對話
  function openWalkerDialogue(wInfo) {
    const hc = window.heartCity;
    if (!wInfo) return;
    const roleTitle = wInfo.roleLabel || "旅館系學長姐";
    const routeDesc = wInfo.flowTitle ? `目前正沿著「${wInfo.flow}・${wInfo.flowTitle}」協作動線前進` : "正在高餐旅館系群島間巡禮交流";
    const carryHint = wInfo.carryLabel ? `（隨身任務：${wInfo.carryLabel}）` : "";

    openNpcModalBase({
      walkerIndex: wInfo.walkerIndex,
      worldPos: { x: wInfo.x, z: wInfo.z },
      emoji: "🧑‍💼",
      eyebrow: `CAMPUS SENIOR & INTERN · ${wInfo.flow || "HTL"}`,
      name: roleTitle,
      badge: wInfo.carryLabel || "校園實務導覽",
      sub: `${routeDesc}${carryHint}`,
      greetingTag: "學長姐第一線經驗分享",
      greeting: `嗨！學弟妹／訪客你好 👋 我是島上的「${roleTitle}」，${routeDesc}。\n我們大一、大二會在校內群賢會館與專業教室打底，大三透過菁英實習 3.0 前往國內外星級酒店實習！有任何系上學習或實習問題都可以問我喔！`,
      onCard: wInfo.flow ? () => hc?.selectFlow?.(wInfo.flow) : () => hc?.selectWalker?.(wInfo.walkerIndex),
      cardLabel: "📄 查看協作路線卡",
      chips: [
        { label: "🛎️ 禮賓情境演練", gold: true, onClick: () => startRoleplayInModal() },
        { label: "🏨 群賢會館實作經驗", q: "群賢會館校內實習在做什麼？" },
        { label: "🌟 24 家菁英實習合作旅館", q: "請問大三菁英實習合作飯店有哪些？" },
        { label: "📜 1+3 證照準備攻略", q: "1+3 畢業條件怎麼準備？" },
        { label: "👩‍🏫 系上有哪些專任師長？", q: "請問系上師資陣容有哪些師長？" },
      ],
    });
  }

  // 旅伴交誼島的兩位接待 NPC（plaza-island.js）：只回答官網資料（answerOfficialQuestion），不開系所卡片
  function openHostDialogue({ kind = "announcer", x = 0, z = 0 } = {}) {
    const announcer = kind === "announcer";
    openNpcModalBase({
      walkerIndex: undefined,
      worldPos: { x, z },
      emoji: announcer ? "📣" : "🛎️",
      eyebrow: "HTL PLAZA ISLAND",
      name: announcer ? tr("旅館系公告員", "Department announcer") : tr("迎賓禮賓員", "Welcome concierge"),
      badge: tr("旅伴交誼島", "Plaza island"),
      sub: announcer ? tr("播報官網上的系上活動與實習公告", "Reads out the activities and internship notices on the department site") : tr("歡迎來到旅伴交誼島，有問題都可以問我", "Welcome to the plaza island — ask me anything"),
      greetingTag: announcer ? tr("系上公告", "Notices") : tr("迎賓", "Welcome"),
      greeting: announcer
        ? tr("你好！我會輪流播報旅館系官網的系上活動與實習公告。想知道課程、師資、實習或畢業條件，直接問我就好。", "Hello! I read out the department's activities and internship notices. Ask me about courses, faculty, internships or graduation requirements.")
        : tr("歡迎光臨旅伴交誼島！這裡空曠好聊天，也可以在公告牆發固定選項的公告找夥伴。", "Welcome to the plaza island! Plenty of room to chat — post a notice on the board to find company."),
      chips: [
        { label: tr("系上有哪些專任師長？", "Who are the faculty?"), q: "請問系上師資陣容有哪些師長？" },
        { label: tr("菁英實習合作旅館", "Partner hotels"), q: "請問大三菁英實習合作飯店有哪些？" },
        { label: tr("1+3 畢業條件", "1+3 graduation"), q: "1+3 畢業條件怎麼準備？" },
        { label: tr("群賢會館", "Elite House"), q: "群賢會館校內實習在做什麼？" },
      ],
    });
  }

  // ==========================================================================
  // Phase 3: 多人即時旅伴廣場（預設自動連上 Cloudflare 雲端廣場 + BroadcastChannel 本機秒同步）
  // ==========================================================================
  const DEFAULT_CLOUD_WS_URL = "wss://htl-island-plaza.dr-jacqueshsu.workers.dev/ws";
  const peers = new Map(); // peerId -> peerEntry
  // 第五期 multiplayer games (plaza-games.js): shown only when the server announces them in its "caps" packet
  const plazaGames = installPlazaGames({
    // game packets go to the server only (never to this browser's other tabs over BroadcastChannel)
    sendServer: (pkt) => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        try {
          ws.send(JSON.stringify(pkt));
        } catch {}
      }
    },
    peers: () => peers,
    myId: () => SESSION_ID,
    tr: (zh, en) => tr(zh, en), // tr is declared further down this file
    h,
    uiIcon,
    english: typeof isEn === "function" ? isEn() : new URLSearchParams(location.search).get("lang") === "en",
    notice: (text) => appendChatLog("", text, true),
    noticeRow: (text, actions) => {
      const row = h(
        "div",
        { class: "is-chat-row sys pg-notice" },
        text,
        h(
          "span",
          { class: "is-dm-actions" },
          ...actions.map(([label, fn]) =>
            h("button", {
              type: "button",
              class: "is-roster-go",
              onclick: () => {
                row.querySelectorAll("button").forEach((b) => (b.disabled = true));
                fn();
              },
            }, label),
          ),
        ),
      );
      chatListEl.append(row);
      trimChatLog();
      if (!plazaDrawer.classList.contains("open") || plazaTab !== "chat") tabChatDot.hidden = false;
    },
    startFollow: (p) => startFollow(p),
    refresh: () => scheduleRoster(),
    openChat: () => {
      toggleChat(true);
      setPlazaTab("chat");
    },
  });
  // 只接受 ROOMS 內的房間，與 Worker 的房間白名單一致；否則伺服器會把連線放進 lobby，
  // 而本機仍以原房名過濾封包，結果看不到任何人。
  const knownRoom = (v) => (ROOMS.some((r) => r.id === v) ? v : "");
  let currentRoom = (() => {
    const qRoom = knownRoom(new URLSearchParams(location.search).get("room") || "");
    if (qRoom) return qRoom;
    try {
      return knownRoom(localStorage.getItem(STORAGE_ROOM_KEY) || "") || "lobby";
    } catch {
      return "lobby";
    }
  })();
  // 網址參數 ?ws= 可能來自他人分享的連結：只接受官方伺服器、本機或區網位址（scripts/plaza_server.py），
  // 避免釣魚連結把訪客導向第三方伺服器。手動在「⚙️ 網路」輸入的位址屬使用者自主決定，不受此限。
  const wsHost = (u) => {
    try {
      return new URL(String(u).replace(/^ws(s?):/i, "http$1:")).hostname;
    } catch {
      return "";
    }
  };
  const isOfficialWs = (u) => wsHost(u) === wsHost(DEFAULT_CLOUD_WS_URL);
  // key 只送往官方伺服器與本機（loopback）開發伺服器；區網位址可能來自釣魚連結，不送 key（R-06）
  const isLoopbackWs = (u) => /^(localhost|127\.\d+\.\d+\.\d+)$/.test(wsHost(u));
  const isLocalWs = (u) => /^(localhost|127\.\d+\.\d+\.\d+|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+)$/.test(wsHost(u));
  let customWsUrl = (() => {
    const qWs = new URLSearchParams(location.search).get("ws");
    if (qWs !== null) {
      const v = qWs.trim();
      if (!v || v === "off" || v === "local" || v === "0") return "";
      if (isOfficialWs(v) || isLocalWs(v)) return v;
      console.warn("[plaza] ignored untrusted ?ws= server:", v);
      return DEFAULT_CLOUD_WS_URL;
    }
    if (window.HTL_PLAZA_WS_URL) return window.HTL_PLAZA_WS_URL;
    try {
      const saved = (localStorage.getItem(STORAGE_WS_KEY) || "").trim();
      if (saved === "off" || saved === "local") return "";
      if (saved) return saved;
    } catch {}
    return DEFAULT_CLOUD_WS_URL;
  })();

  let bc = null;
  let ws = null;
  let wsState = "off"; // 'off' | 'connecting' | 'open' | 'retry' | 'offline'
  let wsReconnectTimer = null;
  let wsPingTimer = null;
  let wsFails = 0; // 連續失敗次數：指數退避 2s→4s→8s→16s→30s，超過上限改為「離線」並顯示手動重試鈕
  let wsRetryAt = 0;
  const WS_MAX_AUTO_RETRY = 6;
  let pktSeq = 0;
  // 封包去重 id 加上每次載入頁面的隨機碼：同一身分重新整理或重開分頁後，計數器從 0 重來也不會被當成重複封包而丟棄
  const PAGE_NONCE = randToken(6);
  const seenPktIds = new Set();
  let lastNetSendAt = 0;
  let lastSentSnap = { x: 0, z: 0, yaw: 0, moving: false };
  let lastChatAt = 0;
  let lastDmAt = 0;
  let leftPlaza = false; // 使用者按「離開廣場」：不留離線角色、停止連線，直到按「重新加入」
  let dmTarget = null; // { id, name }：輸入框目前的私訊對象
  const STORAGE_DM_OFF = "htl-plaza-dm-off";
  const STORAGE_BLOCKED = "htl-plaza-blocked";
  let dmClosed = (() => {
    try {
      return localStorage.getItem(STORAGE_DM_OFF) === "1";
    } catch {
      return false;
    }
  })();
  const blockedIds = new Set(
    (() => {
      try {
        const v = JSON.parse(localStorage.getItem(STORAGE_BLOCKED) || "[]");
        return Array.isArray(v) ? v.filter((x) => typeof x === "string" && ID_OK.test(x)).slice(-100) : [];
      } catch {
        return [];
      }
    })()
  );
  const saveBlocked = () => {
    try {
      localStorage.setItem(STORAGE_BLOCKED, JSON.stringify([...blockedIds].slice(-100)));
    } catch {}
  };
  const chatSendTimes = []; // 用戶端也做節流：1.1 秒間隔 + 15 秒內最多 5 則
  let lastChatText = "";
  let lastChatTextAt = 0;
  let lastEmoteAt = 0;
  let unreadCount = 0;
  let followId = null; // 正在跟隨的夥伴 id（僅本機，不上線路）
  let followLastTarget = null;
  let followLastIssue = 0;
  let pendingEmoteTarget = null; // 下一次 broadcastEmote 帶上的 targetId（對特定夥伴揮手）
  const CHAT_MAX = 80;

  const STORAGE_MUTE_KEY = "htl-plaza-muted";
  const mutedIds = (() => {
    try {
      const arr = JSON.parse(localStorage.getItem(STORAGE_MUTE_KEY) || "[]");
      return new Set(Array.isArray(arr) ? arr.slice(0, 200) : []);
    } catch {
      return new Set();
    }
  })();
  const saveMuted = () => {
    try {
      localStorage.setItem(STORAGE_MUTE_KEY, JSON.stringify([...mutedIds].slice(-200)));
    } catch {}
  };

  // ── 中英雙語：介面語系可能在執行中切換，凡用 L() 設定的文字都會在 relabel() 時重新套用
  const isEnUI = () => document.documentElement.lang === "en" || new URLSearchParams(location.search).get("lang") === "en";
  const tr = (zh, en) => (isEnUI() ? en : zh);
  const labelRegs = [];
  const L = (el, zh, en, attr = null) => {
    labelRegs.push([el, zh, en, attr]);
    if (attr) el.setAttribute(attr, tr(zh, en));
    else el.textContent = tr(zh, en);
    return el;
  };
  const relabelHooks = []; // 依狀態決定文字的元素（例如私訊模式下的輸入框）在 relabel() 後重新套用
  const relabel = () => {
    for (const [el, zh, en, attr] of labelRegs) {
      if (attr) el.setAttribute(attr, tr(zh, en));
      else el.textContent = tr(zh, en);
    }
    for (const fn of relabelHooks) fn();
  };
  const isCoarse = () => matchMedia("(pointer:coarse), (max-width: 800px)").matches;

  const ROOM_EN = { lobby: "Lobby", freshman: "Freshman Tour", intern: "Internship Lounge" };
  const roomLabel = (id) => {
    const rm = ROOMS.find((r) => r.id === id);
    return rm ? tr(rm.label, ROOM_EN[id] || rm.label) : id;
  };

  // 禮貌短句（快速回覆小膠囊；不含任何系所事實）
  const SHORT_PHRASES = [
    ["你好！👋", "Hi! 👋"],
    ["謝謝！🙏", "Thank you! 🙏"],
    ["跟我來！🚶", "Follow me! 🚶"],
    ["等我一下 ⏳", "Wait for me ⏳"],
    ["一起逛逛吧！", "Let's explore together!"],
    ["再見！👋", "Bye! 👋"],
  ];

  const EMOTES = [
    { kind: "wave", ico: "👋", icon: "wave", zh: "揮手", en: "Wave", key: "1" },
    { kind: "bow", ico: "🙇", icon: "bow", zh: "鞠躬", en: "Bow", key: "2" },
    { kind: "cheer", ico: "🎉", icon: "sparkle", zh: "歡呼", en: "Cheer", key: "3" },
    { kind: "coffee", ico: "☕", icon: "cup", zh: "舉杯", en: "Toast", key: "4" },
  ];

  // ── 3) 旅伴廣場側欄抽屜 DOM
  const statusDot = h("span", { class: "is-net-dot wait", "aria-hidden": "true" });
  const statusText = h("span", { class: "is-net-text" }, "…");
  const retryBtn = h("button", { class: "is-net-retry", type: "button", hidden: true, onclick: () => retryNow() });
  const plazaStatusEl = h("div", { class: "is-plaza-status", role: "status", "aria-live": "polite" }, statusDot, statusText, retryBtn);
  const netCfgInput = h("input", {
    type: "text",
    inputmode: "url",
    autocomplete: "off",
    spellcheck: "false",
    value: customWsUrl || "off",
  });
  L(netCfgInput, `${DEFAULT_CLOUD_WS_URL}（輸入 off 切為純本機分頁）`, `${DEFAULT_CLOUD_WS_URL} (type off for local tabs only)`, "placeholder");
  const applyNetUrl = (rawVal) => {
    const v = String(rawVal || "").trim();
    if (!v || v.toLowerCase() === "off" || v.toLowerCase() === "local") {
      customWsUrl = "";
      netCfgInput.value = "off";
      try {
        localStorage.setItem(STORAGE_WS_KEY, "off");
      } catch {}
    } else {
      customWsUrl = v;
      netCfgInput.value = v;
      try {
        if (v === DEFAULT_CLOUD_WS_URL) localStorage.removeItem(STORAGE_WS_KEY);
        else localStorage.setItem(STORAGE_WS_KEY, v);
      } catch {}
    }
    wsFails = 0;
    connectWebSocket();
    syncPlazaUI();
  };
  const netCfgBox = h(
    "div",
    { class: "is-plaza-netcfg" },
    L(h("div", {}), "🌐 雲端跨裝置多人伺服器（預設自動連上 Cloudflare 即時廣場；輸入 off 可切為純本機分頁）：", "🌐 Cross-device server (Cloudflare by default; type off for same-browser tabs only):"),
    h(
      "div",
      { class: "is-plaza-netcfg-row" },
      netCfgInput,
      L(h("button", { class: "is-roster-go", type: "button", onclick: () => applyNetUrl(netCfgInput.value) }), "套用", "Apply"),
      L(
        L(h("button", { class: "is-roster-go", type: "button", onclick: () => applyNetUrl(DEFAULT_CLOUD_WS_URL) }), "預設雲端", "Default"),
        "恢復官方預設 Cloudflare 雲端多人伺服器",
        "Restore the default Cloudflare server",
        "title"
      )
    )
  );

  const roomBtns = {};
  const roomsBar = h(
    "div",
    { class: "is-plaza-rooms", role: "tablist" },
    ...ROOMS.map((rm) => {
      const b = h("button", {
        class: "is-room-btn" + (rm.id === currentRoom ? " active" : ""),
        type: "button",
        role: "tab",
        "aria-selected": String(rm.id === currentRoom),
        onclick: () => switchRoom(rm.id),
      });
      b.append(uiIcon(rm.icon), L(h("span", {}), rm.label, ROOM_EN[rm.id] || rm.label));
      roomBtns[rm.id] = b;
      return b;
    })
  );

  const rosterCountEl = h("span", { class: "is-roster-count" });
  const rosterListEl = h("div", { class: "is-roster-list" });
  const rosterEl = h(
    "section",
    { class: "is-plaza-roster" },
    h("div", { class: "is-roster-head" }, L(h("span", {}), "在線名單", "Who's here"), rosterCountEl),
    rosterListEl
  );

  // 表情列：大尺寸觸控鈕（≥44px），桌機 tooltip 顯示快捷鍵
  const emoteBar = h(
    "div",
    { class: "is-plaza-emotes", role: "toolbar" },
    ...EMOTES.map((em) => {
      const b = h(
        "button",
        { class: "is-emote-btn", type: "button", "data-emote": em.kind, onclick: () => doEmote(em.kind) },
        h("span", { class: "is-emote-ico", "aria-hidden": "true" }, uiIcon(em.icon)),
        L(h("span", { class: "is-emote-lbl" }), em.zh, em.en),
        h("kbd", { class: "is-emote-key", "aria-hidden": "true" }, em.key)
      );
      L(b, `${em.zh}（漫遊模式快捷鍵 ${em.key}）`, `${em.en} (shortcut ${em.key} while walking)`, "title");
      L(b, `${em.zh}`, `${em.en}`, "aria-label");
      return b;
    })
  );
  L(emoteBar, "禮賓動作", "Emotes", "aria-label");

  const chatListEl = h("div", { class: "is-plaza-chat", role: "log", "aria-live": "polite" });
  const newMsgPill = h("button", {
    class: "is-chat-newpill",
    type: "button",
    hidden: true,
    onclick: () => {
      chatListEl.scrollTop = chatListEl.scrollHeight;
      newMsgPill.hidden = true;
    },
  });
  L(newMsgPill, "↓ 新訊息", "↓ New messages");
  chatListEl.addEventListener(
    "scroll",
    () => {
      if (isChatNearBottom()) newMsgPill.hidden = true;
    },
    { passive: true }
  );
  const chatWrapEl = h("div", { class: "is-plaza-chatwrap" }, chatListEl, newMsgPill);

  const chatCounterEl = h("span", { class: "is-chat-counter", "aria-hidden": "true" });
  const chatInputEl = h("input", {
    class: "is-plaza-input",
    type: "text",
    maxlength: String(CHAT_MAX),
    enterkeyhint: "send",
    autocomplete: "off",
  });
  chatInputEl.addEventListener("input", () => {
    const n = chatInputEl.value.length;
    chatCounterEl.textContent = n >= CHAT_MAX - 20 ? `${n}/${CHAT_MAX}` : "";
  });
  chatInputEl.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      chatInputEl.blur();
      toggleChat(false);
    }
  });
  const dmPillEl = h("div", { class: "is-dm-pill", hidden: true });
  function setDmTarget(target) {
    dmTarget = target && target.id ? { id: target.id, name: target.name || "夥伴" } : null;
    if (dmTarget) {
      dmPillEl.replaceChildren(
        h("span", {}, `💌 私訊給「${dmTarget.name}」・只有對方看得到，不會保存`),
        h("button", { type: "button", class: "is-dm-pill-x", "aria-label": "取消私訊，改回廣場發言", onclick: () => setDmTarget(null) }, "✕")
      );
      dmPillEl.hidden = false;
    } else {
      dmPillEl.replaceChildren();
      dmPillEl.hidden = true;
    }
    applyChatLabels();
  }
  // 輸入框提示：私訊模式顯示對象，否則為廣場發言（雙語；relabel() 後也會重新套用，不會蓋掉私訊狀態）
  function applyChatLabels() {
    if (dmTarget) {
      chatInputEl.placeholder = tr(`丟水球給「${dmTarget.name}」…`, `Private message to "${dmTarget.name}"…`);
      chatInputEl.setAttribute("aria-label", tr(`私訊給 ${dmTarget.name}`, `Private message to ${dmTarget.name}`));
    } else {
      chatInputEl.placeholder = tr("在廣場發言（所有人可見・請勿留下個人資料・Enter 送出）…", "Say something — visible to everyone, no personal info (Enter to send)…");
      chatInputEl.setAttribute("aria-label", tr("廣場聊天訊息", "Plaza chat message"));
    }
  }
  relabelHooks.push(applyChatLabels);
  applyChatLabels();

  const phrasesBar = h("div", { class: "is-plaza-phrases" });
  const renderPhrases = () => {
    const list = SHORT_PHRASES.map(([zh, en]) => tr(zh, en));
    if (!isEnUI()) list.push(...QUICK_PHRASES);
    phrasesBar.replaceChildren(
      ...list.map((ph, i) =>
        h("button", { class: "is-phrase-btn" + (i < SHORT_PHRASES.length ? " short" : ""), type: "button", onclick: () => sendPlazaChat(ph) }, ph)
      )
    );
  };
  renderPhrases();

  const sendBtn = h("button", { class: "is-npc-send is-plaza-send", type: "submit" }, uiIcon("send"));
  L(sendBtn, "發送", "Send", "aria-label");
  L(sendBtn, "發送", "Send", "title");
  const netBtn = h("button", { class: "is-btn-top is-plaza-netbtn ui-icon-btn", type: "button", onclick: () => netCfgBox.classList.toggle("open") }, uiIcon("settings"));
  L(netBtn, "網路設定：跨裝置 WebSocket 伺服器", "Network: cross-device WebSocket server", "aria-label");
  L(netBtn, "網路設定：跨裝置 WebSocket 伺服器", "Network: cross-device WebSocket server", "title");
  const closeBtn = h("button", { class: "is-btn-close ui-close", type: "button", onclick: () => toggleChat(false) }, uiIcon("close"));
  L(closeBtn, "關閉廣場（Esc）", "Close plaza (Esc)", "aria-label");
  L(closeBtn, "關閉廣場（Esc）", "Close plaza (Esc)", "title");
  const plazaTitleEl = L(h("h3", { class: "is-plaza-title" }), "旅伴互動廣場", "Hotel Island Plaza");

  // 2026-11-14 UX：面板分成「聊天」與「在線」兩頁，聊天區不再被名單與按鈕擠壓
  let plazaTab = "chat";
  const tabChatBtn = h("button", { class: "is-ptab active", type: "button", role: "tab", "aria-selected": "true", onclick: () => setPlazaTab("chat") });
  const tabChatLbl = L(h("span", {}), "聊天", "Chat");
  tabChatBtn.append(uiIcon("chat"));
  const tabChatDot = h("i", { class: "is-ptab-dot", hidden: true, "aria-hidden": "true" });
  tabChatBtn.append(tabChatLbl, tabChatDot);
  const tabPeopleBtn = h("button", { class: "is-ptab", type: "button", role: "tab", "aria-selected": "false", onclick: () => setPlazaTab("people") });
  const tabPeopleCount = h("span", { class: "is-ptab-n" });
  tabPeopleBtn.append(uiIcon("people"), L(h("span", {}), "在線", "People"), tabPeopleCount);
  const tabsBar = h("div", { class: "is-plaza-tabs", role: "tablist" }, tabChatBtn, tabPeopleBtn);
  function setPlazaTab(t) {
    plazaTab = t;
    plazaDrawer.classList.toggle("tab-people", t === "people");
    plazaDrawer.classList.toggle("tab-chat", t === "chat");
    tabChatBtn.classList.toggle("active", t === "chat");
    tabPeopleBtn.classList.toggle("active", t === "people");
    tabChatBtn.setAttribute("aria-selected", String(t === "chat"));
    tabPeopleBtn.setAttribute("aria-selected", String(t === "people"));
    if (t === "chat") {
      tabChatDot.hidden = true;
      chatListEl.scrollTop = chatListEl.scrollHeight;
    } else renderRoster();
  }
  // 片語收進可展開的一列，預設收合
  phrasesBar.hidden = true;
  const phrasesToggle = h("button", {
    class: "is-emote-btn is-phrase-toggle",
    type: "button",
    "aria-expanded": "false",
    onclick: () => {
      phrasesBar.hidden = !phrasesBar.hidden;
      phrasesToggle.setAttribute("aria-expanded", String(!phrasesBar.hidden));
      phrasesToggle.classList.toggle("on", !phrasesBar.hidden);
    },
  });
  phrasesToggle.append(h("span", { class: "is-emote-ico", "aria-hidden": "true" }, uiIcon("quote")), L(h("span", { class: "is-emote-lbl" }), "片語", "Phrases"));
  L(phrasesToggle, "快速片語", "Quick phrases", "title");
  emoteBar.append(phrasesToggle);

  const plazaDrawer = h(
    "aside",
    { class: "is-plaza-drawer" },
    h(
      "div",
      { class: "is-plaza-head" },
      h("div", { class: "is-plaza-headtxt" }, plazaTitleEl, plazaStatusEl),
      h("div", { class: "is-plaza-headbtns" }, netBtn, closeBtn)
    ),
    roomsBar,
    netCfgBox,
    tabsBar,
    rosterEl,
    emoteBar,
    chatWrapEl,
    phrasesBar,
    dmPillEl,
    h(
      "form",
      {
        class: "is-plaza-form",
        onsubmit: (e) => {
          e.preventDefault();
          const v = chatInputEl.value.trim();
          if (!v) return;
          if (dmTarget ? sendDm(dmTarget, v) : sendPlazaChat(v)) {
            chatInputEl.value = "";
            chatCounterEl.textContent = "";
          }
        },
      },
      h("div", { class: "is-plaza-inputwrap" }, chatInputEl, chatCounterEl),
      sendBtn
    )
  );
  L(plazaDrawer, "多人旅伴廣場", "Multiplayer plaza", "aria-label");
  plazaDrawer.classList.add("tab-chat");
  document.body.append(plazaDrawer);

  function emitCityLog(detail) {
    try {
      if (window.__htlLog?.push) window.__htlLog.push(detail);
      else (window.__htlLogQueue ||= []).push(detail);
    } catch {}
  }

  function emitMyEmoteLog(kind, targetName = "") {
    const av = window.heartIslandAvatar;
    const myLook = getLocalLookSummary();
    const EMO_ZH = {
      wave: targetName ? `👋 向「${targetName}」熱情揮手致意` : "👋 熱情揮手問候",
      bow: targetName ? `🙇 向「${targetName}」行五星禮賓鞠躬禮` : "🙇 行五星禮賓鞠躬禮",
      cheer: "🎉 開心跳躍歡呼",
      coffee: targetName ? `☕ 舉杯邀請「${targetName}」共享咖啡` : "☕ 舉杯共享咖啡時光",
    };
    const EMO_EN = {
      wave: targetName ? `👋 Waved hello to ${targetName}` : "👋 Waved hello",
      bow: targetName ? `🙇 Five-star bow to ${targetName}` : "🙇 Five-star concierge bow",
      cheer: "🎉 Jumped & cheered",
      coffee: targetName ? `☕ Invited ${targetName} for coffee` : "☕ Raised a coffee toast",
    };
    emitCityLog({
      actor: "me",
      type: "emote",
      who: myLook.name,
      role: av?.ROLE_LABEL?.[myLook.role] || "訪客",
      islandId: av?.S?.curIslandId || "",
      islandName: av?.S?.curIslandName || "",
      textZh: EMO_ZH[kind] || EMO_ZH.wave,
      textEn: EMO_EN[kind] || EMO_EN.wave,
    });
  }

  function isChatNearBottom() {
    return chatListEl.scrollHeight - chatListEl.scrollTop - chatListEl.clientHeight < 48;
  }

  // 只有在使用者原本就停在最底部（或是自己發言）時才自動捲到最新；往上翻閱舊訊息時改顯示「↓ 新訊息」
  function appendChatLog(who, text, isSys = false, opts = {}) {
    const pinned = opts.mine || isChatNearBottom() || !plazaDrawer.classList.contains("open");
    const cls = "is-chat-row" + (isSys ? " sys" : "") + (opts.mine ? " mine" : "") + (opts.mention ? " mention" : "");
    const row = isSys
      ? h("div", { class: cls }, text)
      : h("div", { class: cls }, opts.color ? h("i", { class: "is-chat-sw", style: `background:${opts.color}` }) : null, h("b", {}, who), text);
    chatListEl.append(row);
    if (plazaTab === "people" && !opts.mine) tabChatDot.hidden = false;
    while (chatListEl.children.length > 80) chatListEl.firstChild.remove();
    if (pinned) {
      chatListEl.scrollTop = chatListEl.scrollHeight;
      newMsgPill.hidden = true;
    } else {
      newMsgPill.hidden = false;
    }
  }

  appendChatLog(
    "",
    tr(
      "✨ 歡迎來到旅伴廣場！手機與電腦訪客進入同一大廳即可看見彼此的 3D 分身與頭頂氣泡。點名單上的「前往／揮手／跟隨」即可互動。",
      "✨ Welcome to the plaza! Visitors in the same room see each other's 3D avatars and chat bubbles. Use Go to / Wave / Follow in the list to interact."
    ),
    true
  );

  // 星等（1–5）只取自本機護照；廣場上只傳這個整數，稱號文字由觀看者依固定表查詢
  function myStars() {
    const n = Math.round(Number(window.__htlPassport?.getPlayerStatus?.()?.stars) || 1);
    return Math.min(5, Math.max(1, n));
  }
  // 第四期 level (1–30), relayed as an integer only; the server drops anything else
  function myLevel() {
    const n = Math.round(Number(window.__htlPassport?.level?.()) || 1);
    return Math.min(30, Math.max(1, n));
  }
  // 其他玩家的星等：僅接受 1–5 整數，否則不顯示（舊版用戶端沒有此欄位）
  function peerStars(p) {
    const n = p?.look?.lv;
    return Number.isInteger(n) && n >= 1 && n <= 5 ? n : 0;
  }
  function starTitle(n) {
    return window.__htlPassport?.starTitle?.(n) || "";
  }

  const lookColor = (look) => {
    const c = look?.shirt;
    if (typeof c === "number" && Number.isFinite(c)) return "#" + (c & 0xffffff).toString(16).padStart(6, "0");
    if (typeof c === "string" && /^#?[0-9a-f]{6}$/i.test(c)) return c.startsWith("#") ? c : "#" + c;
    return "#3fe08c";
  };

  function setUnread(n) {
    unreadCount = Math.max(0, n);
    updatePlazaBadges();
  }

  function updatePlazaBadges() {
    const online = onlineCount();
    for (const sel of ["#htl-plaza-open", "#mob-plaza-btn"]) {
      const btn = document.querySelector(sel);
      if (!btn) continue;
      let badge = btn.querySelector(".is-plaza-badge");
      if (!badge) {
        badge = h("span", { class: "is-plaza-badge", "aria-hidden": "true" });
        btn.append(badge);
      }
      if (unreadCount > 0) {
        badge.textContent = unreadCount > 9 ? "9+" : String(unreadCount);
        badge.className = "is-plaza-badge unread";
        badge.hidden = false;
      } else if (online > 0) {
        badge.textContent = String(1 + online);
        badge.className = "is-plaza-badge online";
        badge.hidden = false;
      } else {
        badge.hidden = true;
      }
      const base = tr("旅伴廣場", "Multiplayer plaza");
      const extra = [online > 0 ? tr(`${1 + online} 人在線`, `${1 + online} online`) : "", unreadCount ? tr(`${unreadCount} 則未讀`, `${unreadCount} unread`) : ""].filter(Boolean).join("・");
      btn.title = extra ? `${base}（${extra}）` : base;
    }
  }

  // 防冒名（ISO/IEC 27001 Annex A 5.10、R-13）：其他玩家暱稱含官方師長姓名時，一律標示為訪客扮演，
  // 避免有人假冒師長在廣場發言。此判斷在「觀看者」瀏覽器執行，修改過的用戶端也無法繞過。
  // 比對前先去掉空白與常見分隔符號，避免「謝 文欽」「謝・文欽」之類繞過。
  const FACULTY_NAMES = (OFFICIAL.faculty || []).map((f) => f?.name).filter(Boolean);
  const squashName = (v) => String(v || "").replace(/[\s\u3000\u200b-\u200f·・．.\-_]/g, "");
  function guardName(name) {
    const n = String(name || "");
    const q = squashName(n);
    return FACULTY_NAMES.some((f) => q.includes(squashName(f))) ? `訪客扮演・${n}` : n;
  }

  function getLocalLookSummary() {
    const av = window.heartIslandAvatar;
    const look = av?.S?.look;
    if (!look) return { name: "高餐訪客", role: "visitor", lv: myStars(), lvl: myLevel() };
    return { ...look, name: sanitizeText(look.name || "高餐訪客", 16), lv: myStars(), lvl: myLevel() };
  }

  function getLocalStatePacket(type = "state") {
    const av = window.heartIslandAvatar;
    const g = av?.S?.fig?.group;
    return {
      t: type,
      id: SESSION_ID,
      room: currentRoom,
      look: getLocalLookSummary(),
      x: g ? +g.position.x.toFixed(3) : 0,
      y: g ? +(g.position.y - (av?.S?.jumpY || 0)).toFixed(3) : 0.66,
      z: g ? +g.position.z.toFixed(3) : 0,
      yaw: g ? +g.rotation.y.toFixed(3) : 0,
      moving: !!(av?.S?.walk || (av?.S?.vel && Math.hypot(av.S.vel.x, av.S.vel.z) > 0.05)),
      sprint: !!av?.S?.sprint,
      jumpY: +(av?.S?.jumpY || 0).toFixed(3),
      emote: av?.S?.emote?.kind || null,
      isl: av?.S?.curIslandName || "",
      ts: Date.now(),
    };
  }

  function sendPacket(pkt) {
    const pid = `${SESSION_ID}:${PAGE_NONCE}:${++pktSeq}`;
    const msg = { ...pkt, id: SESSION_ID, room: currentRoom, _pid: pid };
    if (bc) {
      try {
        bc.postMessage(msg);
      } catch {}
    }
    if (ws && ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(JSON.stringify(msg));
      } catch {}
    }
  }

  function ensurePeerAvatar(peerId, lookData) {
    const av = window.heartIslandAvatar;
    if (!av?.buildFigure || !av?.cap?.scene) return null;
    const T = av.T;
    const safeLook = { ...(av.DEFAULT_LOOK || {}), ...(lookData || {}) };
    const rawPeerName = sanitizeText(safeLook.name || "", 16);
    const peerSuffix = String(peerId || "").replace(/[^a-zA-Z0-9]/g, "").slice(-3).toUpperCase() || "VIP";
    safeLook.name = !rawPeerName || rawPeerName === "我" || rawPeerName === "You" ? `旅伴 #${peerSuffix}` : rawPeerName;
    safeLook.name = guardName(safeLook.name);

    let p = peers.get(peerId);
    const lookKey = JSON.stringify(safeLook);
    if (p && p.lookKey === lookKey && p.fig) return p;

    const fig = av.buildFigure(safeLook);
    // 線上夥伴腳下改為翡翠綠光圈，與玩家本人的珊瑚橘光圈清楚區分
    if (fig.ring?.material) {
      fig.ring.material = fig.ring.material.clone();
      fig.ring.material.color = new T.Color(0x3fe08c);
      fig.ring.visible = true;
    }
    if (fig.pin?.material) {
      fig.pin.material = fig.pin.material.clone();
      fig.pin.material.color = new T.Color(0x3fe08c);
      fig.pin.material.emissive = new T.Color(0x20a862);
    }
    av.applyFigScale(fig);

    if (p && p.fig) {
      fig.group.position.copy(p.fig.group.position);
      fig.group.rotation.copy(p.fig.group.rotation);
      av.cap.scene.remove(p.fig.group);
      av.disposeFigure(p.fig.group);
      p.fig = fig;
      p.look = safeLook;
      p.lookKey = lookKey;
    } else {
      const tagEl = h("div", {
        class: "is-peer-tag",
        onclick: (e) => {
          e.stopPropagation();
          const cur = peers.get(peerId);
          if (cur) openPeerDialogue(cur);
        },
      });
      const sayEl = h("div", { class: "is-peer-say" });
      tagEl.classList.toggle("muted", mutedIds.has(peerId));
      peerLayer.append(tagEl, sayEl);
      p = {
        id: peerId,
        fig,
        look: safeLook,
        lookKey,
        x: 0,
        y: 0.66,
        z: 0,
        tx: 0,
        ty: 0.66,
        tz: 0,
        yaw: 0,
        tyaw: 0,
        moving: false,
        sprint: false,
        jumpY: 0,
        emote: null,
        emoteStart: 0,
        emoteUntil: 0,
        isl: "",
        sayText: "",
        sayUntil: 0,
        tagEl,
        sayEl,
        lastSeen: performance.now(),
        initedPos: false,
        off: false,
      };
      peers.set(peerId, p);
    }

    refreshPeerTag(p);
    paintPeerRing(p);
    av.cap.scene.add(fig.group);
    return p;
  }

  function refreshPeerTag(p) {
    const av = window.heartIslandAvatar;
    const roleLabel = av?.ROLE_LABEL?.[p.look?.role] || "旅伴";
    p.tagEl.classList.toggle("off", !!p.off);
    const lv = peerStars(p);
    // 離線角色在地圖上只顯示精簡名牌（😴＋名字），淡化並置於線上夥伴之下，避免名牌堆疊遮住島名
    if (p.off) {
      p.tagEl.replaceChildren(h("span", { "aria-hidden": "true" }, "😴"), h("span", {}, p.look?.name || "夥伴"));
      p.tagEl.title = `${p.look?.name || "夥伴"}（離線）`;
      return;
    }
    p.tagEl.removeAttribute("title");
    p.tagEl.replaceChildren(
      h("span", { class: "is-peer-dot" }),
      lv ? h("span", { class: "is-peer-lv", title: starTitle(lv) }, "★".repeat(lv)) : null,
      h("span", {}, p.look?.name || "夥伴"),
      h("span", { class: "is-peer-role" }, roleLabel)
    );
  }

  // 離線角色腳下光圈改為灰色，與線上夥伴的翡翠綠光圈區分
  function paintPeerRing(p) {
    const T = window.heartIslandAvatar?.T;
    if (!T || !p.fig) return;
    if (p.fig.ring?.material) p.fig.ring.material.color = new T.Color(p.off ? 0x8a8f8c : 0x3fe08c);
    if (p.fig.pin?.material) {
      p.fig.pin.material.color = new T.Color(p.off ? 0x8a8f8c : 0x3fe08c);
      p.fig.pin.material.emissive = new T.Color(p.off ? 0x333333 : 0x20a862);
    }
  }

  function setPeerOffline(p, off) {
    if (!p || p.off === off) return;
    p.off = off;
    p.lastSeen = performance.now();
    if (off) {
      p.moving = p.sprint = false;
      p.jumpY = 0;
      p.emote = null;
      p.sayText = "";
    }
    refreshPeerTag(p);
    paintPeerRing(p);
  }

  function removePeer(peerId, reasonText = "") {
    const p = peers.get(peerId);
    if (!p) return;
    const av = window.heartIslandAvatar;
    if (p.fig && av?.cap?.scene) {
      av.cap.scene.remove(p.fig.group);
      av.disposeFigure?.(p.fig.group);
    }
    p.tagEl?.remove();
    p.sayEl?.remove();
    peers.delete(peerId);
    if (dmTarget?.id === peerId) setDmTarget(null);
    if (reasonText) {
      appendChatLog("", reasonText, true);
      emitCityLog({
        actor: "peer",
        type: "leave",
        peerId,
        who: p.look?.name || "旅伴",
        role: av?.ROLE_LABEL?.[p.look?.role] || "旅伴",
        islandName: p.isl || "",
        textZh: "離開了旅伴房間",
        textEn: "Left the multiplayer room",
      });
    }
    syncPlazaUI();
    av?.ui?.syncPad?.();
  }

  function clearAllPeers() {
    for (const id of [...peers.keys()]) removePeer(id);
  }

  const EMO_SAY = {
    wave: ["👋 熱情揮手問候！", "👋 Waved hello!"],
    bow: ["🙇 行五星禮賓鞠躬禮！", "🙇 Five-star concierge bow!"],
    cheer: ["🎉 開心跳躍歡呼！", "🎉 Jumped & cheered!"],
    coffee: ["☕ 舉杯邀您共享咖啡時光！", "☕ Raised a coffee toast!"],
  };

  function onIncomingPacket(msg) {
    if (!msg || typeof msg !== "object" || msg.t === "pong" || msg.id === SESSION_ID) return;
    if (msg.room && msg.room !== currentRoom) return;
    if (msg._pid) {
      if (seenPktIds.has(msg._pid)) return;
      seenPktIds.add(msg._pid);
      if (seenPktIds.size > 240) {
        const oldest = seenPktIds.values().next().value;
        if (oldest) seenPktIds.delete(oldest);
      }
    }

    if (plazaGames.handle(msg)) return;

    if (msg.t === "bye") {
      const old = peers.get(msg.id);
      removePeer(msg.id, old ? tr(`👋 ${old.look?.name || "夥伴"} 離開了房間`, `👋 ${old.look?.name || "A visitor"} left the room`) : "");
      return;
    }

    if (msg.t === "away") {
      // 對方關閉分頁或斷線：角色留在原地，名牌顯示（離線）；6 小時後由伺服器移除
      const existed = peers.has(msg.id);
      const p = ensurePeerAvatar(msg.id, msg.look);
      if (!p) return;
      if (typeof msg.x === "number" && typeof msg.z === "number") {
        p.tx = p.x = msg.x;
        p.ty = p.y = typeof msg.y === "number" ? msg.y : p.ty;
        p.tz = p.z = msg.z;
        p.tyaw = p.yaw = typeof msg.yaw === "number" ? msg.yaw : p.tyaw;
        p.fig.group.position.set(p.x, p.y, p.z);
        p.fig.group.rotation.y = p.yaw;
        p.initedPos = true;
      }
      if (typeof msg.isl === "string") p.isl = msg.isl;
      const wasOff = p.off;
      setPeerOffline(p, true);
      if (!msg.quiet && !wasOff) appendChatLog("", `😴 ${p.look.name} 離線了（角色留在原地，6 小時內回來即可接續）`, true);
      if (dmTarget?.id === p.id) setDmTarget(null);
      if (!existed || !wasOff) {
        syncPlazaUI();
        window.heartIslandAvatar?.ui?.syncPad?.();
      }
      return;
    }

    if (msg.t === "dm") {
      // 本機多分頁（BroadcastChannel）會收到所有分頁的封包：只處理寄給自己的
      if (msg.to && msg.to !== SESSION_ID) return;
      if (dmClosed || blockedIds.has(msg.id)) return;
      const text = sanitizeText(msg.text, 90);
      if (!text) return;
      const p = peers.get(msg.id);
      const name = p ? p.look.name : guardName(sanitizeText(msg.name || "旅伴", 16) || "旅伴");
      appendDmRow(msg.id, name, text);
      window.__htlPassport?.sfx?.bell?.();
      window.heartIslandAvatar?.showSay?.(`💌 ${name} 丟來水球`, text, 5200);
      return;
    }

    if (msg.t === "dm_ack") {
      if (msg.ok) return;
      const p = peers.get(msg.to);
      const who = p?.look?.name || "對方";
      const why = {
        offline: `⚠️ 水球未送達：「${who}」目前離線（私訊不保存，請等對方上線再傳）`,
        closed: `🔕 水球未送達：「${who}」目前不接收私訊`,
        rate: "⏳ 水球丟太快囉，請稍候再傳。",
      };
      appendChatLog("", why[msg.reason] || `⚠️ 水球未送達「${who}」`, true);
      return;
    }

    if (msg.t === "hello" || msg.t === "welcome" || msg.t === "state" || msg.t === "look") {
      const existed = peers.has(msg.id);
      const p = ensurePeerAvatar(msg.id, msg.look);
      if (p && p.off) {
        setPeerOffline(p, false);
        appendChatLog("", `🌟 ${p.look.name} 回來了！`, true);
        syncPlazaUI();
      }
      if (p) {
        p.lastSeen = performance.now();
        if (typeof msg.x === "number" && typeof msg.z === "number") {
          p.tx = msg.x;
          p.ty = typeof msg.y === "number" ? msg.y : p.ty;
          p.tz = msg.z;
          p.tyaw = typeof msg.yaw === "number" ? msg.yaw : p.tyaw;
          if (!p.initedPos) {
            p.x = p.tx;
            p.y = p.ty;
            p.z = p.tz;
            p.yaw = p.tyaw;
            p.fig.group.position.set(p.x, p.y, p.z);
            p.fig.group.rotation.y = p.yaw;
            p.initedPos = true;
          }
        }
        p.moving = !!msg.moving;
        p.sprint = !!msg.sprint;
        p.jumpY = typeof msg.jumpY === "number" ? msg.jumpY : 0;
        const prevIsl = p.loggedIsl || "";
        if (msg.isl !== undefined) p.isl = sanitizeText(msg.isl, 32);
        if (msg.isl !== undefined) plazaGames.observeState(p, prevIsl);
        if (msg.emote && (!p.emote || p.emote !== msg.emote)) {
          p.emote = msg.emote;
          p.emoteStart = performance.now();
          p.emoteUntil = p.emoteStart + 2300;
        }
        if (!existed) {
          const rLabel = roomLabel(currentRoom);
          const roleLabel = window.heartIslandAvatar?.ROLE_LABEL?.[p.look?.role] || "旅伴";
          p.loggedIsl = p.isl || "";
          p.lastIslLogAt = performance.now();
          appendChatLog("", tr(`🌟 ${p.look.name} 加入了「${rLabel}」`, `🌟 ${p.look.name} joined "${rLabel}"`), true);
          emitCityLog({
            actor: "peer",
            type: "join",
            peerId: p.id,
            who: p.look.name,
            role: roleLabel,
            islandName: p.isl || "",
            textZh: `加入旅伴「${roomLabel(currentRoom)}」${p.isl ? ` · 位於 ${p.isl}` : ""}`,
            textEn: `Joined room "${ROOM_EN[currentRoom] || currentRoom}"${p.isl ? ` · at ${p.isl}` : ""}`,
          });
          syncPlazaUI();
          window.heartIslandAvatar?.ui?.syncPad?.();
        } else {
          if (msg.isl && msg.isl !== prevIsl && performance.now() - (p.lastIslLogAt || 0) > 2500) {
            p.loggedIsl = msg.isl;
            p.lastIslLogAt = performance.now();
            const roleLabel = window.heartIslandAvatar?.ROLE_LABEL?.[p.look?.role] || "旅伴";
            emitCityLog({
              actor: "peer",
              type: "arrive",
              peerId: p.id,
              who: p.look.name,
              role: roleLabel,
              islandName: msg.isl,
              textZh: `漫遊抵達「${msg.isl}」`,
              textEn: `Arrived at "${msg.isl}"`,
            });
            scheduleRoster();
          } else if (msg.isl && !prevIsl) {
            p.loggedIsl = msg.isl;
            scheduleRoster();
          }
          if (msg.t === "look") syncPlazaUI();
        }
      }
      if (msg.t === "hello") {
        sendPacket(getLocalStatePacket("welcome"));
      }
      return;
    }

    if (msg.t === "emote") {
      const p = peers.get(msg.id) || ensurePeerAvatar(msg.id, msg.look);
      if (!p) return;
      p.lastSeen = performance.now();
      const kind = EMO_SAY[msg.kind] ? msg.kind : "wave";
      p.emote = kind;
      p.emoteStart = performance.now();
      p.emoteUntil = p.emoteStart + 2300;
      if (mutedIds.has(p.id)) return; // 已靜音：只保留肢體動作，不顯示氣泡、不提醒
      const [sayZh, sayEn] = EMO_SAY[kind];
      p.sayText = tr(sayZh, sayEn);
      p.sayUntil = performance.now() + 3600;
      const toMe = msg.targetId === SESSION_ID;
      emitCityLog({
        actor: "peer",
        type: "emote",
        peerId: p.id,
        who: p.look.name,
        role: window.heartIslandAvatar?.ROLE_LABEL?.[p.look?.role] || "旅伴",
        islandName: p.isl || "",
        textZh: toMe ? `向您互動：${sayZh}` : sayZh,
        textEn: toMe ? `Greeted you: ${sayEn}` : sayEn,
      });
      if (toMe) {
        appendChatLog("", tr(`${EMOTES.find((e) => e.kind === kind)?.ico || "👋"} ${p.look.name} 向您${sayZh.replace(/^\S+\s/, "")}`, `${p.look.name} → you: ${sayEn}`), true);
        if (!plazaDrawer.classList.contains("open")) setUnread(unreadCount + 1);
        window.__htlPassport?.sfx?.bell?.();
        window.heartIslandAvatar?.showSay?.(tr(`👋 收到來自「${p.look.name}」的問候`, `👋 ${p.look.name} greeted you`), p.sayText, 3800);
      }
      return;
    }

    if (msg.t === "chat") {
      if (mutedIds.has(msg.id)) return;
      const p = peers.get(msg.id) || ensurePeerAvatar(msg.id, msg.look);
      const clean = sanitizeText(msg.text, 90);
      if (!clean) return;
      const senderName = p ? p.look.name : guardName(sanitizeText(msg.name || "旅伴", 16));
      if (p) {
        p.lastSeen = performance.now();
        p.sayText = clean;
        p.sayUntil = performance.now() + Math.min(9000, 4200 + clean.length * 70);
        p.emote = "wave";
        p.emoteStart = performance.now();
        p.emoteUntil = p.emoteStart + 1600;
      }
      const myName = getLocalLookSummary().name;
      const mention = !!myName && clean.includes("@" + myName);
      appendChatLog(senderName, clean, false, { color: p ? lookColor(p.look) : null, mention });
      if (!plazaDrawer.classList.contains("open")) setUnread(unreadCount + 1);
      emitCityLog({
        actor: "peer",
        type: "chat",
        peerId: p?.id || msg.id,
        who: senderName,
        role: p ? window.heartIslandAvatar?.ROLE_LABEL?.[p.look?.role] || "旅伴" : "旅伴",
        islandName: p?.isl || "",
        textZh: `說：「${clean}」`,
        textEn: `said: "${clean}"`,
        noDedupe: true,
      });
      if (mention) window.__htlPassport?.sfx?.bell?.();
      else window.__htlPassport?.sfx?.stamp?.();
    }
  }

  function setupBroadcastChannel() {
    if (bc) {
      try {
        bc.close();
      } catch {}
      bc = null;
    }
    if (typeof BroadcastChannel === "undefined") return;
    bc = new BroadcastChannel(BC_PREFIX + currentRoom);
    bc.onmessage = (ev) => onIncomingPacket(ev.data);
    sendPacket(getLocalStatePacket("hello"));
  }

  function scheduleReconnect() {
    clearTimeout(wsReconnectTimer);
    if (!customWsUrl) return;
    wsFails++;
    if (wsFails > WS_MAX_AUTO_RETRY || (typeof navigator !== "undefined" && navigator.onLine === false)) {
      wsState = "offline";
      wsRetryAt = 0;
      syncStatus();
      return;
    }
    const delay = Math.min(30000, 2000 * 2 ** (wsFails - 1));
    wsState = "retry";
    wsRetryAt = Date.now() + delay;
    wsReconnectTimer = setTimeout(connectWebSocket, delay);
    syncStatus();
  }

  function retryNow() {
    if (!customWsUrl) {
      applyNetUrl(DEFAULT_CLOUD_WS_URL);
      return;
    }
    wsFails = 0;
    connectWebSocket();
  }

  function connectWebSocket() {
    clearTimeout(wsReconnectTimer);
    clearInterval(wsPingTimer);
    if (ws) {
      try {
        ws.onclose = null;
        ws.close();
      } catch {}
      ws = null;
    }
    if (!customWsUrl || leftPlaza) {
      wsState = leftPlaza ? "left" : "off";
      syncPlazaUI();
      return;
    }
    let urlStr = customWsUrl;
    if (urlStr.startsWith("http://")) urlStr = "ws://" + urlStr.slice(7);
    else if (urlStr.startsWith("https://")) urlStr = "wss://" + urlStr.slice(8);
    const sep = urlStr.includes("?") ? "&" : "?";
    const fullUrl = `${urlStr}${sep}room=${encodeURIComponent(currentRoom)}&id=${encodeURIComponent(SESSION_ID)}${isOfficialWs(urlStr) || isLoopbackWs(urlStr) ? `&key=${encodeURIComponent(SESSION_KEY)}` : ""}`;

    wsState = "connecting";
    syncStatus();
    try {
      const sock = new WebSocket(fullUrl);
      ws = sock;
      sock.onopen = () => {
        if (ws !== sock) return;
        wsState = "open";
        wsFails = 0;
        syncPlazaUI();
        sendPacket(getLocalStatePacket("hello"));
        if (dmClosed) sendPacket({ t: "dmopt", closed: true });
        clearInterval(wsPingTimer);
        wsPingTimer = setInterval(() => {
          if (ws === sock && sock.readyState === WebSocket.OPEN) {
            try {
              sock.send("ping");
            } catch {}
          }
        }, 24000);
      };
      sock.onmessage = (ev) => {
        try {
          const data = JSON.parse(ev.data);
          if (data?.t === "pong") return;
          if (data && data.restored === true) {
            // 伺服器確認：本瀏覽器的身分接回了上次留在場上的離線角色（只送給本人）
            appendChatLog("", tr("🔗 歡迎回來！已接回你上次留在場上的角色。", "🔗 Welcome back! You've picked up the character you left here."), true);
          }
          if (Array.isArray(data.peers)) {
            for (const item of data.peers) onIncomingPacket({ ...item, t: "welcome", room: currentRoom });
            if (Array.isArray(data.away)) {
              for (const item of data.away.slice(0, 100)) onIncomingPacket({ ...item, t: "away", room: currentRoom, quiet: true });
            }
          } else {
            onIncomingPacket(data);
          }
        } catch {}
      };
      sock.onerror = () => {};
      sock.onclose = () => {
        if (ws === sock) {
          clearInterval(wsPingTimer);
          ws = null;
          if (leftPlaza) {
            wsState = "left";
            syncPlazaUI();
          } else if (customWsUrl) scheduleReconnect();
          else {
            wsState = "off";
            syncPlazaUI();
          }
        }
      };
    } catch {
      ws = null;
      scheduleReconnect();
    }
  }

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden && customWsUrl && !leftPlaza && (!ws || ws.readyState === WebSocket.CLOSED)) {
      wsFails = 0;
      connectWebSocket();
    }
  });
  window.addEventListener("online", () => {
    if (customWsUrl && (!ws || ws.readyState !== WebSocket.OPEN)) {
      wsFails = 0;
      connectWebSocket();
    }
  });
  window.addEventListener("offline", () => {
    if (wsState !== "open") {
      clearTimeout(wsReconnectTimer);
      if (customWsUrl) wsState = "offline";
      syncStatus();
    }
  });

  function switchRoom(roomId) {
    if (roomId === currentRoom) return;
    sendPacket({ t: "bye" });
    stopFollow("");
    clearAllPeers();
    currentRoom = roomId;
    try {
      localStorage.setItem(STORAGE_ROOM_KEY, roomId);
    } catch {}
    for (const [id, btn] of Object.entries(roomBtns)) {
      btn.classList.toggle("active", id === roomId);
      btn.setAttribute("aria-selected", String(id === roomId));
    }
    if (!leftPlaza) {
      setupBroadcastChannel();
      if (customWsUrl) {
        wsFails = 0;
        connectWebSocket();
      }
    }
    syncPlazaUI();
    appendChatLog("", tr(`🚪 已切換至「${roomLabel(roomId)}」`, `🚪 Switched to "${roomLabel(roomId)}"`), true);
  }

  function sendPlazaChat(rawText) {
    const now = performance.now();
    const clean = sanitizeText(rawText, CHAT_MAX);
    if (!clean) return false;
    while (chatSendTimes.length && now - chatSendTimes[0] > 15000) chatSendTimes.shift();
    if (now - lastChatAt < 1100) {
      appendChatLog("", tr("⏳ 發言太快囉，請稍候一秒再傳送。", "⏳ Slow down a little — wait a second."), true, { mine: true });
      return false;
    }
    if (chatSendTimes.length >= 5) {
      const wait = Math.ceil((15000 - (now - chatSendTimes[0])) / 1000);
      appendChatLog("", tr(`⏳ 訊息有點多，請 ${wait} 秒後再發言。`, `⏳ Too many messages — try again in ${wait}s.`), true, { mine: true });
      return false;
    }
    if (clean === lastChatText && now - lastChatTextAt < 10000) {
      appendChatLog("", tr("🔁 剛剛已送出相同內容囉。", "🔁 You just sent that."), true, { mine: true });
      return false;
    }
    lastChatAt = now;
    lastChatText = clean;
    lastChatTextAt = now;
    chatSendTimes.push(now);

    const av = window.heartIslandAvatar;
    const myLook = getLocalLookSummary();
    av?.showSay?.(`💬 ${myLook.name}`, clean, 4800);
    const meLbl = myLook.name === "我" || myLook.name === "You" ? tr("我", "Me") : tr(`${myLook.name}（我）`, `${myLook.name} (me)`);
    appendChatLog(meLbl, clean, false, { mine: true, color: lookColor(myLook) });
    emitCityLog({
      actor: "me",
      type: "chat",
      who: myLook.name,
      role: av?.ROLE_LABEL?.[myLook.role] || "訪客",
      islandId: av?.S?.curIslandId || "",
      islandName: av?.S?.curIslandName || "",
      textZh: `於旅伴廣場發言：「${clean}」`,
      textEn: `Plaza chat: "${clean}"`,
      noDedupe: true,
    });
    sendPacket({
      t: "chat",
      name: myLook.name,
      look: myLook,
      text: clean,
    });
    return true;
  }

  // 旅伴廣場成長事件：直接交給護照（quest.js）計分，不經過 analytics，夥伴 id 不會外送
  function trackPlaza(name, peer) {
    if (!peer || peer.off || leftPlaza || !peers.has(peer.id)) return;
    try {
      window.dispatchEvent(new CustomEvent("htl:track", { detail: { name, params: { peer: peer.id } } }));
    } catch {}
  }

  // 學長姐帶路／新生同行：與星等差距大的線上夥伴同在一座主題島（每 3 秒檢查一次，徽章各只發一次）
  let lastMentorCheck = 0;
  const mentorDone = { mentor: false, guided: false };
  function checkMentorship(now) {
    if (now - lastMentorCheck < 3000 || leftPlaza || (mentorDone.mentor && mentorDone.guided)) return;
    lastMentorCheck = now;
    const myIsl = window.heartIslandAvatar?.S?.curIslandName || "";
    if (!myIsl) return;
    const me = myStars();
    for (const p of peers.values()) {
      if (p.off || p.isl !== myIsl) continue;
      const lv = peerStars(p);
      if (!mentorDone.mentor && me >= 3 && lv === 1) {
        mentorDone.mentor = true;
        trackPlaza("htl_plaza_mentor", p);
      }
      if (!mentorDone.guided && me === 1 && lv >= 3) {
        mentorDone.guided = true;
        trackPlaza("htl_plaza_guided", p);
      }
    }
  }

  // 自己升星時，讓同房夥伴的名牌即時更新
  let lastSentStars = 0;
  window.addEventListener("htl:xp", () => {
    const n = myStars();
    if (n !== lastSentStars && !leftPlaza) {
      lastSentStars = n;
      sendPacket({ t: "look", look: getLocalLookSummary() });
      syncPlazaUI();
    }
  });

  // 主動「離開廣場」：通知伺服器不要留下離線角色，並停止連線（關閉分頁則會留下離線角色）
  function leavePlaza() {
    if (leftPlaza) return;
    sendPacket({ t: "bye" });
    leftPlaza = true;
    clearTimeout(wsReconnectTimer);
    clearInterval(wsPingTimer);
    if (ws) {
      const sock = ws;
      ws = null;
      try {
        sock.onclose = null;
        sock.close(1000, "left");
      } catch {}
    }
    if (bc) {
      try {
        bc.close();
      } catch {}
      bc = null;
    }
    clearAllPeers();
    setDmTarget(null);
    wsState = "left";
    appendChatLog("", "🚪 你已離開旅伴廣場，你的角色已從場上移除。按「重新加入」即可回來。", true);
    syncPlazaUI();
  }

  function rejoinPlaza() {
    if (!leftPlaza) return;
    leftPlaza = false;
    setupBroadcastChannel();
    connectWebSocket();
    appendChatLog("", "🌟 歡迎回到旅伴廣場！", true);
    syncPlazaUI();
  }

  function setDmClosed(closed) {
    dmClosed = !!closed;
    try {
      if (dmClosed) localStorage.setItem(STORAGE_DM_OFF, "1");
      else localStorage.removeItem(STORAGE_DM_OFF);
    } catch {}
    sendPacket({ t: "dmopt", closed: dmClosed });
    appendChatLog("", dmClosed ? "🔕 已關閉私訊：其他人丟的水球將無法送達。" : "🔔 已開啟私訊：同房間的線上夥伴可以丟水球給你。", true);
    syncPlazaUI();
  }

  function toggleBlock(id, name) {
    if (blockedIds.has(id)) {
      blockedIds.delete(id);
      appendChatLog("", `✅ 已解除封鎖「${name}」的私訊`, true);
    } else {
      blockedIds.add(id);
      if (dmTarget?.id === id) setDmTarget(null);
      appendChatLog("", `🚫 已封鎖「${name}」的私訊（對方不會收到通知）`, true);
    }
    saveBlocked();
    syncPlazaUI();
  }

  function startDm(peer) {
    if (!peer || peer.off) return;
    if (blockedIds.has(peer.id)) {
      appendChatLog("", `🚫 你已封鎖「${peer.look?.name || "夥伴"}」，請先在名單中解除封鎖。`, true);
      return;
    }
    setDmTarget({ id: peer.id, name: peer.look?.name || "夥伴" });
    toggleChat(true);
    setPlazaTab("chat");
    try {
      chatInputEl.focus();
    } catch {}
  }

  function sendDm(target, rawText) {
    const now = performance.now();
    if (now - lastDmAt < 1100) {
      appendChatLog("", "⏳ 水球丟太快囉，請稍候一秒再傳送。", true);
      return false;
    }
    const clean = sanitizeText(rawText, 85);
    if (!clean) return false;
    const p = peers.get(target.id);
    if (!p || p.off) {
      appendChatLog("", `⚠️ 「${target.name}」目前不在線上，水球無法送達（私訊不保存）。`, true);
      setDmTarget(null);
      return false;
    }
    lastDmAt = now;
    const myLook = getLocalLookSummary();
    sendPacket({ t: "dm", to: target.id, name: myLook.name, text: clean });
    chatListEl.append(h("div", { class: "is-chat-row dm mine" }, h("b", {}, `💌 我 → ${target.name}`), clean));
    trimChatLog();
    return true;
  }

  function trimChatLog() {
    while (chatListEl.children.length > 60) chatListEl.firstChild.remove();
    chatListEl.scrollTop = chatListEl.scrollHeight;
  }

  function appendDmRow(fromId, name, text) {
    chatListEl.append(
      h(
        "div",
        { class: "is-chat-row dm" },
        h("b", {}, `💌 ${name} 悄悄對你說`),
        text,
        h(
          "span",
          { class: "is-dm-actions" },
          h("button", { type: "button", class: "is-roster-go", onclick: () => startDm(peers.get(fromId) || { id: fromId, look: { name } }) }, "回覆"),
          h("button", { type: "button", class: "is-roster-go", onclick: () => toggleBlock(fromId, name) }, "封鎖")
        )
      )
    );
    trimChatLog();
  }

  // ── 表情：一般廣播或指定對象（targetId 為既有欄位，舊版用戶端也看得懂）
  function doEmote(kind, peer = null) {
    const now = performance.now();
    if (now - lastEmoteAt < 600) return false;
    lastEmoteAt = now;
    const av = window.heartIslandAvatar;
    pendingEmoteTarget = peer ? { id: peer.id, name: peer.look?.name || "" } : null;
    if (av?.api?.triggerEmote) av.api.triggerEmote(kind); // 會回呼 htlSocial.broadcastEmote
    if (pendingEmoteTarget || !av?.api?.triggerEmote) {
      // heart-me 未回呼時（例如尚未載入）自行送出
      broadcastEmoteInternal(kind);
    }
    if (peer) {
      trackPlaza("htl_plaza_greet", peer);
      const g = av?.S?.fig?.group;
      if (g) g.rotation.y = Math.atan2(peer.x - g.position.x, peer.z - g.position.z);
      const em = EMOTES.find((e) => e.kind === kind);
      appendChatLog("", tr(`${em?.ico || "👋"} 你向 ${peer.look?.name || "夥伴"} ${em?.zh || "揮手"}`, `${em?.ico || "👋"} You → ${peer.look?.name || "visitor"}: ${em?.en || "Wave"}`), true, { mine: true });
    }
    return true;
  }

  function broadcastEmoteInternal(kind) {
    const tgt = pendingEmoteTarget;
    pendingEmoteTarget = null;
    sendPacket({ t: "emote", kind, targetId: tgt?.id || undefined, look: getLocalLookSummary() });
    emitMyEmoteLog(kind, tgt?.name || "");
  }

  // ── 前往夥伴身旁：停在對方與我之間約 0.75 的位置並面向對方（跨島時沿用 goTo 的橋頭瞬移）
  function goToPeer(p, opts = {}) {
    const av = window.heartIslandAvatar;
    if (!p || !av?.api?.goToPoint) return false;
    const name = p.look?.name || tr("夥伴", "visitor");
    const me = av.S?.fig?.group?.position;
    const face = () => {
      const g = av.S?.fig?.group;
      if (g) g.rotation.y = Math.atan2(p.x - g.position.x, p.z - g.position.z);
    };
    if (me && Math.hypot(me.x - p.x, me.z - p.z) < 1.0 && av.S?.drive) {
      face();
      if (!opts.quiet) av.showSay?.(tr(`👋 ${name} 就在你身旁`, `👋 ${name} is right here`), "", 2000);
      return true;
    }
    let tx = p.x, tz = p.z;
    if (me) {
      const dx = me.x - p.x, dz = me.z - p.z, d = Math.hypot(dx, dz);
      if (d > 0.01) {
        const off = Math.min(0.75, d);
        tx = p.x + (dx / d) * off;
        tz = p.z + (dz / d) * off;
      }
    }
    av.api.goToPoint(tx, tz, tr(`走向夥伴：${name}`, `Walking to ${name}`), () => {
      face();
      if (opts.quiet) {
        if (av.S && av.S.say && /到了/.test(av.S.say.title || "")) av.S.say = null;
      } else {
        av.showSay?.(tr(`👋 已來到 ${name} 身旁`, `👋 You reached ${name}`), tr("可以揮手、鞠躬或聊天互動！", "Wave, bow or chat to say hi!"), 2600);
      }
    });
    if (!opts.keepOpen && isCoarse()) toggleChat(false);
    return true;
  }

  function startFollow(p) {
    if (!p) return;
    followId = p.id;
    followLastTarget = null;
    followLastIssue = 0;
    appendChatLog("", tr(`👣 開始跟隨 ${p.look?.name || "夥伴"}（推動搖桿或按 WASD 即可停止）`, `👣 Following ${p.look?.name || "visitor"} (move the joystick or WASD to stop)`), true, { mine: true });
    goToPeer(p, { quiet: true, keepOpen: !isCoarse() });
    followLastIssue = performance.now();
    followLastTarget = { x: p.x, z: p.z };
    syncPlazaUI();
  }

  function stopFollow(reasonText) {
    if (!followId) return;
    followId = null;
    followLastTarget = null;
    if (reasonText) appendChatLog("", reasonText, true, { mine: true });
    scheduleRoster();
  }

  function followTick(now) {
    if (!followId) return;
    const p = peers.get(followId);
    if (!p || p.off) {
      stopFollow(tr("👣 跟隨對象已離開，停止跟隨。", "👣 The person you followed left."));
      return;
    }
    const av = window.heartIslandAvatar;
    const S = av?.S;
    if (!S?.fig?.group) return;
    if (!S.drive) {
      stopFollow(tr("👣 已結束漫遊模式，停止跟隨。", "👣 Walk mode ended — stopped following."));
      return;
    }
    const manual = Object.values(S.keys || {}).some(Boolean) || Object.values(S.padHold || {}).some(Boolean) || (S.joy?.mag || 0) > 0.15;
    if (manual) {
      stopFollow(tr("👣 已改為手動操控，停止跟隨。", "👣 You took control — stopped following."));
      return;
    }
    if (now - followLastIssue < 900) return;
    const me = S.fig.group.position;
    const d = Math.hypot(me.x - p.x, me.z - p.z);
    const movedT = followLastTarget ? Math.hypot(followLastTarget.x - p.x, followLastTarget.z - p.z) : Infinity;
    if (d > 1.6 && (movedT > 0.8 || !S.walk)) {
      followLastIssue = now;
      followLastTarget = { x: p.x, z: p.z };
      goToPeer(p, { quiet: true, keepOpen: true });
    }
  }

  function toggleMute(p) {
    if (!p) return;
    const name = p.look?.name || tr("夥伴", "visitor");
    if (mutedIds.has(p.id)) {
      mutedIds.delete(p.id);
      p.tagEl?.classList.remove("muted");
      appendChatLog("", tr(`🔈 已取消靜音 ${name}`, `🔈 Unmuted ${name}`), true, { mine: true });
    } else {
      mutedIds.add(p.id);
      p.sayText = "";
      if (followId === p.id) stopFollow("");
      p.tagEl?.classList.add("muted");
      appendChatLog("", tr(`🔇 已在本機靜音 ${name}（對方不會知道）`, `🔇 Muted ${name} on this device (they won't be notified)`), true, { mine: true });
    }
    saveMuted();
    syncPlazaUI();
  }

  function openPeerDialogue(peerOrId) {
    const peer = typeof peerOrId === "string" ? peers.get(peerOrId) : peerOrId;
    if (!peer) return;
    const av = window.heartIslandAvatar;
    const roleName = av?.ROLE_LABEL?.[peer.look?.role] || "參訪夥伴";
    const nm = peer.look?.name || tr("參訪夥伴", "Visitor");
    const muted = mutedIds.has(peer.id);
    if (peer.off) {
      openNpcModalBase({
        worldPos: { x: peer.x, z: peer.z },
        emoji: "😴",
        eyebrow: "OFFLINE · 離線中",
        name: `${peer.look?.name || "參訪夥伴"}（離線）`,
        badge: roleName,
        sub: peer.isl ? `最後位於：${peer.isl}` : "暫時離開，角色留在原地",
        greetingTag: "離線角色",
        greeting: `「${peer.look?.name || "夥伴"}」目前離線，角色先留在這裡（最多 6 小時）。\n對方上線後就能互相揮手或丟水球（私訊不會預先保存）。`,
        hideInput: true,
        chips: [
          {
            label: "💬 開啟旅伴廣場聊天",
            onClick: () => {
              closeNpcModal();
              toggleChat(true);
            },
          },
        ],
      });
      return;
    }
    openNpcModalBase({
      worldPos: { x: peer.x, z: peer.z },
      emoji: "🧑‍🤝‍🧑",
      eyebrow: "ONLINE VISITOR · 線上旅伴",
      name: nm,
      badge: roleName,
      sub: `${peerStars(peer) ? `${"★".repeat(peerStars(peer))} ${starTitle(peerStars(peer))}・` : ""}${peer.isl ? tr(`目前位於：${peer.isl}`, `Now at: ${peer.isl}`) : tr("正在高餐大旅館管理系群島探索中", "Exploring the islands")}`,
      greetingTag: tr("真人虛擬分身即時互動", "Live visitor avatar"),
      greeting: tr(
        `嗨！我是線上旅伴的「${nm}」（身分：${roleName}）。${peer.sayText && !muted ? `\n剛剛說：「${peer.sayText}」` : ""}\n您可以向我揮手、鞠躬、跟隨我一起逛，或在旅伴廣場聊天！`,
        `Hi! I'm "${nm}" (${roleName}), visiting online.${peer.sayText && !muted ? `\nJust said: "${peer.sayText}"` : ""}\nWave, bow, follow me around, or chat in the plaza!`
      ),
      hideInput: true,
      chips: [
        {
          label: tr("👋 向他熱情揮手", "👋 Wave"),
          gold: true,
          onClick: () => {
            doEmote("wave", peer);
            closeNpcModal();
          },
        },
        {
          label: tr("🙇 五星禮賓鞠躬", "🙇 Bow"),
          onClick: () => {
            doEmote("bow", peer);
            closeNpcModal();
          },
        },
        {
          label: followId === peer.id ? tr("✋ 停止跟隨", "✋ Stop following") : tr("👣 跟隨他", "👣 Follow"),
          onClick: () => {
            closeNpcModal();
            if (followId === peer.id) stopFollow(tr("👣 已停止跟隨。", "👣 Stopped following."));
            else startFollow(peer);
          },
        },
        {
          label: tr("☕ 舉杯邀請同行", "☕ Invite to explore"),
          onClick: () => {
            doEmote("coffee", peer);
            sendPlazaChat(tr(`@${nm} 一起去群賢會館與各主題島逛逛吧！☕`, `@${nm} Let's explore the islands together! ☕`));
            closeNpcModal();
            toggleChat(true);
          },
        },
        {
          label: tr("💌 丟水球（私訊）", "💌 Private message"),
          onClick: () => {
            closeNpcModal();
            startDm(peer);
          },
        },
        {
          label: tr("💬 開啟旅伴廣場聊天", "💬 Open plaza chat"),
          onClick: () => {
            closeNpcModal();
            toggleChat(true);
          },
        },
        {
          label: muted ? tr("🔈 取消靜音", "🔈 Unmute") : tr("🔇 靜音此人", "🔇 Mute"),
          onClick: () => {
            closeNpcModal();
            toggleMute(peer);
          },
        },
      ],
    });
  }

  // ── 連線狀態列：線上人數＋雲端狀態＋重試鈕
  let lastStatusKey = "";
  function syncStatus() {
    const total = (leftPlaza ? 0 : 1) + onlineCount();
    const away = peers.size - onlineCount();
    let dot = "wait", text = "", btn = "";
    const people = tr(`線上 ${total} 人`, `${total} online`) + (away ? tr(` · 離線 ${away}`, ` · ${away} away`) : "");
    if (wsState === "left") {
      dot = "local";
      text = tr(`${people} · 你已離開廣場`, `${people} · you left the plaza`);
      btn = tr("重新加入", "Rejoin");
    } else if (wsState === "open") {
      dot = "ok";
      text = tr(`${people} · 已連線`, `${people} · online`);
    } else if (wsState === "connecting") {
      dot = "wait";
      text = tr(`${people} · 連線雲端中…`, `${people} · connecting…`);
    } else if (wsState === "retry") {
      dot = "wait";
      const s = Math.max(0, Math.ceil((wsRetryAt - Date.now()) / 1000));
      text = tr(`${people} · 雲端連不上，${s} 秒後重試（同瀏覽器分頁仍可互見）`, `${people} · cloud unreachable, retry in ${s}s (same-browser tabs still work)`);
      btn = tr("立即重試", "Retry now");
    } else if (wsState === "offline") {
      dot = "bad";
      text = tr(`${people} · 雲端離線（僅同瀏覽器分頁可互見）`, `${people} · cloud offline (same-browser tabs only)`);
      btn = tr("重新連線", "Reconnect");
    } else {
      dot = "local";
      text = tr(`${people} · 純本機分頁模式`, `${people} · local tabs only`);
      btn = tr("連上雲端", "Go online");
    }
    const key = `${dot}|${text}|${btn}`;
    if (key === lastStatusKey) return;
    lastStatusKey = key;
    statusDot.className = `is-net-dot ${dot}`;
    statusText.textContent = text;
    retryBtn.hidden = !btn;
    retryBtn.textContent = btn;
  }
  setInterval(() => {
    if (wsState === "retry" && plazaDrawer.classList.contains("open")) syncStatus();
  }, 1000);

  let rosterTimer = 0;
  function scheduleRoster() {
    if (rosterTimer) return;
    rosterTimer = setTimeout(() => {
      rosterTimer = 0;
      if (plazaDrawer.classList.contains("open")) renderRoster();
    }, 400);
  }

  // 名單動作鈕：顯示簡短文字（手機看不到 tooltip），完整說明放在 aria-label／title
  const ACT_SHORT = {
    goto: [["前往", "Go"]],
    dm: [["私訊", "Message"], ["解除封鎖", "Unblock"]],
    wave: [["揮手", "Wave"]],
    follow: [["跟隨", "Follow"], ["停止跟隨", "Stop"]],
    mute: [["靜音", "Mute"], ["取消靜音", "Unmute"]],
    duel: [["對戰", "Duel"]],
    party: [["組隊", "Party"], ["離隊", "Leave"]],
    notice: [["發公告", "Notice"]],
    report: [["檢舉", "Report"]],
  };
  function rosterBtn(act, ico, zh, en, onClick, extra = {}) {
    const short = ACT_SHORT[act]?.[extra.on && ACT_SHORT[act][1] ? 1 : 0];
    const b = h(
      "button",
      { class: "is-roster-act" + (extra.on ? " on" : ""), type: "button", "data-act": act, "aria-pressed": extra.pressed, onclick: onClick },
      uiIcon(ico),
      h("span", { class: "is-roster-act-lbl", "aria-hidden": short ? "true" : null }, short ? tr(...short) : tr(zh, en))
    );
    if (short) b.setAttribute("aria-label", tr(zh, en));
    b.title = extra.title || tr(zh, en);
    return b;
  }

  let awayOpen = false; // 離線角色清單是否展開（僅本機）
  let expandedRow = null; // 名單中展開動作按鈕的那一列（"me" 或夥伴 id）；一次只展開一列
  function moreBtn(key, name) {
    const open = expandedRow === key;
    const b = h(
      "button",
      {
        class: "is-roster-more ui-icon-btn" + (open ? " on" : ""),
        type: "button",
        "aria-expanded": String(open),
        onclick: () => {
          expandedRow = open ? null : key;
          renderRoster();
        },
      },
      uiIcon(open ? "chevronUp" : "more")
    );
    b.setAttribute("aria-label", open ? tr(`收合 ${name} 的動作`, `Hide actions for ${name}`) : tr(`${name} 的動作`, `Actions for ${name}`));
    b.title = b.getAttribute("aria-label");
    return b;
  }
  function renderRoster() {
    const av = window.heartIslandAvatar;
    const myLook = getLocalLookSummary();
    const myRole = av?.ROLE_LABEL?.[myLook.role] || tr("訪客", "Visitor");
    const myIsl = av?.S?.curIslandName || "";
    const me = av?.S?.fig?.group?.position;
    const away = peers.size - onlineCount();
    rosterCountEl.textContent = tr(`${(leftPlaza ? 0 : 1) + onlineCount()} 人${away ? `・離線 ${away}` : ""}`, `${(leftPlaza ? 0 : 1) + onlineCount()}${away ? ` · ${away} away` : ""}`);
    tabPeopleCount.textContent = String((leftPlaza ? 0 : 1) + onlineCount());

    const rows = [
      h(
        "div",
        { class: "is-roster-item me" + (expandedRow === "me" ? " expanded" : "") },
        h("i", { class: "is-roster-sw", style: `background:${lookColor(myLook)}` }),
        h(
          "div",
          { class: "is-roster-who" },
          h(
            "b",
            {},
            myLook.name === "我" || myLook.name === "You" ? tr("我", "Me") : tr(`${myLook.name}（我）`, `${myLook.name} (me)`),
            myLook.lv ? h("span", { class: "is-roster-lv", title: starTitle(myLook.lv) }, " " + "★".repeat(myLook.lv)) : null
          ),
          h("span", { class: "is-roster-meta" }, `${myRole}${myIsl ? ` · ${myIsl}` : ""}`)
        ),
        moreBtn("me", tr("我", "me")),
        h(
          "div",
          { class: "is-roster-acts" },
          rosterBtn("look", "shirt", "換裝", "Avatar", () => {
            toggleChat(false);
            av?.api?.open?.();
          }),
          rosterBtn("dmopt", dmClosed ? "bellOff" : "bell", dmClosed ? "私訊關" : "私訊開", dmClosed ? "DMs off" : "DMs on", () => setDmClosed(!dmClosed), {
            on: !dmClosed,
            pressed: String(!dmClosed),
            title: dmClosed ? tr("目前不接收私訊，按一下開啟", "Not accepting private messages — tap to allow") : tr("目前接收私訊，按一下關閉", "Accepting private messages — tap to turn off"),
          }),
          rosterBtn("leave", leftPlaza ? "login" : "logout", leftPlaza ? "重新加入" : "離開", leftPlaza ? "Rejoin" : "Leave", () => (leftPlaza ? rejoinPlaza() : leavePlaza()), {
            title: leftPlaza ? tr("重新加入旅伴廣場", "Rejoin the plaza") : tr("離開旅伴廣場（角色不會留在場上）", "Leave the plaza (your character will not stay behind)"),
          }),
          ...plazaGames.meActs(rosterBtn)
        )
      ),
    ];

    const list = [...peers.values()];
    if (me) list.sort((a, b) => Math.hypot(a.x - me.x, a.z - me.z) - Math.hypot(b.x - me.x, b.z - me.z));
    list.sort((a, b) => Number(!!a.off) - Number(!!b.off)); // 離線角色排在後面（穩定排序，保留距離順序）
    // 離線角色預設收合成一列，避免把線上夥伴擠到下面
    const nOff = list.filter((p) => p.off).length;
    const nOn = list.length - nOff;
    if (!nOn) {
      rows.push(
        h(
          "div",
          { class: "is-roster-empty" },
          wsState === "open"
            ? tr("目前沒有其他人在線上。分享網址邀朋友，或請朋友用另一台裝置同時打開，就能即時互動！", "Nobody else is online right now — share the link or open it on another device to play together!")
            : tr("目前沒有其他人。同一瀏覽器開新分頁，或連上雲端即可看到彼此。", "Nobody else yet. Open another tab, or go online to meet others.")
        )
      );
    }
    let awayHeaderDone = false;
    for (const p of list) {
      if (p.off && !awayHeaderDone) {
        awayHeaderDone = true;
        rows.push(
          h(
            "button",
            {
              type: "button",
              class: "is-roster-away-toggle",
              "aria-expanded": String(awayOpen),
              onclick: () => {
                awayOpen = !awayOpen;
                renderRoster();
              },
            },
            uiIcon("moon"),
            h("span", {}, tr(`離線角色 ${nOff} 位（6 小時內回來可接續）`, `${nOff} away (can return within 6 h)`)),
            uiIcon(awayOpen ? "chevronDown" : "chevronRight")
          )
        );
      }
      if (p.off && !awayOpen) continue;
      const muted = mutedIds.has(p.id);
      const following = followId === p.id;
      const off = !!p.off;
      const pname = p.look?.name || tr("夥伴", "Visitor");
      const blocked = blockedIds.has(p.id);
      const lv = peerStars(p);
      const rLbl = av?.ROLE_LABEL?.[p.look?.role] || tr("夥伴", "Visitor");
      const near = me && p.initedPos && Math.hypot(p.x - me.x, p.z - me.z) < 2;
      const meta = [rLbl, p.isl || "", near ? tr("就在附近", "nearby") : ""].filter(Boolean).join(" · ");
      rows.push(
        h(
          "div",
          { class: "is-roster-item" + (off ? " off" : "") + (muted ? " muted" : "") + (following ? " following" : "") + (expandedRow === p.id ? " expanded" : ""), "data-peer": p.id },
          h("i", { class: "is-roster-sw", style: `background:${lookColor(p.look)}` }),
          h(
            "div",
            { class: "is-roster-who" },
            h(
              "b",
              {},
              off ? tr(`${pname}（離線）`, `${pname} (away)`) : muted ? tr(`${pname}（已靜音）`, `${pname} (muted)`) : pname,
              lv ? h("span", { class: "is-roster-lv", title: starTitle(lv) }, " " + "★".repeat(lv)) : null
            ),
            h("span", { class: "is-roster-meta" }, meta)
          ),
          moreBtn(p.id, pname),
          h(
            "div",
            { class: "is-roster-acts" },
            rosterBtn("goto", "goto", `前往 ${pname}`, `Go to ${pname}`, () => goToPeer(p), { iconOnly: false, title: tr(`走到 ${p.look?.name || "夥伴"} 身旁`, `Walk to ${p.look?.name || "them"}`) }),
            off
              ? null
              : blocked
                ? rosterBtn("dm", "ban", `解除封鎖 ${pname}`, `Unblock ${pname}`, () => toggleBlock(p.id, pname), { on: true, iconOnly: true, title: tr(`解除封鎖 ${pname} 的私訊`, `Unblock private messages from ${pname}`) })
                : rosterBtn("dm", "mail", `私訊 ${pname}`, `Message ${pname}`, () => startDm(p), { iconOnly: true, title: tr(`丟水球給 ${pname}`, `Send ${pname} a private message`) }),
            off ? null : rosterBtn("wave", "wave", `向 ${pname} 揮手`, `Wave at ${pname}`, () => doEmote("wave", p), { iconOnly: true, title: tr(`向 ${p.look?.name || "夥伴"} 揮手`, `Wave at ${p.look?.name || "them"}`) }),
            off ? null : rosterBtn(
              "follow",
              following ? "stop" : "follow",
              following ? `停止跟隨 ${pname}` : `跟隨 ${pname}`,
              following ? `Stop following ${pname}` : `Follow ${pname}`,
              () => (following ? stopFollow(tr("👣 已停止跟隨。", "👣 Stopped following.")) : startFollow(p)),
              { on: following, pressed: String(following), iconOnly: true, title: following ? tr("點一下停止跟隨", "Tap to stop following") : tr("自動跟在對方身後", "Walk behind them automatically") }
            ),
            rosterBtn("mute", muted ? "sound" : "mute", muted ? `取消靜音 ${pname}` : `靜音 ${pname}`, muted ? `Unmute ${pname}` : `Mute ${pname}`, () => toggleMute(p), {
              on: muted,
              iconOnly: true,
              pressed: String(muted),
              title: muted ? tr("恢復顯示對方訊息", "Show their messages again") : tr("在本機隱藏對方的訊息與氣泡", "Hide their messages on this device"),
            }),
            ...plazaGames.peerActs(p, pname, rosterBtn)
          )
        )
      );
    }
    rosterListEl.replaceChildren(...rows);
  }

  // 在線人數：不含留在場上的離線角色（p.off）
  function onlineCount() {
    let n = 0;
    for (const p of peers.values()) if (!p.off) n++;
    return n;
  }

  function syncPlazaUI() {
    window.__htlOnlinePeers = onlineCount();
    window.__htlLog?.setOnlineCount?.(onlineCount());
    syncStatus();
    updatePlazaBadges();
    if (plazaDrawer.classList.contains("open")) renderRoster();
  }

  function toggleChat(force) {
    const next = typeof force === "boolean" ? force : !plazaDrawer.classList.contains("open");
    plazaDrawer.classList.toggle("open", next);
    document.body.classList.toggle("is-plaza-open", next);
    if (next) {
      // 第一次進入旅伴廣場時請使用者取名（只問一次，可略過）
      setTimeout(() => window.heartIslandAvatar?.api?.maybeAskName?.(), 250);
      relabel();
      renderPhrases();
      lastStatusKey = "";
      setUnread(0);
      syncPlazaUI();
      chatListEl.scrollTop = chatListEl.scrollHeight;
      newMsgPill.hidden = true;
      // 桌機自動聚焦輸入框；手機不自動彈出鍵盤
      if (!isCoarse()) setTimeout(() => chatInputEl.focus({ preventScroll: true }), 30);
    } else if (plazaDrawer.contains(document.activeElement)) {
      document.activeElement.blur();
    }
  }

  // 漫遊模式下按 Enter（焦點不在輸入框／按鈕上）即可直接開啟廣場並開始打字
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Enter" || e.isComposing || e.altKey || e.ctrlKey || e.metaKey) return;
    const t = e.target;
    if (t && t !== document.body && t.tagName !== "CANVAS") return;
    if (!window.heartIslandAvatar?.S?.drive) return;
    if (document.querySelector(".is-npc-backdrop.open")) return;
    e.preventDefault();
    if (!plazaDrawer.classList.contains("open")) toggleChat(true);
    chatInputEl.focus({ preventScroll: true });
  });

  // ── 感應身旁的線上玩家或精選校園學長姐代表 NPC（供 heart-me.js 情境互動鍵 [E] 使用；相容 2 參數 (x, z) 與 3 參數 (x, y, z)）
  function senseNearby(x, yOrZ, maybeZ) {
    const z = typeof maybeZ === "number" ? maybeZ : yOrZ;
    if (typeof x !== "number" || typeof z !== "number") return null;

    // 1. 最優先感應距離 < 1.05 的線上真實玩家
    let bestPeer = null, bestPD = 1.05;
    for (const p of peers.values()) {
      if (!p.initedPos) continue;
      const d = Math.hypot(p.x - x, p.z - z);
      if (d < bestPD) {
        bestPD = d;
        bestPeer = p;
      }
    }
    if (bestPeer) {
      return {
        kind: "peer",
        id: bestPeer.id,
        peerId: bestPeer.id,
        name: bestPeer.look?.name || "線上夥伴",
        prompt: tr(`向線上夥伴「${bestPeer.look?.name || "夥伴"}」禮賓交流`, `Say hi to ${bestPeer.look?.name || "visitor"}`),
        hasCard: false,
        onInteract: () => openPeerDialogue(bestPeer),
      };
    }

    // 2. 僅感應佩戴頭頂素養徽章的精選學長姐代表 NPC（減少路人頻繁攔路干擾，但保留適度交流）
    const walkers = window.heartCity?.getNpcWalkers?.() || [];
    let bestW = null, bestWD = peers.size > 0 ? 0.45 : 0.56;
    for (const w of walkers) {
      if (!w.interactive) continue;
      const d = Math.hypot(w.x - x, w.z - z);
      if (d < bestWD) {
        bestWD = d;
        bestW = w;
      }
    }
    if (bestW) {
      return {
        kind: "walker",
        id: `w_${bestW.walkerIndex}`,
        walker: bestW,
        name: bestW.roleLabel,
        prompt: `與「${bestW.roleLabel}」經驗交流`,
        hasCard: true,
        onInteract: () => openWalkerDialogue(bestW),
        onCard: () => {
          if (bestW.flow) window.heartCity?.selectFlow?.(bestW.flow);
          else window.heartCity?.selectWalker?.(bestW.walkerIndex);
        },
      };
    }
    return null;
  }

  function findTappedPeer(clientX, clientY) {
    const av = window.heartIslandAvatar;
    if (!av?.cap?.camera || !peers.size) return null;
    const canvas = document.querySelector("canvas");
    if (!canvas) return null;
    const r = canvas.getBoundingClientRect();
    const v = new av.T.Vector3();
    let hitP = null;
    let hitPD = matchMedia("(pointer:coarse)").matches ? 46 : 32;
    for (const p of peers.values()) {
      if (!p.initedPos) continue;
      v.set(p.x, p.y + 0.25, p.z).project(av.cap.camera);
      if (v.z > 1) continue;
      const sx = ((v.x + 1) / 2) * r.width + r.left;
      const sy = ((1 - v.y) / 2) * r.height + r.top;
      const d = Math.hypot(clientX - sx, clientY - sy);
      if (d < hitPD) {
        hitPD = d;
        hitP = p;
      }
    }
    return hitP;
  }

  function tapPeerAt(clientX, clientY) {
    const hitP = findTappedPeer(clientX, clientY);
    if (!hitP) return false;
    openPeerDialogue(hitP);
    return true;
  }

  // 在自由操控模式下：允許玩家直接點選畫面上的線上玩家、專任師長或精選學長姐代表 NPC 展開對話！
  function handleCanvasTap(clientX, clientY) {
    const av = window.heartIslandAvatar;
    const hc = window.heartCity;
    if (!av?.cap?.camera) return false;
    const canvas = document.querySelector("canvas");
    if (!canvas) return false;
    const r = canvas.getBoundingClientRect();
    const T = av.T;
    const v = new T.Vector3();
    const maxPx = matchMedia("(pointer:coarse)").matches ? 42 : 28;

    const screenDist = (wx, wy, wz) => {
      v.set(wx, wy, wz).project(av.cap.camera);
      if (v.z > 1) return Infinity;
      const sx = ((v.x + 1) / 2) * r.width + r.left;
      const sy = ((1 - v.y) / 2) * r.height + r.top;
      return Math.hypot(clientX - sx, clientY - sy);
    };

    // 1. 最優先檢查是否點到線上真實玩家
    const hitP = findTappedPeer(clientX, clientY);
    if (hitP) {
      const myPos = av.S.fig.group.position;
      if (Math.hypot(hitP.x - myPos.x, hitP.z - myPos.z) <= 1.15) {
        openPeerDialogue(hitP);
      } else {
        goToPeer(hitP, { keepOpen: true });
      }
      return true;
    }

    // 2. 檢查是否點到 3D 專任師長
    let hitT = null, hitTD = maxPx;
    for (const f of hc?.getFacultyPositions?.() || []) {
      const d = screenDist(f.x, f.y + 0.28, f.z);
      if (d < hitTD) {
        hitTD = d;
        hitT = f;
      }
    }
    if (hitT) {
      const myPos = av.S.fig.group.position;
      if (Math.hypot(hitT.x - myPos.x, hitT.z - myPos.z) <= 1.1) {
        openTeacherDialogue(hitT);
      } else {
        av.api.goToPoint(hitT.x, hitT.z, `走向師長：${txt(hitT.name)}`, () => openTeacherDialogue(hitT));
      }
      return true;
    }

    // 3. 僅檢查是否點到精選學長姐代表 NPC（w.interactive），避免一般路人搶走地面移動或建築點擊
    let hitW = null, hitWD = maxPx * 0.74;
    for (const w of hc?.getNpcWalkers?.() || []) {
      if (!w.interactive) continue;
      const d = screenDist(w.x, w.y + 0.24, w.z);
      if (d < hitWD) {
        hitWD = d;
        hitW = w;
      }
    }
    if (hitW) {
      const myPos = av.S.fig.group.position;
      if (Math.hypot(hitW.x - myPos.x, hitW.z - myPos.z) <= 1.1) {
        openWalkerDialogue(hitW);
      } else {
        av.api.goToPoint(hitW.x, hitW.z, `走向：${hitW.roleLabel}`, () => openWalkerDialogue(hitW));
      }
      return true;
    }
    return false;
  }

  // ── 每幀更新所有遠端玩家的 60fps 平滑插值、肢體動畫與頭頂名牌／對話氣泡投影
  let lastPeerFrame = performance.now();
  const MAX_DRAWN_OFF = 30;
  let lastOffPick = -1e9;
  let drawnOff = new Set();
  function updatePeersFrame(now, localSnap) {
    const av = window.heartIslandAvatar;
    if (!av?.cap?.camera) return;
    const dt = Math.min(0.1, Math.max(0.001, (now - lastPeerFrame) / 1000));
    lastPeerFrame = now;
    followTick(now);

    // 1. 節流廣播本地玩家座標（移動中每 90ms 一次，靜止心跳每 8000ms 一次；對方 18.5 秒沒收到才移除，仍有兩次餘裕）
    //    2026-11-13：靜止心跳由 2.8 秒改 8 秒，閒置時廣場伺服器的訊息量約少 65%
    if (localSnap && !leftPlaza) {
      const movedDist = Math.hypot(localSnap.x - lastSentSnap.x, localSnap.z - lastSentSnap.z);
      const yawDiff = Math.abs(wrapAngle(localSnap.yaw - lastSentSnap.yaw));
      const stateChanged = localSnap.moving !== lastSentSnap.moving || movedDist > 0.015 || yawDiff > 0.06 || localSnap.jumpY > 0.01;
      const interval = stateChanged ? 90 : 8000;
      if (now - lastNetSendAt >= interval) {
        lastNetSendAt = now;
        lastSentSnap = { x: localSnap.x, z: localSnap.z, yaw: localSnap.yaw, moving: localSnap.moving };
        sendPacket({
          t: "state",
          look: getLocalLookSummary(),
          x: +localSnap.x.toFixed(3),
          y: +localSnap.y.toFixed(3),
          z: +localSnap.z.toFixed(3),
          yaw: +localSnap.yaw.toFixed(3),
          moving: !!localSnap.moving,
          sprint: !!localSnap.sprint,
          jumpY: +(localSnap.jumpY || 0).toFixed(3),
          emote: localSnap.emote || null,
          isl: localSnap.islandName || "",
        });
      }
    }

    if (!peers.size) return;
    checkMentorship(now);

    const T = av.T;
    const cam = av.cap.camera;
    const canvas = document.querySelector("canvas");
    const rect = canvas ? canvas.getBoundingClientRect() : { left: 0, top: 0, width: innerWidth, height: innerHeight };
    const cleanMode = !!av.S?.clean;
    const projV = new T.Vector3();

    // 離線角色最多 100 位：地圖上只畫離自己最近的 30 位（每秒重算），其餘只在名單出現，手機才不會卡
    if (now - lastOffPick > 1000) {
      lastOffPick = now;
      const me = av.S?.fig?.group?.position;
      const offs = [...peers.values()].filter((q) => q.off);
      if (me) offs.sort((a, b) => Math.hypot(a.x - me.x, a.z - me.z) - Math.hypot(b.x - me.x, b.z - me.z));
      drawnOff = new Set(offs.slice(0, MAX_DRAWN_OFF).map((q) => q.id));
    }
    for (const [id, p] of peers) {
      // 離線角色由伺服器管理（6 小時後送 bye），不套用本機逾時
      if (!p.off && now - p.lastSeen > 18500) {
        removePeer(id);
        continue;
      }
      if (p.off && !drawnOff.has(id)) {
        if (p.fig) p.fig.group.visible = false;
        p.tagEl.style.display = "none";
        p.sayEl.style.display = "none";
        continue;
      }
      if (!p.fig) {
        ensurePeerAvatar(id, p.look);
        if (!p.fig) continue;
      }
      const g = p.fig.group;
      if (!g.visible) g.visible = true; // 重新進入「最近 30 位」時再顯示
      const kPos = 1 - Math.exp(-dt * 13);
      const prevX = p.x, prevZ = p.z;
      p.x += (p.tx - p.x) * kPos;
      p.y += (p.ty - p.y) * kPos;
      p.z += (p.tz - p.z) * kPos;
      p.yaw += wrapAngle(p.tyaw - p.yaw) * (1 - Math.exp(-dt * 15));

      g.position.set(p.x, p.y + (p.jumpY || 0), p.z);
      g.rotation.set(0, p.yaw, 0);
      av.applyFigScale(p.fig);

      const velMove = Math.hypot(p.x - prevX, p.z - prevZ) / dt > 0.08;
      const isWalking = p.moving || velMove;

      if (p.emote && now > p.emoteUntil) p.emote = null;

      // 肢體與禮賓動作動畫
      let overZ = false;
      if (p.jumpY > 0.02) {
        p.fig.legs[0].rotation.x = 0.45;
        p.fig.legs[1].rotation.x = -0.35;
        p.fig.arms[0].rotation.x = -2.6;
        p.fig.arms[1].rotation.x = -2.6;
      } else if (isWalking) {
        const stride = p.sprint ? 14 : 10.5;
        const s = Math.sin((now / 1000) * stride) * (p.sprint ? 0.78 : 0.6);
        p.fig.legs[0].rotation.x = s;
        p.fig.legs[1].rotation.x = -s;
        p.fig.arms[0].rotation.x = -s;
        p.fig.arms[1].rotation.x = s;
        g.rotation.x = p.sprint ? 0.1 : 0.035;
      } else if (p.emote) {
        const elap = (now - p.emoteStart) / 1000;
        const rem = (p.emoteUntil - now) / 1000;
        const env = Math.min(1, elap / 0.2) * Math.min(1, rem / 0.25);
        p.fig.legs[0].rotation.x = p.fig.legs[1].rotation.x = 0;
        if (p.emote === "bow") {
          g.rotation.x = 0.25 * env;
          p.fig.arms[0].rotation.x = -0.58 * env;
          p.fig.arms[1].rotation.x = -0.58 * env;
          p.fig.arms[0].rotation.z = 0.32 * env;
          p.fig.arms[1].rotation.z = -0.32 * env;
          overZ = true;
        } else if (p.emote === "cheer") {
          const wv = Math.sin(now / 110) * 0.28;
          p.fig.arms[0].rotation.x = -2.65 + wv;
          p.fig.arms[1].rotation.x = -2.65 - wv;
          p.fig.arms[0].rotation.z = -0.22;
          p.fig.arms[1].rotation.z = 0.22;
          overZ = true;
        } else if (p.emote === "coffee") {
          p.fig.arms[0].rotation.x = 0;
          p.fig.arms[1].rotation.x = (-1.55 + Math.sin(now / 260) * 0.12) * env;
        } else {
          p.fig.arms[0].rotation.x = 0;
          p.fig.arms[1].rotation.x = -2.55 + Math.sin(now / 130) * 0.42;
        }
      } else {
        // 站著：雙手隨呼吸輕微擺動（離線角色靜止）
        p.fig.legs[0].rotation.x = p.fig.legs[1].rotation.x = 0;
        const br = p.off ? 0 : Math.sin(now / 900 + (p.phase ||= Math.random() * 6)) * 0.045;
        p.fig.arms[0].rotation.x = br;
        p.fig.arms[1].rotation.x = -br;
      }
      if (!overZ) {
        p.fig.arms[0].rotation.z = 0;
        p.fig.arms[1].rotation.z = 0;
      }
      if (!p.off) window.heartIslandAvatar?.blinkFigure?.(p.fig, now);
      for (let i = 0; i < 2; i++) {
        p.fig.hands[i].quaternion.copy(p.fig.arms[i].quaternion).invert();
      }
      p.fig.pin.position.y = p.fig.pinY + Math.sin(now / 400) * 0.02;
      p.fig.pin.visible = !cleanMode;
      p.fig.ring.visible = !cleanMode;

      // 投影頭頂名牌與對話氣泡
      projV.copy(g.position);
      projV.y += (p.fig.pinY + 0.18) * g.scale.y;
      projV.project(cam);
      const vis = !cleanMode && projV.z < 1 && Math.abs(projV.x) < 1.08 && Math.abs(projV.y) < 1.08;
      if (vis) {
        const sx = ((projV.x + 1) / 2) * rect.width + rect.left;
        const sy = ((1 - projV.y) / 2) * rect.height + rect.top;
        p.tagEl.style.display = "inline-flex";
        p.tagEl.style.transform = `translate(${sx.toFixed(1)}px, ${sy.toFixed(1)}px) translate(-50%, -100%)`;

        if (p.sayText && now < p.sayUntil && !mutedIds.has(p.id)) {
          if (p.sayEl.textContent !== p.sayText) p.sayEl.textContent = p.sayText;
          p.sayEl.style.display = "block";
          p.sayEl.style.transform = `translate(${sx.toFixed(1)}px, ${(sy - 30).toFixed(1)}px) translate(-50%, -100%)`;
        } else {
          p.sayEl.style.display = "none";
        }
      } else {
        p.tagEl.style.display = "none";
        p.sayEl.style.display = "none";
      }
    }
  }

  // 關閉分頁：只通知本機其他分頁；雲端伺服器會在連線中斷時把角色標示為「離線」並保留 6 小時
  window.addEventListener("beforeunload", () => {
    if (bc && !leftPlaza) {
      try {
        bc.postMessage({ t: "bye", id: SESSION_ID, room: currentRoom, _pid: `${SESSION_ID}:${PAGE_NONCE}:${++pktSeq}` });
      } catch {}
    }
  });

  // 也在頂部導覽列與手機右上快捷區掛載輕巧的「👥 旅伴廣場」入口鈕，未開搖桿時也能直接開啟多人廣場與對話
  function mountToolbarButton() {
    const isEnUI = document.documentElement.lang === "en" || new URLSearchParams(location.search).get("lang") === "en";
    const bar = document.querySelector("nav.toolbar");
    if (bar && !document.querySelector("#htl-plaza-open")) {
      const btn = h(
        "button",
        {
          id: "htl-plaza-open",
          class: "wide",
          type: "button",
          title: isEnUI ? "Open Multiplayer Virtual Plaza & Chat" : "開啟多人旅伴交流廣場",
          onclick: () => toggleChat(),
        },
        h("i", { class: "tb-ic", "aria-hidden": "true" }, "👥"),
        h("span", { class: "tb-lbl" }, isEnUI ? "Plaza" : "旅伴")
      );
      bar.append(btn);
    }
    const mob = document.querySelector(".mob-top-actions");
    if (mob && !document.querySelector("#mob-plaza-btn")) {
      const mbtn = h(
        "button",
        {
          id: "mob-plaza-btn",
          type: "button",
          title: isEnUI ? "Multiplayer Virtual Plaza" : "多人旅伴與交流廣場",
          "aria-label": isEnUI ? "Multiplayer Virtual Plaza" : "多人旅伴廣場",
          onclick: () => toggleChat(),
        },
        "👥"
      );
      const langRef = mob.querySelector("#mob-lang-btn") || mob.firstChild;
      mob.insertBefore(mbtn, langRef);
    }
  }

  const identityReady = claimIdentity().catch(() => {});
  async function initNetworkWhenReady() {
    if (!window.heartIslandAvatar?.buildFigure) {
      setTimeout(initNetworkWhenReady, 250);
      return;
    }
    await identityReady;
    mountToolbarButton();
    // 工具列可能晚一點才渲染：補掛入口鈕與徽章
    setTimeout(() => {
      mountToolbarButton();
      updatePlazaBadges();
    }, 1500);
    setupBroadcastChannel();
    if (customWsUrl) connectWebSocket();
    syncPlazaUI();
  }
  initNetworkWhenReady();

  window.htlSocial = {
    games: plazaGames, // QA / other modules: read-only state (caps, party, duel)
    openTeacherDialogue,
    openWalkerDialogue,
    openHostDialogue,
    openPeerDialogue,
    toggleChat,
    senseNearby,
    handleCanvasTap,
    tapPeerAt,
    getWsState: () => ({ state: wsState, url: customWsUrl, room: currentRoom, peers: peers.size, away: [...peers.values()].filter((p) => p.off).length }),
    leavePlaza,
    rejoinPlaza,
    closeTopModal() {
      if (closeNpcModal()) return true;
      if (plazaDrawer.classList.contains("open")) {
        toggleChat(false);
        return true;
      }
      return false;
    },
    onLocalTick(now, snap) {
      updatePeersFrame(now, snap);
    },
    broadcastEmote(kind) {
      broadcastEmoteInternal(kind);
    },
    broadcastLook(look) {
      sendPacket({ t: "look", look: { ...look, name: sanitizeText(look?.name || "高餐訪客", 16), lv: myStars(), lvl: myLevel() } });
      syncPlazaUI();
    },
    focusPeer(peerId) {
      const p = peers.get(peerId);
      if (!p) {
        toggleChat(true);
        return false;
      }
      const av = window.heartIslandAvatar;
      if (av?.S?.drive && av?.api?.goToPoint) {
        goToPeer(p, { keepOpen: true });
        return true;
      }
      if (av?.cap?.camera && av?.cap?.controls && av?.T) {
        window.heartCity?.releaseCamera?.();
        const T = av.T;
        const tgt = new T.Vector3(p.x, p.y + 0.25, p.z);
        av.cap.controls.target.copy(tgt);
        av.cap.camera.position.copy(tgt.clone().add(new T.Vector3(1.5, 1.35, 2.5)));
        av.cap.controls.update?.();
      }
      openPeerDialogue(p);
      return true;
    },
    getOnlineCount() {
      return (leftPlaza ? 0 : 1) + [...peers.values()].filter((p) => !p.off).length;
    },
    goToPeer: (id) => goToPeer(peers.get(id)),
    followPeer: (id) => (id ? startFollow(peers.get(id)) : stopFollow("")),
    mutePeer: (id) => toggleMute(peers.get(id)),
    getPlazaState: () => ({
      ws: wsState,
      room: currentRoom,
      unread: unreadCount,
      followId,
      muted: [...mutedIds],
      peers: [...peers.values()].map((p) => ({ id: p.id, name: p.look?.name, isl: p.isl, x: p.x, z: p.z })),
    }),
  };
})();

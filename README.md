# HOTEL 旅館島｜國立高雄餐旅大學・旅館管理系 3D 學習與職涯導覽系統

<p align="center">
  <img src="assets/nkuht_htl_logo.png" alt="國立高雄餐旅大學旅館管理系系徽" width="120" height="120">
</p>

- **線上 3D 互動導覽島（Cloudflare Pages）**：<https://nkuht-htl.drmjhsu.com/>（舊網址 <https://htl-island-navigator.pages.dev/> 仍可使用）
- **2D 時間軸與卡片總覽**：<https://nkuht-htl.drmjhsu.com/timeline.html>
- **國立高雄餐旅大學旅館管理系官方網站**：<https://hotel.nkuht.edu.tw/>

---

## 專案簡介

本專案將 **國立高雄餐旅大學旅館管理系（NKUHT Department of Hotel Management，民國 84 年核定成立旅館管理科）** 官網公開的沿革、教育理念、課程標準表、1+3 畢業條件、校內實習旅館「群賢會館」與「菁英實習計畫3.0」合作夥伴，以及餐旅學院師資頁的 10 位專任(案)教師資料，轉化為一座可自由探索、可操控角色走動的 **3D 立體六角島嶼城市（20 座主題島嶼、133 座立體微縮建築、36 條協作線）** 以及 **2D 四年學習時間軸總覽**。

> **資料來源只有兩個官方網站**：餐旅學院師資頁 <https://shm.nkuht.edu.tw/p/412-1016-854.php?Lang=zh-tw> 與旅館管理系官網 <https://hotel.nkuht.edu.tw/?Lang=zh-tw>（含其選單下的子頁）。詳見下方「官方資料同步」。

### 核心功能特色
1. **旅館系 CIS 黃色 × 暖橘色視覺識別與官方系徽整合**：
   - 融合高餐大旅館管理系 CIS 榮耀金黃（`#F5D33A` / `#E5A922`）與暖陽珊瑚橘（`#DB6A41`），並嵌入旅館管理系官方圓形系徽（`DEPARTMENT OF HOTEL MANAGEMENT · 1995 · NKUHT`）。
2. **🕹️ 3D 角色可控自由走動（WASD ／ 方向鍵 ／ 虛擬搖桿 ／ 點擊地面尋路）**：
   - 點擊右上角工具列 **`🕹️ 操控`**（或直接按鍵盤 **`W / A / S / D`**），即可親自控制高餐學生 3D 角色走遍 20 座主題島嶼與跨島拱橋。
   - 支援 **鍵盤 `WASD` 與方向鍵 `↑↓←→`**、畫面下方 **觸控方向鍵搖桿（`▲ ▼ ◀ ▶`）**、**`🏃 跑步加速`**，以及 **直接點擊地面自動走過去**。
   - 走近任一棟微縮教學或實習飯店建築時，會自動跳出提示並可按 `E` 鍵或點擊按鈕直接展開該項目的詳細介紹卡。
   - 點擊 **`☺ 角色`** 可自由換裝（高餐學生、系所教授、侍酒師、實習生、飯店主管等）、調整體型、與高餐領航員合照。
3. **20 座系所主題六角島 × 133 個教學與實習細項**：
   - 涵蓋：系務核心與沿革、教育理念與培育目標、三明治教學與實習動線、課程標準表、餐飲服務與酒類專業、群賢會館、畢業條件（1+3）、專任(案)教師陣容（10 位師長）、實習旅館專島（校內群賢會館與 24 家菁英實習合作旅館同島無分區、等比例星級大樓）與菁英實習3.0 選才輪調制度、系務規章、餐旅講座與系上活動、國際交流、外語與跨文化服務、校園與專業教室、旅館資訊系統（OPERA／德安 PMS）、升學就業與菁英實習3.0。
4. **◫ 3D 旅館島 ↔ 2D 時間軸雙模式切換**：
   - 提供完整無障礙檢索與篩選的 `timeline.html` 2D 時間軸總覽，依第一至第四學年（第三學年為校外實習（一）（二））分階段呈現。

---

## ⓘ 引用宣告與開源致謝（Attribution & Open-Source Acknowledgments）

本專案純供國立高雄餐旅大學旅館管理系高等教育與職涯導覽展示用途，無涉任何外部商業或特定立場；系統開發過程中整合並參考以下系所官方公開資料與國際學術／開源技術專案，謹向原作者與開源社群致上誠摯謝意：

1. **系所內容、課程資料與系徽圖像來源**：
   - **國立高雄餐旅大學 旅館管理系（NKUHT Department of Hotel Management）**：<https://hotel.nkuht.edu.tw/?Lang=zh-tw>
   - **國立高雄餐旅大學 餐旅學院・旅館管理系專任(案)教師**：<https://shm.nkuht.edu.tw/p/412-1016-854.php?Lang=zh-tw>
   - **國立高雄餐旅大學 校內實習旅館「群賢會館」**（系網專區）：<https://hotel.nkuht.edu.tw/p/403-1018-608.php?Lang=zh-tw>
   - 所有系所簡介、師資名單、歷年課程標準表、畢業條件標準表、菁英實習計畫 3.0 合作酒店資料及系徽著作權均歸屬國立高雄餐旅大學旅館管理系所有。
2. **軸向六角格網幾何與即時六角群島雷達演算法**：
   - **Amit Patel — [Red Blob Games: Hexagonal Grids](https://www.redblobgames.com/grids/hexagons/)**：20 座主題島嶼之尖頂軸向六角座標系（Pointy-Top Axial Coordinates）、鄰接拓樸與距離演算法參考。
   - **[`flauwekeul/honeycomb`](https://github.com/flauwekeul/honeycomb)**（MIT License）：六角網格幾何投影與 `hex-radar.js` 即時 20 島六角雷達導覽圖設計參考。
3. **3D WebGL 渲染引擎、微縮互動世界與程序化星級酒店建築**：
   - **[`mrdoob/three.js`](https://github.com/mrdoob/three.js)**（作者：Mr.doob and contributors，**MIT License**）：WebGL 3D 場景渲染、`InstancedMesh` 批次繪製、`RoundedBoxGeometry`、`RoomEnvironment` PBR 光照與 `SimplexNoise` 波浪地形。
   - **[`bruno-simon/folio-2019`](https://github.com/bruno-simon/folio-2019)**（作者：Bruno Simon，**MIT License**）：WebGL 3D 微縮立體世界探索、地面目標導航光環與第三人稱追隨鏡頭互動美學參考。
   - **[`achrefelouafi/ProceduralBuildingsThreeJS`](https://github.com/achrefelouafi/ProceduralBuildingsThreeJS)**（**MIT License**）：`InstancedMesh` 模組化星級酒店立面、窗框格柵（Mullions）、迎賓雨棚（Porte-cochère）與建築幾何組合設計參考。
   - **[`N8python/n8ao`](https://github.com/N8python/n8ao)**（**CC0 1.0**，內建於 `vendor/n8ao/N8AO.js`）：高效率螢幕空間環境光遮蔽（Ambient Occlusion），賦予 3D 微縮建築柔和立體陰影。
   - **[`ybouane/tiltshift-in-html`](https://github.com/ybouane/tiltshift-in-html)**（**MIT License**）與 **[`KenneyNL`（Kenney Game Assets）](https://github.com/KenneyNL)**（**CC0 1.0 Public Domain**）：WebGL 微縮模型移軸景深（Tilt-Shift Miniature Lens）與低多邊形渡假村／城市道具設計語彙參考。
4. **3D 角色操控、360° 浮動搖桿與 2D 多關鍵字智慧檢索介面**：
   - **[`yoannmoinet/nipplejs`](https://github.com/yoannmoinet/nipplejs)**（**MIT License**）：行動端 360° 動態浮動原點虛擬類比搖桿人體工學與衝刺曲線參考。
   - **Three.js 低多邊形角色骨架與換裝基礎模組**：改編自 GitHub 開源開發者 `readper` 之 **MIT License** 低多邊形角色幾何模組（保留完整 MIT 授權聲明於 `heart-me.js`），並由本專案獨立擴充開發 RPG 主線自動尋路、20 島瞬間傳送與雙語禮賓對話互動系統。
   - **[`krisk/Fuse`（Fuse.js）](https://github.com/krisk/Fuse)**（**Apache-2.0**）、**[`lucide-icons/lucide`](https://github.com/lucide-icons/lucide)**（**ISC License**）與 **[W3C WAI-ARIA APG](https://www.w3.org/WAI/ARIA/apg/)**：2D 四年學習時間軸與 3D 側邊欄之多關鍵字權重容錯檢索、向量介面圖示與無障礙互動規範參考。
5. **遊戲化護照、程序化飯店服務鈴音效、慶祝粒子與開源字體**：
   - **[`KilledByAPixel/ZzFX`](https://github.com/KilledByAPixel/ZzFX)**（作者：Frank Force，**MIT License**）：零外部音檔之 WebAudio 程序化飯店櫃檯黃銅服務鈴（🛎️ Ding!）、巡禮蓋章與解鎖禮號角合成靈感。
   - **[`catdad/canvas-confetti`](https://github.com/catdad/canvas-confetti)**（作者：Kiril Vatev，**ISC/MIT License**，內建於 `vendor/canvas-confetti`）：成就徽章解鎖與升星慶祝彩帶粒子特效。
   - **[Google Fonts — Noto Serif TC / Noto Sans TC / Cormorant Garamond / Plus Jakarta Sans](https://github.com/notofonts/noto-cjk)**（**SIL Open Font License 1.1**）：五星級奢華酒店編輯式雙語字體排印。

---

## 官方資料同步（data/official.json）

所有系所事實都以兩個官方網站為準，由 `scripts/sync.py` 擷取：

| 指令 | 用途 |
|---|---|
| `python scripts/sync.py` | 下載兩個官網 → 更新 `data/official.json` 與 `official-data.js`，並檢查網站資料 |
| `python scripts/sync.py --check` | 只比對；官網內容有變動時回傳 10（`.githooks/pre-push` 使用） |
| `python scripts/sync.py --verify` | 離線檢查 `policies.json`、`people.js`、`index.html` 等是否含已知錯誤或與官網不符 |

- `data/official.json` 只在官網內容改變時才會變動（時間戳記寫在 `data/sync.json`），`git diff data/` 就是官網的實際變更。
- 任一頁下載失敗或解析筆數過少時不會覆寫，保留上一版並回傳錯誤。
- 師資卡片（職稱、分機、信箱、專長、授課領域、學歷）直接讀取 `official-data.js`，不在 `people.js` 手寫。
- 畢業條件、課程標準表與菁英實習 3.0 的 PDF 文字需選用套件 `pypdf`；未安裝時沿用上一版文字，並以 sha256 偵測 PDF 是否更新。
- 官網兩處不一致時：職稱／專長／授課領域採餐旅學院師資列表頁，分機與信箱採個人師資頁（列表頁有誤植，例如謝文欽信箱列為 `enchin@`，個人頁與系網皆為 `wenchin@`）。

## 本地端預覽方式

本專案為純靜態網頁（Vanilla ES Modules + Three.js，無須編譯打包），啟動任一靜態伺服器即可於本地端瀏覽：

```bash
python -m http.server 8765
# 開啟瀏覽器前往 http://localhost:8765/
```

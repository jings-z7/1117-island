# 資訊安全政策與弱點通報（Security Policy）

本專案「高餐大旅館管理系 學習與職涯島嶼導覽器」為公開靜態導覽網站，另含一個雲端元件。本專案**不使用任何 API 金鑰或外部 AI 服務**：

| 元件 | 位置 | 說明 |
|---|---|---|
| 靜態網站 | Cloudflare Pages `nkuht-htl.drmjhsu.com`（舊網址 `htl-island-navigator.pages.dev` 仍可使用） | 所有內容皆源自官方公開網頁（見 `CLAUDE.md` 資料規則） |
| 多人旅伴廣場 | Cloudflare Worker + Durable Objects `htl-island-plaza` | WebSocket 即時轉發位置、外觀、短聊天訊息與一對一私訊（丟水球）；保存離線角色最多 6 小時 |

## 通報資安弱點

請**不要**在公開 Issue 張貼弱點細節。請改用 GitHub 的私密通報功能：
Repository → **Security** → **Report a vulnerability**（GitHub Private Vulnerability Reporting）。
網站亦依 RFC 9116 提供機器可讀的聯絡資訊：`https://nkuht-htl.drmjhsu.com/.well-known/security.txt`。

請盡量提供：受影響的網址或檔案、重現步驟、可能影響。我們會在 **5 個工作天內**回覆確認，
並依嚴重度安排修補（高風險目標 14 天內、中風險 30 天內），修補後於 Advisory 中致謝（如您同意）。

## 支援範圍

僅 `main` 分支的最新部署版本會接受安全修補。

## 資料處理原則

- 網站不要求登入、不收集姓名、電子郵件等個人資料；不使用追蹤型 Cookie。
- 角色暱稱只存在使用者自己的瀏覽器（localStorage）。首次使用時會請使用者取名（可略過，略過時自動給一個中性的隨機暱稱），並提醒不要填真實姓名或個人資料。
- 「角色轉移碼」：使用者主動產生一組 12 碼轉移碼，在另一台裝置輸入即可帶過去暱稱、外觀、護照進度與廣場設定（不含廣場身分金鑰）。資料在瀏覽器端以轉移碼加密，伺服器只暫存無法解讀的密文，一次性、10 分鐘後自動刪除。
- 旅伴廣場的聊天訊息與私訊只在記憶體中轉發（私訊只送給收件者），不寫入資料庫、不記錄日誌；收件者離線時私訊直接回報未送達，不代為保存。
- 玩家關閉分頁或斷線後，伺服器會保存其「離線角色」（暱稱、外觀、最後位置，以及 key 的 SHA-256 雜湊）於 Durable Object Storage，每房最多 100 位（地圖只繪製最近 30 位）、6 小時後自動刪除，停留不到 1 分鐘就離開者不保留；按「🚪 離開」則立即刪除、不留下角色。玩家 id／key 為隨機代碼，存放於使用者瀏覽器的 localStorage。
- NPC 禮賓的回答由瀏覽器內的「官網實證引擎」產生，只依據官方公開資料；提問內容不會傳出使用者的瀏覽器。
- 本專案沒有任何秘密金鑰；日後若需加入，只能存放於 Cloudflare 環境變數（Secret），不得提交到 Git。

詳細的風險評估與 ISO/IEC 27001:2022 控制措施對照，請見 [`docs/security/ISO27001-assessment.md`](docs/security/ISO27001-assessment.md)。

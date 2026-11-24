# 高餐大旅館管理系 學習與職涯島嶼導覽器 (HTL Island Navigator)

Static site presenting 20 theme islands and 133 items about the Department of Hotel Management at National Kaohsiung University of Hospitality and Tourism (`https://hotel.nkuht.edu.tw/`).

- GitHub Repository: `https://github.com/drjacqueshsu/HTL_island_navigator` (single consolidated `main` branch)
- Cloudflare Pages Deployment (static frontend only — no Pages Functions, no API keys): `https://nkuht-htl.drmjhsu.com/` (custom domain, canonical; the old `https://htl-island-navigator.pages.dev/` still serves the same site)
- NPC answers come only from the local evidence engine in `island-social.js` (`answerOfficialQuestion`, reads `official-data.js`); there is deliberately no cloud AI / LLM call
- Cloudflare Worker + Durable Objects (Cross-Device Multiplayer Plaza `PlazaRoom`): `wss://htl-island-plaza.dr-jacqueshsu.workers.dev/ws` (`workers/plaza-server/worker.js`)

## Data rule (must follow)

Every fact shown on the site must come from one of the two official sources, captured in `data/official.json`:

- Faculty: `https://shm.nkuht.edu.tw/p/412-1016-854.php?Lang=zh-tw` (餐旅學院・旅館管理系專任(案)教師, plus each teacher's profile page)
- Department: `https://hotel.nkuht.edu.tw/?Lang=zh-tw` (and the pages in its menu: 本系介紹、教育理念、行政與系務、師資介紹、行政人員、課程標準表、畢業條件標準表、課程地圖、群賢會館、本系規章、菁英實習合作機構)

Research facts only (government research projects and the "World's Top 2% Scientists" lists) may also come from two public databases, captured in `data/research.json`:

- GRB 政府研究資訊系統 `https://www.grb.gov.tw/` — `node scripts/research_grb.mjs` (keeps projects where one of the 10 teachers is host and the 執行機關 is 國立高雄餐旅大學; no amounts)
- Elsevier / Stanford top-2% dataset `https://doi.org/10.17632/btchxktzyw` — `python scripts/research_top2.py` (楊仁德 was on the single-year lists released 2021–2023 only; write it in the past tense)

`python scripts/sync.py --verify` checks that every 國科會 project title quoted on the site is a GRB title in `data/research.json`.

Do not add names, numbers, hotels, courses, certificates, rooms, phone numbers or events that are not in `data/official.json` (or, for research, `data/research.json`).
Faculty title / extension / e-mail / specialties are read from `official-data.js` (generated) — never hard-code them in `people.js`.
`data/policies.json` and `policies.json` (served copy) must be identical.

### Cityscape exception (城市地景例外, approved 2026-11-14)

`kaohsiung-skyline.js` may show Kaohsiung landmarks (高雄展覽館、高雄流行音樂中心（海洋文化及流行音樂中心）、駁二藝術特區、85大樓、高雄港埠旅運中心、大港橋 …) around the archipelago as **shape-only homages**. Only the landmark **name** and its **3D form** (including night lighting colours and the swing bridge's rotation) are allowed: no years, heights, floor counts, areas, history, operators, events or any other fact. Five stand on walkable harbour islands bridged to the campus (the avatar can walk there; arriving shows a small panel with photo / wave / light-show / festival-lights / tram / bridge-swing / back-to-campus actions); 大港橋 spans the channel between Pier-2 and the cruise terminal as scenery only (not a walkway). Festival lights are only pink / purple / blue colours — never tied to a named event or date. Pins and the panel say only the name and 「高雄城市地景」 — they never open a department card and give no XP. The `SKYLINE-DATA` block may hold only `id`, `icon` and `name`; `python scripts/sync.py --verify` enforces this.

### Campus art exception（校園景觀藝術例外，approved 2026-11-15）

`campus-art.js` may model the outdoor sculptures on NKUHT's General Affairs campus art list (`https://ga.nkuht.edu.tw/p/403-1006-172-1.php?Lang=zh-tw`, codes A–X; the wall reliefs A / G / H / J / K are not modelled). Only each work's **code**, **title** (Chinese from the list, English from the NKUHT campus map 校區配置圖 supplied by the user) and its **3D form** (modelled from photos) are allowed: no artist, year, material, size, story or any self-written description. Cards, pins and nameplates show only the title, 「高餐校園景觀藝術・<code>」, the island it stands on and a link to the list; no XP. The `ART-DATA` block may hold only `id`, `code`, `name` and `en`, and each code / title pair must match the list (and `en` the campus map); `python scripts/sync.py --verify` enforces this. 朝陽鐘樓 is a campus building, not part of this list.

### Bell schedule exception（鐘聲時刻例外，approved 2026-11-15）

`bell-schedule.json` (served copy of `data/bell-schedule.json`; the two must be identical) holds the weekday class periods the clock tower rings by — supplied by the user from the timetable's period column, not from the two official sites. It may hold only `source`, `timeZone`, `days` and `periods` (`period`, `start`, `end` as HH:MM). No teacher, course, room or other timetable content. The tower rings on Asia/Taipei time; `python scripts/sync.py --verify` enforces this.

## Commands

| Command | Purpose |
|---|---|
| `python scripts/sync.py` | Download both official sites → `data/official.json` + `official-data.js`, then verify the site data |
| `python scripts/sync.py --check` | Compare only; exit 10 when the official data changed (used by `.githooks/pre-push`) |
| `python scripts/sync.py --verify` | Offline check of the site data against `data/official.json` and known past errors |
| `node scripts/research_grb.mjs [--check]` | Re-capture the faculty's GRB research projects → `data/research.json` (`--check`: exit 10 when changed) |
| `python scripts/research_top2.py [--check]` | Re-check the Elsevier/Stanford top-2% lists (≈1 GB download, read in memory) → `data/research.json` |
| `python scripts/share_pages.py --images` | Re-render per-item social preview images into `assets/share/` and generate `p/<id>/index.html` |
| `python scripts/share_pages.py` | Regenerate `p/<id>/index.html` share pages |
| `node --test tests/*.test.mjs` | Security regression tests for the plaza Worker (origin allowlist, id/key binding, relay whitelist, rate limits); also run by CI |
| `python scripts/check_csp.py [--fix]` | Check (or update) the CSP script hashes in `_headers` after editing an inline `<script>` in `index.html` / `404.html` |

## Security rules

See `SECURITY.md` and `docs/security/ISO27001-assessment.md`. In short: never commit secrets (they live in Cloudflare environment variables); render network or user data only with `esc()` / `textContent`; the plaza Worker relays only whitelisted packet types and fields, so a new packet type must be added there explicitly; any change to `vendor/` must update `vendor/SHA256SUMS` in the same commit (CI verifies it); keep `.well-known/security.txt` `Expires` within a year.

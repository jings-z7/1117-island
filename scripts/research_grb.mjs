// Re-capture the faculty's government research projects from GRB (政府研究資訊系統, https://www.grb.gov.tw/)
// into data/research.json → "projects".
//
//   node scripts/research_grb.mjs            # update data/research.json
//   node scripts/research_grb.mjs --check    # compare only; exit 10 when GRB changed
//
// How it decides what to keep (data rule: only facts GRB states):
//   * searches GRB by each of the 10 teachers in data/official.json (faculty.members[].name);
//   * keeps a project only when that teacher is listed as host (主持人 / 共同主持人) AND the project's
//     執行機關 is 國立高雄餐旅大學 — this drops other people with the same name at other institutions;
//   * keeps projects whose period ends in ROC year 110 or later (recent work only);
//   * role is 主持 when the teacher is the first host, otherwise 共同主持.
// GRB's page talks to its own API (grbdef.stpi.niar.org.tw); we load the GRB site in a real browser
// and call that API from the page exactly as the site does.
import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
// playwright is installed globally in CI / dev machines, not as a project dependency
const { chromium } = createRequire(import.meta.url)("playwright");

const ROOT = new URL("../", import.meta.url);
const OFFICIAL = new URL("data/official.json", ROOT);
const RESEARCH = new URL("data/research.json", ROOT);
const UNIT = "國立高雄餐旅大學";
const MIN_END_YEAR = 110;

const official = JSON.parse(readFileSync(OFFICIAL, "utf8"));
const teachers = official.faculty.members.map((m) => m.name);

const proxy = process.env.HTTPS_PROXY || process.env.https_proxy;
const browser = await chromium.launch({ proxy: proxy ? { server: proxy } : undefined });
const page = await browser.newPage();
await page.goto("https://www.grb.gov.tw/", { waitUntil: "networkidle", timeout: 120000 });

async function call(path, body, json) {
  for (let i = 0; i < 4; i++) {
    try {
      return await page.evaluate(async ({ path, body, json }) => {
        const r = await fetch("https://grbdef.stpi.niar.org.tw" + path, json
          ? { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" }
          : { method: "POST", body: new URLSearchParams(body) });
        if (!r.ok) throw new Error("HTTP " + r.status);
        return await r.json();
      }, { path, body, json });
    } catch (e) {
      if (i === 3) throw e;
      await page.waitForTimeout(3000);
    }
  }
}

const found = new Map();
for (const name of teachers) {
  const res = await call("/searcher", {
    keyword: name, queryType: "GRB05", projNums: "", planYearSt: "82", planYearEn: "200",
    excuOrganPrefix: "", planOrgans: "", nowPage: "1", rowsPerPage: "200", orderType: "SIMILARITY",
  });
  for (const o of res.obj || []) {
    if (!(o.hostNameList || []).includes(name)) continue;
    const det = await call("/searcher/" + o.id, null, true);
    const d = det.obj || det;
    const end = parseInt(String(d.periodEnym || "").slice(0, 3), 10) || d.planYear;
    if (!String(d.excuOrganName || "").startsWith(UNIT) || end < MIN_END_YEAR) continue;
    found.set(o.id + "|" + name, {
      grbId: Number(o.id),
      teacher: name,
      role: (o.host1NameC || [])[0] === name ? "主持" : "共同主持",
      year: d.planYear,
      title: String(d.title || "").trim(),
      agency: d.planOrganName,
      executingUnit: d.excuOrganName,
      planNo: d.planNo || null,
      period: [d.periodStym, d.periodEnym],
      type: d.researchType?.cname || null,
      url: "https://www.grb.gov.tw/search/planDetail?id=" + o.id,
    });
    await page.waitForTimeout(500);
  }
  await page.waitForTimeout(1000);
}
await browser.close();

const projects = [...found.values()].sort((a, b) => b.year - a.year || a.teacher.localeCompare(b.teacher, "zh-Hant") || a.grbId - b.grbId);
let research = {};
try { research = JSON.parse(readFileSync(RESEARCH, "utf8")); } catch {}
const before = JSON.stringify(research.projects || []);
const after = JSON.stringify(projects);
if (process.argv.includes("--check")) {
  console.log(before === after ? "GRB projects unchanged" : "GRB projects changed");
  process.exit(before === after ? 0 : 10);
}
research.grb = {
  source: "https://www.grb.gov.tw/",
  rule: `teacher listed as host, 執行機關 ${UNIT}, period ending ROC ${MIN_END_YEAR} or later`,
  capturedAt: new Date().toISOString().slice(0, 10),
};
research.projects = projects;
writeFileSync(RESEARCH, JSON.stringify(research, null, 1) + "\n");
for (const p of projects) console.log(p.year, p.teacher, p.role, p.agency, "|", p.title);
console.log(`${projects.length} projects → data/research.json`);

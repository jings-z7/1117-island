// 第四期 題庫產生器：每一題的題目、正確答案、干擾選項與解說都由 official-data.js（scripts/sync.py 由兩個官網產生）
// 即時組成，所以官網更新後題目自動跟著變；不加入官網以外的任何名稱或數字（干擾選項也只取自官網資料本身）。
// Each question: { id, cat, q, opts[4], ans, exp, src } — the same shape quest.js already renders.

const REGION_EN = { 北部: "North", 中部: "Central", 南部: "South", 東部: "East" };
const DROP_SUFFIX = /[-－](\d{6,7}).*$|\.pdf$/i;
export const cleanTitle = (t) => String(t || "").replace(DROP_SUFFIX, "").replace(DROP_SUFFIX, "").trim();

function rng(seed) {
  let a = seed >>> 0 || 1;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const shuffle = (arr, r) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
const uniq = (a) => [...new Set(a)];
// correct answer + three distinct distractors, shuffled; null when the data cannot supply three
function four(correct, pool, r) {
  const d = shuffle(uniq(pool.filter((x) => x !== correct)), r).slice(0, 3);
  if (d.length < 3) return null;
  const opts = shuffle([correct, ...d], r);
  return { opts, ans: opts.indexOf(correct) };
}

export function generateQuestions(O, { seed = Date.now(), english = false } = {}) {
  const r = rng(seed);
  const tr = (zh, en) => (english ? en : zh);
  const out = [];
  const push = (id, cat, q, f, exp, src) => f && out.push({ id, cat, q, opts: f.opts, ans: f.ans, exp, src });
  const fac = (O.faculty || []).filter((f) => f.name);
  const partners = (O.partners || []).filter((p) => p.name && p.region);

  // 1. 教師專長（餐旅學院師資頁）：干擾選項只取「其他老師」的專長，且不與這位老師任何專長重複
  for (const f of fac) {
    const own = new Set([...(f.specialties || []), ...(f.departmentSpecialties || [])]);
    if (!f.specialties?.length) continue;
    const correct = f.specialties[Math.floor(r() * f.specialties.length)];
    const others = fac.filter((g) => g !== f).flatMap((g) => g.specialties || []).filter((s) => !own.has(s));
    push(
      `spec:${f.name}:${correct}`,
      tr("師資專長", "Faculty expertise"),
      tr(`下列哪一項是「${f.name}」老師的專長？`, `Which of these is a specialty of ${f.name}?`),
      four(correct, others, r),
      tr(`依餐旅學院師資頁，${f.name}老師的專長為：${f.specialties.join("、")}。`, `Per the college faculty page, ${f.name}'s specialties: ${f.specialties.join(", ")}.`),
      f.profileUrl || O.sources?.faculty,
    );
  }
  // 2. 職稱只出「全系唯一」的職稱，避免兩位老師同一職稱造成兩個正確答案
  const titleCount = new Map();
  for (const f of fac) titleCount.set(f.title, (titleCount.get(f.title) || 0) + 1);
  for (const f of fac) {
    if (!f.title || titleCount.get(f.title) !== 1) continue;
    push(
      `title:${f.name}`,
      tr("師資陣容", "Faculty"),
      tr(`哪一位老師的職稱是「${f.title}」？`, `Who holds the title "${f.title}"?`),
      four(f.name, fac.map((g) => g.name), r),
      tr(`依餐旅學院師資頁，${f.name}老師現任${f.title}。`, `Per the college faculty page, ${f.name} is ${f.title}.`),
      f.profileUrl || O.sources?.faculty,
    );
  }
  // 3. 合作旅館地區（官網合作機構表的地區欄）
  const regions = uniq(partners.map((p) => p.region));
  const regionName = (g) => (english ? REGION_EN[g] || g : g);
  if (regions.length >= 4)
    for (const p of partners) {
      const opts = shuffle(regions, r).slice(0, 4);
      if (!opts.includes(p.region)) opts[0] = p.region;
      const o = shuffle(opts, r);
      push(
        `region:${p.name}`,
        tr("菁英實習 3.0", "Elite Internship 3.0"),
        tr(`「${p.name}」列在官網合作機構表的哪一個地區？`, `Which region is ${p.name} listed under in the official partner table?`),
        { opts: o.map(regionName), ans: o.indexOf(p.region) },
        tr(`官網「菁英實習合作機構」將${p.name}列於${p.region}。`, `The official partner table lists ${p.name} under ${regionName(p.region)}.`),
        O.partnersUrl,
      );
    }
  // 4. 「下列哪一家位於某地區」：正確答案與干擾選項都是官網合作旅館
  for (const g of regions) {
    const inG = partners.filter((p) => p.region === g),
      notG = partners.filter((p) => p.region !== g);
    if (!inG.length || notG.length < 3) continue;
    const pick = inG[Math.floor(r() * inG.length)].name;
    push(
      `inregion:${g}:${pick}`,
      tr("菁英實習 3.0", "Elite Internship 3.0"),
      tr(`下列哪一家合作旅館列於官網合作機構表的「${g}」？`, `Which partner hotel is listed under ${regionName(g)}?`),
      four(pick, notG.map((p) => p.name), r),
      tr(`${g}共有 ${inG.length} 家：${inG.map((p) => p.name).join("、")}。`, `${regionName(g)} lists ${inG.length}: ${inG.map((p) => p.name).join(", ")}.`),
      O.partnersUrl,
    );
  }
  // 5. 各地區家數與總家數（由名單計算）
  const counts = regions.map((g) => [g, partners.filter((p) => p.region === g).length]);
  for (const [g, n] of counts) {
    const pool = uniq([...counts.map(([, m]) => m), n + 1, n + 2, Math.max(1, n - 1), n + 3].filter((m) => m !== n && m > 0)).map(String);
    push(
      `count:${g}`,
      tr("菁英實習 3.0", "Elite Internship 3.0"),
      tr(`官網合作機構表中，「${g}」共列了幾家合作旅館？`, `How many partner hotels does the official table list under ${regionName(g)}?`),
      four(String(n), pool, r),
      tr(`依官網名單計算：北部 ${counts.find((c) => c[0] === "北部")?.[1] ?? "—"}、中部 ${counts.find((c) => c[0] === "中部")?.[1] ?? "—"}、南部 ${counts.find((c) => c[0] === "南部")?.[1] ?? "—"}、東部 ${counts.find((c) => c[0] === "東部")?.[1] ?? "—"} 家，共 ${partners.length} 家。`, `Counted from the official list: ${counts.map(([k, v]) => `${regionName(k)} ${v}`).join(", ")}; ${partners.length} in all.`),
      O.partnersUrl,
    );
  }
  // 6. 同一合作機構分組（官網分組未命名，只問「是否同組」）
  const groups = (O.brandGroups || []).filter((g) => g.length >= 2);
  for (const g of groups) {
    const a = g[Math.floor(r() * g.length)];
    const mates = g.filter((x) => x !== a);
    const outside = groups.filter((h) => h !== g).flat();
    if (outside.length < 3) continue;
    const correct = mates[Math.floor(r() * mates.length)];
    push(
      `group:${a}:${correct}`,
      tr("菁英實習 3.0", "Elite Internship 3.0"),
      tr(`官網合作機構分組中，下列哪一家與「${a}」在同一組？`, `In the official partner grouping, which hotel is in the same group as ${a}?`),
      four(correct, outside, r),
      tr(`同組：${g.join("、")}（依官網合作機構分組頁）。`, `Same group: ${g.join(", ")} (official partner grouping page).`),
      O.partnersUrl,
    );
  }
  // 7. 課程標準表（日間部四年制最新一列）：學分數，干擾選項取自同一張表其他欄位與年度的數字
  const day = (O.curriculum || []).find((t) => /日間部四年制/.test(t.program)) || (O.curriculum || [])[0];
  const last = day?.rows?.[day.rows.length - 1];
  if (last) {
    const nums = uniq(day.rows.flatMap((row) => ["畢業學分數", "校訂必修", "院訂必修", "系訂必修", "系訂選修"].map((k) => row[k])).filter((v) => /^\d+$/.test(String(v)) && v !== "0"));
    for (const [k, en] of [
      ["畢業學分數", "graduation credits"],
      ["系訂必修", "department required credits"],
      ["系訂選修", "department elective credits"],
    ]) {
      if (!/^\d+$/.test(String(last[k]))) continue;
      push(
        `credits:${last.label}:${k}`,
        tr("課程標準表", "Curriculum"),
        tr(`依官網課程標準表，${day.program}「${last.label}」的${k}是幾學分？`, `Per the official curriculum table (${day.program}, ${last.label}), how many ${en}?`),
        four(String(last[k]), nums.map(String), r),
        tr(`${last.label}：畢業 ${last["畢業學分數"]} 學分，校訂必修 ${last["校訂必修"]}、院訂必修 ${last["院訂必修"]}、系訂必修 ${last["系訂必修"]}、系訂選修 ${last["系訂選修"]}。`, `${last.label}: ${last["畢業學分數"]} credits to graduate; university ${last["校訂必修"]}, college ${last["院訂必修"]}, department required ${last["系訂必修"]}, electives ${last["系訂選修"]}.`),
        last.pdf || day.url,
      );
    }
  }
  // 8. 規章出處：「本系規章」或「群賢會館」頁（干擾選項是系網選單上的頁名）
  const PAGES = [tr("本系規章", "Regulations"), tr("群賢會館", "Elite House"), tr("課程標準表", "Curriculum"), tr("畢業條件標準表", "Graduation criteria"), tr("課程地圖", "Curriculum map")];
  const regs = [...(O.regulations?.documents || []).map((d) => [d, PAGES[0], O.regulations.url]), ...(O.eliteHouse?.regulations || []).map((d) => [d, PAGES[1], O.eliteHouse.regulationsUrl])];
  const seenReg = new Set();
  for (const [d, page, url] of regs) {
    const t = cleanTitle(d.title);
    if (!t || seenReg.has(t)) continue;
    seenReg.add(t);
    push(
      `reg:${t}`,
      tr("系務規章", "Regulations"),
      tr(`「${t}」公告在旅館系官網的哪一頁？`, `On which page of the department site is "${t}" published?`),
      four(page, PAGES, r),
      tr(`這份文件列在系網「${page}」頁。`, `It is listed on the department site's "${page}" page.`),
      d.url || url,
    );
  }
  return out;
}

// a round: mixes kinds so one round is not eight region questions
export function drawRound(O, n = 8, { seed = Date.now(), english = false, exclude = new Set() } = {}) {
  const all = generateQuestions(O, { seed, english });
  const r = rng(seed ^ 0x5bd1e995);
  const byKind = new Map();
  for (const q of shuffle(all, r)) {
    if (exclude.has(q.id)) continue;
    const k = q.id.split(":")[0];
    if (!byKind.has(k)) byKind.set(k, []);
    byKind.get(k).push(q);
  }
  const picked = [];
  while (picked.length < n && [...byKind.values()].some((v) => v.length)) for (const v of byKind.values()) if (v.length && picked.length < n) picked.push(v.shift());
  return shuffle(picked, r);
}

// one region question for a given partner hotel (used by the internship passport stamp)
export function regionQuestion(O, hotelName, { seed = Date.now(), english = false } = {}) {
  return generateQuestions(O, { seed, english }).find((q) => q.id === `region:${hotelName}`) || null;
}

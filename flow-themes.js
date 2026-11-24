// 學習路線（協作線改版，2026-11-15，分類經使用者確認）：把 36 條協作線分成 5 條主題路線。
// 這只是畫面上的分組與顏色，不新增任何事實；每條線的說明仍是 data/policies.json 的原文。
//   hub  — F1 一條連到 16 座島：只在選到系務核心島時以淡色放射線出現
//   weak — 兩島關係較弱的條目：細虛線，只在點選相關島嶼時出現
export const FLOW_THEMES = [
  { id: "admin", zh: "行政與系務", en: "Administration", color: 0x3d5866, css: "#3d5866", ids: ["F1", "F2", "F3", "F4", "F9", "F11", "F12", "F13", "F21", "F31"] },
  { id: "course", zh: "課程與 1+3", en: "Courses & 1+3", color: 0xc8a052, css: "#b08a3e", ids: ["F10", "F14", "F17", "F18", "F22", "F23", "F27", "F28"] },
  { id: "intern", zh: "實習與產業", en: "Internships & industry", color: 0x2f5f52, css: "#2f5f52", ids: ["F7", "F8", "F32", "F33", "F34", "F36"] },
  { id: "global", zh: "外語與國際", en: "Languages & global", color: 0x7b3440, css: "#7b3440", ids: ["F5", "F6", "F15", "F16", "F19", "F20", "F29"] },
  { id: "digital", zh: "數位與創新", en: "Digital & innovation", color: 0x2f6f86, css: "#2f6f86", ids: ["F24", "F25", "F26", "F30", "F35"] },
];
export const HUB_FLOWS = new Set(["F1"]);
export const WEAK_FLOWS = new Set(["F19", "F23", "F28", "F29"]);
const BY_FLOW = new Map(FLOW_THEMES.flatMap((t) => t.ids.map((id) => [id, t])));
export const themeOf = (flowId) => BY_FLOW.get(flowId) || null;
// first clause of the official text as a short title (no new words are added)
export function flowTitle(text) {
  const s = String(text || "");
  const cut = s.search(/[，；：。]/);
  return cut > 4 && cut < 26 ? s.slice(0, cut) : s.length > 26 ? s.slice(0, 24) + "…" : s;
}

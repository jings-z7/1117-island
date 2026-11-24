// photo-share.js — 合照分享（IG / FB）：拍下目前的 3D 畫面，套上「國立高雄餐旅大學・旅館管理系」相框，
// 選版型（IG 貼文 1:1、4:5、限時動態 9:16）與相框色，附預設文案與主題標籤，再用系統分享、下載或複製文案分享出去。
//
// 資料規則：相框與文案只用學校／系所名稱、島嶼名稱（policies.json，官方資料）與本站網址；不寫任何其他數字或事實。
// 分享限制（瀏覽器端無法直接發文到 IG / FB）：
//   - 手機（支援 Web Share 檔案分享）：「分享…」開啟系統分享表，可直接選 Instagram、Facebook；文案先複製到剪貼簿再貼上。
//   - 電腦：Instagram 沒有網頁發文入口 → 下載圖片＋複製文案；Facebook 分享視窗只能帶網址 → 同時下載圖片、複製文案。
const EN = new URLSearchParams(location.search).get("lang") === "en";
const tr = (zh, en) => (EN ? en : zh);
const SITE = "https://nkuht-htl.drmjhsu.com/";
const SITE_SHORT = "nkuht-htl.drmjhsu.com";
const HASHTAGS = ["#高餐大", "#國立高雄餐旅大學", "#旅館管理系", "#NKUHT", "#HotelManagement", "#高雄", "#島嶼導覽器"];
const FORMATS = [
  { id: "square", w: 1080, h: 1080, zh: "IG 貼文 1:1", en: "Post 1:1" },
  { id: "portrait", w: 1080, h: 1350, zh: "IG 直式 4:5", en: "Portrait 4:5" },
  { id: "story", w: 1080, h: 1920, zh: "限時動態 9:16", en: "Story 9:16" },
];
const STYLES = [
  { id: "green", zh: "墨綠典藏", en: "Emerald", bg: "#123a33", bg2: "#0c2a25", ink: "#fbf6ea", sub: "#d9c48f", line: "#c8a052" },
  { id: "ivory", zh: "象牙白", en: "Ivory", bg: "#f7f2e6", bg2: "#ece4d2", ink: "#1d3a33", sub: "#8a6a2c", line: "#c8a052" },
];
const CAPTIONS = [
  { zh: "在「高餐大旅館管理系 學習與職涯島嶼導覽器」逛到了{place} 🏨✨", en: "Exploring {place} on the NKUHT Hotel Management island navigator 🏨✨" },
  { zh: "跟著島嶼地圖認識旅館管理系的課程、實習與師資，今天停在{place}。", en: "Learning about the Department of Hotel Management island by island — today: {place}." },
  { zh: "旅伴們一起來！我在{place}等你 👋", en: "Come along! I'm waiting for you at {place} 👋" },
  { zh: "📸 {place}合照打卡｜國立高雄餐旅大學・旅館管理系", en: "📸 Photo stop: {place} | NKUHT · Dept. of Hotel Management" },
];

const logo = new Image();
logo.src = "./assets/nkuht_htl_logo.png";

const S = { fmt: "square", style: "green", cap: 0, place: "", shot: null, blob: null, dirty: true };
let root = null,
  els = {};

// ---------- where are we? (avatar while walking, otherwise the camera's target) ----------
function currentPlace() {
  const hc = window.heartCity,
    av = window.heartIslandAvatar;
  const p = av?.S?.drive && av?.S?.fig ? av.S.fig.group.position : hc?.controls?.target;
  const fallback = tr("高餐大旅館管理系學習群島", "NKUHT Hotel Management islands");
  if (!p || !hc?.navData) return fallback;
  const names = new Map((hc.policies?.islands || []).map((i) => [i.id, EN ? i.name?.en || i.name?.zh : i.name?.zh]));
  let best = null,
    bestD = Infinity;
  for (const [id, c] of Object.entries(hc.navData.islandCenters || {})) {
    const d = Math.hypot(p.x - c.x, p.z - c.z);
    const name = names.get(id) || c.name;
    if (!name || id.startsWith("islet-")) continue;
    if (d < (c.r || 2) * 1.05 && d < bestD) [best, bestD] = [name, d];
  }
  return best || fallback;
}

// ---------- capture the 3D view (no head marker / ground ring) ----------
function grab() {
  const hc = window.heartCity;
  if (!hc?.capture) return null;
  const fig = window.heartIslandAvatar?.S?.fig;
  const hide = [fig?.pin, fig?.ring].filter(Boolean).map((o) => [o, o.visible]);
  for (const [o] of hide) o.visible = false;
  let snap = null;
  try {
    const cv = hc.capture();
    snap = document.createElement("canvas");
    snap.width = cv.width;
    snap.height = cv.height;
    snap.getContext("2d").drawImage(cv, 0, 0);
  } catch (e) {
    console.warn("photo-share", e);
    snap = null;
  }
  for (const [o, v] of hide) o.visible = v;
  return snap;
}

// ---------- compose the framed picture ----------
function rr(g, x, y, w, h, r) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}
const SERIF = '"Noto Serif TC", "Songti TC", "PMingLiU", serif';
const SANS = '"Noto Sans TC", "PingFang TC", "Microsoft JhengHei", system-ui, sans-serif';
function fitText(g, text, max, size, font, weight = "") {
  let s = size;
  do g.font = `${weight} ${s}px ${font}`.trim();
  while (g.measureText(text).width > max && (s -= 2) > 12);
  return s;
}
function compose() {
  const F = FORMATS.find((f) => f.id === S.fmt),
    st = STYLES.find((s) => s.id === S.style);
  const W = F.w,
    H = F.h;
  const cv = document.createElement("canvas");
  cv.width = W;
  cv.height = H;
  const g = cv.getContext("2d");
  const grad = g.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, st.bg);
  grad.addColorStop(1, st.bg2);
  g.fillStyle = grad;
  g.fillRect(0, 0, W, H);
  const story = F.id === "story";
  const m = 44,
    top = story ? 200 : m,
    foot = story ? 420 : F.id === "portrait" ? 270 : 236;
  const px = m,
    py = top,
    pw = W - 2 * m,
    ph = H - top - foot;
  if (story) {
    g.fillStyle = st.sub;
    g.textAlign = "center";
    g.font = `600 30px ${SANS}`;
    g.fillText("★ ★ ★ ★ ★", W / 2, 92);
    g.fillStyle = st.ink;
    fitText(g, tr("學習與職涯島嶼導覽器", "Learning & Career Island Navigator"), W - 160, 46, SERIF, "700");
    g.fillText(tr("學習與職涯島嶼導覽器", "Learning & Career Island Navigator"), W / 2, 152);
  }
  // photo, cover-fit and rounded
  g.save();
  rr(g, px, py, pw, ph, 30);
  g.clip();
  g.fillStyle = "#cfd8d6";
  g.fillRect(px, py, pw, ph);
  if (S.shot) {
    const sw = S.shot.width,
      sh = S.shot.height,
      k = Math.max(pw / sw, ph / sh);
    g.drawImage(S.shot, px + (pw - sw * k) / 2, py + (ph - sh * k) / 2, sw * k, sh * k);
  }
  // soft vignette at the bottom so the place chip reads on any scene
  const vg = g.createLinearGradient(0, py, 0, py + ph);
  vg.addColorStop(0, "rgba(0,0,0,0.22)");
  vg.addColorStop(0.22, "rgba(0,0,0,0)");
  vg.addColorStop(0.8, "rgba(0,0,0,0)");
  vg.addColorStop(1, "rgba(0,0,0,0.28)");
  g.fillStyle = vg;
  g.fillRect(px, py, pw, ph);
  g.restore();
  g.strokeStyle = st.line;
  g.lineWidth = 3;
  rr(g, px + 12, py + 12, pw - 24, ph - 24, 22);
  g.stroke();
  // place chip (top-left of the photo)
  const chip = "📍 " + (S.place || currentPlace());
  g.textAlign = "left";
  const cs = fitText(g, chip, pw - 120, 34, SANS, "700");
  const cw = g.measureText(chip).width + 44,
    ch = cs + 26;
  g.fillStyle = "rgba(15,40,35,0.78)";
  rr(g, px + 30, py + 30, cw, ch, ch / 2);
  g.fill();
  g.strokeStyle = "rgba(200,160,82,0.9)";
  g.lineWidth = 2;
  g.stroke();
  g.fillStyle = "#fbf6ea";
  g.textBaseline = "middle";
  g.fillText(chip, px + 52, py + 30 + ch / 2 + 1);
  // footer: crest + school / department, site + date on the right
  const fy = py + ph + (story ? 60 : 34);
  const L = story ? 150 : 132;
  g.textBaseline = "alphabetic";
  if (logo.complete && logo.naturalWidth) {
    g.save();
    g.beginPath();
    g.arc(m + L / 2, fy + L / 2, L / 2 + 6, 0, Math.PI * 2);
    g.fillStyle = st.id === "green" ? "#fbf6ea" : "#ffffff";
    g.fill();
    g.restore();
    g.drawImage(logo, m, fy, L, L);
  }
  const tx = m + L + 30,
    right = W - m,
    rightW = story ? 0 : 300;
  g.textAlign = "left";
  g.fillStyle = st.sub;
  fitText(g, tr("國立高雄餐旅大學", "NKUHT"), right - tx - rightW, story ? 38 : 32, SANS, "600");
  g.fillText(tr("國立高雄餐旅大學", "NKUHT"), tx, fy + (story ? 44 : 38));
  g.fillStyle = st.ink;
  fitText(g, tr("旅館管理系", "Dept. of Hotel Management"), right - tx - rightW, story ? 72 : 60, SERIF, "800");
  g.fillText(tr("旅館管理系", "Dept. of Hotel Management"), tx, fy + (story ? 120 : 102));
  g.fillStyle = st.sub;
  fitText(g, "NKUHT · Dept. of Hotel Management", right - tx - rightW, story ? 26 : 22, SANS, "500");
  if (!EN) g.fillText("NKUHT · Dept. of Hotel Management", tx, fy + (story ? 162 : 136));
  const d = new Date();
  const date = `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
  if (story) {
    g.textAlign = "center";
    g.fillStyle = st.line;
    g.fillRect(W / 2 - 160, fy + L + 46, 320, 2);
    g.fillStyle = st.ink;
    g.font = `600 30px ${SANS}`;
    g.fillText(SITE_SHORT, W / 2, fy + L + 100);
    g.fillStyle = st.sub;
    g.font = `500 26px ${SANS}`;
    g.fillText(`${HASHTAGS.slice(0, 3).join("  ")}  ·  ${date}`, W / 2, fy + L + 146);
  } else {
    g.textAlign = "right";
    g.fillStyle = st.sub;
    g.font = `600 22px ${SANS}`;
    g.fillText("HTL ISLAND NAVIGATOR", right, fy + 38);
    g.fillStyle = st.ink;
    g.font = `500 22px ${SANS}`;
    g.fillText(SITE_SHORT, right, fy + 76);
    g.fillStyle = st.sub;
    g.fillText(date, right, fy + 110);
  }
  return cv;
}

// ---------- caption ----------
function captionText() {
  const c = CAPTIONS[S.cap] || CAPTIONS[0];
  const place = S.place || currentPlace();
  return `${(EN ? c.en : c.zh).replaceAll("{place}", place)}\n\n${tr("一起來逛：", "Explore: ")}${SITE}\n${HASHTAGS.join(" ")}`;
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {}
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.style.cssText = "position:fixed;top:0;left:0;opacity:0";
  document.body.append(ta);
  ta.select();
  let ok = false;
  try {
    ok = document.execCommand("copy");
  } catch {}
  ta.remove();
  return ok;
}

// ---------- dialog ----------
const toast = (msg) => {
  if (!els.msg) return;
  els.msg.textContent = msg;
  els.msg.hidden = false;
  clearTimeout(toast.t);
  toast.t = setTimeout(() => (els.msg.hidden = true), 6500);
};
function el(tag, attrs = {}, ...kids) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "on") for (const [ev, fn] of Object.entries(v)) e.addEventListener(ev, fn);
    else if (v !== false && v != null) e.setAttribute(k, v === true ? "" : v);
  }
  for (const k of kids) e.append(k);
  return e;
}
function chips(list, key, label) {
  const row = el("div", { class: "ps-chips", role: "radiogroup", "aria-label": label });
  for (const it of list) {
    const b = el("button", { type: "button", class: "ps-chip", role: "radio", "data-v": it.id ?? "" }, EN ? it.en : it.zh);
    b.addEventListener("click", () => {
      S[key] = it.id;
      sync();
    });
    row.append(b);
  }
  return row;
}
function build() {
  root = el("div", { id: "photo-share", class: "ps-overlay", hidden: true, role: "dialog", "aria-modal": "true", "aria-labelledby": "ps-title" });
  const close = el("button", { type: "button", class: "ps-close", "aria-label": tr("關閉", "Close"), on: { click: () => api.close() } }, "×");
  els.preview = el("canvas", { class: "ps-preview", "aria-label": tr("合照預覽", "Photo preview") });
  els.place = el("input", { class: "ps-place", type: "text", maxlength: "40", "aria-label": tr("地點名稱", "Place name") });
  els.place.addEventListener("input", () => {
    S.place = els.place.value.trim();
    redraw();
    els.caption.value = captionText();
  });
  els.caption = el("textarea", { class: "ps-caption", rows: "5", "aria-label": tr("貼文文案", "Caption") });
  els.capRow = el("div", { class: "ps-chips", role: "radiogroup", "aria-label": tr("預設文案", "Preset captions") });
  CAPTIONS.forEach((c, i) => {
    const b = el("button", { type: "button", class: "ps-chip", role: "radio", "data-v": String(i) }, tr(`文案 ${i + 1}`, `Caption ${i + 1}`));
    b.addEventListener("click", () => {
      S.cap = i;
      sync();
    });
    els.capRow.append(b);
  });
  els.msg = el("p", { class: "ps-msg", role: "status", hidden: true });
  const canFiles = (() => {
    try {
      return !!navigator.canShare?.({ files: [new File([new Blob(["x"])], "x.png", { type: "image/png" })] });
    } catch {
      return false;
    }
  })();
  const btn = (label, fn, cls = "") => el("button", { type: "button", class: "ps-btn " + cls, on: { click: fn } }, label);
  const actions = el(
    "div",
    { class: "ps-actions" },
    ...(canFiles ? [btn(tr("📤 分享到 IG / FB…", "📤 Share to IG / FB…"), () => api.share(), "is-primary")] : []),
    btn(tr("📷 Instagram", "📷 Instagram"), () => api.instagram(), canFiles ? "" : "is-primary"),
    btn(tr("📘 Facebook", "📘 Facebook"), () => api.facebook()),
    btn(tr("⬇️ 下載圖片", "⬇️ Download"), () => api.download()),
    btn(tr("📋 複製文案", "📋 Copy caption"), async () => toast((await copyText(els.caption.value)) ? tr("文案已複製。", "Caption copied.") : tr("無法自動複製，請手動選取文案。", "Could not copy — select the caption manually."))),
    btn(tr("🔄 重拍", "🔄 Retake"), () => api.retake()),
  );
  const side = el(
    "div",
    { class: "ps-side" },
    el("label", { class: "ps-label" }, tr("版型", "Format")),
    chips(FORMATS, "fmt", tr("版型", "Format")),
    el("label", { class: "ps-label" }, tr("相框", "Frame")),
    chips(STYLES, "style", tr("相框", "Frame")),
    el("label", { class: "ps-label" }, tr("地點", "Place")),
    els.place,
    el("label", { class: "ps-label" }, tr("預設文案（可修改）", "Caption (editable)")),
    els.capRow,
    els.caption,
    actions,
    els.msg,
    el("p", { class: "ps-note" }, tr("提示：先關閉視窗調整好角度再按「重拍」。電腦版 Instagram 不能從網頁直接發文，會改為下載圖片並複製文案。", "Tip: close this window to reframe, then press Retake. Instagram has no web posting, so on a computer the picture is downloaded and the caption copied.")),
  );
  const box = el("div", { class: "ps-box" }, el("div", { class: "ps-head" }, el("h2", { id: "ps-title" }, tr("📸 合照分享", "📸 Share a photo")), close), el("div", { class: "ps-body" }, el("div", { class: "ps-stage" }, els.preview), side));
  root.append(box);
  root.addEventListener("click", (e) => e.target === root && api.close());
  root.addEventListener("keydown", (e) => e.key === "Escape" && api.close());
  document.body.append(root);
}
function sync() {
  for (const b of root.querySelectorAll(".ps-chips")) {
    for (const c of b.children) {
      const v = c.dataset.v;
      const on = v === S.fmt || v === S.style || (b === els.capRow && v === String(S.cap));
      c.setAttribute("aria-checked", String(on));
    }
  }
  els.caption.value = captionText();
  redraw();
}
let out = null;
function redraw() {
  out = compose();
  S.blob = null;
  const pv = els.preview;
  pv.width = out.width / 2;
  pv.height = out.height / 2;
  pv.getContext("2d").drawImage(out, 0, 0, pv.width, pv.height);
  pv.style.aspectRatio = `${out.width} / ${out.height}`;
}
const getBlob = () =>
  S.blob
    ? Promise.resolve(S.blob)
    : new Promise((res) => out.toBlob((b) => res((S.blob = b)), "image/jpeg", 0.92));
const fileName = () => `htl-island-${S.fmt}-${Date.now()}.jpg`;
function rewardOnce() {
  window.__htlPassport?.grantXp?.("share:photo", 10, tr("第一次合照分享", "First photo share"));
}
function flash() {
  const f = el("div", { class: "ps-flash", "aria-hidden": "true" });
  document.body.append(f);
  setTimeout(() => f.remove(), 450);
  window.__htlPassport?.sfx?.stamp?.();
}

const api = {
  open(opts = {}) {
    if (!root) build();
    S.place = opts.place || "";
    S.shot = grab();
    if (!S.shot) {
      window.heartIslandAvatar?.showSay?.("📸", tr("畫面還在載入，請稍後再試。", "The scene is still loading — try again shortly."), 3000);
      return;
    }
    flash();
    els.place.value = S.place || currentPlace();
    S.place = els.place.value;
    root.hidden = false;
    document.body.classList.add("ps-open");
    sync();
    if (!logo.complete) logo.onload = () => redraw();
    root.querySelector(".ps-close").focus();
  },
  close() {
    if (!root) return;
    root.hidden = true;
    document.body.classList.remove("ps-open");
    window.heartIslandAvatar?.api?.endPhotoPose?.();
  },
  retake() {
    // hide the dialog for one frame so nothing of the page sits over the view, then capture again
    root.hidden = true;
    requestAnimationFrame(() => {
      S.shot = grab() || S.shot;
      flash();
      root.hidden = false;
      redraw();
    });
  },
  async download() {
    const b = await getBlob();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(b);
    a.download = fileName();
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    rewardOnce();
    return true;
  },
  async share() {
    const text = els.caption.value;
    const copied = await copyText(text);
    const file = new File([await getBlob()], fileName(), { type: "image/jpeg" });
    try {
      await navigator.share({ files: [file], text, title: tr("高餐大旅館管理系 島嶼合照", "NKUHT Hotel Management island photo") });
      rewardOnce();
      toast(copied ? tr("文案已複製：在 IG / FB 貼上即可。", "Caption copied — paste it in Instagram / Facebook.") : tr("已開啟分享。", "Shared."));
    } catch (e) {
      if (e?.name !== "AbortError") toast(tr("這個裝置無法分享圖片，已改為下載。", "This device cannot share pictures — downloading instead.")), api.download();
    }
  },
  async instagram() {
    if (navigator.canShare?.({ files: [new File([await getBlob()], "x.jpg", { type: "image/jpeg" })] })) return api.share();
    await api.download();
    const ok = await copyText(els.caption.value);
    toast(tr(`圖片已下載${ok ? "、文案已複製" : ""}。Instagram 不支援從網頁直接發文：請在 Instagram（手機 App 或網頁版「建立」）選擇這張圖片，再貼上文案。`, `Picture downloaded${ok ? " and caption copied" : ""}. Instagram has no web posting: create a post in Instagram, pick this picture and paste the caption.`));
  },
  async facebook() {
    if (navigator.canShare?.({ files: [new File([await getBlob()], "x.jpg", { type: "image/jpeg" })] })) return api.share();
    await api.download();
    const ok = await copyText(els.caption.value);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(SITE)}`, "_blank", "noopener,width=640,height=560");
    toast(tr(`已開啟 Facebook 分享視窗（附網站連結）；合照圖片已下載${ok ? "、文案已複製" : ""}，可在貼文中加入相片並貼上文案。`, `Facebook opened with the site link; the photo is downloaded${ok ? " and the caption copied" : ""} — add the photo to your post and paste the caption.`));
  },
};
window.htlPhotoShare = api;

// command-bar button (toolbar.js gives it the camera icon and a place in the bar / phone "more" menu)
function addButton() {
  const bar = document.querySelector("nav.toolbar");
  if (!bar || document.getElementById("photo-share-btn")) return;
  const b = el("button", { id: "photo-share-btn", type: "button", title: tr("拍下目前畫面，套上旅館管理系相框分享到 IG / FB", "Take a framed photo of this view and share it to Instagram / Facebook") }, tr("📸 合照", "📸 Photo"));
  b.addEventListener("click", () => api.open());
  const anchor = document.getElementById("hm-open") || document.getElementById("lang-btn");
  if (anchor?.parentNode === bar) anchor.after(b);
  else bar.append(b);
}
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", addButton);
else addButton();

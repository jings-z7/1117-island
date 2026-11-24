// toolbar.js — one owner for the command bar's look and layout (2026-11-13).
//
// Six modules (app, heart-me, quest, hex-radar, island-social, concierge-pro) each insert their own buttons into
// nav.toolbar and .mob-top-actions, with a mix of emoji (👨‍🏫 🏛️ 🛂 🗺️ 🕹️ 👥 🔍 📊), Unicode symbols (☺ ☰ ◫ ◷ ⓘ ?) and a
// few SVGs. Emoji and symbols are drawn by each OS's own font, so widths, heights and baselines differed between
// Windows, Android and iOS and the bar never lined up. And the desktop bar wrapped into two or three ragged rows.
//
// This module, loaded last, does two things without touching the other modules:
// 1. Icons: every known button gets the same 24-unit stroke SVG (drawn in the style of Lucide, ISC licence).
//    Its data-zh / data-en copies are rewritten too, and a MutationObserver re-applies the icon when a module
//    rewrites a button (the passport counter does on every stamp).
// 2. Desktop layout (> 800 px): the bar stays on one row. When it is too narrow, the least important buttons first
//    lose their word (icon only), then fold into a 「更多 / More」 menu whose rows click the original button. The original buttons are never
//    moved, so the anchors other modules insert next to (#sidebar-toggle, #tb-2d-link) stay where they are.
//    The phone dock (≤ 800 px) keeps its own layout from ui.css.

const EN = new URLSearchParams(location.search).get("lang") === "en";
const tr = (zh, en) => (EN ? en : zh);

import { P, uiSvg } from "./ui-icons.js?v=20261115-01";

// command-bar icons now come from the shared set in ui-icons.js (same paths as before)
export const svg = (name) => uiSvg(name, "tbx");

// id → icon, menu label, and how important it is to keep on the bar (higher stays longer; Infinity never folds).
const ITEMS = {
  home: { icon: "overview", keep: Infinity, label: ["回到全景", "Overview"] },
  "faculty-btn": { icon: "faculty", keep: 90, pin: true, label: ["師資導覽", "Faculty tour"] },
  "landmarks-btn": { icon: "landmark", keep: 85, pin: true, label: ["地標藝術", "Art & sights"] },
  "passport-btn": { icon: "passport", keep: 80, label: ["學習護照", "Passport"] },
  "hm-drive": { icon: "walk", keep: 78, label: ["角色漫遊", "Walk the island"] },
  "hm-open": { icon: "avatar", keep: 60, pin: true, label: ["角色換裝", "Avatar"] },
  "photo-share-btn": { icon: "camera", keep: 55, label: ["合照分享", "Share photo"] },
  "sidebar-toggle": { icon: "list", keep: Infinity, label: ["清單", "Index"] },
  "cmd-btn": { icon: "search", keep: 70, label: ["快速搜尋（Ctrl K）", "Search (Ctrl K)"] },
  "tb-2d-link": { icon: "view2d", keep: Infinity, pin: true, label: ["2D 時間軸總覽", "2D timeline"] },
  "lang-btn": { icon: "globe", keep: Infinity, label: ["English", "中文"] },
  "radar-btn": { icon: "radar", keep: 50, pin: true, label: ["六角群島雷達（M）", "Hex radar (M)"] },
  "htl-plaza-open": { icon: "people", keep: 40, label: ["旅伴廣場", "Multiplayer plaza"] },
  "credits-btn": { icon: "info", keep: 20, pin: true, label: ["資料來源與引用", "Sources & credits"] },
  help: { icon: "help", keep: 30, pin: true, label: ["操作說明", "Help"] },
  "mob-time": { icon: "layers", keep: Infinity, label: ["圖層與時段", "Layers & time"] },
  // phone quick actions (top right)
  "mob-cmd-btn": { icon: "search" },
  "mob-plaza-btn": { icon: "people" },
  "mob-lang-btn": { label: ["English", "中文"], menuIcon: "globe" },
  "mob-log-btn": { icon: "chart", label: ["城市日誌", "City log"] },
  "mob-credits": { icon: "info", label: ["資料來源與引用", "Sources & credits"] },
  "mob-help": { icon: "help", label: ["操作說明", "Help"] },
};
// 手機「更多」選單的項目（依序）。原按鈕以 CSS 隱藏，選單列點擊時代理觸發原按鈕。
const MOBILE_MORE = ["mob-lang-btn", "mob-log-btn", "radar-btn", "landmarks-btn", "tb-2d-link", "mob-credits", "mob-help"];

// Visual groups on desktop (CSS order; the DOM is never reordered): 1 navigate, 2 explore & play, 3 system.
const GROUP = {
  home: 1, "faculty-btn": 1, "landmarks-btn": 1, "sidebar-toggle": 1, "tb-2d-link": 1,
  "cmd-btn": 2, "radar-btn": 2, "hm-drive": 2, "hm-open": 2, "photo-share-btn": 2, "passport-btn": 2, "htl-plaza-open": 2,
  "lang-btn": 3, "credits-btn": 3, help: 3, "mob-time": 3,
};

// Leading emoji / pictographs / symbols that used to stand in for an icon (🌐 EN / 中文, ⓘ 引用, ?, 📊 …).
const LEADING_SYMBOL = /^[\s -⯿Ⓐ-⓿①-⓿㊐-㋿️‍?]*(?:[\u{1F000}-\u{1FAFF}][️‍\u{1F3FB}-\u{1F3FF}]*)*[\s️]*/u;

// Rewrite one button's markup (as a detached fragment) so it reads <i.tb-ic><svg.tbx/></i><span.tb-lbl>label</span>.
// Idempotent: a fragment that already has svg.tbx in its .tb-ic is left alone.
function iconize(root, icon) {
  const ic = root.querySelector(".tb-ic");
  if (ic) {
    if (ic.firstElementChild?.classList?.contains("tbx") && ic.childNodes.length === 1) return false;
    ic.innerHTML = svg(icon);
    return true;
  }
  if (root.querySelector("svg.tbx")) return false;
  // plain text button: strip the old symbol, keep any words as the label
  const text = (root.textContent || "").replace(LEADING_SYMBOL, "").trim();
  root.innerHTML = `<i class="tb-ic" aria-hidden="true">${svg(icon)}</i>${text ? `<span class="tb-lbl">${text.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c])}</span>` : ""}`;
  return true;
}
const scratch = document.createElement("div");
function iconizeHTML(html, icon) {
  scratch.innerHTML = html;
  return iconize(scratch, icon) ? scratch.innerHTML : html;
}
function normalizeButton(btn) {
  const item = ITEMS[btn.id];
  if (!item?.icon) return;
  for (const key of ["zh", "en"]) {
    const v = btn.dataset[key];
    if (v != null && !v.includes('class="tbx"')) btn.dataset[key] = iconizeHTML(v, item.icon);
  }
  iconize(btn, item.icon);
  btn.classList.add("tbx-btn");
  if (GROUP[btn.id] && btn.closest("nav.toolbar")) btn.classList.add(`tbx-g${GROUP[btn.id]}`);
  // an icon-only button still needs a name for screen readers
  if (!btn.querySelector(".tb-lbl") && !btn.getAttribute("aria-label")) btn.setAttribute("aria-label", btn.title || tr(item.label?.[0] || "", item.label?.[1] || ""));
}

// ---------- desktop overflow menu ----------
const desktop = matchMedia("(min-width: 801px)");
let bar = null,
  moreWrap = null,
  moreBtn = null,
  mobMoreBtn = null,
  menu = null,
  menuOwner = null, // 目前開啟選單的按鈕（桌機「更多」或手機「⋯」）
  menuList = [],
  folded = [];

function ensureMenu() {
  if (menu) return;
  menu = document.createElement("div");
  menu.id = "tbx-menu";
  menu.className = "tbx-menu";
  menu.setAttribute("role", "menu");
  menu.setAttribute("aria-label", tr("更多功能", "More"));
  menu.hidden = true;
  document.body.append(menu);
  menu.addEventListener("keydown", (e) => {
    const rows = [...menu.querySelectorAll("[role=menuitem]")];
    const i = rows.indexOf(document.activeElement);
    if (e.key === "Escape") {
      const owner = menuOwner;
      toggleMenu(false);
      owner?.focus();
    } else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      rows[(i + (e.key === "ArrowDown" ? 1 : rows.length - 1)) % rows.length]?.focus();
    } else if (e.key === "Tab") toggleMenu(false);
  });
  document.addEventListener("pointerdown", (e) => {
    if (!menu.hidden && !menu.contains(e.target) && !menuOwner?.contains(e.target)) toggleMenu(false);
  });
  addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !menu.hidden) toggleMenu(false);
  });
}

// 手機右上「⋯ 更多」：把語言、日誌、雷達、地標、2D、引用、說明收進一個底部選單
function ensureMobileMore() {
  const top = document.querySelector(".mob-top-actions");
  if (!top || mobMoreBtn) return;
  ensureMenu();
  mobMoreBtn = document.createElement("button");
  mobMoreBtn.type = "button";
  mobMoreBtn.id = "tbx-mob-more";
  mobMoreBtn.setAttribute("aria-haspopup", "menu");
  mobMoreBtn.setAttribute("aria-expanded", "false");
  mobMoreBtn.setAttribute("aria-controls", "tbx-menu");
  mobMoreBtn.setAttribute("aria-label", tr("更多功能", "More"));
  mobMoreBtn.title = tr("更多功能", "More");
  mobMoreBtn.innerHTML = `<i class="tb-ic" aria-hidden="true">${svg("more")}</i>`;
  mobMoreBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    const items = MOBILE_MORE.map((id) => document.getElementById(id)).filter(Boolean);
    toggleMenu(menuOwner !== mobMoreBtn || menu.hidden, mobMoreBtn, items);
  });
  top.append(mobMoreBtn);
}

function ensureMore() {
  if (moreWrap) return;
  ensureMenu();
  moreWrap = document.createElement("div");
  moreWrap.className = "tbx-more";
  moreWrap.hidden = true;
  moreBtn = document.createElement("button");
  moreBtn.type = "button";
  moreBtn.id = "tbx-more-btn";
  moreBtn.setAttribute("aria-haspopup", "menu");
  moreBtn.setAttribute("aria-expanded", "false");
  moreBtn.setAttribute("aria-controls", "tbx-menu");
  moreBtn.title = tr("更多功能", "More");
  moreBtn.innerHTML = `<i class="tb-ic" aria-hidden="true">${svg("more")}</i><span class="tb-lbl">${tr("更多", "More")}</span>`;
  moreBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleMenu(menuOwner !== moreBtn || menu.hidden, moreBtn, folded);
  });
  moreWrap.append(moreBtn);
  bar.append(moreWrap);
}

function toggleMenu(force, owner = menuOwner, list = menuList) {
  if (!menu) return;
  const open = force ?? menu.hidden;
  for (const b of [moreBtn, mobMoreBtn]) {
    if (!b) continue;
    const on = open && b === owner;
    b.setAttribute("aria-expanded", String(on));
    b.classList.toggle("active", on);
  }
  if (open && owner) {
    menuOwner = owner;
    menuList = list;
    buildMenu();
    const sheet = owner === mobMoreBtn;
    menu.classList.toggle("tbx-sheet", sheet);
    menu.hidden = false;
    if (sheet) {
      menu.style.top = "";
      menu.style.left = "";
    } else {
      const r = owner.getBoundingClientRect();
      const w = menu.offsetWidth;
      menu.style.top = `${Math.round(r.bottom + 8)}px`;
      menu.style.left = `${Math.round(Math.max(12, Math.min(innerWidth - w - 12, r.right - w)))}px`;
    }
    menu.querySelector("[role=menuitem]")?.focus({ preventScroll: true });
  } else {
    menu.hidden = true;
    menuOwner = null;
  }
}

function buildMenu() {
  menu.innerHTML = "";
  for (const btn of menuList) {
    const item = ITEMS[btn.id] || {};
    const row = document.createElement("button");
    row.type = "button";
    row.setAttribute("role", "menuitem");
    row.className = "tbx-row";
    const pressed = btn.getAttribute("aria-pressed") === "true" || btn.classList.contains("active");
    const label = item.label ? tr(item.label[0], item.label[1]) : (btn.textContent || "").trim();
    const dot = btn.classList.contains("has-unread") ? `<i class="tbx-dot" aria-label="${tr("有新訊息", "new")}"></i>` : "";
    row.innerHTML = `${svg(item.menuIcon || item.icon || "more")}<span>${label}</span>${dot}${pressed ? svg("check") : ""}`;
    if (pressed) row.classList.add("on");
    row.addEventListener("click", () => {
      toggleMenu(false);
      btn.click();
    });
    menu.append(row);
  }
}

const isSep = (el) => el.classList.contains("tbx-sep");
const childrenToFit = () => [...bar.children].filter((el) => el !== moreWrap && getComputedStyle(el).display !== "none");
let seps = [];
function ensureSeps() {
  if (seps.length) return;
  seps = [1, 2].map((n) => {
    const sep = document.createElement("span");
    sep.className = `tbx-sep tbx-sep${n}`;
    sep.setAttribute("aria-hidden", "true");
    bar.append(sep);
    return sep;
  });
}
// a divider is only drawn when both neighbouring groups still have a visible button
function syncSeps() {
  const has = (g) => [...bar.querySelectorAll(`:scope > .tbx-g${g}`)].some((el) => getComputedStyle(el).display !== "none");
  const [g1, g2, g3] = [has(1), has(2), has(3) || (moreWrap && !moreWrap.hidden)];
  seps[0]?.classList.toggle("tbx-sep-off", !(g1 && (g2 || g3)));
  seps[1]?.classList.toggle("tbx-sep-off", !(g2 && g3));
}

// Make room in two steps, least important first: (1) drop the word and keep the icon (tooltip and aria-label keep
// the name), (2) fold the button into the 「更多」 menu. Most desktop widths stop after step 1, so every feature stays
// one click away.
const rank = (el) => ITEMS[el.id]?.keep ?? 10;
// The HUD (time of day + layers) hangs below the toolbar, right-aligned; on narrower desktops it is wider than the
// gap between the brand block and the sidebar, so it must sit below the brand instead of beside it.
function placeHud() {
  const hud = document.getElementById("hud"),
    brand = document.querySelector(".brand");
  if (!hud || !brand) return;
  const low = desktop.matches && hud.getBoundingClientRect().left < brand.getBoundingClientRect().right + 10;
  document.body.classList.toggle("tbx-hud-low", low);
}

function fit() {
  if (!bar) return;
  placeHud();
  for (const el of bar.querySelectorAll(":scope > .tbx-folded, :scope > .tbx-compact")) {
    el.classList.remove("tbx-folded", "tbx-compact");
    // undo what the icon-only step added
    delete el.dataset.tbxTip;
    if (el.dataset.tbxAria) {
      el.removeAttribute("aria-label");
      delete el.dataset.tbxAria;
    }
    if (el.dataset.tbxTitle) {
      el.title = el.dataset.tbxTitle;
      delete el.dataset.tbxTitle;
    }
  }
  folded = [];
  ensureMobileMore();
  if (mobMoreBtn) mobMoreBtn.classList.toggle("has-unread", !!document.getElementById("mob-log-btn")?.classList.contains("has-unread"));
  if (!desktop.matches) {
    if (moreWrap) moreWrap.hidden = true;
    if (menu && !menu.hidden && menuOwner === moreBtn) toggleMenu(false);
    return;
  }
  if (menu && !menu.hidden && menuOwner === mobMoreBtn) toggleMenu(false);
  ensureMore();
  ensureSeps();
  for (const sp of seps) sp.classList.remove("tbx-sep-off");
  // 次要功能固定收進「更多」：工具列只留全景、清單、漫遊、護照、旅伴、快搜、圖層與語言
  for (const el of childrenToFit()) {
    if (!ITEMS[el.id]?.pin) continue;
    el.classList.add("tbx-folded");
    folded.push(el);
  }
  moreWrap.hidden = false;
  const cs = getComputedStyle(bar);
  const gap = parseFloat(cs.columnGap) || parseFloat(cs.gap) || 6;
  const chrome = (parseFloat(cs.paddingLeft) || 0) + (parseFloat(cs.paddingRight) || 0) + (parseFloat(cs.borderLeftWidth) || 0) + (parseFloat(cs.borderRightWidth) || 0);
  // the bar hugs its content and is anchored on the right, so the room it may use runs from the brand block's right
  // edge to the bar's own right edge
  const brand = document.querySelector(".brand")?.getBoundingClientRect();
  const right = bar.getBoundingClientRect().right;
  const avail = right - (brand && brand.width ? brand.right + 16 : 16) - chrome;
  const width = (els) => els.reduce((s, el) => s + el.getBoundingClientRect().width, 0) + gap * Math.max(0, els.length - 1);
  let shown = childrenToFit();
  const moreW0 = moreWrap.getBoundingClientRect().width + gap;
  const fits = (extra = moreW0) => width(shown) + extra <= avail + 0.5;
  const done = () => {
    folded.sort((a, b) => (GROUP[a.id] || 9) - (GROUP[b.id] || 9) || (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1));
    syncSeps();
    moreBtn.classList.toggle("has-on", folded.some((b) => b.getAttribute("aria-pressed") === "true"));
    if (!menu.hidden && menuOwner === moreBtn) {
      menuList = folded;
      buildMenu();
    }
  };
  if (fits()) return done();
  // step 1: icon-only, lowest rank first; the always-kept buttons (全景, 清單, 2D, language) go last, and the
  // language button keeps a short "EN" / "中" next to its globe (layout.css)
  for (const el of shown.filter((el) => !isSep(el)).sort((a, b) => rank(a) - rank(b))) {
    if (!el.querySelector(".tb-lbl, .tb-sub, .qp-btn-l, kbd")) continue;
    el.classList.add("tbx-compact");
    // the hidden word no longer names the button: give screen readers an aria-label, and sighted visitors an
    // instant styled tooltip (data-tbx-tip, layout.css) instead of the native title that appears after ~1 s
    const name = tr(ITEMS[el.id]?.label?.[0] || "", ITEMS[el.id]?.label?.[1] || "") || (el.textContent || "").trim();
    if (name) {
      el.dataset.tbxTip = name;
      if (!el.hasAttribute("aria-label")) {
        el.setAttribute("aria-label", name);
        el.dataset.tbxAria = "1";
      }
      if (el.title) {
        el.dataset.tbxTitle = el.title;
        el.removeAttribute("title");
      }
    }
    if (fits()) return done();
  }
  // step 2: fold into the menu
  for (const el of shown.filter((el) => !isSep(el) && Number.isFinite(rank(el))).sort((a, b) => rank(a) - rank(b))) {
    if (fits()) break;
    el.classList.add("tbx-folded");
    folded.push(el);
    shown = shown.filter((s) => s !== el);
  }
  // menu follows the bar's visual order: group first, then position in the bar
  done();
}

// ---------- wiring ----------
let queued = false,
  mo = null;
function schedule() {
  if (queued) return;
  queued = true;
  requestAnimationFrame(() => {
    queued = false;
    for (const sel of ["nav.toolbar", ".mob-top-actions"]) {
      for (const btn of document.querySelectorAll(`${sel} > button, ${sel} > a`)) normalizeButton(btn);
    }
    fit();
    // drop the records our own edits just produced (icons, tbx-folded classes), or the observer would loop
    mo?.takeRecords();
  });
}

function init() {
  bar = document.querySelector("nav.toolbar");
  if (!bar) return;
  document.body.classList.add("tbx-on");
  const ignore = (m) => moreWrap?.contains(m.target);
  mo = new MutationObserver((list) => {
    if (list.some((m) => !ignore(m))) schedule();
  });
  for (const el of [bar, document.querySelector(".mob-top-actions")]) {
    if (el) mo.observe(el, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ["data-zh", "data-en", "aria-pressed", "class", "hidden"] });
  }
  const ro = new ResizeObserver(schedule);
  for (const el of [bar, document.getElementById("hud"), document.querySelector(".brand")]) if (el) ro.observe(el);
  desktop.addEventListener?.("change", schedule);
  addEventListener("resize", schedule);
  document.fonts?.ready?.then(schedule);
  schedule();
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
else init();

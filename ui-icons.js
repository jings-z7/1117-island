// ui-icons.js — the one icon set for every UI control (2026-11-15).
//
// All icons share one drawing spec so they line up: 24-unit grid, stroke only (currentColor), round caps and joins;
// the line width comes from CSS (.tbx / .ui-ic), so a whole bar can be made lighter or bolder in one place.
// Drawn in the style of Lucide (ISC licence). Emoji are drawn by each OS's own font, so their size, colour and baseline
// differ between Windows, Android and iOS — controls use these icons instead.

export const P = {
  // ---- command bar (moved here from toolbar.js) ----
  overview: '<path d="M4 9V5a1 1 0 0 1 1-1h4M15 4h4a1 1 0 0 1 1 1v4M20 15v4a1 1 0 0 1-1 1h-4M9 20H5a1 1 0 0 1-1-1v-4"/><circle cx="12" cy="12" r="2.6"/>',
  faculty: '<path d="M22 9.5 12 5 2 9.5 12 14z"/><path d="M6 11.6V16c2.8 2.3 9.2 2.3 12 0v-4.4"/><path d="M22 9.5V15"/>',
  landmark: '<path d="M3 21h18"/><path d="M5 21v-9M9.7 21v-9M14.3 21v-9M19 21v-9"/><path d="M2.5 9.5 12 4l9.5 5.5z"/>',
  passport: '<rect x="5" y="3" width="14" height="18" rx="2"/><circle cx="12" cy="10.5" r="3"/><path d="M9 16.5h6"/>',
  radar: '<path d="M12 2.8 20 7.4v9.2l-8 4.6-8-4.6V7.4z"/><circle cx="12" cy="12" r="2.2"/><path d="M12 12 16.5 9.4"/>',
  walk: '<rect x="2.5" y="7" width="19" height="11" rx="5.5"/><path d="M7.5 10.5v4M5.5 12.5h4"/><path d="M15.2 11.4h.01M17.8 13.8h.01"/>',
  avatar: '<circle cx="12" cy="8" r="4"/><path d="M4.5 21c.6-4 3.6-6 7.5-6s6.9 2 7.5 6"/>',
  list: '<path d="M9 6h11M9 12h11M9 18h11"/><path d="M4.5 6h.01M4.5 12h.01M4.5 18h.01"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="m20.5 20.5-4.9-4.9"/>',
  view2d: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9.5h18M9.5 9.5V20"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3c2.6 2.6 3.8 5.6 3.8 9s-1.2 6.4-3.8 9c-2.6-2.6-3.8-5.6-3.8-9S9.4 5.6 12 3z"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 16.5v-5"/><path d="M12 7.6h.01"/>',
  layers: '<path d="M12 3 2.5 8 12 13l9.5-5z"/><path d="m2.5 12.5 9.5 5 9.5-5"/><path d="m2.5 17 9.5 5 9.5-5"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9.3 9.2a2.8 2.8 0 0 1 5.4 1c0 1.9-2.7 2.6-2.7 2.6"/><path d="M12 16.8h.01"/>',
  people: '<circle cx="9" cy="8.5" r="3.6"/><path d="M2.5 20c.5-3.4 3.1-5.2 6.5-5.2s6 1.8 6.5 5.2"/><path d="M15.5 5.2a3.4 3.4 0 0 1 0 6.6"/><path d="M18 14.9c2 .6 3.2 2.3 3.5 5.1"/>',
  chart: '<path d="M3.5 3.5v17h17"/><path d="m7.5 15 4-4.2 3 3 5-6.3"/>',
  more: '<circle cx="5.5" cy="12" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="18.5" cy="12" r="1.3"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  // ---- panels and actions ----
  close: '<path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/>',
  chevronUp: '<path d="m6 15 6-6 6 6"/>',
  chevronDown: '<path d="m6 9 6 6 6-6"/>',
  chevronRight: '<path d="m9 6 6 6-6 6"/>',
  goto: '<path d="M4 11.5 20 4l-7.5 16-1.8-6.7z"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3.5 7 8.5 6 8.5-6"/>',
  wave: '<path d="M18 11V6.5a1.8 1.8 0 0 0-3.6 0V11"/><path d="M14.4 10.5V4.8a1.8 1.8 0 0 0-3.6 0v5.7"/><path d="M10.8 10.6V6.8a1.8 1.8 0 0 0-3.6 0v7.4"/><path d="M18 8.6a1.8 1.8 0 0 1 3.6 0V14a8 8 0 0 1-8 8h-1.4c-2.6 0-4.2-.8-5.6-2.2l-3.3-3.3a1.8 1.8 0 0 1 2.6-2.6l2.3 2.3"/>',
  follow: '<path d="M4 16v-2.4C4 11.5 3 10.5 3 8c0-2.7 1.5-6 4.5-6C9.4 2 10 3.8 10 5.5c0 3.1-2 5.7-2 8.7V16a2 2 0 1 1-4 0z"/><path d="M20 20v-2.4c0-2.1 1-3.1 1-5.6 0-2.7-1.5-6-4.5-6C14.6 6 14 7.8 14 9.5c0 3.1 2 5.7 2 8.7V20a2 2 0 1 0 4 0z"/><path d="M16 17h4M4 13h4"/>',
  stop: '<rect x="6" y="6" width="12" height="12" rx="2.5"/>',
  mute: '<path d="M11 5 6.5 9H3v6h3.5l4.5 4z"/><path d="m22 9-6 6M16 9l6 6"/>',
  sound: '<path d="M11 5 6.5 9H3v6h3.5l4.5 4z"/><path d="M15.5 8.6a5 5 0 0 1 0 6.8M18.6 5.6a9 9 0 0 1 0 12.8"/>',
  ban: '<circle cx="12" cy="12" r="9"/><path d="m5.7 5.7 12.6 12.6"/>',
  shirt: '<path d="M20.4 6.6 16 4a4 4 0 0 1-8 0L3.6 6.6a1 1 0 0 0-.5 1.2l1.4 3.6a1 1 0 0 0 1 .6H7v9a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-9h1.5a1 1 0 0 0 1-.6l1.4-3.6a1 1 0 0 0-.5-1.2z"/>',
  bell: '<path d="M6 8.5a6 6 0 0 1 12 0c0 6.5 3 8.5 3 8.5H3s3-2 3-8.5"/><path d="M10.3 21a1.9 1.9 0 0 0 3.4 0"/>',
  bellOff: '<path d="M8.7 3.3A6 6 0 0 1 18 8.5c0 2.5.4 4.3 1 5.6"/><path d="M17 17H3s3-2 3-8.5c0-.7.1-1.4.3-2"/><path d="M10.3 21a1.9 1.9 0 0 0 3.4 0"/><path d="m3 3 18 18"/>',
  logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5M21 12H9"/>',
  login: '<path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><path d="m10 17 5-5-5-5M15 12H3"/>',
  chat: '<path d="M21 11.5a8.5 8.5 0 0 1-12.4 7.6L3.5 20.5l1.4-4.7A8.5 8.5 0 1 1 21 11.5z"/>',
  quote: '<path d="M4 6h16M4 11h16M4 16h9"/>',
  settings: '<path d="M20 7h-8M12 17H4"/><circle cx="8" cy="7" r="3"/><circle cx="16" cy="17" r="3"/>',
  send: '<path d="M21.5 2.5 10.5 13.5"/><path d="M21.5 2.5 14.5 21.5l-4-8-8-4z"/>',
  briefcase: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8.5 7V5a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v2M3 13h18"/>',
  bow: '<circle cx="16.5" cy="5.5" r="2.3"/><path d="M14.5 9 8 11.5"/><path d="M14.5 9 14 15l-2.5 6.5M14 15l3.5 6.5"/><path d="M11 10.3 9 15"/>',
  sparkle: '<path d="M11 3.5l1.8 4.9 4.9 1.8-4.9 1.8L11 16.9l-1.8-4.9-4.9-1.8 4.9-1.8z"/><path d="M18.5 14.5l.8 2.1 2.2.9-2.2.8-.8 2.2-.9-2.2-2.1-.8 2.1-.9z"/>',
  cup: '<path d="M17 8.5h1a3.5 3.5 0 0 1 0 7h-1"/><path d="M3.5 8.5H17V16a4 4 0 0 1-4 4H7.5a4 4 0 0 1-4-4z"/><path d="M7 2.5v3M10.5 2.5v3M14 2.5v3"/>',
  pin: '<path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
  moon: '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',
  camera: '<path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"/><circle cx="12" cy="13.5" r="3.5"/>',
  home: '<path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10v10h13V10"/><path d="M10 20v-5h4v5"/>',
  orbit: '<circle cx="12" cy="12" r="2.6"/><path d="M21 12c0 2.5-4 4.5-9 4.5S3 14.5 3 12s4-4.5 9-4.5 9 2 9 4.5z"/>',
  tram: '<rect x="5" y="3.5" width="14" height="13" rx="3"/><path d="M5 10.5h14M9 21l1.5-4.5M15 21l-1.5-4.5M9 13.5h.01M15 13.5h.01M10 3.5 9 1.5M14 3.5l1-2"/>',
  bulb: '<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2V16h5v-.1c0-.8.4-1.5 1-2A6 6 0 0 0 12 3z"/>',
  run: '<circle cx="14.5" cy="4.5" r="2"/><path d="m6 21 3.5-5.5 3 2.5V22"/><path d="M5.5 11.5 9 8.5l4 1 2.5 3 3 .5"/><path d="M9 8.5 10.5 14l2 4"/>',
  jump: '<path d="M12 21V8"/><path d="m6.5 13.5 5.5-5.5 5.5 5.5"/><path d="M5 3.5h14"/>',
  smile: '<circle cx="12" cy="12" r="9"/><path d="M8.5 14.5a4.5 4.5 0 0 0 7 0"/><path d="M9 9.5h.01M15 9.5h.01"/>',
};

// <svg> markup for an icon. `cls` picks the size/stroke rules (.ui-ic by default, .tbx for the command bar).
export const uiSvg = (name, cls = "ui-ic") =>
  `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${P[name] || ""}</svg>`;

// DOM node version (icons are fixed strings from this file, never user data)
const tpl = typeof document !== "undefined" ? document.createElement("template") : null;
export function uiIcon(name, cls = "ui-ic") {
  tpl.innerHTML = uiSvg(name, cls);
  return tpl.content.firstChild;
}

// Simple line icons (24×24, stroke = currentColor). Decorative identifiers for each policy island.
export const ISLAND_ICONS = {
  civil: '<path d="M3 20h18M5 20V10M9 20V10M15 20V10M19 20V10M3 10l9-6 9 6z"/>',
  institute: '<path d="M4 18h16M6 18v-4a6 6 0 0112 0v4M12 8V4M10 4h4"/><circle cx="12" cy="13" r="1.5"/>',
  renewal: '<path d="M5 21V4h12M5 7l12-3M17 4v6M15 10h4v3h-4zM3 21h10M8 21v-6h4v6"/>',
  transport: '<rect x="4" y="5" width="16" height="11" rx="2"/><path d="M4 11h16M8 19v-3M16 19v-3"/><circle cx="8" cy="19" r="1"/><circle cx="16" cy="19" r="1"/>',
  education: '<path d="M3 9l9-5 9 5-9 5z"/><path d="M7 11v5c3 2 7 2 10 0v-5"/>',
  lunch: '<path d="M4 12h16a8 8 0 01-16 0zM9 5c0 2 2 2 2 4M13 5c0 2 2 2 2 4"/>',
  family: '<path d="M4 11l8-7 8 7v9H4z"/><path d="M12 17s-3-1.8-3-3.6a1.6 1.6 0 013-.7 1.6 1.6 0 013 .7c0 1.8-3 3.6-3 3.6z"/>',
  card: '<rect x="3" y="6" width="18" height="12" rx="2"/><path d="M3 10h18M7 15h4"/>',
  welfare: '<path d="M12 20s-7-4.3-7-9a4 4 0 017-2.6A4 4 0 0119 11c0 4.7-7 9-7 9z"/>',
  sport: '<circle cx="12" cy="12" r="8"/><path d="M12 8l3 2-1 4h-4l-1-4zM12 4v4M20 11l-5-1M17 19l-3-5M7 19l3-5M4 11l5-1"/>',
  trails: '<path d="M3 20l6-10 4 6 3-4 5 8z"/><path d="M8 20l2-4"/>',
  forest: '<path d="M12 3l6 9h-4l4 6H6l4-6H6z"/><path d="M12 18v3"/>',
  youth: '<path d="M12 3l2.2 5.5L20 9l-4.5 3.8L17 19l-5-3-5 3 1.5-6.2L4 9l5.8-.5z"/>',
  hakka: '<path d="M4 5h11a2 2 0 012 2v5a2 2 0 01-2 2H9l-4 3v-3H4a2 2 0 01-2-2V7a2 2 0 012-2z"/><path d="M19 9h1a2 2 0 012 2v5a2 2 0 01-2 2h-1v3l-4-3h-3a2 2 0 01-2-2"/>',
  water: '<path d="M12 3c3 4.2 6 7.6 6 11a6 6 0 01-12 0c0-3.4 3-6.8 6-11z"/><path d="M3 21c2-1.3 4-1.3 6 0s4 1.3 6 0 4-1.3 6 0"/>',
  ai: '<rect x="6" y="6" width="12" height="12" rx="2"/><path d="M10 10h4v4h-4zM9 3v3M15 3v3M9 18v3M15 18v3M3 9h3M3 15h3M18 9h3M18 15h3"/>',
  diplomacy: '<circle cx="12" cy="12" r="8"/><path d="M4 12h16M12 4c3 3 3 13 0 16M12 4c-3 3-3 13 0 16"/>',
  luxury: '<circle cx="7.5" cy="7.5" r="3"/><circle cx="16.5" cy="7.5" r="3"/><path d="M9.6 9.6L19 19M17 17l2-2M14.4 9.6L5 19M7 17l-2-2M12 3l1.2 2.4L15.6 6l-1.8 1.6.5 2.4L12 8.8 9.7 10l.5-2.4L8.4 6l2.4-.6z"/>',
  innovation: '<rect x="5" y="7" width="14" height="11" rx="3"/><circle cx="9.5" cy="12" r="1.2"/><circle cx="14.5" cy="12" r="1.2"/><path d="M9 15.5h6M12 3v4M9 3h6M3 11v3M21 11v3"/>',
  esg: '<path d="M17 4C11 4 6 8.5 6 14.5c0 2 .6 3.8 1.6 5.3C13.5 19.5 19 15 20 8c.3-1.4.2-2.7-.3-4H17z"/><path d="M6 19.8c3-3.8 6.8-6.8 11.5-8.8"/>',
};
export const HEART_COLORS = { H: "#5e9a6f", E: "#b8920f", A: "#db6a41", R: "#3e7c8c", T: "#7a6fb0" };
export function icon(id, cls = "") {
  return `<svg class="ico ${cls}" viewBox="0 0 24 24" aria-hidden="true">${ISLAND_ICONS[id] || '<circle cx="12" cy="12" r="6"/>'}</svg>`;
}

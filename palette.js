// 港都典藏 palette: the one place the 3D scene's colour identity is decided.
// Ivory limestone walls, emerald / slate roofs with a little burgundy, warm stone quays, brass details and a
// turquoise–emerald harbour. Decorative only: no department fact lives here.
//
// Most models still pass hand-picked hex values (≈2,000 across the scene files). Instead of editing every one,
// `tone(hex)` maps each source colour onto this palette when a part is created (kit.js) or when a finished
// scene is swept once (`applyPalette`). Glass, light bulbs, signage white and dark ink pass through unchanged.

export const PAL = {
  // structure
  ivory: 0xefe7d6, // limestone walls
  ivoryShade: 0xd9cdb5,
  quay: 0xe6dcc7, // island seawall cap
  quayShade: 0xbfb19a,
  // roofs
  emerald: 0x2f5f52,
  slate: 0x3d5866,
  burgundy: 0x7b3440,
  // accents
  brass: 0xc8a052,
  brassDeep: 0x9c7a3a,
  ink: 0x1d2724,
  // nature
  palm: 0x4f8a5a,
  foliage: 0x5f9466,
  lawn: 0x9fbf86,
  // harbour
  sea: 0x5fb7b0,
  seaDeep: 0x3f8f92,
  shallow: 0x8fd6c9,
  foam: 0xf3fbf7,
};

// UI-side accent used where the scene highlights a selection (was the reference's coral)
export const ACCENT = PAL.brass;

const cache = new Map();
const hsl = { h: 0, s: 0, l: 0 };

function hexToHsl(hex) {
  const r = ((hex >> 16) & 255) / 255,
    g = ((hex >> 8) & 255) / 255,
    b = (hex & 255) / 255;
  const max = Math.max(r, g, b),
    min = Math.min(r, g, b),
    l = (max + min) / 2;
  let h = 0,
    s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
    h /= 6;
  }
  hsl.h = h * 360;
  hsl.s = s;
  hsl.l = l;
  return hsl;
}
function hslToHex(h, s, l) {
  h = (((h % 360) + 360) % 360) / 360;
  s = Math.min(1, Math.max(0, s));
  l = Math.min(1, Math.max(0, l));
  const f = (p, q, t) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  let r, g, b;
  if (!s) r = g = b = l;
  else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s,
      p = 2 * l - q;
    r = f(p, q, h + 1 / 3);
    g = f(p, q, h);
    b = f(p, q, h - 1 / 3);
  }
  return (Math.round(r * 255) << 16) | (Math.round(g * 255) << 8) | Math.round(b * 255);
}
function mixHex(a, b, t) {
  const ch = (s) => Math.round(((a >> s) & 255) * (1 - t) + ((b >> s) & 255) * t);
  return (ch(16) << 16) | (ch(8) << 8) | ch(0);
}
// stable pseudo-random pick per source colour, so one hand-picked colour always lands on the same roof tone
function pick(hex) {
  let x = hex ^ 0x9e3779b9;
  x = Math.imul(x ^ (x >>> 16), 0x45d9f3b);
  x = Math.imul(x ^ (x >>> 16), 0x45d9f3b);
  return ((x ^ (x >>> 16)) >>> 0) / 4294967296;
}

function map(hex) {
  const { h, s, l } = hexToHsl(hex);
  // pure / near-pure white, dark ink and greys: signage, glass frames, lights — leave alone
  if (l > 0.965 || l < 0.16 || s < 0.06) return hex;
  // coral · terracotta · brick · orange-red (the reference's roofs, awnings and bridges) → emerald / slate / burgundy
  if ((h < 26 || h > 342) && s > 0.32 && l > 0.25 && l < 0.86) {
    const r = pick(hex);
    const base = r < 0.56 ? PAL.emerald : r < 0.86 ? PAL.slate : PAL.burgundy;
    const b = hexToHsl(base);
    // keep the original's relative lightness so shaded faces and stripes stay readable
    return hslToHex(b.h, b.s, Math.min(0.62, b.l + (l - 0.5) * 0.45));
  }
  // pastel pinks and rose (plazas, bunting, blossoms) → champagne with a hint of rose, never candy pink
  if (h >= 290 && h <= 342 && s > 0.2) return mixHex(hex, l > 0.7 ? 0xead8cc : PAL.burgundy, l > 0.7 ? 0.62 : 0.5);
  // warm creams / sand / beige (walls, decks, plazas) → ivory limestone
  if (h >= 22 && h <= 55 && l >= 0.72 && s < 0.75) return mixHex(hex, PAL.ivory, 0.55);
  // tan wood / timber decks → slightly deeper, less orange teak
  if (h >= 18 && h <= 40 && l >= 0.35 && l < 0.72 && s >= 0.2 && s < 0.6) return hslToHex(h + 4, s * 0.82, l * 0.94);
  // saturated yellow (signs, rails) → brass
  if (h >= 40 && h <= 58 && s > 0.55 && l > 0.45 && l < 0.82) return mixHex(hex, PAL.brass, 0.6);
  // pastel foliage greens (ball trees, lawns) → deeper tropical greens
  if (h >= 70 && h <= 150 && s > 0.12) return hslToHex(h + 8, Math.min(0.62, s * 1.3 + 0.06), l * (l > 0.6 ? 0.84 : 0.82));
  // pastel aqua / sky-blue surfaces (not glass, which is very light) → toward the harbour turquoise
  if (h >= 170 && h <= 200 && s > 0.2 && l > 0.45 && l < 0.82) return hslToHex(h - 4, s, l);
  return hex;
}

export function tone(hex) {
  if (typeof hex !== "number") return hex;
  let v = cache.get(hex);
  if (v === undefined) cache.set(hex, (v = map(hex)));
  return v;
}

// One sweep over a finished scene: recolour plain (non vertex-coloured, non shader) materials once.
// Kit instances are already toned at creation and their shared material is white, which passes through.
const done = new WeakSet();
export function applyPalette(root) {
  root.traverse((o) => {
    const ms = o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : null;
    if (!ms) return;
    for (const m of ms) {
      if (!m || done.has(m)) continue;
      done.add(m);
      if (m.isShaderMaterial || m.vertexColors || m.userData?.noPalette || !m.color) continue;
      if (m.transparent && m.blending === 2) continue; // additive glows
      const before = m.color.getHex();
      const after = tone(before);
      if (after !== before) m.color.setHex(after);
    }
  });
}

// Ground and quay paint (island top textures, edge bands): the roof mapping would turn a terracotta plaza into a
// field of emerald or burgundy, so warm reds become sandstone / clay paving instead.
const gcache = new Map();
export function toneGround(hex) {
  if (typeof hex !== "number") return hex;
  let v = gcache.get(hex);
  if (v !== undefined) return v;
  const { h, s, l } = hexToHsl(hex);
  if ((h < 30 || h > 342) && s > 0.25 && l > 0.25 && l < 0.86) v = mixHex(hex, l > 0.6 ? 0xd8c5a2 : 0xb39770, 0.7);
  else v = tone(hex);
  gcache.set(hex, v);
  return v;
}

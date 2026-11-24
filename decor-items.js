// Island-specific edge vignettes: small scenic objects placed along each island's outer zone.
// Each type name is unique to its island so every district has surroundings of its own.
// fn(kit, x, z, y, yaw, rnd) — purely decorative.
const ink = 0x211d1d,
  coral = 0xdb6a41,
  wood = 0xb48560,
  teal = 0x3e7c8c,
  yel = 0xe8c547,
  leaf = 0x8fa67a;
const R = (k, x, z, w, h, d, c, yaw = 0, y = 0) => k.box(x, y + h / 2, z, w, h, d, c, null, [0, yaw, 0]);
const H = (k, x, z, w, h, d, c, yaw = 0, y = 0) => k.hbox(x, y + h / 2, z, w, h, d, c, null, [0, yaw, 0]);
const pole = (k, x, z, h, y, c = ink) => k.cyl(x, y + h / 2, z, 0.016, h, c);
const off = (x, z, yaw, d) => [x + Math.sin(yaw) * d, z + Math.cos(yaw) * d];

export const EDGE_ITEMS = {
  // 水域政策: scenic waterside pieces (not policy facilities)
  water: [
    ["v:water-reedClump", (k, x, z, y, yaw, rnd) => { for (let j = 0; j < 5; j++) k.cyl(x + (rnd() - 0.5) * 0.12, y + 0.09, z + (rnd() - 0.5) * 0.12, 0.009, 0.16 + rnd() * 0.06, 0x9cae6e); k.ico(x, y + 0.015, z, [0.14, 0.02, 0.12], 0x93ab76); }],
    ["v:water-lilyTub", (k, x, z, y) => { k.cyl(x, y + 0.04, z, 0.13, 0.08, 0x8a6a4e); k.cyl(x, y + 0.088, z, 0.11, 0.008, 0x8ec9d4); k.cyl(x + 0.03, y + 0.097, z, 0.04, 0.008, 0x7f9a6a); k.sphere(x - 0.03, y + 0.095, z + 0.02, 0.018, 0xf2b5c6); }],
    ["v:water-steppingStones", (k, x, z, y, yaw) => { for (let j = 0; j < 3; j++) k.cyl(...off(x, z, yaw, (j - 1) * 0.09), y + 0.012, 0.045, 0.024, [0xc9bba6, 0xb7a993, 0xd8ccba][j]); }],
    ["v:water-canoeRack", (k, x, z, y, yaw) => { for (const d of [-0.08, 0.08]) pole(k, ...off(x, z, yaw + Math.PI / 2, d), 0.12, y, wood); k.part("sphere", [x, y + 0.14, z], [0.3, 0.05, 0.07], coral, null, [0, yaw, 0]); }],
    ["v:water-willow", (k, x, z, y) => { k.cyl(x, y + 0.12, z, 0.025, 0.24, 0x8a6a4e); k.sphere(x, y + 0.28, z, [0.17, 0.14, 0.17], 0xa3c296); for (let j = 0; j < 5; j++) k.cyl(x + Math.cos(j * 1.3) * 0.13, y + 0.2, z + Math.sin(j * 1.3) * 0.13, 0.012, 0.14, 0x93b489); }],
  ],
  // AI 政策: tidy plaza pieces (not policy facilities)
  ai: [
    ["v:ai-cubeTree", (k, x, z, y) => { k.box(x, y + 0.04, z, 0.12, 0.08, 0.12, 0xeef3f2); k.cyl(x, y + 0.13, z, 0.015, 0.1, 0x8a6a4e); k.box(x, y + 0.23, z, 0.14, 0.12, 0.14, 0x7f9a6a); }],
    ["v:ai-laptopTable", (k, x, z, y, yaw) => { k.cyl(x, y + 0.09, z, 0.12, 0.016, 0xeef3f2); k.cyl(x, y + 0.045, z, 0.016, 0.09, ink); H(k, x, z, 0.06, 0.005, 0.045, 0x3b3a42, yaw, y + 0.1); H(k, ...off(x, z, yaw, -0.02), 0.06, 0.04, 0.004, 0x5f9aa6, yaw, y + 0.105); }],
    ["v:ai-bikeDock", (k, x, z, y, yaw) => { R(k, x, z, 0.24, 0.03, 0.06, 0x2f5a6a, yaw, y); for (let j = 0; j < 3; j++) pole(k, ...off(x, z, yaw + Math.PI / 2, (j - 1) * 0.08), 0.1, y + 0.03, 0x9aa6a6); }],
    ["v:ai-glassBollard", (k, x, z, y) => { k.cyl(x, y + 0.06, z, 0.03, 0.12, 0x2f5a6a); k.bulb(x, y + 0.125, z, 0.022, 0xbfe9ff); }],
    ["v:ai-coffeeKiosk", (k, x, z, y, yaw) => { R(k, x, z, 0.18, 0.15, 0.12, 0xeef3f2, yaw, y); H(k, x, z, 0.22, 0.02, 0.16, teal, yaw, y + 0.17); }],
  ],
  civil: [
    ["v:civil-coffeeCart", (k, x, z, y, yaw) => { R(k, x, z, 0.2, 0.14, 0.12, coral, yaw, y); H(k, x, z, 0.24, 0.02, 0.16, 0xfff1de, yaw, y + 0.2); pole(k, x, z, 0.2, y + 0.06, 0xd9cbb4); }],
    ["v:civil-newsKiosk", (k, x, z, y, yaw) => { R(k, x, z, 0.14, 0.18, 0.12, 0x7aa58f, yaw, y); H(k, x, z, 0.18, 0.02, 0.16, coral, yaw, y + 0.18); }],
    ["v:civil-flowerTub", (k, x, z, y) => { k.cyl(x, y + 0.05, z, 0.16, 0.1, 0xd9cbb4); k.ico(x, y + 0.13, z, [0.15, 0.08, 0.15], 0xf2b5c6); }],
    ["v:civil-shadeTree", (k, x, z, y) => { k.cyl(x, y + 0.12, z, 0.03, 0.24, 0x8a6a4e); k.ico(x, y + 0.3, z, [0.22, 0.18, 0.22], 0x7f9a6a); k.cyl(x, y + 0.01, z, 0.18, 0.02, 0xbfae95); }],
    ["v:civil-bikeShelter", (k, x, z, y, yaw) => { for (const d of [-0.1, 0.1]) pole(k, ...off(x, z, yaw + Math.PI / 2, d), 0.18, y); H(k, x, z, 0.28, 0.02, 0.14, teal, yaw, y + 0.18); for (let j = 0; j < 3; j++) k.part("torus", [x, y + 0.04, z], [0.06, 0.06, 0.06], 0x6b6f6c, null, [0, yaw + j * 0.2, 0]); }],
  ],
  institute: [
    ["v:inst-sensorPole", (k, x, z, y) => { pole(k, x, z, 0.4, y); k.box(x, y + 0.38, z, 0.07, 0.05, 0.07, teal); k.bulb(x, y + 0.42, z, 0.025, 0x9fffd0); }],
    ["v:inst-readingTable", (k, x, z, y) => { k.cyl(x, y + 0.09, z, 0.2, 0.02, wood); k.cyl(x, y + 0.045, z, 0.025, 0.09, ink); k.hbox(x + 0.03, y + 0.105, z, 0.07, 0.008, 0.05, 0xffffff); }],
    ["v:inst-miniGreenhouse", (k, x, z, y, yaw) => { R(k, x, z, 0.24, 0.14, 0.16, 0xd5ecee, yaw, y); k.part("prism", [x, y + 0.19, z], [0.17, 0.24, 0.17], 0xbfe0e2, null, [0, yaw, Math.PI / 2]); }],
    ["v:inst-weatherVane", (k, x, z, y) => { pole(k, x, z, 0.36, y); k.hbox(x, y + 0.36, z, 0.14, 0.01, 0.01, ink); k.part("tetra", [x + 0.07, y + 0.36, z], [0.04, 0.04, 0.01], coral, null, [0, 0, -Math.PI / 2]); }],
    ["v:inst-solarBench", (k, x, z, y, yaw) => { H(k, x, z, 0.24, 0.05, 0.08, wood, yaw, y + 0.05); H(k, x, z, 0.26, 0.012, 0.12, 0x2f3a46, yaw, y + 0.2); for (const d of [-0.1, 0.1]) pole(k, ...off(x, z, yaw + Math.PI / 2, d), 0.2, y, 0x9aa6a6); }],
  ],
  renewal: [
    ["v:renew-starPodium", (k, x, z, y, yaw) => { R(k, x, z, 0.18, 0.08, 0.14, 0xf7f2e7, yaw, y); H(k, x, z, 0.2, 0.02, 0.16, 0xd8a848, yaw, y + 0.08); k.bulb(x, y + 0.14, z, 0.035, 0xffe49e); }],
    ["v:renew-brandSign", (k, x, z, y, yaw) => { R(k, x, z, 0.09, 0.24, 0.04, 0x2c3e50, yaw, y); H(k, x, z, 0.11, 0.03, 0.05, 0xd8a848, yaw, y + 0.24); k.bulb(x, y + 0.28, z, 0.025, 0xffe49e); }],
    ["v:renew-vipShuttle", (k, x, z, y, yaw) => { R(k, x, z, 0.22, 0.08, 0.11, 0x211d1d, yaw, y + 0.02); R(k, x, z, 0.13, 0.06, 0.1, 0xd8a848, yaw, y + 0.09); }],
    ["v:renew-archGate", (k, x, z, y, yaw) => { for (const d of [-0.08, 0.08]) pole(k, ...off(x, z, yaw + Math.PI / 2, d), 0.22, y, 0xd8a848); H(k, x, z, 0.22, 0.03, 0.04, 0xd8a848, yaw, y + 0.22); }],
  ],
  transport: [
    ["v:tr-youbikeDock", (k, x, z, y, yaw) => { for (let j = 0; j < 3; j++) { const [px, pz] = off(x, z, yaw + Math.PI / 2, (j - 1) * 0.07); k.hbox(px, y + 0.06, pz, 0.02, 0.12, 0.02, 0xd8a848); k.part("torus", [px, y + 0.05, pz + 0.04], [0.07, 0.07, 0.07], ink, null, [0, yaw, 0]); k.hbox(px, y + 0.08, pz + 0.04, 0.01, 0.01, 0.1, yel, null, [0, yaw, 0]); } }],
    ["v:tr-busStopSign", (k, x, z, y, yaw) => { pole(k, x, z, 0.36, y, 0xd8a848); R(k, x, z, 0.1, 0.12, 0.02, coral, yaw, y + 0.3); }],
    ["v:tr-chargingPost", (k, x, z, y, yaw) => { R(k, x, z, 0.06, 0.16, 0.05, 0x5f9aa6, yaw, y); k.bulb(...off(x, z, yaw, 0.03), 0.015, 0x9fffd0); }],
    ["v:tr-scooterBay", (k, x, z, y, yaw) => { H(k, x, z, 0.26, 0.008, 0.14, 0xb83a3a, yaw, y); R(k, x, z, 0.08, 0.12, 0.1, 0xd8a848, yaw, y + 0.03); }],
    ["v:tr-trafficCone", (k, x, z, y) => { k.cyl(x, y + 0.08, z, 0.09, 0.14, 0xd8a848); k.bulb(x, y + 0.17, z, 0.025, 0xffe49e); }],
  ],
  education: [
    ["v:edu-flowerBed", (k, x, z, y) => { R(k, x, z, 0.24, 0.05, 0.12, wood, 0, y); for (let j = 0; j < 4; j++) k.sphere(x - 0.08 + j * 0.055, y + 0.07, z, 0.03, [0xf2b5c6, yel, 0xffffff, 0xd9c6f0][j]); }],
    ["v:edu-schoolBell", (k, x, z, y) => { pole(k, x - 0.05, z, 0.26, y, wood); pole(k, x + 0.05, z, 0.26, y, wood); k.hbox(x, y + 0.26, z, 0.14, 0.02, 0.02, wood); k.part("dome", [x, y + 0.2, z], [0.05, 0.05, 0.05], yel, null, [Math.PI, 0, 0]); }],
    ["v:edu-noticeBoard", (k, x, z, y, yaw) => { for (const d of [-0.08, 0.08]) pole(k, ...off(x, z, yaw + Math.PI / 2, d), 0.22, y, wood); R(k, x, z, 0.2, 0.12, 0.02, 0x7aa58f, yaw, y + 0.12); }],
    ["v:edu-hopscotch", (k, x, z, y, yaw) => { for (let j = 0; j < 4; j++) k.hbox(...off(x, z, yaw, -0.09 + j * 0.06), y + 0.004, 0.05, 0.004, 0.05, j % 2 ? yel : 0xffffff, null, [0, yaw, 0]); }],
  ],
  lunch: [
    ["v:lunch-wineBarrel", (k, x, z, y, yaw) => { R(k, x, z, 0.16, 0.04, 0.1, wood, yaw, y); k.part("cylinder", [x, y + 0.09, z], [0.09, 0.14, 0.09], 0x8a5a36, null, [0, yaw, Math.PI / 2]); k.cyl(x + 0.06, y + 0.14, z, 0.02, 0.06, 0x2f5233); }],
    ["v:lunch-bistroTable", (k, x, z, y) => { k.cyl(x, y + 0.05, z, 0.02, 0.1, ink); k.cyl(x, y + 0.11, z, 0.16, 0.02, 0xffffff); k.bulb(x, y + 0.14, z, 0.02, 0xffe49e); }],
    ["v:lunch-serviceTrolley", (k, x, z, y, yaw) => { R(k, x, z, 0.16, 0.1, 0.1, 0xf7f2e7, yaw, y + 0.02); k.part("dome", [x, y + 0.13, z], [0.09, 0.06, 0.09], 0xd8a848); }],
    ["v:lunch-coffeeBar", (k, x, z, y, yaw) => { R(k, x, z, 0.18, 0.12, 0.1, 0x3b322c, yaw, y); H(k, x, z, 0.2, 0.02, 0.12, 0xd8a848, yaw, y + 0.12); k.part("cone", [x, y + 0.28, z], [0.22, 0.08, 0.22], coral); pole(k, x, z, 0.16, y + 0.12, wood); }],
  ],
  family: [
    ["v:fam-luggageCart", (k, x, z, y, yaw) => { H(k, x, z, 0.16, 0.02, 0.1, 0xd8a848, yaw, y + 0.02); k.part("torus", [x, y + 0.11, z], [0.12, 0.16, 0.08], 0xd8a848, null, [0, yaw, 0]); R(k, x, z, 0.08, 0.08, 0.06, coral, yaw, y + 0.03); }],
    ["v:fam-highTeaTable", (k, x, z, y) => { k.cyl(x, y + 0.05, z, 0.02, 0.1, ink); k.cyl(x, y + 0.1, z, 0.16, 0.02, 0xf7f2e7); pole(k, x, z, 0.24, y + 0.1, wood); k.part("cone6", [x, y + 0.34, z], [0.26, 0.08, 0.26], 0xf3ead8); }],
    ["v:fam-welcomeFountain", (k, x, z, y) => { k.cyl(x, y + 0.03, z, 0.22, 0.05, 0xe6dccb); k.cyl(x, y + 0.06, z, 0.18, 0.015, 0x7fd0d8); k.sphere(x, y + 0.11, z, 0.04, 0xd5ecee); }],
    ["v:fam-stanchionRope", (k, x, z, y, yaw) => { H(k, x, z, 0.24, 0.008, 0.14, 0xb83a3a, yaw, y); for (const d of [-0.09, 0.09]) pole(k, ...off(x, z, yaw + Math.PI / 2, d), 0.12, y, 0xd8a848); }],
  ],
  card: [
    ["v:card-ticketBooth", (k, x, z, y, yaw) => { R(k, x, z, 0.14, 0.2, 0.14, 0xf2efe8, yaw, y); k.part("cone", [x, y + 0.24, z], [0.2, 0.08, 0.2], coral); }],
    ["v:card-bookStack", (k, x, z, y) => { for (let j = 0; j < 4; j++) k.hbox(x, y + 0.015 + j * 0.03, z, 0.1, 0.025, 0.07, [coral, yel, teal, 0x6f7fb5][j], null, [0, j * 0.2, 0]); }],
    ["v:card-readingBench", (k, x, z, y, yaw) => { H(k, x, z, 0.22, 0.04, 0.07, wood, yaw, y + 0.04); k.hbox(x, y + 0.085, z, 0.06, 0.012, 0.045, 0xffffff, null, [0, yaw, 0]); }],
    ["v:card-posterBoard", (k, x, z, y, yaw) => { for (const d of [-0.06, 0.06]) pole(k, ...off(x, z, yaw + Math.PI / 2, d), 0.24, y); R(k, x, z, 0.16, 0.14, 0.015, 0xf2a1a1, yaw, y + 0.12); }],
  ],
  welfare: [
    ["v:wel-gardenBox", (k, x, z, y) => { R(k, x, z, 0.16, 0.07, 0.16, wood, 0, y); k.ico(x, y + 0.1, z, [0.13, 0.07, 0.13], 0xd9c6f0); }],
    ["v:wel-handrail", (k, x, z, y, yaw) => { for (const d of [-0.1, 0, 0.1]) pole(k, ...off(x, z, yaw + Math.PI / 2, d), 0.12, y, teal); H(k, x, z, 0.24, 0.012, 0.012, teal, yaw + Math.PI / 2, y + 0.12); }],
    ["v:wel-birdFeeder", (k, x, z, y) => { pole(k, x, z, 0.26, y, wood); k.part("cone6", [x, y + 0.28, z], [0.1, 0.05, 0.1], coral); k.box(x, y + 0.24, z, 0.06, 0.04, 0.06, 0xf2efe8); }],
    ["v:wel-restBench", (k, x, z, y, yaw) => { H(k, x, z, 0.2, 0.03, 0.07, 0xb48560, yaw, y + 0.06); H(k, x, z, 0.2, 0.06, 0.012, 0xb48560, yaw, y + 0.1); for (const d of [-0.11, 0.11]) H(k, ...off(x, z, yaw + Math.PI / 2, d), 0.012, 0.03, 0.06, teal, yaw, y + 0.1); }],
  ],
  sport: [
    ["v:sp-bellhopCart", (k, x, z, y, yaw) => { H(k, x, z, 0.16, 0.02, 0.1, 0xd8a848, yaw, y + 0.02); k.part("torus", [x, y + 0.12, z], [0.12, 0.16, 0.08], 0xd8a848, null, [0, yaw, 0]); R(k, x, z, 0.09, 0.08, 0.06, coral, yaw, y + 0.03); }],
    ["v:sp-poolCabana", (k, x, z, y, yaw) => { H(k, x, z, 0.24, 0.02, 0.16, 0x6ec3d0, yaw, y); H(k, x, z, 0.18, 0.03, 0.12, 0xffffff, yaw, y + 0.18); for (const d of [-0.07, 0.07]) pole(k, ...off(x, z, yaw + Math.PI / 2, d), 0.18, y, wood); }],
    ["v:sp-valetPodium", (k, x, z, y, yaw) => { R(k, x, z, 0.1, 0.14, 0.08, 0x2c3e50, yaw, y); pole(k, x, z, 0.28, y, 0xd8a848); k.part("cone6", [x, y + 0.3, z], [0.24, 0.08, 0.24], 0xd8a848); }],
    ["v:sp-starMonument", (k, x, z, y, yaw) => { R(k, x, z, 0.12, 0.22, 0.06, 0xf7f2e7, yaw, y); H(k, x, z, 0.14, 0.03, 0.08, 0xd8a848, yaw, y + 0.22); k.bulb(x, y + 0.27, z, 0.03, 0xffe49e); }],
    ["v:sp-globeSign", (k, x, z, y, yaw) => { k.cyl(x, y + 0.04, z, 0.12, 0.08, 0xf4ecdc); pole(k, x, z, 0.24, y, 0xd8a848); k.sphere(x, y + 0.26, z, 0.07, 0x3e7c8c); k.part("torus", [x, y + 0.26, z], [0.095, 0.095, 0.095], 0xd8a848, null, [0.5, yaw, 0]); }],
    ["v:sp-toriiLantern", (k, x, z, y, yaw) => { k.box(x, y + 0.03, z, 0.08, 0.06, 0.08, 0xb7a993); k.cyl(x, y + 0.1, z, 0.035, 0.09, 0xd94838); k.part("cone6", [x, y + 0.18, z], [0.11, 0.05, 0.11], 0x2c323b); k.bulb(x, y + 0.12, z, 0.024, 0xffe49e); }],
  ],
  trails: [
    ["v:tr-onsenBath", (k, x, z, y) => { k.cyl(x, y + 0.03, z, 0.22, 0.05, 0x9c8a7a); k.cyl(x, y + 0.058, z, 0.18, 0.012, 0x7fd0d8); k.sphere(x, y + 0.1, z, [0.06, 0.04, 0.06], 0xffffff); }],
    ["v:tr-resortParasol", (k, x, z, y, yaw) => { H(k, x, z, 0.18, 0.025, 0.09, 0xf7f2e7, yaw, y + 0.02); pole(k, x, z, 0.24, y, wood); k.part("cone6", [x, y + 0.26, z], [0.24, 0.08, 0.24], coral); }],
    ["v:tr-stoneLantern", (k, x, z, y) => { k.box(x, y + 0.03, z, 0.07, 0.06, 0.07, 0xb7a993); k.cyl(x, y + 0.1, z, 0.03, 0.08, 0xb7a993); k.part("cone6", [x, y + 0.17, z], [0.09, 0.05, 0.09], 0x9c8a7a); k.bulb(x, y + 0.11, z, 0.02, 0xffe49e); }],
    ["v:tr-chainFlags", (k, x, z, y, yaw) => { for (let j = -1; j <= 1; j++) { const [px, pz] = off(x, z, yaw + Math.PI / 2, j * 0.07); pole(k, px, pz, 0.28, y, 0xd8a848); H(k, px + 0.03, pz, 0.06, 0.08, 0.01, [coral, teal, 0xd8a848][j + 1], yaw, y + 0.2); } }],
  ],
  forest: [
    ["v:fo-sapling", (k, x, z, y) => { k.cyl(x, y + 0.03, z, 0.06, 0.06, 0x8a6a4e); k.part("cone6", [x, y + 0.13, z], [0.07, 0.15, 0.07], 0x7f9a6a); for (const d of [-0.03, 0.03]) pole(k, x + d, z + 0.03, 0.14, y, wood); }],
    ["v:fo-mushrooms", (k, x, z, y) => { for (let j = 0; j < 3; j++) { k.cyl(x + j * 0.04, y + 0.02, z, 0.012, 0.04, 0xf2efe8); k.part("dome", [x + j * 0.04, y + 0.035, z], [0.035, 0.025, 0.035], [coral, 0xe8c547, coral][j]); } }],
    ["v:fo-stump", (k, x, z, y) => { k.cyl(x, y + 0.03, z, 0.12, 0.06, 0xa77a55); k.cyl(x, y + 0.061, z, 0.1, 0.004, 0xd9b48a); }],
    ["v:fo-birdhouse", (k, x, z, y) => { pole(k, x, z, 0.26, y, wood); k.box(x, y + 0.27, z, 0.06, 0.06, 0.06, coral); k.part("cone6", [x, y + 0.32, z], [0.09, 0.05, 0.09], 0x8a6a4e); }],
  ],
  youth: [
    ["v:yo-graffitiPanel", (k, x, z, y, yaw) => { R(k, x, z, 0.24, 0.16, 0.03, [yel, coral, 0x58a6a6][Math.floor(Math.abs(x * 13)) % 3], yaw, y); }],
    ["v:yo-speaker", (k, x, z, y, yaw) => { R(k, x, z, 0.08, 0.12, 0.07, ink, yaw, y); k.cyl(...off(x, z, yaw, 0.036), y + 0.07, 0.04, 0.005, 0x58585f); }],
    ["v:yo-beanbags", (k, x, z, y) => { for (let j = 0; j < 2; j++) k.ico(x + j * 0.09, y + 0.04, z, [0.08, 0.06, 0.08], [0xf2a1a1, 0x9fc4e6][j]); }],
    ["v:yo-neonPole", (k, x, z, y) => { pole(k, x, z, 0.3, y); k.glow(x, y + 0.31, z, 0.12, 0.05, 0.015, 0xff8fbf); }],
  ],
  diplomacy: [
    ["v:dip-bollard", (k, x, z, y) => { k.cyl(x, y + 0.04, z, 0.05, 0.08, ink); k.cyl(x, y + 0.085, z, 0.065, 0.015, ink); }],
    ["v:dip-lifebuoy", (k, x, z, y, yaw) => { for (const d of [-0.05, 0.05]) pole(k, ...off(x, z, yaw + Math.PI / 2, d), 0.2, y, 0xf2efe8); k.part("torus", [x, y + 0.15, z], [0.1, 0.1, 0.1], coral, null, [0, yaw, 0]); }],
    ["v:dip-telescope", (k, x, z, y, yaw) => { pole(k, x, z, 0.16, y, 0x58585f); k.part("cylinder", [x, y + 0.18, z], [0.03, 0.12, 0.03], teal, null, [1.2, yaw, 0]); }],
    ["v:dip-suitcases", (k, x, z, y, yaw) => { for (let j = 0; j < 2; j++) R(k, ...off(x, z, yaw + Math.PI / 2, j * 0.07), 0.05, 0.1 + j * 0.03, 0.08, [coral, teal][j], yaw, y); }],
    ["v:dip-ropeCoil", (k, x, z, y) => k.part("torus", [x, y + 0.012, z], [0.08, 0.08, 0.18], 0xd8c39a, null, [Math.PI / 2, 0, 0])],
  ],
  luxury: [
    ["v:lux-goldKeyPillar", (k, x, z, y, yaw) => { R(k, x, z, 0.12, 0.2, 0.08, 0xf6efe2, yaw, y); H(k, x, z, 0.14, 0.025, 0.1, 0xd8a848, yaw, y + 0.2); k.bulb(x, y + 0.25, z, 0.03, 0xffe49e); }],
    ["v:lux-champagneStand", (k, x, z, y) => { k.cyl(x, y + 0.06, z, 0.03, 0.12, 0xd8a848); k.cyl(x, y + 0.13, z, 0.15, 0.02, 0xfbf8f2); k.bulb(x, y + 0.16, z, 0.025, 0xffe49e); }],
    ["v:lux-redCarpetRope", (k, x, z, y, yaw) => { H(k, x, z, 0.24, 0.008, 0.14, 0xb83a3a, yaw, y); for (const d of [-0.09, 0.09]) pole(k, ...off(x, z, yaw + Math.PI / 2, d), 0.14, y, 0xd8a848); }],
    ["v:lux-topiaryUrn", (k, x, z, y) => { k.cyl(x, y + 0.05, z, 0.12, 0.1, 0xd8a848); k.sphere(x, y + 0.16, z, 0.09, 0x7fae6a); k.sphere(x, y + 0.26, z, 0.06, 0x9cc27a); }],
  ],
  innovation: [
    ["v:inn-deliveryBot", (k, x, z, y) => { k.cyl(x, y + 0.08, z, 0.09, 0.14, 0xf4f8fa); k.box(x, y + 0.17, z, 0.08, 0.06, 0.07, 0x2c3e50); k.bulb(x, y + 0.22, z, 0.02, 0x9fffd0); }],
    ["v:inn-smartTotem", (k, x, z, y, yaw) => { R(k, x, z, 0.1, 0.24, 0.05, 0x263342, yaw, y); k.glow(x, y + 0.14, z, 0.08, 0.14, 0.055, 0x7fd0d8); }],
    ["v:inn-holoTable", (k, x, z, y) => { k.cyl(x, y + 0.06, z, 0.14, 0.08, 0x3e7c8c); k.bulb(x, y + 0.14, z, 0.035, 0x8be2f2); }],
    ["v:inn-techTree", (k, x, z, y) => { k.box(x, y + 0.04, z, 0.12, 0.08, 0.12, 0xeef5f7); k.cyl(x, y + 0.14, z, 0.016, 0.12, 0x3e7c8c); k.box(x, y + 0.24, z, 0.14, 0.12, 0.14, 0x7fae6a); }],
  ],
  esg: [
    ["v:esg-solarLamp", (k, x, z, y, yaw) => { pole(k, x, z, 0.28, y, 0x4a6b53); H(k, x, z, 0.12, 0.015, 0.08, 0x243b55, yaw, y + 0.28); k.bulb(x, y + 0.25, z, 0.025, 0xd8f5d0); }],
    ["v:esg-carbonTotem", (k, x, z, y, yaw) => { R(k, x, z, 0.1, 0.22, 0.05, 0x5e9a6f, yaw, y); k.bulb(x, y + 0.25, z, 0.025, 0x9fffd0); }],
    ["v:esg-ecoPlanter", (k, x, z, y) => { R(k, x, z, 0.2, 0.06, 0.12, wood, 0, y); k.ico(x, y + 0.1, z, [0.16, 0.08, 0.12], 0x8db86f); }],
    ["v:esg-herbBench", (k, x, z, y, yaw) => { H(k, x, z, 0.22, 0.04, 0.08, wood, yaw, y + 0.04); k.sphere(x, y + 0.1, z, 0.04, 0x7fae6a); }],
  ],
};

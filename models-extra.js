// Additional policy miniatures (second visual pass). Symbolic, not architectural designs or locations.
// Each function receives the local helper set from scene-models.js and draws in unit space (~[-0.5,0.5] footprint).
export function extraModel(kind, h) {
  const { b, hb, cy, sphere, ring, p, glow, bulb, seat, person, plant, C, glass, wood, green } = h;
  const teal = 0x3e7c8c,
    teal2 = 0x5f9aa6,
    warm = 0xe9dcc4,
    stone = 0xd2c3ad,
    yel = 0xe8c547;
  switch (kind) {
    // ---------------- 系務核心 ----------------
    case "cityhall": {
      // wide, symmetric two-storey civic office with glass curtain wall and rooftop garden
      b([0, 0.05, 0.02], [1.08, 0.1, 0.66], stone); // podium
      for (const s of [-1, 1]) b([s * 0.33, 0.32, -0.02], [0.4, 0.44, 0.5], warm); // wings
      b([0, 0.36, 0.0], [0.3, 0.52, 0.54], 0xf1e6d3); // centre block
      // glass curtain on wings (front) with mullions
      for (const s of [-1, 1]) {
        glow([s * 0.33, 0.33, 0.235], [0.34, 0.34, 0.012], 0x9fc4c6);
        for (let k = 0; k < 4; k++) hb([s * 0.33 - 0.15 + k * 0.1, 0.33, 0.243], [0.01, 0.34, 0.01], 0x6f6a62);
        hb([s * 0.33, 0.33, 0.243], [0.34, 0.01, 0.01], 0x6f6a62);
      }
      // entrance canopy & columns
      b([0, 0.27, 0.31], [0.34, 0.03, 0.14], C.coral);
      for (const s of [-0.12, -0.04, 0.04, 0.12]) cy([s, 0.17, 0.35], 0.03, 0.2, 0xf6efe3);
      glow([0, 0.15, 0.275], [0.12, 0.17, 0.01], 0xb8d3d1);
      // roof slab, rooftop garden
      for (const s of [-1, 1]) {
        b([s * 0.33, 0.56, -0.02], [0.43, 0.04, 0.53], 0xcfbfa6);
        for (let k = 0; k < 3; k++) plant(s * 0.33 - 0.12 + k * 0.12, -0.05 + (k % 2) * 0.1, 0.16);
      }
      b([0, 0.64, 0.0], [0.33, 0.04, 0.57], 0xcfbfa6);
      // flagless roof sign band
      b([0, 0.68, 0.24], [0.26, 0.06, 0.03], C.ink);
      glow([0, 0.68, 0.258], [0.2, 0.025, 0.006], 0xfcea8b);
      // bike racks and planters in front of podium
      for (let k = 0; k < 4; k++) ring([-0.42 + k * 0.06, 0.13, 0.4], 0.07, C.ink, [0, 0, 0]);
      for (const s of [-1, 1]) {
        b([s * 0.28, 0.13, 0.42], [0.12, 0.06, 0.06], 0xb79a7b);
        sphere([s * 0.28, 0.18, 0.42], [0.12, 0.08, 0.06], green);
      }
      return true;
    }
    case "clocktower": {
      b([0, 0.04, 0], [0.5, 0.08, 0.5], stone);
      b([0, 0.6, 0], [0.22, 1.1, 0.22], 0xf1e6d3);
      for (const s of [-1, 1]) hb([s * 0.112, 0.6, 0], [0.012, 1.1, 0.23], C.coral);
      b([0, 1.2, 0], [0.28, 0.1, 0.28], C.coral);
      for (const [dx, dz, ry] of [[0, 0.112, 0]]) {
        p("cylinder", [dx, 0.98, dz], [0.17, 0.02, 0.17], 0xfcea8b, [Math.PI / 2, ry, 0]);
        hb([dx * 1.08, 1.01, dz * 1.08], [0.012, 0.07, 0.012], C.ink);
        hb([dx * 1.08 + (ry ? 0 : 0.02), 0.98, dz * 1.08 + (ry ? 0.02 : 0)], ry ? [0.012, 0.012, 0.05] : [0.05, 0.012, 0.012], C.ink);
      }
      p("cone", [0, 1.38, 0], [0.24, 0.26, 0.24], 0xa34e34);
      bulb([0, 1.53, 0], 0.04);
      // benches with coffee cups around the plaza base
      for (const s of [-1, 1]) {
        b([s * 0.34, 0.08, 0.1], [0.08, 0.04, 0.26], wood);
        b([s * 0.34, 0.04, 0.1], [0.06, 0.06, 0.22], C.ink);
      }
      return true;
    }
    case "kiosk": {
      // EAP point kiosk — vending style booth
      b([0, 0.28, -0.05], [0.42, 0.56, 0.32], 0x7aa58f);
      glow([0, 0.36, 0.115], [0.3, 0.22, 0.01], 0xd8f0e2);
      for (let k = 0; k < 3; k++) sphere([-0.09 + k * 0.09, 0.36, 0.125], [0.05, 0.05, 0.01], [C.coral, 0xfcea8b, 0xffffff][k]);
      b([0, 0.13, 0.12], [0.3, 0.06, 0.02], C.ink);
      b([0, 0.6, -0.05], [0.46, 0.05, 0.36], C.ink);
      seat(0.28, 0.25);
      plant(-0.3, 0.25, 0.3);
      return true;
    }
    case "podium": {
      cy([0, 0.05, 0], 0.7, 0.1, stone);
      for (const [x, h] of [
        [-0.2, 0.12],
        [0, 0.2],
        [0.2, 0.08],
      ])
        b([x, 0.1 + h / 2, -0.05], [0.18, h, 0.18], x === 0 ? C.coral : 0xe8d5bb);
      cy([0, 0.38, -0.05], 0.025, 0.16, 0xcaa24a);
      p("cone", [0, 0.5, -0.05], [0.14, 0.12, 0.14], 0xe8c547, [Math.PI, 0, 0]);
      sphere([0, 0.56, -0.05], 0.05, 0xe8c547);
      for (const s of [-1, 1]) {
        cy([s * 0.3, 0.2, 0.2], 0.02, 0.4, C.ink);
        sphere([s * 0.3, 0.42, 0.2], 0.06, 0xfcea8b);
      }
      return true;
    }
    case "clinicpod": {
      b([0, 0.22, -0.06], [0.56, 0.44, 0.36], 0xf6f1ea);
      b([0, 0.46, -0.06], [0.6, 0.05, 0.4], 0x8fb3ad);
      glow([-0.13, 0.25, 0.125], [0.16, 0.16, 0.01], 0xcfe6e6);
      b([0.15, 0.16, 0.125], [0.12, 0.3, 0.01], 0x8fb3ad);
      b([0.15, 0.34, 0.13], [0.1, 0.03, 0.012], C.coral);
      b([0.15, 0.34, 0.13], [0.03, 0.1, 0.012], C.coral);
      seat(-0.28, 0.26);
      return true;
    }
    case "aipod": {
      // rounded work capsule with antenna and status light (no desk)
      p("rbox", [0, 0.24, -0.04], [0.5, 0.4, 0.38], 0x2f3a46);
      glow([0, 0.26, 0.152], [0.38, 0.2, 0.01], 0x9fd8e6);
      for (let k = 0; k < 4; k++) hb([-0.13 + k * 0.087, 0.26, 0.16], [0.006, 0.18, 0.006], 0x2f3a46);
      cy([0.16, 0.5, -0.1], 0.02, 0.14, C.ink);
      bulb([0.16, 0.58, -0.1], 0.05, 0x9fffd0);
      sphere([-0.12, 0.47, -0.08], [0.14, 0.06, 0.14], 0x58c4dd);
      for (const s of [-1, 1]) cy([s * 0.2, 0.03, 0.1], 0.06, 0.06, 0x58585f);
      return true;
    }
    // ---------------- 研究與教學資源 ----------------
    case "researchdome": {
      // long-term planning research: glass dome over a city sand-table, researchers round a table
      b([0, 0.05, 0], [0.98, 0.1, 0.84], 0xe8e6df);
      cy([-0.1, 0.18, 0.02], 0.7, 0.18, 0xf7f6f2);
      p("dome", [-0.1, 0.27, 0.02], [0.68, 0.62, 0.68], 0xbfe0e2);
      for (let k = 0; k < 4; k++) ring([-0.1, 0.27, 0.02], 0.34, 0xffffff, [0, (k * Math.PI) / 4, 0]);
      for (let k = 0; k < 9; k++) b([-0.25 + (k % 3) * 0.1, 0.3 + (k % 2) * 0.02, -0.08 + Math.floor(k / 3) * 0.1], [0.06, 0.05 + (k % 3) * 0.04, 0.06], [teal, 0xf2e6d2, C.coral][k % 3]);
      // outdoor sand-table with a tiny hex city and researchers around it
      b([0.24, 0.12, 0.3], [0.34, 0.04, 0.24], wood);
      b([0.24, 0.145, 0.3], [0.3, 0.01, 0.2], 0xd8c39a);
      for (let k = 0; k < 6; k++) p("cylinder", [0.14 + (k % 3) * 0.1, 0.17, 0.25 + Math.floor(k / 3) * 0.1], [0.08, 0.03 + (k % 2) * 0.04, 0.08], [teal, C.coral, 0xe8c547][k % 3]);
      // giant magnifying glass over the sand-table city = research
      ring([0.24, 0.42, 0.3], 0.2, C.ink, [0, 0, 0]);
      p("dome", [0.24, 0.42, 0.3], [0.17, 0.17, 0.03], 0xcfe8ee, [Math.PI / 2, 0, 0]);
      p("box", [0.38, 0.27, 0.3], [0.04, 0.18, 0.04], C.ink, [0, 0, 0.7]);
      person(0.06, 0.4, 0.34);
      person(0.44, 0.36, 0.34);
      person(0.42, 0.14, 0.34);
      // observatory tower
      b([0.36, 0.45, -0.24], [0.16, 0.9, 0.16], 0xffffff);
      for (let k = 0; k < 5; k++) hb([0.36, 0.12 + k * 0.17, -0.157], [0.12, 0.012, 0.01], teal);
      cy([0.36, 0.93, -0.24], 0.2, 0.05, teal);
      p("dome", [0.36, 0.95, -0.24], [0.16, 0.14, 0.16], 0xe6eef0);
      bulb([0.36, 1.08, -0.24], 0.03, 0xff9f8a);
      b([-0.1, 0.13, 0.4], [0.24, 0.16, 0.06], teal);
      glow([-0.1, 0.12, 0.433], [0.14, 0.11, 0.006], 0xd5ecee);
      return true;
    }
    case "childcenter": {
      // child-safety governance centre: shield emblem, three data pipes (education / welfare / police)
      // flowing into a control screen, a raised crossing with a child holding an adult's hand at the door
      b([0.1, 0.22, -0.16], [0.56, 0.42, 0.34], 0xf7f6f2);
      b([0.1, 0.45, -0.16], [0.6, 0.04, 0.38], teal);
      // big shield on the facade
      p("rbox", [0.1, 0.3, 0.02], [0.2, 0.2, 0.03], 0x4a6fa5);
      p("tetra", [0.1, 0.17, 0.02], [0.2, 0.1, 0.03], 0x4a6fa5, [Math.PI, Math.PI / 4, 0]);
      // child pictogram on the shield (not a medical cross)
      sphere([0.1, 0.355, 0.042], 0.035, 0xffffff);
      p("rbox", [0.1, 0.29, 0.042], [0.05, 0.07, 0.01], 0xffffff);
      // small rooftop shield emblem, visible from above
      p("rbox", [0.1, 0.55, -0.16], [0.16, 0.16, 0.03], 0x4a6fa5, [0, 0, Math.PI / 4]);
      sphere([0.1, 0.57, -0.14], 0.03, 0xffffff);
      // control screen on roof edge + three pipes in brand colours
      glow([-0.08, 0.6, -0.16], [0.26, 0.14, 0.02], 0x9fe3e6);
      b([-0.08, 0.6, -0.175], [0.3, 0.18, 0.02], C.ink);
      const pipes = [
        [-0.42, 0.22, 0xe8c547], // education (book yellow)
        [-0.42, 0.02, 0xd76b8a], // welfare (heart pink)
        [-0.42, -0.18, 0x4a6fa5], // police (blue)
      ];
      for (const [x, zz, c] of pipes) {
        p("rbox", [x, 0.12, zz], [0.12, 0.24, 0.12], c);
        p("rbox", [x, 0.27, zz], [0.08, 0.04, 0.08], 0xffffff);
        // pipe rising to the screen
        cy([x, 0.36, zz], 0.035, 0.24, c);
        p("cylinder", [(x - 0.08) / 2, 0.48, (zz - 0.16) / 2], [0.035, Math.hypot(x + 0.08, zz + 0.16), 0.035], c, [Math.PI / 2, 0, Math.atan2(x + 0.08, -(zz + 0.16))]);
      }
      // freestanding guardian shield monument in the forecourt: big blue shield, white child silhouette, three
      // coloured rings (education / welfare / police) — reads as "protecting children" from any angle
      b([0.34, 0.05, 0.3], [0.26, 0.1, 0.2], 0xe9e4da);
      p("rbox", [0.34, 0.47, 0.3], [0.44, 0.44, 0.06], 0x3f63a8);
      p("tetra", [0.34, 0.2, 0.3], [0.44, 0.24, 0.06], 0x3f63a8, [Math.PI, Math.PI / 4, 0]);
      p("rbox", [0.34, 0.47, 0.3], [0.37, 0.37, 0.062], 0x5b80c4);
      // adult + child holding hands, in white, on the shield
      sphere([0.29, 0.6, 0.335], 0.05, 0xffffff);
      p("rbox", [0.29, 0.47, 0.335], [0.07, 0.17, 0.012], 0xffffff);
      sphere([0.4, 0.53, 0.335], 0.04, 0xffffff);
      p("rbox", [0.4, 0.43, 0.335], [0.055, 0.12, 0.012], 0xffffff);
      p("rbox", [0.345, 0.45, 0.335], [0.07, 0.015, 0.012], 0xffffff);
      for (const [dx, c] of [[-0.12, 0xe8c547], [0, 0xd76b8a], [0.12, 0x4a6fa5]]) ring([0.34 + dx, 0.8, 0.3], 0.09, c, [0, 0, 0]);
      // raised zebra crossing at the door with child + adult
      for (let k = 0; k < 5; k++) hb([0.1 - 0.16 + k * 0.08, 0.025, 0.3], [0.05, 0.012, 0.18], k % 2 ? 0xffffff : 0xe8e2d6);
      person(-0.02, 0.32, 0.26);
      person(0.15, 0.32, 0.38);
      return true;
    }
    case "rampcenter": {
      // accessible-city design centre: building with a long switchback ramp, a wheelchair user,
      // tactile paving and a city blueprint on an easel
      b([0.16, 0.22, -0.16], [0.46, 0.44, 0.34], 0xf2efe8);
      b([0.16, 0.46, -0.16], [0.5, 0.04, 0.38], teal2);
      glow([0.16, 0.16, 0.016], [0.16, 0.22, 0.006], 0xd5ecee);
      // big accessibility sign on a pole: white wheelchair figure on blue
      cy([0.42, 0.3, 0.32], 0.02, 0.6, C.ink);
      p("rbox", [0.42, 0.72, 0.32], [0.3, 0.3, 0.03], 0x2f5fb0);
      {
        // International Symbol of Access, drawn flat on the board face: head, back, arm, seat, shin + foot, wheel
        const W = 0xffffff, cx = 0.42, cy0 = 0.72, z = 0.339;
        const bar = (u, v, w, h, rz = 0) => p("box", [cx + u, cy0 + v, z], [w, h, 0.006], W, [0, 0, rz]);
        sphere([cx - 0.03, cy0 + 0.098, z], [0.046, 0.046, 0.008], W); // head
        bar(-0.038, 0.03, 0.026, 0.08, -0.12); // back
        bar(0.005, 0.035, 0.07, 0.02); // arm reaching forward
        bar(0.006, -0.012, 0.09, 0.024); // seat / thigh
        bar(0.052, -0.046, 0.024, 0.07, 0.25); // shin
        bar(0.078, -0.078, 0.046, 0.02); // foot
        ring([cx - 0.035, cy0 - 0.045, z], 0.122, W, [0, 0, 0]); // wheel (two rings = a bolder stroke)
        ring([cx - 0.035, cy0 - 0.045, z], 0.106, W, [0, 0, 0]);
      }
      // switchback ramp to the door
      p("box", [-0.14, 0.06, 0.14], [0.46, 0.025, 0.14], 0xd8d2c6, [0, 0, -0.14]);
      p("box", [-0.14, 0.075, 0.14], [0.46, 0.006, 0.03], 0xe8c547, [0, 0, -0.14]);
      for (const s of [-1, 1]) p("box", [-0.14, 0.15, 0.14 + s * 0.07], [0.46, 0.012, 0.012], C.ink, [0, 0, -0.14]);
      b([0.12, 0.09, 0.1], [0.14, 0.04, 0.16], 0xd8d2c6);
      // wheelchair user on the ramp
      ring([-0.24, 0.13, 0.17], 0.13, C.ink, [0, 0, 0]);
      ring([-0.24, 0.13, 0.11], 0.13, C.ink, [0, 0, 0]);
      b([-0.24, 0.17, 0.14], [0.1, 0.03, 0.08], C.coral);
      person(-0.24, 0.14, 0.3);
      // blueprint easel
      for (const s of [-1, 1]) cy([-0.36 + s * 0.06, 0.16, -0.24], 0.012, 0.32, wood);
      b([-0.36, 0.3, -0.23], [0.2, 0.15, 0.01], 0x2e5f99);
      for (let k = 0; k < 3; k++) hb([-0.36, 0.26 + k * 0.035, -0.224], [0.15, 0.005, 0.004], 0xcfe6ff);
      return true;
    }
    case "loopgarden": {
      // dementia-friendly centre: warm-lit cottage, a looping garden walk with rest benches,
      // an elder walking with a companion, and tall wayfinding posts in distinct colours
      b([-0.2, 0.17, -0.22], [0.42, 0.34, 0.28], 0xfbf3e6);
      p("prism", [-0.2, 0.42, -0.22], [0.46, 0.3, 0.32], C.coral, [0, 0, Math.PI / 2]);
      for (const s of [-1, 1]) glow([-0.2 + s * 0.11, 0.18, -0.077], [0.1, 0.1, 0.006], 0xffd38a);
      ring([0.14, 0.02, 0.14], 0.56, 0xd9cbb4, [Math.PI / 2, 0, 0]);
      ring([0.14, 0.02, 0.14], 0.46, 0xd9cbb4, [Math.PI / 2, 0, 0]);
      cy([0.14, 0.022, 0.14], 0.38, 0.03, 0xa9bf8e);
      plant(0.14, 0.14, 0.3);
      for (let k = 0; k < 6; k++) {
        const a = (k / 6) * Math.PI * 2;
        sphere([0.14 + Math.cos(a) * 0.33, 0.06, 0.14 + Math.sin(a) * 0.33], 0.06, [0xf2b5c6, 0xfcea8b, 0xd9c6f0][k % 3]);
      }
      // wayfinding posts (colour = place)
      for (const [x, zz, c] of [[0.42, -0.12, 0xe8c547], [-0.12, 0.42, 0x5f9aa6], [0.44, 0.38, C.coral]]) {
        cy([x, 0.16, zz], 0.025, 0.32, C.ink);
        sphere([x, 0.34, zz], 0.06, c);
      }
      b([0.4, 0.06, 0.12], [0.16, 0.035, 0.06], wood);
      // forget-me-not sculpture: five blue-violet petals around a yellow heart, on a stem
      cy([-0.36, 0.25, 0.34], 0.025, 0.5, 0x6f8a62);
      for (let k = 0; k < 5; k++) {
        const a = (k / 5) * Math.PI * 2;
        sphere([-0.36 + Math.cos(a) * 0.1, 0.56 + Math.sin(a) * 0.1, 0.36], [0.085, 0.085, 0.035], 0x7f8fe0);
      }
      sphere([-0.36, 0.56, 0.38], 0.05, 0xf2c94c);
      // elder + companion walking together
      person(-0.06, 0.38, 0.36);
      person(0.11, 0.4, 0.38);
      cy([-0.14, 0.1, 0.38], 0.01, 0.2, 0x8a6a4e);
      return true;
    }
    // ---------------- 青年 ----------------
    case "containers": {
      const cols = [0xe8b04a, C.coral, 0x3e7c8c, 0xe7a383, 0xd9c3a0];
      const stack = [
        [-0.2, 0, 0.1, 0],
        [0.2, 0, -0.1, 1],
        [-0.05, 1, -0.05, 2],
        [0.25, 1, 0.12, 3],
        [-0.15, 2, 0.02, 4],
      ];
      for (const [x, lvl, zz, ci] of stack) {
        const y = 0.12 + lvl * 0.24;
        b([x, y, zz], [0.42, 0.22, 0.24], cols[ci], [0, lvl % 2 ? 0.25 : -0.1, 0]);
        for (let k = 0; k < 6; k++) hb([x - 0.17 + k * 0.068, y, zz + 0.123], [0.01, 0.2, 0.006], 0x000000);
        glow([x + 0.08, y + 0.01, zz + 0.125], [0.12, 0.1, 0.006], 0xfff1c8);
      }
      // external stairs & neon sign
      for (let k = 0; k < 5; k++) hb([0.46, 0.05 + k * 0.05, 0.3 - k * 0.05], [0.12, 0.02, 0.05], C.ink);
      glow([-0.15, 0.78, 0.15], [0.26, 0.06, 0.01], 0xffc48a);
      // laptop bar under awning
      b([-0.32, 0.14, 0.38], [0.36, 0.04, 0.1], wood);
      for (let k = 0; k < 3; k++) {
        hb([-0.44 + k * 0.12, 0.17, 0.37], [0.07, 0.006, 0.05], 0x58585f);
        glow([-0.44 + k * 0.12, 0.2, 0.35], [0.07, 0.05, 0.004], 0x9fd8e6);
      }
      return true;
    }
    case "jars": {
      b([0, 0.05, 0], [0.7, 0.1, 0.4], 0x58a6a6);
      for (const s of [-1, 1]) {
        p("cylinder", [s * 0.17, 0.32, 0], [0.24, 0.4, 0.24], 0xd8eef0);
        p("cylinder", [s * 0.17, 0.54, 0], [0.18, 0.05, 0.18], C.ink);
        for (let k = 0; k < (s < 0 ? 4 : 4); k++) cy([s * 0.17, 0.14 + k * 0.045, 0], 0.16, 0.035, 0xe8c547);
      }
      // "+" between jars (matching, no amounts)
      b([0, 0.34, 0.06], [0.1, 0.025, 0.02], C.coral);
      b([0, 0.34, 0.06], [0.025, 0.1, 0.02], C.coral);
      return true;
    }
    case "stage": {
      b([0, 0.07, -0.1], [0.9, 0.14, 0.5], 0x3a3540);
      b([0, 0.145, -0.1], [0.86, 0.01, 0.46], 0xc9a97f);
      // truss + lights
      for (const s of [-1, 1]) hb([s * 0.43, 0.42, -0.3], [0.03, 0.56, 0.03], 0x58585f);
      hb([0, 0.7, -0.3], [0.9, 0.03, 0.03], 0x58585f);
      for (let k = 0; k < 5; k++) bulb([-0.32 + k * 0.16, 0.66, -0.27], 0.04, [0xffd28a, 0xff9fc8, 0x9fd8e6][k % 3]);
      glow([0, 0.4, -0.34], [0.6, 0.3, 0.01], 0xe8c547);
      // paper plane launch ramp pointing outward
      p("box", [0.32, 0.22, 0.28], [0.36, 0.03, 0.12], C.coral, [0, -0.5, 0.35]);
      for (let k = 0; k < 3; k++) p("tetra", [0.42 + k * 0.1, 0.36 + k * 0.08, 0.2 - k * 0.07], [0.08, 0.02, 0.12], 0xffffff, [Math.PI / 2, 0.6, 0]);
      // audience
      for (let k = 0; k < 4; k++) person(-0.3 + k * 0.17, 0.28, 0.3);
      return true;
    }
    // ---------------- 城市外交 ----------------
    case "infinityforum": {
      // a coral ∞ walkway (lemniscate) with a round canopy where the loops cross
      const A = 0.62;
      const pt = (t) => {
        const d = 1 + Math.sin(t) ** 2;
        return [(A * Math.cos(t)) / d, (A * Math.sin(t) * Math.cos(t)) / d];
      };
      for (let k = 0; k < 44; k++) {
        const t0 = (k / 44) * Math.PI * 2,
          t1 = ((k + 1) / 44) * Math.PI * 2;
        const [x0, z0] = pt(t0),
          [x1, z1] = pt(t1);
        const len = Math.hypot(x1 - x0, z1 - z0);
        hb([(x0 + x1) / 2, 0.025, (z0 + z1) / 2 + 0.05], [0.09, 0.02, len + 0.012], k % 2 ? C.coral : 0xe98a66, [0, Math.atan2(x1 - x0, z1 - z0), 0]);
      }
      for (const s of [-1, 1]) {
        cy([s * 0.4, 0.02, 0.05], 0.3, 0.02, 0xa9bf8e);
        plant(s * 0.4, 0.05, 0.22);
      }
      for (let k = 0; k < 5; k++) {
        const a = (k / 5) * Math.PI * 2;
        cy([Math.cos(a) * 0.12, 0.17, 0.05 + Math.sin(a) * 0.12], 0.016, 0.3, 0xffffff);
      }
      p("dome", [0, 0.32, 0.05], [0.36, 0.1, 0.36], 0xf3eadb);
      ring([0, 0.32, 0.05], 0.18, C.coral, [Math.PI / 2, 0, 0]);
      cy([0, 0.1, 0.05], 0.13, 0.02, wood);
      for (let k = 0; k < 4; k++) {
        const a = (k / 4) * Math.PI * 2 + 0.4;
        b([Math.cos(a) * 0.1, 0.06, 0.05 + Math.sin(a) * 0.1], [0.05, 0.05, 0.05], C.coral);
      }
      return true;
    }
    case "terminal": {
      // departures / arrivals hall with a two-way canopy
      b([0, 0.2, -0.16], [0.7, 0.4, 0.26], 0xf2efe8);
      p("box", [0, 0.44, -0.12], [0.8, 0.04, 0.4], 0x5f9aa6, [0.12, 0, 0]);
      glow([-0.17, 0.2, -0.025], [0.18, 0.26, 0.008], 0xd5ecee);
      glow([0.17, 0.2, -0.025], [0.18, 0.26, 0.008], 0xd5ecee);
      // big arrows on the canopy edge: out (coral) / back (teal)
      p("tetra", [-0.2, 0.52, 0.08], [0.1, 0.12, 0.02], C.coral, [Math.PI / 2, 0, Math.PI / 2]);
      hb([-0.27, 0.52, 0.08], [0.1, 0.02, 0.04], C.coral);
      p("tetra", [0.2, 0.52, 0.08], [0.1, 0.12, 0.02], 0x3e7c8c, [Math.PI / 2, 0, -Math.PI / 2]);
      hb([0.27, 0.52, 0.08], [0.1, 0.02, 0.04], 0x3e7c8c);
      // floor guide lines out / in
      for (let k = 0; k < 4; k++) {
        hb([-0.17, 0.006, 0.08 + k * 0.08], [0.04, 0.004, 0.05], C.coral);
        hb([0.17, 0.006, 0.08 + k * 0.08], [0.04, 0.004, 0.05], 0x3e7c8c);
      }
      // luggage cart
      hb([0.36, 0.06, 0.3], [0.16, 0.02, 0.1], 0x58585f);
      for (let k = 0; k < 3; k++) p("rbox", [0.31 + k * 0.05, 0.11 + (k % 2) * 0.03, 0.3], [0.045, 0.1 + (k % 2) * 0.05, 0.08], [C.coral, 0x3e7c8c, 0xe8c547][k]);
      return true;
    }
    case "democrossing": {
      // raised crosswalk, refuge island, tightened corner (per transport policy toolkit)
      hb([0, 0.02, 0], [0.9, 0.04, 0.44], 0x6a6560);
      p("box", [0, 0.055, 0], [0.26, 0.04, 0.44], 0xd9c3a3);
      for (let k = 0; k < 6; k++) hb([0, 0.078, -0.18 + k * 0.072], [0.24, 0.006, 0.036], 0xffffff);
      b([-0.36, 0.06, 0], [0.12, 0.06, 0.1], 0xa9bf8e);
      for (const s of [-1, 1]) {
        cy([s * 0.18, 0.06, 0.28], 0.18, 0.08, 0xd2c3ad);
        cy([s * 0.32, 0.18, 0.28], 0.02, 0.28, C.ink);
        p("rbox", [s * 0.32, 0.34, 0.28], [0.08, 0.08, 0.015], 0xe8c547);
      }
      // signpost with names only
      cy([0.4, 0.25, -0.26], 0.02, 0.5, C.ink);
      p("rbox", [0.4, 0.45, -0.24], [0.18, 0.05, 0.015], 0xffffff, [0, 0.3, 0]);
      p("rbox", [0.4, 0.37, -0.24], [0.18, 0.05, 0.015], 0xffffff, [0, -0.4, 0]);
      return true;
    }
    case "blueprint": {
      b([0, 0.12, 0], [0.56, 0.06, 0.4], wood);
      for (const s of [-1, 1]) for (const t of [-1, 1]) hb([s * 0.24, 0.05, t * 0.16], [0.03, 0.1, 0.03], C.ink);
      p("box", [-0.05, 0.16, 0.0], [0.44, 0.01, 0.32], 0x4a6fa5, [0, 0.05, 0]);
      for (let k = 0; k < 4; k++) hb([-0.2 + k * 0.1, 0.168, 0.0], [0.006, 0.002, 0.28], 0xd5e4f5);
      // miniature institute model on the table
      p("dome", [0.17, 0.165, -0.08], [0.12, 0.1, 0.12], 0xbfe0e2);
      hb([0.24, 0.22, -0.13], [0.03, 0.12, 0.03], 0xffffff);
      cy([-0.2, 0.2, 0.12], 0.035, 0.08, 0xd5e4f5);
      return true;
    }
    case "arrivals": {
      b([0, 0.04, 0], [0.7, 0.08, 0.5], 0xe9dcc4);
      // icon-only board
      for (const s of [-1, 1]) hb([s * 0.22, 0.28, -0.16], [0.03, 0.48, 0.03], C.ink);
      p("rbox", [0, 0.4, -0.16], [0.5, 0.26, 0.03], 0x2f3a46);
      const ic = [C.coral, 0xe8c547, 0x58a6a6, 0x9fd8e6, 0xf2a1a1, 0xffffff];
      for (let k = 0; k < 6; k++) glow([-0.15 + (k % 3) * 0.15, 0.45 - Math.floor(k / 3) * 0.1, -0.142], [0.08, 0.06, 0.004], ic[k]);
      // bench + suitcases
      b([0, 0.12, 0.15], [0.4, 0.04, 0.1], wood);
      for (let k = 0; k < 2; k++) p("rbox", [-0.25 + k * 0.5, 0.12, 0.2], [0.07, 0.15, 0.11], [0x3e7c8c, C.coral][k]);
      return true;
    }
    // ---------------- misc replacements ----------------
    case "workplace": {
      b([0, 0.26, -0.08], [0.6, 0.5, 0.4], 0xf2ebe0);
      b([0, 0.53, -0.08], [0.66, 0.05, 0.46], 0x7aa58f);
      for (let k = 0; k < 3; k++) glow([-0.18 + k * 0.18, 0.32, 0.125], [0.12, 0.14, 0.008], 0xd8ecea);
      b([0, 0.1, 0.13], [0.14, 0.2, 0.01], 0x7aa58f);
      plant(-0.32, 0.24, 0.3);
      seat(0.3, 0.26);
      return true;
    }
    case "rideboard": {
      // riverside bike lane with a quarterly score board (5 bars, no numbers)
      b([0, 0.03, 0.1], [0.9, 0.03, 0.26], 0x8a9a8a);
      for (let k = 0; k < 6; k++) hb([-0.4 + k * 0.16, 0.05, 0.1], [0.08, 0.004, 0.015], 0xffffff);
      for (let k = 0; k < 3; k++) { cy([-0.35 + k * 0.35, 0.18, -0.06], 0.015, 0.3, C.ink); bulb([-0.35 + k * 0.35, 0.34, -0.06], 0.025, 0xfff0c2); }
      b([0.2, 0.32, -0.28], [0.44, 0.28, 0.03], C.ink);
      for (let k = 0; k < 5; k++) b([0.04 + k * 0.08, 0.24 + (0.05 + (k % 3) * 0.03) / 2, -0.262], [0.05, 0.05 + (k % 3) * 0.03, 0.01], [0x8fb37a, 0xe8c547, C.coral, 0x5f9aa6, 0x8fb37a][k]);
      for (const s of [-1, 1]) cy([0.2 + s * 0.18, 0.1, -0.28], 0.015, 0.2, C.ink);
      ring([-0.2, 0.1, 0.1], 0.1, C.ink, [0, 0, 0]);
      ring([-0.06, 0.1, 0.1], 0.1, C.ink, [0, 0, 0]);
      b([-0.13, 0.15, 0.1], [0.14, 0.012, 0.012], C.coral);
      return true;
    }
    case "lawbook": {
      // a big open law book with a meal tray on it
      b([-0.12, 0.08, 0], [0.34, 0.06, 0.46], 0x8b4a3a, [0, 0, 0.08]);
      b([0.12, 0.08, 0], [0.34, 0.06, 0.46], 0x8b4a3a, [0, 0, -0.08]);
      b([-0.12, 0.12, 0], [0.31, 0.03, 0.42], 0xfbf6ea, [0, 0, 0.08]);
      b([0.12, 0.12, 0], [0.31, 0.03, 0.42], 0xfbf6ea, [0, 0, -0.08]);
      for (let k = 0; k < 4; k++) hb([-0.12, 0.14, -0.14 + k * 0.08], [0.22, 0.004, 0.012], 0x9a8a7a);
      b([0.12, 0.17, 0], [0.24, 0.02, 0.18], 0xe7eef0);
      sphere([0.06, 0.2, -0.03], [0.07, 0.04, 0.07], 0xf6e3a8);
      sphere([0.18, 0.2, -0.03], [0.06, 0.04, 0.06], green);
      sphere([0.12, 0.2, 0.05], [0.08, 0.04, 0.05], 0xd9824f);
      return true;
    }
    case "stairlift": {
      // stair with a stair-lift chair on a rail + a wheelchair at the bottom
      for (let k = 0; k < 5; k++) b([-0.25 + k * 0.1, 0.04 + k * 0.05, 0], [0.1, 0.08 + k * 0.1, 0.36], 0xe6dccb);
      p("box", [-0.03, 0.27, -0.2], [0.6, 0.02, 0.02], 0x8a8a90, [0, 0, 0.45]);
      b([-0.08, 0.3, -0.12], [0.12, 0.03, 0.12], C.coral);
      b([-0.12, 0.37, -0.12], [0.03, 0.14, 0.12], C.coral);
      person(-0.08, -0.12, 0.3);
      ring([-0.42, 0.11, 0.2], 0.12, C.ink, [0, 0, 0]);
      ring([-0.42, 0.11, 0.08], 0.12, C.ink, [0, 0, 0]);
      b([-0.42, 0.15, 0.14], [0.1, 0.03, 0.1], 0x3f6fb5);
      p("rbox", [0.3, 0.42, 0.2], [0.1, 0.1, 0.01], 0x3f6fb5);
      return true;
    }
    case "accessgym": {
      // sports hall with ramp entrance, all-gender changing room doors
      b([0.08, 0.2, -0.12], [0.6, 0.4, 0.36], 0xf3efe6);
      p("dome", [0.08, 0.4, -0.12], [0.6, 0.18, 0.36], 0x5f9aa6);
      for (const [x, c] of [[-0.06, 0x4a6fa5], [0.08, 0xd76b8a], [0.22, 0x8fb37a]]) { b([x, 0.13, 0.065], [0.1, 0.22, 0.01], c); sphere([x, 0.29, 0.07], 0.03, 0xffffff); }
      p("box", [-0.3, 0.05, 0.22], [0.4, 0.02, 0.14], 0xd8d2c6, [0, 0, -0.12]);
      ring([-0.38, 0.1, 0.28], 0.1, C.ink, [0, 0, 0]);
      person(-0.38, 0.22, 0.3);
      p("rbox", [-0.3, 0.32, 0.06], [0.1, 0.1, 0.01], 0x3f6fb5);
      return true;
    }
    // ---------------- 三大登山觀光中心（三種不同造型；共用服務：裝備租借、置物櫃、洗鞋、步道看板） ----------------
    case "hikeNorth": {
      // 北劍潭：A 字形木屋登山站、松林、步道入口拱門、夜間燈籠串（連結夜市的意象）
      for (const s of [-1, 1]) p("box", [-0.02 + s * 0.13, 0.25, -0.05], [0.04, 0.56, 0.46], C.coral, [0, 0, s * -0.5]);
      b([-0.02, 0.12, -0.05], [0.3, 0.22, 0.44], 0xc49a6c);
      b([-0.02, 0.17, 0.18], [0.24, 0.3, 0.01], 0xb48560);
      glow([-0.02, 0.14, 0.186], [0.12, 0.16, 0.006], 0xfff1c8);
      b([-0.02, 0.3, 0.19], [0.18, 0.05, 0.01], 0xfff8ee);
      b([-0.02, 0.02, 0.27], [0.36, 0.03, 0.14], 0xb48560);
      for (const [tx, tz, ts] of [[-0.38, -0.3, 1], [0.32, -0.32, 1.2], [-0.42, 0.1, 0.8], [0.4, 0.05, 0.9]]) {
        cy([tx, 0.08, tz], 0.03, 0.14, 0x7a5d44);
        p("cone6", [tx, 0.26 * ts, tz], [0.2 * ts, 0.26 * ts, 0.2 * ts], 0x58785f);
        p("cone6", [tx, 0.4 * ts, tz], [0.14 * ts, 0.22 * ts, 0.14 * ts], 0x6f8a62);
      }
      // trail gate + stepping stones heading back into the pines
      for (const sx of [0.22, 0.38]) cy([sx, 0.15, 0.22], 0.022, 0.3, 0x8a6a4e);
      b([0.3, 0.31, 0.22], [0.24, 0.035, 0.04], 0x8a6a4e);
      for (let k = 0; k < 4; k++) p("ico", [0.3 + k * 0.02, 0.02, 0.12 - k * 0.12], [0.08, 0.02, 0.06], 0xd8ccba);
      // lantern string between two poles
      for (const sx of [-0.4, 0.42]) cy([sx, 0.2, 0.42], 0.012, 0.4, C.ink);
      for (let k = 0; k < 7; k++) bulb([-0.4 + k * 0.137, 0.38 - Math.sin((k / 6) * Math.PI) * 0.05, 0.42], 0.025, [0xffb15c, 0xff7a5c, 0xffd37a][k % 3]);
      // gear rack + lockers
      for (let k = 0; k < 3; k++) p("cylinder", [-0.36 + k * 0.025, 0.12, 0.3], [0.008, 0.24, 0.008], [0x3e7c8c, C.coral, 0xe8c547][k], [0.15, 0, 0.08]);
      for (let k = 0; k < 2; k++) b([0.16 + k * 0.07, 0.09, -0.3], [0.06, 0.18, 0.05], 0x5f9aa6);
      return true;
    }
    case "hikeEast": {
      // 東象山：巨石群、木棧階梯登頂、觀景平台望向城市、玻璃立面的現代遊客中心
      b([0.18, 0.12, 0.16], [0.36, 0.22, 0.24], 0xf2efe8);
      glow([0.18, 0.12, 0.282], [0.32, 0.16, 0.006], 0xbfe0e8);
      for (let k = 0; k < 4; k++) hb([0.04 + k * 0.09, 0.12, 0.288], [0.008, 0.18, 0.006], 0x6f6a62);
      b([0.18, 0.245, 0.16], [0.42, 0.03, 0.3], 0x3e7c8c);
      b([0.18, 0.27, 0.3], [0.2, 0.04, 0.01], 0xfff8ee);
      // boulders (rounded, stacked, like a rocky summit)
      for (const [bx, by, bz, bs, c] of [[-0.25, 0.14, -0.2, 0.3, 0xb7a993], [-0.08, 0.22, -0.3, 0.26, 0xa89a84], [-0.36, 0.3, -0.34, 0.22, 0x9c8f7c], [0.1, 0.12, -0.36, 0.2, 0xb7a993], [-0.18, 0.4, -0.38, 0.16, 0xc2b6a2]])
        p("ico", [bx, by, bz], [bs, bs * 0.9, bs * 0.85], c, [bx * 3, bz * 4, 0.2]);
      // timber stair boardwalk up the boulders
      for (let k = 0; k < 7; k++) p("box", [-0.42 + k * 0.04, 0.04 + k * 0.055, 0.2 - k * 0.07], [0.16, 0.022, 0.07], 0xb48560, [0, 0.55, 0]);
      for (let k = 0; k < 4; k++) cy([-0.48 + k * 0.08, 0.1 + k * 0.1, 0.24 - k * 0.14], 0.01, 0.2, 0x8a6a4e);
      // summit view deck with railing, facing the city
      b([-0.2, 0.5, -0.28], [0.26, 0.025, 0.16], 0xb48560);
      for (let k = 0; k < 4; k++) cy([-0.31 + k * 0.075, 0.56, -0.2], 0.008, 0.1, C.ink);
      hb([-0.2, 0.61, -0.2], [0.26, 0.01, 0.01], C.ink);
      // lockers + boot wash
      for (let k = 0; k < 3; k++) b([0.42, 0.09, 0.0 + k * 0.07], [0.05, 0.18, 0.06], [0x5f9aa6, 0x7aa0b0, 0x5f9aa6][k]);
      b([0.36, 0.04, 0.38], [0.14, 0.05, 0.07], 0xd2c3ad);
      b([0.36, 0.065, 0.38], [0.1, 0.01, 0.04], 0x8fc6d0);
      return true;
    }
    case "hikeSouth": {
      // 南貓空：茶園梯田、雙層翹簷茶屋服務站、纜車塔與兩節車廂
      for (let r = 0; r < 4; r++) {
        b([-0.12, 0.03 + r * 0.06, -0.12 - r * 0.08], [0.7 - r * 0.1, 0.06, 0.1], [0xb48c62, 0xa77f58][r % 2]);
        for (let k = 0; k < 5 - r; k++) sphere([-0.4 + r * 0.05 + k * 0.13, 0.08 + r * 0.06, -0.12 - r * 0.08], [0.07, 0.05, 0.05], [0x5f8f4e, 0x6f9a58][k % 2]);
      }
      // tea-house with two-tier upturned eaves
      b([0.2, 0.11, 0.2], [0.32, 0.2, 0.24], 0xf4ebdd);
      glow([0.2, 0.11, 0.322], [0.18, 0.1, 0.006], 0xfff1c8);
      p("cone6", [0.2, 0.25, 0.2], [0.5, 0.1, 0.42], 0x5a4a3e, [0, Math.PI / 6, 0]);
      b([0.2, 0.31, 0.2], [0.18, 0.06, 0.14], 0xf4ebdd);
      p("cone6", [0.2, 0.37, 0.2], [0.3, 0.08, 0.26], 0x5a4a3e, [0, Math.PI / 6, 0]);
      b([0.2, 0.2, 0.33], [0.16, 0.035, 0.01], 0xfff8ee);
      // gondola tower + cable + two cabins
      for (const [tx, tz, h] of [[0.42, -0.3, 0.7], [-0.42, 0.3, 0.45]]) {
        b([tx, h / 2, tz], [0.05, h, 0.05], 0x8a8a90);
        b([tx, h, tz], [0.16, 0.03, 0.05], 0x8a8a90);
      }
      p("box", [0, 0.58, 0], [0.012, 0.012, Math.hypot(0.84, 0.6)], C.ink, [0.2, Math.atan2(0.84, -0.6), 0]);
      for (const [cx2, cz2, cy2, c] of [[0.18, -0.13, 0.55, C.coral], [-0.2, 0.15, 0.46, 0x3e7c8c]]) {
        hb([cx2, cy2 + 0.06, cz2], [0.008, 0.08, 0.008], C.ink);
        b([cx2, cy2, cz2], [0.1, 0.08, 0.08], c);
        glow([cx2, cy2 + 0.01, cz2 + 0.041], [0.07, 0.035, 0.004], 0xd5ecee);
      }
      // gear rack
      for (let k = 0; k < 3; k++) p("cylinder", [0.42 + k * 0.02, 0.12, 0.3], [0.008, 0.24, 0.008], [0x3e7c8c, C.coral, 0xe8c547][k], [0.15, 0, 0.08]);
      return true;
    }
    case "culturecoin": {
      // 文化幣: a big gold token (theatre-mask emblem) standing on a plinth, ringed by the four things it pays for:
      // a little red-curtain theatre, a gallery easel, an indie-bookshop stall and a kids' cinema screen.
      const gold = 0xe8b04a, goldDark = 0xb8862e;
      b([0, 0.04, 0.02], [0.3, 0.08, 0.18], 0xf3e2c6);
      p("cylinder", [0, 0.36, 0.02], [0.44, 0.06, 0.44], gold, [Math.PI / 2, 0, 0]);
      ring([0, 0.36, 0.054], 0.19, goldDark, [0, 0, 0]);
      // theatre mask on the coin face
      sphere([0, 0.37, 0.058], [0.16, 0.18, 0.02], 0xfff8ee);
      sphere([-0.04, 0.4, 0.07], [0.035, 0.022, 0.01], C.ink);
      sphere([0.04, 0.4, 0.07], [0.035, 0.022, 0.01], C.ink);
      p("torus", [0, 0.33, 0.07], [0.05, 0.03, 0.03], C.coral, [0, 0, Math.PI]);
      // stacked coins at the plinth
      for (let k = 0; k < 4; k++) p("cylinder", [0.2, 0.02 + k * 0.022, 0.16], [0.09, 0.02, 0.09], k % 2 ? gold : goldDark);
      for (let k = 0; k < 2; k++) p("cylinder", [-0.2, 0.02 + k * 0.022, 0.18], [0.09, 0.02, 0.09], k % 2 ? gold : goldDark);
      // mini theatre (back left): frame + red curtains + tiny stage
      b([-0.32, 0.04, -0.28], [0.32, 0.08, 0.2], wood);
      for (const sx of [-0.46, -0.18]) b([sx, 0.22, -0.34], [0.04, 0.3, 0.04], C.ink);
      b([-0.32, 0.38, -0.34], [0.34, 0.05, 0.05], C.ink);
      for (const sx of [-0.4, -0.24]) p("box", [sx, 0.225, -0.305], [0.07, 0.25, 0.015], 0xb83a3a);
      // gallery easel with a painting (back right)
      for (const sx of [0.24, 0.38]) cy([sx, 0.16, -0.3], 0.01, 0.32, wood);
      b([0.31, 0.26, -0.29], [0.18, 0.14, 0.012], 0xfff8ee);
      b([0.29, 0.25, -0.282], [0.08, 0.06, 0.004], 0x5f9aa6);
      sphere([0.35, 0.28, -0.282], [0.03, 0.03, 0.004], 0xe8c547);
      // indie bookshop stall (front left) with striped awning
      b([-0.36, 0.08, 0.3], [0.2, 0.12, 0.12], wood);
      for (let k = 0; k < 5; k++) b([-0.44 + k * 0.04, 0.17, 0.3], [0.03, 0.07, 0.08], [C.coral, 0x3e7c8c, 0xe8c547, 0x6f7fb5, 0x8fb37a][k]);
      for (let k = 0; k < 4; k++) p("box", [-0.42 + k * 0.05, 0.27, 0.32], [0.05, 0.012, 0.16], k % 2 ? 0xfff8ee : C.coral, [0.25, 0, 0]);
      // kids' cinema screen (front right) with a film strip
      b([0.36, 0.2, 0.3], [0.2, 0.13, 0.015], C.ink);
      glow([0.36, 0.2, 0.31], [0.17, 0.1, 0.004], 0xd5ecee);
      for (let k = 0; k < 4; k++) hb([0.29 + k * 0.045, 0.1, 0.31], [0.03, 0.02, 0.004], C.ink);
      for (const sx of [0.28, 0.44]) cy([sx, 0.07, 0.3], 0.01, 0.14, C.ink);
      return true;
    }
    // ---------------- 外語跨文化景觀 (2026-10-20) ----------------
    // palette: indigo "blue shirt" cloth, red-brick courtyard, terracotta roof tiles, white tung blossom
    case "bogongcare": {
      // 都會伯公照護站: a small U-shaped courtyard house (伙房) with an elder and a child at a shared table
      const brick = 0xc77b5c, tile = 0x9a4f3a, indigo = 0x3f5a8a, wall = 0xf2e8d8;
      hb([0, 0.012, 0.08], [0.62, 0.024, 0.44], 0xd9b08c); // sun-drying yard
      b([0, 0.15, -0.2], [0.62, 0.3, 0.16], wall);
      for (const s of [-1, 1]) b([s * 0.25, 0.13, 0.02], [0.13, 0.26, 0.3], wall);
      p("hip", [0, 0.36, -0.2], [0.7, 0.13, 0.22], tile);
      for (const s of [-1, 1]) p("hip", [s * 0.25, 0.32, 0.02], [0.18, 0.11, 0.36], tile);
      hb([0, 0.1, -0.115], [0.12, 0.2, 0.01], indigo); // indigo door curtain
      for (const s of [-1, 1]) hb([s * 0.12, 0.17, -0.115], [0.06, 0.06, 0.008], 0xd5ecee);
      hb([0, 0.03, -0.2], [0.64, 0.06, 0.18], brick);
      cy([0, 0.12, 0.12], 0.16, 0.025, wood);
      cy([0, 0.06, 0.12], 0.03, 0.1, C.ink);
      person(-0.1, 0.16, 0.34);
      person(0.1, 0.16, 0.24);
      return true;
    }
    case "sisterschools": {
      // 北市中小學結盟: a city school and a hill-town school joined by a path with a small exchange bus
      const roof2 = 0x9a4f3a;
      b([-0.26, 0.14, -0.08], [0.24, 0.28, 0.2], 0xf6e7a8);
      p("hip", [-0.26, 0.31, -0.08], [0.28, 0.08, 0.24], 0x58a6a6);
      for (let k = 0; k < 2; k++) hb([-0.31 + k * 0.1, 0.17, 0.025], [0.06, 0.06, 0.008], 0xd5ecee);
      b([0.27, 0.12, -0.12], [0.22, 0.24, 0.18], 0xf2e8d8);
      p("hip", [0.27, 0.27, -0.12], [0.26, 0.09, 0.22], roof2);
      hb([0.27, 0.08, -0.025], [0.06, 0.16, 0.008], 0x3f5a8a);
      hb([0, 0.01, 0.16], [0.7, 0.012, 0.1], 0xd9cbb4);
      b([0, 0.06, 0.16], [0.18, 0.09, 0.08], C.yellow);
      glow([0, 0.075, 0.2], [0.14, 0.035, 0.005], 0xd5ecee);
      for (const d of [-0.05, 0.05]) cy([d, 0.018, 0.2], 0.035, 0.02, C.ink);
      person(-0.3, 0.2, 0.22);
      person(0.33, 0.2, 0.22);
      return true;
    }
    case "hakkapoints": {
      // points-card kiosk: a shop front with an indigo awning, a coin stack and a phone-sized points sign
      const indigo = 0x3f5a8a;
      b([0, 0.17, -0.1], [0.5, 0.34, 0.22], 0xf2e8d8);
      p("box", [0, 0.36, 0.04], [0.56, 0.02, 0.18], indigo, [0.35, 0, 0]);
      for (let k = 0; k < 4; k++) hb([-0.21 + k * 0.14, 0.33, 0.12], [0.07, 0.04, 0.008], k % 2 ? 0xf2e8d8 : indigo);
      glow([0, 0.17, 0.012], [0.3, 0.16, 0.006], 0xfff0c2);
      b([0.36, 0.2, 0.12], [0.1, 0.18, 0.03], C.ink);
      glow([0.36, 0.21, 0.137], [0.075, 0.13, 0.004], 0xd5ecee);
      cy([0.36, 0.24, 0.14], 0.035, 0.006, C.yellow);
      for (let k = 0; k < 4; k++) cy([-0.32, 0.02 + k * 0.022, 0.18], 0.09, 0.018, k % 2 ? 0xe8c547 : 0xd9a933);
      person(0.12, 0.2, 0.36);
      return true;
    }
    case "hiringdesk": {
      // 約聘有加分: a city service counter with a headset clerk and a bonus-star plaque
      b([0, 0.2, -0.16], [0.6, 0.4, 0.16], 0xf2efe8);
      hb([0, 0.42, -0.16], [0.64, 0.03, 0.2], 0x3e7c8c);
      b([0, 0.14, 0.04], [0.56, 0.16, 0.12], wood);
      hb([0, 0.225, 0.04], [0.6, 0.02, 0.16], 0xe9dcc4);
      person(-0.12, -0.06, 0.36);
      ring([-0.12, 0.33, -0.06], 0.1, C.ink, [0, 0, 0]);
      b([0.14, 0.27, 0.02], [0.1, 0.08, 0.02], C.ink);
      glow([0.14, 0.27, 0.032], [0.08, 0.06, 0.004], 0xd5ecee);
      p("cone", [0.24, 0.52, -0.08], [0.1, 0.02, 0.1], C.yellow, [Math.PI / 2, 0, 0]);
      b([0.24, 0.52, -0.09], [0.16, 0.16, 0.02], 0x3f5a8a);
      p("tetra", [0.24, 0.52, -0.075], [0.08, 0.08, 0.01], C.yellow, [Math.PI / 2, 0, 0]);
      person(0.1, 0.2, 0.36);
      return true;
    }
    case "hakkaforum": {
      // 世界有客家: a round forum table under a tung-blossom canopy, a small globe at the centre
      cy([0, 0.015, 0], 0.66, 0.03, 0xe9dcc4);
      cy([0, 0.15, 0], 0.4, 0.03, wood);
      cy([0, 0.08, 0], 0.05, 0.14, C.ink);
      sphere([0, 0.22, 0], 0.1, glass);
      ring([0, 0.22, 0], 0.12, C.yellow, [0, 0, 0.35]);
      for (let k = 0; k < 5; k++) {
        const a = (k / 5) * Math.PI * 2;
        seat(Math.cos(a) * 0.28, Math.sin(a) * 0.28);
      }
      for (const s of [-1, 1]) cy([s * 0.36, 0.3, -0.2], 0.03, 0.6, 0x8a6a4e);
      p("box", [0, 0.6, -0.2], [0.8, 0.02, 0.2], 0x3f5a8a);
      for (let k = 0; k < 7; k++) sphere([-0.33 + k * 0.11, 0.62, -0.12 + (k % 2) * 0.04], 0.07, 0xfbf6ee);
      for (let k = 0; k < 7; k++) sphere([-0.33 + k * 0.11, 0.645, -0.12 + (k % 2) * 0.04], 0.025, 0xe8c547);
      return true;
    }
    // ---------------- 外語情境教室 (2026-10-29) ----------------
    case "taigiunit": {
      // 台語復振專責單位: a two-storey bureau office with a big speech-bubble sculpture on the roof terrace
      const indigo = 0x3f5a8a;
      b([0, 0.04, 0], [0.86, 0.08, 0.6], stone);
      b([0, 0.3, -0.06], [0.7, 0.44, 0.42], 0xf2e8d8);
      for (let k = 0; k < 4; k++) glow([-0.25 + k * 0.167, 0.36, 0.152], [0.1, 0.14, 0.008], 0xd5ecee);
      hb([0, 0.53, -0.06], [0.74, 0.03, 0.46], indigo);
      b([0, 0.14, 0.2], [0.18, 0.2, 0.06], indigo); // entrance
      glow([0, 0.13, 0.232], [0.1, 0.15, 0.006], 0xfff0c2);
      sphere([0.12, 0.74, -0.06], [0.38, 0.26, 0.12], 0xfbf6ee); // speech bubble
      p("tetra", [-0.02, 0.6, -0.06], [0.08, 0.1, 0.05], 0xfbf6ee, [0, 0, 0.6]);
      for (let k = 0; k < 3; k++) sphere([0.04 + k * 0.08, 0.74, 0.0], 0.035, k === 1 ? C.coral : indigo);
      for (const s2 of [-1, 1]) plant(s2 * 0.38, 0.24, 0.2);
      person(-0.2, 0.32, 0.34);
      return true;
    }
    case "taigiservice": {
      // 公家機關台語服務: a service hall with two windows, a queue-number board and speech bubbles over the counter
      b([0, 0.22, -0.18], [0.74, 0.44, 0.14], 0xf6efe3);
      hb([0, 0.46, -0.18], [0.78, 0.04, 0.2], 0x5f9aa6);
      for (const s2 of [-1, 1]) {
        glow([s2 * 0.18, 0.28, -0.105], [0.22, 0.14, 0.006], 0xd5ecee);
        b([s2 * 0.18, 0.12, -0.04], [0.26, 0.2, 0.1], wood);
        hb([s2 * 0.18, 0.225, -0.04], [0.3, 0.02, 0.14], warm);
        sphere([s2 * 0.18, 0.5, -0.02], [0.16, 0.1, 0.05], 0xfbf6ee);
        p("tetra", [s2 * 0.18 - 0.03, 0.43, -0.02], [0.04, 0.05, 0.03], 0xfbf6ee, [0, 0, 0.5]);
      }
      b([0.4, 0.34, -0.12], [0.08, 0.14, 0.03], C.ink); // number board
      glow([0.4, 0.34, -0.103], [0.06, 0.1, 0.004], 0xfcea8b);
      b([0, 0.07, 0.3], [0.5, 0.04, 0.1], wood); // waiting bench
      for (const d of [-0.2, 0.2]) b([d, 0.03, 0.3], [0.03, 0.06, 0.08], C.ink);
      person(-0.18, 0.12, 0.34);
      person(0.18, 0.12, 0.34);
      person(-0.1, 0.32, 0.3);
      return true;
    }
    case "taigiclass": {
      // 台語做課室語言: an open classroom: green board, teacher, pupils at desks, one speech bubble
      b([0, 0.02, 0], [0.9, 0.04, 0.7], 0xe6d8c8);
      b([0, 0.3, -0.3], [0.7, 0.42, 0.05], 0xf6e7a8);
      hb([0, 0.33, -0.27], [0.5, 0.24, 0.01], 0x3f6b4f);
      for (let k = 0; k < 3; k++) hb([-0.16 + k * 0.12, 0.36 - (k % 2) * 0.05, -0.264], [0.08, 0.008, 0.004], 0xfbf6ee);
      p("hip", [0, 0.56, -0.3], [0.78, 0.1, 0.12], 0x58a6a6);
      person(0.3, -0.16, 0.38);
      sphere([0.3, 0.52, -0.12], [0.14, 0.09, 0.05], 0xfbf6ee);
      for (let r = 0; r < 2; r++)
        for (let k = 0; k < 3; k++) {
          const xx = -0.26 + k * 0.22,
            zz = 0.06 + r * 0.22;
          b([xx, 0.13, zz], [0.14, 0.02, 0.1], wood);
          for (const d of [-0.05, 0.05]) hb([xx + d, 0.06, zz], [0.012, 0.12, 0.012], C.ink);
          person(xx, zz + 0.08, 0.24);
        }
      return true;
    }
    // ---------------- 校園專業教室景觀 (2026-10-29) ----------------
    case "riverfront": {
      // 親水河岸: stepped riverbank seating down to a strip of water with a kayak
      cy([0, 0.01, 0], 0.98, 0.02, 0xc9d8c9);
      hb([0, 0.025, 0.24], [0.94, 0.03, 0.34], 0x6fb3c4);
      glow([0, 0.05, 0.24], [0.86, 0.006, 0.26], 0x9fd3de);
      for (let k = 0; k < 3; k++) b([0, 0.05 + k * 0.06, -0.02 - k * 0.11], [0.9, 0.06 + k * 0.06, 0.12], [0xd9cbb4, 0xcdbb9f, 0xc2ae90][k]);
      sphere([0.12, 0.07, 0.26], [0.34, 0.05, 0.08], C.coral); // kayak
      hb([0.12, 0.1, 0.26], [0.02, 0.01, 0.3], C.ink, [0, 0.6, 0]);
      person(-0.2, -0.13, 0.28);
      person(0.24, -0.24, 0.28);
      plant(-0.38, -0.32, 0.26);
      plant(0.4, -0.34, 0.24);
      return true;
    }
    case "waterway": {
      // 水路文化空間: a stone-lined old canal with an arched footbridge and a story board
      cy([0, 0.01, 0], 0.98, 0.02, 0xd3c4aa);
      hb([0, 0.025, 0], [0.22, 0.03, 0.9], 0x6fb3c4);
      for (const s2 of [-1, 1]) hb([s2 * 0.13, 0.05, 0], [0.04, 0.07, 0.9], 0xb7a993);
      for (let k = 0; k < 9; k++) {
        const a = Math.PI * (k / 8);
        hb([Math.cos(a) * -0.16, 0.08 + Math.sin(a) * 0.1, 0.05], [0.07, 0.025, 0.16], 0xb48560, [0, 0, Math.cos(a) * 0.6]);
      }
      b([0.3, 0.2, -0.22], [0.2, 0.18, 0.02], 0xf2e8d8); // story board
      hb([0.3, 0.2, -0.208], [0.16, 0.12, 0.004], 0x3e7c8c);
      for (const d of [-0.07, 0.07]) hb([0.3 + d, 0.06, -0.22], [0.015, 0.12, 0.015], C.ink);
      plant(-0.34, -0.26, 0.3);
      plant(-0.32, 0.3, 0.26);
      plant(0.34, 0.3, 0.24);
      person(0.26, -0.06, 0.3);
      return true;
    }
    case "reedbed": {
      // 水圳清疏與淨水: a cleared channel feeding stepped planted filter beds and a gravel bed, clear water out
      cy([0, 0.01, 0], 0.98, 0.02, 0xd3c4aa);
      for (let k = 0; k < 3; k++) {
        const zz = -0.28 + k * 0.26,
          yy = 0.16 - k * 0.05;
        b([0, yy / 2, zz], [0.72, yy, 0.22], 0xb7a993);
        hb([0, yy + 0.008, zz], [0.64, 0.012, 0.17], k === 2 ? 0x9fd3de : 0x7fb0ae);
        if (k < 2) for (let j = 0; j < 9; j++) cy([-0.27 + j * 0.068, yy + 0.07, zz + ((j % 2) - 0.5) * 0.06], 0.012, 0.14, 0x9cae6e);
        else for (let j = 0; j < 6; j++) sphere([-0.24 + j * 0.1, yy + 0.02, zz], [0.06, 0.03, 0.05], 0xc9bba6);
      }
      for (const s2 of [-1, 1]) hb([s2 * 0.3, 0.1, -0.28], [0.04, 0.02, 0.05], 0x9fd3de);
      person(0.42, 0.06, 0.3);
      return true;
    }
    case "raingarden": {
      // 微型社區滯洪: a park with a sunken lawn basin, rain barrels beside a small building, gravel swale
      cy([0, 0.01, 0], 0.98, 0.02, 0xbccf9c);
      cy([-0.12, 0.03, 0.1], 0.5, 0.02, 0x9fb684); // sunken basin rim
      cy([-0.12, 0.045, 0.1], 0.4, 0.012, 0x8ec9d4);
      for (let k = 0; k < 4; k++) sphere([-0.3 + k * 0.12, 0.045, 0.32], [0.06, 0.035, 0.05], 0xc9bba6);
      b([0.28, 0.17, -0.22], [0.3, 0.34, 0.24], 0xf6e7a8);
      p("hip", [0.28, 0.38, -0.22], [0.34, 0.08, 0.28], 0x58a6a6);
      for (const d of [0.12, 0.44]) {
        cy([d, 0.09, -0.04], 0.1, 0.18, 0x3e7c8c);
        cy([d, 0.185, -0.04], 0.11, 0.012, C.ink);
      }
      hb([0.12, 0.3, -0.1], [0.012, 0.18, 0.012], C.ink);
      plant(-0.36, -0.28, 0.3);
      plant(-0.02, -0.34, 0.24);
      person(-0.34, 0.2, 0.28);
      return true;
    }
    case "wetland": {
      // 濕地風廊: a lily pond with an egret, reeds and a row of wind streamers marking the breeze line
      cy([0, 0.01, 0], 0.98, 0.02, 0xb3cfa4);
      cy([0.04, 0.03, 0.06], 0.66, 0.012, 0x8ec9d4);
      for (let k = 0; k < 5; k++) cy([-0.12 + k * 0.08, 0.045, 0.14 - (k % 2) * 0.1], 0.07, 0.008, 0x7f9a6a);
      sphere([0.06, 0.06, 0.0], 0.03, 0xf2b5c6);
      for (let k = 0; k < 10; k++) cy([-0.36 + (k % 5) * 0.03, 0.08, -0.18 + Math.floor(k / 5) * 0.4 + (k % 3) * 0.03], 0.01, 0.16, 0x9cae6e);
      sphere([0.24, 0.1, 0.14], [0.06, 0.05, 0.1], 0xffffff); // egret
      sphere([0.24, 0.17, 0.19], 0.03, 0xffffff);
      hb([0.24, 0.17, 0.22], [0.008, 0.008, 0.04], C.yellow);
      for (let k = 0; k < 3; k++) {
        const xx = -0.3 + k * 0.3;
        hb([xx, 0.24, -0.36], [0.014, 0.48, 0.014], C.ink);
        hb([xx + 0.07, 0.44, -0.36], [0.14, 0.04, 0.004], [0x9fd3de, 0xfbf6ee, 0x9fd3de][k], [0, 0, -0.12]);
      }
      return true;
    }
    // ---------------- 智慧旅宿景觀 (2026-10-29) ----------------
    case "beitoucluster": {
      // 北士科星群計畫: three glass towers of a tech park, a substation beside an e-bus charging bay
      b([0, 0.03, 0], [0.92, 0.06, 0.72], 0xdfe4e1);
      const tw = [[-0.24, -0.14, 0.86], [0.08, -0.2, 1.12], [0.32, -0.04, 0.7]];
      for (const [xx, zz, hh] of tw) {
        b([xx, hh / 2, zz], [0.2, hh, 0.2], 0xe9f0ef);
        for (let k = 0; k < Math.floor(hh / 0.12); k++) glow([xx, 0.1 + k * 0.12, zz + 0.103], [0.16, 0.05, 0.004], 0x9fc4c6);
        p("tetra", [xx, hh + 0.05, zz], [0.08, 0.1, 0.08], C.yellow);
      }
      b([-0.3, 0.1, 0.24], [0.2, 0.14, 0.14], 0x8a9aa6); // substation
      for (let k = 0; k < 3; k++) hb([-0.36 + k * 0.06, 0.2, 0.24], [0.012, 0.1, 0.012], C.ink);
      b([0.18, 0.1, 0.26], [0.36, 0.12, 0.14], 0x3e7c8c); // e-bus
      for (let k = 0; k < 3; k++) glow([0.08 + k * 0.1, 0.12, 0.332], [0.07, 0.05, 0.004], 0xd5ecee);
      for (const d of [0.06, 0.3]) cy([d, 0.04, 0.33], 0.05, 0.02, C.ink);
      hb([0.0, 0.12, 0.26], [0.03, 0.18, 0.03], C.yellow); // charger post
      return true;
    }
    case "aiplatform": {
      // 青年 AI 使用平台: a big screen wall showing several model tiles, students with laptops on cube seats
      b([0, 0.04, 0], [0.9, 0.06, 0.66], 0xeef3f2);
      b([0, 0.36, -0.24], [0.74, 0.5, 0.06], C.ink);
      const tc = [0x58a6a6, C.yellow, C.coral, 0x6f7fb5, 0x8fb37a, 0xf2a1a1];
      for (let k = 0; k < 6; k++) glow([-0.22 + (k % 3) * 0.22, 0.46 - Math.floor(k / 3) * 0.2, -0.207], [0.18, 0.14, 0.004], tc[k]);
      for (let k = 0; k < 3; k++) {
        const xx = -0.28 + k * 0.28;
        b([xx, 0.09, 0.18], [0.14, 0.1, 0.14], [0x5f9aa6, 0xe8c547, 0xdb6a41][k]);
        person(xx, 0.28, 0.3);
        hb([xx, 0.15, 0.2], [0.08, 0.006, 0.06], 0x3b3a42);
        hb([xx, 0.18, 0.17], [0.08, 0.05, 0.004], 0xd5ecee, [-0.4, 0, 0]);
      }
      return true;
    }
    case "midlife": {
      // 中高齡再出發: a career-check desk with two people, a direction signpost and a briefcase
      b([0, 0.03, 0], [0.88, 0.06, 0.66], 0xe9dcc4);
      b([-0.06, 0.2, -0.04], [0.44, 0.04, 0.24], wood);
      for (const d of [-0.2, 0.08]) hb([d, 0.1, -0.04], [0.02, 0.18, 0.2], C.ink);
      hb([-0.1, 0.24, -0.06], [0.1, 0.06, 0.004], 0xd5ecee, [-0.3, 0, 0]);
      person(-0.06, -0.26, 0.36);
      person(-0.06, 0.2, 0.36);
      hb([0.34, 0.3, 0.06], [0.03, 0.6, 0.03], 0x8a6a4e);
      const arr = [[0.44, 0.0, C.coral], [0.22, 0.6, 0x3e7c8c], [0.46, -0.4, C.yellow]];
      arr.forEach(([y2, ry, c2], k) => b([0.34 + Math.cos(ry) * 0.08, y2 + 0.06 * 0, 0.06 - Math.sin(ry) * 0.08], [0.2, 0.06, 0.02], c2, [0, ry, 0]));
      b([0.18, 0.06, 0.26], [0.16, 0.12, 0.05], 0x5a3d2b); // briefcase
      hb([0.18, 0.13, 0.26], [0.06, 0.02, 0.012], C.ink);
      return true;
    }
    case "aiinstitute": {
      // 研究院四類任務: a round research pavilion with four coloured study wings around a central atrium
      cy([0, 0.03, 0], 0.96, 0.06, 0xe3ebea);
      cy([0, 0.3, 0], 0.32, 0.5, 0xf2f4f3);
      p("dome", [0, 0.55, 0], [0.34, 0.16, 0.34], glass);
      const wc = [0x3e7c8c, 0xdb6a41, 0xe8c547, 0x8fb37a];
      for (let k = 0; k < 4; k++) {
        const a = (k / 4) * Math.PI * 2 + Math.PI / 4;
        b([Math.cos(a) * 0.3, 0.14, Math.sin(a) * 0.3], [0.2, 0.22, 0.2], 0xf6f3ee, [0, -a, 0]);
        hb([Math.cos(a) * 0.3, 0.27, Math.sin(a) * 0.3], [0.22, 0.03, 0.22], wc[k], [0, -a, 0]);
        glow([Math.cos(a) * 0.4, 0.15, Math.sin(a) * 0.4], [0.03, 0.09, 0.12], 0xd5ecee);
      }
      for (let k = 0; k < 4; k++) glow([Math.cos(k * 1.57) * 0.161, 0.3, Math.sin(k * 1.57) * 0.161], [0.04, 0.2, 0.04], 0x9fc4c6);
      return true;
    }
    case "aicivic": {
      // AI support desk: an office with a rotating support team: three people with tablets and a looping arrow on the roof
      b([0, 0.03, 0], [0.88, 0.06, 0.66], 0xd9cbb4);
      b([0, 0.24, -0.16], [0.66, 0.4, 0.3], 0xf1e6d3);
      for (let k = 0; k < 3; k++) glow([-0.2 + k * 0.2, 0.28, 0.003], [0.13, 0.14, 0.006], 0x9fc4c6);
      hb([0, 0.45, -0.16], [0.7, 0.03, 0.34], 0xcfbfa6);
      ring([0, 0.6, -0.16], 0.26, 0x5f9aa6, [Math.PI / 2, 0, 0]);
      p("tetra", [0.13, 0.6, -0.16], [0.07, 0.09, 0.03], 0x5f9aa6, [0, 0, -Math.PI / 2]);
      for (let k = 0; k < 3; k++) {
        const xx = -0.24 + k * 0.24;
        person(xx, 0.2, 0.34);
        hb([xx + 0.05, 0.17, 0.25], [0.05, 0.07, 0.008], 0x3b3a42, [-0.3, 0, 0]);
      }
      return true;
    }
    // ---------------- 都更與住宅 (2026-11-05 v51) ----------------
    case "reviewtrio": {
      // 加速都更審查: three stations left → right: 補人力 (review desks under a rising pay chart), 審得準 (a guild round table
      // around a building model), 審得快 (a glowing AI knowledge base beside a project manager's screen)
      b([0, 0.03, 0], [0.96, 0.06, 0.72], 0xe9dcc4);
      // 補人力
      b([-0.32, 0.26, -0.24], [0.28, 0.4, 0.06], 0xf6efe3);
      [0.08, 0.14, 0.2, 0.27].forEach((hh, k) => hb([-0.42 + k * 0.065, 0.12 + hh / 2, -0.205], [0.045, hh, 0.012], [0x8fb37a, 0x8fb37a, C.yellow, C.coral][k]));
      for (let k = 0; k < 2; k++) {
        const xx = -0.4 + k * 0.17;
        b([xx, 0.17, 0.02], [0.14, 0.025, 0.12], wood);
        for (const d of [-0.05, 0.05]) hb([xx + d, 0.08, 0.02], [0.012, 0.15, 0.1], C.ink);
        hb([xx, 0.22, -0.02], [0.08, 0.06, 0.006], 0xd5ecee, [-0.25, 0, 0]);
        person(xx, 0.16, 0.3);
      }
      // 審得準
      cy([0.0, 0.16, 0.06], 0.32, 0.025, wood);
      cy([0.0, 0.08, 0.06], 0.05, 0.15, C.ink);
      b([0.0, 0.22, 0.06], [0.08, 0.09, 0.07], 0xf6efe3);
      p("hip", [0.0, 0.29, 0.06], [0.09, 0.05, 0.08], C.coral);
      for (let k = 0; k < 4; k++) {
        const a = (k / 4) * Math.PI * 2 + 0.4;
        person(Math.cos(a) * 0.22, 0.06 + Math.sin(a) * 0.2, 0.28);
      }
      // 審得快
      cy([0.34, 0.24, -0.16], 0.18, 0.36, 0xeef3f2);
      for (let k = 0; k < 4; k++) glow([0.34, 0.1 + k * 0.08, -0.07], [0.1, 0.02, 0.004], 0x7fd0d8);
      bulb([0.34, 0.46, -0.16], 0.07, 0xbfe9ff);
      b([0.34, 0.2, 0.16], [0.2, 0.14, 0.02], C.ink);
      glow([0.34, 0.2, 0.172], [0.17, 0.11, 0.004], 0xd5ecee);
      for (let k = 0; k < 3; k++) hb([0.29 + k * 0.05, 0.19 + (k % 2) * 0.03, 0.175], [0.035, 0.035, 0.003], 0x3e7c8c);
      hb([0.34, 0.07, 0.16], [0.02, 0.12, 0.02], C.ink);
      return true;
    }
    case "zombiefix": {
      // 活化殭屍都更: a stalled concrete frame behind hoarding, a yellow-and-red signal on a pole in front of it, a crane
      // handing the site to a new team (換車), and a green 續建安全網 strung across the frame so the building gets finished
      b([0, 0.03, 0], [0.96, 0.06, 0.72], 0xc7b08f);
      for (const xx of [-0.3, 0.06]) for (const zz of [-0.28, -0.02]) hb([xx, 0.32, zz], [0.035, 0.52, 0.035], 0xb9b2a8);
      for (let k = 0; k < 2; k++) hb([-0.12, 0.22 + k * 0.26, -0.15], [0.4, 0.03, 0.3], 0xc9c2b8);
      for (let k = 0; k < 5; k++) hb([-0.12, 0.1 + k * 0.09, 0.01], [0.38, 0.008, 0.008], 0x6f957b);
      for (let k = 0; k < 6; k++) hb([-0.29 + k * 0.068, 0.28, 0.01], [0.008, 0.38, 0.008], 0x6f957b);
      // signal pole: yellow (輔導) and red (廢止) lamps
      hb([-0.36, 0.3, 0.24], [0.02, 0.56, 0.02], C.ink);
      b([-0.36, 0.52, 0.24], [0.09, 0.2, 0.07], 0x2f3a46);
      bulb([-0.36, 0.57, 0.28], 0.06, 0xf2c230);
      bulb([-0.36, 0.48, 0.28], 0.06, 0xd8432f);
      // crane handing over to a new team
      b([0.34, 0.06, -0.2], [0.12, 0.06, 0.12], C.ink);
      hb([0.34, 0.5, -0.2], [0.045, 0.86, 0.045], C.yellow);
      hb([0.18, 0.92, -0.2], [0.5, 0.04, 0.045], C.yellow);
      hb([0.44, 0.88, -0.2], [0.08, 0.07, 0.07], C.ink);
      person(0.14, 0.24, 0.32);
      person(0.34, 0.24, 0.32);
      p("dome", [0.14, 0.31, 0.24], [0.11, 0.07, 0.11], C.coral);
      p("dome", [0.34, 0.31, 0.24], [0.11, 0.07, 0.11], 0x5f9aa6);
      return true;
    }
    case "socialmix": {
      // 推動多元興辦社宅: a vacant town house lit up again with a key tag (空屋包租), a renewal tower whose lower floors are kept as
      // social housing (teal band and ribbon), and three small blocks for 婚育宅 (slide), 青年宅 (bikes) and 科技宅 (glass)
      b([0, 0.03, 0], [0.98, 0.06, 0.74], 0xe0cdbb);
      b([-0.34, 0.24, -0.16], [0.24, 0.36, 0.24], 0xe6d6bf);
      p("hip", [-0.34, 0.48, -0.16], [0.26, 0.12, 0.26], 0xa34e34);
      glow([-0.34, 0.3, -0.036], [0.14, 0.08, 0.006], 0xfff0c2);
      glow([-0.34, 0.13, -0.036], [0.1, 0.12, 0.006], 0xfff0c2);
      hb([-0.24, 0.22, -0.03], [0.006, 0.08, 0.006], C.ink);
      b([-0.24, 0.16, -0.03], [0.05, 0.05, 0.012], C.yellow);
      b([0.02, 0.5, -0.18], [0.24, 0.9, 0.22], 0xf2f0ea);
      for (let r = 0; r < 6; r++) glow([0.02, 0.16 + r * 0.13, -0.066], [0.18, 0.06, 0.006], r < 2 ? 0xfff0c2 : 0x9fc4c6);
      hb([0.02, 0.23, -0.06], [0.26, 0.24, 0.012], 0x58a6a6);
      hb([0.15, 0.23, -0.18], [0.012, 0.26, 0.24], C.coral);
      hb([0.02, 0.96, -0.18], [0.26, 0.03, 0.24], 0xcfbfa6);
      const blocks = [[0.24, 0x9fc4e6, 0.34], [0.34, C.yellow, 0.42], [0.44, 0xd5ecee, 0.5]];
      for (const [xx, c, hh] of blocks) {
        b([xx, hh / 2 + 0.04, -0.2], [0.09, hh, 0.14], xx > 0.4 ? 0xeef3f2 : 0xf6efe3);
        for (let r = 0; r < Math.floor(hh / 0.12); r++) hb([xx, 0.12 + r * 0.12, -0.125], [0.08, 0.012, 0.02], c);
      }
      p("dome", [0.22, 0.06, 0.16], [0.12, 0.07, 0.12], C.coral);
      for (let k = 0; k < 2; k++) ring([0.38 + k * 0.07, 0.08, 0.14], 0.09, C.ink, [0, 0, 0]);
      person(-0.3, 0.24, 0.32);
      person(0.02, 0.2, 0.32);
      return true;
    }
    // ---------------- 職涯發展中心 (2026-11-05) ----------------
    case "loopswap": {
      // 先換屋、再都更 (2026-11-05 v49, after the 10/15 construction-site design): the old walk-up wrapped in scaffold and
      // green netting under a tower crane on the left, the finished new block on the right, and a moving truck between them
      // with one-way arrows on the ground: residents move into the new home first, then the old block is rebuilt.
      b([0, 0.02, 0], [0.98, 0.04, 0.92], 0xcfc6b8);
      // old walk-up (iron grilles, rooftop tanks)
      b([-0.25, 0.32, -0.16], [0.36, 0.56, 0.3], 0xd6c6aa);
      for (let r = 0; r < 3; r++) for (const dx of [-0.08, 0.08]) {
        glow([-0.25 + dx, 0.18 + r * 0.15, -0.006], [0.08, 0.07, 0.006], 0xb8cfcf);
        hb([-0.25 + dx, 0.18 + r * 0.15, 0.004], [0.1, 0.09, 0.008], 0x8a8580);
      }
      for (const dx of [-0.08, 0.06]) cy([-0.25 + dx, 0.64, -0.2], 0.08, 0.08, 0x9aa6a6);
      // scaffold: poles, ledgers every level, coral diagonal braces, green netting on the front and one side
      for (const xx of [-0.45, -0.05]) for (const zz of [0.02, -0.34]) hb([xx, 0.36, zz], [0.018, 0.68, 0.018], C.ink);
      for (let j = 0; j < 4; j++) {
        const yy = 0.1 + j * 0.18;
        hb([-0.25, yy, 0.03], [0.42, 0.016, 0.06], 0xb48560);
        hb([-0.25, yy + 0.09, 0.035], [0.4, 0.014, 0.012], C.coral, [0, 0, j % 2 ? 0.42 : -0.42]);
      }
      p("box", [-0.25, 0.45, 0.06], [0.42, 0.5, 0.006], 0x7fa38a);
      p("box", [-0.465, 0.38, -0.16], [0.006, 0.62, 0.38], 0x6f957b);
      for (let j = 0; j < 5; j++) hb([-0.25, 0.24 + j * 0.1, 0.064], [0.42, 0.005, 0.004], 0x5f856b);
      // tower crane over the old block
      b([0.04, 0.05, -0.4], [0.14, 0.06, 0.14], C.ink);
      hb([0.04, 0.72, -0.4], [0.06, 1.34, 0.06], C.coral);
      for (let j = 0; j < 6; j++) hb([0.04, 0.12 + j * 0.22, -0.368], [0.06, 0.012, 0.004], 0xf2efe8, [0, 0, 0.7]);
      hb([-0.16, 1.4, -0.4], [0.86, 0.05, 0.06], C.coral);
      hb([0.24, 1.36, -0.4], [0.12, 0.1, 0.1], C.ink); // counterweight
      b([0.06, 1.3, -0.33], [0.08, 0.08, 0.08], 0xf2efe8); // cab
      glow([0.06, 1.3, -0.288], [0.06, 0.05, 0.004], 0xcfe6e6);
      hb([-0.42, 1.12, -0.4], [0.006, 0.52, 0.006], C.ink);
      b([-0.42, 0.86, -0.4], [0.1, 0.03, 0.1], 0xe8c547);
      // finished new block on the right: lit windows, coral balcony rails, roof garden
      b([0.3, 0.42, -0.16], [0.32, 0.8, 0.3], 0xf6efe3);
      for (let r = 0; r < 5; r++) {
        glow([0.3, 0.14 + r * 0.15, -0.006], [0.22, 0.08, 0.006], 0xfff0c2);
        hb([0.3, 0.09 + r * 0.15, 0.03], [0.28, 0.012, 0.06], C.coral);
      }
      hb([0.3, 0.83, -0.16], [0.34, 0.03, 0.32], 0xcfbfa6);
      plant(0.24, -0.22, 0.14);
      plant(0.37, -0.12, 0.12);
      // moving truck between the two, boxes at the new block's door
      b([-0.06, 0.13, 0.24], [0.3, 0.18, 0.16], 0x3e7c8c);
      b([0.13, 0.11, 0.24], [0.1, 0.14, 0.15], 0xf6efe3);
      glow([0.18, 0.13, 0.24], [0.004, 0.06, 0.12], 0xcfe6e6);
      for (const dx of [-0.16, 0.0, 0.13]) for (const dz of [0.16, 0.32]) p("cylinder", [dx, 0.04, dz], [0.06, 0.03, 0.06], C.ink, [Math.PI / 2, 0, 0]);
      for (let j = 0; j < 4; j++) b([0.3 + (j % 2) * 0.07, 0.07 + Math.floor(j / 2) * 0.06, 0.12 + (j % 2) * 0.03], [0.06, 0.05, 0.06], 0xc9a27a);
      // one-way arrows: from the old block, past the truck, to the new home
      for (let j = 0; j < 4; j++) {
        hb([-0.36 + j * 0.2, 0.044, 0.4], [0.1, 0.004, 0.03], 0xffffff);
        for (const sg of [-1, 1]) hb([-0.3 + j * 0.2, 0.044, 0.4 + sg * 0.018], [0.05, 0.004, 0.014], 0xffffff, [0, sg * 0.8, 0]);
      }
      return true;
    }
    case "cardboard": {
      // 紅黃牌分級管理: a stalled concrete frame behind hoarding, a yellow card and a red card raised beside it, an inspector
      b([0, 0.03, 0], [0.96, 0.06, 0.7], 0xc7b08f);
      for (const xx of [-0.34, -0.06]) for (const zz of [-0.26, -0.02]) hb([xx, 0.3, zz], [0.04, 0.5, 0.04], 0xb9b2a8);
      for (let k = 0; k < 2; k++) hb([-0.2, 0.2 + k * 0.24, -0.14], [0.36, 0.03, 0.3], 0xc9c2b8);
      for (let k = 0; k < 4; k++) hb([-0.2, 0.2 + k * 0.03 - 0.17, 0.08], [0.42, 0.07, 0.012], k % 2 ? 0xe6dccb : 0xd9cbb4);
      // the two cards on posts
      hb([0.2, 0.26, -0.06], [0.02, 0.4, 0.02], C.ink);
      b([0.2, 0.52, -0.06], [0.16, 0.22, 0.03], 0xf2c230, [0, 0, -0.12]);
      hb([0.4, 0.3, -0.16], [0.02, 0.48, 0.02], C.ink);
      b([0.4, 0.6, -0.16], [0.16, 0.22, 0.03], 0xd8432f, [0, 0, 0.12]);
      // inspector with clipboard
      person(0.3, 0.2, 0.36);
      hb([0.3, 0.17, 0.25], [0.06, 0.08, 0.008], 0xfbf6ee, [-0.3, 0, 0]);
      plant(-0.4, 0.26, 0.2);
      return true;
    }
    case "handover": {
      // 不想開車就換手: a crane handed over between two site leads, a green safety net strung under the half-built frame
      b([0, 0.03, 0], [0.96, 0.06, 0.7], 0xc7b08f);
      for (const xx of [-0.36, -0.04]) for (const zz of [-0.28, -0.04]) hb([xx, 0.3, zz], [0.035, 0.5, 0.035], 0xb9b2a8);
      hb([-0.2, 0.55, -0.16], [0.38, 0.03, 0.3], 0xc9c2b8);
      // 續建安全網: a lattice net across the front of the frame
      for (let k = 0; k < 5; k++) hb([-0.2, 0.1 + k * 0.09, -0.01], [0.38, 0.008, 0.008], 0x6f957b);
      for (let k = 0; k < 6; k++) hb([-0.37 + k * 0.068, 0.28, -0.01], [0.008, 0.38, 0.008], 0x6f957b);
      // crane
      b([0.3, 0.06, -0.2], [0.14, 0.06, 0.14], C.ink);
      hb([0.3, 0.5, -0.2], [0.05, 0.9, 0.05], C.yellow);
      hb([0.16, 0.94, -0.2], [0.56, 0.04, 0.05], C.yellow);
      hb([0.42, 0.88, -0.2], [0.08, 0.08, 0.08], C.ink);
      hb([0.0, 0.8, -0.2], [0.008, 0.24, 0.008], C.ink);
      // the hand-over: two leads in different hard hats facing each other
      person(0.14, 0.24, 0.36);
      person(0.36, 0.24, 0.36);
      p("dome", [0.14, 0.33, 0.24], [0.12, 0.08, 0.12], C.coral);
      p("dome", [0.36, 0.33, 0.24], [0.12, 0.08, 0.12], 0x5f9aa6);
      ring([0.25, 0.45, 0.24], 0.16, C.yellow, [0, 0, 0]);
      return true;
    }
    case "reviewstaff": {
      // 擴充量能與留才: a review office with a full row of reviewers, a rising pay chart and a merit star on the wall
      b([0, 0.03, 0], [0.92, 0.06, 0.68], 0xe9dcc4);
      b([0, 0.3, -0.26], [0.84, 0.54, 0.08], 0xf6efe3);
      hb([0, 0.58, -0.24], [0.88, 0.03, 0.14], 0x3e7c8c);
      const bars = [0.1, 0.16, 0.24, 0.32];
      bars.forEach((hh, k) => hb([-0.3 + k * 0.07, 0.16 + hh / 2, -0.21], [0.05, hh, 0.012], [0x8fb37a, 0x8fb37a, C.yellow, C.coral][k]));
      p("tetra", [0.14, 0.42, -0.21], [0.1, 0.1, 0.02], C.yellow);
      p("tetra", [0.14, 0.42, -0.215], [0.1, 0.1, 0.02], C.yellow, [0, 0, Math.PI]);
      for (let k = 0; k < 3; k++) {
        const xx = -0.28 + k * 0.28;
        b([xx, 0.19, 0.04], [0.22, 0.03, 0.14], wood);
        for (const d of [-0.08, 0.08]) hb([xx + d, 0.09, 0.04], [0.015, 0.17, 0.12], C.ink);
        hb([xx, 0.25, -0.01], [0.1, 0.07, 0.008], 0xd5ecee, [-0.25, 0, 0]);
        b([xx + 0.07, 0.24, 0.05], [0.06, 0.06, 0.08], 0xfbf6ee); // file stack
        person(xx, 0.2, 0.34);
      }
      return true;
    }
    case "jointreview": {
      // 公會協審與聯合預審: one round table where guild reviewers and city staff check a building model together
      b([0, 0.03, 0], [0.92, 0.06, 0.7], 0xe3d6c2);
      cy([0, 0.18, 0.02], 0.5, 0.03, wood);
      cy([0, 0.09, 0.02], 0.06, 0.16, C.ink);
      b([0, 0.26, 0.02], [0.12, 0.12, 0.1], 0xf6efe3); // building model on the table
      p("hip", [0, 0.35, 0.02], [0.13, 0.06, 0.11], C.coral);
      for (let k = 0; k < 3; k++) hb([-0.15 + k * 0.012, 0.205 + k * 0.012, -0.12], [0.1, 0.01, 0.07], 0xffffff);
      for (let k = 0; k < 5; k++) {
        const a = (k / 5) * Math.PI * 2 + 0.3;
        const xx = Math.cos(a) * 0.36,
          zz = 0.02 + Math.sin(a) * 0.3;
        b([xx, 0.08, zz], [0.1, 0.06, 0.1], k < 3 ? 0x5f9aa6 : C.coral);
        person(xx, zz, 0.32);
      }
      hb([0.36, 0.42, -0.3], [0.2, 0.16, 0.012], 0xf2e8d8); // checklist board
      for (let k = 0; k < 3; k++) hb([0.33, 0.46 - k * 0.04, -0.292], [0.1, 0.01, 0.004], 0x3e7c8c);
      for (let k = 0; k < 3; k++) hb([0.43, 0.46 - k * 0.04, -0.292], [0.02, 0.02, 0.004], 0x8fb37a);
      hb([0.36, 0.17, -0.3], [0.015, 0.34, 0.015], C.ink);
      return true;
    }
    case "aisecretary": {
      // AI 秘書協作: files flow into a glowing knowledge base, a project manager with a tablet, a small class board for renewal lessons
      b([0, 0.03, 0], [0.92, 0.06, 0.68], 0xe3ebea);
      cy([-0.26, 0.24, -0.14], 0.22, 0.38, 0xeef3f2); // knowledge base
      for (let k = 0; k < 4; k++) glow([-0.26, 0.1 + k * 0.08, -0.03], [0.12, 0.02, 0.004], 0x7fd0d8);
      bulb([-0.26, 0.47, -0.14], 0.08, 0xbfe9ff);
      for (let k = 0; k < 3; k++) b([-0.02 - k * 0.06, 0.1 + k * 0.03, -0.12], [0.08, 0.02, 0.1], [0xfbf6ee, 0xf2e8d8, 0xfbf6ee][k]);
      b([0.12, 0.2, -0.16], [0.26, 0.03, 0.18], wood); // desk
      for (const d of [-0.1, 0.1]) hb([0.12 + d, 0.1, -0.16], [0.015, 0.18, 0.14], C.ink);
      b([0.12, 0.34, -0.22], [0.22, 0.16, 0.02], C.ink);
      glow([0.12, 0.34, -0.208], [0.19, 0.13, 0.004], 0xd5ecee);
      for (let k = 0; k < 3; k++) hb([0.06 + k * 0.06, 0.32 + (k % 2) * 0.03, -0.205], [0.04, 0.04, 0.003], 0x3e7c8c);
      person(0.12, 0.02, 0.34);
      hb([0.17, 0.17, 0.08], [0.05, 0.07, 0.008], 0x3b3a42, [-0.3, 0, 0]);
      // 普及都更教育: a small board with two listeners
      b([0.36, 0.22, 0.12], [0.02, 0.24, 0.22], 0x3f6b4f);
      hb([0.36, 0.08, 0.12], [0.03, 0.16, 0.03], C.ink);
      person(0.2, 0.26, 0.28);
      person(0.26, 0.36, 0.28);
      return true;
    }
    case "fourstock": {
      // 盤點四大房源: four small lots: an old public dormitory, a site turned public-led, a self-renewal block and an MRT joint-development tower
      b([0, 0.02, 0], [0.96, 0.04, 0.74], 0xd9cbb4);
      hb([0, 0.045, 0], [0.96, 0.008, 0.05], 0xf2efe8);
      hb([0, 0.045, 0], [0.05, 0.008, 0.74], 0xf2efe8);
      // NW: low old public dormitory with a tiled roof
      b([-0.24, 0.12, -0.2], [0.3, 0.16, 0.2], 0xe9dcc4);
      p("hip", [-0.24, 0.24, -0.2], [0.34, 0.1, 0.24], 0x8a6a4e);
      // NE: a cleared site with the city's own hoarding (taken over as a public-led project)
      for (let k = 0; k < 4; k++) hb([0.12 + k * 0.08, 0.09, -0.08], [0.07, 0.1, 0.012], k % 2 ? 0xf2efe8 : 0x3e7c8c);
      ring([0.24, 0.1, -0.22], 0.14, 0x3e7c8c, [Math.PI / 2, 0, 0]);
      hb([0.24, 0.07, -0.22], [0.02, 0.06, 0.02], C.ink);
      // SW: a resident-led self-renewal block with a ribbon band
      b([-0.24, 0.24, 0.2], [0.24, 0.4, 0.2], 0xf6efe3);
      for (let r = 0; r < 3; r++) glow([-0.24, 0.12 + r * 0.11, 0.302], [0.16, 0.06, 0.004], 0x9fc4c6);
      hb([-0.24, 0.42, 0.2], [0.26, 0.03, 0.22], C.coral);
      // SE: MRT joint-development tower above a station entrance
      b([0.24, 0.36, 0.16], [0.2, 0.64, 0.2], 0xeef3f2);
      for (let r = 0; r < 4; r++) glow([0.24, 0.24 + r * 0.12, 0.262], [0.14, 0.06, 0.004], 0x9fc4c6);
      b([0.24, 0.07, 0.3], [0.22, 0.1, 0.08], 0x3e7c8c);
      glow([0.24, 0.07, 0.342], [0.12, 0.06, 0.004], 0xfff0c2);
      return true;
    }
    case "regen": {
      // 原基地再生循環: an old house leased out while the site is assembled, the city-led rebuild, and returned units looping back
      b([0, 0.03, 0], [0.98, 0.06, 0.7], 0xc7b08f);
      // left: old house with a hanging key tag (leased while waiting)
      b([-0.34, 0.18, -0.1], [0.24, 0.26, 0.22], 0xe2d2b8);
      p("hip", [-0.34, 0.36, -0.1], [0.28, 0.12, 0.26], 0xa34e34);
      glow([-0.34, 0.18, 0.012], [0.08, 0.1, 0.006], 0xfff0c2);
      hb([-0.24, 0.28, 0.02], [0.006, 0.08, 0.006], C.ink);
      b([-0.24, 0.22, 0.02], [0.05, 0.05, 0.012], C.yellow);
      // middle: the rebuild in progress
      for (const xx of [-0.1, 0.1]) for (const zz of [-0.22, -0.02]) hb([xx, 0.3, zz], [0.03, 0.5, 0.03], 0xb9b2a8);
      for (let k = 0; k < 2; k++) hb([0, 0.2 + k * 0.26, -0.12], [0.24, 0.025, 0.24], 0xc9c2b8);
      hb([0.0, 0.66, -0.3], [0.04, 0.6, 0.04], C.coral);
      hb([0.08, 0.95, -0.3], [0.34, 0.035, 0.04], C.coral);
      // right: finished new block with lit windows
      b([0.34, 0.32, -0.1], [0.22, 0.58, 0.22], 0xf6efe3);
      for (let r = 0; r < 4; r++) glow([0.34, 0.12 + r * 0.12, 0.012], [0.16, 0.06, 0.006], 0xfff0c2);
      // forward arrows (old house → rebuild → new block) and a return lane back to the start: units go back into the platform
      for (let j = 0; j < 3; j++) for (const sg of [-1, 1]) hb([-0.2 + j * 0.2, 0.07, 0.2 + sg * 0.02], [0.06, 0.004, 0.016], 0xffffff, [0, sg * 0.8, 0]);
      hb([0, 0.068, 0.34], [0.72, 0.004, 0.035], C.yellow);
      for (const sg of [-1, 1]) hb([-0.34, 0.07, 0.34 + sg * 0.022], [0.07, 0.004, 0.018], C.yellow, [0, -sg * 0.8, 0]);
      return true;
    }
    // ---------------- 菁英實習制度 (2026-11-05) ----------------
    case "oldapt": {
      // 補助深入專有: a classic four-storey walk-up with iron window grilles; four repairs shown on it: a façade patch on a
      // small scaffold, an outward-opening red fire door, exposed water and power pipes, and a stair lift on the side stair
      b([0, 0.03, 0], [0.98, 0.06, 0.74], 0xe0cdbb);
      b([-0.04, 0.4, -0.12], [0.6, 0.74, 0.36], 0xe6d6bf);
      hb([-0.04, 0.79, -0.12], [0.64, 0.04, 0.4], 0xc9b49a);
      for (const dx of [-0.2, 0.1]) cy([dx, 0.86, -0.18], 0.1, 0.1, 0x9aa6a6); // water tanks
      for (let r = 0; r < 4; r++)
        for (const dx of [-0.2, 0.0, 0.18]) {
          if (r === 2 && dx === 0.18) continue; // the façade patch sits here
          glow([dx - 0.04, 0.14 + r * 0.17, 0.062], [0.11, 0.09, 0.006], 0xb8cfcf);
          // iron grille cage: a thin frame with three bars, not a solid block
          for (const s2 of [-1, 1]) hb([dx - 0.04 + s2 * 0.065, 0.14 + r * 0.17, 0.085], [0.01, 0.11, 0.05], 0x8a8580);
          hb([dx - 0.04, 0.195 + r * 0.17, 0.085], [0.14, 0.01, 0.05], 0x8a8580);
          for (let k = -1; k <= 1; k++) hb([dx - 0.04 + k * 0.035, 0.14 + r * 0.17, 0.108], [0.006, 0.1, 0.006], 0x8a8580);
          hb([dx - 0.04, 0.084 + r * 0.17, 0.11], [0.15, 0.02, 0.012], [0x8fb37a, 0xf2b5c6, 0x9cc27a][(r + Math.round(dx * 10)) % 3]); // window-box plants
        }
      // 1 façade patch on a small scaffold
      hb([0.14, 0.48, 0.07], [0.15, 0.13, 0.012], 0xf6efe3);
      for (const dx of [0.06, 0.22]) hb([0.14 + dx - 0.14, 0.4, 0.14], [0.012, 0.42, 0.012], C.ink);
      hb([0.14, 0.4, 0.14], [0.18, 0.014, 0.08], wood);
      // 2 red fire door, swung outward, extinguisher beside it
      b([-0.2, 0.12, 0.08], [0.13, 0.22, 0.02], 0xd8432f, [0, -0.9, 0]);
      cy([-0.08, 0.06, 0.1], 0.04, 0.1, 0xd8432f);
      // 3 exposed pipes down the left side
      for (const [dz, c] of [[-0.02, 0x5f9aa6], [-0.08, 0xe8a33a]]) hb([-0.35, 0.42, dz], [0.022, 0.74, 0.022], c);
      b([-0.35, 0.3, -0.25], [0.03, 0.08, 0.06], 0x8a9aa6); // meter box
      // 4 external stair with a stair-lift rail and chair on the right
      for (let k = 0; k < 5; k++) b([0.34, 0.04 + k * 0.05, 0.02 - k * 0.07], [0.14, 0.05, 0.07], 0xd2c3ad);
      hb([0.42, 0.22, -0.12], [0.012, 0.012, 0.42], 0xe8c547, [0.62, 0, 0]);
      b([0.4, 0.27, -0.06], [0.07, 0.07, 0.07], 0x5f9aa6);
      plant(-0.42, 0.3, 0.2);
      return true;
    }
    case "serviceteam": {
      // 老宅行動服務團: a service van at an old doorway, three team members in vests, a one-stop desk whose screen matches a repair plan
      b([0, 0.03, 0], [0.94, 0.06, 0.7], 0xe0cdbb);
      b([-0.26, 0.26, -0.2], [0.34, 0.46, 0.2], 0xe6d6bf); // old apartment front
      b([-0.26, 0.11, -0.095], [0.1, 0.16, 0.012], 0x8a6a4e);
      for (const dx of [-0.36, -0.16]) b([-0.26 + dx + 0.26, 0.34, -0.085], [0.08, 0.08, 0.03], 0x5b5550);
      // van
      b([0.24, 0.15, -0.16], [0.36, 0.16, 0.18], 0xf6efe3);
      b([0.36, 0.2, -0.16], [0.12, 0.12, 0.17], 0xf6efe3);
      glow([0.4, 0.22, -0.16], [0.04, 0.07, 0.15], 0x9fc4c6);
      hb([0.2, 0.15, -0.068], [0.28, 0.04, 0.006], C.coral);
      for (const dx of [0.12, 0.36]) p("cylinder", [dx, 0.07, -0.07], [0.08, 0.03, 0.08], C.ink, [Math.PI / 2, 0, 0]);
      // team in vests
      for (let k = 0; k < 3; k++) {
        const xx = -0.3 + k * 0.16;
        person(xx, 0.08, 0.34);
        hb([xx, 0.17, 0.12], [0.1, 0.1, 0.012], C.yellow);
      }
      // one-stop desk with a matching screen
      b([0.24, 0.16, 0.2], [0.26, 0.03, 0.14], wood);
      for (const d of [-0.1, 0.1]) hb([0.24 + d, 0.08, 0.2], [0.015, 0.15, 0.1], C.ink);
      b([0.24, 0.27, 0.15], [0.16, 0.1, 0.012], C.ink);
      glow([0.21, 0.27, 0.158], [0.05, 0.06, 0.003], C.yellow);
      glow([0.27, 0.27, 0.158], [0.05, 0.06, 0.003], 0x8fb37a);
      return true;
    }
    case "threshold": {
      // 修繕門檻調降: a law book on a lectern and a hurdle bar lowered to ankle height so a resident steps over to the repair ladder
      b([0, 0.03, 0], [0.9, 0.06, 0.66], 0xe6d6c6);
      b([-0.26, 0.14, -0.12], [0.12, 0.22, 0.1], wood);
      b([-0.26, 0.28, -0.12], [0.22, 0.05, 0.16], 0x3e7c8c, [-0.35, 0, 0]);
      hb([-0.26, 0.31, -0.11], [0.18, 0.012, 0.13], 0xfbf6ee, [-0.35, 0, 0]);
      // hurdle: tall posts, the bar slid down near the floor (ghost marks of the old height)
      for (const d of [-0.16, 0.16]) hb([0.02 + d, 0.22, 0.06], [0.025, 0.4, 0.025], C.ink);
      hb([0.02, 0.1, 0.06], [0.34, 0.03, 0.03], C.coral);
      hb([0.02, 0.38, 0.06], [0.34, 0.012, 0.008], 0xd9cbb4);
      p("tetra", [0.02, 0.27, 0.06], [0.05, 0.08, 0.02], C.coral, [Math.PI, 0, 0]);
      person(0.02, 0.2, 0.34);
      // repair ladder and paint pot on the right
      for (const d of [-0.05, 0.05]) hb([0.34 + d, 0.26, -0.16], [0.015, 0.46, 0.015], wood, [0.25, 0, 0]);
      for (let k = 0; k < 4; k++) hb([0.34, 0.1 + k * 0.1, -0.17 + k * 0.026], [0.1, 0.012, 0.012], wood);
      cy([0.36, 0.06, 0.08], 0.08, 0.08, 0x5f9aa6);
      return true;
    }
    case "vacantlease": {
      // 空屋包租: a row of three town houses: two lit and tagged with keys (leased), one with its shutter half raised; a coin stack
      b([0, 0.03, 0], [0.96, 0.06, 0.7], 0xe0cdbb);
      for (let k = 0; k < 3; k++) {
        const xx = -0.3 + k * 0.3;
        b([xx, 0.28, -0.14], [0.26, 0.48, 0.26], [0xe6d6bf, 0xf2e8d8, 0xe2cdb3][k]);
        p("hip", [xx, 0.58, -0.14], [0.28, 0.12, 0.28], k === 1 ? C.coral : 0xa34e34);
        if (k < 2) {
          glow([xx, 0.38, -0.006], [0.14, 0.1, 0.006], 0xfff0c2);
          glow([xx, 0.14, -0.006], [0.12, 0.14, 0.006], 0xfff0c2);
          hb([xx + 0.1, 0.24, 0.0], [0.006, 0.08, 0.006], C.ink);
          b([xx + 0.1, 0.18, 0.0], [0.05, 0.05, 0.012], C.yellow);
        } else {
          hb([xx, 0.18, -0.004], [0.2, 0.14, 0.008], 0x8a9aa6); // half-raised shutter
          glow([xx, 0.08, -0.006], [0.18, 0.06, 0.006], 0xfff0c2);
          person(xx - 0.06, 0.12, 0.32);
        }
      }
      // big key on the forecourt and a small coin stack (tax relief)
      ring([-0.12, 0.08, 0.24], 0.12, C.yellow, [Math.PI / 2, 0, 0]);
      hb([0.0, 0.075, 0.24], [0.18, 0.02, 0.03], C.yellow);
      hb([0.07, 0.075, 0.27], [0.02, 0.02, 0.04], C.yellow);
      for (let k = 0; k < 3; k++) cy([0.3, 0.075 + k * 0.025, 0.24], 0.1, 0.02, C.yellow);
      return true;
    }
    case "socialsources": {
      // 多元取得社宅: a new renewal tower whose lower floors are kept as social housing (teal band) with a community room below
      b([0, 0.03, 0], [0.94, 0.06, 0.72], 0xd9cbb4);
      b([0.08, 0.6, -0.12], [0.36, 1.12, 0.34], 0xf2f0ea);
      for (let r = 0; r < 7; r++) glow([0.08, 0.22 + r * 0.13, 0.052], [0.28, 0.06, 0.006], r < 2 ? 0xfff0c2 : 0x9fc4c6);
      hb([0.08, 0.34, 0.06], [0.38, 0.26, 0.012], 0x58a6a6); // social housing floors band
      for (const r of [0, 1]) hb([0.08, 0.27 + r * 0.13, 0.085], [0.34, 0.012, 0.05], 0xf6efe3);
      b([0.08, 0.08, 0.13], [0.36, 0.1, 0.12], 0xe8c547); // community room
      glow([0.08, 0.08, 0.192], [0.26, 0.06, 0.004], 0xfff0c2);
      hb([0.08, 1.18, -0.12], [0.38, 0.03, 0.36], 0xcfbfa6);
      // gift ribbon tied across the lower floors: the donated / retained units
      hb([0.27, 0.34, -0.12], [0.012, 0.3, 0.36], C.coral);
      sphere([0.28, 0.5, 0.0], [0.04, 0.05, 0.08], C.coral);
      person(-0.26, 0.2, 0.34);
      person(-0.14, 0.3, 0.3);
      plant(-0.34, -0.2, 0.26);
      return true;
    }
    case "familyhomes": {
      // 婚育、青年與科技宅: three social-housing blocks: a family block with a playground, a youth block with bikes, a glass tech block
      b([0, 0.03, 0], [0.98, 0.06, 0.74], 0xe0cdbb);
      const blocks = [[-0.32, 0x9fc4e6, 0.56], [0.0, 0xe8c547, 0.66], [0.32, 0xd5ecee, 0.8]];
      for (const [xx, c, hh] of blocks) {
        b([xx, hh / 2 + 0.04, -0.18], [0.24, hh, 0.22], xx > 0.2 ? 0xeef3f2 : 0xf6efe3);
        for (let r = 0; r < Math.floor(hh / 0.14); r++) hb([xx, 0.12 + r * 0.14, -0.06], [0.22, 0.014, 0.05], c);
        for (let r = 0; r < Math.floor(hh / 0.14); r++) glow([xx, 0.16 + r * 0.14, -0.068], [0.16, 0.06, 0.004], 0xfff0c2);
      }
      p("tetra", [0.32, 0.91, -0.18], [0.08, 0.1, 0.08], C.yellow);
      // playground in front of the family block, bikes in front of the youth block
      p("dome", [-0.34, 0.06, 0.18], [0.16, 0.08, 0.16], C.coral);
      hb([-0.22, 0.12, 0.2], [0.03, 0.18, 0.03], C.ink);
      hb([-0.22, 0.1, 0.26], [0.03, 0.012, 0.14], 0xe8c547, [0.6, 0, 0]);
      person(-0.3, 0.32, 0.3);
      person(-0.42, 0.3, 0.22);
      for (let k = 0; k < 2; k++) ring([0.0 + k * 0.08, 0.08, 0.2], 0.1, C.ink, [0, 0, 0]);
      person(0.06, 0.32, 0.34);
      person(0.3, 0.26, 0.34);
      return true;
    }
    case "admin": {
      b([-0.15, 0.22, -0.1], [0.2, 0.44, 0.26], 0x8a9aa6);
      for (let k = 0; k < 3; k++) hb([-0.15, 0.1 + k * 0.14, 0.035], [0.12, 0.012, 0.01], C.ink);
      b([0.15, 0.25, 0], [0.32, 0.04, 0.22], wood);
      for (const s of [-1, 1]) hb([0.15 + s * 0.13, 0.12, 0], [0.02, 0.24, 0.18], 0xd2c3ad);
      for (let k = 0; k < 3; k++) hb([0.08 + k * 0.01, 0.29 + k * 0.02, 0.02], [0.14, 0.015, 0.1], 0xffffff);
      cy([0.25, 0.3, 0.05], 0.05, 0.06, C.coral);
      seat(0.15, 0.25);
      return true;
    }
    // ---------------- 高餐大旅館管理系專屬精緻微縮建築 (NKUHT Hospitality Collection) ----------------
    case "qunxianHotel": {
      // 群賢會館實習旅館：歐式古典石材基座、五層玻璃幕牆客房樓、迎賓車道金銅雨棚(Porte-cochère)、旋轉門與黃銅行李推車
      const brass = 0xd8a848, marble = 0xf7f2e7, facade = 0xede2cf;
      b([0, 0.035, 0.02], [1.02, 0.07, 0.78], stone);
      // 迎賓紅毯與圓弧車道
      hb([0, 0.072, 0.26], [0.24, 0.008, 0.28], 0xb83a3a);
      // 主樓與左右對稱翼樓
      b([0, 0.42, -0.08], [0.54, 0.72, 0.4], marble);
      for (const s of [-1, 1]) {
        b([s * 0.34, 0.36, -0.06], [0.24, 0.6, 0.36], facade);
        p("hip", [s * 0.34, 0.7, -0.06], [0.28, 0.09, 0.4], 0x455a64);
      }
      // 屋頂古典山牆與飯店發光招牌
      p("hip", [0, 0.82, -0.08], [0.6, 0.11, 0.44], 0x37474f);
      b([0, 0.82, 0.12], [0.34, 0.09, 0.04], C.ink);
      glow([0, 0.82, 0.143], [0.28, 0.05, 0.008], 0xffe49e);
      // 客房樓層落地窗與金色窗框陽台
      for (let r = 0; r < 4; r++) {
        const yy = 0.22 + r * 0.14;
        for (let k = -1; k <= 1; k++) {
          glow([k * 0.14, yy, 0.122], [0.09, 0.09, 0.008], r % 2 === 0 ? 0xfff0c2 : 0xd5ecee);
          hb([k * 0.14, yy - 0.045, 0.13], [0.11, 0.012, 0.024], brass);
        }
        for (const s of [-1, 1]) {
          glow([s * 0.34, yy - 0.02, 0.122], [0.12, 0.08, 0.008], 0xfff0c2);
          hb([s * 0.34, yy - 0.06, 0.13], [0.14, 0.012, 0.02], brass);
        }
      }
      // 金銅迎賓雨棚 (Porte-cochère) 與四根古典立柱 + 旋轉門
      b([0, 0.22, 0.25], [0.38, 0.035, 0.22], brass);
      hb([0, 0.242, 0.25], [0.34, 0.015, 0.18], 0x37474f);
      for (const sx of [-0.15, 0.15]) for (const sz of [0.16, 0.33]) cy([sx, 0.13, sz], 0.028, 0.18, marble);
      cy([0, 0.12, 0.12], 0.12, 0.14, glass);
      glow([0, 0.12, 0.12], [0.14, 0.13, 0.02], 0xfff3cc);
      // 黃銅鳥籠行李推車 (Bellhop Cart) + 行李箱
      b([0.26, 0.09, 0.28], [0.12, 0.02, 0.08], brass);
      ring([0.26, 0.16, 0.28], 0.06, brass, [0, 0, 0]);
      b([0.25, 0.13, 0.28], [0.07, 0.06, 0.05], C.coral);
      b([0.28, 0.12, 0.29], [0.04, 0.05, 0.04], teal);
      person(-0.18, 0.28, 0.34);
      person(0.16, 0.32, 0.34);
      plant(-0.42, 0.26, 0.22);
      plant(0.42, 0.26, 0.22);
      return true;
    }
    case "conciergeDesk": {
      // 客務管理與禮賓服務檯：大理石弧形櫃台、金色鑰匙徽章、雙PMS入住終端機、服務鈴與房卡架
      const brass = 0xd8a848, marble = 0xf7f2e7;
      b([0, 0.03, 0], [0.92, 0.06, 0.68], 0xe9dcc4);
      // 背牆與金鑰匙標誌 + 世界時鐘
      b([0, 0.34, -0.22], [0.78, 0.56, 0.06], 0x2c3e50);
      hb([0, 0.63, -0.21], [0.82, 0.03, 0.09], brass);
      for (const k of [-0.24, 0, 0.24]) {
        p("cylinder", [k, 0.48, -0.185], [0.1, 0.015, 0.1], brass, [Math.PI / 2, 0, 0]);
        p("cylinder", [k, 0.48, -0.18], [0.08, 0.015, 0.08], 0xfff8ee, [Math.PI / 2, 0, 0]);
      }
      // 交叉金鑰匙浮雕
      hb([0, 0.32, -0.182], [0.16, 0.02, 0.01], brass, [0, 0, 0.65]);
      hb([0, 0.32, -0.182], [0.16, 0.02, 0.01], brass, [0, 0, -0.65]);
      // 大理石禮賓主櫃台
      b([0, 0.15, 0.04], [0.68, 0.2, 0.16], marble);
      hb([0, 0.255, 0.04], [0.72, 0.025, 0.2], wood);
      hb([0, 0.15, 0.123], [0.6, 0.14, 0.008], brass);
      // 雙 PMS 螢幕 + 飯店服務鈴 🛎️
      for (const sx of [-0.18, 0.18]) {
        b([sx, 0.31, 0.02], [0.12, 0.09, 0.015], C.ink);
        glow([sx, 0.31, 0.03], [0.1, 0.07, 0.005], 0xd5ecee);
      }
      p("dome", [0, 0.275, 0.08], [0.06, 0.045, 0.06], brass);
      bulb([0, 0.3, 0.08], 0.02, 0xffe49e);
      person(-0.16, -0.08, 0.36);
      person(0.16, -0.08, 0.36);
      person(0.02, 0.24, 0.36);
      return true;
    }
    case "hotelAdminCenter": {
      // 群賢會館營運中樞：住房率與收益管理儀表板牆、實習幹部圓桌、會館立體模型
      b([0, 0.03, 0], [0.92, 0.06, 0.7], 0xe6dccb);
      b([0, 0.34, -0.24], [0.76, 0.52, 0.06], C.ink);
      glow([-0.18, 0.38, -0.205], [0.3, 0.26, 0.006], 0x9fc4c6);
      glow([0.2, 0.42, -0.205], [0.28, 0.18, 0.006], 0xffe49e);
      for (let k = 0; k < 4; k++) hb([-0.28 + k * 0.06, 0.3 + k * 0.025, -0.2], [0.04, 0.06 + k * 0.05, 0.008], [teal, teal2, yel, C.coral][k]);
      cy([0, 0.17, 0.08], 0.38, 0.03, wood);
      cy([0, 0.09, 0.08], 0.06, 0.15, C.ink);
      b([0, 0.23, 0.08], [0.14, 0.1, 0.1], 0xf7f2e7);
      p("hip", [0, 0.3, 0.08], [0.16, 0.05, 0.12], C.coral);
      for (const a of [0.4, 1.9, 3.5, 5.0]) person(Math.cos(a) * 0.27, 0.08 + Math.sin(a) * 0.22, 0.32);
      return true;
    }
    case "housekeepingSuite": {
      // 房務實務示範套房：星級雙床鋪設（雪白床單、香檳金床尾巾、抱枕、床頭閱讀燈）與專業房務布巾推車
      const brass = 0xd8a848;
      b([0, 0.03, 0], [0.96, 0.06, 0.74], 0xe8dfd1);
      // 房間木質床頭背板與暖光燈帶
      b([-0.1, 0.28, -0.28], [0.68, 0.44, 0.05], wood);
      glow([-0.1, 0.46, -0.25], [0.62, 0.03, 0.008], 0xffe49e);
      // 兩張星級標準單人床 (Twin Beds)
      for (const bx of [-0.26, 0.06]) {
        b([bx, 0.12, -0.04], [0.24, 0.12, 0.42], 0xfbf8f3); // 床墊
        b([bx, 0.185, 0.08], [0.245, 0.025, 0.14], brass); // 金色床尾巾 (Bed Runner)
        b([bx - 0.05, 0.2, -0.18], [0.09, 0.045, 0.07], 0xffffff, [0.25, 0, 0]); // 枕頭1
        b([bx + 0.05, 0.2, -0.18], [0.09, 0.045, 0.07], 0xffffff, [0.25, 0, 0]); // 枕頭2
        b([bx, 0.2, -0.12], [0.08, 0.04, 0.05], C.coral); // 裝飾抱枕
      }
      // 床頭櫃與暖光檯燈
      b([-0.1, 0.12, -0.2], [0.08, 0.12, 0.08], wood);
      cy([-0.1, 0.21, -0.2], 0.02, 0.06, brass);
      bulb([-0.1, 0.25, -0.2], 0.055, 0xffe49e);
      // 專業房務工作推車 (Housekeeping Cart) 與潔白折疊毛巾塔
      b([0.34, 0.18, 0.1], [0.16, 0.26, 0.24], 0x37474f);
      for (let k = 0; k < 3; k++) b([0.34, 0.12 + k * 0.07, 0.1], [0.13, 0.025, 0.16], 0xffffff);
      for (const dz of [0.0, 0.2]) cy([0.34, 0.05, dz], 0.05, 0.03, C.ink);
      person(0.22, 0.22, 0.34);
      return true;
    }
    case "trainingRotation": {
      // 群賢會館輪調實務：四大部門（前檯、房務、餐飲、後勤）環狀輪調學習工作站与金色循環光環
      cy([0, 0.03, 0], 0.94, 0.06, 0xe9dcc4);
      ring([0, 0.07, 0], 0.36, 0xd8a848);
      const cols = [teal, C.coral, yel, 0x6f7fb5];
      for (let k = 0; k < 4; k++) {
        const a = (k / 4) * Math.PI * 2 + Math.PI / 4;
        const xx = Math.cos(a) * 0.28, zz = Math.sin(a) * 0.28;
        b([xx, 0.15, zz], [0.18, 0.18, 0.14], cols[k], [0, -a, 0]);
        glow([xx, 0.26, zz], [0.12, 0.06, 0.02], 0xfff0c2);
        person(xx * 0.72, zz * 0.72, 0.3);
      }
      cy([0, 0.22, 0], 0.14, 0.32, 0xf7f2e7);
      bulb([0, 0.42, 0], 0.08, 0xffe49e);
      return true;
    }
    case "banquetVenue": {
      // 群賢廳國際宴會與會議廳：水晶吊燈、圓桌紅毯宴席、香檳塔與致詞講台
      b([0, 0.03, 0], [0.96, 0.06, 0.74], 0xe6d6c6);
      b([0, 0.36, -0.28], [0.84, 0.56, 0.05], 0xf7f2e7);
      for (const sx of [-0.32, 0, 0.32]) hb([sx, 0.36, -0.25], [0.04, 0.52, 0.02], 0xd8a848);
      // 晶燦水晶吊燈
      cy([0, 0.58, -0.02], 0.22, 0.04, 0xd8a848);
      for (let k = 0; k < 6; k++) {
        const a = (k / 6) * Math.PI * 2;
        bulb([Math.cos(a) * 0.1, 0.53, -0.02 + Math.sin(a) * 0.1], 0.045, 0xfff3cc);
      }
      // 兩桌星級圓桌宴席
      for (const tx of [-0.22, 0.22]) {
        cy([tx, 0.14, 0.1], 0.26, 0.14, 0x9a3b3b); // 勃根地紅桌巾
        cy([tx, 0.215, 0.1], 0.27, 0.015, 0xffffff);
        sphere([tx, 0.25, 0.1], 0.05, yel); // 桌花
        for (let k = 0; k < 4; k++) {
          const a = (k / 4) * Math.PI * 2 + 0.3;
          cy([tx + Math.cos(a) * 0.09, 0.23, 0.1 + Math.sin(a) * 0.09], 0.04, 0.008, 0xf7f2e7);
        }
      }
      person(-0.02, -0.14, 0.36);
      return true;
    }
    case "fineDiningClass": {
      // 西餐與宴會細緻服務示範廳：星級白桌巾西餐桌、銀製餐蓋(Cloche)、桌邊服務推車(Gueridon)與侍酒服務
      b([0, 0.03, 0], [0.92, 0.06, 0.7], 0xe8dfd1);
      cy([-0.08, 0.16, 0.02], 0.36, 0.18, 0xffffff);
      cy([-0.08, 0.255, 0.02], 0.38, 0.018, 0xf7f2e7);
      // 銀製圓頂餐蓋與紅酒杯
      p("dome", [-0.08, 0.27, 0.02], [0.14, 0.09, 0.14], 0xd0d7de);
      sphere([-0.08, 0.36, 0.02], 0.025, 0xd8a848);
      for (const [dx, dz] of [[-0.2, 0.02], [0.04, 0.02], [-0.08, -0.1], [-0.08, 0.14]]) {
        cy([dx, 0.27, dz], 0.05, 0.008, 0xd8a848);
        cy([dx + 0.03, 0.29, dz], 0.02, 0.04, 0xb83a3a);
      }
      // 桌邊服務推車 (Gueridon Trolley)
      b([0.3, 0.15, 0.08], [0.2, 0.18, 0.14], wood);
      hb([0.3, 0.25, 0.08], [0.22, 0.015, 0.16], 0xd8a848);
      person(0.28, -0.1, 0.36);
      person(-0.32, 0.06, 0.34);
      return true;
    }
    case "sommelierCellar": {
      // 葡萄酒品評與侍酒師酒窖：法國橡木桶陣、背光恆溫酒架、水晶醒酒器與高腳品酒桌
      const oak = 0x9c6b43, wine = 0x7a1f2b;
      b([0, 0.03, 0], [0.94, 0.06, 0.72], 0xd9cbb4);
      // 背光恆溫紅酒牆
      b([0, 0.35, -0.24], [0.78, 0.56, 0.08], 0x3b2a22);
      glow([0, 0.35, -0.195], [0.7, 0.46, 0.008], 0xffe0a3);
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 5; c++) {
          hb([-0.26 + c * 0.13, 0.18 + r * 0.11, -0.185], [0.08, 0.025, 0.025], wine);
        }
      }
      // 兩座雙層橫臥法國橡木酒桶
      for (const by of [0.14, 0.28]) {
        p("cylinder", [-0.26, by, 0.08], [0.14, 0.22, 0.14], oak, [0, 0, Math.PI / 2]);
        ring([-0.32, by, 0.08], 0.072, C.ink, [0, Math.PI / 2, 0]);
        ring([-0.2, by, 0.08], 0.072, C.ink, [0, Math.PI / 2, 0]);
      }
      // 侍酒師品評高腳桌 + 醒酒器與酒瓶
      cy([0.14, 0.16, 0.12], 0.28, 0.22, wood);
      cy([0.14, 0.28, 0.12], 0.32, 0.025, 0xf7f2e7);
      cy([0.08, 0.35, 0.1], 0.04, 0.12, 0x2f5a3b); // 葡萄酒瓶
      sphere([0.18, 0.32, 0.14], [0.06, 0.05, 0.06], wine); // 水晶醒酒器
      cy([0.24, 0.32, 0.08], 0.025, 0.05, glass);
      person(0.34, 0.16, 0.36);
      return true;
    }
    case "beverageCertBar": {
      // 調酒與咖啡拉花專業證照吧台：L型大理石吧台、雙孔義式咖啡機、背光調酒酒牆與雪克杯
      b([0, 0.03, 0], [0.94, 0.06, 0.7], 0xe4d7c5);
      b([0, 0.34, -0.24], [0.76, 0.54, 0.06], C.ink);
      for (let r = 0; r < 3; r++) {
        glow([0, 0.22 + r * 0.13, -0.205], [0.66, 0.07, 0.006], [0x9fd3de, 0xffe49e, 0xf2b5c6][r]);
      }
      // 大理石吧台與高腳椅
      b([0, 0.16, 0.04], [0.7, 0.22, 0.16], 0x2c3e50);
      hb([0, 0.28, 0.04], [0.74, 0.025, 0.2], 0xf7f2e7);
      // 雙孔義式濃縮咖啡機
      b([-0.18, 0.34, 0.02], [0.18, 0.11, 0.12], C.coral);
      hb([-0.18, 0.4, 0.02], [0.19, 0.015, 0.13], 0xd0d7de);
      // 調酒雪克杯與馬丁尼杯
      cy([0.14, 0.33, 0.04], 0.04, 0.09, 0xd0d7de);
      p("cone", [0.24, 0.33, 0.04], [0.05, 0.04, 0.05], 0x9fd3de, [Math.PI, 0, 0]);
      for (const sx of [-0.22, 0, 0.22]) {
        cy([sx, 0.12, 0.24], 0.08, 0.16, 0xd8a848);
        cy([sx, 0.2, 0.24], 0.1, 0.03, C.coral);
      }
      person(0.02, -0.1, 0.36);
      return true;
    }
    case "procurementLab": {
      // 餐旅採購與驗收實驗室：冷鏈驗收檯、數位磅秤、生鮮食材籃、RFID品管終端機與倉儲層架
      b([0, 0.03, 0], [0.94, 0.06, 0.7], 0xe2e8e6);
      // 不鏽鋼倉儲架
      b([-0.26, 0.28, -0.2], [0.34, 0.48, 0.16], 0x8a9aa6);
      for (let r = 0; r < 3; r++) {
        b([-0.32, 0.14 + r * 0.14, -0.18], [0.12, 0.07, 0.12], C.coral);
        b([-0.18, 0.14 + r * 0.14, -0.18], [0.12, 0.07, 0.12], green);
      }
      // 驗收工作檯 + 電子磅秤 + 螢幕
      b([0.14, 0.15, 0.04], [0.46, 0.2, 0.2], 0xd0d7de);
      b([0.04, 0.27, 0.04], [0.12, 0.04, 0.12], 0xf7f2e7);
      sphere([0.04, 0.31, 0.04], 0.05, yel);
      b([0.24, 0.31, 0.02], [0.14, 0.1, 0.02], C.ink);
      glow([0.24, 0.31, 0.032], [0.12, 0.08, 0.005], 0x9fd3de);
      person(0.14, -0.14, 0.36);
      return true;
    }
    // ---------------- 10 位專任師長專屬研究室 (NKUHT Faculty Studios) ----------------
    case "chairSuite": {
      // 謝文欽主任研究室（chairSuite 模型）
      b([0, 0.03, 0], [0.94, 0.06, 0.72], 0xe9dcc4);
      b([0, 0.34, -0.24], [0.8, 0.54, 0.06], 0x2c3e50);
      glow([0, 0.38, -0.205], [0.46, 0.28, 0.006], 0xffe49e);
      ring([0, 0.38, -0.195], 0.12, C.coral, [0, 0, 0]);
      b([0, 0.16, 0.02], [0.46, 0.18, 0.18], wood);
      hb([0, 0.255, 0.02], [0.5, 0.025, 0.22], 0xd8a848);
      person(0, -0.12, 0.38);
      seat(-0.3, 0.18);
      seat(0.3, 0.18);
      plant(-0.36, -0.16, 0.26);
      return true;
    }
    case "profLibrary": {
      // 楊仁德教授研究室（profLibrary 模型）
      b([0, 0.03, 0], [0.92, 0.06, 0.7], 0xe6d6c6);
      b([0, 0.34, -0.24], [0.78, 0.56, 0.08], wood);
      for (let r = 0; r < 4; r++) {
        for (let k = 0; k < 6; k++) {
          b([-0.3 + k * 0.12, 0.14 + r * 0.12, -0.19], [0.09, 0.08, 0.04], [C.coral, teal, yel, 0x6f7fb5, 0x8fb37a, 0xf7f2e7][(r + k) % 6]);
        }
      }
      b([-0.08, 0.16, 0.08], [0.42, 0.18, 0.2], wood);
      sphere([0.28, 0.24, 0.08], 0.1, teal2);
      ring([0.28, 0.24, 0.08], 0.12, 0xd8a848, [0, 0, 0.35]);
      person(-0.08, -0.08, 0.36);
      return true;
    }
    case "execStudio": {
      // 沙荃老師研究室（execStudio 模型）
      b([0, 0.03, 0], [0.92, 0.06, 0.7], 0xe9dcc4);
      cy([0, 0.17, 0], 0.42, 0.035, wood);
      cy([0, 0.09, 0], 0.07, 0.15, C.ink);
      glow([0, 0.19, 0], [0.22, 0.01, 0.22], 0xffe49e);
      for (let k = 0; k < 5; k++) {
        const a = (k / 5) * Math.PI * 2 + 0.3;
        seat(Math.cos(a) * 0.3, Math.sin(a) * 0.28);
      }
      person(0, -0.26, 0.36);
      return true;
    }
    case "etiquetteSalon": {
      // 謝家黎老師研究室（etiquetteSalon 模型）
      b([0, 0.03, 0], [0.94, 0.06, 0.72], 0xf4ebe1);
      hb([0, 0.065, 0.14], [0.76, 0.008, 0.18], 0xb83a3a); // 禮儀紅毯
      for (const sx of [-0.24, 0.24]) {
        b([sx, 0.32, -0.22], [0.24, 0.48, 0.04], 0xd8a848);
        glow([sx, 0.32, -0.195], [0.2, 0.42, 0.006], 0xd5ecee); // 落地全身鏡
      }
      cy([0, 0.16, -0.16], 0.16, 0.18, 0xf7f2e7);
      sphere([0, 0.28, -0.16], 0.07, C.coral); // 花藝
      person(-0.14, 0.14, 0.36);
      person(0.16, 0.14, 0.34);
      return true;
    }
    case "digitalLab": {
      // 黃啟揚老師研究室（digitalLab 模型）
      b([0, 0.03, 0], [0.94, 0.06, 0.7], 0xe2ebea);
      for (const [sx, ry] of [[-0.22, 0.25], [0, 0], [0.22, -0.25]]) {
        b([sx, 0.34, -0.18], [0.2, 0.16, 0.025], C.ink, [0, ry, 0]);
        glow([sx, 0.34, -0.165], [0.18, 0.13, 0.006], 0x7fd0d8);
      }
      b([0, 0.15, 0.02], [0.5, 0.18, 0.18], 0xf7f2e7);
      // 自助入住 Kiosk 機台
      b([0.34, 0.24, 0.12], [0.12, 0.36, 0.08], C.ink);
      glow([0.34, 0.28, 0.163], [0.09, 0.16, 0.005], 0xffe49e);
      person(-0.06, 0.18, 0.36);
      return true;
    }
    case "financeCenter": {
      // 游明鳳老師研究室（financeCenter 模型）
      b([0, 0.03, 0], [0.94, 0.06, 0.7], 0xe9dcc4);
      b([0, 0.34, -0.24], [0.78, 0.52, 0.06], 0xf7f2e7);
      const bars = [0.12, 0.2, 0.28, 0.38];
      bars.forEach((hh, k) => b([-0.24 + k * 0.11, 0.12 + hh / 2, -0.19], [0.07, hh, 0.04], [teal2, teal, yel, 0xd8a848][k]));
      b([0.22, 0.36, -0.19], [0.22, 0.18, 0.03], C.ink);
      glow([0.22, 0.36, -0.172], [0.19, 0.14, 0.005], 0xffe49e);
      b([0, 0.15, 0.08], [0.46, 0.18, 0.18], wood);
      for (let k = 0; k < 3; k++) cy([0.28, 0.08 + k * 0.03, 0.18], 0.09, 0.025, 0xd8a848);
      person(-0.08, 0.22, 0.36);
      return true;
    }
    case "internHub": {
      // 謝金龍老師研究室（internHub 模型）
      b([0, 0.03, 0], [0.94, 0.06, 0.72], 0xe8dfd1);
      b([0, 0.34, -0.24], [0.78, 0.52, 0.06], teal);
      glow([0, 0.34, -0.205], [0.68, 0.42, 0.006], 0xd5ecee);
      for (const [px, py] of [[-0.2, 0.42], [0.0, 0.36], [0.18, 0.44], [-0.08, 0.26], [0.22, 0.28]]) {
        bulb([px, py, -0.195], 0.04, C.coral);
      }
      cy([0, 0.16, 0.1], 0.28, 0.03, wood);
      seat(-0.24, 0.12);
      seat(0.24, 0.12);
      person(-0.16, 0.14, 0.34);
      person(0.16, 0.14, 0.34);
      return true;
    }
    case "strategyLab": {
      // 許孟鈞老師研究室（strategyLab 模型）
      b([0, 0.03, 0], [0.94, 0.06, 0.7], 0xe6dccb);
      b([0, 0.14, 0], [0.68, 0.16, 0.42], wood);
      hb([0, 0.225, 0], [0.62, 0.015, 0.36], 0xd5ecee);
      const tws = [[-0.18, 0.18, teal], [0, 0.26, 0xd8a848], [0.18, 0.22, C.coral]];
      for (const [tx, th, tc] of tws) {
        b([tx, 0.23 + th / 2, 0], [0.1, th, 0.1], 0xf7f2e7);
        hb([tx, 0.23 + th + 0.015, 0], [0.12, 0.025, 0.12], tc);
      }
      person(-0.34, 0.18, 0.36);
      person(0.34, 0.18, 0.36);
      return true;
    }
    case "clubSuite": {
      // 張慧貞老師研究室（clubSuite 模型）
      b([0, 0.03, 0], [0.96, 0.06, 0.72], 0xdce8dc);
      hb([-0.16, 0.065, 0.06], [0.46, 0.015, 0.36], 0x7fd0d8); // 俱樂部水池
      p("cone6", [-0.18, 0.36, -0.14], [0.36, 0.14, 0.36], 0xd8a848);
      cy([-0.18, 0.18, -0.14], 0.03, 0.3, wood);
      b([0.26, 0.26, -0.1], [0.28, 0.36, 0.04], 0xf7f2e7);
      glow([0.26, 0.28, -0.075], [0.22, 0.24, 0.006], 0xffe49e);
      person(0.22, 0.14, 0.36);
      return true;
    }
    case "sommelierPavilion": {
      // 盧小琴老師研究室（sommelierPavilion 模型）
      b([0, 0.03, 0], [0.94, 0.06, 0.72], 0xe8dfd1);
      for (const sx of [-0.32, 0.32]) cy([sx, 0.26, -0.16], 0.03, 0.44, wood);
      hb([0, 0.48, -0.16], [0.74, 0.03, 0.26], wood);
      for (let k = 0; k < 5; k++) sphere([-0.28 + k * 0.14, 0.5, -0.16], 0.06, green);
      b([0, 0.16, 0.06], [0.48, 0.2, 0.16], 0x7a1f2b);
      hb([0, 0.265, 0.06], [0.52, 0.02, 0.2], 0xf7f2e7);
      p("cylinder", [-0.3, 0.14, 0.14], [0.14, 0.2, 0.14], 0x9c6b43, [0, 0, Math.PI / 2]);
      person(0, -0.1, 0.36);
      return true;
    }
    // ---------------- 24 家菁英實習 3.0 合作頂級酒店與渡假村地標 ----------------
    case "luxuryHotelTwin": {
      // 台北文華東方酒店（歐式古典孟莎頂雙翼宮殿）& 台北W飯店（時尚霓虹玻璃摩天塔與碧波泳池）
      b([0, 0.03, 0], [0.98, 0.06, 0.78], stone);
      // 左：台北文華東方（古典米白石材 + 深灰孟莎斜頂 + 金色扇形冠頂 + 圓拱門廳）
      b([-0.24, 0.38, -0.06], [0.38, 0.64, 0.34], 0xf3ead8);
      p("hip", [-0.24, 0.75, -0.06], [0.42, 0.14, 0.38], 0x37474f);
      p("dome", [-0.24, 0.84, -0.06], [0.16, 0.1, 0.16], 0xd8a848);
      for (let k = -2; k <= 2; k++) bulb([-0.24 + k * 0.05, 0.82, 0.11], 0.024, 0xd8a848); // 五星金芒
      for (let r = 0; r < 4; r++) {
        for (const dx of [-0.11, 0, 0.11]) glow([-0.24 + dx, 0.16 + r * 0.13, 0.113], [0.06, 0.08, 0.006], 0xfff0c2);
      }
      // 右：台北W飯店（萬豪集團 W Hotels 時尚玻璃帷幕高塔 + W珊瑚紅標誌 + WET戶外泳池露台）
      b([0.24, 0.48, -0.08], [0.34, 0.84, 0.32], 0xe3ebea);
      for (let r = 0; r < 6; r++) glow([0.24, 0.14 + r * 0.125, 0.083], [0.28, 0.07, 0.006], r === 5 ? 0xf2b5c6 : 0x9fd3de);
      b([0.24, 0.94, 0.04], [0.14, 0.08, 0.03], C.coral);
      hb([0.24, 0.08, 0.22], [0.3, 0.02, 0.16], 0x7fd0d8); // WET 池畔
      hb([-0.24, 0.065, 0.22], [0.24, 0.008, 0.16], 0xb83a3a); // 迎賓紅毯
      plant(-0.42, 0.26, 0.2);
      plant(0.42, 0.26, 0.2);
      return true;
    }
    case "luxuryHotelAtrium": {
      // 臺北嘉佩樂酒店（敦北林蔭現代奢華石材拱廊）& 台北君悅酒店（凱悅集團信義雙翼巨型中庭與噴泉廣場）
      b([0, 0.03, 0], [0.98, 0.06, 0.78], 0xe2d6c3);
      // 左：臺北嘉佩樂 Capella Taipei
      b([-0.25, 0.44, -0.06], [0.34, 0.76, 0.32], 0xede0cc);
      hb([-0.25, 0.84, -0.06], [0.36, 0.035, 0.34], 0xd8a848);
      for (let r = 0; r < 5; r++) {
        glow([-0.25, 0.16 + r * 0.13, 0.103], [0.24, 0.08, 0.006], 0xffe49e);
        hb([-0.25, 0.12 + r * 0.13, 0.11], [0.28, 0.015, 0.02], 0xd8a848);
      }
      // 右：台北君悅 Grand Hyatt（凱悅集團雙翼高塔 + 玻璃天井中庭 + 迎賓噴泉）
      b([0.22, 0.42, -0.08], [0.42, 0.72, 0.34], 0xf6efe3);
      glow([0.22, 0.42, 0.093], [0.16, 0.58, 0.008], 0xfff0c2);
      p("hip", [0.22, 0.82, -0.08], [0.46, 0.1, 0.38], 0x8a6a4e);
      for (let k = -2; k <= 2; k++) bulb([0.22 + k * 0.055, 0.86, 0.08], 0.025, 0xd8a848);
      cy([0.22, 0.08, 0.24], 0.18, 0.03, 0x7fd0d8);
      sphere([0.22, 0.12, 0.24], 0.04, 0xd5ecee);
      plant(-0.02, 0.24, 0.22);
      return true;
    }
    case "luxuryHotelSky": {
      // 台北遠東香格里拉（香格里拉集團敦南雙尖頂摩天大樓）& 台北喜來登大飯店（萬豪集團經典氣派五星大樓）
      b([0, 0.03, 0], [0.98, 0.06, 0.78], stone);
      // 左：遠東香格里拉高塔 + 頂樓景觀泳池 + 雙金尖塔
      b([-0.22, 0.52, -0.06], [0.32, 0.92, 0.32], 0xdfd3c0);
      for (let r = 0; r < 7; r++) glow([-0.22, 0.14 + r * 0.12, 0.103], [0.24, 0.06, 0.006], 0xffe49e);
      for (const dx of [-0.08, 0.08]) p("cone", [-0.22 + dx, 1.04, -0.06], [0.08, 0.14, 0.08], 0xd8a848);
      hb([-0.22, 0.99, 0.04], [0.22, 0.018, 0.1], 0x6ec3d0);
      // 右：台北喜來登寬體五星大樓 + 喜來登金冠與迎賓雨棚
      b([0.24, 0.36, -0.04], [0.42, 0.6, 0.34], 0xe6cdb5);
      hb([0.24, 0.68, -0.04], [0.44, 0.035, 0.36], 0xd8a848);
      for (let k = -2; k <= 2; k++) bulb([0.24 + k * 0.055, 0.72, 0.12], 0.025, 0xd8a848);
      for (let r = 0; r < 4; r++) {
        for (let k = -1; k <= 1; k++) glow([0.24 + k * 0.12, 0.14 + r * 0.12, 0.133], [0.08, 0.07, 0.006], 0xfff0c2);
      }
      b([0.24, 0.12, 0.2], [0.24, 0.03, 0.14], C.coral);
      return true;
    }
    case "luxuryHotelArt": {
      // 台北寒舍艾美酒店（萬豪集團艾美當代藝術玻璃建築）& 台北漢來大飯店（漢來集團南港皇家金冠地標）
      b([0, 0.03, 0], [0.98, 0.06, 0.78], 0xe4e8e7);
      // 左：寒舍艾美 + 藝術氣球雕塑 + 艾美時尚冠頂
      b([-0.24, 0.38, -0.06], [0.36, 0.64, 0.32], 0xeef3f2);
      hb([-0.24, 0.72, -0.06], [0.38, 0.03, 0.34], teal);
      for (let r = 0; r < 4; r++) glow([-0.24, 0.16 + r * 0.13, 0.103], [0.3, 0.07, 0.006], 0xd5ecee);
      sphere([-0.24, 0.12, 0.24], 0.06, C.coral);
      sphere([-0.2, 0.17, 0.24], 0.04, C.coral);
      // 右：台北漢來 + 金色皇冠頂飾 + 五星芒 + 戶外無邊際泳池
      b([0.24, 0.46, -0.06], [0.36, 0.8, 0.32], 0xf5efe4);
      hb([0.24, 0.88, -0.06], [0.38, 0.05, 0.34], 0xd8a848);
      for (let k = -2; k <= 2; k++) bulb([0.24 + k * 0.05, 0.93, 0.1], 0.025, 0xd8a848);
      for (let r = 0; r < 5; r++) glow([0.24, 0.16 + r * 0.13, 0.103], [0.26, 0.08, 0.006], 0xffe49e);
      hb([0.24, 0.075, 0.22], [0.28, 0.018, 0.14], 0x6ec3d0);
      return true;
    }
    case "luxuryHotelHsinchu": {
      // 新竹豐邑喜來登大飯店：雙子星流線玻璃高塔、波浪形LED光廊基座、喜來登五星金冠與迎賓廣場
      b([0, 0.03, 0], [0.98, 0.06, 0.76], 0xdfe4e2);
      for (const sx of [-0.22, 0.22]) {
        b([sx, 0.46, -0.08], [0.3, 0.8, 0.3], 0xe8f0ef);
        for (let r = 0; r < 6; r++) glow([sx, 0.14 + r * 0.12, 0.073], [0.24, 0.06, 0.006], 0x9fd3de);
        hb([sx, 0.88, -0.08], [0.32, 0.035, 0.32], 0xd8a848);
        for (let k = -1; k <= 1; k++) bulb([sx + k * 0.07, 0.92, 0.08], 0.024, 0xd8a848);
      }
      // 中央迎賓拱形LED光廊裙樓與紅毯
      b([0, 0.18, 0.06], [0.48, 0.24, 0.26], 0xf7f2e7);
      ring([0, 0.22, 0.195], 0.16, 0xd8a848, [0, 0, 0]);
      glow([0, 0.18, 0.193], [0.28, 0.14, 0.006], 0xffe49e);
      hb([0, 0.064, 0.25], [0.28, 0.008, 0.14], 0xb83a3a);
      plant(-0.38, 0.26, 0.22);
      plant(0.38, 0.26, 0.22);
      return true;
    }
    case "onsenResortCoast": {
      // 新北北海溫泉洲際酒店 (IHG)：金山依山傍海溫泉Villa、無邊際海景露天風呂、木格柵斜頂建築與IHG五星冠冕
      b([0, 0.03, 0], [0.98, 0.06, 0.76], 0xd8e2dc);
      // 無邊際海景溫泉池 + 蒸氣雲朵
      hb([0, 0.068, 0.22], [0.84, 0.025, 0.24], 0x6ec3d0);
      glow([0, 0.082, 0.22], [0.76, 0.006, 0.18], 0xb8f2fa);
      for (const sx of [-0.22, 0.06, 0.28]) sphere([sx, 0.11, 0.22], [0.07, 0.04, 0.06], 0xffffff);
      // 主館與溫泉別墅木格柵建築
      b([-0.14, 0.32, -0.1], [0.5, 0.48, 0.3], 0xf3ead8);
      p("hip", [-0.14, 0.6, -0.1], [0.56, 0.1, 0.36], 0x5a4a3e);
      for (let k = -2; k <= 2; k++) bulb([-0.14 + k * 0.06, 0.67, 0.06], 0.024, 0xd8a848);
      for (let k = 0; k < 5; k++) hb([-0.32 + k * 0.09, 0.32, 0.055], [0.015, 0.42, 0.012], wood);
      glow([-0.14, 0.3, 0.052], [0.4, 0.32, 0.006], 0xffe49e);
      b([0.3, 0.22, -0.06], [0.26, 0.3, 0.26], wood);
      p("hip", [0.3, 0.41, -0.06], [0.3, 0.09, 0.3], 0x5a4a3e);
      plant(-0.42, -0.2, 0.24);
      plant(0.42, 0.08, 0.22);
      return true;
    }
    case "onsenResortJiaoxi": {
      // 礁溪老爺酒店 & 礁溪寒沐酒店：蘭陽平原日式禪風斜頂湯屋、露天岩石風呂與現代自然木質五星渡假會館
      b([0, 0.03, 0], [0.98, 0.06, 0.76], 0xdce4d6);
      // 左：礁溪老爺日式斜頂建築 + 暖簾入口
      b([-0.24, 0.26, -0.08], [0.38, 0.38, 0.3], 0xf5ebd6);
      p("hip", [-0.24, 0.5, -0.08], [0.44, 0.12, 0.36], 0x4a3f35);
      glow([-0.24, 0.24, 0.073], [0.28, 0.2, 0.006], 0xffe49e);
      // 右：礁溪寒沐現代格柵渡假樓 + 五星金冠
      b([0.24, 0.34, -0.08], [0.36, 0.54, 0.3], 0xede2cf);
      hb([0.24, 0.63, -0.08], [0.38, 0.035, 0.32], 0xd8a848);
      for (let k = -2; k <= 2; k++) bulb([0.24 + k * 0.05, 0.67, 0.07], 0.024, 0xd8a848);
      for (let r = 0; r < 4; r++) {
        glow([0.24, 0.14 + r * 0.12, 0.073], [0.28, 0.07, 0.006], 0xfff0c2);
        hb([0.24, 0.1 + r * 0.12, 0.08], [0.3, 0.015, 0.02], wood);
      }
      // 前方庭園露天岩石溫泉池
      cy([0, 0.07, 0.22], 0.34, 0.03, 0x7fd0d8);
      for (let k = 0; k < 6; k++) {
        const a = (k / 6) * Math.PI * 2;
        p("ico", [Math.cos(a) * 0.18, 0.08, 0.22 + Math.sin(a) * 0.14], [0.07, 0.05, 0.06], 0x9c8f7c);
      }
      bulb([-0.36, 0.16, 0.22], 0.045, 0xffe49e);
      return true;
    }
    case "hotelNetworkMap": {
      // 菁英實習 3.0 雙軌媒合總覽：台灣立體浮雕基座、北中南東24家星級酒店金色燈塔與高餐大核心星芒
      cy([0, 0.03, 0], 0.96, 0.06, 0xd5ecee);
      // 台灣島輪廓立體浮雕台
      p("rbox", [0, 0.1, 0], [0.36, 0.1, 0.68], 0x8fb37a, [0, 0.22, 0]);
      // 北、中、南、東四大星級酒店群聚塔
      const hubs = [
        [0.08, -0.24, 0.42, 0xd8a848],  // 北部12家
        [-0.06, -0.02, 0.32, teal],     // 中部6家
        [-0.08, 0.22, 0.36, C.coral],   // 南部5家
        [0.1, 0.08, 0.28, yel],         // 東部瑞穗天合
      ];
      for (const [hx, hz, hh, hc] of hubs) {
        b([hx, 0.14 + hh / 2, hz], [0.12, hh, 0.12], 0xf7f2e7);
        hb([hx, 0.14 + hh + 0.015, hz], [0.14, 0.03, 0.14], hc);
        bulb([hx, 0.14 + hh + 0.06, hz], 0.05, 0xffe49e);
      }
      ring([0, 0.26, 0], 0.38, 0xd8a848, [Math.PI / 2, 0.2, 0]);
      return true;
    }
    case "tainanHotels": {
      // 台南遠東香格里拉（府城最高圓柱形五星地標大樓）& 台南大員皇冠假日酒店（IHG 安平魚簍意象建築）
      b([0, 0.03, 0], [0.98, 0.06, 0.76], 0xe6d6c6);
      // 左：台南遠東香格里拉圓柱摩天塔 + 頂冠五星金芒
      cy([-0.22, 0.48, -0.06], 0.34, 0.84, 0xf3ead8);
      for (let r = 0; r < 6; r++) ring([-0.22, 0.16 + r * 0.12, -0.06], 0.175, 0x9fd3de);
      cy([-0.22, 0.92, -0.06], 0.26, 0.06, 0xd8a848);
      for (let k = -2; k <= 2; k++) bulb([-0.22 + k * 0.045, 0.97, 0.06], 0.022, 0xd8a848);
      // 右：大員皇冠假日（IHG 皇冠標誌 + 安平魚簍斜交格柵玻璃建築）
      b([0.24, 0.34, -0.04], [0.38, 0.56, 0.32], 0xede0cc);
      hb([0.24, 0.64, -0.04], [0.4, 0.035, 0.34], C.coral);
      glow([0.24, 0.34, 0.123], [0.3, 0.44, 0.006], 0xffe49e);
      for (const s of [-1, 1]) hb([0.24, 0.34, 0.13], [0.32, 0.015, 0.01], wood, [0, 0, s * 0.55]);
      hb([-0.22, 0.064, 0.22], [0.22, 0.008, 0.14], 0xb83a3a);
      return true;
    }
    case "amnisHotel": {
      // 高雄然一酒店 (The AMNIS, A Luxury Collection)：萬豪集團奢華精選水岸黑金藝術酒店、頂樓無邊際泳池與私人遊艇碼頭
      b([0, 0.03, 0], [0.96, 0.06, 0.74], 0xd5ecee);
      b([-0.04, 0.06, -0.06], [0.76, 0.04, 0.48], 0xf3ead8);
      // 然一酒店流線黑金玻璃塔樓 + 金色奢華頂冠
      b([-0.06, 0.48, -0.08], [0.42, 0.8, 0.32], 0x2c3e50);
      hb([-0.06, 0.9, -0.08], [0.44, 0.04, 0.34], 0xd8a848);
      for (let k = -2; k <= 2; k++) bulb([-0.06 + k * 0.06, 0.95, 0.08], 0.025, 0xd8a848);
      for (let r = 0; r < 6; r++) {
        glow([-0.06, 0.16 + r * 0.12, 0.083], [0.34, 0.06, 0.006], 0xffe49e);
        hb([-0.06, 0.12 + r * 0.12, 0.09], [0.38, 0.014, 0.02], 0xd8a848);
      }
      // 灣區水岸與白色私人遊艇
      sphere([0.28, 0.08, 0.24], [0.22, 0.05, 0.08], 0xffffff);
      hb([0.28, 0.12, 0.24], [0.08, 0.04, 0.05], 0xd8a848);
      plant(-0.34, 0.18, 0.22);
      return true;
    }
    case "kaohsiungHotels": {
      // 高雄漢來大飯店（新古典主義皇冠地標巨塔）& 高雄中央公園英迪格酒店（IHG 海港貨櫃色彩與高空酒吧）
      b([0, 0.03, 0], [0.98, 0.06, 0.76], stone);
      // 左：高雄漢來大飯店（古典米白高塔與金色皇冠塔頂 + 五星金芒）
      b([-0.22, 0.5, -0.06], [0.38, 0.88, 0.34], 0xf5ebd6);
      p("hip", [-0.22, 0.98, -0.06], [0.42, 0.1, 0.38], 0xd8a848);
      for (let k = -2; k <= 2; k++) bulb([-0.22 + k * 0.055, 1.04, 0.11], 0.024, 0xd8a848);
      for (let r = 0; r < 6; r++) glow([-0.22, 0.16 + r * 0.13, 0.113], [0.28, 0.07, 0.006], 0xfff0c2);
      hb([-0.22, 0.064, 0.22], [0.24, 0.008, 0.14], 0xb83a3a);
      // 右：高雄英迪格酒店（IHG 繽紛港灣貨櫃幾何立面 + Pier No.22 頂樓露天吧）
      b([0.24, 0.38, -0.06], [0.34, 0.64, 0.3], 0x2c3e50);
      const ic = [C.coral, yel, teal2, 0xf2b5c6];
      for (let r = 0; r < 4; r++) {
        b([0.24 + ((r % 2) - 0.5) * 0.04, 0.16 + r * 0.13, 0.09], [0.26, 0.09, 0.03], ic[r]);
      }
      glow([0.24, 0.72, -0.06], [0.3, 0.04, 0.26], 0xffe49e);
      return true;
    }
    case "castleResort": {
      // 花蓮瑞穗天合國際觀光酒店：縱谷歐風莊園五星城堡、金色尖塔鐘樓與黃金湯水樂園
      b([0, 0.03, 0], [0.98, 0.06, 0.76], 0xd6e5c8);
      // 歐式城堡主樓與對稱尖塔
      b([0, 0.32, -0.1], [0.52, 0.5, 0.32], 0xf7f0e2);
      p("hip", [0, 0.62, -0.1], [0.56, 0.12, 0.36], 0xa34e34);
      // 中央高聳哥德式尖頂鐘塔與五星金芒
      b([0, 0.56, -0.06], [0.18, 0.68, 0.18], 0xf7f0e2);
      p("cone", [0, 1.04, -0.06], [0.22, 0.28, 0.22], 0x3e7c8c);
      bulb([0, 1.2, -0.06], 0.045, 0xd8a848);
      for (let k = -2; k <= 2; k++) bulb([k * 0.06, 0.7, 0.08], 0.022, 0xd8a848);
      // 左右城堡圓塔
      for (const sx of [-0.3, 0.3]) {
        cy([sx, 0.36, -0.08], 0.16, 0.56, 0xf7f0e2);
        p("cone", [sx, 0.74, -0.08], [0.2, 0.2, 0.2], 0xa34e34);
      }
      for (let r = 0; r < 3; r++) glow([0, 0.18 + r * 0.13, 0.063], [0.34, 0.07, 0.006], 0xffe49e);
      // 前方金色水樂園泳池與滑水道
      cy([0, 0.068, 0.22], 0.38, 0.025, 0x7fd0d8);
      ring([0.16, 0.12, 0.22], 0.08, yel, [Math.PI / 3, 0.2, 0]);
      plant(-0.4, 0.2, 0.24);
      plant(0.4, 0.2, 0.24);
      return true;
    }
    // ---------------- 升學就業與菁英實習 3.0 專屬微縮模型 ----------------
    case "industryAcademy": {
      // 產業學院連結全臺24家標竿旅館：高餐大產業學院總部與星級酒店雙向黃金拱橋
      b([0, 0.03, 0], [0.98, 0.06, 0.74], 0xe9dcc4);
      // 左：高餐大產業學院大樓
      b([-0.28, 0.32, -0.06], [0.32, 0.52, 0.3], 0xf7f2e7);
      p("hip", [-0.28, 0.62, -0.06], [0.36, 0.1, 0.34], teal);
      glow([-0.28, 0.32, 0.093], [0.24, 0.34, 0.006], 0xd5ecee);
      // 右：合作國際星級酒店高塔
      b([0.28, 0.44, -0.06], [0.32, 0.76, 0.3], 0xf3ead8);
      hb([0.28, 0.84, -0.06], [0.34, 0.04, 0.32], 0xd8a848);
      for (let r = 0; r < 5; r++) glow([0.28, 0.16 + r * 0.13, 0.093], [0.24, 0.07, 0.006], 0xffe49e);
      // 中央產學共育黃金拱橋
      ring([0, 0.24, 0.04], 0.28, 0xd8a848, [0, 0, 0]);
      person(-0.08, 0.22, 0.34);
      person(0.08, 0.22, 0.34);
      return true;
    }
    case "careerTriad": {
      // 升學就業與創業三合一策略：三座遞升榮耀階梯台（碩士進修、國際星級飯店儲備幹部、旅宿創業家）
      b([0, 0.03, 0], [0.96, 0.06, 0.72], 0xe8dfd1);
      const steps = [
        [-0.28, 0.24, teal, 0x9fd3de],
        [0, 0.36, 0xd8a848, 0xffe49e],
        [0.28, 0.48, C.coral, 0xfff0c2],
      ];
      for (const [sx, sh, sc, gc] of steps) {
        b([sx, 0.06 + sh / 2, -0.06], [0.24, sh, 0.28], 0xf7f2e7);
        hb([sx, 0.06 + sh + 0.015, -0.06], [0.26, 0.03, 0.3], sc);
        glow([sx, 0.06 + sh / 2, 0.083], [0.18, sh * 0.65, 0.006], gc);
        person(sx, 0.22, 0.32);
      }
      bulb([0.28, 0.64, -0.06], 0.06, 0xffe49e);
      return true;
    }
    case "rotationHub": {
      // 菁英實習 3.0 儲備幹部培訓輪調：四層部門輪調透明培訓塔與金色上升螺旋梯
      b([0, 0.03, 0], [0.96, 0.06, 0.72], 0xe2ebea);
      b([0, 0.42, -0.06], [0.46, 0.72, 0.36], 0xf7f2e7);
      const rCols = [teal, C.coral, yel, 0xd8a848];
      for (let r = 0; r < 4; r++) {
        const yy = 0.14 + r * 0.17;
        glow([0, yy, 0.123], [0.36, 0.1, 0.006], r === 3 ? 0xffe49e : 0xd5ecee);
        hb([0, yy - 0.055, 0.13], [0.48, 0.025, 0.04], rCols[r]);
      }
      // 外部上升晉升階梯
      for (let k = 0; k < 5; k++) b([0.32, 0.1 + k * 0.13, 0.12 - k * 0.05], [0.12, 0.03, 0.08], 0xd8a848);
      person(-0.28, 0.2, 0.34);
      person(0.28, 0.24, 0.34);
      return true;
    }
    case "eliteEvalCenter": {
      // 菁英生考核與雙導師輔導中心：五星榮耀評鑑殿堂、雙導師圓桌與儲備幹部證書頒授台
      b([0, 0.03, 0], [0.96, 0.06, 0.72], 0xe9dcc4);
      b([0, 0.36, -0.22], [0.78, 0.56, 0.08], 0x2c3e50);
      for (let k = -2; k <= 2; k++) bulb([k * 0.12, 0.5, -0.17], 0.045, 0xd8a848); // 五星評鑑
      glow([0, 0.32, -0.175], [0.56, 0.2, 0.006], 0xffe49e);
      cy([0, 0.16, 0.08], 0.34, 0.03, wood);
      person(-0.22, 0.08, 0.36);
      person(0.22, 0.08, 0.36);
      person(0, 0.28, 0.34);
      return true;
    }
    // ---------------- 新增：中南東部五星級與國際連鎖品牌酒店 3D 地標 ----------------
    case "taichungICMeridien": {
      // 臺中勤美洲際酒店 (IHG InterContinental) & 台中李芳艾美酒店 (Marriott Le Méridien)
      b([0, 0.03, 0], [0.98, 0.06, 0.78], 0xe4dcd0);
      // 左：臺中勤美洲際酒店（草悟道垂直綠意層疊奢華酒店塔 + 頂樓無邊際泳池 + IHG金冠）
      b([-0.24, 0.44, -0.06], [0.36, 0.76, 0.32], 0xf4eee4);
      for (let r = 0; r < 5; r++) {
        const yy = 0.14 + r * 0.135;
        glow([-0.24, yy, 0.104], [0.28, 0.075, 0.006], 0xffe49e);
        hb([-0.24, yy - 0.045, 0.115], [0.34, 0.018, 0.03], 0xb88b4a); // 古銅金屬橫格柵
        // 垂直空中花園綠意露台
        if (r % 2 === 1) sphere([-0.36, yy, 0.12], [0.06, 0.035, 0.05], green);
      }
      hb([-0.24, 0.84, -0.06], [0.38, 0.035, 0.34], 0xd8a848);
      hb([-0.24, 0.865, 0.02], [0.26, 0.018, 0.14], 0x6ec3d0); // 頂樓空中泳池
      for (let k = -2; k <= 2; k++) bulb([-0.24 + k * 0.055, 0.89, 0.11], 0.028, 0xd8a848); // 五星金芒
      // 右：台中李芳艾美酒店（中區地標超高玻璃帷幕摩天塔 + 頂樓圓形旋轉景觀冠頂）
      b([0.24, 0.52, -0.06], [0.34, 0.92, 0.32], 0xdbe7ec);
      for (let r = 0; r < 7; r++) {
        glow([0.24, 0.14 + r * 0.115, 0.104], [0.26, 0.065, 0.006], r === 6 ? 0xffe49e : 0x9fd3de);
      }
      for (const dx of [-0.12, 0, 0.12]) hb([0.24 + dx, 0.52, 0.106], [0.014, 0.88, 0.012], 0xd8a848);
      cy([0.24, 1.03, -0.06], 0.28, 0.1, 0xf7f2e7); // 標誌性圓形冠頂
      cy([0.24, 1.03, -0.06], 0.29, 0.04, 0xd8a848);
      p("dome", [0.24, 1.09, -0.06], [0.22, 0.08, 0.22], 0xffe49e);
      // 前方迎賓車道紅毯與禮賓推車
      hb([0, 0.064, 0.24], [0.56, 0.008, 0.14], 0xb83a3a);
      cy([0.36, 0.11, 0.26], 0.07, 0.1, 0xd8a848);
      plant(-0.42, 0.26, 0.22);
      return true;
    }
    case "sunMoonGuguanResorts": {
      // 雲品溫泉酒店日月潭 (LDC Fleur de Chine) & 星野集團 虹夕諾雅 谷關 (HOSHINOYA Guguan)
      b([0, 0.03, 0], [0.98, 0.06, 0.78], 0xd8e4d4);
      // 左：雲品溫泉酒店日月潭（湖景退縮式寬體渡假大樓 + 雲月舫頂樓玻璃穹頂 + 日月潭碧水碼頭）
      hb([-0.24, 0.066, 0.22], [0.44, 0.02, 0.24], 0x5ab8c8); // 日月潭湖面水景
      b([-0.24, 0.38, -0.08], [0.4, 0.64, 0.3], 0xf6efe2);
      for (let r = 0; r < 5; r++) {
        const yy = 0.14 + r * 0.115;
        glow([-0.24, yy, 0.074], [0.34, 0.065, 0.006], 0xffe49e);
        hb([-0.24, yy - 0.035, 0.09], [0.38, 0.016, 0.035], 0xe6d6bc); // 湖景觀景陽台欄杆
      }
      p("dome", [-0.24, 0.73, -0.08], [0.28, 0.09, 0.2], 0xd8a848); // 雲月舫頂樓Sky Lounge
      for (let k = -2; k <= 2; k++) bulb([-0.24 + k * 0.05, 0.72, 0.08], 0.025, 0xd8a848);
      // 右：星野集團 虹夕諾雅 谷關（日式檜木格柵溫泉高樓 + 之字形水之庭園 + 露天風呂蒸氣）
      b([0.24, 0.42, -0.1], [0.36, 0.72, 0.28], 0xeadbc5);
      p("hip", [0.24, 0.82, -0.1], [0.42, 0.11, 0.34], 0x4a3f35);
      for (let k = 0; k < 6; k++) hb([0.09 + k * 0.06, 0.42, 0.045], [0.012, 0.66, 0.012], wood); // 檜木縱向格柵
      for (let r = 0; r < 5; r++) glow([0.24, 0.15 + r * 0.125, 0.042], [0.28, 0.07, 0.006], 0xfff0c2);
      // 之字形「水之庭園」水道與松林湯屋
      hb([0.2, 0.068, 0.16], [0.32, 0.018, 0.08], 0x7fd0d8, [0, 0.35, 0]);
      hb([0.26, 0.068, 0.25], [0.32, 0.018, 0.08], 0x7fd0d8, [0, -0.35, 0]);
      for (const sx of [0.14, 0.34]) sphere([sx, 0.11, 0.22], [0.06, 0.04, 0.06], 0xffffff); // 谷關溫泉蒸氣
      plant(0.02, 0.22, 0.24);
      plant(0.42, 0.2, 0.24);
      return true;
    }
    case "windsorMoxyHotels": {
      // 台中裕元花園酒店 (Windsor Hotel Twin Towers) & 萬豪集團 台中豐邑MOXY酒店 (Moxy Taichung)
      b([0, 0.03, 0], [0.98, 0.06, 0.78], 0xe2ddd5);
      // 左：裕元花園酒店（雙子星弧形玻璃帷幕高塔 + 雙塔天橋 + 歐式玫瑰花園廣場）
      for (const dx of [-0.34, -0.14]) {
        b([dx, 0.48, -0.06], [0.17, 0.84, 0.3], 0xdde8ec);
        for (let r = 0; r < 6; r++) glow([dx, 0.14 + r * 0.12, 0.094], [0.13, 0.065, 0.006], 0x9fd3de);
        hb([dx, 0.92, -0.06], [0.19, 0.035, 0.32], 0xd8a848);
      }
      b([-0.24, 0.76, -0.06], [0.22, 0.08, 0.2], 0xf7f2e7); // 雙塔高空連通景觀廊橋
      glow([-0.24, 0.76, 0.043], [0.18, 0.05, 0.006], 0xffe49e);
      for (let k = -2; k <= 2; k++) bulb([-0.24 + k * 0.045, 0.95, 0.08], 0.024, 0xd8a848);
      // 右：萬豪集團 台中豐邑MOXY酒店（千禧潮流工業風炭黑立面 + 桃紅霓虹光框 + Rooftop Bar Moxy）
      b([0.25, 0.42, -0.06], [0.34, 0.72, 0.3], 0x2b2d38);
      for (let r = 0; r < 5; r++) {
        const yy = 0.15 + r * 0.125;
        glow([0.25, yy, 0.094], [0.26, 0.07, 0.006], r % 2 === 0 ? 0xf2b5c6 : 0xffe49e);
        hb([0.25, yy - 0.045, 0.1], [0.3, 0.015, 0.02], C.coral);
      }
      // 頂樓 Bar Moxy 桃紅霓虹招牌與露天派對吧台
      glow([0.25, 0.82, 0.06], [0.24, 0.07, 0.03], 0xe05288);
      bulb([0.14, 0.82, 0.08], 0.04, 0xffe49e);
      bulb([0.36, 0.82, 0.08], 0.04, 0xf2b5c6);
      plant(-0.24, 0.25, 0.2);
      return true;
    }
    case "chainHotelExpo": {
      // 國際連鎖與本土頂尖四大酒店集團聯合選才博覽館（萬豪・洲際・國際頂奢・台灣五星集團四塔環拱）
      b([0, 0.03, 0], [0.98, 0.06, 0.78], 0xe8dfd1);
      // 四大連鎖集團代表旗艦塔（依 data/official.json 按集團品牌區分之 4 大群組）
      const chains = [
        [-0.33, -0.08, 0.68, C.coral, 0xffe49e],   // 萬豪集團 Marriott (W/Luxury Collection/喜來登/艾美/MOXY)
        [-0.11, -0.14, 0.78, teal, 0xd5ecee],      // 洲際集團 IHG (洲際/皇冠假日/英迪格)
        [0.11, -0.14, 0.82, 0xd8a848, 0xfff0c2],   // 國際頂奢集團 (文華東方/嘉佩樂/香格里拉/君悅/星野)
        [0.33, -0.08, 0.68, 0x8a5a36, 0xffe49e],   // 本土五星觀光集團 (雲品/老爺/寒沐/漢來/裕元/瑞穗天合)
      ];
      for (const [tx, tz, th, tc, gc] of chains) {
        b([tx, 0.06 + th / 2, tz], [0.18, th, 0.22], 0xf7f2e7);
        hb([tx, 0.06 + th + 0.02, tz], [0.2, 0.035, 0.24], tc);
        for (let r = 0; r < 4; r++) glow([tx, 0.16 + r * (th * 0.2), tz + 0.113], [0.13, 0.065, 0.006], gc);
        bulb([tx, 0.06 + th + 0.065, tz + 0.08], 0.035, 0xd8a848);
      }
      // 前方星級酒店聯合選才紅毯舞台與禮賓接駁專車
      hb([0, 0.068, 0.18], [0.76, 0.015, 0.22], 0xb83a3a);
      ring([0, 0.28, 0.06], 0.26, 0xd8a848, [0, 0, 0]);
      person(-0.18, 0.18, 0.34);
      person(0, 0.2, 0.36);
      person(0.18, 0.18, 0.34);
      return true;
    }
    case "brandStarPavilion": {
      // 五星級連鎖酒店評鑑與榮耀星環殿堂（菁英生考核與雙導師評鑑）
      b([0, 0.03, 0], [0.98, 0.06, 0.76], 0xe9dcc4);
      // 中央古典星級評鑑殿堂與左右連鎖酒店翼樓
      b([0, 0.38, -0.08], [0.46, 0.64, 0.3], 0xf7f2e7);
      p("hip", [0, 0.74, -0.08], [0.52, 0.1, 0.34], 0x2c3e50);
      for (const sx of [-0.32, 0.32]) {
        b([sx, 0.3, -0.04], [0.2, 0.48, 0.26], 0xede0cc);
        hb([sx, 0.56, -0.04], [0.22, 0.03, 0.28], 0xd8a848);
        glow([sx, 0.3, 0.093], [0.14, 0.34, 0.006], 0xffe49e);
      }
      // 殿堂頂部五顆璀璨金星地標
      for (let k = -2; k <= 2; k++) {
        cy([k * 0.09, 0.82, 0.02], 0.025, 0.08, 0xd8a848);
        bulb([k * 0.09, 0.88, 0.02], 0.045, 0xffe49e);
      }
      glow([0, 0.36, 0.074], [0.34, 0.42, 0.006], 0xfff0c2);
      cy([0, 0.14, 0.22], 0.28, 0.03, wood);
      person(-0.14, 0.22, 0.34);
      person(0.14, 0.22, 0.34);
      return true;
    }
    // ---------------- 三明治教學與校外實習動線（Island 3: transport）五星級實習酒店化 ----------------
    case "internHotelSkyline": {
      // 第三學年：校外實習(一)(二) — 國際連鎖五星級實習酒店雙子星天際線與迎賓大廳
      b([0, 0.03, 0], [0.98, 0.06, 0.78], 0xe5ddd0);
      // 左塔：國際連鎖五星摩天酒店（藍綠玻璃帷幕 + 金色斜頂冠冕）
      b([-0.22, 0.5, -0.08], [0.34, 0.88, 0.32], 0xdbe7ec);
      for (let r = 0; r < 6; r++) glow([-0.22, 0.15 + r * 0.125, 0.084], [0.26, 0.07, 0.006], 0x9fd3de);
      p("hip", [-0.22, 0.98, -0.08], [0.38, 0.1, 0.36], 0xd8a848);
      // 右塔：奢華歐風五星級大飯店（暖白古典石材 + 金銅皇冠頂 + 五星燈飾）
      b([0.22, 0.44, -0.08], [0.34, 0.76, 0.32], 0xf5ebd6);
      for (let r = 0; r < 5; r++) glow([0.22, 0.15 + r * 0.13, 0.084], [0.26, 0.075, 0.006], 0xffe49e);
      hb([0.22, 0.84, -0.08], [0.38, 0.04, 0.34], 0xd8a848);
      for (let k = -2; k <= 2; k++) bulb([k * 0.09, 0.88, 0.09], 0.032, 0xd8a848);
      // 中央實習生迎賓大廳雨棚與紅毯
      hb([0, 0.18, 0.16], [0.46, 0.03, 0.18], 0xb88b4a);
      hb([0, 0.065, 0.24], [0.42, 0.008, 0.18], 0xb83a3a);
      person(-0.1, 0.24, 0.35);
      person(0.1, 0.24, 0.35);
      return true;
    }
    case "sandwichArchBridge": {
      // 三明治教學法：理論與實務 — 連結高餐校園教學樓與五星級觀光大飯店之雙向黃金拱橋
      b([0, 0.03, 0], [0.98, 0.06, 0.76], 0xe2ebea);
      // 左：高餐旅館系教學大樓（理論）
      b([-0.3, 0.32, -0.04], [0.28, 0.52, 0.3], 0xf7f2e7);
      p("hip", [-0.3, 0.62, -0.04], [0.32, 0.09, 0.34], teal);
      glow([-0.3, 0.32, 0.113], [0.2, 0.34, 0.006], 0xd5ecee);
      // 右：五星級連鎖觀光大飯店（實務）
      b([0.3, 0.44, -0.04], [0.28, 0.76, 0.3], 0xf4ead5);
      hb([0.3, 0.84, -0.04], [0.32, 0.04, 0.32], 0xd8a848);
      for (let r = 0; r < 5; r++) glow([0.3, 0.15 + r * 0.13, 0.113], [0.2, 0.07, 0.006], 0xffe49e);
      // 中央三明治雙向循環黃金拱橋
      ring([0, 0.26, 0.06], 0.28, 0xd8a848, [0, 0, 0]);
      hb([0, 0.22, 0.06], [0.36, 0.025, 0.12], 0xd8a848);
      person(-0.06, 0.24, 0.34);
      person(0.06, 0.24, 0.34);
      return true;
    }
    case "hotelTourShuttle": {
      // 校外參觀與海外參訪 — 五星級酒店迎賓大廳金銅雨棚與高餐企業參訪專車
      b([0, 0.03, 0], [0.98, 0.06, 0.76], 0xe4dcd0);
      // 後方：五星級連鎖大飯店氣派迎賓主樓
      b([-0.14, 0.42, -0.12], [0.56, 0.72, 0.28], 0xf5ebd6);
      hb([-0.14, 0.8, -0.12], [0.6, 0.04, 0.32], 0xd8a848);
      for (let r = 0; r < 5; r++) glow([-0.14, 0.15 + r * 0.13, 0.024], [0.46, 0.07, 0.006], 0xffe49e);
      for (let k = -2; k <= 2; k++) bulb([-0.14 + k * 0.08, 0.84, 0.03], 0.028, 0xd8a848);
      // 前方：高餐星級酒店參訪專車巴士
      b([0.16, 0.18, 0.18], [0.52, 0.2, 0.22], C.coral);
      b([0.16, 0.29, 0.18], [0.5, 0.04, 0.23], 0xf7f2e7);
      glow([0.16, 0.21, 0.293], [0.42, 0.08, 0.006], 0xd5ecee);
      person(-0.26, 0.18, 0.34);
      return true;
    }
    case "curriculumFourTowers": {
      // 課程地圖與四年課表 — 大一至大四三明治養成四階星級塔樓
      b([0, 0.03, 0], [0.98, 0.06, 0.76], 0xe8dfd1);
      const yrs = [
        [-0.33, 0.32, teal2, 0xd5ecee],   // 大一基礎
        [-0.11, 0.46, teal, 0x9fd3de],    // 大二群賢會館實習
        [0.11, 0.62, C.coral, 0xffe49e],  // 大三全學年星級酒店實習
        [0.33, 0.78, 0xd8a848, 0xfff0c2], // 大四高階策略與國際就業
      ];
      for (const [tx, th, tc, gc] of yrs) {
        b([tx, 0.06 + th / 2, -0.04], [0.18, th, 0.26], 0xf7f2e7);
        hb([tx, 0.06 + th + 0.02, -0.04], [0.2, 0.035, 0.28], tc);
        for (let r = 0; r < 3; r++) glow([tx, 0.14 + r * (th * 0.26), 0.094], [0.13, 0.06, 0.006], gc);
      }
      bulb([0.33, 0.9, -0.04], 0.045, 0xd8a848);
      return true;
    }
    case "campusPracticeHub": {
      // 校內實習課程 — 客務禮賓、星級客房與精緻餐飲三大實作示範會館
      b([0, 0.03, 0], [0.98, 0.06, 0.76], 0xe9dcc4);
      b([0, 0.34, -0.08], [0.74, 0.56, 0.3], 0xf7f2e7);
      p("hip", [0, 0.66, -0.08], [0.8, 0.1, 0.34], 0xb88b4a);
      for (const [dx, col] of [[-0.22, teal], [0, 0xd8a848], [0.22, C.coral]]) {
        glow([dx, 0.32, 0.074], [0.18, 0.38, 0.006], 0xffe49e);
        hb([dx, 0.12, 0.14], [0.18, 0.025, 0.1], col);
      }
      person(-0.18, 0.22, 0.34);
      person(0.18, 0.22, 0.34);
      return true;
    }
    case "hotelCareerPlaza": {
      // 三合一策略：實習到就業 — 合作國際連鎖酒店旗艦塔與儲備幹部紅毯大道
      b([0, 0.03, 0], [0.98, 0.06, 0.76], 0xe6dccb);
      b([0, 0.48, -0.1], [0.48, 0.84, 0.3], 0xf4ead5);
      p("hip", [0, 0.94, -0.1], [0.54, 0.1, 0.34], 0xd8a848);
      for (let r = 0; r < 6; r++) glow([0, 0.15 + r * 0.125, 0.054], [0.38, 0.07, 0.006], 0xffe49e);
      for (let k = -2; k <= 2; k++) bulb([k * 0.08, 0.96, 0.06], 0.03, 0xd8a848);
      hb([0, 0.066, 0.18], [0.22, 0.01, 0.32], 0xb83a3a); // 實習直通就業紅毯
      person(0, 0.24, 0.36);
      return true;
    }
    case "mentorVisitTower": {
      // 實習訪視與海外實習 — 星級飯店實習訪視大廳與全球合作酒店連線塔
      b([0, 0.03, 0], [0.98, 0.06, 0.76], 0xdce6e4);
      b([-0.2, 0.4, -0.06], [0.38, 0.68, 0.3], 0xf5ebd6);
      hb([-0.2, 0.76, -0.06], [0.42, 0.035, 0.32], 0xd8a848);
      for (let r = 0; r < 5; r++) glow([-0.2, 0.15 + r * 0.12, 0.094], [0.3, 0.065, 0.006], 0xffe49e);
      // 右側海外實習地球儀地標與訪視圓桌
      sphere([0.24, 0.38, -0.02], 0.22, teal);
      ring([0.24, 0.38, -0.02], 0.26, 0xd8a848, [0.4, 0.2, 0]);
      cy([0.24, 0.14, -0.02], 0.18, 0.16, 0xf7f2e7);
      person(-0.08, 0.22, 0.34);
      person(0.14, 0.22, 0.34);
      return true;
    }
    // ---------------- 國際交流、專業教室與智慧餐旅星級酒店化（Islands 13, 15, 16） ----------------
    case "overseasInternResort": {
      // 國(海)外實習及研習選才 — 海外五星級海濱渡假村酒店塔與國際出發航廈
      b([0, 0.03, 0], [0.98, 0.06, 0.78], 0xd5ecee);
      // 左：海外五星級奢華海濱渡假村高塔 + 碧海泳池
      b([-0.22, 0.44, -0.08], [0.36, 0.76, 0.3], 0xf7f2e7);
      p("hip", [-0.22, 0.86, -0.08], [0.42, 0.1, 0.34], C.coral);
      for (let r = 0; r < 5; r++) glow([-0.22, 0.15 + r * 0.13, 0.074], [0.28, 0.07, 0.006], 0xffe49e);
      hb([-0.22, 0.068, 0.22], [0.38, 0.02, 0.18], 0x6ec3d0);
      // 右：國際機場航廈弧形拱頂與登機門
      b([0.24, 0.26, -0.04], [0.38, 0.38, 0.3], 0xe3ebea);
      hb([0.24, 0.47, -0.04], [0.44, 0.04, 0.36], teal);
      glow([0.24, 0.26, 0.114], [0.3, 0.24, 0.006], 0xd5ecee);
      plant(0.02, 0.22, 0.24);
      return true;
    }
    case "globalHotelStudy": {
      // 海外參訪（一）（二）課程 — 歐亞國際連鎖五星級宮殿酒店與現代摩天酒店建築群
      b([0, 0.03, 0], [0.98, 0.06, 0.78], 0xe6dccb);
      // 左：歐式古典五星級皇宮酒店（圓頂 + 拱窗）
      b([-0.22, 0.36, -0.06], [0.36, 0.6, 0.3], 0xf3ead8);
      p("dome", [-0.22, 0.7, -0.06], [0.26, 0.14, 0.24], 0x3e7c8c);
      bulb([-0.22, 0.85, -0.06], 0.035, 0xd8a848);
      for (let r = 0; r < 4; r++) glow([-0.22, 0.16 + r * 0.13, 0.094], [0.26, 0.07, 0.006], 0xffe49e);
      // 右：亞洲現代奢華連鎖摩天酒店（空橋花園 + 玻璃帷幕）
      b([0.24, 0.46, -0.06], [0.34, 0.8, 0.3], 0xdbe7ec);
      hb([0.24, 0.88, -0.06], [0.4, 0.045, 0.34], 0xd8a848);
      for (let r = 0; r < 6; r++) glow([0.24, 0.15 + r * 0.12, 0.094], [0.26, 0.065, 0.006], 0x9fd3de);
      person(-0.04, 0.24, 0.34);
      person(0.12, 0.24, 0.34);
      return true;
    }
    case "fBuildingHq": {
      // 第一教學大樓（F棟）系辦 — 高餐大藍瓦白牆中式現代教學大樓與旅館系一樓系辦門廳
      b([0, 0.03, 0], [0.98, 0.06, 0.78], 0xe6dccb);
      b([0, 0.38, -0.06], [0.76, 0.64, 0.34], 0xf7f2e7);
      p("hip", [0, 0.76, -0.06], [0.84, 0.14, 0.4], 0x2f5a8a); // 高餐標誌性藍瓦屋頂
      for (let r = 0; r < 4; r++) {
        for (let k = -2; k <= 2; k++) glow([k * 0.14, 0.16 + r * 0.13, 0.114], [0.09, 0.075, 0.006], 0xffe49e);
      }
      // 1樓系辦迎賓門廊
      hb([0, 0.16, 0.18], [0.32, 0.03, 0.14], 0xd8a848);
      plant(-0.4, 0.22, 0.22);
      plant(0.4, 0.22, 0.22);
      return true;
    }
    case "smartServiceCenter": {
      // 智能服務中心 — 智慧星級酒店示範大廳、自助入住 Kiosk 與智慧房控體驗牆
      b([0, 0.03, 0], [0.96, 0.06, 0.74], 0xdbe7ec);
      b([0, 0.34, -0.1], [0.72, 0.56, 0.28], 0xf4f8f9);
      hb([0, 0.64, -0.1], [0.76, 0.04, 0.32], teal);
      glow([0, 0.36, 0.044], [0.6, 0.38, 0.006], 0x9fd3de);
      // 雙座智慧入住 Kiosk 機台
      for (const sx of [-0.22, 0.22]) {
        b([sx, 0.2, 0.18], [0.12, 0.28, 0.08], 0x2c3e50);
        glow([sx, 0.23, 0.224], [0.09, 0.14, 0.006], 0xffe49e);
      }
      person(0, 0.22, 0.35);
      return true;
    }
    case "pmsLabSuite": {
      // 旅館資訊管理專業教室 — OPERA PMS 環形實作電腦教室與飯店房態中控大螢幕
      b([0, 0.03, 0], [0.96, 0.06, 0.74], 0xe2ebea);
      b([0, 0.34, -0.2], [0.78, 0.52, 0.08], 0x2c3e50);
      glow([0, 0.36, -0.155], [0.68, 0.38, 0.006], 0x7fd0d8);
      for (const rx of [-0.22, 0.22]) {
        b([rx, 0.14, 0.08], [0.32, 0.14, 0.18], 0xf7f2e7);
        glow([rx, 0.25, 0.06], [0.22, 0.1, 0.01], 0xffe49e);
      }
      person(-0.22, 0.24, 0.34);
      person(0.22, 0.24, 0.34);
      return true;
    }
    case "hotelTechStudio": {
      // 旅館專業技術教室與授課教室 — 星級客房實務示範區與禮賓服務講堂
      b([0, 0.03, 0], [0.96, 0.06, 0.74], 0xe9dcc4);
      b([0, 0.34, -0.1], [0.74, 0.56, 0.28], 0xf7f2e7);
      hb([0, 0.64, -0.1], [0.78, 0.035, 0.32], 0xd8a848);
      glow([-0.18, 0.34, 0.044], [0.28, 0.36, 0.006], 0xffe49e);
      glow([0.18, 0.34, 0.044], [0.28, 0.36, 0.006], 0xfff0c2);
      // 前方示範星級床鋪與講台
      b([-0.18, 0.13, 0.18], [0.26, 0.12, 0.2], 0xffffff);
      hb([-0.18, 0.195, 0.23], [0.27, 0.015, 0.07], 0xd8a848);
      person(0.2, 0.2, 0.35);
      return true;
    }
    case "secondPracLounge": {
      // 專業教室管理與第二實習教室 — 五星級酒店行政酒廊 Executive Lounge 實境吧台與沙龍
      b([0, 0.03, 0], [0.96, 0.06, 0.74], 0xe8dfd1);
      b([0, 0.34, -0.16], [0.76, 0.54, 0.18], 0x3b322c);
      glow([0, 0.36, -0.065], [0.64, 0.36, 0.006], 0xffe49e);
      // 行政酒廊大理石吧台與圓桌沙龍
      b([-0.18, 0.15, 0.12], [0.36, 0.18, 0.14], 0xf7f2e7);
      hb([-0.18, 0.245, 0.12], [0.38, 0.02, 0.16], 0xd8a848);
      cy([0.22, 0.14, 0.14], 0.2, 0.03, wood);
      person(-0.18, -0.02, 0.35);
      person(0.22, 0.26, 0.34);
      return true;
    }
    case "pmsHotelCluster": {
      // 旅館資訊管理系統（OPERA／德安PMS）— 三棟連線國際連鎖五星級酒店大樓與雲端訂房中樞
      b([0, 0.03, 0], [0.98, 0.06, 0.78], 0xdbe7ec);
      const hts = [
        [-0.28, 0.68, teal, 0x9fd3de],
        [0, 0.84, 0xd8a848, 0xffe49e],
        [0.28, 0.72, C.coral, 0xfff0c2],
      ];
      for (const [tx, th, tc, gc] of hts) {
        b([tx, 0.06 + th / 2, -0.06], [0.24, th, 0.28], 0xf4f8f9);
        hb([tx, 0.06 + th + 0.02, -0.06], [0.26, 0.035, 0.3], tc);
        for (let r = 0; r < 5; r++) glow([tx, 0.15 + r * (th * 0.17), 0.084], [0.18, 0.06, 0.006], gc);
      }
      // 雲端 PMS 數據連線光環
      ring([0, 0.48, 0.08], 0.34, 0x7fd0d8, [0, 0, 0]);
      for (let k = -2; k <= 2; k++) bulb([k * 0.08, 0.94, 0.08], 0.03, 0xd8a848);
      return true;
    }
    case "smartHotelRobotHub": {
      // 餐旅人工智慧、機器人與大數據 — 五星級智慧酒店 AI 迎賓送物機器人與收益管理大廳
      b([0, 0.03, 0], [0.98, 0.06, 0.76], 0xe2ebea);
      b([0, 0.4, -0.1], [0.68, 0.68, 0.28], 0xf7f2e7);
      hb([0, 0.76, -0.1], [0.72, 0.04, 0.32], 0xd8a848);
      glow([0, 0.42, 0.044], [0.56, 0.46, 0.006], 0x9fd3de);
      // 兩台可愛的星級飯店 AI 房務送物機器人
      for (const sx of [-0.18, 0.18]) {
        cy([sx, 0.16, 0.2], 0.12, 0.2, 0xf7f2e7);
        b([sx, 0.28, 0.2], [0.11, 0.08, 0.09], 0x2c3e50);
        glow([sx, 0.28, 0.248], [0.08, 0.05, 0.005], 0x7fd0d8);
        bulb([sx, 0.34, 0.2], 0.025, 0xffe49e);
      }
      return true;
    }
    case "hospitalityCareerTower": {
      // 培育具專業服務技能與經營管理能力之人才：國際連鎖五星級酒店經營管理實務總部大樓
      b([0, 0.03, 0], [0.98, 0.06, 0.76], 0xe9dcc4);
      b([0, 0.46, -0.08], [0.56, 0.8, 0.32], 0xf7f2e7);
      hb([0, 0.88, -0.08], [0.6, 0.04, 0.36], 0xd8a848);
      for (let k = -2; k <= 2; k++) bulb([k * 0.07, 0.94, 0.08], 0.026, 0xd8a848);
      for (let r = 0; r < 5; r++) glow([0, 0.16 + r * 0.135, 0.084], [0.44, 0.07, 0.006], 0xffe49e);
      hb([0, 0.065, 0.22], [0.28, 0.008, 0.16], 0xb83a3a);
      person(-0.18, 0.22, 0.36);
      person(0.18, 0.22, 0.36);
      return true;
    }
    case "vietnamGlobalHotel": {
      // 海外視野與越南生專班：海濱渡假酒店與國際航廈
      b([0, 0.03, 0], [0.96, 0.06, 0.74], 0xd5ecee);
      b([0, 0.06, -0.04], [0.84, 0.04, 0.54], 0xf3ead8);
      b([0, 0.44, -0.1], [0.48, 0.72, 0.3], 0xf7f2e7);
      p("hip", [0, 0.84, -0.1], [0.54, 0.12, 0.36], 0xd8a848);
      for (let k = -2; k <= 2; k++) bulb([k * 0.06, 0.91, 0.06], 0.024, 0xd8a848);
      for (let r = 0; r < 5; r++) glow([0, 0.16 + r * 0.125, 0.054], [0.38, 0.065, 0.006], 0xffe49e);
      hb([0, 0.082, 0.22], [0.58, 0.02, 0.16], 0x6ec3d0);
      plant(-0.36, 0.2, 0.24);
      plant(0.36, 0.2, 0.24);
      return true;
    }
    // ---------------- 實習旅館專島（全臺分區總覽）& 菁英實習 3.0（四大品牌集團旗艦地標群） ----------------
    case "northHotelCluster": {
      // 北部實習旅館區（12 家）：台北文華東方（歐式宮殿）＋台北W飯店（時尚玻璃塔）＋遠東香格里拉（雙尖頂摩天塔）＋礁溪與金山溫泉湯屋
      b([0, 0.03, 0], [0.98, 0.06, 0.78], 0xe4dcd0);
      // 左後：台北文華東方歐式孟莎頂宮殿
      b([-0.3, 0.38, -0.1], [0.28, 0.62, 0.28], 0xf3ead8);
      p("hip", [-0.3, 0.73, -0.1], [0.32, 0.12, 0.32], 0x37474f);
      p("dome", [-0.3, 0.81, -0.1], [0.14, 0.09, 0.14], 0xd8a848);
      for (let r = 0; r < 4; r++) glow([-0.3, 0.16 + r * 0.13, 0.044], [0.2, 0.07, 0.006], 0xfff0c2);
      // 中央主塔：台北遠東香格里拉 ＆ 台北君悅摩天高塔 + 雙金尖頂
      b([0, 0.52, -0.12], [0.28, 0.9, 0.28], 0xdfd3c0);
      for (let r = 0; r < 7; r++) glow([0, 0.15 + r * 0.115, 0.024], [0.22, 0.06, 0.006], 0xffe49e);
      for (const dx of [-0.07, 0.07]) p("cone", [dx, 1.03, -0.12], [0.07, 0.14, 0.07], 0xd8a848);
      for (let k = -2; k <= 2; k++) bulb([k * 0.05, 0.98, 0.03], 0.025, 0xd8a848);
      // 右後：台北W飯店 & 新竹喜來登現代玻璃帷幕高塔 + 珊瑚紅W標誌
      b([0.3, 0.46, -0.1], [0.28, 0.78, 0.28], 0xdbe7ec);
      for (let r = 0; r < 6; r++) glow([0.3, 0.15 + r * 0.12, 0.044], [0.22, 0.065, 0.006], r === 5 ? 0xf2b5c6 : 0x9fd3de);
      b([0.3, 0.88, 0.02], [0.12, 0.07, 0.03], C.coral);
      // 前方：北海洲際・礁溪老爺・寒沐露天無邊際溫泉池與日式木湯屋
      hb([-0.14, 0.07, 0.22], [0.46, 0.022, 0.18], 0x6ec3d0);
      b([0.24, 0.18, 0.2], [0.26, 0.22, 0.18], wood);
      p("hip", [0.24, 0.32, 0.2], [0.3, 0.08, 0.22], 0x4a3f35);
      return true;
    }
    case "centralHotelCluster": {
      // 中部實習旅館區（6 家）：臺中勤美洲際＋台中李芳艾美＋裕元花園雙塔＋MOXY＋日月潭雲品＋谷關虹夕諾雅
      b([0, 0.03, 0], [0.98, 0.06, 0.78], 0xdce4d6);
      // 左：臺中勤美洲際綠意層疊奢華酒店塔 + 裕元雙子星
      b([-0.28, 0.44, -0.1], [0.28, 0.76, 0.28], 0xf4eee4);
      hb([-0.28, 0.84, -0.1], [0.32, 0.035, 0.3], 0xd8a848);
      for (let r = 0; r < 5; r++) glow([-0.28, 0.15 + r * 0.13, 0.044], [0.22, 0.07, 0.006], 0xffe49e);
      // 中：台中李芳艾美圓頂摩天大樓
      b([0, 0.52, -0.12], [0.26, 0.9, 0.26], 0xdbe7ec);
      for (let r = 0; r < 7; r++) glow([0, 0.15 + r * 0.115, 0.014], [0.2, 0.06, 0.006], 0x9fd3de);
      cy([0, 1.01, -0.12], 0.22, 0.08, 0xd8a848);
      p("dome", [0, 1.07, -0.12], [0.18, 0.08, 0.18], 0xffe49e);
      // 右：台中MOXY潮流黑金霓虹塔 + 虹夕諾雅谷關日式溫泉樓
      b([0.28, 0.4, -0.1], [0.28, 0.68, 0.28], 0x2b2d38);
      for (let r = 0; r < 5; r++) glow([0.28, 0.15 + r * 0.12, 0.044], [0.22, 0.065, 0.006], r % 2 === 0 ? 0xf2b5c6 : 0xffe49e);
      glow([0.28, 0.77, 0.02], [0.2, 0.06, 0.03], 0xe05288);
      // 前方：雲品日月潭湖景水鏡與谷關之字形水之庭園
      hb([-0.14, 0.07, 0.22], [0.48, 0.022, 0.18], 0x5ab8c8);
      for (let k = -2; k <= 2; k++) bulb([k * 0.055, 0.96, 0.04], 0.025, 0xd8a848);
      plant(0.26, 0.22, 0.22);
      return true;
    }
    case "southHotelCluster": {
      // 南部實習旅館區（5 家）：台南遠東香格里拉（圓柱巨塔）＋大員皇冠假日＋高雄然一 The AMNIS（黑金水岸）＋高雄漢來（皇冠高塔）＋英迪格（貨櫃色彩）
      b([0, 0.03, 0], [0.98, 0.06, 0.78], 0xd5ecee);
      b([0, 0.06, -0.04], [0.88, 0.04, 0.56], 0xe9dcc4);
      // 左：台南遠東香格里拉圓柱摩天塔
      cy([-0.3, 0.48, -0.1], 0.26, 0.84, 0xf3ead8);
      for (let r = 0; r < 6; r++) ring([-0.3, 0.16 + r * 0.12, -0.1], 0.135, 0x9fd3de);
      cy([-0.3, 0.92, -0.1], 0.2, 0.05, 0xd8a848);
      // 中：高雄漢來大飯店新古典金色皇冠地標巨塔
      b([0, 0.54, -0.12], [0.28, 0.92, 0.28], 0xf5ebd6);
      p("hip", [0, 1.04, -0.12], [0.32, 0.1, 0.32], 0xd8a848);
      for (let r = 0; r < 6; r++) glow([0, 0.16 + r * 0.13, 0.024], [0.22, 0.07, 0.006], 0xfff0c2);
      for (let k = -2; k <= 2; k++) bulb([k * 0.05, 1.0, 0.03], 0.025, 0xd8a848);
      // 右：高雄然一酒店 The AMNIS 黑金奢華塔 + 高雄英迪格繽紛貨櫃露台
      b([0.3, 0.44, -0.1], [0.28, 0.76, 0.28], 0x2c3e50);
      for (let r = 0; r < 5; r++) {
        glow([0.3, 0.16 + r * 0.13, 0.044], [0.22, 0.065, 0.006], 0xffe49e);
        hb([0.3, 0.12 + r * 0.13, 0.05], [0.25, 0.015, 0.02], [C.coral, 0xd8a848, teal2, yel, 0xf2b5c6][r]);
      }
      // 前方亞洲新灣區水岸私人遊艇
      sphere([0.18, 0.09, 0.24], [0.2, 0.05, 0.08], 0xffffff);
      hb([0.18, 0.13, 0.24], [0.08, 0.035, 0.05], 0xd8a848);
      return true;
    }
    case "marriottBrandCluster": {
      // 萬豪國際集團合作體系（Marriott International · 7 家：台北W、高雄然一 Luxury Collection、台北／新竹喜來登、台北／台中艾美、台中MOXY）
      b([0, 0.03, 0], [0.98, 0.06, 0.78], 0xe4dcd0);
      // 左塔：W Taipei & MOXY 時尚霓虹玻璃摩天大樓 + W珊瑚紅標誌 + WET碧波泳池
      b([-0.28, 0.46, -0.08], [0.28, 0.8, 0.28], 0x2b2d38);
      for (let r = 0; r < 6; r++) glow([-0.28, 0.15 + r * 0.12, 0.064], [0.22, 0.065, 0.006], r % 2 === 0 ? 0xf2b5c6 : 0x9fd3de);
      b([-0.28, 0.9, 0.02], [0.13, 0.07, 0.03], C.coral);
      // 中央旗艦塔：The Luxury Collection 然一酒店 & Le Méridien 艾美圓頂地標摩天塔
      b([0, 0.54, -0.1], [0.3, 0.92, 0.3], 0xdbe7ec);
      for (let r = 0; r < 7; r++) {
        glow([0, 0.15 + r * 0.115, 0.054], [0.24, 0.06, 0.006], 0xffe49e);
        hb([0, 0.12 + r * 0.115, 0.06], [0.27, 0.014, 0.02], 0xd8a848);
      }
      cy([0, 1.04, -0.1], 0.24, 0.08, 0xd8a848);
      p("dome", [0, 1.1, -0.1], [0.18, 0.08, 0.18], 0xffe49e);
      for (let k = -2; k <= 2; k++) bulb([k * 0.05, 1.0, 0.06], 0.026, 0xd8a848);
      // 右塔：Sheraton 台北／新竹喜來登雙子星氣派星級大樓
      b([0.28, 0.44, -0.08], [0.28, 0.76, 0.28], 0xf5ebd6);
      hb([0.28, 0.84, -0.08], [0.32, 0.04, 0.3], 0xd8a848);
      for (let r = 0; r < 5; r++) glow([0.28, 0.16 + r * 0.13, 0.064], [0.22, 0.07, 0.006], 0xfff0c2);
      // 前方萬豪集團紅毯迎賓廣場與WET池畔
      hb([0, 0.068, 0.22], [0.36, 0.012, 0.16], 0xb83a3a);
      hb([-0.28, 0.072, 0.22], [0.24, 0.018, 0.14], 0x6ec3d0);
      return true;
    }
    case "ihgBrandCluster": {
      // 洲際酒店集團合作體系（IHG Hotels & Resorts · 4 家：臺中勤美洲際、新北北海溫泉洲際、台南大員皇冠假日、高雄中央公園英迪格）
      b([0, 0.03, 0], [0.98, 0.06, 0.78], 0xdce6e4);
      // 左：InterContinental 臺中勤美洲際（垂直綠意奢華高塔）& 北海溫泉洲際（海景露天風呂）
      b([-0.26, 0.5, -0.08], [0.32, 0.88, 0.3], 0xf4eee4);
      hb([-0.26, 0.96, -0.08], [0.36, 0.04, 0.32], 0xd8a848);
      for (let r = 0; r < 6; r++) {
        glow([-0.26, 0.15 + r * 0.125, 0.074], [0.25, 0.065, 0.006], 0xffe49e);
        if (r % 2 === 1) sphere([-0.38, 0.15 + r * 0.125, 0.08], [0.06, 0.035, 0.05], green);
      }
      for (let k = -2; k <= 2; k++) bulb([-0.26 + k * 0.05, 1.01, 0.08], 0.025, 0xd8a848);
      // 中右：Crowne Plaza 台南大員皇冠假日（安平魚簍斜交格柵中庭建築）
      b([0.08, 0.36, -0.08], [0.28, 0.6, 0.28], 0xede0cc);
      glow([0.08, 0.36, 0.064], [0.22, 0.46, 0.006], 0xfff0c2);
      for (const s of [-1, 1]) hb([0.08, 0.36, 0.07], [0.24, 0.015, 0.01], wood, [0, 0, s * 0.55]);
      // 右：Hotel Indigo 高雄中央公園英迪格（繽紛海港貨櫃設計酒店 + 高空酒吧）
      b([0.34, 0.42, -0.06], [0.22, 0.72, 0.26], 0x2c3e50);
      for (let r = 0; r < 5; r++) b([0.34, 0.15 + r * 0.125, 0.075], [0.18, 0.075, 0.025], [C.coral, yel, teal2, 0xf2b5c6, 0xd8a848][r]);
      // 前方金山北海溫泉無邊際海景湯池
      hb([-0.18, 0.07, 0.22], [0.46, 0.022, 0.16], 0x6ec3d0);
      for (const sx of [-0.28, -0.08]) sphere([sx, 0.11, 0.22], [0.06, 0.035, 0.05], 0xffffff);
      return true;
    }
    case "globalLuxuryCluster": {
      // 國際奢華與跨國酒店集團（6 家：臺北文華東方、臺北嘉佩樂、台北／台南遠東香格里拉、台北君悅、星野虹夕諾雅谷關）
      b([0, 0.03, 0], [0.98, 0.06, 0.78], 0xe8dfd1);
      // 左：臺北文華東方（歐式古典孟莎頂宮殿 + 金色扇形冠頂）& 臺北嘉佩樂拱廊
      b([-0.28, 0.4, -0.08], [0.32, 0.68, 0.3], 0xf3ead8);
      p("hip", [-0.28, 0.78, -0.08], [0.36, 0.13, 0.34], 0x37474f);
      p("dome", [-0.28, 0.87, -0.08], [0.16, 0.1, 0.16], 0xd8a848);
      for (let r = 0; r < 4; r++) glow([-0.28, 0.16 + r * 0.13, 0.074], [0.24, 0.07, 0.006], 0xfff0c2);
      // 中：Shangri-La 台北／台南遠東香格里拉摩天巨塔 & Grand Hyatt 台北君悅
      b([0.02, 0.54, -0.1], [0.28, 0.94, 0.28], 0xdfd3c0);
      for (let r = 0; r < 7; r++) glow([0.02, 0.15 + r * 0.12, 0.044], [0.22, 0.06, 0.006], 0xffe49e);
      for (const dx of [-0.07, 0.07]) p("cone", [0.02 + dx, 1.06, -0.1], [0.07, 0.14, 0.07], 0xd8a848);
      for (let k = -2; k <= 2; k++) bulb([0.02 + k * 0.05, 1.0, 0.05], 0.026, 0xd8a848);
      // 右：星野集團 HOSHINOYA 虹夕諾雅 谷關（日式檜木格柵溫泉高樓 + 水之庭園）
      b([0.3, 0.38, -0.08], [0.26, 0.64, 0.26], 0xeadbc5);
      p("hip", [0.3, 0.74, -0.08], [0.3, 0.1, 0.3], 0x4a3f35);
      for (let r = 0; r < 4; r++) glow([0.3, 0.16 + r * 0.13, 0.054], [0.2, 0.07, 0.006], 0xfff0c2);
      // 君悅迎賓噴泉與谷關水之庭園
      cy([-0.08, 0.08, 0.22], 0.18, 0.03, 0x7fd0d8);
      sphere([-0.08, 0.12, 0.22], 0.04, 0xd5ecee);
      plant(0.28, 0.22, 0.22);
      return true;
    }
    case "taiwanLuxuryCluster": {
      // 台灣指標星級與頂級渡假集團（7 家：日月潭雲品、礁溪老爺、礁溪寒沐、台北／高雄漢來、台中裕元花園、花蓮瑞穗天合城堡）
      b([0, 0.03, 0], [0.98, 0.06, 0.78], 0xd8e4d4);
      // 左：高雄／台北漢來大飯店（新古典皇冠地標巨塔）& 台中裕元花園雙塔
      b([-0.28, 0.5, -0.08], [0.3, 0.88, 0.3], 0xf5ebd6);
      p("hip", [-0.28, 0.98, -0.08], [0.34, 0.1, 0.34], 0xd8a848);
      for (let r = 0; r < 6; r++) glow([-0.28, 0.16 + r * 0.13, 0.074], [0.22, 0.07, 0.006], 0xfff0c2);
      for (let k = -2; k <= 2; k++) bulb([-0.28 + k * 0.05, 0.96, 0.08], 0.025, 0xd8a848);
      // 中：花蓮瑞穗天合國際觀光酒店（歐風莊園城堡與哥德式高聳尖塔鐘樓）
      b([0.04, 0.36, -0.1], [0.32, 0.56, 0.28], 0xf7f0e2);
      p("hip", [0.04, 0.68, -0.1], [0.36, 0.1, 0.32], 0xa34e34);
      b([0.04, 0.58, -0.06], [0.16, 0.68, 0.16], 0xf7f0e2);
      p("cone", [0.04, 1.04, -0.06], [0.2, 0.26, 0.2], 0x3e7c8c);
      bulb([0.04, 1.19, -0.06], 0.038, 0xd8a848);
      // 右：雲品溫泉酒店日月潭 & 礁溪老爺・寒沐溫泉渡假會館
      b([0.32, 0.34, -0.08], [0.24, 0.56, 0.26], 0xede2cf);
      p("dome", [0.32, 0.65, -0.08], [0.2, 0.08, 0.18], 0xd8a848);
      for (let r = 0; r < 4; r++) glow([0.32, 0.15 + r * 0.12, 0.054], [0.18, 0.065, 0.006], 0xffe49e);
      // 前方日月潭湖景與瑞穗黃金湯水樂園泳池
      hb([0.08, 0.07, 0.22], [0.58, 0.022, 0.16], 0x6ec3d0);
      plant(-0.34, 0.22, 0.22);
      return true;
    }
    // ---------------- 實習旅館專島：25 棟獨立實習旅館等比例精緻 3D 大樓（無分區、相似量體、四面發光格柵窗） ----------------
    case "htlQunxian":
    case "htlMandarin":
    case "htlWTaipei":
    case "htlCapella":
    case "htlGrandHyatt":
    case "htlShangriLaTpe":
    case "htlSheratonTpe":
    case "htlMeridienTpe":
    case "htlHilaiTpe":
    case "htlSheratonHsz":
    case "htlICNewTaipei":
    case "htlRoyalJiaoxi":
    case "htlMuJiaoxi":
    case "htlICTaichung":
    case "htlMeridienTxg":
    case "htlFleurDeChine":
    case "htlHoshinoya":
    case "htlWindsor":
    case "htlMoxy":
    case "htlShangriLaTnn":
    case "htlCrownePlaza":
    case "htlAmnis":
    case "htlHilaiKhh":
    case "htlIndigoKhh":
    case "htlGrandCosmos": {
      const buildGrandHotel = (cfg) => {
        // 統一全島 25 棟實習旅館之建築基底、面寬(0.54)、塔高(0.76)與進深(0.36)，展現完全對等之星級飯店氣勢
        const w = 0.54,
          h = 0.76,
          d = 0.36,
          z0 = -0.05;
        const trim = cfg.trim || 0xd8a848,
          cornice = cfg.cornice || trim,
          pilaster = cfg.pilaster || trim;
        // 雙層石材迎賓基座（統一 0.88 x 0.72 尺度，確保 25 棟飯店大樓量體一致且零閃爍）
        b([0, 0.03, 0], [0.88, 0.06, 0.72], cfg.plinth || 0xe7dfd1);
        b([0, 0.072, 0], [0.76, 0.024, 0.58], cfg.terrace || 0xf4ede1);
        // 挑高二層迎賓大廳基座 + 金銅雨棚 Porte-cochère + 貴賓迎賓地毯
        const podD = d + 0.04,
          frontZ = z0 + podD / 2;
        b([0, 0.164, z0], [w + 0.06, 0.16, podD], cfg.podium || cfg.wall);
        glow([0, 0.156, frontZ + 0.005], [w - 0.08, 0.088, 0.006], 0xfff1c8);
        hb([0, 0.212, frontZ + 0.065], [0.28, 0.022, 0.12], trim);
        for (const cx of [-0.11, 0.11]) cy([cx, 0.142, frontZ + 0.105], 0.018, 0.116, trim);
        hb([0, 0.088, frontZ + 0.08], [0.16, 0.008, 0.15], cfg.carpet || 0xb83a3a);
        const topY = 0.084 + h;
        if (cfg.cylinder) {
          // 圓柱摩天塔身（台南遠東香格里拉）— 等高同寬量體 + 360 度環狀光帶窗
          cy([0, 0.084 + h / 2, z0], w * 0.96, h, cfg.wall);
          for (let r = 0; r < 5; r++) {
            const wy = 0.3 + r * ((h - 0.24) / 4.2);
            const wc = Array.isArray(cfg.win) ? cfg.win[r % cfg.win.length] : cfg.win || 0xffe49e;
            ring([0, wy, z0], w * 0.49, wc);
            glow([0, wy, z0 + w * 0.48 + 0.005], [w * 0.52, 0.064, 0.006], wc);
            glow([0, wy, z0 - w * 0.48 - 0.005], [w * 0.52, 0.064, 0.006], wc);
          }
          cy([0, topY + 0.018, z0], w * 1.02, 0.036, cornice);
        } else if (cfg.twin) {
          // 雙子星對稱連通高塔（新竹喜來登／台中裕元花園）— 外框總寬與高度完全對齊單棟標準
          const wingW = (w - 0.06) / 2;
          for (const sx of [-1, 1]) {
            const wx = sx * (wingW / 2 + 0.03);
            b([wx, 0.084 + h / 2, z0], [wingW, h, d], cfg.wall);
            hb([wx, topY + 0.018, z0], [wingW + 0.025, 0.036, d + 0.03], cornice);
            for (let r = 0; r < 5; r++) {
              const wy = 0.3 + r * ((h - 0.24) / 4.2);
              const wc = Array.isArray(cfg.win) ? cfg.win[r % cfg.win.length] : cfg.win || 0x9fd3de;
              glow([wx, wy, z0 + d / 2 + 0.005], [wingW - 0.05, 0.068, 0.006], wc);
              glow([wx, wy, z0 - d / 2 - 0.005], [wingW - 0.05, 0.068, 0.006], wc);
              glow([wx + sx * (wingW / 2 + 0.005), wy, z0], [0.006, 0.068, d - 0.08], wc);
            }
          }
          // 高空景觀連通天橋
          b([0, 0.68, z0], [0.1, 0.09, d * 0.68], cfg.bridgeCol || 0xf7f2e7);
          glow([0, 0.68, z0 + (d * 0.68) / 2 + 0.005], [0.08, 0.055, 0.006], 0xffe49e);
        } else {
          // 標準五星級飯店塔樓：四角古典／金屬壁柱 + 四面 360 度格柵落地窗 + 水平飾帶
          b([0, 0.084 + h / 2, z0], [w, h, d], cfg.wall);
          for (const sx of [-1, 1])
            for (const sz of [-1, 1])
              hb([sx * (w / 2 - 0.006), 0.244 + (h - 0.18) / 2, z0 + sz * (d / 2 - 0.006)], [0.028, h - 0.18, 0.028], pilaster);
          for (let r = 0; r < 5; r++) {
            const wy = 0.3 + r * ((h - 0.24) / 4.2);
            const wc = Array.isArray(cfg.win) ? cfg.win[r % cfg.win.length] : cfg.win || 0xffe49e;
            glow([0, wy, z0 + d / 2 + 0.005], [w - 0.09, 0.068, 0.006], wc);
            glow([0, wy, z0 - d / 2 - 0.005], [w - 0.09, 0.068, 0.006], wc);
            glow([-w / 2 - 0.005, wy, z0], [0.006, 0.068, d - 0.09], wc);
            glow([w / 2 + 0.005, wy, z0], [0.006, 0.068, d - 0.09], wc);
            if (cfg.ledges) {
              const lc = Array.isArray(cfg.ledges) ? cfg.ledges[r % cfg.ledges.length] : cfg.ledges;
              hb([0, wy - 0.044, z0], [w + 0.02, 0.012, d + 0.02], lc);
            }
          }
          hb([0, topY + 0.018, z0], [w + 0.04, 0.036, d + 0.04], cornice);
        }
        // 屋頂五顆璀璨金星冠冕 + 左右迎賓植栽
        for (let k = -2; k <= 2; k++) bulb([k * 0.072, topY + 0.056, z0 + d / 2 + 0.01], 0.022, 0xffe49e);
        plant(-0.34, 0.24, 0.2);
        plant(0.34, 0.24, 0.2);
        return { w, h, d, z0, topY, frontZ };
      };

      switch (kind) {
        case "htlQunxian": {
          // 01 群賢會館（校內實習旅館）：高餐大經典暖白石材、學院藍斜瓦冠頂、黃銅旋轉門與鳥籠行李車
          const m = buildGrandHotel({ w: 0.56, h: 0.75, d: 0.38, wall: 0xf7f1e3, podium: 0xeadcc6, trim: 0xd8a848, pilaster: 0xdfc9a6, win: 0xffe49e });
          p("hip", [0, m.topY + 0.085, m.z0], [m.w + 0.08, 0.1, m.d + 0.08], 0x2f5a8a);
          cy([0.2, 0.12, m.frontZ + 0.07], 0.055, 0.07, 0xd8a848); // 黃銅鳥籠行李車
          return true;
        }
        case "htlMandarin": {
          // 02 臺北文華東方酒店：歐式新古典米白石材立面、深灰板岩孟莎斜頂與香檳金圓頂冠冕
          const m = buildGrandHotel({ w: 0.55, h: 0.74, d: 0.37, wall: 0xf3ead8, podium: 0xe6d8be, trim: 0xc89d4c, cornice: 0x37474f, pilaster: 0xdfd1b8, win: 0xfff0c2 });
          p("hip", [0, m.topY + 0.08, m.z0], [m.w + 0.05, 0.09, m.d + 0.05], 0x37474f);
          p("dome", [0, m.topY + 0.14, m.z0], [0.18, 0.08, 0.16], 0xd8a848);
          return true;
        }
        case "htlWTaipei": {
          // 03 台北W飯店：信義區時尚銀灰玻璃帷幕大樓、珊瑚桃紅 W 頂樓標誌與 WET 碧波泳池露台
          const m = buildGrandHotel({ w: 0.53, h: 0.78, d: 0.36, wall: 0xd8e4ea, podium: 0x2b2d38, trim: C.coral, cornice: 0x2b2d38, pilaster: 0x9fb4c0, win: [0x9fd3de, 0x9fd3de, 0xf2b5c6], carpet: C.coral });
          b([0, m.topY + 0.068, m.z0 + 0.06], [0.16, 0.065, 0.035], C.coral);
          hb([-0.22, 0.09, 0.21], [0.16, 0.012, 0.1], 0x5fd0df);
          return true;
        }
        case "htlCapella": {
          // 04 臺北嘉佩樂酒店：敦北林蔭大道溫潤萊姆石拱廊立面、古銅格柵冠頂與空中花園露台
          const m = buildGrandHotel({ w: 0.54, h: 0.75, d: 0.37, wall: 0xefe4d0, podium: 0xdfd0b6, trim: 0xa87d46, pilaster: 0xc9b493, ledges: 0xd8c5a8, win: 0xffe6a8 });
          b([0, m.topY + 0.062, m.z0], [0.36, 0.052, 0.22], 0xf7f1e5);
          for (const gx of [-0.18, 0.18]) sphere([gx, m.topY + 0.06, m.z0], [0.07, 0.045, 0.07], green);
          return true;
        }
        case "htlGrandHyatt": {
          // 05 台北君悅酒店：信義區氣派暖砂花崗岩寬體地標、階梯式古銅斜頂與迎賓圓形噴泉廣場
          const m = buildGrandHotel({ w: 0.56, h: 0.76, d: 0.38, wall: 0xe6d6be, podium: 0xd8c4a6, trim: 0xb88944, pilaster: 0xcfb998, win: 0xffe49e });
          p("hip", [0, m.topY + 0.075, m.z0], [m.w + 0.02, 0.08, m.d + 0.02], 0x6d5843);
          cy([-0.22, 0.096, 0.21], 0.12, 0.024, 0x7fd0d8);
          sphere([-0.22, 0.125, 0.21], 0.032, 0xd5ecee);
          return true;
        }
        case "htlShangriLaTpe": {
          // 06 台北遠東香格里拉：敦南地標後現代香檳花崗岩高塔與標誌性雙金尖塔冠冕
          const m = buildGrandHotel({ w: 0.53, h: 0.78, d: 0.36, wall: 0xdfd2be, podium: 0xcfbda3, trim: 0xd8a848, pilaster: 0xc7b396, win: 0xffe49e });
          b([0, m.topY + 0.06, m.z0], [0.34, 0.048, 0.22], 0xdfd2be);
          for (const sx of [-0.1, 0.1]) p("cone", [sx, m.topY + 0.115, m.z0], [0.075, 0.11, 0.075], 0xd8a848);
          return true;
        }
        case "htlSheratonTpe": {
          // 07 台北喜來登大飯店：忠孝東路經典星級商務大飯店、水平石材遮陽飾帶與金銅閣樓冠頂
          const m = buildGrandHotel({ w: 0.56, h: 0.74, d: 0.38, wall: 0xf2e7d5, podium: 0xd9c6ac, trim: 0xb8863b, ledges: 0xd5c0a3, win: 0xfff0c2 });
          b([0, m.topY + 0.062, m.z0], [0.38, 0.052, 0.24], 0xb8863b);
          return true;
        }
        case "htlMeridienTpe": {
          // 08 台北寒舍艾美酒店：信義時尚珍珠白與冰藍玻璃帷幕立面、當代藝術紅銅迎賓雕塑
          const m = buildGrandHotel({ w: 0.54, h: 0.75, d: 0.36, wall: 0xedf3f5, podium: 0x353b42, trim: 0xc89b54, cornice: 0x353b42, pilaster: 0xcfdbe0, win: 0xbfe6ee });
          b([0, m.topY + 0.06, m.z0], [0.34, 0.048, 0.22], 0x353b42);
          ring([-0.21, 0.135, 0.21], 0.045, C.coral, [0, 0.4, 0]);
          return true;
        }
        case "htlHilaiTpe": {
          // 09 台北漢來大飯店：南港現代銀白玻璃帷幕結合香檳金格柵立面與無邊際泳池露台
          const m = buildGrandHotel({ w: 0.54, h: 0.77, d: 0.37, wall: 0xe3ecef, podium: 0xf2eadc, trim: 0xd8a848, pilaster: 0xd8a848, win: 0xd5ecee });
          b([0, m.topY + 0.064, m.z0], [0.36, 0.055, 0.22], 0xd8a848);
          hb([0.22, 0.09, 0.21], [0.15, 0.012, 0.09], 0x6ec3d0);
          return true;
        }
        case "htlSheratonHsz": {
          // 10 新竹豐邑喜來登大飯店：竹北對稱雙子星現代玻璃帷幕高塔與高空光雕連通廊橋
          const m = buildGrandHotel({ w: 0.56, h: 0.77, d: 0.36, twin: true, wall: 0xdbe7ee, podium: 0xeae4d8, trim: 0xc89b48, win: [0x9fd3de, 0xffe49e], bridgeCol: 0xd8a848 });
          b([0, m.topY + 0.055, m.z0], [0.22, 0.04, 0.2], 0xc89b48);
          return true;
        }
        case "htlICNewTaipei": {
          // 11 新北北海溫泉洲際酒店：金山依山傍海石材與溫潤木格柵星級渡假本館＋海景無邊際溫泉池
          const m = buildGrandHotel({ w: 0.54, h: 0.74, d: 0.37, wall: 0xe9dfd0, podium: 0x5c4b3e, trim: 0xb88b4a, cornice: 0x3e5a66, ledges: 0xb48560, win: 0xffe49e, carpet: 0x3e7c8c });
          p("hip", [0, m.topY + 0.075, m.z0], [m.w + 0.06, 0.08, m.d + 0.06], 0x3e5a66);
          hb([-0.22, 0.092, 0.21], [0.17, 0.014, 0.1], 0x6ec3d0);
          return true;
        }
        case "htlRoyalJiaoxi": {
          // 12 礁溪老爺酒店：蘭陽平原日式禪風暖木斜頂星級溫泉本館與露天石砌風呂湯池
          const m = buildGrandHotel({ w: 0.55, h: 0.73, d: 0.37, wall: 0xf1e6d4, podium: 0x6e543e, trim: 0xa67846, cornice: 0x4a3f35, ledges: 0xc49a6c, win: 0xfff0c2, carpet: 0x8b4a3a });
          p("hip", [0, m.topY + 0.08, m.z0], [m.w + 0.08, 0.09, m.d + 0.08], 0x4a3f35);
          cy([0.22, 0.094, 0.21], 0.11, 0.02, 0x8fd2dc);
          return true;
        }
        case "htlMuJiaoxi": {
          // 13 礁溪寒沐酒店：當代清水模灰白石材結合原木幾何格柵陽台溫泉大樓
          const m = buildGrandHotel({ w: 0.54, h: 0.74, d: 0.37, wall: 0xe5e2dc, podium: 0x474542, trim: 0xb48560, cornice: 0x474542, pilaster: 0xb48560, ledges: 0xc89d6c, win: 0xffe8ad });
          b([0, m.topY + 0.06, m.z0], [0.36, 0.048, 0.22], 0x474542);
          return true;
        }
        case "htlICTaichung": {
          // 14 臺中勤美洲際酒店：草悟道垂直森林綠意奢華高塔、層疊空中植栽露台與香檳金冠頂
          const m = buildGrandHotel({ w: 0.54, h: 0.77, d: 0.37, wall: 0xf2ece2, podium: 0x3b443e, trim: 0xd8a848, ledges: 0x7aa368, win: 0xffe49e });
          for (const [gx, gy] of [[-0.22, 0.42], [0.22, 0.54], [-0.2, 0.66], [0.2, 0.78]])
            sphere([gx, gy, m.z0 + m.d / 2 + 0.02], [0.065, 0.036, 0.045], green);
          b([0, m.topY + 0.062, m.z0], [0.36, 0.05, 0.22], 0xd8a848);
          return true;
        }
        case "htlMeridienTxg": {
          // 15 台中李芳艾美酒店：中區地標冰藍玻璃帷幕高塔與標誌性金色圓筒光冠圓頂
          const m = buildGrandHotel({ w: 0.52, h: 0.77, d: 0.36, wall: 0xd9e7ee, podium: 0xece6da, trim: 0xd8a848, pilaster: 0xb9cdd8, win: 0x9fd3de });
          cy([0, m.topY + 0.065, m.z0], 0.24, 0.055, 0xd8a848);
          p("dome", [0, m.topY + 0.11, m.z0], [0.2, 0.065, 0.2], 0xffe49e);
          return true;
        }
        case "htlFleurDeChine": {
          // 16 雲品溫泉酒店：日月潭湖畔溫潤米白與木紋格柵星級本館、湖景水鏡露台與金蓮冠頂
          const m = buildGrandHotel({ w: 0.55, h: 0.74, d: 0.37, wall: 0xf4ecde, podium: 0xcbb698, trim: 0xc99a48, ledges: 0xc7a87c, win: 0xfff0c2, carpet: 0x3e7c8c });
          p("dome", [0, m.topY + 0.08, m.z0], [0.24, 0.075, 0.2], 0xd8a848);
          hb([0.22, 0.09, 0.21], [0.16, 0.012, 0.1], 0x5ab8c8);
          return true;
        }
        case "htlHoshinoya": {
          // 17 虹夕諾雅 谷關：星野集團檜木縱格柵山林奢華溫泉樓閣、深色切妻斜頂與水之庭園
          const m = buildGrandHotel({ w: 0.53, h: 0.74, d: 0.36, wall: 0xeadbc5, podium: 0x5a493b, trim: 0xb08452, cornice: 0x433931, pilaster: 0x9c7448, win: 0xffe6a3, carpet: 0x5a493b });
          p("hip", [0, m.topY + 0.082, m.z0], [m.w + 0.08, 0.092, m.d + 0.08], 0x433931);
          hb([-0.22, 0.09, 0.21], [0.16, 0.012, 0.1], 0x7fd0d8);
          return true;
        }
        case "htlWindsor": {
          // 18 裕元花園酒店：台中台灣大道標誌性雙子星寶藍玻璃帷幕高塔與高空景觀廊橋
          const m = buildGrandHotel({ w: 0.56, h: 0.77, d: 0.36, twin: true, wall: 0xd4e4ec, podium: 0xebe3d5, trim: 0xd8a848, win: 0x9fd3de, bridgeCol: 0xf7f2e7 });
          b([0, m.topY + 0.055, m.z0], [0.2, 0.04, 0.18], 0xd8a848);
          return true;
        }
        case "htlMoxy": {
          // 19 台中豐邑MOXY酒店：萬豪潮流精品炭黑工業風立面、桃紅霓虹窗光與 Rooftop Bar Moxy 燈牌
          const m = buildGrandHotel({ w: 0.52, h: 0.75, d: 0.36, wall: 0x2e313d, podium: 0x23252f, trim: 0xe05288, cornice: 0xe05288, pilaster: 0x464a5a, ledges: C.coral, win: [0xf2b5c6, 0xffe49e], carpet: 0xe05288 });
          glow([0, m.topY + 0.068, m.z0 + 0.06], [0.24, 0.055, 0.025], 0xe05288);
          return true;
        }
        case "htlShangriLaTnn": {
          // 20 台南遠東香格里拉：府城最高地標圓柱摩天星級酒店、360 度環景光帶窗與皇冠金環頂
          const m = buildGrandHotel({ w: 0.54, h: 0.78, d: 0.38, cylinder: true, wall: 0xf2e7d5, podium: 0xdfd0b8, trim: 0xd8a848, win: [0x9fd3de, 0xffe49e] });
          cy([0, m.topY + 0.062, m.z0], 0.32, 0.05, 0xd8a848);
          p("dome", [0, m.topY + 0.1, m.z0], [0.18, 0.05, 0.18], 0xffe49e);
          return true;
        }
        case "htlCrownePlaza": {
          // 21 台南大員皇冠假日酒店：安平港畔現代暖砂建築、豐收魚簍斜交格柵立面與皇冠紫紅冠頂
          const m = buildGrandHotel({ w: 0.55, h: 0.74, d: 0.37, wall: 0xefe2ce, podium: 0xdcc8ab, trim: 0xb85a6a, cornice: 0x8e3b4e, pilaster: 0xc49a6c, win: 0xfff0c2, carpet: 0x8e3b4e });
          for (const s of [-1, 1]) p("box", [0, 0.52, m.z0 + m.d / 2 + 0.012], [0.42, 0.014, 0.01], 0xb48560, [0, 0, s * 0.52]);
          b([0, m.topY + 0.06, m.z0], [0.34, 0.048, 0.22], 0x8e3b4e);
          return true;
        }
        case "htlAmnis": {
          // 22 然一酒店 The AMNIS：高雄亞洲新灣區萬豪奢華精選黑金水岸藝術高塔與鏡面水池
          const m = buildGrandHotel({ w: 0.53, h: 0.78, d: 0.36, wall: 0x27323d, podium: 0x1e262f, trim: 0xd8a848, pilaster: 0xc59849, ledges: 0xd8a848, win: 0xffe49e });
          b([0, m.topY + 0.064, m.z0], [0.34, 0.052, 0.22], 0xd8a848);
          hb([-0.22, 0.09, 0.21], [0.16, 0.012, 0.1], 0x5ab8c8);
          return true;
        }
        case "htlHilaiKhh": {
          // 23 高雄漢來大飯店：南台灣新古典歐風象牙白石材地標大樓與金色宮廷斜頂皇冠
          const m = buildGrandHotel({ w: 0.56, h: 0.78, d: 0.38, wall: 0xf6ecd8, podium: 0xe6d6b8, trim: 0xd8a848, pilaster: 0xdfd0b2, win: 0xfff0c2 });
          p("hip", [0, m.topY + 0.085, m.z0], [m.w + 0.05, 0.095, m.d + 0.05], 0xd8a848);
          return true;
        }
        case "htlIndigoKhh": {
          // 24 高雄中央公園英迪格酒店：海港貨櫃繽紛色彩陽台飾帶設計精品酒店與 Pier No.1 高空酒吧
          const m = buildGrandHotel({ w: 0.52, h: 0.75, d: 0.36, wall: 0x313d4a, podium: 0x26303b, trim: 0xe8b04a, pilaster: 0x4c5c6d, ledges: [C.coral, yel, teal2, 0xf2b5c6, 0xd8a848], win: 0xffe49e, carpet: C.coral });
          glow([0, m.topY + 0.066, m.z0 + 0.04], [0.28, 0.05, 0.04], 0xffb36b);
          return true;
        }
        case "htlGrandCosmos": {
          // 25 瑞穗天合國際觀光酒店：花蓮縱谷歐風莊園城堡星級主樓、松石綠哥德尖塔鐘樓與黃金湯池
          const m = buildGrandHotel({ w: 0.55, h: 0.73, d: 0.37, wall: 0xf7efe0, podium: 0xe8dac2, trim: 0xc8963e, cornice: 0xa34e34, pilaster: 0xdfd0b6, win: 0xfff0c2 });
          p("hip", [0, m.topY + 0.076, m.z0], [m.w + 0.06, 0.085, m.d + 0.06], 0xa34e34);
          p("cone", [0, m.topY + 0.145, m.z0], [0.16, 0.13, 0.16], 0x3e7c8c);
          hb([0.22, 0.09, 0.21], [0.16, 0.012, 0.1], 0x6ec3d0);
          return true;
        }
      }
      return true;
    }
    // ---------------- 18 奢華體驗與金鑰匙管家 ----------------
    case "luxuryMicroSalon": {
      // 奢華體驗管理微學分（8 門三級三審課程）：香檳金玻璃穹頂沙龍 + 八座微學分實作島台
      b([0, 0.03, 0], [0.98, 0.06, 0.78], 0xede2ce);
      b([0, 0.068, 0], [0.88, 0.024, 0.68], 0xf8f3ea);
      // 主沙龍殿堂與玻璃穹頂
      b([0, 0.28, -0.08], [0.68, 0.4, 0.38], 0xf7efe0);
      hb([0, 0.5, -0.08], [0.74, 0.04, 0.42], 0xd8a848);
      p("dome", [0, 0.53, -0.08], [0.46, 0.26, 0.34], 0xffe8a8);
      ring([0, 0.54, -0.08], 0.24, 0xd8a848);
      bulb([0, 0.7, -0.08], 0.042, 0xfff0c2);
      // 正面香檳金拱窗與背光酒牆
      for (const sx of [-0.2, 0, 0.2]) {
        glow([sx, 0.28, 0.114], [0.14, 0.26, 0.008], 0xfff0c2);
        hb([sx, 0.28, 0.12], [0.16, 0.014, 0.012], 0xd8a848);
      }
      // 前方 8 座微學分主題工作坊島台（前排 4 座 + 側翼 4 座）
      const podCols = [0x8c2d38, 0xd8a848, 0x5c3c28, 0x5e9a6f, 0xf2b5c6, 0x3e7c8c, 0x6f7fb5, 0xdb6a41];
      for (let k = 0; k < 4; k++) {
        const px = -0.3 + k * 0.2;
        cy([px, 0.12, 0.24], 0.09, 0.08, 0xfbf8f2);
        cy([px, 0.165, 0.24], 0.1, 0.015, 0xd8a848);
        bulb([px, 0.195, 0.24], 0.022, podCols[k]);
      }
      for (let k = 0; k < 4; k++) {
        const sx = k < 2 ? -0.4 : 0.4,
          sz = k % 2 === 0 ? -0.14 : 0.08;
        cy([sx, 0.12, sz], 0.08, 0.08, 0xfbf8f2);
        bulb([sx, 0.19, sz], 0.02, podCols[k + 4]);
      }
      person(-0.14, 0.32, 0.34);
      person(0.16, 0.32, 0.34);
      return true;
    }
    case "goldKeyButlerPavilion": {
      // Gold Touch 金鑰匙管家款待殿堂：雙金鑰匙交叉徽章門樓、紅毯禮賓車道與英式下午茶三層架推車
      b([0, 0.03, 0], [0.96, 0.06, 0.76], 0xe8dcc8);
      b([0, 0.34, -0.08], [0.64, 0.56, 0.34], 0xf6eee0);
      p("hip", [0, 0.66, -0.08], [0.7, 0.11, 0.4], 0x2c3e50);
      hb([0, 0.61, -0.08], [0.68, 0.03, 0.38], 0xd8a848);
      // 屋頂交叉雙金鑰匙徽章立牌（Gold Touch 管家培訓意象）
      cy([0, 0.78, -0.04], 0.18, 0.04, 0x2c3e50, [Math.PI / 2, 0, 0]);
      for (const s of [-1, 1]) {
        hb([0, 0.78, -0.01], [0.022, 0.22, 0.014], 0xd8a848, [0, 0, s * 0.62]);
        ring([s * 0.055, 0.84, -0.01], 0.038, 0xd8a848, [0, 0, 0]);
      }
      for (let r = 0; r < 3; r++) glow([0, 0.18 + r * 0.14, 0.094], [0.48, 0.075, 0.006], 0xfff0c2);
      // 金銅迎賓雨棚與紅毯
      hb([0, 0.22, 0.19], [0.34, 0.025, 0.14], 0xd8a848);
      for (const sx of [-0.14, 0.14]) cy([sx, 0.14, 0.24], 0.02, 0.16, 0xd8a848);
      hb([0, 0.065, 0.24], [0.22, 0.01, 0.22], 0xb83a3a);
      // 英式下午茶三層點心推車 + 金色鳥籠行李車
      b([-0.28, 0.12, 0.24], [0.14, 0.1, 0.1], 0xd8a848);
      for (let t = 0; t < 3; t++) cy([-0.28, 0.18 + t * 0.035, 0.24], 0.06 - t * 0.012, 0.008, 0xffffff);
      b([0.28, 0.09, 0.24], [0.14, 0.02, 0.1], 0xd8a848);
      ring([0.28, 0.17, 0.24], 0.08, 0xd8a848, [0, 0, 0]);
      person(0, 0.28, 0.36);
      return true;
    }
    case "mysteryGuestAuditCenter": {
      // 實習旅館神秘客培訓與反饋（S3）：檢核放大鏡、群賢會館微縮示範房剖面與評分看板
      b([0, 0.03, 0], [0.96, 0.06, 0.76], 0xe6ddd0);
      // 左後：群賢會館微縮示範套房（含雙人床與房務檢核燈號）
      b([-0.18, 0.28, -0.06], [0.46, 0.44, 0.34], 0xf7f2e8);
      hb([-0.18, 0.51, -0.06], [0.5, 0.035, 0.38], 0xd8a848);
      glow([-0.18, 0.28, 0.114], [0.36, 0.28, 0.006], 0xfff5d6);
      b([-0.18, 0.14, 0.16], [0.24, 0.06, 0.14], 0xffffff);
      hb([-0.18, 0.175, 0.2], [0.24, 0.012, 0.05], 0xd8a848);
      // 右側：MOT 服務品質雷達與五顆金星檢核儀表板
      b([0.24, 0.32, -0.04], [0.28, 0.52, 0.24], 0x2c3e50);
      glow([0.24, 0.36, 0.084], [0.22, 0.32, 0.008], 0x9fd8e6);
      for (let k = -2; k <= 2; k++) bulb([0.24 + k * 0.042, 0.6, 0.06], 0.022, 0xd8a848);
      // 前方：巨型金色品質檢核放大鏡地標
      ring([0.04, 0.34, 0.24], 0.12, 0xd8a848, [0, 0, 0]);
      p("dome", [0.04, 0.34, 0.24], [0.1, 0.1, 0.02], 0xcfe8ee, [Math.PI / 2, 0, 0]);
      hb([0.13, 0.21, 0.24], [0.03, 0.14, 0.03], 0x2c3e50, [0, 0, 0.65]);
      person(-0.32, 0.28, 0.34);
      person(0.28, 0.26, 0.34);
      return true;
    }
    case "luxuryCorporateAcademy": {
      // 國際奢華酒店企業學苑與儲備幹部直通：頂奢雙子塔（歐式宮殿冠頂 + 現代奢華拱廊）與儲備幹部金階紅毯
      b([0, 0.03, 0], [0.98, 0.06, 0.78], 0xe8dfd1);
      // 左塔：文華東方歐式古典宮殿高塔 + 金色圓頂
      b([-0.24, 0.44, -0.08], [0.32, 0.76, 0.3], 0xf5ebd6);
      p("hip", [-0.24, 0.86, -0.08], [0.36, 0.12, 0.34], 0x37474f);
      p("dome", [-0.24, 0.95, -0.08], [0.16, 0.1, 0.16], 0xd8a848);
      for (let r = 0; r < 5; r++) glow([-0.24, 0.16 + r * 0.13, 0.074], [0.24, 0.065, 0.006], 0xfff0c2);
      // 右塔：嘉佩樂 & 然一酒店現代黑金石材奢華高塔
      b([0.24, 0.48, -0.08], [0.32, 0.84, 0.3], 0x27323d);
      hb([0.24, 0.92, -0.08], [0.36, 0.04, 0.34], 0xd8a848);
      for (let r = 0; r < 6; r++) glow([0.24, 0.15 + r * 0.12, 0.074], [0.24, 0.06, 0.006], 0xffe49e);
      // 中央高空金橋連結雙塔（象徵企業學苑共創）
      b([0, 0.58, -0.06], [0.22, 0.08, 0.14], 0xd8a848);
      glow([0, 0.58, 0.014], [0.18, 0.05, 0.006], 0xfff0c2);
      // 前方儲備幹部（MT）三階晉升金台與紅毯
      for (let s = 0; s < 3; s++) {
        b([0, 0.08 + s * 0.04, 0.26 - s * 0.07], [0.32 - s * 0.05, 0.04, 0.08], s === 2 ? 0xd8a848 : 0xb83a3a);
      }
      for (let k = -2; k <= 2; k++) bulb([k * 0.055, 0.98, 0.06], 0.025, 0xd8a848);
      person(0, 0.28, 0.36);
      return true;
    }
    // ---------------- 19 數位智慧服務與創新基地 ----------------
    case "d808SmartBase": {
      // D 棟 8 樓餐旅數位智慧服務與創新基地：流線型科技玻璃旗艦館與智慧設備展示
      b([0, 0.03, 0], [0.98, 0.06, 0.78], 0xd8e4e8);
      b([0, 0.068, 0], [0.88, 0.024, 0.68], 0xeef5f7);
      // 旗艦基地主體：弧角白銀科技館 + 青藍發光導光環
      b([0, 0.34, -0.08], [0.74, 0.52, 0.38], 0xf2f7f9);
      hb([0, 0.62, -0.08], [0.78, 0.04, 0.42], 0x2c3e50);
      glow([0, 0.62, 0.134], [0.72, 0.022, 0.008], 0x5ab8c8);
      // 中央巨型數位孿生戰情大螢幕
      b([0, 0.35, 0.114], [0.58, 0.34, 0.016], 0x1e2b38);
      glow([0, 0.35, 0.125], [0.52, 0.28, 0.006], 0x8be2f2);
      for (let k = -2; k <= 2; k++) hb([k * 0.09, 0.32 + (k % 2) * 0.04, 0.132], [0.05, 0.12, 0.006], [0xd8a848, C.coral, 0x5ab8c8, 0xffe49e, 0x5e9a6f][k + 2]);
      // 屋頂 D808 智慧光塔與雷達環
      cy([0, 0.72, -0.08], 0.24, 0.12, 0x3e7c8c);
      ring([0, 0.8, -0.08], 0.18, 0x5ab8c8);
      bulb([0, 0.86, -0.08], 0.04, 0x9fffd0);
      // 前方 3 座 AI 自助入住報到機（Self Check-in Kiosks）
      for (const sx of [-0.26, 0, 0.26]) {
        b([sx, 0.16, 0.24], [0.1, 0.18, 0.06], 0x2c3e50);
        glow([sx, 0.18, 0.274], [0.075, 0.11, 0.005], 0x9fffd0);
      }
      person(-0.14, 0.26, 0.34);
      person(0.14, 0.26, 0.34);
      return true;
    }
    case "aiotSmartSuite": {
      // AIoT 智慧客房與服務型機器人協作：智慧聲控透明套房 + 迎賓導引機器人與送物機器人車隊
      b([0, 0.03, 0], [0.96, 0.06, 0.76], 0xdce6ea);
      // 後方 AIoT 智慧客房示範艙（含情境光帶與電動窗簾窗景）
      b([0, 0.3, -0.08], [0.68, 0.48, 0.34], 0xf4f8fa);
      hb([0, 0.56, -0.08], [0.72, 0.035, 0.38], 0x3e7c8c);
      glow([0, 0.52, 0.094], [0.62, 0.02, 0.006], 0x7fd0d8);
      glow([-0.16, 0.28, 0.094], [0.28, 0.26, 0.006], 0xffe8a8);
      glow([0.2, 0.28, 0.094], [0.22, 0.26, 0.006], 0x9fd8e6);
      // 前方 3 台服務型機器人（左：迎賓導引機器人；中、右：客房送物機器人）
      for (const [rx, rz, col] of [[-0.24, 0.22, 0x5ab8c8], [0, 0.24, 0xd8a848], [0.24, 0.22, C.coral]]) {
        cy([rx, 0.15, rz], 0.11, 0.16, 0xf7f9fa);
        b([rx, 0.26, rz], [0.1, 0.075, 0.08], 0x2c3e50);
        glow([rx, 0.26, rz + 0.044], [0.075, 0.045, 0.005], 0x9fffd0);
        bulb([rx, 0.32, rz], 0.024, col);
      }
      person(-0.36, 0.22, 0.34);
      return true;
    }
    case "smartTechAllianceHub": {
      // 國際奢華旅館智能科技服務共創聯盟：產官學研四環共創星環圓頂館與雲端數據光塔
      b([0, 0.03, 0], [0.96, 0.06, 0.76], 0xdde5e7);
      cy([0, 0.24, -0.04], 0.58, 0.36, 0xf4f7f8);
      p("dome", [0, 0.42, -0.04], [0.54, 0.32, 0.54], 0x9fd3de);
      // 象徵產・官・學・研共創的雙向金色與青色星環
      ring([0, 0.46, -0.04], 0.34, 0xd8a848, [Math.PI / 2.4, 0.3, 0]);
      ring([0, 0.46, -0.04], 0.34, 0x3e7c8c, [Math.PI / 2.4, -0.3, 0]);
      bulb([0, 0.64, -0.04], 0.045, 0xffe49e);
      // 四座聯盟夥伴端點塔（奢華酒店、雲端PMS、AIoT硬體、高餐研發）
      for (const [sx, sz, col] of [[-0.32, -0.2, 0xd8a848], [0.32, -0.2, 0x3e7c8c], [-0.32, 0.18, C.coral], [0.32, 0.18, 0x5e9a6f]]) {
        b([sx, 0.22, sz], [0.16, 0.32, 0.16], 0xffffff);
        hb([sx, 0.39, sz], [0.18, 0.03, 0.18], col);
        bulb([sx, 0.43, sz], 0.024, col);
      }
      person(-0.12, 0.26, 0.34);
      person(0.12, 0.26, 0.34);
      return true;
    }
    case "operaAiCertArena": {
      // OPERA PMS 系列研習與 AI 雙軌認證：環形 PMS 操作席、AI-900／AWS AI 認證金牌與營運曲線
      b([0, 0.03, 0], [0.96, 0.06, 0.76], 0xdce4e6);
      b([0, 0.32, -0.08], [0.7, 0.5, 0.32], 0x263342);
      hb([0, 0.58, -0.08], [0.74, 0.035, 0.36], 0xd8a848);
      // OPERA PMS 房態矩陣與 RevPAR 上升曲線大螢幕
      glow([0, 0.33, 0.084], [0.6, 0.34, 0.008], 0x8be2f2);
      for (let k = 0; k < 5; k++) {
        b([-0.2 + k * 0.1, 0.22 + k * 0.03, 0.094], [0.05, 0.08 + k * 0.06, 0.008], k === 4 ? 0xd8a848 : 0x3e7c8c);
      }
      // 屋頂雙軌認證金牌（B 類 PMS 認證 + C 類 AWS / Google AI 認證）
      for (const [sx, col] of [[-0.18, 0x5ab8c8], [0.18, 0xd8a848]]) {
        cy([sx, 0.7, -0.06], 0.14, 0.04, col, [Math.PI / 2, 0, 0]);
        bulb([sx, 0.7, -0.03], 0.028, 0xfff0c2);
      }
      // 前方環形實機操作工作站
      for (const sx of [-0.22, 0, 0.22]) {
        b([sx, 0.11, 0.22], [0.14, 0.08, 0.08], 0xf4f7f8);
        glow([sx, 0.17, 0.21], [0.1, 0.06, 0.006], 0x9fffd0);
      }
      person(-0.22, 0.28, 0.32);
      person(0.22, 0.28, 0.32);
      return true;
    }
    // ---------------- 20 永續旅宿治理、研發與 USR ----------------
    case "isoNetZeroPavilion": {
      // 智慧餐旅永續營運治理（ISO 14064・14067・50001）：垂直森林綠建築星級飯店、太陽能斜頂與碳盤查儀表板
      b([0, 0.03, 0], [0.98, 0.06, 0.78], 0xd4e2cc);
      b([0, 0.068, 0], [0.88, 0.024, 0.68], 0xe8f0e2);
      // 垂直森林綠建築主樓
      b([0, 0.38, -0.08], [0.64, 0.62, 0.34], 0xf4f1e8);
      // 太陽能光電斜頂板
      b([0, 0.72, -0.08], [0.68, 0.04, 0.38], 0x243b55, [0.18, 0, 0]);
      for (let k = -2; k <= 2; k++) hb([k * 0.12, 0.74, -0.08], [0.01, 0.012, 0.36], 0x7fd0d8, [0.18, 0, 0]);
      // 層疊空中花園露台與發光節能窗
      for (let r = 0; r < 4; r++) {
        glow([0, 0.16 + r * 0.135, 0.094], [0.5, 0.065, 0.006], 0xd8f5d0);
        hb([0, 0.12 + r * 0.135, 0.1], [0.58, 0.018, 0.03], 0x5e9a6f);
        sphere([(r % 2 ? -1 : 1) * 0.26, 0.15 + r * 0.135, 0.11], [0.07, 0.045, 0.05], green);
      }
      // 前方三大 ISO 永續認證光柱（ISO 14064 / 14067 / 50001）
      for (const [sx, col] of [[-0.24, 0x5e9a6f], [0, 0x3e7c8c], [0.24, 0xd8a848]]) {
        b([sx, 0.15, 0.24], [0.12, 0.18, 0.06], col);
        glow([sx, 0.16, 0.274], [0.09, 0.11, 0.005], 0xffffff);
      }
      plant(-0.38, 0.2, 0.32);
      plant(0.38, 0.2, 0.32);
      return true;
    }
    case "topScientistResearchTower": {
      // 教師學術研發與國科會計畫（史丹佛全球前 2% 科學家）：金冠地球儀研究塔與期刊典藏翼樓
      b([0, 0.03, 0], [0.96, 0.06, 0.76], 0xdde4d8);
      // 中央學術觀測高塔
      b([0, 0.44, -0.08], [0.34, 0.76, 0.32], 0xf7f4ec);
      hb([0, 0.84, -0.08], [0.38, 0.04, 0.36], 0xd8a848);
      for (let r = 0; r < 5; r++) glow([0, 0.16 + r * 0.13, 0.084], [0.24, 0.065, 0.006], 0xfff0c2);
      // 塔頂「全球前 2% 頂尖科學家」金色地球儀與雙星環
      sphere([0, 0.98, -0.08], 0.11, 0x3e7c8c);
      ring([0, 0.98, -0.08], 0.15, 0xd8a848, [0.5, 0.4, 0]);
      bulb([0, 1.11, -0.08], 0.035, 0xffe49e);
      // 左右兩翼：國科會 NSTC 計畫室與 SSCI 國際期刊典藏館
      for (const s of [-1, 1]) {
        b([s * 0.3, 0.26, -0.06], [0.24, 0.4, 0.26], 0xece6d8);
        hb([s * 0.3, 0.47, -0.06], [0.26, 0.03, 0.28], 0x3e7c8c);
        glow([s * 0.3, 0.26, 0.074], [0.18, 0.24, 0.006], 0xd5ecee);
      }
      // 前方最佳論文獎金色獎座台
      cy([0, 0.12, 0.24], 0.14, 0.08, 0xd8a848);
      bulb([0, 0.2, 0.24], 0.032, 0xffe49e);
      person(-0.2, 0.24, 0.36);
      person(0.2, 0.24, 0.36);
      return true;
    }
    case "starHotelThinkTank": {
      // 星級旅館評鑑制度革新研究與教師專業服務：五顆金星評鑑拱門、研究圓桌與講堂
      b([0, 0.03, 0], [0.96, 0.06, 0.76], 0xe2dfd4);
      b([0, 0.32, -0.08], [0.68, 0.52, 0.34], 0xf6f0e2);
      p("hip", [0, 0.62, -0.08], [0.74, 0.1, 0.4], 0x3e7c8c);
      hb([0, 0.57, -0.08], [0.72, 0.035, 0.38], 0xd8a848);
      // 屋頂五顆璀璨星級旅館評鑑金星
      for (let k = -2; k <= 2; k++) {
        bulb([k * 0.09, 0.7, 0.06], 0.032, 0xd8a848);
      }
      for (let r = 0; r < 3; r++) glow([0, 0.17 + r * 0.13, 0.094], [0.54, 0.07, 0.006], 0xfff0c2);
      // 前方評鑑委員智庫圓桌與星級標章立碑
      cy([0, 0.12, 0.22], 0.22, 0.04, wood);
      cy([0, 0.145, 0.22], 0.18, 0.01, 0xfbf8f2);
      person(-0.22, 0.22, 0.34);
      person(0.22, 0.22, 0.34);
      person(0, 0.34, 0.34);
      return true;
    }
    case "usrElementaryGarden": {
      // USR 國小在地陪伴服務與永續旅宿觀摩：雙語餐桌禮儀小學堂、愛心地球綠意亭與環保標章參訪巴士
      b([0, 0.03, 0], [0.96, 0.06, 0.76], 0xd8e8ce);
      // 左後：在地國小雙語與餐桌禮儀陽光學堂
      b([-0.16, 0.26, -0.06], [0.52, 0.4, 0.32], 0xfbf5e8);
      p("hip", [-0.16, 0.5, -0.06], [0.58, 0.1, 0.36], C.coral);
      glow([-0.16, 0.26, 0.104], [0.4, 0.22, 0.006], 0xfff0c2);
      // 右前：綠色星級酒店參訪電動巴士
      b([0.24, 0.14, 0.18], [0.28, 0.14, 0.14], 0x5e9a6f);
      b([0.24, 0.19, 0.18], [0.24, 0.06, 0.144], 0xd5ecee);
      for (const wx of [0.15, 0.33]) cy([wx, 0.07, 0.25], 0.04, 0.03, C.ink, [Math.PI / 2, 0, 0]);
      // 前方左：西餐禮儀體驗小圓桌與師生陪伴
      cy([-0.2, 0.11, 0.22], 0.16, 0.03, 0xffffff);
      bulb([-0.2, 0.15, 0.22], 0.022, 0xf2b5c6);
      person(-0.34, 0.22, 0.36);
      person(-0.08, 0.22, 0.26);
      plant(0.32, -0.14, 0.38);
      return true;
    }
    case "overseasLuxuryCluster": {
      // 國外／海外實習與研修區（新加坡・日本・澳洲・美加）
      b([0, 0.03, 0], [0.98, 0.06, 0.78], 0xd5ecee);
      b([0, 0.068, -0.02], [0.88, 0.028, 0.66], 0xf5ede0);
      // 後方中央：新加坡城市意象三塔連體摩天大樓 ＋ 頂樓船型觀景台與拱廊（海外實習主要成長來源）
      for (const tx of [-0.22, 0, 0.22]) {
        b([tx, 0.46, -0.14], [0.16, 0.76, 0.22], 0xdbe7ee);
        hb([tx, 0.46, -0.026], [0.02, 0.74, 0.012], 0xd8a848);
        for (let r = 0; r < 6; r++) {
          glow([tx, 0.15 + r * 0.115, -0.026], [0.12, 0.06, 0.006], r === 5 ? 0xffe49e : 0x9fd3de);
          glow([tx, 0.15 + r * 0.115, -0.254], [0.12, 0.06, 0.006], 0x9fd3de);
        }
      }
      // 頂樓橫跨三塔的標誌性金色船型空中花園（SkyPark Boat Deck）與無邊際泳池
      b([0, 0.86, -0.14], [0.68, 0.045, 0.26], 0xf7f2e7);
      hb([0, 0.885, -0.14], [0.74, 0.022, 0.22], 0xd8a848);
      p("cone", [0.41, 0.875, -0.14], [0.16, 0.12, 0.18], 0xd8a848, [0, 0, -Math.PI / 2]); // 船首懸臂觀景台
      hb([-0.04, 0.902, -0.1], [0.46, 0.014, 0.12], 0x5fd0df); // 高空無邊際泳池
      for (let k = -2; k <= 2; k++) bulb([k * 0.09, 0.94, -0.02], 0.026, 0xffe49e);
      // 左前：日本實習意象日式溫泉旅館（檜木唐破風屋頂 ＋ 朱紅鳥居 ＋ 櫻花樹與露天風呂）
      b([-0.28, 0.2, 0.16], [0.28, 0.24, 0.2], 0xeadbc5);
      p("hip", [-0.28, 0.36, 0.16], [0.34, 0.09, 0.26], 0x3e352f);
      glow([-0.28, 0.2, 0.264], [0.2, 0.12, 0.006], 0xffe49e);
      // 日本朱紅鳥居（Torii Gate）
      for (const dx of [-0.07, 0.07]) cy([-0.06 + dx, 0.16, 0.26], 0.016, 0.18, 0xd64535);
      hb([-0.06, 0.25, 0.26], [0.2, 0.022, 0.024], 0xd64535);
      hb([-0.06, 0.21, 0.26], [0.16, 0.014, 0.016], 0xd64535);
      // 櫻花樹（Sakura）
      cy([-0.42, 0.14, 0.26], 0.018, 0.14, 0x6e4e37);
      sphere([-0.42, 0.24, 0.26], [0.09, 0.07, 0.09], 0xf4b8c8);
      // 右前：海島水上屋（Overwater Bungalow）與碧海珊瑚礁潟湖（裝飾造景）
      hb([0.24, 0.075, 0.18], [0.38, 0.018, 0.24], 0x4fc3d0);
      hb([0.12, 0.09, 0.18], [0.14, 0.012, 0.05], wood); // 水上木棧道
      cy([0.28, 0.17, 0.18], 0.18, 0.16, 0xf7efe0);
      p("cone6", [0.28, 0.29, 0.18], [0.24, 0.11, 0.24], 0xc89b54);
      glow([0.28, 0.16, 0.27], [0.1, 0.08, 0.006], 0xfff0c2);
      // 橫跨天際的全球海外實習金色航線環（Global Flight Arc）
      ring([0, 0.52, 0.06], 0.42, 0xd8a848, [0.35, 0.2, 0]);
      person(-0.06, 0.12, 0.34);
      person(0.12, 0.12, 0.34);
      return true;
    }
    case "mtFastTrackPlaza": {
      // 國際品牌儲備幹部（MT）直通與起薪躍升（月薪 4 萬元以上）：雙翼國際飯店總部高塔、金色凱旋拱門與三階晉升紅毯
      b([0, 0.03, 0], [0.98, 0.06, 0.78], 0xe8dfd1);
      b([0, 0.068, 0], [0.88, 0.024, 0.66], 0xf7f2e7);
      // 中央旗艦管理總部摩天塔
      b([0, 0.5, -0.12], [0.38, 0.84, 0.28], 0x27323d);
      hb([0, 0.94, -0.12], [0.42, 0.04, 0.32], 0xd8a848);
      p("dome", [0, 1.0, -0.12], [0.22, 0.09, 0.2], 0xd8a848);
      for (let r = 0; r < 6; r++) glow([0, 0.16 + r * 0.125, 0.024], [0.3, 0.065, 0.006], 0xffe49e);
      // 左右兩翼國際品牌大樓（萬豪／洲際／文華東方／嘉佩樂）
      for (const s of [-1, 1]) {
        b([s * 0.3, 0.38, -0.1], [0.22, 0.6, 0.24], 0xf5ebd6);
        p("hip", [s * 0.3, 0.72, -0.1], [0.26, 0.09, 0.28], s < 0 ? 0x3e7c8c : C.coral);
        for (let r = 0; r < 4; r++) glow([s * 0.3, 0.16 + r * 0.13, 0.024], [0.16, 0.065, 0.006], 0xfff0c2);
      }
      // 前方三階儲備幹部（MT）晉升紅毯金台與金色榮耀拱門
      for (let st = 0; st < 3; st++) {
        b([0, 0.09 + st * 0.035, 0.26 - st * 0.065], [0.36 - st * 0.05, 0.035, 0.08], st === 2 ? 0xd8a848 : 0xb83a3a);
      }
      ring([0, 0.28, 0.18], 0.16, 0xd8a848, [0, 0, 0]);
      for (let k = -2; k <= 2; k++) bulb([k * 0.065, 0.98, 0.04], 0.025, 0xffe49e);
      person(-0.08, 0.18, 0.32);
      person(0.08, 0.18, 0.32);
      return true;
    }
    case "alumniGradAcademy": {
      // 國內外研究所升學管道與系友兼任授課：歐風碩博士圓頂學苑、系友傳承塔與國際升學地球儀方尖碑
      b([0, 0.03, 0], [0.96, 0.06, 0.76], 0xe4ddd0);
      b([0, 0.068, 0], [0.86, 0.024, 0.64], 0xf6f1e6);
      // 左：國內外餐旅碩博士圓頂學術殿堂
      cy([-0.22, 0.32, -0.08], 0.34, 0.48, 0xf7f2e7);
      p("dome", [-0.22, 0.58, -0.08], [0.34, 0.18, 0.34], 0x3e7c8c);
      bulb([-0.22, 0.78, -0.08], 0.032, 0xffe49e);
      for (let r = 0; r < 3; r++) glow([-0.22, 0.18 + r * 0.13, 0.092], [0.22, 0.065, 0.006], 0xd5ecee);
      // 右：系友傳承大樓
      b([0.22, 0.44, -0.08], [0.3, 0.72, 0.28], 0xf3ead8);
      p("hip", [0.22, 0.84, -0.08], [0.34, 0.1, 0.32], 0xd8a848);
      for (let r = 0; r < 5; r++) glow([0.22, 0.16 + r * 0.125, 0.064], [0.22, 0.065, 0.006], 0xfff0c2);
      // 連結學界與業界系友的黃金傳承天橋
      b([0, 0.46, -0.08], [0.2, 0.06, 0.12], 0xd8a848);
      // 前方中央：國際名校升學地球儀與榮耀方尖碑
      b([0, 0.16, 0.22], [0.12, 0.16, 0.12], 0xd8a848);
      sphere([0, 0.3, 0.22], 0.085, 0x5ab8c8);
      ring([0, 0.3, 0.22], 0.115, 0xd8a848, [0.45, 0.3, 0]);
      person(-0.18, 0.16, 0.32);
      person(0.18, 0.16, 0.32);
      return true;
    }
  }
  return false;
}

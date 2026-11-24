/*
 * NKUHT · Hospitality 旅館島：20 島軸向六角群島即時雷達導覽圖（Hexagonal Archipelago Radar Minimap v2）
 *
 * 六角格網幾何與軸向座標投影（Pointy-Top Axial Hexagonal Grid Projection）演算法與架構參考：
 * - Amit Patel, Red Blob Games — "Hexagonal Grids" (https://www.redblobgames.com/grids/hexagons/)
 * - Abbey Hawk Sparrow / flauwekeul — honeycomb Hexagonal Grid Library (https://github.com/flauwekeul/honeycomb, MIT License)
 * - Lucide Icons — Vector UI Iconography (https://github.com/lucide-icons/lucide, ISC License)
 */

(() => {
  "use strict";

  const isEn = () =>
    document.documentElement.lang === "en" || new URLSearchParams(location.search).get("lang") === "en";
  const tr = (zh, en) => (isEn() ? en : zh);

  const CSS = `
  .hx-radar{position:fixed;left:30px;top:calc(var(--brand-bottom,122px) + 12px);z-index:21;width:246px;
    background:linear-gradient(165deg,rgba(11,22,19,.94),rgba(19,37,32,.94));
    border:1.5px solid rgba(208,172,102,.76);border-radius:16px;padding:10px 11px 9px;
    box-shadow:0 14px 36px rgba(6,12,10,.44);-webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px);
    color:#faf6ed;font:600 11.5px/1.35 "Noto Sans TC","Plus Jakarta Sans",sans-serif;
    display:none;user-select:none;-webkit-user-select:none;transition:left .22s ease,top .22s ease,opacity .18s ease,transform .18s ease}
  .hx-radar.open{display:block}
  @media (min-width:801px) and (max-width:1279px){
    .hx-radar{top:calc(var(--hud-bottom,var(--brand-bottom,168px)) + 10px)}
  }
  @media (min-width:1120px){
    body.card-open .hx-radar{left:382px}
  }
  @media (min-width:801px) and (max-width:1119px){
    body.card-open .hx-radar{left:auto;right:336px;top:auto;bottom:68px}
    body.card-open.sidebar-hidden .hx-radar{right:20px}
  }
  .hx-head{display:flex;align-items:center;justify-content:space-between;gap:6px;margin-bottom:6px;padding-bottom:5px;border-bottom:1px solid rgba(208,172,102,.26)}
  .hx-title{display:inline-flex;align-items:center;gap:5px;font-weight:800;font-size:12px;color:#f3dfa2;letter-spacing:.02em;min-width:0}
  .hx-prog{font:800 10px/1 "Plus Jakarta Sans",ui-monospace,sans-serif;padding:2px 6px;border-radius:999px;
    background:rgba(235,208,148,.18);border:1px solid rgba(235,208,148,.45);color:#ffeab3;white-space:nowrap}
  .hx-close{--close-fg:#ebd094;position:relative!important;width:32px!important;height:32px!important;min-width:32px!important;min-height:32px!important;max-width:32px!important;max-height:32px!important;padding:0!important;border-radius:50%!important;
    border:1.5px solid rgba(208,172,102,.58)!important;background:rgba(255,255,255,.08)!important;color:transparent!important;
    font-size:0!important;line-height:0!important;cursor:pointer;display:inline-flex!important;align-items:center!important;justify-content:center!important;flex:0 0 32px!important}
  .hx-close:hover{--close-fg:#0c1614;background:linear-gradient(135deg,#f2da9e,#c69b4b)!important;color:transparent!important;border-color:#fff!important}
  .hx-svg{display:block;width:100%;height:186px;border-radius:10px;background:radial-gradient(circle at 50% 50%,rgba(42,108,118,.36),rgba(9,20,22,.78));border:1px solid rgba(208,172,102,.24)}
  .hx-bridge{stroke:rgba(230,202,138,.36);stroke-width:.26;stroke-linecap:round}
  .hx-cell{cursor:pointer;transition:fill .16s ease,stroke .16s ease,stroke-width .16s ease}
  .hx-cell polygon{fill:rgba(34,74,66,.78);stroke:rgba(198,161,91,.55);stroke-width:.18}
  .hx-cell.visited polygon{fill:rgba(198,161,91,.3);stroke:#ebd094;stroke-width:.24}
  .hx-cell.quest polygon{stroke:#ff8b5e;stroke-width:.34;stroke-dasharray:.45 .25}
  .hx-cell.active polygon,.hx-cell:hover polygon{fill:rgba(235,208,148,.5);stroke:#fff8e6;stroke-width:.34}
  .hx-num{font:800 1.05px/1 "Plus Jakarta Sans",sans-serif;fill:#faf6ed;text-anchor:middle;dominant-baseline:central;pointer-events:none}
  .hx-sub-lbl{font:700 .82px/1 "Noto Sans TC","Plus Jakarta Sans",sans-serif;fill:#f5dfa0;text-anchor:middle;dominant-baseline:central;pointer-events:none;opacity:.92}
  .hx-fac{cursor:pointer}
  .hx-fac circle{fill:#5ce1e6;stroke:#0a1816;stroke-width:.16;transition:r .14s ease,fill .14s ease}
  .hx-fac:hover circle{fill:#fff3b0;r:.48}
  .hx-me{pointer-events:none}
  .hx-svg{touch-action:none;cursor:grab}
  .hx-extra{cursor:pointer}
  .hx-extra polygon{fill:rgba(120,150,170,.32);stroke:rgba(200,215,225,.55);stroke-width:.16}
  .hx-extra circle{fill:rgba(180,140,100,.38);stroke:rgba(230,205,170,.55);stroke-width:.12}
  .hx-extra:hover polygon,.hx-extra:hover circle{fill:rgba(235,208,148,.5)}
  .hx-view{fill:rgba(255,248,230,.08);stroke:#fff8e6;stroke-width:.2;stroke-dasharray:.6 .3;pointer-events:none}
  .hx-me-cone{fill:rgba(255,226,122,.34);stroke:rgba(255,238,168,.68);stroke-width:.12;stroke-linejoin:round}
  .hx-me-pulse{fill:rgba(245,211,58,.32);animation:hxPulse 1.6s ease-out infinite}
  .hx-me-dot{fill:#ffe27a;stroke:#0c1614;stroke-width:.22}
  @keyframes hxPulse{0%{r:.45;opacity:.9}100%{r:1.45;opacity:0}}
  .hx-foot{margin-top:6px;display:flex;align-items:center;justify-content:space-between;gap:6px;font-size:10.2px;color:#d6c6a5}
  .hx-legend{display:inline-flex;align-items:center;gap:6px;flex-wrap:nowrap;white-space:nowrap}
  .hx-legend i{display:inline-block;width:6.5px;height:6.5px;border-radius:50%;margin-right:2.5px;vertical-align:middle}
  .hx-hover{font-weight:700;color:#ffe7a8;max-width:108px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;text-align:right}
  #zoom-radar-btn[aria-pressed="true"]{background:linear-gradient(135deg,#17352b,#244f40)!important;color:#ffe59e!important;border-color:#ecc056!important;box-shadow:0 0 0 2px rgba(236,192,86,.32)}
  @media (max-width:800px){
    nav.toolbar #radar-btn{display:none!important}
    .hx-close{width:34px!important;height:34px!important;min-width:34px!important;min-height:34px!important;max-width:34px!important;max-height:34px!important;font-size:0!important}
    .hx-radar{left:50%;top:calc(var(--brand-bottom,58px) + 10px);transform:translateX(-50%);width:min(268px,calc(100vw - 24px));z-index:25;-webkit-backdrop-filter:none;backdrop-filter:none;background:linear-gradient(165deg,rgba(11,22,19,.97),rgba(19,37,32,.97))}
    body.hm-driving .hx-radar{top:calc(var(--brand-bottom,54px) + 74px)}
    body.card-open .hx-radar,
    body.log-open .hx-radar,
    body.m-time .hx-radar,
    body:has(.sidebar.mobile-open) .hx-radar,
    body:has(.hm-panel.open:not(.min)) .hx-radar,
    body:has(.is-plaza-drawer.open) .hx-radar{opacity:0;pointer-events:none}
  }
  `;

  function pointyHexVertices(cx, cz, r) {
    const pts = [];
    for (let i = 0; i < 6; i++) {
      const ang = (Math.PI / 180) * (60 * i - 30);
      const px = cx + r * Math.cos(ang);
      const pz = cz + r * Math.sin(ang);
      pts.push(`${px.toFixed(2)},${pz.toFixed(2)}`);
    }
    return pts.join(" ");
  }

  function waitReady() {
    return new Promise((resolve) => {
      if (window.__htl?.D && window.heartCity?.navData?.islandCenters) return resolve();
      const timer = setInterval(() => {
        if (window.__htl?.D && window.heartCity?.navData?.islandCenters) {
          clearInterval(timer);
          resolve();
        }
      }, 180);
    });
  }

  waitReady().then(() => {
    const style = document.createElement("style");
    style.textContent = CSS;
    document.head.appendChild(style);

    const D = window.__htl.D;
    const hc = window.heartCity;
    const centers = hc.navData.islandCenters || {};
    const bridges = hc.navData.bridges || [];
    const totalIslands = D.islands.length;

    // Compute bounding box in world XZ space
    let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
    for (const isl of D.islands) {
      const c = centers[isl.id];
      if (!c) continue;
      const rr = (c.r || 2.02) + 0.55;
      if (c.x - rr < minX) minX = c.x - rr;
      if (c.x + rr > maxX) maxX = c.x + rr;
      if (c.z - rr < minZ) minZ = c.z - rr;
      if (c.z + rr > maxZ) maxZ = c.z + rr;
    }
    // 港灣島與海上小島觀景台（非系所島，只畫外形）也算進雷達範圍
    const extras = Object.entries(centers).filter(([id]) => !D.islands.some((i) => i.id === id));
    for (const [, c] of extras) {
      const rr = (c.r || 1) + 0.4;
      minX = Math.min(minX, c.x - rr);
      maxX = Math.max(maxX, c.x + rr);
      minZ = Math.min(minZ, c.z - rr);
      maxZ = Math.max(maxZ, c.z + rr);
    }
    if (!Number.isFinite(minX)) return;
    const pad = 1.1;
    const vbX = minX - pad, vbY = minZ - pad;
    const vbW = maxX - minX + pad * 2, vbH = maxZ - minZ + pad * 2;

    const box = document.createElement("aside");
    box.id = "hex-radar";
    box.className = "hx-radar";
    box.setAttribute("aria-label", tr("20 島六角群島即時雷達導覽圖", "20-Island Hexagonal Archipelago Radar"));

    const bridgeLines = bridges
      .map((b) => {
        if (!b.ax && b.ax !== 0) return "";
        return `<line class="hx-bridge" x1="${b.ax.toFixed(2)}" y1="${b.az.toFixed(2)}" x2="${b.bx.toFixed(2)}" y2="${b.bz.toFixed(2)}"/>`;
      })
      .join("");

    const cellsSvg = D.islands
      .slice()
      .sort((a, b) => a.number - b.number)
      .map((isl) => {
        const c = centers[isl.id];
        if (!c) return "";
        const rr = (c.r || 2.02) * 0.94;
        const nm = isEn() ? isl.name?.en || isl.name?.zh : isl.name?.zh || isl.name?.en;
        const num = String(isl.number).padStart(2, "0");
        const isBig = isl.id === "sport";
        const yNum = isBig ? (c.z - 0.65).toFixed(2) : c.z.toFixed(2);
        const subText = isBig
          ? `<text class="hx-sub-lbl" x="${c.x.toFixed(2)}" y="${(c.z + 0.85).toFixed(2)}">${tr("24家合作旅館＋群賢", "24 Hotels + Elite House")}</text>`
          : "";
        return `<g class="hx-cell" data-hx-id="${isl.id}" data-hx-name="${num} ${nm}">
          <title>${num}｜${nm}</title>
          <polygon points="${pointyHexVertices(c.x, c.z, rr)}"/>
          <text class="hx-num" x="${c.x.toFixed(2)}" y="${yNum}">${num}</text>
          ${subText}
        </g>`;
      })
      .join("");

    const extrasSvg = extras
      .map(([id, c]) => {
        const nm = String(c.name || "").replace(/[<>&"]/g, "");
        const harbour = id.startsWith("kh-");
        return harbour
          ? `<g class="hx-extra harbour" data-hx-x="${c.x.toFixed(2)}" data-hx-z="${c.z.toFixed(2)}" data-hx-name="${nm}"><title>${nm}</title><polygon points="${pointyHexVertices(c.x, c.z, (c.r || 3) * 0.9)}"/></g>`
          : `<g class="hx-extra islet" data-hx-x="${c.x.toFixed(2)}" data-hx-z="${c.z.toFixed(2)}" data-hx-name="${nm}"><title>${nm}</title><circle cx="${c.x.toFixed(2)}" cy="${c.z.toFixed(2)}" r="${((c.r || 0.8) * 0.9).toFixed(2)}"/></g>`;
      })
      .join("");

    box.innerHTML = `
      <div class="hx-head">
        <span class="hx-title">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="12 2 21 7 21 17 12 22 3 17 3 7"/></svg>
          <span>${tr("六角群島雷達", "Hex Radar")}</span>
          <em class="hx-prog" style="font-style:normal">0/${totalIslands}</em>
        </span>
        <button type="button" class="hx-close" aria-label="${tr("關閉雷達圖", "Close Radar")}">×</button>
      </div>
      <svg class="hx-svg" viewBox="${vbX.toFixed(2)} ${vbY.toFixed(2)} ${vbW.toFixed(2)} ${vbH.toFixed(2)}" role="img">
        <g class="hx-bridges">${bridgeLines}</g>
        <g class="hx-extras">${extrasSvg}</g>
        <g class="hx-cells">${cellsSvg}</g>
        <g class="hx-facs"></g>
        <polygon class="hx-view" points=""/>
        <g class="hx-me" style="display:none">
          <polygon class="hx-me-cone" points="0,-1.45 -0.62,0.28 0.62,0.28"/>
          <circle class="hx-me-pulse" cx="0" cy="0" r="0.8"/>
          <circle class="hx-me-dot" cx="0" cy="0" r="0.46"/>
        </g>
      </svg>
      <div class="hx-foot">
        <span class="hx-legend">
          <span><i style="background:#ebd094"></i>${tr("已訪", "Visited")}</span>
          <span><i style="background:#ff8b5e"></i>${tr("任務", "Quest")}</span>
          <span><i style="background:#5ce1e6"></i>${tr("師長", "Faculty")}</span>
        </span>
        <span class="hx-hover">${tr("點島瞬移・拖曳移動視野", "Tap to jump · drag to move")}</span>
      </div>
    `;
    document.body.appendChild(box);

    const hoverLabel = box.querySelector(".hx-hover");
    const progEl = box.querySelector(".hx-prog");
    const facsGroup = box.querySelector(".hx-facs");
    const meGroup = box.querySelector(".hx-me");
    const meCone = box.querySelector(".hx-me-cone");
    const viewPoly = box.querySelector(".hx-view");
    const svgEl = box.querySelector(".hx-svg");
    const cellNodes = [...box.querySelectorAll(".hx-cell")];
    const facNodes = new Map();

    let isOpen = false;
    let rafId = 0;
    let lastFacSync = 0;

    function syncFacultyDots(now) {
      if (now - lastFacSync < 120 || !hc.getFacultyPositions) return;
      lastFacSync = now;
      const list = hc.getFacultyPositions() || [];
      const seen = new Set();
      for (const f of list) {
        const key = `${f.kind}:${f.id}`;
        seen.add(key);
        let g = facNodes.get(key);
        const label = isEn() ? f.name?.en || f.name?.zh : f.name?.zh || f.name?.en;
        if (!g) {
          g = document.createElementNS("http://www.w3.org/2000/svg", "g");
          g.setAttribute("class", "hx-fac");
          g.dataset.facId = f.id;
          g.dataset.walkerIdx = String(f.walkerIndex);
          g.dataset.hxName = `👨‍🏫 ${label}`;
          const title = document.createElementNS("http://www.w3.org/2000/svg", "title");
          title.textContent = label;
          const c = document.createElementNS("http://www.w3.org/2000/svg", "circle");
          c.setAttribute("r", "0.32");
          g.appendChild(title);
          g.appendChild(c);
          facsGroup.appendChild(g);
          facNodes.set(key, g);
        }
        const c = g.querySelector("circle");
        c.setAttribute("cx", f.x.toFixed(2));
        c.setAttribute("cy", f.z.toFixed(2));
      }
      for (const [k, g] of facNodes.entries()) {
        if (!seen.has(k)) {
          g.remove();
          facNodes.delete(k);
        }
      }
    }

    function syncRadarFrame(now = performance.now()) {
      if (!isOpen) return;
      const pState = window.__htlPassport?.state?.();
      const visited = new Set(pState?.islands || []);
      if (progEl) progEl.textContent = `${visited.size}/${totalIslands}`;
      const qTarget = window.__htlPassport?.getActiveChapterInfo?.()?.target;
      const av = window.heartIslandAvatar;
      const curSel = av?.S?.curIslandId || hc.getState?.()?.selectedIsland || null;

      for (const node of cellNodes) {
        const id = node.dataset.hxId;
        node.classList.toggle("visited", visited.has(id));
        node.classList.toggle("quest", qTarget?.type === "island" && qTarget.id === id);
        node.classList.toggle("active", curSel === id);
      }

      syncFacultyDots(now);

      // 目前鏡頭看到的地面範圍（走路模式不畫，避免與角色標記混淆）
      const quad = !av?.S?.drive && hc.mapCamera?.viewQuad?.();
      if (quad && viewPoly) viewPoly.setAttribute("points", quad.map((q) => `${q.x.toFixed(2)},${q.z.toFixed(2)}`).join(" "));
      else if (viewPoly) viewPoly.setAttribute("points", "");

      // Show avatar position + heading in Walk Mode, or camera target + azimuth in Orbit Mode
      const avGroup = av?.S?.drive ? av?.S?.fig?.group : null;
      const camState = hc.getCameraFocus?.();
      let mx = null, mz = null, deg = null;
      if (avGroup?.position) {
        mx = avGroup.position.x;
        mz = avGroup.position.z;
        // Avatar faces +Z when rotation.y === 0; SVG -Y is North (-Z), so convert yaw to SVG degrees
        const yaw = avGroup.rotation?.y || 0;
        deg = (Math.atan2(Math.sin(yaw), Math.cos(yaw)) * 180) / Math.PI + 180;
      } else if (camState) {
        mx = camState.x;
        mz = camState.z;
        deg = (Math.atan2(camState.dx, -camState.dz) * 180) / Math.PI;
      }

      if (mx !== null && mz !== null) {
        meGroup.style.display = "";
        meGroup.setAttribute("transform", `translate(${mx.toFixed(2)},${mz.toFixed(2)})`);
        if (deg !== null && Number.isFinite(deg)) {
          meCone.style.display = "";
          meCone.setAttribute("transform", `rotate(${deg.toFixed(1)})`);
        } else {
          meCone.style.display = "none";
        }
      }
      rafId = requestAnimationFrame(syncRadarFrame);
    }

    function syncPressed() {
      const s = String(isOpen);
      if (tbBtn) tbBtn.setAttribute("aria-pressed", s);
      if (zoomBtn) zoomBtn.setAttribute("aria-pressed", s);
      if (hudPill) hudPill.setAttribute("aria-pressed", s);
    }

    function toggleRadar(force) {
      isOpen = typeof force === "boolean" ? force : !isOpen;
      box.classList.toggle("open", isOpen);
      syncPressed();
      cancelAnimationFrame(rafId);
      if (isOpen) syncRadarFrame();
    }

    box.querySelector(".hx-close").addEventListener("click", () => toggleRadar(false));
    document.addEventListener("click", function closeRadarOnPlaza(e) { if (isOpen && e.target.closest("#mob-plaza-btn,#htl-plaza-open")) toggleRadar(false); }, true);
    box.addEventListener("pointerover", (e) => {
      const hit = e.target.closest("[data-hx-name]");
      if (hit) hoverLabel.textContent = hit.dataset.hxName;
    });
    // 在雷達上拖曳：鏡頭跟著移到該點（走路模式除外）；點港灣島或小島：鏡頭移過去
    const toWorld = (e) => {
      const pt = svgEl.createSVGPoint();
      pt.x = e.clientX;
      pt.y = e.clientY;
      const m = svgEl.getScreenCTM();
      if (!m) return null;
      const w = pt.matrixTransform(m.inverse());
      return { x: w.x, z: w.y };
    };
    let dragging = null;
    svgEl.addEventListener("pointerdown", (e) => {
      if (window.heartIslandAvatar?.S?.drive || !hc.mapCamera) return;
      dragging = { id: e.pointerId, x: e.clientX, y: e.clientY, moved: false };
    });
    svgEl.addEventListener("pointermove", (e) => {
      if (!dragging || dragging.id !== e.pointerId) return;
      if (!dragging.moved && Math.hypot(e.clientX - dragging.x, e.clientY - dragging.y) < 5) return;
      if (!dragging.moved) svgEl.setPointerCapture?.(e.pointerId);
      dragging.moved = true;
      const w = toWorld(e);
      if (w) hc.mapCamera.panTo(w.x, w.z);
    });
    const endDrag = (e) => {
      if (dragging?.moved) {
        dragging.suppressClick = true;
        setTimeout(() => (dragging = null), 0);
      } else dragging = null;
    };
    svgEl.addEventListener("pointerup", endDrag);
    svgEl.addEventListener("pointercancel", endDrag);
    box.addEventListener("click", (e) => {
      if (dragging?.suppressClick) return;
      const ex = e.target.closest(".hx-extra");
      if (ex && hc.mapCamera && !window.heartIslandAvatar?.S?.drive) {
        hc.mapCamera.panTo(Number(ex.dataset.hxX), Number(ex.dataset.hxZ));
        return;
      }
      const fac = e.target.closest(".hx-fac");
      if (fac) {
        const fid = fac.dataset.facId;
        if (fid && fid !== "lord" && window.__htl?.selectTeacher) {
          window.__htl.selectTeacher(fid);
        } else if (fac.dataset.walkerIdx) {
          hc.selectWalker?.(Number(fac.dataset.walkerIdx));
        }
        if (innerWidth <= 800) toggleRadar(false);
        return;
      }
      const g = e.target.closest(".hx-cell");
      if (!g) return;
      const id = g.dataset.hxId;
      const av = window.heartIslandAvatar;
      if (av?.S?.drive && av?.api?.teleportToIsland) {
        av.api.teleportToIsland(id);
      } else {
        window.__htl?.selectIsland?.(id);
      }
      if (innerWidth <= 800) toggleRadar(false);
    });

    // 1) Mount toggle button in desktop toolbar (hidden on <=800px so mobile 7-tab dock stays crisp)
    let tbBtn = null;
    const toolbar = document.querySelector("nav.toolbar");
    if (toolbar && !document.getElementById("radar-btn")) {
      tbBtn = document.createElement("button");
      tbBtn.id = "radar-btn";
      tbBtn.type = "button";
      tbBtn.setAttribute("aria-pressed", "false");
      tbBtn.title = tr("開啟 20 島軸向六角群島雷達圖 (M)", "Toggle 20-Island Hexagonal Archipelago Radar (M)");
      tbBtn.innerHTML = `<i class="tb-ic" aria-hidden="true">🗺️</i><span class="tb-lbl">${tr("雷達", "Radar")}</span>`;
      tbBtn.addEventListener("click", () => toggleRadar());
      const ref = toolbar.querySelector("#sidebar-toggle") || toolbar.firstChild;
      toolbar.insertBefore(tbBtn, ref);
    }

    // 2) 縮放列不再放第二顆雷達鈕（選單整併 2026-11-14）：雷達可由工具列「更多」、手機「⋯ 更多」、M 鍵與漫遊列開啟
    const zoomBtn = null;

    // 3) Mount pill in RPG Walk Mode top capsule
    let hudPill = null;
    const tryMountHudPill = () => {
      const hudTop = document.querySelector(".hm-hud-top");
      if (!hudTop || hudPill) return;
      hudPill = document.createElement("button");
      hudPill.type = "button";
      hudPill.className = "hm-top-pill";
      hudPill.setAttribute("aria-pressed", String(isOpen));
      hudPill.title = tr("展開／收合 20 島六角雷達小地圖 (M)", "Toggle Hex Radar Minimap (M)");
      hudPill.textContent = tr("🗺️ 雷達", "🗺️ Radar");
      hudPill.addEventListener("click", () => toggleRadar());
      const exitBtn = hudTop.querySelector(".hm-top-pill.exit");
      if (exitBtn) hudTop.insertBefore(hudPill, exitBtn);
      else hudTop.appendChild(hudPill);
    };
    tryMountHudPill();
    setTimeout(tryMountHudPill, 900);

    window.addEventListener("keydown", (e) => {
      if (e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === "m" || e.key === "M") toggleRadar();
    });

    window.htlHexRadar = { toggle: toggleRadar, isOpen: () => isOpen };
  });
})();

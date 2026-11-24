// text-polish.js — keeps CJK titles from breaking in the middle of a name (2026-11-13).
// Titles such as 「《有鳳來儀》中軸活水噴泉與鳳凰展翼雕塑」 used to break inside a word (「中軸活／水噴泉」) or leave a
// two-character last line. Inside headings and list names, a 《…》 title, a short （…） note and a 「…」 quote are wrapped
// in <span class="tp-nw"> (white-space: nowrap, layout.css), so the line breaks between phrases instead.
const SCOPE = "#card-content, #tree, #log, .tbx-menu, .qp-overlay";
const TARGETS = "h1, h2, h3, h4, .nm, .lmt-title, .ft-title, .row b";
const PHRASE = /(《[^《》]{1,14}》|（[^（）]{1,10}）|「[^「」]{1,10}」)/g;

function polish(root) {
  for (const el of root.querySelectorAll(TARGETS)) {
    if (el.dataset.tp === "1") continue;
    el.dataset.tp = "1";
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    const nodes = [];
    for (let n = walker.nextNode(); n; n = walker.nextNode()) if (PHRASE.test(n.nodeValue) && !n.parentElement.closest(".tp-nw")) nodes.push(n);
    for (const n of nodes) {
      PHRASE.lastIndex = 0;
      const frag = document.createDocumentFragment();
      let last = 0;
      for (const m of n.nodeValue.matchAll(PHRASE)) {
        if (m.index > last) frag.append(n.nodeValue.slice(last, m.index));
        const s = document.createElement("span");
        s.className = "tp-nw";
        s.textContent = m[0];
        frag.append(s);
        last = m.index + m[0].length;
      }
      if (last < n.nodeValue.length) frag.append(n.nodeValue.slice(last));
      n.replaceWith(frag);
    }
    PHRASE.lastIndex = 0;
  }
}

let queued = false;
const run = () => {
  if (queued) return;
  queued = true;
  requestAnimationFrame(() => {
    queued = false;
    for (const root of document.querySelectorAll(SCOPE)) polish(root);
  });
};
new MutationObserver(run).observe(document.body, { childList: true, subtree: true });
run();

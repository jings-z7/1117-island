// 第五期 旅伴廣場多人互動（2026-11-15）：鐘聲迎賓挑戰、雙人問答對戰、組隊導覽、檢舉。
// - 只在伺服器的 caps 封包宣告支援時出現；舊伺服器上一切照舊。
// - 網路上只傳代碼與數字（seed、分數、毫秒、固定理由代碼）；題目在各自的瀏覽器由 quiz-gen.js 以同一個 seed 產生，
//   所以雙方題目相同、內容全部出自官網資料。名稱由伺服器從連線綁定的外觀取出，前端一律用 textContent 顯示。
// - 分數存在瀏覽器、可被竄改：排行只是同房的趣味排名，不是正式評分。
import { OFFICIAL } from "./official-data.js?v=20261115-01";
import { drawRound } from "./quiz-gen.js?v=20261115-01";
import { campusTime } from "./clock-tower.js?v=20261115-02";

const Q_LEN = 5;
const BELL_OPEN_MS = 5 * 60 * 1000;
const DUEL_DAILY_XP_MAX = 3;
const REASONS = [
  ["spam", "洗版", "Spam"],
  ["abuse", "辱罵騷擾", "Abuse"],
  ["impersonation", "冒充他人", "Impersonation"],
  ["other", "其他不當行為", "Other"],
];
// fixed-choice notices: only the code travels; words are looked up here by every viewer
export const NOTICES = [
  ["party", "找人組隊導覽", "Looking for a tour party"],
  ["duel", "來問答對戰", "Up for a quiz duel"],
  ["photo", "集合合照", "Group photo time"],
  ["bell", "鐘聲挑戰集合", "Meet for the bell challenge"],
  ["plaza", "來交誼島聊天", "Come chat on the plaza island"],
  ["help", "需要導覽協助", "Could use a guide"],
];
const hashSeed = (str) => {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619);
  return (h >>> 0) & 0x7fffffff;
};

export function installPlazaGames(api) {
  const { sendServer, peers, tr, h, notice, noticeRow, startFollow, refresh, uiIcon, english } = api;
  const caps = new Set();
  const state = { party: null, leader: null, members: [], duel: null, bell: null, quiz: null };
  const nameOf = (id, fallback) => peers().get(id)?.look?.name || fallback || tr("夥伴", "a visitor");

  // ---- quiz dialog (shared by the bell challenge and duels) ----
  let dlg = null;
  function closeQuiz() {
    if (dlg) dlg.remove();
    dlg = null;
    state.quiz = null;
  }
  // questions: same seed → same questions and option order on every device
  function openQuiz({ title, sub, seed, onDone }) {
    closeQuiz();
    let qs = [];
    try {
      qs = drawRound(OFFICIAL, Q_LEN, { seed, english });
    } catch (e) {
      console.warn("plaza quiz", e);
    }
    if (!qs.length) return;
    const t0 = performance.now();
    state.quiz = { qs, i: 0, score: 0, picked: null, onDone, t0 };
    dlg = h("div", { class: "pg-quiz", role: "dialog", "aria-modal": "true", "aria-label": title });
    document.body.append(dlg);
    render();
    function render() {
      const z = state.quiz;
      if (!z || !dlg) return;
      const q = z.qs[z.i];
      const head = h("div", { class: "pg-head" }, h("div", {}, h("b", {}, title), h("small", {}, sub)), h("button", { type: "button", class: "pg-close ui-icon-btn", "aria-label": tr("關閉", "Close"), onclick: closeQuiz }, uiIcon("close")));
      const prog = h("div", { class: "pg-prog" }, tr(`第 ${z.i + 1} / ${z.qs.length} 題・答對 ${z.score}`, `Question ${z.i + 1} / ${z.qs.length} · correct ${z.score}`));
      const opts = h(
        "div",
        { class: "pg-opts" },
        ...q.opts.map((o, k) =>
          h(
            "button",
            {
              type: "button",
              class: "pg-opt" + (z.picked == null ? "" : k === q.ans ? " ok" : k === z.picked ? " bad" : ""),
              disabled: z.picked != null ? "" : null,
              onclick: () => {
                if (z.picked != null) return;
                z.picked = k;
                if (k === q.ans) z.score++;
                render();
                setTimeout(() => {
                  if (state.quiz !== z) return;
                  z.picked = null;
                  if (++z.i >= z.qs.length) {
                    const ms = Math.round(performance.now() - z.t0);
                    const done = z.onDone;
                    renderDone(z.score, ms);
                    done?.(z.score, ms);
                  } else render();
                }, 900);
              },
            },
            h("b", {}, String.fromCharCode(65 + k) + "."),
            " " + o,
          ),
        ),
      );
      dlg.replaceChildren(h("div", { class: "pg-box" }, head, prog, h("p", { class: "pg-q" }, q.q), opts, h("small", { class: "pg-cat" }, q.cat)));
    }
    function renderDone(score, ms) {
      if (!dlg) return;
      const box = dlg.querySelector(".pg-box");
      box.replaceChildren(
        h("div", { class: "pg-head" }, h("div", {}, h("b", {}, title), h("small", {}, sub)), h("button", { type: "button", class: "pg-close ui-icon-btn", "aria-label": tr("關閉", "Close"), onclick: closeQuiz }, uiIcon("close"))),
        h("p", { class: "pg-score" }, tr(`答對 ${score} / ${Q_LEN} 題・${(ms / 1000).toFixed(1)} 秒`, `${score} / ${Q_LEN} correct · ${(ms / 1000).toFixed(1)} s`)),
        h("div", { class: "pg-result" }),
      );
    }
  }
  const resultSlot = () => dlg?.querySelector(".pg-result");

  // ---- 鐘聲迎賓挑戰 ----
  const chip = h("button", { type: "button", class: "pg-bell-chip", hidden: "" });
  document.body.append(chip);
  let chipTimer = 0;
  function bellEvFor(kind) {
    // campus date + time of the bell (the event fires on the bell minute itself)
    const d = new Date(Date.now() + 8 * 3600 * 1000);
    const p = (n) => String(n).padStart(2, "0");
    const t = campusTime();
    return `${d.getUTCFullYear()}${p(d.getUTCMonth() + 1)}${p(d.getUTCDate())}${p(t.h)}${p(t.m)}${kind === "start" ? "s" : "e"}`;
  }
  addEventListener("htl:clocktower", (e) => {
    const d = e.detail || {};
    if (!caps.has("bell") || (d.kind !== "start" && d.kind !== "end")) return;
    state.bell = { ev: bellEvFor(d.kind), period: d.period, kind: d.kind, until: Date.now() + BELL_OPEN_MS, done: false, board: null };
    clearInterval(chipTimer);
    chip.hidden = false;
    const tick = () => {
      const left = state.bell ? state.bell.until - Date.now() : 0;
      if (left <= 0 || state.bell?.done) {
        chip.hidden = true;
        clearInterval(chipTimer);
        return;
      }
      chip.textContent = tr(`🔔 第 ${state.bell.period} 節迎賓挑戰・${Math.floor(left / 60000)}:${String(Math.floor((left % 60000) / 1000)).padStart(2, "0")}`, `🔔 Bell challenge · ${Math.floor(left / 60000)}:${String(Math.floor((left % 60000) / 1000)).padStart(2, "0")}`);
    };
    tick();
    chipTimer = setInterval(tick, 1000);
    notice(tr(`🔔 第 ${d.period} 節${d.kind === "start" ? "上課" : "下課"}鐘響：5 分鐘內參加「迎賓挑戰」，同房一起答 ${Q_LEN} 題！`, `🔔 Bell: join the ${Q_LEN}-question room challenge within 5 minutes!`));
  });
  chip.onclick = () => {
    const b = state.bell;
    if (!b || b.done || Date.now() > b.until) return;
    openQuiz({
      title: tr("鐘聲迎賓挑戰", "Bell challenge"),
      sub: tr(`第 ${b.period} 節・同房題目相同`, `Period ${b.period} · same questions for the whole room`),
      seed: hashSeed(b.ev),
      onDone: (s, ms) => {
        b.done = true;
        chip.hidden = true;
        sendServer({ t: "bell", ev: b.ev, s, ms });
        renderBoard();
      },
    });
  };
  function renderBoard() {
    const slot = resultSlot();
    const b = state.bell;
    if (!slot || !b) return;
    if (!b.board) return slot.replaceChildren(h("small", {}, tr("排名統計中…", "Ranking…")));
    slot.replaceChildren(
      h("b", {}, tr(`同房排名（${b.board.n} 人參加）`, `Room ranking (${b.board.n} players)`)),
      h("ol", { class: "pg-board" }, ...b.board.top.map((e) => h("li", { class: e.id === api.myId() ? "me" : "" }, h("span", {}, e.name), h("small", {}, `${e.s}/${Q_LEN}・${(e.ms / 1000).toFixed(1)}s`)))),
    );
  }

  // ---- 雙人問答對戰 ----
  function duelInvite(p) {
    if (state.duel && !state.duel.done) return notice(tr("目前已有一場對戰進行中。", "A duel is already in progress."));
    const seed = (Math.random() * 2 ** 31) | 0;
    state.duel = { with: p.id, name: p.look?.name, seed, me: null, them: null, started: false, done: false };
    sendServer({ t: "duel", op: "invite", to: p.id, seed });
    notice(tr(`⚔️ 已邀請 ${p.look?.name || "夥伴"} 進行問答對戰，等待回覆…`, `⚔️ Duel invitation sent to ${p.look?.name || "them"}…`));
  }
  function startDuel() {
    const d = state.duel;
    if (!d || d.started) return;
    d.started = true;
    openQuiz({
      title: tr("雙人問答對戰", "Quiz duel"),
      sub: tr(`對手：${d.name || nameOf(d.with)}`, `Opponent: ${d.name || nameOf(d.with)}`),
      seed: d.seed,
      onDone: (s, ms) => {
        d.me = { s, ms };
        sendServer({ t: "duel", op: "result", to: d.with, s, ms });
        settleDuel();
      },
    });
  }
  function settleDuel() {
    const d = state.duel,
      slot = resultSlot();
    if (!d || !d.me) return;
    if (!d.them) return slot?.replaceChildren(h("small", {}, tr("等待對手交卷…", "Waiting for your opponent…")));
    if (d.done) return;
    d.done = true;
    const win = d.me.s > d.them.s || (d.me.s === d.them.s && d.me.ms < d.them.ms);
    const tie = d.me.s === d.them.s && d.me.ms === d.them.ms;
    const line = tie ? tr("平手！", "A tie!") : win ? tr("你贏了！", "You win!") : tr("對手獲勝，再接再厲！", "Your opponent wins — try again!");
    slot?.replaceChildren(h("b", {}, line), h("small", {}, tr(`你 ${d.me.s} 題 ${(d.me.ms / 1000).toFixed(1)}s ・ 對手 ${d.them.s} 題 ${(d.them.ms / 1000).toFixed(1)}s`, `You ${d.me.s} in ${(d.me.ms / 1000).toFixed(1)}s · them ${d.them.s} in ${(d.them.ms / 1000).toFixed(1)}s`)));
    notice(tr(`⚔️ 對戰結果：${line}`, `⚔️ Duel: ${line}`));
    if (win && !tie) {
      const day = new Date().toISOString().slice(0, 10);
      let n = 0;
      try {
        const o = JSON.parse(localStorage.getItem("htl-duel-xp") || "{}");
        n = o.day === day ? o.n : 0;
        if (n < DUEL_DAILY_XP_MAX) {
          localStorage.setItem("htl-duel-xp", JSON.stringify({ day, n: n + 1 }));
          window.__htlPassport?.grantXp?.(`duel:${day}:${n + 1}`, 20, tr("問答對戰獲勝", "Quiz duel won"));
        }
      } catch {}
    }
  }

  // ---- 組隊導覽 ----
  const inParty = () => !!state.party;
  const isMate = (id) => state.members.includes(id) && id !== api.myId();
  function paintMates() {
    for (const p of peers().values()) p.tagEl?.classList.toggle("is-mate", isMate(p.id));
  }

  // ---- incoming packets ----
  function handle(msg) {
    switch (msg.t) {
      case "caps":
        caps.clear();
        for (const c of Array.isArray(msg.caps) ? msg.caps : []) if (typeof c === "string") caps.add(c);
        refresh();
        return true;
      case "board":
        if (state.bell && msg.ev === state.bell.ev && Array.isArray(msg.top)) {
          state.bell.board = { n: Number(msg.n) || msg.top.length, top: msg.top.slice(0, 10).map((e) => ({ id: String(e.id || ""), name: String(e.name || ""), s: Number(e.s) || 0, ms: Number(e.ms) || 0 })) };
          renderBoard();
          // top three of the room earn a one-time reward for this bell
          const rank = state.bell.board.top.findIndex((e) => e.id === api.myId());
          if (state.bell.done && rank >= 0 && rank < 3) window.__htlPassport?.grantXp?.(`bell:${state.bell.ev}`, 15, tr(`迎賓挑戰第 ${rank + 1} 名`, `Bell challenge #${rank + 1}`));
        }
        return true;
      case "bell_ack":
        if (msg.ok === false && msg.reason === "closed") notice(tr("這次迎賓挑戰已截止。", "This bell challenge has closed."));
        return true;
      case "duel": {
        const from = String(msg.id || ""),
          who = String(msg.name || nameOf(from));
        if (msg.op === "invite" && Number.isInteger(msg.seed)) {
          if (state.duel && !state.duel.done && state.duel.with !== from) return true; // busy: ignore quietly
          noticeRow(tr(`⚔️ ${who} 邀請你進行問答對戰（${Q_LEN} 題，比答對數與速度）`, `⚔️ ${who} invites you to a ${Q_LEN}-question duel`), [
            [
              tr("接受", "Accept"),
              () => {
                state.duel = { with: from, name: who, seed: msg.seed, me: null, them: null, started: false, done: false };
                sendServer({ t: "duel", op: "accept", to: from, seed: msg.seed });
                startDuel();
              },
            ],
            [tr("婉拒", "Decline"), () => sendServer({ t: "duel", op: "decline", to: from })],
          ]);
        } else if (msg.op === "accept" && state.duel?.with === from && msg.seed === state.duel.seed) startDuel();
        else if (msg.op === "decline" && state.duel?.with === from && !state.duel.started) {
          state.duel = null;
          notice(tr(`${who} 婉拒了對戰。`, `${who} declined the duel.`));
        } else if (msg.op === "result" && state.duel?.with === from && Number.isInteger(msg.s) && Number.isInteger(msg.ms)) {
          state.duel.them = { s: msg.s, ms: msg.ms };
          settleDuel();
        }
        return true;
      }
      case "duel_ack":
        if (msg.ok === false) {
          notice(msg.reason === "offline" ? tr("對方目前不在線上。", "They are not online.") : tr("邀請太頻繁，請稍後再試。", "Too many invitations — try again shortly."));
          if (state.duel && !state.duel.started) state.duel = null;
        }
        return true;
      case "party": {
        const from = String(msg.id || ""),
          who = String(msg.name || nameOf(from));
        if (msg.op === "invite")
          noticeRow(tr(`🧭 ${who} 邀請你組隊導覽（最多 4 人）`, `🧭 ${who} invites you to a tour party (up to 4)`), [
            [tr("加入", "Join"), () => sendServer({ t: "party", op: "accept", to: from })],
            [tr("略過", "Skip"), () => {}],
          ]);
        return true;
      }
      case "party_state": {
        const was = state.party;
        state.party = typeof msg.party === "string" ? msg.party : null;
        state.leader = typeof msg.leader === "string" ? msg.leader : null;
        state.members = Array.isArray(msg.members) ? msg.members.filter((x) => typeof x === "string").slice(0, 4) : [];
        if (state.party && !was) notice(tr(`🧭 已加入隊伍（${state.members.length} 人），隊長：${state.leader === api.myId() ? "你" : nameOf(state.leader)}`, `🧭 Joined a party of ${state.members.length}`));
        else if (!state.party && was) notice(tr("🧭 已離開隊伍。", "🧭 You left the party."));
        paintMates();
        refresh();
        return true;
      }
      case "party_ack":
        if (msg.ok === false) notice({ full: tr("隊伍已滿 4 人。", "The party is full."), busy: tr("對方已在其他隊伍。", "They are already in a party."), offline: tr("對方目前不在線上。", "They are not online."), notleader: tr("只有隊長可以邀請或請人離隊。", "Only the leader can do that."), expired: tr("邀請已過期。", "The invitation has expired.") }[msg.reason] || tr("無法完成組隊操作。", "That party action did not work."));
        else if (msg.op === "invite") notice(tr("🧭 已送出組隊邀請。", "🧭 Party invitation sent."));
        return true;
      case "notice": {
        const row = NOTICES.find(([c]) => c === msg.code);
        if (!row) return true;
        const who = String(msg.name || nameOf(String(msg.id || "")));
        notice(tr(`📣 ${who} 發布公告：${row[1]}`, `📣 ${who}: ${row[2]}`));
        dispatchEvent(new CustomEvent("htl:plaza-notice", { detail: { name: who, code: row[0] } }));
        return true;
      }
      case "notice_ack":
        if (msg.ok === false) notice(tr("公告每分鐘只能發一則，請稍後再試。", "One notice a minute — please try again shortly."));
        return true;
      case "report_ack":
        if (msg.ok) notice(tr("已收到檢舉，謝謝你協助維護廣場。多位玩家檢舉後，系統會自動暫停對方發言 30 分鐘。", "Report received — thank you. After several reports the player is muted for 30 minutes."));
        return true;
    }
    return false;
  }

  // a peer's island changed: party members hear where the leader went
  function observeState(p, prevIsl) {
    if (!state.party || p.id !== state.leader || p.id === api.myId() || !p.isl || p.isl === prevIsl) return;
    noticeRow(tr(`🧭 隊長 ${p.look?.name || ""} 抵達「${p.isl}」`, `🧭 Your leader reached "${p.isl}"`), [[tr("跟隨隊長", "Follow"), () => startFollow(p)]]);
  }

  function report(p) {
    noticeRow(
      tr(`檢舉 ${p.look?.name || "這位玩家"}：請選擇理由`, `Report ${p.look?.name || "this player"}: choose a reason`),
      REASONS.map(([code, zh, en]) => [tr(zh, en), () => sendServer({ t: "report", to: p.id, reason: code })]).concat([[tr("取消", "Cancel"), () => {}]]),
    );
  }

  // roster buttons for a peer row (only what the server supports)
  function peerActs(p, pname, rosterBtn) {
    if (p.off) return [];
    const out = [];
    if (caps.has("duel")) out.push(rosterBtn("duel", "sparkle", `與 ${pname} 對戰`, `Duel ${pname}`, () => duelInvite(p), { iconOnly: true, title: tr("邀請對方進行 5 題問答對戰", "Invite them to a 5-question duel") }));
    if (caps.has("party")) {
      if (isMate(p.id)) {
        if (state.leader === api.myId()) out.push(rosterBtn("party", "logout", `請 ${pname} 離隊`, `Remove ${pname}`, () => sendServer({ t: "party", op: "kick", to: p.id }), { on: true, iconOnly: true, title: tr("請對方離開隊伍", "Remove them from the party") }));
      } else if (!state.party || state.leader === api.myId()) out.push(rosterBtn("party", "people", `邀請 ${pname} 組隊`, `Invite ${pname}`, () => sendServer({ t: "party", op: "invite", to: p.id }), { iconOnly: true, title: tr("邀請對方組隊導覽（最多 4 人）", "Invite them to a tour party (up to 4)") }));
    }
    if (caps.has("report")) out.push(rosterBtn("report", "ban", `檢舉 ${pname}`, `Report ${pname}`, () => report(p), { iconOnly: true, title: tr("檢舉不當行為（固定理由）", "Report misconduct (fixed reasons)") }));
    return out;
  }
  // 發公告: six fixed choices (no free text); the board on the plaza island and every chat log show it
  function openNoticeMenu() {
    if (!caps.has("notice")) return;
    noticeRow(
      tr("發公告：請選一則（每分鐘限一則）", "Post a notice (one a minute):"),
      NOTICES.map(([code, zh, en]) => [
        tr(zh, en),
        () => {
          sendServer({ t: "notice", code });
          // the server broadcasts to others; show our own on this device straight away
          dispatchEvent(new CustomEvent("htl:plaza-notice", { detail: { name: tr("我", "Me"), code } }));
        },
      ]).concat([[tr("取消", "Cancel"), () => {}]]),
    );
    api.openChat?.();
  }
  function meActs(rosterBtn) {
    const out = [];
    if (caps.has("notice")) out.push(rosterBtn("notice", "bell", "發公告", "Post a notice", openNoticeMenu, { title: tr("發一則固定選項的公告", "Post a fixed-choice notice") }));
    if (caps.has("party") && state.party) out.push(rosterBtn("party", "logout", "離開隊伍", "Leave party", () => sendServer({ t: "party", op: "leave" }), { on: true, title: tr("離開目前的隊伍", "Leave the current party") }));
    return out;
  }

  return { handle, observeState, peerActs, meActs, isMate, paintMates, caps, state, openNoticeMenu };
}

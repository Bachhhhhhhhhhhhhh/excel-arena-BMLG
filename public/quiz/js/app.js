/**
 * Excel Function Grid Quiz — main app
 * Client-side only · GitHub Pages ready
 */
(() => {
  "use strict";

  // ---------- State ----------
  const state = {
    sessionId: null,
    deckName: "Demo Excel 100",
    mode: "practice", // practice | battle
    playerName: "Player 1",
    questions: [], // length 100
    cells: [], // { answered, correct, usedHint, timeSec, choice }
    score: 0,
    answeredCount: 0,
    correctCount: 0,
    activeIndex: null,
    questionStartedAt: 0,
    usedHintThis: false,
    selectedOption: null,
    battlePlayers: [], // multi local battle
    battleTurn: 0,
  };

  // ---------- DOM ----------
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  const el = {
    board: $("#board"),
    score: $("#stat-score"),
    progress: $("#stat-progress"),
    correct: $("#stat-correct"),
    timer: $("#modal-timer"),
    progressBar: $("#progress-bar"),
    modal: $("#modal-backdrop"),
    modalTitle: $("#modal-title"),
    modalBadges: $("#modal-badges"),
    modalQ: $("#modal-question"),
    modalOpts: $("#modal-options"),
    modalFormula: $("#modal-formula"),
    hintBox: $("#hint-box"),
    explainBox: $("#explain-box"),
    btnHint: $("#btn-hint"),
    btnSubmit: $("#btn-submit"),
    btnClose: $("#btn-close-modal"),
    toast: $("#toast"),
    webCount: $("#web-count"),
    deckList: $("#deck-list"),
    lbList: $("#lb-list"),
    playerName: $("#player-name"),
    modePractice: $("#mode-practice"),
    modeBattle: $("#mode-battle"),
    fileInput: $("#file-input"),
    dropzone: $("#dropzone"),
    sourcePanel: $("#source-modal"),
  };

  // ---------- Utils ----------
  function toast(msg) {
    el.toast.textContent = msg;
    el.toast.classList.add("show");
    setTimeout(() => el.toast.classList.remove("show"), 2400);
  }

  function fmtTime(sec) {
    const s = Math.max(0, Math.floor(sec));
    const m = Math.floor(s / 60);
    const r = s % 60;
    return `${m}:${String(r).padStart(2, "0")}`;
  }

  function diffLabel(d) {
    return d === "easy" ? "Dễ" : d === "hard" ? "Khó" : "Trung bình";
  }

  function extractFnName(q) {
    const m = String(q.q).match(
      /\b(SUMIFS?|COUNTIFS?|AVERAGEIFS?|XLOOKUP|VLOOKUP|HLOOKUP|INDEX|MATCH|XMATCH|IFERROR|IFNA|IFS|IF|TEXTJOIN|TEXTSPLIT|TEXTBEFORE|TEXTAFTER|UNIQUE|FILTER|SORTBY|SORT|SEQUENCE|LAMBDA|BYROW|BYCOL|MAP|SCAN|REDUCE|SUMPRODUCT|AGGREGATE|SUBTOTAL|OFFSET|INDIRECT|NETWORKDAYS|WORKDAY|EOMONTH|DATEDIF|FORECAST\.LINEAR|PERCENTILE\.INC|RANK\.EQ|PMT|IRR|XIRR|XNPV|NPV|CUMIPMT|LET|SWITCH|CHOOSE|FORMULATEXT|TOCOL|TOROW)\b/i
    );
    if (m) return m[1].toUpperCase();
    const t = q.a?.[q.correct] || "";
    const m2 = String(t).match(/^=?([A-Z][A-Z0-9.]+)/i);
    return m2 ? m2[1].toUpperCase().slice(0, 10) : "ƒx";
  }

  // ---------- Session ----------
  function newSession(questions, deckName) {
    const sessionId = `s_${Date.now().toString(36)}`;
    state.sessionId = sessionId;
    state.deckName = deckName || "Ván mới";
    state.questions = questions.slice(0, 100);
    // pad if fewer than 100
    while (state.questions.length < 100) {
      const base = state.questions[state.questions.length % Math.max(1, questions.length)];
      state.questions.push({
        ...base,
        id: `${base?.id || "pad"}_${state.questions.length}`,
        boardIndex: state.questions.length,
      });
    }
    state.cells = state.questions.map(() => ({
      answered: false,
      correct: false,
      usedHint: false,
      timeSec: 0,
      choice: null,
      points: 0,
    }));
    state.score = 0;
    state.answeredCount = 0;
    state.correctCount = 0;
    state.activeIndex = null;
    persist();
    renderBoard();
    renderStats();
    toast(`Đã tạo ván «${state.deckName}» — 100 ô`);
  }

  function persist() {
    if (!state.sessionId) return;
    Storage.saveProgress(state.sessionId, {
      sessionId: state.sessionId,
      deckName: state.deckName,
      mode: state.mode,
      playerName: state.playerName,
      questions: state.questions,
      cells: state.cells,
      score: state.score,
      answeredCount: state.answeredCount,
      correctCount: state.correctCount,
      savedAt: Date.now(),
    });
    Storage.saveSettings({
      playerName: state.playerName,
      mode: state.mode,
      lastSessionId: state.sessionId,
    });
  }

  function restoreLast() {
    const settings = Storage.getSettings();
    state.playerName = settings.playerName || "Player 1";
    state.mode = settings.mode || "practice";
    el.playerName.value = state.playerName;
    updateModeUI();

    if (settings.lastSessionId) {
      const p = Storage.getProgress(settings.lastSessionId);
      if (p && p.questions?.length) {
        Object.assign(state, {
          sessionId: p.sessionId,
          deckName: p.deckName,
          questions: p.questions,
          cells: p.cells,
          score: p.score,
          answeredCount: p.answeredCount,
          correctCount: p.correctCount,
          mode: p.mode || state.mode,
          playerName: p.playerName || state.playerName,
        });
        renderBoard();
        renderStats();
        toast("Đã khôi phục tiến độ ván trước");
        return true;
      }
    }
    return false;
  }

  // ---------- Render board ----------
  function renderBoard() {
    el.board.innerHTML = "";
    state.questions.forEach((q, i) => {
      const cell = state.cells[i];
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "cell";
      btn.dataset.index = String(i);
      btn.setAttribute("aria-label", `Ô ${i + 1}`);

      const num = document.createElement("span");
      num.textContent = String(i + 1);

      const fn = document.createElement("span");
      fn.className = "fn";
      fn.textContent = extractFnName(q);

      const dot = document.createElement("span");
      dot.className = `dot ${q.diff}`;

      btn.append(num, fn, dot);

      if (cell.answered) {
        btn.classList.add("locked", cell.correct ? "correct" : "wrong");
        num.textContent = cell.correct ? "✓" : "✗";
      }

      btn.addEventListener("click", () => openQuestion(i));
      el.board.appendChild(btn);
    });
  }

  function renderStats() {
    el.score.textContent = String(state.score);
    el.progress.textContent = `${state.answeredCount}/100`;
    el.correct.textContent = String(state.correctCount);
    const pct = state.answeredCount;
    el.progressBar.style.width = `${pct}%`;
    renderLeaderboard();
  }

  function renderLeaderboard() {
    const lb = Storage.getLeaderboard();
    // also show in-session summary at top
    const rows = [
      {
        playerName: state.playerName + " (ván này)",
        score: state.score,
        correctCount: state.correctCount,
        timeMs: 0,
        live: true,
      },
      ...lb,
    ].slice(0, 12);

    el.lbList.innerHTML = rows
      .map(
        (r, i) => `
      <li>
        <span>${i + 1}. ${escapeHtml(r.playerName)}${r.live ? " 🔵" : ""}</span>
        <strong>${r.score} đ · ${r.correctCount ?? "–"} đúng</strong>
      </li>`
      )
      .join("");
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function renderDecks() {
    const decks = Storage.getDecks();
    if (!decks.length) {
      el.deckList.innerHTML =
        '<p class="muted">Chưa có ván upload. Tải file Excel/PDF/Word để tạo ván riêng.</p>';
      return;
    }
    el.deckList.innerHTML = decks
      .map(
        (d) => `
      <div class="deck-item">
        <div>
          <strong>${escapeHtml(d.name)}</strong>
          <span class="muted">${d.count} câu · ${new Date(d.createdAt).toLocaleString("vi-VN")}</span>
        </div>
        <div style="display:flex;gap:6px">
          <button class="btn btn-primary" data-play-deck="${d.id}">Chơi</button>
          <button class="btn btn-danger" data-del-deck="${d.id}">Xóa</button>
        </div>
      </div>`
      )
      .join("");

    $$("[data-play-deck]").forEach((b) =>
      b.addEventListener("click", () => {
        const deck = Storage.getDecks().find((x) => x.id === b.dataset.playDeck);
        if (!deck) return;
        const balanced = Questions.buildBalancedSet(deck.questions, 100);
        newSession(balanced, deck.name);
        closeSource();
      })
    );
    $$("[data-del-deck]").forEach((b) =>
      b.addEventListener("click", () => {
        Storage.deleteDeck(b.dataset.delDeck);
        renderDecks();
        toast("Đã xóa ván");
      })
    );
  }

  // ---------- Question modal ----------
  let timerIv = null;

  function openQuestion(index) {
    const cell = state.cells[index];
    if (cell.answered) {
      toast("Ô này đã trả lời — bị khóa vĩnh viễn");
      return;
    }

    state.activeIndex = index;
    state.usedHintThis = false;
    state.selectedOption = null;
    state.questionStartedAt = Date.now();

    const q = state.questions[index];
    el.modalTitle.textContent = `Ô #${index + 1} · ${state.deckName}`;
    el.modalBadges.innerHTML = `
      <span class="badge ${q.diff}">${diffLabel(q.diff)}</span>
      <span class="badge">${extractFnName(q)}</span>
      <span class="badge">⏱ <span class="timer-live" id="modal-timer">0:00</span></span>
    `;
    // re-bind timer element
    el.timer = $("#modal-timer");
    el.modalQ.textContent = q.q;

    el.hintBox.classList.remove("show");
    el.explainBox.classList.remove("show");
    el.hintBox.textContent = "";
    el.explainBox.textContent = "";
    el.btnHint.disabled = false;
    el.btnSubmit.disabled = false;
    el.btnSubmit.textContent = "Xác nhận";

    if (q.type === "formula") {
      el.modalOpts.innerHTML = "";
      el.modalFormula.style.display = "block";
      el.modalFormula.value = "";
      el.modalFormula.placeholder = "Nhập công thức, vd: =SUMIF(A:A,\"x\",B:B)";
    } else {
      el.modalFormula.style.display = "none";
      el.modalOpts.innerHTML = q.a
        .map(
          (opt, i) => `
        <button type="button" class="opt" data-opt="${i}">
          <span class="key">${String.fromCharCode(65 + i)}</span>
          <span>${escapeHtml(opt)}</span>
        </button>`
        )
        .join("");
      $$(".opt", el.modalOpts).forEach((btn) => {
        btn.addEventListener("click", () => {
          $$(".opt", el.modalOpts).forEach((x) => x.classList.remove("selected"));
          btn.classList.add("selected");
          state.selectedOption = Number(btn.dataset.opt);
        });
      });
    }

    // highlight cell
    $$(".cell").forEach((c) => c.classList.remove("active"));
    const cellEl = $(`.cell[data-index="${index}"]`);
    if (cellEl) cellEl.classList.add("active");

    el.modal.classList.add("open");
    clearInterval(timerIv);
    timerIv = setInterval(() => {
      const sec = (Date.now() - state.questionStartedAt) / 1000;
      if (el.timer) el.timer.textContent = fmtTime(sec);
    }, 200);
  }

  function closeModal() {
    el.modal.classList.remove("open");
    clearInterval(timerIv);
    state.activeIndex = null;
    $$(".cell").forEach((c) => c.classList.remove("active"));
  }

  function showHint() {
    if (state.activeIndex == null) return;
    const q = state.questions[state.activeIndex];
    state.usedHintThis = true;
    el.hintBox.textContent = "💡 " + (q.hint || "Không có gợi ý.");
    el.hintBox.classList.add("show");
    el.btnHint.disabled = true;
    toast("Đã dùng gợi ý (−30% điểm nếu trả lời đúng)");
  }

  function submitAnswer() {
    if (state.activeIndex == null) return;
    const i = state.activeIndex;
    const cell = state.cells[i];
    if (cell.answered) return;

    const q = state.questions[i];
    let choice = state.selectedOption;
    if (q.type === "formula") {
      choice = el.modalFormula.value;
      if (!String(choice).trim()) {
        toast("Hãy nhập công thức");
        return;
      }
    } else if (choice == null) {
      toast("Hãy chọn đáp án A–D");
      return;
    }

    const timeSec = (Date.now() - state.questionStartedAt) / 1000;
    const ok = Questions.checkAnswer(q, choice);
    const pts = ok
      ? Questions.pointsFor(q.diff, state.usedHintThis, timeSec)
      : 0;

    // lock cell forever
    cell.answered = true;
    cell.correct = ok;
    cell.usedHint = state.usedHintThis;
    cell.timeSec = timeSec;
    cell.choice = choice;
    cell.points = pts;

    state.answeredCount += 1;
    if (ok) {
      state.correctCount += 1;
      state.score += pts;
    }

    // reveal
    if (q.type !== "formula") {
      $$(".opt", el.modalOpts).forEach((btn) => {
        const idx = Number(btn.dataset.opt);
        if (idx === q.correct) btn.classList.add("correct-reveal");
        if (idx === choice && !ok) btn.classList.add("wrong-reveal");
        btn.disabled = true;
      });
    }

    el.explainBox.innerHTML = ok
      ? `<strong style="color:var(--ok)">Chính xác! +${pts} điểm</strong><br>${escapeHtml(q.explain)}`
      : `<strong style="color:var(--bad)">Chưa đúng.</strong> Đáp án: <code>${escapeHtml(
          q.type === "formula"
            ? q.formulaAnswer || q.a[q.correct]
            : String.fromCharCode(65 + q.correct) + ". " + q.a[q.correct]
        )}</code><br>${escapeHtml(q.explain)}`;
    el.explainBox.classList.add("show");
    el.btnSubmit.disabled = true;
    el.btnHint.disabled = true;
    el.btnSubmit.textContent = "Đã khóa ô";

    // battle: rotate name label
    if (state.mode === "battle" && state.battlePlayers.length > 1) {
      state.battleTurn =
        (state.battleTurn + 1) % state.battlePlayers.length;
      toast(`Lượt tiếp: ${state.battlePlayers[state.battleTurn]}`);
    }

    persist();
    renderBoard();
    renderStats();

    // finish?
    if (state.answeredCount >= 100) {
      finishGame();
    }
  }

  function finishGame() {
    Storage.addScore({
      id: `lb_${Date.now()}`,
      playerName: state.playerName,
      score: state.score,
      correctCount: state.correctCount,
      timeMs: state.cells.reduce((s, c) => s + (c.timeSec || 0), 0) * 1000,
      deckName: state.deckName,
      mode: state.mode,
      date: new Date().toISOString(),
    });
    renderLeaderboard();
    toast(
      `Hoàn thành! ${state.correctCount}/100 đúng · ${state.score} điểm`
    );
  }

  // ---------- Modes ----------
  function updateModeUI() {
    el.modePractice.classList.toggle("active", state.mode === "practice");
    el.modeBattle.classList.toggle("active", state.mode === "battle");
  }

  function setMode(mode) {
    state.mode = mode;
    if (mode === "battle") {
      const names = prompt(
        "Nhập tên người chơi, cách nhau bởi dấu phẩy (tối thiểu 2):",
        `${state.playerName}, Player 2`
      );
      if (names) {
        state.battlePlayers = names
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
        if (state.battlePlayers.length < 2) {
          state.battlePlayers = [state.playerName, "Player 2"];
        }
        state.battleTurn = 0;
        state.playerName = state.battlePlayers[0];
        el.playerName.value = state.playerName;
        toast(`Thi đấu: ${state.battlePlayers.join(" vs ")}`);
      } else {
        state.mode = "practice";
      }
    }
    updateModeUI();
    persist();
  }

  // ---------- Source modal ----------
  function openSource() {
    el.sourcePanel.classList.add("open");
    renderDecks();
  }
  function closeSource() {
    el.sourcePanel.classList.remove("open");
  }

  async function handleFiles(files) {
    const file = files?.[0];
    if (!file) return;
    toast(`Đang đọc ${file.name}…`);
    try {
      const items = await Questions.parseFile(file);
      if (!items.length) throw new Error("Không trích được câu hỏi từ file");
      const deck = {
        id: `deck_${Date.now().toString(36)}`,
        name: file.name.replace(/\.[^.]+$/, ""),
        count: items.length,
        questions: items,
        createdAt: Date.now(),
      };
      Storage.saveDeck(deck);
      renderDecks();
      const balanced = Questions.buildBalancedSet(items, 100);
      newSession(balanced, deck.name);
      closeSource();
      toast(`Đã tạo ván từ file (${items.length} câu → 100 ô cân bằng)`);
    } catch (e) {
      console.error(e);
      toast(e.message || "Lỗi đọc file");
    }
  }

  // ---------- Wire events ----------
  function wire() {
    $("#btn-new-demo").addEventListener("click", () => {
      newSession(Questions.buildFromSample(), "Demo Excel 100");
    });
    $("#btn-new-web").addEventListener("click", () => {
      newSession(Questions.buildFromWeb(), "Web Excel Feed");
    });
    $("#btn-sources").addEventListener("click", openSource);
    $("#btn-reset").addEventListener("click", () => {
      if (!confirm("Xóa tiến độ ván hiện tại và tạo ván demo mới?")) return;
      if (state.sessionId) Storage.clearProgress(state.sessionId);
      newSession(Questions.buildFromSample(), "Demo Excel 100");
    });

    el.btnClose.addEventListener("click", closeModal);
    el.modal.addEventListener("click", (e) => {
      if (e.target === el.modal) closeModal();
    });
    el.btnHint.addEventListener("click", showHint);
    el.btnSubmit.addEventListener("click", submitAnswer);

    el.playerName.addEventListener("change", () => {
      state.playerName = el.playerName.value.trim() || "Player 1";
      persist();
      renderLeaderboard();
    });

    el.modePractice.addEventListener("click", () => setMode("practice"));
    el.modeBattle.addEventListener("click", () => setMode("battle"));

    el.dropzone.addEventListener("click", () => el.fileInput.click());
    el.fileInput.addEventListener("change", (e) => handleFiles(e.target.files));
    ["dragenter", "dragover"].forEach((ev) =>
      el.dropzone.addEventListener(ev, (e) => {
        e.preventDefault();
        el.dropzone.classList.add("drag");
      })
    );
    ["dragleave", "drop"].forEach((ev) =>
      el.dropzone.addEventListener(ev, (e) => {
        e.preventDefault();
        el.dropzone.classList.remove("drag");
      })
    );
    el.dropzone.addEventListener("drop", (e) => {
      handleFiles(e.dataTransfer.files);
    });

    $("#btn-close-source").addEventListener("click", closeSource);
    el.sourcePanel.addEventListener("click", (e) => {
      if (e.target === el.sourcePanel) closeSource();
    });

    document.addEventListener("keydown", (e) => {
      if (!el.modal.classList.contains("open")) return;
      if (e.key === "Escape") closeModal();
      if (e.key === "Enter" && !el.btnSubmit.disabled) submitAnswer();
      const map = { a: 0, b: 1, c: 2, d: 3 };
      const k = e.key.toLowerCase();
      if (k in map) {
        const btn = $(`.opt[data-opt="${map[k]}"]`);
        if (btn) btn.click();
      }
    });
  }

  // ---------- Boot ----------
  async function boot() {
    wire();
    await Questions.loadSampleBank();

    // realtime web counter
    setInterval(() => {
      const n = Questions.tickWebCount();
      if (el.webCount) el.webCount.textContent = String(n);
    }, 1000);
    el.webCount.textContent = String(Questions.getWebCount());

    if (!restoreLast()) {
      newSession(Questions.buildFromSample(), "Demo Excel 100");
    }
    renderDecks();
    renderLeaderboard();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();

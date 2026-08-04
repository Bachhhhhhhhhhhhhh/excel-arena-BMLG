/**
 * Excel Function Grid Quiz — main app (hardened)
 */
(() => {
  "use strict";

  const state = {
    sessionId: null,
    deckName: "Demo Excel 100",
    mode: "practice",
    playerName: "Player 1",
    questions: [],
    cells: [],
    score: 0,
    answeredCount: 0,
    correctCount: 0,
    activeIndex: null,
    questionStartedAt: 0,
    usedHintThis: false,
    selectedOption: null,
  };

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  // query DOM after parse (defer)
  const el = {};
  function bindEl() {
    Object.assign(el, {
      board: $("#board"),
      score: $("#stat-score"),
      progress: $("#stat-progress"),
      correct: $("#stat-correct"),
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
      modeOnline: $("#mode-online"),
      mpPanel: $("#mp-panel"),
      mpStatus: $("#mp-status"),
      mpCode: $("#mp-code"),
      mpPlayers: $("#mp-players"),
      mpCreate: $("#mp-create"),
      mpJoin: $("#mp-join"),
      mpJoinCode: $("#mp-join-code"),
      mpLeave: $("#mp-leave"),
      mpCopy: $("#mp-copy"),
      fileInput: $("#file-input"),
      dropzone: $("#dropzone"),
      sourcePanel: $("#source-modal"),
    });
  }

  function toast(msg) {
    if (!el.toast) return;
    el.toast.textContent = String(msg || "");
    el.toast.classList.add("show");
    clearTimeout(toast._t);
    toast._t = setTimeout(() => el.toast.classList.remove("show"), 2600);
  }

  function fmtTime(sec) {
    const s = Math.max(0, Math.floor(sec));
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  }

  function diffLabel(d) {
    return d === "easy" ? "Dễ" : d === "hard" ? "Khó" : "TB";
  }

  function escapeHtml(s) {
    return String(s ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function extractFnName(q) {
    try {
      const m = String(q?.q || "").match(
        /\b(SUMIFS?|COUNTIFS?|AVERAGEIFS?|XLOOKUP|VLOOKUP|HLOOKUP|INDEX|MATCH|IFERROR|IFS|IF|TEXTJOIN|FILTER|SORT|UNIQUE|SUMPRODUCT|LAMBDA|LET|PMT|IRR)\b/i
      );
      if (m) return m[1].toUpperCase();
      const t = q?.a?.[q.correct] || "";
      const m2 = String(t).match(/^=?([A-Z][A-Z0-9.]{1,12})/i);
      return m2 ? m2[1].toUpperCase() : "ƒx";
    } catch {
      return "ƒx";
    }
  }

  function emptyCell() {
    return {
      answered: false,
      correct: false,
      usedHint: false,
      timeSec: 0,
      choice: null,
      points: 0,
    };
  }

  function ensureCells(n) {
    if (!Array.isArray(state.cells)) state.cells = [];
    while (state.cells.length < n) state.cells.push(emptyCell());
    if (state.cells.length > n) state.cells = state.cells.slice(0, n);
    state.cells = state.cells.map((c) =>
      c && typeof c === "object" ? { ...emptyCell(), ...c } : emptyCell()
    );
  }

  function newSession(questions, deckName) {
    try {
      const list = Array.isArray(questions) ? questions.filter(Boolean) : [];
      if (!list.length) {
        toast("Không có câu hỏi — thử Ván demo");
        return;
      }

      state.sessionId = `s_${Date.now().toString(36)}`;
      state.deckName = deckName || "Ván mới";
      state.questions = list.slice(0, 100).map((q, i) => ({
        ...q,
        boardIndex: i,
        a: Array.isArray(q.a) ? q.a.slice(0, 4) : ["A", "B", "C", "D"],
        correct: Number.isFinite(q.correct) ? q.correct : 0,
        diff: q.diff || "medium",
      }));

      while (state.questions.length < 100) {
        const base = state.questions[state.questions.length % state.questions.length];
        state.questions.push({
          ...base,
          id: `${base.id || "pad"}_${state.questions.length}`,
          boardIndex: state.questions.length,
        });
      }

      state.cells = state.questions.map(() => emptyCell());
      state.score = 0;
      state.answeredCount = 0;
      state.correctCount = 0;
      state.activeIndex = null;
      state.selectedOption = null;

      persist();
      renderBoard();
      renderStats();
      syncMultiplayerStats();
      toast(`Đã tạo ván «${state.deckName}» — 100 ô`);
    } catch (e) {
      console.error(e);
      toast("Lỗi tạo ván: " + (e.message || e));
    }
  }

  function persist() {
    try {
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
      });
      Storage.saveSettings({
        playerName: state.playerName,
        mode: state.mode === "online" ? "practice" : state.mode,
        lastSessionId: state.sessionId,
      });
    } catch (e) {
      console.warn("persist fail", e);
    }
  }

  function restoreLast() {
    try {
      const settings = Storage.getSettings();
      state.playerName = settings.playerName || "Player 1";
      if (el.playerName) el.playerName.value = state.playerName;

      // không auto-restore mode online
      state.mode = settings.mode === "online" ? "practice" : settings.mode || "practice";
      updateModeUI();

      if (!settings.lastSessionId) return false;
      const p = Storage.getProgress(settings.lastSessionId);
      if (!p) return false;

      let questions = Array.isArray(p.questions) ? p.questions : null;
      if (!questions || !questions.length) {
        // rebuild from sample if lost
        questions = Questions.buildFromSample();
      }

      state.sessionId = p.sessionId;
      state.deckName = p.deckName || "Đã lưu";
      state.questions = questions.slice(0, 100);
      while (state.questions.length < 100) {
        const b = state.questions[0];
        state.questions.push({ ...b, id: `pad_${state.questions.length}` });
      }
      state.cells = Array.isArray(p.cells) ? p.cells : [];
      ensureCells(state.questions.length);
      state.score = Number(p.score) || 0;
      state.answeredCount = Number(p.answeredCount) || 0;
      state.correctCount = Number(p.correctCount) || 0;
      state.playerName = p.playerName || state.playerName;
      if (el.playerName) el.playerName.value = state.playerName;

      renderBoard();
      renderStats();
      toast("Đã khôi phục tiến độ ván trước");
      return true;
    } catch (e) {
      console.warn("restore fail", e);
      return false;
    }
  }

  function renderBoard() {
    if (!el.board) return;
    ensureCells(state.questions.length);
    el.board.innerHTML = "";

    const frag = document.createDocumentFragment();
    state.questions.forEach((q, i) => {
      const cell = state.cells[i] || emptyCell();
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "cell";
      btn.dataset.index = String(i);

      const num = document.createElement("span");
      num.textContent = String(i + 1);
      const fn = document.createElement("span");
      fn.className = "fn";
      fn.textContent = extractFnName(q);
      const dot = document.createElement("span");
      dot.className = `dot ${q.diff || "medium"}`;
      btn.append(num, fn, dot);

      if (cell.answered) {
        btn.classList.add("locked", cell.correct ? "correct" : "wrong");
        num.textContent = cell.correct ? "✓" : "✗";
      }

      btn.addEventListener("click", () => openQuestion(i));
      frag.appendChild(btn);
    });
    el.board.appendChild(frag);
  }

  function renderStats() {
    if (el.score) el.score.textContent = String(state.score);
    if (el.progress) el.progress.textContent = `${state.answeredCount}/100`;
    if (el.correct) el.correct.textContent = String(state.correctCount);
    if (el.progressBar) {
      el.progressBar.style.width = `${Math.min(100, state.answeredCount)}%`;
    }
    renderLeaderboard();
  }

  function renderLeaderboard() {
    if (!el.lbList) return;
    try {
      if (typeof Multiplayer !== "undefined" && Multiplayer.isInRoom()) {
        const room = Multiplayer.listPlayers();
        el.lbList.innerHTML =
          room
            .map(
              (r, i) => `<li>
            <span>${i + 1}. ${escapeHtml(r.name)}${r.isHost ? " 👑" : ""}</span>
            <strong>${r.score}đ · ${r.answered}/100 · ${r.correct}✓</strong>
          </li>`
            )
            .join("") || '<li class="muted">Chưa có ai…</li>';
        return;
      }
      const lb = Storage.getLeaderboard();
      const rows = [
        {
          playerName: state.playerName + " (ván này)",
          score: state.score,
          correctCount: state.correctCount,
          live: true,
        },
        ...lb,
      ].slice(0, 12);
      el.lbList.innerHTML = rows
        .map(
          (r, i) => `<li>
          <span>${i + 1}. ${escapeHtml(r.playerName)}${r.live ? " 🔵" : ""}</span>
          <strong>${r.score} đ · ${r.correctCount ?? "–"} đúng</strong>
        </li>`
        )
        .join("");
    } catch (e) {
      console.warn(e);
    }
  }

  function renderMpPlayers(list) {
    if (!el.mpPlayers) return;
    if (!list || !list.length) {
      el.mpPlayers.innerHTML = '<p class="muted">Chưa có ai trong phòng.</p>';
      return;
    }
    const info =
      typeof Multiplayer !== "undefined"
        ? Multiplayer.getRoomInfo()
        : { selfId: null };
    el.mpPlayers.innerHTML = list
      .map((p, i) => {
        const me = p.id === info.selfId;
        return `<div class="mp-player${me ? " me" : ""}">
          <span class="rank">#${i + 1}</span>
          <span class="name"><span class="mp-dot"></span>${escapeHtml(p.name)}
            ${p.isHost ? '<span class="tag">HOST</span>' : ""}
            ${me ? '<span class="tag">BẠN</span>' : ""}
          </span>
          <span class="stats">${p.score}đ · ${p.answered}/100 · ${p.correct}✓</span>
        </div>`;
      })
      .join("");
  }

  function syncMultiplayerStats() {
    try {
      if (typeof Multiplayer === "undefined" || !Multiplayer.isInRoom()) return;
      Multiplayer.setSelfStats({
        name: state.playerName,
        score: state.score,
        correct: state.correctCount,
        answered: state.answeredCount,
      });
    } catch (e) {
      console.warn("mp sync", e);
    }
  }

  function setMpUiInRoom(inRoom, code) {
    if (el.mpLeave) el.mpLeave.hidden = !inRoom;
    if (el.mpCopy) el.mpCopy.hidden = !inRoom;
    if (el.mpCreate) el.mpCreate.disabled = !!inRoom;
    if (el.mpJoin) el.mpJoin.disabled = !!inRoom;
    if (el.mpCode) el.mpCode.textContent = code || "————";
  }

  function renderDecks() {
    if (!el.deckList) return;
    const decks = Storage.getDecks();
    if (!decks.length) {
      el.deckList.innerHTML =
        '<p class="muted">Chưa có ván upload. Tải file Excel/PDF/Word để tạo ván riêng.</p>';
      return;
    }
    el.deckList.innerHTML = decks
      .map(
        (d) => `<div class="deck-item">
        <div>
          <strong>${escapeHtml(d.name)}</strong>
          <span class="muted">${d.count || d.questions?.length || 0} câu</span>
        </div>
        <div style="display:flex;gap:6px">
          <button class="btn btn-primary" data-play-deck="${escapeHtml(d.id)}">Chơi</button>
          <button class="btn btn-danger" data-del-deck="${escapeHtml(d.id)}">Xóa</button>
        </div>
      </div>`
      )
      .join("");

    $$("[data-play-deck]").forEach((b) =>
      b.addEventListener("click", () => {
        const deck = Storage.getDecks().find((x) => x.id === b.dataset.playDeck);
        if (!deck?.questions?.length) return toast("Ván trống");
        newSession(Questions.buildBalancedSet(deck.questions, 100), deck.name);
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

  let timerIv = null;

  function openQuestion(index) {
    ensureCells(state.questions.length);
    const cell = state.cells[index];
    if (!cell) return;
    if (cell.answered) {
      toast("Ô này đã trả lời — bị khóa");
      return;
    }
    const q = state.questions[index];
    if (!q) return;

    state.activeIndex = index;
    state.usedHintThis = false;
    state.selectedOption = null;
    state.questionStartedAt = Date.now();

    el.modalTitle.textContent = `Ô #${index + 1} · ${state.deckName}`;
    el.modalBadges.innerHTML = `
      <span class="badge ${q.diff}">${diffLabel(q.diff)}</span>
      <span class="badge">${escapeHtml(extractFnName(q))}</span>
      <span class="badge">⏱ <span class="timer-live" id="modal-timer">0:00</span></span>`;
    el.modalQ.textContent = q.q || "";

    el.hintBox.classList.remove("show");
    el.explainBox.classList.remove("show");
    el.hintBox.textContent = "";
    el.explainBox.textContent = "";
    el.btnHint.disabled = false;
    el.btnSubmit.disabled = false;
    el.btnSubmit.textContent = "Xác nhận";

    const opts = Array.isArray(q.a) ? q.a : [];
    el.modalFormula.style.display = "none";
    el.modalOpts.innerHTML = opts
      .slice(0, 4)
      .map(
        (opt, i) => `<button type="button" class="opt" data-opt="${i}">
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

    $$(".cell").forEach((c) => c.classList.remove("active"));
    const cellEl = $(`.cell[data-index="${index}"]`);
    if (cellEl) cellEl.classList.add("active");

    el.modal.classList.add("open");
    clearInterval(timerIv);
    timerIv = setInterval(() => {
      const t = $("#modal-timer");
      if (t) t.textContent = fmtTime((Date.now() - state.questionStartedAt) / 1000);
    }, 250);
  }

  function closeModal() {
    el.modal?.classList.remove("open");
    clearInterval(timerIv);
    state.activeIndex = null;
    $$(".cell").forEach((c) => c.classList.remove("active"));
  }

  function showHint() {
    if (state.activeIndex == null) return;
    const q = state.questions[state.activeIndex];
    state.usedHintThis = true;
    el.hintBox.textContent = "💡 " + (q?.hint || "Không có gợi ý.");
    el.hintBox.classList.add("show");
    el.btnHint.disabled = true;
    toast("Đã dùng gợi ý (−30% điểm nếu đúng)");
  }

  function submitAnswer() {
    try {
      if (state.activeIndex == null) return;
      const i = state.activeIndex;
      ensureCells(state.questions.length);
      const cell = state.cells[i];
      const q = state.questions[i];
      if (!cell || !q || cell.answered) return;

      let choice = state.selectedOption;
      if (choice == null || choice < 0 || choice > 3) {
        toast("Hãy chọn đáp án A–D");
        return;
      }

      const timeSec = (Date.now() - state.questionStartedAt) / 1000;
      const ok = Questions.checkAnswer(q, choice);
      const pts = ok
        ? Questions.pointsFor(q.diff, state.usedHintThis, timeSec)
        : 0;

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

      $$(".opt", el.modalOpts).forEach((btn) => {
        const idx = Number(btn.dataset.opt);
        if (idx === Number(q.correct)) btn.classList.add("correct-reveal");
        if (idx === choice && !ok) btn.classList.add("wrong-reveal");
        btn.disabled = true;
      });

      const ansText =
        String.fromCharCode(65 + Number(q.correct)) +
        ". " +
        (q.a?.[q.correct] ?? "");
      el.explainBox.innerHTML = ok
        ? `<strong style="color:var(--ok)">Chính xác! +${pts} điểm</strong><br>${escapeHtml(q.explain || "")}`
        : `<strong style="color:var(--bad)">Chưa đúng.</strong> Đáp án: <code>${escapeHtml(ansText)}</code><br>${escapeHtml(q.explain || "")}`;
      el.explainBox.classList.add("show");
      el.btnSubmit.disabled = true;
      el.btnHint.disabled = true;
      el.btnSubmit.textContent = "Đã khóa ô";

      persist();
      renderBoard();
      renderStats();
      syncMultiplayerStats();

      if (state.answeredCount >= 100) finishGame();
    } catch (e) {
      console.error(e);
      toast("Lỗi gửi đáp án: " + (e.message || e));
    }
  }

  function finishGame() {
    try {
      Storage.addScore({
        id: `lb_${Date.now()}`,
        playerName: state.playerName,
        score: state.score,
        correctCount: state.correctCount,
        timeMs: state.cells.reduce((s, c) => s + (c?.timeSec || 0), 0) * 1000,
        deckName: state.deckName,
        mode: state.mode,
        date: new Date().toISOString(),
      });
    } catch {
      /* */
    }
    renderLeaderboard();
    syncMultiplayerStats();
    toast(`Xong! ${state.correctCount}/100 đúng · ${state.score} điểm`);
  }

  function updateModeUI() {
    el.modePractice?.classList.toggle("active", state.mode === "practice");
    el.modeOnline?.classList.toggle("active", state.mode === "online");
    if (el.mpPanel) el.mpPanel.hidden = state.mode !== "online";
  }

  function setMode(mode) {
    state.mode = mode;
    if (mode === "online") toast("Online: tạo phòng / nhập mã — chơi CÙNG LÚC");
    updateModeUI();
    persist();
  }

  function wireMultiplayer() {
    if (typeof Multiplayer === "undefined") {
      console.warn("Multiplayer missing");
      return;
    }

    Multiplayer.on("status", (msg) => {
      if (el.mpStatus) {
        el.mpStatus.textContent = msg;
        el.mpStatus.classList.remove("err");
      }
    });
    Multiplayer.on("error", (msg) => {
      if (el.mpStatus) {
        el.mpStatus.textContent = String(msg);
        el.mpStatus.classList.add("err");
      }
    });
    Multiplayer.on("roster", (list, meta) => {
      renderMpPlayers(list);
      renderLeaderboard();
      setMpUiInRoom(!!meta?.roomCode, meta?.roomCode);
    });

    el.mpCreate?.addEventListener("click", async () => {
      try {
        state.playerName = (el.playerName?.value || "Player 1").trim() || "Player 1";
        el.mpCreate.disabled = true;
        const { roomCode } = await Multiplayer.createRoom(state.playerName);
        setMpUiInRoom(true, roomCode);
        syncMultiplayerStats();
        try {
          const u = new URL(location.href);
          u.searchParams.set("room", roomCode);
          history.replaceState(null, "", u.toString());
        } catch {
          /* */
        }
        toast("Phòng " + roomCode + " — gửi mã cho bạn!");
      } catch (e) {
        toast(e.message || "Không tạo được phòng");
        if (el.mpCreate) el.mpCreate.disabled = false;
      }
    });

    el.mpJoin?.addEventListener("click", async () => {
      try {
        state.playerName = (el.playerName?.value || "Player 1").trim() || "Player 1";
        const code = (el.mpJoinCode?.value || "").trim();
        if (!code) return toast("Nhập mã phòng");
        el.mpJoin.disabled = true;
        const { roomCode } = await Multiplayer.joinRoom(code, state.playerName);
        setMpUiInRoom(true, roomCode);
        syncMultiplayerStats();
        toast("Đã vào phòng " + roomCode);
      } catch (e) {
        toast(e.message || "Không vào được phòng");
        if (el.mpJoin) el.mpJoin.disabled = false;
      }
    });

    el.mpLeave?.addEventListener("click", () => {
      Multiplayer.leave();
      setMpUiInRoom(false, null);
      if (el.mpCreate) el.mpCreate.disabled = false;
      if (el.mpJoin) el.mpJoin.disabled = false;
      renderMpPlayers([]);
      renderLeaderboard();
      try {
        const u = new URL(location.href);
        u.searchParams.delete("room");
        history.replaceState(null, "", u.toString());
      } catch {
        /* */
      }
    });

    el.mpCopy?.addEventListener("click", async () => {
      const info = Multiplayer.getRoomInfo();
      if (!info.roomCode) return;
      const share = `${location.origin}${location.pathname}?room=${info.roomCode}`;
      try {
        await navigator.clipboard.writeText(share);
        toast("Đã copy link mời");
      } catch {
        prompt("Copy link:", share);
      }
    });

    el.mpJoinCode?.addEventListener("keydown", (e) => {
      if (e.key === "Enter") el.mpJoin?.click();
    });
  }

  function openSource() {
    el.sourcePanel?.classList.add("open");
    renderDecks();
  }
  function closeSource() {
    el.sourcePanel?.classList.remove("open");
  }

  async function handleFiles(files) {
    const file = files?.[0];
    if (!file) return;
    toast(`Đang đọc ${file.name}…`);
    try {
      if (typeof XLSX === "undefined" && /\.xlsx?$/i.test(file.name)) {
        throw new Error("Thư viện Excel chưa load — tải lại trang");
      }
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
      newSession(Questions.buildBalancedSet(items, 100), deck.name);
      closeSource();
      toast(`Ván từ file: ${items.length} câu → 100 ô`);
    } catch (e) {
      console.error(e);
      toast(e.message || "Lỗi đọc file");
    }
  }

  function wire() {
    $("#btn-new-demo")?.addEventListener("click", () => {
      try {
        newSession(Questions.buildFromSample(), "Demo Excel 100");
      } catch (e) {
        toast("Lỗi: " + e.message);
      }
    });
    $("#btn-new-web")?.addEventListener("click", () => {
      try {
        newSession(Questions.buildFromWeb(), "Web Excel Feed");
      } catch (e) {
        toast("Lỗi: " + e.message);
      }
    });
    $("#btn-sources")?.addEventListener("click", openSource);
    $("#btn-reset")?.addEventListener("click", () => {
      if (!confirm("Chơi lại ván demo mới?")) return;
      if (state.sessionId) Storage.clearProgress(state.sessionId);
      newSession(Questions.buildFromSample(), "Demo Excel 100");
    });

    el.btnClose?.addEventListener("click", closeModal);
    el.modal?.addEventListener("click", (e) => {
      if (e.target === el.modal) closeModal();
    });
    el.btnHint?.addEventListener("click", showHint);
    el.btnSubmit?.addEventListener("click", submitAnswer);

    el.playerName?.addEventListener("change", () => {
      state.playerName = el.playerName.value.trim() || "Player 1";
      persist();
      syncMultiplayerStats();
      renderLeaderboard();
    });

    el.modePractice?.addEventListener("click", () => setMode("practice"));
    el.modeOnline?.addEventListener("click", () => setMode("online"));
    wireMultiplayer();

    el.dropzone?.addEventListener("click", () => el.fileInput?.click());
    el.fileInput?.addEventListener("change", (e) => handleFiles(e.target.files));
    ["dragenter", "dragover"].forEach((ev) =>
      el.dropzone?.addEventListener(ev, (e) => {
        e.preventDefault();
        el.dropzone.classList.add("drag");
      })
    );
    ["dragleave", "drop"].forEach((ev) =>
      el.dropzone?.addEventListener(ev, (e) => {
        e.preventDefault();
        el.dropzone.classList.remove("drag");
      })
    );
    el.dropzone?.addEventListener("drop", (e) => handleFiles(e.dataTransfer.files));

    $("#btn-close-source")?.addEventListener("click", closeSource);
    el.sourcePanel?.addEventListener("click", (e) => {
      if (e.target === el.sourcePanel) closeSource();
    });

    document.addEventListener("keydown", (e) => {
      if (!el.modal?.classList.contains("open")) return;
      if (e.key === "Escape") closeModal();
      if (e.key === "Enter" && !el.btnSubmit?.disabled) {
        e.preventDefault();
        submitAnswer();
      }
      const map = { a: 0, b: 1, c: 2, d: 3 };
      const k = e.key.toLowerCase();
      if (k in map) $(`.opt[data-opt="${map[k]}"]`)?.click();
    });
  }

  async function boot() {
    bindEl();
    wire();

    // back link
    const back = $("#back-arena");
    if (back) {
      let path = location.pathname.replace(/\/?quiz\/?$/, "/");
      if (!path.endsWith("/")) path += "/";
      back.href = path;
    }

    try {
      await Questions.loadSampleBank();
    } catch (e) {
      console.warn("sample load", e);
    }

    setInterval(() => {
      try {
        const n = Questions.tickWebCount();
        if (el.webCount) el.webCount.textContent = String(n);
      } catch {
        /* */
      }
    }, 1000);

    setInterval(() => {
      try {
        if (typeof Multiplayer !== "undefined" && Multiplayer.isInRoom()) {
          syncMultiplayerStats();
        }
      } catch {
        /* */
      }
    }, 2000);

    if (!restoreLast()) {
      try {
        newSession(Questions.buildFromSample(), "Demo Excel 100");
      } catch (e) {
        toast("Không tạo được ván demo: " + e.message);
      }
    }

    renderDecks();
    renderLeaderboard();
    updateModeUI();

    if (el.webCount) el.webCount.textContent = String(Questions.getWebCount?.() || 0);

    const roomQ = new URLSearchParams(location.search).get("room");
    if (roomQ) {
      setMode("online");
      if (el.mpJoinCode) el.mpJoinCode.value = roomQ.toUpperCase();
      toast("Nhập tên → Vào phòng: " + roomQ.toUpperCase());
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();

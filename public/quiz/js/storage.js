/**
 * localStorage helpers — an toàn quota, progress gọn
 */
const Storage = (() => {
  const KEYS = {
    DECKS: "efg_decks_v2",
    PROGRESS: "efg_progress_v2",
    LEADERBOARD: "efg_lb_v2",
    SETTINGS: "efg_settings_v2",
  };

  function read(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      return JSON.parse(raw);
    } catch {
      return fallback;
    }
  }

  function write(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.warn("localStorage write failed", key, e);
      // thử dọn bớt progress cũ
      try {
        if (key !== KEYS.PROGRESS) localStorage.removeItem(KEYS.PROGRESS);
        localStorage.setItem(key, JSON.stringify(value));
        return true;
      } catch {
        return false;
      }
    }
  }

  return {
    KEYS,

    getDecks() {
      return read(KEYS.DECKS, []);
    },

    saveDeck(deck) {
      // không lưu quá nhiều deck / cắt bớt
      const slim = {
        ...deck,
        questions: (deck.questions || []).slice(0, 200).map((q) => ({
          id: q.id,
          q: q.q,
          a: q.a,
          correct: q.correct,
          diff: q.diff,
          hint: q.hint,
          explain: q.explain,
          type: q.type,
        })),
      };
      const decks = this.getDecks().filter((d) => d.id !== slim.id);
      decks.unshift(slim);
      write(KEYS.DECKS, decks.slice(0, 10));
      return decks;
    },

    deleteDeck(id) {
      const decks = this.getDecks().filter((d) => d.id !== id);
      write(KEYS.DECKS, decks);
      return decks;
    },

    getProgress(sessionId) {
      const all = read(KEYS.PROGRESS, {});
      return all[sessionId] || null;
    },

    /** progress gọn: cells + meta, questions optional */
    saveProgress(sessionId, progress) {
      const all = read(KEYS.PROGRESS, {});
      // chỉ giữ 3 session gần nhất
      const slim = {
        sessionId: progress.sessionId,
        deckName: progress.deckName,
        mode: progress.mode,
        playerName: progress.playerName,
        score: progress.score,
        answeredCount: progress.answeredCount,
        correctCount: progress.correctCount,
        cells: progress.cells,
        // lưu id list để khôi phục; full questions nếu ngắn
        questionIds: (progress.questions || []).map((q) => q.id),
        questions:
          JSON.stringify(progress.questions || []).length < 80000
            ? progress.questions
            : null,
        savedAt: Date.now(),
      };
      all[sessionId] = slim;
      const keys = Object.keys(all).sort(
        (a, b) => (all[b].savedAt || 0) - (all[a].savedAt || 0)
      );
      const trimmed = {};
      keys.slice(0, 3).forEach((k) => {
        trimmed[k] = all[k];
      });
      return write(KEYS.PROGRESS, trimmed);
    },

    clearProgress(sessionId) {
      const all = read(KEYS.PROGRESS, {});
      delete all[sessionId];
      write(KEYS.PROGRESS, all);
    },

    getLeaderboard() {
      return read(KEYS.LEADERBOARD, []);
    },

    addScore(entry) {
      const lb = this.getLeaderboard();
      lb.push(entry);
      lb.sort((a, b) => b.score - a.score || (a.timeMs || 0) - (b.timeMs || 0));
      write(KEYS.LEADERBOARD, lb.slice(0, 30));
      return lb.slice(0, 30);
    },

    getSettings() {
      return read(KEYS.SETTINGS, { playerName: "Player 1", mode: "practice" });
    },

    saveSettings(s) {
      write(KEYS.SETTINGS, s);
    },
  };
})();

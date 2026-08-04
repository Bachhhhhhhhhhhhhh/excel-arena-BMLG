/**
 * localStorage helpers — tiến độ ván + danh sách deck đã upload
 */
const Storage = (() => {
  const KEYS = {
    DECKS: "efg_decks_v1",
    PROGRESS: "efg_progress_v1",
    LEADERBOARD: "efg_lb_v1",
    SETTINGS: "efg_settings_v1",
  };

  function read(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  }

  function write(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  return {
    KEYS,

    getDecks() {
      return read(KEYS.DECKS, []);
    },

    saveDeck(deck) {
      const decks = this.getDecks().filter((d) => d.id !== deck.id);
      decks.unshift(deck);
      write(KEYS.DECKS, decks.slice(0, 30));
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

    saveProgress(sessionId, progress) {
      const all = read(KEYS.PROGRESS, {});
      all[sessionId] = progress;
      write(KEYS.PROGRESS, all);
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
      lb.sort((a, b) => b.score - a.score || a.timeMs - b.timeMs);
      write(KEYS.LEADERBOARD, lb.slice(0, 50));
      return lb.slice(0, 50);
    },

    getSettings() {
      return read(KEYS.SETTINGS, { playerName: "Player 1", mode: "practice" });
    },

    saveSettings(s) {
      write(KEYS.SETTINGS, s);
    },
  };
})();

"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  AnswerRecord,
  Badge,
  FunctionCategory,
  GameMode,
  GoogleSheetsConfig,
  LeaderboardEntry,
  Question,
} from "@/types";
import {
  getDailyQuestions,
  getQuestionsByCategory,
  getQuestionsByDifficulty,
  getRandomQuestions,
} from "@/data/questions";
import { checkFormulaAnswer, pointsForDifficulty } from "@/lib/formula-check";
import { BADGE_DEFS, evaluateBadges } from "@/lib/badges";
import { appendToGoogleSheets } from "@/lib/google-sheets";
import { todayKey, uid } from "@/lib/utils";

interface GameState {
  playerName: string;
  setPlayerName: (name: string) => void;

  mode: GameMode | null;
  categoryFilter: FunctionCategory | "all";
  status: "idle" | "playing" | "feedback" | "finished";
  score: number;
  combo: number;
  maxCombo: number;
  lives: number;
  timeLeft: number;
  currentQuestion: Question | null;
  queue: Question[];
  questionIndex: number;
  lastResult: {
    isCorrect: boolean;
    userAnswer: string;
    pointsEarned: number;
  } | null;
  sessionCorrect: number;
  sessionTotal: number;
  _hasHydrated: boolean;
  setHasHydrated: (v: boolean) => void;

  history: AnswerRecord[];
  leaderboard: LeaderboardEntry[];
  badges: Badge[];
  sheets: GoogleSheetsConfig;

  startPractice: (category: FunctionCategory | "all") => void;
  startChallenge: () => void;
  startBoss: () => void;
  startDaily: () => void;
  submitAnswer: (answer: string) => Promise<void>;
  nextQuestion: () => void;
  tick: () => void;
  endSession: () => void;
  resetGame: () => void;
  setSheetsConfig: (cfg: Partial<GoogleSheetsConfig>) => void;
  clearHistory: () => void;
}

function pickQueue(
  mode: GameMode,
  category: FunctionCategory | "all"
): Question[] {
  if (mode === "daily") return getDailyQuestions(todayKey(), 10);
  if (mode === "boss") {
    const hard = getQuestionsByDifficulty("hard");
    const medium = getQuestionsByDifficulty("medium");
    const mixed = [...hard, ...medium].sort(() => Math.random() - 0.5);
    if (mixed.length >= 8) return mixed.slice(0, 12);
    return getRandomQuestions(12);
  }
  if (mode === "challenge") return getRandomQuestions(80);
  if (category === "all") return getRandomQuestions(50);
  const catQs = getQuestionsByCategory(category);
  if (catQs.length === 0) return getRandomQuestions(20);
  return [...catQs].sort(() => Math.random() - 0.5);
}

function mergeBadges(stored: Badge[] | undefined): Badge[] {
  const unlockedMap = new Map(
    (stored || []).filter((b) => b.unlockedAt).map((b) => [b.id, b.unlockedAt!])
  );
  return BADGE_DEFS.map((def) => ({
    ...def,
    unlockedAt: unlockedMap.get(def.id),
  }));
}

function startSession(
  set: (p: Partial<GameState>) => void,
  mode: GameMode,
  category: FunctionCategory | "all",
  extras: Partial<GameState>
) {
  const queue = pickQueue(mode, category);
  set({
    mode,
    categoryFilter: category,
    status: queue.length ? "playing" : "finished",
    score: 0,
    combo: 0,
    maxCombo: 0,
    queue,
    questionIndex: 0,
    currentQuestion: queue[0] ?? null,
    lastResult: null,
    sessionCorrect: 0,
    sessionTotal: 0,
    ...extras,
  });
}

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      playerName: "Chiến binh",
      setPlayerName: (name) => set({ playerName: name.trim() || "Chiến binh" }),

      mode: null,
      categoryFilter: "all",
      status: "idle",
      score: 0,
      combo: 0,
      maxCombo: 0,
      lives: 3,
      timeLeft: 60,
      currentQuestion: null,
      queue: [],
      questionIndex: 0,
      lastResult: null,
      sessionCorrect: 0,
      sessionTotal: 0,
      _hasHydrated: false,
      setHasHydrated: (v) => set({ _hasHydrated: v }),

      history: [],
      leaderboard: [],
      badges: BADGE_DEFS.map((b) => ({ ...b })),
      sheets: { webAppUrl: "", enabled: false },

      startPractice: (category) =>
        startSession(set, "practice", category, { lives: 999, timeLeft: 0 }),

      startChallenge: () =>
        startSession(set, "challenge", "all", { lives: 999, timeLeft: 60 }),

      startBoss: () =>
        startSession(set, "boss", "all", { lives: 3, timeLeft: 0 }),

      startDaily: () =>
        startSession(set, "daily", "all", { lives: 999, timeLeft: 0 }),

      submitAnswer: async (answer) => {
        const state = get();
        const q = state.currentQuestion;
        if (!q || state.status !== "playing") return;

        const isCorrect = checkFormulaAnswer(
          answer,
          q.correctAnswer,
          q.acceptedAnswers
        );
        const newCombo = isCorrect ? state.combo + 1 : 0;
        const maxCombo = Math.max(state.maxCombo, newCombo);
        const pointsEarned = isCorrect
          ? pointsForDifficulty(q.difficulty, newCombo, q.points)
          : 0;
        const newScore = state.score + pointsEarned;
        const newLives =
          state.mode === "boss" && !isCorrect
            ? Math.max(0, state.lives - 1)
            : state.lives;

        const record: AnswerRecord = {
          questionId: q.id,
          functionName: q.functionName,
          category: q.category,
          difficulty: q.difficulty,
          userAnswer: answer,
          correctAnswer: q.correctAnswer,
          isCorrect,
          pointsEarned,
          combo: newCombo,
          mode: state.mode ?? "practice",
          answeredAt: new Date().toISOString(),
        };

        const history = [...state.history, record].slice(-500);
        const badgeIds = evaluateBadges(
          history,
          newScore,
          maxCombo,
          state.mode ?? undefined
        );
        const badges = state.badges.map((b) =>
          badgeIds.includes(b.id) && !b.unlockedAt
            ? { ...b, unlockedAt: new Date().toISOString() }
            : b
        );

        // Always show feedback first (including boss last life)
        set({
          score: newScore,
          combo: newCombo,
          maxCombo,
          lives: newLives,
          lastResult: { isCorrect, userAnswer: answer, pointsEarned },
          status: "feedback",
          history,
          badges,
          sessionCorrect: state.sessionCorrect + (isCorrect ? 1 : 0),
          sessionTotal: state.sessionTotal + 1,
        });

        const { sheets, playerName } = get();
        if (sheets.enabled && sheets.webAppUrl) {
          try {
            const res = await appendToGoogleSheets(sheets.webAppUrl, {
              playerName,
              record,
            });
            set({
              sheets: {
                ...get().sheets,
                lastSyncAt: res.ok
                  ? new Date().toISOString()
                  : get().sheets.lastSyncAt,
                lastError: res.ok ? undefined : res.error,
              },
            });
          } catch {
            set({
              sheets: {
                ...get().sheets,
                lastError: "Không gửi được tới Google Sheets",
              },
            });
          }
        }
      },

      nextQuestion: () => {
        const state = get();
        if (state.status === "finished") return;

        if (state.mode === "boss" && state.lives <= 0) {
          get().endSession();
          return;
        }

        if (state.mode === "challenge" && state.timeLeft <= 0) {
          get().endSession();
          return;
        }

        const nextIndex = state.questionIndex + 1;
        let nextQueue = state.queue;

        if (state.mode === "daily" || state.mode === "boss") {
          if (nextIndex >= nextQueue.length) {
            get().endSession();
            return;
          }
        }

        if (state.mode === "challenge" && nextIndex >= nextQueue.length - 5) {
          nextQueue = [...nextQueue, ...getRandomQuestions(40)];
        }
        if (state.mode === "practice" && nextIndex >= nextQueue.length) {
          nextQueue = [
            ...nextQueue,
            ...pickQueue("practice", state.categoryFilter),
          ];
        }

        const q = nextQueue[nextIndex] ?? null;
        if (!q) {
          get().endSession();
          return;
        }

        set({
          queue: nextQueue,
          questionIndex: nextIndex,
          currentQuestion: q,
          status: "playing",
          lastResult: null,
        });
      },

      tick: () => {
        const state = get();
        if (state.mode !== "challenge" || state.status === "finished") return;
        if (state.status !== "playing" && state.status !== "feedback") return;
        const t = state.timeLeft - 1;
        if (t <= 0) {
          set({ timeLeft: 0 });
          // end immediately when time runs out
          get().endSession();
        } else {
          set({ timeLeft: t });
        }
      },

      endSession: () => {
        const state = get();
        if (state.status === "finished") return;

        // only write leaderboard if player actually answered something
        let leaderboard = state.leaderboard;
        if (state.sessionTotal > 0 && state.mode) {
          const entry: LeaderboardEntry = {
            id: uid("lb"),
            playerName: state.playerName,
            score: state.score,
            mode: state.mode,
            correctCount: state.sessionCorrect,
            maxCombo: state.maxCombo,
            date: new Date().toISOString(),
          };
          leaderboard = [...state.leaderboard, entry]
            .sort((a, b) => b.score - a.score)
            .slice(0, 50);
        }

        const badgeIds = evaluateBadges(
          state.history,
          state.score,
          state.maxCombo,
          state.mode ?? undefined
        );
        const badges = state.badges.map((b) =>
          badgeIds.includes(b.id) && !b.unlockedAt
            ? { ...b, unlockedAt: new Date().toISOString() }
            : b
        );

        set({
          status: "finished",
          leaderboard,
          badges,
          currentQuestion: null,
          timeLeft: state.mode === "challenge" ? 0 : state.timeLeft,
        });
      },

      resetGame: () =>
        set({
          mode: null,
          status: "idle",
          score: 0,
          combo: 0,
          maxCombo: 0,
          lives: 3,
          timeLeft: 60,
          currentQuestion: null,
          queue: [],
          questionIndex: 0,
          lastResult: null,
          sessionCorrect: 0,
          sessionTotal: 0,
        }),

      setSheetsConfig: (cfg) =>
        set({ sheets: { ...get().sheets, ...cfg } }),

      clearHistory: () => set({ history: [], leaderboard: [] }),
    }),
    {
      name: "excel-arena-storage-v2",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        playerName: s.playerName,
        history: s.history,
        leaderboard: s.leaderboard,
        badges: s.badges,
        sheets: s.sheets,
      }),
      merge: (persisted, current) => {
        const p = (persisted || {}) as Partial<GameState>;
        return {
          ...current,
          ...p,
          badges: mergeBadges(p.badges),
          history: Array.isArray(p.history) ? p.history : [],
          leaderboard: Array.isArray(p.leaderboard) ? p.leaderboard : [],
          sheets: {
            webAppUrl: "",
            enabled: false,
            ...(p.sheets || {}),
          },
          // never restore mid-game session from storage
          status: "idle" as const,
          mode: null,
          currentQuestion: null,
          queue: [],
          lastResult: null,
        };
      },
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);

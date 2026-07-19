"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
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

  history: AnswerRecord[];
  leaderboard: LeaderboardEntry[];
  badges: Badge[];
  sheets: GoogleSheetsConfig;

  // actions
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
    return getRandomQuestions(12, {}).length
      ? [...hard, ...medium].sort(() => Math.random() - 0.5).slice(0, 12)
      : getRandomQuestions(12);
  }
  if (mode === "challenge") return getRandomQuestions(200);
  // practice
  if (category === "all") return getRandomQuestions(50);
  const catQs = getQuestionsByCategory(category);
  return catQs.sort(() => Math.random() - 0.5);
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
      history: [],
      leaderboard: [],
      badges: BADGE_DEFS.map((b) => ({ ...b })),
      sheets: { webAppUrl: "", enabled: false },

      startPractice: (category) => {
        const queue = pickQueue("practice", category);
        set({
          mode: "practice",
          categoryFilter: category,
          status: "playing",
          score: 0,
          combo: 0,
          maxCombo: 0,
          lives: 999,
          timeLeft: 0,
          queue,
          questionIndex: 0,
          currentQuestion: queue[0] ?? null,
          lastResult: null,
          sessionCorrect: 0,
          sessionTotal: 0,
        });
      },

      startChallenge: () => {
        const queue = pickQueue("challenge", "all");
        set({
          mode: "challenge",
          categoryFilter: "all",
          status: "playing",
          score: 0,
          combo: 0,
          maxCombo: 0,
          lives: 999,
          timeLeft: 60,
          queue,
          questionIndex: 0,
          currentQuestion: queue[0] ?? null,
          lastResult: null,
          sessionCorrect: 0,
          sessionTotal: 0,
        });
      },

      startBoss: () => {
        const queue = pickQueue("boss", "all");
        set({
          mode: "boss",
          categoryFilter: "all",
          status: "playing",
          score: 0,
          combo: 0,
          maxCombo: 0,
          lives: 3,
          timeLeft: 0,
          queue,
          questionIndex: 0,
          currentQuestion: queue[0] ?? null,
          lastResult: null,
          sessionCorrect: 0,
          sessionTotal: 0,
        });
      },

      startDaily: () => {
        const queue = pickQueue("daily", "all");
        set({
          mode: "daily",
          categoryFilter: "all",
          status: "playing",
          score: 0,
          combo: 0,
          maxCombo: 0,
          lives: 999,
          timeLeft: 0,
          queue,
          questionIndex: 0,
          currentQuestion: queue[0] ?? null,
          lastResult: null,
          sessionCorrect: 0,
          sessionTotal: 0,
        });
      },

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
            ? state.lives - 1
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
          mode: state.mode!,
          answeredAt: new Date().toISOString(),
        };

        const history = [...state.history, record];
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

        // Google Sheets sync
        const { sheets, playerName } = get();
        if (sheets.enabled && sheets.webAppUrl) {
          const res = await appendToGoogleSheets(sheets.webAppUrl, {
            playerName,
            record,
          });
          set({
            sheets: {
              ...get().sheets,
              lastSyncAt: res.ok ? new Date().toISOString() : get().sheets.lastSyncAt,
              lastError: res.ok ? undefined : res.error,
            },
          });
        }

        // Boss death
        if (get().mode === "boss" && get().lives <= 0) {
          get().endSession();
        }
      },

      nextQuestion: () => {
        const state = get();
        if (state.status === "finished") return;

        // Boss: wrong answer already handled lives
        const nextIndex = state.questionIndex + 1;
        const queue = state.queue;

        // Daily / boss finite; practice loops; challenge uses timer
        if (state.mode === "daily" || state.mode === "boss") {
          if (nextIndex >= queue.length || (state.mode === "boss" && state.lives <= 0)) {
            get().endSession();
            return;
          }
        }

        if (state.mode === "challenge" && state.timeLeft <= 0) {
          get().endSession();
          return;
        }

        // Refill challenge queue if needed
        let nextQueue = queue;
        if (state.mode === "challenge" && nextIndex >= queue.length - 5) {
          nextQueue = [...queue, ...getRandomQuestions(50)];
        }
        if (state.mode === "practice" && nextIndex >= queue.length) {
          nextQueue = [
            ...queue,
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
          get().endSession();
        } else {
          set({ timeLeft: t });
        }
      },

      endSession: () => {
        const state = get();
        if (state.status === "finished") return;

        const entry: LeaderboardEntry = {
          id: uid("lb"),
          playerName: state.playerName,
          score: state.score,
          mode: state.mode ?? "practice",
          correctCount: state.sessionCorrect,
          maxCombo: state.maxCombo,
          date: new Date().toISOString(),
        };

        const leaderboard = [...state.leaderboard, entry]
          .sort((a, b) => b.score - a.score)
          .slice(0, 50);

        // final badge pass
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
      name: "excel-arena-storage",
      partialize: (s) => ({
        playerName: s.playerName,
        history: s.history,
        leaderboard: s.leaderboard,
        badges: s.badges,
        sheets: s.sheets,
      }),
    }
  )
);

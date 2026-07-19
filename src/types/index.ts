export type Difficulty = "easy" | "medium" | "hard";
export type FunctionCategory =
  | "math"
  | "logical"
  | "text"
  | "datetime"
  | "lookup"
  | "statistical"
  | "financial"
  | "information"
  | "dynamic";

export type GameMode = "practice" | "challenge" | "boss" | "daily";

export interface ExcelFunction {
  name: string;
  category: FunctionCategory;
  description: string;
  syntax: string;
  example: string;
}

export interface SampleCell {
  value: string | number | null;
}

export interface SampleTable {
  headers?: string[];
  rows: (string | number | null)[][];
  /** Excel-style labels for context, e.g. "A1:B5" */
  rangeLabel?: string;
}

export interface Question {
  id: string;
  functionName: string;
  category: FunctionCategory;
  difficulty: Difficulty;
  title: string;
  prompt: string;
  sampleData: SampleTable;
  /** Canonical formula answer */
  correctAnswer: string;
  /** Alternative accepted formulas (normalized comparison) */
  acceptedAnswers?: string[];
  explanation: string;
  points: number;
}

export interface AnswerRecord {
  questionId: string;
  functionName: string;
  category: FunctionCategory;
  difficulty: Difficulty;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  pointsEarned: number;
  combo: number;
  mode: GameMode;
  answeredAt: string;
  timeSpentMs?: number;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt?: string;
}

export interface LeaderboardEntry {
  id: string;
  playerName: string;
  score: number;
  mode: GameMode;
  correctCount: number;
  maxCombo: number;
  date: string;
}

export interface GoogleSheetsConfig {
  webAppUrl: string;
  enabled: boolean;
  lastSyncAt?: string;
  lastError?: string;
}

export const CATEGORY_LABELS: Record<FunctionCategory, string> = {
  math: "Math & Trigonometry",
  logical: "Logical",
  text: "Text",
  datetime: "Date & Time",
  lookup: "Lookup & Reference",
  statistical: "Statistical",
  financial: "Financial",
  information: "Information & Other",
  dynamic: "Dynamic Array & LAMBDA",
};

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: "Dễ",
  medium: "Trung bình",
  hard: "Khó",
};

export const MODE_LABELS: Record<GameMode, string> = {
  practice: "Luyện tập tự do",
  challenge: "Challenge 60 giây",
  boss: "Boss Fight",
  daily: "Daily Challenge",
};

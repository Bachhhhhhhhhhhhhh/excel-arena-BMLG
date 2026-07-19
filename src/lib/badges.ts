import type { AnswerRecord, Badge } from "@/types";

export const BADGE_DEFS: Omit<Badge, "unlockedAt">[] = [
  {
    id: "first_blood",
    name: "First Blood",
    description: "Trả lời đúng câu đầu tiên",
    icon: "🩸",
  },
  {
    id: "combo_5",
    name: "Combo x5",
    description: "Đạt combo 5 liên tiếp",
    icon: "🔥",
  },
  {
    id: "combo_10",
    name: "Combo Master",
    description: "Đạt combo 10 liên tiếp",
    icon: "⚡",
  },
  {
    id: "score_500",
    name: "Chiến binh 500",
    description: "Tổng điểm một ván ≥ 500",
    icon: "⭐",
  },
  {
    id: "score_1000",
    name: "Huyền thoại 1000",
    description: "Tổng điểm một ván ≥ 1000",
    icon: "🏆",
  },
  {
    id: "math_master",
    name: "Math Master",
    description: "Đúng ≥ 10 câu nhóm Math",
    icon: "🧮",
  },
  {
    id: "lookup_ninja",
    name: "Lookup Ninja",
    description: "Đúng ≥ 5 câu Lookup",
    icon: "🔍",
  },
  {
    id: "boss_slayer",
    name: "Boss Slayer",
    description: "Hoàn thành Boss Fight với ≥ 3 câu đúng",
    icon: "🐉",
  },
  {
    id: "speed_demon",
    name: "Speed Demon",
    description: "Challenge 60s: ≥ 8 câu đúng",
    icon: "💨",
  },
  {
    id: "daily_hero",
    name: "Daily Hero",
    description: "Hoàn thành Daily Challenge",
    icon: "📅",
  },
  {
    id: "perfect_10",
    name: "Perfect 10",
    description: "10 câu đúng liên tiếp trong lịch sử",
    icon: "💯",
  },
  {
    id: "explorer",
    name: "Function Explorer",
    description: "Chạm ≥ 20 hàm khác nhau",
    icon: "🗺️",
  },
];

export function evaluateBadges(
  history: AnswerRecord[],
  currentScore: number,
  maxCombo: number,
  mode?: string
): string[] {
  const unlocked: string[] = [];
  const correct = history.filter((h) => h.isCorrect);

  if (correct.length >= 1) unlocked.push("first_blood");
  if (maxCombo >= 5) unlocked.push("combo_5");
  if (maxCombo >= 10) unlocked.push("combo_10");
  if (currentScore >= 500) unlocked.push("score_500");
  if (currentScore >= 1000) unlocked.push("score_1000");

  if (correct.filter((h) => h.category === "math").length >= 10)
    unlocked.push("math_master");
  if (correct.filter((h) => h.category === "lookup").length >= 5)
    unlocked.push("lookup_ninja");

  if (mode === "boss" && correct.filter((h) => h.mode === "boss").length >= 3)
    unlocked.push("boss_slayer");
  if (
    mode === "challenge" &&
    correct.filter((h) => h.mode === "challenge").length >= 8
  )
    unlocked.push("speed_demon");
  if (mode === "daily" && history.some((h) => h.mode === "daily"))
    unlocked.push("daily_hero");

  // streak of 10 correct anywhere in history order
  let streak = 0;
  let best = 0;
  for (const h of history) {
    if (h.isCorrect) {
      streak++;
      best = Math.max(best, streak);
    } else streak = 0;
  }
  if (best >= 10) unlocked.push("perfect_10");

  const uniqueFns = new Set(correct.map((h) => h.functionName));
  if (uniqueFns.size >= 20) unlocked.push("explorer");

  return unlocked;
}

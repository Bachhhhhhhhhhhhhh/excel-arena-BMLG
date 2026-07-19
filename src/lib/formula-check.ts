/**
 * Normalize Excel formula for loose comparison:
 * - trim, uppercase function names area, remove spaces around operators
 * - unify quotes and separators
 */
export function normalizeFormula(input: string): string {
  let s = input.trim();
  if (!s) return "";
  // Allow answers with or without leading =
  if (s.startsWith("=")) s = s.slice(1);
  s = s.trim();

  // Collapse whitespace
  s = s.replace(/\s+/g, " ");

  // Remove spaces around common formula tokens
  s = s
    .replace(/\s*([(),;:+\-*/^=<>&])\s*/g, "$1")
    .replace(/\s+/g, "");

  // Unify double quotes
  s = s.replace(/[“”]/g, '"').replace(/[‘’]/g, "'");

  // Uppercase (Excel formulas are case-insensitive)
  s = s.toUpperCase();

  // Vietnamese locale may use ; as arg separator — also accept ,
  // Compare both variants later via alternatives
  return s;
}

/** Build separator variants (comma vs semicolon) */
function separatorVariants(normalized: string): string[] {
  const variants = new Set<string>();
  variants.add(normalized);
  variants.add(normalized.replace(/,/g, ";"));
  variants.add(normalized.replace(/;/g, ","));
  return Array.from(variants);
}

export function checkFormulaAnswer(
  userAnswer: string,
  correctAnswer: string,
  acceptedAnswers: string[] = []
): boolean {
  const userNorm = normalizeFormula(userAnswer);
  if (!userNorm) return false;

  const candidates = [correctAnswer, ...acceptedAnswers].flatMap((a) =>
    separatorVariants(normalizeFormula(a))
  );

  const userVariants = separatorVariants(userNorm);

  return userVariants.some((u) => candidates.includes(u));
}

export function pointsForDifficulty(
  difficulty: "easy" | "medium" | "hard",
  combo: number,
  basePoints: number
): number {
  const comboBonus = Math.min(combo, 10) * 2;
  const mult = difficulty === "hard" ? 1.5 : difficulty === "medium" ? 1.2 : 1;
  return Math.round((basePoints + comboBonus) * mult);
}

/**
 * Normalize Excel formula for loose comparison.
 */
export function normalizeFormula(input: string): string {
  let s = input.trim();
  if (!s) return "";

  // strip all leading = and fullwidth ＝
  s = s.replace(/^[=\uFF1D]+/, "").trim();

  // smart quotes → ascii
  s = s
    .replace(/[\u201C\u201D\u201E\u201F\u2033\u2036]/g, '"')
    .replace(/[\u2018\u2019\u201A\u201B\u2032\u2035]/g, "'");

  // fullwidth punctuation → ascii
  s = s
    .replace(/\uFF08/g, "(")
    .replace(/\uFF09/g, ")")
    .replace(/\uFF0C/g, ",")
    .replace(/\uFF1B/g, ";")
    .replace(/\uFF1A/g, ":")
    .replace(/\u3000/g, " ")
    .replace(/\uFF0E/g, ".");

  // collapse whitespace then remove spaces around tokens
  s = s.replace(/\s+/g, " ");
  s = s.replace(/\s*([(),;:+\-*/^=<>&])\s*/g, "$1");
  s = s.replace(/\s+/g, "");

  // case-insensitive
  s = s.toUpperCase();

  return s;
}

function separatorVariants(normalized: string): string[] {
  const variants = new Set<string>();
  variants.add(normalized);
  variants.add(normalized.replace(/,/g, ";"));
  variants.add(normalized.replace(/;/g, ","));
  // also strip outer quotes differences already handled
  return Array.from(variants);
}

/** Optional: ignore sheet! prefixes and $ absolute refs for looser match */
function stripAbsoluteNoise(s: string): string {
  return s
    .replace(/\$([A-Z]+)/g, "$1")
    .replace(/\$(\d+)/g, "$1");
}

export function checkFormulaAnswer(
  userAnswer: string,
  correctAnswer: string,
  acceptedAnswers: string[] = []
): boolean {
  const userNorm = normalizeFormula(userAnswer);
  if (!userNorm) return false;

  const allCorrect = [correctAnswer, ...acceptedAnswers];
  const candidates = allCorrect.flatMap((a) => {
    const n = normalizeFormula(a);
    return [
      ...separatorVariants(n),
      ...separatorVariants(stripAbsoluteNoise(n)),
    ];
  });

  const userVariants = [
    ...separatorVariants(userNorm),
    ...separatorVariants(stripAbsoluteNoise(userNorm)),
  ];

  // exact match among variants
  if (userVariants.some((u) => candidates.includes(u))) return true;

  // allow user answer that ends with same formula body (e.g. extra spaces already stripped)
  return false;
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

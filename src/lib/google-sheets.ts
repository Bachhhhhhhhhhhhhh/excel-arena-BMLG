import type { AnswerRecord } from "@/types";
import { MODE_LABELS, DIFFICULTY_LABELS, CATEGORY_LABELS } from "@/types";

export interface SheetsPayload {
  playerName: string;
  record: AnswerRecord;
}

/**
 * POST tới Google Apps Script Web App.
 * Dùng mode no-cors vì Apps Script thường không trả CORS headers
 * (đặc biệt khi host trên GitHub Pages).
 */
export async function appendToGoogleSheets(
  webAppUrl: string,
  payload: SheetsPayload
): Promise<{ ok: boolean; error?: string }> {
  const url = webAppUrl.trim();
  if (!url) return { ok: false, error: "Chưa cấu hình Web App URL" };
  if (!/^https:\/\//i.test(url)) {
    return { ok: false, error: "URL phải bắt đầu bằng https://" };
  }

  const { record, playerName } = payload;
  const body = JSON.stringify({
    playerName,
    answeredAt: record.answeredAt,
    mode: MODE_LABELS[record.mode],
    functionName: record.functionName,
    category: CATEGORY_LABELS[record.category],
    difficulty: DIFFICULTY_LABELS[record.difficulty],
    userAnswer: record.userAnswer,
    correctAnswer: record.correctAnswer,
    isCorrect: record.isCorrect,
    pointsEarned: record.pointsEarned,
    combo: record.combo,
    questionId: record.questionId,
  });

  try {
    await fetch(url, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body,
    });
    // no-cors → opaque response, assume success if no throw
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Lỗi mạng khi sync Sheets",
    };
  }
}

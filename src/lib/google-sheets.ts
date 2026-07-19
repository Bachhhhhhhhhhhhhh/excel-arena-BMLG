import type { AnswerRecord } from "@/types";
import { MODE_LABELS, DIFFICULTY_LABELS, CATEGORY_LABELS } from "@/types";

export interface SheetsPayload {
  playerName: string;
  record: AnswerRecord;
}

/**
 * Gửi 1 dòng kết quả tới Google Apps Script Web App.
 * Web App cần được deploy "Anyone" + doPost append vào sheet.
 */
export async function appendToGoogleSheets(
  webAppUrl: string,
  payload: SheetsPayload
): Promise<{ ok: boolean; error?: string }> {
  if (!webAppUrl?.trim()) {
    return { ok: false, error: "Chưa cấu hình Web App URL" };
  }

  const { record, playerName } = payload;
  const body = {
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
  };

  try {
    // no-cors friendly: Apps Script often needs mode no-cors OR proper CORS headers
    const res = await fetch(webAppUrl, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(body),
      // redirect follow for Apps Script
      redirect: "follow",
    });

    // Apps Script may return opaque; treat network success as ok
    if (!res.ok && res.type !== "opaque") {
      const text = await res.text().catch(() => "");
      return { ok: false, error: text || `HTTP ${res.status}` };
    }
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Lỗi mạng khi sync Sheets",
    };
  }
}

import * as XLSX from "xlsx";
import type { AnswerRecord, LeaderboardEntry } from "@/types";
import { MODE_LABELS, DIFFICULTY_LABELS, CATEGORY_LABELS } from "@/types";

export function exportHistoryToExcel(
  history: AnswerRecord[],
  leaderboard: LeaderboardEntry[],
  playerName: string
) {
  if (typeof window === "undefined") return;

  const wb = XLSX.utils.book_new();

  const historyRows = history.map((h, i) => ({
    STT: i + 1,
    Thời_gian: h.answeredAt,
    Người_chơi: playerName,
    Chế_độ: MODE_LABELS[h.mode],
    Hàm: h.functionName,
    Nhóm: CATEGORY_LABELS[h.category],
    Độ_khó: DIFFICULTY_LABELS[h.difficulty],
    Câu_trả_lời: h.userAnswer,
    Đáp_án: h.correctAnswer,
    Đúng: h.isCorrect ? "Có" : "Không",
    Điểm: h.pointsEarned,
    Combo: h.combo,
    Question_ID: h.questionId,
  }));

  const wsHistory = XLSX.utils.json_to_sheet(
    historyRows.length
      ? historyRows
      : [{ Thông_báo: "Chưa có lịch sử chơi" }]
  );
  XLSX.utils.book_append_sheet(wb, wsHistory, "Lich_su_choi");

  const lbRows = leaderboard.map((e, i) => ({
    Hạng: i + 1,
    Người_chơi: e.playerName,
    Điểm: e.score,
    Chế_độ: MODE_LABELS[e.mode],
    Số_câu_đúng: e.correctCount,
    Max_combo: e.maxCombo,
    Ngày: e.date,
  }));
  const wsLb = XLSX.utils.json_to_sheet(
    lbRows.length ? lbRows : [{ Thông_báo: "Chưa có bảng xếp hạng" }]
  );
  XLSX.utils.book_append_sheet(wb, wsLb, "Bang_xep_hang");

  // Summary
  const correct = history.filter((h) => h.isCorrect).length;
  const total = history.length;
  const summary = [
    { Chỉ_số: "Người chơi", Giá_trị: playerName },
    { Chỉ_số: "Tổng câu đã trả lời", Giá_trị: total },
    { Chỉ_số: "Số câu đúng", Giá_trị: correct },
    {
      Chỉ_số: "Tỷ lệ đúng",
      Giá_trị: total ? `${Math.round((correct / total) * 100)}%` : "0%",
    },
    {
      Chỉ_số: "Tổng điểm tích lũy (history)",
      Giá_trị: history.reduce((s, h) => s + h.pointsEarned, 0),
    },
    { Chỉ_số: "Xuất lúc", Giá_trị: new Date().toISOString() },
  ];
  const wsSum = XLSX.utils.json_to_sheet(summary);
  XLSX.utils.book_append_sheet(wb, wsSum, "Tong_quan");

  const filename = `ExcelArena_${playerName.replace(/\s+/g, "_")}_${new Date()
    .toISOString()
    .slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, filename);
}

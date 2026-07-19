/**
 * Excel Arena – Google Apps Script Web App
 * ----------------------------------------
 * 1. Tạo Google Sheet mới
 * 2. Extensions → Apps Script → dán code này
 * 3. Deploy → New deployment → Web app
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 4. Copy URL .../exec → dán vào Settings của Excel Arena
 *
 * Mỗi POST sẽ append 1 dòng kết quả chơi.
 */

const SHEET_NAME = "ExcelArena";

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
      sheet.appendRow([
        "Timestamp",
        "Player",
        "Mode",
        "Function",
        "Category",
        "Difficulty",
        "UserAnswer",
        "CorrectAnswer",
        "IsCorrect",
        "Points",
        "Combo",
        "QuestionId",
      ]);
    }

    sheet.appendRow([
      data.answeredAt || new Date().toISOString(),
      data.playerName || "",
      data.mode || "",
      data.functionName || "",
      data.category || "",
      data.difficulty || "",
      data.userAnswer || "",
      data.correctAnswer || "",
      data.isCorrect === true || data.isCorrect === "true" ? "YES" : "NO",
      data.pointsEarned || 0,
      data.combo || 0,
      data.questionId || "",
    ]);

    return ContentService.createTextOutput(
      JSON.stringify({ ok: true })
    ).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(
      JSON.stringify({ ok: false, error: String(err) })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet() {
  return ContentService.createTextOutput(
    "Excel Arena Sheets bridge is running. Use POST."
  );
}

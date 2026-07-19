"use client";

import { useEffect, useState } from "react";
import { useGameStore } from "@/store/game-store";
import { exportHistoryToExcel } from "@/lib/excel-export";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ExportPanel() {
  const { history, leaderboard, playerName, sheets, setSheetsConfig } =
    useGameStore();
  const [url, setUrl] = useState(sheets.webAppUrl);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    setUrl(sheets.webAppUrl || "");
  }, [sheets.webAppUrl]);

  const handleExport = () => {
    try {
      if (!history.length) {
        setMsg("Chưa có lịch sử để xuất.");
        return;
      }
      exportHistoryToExcel(history, leaderboard, playerName);
      setMsg("Đã tải file Excel thành công ✨");
    } catch {
      setMsg("Xuất Excel thất bại. Thử lại trên trình duyệt khác.");
    }
  };

  const saveSheets = () => {
    setSheetsConfig({
      webAppUrl: url.trim(),
      enabled: !!url.trim(),
    });
    setMsg(
      url.trim()
        ? "Đã bật đồng bộ Google Sheets — mỗi lần trả lời sẽ append 1 dòng."
        : "Đã tắt đồng bộ Sheets."
    );
  };

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card className="overflow-hidden bg-gradient-to-br from-white to-[#E8F4FF]/40">
        <div className="h-1 bg-gradient-to-r from-[#A8D8FF] to-[#7DD3FC]" />
        <CardHeader>
          <CardTitle>Xuất Excel</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm font-medium text-[#4A6FA5]">
            Tải file{" "}
            <code className="rounded-lg bg-[#E8F4FF] px-1.5 py-0.5 text-[#5BB8FF]">
              .xlsx
            </code>{" "}
            gồm lịch sử, BXH & tổng quan. Hiện có{" "}
            <strong className="text-[#1E3A5F]">{history.length}</strong> bản ghi.
          </p>
          <Button
            onClick={handleExport}
            disabled={history.length === 0}
            variant="mint"
          >
            Xuất Excel
          </Button>
        </CardContent>
      </Card>

      <Card className="overflow-hidden bg-gradient-to-br from-white to-[#E0F2FE]/40">
        <div className="h-1 bg-gradient-to-r from-[#7EC8FF] to-[#5BB8FF]" />
        <CardHeader>
          <CardTitle>Google Sheets</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm font-medium text-[#4A6FA5]">
            Dán URL Web App Apps Script. Xem{" "}
            <code className="rounded-lg bg-[#E8F4FF] px-1 text-[11px] text-[#5BB8FF]">
              google-apps-script/Code.gs
            </code>
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              className="font-sans text-xs"
              placeholder="https://script.google.com/macros/s/.../exec"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
            <Button variant="sky" onClick={saveSheets} className="shrink-0">
              Lưu
            </Button>
          </div>
          <div className="text-xs font-semibold text-[#7EC8FF]">
            {sheets.enabled ? (
              <span className="text-[#0369A1]">● Đang bật sync</span>
            ) : (
              <span>● Tắt</span>
            )}
            {sheets.lastSyncAt && (
              <>
                {" "}
                · Lần cuối:{" "}
                {new Date(sheets.lastSyncAt).toLocaleString("vi-VN")}
              </>
            )}
            {sheets.lastError && (
              <span className="mt-1 block text-[#FCA5A5]">
                {sheets.lastError}
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {msg && (
        <p className="md:col-span-2 text-center text-sm font-bold text-[#5BB8FF]">
          {msg}
        </p>
      )}
    </div>
  );
}

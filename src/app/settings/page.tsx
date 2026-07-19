"use client";

import { useGameStore } from "@/store/game-store";
import { ExportPanel } from "@/components/export/ExportPanel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { TOTAL_FUNCTIONS } from "@/data/functions";
import { TOTAL_QUESTIONS } from "@/data/questions";
import { AnimeMascot } from "@/components/game/AnimeMascot";

export default function SettingsPage() {
  const playerName = useGameStore((s) => s.playerName);
  const setPlayerName = useGameStore((s) => s.setPlayerName);
  const clearHistory = useGameStore((s) => s.clearHistory);
  const history = useGameStore((s) => s.history);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-[#1E3A5F]">Cài đặt</h1>
          <p className="font-medium text-[#5BB8FF]">
            Hồ sơ · export · sync · dọn dẹp
          </p>
        </div>
        <AnimeMascot mood="think" size="sm" speech="Chỉnh gì cũng được nè~" />
      </div>

      <Card className="overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-[#A8D8FF] to-[#7EC8FF]" />
        <CardHeader>
          <CardTitle>Hồ sơ chiến binh</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <label className="text-xs font-bold uppercase tracking-wide text-[#5BB8FF]">
            Tên hiển thị
          </label>
          <Input
            className="max-w-sm font-sans font-semibold"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            maxLength={24}
          />
        </CardContent>
      </Card>

      <ExportPanel />

      <Card className="overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-[#FCA5A5] to-[#FECACA]" />
        <CardHeader>
          <CardTitle>Dữ liệu local</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm font-medium text-[#4A6FA5]">
            Lịch sử & xếp hạng trong{" "}
            <code className="rounded-lg bg-[#E8F4FF] px-1.5 text-[#5BB8FF]">
              localStorage
            </code>{" "}
            ({history.length} bản ghi).
          </p>
          <Button
            variant="danger"
            onClick={() => {
              if (
                confirm(
                  "Xóa toàn bộ lịch sử chơi và bảng xếp hạng? Không thể hoàn tác."
                )
              ) {
                clearHistory();
              }
            }}
          >
            Xóa lịch sử & xếp hạng
          </Button>
        </CardContent>
      </Card>

      <Card className="overflow-hidden bg-gradient-to-br from-white to-[#E8F4FF]/40">
        <div className="h-1 bg-gradient-to-r from-[#7EC8FF] to-[#5BB8FF]" />
        <CardHeader>
          <CardTitle>Thống kê thư viện</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            {[
              { n: TOTAL_FUNCTIONS, l: "Hàm" },
              { n: TOTAL_QUESTIONS, l: "Câu hỏi" },
              { n: 4, l: "Mode" },
            ].map((s) => (
              <div
                key={s.l}
                className="rounded-2xl border border-[#A8D8FF]/50 bg-white/80 p-3 text-center"
              >
                <div className="text-2xl font-extrabold text-[#5BB8FF]">
                  {s.n}
                </div>
                <div className="text-[10px] font-bold uppercase text-[#4A6FA5]">
                  {s.l}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

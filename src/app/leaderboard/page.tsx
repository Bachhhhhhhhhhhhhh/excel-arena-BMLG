"use client";

import { motion } from "framer-motion";
import { useGameStore } from "@/store/game-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MODE_LABELS } from "@/types";
import { formatNumber } from "@/lib/utils";
import { ExportPanel } from "@/components/export/ExportPanel";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AnimeMascot } from "@/components/game/AnimeMascot";

export default function LeaderboardPage() {
  const leaderboard = useGameStore((s) => s.leaderboard);
  const badges = useGameStore((s) => s.badges);
  const history = useGameStore((s) => s.history);
  const unlocked = badges.filter((b) => b.unlockedAt);
  const podium = ["1", "2", "3"];

  return (
    <div className="space-y-8">
      <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-[#1E3A5F]">
            Bảng xếp hạng & Huy hiệu
          </h1>
          <p className="font-medium text-[#5BB8FF]">
            Lưu local · Export Excel · Sync Sheets
          </p>
        </div>
        <AnimeMascot
          mood={leaderboard.length ? "happy" : "idle"}
          size="sm"
          speech={
            leaderboard.length
              ? "Xem thành tích của bạn nè!"
              : "Chơi một ván để lên bảng nhé~"
          }
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-[#A8D8FF] via-[#7EC8FF] to-[#5BB8FF]" />
          <CardHeader>
            <CardTitle>Top điểm (local)</CardTitle>
          </CardHeader>
          <CardContent>
            {leaderboard.length === 0 ? (
              <div className="py-8 text-center">
                <p className="font-semibold text-[#4A6FA5]">
                  Chưa có trận nào
                </p>
                <Link href="/play" className="mt-4 inline-block">
                  <Button>Đi chơi ngay</Button>
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#A8D8FF]/40 text-left text-[10px] font-bold uppercase tracking-wider text-[#7EC8FF]">
                      <th className="pb-2 pr-2">#</th>
                      <th className="pb-2 pr-2">Người chơi</th>
                      <th className="pb-2 pr-2">Điểm</th>
                      <th className="pb-2 pr-2">Mode</th>
                      <th className="pb-2 pr-2">Đúng</th>
                      <th className="pb-2">Combo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboard.map((e, i) => (
                      <motion.tr
                        key={e.id}
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.04 }}
                        className={`border-b border-[#E8F4FF] last:border-0 ${
                          i < 3 ? "bg-[#E8F4FF]/40" : ""
                        }`}
                      >
                        <td className="py-3 pr-2 font-bold text-[#5BB8FF]">
                          {i < 3 ? podium[i] : i + 1}
                        </td>
                        <td className="py-3 pr-2 font-bold text-[#1E3A5F]">
                          {e.playerName}
                        </td>
                        <td className="py-3 pr-2 font-extrabold text-[#5BB8FF]">
                          {formatNumber(e.score)}
                        </td>
                        <td className="py-3 pr-2">
                          <Badge className="bg-[#E8F4FF] text-[#4A6FA5] ring-1 ring-[#A8D8FF]/50">
                            {MODE_LABELS[e.mode]}
                          </Badge>
                        </td>
                        <td className="py-3 pr-2 font-semibold text-[#0369A1]">
                          {e.correctCount}
                        </td>
                        <td className="py-3 font-semibold text-[#5BB8FF]">
                          x{e.maxCombo}
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <p className="mt-4 text-center text-xs font-medium text-[#7EC8FF]">
              {history.length} lượt trả lời đã lưu
            </p>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-[#7EC8FF] to-[#A8D8FF]" />
          <CardHeader>
            <CardTitle>
              Huy hiệu ({unlocked.length}/{badges.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-2">
            {badges.map((b, i) => (
              <motion.div
                key={b.id}
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.03 }}
                className={`rounded-2xl p-3 text-center transition ${
                  b.unlockedAt
                    ? "border border-[#A8D8FF] bg-gradient-to-br from-[#E8F4FF] to-white shadow-ice"
                    : "border border-[#E8F4FF] bg-[#F0F9FF]/50 opacity-45 grayscale"
                }`}
                title={b.description}
              >
                <div className="text-2xl">{b.icon}</div>
                <div className="mt-1 text-[11px] font-bold text-[#1E3A5F]/80">
                  {b.name}
                </div>
              </motion.div>
            ))}
          </CardContent>
        </Card>
      </div>

      <ExportPanel />
    </div>
  );
}

"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useGameStore } from "@/store/game-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { FunctionCategory } from "@/types";
import { CATEGORY_LABELS } from "@/types";
import { AnimeMascot } from "./AnimeMascot";

const CATEGORIES: (FunctionCategory | "all")[] = [
  "all",
  "math",
  "logical",
  "text",
  "datetime",
  "lookup",
  "statistical",
  "financial",
  "information",
  "dynamic",
];

const modes = [
  {
    id: "practice" as const,
    title: "Luyện tập tự do",
    desc: "Chọn nhóm hàm, luyện thoải mái trong không gian yên ắng.",
    badge: "Chill",
    action: "practice",
    btn: "default" as const,
  },
  {
    id: "challenge" as const,
    title: "Challenge 60 giây",
    desc: "Tốc độ và sự tập trung — random liên tục trong 60s.",
    badge: "Speed",
    action: "challenge",
    btn: "sky" as const,
  },
  {
    id: "boss" as const,
    title: "Boss Fight",
    desc: "Câu khó hơn, 3 mạng. Combo cao = hào quang lấp lánh.",
    badge: "Epic",
    action: "boss",
    btn: "purple" as const,
  },
  {
    id: "daily" as const,
    title: "Daily Challenge",
    desc: "10 câu cố định theo ngày — cùng đề với mọi người.",
    badge: "Daily",
    action: "daily",
    btn: "mint" as const,
  },
];

export function ModeSelector() {
  const {
    playerName,
    setPlayerName,
    startPractice,
    startChallenge,
    startBoss,
    startDaily,
  } = useGameStore();
  const [category, setCategory] = useState<FunctionCategory | "all">("all");
  const [showCats, setShowCats] = useState(false);

  const launch = (action: string) => {
    if (action === "practice") {
      if (!showCats) {
        setShowCats(true);
        return;
      }
      startPractice(category);
    } else if (action === "challenge") startChallenge();
    else if (action === "boss") startBoss();
    else if (action === "daily") startDaily();
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-end sm:justify-between">
        <AnimeMascot
          mood="idle"
          size="md"
          speech={`Chào ${playerName || "bạn"}! Chọn mode nhé~`}
        />
        <Card className="w-full sm:max-w-sm">
          <CardContent className="space-y-2 p-5">
            <label className="text-xs font-bold uppercase tracking-wide text-[#5BB8FF]">
              Tên chiến binh
            </label>
            <Input
              className="font-sans font-semibold"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Tên của bạn"
              maxLength={24}
            />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {modes.map((m, i) => (
          <motion.div
            key={m.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            whileHover={{ y: -3 }}
          >
            <Card className="h-full bg-gradient-to-br from-white/90 to-[#E8F4FF]/50">
              <CardContent className="flex h-full flex-col gap-3 p-5 sm:p-6">
                <div className="flex items-start justify-between">
                  <h3 className="text-lg font-bold text-[#1E3A5F]">{m.title}</h3>
                  <span className="rounded-full bg-[#E8F4FF] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#5BB8FF] ring-1 ring-[#A8D8FF]/60">
                    {m.badge}
                  </span>
                </div>
                <p className="text-sm font-medium leading-relaxed text-[#4A6FA5]">
                  {m.desc}
                </p>

                {m.id === "practice" && showCats && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="flex flex-wrap gap-1.5"
                  >
                    {CATEGORIES.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setCategory(c)}
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold transition ${
                          category === c
                            ? "bg-gradient-to-r from-[#7EC8FF] to-[#5BB8FF] text-white shadow-ice"
                            : "bg-white text-[#4A6FA5] ring-1 ring-[#A8D8FF]/60 hover:bg-[#E8F4FF]"
                        }`}
                      >
                        {c === "all" ? "Tất cả" : CATEGORY_LABELS[c].split(" ")[0]}
                      </button>
                    ))}
                  </motion.div>
                )}

                <Button
                  className="mt-auto w-full"
                  variant={m.btn}
                  onClick={() => launch(m.action)}
                >
                  {m.id === "practice" && showCats
                    ? "Bắt đầu luyện"
                    : "Chọn chế độ"}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

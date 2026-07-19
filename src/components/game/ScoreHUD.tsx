"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { formatNumber } from "@/lib/utils";
import type { GameMode } from "@/types";
import { MODE_LABELS } from "@/types";

interface Props {
  score: number;
  combo: number;
  lives: number;
  timeLeft: number;
  mode: GameMode | null;
  sessionCorrect: number;
  sessionTotal: number;
}

function Chip({
  children,
  className,
  pulse,
}: {
  children: ReactNode;
  className: string;
  pulse?: boolean;
}) {
  return (
    <motion.div
      layout
      className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-bold border border-white/80 backdrop-blur-sm ${className} ${
        pulse ? "animate-soft-pulse" : ""
      }`}
    >
      {children}
    </motion.div>
  );
}

export function ScoreHUD({
  score,
  combo,
  lives,
  timeLeft,
  mode,
  sessionCorrect,
  sessionTotal,
}: Props) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {mode && (
        <Chip className="bg-[#E8F4FF]/90 text-[#1E3A5F]">
          <span className="text-[#5BB8FF]">◆</span>
          <span className="text-xs">{MODE_LABELS[mode]}</span>
        </Chip>
      )}
      <Chip className="bg-white/90 text-[#1E3A5F] shadow-ice">
        <span>⭐</span>
        <motion.span key={score} initial={{ scale: 1.25 }} animate={{ scale: 1 }}>
          {formatNumber(score)}
        </motion.span>
      </Chip>
      <Chip
        className={
          combo >= 3
            ? "bg-gradient-to-r from-[#A8D8FF] to-[#5BB8FF] text-white"
            : "bg-[#E8F4FF] text-[#4A6FA5]"
        }
        pulse={combo >= 5}
      >
        <span>✨</span>
        <motion.span key={combo} initial={{ scale: 1.3 }} animate={{ scale: 1 }}>
          x{combo}
        </motion.span>
      </Chip>
      <Chip className="bg-white/90 text-[#1E3A5F]">
        <span className="text-[#7DD3FC]">✓</span>
        {sessionCorrect}/{sessionTotal}
      </Chip>
      {mode === "challenge" && (
        <Chip
          className={
            timeLeft <= 10
              ? "bg-[#FCA5A5]/90 text-[#7F1D1D] animate-pulse"
              : "bg-[#E8F4FF] text-[#5BB8FF]"
          }
        >
          ⏱ {timeLeft}s
        </Chip>
      )}
      {mode === "boss" && (
        <Chip className="bg-white/90 text-[#FCA5A5]">
          {Array.from({ length: Math.max(lives, 0) }).map((_, i) => (
            <span key={i}>💙</span>
          ))}
          {lives <= 0 && <span className="text-xs text-[#4A6FA5]">Hết mạng</span>}
        </Chip>
      )}
    </div>
  );
}

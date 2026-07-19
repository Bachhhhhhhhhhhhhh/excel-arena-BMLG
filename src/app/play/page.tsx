"use client";

import { motion } from "framer-motion";
import { useGameStore } from "@/store/game-store";
import { ModeSelector } from "@/components/game/ModeSelector";
import { GameBoard } from "@/components/game/GameBoard";

export default function PlayPage() {
  const status = useGameStore((s) => s.status);

  return (
    <div className="space-y-6">
      {status === "idle" ? (
        <>
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h1 className="text-3xl font-extrabold text-[#1E3A5F] sm:text-4xl">
              Chọn chế độ chơi
            </h1>
            <p className="mt-2 font-medium text-[#5BB8FF]">
              Không gian êm đềm · thử thách vừa đủ · mascot luôn bên cạnh
            </p>
          </motion.div>
          <ModeSelector />
        </>
      ) : (
        <GameBoard />
      )}
    </div>
  );
}

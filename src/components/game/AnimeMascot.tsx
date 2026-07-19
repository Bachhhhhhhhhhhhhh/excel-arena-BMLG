"use client";

import { motion, AnimatePresence } from "framer-motion";
import { withBase } from "@/lib/base-path";

export type MascotMood = "idle" | "happy" | "sad" | "combo" | "think" | "boss";

const SRC: Record<MascotMood, string> = {
  idle: "/mascot/idle.jpg",
  happy: "/mascot/happy.jpg",
  sad: "/mascot/sad.jpg",
  combo: "/mascot/happy.jpg",
  think: "/mascot/think.jpg",
  boss: "/mascot/think.jpg",
};

const SPEECH: Record<MascotMood, string> = {
  idle: "Cùng luyện công thức nhé~",
  happy: "Giỏi lắm! Đúng rồi ✨",
  sad: "Không sao… thử lại nha",
  combo: "Combo tuyệt vời! 💫",
  think: "Hmm… hàm nào đây ta?",
  boss: "Boss Fight — cố lên nào!",
};

const SIZES = {
  sm: { box: "h-28 w-28 sm:h-32 sm:w-32" },
  md: { box: "h-44 w-44 sm:h-52 sm:w-52" },
  lg: { box: "h-56 w-56 sm:h-64 sm:w-64" },
};

interface Props {
  mood?: MascotMood;
  size?: "sm" | "md" | "lg";
  speech?: string;
  showBubble?: boolean;
  className?: string;
}

export function AnimeMascot({
  mood = "idle",
  size = "md",
  speech,
  showBubble = true,
  className = "",
}: Props) {
  const text = speech ?? SPEECH[mood];
  const s = SIZES[size];
  const imgSrc = withBase(SRC[mood]);
  const glow =
    mood === "happy" || mood === "combo" || mood === "boss"
      ? "shadow-[0_0_40px_rgba(91,184,255,0.55)]"
      : mood === "sad"
        ? "shadow-[0_0_24px_rgba(252,165,165,0.35)]"
        : "shadow-[0_0_28px_rgba(126,200,255,0.4)]";

  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      {showBubble && (
        <AnimatePresence mode="wait">
          <motion.div
            key={text}
            initial={{ opacity: 0, y: 6, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4 }}
            className="relative z-10 max-w-[230px] rounded-2xl border border-[#A8D8FF]/70 bg-white/90 px-3.5 py-2 text-center text-xs font-semibold text-[#1E3A5F] shadow-[0_4px_16px_rgba(168,216,255,0.3)] backdrop-blur"
          >
            {text}
            <span className="absolute -bottom-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 border-b border-r border-[#A8D8FF]/70 bg-white/90" />
          </motion.div>
        </AnimatePresence>
      )}

      <motion.div
        key={mood}
        initial={{ opacity: 0, scale: 0.88, y: 8 }}
        animate={{
          opacity: 1,
          scale: 1,
          y: mood === "combo" || mood === "happy" ? [0, -6, 0] : [0, -3, 0],
        }}
        transition={{
          type: "spring",
          stiffness: 260,
          damping: 18,
          y: {
            repeat: Infinity,
            duration: mood === "happy" || mood === "combo" ? 1.4 : 3,
          },
        }}
        className={`relative ${s.box}`}
      >
        <span
          className={`absolute inset-2 rounded-full bg-[#A8D8FF]/35 blur-2xl ${
            mood === "combo" ? "animate-soft-pulse" : ""
          }`}
        />
        <div
          className={`relative h-full w-full overflow-hidden rounded-full border-[3px] border-white ${glow} ring-2 ring-[#A8D8FF]/60`}
        >
          {/* plain <img> avoids next/image preload path bugs with basePath on GH Pages */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imgSrc}
            alt="Mascot Excel Arena"
            width={256}
            height={256}
            className="h-full w-full object-cover object-top"
            draggable={false}
          />
        </div>

        {(mood === "happy" || mood === "combo") && (
          <>
            <motion.span
              className="absolute -right-1 top-2 text-lg text-[#5BB8FF]"
              animate={{ scale: [1, 1.25, 1], opacity: [0.7, 1, 0.7] }}
              transition={{ repeat: Infinity, duration: 1.2 }}
            >
              ✨
            </motion.span>
            <motion.span
              className="absolute -left-1 top-6 text-sm text-[#7DD3FC]"
              animate={{ y: [0, -6, 0] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            >
              💙
            </motion.span>
          </>
        )}
        {mood === "sad" && (
          <motion.span
            className="absolute right-2 top-4 text-sky-300"
            animate={{ y: [0, 8], opacity: [1, 0] }}
            transition={{ repeat: Infinity, duration: 1.4 }}
          >
            💧
          </motion.span>
        )}
      </motion.div>
    </div>
  );
}

export function WarriorCharacter(props: Props) {
  return <AnimeMascot {...props} />;
}

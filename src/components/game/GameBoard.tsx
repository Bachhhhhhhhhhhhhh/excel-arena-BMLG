"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "@/store/game-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SampleTable } from "./SampleTable";
import { ScoreHUD } from "./ScoreHUD";
import { AnimeMascot, type MascotMood } from "./AnimeMascot";
import { CATEGORY_LABELS, DIFFICULTY_LABELS } from "@/types";
import { Send, SkipForward, Home, Sparkles } from "lucide-react";
import Link from "next/link";

const DIFF_STYLE = {
  easy: "bg-[#E8F4FF] text-[#1E3A5F] ring-[#A8D8FF]",
  medium: "bg-[#E0F2FE] text-[#1E3A5F] ring-[#7EC8FF]",
  hard: "bg-[#FEF2F2] text-[#9A3412] ring-[#FCA5A5]",
};

export function GameBoard() {
  const {
    status,
    mode,
    currentQuestion,
    score,
    combo,
    maxCombo,
    lives,
    timeLeft,
    lastResult,
    sessionCorrect,
    sessionTotal,
    queue,
    questionIndex,
    submitAnswer,
    nextQuestion,
    tick,
    resetGame,
  } = useGameStore();

  const [answer, setAnswer] = useState("");
  const [shake, setShake] = useState(false);
  const [floatPts, setFloatPts] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (mode !== "challenge" || status === "finished" || status === "idle")
      return;
    const id = setInterval(() => tick(), 1000);
    return () => clearInterval(id);
  }, [mode, status, tick]);

  useEffect(() => {
    if (status === "playing") {
      setAnswer("");
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [status, currentQuestion?.id]);

  useEffect(() => {
    if (!lastResult) return;
    let cancelled = false;
    if (lastResult.isCorrect) {
      setFloatPts(lastResult.pointsEarned);
      const colors = [
        "#A8D8FF",
        "#7EC8FF",
        "#5BB8FF",
        "#7DD3FC",
        "#FFFFFF",
        "#E8F4FF",
      ];
      void import("canvas-confetti")
        .then((mod) => {
          if (cancelled) return;
          const confetti = mod.default;
          confetti({
            particleCount: 60 + Math.min(combo, 10) * 8,
            spread: 75,
            origin: { y: 0.62 },
            colors,
            scalar: 1.05,
          });
          confetti({
            particleCount: 18,
            angle: 60,
            spread: 50,
            origin: { x: 0, y: 0.7 },
            colors,
          });
          confetti({
            particleCount: 18,
            angle: 120,
            spread: 50,
            origin: { x: 1, y: 0.7 },
            colors,
          });
        })
        .catch(() => {
          /* confetti optional */
        });
      const t = setTimeout(() => setFloatPts(null), 1200);
      return () => {
        cancelled = true;
        clearTimeout(t);
      };
    } else {
      setShake(true);
      const t = setTimeout(() => setShake(false), 500);
      return () => clearTimeout(t);
    }
  }, [lastResult, combo]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (status !== "playing" || !answer.trim()) return;
    await submitAnswer(answer.trim());
  };

  if (status === "finished") {
    const rate =
      sessionTotal > 0
        ? Math.round((sessionCorrect / sessionTotal) * 100)
        : 0;
    const title =
      rate >= 80
        ? "Xuất sắc lắm! ✨"
        : rate >= 50
          ? "Làm tốt rồi đó~"
          : "Lần sau sẽ hơn nhé";

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        className="mx-auto max-w-lg"
      >
        <div className="rounded-[2rem] bg-gradient-to-br from-[#A8D8FF] via-[#7EC8FF] to-[#5BB8FF] p-[2px] shadow-ice-lg">
          <div className="rounded-[1.9rem] bg-white/95 p-8 text-center backdrop-blur">
            <AnimeMascot
              mood={sessionCorrect > 0 ? "happy" : "sad"}
              size="lg"
              speech={title}
            />
            <h2 className="mt-4 text-3xl font-extrabold text-[#1E3A5F]">
              Kết thúc trận đấu
            </h2>
            <div className="mt-5 grid grid-cols-3 gap-2">
              {[
                { label: "Điểm", value: score },
                {
                  label: "Đúng",
                  value: `${sessionCorrect}/${sessionTotal}`,
                },
                { label: "Max combo", value: `x${maxCombo}` },
              ].map((s) => (
                <div
                  key={s.label}
                  className="rounded-2xl border border-[#A8D8FF]/50 bg-[#E8F4FF]/60 p-3"
                >
                  <div className="text-lg font-extrabold text-[#5BB8FF]">
                    {s.value}
                  </div>
                  <div className="text-[10px] font-semibold uppercase tracking-wide text-[#4A6FA5]">
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Button onClick={resetGame} size="lg">
                Chơi tiếp
              </Button>
              <Link href="/leaderboard">
                <Button variant="secondary" size="lg">
                  Bảng xếp hạng
                </Button>
              </Link>
              <Link href="/">
                <Button variant="outline" size="lg">
                  <Home className="h-4 w-4" /> Trang chủ
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="py-16 text-center">
        <AnimeMascot mood="sad" size="md" speech="Chưa có câu hỏi…" />
      </div>
    );
  }

  const q = currentQuestion;
  let mood: MascotMood = "think";
  if (status === "feedback") {
    if (lastResult?.isCorrect) {
      mood = combo >= 3 ? "combo" : "happy";
    } else {
      mood = "sad";
    }
  } else if (mode === "boss") {
    mood = "boss";
  }

  const progress =
    mode === "daily" || mode === "boss"
      ? ((questionIndex + (status === "feedback" ? 1 : 0)) /
          Math.max(queue.length, 1)) *
        100
      : null;

  return (
    <div className="relative mx-auto max-w-3xl space-y-4">
      <AnimatePresence>
        {floatPts !== null && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.6 }}
            animate={{ opacity: 1, y: -36, scale: 1.15 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none absolute left-1/2 top-28 z-20 -translate-x-1/2 text-2xl font-extrabold text-[#5BB8FF] drop-shadow"
          >
            +{floatPts} ✨
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <ScoreHUD
          score={score}
          combo={combo}
          lives={lives}
          timeLeft={timeLeft}
          mode={mode}
          sessionCorrect={sessionCorrect}
          sessionTotal={sessionTotal}
        />
        <Button variant="ghost" size="sm" onClick={resetGame}>
          Thoát
        </Button>
      </div>

      {progress !== null && (
        <div className="h-2 overflow-hidden rounded-full bg-[#E8F4FF] ring-1 ring-[#A8D8FF]/50">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-[#A8D8FF] via-[#7EC8FF] to-[#5BB8FF]"
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(progress, 100)}%` }}
            transition={{ type: "spring", stiffness: 120 }}
          />
        </div>
      )}

      <div className="flex justify-center py-1">
        <AnimeMascot mood={mood} size="sm" />
      </div>

      <motion.div
        key={q.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{
          opacity: 1,
          y: 0,
          ...(shake ? { x: [0, -8, 8, -6, 6, 0] } : { x: 0 }),
        }}
        transition={{ type: "spring", stiffness: 280, damping: 24 }}
      >
        <Card
          className={`overflow-hidden ${
            status === "feedback"
              ? lastResult?.isCorrect
                ? "ring-2 ring-[#7DD3FC] shadow-[0_0_28px_rgba(125,211,252,0.45)]"
                : "ring-2 ring-[#FCA5A5] shadow-[0_0_24px_rgba(252,165,165,0.35)]"
              : ""
          }`}
        >
          <div className="h-1 bg-gradient-to-r from-[#A8D8FF] via-[#7EC8FF] to-[#5BB8FF]" />
          <CardHeader>
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-gradient-to-r from-[#A8D8FF] to-[#7EC8FF] text-[#1E3A5F] border border-white/60">
                {q.functionName}
              </Badge>
              <Badge className="bg-[#E8F4FF] text-[#4A6FA5] ring-1 ring-[#A8D8FF]/50">
                {CATEGORY_LABELS[q.category]}
              </Badge>
              <Badge className={`ring-1 ${DIFF_STYLE[q.difficulty]}`}>
                {DIFFICULTY_LABELS[q.difficulty]}
              </Badge>
              <Badge className="bg-white text-[#5BB8FF] ring-1 ring-[#A8D8FF]">
                +{q.points} điểm
              </Badge>
            </div>
            <CardTitle className="mt-3 text-xl sm:text-2xl">{q.title}</CardTitle>
            <p className="text-sm font-medium leading-relaxed text-[#4A6FA5]">
              {q.prompt}
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <SampleTable data={q.sampleData} />

            {status === "playing" && (
              <form onSubmit={handleSubmit} className="space-y-3">
                <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-[#5BB8FF]">
                  <Sparkles className="h-3.5 w-3.5" />
                  Nhập công thức Excel
                </label>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <div className="relative flex-1">
                    <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-lg font-bold text-[#A8D8FF]">
                      =
                    </span>
                    <Input
                      ref={inputRef}
                      value={answer}
                      onChange={(e) => setAnswer(e.target.value)}
                      placeholder="SUM(B2:B5)"
                      autoComplete="off"
                      spellCheck={false}
                      className="h-14 pl-8 text-base"
                    />
                  </div>
                  <Button
                    type="submit"
                    size="lg"
                    disabled={!answer.trim()}
                    className="h-14 shrink-0"
                  >
                    <Send className="h-4 w-4" />
                    Gửi
                  </Button>
                </div>
                <p className="text-center text-[11px] font-medium text-[#7EC8FF]">
                  Enter để gửi · Chấp nhận dấu , hoặc ;
                </p>
              </form>
            )}

            <AnimatePresence>
              {status === "feedback" && lastResult && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`rounded-2xl border p-4 ${
                    lastResult.isCorrect
                      ? "border-[#7DD3FC]/60 bg-[#E0F2FE]/70"
                      : "border-[#FCA5A5]/60 bg-[#FEF2F2]/80"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">
                      {lastResult.isCorrect ? "✨" : "💧"}
                    </span>
                    <div className="flex-1 space-y-1.5 text-sm">
                      <p
                        className={`text-base font-bold ${
                          lastResult.isCorrect
                            ? "text-[#0369A1]"
                            : "text-[#9A3412]"
                        }`}
                      >
                        {lastResult.isCorrect
                          ? `Chính xác! +${lastResult.pointsEarned} điểm`
                          : "Chưa đúng rồi…"}
                      </p>
                      {!lastResult.isCorrect && (
                        <p className="text-[#4A6FA5]">
                          Bạn nhập:{" "}
                          <code className="rounded-lg bg-white px-2 py-0.5 font-mono text-[#FCA5A5] ring-1 ring-[#FCA5A5]/40">
                            {lastResult.userAnswer || "(trống)"}
                          </code>
                        </p>
                      )}
                      <p className="text-[#1E3A5F]">
                        Đáp án:{" "}
                        <code className="rounded-lg bg-white px-2 py-0.5 font-mono font-semibold text-[#5BB8FF] ring-1 ring-[#A8D8FF]">
                          {q.correctAnswer}
                        </code>
                      </p>
                      <p className="leading-relaxed text-[#4A6FA5]">
                        {q.explanation}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 flex justify-end">
                    <Button onClick={nextQuestion} size="lg">
                      Câu tiếp
                      <SkipForward className="h-4 w-4" />
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

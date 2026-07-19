"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AnimeMascot } from "@/components/game/AnimeMascot";
import { TOTAL_FUNCTIONS } from "@/data/functions";
import { TOTAL_QUESTIONS } from "@/data/questions";

const features = [
  {
    title: `${TOTAL_FUNCTIONS}+ hàm Excel`,
    desc: "Math, Text, Lookup, Finance… đủ bộ thực chiến.",
  },
  {
    title: "4 chế độ chơi",
    desc: "Luyện tập, 60 giây, Boss Fight, Daily Challenge.",
  },
  {
    title: "Combo & huy hiệu",
    desc: "Confetti xanh dịu, combo lấp lánh, sưu tầm badge.",
  },
  {
    title: "Xuất Excel",
    desc: "Tải .xlsx lịch sử chơi chỉ một chạm.",
  },
  {
    title: "Google Sheets",
    desc: "Append gần real-time mỗi lần trả lời.",
  },
  {
    title: "Mascot anime",
    desc: "Đồng hành dễ thương ở mọi trạng thái cảm xúc.",
  },
];

export default function HomePage() {
  return (
    <div className="space-y-16">
      <section className="grid items-center gap-10 md:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-6"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-[#A8D8FF]/70 bg-white/80 px-4 py-1.5 text-xs font-bold text-[#5BB8FF] shadow-ice backdrop-blur">
            <span className="animate-sparkle-soft">✦</span>
            Arena trong trẻo · {TOTAL_QUESTIONS} câu hỏi sẵn sàng
          </div>

          <h1 className="text-4xl font-extrabold leading-[1.12] tracking-tight text-[#1E3A5F] sm:text-5xl lg:text-[3.25rem]">
            Excel Arena
            <span className="mt-1 block bg-gradient-to-r from-[#5BB8FF] via-[#7EC8FF] to-[#A8D8FF] bg-clip-text text-transparent">
              Công Thức Chiến Binh
            </span>
          </h1>

          <p className="max-w-lg text-lg font-medium leading-relaxed text-[#4A6FA5]">
            Luyện hàm Excel trong không gian anime học đường mềm mại — confetti
            xanh khi đúng, mascot an ủi khi sai. Dễ chịu, dễ nhìn, dễ ghi điểm.
          </p>

          <div className="flex flex-wrap gap-3">
            <Link href="/play">
              <Button size="lg" className="animate-soft-pulse">
                Vào đấu trường
              </Button>
            </Link>
            <Link href="/library">
              <Button size="lg" variant="secondary">
                Thư viện hàm
              </Button>
            </Link>
            <Link href="/leaderboard">
              <Button size="lg" variant="outline">
                Xếp hạng
              </Button>
            </Link>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative flex justify-center"
        >
          <div className="absolute inset-6 rounded-full bg-[#A8D8FF]/40 blur-3xl" />
          <Card className="relative w-full max-w-sm overflow-hidden border-[#A8D8FF]/50 bg-white/85">
            <div className="h-1.5 bg-gradient-to-r from-[#A8D8FF] via-[#7EC8FF] to-[#5BB8FF]" />
            <div className="p-8 text-center">
              <AnimeMascot mood="idle" size="lg" />
              <div className="mt-5 grid grid-cols-3 gap-2">
                {[
                  { n: TOTAL_FUNCTIONS, l: "Hàm" },
                  { n: TOTAL_QUESTIONS, l: "Câu" },
                  { n: 4, l: "Mode" },
                ].map((s) => (
                  <div
                    key={s.l}
                    className="rounded-2xl border border-[#A8D8FF]/40 bg-[#E8F4FF]/70 p-2.5"
                  >
                    <div className="text-xl font-extrabold text-[#5BB8FF]">
                      {s.n}
                    </div>
                    <div className="text-[10px] font-bold uppercase text-[#4A6FA5]">
                      {s.l}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </motion.div>
      </section>

      <section>
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-extrabold text-[#1E3A5F] sm:text-3xl">
            Vì sao luyện tại Arena?
          </h2>
          <p className="mt-2 text-sm font-medium text-[#5BB8FF]">
            Soft Anime UI · Glass nhẹ · Học đường trong trẻo
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              whileHover={{ y: -3 }}
            >
              <Card className="h-full bg-gradient-to-br from-white/90 to-[#E8F4FF]/40">
                <CardContent className="p-5">
                  <div className="mb-2 h-1 w-10 rounded-full bg-gradient-to-r from-[#A8D8FF] to-[#5BB8FF]" />
                  <h3 className="font-bold text-[#1E3A5F]">{f.title}</h3>
                  <p className="mt-1.5 text-sm font-medium text-[#4A6FA5]">
                    {f.desc}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      <motion.section
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="relative overflow-hidden rounded-[2rem] bg-gradient-to-r from-[#A8D8FF] via-[#7EC8FF] to-[#5BB8FF] p-8 text-center shadow-ice-lg sm:p-12"
      >
        <div className="absolute inset-0 bg-white/10" />
        <div className="relative">
          <h2 className="text-2xl font-extrabold text-white sm:text-3xl drop-shadow-sm">
            Sẵn sàng viết công thức?
          </h2>
          <p className="mx-auto mt-3 max-w-md font-medium text-white/90">
            Không cần cài Excel — gõ công thức trên trình duyệt, nhận điểm và
            giải thích dịu dàng ngay lập tức.
          </p>
          <Link href="/play" className="mt-7 inline-block">
            <Button size="lg" variant="secondary">
              Bắt đầu ngay
            </Button>
          </Link>
        </div>
      </motion.section>
    </div>
  );
}

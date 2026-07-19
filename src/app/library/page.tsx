"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { EXCEL_FUNCTIONS, TOTAL_FUNCTIONS } from "@/data/functions";
import { QUESTIONS, getQuestionsByFunction } from "@/data/questions";
import { CATEGORY_LABELS, type FunctionCategory } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";

const CATS = Object.keys(CATEGORY_LABELS) as FunctionCategory[];

export default function LibraryPage() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<FunctionCategory | "all">("all");
  const [selected, setSelected] = useState<string | null>("SUM");

  const filtered = useMemo(() => {
    return EXCEL_FUNCTIONS.filter((f) => {
      if (cat !== "all" && f.category !== cat) return false;
      if (!q.trim()) return true;
      const s = q.toLowerCase();
      return (
        f.name.toLowerCase().includes(s) ||
        f.description.toLowerCase().includes(s)
      );
    });
  }, [q, cat]);

  const selectedFn = EXCEL_FUNCTIONS.find((f) => f.name === selected);
  const relatedQs = selected ? getQuestionsByFunction(selected) : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-[#1E3A5F]">Thư viện hàm</h1>
        <p className="font-medium text-[#5BB8FF]">
          {TOTAL_FUNCTIONS} hàm · {QUESTIONS.length} câu luyện · trong trẻo & dễ
          tìm
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7EC8FF]" />
        <Input
          className="pl-11 font-sans font-semibold"
          placeholder="Tìm SUM, XLOOKUP, TEXTJOIN..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      <div className="flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={() => setCat("all")}
          className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
            cat === "all"
              ? "bg-gradient-to-r from-[#7EC8FF] to-[#5BB8FF] text-white shadow-ice"
              : "bg-white/80 text-[#4A6FA5] ring-1 ring-[#A8D8FF]/60 hover:bg-[#E8F4FF]"
          }`}
        >
          Tất cả ({TOTAL_FUNCTIONS})
        </button>
        {CATS.map((c) => {
          const n = EXCEL_FUNCTIONS.filter((f) => f.category === c).length;
          return (
            <button
              key={c}
              type="button"
              onClick={() => setCat(c)}
              className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
                cat === c
                  ? "bg-gradient-to-r from-[#7EC8FF] to-[#5BB8FF] text-white shadow-ice"
                  : "bg-white/80 text-[#4A6FA5] ring-1 ring-[#A8D8FF]/60 hover:bg-[#E8F4FF]"
              }`}
            >
              {CATEGORY_LABELS[c].split(" ")[0]} ({n})
            </button>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <div className="lg:col-span-3 grid max-h-[70vh] gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
          {filtered.map((f, i) => (
            <motion.button
              key={f.name}
              type="button"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.008, 0.25) }}
              onClick={() => setSelected(f.name)}
              className={`rounded-2xl border p-3.5 text-left transition ${
                selected === f.name
                  ? "border-[#7EC8FF] bg-gradient-to-br from-[#E8F4FF] to-white shadow-ice"
                  : "border-[#A8D8FF]/40 bg-white/70 hover:border-[#7EC8FF] hover:shadow-ice"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-sm font-bold text-[#5BB8FF]">
                  {f.name}
                </span>
                <Badge className="bg-[#E8F4FF] text-[#4A6FA5] ring-1 ring-[#A8D8FF]/40">
                  {CATEGORY_LABELS[f.category].split(" ")[0]}
                </Badge>
              </div>
              <p className="mt-1.5 line-clamp-2 text-xs font-medium text-[#4A6FA5]">
                {f.description}
              </p>
            </motion.button>
          ))}
        </div>

        <div className="lg:col-span-2">
          <Card className="sticky top-20 overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-[#A8D8FF] to-[#5BB8FF]" />
            <CardHeader>
              <CardTitle className="font-mono">
                {selectedFn ? selectedFn.name : "Chọn một hàm"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              {selectedFn ? (
                <>
                  <p className="font-medium text-[#4A6FA5]">
                    {selectedFn.description}
                  </p>
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-[#7EC8FF]">
                      Cú pháp
                    </div>
                    <code className="mt-1.5 block rounded-2xl bg-[#1E3A5F] p-3.5 text-xs font-semibold text-[#A8D8FF]">
                      {selectedFn.syntax}
                    </code>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-[#7EC8FF]">
                      Ví dụ
                    </div>
                    <code className="mt-1.5 block rounded-2xl border border-[#A8D8FF]/50 bg-[#E8F4FF] p-3.5 font-mono text-xs font-bold text-[#1E3A5F]">
                      {selectedFn.example}
                    </code>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-[#7EC8FF]">
                      Câu luyện ({relatedQs.length})
                    </div>
                    <ul className="mt-1.5 space-y-1.5">
                      {relatedQs.map((qq) => (
                        <li
                          key={qq.id}
                          className="rounded-xl bg-[#E8F4FF]/80 px-3 py-2 text-xs font-semibold text-[#1E3A5F] ring-1 ring-[#A8D8FF]/40"
                        >
                          {qq.title}{" "}
                          <span className="text-[#7EC8FF]">· {qq.difficulty}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              ) : (
                <p className="font-medium text-[#7EC8FF]">
                  Chọn một hàm bên trái
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

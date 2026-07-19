"use client";

import { useEffect, useState } from "react";

/** Soft bubbles + sparkles — ice anime ambient */
export function FloatingDecor() {
  const [bubbles, setBubbles] = useState<
    { id: number; left: number; size: number; delay: number; duration: number }[]
  >([]);

  useEffect(() => {
    setBubbles(
      Array.from({ length: 14 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        size: 8 + Math.random() * 28,
        delay: Math.random() * 12,
        duration: 14 + Math.random() * 16,
      }))
    );
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden>
      <div className="light-ray" />

      {/* soft sparkles */}
      {[
        { t: "12%", l: "8%" },
        { t: "22%", l: "88%" },
        { t: "55%", l: "6%" },
        { t: "70%", l: "92%" },
        { t: "38%", l: "48%" },
        { t: "18%", l: "62%" },
      ].map((p, i) => (
        <span
          key={i}
          className={`absolute animate-sparkle-soft text-sky-300/70 ${
            i % 2 === 0 ? "delay-1" : "delay-2"
          }`}
          style={{ top: p.t, left: p.l, fontSize: i % 3 === 0 ? 14 : 10 }}
        >
          ✦
        </span>
      ))}

      {/* rising glass bubbles */}
      {bubbles.map((b) => (
        <span
          key={b.id}
          className="absolute bottom-[-40px] rounded-full border border-sky-200/50 bg-white/25"
          style={{
            left: `${b.left}%`,
            width: b.size,
            height: b.size,
            animation: `float-bubble ${b.duration}s linear ${b.delay}s infinite`,
            boxShadow: "inset 0 0 12px rgba(168,216,255,0.35)",
          }}
        />
      ))}
    </div>
  );
}

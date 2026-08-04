"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { withBase } from "@/lib/base-path";
import { BookOpen, Grid3X3, Home, Play, Settings, Trophy } from "lucide-react";

const links: {
  href: string;
  label: string;
  icon: typeof Home;
  external?: boolean;
}[] = [
  { href: "/", label: "Trang chủ", icon: Home },
  { href: "/quiz/", label: "Lưới 10×10", icon: Grid3X3, external: true },
  { href: "/play", label: "Arena", icon: Play },
  { href: "/library", label: "Thư viện", icon: BookOpen },
  { href: "/leaderboard", label: "Xếp hạng", icon: Trophy },
  { href: "/settings", label: "Cài đặt", icon: Settings },
];

export function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-[#A8D8FF]/40 bg-white/65 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-3 py-2.5 sm:px-4 sm:py-3">
        <Link href="/" className="group flex items-center gap-2.5">
          <motion.span
            whileHover={{ scale: 1.06 }}
            className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl border border-white bg-gradient-to-br from-[#A8D8FF] to-[#7EC8FF] shadow-[0_4px_14px_rgba(91,184,255,0.4)]"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={withBase("/mascot/idle.jpg")}
              alt=""
              className="h-full w-full object-cover object-top"
            />
          </motion.span>
          <div className="leading-tight">
            <div className="font-bold text-[#1E3A5F] group-hover:text-[#5BB8FF] transition-colors">
              Excel Arena
            </div>
            <div className="text-[11px] font-medium text-[#5BB8FF]">
              Công Thức Chiến Binh
            </div>
          </div>
        </Link>

        <nav className="flex items-center gap-0.5 rounded-2xl border border-[#A8D8FF]/50 bg-[#E8F4FF]/70 p-1 backdrop-blur">
          {links.map(({ href, label, icon: Icon, external }) => {
            const active = !external && pathname === href;
            const className = cn(
              "relative flex items-center gap-1.5 rounded-xl px-2.5 py-2 text-sm font-semibold transition sm:px-3",
              active
                ? "text-white"
                : "text-[#4A6FA5] hover:text-[#1E3A5F] hover:bg-white/60"
            );
            const inner = (
              <>
                {active && (
                  <motion.span
                    layoutId="nav-pill-ice"
                    className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#7EC8FF] to-[#5BB8FF] shadow-[0_2px_12px_rgba(91,184,255,0.45)]"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-1.5">
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{label}</span>
                </span>
              </>
            );
            if (external) {
              return (
                <a
                  key={href}
                  href={withBase(href)}
                  className={cn(
                    className,
                    "bg-gradient-to-r from-[#A8D8FF]/50 to-[#7EC8FF]/40 text-[#0284c8] ring-1 ring-[#7EC8FF]/40"
                  )}
                >
                  {inner}
                </a>
              );
            }
            return (
              <Link key={href} href={href} className={className}>
                {inner}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}

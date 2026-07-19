import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { FloatingDecor } from "@/components/ui/FloatingDecor";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin", "vietnamese"],
  variable: "--font-jakarta",
  weight: ["400", "500", "600", "700", "800"],
});

const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Excel Arena – Công Thức Chiến Binh",
  description:
    "Luyện hàm Excel với vibe anime trong trẻo: 100+ hàm, challenge, boss fight, xuất Excel & Google Sheets.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body
        className={`${jakarta.variable} ${geistMono.variable} font-sans antialiased`}
      >
        <FloatingDecor />
        <div className="relative z-10">
          <Header />
          <main className="mx-auto min-h-[calc(100vh-8rem)] max-w-6xl px-4 py-8">
            {children}
          </main>
          <footer className="border-t border-[#A8D8FF]/40 bg-white/50 py-6 text-center backdrop-blur">
            <p className="text-sm font-semibold text-[#1E3A5F]/80">
              Excel Arena · Công Thức Chiến Binh
            </p>
            <p className="mt-1 text-xs font-medium text-[#5BB8FF]">
              Soft Anime UI · Trong trẻo · Dễ thương
            </p>
          </footer>
        </div>
      </body>
    </html>
  );
}

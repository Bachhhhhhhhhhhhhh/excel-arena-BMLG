import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { FloatingDecor } from "@/components/ui/FloatingDecor";
import { StoreHydration } from "@/components/providers/StoreHydration";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin", "latin-ext"],
  variable: "--font-jakarta",
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Excel Arena – Cong Thuc Chien Binh",
  description:
    "Luyen ham Excel: 100+ ham, challenge, boss fight, xuat Excel & Google Sheets.",
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
        <StoreHydration />
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

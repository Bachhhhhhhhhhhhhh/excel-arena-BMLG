import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ice: {
          50: "#F0F9FF",
          100: "#E8F4FF",
          200: "#A8D8FF",
          300: "#7EC8FF",
          400: "#5BB8FF",
          500: "#7DD3FC",
          800: "#1E3A5F",
          600: "#4A6FA5",
          soft: "#FCA5A5",
        },
        background: "var(--bg-from)",
        foreground: "var(--text)",
      },
      fontFamily: {
        sans: ["var(--font-jakarta)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "ui-monospace", "monospace"],
      },
      borderRadius: {
        "4xl": "2rem",
      },
      boxShadow: {
        ice: "0 8px 32px -8px rgba(91, 184, 255, 0.28)",
        "ice-lg": "0 12px 40px -6px rgba(91, 184, 255, 0.42)",
      },
    },
  },
  plugins: [],
};
export default config;

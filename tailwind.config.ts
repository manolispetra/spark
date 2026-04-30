import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        bg: { DEFAULT: "#0A0B10", soft: "#10121B", card: "#13162199" },
        line: "#1F2230",
        ink: { DEFAULT: "#F1F2F6", dim: "#9AA3B2", mute: "#5A6377" },
        spark: {
          orange: "#FF7A00",
          pink:   "#FF2D78",
          purple: "#7C5CFF",
          blue:   "#2EA8FF",
        },
      },
      fontFamily: {
        display: ["Space Grotesk", "Inter", "system-ui", "sans-serif"],
        body:    ["Inter", "system-ui", "sans-serif"],
        mono:    ["JetBrains Mono", "ui-monospace", "monospace"],
      },
      backgroundImage: {
        "spark-grad":   "linear-gradient(135deg,#FF7A00 0%,#FF2D78 55%,#7C5CFF 100%)",
        "spark-grad-r": "linear-gradient(45deg,#FF2D78 0%,#FFB347 100%)",
        "card-grad":    "radial-gradient(120% 80% at 0% 0%, rgba(255,45,120,.06) 0%, transparent 60%), radial-gradient(120% 80% at 100% 100%, rgba(124,92,255,.06) 0%, transparent 60%)",
      },
      boxShadow: {
        glow:    "0 0 40px -10px rgba(255,45,120,.4)",
        "glow-lg": "0 0 80px -20px rgba(255,122,0,.45)",
      },
      animation: {
        "pulse-slow": "pulse 3.2s ease-in-out infinite",
        shimmer: "shimmer 2.4s linear infinite",
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
    },
  },
  plugins: [],
};
export default config;

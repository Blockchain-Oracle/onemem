import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // sourced from @onemem/brand tokens.css
        lavender: "#B08FFF",
        chartreuse: "#D4FF5E",
        cream: "#FAF8F5",
        sui: "#0090FF",
      },
      fontFamily: {
        body: ["Inter", "system-ui", "sans-serif"],
        display: ["Ratch", "General Sans", "Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;

import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        mono: ["JetBrains Mono", "SF Mono", "Monaco", "Consolas", "monospace"],
      },
      colors: {
        neutral: {
          850: "#1f1f1f",
          950: "#0a0a0a",
        },
      },
    },
  },
  plugins: [],
};

export default config;

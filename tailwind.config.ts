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
        background: "#f7f7f5",
        foreground: "#1a1a1a",
        border: "#e4e4e0",
        input: "#f0f0ec",
        primary: {
          DEFAULT: "#d42b0f",
          foreground: "#ffffff",
        },
        secondary: {
          DEFAULT: "#f5a623",
          foreground: "#ffffff",
        },
        muted: {
          DEFAULT: "#ede8e3",
          foreground: "#8a8278",
        },
        sidebar: {
          DEFAULT: "#1e1a18",
          foreground: "#f5f0eb",
        },
        success: "#1e8a4a",
        danger: "#d42b0f",
        card: "#ffffff",
      },
      fontFamily: {
        body: ["var(--font-inter)", "sans-serif"],
        headings: ["var(--font-space-grotesk)", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;

import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/hooks/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        canvas: "#f5f5f5",
        "canvas-soft": "#fafafa",
        ink: "#0c0a09",
        body: "#4e4e4e",
        muted: "#777169",
        "muted-soft": "#a8a29e",
        primary: "#292524",
        "primary-active": "#0c0a09",
        hairline: "#e7e5e4",
        "surface-card": "#ffffff",
        "surface-strong": "#f0efed",
        "gradient-mint": "#a7e5d3",
        "gradient-peach": "#f4c5a8",
        "gradient-lavender": "#c8b8e0",
        "gradient-sky": "#a8c8e8",
        "gradient-rose": "#e8b8c4",
        voice: {
          bg: "#050a18",
          "bg-mid": "#0a1229",
          glow: "#007aff",
          cyan: "#00f2ff"
        }
      },
      fontFamily: {
        display: ['"EB Garamond"', "Georgia", "serif"],
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"]
      },
      borderRadius: {
        pill: "9999px",
        xl: "16px",
        xxl: "24px"
      },
      boxShadow: {
        card: "0 4px 16px rgba(0, 0, 0, 0.04)",
        orb: "inset 0 0 60px rgba(0, 122, 255, 0.35), 0 0 80px rgba(0, 242, 255, 0.25)"
      },
      animation: {
        "orb-pulse": "orb-pulse 4s ease-in-out infinite",
        "orb-spin": "orb-spin 12s linear infinite"
      },
      keyframes: {
        "orb-pulse": {
          "0%, 100%": { transform: "scale(1)", opacity: "0.9" },
          "50%": { transform: "scale(1.04)", opacity: "1" }
        },
        "orb-spin": {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" }
        }
      }
    }
  },
  plugins: []
};

export default config;

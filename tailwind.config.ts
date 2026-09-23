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
        // Surfaces — warm ivory floor, fine paper above it
        canvas: "#f4f2ec",
        "canvas-soft": "#faf9f5",
        paper: "#fcfbf8",
        // Text — warm near-black through to readable muted
        ink: "#1a1813",
        "ink-soft": "#3d3a33",
        body: "#5c574e",
        muted: "#6e685c",
        "muted-soft": "#928c80",
        // Hairlines
        hairline: "#e4dfd4",
        "hairline-strong": "#d4cebf",
        // Brand — deep pine "dealmaker's felt"
        pine: "#234b3b",
        "pine-deep": "#173329",
        "pine-tint": "#dbe6dd",
        "pine-soft": "#eef3ee",
        "on-pine": "#f5f3ee",
        // Accent — restrained brass, "deal closed"
        brass: "#b0863a",
        "brass-deep": "#8a6727",
        "brass-soft": "#f1e7cf",
        // Semantic
        success: "#2f7d5b",
        warning: "#a9711a",
        error: "#b3261e"
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "Cambria", "serif"],
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"]
      },
      borderRadius: {
        pill: "9999px",
        sm: "8px",
        md: "12px",
        lg: "16px",
        xl: "20px",
        "2xl": "28px"
      },
      boxShadow: {
        card: "0 1px 2px rgba(36,30,16,0.04), 0 10px 28px -16px rgba(36,30,16,0.16)",
        "card-hover":
          "0 2px 4px rgba(36,30,16,0.05), 0 18px 44px -18px rgba(36,30,16,0.22)",
        pill: "0 1px 2px rgba(36,30,16,0.06), 0 14px 36px -14px rgba(36,30,16,0.24)",
        "pine-glow": "0 10px 30px -8px rgba(35,75,59,0.45)",
        focus: "0 0 0 3px rgba(35,75,59,0.22)"
      },
      transitionTimingFunction: {
        "out-expo": "cubic-bezier(0.16, 1, 0.3, 1)",
        "out-quart": "cubic-bezier(0.25, 1, 0.5, 1)"
      },
      animation: {
        breathe: "breathe 6s ease-in-out infinite",
        "breathe-active": "breathe 3.4s ease-in-out infinite",
        "ring-pulse": "ring-pulse 2.8s cubic-bezier(0.16,1,0.3,1) infinite",
        "ring-pulse-delayed": "ring-pulse 2.8s cubic-bezier(0.16,1,0.3,1) infinite 1.4s",
        "orb-drift": "orb-drift 16s linear infinite",
        work: "work-spin 2.2s linear infinite",
        rise: "rise 0.55s cubic-bezier(0.16,1,0.3,1) both",
        "fade-in": "fade-in 0.4s ease-out both"
      },
      keyframes: {
        breathe: {
          "0%, 100%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.035)" }
        },
        "ring-pulse": {
          "0%": { transform: "scale(0.86)", opacity: "0.5" },
          "100%": { transform: "scale(1.55)", opacity: "0" }
        },
        "orb-drift": {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" }
        },
        "work-spin": {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" }
        },
        rise: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" }
        }
      }
    }
  },
  plugins: []
};

export default config;

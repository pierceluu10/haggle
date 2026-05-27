import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#17202a",
        paper: "#f7f4ec",
        fern: "#1e6f5c",
        coral: "#dc6a4d",
        citron: "#e2b84b",
        steel: "#315f8c"
      },
      boxShadow: {
        soft: "0 20px 60px rgba(23, 32, 42, 0.12)",
        "glow-blue": "0 0 20px rgba(59,130,246,0.2), 0 0 0 1px rgba(59,130,246,0.15)",
        "glow-green": "0 0 20px rgba(16,185,129,0.2), 0 0 0 1px rgba(16,185,129,0.15)",
        "glow-mic": "0 0 35px rgba(59,130,246,0.6)"
      },
      animation: {
        "bar-bounce": "bar-bounce 0.7s ease-in-out infinite",
        "thinking": "thinking-dot 1.4s ease-in-out infinite",
        "pulse-ring": "pulse-ring 2s ease-in-out infinite"
      },
      keyframes: {
        "bar-bounce": {
          "0%, 100%": { transform: "scaleY(0.15)" },
          "50%": { transform: "scaleY(1)" }
        },
        "thinking-dot": {
          "0%, 80%, 100%": { transform: "scale(0)", opacity: "0" },
          "40%": { transform: "scale(1)", opacity: "1" }
        },
        "pulse-ring": {
          "0%, 100%": { opacity: "0.4", transform: "scale(1)" },
          "50%": { opacity: "1", transform: "scale(1.05)" }
        }
      }
    }
  },
  plugins: []
};

export default config;

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
        soft: "0 20px 60px rgba(23, 32, 42, 0.12)"
      }
    }
  },
  plugins: []
};

export default config;

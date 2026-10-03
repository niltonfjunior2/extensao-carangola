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
        // Paleta Institucional UEMG & Extensão Carangola
        uemg: {
          blue: {
            DEFAULT: "#0b4382",
            50: "#eff6ff",
            100: "#dbeafe",
            200: "#bfdbfe",
            300: "#93c5fd",
            400: "#60a5fa",
            500: "#3b82f6",
            600: "#1e5eb3",
            700: "#0b4382", // Tom institucional primário (uemg.br)
            800: "#072e5c",
            900: "#072a53", // Azul marinho profundo
            950: "#031429",
          },
          red: {
            DEFAULT: "#c4161c", // Vermelho Minas Gerais
            50: "#fef2f2",
            600: "#c4161c",
            700: "#991b1b",
          },
          gold: {
            DEFAULT: "#d99b26", // Dourado institucional
            50: "#fefce8",
            600: "#ca8a04",
          },
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
      },
      boxShadow: {
        soft: "0 4px 20px -2px rgba(11, 67, 130, 0.08)",
        elevation: "0 10px 30px -4px rgba(7, 42, 83, 0.12)",
      },
    },
  },
  plugins: [],
};

export default config;

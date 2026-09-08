/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#1B2430",
          light: "#2A3644",
          soft: "#5B6472",
        },
        paper: {
          DEFAULT: "#F7F5F0",
          dim: "#EDE9E0",
        },
        amber: {
          DEFAULT: "#E8A33D",
          dark: "#C7862A",
        },
        moss: {
          DEFAULT: "#3F7A5C",
          light: "#E6F0EA",
        },
        clay: {
          DEFAULT: "#B5493B",
          light: "#F5E5E2",
        },
        line: "#D8D3C7",
      },
      fontFamily: {
        sans: ["Work Sans", "system-ui", "sans-serif"],
        mono: ["IBM Plex Mono", "ui-monospace", "monospace"],
      },
      borderRadius: {
        sm: "3px",
        DEFAULT: "5px",
      },
    },
  },
  plugins: [],
};

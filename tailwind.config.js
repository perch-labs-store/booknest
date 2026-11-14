import containerQueries from "@tailwindcss/container-queries";
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        surface: "var(--surface)",
        line: "var(--border)",
        ink: "var(--text-primary)",
        muted: "var(--text-secondary)",
        brand: "#DDB77E",
        accent: "var(--accent-text)",
        success: "#2DBE7E",
        error: "#EF4444",
        info: "#3B82F6",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        serif: ['"Playfair Display"', "Georgia", "serif"],
      },
    },
  },
  plugins: [containerQueries],
};

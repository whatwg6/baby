import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        cream: "#F7F3EC",
        surface: "#FFFFFF",
        mist: "#EEF6F3",
        primary: "#2F8F83",
        coral: "#E56F61",
        dataBlue: "#4F7DE8",
        dataYellow: "#D99A2B",
        ink: "#17221F",
        muted: "#65726D",
        line: "#DDE7E2",
        success: "#4E9F70",
        warning: "#D99A2B",
        danger: "#D95C5C",
      },
      boxShadow: {
        panel: "0 16px 40px rgba(23, 34, 31, 0.08)",
        soft: "0 8px 24px rgba(23, 34, 31, 0.07)",
      },
      borderRadius: {
        card: "8px",
      },
      fontFamily: {
        sans: ["Inter", "SF Pro Display", "SF Pro Text", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;

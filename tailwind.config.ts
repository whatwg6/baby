import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        cream: "#FAF7F2",
        primary: "#4E9F8F",
        coral: "#E98B7C",
        dataBlue: "#5B8DEF",
        dataYellow: "#E8B84A",
        ink: "#25332F",
        muted: "#6F7C76",
        line: "#E7DDD2",
        success: "#4E9F70",
        warning: "#D99A2B",
        danger: "#D95C5C",
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

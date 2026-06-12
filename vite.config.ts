import react from "@vitejs/plugin-react";
import type { UserConfig } from "vite";

type VitestConfig = UserConfig & {
  test: {
    environment: "jsdom";
    include: string[];
    setupFiles: string[];
  };
};

const config: VitestConfig = {
  plugins: [react()],
  test: {
    environment: "jsdom",
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    setupFiles: ["src/test/setup.ts"],
  },
};

export default config;

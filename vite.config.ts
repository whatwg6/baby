import react from "@vitejs/plugin-react";
import type { UserConfig } from "vite";

type VitestConfig = UserConfig & {
  test: {
    environment: "jsdom";
    setupFiles: string[];
  };
};

const config: VitestConfig = {
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["src/test/setup.ts"],
  },
};

export default config;

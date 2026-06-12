import react from "@vitejs/plugin-react";
import type { ConfigEnv, UserConfig } from "vite";

type VitestConfig = UserConfig & {
  test: {
    environment: "jsdom";
    include: string[];
    setupFiles: string[];
  };
};

function config({ command }: ConfigEnv): VitestConfig {
  return {
    base: command === "build" ? "/baby/" : "/",
    plugins: [react()],
    test: {
      environment: "jsdom",
      include: ["src/**/*.{test,spec}.{ts,tsx}"],
      setupFiles: ["src/test/setup.ts"],
    },
  };
}

export default config;

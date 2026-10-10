import nextEnv from "@next/env";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

// Load env files the way Next.js does. With NODE_ENV=test this reads .env.test and skips .env.local.
nextEnv.loadEnvConfig(process.cwd());

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          environment: "node",
          include: ["src/**/*.test.ts"],
          exclude: ["src/**/*.int.test.ts"],
        },
      },
      {
        extends: true,
        test: {
          name: "ui",
          environment: "jsdom",
          include: ["src/**/*.test.tsx"],
          setupFiles: ["src/test/setup.ts"],
        },
      },
      {
        extends: true,
        test: {
          name: "int",
          environment: "node",
          include: ["src/**/*.int.test.ts"],
          globalSetup: ["src/test/global-setup.int.ts"],
          fileParallelism: false,
        },
      },
    ],
  },
});

import { defineConfig } from "vitest/config";
import { resolve } from "path";

export default defineConfig({
  resolve: {
    alias: {
      app: resolve(__dirname, "src/app"),
    },
  },
  test: {
    include: ["cli/**/*.spec.ts"],
    passWithNoTests: true,
    globals: true,
    environment: "node",
  },
});

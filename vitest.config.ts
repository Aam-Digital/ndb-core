import { defineConfig } from "vitest/config";
import { resolve } from "path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      app: resolve(__dirname, "src/app"),
    },
  },
  test: {
    include: ["cli/**/*.spec.ts"],
    passWithNoTests: false,
    globals: true,
    environment: "node",
  },
});

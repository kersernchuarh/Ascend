import { defineConfig } from "vitest/config";
import path from "node:path";

/**
 * Deliberately minimal. The domain layer under test (`src/domain`,
 * `src/lib/format-date.ts`) is pure TypeScript with no DOM or React
 * dependency, so the fast `node` environment is enough — no jsdom needed.
 */
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
});

import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

/**
 * Scoped to the rate-limit subsystem only (see the test files it discovers
 * below) — this repository has no test runner otherwise, and backfilling
 * one for every module is a separate, larger initiative than this feature.
 * Kept intentionally minimal so a future repository-wide test setup can
 * absorb or replace it without inheriting anything rate-limit-specific.
 */
export default defineConfig({
  test: {
    include: ["src/lib/rate-limit/**/*.test.ts"],
    environment: "node",
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});

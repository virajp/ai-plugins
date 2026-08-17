import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["{cli,scripts}/src/**/*.test.ts"],
    environment: "node",
    // The adapter suites copy whole rendered trees — the OpenCode bundle alone
    // is 500+ files — so they are real filesystem work, not unit tests, and run
    // ~1.2s each on an idle machine. Against the 5s default that is fine until
    // anything else is competing for I/O, at which point they cross it and fail
    // as `Test timed out in 5000ms` rather than as anything diagnostic. That
    // turned `main` red once and cost four false alarms in a single day.
    // 30s leaves a genuine hang detectable while removing the false positives.
    testTimeout: 30_000,
  },
});

import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["{installer,scripts}/src/**/*.test.ts"],
    environment: "node",
    // The installer suites stage plugin trees into temp directories and the
    // hook-script suites spawn a real shell per case, so they are filesystem
    // and process work, not unit tests, and a case can take well over half a
    // second on an idle machine. Against the 5s default that is fine until
    // anything else is competing for I/O, at which point they cross it and fail
    // as `Test timed out in 5000ms` rather than as anything diagnostic. That
    // turned `main` red once and cost four false alarms in a single day.
    // 30s leaves a genuine hang detectable while removing the false positives.
    testTimeout: 30_000,
  },
});

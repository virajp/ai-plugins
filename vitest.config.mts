import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["{schema,build,cli}/src/**/*.test.ts"],
    environment: "node",
  },
});

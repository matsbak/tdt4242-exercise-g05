import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    setupFiles: ["./vitest.setup.js"],
    teardownTimeout: 10000,
    hookTimeout: 10000,
    fileParallelism: false,
    pool: "forks",
    coverage: {
      reporter: ["text", "lcov", "html"],
      exclude: ["index.js", "app.js", "vitest.config.js"],
    },
  },
});

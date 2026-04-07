import { defineConfig } from "vite";

import react from "@vitejs/plugin-react";

// https://vite.dev/config/

export default defineConfig({
  plugins: [react()],

  server: {
    proxy: {
      "/api": {
        target: "http://localhost:3000",

        changeOrigin: true,
      },
    },
  },

  test: {
    environment: "jsdom",
    include: [
      "src/__tests__/**/*.test.{js,jsx,ts,tsx}",
      "src/**/*.test.{js,jsx,ts,tsx}",
    ],
    setupFiles: ["src/__tests__/setupTests.js"],
    globals: true,
    coverage: {
      reporter: ["text", "lcov", "html"],
      exclude: [
        "node_modules/",
        "vite.config.*",
        "src/main.jsx",
        "src/**/index.{js,jsx,ts,tsx}",
        // Exclude Playwright end-to-end tests so they are not treated as source files
        "e2e/**",
        "**/e2e/**",
        "frontend/e2e/**",
        "src/App.jsx",
        "eslint.config.js",
        "playwright.config.js",
      ],
    },
  },
});

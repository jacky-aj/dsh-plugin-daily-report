import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["test/unit/**/*.spec.{js,jsx}"],
    environment: "node",
    coverage: {
      provider: "v8",
      include: ["src/client/**/*.{js,jsx}", "lib/**/*.js", "index.js"],
      reporter: ["text", "html", "json-summary"],
      thresholds: { lines: 85, statements: 85, functions: 80, branches: 60 },
    },
  },
});














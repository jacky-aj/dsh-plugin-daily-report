import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["test/**/*.spec.{js,jsx,mjs}"],
    environment: "node",
    // The integration suites clone throwaway repositories and hit real git. Run
    // together they routinely pass five seconds, which is a machine-speed
    // artifact rather than a hang.
    testTimeout: 20000,
    hookTimeout: 20000,
    coverage: {
      provider: "v8",
      include: ["src/client/**/*.{js,jsx}", "lib/**/*.js", "index.js"],
      reporter: ["text", "html", "json-summary"],
      thresholds: { lines: 85, statements: 85, functions: 80, branches: 60 },
    },
  },
});

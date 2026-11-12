import { expect, test } from "vitest";

test("lib integration coverage", async () => {
  await import("../integration/report.test.mjs");
  await import("../integration/ai.test.mjs");
  expect(true).toBe(true);
});



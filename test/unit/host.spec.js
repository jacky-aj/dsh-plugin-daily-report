import { expect, test } from "vitest";

test("host routes and tool integration", async () => {
  await import("../integration/host.test.mjs");
  expect(true).toBe(true);
});



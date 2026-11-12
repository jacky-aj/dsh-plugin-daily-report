// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";

import {
  daysBetween,
  decodeBase64Json,
  formatDate,
  formatExtension,
  formatShortLabel,
  normalizeClientSettings,
  triggerDownload,
} from "../../src/client/helpers.js";

describe("ESM helper foundation", () => {
  it("formats dates and date ranges", () => {
    expect(formatDate(new Date(2026, 10, 1))).toBe("2026-11-01");
  });

  it("counts days and formats extensions", () => {
    expect(daysBetween("2026-11-01", "2026-11-03")).toBe(3);
    expect(formatExtension("markdown")).toBe("md");
    expect(formatShortLabel("markdown")).toBe("Markdown");
  });

  it("normalizes settings into the client shape", () => {
    const settings = normalizeClientSettings({
      git: [{ location: "D:/repo", branch: "main", label: "repo" }],
      docs: ["D:/notes"],
      mineOnly: false,
    });
    expect(settings.git).toHaveLength(1);
    expect(settings.docs).toHaveLength(1);
    expect(settings.mineOnly).toBe(false);
  });

  it("decodes summary headers and triggers downloads", () => {
    const payload = { filename: "demo.xlsx", stats: { commits: 1 } };
    expect(decodeBase64Json(Buffer.from(JSON.stringify(payload)).toString("base64"))).toEqual(payload);
    const anchor = document.createElement("a");
    const click = vi.spyOn(anchor, "click").mockImplementation(() => {});
    vi.spyOn(document, "createElement").mockReturnValue(anchor);
    triggerDownload("blob:test", "demo.xlsx");
    expect(click).toHaveBeenCalled();
  });
});




import { describe, expect, it } from "vitest";

import { buildAiPrompt, analyzeReport, availableAiModels, aiInfo, regenerateDay } from "../../lib/ai.js";
import {
  defaultMonthRange,
  discoverGitRepositories,
  enumerateDates,
  formatLocalDateTime,
  parseIsoDate,
  sanitizeSettings,
  weekdayLabel,
} from "../../lib/collect.js";
import { buildCsvReport, buildHtmlReport, buildMarkdownReport } from "../../lib/formats.js";
import { message, normalizeLocale, t } from "../../lib/i18n.js";
import { buildReportWorkbook, fileStamp, reportFileName } from "../../lib/report.js";

function sample(locale) {
  return {
    locale,
    range: { start: "2026-11-01", end: "2026-11-02" },
    stats: { days: 2, activeDays: 2, commits: 2, docs: 1, sources: 2, okSources: 2, failedSources: 0 },
    days: [
      {
        date: "2026-11-01",
        weekday: "Saturday",
        dayType: "Weekend",
        commitCount: 1,
        docCount: 1,
        sources: "repo",
        summary: "A | B\nC",
      },
    ],
    commits: [
      {
        date: "2026-11-01",
        repo: "repo",
        branch: "main",
        shortHash: "abc1234",
        author: "Tester",
        subject: 'Fix "quoted" | case',
      },
    ],
    docs: [{ date: "2026-11-01", source: "notes", file: "note.md", title: "Note <one>", excerpt: "body & more" }],
    manualItems: [{ date: "2026-11-01", text: "meeting" }],
    ai: { ok: true, overall: "Overall <summary>", days: [{ date: "2026-11-01", summary: "AI" }] },
  };
}

describe("lib i18n", () => {
  it("normalizes and interpolates", () => {
    expect(normalizeLocale("en-US")).toBe("en");
    expect(normalizeLocale("zh-CN")).toBe("zh");
    expect(normalizeLocale("ja")).toBe("zh");
    expect(message("en", "common.dayType.weekend")).toBe("Weekend");
    expect(message("en", "missing.key")).toBe("missing.key");
    expect(t("en", "report.total.sources", { ok: 2, total: 3 })).toBe("2/3 sources readable");
  });
});

describe("lib formats", () => {
  it("renders English markdown", () => {
    const markdown = buildMarkdownReport(sample("en-US"));
    expect(markdown).toContain("# Daily report");
    expect(markdown).toContain("A \\| B<br>C");
    expect(markdown).toContain("meeting");
  });
  it("renders Chinese markdown and CSV", () => {
    expect(buildMarkdownReport(sample("zh-CN"))).toContain("# 日报汇总");
    const csv = buildCsvReport(sample("en"));
    expect(csv.startsWith("\ufeff")).toBe(true);
    expect(csv).toContain('"A | B\nC"');
  });
  it("renders escaped HTML", () => {
    const html = buildHtmlReport(sample("en"));
    expect(html).toContain('<html lang="en">');
    expect(html).toContain("Overall &lt;summary&gt;");
  });
});

describe("lib collect helpers", () => {
  it("formats weekdays and month ranges", () => {
    expect(weekdayLabel("2026-11-01", "en")).toBe("Sunday");
    expect(weekdayLabel("2026-11-01", "zh")).toBe("星期日");
    expect(weekdayLabel("bad", "en")).toBe("");
    expect(defaultMonthRange(new Date(2026, 10, 15))).toEqual({ start: "2026-11-01", end: "2026-11-30" });
  });
  it("sanitizes settings", () => {
    const settings = sanitizeSettings({
      git: [{ location: " D:/repo ", branch: " main ", label: "Repo" }, { location: "" }],
      docs: ["notes", { location: " D:/docs ", label: "Docs" }],
      aiEnabled: false,
      mineOnly: false,
      excludeMerges: false,
      aiTemplate: "detailed",
      format: "markdown",
      scheduleEnabled: true,
      scheduleFrequency: "weekly",
      scheduleTime: "09:30",
    });
    expect(settings.git).toHaveLength(1);
    expect(settings.docs).toHaveLength(2);
    expect(settings.aiEnabled).toBe(false);
    expect(settings.format).toBe("markdown");
    expect(settings.scheduleTime).toBe("09:30");
  });
});

describe("lib AI prompt", () => {
  it("handles unavailable LLM, model and empty data", async () => {
    const base = {
      range: { start: "2026-11-01", end: "2026-11-01" },
      days: [],
      commits: [],
      docs: [],
      sources: [],
      stats: { days: 1, activeDays: 0, commits: 0, docs: 0, sources: 0, okSources: 0, failedSources: 0 },
    };
    expect((await analyzeReport({ get: () => null }, base, { locale: "en" })).ok).toBe(false);
    expect((await analyzeReport({ get: (name) => (name === "llm" ? {} : null) }, base, { locale: "en" })).ok).toBe(false);
    expect(
      (
        await analyzeReport(
          {
            get: (name) =>
              name === "llm" ? {} : { currentSelection: () => ({ provider: "test", model: "mock" }) },
          },
          base,
          { locale: "en" },
        )
      ).ok,
    ).toBe(false);
    expect(await availableAiModels({ get: () => null })).toEqual([]);
  });

  it("lists models and reports AI metadata failures", async () => {
    const selection = { currentSelection: () => ({ provider: "p", model: "m", reasoningEffort: "high" }) };
    const ctx = {
      get: (name) =>
        name === "llm"
          ? {
              listModels: async (provider) => [{ id: "m1", name: "Model 1", provider }],
            }
          : selection,
    };
    expect(aiInfo(ctx)).toMatchObject({ available: true, provider: "p", model: "m", reasoningEffort: "high" });
    expect(await availableAiModels(ctx)).toEqual([{ provider: "p", id: "m1", name: "Model 1" }]);
    const failing = {
      get: (name) =>
        name === "llm"
          ? { listModels: async () => { throw new Error("down"); } }
          : { currentSelection: () => { throw new Error("bad"); } },
    };
    expect(aiInfo(failing).available).toBe(false);
    expect(await availableAiModels(failing)).toEqual([]);
  });

  it("rejects regenerate for missing or unanalyzable days", async () => {
    await expect(regenerateDay({ get: () => null }, { days: [] }, "2026-11-01", { locale: "en" })).rejects.toThrow();
    const result = {
      range: { start: "2026-11-01", end: "2026-11-01" },
      days: [{ date: "2026-11-01", commitCount: 1, docCount: 0, manualItems: [] }],
      stats: { days: 1, activeDays: 1, commits: 1, docs: 0, sources: 1, okSources: 1, failedSources: 0 },
    };
    const analysis = await regenerateDay({ get: () => null }, result, "2026-11-01", { locale: "en" });
    expect(analysis.ok).toBe(false);
  });

  it("handles empty directories and date helpers", async () => {
    const { mkdtemp, rm } = await import("node:fs/promises");
    const { tmpdir } = await import("node:os");
    const { join } = await import("node:path");
    const dir = await mkdtemp(join(tmpdir(), "daily-report-scan-"));
    try {
      expect((await discoverGitRepositories(dir)).repos).toEqual([]);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
    expect(enumerateDates("2026-11-01", "2026-11-03")).toEqual(["2026-11-01", "2026-11-02", "2026-11-03"]);
    expect(parseIsoDate("2026-02-30")).toBeNull();
    expect(formatLocalDateTime(new Date(2026, 10, 1, 8, 5))).toContain("2026-11-01");
  });

  function result() {
    return {
      locale: "en",
      range: { start: "2026-11-01", end: "2026-11-02" },
      days: [
        {
          date: "2026-11-01",
          weekday: "Saturday",
          dayType: "Weekend",
          commitCount: 1,
          docCount: 0,
          summary: "A change",
          commits: [{ repo: "repo", branch: "main", shortHash: "abc1234", subject: "Fix", diff: "diff" }],
          docs: [],
        },
      ],
    };
  }
  it("builds detailed and manager prompts", () => {
    expect(buildAiPrompt(result(), "en", { template: "detailed" })).toContain("3-5 sentences");
    expect(buildAiPrompt(result(), "en", { template: "manager" })).toContain("engineering managers");
    expect(buildAiPrompt(result(), "zh-CN", { template: "concise" })).toContain("1-2 句");
  });
});

describe("lib report", () => {
  it("puts a local timestamp in exported file names", () => {
    const at = new Date(2026, 10, 16, 14, 27, 30);
    expect(reportFileName("2026-11-01", "2026-11-30", "xlsx", at)).toBe(
      "日报汇总_2026-11-01_2026-11-30_20261116-142730.xlsx",
    );
    expect(reportFileName("2026-11-01", "2026-11-30", "markdown", at)).toBe(
      "日报汇总_2026-11-01_2026-11-30_20261116-142730.md",
    );
    expect(fileStamp(at)).toBe("20261116-142730");
  });
  it("builds minimal and full workbooks", () => {
    const minimal = buildReportWorkbook({
      locale: "en",
      range: { start: "2026-11-01", end: "2026-11-02" },
      generatedAt: new Date("2026-11-02T10:00:00+08:00"),
      stats: { days: 2, activeDays: 1, commits: 0, docs: 0, sources: 0, okSources: 0, failedSources: 0 },
      days: [{ date: "2026-11-01", weekday: "Saturday", dayType: "Weekend", commitCount: 0, docCount: 0, sources: "", summary: "", isWeekend: true }],
      commits: [],
      docs: [],
      sources: [],
      warnings: [],
      manualItems: [],
      ai: null,
    });
    expect(Buffer.isBuffer(minimal)).toBe(true);
    const full = buildReportWorkbook({
      ...sample("en"),
      sources: [],
      generatedAt: new Date("2026-11-02T10:00:00+08:00"),
      stats: { days: 2, activeDays: 1, commits: 1, docs: 1, sources: 1, okSources: 1, failedSources: 1 },
      warnings: ["warning"],
    });
    expect(full.length).toBeGreaterThan(5000);
  });
});



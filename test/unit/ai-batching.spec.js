import { describe, expect, it } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { analyzeReport, buildAiPrompt, planBatches, selectDiff, splitDiffSections } from "../../lib/ai.js";

function day(date, commits = 1) {
  return {
    date,
    weekday: "Monday",
    dayType: "Workday",
    commitCount: commits,
    docCount: 0,
    summary: "work",
    commits: Array.from({ length: commits }, (_, index) => ({
      repo: "repo",
      branch: "main",
      author: "Tester",
      subject: "commit " + index,
      visibleFiles: [{ status: "M", path: "src/file-" + index + ".js" }],
      diff: "x".repeat(2000),
    })),
    docs: [],
    manualItems: [],
  };
}

function monthResult(dayCount) {
  const days = [];
  for (let index = 0; index < dayCount; index += 1) {
    days.push(day("2026-10-" + String(index + 1).padStart(2, "0"), 8));
  }
  return {
    locale: "zh",
    range: { start: "2026-10-01", end: "2026-10-31" },
    stats: { days: dayCount, activeDays: dayCount, commits: dayCount * 8, docs: 0, sources: 1, okSources: 1, failedSources: 0 },
    days,
    commits: [],
    docs: [],
    sources: [],
    warnings: [],
  };
}

function llmContext(reply) {
  const calls = [];
  return {
    calls,
    ctx: {
      get(name) {
        if (name === "llm") {
          return {
            stream(options) {
              calls.push(options);
              return (async function* () {
                for (const chunk of reply(options, calls.length)) yield chunk;
              })();
            },
          };
        }
        if (name === "agentDefaultModel") {
          return { currentSelection: () => ({ provider: "test", model: "mock" }) };
        }
        return undefined;
      },
    },
  };
}

function jsonReply(days) {
  const body = JSON.stringify({
    overall: "overall",
    days: days.map((item) => ({
      date: item.date,
      summary: "summary " + item.date,
      highlights: ["a"],
      categories: ["b"],
    })),
  });
  return [{ type: "text-delta", text: body }, { type: "finish", reason: { kind: "stop" } }];
}

describe("prompt budgeting", () => {
  it("sends no output ceiling, leaving the model's own limit in charge", async () => {
    const result = monthResult(3);
    const { ctx, calls } = llmContext((options) => {
      const ids = String(options.messages[0].content[0].text)
        .split("\n")
        .filter((line) => /"date": "2026-10-/.test(line))
        .map((line) => line.match(/"date": "(2026-10-\d{2})"/)[1]);
      return jsonReply([...new Set(ids)].map((date) => ({ date })));
    });
    await analyzeReport(ctx, result, { locale: "zh" });
    expect(calls.length).toBeGreaterThan(0);
    for (const call of calls) {
      expect(call.maxTokens).toBeUndefined();
    }
  });

  it("keeps a month over several batches", () => {
    const entries = [];
    for (let index = 0; index < 21; index += 1) {
      entries.push({
        payload: {
          date: "2026-10-" + String(index + 1).padStart(2, "0"),
          commits: [
            {
              repo: "repo",
              subject: "commit",
              files: ["M src/a.js"],
              diff: "y".repeat(900),
            },
          ],
        },
      });
    }
    const batches = planBatches(entries);
    expect(batches.length).toBeGreaterThan(1);
    expect(batches.flat()).toHaveLength(21);
    for (const batch of batches) {
      expect(batch.length).toBeLessThanOrEqual(6);
    }
  });

  it("respects an explicit character budget", () => {
    const big = { payload: { diff: "z".repeat(5000) } };
    const batches = planBatches([big, big, big], { maxChars: 6000 });
    expect(batches).toHaveLength(3);
  });

  it("keeps a single batch for an empty list", () => {
    expect(planBatches([])).toEqual([]);
  });

  it("shrinks diffs until the prompt fits", () => {
    const result = monthResult(3);
    const prompt = buildAiPrompt(result, "zh", { days: result.days, cachedDays: [], template: "concise" });
    expect(prompt.length).toBeLessThanOrEqual(60000);
    expect(prompt).toContain("2026-10-01");
  });
});

describe("diff selection by information density", () => {
  function section(path, body) {
    return "diff --git a/" + path + " b/" + path + "\n--- a/" + path + "\n+++ b/" + path + "\n" + body;
  }

  it("splits a diff into one section per file", () => {
    const diff = [section("src/a.js", "+a"), section("src/b.js", "+b")].join("\n");
    const sections = splitDiffSections(diff);
    expect(sections.map((item) => item.path)).toEqual(["src/a.js", "src/b.js"]);
  });

  it("drops build output, lockfiles and minified bundles", () => {
    const diff = [
      section("src/real.js", "+const a = 1;"),
      section("dist/bundle.js", "+".repeat(4000)),
      section("package-lock.json", "+".repeat(4000)),
      section("public/app.min.js", "+".repeat(4000)),
    ].join("\n");
    const picked = selectDiff(diff, 1800);
    expect(picked).toContain("src/real.js");
    expect(picked).not.toContain("dist/bundle.js");
    expect(picked).not.toContain("package-lock.json");
    expect(picked).not.toContain("app.min.js");
  });

  it("keeps source changes ahead of oversized generated files", () => {
    const diff = [
      section("ta7534_ext.form", "+".repeat(4000)),
      section("src/service.java", "+return amount;"),
    ].join("\n");
    const picked = selectDiff(diff, 900);
    const sourceAt = picked.indexOf("src/service.java");
    const generatedAt = picked.indexOf("ta7534_ext.form");
    expect(sourceAt).toBeGreaterThanOrEqual(0);
    expect(sourceAt).toBeLessThan(generatedAt);
  });

  it("gives an oversized generated file only a head", () => {
    const diff = section("form/ta7500.tfml", "+".repeat(5000));
    const picked = selectDiff(diff, 1800);
    expect(picked.length).toBeLessThanOrEqual(1800);
    expect(picked.startsWith("diff --git")).toBe(true);
  });

  it("never exceeds the budget it is given", () => {
    const diff = [
      section("src/a.js", "+".repeat(3000)),
      section("src/b.js", "+".repeat(3000)),
      section("src/c.js", "+".repeat(3000)),
    ].join("\n");
    expect(selectDiff(diff, 500).length).toBeLessThanOrEqual(500);
    expect(selectDiff(diff, 0)).toBe("");
    expect(selectDiff("", 500)).toBe("");
  });

  it("falls back to a plain cut when the diff has no file headers", () => {
    const picked = selectDiff("plain diff text ".repeat(200), 100);
    expect(picked.length).toBeLessThanOrEqual(100);
  });

  it("keeps the prompt bounded for a month of noisy repositories", () => {
    const result = monthResult(30);
    for (const day of result.days) {
      for (const commit of day.commits) {
        commit.diff = [
          section("dist/app.js", "+".repeat(8000)),
          section("src/feature.js", "+".repeat(900)),
          section("pnpm-lock.yaml", "+".repeat(8000)),
        ].join("\n");
      }
    }
    const prompt = buildAiPrompt(result, "zh", { days: result.days.slice(0, 6), cachedDays: [], template: "concise" });
    expect(prompt.length).toBeLessThan(60000);
    expect(prompt).not.toContain("pnpm-lock.yaml");
  });
});

describe("month-long analysis", () => {
  it("batches the request instead of sending a month in one call", async () => {
    const result = monthResult(21);
    const { ctx, calls } = llmContext((options) => {
      const ids = String(options.messages[0].content[0].text)
        .split("\n")
        .filter((line) => /"date": "2026-10-/.test(line))
        .map((line) => line.match(/"date": "(2026-10-\d{2})"/)[1]);
      return jsonReply([...new Set(ids)].map((date) => ({ date })));
    });
    const analysis = await analyzeReport(ctx, result, { locale: "zh" });
    expect(analysis.ok).toBe(true);
    expect(calls.length).toBeGreaterThan(1);
    expect(analysis.days).toHaveLength(21);
    expect(analysis.overall.length).toBeGreaterThan(0);
    // The plugin never caps the reply; the model's own limit applies.
    for (const call of calls) {
      expect(call.maxTokens).toBeUndefined();
    }
  });

  it("splits a truncated batch and succeeds on the smaller retry", async () => {
    const result = monthResult(4);
    let call = 0;
    const { ctx, calls } = llmContext((options) => {
      call += 1;
      // First attempt (all 4 days) is cut off; the retries answer normally.
      if (call === 1) return [{ type: "finish", reason: { kind: "max-tokens" } }];
      const ids = String(options.messages[0].content[0].text)
        .split("\n")
        .filter((line) => /"date": "2026-10-/.test(line))
        .map((line) => line.match(/"date": "(2026-10-\d{2})"/)[1]);
      return jsonReply([...new Set(ids)].map((date) => ({ date })));
    });
    const analysis = await analyzeReport(ctx, result, { locale: "zh" });
    expect(analysis.ok).toBe(true);
    expect(analysis.days).toHaveLength(4);
    // The first call fails, then the batch is halved: 2 + 2.
    expect(calls.length).toBe(3);
  });

  it("reports truncation only when a single day still cannot fit", async () => {
    const result = monthResult(2);
    const { ctx, calls } = llmContext(() => [{ type: "finish", reason: { kind: "max-tokens" } }]);
    const analysis = await analyzeReport(ctx, result, { locale: "zh" });
    expect(analysis.ok).toBe(false);
    expect(analysis.error).toContain("token 上限");
    expect(analysis.error).not.toContain("空内容");
    // 2 → 1 + 1 splits, each retried, then gives up.
    expect(calls.length).toBeGreaterThanOrEqual(2);
  });

  it("explains a reasoning-only reply", async () => {
    const result = monthResult(2);
    const { ctx } = llmContext(() => [
      { type: "reasoning-delta", text: "thinking" },
      { type: "finish", reason: { kind: "stop" } },
    ]);
    const analysis = await analyzeReport(ctx, result, { locale: "zh" });
    expect(analysis.ok).toBe(false);
    expect(analysis.error).toContain("推理过程");
  });

  it("keeps the batches that succeeded when one batch hard-fails", async () => {
    const result = monthResult(12);
    let call = 0;
    const { ctx } = llmContext((options) => {
      call += 1;
      // A provider error is not recoverable by splitting; only that batch is lost.
      if (call === 2) {
        return [{ type: "finish", reason: { kind: "error", failure: { message: "provider exploded", code: "boom" } } }];
      }
      const ids = String(options.messages[0].content[0].text)
        .split("\n")
        .filter((line) => /"date": "2026-10-/.test(line))
        .map((line) => line.match(/"date": "(2026-10-\d{2})"/)[1]);
      return jsonReply([...new Set(ids)].map((date) => ({ date })));
    });
    const analysis = await analyzeReport(ctx, result, { locale: "zh" });
    expect(analysis.ok).toBe(true);
    expect(analysis.days.length).toBeGreaterThan(0);
    expect(analysis.days.length).toBeLessThan(12);
    expect(analysis.warnings.join(" ")).toContain("组日期分析失败");
  });

  it("reuses cached days without calling the model for them", async () => {
    const result = monthResult(12);
    const dir = await mkdtemp(join(tmpdir(), "daily-report-ai-cache-"));
    const cacheFile = join(dir, "ai-cache.json");
    try {
      const { ctx, calls } = llmContext((options) => {
        const ids = String(options.messages[0].content[0].text)
          .split("\n")
          .filter((line) => /"date": "2026-10-/.test(line))
          .map((line) => line.match(/"date": "(2026-10-\d{2})"/)[1]);
        return jsonReply([...new Set(ids)].map((date) => ({ date })));
      });
      const first = await analyzeReport(ctx, result, { locale: "zh", cacheFile });
      expect(first.ok).toBe(true);
      expect(first.analyzedDays).toBe(12);
      const firstCalls = calls.length;
      const second = await analyzeReport(ctx, result, { locale: "zh", cacheFile });
      expect(second.ok).toBe(true);
      expect(second.analyzedDays).toBe(0);
      expect(second.cachedDays).toBe(12);
      expect(calls.length - firstCalls).toBeLessThanOrEqual(1);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});



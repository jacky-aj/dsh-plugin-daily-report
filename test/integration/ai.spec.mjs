import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { collectReport } from "../../lib/collect.js";
import { analyzeReport, aiInfo, buildAiPrompt } from "../../lib/ai.js";
import { buildCsvReport, buildHtmlReport, buildMarkdownReport } from "../../lib/formats.js";
import { buildReportWorkbook, summarizeReport } from "../../lib/report.js";
import { test } from "vitest";

test("ai integration", async () => {

const root = mkdtempSync(join(tmpdir(), "daily-report-ai-"));
const repo = join(root, "repo");
mkdirSync(repo, { recursive: true });
function git(cwd, args, env = {}) {
  return execFileSync("git", args, {
    cwd,
    encoding: "utf8",
    env: { ...process.env, GIT_TERMINAL_PROMPT: "0", ...env },
  });
}
git(repo, ["init", "-b", "main"]);
git(repo, ["config", "user.name", "Test"]);
git(repo, ["config", "user.email", "test@example.com"]);
writeFileSync(join(repo, "feature.js"), "export function login() {\n  return true;\n}\n");
git(repo, ["add", "."]);
git(repo, ["commit", "-m", "实现登录校验"], {
  GIT_AUTHOR_DATE: "2026-11-02T10:00:00+08:00",
  GIT_COMMITTER_DATE: "2026-11-02T10:00:00+08:00",
});
writeFileSync(join(repo, "feature.js"), "export function login() {\n  return false;\n}\n");
git(repo, ["add", "."]);
git(repo, ["commit", "-m", "修复登录返回错误"], {
  GIT_AUTHOR_DATE: "2026-11-03T11:00:00+08:00",
  GIT_COMMITTER_DATE: "2026-11-03T11:00:00+08:00",
});

const progressEvents = [];
const result = await collectReport({
  settings: { git: [{ location: repo, branch: "main", label: "demo" }], docs: [] },
  start: "2026-11-01",
  end: "2026-11-30",
  cwd: root,
  homeDir: join(root, "home"),
  locale: "zh",
  includeDiff: true,
  onProgress: (event) => progressEvents.push(event.stage),
  now: new Date("2026-11-09T12:00:00+08:00"),
});
assert.equal(result.stats.commits, 2);
assert.match(result.commits[0].diff, /login/);
assert.ok(progressEvents.includes("git"));
assert.ok(progressEvents.includes("git-diff"));
assert.ok(progressEvents.includes("aggregate"));

const prompt = buildAiPrompt(result, "zh");
assert.match(prompt, /JSON/);
assert.match(prompt, /login/);

let capturedOptions = null;
let streamCalls = 0;
const ctx = {
  get(name) {
    if (name === "llm") {
      return {
        stream(options) {
          capturedOptions = options;
          streamCalls += 1;
          return (async function* () {
            yield {
              type: "text-delta",
              index: 0,
              text: JSON.stringify({
                overall: "本周期完成了登录能力实现与缺陷修复。",
                days: [
                  { date: "2026-11-02", summary: "实现登录校验逻辑。", highlights: ["新增 login 函数"], categories: ["登录"] },
                  { date: "2026-11-03", summary: "修复登录返回值错误。", highlights: ["修正 login 返回值"], categories: ["缺陷修复"] },
                ],
              }),
            };
            yield { type: "finish", reason: { kind: "stop" } };
          })();
        },
      };
    }
    if (name === "agentDefaultModel") {
      return { currentSelection: () => ({ provider: "test", model: "mock-model", reasoningEffort: "low" }) };
    }
    return undefined;
  },
};

const info = aiInfo(ctx);
assert.equal(info.available, true);
assert.equal(info.provider, "test");
assert.equal(info.reasoningEffort, "low");

const analysisProgress = [];
const cacheFile = join(root, "ai-cache.json");
const analysis = await analyzeReport(ctx, result, {
  locale: "zh",
  cacheFile,
  template: "detailed",
  onProgress: (event) => analysisProgress.push(event),
});
assert.equal(analysis.ok, true);
assert.equal(analysis.provider, "test");
assert.equal(analysis.model, "mock-model");
assert.equal(analysis.days.length, 2);
assert.match(analysis.overall, /登录/);
assert.equal(streamCalls, 1);
assert.ok(analysisProgress.some((event) => event.stage === "ai-start" && event.indeterminate === true));
assert.ok(analysisProgress.some((event) => event.stage === "ai-stream"));
assert.ok(analysisProgress.some((event) => event.stage === "ai-parse" && event.percent === 94));

const cachedAnalysis = await analyzeReport(ctx, result, { locale: "zh", cacheFile, template: "detailed" });
assert.equal(streamCalls, 1);
assert.equal(cachedAnalysis.ok, true);
assert.equal(cachedAnalysis.cachedDays, 2);
assert.equal(cachedAnalysis.analyzedDays, 0);
assert.equal(cachedAnalysis.days.length, 2);
assert.ok(capturedOptions);
assert.equal(capturedOptions.provider, "test");
assert.equal(capturedOptions.reasoningEffort, "low");
assert.match(capturedOptions.messages[0].content[0].text, /实现登录校验/);
assert.match(capturedOptions.messages[0].content[0].text, /3-5/);

result.ai = analysis;
const summary = summarizeReport(result);
assert.equal(summary.ai.ok, true);
assert.equal(summary.ai.days, undefined);
assert.match(summary.ai.overall, /登录/);
const workbook = buildReportWorkbook(result);
assert.ok(workbook.length > 5000);
const markdown = buildMarkdownReport(result);
assert.match(markdown, /# 日报汇总/);
assert.match(markdown, /实现登录校验/);
const csv = buildCsvReport(result);
assert.match(csv, /^﻿"日期"/);
const html = buildHtmlReport(result);
assert.match(html, /<html lang="zh-CN">/);
assert.match(html, /实现登录校验/);
const englishMarkdown = buildMarkdownReport({ ...result, locale: "en" });
assert.match(englishMarkdown, /# Daily report/);
assert.doesNotMatch(englishMarkdown, /日报汇总/);
const englishHtml = buildHtmlReport({ ...result, locale: "en" });
assert.match(englishHtml, /<html lang="en">/);
assert.match(englishHtml, /Daily summary/);
console.log(JSON.stringify({ ok: true, promptChars: prompt.length, workbookBytes: workbook.length, ai: summary.ai }, null, 2));
rmSync(root, { recursive: true, force: true });



});

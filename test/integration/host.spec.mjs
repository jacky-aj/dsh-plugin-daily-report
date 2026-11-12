import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, existsSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Readable } from "node:stream";

import { apply } from "../../index.js";
import { test } from "vitest";

test("host integration", async () => {

const root = mkdtempSync(join(tmpdir(), "daily-report-host-"));
process.env.DSH_HOME = join(root, "home");
const repo = join(root, "repo");
const notes = join(root, "notes");
mkdirSync(repo, { recursive: true });
mkdirSync(notes, { recursive: true });
function git(cwd, args, env = {}) {
  return execFileSync("git", args, { cwd, encoding: "utf8", env: { ...process.env, ...env } });
}
git(repo, ["init", "-b", "main"]);
git(repo, ["config", "user.name", "Test"]);
git(repo, ["config", "user.email", "test@example.com"]);
writeFileSync(join(repo, "a.js"), "a\n");
git(repo, ["add", "."]);
git(repo, ["commit", "-m", "日报插件联调"], {
  GIT_AUTHOR_DATE: "2026-11-02T10:00:00+08:00",
  GIT_COMMITTER_DATE: "2026-11-02T10:00:00+08:00",
});
writeFileSync(join(notes, "2026-11-02-记录.md"), "# 联调记录\n\n完成插件接口联调。\n");

const routes = new Map();
const tools = [];
const cleanups = [];
const ctx = {
  webServer: {
    register(route) {
      routes.set(route.path, route.handler);
      return () => routes.delete(route.path);
    },
  },
  effect(callback) {
    const dispose = callback();
    if (typeof dispose === "function") cleanups.push(dispose);
  },
  get(name) {
    if (name === "tools") {
      return {
        register(definition) {
          tools.push(definition);
          return () => {};
        },
      };
    }
    if (name === "workingDirectory") {
      return {
        defaultDirectory: root,
        get() {
          return root;
        },
        async ensure() {
          return root;
        },
      };
    }
    if (name === "sessions") {
      return { get() { return undefined; } };
    }
    return undefined;
  },
};

apply(ctx);
assert.ok(routes.has("/daily-report/state"));
assert.ok(routes.has("/daily-report/generate"));
assert.equal(tools.length, 1);
assert.equal(tools[0].name, "daily_report");

function request(url, method, body) {
  const handler = routes.get(url.split("?")[0]);
  assert.ok(handler, "route missing: " + url);
  return new Promise((resolve, reject) => {
    const req = new Readable({ read() {} });
    req.method = method;
    req.url = url;
    req.socket = { remoteAddress: "127.0.0.1" };
    const headers = {};
    const res = {
      statusCode: 200,
      setHeader(name, value) {
        headers[name.toLowerCase()] = value;
      },
      end(data) {
        resolve({ status: this.statusCode, headers, body: Buffer.isBuffer(data) ? data : Buffer.from(data || "") });
      },
    };
    handler(req, res).catch(reject);
    if (body !== undefined) req.push(JSON.stringify(body));
    req.push(null);
  });
}

const getState = await request("/daily-report/state?sessionId=", "GET");
assert.equal(getState.status, 200);
const state = JSON.parse(getState.body.toString("utf8"));
assert.equal(state.defaults.start, "2026-11-01");
assert.equal(state.defaults.end, "2026-11-30");
assert.equal(state.settings.git.length, 0);
assert.equal(state.settings.aiEnabled, true);

const putState = await request("/daily-report/state", "PUT", {
  settings: {
    git: [{ location: repo, branch: "main", label: "本地仓库" }],
    docs: [{ location: notes, label: "笔记" }],
    aiEnabled: false,
    format: "markdown",
    aiTemplate: "manager",
    authorEmails: "me@example.com",
    excludeMerges: false,
    range: { start: "2026-10-01", end: "2026-10-31" },
  },
});
assert.equal(putState.status, 200);
const savedState = await request("/daily-report/state?sessionId=", "GET");
const savedPayload = JSON.parse(savedState.body.toString("utf8"));
assert.equal(savedPayload.settings.aiEnabled, false);
assert.equal(savedPayload.settings.format, "markdown");
assert.equal(savedPayload.settings.aiTemplate, "manager");
assert.equal(savedPayload.settings.authorEmails, "me@example.com");
assert.equal(savedPayload.settings.excludeMerges, false);
assert.deepEqual(savedPayload.settings.range, { start: "2026-10-01", end: "2026-10-31" });

const generate = await request("/daily-report/generate", "POST", {
  settings: {
    git: [{ location: repo, branch: "main", label: "本地仓库" }],
    docs: [{ location: notes, label: "笔记" }],
  },
  start: "2026-11-01",
  end: "2026-11-30",
  locale: "zh",
});
assert.equal(generate.status, 200);
assert.equal(generate.headers["content-type"], "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
assert.ok(generate.body.length > 5000);
const summary = JSON.parse(Buffer.from(generate.headers["x-report-summary"], "base64").toString("utf8"));
assert.equal(summary.stats.commits, 1);
assert.equal(summary.stats.docs, 1);
assert.equal(generate.headers["x-report-filename"], encodeURIComponent("日报汇总_2026-11-01_2026-11-30.xlsx"));

const startJob = await request("/daily-report/generate/start", "POST", {
  settings: {
    git: [{ location: repo, branch: "main", label: "本地仓库" }],
    docs: [{ location: notes, label: "笔记" }],
  },
  start: "2026-11-01",
  end: "2026-11-30",
  locale: "zh",
  ai: false,
});
assert.equal(startJob.status, 202);
const startPayload = JSON.parse(startJob.body.toString("utf8"));
assert.ok(startPayload.jobId);
let jobStatus = null;
for (let attempt = 0; attempt < 50; attempt += 1) {
  const statusResponse = await request("/daily-report/job?jobId=" + encodeURIComponent(startPayload.jobId), "GET");
  assert.equal(statusResponse.status, 200);
  jobStatus = JSON.parse(statusResponse.body.toString("utf8"));
  if (jobStatus.status === "done" || jobStatus.status === "failed") break;
  await new Promise((resolve) => setTimeout(resolve, 25));
}
assert.equal(jobStatus.status, "done");
assert.equal(jobStatus.progress.percent, 100);
assert.ok(jobStatus.progress.message);
const jobFile = await request("/daily-report/job/file?jobId=" + encodeURIComponent(startPayload.jobId), "GET");
assert.equal(jobFile.status, 200);
assert.ok(jobFile.body.length > 5000);

const previewResponse = await request("/daily-report/job/preview?jobId=" + encodeURIComponent(startPayload.jobId), "GET");
assert.equal(previewResponse.status, 200);
const preview = JSON.parse(previewResponse.body.toString("utf8"));
assert.equal(preview.days.length, 30);
assert.equal(preview.stats.commits, 1);

const exportResponse = await request("/daily-report/job/export", "POST", {
  jobId: startPayload.jobId,
  edits: {
    overall: "编辑后的总体总结",
    days: [{ date: "2026-11-02", aiSummary: "编辑后的摘要", manualItems: ["参加需求评审"] }],
  },
});
assert.equal(exportResponse.status, 200);
assert.ok(exportResponse.body.length > 5000);
assert.match(decodeURIComponent(exportResponse.headers["x-report-filename"]), /\.xlsx$/);

const markdownExport = await request("/daily-report/job/export", "POST", {
  jobId: startPayload.jobId,
  format: "markdown",
  edits: { overall: "", days: [] },
});
assert.equal(markdownExport.status, 200);
assert.equal(markdownExport.headers["content-type"], "text/markdown; charset=utf-8");
assert.match(decodeURIComponent(markdownExport.headers["x-report-filename"]), /\.md$/);
assert.match(markdownExport.body.toString("utf8"), /# 日报汇总/);

const scan = await request("/daily-report/scan", "POST", { directory: root, cwd: root });
assert.equal(scan.status, 200);
const scanned = JSON.parse(scan.body.toString("utf8"));
assert.equal(scanned.repos.length, 1);
assert.equal(scanned.repos[0].branch, "main");
assert.equal(scanned.repos[0].label, "repo");

const tested = await request("/daily-report/test-sources", "POST", {
  settings: {
    git: [{ location: repo, branch: "main", label: "本地仓库" }],
    docs: [{ location: notes, label: "笔记" }],
  },
});
assert.equal(tested.status, 200);
const testedPayload = JSON.parse(tested.body.toString("utf8"));
assert.equal(testedPayload.sources.length, 2);

const cancelled = await request("/daily-report/job/cancel", "POST", { jobId: startPayload.jobId });
assert.equal(cancelled.status, 200);

const locales = await request("/daily-report/locales", "GET");
assert.equal(locales.status, 200);
const localePayload = JSON.parse(locales.body.toString("utf8"));
assert.ok(localePayload.zh["page.title"]);
assert.ok(localePayload.en["page.title"]);

const scheduleStatus = await request("/daily-report/schedule/status", "GET");
assert.equal(scheduleStatus.status, 200);const scheduleRun = await request("/daily-report/schedule/run", "POST", {});
assert.equal(scheduleRun.status, 200);
const scheduleRunPayload = JSON.parse(scheduleRun.body.toString("utf8"));
assert.equal(scheduleRunPayload.ok, true);
assert.ok(scheduleRunPayload.filename);

const invalidFile = await request("/daily-report/schedule/file?name=..%2Fsecret.xlsx", "GET");
assert.equal(invalidFile.status, 400);
const missingFile = await request("/daily-report/schedule/file?name=missing.xlsx", "GET");
assert.equal(missingFile.status, 404);
const missingJob = await request("/daily-report/job/export", "POST", { jobId: "missing" });
assert.equal(missingJob.status, 404);
const missingCancel = await request("/daily-report/job/cancel", "POST", { jobId: "missing" });
assert.equal(missingCancel.status, 404);
const noSourcesTest = await request("/daily-report/test-sources", "POST", { settings: { git: [], docs: [] } });
assert.equal(noSourcesTest.status, 400);
const emptyScan = await request("/daily-report/scan", "POST", { directory: "" });
assert.equal(emptyScan.status, 400);
const badMethod = await request("/daily-report/locales", "POST", {});
assert.equal(badMethod.status, 405);
const badStateMethod = await request("/daily-report/state", "DELETE");
assert.equal(badStateMethod.status, 405);
const badPreview = await request("/daily-report/job/preview?jobId=missing", "GET");
assert.equal(badPreview.status, 404);
const badJobFile = await request("/daily-report/job/file?jobId=missing", "GET");
assert.equal(badJobFile.status, 404);
const badRegenerate = await request("/daily-report/job/regenerate-day", "POST", { jobId: "missing", date: "2026-11-01" });
assert.equal(badRegenerate.status, 404);
const badRange = await request("/daily-report/generate", "POST", {
  settings: { git: [{ location: repo, branch: "main" }], docs: [] },
  start: "bad",
  end: "2026-11-30",
});
assert.equal(badRange.status, 400);
const noSourcesGenerate = await request("/daily-report/generate", "POST", {
  settings: { git: [], docs: [] },
  start: "2026-11-01",
  end: "2026-11-30",
});
assert.equal(noSourcesGenerate.status, 400);
const historyFile = await request(
  "/daily-report/schedule/file?name=" + encodeURIComponent(scheduleRunPayload.filename),
  "GET",
);
assert.equal(historyFile.status, 200);
const emptySettings = await request("/daily-report/state", "PUT", { settings: { git: [], docs: [] } });
assert.equal(emptySettings.status, 200);
const noSourcesSchedule = await request("/daily-report/schedule/run", "POST", {});
assert.equal(noSourcesSchedule.status, 400);
for (const [route, method] of [
  ["/daily-report/schedule/status", "POST"],
  ["/daily-report/schedule/file?name=x.xlsx", "POST"],
  ["/daily-report/test-sources", "GET"],
  ["/daily-report/scan", "GET"],
  ["/daily-report/job/cancel", "GET"],
  ["/daily-report/job/export", "GET"],
  ["/daily-report/job", "POST"],
  ["/daily-report/job/preview", "POST"],
  ["/daily-report/job/regenerate-day", "GET"],
  ["/daily-report/job/file", "POST"],
]) {
  const response = await request(route, method, {});
  assert.equal(response.status, 405, route + " " + method);
}
const badStart = await request("/daily-report/generate/start", "POST", {
  settings: { git: [{ location: repo, branch: "main" }], docs: [] },
  start: "bad",
  end: "2026-11-30",
});
assert.equal(badStart.status, 202);
const badJobId = JSON.parse(badStart.body.toString("utf8")).jobId;
let badJob = null;
for (let attempt = 0; attempt < 40; attempt += 1) {
  badJob = await request("/daily-report/job?jobId=" + encodeURIComponent(badJobId), "GET");
  const payload = JSON.parse(badJob.body.toString("utf8"));
  if (payload.status === "failed" || payload.status === "done") break;
  await new Promise((resolve) => setTimeout(resolve, 50));
}
assert.equal(JSON.parse(badJob.body.toString("utf8")).status, "failed");

const toolResult = await tools[0].execute(
  { start: "2026-11-01", end: "2026-11-30", git: [{ location: repo, branch: "main" }], docs: [notes] },
  { agent: { id: "test" }, signal: new AbortController().signal },
);
assert.ok(existsSync(toolResult.outputFile));
assert.equal(toolResult.stats.commits, 1);
const rendered = tools[0].output.render({}, toolResult);
assert.equal(rendered[0].type, "text");
assert.match(rendered[0].text, /日报已生成/);

await assert.rejects(() =>
  tools[0].execute({ start: "bad", end: "2026-11-30" }, { agent: { id: "test" }, signal: new AbortController().signal }),
);
await assert.rejects(() =>
  tools[0].execute({ start: "2026-11-01", end: "2026-11-30", git: [], docs: [] }, { agent: { id: "test" }, signal: new AbortController().signal }),
);

console.log(JSON.stringify({ ok: true, state: state.defaults, stats: summary.stats, tool: toolResult.outputFile }, null, 2));
for (const dispose of cleanups) dispose();
rmSync(root, { recursive: true, force: true });


});

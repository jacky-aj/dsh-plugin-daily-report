import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, existsSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { collectReport } from "../../lib/collect.js";
import { buildReportWorkbook, reportFileName, summarizeReport } from "../../lib/report.js";
import { test } from "vitest";

test("report integration", async () => {

const root = mkdtempSync(join(tmpdir(), "daily-report-test-"));
const repo = join(root, "repo");
const notes = join(root, "notes");
const home = join(root, "home");
mkdirSync(repo, { recursive: true });
mkdirSync(notes, { recursive: true });

function git(cwd, args, env = {}) {
  return execFileSync("git", args, {
    cwd,
    encoding: "utf8",
    env: { ...process.env, GIT_TERMINAL_PROMPT: "0", ...env },
  });
}

git(repo, ["init", "-b", "main"]);
git(repo, ["config", "user.name", "袁杰"]);
git(repo, ["config", "user.email", "yuanjie@example.com"]);

function commit(message, file, content, date, extraEnv = {}) {
  writeFileSync(join(repo, file), content, "utf8");
  git(repo, ["add", "."]);
  git(repo, ["commit", "-m", message], {
    GIT_AUTHOR_DATE: date,
    GIT_COMMITTER_DATE: date,
    ...extraEnv,
  });
}

commit("实现参数平台快捷键栏位帮助", "param.js", "export const a = 1;\n", "2026-11-01T10:00:00+08:00");
commit("修复工作台任务统计跳转", "workbench.js", "export const b = 2;\n", "2026-11-02T15:30:00+08:00");
commit("更新接口文档", "api.md", "# API\n", "2026-11-02T16:00:00+08:00");
commit("其他同事的提交", "other.js", "export const other = true;\n", "2026-11-03T10:00:00+08:00", {
  GIT_AUTHOR_NAME: "Other",
  GIT_AUTHOR_EMAIL: "other@example.com",
});

writeFileSync(join(notes, "2026-11-01-周会.md"), "# 周会记录\n\n确认参数平台本周迭代范围。\n", "utf8");
writeFileSync(join(notes, "2026-11-02-接口.md"), "# 接口讨论\n\n与柜面确认 DESB 广播字段。\n", "utf8");
writeFileSync(join(notes, "无日期笔记.txt"), "这是一条没有日期的笔记。\n", "utf8");

const result = await collectReport({
  settings: {
    git: [{ location: repo, branch: "main", label: "核心系统" }],
    docs: [{ location: notes, label: "工作笔记" }],
  },
  start: "2026-11-01",
  end: "2026-11-30",
  cwd: root,
  homeDir: home,
  locale: "zh",
  mineOnly: true,
  now: new Date("2026-11-09T12:00:00+08:00"),
});

assert.equal(result.stats.days, 30);
assert.equal(result.stats.commits, 3);
assert.equal(result.commits.every((commit) => commit.email === "yuanjie@example.com"), true);

const otherAuthorResult = await collectReport({
  settings: { git: [{ location: repo, branch: "main", label: "核心系统" }], docs: [] },
  start: "2026-11-01",
  end: "2026-11-30",
  cwd: root,
  homeDir: home,
  locale: "zh",
  mineOnly: true,
  authorEmails: ["other@example.com"],
  now: new Date("2026-11-09T12:00:00+08:00"),
});
assert.equal(otherAuthorResult.stats.commits, 1);
assert.equal(otherAuthorResult.commits[0].email, "other@example.com");
assert.equal(result.stats.docs, 3);
assert.equal(result.stats.activeDays, 3);
assert.equal(result.stats.sources, 2);
assert.equal(result.sources[0].status, "ok");
assert.match(result.days[0].summary, /快捷键/);
assert.match(result.days[1].summary, /任务统计/);
assert.match(result.days[1].summary, /接口讨论/);
assert.equal(result.days[0].isWeekend, true);

const xlsx = buildReportWorkbook(result);
assert.ok(xlsx.length > 5000);
const output = join(root, reportFileName("2026-11-01", "2026-11-30"));
writeFileSync(output, xlsx);
assert.ok(existsSync(output));

const summary = summarizeReport(result);
assert.equal(summary.stats.commits, 3);
assert.equal(summary.sources.length, 2);

// Exercise the remote-clone path with a local file:// bare repository.
const bare = join(root, "remote.git");
execFileSync("git", ["clone", "--bare", repo, bare], { encoding: "utf8" });
const remoteResult = await collectReport({
  settings: {
    git: [{ location: "file:///" + bare.replace(/\\/g, "/"), branch: "main", label: "远程仓库" }],
    docs: [],
  },
  start: "2026-11-01",
  end: "2026-11-30",
  cwd: root,
  homeDir: join(root, "home-remote"),
  locale: "zh",
  now: new Date("2026-11-09T12:00:00+08:00"),
});
assert.equal(remoteResult.stats.commits, 4);
assert.equal(remoteResult.sources[0].status, "ok");
assert.ok(existsSync(join(root, "home-remote", "daily-report", "repos")));

const remoteXlsx = buildReportWorkbook(remoteResult);
assert.ok(remoteXlsx.length > 5000);

console.log(
  JSON.stringify(
    {
      ok: true,
      output,
      stats: result.stats,
      remoteStats: remoteResult.stats,
      firstDay: result.days[0].summary,
      secondDay: result.days[1].summary,
      bytes: readFileSync(output).length,
    },
    null,
    2,
  ),
);

rmSync(root, { recursive: true, force: true });


});

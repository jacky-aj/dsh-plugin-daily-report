/**
 * Host half of the daily-report plugin.
 *
 * It owns the local HTTP endpoints used by the Web UI and registers a
 * `daily_report` tool so the agent can generate the same workbook.
 */

import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import { homedir } from "node:os";
import { basename, dirname, isAbsolute, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  collectReport,
  defaultMonthRange,
  discoverGitRepositories,
  formatLocalDate,
  formatLocalDateTime,
  parseIsoDate,
  sanitizeSettings,
} from "./lib/collect.js";
import { aiInfo, analyzeReport, availableAiModels, regenerateDay } from "./lib/ai.js";
import { buildCsvReport, buildHtmlReport, buildMarkdownReport } from "./lib/formats.js";
import { buildReportWorkbook, reportFileName, summarizeReport, buildReportPreview, applyReportEdits } from "./lib/report.js";

export const inject = ["webServer"];

const ROUTE_STATE = "/daily-report/state";
const ROUTE_LOCALES = "/daily-report/locales";
const ROUTE_GENERATE = "/daily-report/generate";
const ROUTE_START = "/daily-report/generate/start";
const ROUTE_JOB = "/daily-report/job";
const ROUTE_JOB_FILE = "/daily-report/job/file";
const ROUTE_JOB_PREVIEW = "/daily-report/job/preview";
const ROUTE_JOB_EXPORT = "/daily-report/job/export";
const ROUTE_JOB_REGENERATE = "/daily-report/job/regenerate-day";
const ROUTE_JOB_CANCEL = "/daily-report/job/cancel";
const ROUTE_SCAN = "/daily-report/scan";
const ROUTE_TEST = "/daily-report/test-sources";
const ROUTE_SCHEDULE_STATUS = "/daily-report/schedule/status";
const ROUTE_SCHEDULE_FILE = "/daily-report/schedule/file";
const ROUTE_SCHEDULE_RUN = "/daily-report/schedule/run";
const MAX_BODY = 2 * 1024 * 1024;
const MAX_RANGE_DAYS = 366;
const JOB_TTL = 60 * 60 * 1000;
const PACKAGE_ROOT = dirname(fileURLToPath(import.meta.url));
const MAX_JOBS = 20;
const jobs = new Map();
const REPORT_FORMATS = new Set(["xlsx", "markdown", "csv", "html"]);

function normalizeFormat(value) {
  return typeof value === "string" && REPORT_FORMATS.has(value) ? value : "xlsx";
}

function parseAuthorEmails(value) {
  return String(value || "")
    .split(/[,;\s]+/)
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

function formatContentType(format) {
  if (format === "markdown") return "text/markdown; charset=utf-8";
  if (format === "csv") return "text/csv; charset=utf-8";
  if (format === "html") return "text/html; charset=utf-8";
  return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
}

function buildReportBuffer(result, format) {
  if (format === "markdown") return Buffer.from(buildMarkdownReport(result), "utf8");
  if (format === "csv") return Buffer.from(buildCsvReport(result), "utf8");
  if (format === "html") return Buffer.from(buildHtmlReport(result), "utf8");
  return buildReportWorkbook(result);
}

const DEFAULT_SETTINGS = {
  git: [],
  docs: [],
  aiEnabled: true,
  mineOnly: true,
  excludeMerges: true,
  authorEmails: "",
  aiTemplate: "concise",
  aiProvider: "",
  aiModel: "",
  scheduleEnabled: false,
  scheduleFrequency: "daily",
  scheduleTime: "18:30",
  format: "xlsx",
  range: null,
};

function defaultSettings() {
  return sanitizeSettings(DEFAULT_SETTINGS);
}

function homeDirectory() {
  if (process.env.DSH_HOME && process.env.DSH_HOME.length > 0) return resolve(process.env.DSH_HOME);
  return join(homedir(), ".dsh");
}

function settingsPath() {
  return join(homeDirectory(), "daily-report", "settings.json");
}

function aiCachePath() {
  return join(homeDirectory(), "daily-report", "ai-cache.json");
}

function isLoopback(req) {
  const address = req.socket && req.socket.remoteAddress ? req.socket.remoteAddress : "";
  return address === "127.0.0.1" || address === "::1" || address === "::ffff:127.0.0.1";
}

function sendJson(res, status, body) {
  res.statusCode = status;
  res.setHeader("content-type", "application/json; charset=utf-8");
  res.setHeader("cache-control", "no-store");
  res.end(JSON.stringify(body));
}

function sendError(res, status, code, message, details) {
  const body = { error: { code, message } };
  if (details !== undefined) body.error.details = details;
  sendJson(res, status, body);
}

function sendReportFile(res, buffer, filename, summary, contentType) {
  const summaryHeader = Buffer.from(JSON.stringify(summary), "utf8").toString("base64");
  const encodedName = encodeURIComponent(filename);
  const extension = filename.includes(".") ? filename.slice(filename.lastIndexOf(".") + 1) : "xlsx";
  res.statusCode = 200;
  res.setHeader("content-type", contentType || "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("content-disposition", 'attachment; filename="daily-report.' + extension + '"; filename*=UTF-8\'\'' + encodedName);
  res.setHeader("content-length", String(buffer.length));
  res.setHeader("cache-control", "no-store");
  res.setHeader("x-report-filename", encodedName);
  res.setHeader("x-report-summary", summaryHeader);
  res.end(buffer);
}

function normalizeProgress(value) {
  const raw = value && typeof value === "object" ? value : {};
  const percent = Number(raw.percent);
  return {
    stage: typeof raw.stage === "string" ? raw.stage : "working",
    percent: Number.isFinite(percent) ? Math.max(0, Math.min(100, percent)) : 0,
    indeterminate: raw.indeterminate === true,
    message: typeof raw.message === "string" && raw.message.length > 0 ? raw.message : "正在生成日报…",
  };
}

function pruneJobs() {
  const now = Date.now();
  for (const [id, job] of jobs) {
    if (job.status !== "running" && now - job.updatedAt > JOB_TTL) jobs.delete(id);
  }
  if (jobs.size <= MAX_JOBS) return;
  const removable = Array.from(jobs.values())
    .filter((job) => job.status !== "running")
    .sort((left, right) => left.updatedAt - right.updatedAt);
  while (jobs.size > MAX_JOBS && removable.length > 0) {
    jobs.delete(removable.shift().id);
  }
}

function createJob() {
  const job = {
    id: randomUUID(),
    status: "running",
    progress: normalizeProgress({ stage: "queued", percent: 1, message: "已创建生成任务，正在准备…" }),
    createdAt: Date.now(),
    updatedAt: Date.now(),
    controller: new AbortController(),
    buffer: null,
    filename: "",
    summary: null,
    result: null,
    error: null,
  };
  jobs.set(job.id, job);
  return job;
}

async function runJob(ctx, job, body) {
  try {
    const generated = await generateFromRequest(ctx, body, job.controller.signal, (progress) => {
      job.progress = normalizeProgress(progress);
      job.updatedAt = Date.now();
    });
    job.buffer = generated.buffer;
    job.filename = generated.filename;
    job.summary = summarizeReport(generated.result);
    job.result = generated.result;
    job.status = "done";
    job.progress = normalizeProgress({ stage: "done", percent: 100, message: "日报生成完成，正在准备下载…" });
    job.updatedAt = Date.now();
  } catch (error) {
    job.updatedAt = Date.now();
    if (job.controller.signal.aborted) {
      job.status = "cancelled";
      job.error = { code: "cancelled", message: "生成已取消。" };
      job.progress = normalizeProgress({ stage: "cancelled", percent: job.progress.percent, message: "生成已取消。" });
      return;
    }
    job.status = "failed";
    job.error = {
      code: error && error.code ? error.code : "generate-failed",
      message: (error && error.message) || "生成日报失败。",
      ...(error && error.details !== undefined ? { details: error.details } : {}),
    };
    job.progress = normalizeProgress({ stage: "failed", percent: job.progress.percent, message: "生成失败。" });
  }
}

function readBody(req) {
  return new Promise((resolveBody, rejectBody) => {
    let size = 0;
    let tooLarge = false;
    const chunks = [];
    req.on("data", (chunk) => {
      if (tooLarge) return;
      size += chunk.length;
      if (size > MAX_BODY) {
        tooLarge = true;
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => {
      if (tooLarge) {
        rejectBody(new Error("body-too-large"));
        return;
      }
      try {
        resolveBody(JSON.parse(Buffer.concat(chunks).toString("utf8")));
      } catch {
        rejectBody(new Error("invalid-json"));
      }
    });
    req.on("error", rejectBody);
  });
}

async function readSettings() {
  try {
    const text = await fs.readFile(settingsPath(), "utf8");
    const parsed = JSON.parse(text);
    return { settings: sanitizeSettings(parsed && parsed.settings ? parsed.settings : parsed), saved: true, warning: "" };
  } catch (error) {
    if (error && error.code === "ENOENT") {
      return { settings: defaultSettings(), saved: false, warning: "" };
    }
    return {
      settings: defaultSettings(),
      saved: false,
      warning: "设置文件无法读取，已使用默认数据源。",
    };
  }
}

async function writeSettings(settings) {
  const file = settingsPath();
  await fs.mkdir(dirname(file), { recursive: true });
  const temporary = file + ".tmp";
  await fs.writeFile(temporary, JSON.stringify({ version: 1, settings }, null, 2), "utf8");
  await fs.rename(temporary, file);
}

function scheduleStatePath() {
  return join(homeDirectory(), "daily-report", "schedule-state.json");
}

async function readScheduleState() {
  try {
    const parsed = JSON.parse(await fs.readFile(scheduleStatePath(), "utf8"));
    return {
      lastDaily: typeof parsed.lastDaily === "string" ? parsed.lastDaily : "",
      lastWeekly: typeof parsed.lastWeekly === "string" ? parsed.lastWeekly : "",
      lastAt: typeof parsed.lastAt === "string" ? parsed.lastAt : "",
      lastStatus: parsed.lastStatus === "error" ? "error" : parsed.lastStatus === "ok" ? "ok" : "",
      lastFile: typeof parsed.lastFile === "string" ? parsed.lastFile : "",
      lastError: typeof parsed.lastError === "string" ? parsed.lastError : "",
      lastRange: parsed.lastRange && typeof parsed.lastRange === "object" ? parsed.lastRange : null,
    };
  } catch {
    return {
      lastDaily: "",
      lastWeekly: "",
      lastAt: "",
      lastStatus: "",
      lastFile: "",
      lastError: "",
      lastRange: null,
    };
  }
}

async function writeScheduleState(state) {
  const file = scheduleStatePath();
  await fs.mkdir(dirname(file), { recursive: true });
  await fs.writeFile(file, JSON.stringify(state, null, 2), "utf8");
}

function isoWeekKey(date) {
  const value = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = value.getUTCDay() || 7;
  value.setUTCDate(value.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(value.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((value - yearStart) / 86400000 + 1) / 7);
  return value.getUTCFullYear() + "-W" + String(week).padStart(2, "0");
}

function scheduledRange(frequency, now) {
  if (frequency === "weekly") {
    const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
    const sunday = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 6);
    return { start: formatLocalDate(monday), end: formatLocalDate(sunday) };
  }
  const today = formatLocalDate(now);
  return { start: today, end: today };
}

let scheduleRunning = false;

async function runScheduledReport(ctx, settings, range, now) {
  const generated = await generateFromRequest(
    ctx,
    { settings, start: range.start, end: range.end, ai: settings.aiEnabled === true, locale: "zh" },
    undefined,
  );
  const buffer = buildReportBuffer(generated.result, settings.format);
  const directory = join(homeDirectory(), "daily-report", "history");
  await fs.mkdir(directory, { recursive: true });
  const filename = reportFileName(range.start, range.end, settings.format);
  await fs.writeFile(join(directory, filename), buffer);
  return {
    filename,
    filePath: join(directory, filename),
    size: buffer.length,
    range,
    at: formatLocalDateTime(now),
  };
}

async function checkSchedule(ctx) {
  if (scheduleRunning) return;
  const { settings } = await readSettings();
  if (!settings.scheduleEnabled) return;
  const now = new Date();
  const currentTime = String(now.getHours()).padStart(2, "0") + ":" + String(now.getMinutes()).padStart(2, "0");
  if (currentTime < settings.scheduleTime) return;
  const dateKey = formatLocalDate(now);
  const weekKey = isoWeekKey(now);
  const state = await readScheduleState();
  if (settings.scheduleFrequency === "weekly") {
    if (now.getDay() !== 1 || state.lastWeekly === weekKey) return;
  } else if (state.lastDaily === dateKey) {
    return;
  }
  scheduleRunning = true;
  const range = scheduledRange(settings.scheduleFrequency, now);
  try {
    const result = await runScheduledReport(ctx, settings, range, now);
    state.lastStatus = "ok";
    state.lastFile = result.filename;
    state.lastError = "";
    state.lastRange = range;
  } catch (error) {
    state.lastStatus = "error";
    state.lastFile = "";
    state.lastError = (error && error.message) || "自动生成失败";
    state.lastRange = range;
  } finally {
    state.lastAt = formatLocalDateTime(now);
    state.lastDaily = dateKey;
    if (settings.scheduleFrequency === "weekly") state.lastWeekly = weekKey;
    await writeScheduleState(state).catch(() => {});
    scheduleRunning = false;
  }
}

async function readScheduleHistory() {
  const directory = join(homeDirectory(), "daily-report", "history");
  try {
    const entries = await fs.readdir(directory, { withFileTypes: true });
    const files = [];
    for (const entry of entries) {
      if (!entry.isFile() || !/\.(xlsx|md|csv|html)$/i.test(entry.name)) continue;
      const stat = await fs.stat(join(directory, entry.name));
      files.push({ name: entry.name, size: stat.size, mtime: stat.mtime.toISOString() });
    }
    return files.sort((left, right) => right.mtime.localeCompare(left.mtime)).slice(0, 30);
  } catch {
    return [];
  }
}

async function scheduleStatus() {
  const { settings } = await readSettings();
  const state = await readScheduleState();
  const history = await readScheduleHistory();
  if (!state.lastAt && history.length > 0) {
    const latest = history[0];
    state.lastAt = formatLocalDateTime(new Date(latest.mtime));
    state.lastFile = latest.name;
    state.lastStatus = "ok";
  }
  return {
    enabled: settings.scheduleEnabled,
    frequency: settings.scheduleFrequency,
    time: settings.scheduleTime,
    running: scheduleRunning,
    directory: join(homeDirectory(), "daily-report", "history"),
    state,
    history,
  };
}

function startScheduler(ctx) {
  const timer = setInterval(() => {
    void checkSchedule(ctx).catch(() => {});
  }, 60000);
  const first = setTimeout(() => {
    void checkSchedule(ctx).catch(() => {});
  }, 5000);
  ctx.effect(() => () => {
    clearInterval(timer);
    clearTimeout(first);
  }, "daily-report: scheduled generation");
}

function resolveCwd(ctx, sessionId) {
  try {
    const sessions = ctx.get("sessions");
    const workingDirectory = ctx.get("workingDirectory");
    if (sessions && workingDirectory && typeof sessionId === "string" && sessionId.length > 0) {
      const session = sessions.get(sessionId);
      if (session) {
        const cwd = workingDirectory.get(session);
        if (typeof cwd === "string" && cwd.length > 0) return cwd;
      }
    }
    if (typeof sessionId !== "string" || sessionId.length === 0) {
      const registry = ctx.get("workspaceRegistry");
      if (registry) {
        const workspaces = registry.list();
        const first = Array.isArray(workspaces) ? workspaces[0] : undefined;
        if (first && typeof first.path === "string" && first.path.length > 0) return first.path;
      }
    }
    if (workingDirectory && typeof workingDirectory.defaultDirectory === "string" && workingDirectory.defaultDirectory.length > 0) {
      return workingDirectory.defaultDirectory;
    }
  } catch {
    // Fall through to the process directory.
  }
  return process.cwd();
}

function validateRange(start, end) {
  const first = parseIsoDate(start);
  const last = parseIsoDate(end);
  if (!first || !last) return "invalid-range";
  if (first > last) return "invalid-range";
  const days = Math.round((last.getTime() - first.getTime()) / 86400000) + 1;
  if (days > MAX_RANGE_DAYS) return "range-too-long";
  return "";
}

async function generateFromRequest(ctx, body, signal, onProgress) {
  const report = (progress) => {
    if (typeof onProgress === "function") onProgress(progress);
  };
  report({ stage: "validate", percent: 2, message: "正在校验生成参数…" });
  const start = typeof body.start === "string" ? body.start : "";
  const end = typeof body.end === "string" ? body.end : "";
  const rangeError = validateRange(start, end);
  if (rangeError) {
    const error = new Error(rangeError === "range-too-long" ? "时间范围最长支持 366 天。" : "日期范围无效，请检查开始和结束日期。");
    error.code = rangeError;
    throw error;
  }
  const settings = sanitizeSettings(body.settings);
  if (settings.git.length === 0 && settings.docs.length === 0) {
    const error = new Error("请至少添加一个 Git 仓库或本地文档。");
    error.code = "no-sources";
    throw error;
  }
  const locale = body.locale === "en" ? "en" : "zh";
  const requestedCwd = typeof body.cwd === "string" ? body.cwd.trim() : "";
  const cwd = requestedCwd.length > 0 && isAbsolute(requestedCwd) ? resolve(requestedCwd) : resolveCwd(ctx, body.sessionId);
  const wantAi = body.ai === true;
  const result = await collectReport({
    settings,
    start,
    end,
    cwd,
    homeDir: homeDirectory(),
    locale,
    signal,
    includeDiff: wantAi,
    mineOnly: settings.mineOnly === true,
    excludeMerges: settings.excludeMerges !== false,
    authorEmails: parseAuthorEmails(settings.authorEmails),
    onProgress: report,
    now: new Date(),
  });
  if (result.stats.sources > 0 && result.stats.okSources === 0) {
    const error = new Error("所有数据源都读取失败，请检查地址、分支或文件路径。");
    error.code = "all-sources-failed";
    error.details = result.sources;
    throw error;
  }
  if (wantAi) {
    result.ai = await analyzeReport(ctx, result, {
      signal,
      locale,
      onProgress: report,
      cacheFile: aiCachePath(),
      provider: settings.aiProvider,
      model: settings.aiModel,
      template: settings.aiTemplate,
    });
    if (!result.ai.ok) {
      result.warnings.push("AI 分析未完成：" + (result.ai.error || "未知错误"));
    } else {
      for (const warning of result.ai.warnings || []) result.warnings.push("AI 分析：" + warning);
    }
  }
  report({ stage: "build", percent: 97, message: "正在生成 XLSX 工作簿…" });
  const buffer = buildReportWorkbook(result);
  report({ stage: "done", percent: 100, message: "工作簿已生成，正在准备下载…" });
  return { result, buffer, filename: reportFileName(start, end) };
}

function registerRoute(ctx, path, handler, label) {
  const dispose = ctx.webServer.register({ kind: "exact", path, handler });
  ctx.effect(() => dispose, label);
}

function ensureAbsolute(cwd, value) {
  if (typeof value !== "string" || value.trim().length === 0) return "";
  return isAbsolute(value) ? resolve(value) : resolve(cwd, value);
}

function renderToolResult(value) {
  const lines = [
    "日报已生成：" + value.outputFile,
    "范围：" + value.range.start + " ~ " + value.range.end,
    "Git 提交：" + value.stats.commits + " 条；文档：" + value.stats.docs + " 份；有记录天数：" + value.stats.activeDays + " 天",
  ];
  if (value.ai && value.ai.ok) {
    lines.push("AI 分析：" + (value.ai.overall || "见 XLSX 的 AI分析 工作表"));
  } else if (value.ai && value.ai.error) {
    lines.push("AI 分析未完成：" + value.ai.error);
  }
  if (value.warnings && value.warnings.length > 0) {
    lines.push("提示：");
    for (const warning of value.warnings.slice(0, 10)) lines.push("- " + warning);
    if (value.warnings.length > 10) lines.push("- …共 " + value.warnings.length + " 条提示");
  }
  return [{ type: "text", text: lines.join("\n") }];
}

function registerTool(ctx) {
  const tools = ctx.get("tools");
  if (!tools) return;
  const dispose = tools.register({
    name: "daily_report",
    description:
      "Generate a daily report workbook (XLSX) from one or more Git repositories/branches and local document paths. The date range defaults to the current month. Set ai=true to analyze commit diffs, commit messages and document excerpts with the current default model. Use this when the user asks for a daily, weekly, or monthly work summary exported to Excel.",
    parameters: {
      type: "object",
      additionalProperties: false,
      properties: {
        start: { type: "string", description: "Start date, inclusive, in YYYY-MM-DD format. Defaults to the first day of the current month." },
        end: { type: "string", description: "End date, inclusive, in YYYY-MM-DD format. Defaults to the last day of the current month." },
        git: {
          type: "array",
          description: "Git sources. When omitted, the saved plugin configuration is used.",
          items: {
            type: "object",
            additionalProperties: false,
            properties: {
              location: { type: "string", description: "Remote URL or local repository path." },
              branch: { type: "string", description: "Branch name. Empty means the default branch." },
              label: { type: "string", description: "Display name in the report." },
            },
            required: ["location"],
          },
        },
        docs: {
          type: "array",
          description: "Local document files or directories. When omitted, the saved plugin configuration is used.",
          items: { type: "string" },
        },
        outputPath: { type: "string", description: "Optional output path. Defaults to the session working directory." },
        ai: { type: "boolean", description: "Analyze commit diffs, commit messages and document excerpts with the current default model, then add per-day AI summaries to the workbook." },
        format: { type: "string", enum: ["xlsx", "markdown", "csv", "html"], description: "Output format. Defaults to xlsx." },
        locale: { type: "string", enum: ["zh", "en"], description: "Report language. Defaults to zh." },
      },
    },
    output: {
      schema: {
        type: "object",
        properties: {
          outputFile: { type: "string" },
          range: {
            type: "object",
            properties: {
              start: { type: "string" },
              end: { type: "string" },
            },
          },
          stats: {
            type: "object",
            properties: {
              days: { type: "number" },
              activeDays: { type: "number" },
              commits: { type: "number" },
              docs: { type: "number" },
              sources: { type: "number" },
              okSources: { type: "number" },
              failedSources: { type: "number" },
            },
          },
          sources: { type: "array", items: { type: "object" } },
          warnings: { type: "array", items: { type: "string" } },
          ai: {
            type: "object",
            properties: {
              requested: { type: "boolean" },
              ok: { type: "boolean" },
              provider: { type: "string" },
              model: { type: "string" },
              overall: { type: "string" },
              error: { type: "string" },
            },
          },
        },
      },
      render(_args, value) {
        return renderToolResult(value);
      },
    },
    async execute(args, exec) {
      const input = args && typeof args === "object" ? args : {};
      const saved = await readSettings();
      const settings = {
        git: Array.isArray(input.git) ? sanitizeSettings({ git: input.git }).git : saved.settings.git,
        docs: Array.isArray(input.docs) ? sanitizeSettings({ docs: input.docs }).docs : saved.settings.docs,
      };
      if (settings.git.length === 0 && settings.docs.length === 0) {
        throw new Error("没有配置数据源。请先在日报页面添加 Git 仓库或本地文档。");
      }
      const defaults = defaultMonthRange(new Date());
      const start = typeof input.start === "string" && input.start.length > 0 ? input.start : defaults.start;
      const end = typeof input.end === "string" && input.end.length > 0 ? input.end : defaults.end;
      const rangeError = validateRange(start, end);
      if (rangeError) {
        throw new Error(rangeError === "range-too-long" ? "时间范围最长支持 366 天。" : "日期范围无效。");
      }
      let cwd = process.cwd();
      const workingDirectory = ctx.get("workingDirectory");
      if (workingDirectory && exec.agent) {
        try {
          cwd = await workingDirectory.ensure(exec.agent, exec.signal);
        } catch {
          cwd = process.cwd();
        }
      }
      const locale = input.locale === "en" ? "en" : "zh";
      const wantAi = input.ai === true;
      const result = await collectReport({
        settings,
        start,
        end,
        cwd,
        homeDir: homeDirectory(),
        locale,
        signal: exec.signal,
        includeDiff: wantAi,
        mineOnly: settings.mineOnly === true,
        excludeMerges: settings.excludeMerges !== false,
        authorEmails: parseAuthorEmails(settings.authorEmails),
        now: new Date(),
      });
      if (result.stats.sources > 0 && result.stats.okSources === 0) {
        const error = new Error("所有数据源都读取失败，请检查地址、分支或文件路径。");
        error.details = result.sources;
        throw error;
      }
      if (wantAi) {
        result.ai = await analyzeReport(ctx, result, {
          signal: exec.signal,
          locale,
          cacheFile: aiCachePath(),
          provider: settings.aiProvider,
          model: settings.aiModel,
          template: settings.aiTemplate,
        });
        if (!result.ai.ok) {
          result.warnings.push("AI 分析未完成：" + (result.ai.error || "未知错误"));
        } else {
          for (const warning of result.ai.warnings || []) result.warnings.push("AI 分析：" + warning);
        }
      }
      const filename = reportFileName(start, end, normalizeFormat(input.format));
      const target = ensureAbsolute(cwd, input.outputPath) || join(cwd, filename);
      const buffer = buildReportBuffer(result, normalizeFormat(input.format));
      await fs.mkdir(dirname(target), { recursive: true });
      await fs.writeFile(target, buffer);
      return {
        outputFile: target,
        range: result.range,
        stats: result.stats,
        sources: result.sources,
        warnings: result.warnings,
        ai: result.ai
          ? {
              requested: true,
              ok: result.ai.ok === true,
              provider: result.ai.provider || "",
              model: result.ai.model || "",
              overall: result.ai.overall || "",
              error: result.ai.error || "",
            }
          : null,
      };
    },
    isConcurrencySafe() {
      return false;
    },
  });
  ctx.effect(() => dispose, "daily-report: agent tool");
}

export function apply(ctx) {
  registerRoute(
    ctx,
    ROUTE_LOCALES,
    async (req, res) => {
      if (!isLoopback(req)) return sendError(res, 403, "forbidden", "只允许本机访问。");
      if (req.method !== "GET") {
        res.setHeader("allow", "GET");
        return sendError(res, 405, "method-not-allowed", "请求方法不支持。");
      }
      try {
        const [zh, en] = await Promise.all([
          fs.readFile(join(PACKAGE_ROOT, "locale", "page.zh.json"), "utf8"),
          fs.readFile(join(PACKAGE_ROOT, "locale", "page.en.json"), "utf8"),
        ]);
        res.setHeader("cache-control", "no-store");
        return sendJson(res, 200, { zh: JSON.parse(zh), en: JSON.parse(en) });
      } catch (error) {
        return sendError(res, 500, "locale-failed", "读取页面语言资源失败。");
      }
    },
    "daily-report: locale resources route",
  );

  registerRoute(
    ctx,
    ROUTE_STATE,
    async (req, res) => {
      if (!isLoopback(req)) return sendError(res, 403, "forbidden", "只允许本机访问。");
      if (req.method === "GET") {
        const saved = await readSettings();
        const ai = aiInfo(ctx);
        ai.models = ai.available ? await availableAiModels(ctx) : [];
        return sendJson(res, 200, {
          settings: saved.settings,
          saved: saved.saved,
          warning: saved.warning,
          defaults: defaultMonthRange(new Date()),
          ai,
        });
      }
      if (req.method === "PUT") {
        let body;
        try {
          body = await readBody(req);
        } catch (error) {
          return sendError(res, error.message === "body-too-large" ? 413 : 400, error.message, "请求内容无效。");
        }
        const settings = sanitizeSettings(body && body.settings ? body.settings : body);
        try {
          const previous = await readSettings();
          await writeSettings(settings);
          const scheduleChanged =
            previous.settings.scheduleTime !== settings.scheduleTime ||
            previous.settings.scheduleFrequency !== settings.scheduleFrequency ||
            (!previous.settings.scheduleEnabled && settings.scheduleEnabled);
          if (scheduleChanged) {
            const state = await readScheduleState();
            state.lastDaily = "";
            state.lastWeekly = "";
            await writeScheduleState(state).catch(() => {});
          }
          return sendJson(res, 200, { ok: true, settings });
        } catch (error) {
          return sendError(res, 500, "save-failed", "保存设置失败：" + (error.message || "未知错误"));
        }
      }
      res.setHeader("allow", "GET, PUT");
      return sendError(res, 405, "method-not-allowed", "请求方法不支持。");
    },
    "daily-report: state route",
  );

  registerRoute(
    ctx,
    ROUTE_SCAN,
    async (req, res) => {
      if (!isLoopback(req)) return sendError(res, 403, "forbidden", "只允许本机访问。");
      if (req.method !== "POST") {
        res.setHeader("allow", "POST");
        return sendError(res, 405, "method-not-allowed", "请求方法不支持。");
      }
      let body;
      try {
        body = await readBody(req);
      } catch (error) {
        return sendError(res, error.message === "body-too-large" ? 413 : 400, error.message, "请求内容无效。");
      }
      const directory = typeof body.directory === "string" ? body.directory.trim() : "";
      if (directory.length === 0) return sendError(res, 400, "invalid-directory", "请填写要扫描的目录。");
      const base = typeof body.cwd === "string" && body.cwd.trim().length > 0 && isAbsolute(body.cwd.trim())
        ? resolve(body.cwd.trim())
        : resolveCwd(ctx, "");
      try {
        const found = await discoverGitRepositories(directory, { cwd: base });
        return sendJson(res, 200, found);
      } catch (error) {
        return sendError(res, 400, "scan-failed", error.message || "扫描目录失败。");
      }
    },
    "daily-report: scan route",
  );

  registerRoute(
    ctx,
    ROUTE_GENERATE,
    async (req, res) => {
      if (!isLoopback(req)) return sendError(res, 403, "forbidden", "只允许本机访问。");
      if (req.method !== "POST") {
        res.setHeader("allow", "POST");
        return sendError(res, 405, "method-not-allowed", "请求方法不支持。");
      }
      let body;
      try {
        body = await readBody(req);
      } catch (error) {
        return sendError(res, error.message === "body-too-large" ? 413 : 400, error.message, "请求内容无效。");
      }
      const controller = new AbortController();
      const abort = () => controller.abort(new Error("客户端已取消"));
      req.on("aborted", abort);
      try {
        const generated = await generateFromRequest(ctx, body || {}, controller.signal);
        sendReportFile(res, generated.buffer, generated.filename, summarizeReport(generated.result));
      } catch (error) {
        if (controller.signal.aborted) return;
        const code = error && error.code ? error.code : "generate-failed";
        const status = code === "no-sources" || code === "invalid-range" || code === "range-too-long" ? 400 : code === "all-sources-failed" ? 422 : 500;
        sendError(res, status, code, error.message || "生成日报失败。", error.details);
      } finally {
        req.off("aborted", abort);
      }
    },
    "daily-report: generate route",
  );

  registerRoute(
    ctx,
    ROUTE_START,
    async (req, res) => {
      if (!isLoopback(req)) return sendError(res, 403, "forbidden", "只允许本机访问。");
      if (req.method !== "POST") {
        res.setHeader("allow", "POST");
        return sendError(res, 405, "method-not-allowed", "请求方法不支持。");
      }
      let body;
      try {
        body = await readBody(req);
      } catch (error) {
        return sendError(res, error.message === "body-too-large" ? 413 : 400, error.message, "请求内容无效。");
      }
      pruneJobs();
      const job = createJob();
      runJob(ctx, job, body || {});
      return sendJson(res, 202, { jobId: job.id });
    },
    "daily-report: start route",
  );

  registerRoute(
    ctx,
    ROUTE_JOB,
    async (req, res) => {
      if (!isLoopback(req)) return sendError(res, 403, "forbidden", "只允许本机访问。");
      if (req.method !== "GET") {
        res.setHeader("allow", "GET");
        return sendError(res, 405, "method-not-allowed", "请求方法不支持。");
      }
      const url = new URL(req.url || "/", "http://127.0.0.1");
      const jobId = url.searchParams.get("jobId") || "";
      const job = jobs.get(jobId);
      if (!job) return sendError(res, 404, "job-not-found", "生成任务不存在或已过期。");
      return sendJson(res, 200, {
        jobId: job.id,
        status: job.status,
        progress: job.progress,
        error: job.error,
        filename: job.filename,
        size: job.buffer ? job.buffer.length : 0,
        summary: job.summary,
      });
    },
    "daily-report: job status route",
  );

  registerRoute(
    ctx,
    ROUTE_JOB_FILE,
    async (req, res) => {
      if (!isLoopback(req)) return sendError(res, 403, "forbidden", "只允许本机访问。");
      if (req.method !== "GET") {
        res.setHeader("allow", "GET");
        return sendError(res, 405, "method-not-allowed", "请求方法不支持。");
      }
      const url = new URL(req.url || "/", "http://127.0.0.1");
      const jobId = url.searchParams.get("jobId") || "";
      const job = jobs.get(jobId);
      if (!job) return sendError(res, 404, "job-not-found", "生成任务不存在或已过期。");
      if (job.status !== "done" || !job.buffer) {
        return sendError(res, 409, "job-not-ready", "生成任务尚未完成。");
      }
      return sendReportFile(res, job.buffer, job.filename, job.summary);
    },
    "daily-report: job file route",
  );

  registerRoute(
    ctx,
    ROUTE_JOB_PREVIEW,
    async (req, res) => {
      if (!isLoopback(req)) return sendError(res, 403, "forbidden", "只允许本机访问。");
      if (req.method !== "GET") {
        res.setHeader("allow", "GET");
        return sendError(res, 405, "method-not-allowed", "请求方法不支持。");
      }
      const url = new URL(req.url || "/", "http://127.0.0.1");
      const jobId = url.searchParams.get("jobId") || "";
      const job = jobs.get(jobId);
      if (!job) return sendError(res, 404, "job-not-found", "生成任务不存在或已过期。");
      if (job.status !== "done" || !job.result) return sendError(res, 409, "job-not-ready", "生成任务尚未完成。");
      return sendJson(res, 200, { jobId: job.id, ...buildReportPreview(job.result) });
    },
    "daily-report: preview route",
  );

  registerRoute(
    ctx,
    ROUTE_JOB_EXPORT,
    async (req, res) => {
      if (!isLoopback(req)) return sendError(res, 403, "forbidden", "只允许本机访问。");
      if (req.method !== "POST") {
        res.setHeader("allow", "POST");
        return sendError(res, 405, "method-not-allowed", "请求方法不支持。");
      }
      let body;
      try {
        body = await readBody(req);
      } catch (error) {
        return sendError(res, error.message === "body-too-large" ? 413 : 400, error.message, "请求内容无效。");
      }
      const job = jobs.get(typeof body.jobId === "string" ? body.jobId : "");
      if (!job) return sendError(res, 404, "job-not-found", "生成任务不存在或已过期。");
      if (job.status !== "done" || !job.result) return sendError(res, 409, "job-not-ready", "生成任务尚未完成。");
      try {
        const edited = applyReportEdits(job.result, body.edits || {});
        const format = normalizeFormat(body.format);
        const buffer = buildReportBuffer(edited, format);
        const filename = reportFileName(edited.range.start, edited.range.end, format);
        return sendReportFile(res, buffer, filename, summarizeReport(edited), formatContentType(format));
      } catch (error) {
        return sendError(res, 400, "export-failed", error.message || "导出日报失败。");
      }
    },
    "daily-report: preview export route",
  );

  registerRoute(
    ctx,
    ROUTE_JOB_REGENERATE,
    async (req, res) => {
      if (!isLoopback(req)) return sendError(res, 403, "forbidden", "只允许本机访问。");
      if (req.method !== "POST") {
        res.setHeader("allow", "POST");
        return sendError(res, 405, "method-not-allowed", "请求方法不支持。");
      }
      let body;
      try {
        body = await readBody(req);
      } catch (error) {
        return sendError(res, error.message === "body-too-large" ? 413 : 400, error.message, "请求内容无效。");
      }
      const job = jobs.get(typeof body.jobId === "string" ? body.jobId : "");
      if (!job) return sendError(res, 404, "job-not-found", "生成任务不存在或已过期。");
      if (job.status !== "done" || !job.result) return sendError(res, 409, "job-not-ready", "生成任务尚未完成。");
      const date = typeof body.date === "string" ? body.date : "";
      try {
        const regenerated = await regenerateDay(ctx, job.result, date, {
          locale: job.result.locale,
          manualItems: Array.isArray(body.manualItems) ? body.manualItems : [],
          cacheFile: aiCachePath(),
          provider: job.result.settings.aiProvider,
          model: job.result.settings.aiModel,
          template: job.result.settings.aiTemplate,
        });
        return sendJson(res, 200, regenerated);
      } catch (error) {
        return sendError(res, 400, "regenerate-failed", error.message || "重新分析失败。");
      }
    },
    "daily-report: preview regenerate route",
  );

  registerRoute(
    ctx,
    ROUTE_TEST,
    async (req, res) => {
      if (!isLoopback(req)) return sendError(res, 403, "forbidden", "只允许本机访问。");
      if (req.method !== "POST") {
        res.setHeader("allow", "POST");
        return sendError(res, 405, "method-not-allowed", "请求方法不支持。");
      }
      let body;
      try {
        body = await readBody(req);
      } catch (error) {
        return sendError(res, error.message === "body-too-large" ? 413 : 400, error.message, "请求内容无效。");
      }
      const settings = sanitizeSettings(body.settings);
      if (settings.git.length === 0 && settings.docs.length === 0) {
        return sendError(res, 400, "no-sources", "请至少添加一个 Git 仓库或本地文档。");
      }
      const today = formatLocalDate(new Date());
      try {
        const tested = await collectReport({
          settings,
          start: today,
          end: today,
          cwd: resolveCwd(ctx, body.sessionId),
          homeDir: homeDirectory(),
          locale: "zh",
          includeDiff: false,
          mineOnly: settings.mineOnly === true,
          excludeMerges: settings.excludeMerges !== false,
          authorEmails: parseAuthorEmails(settings.authorEmails),
          now: new Date(),
        });
        return sendJson(res, 200, { sources: tested.sources, warnings: tested.warnings });
      } catch (error) {
        return sendError(res, 400, "test-failed", error.message || "测试数据源失败。");
      }
    },
    "daily-report: source test route",
  );

  registerRoute(
    ctx,
    ROUTE_JOB_CANCEL,
    async (req, res) => {
      if (!isLoopback(req)) return sendError(res, 403, "forbidden", "只允许本机访问。");
      if (req.method !== "POST") {
        res.setHeader("allow", "POST");
        return sendError(res, 405, "method-not-allowed", "请求方法不支持。");
      }
      let body;
      try {
        body = await readBody(req);
      } catch {
        return sendError(res, 400, "invalid-body", "请求内容无效。");
      }
      const job = jobs.get(typeof body.jobId === "string" ? body.jobId : "");
      if (!job) return sendError(res, 404, "job-not-found", "生成任务不存在或已过期。");
      if (job.status === "done" || job.status === "failed" || job.status === "cancelled") {
        return sendJson(res, 200, { ok: true, status: job.status });
      }
      job.controller.abort(new Error("用户已取消"));
      job.status = "cancelling";
      job.progress = normalizeProgress({ stage: "cancelled", percent: job.progress.percent, message: "正在取消生成…" });
      job.updatedAt = Date.now();
      return sendJson(res, 200, { ok: true, status: job.status });
    },
    "daily-report: job cancel route",
  );

  registerRoute(
    ctx,
    ROUTE_SCHEDULE_STATUS,
    async (req, res) => {
      if (!isLoopback(req)) return sendError(res, 403, "forbidden", "只允许本机访问。");
      if (req.method !== "GET") {
        res.setHeader("allow", "GET");
        return sendError(res, 405, "method-not-allowed", "请求方法不支持。");
      }
      return sendJson(res, 200, await scheduleStatus());
    },
    "daily-report: schedule status route",
  );

  registerRoute(
    ctx,
    ROUTE_SCHEDULE_FILE,
    async (req, res) => {
      if (!isLoopback(req)) return sendError(res, 403, "forbidden", "只允许本机访问。");
      if (req.method !== "GET") {
        res.setHeader("allow", "GET");
        return sendError(res, 405, "method-not-allowed", "请求方法不支持。");
      }
      const url = new URL(req.url || "/", "http://127.0.0.1");
      const name = url.searchParams.get("name") || "";
      if (name.length === 0 || basename(name) !== name || !/\.(xlsx|md|csv|html)$/i.test(name)) {
        return sendError(res, 400, "invalid-file", "文件名无效。");
      }
      const file = join(homeDirectory(), "daily-report", "history", name);
      try {
        const data = await fs.readFile(file);
        const extension = name.slice(name.lastIndexOf(".") + 1).toLowerCase();
        const contentType =
          extension === "md"
            ? "text/markdown; charset=utf-8"
            : extension === "csv"
              ? "text/csv; charset=utf-8"
              : extension === "html"
                ? "text/html; charset=utf-8"
                : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
        res.statusCode = 200;
        res.setHeader("content-type", contentType);
        res.setHeader("content-disposition", 'attachment; filename="' + encodeURIComponent(name) + '"');
        res.setHeader("content-length", String(data.length));
        res.end(data);
      } catch {
        return sendError(res, 404, "history-not-found", "历史文件不存在。");
      }
    },
    "daily-report: schedule history file route",
  );

  registerRoute(
    ctx,
    ROUTE_SCHEDULE_RUN,
    async (req, res) => {
      if (!isLoopback(req)) return sendError(res, 403, "forbidden", "只允许本机访问。");
      if (req.method !== "POST") {
        res.setHeader("allow", "POST");
        return sendError(res, 405, "method-not-allowed", "请求方法不支持。");
      }
      if (scheduleRunning) return sendError(res, 409, "schedule-running", "已有自动生成任务正在执行。");
      const { settings } = await readSettings();
      if (settings.git.length === 0 && settings.docs.length === 0) {
        return sendError(res, 400, "no-sources", "请至少添加一个 Git 仓库或本地文档。");
      }
      const now = new Date();
      const range = scheduledRange(settings.scheduleFrequency, now);
      const state = await readScheduleState();
      scheduleRunning = true;
      try {
        const result = await runScheduledReport(ctx, settings, range, now);
        state.lastStatus = "ok";
        state.lastFile = result.filename;
        state.lastError = "";
        state.lastRange = range;
        state.lastAt = formatLocalDateTime(now);
        await writeScheduleState(state);
        return sendJson(res, 200, { ok: true, ...result, status: await scheduleStatus() });
      } catch (error) {
        state.lastStatus = "error";
        state.lastFile = "";
        state.lastError = (error && error.message) || "自动生成失败";
        state.lastRange = range;
        state.lastAt = formatLocalDateTime(now);
        await writeScheduleState(state).catch(() => {});
        return sendJson(res, 200, { ok: false, error: state.lastError, status: await scheduleStatus() });
      } finally {
        scheduleRunning = false;
      }
    },
    "daily-report: schedule run route",
  );

  registerTool(ctx);
  startScheduler(ctx);
}



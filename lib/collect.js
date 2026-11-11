/**
 * Data collection for the daily-report plugin.
 *
 * Git sources are read with the system `git` executable, so the user's normal
 * credential helper / SSH agent keeps working. Remote repositories are cloned
 * into a partial bare cache under $DSH_HOME/daily-report/repos.
 */

import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { promises as fs, existsSync } from "node:fs";
import { homedir } from "node:os";
import { basename, extname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { promisify } from "node:util";
import { inflateRawSync } from "node:zlib";

const execFileAsync = promisify(execFile);

const MAX_GIT_COMMITS = 5000;
const MAX_AI_DIFF_COMMITS = 60;
const MAX_DIFF_CHARS = 1200;
const MAX_FILES_PER_COMMIT = 50;
const MAX_DOC_FILES = 3000;
const MAX_DOC_BYTES = 2 * 1024 * 1024;
const MAX_DOC_EXCERPT = 220;
const MAX_DAY_SUMMARY = 1000;
const MAX_SCAN_DEPTH = 6;
const MAX_SCAN_REPOS = 100;
const GIT_LOG_TIMEOUT = 60000;
const GIT_CLONE_TIMEOUT = 180000;
const GIT_BUFFER = 64 * 1024 * 1024;

export const SUPPORTED_DOC_EXTENSIONS = new Set([
  ".md",
  ".markdown",
  ".mdx",
  ".txt",
  ".text",
  ".log",
  ".docx",
  ".html",
  ".htm",
]);

const IGNORED_DIRS = new Set([
  ".git",
  ".svn",
  ".hg",
  "node_modules",
  "dist",
  "build",
  "out",
  "target",
  "coverage",
  ".next",
  ".nuxt",
  ".cache",
  "__pycache__",
  ".venv",
  "venv",
  ".idea",
  ".vscode",
  "bin",
  "obj",
]);

const WEEKDAY_CN = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];
const WEEKDAY_EN = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function pad2(value) {
  return String(value).padStart(2, "0");
}

export function formatLocalDate(date) {
  return date.getFullYear() + "-" + pad2(date.getMonth() + 1) + "-" + pad2(date.getDate());
}

export function formatLocalDateTime(date) {
  return (
    formatLocalDate(date) +
    " " +
    pad2(date.getHours()) +
    ":" +
    pad2(date.getMinutes()) +
    ":" +
    pad2(date.getSeconds())
  );
}

export function parseIsoDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const year = Number(value.slice(0, 4));
  const month = Number(value.slice(5, 7));
  const day = Number(value.slice(8, 10));
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
  return date;
}

export function defaultMonthRange(now = new Date()) {
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return { start: formatLocalDate(start), end: formatLocalDate(end) };
}

export function enumerateDates(start, end) {
  const first = parseIsoDate(start);
  const last = parseIsoDate(end);
  if (!first || !last || first > last) return [];
  const dates = [];
  const cursor = new Date(first.getFullYear(), first.getMonth(), first.getDate());
  while (cursor <= last && dates.length < 400) {
    dates.push(formatLocalDate(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return dates;
}

export function weekdayLabel(dateIso, locale) {
  const date = parseIsoDate(dateIso);
  if (!date) return "";
  return locale === "en" ? WEEKDAY_EN[date.getDay()] : WEEKDAY_CN[date.getDay()];
}

function cleanText(value, maxLength) {
  if (typeof value !== "string") return "";
  const text = value.replace(/\u0000/g, "").trim();
  return maxLength > 0 ? text.slice(0, maxLength) : text;
}

export function sanitizeSettings(raw) {
  const source = raw && typeof raw === "object" ? raw : {};
  const git = Array.isArray(source.git)
    ? source.git
        .slice(0, 30)
        .map((item) => {
          const spec = item && typeof item === "object" ? item : {};
          return {
            location: cleanText(spec.location, 2000),
            branch: cleanText(spec.branch, 300),
            label: cleanText(spec.label, 120),
          };
        })
        .filter((item) => item.location.length > 0)
    : [];
  const docs = Array.isArray(source.docs)
    ? source.docs
        .slice(0, 50)
        .map((item) => {
          if (typeof item === "string") {
            return { location: cleanText(item, 2000), label: "" };
          }
          const spec = item && typeof item === "object" ? item : {};
          return {
            location: cleanText(spec.location, 2000),
            label: cleanText(spec.label, 120),
          };
        })
        .filter((item) => item.location.length > 0)
    : [];
  const range = source.range && typeof source.range === "object" ? source.range : null;
  const start = range && parseIsoDate(range.start);
  const end = range && parseIsoDate(range.end);
  return {
    git,
    docs,
    aiEnabled: source.aiEnabled !== false,
    mineOnly: source.mineOnly !== false,
    excludeMerges: source.excludeMerges !== false,
    authorEmails: cleanText(source.authorEmails, 500),
    aiTemplate: ["concise", "detailed", "manager"].includes(source.aiTemplate) ? source.aiTemplate : "concise",
    aiProvider: cleanText(source.aiProvider, 200),
    aiModel: cleanText(source.aiModel, 200),
    scheduleEnabled: source.scheduleEnabled === true,
    scheduleFrequency: source.scheduleFrequency === "weekly" ? "weekly" : "daily",
    scheduleTime: /^\d{2}:\d{2}$/.test(source.scheduleTime) ? source.scheduleTime : "18:30",
    format: ["xlsx", "markdown", "csv", "html"].includes(source.format) ? source.format : "xlsx",
    range: start && end && start <= end ? { start: range.start, end: range.end } : null,
  };
}

function run(command, args, options = {}) {
  return execFileAsync(command, args, {
    cwd: options.cwd,
    encoding: "utf8",
    timeout: options.timeout || 30000,
    maxBuffer: options.maxBuffer || GIT_BUFFER,
    windowsHide: true,
    signal: options.signal,
    env: {
      ...process.env,
      GIT_TERMINAL_PROMPT: "0",
      GIT_OPTIONAL_LOCKS: "0",
    },
  });
}

function gitErrorText(error) {
  const stderr = typeof error.stderr === "string" ? error.stderr.trim() : "";
  const stdout = typeof error.stdout === "string" ? error.stdout.trim() : "";
  const raw = stderr || stdout || error.message || "git command failed";
  const line = raw
    .split(/\r?\n/)
    .map((item) => item.trim())
    .find((item) => item.length > 0);
  return (line || "git command failed").slice(0, 400);
}

function sanitizeBranch(branch) {
  const value = cleanText(branch, 300);
  if (value.length === 0) return "";
  if (value.startsWith("-") || !/^[A-Za-z0-9._/@{}^~:+\-]+$/.test(value)) {
    throw new Error("分支名称不合法：" + value);
  }
  return value;
}

function isRemoteLocation(location, base) {
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(location)) return true;
  if (/^[^@\s]+@[^:\s]+:.+/.test(location)) return true;
  if (/^[A-Za-z]:[\\/]/.test(location) || location.startsWith("\\\\") || location.startsWith("/")) return false;
  if (existsSync(resolveLocalPath(location, base))) return false;
  return /\.git$/i.test(location);
}

function repoLabelFromLocation(location) {
  let value = location.replace(/[\\/]+$/, "");
  if (value.includes("://")) {
    try {
      const url = new URL(value);
      value = url.pathname;
    } catch {
      // Keep the raw value for scp-like URLs.
    }
  }
  if (value.includes(":") && !/^[A-Za-z]:[\\/]/.test(value)) {
    value = value.slice(value.lastIndexOf(":") + 1);
  }
  const base = basename(value).replace(/\.git$/i, "");
  return cleanText(base || "repository", 120);
}

function resolveLocalPath(location, cwd) {
  if (isAbsolute(location)) return resolve(location);
  return resolve(cwd || process.cwd(), location);
}

export async function discoverGitRepositories(directory, options = {}) {
  const root = resolveLocalPath(directory, options.cwd || process.cwd());
  let rootStat;
  try {
    rootStat = await fs.stat(root);
  } catch {
    throw new Error("目录不存在：" + root);
  }
  if (!rootStat.isDirectory()) throw new Error("路径不是目录：" + root);

  const repos = [];
  const warnings = [];
  const signal = options.signal;

  async function walk(current, depth) {
    if (signal && signal.aborted) throw signal.reason || new Error("已取消");
    if (repos.length >= MAX_SCAN_REPOS) {
      warnings.push("Git 仓库数量超过上限 " + MAX_SCAN_REPOS + " 个，仅添加前 " + MAX_SCAN_REPOS + " 个。");
      return;
    }
    let entries;
    try {
      entries = await fs.readdir(current, { withFileTypes: true });
    } catch (error) {
      warnings.push("无法读取目录 " + current + "：" + (error.message || "未知错误"));
      return;
    }
    const isRepo = entries.some((entry) => entry.name === ".git");
    if (isRepo) {
      try {
        let branch = (await run("git", ["-C", current, "branch", "--show-current"], { timeout: 5000, signal })).stdout.trim();
        if (branch.length === 0) {
          branch = (await run("git", ["-C", current, "rev-parse", "--short", "HEAD"], { timeout: 5000, signal })).stdout.trim();
        }
        const rel = displayPath(relative(root, current));
        repos.push({
          location: current,
          branch,
          label: rel.length > 0 ? rel : basename(root),
        });
      } catch (error) {
        if (signal && signal.aborted) throw signal.reason || error;
        warnings.push("跳过无法读取的 Git 仓库 " + current + "：" + gitErrorText(error));
      }
      return;
    }
    if (depth >= MAX_SCAN_DEPTH) return;
    entries.sort((left, right) => left.name.localeCompare(right.name));
    for (const entry of entries) {
      if (!entry.isDirectory() || entry.isSymbolicLink()) continue;
      if (entry.name.startsWith(".") || IGNORED_DIRS.has(entry.name)) continue;
      await walk(join(current, entry.name), depth + 1);
    }
  }

  await walk(root, 0);
  return { root, repos, warnings };
}

function makeCacheKey(location, branch) {
  return createHash("sha1").update(location + "\u0000" + branch).digest("hex").slice(0, 20);
}

async function pathIsDirectory(path) {
  try {
    return (await fs.stat(path)).isDirectory();
  } catch {
    return false;
  }
}

async function cloneRemote(location, branch, cacheRoot, signal) {
  await fs.mkdir(cacheRoot, { recursive: true });
  const dir = join(cacheRoot, makeCacheKey(location, branch));
  const existed = await pathIsDirectory(dir);
  let fetched = false;
  let warning = "";

  if (!existed) {
    const baseArgs = ["clone", "--bare", "--single-branch", "--no-tags"];
    if (branch.length > 0) baseArgs.push("--branch", branch);
    baseArgs.push("--filter=blob:none", location, dir);
    try {
      await run("git", baseArgs, { timeout: GIT_CLONE_TIMEOUT, signal });
    } catch (error) {
      await fs.rm(dir, { recursive: true, force: true }).catch(() => {});
      const fallbackArgs = ["clone", "--bare", "--single-branch", "--no-tags"];
      if (branch.length > 0) fallbackArgs.push("--branch", branch);
      fallbackArgs.push(location, dir);
      try {
        await run("git", fallbackArgs, { timeout: GIT_CLONE_TIMEOUT, signal });
      } catch (fallbackError) {
        throw new Error("克隆仓库失败：" + gitErrorText(fallbackError || error));
      }
      warning = "服务器不支持 blob 过滤，已退回完整克隆。";
    }
  } else {
    const fetchArgs = ["--git-dir", dir, "fetch", "--prune", "--no-tags"];
    if (branch.length > 0) {
      fetchArgs.push("origin", branch);
    } else {
      fetchArgs.push("origin", "HEAD");
    }
    try {
      await run("git", fetchArgs, { timeout: GIT_CLONE_TIMEOUT, signal });
      fetched = true;
    } catch (error) {
      warning = "拉取更新失败，使用本地缓存：" + gitErrorText(error);
    }
  }

  const rev = fetched ? "FETCH_HEAD" : branch.length > 0 ? branch : "HEAD";
  return { dir, rev, warning };
}

function parseNameStatus(line) {
  const text = line.trim();
  if (text.length === 0) return null;
  const parts = text.split("\t");
  if (parts.length < 2) return null;
  const statusCode = parts[0].charAt(0);
  const label =
    {
      A: "新增",
      M: "修改",
      D: "删除",
      R: "重命名",
      C: "复制",
      T: "类型变更",
      U: "冲突",
    }[statusCode] || statusCode;
  return { status: label, path: parts.slice(1).join("\t") };
}

function compactDiff(text, maxLength) {
  const lines = text.split(/\r?\n/).filter((line) => {
    const trimmed = line.trim();
    if (trimmed.length === 0) return false;
    return !/^(index |--- |\+\+\+ |new file mode |deleted file mode |similarity index |rename from |rename to |Binary files )/.test(trimmed);
  });
  const joined = lines.join("\n").trim();
  return joined.length > maxLength ? joined.slice(0, maxLength) + "…" : joined;
}

function parseGitLog(output, range) {
  const commits = [];
  const chunks = output.split("\u001e");
  for (const chunk of chunks) {
    const text = chunk.replace(/^\r?\n/, "");
    if (text.trim().length === 0) continue;
    const lines = text.split(/\r?\n/);
    const header = lines.shift() || "";
    const fields = header.split("\u001f");
    if (fields.length < 5) continue;
    const [hash, author, email, dateIso, subject] = fields;
    const date = new Date(dateIso);
    if (Number.isNaN(date.getTime())) continue;
    const dateKey = formatLocalDate(date);
    if (dateKey < range.start || dateKey > range.end) continue;
    const files = [];
    for (const line of lines) {
      const parsed = parseNameStatus(line);
      if (parsed) files.push(parsed);
    }
    commits.push({
      hash,
      shortHash: hash.slice(0, 8),
      author: cleanText(author, 120),
      email: cleanText(email, 200),
      date: dateKey,
      time: formatLocalDateTime(date),
      isoTime: date.toISOString(),
      subject: cleanText(subject, 500) || "(无提交说明)",
      files,
      fileCount: files.length,
      filesTruncated: files.length > MAX_FILES_PER_COMMIT,
      visibleFiles: files.slice(0, MAX_FILES_PER_COMMIT),
    });
  }
  commits.sort((left, right) => (left.isoTime < right.isoTime ? -1 : left.isoTime > right.isoTime ? 1 : 0));
  return commits;
}

async function resolveAuthorIdentity(repoDir, signal) {
  let email = "";
  let name = "";
  try {
    email = (await run("git", ["-C", repoDir, "config", "user.email"], { timeout: 5000, signal })).stdout.trim();
  } catch {
    email = "";
  }
  try {
    name = (await run("git", ["-C", repoDir, "config", "user.name"], { timeout: 5000, signal })).stdout.trim();
  } catch {
    name = "";
  }
  return {
    emails: email.length > 0 ? [email.toLowerCase()] : [],
    names: name.length > 0 ? [name.toLowerCase()] : [],
  };
}

function matchesAuthor(commit, identity) {
  if (!identity || (identity.emails.length === 0 && identity.names.length === 0)) return true;
  const email = typeof commit.email === "string" ? commit.email.toLowerCase() : "";
  const name = typeof commit.author === "string" ? commit.author.toLowerCase() : "";
  return identity.emails.includes(email) || identity.names.includes(name);
}

async function collectGitSource(spec, range, context) {
  const location = spec.location;
  const branch = sanitizeBranch(spec.branch);
  const label = spec.label || repoLabelFromLocation(location);
  const warnings = [];
  let repoDir;
  let rev;
  let remote = false;

  if (isRemoteLocation(location, context.cwd)) {
    remote = true;
    const cloned = await cloneRemote(location, branch, context.cacheRoot, context.signal);
    repoDir = cloned.dir;
    rev = cloned.rev;
    if (cloned.warning) warnings.push(cloned.warning);
  } else {
    repoDir = resolveLocalPath(location, context.cwd);
    if (!(await pathIsDirectory(repoDir))) {
      throw new Error("本地仓库路径不存在：" + repoDir);
    }
    rev = branch || "HEAD";
  }

  const args = [
    "-C",
    repoDir,
    "log",
    rev,
    "--since=" + range.start + "T00:00:00",
    "--until=" + range.end + "T23:59:59",
    "--date=iso-strict",
    "--pretty=format:%x1e%H%x1f%an%x1f%ae%x1f%ad%x1f%s",
    "--name-status",
    "--no-renames",
    "--max-count=" + MAX_GIT_COMMITS,
  ];
  if (context.excludeMerges) args.splice(args.length - 1, 0, "--no-merges");
  let output;
  try {
    output = (await run("git", args, { timeout: GIT_LOG_TIMEOUT, signal: context.signal })).stdout;
  } catch (error) {
    if (rev === "FETCH_HEAD") {
      try {
        const fallback = args.slice();
        fallback[3] = branch || "HEAD";
        output = (await run("git", fallback, { timeout: GIT_LOG_TIMEOUT, signal: context.signal })).stdout;
      } catch (fallbackError) {
        throw new Error("读取 Git 记录失败：" + gitErrorText(fallbackError || error));
      }
    } else {
      throw new Error("读取 Git 记录失败：" + gitErrorText(error));
    }
  }

  let commits = parseGitLog(output, range);
  let authorNote = "";
  if (context.mineOnly) {
    const overrideEmails = Array.isArray(context.authorEmails) ? context.authorEmails : [];
    const identity =
      overrideEmails.length > 0
        ? { emails: overrideEmails, names: [] }
        : await resolveAuthorIdentity(repoDir, context.signal);
    if (identity.emails.length === 0 && identity.names.length === 0) {
      warnings.push("未找到当前 Git 用户身份，未按作者过滤。");
    } else {
      const beforeFilter = commits.length;
      commits = commits.filter((commit) => matchesAuthor(commit, identity));
      authorNote = "仅统计 " + (identity.emails[0] || identity.names[0]);
      if (beforeFilter > 0 && commits.length === 0) {
        warnings.push("没有匹配当前 Git 用户 " + (identity.emails[0] || identity.names[0]) + " 的提交，请检查 `git config user.email`。");
      }
    }
  }
  if (context.excludeMerges) {
    authorNote = authorNote.length > 0 ? authorNote + "，已排除 merge" : "已排除 merge";
  }
  if (context.includeDiff) {
    let diffFailures = 0;
    const candidates = commits.slice(0, MAX_AI_DIFF_COMMITS);
    for (let index = 0; index < candidates.length; index += 1) {
      const commit = candidates[index];
      if (typeof context.onDiffProgress === "function") {
        context.onDiffProgress(index + 1, candidates.length);
      }
      if (commit.files.length === 0) continue;
      try {
        const diff = await run(
          "git",
          ["-C", repoDir, "show", "--format=", "--unified=1", "--no-color", "--no-ext-diff", "--no-renames", commit.hash],
          { timeout: 20000, signal: context.signal, maxBuffer: 16 * 1024 * 1024 },
        );
        commit.diff = compactDiff(diff.stdout, MAX_DIFF_CHARS);
      } catch (error) {
        if (context.signal && context.signal.aborted) throw context.signal.reason || error;
        diffFailures += 1;
        commit.diff = "";
      }
    }
    if (commits.length > MAX_AI_DIFF_COMMITS) {
      warnings.push("提交较多，AI 分析只读取前 " + MAX_AI_DIFF_COMMITS + " 条提交的代码差异。");
    }
    if (diffFailures > 0) {
      warnings.push(diffFailures + " 条提交的代码差异读取失败，AI 分析将仅使用提交说明。");
    }
  }
  if (commits.length >= MAX_GIT_COMMITS) {
    warnings.push("提交数量达到上限 " + MAX_GIT_COMMITS + " 条，日报仅包含最近部分。");
  }
  return {
    kind: "git",
    label,
    location,
    branch: branch || "(默认分支)",
    remote,
    status: warnings.length > 0 ? "warn" : "ok",
    message: (warnings.join(" ") || "读取成功") + (authorNote ? "（" + authorNote + "）" : ""),
    warnings,
    commits,
  };
}

function decodeTextBuffer(buffer) {
  if (buffer.length >= 3 && buffer[0] === 0xef && buffer[1] === 0xbb && buffer[2] === 0xbf) {
    return buffer.subarray(3).toString("utf8");
  }
  if (buffer.length >= 2 && buffer[0] === 0xff && buffer[1] === 0xfe) {
    return buffer.subarray(2).toString("utf16le");
  }
  if (buffer.length >= 2 && buffer[0] === 0xfe && buffer[1] === 0xff) {
    const swapped = Buffer.from(buffer.subarray(2));
    swapped.swap16();
    return swapped.toString("utf16le");
  }
  return buffer.toString("utf8");
}

function decodeXmlEntities(value) {
  return value
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16)))
    .replace(/&amp;/g, "&");
}

function readZipEntry(buffer, wantedName) {
  let eocd = -1;
  for (let i = buffer.length - 22; i >= 0 && i >= buffer.length - 65557; i -= 1) {
    if (buffer.readUInt32LE(i) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) throw new Error("DOCX 不是有效的 ZIP 文件");
  const count = buffer.readUInt16LE(eocd + 10);
  const centralOffset = buffer.readUInt32LE(eocd + 16);
  let cursor = centralOffset;
  for (let i = 0; i < count; i += 1) {
    if (cursor + 46 > buffer.length || buffer.readUInt32LE(cursor) !== 0x02014b50) break;
    const method = buffer.readUInt16LE(cursor + 10);
    const compressedSize = buffer.readUInt32LE(cursor + 20);
    const nameLength = buffer.readUInt16LE(cursor + 28);
    const extraLength = buffer.readUInt16LE(cursor + 30);
    const commentLength = buffer.readUInt16LE(cursor + 32);
    const localOffset = buffer.readUInt32LE(cursor + 42);
    const name = buffer.toString("utf8", cursor + 46, cursor + 46 + nameLength);
    if (name === wantedName) {
      if (buffer.readUInt32LE(localOffset) !== 0x04034b50) break;
      const localNameLength = buffer.readUInt16LE(localOffset + 26);
      const localExtraLength = buffer.readUInt16LE(localOffset + 28);
      const dataStart = localOffset + 30 + localNameLength + localExtraLength;
      const compressed = buffer.subarray(dataStart, dataStart + compressedSize);
      if (method === 0) return compressed;
      if (method === 8) return inflateRawSync(compressed);
      throw new Error("DOCX 使用了不支持的压缩算法");
    }
    cursor += 46 + nameLength + extraLength + commentLength;
  }
  return null;
}

function docxToText(buffer) {
  const xmlBuffer = readZipEntry(buffer, "word/document.xml");
  if (!xmlBuffer) return "";
  let text = xmlBuffer.toString("utf8");
  text = text
    .replace(/<w:tab[^>]*\/>/g, "\t")
    .replace(/<w:br[^>]*\/>/g, "\n")
    .replace(/<\/w:p>/g, "\n")
    .replace(/<[^>]+>/g, "");
  return decodeXmlEntities(text).replace(/\n{3,}/g, "\n\n").trim();
}

function htmlToText(value) {
  let text = value
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|h[1-6]|tr|section|article)>/gi, "\n")
    .replace(/<[^>]+>/g, " ");
  return decodeXmlEntities(text).replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
}

function stripMarkdown(value) {
  return value
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[*_~>#]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function detectDateFromName(name) {
  const patterns = [
    /(20\d{2})[-_.年](\d{1,2})[-_.月](\d{1,2})/,
    /(20\d{2})(\d{2})(\d{2})/,
  ];
  for (const pattern of patterns) {
    const match = name.match(pattern);
    if (!match) continue;
    const iso = match[1] + "-" + pad2(Number(match[2])) + "-" + pad2(Number(match[3]));
    if (parseIsoDate(iso)) return iso;
  }
  return "";
}

function detectDateFromText(text) {
  const head = text.slice(0, 2000);
  const match = head.match(/^(?:date|日期|created|创建日期)\s*[:：]\s*['"]?(20\d{2})[-/.](\d{1,2})[-/.](\d{1,2})/im);
  if (!match) return "";
  const iso = match[1] + "-" + pad2(Number(match[2])) + "-" + pad2(Number(match[3]));
  return parseIsoDate(iso) ? iso : "";
}

function detectTitle(text, fileName) {
  const head = text.slice(0, 2500);
  const front = head.match(/^title\s*[:：]\s*(.+)$/im);
  if (front) {
    const value = stripMarkdown(front[1].replace(/^['"]|['"]$/g, ""));
    if (value) return value.slice(0, 100);
  }
  const heading = head.match(/^#{1,6}\s+(.+)$/m);
  if (heading) {
    const value = stripMarkdown(heading[1]);
    if (value) return value.slice(0, 100);
  }
  for (const line of text.split(/\r?\n/)) {
    const value = stripMarkdown(line);
    if (value.length > 0) return value.slice(0, 100);
  }
  return basename(fileName, extname(fileName)).slice(0, 100) || "未命名文档";
}

function buildExcerpt(text, title) {
  let body = text.replace(/^---[\s\S]*?---\s*/m, "");
  body = stripMarkdown(body);
  if (title && body.startsWith(title)) {
    body = body.slice(title.length).trim();
  }
  if (body.length === 0) return "";
  return body.slice(0, MAX_DOC_EXCERPT) + (body.length > MAX_DOC_EXCERPT ? "…" : "");
}

async function readDocFile(filePath) {
  const extension = extname(filePath).toLowerCase();
  const buffer = await fs.readFile(filePath);
  let text = "";
  if (extension === ".docx") {
    text = docxToText(buffer);
  } else if (extension === ".html" || extension === ".htm") {
    text = htmlToText(decodeTextBuffer(buffer));
  } else {
    text = decodeTextBuffer(buffer);
  }
  return { extension, text };
}

async function walkDocs(root, current, state, output) {
  if (state.truncated) return;
  let entries;
  try {
    entries = await fs.readdir(current, { withFileTypes: true });
  } catch (error) {
    state.warnings.push("无法读取目录 " + current + "：" + (error.message || "未知错误"));
    return;
  }
  entries.sort((left, right) => left.name.localeCompare(right.name));
  for (const entry of entries) {
    if (state.truncated) return;
    if (entry.isSymbolicLink()) continue;
    const full = join(current, entry.name);
    if (entry.isDirectory()) {
      if (IGNORED_DIRS.has(entry.name)) continue;
      await walkDocs(root, full, state, output);
      continue;
    }
    if (!entry.isFile()) continue;
    const extension = extname(entry.name).toLowerCase();
    if (!SUPPORTED_DOC_EXTENSIONS.has(extension)) continue;
    if (output.length >= MAX_DOC_FILES) {
      state.truncated = true;
      state.warnings.push("文档数量超过上限 " + MAX_DOC_FILES + " 个，仅扫描前 " + MAX_DOC_FILES + " 个。");
      return;
    }
    let stat;
    try {
      stat = await fs.stat(full);
    } catch {
      continue;
    }
    if (!stat.isFile()) continue;
    if (stat.size > MAX_DOC_BYTES) {
      state.warnings.push("跳过超过 2 MB 的文件：" + relative(root, full));
      continue;
    }
    if (stat.size === 0) continue;
    output.push({ full, relative: relative(root, full), stat });
  }
}

function displayPath(value) {
  return value.split(sep).join("/");
}

async function collectDocsSource(spec, range, context) {
  const location = resolveLocalPath(spec.location, context.cwd);
  const label = spec.label || cleanText(basename(location), 120) || "文档";
  let stat;
  try {
    stat = await fs.stat(location);
  } catch {
    throw new Error("路径不存在：" + location);
  }
  const root = stat.isDirectory() ? location : resolve(location, "..");
  const candidates = [];
  const warnings = [];
  if (stat.isFile()) {
    const extension = extname(location).toLowerCase();
    if (!SUPPORTED_DOC_EXTENSIONS.has(extension)) {
      throw new Error("不支持的文档类型：" + extension + "（支持 " + Array.from(SUPPORTED_DOC_EXTENSIONS).join("、") + "）");
    }
    if (stat.size > MAX_DOC_BYTES) throw new Error("文件超过 2 MB：" + location);
    candidates.push({ full: location, relative: basename(location), stat });
  } else if (stat.isDirectory()) {
    await walkDocs(location, location, { warnings, truncated: false }, candidates);
  } else {
    throw new Error("路径不是文件或目录：" + location);
  }

  const docs = [];
  for (const candidate of candidates) {
    if (context.signal && context.signal.aborted) throw context.signal.reason || new Error("已取消");
    let parsed;
    try {
      parsed = await readDocFile(candidate.full);
    } catch (error) {
      warnings.push("读取失败：" + candidate.relative + "（" + (error.message || "未知错误") + "）");
      continue;
    }
    const fileDate = detectDateFromName(candidate.relative);
    const textDate = detectDateFromText(parsed.text);
    const date = fileDate || textDate || formatLocalDate(candidate.stat.mtime);
    if (date < range.start || date > range.end) continue;
    const title = detectTitle(parsed.text, candidate.relative);
    docs.push({
      date,
      source: label,
      file: displayPath(candidate.relative),
      absolutePath: candidate.full,
      title,
      excerpt: buildExcerpt(parsed.text, title),
      size: candidate.stat.size,
      mtime: formatLocalDateTime(candidate.stat.mtime),
      extension: parsed.extension.replace(/^\./, "").toUpperCase(),
      dateFrom: fileDate ? "文件名" : textDate ? "文档日期" : "修改时间",
    });
  }
  docs.sort((left, right) => (left.date < right.date ? -1 : left.date > right.date ? 1 : left.file.localeCompare(right.file)));
  return {
    kind: "docs",
    label,
    location,
    branch: "",
    remote: false,
    status: warnings.length > 0 ? "warn" : "ok",
    message: warnings.length > 0 ? warnings.join(" ") : "读取成功",
    warnings,
    docs,
    fileCount: candidates.length,
  };
}

function resolveHome(homeDir) {
  if (typeof homeDir === "string" && homeDir.length > 0) return homeDir;
  if (process.env.DSH_HOME && process.env.DSH_HOME.length > 0) return process.env.DSH_HOME;
  return join(homedir(), ".dsh");
}

function uniqueStrings(values) {
  const seen = new Set();
  const output = [];
  for (const value of values) {
    const text = cleanText(value, 300);
    if (text.length === 0 || seen.has(text)) continue;
    seen.add(text);
    output.push(text);
  }
  return output;
}

function buildDays(range, commits, docs, locale) {
  const byDate = new Map();
  for (const date of enumerateDates(range.start, range.end)) {
    byDate.set(date, { date, commits: [], docs: [] });
  }
  for (const commit of commits) {
    if (byDate.has(commit.date)) byDate.get(commit.date).commits.push(commit);
  }
  for (const doc of docs) {
    if (byDate.has(doc.date)) byDate.get(doc.date).docs.push(doc);
  }

  const days = [];
  for (const [date, bucket] of byDate) {
    const dateValue = parseIsoDate(date);
    const isWeekend = dateValue ? dateValue.getDay() === 0 || dateValue.getDay() === 6 : false;
    const subjectGroups = new Map();
    for (const commit of bucket.commits) {
      if (!subjectGroups.has(commit.repo)) subjectGroups.set(commit.repo, []);
      subjectGroups.get(commit.repo).push(commit.subject);
    }
    const parts = [];
    for (const [repo, subjects] of subjectGroups) {
      const unique = uniqueStrings(subjects);
      const visible = unique.slice(0, 6);
      const suffix = unique.length > visible.length ? " 等 " + unique.length + " 项" : "";
      parts.push("【" + repo + "】" + visible.join("；") + suffix);
    }
    if (bucket.docs.length > 0) {
      const titles = uniqueStrings(bucket.docs.map((doc) => doc.title)).slice(0, 8);
      const suffix = bucket.docs.length > titles.length ? " 等 " + bucket.docs.length + " 份" : "";
      parts.push("【文档】" + titles.join("；") + suffix);
    }
    let summary = parts.join("；") || "无记录";
    if (summary.length > MAX_DAY_SUMMARY) summary = summary.slice(0, MAX_DAY_SUMMARY) + "…";
    const sources = uniqueStrings([
      ...bucket.commits.map((commit) => commit.repo),
      ...bucket.docs.map((doc) => doc.source),
    ]);
    days.push({
      date,
      weekday: weekdayLabel(date, locale),
      isWeekend,
      dayType: isWeekend ? (locale === "en" ? "Weekend" : "周末") : locale === "en" ? "Workday" : "工作日",
      commitCount: bucket.commits.length,
      docCount: bucket.docs.length,
      sources: sources.join(locale === "en" ? ", " : "、"),
      summary,
      commits: bucket.commits,
      docs: bucket.docs,
    });
  }
  return days;
}

export async function collectReport(options) {
  const settings = sanitizeSettings(options.settings);
  const start = options.start;
  const end = options.end;
  const locale = options.locale === "en" ? "en" : "zh";
  const signal = options.signal;
  const cwd = options.cwd || process.cwd();
  const cacheRoot = join(resolveHome(options.homeDir), "daily-report", "repos");
  const context = {
    cwd,
    cacheRoot,
    signal,
    includeDiff: options.includeDiff === true,
    mineOnly: options.mineOnly === true,
    excludeMerges: options.excludeMerges !== false,
    authorEmails: Array.isArray(options.authorEmails) ? options.authorEmails : [],
  };
  const range = { start, end };
  const warnings = [];
  const sources = [];
  const commits = [];
  const docs = [];
  const report = (progress) => {
    if (typeof options.onProgress === "function") options.onProgress(progress);
  };

  if (settings.git.length === 0 && settings.docs.length === 0) {
    throw new Error("请至少添加一个 Git 仓库或本地文档。");
  }

  const gitTotal = settings.git.length;
  for (let index = 0; index < gitTotal; index += 1) {
    const spec = settings.git[index];
    const label = spec.label || repoLabelFromLocation(spec.location);
    const basePercent = 5 + (index / Math.max(1, gitTotal)) * 35;
    report({
      stage: "git",
      percent: basePercent,
      message: "正在读取 Git 仓库 " + (index + 1) + "/" + gitTotal + "：" + label,
    });
    try {
      const source = await collectGitSource(spec, range, {
        ...context,
        onDiffProgress: (current, total) => {
          report({
            stage: "git-diff",
            percent: 5 + ((index + current / Math.max(1, total)) / Math.max(1, gitTotal)) * 35,
            message: "正在读取代码变更：" + label + "（" + current + "/" + total + "）",
          });
        },
      });
      for (const commit of source.commits) {
        commit.repo = source.label;
        commit.branch = source.branch;
      }
      commits.push(...source.commits);
      for (const warning of source.warnings) warnings.push(source.label + "：" + warning);
      sources.push({
        kind: "git",
        label: source.label,
        location: source.location,
        branch: source.branch,
        status: source.status,
        message: source.message,
        count: source.commits.length,
      });
    } catch (error) {
      if (signal && signal.aborted) throw signal.reason || error;
      sources.push({
        kind: "git",
        label,
        location: spec.location,
        branch: spec.branch || "(默认分支)",
        status: "error",
        message: error.message || "读取失败",
        count: 0,
      });
      warnings.push((spec.label || spec.location) + "：" + (error.message || "读取失败"));
    }
  }
  report({ stage: "git-done", percent: 42, message: "Git 数据读取完成，正在扫描本地文档…" });

  const docTotal = settings.docs.length;
  for (let index = 0; index < docTotal; index += 1) {
    const spec = settings.docs[index];
    report({
      stage: "docs",
      percent: 44 + (index / Math.max(1, docTotal)) * 22,
      message: "正在扫描文档 " + (index + 1) + "/" + docTotal + "：" + (spec.label || basename(spec.location) || spec.location),
    });
    try {
      const source = await collectDocsSource(spec, range, context);
      docs.push(...source.docs);
      for (const warning of source.warnings) warnings.push(source.label + "：" + warning);
      sources.push({
        kind: "docs",
        label: source.label,
        location: source.location,
        branch: "",
        status: source.status,
        message: source.message,
        count: source.docs.length,
      });
    } catch (error) {
      if (signal && signal.aborted) throw signal.reason || error;
      sources.push({
        kind: "docs",
        label: spec.label || basename(spec.location) || "文档",
        location: spec.location,
        branch: "",
        status: "error",
        message: error.message || "读取失败",
        count: 0,
      });
      warnings.push((spec.label || spec.location) + "：" + (error.message || "读取失败"));
    }
  }
  report({ stage: "aggregate", percent: 68, message: "正在整理按天日报…" });

  const days = buildDays(range, commits, docs, locale);
  const activeDays = days.filter((day) => day.commitCount + day.docCount > 0).length;
  const stats = {
    days: days.length,
    activeDays,
    commits: commits.length,
    docs: docs.length,
    sources: sources.length,
    okSources: sources.filter((source) => source.status !== "error").length,
    failedSources: sources.filter((source) => source.status === "error").length,
  };

  return {
    range,
    days,
    commits,
    docs,
    sources,
    warnings: uniqueStrings(warnings),
    stats,
    settings,
    locale,
    generatedAt: options.now instanceof Date ? options.now : new Date(),
  };
}

export { parseGitLog };

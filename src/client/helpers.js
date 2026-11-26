import React from "react";

export const NS = "daily-report";
export const API = "/daily-report";

// Shared pure helpers and translation hook.

export function useTranslate(ctx) {
  const [, force] = React.useState(0);
  React.useEffect(() => {
    return ctx.locale.subscribe(() => force((value) => value + 1));
  }, [ctx]);
  const bound = ctx.locale.bind(NS);
  return function translate(key, fallback) {
    const value = bound(key);
    if (value === key && typeof fallback === "string") return fallback;
    return value;
  };
}

export function uid() {
  return (
    "s" + Math.random().toString(36).slice(2, 9) + Date.now().toString(36)
  );
}
export function pad2(value) {
  return String(value).padStart(2, "0");
}
export function formatDate(date) {
  return (
    date.getFullYear() +
    "-" +
    pad2(date.getMonth() + 1) +
    "-" +
    pad2(date.getDate())
  );
}
export function currentMonthRange() {
  const now = new Date();
  return {
    start: formatDate(new Date(now.getFullYear(), now.getMonth(), 1)),
    end: formatDate(new Date(now.getFullYear(), now.getMonth() + 1, 0)),
  };
}
export function lastMonthRange() {
  const now = new Date();
  return {
    start: formatDate(new Date(now.getFullYear(), now.getMonth() - 1, 1)),
    end: formatDate(new Date(now.getFullYear(), now.getMonth(), 0)),
  };
}
export function last7Range() {
  const now = new Date();
  const start = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() - 6,
  );
  return {
    start: formatDate(start),
    end: formatDate(now),
  };
}
export function yesterdayRange() {
  const now = new Date();
  const yesterday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() - 1,
  );
  return {
    start: formatDate(yesterday),
    end: formatDate(yesterday),
  };
}
export function thisWeekRange() {
  const now = new Date();
  const mondayOffset = (now.getDay() + 6) % 7;
  const monday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() - mondayOffset,
  );
  return {
    start: formatDate(monday),
    end: formatDate(now),
  };
}
export function daysBetween(start, end) {
  if (!start || !end) return 0;
  const first = new Date(start + "T00:00:00");
  const last = new Date(end + "T00:00:00");
  if (Number.isNaN(first.getTime()) || Number.isNaN(last.getTime()))
    return 0;
  return Math.round((last.getTime() - first.getTime()) / 86400000) + 1;
}
export function normalizeClientSettings(raw) {
  const source = raw && typeof raw === "object" ? raw : {};
  const groups = normalizeGroups(source, source.git, source.docs);
  const activeId =
    typeof source.activeGroupId === "string" ? source.activeGroupId : "";
  const active =
    groups.find((group) => group.id === activeId) || groups[0];
  const git = active.git;
  const docs = active.docs;
  return {
    groups,
    activeGroupId: active.id,
    git,
    docs,
    mineOnly: source.mineOnly !== false,
    excludeMerges: source.excludeMerges !== false,
    authorEmails:
      typeof source.authorEmails === "string" ? source.authorEmails : "",
    aiTemplate: ["concise", "detailed", "manager"].includes(
      source.aiTemplate,
    )
      ? source.aiTemplate
      : "concise",
    aiProvider:
      typeof source.aiProvider === "string" ? source.aiProvider : "",
    aiModel: typeof source.aiModel === "string" ? source.aiModel : "",
    scheduleEnabled: source.scheduleEnabled === true,
    scheduleFrequency:
      source.scheduleFrequency === "weekly" ? "weekly" : "daily",
    scheduleTime:
      typeof source.scheduleTime === "string"
        ? source.scheduleTime
        : "18:30",
  };
}
export function cleanSettings(settings, aiEnabled, range, format) {
  const active = activeGroupOf(settings);
  const cleanGit = (list) =>
    (Array.isArray(list) ? list : [])
      .map((item) => ({
        location: (item.location || "").trim(),
        branch: (item.branch || "").trim(),
        label: (item.label || "").trim(),
      }))
      .filter((item) => item.location.length > 0);
  const cleanDocs = (list) =>
    (Array.isArray(list) ? list : [])
      .map((item) => ({
        location: (item.location || "").trim(),
        label: (item.label || "").trim(),
      }))
      .filter((item) => item.location.length > 0);
  const groups = groupsOf(settings).map((group) => ({
    id: group.id,
    name: group.name,
    git: cleanGit(group.git),
    docs: cleanDocs(group.docs),
  }));
  return {
    git: cleanGit(active.git),
    docs: cleanDocs(active.docs),
    groups,
    activeGroupId: active.id,
    aiEnabled: aiEnabled !== false,
    mineOnly: settings.mineOnly !== false,
    excludeMerges: settings.excludeMerges !== false,
    authorEmails: (settings.authorEmails || "").trim(),
    aiTemplate: ["concise", "detailed", "manager"].includes(
      settings.aiTemplate,
    )
      ? settings.aiTemplate
      : "concise",
    aiProvider: (settings.aiProvider || "").trim(),
    aiModel: (settings.aiModel || "").trim(),
    scheduleEnabled: settings.scheduleEnabled === true,
    scheduleFrequency:
      settings.scheduleFrequency === "weekly" ? "weekly" : "daily",
    scheduleTime: /^\d{2}:\d{2}$/.test(settings.scheduleTime)
      ? settings.scheduleTime
      : "18:30",
    format: FORMAT_OPTIONS.includes(format) ? format : "xlsx",
    range:
      range &&
      typeof range.start === "string" &&
      typeof range.end === "string"
        ? {
            start: range.start,
            end: range.end,
          }
        : null,
  };
}
export function decodeBase64Json(value) {
  const binary = window.atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1)
    bytes[i] = binary.charCodeAt(i);
  return JSON.parse(new TextDecoder().decode(bytes));
}
export function triggerDownload(url, filename) {
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  link.remove();
}
export function currentLocaleId(ctx) {
  try {
    const snapshot = ctx.locale.getLocale();
    return snapshot && typeof snapshot.id === "string" ? snapshot.id : "zh";
  } catch {
    return "zh";
  }
}
export const FORMAT_OPTIONS = ["xlsx", "markdown", "csv", "html"];
export const DEFAULT_GROUP_ID = "default";

/**
 * Data sources live in named groups so one installation can keep several sets
 * (per product, per customer, ...) and switch between them. `git`/`docs` at the
 * top level stay in sync with the active group: they are what the Host reads
 * and what an older settings file already contains.
 */
export function normalizeGroups(raw, fallbackGit, fallbackDocs) {
  const source = raw && typeof raw === "object" ? raw : {};
  const list = Array.isArray(source.groups) ? source.groups : [];
  const groups = [];
  for (const item of list) {
    const spec = item && typeof item === "object" ? item : {};
    const id = typeof spec.id === "string" && spec.id.length > 0 ? spec.id : uid();
    const git = normalizeGitList(spec.git);
    const docs = normalizeDocList(spec.docs);
    groups.push({
      id,
      name:
        typeof spec.name === "string" && spec.name.trim().length > 0
          ? spec.name.trim()
          : "未命名分组",
      git,
      docs,
    });
  }
  if (groups.length === 0) {
    groups.push({
      id: DEFAULT_GROUP_ID,
      name: source.groupName || "默认分组",
      git: normalizeGitList(fallbackGit),
      docs: normalizeDocList(fallbackDocs),
    });
  }
  return groups;
}

export function normalizeGitList(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.map((item) => {
    const value = item && typeof item === "object" ? item : {};
    return {
      _key: uid(),
      location: typeof value.location === "string" ? value.location : "",
      branch: typeof value.branch === "string" ? value.branch : "",
      label: typeof value.label === "string" ? value.label : "",
    };
  });
}

export function normalizeDocList(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.map((item) => {
    const value =
      typeof item === "string" ? { location: item, label: "" } : item || {};
    return {
      _key: uid(),
      location: typeof value.location === "string" ? value.location : "",
      label: typeof value.label === "string" ? value.label : "",
    };
  });
}

/** Groups of a settings object, always at least one. */
export function groupsOf(settings) {
  const source = settings && typeof settings === "object" ? settings : {};
  return normalizeGroups(source, source.git, source.docs);
}

export function activeGroupOf(settings) {
  const groups = groupsOf(settings);
  const id = settings && typeof settings.activeGroupId === "string" ? settings.activeGroupId : "";
  return groups.find((group) => group.id === id) || groups[0];
}

/**
 * Replace groups and keep the top-level arrays pointed at the active group.
 * Every mutation goes through here so the two representations cannot drift.
 */
export function withGroups(settings, groups, activeGroupId) {
  const list = groups.length > 0 ? groups : normalizeGroups({}, settings.git, settings.docs);
  const active = list.find((group) => group.id === activeGroupId) || list[0];
  return {
    ...settings,
    groups: list,
    activeGroupId: active.id,
    git: active.git,
    docs: active.docs,
  };
}

/** Rewrite the active group's sources. */
export function withActiveSources(settings, patch) {
  const active = activeGroupOf(settings);
  const groups = groupsOf(settings).map((group) =>
    group.id === active.id ? { ...group, ...patch } : group,
  );
  return withGroups(settings, groups, active.id);
}

export function formatLabel(format, t) {
  if (format === "markdown") return t("format.markdown", "Markdown");
  if (format === "csv") return t("format.csv", "CSV");
  if (format === "html") return t("format.html", "HTML");
  return t("format.xlsx", "XLSX");
}
export function formatExtension(format) {
  return format === "markdown" ? "md" : format;
}
export function formatShortLabel(format) {
  return format === "markdown" ? "Markdown" : format.toUpperCase();
}



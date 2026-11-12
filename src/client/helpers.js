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
  const git = Array.isArray(source.git)
    ? source.git.map((item) => ({
        _key: uid(),
        location: typeof item.location === "string" ? item.location : "",
        branch: typeof item.branch === "string" ? item.branch : "",
        label: typeof item.label === "string" ? item.label : "",
      }))
    : [];
  const docs = Array.isArray(source.docs)
    ? source.docs.map((item) => {
        const value =
          typeof item === "string"
            ? {
                location: item,
                label: "",
              }
            : item || {};
        return {
          _key: uid(),
          location:
            typeof value.location === "string" ? value.location : "",
          label: typeof value.label === "string" ? value.label : "",
        };
      })
    : [];
  return {
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
  return {
    git: settings.git
      .map((item) => ({
        location: item.location.trim(),
        branch: item.branch.trim(),
        label: item.label.trim(),
      }))
      .filter((item) => item.location.length > 0),
    docs: settings.docs
      .map((item) => ({
        location: item.location.trim(),
        label: item.label.trim(),
      }))
      .filter((item) => item.location.length > 0),
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



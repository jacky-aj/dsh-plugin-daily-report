/**
 * Workbook rendering for collected daily-report data.
 */

import { formatLocalDateTime } from "./collect.js";
import { message, normalizeLocale, t } from "./i18n.js";
import { buildXlsx, styles } from "./xlsx.js";

function statusLabel(status, locale) {
  if (status === "error") return t(locale, "report.status.error");
  if (status === "warn") return t(locale, "report.status.warn");
  return t(locale, "report.status.ok");
}

function typeLabel(kind, locale) {
  if (kind === "git") return "Git";
  return t(locale, "report.type.docs");
}

function commitFileText(commit, locale) {
  const items = (commit.visibleFiles || []).map((file) => file.status + " " + file.path);
  let text = items.length > 0 ? items.join(t(locale, "common.itemSeparator")) : "—";
  if (commit.filesTruncated) {
    text += t(locale, "report.fileMore", { count: commit.fileCount });
  }
  return text;
}

function pad(value, size = 2) {
  return String(value).padStart(size, "0");
}

// Local-time stamp used in exported file names, e.g. 20261116-142730.
export function fileStamp(now = new Date()) {
  return (
    now.getFullYear() +
    pad(now.getMonth() + 1) +
    pad(now.getDate()) +
    "-" +
    pad(now.getHours()) +
    pad(now.getMinutes()) +
    pad(now.getSeconds())
  );
}

export function reportFileName(start, end, format = "xlsx", now = new Date()) {
  const extension = format === "markdown" ? "md" : format === "html" || format === "csv" ? format : "xlsx";
  return "日报汇总_" + start + "_" + end + "_" + fileStamp(now) + "." + extension;
}

export function summarizeReport(result) {
  return {
    range: result.range,
    stats: result.stats,
    sources: result.sources.map((source) => ({
      kind: source.kind,
      label: source.label,
      location: source.location,
      branch: source.branch,
      status: source.status,
      message: source.message,
      count: source.count,
    })),
    warnings: result.warnings.slice(0, 20),
    ai: result.ai
      ? {
          requested: result.ai.requested === true,
          ok: result.ai.ok === true,
          provider: result.ai.provider || "",
          model: result.ai.model || "",
          overall: (result.ai.overall || "").slice(0, 3000),
          error: result.ai.error || "",
          warnings: (result.ai.warnings || []).slice(0, 10),
          cachedDays: Number(result.ai.cachedDays) || 0,
          analyzedDays: Number(result.ai.analyzedDays) || 0,
        }
      : null,
    generatedAt: result.generatedAt.toISOString(),
  };
}

export function buildReportPreview(result) {
  const ai = result.ai && result.ai.ok ? result.ai : null;
  const aiDays = new Map((ai && Array.isArray(ai.days) ? ai.days : []).map((day) => [day.date, day]));
  const manualByDate = new Map();
  for (const item of result.manualItems || []) {
    if (!item || typeof item.date !== "string" || typeof item.text !== "string") continue;
    if (!manualByDate.has(item.date)) manualByDate.set(item.date, []);
    manualByDate.get(item.date).push(item.text);
  }
  return {
    range: result.range,
    stats: result.stats,
    sources: result.sources,
    warnings: result.warnings,
    ai: result.ai
      ? {
          ok: result.ai.ok === true,
          provider: result.ai.provider || "",
          model: result.ai.model || "",
          overall: result.ai.overall || "",
          error: result.ai.error || "",
          cachedDays: Number(result.ai.cachedDays) || 0,
          analyzedDays: Number(result.ai.analyzedDays) || 0,
        }
      : null,
    days: result.days.map((day) => {
      const dayAi = aiDays.get(day.date);
      return {
        date: day.date,
        weekday: day.weekday,
        dayType: day.dayType,
        commitCount: day.commitCount,
        docCount: day.docCount,
        sources: day.sources || "",
        summary: day.summary,
        aiSummary: dayAi ? dayAi.summary || "" : "",
        aiHighlights: dayAi ? dayAi.highlights || [] : [],
        aiCategories: dayAi ? dayAi.categories || [] : [],
        manualItems: manualByDate.get(day.date) || [],
      };
    }),
  };
}

export function applyReportEdits(result, edits) {
  const source = edits && typeof edits === "object" ? edits : {};
  const next = { ...result };
  if (result.ai && result.ai.ok) {
    const existing = new Map((result.ai.days || []).map((day) => [day.date, day]));
    for (const edit of Array.isArray(source.days) ? source.days : []) {
      if (!edit || typeof edit.date !== "string") continue;
      const aiSummary = typeof edit.aiSummary === "string" ? edit.aiSummary.trim() : "";
      const aiHighlights = Array.isArray(edit.aiHighlights) ? edit.aiHighlights.map((item) => String(item).trim()).filter(Boolean).slice(0, 5) : [];
      const aiCategories = Array.isArray(edit.aiCategories) ? edit.aiCategories.map((item) => String(item).trim()).filter(Boolean).slice(0, 5) : [];
      if (aiSummary.length === 0 && aiHighlights.length === 0 && aiCategories.length === 0) {
        existing.delete(edit.date);
      } else {
        existing.set(edit.date, { date: edit.date, summary: aiSummary, highlights: aiHighlights, categories: aiCategories });
      }
    }
    next.ai = {
      ...result.ai,
      overall: typeof source.overall === "string" ? source.overall.trim() : result.ai.overall,
      days: result.days.filter((day) => existing.has(day.date)).map((day) => existing.get(day.date)),
      warnings: result.ai.warnings || [],
    };
  }
  const manualItems = [];
  for (const edit of Array.isArray(source.days) ? source.days : []) {
    if (!edit || typeof edit.date !== "string") continue;
    for (const text of Array.isArray(edit.manualItems) ? edit.manualItems : []) {
      const value = typeof text === "string" ? text.trim() : "";
      if (value.length > 0) manualItems.push({ date: edit.date, text: value });
    }
  }
  next.manualItems = manualItems;
  return next;
}

export function buildReportWorkbook(result) {
  const locale = normalizeLocale(result.locale);
  const { days, commits, docs, sources, warnings, stats, range, generatedAt } = result;
  const ai = result.ai && result.ai.ok ? result.ai : null;
  const aiDays = new Map((ai && Array.isArray(ai.days) ? ai.days : []).map((day) => [day.date, day]));
  const manualByDate = new Map();
  for (const item of result.manualItems || []) {
    if (!item || typeof item.date !== "string" || typeof item.text !== "string" || item.text.trim().length === 0) continue;
    if (!manualByDate.has(item.date)) manualByDate.set(item.date, []);
    manualByDate.get(item.date).push(item.text.trim());
  }
  const hasManual = manualByDate.size > 0;
  const manualCount = Array.from(manualByDate.values()).reduce((sum, list) => sum + list.length, 0);

  const summaryHeaders = [...message(locale, "report.summaryHeaders")];
  if (hasManual) summaryHeaders.push(t(locale, "report.notes.manual"));
  if (ai) summaryHeaders.push(t(locale, "report.notes.ai"));
  const summaryRows = [summaryHeaders];
  const summaryStyles = {};
  for (const day of days) {
    const row = [
      day.date,
      day.weekday,
      day.dayType,
      day.commitCount,
      day.docCount,
      day.sources || "—",
      day.summary,
    ];
    if (hasManual) row.push((manualByDate.get(day.date) || []).join(t(locale, "common.itemSeparator")));
    if (ai) row.push((aiDays.get(day.date) && aiDays.get(day.date).summary) || "");
    summaryRows.push(row);
    if (day.isWeekend) summaryStyles[summaryRows.length - 1] = styles.weekend;
  }
  const totalRow = [
    t(locale, "report.total.label"),
    "",
    "",
    stats.commits,
    stats.docs,
    t(locale, "report.total.sources", { ok: stats.okSources, total: stats.sources }),
    t(locale, "report.total.days", { active: stats.activeDays, days: stats.days }),
  ];
  if (hasManual) totalRow.push("");
  if (ai) totalRow.push(ai.overall ? t(locale, "report.total.ai") : "");
  summaryRows.push(totalRow);
  summaryStyles[summaryRows.length - 1] = styles.total;

  const gitRows = [message(locale, "report.gitHeaders")];
  for (const commit of commits) {
    gitRows.push([
      commit.date,
      commit.repo,
      commit.branch,
      commit.shortHash,
      commit.author,
      commit.time,
      commit.subject,
      commit.fileCount,
      commitFileText(commit, locale),
    ]);
  }
  if (commits.length === 0) {
    gitRows.push([t(locale, "report.empty.git")]);
  }

  const docRows = [message(locale, "report.docsHeaders")];
  for (const doc of docs) {
    docRows.push([
      doc.date,
      doc.source,
      doc.file,
      doc.title,
      doc.excerpt || "—",
      Math.max(1, Math.round(doc.size / 1024)),
      doc.mtime,
    ]);
  }
  if (docs.length === 0) {
    docRows.push([t(locale, "report.empty.docs")]);
  }

  const sourceRows = [message(locale, "report.sourcesHeaders")];
  for (const source of sources) {
    sourceRows.push([
      typeLabel(source.kind, locale),
      source.label,
      source.location,
      source.branch || "—",
      statusLabel(source.status, locale),
      source.count,
      source.message,
    ]);
  }
  if (sources.length === 0) {
    sourceRows.push(["—", t(locale, "report.empty.sources")]);
  }

  const notes = [
    [{ value: t(locale, "report.notes.title"), style: styles.title }],
    [t(locale, "report.notes.range"), t(locale, "report.notes.rangeValue", { start: range.start, end: range.end, days: stats.days })],
    [t(locale, "report.notes.generated"), formatLocalDateTime(generatedAt)],
    [
      t(locale, "report.notes.sources"),
      t(locale, "report.notes.sourcesValue", { total: stats.sources, ok: stats.okSources }) +
        (stats.failedSources > 0 ? t(locale, "report.notes.sourcesFailed", { failed: stats.failedSources }) : ""),
    ],
    [t(locale, "report.notes.gitRule"), t(locale, "report.notes.gitRuleValue")],
    [t(locale, "report.notes.docRule"), t(locale, "report.notes.docRuleValue")],
    [t(locale, "report.notes.summaryRule"), t(locale, "report.notes.summaryRuleValue")],
    [
      t(locale, "report.notes.manual"),
      manualCount > 0 ? t(locale, "report.notes.manualCount", { count: manualCount }) : t(locale, "report.notes.none"),
    ],
    [
      t(locale, "report.notes.ai"),
      result.ai
        ? result.ai.ok
          ? t(locale, "report.notes.aiEnabled", { model: (result.ai.provider || "") + "/" + (result.ai.model || "") })
          : t(locale, "report.notes.aiError", { error: result.ai.error || "" })
        : t(locale, "report.notes.aiDisabled"),
    ],
    [
      t(locale, "report.notes.warnings"),
      warnings.length > 0 ? warnings.join("\n") : t(locale, "report.notes.none"),
    ],
  ];

  const aiSheetRows = result.ai
    ? [
        [{ value: t(locale, "report.aiSheet.title"), style: styles.title }],
        [t(locale, "report.aiSheet.status"), result.ai.ok ? t(locale, "report.aiSheet.completed") : t(locale, "report.aiSheet.notCompleted")],
        [t(locale, "report.aiSheet.model"), result.ai.provider || result.ai.model ? (result.ai.provider || "") + "/" + (result.ai.model || "") : "—"],
        [t(locale, "report.aiSheet.overall"), result.ai.ok ? result.ai.overall || "—" : result.ai.error || "—"],
        ["", ""],
        [t(locale, "report.aiSheet.date"), t(locale, "report.aiSheet.summary"), t(locale, "report.aiSheet.highlights"), t(locale, "report.aiSheet.categories")],
        ...(result.ai.days || []).map((day) => [
          day.date,
          day.summary,
          (day.highlights || []).join(t(locale, "common.itemSeparator")),
          (day.categories || []).join(t(locale, "common.separator")),
        ]),
        ...(result.ai.warnings && result.ai.warnings.length > 0 ? [[t(locale, "report.aiSheet.warnings"), result.ai.warnings.join("\n")]] : []),
      ]
    : [];

  const summaryWidths = [12, 10, 10, 10, 10, 26, 90];
  if (hasManual) summaryWidths.push(40);
  if (ai) summaryWidths.push(60);
  const gitWidths = [12, 18, 14, 12, 16, 20, 60, 12, 70];
  const docWidths = [12, 18, 50, 30, 70, 10, 20];
  const sourceWidths = [10, 22, 54, 16, 10, 10, 64];
  const noteWidths = [18, 106];

  const sheets = [
    {
      name: t(locale, "report.sheet.summary"),
      widths: summaryWidths,
      rows: summaryRows,
      rowStyles: summaryStyles,
      headerRows: 1,
      freezeColumns: 3,
    },
  ];
  if (result.ai) {
    sheets.push({
      name: t(locale, "report.sheet.ai"),
      widths: [14, 90, 50, 26],
      rows: aiSheetRows,
      rowStyles: { 0: styles.title, 1: styles.note, 2: styles.note, 3: styles.note, 5: styles.header },
      headerRows: 0,
      freeze: false,
      filter: false,
      merges: ["A1:D1"],
    });
  }
  sheets.push(
    {
      name: t(locale, "report.sheet.git"),
      widths: gitWidths,
      rows: gitRows,
      headerRows: 1,
      freezeColumns: 3,
      filter: commits.length > 0,
    },
    {
      name: t(locale, "report.sheet.docs"),
      widths: docWidths,
      rows: docRows,
      headerRows: 1,
      freezeColumns: 3,
      filter: docs.length > 0,
    },
    {
      name: t(locale, "report.sheet.sources"),
      widths: sourceWidths,
      rows: sourceRows,
      headerRows: 1,
      freezeColumns: 2,
      filter: sources.length > 0,
    },
    {
      name: t(locale, "report.sheet.notes"),
      widths: noteWidths,
      rows: notes,
      headerRows: 0,
      freeze: false,
      filter: false,
    },
  );

  return buildXlsx(sheets, { title: reportFileName(range.start, range.end).replace(/\.xlsx$/i, "") });
}

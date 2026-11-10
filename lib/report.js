/**
 * Workbook rendering for collected daily-report data.
 */

import { formatLocalDateTime } from "./collect.js";
import { buildXlsx, styles } from "./xlsx.js";

function statusLabel(status, en) {
  if (status === "error") return en ? "Failed" : "失败";
  if (status === "warn") return en ? "Warning" : "有提示";
  return en ? "OK" : "正常";
}

function typeLabel(kind, en) {
  if (kind === "git") return "Git";
  return en ? "Documents" : "文档";
}

function commitFileText(commit) {
  const items = (commit.visibleFiles || []).map((file) => file.status + " " + file.path);
  let text = items.length > 0 ? items.join("；") : "—";
  if (commit.filesTruncated) {
    text += "；…等 " + commit.fileCount + " 个文件";
  }
  return text;
}

export function reportFileName(start, end) {
  return "日报汇总_" + start + "_" + end + ".xlsx";
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
  const en = result.locale === "en";
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

  const summaryHeaders = ["日期", "星期", "日类型", "Git提交", "文档", "涉及仓库/文档", "当日摘要"];
  if (hasManual) summaryHeaders.push("手动补充");
  if (ai) summaryHeaders.push("AI 分析");
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
    if (hasManual) row.push((manualByDate.get(day.date) || []).join("；"));
    if (ai) row.push((aiDays.get(day.date) && aiDays.get(day.date).summary) || "");
    summaryRows.push(row);
    if (day.isWeekend) summaryStyles[summaryRows.length - 1] = styles.weekend;
  }
  const totalRow = [
    "合计",
    "",
    "",
    stats.commits,
    stats.docs,
    stats.okSources + "/" + stats.sources + " 个数据源正常",
    "有记录 " + stats.activeDays + " 天，共 " + stats.days + " 天",
  ];
  if (hasManual) totalRow.push("");
  if (ai) totalRow.push(ai.overall ? "见 AI分析 工作表" : "");
  summaryRows.push(totalRow);
  summaryStyles[summaryRows.length - 1] = styles.total;

  const gitRows = [
    ["日期", "仓库", "分支", "提交", "作者", "提交时间", "提交说明", "变更文件数", "变更文件"],
  ];
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
      commitFileText(commit),
    ]);
  }
  if (commits.length === 0) {
    gitRows.push(["范围内没有 Git 提交记录"]);
  }

  const docRows = [
    ["日期", "来源", "文件", "标题", "摘要", "大小(KB)", "修改时间"],
  ];
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
    docRows.push(["范围内没有文档记录"]);
  }

  const sourceRows = [
    ["类型", "名称", "地址", "分支", "状态", "记录数", "说明"],
  ];
  for (const source of sources) {
    sourceRows.push([
      typeLabel(source.kind, en),
      source.label,
      source.location,
      source.branch || "—",
      statusLabel(source.status, en),
      source.count,
      source.message,
    ]);
  }
  if (sources.length === 0) {
    sourceRows.push(["—", "没有配置数据源"]);
  }

  const notes = [
    [{ value: en ? "Daily report notes" : "日报汇总说明", style: styles.title }],
    [en ? "Range" : "统计范围", range.start + " ~ " + range.end + "（" + stats.days + (en ? " days" : " 天") + "）"],
    [en ? "Generated at" : "生成时间", formatLocalDateTime(generatedAt)],
    [
      en ? "Data sources" : "数据来源",
      stats.sources + (en ? " source(s), " : " 个数据源，") + stats.okSources + (en ? " readable" : " 个读取成功") + (stats.failedSources > 0 ? (en ? ", " : "，") + stats.failedSources + (en ? " failed" : " 个失败") : ""),
    ],
    [
      en ? "Git rule" : "Git 口径",
      en
        ? "Commits are grouped by author date; the report reads commit subjects and changed file names. Remote repositories are cached as bare partial clones."
        : "按提交作者时间归入日期；读取提交说明和变更文件名。远程仓库使用裸仓库缓存，首次拉取后再次生成会复用缓存。",
    ],
    [
      en ? "Document rule" : "文档口径",
      en
        ? "Supports md, txt, docx, html and similar notes. The date comes from the filename, a date field in the document, otherwise the file modification time."
        : "支持 md、txt、docx、html 等笔记文件。日期优先取文件名中的日期，其次取文档内 date/日期 字段，最后使用文件修改时间。",
    ],
    [
      en ? "Summary rule" : "汇总口径",
      en
        ? "The daily sheet is a per-day digest. Git and document detail sheets keep the original records for checking."
        : "【日报汇总】按天给出摘要；【Git明细】和【文档明细】保留原始记录，便于核对。",
    ],
    [
      en ? "Manual items" : "手动补充",
      manualCount > 0 ? (en ? manualCount + " item(s)" : manualCount + " 条") : en ? "None" : "无",
    ],
    [
      en ? "AI analysis" : "AI 分析",
      result.ai
        ? result.ai.ok
          ? (en ? "Enabled; model " : "已启用，模型 ") + (result.ai.provider || "") + "/" + (result.ai.model || "")
          : (en ? "Not completed: " : "未完成：") + (result.ai.error || "")
        : en
          ? "Disabled; the report is a direct data-source digest."
          : "未启用；日报仅按数据源直接汇总。",
    ],
    [
      en ? "Warnings" : "提示",
      warnings.length > 0 ? warnings.join("\n") : en ? "None" : "无",
    ],
  ];

  const aiSheetRows = result.ai
    ? [
        [{ value: en ? "AI daily analysis" : "AI 日报分析", style: styles.title }],
        [en ? "Status" : "状态", result.ai.ok ? (en ? "Completed" : "已完成") : en ? "Not completed" : "未完成"],
        [en ? "Model" : "模型", result.ai.provider || result.ai.model ? (result.ai.provider || "") + "/" + (result.ai.model || "") : "—"],
        [en ? "Overall" : "总体摘要", result.ai.ok ? result.ai.overall || "—" : result.ai.error || "—"],
        ["", ""],
        [en ? "Date" : "日期", en ? "AI summary" : "AI摘要", en ? "Highlights" : "关键事项", en ? "Categories" : "分类"],
        ...(result.ai.days || []).map((day) => [
          day.date,
          day.summary,
          (day.highlights || []).join("；"),
          (day.categories || []).join("、"),
        ]),
        ...(result.ai.warnings && result.ai.warnings.length > 0 ? [[en ? "Warnings" : "提示", result.ai.warnings.join("\n")]] : []),
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
      name: "日报汇总",
      widths: summaryWidths,
      rows: summaryRows,
      rowStyles: summaryStyles,
      headerRows: 1,
      freezeColumns: 3,
    },
  ];
  if (result.ai) {
    sheets.push({
      name: "AI分析",
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
      name: "Git明细",
      widths: gitWidths,
      rows: gitRows,
      headerRows: 1,
      freezeColumns: 3,
      filter: commits.length > 0,
    },
    {
      name: "文档明细",
      widths: docWidths,
      rows: docRows,
      headerRows: 1,
      freezeColumns: 3,
      filter: docs.length > 0,
    },
    {
      name: "数据源",
      widths: sourceWidths,
      rows: sourceRows,
      headerRows: 1,
      freezeColumns: 2,
      filter: sources.length > 0,
    },
    {
      name: "说明",
      widths: noteWidths,
      rows: notes,
      headerRows: 0,
      freeze: false,
      filter: false,
    },
  );

  return buildXlsx(sheets, { title: reportFileName(range.start, range.end).replace(/\.xlsx$/i, "") });
}

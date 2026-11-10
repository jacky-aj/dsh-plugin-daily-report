/**
 * Plain-text and HTML renderings of the same report result used by the XLSX
 * writer. Keeping them here means every export format follows the same AI
 * summaries, manual items and source data.
 */

function manualMap(result) {
  const map = new Map();
  for (const item of result.manualItems || []) {
    if (!item || typeof item.date !== "string" || typeof item.text !== "string") continue;
    if (!map.has(item.date)) map.set(item.date, []);
    map.get(item.date).push(item.text);
  }
  return map;
}

function aiDayMap(result) {
  const map = new Map();
  for (const day of result.ai && result.ai.ok && Array.isArray(result.ai.days) ? result.ai.days : []) {
    map.set(day.date, day);
  }
  return map;
}

function cellText(value) {
  return value === null || value === undefined ? "" : String(value);
}

function markdownCell(value) {
  return cellText(value).replace(/\|/g, "\\|").replace(/\r?\n/g, "<br>");
}

function csvCell(value) {
  return '"' + cellText(value).replace(/"/g, '""') + '"';
}

function htmlEscape(value) {
  return cellText(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function summaryRows(result) {
  const manual = manualMap(result);
  const ai = aiDayMap(result);
  return result.days.map((day) => {
    const dayAi = ai.get(day.date);
    return [
      day.date,
      day.weekday,
      day.dayType,
      day.commitCount,
      day.docCount,
      day.sources || "—",
      day.summary,
      (manual.get(day.date) || []).join("；"),
      dayAi ? dayAi.summary || "" : "",
    ];
  });
}

export function buildMarkdownReport(result) {
  const ai = result.ai && result.ai.ok ? result.ai : null;
  const rows = summaryRows(result);
  const lines = [
    "# 日报汇总 " + result.range.start + " ~ " + result.range.end,
    "",
    "- Git 提交：" + result.stats.commits + " 条",
    "- 文档：" + result.stats.docs + " 份",
    "- 有记录天数：" + result.stats.activeDays + " 天",
    "- 数据源：" + result.stats.okSources + "/" + result.stats.sources + " 个正常",
    "",
  ];
  if (ai) {
    lines.push("## 总体 AI 总结", "", ai.overall || "—", "");
  } else if (result.ai && result.ai.error) {
    lines.push("> AI 分析未完成：" + result.ai.error, "");
  }
  lines.push(
    "## 每日汇总",
    "",
    "| 日期 | 星期 | 类型 | Git提交 | 文档 | 涉及仓库/文档 | 当日摘要 | 手动补充 | AI 分析 |",
    "|---|---|---|---:|---:|---|---|---|---|",
  );
  for (const [date, weekday, dayType, commitCount, docCount, sources, summary, manual, aiSummary] of rows) {
    lines.push(
      "| " +
        [date, weekday, dayType, commitCount, docCount, sources, summary, manual, aiSummary]
          .map(markdownCell)
          .join(" | ") +
        " |",
    );
  }
  if (result.commits.length > 0) {
    lines.push("", "## Git 明细", "", "| 日期 | 仓库 | 分支 | 提交 | 作者 | 说明 |", "|---|---|---|---|---|---|");
    for (const commit of result.commits) {
      lines.push(
        "| " +
          [commit.date, commit.repo, commit.branch, commit.shortHash, commit.author, commit.subject]
            .map(markdownCell)
            .join(" | ") +
          " |",
      );
    }
  }
  if (result.docs.length > 0) {
    lines.push("", "## 文档明细", "", "| 日期 | 来源 | 文件 | 标题 | 摘要 |", "|---|---|---|---|---|");
    for (const doc of result.docs) {
      lines.push("| " + [doc.date, doc.source, doc.file, doc.title, doc.excerpt].map(markdownCell).join(" | ") + " |");
    }
  }
  return lines.join("\n") + "\n";
}

export function buildCsvReport(result) {
  const header = ["日期", "星期", "日类型", "Git提交", "文档", "涉及仓库/文档", "当日摘要", "手动补充", "AI 分析"];
  const rows = summaryRows(result);
  return "\ufeff" + [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n") + "\r\n";
}

export function buildHtmlReport(result) {
  const ai = result.ai && result.ai.ok ? result.ai : null;
  const rows = summaryRows(result);
  const tableRows = rows
    .map(
      (row) =>
        "<tr>" +
        row
          .map((value, index) => {
            const cls = index >= 3 && index <= 4 ? ' class="num"' : "";
            return "<td" + cls + ">" + htmlEscape(value) + "</td>";
          })
          .join("") +
        "</tr>",
    )
    .join("\n");
  const gitRows = result.commits
    .map(
      (commit) =>
        "<tr>" +
        [commit.date, commit.repo, commit.branch, commit.shortHash, commit.author, commit.subject, commit.fileCount]
          .map((value) => "<td>" + htmlEscape(value) + "</td>")
          .join("") +
        "</tr>",
    )
    .join("\n");
  return `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>日报汇总 ${htmlEscape(result.range.start)} ~ ${htmlEscape(result.range.end)}</title>
<style>
:root { color-scheme: light dark; }
body { margin: 0; padding: 32px; font-family: "Microsoft YaHei", "Segoe UI", sans-serif; background: #f5f7fa; color: #1f2933; }
main { max-width: 1400px; margin: 0 auto; background: #fff; border-radius: 12px; padding: 28px 32px; box-shadow: 0 2px 16px rgba(0,0,0,.08); }
h1 { margin: 0 0 8px; font-size: 26px; }
.meta { color: #617080; font-size: 13px; margin-bottom: 18px; }
.stats { display: flex; flex-wrap: wrap; gap: 10px; margin: 16px 0 22px; }
.stat { border: 1px solid #d9e1ea; border-radius: 8px; padding: 8px 12px; min-width: 110px; }
.stat b { display: block; font-size: 20px; }
.stat span { color: #617080; font-size: 12px; }
h2 { margin: 26px 0 10px; font-size: 18px; }
p { line-height: 1.75; margin: 0 0 12px; white-space: pre-wrap; }
table { width: 100%; border-collapse: collapse; font-size: 12px; }
th, td { border: 1px solid #d9e1ea; padding: 6px 8px; text-align: left; vertical-align: top; }
th { background: #1f4e79; color: #fff; font-weight: 600; }
tr:nth-child(even) td { background: #f7f9fc; }
td.num { text-align: center; white-space: nowrap; }
.note { color: #617080; font-size: 12px; }
@media print { body { padding: 0; background: #fff; } main { box-shadow: none; border-radius: 0; } }
</style>
</head>
<body>
<main>
<h1>日报汇总 ${htmlEscape(result.range.start)} ~ ${htmlEscape(result.range.end)}</h1>
<div class="meta">Git 提交 ${result.stats.commits} 条 · 文档 ${result.stats.docs} 份 · 有记录 ${result.stats.activeDays} 天 · 数据源 ${result.stats.okSources}/${result.stats.sources} 个正常</div>
${ai ? "<h2>总体 AI 总结</h2><p>" + htmlEscape(ai.overall || "—") + "</p>" : result.ai && result.ai.error ? '<p class="note">AI 分析未完成：' + htmlEscape(result.ai.error) + "</p>" : ""}
<h2>每日汇总</h2>
<table>
<thead><tr><th>日期</th><th>星期</th><th>类型</th><th>Git提交</th><th>文档</th><th>涉及仓库/文档</th><th>当日摘要</th><th>手动补充</th><th>AI 分析</th></tr></thead>
<tbody>${tableRows}</tbody>
</table>
${gitRows ? "<h2>Git 明细</h2><table><thead><tr><th>日期</th><th>仓库</th><th>分支</th><th>提交</th><th>作者</th><th>说明</th><th>变更文件数</th></tr></thead><tbody>" + gitRows + "</tbody></table>" : ""}
</main>
</body>
</html>`;
}

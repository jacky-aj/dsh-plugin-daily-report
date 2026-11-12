/**
 * Plain-text and HTML renderings of the same report result used by the XLSX
 * writer. Every export format follows the same AI summaries, manual items and
 * source data.
 */

import { message, normalizeLocale, t } from "./i18n.js";

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

function summaryRows(result, locale) {
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
      (manual.get(day.date) || []).join(t(locale, "common.itemSeparator")),
      dayAi ? dayAi.summary || "" : "",
    ];
  });
}

function markdownTable(headers, rows) {
  const head = "| " + headers.map(markdownCell).join(" | ") + " |";
  const divider = "|" + headers.map(() => "---").join("|") + "|";
  return [head, divider, ...rows.map((row) => "| " + row.map(markdownCell).join(" | ") + " |")];
}

export function buildMarkdownReport(result) {
  const locale = normalizeLocale(result.locale);
  const ai = result.ai && result.ai.ok ? result.ai : null;
  const rows = summaryRows(result, locale);
  const lines = [
    t(locale, "formats.title", { start: result.range.start, end: result.range.end }),
    "",
    t(locale, "formats.stats.commits", { count: result.stats.commits }),
    t(locale, "formats.stats.docs", { count: result.stats.docs }),
    t(locale, "formats.stats.activeDays", { count: result.stats.activeDays }),
    t(locale, "formats.stats.sources", { ok: result.stats.okSources, total: result.stats.sources }),
    "",
  ];
  if (ai) {
    lines.push(t(locale, "formats.overall"), "", ai.overall || "—", "");
  } else if (result.ai && result.ai.error) {
    lines.push(t(locale, "formats.aiFailed", { error: result.ai.error }), "");
  }
  lines.push("", t(locale, "formats.daily"), "");
  lines.push(...markdownTable(message(locale, "formats.summaryHeaders"), rows));
  if (result.commits.length > 0) {
    lines.push("", t(locale, "formats.git"), "");
    lines.push(
      ...markdownTable(
        message(locale, "formats.gitHeaders"),
        result.commits.map((commit) => [
          commit.date,
          commit.repo,
          commit.branch,
          commit.shortHash,
          commit.author,
          commit.subject,
        ]),
      ),
    );
  }
  if (result.docs.length > 0) {
    lines.push("", t(locale, "formats.docs"), "");
    lines.push(
      ...markdownTable(
        message(locale, "formats.docsHeaders"),
        result.docs.map((doc) => [doc.date, doc.source, doc.file, doc.title, doc.excerpt]),
      ),
    );
  }
  return lines.join("\n") + "\n";
}

export function buildCsvReport(result) {
  const locale = normalizeLocale(result.locale);
  const header = message(locale, "formats.summaryHeaders");
  const rows = summaryRows(result, locale);
  return "\ufeff" + [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n") + "\r\n";
}

export function buildHtmlReport(result) {
  const locale = normalizeLocale(result.locale);
  const ai = result.ai && result.ai.ok ? result.ai : null;
  const rows = summaryRows(result, locale);
  const summaryHeaders = message(locale, "formats.summaryHeaders");
  const gitHeaders = message(locale, "formats.html.gitHeaders");
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
  const htmlLang = locale === "en" ? "en" : "zh-CN";
  return `<!doctype html>
<html lang="${htmlLang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${htmlEscape(t(locale, "formats.html.title", { start: result.range.start, end: result.range.end }))}</title>
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
<h1>${htmlEscape(t(locale, "formats.html.title", { start: result.range.start, end: result.range.end }))}</h1>
<div class="meta">${htmlEscape(t(locale, "formats.html.meta", {
    commits: result.stats.commits,
    docs: result.stats.docs,
    active: result.stats.activeDays,
    ok: result.stats.okSources,
    total: result.stats.sources,
  }))}</div>
${ai ? "<h2>" + htmlEscape(t(locale, "formats.html.overall")) + "</h2><p>" + htmlEscape(ai.overall || "—") + "</p>" : result.ai && result.ai.error ? '<p class="note">' + htmlEscape(t(locale, "formats.aiFailed", { error: result.ai.error })) + "</p>" : ""}
<h2>${htmlEscape(t(locale, "formats.html.daily"))}</h2>
<table>
<thead><tr>${summaryHeaders.map((header) => "<th>" + htmlEscape(header) + "</th>").join("")}</tr></thead>
<tbody>${tableRows}</tbody>
</table>
${gitRows ? "<h2>" + htmlEscape(t(locale, "formats.html.git")) + "</h2><table><thead><tr>" + gitHeaders.map((header) => "<th>" + htmlEscape(header) + "</th>").join("") + "</tr></thead><tbody>" + gitRows + "</tbody></table>" : ""}
</main>
</body>
</html>`;
}

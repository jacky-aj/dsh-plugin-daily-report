import React from "react";
import { useApp } from "../context.jsx";
import { Card } from "../components/Card.jsx";
import { InfoDot } from "../icons.jsx";

export function PreviewCard() {
  const {
    preview,
    previewDays,
    allPreviewExpanded,
    exportFormat,
    exporting,
    regenerating,
    expandedPreviewDays,
    manualDate,
    manualText,
    setAllPreviewExpanded,
    exportPreview,
    setPreview,
    setManualDate,
    setManualText,
    addManualItem,
    togglePreviewDay,
    regeneratePreviewDay,
    updatePreviewDay,
    removeManualItem,
    formatShortLabel,
    t,
  } = useApp();
  return (
    <Card className="dsdr-preview-card">
      <div className="dsdr-card-head">
        <div>
          <div className="dsdr-title-with-info">
            <div className="dsdr-card-title">
              {t("preview.title", "生成结果预览")}
            </div>
            <InfoDot
              text={t(
                "preview.desc",
                "先检查并编辑每日 AI 摘要、补充非代码工作，再导出 XLSX。",
              )}
            />
          </div>
        </div>
        <div className="dsdr-actions">
          <button
            type="button"
            className="dsdr-btn"
            onClick={() => setAllPreviewExpanded(!allPreviewExpanded)}
            disabled={previewDays.length === 0 || exporting}
          >
            {allPreviewExpanded
              ? t("preview.collapseAll", "全部收起")
              : t("preview.expandAll", "全部展开")}
          </button>
          <button
            type="button"
            className="dsdr-btn dsdr-btn-primary"
            onClick={exportPreview}
            disabled={exporting || regenerating.length > 0}
          >
            {exporting
              ? t("preview.exporting", "正在导出…")
              : t("preview.export", "导出") +
                " " +
                formatShortLabel(exportFormat)}
          </button>
        </div>
      </div>
      {preview.ai && preview.ai.ok ? (
        <div className="dsdr-preview-overall">
          <label className="dsdr-label" htmlFor="dsdr-preview-overall">
            {t("preview.overall", "总体 AI 总结")}
          </label>
          <textarea
            id="dsdr-preview-overall"
            className="dsdr-textarea"
            value={preview.ai.overall || ""}
            onChange={(event) =>
              setPreview((previous) =>
                previous
                  ? {
                      ...previous,
                      ai: {
                        ...previous.ai,
                        overall: event.target.value,
                      },
                    }
                  : previous,
              )
            }
          />
        </div>
      ) : preview.ai ? (
        <div className="dsdr-error">
          {preview.ai.error ||
            t("preview.aiFailed", "AI 分析未完成，仍可补充手动工作项后导出。")}
        </div>
      ) : null}
      <div className="dsdr-manual-add">
        <input
          type="date"
          className="dsdr-input"
          value={manualDate}
          min={preview.range.start}
          max={preview.range.end}
          onChange={(event) => setManualDate(event.target.value)}
        />
        <input
          className="dsdr-input"
          value={manualText}
          placeholder={t(
            "preview.manualPlaceholder",
            "例如：参加需求评审、处理线上问题",
          )}
          onChange={(event) => setManualText(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") addManualItem();
          }}
        />
        <button
          type="button"
          className="dsdr-btn"
          onClick={addManualItem}
          disabled={manualText.trim().length === 0}
        >
          {t("preview.addManual", "添加手动工作项")}
        </button>
      </div>
      {previewDays.length === 0 ? (
        <div className="dsdr-empty">
          {t("preview.noDays", "没有可预览的日报内容。")}
        </div>
      ) : (
        <div className="dsdr-preview-list">
          {previewDays.map((day) => {
            const expanded = expandedPreviewDays[day.date] === true;
            return (
              <div
                className={
                  "dsdr-preview-day" + (expanded ? " is-expanded" : "")
                }
                key={day.date}
              >
                <div className="dsdr-preview-day-head">
                  <button
                    type="button"
                    className="dsdr-preview-toggle"
                    aria-expanded={expanded}
                    onClick={() => togglePreviewDay(day.date)}
                  >
                    <span className="dsdr-preview-chevron">
                      {expanded ? "▾" : "▸"}
                    </span>
                    <span className="dsdr-preview-date">{day.date}</span>
                    <span className="dsdr-hint">
                      {" · " +
                        day.weekday +
                        " · " +
                        day.commitCount +
                        " commits · " +
                        day.docCount +
                        " docs"}
                    </span>
                    {day.manualItems && day.manualItems.length > 0 ? (
                      <span className="dsdr-preview-badge">
                        {day.manualItems.length +
                          " " +
                          t("preview.manual", "手动补充")}
                      </span>
                    ) : null}
                  </button>
                  {preview.ai && preview.ai.ok ? (
                    <button
                      type="button"
                      className="dsdr-btn"
                      onClick={() => regeneratePreviewDay(day.date)}
                      disabled={regenerating.length > 0 || exporting}
                    >
                      {regenerating === day.date
                        ? t("preview.regenerating", "分析中…")
                        : t("preview.regenerateDay", "重新分析这天")}
                    </button>
                  ) : null}
                </div>
                {expanded ? (
                  <div className="dsdr-preview-body">
                    <div className="dsdr-preview-raw">
                      {t("preview.raw", "原始汇总") + "：" + day.summary}
                    </div>
                    {preview.ai && preview.ai.ok ? (
                      <textarea
                        className="dsdr-textarea"
                        value={day.aiSummary || ""}
                        placeholder={t(
                          "preview.aiSummary",
                          "AI 摘要（可编辑）",
                        )}
                        onChange={(event) =>
                          updatePreviewDay(day.date, {
                            aiSummary: event.target.value,
                          })
                        }
                      />
                    ) : null}
                    {day.aiHighlights && day.aiHighlights.length > 0 ? (
                      <div className="dsdr-hint">
                        {"• " + day.aiHighlights.join("；")}
                      </div>
                    ) : null}
                    {day.manualItems && day.manualItems.length > 0 ? (
                      <div className="dsdr-manual-list">
                        {day.manualItems.map((text, index) => (
                          <span
                            className="dsdr-manual-chip"
                            key={String(index)}
                          >
                            {text}
                            <button
                              type="button"
                              className="dsdr-manual-remove"
                              aria-label={t("remove", "移除")}
                              onClick={() => removeManualItem(day.date, index)}
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}


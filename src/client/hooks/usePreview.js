import React from "react";
import { API, decodeBase64Json, formatExtension, triggerDownload } from "../helpers.js";

export function usePreview({
  exportFormat,
  setResult,
  resultRef,
  setError,
  t,
  errorMessageFromPayload,
  showToast,
}) {
  const [preview, setPreview] = React.useState(null);
  const [previewJobId, setPreviewJobId] = React.useState("");
  const [exporting, setExporting] = React.useState(false);
  const [regenerating, setRegenerating] = React.useState("");
  const [manualDate, setManualDate] = React.useState("");
  const [manualText, setManualText] = React.useState("");
  const [expandedPreviewDays, setExpandedPreviewDays] = React.useState({});

  function updatePreviewDay(date, patch) {
    setPreview((previous) => {
      if (!previous) return previous;
      return {
        ...previous,
        days: previous.days.map((day) =>
          day.date === date ? { ...day, ...patch } : day,
        ),
      };
    });
  }

  function addManualItem() {
    const text = manualText.trim();
    const date = manualDate;
    if (text.length === 0 || date.length === 0 || !preview) return;
    setPreview((previous) => {
      if (!previous) return previous;
      return {
        ...previous,
        days: previous.days.map((day) =>
          day.date === date
            ? { ...day, manualItems: [...(day.manualItems || []), text] }
            : day,
        ),
      };
    });
    setExpandedPreviewDays((previous) => ({ ...previous, [date]: true }));
    setManualText("");
  }

  function removeManualItem(date, index) {
    setPreview((previous) => {
      if (!previous) return previous;
      return {
        ...previous,
        days: previous.days.map((day) =>
          day.date === date
            ? {
                ...day,
                manualItems: (day.manualItems || []).filter(
                  (_, itemIndex) => itemIndex !== index,
                ),
              }
            : day,
        ),
      };
    });
  }

  function togglePreviewDay(date) {
    setExpandedPreviewDays((previous) => ({
      ...previous,
      [date]: !previous[date],
    }));
  }

  function setAllPreviewExpanded(expand) {
    if (!preview) return;
    if (!expand) {
      setExpandedPreviewDays({});
      return;
    }
    const next = {};
    for (const day of preview.days) {
      if (
        day.commitCount > 0 ||
        day.docCount > 0 ||
        (day.manualItems || []).length > 0 ||
        (day.aiSummary || "").length > 0
      ) {
        next[day.date] = true;
      }
    }
    setExpandedPreviewDays(next);
  }

  function previewEdits() {
    if (!preview) return { overall: "", days: [] };
    return {
      overall: preview.ai ? preview.ai.overall || "" : "",
      days: preview.days.map((day) => ({
        date: day.date,
        aiSummary: day.aiSummary || "",
        aiHighlights: day.aiHighlights || [],
        aiCategories: day.aiCategories || [],
        manualItems: day.manualItems || [],
      })),
    };
  }

  async function exportPreview() {
    if (!preview || previewJobId.length === 0 || exporting) return;
    setExporting(true);
    setError("");
    try {
      const response = await fetch(API + "/job/export", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          accept: "application/octet-stream",
        },
        body: JSON.stringify({
          jobId: previewJobId,
          edits: previewEdits(),
          format: exportFormat,
        }),
      });
      if (!response.ok) {
        let payload = null;
        try {
          payload = await response.json();
        } catch {
          payload = null;
        }
        throw new Error(errorMessageFromPayload(payload));
      }
      const summaryHeader = response.headers.get("x-report-summary");
      const summary = summaryHeader ? decodeBase64Json(summaryHeader) : {};
      const filenameHeader = response.headers.get("x-report-filename");
      const filename = filenameHeader
        ? decodeURIComponent(filenameHeader)
        : "日报汇总_" +
          preview.range.start +
          "_" +
          preview.range.end +
          "." +
          formatExtension(exportFormat);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const next = Object.assign({}, summary, {
        filename,
        url,
        size: blob.size,
      });
      if (resultRef.current && resultRef.current.url)
        window.URL.revokeObjectURL(resultRef.current.url);
      setResult(next);
      triggerDownload(url, filename);
      if (typeof showToast === "function") {
        showToast(t("toast.exported", "已导出：") + filename);
      }
    } catch (err) {
      setError(
        err && err.message ? err.message : t("error.generate", "导出失败"),
      );
    } finally {
      setExporting(false);
    }
  }

  async function regeneratePreviewDay(date) {
    if (
      !preview ||
      !preview.ai ||
      !preview.ai.ok ||
      regenerating.length > 0
    )
      return;
    const day = preview.days.find((item) => item.date === date);
    if (!day) return;
    setRegenerating(date);
    setError("");
    try {
      const response = await fetch(API + "/job/regenerate-day", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          accept: "application/json",
        },
        body: JSON.stringify({
          jobId: previewJobId,
          date,
          manualItems: day.manualItems || [],
        }),
      });
      if (!response.ok) {
        let payload = null;
        try {
          payload = await response.json();
        } catch {
          payload = null;
        }
        throw new Error(errorMessageFromPayload(payload));
      }
      const payload = await response.json();
      if (!payload.ok || !payload.day) {
        throw new Error(payload.error || t("error.generate", "重新分析失败"));
      }
      updatePreviewDay(date, {
        aiSummary: payload.day.summary || "",
        aiHighlights: payload.day.highlights || [],
        aiCategories: payload.day.categories || [],
      });
    } catch (err) {
      setError(
        err && err.message ? err.message : t("error.generate", "重新分析失败"),
      );
    } finally {
      setRegenerating("");
    }
  }

  return {
    preview,
    setPreview,
    previewJobId,
    setPreviewJobId,
    exporting,
    regenerating,
    manualDate,
    setManualDate,
    manualText,
    setManualText,
    expandedPreviewDays,
    setExpandedPreviewDays,
    updatePreviewDay,
    addManualItem,
    removeManualItem,
    togglePreviewDay,
    setAllPreviewExpanded,
    exportPreview,
    regeneratePreviewDay,
  };
}


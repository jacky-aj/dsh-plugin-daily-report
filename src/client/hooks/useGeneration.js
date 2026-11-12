import React from "react";
import { API, FORMAT_OPTIONS, cleanSettings, currentLocaleId, daysBetween } from "../helpers.js";

export function useGeneration({
  settings,
  useAi,
  range,
  exportFormat,
  aiInfo,
  ctx,
  setExportFormat,
  setFormatMenuOpen,
  setResult,
  setPreview,
  setPreviewJobId,
  setExpandedPreviewDays,
  setManualDate,
  setError,
  sessionId,
  t,
  errorMessageFromPayload,
  resultRef,
}) {
  const [generating, setGenerating] = React.useState(false);
  const [progress, setProgress] = React.useState(null);
  const pollAbortRef = React.useRef(null);
  const jobIdRef = React.useRef("");

  React.useEffect(() => {
    return () => {
      if (pollAbortRef.current) pollAbortRef.current.abort();
    };
  }, []);

async function cancelGeneration() {
  const jobId = jobIdRef.current;
  if (jobId.length === 0) return;
  try {
    await fetch(API + "/job/cancel", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({ jobId }),
    });
  } catch {
    // The local abort below still stops the UI polling.
  }
  if (pollAbortRef.current) pollAbortRef.current.abort();
  setProgress(null);
  setGenerating(false);
}

function wait(ms, signal) {
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => {
      signal.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      window.clearTimeout(timer);
      const error = new Error("aborted");
      error.name = "AbortError";
      reject(error);
    };
    if (signal.aborted) {
      onAbort();
      return;
    }
    signal.addEventListener("abort", onAbort, {
      once: true,
    });
  });
}
async function generate(formatOverride) {
  if (generating) return;
  const format = FORMAT_OPTIONS.includes(formatOverride)
    ? formatOverride
    : exportFormat;
  setExportFormat(format);
  setFormatMenuOpen(false);
  const cleaned = cleanSettings(settings, useAi, range, format);
  if (cleaned.git.length === 0 && cleaned.docs.length === 0) {
    setError(t("error.noSources", "请至少添加一个 Git 仓库或本地文档。"));
    return;
  }
  const totalDays = daysBetween(range.start, range.end);
  if (!range.start || !range.end || totalDays <= 0) {
    setError(
      t("error.invalidRange", "日期范围无效，请检查开始和结束日期。"),
    );
    return;
  }
  if (totalDays > 366) {
    setError(t("error.rangeTooLong", "时间范围最长支持 366 天。"));
    return;
  }
  setError("");
  setPreview(null);
  setPreviewJobId("");
  if (resultRef.current && resultRef.current.url)
    window.URL.revokeObjectURL(resultRef.current.url);
  setResult(null);
  setGenerating(true);
  setProgress({
    percent: 1,
    indeterminate: false,
    message: t("progress.start", "正在创建生成任务…"),
  });
  if (pollAbortRef.current) pollAbortRef.current.abort();
  const controller = new AbortController();
  pollAbortRef.current = controller;
  try {
    const startResponse = await fetch(API + "/generate/start", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify({
        settings: cleaned,
        start: range.start,
        end: range.end,
        sessionId,
        ai: useAi && aiInfo.available,
        locale: currentLocaleId(ctx).toLowerCase().startsWith("en")
          ? "en"
          : "zh",
      }),
      signal: controller.signal,
    });
    if (!startResponse.ok) {
      let payload = null;
      try {
        payload = await startResponse.json();
      } catch {
        payload = null;
      }
      throw new Error(errorMessageFromPayload(payload));
    }
    const started = await startResponse.json();
    const jobId =
      started && typeof started.jobId === "string" ? started.jobId : "";
    if (jobId.length === 0)
      throw new Error(t("error.generate", "生成失败"));
    jobIdRef.current = jobId;
    while (true) {
      if (controller.signal.aborted) {
        const aborted = new Error("aborted");
        aborted.name = "AbortError";
        throw aborted;
      }
      const statusResponse = await fetch(
        API + "/job?jobId=" + encodeURIComponent(jobId),
        {
          headers: {
            accept: "application/json",
          },
          signal: controller.signal,
        },
      );
      if (!statusResponse.ok) {
        let payload = null;
        try {
          payload = await statusResponse.json();
        } catch {
          payload = null;
        }
        throw new Error(errorMessageFromPayload(payload));
      }
      const job = await statusResponse.json();
      if (job.progress) {
        setProgress({
          percent: Number(job.progress.percent) || 0,
          indeterminate: job.progress.indeterminate === true,
          message:
            job.progress.message || t("generating", "正在收集并生成…"),
        });
      }
      if (job.status === "done") break;
      if (job.status === "failed")
        throw new Error(
          errorMessageFromPayload({
            error: job.error,
          }),
        );
      if (job.status === "cancelled") {
        const aborted = new Error("aborted");
        aborted.name = "AbortError";
        throw aborted;
      }
      await wait(650, controller.signal);
    }
    const previewResponse = await fetch(
      API + "/job/preview?jobId=" + encodeURIComponent(jobId),
      {
        headers: {
          accept: "application/json",
        },
        signal: controller.signal,
      },
    );
    if (!previewResponse.ok) {
      let payload = null;
      try {
        payload = await previewResponse.json();
      } catch {
        payload = null;
      }
      throw new Error(errorMessageFromPayload(payload));
    }
    const previewData = await previewResponse.json();
    setPreview(previewData);
    setPreviewJobId(jobId);
    setExpandedPreviewDays({});
    const firstDay =
      (previewData.days || []).find(
        (day) =>
          day.commitCount > 0 ||
          day.docCount > 0 ||
          (day.manualItems || []).length > 0,
      ) || (previewData.days || [])[0];
    setManualDate(firstDay ? firstDay.date : range.start);
    setProgress({
      percent: 100,
      indeterminate: false,
      message: t(
        "progress.preview",
        "生成完成，请预览并编辑后导出 XLSX。",
      ),
    });
  } catch (err) {
    if (err && err.name === "AbortError") return;
    setError(
      err && err.message ? err.message : t("error.generate", "生成失败"),
    );
  } finally {
    if (pollAbortRef.current === controller) pollAbortRef.current = null;
    jobIdRef.current = "";
    setGenerating(false);
  }
}
  return { generating, progress, generate, cancelGeneration };
}


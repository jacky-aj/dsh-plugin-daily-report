import React from "react";
import { API, NS, currentLocaleId, daysBetween, formatShortLabel } from "./helpers.js";
import { useTranslate } from "./helpers.js";
import { installStyles } from "./styles.js";
import { PanelIcon } from "./icons.jsx";
import { AppContext, setApp } from "./context.jsx";
import { DailyReportPage } from "./views/DailyReportPage.jsx";
import { useSettings } from "./hooks/useSettings.js";
import { useMenus } from "./hooks/useMenus.js";
import { useSchedule } from "./hooks/useSchedule.js";
import { useSettingsTransfer } from "./hooks/useSettingsTransfer.js";
import { useDataSources } from "./hooks/useDataSources.js";
import { usePreview } from "./hooks/usePreview.js";
import { useGeneration } from "./hooks/useGeneration.js";
import { useConfirm } from "./hooks/useConfirm.js";
import { ConfirmDialog } from "./components/ConfirmDialog.jsx";
export function DailyReportView(props) {
  const ctx = props.ctx;
  const t = useTranslate(ctx);
  const sessionId =
    typeof props.sessionId === "string" ? props.sessionId : "";
  const {
    settings,
    setSettings,
    range,
    setRange,
    exportFormat,
    setExportFormat,
    aiInfo,
    setAiInfo,
    useAi,
    setUseAi,
    loading,
    loadError,
  } = useSettings({ sessionId, t });
  const {
    formatMenuOpen,
    setFormatMenuOpen,
    settingsMenuOpen,
    setSettingsMenuOpen,
    formatMenuRef,
    settingsMenuRef,
    settingsFileRef,
  } = useMenus();
  const { confirm, dialogProps } = useConfirm();
  const [error, setError] = React.useState("");
  const [result, setResult] = React.useState(null);
  const resultRef = React.useRef(null);
  const localeIsEnglish = currentLocaleId(ctx)
    .toLowerCase()
    .startsWith("en");
  const {
    scheduleStatus,
    scheduleLoading,
    scheduleError,
    loadScheduleStatus,
    runScheduleNow,
  } = useSchedule({
    enabled: settings.scheduleEnabled,
    sessionId,
    t,
    errorMessageFromPayload,
  });
  const {
    saveState,
    saveSettingsNow,
    persistSettings,
    exportSettings,
    importSettingsFile,
  } = useSettingsTransfer({
    settings,
    setSettings,
    useAi,
    setUseAi,
    range,
    setRange,
    exportFormat,
    setExportFormat,
    loading,
    setError,
    setSettingsMenuOpen,
    confirm,
    t,
  });
  const {
    showScan,
    scanDir,
    setScanDir,
    scanning,
    scanMessage,
    scanError,
    testingSources,
    testResults,
    testError,
    dataSourceTab,
    setDataSourceTab,
    updateGit,
    updateDoc,
    addGit,
    addDoc,
    removeGit,
    removeDoc,
    testSources,
    toggleScan,
    pickScanDirectory,
    scanAndAdd,
  } = useDataSources({
    settings,
    setSettings,
    useAi,
    range,
    exportFormat,
    sessionId,
    ctx,
    t,
    errorMessageFromPayload,
    confirm,
  });
  const {
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
  } = usePreview({
    exportFormat,
    setResult,
    resultRef,
    setError,
    t,
    errorMessageFromPayload,
  });
  const { generating, progress, generate, cancelGeneration } =
    useGeneration({
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
    });
  React.useEffect(() => {
    resultRef.current = result;
  }, [result]);
  React.useEffect(() => {
    return () => {
      if (resultRef.current && resultRef.current.url)
        window.URL.revokeObjectURL(resultRef.current.url);
    };
  }, []);
  function errorMessageFromPayload(payload) {
    const code = payload && payload.error ? payload.error.code : "";
    const serverMessage =
      payload && payload.error ? payload.error.message : "";
    const messages = {
      "no-sources": t(
        "error.noSources",
        "请至少添加一个 Git 仓库或本地文档。",
      ),
      "invalid-range": t(
        "error.invalidRange",
        "日期范围无效，请检查开始和结束日期。",
      ),
      "range-too-long": t(
        "error.rangeTooLong",
        "时间范围最长支持 366 天。",
      ),
      "all-sources-failed": t(
        "error.allSourcesFailed",
        "所有数据源都读取失败。",
      ),
      "generate-failed": t("error.generate", "生成失败"),
    };
    return (
      messages[code] || serverMessage || t("error.generate", "生成失败")
    );
  }
  const rangeDays = daysBetween(range.start, range.end);
  const previewDays = preview
    ? preview.days.filter(
        (day) =>
          day.commitCount > 0 ||
          day.docCount > 0 ||
          (day.manualItems || []).length > 0 ||
          (day.aiSummary || "").length > 0,
      )
    : [];
  const allPreviewExpanded =
    previewDays.length > 0 &&
    previewDays.every((day) => expandedPreviewDays[day.date] === true);
  const saveText =
    saveState === "saving"
      ? t("save.saving", "正在保存设置…")
      : saveState === "saved"
        ? t("save.saved", "设置已保存")
        : saveState === "failed"
          ? t("save.failed", "设置保存失败")
          : "";
  const app = {
    settings,
    setSettings,
    range,
    setRange,
    rangeDays,
    exportFormat,
    setExportFormat,
    useAi,
    setUseAi,
    aiInfo,
    preview,
    setPreview,
    previewDays,
    allPreviewExpanded,
    exporting,
    regenerating,
    expandedPreviewDays,
    manualDate,
    manualText,
    setAllPreviewExpanded,
    exportPreview,
    setManualDate,
    setManualText,
    addManualItem,
    togglePreviewDay,
    regeneratePreviewDay,
    updatePreviewDay,
    removeManualItem,
    formatShortLabel,
    scheduleStatus,
    scheduleLoading,
    scheduleError,
    loadScheduleStatus,
    runScheduleNow,
    showScan,
    scanDir,
    setScanDir,
    scanAndAdd,
    scanning,
    scanError,
    scanMessage,
    pickScanDirectory,
    toggleScan,
    testSources,
    testingSources,
    testError,
    testResults,
    dataSourceTab,
    setDataSourceTab,
    updateGit,
    removeGit,
    addGit,
    updateDoc,
    removeDoc,
    addDoc,
    loading,
    loadError,
    error,
    result,
    saveText,
    saveState,
    saveSettingsNow,
    exportSettings,
    importSettingsFile,
    formatMenuOpen,
    setFormatMenuOpen,
    settingsMenuOpen,
    setSettingsMenuOpen,
    formatMenuRef,
    settingsMenuRef,
    settingsFileRef,
    localeIsEnglish,
    generating,
    progress,
    generate,
    cancelGeneration,
    confirm,
    t,
  };
  setApp(app);
  return (
    <AppContext.Provider value={app}>
      <DailyReportPage />
      <ConfirmDialog {...dialogProps} />
    </AppContext.Provider>
  );
}
// ── Plugin entry ───────────────────────────────────────────────────────
export function apply(ctx) {
  installStyles(ctx);
  ctx.effect(() => {
    let disposed = false;
    let disposeLocale = null;
    fetch(API + "/locales", { headers: { accept: "application/json" } })
      .then((response) => (response.ok ? response.json() : null))
      .then((payload) => {
        if (disposed || !payload || !payload.zh) return;
        disposeLocale = ctx.locale.register(NS, {
          zh: payload.zh,
          en: payload.en || payload.zh,
        });
      })
      .catch(() => {});
    return () => {
      disposed = true;
      if (disposeLocale) disposeLocale();
    };
  }, "daily-report: locale");
  const t = ctx.locale.bind(NS);
  ctx.slots.inject("main", () =>
    ctx.slots.register(
      {
        name: "main",
        key: "daily-report",
      },
      (props) => <DailyReportView {...props} ctx={ctx} />,
    ),
  );
  ctx.slots.inject("sidebar.panellist", () =>
    ctx.slots.register(
      {
        name: "sidebar.panellist",
        id: "daily-report",
        order: 20,
        label: () => t("panel.title"),
      },
      (props) => <PanelIcon {...props} />,
    ),
  );
}


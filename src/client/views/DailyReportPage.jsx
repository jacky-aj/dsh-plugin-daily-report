import React from "react";
import { useApp } from "../context.jsx";
import { ChevronIcon, DownloadIcon, GenerateIcon, Icon, SaveIcon, UploadIcon } from "../icons.jsx";
import { API, FORMAT_OPTIONS, formatLabel, formatShortLabel, triggerDownload } from "../helpers.js";
import { AiCard } from "./AiCard.jsx";
import { DataSourceCard } from "./DataSourceCard.jsx";
import { PreviewCard } from "./PreviewCard.jsx";
import { RangeCard } from "./RangeCard.jsx";
import { ScheduleCard } from "./ScheduleCard.jsx";

export function DailyReportPage() {
  const {
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
    localeIsEnglish,
    generating,
    progress,
    generate,
    cancelGeneration,
    t,
  } = useApp();
  if (loading) {
    return (
      <div className="dsdr-root">
        <div className="dsdr-page">
          <div className="dsdr-card dsdr-hint">
            {t("loading", "正在读取配置…")}
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="dsdr-root">
      <div className="dsdr-page">
        <div className="dsdr-hero">
          <div className="dsdr-mark">
            <Icon />
          </div>
          <div className="dsdr-hero-copy">
            <h1 className="dsdr-title">{t("page.title", "日报汇总")}</h1>
            <p className="dsdr-sub">
              {t(
                "page.desc",
                "按天汇总 Git 提交与本地文档，导出可直接查看的 XLSX 日报。",
              )}
            </p>
          </div>
          <div className="dsdr-hero-action">
            <div className="dsdr-hero-buttons">
              <div className="dsdr-split dsdr-save-split" ref={settingsMenuRef}>
                <button
                  type="button"
                  className="dsdr-btn dsdr-save-btn dsdr-btn-with-icon"
                  onClick={saveSettingsNow}
                  disabled={saveState === "saving"}
                >
                  <SaveIcon size={15} />
                  <span>
                    {saveState === "saving"
                      ? t("save.savingShort", "正在保存…")
                      : t("save.button", "保存设置")}
                  </span>
                </button>
                <button
                  type="button"
                  className="dsdr-btn dsdr-save-btn dsdr-split-toggle"
                  onClick={() => setSettingsMenuOpen((open) => !open)}
                  disabled={saveState === "saving"}
                  aria-haspopup="menu"
                  aria-expanded={settingsMenuOpen}
                  aria-label={t("settings.menu", "设置操作")}
                >
                  <ChevronIcon size={12} />
                </button>
                {settingsMenuOpen ? (
                  <div className="dsdr-menu" role="menu">
                    <div className="dsdr-menu-title">
                      {t("settings.menu", "设置操作")}
                    </div>
                    <button
                      type="button"
                      role="menuitem"
                      className="dsdr-menu-item dsdr-menu-item-start"
                      onClick={exportSettings}
                    >
                      <DownloadIcon size={14} />
                      <span>{t("settings.export", "导出设置")}</span>
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      className="dsdr-menu-item dsdr-menu-item-start"
                      onClick={() => {
                        if (settingsFileRef.current)
                          settingsFileRef.current.click();
                      }}
                    >
                      <UploadIcon size={14} />
                      <span>{t("settings.import", "导入设置")}</span>
                    </button>
                  </div>
                ) : null}
              </div>
              <input
                ref={settingsFileRef}
                type="file"
                accept=".json,application/json"
                style={{
                  display: "none",
                }}
                onChange={importSettingsFile}
              />
              <div className="dsdr-split" ref={formatMenuRef}>
                <button
                  type="button"
                  className="dsdr-btn dsdr-btn-primary dsdr-generate dsdr-btn-with-icon"
                  onClick={() => generate()}
                  disabled={generating}
                >
                  <GenerateIcon size={15} />
                  <span>
                    {generating
                      ? t("generating", "正在收集并生成…")
                      : t("generate", "生成日报")}
                  </span>
                </button>
                <button
                  type="button"
                  className="dsdr-btn dsdr-btn-primary dsdr-split-toggle"
                  onClick={() => setFormatMenuOpen((open) => !open)}
                  disabled={generating}
                  aria-haspopup="menu"
                  aria-expanded={formatMenuOpen}
                  aria-label={t("format.label", "格式")}
                >
                  <ChevronIcon size={12} />
                </button>
                {formatMenuOpen ? (
                  <div className="dsdr-menu" role="menu">
                    <div className="dsdr-menu-title">
                      {t("format.label", "格式")}
                    </div>
                    {FORMAT_OPTIONS.map((format) => (
                      <button
                        type="button"
                        role="menuitemradio"
                        aria-checked={exportFormat === format}
                        className={
                          "dsdr-menu-item" +
                          (exportFormat === format ? " is-active" : "")
                        }
                        key={format}
                        onClick={() => {
                          setExportFormat(format);
                          setFormatMenuOpen(false);
                          generate(format);
                        }}
                      >
                        <span>{formatLabel(format, t)}</span>
                        <span className="dsdr-menu-check">
                          {exportFormat === format ? "✓" : ""}
                        </span>
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
            {saveText ? <div className="dsdr-save">{saveText}</div> : null}
          </div>
        </div>
        {generating ? (
          <section
            className="dsdr-card dsdr-progress-card"
            role="status"
            aria-live="polite"
          >
            <div className="dsdr-progress-head">
              <span>
                {(progress && progress.message) ||
                  t("generating", "正在收集并生成…")}
              </span>
              <div className="dsdr-actions">
                <span className="dsdr-progress-value">
                  {progress && !progress.indeterminate
                    ? Math.round(Number(progress.percent) || 0) + "%"
                    : "…"}
                </span>
                <button
                  type="button"
                  className="dsdr-btn"
                  onClick={cancelGeneration}
                >
                  {t("cancel", "取消")}
                </button>
              </div>
            </div>
            <div
              className={
                "dsdr-progress-track" +
                (progress && progress.indeterminate ? " is-indeterminate" : "")
              }
            >
              <div
                className="dsdr-progress-fill"
                style={{
                  width:
                    progress && progress.indeterminate
                      ? "35%"
                      : Math.max(
                          2,
                          Math.min(
                            100,
                            Number(progress && progress.percent) || 0,
                          ),
                        ) + "%",
                }}
              />
            </div>
            <div className="dsdr-hint">
              {t(
                "progress.hint",
                "AI 分析需要调用模型，耗时通常比普通汇总更长；请保持页面打开。",
              )}
            </div>
          </section>
        ) : null}
        {loadError ? <div className="dsdr-error">{loadError}</div> : null}
        {error ? (
          <div className="dsdr-error dsdr-error-row" role="alert">
            <span>{error}</span>
            <button
              type="button"
              className="dsdr-btn"
              onClick={() => generate()}
            >
              {t("retry", "重试")}
            </button>
          </div>
        ) : null}
        {preview ? <PreviewCard /> : null}
        <RangeCard />
        <AiCard />
        <ScheduleCard />
        <DataSourceCard />
        <div className="dsdr-footer">
          {t(
            "footer.tip",
            "Git 使用系统 git 与你的凭据配置；远程仓库会缓存在 DSH 数据目录。",
          )}
        </div>
        {result ? (
          <section className="dsdr-card">
            <div className="dsdr-card-head">
              <div>
                <div className="dsdr-card-title">
                  {t("result.title", "生成结果")}
                </div>
                <div className="dsdr-card-desc">{result.filename || ""}</div>
              </div>
              <button
                type="button"
                className="dsdr-btn dsdr-btn-primary"
                onClick={() => triggerDownload(result.url, result.filename)}
              >
                {t("result.download", "下载 XLSX")}
              </button>
            </div>
            <div className="dsdr-stats">
              <div className="dsdr-stat">
                <div className="dsdr-stat-value">
                  {String((result.stats && result.stats.commits) || 0)}
                </div>
                <div className="dsdr-stat-label">
                  {t("result.stats.commits", "Git 提交")}
                </div>
              </div>
              <div className="dsdr-stat">
                <div className="dsdr-stat-value">
                  {String((result.stats && result.stats.docs) || 0)}
                </div>
                <div className="dsdr-stat-label">
                  {t("result.stats.docs", "文档")}
                </div>
              </div>
              <div className="dsdr-stat">
                <div className="dsdr-stat-value">
                  {String((result.stats && result.stats.activeDays) || 0)}
                </div>
                <div className="dsdr-stat-label">
                  {t("result.stats.activeDays", "有记录天数")}
                </div>
              </div>
              <div className="dsdr-stat">
                <div className="dsdr-stat-value">
                  {String((result.stats && result.stats.sources) || 0)}
                </div>
                <div className="dsdr-stat-label">
                  {t("result.stats.sources", "数据源")}
                </div>
              </div>
            </div>
            {result.ai ? (
              <div className="dsdr-ai-result">
                <div className="dsdr-hint">
                  {t("result.ai.title", "AI 分析") +
                    (result.ai.provider
                      ? " · " + result.ai.provider + "/" + result.ai.model
                      : "") +
                    (result.ai.cachedDays > 0
                      ? " · " +
                        (localeIsEnglish ? "cache " : "缓存 ") +
                        result.ai.cachedDays +
                        (localeIsEnglish ? " day(s)" : " 天")
                      : "")}
                </div>
                {result.ai.ok ? (
                  <div className="dsdr-ai-text">
                    {result.ai.overall ||
                      t(
                        "result.ai.hint",
                        "逐日 AI 摘要已写入 XLSX 的「AI分析」工作表。",
                      )}
                  </div>
                ) : (
                  <div className="dsdr-ai-text dsdr-bad">
                    {t("result.ai.failed", "AI 分析未完成") +
                      (result.ai.error ? "：" + result.ai.error : "")}
                  </div>
                )}
              </div>
            ) : null}
            {result.sources && result.sources.length > 0 ? (
              <div className="dsdr-list">
                <div className="dsdr-hint">
                  {t("result.sources", "数据源状态")}
                </div>
                {result.sources.map((source, index) => (
                  <div className="dsdr-row" key={String(index)}>
                    <span className={"dsdr-dot " + (source.status || "ok")} />
                    <div>
                      <span className="dsdr-source-name">
                        {source.label || source.location || "—"}
                      </span>
                      {source.branch ? (
                        <span className="dsdr-source-meta">
                          {" · " + source.branch}
                        </span>
                      ) : null}
                      <span className="dsdr-source-meta">
                        {" · " +
                          (source.count || 0) +
                          " " +
                          (source.kind === "git"
                            ? t("result.unit.commits", "次提交")
                            : t("result.unit.docs", "份文档"))}
                      </span>
                      <div className="dsdr-source-meta">
                        {source.message || ""}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
            {result.warnings && result.warnings.length > 0 ? (
              <div className="dsdr-list">
                <div className="dsdr-hint dsdr-warn">
                  {t("result.warnings", "提示")}
                </div>
                {result.warnings.map((warning, index) => (
                  <div className="dsdr-row" key={String(index)}>
                    {"• " + warning}
                  </div>
                ))}
              </div>
            ) : null}
          </section>
        ) : null}
        <div className="dsdr-footer">
          {t(
            "page.footer",
            "数据仅在本机处理；生成的 XLSX 包含日报汇总、Git明细、文档明细、数据源与说明。",
          )}
        </div>
      </div>
    </div>
  );
}


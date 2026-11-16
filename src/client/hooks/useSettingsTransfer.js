import React from "react";
import { API, FORMAT_OPTIONS, cleanSettings, currentMonthRange, normalizeClientSettings } from "../helpers.js";

export function useSettingsTransfer({
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
  confirm = async () => true,
  showToast,
  t,
}) {
  const [saveState, setSaveState] = React.useState("idle");
  const firstSave = React.useRef(true);
  const saveAbortRef = React.useRef(null);
  const saveTimerRef = React.useRef(null);

  React.useEffect(() => {
    return () => {
      if (saveAbortRef.current) saveAbortRef.current.abort();
      if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    };
  }, []);

  React.useEffect(() => {
    if (loading) return;
    if (firstSave.current) {
      firstSave.current = false;
      return;
    }
    if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    saveTimerRef.current = window.setTimeout(() => {
      saveTimerRef.current = null;
      persistSettings();
    }, 650);
    return () => {
      if (saveTimerRef.current) {
        window.clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
      }
    };
  }, [settings, useAi, range, exportFormat, loading]);

  async function persistSettingsValue(cleaned) {
    if (saveAbortRef.current) saveAbortRef.current.abort();
    const controller = new AbortController();
    saveAbortRef.current = controller;
    setSaveState("saving");
    try {
      const response = await fetch(API + "/state", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ settings: cleaned }),
        signal: controller.signal,
      });
      if (!response.ok) throw new Error("save-failed");
      setSaveState("saved");
    } catch (err) {
      if (err && err.name === "AbortError") return;
      setSaveState("failed");
    } finally {
      if (saveAbortRef.current === controller) saveAbortRef.current = null;
    }
  }

  async function persistSettings() {
    await persistSettingsValue(
      cleanSettings(settings, useAi, range, exportFormat),
    );
  }

  function saveSettingsNow() {
    if (saveTimerRef.current) {
      window.clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    persistSettings();
  }

  function exportSettings() {
    const payload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      settings: cleanSettings(settings, useAi, range, exportFormat),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json;charset=utf-8",
    });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "daily-report-settings.json";
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    window.setTimeout(() => window.URL.revokeObjectURL(url), 1000);
    setSettingsMenuOpen(false);
  }

  async function importSettingsFile(event) {
    const file = event.target.files && event.target.files[0];
    event.target.value = "";
    if (!file) return;
    setSettingsMenuOpen(false);
    try {
      const parsed = JSON.parse(await file.text());
      const source =
        parsed &&
        typeof parsed === "object" &&
        parsed.settings &&
        typeof parsed.settings === "object"
          ? parsed.settings
          : parsed;
      if (!source || typeof source !== "object" || Array.isArray(source)) {
        throw new Error("JSON 中没有有效的 settings 对象");
      }
      const imported = normalizeClientSettings(source);
      const nextAi = source.aiEnabled !== false;
      const nextRange =
        source.range &&
        typeof source.range.start === "string" &&
        typeof source.range.end === "string" &&
        source.range.start <= source.range.end
          ? { start: source.range.start, end: source.range.end }
          : currentMonthRange();
      const nextFormat = FORMAT_OPTIONS.includes(source.format)
        ? source.format
        : "xlsx";
      const accepted = await confirm({
        title: t("confirm.importSettings.title", "导入设置？"),
        message: t(
          "confirm.importSettings.message",
          "当前数据源、AI、日期范围和导出格式将被导入内容覆盖。",
        ),
        confirmLabel: t("confirm.import", "导入"),
        cancelLabel: t("confirm.cancel", "取消"),
      });
      if (!accepted) return;
      setSettings(imported);
      setUseAi(nextAi);
      setRange(nextRange);
      setExportFormat(nextFormat);
      setError("");
      await persistSettingsValue(
        cleanSettings(imported, nextAi, nextRange, nextFormat),
      );
    } catch (err) {
      setError(
        t("settings.importFailed", "导入设置失败：") +
          (err && err.message ? err.message : "未知错误"),
      );
    }
  }

  async function clearCache() {
    setSettingsMenuOpen(false);
    const accepted = await confirm({
      title: t("confirm.clearCache.title", "清除缓存？"),
      message: t(
        "confirm.clearCache.message",
        "将删除 AI 摘要缓存和远程仓库缓存。下次生成会重新分析和重新克隆，耗时和 token 消耗都会增加。已生成的日报和历史文件不受影响。",
      ),
      confirmLabel: t("confirm.clearCache.confirm", "清除"),
      cancelLabel: t("confirm.cancel", "取消"),
      danger: true,
    });
    if (!accepted) return;
    try {
      const response = await fetch(API + "/cache/clear", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!response.ok) throw new Error("clear-failed");
      setError("");
      if (typeof showToast === "function") {
        showToast(t("toast.cacheCleared", "缓存已清除"));
      }
    } catch (err) {
      setError(
        t("settings.clearCacheFailed", "清除缓存失败：") +
          (err && err.message ? err.message : "未知错误"),
      );
    }
  }

  async function resetAllSettings() {
    setSettingsMenuOpen(false);
    const accepted = await confirm({
      title: t("confirm.resetSettings.title", "还原所有默认配置？"),
      message: t(
        "confirm.resetSettings.message",
        "将清空所有 Git 仓库和本地文档，并把 AI、定时汇总、日期范围和导出格式恢复为默认值。已生成的日报和历史文件不受影响，此操作不可撤销。",
      ),
      confirmLabel: t("confirm.resetSettings.confirm", "还原"),
      cancelLabel: t("confirm.cancel", "取消"),
      danger: true,
    });
    if (!accepted) return;
    try {
      const response = await fetch(API + "/settings/reset", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!response.ok) throw new Error("reset-failed");
      const payload = await response.json();
      const next = normalizeClientSettings(payload.settings || {});
      setSettings(next);
      setUseAi(payload.settings ? payload.settings.aiEnabled !== false : true);
      setRange(currentMonthRange());
      setExportFormat(
        payload.settings && FORMAT_OPTIONS.includes(payload.settings.format)
          ? payload.settings.format
          : "xlsx",
      );
      firstSave.current = true;
      setError("");
      if (typeof showToast === "function") {
        showToast(t("toast.settingsReset", "已还原默认配置"));
      }
    } catch (err) {
      setError(
        t("settings.resetFailed", "还原默认配置失败：") +
          (err && err.message ? err.message : "未知错误"),
      );
    }
  }

  return {
    saveState,
    saveSettingsNow,
    persistSettings,
    exportSettings,
    importSettingsFile,
    clearCache,
    resetAllSettings,
  };
}


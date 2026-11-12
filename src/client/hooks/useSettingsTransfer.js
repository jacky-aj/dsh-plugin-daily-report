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

  return {
    saveState,
    saveSettingsNow,
    persistSettings,
    exportSettings,
    importSettingsFile,
  };
}


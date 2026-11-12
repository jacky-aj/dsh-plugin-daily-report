// @vitest-environment jsdom
import React from "react";
import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AppContext } from "../../src/client/context.jsx";
import { DailyReportPage } from "../../src/client/views/DailyReportPage.jsx";

const t = (key, fallback) => fallback || key;
const noop = () => {};
const ref = { current: null };

afterEach(() => {
  document.body.innerHTML = "";
});

describe("page states", () => {
  it("renders the loading branch", () => {
    render(
      <AppContext.Provider value={{ loading: true, t }}>
        <DailyReportPage />
      </AppContext.Provider>,
    );
    expect(screen.getByText("正在读取配置…")).toBeTruthy();
  });

  it("renders errors, progress, preview, result and open menus", () => {
    const day = {
      date: "2026-11-01",
      weekday: "Sunday",
      commitCount: 1,
      docCount: 0,
      summary: "raw",
      aiSummary: "AI",
      manualItems: [],
    };
    const app = {
      loading: false,
      loadError: "load warn",
      error: "boom",
      result: {
        filename: "demo.xlsx",
        url: "blob:demo",
        stats: { commits: 1, docs: 0, activeDays: 1, sources: 1 },
        sources: [{ kind: "git", label: "repo", status: "ok", count: 1, message: "ok" }],
        warnings: ["warning"],
        ai: { ok: true, provider: "test", model: "mock", overall: "overall" },
      },
      saveText: "设置已保存",
      saveState: "saved",
      saveSettingsNow: noop,
      exportSettings: noop,
      importSettingsFile: noop,
      formatMenuOpen: true,
      setFormatMenuOpen: noop,
      settingsMenuOpen: true,
      setSettingsMenuOpen: noop,
      formatMenuRef: ref,
      settingsMenuRef: ref,
      settingsFileRef: ref,
      settings: { git: [], docs: [], scheduleEnabled: true, format: "xlsx" },
      setSettings: noop,
      range: { start: "2026-11-01", end: "2026-11-30" },
      setRange: noop,
      rangeDays: 30,
      exportFormat: "xlsx",
      setExportFormat: noop,
      useAi: true,
      setUseAi: noop,
      aiInfo: { available: true, provider: "test", model: "mock", models: [] },
      preview: { range: { start: "2026-11-01", end: "2026-11-30" }, ai: { ok: true, overall: "overall" }, days: [day] },
      setPreview: noop,
      previewDays: [day],
      allPreviewExpanded: false,
      exporting: false,
      regenerating: "",
      expandedPreviewDays: {},
      manualDate: "2026-11-01",
      manualText: "",
      setAllPreviewExpanded: noop,
      exportPreview: noop,
      setManualDate: noop,
      setManualText: noop,
      addManualItem: noop,
      togglePreviewDay: noop,
      regeneratePreviewDay: noop,
      updatePreviewDay: noop,
      removeManualItem: noop,
      formatShortLabel: () => "XLSX",
      scheduleStatus: { state: { lastAt: "2026-11-01 10:00" }, history: [] },
      scheduleLoading: false,
      scheduleError: "",
      loadScheduleStatus: noop,
      runScheduleNow: noop,
      showScan: false,
      scanDir: "",
      setScanDir: noop,
      scanAndAdd: noop,
      scanning: false,
      scanError: "",
      scanMessage: "",
      pickScanDirectory: noop,
      toggleScan: noop,
      testSources: noop,
      testingSources: false,
      testError: "",
      testResults: [],
      dataSourceTab: "git",
      setDataSourceTab: noop,
      updateGit: noop,
      removeGit: noop,
      addGit: noop,
      updateDoc: noop,
      removeDoc: noop,
      addDoc: noop,
      localeIsEnglish: false,
      generating: true,
      progress: { percent: 50, indeterminate: false, message: "working" },
      generate: noop,
      cancelGeneration: noop,
      t,
    };
    render(
      <AppContext.Provider value={app}>
        <DailyReportPage />
      </AppContext.Provider>,
    );
    expect(screen.getByText("load warn")).toBeTruthy();
    expect(screen.getByText("boom")).toBeTruthy();
    expect(screen.getByText("working")).toBeTruthy();
    expect(screen.getByText("生成结果预览")).toBeTruthy();
    expect(screen.getByText("生成结果")).toBeTruthy();
    expect(screen.getByText("导出设置")).toBeTruthy();
    expect(screen.getByText("最近 7 天")).toBeTruthy();
  });
});


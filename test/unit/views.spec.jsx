// @vitest-environment jsdom
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AppContext } from "../../src/client/context.jsx";
import { Button } from "../../src/client/components/Button.jsx";
import { Card } from "../../src/client/components/Card.jsx";
import { Switch } from "../../src/client/components/Switch.jsx";
import { AiCard } from "../../src/client/views/AiCard.jsx";
import { DataSourceCard } from "../../src/client/views/DataSourceCard.jsx";
import { DailyReportPage } from "../../src/client/views/DailyReportPage.jsx";
import { PreviewCard } from "../../src/client/views/PreviewCard.jsx";
import { RangeCard } from "../../src/client/views/RangeCard.jsx";
import { ScheduleCard } from "../../src/client/views/ScheduleCard.jsx";

const t = (key, fallback) => fallback || key;

afterEach(() => {
  cleanup();
});

function withApp(app, node) {
  return <AppContext.Provider value={app}>{node}</AppContext.Provider>;
}

describe("ESM views and components", () => {
  it("renders shared Button, Card and Switch components", () => {
    render(
      <Card>
        <Switch checked label="toggle" onChange={() => {}} />
        <Button icon={<span>+</span>} onClick={() => {}}>
          Action
        </Button>
      </Card>,
    );
    expect(screen.getByRole("button", { name: /Action/ })).toBeTruthy();
    expect(screen.getByRole("switch", { name: "toggle" })).toBeTruthy();
    expect(screen.getByRole("switch").checked).toBe(true);
  });

  it("renders the range card from app context", () => {
    render(
      withApp(
        {
          range: { start: "2026-11-01", end: "2026-11-30" },
          setRange: vi.fn(),
          rangeDays: 30,
          t,
        },
        <RangeCard />,
      ),
    );
    expect(screen.getByText("汇总时间范围")).toBeTruthy();
    expect(screen.getByDisplayValue("2026-11-01")).toBeTruthy();
  });

  it("renders AI settings and toggles", () => {
    render(
      withApp(
        {
          settings: { aiTemplate: "concise", aiProvider: "", aiModel: "" },
          setSettings: vi.fn(),
          useAi: true,
          setUseAi: vi.fn(),
          aiInfo: { available: true, provider: "test", model: "mock", models: [] },
          t,
        },
        <AiCard />,
      ),
    );
    expect(screen.getByText("AI 分析")).toBeTruthy();
    expect(screen.getByRole("switch")).toBeTruthy();
    expect(screen.getByDisplayValue("简洁")).toBeTruthy();
  });

  it("renders schedule actions", () => {
    render(
      withApp(
        {
          settings: { scheduleEnabled: true, scheduleFrequency: "daily", scheduleTime: "18:30" },
          setSettings: vi.fn(),
          scheduleStatus: null,
          scheduleLoading: false,
          scheduleError: "",
          loadScheduleStatus: vi.fn(),
          runScheduleNow: vi.fn(),
          t,
        },
        <ScheduleCard />,
      ),
    );
    expect(screen.getByText("定时汇总")).toBeTruthy();
    expect(screen.getByRole("button", { name: /立即运行一次/ })).toBeTruthy();
    expect(screen.getByRole("button", { name: /刷新状态/ })).toBeTruthy();
  });

  it("renders data source tabs and empty states", () => {
    render(
      withApp(
        {
          settings: { git: [{ _key: "g1", location: "D:/repo", branch: "main", label: "repo" }], docs: [] },
          setSettings: vi.fn(),
          updateGit: vi.fn(),
          removeGit: vi.fn(),
          addGit: vi.fn(),
          updateDoc: vi.fn(),
          removeDoc: vi.fn(),
          addDoc: vi.fn(),
          showScan: false,
          scanDir: "",
          setScanDir: vi.fn(),
          scanAndAdd: vi.fn(),
          scanning: false,
          scanError: "",
          scanMessage: "",
          pickScanDirectory: vi.fn(),
          toggleScan: vi.fn(),
          testSources: vi.fn(),
          testingSources: false,
          testError: "",
          testResults: [],
          dataSourceTab: "git",
          setDataSourceTab: vi.fn(),
          t,
        },
        <DataSourceCard />,
      ),
    );
    expect(screen.getByText("数据源配置")).toBeTruthy();
    expect(screen.getAllByText("Git 仓库").length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole("tab", { name: /本地文档/ }));
    expect(screen.getAllByText("本地文档").length).toBeGreaterThan(0);
  });

  it("renders preview and expand/collapse controls", () => {
    const setAllPreviewExpanded = vi.fn();
    const preview = {
      range: { start: "2026-11-01", end: "2026-11-30" },
      ai: { ok: true, overall: "Overall" },
      days: [
        {
          date: "2026-11-01",
          weekday: "Sunday",
          commitCount: 1,
          docCount: 0,
          summary: "raw",
          aiSummary: "AI",
        },
      ],
    };
    const previewDays = preview.days;
    render(
      withApp(
        {
          preview,
          previewDays,
          allPreviewExpanded: false,
          exportFormat: "xlsx",
          exporting: false,
          regenerating: "",
          expandedPreviewDays: {},
          manualDate: "2026-11-01",
          manualText: "",
          setAllPreviewExpanded,
          exportPreview: vi.fn(),
          setPreview: vi.fn(),
          setManualDate: vi.fn(),
          setManualText: vi.fn(),
          addManualItem: vi.fn(),
          togglePreviewDay: vi.fn(),
          regeneratePreviewDay: vi.fn(),
          updatePreviewDay: vi.fn(),
          removeManualItem: vi.fn(),
          formatShortLabel: () => "XLSX",
          t,
        },
        <PreviewCard />,
      ),
    );
    expect(screen.getByText("生成结果预览")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /全部展开/ }));
    expect(setAllPreviewExpanded).toHaveBeenCalledWith(true);
  });

  it("renders the full page shell", () => {
    const noop = vi.fn();
    const ref = { current: null };
    render(
      withApp(
        {
          loading: false,
          loadError: "",
          error: "",
          result: null,
          saveText: "",
          saveState: "idle",
          saveSettingsNow: noop,
          exportSettings: noop,
          importSettingsFile: noop,
          formatMenuOpen: false,
          setFormatMenuOpen: noop,
          settingsMenuOpen: false,
          setSettingsMenuOpen: noop,
          formatMenuRef: ref,
          settingsMenuRef: ref,
          settingsFileRef: ref,
          settings: { git: [], docs: [], scheduleEnabled: false },
          setSettings: noop,
          range: { start: "2026-11-01", end: "2026-11-30" },
          setRange: noop,
          rangeDays: 30,
          exportFormat: "xlsx",
          setExportFormat: noop,
          useAi: true,
          setUseAi: noop,
          aiInfo: { available: true, provider: "test", model: "mock", models: [] },
          preview: null,
          setPreview: noop,
          previewDays: [],
          allPreviewExpanded: false,
          exporting: false,
          regenerating: "",
          expandedPreviewDays: {},
          manualDate: "",
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
          scheduleStatus: null,
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
          generating: false,
          progress: null,
          generate: noop,
          cancelGeneration: noop,
          t,
        },
        <DailyReportPage />,
      ),
    );
    expect(screen.getByRole("heading", { name: "日报汇总" })).toBeTruthy();
    expect(screen.getByText("AI 分析")).toBeTruthy();
  });
});




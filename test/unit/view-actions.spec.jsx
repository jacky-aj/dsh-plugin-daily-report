// @vitest-environment jsdom
import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AppContext } from "../../src/client/context.jsx";
import { AiCard } from "../../src/client/views/AiCard.jsx";
import { DataSourceCard } from "../../src/client/views/DataSourceCard.jsx";
import { PreviewCard } from "../../src/client/views/PreviewCard.jsx";
import { RangeCard } from "../../src/client/views/RangeCard.jsx";
import { ScheduleCard } from "../../src/client/views/ScheduleCard.jsx";

const t = (key, fallback) => fallback || key;

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

function withApp(app, node) {
  return <AppContext.Provider value={app}>{node}</AppContext.Provider>;
}

describe("view interactions", () => {
  it("changes AI style and toggle", async () => {
    const setSettings = vi.fn();
    const setUseAi = vi.fn();
    render(
      withApp(
        {
          settings: { aiTemplate: "concise", aiProvider: "", aiModel: "" },
          setSettings,
          useAi: true,
          setUseAi,
          aiInfo: { available: true, provider: "test", model: "mock", models: [] },
          confirm: async () => true,
          t,
        },
        <AiCard />,
      ),
    );
    fireEvent.click(screen.getByRole("switch"));
    await waitFor(() => expect(setUseAi).toHaveBeenCalledWith(false));
    fireEvent.change(screen.getByDisplayValue("简洁"), { target: { value: "detailed" } });
    expect(setSettings).toHaveBeenCalled();
  });

  it("explains unavailable AI and lets the user pick models", async () => {
    const setSettings = vi.fn();
    render(
      withApp(
        {
          settings: { aiTemplate: "manager", aiProvider: "provider-a", aiModel: "model-a" },
          setSettings,
          useAi: false,
          setUseAi: vi.fn(),
          aiInfo: {
            available: false,
            provider: "provider-a",
            model: "model-a",
            models: [
              { id: "model-a", name: "Model A" },
              { id: "model-b", name: "Model B" },
            ],
          },
          t,
        },
        <AiCard />,
      ),
    );
    expect(screen.getByRole("switch").disabled).toBe(true);
    const combos = screen.getAllByRole("combobox");
    fireEvent.change(combos[1], { target: { value: "model-b" } });
    await waitFor(() => expect(setSettings).toHaveBeenCalled());
  });

  it("edits, adds and removes Git sources", () => {
    const updateGit = vi.fn();
    const removeGit = vi.fn();
    const addGit = vi.fn();
    const app = {
      settings: { git: [{ _key: "g1", location: "D:/repo", branch: "main", label: "repo" }], docs: [] },
      setSettings: vi.fn(),
      updateGit,
      removeGit,
      addGit,
      updateDoc: vi.fn(),
      removeDoc: vi.fn(),
      addDoc: vi.fn(),
      showScan: true,
      scanDir: "D:/repos",
      setScanDir: vi.fn(),
      scanAndAdd: vi.fn(),
      scanning: false,
      scanError: "scan error",
      scanMessage: "",
      pickScanDirectory: vi.fn(),
      toggleScan: vi.fn(),
      testSources: vi.fn(),
      testingSources: false,
      testError: "",
      testResults: [{ label: "repo", status: "ok", message: "ok" }],
      dataSourceTab: "git",
      setDataSourceTab: vi.fn(),
      t,
    };
    render(withApp(app, <DataSourceCard />));
    fireEvent.change(screen.getByDisplayValue("D:/repo"), { target: { value: "D:/repo2" } });
    expect(updateGit).toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: /添加仓库/ }));
    expect(addGit).toHaveBeenCalled();
    fireEvent.click(screen.getAllByTitle("移除")[0]);
    expect(removeGit).toHaveBeenCalled();
    expect(screen.getByText("scan error")).toBeTruthy();
    expect(screen.getByText("repo", { exact: false })).toBeTruthy();
  });

  it("asks before unchecking mine-only and keeps it when cancelled", async () => {
    const setSettings = vi.fn();
    const confirm = vi.fn(async () => false);
    const app = {
      settings: { git: [], docs: [], mineOnly: true, excludeMerges: true },
      setSettings,
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
      confirm,
      t,
    };
    render(withApp(app, <DataSourceCard />));
    const mine = screen.getByLabelText("仅统计我的提交");
    fireEvent.click(mine);
    await waitFor(() => expect(confirm).toHaveBeenCalled());
    expect(setSettings).not.toHaveBeenCalled();
  });

  it("unchecks mine-only after confirming", async () => {
    const setSettings = vi.fn();
    const app = {
      settings: { git: [], docs: [], mineOnly: true, excludeMerges: true },
      setSettings,
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
      confirm: async () => true,
      t,
    };
    render(withApp(app, <DataSourceCard />));
    fireEvent.click(screen.getByLabelText("仅统计我的提交"));
    await waitFor(() => expect(setSettings).toHaveBeenCalled());
    const updater = setSettings.mock.calls[0][0];
    expect(updater({ mineOnly: true }).mineOnly).toBe(false);
  });

  it("edits and adds local documents", () => {
    const updateDoc = vi.fn();
    const addDoc = vi.fn();
    const removeDoc = vi.fn();
    render(
      withApp(
        {
          settings: { git: [], docs: [{ _key: "d1", location: "D:/notes", label: "notes" }] },
          setSettings: vi.fn(),
          updateGit: vi.fn(),
          removeGit: vi.fn(),
          addGit: vi.fn(),
          updateDoc,
          removeDoc,
          addDoc,
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
          dataSourceTab: "docs",
          setDataSourceTab: vi.fn(),
          t,
        },
        <DataSourceCard />,
      ),
    );
    fireEvent.change(screen.getByDisplayValue("D:/notes"), { target: { value: "D:/notes2" } });
    expect(updateDoc).toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: /添加文档/ }));
    expect(addDoc).toHaveBeenCalled();
    fireEvent.click(screen.getAllByTitle("移除")[0]);
    expect(removeDoc).toHaveBeenCalled();
  });

  it("expands a preview day and triggers single-day regeneration", () => {
    const regeneratePreviewDay = vi.fn();
    const exportPreview = vi.fn();
    const day = {
      date: "2026-11-01",
      weekday: "Sunday",
      commitCount: 1,
      docCount: 0,
      summary: "raw",
      aiSummary: "AI",
      manualItems: ["meeting"],
    };
    render(
      withApp(
        {
          preview: { range: { start: "2026-11-01", end: "2026-11-30" }, ai: { ok: true, overall: "overall" }, days: [day] },
          previewDays: [day],
          allPreviewExpanded: true,
          exportFormat: "xlsx",
          exporting: false,
          regenerating: "",
          expandedPreviewDays: { "2026-11-01": true },
          manualDate: "2026-11-01",
          manualText: "",
          setAllPreviewExpanded: vi.fn(),
          exportPreview,
          setPreview: vi.fn(),
          setManualDate: vi.fn(),
          setManualText: vi.fn(),
          addManualItem: vi.fn(),
          togglePreviewDay: vi.fn(),
          regeneratePreviewDay,
          updatePreviewDay: vi.fn(),
          removeManualItem: vi.fn(),
          formatShortLabel: () => "XLSX",
          t,
        },
        <PreviewCard />,
      ),
    );
    expect(screen.getByDisplayValue("AI")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /重新分析这天/ }));
    expect(regeneratePreviewDay).toHaveBeenCalledWith("2026-11-01");
    fireEvent.click(screen.getByRole("button", { name: /导出 XLSX/ }));
    expect(exportPreview).toHaveBeenCalled();
    expect(screen.getByText("meeting")).toBeTruthy();
  });

  it("changes schedule settings and runs actions", () => {
    const setSettings = vi.fn();
    const runScheduleNow = vi.fn();
    const loadScheduleStatus = vi.fn();
    render(
      withApp(
        {
          settings: { scheduleEnabled: true, scheduleFrequency: "daily", scheduleTime: "18:30" },
          setSettings,
          scheduleStatus: {
            running: false,
            directory: "D:/history",
            state: {
              lastAt: "2026-11-01 10:00",
              lastStatus: "error",
              lastError: "last failed",
              lastFile: "a.xlsx",
            },
            history: [{ name: "a.xlsx" }, { name: "b.xlsx" }],
          },
          scheduleLoading: false,
          scheduleError: "schedule failed",
          loadScheduleStatus,
          runScheduleNow,
          t,
        },
        <ScheduleCard />,
      ),
    );
    fireEvent.click(screen.getByRole("switch"));
    expect(setSettings).toHaveBeenCalled();
    fireEvent.change(screen.getByDisplayValue("每天"), { target: { value: "weekly" } });
    expect(setSettings).toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: /刷新状态/ }));
    expect(loadScheduleStatus).toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: /立即运行一次/ }));
    expect(runScheduleNow).toHaveBeenCalled();
  });

  it("applies quick range buttons", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 10, 4, 10, 0, 0));
    const setRange = vi.fn();
    render(
      withApp(
        {
          range: { start: "2026-11-01", end: "2026-11-30" },
          setRange,
          rangeDays: 30,
          t,
        },
        <RangeCard />,
      ),
    );
    fireEvent.click(screen.getByRole("button", { name: "昨天" }));
    expect(setRange).toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "本周" }));
    expect(setRange).toHaveBeenCalledTimes(2);
  });
});


// @vitest-environment jsdom
import React from "react";
import { act, cleanup, fireEvent, render, renderHook, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useGeneration } from "../../src/client/hooks/useGeneration.js";
import { useMenus } from "../../src/client/hooks/useMenus.js";
import { usePreview } from "../../src/client/hooks/usePreview.js";
import { useSchedule } from "../../src/client/hooks/useSchedule.js";
import { useSettingsTransfer } from "../../src/client/hooks/useSettingsTransfer.js";

const t = (key, fallback) => fallback || key;

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

beforeEach(() => {
  vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
});

describe("remaining ESM hooks", () => {
  it("edits and exports a preview", async () => {
    const setResult = vi.fn();
    const setError = vi.fn();
    const resultRef = { current: null };
    vi.stubGlobal("URL", {
      createObjectURL: () => "blob:test",
      revokeObjectURL: () => {},
    });
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        headers: { get: () => null },
        blob: async () => new Blob(["xlsx"]),
      })),
    );
    const { result } = renderHook(() =>
      usePreview({ exportFormat: "xlsx", setResult, resultRef, setError, t, errorMessageFromPayload: () => "error" }),
    );
    act(() =>
      result.current.setPreview({
        range: { start: "2026-11-01", end: "2026-11-30" },
        ai: { ok: true, overall: "overall" },
        days: [{ date: "2026-11-01", aiSummary: "AI", commitCount: 1, docCount: 0 }],
      }),
    );
    act(() => result.current.setPreviewJobId("job-1"));
    act(() => result.current.setManualDate("2026-11-01"));
    act(() => result.current.setManualText("meeting"));
    act(() => result.current.addManualItem());
    expect(result.current.preview.days[0].manualItems).toContain("meeting");
    act(() => result.current.setAllPreviewExpanded(true));
    expect(result.current.expandedPreviewDays["2026-11-01"]).toBe(true);
    await act(async () => result.current.exportPreview());
    expect(setResult).toHaveBeenCalled();
  });

  it("saves, exports and imports settings", async () => {
    const fetchMock = vi.fn(async () => ({ ok: true, json: async () => ({}) }));
    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("URL", {
      createObjectURL: () => "blob:test",
      revokeObjectURL: () => {},
    });
    const setSettings = vi.fn();
    const setUseAi = vi.fn();
    const setRange = vi.fn();
    const setExportFormat = vi.fn();
    const setError = vi.fn();
    const setSettingsMenuOpen = vi.fn();
    const { result } = renderHook(() =>
      useSettingsTransfer({
        settings: { git: [{ location: "D:/repo", branch: "main", label: "repo" }], docs: [] },
        setSettings,
        useAi: true,
        setUseAi,
        range: { start: "2026-11-01", end: "2026-11-30" },
        setRange,
        exportFormat: "xlsx",
        setExportFormat,
        loading: false,
        setError,
        setSettingsMenuOpen,
        t,
      }),
    );
    await act(async () => result.current.saveSettingsNow());
    expect(fetchMock).toHaveBeenCalled();
    act(() => result.current.exportSettings());
    await act(async () =>
      result.current.importSettingsFile({
        target: {
          files: [{ text: async () => JSON.stringify({ settings: { git: [], docs: [] } }) }],
          value: "",
        },
      }),
    );
    expect(setSettings).toHaveBeenCalled();
  });

  it("runs a generation job", async () => {
    const setPreview = vi.fn();
    const setPreviewJobId = vi.fn();
    const setResult = vi.fn();
    const setError = vi.fn();
    const setProgress = vi.fn();
    const fetchMock = vi.fn(async (url) => {
      if (String(url).includes("/generate/start")) {
        return { ok: true, json: async () => ({ jobId: "job-1" }) };
      }
      if (String(url).includes("/job?")) {
        return { ok: true, json: async () => ({ status: "done", progress: { percent: 100 } }) };
      }
      return {
        ok: true,
        json: async () => ({
          range: { start: "2026-11-01", end: "2026-11-30" },
          days: [],
          ai: null,
        }),
      };
    });
    vi.stubGlobal("fetch", fetchMock);
    const { result } = renderHook(() =>
      useGeneration({
        settings: { git: [{ location: "D:/repo", branch: "main", label: "repo" }], docs: [] },
        useAi: false,
        range: { start: "2026-11-01", end: "2026-11-30" },
        exportFormat: "xlsx",
        aiInfo: { available: true },
        ctx: { locale: { getLocale: () => ({ id: "zh" }) } },
        setExportFormat: vi.fn(),
        setFormatMenuOpen: vi.fn(),
        setResult,
        setPreview,
        setPreviewJobId,
        setExpandedPreviewDays: vi.fn(),
        setManualDate: vi.fn(),
        setError,
        sessionId: "",
        t,
        errorMessageFromPayload: () => "error",
        resultRef: { current: null },
      }),
    );
    await act(async () => result.current.generate());
    expect(setPreview).toHaveBeenCalled();
    expect(setPreviewJobId).toHaveBeenCalledWith("job-1");
  });

  it("runs a schedule action and reports status", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url) => ({
        ok: true,
        json: async () => ({
          ok: true,
          status: { state: { lastAt: "2026-11-01 10:00" }, history: [] },
        }),
      })),
    );
    const { result } = renderHook(() =>
      useSchedule({ enabled: false, sessionId: "", t, errorMessageFromPayload: () => "error" }),
    );
    await act(async () => result.current.runScheduleNow());
    expect(result.current.scheduleStatus.state.lastAt).toBe("2026-11-01 10:00");
  });

  it("rejects generation without sources", async () => {
    const setError = vi.fn();
    const { result } = renderHook(() =>
      useGeneration({
        settings: { git: [], docs: [] },
        useAi: false,
        range: { start: "2026-11-01", end: "2026-11-30" },
        exportFormat: "xlsx",
        aiInfo: { available: true },
        ctx: { locale: { getLocale: () => ({ id: "zh" }) } },
        setExportFormat: vi.fn(),
        setFormatMenuOpen: vi.fn(),
        setResult: vi.fn(),
        setPreview: vi.fn(),
        setPreviewJobId: vi.fn(),
        setExpandedPreviewDays: vi.fn(),
        setManualDate: vi.fn(),
        setError,
        sessionId: "",
        t,
        errorMessageFromPayload: () => "error",
        resultRef: { current: null },
      }),
    );
    await act(async () => result.current.generate());
    expect(setError).toHaveBeenCalled();
  });

  it("reports preview export failures", async () => {
    const setError = vi.fn();
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: false, json: async () => ({ error: { code: "x", message: "failed" } }) })),
    );
    const { result } = renderHook(() =>
      usePreview({
        exportFormat: "xlsx",
        setResult: vi.fn(),
        resultRef: { current: null },
        setError,
        t,
        errorMessageFromPayload: () => "export error",
      }),
    );
    act(() =>
      result.current.setPreview({
        range: { start: "2026-11-01", end: "2026-11-30" },
        ai: { ok: true },
        days: [{ date: "2026-11-01", manualItems: [] }],
      }),
    );
    act(() => result.current.setPreviewJobId("job-1"));
    await act(async () => result.current.exportPreview());
    expect(setError).toHaveBeenCalledWith("export error");
    await act(async () => result.current.regeneratePreviewDay("2026-11-01"));
    expect(setError).toHaveBeenCalled();
  });

  it("reports schedule run failures", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        json: async () => ({ error: { code: "failed", message: "schedule failed" } }),
      })),
    );
    const { result } = renderHook(() =>
      useSchedule({ enabled: false, sessionId: "", t, errorMessageFromPayload: () => "error" }),
    );
    await act(async () => result.current.runScheduleNow());
    expect(result.current.scheduleError).toBe("error");
  });

  it("reports generation job failures", async () => {
    const setError = vi.fn();
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url) => {
        if (String(url).includes("/generate/start")) {
          return { ok: true, json: async () => ({ jobId: "job-1" }) };
        }
        return { ok: true, json: async () => ({ status: "failed", error: { code: "failed", message: "job failed" } }) };
      }),
    );
    const { result } = renderHook(() =>
      useGeneration({
        settings: { git: [{ location: "D:/repo", branch: "main", label: "repo" }], docs: [] },
        useAi: false,
        range: { start: "2026-11-01", end: "2026-11-30" },
        exportFormat: "xlsx",
        aiInfo: { available: true },
        ctx: { locale: { getLocale: () => ({ id: "zh" }) } },
        setExportFormat: vi.fn(),
        setFormatMenuOpen: vi.fn(),
        setResult: vi.fn(),
        setPreview: vi.fn(),
        setPreviewJobId: vi.fn(),
        setExpandedPreviewDays: vi.fn(),
        setManualDate: vi.fn(),
        setError,
        sessionId: "",
        t,
        errorMessageFromPayload: () => "job error",
        resultRef: { current: null },
      }),
    );
    await act(async () => result.current.generate());
    expect(setError).toHaveBeenCalledWith("job error");
  });

  it("regenerates one preview day", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({ ok: true, day: { summary: "new", highlights: [], categories: [] } }),
      })),
    );
    const { result } = renderHook(() =>
      usePreview({
        exportFormat: "xlsx",
        setResult: vi.fn(),
        resultRef: { current: null },
        setError: vi.fn(),
        t,
        errorMessageFromPayload: () => "error",
      }),
    );
    act(() =>
      result.current.setPreview({
        range: { start: "2026-11-01", end: "2026-11-30" },
        ai: { ok: true },
        days: [{ date: "2026-11-01", manualItems: [] }],
      }),
    );
    act(() => result.current.setPreviewJobId("job-1"));
    await act(async () => result.current.regeneratePreviewDay("2026-11-01"));
    expect(result.current.preview.days[0].aiSummary).toBe("new");
  });

  it("validates generation ranges", async () => {
    const setError = vi.fn();
    const { result } = renderHook(() =>
      useGeneration({
        settings: { git: [{ location: "D:/repo", branch: "main", label: "repo" }], docs: [] },
        useAi: false,
        range: { start: "2026-11-03", end: "2026-11-01" },
        exportFormat: "xlsx",
        aiInfo: { available: true },
        ctx: { locale: { getLocale: () => ({ id: "zh" }) } },
        setExportFormat: vi.fn(),
        setFormatMenuOpen: vi.fn(),
        setResult: vi.fn(),
        setPreview: vi.fn(),
        setPreviewJobId: vi.fn(),
        setExpandedPreviewDays: vi.fn(),
        setManualDate: vi.fn(),
        setError,
        sessionId: "",
        t,
        errorMessageFromPayload: () => "job error",
        resultRef: { current: null },
      }),
    );
    await act(async () => result.current.generate());
    expect(setError).toHaveBeenCalledWith("日期范围无效，请检查开始和结束日期。");
  });

  it("reports generation start errors", async () => {
    const setError = vi.fn();
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        json: async () => ({ error: { code: "x", message: "start failed" } }),
      })),
    );
    const { result } = renderHook(() =>
      useGeneration({
        settings: { git: [{ location: "D:/repo", branch: "main", label: "repo" }], docs: [] },
        useAi: false,
        range: { start: "2026-11-01", end: "2026-11-30" },
        exportFormat: "xlsx",
        aiInfo: { available: true },
        ctx: { locale: { getLocale: () => ({ id: "zh" }) } },
        setExportFormat: vi.fn(),
        setFormatMenuOpen: vi.fn(),
        setResult: vi.fn(),
        setPreview: vi.fn(),
        setPreviewJobId: vi.fn(),
        setExpandedPreviewDays: vi.fn(),
        setManualDate: vi.fn(),
        setError,
        sessionId: "",
        t,
        errorMessageFromPayload: () => "start error",
        resultRef: { current: null },
      }),
    );
    await act(async () => result.current.generate());
    expect(setError).toHaveBeenCalledWith("start error");
  });

  it("closes menus on outside click", async () => {
    function MenuHarness() {
      const menu = useMenus();
      return (
        <div>
          <div ref={menu.formatMenuRef}>inside</div>
          <button type="button" onClick={() => menu.setFormatMenuOpen(true)}>
            open
          </button>
          <span>{String(menu.formatMenuOpen)}</span>
        </div>
      );
    }
    render(<MenuHarness />);
    fireEvent.click(screen.getByRole("button", { name: "open" }));
    expect(screen.getByText("true")).toBeTruthy();
    await act(async () => {
      fireEvent.mouseDown(document.body);
    });
    expect(screen.getByText("false")).toBeTruthy();
  });
});


// @vitest-environment jsdom
import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useDataSources } from "../../src/client/hooks/useDataSources.js";
import { useGeneration } from "../../src/client/hooks/useGeneration.js";
import { useMenus } from "../../src/client/hooks/useMenus.js";
import { usePreview } from "../../src/client/hooks/usePreview.js";
import { useSchedule } from "../../src/client/hooks/useSchedule.js";
import { useSettings } from "../../src/client/hooks/useSettings.js";
import { useSettingsTransfer } from "../../src/client/hooks/useSettingsTransfer.js";

const t = (key, fallback) => fallback || key;

afterEach(() => {
  vi.restoreAllMocks();
});

describe("ESM hooks", () => {
  it("exports every hook as an ESM function", () => {
    for (const hook of [useDataSources, useGeneration, useMenus, usePreview, useSchedule, useSettings, useSettingsTransfer]) {
      expect(typeof hook).toBe("function");
    }
  });

  it("loads settings and AI metadata", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({
          settings: {
            git: [{ location: "D:/repo", branch: "main", label: "repo" }],
            docs: [],
            aiEnabled: false,
            format: "markdown",
            range: { start: "2026-11-01", end: "2026-11-30" },
          },
          ai: { available: true, provider: "test", model: "mock", models: [{ id: "mock", name: "Mock" }] },
          defaults: { start: "2026-11-01", end: "2026-11-30" },
        }),
      })),
    );
    const { result } = renderHook(() => useSettings({ sessionId: "", t }));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.settings.git).toHaveLength(1);
    expect(result.current.settings.docs).toHaveLength(0);
    expect(result.current.exportFormat).toBe("markdown");
    expect(result.current.useAi).toBe(false);
    expect(result.current.aiInfo.models).toHaveLength(1);
    expect(result.current.range.start).toBe("2026-11-01");
  });

  it("updates and removes data sources", async () => {
    const setSettings = vi.fn();
    const { result } = renderHook(() =>
      useDataSources({
        settings: { git: [{ location: "D:/repo", branch: "main", label: "" }], docs: [] },
        setSettings,
        useAi: false,
        range: { start: "2026-11-01", end: "2026-11-30" },
        exportFormat: "xlsx",
        sessionId: "",
        ctx: {},
        t,
        errorMessageFromPayload: () => "error",
      }),
    );
    act(() => result.current.addGit());
    expect(setSettings).toHaveBeenCalled();
    await act(async () => result.current.removeGit(0));
    expect(setSettings).toHaveBeenCalledTimes(2);
  });

  it("keeps a data source when removal is cancelled", async () => {
    const setSettings = vi.fn();
    const { result } = renderHook(() =>
      useDataSources({
        settings: { git: [{ location: "D:/repo", branch: "main", label: "repo" }], docs: [] },
        setSettings,
        useAi: false,
        range: { start: "2026-11-01", end: "2026-11-30" },
        exportFormat: "xlsx",
        sessionId: "",
        ctx: {},
        t,
        errorMessageFromPayload: () => "error",
        confirm: async () => false,
      }),
    );
    await act(async () => result.current.removeGit(0));
    expect(setSettings).not.toHaveBeenCalled();
  });

  it("tests and scans data sources", async () => {
    const setSettings = vi.fn();
    const ctx = { get: () => ({ pickDirectory: async () => "D:/repos" }) };
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url) => {
        if (String(url).includes("/test-sources")) {
          return { ok: true, json: async () => ({ sources: [{ label: "repo", status: "ok" }] }) };
        }
        return { ok: true, json: async () => ({ repos: [{ location: "D:/repo2", branch: "main", label: "repo2" }] }) };
      }),
    );
    const { result } = renderHook(() =>
      useDataSources({
        settings: { git: [{ location: "D:/repo", branch: "main", label: "" }], docs: [] },
        setSettings,
        useAi: false,
        range: { start: "2026-11-01", end: "2026-11-30" },
        exportFormat: "xlsx",
        sessionId: "",
        ctx,
        t,
        errorMessageFromPayload: () => "error",
      }),
    );
    await act(async () => result.current.testSources());
    expect(result.current.testResults).toHaveLength(1);
    act(() => result.current.toggleScan());
    expect(result.current.showScan).toBe(true);
    await act(async () => result.current.pickScanDirectory());
    expect(result.current.scanDir).toBe("D:/repos");
    await act(async () => result.current.scanAndAdd());
    expect(setSettings).toHaveBeenCalled();
  });

  it("reports data-source request failures", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: false, json: async () => ({ error: { code: "x", message: "failed" } }) })),
    );
    const ctx = { get: () => ({ pickDirectory: async () => "" }) };
    const { result } = renderHook(() =>
      useDataSources({
        settings: { git: [{ location: "D:/repo", branch: "main", label: "" }], docs: [] },
        setSettings: vi.fn(),
        useAi: false,
        range: { start: "2026-11-01", end: "2026-11-30" },
        exportFormat: "xlsx",
        sessionId: "",
        ctx,
        t,
        errorMessageFromPayload: () => "error",
      }),
    );
    await act(async () => result.current.testSources());
    expect(result.current.testError).toBeTruthy();
    act(() => result.current.setScanDir("D:/repos"));
    await act(async () => result.current.scanAndAdd());
    expect(result.current.scanError).toBeTruthy();
  });

  it("exposes schedule status and run helpers", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({ state: { lastAt: "2026-11-01 10:00" }, history: [] }),
      })),
    );
    const { result } = renderHook(() =>
      useSchedule({ enabled: false, sessionId: "", t, errorMessageFromPayload: () => "error" }),
    );
    await waitFor(() => expect(result.current.scheduleStatus?.state?.lastAt).toBe("2026-11-01 10:00"));
    expect(typeof result.current.runScheduleNow).toBe("function");
  });
});




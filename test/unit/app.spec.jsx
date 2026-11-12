// @vitest-environment jsdom
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { DailyReportView } from "../../src/client/app.jsx";
import { apply } from "../../src/client/app.jsx";

const dictionaries = {
  zh: {},
  en: {},
};

const ctx = {
  locale: {
    subscribe: () => () => {},
    bind: () => (key) => key,
    register: () => () => {},
    getLocale: () => ({ id: "zh" }),
  },
  effect: (callback) => {
    const dispose = callback();
    return typeof dispose === "function" ? dispose : () => {};
  },
  get: () => null,
};

describe("ESM app shell", () => {
  it("loads state and renders the page", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url) => {
        if (String(url).includes("/state")) {
          return {
            ok: true,
            json: async () => ({
              settings: {
                git: [{ location: "D:/repo", branch: "main", label: "repo" }],
                docs: [],
                scheduleEnabled: false,
                format: "xlsx",
              },
              ai: { available: true, provider: "test", model: "mock", models: [] },
              defaults: { start: "2026-11-01", end: "2026-11-30" },
            }),
          };
        }
        if (String(url).includes("/schedule/status")) {
          return { ok: true, json: async () => ({ state: {}, history: [] }) };
        }
        return { ok: true, json: async () => dictionaries };
      }),
    );
    render(<DailyReportView ctx={ctx} sessionId="" />);
    await waitFor(() => expect(screen.getByRole("heading", { name: "日报汇总" })).toBeTruthy());
    expect(screen.getAllByText("Git 仓库").length).toBeGreaterThan(0);
  });

  it("registers slots and locale resources", async () => {
    const registrations = [];
    const localeRegistrations = [];
    const effects = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: true, json: async () => ({ zh: { "page.title": "日报汇总" }, en: {} }) })),
    );
    const pluginCtx = {
      locale: {
        register: (ns, dicts) => {
          localeRegistrations.push({ ns, dicts });
          return () => {};
        },
        bind: () => (key) => key,
        subscribe: () => () => {},
        getLocale: () => ({ id: "zh" }),
      },
      slots: {
        inject: (name, callback) => callback(),
        register: (options) => {
          registrations.push(options);
          return () => {};
        },
      },
      effect: (callback) => {
        const dispose = callback();
        effects.push(dispose);
        return typeof dispose === "function" ? dispose : () => {};
      },
    };
    apply(pluginCtx);
    await waitFor(() => expect(localeRegistrations.length).toBe(1));
    expect(registrations).toHaveLength(2);
    expect(registrations[0].name).toBe("main");
    expect(registrations[1].name).toBe("sidebar.panellist");
    for (const dispose of effects) {
      if (typeof dispose === "function") dispose();
    }
  });
});



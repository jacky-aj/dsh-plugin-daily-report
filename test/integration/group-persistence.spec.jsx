// @vitest-environment jsdom
import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { DailyReportView } from "../../src/client/app.jsx";
import { sanitizeSettings } from "../../lib/collect.js";

const dictionaries = { zh: { "page.title": "日报汇总" }, en: {} };

function makeContext() {
  return {
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
}

/** A tiny stand-in for the Host: sanitize on write, hand back on read. */
function makeHost(initial) {
  const host = { stored: sanitizeSettings(initial), writes: 0 };
  globalThis.fetch = vi.fn(async (url, init = {}) => {
    const target = String(url);
    if (target.includes("/state")) {
      if ((init.method || "GET").toUpperCase() === "PUT") {
        const body = JSON.parse(init.body || "{}");
        host.stored = sanitizeSettings(body.settings || body);
        host.writes += 1;
        return { ok: true, json: async () => ({ ok: true, settings: host.stored }) };
      }
      return {
        ok: true,
        json: async () => ({
          settings: host.stored,
          ai: { available: true, provider: "test", model: "mock", models: [] },
          defaults: { start: "2026-11-01", end: "2026-11-30" },
        }),
      };
    }
    if (target.includes("/locales")) return { ok: true, json: async () => dictionaries };
    if (target.includes("/scan")) {
      return {
        ok: true,
        json: async () => ({
          repos: [{ location: "D:/scanned", branch: "main", label: "scanned" }],
          warnings: [],
        }),
      };
    }
    if (target.includes("/schedule/status")) {
      return { ok: true, json: async () => ({ enabled: false, state: {}, history: [] }) };
    }
    return { ok: true, json: async () => ({}) };
  });
  return host;
}

function mount() {
  return render(<DailyReportView ctx={makeContext()} sessionId="" />);
}

async function ready() {
  await waitFor(() => expect(screen.getByRole("heading", { name: "日报汇总" })).toBeTruthy());
}

function groupSelect() {
  return screen.getByLabelText("当前分组");
}

function gitCount() {
  // The tab label carries the number of repositories in the active group.
  const tab = screen.getAllByRole("tab")[0];
  return Array.from(tab.querySelectorAll(".dsdr-tab-count"))[0].textContent;
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("group contents survive switching and reloading", () => {
  it("keeps repositories when a new group is created, edited and switched", async () => {
    const host = makeHost({
      git: [{ location: "D:/repo-a" }, { location: "D:/repo-b" }],
      docs: [],
    });
    mount();
    await ready();
    expect(gitCount()).toBe("2");
    expect(groupSelect().value).toBe("default");

    // Create a second group.
    fireEvent.change(groupSelect(), { target: { value: "__new__" } });
    fireEvent.change(screen.getByLabelText("新建分组"), { target: { value: "项目二" } });
    fireEvent.click(screen.getByRole("button", { name: "创建" }));
    await waitFor(() => expect(groupSelect().value).not.toBe("default"));
    expect(gitCount()).toBe("0");

    // Add a repository to the new group.
    fireEvent.click(screen.getByRole("button", { name: "+ 添加仓库" }));
    const inputs = screen.getAllByPlaceholderText(/repo\.git/);
    fireEvent.change(inputs[inputs.length - 1], { target: { value: "D:/repo-c" } });
    expect(gitCount()).toBe("1");

    // Switch away and back: the new group keeps its repository.
    fireEvent.change(groupSelect(), { target: { value: "default" } });
    await waitFor(() => expect(gitCount()).toBe("2"));
    const second = Array.from(groupSelect().options).find((option) => option.textContent === "项目二");
    fireEvent.change(groupSelect(), { target: { value: second.value } });
    await waitFor(() => expect(gitCount()).toBe("1"));

    // Repositories added through directory scanning must land in the active
    // group too — this is what used to disappear on the next switch.
    fireEvent.click(screen.getByRole("button", { name: /扫描目录/ }));
    fireEvent.change(screen.getByPlaceholderText(/要扫描的目录/), { target: { value: "D:/repos" } });
    fireEvent.click(screen.getByRole("button", { name: /扫描并添加/ }));
    await waitFor(() => expect(gitCount()).toBe("2"));
    fireEvent.change(groupSelect(), { target: { value: "default" } });
    await waitFor(() => expect(gitCount()).toBe("2"));
    const scannedGroup = Array.from(groupSelect().options).find((option) => option.textContent === "项目二");
    fireEvent.change(groupSelect(), { target: { value: scannedGroup.value } });
    await waitFor(() => expect(gitCount()).toBe("2"));

    // And the first group still has both of its own.
    fireEvent.change(groupSelect(), { target: { value: "default" } });
    await waitFor(() => expect(gitCount()).toBe("2"));

    // Rapid switching must not drop anything either: each switch is a render,
    // and the debounced save must land on the final state.
    const secondId = second.value;
    for (let round = 0; round < 4; round += 1) {
      fireEvent.change(groupSelect(), { target: { value: secondId } });
      fireEvent.change(groupSelect(), { target: { value: "default" } });
    }

    // Wait for the debounced save, then simulate a page reload.
    await waitFor(() => expect(host.stored.groups.length).toBe(2), { timeout: 4000 });
    const savedSecond = host.stored.groups.find((group) => group.name === "项目二");
    expect(savedSecond.git.map((item) => item.location)).toEqual(["D:/repo-c", "D:/scanned"]);
    expect(host.stored.groups[0].git).toHaveLength(2);

    cleanup();
    mount();
    await waitFor(() => expect(screen.getByRole("heading", { name: "日报汇总" })).toBeTruthy());
    expect(Array.from(groupSelect().options).map((option) => option.textContent)).toEqual([
      "默认分组",
      "项目二",
      "+ 新建分组…",
      "重命名分组…",
      "删除分组…",
    ]);
    // The reloaded active group is the one that was active when saved.
    fireEvent.change(groupSelect(), { target: { value: "default" } });
    await waitFor(() => expect(gitCount()).toBe("2"));
  });
});



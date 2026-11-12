// @vitest-environment jsdom
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { installStyles } from "../../src/client/styles.js";

describe("client entry and styles", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    document.head.innerHTML = "";
  });

  it("installs and removes the plugin style", () => {
    const disposers = [];
    const ctx = {
      effect(callback) {
        const dispose = callback();
        disposers.push(dispose);
      },
    };
    installStyles(ctx);
    const style = document.head.querySelector("style[data-plugin='dsh-plugin-daily-report']");
    expect(style).toBeTruthy();
    expect(disposers).toHaveLength(1);
    disposers[0]();
    expect(document.head.querySelector("style[data-plugin='dsh-plugin-daily-report']")).toBeNull();
  });

  it("exports the client apply function", async () => {
    vi.resetModules();
    const client = await import("../../src/client/index.jsx");
    expect(typeof client.apply).toBe("function");
  });
});


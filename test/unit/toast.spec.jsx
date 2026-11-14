// @vitest-environment jsdom
import React from "react";
import { act, cleanup, fireEvent, render, renderHook, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Toast } from "../../src/client/components/Toast.jsx";
import { useToast } from "../../src/client/hooks/useToast.js";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

function Harness({ message, tone }) {
  const { toast, showToast, dismissToast } = useToast();
  return (
    <div>
      <button type="button" onClick={() => showToast(message, tone)}>
        show
      </button>
      <Toast toast={toast} onDismiss={dismissToast} />
    </div>
  );
}

describe("toast", () => {
  it("renders nothing without a message", () => {
    const { container } = render(<Toast toast={null} />);
    expect(container.firstChild).toBeNull();
    const { container: second } = render(<Toast toast={{ message: "" }} />);
    expect(second.firstChild).toBeNull();
  });

  it("shows a success toast and auto hides", () => {
    vi.useFakeTimers();
    render(<Harness message="已导出：demo.xlsx" />);
    expect(screen.queryByRole("status")).toBeNull();
    act(() => {
      fireEvent.click(screen.getByRole("button", { name: "show" }));
    });
    expect(screen.getByRole("status")).toBeTruthy();
    expect(screen.getByText("已导出：demo.xlsx")).toBeTruthy();
    act(() => {
      vi.advanceTimersByTime(3300);
    });
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("renders an error tone and can be dismissed", () => {
    render(<Harness message="导出失败" tone="error" />);
    act(() => {
      fireEvent.click(screen.getByRole("button", { name: "show" }));
    });
    expect(screen.getByText("导出失败")).toBeTruthy();
    act(() => {
      fireEvent.click(screen.getByRole("button", { name: "关闭" }));
    });
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("ignores empty messages and resets the timer", () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useToast());
    act(() => result.current.showToast(""));
    expect(result.current.toast).toBeNull();
    act(() => result.current.showToast("第一条"));
    act(() => result.current.showToast("第二条"));
    expect(result.current.toast.message).toBe("第二条");
    act(() => vi.advanceTimersByTime(3300));
    expect(result.current.toast).toBeNull();
  });
});

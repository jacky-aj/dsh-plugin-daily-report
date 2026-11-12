// @vitest-environment jsdom
import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { ConfirmDialog } from "../../src/client/components/ConfirmDialog.jsx";
import { useConfirm } from "../../src/client/hooks/useConfirm.js";

afterEach(cleanup);

function Harness() {
  const { confirm, dialogProps } = useConfirm();
  const [result, setResult] = React.useState("");
  return (
    <div>
      <button type="button" onClick={() => confirm({ title: "Delete?", message: "Are you sure?" }).then((value) => setResult(String(value)))}>
        ask
      </button>
      <span>{result}</span>
      <ConfirmDialog {...dialogProps} />
    </div>
  );
}

describe("confirmation dialog", () => {
  it("resolves true on confirm and false on cancel", async () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole("button", { name: "ask" }));
    expect(screen.getByRole("dialog")).toBeTruthy();
    expect(screen.getByText("Delete?")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "确认" }));
    await waitFor(() => expect(screen.getByText("true")).toBeTruthy());

    fireEvent.click(screen.getByRole("button", { name: "ask" }));
    fireEvent.click(screen.getByRole("button", { name: "取消" }));
    await waitFor(() => expect(screen.getByText("false")).toBeTruthy());
  });
});

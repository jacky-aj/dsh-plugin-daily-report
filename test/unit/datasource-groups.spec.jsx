// @vitest-environment jsdom
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AppContext } from "../../src/client/context.jsx";
import { DataSourceCard } from "../../src/client/views/DataSourceCard.jsx";

const t = (key, fallback) => fallback || key;

afterEach(cleanup);

const GROUPS = [
  { id: "a", name: "项目 A", git: [{ _key: "g1", location: "D:/a" }], docs: [] },
  { id: "b", name: "项目 B", git: [], docs: [{ _key: "d1", location: "D:/notes" }] },
];

function app(overrides = {}) {
  return {
    settings: {
      git: [{ _key: "g1", location: "D:/a", branch: "main", label: "A" }],
      docs: [],
    },
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
    groups: GROUPS,
    activeGroup: GROUPS[0],
    groupEditing: "",
    groupDraft: "",
    setGroupDraft: vi.fn(),
    chooseGroup: vi.fn(),
    submitGroup: vi.fn(),
    cancelGroupEdit: vi.fn(),
    removeGroup: vi.fn(async () => true),
    confirm: async () => true,
    t,
    ...overrides,
  };
}

function renderCard(overrides) {
  const value = app(overrides);
  render(
    <AppContext.Provider value={value}>
      <DataSourceCard />
    </AppContext.Provider>,
  );
  return value;
}

describe("data source groups UI", () => {
  it("keeps the picker in the card header, next to the test button", () => {
    renderCard();
    const select = screen.getByLabelText("当前分组");
    const test = screen.getByRole("button", { name: /测试数据源/ });
    expect(select).toBeTruthy();
    // Both live in the same header action row.
    expect(select.closest(".dsdr-card-head")).toBe(test.closest(".dsdr-card-head"));
  });

  it("lists groups by name plus the actions, with no counts", () => {
    renderCard();
    expect(screen.getByRole("option", { name: "项目 A" }).textContent).toBe("项目 A");
    expect(screen.getByRole("option", { name: "项目 B" })).toBeTruthy();
    expect(screen.getByRole("option", { name: "+ 新建分组…" })).toBeTruthy();
    expect(screen.getByRole("option", { name: "重命名分组…" })).toBeTruthy();
    expect(screen.getByRole("option", { name: "删除分组…" })).toBeTruthy();
  });

  it("hides the delete action when only one group exists", () => {
    renderCard({ groups: [GROUPS[0]], activeGroup: GROUPS[0] });
    expect(screen.queryByRole("option", { name: "删除分组…" })).toBeNull();
  });

  it("passes every selection to the hook", () => {
    const chooseGroup = vi.fn();
    renderCard({ chooseGroup });
    const select = screen.getByLabelText("当前分组");
    for (const value of ["b", "__new__", "__rename__", "__remove__"]) {
      fireEvent.change(select, { target: { value } });
    }
    expect(chooseGroup.mock.calls.map(([value]) => value)).toEqual(["b", "__new__", "__rename__", "__remove__"]);
  });

  it("renders the naming form while creating a group", () => {
    const setGroupDraft = vi.fn();
    const submitGroup = vi.fn();
    renderCard({ groupEditing: "create", groupDraft: "", setGroupDraft, submitGroup });
    const input = screen.getByLabelText("新建分组");
    fireEvent.change(input, { target: { value: "新分组" } });
    expect(setGroupDraft).toHaveBeenCalledWith("新分组");
    fireEvent.click(screen.getByRole("button", { name: "创建" }));
    expect(submitGroup).toHaveBeenCalled();
  });

  it("renders the rename form with the current name", () => {
    const cancelGroupEdit = vi.fn();
    renderCard({ groupEditing: "rename", groupDraft: "项目 A", cancelGroupEdit });
    const input = screen.getByLabelText("重命名分组");
    expect(input.value).toBe("项目 A");
    fireEvent.click(screen.getByRole("button", { name: "保存" }));
    fireEvent.click(screen.getByRole("button", { name: "取消" }));
    expect(cancelGroupEdit).toHaveBeenCalled();
  });
});

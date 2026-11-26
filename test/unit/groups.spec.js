import { describe, expect, it } from "vitest";

import {
  DEFAULT_GROUP_ID,
  activeGroupOf,
  cleanSettings,
  groupsOf,
  normalizeClientSettings,
  withActiveSources,
  withGroups,
} from "../../src/client/helpers.js";

function legacy() {
  return normalizeClientSettings({
    git: [{ location: "D:/repo", branch: "main", label: "repo" }],
    docs: [{ location: "D:/notes", label: "notes" }],
  });
}

describe("data source groups", () => {
  it("turns a legacy flat configuration into one default group", () => {
    const settings = legacy();
    expect(settings.groups).toHaveLength(1);
    expect(settings.activeGroupId).toBe(DEFAULT_GROUP_ID);
    expect(settings.groups[0].git).toHaveLength(1);
    expect(settings.groups[0].docs).toHaveLength(1);
    // The top-level arrays stay pointed at the active group.
    expect(settings.git).toHaveLength(1);
    expect(settings.docs).toHaveLength(1);
  });

  it("keeps an existing group list and active selection", () => {
    const settings = normalizeClientSettings({
      groups: [
        { id: "a", name: "项目 A", git: [{ location: "D:/a", branch: "main" }], docs: [] },
        { id: "b", name: "项目 B", git: [], docs: ["D:/b-notes"] },
      ],
      activeGroupId: "b",
    });
    expect(settings.groups).toHaveLength(2);
    expect(settings.activeGroupId).toBe("b");
    expect(settings.git).toHaveLength(0);
    expect(settings.docs).toHaveLength(1);
  });

  it("falls back to the first group when the active id is unknown", () => {
    const settings = normalizeClientSettings({
      groups: [{ id: "a", name: "A", git: [{ location: "D:/a" }], docs: [] }],
      activeGroupId: "gone",
    });
    expect(settings.activeGroupId).toBe("a");
    expect(settings.git).toHaveLength(1);
  });

  it("switches groups without losing the other group's sources", () => {
    const base = legacy();
    const two = withGroups(
      base,
      [
        ...base.groups,
        { id: "g2", name: "项目 B", git: [{ _key: "k2", location: "D:/b", branch: "", label: "" }], docs: [] },
      ],
      "g2",
    );
    expect(two.git.map((item) => item.location)).toEqual(["D:/b"]);
    const back = withGroups(two, two.groups, DEFAULT_GROUP_ID);
    expect(back.git.map((item) => item.location)).toEqual(["D:/repo"]);
    expect(back.docs.map((item) => item.location)).toEqual(["D:/notes"]);
    expect(groupsOf(back)).toHaveLength(2);
    expect(activeGroupOf(back).name).toBe("默认分组");
  });

  it("writes sources into the active group only", () => {
    const base = legacy();
    const two = withGroups(
      base,
      [...base.groups, { id: "g2", name: "B", git: [], docs: [] }],
      "g2",
    );
    const updated = withActiveSources(two, { git: [{ _key: "n", location: "D:/new", branch: "", label: "" }] });
    const byId = Object.fromEntries(updated.groups.map((group) => [group.id, group]));
    expect(byId.g2.git).toHaveLength(1);
    expect(byId[DEFAULT_GROUP_ID].git).toHaveLength(1);
    expect(updated.git.map((item) => item.location)).toEqual(["D:/new"]);
  });

  it("saves every group with the active one mirrored to the top level", () => {
    const base = legacy();
    const two = withGroups(
      base,
      [
        ...base.groups,
        { id: "g2", name: "B", git: [{ _key: "k", location: " D:/b ", branch: "", label: "" }], docs: [] },
      ],
      "g2",
    );
    const cleaned = cleanSettings(two, true, { start: "2026-11-01", end: "2026-11-30" }, "xlsx");
    expect(cleaned.activeGroupId).toBe("g2");
    expect(cleaned.git).toEqual([{ location: "D:/b", branch: "", label: "" }]);
    expect(cleaned.groups).toHaveLength(2);
    expect(cleaned.groups[1].git[0].location).toBe("D:/b");
  });

  it("keeps an empty group so a new group survives a reload", () => {
    const base = withGroups(
      legacy(),
      [...legacy().groups, { id: "fresh", name: "新建分组", git: [], docs: [] }],
      "fresh",
    );
    const cleaned = cleanSettings(base, true, { start: "2026-11-01", end: "2026-11-30" }, "xlsx");
    expect(cleaned.groups).toHaveLength(2);
    expect(cleaned.groups[1].name).toBe("新建分组");
    expect(cleaned.activeGroupId).toBe("fresh");
  });
});


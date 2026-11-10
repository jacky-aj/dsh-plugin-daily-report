import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const code = readFileSync(new URL("../client.js", import.meta.url), "utf8");
let captured = null;
globalThis.window = {
  __ModuleLoader__: {
    load(definition) {
      captured = definition;
    },
  },
};
globalThis.document = {
  createElement() {
    return { dataset: {}, textContent: "", remove() {} };
  },
  head: { appendChild() {} },
};
new Function("window", code)(globalThis.window);

const registrations = [];
const dictionaries = {};
let stateIndex = 0;
const ReactMock = {
  createElement(type, props, ...children) {
    if (typeof type === "function") {
      return type({ ...(props || {}), children: children.length <= 1 ? children[0] : children });
    }
    return { type, props: props || {}, children };
  },
  useState(initial) {
    stateIndex += 1;
    if (stateIndex === 5) return [{ available: true, provider: "test", model: "mock-model" }, () => {}];
    if (stateIndex === 7) return [false, () => {}];
    if (stateIndex === 11) return [true, () => {}];
    if (stateIndex === 12) return [{ percent: 78, indeterminate: true, message: "模型正在生成分析…" }, () => {}];
    if (stateIndex === 13) {
      return [
        {
          filename: "demo.xlsx",
          url: "blob:demo",
          stats: { commits: 2, docs: 1, activeDays: 2, sources: 1 },
          sources: [{ kind: "git", label: "demo", branch: "main", status: "ok", count: 2, message: "ok" }],
          warnings: [],
          ai: { ok: true, provider: "test", model: "mock-model", overall: "AI summary", cachedDays: 1 },
        },
        () => {},
      ];
    }
    if (stateIndex === 19) {
      return [
        {
          range: { start: "2026-11-01", end: "2026-11-30" },
          ai: { ok: true, overall: "AI summary" },
          days: [
            {
              date: "2026-11-02",
              weekday: "星期一",
              dayType: "工作日",
              commitCount: 2,
              docCount: 1,
              summary: "raw summary",
              aiSummary: "AI summary",
              aiHighlights: ["highlight"],
              manualItems: ["manual item"],
            },
          ],
        },
        () => {},
      ];
    }
    if (stateIndex === 25) return [{ "2026-11-02": true }, () => {}];
    return [typeof initial === "function" ? initial() : initial, () => {}];
  },
  useEffect() {},
  useRef(initial) {
    return { current: initial };
  },
};
const ctx = {
  locale: {
    register(namespace, dicts) {
      dictionaries[namespace] = dicts;
      return () => {};
    },
    bind(namespace) {
      return (key) => (dictionaries[namespace] && dictionaries[namespace].zh[key]) || key;
    },
    subscribe() {
      return () => {};
    },
    getLocale() {
      return { id: "zh" };
    },
  },
  effect(callback) {
    const dispose = callback();
    return typeof dispose === "function" ? dispose : () => {};
  },
  slots: {
    inject(name, callback) {
      const dispose = callback();
      return typeof dispose === "function" ? dispose : () => {};
    },
    register(options, component) {
      registrations.push({ options, component });
      return () => {};
    },
  },
};

const plugin = captured.factory(() => ReactMock);
plugin.apply(ctx);
assert.equal(registrations.length, 2);

stateIndex = 0;
const tree = registrations[0].component({});
assert.equal(tree.type, "div");
assert.equal(tree.props.className, "dsdr-root");
function hasClass(node, className) {
  if (!node || typeof node !== "object") return false;
  const props = node.props || {};
  if (typeof props.className === "string" && props.className.split(/\s+/).includes(className)) return true;
  const children = Array.isArray(node.children) ? node.children : [];
  return children.some((child) => hasClass(child, className));
}
assert.equal(hasClass(tree, "dsdr-progress-card"), true);
assert.equal(hasClass(tree, "dsdr-ai-result"), true);
assert.equal(hasClass(tree, "dsdr-save-btn"), true);
assert.equal(hasClass(tree, "dsdr-preview-card"), true);
assert.ok(JSON.stringify(tree).includes("dsdr-preview-toggle"));
const icon = registrations[1].component({ size: 20, active: true });
assert.equal(icon.type, "svg");
assert.equal(icon.props.width, 20);
assert.ok(dictionaries["daily-report"].zh["cwd.title"]);

console.log(JSON.stringify({ ok: true, root: tree.props.className, title: dictionaries["daily-report"].zh["page.title"] }));





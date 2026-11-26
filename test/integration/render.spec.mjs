import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "vitest";

test("render integration", async () => {

const pageZh = JSON.parse(readFileSync(new URL("../../client-locale/page.zh.json", import.meta.url), "utf8"));
const pageEn = JSON.parse(readFileSync(new URL("../../client-locale/page.en.json", import.meta.url), "utf8"));
const fetchCalls = [];
globalThis.fetch = async (url) => {
  fetchCalls.push(String(url));
  if (String(url).includes("/generate/start")) {
    return { ok: true, json: async () => ({ jobId: "job-1" }) };
  }
  if (String(url).includes("/job?")) {
    return { ok: true, json: async () => ({ status: "done", progress: { percent: 100 } }) };
  }
  if (String(url).includes("/job/preview")) {
    return {
      ok: true,
      json: async () => ({
        range: { start: "2026-11-01", end: "2026-11-30" },
        days: [],
        ai: null,
      }),
    };
  }
  if (String(url).includes("/job/export")) {
    return {
      ok: true,
      headers: { get: () => null },
      blob: async () => new Blob(["report"]),
    };
  }
  if (String(url).includes("/job/regenerate-day")) {
    return {
      ok: true,
      json: async () => ({ ok: true, day: { summary: "new", highlights: [], categories: [] } }),
    };
  }
  if (String(url).includes("/job/cancel")) {
    return { ok: true, json: async () => ({ ok: true }) };
  }
  if (String(url).includes("/test-sources")) {
    return { ok: true, json: async () => ({ sources: [] }) };
  }
  if (String(url).includes("/schedule/run")) {
    return { ok: true, json: async () => ({ ok: true, status: { state: {}, history: [] } }) };
  }
  if (String(url).includes("/scan")) {
    return { ok: true, json: async () => ({ repos: [] }) };
  }
  if (String(url).includes("/state")) {
    return { ok: true, json: async () => ({ ok: true }) };
  }
  return { ok: true, json: async () => ({ zh: pageZh, en: pageEn }) };
};

const code = readFileSync(new URL("../../client.js", import.meta.url), "utf8");
let captured = null;
globalThis.window = {
  __ModuleLoader__: {
    load(definition) {
      captured = definition;
    },
  },
  URL: {
    createObjectURL: () => "blob:test",
    revokeObjectURL: () => {},
  },
};
globalThis.document = {
  createElement() {
    return { dataset: {}, textContent: "", remove() {}, click() {} };
  },
  head: { appendChild() {} },
  body: { appendChild() {}, removeChild() {} },
};
new Function("window", code)(globalThis.window);

const registrations = [];
const dictionaries = {};
// Hook order is not stable across releases, so state is seeded by the *shape*
// of each initial value instead of by position. A dry render records the
// initial values, the plan below maps the few states this test needs, and the
// real render replays it.
let traceMode = true;
const trace = [];
const seeds = new Map();
let stateIndex = 0;
let contextValue = null;
function resolveInitial(initial) {
  return typeof initial === "function" ? initial() : initial;
}
const SEEDED_SETTINGS = {
  git: [{ _key: "g1", location: "D:/demo", branch: "main", label: "demo" }],
  docs: [],
  // The schedule card folds its details while disabled, and this test clicks
  // the run button — keep the schedule enabled so the details are present.
  scheduleEnabled: true,
};
const SEEDED_AI = { available: true, provider: "test", model: "mock-model", models: [] };
const SEEDED_RESULT = {
  filename: "demo.xlsx",
  url: "blob:demo",
  stats: { commits: 2, docs: 1, activeDays: 2, sources: 1 },
  sources: [{ kind: "git", label: "demo", branch: "main", status: "ok", count: 2, message: "ok" }],
  warnings: [],
  ai: { ok: true, provider: "test", model: "mock-model", overall: "AI summary", cachedDays: 1 },
};
const SEEDED_PREVIEW = {
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
};
const SEEDED_PROGRESS = { percent: 78, indeterminate: true, message: "模型正在生成分析…" };

function planSeeds() {
  const isSettings = (value) => value && typeof value === "object" && Array.isArray(value.git);
  const isAiInfo = (value) => value && typeof value === "object" && "available" in value && !("git" in value);
  const trues = [];
  const nulls = [];
  trace.forEach((value, index) => {
    if (value === true) trues.push(index);
    if (value === null) nulls.push(index);
  });
  const settingsAt = trace.findIndex(isSettings);
  const aiAt = trace.findIndex(isAiInfo);
  if (settingsAt < 0 || aiAt < 0) throw new Error("render.spec: settings/aiInfo state not found");
  if (trues.length < 2) throw new Error("render.spec: expected useAi and loading booleans");
  if (nulls.length < 7) throw new Error("render.spec: expected at least 7 null-initial states, got " + nulls.length);
  seeds.set(settingsAt, SEEDED_SETTINGS);
  seeds.set(aiAt, SEEDED_AI);
  seeds.set(trues[1], false); // loading
  seeds.set(nulls[2], SEEDED_RESULT);
  seeds.set(nulls[5], SEEDED_PREVIEW);
  seeds.set(nulls[6], SEEDED_PROGRESS);
  // The progress card is gated on `generating`, which is the boolean declared
  // immediately before the progress state.
  const generatingAt = nulls[6] - 1;
  if (trace[generatingAt] === false) seeds.set(generatingAt, true);
  // The preview job id is declared immediately after the preview state; export
  // and single-day regeneration both require it.
  const jobIdAt = nulls[5] + 1;
  if (trace[jobIdAt] === "") seeds.set(jobIdAt, "job-1");
}

const ReactMock = {
  createElement(type, props, ...children) {
    if (typeof type === "function") {
      return type({ ...(props || {}), children: children.length <= 1 ? children[0] : children });
    }
    return { type, props: props || {}, children };
  },
  createContext() {
    return {
      Provider(props) {
        contextValue = props.value;
        return props.children;
      },
    };
  },
  useContext() {
    return contextValue;
  },
  useId() {
    return "dsdr-confirm-title";
  },
  useCallback(fn) {
    return fn;
  },
  useState(initial) {
    const index = stateIndex;
    stateIndex += 1;
    if (traceMode) {
      trace.push(initial);
      return [resolveInitial(initial), () => {}];
    }
    const value = seeds.has(index) ? seeds.get(index) : resolveInitial(initial);
    return [value, () => {}];
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
await new Promise((resolve) => setTimeout(resolve, 0));
assert.equal(registrations.length, 2);

// Pass 1 records the hook order without seeding anything; pass 2 renders with
// the shapes this test wants.
stateIndex = 0;
traceMode = true;
registrations[0].component({});
planSeeds();
stateIndex = 0;
traceMode = false;
contextValue = null; // the page renders before the Provider runs; drop the dry pass value
const tree = registrations[0].component({});
const root = Array.isArray(tree) ? tree[0] : tree;
assert.equal(root.type, "div");
assert.equal(root.props.className, "dsdr-root");
function hasClass(node, className) {
  if (!node || typeof node !== "object") return false;
  const props = node.props || {};
  if (typeof props.className === "string" && props.className.split(/\s+/).includes(className)) return true;
  const children = Array.isArray(node.children) ? node.children : [];
  return children.some((child) => hasClass(child, className));
}
assert.equal(hasClass(root, "dsdr-progress-card"), true);
assert.equal(hasClass(root, "dsdr-ai-result"), true);
assert.equal(hasClass(root, "dsdr-save-btn"), true);
assert.equal(hasClass(root, "dsdr-preview-card"), true);
assert.ok(JSON.stringify(tree).includes("dsdr-preview-toggle"));
function findGenerateButton(node) {
  if (!node || typeof node !== "object") return null;
  if (Array.isArray(node)) {
    for (const child of node) {
      const found = findGenerateButton(child);
      if (found) return found;
    }
    return null;
  }
  if (node.type === "button" && typeof node.props.className === "string" && node.props.className.includes("dsdr-generate")) return node;
  for (const child of Array.isArray(node.children) ? node.children : []) {
    const found = findGenerateButton(child);
    if (found) return found;
  }
  return null;
}
const generateButton = findGenerateButton(tree);
assert.ok(generateButton && typeof generateButton.props.onClick === "function");
await generateButton.props.onClick();

function findButtonText(node, text) {
  if (!node || typeof node !== "object") return null;
  if (Array.isArray(node)) {
    for (const child of node) {
      const found = findButtonText(child, text);
      if (found) return found;
    }
    return null;
  }
  if (node.type === "button" && JSON.stringify(node.children).includes(text)) return node;
  for (const child of Array.isArray(node.children) ? node.children : []) {
    const found = findButtonText(child, text);
    if (found) return found;
  }
  return null;
}
async function clickButton(text) {
  const button = findButtonText(tree, text);
  assert.ok(button, "missing button: " + text);
  await button.props.onClick();
}

await clickButton("测试数据源");
await clickButton("立即运行一次");
await clickButton("导出");
await clickButton("重新分析这天");

function findFileInput(node) {
  if (!node || typeof node !== "object") return null;
  if (Array.isArray(node)) {
    for (const child of node) {
      const found = findFileInput(child);
      if (found) return found;
    }
    return null;
  }
  if (node.type === "input" && node.props && node.props.type === "file") return node;
  for (const child of Array.isArray(node.children) ? node.children : []) {
    const found = findFileInput(child);
    if (found) return found;
  }
  return null;
}
const fileInput = findFileInput(tree);
assert.ok(fileInput && typeof fileInput.props.onChange === "function");
await fileInput.props.onChange({
  target: {
    files: [],
    value: "",
  },
});

for (const route of ["/test-sources", "/schedule/run", "/job/export", "/job/regenerate-day"]) {
  assert.ok(fetchCalls.some((url) => url.includes(route)), "missing request: " + route);
}
const icon = registrations[1].component({ size: 20, active: true });
assert.equal(icon.type, "svg");
assert.equal(icon.props.width, 20);
assert.ok(dictionaries["daily-report"].zh["page.title"]);

console.log(JSON.stringify({ ok: true, root: root.props.className, title: dictionaries["daily-report"].zh["page.title"] }));






});

















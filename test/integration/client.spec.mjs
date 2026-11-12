import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "vitest";

test("client integration", async () => {

const pageZh = JSON.parse(readFileSync(new URL("../../locale/page.zh.json", import.meta.url), "utf8"));
const pageEn = JSON.parse(readFileSync(new URL("../../locale/page.en.json", import.meta.url), "utf8"));
globalThis.fetch = async () => ({ ok: true, json: async () => ({ zh: pageZh, en: pageEn }) });

const code = readFileSync(new URL("../../client.js", import.meta.url), "utf8");
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
assert.ok(captured);
assert.equal(captured.id, "dsh-plugin-daily-report");

const registrations = [];
const dictionaries = {};
const ReactMock = {
  createElement() {
    return { type: "mock" };
  },
  createContext() {
    return { Provider: () => null };
  },
  useContext() {
    return null;
  },
  useState(initial) {
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

const plugin = captured.factory((name) => {
  assert.equal(name, "react");
  return ReactMock;
});
assert.deepEqual(plugin.inject, ["slots", "locale"]);
plugin.apply(ctx);
await new Promise((resolve) => setTimeout(resolve, 0));

assert.equal(registrations.length, 2);
assert.deepEqual(
  registrations.map((item) => item.options.name),
  ["main", "sidebar.panellist"],
);
assert.equal(registrations[0].options.key, "daily-report");
assert.equal(registrations[1].options.id, "daily-report");
assert.equal(registrations[1].options.label(), "日报汇总");
assert.ok(dictionaries["daily-report"].zh["page.title"]);
assert.ok(dictionaries["daily-report"].en["page.title"]);

console.log(JSON.stringify({ ok: true, slots: registrations.map((item) => item.options.name) }));


});

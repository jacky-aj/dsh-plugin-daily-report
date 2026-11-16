window.__ModuleLoader__.load({
  id: "dsh-plugin-daily-report",
  factory(require) {
var __DSH_DAILY_REPORT__ = (() => {
  var __create = Object.create;
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getProtoOf = Object.getPrototypeOf;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
    get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
  }) : x)(function(x) {
    if (typeof require !== "undefined") return require.apply(this, arguments);
    throw Error('Dynamic require of "' + x + '" is not supported');
  });
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
    // If the importer is in node compatibility mode or this is not an ESM
    // file that has been converted to a CommonJS file using a Babel-
    // compatible transform (i.e. "__esModule" has not been set), then set
    // "default" to the CommonJS "module.exports" for node compatibility.
    isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
    mod
  ));
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // src/client/index.jsx
  var index_exports = {};
  __export(index_exports, {
    apply: () => apply
  });

  // src/client/app.jsx
  var import_react24 = __toESM(__require("react"), 1);

  // src/client/helpers.js
  var import_react = __toESM(__require("react"), 1);
  var NS = "daily-report";
  var API = "/daily-report";
  function useTranslate(ctx) {
    const [, force] = import_react.default.useState(0);
    import_react.default.useEffect(() => {
      return ctx.locale.subscribe(() => force((value) => value + 1));
    }, [ctx]);
    const bound = ctx.locale.bind(NS);
    return function translate(key, fallback) {
      const value = bound(key);
      if (value === key && typeof fallback === "string") return fallback;
      return value;
    };
  }
  function uid() {
    return "s" + Math.random().toString(36).slice(2, 9) + Date.now().toString(36);
  }
  function pad2(value) {
    return String(value).padStart(2, "0");
  }
  function formatDate(date) {
    return date.getFullYear() + "-" + pad2(date.getMonth() + 1) + "-" + pad2(date.getDate());
  }
  function currentMonthRange() {
    const now = /* @__PURE__ */ new Date();
    return {
      start: formatDate(new Date(now.getFullYear(), now.getMonth(), 1)),
      end: formatDate(new Date(now.getFullYear(), now.getMonth() + 1, 0))
    };
  }
  function lastMonthRange() {
    const now = /* @__PURE__ */ new Date();
    return {
      start: formatDate(new Date(now.getFullYear(), now.getMonth() - 1, 1)),
      end: formatDate(new Date(now.getFullYear(), now.getMonth(), 0))
    };
  }
  function last7Range() {
    const now = /* @__PURE__ */ new Date();
    const start = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - 6
    );
    return {
      start: formatDate(start),
      end: formatDate(now)
    };
  }
  function yesterdayRange() {
    const now = /* @__PURE__ */ new Date();
    const yesterday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - 1
    );
    return {
      start: formatDate(yesterday),
      end: formatDate(yesterday)
    };
  }
  function thisWeekRange() {
    const now = /* @__PURE__ */ new Date();
    const mondayOffset = (now.getDay() + 6) % 7;
    const monday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - mondayOffset
    );
    return {
      start: formatDate(monday),
      end: formatDate(now)
    };
  }
  function daysBetween(start, end) {
    if (!start || !end) return 0;
    const first = /* @__PURE__ */ new Date(start + "T00:00:00");
    const last = /* @__PURE__ */ new Date(end + "T00:00:00");
    if (Number.isNaN(first.getTime()) || Number.isNaN(last.getTime()))
      return 0;
    return Math.round((last.getTime() - first.getTime()) / 864e5) + 1;
  }
  function normalizeClientSettings(raw) {
    const source = raw && typeof raw === "object" ? raw : {};
    const git = Array.isArray(source.git) ? source.git.map((item) => ({
      _key: uid(),
      location: typeof item.location === "string" ? item.location : "",
      branch: typeof item.branch === "string" ? item.branch : "",
      label: typeof item.label === "string" ? item.label : ""
    })) : [];
    const docs = Array.isArray(source.docs) ? source.docs.map((item) => {
      const value = typeof item === "string" ? {
        location: item,
        label: ""
      } : item || {};
      return {
        _key: uid(),
        location: typeof value.location === "string" ? value.location : "",
        label: typeof value.label === "string" ? value.label : ""
      };
    }) : [];
    return {
      git,
      docs,
      mineOnly: source.mineOnly !== false,
      excludeMerges: source.excludeMerges !== false,
      authorEmails: typeof source.authorEmails === "string" ? source.authorEmails : "",
      aiTemplate: ["concise", "detailed", "manager"].includes(
        source.aiTemplate
      ) ? source.aiTemplate : "concise",
      aiProvider: typeof source.aiProvider === "string" ? source.aiProvider : "",
      aiModel: typeof source.aiModel === "string" ? source.aiModel : "",
      scheduleEnabled: source.scheduleEnabled === true,
      scheduleFrequency: source.scheduleFrequency === "weekly" ? "weekly" : "daily",
      scheduleTime: typeof source.scheduleTime === "string" ? source.scheduleTime : "18:30"
    };
  }
  function cleanSettings(settings, aiEnabled, range, format) {
    return {
      git: settings.git.map((item) => ({
        location: item.location.trim(),
        branch: item.branch.trim(),
        label: item.label.trim()
      })).filter((item) => item.location.length > 0),
      docs: settings.docs.map((item) => ({
        location: item.location.trim(),
        label: item.label.trim()
      })).filter((item) => item.location.length > 0),
      aiEnabled: aiEnabled !== false,
      mineOnly: settings.mineOnly !== false,
      excludeMerges: settings.excludeMerges !== false,
      authorEmails: (settings.authorEmails || "").trim(),
      aiTemplate: ["concise", "detailed", "manager"].includes(
        settings.aiTemplate
      ) ? settings.aiTemplate : "concise",
      aiProvider: (settings.aiProvider || "").trim(),
      aiModel: (settings.aiModel || "").trim(),
      scheduleEnabled: settings.scheduleEnabled === true,
      scheduleFrequency: settings.scheduleFrequency === "weekly" ? "weekly" : "daily",
      scheduleTime: /^\d{2}:\d{2}$/.test(settings.scheduleTime) ? settings.scheduleTime : "18:30",
      format: FORMAT_OPTIONS.includes(format) ? format : "xlsx",
      range: range && typeof range.start === "string" && typeof range.end === "string" ? {
        start: range.start,
        end: range.end
      } : null
    };
  }
  function decodeBase64Json(value) {
    const binary = window.atob(value);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1)
      bytes[i] = binary.charCodeAt(i);
    return JSON.parse(new TextDecoder().decode(bytes));
  }
  function triggerDownload(url, filename) {
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    link.remove();
  }
  function currentLocaleId(ctx) {
    try {
      const snapshot = ctx.locale.getLocale();
      return snapshot && typeof snapshot.id === "string" ? snapshot.id : "zh";
    } catch {
      return "zh";
    }
  }
  var FORMAT_OPTIONS = ["xlsx", "markdown", "csv", "html"];
  function formatLabel(format, t) {
    if (format === "markdown") return t("format.markdown", "Markdown");
    if (format === "csv") return t("format.csv", "CSV");
    if (format === "html") return t("format.html", "HTML");
    return t("format.xlsx", "XLSX");
  }
  function formatExtension(format) {
    return format === "markdown" ? "md" : format;
  }
  function formatShortLabel(format) {
    return format === "markdown" ? "Markdown" : format.toUpperCase();
  }

  // raw:E:\myproject\dsh-plugin-daily-report\src\client\styles.css
  var styles_default = ".dsdr-root { height: 100%; overflow: auto; background: var(--dsw-alias-bg-base); color: var(--dsw-alias-label-primary); }\n.dsdr-page { box-sizing: border-box; max-width: 1080px; margin: 0 auto; padding: 28px 28px 56px; display: flex; flex-direction: column; gap: 16px; }\n.dsdr-hero { display: flex; align-items: flex-start; flex-wrap: wrap; gap: 14px; }\n.dsdr-hero-copy { flex: 1; min-width: 0; }\n.dsdr-hero-action { display: flex; flex: none; flex-direction: column; align-items: flex-end; gap: 5px; margin-left: auto; }\n.dsdr-hero-buttons { display: flex; align-items: center; justify-content: flex-end; flex-wrap: wrap; gap: 8px; }\n.dsdr-save-btn { min-height: 38px; background: #3b4046; border-color: #3b4046; color: #ffffff; font-weight: 600; }\n.dsdr-save-btn:hover { background: #292d31; border-color: #292d31; }\n.dsdr-save-btn:disabled { background: #666b70; border-color: #666b70; color: #ffffff; opacity: .8; }\n.dsdr-generate { min-height: 38px; padding: 9px 16px; font-size: 13px; white-space: nowrap; }\n.dsdr-btn-with-icon { display: inline-flex; align-items: center; justify-content: center; gap: 6px; }\n.dsdr-split { position: relative; display: inline-flex; align-items: stretch; }\n.dsdr-split .dsdr-generate { border-radius: 8px 0 0 8px; }\n.dsdr-save-split .dsdr-save-btn:first-child { border-radius: 8px 0 0 8px; }\n.dsdr-save-split .dsdr-split-toggle { border-radius: 0 8px 8px 0; border-left: 1px solid rgba(255, 255, 255, .25); background: #3b4046; border-color: #3b4046; }\n.dsdr-save-split .dsdr-split-toggle:hover { background: #292d31; border-color: #292d31; }\n.dsdr-split > .dsdr-split-toggle { min-height: 38px; padding: 0 9px; border-radius: 0 8px 8px 0; border-left: 1px solid rgba(255, 255, 255, .32); }\n.dsdr-menu { position: absolute; top: calc(100% + 6px); right: 0; z-index: 30; min-width: 190px; padding: 5px; border: 1px solid var(--dsw-alias-border-l2); border-radius: 10px; background: var(--dsw-alias-bg-overlay); box-shadow: 0 10px 28px rgba(0, 0, 0, .2); }\n.dsdr-menu-title { padding: 5px 8px 4px; color: var(--dsw-alias-label-secondary); font-size: 11px; line-height: 16px; }\n.dsdr-menu-item { display: flex; align-items: center; justify-content: space-between; gap: 8px; width: 100%; padding: 7px 8px; border: 0; border-radius: 7px; background: transparent; color: var(--dsw-alias-label-primary); font: inherit; font-size: 12px; line-height: 18px; text-align: left; cursor: pointer; }\n.dsdr-menu-item:hover { background: var(--dsw-alias-bg-layer-2); }\n.dsdr-menu-item.is-active { background: var(--dsw-alias-bg-layer-2); font-weight: 600; }\n.dsdr-menu-item-start { justify-content: flex-start; gap: 9px; }\n.dsdr-menu-check { width: 14px; color: #146b5a; text-align: center; }\n.dsdr-save { color: var(--dsw-alias-label-secondary); font-size: 11px; line-height: 16px; }\n.dsdr-mark { flex: none; width: 42px; height: 42px; border-radius: 11px; display: grid; place-items: center; background: var(--dsw-alias-bg-layer-2); border: 1px solid var(--dsw-alias-border-l1); }\n.dsdr-title { margin: 0; font-size: 22px; line-height: 30px; font-weight: 600; }\n.dsdr-sub { margin: 2px 0 0; color: var(--dsw-alias-label-secondary); font-size: 13px; line-height: 20px; }\n.dsdr-card { border: 1px solid var(--dsw-alias-border-l1); border-radius: 12px; background: var(--dsw-alias-bg-layer-1); padding: 16px 18px; }\n.dsdr-card-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; margin-bottom: 12px; }\n.dsdr-card-title { font-size: 14px; line-height: 22px; font-weight: 600; }\n.dsdr-ai-title { display: inline-block; font-size: 15px; font-weight: 700; letter-spacing: .03em; background: linear-gradient(100deg, #0f766e 0%, #06b6d4 22%, #3b82f6 46%, #8b5cf6 70%, #0f766e 100%); background-size: 320% 100%; -webkit-background-clip: text; background-clip: text; color: transparent; -webkit-text-fill-color: transparent; filter: drop-shadow(0 0 7px rgba(20, 184, 166, .22)); animation: dsdr-ai-gradient 5s ease-in-out infinite; }\n@keyframes dsdr-ai-gradient { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }\n@media (prefers-reduced-motion: reduce) { .dsdr-ai-title { animation: none; } }\n.dsdr-card-desc { margin-top: 2px; color: var(--dsw-alias-label-secondary); font-size: 12px; line-height: 18px; }\n.dsdr-title-with-info { display: flex; align-items: center; gap: 6px; min-width: 0; }\n.dsdr-info { position: relative; display: inline-flex; flex: none; align-items: center; justify-content: center; width: 15px; height: 15px; border: 1px solid var(--dsw-alias-border-l2); border-radius: 50%; color: var(--dsw-alias-label-secondary); font-family: Georgia, serif; font-size: 10px; font-style: italic; font-weight: 700; line-height: 1; cursor: help; }\n.dsdr-info:hover, .dsdr-info:focus-visible { border-color: #146b5a; color: #146b5a; outline: none; }\n.dsdr-info::after { content: attr(data-tip); position: absolute; top: calc(100% + 8px); left: 50%; z-index: 80; width: max-content; max-width: 280px; padding: 7px 9px; border: 1px solid var(--dsw-alias-border-l2); border-radius: 7px; background: var(--dsw-alias-bg-overlay); color: var(--dsw-alias-label-primary); box-shadow: 0 7px 20px rgba(0, 0, 0, .2); font-family: inherit; font-size: 11px; font-style: normal; font-weight: 400; line-height: 17px; text-align: left; white-space: normal; opacity: 0; visibility: hidden; transform: translate(-50%, -3px); transition: opacity .15s ease, transform .15s ease, visibility .15s ease; pointer-events: none; }\n.dsdr-info:hover::after, .dsdr-info:focus-visible::after { opacity: 1; visibility: visible; transform: translate(-50%, 0); }\n.dsdr-range { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) auto; gap: 10px; align-items: end; }\n.dsdr-field { display: flex; flex-direction: column; gap: 4px; min-width: 0; }\n.dsdr-label { color: var(--dsw-alias-label-secondary); font-size: 12px; line-height: 18px; }\n.dsdr-input { box-sizing: border-box; width: 100%; height: 32px; padding: 4px 9px; border: 1px solid var(--dsw-alias-border-l2); border-radius: 7px; background: var(--dsw-alias-bg-base); color: var(--dsw-alias-label-primary); font: inherit; font-size: 13px; }\n.dsdr-input:focus { outline: 2px solid var(--dsw-alias-brand-primary); outline-offset: 1px; }\n.dsdr-input::placeholder { color: var(--dsw-alias-label-secondary); opacity: .75; }\n.dsdr-actions { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; }\n.dsdr-btn { box-sizing: border-box; border: 1px solid var(--dsw-alias-border-l2); border-radius: 8px; background: var(--dsw-alias-bg-layer-2); color: var(--dsw-alias-label-primary); font: inherit; font-size: 12px; font-weight: 500; line-height: 20px; padding: 5px 11px; cursor: pointer; }\n.dsdr-btn:hover { background: var(--dsw-alias-bg-layer-1); border-color: var(--dsw-alias-brand-primary); }\n.dsdr-btn:focus-visible { outline: 2px solid var(--dsw-alias-brand-primary); outline-offset: 1px; }\n.dsdr-btn:disabled { opacity: .7; cursor: not-allowed; }\n.dsdr-btn-primary { background: #146b5a; border-color: #146b5a; color: #ffffff; font-weight: 600; box-shadow: 0 2px 6px rgba(0, 0, 0, .18); }\n.dsdr-btn-primary:hover { background: #0f5547; border-color: #0f5547; opacity: 1; }\n.dsdr-btn-primary:disabled { background: #6b8a82; border-color: #6b8a82; color: #ffffff; opacity: .8; }\n.dsdr-btn-danger { border-color: transparent; background: transparent; color: var(--dsw-alias-state-error-primary); font-weight: 600; }\n.dsdr-btn-danger:hover { background: var(--dsw-alias-bg-layer-2); border-color: transparent; }\n.dsdr-check { display: inline-flex; align-items: center; gap: 7px; color: var(--dsw-alias-label-primary); font-size: 12px; line-height: 20px; cursor: pointer; white-space: nowrap; }\n.dsdr-check input { width: 15px; height: 15px; margin: 0; accent-color: #15557f; cursor: pointer; }\n.dsdr-check.is-disabled { color: var(--dsw-alias-label-secondary); cursor: not-allowed; opacity: .7; }\n.dsdr-check.is-disabled input { cursor: not-allowed; }\n.dsdr-switch { position: relative; display: inline-flex; align-items: center; cursor: pointer; }\n.dsdr-switch input { position: absolute; inset: 0; width: 100%; height: 100%; margin: 0; opacity: 0; cursor: pointer; z-index: 1; }\n.dsdr-switch-track { position: relative; width: 44px; height: 24px; border: 0; border-radius: 999px; background: var(--dsw-alias-bg-layer-2); box-shadow: inset 0 0 0 1px var(--dsw-alias-border-l2); transition: background .18s ease, box-shadow .18s ease; }\n.dsdr-switch-thumb { position: absolute; top: 3px; left: 3px; width: 18px; height: 18px; border-radius: 50%; background: #ffffff; box-shadow: 0 1px 3px rgba(0, 0, 0, .28); transition: transform .18s ease, background .18s ease; }\n.dsdr-switch input:checked + .dsdr-switch-track { background: #146b5a; box-shadow: inset 0 0 0 1px #146b5a; }\n.dsdr-switch input:checked + .dsdr-switch-track .dsdr-switch-thumb { transform: translateX(20px); background: #ffffff; }\n.dsdr-switch input:focus-visible + .dsdr-switch-track { outline: 2px solid #146b5a; outline-offset: 2px; }\n.dsdr-switch.is-disabled { opacity: .55; cursor: not-allowed; }\n.dsdr-switch.is-disabled input { cursor: not-allowed; }\n.dsdr-progress-card { display: flex; flex-direction: column; gap: 7px; }\n.dsdr-progress-head { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; font-size: 12px; line-height: 18px; color: var(--dsw-alias-label-primary); }\n.dsdr-progress-value { flex: none; color: var(--dsw-alias-label-secondary); font-variant-numeric: tabular-nums; }\n.dsdr-progress-track { height: 6px; overflow: hidden; border-radius: 999px; background: var(--dsw-alias-bg-layer-2); }\n.dsdr-progress-fill { height: 100%; border-radius: 999px; background: #15557f; transition: width .3s ease; }\n.dsdr-progress-track.is-indeterminate .dsdr-progress-fill { width: 35% !important; animation: dsdr-progress 1.2s ease-in-out infinite; }\n@keyframes dsdr-progress { 0% { transform: translateX(-110%); } 100% { transform: translateX(320%); } }\n.dsdr-ai-result { margin-top: 12px; padding: 10px 12px; border: 1px solid var(--dsw-alias-border-l1); border-radius: 10px; background: var(--dsw-alias-bg-layer-2); }\n.dsdr-preview-overall { display: flex; flex-direction: column; gap: 5px; margin-bottom: 10px; }\n.dsdr-textarea { box-sizing: border-box; width: 100%; min-height: 64px; resize: vertical; padding: 7px 9px; border: 1px solid var(--dsw-alias-border-l2); border-radius: 7px; background: var(--dsw-alias-bg-base); color: var(--dsw-alias-label-primary); font: inherit; font-size: 12px; line-height: 19px; }\n.dsdr-textarea:focus { outline: 2px solid var(--dsw-alias-brand-primary); outline-offset: 1px; }\n.dsdr-manual-add { display: grid; grid-template-columns: 145px minmax(0, 1fr) auto; gap: 8px; align-items: center; margin: 10px 0 14px; }\n.dsdr-preview-list { display: flex; flex-direction: column; gap: 10px; }\n.dsdr-preview-day { display: flex; flex-direction: column; gap: 7px; padding: 11px 12px; border: 1px solid var(--dsw-alias-border-l1); border-radius: 10px; background: var(--dsw-alias-bg-layer-2); }\n.dsdr-preview-day-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; }\n.dsdr-preview-toggle { display: flex; flex: 1; align-items: center; flex-wrap: wrap; gap: 4px 6px; min-width: 0; padding: 0; border: 0; background: transparent; color: var(--dsw-alias-label-primary); font: inherit; text-align: left; cursor: pointer; }\n.dsdr-preview-toggle:hover .dsdr-preview-date { color: var(--dsw-alias-brand-primary); }\n.dsdr-preview-chevron { flex: none; width: 13px; color: var(--dsw-alias-label-secondary); font-size: 12px; line-height: 20px; }\n.dsdr-preview-badge { display: inline-flex; align-items: center; padding: 1px 6px; border: 1px solid var(--dsw-alias-border-l1); border-radius: 999px; color: var(--dsw-alias-label-secondary); font-size: 10px; line-height: 16px; }\n.dsdr-preview-body { display: flex; flex-direction: column; gap: 7px; margin-top: 2px; padding-top: 8px; border-top: 1px dashed var(--dsw-alias-border-l1); }\n.dsdr-preview-date { font-size: 13px; line-height: 20px; font-weight: 600; }\n.dsdr-preview-raw { color: var(--dsw-alias-label-secondary); font-size: 12px; line-height: 19px; }\n.dsdr-manual-list { display: flex; flex-wrap: wrap; gap: 6px; }\n.dsdr-manual-chip { display: inline-flex; align-items: center; gap: 5px; max-width: 100%; padding: 2px 6px 2px 9px; border: 1px solid var(--dsw-alias-border-l1); border-radius: 999px; background: var(--dsw-alias-bg-base); color: var(--dsw-alias-label-primary); font-size: 11px; line-height: 18px; overflow-wrap: anywhere; }\n.dsdr-manual-remove { border: 0; background: transparent; color: var(--dsw-alias-state-error-primary); font: inherit; font-size: 14px; line-height: 16px; padding: 0 1px; cursor: pointer; }\n.dsdr-ai-text { margin-top: 5px; color: var(--dsw-alias-label-primary); font-size: 12px; line-height: 20px; white-space: pre-wrap; }\n.dsdr-filter-row { display: flex; align-items: center; flex-wrap: wrap; gap: 8px 12px; margin: 0 0 10px; }\n.dsdr-datasource-tabs { margin-bottom: -16px; border-bottom-left-radius: 0; border-bottom-right-radius: 0; }\n.dsdr-datasource-panel { border-top-left-radius: 0; border-top-right-radius: 0; }\n.dsdr-tabs { display: flex; align-items: center; gap: 4px; margin-top: 12px; border-bottom: 1px solid var(--dsw-alias-border-l1); }\n.dsdr-tab { display: inline-flex; align-items: center; gap: 6px; padding: 7px 12px 8px; border: 0; border-bottom: 2px solid transparent; background: transparent; color: var(--dsw-alias-label-secondary); font: inherit; font-size: 12px; line-height: 18px; cursor: pointer; }\n.dsdr-tab:hover { color: var(--dsw-alias-label-primary); }\n.dsdr-tab.is-active { color: var(--dsw-alias-label-primary); border-bottom-color: #146b5a; font-weight: 600; }\n.dsdr-tab-count { display: inline-flex; min-width: 17px; height: 17px; align-items: center; justify-content: center; padding: 0 5px; border-radius: 999px; background: var(--dsw-alias-bg-layer-2); color: var(--dsw-alias-label-secondary); font-size: 10px; line-height: 17px; }\n.dsdr-filter-author { flex: 1 1 280px; min-width: 220px; }\n.dsdr-ai-options { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 10px; margin-top: 10px; }\n.dsdr-schedule-status { display: flex; flex-direction: column; gap: 6px; margin-top: 10px; padding-top: 9px; border-top: 1px dashed var(--dsw-alias-border-l1); }\n.dsdr-schedule-status-head { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px 10px; }\n.dsdr-history-list { display: flex; flex-wrap: wrap; gap: 4px 12px; }\n.dsdr-history-link { color: #146b5a; font-size: 12px; line-height: 18px; text-decoration: none; }\n.dsdr-history-link:hover { text-decoration: underline; }\n.dsdr-test-results { display: flex; flex-direction: column; gap: 5px; margin: 0 0 10px; padding: 8px 10px; border: 1px solid var(--dsw-alias-border-l1); border-radius: 8px; background: var(--dsw-alias-bg-layer-2); }\n.dsdr-scan { display: flex; flex-direction: column; gap: 7px; margin: 0 0 12px; padding: 12px; border: 1px dashed var(--dsw-alias-border-l2); border-radius: 10px; background: var(--dsw-alias-bg-layer-2); }\n.dsdr-scan-title { font-size: 13px; line-height: 20px; font-weight: 600; }\n.dsdr-scan-row { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 8px; align-items: end; }\n.dsdr-source { display: grid; grid-template-columns: minmax(0, 1.5fr) 150px 34px; gap: 8px; align-items: end; margin-top: 8px; }\n.dsdr-source-docs { grid-template-columns: minmax(0, 1fr) minmax(120px, .35fr) 34px; }\n.dsdr-icon-btn { width: 32px; height: 32px; padding: 0; display: grid; place-items: center; line-height: 1; font-size: 18px; }\n.dsdr-hint { color: var(--dsw-alias-label-secondary); font-size: 12px; line-height: 18px; }\n.dsdr-error { border: 1px solid var(--dsw-alias-state-error-primary); border-radius: 9px; color: var(--dsw-alias-state-error-primary); background: transparent; padding: 9px 12px; font-size: 12px; line-height: 18px; white-space: pre-wrap; }\n.dsdr-error-row { display: flex; align-items: center; justify-content: space-between; gap: 10px; }\n.dsdr-notice { color: var(--dsw-alias-label-secondary); font-size: 12px; line-height: 18px; }\n.dsdr-ok { color: var(--dsw-alias-state-success-primary); }\n.dsdr-warn { color: var(--dsw-alias-state-warn-primary); }\n.dsdr-bad { color: var(--dsw-alias-state-error-primary); }\n.dsdr-empty { color: var(--dsw-alias-label-secondary); font-size: 12px; line-height: 18px; padding: 10px 0 2px; }\n.dsdr-stats { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px; }\n.dsdr-stat { border: 1px solid var(--dsw-alias-border-l1); border-radius: 10px; padding: 10px 12px; background: var(--dsw-alias-bg-layer-2); }\n.dsdr-stat-value { font-size: 20px; line-height: 26px; font-weight: 600; }\n.dsdr-stat-label { color: var(--dsw-alias-label-secondary); font-size: 12px; line-height: 18px; }\n.dsdr-list { display: flex; flex-direction: column; gap: 7px; margin-top: 10px; }\n.dsdr-row { display: flex; align-items: flex-start; gap: 8px; font-size: 12px; line-height: 18px; }\n.dsdr-dot { flex: none; width: 7px; height: 7px; margin-top: 6px; border-radius: 50%; background: var(--dsw-alias-state-idle-primary); }\n.dsdr-dot.ok { background: var(--dsw-alias-state-success-primary); }\n.dsdr-dot.warn { background: var(--dsw-alias-state-warn-primary); }\n.dsdr-dot.error { background: var(--dsw-alias-state-error-primary); }\n.dsdr-source-name { font-weight: 500; }\n.dsdr-source-meta { color: var(--dsw-alias-label-secondary); }\n.dsdr-code { font-family: ui-monospace, SFMono-Regular, Consolas, monospace; font-size: 11px; }\n.dsdr-footer { color: var(--dsw-alias-label-secondary); font-size: 11px; line-height: 17px; }\n.dsdr-spacer { flex: 1; }\n@media (max-width: 780px) { .dsdr-page { padding: 20px 16px 40px; } .dsdr-hero-action { flex: 1 0 100%; width: 100%; align-items: stretch; margin-left: 0; } .dsdr-hero-buttons { width: 100%; } .dsdr-hero-buttons .dsdr-btn { flex: 1; } .dsdr-split { flex: 1; } .dsdr-split .dsdr-generate { flex: 1; } .dsdr-generate { width: 100%; } .dsdr-ai-options { grid-template-columns: 1fr; } .dsdr-range { grid-template-columns: 1fr 1fr; } .dsdr-range .dsdr-actions { grid-column: 1 / -1; } .dsdr-stats { grid-template-columns: 1fr 1fr; } .dsdr-scan-row { grid-template-columns: 1fr; } .dsdr-manual-add { grid-template-columns: 1fr; } .dsdr-source, .dsdr-source-docs { grid-template-columns: 1fr; } .dsdr-source .dsdr-icon-btn { justify-self: end; } }\n\n.dsdr-confirm-backdrop { position: fixed; inset: 0; z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 20px; background: rgba(0, 0, 0, .38); }\n.dsdr-confirm { width: min(400px, 100%); box-sizing: border-box; padding: 18px; border: 1px solid var(--dsw-alias-border-l2); border-radius: 12px; background: var(--dsw-alias-bg-overlay); box-shadow: 0 18px 48px rgba(0, 0, 0, .28); }\n.dsdr-confirm-title { margin: 0 0 8px; font-size: 15px; line-height: 22px; }\n.dsdr-confirm-message { color: var(--dsw-alias-label-secondary); font-size: 12px; line-height: 19px; white-space: pre-wrap; }\n.dsdr-confirm-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 18px; }\n\n\n.dsdr-confirm .dsdr-btn-danger { background: #b42318; border-color: #b42318; color: #ffffff; }\n.dsdr-confirm .dsdr-btn-danger:hover { background: #912018; border-color: #912018; }\n\n\n.dsdr-confirm-backdrop { pointer-events: auto; background: rgba(0, 0, 0, .5); }\n.dsdr-confirm { pointer-events: auto; background: var(--dsw-alias-bg-overlay, var(--dsw-alias-bg-base, #ffffff)); color: var(--dsw-alias-label-primary, #1f2328); }\n.dsdr-confirm .dsdr-btn { pointer-events: auto; }\n\n\n\n.dsdr-confirm { background: #1f2328; color: #f5f7fa; border-color: rgba(255, 255, 255, .16); }\n.dsdr-confirm-title { color: #f5f7fa; }\n.dsdr-confirm-message { color: #c9d1d9; }\n\n\n.dsdr-confirm { background: transparent !important; border: 0 !important; box-shadow: none !important; }\n.dsdr-confirm-panel { width: 100%; background: #1f2328 !important; color: #f5f7fa; }\n\r\n\n.dsdr-toast-wrap { position: fixed; left: 50%; bottom: 28px; z-index: 1200; transform: translateX(-50%); pointer-events: none; }\n.dsdr-toast { display: flex; align-items: center; gap: 8px; max-width: min(520px, calc(100vw - 48px)); padding: 9px 12px 9px 10px; border: 1px solid rgba(255, 255, 255, .14); border-radius: 10px; background: #1f2328; color: #f5f7fa; font-size: 12px; line-height: 18px; box-shadow: 0 12px 32px rgba(0, 0, 0, .36); pointer-events: auto; animation: dsdr-toast-in .18s ease-out; }\n.dsdr-toast-icon { display: inline-flex; align-items: center; justify-content: center; width: 18px; height: 18px; flex: none; border-radius: 50%; background: #146b5a; color: #ffffff; }\n.dsdr-toast-icon.is-error { background: #b42318; }\n.dsdr-toast-text { min-width: 0; overflow-wrap: anywhere; }\n.dsdr-toast-close { flex: none; width: 18px; height: 18px; padding: 0; border: 0; border-radius: 4px; background: transparent; color: #9aa4ad; font-size: 14px; line-height: 16px; cursor: pointer; }\n.dsdr-toast-close:hover { background: rgba(255, 255, 255, .1); color: #ffffff; }\n@keyframes dsdr-toast-in { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }\n\r\n\n.dsdr-menu-sep { height: 1px; margin: 4px 6px; background: var(--dsw-alias-border-l2); }\n.dsdr-menu-item-danger { color: #e5534b; }\n.dsdr-menu-item-danger:hover { background: rgba(229, 83, 75, .12); }\n\r\n";

  // src/client/styles.js
  function installStyles(ctx) {
    const style = document.createElement("style");
    style.dataset.plugin = "dsh-plugin-daily-report";
    style.textContent = styles_default;
    document.head.appendChild(style);
    ctx.effect(() => () => style.remove(), "daily-report: styles");
  }

  // src/client/icons.jsx
  var import_react2 = __toESM(__require("react"), 1);
  function Icon() {
    return /* @__PURE__ */ import_react2.default.createElement("svg", { viewBox: "0 0 64 64", width: 26, height: 26, "aria-hidden": true }, /* @__PURE__ */ import_react2.default.createElement("rect", { width: 64, height: 64, rx: 14, fill: "#1f4e79" }), /* @__PURE__ */ import_react2.default.createElement(
      "path",
      {
        d: "M17 19h30a3 3 0 0 1 3 3v26a3 3 0 0 1-3 3H17a3 3 0 0 1-3-3V22a3 3 0 0 1 3-3z",
        fill: "#f7fbff"
      }
    ), /* @__PURE__ */ import_react2.default.createElement("path", { d: "M14 27h36v4H14z", fill: "#8db9e2" }), /* @__PURE__ */ import_react2.default.createElement(
      "path",
      {
        d: "M22 14v8M42 14v8",
        stroke: "#bfe0ff",
        strokeWidth: 4,
        strokeLinecap: "round"
      }
    ), /* @__PURE__ */ import_react2.default.createElement("path", { d: "M22 38h7v7h-7zM33 38h7v7h-7zM22 48h7v3h-7z", fill: "#1f7a5c" }), /* @__PURE__ */ import_react2.default.createElement(
      "path",
      {
        d: "M33 48h9",
        stroke: "#e0a526",
        strokeWidth: 3,
        strokeLinecap: "round"
      }
    ));
  }
  function PanelIcon(props) {
    const size = Number(props && props.size) > 0 ? Number(props.size) : 20;
    return /* @__PURE__ */ import_react2.default.createElement(
      "svg",
      {
        viewBox: "0 0 24 24",
        width: size,
        height: size,
        fill: "none",
        stroke: "currentColor",
        strokeWidth: 1.6,
        strokeLinecap: "round",
        strokeLinejoin: "round",
        "aria-hidden": true
      },
      /* @__PURE__ */ import_react2.default.createElement("rect", { x: 3.5, y: 4.5, width: 17, height: 15, rx: 2.5 }),
      /* @__PURE__ */ import_react2.default.createElement("path", { d: "M8 3v3M16 3v3M3.5 9h17" }),
      /* @__PURE__ */ import_react2.default.createElement("path", { d: "M8 13h3M8 16.5h3M14 13h2.5M14 16.5h2.5" })
    );
  }
  function SaveIcon(props) {
    const size = Number(props && props.size) > 0 ? Number(props.size) : 15;
    return /* @__PURE__ */ import_react2.default.createElement(
      "svg",
      {
        viewBox: "0 0 24 24",
        width: size,
        height: size,
        fill: "none",
        stroke: "currentColor",
        strokeWidth: 1.8,
        strokeLinecap: "round",
        strokeLinejoin: "round",
        "aria-hidden": true
      },
      /* @__PURE__ */ import_react2.default.createElement("path", { d: "M5 3.5h11l3.5 3.5v13.5H5z" }),
      /* @__PURE__ */ import_react2.default.createElement("path", { d: "M8 3.5v5h7v-5M8 20.5v-6h8v6" })
    );
  }
  function GenerateIcon(props) {
    const size = Number(props && props.size) > 0 ? Number(props.size) : 15;
    return /* @__PURE__ */ import_react2.default.createElement(
      "svg",
      {
        viewBox: "0 0 24 24",
        width: size,
        height: size,
        fill: "none",
        stroke: "currentColor",
        strokeWidth: 1.8,
        strokeLinecap: "round",
        strokeLinejoin: "round",
        "aria-hidden": true
      },
      /* @__PURE__ */ import_react2.default.createElement("path", { d: "M6 3.5h8l4 4v13H6z" }),
      /* @__PURE__ */ import_react2.default.createElement("path", { d: "M14 3.5v4h4M9 12h6M9 15.5h4" }),
      /* @__PURE__ */ import_react2.default.createElement("path", { d: "M18.5 16.5v4M16.5 18.5h4" })
    );
  }
  function ChevronIcon(props) {
    const size = Number(props && props.size) > 0 ? Number(props.size) : 12;
    return /* @__PURE__ */ import_react2.default.createElement(
      "svg",
      {
        viewBox: "0 0 24 24",
        width: size,
        height: size,
        fill: "none",
        stroke: "currentColor",
        strokeWidth: 2,
        strokeLinecap: "round",
        strokeLinejoin: "round",
        "aria-hidden": true
      },
      /* @__PURE__ */ import_react2.default.createElement("path", { d: "M6 9l6 6 6-6" })
    );
  }
  function InfoDot(props) {
    return /* @__PURE__ */ import_react2.default.createElement(
      "span",
      {
        className: "dsdr-info",
        role: "img",
        tabIndex: 0,
        "aria-label": props.text,
        "data-tip": props.text
      },
      "i"
    );
  }
  function RefreshIcon(props) {
    const size = Number(props && props.size) > 0 ? Number(props.size) : 14;
    return /* @__PURE__ */ import_react2.default.createElement(
      "svg",
      {
        viewBox: "0 0 24 24",
        width: size,
        height: size,
        fill: "none",
        stroke: "currentColor",
        strokeWidth: 1.9,
        strokeLinecap: "round",
        strokeLinejoin: "round",
        "aria-hidden": true
      },
      /* @__PURE__ */ import_react2.default.createElement("path", { d: "M20 11a8 8 0 1 0-2.3 5.7" }),
      /* @__PURE__ */ import_react2.default.createElement("path", { d: "M20 4v7h-7" })
    );
  }
  function PlayIcon(props) {
    const size = Number(props && props.size) > 0 ? Number(props.size) : 14;
    return /* @__PURE__ */ import_react2.default.createElement(
      "svg",
      {
        viewBox: "0 0 24 24",
        width: size,
        height: size,
        fill: "currentColor",
        "aria-hidden": true
      },
      /* @__PURE__ */ import_react2.default.createElement("path", { d: "M8 5.5v13l10-6.5z" })
    );
  }
  function TestIcon(props) {
    const size = Number(props && props.size) > 0 ? Number(props.size) : 14;
    return /* @__PURE__ */ import_react2.default.createElement(
      "svg",
      {
        viewBox: "0 0 24 24",
        width: size,
        height: size,
        fill: "none",
        stroke: "currentColor",
        strokeWidth: 1.8,
        strokeLinecap: "round",
        strokeLinejoin: "round",
        "aria-hidden": true
      },
      /* @__PURE__ */ import_react2.default.createElement("circle", { cx: 12, cy: 12, r: 9 }),
      /* @__PURE__ */ import_react2.default.createElement("path", { d: "M7.5 12.5l3 3 6-6.5" })
    );
  }
  function ScanIcon(props) {
    const size = Number(props && props.size) > 0 ? Number(props.size) : 14;
    return /* @__PURE__ */ import_react2.default.createElement(
      "svg",
      {
        viewBox: "0 0 24 24",
        width: size,
        height: size,
        fill: "none",
        stroke: "currentColor",
        strokeWidth: 1.8,
        strokeLinecap: "round",
        strokeLinejoin: "round",
        "aria-hidden": true
      },
      /* @__PURE__ */ import_react2.default.createElement("path", { d: "M3.5 7.5h6l2 2h9v9.5h-17z" }),
      /* @__PURE__ */ import_react2.default.createElement("path", { d: "M3.5 7.5V5h5l2 2" }),
      /* @__PURE__ */ import_react2.default.createElement("circle", { cx: 15, cy: 14.5, r: 2.2 }),
      /* @__PURE__ */ import_react2.default.createElement("path", { d: "M16.6 16.1l2 2" })
    );
  }
  function DownloadIcon(props) {
    const size = Number(props && props.size) > 0 ? Number(props.size) : 14;
    return /* @__PURE__ */ import_react2.default.createElement(
      "svg",
      {
        viewBox: "0 0 24 24",
        width: size,
        height: size,
        fill: "none",
        stroke: "currentColor",
        strokeWidth: 1.8,
        strokeLinecap: "round",
        strokeLinejoin: "round",
        "aria-hidden": true
      },
      /* @__PURE__ */ import_react2.default.createElement("path", { d: "M12 3.5v11M7.5 10.5l4.5 4.5 4.5-4.5" }),
      /* @__PURE__ */ import_react2.default.createElement("path", { d: "M4.5 17.5v2h15v-2" })
    );
  }
  function UploadIcon(props) {
    const size = Number(props && props.size) > 0 ? Number(props.size) : 14;
    return /* @__PURE__ */ import_react2.default.createElement(
      "svg",
      {
        viewBox: "0 0 24 24",
        width: size,
        height: size,
        fill: "none",
        stroke: "currentColor",
        strokeWidth: 1.8,
        strokeLinecap: "round",
        strokeLinejoin: "round",
        "aria-hidden": true
      },
      /* @__PURE__ */ import_react2.default.createElement("path", { d: "M12 15.5v-11M7.5 8.5L12 4l4.5 4.5" }),
      /* @__PURE__ */ import_react2.default.createElement("path", { d: "M4.5 17.5v2h15v-2" })
    );
  }
  function TrashIcon(props) {
    const size = Number(props && props.size) > 0 ? Number(props.size) : 14;
    return /* @__PURE__ */ import_react2.default.createElement(
      "svg",
      {
        viewBox: "0 0 24 24",
        width: size,
        height: size,
        fill: "none",
        stroke: "currentColor",
        strokeWidth: 1.9,
        strokeLinecap: "round",
        strokeLinejoin: "round",
        "aria-hidden": true
      },
      /* @__PURE__ */ import_react2.default.createElement("path", { d: "M4 7h16" }),
      /* @__PURE__ */ import_react2.default.createElement("path", { d: "M9 7V5h6v2" }),
      /* @__PURE__ */ import_react2.default.createElement("path", { d: "M6 7l1 13h10l1-13" })
    );
  }
  function ResetIcon(props) {
    const size = Number(props && props.size) > 0 ? Number(props.size) : 14;
    return /* @__PURE__ */ import_react2.default.createElement(
      "svg",
      {
        viewBox: "0 0 24 24",
        width: size,
        height: size,
        fill: "none",
        stroke: "currentColor",
        strokeWidth: 1.9,
        strokeLinecap: "round",
        strokeLinejoin: "round",
        "aria-hidden": true
      },
      /* @__PURE__ */ import_react2.default.createElement("path", { d: "M4 12a8 8 0 1 1 2.4 5.7" }),
      /* @__PURE__ */ import_react2.default.createElement("path", { d: "M4 19v-7h7" })
    );
  }

  // src/client/context.jsx
  var import_react3 = __toESM(__require("react"), 1);
  var AppContext = import_react3.default.createContext(null);
  var currentApp = null;
  function setApp(app) {
    currentApp = app;
    return app;
  }
  function useApp() {
    return import_react3.default.useContext(AppContext) || currentApp;
  }

  // src/client/views/DailyReportPage.jsx
  var import_react12 = __toESM(__require("react"), 1);

  // src/client/views/AiCard.jsx
  var import_react6 = __toESM(__require("react"), 1);

  // src/client/components/Card.jsx
  var import_react4 = __toESM(__require("react"), 1);
  function Card({ className = "", children, ...props }) {
    return /* @__PURE__ */ import_react4.default.createElement("section", { className: ("dsdr-card " + className).trim(), ...props }, children);
  }

  // src/client/components/Switch.jsx
  var import_react5 = __toESM(__require("react"), 1);
  function Switch({ checked, disabled = false, onChange, label }) {
    return /* @__PURE__ */ import_react5.default.createElement(
      "label",
      {
        className: "dsdr-switch" + (disabled ? " is-disabled" : ""),
        title: label
      },
      /* @__PURE__ */ import_react5.default.createElement(
        "input",
        {
          type: "checkbox",
          role: "switch",
          "aria-checked": checked,
          "aria-label": label,
          checked,
          disabled,
          onChange
        }
      ),
      /* @__PURE__ */ import_react5.default.createElement("span", { className: "dsdr-switch-track", "aria-hidden": "true" }, /* @__PURE__ */ import_react5.default.createElement("span", { className: "dsdr-switch-thumb" }))
    );
  }

  // src/client/views/AiCard.jsx
  function AiCard() {
    const { settings, setSettings, useAi, setUseAi, aiInfo, t, confirm = async () => true } = useApp();
    return /* @__PURE__ */ import_react6.default.createElement(Card, null, /* @__PURE__ */ import_react6.default.createElement("div", { className: "dsdr-card-head" }, /* @__PURE__ */ import_react6.default.createElement("div", null, /* @__PURE__ */ import_react6.default.createElement("div", { className: "dsdr-title-with-info" }, /* @__PURE__ */ import_react6.default.createElement("div", { className: "dsdr-card-title dsdr-ai-title" }, t("ai.title", "AI \u5206\u6790")), /* @__PURE__ */ import_react6.default.createElement(
      InfoDot,
      {
        text: t(
          "ai.desc",
          "\u4F7F\u7528 AI \u6A21\u578B\u57FA\u4E8E\u6570\u636E\u6E90\u5185\u5BB9\u603B\u7ED3\u6982\u62EC\uFF0C\u751F\u6210\u65E5\u62A5\u5185\u5BB9\u3002"
        )
      }
    ))), /* @__PURE__ */ import_react6.default.createElement(
      Switch,
      {
        checked: useAi,
        disabled: !aiInfo.available,
        label: t("ai.enable", "\u542F\u7528 AI \u5206\u6790"),
        onChange: async (event) => {
          const nextChecked = event.target.checked;
          if (!nextChecked && useAi) {
            const accepted = await confirm({
              title: t("confirm.disableAi.title", "\u5173\u95ED AI \u5206\u6790\uFF1F"),
              message: t(
                "confirm.disableAi.message",
                "\u5173\u95ED\u540E\u751F\u6210\u65E5\u62A5\u5C06\u4E0D\u518D\u8C03\u7528\u6A21\u578B\u5206\u6790\uFF0C\u5DF2\u751F\u6210\u7684 AI \u7ED3\u679C\u4E0D\u4F1A\u5220\u9664\u3002"
              ),
              confirmLabel: t("confirm.disable", "\u5173\u95ED"),
              cancelLabel: t("confirm.cancel", "\u53D6\u6D88")
            });
            if (!accepted) return;
          }
          setUseAi(nextChecked);
        }
      }
    )), /* @__PURE__ */ import_react6.default.createElement("div", { className: "dsdr-hint" }, aiInfo.available ? t("ai.model", "\u5F53\u524D\u6A21\u578B\uFF1A") + (settings.aiModel ? (settings.aiProvider ? settings.aiProvider + "/" : "") + settings.aiModel : aiInfo.provider + "/" + aiInfo.model) + " \xB7 " + t("ai.cost", "\u4F1A\u589E\u52A0\u751F\u6210\u65F6\u95F4\u548C\u6A21\u578B token \u6D88\u8017\u3002") : t("ai.unavailable", "\u5F53\u524D\u6CA1\u6709\u53EF\u7528\u7684\u9ED8\u8BA4\u6A21\u578B\u3002")), /* @__PURE__ */ import_react6.default.createElement("div", { className: "dsdr-ai-options" }, /* @__PURE__ */ import_react6.default.createElement("div", { className: "dsdr-field" }, /* @__PURE__ */ import_react6.default.createElement("label", { className: "dsdr-label", htmlFor: "dsdr-ai-template" }, t("ai.template", "\u5206\u6790\u98CE\u683C")), /* @__PURE__ */ import_react6.default.createElement(
      "select",
      {
        id: "dsdr-ai-template",
        className: "dsdr-input",
        value: settings.aiTemplate || "concise",
        onChange: (event) => setSettings((previous) => ({
          ...previous,
          aiTemplate: event.target.value
        }))
      },
      /* @__PURE__ */ import_react6.default.createElement("option", { value: "concise" }, t("ai.template.concise", "\u7B80\u6D01")),
      /* @__PURE__ */ import_react6.default.createElement("option", { value: "detailed" }, t("ai.template.detailed", "\u8BE6\u7EC6")),
      /* @__PURE__ */ import_react6.default.createElement("option", { value: "manager" }, t("ai.template.manager", "\u7BA1\u7406\u6C47\u62A5"))
    )), /* @__PURE__ */ import_react6.default.createElement("div", { className: "dsdr-field" }, /* @__PURE__ */ import_react6.default.createElement("label", { className: "dsdr-label", htmlFor: "dsdr-ai-model" }, t("ai.modelSelect", "\u6A21\u578B")), aiInfo.models && aiInfo.models.length > 0 ? /* @__PURE__ */ import_react6.default.createElement(
      "select",
      {
        id: "dsdr-ai-model",
        className: "dsdr-input",
        value: settings.aiModel || "",
        onChange: async (event) => {
          const selected = aiInfo.models.find(
            (model) => model.id === event.target.value
          );
          const nextModel = selected ? selected.id : "";
          if (nextModel === (settings.aiModel || "")) return;
          const accepted = await confirm({
            title: t("confirm.changeModel.title", "\u5207\u6362 AI \u6A21\u578B\uFF1F"),
            message: t("confirm.changeModel.message", "\u5C06\u5207\u6362\u5230\uFF1A") + (selected ? selected.name || selected.id : t("ai.defaultModel", "\u9ED8\u8BA4\u6A21\u578B")),
            confirmLabel: t("confirm.switch", "\u5207\u6362"),
            cancelLabel: t("confirm.cancel", "\u53D6\u6D88")
          });
          if (!accepted) return;
          setSettings((previous) => ({
            ...previous,
            aiProvider: selected ? selected.provider : "",
            aiModel: selected ? selected.id : ""
          }));
        }
      },
      /* @__PURE__ */ import_react6.default.createElement("option", { value: "" }, t("ai.defaultModel", "\u9ED8\u8BA4\u6A21\u578B") + "\uFF08" + aiInfo.provider + "/" + aiInfo.model + "\uFF09"),
      aiInfo.models.map((model) => /* @__PURE__ */ import_react6.default.createElement("option", { value: model.id, key: model.provider + "/" + model.id }, model.name || model.id))
    ) : /* @__PURE__ */ import_react6.default.createElement(
      "input",
      {
        id: "dsdr-ai-model",
        className: "dsdr-input",
        value: settings.aiModel || "",
        placeholder: t("ai.defaultModel", "\u9ED8\u8BA4\u6A21\u578B"),
        onChange: (event) => setSettings((previous) => ({
          ...previous,
          aiProvider: "",
          aiModel: event.target.value
        }))
      }
    ))));
  }

  // src/client/views/DataSourceCard.jsx
  var import_react7 = __toESM(__require("react"), 1);
  function DataSourceCard() {
    const {
      settings,
      setSettings,
      updateGit,
      removeGit,
      addGit,
      updateDoc,
      removeDoc,
      addDoc,
      showScan,
      scanDir,
      setScanDir,
      scanAndAdd,
      scanning,
      scanError,
      scanMessage,
      pickScanDirectory,
      toggleScan,
      testSources,
      testingSources,
      testError,
      testResults,
      dataSourceTab,
      setDataSourceTab,
      confirm = async () => true,
      t
    } = useApp();
    return /* @__PURE__ */ import_react7.default.createElement(import_react7.default.Fragment, null, /* @__PURE__ */ import_react7.default.createElement("section", { className: "dsdr-card dsdr-datasource-tabs" }, /* @__PURE__ */ import_react7.default.createElement("div", { className: "dsdr-card-head" }, /* @__PURE__ */ import_react7.default.createElement("div", null, /* @__PURE__ */ import_react7.default.createElement("div", { className: "dsdr-title-with-info" }, /* @__PURE__ */ import_react7.default.createElement("div", { className: "dsdr-card-title" }, t("datasource.title", "\u6570\u636E\u6E90\u914D\u7F6E")), /* @__PURE__ */ import_react7.default.createElement(
      InfoDot,
      {
        text: t(
          "datasource.desc",
          "\u751F\u6210\u65E5\u62A5\u7684\u5185\u5BB9\u6765\u6E90\uFF0C\u53EF\u4EE5\u662F Git \u4ED3\u5E93\u6216\u672C\u5730\u6587\u6863\u3002"
        )
      }
    ))), /* @__PURE__ */ import_react7.default.createElement(
      "button",
      {
        type: "button",
        className: "dsdr-btn dsdr-btn-with-icon",
        onClick: testSources,
        disabled: testingSources
      },
      /* @__PURE__ */ import_react7.default.createElement(TestIcon, { size: 14 }),
      /* @__PURE__ */ import_react7.default.createElement("span", null, testingSources ? t("test.testing", "\u6D4B\u8BD5\u4E2D\u2026") : t("test.button", "\u6D4B\u8BD5\u6570\u636E\u6E90"))
    )), /* @__PURE__ */ import_react7.default.createElement("div", { className: "dsdr-tabs", role: "tablist" }, /* @__PURE__ */ import_react7.default.createElement(
      "button",
      {
        type: "button",
        role: "tab",
        "aria-selected": dataSourceTab === "git",
        className: "dsdr-tab" + (dataSourceTab === "git" ? " is-active" : ""),
        onClick: () => setDataSourceTab("git")
      },
      t("datasource.git", "Git \u4ED3\u5E93"),
      /* @__PURE__ */ import_react7.default.createElement("span", { className: "dsdr-tab-count" }, String(settings.git.length))
    ), /* @__PURE__ */ import_react7.default.createElement(
      "button",
      {
        type: "button",
        role: "tab",
        "aria-selected": dataSourceTab === "docs",
        className: "dsdr-tab" + (dataSourceTab === "docs" ? " is-active" : ""),
        onClick: () => setDataSourceTab("docs")
      },
      t("datasource.docs", "\u672C\u5730\u6587\u6863"),
      /* @__PURE__ */ import_react7.default.createElement("span", { className: "dsdr-tab-count" }, String(settings.docs.length))
    )), testError ? /* @__PURE__ */ import_react7.default.createElement("div", { className: "dsdr-error" }, testError) : null, testResults && testResults.length > 0 ? /* @__PURE__ */ import_react7.default.createElement("div", { className: "dsdr-test-results" }, testResults.map((source, index) => /* @__PURE__ */ import_react7.default.createElement("div", { className: "dsdr-row", key: String(index) }, /* @__PURE__ */ import_react7.default.createElement("span", { className: "dsdr-dot " + (source.status || "ok") }), /* @__PURE__ */ import_react7.default.createElement("div", null, /* @__PURE__ */ import_react7.default.createElement("span", { className: "dsdr-source-name" }, source.label || source.location || "\u2014"), /* @__PURE__ */ import_react7.default.createElement("span", { className: "dsdr-source-meta" }, " \xB7 " + (source.status === "error" ? t("status.error", "\u5931\u8D25") : t("test.ok", "\u6B63\u5E38"))), /* @__PURE__ */ import_react7.default.createElement("div", { className: "dsdr-source-meta" }, source.message || ""))))) : null), /* @__PURE__ */ import_react7.default.createElement(
      "section",
      {
        className: "dsdr-card dsdr-datasource-panel",
        style: {
          display: dataSourceTab === "git" ? void 0 : "none"
        }
      },
      /* @__PURE__ */ import_react7.default.createElement("div", { className: "dsdr-card-head" }, /* @__PURE__ */ import_react7.default.createElement("div", null, /* @__PURE__ */ import_react7.default.createElement("div", { className: "dsdr-card-title" }, t("git.title", "Git \u4ED3\u5E93"))), /* @__PURE__ */ import_react7.default.createElement("div", { className: "dsdr-actions" }, /* @__PURE__ */ import_react7.default.createElement(
        "button",
        {
          type: "button",
          className: "dsdr-btn dsdr-btn-with-icon",
          onClick: toggleScan
        },
        /* @__PURE__ */ import_react7.default.createElement(ScanIcon, { size: 14 }),
        /* @__PURE__ */ import_react7.default.createElement("span", null, t("scan.open", "\u626B\u63CF\u76EE\u5F55"))
      ), /* @__PURE__ */ import_react7.default.createElement("button", { type: "button", className: "dsdr-btn", onClick: addGit }, "+ " + t("git.add", "\u6DFB\u52A0\u4ED3\u5E93")))),
      /* @__PURE__ */ import_react7.default.createElement("div", { className: "dsdr-filter-row" }, /* @__PURE__ */ import_react7.default.createElement("label", { className: "dsdr-check" }, /* @__PURE__ */ import_react7.default.createElement(
        "input",
        {
          type: "checkbox",
          checked: settings.mineOnly !== false,
          onChange: async (event) => {
            const nextChecked = event.target.checked;
            if (!nextChecked && settings.mineOnly !== false) {
              const accepted = await confirm({
                title: t("confirm.mineOnly.title", "\u7EDF\u8BA1\u5168\u90E8\u4F5C\u8005\u7684\u63D0\u4EA4\uFF1F"),
                message: t(
                  "confirm.mineOnly.message",
                  "\u53D6\u6D88\u540E\u65E5\u62A5\u4F1A\u5305\u542B\u6240\u6709\u4F5C\u8005\u7684\u63D0\u4EA4\uFF0C\u63D0\u4EA4\u91CF\u53EF\u80FD\u660E\u663E\u589E\u52A0\u3002"
                ),
                confirmLabel: t("confirm.mineOnly.confirm", "\u53D6\u6D88\u52FE\u9009"),
                cancelLabel: t("confirm.cancel", "\u53D6\u6D88")
              });
              if (!accepted) return;
            }
            setSettings((previous) => ({
              ...previous,
              mineOnly: nextChecked
            }));
          }
        }
      ), /* @__PURE__ */ import_react7.default.createElement("span", null, t("git.mine", "\u4EC5\u7EDF\u8BA1\u6211\u7684\u63D0\u4EA4"))), /* @__PURE__ */ import_react7.default.createElement("label", { className: "dsdr-check" }, /* @__PURE__ */ import_react7.default.createElement(
        "input",
        {
          type: "checkbox",
          checked: settings.excludeMerges !== false,
          onChange: (event) => setSettings((previous) => ({
            ...previous,
            excludeMerges: event.target.checked
          }))
        }
      ), /* @__PURE__ */ import_react7.default.createElement("span", null, t("git.excludeMerges", "\u6392\u9664 merge commit"))), settings.mineOnly !== false ? /* @__PURE__ */ import_react7.default.createElement("div", { className: "dsdr-field dsdr-filter-author" }, /* @__PURE__ */ import_react7.default.createElement("label", { className: "dsdr-label", htmlFor: "dsdr-author-emails" }, t("git.authorEmails", "\u4F5C\u8005\u90AE\u7BB1\uFF08\u53EF\u9009\uFF09")), /* @__PURE__ */ import_react7.default.createElement(
        "input",
        {
          id: "dsdr-author-emails",
          className: "dsdr-input",
          value: settings.authorEmails || "",
          placeholder: t(
            "git.authorEmailsHint",
            "\u7559\u7A7A\u81EA\u52A8\u8BFB\u53D6\u5404\u4ED3\u5E93 git config\uFF1B\u591A\u4E2A\u90AE\u7BB1\u7528\u9017\u53F7\u5206\u9694"
          ),
          onChange: (event) => setSettings((previous) => ({
            ...previous,
            authorEmails: event.target.value
          }))
        }
      )) : null),
      showScan ? /* @__PURE__ */ import_react7.default.createElement("div", { className: "dsdr-scan" }, /* @__PURE__ */ import_react7.default.createElement("div", { className: "dsdr-scan-title" }, t("scan.title", "\u4ECE\u76EE\u5F55\u6279\u91CF\u6DFB\u52A0")), /* @__PURE__ */ import_react7.default.createElement("div", { className: "dsdr-card-desc" }, t(
        "scan.desc",
        "\u626B\u63CF\u76EE\u5F55\u4E0B\u6700\u591A 6 \u5C42\u7684 Git \u4ED3\u5E93\uFF0C\u5DF2\u5B58\u5728\u7684\u4F1A\u81EA\u52A8\u8DF3\u8FC7\u3002"
      )), /* @__PURE__ */ import_react7.default.createElement("div", { className: "dsdr-scan-row" }, /* @__PURE__ */ import_react7.default.createElement("div", { className: "dsdr-field" }, /* @__PURE__ */ import_react7.default.createElement("label", { className: "dsdr-label", htmlFor: "dsdr-scan-dir" }, t("scan.placeholder", "\u8981\u626B\u63CF\u7684\u76EE\u5F55\uFF0C\u4F8B\u5982 E:\\sunline\\SBG")), /* @__PURE__ */ import_react7.default.createElement(
        "input",
        {
          id: "dsdr-scan-dir",
          className: "dsdr-input",
          value: scanDir,
          placeholder: t(
            "scan.placeholder",
            "\u8981\u626B\u63CF\u7684\u76EE\u5F55\uFF0C\u4F8B\u5982 E:\\sunline\\SBG"
          ),
          onChange: (event) => setScanDir(event.target.value)
        }
      )), /* @__PURE__ */ import_react7.default.createElement("div", { className: "dsdr-actions" }, /* @__PURE__ */ import_react7.default.createElement(
        "button",
        {
          type: "button",
          className: "dsdr-btn dsdr-btn-primary",
          onClick: scanAndAdd,
          disabled: scanning
        },
        scanning ? t("scan.scanning", "\u6B63\u5728\u626B\u63CF\u2026") : t("scan.scan", "\u626B\u63CF\u5E76\u6DFB\u52A0")
      ), /* @__PURE__ */ import_react7.default.createElement(
        "button",
        {
          type: "button",
          className: "dsdr-btn",
          onClick: pickScanDirectory,
          disabled: scanning
        },
        t("scan.pick", "\u9009\u62E9\u76EE\u5F55")
      ))), scanError ? /* @__PURE__ */ import_react7.default.createElement("div", { className: "dsdr-error" }, scanError) : null, scanMessage ? /* @__PURE__ */ import_react7.default.createElement("div", { className: "dsdr-hint dsdr-ok" }, scanMessage) : null) : null,
      settings.git.length === 0 ? /* @__PURE__ */ import_react7.default.createElement("div", { className: "dsdr-empty" }, t("git.empty", "\u8FD8\u6CA1\u6709 Git \u4ED3\u5E93\u3002")) : settings.git.map((item, index) => /* @__PURE__ */ import_react7.default.createElement("div", { className: "dsdr-source", key: item._key }, /* @__PURE__ */ import_react7.default.createElement("div", { className: "dsdr-field" }, /* @__PURE__ */ import_react7.default.createElement("label", { className: "dsdr-label" }, t("git.location", "\u4ED3\u5E93\u5730\u5740\u6216\u672C\u5730\u8DEF\u5F84")), /* @__PURE__ */ import_react7.default.createElement(
        "input",
        {
          className: "dsdr-input",
          value: item.location,
          placeholder: t(
            "git.placeholder",
            "https://\u2026/repo.git \u6216 D:\\code\\repo"
          ),
          onChange: (event) => updateGit(index, {
            location: event.target.value
          })
        }
      )), /* @__PURE__ */ import_react7.default.createElement("div", { className: "dsdr-field" }, /* @__PURE__ */ import_react7.default.createElement("label", { className: "dsdr-label" }, t("git.branch", "\u5206\u652F")), /* @__PURE__ */ import_react7.default.createElement(
        "input",
        {
          className: "dsdr-input",
          value: item.branch,
          placeholder: "main",
          onChange: (event) => updateGit(index, {
            branch: event.target.value
          })
        }
      )), /* @__PURE__ */ import_react7.default.createElement(
        "button",
        {
          type: "button",
          className: "dsdr-btn dsdr-btn-danger dsdr-icon-btn",
          title: t("remove", "\u79FB\u9664"),
          "aria-label": t("remove", "\u79FB\u9664"),
          onClick: () => removeGit(index)
        },
        "\xD7"
      )))
    ), /* @__PURE__ */ import_react7.default.createElement(
      "section",
      {
        className: "dsdr-card dsdr-datasource-panel",
        style: {
          display: dataSourceTab === "docs" ? void 0 : "none"
        }
      },
      /* @__PURE__ */ import_react7.default.createElement("div", { className: "dsdr-card-head" }, /* @__PURE__ */ import_react7.default.createElement("div", null, /* @__PURE__ */ import_react7.default.createElement("div", { className: "dsdr-card-title" }, t("docs.title", "\u672C\u5730\u6587\u6863"))), /* @__PURE__ */ import_react7.default.createElement("div", { className: "dsdr-actions" }, /* @__PURE__ */ import_react7.default.createElement("button", { type: "button", className: "dsdr-btn", onClick: addDoc }, "+ " + t("docs.add", "\u6DFB\u52A0\u6587\u6863/\u76EE\u5F55")))),
      settings.docs.length === 0 ? /* @__PURE__ */ import_react7.default.createElement("div", { className: "dsdr-empty" }, t("docs.empty", "\u8FD8\u6CA1\u6709\u672C\u5730\u6587\u6863\u3002")) : settings.docs.map((item, index) => /* @__PURE__ */ import_react7.default.createElement("div", { className: "dsdr-source dsdr-source-docs", key: item._key }, /* @__PURE__ */ import_react7.default.createElement("div", { className: "dsdr-field" }, /* @__PURE__ */ import_react7.default.createElement("label", { className: "dsdr-label" }, t("docs.location", "\u6587\u4EF6\u6216\u76EE\u5F55\u8DEF\u5F84")), /* @__PURE__ */ import_react7.default.createElement(
        "input",
        {
          className: "dsdr-input",
          value: item.location,
          placeholder: t("docs.placeholder", "C:\\notes \u6216 ./docs"),
          onChange: (event) => updateDoc(index, {
            location: event.target.value
          })
        }
      )), /* @__PURE__ */ import_react7.default.createElement("div", { className: "dsdr-field" }, /* @__PURE__ */ import_react7.default.createElement("label", { className: "dsdr-label" }, t("docs.label", "\u663E\u793A\u540D\u79F0\uFF08\u53EF\u9009\uFF09")), /* @__PURE__ */ import_react7.default.createElement(
        "input",
        {
          className: "dsdr-input",
          value: item.label,
          placeholder: t("optional", "\u53EF\u9009"),
          onChange: (event) => updateDoc(index, {
            label: event.target.value
          })
        }
      )), /* @__PURE__ */ import_react7.default.createElement(
        "button",
        {
          type: "button",
          className: "dsdr-btn dsdr-btn-danger dsdr-icon-btn",
          title: t("remove", "\u79FB\u9664"),
          "aria-label": t("remove", "\u79FB\u9664"),
          onClick: () => removeDoc(index)
        },
        "\xD7"
      )))
    ));
  }

  // src/client/views/PreviewCard.jsx
  var import_react8 = __toESM(__require("react"), 1);
  function PreviewCard() {
    const {
      preview,
      previewDays,
      allPreviewExpanded,
      exportFormat,
      exporting,
      regenerating,
      expandedPreviewDays,
      manualDate,
      manualText,
      setAllPreviewExpanded,
      exportPreview,
      setPreview,
      setManualDate,
      setManualText,
      addManualItem,
      togglePreviewDay,
      regeneratePreviewDay,
      updatePreviewDay,
      removeManualItem,
      formatShortLabel: formatShortLabel2,
      t
    } = useApp();
    return /* @__PURE__ */ import_react8.default.createElement(Card, { className: "dsdr-preview-card" }, /* @__PURE__ */ import_react8.default.createElement("div", { className: "dsdr-card-head" }, /* @__PURE__ */ import_react8.default.createElement("div", null, /* @__PURE__ */ import_react8.default.createElement("div", { className: "dsdr-title-with-info" }, /* @__PURE__ */ import_react8.default.createElement("div", { className: "dsdr-card-title" }, t("preview.title", "\u751F\u6210\u7ED3\u679C\u9884\u89C8")), /* @__PURE__ */ import_react8.default.createElement(
      InfoDot,
      {
        text: t(
          "preview.desc",
          "\u5148\u68C0\u67E5\u5E76\u7F16\u8F91\u6BCF\u65E5 AI \u6458\u8981\u3001\u8865\u5145\u975E\u4EE3\u7801\u5DE5\u4F5C\uFF0C\u518D\u5BFC\u51FA XLSX\u3002"
        )
      }
    ))), /* @__PURE__ */ import_react8.default.createElement("div", { className: "dsdr-actions" }, /* @__PURE__ */ import_react8.default.createElement(
      "button",
      {
        type: "button",
        className: "dsdr-btn",
        onClick: () => setAllPreviewExpanded(!allPreviewExpanded),
        disabled: previewDays.length === 0 || exporting
      },
      allPreviewExpanded ? t("preview.collapseAll", "\u5168\u90E8\u6536\u8D77") : t("preview.expandAll", "\u5168\u90E8\u5C55\u5F00")
    ), /* @__PURE__ */ import_react8.default.createElement(
      "button",
      {
        type: "button",
        className: "dsdr-btn dsdr-btn-primary",
        onClick: exportPreview,
        disabled: exporting || regenerating.length > 0
      },
      exporting ? t("preview.exporting", "\u6B63\u5728\u5BFC\u51FA\u2026") : t("preview.export", "\u5BFC\u51FA") + " " + formatShortLabel2(exportFormat)
    ))), preview.ai && preview.ai.ok ? /* @__PURE__ */ import_react8.default.createElement("div", { className: "dsdr-preview-overall" }, /* @__PURE__ */ import_react8.default.createElement("label", { className: "dsdr-label", htmlFor: "dsdr-preview-overall" }, t("preview.overall", "\u603B\u4F53 AI \u603B\u7ED3")), /* @__PURE__ */ import_react8.default.createElement(
      "textarea",
      {
        id: "dsdr-preview-overall",
        className: "dsdr-textarea",
        value: preview.ai.overall || "",
        onChange: (event) => setPreview(
          (previous) => previous ? {
            ...previous,
            ai: {
              ...previous.ai,
              overall: event.target.value
            }
          } : previous
        )
      }
    )) : preview.ai ? /* @__PURE__ */ import_react8.default.createElement("div", { className: "dsdr-error" }, preview.ai.error || t("preview.aiFailed", "AI \u5206\u6790\u672A\u5B8C\u6210\uFF0C\u4ECD\u53EF\u8865\u5145\u624B\u52A8\u5DE5\u4F5C\u9879\u540E\u5BFC\u51FA\u3002")) : null, /* @__PURE__ */ import_react8.default.createElement("div", { className: "dsdr-manual-add" }, /* @__PURE__ */ import_react8.default.createElement(
      "input",
      {
        type: "date",
        className: "dsdr-input",
        value: manualDate,
        min: preview.range.start,
        max: preview.range.end,
        onChange: (event) => setManualDate(event.target.value)
      }
    ), /* @__PURE__ */ import_react8.default.createElement(
      "input",
      {
        className: "dsdr-input",
        value: manualText,
        placeholder: t(
          "preview.manualPlaceholder",
          "\u4F8B\u5982\uFF1A\u53C2\u52A0\u9700\u6C42\u8BC4\u5BA1\u3001\u5904\u7406\u7EBF\u4E0A\u95EE\u9898"
        ),
        onChange: (event) => setManualText(event.target.value),
        onKeyDown: (event) => {
          if (event.key === "Enter") addManualItem();
        }
      }
    ), /* @__PURE__ */ import_react8.default.createElement(
      "button",
      {
        type: "button",
        className: "dsdr-btn",
        onClick: addManualItem,
        disabled: manualText.trim().length === 0
      },
      t("preview.addManual", "\u6DFB\u52A0\u624B\u52A8\u5DE5\u4F5C\u9879")
    )), previewDays.length === 0 ? /* @__PURE__ */ import_react8.default.createElement("div", { className: "dsdr-empty" }, t("preview.noDays", "\u6CA1\u6709\u53EF\u9884\u89C8\u7684\u65E5\u62A5\u5185\u5BB9\u3002")) : /* @__PURE__ */ import_react8.default.createElement("div", { className: "dsdr-preview-list" }, previewDays.map((day) => {
      const expanded = expandedPreviewDays[day.date] === true;
      return /* @__PURE__ */ import_react8.default.createElement(
        "div",
        {
          className: "dsdr-preview-day" + (expanded ? " is-expanded" : ""),
          key: day.date
        },
        /* @__PURE__ */ import_react8.default.createElement("div", { className: "dsdr-preview-day-head" }, /* @__PURE__ */ import_react8.default.createElement(
          "button",
          {
            type: "button",
            className: "dsdr-preview-toggle",
            "aria-expanded": expanded,
            onClick: () => togglePreviewDay(day.date)
          },
          /* @__PURE__ */ import_react8.default.createElement("span", { className: "dsdr-preview-chevron" }, expanded ? "\u25BE" : "\u25B8"),
          /* @__PURE__ */ import_react8.default.createElement("span", { className: "dsdr-preview-date" }, day.date),
          /* @__PURE__ */ import_react8.default.createElement("span", { className: "dsdr-hint" }, " \xB7 " + day.weekday + " \xB7 " + day.commitCount + " commits \xB7 " + day.docCount + " docs"),
          day.manualItems && day.manualItems.length > 0 ? /* @__PURE__ */ import_react8.default.createElement("span", { className: "dsdr-preview-badge" }, day.manualItems.length + " " + t("preview.manual", "\u624B\u52A8\u8865\u5145")) : null
        ), preview.ai && preview.ai.ok ? /* @__PURE__ */ import_react8.default.createElement(
          "button",
          {
            type: "button",
            className: "dsdr-btn",
            onClick: () => regeneratePreviewDay(day.date),
            disabled: regenerating.length > 0 || exporting
          },
          regenerating === day.date ? t("preview.regenerating", "\u5206\u6790\u4E2D\u2026") : t("preview.regenerateDay", "\u91CD\u65B0\u5206\u6790\u8FD9\u5929")
        ) : null),
        expanded ? /* @__PURE__ */ import_react8.default.createElement("div", { className: "dsdr-preview-body" }, /* @__PURE__ */ import_react8.default.createElement("div", { className: "dsdr-preview-raw" }, t("preview.raw", "\u539F\u59CB\u6C47\u603B") + "\uFF1A" + day.summary), preview.ai && preview.ai.ok ? /* @__PURE__ */ import_react8.default.createElement(
          "textarea",
          {
            className: "dsdr-textarea",
            value: day.aiSummary || "",
            placeholder: t(
              "preview.aiSummary",
              "AI \u6458\u8981\uFF08\u53EF\u7F16\u8F91\uFF09"
            ),
            onChange: (event) => updatePreviewDay(day.date, {
              aiSummary: event.target.value
            })
          }
        ) : null, day.aiHighlights && day.aiHighlights.length > 0 ? /* @__PURE__ */ import_react8.default.createElement("div", { className: "dsdr-hint" }, "\u2022 " + day.aiHighlights.join("\uFF1B")) : null, day.manualItems && day.manualItems.length > 0 ? /* @__PURE__ */ import_react8.default.createElement("div", { className: "dsdr-manual-list" }, day.manualItems.map((text, index) => /* @__PURE__ */ import_react8.default.createElement(
          "span",
          {
            className: "dsdr-manual-chip",
            key: String(index)
          },
          text,
          /* @__PURE__ */ import_react8.default.createElement(
            "button",
            {
              type: "button",
              className: "dsdr-manual-remove",
              "aria-label": t("remove", "\u79FB\u9664"),
              onClick: () => removeManualItem(day.date, index)
            },
            "\xD7"
          )
        ))) : null) : null
      );
    })));
  }

  // src/client/views/RangeCard.jsx
  var import_react9 = __toESM(__require("react"), 1);
  function RangeCard() {
    const { range, setRange, rangeDays, t } = useApp();
    return /* @__PURE__ */ import_react9.default.createElement(Card, null, /* @__PURE__ */ import_react9.default.createElement("div", { className: "dsdr-card-head" }, /* @__PURE__ */ import_react9.default.createElement("div", null, /* @__PURE__ */ import_react9.default.createElement("div", { className: "dsdr-card-title" }, t("range.title", "\u6C47\u603B\u65F6\u95F4\u8303\u56F4"))), /* @__PURE__ */ import_react9.default.createElement("div", { className: "dsdr-hint" }, rangeDays > 0 ? t("range.total", "\u5171") + " " + rangeDays + " " + t("range.days", "\u5929") : "")), /* @__PURE__ */ import_react9.default.createElement("div", { className: "dsdr-range" }, /* @__PURE__ */ import_react9.default.createElement("div", { className: "dsdr-field" }, /* @__PURE__ */ import_react9.default.createElement("label", { className: "dsdr-label", htmlFor: "dsdr-start" }, t("range.start", "\u5F00\u59CB\u65E5\u671F")), /* @__PURE__ */ import_react9.default.createElement(
      "input",
      {
        id: "dsdr-start",
        className: "dsdr-input",
        type: "date",
        value: range.start,
        onChange: (event) => setRange((previous) => ({
          ...previous,
          start: event.target.value
        }))
      }
    )), /* @__PURE__ */ import_react9.default.createElement("div", { className: "dsdr-field" }, /* @__PURE__ */ import_react9.default.createElement("label", { className: "dsdr-label", htmlFor: "dsdr-end" }, t("range.end", "\u7ED3\u675F\u65E5\u671F")), /* @__PURE__ */ import_react9.default.createElement(
      "input",
      {
        id: "dsdr-end",
        className: "dsdr-input",
        type: "date",
        value: range.end,
        onChange: (event) => setRange((previous) => ({
          ...previous,
          end: event.target.value
        }))
      }
    )), /* @__PURE__ */ import_react9.default.createElement("div", { className: "dsdr-actions" }, /* @__PURE__ */ import_react9.default.createElement(
      "button",
      {
        type: "button",
        className: "dsdr-btn",
        onClick: () => setRange(yesterdayRange())
      },
      t("range.yesterday", "\u6628\u5929")
    ), /* @__PURE__ */ import_react9.default.createElement(
      "button",
      {
        type: "button",
        className: "dsdr-btn",
        onClick: () => setRange(thisWeekRange())
      },
      t("range.thisWeek", "\u672C\u5468")
    ), /* @__PURE__ */ import_react9.default.createElement(
      "button",
      {
        type: "button",
        className: "dsdr-btn",
        onClick: () => setRange(currentMonthRange())
      },
      t("range.thisMonth", "\u672C\u6708")
    ), /* @__PURE__ */ import_react9.default.createElement(
      "button",
      {
        type: "button",
        className: "dsdr-btn",
        onClick: () => setRange(lastMonthRange())
      },
      t("range.lastMonth", "\u4E0A\u6708")
    ), /* @__PURE__ */ import_react9.default.createElement(
      "button",
      {
        type: "button",
        className: "dsdr-btn",
        onClick: () => setRange(last7Range())
      },
      t("range.last7", "\u6700\u8FD1 7 \u5929")
    ))));
  }

  // src/client/views/ScheduleCard.jsx
  var import_react11 = __toESM(__require("react"), 1);

  // src/client/components/Button.jsx
  var import_react10 = __toESM(__require("react"), 1);
  function Button({
    variant = "default",
    icon = null,
    className = "",
    children,
    ...props
  }) {
    const classes = [
      "dsdr-btn",
      variant === "primary" ? "dsdr-btn-primary" : "",
      variant === "danger" ? "dsdr-btn-danger" : "",
      icon ? "dsdr-btn-with-icon" : "",
      className
    ].filter(Boolean).join(" ");
    return /* @__PURE__ */ import_react10.default.createElement("button", { type: "button", className: classes, ...props }, icon, children);
  }

  // src/client/views/ScheduleCard.jsx
  function ScheduleCard() {
    const {
      settings,
      setSettings,
      scheduleStatus,
      scheduleLoading,
      scheduleError,
      loadScheduleStatus,
      runScheduleNow,
      t,
      confirm = async () => true
    } = useApp();
    return /* @__PURE__ */ import_react11.default.createElement(Card, null, /* @__PURE__ */ import_react11.default.createElement("div", { className: "dsdr-card-head" }, /* @__PURE__ */ import_react11.default.createElement("div", null, /* @__PURE__ */ import_react11.default.createElement("div", { className: "dsdr-card-title" }, t("schedule.title", "\u5B9A\u65F6\u6C47\u603B"))), /* @__PURE__ */ import_react11.default.createElement(
      Switch,
      {
        checked: settings.scheduleEnabled === true,
        label: t("schedule.enable", "\u542F\u7528\u81EA\u52A8\u751F\u6210"),
        onChange: async (event) => {
          const nextChecked = event.target.checked;
          if (nextChecked && settings.scheduleEnabled !== true) {
            const accepted = await confirm({
              title: t("confirm.enableSchedule.title", "\u542F\u7528\u5B9A\u65F6\u81EA\u52A8\u751F\u6210\uFF1F"),
              message: t(
                "confirm.enableSchedule.message",
                "\u542F\u7528\u540E\u5C06\u5728\u8BBE\u5B9A\u65F6\u95F4\u81EA\u52A8\u751F\u6210\u5E76\u4FDD\u5B58\u65E5\u62A5\uFF0C\u53EF\u80FD\u8986\u76D6\u5386\u53F2\u76EE\u5F55\u4E2D\u7684\u540C\u540D\u6587\u4EF6\u3002"
              ),
              confirmLabel: t("confirm.enable", "\u542F\u7528"),
              cancelLabel: t("confirm.cancel", "\u53D6\u6D88")
            });
            if (!accepted) return;
          }
          setSettings((previous) => ({
            ...previous,
            scheduleEnabled: nextChecked
          }));
        }
      }
    )), /* @__PURE__ */ import_react11.default.createElement("div", { className: "dsdr-ai-options" }, /* @__PURE__ */ import_react11.default.createElement("div", { className: "dsdr-field" }, /* @__PURE__ */ import_react11.default.createElement("label", { className: "dsdr-label", htmlFor: "dsdr-schedule-frequency" }, t("schedule.frequency", "\u9891\u7387")), /* @__PURE__ */ import_react11.default.createElement(
      "select",
      {
        id: "dsdr-schedule-frequency",
        className: "dsdr-input",
        value: settings.scheduleFrequency || "daily",
        onChange: (event) => setSettings((previous) => ({
          ...previous,
          scheduleFrequency: event.target.value
        }))
      },
      /* @__PURE__ */ import_react11.default.createElement("option", { value: "daily" }, t("schedule.daily", "\u6BCF\u5929")),
      /* @__PURE__ */ import_react11.default.createElement("option", { value: "weekly" }, t("schedule.weekly", "\u6BCF\u5468\u4E00"))
    )), /* @__PURE__ */ import_react11.default.createElement("div", { className: "dsdr-field" }, /* @__PURE__ */ import_react11.default.createElement("label", { className: "dsdr-label", htmlFor: "dsdr-schedule-time" }, t("schedule.time", "\u751F\u6210\u65F6\u95F4")), /* @__PURE__ */ import_react11.default.createElement(
      "input",
      {
        id: "dsdr-schedule-time",
        className: "dsdr-input",
        type: "time",
        value: settings.scheduleTime || "18:30",
        onChange: (event) => setSettings((previous) => ({
          ...previous,
          scheduleTime: event.target.value
        }))
      }
    ))), /* @__PURE__ */ import_react11.default.createElement("div", { className: "dsdr-hint" }, t("schedule.hint", "\u5B9A\u65F6\u6C47\u603B\u4F7F\u7528\u5F53\u524D\u4FDD\u5B58\u7684\u6570\u636E\u6E90\u3001AI \u8BBE\u7F6E\u548C\u683C\u5F0F\u3002")), /* @__PURE__ */ import_react11.default.createElement("div", { className: "dsdr-schedule-status" }, /* @__PURE__ */ import_react11.default.createElement("div", { className: "dsdr-schedule-status-head" }, /* @__PURE__ */ import_react11.default.createElement("div", { className: "dsdr-hint" }, scheduleStatus && scheduleStatus.running ? t("schedule.inProgress", "\u5B9A\u65F6\u6C47\u603B\u8FDB\u884C\u4E2D\u2026") : scheduleStatus && scheduleStatus.state && scheduleStatus.state.lastAt ? t("schedule.last", "\u4E0A\u6B21\u751F\u6210\uFF1A") + scheduleStatus.state.lastAt : t("schedule.none", "\u5C1A\u672A\u751F\u6210")), /* @__PURE__ */ import_react11.default.createElement("div", { className: "dsdr-actions" }, /* @__PURE__ */ import_react11.default.createElement(
      Button,
      {
        icon: /* @__PURE__ */ import_react11.default.createElement(RefreshIcon, { size: 14 }),
        onClick: loadScheduleStatus
      },
      /* @__PURE__ */ import_react11.default.createElement("span", null, t("schedule.refresh", "\u5237\u65B0\u72B6\u6001"))
    ), /* @__PURE__ */ import_react11.default.createElement(
      Button,
      {
        variant: "primary",
        icon: /* @__PURE__ */ import_react11.default.createElement(PlayIcon, { size: 14 }),
        onClick: runScheduleNow,
        disabled: scheduleLoading || scheduleStatus && scheduleStatus.running
      },
      /* @__PURE__ */ import_react11.default.createElement("span", null, scheduleLoading ? t("schedule.running", "\u6B63\u5728\u751F\u6210\u2026") : t("schedule.runNow", "\u7ACB\u5373\u8FD0\u884C\u4E00\u6B21"))
    ))), scheduleError ? /* @__PURE__ */ import_react11.default.createElement("div", { className: "dsdr-error" }, scheduleError) : null, scheduleStatus && scheduleStatus.state && scheduleStatus.state.lastStatus === "error" && scheduleStatus.state.lastError ? /* @__PURE__ */ import_react11.default.createElement("div", { className: "dsdr-error" }, scheduleStatus.state.lastError) : null, scheduleStatus && scheduleStatus.pending > 0 ? /* @__PURE__ */ import_react11.default.createElement("div", { className: "dsdr-hint" }, t("schedule.pending", "\u6709 {count} \u6B21\u9057\u6F0F\u7684\u5B9A\u65F6\u6C47\u603B\uFF0C\u542F\u52A8\u540E\u4F1A\u8865\u8DD1\u3002").replace(
      "{count}",
      String(scheduleStatus.pending)
    )) : null, scheduleStatus && scheduleStatus.state && scheduleStatus.state.lastCatchUp && scheduleStatus.state.lastCatchUp.runs > 1 ? /* @__PURE__ */ import_react11.default.createElement("div", { className: "dsdr-hint" }, t("schedule.catchUp", "\u5DF2\u4E8E {at} \u8865\u8DD1 {count} \u6B21\u5B9A\u65F6\u6C47\u603B\u3002").replace("{at}", scheduleStatus.state.lastCatchUp.at).replace("{count}", String(scheduleStatus.state.lastCatchUp.runs))) : null, scheduleStatus && scheduleStatus.enabled && scheduleStatus.nextRunAt ? /* @__PURE__ */ import_react11.default.createElement("div", { className: "dsdr-hint" }, t("schedule.next", "\u4E0B\u6B21\u8FD0\u884C\uFF1A") + scheduleStatus.nextRunAt) : null, scheduleStatus && scheduleStatus.state && scheduleStatus.state.lastFile ? /* @__PURE__ */ import_react11.default.createElement("div", { className: "dsdr-hint" }, /* @__PURE__ */ import_react11.default.createElement(
      "a",
      {
        className: "dsdr-history-link",
        href: API + "/schedule/file?name=" + encodeURIComponent(scheduleStatus.state.lastFile),
        download: scheduleStatus.state.lastFile
      },
      scheduleStatus.state.lastFile
    )) : null, /* @__PURE__ */ import_react11.default.createElement("div", { className: "dsdr-hint" }, t("schedule.history", "\u5386\u53F2\u6587\u4EF6")), scheduleStatus && scheduleStatus.directory ? /* @__PURE__ */ import_react11.default.createElement("div", { className: "dsdr-hint dsdr-code" }, t("schedule.directory", "\u5386\u53F2\u76EE\u5F55\uFF1A") + scheduleStatus.directory) : null, scheduleStatus && scheduleStatus.history && scheduleStatus.history.length > 0 ? /* @__PURE__ */ import_react11.default.createElement("div", { className: "dsdr-history-list" }, scheduleStatus.history.slice(0, 8).map((file) => /* @__PURE__ */ import_react11.default.createElement(
      "a",
      {
        key: file.name,
        className: "dsdr-history-link",
        href: API + "/schedule/file?name=" + encodeURIComponent(file.name),
        download: file.name
      },
      file.name
    ))) : /* @__PURE__ */ import_react11.default.createElement("div", { className: "dsdr-hint" }, t("schedule.noHistory", "\u6682\u65E0\u5386\u53F2\u6587\u4EF6"))));
  }

  // src/client/views/DailyReportPage.jsx
  function DailyReportPage() {
    const {
      loading,
      loadError,
      error,
      result,
      showToast,
      saveText,
      saveState,
      saveSettingsNow,
      exportSettings,
      importSettingsFile,
      clearCache,
      resetAllSettings,
      formatMenuOpen,
      setFormatMenuOpen,
      settingsMenuOpen,
      setSettingsMenuOpen,
      formatMenuRef,
      settingsMenuRef,
      settingsFileRef,
      settings,
      setSettings,
      range,
      setRange,
      rangeDays,
      exportFormat,
      setExportFormat,
      useAi,
      setUseAi,
      aiInfo,
      preview,
      setPreview,
      previewDays,
      allPreviewExpanded,
      exporting,
      regenerating,
      expandedPreviewDays,
      manualDate,
      manualText,
      setAllPreviewExpanded,
      exportPreview,
      setManualDate,
      setManualText,
      addManualItem,
      togglePreviewDay,
      regeneratePreviewDay,
      updatePreviewDay,
      removeManualItem,
      formatShortLabel: formatShortLabel2,
      scheduleStatus,
      scheduleLoading,
      scheduleError,
      loadScheduleStatus,
      runScheduleNow,
      showScan,
      scanDir,
      setScanDir,
      scanAndAdd,
      scanning,
      scanError,
      scanMessage,
      pickScanDirectory,
      toggleScan,
      testSources,
      testingSources,
      testError,
      testResults,
      dataSourceTab,
      setDataSourceTab,
      updateGit,
      removeGit,
      addGit,
      updateDoc,
      removeDoc,
      addDoc,
      localeIsEnglish,
      generating,
      progress,
      generate,
      cancelGeneration,
      t
    } = useApp();
    if (loading) {
      return /* @__PURE__ */ import_react12.default.createElement("div", { className: "dsdr-root" }, /* @__PURE__ */ import_react12.default.createElement("div", { className: "dsdr-page" }, /* @__PURE__ */ import_react12.default.createElement("div", { className: "dsdr-card dsdr-hint" }, t("loading", "\u6B63\u5728\u8BFB\u53D6\u914D\u7F6E\u2026"))));
    }
    return /* @__PURE__ */ import_react12.default.createElement("div", { className: "dsdr-root" }, /* @__PURE__ */ import_react12.default.createElement("div", { className: "dsdr-page" }, /* @__PURE__ */ import_react12.default.createElement("div", { className: "dsdr-hero" }, /* @__PURE__ */ import_react12.default.createElement("div", { className: "dsdr-mark" }, /* @__PURE__ */ import_react12.default.createElement(Icon, null)), /* @__PURE__ */ import_react12.default.createElement("div", { className: "dsdr-hero-copy" }, /* @__PURE__ */ import_react12.default.createElement("h1", { className: "dsdr-title" }, t("page.title", "\u65E5\u62A5\u6C47\u603B")), /* @__PURE__ */ import_react12.default.createElement("p", { className: "dsdr-sub" }, t(
      "page.desc",
      "\u6309\u5929\u6C47\u603B Git \u63D0\u4EA4\u4E0E\u672C\u5730\u6587\u6863\uFF0C\u5BFC\u51FA\u53EF\u76F4\u63A5\u67E5\u770B\u7684 XLSX \u65E5\u62A5\u3002"
    ))), /* @__PURE__ */ import_react12.default.createElement("div", { className: "dsdr-hero-action" }, /* @__PURE__ */ import_react12.default.createElement("div", { className: "dsdr-hero-buttons" }, /* @__PURE__ */ import_react12.default.createElement("div", { className: "dsdr-split dsdr-save-split", ref: settingsMenuRef }, /* @__PURE__ */ import_react12.default.createElement(
      "button",
      {
        type: "button",
        className: "dsdr-btn dsdr-save-btn dsdr-btn-with-icon",
        onClick: saveSettingsNow,
        disabled: saveState === "saving"
      },
      /* @__PURE__ */ import_react12.default.createElement(SaveIcon, { size: 15 }),
      /* @__PURE__ */ import_react12.default.createElement("span", null, saveState === "saving" ? t("save.savingShort", "\u6B63\u5728\u4FDD\u5B58\u2026") : t("save.button", "\u4FDD\u5B58\u8BBE\u7F6E"))
    ), /* @__PURE__ */ import_react12.default.createElement(
      "button",
      {
        type: "button",
        className: "dsdr-btn dsdr-save-btn dsdr-split-toggle",
        onClick: () => setSettingsMenuOpen((open) => !open),
        disabled: saveState === "saving",
        "aria-haspopup": "menu",
        "aria-expanded": settingsMenuOpen,
        "aria-label": t("settings.menu", "\u8BBE\u7F6E\u64CD\u4F5C")
      },
      /* @__PURE__ */ import_react12.default.createElement(ChevronIcon, { size: 12 })
    ), settingsMenuOpen ? /* @__PURE__ */ import_react12.default.createElement("div", { className: "dsdr-menu", role: "menu" }, /* @__PURE__ */ import_react12.default.createElement("div", { className: "dsdr-menu-title" }, t("settings.menu", "\u8BBE\u7F6E\u64CD\u4F5C")), /* @__PURE__ */ import_react12.default.createElement(
      "button",
      {
        type: "button",
        role: "menuitem",
        className: "dsdr-menu-item dsdr-menu-item-start",
        onClick: exportSettings
      },
      /* @__PURE__ */ import_react12.default.createElement(DownloadIcon, { size: 14 }),
      /* @__PURE__ */ import_react12.default.createElement("span", null, t("settings.export", "\u5BFC\u51FA\u8BBE\u7F6E"))
    ), /* @__PURE__ */ import_react12.default.createElement(
      "button",
      {
        type: "button",
        role: "menuitem",
        className: "dsdr-menu-item dsdr-menu-item-start",
        onClick: () => {
          if (settingsFileRef.current)
            settingsFileRef.current.click();
        }
      },
      /* @__PURE__ */ import_react12.default.createElement(UploadIcon, { size: 14 }),
      /* @__PURE__ */ import_react12.default.createElement("span", null, t("settings.import", "\u5BFC\u5165\u8BBE\u7F6E"))
    ), /* @__PURE__ */ import_react12.default.createElement("div", { className: "dsdr-menu-sep", role: "separator" }), /* @__PURE__ */ import_react12.default.createElement(
      "button",
      {
        type: "button",
        role: "menuitem",
        className: "dsdr-menu-item dsdr-menu-item-start",
        onClick: clearCache
      },
      /* @__PURE__ */ import_react12.default.createElement(TrashIcon, { size: 14 }),
      /* @__PURE__ */ import_react12.default.createElement("span", null, t("settings.clearCache", "\u6E05\u9664\u7F13\u5B58"))
    ), /* @__PURE__ */ import_react12.default.createElement(
      "button",
      {
        type: "button",
        role: "menuitem",
        className: "dsdr-menu-item dsdr-menu-item-start dsdr-menu-item-danger",
        onClick: resetAllSettings
      },
      /* @__PURE__ */ import_react12.default.createElement(ResetIcon, { size: 14 }),
      /* @__PURE__ */ import_react12.default.createElement("span", null, t("settings.reset", "\u8FD8\u539F\u9ED8\u8BA4\u914D\u7F6E"))
    )) : null), /* @__PURE__ */ import_react12.default.createElement(
      "input",
      {
        ref: settingsFileRef,
        type: "file",
        accept: ".json,application/json",
        style: {
          display: "none"
        },
        onChange: importSettingsFile
      }
    ), /* @__PURE__ */ import_react12.default.createElement("div", { className: "dsdr-split", ref: formatMenuRef }, /* @__PURE__ */ import_react12.default.createElement(
      "button",
      {
        type: "button",
        className: "dsdr-btn dsdr-btn-primary dsdr-generate dsdr-btn-with-icon",
        onClick: () => generate(),
        disabled: generating
      },
      /* @__PURE__ */ import_react12.default.createElement(GenerateIcon, { size: 15 }),
      /* @__PURE__ */ import_react12.default.createElement("span", null, generating ? t("generating", "\u6B63\u5728\u6536\u96C6\u5E76\u751F\u6210\u2026") : t("generate", "\u751F\u6210\u65E5\u62A5"))
    ), /* @__PURE__ */ import_react12.default.createElement(
      "button",
      {
        type: "button",
        className: "dsdr-btn dsdr-btn-primary dsdr-split-toggle",
        onClick: () => setFormatMenuOpen((open) => !open),
        disabled: generating,
        "aria-haspopup": "menu",
        "aria-expanded": formatMenuOpen,
        "aria-label": t("format.label", "\u683C\u5F0F")
      },
      /* @__PURE__ */ import_react12.default.createElement(ChevronIcon, { size: 12 })
    ), formatMenuOpen ? /* @__PURE__ */ import_react12.default.createElement("div", { className: "dsdr-menu", role: "menu" }, /* @__PURE__ */ import_react12.default.createElement("div", { className: "dsdr-menu-title" }, t("format.label", "\u683C\u5F0F")), FORMAT_OPTIONS.map((format) => /* @__PURE__ */ import_react12.default.createElement(
      "button",
      {
        type: "button",
        role: "menuitemradio",
        "aria-checked": exportFormat === format,
        className: "dsdr-menu-item" + (exportFormat === format ? " is-active" : ""),
        key: format,
        onClick: () => {
          setExportFormat(format);
          setFormatMenuOpen(false);
          generate(format);
        }
      },
      /* @__PURE__ */ import_react12.default.createElement("span", null, formatLabel(format, t)),
      /* @__PURE__ */ import_react12.default.createElement("span", { className: "dsdr-menu-check" }, exportFormat === format ? "\u2713" : "")
    ))) : null)), saveText ? /* @__PURE__ */ import_react12.default.createElement("div", { className: "dsdr-save" }, saveText) : null)), generating ? /* @__PURE__ */ import_react12.default.createElement(
      "section",
      {
        className: "dsdr-card dsdr-progress-card",
        role: "status",
        "aria-live": "polite"
      },
      /* @__PURE__ */ import_react12.default.createElement("div", { className: "dsdr-progress-head" }, /* @__PURE__ */ import_react12.default.createElement("span", null, progress && progress.message || t("generating", "\u6B63\u5728\u6536\u96C6\u5E76\u751F\u6210\u2026")), /* @__PURE__ */ import_react12.default.createElement("div", { className: "dsdr-actions" }, /* @__PURE__ */ import_react12.default.createElement("span", { className: "dsdr-progress-value" }, progress && !progress.indeterminate ? Math.round(Number(progress.percent) || 0) + "%" : "\u2026"), /* @__PURE__ */ import_react12.default.createElement(
        "button",
        {
          type: "button",
          className: "dsdr-btn",
          onClick: cancelGeneration
        },
        t("cancel", "\u53D6\u6D88")
      ))),
      /* @__PURE__ */ import_react12.default.createElement(
        "div",
        {
          className: "dsdr-progress-track" + (progress && progress.indeterminate ? " is-indeterminate" : "")
        },
        /* @__PURE__ */ import_react12.default.createElement(
          "div",
          {
            className: "dsdr-progress-fill",
            style: {
              width: progress && progress.indeterminate ? "35%" : Math.max(
                2,
                Math.min(
                  100,
                  Number(progress && progress.percent) || 0
                )
              ) + "%"
            }
          }
        )
      ),
      /* @__PURE__ */ import_react12.default.createElement("div", { className: "dsdr-hint" }, t(
        "progress.hint",
        "AI \u5206\u6790\u9700\u8981\u8C03\u7528\u6A21\u578B\uFF0C\u8017\u65F6\u901A\u5E38\u6BD4\u666E\u901A\u6C47\u603B\u66F4\u957F\uFF1B\u8BF7\u4FDD\u6301\u9875\u9762\u6253\u5F00\u3002"
      ))
    ) : null, loadError ? /* @__PURE__ */ import_react12.default.createElement("div", { className: "dsdr-error" }, loadError) : null, error ? /* @__PURE__ */ import_react12.default.createElement("div", { className: "dsdr-error dsdr-error-row", role: "alert" }, /* @__PURE__ */ import_react12.default.createElement("span", null, error), /* @__PURE__ */ import_react12.default.createElement(
      "button",
      {
        type: "button",
        className: "dsdr-btn",
        onClick: () => generate()
      },
      t("retry", "\u91CD\u8BD5")
    )) : null, preview ? /* @__PURE__ */ import_react12.default.createElement(PreviewCard, null) : null, /* @__PURE__ */ import_react12.default.createElement(RangeCard, null), /* @__PURE__ */ import_react12.default.createElement(AiCard, null), /* @__PURE__ */ import_react12.default.createElement(ScheduleCard, null), /* @__PURE__ */ import_react12.default.createElement(DataSourceCard, null), /* @__PURE__ */ import_react12.default.createElement("div", { className: "dsdr-footer" }, t(
      "footer.tip",
      "Git \u4F7F\u7528\u7CFB\u7EDF git \u4E0E\u4F60\u7684\u51ED\u636E\u914D\u7F6E\uFF1B\u8FDC\u7A0B\u4ED3\u5E93\u4F1A\u7F13\u5B58\u5728 DSH \u6570\u636E\u76EE\u5F55\u3002"
    )), result ? /* @__PURE__ */ import_react12.default.createElement("section", { className: "dsdr-card" }, /* @__PURE__ */ import_react12.default.createElement("div", { className: "dsdr-card-head" }, /* @__PURE__ */ import_react12.default.createElement("div", null, /* @__PURE__ */ import_react12.default.createElement("div", { className: "dsdr-card-title" }, t("result.title", "\u751F\u6210\u7ED3\u679C")), /* @__PURE__ */ import_react12.default.createElement("div", { className: "dsdr-card-desc" }, result.filename || "")), /* @__PURE__ */ import_react12.default.createElement(
      "button",
      {
        type: "button",
        className: "dsdr-btn dsdr-btn-primary",
        onClick: () => {
          triggerDownload(result.url, result.filename);
          if (typeof showToast === "function") {
            showToast(
              t("toast.exported", "\u5DF2\u5BFC\u51FA\uFF1A") + (result.filename || "")
            );
          }
        }
      },
      t("result.download", "\u4E0B\u8F7D XLSX")
    )), /* @__PURE__ */ import_react12.default.createElement("div", { className: "dsdr-stats" }, /* @__PURE__ */ import_react12.default.createElement("div", { className: "dsdr-stat" }, /* @__PURE__ */ import_react12.default.createElement("div", { className: "dsdr-stat-value" }, String(result.stats && result.stats.commits || 0)), /* @__PURE__ */ import_react12.default.createElement("div", { className: "dsdr-stat-label" }, t("result.stats.commits", "Git \u63D0\u4EA4"))), /* @__PURE__ */ import_react12.default.createElement("div", { className: "dsdr-stat" }, /* @__PURE__ */ import_react12.default.createElement("div", { className: "dsdr-stat-value" }, String(result.stats && result.stats.docs || 0)), /* @__PURE__ */ import_react12.default.createElement("div", { className: "dsdr-stat-label" }, t("result.stats.docs", "\u6587\u6863"))), /* @__PURE__ */ import_react12.default.createElement("div", { className: "dsdr-stat" }, /* @__PURE__ */ import_react12.default.createElement("div", { className: "dsdr-stat-value" }, String(result.stats && result.stats.activeDays || 0)), /* @__PURE__ */ import_react12.default.createElement("div", { className: "dsdr-stat-label" }, t("result.stats.activeDays", "\u6709\u8BB0\u5F55\u5929\u6570"))), /* @__PURE__ */ import_react12.default.createElement("div", { className: "dsdr-stat" }, /* @__PURE__ */ import_react12.default.createElement("div", { className: "dsdr-stat-value" }, String(result.stats && result.stats.sources || 0)), /* @__PURE__ */ import_react12.default.createElement("div", { className: "dsdr-stat-label" }, t("result.stats.sources", "\u6570\u636E\u6E90")))), result.ai ? /* @__PURE__ */ import_react12.default.createElement("div", { className: "dsdr-ai-result" }, /* @__PURE__ */ import_react12.default.createElement("div", { className: "dsdr-hint" }, t("result.ai.title", "AI \u5206\u6790") + (result.ai.provider ? " \xB7 " + result.ai.provider + "/" + result.ai.model : "") + (result.ai.cachedDays > 0 ? " \xB7 " + (localeIsEnglish ? "cache " : "\u7F13\u5B58 ") + result.ai.cachedDays + (localeIsEnglish ? " day(s)" : " \u5929") : "")), result.ai.ok ? /* @__PURE__ */ import_react12.default.createElement("div", { className: "dsdr-ai-text" }, result.ai.overall || t(
      "result.ai.hint",
      "\u9010\u65E5 AI \u6458\u8981\u5DF2\u5199\u5165 XLSX \u7684\u300CAI\u5206\u6790\u300D\u5DE5\u4F5C\u8868\u3002"
    )) : /* @__PURE__ */ import_react12.default.createElement("div", { className: "dsdr-ai-text dsdr-bad" }, t("result.ai.failed", "AI \u5206\u6790\u672A\u5B8C\u6210") + (result.ai.error ? "\uFF1A" + result.ai.error : ""))) : null, result.sources && result.sources.length > 0 ? /* @__PURE__ */ import_react12.default.createElement("div", { className: "dsdr-list" }, /* @__PURE__ */ import_react12.default.createElement("div", { className: "dsdr-hint" }, t("result.sources", "\u6570\u636E\u6E90\u72B6\u6001")), result.sources.map((source, index) => /* @__PURE__ */ import_react12.default.createElement("div", { className: "dsdr-row", key: String(index) }, /* @__PURE__ */ import_react12.default.createElement("span", { className: "dsdr-dot " + (source.status || "ok") }), /* @__PURE__ */ import_react12.default.createElement("div", null, /* @__PURE__ */ import_react12.default.createElement("span", { className: "dsdr-source-name" }, source.label || source.location || "\u2014"), source.branch ? /* @__PURE__ */ import_react12.default.createElement("span", { className: "dsdr-source-meta" }, " \xB7 " + source.branch) : null, /* @__PURE__ */ import_react12.default.createElement("span", { className: "dsdr-source-meta" }, " \xB7 " + (source.count || 0) + " " + (source.kind === "git" ? t("result.unit.commits", "\u6B21\u63D0\u4EA4") : t("result.unit.docs", "\u4EFD\u6587\u6863"))), /* @__PURE__ */ import_react12.default.createElement("div", { className: "dsdr-source-meta" }, source.message || ""))))) : null, result.warnings && result.warnings.length > 0 ? /* @__PURE__ */ import_react12.default.createElement("div", { className: "dsdr-list" }, /* @__PURE__ */ import_react12.default.createElement("div", { className: "dsdr-hint dsdr-warn" }, t("result.warnings", "\u63D0\u793A")), result.warnings.map((warning, index) => /* @__PURE__ */ import_react12.default.createElement("div", { className: "dsdr-row", key: String(index) }, "\u2022 " + warning))) : null) : null, /* @__PURE__ */ import_react12.default.createElement("div", { className: "dsdr-footer" }, t(
      "page.footer",
      "\u6570\u636E\u4EC5\u5728\u672C\u673A\u5904\u7406\uFF1B\u751F\u6210\u7684 XLSX \u5305\u542B\u65E5\u62A5\u6C47\u603B\u3001Git\u660E\u7EC6\u3001\u6587\u6863\u660E\u7EC6\u3001\u6570\u636E\u6E90\u4E0E\u8BF4\u660E\u3002"
    ))));
  }

  // src/client/hooks/useSettings.js
  var import_react13 = __toESM(__require("react"), 1);
  function useSettings({ sessionId, t }) {
    const [settings, setSettings] = import_react13.default.useState({ git: [], docs: [] });
    const [range, setRange] = import_react13.default.useState(currentMonthRange);
    const [exportFormat, setExportFormat] = import_react13.default.useState("xlsx");
    const [aiInfo, setAiInfo] = import_react13.default.useState({
      available: false,
      provider: "",
      model: "",
      models: []
    });
    const [useAi, setUseAi] = import_react13.default.useState(true);
    const [loading, setLoading] = import_react13.default.useState(true);
    const [loadError, setLoadError] = import_react13.default.useState("");
    import_react13.default.useEffect(() => {
      let alive = true;
      const query = sessionId.length > 0 ? "?sessionId=" + encodeURIComponent(sessionId) : "";
      fetch(API + "/state" + query, {
        headers: { accept: "application/json" }
      }).then((response) => {
        if (!response.ok) throw new Error("state-failed");
        return response.json();
      }).then((payload) => {
        if (!alive) return;
        setSettings(normalizeClientSettings(payload && payload.settings));
        setUseAi(!(payload && payload.settings && payload.settings.aiEnabled === false));
        const savedFormat = payload && payload.settings && payload.settings.format;
        if (typeof savedFormat === "string" && FORMAT_OPTIONS.includes(savedFormat)) {
          setExportFormat(savedFormat);
        }
        const nextAi = payload && payload.ai ? payload.ai : { available: false, provider: "", model: "" };
        setAiInfo({
          available: nextAi.available === true,
          provider: typeof nextAi.provider === "string" ? nextAi.provider : "",
          model: typeof nextAi.model === "string" ? nextAi.model : "",
          models: Array.isArray(nextAi.models) ? nextAi.models : []
        });
        const savedRange = payload && payload.settings && payload.settings.range;
        if (savedRange && typeof savedRange.start === "string" && typeof savedRange.end === "string") {
          setRange({ start: savedRange.start, end: savedRange.end });
        } else if (payload && payload.defaults && payload.defaults.start && payload.defaults.end) {
          setRange({ start: payload.defaults.start, end: payload.defaults.end });
        }
        setLoadError(payload && payload.warning ? payload.warning : "");
      }).catch(() => {
        if (!alive) return;
        setLoadError(t("error.network", "\u65E0\u6CD5\u8FDE\u63A5\u672C\u5730\u670D\u52A1\uFF0C\u8BF7\u786E\u8BA4\u63D2\u4EF6\u5DF2\u542F\u7528\u3002"));
      }).finally(() => {
        if (alive) setLoading(false);
      });
      return () => {
        alive = false;
      };
    }, [sessionId]);
    return {
      settings,
      setSettings,
      range,
      setRange,
      exportFormat,
      setExportFormat,
      aiInfo,
      setAiInfo,
      useAi,
      setUseAi,
      loading,
      loadError
    };
  }

  // src/client/hooks/useMenus.js
  var import_react14 = __toESM(__require("react"), 1);
  function useMenus() {
    const [formatMenuOpen, setFormatMenuOpen] = import_react14.default.useState(false);
    const [settingsMenuOpen, setSettingsMenuOpen] = import_react14.default.useState(false);
    const formatMenuRef = import_react14.default.useRef(null);
    const settingsMenuRef = import_react14.default.useRef(null);
    const settingsFileRef = import_react14.default.useRef(null);
    import_react14.default.useEffect(() => {
      if (!formatMenuOpen) return;
      const close = (event) => {
        if (formatMenuRef.current && !formatMenuRef.current.contains(event.target)) {
          setFormatMenuOpen(false);
        }
      };
      document.addEventListener("mousedown", close);
      return () => document.removeEventListener("mousedown", close);
    }, [formatMenuOpen]);
    import_react14.default.useEffect(() => {
      if (!settingsMenuOpen) return;
      const close = (event) => {
        if (settingsMenuRef.current && !settingsMenuRef.current.contains(event.target)) {
          setSettingsMenuOpen(false);
        }
      };
      document.addEventListener("mousedown", close);
      return () => document.removeEventListener("mousedown", close);
    }, [settingsMenuOpen]);
    return {
      formatMenuOpen,
      setFormatMenuOpen,
      settingsMenuOpen,
      setSettingsMenuOpen,
      formatMenuRef,
      settingsMenuRef,
      settingsFileRef
    };
  }

  // src/client/hooks/useSchedule.js
  var import_react15 = __toESM(__require("react"), 1);
  function useSchedule({ enabled, sessionId, t, errorMessageFromPayload }) {
    const [scheduleStatus, setScheduleStatus] = import_react15.default.useState(null);
    const [scheduleLoading, setScheduleLoading] = import_react15.default.useState(false);
    const [scheduleError, setScheduleError] = import_react15.default.useState("");
    import_react15.default.useEffect(() => {
      void loadScheduleStatus();
      if (!enabled) return void 0;
      const timer = window.setInterval(() => {
        void loadScheduleStatus();
      }, 3e4);
      return () => window.clearInterval(timer);
    }, [enabled]);
    async function loadScheduleStatus() {
      try {
        const response = await fetch(API + "/schedule/status", {
          headers: { accept: "application/json" }
        });
        if (!response.ok) return;
        setScheduleStatus(await response.json());
      } catch {
      }
    }
    async function runScheduleNow() {
      if (scheduleLoading) return;
      setScheduleLoading(true);
      setScheduleError("");
      try {
        const response = await fetch(API + "/schedule/run", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            accept: "application/json"
          },
          body: JSON.stringify({ sessionId })
        });
        let payload = null;
        try {
          payload = await response.json();
        } catch {
          payload = null;
        }
        if (!response.ok) throw new Error(errorMessageFromPayload(payload));
        if (payload && payload.status) setScheduleStatus(payload.status);
        if (!payload || payload.ok !== true) {
          throw new Error(
            payload && payload.error || t("schedule.runFailed", "\u81EA\u52A8\u751F\u6210\u5931\u8D25")
          );
        }
      } catch (err) {
        setScheduleError(
          err && err.message ? err.message : t("schedule.runFailed", "\u81EA\u52A8\u751F\u6210\u5931\u8D25")
        );
        await loadScheduleStatus();
      } finally {
        setScheduleLoading(false);
      }
    }
    return {
      scheduleStatus,
      scheduleLoading,
      scheduleError,
      loadScheduleStatus,
      runScheduleNow
    };
  }

  // src/client/hooks/useSettingsTransfer.js
  var import_react16 = __toESM(__require("react"), 1);
  function useSettingsTransfer({
    settings,
    setSettings,
    useAi,
    setUseAi,
    range,
    setRange,
    exportFormat,
    setExportFormat,
    loading,
    setError,
    setSettingsMenuOpen,
    confirm = async () => true,
    showToast,
    t
  }) {
    const [saveState, setSaveState] = import_react16.default.useState("idle");
    const firstSave = import_react16.default.useRef(true);
    const saveAbortRef = import_react16.default.useRef(null);
    const saveTimerRef = import_react16.default.useRef(null);
    import_react16.default.useEffect(() => {
      return () => {
        if (saveAbortRef.current) saveAbortRef.current.abort();
        if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
      };
    }, []);
    import_react16.default.useEffect(() => {
      if (loading) return;
      if (firstSave.current) {
        firstSave.current = false;
        return;
      }
      if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
      saveTimerRef.current = window.setTimeout(() => {
        saveTimerRef.current = null;
        persistSettings();
      }, 650);
      return () => {
        if (saveTimerRef.current) {
          window.clearTimeout(saveTimerRef.current);
          saveTimerRef.current = null;
        }
      };
    }, [settings, useAi, range, exportFormat, loading]);
    async function persistSettingsValue(cleaned) {
      if (saveAbortRef.current) saveAbortRef.current.abort();
      const controller = new AbortController();
      saveAbortRef.current = controller;
      setSaveState("saving");
      try {
        const response = await fetch(API + "/state", {
          method: "PUT",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ settings: cleaned }),
          signal: controller.signal
        });
        if (!response.ok) throw new Error("save-failed");
        setSaveState("saved");
      } catch (err) {
        if (err && err.name === "AbortError") return;
        setSaveState("failed");
      } finally {
        if (saveAbortRef.current === controller) saveAbortRef.current = null;
      }
    }
    async function persistSettings() {
      await persistSettingsValue(
        cleanSettings(settings, useAi, range, exportFormat)
      );
    }
    function saveSettingsNow() {
      if (saveTimerRef.current) {
        window.clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
      }
      persistSettings();
    }
    function exportSettings() {
      const payload = {
        version: 1,
        exportedAt: (/* @__PURE__ */ new Date()).toISOString(),
        settings: cleanSettings(settings, useAi, range, exportFormat)
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: "application/json;charset=utf-8"
      });
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "daily-report-settings.json";
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      window.setTimeout(() => window.URL.revokeObjectURL(url), 1e3);
      setSettingsMenuOpen(false);
    }
    async function importSettingsFile(event) {
      const file = event.target.files && event.target.files[0];
      event.target.value = "";
      if (!file) return;
      setSettingsMenuOpen(false);
      try {
        const parsed = JSON.parse(await file.text());
        const source = parsed && typeof parsed === "object" && parsed.settings && typeof parsed.settings === "object" ? parsed.settings : parsed;
        if (!source || typeof source !== "object" || Array.isArray(source)) {
          throw new Error("JSON \u4E2D\u6CA1\u6709\u6709\u6548\u7684 settings \u5BF9\u8C61");
        }
        const imported = normalizeClientSettings(source);
        const nextAi = source.aiEnabled !== false;
        const nextRange = source.range && typeof source.range.start === "string" && typeof source.range.end === "string" && source.range.start <= source.range.end ? { start: source.range.start, end: source.range.end } : currentMonthRange();
        const nextFormat = FORMAT_OPTIONS.includes(source.format) ? source.format : "xlsx";
        const accepted = await confirm({
          title: t("confirm.importSettings.title", "\u5BFC\u5165\u8BBE\u7F6E\uFF1F"),
          message: t(
            "confirm.importSettings.message",
            "\u5F53\u524D\u6570\u636E\u6E90\u3001AI\u3001\u65E5\u671F\u8303\u56F4\u548C\u5BFC\u51FA\u683C\u5F0F\u5C06\u88AB\u5BFC\u5165\u5185\u5BB9\u8986\u76D6\u3002"
          ),
          confirmLabel: t("confirm.import", "\u5BFC\u5165"),
          cancelLabel: t("confirm.cancel", "\u53D6\u6D88")
        });
        if (!accepted) return;
        setSettings(imported);
        setUseAi(nextAi);
        setRange(nextRange);
        setExportFormat(nextFormat);
        setError("");
        await persistSettingsValue(
          cleanSettings(imported, nextAi, nextRange, nextFormat)
        );
      } catch (err) {
        setError(
          t("settings.importFailed", "\u5BFC\u5165\u8BBE\u7F6E\u5931\u8D25\uFF1A") + (err && err.message ? err.message : "\u672A\u77E5\u9519\u8BEF")
        );
      }
    }
    async function clearCache() {
      setSettingsMenuOpen(false);
      const accepted = await confirm({
        title: t("confirm.clearCache.title", "\u6E05\u9664\u7F13\u5B58\uFF1F"),
        message: t(
          "confirm.clearCache.message",
          "\u5C06\u5220\u9664 AI \u6458\u8981\u7F13\u5B58\u548C\u8FDC\u7A0B\u4ED3\u5E93\u7F13\u5B58\u3002\u4E0B\u6B21\u751F\u6210\u4F1A\u91CD\u65B0\u5206\u6790\u548C\u91CD\u65B0\u514B\u9686\uFF0C\u8017\u65F6\u548C token \u6D88\u8017\u90FD\u4F1A\u589E\u52A0\u3002\u5DF2\u751F\u6210\u7684\u65E5\u62A5\u548C\u5386\u53F2\u6587\u4EF6\u4E0D\u53D7\u5F71\u54CD\u3002"
        ),
        confirmLabel: t("confirm.clearCache.confirm", "\u6E05\u9664"),
        cancelLabel: t("confirm.cancel", "\u53D6\u6D88"),
        danger: true
      });
      if (!accepted) return;
      try {
        const response = await fetch(API + "/cache/clear", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({})
        });
        if (!response.ok) throw new Error("clear-failed");
        setError("");
        if (typeof showToast === "function") {
          showToast(t("toast.cacheCleared", "\u7F13\u5B58\u5DF2\u6E05\u9664"));
        }
      } catch (err) {
        setError(
          t("settings.clearCacheFailed", "\u6E05\u9664\u7F13\u5B58\u5931\u8D25\uFF1A") + (err && err.message ? err.message : "\u672A\u77E5\u9519\u8BEF")
        );
      }
    }
    async function resetAllSettings() {
      setSettingsMenuOpen(false);
      const accepted = await confirm({
        title: t("confirm.resetSettings.title", "\u8FD8\u539F\u6240\u6709\u9ED8\u8BA4\u914D\u7F6E\uFF1F"),
        message: t(
          "confirm.resetSettings.message",
          "\u5C06\u6E05\u7A7A\u6240\u6709 Git \u4ED3\u5E93\u548C\u672C\u5730\u6587\u6863\uFF0C\u5E76\u628A AI\u3001\u5B9A\u65F6\u6C47\u603B\u3001\u65E5\u671F\u8303\u56F4\u548C\u5BFC\u51FA\u683C\u5F0F\u6062\u590D\u4E3A\u9ED8\u8BA4\u503C\u3002\u5DF2\u751F\u6210\u7684\u65E5\u62A5\u548C\u5386\u53F2\u6587\u4EF6\u4E0D\u53D7\u5F71\u54CD\uFF0C\u6B64\u64CD\u4F5C\u4E0D\u53EF\u64A4\u9500\u3002"
        ),
        confirmLabel: t("confirm.resetSettings.confirm", "\u8FD8\u539F"),
        cancelLabel: t("confirm.cancel", "\u53D6\u6D88"),
        danger: true
      });
      if (!accepted) return;
      try {
        const response = await fetch(API + "/settings/reset", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({})
        });
        if (!response.ok) throw new Error("reset-failed");
        const payload = await response.json();
        const next = normalizeClientSettings(payload.settings || {});
        setSettings(next);
        setUseAi(payload.settings ? payload.settings.aiEnabled !== false : true);
        setRange(currentMonthRange());
        setExportFormat(
          payload.settings && FORMAT_OPTIONS.includes(payload.settings.format) ? payload.settings.format : "xlsx"
        );
        firstSave.current = true;
        setError("");
        if (typeof showToast === "function") {
          showToast(t("toast.settingsReset", "\u5DF2\u8FD8\u539F\u9ED8\u8BA4\u914D\u7F6E"));
        }
      } catch (err) {
        setError(
          t("settings.resetFailed", "\u8FD8\u539F\u9ED8\u8BA4\u914D\u7F6E\u5931\u8D25\uFF1A") + (err && err.message ? err.message : "\u672A\u77E5\u9519\u8BEF")
        );
      }
    }
    return {
      saveState,
      saveSettingsNow,
      persistSettings,
      exportSettings,
      importSettingsFile,
      clearCache,
      resetAllSettings
    };
  }

  // src/client/hooks/useDataSources.js
  var import_react17 = __toESM(__require("react"), 1);
  function useDataSources({
    settings,
    setSettings,
    useAi,
    range,
    exportFormat,
    sessionId,
    ctx,
    t,
    errorMessageFromPayload,
    confirm = async () => true
  }) {
    const [showScan, setShowScan] = import_react17.default.useState(false);
    const [scanDir, setScanDir] = import_react17.default.useState("");
    const [scanning, setScanning] = import_react17.default.useState(false);
    const [scanMessage, setScanMessage] = import_react17.default.useState("");
    const [scanError, setScanError] = import_react17.default.useState("");
    const [testingSources, setTestingSources] = import_react17.default.useState(false);
    const [testResults, setTestResults] = import_react17.default.useState(null);
    const [testError, setTestError] = import_react17.default.useState("");
    const [dataSourceTab, setDataSourceTab] = import_react17.default.useState("git");
    function updateGit(index, patch) {
      setSettings((previous) => ({
        ...previous,
        git: previous.git.map(
          (item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item
        )
      }));
    }
    function updateDoc(index, patch) {
      setSettings((previous) => ({
        ...previous,
        docs: previous.docs.map(
          (item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item
        )
      }));
    }
    function addGit() {
      setSettings((previous) => ({
        ...previous,
        git: [...previous.git, { _key: uid(), location: "", branch: "", label: "" }]
      }));
    }
    function addDoc() {
      setSettings((previous) => ({
        ...previous,
        docs: [...previous.docs, { _key: uid(), location: "", label: "" }]
      }));
    }
    async function removeGit(index) {
      const item = settings.git[index] || {};
      const label = item.label || item.location || t("git.unnamed", "\u672A\u547D\u540D\u4ED3\u5E93");
      const accepted = await confirm({
        title: t("confirm.removeGit.title", "\u5220\u9664 Git \u4ED3\u5E93\uFF1F"),
        message: t("confirm.removeGit.message", "\u5C06\u4ECE\u5F53\u524D\u914D\u7F6E\u4E2D\u79FB\u9664\uFF1A") + label,
        confirmLabel: t("confirm.remove", "\u5220\u9664"),
        cancelLabel: t("confirm.cancel", "\u53D6\u6D88"),
        danger: true
      });
      if (!accepted) return;
      setSettings((previous) => ({
        ...previous,
        git: previous.git.filter((_, itemIndex) => itemIndex !== index)
      }));
    }
    async function removeDoc(index) {
      const item = settings.docs[index] || {};
      const label = item.label || item.location || t("doc.unnamed", "\u672A\u547D\u540D\u6587\u6863");
      const accepted = await confirm({
        title: t("confirm.removeDoc.title", "\u5220\u9664\u672C\u5730\u6587\u6863\uFF1F"),
        message: t("confirm.removeDoc.message", "\u5C06\u4ECE\u5F53\u524D\u914D\u7F6E\u4E2D\u79FB\u9664\uFF1A") + label,
        confirmLabel: t("confirm.remove", "\u5220\u9664"),
        cancelLabel: t("confirm.cancel", "\u53D6\u6D88"),
        danger: true
      });
      if (!accepted) return;
      setSettings((previous) => ({
        ...previous,
        docs: previous.docs.filter((_, itemIndex) => itemIndex !== index)
      }));
    }
    async function testSources() {
      if (testingSources) return;
      setTestingSources(true);
      setTestError("");
      setTestResults(null);
      try {
        const response = await fetch(API + "/test-sources", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            accept: "application/json"
          },
          body: JSON.stringify({
            settings: cleanSettings(settings, useAi, range, exportFormat),
            sessionId
          })
        });
        if (!response.ok) {
          let payload2 = null;
          try {
            payload2 = await response.json();
          } catch {
            payload2 = null;
          }
          throw new Error(errorMessageFromPayload(payload2));
        }
        const payload = await response.json();
        setTestResults(Array.isArray(payload.sources) ? payload.sources : []);
      } catch (err) {
        setTestError(
          err && err.message ? err.message : t("test.failed", "\u6D4B\u8BD5\u6570\u636E\u6E90\u5931\u8D25")
        );
      } finally {
        setTestingSources(false);
      }
    }
    function toggleScan() {
      const next = !showScan;
      setShowScan(next);
      setScanError("");
      setScanMessage("");
    }
    async function pickScanDirectory() {
      const service = ctx.get("uiWorkspace");
      if (!service || typeof service.pickDirectory !== "function") {
        setScanError(t("scan.noPicker", "\u8BF7\u624B\u52A8\u8F93\u5165\u76EE\u5F55\u8DEF\u5F84\u3002"));
        return;
      }
      try {
        const selected = await service.pickDirectory();
        if (typeof selected === "string" && selected.trim().length > 0) {
          setScanDir(selected);
          setScanError("");
        }
      } catch (err) {
        setScanError(
          err && err.message ? err.message : t("scan.failed", "\u626B\u63CF\u76EE\u5F55\u5931\u8D25")
        );
      }
    }
    async function scanAndAdd() {
      const directory = scanDir.trim();
      if (directory.length === 0) {
        setScanError(t("scan.placeholder", "\u8981\u626B\u63CF\u7684\u76EE\u5F55\uFF0C\u4F8B\u5982 E:\\sunline\\SBG"));
        return;
      }
      if (scanning) return;
      setScanning(true);
      setScanError("");
      setScanMessage("");
      try {
        const response = await fetch(API + "/scan", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            accept: "application/json"
          },
          body: JSON.stringify({ directory })
        });
        if (!response.ok) {
          let payload2 = null;
          try {
            payload2 = await response.json();
          } catch {
            payload2 = null;
          }
          throw new Error(errorMessageFromPayload(payload2));
        }
        const payload = await response.json();
        const repos = Array.isArray(payload.repos) ? payload.repos : [];
        const existing = new Set(
          settings.git.map(
            (item) => item.location.toLowerCase() + "\0" + item.branch
          )
        );
        const additions = [];
        for (const repo of repos) {
          if (!repo || typeof repo.location !== "string" || repo.location.length === 0)
            continue;
          const key = repo.location.toLowerCase() + "\0" + (repo.branch || "");
          if (existing.has(key)) continue;
          existing.add(key);
          additions.push({
            _key: uid(),
            location: repo.location,
            branch: typeof repo.branch === "string" ? repo.branch : "",
            label: typeof repo.label === "string" ? repo.label : ""
          });
        }
        if (additions.length > 0) {
          setSettings((previous) => ({
            ...previous,
            git: [...previous.git, ...additions]
          }));
        }
        const warnings = Array.isArray(payload.warnings) ? payload.warnings : [];
        setScanMessage(
          repos.length === 0 ? t("scan.empty", "\u8BE5\u76EE\u5F55\u4E0B\u6CA1\u6709\u53D1\u73B0 Git \u4ED3\u5E93\u3002") : t("scan.found", "\u53D1\u73B0") + " " + repos.length + " \xB7 " + t("scan.added", "\u65B0\u589E") + " " + additions.length + (warnings.length > 0 ? " \xB7 " + warnings.join(" ") : "")
        );
      } catch (err) {
        setScanError(
          err && err.message ? err.message : t("scan.failed", "\u626B\u63CF\u76EE\u5F55\u5931\u8D25")
        );
      } finally {
        setScanning(false);
      }
    }
    return {
      showScan,
      scanDir,
      setScanDir,
      scanning,
      scanMessage,
      scanError,
      testingSources,
      testResults,
      testError,
      dataSourceTab,
      setDataSourceTab,
      updateGit,
      updateDoc,
      addGit,
      addDoc,
      removeGit,
      removeDoc,
      testSources,
      toggleScan,
      pickScanDirectory,
      scanAndAdd
    };
  }

  // src/client/hooks/usePreview.js
  var import_react18 = __toESM(__require("react"), 1);
  function usePreview({
    exportFormat,
    setResult,
    resultRef,
    setError,
    t,
    errorMessageFromPayload,
    showToast
  }) {
    const [preview, setPreview] = import_react18.default.useState(null);
    const [previewJobId, setPreviewJobId] = import_react18.default.useState("");
    const [exporting, setExporting] = import_react18.default.useState(false);
    const [regenerating, setRegenerating] = import_react18.default.useState("");
    const [manualDate, setManualDate] = import_react18.default.useState("");
    const [manualText, setManualText] = import_react18.default.useState("");
    const [expandedPreviewDays, setExpandedPreviewDays] = import_react18.default.useState({});
    function updatePreviewDay(date, patch) {
      setPreview((previous) => {
        if (!previous) return previous;
        return {
          ...previous,
          days: previous.days.map(
            (day) => day.date === date ? { ...day, ...patch } : day
          )
        };
      });
    }
    function addManualItem() {
      const text = manualText.trim();
      const date = manualDate;
      if (text.length === 0 || date.length === 0 || !preview) return;
      setPreview((previous) => {
        if (!previous) return previous;
        return {
          ...previous,
          days: previous.days.map(
            (day) => day.date === date ? { ...day, manualItems: [...day.manualItems || [], text] } : day
          )
        };
      });
      setExpandedPreviewDays((previous) => ({ ...previous, [date]: true }));
      setManualText("");
    }
    function removeManualItem(date, index) {
      setPreview((previous) => {
        if (!previous) return previous;
        return {
          ...previous,
          days: previous.days.map(
            (day) => day.date === date ? {
              ...day,
              manualItems: (day.manualItems || []).filter(
                (_, itemIndex) => itemIndex !== index
              )
            } : day
          )
        };
      });
    }
    function togglePreviewDay(date) {
      setExpandedPreviewDays((previous) => ({
        ...previous,
        [date]: !previous[date]
      }));
    }
    function setAllPreviewExpanded(expand) {
      if (!preview) return;
      if (!expand) {
        setExpandedPreviewDays({});
        return;
      }
      const next = {};
      for (const day of preview.days) {
        if (day.commitCount > 0 || day.docCount > 0 || (day.manualItems || []).length > 0 || (day.aiSummary || "").length > 0) {
          next[day.date] = true;
        }
      }
      setExpandedPreviewDays(next);
    }
    function previewEdits() {
      if (!preview) return { overall: "", days: [] };
      return {
        overall: preview.ai ? preview.ai.overall || "" : "",
        days: preview.days.map((day) => ({
          date: day.date,
          aiSummary: day.aiSummary || "",
          aiHighlights: day.aiHighlights || [],
          aiCategories: day.aiCategories || [],
          manualItems: day.manualItems || []
        }))
      };
    }
    async function exportPreview() {
      if (!preview || previewJobId.length === 0 || exporting) return;
      setExporting(true);
      setError("");
      try {
        const response = await fetch(API + "/job/export", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            accept: "application/octet-stream"
          },
          body: JSON.stringify({
            jobId: previewJobId,
            edits: previewEdits(),
            format: exportFormat
          })
        });
        if (!response.ok) {
          let payload = null;
          try {
            payload = await response.json();
          } catch {
            payload = null;
          }
          throw new Error(errorMessageFromPayload(payload));
        }
        const summaryHeader = response.headers.get("x-report-summary");
        const summary = summaryHeader ? decodeBase64Json(summaryHeader) : {};
        const filenameHeader = response.headers.get("x-report-filename");
        const filename = filenameHeader ? decodeURIComponent(filenameHeader) : "\u65E5\u62A5\u6C47\u603B_" + preview.range.start + "_" + preview.range.end + "." + formatExtension(exportFormat);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const next = Object.assign({}, summary, {
          filename,
          url,
          size: blob.size
        });
        if (resultRef.current && resultRef.current.url)
          window.URL.revokeObjectURL(resultRef.current.url);
        setResult(next);
        triggerDownload(url, filename);
        if (typeof showToast === "function") {
          showToast(t("toast.exported", "\u5DF2\u5BFC\u51FA\uFF1A") + filename);
        }
      } catch (err) {
        setError(
          err && err.message ? err.message : t("error.generate", "\u5BFC\u51FA\u5931\u8D25")
        );
      } finally {
        setExporting(false);
      }
    }
    async function regeneratePreviewDay(date) {
      if (!preview || !preview.ai || !preview.ai.ok || regenerating.length > 0)
        return;
      const day = preview.days.find((item) => item.date === date);
      if (!day) return;
      setRegenerating(date);
      setError("");
      try {
        const response = await fetch(API + "/job/regenerate-day", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            accept: "application/json"
          },
          body: JSON.stringify({
            jobId: previewJobId,
            date,
            manualItems: day.manualItems || []
          })
        });
        if (!response.ok) {
          let payload2 = null;
          try {
            payload2 = await response.json();
          } catch {
            payload2 = null;
          }
          throw new Error(errorMessageFromPayload(payload2));
        }
        const payload = await response.json();
        if (!payload.ok || !payload.day) {
          throw new Error(payload.error || t("error.generate", "\u91CD\u65B0\u5206\u6790\u5931\u8D25"));
        }
        updatePreviewDay(date, {
          aiSummary: payload.day.summary || "",
          aiHighlights: payload.day.highlights || [],
          aiCategories: payload.day.categories || []
        });
      } catch (err) {
        setError(
          err && err.message ? err.message : t("error.generate", "\u91CD\u65B0\u5206\u6790\u5931\u8D25")
        );
      } finally {
        setRegenerating("");
      }
    }
    return {
      preview,
      setPreview,
      previewJobId,
      setPreviewJobId,
      exporting,
      regenerating,
      manualDate,
      setManualDate,
      manualText,
      setManualText,
      expandedPreviewDays,
      setExpandedPreviewDays,
      updatePreviewDay,
      addManualItem,
      removeManualItem,
      togglePreviewDay,
      setAllPreviewExpanded,
      exportPreview,
      regeneratePreviewDay
    };
  }

  // src/client/hooks/useGeneration.js
  var import_react19 = __toESM(__require("react"), 1);
  function useGeneration({
    settings,
    useAi,
    range,
    exportFormat,
    aiInfo,
    ctx,
    setExportFormat,
    setFormatMenuOpen,
    setResult,
    setPreview,
    setPreviewJobId,
    setExpandedPreviewDays,
    setManualDate,
    setError,
    sessionId,
    t,
    errorMessageFromPayload,
    resultRef
  }) {
    const [generating, setGenerating] = import_react19.default.useState(false);
    const [progress, setProgress] = import_react19.default.useState(null);
    const pollAbortRef = import_react19.default.useRef(null);
    const jobIdRef = import_react19.default.useRef("");
    import_react19.default.useEffect(() => {
      return () => {
        if (pollAbortRef.current) pollAbortRef.current.abort();
      };
    }, []);
    async function cancelGeneration() {
      const jobId = jobIdRef.current;
      if (jobId.length === 0) return;
      try {
        await fetch(API + "/job/cancel", {
          method: "POST",
          headers: {
            "content-type": "application/json"
          },
          body: JSON.stringify({ jobId })
        });
      } catch {
      }
      if (pollAbortRef.current) pollAbortRef.current.abort();
      setProgress(null);
      setGenerating(false);
    }
    function wait(ms, signal) {
      return new Promise((resolve, reject) => {
        const timer = window.setTimeout(() => {
          signal.removeEventListener("abort", onAbort);
          resolve();
        }, ms);
        const onAbort = () => {
          window.clearTimeout(timer);
          const error = new Error("aborted");
          error.name = "AbortError";
          reject(error);
        };
        if (signal.aborted) {
          onAbort();
          return;
        }
        signal.addEventListener("abort", onAbort, {
          once: true
        });
      });
    }
    async function generate(formatOverride) {
      if (generating) return;
      const format = FORMAT_OPTIONS.includes(formatOverride) ? formatOverride : exportFormat;
      setExportFormat(format);
      setFormatMenuOpen(false);
      const cleaned = cleanSettings(settings, useAi, range, format);
      if (cleaned.git.length === 0 && cleaned.docs.length === 0) {
        setError(t("error.noSources", "\u8BF7\u81F3\u5C11\u6DFB\u52A0\u4E00\u4E2A Git \u4ED3\u5E93\u6216\u672C\u5730\u6587\u6863\u3002"));
        return;
      }
      const totalDays = daysBetween(range.start, range.end);
      if (!range.start || !range.end || totalDays <= 0) {
        setError(
          t("error.invalidRange", "\u65E5\u671F\u8303\u56F4\u65E0\u6548\uFF0C\u8BF7\u68C0\u67E5\u5F00\u59CB\u548C\u7ED3\u675F\u65E5\u671F\u3002")
        );
        return;
      }
      if (totalDays > 366) {
        setError(t("error.rangeTooLong", "\u65F6\u95F4\u8303\u56F4\u6700\u957F\u652F\u6301 366 \u5929\u3002"));
        return;
      }
      setError("");
      setPreview(null);
      setPreviewJobId("");
      if (resultRef.current && resultRef.current.url)
        window.URL.revokeObjectURL(resultRef.current.url);
      setResult(null);
      setGenerating(true);
      setProgress({
        percent: 1,
        indeterminate: false,
        message: t("progress.start", "\u6B63\u5728\u521B\u5EFA\u751F\u6210\u4EFB\u52A1\u2026")
      });
      if (pollAbortRef.current) pollAbortRef.current.abort();
      const controller = new AbortController();
      pollAbortRef.current = controller;
      try {
        const startResponse = await fetch(API + "/generate/start", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            accept: "application/json"
          },
          body: JSON.stringify({
            settings: cleaned,
            start: range.start,
            end: range.end,
            sessionId,
            ai: useAi && aiInfo.available,
            locale: currentLocaleId(ctx).toLowerCase().startsWith("en") ? "en" : "zh"
          }),
          signal: controller.signal
        });
        if (!startResponse.ok) {
          let payload = null;
          try {
            payload = await startResponse.json();
          } catch {
            payload = null;
          }
          throw new Error(errorMessageFromPayload(payload));
        }
        const started = await startResponse.json();
        const jobId = started && typeof started.jobId === "string" ? started.jobId : "";
        if (jobId.length === 0)
          throw new Error(t("error.generate", "\u751F\u6210\u5931\u8D25"));
        jobIdRef.current = jobId;
        while (true) {
          if (controller.signal.aborted) {
            const aborted = new Error("aborted");
            aborted.name = "AbortError";
            throw aborted;
          }
          const statusResponse = await fetch(
            API + "/job?jobId=" + encodeURIComponent(jobId),
            {
              headers: {
                accept: "application/json"
              },
              signal: controller.signal
            }
          );
          if (!statusResponse.ok) {
            let payload = null;
            try {
              payload = await statusResponse.json();
            } catch {
              payload = null;
            }
            throw new Error(errorMessageFromPayload(payload));
          }
          const job = await statusResponse.json();
          if (job.progress) {
            setProgress({
              percent: Number(job.progress.percent) || 0,
              indeterminate: job.progress.indeterminate === true,
              message: job.progress.message || t("generating", "\u6B63\u5728\u6536\u96C6\u5E76\u751F\u6210\u2026")
            });
          }
          if (job.status === "done") break;
          if (job.status === "failed")
            throw new Error(
              errorMessageFromPayload({
                error: job.error
              })
            );
          if (job.status === "cancelled") {
            const aborted = new Error("aborted");
            aborted.name = "AbortError";
            throw aborted;
          }
          await wait(650, controller.signal);
        }
        const previewResponse = await fetch(
          API + "/job/preview?jobId=" + encodeURIComponent(jobId),
          {
            headers: {
              accept: "application/json"
            },
            signal: controller.signal
          }
        );
        if (!previewResponse.ok) {
          let payload = null;
          try {
            payload = await previewResponse.json();
          } catch {
            payload = null;
          }
          throw new Error(errorMessageFromPayload(payload));
        }
        const previewData = await previewResponse.json();
        setPreview(previewData);
        setPreviewJobId(jobId);
        setExpandedPreviewDays({});
        const firstDay = (previewData.days || []).find(
          (day) => day.commitCount > 0 || day.docCount > 0 || (day.manualItems || []).length > 0
        ) || (previewData.days || [])[0];
        setManualDate(firstDay ? firstDay.date : range.start);
        setProgress({
          percent: 100,
          indeterminate: false,
          message: t(
            "progress.preview",
            "\u751F\u6210\u5B8C\u6210\uFF0C\u8BF7\u9884\u89C8\u5E76\u7F16\u8F91\u540E\u5BFC\u51FA XLSX\u3002"
          )
        });
      } catch (err) {
        if (err && err.name === "AbortError") return;
        setError(
          err && err.message ? err.message : t("error.generate", "\u751F\u6210\u5931\u8D25")
        );
      } finally {
        if (pollAbortRef.current === controller) pollAbortRef.current = null;
        jobIdRef.current = "";
        setGenerating(false);
      }
    }
    return { generating, progress, generate, cancelGeneration };
  }

  // src/client/hooks/useConfirm.js
  var import_react20 = __toESM(__require("react"), 1);
  function useConfirm() {
    const [request, setRequest] = import_react20.default.useState(null);
    const resolverRef = import_react20.default.useRef(null);
    function confirm(options) {
      return new Promise((resolve) => {
        resolverRef.current = resolve;
        setRequest(options || {});
      });
    }
    function finish(result) {
      const resolve = resolverRef.current;
      resolverRef.current = null;
      setRequest(null);
      if (resolve) resolve(result);
    }
    return {
      confirm,
      dialogProps: {
        open: request !== null,
        ...request || {},
        onConfirm: () => finish(true),
        onCancel: () => finish(false)
      }
    };
  }

  // src/client/hooks/useToast.js
  var import_react21 = __toESM(__require("react"), 1);
  var TOAST_DURATION = 3200;
  function useToast() {
    const [toast, setToast] = import_react21.default.useState(null);
    const timerRef = import_react21.default.useRef(null);
    const dismissToast = import_react21.default.useCallback(() => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      setToast(null);
    }, []);
    const showToast = import_react21.default.useCallback((message, tone = "success") => {
      if (!message) return;
      if (timerRef.current) clearTimeout(timerRef.current);
      setToast({ message, tone, id: Date.now() });
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        setToast(null);
      }, TOAST_DURATION);
    }, []);
    import_react21.default.useEffect(() => {
      return () => {
        if (timerRef.current) clearTimeout(timerRef.current);
      };
    }, []);
    return { toast, showToast, dismissToast };
  }

  // src/client/components/ConfirmDialog.jsx
  var import_react22 = __toESM(__require("react"), 1);
  function ConfirmDialog({
    open = false,
    title = "",
    message = "",
    confirmLabel = "\u786E\u8BA4",
    cancelLabel = "\u53D6\u6D88",
    danger = false,
    onConfirm,
    onCancel
  }) {
    const titleId = import_react22.default.useId();
    if (!open) return null;
    return /* @__PURE__ */ import_react22.default.createElement(
      "div",
      {
        className: "dsdr-confirm-backdrop",
        role: "presentation",
        style: { backgroundColor: "rgba(0, 0, 0, 0.5)" },
        onMouseDown: (event) => {
          if (event.target === event.currentTarget) onCancel?.();
        }
      },
      /* @__PURE__ */ import_react22.default.createElement(
        "div",
        {
          className: "dsdr-confirm",
          role: "dialog",
          "aria-modal": "true",
          "aria-labelledby": titleId,
          style: { padding: 0, border: 0, boxShadow: "none" }
        },
        /* @__PURE__ */ import_react22.default.createElement(
          "div",
          {
            className: "dsdr-confirm-panel",
            style: {
              background: "#1f2328",
              backgroundColor: "#1f2328",
              color: "#f5f7fa",
              border: "1px solid rgba(255, 255, 255, 0.16)",
              borderRadius: 12,
              padding: 18,
              boxSizing: "border-box",
              boxShadow: "0 18px 48px rgba(0, 0, 0, 0.32)",
              opacity: 1
            }
          },
          /* @__PURE__ */ import_react22.default.createElement("h2", { className: "dsdr-confirm-title", id: titleId }, title),
          /* @__PURE__ */ import_react22.default.createElement("div", { className: "dsdr-confirm-message", style: { color: "#c9d1d9" } }, message),
          /* @__PURE__ */ import_react22.default.createElement("div", { className: "dsdr-confirm-actions" }, /* @__PURE__ */ import_react22.default.createElement(
            "button",
            {
              type: "button",
              className: "dsdr-btn",
              onClick: (event) => {
                event.stopPropagation();
                onCancel?.();
              }
            },
            cancelLabel
          ), /* @__PURE__ */ import_react22.default.createElement(
            "button",
            {
              type: "button",
              className: "dsdr-btn " + (danger ? "dsdr-btn-danger" : "dsdr-btn-primary"),
              onClick: (event) => {
                event.stopPropagation();
                onConfirm?.();
              }
            },
            confirmLabel
          ))
        )
      )
    );
  }

  // src/client/components/Toast.jsx
  var import_react23 = __toESM(__require("react"), 1);
  function ToastIcon({ tone }) {
    if (tone === "error") {
      return /* @__PURE__ */ import_react23.default.createElement("span", { className: "dsdr-toast-icon is-error", "aria-hidden": "true" }, /* @__PURE__ */ import_react23.default.createElement("svg", { viewBox: "0 0 16 16", width: "12", height: "12", fill: "none" }, /* @__PURE__ */ import_react23.default.createElement(
        "path",
        {
          d: "M4 4l8 8M12 4l-8 8",
          stroke: "currentColor",
          strokeWidth: "2",
          strokeLinecap: "round"
        }
      )));
    }
    return /* @__PURE__ */ import_react23.default.createElement("span", { className: "dsdr-toast-icon", "aria-hidden": "true" }, /* @__PURE__ */ import_react23.default.createElement("svg", { viewBox: "0 0 16 16", width: "12", height: "12", fill: "none" }, /* @__PURE__ */ import_react23.default.createElement(
      "path",
      {
        d: "M3.5 8.5l3 3 6-7",
        stroke: "currentColor",
        strokeWidth: "2",
        strokeLinecap: "round",
        strokeLinejoin: "round"
      }
    )));
  }
  function Toast({ toast, onDismiss }) {
    if (!toast || !toast.message) return null;
    return /* @__PURE__ */ import_react23.default.createElement("div", { className: "dsdr-toast-wrap", role: "status", "aria-live": "polite" }, /* @__PURE__ */ import_react23.default.createElement("div", { className: "dsdr-toast", key: toast.id }, /* @__PURE__ */ import_react23.default.createElement(ToastIcon, { tone: toast.tone }), /* @__PURE__ */ import_react23.default.createElement("span", { className: "dsdr-toast-text" }, toast.message), onDismiss ? /* @__PURE__ */ import_react23.default.createElement(
      "button",
      {
        type: "button",
        className: "dsdr-toast-close",
        "aria-label": "\u5173\u95ED",
        onClick: onDismiss
      },
      "\xD7"
    ) : null));
  }

  // src/client/app.jsx
  function DailyReportView(props) {
    const ctx = props.ctx;
    const t = useTranslate(ctx);
    const sessionId = typeof props.sessionId === "string" ? props.sessionId : "";
    const {
      settings,
      setSettings,
      range,
      setRange,
      exportFormat,
      setExportFormat,
      aiInfo,
      setAiInfo,
      useAi,
      setUseAi,
      loading,
      loadError
    } = useSettings({ sessionId, t });
    const {
      formatMenuOpen,
      setFormatMenuOpen,
      settingsMenuOpen,
      setSettingsMenuOpen,
      formatMenuRef,
      settingsMenuRef,
      settingsFileRef
    } = useMenus();
    const { confirm, dialogProps } = useConfirm();
    const { toast, showToast, dismissToast } = useToast();
    const [error, setError] = import_react24.default.useState("");
    const [result, setResult] = import_react24.default.useState(null);
    const resultRef = import_react24.default.useRef(null);
    const localeIsEnglish = currentLocaleId(ctx).toLowerCase().startsWith("en");
    const {
      scheduleStatus,
      scheduleLoading,
      scheduleError,
      loadScheduleStatus,
      runScheduleNow
    } = useSchedule({
      enabled: settings.scheduleEnabled,
      sessionId,
      t,
      errorMessageFromPayload
    });
    const {
      saveState,
      saveSettingsNow,
      persistSettings,
      exportSettings,
      importSettingsFile,
      clearCache,
      resetAllSettings
    } = useSettingsTransfer({
      settings,
      setSettings,
      useAi,
      setUseAi,
      range,
      setRange,
      exportFormat,
      setExportFormat,
      loading,
      setError,
      setSettingsMenuOpen,
      confirm,
      showToast,
      t
    });
    const {
      showScan,
      scanDir,
      setScanDir,
      scanning,
      scanMessage,
      scanError,
      testingSources,
      testResults,
      testError,
      dataSourceTab,
      setDataSourceTab,
      updateGit,
      updateDoc,
      addGit,
      addDoc,
      removeGit,
      removeDoc,
      testSources,
      toggleScan,
      pickScanDirectory,
      scanAndAdd
    } = useDataSources({
      settings,
      setSettings,
      useAi,
      range,
      exportFormat,
      sessionId,
      ctx,
      t,
      errorMessageFromPayload,
      confirm
    });
    const {
      preview,
      setPreview,
      previewJobId,
      setPreviewJobId,
      exporting,
      regenerating,
      manualDate,
      setManualDate,
      manualText,
      setManualText,
      expandedPreviewDays,
      setExpandedPreviewDays,
      updatePreviewDay,
      addManualItem,
      removeManualItem,
      togglePreviewDay,
      setAllPreviewExpanded,
      exportPreview,
      regeneratePreviewDay
    } = usePreview({
      exportFormat,
      setResult,
      resultRef,
      setError,
      t,
      errorMessageFromPayload,
      showToast
    });
    const { generating, progress, generate, cancelGeneration } = useGeneration({
      settings,
      useAi,
      range,
      exportFormat,
      aiInfo,
      ctx,
      setExportFormat,
      setFormatMenuOpen,
      setResult,
      setPreview,
      setPreviewJobId,
      setExpandedPreviewDays,
      setManualDate,
      setError,
      sessionId,
      t,
      errorMessageFromPayload,
      resultRef
    });
    import_react24.default.useEffect(() => {
      resultRef.current = result;
    }, [result]);
    import_react24.default.useEffect(() => {
      return () => {
        if (resultRef.current && resultRef.current.url)
          window.URL.revokeObjectURL(resultRef.current.url);
      };
    }, []);
    function errorMessageFromPayload(payload) {
      const code = payload && payload.error ? payload.error.code : "";
      const serverMessage = payload && payload.error ? payload.error.message : "";
      const messages = {
        "no-sources": t(
          "error.noSources",
          "\u8BF7\u81F3\u5C11\u6DFB\u52A0\u4E00\u4E2A Git \u4ED3\u5E93\u6216\u672C\u5730\u6587\u6863\u3002"
        ),
        "invalid-range": t(
          "error.invalidRange",
          "\u65E5\u671F\u8303\u56F4\u65E0\u6548\uFF0C\u8BF7\u68C0\u67E5\u5F00\u59CB\u548C\u7ED3\u675F\u65E5\u671F\u3002"
        ),
        "range-too-long": t(
          "error.rangeTooLong",
          "\u65F6\u95F4\u8303\u56F4\u6700\u957F\u652F\u6301 366 \u5929\u3002"
        ),
        "all-sources-failed": t(
          "error.allSourcesFailed",
          "\u6240\u6709\u6570\u636E\u6E90\u90FD\u8BFB\u53D6\u5931\u8D25\u3002"
        ),
        "generate-failed": t("error.generate", "\u751F\u6210\u5931\u8D25")
      };
      return messages[code] || serverMessage || t("error.generate", "\u751F\u6210\u5931\u8D25");
    }
    const rangeDays = daysBetween(range.start, range.end);
    const previewDays = preview ? preview.days.filter(
      (day) => day.commitCount > 0 || day.docCount > 0 || (day.manualItems || []).length > 0 || (day.aiSummary || "").length > 0
    ) : [];
    const allPreviewExpanded = previewDays.length > 0 && previewDays.every((day) => expandedPreviewDays[day.date] === true);
    const saveText = saveState === "saving" ? t("save.saving", "\u6B63\u5728\u4FDD\u5B58\u8BBE\u7F6E\u2026") : saveState === "saved" ? t("save.saved", "\u8BBE\u7F6E\u5DF2\u4FDD\u5B58") : saveState === "failed" ? t("save.failed", "\u8BBE\u7F6E\u4FDD\u5B58\u5931\u8D25") : "";
    const app = {
      settings,
      setSettings,
      range,
      setRange,
      rangeDays,
      exportFormat,
      setExportFormat,
      useAi,
      setUseAi,
      aiInfo,
      preview,
      setPreview,
      previewDays,
      allPreviewExpanded,
      exporting,
      regenerating,
      expandedPreviewDays,
      manualDate,
      manualText,
      setAllPreviewExpanded,
      exportPreview,
      setManualDate,
      setManualText,
      addManualItem,
      togglePreviewDay,
      regeneratePreviewDay,
      updatePreviewDay,
      removeManualItem,
      formatShortLabel,
      scheduleStatus,
      scheduleLoading,
      scheduleError,
      loadScheduleStatus,
      runScheduleNow,
      showScan,
      scanDir,
      setScanDir,
      scanAndAdd,
      scanning,
      scanError,
      scanMessage,
      pickScanDirectory,
      toggleScan,
      testSources,
      testingSources,
      testError,
      testResults,
      dataSourceTab,
      setDataSourceTab,
      updateGit,
      removeGit,
      addGit,
      updateDoc,
      removeDoc,
      addDoc,
      loading,
      loadError,
      error,
      result,
      saveText,
      saveState,
      saveSettingsNow,
      exportSettings,
      importSettingsFile,
      clearCache,
      resetAllSettings,
      formatMenuOpen,
      setFormatMenuOpen,
      settingsMenuOpen,
      setSettingsMenuOpen,
      formatMenuRef,
      settingsMenuRef,
      settingsFileRef,
      localeIsEnglish,
      generating,
      progress,
      generate,
      cancelGeneration,
      confirm,
      showToast,
      t
    };
    setApp(app);
    return /* @__PURE__ */ import_react24.default.createElement(AppContext.Provider, { value: app }, /* @__PURE__ */ import_react24.default.createElement(DailyReportPage, null), /* @__PURE__ */ import_react24.default.createElement(ConfirmDialog, { ...dialogProps }), /* @__PURE__ */ import_react24.default.createElement(Toast, { toast, onDismiss: dismissToast }));
  }
  function apply(ctx) {
    installStyles(ctx);
    ctx.effect(() => {
      let disposed = false;
      let disposeLocale = null;
      fetch(API + "/locales", { headers: { accept: "application/json" } }).then((response) => response.ok ? response.json() : null).then((payload) => {
        if (disposed || !payload || !payload.zh) return;
        disposeLocale = ctx.locale.register(NS, {
          zh: payload.zh,
          en: payload.en || payload.zh
        });
      }).catch(() => {
      });
      return () => {
        disposed = true;
        if (disposeLocale) disposeLocale();
      };
    }, "daily-report: locale");
    const t = ctx.locale.bind(NS);
    const panelTitle = () => {
      const value = t("panel.title");
      if (value && value !== "panel.title") return value;
      let localeId = "zh";
      try {
        const current = ctx.locale.getLocale();
        localeId = typeof current === "string" ? current : current?.id || "zh";
      } catch {
        localeId = "zh";
      }
      return String(localeId).toLowerCase().startsWith("en") ? "Daily report" : "\u65E5\u62A5\u6C47\u603B";
    };
    ctx.slots.inject(
      "main",
      () => ctx.slots.register(
        {
          name: "main",
          key: "daily-report"
        },
        (props) => /* @__PURE__ */ import_react24.default.createElement(DailyReportView, { ...props, ctx })
      )
    );
    ctx.slots.inject(
      "sidebar.panellist",
      () => ctx.slots.register(
        {
          name: "sidebar.panellist",
          id: "daily-report",
          order: 20,
          label: panelTitle
        },
        (props) => /* @__PURE__ */ import_react24.default.createElement(PanelIcon, { ...props })
      )
    );
  }
  return __toCommonJS(index_exports);
})();

    return { inject: ["slots", "locale"], apply: __DSH_DAILY_REPORT__.apply };
  },
});

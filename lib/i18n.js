import zh from "./locales/zh.js";
import en from "./locales/en.js";

const catalogs = { zh, en };

export function normalizeLocale(locale) {
  if (typeof locale !== "string") return "zh";
  const value = locale.toLowerCase();
  if (value.startsWith("en")) return "en";
  if (value.startsWith("zh")) return "zh";
  return "zh";
}

export function message(locale, key) {
  const catalog = catalogs[normalizeLocale(locale)] || catalogs.zh;
  const fallback = catalogs.zh;
  const read = (source) =>
    key.split(".").reduce((value, part) => (value && Object.prototype.hasOwnProperty.call(value, part) ? value[part] : undefined), source);
  const value = read(catalog);
  const fallbackValue = read(fallback);
  if (value !== undefined) return value;
  return fallbackValue !== undefined ? fallbackValue : key;
}

export function t(locale, key, params = {}) {
  const value = message(locale, key);
  if (typeof value !== "string") return value;
  return value.replace(/\{(\w+)\}/g, (_, name) => (params[name] === undefined ? "" : String(params[name])));
}

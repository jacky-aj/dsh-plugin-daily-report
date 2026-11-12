import React from "react";
import { API, FORMAT_OPTIONS, currentMonthRange, normalizeClientSettings } from "../helpers.js";

export function useSettings({ sessionId, t }) {
  const [settings, setSettings] = React.useState({ git: [], docs: [] });
  const [range, setRange] = React.useState(currentMonthRange);
  const [exportFormat, setExportFormat] = React.useState("xlsx");
  const [aiInfo, setAiInfo] = React.useState({
    available: false,
    provider: "",
    model: "",
    models: [],
  });
  const [useAi, setUseAi] = React.useState(true);
  const [loading, setLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState("");

  React.useEffect(() => {
    let alive = true;
    const query =
      sessionId.length > 0 ? "?sessionId=" + encodeURIComponent(sessionId) : "";
    fetch(API + "/state" + query, {
      headers: { accept: "application/json" },
    })
      .then((response) => {
        if (!response.ok) throw new Error("state-failed");
        return response.json();
      })
      .then((payload) => {
        if (!alive) return;
        setSettings(normalizeClientSettings(payload && payload.settings));
        setUseAi(!(payload && payload.settings && payload.settings.aiEnabled === false));
        const savedFormat = payload && payload.settings && payload.settings.format;
        if (typeof savedFormat === "string" && FORMAT_OPTIONS.includes(savedFormat)) {
          setExportFormat(savedFormat);
        }
        const nextAi = payload && payload.ai
          ? payload.ai
          : { available: false, provider: "", model: "" };
        setAiInfo({
          available: nextAi.available === true,
          provider: typeof nextAi.provider === "string" ? nextAi.provider : "",
          model: typeof nextAi.model === "string" ? nextAi.model : "",
          models: Array.isArray(nextAi.models) ? nextAi.models : [],
        });
        const savedRange = payload && payload.settings && payload.settings.range;
        if (
          savedRange &&
          typeof savedRange.start === "string" &&
          typeof savedRange.end === "string"
        ) {
          setRange({ start: savedRange.start, end: savedRange.end });
        } else if (
          payload &&
          payload.defaults &&
          payload.defaults.start &&
          payload.defaults.end
        ) {
          setRange({ start: payload.defaults.start, end: payload.defaults.end });
        }
        setLoadError(payload && payload.warning ? payload.warning : "");
      })
      .catch(() => {
        if (!alive) return;
        setLoadError(t("error.network", "无法连接本地服务，请确认插件已启用。"));
      })
      .finally(() => {
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
    loadError,
  };
}


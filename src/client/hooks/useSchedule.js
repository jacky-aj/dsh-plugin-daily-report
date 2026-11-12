import React from "react";
import { API } from "../helpers.js";

export function useSchedule({ enabled, sessionId, t, errorMessageFromPayload }) {
  const [scheduleStatus, setScheduleStatus] = React.useState(null);
  const [scheduleLoading, setScheduleLoading] = React.useState(false);
  const [scheduleError, setScheduleError] = React.useState("");

  React.useEffect(() => {
    void loadScheduleStatus();
    if (!enabled) return undefined;
    const timer = window.setInterval(() => {
      void loadScheduleStatus();
    }, 30000);
    return () => window.clearInterval(timer);
  }, [enabled]);

  async function loadScheduleStatus() {
    try {
      const response = await fetch(API + "/schedule/status", {
        headers: { accept: "application/json" },
      });
      if (!response.ok) return;
      setScheduleStatus(await response.json());
    } catch {
      // Status is auxiliary; do not interrupt the main page.
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
          accept: "application/json",
        },
        body: JSON.stringify({ sessionId }),
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
          (payload && payload.error) || t("schedule.runFailed", "自动生成失败"),
        );
      }
    } catch (err) {
      setScheduleError(
        err && err.message
          ? err.message
          : t("schedule.runFailed", "自动生成失败"),
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
    runScheduleNow,
  };
}


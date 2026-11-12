import React from "react";
import { useApp } from "../context.jsx";
import { API } from "../helpers.js";
import { Card } from "../components/Card.jsx";
import { Button } from "../components/Button.jsx";
import { Switch } from "../components/Switch.jsx";
import { InfoDot, PlayIcon, RefreshIcon } from "../icons.jsx";

export function ScheduleCard() {
  const {
    settings,
    setSettings,
    scheduleStatus,
    scheduleLoading,
    scheduleError,
    loadScheduleStatus,
    runScheduleNow,
    t,
    confirm = async () => true,
  } = useApp();
  return (
    <Card>
      <div className="dsdr-card-head">
        <div>
          <div className="dsdr-title-with-info">
            <div className="dsdr-card-title">
              {t("schedule.title", "定时自动生成")}
            </div>
            <InfoDot
              text={t(
                "schedule.desc",
                "在 DSH 运行期间按设定时间自动生成报告，并保存到本地历史目录。",
              )}
            />
          </div>
        </div>
        <Switch
          checked={settings.scheduleEnabled === true}
          label={t("schedule.enable", "启用自动生成")}
          onChange={async (event) => {
            const nextChecked = event.target.checked;
            if (nextChecked && settings.scheduleEnabled !== true) {
              const accepted = await confirm({
                title: t("confirm.enableSchedule.title", "启用定时自动生成？"),
                message: t(
                  "confirm.enableSchedule.message",
                  "启用后将在设定时间自动生成并保存日报，可能覆盖历史目录中的同名文件。",
                ),
                confirmLabel: t("confirm.enable", "启用"),
                cancelLabel: t("confirm.cancel", "取消"),
              });
              if (!accepted) return;
            }
            setSettings((previous) => ({
              ...previous,
              scheduleEnabled: nextChecked,
            }));
          }}
        />
      </div>
      <div className="dsdr-ai-options">
        <div className="dsdr-field">
          <label className="dsdr-label" htmlFor="dsdr-schedule-frequency">
            {t("schedule.frequency", "频率")}
          </label>
          <select
            id="dsdr-schedule-frequency"
            className="dsdr-input"
            value={settings.scheduleFrequency || "daily"}
            onChange={(event) =>
              setSettings((previous) => ({
                ...previous,
                scheduleFrequency: event.target.value,
              }))
            }
          >
            <option value="daily">{t("schedule.daily", "每天")}</option>
            <option value="weekly">{t("schedule.weekly", "每周一")}</option>
          </select>
        </div>
        <div className="dsdr-field">
          <label className="dsdr-label" htmlFor="dsdr-schedule-time">
            {t("schedule.time", "生成时间")}
          </label>
          <input
            id="dsdr-schedule-time"
            className="dsdr-input"
            type="time"
            value={settings.scheduleTime || "18:30"}
            onChange={(event) =>
              setSettings((previous) => ({
                ...previous,
                scheduleTime: event.target.value,
              }))
            }
          />
        </div>
      </div>
      <div className="dsdr-hint">
        {t("schedule.hint", "自动生成使用当前保存的数据源、AI 设置和格式。")}
      </div>
      <div className="dsdr-schedule-status">
        <div className="dsdr-schedule-status-head">
          <div className="dsdr-hint">
            {scheduleStatus && scheduleStatus.running
              ? t("schedule.inProgress", "自动生成进行中…")
              : scheduleStatus &&
                  scheduleStatus.state &&
                  scheduleStatus.state.lastAt
                ? t("schedule.last", "上次生成：") + scheduleStatus.state.lastAt
                : t("schedule.none", "尚未生成")}
          </div>
          <div className="dsdr-actions">
            <Button
              icon={<RefreshIcon size={14} />}
              onClick={loadScheduleStatus}
            >
              <span>{t("schedule.refresh", "刷新状态")}</span>
            </Button>
            <Button
              variant="primary"
              icon={<PlayIcon size={14} />}
              onClick={runScheduleNow}
              disabled={
                scheduleLoading || (scheduleStatus && scheduleStatus.running)
              }
            >
              <span>
                {scheduleLoading
                  ? t("schedule.running", "正在生成…")
                  : t("schedule.runNow", "立即运行一次")}
              </span>
            </Button>
          </div>
        </div>
        {scheduleError ? (
          <div className="dsdr-error">{scheduleError}</div>
        ) : null}
        {scheduleStatus &&
        scheduleStatus.state &&
        scheduleStatus.state.lastStatus === "error" &&
        scheduleStatus.state.lastError ? (
          <div className="dsdr-error">{scheduleStatus.state.lastError}</div>
        ) : null}
        {scheduleStatus &&
        scheduleStatus.state &&
        scheduleStatus.state.lastFile ? (
          <div className="dsdr-hint">
            <a
              className="dsdr-history-link"
              href={
                API +
                "/schedule/file?name=" +
                encodeURIComponent(scheduleStatus.state.lastFile)
              }
              download={scheduleStatus.state.lastFile}
            >
              {scheduleStatus.state.lastFile}
            </a>
          </div>
        ) : null}
        <div className="dsdr-hint">{t("schedule.history", "历史文件")}</div>
        {scheduleStatus && scheduleStatus.directory ? (
          <div className="dsdr-hint dsdr-code">
            {t("schedule.directory", "历史目录：") + scheduleStatus.directory}
          </div>
        ) : null}
        {scheduleStatus &&
        scheduleStatus.history &&
        scheduleStatus.history.length > 0 ? (
          <div className="dsdr-history-list">
            {scheduleStatus.history.slice(0, 8).map((file) => (
              <a
                key={file.name}
                className="dsdr-history-link"
                href={
                  API + "/schedule/file?name=" + encodeURIComponent(file.name)
                }
                download={file.name}
              >
                {file.name}
              </a>
            ))}
          </div>
        ) : (
          <div className="dsdr-hint">
            {t("schedule.noHistory", "暂无历史文件")}
          </div>
        )}
      </div>
    </Card>
  );
}


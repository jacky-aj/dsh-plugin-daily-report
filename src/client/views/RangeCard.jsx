import React from "react";
import { useApp } from "../context.jsx";
import { Card } from "../components/Card.jsx";
import { currentMonthRange, last7Range, lastMonthRange, thisWeekRange, yesterdayRange } from "../helpers.js";
import { InfoDot } from "../icons.jsx";

export function RangeCard() {
  const { range, setRange, rangeDays, t } = useApp();
  return (
    <Card>
      <div className="dsdr-card-head">
        <div>
          <div className="dsdr-title-with-info">
            <div className="dsdr-card-title">
              {t("range.title", "汇总时间范围")}
            </div>
            <InfoDot
              text={t("range.desc", "默认当月月初到月底；可改为任意日期范围。")}
            />
          </div>
        </div>
        <div className="dsdr-hint">
          {rangeDays > 0
            ? t("range.total", "共") +
              " " +
              rangeDays +
              " " +
              t("range.days", "天")
            : ""}
        </div>
      </div>
      <div className="dsdr-range">
        <div className="dsdr-field">
          <label className="dsdr-label" htmlFor="dsdr-start">
            {t("range.start", "开始日期")}
          </label>
          <input
            id="dsdr-start"
            className="dsdr-input"
            type="date"
            value={range.start}
            onChange={(event) =>
              setRange((previous) => ({
                ...previous,
                start: event.target.value,
              }))
            }
          />
        </div>
        <div className="dsdr-field">
          <label className="dsdr-label" htmlFor="dsdr-end">
            {t("range.end", "结束日期")}
          </label>
          <input
            id="dsdr-end"
            className="dsdr-input"
            type="date"
            value={range.end}
            onChange={(event) =>
              setRange((previous) => ({
                ...previous,
                end: event.target.value,
              }))
            }
          />
        </div>
        <div className="dsdr-actions">
          <button
            type="button"
            className="dsdr-btn"
            onClick={() => setRange(yesterdayRange())}
          >
            {t("range.yesterday", "昨天")}
          </button>
          <button
            type="button"
            className="dsdr-btn"
            onClick={() => setRange(thisWeekRange())}
          >
            {t("range.thisWeek", "本周")}
          </button>
          <button
            type="button"
            className="dsdr-btn"
            onClick={() => setRange(currentMonthRange())}
          >
            {t("range.thisMonth", "本月")}
          </button>
          <button
            type="button"
            className="dsdr-btn"
            onClick={() => setRange(lastMonthRange())}
          >
            {t("range.lastMonth", "上月")}
          </button>
          <button
            type="button"
            className="dsdr-btn"
            onClick={() => setRange(last7Range())}
          >
            {t("range.last7", "最近 7 天")}
          </button>
        </div>
      </div>
    </Card>
  );
}


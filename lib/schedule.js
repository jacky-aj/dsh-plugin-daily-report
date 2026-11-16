// Pure scheduling helpers: when the next scheduled run is due, and which runs
// were missed while the host was not running.
import { formatLocalDate } from "./collect.js";

export const MAX_CATCH_UP_RUNS = 7;

export function isoWeekKey(date) {
  const value = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = value.getUTCDay() || 7;
  value.setUTCDate(value.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(value.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((value - yearStart) / 86400000 + 1) / 7);
  return value.getUTCFullYear() + "-W" + String(week).padStart(2, "0");
}

export function parseDateKey(value) {
  if (typeof value !== "string") return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  if (Number.isNaN(date.getTime())) return null;
  if (formatLocalDate(date) !== value) return null;
  return date;
}

export function parseTimeKey(value) {
  if (typeof value !== "string") return null;
  const match = /^(\d{2}):(\d{2})$/.exec(value);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  return { hours, minutes };
}

function addDays(date, days) {
  const next = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  next.setDate(next.getDate() + days);
  return next;
}

export function occurrenceAt(dateKey, time) {
  const date = parseDateKey(dateKey);
  const clock = parseTimeKey(time);
  if (!date || !clock) return null;
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), clock.hours, clock.minutes, 0, 0);
}

export function scheduledRange(frequency, now) {
  if (frequency === "weekly") {
    const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
    const sunday = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 6);
    return { start: formatLocalDate(monday), end: formatLocalDate(sunday) };
  }
  const today = formatLocalDate(now);
  return { start: today, end: today };
}

function matchesFrequency(frequency, date) {
  return frequency === "weekly" ? date.getDay() === 1 : true;
}

/**
 * Every scheduled run that should have happened at or before `now` but has not
 * been recorded yet. `lastRunDate` is the date key of the last attempted run.
 * Only the most recent `limit` days are returned; older due runs are counted in
 * `skipped` so callers can warn that history was not fully rebuilt.
 */
export function missedOccurrences({ frequency, time, lastRunDate, now = new Date(), limit = MAX_CATCH_UP_RUNS }) {
  if (!parseTimeKey(time)) return { runs: [], skipped: 0 };
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const windowStart = addDays(today, -(limit - 1));
  const guard = addDays(today, -400);

  let cursor;
  const last = parseDateKey(lastRunDate);
  if (last) {
    cursor = addDays(last, 1);
  } else {
    // No history: only consider today, never backfill from an unknown past.
    cursor = today;
  }
  if (cursor < guard) cursor = guard;

  const due = [];
  while (cursor <= today) {
    const dateKey = formatLocalDate(cursor);
    const at = occurrenceAt(dateKey, time);
    if (at && at <= now && matchesFrequency(frequency, cursor)) {
      due.push({ date: dateKey, at });
    }
    cursor = addDays(cursor, 1);
  }

  const startKey = formatLocalDate(windowStart);
  const inWindow = due.filter((item) => item.date >= startKey);
  const runs = inWindow.map((item) => ({
    date: item.date,
    at: item.at,
    range: scheduledRange(frequency, item.at),
    weekKey: isoWeekKey(item.at),
  }));
  return { runs, skipped: due.length - runs.length };
}

/** Next scheduled run strictly after `now`, or null when the time is invalid. */
export function nextOccurrence({ frequency, time, now = new Date() }) {
  if (!parseTimeKey(time)) return null;
  for (let offset = 0; offset <= 8; offset += 1) {
    const date = addDays(now, offset);
    if (!matchesFrequency(frequency, date)) continue;
    const dateKey = formatLocalDate(date);
    const at = occurrenceAt(dateKey, time);
    if (at && at > now) return { date: dateKey, at };
  }
  return null;
}

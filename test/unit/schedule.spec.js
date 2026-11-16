import { describe, expect, it } from "vitest";

import {
  MAX_CATCH_UP_RUNS,
  isoWeekKey,
  missedOccurrences,
  nextOccurrence,
  occurrenceAt,
  parseDateKey,
  parseTimeKey,
  scheduledRange,
} from "../../lib/schedule.js";

const at = (year, month, day, hour, minute) => new Date(year, month - 1, day, hour, minute, 0, 0);

describe("schedule keys", () => {
  it("parses valid and invalid date keys", () => {
    expect(parseDateKey("2026-11-16") instanceof Date).toBe(true);
    expect(parseDateKey("2026-02-30")).toBeNull();
    expect(parseDateKey("2026-11-16T00:00")).toBeNull();
    expect(parseDateKey(undefined)).toBeNull();
  });

  it("parses valid and invalid time keys", () => {
    expect(parseTimeKey("18:30")).toEqual({ hours: 18, minutes: 30 });
    expect(parseTimeKey("24:00")).toBeNull();
    expect(parseTimeKey("18:61")).toBeNull();
    expect(parseTimeKey("")).toBeNull();
  });

  it("computes ISO week keys", () => {
    expect(isoWeekKey(new Date(2026, 0, 1))).toMatch(/^2026-W\d{2}$/);
    expect(isoWeekKey(new Date(2026, 10, 16))).toBe("2026-W47");
  });
});

describe("scheduled ranges", () => {
  it("covers the current day for daily runs", () => {
    expect(scheduledRange("daily", at(2026, 11, 16, 18, 30))).toEqual({
      start: "2026-11-16",
      end: "2026-11-16",
    });
  });

  it("covers the previous Monday..Sunday for weekly runs", () => {
    expect(scheduledRange("weekly", at(2026, 11, 16, 9, 0))).toEqual({
      start: "2026-11-09",
      end: "2026-11-15",
    });
  });
});

describe("occurrence timing", () => {
  it("builds a local occurrence and rejects bad input", () => {
    const value = occurrenceAt("2026-11-16", "18:30");
    expect(value.getFullYear()).toBe(2026);
    expect(value.getHours()).toBe(18);
    expect(occurrenceAt("bad", "18:30")).toBeNull();
    expect(occurrenceAt("2026-11-16", "bad")).toBeNull();
  });

  it("finds the next daily run later today", () => {
    const next = nextOccurrence({ frequency: "daily", time: "18:30", now: at(2026, 11, 16, 9, 0) });
    expect(next.date).toBe("2026-11-16");
  });

  it("rolls the next daily run to tomorrow after the time passed", () => {
    const next = nextOccurrence({ frequency: "daily", time: "18:30", now: at(2026, 11, 16, 19, 0) });
    expect(next.date).toBe("2026-11-17");
  });

  it("finds the next Monday for weekly runs", () => {
    const next = nextOccurrence({ frequency: "weekly", time: "09:00", now: at(2026, 11, 17, 10, 0) });
    expect(next.date).toBe("2026-11-23");
  });

  it("returns null for an invalid time", () => {
    expect(nextOccurrence({ frequency: "daily", time: "99:99", now: new Date() })).toBeNull();
  });
});

describe("missed occurrences", () => {
  it("only reports today when nothing has run yet", () => {
    const { runs, skipped } = missedOccurrences({
      frequency: "daily",
      time: "18:30",
      lastRunDate: "",
      now: at(2026, 11, 16, 19, 0),
    });
    expect(runs.map((run) => run.date)).toEqual(["2026-11-16"]);
    expect(skipped).toBe(0);
  });

  it("reports nothing before the scheduled time", () => {
    const { runs } = missedOccurrences({
      frequency: "daily",
      time: "18:30",
      lastRunDate: "",
      now: at(2026, 11, 16, 9, 0),
    });
    expect(runs).toEqual([]);
  });

  it("backfills every missed day after a shutdown", () => {
    const { runs } = missedOccurrences({
      frequency: "daily",
      time: "18:30",
      lastRunDate: "2026-11-12",
      now: at(2026, 11, 16, 19, 0),
    });
    expect(runs.map((run) => run.date)).toEqual([
      "2026-11-13",
      "2026-11-14",
      "2026-11-15",
      "2026-11-16",
    ]);
    expect(runs[0].range).toEqual({ start: "2026-11-13", end: "2026-11-13" });
  });

  it("skips today when it already ran today", () => {
    const { runs } = missedOccurrences({
      frequency: "daily",
      time: "18:30",
      lastRunDate: "2026-11-16",
      now: at(2026, 11, 16, 20, 0),
    });
    expect(runs).toEqual([]);
  });

  it("caps the backfill and counts older due runs as skipped", () => {
    const { runs, skipped } = missedOccurrences({
      frequency: "daily",
      time: "18:30",
      lastRunDate: "2026-10-01",
      now: at(2026, 11, 16, 19, 0),
    });
    expect(runs).toHaveLength(MAX_CATCH_UP_RUNS);
    expect(runs[runs.length - 1].date).toBe("2026-11-16");
    expect(skipped).toBeGreaterThan(0);
  });

  it("only reports Mondays for weekly runs", () => {
    const { runs, skipped } = missedOccurrences({
      frequency: "weekly",
      time: "09:00",
      lastRunDate: "2026-11-02",
      now: at(2026, 11, 17, 10, 0),
    });
    expect(runs.map((run) => run.date)).toEqual(["2026-11-16"]);
    expect(runs[0].range).toEqual({ start: "2026-11-09", end: "2026-11-15" });
    expect(runs[0].weekKey).toBe("2026-W47");
    expect(skipped).toBe(1);
  });

  it("honours a wider limit window", () => {
    const { runs } = missedOccurrences({
      frequency: "weekly",
      time: "09:00",
      lastRunDate: "2026-11-02",
      now: at(2026, 11, 17, 10, 0),
      limit: 21,
    });
    expect(runs.map((run) => run.date)).toEqual(["2026-11-09", "2026-11-16"]);
  });

  it("returns nothing for an invalid time", () => {
    expect(
      missedOccurrences({ frequency: "daily", time: "bad", lastRunDate: "2026-11-01", now: new Date() }),
    ).toEqual({ runs: [], skipped: 0 });
  });
});

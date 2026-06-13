import { describe, expect, it } from "vitest";
import {
  dayRangeUtc,
  daysBetween,
  localWeekday,
  minutesToUtc,
  todayLocalDateStr,
  utcToLocalMinutes,
} from "./timezone";

const TZ = "America/Sao_Paulo";

describe("dayRangeUtc", () => {
  it("maps a local day to a 24h UTC window", () => {
    const { start, end } = dayRangeUtc("2026-06-15", TZ);
    expect(start.toISOString()).toBe("2026-06-15T03:00:00.000Z");
    expect(end.toISOString()).toBe("2026-06-16T03:00:00.000Z");
  });
});

describe("localWeekday", () => {
  it("returns the weekday in the business timezone (0=Sun)", () => {
    expect(localWeekday("2026-06-15", TZ)).toBe(1);
  });
});

describe("minutesToUtc", () => {
  it("converts minutes-from-midnight on a local day to a UTC instant", () => {
    expect(minutesToUtc("2026-06-15", 540, TZ).toISOString()).toBe(
      "2026-06-15T12:00:00.000Z",
    );
  });
});

describe("utcToLocalMinutes", () => {
  it("converts a UTC instant to minutes since local midnight", () => {
    expect(
      utcToLocalMinutes(new Date("2026-06-15T12:00:00.000Z"), TZ),
    ).toBe(540);
  });
});

describe("todayLocalDateStr", () => {
  it("returns a YYYY-MM-DD string", () => {
    expect(todayLocalDateStr(TZ)).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe("daysBetween", () => {
  it("counts civil days between two YYYY-MM-DD strings", () => {
    expect(daysBetween("2026-06-15", "2026-06-20")).toBe(5);
    expect(daysBetween("2026-06-15", "2026-06-15")).toBe(0);
    expect(daysBetween("2026-06-20", "2026-06-15")).toBe(-5);
  });
});

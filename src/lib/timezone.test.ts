import { describe, expect, it } from "vitest";
import { dayRangeUtc, localWeekday, minutesToUtc } from "./timezone";

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

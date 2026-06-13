import { describe, expect, it } from "vitest";
import { computeAvailableSlots } from "./availability";

const base = {
  isOpen: true,
  isDayClosed: false,
  startMin: 540,
  endMin: 660,
  interval: 30,
  duration: 30,
  busy: [] as { startMin: number; endMin: number }[],
  earliestStartMin: 0,
};

describe("computeAvailableSlots", () => {
  it("returns all fitting slots when nothing blocks", () => {
    expect(computeAvailableSlots(base)).toEqual([540, 570, 600, 630]);
  });

  it("returns [] when the weekday is not open", () => {
    expect(computeAvailableSlots({ ...base, isOpen: false })).toEqual([]);
  });

  it("returns [] when the day is closed (DayClosure)", () => {
    expect(computeAvailableSlots({ ...base, isDayClosed: true })).toEqual([]);
  });

  it("removes slots overlapping an existing appointment", () => {
    const busy = [{ startMin: 600, endMin: 630 }];
    expect(computeAvailableSlots({ ...base, busy })).toEqual([540, 570, 630]);
  });

  it("removes slots starting before earliestStartMin (past times today)", () => {
    expect(computeAvailableSlots({ ...base, earliestStartMin: 575 })).toEqual([
      600,
      630,
    ]);
  });
});

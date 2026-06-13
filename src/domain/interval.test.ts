import { describe, expect, it } from "vitest";
import { overlaps } from "./interval";

describe("overlaps", () => {
  it("returns true when ranges partially overlap", () => {
    expect(overlaps(60, 120, 90, 150)).toBe(true);
  });

  it("returns false when ranges only touch at the boundary", () => {
    expect(overlaps(60, 120, 120, 180)).toBe(false);
  });

  it("returns false when ranges are disjoint", () => {
    expect(overlaps(60, 120, 200, 260)).toBe(false);
  });

  it("returns true when one range contains the other", () => {
    expect(overlaps(60, 240, 90, 150)).toBe(true);
  });
});

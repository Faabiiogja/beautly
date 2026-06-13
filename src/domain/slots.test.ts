import { describe, expect, it } from "vitest";
import { generateCandidates } from "./slots";

describe("generateCandidates", () => {
  it("generates start times every interval that fit before end", () => {
    expect(
      generateCandidates({ startMin: 540, endMin: 660, interval: 30, duration: 30 }),
    ).toEqual([540, 570, 600, 630]);
  });

  it("excludes candidates whose service would run past end", () => {
    expect(
      generateCandidates({ startMin: 540, endMin: 660, interval: 30, duration: 60 }),
    ).toEqual([540, 570, 600]);
  });

  it("returns empty when the service does not fit at all", () => {
    expect(
      generateCandidates({ startMin: 540, endMin: 560, interval: 30, duration: 60 }),
    ).toEqual([]);
  });
});

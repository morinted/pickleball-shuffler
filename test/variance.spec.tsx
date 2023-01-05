import { getVariance } from "../src/matching/variance";

describe("getVariance()", () => {
  test("comparatively", () => {
    expect(getVariance([1, 1, 1, 1, 1])).toBeLessThan(
      getVariance([0, 1, 1, 1, 2])
    );
    expect(getVariance([1, 2, 3, 4])).toBeLessThan(getVariance([0, 2, 2, 4]));
  });
});

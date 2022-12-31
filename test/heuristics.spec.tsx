import { calculateHeuristics } from "../src/matching/heuristics";

describe("calculateHeuristics()", () => {
  test("simple example", () => {
    const heuristics = calculateHeuristics([
      {
        matches: [
          [
            ["a", "b"],
            ["c", "d"],
          ],
        ],
        sitOuts: ["e", "f"],
      },
      {
        matches: [
          [
            ["a", "e"],
            ["f", "d"],
          ],
        ],
        sitOuts: ["b", "c"],
      },
    ]);
    expect(heuristics["a"].roundsSincePlayedWith["b"]).toBe(2);
    expect(heuristics["d"].roundsSincePlayedWith["f"]).toBe(1);
    expect(heuristics["f"].roundsSincePlayedAgainst["e"]).toBe(1);
    expect(heuristics["e"].roundsSinceSitOut).toBe(2);
    expect(heuristics["a"].roundsSinceSitOut).toBe(Infinity);
  });
});

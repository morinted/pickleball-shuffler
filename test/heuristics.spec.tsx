import {
  getHeuristics,
  getNextRound,
  INFINITY,
  Round,
} from "../src/matching/heuristics";

const sampleRounds: Round[] = [
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
];

const samplePlayers = [
  { name: "a", id: "a" },
  { name: "b", id: "b" },
  { name: "c", id: "c" },
  { name: "d", id: "d" },
  { name: "e", id: "e" },
  { name: "f", id: "f" },
];

const sampleNames = [
  "Tedd",
  "Tan",
  "Adom",
  "Gret",
  "Roland",
  "Lewis",
  "Veronica",
  "Paul",
  "Dan",
  "Frank",
  "Pier",
  "David",
  "Francis",
];

describe("calculateHeuristics()", () => {
  test("simple example", () => {
    const heuristics = getHeuristics(sampleRounds, samplePlayers);
    expect(heuristics["a"].roundsSincePlayedWith["b"]).toBe(2);
    expect(heuristics["d"].roundsSincePlayedWith["f"]).toBe(1);
    expect(heuristics["f"].roundsSincePlayedAgainst["e"]).toBe(1);
    expect(heuristics["e"].roundsSinceSitOut).toBe(2);
    expect(heuristics["b"].roundsSinceSitOut).toBe(1);
    expect(heuristics["a"].roundsSinceSitOut).toBe(INFINITY);
  });
  test("next round", () => {
    const nextRound = getNextRound(sampleRounds, samplePlayers, 1);
    expect(nextRound.sitOuts).toEqual(["a", "d"]);
    expect(nextRound.matches[0]).not.toContain([
      [
        ["b", "f"],
        ["c", "e"],
      ],
    ]);
  });
  test("multiple rounds", () => {
    const players = sampleNames.map((name) => ({ name, id: name }));
    const rounds: Round[] = [];
    for (let i = 0; i <= 15; i++) {
      let round = getNextRound(rounds, players, 3);
      console.log(JSON.stringify(round, null, 2));
      rounds.push(round);
    }
    console.log(getHeuristics(rounds, players));
  });
});

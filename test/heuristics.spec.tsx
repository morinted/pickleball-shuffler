import {
  getHeuristics,
  getNextRound,
  INFINITY,
  Round,
} from "../src/matching/heuristics";

const roundsToString = (rounds: Round[]) =>
  rounds
    .map(
      (round, index) =>
        `${index + 1}: ${round.matches
          .map((match) => `${match[0].join(" ")} vs ${match[1].join(" ")}`)
          .join(" | ")} (${round.sitOuts})`
    )
    .join("\n");

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
  test("next round, strict solution", () => {
    const nextRound = getNextRound(sampleRounds, samplePlayers, 1);
    expect(nextRound.sitOuts).toEqual(["a", "d"]);
    expect(nextRound.matches[0]).not.toContain([
      [
        ["b", "f"],
        ["c", "e"],
      ],
    ]);
  });
  test("random sitouts", () => {
    // It should be possible to have anyone sitout when everyone has sat out.
    const playersSelectedForSitout = new Set<string>();
    let attempts = 0;
    while (playersSelectedForSitout.size < 6 && attempts < 100) {
      attempts += 1;
      const nextRound = getNextRound(
        [
          ...sampleRounds,
          {
            matches: [
              [
                ["b", "e"],
                ["c", "f"],
              ],
            ],
            sitOuts: ["a", "d"], // All players have sat out.
          },
        ],
        samplePlayers,
        1
      );
      nextRound.sitOuts.forEach((sitOut) =>
        playersSelectedForSitout.add(sitOut)
      );
    }
    expect(playersSelectedForSitout).toEqual(
      new Set(samplePlayers.map((x) => x.id))
    );
  });
  test("many players over many rounds", () => {
    const players = sampleNames.map((name) => ({ name, id: name }));
    const rounds: Round[] = [];
    for (let i = 0; i <= 30; i++) {
      let round = getNextRound(rounds, players, 3);
      console.log(JSON.stringify(round, null, 2));
      rounds.push(round);
    }
    console.log(getHeuristics(rounds, players));
  });
  test("5 players, 5 games", () => {
    const players = sampleNames.slice(0, 5).map((name) => ({ name, id: name }));
    const rounds: Round[] = [];
    players.forEach(() => {
      rounds.push(getNextRound(rounds, players, 1));
    });
    const uniqueTeams = new Set();
    const uniqueSits = new Set();
    rounds.forEach(({ matches, sitOuts }) => {
      matches.forEach((match) =>
        match.forEach((team) => uniqueTeams.add(team.toString()))
      );
      sitOuts.forEach((sit) => uniqueSits.add(sit));
    });
    console.log(roundsToString(rounds));
    expect(uniqueSits.size).toEqual(5);
    expect(uniqueTeams.size).toEqual(10);
  });
});

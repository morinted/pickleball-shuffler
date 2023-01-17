import {
  getHeuristics,
  getNextBestRound,
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
  {
    matches: [
      [
        ["b", "e"],
        ["c", "f"],
      ],
    ],
    sitOuts: ["a", "d"], // All players have sat out.
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
    const heuristics = getHeuristics(sampleRounds.slice(0, 2), samplePlayers);
    expect(heuristics["a"].roundsSincePlayedWith["b"]).toBe(2);
    expect(heuristics["d"].roundsSincePlayedWith["f"]).toBe(1);
    expect(heuristics["f"].roundsSincePlayedAgainst["e"]).toBe(1);
    expect(heuristics["e"].roundsSinceSitOut).toBe(2);
    expect(heuristics["b"].roundsSinceSitOut).toBe(1);
    expect(heuristics["a"].roundsSinceSitOut).toBe(INFINITY);
    expect(heuristics["a"].roundsSincePlayedAgainst).not.toHaveProperty("a");
  });
  test("next round, strict solution", async () => {
    const [nextRound] = await getNextRound(
      sampleRounds.slice(0, 2),
      samplePlayers,
      1
    );
    expect(nextRound.sitOuts).toEqual(["a", "d"]);
    expect(nextRound.matches[0]).not.toContain([
      [
        ["b", "f"],
        ["c", "e"],
      ],
    ]);
  });
  test("late player sitouts", async () => {
    // Late players should start with a number of sit outs equal to the current round.
    const everyoneSatOutOnceOrTwice = [...sampleRounds, sampleRounds[0]];
    const newPlayers = [...samplePlayers, { name: "Late", id: "late" }];
    expect(
      getHeuristics(everyoneSatOutOnceOrTwice, newPlayers).late.sitOutCount
    ).toBe(2);
    const [nextRound] = await getNextRound(
      everyoneSatOutOnceOrTwice,
      newPlayers,
      1
    );
    expect(nextRound.sitOuts).not.toContain("late");
    expect(
      getHeuristics([...everyoneSatOutOnceOrTwice, nextRound], newPlayers)[
        "late"
      ].sitOutCount
    ).toBe(2);
  });
  test("random sitouts", async () => {
    // It should be possible to have anyone sitout when everyone has sat out.
    const playersSelectedForSitout = new Set<string>();
    let attempts = 0;
    while (playersSelectedForSitout.size < 6 && attempts < 1000) {
      attempts += 1;
      const [nextRound] = await getNextRound(sampleRounds, samplePlayers, 1);
      nextRound.sitOuts.forEach((sitOut) =>
        playersSelectedForSitout.add(sitOut)
      );
    }
    expect(playersSelectedForSitout).toEqual(
      new Set(samplePlayers.map((x) => x.id))
    );
  });
  test("play with everyone in as many rounds as there are players", async () => {
    const players = sampleNames.map((name) => ({ name, id: name })).slice(0, 9);
    const rounds: Round[] = [];
    for (let i = 0; i < players.length; i++) {
      let round = await getNextBestRound(rounds, players, 3);
      rounds.push(round);
    }
    const heuristics = getHeuristics(rounds, players);
    const numberOfMistakes = players.reduce((sum, player) => {
      return sum + heuristics[player.id].playedWithCount.max - 1;
    }, 0);
    expect(numberOfMistakes).toBe(0);
  });
  test("5 players, 5 games", async () => {
    const players = sampleNames.slice(0, 5).map((name) => ({ name, id: name }));
    const rounds: Round[] = [];
    for (let player in players) {
      rounds.push(await getNextBestRound(rounds, players, 1));
    }
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

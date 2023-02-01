import {
  getHeuristics,
  getNextBestRound,
  getNextRound,
  getTeamPreferences,
  INFINITY,
  PlayerHeuristicsDictionary,
  PlayerId,
  Round,
  sortPartnerCompatibility,
  sortTeamCompatibility,
  Team,
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

const samplePlayers = ["a", "b", "c", "d", "e", "f"];

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
    const newPlayers = [...samplePlayers, "late"];
    const lateHeuristics = getHeuristics(
      everyoneSatOutOnceOrTwice,
      newPlayers
    ).late;
    expect(lateHeuristics.sitOutCount).toBe(2);
    expect(lateHeuristics.roundsSinceSitOut).toBe(INFINITY);
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
    expect(playersSelectedForSitout).toEqual(new Set(samplePlayers));
  });
  test("no repeated partners before full cycle", async () => {
    const players = sampleNames.slice(0, 9);
    const rounds: Round[] = [];
    for (let i = 0; i < players.length; i++) {
      let round = await getNextBestRound(rounds, players, 3);
      rounds.push(round);
    }
    const heuristics = getHeuristics(rounds, players);
    const numberOfMistakes = players.reduce((sum, player) => {
      return sum + heuristics[player].playedWithCount.max - 1;
    }, 0);
    expect(numberOfMistakes).toBe(0);
  });
  test("low time to see all players", async () => {
    const players: PlayerId[] = sampleNames.slice(0, 12);

    const countPlayersWhoHaveSeenEveryone = (
      heuristics: PlayerHeuristicsDictionary
    ) => {
      return players.filter((player: PlayerId) =>
        players.every(
          (otherPlayer: PlayerId) =>
            otherPlayer === player ||
            heuristics[player].roundsSincePlayedAgainst[otherPlayer] !==
              INFINITY ||
            heuristics[player].roundsSincePlayedWith[otherPlayer] !== INFINITY
        )
      ).length;
    };

    const rounds: Round[] = [];
    let heuristics = getHeuristics(rounds, players);
    while (countPlayersWhoHaveSeenEveryone(heuristics) < players.length) {
      rounds.push(await getNextBestRound(rounds, players, 3));
      heuristics = getHeuristics(rounds, players);
    }
    expect(rounds.length).toBeLessThanOrEqual(players.length * 0.75);
  });
  test("5 players, 5 games", async () => {
    const players = sampleNames.slice(0, 5);
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
    expect(uniqueSits.size).toEqual(5);
    expect(uniqueTeams.size).toEqual(10);
  });
  test("volunteer 1/2 sit outs", async () => {
    const players = sampleNames.slice(0, 6);
    const sitOut = players[0];
    const round = await getNextBestRound([], players, 1, [sitOut]);
    expect(round.sitOuts).toContain(sitOut);
    expect(round.sitOuts).toHaveLength(2);
    expect(round.sitOuts[0]).not.toEqual(round.sitOuts[1]);
  });
  test("volunteer entire court sit out", async () => {
    const players = sampleNames.slice(0, 13);
    const volunteers = players.slice(0, 4);
    const round = await getNextBestRound([], players, 3, volunteers);
    expect(round.matches).toHaveLength(2);
    expect(round.sitOuts).toHaveLength(5);
    expect(round.sitOuts).toEqual(expect.arrayContaining(volunteers));
  });
  test("team matching", async () => {
    const players = Array.from(new Array(13), (_, index) => index.toString());

    const team36: Team = ["3", "6"];
    const team49: Team = ["4", "9"];
    const team010: Team = ["0", "10"];
    const team812: Team = ["12", "8"];
    const team17: Team = ["1", "7"];
    const team25: Team = ["2", "5"];

    const rounds: Round[] = [
      {
        sitOuts: ["12"],
        matches: [
          [
            ["10", "4"],
            ["3", "5"],
          ],
          [
            ["6", "7"],
            ["8", "9"],
          ],
          [
            ["0", "2"],
            ["1", "11"],
          ],
        ],
      },
      {
        sitOuts: ["7"],
        matches: [
          [
            ["0", "8"],
            ["11", "5"],
          ],
          [
            ["12", "2"],
            ["3", "9"],
          ],
          [
            ["1", "10"],
            ["4", "6"],
          ],
        ],
      },
      {
        sitOuts: ["11"],
        matches: [
          [team36, team49],
          [team010, team812],
          [team17, team25],
        ],
      },
    ];

    const teams = [team36, team49, team010, team812, team17, team25];

    /* Generated with:
    for (let i = 0; i < 3; i++) {
      rounds.push(await getNextBestRound(rounds, players, 3));
    }
    */

    // Recreate the heuristics used for round 3 .
    const heuristics = getHeuristics(rounds.slice(0, -1), players);

    const preferences = getTeamPreferences(teams, heuristics);
    console.log(preferences);
  });

  test("partner matching", () => {
    const heuristics = getHeuristics(sampleRounds, samplePlayers);
    const aDesiredPartners = samplePlayers
      .filter((x) => x !== "a")
      .sort(sortPartnerCompatibility("a", heuristics));

    /*
      a: {
          playedWithCount: { min: 0, max: 1, b: 1, c: 0, d: 0, e: 1, f: 0 },
          roundsSincePlayedWith: { min: 2, max: 9999, b: 3, c: 9999, d: 9999, e: 2, f: 9999 },
          playedAgainstCount: { min: 0, max: 2, b: 0, c: 1, d: 2, e: 0, f: 1 },
          roundsSincePlayedAgainst: { min: 2, max: 9999, b: 9999, c: 3, d: 2, e: 9999, f: 2 },
          roundsSinceSitOut: 1,
          sitOutCount: 1
        }
    */
    expect(aDesiredPartners).toEqual([
      "c", // Never played against.
      "d", // Played against last match.
      "f",
      "b", // Partnered first.
      "e", // Partnered second.
    ]);

    /*
      f: {
        playedWithCount: { min: 0, max: 1, a: 0, b: 0, c: 1, d: 1, e: 0 },
        roundsSincePlayedWith: { min: 1, max: 9999, a: 9999, b: 9999, c: 1, d: 2, e: 9999 },
        playedAgainstCount: { min: 0, max: 2, a: 1, b: 1, c: 0, d: 0, e: 2 },
        roundsSincePlayedAgainst: { min: 1, max: 9999, a: 2, b: 1, c: 9999, d: 9999, e: 1 },
        roundsSinceSitOut: 3,
        sitOutCount: 1
      }
     */
    const fDesiredPartners = samplePlayers
      .filter((x) => x !== "f")
      .sort(sortPartnerCompatibility("f", heuristics));

    expect(fDesiredPartners).toEqual([
      "a", // Played against two games ago.
      "b", // Played against last match.
      "e",
      "d", // Partnered first.
      "c", // Partnered second.
    ]);
  });
});

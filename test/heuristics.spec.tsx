import {
  getHeuristics,
  getNextBestRound,
  getNextRound,
  getPartnerPreferences,
  INFINITY,
  PlayerHeuristicsDictionary,
  PlayerId,
  Round,
} from "../src/matching/heuristics";
import { mean, min, max } from "lodash";

const getStats = (numbers: number[]) => ({
  min: min(numbers),
  mean: mean(numbers),
  max: max(numbers),
});

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

  test("low repeated partners after many iterations", async () => {
    const players = sampleNames.slice(0, 9);
    const rounds: Round[] = [];
    for (let i = 0; i < players.length * 10; i++) {
      let round = await getNextBestRound(rounds, players, 3);
      rounds.push(round);
    }
    const heuristics = getHeuristics(rounds, players);
    const maxPlayedWithCounts = players
      .map((player) => {
        return heuristics[player].playedWithCount.max;
      }, 0)
      .sort()
      .flatMap((count, index) => (index % 2 ? [] : [count]));
    console.log(maxPlayedWithCounts);
    console.log(getHeuristics(rounds, players));
    console.log(getPartnerPreferences(players, getHeuristics(rounds, players)));

    expect(getStats(maxPlayedWithCounts).mean).toBeLessThanOrEqual(15);
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

  test("5 players, 15 games", async () => {
    const results = [];
    for (let generations = 0; generations < 10; generations++) {
      const players = sampleNames.slice(0, 5);
      const rounds: Round[] = [];
      for (let i = 0; i < 15; i++) {
        rounds.push(await getNextBestRound(rounds, players, 1));
      }
      const uniqueMatches = new Set();
      rounds.forEach(({ matches }) => {
        matches.forEach((match) => {
          const sortedTeams = match.map((team) => team.sort().join(" "));
          const teamString = sortedTeams.sort().join(" vs ");
          uniqueMatches.add(teamString);
        });
      });
      results.push(uniqueMatches.size);
    }

    const stats = getStats(results);
    expect(stats).toEqual({
      min: 15,
      mean: 15,
      max: 15,
    });
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

  test("performance after everyone has played together", async () => {});
});

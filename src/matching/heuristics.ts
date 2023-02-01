import { stableRoommateProblem } from "./irvings";
import { PairMaker, Preferences } from "./ranked-matches";
import { shuffle } from "./roommates";

export type PlayerId = string;
export type Match = [Team, Team];
export type Round = {
  matches: Array<Match>;
  sitOuts: Array<PlayerId>;
};
export type Player = {
  name: string;
  id: PlayerId;
};
export type PlayerRecords = {
  [playerId: PlayerId]: number;
  max: number;
  min: number;
};
export type PlayerHeuristics = {
  playedWithCount: PlayerRecords;
  roundsSincePlayedWith: PlayerRecords;
  playedAgainstCount: PlayerRecords;
  roundsSincePlayedAgainst: PlayerRecords;
  roundsSinceSitOut: number;
  sitOutCount: number;
};
export type PlayerHeuristicsDictionary = Record<string, PlayerHeuristics>;
export type Team = [PlayerId, PlayerId];

// Instead of using Infinity, use a high number so that comparative values can be calculated.
export const INFINITY = 9999;

const GENERATIONS = 5;
const ROUND_LOOKAHEAD = 4;
const ROUND_ATTEMPTS = 25;

/**
 * Populate default player scores for each person.
 */
const getDefaultPlayerRecords = (
  players: PlayerId[],
  currentPlayer: PlayerId,
  previousHeuristics?: PlayerHeuristicsDictionary
) => {
  const { highDefaults, lowDefaults } = players.reduce(
    (
      result: {
        highDefaults: Record<PlayerId, number>;
        lowDefaults: Record<PlayerId, number>;
      },
      player
    ) => {
      if (player === currentPlayer) return result;
      result.highDefaults[player] = INFINITY;
      result.lowDefaults[player] = 0;
      return result;
    },
    { highDefaults: {}, lowDefaults: {} }
  );
  return (
    stat: keyof Omit<PlayerHeuristics, "roundsSinceSitOut" | "sitOutCount">
  ): PlayerRecords => {
    const high =
      stat === "roundsSincePlayedAgainst" || stat === "roundsSincePlayedWith";
    const previous = previousHeuristics?.[currentPlayer]?.[stat];
    const defaults = high ? highDefaults : lowDefaults;
    const defaultMinMax = {
      min: high ? INFINITY : 0,
      max: high ? INFINITY : 0,
    };
    if (!previous) {
      return Object.assign(defaultMinMax, defaults);
    }
    return players.reduce(
      (result: PlayerRecords, player) => {
        if (player === currentPlayer) return result;
        if (player in previous) {
          result[player] = previous?.[player];
          return result;
        }
        // This is a new player, so they will have the default.
        result[player] = defaults[player];
        if (high) {
          result.max = INFINITY;
        } else {
          result.min = 0;
        }
        return result;
      },
      { max: previous.max, min: previous.min }
    );
  };
};

const getDefaultHeuristics = (
  players: PlayerId[],
  currentPlayer: PlayerId,
  previousHeuristics?: PlayerHeuristicsDictionary
): PlayerHeuristics => {
  const defaultRecords = getDefaultPlayerRecords(
    players,
    currentPlayer,
    previousHeuristics
  );
  return {
    playedWithCount: defaultRecords("playedWithCount"),
    roundsSincePlayedWith: defaultRecords("roundsSincePlayedWith"),
    playedAgainstCount: defaultRecords("playedAgainstCount"),
    roundsSincePlayedAgainst: defaultRecords("roundsSincePlayedAgainst"),
    roundsSinceSitOut:
      previousHeuristics?.[currentPlayer]?.roundsSinceSitOut ?? INFINITY,
    sitOutCount: previousHeuristics?.[currentPlayer]?.sitOutCount ?? 0,
  };
};

/**
 * Who do I want to play with?
 *
 * Ideally people who I've not played with in a while, followed by people that I haven't played against recently.
 */
const sortPartnerCompatibility =
  (player: PlayerId, heuristics: PlayerHeuristicsDictionary) =>
  (a: PlayerId, b: PlayerId) => {
    const aScore = partnerScore(player, heuristics, a);
    const bScore = partnerScore(player, heuristics, b);
    return bScore - aScore;
  };

/**
 * How much do I want a particular partner?
 *
 * Most important is how many times I've played with them, then how long since we've partnered, then how long since we've faced off.
 */
const partnerScore = (
  player: PlayerId,
  heuristics: PlayerHeuristicsDictionary,
  partner: PlayerId
) => {
  const {} = heuristics[player].roundsSincePlayedAgainst;
  const { min: minSinceWith, [partner]: roundsSinceWith } =
    heuristics[player].roundsSincePlayedWith;
  const { min: minSinceAgainst, [partner]: roundsSinceAgainst } =
    heuristics[player].roundsSincePlayedAgainst;
  const { min: minPlayedCount, [partner]: playedWithCount } =
    heuristics[player].playedWithCount;

  const netPlayedWithCount = playedWithCount - minPlayedCount;

  const netSincePartnered = roundsSinceWith - minSinceWith;
  const netSinceAgainst = roundsSinceAgainst - minSinceAgainst;
  const sawLastGameDenominator = netSinceAgainst === 0 ? 1 : 0;
  // How long since we've played, half-weighted since played against, divided by played with count.
  const playedWithScore =
    netSincePartnered / (netPlayedWithCount * 3 + 1 + sawLastGameDenominator);

  return playedWithScore;
};

/**
 * How much do I want to play against a particular opponent?
 */
const opponentScore = (
  team: Team,
  heuristics: PlayerHeuristicsDictionary,
  opponent: Team
) => {
  // Ideally you want to play against a team with people that you haven't seen (partner or opponent) for the longest.
  const calculateDesirability = (player: PlayerId, target: PlayerId) => {
    const { min: minSinceAgainst, [target]: roundsSinceAgainst } =
      heuristics[player].roundsSincePlayedAgainst;
    const { min: minSinceWith, [target]: roundsSinceWith } =
      heuristics[player].roundsSincePlayedWith;

    const sincePlayedWithMultiplier =
      roundsSinceWith - minSinceWith === 0 ? 0.75 : 1;

    const netRoundsSinceSeen =
      // Normalize with min to account for sit outs.
      roundsSinceAgainst - minSinceAgainst;
    // Square result to strongly favor high numbers.
    return Math.pow(netRoundsSinceSeen, 2) * sincePlayedWithMultiplier;
  };

  return team.reduce((score, player) => {
    return (
      score +
      opponent.reduce((result, target) => {
        return result + calculateDesirability(player, target);
      }, 0)
    );
  }, 0);
};

const sortTeamCompatibility =
  (team: Team, heuristics: PlayerHeuristicsDictionary) =>
  (a: Team, b: Team) => {
    const teamAScore = opponentScore(team, heuristics, a);
    const teamBScore = opponentScore(team, heuristics, b);
    return teamBScore - teamAScore;
  };

const minMaxHeuristicTypes: Array<
  keyof Omit<PlayerHeuristics, "roundsSinceSitOut" | "sitOutCount">
> = [
  "playedWithCount",
  "roundsSincePlayedWith",
  "playedAgainstCount",
  "roundsSincePlayedAgainst",
];

/**
 * Get stats about who has played with and against who, and how long since people have sat out.
 */
const getHeuristics = (
  rounds: Round[],
  players: PlayerId[],
  previousHeuristics?: PlayerHeuristicsDictionary
) => {
  const heuristics: PlayerHeuristicsDictionary = players.reduce(
    (result: PlayerHeuristicsDictionary, currentPlayer) => {
      result[currentPlayer] = getDefaultHeuristics(
        players,
        currentPlayer,
        previousHeuristics
      );
      return result;
    },
    {}
  );

  /**
   * Set a heuristic, populating data types if it's the first time any heuristic is being set.
   *
   * Ignores worse values.
   */
  const setHeuristic = (
    playerId: PlayerId,
    heuristic: keyof PlayerHeuristics,
    value: number,
    subjectId: PlayerId
  ) => {
    const playerHeuristic =
      heuristics[playerId] || getDefaultHeuristics(players, playerId);
    if (heuristic === "roundsSinceSitOut") {
      if (playerHeuristic.roundsSinceSitOut > value) {
        playerHeuristic.roundsSinceSitOut = value;
      }
    }
    if (heuristic === "sitOutCount") {
      playerHeuristic.sitOutCount += value;
    }
    if (heuristic === "playedWithCount" || heuristic === "playedAgainstCount") {
      playerHeuristic[heuristic][subjectId] =
        (playerHeuristic[heuristic][subjectId] ?? 0) + 1;
    }
    if (
      heuristic === "roundsSincePlayedAgainst" ||
      heuristic === "roundsSincePlayedWith"
    ) {
      const sincePlayedCount =
        playerHeuristic[heuristic][subjectId] ?? INFINITY;
      if (value < sincePlayedCount) {
        playerHeuristic[heuristic][subjectId] = value;
      }
    }
    heuristics[playerId] = playerHeuristic;
  };

  for (let index = 0; index < rounds.length; index += 1) {
    // Stats counting down.
    const { matches, sitOuts } = rounds[rounds.length - index - 1];
    const roundsAgo = index + 1;
    sitOuts.forEach((playerId) => {
      setHeuristic(playerId, "roundsSinceSitOut", roundsAgo, playerId);
      setHeuristic(playerId, "sitOutCount", 1, playerId);
    });
    matches.forEach((teams) => {
      teams.forEach(([player, partner]) => {
        setHeuristic(player, "playedWithCount", 1, partner);
        setHeuristic(partner, "playedWithCount", 1, player);
        setHeuristic(player, "roundsSincePlayedWith", roundsAgo, partner);
        setHeuristic(partner, "roundsSincePlayedWith", roundsAgo, player);
      });
      const [teamA, teamB] = teams;
      teamA.forEach((aPlayer) => {
        teamB.forEach((bPlayer) => {
          setHeuristic(aPlayer, "playedAgainstCount", 1, bPlayer);
          setHeuristic(bPlayer, "playedAgainstCount", 1, aPlayer);
          setHeuristic(aPlayer, "roundsSincePlayedAgainst", roundsAgo, bPlayer);
          setHeuristic(bPlayer, "roundsSincePlayedAgainst", roundsAgo, aPlayer);
        });
      });
    });
  }

  // Populate sitouts for late comers.
  const roundSeen: Record<PlayerId, number> = {};
  const sitOutCounts: Record<PlayerId, number> = {};
  const lateComers: PlayerId[] = [];
  const seePlayer = (player: PlayerId, index: number) => {
    const lastSeen = roundSeen[player];
    roundSeen[player] = index;
    // If it's not the first round and this is a new player, then they were late.
    if (lastSeen === undefined && index !== 0) {
      // Late comer. Set them to sit out next batch (as if they had sit out first.)
      sitOutCounts[player] =
        Object.values(sitOutCounts).reduce(
          (lowest, current) => Math.min(lowest, current),
          Infinity
        ) + 1;
      lateComers.push(player);
    }
  };
  // Populate for every player in every round.
  rounds.forEach((round, index) => {
    const { matches, sitOuts } = round;
    sitOuts.forEach((player) => {
      seePlayer(player, index);
      sitOutCounts[player] = (sitOutCounts[player] || 0) + 1;
    });
    matches.forEach((teams) =>
      teams.forEach((team) =>
        team.forEach((player) => seePlayer(player, index))
      )
    );
  });
  // Populate the current round.
  players.forEach((player) => {
    seePlayer(player, rounds.length);
  });
  // Update the heuristics for late comers.
  lateComers.forEach((player) => {
    heuristics[player].sitOutCount = sitOutCounts[player];
  });

  // Calculate mins and maxes.
  players.forEach((player) => {
    minMaxHeuristicTypes.forEach((heuristic) => {
      const stats = heuristics[player][heuristic];
      const { min, max } = players.reduce(
        (result: { min: number; max: number }, target) => {
          if (target === player) return result;
          result.min = Math.min(result.min, stats[target] || 0);
          result.max = Math.max(result.max, stats[target] || 0);
          return result;
        },
        { min: INFINITY, max: 0 }
      );
      stats.min = min;
      stats.max = max;
    });
  });

  return heuristics;
};

/**
 * Get scores for each partner for each other partner.
 */
const getPartnerPreferences = (
  players: PlayerId[],
  heuristics: PlayerHeuristicsDictionary
) => {
  return players.reduce((result: Preferences, player) => {
    // Shuffle to help avoid earlier everyone ranking the same player highly.
    result[player] = players.reduce((acc: Record<string, number>, partner) => {
      if (player === partner) return acc;
      acc[partner] = partnerScore(player, heuristics, partner);
      return acc;
    }, {});
    return result;
  }, {});
};

/**
 * Get scores from each team for each other team.
 */
const getTeamPreferences = (
  teams: Array<Team>,
  heuristics: PlayerHeuristicsDictionary
) => {
  return teams.reduce((result: Preferences, team) => {
    const teamString = team.toString();
    result[teamString] = teams.reduce(
      (acc: Record<string, number>, opponent) => {
        const opponentString = opponent.toString();
        if (teamString === opponentString) return acc;
        acc[opponentString] = opponentScore(team, heuristics, opponent);
        return acc;
      },
      {}
    );
    return result;
  }, {});
};

const pickFromListBiasBeginning = <T>(
  list: T[],
  count: number,
  // Base chance of the first item, e.g. 7/7 * baseChance (60%) for the first item, 1/7 * baseChance (8.5%) for the last.
  baseChance: number = 0.6
): { picked: T[]; remaining: T[] } => {
  if (count > list.length) {
    throw Error("count must be smaller than list");
  }
  if (count === 0) return { picked: [], remaining: list };
  if (count === list.length) return { picked: list, remaining: [] };

  // Duplicate list.
  const remaining = [...list];
  const picked = [];
  let index = 0;
  while (picked.length < count) {
    const rand = Math.random();
    // Bias the beginning of the list by having it taper off linearly.
    const chanceForIndex =
      ((remaining.length - index) / remaining.length) * baseChance;
    if (rand < chanceForIndex) {
      // Remove the item from the array and add it to the picked list.
      picked.push(remaining.splice(index, 1)[0]);
      // No need to increment index because this index now refers to the next element in the list.
    } else {
      index += 1;
    }
    // Allow multiple passes through the array by running mod.
    index = index % remaining.length;
  }
  return { picked, remaining };
};

/**
 * Choose which players sit out.
 */
const getSitOuts = (
  heuristics: PlayerHeuristicsDictionary,
  allPlayers: PlayerId[],
  courts: number,
  volunteers: PlayerId[] = []
) => {
  // Remove volunteer sitouts from possible players.
  const players = allPlayers.filter((player) =>
    volunteers.every((volunteer) => volunteer !== player)
  );
  const capacity = courts * 4;
  const sitouts =
    players.length > capacity
      ? players.length - courts * 4
      : players.length % 4;

  // Shuffle because at the beginning everyone's rounds since sit out is the same.
  const inOrderOfSitout = shuffle(players).sort(
    (a, b) => heuristics[b].roundsSinceSitOut - heuristics[a].roundsSinceSitOut
  );

  // Get everyone who has sat out the least number of times.
  const leastSitOuts = players.reduce((least, player) => {
    return Math.min(heuristics[player].sitOutCount, least);
  }, Infinity);

  // Two groups: those who are yet to sit out this round, and those who have.
  const { eligibleToSitOut, alreadySatOut } = inOrderOfSitout.reduce(
    (
      result: { eligibleToSitOut: PlayerId[]; alreadySatOut: PlayerId[] },
      player
    ) => {
      if (heuristics[player].sitOutCount === leastSitOuts) {
        result.eligibleToSitOut.push(player);
      } else {
        result.alreadySatOut.push(player);
      }
      return result;
    },
    { eligibleToSitOut: [], alreadySatOut: [] }
  );

  // If the number of sitouts exhausts the remaining sitouts, then collect them all.
  const mandatorySitouts =
    sitouts >= eligibleToSitOut.length ? eligibleToSitOut : [];

  // We will pick whatever is left from the main group.
  const sitoutsLeft = sitouts - mandatorySitouts.length;

  // Pick from the eligibles if there are more eligibles than sitouts needed, otherwise fill up
  // the missing sitouts from the next round.
  const { picked, remaining } = pickFromListBiasBeginning(
    mandatorySitouts.length ? alreadySatOut : eligibleToSitOut,
    sitoutsLeft
  );

  return [
    // Sitouts: mandatory (if applicable) and picked.
    [...volunteers, ...mandatorySitouts, ...picked].sort(),
    // Players: remaining from picked, plus all those who have already sat out if we didn't pick from that group.
    shuffle([...remaining, ...(mandatorySitouts.length ? [] : alreadySatOut)]),
  ];
};

/**
 * Generate the next round given all previous rounds.
 */
async function getNextRound(
  rounds: Round[],
  players: PlayerId[],
  courts: number,
  volunteerSitouts?: PlayerId[],
  heuristics: PlayerHeuristicsDictionary = getHeuristics(rounds, players)
): Promise<[Round, { bestTeamScore: number; bestMatchesScore: number }]> {
  // TODO: remove dupes
  let bestTeamScore = Infinity;
  let bestTeams: { teams: Team[]; sitOuts: PlayerId[] } = {
    teams: [],
    sitOuts: [],
  };
  for (let i = 0; i < GENERATIONS; i++) {
    await new Promise((resolve) => resolve(undefined));
    /* Decide who sits out. */
    const [sitoutPlayers, roundPlayers] = getSitOuts(
      heuristics,
      players,
      courts,
      volunteerSitouts
    );

    const sitOuts = sitoutPlayers.sort(); // Sort by ID for stable order.

    /* Make partnerships. */
    // Get ranked preferences for each player.
    const partnerPreferences: Preferences = getPartnerPreferences(
      roundPlayers,
      heuristics
    );
    const partnerMaker = new PairMaker(partnerPreferences);
    partnerMaker.solve();
    const teams: Team[] = partnerMaker.solvedGroups as Team[];

    // Count the number of people who are partnering with someone who is at their max (and not because it's their min)
    const score = teams.reduce((result: number, [a, b]) => {
      const aPlayedWith = heuristics[a].playedWithCount;
      const aScore =
        aPlayedWith[b] === aPlayedWith.max && aPlayedWith[b] !== aPlayedWith.min
          ? 1
          : 0;
      const bPlayedWith = heuristics[b].playedWithCount;
      const bScore =
        bPlayedWith[a] === bPlayedWith.max && bPlayedWith[a] !== bPlayedWith.min
          ? 1
          : 0;
      return result + aScore + bScore;
    }, 0);

    if (score < bestTeamScore) {
      bestTeamScore = score;
      bestTeams = { teams, sitOuts };
    }
  }

  if (!bestTeams) {
    throw new Error("no teams found");
  }

  /* Make matchups. */
  let bestMatchesScore = Infinity;
  let bestMatches: Match[] | null = null;
  for (let i = 0; i < GENERATIONS; i++) {
    await new Promise((resolve) => resolve(undefined));
    const teamPreferences = getTeamPreferences(bestTeams.teams, heuristics);
    const teamMaker = new PairMaker(teamPreferences);
    teamMaker.solve();
    const matches = teamMaker.solvedGroups.map((match) =>
      match.map((teamString) => teamString.split(","))
    ) as Match[];

    const newHeuristics = getHeuristics(
      [{ matches, sitOuts: bestTeams.sitOuts }],
      players,
      heuristics
    );
    const averageScore = players.reduce((score, player) => {
      const { roundsSincePlayedAgainst } = newHeuristics[player];
      const playerScore = Math.sqrt(
        players.reduce((sum, opponent) => {
          if (opponent === player) return sum;
          return sum + Math.pow(roundsSincePlayedAgainst[opponent], 2);
        }, 0)
      );
      return score + playerScore / players.length;
    }, 0);

    if (averageScore < bestMatchesScore) {
      bestMatchesScore = averageScore;
      bestMatches = matches;
    }
  }

  // Return new round.
  if (!bestMatches) {
    throw new Error("no matches found");
  }
  return [
    { sitOuts: bestTeams.sitOuts, matches: bestMatches },
    { bestTeamScore, bestMatchesScore },
  ];
}

async function getNextBestRound(
  rounds: Round[],
  players: PlayerId[],
  courts: number,
  volunteerSitouts?: PlayerId[]
): Promise<Round> {
  // Go forward 3 rounds a few times and choose the best direction.
  // Try to avoid local tight spots.
  const heuristics = getHeuristics(rounds, players);
  let bestRoundScore: { opponentScore: number; partnerScore: number } = {
    opponentScore: Infinity,
    partnerScore: Infinity,
  };
  let selectedRound: Round | null = null;
  for (let attempt = 0; attempt < ROUND_ATTEMPTS; attempt++) {
    await new Promise((resolve) => resolve(undefined));
    let newHeuristics = heuristics;
    let newRounds = [];
    let partnerScore = 0;
    let opponentScore = Infinity;
    for (
      let roundGeneration = 0;
      roundGeneration < ROUND_LOOKAHEAD;
      roundGeneration++
    ) {
      try {
        const [newRound, roundStats] = await getNextRound(
          rounds,
          players,
          courts,
          volunteerSitouts,
          heuristics
        );
        newHeuristics = getHeuristics([newRound], players, newHeuristics);
        newRounds.push(newRound);
        // We care more about the short term team score.
        partnerScore =
          roundStats.bestTeamScore * (ROUND_LOOKAHEAD - roundGeneration);

        // We only care about the end-result for matches.
        opponentScore = roundStats.bestMatchesScore;
      } catch (e) {
        // No round found.
      }
    }

    if (bestRoundScore.partnerScore < partnerScore) continue;
    // Partner score better or equal. Opponent score counts for fallback.
    if (
      partnerScore < bestRoundScore.partnerScore ||
      opponentScore < bestRoundScore.opponentScore
    ) {
      bestRoundScore = { partnerScore, opponentScore };
      selectedRound = newRounds[0];
    }
  }

  return selectedRound!;
}

export {
  getHeuristics,
  getNextRound,
  getNextBestRound,
  opponentScore,
  partnerScore,
  sortTeamCompatibility,
  sortPartnerCompatibility,
  getTeamPreferences,
};

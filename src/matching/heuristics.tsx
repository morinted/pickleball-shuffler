import { stableRoommateProblem } from "./irvings";
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
  players: Player[],
  currentPlayer: Player,
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
      if (player.id === currentPlayer.id) return result;
      result.highDefaults[player.id] = INFINITY;
      result.lowDefaults[player.id] = 0;
      return result;
    },
    { highDefaults: {}, lowDefaults: {} }
  );
  return (
    stat: keyof Omit<PlayerHeuristics, "roundsSinceSitOut" | "sitOutCount">
  ): PlayerRecords => {
    const high =
      stat === "roundsSincePlayedAgainst" || stat === "roundsSincePlayedWith";
    const previous = previousHeuristics?.[currentPlayer.id]?.[stat];
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
        if (player.id === currentPlayer.id) return result;
        if (player.id in previous) {
          result[player.id] = previous?.[player.id];
          return result;
        }
        // This is a new player, so they will have the default.
        result[player.id] = defaults[player.id];
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
  players: Player[],
  currentPlayer: Player,
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
      previousHeuristics?.[currentPlayer.id]?.roundsSinceSitOut ?? INFINITY,
    sitOutCount: previousHeuristics?.[currentPlayer.id]?.sitOutCount ?? 0,
  };
};

/**
 * Who do I want to play with?
 *
 * Ideally people who I've not played with in a while, followed by people that I haven't played against recently.
 */
const sortPartnerCompatibility =
  (player: Player, heuristics: PlayerHeuristicsDictionary) =>
  (a: Player, b: Player) => {
    const aScore = partnerScore(player.id, heuristics, a.id);
    const bScore = partnerScore(player.id, heuristics, b.id);
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
  const { min: minPlayedCount, [partner]: playedWithCount } =
    heuristics[player].playedWithCount;

  const playedWithOffset = playedWithCount - minPlayedCount;

  const playedWithScore =
    (roundsSinceWith - minSinceWith) / (playedWithOffset + 1);

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
    // Normalize with min to account for sit outs.
    // Square result to strongly favor high numbers.
    return (
      Math.pow(roundsSinceAgainst - minSinceAgainst, 2) +
      Math.pow(roundsSinceWith - minSinceWith, 1.5)
    );
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
  players: Player[],
  previousHeuristics?: PlayerHeuristicsDictionary
) => {
  const heuristics: PlayerHeuristicsDictionary = players.reduce(
    (result: PlayerHeuristicsDictionary, currentPlayer) => {
      result[currentPlayer.id] = getDefaultHeuristics(
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
      heuristics[playerId] ||
      getDefaultHeuristics(players, { id: playerId, name: "" });
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
    seePlayer(player.id, rounds.length);
  });
  // Update the heuristics for late comers.
  lateComers.forEach((player) => {
    heuristics[player].sitOutCount = sitOutCounts[player];
  });

  // Calculate mins and maxes.
  players.forEach((player) => {
    minMaxHeuristicTypes.forEach((heuristic) => {
      const stats = heuristics[player.id][heuristic];
      const { min, max } = players.reduce(
        (result: { min: number; max: number }, target) => {
          if (target.id === player.id) return result;
          result.min = Math.min(result.min, stats[target.id] || 0);
          result.max = Math.max(result.max, stats[target.id] || 0);
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
 * Get a ranked list of players that each player would like to partner with.
 */
const getPartnerPreferences = (
  players: Player[],
  heuristics: PlayerHeuristicsDictionary
) => {
  return players.reduce((result: Record<PlayerId, Player[]>, player) => {
    // Shuffle to help avoid earlier everyone ranking the same player highly.
    result[player.id] = shuffle(players)
      .filter((x) => x.id !== player.id)
      .sort(sortPartnerCompatibility(player, heuristics));
    return result;
  }, {});
};

/**
 * Get a ranked list of teams that each team would like to play against.
 */
const getTeamPreferences = (
  teams: Array<Team>,
  heuristics: PlayerHeuristicsDictionary
) => {
  return teams.reduce((result: Record<string, Team[]>, team) => {
    const teamString = team.toString();
    result[teamString] = shuffle(teams)
      .filter((x) => x.toString() !== teamString)
      .sort(sortTeamCompatibility(team, heuristics));
    return result;
  }, {});
};

const pickFromListBiasBeginning = <T,>(
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
  // TODO: add volunteers
  heuristics: PlayerHeuristicsDictionary,
  players: Player[],
  courts: number
) => {
  const capacity = courts * 4;
  const sitouts =
    players.length > capacity
      ? players.length - courts * 4
      : players.length % 4;

  // Shuffle because at the beginning everyone's rounds since sit out is the same.
  const inOrderOfSitout = shuffle(players).sort(
    (a, b) =>
      heuristics[b.id].roundsSinceSitOut - heuristics[a.id].roundsSinceSitOut
  );

  // Get everyone who has sat out the least number of times.
  const leastSitOuts = players.reduce((least, player) => {
    return Math.min(heuristics[player.id].sitOutCount, least);
  }, Infinity);

  // Two groups: those who are yet to sit out this round, and those who have.
  const { eligibleToSitOut, alreadySatOut } = inOrderOfSitout.reduce(
    (
      result: { eligibleToSitOut: Player[]; alreadySatOut: Player[] },
      player
    ) => {
      if (heuristics[player.id].sitOutCount === leastSitOuts) {
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
    [...mandatorySitouts, ...picked].sort(),
    // Players: remaining from picked, plus all those who have already sat out if we didn't pick from that group.
    shuffle([...remaining, ...(mandatorySitouts.length ? [] : alreadySatOut)]),
  ];
};

/**
 * Generate the next round given all previous rounds.
 */
async function getNextRound(
  rounds: Round[],
  players: Player[],
  courts: number,
  heuristics: PlayerHeuristicsDictionary = getHeuristics(rounds, players)
): Promise<[Round, { bestTeamScore: number; bestMatchesScore: number }]> {
  // TODO: remove dupes
  // TODO: add set timeouts to allow other events to run.
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
      courts
    );

    const sitOuts = sitoutPlayers.map((x) => x.id).sort(); // Sort by ID for stable order.

    /* Make partnerships. */
    // Get ranked preferences for each player.
    const partnerPreferences = getPartnerPreferences(roundPlayers, heuristics);
    // Convert to indexes.
    const playerIdToIndex = roundPlayers.reduce(
      (indexes: Record<string, string>, player, index) => {
        indexes[player.id] = index.toString();
        return indexes;
      },
      {}
    );
    const partnerPreferenceMatrix = roundPlayers.map((player) => {
      return partnerPreferences[player.id].map(
        (preference) => playerIdToIndex[preference.id]
      );
    });
    let teamsByIndex = null;
    try {
      // Apply Irving's algorithm.
      teamsByIndex = stableRoommateProblem(partnerPreferenceMatrix);
    } catch (e) {
      continue;
    }

    // Convert back to player IDs.
    const teams: Team[] = teamsByIndex.map(([playerIndex, matchIndex]) => {
      const player = roundPlayers[parseInt(playerIndex)].id;
      const match = roundPlayers[parseInt(matchIndex)].id;
      return [player, match];
    });

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
    const shuffledTeams = shuffle(bestTeams.teams);
    const teamPreferences = getTeamPreferences(shuffledTeams, heuristics);
    // Convert to indexes.
    const teamToIndex = shuffledTeams.reduce(
      (indexes: Record<string, string>, team, index) => {
        indexes[team.toString()] = index.toString();
        return indexes;
      },
      {}
    );
    const teamPreferenceMatrix = shuffledTeams.map((team) => {
      return teamPreferences[team.toString()].map(
        (preference) => teamToIndex[preference.toString()]
      );
    });

    let matchesByIndex = null;
    try {
      // Apply Irving's algorithm.
      matchesByIndex = stableRoommateProblem(teamPreferenceMatrix);
    } catch (e) {
      // Retry if there is no stable match.
      continue;
    }

    // Convert back to player IDs.
    const matches: Match[] = matchesByIndex.map(
      ([teamIndexA, teamIndexB]): Match => {
        const teamA = shuffledTeams[parseInt(teamIndexA)].sort();
        const teamB = shuffledTeams[parseInt(teamIndexB)].sort();
        return [teamA, teamB].sort() as Match; // Sort for stability.
      }
    );

    const newHeuristics = getHeuristics(
      [{ matches, sitOuts: bestTeams.sitOuts }],
      players,
      heuristics
    );
    const averageScore = players.reduce((score, player) => {
      const { roundsSincePlayedAgainst } = newHeuristics[player.id];
      const playerScore = Math.sqrt(
        players.reduce((sum, opponent) => {
          if (opponent.id === player.id) return sum;
          return sum + Math.pow(roundsSincePlayedAgainst[opponent.id], 2);
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
  players: Player[],
  courts: number
): Promise<Round> {
  // Go forward 3 rounds a few times and choose the best direction.
  // Try to avoid local tight spots.
  const heuristics = getHeuristics(rounds, players);
  let bestRoundScore: { opponentScore: number; partnerScore: number } = {
    opponentScore: Infinity,
    partnerScore: Infinity,
  };
  let worstRoundScore: { opponentScore: number; partnerScore: number } = {
    opponentScore: 0,
    partnerScore: 0,
  };
  let selectedRound: Round | null = null;
  const lastRound = rounds.length === 8;
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

export { getHeuristics, getNextRound, getNextBestRound };

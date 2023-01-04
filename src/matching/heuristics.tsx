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
};
export type PlayerHeuristicsDictionary = Record<string, PlayerHeuristics>;
export type Team = [PlayerId, PlayerId];

// Instead of using Infinity, use a high number so that comparative values can be calculated.
export const INFINITY = 9999;

/**
 * Populate default player scores for each person.
 */
const getDefaultPlayerRecords = (players: Player[], currentPlayer: Player) => {
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
  return (high?: boolean) =>
    Object.assign(
      { min: high ? INFINITY : 0, max: high ? INFINITY : 0 },
      high ? highDefaults : lowDefaults
    );
};

const getDefaultHeuristics = (
  players: Player[],
  currentPlayer: Player
): PlayerHeuristics => {
  const defaultRecords = getDefaultPlayerRecords(players, currentPlayer);
  return {
    playedWithCount: defaultRecords(),
    roundsSincePlayedWith: defaultRecords(true),
    playedAgainstCount: defaultRecords(),
    roundsSincePlayedAgainst: defaultRecords(true),
    roundsSinceSitOut: INFINITY,
  };
};

function roundsSincePlayedWith(
  player: PlayerId,
  heuristics: PlayerHeuristicsDictionary,
  partner: PlayerId
) {
  return heuristics[player].roundsSincePlayedWith[partner] || INFINITY;
}
function roundsSincePlayedAgainst(
  player: PlayerId,
  heuristics: PlayerHeuristicsDictionary,
  partner: PlayerId
) {
  return heuristics[player].roundsSincePlayedAgainst[partner] || INFINITY;
}

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

const partnerScore = (
  player: PlayerId,
  heuristics: PlayerHeuristicsDictionary,
  partner: PlayerId
) => {
  // I want to partner most with people I haven't partnered with for a long time.
  // I want to play with people I haven't played with recently.
  // I don't want to partner with people over and over again.
  const {
    min: minSinceAgainst,
    max: maxSinceAgainst,
    [partner]: roundsSinceAgainst,
  } = heuristics[player].roundsSincePlayedAgainst;
  const { min: minSinceWith, [partner]: roundsSinceWith } =
    heuristics[player].roundsSincePlayedWith;
  const { min: minPlayedCount, [partner]: playedWithCount } =
    heuristics[player].playedWithCount;

  const playedWithOffset = playedWithCount - minPlayedCount;

  const playedWithScore =
    ((roundsSinceWith - minSinceWith) / (playedWithOffset + 1)) *
    // Apply up to 25% reduction if we played against this person recently.
    ((roundsSinceAgainst / (maxSinceAgainst - minSinceAgainst) + 3) / 4);

  return playedWithScore;
};

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

const averageRoundsSincePlayedAgainst = (
  [player1, player2]: Team,
  heuristics: PlayerHeuristicsDictionary,
  [a1, a2]: Team
) => {
  const player1PlayedAgainstTeamA =
    roundsSincePlayedAgainst(player1, heuristics, a1) +
    roundsSincePlayedAgainst(player1, heuristics, a2) / 2;
  const player2PlayedAgainstTeamB =
    (roundsSincePlayedAgainst(player2, heuristics, a1) +
      roundsSincePlayedAgainst(player2, heuristics, a2)) /
    2;
  return (player1PlayedAgainstTeamA + player2PlayedAgainstTeamB) / 2;
};

const averageRoundsSincePlayedWith = (
  [player1, player2]: Team,
  heuristics: PlayerHeuristicsDictionary,
  [a1, a2]: Team
) => {
  const player1PlayedWithTeamA =
    (roundsSincePlayedWith(player1, heuristics, a1) +
      roundsSincePlayedWith(player1, heuristics, a2)) /
    2;
  const player2PlayedWithTeamB =
    (roundsSincePlayedWith(player2, heuristics, a1) +
      roundsSincePlayedWith(player2, heuristics, a2)) /
    2;
  return (player1PlayedWithTeamA + player2PlayedWithTeamB) / 2;
};

const sortTeamCompatibility =
  (team: Team, heuristics: PlayerHeuristicsDictionary) =>
  (a: Team, b: Team) => {
    const teamAScore = opponentScore(team, heuristics, a);
    const teamBScore = opponentScore(team, heuristics, b);
    return teamBScore - teamAScore;
  };

const minMaxHeuristicTypes: Array<
  keyof Omit<PlayerHeuristics, "roundsSinceSitOut">
> = [
  "playedWithCount",
  "roundsSincePlayedWith",
  "playedAgainstCount",
  "roundsSincePlayedAgainst",
];

/**
 * Get stats about who has played with and against who, and how long since people have sat out.
 */
const getHeuristics = (rounds: Round[], players: Player[]) => {
  const heuristics: PlayerHeuristicsDictionary = players.reduce(
    (result: PlayerHeuristicsDictionary, currentPlayer) => {
      result[currentPlayer.id] = getDefaultHeuristics(players, currentPlayer);
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
    const { matches, sitOuts } = rounds[rounds.length - index - 1];
    const roundsAgo = index + 1;
    sitOuts.forEach((playerId) => {
      setHeuristic(playerId, "roundsSinceSitOut", roundsAgo, playerId);
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

const getPartnerPreferences = (
  players: Player[],
  heuristics: PlayerHeuristicsDictionary
) => {
  return players.reduce((result: Record<PlayerId, Player[]>, player) => {
    result[player.id] = players
      .filter((x) => x.id !== player.id)
      .sort(sortPartnerCompatibility(player, heuristics));
    console.log(
      result[player.id]
        .map(
          (x) =>
            `${x.id} (${heuristics[player.id].roundsSincePlayedWith[x.id]}, ${
              heuristics[player.id].roundsSincePlayedAgainst[x.id]
            })`
        )
        .join(", ")
    );
    return result;
  }, {});
};

const getTeamPreferences = (
  teams: Array<Team>,
  heuristics: PlayerHeuristicsDictionary
) => {
  return teams.reduce((result: Record<string, Team[]>, team) => {
    const teamString = team.toString();
    result[teamString] = teams
      .filter((x) => x.toString() !== teamString)
      .sort(sortTeamCompatibility(team, heuristics));
    return result;
  }, {});
};

const getSitOuts = (
  heuristics: PlayerHeuristicsDictionary,
  players: Player[],
  courts: number
) => {
  const sitouts = players.length - courts * 4;
  players.sort(
    (a, b) =>
      heuristics[b.id].roundsSinceSitOut - heuristics[a.id].roundsSinceSitOut
  );
  return [players.slice(0, sitouts), shuffle(players.slice(sitouts))];
};

const getNextRound = (
  rounds: Round[],
  players: Player[],
  courts: number,
  attempts?: number
): Round => {
  if (attempts && attempts > 100) {
    throw new Error("infinite loop");
  }
  const heuristics = getHeuristics(rounds, players);
  /* Decide who sits out. */
  const [sitoutPlayers, roundPlayers] = getSitOuts(heuristics, players, courts);

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
    // Retry if there is no stable match.
    return getNextRound(rounds, players, courts, (attempts || 0) + 1);
  }

  // Convert back to player IDs.
  const teams: Team[] = teamsByIndex.map(([playerIndex, matchIndex]) => {
    const player = roundPlayers[parseInt(playerIndex)].id;
    const match = roundPlayers[parseInt(matchIndex)].id;
    return [player, match];
  });

  /* Make matchups. */
  // Calculate team preferences.
  const teamPreferences = getTeamPreferences(teams, heuristics);

  // Convert to indexes.
  const teamToIndex = teams.reduce(
    (indexes: Record<string, string>, team, index) => {
      indexes[team.toString()] = index.toString();
      return indexes;
    },
    {}
  );
  const teamPreferenceMatrix = teams.map((team) => {
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
    return getNextRound(rounds, players, courts, (attempts || 0) + 1);
  }

  // Convert back to player IDs.
  const matches: Match[] = matchesByIndex.map(([teamIndexA, teamIndexB]) => {
    const teamA = teams[parseInt(teamIndexA)];
    const teamB = teams[parseInt(teamIndexB)];
    return [teamA.sort(), teamB.sort()].sort(); // Sort for stability.
  });

  // Return new round.
  return { sitOuts, matches };
};

export { getHeuristics, getNextRound };

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
export type PlayerHeuristics = {
  playedWithCount: { [playerId: PlayerId]: number | undefined };
  roundsSincePlayedWith: { [playerId: PlayerId]: number | undefined };
  playedAgainstCount: { [playerId: PlayerId]: number | undefined };
  roundsSincePlayedAgainst: { [playerId: PlayerId]: number | undefined };
  roundsSinceSitOut: number;
};
export type PlayerHeuristicsDictionary = Record<string, PlayerHeuristics>;
export type Team = [PlayerId, PlayerId];

const getDefaultHeuristics = (): PlayerHeuristics => ({
  playedWithCount: {},
  roundsSincePlayedWith: {},
  playedAgainstCount: {},
  roundsSincePlayedAgainst: {},
  roundsSinceSitOut: Infinity,
});

function roundsSincePlayedWith(
  player: PlayerId,
  heuristics: PlayerHeuristicsDictionary,
  partner: PlayerId
) {
  return heuristics[player].roundsSincePlayedWith[partner] || Infinity;
}
function roundsSincePlayedAgainst(
  player: PlayerId,
  heuristics: PlayerHeuristicsDictionary,
  partner: PlayerId
) {
  return heuristics[player].roundsSincePlayedAgainst[partner] || Infinity;
}

/**
 * Who do I want to play with?
 *
 * Ideally people who I've not played with in a while, followed by people that I haven't played against recently.
 */
const sortPartnerCompatibility =
  (player: Player, heuristics: PlayerHeuristicsDictionary) =>
  (a: Player, b: Player) => {
    const aPlayedWith = roundsSincePlayedWith(player.id, heuristics, a.id);
    const bPlayedWith = roundsSincePlayedWith(player.id, heuristics, b.id);
    if (aPlayedWith > bPlayedWith) return -1;
    if (bPlayedWith > aPlayedWith) return 1;

    const aPlayedAgainst = roundsSincePlayedAgainst(
      player.id,
      heuristics,
      a.id
    );
    const bPlayedAgainst = roundsSincePlayedAgainst(
      player.id,
      heuristics,
      b.id
    );
    if (aPlayedAgainst > bPlayedAgainst) return -1;
    if (bPlayedAgainst > aPlayedAgainst) return 1;

    return 0;
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
    const teamAScore = averageRoundsSincePlayedAgainst(team, heuristics, a);
    const teamBScore = averageRoundsSincePlayedAgainst(team, heuristics, b);
    if (teamAScore > teamBScore) return -1;
    if (teamBScore > teamAScore) return 1;

    const teamAScore2 = averageRoundsSincePlayedWith(team, heuristics, a);
    const teamBScore2 = averageRoundsSincePlayedWith(team, heuristics, b);
    if (teamAScore2 > teamBScore2) return -1;
    if (teamBScore2 > teamAScore2) return 1;

    return 0;
  };

/**
 * Get stats about who has played with and against who, and how long since people have sat out.
 */
const getHeuristics = (rounds: Round[], players: Player[]) => {
  const heuristics: PlayerHeuristicsDictionary = players.reduce(
    (result: PlayerHeuristicsDictionary, currentPlayer) => {
      result[currentPlayer.id] = getDefaultHeuristics();
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
    const playerHeuristic = heuristics[playerId] || getDefaultHeuristics();
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
        playerHeuristic[heuristic][subjectId] ?? Infinity;
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

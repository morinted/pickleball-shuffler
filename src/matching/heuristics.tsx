export type PlayerId = string;
export type Match = [[PlayerId, PlayerId], [PlayerId, PlayerId]];
export type Round = {
  matches: Array<Match>;
  sitOuts: Array<PlayerId>;
};
export type Player = {
  name: string;
  id: PlayerId;
};
export type PlayerWithHeuristics = Player & { heuristics: PlayerHeuristics };
export type PlayerHeuristics = {
  playedWithCount: { [playerId: PlayerId]: number | undefined };
  roundsSincePlayedWith: { [playerId: PlayerId]: number | undefined };
  playedAgainstCount: { [playerId: PlayerId]: number | undefined };
  roundsSincePlayedAgainst: { [playerId: PlayerId]: number | undefined };
  roundsSinceSitOut: number;
};
export type Team = [Player, Player];
export type TeamWithHeuristics = [PlayerWithHeuristics, PlayerWithHeuristics];

function roundsSincePlayedWith(player: PlayerWithHeuristics, partner: Player) {
  return player.heuristics.roundsSincePlayedWith[partner.id] || Infinity;
}
function roundsSincePlayedAgainst(
  player: PlayerWithHeuristics,
  partner: Player
) {
  return player.heuristics.roundsSincePlayedAgainst[partner.id] || Infinity;
}

/**
 * Who do I want to play with?
 *
 * Ideally people who I've not played with in a while, followed by people that I haven't played against recently.
 */
const sortPartnerCompatibility =
  (player: PlayerWithHeuristics) => (a: Player, b: Player) => {
    const aPlayedWith = roundsSincePlayedWith(player, a);
    const bPlayedWith = roundsSincePlayedWith(player, b);
    if (aPlayedWith > bPlayedWith) return -1;
    if (bPlayedWith > aPlayedWith) return 1;

    const aPlayedAgainst = roundsSincePlayedAgainst(player, a);
    const bPlayedAgainst = roundsSincePlayedAgainst(player, b);
    if (aPlayedAgainst > bPlayedAgainst) return -1;
    if (bPlayedAgainst > aPlayedAgainst) return 1;

    return 0;
  };

const averageRoundsSincePlayedAgainst = (
  [player1, player2]: TeamWithHeuristics,
  [a1, a2]: Team
) => {
  const player1PlayedAgainstTeamA = Math.min(
    roundsSincePlayedAgainst(player1, a1),
    roundsSincePlayedAgainst(player1, a2)
  );
  const player2PlayedAgainstTeamB = Math.min(
    roundsSincePlayedAgainst(player2, a1),
    roundsSincePlayedAgainst(player2, a2)
  );
  return (player1PlayedAgainstTeamA + player2PlayedAgainstTeamB) / 2;
};

const averageRoundsSincePlayedWith = (
  [player1, player2]: TeamWithHeuristics,
  [a1, a2]: Team
) => {
  const player1PlayedWithTeamA = Math.min(
    roundsSincePlayedWith(player1, a1),
    roundsSincePlayedWith(player1, a2)
  );
  const player2PlayedWithTeamB = Math.min(
    roundsSincePlayedWith(player2, a1),
    roundsSincePlayedWith(player2, a2)
  );
  return (player1PlayedWithTeamA + player2PlayedWithTeamB) / 2;
};

const sortTeamCompatibility =
  (team: TeamWithHeuristics) => (a: Team, b: Team) => {
    const [player1, player2] = team;

    const [a1, a2] = a;
    const [b1, b2] = b;

    const teamAScore = averageRoundsSincePlayedAgainst(team, a);
    const teamBScore = averageRoundsSincePlayedAgainst(team, b);
    if (teamAScore > teamBScore) return -1;
    if (teamBScore > teamAScore) return 1;

    const teamAScore2 = averageRoundsSincePlayedWith(team, a);
    const teamBScore2 = averageRoundsSincePlayedWith(team, b);
    if (teamAScore2 > teamBScore2) return -1;
    if (teamBScore2 > teamAScore2) return 1;

    return 0;
  };

const calculateHeuristics = (rounds: Round[]) => {
  const heuristics: Record<string, PlayerHeuristics> = {};

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
    const playerHeuristic = heuristics[playerId] || {
      playedWithCount: {},
      roundsSincePlayedWith: {},
      playedAgainstCount: {},
      roundsSincePlayedAgainst: {},
      roundsSinceSitOut: Infinity,
    };
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

export { calculateHeuristics };

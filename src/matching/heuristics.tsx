type Match = [[string, string], [string, string]];
type Round = {
  matches: Array<Match>;
  sitOuts: Array<Player>;
};
type Player = {
  name: string;
  id: number;
};
type PlayerWithHeuristics = Player & { heuristics: PlayerHeuristics };
type PlayerHeuristics = {
  playedWithCount: { [name: string]: number | undefined };
  roundsSincePlayedWith: { [name: string]: number | undefined };
  playedAgainstCount: { [name: string]: number | undefined };
  roundsSincePlayedAgainst: { [name: string]: number | undefined };
  roundsSinceSitOut: number;
};
type Team = [Player, Player];
type TeamWithHeuristics = [PlayerWithHeuristics, PlayerWithHeuristics];

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

export {};

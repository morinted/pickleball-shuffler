import { BadgeGroup } from "./BadgeGroup";
import { PlayerBadge } from "./PlayerBadge";

export default function TeamBadges({
  team,
  isHome,
}: {
  team: string[];
  isHome?: boolean;
}) {
  const [player1, player2] = team;
  return (
    <BadgeGroup>
      <PlayerBadge color={isHome ? "primary" : "secondary"}>
        {player1}
      </PlayerBadge>
      <PlayerBadge color={isHome ? "primary" : "secondary"}>
        {player2}
      </PlayerBadge>
    </BadgeGroup>
  );
}

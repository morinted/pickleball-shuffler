import { Spacer } from "@nextui-org/react";
import { Player } from "./matching/heuristics";
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
    <div>
      <PlayerBadge color={isHome ? "primary" : "secondary"}>
        {player1}
      </PlayerBadge>
      <Spacer x={0.5} inline />
      <PlayerBadge color={isHome ? "primary" : "secondary"}>
        {player2}
      </PlayerBadge>
    </div>
  );
}

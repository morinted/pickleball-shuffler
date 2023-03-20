import { Button, Card, Spacer, Text } from "@nextui-org/react";
import Link from "next/link";
import { useShufflerState } from "./useShuffler";

export function ResumeActiveGame() {
  const state = useShufflerState();
  const currentRound = state.rounds.length;
  if (!currentRound) return null;
  return (
    <>
      <Card variant="bordered">
        <Card.Body>
          <Text h3 i>
            Game in progress
          </Text>
          <Link href="/rounds">
            <Button>Resume current session on round {currentRound}</Button>
          </Link>
        </Card.Body>
      </Card>
      <Spacer y={1} />
    </>
  );
}

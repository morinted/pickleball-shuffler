import { Button, Card, CardBody, Spacer } from "@nextui-org/react";
import Link from "next/link";
import { useShufflerState } from "./useShuffler";

export function ResumeActiveGame() {
  const state = useShufflerState();
  const currentRound = state.rounds.length;
  if (!currentRound) return null;
  return (
    <Card shadow="sm" className="mb-6">
      <CardBody className="py-4 pl-5">
        <p className="text-xl font-semibold italic mb-3">Game in progress</p>
        <Link href="/rounds">
          <Button color="primary">
            Resume current session on round {currentRound}
          </Button>
        </Link>
      </CardBody>
    </Card>
  );
}

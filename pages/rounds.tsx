import {
  Button,
  Card,
  Container,
  Row,
  Spacer,
  Text,
  Pagination,
  Grid,
} from "@nextui-org/react";
import Head from "next/head";
import React, { useEffect, useState } from "react";
import { Edit, People } from "react-iconly";
import { BadgeGroup } from "../src/BadgeGroup";
import { Court } from "../src/Court";
import { CourtsModal } from "../src/CourtsModal";
import { PlayerBadge } from "../src/PlayerBadge";
import { PlayersModal } from "../src/PlayersModal";
import { SitoutsModal } from "../src/SitoutsModal";
import TeamBadges from "../src/TeamBadges";
import {
  editCourts,
  editPlayers,
  newRound,
  useShufflerDispatch,
  useShufflerState,
  useShufflerWorker,
} from "../src/useShuffler";

export default function Rounds() {
  const state = useShufflerState();
  const dispatch = useShufflerDispatch();
  const worker = useShufflerWorker();

  const [sitoutModal, setSitoutModal] = useState(false);
  const [playersModal, setPlayersModal] = useState(false);
  const [courtsModal, setCourtsModal] = useState(false);

  const [roundIndex, setRoundIndex] = useState(0);

  // Handle rounds loading into state.
  useEffect(() => {
    if (state.rounds.length && roundIndex === 0) {
      setRoundIndex(Math.max(state.rounds.length - 1, 0));
      window.scrollTo(0, 0);
    }
  }, [state.rounds]);
  const displayIndex = Math.max(
    0,
    Math.min(roundIndex, state.rounds.length - 1)
  );
  const round = state.rounds[displayIndex];
  const volunteers = state.volunteerSitoutsByRound[displayIndex];
  const { sitOuts = [], matches = [] } = round || {};
  const playerName = (id: string) => {
    return state.playersById[id].name;
  };

  return (
    <>
      <Head>
        <title>Rounds - Jumbled Doubles</title>
        <meta name="description" content="View player rounds" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Container>
        <SitoutsModal
          open={sitoutModal}
          onClose={() => setSitoutModal(false)}
          onSubmit={async (volunteerSitouts) => {
            await newRound(dispatch, state, worker, {
              regenerate: true,
              volunteerSitouts,
            });
            setSitoutModal(false);
          }}
        />
        <PlayersModal
          open={playersModal}
          onClose={() => setPlayersModal(false)}
          onSubmit={async (newPlayers, regenerate) => {
            await editPlayers(dispatch, state, worker, {
              newPlayers,
              regenerate,
            });
            if (!regenerate && roundIndex) setRoundIndex((index) => index + 1);
            setPlayersModal(false);
          }}
        />
        <CourtsModal
          open={courtsModal}
          onClose={() => setCourtsModal(false)}
          onSubmit={async (courts, regenerate) => {
            await editCourts(dispatch, state, worker, {
              regenerate,
              courts,
            });
            if (!regenerate && roundIndex) setRoundIndex((index) => index + 1);
            setCourtsModal(false);
          }}
        />
        <Spacer y={1} />
        <Row
          align="center"
          css={{
            gap: "0.5rem",
          }}
        >
          <Text
            css={{
              flexGrow: 1,
            }}
            h3
          >
            Round {roundIndex + 1}
          </Text>
          {roundIndex === state.rounds.length - 1 ? (
            <>
              <Button
                aria-label={`${state.players.length} players`}
                auto
                icon={<People />}
                css={{ marginTop: "-0.75rem" }}
                onPress={() => setPlayersModal(true)}
              >
                {state.players.length}
              </Button>
              <Button
                aria-label={`${state.players.length} players`}
                auto
                icon={<Court />}
                css={{ marginTop: "-0.75rem" }}
                onPress={() => setCourtsModal(true)}
              >
                {state.courts}
              </Button>
            </>
          ) : (
            <Button
              onPress={() => setRoundIndex(state.rounds.length - 1)}
              flat
              css={{ marginTop: "-0.75rem" }}
            >
              Jump to latest round
            </Button>
          )}
        </Row>
        <Grid.Container gap={2} justify="center">
          <Grid xs={12} sm={4} md={3} xl={2}>
            <Card variant="flat">
              <Card.Body>
                <Row justify="space-between" align="center">
                  <Text h4>Sitting out</Text>
                  <Button
                    auto
                    css={{
                      marginTop: "-1rem",
                    }}
                    flat
                    color="primary"
                    onPress={() => setSitoutModal(true)}
                    icon={<Edit label="Edit sit outs" />}
                  />
                </Row>
                {sitOuts.length ? (
                  <>
                    <Spacer y={0.5} />
                    <BadgeGroup>
                      {sitOuts.map((playerId) => (
                        <PlayerBadge key={playerId} color="default">
                          {playerName(playerId)}
                          {volunteers.includes(playerId) ? " (volunteer)" : ""}
                        </PlayerBadge>
                      ))}
                    </BadgeGroup>
                  </>
                ) : (
                  <Text i>No one has to sit out.</Text>
                )}
              </Card.Body>
            </Card>
          </Grid>

          {matches.map(([teamA, teamB], index) => {
            return (
              <Grid
                key={JSON.stringify([teamA, teamB])}
                xs={12}
                sm={6}
                md={4}
                xl={3}
              >
                <Card variant="bordered">
                  <Card.Body>
                    <Text h4>Court {index + 1}</Text>
                    <div style={{ textAlign: "center" }}>
                      <TeamBadges team={teamA.map(playerName).sort()} isHome />
                      <Spacer y={1} />
                      <Card.Divider>
                        <Text b>vs</Text>
                      </Card.Divider>
                      <Spacer y={1} />
                      <TeamBadges team={teamB.map(playerName).sort()} />
                    </div>
                  </Card.Body>
                </Card>
              </Grid>
            );
          })}
        </Grid.Container>
        <Spacer y={1} />
        <Row justify="space-around">
          <Pagination
            total={state.rounds.length + (state.generating ? 1 : 0) || 1}
            page={roundIndex + 1}
            onChange={(page: number) => {
              setRoundIndex(page - 1);
            }}
          />
        </Row>
        <Spacer y={1.5} />
        <Row justify="space-around">
          <Button
            size="lg"
            onPress={async () => {
              await newRound(dispatch, state, worker, {
                volunteerSitouts: [],
              });
              setRoundIndex(state.rounds.length);
              window.scrollTo(0, 0);
            }}
            color="gradient"
          >
            Start round {state.rounds.length + 1}!
          </Button>
        </Row>
        <Spacer y={2} />
      </Container>
    </>
  );
}

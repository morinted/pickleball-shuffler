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
import React, { Fragment, useEffect, useRef, useState } from "react";
import { Edit, Home, People } from "react-iconly";
import { BadgeGroup } from "../src/BadgeGroup";
import { PlayerId } from "../src/matching/heuristics";
import { PlayerBadge } from "../src/PlayerBadge";
import { PlayersModal } from "../src/PlayersModal";
import { SitoutsModal } from "../src/SitoutsModal";
import TeamBadges from "../src/TeamBadges";
import {
  newRound,
  useShufflerDispatch,
  useShufflerState,
} from "../src/useShuffler";

export default function Rounds() {
  const state = useShufflerState();
  const dispatch = useShufflerDispatch();

  const [sitoutModal, setSitoutModal] = useState(false);
  const [playersModal, setPlayersModal] = useState(false);

  const [volunteerSitouts, setVolunteerSitouts] = useState<PlayerId[]>([]);

  const [roundIndex, setRoundIndex] = useState(0);

  // Handle rounds loading into state.
  useEffect(() => {
    if (state.rounds.length && roundIndex === 0) {
      setRoundIndex(Math.max(state.rounds.length - 1, 0));
      window.scrollTo(0, 0);
    }
  }, [state.rounds]);
  const round = state.rounds[roundIndex];
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
            setRoundIndex(0);
            await newRound(dispatch, state, {
              replace: true,
              volunteerSitouts,
            });
            setSitoutModal(false);
          }}
        />
        <PlayersModal
          open={playersModal}
          onClose={() => setPlayersModal(false)}
          onSubmit={async (newPlayers) => {
            setRoundIndex(0);
            // TODO
            setPlayersModal(false);
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
            icon={<Home />}
            css={{ marginTop: "-0.75rem" }}
            onPress={() => setPlayersModal(true)}
          >
            {state.courts}
          </Button>
        </Row>
        <Grid.Container gap={2} justify="center">
          {!!sitOuts.length && (
            <Grid xs={12} sm={6} md={4} xl={3}>
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
                  <Spacer y={0.5} />
                  <BadgeGroup>
                    {sitOuts
                      .map(playerName)
                      .sort()
                      .map((name) => (
                        <PlayerBadge key={name} color="default">
                          {name}
                        </PlayerBadge>
                      ))}
                  </BadgeGroup>
                </Card.Body>
              </Card>
            </Grid>
          )}
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
            total={state.rounds.length || 1}
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
            disabled={state.generating}
            onPress={async () => {
              // Waiting for a little bit of time allows the button to animate
              // and prevents issues with pagination presses.
              await new Promise((resolve) =>
                setTimeout(() => resolve(true), 250)
              );
              await newRound(dispatch, state, { volunteerSitouts: [] });
              setRoundIndex(state.rounds.length);
              window.scrollTo(0, 0);
            }}
            color="gradient"
          >
            Generate round {state.rounds.length + 1}
          </Button>
        </Row>
        <Spacer y={2} />
      </Container>
    </>
  );
}

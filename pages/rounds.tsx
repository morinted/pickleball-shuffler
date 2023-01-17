import {
  Button,
  Card,
  Container,
  Row,
  Spacer,
  Text,
  Pagination,
  Badge,
  Col,
  Grid,
} from "@nextui-org/react";
import Head from "next/head";
import React, { Fragment, useEffect, useState } from "react";
import { PlayerBadge } from "../src/PlayerBadge";
import TeamBadges from "../src/TeamBadges";
import {
  newRound,
  useShufflerDispatch,
  useShufflerState,
} from "../src/useShuffler";

export default function Rounds() {
  const state = useShufflerState();
  const dispatch = useShufflerDispatch();

  const [roundIndex, setRoundIndex] = useState(0);
  useEffect(() => {
    if (state.rounds.length && roundIndex === 0) {
      setRoundIndex(state.rounds.length - 1);
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
        <Row justify="center" align="center">
          <Col>
            <Spacer y={1} />
            <Text h3>Round {roundIndex + 1}</Text>
          </Col>
        </Row>
        <Row align="center" justify="center">
          {!!sitOuts.length && (
            <Col>
              <div
                style={{
                  margin: "0 auto",
                  textAlign: "center",
                }}
              >
                <Text h4>Sitting out</Text>
                {sitOuts
                  .map(playerName)
                  .sort()
                  .map((name) => (
                    <Fragment key={name}>
                      <Spacer x={0.5} inline />
                      <PlayerBadge color="default">{name}</PlayerBadge>
                    </Fragment>
                  ))}
              </div>
              <Spacer y={0.25} />
            </Col>
          )}
        </Row>

        <Grid.Container gap={2} justify="center">
          {matches.map(([teamA, teamB], index) => {
            return (
              <Grid
                key={JSON.stringify([teamA, teamB])}
                xs={12}
                sm={6}
                md={4}
                xl={3}
              >
                <Spacer y={1} />
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
            total={state.rounds.length}
            page={roundIndex + 1}
            onChange={(page: number) => setRoundIndex(page - 1)}
          />
        </Row>
        <Spacer y={1} />
        <Row justify="space-around">
          <Button
            disabled={state.generating}
            onPress={() => {
              newRound(dispatch, state, { volunteerSitouts: [] });
              setRoundIndex(state.rounds.length);
            }}
          >
            Generate round {state.rounds.length + 1}
          </Button>
        </Row>
        <Spacer y={1} />
      </Container>
    </>
  );
}

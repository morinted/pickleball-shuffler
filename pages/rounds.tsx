import {
  Button,
  Card,
  Container,
  Row,
  Spacer,
  Text,
  Pagination,
} from "@nextui-org/react";
import Head from "next/head";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { useShuffler } from "../src/useShuffler";

export default function Rounds() {
  const { state, dispatch } = useShuffler();
  console.log(state);
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
        <title>Rounds - Pickleball Shuffler</title>
        <meta name="description" content="View player rounds" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Container>
        <Spacer y={1} />
        <Row justify="center" align="center">
          <Link href="/">
            <Text h1>Pickleball Shuffler 🃏</Text>
          </Link>
        </Row>
        <Row justify="center" align="center">
          <Text h3>Round {roundIndex + 1}</Text>
        </Row>
        <Row justify="center" align="center">
          <Text>Sitting out: {sitOuts.map(playerName).join(", ")}</Text>
        </Row>
        {matches.map(([teamA, teamB], index) => {
          return (
            <React.Fragment key={JSON.stringify([teamA, teamB])}>
              <Spacer y={1} />
              <Card>
                <Card.Body>
                  <Text h4>Court {index + 1}</Text>
                  <Text>{teamA.map(playerName).join(" and ")}</Text>
                  vs
                  <Text>{teamB.map(playerName).join(" and ")}</Text>
                </Card.Body>
              </Card>
            </React.Fragment>
          );
        })}
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
            onPress={() => {
              dispatch({
                type: "new-round",
                payload: {
                  volunteerSitouts: [],
                },
              });
              setRoundIndex(state.rounds.length);
            }}
          >
            Generate round {state.rounds.length + 1}
          </Button>
        </Row>
      </Container>
    </>
  );
}

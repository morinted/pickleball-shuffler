import {
  Button,
  Col,
  Container,
  Input,
  Row,
  Spacer,
  Text,
  Textarea,
} from "@nextui-org/react";
import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";
import { People } from "react-iconly";
import { Court } from "../src/Court";
import {
  newGame,
  useShufflerDispatch,
  useShufflerState,
} from "../src/useShuffler";

function NewGame() {
  const router = useRouter();
  const state = useShufflerState();
  const dispatch = useShufflerDispatch();

  // Rerendering on text input was very slow due to NextUI textarea element.
  const playersRef = useRef<HTMLTextAreaElement>(null);

  const [courts, setCourts] = useState(state.courts.toString());

  // Load last time's players.
  useEffect(() => {
    if (playersRef.current) {
      playersRef.current.value = state.players
        .map((player) => state.playersById[player].name)
        .join("\n");
    }
    setCourts(state.courts.toString());
  }, [state.players, state.courts]);

  const handleNewGame = () => {
    if (!playersRef.current) return;
    const names = Array.from(
      new Set(
        playersRef.current.value
          .split("\n")
          .map((x) => x.trim())
          .filter((x) => !!x)
      )
    );
    if (names.length < 4) return;
    const courtCount = parseInt(courts);
    if (courtCount < 1) return;
    newGame(dispatch, state, {
      names,
      courts: courtCount,
    });
    router.push("/rounds");
  };

  return (
    <>
      <Head>
        <title>New game - Jumbled Doubles</title>
        <meta name="description" content="Add players" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Container xs>
        <Spacer y={1} />
        <Row justify="center" align="center">
          <Col>
            <label>
              <Row align="center">
                <People />
                <Spacer x={0.25} inline />
                <Text id="players-label">
                  Who's playing? One person per line.
                </Text>
              </Row>
              <Spacer y={0.5} />
              <Textarea
                autoFocus
                ref={playersRef}
                id="player-input"
                aria-labelledby="players-label"
                itemID="player-input-label"
                placeholder={"Jo Swift\nKathryn Lob"}
                minRows={6}
                maxRows={14}
                fullWidth
              />
            </label>
            <Spacer y={1} />
            <label>
              <Row align="center">
                <Court />
                <Spacer x={0.25} inline />
                <Text id="courts-label">How many courts are available?</Text>
              </Row>
              <Spacer y={0.5} />
              <Input
                id="court-input"
                aria-labelledby="courts-label"
                type="number"
                min={1}
                value={courts}
                onChange={(e) => setCourts(e.target.value)}
                fullWidth
              />
            </label>
            <Spacer y={1} />
            <Button onPress={() => handleNewGame()}>Let's play!</Button>
          </Col>
        </Row>
      </Container>
    </>
  );
}

//
export default NewGame;

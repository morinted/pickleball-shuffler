import {
  Button,
  Col,
  Container,
  Input,
  Row,
  Spacer,
  Textarea,
  useInput,
} from "@nextui-org/react";
import dynamic from "next/dynamic";
import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";
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
        .map((player) => player.name)
        .join("\n");
    }
    setCourts(state.courts.toString());
  }, [state.players, state.courts]);

  const handleNewGame = () => {
    if (!playersRef.current) return;
    const names = playersRef.current.value
      .split("\n")
      .map((x) => x.trim())
      .filter((x) => !!x);
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
            <Textarea
              ref={playersRef}
              id="player-input"
              itemID="player-input-label"
              label="Who's playing? Put one name per line."
              placeholder={"Jo Swift\nKathryn Lob"}
              fullWidth
            />
            <Spacer y={1} />
            <Input
              id="court-input"
              label="How many courts?"
              type="number"
              min={1}
              value={courts}
              onChange={(e) => setCourts(e.target.value)}
              fullWidth
            />
            <Spacer y={0.5} />
            <Button onPress={() => handleNewGame()}>Let's play!</Button>
          </Col>
        </Row>
      </Container>
    </>
  );
}

//
export default dynamic(() => Promise.resolve(NewGame), { ssr: false });

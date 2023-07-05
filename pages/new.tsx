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
import { AddUser, Delete, People, User } from "react-iconly";
import { Court } from "../src/Court";
import {
  newGame,
  useShufflerDispatch,
  useShufflerState,
  useShufflerWorker,
} from "../src/useShuffler";

function NewGame() {
  const router = useRouter();
  const state = useShufflerState();
  const { playersById } = state;
  const dispatch = useShufflerDispatch();
  const worker = useShufflerWorker();

  // Rerendering on text input was very slow due to NextUI textarea element.
  const playersRef = useRef<HTMLTextAreaElement>(null);

  const [players, setPlayers] = useState<string[]>(state.players);

  const [courts, setCourts] = useState(state.courts.toString());

  // Load last time's players.
  useEffect(() => {
    const playerIdsSorted = [...state.players].sort((a, b) =>
      playersById[a].name.localeCompare(playersById[b].name)
    );
    setPlayers(playerIdsSorted);
    setCourts(state.courts.toString());
  }, [state.players, state.courts]);

  const handleNewGame = async () => {
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
    await newGame(dispatch, state, worker, {
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
                  Who's playing?{" "}
                  <Text i color="$gray800">
                    {players.length && `${players.length} players`}
                  </Text>
                </Text>
                <div style={{ flexGrow: "1" }} />
                <Button size="xs" color="secondary" flat>
                  Reset players
                </Button>
              </Row>
              <Spacer y={0.5} />
              <Row align="flex-end">
                <Textarea
                  autoFocus
                  ref={playersRef}
                  minRows={1}
                  maxRows={10}
                  itemID="player-input-label"
                  placeholder="Jo Swift, Kathryn Lob"
                  bordered
                  label="Add player"
                  color="default"
                  css={{
                    flexGrow: 1,
                  }}
                />
                <Spacer x={0.5} />
                <Button
                  auto
                  color="primary"
                  aria-label="Submit add player"
                  icon={<AddUser />}
                  type="submit"
                />
              </Row>
              <Spacer y={0.5} />
              {players.map((id, index) => (
                <>
                  <Row key={id} align="center">
                    <User primaryColor="#888" size="medium" />
                    <Input
                      aria-label="Player"
                      css={{
                        flexGrow: 1,
                      }}
                      value={playersById[id].name}
                      type="text"
                      underlined
                      onChange={(e) => setCourts(e.target.value)}
                      fullWidth
                    />
                    <Spacer x={0.5} />
                    <Button
                      auto
                      flat
                      color="secondary"
                      aria-label={`Remove player named ${playersById[id].name}`}
                      icon={<Delete />}
                      onPress={() => {
                        // Toggle delete for this player
                        setPlayers((players) =>
                          players.filter((x) => x !== id)
                        );
                      }}
                    />
                  </Row>
                  <Spacer y={0.1} />
                </>
              ))}
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
                bordered
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

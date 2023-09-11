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
import { Fragment, useEffect, useRef, useState } from "react";
import { AddUser, Delete, People, User } from "react-iconly";
import { Court } from "../src/Court";
import {
  newGame,
  useShufflerDispatch,
  useShufflerState,
  useShufflerWorker,
} from "../src/useShuffler";
import { ResetPlayersModal } from "../src/ResetPlayersModal";

function NewGame() {
  const router = useRouter();
  const state = useShufflerState();
  const { playersById } = state;
  const dispatch = useShufflerDispatch();
  const worker = useShufflerWorker();
  const [modal, setModal] = useState<"none" | "reset-players">("none");

  // Rerendering on text input was very slow due to NextUI textarea element.
  const playersRef = useRef<HTMLTextAreaElement>(null);

  const [players, setPlayers] = useState<string[]>(state.players);

  const [courts, setCourts] = useState(state.courts.toString());

  const handleAddPlayers = () => {
    const names = Array.from(
      new Set(
        (playersRef.current?.value || "")
          .split(/[\n,]+/)
          .map((x) => x.trim())
          .filter((x) => !!x)
      )
    );
    setPlayers((players) => [...players, ...names]);
    if (playersRef.current) playersRef.current.value = "";
    playersRef.current?.focus();
  };

  // Load last time's players.
  useEffect(() => {
    const playerNames = [...state.players]
      .map((id) => playersById[id].name)
      .sort((a, b) => a.localeCompare(b));
    setPlayers(playerNames);
    setCourts(state.courts.toString());
  }, [state.players, state.courts]);

  const handleNewGame = async () => {
    if (!playersRef.current) return;
    const names = players;
    if (names.length < 4) return;
    const courtCount = parseInt(courts);
    if (courtCount < 1) return;
    await newGame(dispatch, state, worker, {
      names,
      courts: courtCount,
    });
    router.push("/rounds");
  };

  const handleResetPlayers = () => {
    setModal("reset-players");
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
        <ResetPlayersModal
          open={modal === "reset-players"}
          onClose={() => setModal("none")}
          onSubmit={() => {
            setPlayers([]);
            playersRef.current?.focus();
            setModal("none");
          }}
        />
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
                <Button
                  size="xs"
                  color="secondary"
                  flat
                  onClick={() => handleResetPlayers()}
                >
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
                  label="Add players"
                  color="default"
                  css={{
                    flexGrow: 1,
                  }}
                />
                <Spacer x={0.5} />
                <Button
                  auto
                  color="primary"
                  aria-label="Add players in text box"
                  icon={<AddUser />}
                  type="button"
                  onClick={() => handleAddPlayers()}
                />
              </Row>
              <Spacer y={0.5} />
              {players.map((name, index) => (
                <Fragment key={index}>
                  <Row align="center">
                    <User primaryColor="#888" size="medium" />
                    <Text size="$sm" color="#555" style={{ width: "1rem" }}>
                      {index + 1}
                    </Text>
                    <Spacer x={0.25} />
                    <Input
                      aria-label="Player"
                      css={{
                        flexGrow: 1,
                      }}
                      value={name}
                      type="text"
                      underlined
                      onChange={(e) => {
                        const newName = e.currentTarget.value;
                        setPlayers([
                          ...players.slice(0, index),
                          newName,
                          ...players.slice(index + 1),
                        ]);
                      }}
                      fullWidth
                    />
                    <Spacer x={0.5} />
                    <Button
                      auto
                      flat
                      color="secondary"
                      aria-label={`Remove player named ${name}`}
                      icon={<Delete />}
                      onPress={() => {
                        // Delete this player
                        setPlayers((players) => [
                          ...players.slice(0, index),
                          ...players.slice(index + 1),
                        ]);
                      }}
                    />
                  </Row>
                  <Spacer y={0.1} />
                </Fragment>
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

import {
  Button,
  Col,
  Container,
  Input,
  Row,
  Spacer,
  Switch,
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

  const [formStatus, setFormStatus] = useState<"edit" | "validating">("edit");
  const [modal, setModal] = useState<"none" | "reset-players">("none");

  // Rerendering on text input was very slow due to NextUI textarea element.
  const playersRef = useRef<HTMLTextAreaElement>(null);

  const [players, setPlayers] = useState<string[]>(state.players);
  const [courts, setCourts] = useState(state.courts.toString());
  const [customizeCourtNames, setCustomizeCourtNames] = useState(false);
  const [courtNames, setCourtNames] = useState<string[]>([]);

  const handleAddPlayers = () => {
    if (!playersRef.current?.value) return;
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

  // Load last time's players and court names.
  useEffect(() => {
    const playerNames = [...state.players]
      .map((id) => playersById[id].name)
      .sort((a, b) => a.localeCompare(b));
    setPlayers(playerNames);
    setCourts(state.courts.toString());

    if (state.courtNames.length) {
      setCustomizeCourtNames(true);
      setCourtNames(state.courtNames);
    }
  }, [state.players, state.courts, state.courtNames]);

  const handleNewGame = async () => {
    if (!playersRef.current) return;
    const names = players;
    if (names.length < 4) {
      setFormStatus("validating");
      return;
    }
    const courtCount = parseInt(courts);
    if (isNaN(courtCount) || courtCount < 1) {
      setFormStatus("validating");
      return;
    }
    if (
      customizeCourtNames &&
      new Set(courtNames.map((x) => x.trim())).size !== courtNames.length
    ) {
      setFormStatus("validating");
      return;
    }
    await newGame(dispatch, state, worker, {
      names,
      courts: courtCount,
      courtNames: customizeCourtNames ? courtNames : [],
    });
    router.push("/rounds");
  };

  const handleResetPlayers = () => {
    setModal("reset-players");
  };

  const playerError = formStatus === "validating" && players.length < 4;
  const courtsError =
    formStatus === "validating" &&
    (isNaN(parseInt(courts)) || parseInt(courts) < 1);
  const courtNamesError =
    formStatus === "validating" &&
    new Set(courtNames.map((x) => x.trim())).size !== courtNames.length;

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
                    {players.length ? `${players.length} players` : ""}
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
                  color={playerError ? "error" : "default"}
                  css={{
                    flexGrow: 1,
                  }}
                  helperColor="error"
                  helperText={
                    players.length < 4 && formStatus === "validating"
                      ? "At least 4 players are required"
                      : undefined
                  }
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
                      variant="flat"
                      color="secondary"
                      aria-label={`Remove player named ${name}`}
                      startContent={<Delete />}
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
                <Text
                  id="courts-label"
                  color={courtsError ? "error" : "default"}
                >
                  How many courts are available?{" "}
                  <Text i color="$gray800">
                    {Math.floor(players.length / 4) ? (
                      <>Enough players for {Math.floor(players.length / 4)}</>
                    ) : (
                      ""
                    )}
                  </Text>
                </Text>
              </Row>
              <Spacer y={0.5} />
              <Input
                id="court-input"
                aria-labelledby="courts-label"
                type="number"
                bordered
                min={1}
                helperColor="error"
                helperText={
                  courtsError ? "Courts must be 1 or greater." : undefined
                }
                value={courts}
                onChange={(e) => setCourts(e.target.value)}
                fullWidth
              />
            </label>
            <Spacer y={1} />
            <label>
              <Row>
                <Text>Customize court names</Text>
                <Spacer x={1} />
                <Switch
                  checked={customizeCourtNames}
                  onChange={(e) => setCustomizeCourtNames(e.target.checked)}
                />
              </Row>
            </label>
            {customizeCourtNames && (
              <>
                <Spacer y={0.5} />
                <Row>
                  <Button
                    type="button"
                    size="sm"
                    auto
                    onClick={() =>
                      setCourtNames(
                        Array.from(
                          new Array(Math.max(parseInt(courts) || 0, 0)),
                          (_, i) => ((i + 1) * 2).toString()
                        )
                      )
                    }
                  >
                    Evens (2, 4, 6…)
                  </Button>
                  <Spacer x={0.5} />
                  <Button
                    type="button"
                    size="sm"
                    auto
                    onClick={() =>
                      setCourtNames(
                        Array.from(
                          new Array(Math.max(parseInt(courts) || 0, 0)),
                          (_, i) => ((i + 1) * 2 - 1).toString()
                        )
                      )
                    }
                  >
                    Odds (1, 3, 5…)
                  </Button>
                  <Spacer x={0.5} />
                  <Button
                    type="button"
                    color="secondary"
                    size="sm"
                    auto
                    onClick={() =>
                      setCourtNames(
                        Array.from(
                          new Array(Math.max(parseInt(courts) || 0, 0)),
                          (_, i) => (i + 1).toString()
                        )
                      )
                    }
                  >
                    Reset
                  </Button>
                </Row>
                <ol>
                  {Array.from(
                    new Array(Math.max(parseInt(courts) || 0, 0)),
                    (_, i) => courtNames[i] || (i + 1).toString()
                  ).map((courtName, index, allNames) => (
                    <li>
                      <Spacer y={1} />
                      <Input
                        value={courtName}
                        onChange={(e) => {
                          const name = e.target.value;
                          const newNames = [...courtNames];
                          newNames[index] = name;
                          setCourtNames(newNames);
                        }}
                        helperColor="error"
                        helperText={
                          courtNamesError &&
                          allNames.some(
                            (name, j) =>
                              j < index && name.trim() === courtName.trim()
                          )
                            ? "Duplicated court name"
                            : undefined
                        }
                      />
                    </li>
                  ))}
                </ol>
              </>
            )}
            <Spacer y={1} />
            <Button
              onPress={() => {
                if (playersRef.current?.value) {
                  handleAddPlayers();
                } else {
                  handleNewGame();
                }
              }}
            >
              Let's play!
            </Button>
          </Col>
        </Row>
      </Container>
    </>
  );
}

//
export default NewGame;

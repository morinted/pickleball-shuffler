import {
  Button,
  Container,
  Input,
  Row,
  Spacer,
  Text,
  Textarea,
} from "@nextui-org/react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useShuffler } from "../src/useShuffler";

export default function Players() {
  const router = useRouter();
  const { state, dispatch } = useShuffler();
  const [players, setPlayers] = useState("");
  const [courts, setCourts] = useState(state.courts);

  // Load last time's players.
  useEffect(() => {
    setPlayers(state.players.map((player) => player.name).join("\n"));
    setCourts(state.courts);
  }, [state.players, state.courts]);

  const handleNewGame = () => {
    const names = players
      .split("\n")
      .map((x) => x.trim())
      .filter((x) => !!x);
    if (names.length < 4) return;
    if (courts < 1) return;
    dispatch({
      type: "new-game",
      payload: {
        names,
        courts,
      },
    });
    router.push("/rounds");
  };
  return (
    <>
      <Head>
        <title>Players - Pickleball Shuffler</title>
        <meta name="description" content="Add players" />
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
          <Textarea
            label="Who's playing? Put one name per line."
            placeholder={"Jo Swift\nKathryn Lob"}
            value={players}
            onChange={(e) => setPlayers(e.target.value)}
          />
        </Row>
        <Spacer y={1} />
        <Row justify="center" align="center">
          <Input
            label="How many courts?"
            type="number"
            min={1}
            value={courts}
            onChange={(e) => setCourts(parseInt(e.target.value))}
          />
        </Row>
        <Spacer y={0.5} />
        <Row justify="center" align="center">
          <Button onPress={() => handleNewGame()}>Let's play!</Button>
        </Row>
      </Container>
    </>
  );
}

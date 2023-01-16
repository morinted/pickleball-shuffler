import { Button, Container, Row, Spacer, Text } from "@nextui-org/react";
import Link from "next/link";
import Head from "next/head";

export default function Home() {
  return (
    <>
      <Head>
        <title>Jumbled doubles: pickleball shuffler</title>
        <meta name="description" content="Fair random doubles play" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Container>
        <Spacer y={1} />
        <Row>
          <Text h2>
            <Text
              css={{
                textGradient: "235deg, $blue600 -20%, $pink600 50%",
              }}
              h2
              as="span"
            >
              Jumble
            </Text>{" "}
            your social play.
          </Text>
        </Row>
        <Row justify="center" align="center">
          <Text>
            Fairly shuffle doubles games so that you play with and against
            everyone.
          </Text>
        </Row>

        <Spacer y={0.5} />

        <Row justify="center" align="center">
          <Link href="/new">
            <Button>Start shufflin'</Button>
          </Link>
        </Row>
      </Container>
    </>
  );
}

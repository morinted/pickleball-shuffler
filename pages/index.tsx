import { Button, Container, Row, Spacer, Text } from "@nextui-org/react";
import Link from "next/link";
import Head from "next/head";

export default function Home() {
  return (
    <>
      <Head>
        <title>Pickleball Shuffler</title>
        <meta name="description" content="Fair random doubles play" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Container>
        <Spacer y={1} />
        <Row justify="center" align="center">
          <Text h1>Pickleball Shuffler 🃏</Text>
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
            <Button>Get shufflin'</Button>
          </Link>
        </Row>
      </Container>
    </>
  );
}

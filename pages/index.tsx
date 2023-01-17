import { Button, Col, Container, Row, Spacer, Text } from "@nextui-org/react";
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
          <Col>
            <Text h2>
              <Text
                css={{
                  textGradient: "235deg, $blue600 -20%, $pink600 50%",
                }}
                h2
                as="span"
              >
                Jumble&nbsp;
              </Text>
              your social play.
            </Text>
            <Text>
              Fairly shuffle doubles games so that you play with and against
              everyone.
            </Text>

            <Spacer y={2} />
            <Text h3>Why jumble?</Text>
            <Text>
              Social play can be hard to do <Text b>fairly.</Text>
            </Text>
            <Text>
              Using Jumbled Doubles, you can ensure an even distribution of sit
              outs, partners, and opponents across any number of courts.
            </Text>
            <Text>
              It's an alternative to a round-robin format (fixed partnerships)
              and ladder courts (more competitive).
            </Text>

            <Spacer y={1} />
            <Link href="/new">
              <Button>Start shufflin'</Button>
            </Link>

            <Spacer y={2} />
            <Text h3>Compatible sports</Text>
            <Text as="div">
              This website is for any sport where you play as teams of two:
              <ul>
                <li>🥒 Pickleball</li>
                <li>🎾 Padel & Tennis</li>
                <li>🏓 Table tennis (ping-pong)</li>
                <li>🏸 Badminton</li>
                <li>🏐 Roundnet (spike ball)</li>
              </ul>
            </Text>

            <Spacer y={1.5} />

            <Text h3>Beta</Text>
            <Text>
              <Text b color="primary">
                Jumbled Doubles is new!
              </Text>{" "}
              New features are{" "}
              <a href="https://github.com/morinted/pickleball-shuffler/issues">
                planned
              </a>{" "}
              and the shuffling may not be perfect.
            </Text>
            <Text>
              If you find{" "}
              <Text color="error" b>
                problems
              </Text>{" "}
              or have{" "}
              <Text color="secondary" b>
                feedback
              </Text>{" "}
              then please send an email to{" "}
              <a href="mailto:jumbled@ted.mozmail.com">
                jumbled@ted.mozmail.com
              </a>
            </Text>
          </Col>
        </Row>
        <Spacer y={0.5} />
      </Container>
    </>
  );
}

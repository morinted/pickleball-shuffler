import { Button, Spacer } from "@nextui-org/react";
import Link from "next/link";
import Head from "next/head";
import { ResumeActiveGame } from "../src/ResumeActiveGame";

export default function Home() {
  return (
    <>
      <Head>
        <title>Jumbled Doubles</title>
        <meta
          name="description"
          content="Fair random doubles play for any activity that's played in teams of two."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <section className="container">
        <Spacer y={1} />
        <div className="flex flex-col">
          {/* <ResumeActiveGame /> */}
          <h2 className="text-4xl font-semibold">
            <span className="text-transparent bg-clip-text bg-gradient-to-l from-blue-600 to-pink-600">
              Jumble&nbsp;
            </span>
            your social play.
          </h2>
          <p>
            Fairly shuffle doubles games so that you play with and against
            everyone.
          </p>

          <Spacer y={2} />
          <h3>Why jumble?</h3>
          <p>
            Social play can be hard to do <b>fairly.</b>
          </p>
          <p>
            Using Jumbled Doubles, you can ensure an even distribution of sit
            outs, partners, and opponents across any number of courts.
          </p>
          <p>
            It's an alternative to a round-robin format (fixed partnerships) and
            ladder courts (more competitive).
          </p>

          <Spacer y={1} />
          <Link href="/new">
            <Button>Start shufflin'</Button>
          </Link>

          <Spacer y={2} />
          <h3>Compatible sports</h3>
          <p>
            This site is for any sport or activity where you play in teams of
            two:
          </p>
          <ul>
            <li>🥒 Pickleball</li>
            <li>🎾 Tennis</li>
            <li>🏓 Table tennis (ping-pong)</li>
            <li>🏸 Badminton</li>
            <li>🎾 Padel</li>
            <li>🏐 Roundnet (spike ball)</li>
            <li>🃏 Card games (Bridge, Euchre, etc.)</li>
          </ul>

          <Spacer y={1.5} />

          <h3>Beta</h3>
          <p>
            <span className="b primary">Jumbled Doubles is new!</span> New
            features are{" "}
            <a href="https://github.com/morinted/pickleball-shuffler/issues">
              planned
            </a>{" "}
            and the shuffling may not be perfect.
          </p>
          <p>
            If you find <span className="text-danger font-bold">problems</span>{" "}
            or have <span className="text-secondary font-bold">feedback</span>{" "}
            then please send an email to{" "}
            <a href="mailto:jumbled@ted.mozmail.com">jumbled@ted.mozmail.com</a>
          </p>
        </div>
        <Spacer y={2} />
      </section>
    </>
  );
}

import { Button, Link, Spacer } from "@nextui-org/react";
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
          <ResumeActiveGame />
          <h2 className="text-4xl font-semibold mb-2">
            <span className="text-transparent bg-clip-text bg-gradient-to-l from-blue-500 to-pink-500 to-60%">
              Jumble&nbsp;
            </span>
            your social play.
          </h2>
          <p>
            Fairly shuffle doubles games so that you play with and against
            everyone.
          </p>
          <Spacer y={8} />
          <h3 className="text-xl font-semibold mb-2">Why jumble?</h3>
          <p className="mb-1">
            Social play can be hard to do <b>fairly.</b>
          </p>
          <p className="mb-1">
            Using Jumbled Doubles, you can ensure an even distribution of sit
            outs, partners, and opponents across any number of courts.
          </p>
          <p>
            It's an alternative to a round-robin format (fixed partnerships) and
            ladder courts (more competitive).
          </p>

          <Link href="/new">
            <Button color="primary" className="mt-4">
              Start shufflin'
            </Button>
          </Link>

          <Spacer y={8} />

          <h3 className="text-xl font-semibold mb-2">Compatible sports</h3>
          <p>
            This site is for any sport or activity where you play in teams of
            two:
          </p>
          <ul className="list-disc my-3 list-inside">
            <li>🥒 Pickleball</li>
            <li>🎾 Tennis</li>
            <li>🏓 Table tennis (ping-pong)</li>
            <li>🏸 Badminton</li>
            <li>🎾 Padel</li>
            <li>🏐 Roundnet (spike ball)</li>
            <li>🃏 Card games (Bridge, Euchre, etc.)</li>
          </ul>

          <Spacer y={8} />

          <h3 className="text-xl font-semibold mb-2">Beta</h3>
          <p>
            <span className="font-bold text-primary">
              Jumbled Doubles is new!
            </span>{" "}
            New features are{" "}
            <Link
              color="primary"
              href="https://github.com/morinted/pickleball-shuffler/issues"
            >
              planned
            </Link>{" "}
            and the shuffling may not be perfect.
          </p>
          <p>
            If you find <span className="text-danger font-bold">problems</span>{" "}
            or have <span className="text-secondary font-bold">feedback</span>{" "}
            then please send an email to{" "}
            <Link color="primary" href="mailto:jumbled@ted.mozmail.com">
              jumbled@ted.mozmail.com
            </Link>
          </p>
        </div>
        <Spacer y={10} />
      </section>
    </>
  );
}

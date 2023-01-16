import type { AppProps } from "next/app";
import { Grandstander } from "@next/font/google";
import { NextUIProvider, Navbar, Text, Row, Button } from "@nextui-org/react";
import { ShufflerProvider } from "../src/useShuffler";
import { useRouter } from "next/router";
import Link from "next/link";

const grandstander = Grandstander({ subsets: ["latin"] });

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  return (
    <NextUIProvider>
      <ShufflerProvider>
        <main>
          <Navbar isBordered>
            <Navbar.Brand>
              <Link href="/">
                <Row align="center" justify="center">
                  <div
                    className={grandstander.className}
                    style={{
                      textAlign: "center",
                      lineHeight: "1.15rem",
                      fontSize: "1.5rem",
                      marginTop: "0.5rem",
                      color: "black",
                      fontWeight: 600,
                    }}
                  >
                    <span style={{ fontSize: "1.1em" }}>Jumbled</span>
                    <br />
                    Doubles
                  </div>
                </Row>
              </Link>
            </Navbar.Brand>

            <Navbar.Content>
              <Navbar.Item id="new-game-item">
                <Link href="/new" id="new-game-button">
                  <Button auto flat>
                    New game
                  </Button>
                </Link>
              </Navbar.Item>
            </Navbar.Content>
          </Navbar>
          <Component {...pageProps} />
        </main>
      </ShufflerProvider>
    </NextUIProvider>
  );
}

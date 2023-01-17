import { Button, Navbar, Row } from "@nextui-org/react";
import Link from "next/link";
import { Grandstander } from "@next/font/google";
// @ts-expect-error
import CircleType from "circletype";
import { useEffect } from "react";
import { useLoadState } from "./useShuffler";

const grandstander = Grandstander({ subsets: ["latin"] });

export function Layout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    new CircleType(document.getElementById("jumbled"))
      .radius(200)
      .forceHeight(false);
  }, []);
  useLoadState();
  return (
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
                  marginLeft: "0.5rem",
                  marginTop: "0.5rem",
                  color: "black",
                  fontWeight: 600,
                }}
              >
                <div
                  style={{ fontSize: "1.1em", height: "0.2em" }}
                  id="jumbled"
                >
                  Jumbled
                </div>
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
      {children}
    </main>
  );
}

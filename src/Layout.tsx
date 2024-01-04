import {
  Badge,
  Button,
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
} from "@nextui-org/react";
import Link from "next/link";
import { Grandstander } from "next/font/google";
// @ts-expect-error
import CircleType from "circletype";
import { useEffect } from "react";
import { useLoadState } from "./useShuffler";
import { useRouter } from "next/router";
import clsx from "clsx";
import { Inter as FontSans } from "next/font/google";

const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
});

const grandstander = Grandstander({ subsets: ["latin"] });

export function Layout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    new CircleType(document.getElementById("jumbled"))
      .radius(200)
      .forceHeight(false);
  }, []);
  const router = useRouter();
  useLoadState();
  return (
    <div
      className={clsx(
        "relative flex flex-col h-screen min-h-screen bg-background font-sans antialiased",
        fontSans.variable
      )}
    >
      <Navbar className="bg-background" isBordered>
        <NavbarBrand>
          <Link href="/">
            <div className="flex justify-center items-center">
              <div
                className={grandstander.className}
                style={{
                  textAlign: "center",
                  lineHeight: "1.15rem",
                  fontSize: "1.5rem",
                  marginLeft: "0.7rem",
                  marginTop: "0.5rem",
                  color: "black",
                  fontWeight: 600,
                  letterSpacing: "0.05rem",
                }}
              >
                <div
                  style={{
                    fontSize: "1.1em",
                    height: "0.2em",
                    marginLeft: "-0.2rem",
                    fontWeight: 600,
                    letterSpacing: "0.15rem",
                  }}
                  id="jumbled"
                >
                  Jumbled
                </div>
                <br />
                Doubles
              </div>
              <div className="text-secondary px-1 ml-3 h-min text-xs font-bold border-secondary border-2 rounded">
                Beta
              </div>
            </div>
          </Link>
        </NavbarBrand>

        <NavbarContent justify="end">
          {router.asPath === "/" && (
            <NavbarItem id="new-game-item">
              <Link href="/new" id="new-game-button">
                <Button variant="flat" color="primary">
                  New game
                </Button>
              </Link>
            </NavbarItem>
          )}
        </NavbarContent>
      </Navbar>
      <main className="container mx-auto max-w-7xl pt-4 px-6 flex-grow">
        {children}
      </main>
    </div>
  );
}

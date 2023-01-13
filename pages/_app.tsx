import type { AppProps } from "next/app";
import { NextUIProvider } from "@nextui-org/react";
import { ShufflerProvider } from "../src/useShuffler";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <NextUIProvider>
      <ShufflerProvider>
        <Component {...pageProps} />
      </ShufflerProvider>
    </NextUIProvider>
  );
}

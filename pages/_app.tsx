import type { AppProps } from "next/app";
import { NextUIProvider } from "@nextui-org/react";
import { ShufflerProvider } from "../src/useShuffler";
import { Layout } from "../src/Layout";
import "../src/global.css";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <NextUIProvider>
      <ShufflerProvider>
        <Layout>
          <Component {...pageProps} />
        </Layout>
      </ShufflerProvider>
    </NextUIProvider>
  );
}

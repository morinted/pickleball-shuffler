import { getNextBestRound, PlayerId, Round } from "./heuristics";

addEventListener(
  "message",
  async (event: MessageEvent<[Round[], PlayerId[], number, PlayerId[]]>) => {
    const round = await getNextBestRound(...event.data);
    postMessage(round);
  }
);

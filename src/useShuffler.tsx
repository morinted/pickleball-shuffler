import * as React from "react";
import {
  getNextBestRound,
  Player,
  PlayerId,
  Round,
} from "./matching/heuristics";
import { v4 as uuidv4 } from "uuid";

type Action =
  | {
      type: "new-game";
      payload: {
        names: string[];
        courts: number;
      };
    }
  | {
      type: "new-round";
      payload: {
        volunteerSitouts: PlayerId[];
      };
    };
type Dispatch = (action: Action) => void;
type State = {
  players: Player[];
  rounds: Round[];
  courts: number;
  playersById: Record<PlayerId, Player>;
};
type ShufflerProviderProps = { children: React.ReactNode };

const ShufflerStateContext = React.createContext<
  { state: State; dispatch: Dispatch } | undefined
>(undefined);

function createPlayers(names: string[]) {
  return names.map((name) => {
    return { name, id: uuidv4() };
  });
}

function playersById(previous: Record<PlayerId, Player>, players: Player[]) {
  const byId = { ...previous };
  players.forEach((player) => {
    byId[player.id] = player;
  });
  return byId;
}

function shufflerReducer(state: State, action: Action) {
  switch (action.type) {
    case "new-game": {
      const { payload } = action;
      const players = createPlayers(payload.names);
      return {
        ...state,
        players,
        playersById: playersById(state.playersById, players),
        courts: payload.courts,
        rounds: [getNextBestRound([], players, payload.courts)],
      };
    }
    case "new-round": {
      const nextRound = getNextBestRound(
        state.rounds,
        state.players,
        state.courts
      );
      return {
        ...state,
        rounds: [...state.rounds, nextRound],
      };
    }
    default: {
      throw new Error(`Unhandled action type: ${action.type}`);
    }
  }
}

function ShufflerProvider({ children }: ShufflerProviderProps) {
  const [state, dispatch] = React.useReducer(shufflerReducer, {
    players: [],
    playersById: {},
    rounds: [],
    courts: 2,
  });
  const value = { state, dispatch };
  return (
    <ShufflerStateContext.Provider value={value}>
      {children}
    </ShufflerStateContext.Provider>
  );
}

function useShuffler() {
  const context = React.useContext(ShufflerStateContext);
  if (context === undefined) {
    throw new Error("useShuffler must be used within a ShufflerProvider");
  }
  return context;
}

export { ShufflerProvider, useShuffler };

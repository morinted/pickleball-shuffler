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
      type: "load-from-cache";
      payload: null;
    }
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
  cacheLoaded: boolean;
};
type ShufflerProviderProps = { children: React.ReactNode };

const defaultState: State = {
  players: [],
  playersById: {},
  rounds: [],
  courts: 2,
  cacheLoaded: false,
};

const ShufflerStateContext = React.createContext<
  { state: State; dispatch: Dispatch } | undefined
>(undefined);

function createPlayers(names: string[]) {
  return names.map((name) => {
    return { name, id: uuidv4() };
  });
}

function getPlayersById(previous: Record<PlayerId, Player>, players: Player[]) {
  const byId = { ...previous };
  players.forEach((player) => {
    byId[player.id] = player;
  });
  return byId;
}

function loadFromCache(previousState: State): State {
  const existingState = previousState || defaultState;
  if (typeof window === "undefined") return existingState;
  const storageState = window.localStorage.getItem("state");
  if (storageState === null) {
    return existingState;
  }
  try {
    const { players, rounds, courts } = JSON.parse(storageState);
    if (!Array.isArray(players) || !Array.isArray(rounds) || isNaN(courts))
      return existingState;

    const playersById = getPlayersById({}, players);
    return { players, playersById, rounds, courts, cacheLoaded: true };
  } catch (e) {
    return existingState;
  }
}

function cacheState(state: State): State {
  if (typeof window === "undefined") return state;
  window.setTimeout(() => {
    const { players, courts, rounds } = state;
    window.localStorage.setItem(
      "state",
      JSON.stringify({ players, courts, rounds })
    );
  }, 0);
  return state;
}

function shufflerReducer(state: State, action: Action) {
  switch (action.type) {
    case "new-game": {
      const { payload } = action;
      const players = createPlayers(payload.names);

      return cacheState({
        ...state,
        players,
        playersById: getPlayersById(state.playersById, players),
        courts: payload.courts,
        rounds: [getNextBestRound([], players, payload.courts)],
      });
    }
    case "load-from-cache": {
      return loadFromCache(state);
    }
    case "new-round": {
      const nextRound = getNextBestRound(
        state.rounds,
        state.players,
        state.courts
      );
      return cacheState({
        ...state,
        rounds: [...state.rounds, nextRound],
      });
    }
  }
}

function ShufflerProvider({ children }: ShufflerProviderProps) {
  const [state, dispatch] = React.useReducer(shufflerReducer, defaultState);
  const value = { state, dispatch };
  return (
    <ShufflerStateContext.Provider value={value}>
      {children}
    </ShufflerStateContext.Provider>
  );
}

function useShuffler() {
  const context = React.useContext(ShufflerStateContext);
  React.useEffect(() => {
    if (!context) return;
    const { state, dispatch } = context;
    if (state.cacheLoaded === false) {
      dispatch({ type: "load-from-cache", payload: null });
    }
  }, [context?.state?.cacheLoaded]);
  if (context === undefined) {
    throw new Error("useShuffler must be used within a ShufflerProvider");
  }
  return context;
}

export { ShufflerProvider, useShuffler };

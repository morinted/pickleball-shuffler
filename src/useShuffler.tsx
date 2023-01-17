import * as React from "react";
import {
  getNextBestRound,
  Player,
  PlayerId,
  Round,
} from "./matching/heuristics";
import { v4 as uuidv4 } from "uuid";

type NewRoundOptions = {
  volunteerSitouts: PlayerId[];
  replace?: boolean;
};

type NewGameOptions = {
  names: string[];
  courts: number;
};

type Action =
  | {
      type: "load-from-cache";
      payload: null;
    }
  | {
      type: "new-game-start";
      payload: {
        players: Player[];
        playersById: Record<PlayerId, Player>;
        courts: number;
      };
    }
  | {
      type: "new-game";
      payload: Round;
    }
  | {
      type: "new-game-fail";
      payload: { error: Error };
    }
  | {
      type: "new-round";
      payload: Round;
    }
  | {
      type: "new-round-start";
      payload: NewRoundOptions;
    }
  | {
      type: "new-round-fail";
      payload: { error: Error };
    };
type Dispatch = (action: Action) => void;
type State = {
  players: Player[];
  rounds: Round[];
  courts: number;
  playersById: Record<PlayerId, Player>;
  generating: boolean;
  cacheLoaded: boolean;
};
type ShufflerProviderProps = { children: React.ReactNode };

const defaultState: State = {
  players: [],
  playersById: {},
  rounds: [],
  courts: 2,
  generating: false,
  cacheLoaded: false,
};

const ShufflerStateContext = React.createContext<State | undefined>(undefined);
const ShufflerDispatchContext = React.createContext<Dispatch | undefined>(
  undefined
);

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
    return {
      players,
      playersById,
      rounds,
      courts,
      cacheLoaded: true,
      generating: false,
    };
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
    case "new-game-start": {
      const { payload } = action;
      const { players, playersById, courts } = payload;

      return cacheState({
        ...state,
        players,
        playersById,
        courts,
        rounds: [],
        generating: true,
      });
    }
    case "new-game": {
      const { payload } = action;

      return cacheState({
        ...state,
        rounds: [payload],
        generating: false,
      });
    }
    case "load-from-cache": {
      return loadFromCache(state);
    }
    case "new-round-start":
      const { replace } = action.payload;
      return {
        ...state,
        generating: true,
        rounds: replace ? state.rounds.slice(0, -1) : state.rounds,
      };
    case "new-round": {
      return cacheState({
        ...state,
        generating: false,
        rounds: [...state.rounds, action.payload],
      });
    }
  }
  return state;
}

async function newRound(
  dispatch: Dispatch,
  state: State,
  payload: NewRoundOptions
) {
  dispatch({ type: "new-round-start", payload });
  const rounds = payload.replace ? state.rounds.slice(0, -1) : state.rounds;
  const volunteerSitouts: Player[] = payload.volunteerSitouts.map((id) => ({
    id,
    name: state.playersById[id].name,
  }));
  try {
    const nextRound = await getNextBestRound(
      rounds,
      state.players,
      state.courts,
      volunteerSitouts
    );
    dispatch({ type: "new-round", payload: nextRound });
  } catch (error) {
    dispatch({ type: "new-round-fail", payload: { error: error as Error } });
  }
}

async function newGame(
  dispatch: Dispatch,
  state: State,
  payload: NewGameOptions
) {
  const { courts, names } = payload;
  const players = createPlayers(names).sort((a, b) =>
    a.name.localeCompare(b.name)
  );
  const playersById = getPlayersById(state.playersById, players);
  dispatch({
    type: "new-game-start",
    payload: { players, playersById, courts },
  });
  try {
    const nextRound = await getNextBestRound([], players, courts);
    dispatch({ type: "new-game", payload: nextRound });
  } catch (error) {
    dispatch({ type: "new-game-fail", payload: { error: error as Error } });
  }
}

function ShufflerProvider({ children }: ShufflerProviderProps) {
  const [state, dispatch] = React.useReducer(shufflerReducer, defaultState);
  return (
    <ShufflerStateContext.Provider value={state}>
      <ShufflerDispatchContext.Provider value={dispatch}>
        {children}
      </ShufflerDispatchContext.Provider>
    </ShufflerStateContext.Provider>
  );
}

function useShufflerState() {
  const state = React.useContext(ShufflerStateContext);

  if (state === undefined) {
    throw new Error("useShuffler must be used within a ShufflerProvider");
  }
  return state;
}

function useShufflerDispatch() {
  const dispatch = React.useContext(ShufflerDispatchContext);

  if (dispatch === undefined) {
    throw new Error("useShuffler must be used within a ShufflerProvider");
  }
  return dispatch;
}

function useLoadState() {
  const state = useShufflerState();
  const dispatch = useShufflerDispatch();
  React.useEffect(() => {
    if (!state) return;
    if (state.cacheLoaded === false) {
      dispatch({ type: "load-from-cache", payload: null });
    }
  }, [state?.cacheLoaded]);
}

export {
  ShufflerProvider,
  useShufflerState,
  useShufflerDispatch,
  useLoadState,
  newRound,
  newGame,
};

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
  regenerate?: boolean;
  playersById?: Record<PlayerId, Player>;
};

type NewGameOptions = {
  names: string[];
  courts: number;
};

type EditCourts = {
  courts: number;
  regenerate: boolean;
};
type EditPlayers = {
  newPlayers: Player[];
  regenerate: boolean;
};

type Action =
  | {
      type: "load-from-cache";
      payload: null;
    }
  | {
      type: "new-game-start";
      payload: {
        players: PlayerId[];
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
      payload: {
        round: Round;
        courts?: number;
        volunteerSitouts: PlayerId[];
      };
    }
  | {
      type: "start-generation";
      payload: NewRoundOptions;
    }
  | {
      type: "new-round-fail";
      payload: { error: Error };
    };
type Dispatch = (action: Action) => void;
type State = {
  players: PlayerId[];
  rounds: Round[];
  courts: number;
  volunteerSitoutsByRound: PlayerId[][];
  playersById: Record<PlayerId, Player>;
  generating: boolean;
  cacheLoaded: boolean;
};
type ShufflerProviderProps = { children: React.ReactNode };

const defaultState: State = {
  players: [],
  volunteerSitoutsByRound: [],
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
    const { players, rounds, courts, volunteerSitoutsByRound, playersById } =
      JSON.parse(storageState);
    if (!Array.isArray(players) || !Array.isArray(rounds) || isNaN(courts))
      return existingState;

    return {
      players,
      playersById,
      volunteerSitoutsByRound,
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
    const { players, courts, rounds, volunteerSitoutsByRound, playersById } =
      state;
    window.localStorage.setItem(
      "state",
      JSON.stringify({
        players,
        courts,
        rounds,
        volunteerSitoutsByRound,
        playersById,
      })
    );
  }, 0);
  return state;
}

function shufflerReducer(state: State, action: Action): State {
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
        volunteerSitoutsByRound: [],
        generating: true,
      });
    }
    case "new-game": {
      const { payload } = action;

      return cacheState({
        ...state,
        rounds: [payload],
        volunteerSitoutsByRound: [[]],
        generating: false,
      });
    }
    case "load-from-cache": {
      return loadFromCache(state);
    }
    case "start-generation":
      const { regenerate, volunteerSitouts } = action.payload;
      return {
        ...state,
        generating: true,
        rounds: regenerate ? state.rounds.slice(0, -1) : state.rounds,
        volunteerSitoutsByRound: regenerate
          ? state.volunteerSitoutsByRound.slice(0, -1)
          : state.volunteerSitoutsByRound,
        playersById: action.payload.playersById || state.playersById,
      };
    case "new-round": {
      return cacheState({
        ...state,
        generating: false,
        rounds: [...state.rounds, action.payload.round],
        courts: action.payload.courts || state.courts,
        volunteerSitoutsByRound: [
          ...state.volunteerSitoutsByRound,
          action.payload.volunteerSitouts,
        ],
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
  dispatch({ type: "start-generation", payload });
  const rounds = payload.regenerate ? state.rounds.slice(0, -1) : state.rounds;

  try {
    const nextRound = await getNextBestRound(
      rounds,
      state.players,
      state.courts,
      payload.volunteerSitouts
    );
    dispatch({
      type: "new-round",
      payload: { round: nextRound, volunteerSitouts: payload.volunteerSitouts },
    });
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
  const playerIds = players.map(({ id }) => id);
  const playersById = getPlayersById(state.playersById, players);
  dispatch({
    type: "new-game-start",
    payload: { players: players.map(({ id }) => id), playersById, courts },
  });
  try {
    const nextRound = await getNextBestRound([], playerIds, courts);
    dispatch({ type: "new-game", payload: nextRound });
  } catch (error) {
    dispatch({ type: "new-game-fail", payload: { error: error as Error } });
  }
}

async function editCourts(
  dispatch: Dispatch,
  state: State,
  payload: EditCourts
) {
  const { courts, regenerate } = payload;
  const volunteerSitouts = regenerate
    ? state.volunteerSitoutsByRound.slice(-1)[0]
    : [];
  const rounds = regenerate ? state.rounds.slice(0, -1) : state.rounds;
  dispatch({
    type: "start-generation",
    payload: { volunteerSitouts, regenerate },
  });
  try {
    const nextRound = await getNextBestRound(rounds, state.players, courts);
    dispatch({
      type: "new-round",
      payload: {
        round: nextRound,
        volunteerSitouts,
        courts,
      },
    });
  } catch (error) {
    dispatch({ type: "new-round-fail", payload: { error: error as Error } });
  }
}

async function editPlayers(
  dispatch: Dispatch,
  state: State,
  payload: EditPlayers
) {
  const { newPlayers, regenerate } = payload;
  const volunteerSitouts = regenerate
    ? state.volunteerSitoutsByRound.slice(-1)[0]
    : [];
  const rounds = regenerate ? state.rounds.slice(0, -1) : state.rounds;

  const playerIds = newPlayers.map(({ id }) => id);
  const playersById = getPlayersById(state.playersById, newPlayers);

  dispatch({
    type: "start-generation",
    payload: { volunteerSitouts, regenerate, playersById },
  });
  try {
    const nextRound = await getNextBestRound(rounds, playerIds, state.courts);
    dispatch({
      type: "new-round",
      payload: {
        round: nextRound,
        volunteerSitouts,
      },
    });
  } catch (error) {
    dispatch({ type: "new-round-fail", payload: { error: error as Error } });
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
  editCourts,
  editPlayers,
};

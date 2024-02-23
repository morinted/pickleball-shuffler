import * as React from "react";
import { Player, PlayerId, Round } from "./matching/heuristics";
import { v4 as uuidv4 } from "uuid";

type NewRoundOptions = {
  volunteerSitouts: PlayerId[];
  regenerate?: boolean;
  useGroups?: boolean;
  players?: PlayerId[];
  playersById?: Record<PlayerId, Player>;
};

type GroupName = {
  name: string;
  playerNames: string[];
};

type Group = {
  name: string;
  id: number;
  players: PlayerId[];
};

type NewGameOptions = {
  names: string[];
  groups: GroupName[];
  useGroups: boolean;
  courts: number;
  courtNames: string[];
};

type EditCourts = {
  courts: number;
  regenerate: boolean;
};
type EditPlayers = {
  newPlayers: Player[];
  groups: Group[];
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
        courtNames: string[];
        groups: Group[];
        useGroups: boolean;
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
  courtNames: string[];
  volunteerSitoutsByRound: PlayerId[][];
  playersById: Record<PlayerId, Player>;
  groups: Group[];
  useGroups: boolean;
  generating: boolean;
  cacheLoaded: boolean;
};
type ShufflerProviderProps = { children: React.ReactNode };

const defaultState: State = {
  players: [],
  volunteerSitoutsByRound: [],
  playersById: {},
  rounds: [],
  groups: [],
  courts: 2,
  useGroups: false,
  courtNames: [],
  generating: false,
  cacheLoaded: false,
};

const ShufflerStateContext = React.createContext<State | undefined>(undefined);
const ShufflerDispatchContext = React.createContext<Dispatch | undefined>(
  undefined
);
const ShufflerWorkerContext = React.createContext<Worker | null | undefined>(
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
    const {
      players,
      rounds,
      courts,
      volunteerSitoutsByRound,
      playersById,
      courtNames = [],
      groups = [],
      useGroups = false,
    } = JSON.parse(storageState);
    if (
      !Array.isArray(players) ||
      !Array.isArray(rounds) ||
      isNaN(courts) ||
      !playersById
    )
      return existingState;

    return {
      players,
      playersById,
      volunteerSitoutsByRound,
      rounds,
      courts,
      courtNames,
      groups,
      useGroups,
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
    const {
      players,
      courts,
      courtNames,
      rounds,
      volunteerSitoutsByRound,
      playersById,
      groups,
      useGroups,
    } = state;
    window.localStorage.setItem(
      "state",
      JSON.stringify({
        players,
        courts,
        courtNames,
        rounds,
        volunteerSitoutsByRound,
        playersById,
        groups,
        useGroups,
      })
    );
  }, 0);
  return state;
}

function shufflerReducer(state: State, action: Action): State {
  switch (action.type) {
    case "new-game-start": {
      const { payload } = action;
      const { players, playersById, courts, courtNames, groups, useGroups } =
        payload;

      return cacheState({
        ...state,
        players,
        playersById,
        courts,
        courtNames,
        groups,
        useGroups,
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
      const { regenerate } = action.payload;
      return {
        ...state,
        generating: true,
        rounds: regenerate ? state.rounds.slice(0, -1) : state.rounds,
        volunteerSitoutsByRound: regenerate
          ? state.volunteerSitoutsByRound.slice(0, -1)
          : state.volunteerSitoutsByRound,
        players: action.payload.players || state.players,
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
  worker: Worker | null,
  payload: NewRoundOptions
) {
  if (!worker) return;
  if (state.generating) return;
  dispatch({ type: "start-generation", payload });
  const rounds = payload.regenerate ? state.rounds.slice(0, -1) : state.rounds;

  const useGroups = payload.useGroups ?? state.useGroups;

  try {
    const nextRound = useGroups
      ? await generateGroupedRounds(
          worker,
          rounds,
          state.players,
          state.groups,
          state.courts,
          payload.volunteerSitouts
        )
      : await generateRound(
          worker,
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
  worker: Worker | null,
  payload: NewGameOptions
) {
  if (!worker) return;
  if (state.generating) return;
  const { courts, names, courtNames, groups, useGroups } = payload;
  const players = createPlayers(names).sort((a, b) =>
    a.name.localeCompare(b.name)
  );
  const mappedGroups = groups.map<Group>((group, index) => {
    return {
      name: group.name,
      id: index,
      players: group.playerNames.map(
        (name) => players.find((p) => p.name === name)?.id || ""
      ),
    };
  });
  const playerIds = players.map(({ id }) => id);
  const playersById = getPlayersById({}, players);
  dispatch({
    type: "new-game-start",
    payload: {
      players: players.map(({ id }) => id),
      playersById,
      courts,
      courtNames,
      groups: mappedGroups,
      useGroups,
    },
  });
  try {
    const nextRound = useGroups
      ? await generateGroupedRounds(
          worker,
          [],
          playerIds,
          mappedGroups,
          courts,
          []
        )
      : await generateRound(worker, [], playerIds, courts, []);
    dispatch({ type: "new-game", payload: nextRound });
  } catch (error) {
    dispatch({ type: "new-game-fail", payload: { error: error as Error } });
  }
}

async function generateGroupedRounds(
  worker: Worker,
  rounds: Round[],
  playerIds: PlayerId[],
  groups: Group[],
  courts: number,
  volunteerSitouts: PlayerId[]
): Promise<Round> {
  // Apply sit outs globally to avoid a modulus 4 group never having sit outs.
  const { sitOuts } = await generateRound(
    worker,
    rounds,
    playerIds,
    courts,
    volunteerSitouts
  );

  // Split players into groups.
  console.log(groups);
  const playerGroups = groups.map((group) =>
    group.players.filter((player) => !sitOuts.includes(player))
  );

  console.log(playerGroups);

  // Generate rounds for each group.
  const homogeneousRounds = [];
  for (const groupPlayerIds of playerGroups) {
    const newRound = await generateRound(
      worker,
      rounds,
      groupPlayerIds,
      Math.floor(groupPlayerIds.length / 4),
      []
    );
    homogeneousRounds.push(newRound);
  }

  // Combine sit outs to form last courts.
  const mixedGroup = homogeneousRounds.reduce<PlayerId[]>((result, current) => {
    return [...result, ...current.sitOuts];
  }, []);

  const mixedRound = await generateRound(
    worker,
    rounds,
    mixedGroup,
    Math.floor(mixedGroup.length / 4),
    []
  );

  console.log(sitOuts, homogeneousRounds, mixedGroup, mixedRound);

  return {
    sitOuts,
    matches: [
      ...homogeneousRounds.flatMap((round) => round.matches),
      ...mixedRound.matches,
    ],
  };
}

async function generateRound(
  worker: Worker,
  rounds: Round[],
  players: PlayerId[],
  courts: number,
  volunteerSitouts: PlayerId[]
): Promise<Round> {
  return new Promise((resolve, reject) => {
    const messageCallback = (event: MessageEvent<Round>) => {
      resolve(event.data);
      worker.removeEventListener("message", messageCallback);
    };
    worker.addEventListener("message", messageCallback);

    const errorCallback = (error: ErrorEvent) => {
      reject(error);
      worker.removeEventListener("error", errorCallback);
    };
    worker.addEventListener("error", errorCallback);

    worker.postMessage([rounds, players, courts, volunteerSitouts]);
  });
}

async function editCourts(
  dispatch: Dispatch,
  state: State,
  worker: Worker | null,
  payload: EditCourts
) {
  if (!worker) return;
  if (state.generating) return;
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
    const round = await generateRound(
      worker,
      rounds,
      state.players,
      courts,
      volunteerSitouts
    );
    dispatch({
      type: "new-round",
      payload: {
        round,
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
  worker: Worker | null,
  payload: EditPlayers
) {
  if (!worker) return;
  if (state.generating) return;
  const { newPlayers, regenerate } = payload;
  const volunteerSitouts = regenerate
    ? state.volunteerSitoutsByRound.slice(-1)[0]
    : [];
  const rounds = regenerate ? state.rounds.slice(0, -1) : state.rounds;

  const playerIds = newPlayers.map(({ id }) => id);
  const playersById = getPlayersById(state.playersById, newPlayers);

  dispatch({
    type: "start-generation",
    payload: { volunteerSitouts, regenerate, playersById, players: playerIds },
  });
  try {
    const nextRound = await generateRound(
      worker,
      rounds,
      playerIds,
      state.courts,
      volunteerSitouts
    );
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
  const [worker, setWorker] = React.useState<Worker | null>(null);

  React.useEffect(() => {
    const worker = new Worker(new URL("./matching/worker.ts", import.meta.url));
    setWorker(worker);
    return () => {
      worker.terminate();
      setWorker(null);
    };
  }, []);
  return (
    <ShufflerStateContext.Provider value={state}>
      <ShufflerDispatchContext.Provider value={dispatch}>
        <ShufflerWorkerContext.Provider value={worker ?? null}>
          {children}
        </ShufflerWorkerContext.Provider>
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

function useShufflerDispatch(): Dispatch {
  const dispatch = React.useContext(ShufflerDispatchContext);

  if (dispatch === undefined) {
    throw new Error("useShuffler must be used within a ShufflerProvider");
  }

  return dispatch;
}

function useShufflerWorker(): Worker | null {
  const worker = React.useContext(ShufflerWorkerContext);

  if (worker === undefined) {
    throw new Error(
      "useShufflerWorker must be used within a ShufflerWorkerProvider"
    );
  }

  return worker;
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
  useShufflerWorker,
  useLoadState,
  newRound,
  newGame,
  editCourts,
  editPlayers,
};

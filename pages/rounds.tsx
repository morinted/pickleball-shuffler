import {
  Button,
  Card,
  Spacer,
  Pagination,
  CardBody,
  Divider,
} from "@nextui-org/react";
import Head from "next/head";
import React, { useEffect, useState } from "react";
import { Edit, People } from "react-iconly";
import { BadgeGroup } from "../src/BadgeGroup";
import { Court } from "../src/Court";
import { CourtsModal } from "../src/CourtsModal";
import { PlayerBadge } from "../src/PlayerBadge";
import { PlayersModal } from "../src/PlayersModal";
import { SitoutsModal } from "../src/SitoutsModal";
import TeamBadges from "../src/TeamBadges";
import {
  editCourts,
  editPlayers,
  newRound,
  useShufflerDispatch,
  useShufflerState,
  useShufflerWorker,
} from "../src/useShuffler";

export default function Rounds() {
  const state = useShufflerState();
  const dispatch = useShufflerDispatch();
  const worker = useShufflerWorker();

  const [sitoutModal, setSitoutModal] = useState(false);
  const [playersModal, setPlayersModal] = useState(false);
  const [courtsModal, setCourtsModal] = useState(false);

  const [roundIndex, setRoundIndex] = useState(0);

  // Handle rounds loading into state.
  useEffect(() => {
    if (state.rounds.length && roundIndex === 0) {
      setRoundIndex(Math.max(state.rounds.length - 1, 0));
      window.scrollTo(0, 0);
    }
  }, [state.rounds]);
  const displayIndex = Math.max(
    0,
    Math.min(roundIndex, state.rounds.length - 1)
  );
  const round = state.rounds[displayIndex];
  const volunteers = state.volunteerSitoutsByRound[displayIndex];
  const { sitOuts = [], matches = [] } = round || {};
  const playerName = (id: string) => {
    return state.playersById[id].name;
  };

  return (
    <>
      <Head>
        <title>Rounds - Jumbled Doubles</title>
        <meta name="description" content="View player rounds" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <section className="container mx-auto">
        <SitoutsModal
          open={sitoutModal}
          onClose={() => setSitoutModal(false)}
          onSubmit={async (volunteerSitouts) => {
            await newRound(dispatch, state, worker, {
              regenerate: true,
              volunteerSitouts,
            });
            setSitoutModal(false);
          }}
        />
        <PlayersModal
          open={playersModal}
          onClose={() => setPlayersModal(false)}
          onSubmit={async (newPlayers, regenerate) => {
            await editPlayers(dispatch, state, worker, {
              newPlayers,
              regenerate,
            });
            if (!regenerate && roundIndex) setRoundIndex((index) => index + 1);
            setPlayersModal(false);
          }}
        />
        <CourtsModal
          open={courtsModal}
          onClose={() => setCourtsModal(false)}
          onSubmit={async (courts, regenerate) => {
            await editCourts(dispatch, state, worker, {
              regenerate,
              courts,
            });
            if (!regenerate && roundIndex) setRoundIndex((index) => index + 1);
            setCourtsModal(false);
          }}
        />
        <Spacer y={1} />
        <div className="flex flex-row mb-4 gap-2">
          <h3 className="flex-grow text-xl font-semibold">
            Round {roundIndex + 1}
          </h3>
          {roundIndex === state.rounds.length - 1 ? (
            <>
              <Button
                aria-label={`${state.players.length} players`}
                startContent={<People />}
                className="-mt-2"
                color="primary"
                onPress={() => setPlayersModal(true)}
              >
                {state.players.length}
              </Button>
              <Button
                aria-label={`${state.players.length} players`}
                startContent={<Court />}
                className="-mt-2"
                color="primary"
                onPress={() => setCourtsModal(true)}
              >
                {state.courts}
              </Button>
            </>
          ) : (
            <Button
              onPress={() => setRoundIndex(state.rounds.length - 1)}
              variant="flat"
              className="-mt-2"
            >
              Jump to latest round
            </Button>
          )}
        </div>

        <div className="flex gap-4 items-stretch justify-center flex-wrap">
          {/* Sitting out */}{" "}
          <div className="basis-full sm:basis-64 md:basis-64 xl:basis-64">
            <Card className="h-full bg-slate-200">
              <CardBody>
                <div className="flex justify-between content-center">
                  <h4 className="text-lg font-semibold">Sitting out</h4>
                  <Button
                    className="-mt-1"
                    variant="flat"
                    color="primary"
                    onPress={() => setSitoutModal(true)}
                    isIconOnly
                  >
                    <Edit label="Edit sit outs" />
                  </Button>
                </div>
                {sitOuts.length ? (
                  <>
                    <Spacer y={0.5} />
                    <BadgeGroup>
                      {sitOuts.map((playerId) => (
                        <PlayerBadge key={playerId} color="default">
                          {playerName(playerId)}
                          {volunteers.includes(playerId) ? " (volunteer)" : ""}
                        </PlayerBadge>
                      ))}
                    </BadgeGroup>
                  </>
                ) : (
                  <p className="italic">No one has to sit out.</p>
                )}
              </CardBody>
            </Card>
          </div>
          {/* Games */}
          {matches.map(([teamA, teamB], index) => {
            return (
              <div
                key={JSON.stringify([teamA, teamB])}
                className="basis-full sm:basis-1/2 md:basis-96 xl:basis-[26rem]"
              >
                <Card>
                  <CardBody>
                    <h4 className="text-lg font-semibold">
                      Court {state.courtNames[index] || index + 1}
                    </h4>
                    <div className="text-center">
                      <TeamBadges team={teamA.map(playerName).sort()} isHome />
                      <Spacer y={1} />

                      <div className="my-2 relative w-full border-b-1 before:px-4 before:-mx-6 before:bg-white before:-translate-y-1/2 before:font-bold before:absolute before:content-['vs']"></div>
                      <Spacer y={1} />
                      <TeamBadges team={teamB.map(playerName).sort()} />
                    </div>
                  </CardBody>
                </Card>
              </div>
            );
          })}
        </div>
        <Spacer y={1} />
        <div className="flex justify-around my-6">
          <Pagination
            total={state.rounds.length + (state.generating ? 1 : 0) || 1}
            page={roundIndex + 1}
            onChange={(page: number) => {
              setRoundIndex(page - 1);
            }}
          />
        </div>
        <Spacer y={1.5} />
        <div className="flex justify-around">
          <Button
            size="lg"
            onPress={async () => {
              await newRound(dispatch, state, worker, {
                volunteerSitouts: [],
              });
              setRoundIndex(state.rounds.length);
              window.scrollTo(0, 0);
            }}
            className="bg-gradient-to-l from-blue-600 to-pink-600 text-white"
          >
            Start round {state.rounds.length + 1}!
          </Button>
        </div>
        <Spacer y={2} />
      </section>
    </>
  );
}

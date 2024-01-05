import {
  Button,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Spacer,
} from "@nextui-org/react";
import { v4 as uuidv4 } from "uuid";
import { useEffect, useRef, useState } from "react";
import { AddUser, Delete } from "react-iconly";
import { Player } from "./matching/heuristics";
import { useShufflerState } from "./useShuffler";
import clsx from "clsx";

export function PlayersModal({
  open,
  onClose,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (newPlayers: Player[], regenerate: boolean) => void;
}) {
  const state = useShufflerState();
  const [newPlayer, setNewPlayer] = useState("");
  const newPlayerRef = useRef<HTMLInputElement>(null);
  const [players, setPlayers] = useState<
    Array<Player & { delete: boolean; new: boolean }>
  >([]);
  const handleSubmit =
    (regenerate: boolean = false) =>
    () => {
      const newPlayers = players
        .filter((x) => !x.delete)
        .map(({ id, name }) => ({ id, name }))
        .sort((a, b) => a.name.localeCompare(b.name));
      // TODO: error handling for too few players.
      if (newPlayers.length < 4) return;
      onSubmit(newPlayers, regenerate);
    };
  useEffect(() => {
    if (open) {
      const allPlayers = Object.values(state.playersById);

      setPlayers(
        allPlayers
          .sort((a, b) => a.name.localeCompare(b.name))
          .map(({ name, id }) => ({
            id,
            name,
            delete: !state.players.includes(id),
            new: false,
          }))
      );
    }
  }, [open]);

  return (
    <Modal
      closeButton
      aria-labelledby="players-modal-title"
      isOpen={open}
      scrollBehavior="inside"
      onClose={() => {
        onClose();
      }}
    >
      <ModalContent>
        <ModalHeader>
          <h3 id="players-modal-title">Edit players</h3>
        </ModalHeader>
        <ModalBody>
          <p className="text-lg">
            Add or remove players. You can either{" "}
            <span className="font-bold">redo the current round</span> (because
            you haven't played yet) or{" "}
            <span className="font-bold">start a new round</span> with the
            updated roster.
          </p>
          <form
            name="new-player"
            onSubmit={(e) => {
              e.preventDefault();
              const playerName = newPlayer.trim();
              // No empty input.
              if (!playerName) return;
              // No duplicate names.
              if (players.some((player) => player.name === playerName)) return;
              // Update list and clear form.
              setPlayers((players) => [
                { name: playerName, id: uuidv4(), delete: false, new: true },
                ...players,
              ]);
              setNewPlayer("");
              newPlayerRef.current?.focus();
            }}
          >
            <div className="flex gap-2 items-end">
              <Input
                variant="bordered"
                label="Add player"
                labelPlacement="outside"
                placeholder="Enter player name"
                color="primary"
                className="flex-1"
                value={newPlayer}
                onChange={(e) => setNewPlayer(e.target.value)}
                ref={newPlayerRef}
              />
              <Button
                color="primary"
                aria-label="Submit add player"
                isIconOnly
                type="submit"
              >
                <AddUser />
              </Button>
            </div>
          </form>
          {players.map((player) => (
            <div className="flex items-center border-b-1 pb-3" key={player.id}>
              <span
                className={clsx("text-large flex-1", {
                  "line-through": player.delete,
                  "text-neutral-400": player.delete,
                })}
              >
                {player.new ? "🆕 " : ""}
                {player.delete ? "❌ " : ""}
                {player.name}
              </span>
              <Spacer x={0.5} />
              <Button
                variant="flat"
                size="sm"
                color={player.delete ? "success" : "default"}
                aria-label={
                  player.delete
                    ? `Restore player named ${player.name}`
                    : `Remove player named ${player.name}`
                }
                endContent={player.delete ? <AddUser /> : <Delete />}
                title={player.delete ? "Restore player" : "Remove player"}
                onPress={() => {
                  // Toggle delete for this player
                  setPlayers((players) =>
                    players.map((x) =>
                      x.id === player.id
                        ? {
                            ...x,
                            delete: !x.delete,
                          }
                        : x
                    )
                  );
                }}
              >
                {player.delete ? "Re-add" : "Remove"}
              </Button>
            </div>
          ))}
        </ModalBody>
        <ModalFooter>
          <Button variant="flat" onPress={onClose}>
            Cancel
          </Button>
          <Button onPress={handleSubmit(true)} color="danger">
            Redo round
          </Button>
          <Button onPress={handleSubmit()} color="primary">
            New round
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

import {
  Button,
  Checkbox,
  Col,
  Divider,
  Input,
  Modal,
  Row,
  Spacer,
  Text,
} from "@nextui-org/react";
import { v4 as uuidv4 } from "uuid";
import { useEffect, useRef, useState } from "react";
import { AddUser, Delete } from "react-iconly";
import { Player } from "./matching/heuristics";
import { useShufflerState } from "./useShuffler";

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
  const newPlayerRef = useRef<HTMLTextAreaElement>(null);
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
      scroll
      closeButton
      aria-labelledby="players-modal-title"
      open={open}
      onClose={() => {
        onClose();
      }}
    >
      <Modal.Header>
        <Text id="players-modal-title" h3>
          Edit players
        </Text>
      </Modal.Header>
      <Modal.Body>
        <Text size="$lg">
          Add or remove players. You can either{" "}
          <Text b>redo the current round</Text> (because you haven't played yet)
          or <Text b>start a new round</Text> with the updated roster.
        </Text>
        <form
          name="new-player"
          onSubmit={(e) => {
            e.preventDefault();
            if (!newPlayerRef.current) return;
            const playerName = newPlayerRef.current?.value?.trim();
            // No empty input.
            if (!playerName) return;
            // No duplicate names.
            if (players.some((player) => player.name === playerName)) return;
            // Update list and clear form.
            setPlayers((players) => [
              { name: playerName, id: uuidv4(), delete: false, new: true },
              ...players,
            ]);
            newPlayerRef.current.value = "";
          }}
        >
          <Row align="flex-end">
            <Input
              bordered
              label="Add player"
              color="primary"
              css={{
                flexGrow: 1,
              }}
              ref={newPlayerRef}
            />
            <Spacer x={0.5} />
            <Button
              auto
              color="primary"
              aria-label="Submit add player"
              icon={<AddUser />}
              type="submit"
            />
          </Row>
        </form>
        {players.map((player) => (
          <Row key={player.id}>
            <Text
              size="$lg"
              css={{
                textDecoration: player.delete ? "line-through" : "",
                color: player.delete ? "$neutral" : undefined,
                flexGrow: 1,
              }}
            >
              {player.new ? "🆕 " : ""}
              {player.name}
            </Text>
            <Spacer x={0.5} />
            <Button
              auto
              flat
              color={player.delete ? "success" : "error"}
              aria-label={`Remove player named ${player.name}`}
              icon={player.delete ? <AddUser /> : <Delete />}
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
            />
          </Row>
        ))}
      </Modal.Body>
      <Modal.Footer>
        <Button auto flat onPress={onClose}>
          Close
        </Button>
        <Button auto onPress={handleSubmit(true)} color="error">
          Redo round
        </Button>
        <Button auto onPress={handleSubmit()} color="gradient">
          New round
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

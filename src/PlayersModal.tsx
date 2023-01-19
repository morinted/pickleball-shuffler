import { Button, Checkbox, Modal, Text } from "@nextui-org/react";
import { useEffect, useState } from "react";
import { Player, PlayerId } from "./matching/heuristics";
import { useShufflerState } from "./useShuffler";

export function PlayersModal({
  open,
  onClose,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (newPlayers: Player[]) => void;
}) {
  const state = useShufflerState();
  const [players, setPlayers] = useState<Player[]>([]);
  useEffect(() => {
    if (open) {
      setPlayers(state.players);
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
          Add, remove, or rename players. Applies to this round (regenerate) or
          next round (create a new one!)
        </Text>
        {players.map((player) => (
          <Checkbox value={player.id} key={player.id}>
            {player.name}
          </Checkbox>
        ))}
      </Modal.Body>
      <Modal.Footer>
        <Button auto flat onPress={onClose}>
          Close
        </Button>
        <Button auto onPress={() => onSubmit(players)} color="error">
          Redo this round
        </Button>
        <Button auto onPress={() => onSubmit(players)} color="gradient">
          Next round
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

import { Button, Checkbox, Modal, Text } from "@nextui-org/react";
import { useState } from "react";
import { PlayerId } from "./matching/heuristics";
import { useShufflerState } from "./useShuffler";

export function SitoutsModal({
  open,
  onClose,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (volunteerSitouts: PlayerId[]) => void;
}) {
  const state = useShufflerState();
  const [volunteers, setVolunteers] = useState<PlayerId[]>([]);

  return (
    <Modal
      scroll
      closeButton
      aria-labelledby="sitout-modal-title"
      open={open}
      onClose={() => {
        setVolunteers([]);
        onClose();
      }}
    >
      <Modal.Header>
        <Text id="sitout-modal-title" h3>
          Edit sit outs
        </Text>
      </Modal.Header>
      <Modal.Body>
        <Text size="$lg">
          Someone wants to sit out? Select who and reshuffle the current round.
        </Text>
        <Checkbox.Group
          label="Volunteers to sit out"
          value={volunteers}
          onChange={setVolunteers}
        >
          {state.players.map((player) => (
            <Checkbox value={player} key={player}>
              {state.playersById[player].name}
            </Checkbox>
          ))}
        </Checkbox.Group>
      </Modal.Body>
      <Modal.Footer>
        <Button auto flat onPress={onClose}>
          Close
        </Button>
        <Button auto onPress={() => onSubmit(volunteers)} color="gradient">
          Re-jumble!
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

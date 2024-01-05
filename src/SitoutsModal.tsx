import {
  Button,
  Checkbox,
  CheckboxGroup,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@nextui-org/react";
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
      scrollBehavior="inside"
      closeButton
      aria-labelledby="sitout-modal-title"
      isOpen={open}
      onClose={() => {
        setVolunteers([]);
        onClose();
      }}
    >
      <ModalContent>
        <ModalHeader>
          <h3 id="sitout-modal-title">Edit sit outs</h3>
        </ModalHeader>
        <ModalBody>
          <p className="text-lg">
            Someone wants to sit out? Select who and reshuffle the current
            round.
          </p>
          <CheckboxGroup
            label="Volunteers to sit out"
            value={volunteers}
            onValueChange={setVolunteers}
          >
            {state.players.map((player) => (
              <Checkbox value={player} key={player}>
                {state.playersById[player].name}
              </Checkbox>
            ))}
          </CheckboxGroup>
        </ModalBody>
        <ModalFooter>
          <Button variant="flat" onPress={onClose}>
            Cancel
          </Button>
          <Button onPress={() => onSubmit(volunteers)} color="primary">
            Re-jumble!
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

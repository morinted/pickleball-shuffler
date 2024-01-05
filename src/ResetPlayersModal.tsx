import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@nextui-org/react";

export function ResetPlayersModal({
  open,
  onClose,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: () => void;
}) {
  return (
    <Modal
      closeButton
      aria-labelledby="reset-players-message"
      isOpen={open}
      onClose={() => {
        onClose();
      }}
    >
      <ModalContent>
        <ModalHeader>
          <h3 id="reset-players-message">Clear all players?</h3>
        </ModalHeader>
        <ModalBody>
          <label id="courts-label">Remove all players and start over?</label>
        </ModalBody>
        <ModalFooter>
          <Button variant="flat" onPress={onClose}>
            Cancel
          </Button>
          <Button variant="flat" onPress={() => onSubmit()} color="danger">
            Clear all
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

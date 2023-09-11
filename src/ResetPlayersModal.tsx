import { Button, Modal, Text } from "@nextui-org/react";

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
      open={open}
      onClose={() => {
        onClose();
      }}
    >
      <Modal.Header>
        <Text id="reset-players-message" h3>
          Clear all players?
        </Text>
      </Modal.Header>
      <Modal.Body>
        <label>
          <Text id="courts-label" size="$lg">
            Clear players and start over?
          </Text>
        </label>
      </Modal.Body>
      <Modal.Footer>
        <Button auto flat onPress={onClose}>
          Close
        </Button>
        <Button auto onPress={() => onSubmit()} color="error">
          Clear all
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

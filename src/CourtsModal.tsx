import {
  Button,
  Checkbox,
  Input,
  Modal,
  Row,
  Spacer,
  Text,
} from "@nextui-org/react";
import { useEffect, useState } from "react";
import { Home } from "react-iconly";
import { Court } from "./Court";
import { useShufflerState } from "./useShuffler";

export function CourtsModal({
  open,
  onClose,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (newCourtCount: number, regenerate: boolean) => void;
}) {
  const state = useShufflerState();
  const [courts, setCourts] = useState<string>(state.courts.toString());
  useEffect(() => {
    if (open) {
      setCourts(state.courts.toString());
    }
  }, [open]);

  return (
    <Modal
      scroll
      closeButton
      aria-labelledby="courts-modal-title"
      open={open}
      onClose={() => {
        onClose();
      }}
    >
      <Modal.Header>
        <Text id="courts-modal-title" h3>
          Edit courts
        </Text>
      </Modal.Header>
      <Modal.Body>
        <label>
          <Row align="center">
            <Court />
            <Spacer x={0.25} inline />
            <Text id="courts-label" size="$lg">
              How many courts are available now?
            </Text>
          </Row>
          <Spacer y={0.5} />
          <Input
            id="court-input"
            aria-labelledby="courts-label"
            type="number"
            min={1}
            value={courts}
            onChange={(e) => setCourts(e.target.value)}
            fullWidth
          />
        </label>
      </Modal.Body>
      <Modal.Footer>
        <Button auto flat onPress={onClose}>
          Close
        </Button>
        <Button
          auto
          onPress={() => onSubmit(parseInt(courts), true)}
          color="error"
        >
          Redo round
        </Button>
        <Button
          auto
          onPress={() => onSubmit(parseInt(courts), false)}
          color="gradient"
        >
          New round
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

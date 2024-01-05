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
      closeButton
      aria-labelledby="courts-modal-title"
      isOpen={open}
      onClose={() => {
        onClose();
      }}
    >
      <ModalContent>
        <ModalHeader>
          <h3 id="courts-modal-title">Edit courts</h3>
        </ModalHeader>
        <ModalBody>
          <label>
            <div className="flex items-center gap-2">
              <Court />
              <p id="courts-label">How many courts are available now?</p>
            </div>
            <Spacer y={3} />
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
        </ModalBody>
        <ModalFooter>
          <Button variant="flat" onPress={onClose}>
            Cancel
          </Button>
          <Button
            onPress={() => onSubmit(parseInt(courts), true)}
            color="danger"
          >
            Redo round
          </Button>
          <Button
            onPress={() => onSubmit(parseInt(courts), false)}
            color="primary"
          >
            New round
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

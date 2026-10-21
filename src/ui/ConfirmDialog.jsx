'use client';

import { Button } from './Button.jsx';
import { FormMessage } from './Field.jsx';
import { Modal } from './Modal.jsx';

/** A yes/no confirmation for an action that is hard to undo. */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = 'Cancel',
  variant = 'danger',
  loading = false,
  error,
  onConfirm,
  onClose,
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {cancelLabel}
          </Button>
          <Button variant={variant} loading={loading} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      {description && <p className="text-muted">{description}</p>}
      <FormMessage>{error}</FormMessage>
    </Modal>
  );
}

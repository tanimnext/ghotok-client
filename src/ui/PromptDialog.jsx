'use client';

import { useEffect, useState } from 'react';
import { Button } from './Button.jsx';
import { FormMessage, TextArea } from './Field.jsx';
import { Modal } from './Modal.jsx';

/** A confirmation dialog that asks for a short text (a reason or a note). The text resets each time it opens. */
export function PromptDialog({
  open,
  title,
  label,
  description,
  required = true,
  minLength = 3,
  confirmLabel,
  cancelLabel = 'Cancel',
  variant = 'primary',
  loading = false,
  error,
  onConfirm,
  onClose,
}) {
  const [text, setText] = useState('');
  useEffect(() => {
    if (open) setText('');
  }, [open]);
  const valid = !required || text.trim().length >= minLength;
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
          <Button
            variant={variant}
            disabled={!valid}
            loading={loading}
            onClick={() => onConfirm(text.trim())}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      {description && <p className="text-muted">{description}</p>}
      <FormMessage>{error}</FormMessage>
      <TextArea
        label={label}
        rows={3}
        value={text}
        onChange={(e) => setText(e.target.value)}
        required={required}
      />
    </Modal>
  );
}

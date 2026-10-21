'use client';

import { useEffect, useRef } from 'react';
import { Icon } from './Icon.jsx';

/**
 * An accessible dialog built on the native <dialog> element (focus trapping,
 * Escape to close and the backdrop come from the browser).
 */
export function Modal({ open, onClose, title, children, footer, size = 'md' }) {
  const ref = useRef(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      aria-labelledby="modal-title"
      className={`m-auto w-[calc(100%-32px)] rounded-[28px] border border-line bg-surface p-0 text-ink shadow-card backdrop:bg-black/50 ${
        size === 'lg' ? 'max-w-2xl' : 'max-w-lg'
      }`}
    >
      {open && (
        <div className="flex flex-col gap-5 p-6 sm:p-7">
          <div className="flex items-start justify-between gap-4">
            <h2 id="modal-title" className="font-display text-2xl font-semibold leading-title">
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="-mr-2 -mt-1 flex size-11 items-center justify-center rounded-full hover:bg-surface2"
            >
              <Icon name="close" />
            </button>
          </div>
          {children}
          {footer && <div className="flex flex-wrap justify-end gap-3">{footer}</div>}
        </div>
      )}
    </dialog>
  );
}

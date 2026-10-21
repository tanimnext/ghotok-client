'use client';

import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { HIDE_REASONS } from '@/shared';
import { Button, FormMessage, Modal, SelectInput, Switch, TextArea, useToast } from '@/ui';
import { useErrorMessage } from '@/hooks/use-error-message';
import { biodataApi } from '@/lib/api/endpoints';
import { useT } from '@/providers/PreferencesProvider';
import { useBiodataUpdate } from './use-biodata-update.js';

/** Asks why the member is hiding their biodata (the team sees the reason), then hides it. */
export function HideDialog({ open, onClose }) {
  const { t, lang } = useT();
  const toast = useToast();
  const errorMessage = useErrorMessage();
  const update = useBiodataUpdate();
  const [form, setForm] = useState({ reason: '', note: '' });
  const needsNote = form.reason === 'other';
  const hide = useMutation({
    mutationFn: () =>
      biodataApi.setVisibility({ hidden: true, reason: form.reason, note: form.note.trim() || undefined }),
    onSuccess: (result) => {
      update(result);
      toast.success(t('lifecycle.hidden'));
      setForm({ reason: '', note: '' });
      onClose();
    },
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('lifecycle.hideTitle')}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button
            disabled={!form.reason || (needsNote && !form.note.trim())}
            loading={hide.isPending}
            onClick={() => hide.mutate()}
          >
            {t('lifecycle.hideConfirm')}
          </Button>
        </>
      }
    >
      <p className="text-muted">{t('lifecycle.hideText')}</p>
      <FormMessage>{hide.error && errorMessage(hide.error)}</FormMessage>
      <SelectInput
        label={t('lifecycle.hideReason')}
        required
        placeholder={t('editor.choose')}
        value={form.reason}
        onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
        options={HIDE_REASONS.map((r) => ({ value: r.value, label: r[lang] }))}
      />
      <TextArea
        label={needsNote ? t('lifecycle.hideNoteRequired') : t('lifecycle.hideNote')}
        required={needsNote}
        rows={3}
        maxLength={500}
        value={form.note}
        onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
      />
    </Modal>
  );
}

/**
 * The "visible to others" switch. Hiding asks for a reason first; showing again is
 * immediate.
 */
export function VisibilitySwitch({ biodata, label }) {
  const toast = useToast();
  const { t } = useT();
  const errorMessage = useErrorMessage();
  const update = useBiodataUpdate();
  const [asking, setAsking] = useState(false);
  const show = useMutation({
    mutationFn: () => biodataApi.setVisibility({ hidden: false }),
    onSuccess: (result) => {
      update(result);
      toast.success(t('lifecycle.shown'));
    },
    onError: (err) => toast.error(errorMessage(err)),
  });
  return (
    <>
      <Switch
        checked={!biodata.isHidden}
        label={label}
        disabled={show.isPending}
        onChange={(visible) => (visible ? show.mutate() : setAsking(true))}
      />
      <HideDialog open={asking} onClose={() => setAsking(false)} />
    </>
  );
}

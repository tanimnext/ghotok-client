import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Button, Checkbox, FormMessage, Modal, TextArea, useToast } from '@/ui';
import { useErrorMessage } from '../hooks/useErrorMessage.js';
import { adminApi } from '../lib/api.js';
import { useT } from '../providers/PreferencesProvider.jsx';

/** Asks for an optional note and whether the member may ask again. */
function DeclineDialog({ requestId, onClose, onDone }) {
  const { t } = useT();
  const errorMessage = useErrorMessage();
  const [note, setNote] = useState('');
  const [permanent, setPermanent] = useState(false);
  const decline = useMutation({
    mutationFn: () =>
      adminApi.declineRestore(requestId, {
        note: note.trim() || undefined,
        permanent: permanent || undefined,
      }),
    onSuccess: onDone,
  });
  return (
    <Modal
      open
      onClose={onClose}
      title={t('common.decline')}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button
            variant={permanent ? 'danger' : 'primary'}
            loading={decline.isPending}
            onClick={() => decline.mutate()}
          >
            {t(permanent ? 'recovery.declinePermanent' : 'common.decline')}
          </Button>
        </>
      }
    >
      <FormMessage>{decline.error && errorMessage(decline.error)}</FormMessage>
      <TextArea
        label={t('recovery.declineNote')}
        rows={3}
        maxLength={500}
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />
      <Checkbox
        label={t('recovery.permanentLabel')}
        checked={permanent}
        onChange={(e) => setPermanent(e.target.checked)}
      />
      {permanent && <p className="text-sm text-muted">{t('recovery.permanentHint')}</p>}
    </Modal>
  );
}

/** Restore / Decline buttons for a request in the recovery queue. */
export function RestoreDecision({ requestId }) {
  const { t } = useT();
  const toast = useToast();
  const errorMessage = useErrorMessage();
  const queryClient = useQueryClient();
  const [declining, setDeclining] = useState(false);
  const done = () => {
    queryClient.invalidateQueries({ queryKey: ['restore-requests'] });
    queryClient.invalidateQueries({ queryKey: ['overview'] });
  };
  const approve = useMutation({
    mutationFn: () => adminApi.approveRestore(requestId),
    onSuccess: done,
    onError: (e) => toast.error(errorMessage(e)),
  });
  return (
    <span className="flex flex-wrap gap-2">
      <Button size="sm" loading={approve.isPending} onClick={() => approve.mutate()}>
        {t('common.restore')}
      </Button>
      <Button size="sm" variant="outline" onClick={() => setDeclining(true)}>
        {t('common.decline')}
      </Button>
      {declining && (
        <DeclineDialog
          requestId={requestId}
          onClose={() => setDeclining(false)}
          onDone={() => {
            setDeclining(false);
            done();
          }}
        />
      )}
    </span>
  );
}

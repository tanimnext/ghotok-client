'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { RESTORE_STATUS, optionLabel } from '@/shared';
import { Button, Card, FormMessage, TextArea, useToast } from '@/ui';
import { useErrorMessage } from '@/hooks/use-error-message';
import { biodataApi } from '@/lib/api/endpoints';
import { useT } from '@/providers/PreferencesProvider';
import { useBiodataUpdate } from './use-biodata-update.js';

const RESTORE_REQUEST_KEY = ['restore-request'];

/** Asks the team to restore a biodata that has been live before. */
function RestoreRequestForm() {
  const { t, lang } = useT();
  const toast = useToast();
  const errorMessage = useErrorMessage();
  const queryClient = useQueryClient();
  const [reason, setReason] = useState('');
  const { data, isLoading } = useQuery({ queryKey: RESTORE_REQUEST_KEY, queryFn: biodataApi.restoreRequest });
  const send = useMutation({
    mutationFn: () => biodataApi.requestRestore(reason.trim() || undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RESTORE_REQUEST_KEY });
      toast.success(t('dash.restorePending'));
    },
  });

  if (isLoading) return null;
  const request = data?.request;
  if (request?.status === 'pending') return <FormMessage tone="info">{t('dash.restorePending')}</FormMessage>;
  if (send.error?.code === 'RESTORE_BLOCKED' || (request?.status === 'declined' && request.permanent)) {
    return <FormMessage>{t('errors.RESTORE_BLOCKED')}</FormMessage>;
  }
  return (
    <>
      {request && (
        <FormMessage tone="info">
          {optionLabel(RESTORE_STATUS, request.status, lang)}
          {request.note ? `: ${request.note}` : ''}
        </FormMessage>
      )}
      <p className="text-sm text-muted">{t('lifecycle.restoreApproval')}</p>
      <FormMessage>{send.error && errorMessage(send.error)}</FormMessage>
      <TextArea
        label={t('settings.restoreReason')}
        rows={3}
        maxLength={1000}
        value={reason}
        onChange={(e) => setReason(e.target.value)}
      />
      <Button className="self-start" loading={send.isPending} onClick={() => send.mutate()}>
        {t('dash.requestRestore')}
      </Button>
    </>
  );
}

/**
 * Brings a deleted biodata back. One that was never published comes back at once;
 * one that has been live needs the team's approval.
 * @param {{ biodata: { wasPublished: boolean }, card?: boolean }} props
 */
export function RestorePanel({ biodata, card = true }) {
  const { t } = useT();
  const toast = useToast();
  const errorMessage = useErrorMessage();
  const update = useBiodataUpdate();
  const [needsApproval, setNeedsApproval] = useState(false);
  const restore = useMutation({
    mutationFn: biodataApi.restore,
    onSuccess: (result) => {
      update(result);
      toast.success(t('lifecycle.restored'));
    },
    onError: (err) => {
      if (err.code === 'RESTORE_NEEDS_APPROVAL') setNeedsApproval(true);
      else toast.error(errorMessage(err));
    },
  });

  const body = (
    <>
      <p className="text-muted">{t('dash.deletedText')}</p>
      {biodata.wasPublished || needsApproval ? (
        <RestoreRequestForm />
      ) : (
        <>
          <p className="text-sm text-muted">{t('lifecycle.restoreInstant')}</p>
          <Button className="self-start" loading={restore.isPending} onClick={() => restore.mutate()}>
            {t('lifecycle.restoreNow')}
          </Button>
        </>
      )}
    </>
  );
  if (!card) return <div className="flex flex-col gap-3">{body}</div>;
  return (
    <Card title={t('dash.deletedTitle')} id="delete">
      {body}
    </Card>
  );
}

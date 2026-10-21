import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { date } from '@/shared/format';
import { Button, Card, FormMessage, TextInput } from '@/ui';
import { useErrorMessage } from '../hooks/useErrorMessage.js';
import { adminApi } from '../lib/api.js';
import { useT } from '../providers/PreferencesProvider.jsx';

/** YYYY-MM-DD of a day `n` days from today, in the browser's time zone. */
function dayFromNow(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * Pauses the owner's editing and resubmitting until a date (e.g. after repeated
 * misleading edits), or resumes it. The owner is notified with the reason.
 */
export function EditSuspension({ biodataId, until, onSaved }) {
  const { t, lang } = useT();
  const errorMessage = useErrorMessage();
  const [day, setDay] = useState(dayFromNow(7));
  const [reason, setReason] = useState('');
  const save = useMutation({
    mutationFn: (body) => adminApi.suspendEdit(biodataId, body),
    onSuccess: () => {
      setReason('');
      onSaved();
    },
  });

  return (
    <Card title={t('biodatas.suspend.title')}>
      <FormMessage>{save.error && errorMessage(save.error)}</FormMessage>
      {until ? (
        <>
          <p className="text-sm">{t('biodatas.suspend.until', { date: date(until, lang) })}</p>
          <Button variant="outline" loading={save.isPending} onClick={() => save.mutate({ until: null })}>
            {t('biodatas.suspend.resume')}
          </Button>
        </>
      ) : (
        <form
          className="flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            // Until the end of the chosen day, local time.
            save.mutate({
              until: new Date(`${day}T23:59:59`).toISOString(),
              reason: reason.trim() || undefined,
            });
          }}
        >
          <p className="text-sm text-muted">{t('biodatas.suspend.hint')}</p>
          <TextInput
            label={t('biodatas.suspend.date')}
            type="date"
            required
            min={dayFromNow(1)}
            value={day}
            onChange={(e) => setDay(e.target.value)}
          />
          <TextInput
            label={t('biodatas.suspend.reason')}
            maxLength={500}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
          <Button type="submit" variant="outline" disabled={!day} loading={save.isPending}>
            {t('biodatas.suspend.pause')}
          </Button>
        </form>
      )}
    </Card>
  );
}

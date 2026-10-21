import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { ADJUSTMENT_ACTIONS } from '@/shared';
import { Button, FormMessage, SelectInput, TextArea, TextInput, useToast } from '@/ui';
import { useErrorMessage } from '../hooks/useErrorMessage.js';
import { adminApi } from '../lib/api.js';
import { useT } from '../providers/PreferencesProvider.jsx';

/**
 * Grant, revoke or refund connections by hand (overview, connections and user pages).
 * With `lockUser`, the form is for `initialUser` only and hides the user field.
 */
export function AdjustConnectionsForm({ initialUser = '', lockUser = false }) {
  const { t, lang } = useT();
  const toast = useToast();
  const errorMessage = useErrorMessage();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ user: initialUser, action: 'grant', quantity: 1, reason: '' });
  const adjust = useMutation({
    mutationFn: () => adminApi.adjustConnections({ ...form, quantity: Number(form.quantity) }),
    onSuccess: (res) => {
      toast.success(t('connections.applied', { n: res.balance }));
      setForm((f) => ({ ...f, quantity: 1, reason: '' }));
      queryClient.invalidateQueries({ queryKey: ['ledger'] });
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        adjust.mutate();
      }}
    >
      <FormMessage>{adjust.error && errorMessage(adjust.error)}</FormMessage>
      {!lockUser && (
        <TextInput label={t('connections.user')} required value={form.user} onChange={set('user')} />
      )}
      <div className="grid grid-cols-[minmax(0,1fr)_104px] gap-3">
        <SelectInput
          label={t('connections.action')}
          value={form.action}
          onChange={set('action')}
          options={ADJUSTMENT_ACTIONS.map((a) => ({ value: a.value, label: a[lang] }))}
        />
        <TextInput
          label={t('connections.quantity')}
          type="number"
          min={1}
          max={1000}
          required
          value={form.quantity}
          onChange={set('quantity')}
        />
      </div>
      <TextArea
        label={t('connections.reason')}
        rows={3}
        required
        minLength={3}
        value={form.reason}
        onChange={set('reason')}
      />
      <Button
        type="submit"
        loading={adjust.isPending}
        disabled={form.reason.trim().length < 3 || !form.user.trim()}
      >
        {t('connections.apply')}
      </Button>
    </form>
  );
}

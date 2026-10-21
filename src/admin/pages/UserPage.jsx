import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Link, useParams } from 'react-router';
import {
  BIODATA_STATUS,
  LEDGER_TYPES,
  PAYMENT_METHODS,
  PAYMENT_STATUS,
  ROLE_OPTIONS,
  USER_STATUS_OPTIONS,
  optionLabel,
} from '@/shared';
import { date, dateTime, digits, taka } from '@/shared/format';
import {
  Button,
  Card,
  Checkbox,
  FormMessage,
  LoadingBlock,
  Pill,
  SelectInput,
  STATUS_TONE,
  TextInput,
  useToast,
} from '@/ui';
import { AdjustConnectionsForm } from '../components/AdjustConnectionsForm.jsx';
import { PageHeader } from '../components/PageHeader.jsx';
import { useCan } from '../hooks/useAuth.js';
import { useErrorMessage } from '../hooks/useErrorMessage.js';
import { adminApi } from '../lib/api.js';
import { useT } from '../providers/PreferencesProvider.jsx';

/** Account fields staff can change. Read-only for staff without `users.manage`. */
function AccountForm({ user }) {
  const { t, lang } = useT();
  const allowed = useCan();
  const toast = useToast();
  const errorMessage = useErrorMessage();
  const queryClient = useQueryClient();
  const editable = allowed('users.manage');
  const [form, setForm] = useState({
    name: user.name,
    email: user.email ?? '',
    phoneNumber: user.phoneNumber ?? '',
    role: user.role,
    status: user.status,
    statusReason: user.statusReason ?? '',
    emailVerified: user.emailVerified,
    phoneNumberVerified: !!user.phoneNumberVerified,
  });
  const set = (key) => (e) =>
    setForm((f) => ({ ...f, [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));
  const save = useMutation({
    mutationFn: () => {
      const { role, statusReason, ...rest } = form;
      return adminApi.updateUser(user.id, {
        ...rest,
        email: rest.email.trim(),
        phoneNumber: rest.phoneNumber.trim() || null,
        ...(allowed('roles.assign') ? { role } : {}),
        ...(statusReason.trim() ? { statusReason: statusReason.trim() } : {}),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', user.id] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success(t('common.saved'));
    },
  });

  return (
    <Card
      as="form"
      title={t('users.details')}
      onSubmit={(e) => {
        e.preventDefault();
        save.mutate();
      }}
    >
      <FormMessage>
        {save.error &&
          (save.error.fields ? Object.values(save.error.fields).join(' ') : errorMessage(save.error))}
      </FormMessage>
      <fieldset disabled={!editable} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TextInput label={t('users.name')} required value={form.name} onChange={set('name')} />
        <SelectInput
          label={t('users.role')}
          value={form.role}
          onChange={set('role')}
          disabled={!allowed('roles.assign')}
          options={ROLE_OPTIONS.map((r) => ({ value: r.value, label: r[lang] }))}
        />
        <TextInput label={t('users.email')} type="email" value={form.email} onChange={set('email')} />
        <TextInput
          label={t('users.phone')}
          type="tel"
          value={form.phoneNumber}
          onChange={set('phoneNumber')}
        />
        <SelectInput
          label={t('common.status')}
          value={form.status}
          onChange={set('status')}
          options={USER_STATUS_OPTIONS.map((s) => ({ value: s.value, label: s[lang] }))}
        />
        <TextInput label={t('users.statusReason')} value={form.statusReason} onChange={set('statusReason')} />
        <Checkbox
          label={t('users.emailVerified')}
          checked={form.emailVerified}
          onChange={set('emailVerified')}
        />
        <Checkbox
          label={t('users.phoneVerified')}
          checked={form.phoneNumberVerified}
          onChange={set('phoneNumberVerified')}
        />
      </fieldset>
      {editable && (
        <Button type="submit" className="self-end" loading={save.isPending}>
          {t('common.save')}
        </Button>
      )}
    </Card>
  );
}

function ResetPassword({ userId }) {
  const { t } = useT();
  const toast = useToast();
  const errorMessage = useErrorMessage();
  const [password, setPassword] = useState('');
  const reset = useMutation({
    mutationFn: () => adminApi.resetUserPassword(userId, password),
    onSuccess: () => {
      setPassword('');
      toast.success(t('users.resetDone'));
    },
  });
  return (
    <Card
      as="form"
      title={t('users.resetPassword')}
      onSubmit={(e) => {
        e.preventDefault();
        reset.mutate();
      }}
    >
      <FormMessage>{reset.error && errorMessage(reset.error)}</FormMessage>
      <TextInput
        label={t('users.password')}
        type="password"
        autoComplete="new-password"
        required
        minLength={8}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <Button type="submit" variant="outline" disabled={password.length < 8} loading={reset.isPending}>
        {t('users.resetPassword')}
      </Button>
    </Card>
  );
}

export function UserPage() {
  const { id } = useParams();
  const { t, lang } = useT();
  const allowed = useCan();
  const errorMessage = useErrorMessage();
  const query = useQuery({ queryKey: ['user', id], queryFn: () => adminApi.user(id) });

  if (query.isLoading) return <LoadingBlock label={t('common.loading')} />;
  if (query.error) return <FormMessage>{errorMessage(query.error)}</FormMessage>;
  const { user, biodata, payments, ledger, counts } = query.data;

  return (
    <>
      <PageHeader
        kicker={
          <Link to="/users" className="hover:underline">
            ← {t('nav.users')}
          </Link>
        }
        title={user.name}
        sub={[
          optionLabel(ROLE_OPTIONS, user.role, lang),
          t('common.joined', { date: date(user.createdAt, lang) }),
          user.lastLoginAt && t('users.lastLogin', { date: dateTime(user.lastLoginAt, lang) }),
        ]
          .filter(Boolean)
          .join(' · ')}
        actions={
          <Pill tone={STATUS_TONE[user.status]}>{optionLabel(USER_STATUS_OPTIONS, user.status, lang)}</Pill>
        }
      />

      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="flex min-w-0 flex-col gap-6">
          {/* Re-mount the form when the saved account changes so it shows the stored values. */}
          <AccountForm key={JSON.stringify(user)} user={user} />

          <Card title={t('users.payments')}>
            {payments.length === 0 ? (
              <p className="text-muted">{t('common.empty')}</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="table-admin min-w-[620px]">
                  <thead>
                    <tr>
                      {['invoice', 'method', 'trx', 'amount', 'date', 'status'].map((c) => (
                        <th key={c}>{t(`payments.cols.${c}`)}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((p) => (
                      <tr key={p.id}>
                        <td className="font-mono text-[13px]">{p.invoiceNo}</td>
                        <td>{optionLabel(PAYMENT_METHODS, p.method, lang)}</td>
                        <td className="font-mono text-[13px]">{p.trxId ?? '—'}</td>
                        <td className="font-bold">{taka(p.amount, lang)}</td>
                        <td className="whitespace-nowrap">{date(p.createdAt, lang)}</td>
                        <td>
                          <Pill tone={STATUS_TONE[p.status]}>
                            {optionLabel(PAYMENT_STATUS, p.status, lang)}
                          </Pill>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          <Card title={t('users.ledger')}>
            {ledger.length === 0 ? (
              <p className="text-muted">{t('common.empty')}</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="table-admin min-w-[620px]">
                  <thead>
                    <tr>
                      {['date', 'type', 'change', 'balance', 'details', 'by'].map((c) => (
                        <th key={c}>{t(`connections.cols.${c}`)}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {ledger.map((e) => (
                      <tr key={e.id}>
                        <td className="whitespace-nowrap">{dateTime(e.createdAt, lang)}</td>
                        <td>{optionLabel(LEDGER_TYPES, e.type, lang)}</td>
                        <td className={`font-bold ${e.delta < 0 ? 'text-danger' : 'text-sage'}`}>
                          {e.delta > 0 ? '+' : ''}
                          {digits(e.delta, lang)}
                        </td>
                        <td>{digits(e.balanceAfter, lang)}</td>
                        <td className="max-w-64 text-[13px]">
                          {[e.biodataNo, e.reason].filter(Boolean).join(' · ') || '—'}
                        </td>
                        <td>{e.actor ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>

        <aside className="flex flex-col gap-6">
          <Card title={t('users.cols.balance')}>
            <span className="font-display text-5xl font-medium text-rose-text">
              {digits(user.connectionBalance, lang)}
            </span>
            <span className="text-sm text-muted">
              {t('users.connectionTotals', {
                bought: digits(user.connectionsPurchased, lang),
                used: digits(user.connectionsUsed, lang),
              })}
            </span>
            <span className="text-sm text-muted">
              {t('users.counts', {
                unlocks: digits(counts.unlocks, lang),
                tickets: digits(counts.tickets, lang),
                reports: digits(counts.reportsAgainst, lang),
              })}
            </span>
          </Card>
          <Card title={t('users.cols.biodata')}>
            {biodata ? (
              <div className="flex items-center justify-between gap-3">
                <Link to={`/biodatas/${biodata.id}`} className="font-bold text-rose-text hover:underline">
                  {biodata.biodataNo}
                </Link>
                <Pill tone={STATUS_TONE[biodata.status]}>
                  {optionLabel(BIODATA_STATUS, biodata.status, lang)}
                </Pill>
              </div>
            ) : (
              <p className="text-muted">{t('common.none')}</p>
            )}
          </Card>
          {allowed('connections.adjust') && (
            <Card title={t('users.adjust')}>
              <AdjustConnectionsForm initialUser={user.id} lockUser />
            </Card>
          )}
          {allowed('users.manage') && <ResetPassword userId={user.id} />}
        </aside>
      </div>
    </>
  );
}

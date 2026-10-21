import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { BIODATA_STATUS, ROLE_OPTIONS, USER_STATUS_OPTIONS, optionLabel } from '@/shared';
import { date, digits } from '@/shared/format';
import { Button, FormMessage, Modal, Pill, SelectInput, STATUS_TONE, TextInput } from '@/ui';
import { DataCard } from '../components/DataCard.jsx';
import { PageHeader } from '../components/PageHeader.jsx';
import { UserCell } from '../components/UserCell.jsx';
import { useCan } from '../hooks/useAuth.js';
import { useErrorMessage } from '../hooks/useErrorMessage.js';
import { usePageParam, useQueryParam } from '../hooks/useQueryParam.js';
import { adminApi } from '../lib/api.js';
import { useT } from '../providers/PreferencesProvider.jsx';

const COLUMNS = ['name', 'role', 'status', 'verified', 'balance', 'biodata', 'joined'];

function CreateUser({ onClose }) {
  const { t, lang } = useT();
  const allowed = useCan();
  const errorMessage = useErrorMessage();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    password: '',
    role: 'user',
  });
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const create = useMutation({
    mutationFn: () =>
      adminApi.createUser({
        ...form,
        email: form.email.trim(),
        phoneNumber: form.phoneNumber.trim() || undefined,
      }),
    onSuccess: ({ user }) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      onClose();
      navigate(`/users/${user.id}`);
    },
  });
  const roles = ROLE_OPTIONS.filter((r) => allowed('roles.assign') || r.value === 'user');

  return (
    <Modal
      open
      onClose={onClose}
      title={t('users.createTitle')}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" form="create-user" loading={create.isPending}>
            {t('common.create')}
          </Button>
        </>
      }
    >
      <form
        id="create-user"
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          create.mutate();
        }}
      >
        <FormMessage>
          {create.error &&
            (create.error.fields ? Object.values(create.error.fields).join(' ') : errorMessage(create.error))}
        </FormMessage>
        <TextInput label={t('users.name')} required minLength={2} value={form.name} onChange={set('name')} />
        <TextInput
          label={t('users.email')}
          type="email"
          required
          value={form.email}
          onChange={set('email')}
        />
        <TextInput
          label={t('users.phone')}
          type="tel"
          placeholder="01XXXXXXXXX"
          value={form.phoneNumber}
          onChange={set('phoneNumber')}
        />
        <TextInput
          label={t('users.password')}
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          value={form.password}
          onChange={set('password')}
        />
        <SelectInput
          label={t('users.role')}
          value={form.role}
          onChange={set('role')}
          options={roles.map((r) => ({ value: r.value, label: r[lang] }))}
        />
      </form>
    </Modal>
  );
}

export function UsersPage() {
  const { t, lang } = useT();
  const allowed = useCan();
  const [q, setQ] = useQueryParam('q');
  const [role, setRole] = useQueryParam('role');
  const [status, setStatus] = useQueryParam('status');
  const [page, setPage] = usePageParam();
  const [creating, setCreating] = useState(false);
  const query = useQuery({
    queryKey: ['users', q, role, status, page],
    queryFn: () => adminApi.users({ q, role, status, page }),
    placeholderData: keepPreviousData,
  });

  return (
    <>
      <PageHeader
        title={t('users.title')}
        sub={t('users.sub')}
        actions={
          allowed('users.manage') && <Button onClick={() => setCreating(true)}>{t('users.newStaff')}</Button>
        }
      />
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="search"
          defaultValue={q}
          placeholder={t('users.searchPh')}
          onKeyDown={(e) => e.key === 'Enter' && setQ(e.currentTarget.value.trim())}
          className="h-11 min-w-64 flex-1 rounded-full border border-line bg-surface px-5 text-sm"
        />
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="field-input min-h-11 w-auto py-2"
          aria-label={t('users.roleFilter')}
        >
          <option value="">
            {t('users.roleFilter')}: {t('common.all')}
          </option>
          <option value="staff">{t('users.staffOnly')}</option>
          {ROLE_OPTIONS.map((r) => (
            <option key={r.value} value={r.value}>
              {r[lang]}
            </option>
          ))}
        </select>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="field-input min-h-11 w-auto py-2"
          aria-label={t('users.statusFilter')}
        >
          <option value="">
            {t('users.statusFilter')}: {t('common.all')}
          </option>
          {USER_STATUS_OPTIONS.map((s) => (
            <option key={s.value} value={s.value}>
              {s[lang]}
            </option>
          ))}
        </select>
      </div>
      <DataCard query={query} page={page} onPage={setPage}>
        {(items) => (
          <div className="overflow-x-auto">
            <table className="table-admin min-w-[900px]">
              <thead>
                <tr>
                  {COLUMNS.map((c) => (
                    <th key={c}>{t(`users.cols.${c}`)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <UserCell user={u} />
                    </td>
                    <td>{optionLabel(ROLE_OPTIONS, u.role, lang)}</td>
                    <td>
                      <Pill tone={STATUS_TONE[u.status]}>
                        {optionLabel(USER_STATUS_OPTIONS, u.status, lang)}
                      </Pill>
                    </td>
                    <td>{u.isVerified ? t('common.yes') : t('common.no')}</td>
                    <td>{digits(u.connectionBalance, lang)}</td>
                    <td>
                      {u.biodata ? (
                        <span className="flex flex-col gap-1">
                          <b>{u.biodata.biodataNo}</b>
                          <Pill tone={STATUS_TONE[u.biodata.status]} className="self-start">
                            {optionLabel(BIODATA_STATUS, u.biodata.status, lang)}
                          </Pill>
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="whitespace-nowrap">{date(u.createdAt, lang)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </DataCard>
      {creating && <CreateUser onClose={() => setCreating(false)} />}
    </>
  );
}

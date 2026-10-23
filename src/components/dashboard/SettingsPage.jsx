'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  Button,
  Card,
  ConfirmDialog,
  FormMessage,
  LoadingBlock,
  Modal,
  Pill,
  SelectInput,
  TextInput,
} from '@/ui';
import { AUTH_KEY, useAuth, useRefreshAuth } from '@/hooks/use-auth';
import { useErrorMessage } from '@/hooks/use-error-message';
import { accountApi } from '@/lib/api/endpoints';
import { authCall, authClient } from '@/lib/auth-client';
import { dateTime, digits } from '@/lib/format';
import { validate } from '@/lib/validators';
import { usePreferences } from '@/providers/PreferencesProvider';
import { useToast } from '@/ui';
import { PageTitle } from './DashboardShell.jsx';
import { BiodataManagement } from './biodata-lifecycle/BiodataManagement.jsx';

function ProfileCard({ user }) {
  const { t, lang, setLang } = usePreferences();
  const toast = useToast();
  const errorMessage = useErrorMessage();
  const [name, setName] = useState(user.name);
  const [language, setLanguage] = useState(user.language ?? lang);
  const refreshAuth = useRefreshAuth();
  const save = useMutation({
    mutationFn: async () => {
      await authCall(authClient.updateUser({ name: name.trim(), language }));
      return refreshAuth();
    },
    onSuccess: (updated) => {
      if (updated?.language && updated.language !== lang) setLang(updated.language);
      toast.success(t('common.saved'));
    },
  });
  return (
    <Card title={t('settings.profile')}>
      <FormMessage>{save.error && errorMessage(save.error)}</FormMessage>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TextInput
          label={t('settings.name')}
          value={name}
          maxLength={80}
          onChange={(e) => setName(e.target.value)}
        />
        <SelectInput
          label={t('settings.language')}
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          options={[
            { value: 'en', label: 'English' },
            { value: 'bn', label: 'বাংলা' },
          ]}
        />
        <TextInput label={t('settings.email')} value={user.email ?? '—'} readOnly disabled />
        <TextInput label={t('settings.phone')} value={user.phone ?? '—'} readOnly disabled />
      </div>
      <Button
        className="self-end"
        disabled={name.trim().length < 2}
        loading={save.isPending}
        onClick={() => save.mutate()}
      >
        {t('settings.saveProfile')}
      </Button>
    </Card>
  );
}

function PasswordCard() {
  const { t, lang } = usePreferences();
  const toast = useToast();
  const queryClient = useQueryClient();
  const errorMessage = useErrorMessage();
  const [form, setForm] = useState({ currentPassword: '', newPassword: '' });
  const [errors, setErrors] = useState({});
  const change = useMutation({
    // Better Auth signs the other devices out and gives this one a fresh session.
    mutationFn: async () => {
      const before = await authCall(authClient.listSessions());
      await authCall(authClient.changePassword({ ...form, revokeOtherSessions: true }));
      return { signedOut: Math.max((before?.length ?? 1) - 1, 0) };
    },
    onSuccess: ({ signedOut }) => {
      setForm({ currentPassword: '', newPassword: '' });
      toast.success(
        signedOut
          ? t('settings.changedSignedOut', { n: digits(signedOut, lang) })
          : t('settings.changedOnly'),
      );
      queryClient.invalidateQueries({ queryKey: SESSIONS_KEY });
    },
  });
  const submit = (e) => {
    e.preventDefault();
    const found = validate(form, { currentPassword: 'required', newPassword: 'password' });
    setErrors(found);
    if (!Object.keys(found).length) change.mutate();
  };
  return (
    <Card as="form" title={t('settings.password')} onSubmit={submit} noValidate>
      <FormMessage>{change.error && errorMessage(change.error)}</FormMessage>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TextInput
          label={t('settings.current')}
          type="password"
          autoComplete="current-password"
          value={form.currentPassword}
          error={errors.currentPassword && t(errors.currentPassword)}
          onChange={(e) => setForm((f) => ({ ...f, currentPassword: e.target.value }))}
        />
        <TextInput
          label={t('settings.newPass')}
          type="password"
          autoComplete="new-password"
          value={form.newPassword}
          error={errors.newPassword && t(errors.newPassword)}
          onChange={(e) => setForm((f) => ({ ...f, newPassword: e.target.value }))}
        />
      </div>
      <Button type="submit" className="self-end" loading={change.isPending}>
        {t('settings.changePass')}
      </Button>
    </Card>
  );
}

const SESSIONS_KEY = ['auth', 'sessions'];

/** "Chrome on Android" from a user-agent string; good enough to recognise a device. */
function deviceName(userAgent, t) {
  if (!userAgent) return t('settings.unknownDevice');
  const ua = userAgent;
  const browser =
    [
      [/Edg\//, 'Edge'],
      [/OPR\/|Opera/, 'Opera'],
      [/SamsungBrowser/, 'Samsung Internet'],
      [/Firefox\//, 'Firefox'],
      [/Chrome\//, 'Chrome'],
      [/Safari\//, 'Safari'],
    ].find(([re]) => re.test(ua))?.[1] ?? null;
  const os =
    [
      [/Android/, 'Android'],
      [/iPhone|iPad|iPod/, 'iOS'],
      [/Windows/, 'Windows'],
      [/Mac OS X|Macintosh/, 'macOS'],
      [/Linux/, 'Linux'],
    ].find(([re]) => re.test(ua))?.[1] ?? null;
  if (browser && os) return t('settings.deviceOn', { browser, os });
  return browser ?? os ?? t('settings.unknownDevice');
}

/** Where the account is signed in, with sign-out per device or everywhere. */
function DevicesCard() {
  const { t, lang } = usePreferences();
  const toast = useToast();
  const router = useRouter();
  const queryClient = useQueryClient();
  const errorMessage = useErrorMessage();
  const [confirmAll, setConfirmAll] = useState(false);
  const { user } = useAuth();
  const sessions = useQuery({
    queryKey: SESSIONS_KEY,
    queryFn: () => authCall(authClient.listSessions()),
  });
  const signedOutHere = () => {
    queryClient.clear();
    queryClient.setQueryData(AUTH_KEY, null);
    router.push('/login');
  };
  const revoke = useMutation({
    mutationFn: (session) => authCall(authClient.revokeSession({ token: session.token })),
    onSuccess: (_res, session) => {
      if (session.token === user?.sessionToken) return signedOutHere();
      toast.success(t('settings.deviceSignedOut'));
      queryClient.invalidateQueries({ queryKey: SESSIONS_KEY });
    },
    onError: (e) => toast.error(errorMessage(e)),
  });
  const everywhere = useMutation({
    mutationFn: async () => {
      await authCall(authClient.revokeSessions());
      // The cookie of this device is now useless; clear it too.
      await authClient.signOut().catch(() => undefined);
    },
    onSuccess: signedOutHere,
    onError: (e) => toast.error(errorMessage(e)),
  });
  const items = [...(sessions.data ?? [])]
    .map((s) => ({ ...s, current: s.token === user?.sessionToken }))
    .sort(
      (a, b) =>
        b.current - a.current || new Date(b.updatedAt ?? b.createdAt) - new Date(a.updatedAt ?? a.createdAt),
    );
  return (
    <Card title={t('settings.devices')}>
      <p className="text-muted">{t('settings.devicesText')}</p>
      {sessions.isLoading ? (
        <LoadingBlock label={t('common.loading')} />
      ) : (
        <ul className="flex flex-col">
          {items.map((s) => (
            <li key={s.id} className="flex items-center justify-between gap-4 border-b border-line py-3.5">
              <span className="flex min-w-0 flex-col gap-0.5">
                <span className="flex flex-wrap items-center gap-2">
                  <b className="text-[15px]">{deviceName(s.userAgent, t)}</b>
                  {s.current && <Pill tone="sage">{t('settings.thisDevice')}</Pill>}
                </span>
                <span className="text-[13px] text-muted">
                  {[
                    t('settings.lastActive', { when: dateTime(s.updatedAt ?? s.createdAt, lang) }),
                    s.ipAddress,
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </span>
              </span>
              <Button
                size="sm"
                variant="ghost"
                loading={revoke.isPending && revoke.variables?.token === s.token}
                onClick={() => revoke.mutate(s)}
              >
                {t('settings.signOutDevice')}
              </Button>
            </li>
          ))}
        </ul>
      )}
      <Button variant="outlineRose" className="self-start" onClick={() => setConfirmAll(true)}>
        {t('settings.signOutEverywhere')}
      </Button>
      <ConfirmDialog
        open={confirmAll}
        onClose={() => setConfirmAll(false)}
        title={t('settings.signOutEverywhere')}
        description={t('settings.signOutEverywhereText')}
        confirmLabel={t('settings.signOutEverywhere')}
        cancelLabel={t('common.cancel')}
        loading={everywhere.isPending}
        onConfirm={() => everywhere.mutate()}
      />
    </Card>
  );
}

function DeactivateCard() {
  const { t } = usePreferences();
  const router = useRouter();
  const queryClient = useQueryClient();
  const errorMessage = useErrorMessage();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState('');
  const deactivate = useMutation({
    mutationFn: () => accountApi.deactivate({ password }),
    onSuccess: () => {
      queryClient.clear();
      queryClient.setQueryData(AUTH_KEY, null);
      router.push('/');
    },
  });
  return (
    <Card title={t('settings.deactivateTitle')}>
      <p className="text-muted">{t('settings.deactivateText')}</p>
      <Button variant="ghost" className="self-start text-danger" onClick={() => setOpen(true)}>
        {t('settings.deactivate')}
      </Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={t('settings.deactivateTitle')}
        footer={
          <Button variant="danger" loading={deactivate.isPending} onClick={() => deactivate.mutate()}>
            {t('settings.deactivate')}
          </Button>
        }
      >
        <FormMessage>{deactivate.error && errorMessage(deactivate.error)}</FormMessage>
        <TextInput
          label={t('settings.confirmPassword')}
          hint={t('settings.confirmPasswordHint')}
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </Modal>
    </Card>
  );
}

export function SettingsPage() {
  const { t } = usePreferences();
  const { user } = useAuth();
  if (!user) return null;
  return (
    <>
      <PageTitle title={t('settings.title')} />
      <ProfileCard user={user} />
      <PasswordCard />
      <DevicesCard />
      <BiodataManagement />
      <DeactivateCard />
    </>
  );
}

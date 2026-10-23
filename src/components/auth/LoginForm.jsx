'use client';

import { useMutation } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button, Checkbox, FormMessage, TextInput } from '@/ui';
import { useRefreshAuth } from '@/hooks/use-auth';
import { useErrorMessage } from '@/hooks/use-error-message';
import { authCall, authClient, homeFor } from '@/lib/auth-client';
import { safeNext, validate } from '@/lib/validators';
import { useT } from '@/providers/PreferencesProvider';
import { AuthCard } from './AuthCard.jsx';

/** Log in with email and password. Admins land on the admin dashboard, members on theirs. */
export function LoginForm({ next }) {
  const { t } = useT();
  const router = useRouter();
  const refreshAuth = useRefreshAuth();
  const errorMessage = useErrorMessage();
  const [form, setForm] = useState({ email: '', password: '' });
  const [remember, setRemember] = useState(true);
  const [errors, setErrors] = useState({});

  const login = useMutation({
    mutationFn: () =>
      authCall(
        authClient.signIn.email({
          email: form.email.trim().toLowerCase(),
          password: form.password,
          rememberMe: remember,
        }),
      ),
    onSuccess: async () => {
      const user = await refreshAuth();
      router.push(homeFor(user, next ? safeNext(next) : undefined));
      router.refresh();
    },
  });

  const submit = (e) => {
    e.preventDefault();
    const found = validate(form, { email: 'email', password: 'required' });
    setErrors(found);
    if (!Object.keys(found).length) login.mutate();
  };
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  return (
    <AuthCard
      title={t('auth.loginTitle')}
      subtitle={t('auth.loginSub')}
      footer={
        <>
          {t('auth.noAccount')}{' '}
          <Link href="/register" className="font-bold text-rose-text">
            {t('auth.register')}
          </Link>
        </>
      }
    >
      <form onSubmit={submit} noValidate className="flex flex-col gap-4">
        <FormMessage>{login.error && errorMessage(login.error)}</FormMessage>
        <TextInput
          label={t('auth.email')}
          type="email"
          autoComplete="username"
          value={form.email}
          onChange={set('email')}
          error={errors.email && t(errors.email)}
        />
        <TextInput
          label={t('auth.password')}
          type="password"
          autoComplete="current-password"
          value={form.password}
          onChange={set('password')}
          error={errors.password && t(errors.password)}
        />
        <Checkbox
          label={t('auth.remember')}
          checked={remember}
          onChange={(e) => setRemember(e.target.checked)}
        />
        <Button type="submit" size="lg" loading={login.isPending}>
          {t('auth.login')}
        </Button>
      </form>
    </AuthCard>
  );
}

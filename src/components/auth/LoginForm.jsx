'use client';

import { useMutation } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button, Checkbox, FormMessage, Tabs, TextInput } from '@/ui';
import { useRefreshAuth } from '@/hooks/use-auth';
import { useErrorMessage } from '@/hooks/use-error-message';
import { homeFor } from '@/lib/auth-client';
import { safeNext, validate } from '@/lib/validators';
import { useT } from '@/providers/PreferencesProvider';
import { AuthCard } from './AuthCard.jsx';
import { GoogleSignIn } from './GoogleSignIn.jsx';
import { parseIdentifier, sendSignInCode, signInWithCode, signInWithPassword } from './sign-in.js';

// Errors that can come back to /login?error=… (Google sign-in, an inactive account).
const REDIRECT_ERRORS = { google: 'auth.googleFailed', inactive: 'auth.googleInactive' };

/**
 * Log in with a password or with a one-time code sent to the email or mobile
 * number, plus Google sign-in when the server has it configured. Admins land on
 * the admin dashboard, members on theirs.
 */
export function LoginForm({ next, googleEnabled = false, redirectError, passwordReset = false }) {
  const { t } = useT();
  const router = useRouter();
  const refreshAuth = useRefreshAuth();
  const errorMessage = useErrorMessage();
  const [mode, setMode] = useState('password');
  const [form, setForm] = useState({ identifier: '', password: '', code: '' });
  const [remember, setRemember] = useState(true);
  const [codeSent, setCodeSent] = useState(false);
  const [errors, setErrors] = useState({});

  const signedIn = async () => {
    const user = await refreshAuth();
    router.push(homeFor(user, next ? safeNext(next) : undefined));
    router.refresh();
  };
  const id = () => parseIdentifier(form.identifier);

  const login = useMutation({
    mutationFn: () => signInWithPassword(id(), form.password, remember),
    onSuccess: signedIn,
  });

  const sendCode = useMutation({
    mutationFn: () => sendSignInCode(id()),
    onSuccess: () => setCodeSent(true),
  });

  const codeLogin = useMutation({
    mutationFn: () => signInWithCode(id(), form.code.trim()),
    onSuccess: signedIn,
  });

  const submit = (e) => {
    e.preventDefault();
    if (mode === 'password') {
      const found = validate(form, { identifier: 'identifier', password: 'required' });
      setErrors(found);
      if (!Object.keys(found).length) login.mutate();
    } else if (!codeSent) {
      const found = validate(form, { identifier: 'identifier' });
      setErrors(found);
      if (!Object.keys(found).length) sendCode.mutate();
    } else {
      const found = validate(form, { code: 'code' });
      setErrors(found);
      if (!Object.keys(found).length) codeLogin.mutate();
    }
  };
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const switchMode = (value) => {
    setMode(value);
    setErrors({});
    setCodeSent(false);
    setForm((f) => ({ ...f, password: '', code: '' }));
  };

  const failure = mode === 'password' ? login.error : (codeSent ? codeLogin.error : null) || sendCode.error;
  const loading = login.isPending || sendCode.isPending || codeLogin.isPending;

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
      {passwordReset && <FormMessage tone="success">{t('auth.passwordResetDone')}</FormMessage>}
      {redirectError && REDIRECT_ERRORS[redirectError] && (
        <FormMessage>{t(REDIRECT_ERRORS[redirectError])}</FormMessage>
      )}
      <div className="flex justify-center">
        <Tabs
          label={t('auth.loginWith')}
          value={mode}
          onChange={switchMode}
          items={[
            { value: 'password', label: t('auth.withPassword') },
            { value: 'code', label: t('auth.withCode') },
          ]}
        />
      </div>
      <form onSubmit={submit} noValidate className="flex flex-col gap-4">
        <FormMessage>{failure && errorMessage(failure)}</FormMessage>
        <TextInput
          label={t('auth.identifier')}
          placeholder={t('auth.identifierPh')}
          autoComplete="username"
          value={form.identifier}
          readOnly={mode === 'code' && codeSent}
          onChange={set('identifier')}
          error={errors.identifier && t(errors.identifier)}
        />
        {mode === 'password' && (
          <>
            <TextInput
              label={t('auth.password')}
              type="password"
              autoComplete="current-password"
              value={form.password}
              onChange={set('password')}
              error={errors.password && t(errors.password)}
            />
            <Link href="/forgot-password" className="self-end text-sm font-bold text-rose-text">
              {t('auth.forgot')}
            </Link>
          </>
        )}
        {mode === 'code' && codeSent && (
          <>
            <p className="text-sm text-muted">{t('auth.codeSent', { to: form.identifier })}</p>
            <TextInput
              label={t('auth.code')}
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              className="[&_input]:text-center [&_input]:text-2xl [&_input]:tracking-[0.5em]"
              value={form.code}
              onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.replace(/\D/g, '') }))}
              error={errors.code && t(errors.code)}
            />
            <button
              type="button"
              className="self-end text-sm font-bold text-rose-text"
              onClick={() => {
                setCodeSent(false);
                setForm((f) => ({ ...f, code: '' }));
              }}
            >
              {t('auth.changeIdentifier')}
            </button>
          </>
        )}
        {mode === 'password' && (
          <Checkbox
            label={t('auth.remember')}
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
          />
        )}
        <Button type="submit" size="lg" loading={loading}>
          {mode === 'code' && !codeSent ? t('auth.sendCode') : t('auth.login')}
        </Button>
      </form>
      {googleEnabled && <GoogleSignIn next={next} />}
    </AuthCard>
  );
}

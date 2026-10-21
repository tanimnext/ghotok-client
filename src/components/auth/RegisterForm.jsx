'use client';

import { useMutation } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button, FormMessage, TextInput } from '@/ui';
import { useRefreshAuth } from '@/hooks/use-auth';
import { useErrorMessage } from '@/hooks/use-error-message';
import { authCall, authClient, toPhoneNumber } from '@/lib/auth-client';
import { validate } from '@/lib/validators';
import { useT } from '@/providers/PreferencesProvider';
import { AuthCard } from './AuthCard.jsx';
import { GoogleSignIn } from './GoogleSignIn.jsx';
import { sendVerificationCode } from './sign-in.js';

/**
 * Creates an account with Better Auth (email and password, optional mobile number).
 * Every new account is a member (`user`); the member is signed in straight away and
 * asked to confirm their email with a code.
 */
export function RegisterForm({ googleEnabled = false }) {
  const { t, lang } = useT();
  const router = useRouter();
  const refreshAuth = useRefreshAuth();
  const errorMessage = useErrorMessage();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [errors, setErrors] = useState({});

  const register = useMutation({
    mutationFn: async () => {
      const email = form.email.trim().toLowerCase();
      const phoneNumber = toPhoneNumber(form.phone) ?? undefined;
      await authCall(
        authClient.signUp.email({
          name: form.name.trim(),
          email,
          password: form.password,
          phoneNumber,
          language: lang,
        }),
      );
      await refreshAuth();
      // The account works already; the code only confirms the email. A failed send is not fatal.
      await sendVerificationCode({ email }).catch(() => undefined);
      return email;
    },
    onSuccess: (email) => {
      router.push(`/verify?email=${encodeURIComponent(email)}&next=/dashboard/biodata`);
      router.refresh();
    },
  });

  const submit = (e) => {
    e.preventDefault();
    const found = validate(form, {
      name: 'name',
      email: 'email',
      phone: 'optionalPhone',
      password: 'password',
    });
    setErrors(found);
    if (!Object.keys(found).length) register.mutate();
  };
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const err = (key) => errors[key] && t(errors[key]);

  return (
    <AuthCard
      title={t('auth.registerTitle')}
      subtitle={t('auth.registerSub')}
      footer={
        <>
          {t('auth.haveAccount')}{' '}
          <Link href="/login" className="font-bold text-rose-text">
            {t('auth.login')}
          </Link>
        </>
      }
    >
      <form onSubmit={submit} noValidate className="flex flex-col gap-4">
        <FormMessage>{register.error && errorMessage(register.error)}</FormMessage>
        <TextInput
          label={t('auth.name')}
          autoComplete="name"
          value={form.name}
          onChange={set('name')}
          error={err('name')}
          required
        />
        <TextInput
          label={t('auth.email')}
          type="email"
          autoComplete="email"
          value={form.email}
          onChange={set('email')}
          error={err('email')}
          required
        />
        <TextInput
          label={t('auth.phone')}
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="01XXXXXXXXX"
          hint={t('auth.phoneOptional')}
          value={form.phone}
          onChange={set('phone')}
          error={err('phone')}
        />
        <TextInput
          label={t('auth.password')}
          type="password"
          autoComplete="new-password"
          hint={t('auth.passwordHint')}
          value={form.password}
          onChange={set('password')}
          error={err('password')}
          required
        />
        <p className="text-[13px] leading-relaxed text-muted">
          {t('auth.agree')}{' '}
          <Link href="/terms" className="font-semibold underline">
            {t('auth.terms')}
          </Link>{' '}
          {t('auth.and')}{' '}
          <Link href="/privacy-policy" className="font-semibold underline">
            {t('auth.privacy')}
          </Link>
          .
        </p>
        <Button type="submit" size="lg" loading={register.isPending}>
          {t('auth.register')}
        </Button>
      </form>
      {googleEnabled && <GoogleSignIn />}
    </AuthCard>
  );
}

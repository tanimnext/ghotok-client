'use client';

import { useMutation } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button, FormMessage, TextInput, useToast } from '@/ui';
import { useRefreshAuth } from '@/hooks/use-auth';
import { useErrorMessage } from '@/hooks/use-error-message';
import { homeFor } from '@/lib/auth-client';
import { safeNext, validate } from '@/lib/validators';
import { useT } from '@/providers/PreferencesProvider';
import { AuthCard } from './AuthCard.jsx';
import { parseIdentifier, sendVerificationCode, verifyCode } from './sign-in.js';

const RESEND_SECONDS = 60;

/** Confirms the signed-in member's email or mobile number with the code we sent. */
export function VerifyForm({ identifier, next }) {
  const { t } = useT();
  const router = useRouter();
  const toast = useToast();
  const refreshAuth = useRefreshAuth();
  const errorMessage = useErrorMessage();
  const [code, setCode] = useState('');
  const [error, setError] = useState(null);
  const [wait, setWait] = useState(RESEND_SECONDS);
  const id = parseIdentifier(identifier);
  const destination = next ? safeNext(next) : undefined;

  useEffect(() => {
    if (wait <= 0) return undefined;
    const timer = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(timer);
  }, [wait]);

  const verify = useMutation({
    mutationFn: () => verifyCode(id, code.trim()),
    onSuccess: async () => {
      const user = await refreshAuth();
      router.push(homeFor(user, destination));
      router.refresh();
    },
  });

  const resend = useMutation({
    mutationFn: () => sendVerificationCode(id),
    onSuccess: () => {
      setWait(RESEND_SECONDS);
      toast.success(t('auth.resent'));
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  const submit = (e) => {
    e.preventDefault();
    const found = validate({ code }, { code: 'code' });
    setError(found.code ?? null);
    if (!found.code) verify.mutate();
  };

  if (!id) {
    return (
      <AuthCard title={t('auth.verifyTitle')}>
        <FormMessage>{t('validation.identifier')}</FormMessage>
      </AuthCard>
    );
  }

  return (
    <AuthCard title={t('auth.verifyTitle')} subtitle={t('auth.verifySub', { to: identifier })}>
      <form onSubmit={submit} noValidate className="flex flex-col gap-4">
        <FormMessage>{verify.error && errorMessage(verify.error)}</FormMessage>
        <TextInput
          label={t('auth.code')}
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          className="[&_input]:text-center [&_input]:text-2xl [&_input]:tracking-[0.5em]"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
          error={error && t(error)}
        />
        <Button type="submit" size="lg" loading={verify.isPending}>
          {t('auth.verify')}
        </Button>
        <Button
          variant="ghost"
          disabled={wait > 0}
          loading={resend.isPending}
          onClick={() => resend.mutate()}
        >
          {t('auth.resend')}
          {wait > 0 ? ` (${wait})` : ''}
        </Button>
        <Link href={destination ?? '/dashboard'} className="self-center text-sm font-bold text-muted">
          {t('auth.verifyLater')}
        </Link>
      </form>
    </AuthCard>
  );
}

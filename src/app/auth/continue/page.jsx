'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect } from 'react';
import { LoadingBlock } from '@/ui';
import { useAuth } from '@/hooks/use-auth';
import { homeFor } from '@/lib/auth-client';
import { safeNext } from '@/lib/validators';
import { useT } from '@/providers/PreferencesProvider';

/** Where Google sign-in returns to: opens the admin or member dashboard by role. */
function Continue() {
  const { t } = useT();
  const router = useRouter();
  const params = useSearchParams();
  const { user, isLoading } = useAuth();
  const next = params.get('next');

  useEffect(() => {
    if (isLoading) return;
    if (!user) router.replace('/login?error=google');
    else if (user.status && user.status !== 'active') router.replace('/login?error=inactive');
    else router.replace(homeFor(user, next ? safeNext(next) : undefined));
  }, [isLoading, user, next, router]);

  return <LoadingBlock label={t('auth.signingIn')} />;
}

export default function ContinuePage() {
  return (
    <main className="flex min-h-dvh items-center justify-center">
      <Suspense>
        <Continue />
      </Suspense>
    </main>
  );
}

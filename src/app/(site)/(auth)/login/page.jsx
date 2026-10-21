import { LoginForm } from '@/components/auth/LoginForm';
import { getPublicOr } from '@/lib/api/server';
import { getTranslator } from '@/lib/preferences.server';

export async function generateMetadata() {
  const { t } = await getTranslator();
  return { title: t('auth.login'), robots: { index: false } };
}

export default async function LoginPage({ searchParams }) {
  const [{ next, error, reset }, settings] = await Promise.all([
    searchParams,
    getPublicOr({}, '/public/settings', { revalidate: 300 }),
  ]);
  return (
    <LoginForm
      next={next}
      googleEnabled={!!settings.auth?.google}
      redirectError={error}
      passwordReset={reset === '1'}
    />
  );
}

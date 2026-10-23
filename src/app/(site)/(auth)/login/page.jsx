import { LoginForm } from '@/components/auth/LoginForm';
import { getTranslator } from '@/lib/preferences.server';

export async function generateMetadata() {
  const { t } = await getTranslator();
  return { title: t('auth.login'), robots: { index: false } };
}

export default async function LoginPage({ searchParams }) {
  const { next } = await searchParams;
  return <LoginForm next={next} />;
}

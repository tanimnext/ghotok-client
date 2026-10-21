import { RegisterForm } from '@/components/auth/RegisterForm';
import { getPublicOr } from '@/lib/api/server';
import { getTranslator } from '@/lib/preferences.server';

export async function generateMetadata() {
  const { t } = await getTranslator();
  return { title: t('auth.register'), description: t('auth.registerSub') };
}

export default async function RegisterPage() {
  const settings = await getPublicOr({}, '/public/settings', { revalidate: 300 });
  return <RegisterForm googleEnabled={!!settings.auth?.google} />;
}

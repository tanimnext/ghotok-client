import { RegisterForm } from '@/components/auth/RegisterForm';
import { getTranslator } from '@/lib/preferences.server';

export async function generateMetadata() {
  const { t } = await getTranslator();
  return { title: t('auth.register'), description: t('auth.registerSub') };
}

export default function RegisterPage() {
  return <RegisterForm />;
}

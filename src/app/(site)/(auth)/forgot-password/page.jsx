import { ForgotPasswordForm } from '@/components/auth/PasswordResetForms';
import { getTranslator } from '@/lib/preferences.server';

export async function generateMetadata() {
  const { t } = await getTranslator();
  return { title: t('auth.forgotTitle'), robots: { index: false } };
}

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}

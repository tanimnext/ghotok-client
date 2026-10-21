import { redirect } from 'next/navigation';
import { ResetPasswordForm } from '@/components/auth/PasswordResetForms';
import { getTranslator } from '@/lib/preferences.server';

export async function generateMetadata() {
  const { t } = await getTranslator();
  return { title: t('auth.resetTitle'), robots: { index: false } };
}

export default async function ResetPasswordPage({ searchParams }) {
  const { identifier } = await searchParams;
  if (!identifier) redirect('/forgot-password');
  return <ResetPasswordForm identifier={identifier} />;
}

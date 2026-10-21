import { SupportPage } from '@/components/dashboard/SupportPages';

export default async function Page({ searchParams }) {
  const { new: startNew } = await searchParams;
  return <SupportPage startNew={startNew === '1'} />;
}

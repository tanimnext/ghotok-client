import { ConnectionsPage } from '@/components/dashboard/ConnectionsPage';

export default async function Page({ searchParams }) {
  const { payment } = await searchParams;
  return <ConnectionsPage paymentResult={payment} />;
}

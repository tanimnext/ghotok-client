import { notFound } from 'next/navigation';
import { TicketThread } from '@/components/dashboard/SupportPages';

export default async function Page({ params }) {
  const { id } = await params;
  if (!/^[a-f\d]{24}$/i.test(id)) notFound();
  return <TicketThread id={id} />;
}

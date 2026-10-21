import { ProposalsPage } from '@/components/dashboard/ProposalsPage';

export default async function Page({ searchParams }) {
  const { box } = await searchParams;
  return <ProposalsPage initialBox={box} />;
}

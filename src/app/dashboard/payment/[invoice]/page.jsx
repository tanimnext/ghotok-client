import { PaymentReceipt } from '@/components/billing/PaymentReceipt';

export default async function Page({ params, searchParams }) {
  const [{ invoice }, { result }] = await Promise.all([params, searchParams]);
  return <PaymentReceipt invoiceNo={invoice} result={result} />;
}

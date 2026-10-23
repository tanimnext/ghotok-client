'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { PAYMENT_METHOD_LABELS, PAYMENT_STATUS, optionLabel } from '@/shared';
import { Button, Card, EmptyState, FormMessage, Icon, LoadingBlock, Pill, STATUS_TONE } from '@/ui';
import { AUTH_KEY } from '@/hooks/use-auth';
import { billingApi } from '@/lib/api/endpoints';
import { dateTime, digits, taka } from '@/lib/format';
import { useT } from '@/providers/PreferencesProvider';
import { PageTitle } from '@/components/dashboard/DashboardShell';

// An online payment can take a moment to be confirmed (the gateway's notification
// may arrive after the customer is back), so keep checking for a little while.
const POLL_MS = 3000;
const POLL_FOR_MS = 2 * 60_000;

const RESULT_MESSAGE = {
  success: ['success', 'connections.paymentSuccess'],
  failed: ['danger', 'connections.paymentFailed'],
  cancelled: ['info', 'connections.paymentCancelled'],
};

/** The receipt of one of the member's payments, e.g. after returning from a gateway. */
export function PaymentReceipt({ invoiceNo, result }) {
  const { t, lang } = useT();
  const queryClient = useQueryClient();
  const [startedAt] = useState(() => Date.now());
  const query = useQuery({
    queryKey: ['payment', invoiceNo],
    queryFn: () => billingApi.paymentStatus(invoiceNo),
    refetchInterval: (q) => {
      const status = q.state.data?.payment?.status;
      const waiting = status === 'initiated' && Date.now() - startedAt < POLL_FOR_MS;
      return waiting ? POLL_MS : false;
    },
  });
  const payment = query.data?.payment;

  // The balance in the header changes once the payment is verified.
  useEffect(() => {
    if (payment?.status === 'verified') queryClient.invalidateQueries({ queryKey: AUTH_KEY });
  }, [payment?.status, queryClient]);

  if (query.isLoading) return <LoadingBlock label={t('common.loading')} />;
  if (!payment) {
    return (
      <>
        <PageTitle title={t('receipt.title')} />
        <EmptyState
          icon="card"
          title={t('receipt.notFound')}
          action={<Button href="/dashboard/connections">{t('packages.goBilling')}</Button>}
        />
      </>
    );
  }

  const [tone, key] = RESULT_MESSAGE[result] ?? [];
  const rows = [
    ['receipt.invoice', payment.invoiceNo],
    ['receipt.date', dateTime(payment.createdAt, lang)],
    ['receipt.package', t('common.connections', { n: digits(payment.connections, lang) })],
    ['receipt.method', optionLabel(PAYMENT_METHOD_LABELS, payment.method, lang)],
    ['receipt.trx', payment.trxId ?? '—'],
    ['receipt.amount', taka(payment.amount, lang)],
  ];
  if (payment.creditedAt) rows.push(['receipt.credited', dateTime(payment.creditedAt, lang)]);

  return (
    <>
      <PageTitle
        title={t('receipt.title')}
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => window.print()}>
              {t('receipt.print')}
            </Button>
            <Button href="/dashboard/connections">{t('packages.goBilling')}</Button>
          </div>
        }
      />
      {key && <FormMessage tone={tone}>{t(key)}</FormMessage>}
      {payment.status === 'initiated' && <FormMessage tone="info">{t('receipt.checking')}</FormMessage>}
      <Card className="print-area">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-line pb-5">
          <div className="flex flex-col gap-1">
            <span className="font-display text-2xl font-semibold">Ghotok · ঘটক</span>
            <span className="text-sm text-muted">{t('receipt.subtitle')}</span>
          </div>
          <Pill tone={STATUS_TONE[payment.status]}>
            {payment.status === 'verified' && <Icon name="check" size={14} strokeWidth={2.6} />}
            {optionLabel(PAYMENT_STATUS, payment.status, lang)}
          </Pill>
        </div>
        <dl className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
          {rows.map(([label, value]) => (
            <div key={label} className="flex flex-col gap-0.5">
              <dt className="text-xs font-bold uppercase tracking-[0.04em] text-muted">{t(label)}</dt>
              <dd className="text-[15px] font-semibold">{value}</dd>
            </div>
          ))}
        </dl>
        {payment.rejectReason && <FormMessage>{payment.rejectReason}</FormMessage>}
      </Card>
    </>
  );
}

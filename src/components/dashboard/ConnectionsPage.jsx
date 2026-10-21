'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useState } from 'react';
import { LEDGER_TYPES, PAYMENT_METHODS, PAYMENT_STATUS, REFUND_STATUS, optionLabel } from '@/shared';
import {
  Button,
  Card,
  EmptyState,
  FormMessage,
  LoadingBlock,
  Modal,
  Pagination,
  Pill,
  STATUS_TONE,
  TextArea,
} from '@/ui';
import { useErrorMessage } from '@/hooks/use-error-message';
import { accountApi, billingApi } from '@/lib/api/endpoints';
import { date, digits, number, taka } from '@/lib/format';
import { useT } from '@/providers/PreferencesProvider';
import { useToast } from '@/ui';
import { PageTitle } from './DashboardShell.jsx';

const th =
  'border-b-[1.5px] border-gold px-2.5 py-3 text-left text-xs font-bold uppercase tracking-[0.04em] text-muted';
const td = 'border-b border-line px-2.5 py-4 align-top';

function PaymentResultBanner({ result }) {
  const { t } = useT();
  if (!result) return null;
  const map = {
    success: ['success', 'connections.paymentSuccess'],
    failed: ['danger', 'connections.paymentFailed'],
    cancelled: ['info', 'connections.paymentCancelled'],
  };
  const [tone, key] = map[result] ?? [];
  return key ? <FormMessage tone={tone}>{t(key)}</FormMessage> : null;
}

function RefundDialog({ payment, onClose }) {
  const { t } = useT();
  const toast = useToast();
  const errorMessage = useErrorMessage();
  const queryClient = useQueryClient();
  const [reason, setReason] = useState('');
  const send = useMutation({
    mutationFn: () => billingApi.requestRefund({ paymentId: payment.id, reason }),
    onSuccess: () => {
      toast.success(t('connections.refundSent'));
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      onClose();
    },
  });
  return (
    <Modal
      open={!!payment}
      onClose={onClose}
      title={t('connections.refundTitle')}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button disabled={reason.trim().length < 10} loading={send.isPending} onClick={() => send.mutate()}>
            {t('common.submit')}
          </Button>
        </>
      }
    >
      <FormMessage>{send.error && errorMessage(send.error)}</FormMessage>
      <TextArea
        label={t('connections.refundReason')}
        value={reason}
        maxLength={1000}
        onChange={(e) => setReason(e.target.value)}
        hint={t('validation.message')}
      />
    </Modal>
  );
}

/** Balance, purchase history (with refund requests) and the connection ledger. */
export function ConnectionsPage({ paymentResult }) {
  const { t, lang } = useT();
  const [ledgerPage, setLedgerPage] = useState(1);
  const [refundFor, setRefundFor] = useState(null);
  const connections = useQuery({
    queryKey: ['connections', ledgerPage],
    queryFn: () => accountApi.connections(ledgerPage),
  });
  const payments = useQuery({ queryKey: ['payments'], queryFn: () => billingApi.myPayments(1) });

  if (connections.isLoading || !connections.data) return <LoadingBlock label={t('common.loading')} />;
  const c = connections.data;
  const totals = [
    [c.balance, 'connections.balance'],
    [c.purchased, 'connections.purchased'],
    [c.used, 'connections.used'],
  ];

  return (
    <>
      <PageTitle title={t('connections.title')} action={<Button href="/packages">{t('dash.buy')}</Button>} />
      <PaymentResultBanner result={paymentResult} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {totals.map(([value, key], i) => (
          <div
            key={key}
            className={`flex flex-col gap-1 rounded-[24px] p-6 ${i === 0 ? 'bg-panel text-on-panel' : 'border border-line bg-surface'}`}
          >
            <span className={`text-sm font-semibold ${i === 0 ? 'text-panel-muted' : 'text-muted'}`}>
              {t(key)}
            </span>
            <span className="font-display text-5xl font-medium">{number(value, lang)}</span>
          </div>
        ))}
      </div>

      <Card title={t('connections.history')}>
        {payments.data?.items?.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-[15px]">
              <thead>
                <tr>
                  {['date', 'package', 'method', 'trx', 'amount', 'status', ''].map((k) => (
                    <th key={k} className={th}>
                      {k && t(`connections.${k}`)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {payments.data.items.map((p) => (
                  <tr key={p.id}>
                    <td className={td}>{date(p.createdAt, lang)}</td>
                    <td className={td}>
                      <div className="flex flex-col gap-0.5">
                        {t('common.connections', { n: digits(p.connections, lang) })}
                        <Link
                          href={`/dashboard/payment/${encodeURIComponent(p.invoiceNo)}`}
                          className="text-xs font-semibold text-rose-text underline"
                        >
                          {p.invoiceNo}
                        </Link>
                      </div>
                    </td>
                    <td className={td}>{optionLabel(PAYMENT_METHODS, p.method, lang)}</td>
                    <td className={`${td} font-mono text-sm`}>{p.trxId ?? '—'}</td>
                    <td className={`${td} font-bold`}>{taka(p.amount, lang)}</td>
                    <td className={td}>
                      <div className="flex flex-col items-start gap-1.5">
                        <Pill tone={STATUS_TONE[p.status]}>
                          {optionLabel(PAYMENT_STATUS, p.status, lang)}
                        </Pill>
                        {p.rejectReason && <span className="text-xs text-muted">{p.rejectReason}</span>}
                        {p.refund && (
                          <span className="text-xs text-muted">
                            {t('connections.refund', {
                              status: optionLabel(REFUND_STATUS, p.refund.status, lang),
                            })}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className={`${td} text-right`}>
                      {['verified', 'rejected', 'pending'].includes(p.status) &&
                        p.refund?.status !== 'pending' && (
                          <Button size="sm" variant="ghost" onClick={() => setRefundFor(p)}>
                            {t('connections.requestRefund')}
                          </Button>
                        )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState icon="card">{t('connections.noPayments')}</EmptyState>
        )}
      </Card>

      <Card title={t('connections.usage')}>
        {c.ledger.items.length ? (
          <>
            <ul className="flex flex-col">
              {c.ledger.items.map((e) => (
                <li
                  key={e.id}
                  className="flex items-center justify-between gap-4 border-b border-line py-3.5"
                >
                  <span className="flex flex-col gap-0.5">
                    <b className="text-[15px]">{optionLabel(LEDGER_TYPES, e.type, lang)}</b>
                    <span className="text-[13px] text-muted">
                      {[date(e.createdAt, lang), e.biodataNo, e.invoiceNo].filter(Boolean).join(' · ')}
                    </span>
                  </span>
                  <span className="flex flex-col items-end">
                    <b className={e.delta > 0 ? 'text-sage' : 'text-rose-text'}>
                      {e.delta > 0 ? '+' : '−'}
                      {digits(Math.abs(e.delta), lang)}
                    </b>
                    <span className="text-xs text-muted">
                      {t('connections.balanceAfter')}: {digits(e.balanceAfter, lang)}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
            <Pagination
              page={c.ledger.page}
              pages={c.ledger.pages}
              onPage={setLedgerPage}
              labels={{ previous: t('common.previous'), next: t('common.next') }}
            />
          </>
        ) : (
          <EmptyState icon="spark">{t('connections.noLedger')}</EmptyState>
        )}
      </Card>

      <RefundDialog payment={refundFor} onClose={() => setRefundFor(null)} />
    </>
  );
}

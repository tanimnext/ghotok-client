import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { PAYMENT_METHODS, PAYMENT_STATUS, REFUND_RESOLUTIONS, REFUND_STATUS, optionLabel } from '@/shared';
import { date, digits, taka } from '@/shared/format';
import {
  Button,
  FormMessage,
  Modal,
  Pill,
  PromptDialog,
  SelectInput,
  STATUS_TONE,
  Tabs,
  TextArea,
  TextInput,
} from '@/ui';
import { DataCard } from '../components/DataCard.jsx';
import { PageHeader } from '../components/PageHeader.jsx';
import { UserCell } from '../components/UserCell.jsx';
import { useErrorMessage } from '../hooks/useErrorMessage.js';
import { usePageParam, useQueryParam } from '../hooks/useQueryParam.js';
import { adminApi } from '../lib/api.js';
import { useT } from '../providers/PreferencesProvider.jsx';

const TABS = ['pending', 'approved', 'rejected'];

function useRefreshRefunds() {
  const queryClient = useQueryClient();
  return () =>
    ['refunds', 'payments', 'overview', 'ledger'].forEach((k) =>
      queryClient.invalidateQueries({ queryKey: [k] }),
    );
}

/**
 * Approves a refund either as connection credit or as money returned (which
 * takes back the connections the payment bought, as far as they are unused).
 */
function ApproveRefund({ refund, onClose }) {
  const { t, lang } = useT();
  const errorMessage = useErrorMessage();
  const refresh = useRefreshRefunds();
  const payment = refund.payment;
  const [form, setForm] = useState({
    resolution: 'connection_credit',
    connections: payment?.connections ?? 0,
    amount: payment?.amount ?? 0,
    refundTrxId: '',
    note: '',
  });
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const moneyBack = form.resolution === 'money_back';
  const approve = useMutation({
    mutationFn: () =>
      adminApi.approveRefund(refund.id, {
        resolution: form.resolution,
        connections: Number(form.connections),
        ...(moneyBack
          ? { amount: Number(form.amount), refundTrxId: form.refundTrxId.trim() || undefined }
          : {}),
        note: form.note.trim() || undefined,
      }),
    onSuccess: () => {
      refresh();
      onClose();
    },
  });

  return (
    <Modal
      open
      onClose={onClose}
      title={t('refunds.approveTitle')}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button loading={approve.isPending} onClick={() => approve.mutate()}>
            {t('common.approve')}
          </Button>
        </>
      }
    >
      <p className="text-muted">
        {payment?.invoiceNo} · {taka(payment?.amount ?? 0, lang)} ·{' '}
        {t('refunds.balance', { n: digits(refund.user?.connectionBalance ?? 0, lang) })}
      </p>
      <FormMessage>{approve.error && errorMessage(approve.error)}</FormMessage>
      <SelectInput
        label={t('refunds.resolution')}
        value={form.resolution}
        onChange={set('resolution')}
        options={REFUND_RESOLUTIONS.map((r) => ({ value: r.value, label: r[lang] }))}
      />
      <TextInput
        label={moneyBack ? t('refunds.connectionsRevoke') : t('refunds.connectionsCredit')}
        type="number"
        min={0}
        max={1000}
        value={form.connections}
        onChange={set('connections')}
      />
      {moneyBack && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextInput
            label={t('refunds.amount')}
            type="number"
            min={0}
            value={form.amount}
            onChange={set('amount')}
          />
          <TextInput label={t('refunds.refundTrx')} value={form.refundTrxId} onChange={set('refundTrxId')} />
        </div>
      )}
      <TextArea label={t('common.notes')} rows={2} value={form.note} onChange={set('note')} />
    </Modal>
  );
}

export function RefundsPage() {
  const { t, lang } = useT();
  const errorMessage = useErrorMessage();
  const refresh = useRefreshRefunds();
  const [status, setStatus] = useQueryParam('status', 'pending');
  const [page, setPage] = usePageParam();
  const [approving, setApproving] = useState(null);
  const [rejecting, setRejecting] = useState(null);
  const query = useQuery({
    queryKey: ['refunds', status, page],
    queryFn: () => adminApi.refunds({ status, page }),
    placeholderData: keepPreviousData,
  });
  const reject = useMutation({
    mutationFn: (note) => adminApi.rejectRefund(rejecting.id, note),
    onSuccess: () => {
      setRejecting(null);
      refresh();
    },
  });

  return (
    <>
      <PageHeader title={t('refunds.title')} sub={t('refunds.sub')} />
      <Tabs
        value={status}
        onChange={setStatus}
        items={TABS.map((v) => ({ value: v, label: t(`refunds.tabs.${v}`) }))}
      />
      <DataCard query={query} page={page} onPage={setPage}>
        {(items) => (
          <div className="flex flex-col gap-4">
            {items.map((r) => (
              <article key={r.id} className="flex flex-col gap-4 rounded-3xl border border-line p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex flex-col gap-1">
                    <UserCell user={r.user} />
                    <span className="text-xs text-muted">
                      {t('refunds.balance', { n: digits(r.user?.connectionBalance ?? 0, lang) })} ·{' '}
                      {date(r.createdAt, lang)}
                    </span>
                  </div>
                  <Pill tone={STATUS_TONE[r.status]}>{optionLabel(REFUND_STATUS, r.status, lang)}</Pill>
                </div>
                {r.payment && (
                  <div className="flex flex-wrap gap-x-6 gap-y-1 rounded-2xl bg-surface2 px-4 py-3 text-sm">
                    <span className="font-mono">{r.payment.invoiceNo}</span>
                    <span>
                      {optionLabel(PAYMENT_METHODS, r.payment.method, lang)}{' '}
                      {r.payment.trxId && <span className="font-mono">· {r.payment.trxId}</span>}
                    </span>
                    <span>{t('common.connections', { n: digits(r.payment.connections, lang) })}</span>
                    <b>{taka(r.payment.amount, lang)}</b>
                    <span className="text-muted">{optionLabel(PAYMENT_STATUS, r.payment.status, lang)}</span>
                  </div>
                )}
                <p className="whitespace-pre-line text-[15px]">{r.reason}</p>
                {r.status === 'pending' ? (
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" onClick={() => setApproving(r)}>
                      {t('common.approve')}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setRejecting(r)}>
                      {t('common.reject')}
                    </Button>
                  </div>
                ) : (
                  <p className="text-sm text-muted">
                    {r.resolution && (
                      <b className="text-ink">{optionLabel(REFUND_RESOLUTIONS, r.resolution, lang)}</b>
                    )}
                    {r.resolution && ` · ${t('common.connections', { n: digits(r.connections ?? 0, lang) })}`}
                    {r.amount != null && ` · ${taka(r.amount, lang)}`}
                    {r.refundTrxId && ` · ${r.refundTrxId}`}
                    {r.decidedBy && ` · ${t('refunds.decidedBy', { name: r.decidedBy })}`}
                    {r.note && <span className="block">{r.note}</span>}
                  </p>
                )}
              </article>
            ))}
          </div>
        )}
      </DataCard>
      {approving && <ApproveRefund refund={approving} onClose={() => setApproving(null)} />}
      <PromptDialog
        open={!!rejecting}
        title={t('refunds.rejectTitle')}
        description={rejecting?.payment?.invoiceNo}
        label={t('refunds.rejectNote')}
        confirmLabel={t('common.reject')}
        cancelLabel={t('common.cancel')}
        variant="danger"
        loading={reject.isPending}
        error={reject.error && errorMessage(reject.error)}
        onConfirm={(note) => reject.mutate(note)}
        onClose={() => {
          setRejecting(null);
          reject.reset();
        }}
      />
    </>
  );
}

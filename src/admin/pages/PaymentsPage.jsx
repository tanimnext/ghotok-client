import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { PAYMENT_METHOD_LABELS, PAYMENT_STATUS, optionLabel } from '@/shared';
import { dateTime, digits, taka } from '@/shared/format';
import { Pill, STATUS_TONE, Tabs } from '@/ui';
import { DataCard } from '../components/DataCard.jsx';
import { PageHeader } from '../components/PageHeader.jsx';
import { UserCell } from '../components/UserCell.jsx';
import { usePageParam, useQueryParam } from '../hooks/useQueryParam.js';
import { adminApi } from '../lib/api.js';
import { useT } from '../providers/PreferencesProvider.jsx';

// Read-only: SSLCommerz decides whether a payment succeeded and the API credits it by itself.
const TABS = ['verified', 'failed', 'cancelled', 'refunded', 'all'];
const COLUMNS = ['invoice', 'user', 'method', 'trx', 'package', 'amount', 'status'];

export function PaymentsPage() {
  const { t, lang } = useT();
  const [status, setStatus] = useQueryParam('status', 'verified');
  const [q, setQ] = useQueryParam('q');
  const [page, setPage] = usePageParam();
  const query = useQuery({
    queryKey: ['payments', status, q, page],
    queryFn: () => adminApi.payments({ status: status === 'all' ? undefined : status, q, page }),
    placeholderData: keepPreviousData,
  });

  return (
    <>
      <PageHeader title={t('payments.title')} sub={t('payments.sub')} />
      <div className="flex flex-wrap items-center gap-3">
        <Tabs
          value={status}
          onChange={setStatus}
          items={TABS.map((v) => ({ value: v, label: t(`payments.tabs.${v}`) }))}
        />
        <input
          type="search"
          defaultValue={q}
          placeholder={t('payments.searchPh')}
          onKeyDown={(e) => e.key === 'Enter' && setQ(e.currentTarget.value.trim())}
          className="h-11 min-w-64 flex-1 rounded-full border border-line bg-surface px-5 text-sm"
        />
      </div>
      <DataCard query={query} page={page} onPage={setPage}>
        {(items) => (
          <div className="overflow-x-auto">
            <table className="table-admin min-w-[900px]">
              <thead>
                <tr>
                  {COLUMNS.map((c) => (
                    <th key={c}>{t(`payments.cols.${c}`)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((p) => (
                  <tr key={p.id}>
                    <td className="whitespace-nowrap">
                      <span className="font-mono text-[13px]">{p.invoiceNo}</span>
                      <div className="text-xs text-muted">{dateTime(p.createdAt, lang)}</div>
                    </td>
                    <td>
                      <UserCell user={p.user} />
                    </td>
                    <td>{optionLabel(PAYMENT_METHOD_LABELS, p.method, lang)}</td>
                    <td className="font-mono text-[13px]">{p.trxId ?? '—'}</td>
                    <td className="whitespace-nowrap">
                      {t('common.connections', { n: digits(p.connections, lang) })}
                    </td>
                    <td className="font-bold">{taka(p.amount, lang)}</td>
                    <td>
                      <Pill tone={STATUS_TONE[p.status]}>{optionLabel(PAYMENT_STATUS, p.status, lang)}</Pill>
                      {p.rejectReason && <div className="mt-1 text-xs text-muted">{p.rejectReason}</div>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </DataCard>
    </>
  );
}

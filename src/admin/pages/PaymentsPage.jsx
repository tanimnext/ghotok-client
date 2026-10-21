import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { PAYMENT_METHODS, PAYMENT_STATUS, optionLabel } from '@/shared';
import { dateTime, digits, taka } from '@/shared/format';
import { Pill, STATUS_TONE, Tabs } from '@/ui';
import { DataCard } from '../components/DataCard.jsx';
import { PageHeader } from '../components/PageHeader.jsx';
import { PaymentDecision } from '../components/PaymentDecision.jsx';
import { UserCell } from '../components/UserCell.jsx';
import { usePageParam, useQueryParam } from '../hooks/useQueryParam.js';
import { adminApi } from '../lib/api.js';
import { useT } from '../providers/PreferencesProvider.jsx';

const TABS = ['pending', 'verified', 'rejected', 'refunded', 'all'];
const COLUMNS = ['invoice', 'user', 'method', 'trx', 'package', 'amount', 'status', 'decision'];

export function PaymentsPage() {
  const { t, lang } = useT();
  const [status, setStatus] = useQueryParam('status', 'pending');
  const [method, setMethod] = useQueryParam('method');
  const [q, setQ] = useQueryParam('q');
  const [page, setPage] = usePageParam();
  const query = useQuery({
    queryKey: ['payments', status, method, q, page],
    queryFn: () => adminApi.payments({ status: status === 'all' ? undefined : status, method, q, page }),
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
        <select
          value={method}
          onChange={(e) => setMethod(e.target.value)}
          className="field-input min-h-11 w-auto py-2"
          aria-label={t('payments.cols.method')}
        >
          <option value="">
            {t('payments.cols.method')}: {t('common.all')}
          </option>
          {PAYMENT_METHODS.map((m) => (
            <option key={m.value} value={m.value}>
              {m[lang]}
            </option>
          ))}
        </select>
      </div>
      <DataCard query={query} page={page} onPage={setPage}>
        {(items) => (
          <div className="overflow-x-auto">
            <table className="table-admin min-w-[980px]">
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
                    <td>
                      {optionLabel(PAYMENT_METHODS, p.method, lang)}
                      <div className="text-xs text-muted">
                        {p.mode === 'gateway' ? (
                          t('payments.online')
                        ) : (
                          <span className="font-mono">{p.senderNumber}</span>
                        )}
                      </div>
                    </td>
                    <td className="font-mono text-[13px]">{p.trxId ?? '—'}</td>
                    <td className="whitespace-nowrap">
                      {t('common.connections', { n: digits(p.connections, lang) })}
                    </td>
                    <td className="font-bold">{taka(p.amount, lang)}</td>
                    <td>
                      <Pill tone={STATUS_TONE[p.status]}>{optionLabel(PAYMENT_STATUS, p.status, lang)}</Pill>
                    </td>
                    <td className="max-w-56">
                      {p.status === 'pending' ? (
                        <PaymentDecision payment={p} />
                      ) : (
                        <span className="flex flex-col gap-0.5 text-xs text-muted">
                          {p.reviewedBy && <span>{t('payments.reviewedBy', { name: p.reviewedBy })}</span>}
                          {p.rejectReason && <span>{p.rejectReason}</span>}
                        </span>
                      )}
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

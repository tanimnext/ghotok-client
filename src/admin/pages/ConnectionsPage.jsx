import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { LEDGER_TYPES, optionLabel } from '@/shared';
import { dateTime, digits } from '@/shared/format';
import { Card } from '@/ui';
import { AdjustConnectionsForm } from '../components/AdjustConnectionsForm.jsx';
import { DataCard } from '../components/DataCard.jsx';
import { PageHeader } from '../components/PageHeader.jsx';
import { UserCell } from '../components/UserCell.jsx';
import { usePageParam, useQueryParam } from '../hooks/useQueryParam.js';
import { adminApi } from '../lib/api.js';
import { useT } from '../providers/PreferencesProvider.jsx';

const COLUMNS = ['date', 'user', 'type', 'change', 'balance', 'details', 'by'];

export function ConnectionsPage() {
  const { t, lang } = useT();
  const [user, setUser] = useQueryParam('user');
  const [type, setType] = useQueryParam('type');
  const [page, setPage] = usePageParam();
  const query = useQuery({
    queryKey: ['ledger', user, type, page],
    queryFn: () => adminApi.ledger({ user, type, page }),
    placeholderData: keepPreviousData,
    retry: false,
  });

  return (
    <>
      <PageHeader title={t('connections.title')} sub={t('connections.sub')} />
      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <Card title={t('overview.adjTitle')}>
          <AdjustConnectionsForm initialUser={user} />
        </Card>
        <div className="flex min-w-0 flex-col gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="search"
              defaultValue={user}
              placeholder={t('connections.filterUser')}
              onKeyDown={(e) => e.key === 'Enter' && setUser(e.currentTarget.value.trim())}
              className="h-11 min-w-64 flex-1 rounded-full border border-line bg-surface px-5 text-sm"
            />
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="field-input min-h-11 w-auto py-2"
              aria-label={t('connections.cols.type')}
            >
              <option value="">
                {t('connections.cols.type')}: {t('common.all')}
              </option>
              {LEDGER_TYPES.map((l) => (
                <option key={l.value} value={l.value}>
                  {l[lang]}
                </option>
              ))}
            </select>
          </div>
          <DataCard title={t('connections.ledger')} query={query} page={page} onPage={setPage}>
            {(items) => (
              <div className="overflow-x-auto">
                <table className="table-admin min-w-[860px]">
                  <thead>
                    <tr>
                      {COLUMNS.map((c) => (
                        <th key={c}>{t(`connections.cols.${c}`)}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((e) => (
                      <tr key={e.id}>
                        <td className="whitespace-nowrap">{dateTime(e.createdAt, lang)}</td>
                        <td>
                          <UserCell user={e.user} />
                        </td>
                        <td>{optionLabel(LEDGER_TYPES, e.type, lang)}</td>
                        <td className={`font-bold ${e.delta < 0 ? 'text-danger' : 'text-sage'}`}>
                          {e.delta > 0 ? '+' : ''}
                          {digits(e.delta, lang)}
                        </td>
                        <td>{digits(e.balanceAfter, lang)}</td>
                        <td className="max-w-72 text-[13px]">
                          {[e.biodataNo, e.invoiceNo, e.reason].filter(Boolean).join(' · ') || '—'}
                        </td>
                        <td>{e.actor ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </DataCard>
          {query.error && <p className="text-sm font-semibold text-danger">{query.error.message}</p>}
        </div>
      </div>
    </>
  );
}

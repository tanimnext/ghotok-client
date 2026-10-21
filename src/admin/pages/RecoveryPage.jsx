import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Link } from 'react-router';
import { DELETE_REASONS, RESTORE_STATUS, optionLabel } from '@/shared';
import { date } from '@/shared/format';
import { Pill, STATUS_TONE, Tabs } from '@/ui';
import { DataCard } from '../components/DataCard.jsx';
import { PageHeader } from '../components/PageHeader.jsx';
import { RestoreDecision } from '../components/RestoreDecision.jsx';
import { UserCell } from '../components/UserCell.jsx';
import { usePageParam, useQueryParam } from '../hooks/useQueryParam.js';
import { adminApi } from '../lib/api.js';
import { useT } from '../providers/PreferencesProvider.jsx';

const TABS = ['pending', 'approved', 'declined'];

export function RecoveryPage() {
  const { t, lang } = useT();
  const [status, setStatus] = useQueryParam('status', 'pending');
  const [page, setPage] = usePageParam();
  const query = useQuery({
    queryKey: ['restore-requests', status, page],
    queryFn: () => adminApi.restoreRequests({ status, page }),
    placeholderData: keepPreviousData,
  });

  return (
    <>
      <PageHeader title={t('recovery.title')} sub={t('recovery.sub')} />
      <Tabs
        value={status}
        onChange={setStatus}
        items={TABS.map((v) => ({ value: v, label: t(`recovery.tabs.${v}`) }))}
      />
      <DataCard query={query} page={page} onPage={setPage}>
        {(items) => (
          <div className="overflow-x-auto">
            <table className="table-admin min-w-[900px]">
              <thead>
                <tr>
                  <th>{t('biodatas.cols.biodata')}</th>
                  <th>{t('biodatas.cols.owner')}</th>
                  <th>{t('recovery.deletedReason')}</th>
                  <th>{t('recovery.requestReason')}</th>
                  <th>{t('recovery.requested')}</th>
                  <th>{t('common.status')}</th>
                </tr>
              </thead>
              <tbody>
                {items.map((r) => (
                  <tr key={r.id}>
                    <td>
                      {r.biodata ? (
                        <Link
                          to={`/biodatas/${r.biodata.id}`}
                          className="font-bold text-rose-text hover:underline"
                        >
                          {r.biodata.biodataNo}
                        </Link>
                      ) : (
                        '—'
                      )}
                      {r.biodata?.deletedAt && (
                        <div className="text-xs text-muted">{date(r.biodata.deletedAt, lang)}</div>
                      )}
                    </td>
                    <td>
                      <UserCell user={r.user} />
                    </td>
                    <td className="max-w-64">
                      {r.biodata?.deleteReason
                        ? optionLabel(DELETE_REASONS, r.biodata.deleteReason, lang)
                        : '—'}
                      {r.biodata?.deleteNote && (
                        <div className="text-xs text-muted">{r.biodata.deleteNote}</div>
                      )}
                    </td>
                    <td className="max-w-72 whitespace-pre-line">{r.reason || '—'}</td>
                    <td className="whitespace-nowrap">{date(r.createdAt, lang)}</td>
                    <td>
                      {r.status === 'pending' ? (
                        <RestoreDecision requestId={r.id} />
                      ) : (
                        <span className="flex flex-col gap-1">
                          <Pill tone={STATUS_TONE[r.status]}>
                            {optionLabel(RESTORE_STATUS, r.status, lang)}
                          </Pill>
                          {r.permanent && <Pill tone="danger">{t('recovery.permanent')}</Pill>}
                          {r.note && <span className="text-xs text-muted">{r.note}</span>}
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

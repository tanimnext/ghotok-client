import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { dateTime } from '@/shared/format';
import { DataCard } from '../components/DataCard.jsx';
import { PageHeader } from '../components/PageHeader.jsx';
import { UserCell } from '../components/UserCell.jsx';
import { usePageParam, useQueryParam } from '../hooks/useQueryParam.js';
import { adminApi } from '../lib/api.js';
import { useT } from '../providers/PreferencesProvider.jsx';

const COLUMNS = ['time', 'actor', 'action', 'summary', 'target', 'ip'];

export function AuditLogPage() {
  const { t, lang } = useT();
  const [action, setAction] = useQueryParam('action');
  const [targetId, setTargetId] = useQueryParam('targetId');
  const [page, setPage] = usePageParam();
  const query = useQuery({
    queryKey: ['audit', action, targetId, page],
    queryFn: () => adminApi.auditLogs({ action, targetId, page }),
    placeholderData: keepPreviousData,
  });

  return (
    <>
      <PageHeader title={t('audit.title')} sub={t('audit.sub')} />
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="search"
          defaultValue={action}
          placeholder={t('audit.filter')}
          onKeyDown={(e) => e.key === 'Enter' && setAction(e.currentTarget.value.trim())}
          className="h-11 min-w-64 flex-1 rounded-full border border-line bg-surface px-5 text-sm"
        />
        {targetId && (
          <button
            type="button"
            onClick={() => setTargetId('')}
            className="h-11 rounded-full border border-line bg-surface px-5 text-sm font-semibold"
          >
            {t('audit.cols.target')}: <span className="font-mono">{targetId}</span> ✕
          </button>
        )}
      </div>
      <DataCard query={query} page={page} onPage={setPage}>
        {(items) => (
          <div className="overflow-x-auto">
            <table className="table-admin min-w-[960px]">
              <thead>
                <tr>
                  {COLUMNS.map((c) => (
                    <th key={c}>{t(`audit.cols.${c}`)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((a) => (
                  <tr key={a.id}>
                    <td className="whitespace-nowrap">{dateTime(a.createdAt, lang)}</td>
                    <td>
                      <UserCell user={a.actor} />
                    </td>
                    <td className="font-mono text-[13px]">{a.action}</td>
                    <td className="max-w-80">{a.summary ?? '—'}</td>
                    <td className="text-[13px]">
                      {a.targetId ? (
                        <button
                          type="button"
                          onClick={() => setTargetId(String(a.targetId))}
                          className="text-left hover:text-rose-text"
                          title={t('audit.sameTarget')}
                        >
                          {a.targetType} · <span className="font-mono">{String(a.targetId).slice(-8)}</span>
                        </button>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="font-mono text-[13px] text-muted">{a.ip ?? '—'}</td>
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

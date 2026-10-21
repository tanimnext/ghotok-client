import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Link } from 'react-router';
import { BIODATA_STATUS, BIODATA_TYPES, DISTRICTS, RELIGIONS, optionLabel } from '@/shared';
import { date, digits } from '@/shared/format';
import { Pill, STATUS_TONE, Tabs } from '@/ui';
import { DataCard } from '../components/DataCard.jsx';
import { PageHeader } from '../components/PageHeader.jsx';
import { UserCell } from '../components/UserCell.jsx';
import { usePageParam, useQueryParam } from '../hooks/useQueryParam.js';
import { adminApi } from '../lib/api.js';
import { useT } from '../providers/PreferencesProvider.jsx';

const TABS = ['pending', 'approved', 'rejected', 'draft', 'deleted', 'all'];

/** Tab → API filter. "deleted" is a separate flag, not a status. */
function filterFor(tab) {
  if (tab === 'deleted') return { deleted: 'true' };
  if (tab === 'all') return { deleted: 'all' };
  return { status: tab };
}

export function BiodatasPage() {
  const { t, lang } = useT();
  const [tab, setTab] = useQueryParam('status', 'pending');
  const [q, setQ] = useQueryParam('q');
  const [religion, setReligion] = useQueryParam('religion');
  const [page, setPage] = usePageParam();
  const query = useQuery({
    queryKey: ['biodatas', tab, q, religion, page],
    queryFn: () => adminApi.biodatas({ ...filterFor(tab), q, religion, page }),
    placeholderData: keepPreviousData,
  });

  return (
    <>
      <PageHeader title={t('biodatas.title')} sub={t('biodatas.sub')} />
      <div className="flex flex-wrap items-center gap-3">
        <Tabs
          value={tab}
          onChange={setTab}
          items={TABS.map((v) => ({
            value: v,
            label: v === 'all' ? t('common.all') : t(`biodatas.tabs.${v}`),
          }))}
        />
        <input
          type="search"
          defaultValue={q}
          placeholder={t('biodatas.searchPh')}
          onKeyDown={(e) => e.key === 'Enter' && setQ(e.currentTarget.value.trim())}
          className="h-11 min-w-64 flex-1 rounded-full border border-line bg-surface px-5 text-sm"
        />
        <select
          value={religion}
          onChange={(e) => setReligion(e.target.value)}
          className="field-input min-h-11 w-auto py-2"
          aria-label={t('biodatas.cols.religion')}
        >
          <option value="">
            {t('biodatas.cols.religion')}: {t('common.all')}
          </option>
          {RELIGIONS.map((r) => (
            <option key={r.value} value={r.value}>
              {r[lang]}
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
                  {[
                    'biodata',
                    'owner',
                    'type',
                    'religion',
                    'district',
                    'age',
                    'completion',
                    'status',
                    'submitted',
                  ].map((c) => (
                    <th key={c}>{t(`biodatas.cols.${c}`)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((b) => (
                  <tr key={b.id}>
                    <td>
                      <Link to={`/biodatas/${b.id}`} className="font-bold text-rose-text hover:underline">
                        {b.biodataNo}
                      </Link>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {b.isHidden && <Pill tone="muted">{t('biodatas.hidden')}</Pill>}
                        {b.blocked && <Pill tone="danger">{t('biodatas.blocked')}</Pill>}
                        {b.deletedAt && <Pill tone="danger">{t('biodatas.deleted')}</Pill>}
                      </div>
                    </td>
                    <td>
                      <UserCell user={b.user} />
                    </td>
                    <td>{optionLabel(BIODATA_TYPES, b.type, lang)}</td>
                    <td>{optionLabel(RELIGIONS, b.religion, lang)}</td>
                    <td>{optionLabel(DISTRICTS, b.district, lang)}</td>
                    <td>{b.age ? digits(b.age, lang) : '—'}</td>
                    <td>{digits(b.completion, lang)}%</td>
                    <td>
                      <Pill tone={STATUS_TONE[b.status]}>{optionLabel(BIODATA_STATUS, b.status, lang)}</Pill>
                    </td>
                    <td className="whitespace-nowrap">{date(b.submittedAt, lang) || '—'}</td>
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

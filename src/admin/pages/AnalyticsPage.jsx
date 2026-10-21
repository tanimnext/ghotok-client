import { keepPreviousData, useQuery } from '@tanstack/react-query';
import {
  BIODATA_STATUS,
  BIODATA_TYPES,
  DELETE_REASONS,
  DISTRICTS,
  PAYMENT_METHODS,
  RELIGIONS,
  ROLE_OPTIONS,
  optionLabel,
} from '@/shared';
import { date, digits, number, taka } from '@/shared/format';
import { Card, LoadingBlock, Tabs } from '@/ui';
import { BarList, DailyChart } from '../components/charts.jsx';
import { PageHeader } from '../components/PageHeader.jsx';
import { useQueryParam } from '../hooks/useQueryParam.js';
import { adminApi } from '../lib/api.js';
import { useT } from '../providers/PreferencesProvider.jsx';

const RANGES = ['7', '30', '90', '365'];
const TOTALS = ['revenue', 'refunded', 'sales', 'connectionsSold', 'connectionsUsed'];
const TABLE_COLUMNS = ['revenue', 'signups', 'submissions', 'approvals', 'visits', 'unlocks'];

/** Which option list names the keys of each breakdown. */
const BREAKDOWNS = [
  ['religion', RELIGIONS],
  ['type', BIODATA_TYPES],
  ['district', DISTRICTS],
  ['paymentMethod', PAYMENT_METHODS, 'method'],
  ['users', ROLE_OPTIONS],
  ['biodataStatus', BIODATA_STATUS, 'status'],
  ['deleteReasons', DELETE_REASONS],
];

export function AnalyticsPage() {
  const { t, lang } = useT();
  const [days, setDays] = useQueryParam('days', '30');
  const { data, isLoading } = useQuery({
    queryKey: ['analytics', days],
    queryFn: () => adminApi.analytics(days),
    placeholderData: keepPreviousData,
  });
  const label = (key) => t(`analytics.series.${key}`);

  return (
    <>
      <PageHeader title={t('analytics.title')} sub={t('analytics.sub')} />
      <Tabs
        value={days}
        onChange={setDays}
        label={t('analytics.range')}
        items={RANGES.map((n) => ({ value: n, label: t('analytics.days', { n: digits(n, lang) }) }))}
      />
      {isLoading || !data ? (
        <LoadingBlock label={t('common.loading')} />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
            {TOTALS.map((k) => (
              <div
                key={k}
                className="flex flex-col gap-1.5 rounded-[24px] border border-line bg-surface px-6 py-5"
              >
                <span className="text-[13px] font-semibold text-muted">{t(`analytics.totals.${k}`)}</span>
                <span className="font-display text-[32px] font-medium leading-tight text-rose-text">
                  {k === 'revenue' || k === 'refunded'
                    ? taka(data.totals[k], lang)
                    : number(data.totals[k], lang)}
                </span>
              </div>
            ))}
          </div>

          <Card title={t('analytics.charts.revenue')}>
            <DailyChart
              data={data.series}
              lang={lang}
              series={[{ key: 'revenue', label: label('revenue') }]}
              format={(n) => taka(n, lang)}
            />
          </Card>
          <Card title={t('analytics.charts.growth')}>
            <DailyChart
              data={data.series}
              lang={lang}
              series={['signups', 'submissions', 'approvals'].map((key) => ({ key, label: label(key) }))}
            />
          </Card>
          {/* Visits and unlocks differ by orders of magnitude, so each gets its own scale. */}
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <Card title={label('visits')}>
              <DailyChart
                data={data.series}
                lang={lang}
                height={220}
                series={[{ key: 'visits', label: label('visits') }]}
              />
            </Card>
            <Card title={label('unlocks')}>
              <DailyChart
                data={data.series}
                lang={lang}
                height={220}
                series={[{ key: 'unlocks', label: label('unlocks') }]}
              />
            </Card>
          </div>

          <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-2 xl:grid-cols-3">
            {BREAKDOWNS.map(([key, options, chartKey]) => (
              <Card key={key} title={t(`analytics.charts.${chartKey ?? key}`)}>
                <BarList
                  lang={lang}
                  empty={t('common.empty')}
                  items={data.breakdowns[key].map((b) => ({
                    key: b.key,
                    label: b.key === 'unknown' ? t('common.none') : optionLabel(options, b.key, lang),
                    count: b.count,
                    note: b.amount != null ? taka(b.amount, lang) : undefined,
                  }))}
                />
              </Card>
            ))}
          </div>

          <details className="rounded-[28px] border border-line bg-surface p-6">
            <summary className="cursor-pointer font-bold">{t('analytics.table')}</summary>
            <div className="mt-4 max-h-[480px] overflow-auto">
              <table className="table-admin min-w-[640px]">
                <thead>
                  <tr>
                    <th>{t('common.date')}</th>
                    {TABLE_COLUMNS.map((c) => (
                      <th key={c}>{label(c)}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...data.series].reverse().map((row) => (
                    <tr key={row.day}>
                      <td className="whitespace-nowrap">{date(row.day, lang)}</td>
                      {TABLE_COLUMNS.map((c) => (
                        <td key={c}>{c === 'revenue' ? taka(row[c], lang) : number(row[c], lang)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </>
      )}
    </>
  );
}

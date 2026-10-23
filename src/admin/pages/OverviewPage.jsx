import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router';
import { PAYMENT_METHOD_LABELS, REPORT_REASONS, REPORT_STATUS, optionLabel } from '@/shared';
import { date, dateTime, digits, taka } from '@/shared/format';
import { Button, Card, LoadingBlock, Pill, STATUS_TONE } from '@/ui';
import { AdjustConnectionsForm } from '../components/AdjustConnectionsForm.jsx';
import { PageHeader } from '../components/PageHeader.jsx';
import { RestoreDecision } from '../components/RestoreDecision.jsx';
import { UserCell } from '../components/UserCell.jsx';
import { useCan } from '../hooks/useAuth.js';
import { adminApi } from '../lib/api.js';
import { useT } from '../providers/PreferencesProvider.jsx';

const KPI_ORDER = [
  'pendingBiodatas',
  'openReports',
  'pendingRestores',
  'revenue30',
  'openTickets',
  'pendingRefunds',
  'newMessages',
];

function Kpi({ label, value }) {
  return (
    <div className="flex flex-col gap-1.5 rounded-[24px] border border-line bg-surface px-6 py-5">
      <span className="text-[13px] font-semibold text-muted">{label}</span>
      <span className="font-display text-[40px] font-medium leading-tight text-rose-text">{value}</span>
    </div>
  );
}

export function OverviewPage() {
  const { t, lang } = useT();
  const allowed = useCan();
  const { data, isLoading } = useQuery({ queryKey: ['overview'], queryFn: adminApi.overview });
  if (isLoading || !data) return <LoadingBlock label={t('common.loading')} />;

  return (
    <>
      <PageHeader kicker={t('overview.kicker')} title={t('overview.title')} sub={t('overview.sub')} />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
        {KPI_ORDER.filter((k) => data.kpis[k] !== undefined).map((k) => (
          <Kpi
            key={k}
            label={t(`overview.kpis.${k}`)}
            value={k === 'revenue30' ? taka(data.kpis[k], lang) : digits(data.kpis[k], lang)}
          />
        ))}
      </div>

      {data.payments && (
        <div className="flex flex-wrap items-start gap-6">
          <Card
            title={t('overview.payTitle')}
            className="min-w-0 flex-[2_1_620px]"
            action={
              <Link to="/payments" className="text-sm font-bold text-rose-text">
                {t('overview.openPay')}
              </Link>
            }
          >
            <div className="overflow-x-auto">
              <table className="table-admin min-w-[640px]">
                <thead>
                  <tr>
                    {['user', 'method', 'trx', 'package', 'amount', 'date'].map((c) => (
                      <th key={c}>{t(`payments.cols.${c}`)}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.payments.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <UserCell user={p.user} />
                      </td>
                      <td>{optionLabel(PAYMENT_METHOD_LABELS, p.method, lang)}</td>
                      <td className="font-mono">{p.trxId}</td>
                      <td>{t('common.connections', { n: digits(p.connections, lang) })}</td>
                      <td className="font-bold">{taka(p.amount, lang)}</td>
                      <td className="whitespace-nowrap text-muted">
                        {dateTime(p.creditedAt ?? p.createdAt, lang)}
                      </td>
                    </tr>
                  ))}
                  {data.payments.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-muted">
                        {t('common.empty')}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
          {allowed('connections.adjust') && (
            <Card title={t('overview.adjTitle')} className="flex-[1_1_320px]">
              <AdjustConnectionsForm />
            </Card>
          )}
        </div>
      )}

      <Card
        title={t('overview.reviewTitle')}
        action={
          <Link to="/biodatas" className="text-sm font-bold text-rose-text">
            {t('overview.openReview')}
          </Link>
        }
      >
        {data.biodatas.length === 0 ? (
          <p className="text-muted">{t('common.empty')}</p>
        ) : (
          data.biodatas.map((b) => (
            <div
              key={b.id}
              className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4"
            >
              <span className="flex flex-col gap-0.5">
                <b>{b.biodataNo}</b>
                <span className="text-[13px] text-muted">
                  {b.user?.name} · {date(b.submittedAt, lang)}
                </span>
              </span>
              <Button size="sm" variant="outline" href={`/biodatas/${b.id}`}>
                {t('common.review')}
              </Button>
            </div>
          ))
        )}
      </Card>

      <div className="flex flex-wrap items-start gap-6">
        <Card title={t('overview.repTitle')} className="flex-1 basis-[420px]">
          {data.reports.length === 0 ? (
            <p className="text-muted">{t('common.empty')}</p>
          ) : (
            data.reports.map((r) => (
              <div key={r.id} className="flex items-center justify-between gap-3 border-t border-line pt-4">
                <span className="flex flex-col gap-0.5">
                  <b>{r.biodataNo ?? r.targetName}</b>
                  <span className="text-[13px] text-muted">
                    {optionLabel(REPORT_REASONS, r.reason, lang)} · {date(r.createdAt, lang)}
                  </span>
                </span>
                <span className="flex items-center gap-2">
                  <Pill tone={STATUS_TONE[r.status]}>{optionLabel(REPORT_STATUS, r.status, lang)}</Pill>
                  <Button size="sm" variant="outline" href="/reports">
                    {t('common.review')}
                  </Button>
                </span>
              </div>
            ))
          )}
        </Card>
        <Card title={t('overview.recTitle')} className="flex-1 basis-[420px]">
          {data.restores.length === 0 ? (
            <p className="text-muted">{t('common.empty')}</p>
          ) : (
            data.restores.map((r) => (
              <div
                key={r.id}
                className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4"
              >
                <span className="flex flex-col gap-0.5">
                  <b>{r.biodataNo}</b>
                  <span className="text-[13px] text-muted">
                    {t('overview.deletedOn', {
                      deleted: date(r.deletedAt, lang),
                      requested: date(r.createdAt, lang),
                    })}
                  </span>
                </span>
                <RestoreDecision requestId={r.id} />
              </div>
            ))
          )}
        </Card>
      </div>
    </>
  );
}

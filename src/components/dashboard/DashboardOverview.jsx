'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useState } from 'react';
import { BIODATA_STATUS, BIODATA_TYPES, DISTRICTS, PROPOSAL_STATUS, optionLabel } from '@/shared';
import { ArchPortrait } from '@/components/biodata/ArchPortrait';
import { Button, Card, FormMessage, LoadingBlock, Pill, STATUS_TONE } from '@/ui';
import { accountApi, biodataApi } from '@/lib/api/endpoints';
import { date, digits, number } from '@/lib/format';
import { useT } from '@/providers/PreferencesProvider';
import { MY_BIODATA_KEY } from './biodata-editor/keys.js';
import { CopyBiodataNo } from './biodata-lifecycle/CopyBiodataNo.jsx';
import { DeleteDialog } from './biodata-lifecycle/DeleteDialog.jsx';
import { VisibilitySwitch } from './biodata-lifecycle/HideDialog.jsx';
import { RestorePanel } from './biodata-lifecycle/RestorePanel.jsx';
import { PageTitle } from './DashboardShell.jsx';

export const DASHBOARD_KEY = ['dashboard'];

function BiodataCardPanel({ biodata }) {
  const { t, lang } = useT();
  // The full owner view says whether a deleted biodata can come back without review.
  const own = useQuery({
    queryKey: MY_BIODATA_KEY,
    queryFn: biodataApi.mine,
    enabled: !!biodata?.deletedAt,
  });

  if (!biodata) {
    return (
      <Card title={t('dash.bioTitle')} className="flex-1 basis-[400px]">
        <p className="leading-relaxed text-muted">{t('dash.noBio')}</p>
        <Button href="/dashboard/biodata">{t('dash.startBio')}</Button>
      </Card>
    );
  }

  const meta = [
    optionLabel(BIODATA_TYPES, biodata.type, lang),
    optionLabel(DISTRICTS, biodata.district, lang),
  ]
    .filter(Boolean)
    .join(' · ');
  const live = biodata.status === 'approved';
  return (
    <Card
      title={t('dash.bioTitle')}
      className="flex-1 basis-[400px]"
      action={
        <Pill tone={STATUS_TONE[biodata.status]}>{optionLabel(BIODATA_STATUS, biodata.status, lang)}</Pill>
      }
    >
      {biodata.deletedAt ? (
        <div className="flex flex-col gap-3 rounded-[20px] bg-danger-bg p-5">
          <b className="text-danger">{t('dash.deletedTitle')}</b>
          {own.data?.biodata && <RestorePanel biodata={own.data.biodata} card={false} />}
        </div>
      ) : (
        <>
          {biodata.status === 'rejected' && (
            <FormMessage>
              {t('dash.rejectedTitle')}: {biodata.rejectionReason}
            </FormMessage>
          )}
          <div className="flex items-center gap-5">
            <ArchPortrait className="h-[88px] w-[72px] flex-none" />
            <div className="flex flex-col gap-1.5 text-[15px] text-muted">
              <CopyBiodataNo biodataNo={biodata.biodataNo} />
              {meta && <span>{meta}</span>}
              <span className="font-semibold text-ink">
                {t('dash.complete', { n: digits(biodata.completion, lang) })}
              </span>
              <div className="h-2 w-40 overflow-hidden rounded-full bg-surface2" aria-hidden="true">
                <div className="h-full rounded-full bg-gold" style={{ width: `${biodata.completion}%` }} />
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between gap-4 rounded-[20px] bg-bg px-5 py-4">
            <span className="flex flex-col gap-0.5">
              <b className="text-[15px]">{t('dash.visible')}</b>
              <span className="text-[13px] text-muted">
                {!live ? t('dash.visDraft') : biodata.isHidden ? t('dash.visOff') : t('dash.visOn')}
              </span>
            </span>
            <VisibilitySwitch biodata={biodata} label={t('dash.visible')} />
          </div>
          <div className="flex flex-wrap gap-3">
            <Button href="/dashboard/biodata" className="flex-1">
              {t('dash.edit')}
            </Button>
            {live && (
              <Button href={`/biodatas/${biodata.biodataNo}`} variant="outline">
                {t('dash.preview')}
              </Button>
            )}
          </div>
        </>
      )}
    </Card>
  );
}

function BalancePanel({ connections }) {
  const { t, lang } = useT();
  return (
    <section className="relative flex flex-1 basis-[320px] flex-col gap-3.5 overflow-hidden rounded-[28px] bg-panel p-7 text-on-panel">
      <svg
        width="170"
        height="110"
        viewBox="0 0 38 30"
        fill="none"
        aria-hidden="true"
        className="absolute -right-6 -top-2.5 opacity-40"
      >
        <circle cx="13" cy="15" r="10" stroke="var(--panel-gold)" strokeWidth="1" />
        <circle cx="25" cy="15" r="10" stroke="var(--panel-gold)" strokeWidth="1" />
      </svg>
      <h2 className="relative font-display text-2xl font-semibold">{t('dash.balTitle')}</h2>
      <div className="relative flex items-baseline gap-3">
        <span className="font-display text-[88px] font-medium leading-none">
          {number(connections.balance, lang)}
        </span>
        <span className="text-base text-panel-muted">{t('dash.balLeft')}</span>
      </div>
      <p className="relative text-sm text-panel-muted">
        {t('dash.used', { n: digits(connections.used, lang) })}
        {connections.lastPurchaseAt &&
          ` · ${t('dash.lastPurchase', { date: date(connections.lastPurchaseAt, lang, { day: 'numeric', month: 'short' }) })}`}
      </p>
      <Button href="/packages" variant="gold" size="lg" className="relative mt-auto">
        {t('dash.buy')}
      </Button>
    </section>
  );
}

export function DashboardOverview() {
  const { t, lang } = useT();
  const [deleting, setDeleting] = useState(false);
  const { data, isLoading } = useQuery({ queryKey: DASHBOARD_KEY, queryFn: accountApi.dashboard });
  if (isLoading || !data) return <LoadingBlock label={t('common.loading')} />;

  const stats = [
    [data.stats.visits.today, 'dash.stats.today'],
    [data.stats.visits.week, 'dash.stats.week'],
    [data.stats.visits.month, 'dash.stats.month'],
    [data.stats.favoritedBy, 'dash.stats.favorited'],
  ];
  const lists = [
    ['/dashboard/favorites', 'dash.nav.favorites', data.counts.favorites],
    ['/dashboard/dislikes', 'dash.nav.dislikes', data.counts.dislikes],
    ['/dashboard/favorited-me', 'dash.nav.favoritedMe', data.counts.favoritedMe],
    ['/dashboard/unlocks', 'dash.nav.unlocks', data.counts.unlocks],
  ];

  return (
    <>
      <PageTitle
        kicker={t('dash.kicker')}
        title={t('dash.welcome', { name: data.user.name.split(' ')[0] })}
        sub={t('dash.welcomeSub')}
      />

      <div className="flex flex-wrap gap-6">
        <BiodataCardPanel biodata={data.biodata} />
        <BalancePanel connections={data.connections} />
      </div>

      <Card title={t('dash.activity')}>
        <div className="grid grid-cols-2 gap-5 md:grid-cols-4">
          {stats.map(([value, key]) => (
            <div key={key} className="flex flex-col gap-1 border-t-[1.5px] border-gold pt-3.5">
              <span className="font-display text-[46px] font-medium leading-tight text-rose-text">
                {number(value, lang)}
              </span>
              <span className="text-[13px] font-semibold text-muted">{t(key)}</span>
            </div>
          ))}
        </div>
      </Card>

      <div className="flex flex-wrap gap-6">
        <Card
          title={t('dash.proposals')}
          className="flex-1 basis-[400px]"
          action={
            <Link href="/dashboard/proposals" className="text-sm font-bold text-rose-text">
              {t('common.viewAll')}
            </Link>
          }
        >
          {data.recentProposals.length === 0 ? (
            <p className="text-muted">{t('dash.noProposals')}</p>
          ) : (
            data.recentProposals.map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-3 border-t border-line pt-4">
                <span className="flex flex-col gap-0.5">
                  <b className="text-[15px]">
                    {p.biodataNo ? t('home.fcId', { no: p.biodataNo }) : t('proposals.noBiodata')}
                  </b>
                  <span className="text-[13px] text-muted">
                    {t(p.direction === 'sent' ? 'dash.sentOn' : 'dash.receivedOn', {
                      date: date(p.createdAt, lang, { day: 'numeric', month: 'short' }),
                    })}
                  </span>
                </span>
                <Pill tone={STATUS_TONE[p.status]}>{optionLabel(PROPOSAL_STATUS, p.status, lang)}</Pill>
              </div>
            ))
          )}
        </Card>
        <Card title={t('dash.lists')} className="flex-1 basis-[400px]">
          {lists.map(([href, key, count]) => (
            <Link
              key={href}
              href={href}
              className="flex items-center justify-between border-t border-line pt-4 text-[15px] font-semibold hover:text-rose-text"
            >
              <span>{t(key)}</span>
              <span className="text-gold-text">{number(count, lang)} →</span>
            </Link>
          ))}
        </Card>
      </div>

      <section className="flex flex-wrap items-center justify-between gap-5 rounded-[28px] border border-gold bg-surface2 p-7">
        <div className="flex flex-1 basis-[360px] flex-col gap-1.5">
          <h2 className="font-display text-2xl font-semibold">{t('dash.supTitle')}</h2>
          <p className="text-[15px] leading-relaxed text-muted">{t('dash.supDesc')}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button href="/dashboard/support?new=1" variant="outline" size="sm">
            {t('dash.newTicket')}
          </Button>
          {data.biodata && !data.biodata.deletedAt && (
            <Button variant="outlineRose" size="sm" onClick={() => setDeleting(true)}>
              {t('dash.delBio')}
            </Button>
          )}
        </div>
      </section>
      <DeleteDialog open={deleting} onClose={() => setDeleting(false)} />
    </>
  );
}

'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useState } from 'react';
import { PROPOSAL_STATUS, optionLabel } from '@/shared';
import { cardText } from '@/components/biodata/biodata-text';
import { Button, EmptyState, LoadingBlock, Pagination, Pill, STATUS_TONE } from '@/ui';
import { useErrorMessage } from '@/hooks/use-error-message';
import { accountApi } from '@/lib/api/endpoints';
import { date } from '@/lib/format';
import { useT } from '@/providers/PreferencesProvider';
import { useToast } from '@/ui';
import { PageTitle } from './DashboardShell.jsx';

function Tabs({ box, onChange }) {
  const { t } = useT();
  return (
    <div role="tablist" className="flex w-fit gap-1 rounded-full border border-line bg-surface p-1">
      {['received', 'sent'].map((b) => (
        <button
          key={b}
          role="tab"
          type="button"
          aria-selected={box === b}
          onClick={() => onChange(b)}
          className={`min-h-11 rounded-full px-6 text-sm font-bold ${box === b ? 'bg-rose text-on-rose' : 'text-muted'}`}
        >
          {t(`proposals.${b}`)}
        </button>
      ))}
    </div>
  );
}

/** Sent and received proposals, with accept / decline / withdraw. */
export function ProposalsPage({ initialBox = 'received' }) {
  const { t, lang } = useT();
  const toast = useToast();
  const errorMessage = useErrorMessage();
  const queryClient = useQueryClient();
  const [box, setBox] = useState(initialBox === 'sent' ? 'sent' : 'received');
  const [page, setPage] = useState(1);
  const { data, isLoading } = useQuery({
    queryKey: ['proposals', box, page],
    queryFn: () => accountApi.proposals(box, page),
  });

  const act = useMutation({
    mutationFn: ({ id, action }) =>
      action === 'withdraw' ? accountApi.withdrawProposal(id) : accountApi.respondToProposal(id, action),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proposals'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  return (
    <>
      <PageTitle title={t('proposals.title')} />
      <Tabs
        box={box}
        onChange={(b) => {
          setBox(b);
          setPage(1);
        }}
      />
      {isLoading || !data ? (
        <LoadingBlock label={t('common.loading')} />
      ) : data.items.length === 0 ? (
        <EmptyState icon="mail">
          {t(box === 'sent' ? 'proposals.emptySent' : 'proposals.emptyReceived')}
        </EmptyState>
      ) : (
        <ul className="flex flex-col gap-4">
          {data.items.map((p) => {
            const b = p.biodata;
            const text = b && !b.unavailable ? cardText(b, t, lang) : null;
            const busy = act.isPending && act.variables?.id === p.id;
            return (
              <li
                key={p.id}
                className="flex flex-col gap-4 rounded-[24px] border border-line bg-surface p-6 sm:flex-row sm:items-center"
              >
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="text-xs font-bold uppercase tracking-[0.1em] text-muted">
                    {t(box === 'sent' ? 'proposals.to' : 'proposals.from')} · {date(p.createdAt, lang)}
                  </span>
                  {b ? (
                    <Link
                      href={`/biodatas/${b.biodataNo}`}
                      className="font-display text-xl font-semibold hover:text-rose-text"
                    >
                      {b.biodataNo} {text ? `· ${text.title}` : ''}
                    </Link>
                  ) : (
                    <span className="font-display text-xl font-semibold">{t('proposals.noBiodata')}</span>
                  )}
                  {text && (
                    <span className="text-sm text-muted">
                      {[text.job, text.place].filter(Boolean).join(' · ')}
                    </span>
                  )}
                  {p.message && (
                    <p className="mt-2 rounded-2xl bg-bg p-3 text-[15px] leading-relaxed">“{p.message}”</p>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <Pill tone={STATUS_TONE[p.status]}>{optionLabel(PROPOSAL_STATUS, p.status, lang)}</Pill>
                  {p.status === 'pending' && box === 'received' && (
                    <>
                      <Button
                        size="sm"
                        loading={busy && act.variables.action === 'accept'}
                        onClick={() => act.mutate({ id: p.id, action: 'accept' })}
                      >
                        {t('proposals.accept')}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        loading={busy && act.variables.action === 'decline'}
                        onClick={() => act.mutate({ id: p.id, action: 'decline' })}
                      >
                        {t('proposals.decline')}
                      </Button>
                    </>
                  )}
                  {p.status === 'pending' && box === 'sent' && (
                    <Button
                      size="sm"
                      variant="ghost"
                      loading={busy}
                      onClick={() => act.mutate({ id: p.id, action: 'withdraw' })}
                    >
                      {t('proposals.withdraw')}
                    </Button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {data && (
        <Pagination
          page={data.page}
          pages={data.pages}
          onPage={setPage}
          labels={{ previous: t('common.previous'), next: t('common.next') }}
        />
      )}
    </>
  );
}

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Link } from 'react-router';
import { REPORT_REASONS, REPORT_STATUS, can, optionLabel } from '@/shared';
import { date, digits } from '@/shared/format';
import { Button, Checkbox, FormMessage, Modal, Pill, STATUS_TONE, Tabs, TextArea, useToast } from '@/ui';
import { DataCard } from '../components/DataCard.jsx';
import { PageHeader } from '../components/PageHeader.jsx';
import { UserCell } from '../components/UserCell.jsx';
import { useAuth } from '../hooks/useAuth.js';
import { useErrorMessage } from '../hooks/useErrorMessage.js';
import { usePageParam, useQueryParam } from '../hooks/useQueryParam.js';
import { adminApi } from '../lib/api.js';
import { useT } from '../providers/PreferencesProvider.jsx';

const TABS = ['active', 'resolved', 'dismissed', 'all'];

/**
 * Resolves or dismisses a report with a note for the reporter. When the reporter
 * had paid to unlock the contact, resolving can also give their connection back.
 */
function CloseReportDialog({ report, status, loading, error, onConfirm, onClose }) {
  const { t } = useT();
  const [text, setText] = useState('');
  const [refund, setRefund] = useState(false);
  const resolving = status === 'resolved';
  const canRefund = resolving && report.reporterUnlocked && !report.connectionRefunded;
  const label = t(`reports.${resolving ? 'resolve' : 'dismiss'}`);
  return (
    <Modal
      open
      onClose={onClose}
      title={label}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button
            disabled={resolving && text.trim().length < 3}
            loading={loading}
            onClick={() =>
              onConfirm({ actionTaken: text.trim() || undefined, refundConnection: canRefund && refund })
            }
          >
            {label}
          </Button>
        </>
      }
    >
      {report.biodata && <p className="text-muted">{report.biodata.biodataNo}</p>}
      <FormMessage>{error}</FormMessage>
      <TextArea
        label={t('reports.actionTaken')}
        rows={3}
        required={resolving}
        maxLength={500}
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      {canRefund && (
        <Checkbox
          label={t('reports.refundConnection')}
          checked={refund}
          onChange={(e) => setRefund(e.target.checked)}
        />
      )}
    </Modal>
  );
}

export function ReportsPage() {
  const { t, lang } = useT();
  const toast = useToast();
  const errorMessage = useErrorMessage();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const canOpenTickets = can(user.role, 'tickets.manage');
  const [status, setStatus] = useQueryParam('status', 'active');
  const [page, setPage] = usePageParam();
  // { report, status: 'resolved' | 'dismissed' } while the closing dialog is open.
  const [closing, setClosing] = useState(null);
  const query = useQuery({
    queryKey: ['reports', status, page],
    queryFn: () => adminApi.reports({ status: status === 'all' ? undefined : status, page }),
    placeholderData: keepPreviousData,
  });
  const update = useMutation({
    mutationFn: ({ id, ...body }) => adminApi.updateReport(id, body),
    onSuccess: () => {
      setClosing(null);
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      queryClient.invalidateQueries({ queryKey: ['overview'] });
    },
    onError: (err) => !closing && toast.error(errorMessage(err)),
  });

  return (
    <>
      <PageHeader title={t('reports.title')} sub={t('reports.sub')} />
      <Tabs
        value={status}
        onChange={setStatus}
        items={TABS.map((v) => ({ value: v, label: t(`reports.tabs.${v}`) }))}
      />
      <DataCard query={query} page={page} onPage={setPage}>
        {(items) => (
          <div className="flex flex-col gap-4">
            {items.map((r) => (
              <article key={r.id} className="flex flex-col gap-4 rounded-3xl border border-line p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex flex-col gap-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <b className="text-lg">{optionLabel(REPORT_REASONS, r.reason, lang)}</b>
                      <Pill tone={STATUS_TONE[r.status]}>{optionLabel(REPORT_STATUS, r.status, lang)}</Pill>
                      {r.timesReported > 1 && (
                        <Pill tone="danger">{t('reports.times', { n: digits(r.timesReported, lang) })}</Pill>
                      )}
                      {r.reporterUnlocked && (
                        <Pill tone={r.connectionRefunded ? 'sage' : 'muted'}>
                          {t(r.connectionRefunded ? 'reports.refunded' : 'reports.unlocked')}
                        </Pill>
                      )}
                    </span>
                    <span className="text-sm text-muted">{date(r.createdAt, lang)}</span>
                  </div>
                  <span className="flex flex-col items-end gap-1">
                    {r.biodata && (
                      <Link
                        to={`/biodatas/${r.biodata.id}`}
                        className="text-sm font-bold text-rose-text hover:underline"
                      >
                        {r.biodata.biodataNo} · {t('reports.openBiodata')}
                      </Link>
                    )}
                    {r.ticketId && canOpenTickets && (
                      <Link
                        to={`/tickets/${r.ticketId}`}
                        className="text-sm font-bold text-rose-text hover:underline"
                      >
                        {t('reports.openTicket')}
                      </Link>
                    )}
                  </span>
                </div>
                {r.details && (
                  <p className="whitespace-pre-line rounded-2xl bg-surface2 p-4 text-[15px]">{r.details}</p>
                )}
                <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
                  <div className="flex flex-col gap-1">
                    <span className="font-semibold text-muted">{t('reports.target')}</span>
                    <UserCell user={r.targetUser} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="font-semibold text-muted">{t('reports.reporter')}</span>
                    <UserCell user={r.reporter} />
                  </div>
                </div>
                {r.actionTaken && (
                  <p className="text-sm">
                    <b>{t('reports.actionLabel')}:</b> {r.actionTaken}
                    {r.handledBy && <span className="text-muted"> · {r.handledBy}</span>}
                  </p>
                )}
                {(r.status === 'open' || r.status === 'in_review') && (
                  <div className="flex flex-wrap gap-2">
                    {r.status === 'open' && (
                      <Button
                        size="sm"
                        variant="outline"
                        loading={update.isPending && update.variables?.id === r.id}
                        onClick={() => update.mutate({ id: r.id, status: 'in_review' })}
                      >
                        {t('reports.startReview')}
                      </Button>
                    )}
                    <Button size="sm" onClick={() => setClosing({ report: r, status: 'resolved' })}>
                      {t('reports.resolve')}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setClosing({ report: r, status: 'dismissed' })}
                    >
                      {t('reports.dismiss')}
                    </Button>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </DataCard>
      {closing && (
        <CloseReportDialog
          report={closing.report}
          status={closing.status}
          loading={update.isPending}
          error={update.error && errorMessage(update.error)}
          onConfirm={(body) => update.mutate({ id: closing.report.id, status: closing.status, ...body })}
          onClose={() => {
            setClosing(null);
            update.reset();
          }}
        />
      )}
    </>
  );
}

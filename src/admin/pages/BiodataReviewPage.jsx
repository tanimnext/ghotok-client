import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Link, useParams } from 'react-router';
import {
  BIODATA_SECTIONS,
  BIODATA_STATUS,
  DELETE_REASONS,
  REPORT_REASONS,
  REPORT_STATUS,
  optionLabel,
} from '@/shared';
import { date, digits } from '@/shared/format';
import {
  BiodataSections,
  Button,
  Card,
  FormMessage,
  LoadingBlock,
  Pill,
  PromptDialog,
  STATUS_TONE,
  useToast,
} from '@/ui';
import { EditSuspension } from '../components/EditSuspension.jsx';
import { PageHeader } from '../components/PageHeader.jsx';
import { RejectDialog } from '../components/RejectDialog.jsx';
import { SectionEditor } from '../components/SectionEditor.jsx';
import { UserCell } from '../components/UserCell.jsx';
import { useErrorMessage } from '../hooks/useErrorMessage.js';
import { adminApi } from '../lib/api.js';
import { useT } from '../providers/PreferencesProvider.jsx';

/** The decisions that need a typed reason, keyed by the dialog that asks for it. ("reject" has its own dialog.) */
const DIALOGS = {
  block: {
    title: 'biodatas.block',
    label: 'biodatas.blockReason',
    confirm: 'biodatas.block',
    run: (id, text) => adminApi.blockBiodata(id, true, text),
  },
  delete: {
    title: 'biodatas.deleteTitle',
    label: 'biodatas.deleteReason',
    confirm: 'common.delete',
    variant: 'danger',
    run: (id, text) => adminApi.deleteBiodata(id, text),
  },
};

function Stat({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-3 border-t border-line pt-3 text-sm">
      <span className="text-muted">{label}</span>
      <b>{value}</b>
    </div>
  );
}

export function BiodataReviewPage() {
  const { id } = useParams();
  const { t, lang } = useT();
  const toast = useToast();
  const errorMessage = useErrorMessage();
  const queryClient = useQueryClient();
  const [dialog, setDialog] = useState(null);
  const [editing, setEditing] = useState(null);
  const query = useQuery({ queryKey: ['biodata', id], queryFn: () => adminApi.biodata(id) });

  const refresh = () =>
    ['biodata', 'biodatas', 'overview'].forEach((k) => queryClient.invalidateQueries({ queryKey: [k] }));
  const onError = (err) => toast.error(errorMessage(err));
  const approve = useMutation({ mutationFn: () => adminApi.approveBiodata(id), onSuccess: refresh, onError });
  const unblock = useMutation({
    mutationFn: () => adminApi.blockBiodata(id, false),
    onSuccess: refresh,
    onError,
  });
  const restore = useMutation({ mutationFn: () => adminApi.restoreBiodata(id), onSuccess: refresh, onError });
  const decide = useMutation({
    mutationFn: ({ kind, text }) => DIALOGS[kind].run(id, text),
    onSuccess: () => {
      setDialog(null);
      refresh();
    },
  });

  if (query.isLoading) return <LoadingBlock label={t('common.loading')} />;
  if (query.error) return <FormMessage>{errorMessage(query.error)}</FormMessage>;
  const { biodata: b, completion, owner, activity, reports, restoreRequest } = query.data;
  const incomplete = completion.sections
    .filter((s) => !s.complete)
    .map((s) => BIODATA_SECTIONS.find((x) => x.key === s.key)?.title[lang]);
  const deleted = !!b.deletedAt;
  const active = dialog && DIALOGS[dialog];
  const fieldLabel = (c) => {
    const section = BIODATA_SECTIONS.find((s) => s.key === c.section);
    const field = section?.fields.find((f) => f.key === c.field);
    return `${section?.title[lang] ?? c.section} › ${field?.label[lang] ?? c.field}`;
  };

  return (
    <>
      <PageHeader
        kicker={
          <Link to="/biodatas" className="hover:underline">
            ← {t('nav.biodatas')}
          </Link>
        }
        title={b.biodataNo}
        actions={
          <span className="flex flex-wrap gap-2">
            <Pill tone={STATUS_TONE[b.status]}>{optionLabel(BIODATA_STATUS, b.status, lang)}</Pill>
            {b.isHidden && <Pill tone="muted">{t('biodatas.hidden')}</Pill>}
            {b.blocked && <Pill tone="danger">{t('biodatas.blocked')}</Pill>}
            {deleted && <Pill tone="danger">{t('biodatas.deleted')}</Pill>}
            {b.editSuspendedUntil && <Pill tone="warn">{t('biodatas.suspend.pill')}</Pill>}
          </span>
        }
      />

      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="flex min-w-0 flex-col gap-6">
          {b.status === 'rejected' && b.rejectionReason && (
            <FormMessage tone="info">{t('biodatas.rejection', { reason: b.rejectionReason })}</FormMessage>
          )}
          {b.corrections?.length > 0 && (
            <Card title={t('biodatas.corrections.title')}>
              <ul className="flex flex-col">
                {b.corrections.map((c) => (
                  <li
                    key={`${c.section}.${c.field}`}
                    className="flex flex-wrap items-start justify-between gap-3 border-t border-line py-3 text-sm"
                  >
                    <span className="flex min-w-0 flex-col gap-0.5">
                      <b>{fieldLabel(c)}</b>
                      {c.note && <span className="text-muted">{c.note}</span>}
                    </span>
                    <Pill tone={c.changed ? 'sage' : 'warn'}>
                      {t(c.changed ? 'biodatas.corrections.changed' : 'biodatas.corrections.unchanged')}
                    </Pill>
                  </li>
                ))}
              </ul>
            </Card>
          )}
          {deleted && (
            <FormMessage>
              {t('biodatas.deleteInfo', {
                date: date(b.deletedAt, lang),
                reason: b.deleteNote ?? optionLabel(DELETE_REASONS, b.deleteReason, lang),
              })}
            </FormMessage>
          )}
          {restoreRequest?.status === 'pending' && (
            <FormMessage tone="info">
              {t('biodatas.restoreRequest', { reason: restoreRequest.reason || '—' })}
            </FormMessage>
          )}
          <FormMessage tone={incomplete.length ? 'danger' : 'success'}>
            {digits(completion.percent, lang)}% ·{' '}
            {incomplete.length
              ? t('biodatas.incomplete', { list: incomplete.join(', ') })
              : t('biodatas.complete')}
          </FormMessage>
          <BiodataSections
            sections={b.sections}
            lang={lang}
            includePrivate
            privateLabel={t('biodatas.privateField')}
            renderAction={(section) => (
              <Button size="sm" variant="outline" onClick={() => setEditing(section)}>
                {t('common.edit')}
              </Button>
            )}
          />
        </div>

        <aside className="flex flex-col gap-6 xl:sticky xl:top-24">
          <Card title={t('common.actions')}>
            {deleted ? (
              <Button loading={restore.isPending} onClick={() => restore.mutate()}>
                {t('biodatas.restore')}
              </Button>
            ) : (
              <div className="flex flex-col gap-3">
                {b.status !== 'approved' && (
                  <Button
                    loading={approve.isPending}
                    disabled={!completion.complete}
                    onClick={() => approve.mutate()}
                  >
                    {t('biodatas.approve')}
                  </Button>
                )}
                {b.status !== 'draft' && b.status !== 'rejected' && (
                  <Button variant="outline" onClick={() => setDialog('reject')}>
                    {t('biodatas.reject')}
                  </Button>
                )}
                {b.blocked ? (
                  <Button variant="outline" loading={unblock.isPending} onClick={() => unblock.mutate()}>
                    {t('biodatas.unblock')}
                  </Button>
                ) : (
                  <Button variant="outline" onClick={() => setDialog('block')}>
                    {t('biodatas.block')}
                  </Button>
                )}
                <Button variant="ghost" className="text-danger" onClick={() => setDialog('delete')}>
                  {t('biodatas.delete')}
                </Button>
              </div>
            )}
          </Card>

          {!deleted && <EditSuspension biodataId={id} until={b.editSuspendedUntil} onSaved={refresh} />}

          <Card title={t('biodatas.owner')}>
            <UserCell user={owner} />
            <Stat label={t('biodatas.cols.submitted')} value={date(b.submittedAt, lang) || '—'} />
            <Stat label={t('biodatas.lastUpdated')} value={date(b.updatedAt, lang)} />
          </Card>

          <Card title={t('biodatas.activity')}>
            <Stat
              label={t('biodatas.visits')}
              value={[activity.visits.today, activity.visits.week, activity.visits.month]
                .map((n) => digits(n, lang))
                .join(' / ')}
            />
            <Stat label={t('biodatas.totalViews')} value={digits(b.stats?.views ?? 0, lang)} />
            <Stat label={t('biodatas.favoritedBy')} value={digits(activity.favoritedBy, lang)} />
            <Stat label={t('biodatas.unlocks')} value={digits(activity.unlocks, lang)} />
            <Stat label={t('biodatas.proposals')} value={digits(activity.proposals, lang)} />
          </Card>

          <Card
            title={t('biodatas.reports')}
            action={
              reports.length > 0 && (
                <Link to="/reports?status=all" className="text-sm font-bold text-rose-text">
                  {t('common.open')}
                </Link>
              )
            }
          >
            {reports.length === 0 ? (
              <p className="text-sm text-muted">{t('biodatas.noReports')}</p>
            ) : (
              reports.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between gap-3 border-t border-line pt-3 text-sm"
                >
                  <span className="flex flex-col">
                    <b>{optionLabel(REPORT_REASONS, r.reason, lang)}</b>
                    <span className="text-muted">{date(r.createdAt, lang)}</span>
                  </span>
                  <Pill tone={STATUS_TONE[r.status]}>{optionLabel(REPORT_STATUS, r.status, lang)}</Pill>
                </div>
              ))
            )}
          </Card>
        </aside>
      </div>

      {editing && (
        <SectionEditor
          key={editing.key}
          biodataId={id}
          section={editing}
          sections={b.sections}
          onClose={() => setEditing(null)}
        />
      )}
      {dialog === 'reject' && (
        <RejectDialog
          biodataId={id}
          biodataNo={b.biodataNo}
          onClose={() => setDialog(null)}
          onDone={() => {
            setDialog(null);
            refresh();
          }}
        />
      )}
      <PromptDialog
        open={!!active}
        title={active ? t(active.title) : ''}
        description={b.biodataNo}
        label={active ? t(active.label) : ''}
        minLength={active?.minLength}
        confirmLabel={active ? t(active.confirm) : ''}
        cancelLabel={t('common.cancel')}
        variant={active?.variant}
        loading={decide.isPending}
        error={decide.error && errorMessage(decide.error)}
        onConfirm={(text) => decide.mutate({ kind: dialog, text })}
        onClose={() => {
          setDialog(null);
          decide.reset();
        }}
      />
    </>
  );
}

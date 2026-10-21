'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { BIODATA_SECTIONS, BIODATA_STATUS, optionLabel } from '@/shared';
import { Button, FormMessage, Icon, LoadingBlock, Modal, Pill, STATUS_TONE } from '@/ui';
import { TutorialLink } from '@/components/content/TutorialLink';
import { useErrorMessage } from '@/hooks/use-error-message';
import { biodataApi } from '@/lib/api/endpoints';
import { date, digits } from '@/lib/format';
import { useT } from '@/providers/PreferencesProvider';
import { PageTitle } from '../DashboardShell.jsx';
import { CopyBiodataNo } from '../biodata-lifecycle/CopyBiodataNo.jsx';
import { PledgeScreen } from '../biodata-lifecycle/PledgeScreen.jsx';
import { RestorePanel } from '../biodata-lifecycle/RestorePanel.jsx';
import { MY_BIODATA_KEY } from './keys.js';
import { SectionForm } from './SectionForm.jsx';

const STEPS = BIODATA_SECTIONS.map((s) => ({ key: s.key, title: s.title, section: s }));

const fieldLabel = (sectionKey, fieldKey, lang) =>
  BIODATA_SECTIONS.find((s) => s.key === sectionKey)?.fields.find((f) => f.key === fieldKey)?.label[lang] ??
  fieldKey;

function StatusNote({ biodata }) {
  const { t } = useT();
  if (!biodata) return null;
  if (biodata.status === 'approved')
    return <FormMessage tone="success">{t('editor.approvedNote')}</FormMessage>;
  if (biodata.status === 'pending') return <FormMessage tone="info">{t('editor.pendingNote')}</FormMessage>;
  if (biodata.status === 'rejected') {
    return (
      <FormMessage>
        {t('editor.rejectedNote')} {biodata.rejectionReason}
      </FormMessage>
    );
  }
  return null;
}

/** The answers a reviewer asked to change, each linking to its step. */
function CorrectionsList({ corrections, onOpen }) {
  const { t, lang } = useT();
  const left = corrections.filter((c) => !c.changed).length;
  return (
    <div className="flex flex-col gap-3 rounded-[20px] border border-gold bg-surface2 p-5">
      <b className="text-[15px]">
        {left ? t('lifecycle.correctionsLeft', { n: digits(left, lang) }) : t('lifecycle.correctionsDone')}
      </b>
      <ul className="flex flex-col gap-2">
        {corrections.map((c) => (
          <li key={`${c.section}.${c.field}`} className="flex gap-2.5 text-sm">
            <Icon
              name={c.changed ? 'check' : 'flag'}
              size={16}
              className={`mt-0.5 flex-none ${c.changed ? 'text-sage' : 'text-gold-text'}`}
            />
            <span>
              <button
                type="button"
                onClick={() => onOpen(c.section)}
                className="font-bold underline-offset-4 hover:underline"
              >
                {BIODATA_SECTIONS.find((s) => s.key === c.section)?.title[lang]} →{' '}
                {fieldLabel(c.section, c.field, lang)}
              </button>
              {c.note && <span className="text-muted"> — {c.note}</span>}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** The multi-step biodata editor: one step per form section. */
export function BiodataEditor() {
  const { t, lang } = useT();
  const errorMessage = useErrorMessage();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const { data, isLoading } = useQuery({ queryKey: MY_BIODATA_KEY, queryFn: biodataApi.mine });

  const submit = useMutation({
    mutationFn: () => biodataApi.submit(),
    onSuccess: (result) => {
      queryClient.setQueryData(MY_BIODATA_KEY, result);
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setSubmitted(true);
    },
  });

  if (isLoading || !data) return <LoadingBlock label={t('common.loading')} />;
  const { biodata, completion } = data;

  if (!biodata || biodata.deletedAt) {
    return (
      <>
        <PageTitle title={t('editor.title')} sub={!biodata ? t('lifecycle.pledgeSub') : undefined} />
        {biodata ? <RestorePanel biodata={biodata} /> : <PledgeScreen />}
      </>
    );
  }

  const corrections = biodata.corrections ?? [];
  const pendingBySection = new Set(corrections.filter((c) => !c.changed).map((c) => c.section));
  const suspendedUntil = biodata.editSuspendedUntil;
  const doneByKey = Object.fromEntries(completion.sections.map((s) => [s.key, s.complete]));
  const canSubmit =
    !suspendedUntil &&
    completion.complete &&
    ['draft', 'rejected'].includes(biodata.status) &&
    !(biodata.status === 'rejected' && pendingBySection.size);
  const incomplete = completion.sections
    .filter((s) => !s.complete)
    .map((s) => BIODATA_SECTIONS.find((x) => x.key === s.key).title[lang]);
  const current = STEPS[step];
  const openSection = (key) => setStep(STEPS.findIndex((s) => s.key === key));

  return (
    <>
      <PageTitle
        title={t('editor.title')}
        sub={t('editor.sub')}
        action={
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <CopyBiodataNo biodataNo={biodata.biodataNo} />
            <Pill tone={STATUS_TONE[biodata.status]}>
              {optionLabel(BIODATA_STATUS, biodata.status, lang)}
            </Pill>
          </div>
        }
      />

      {suspendedUntil && (
        <FormMessage>
          {t('lifecycle.suspended', { date: date(suspendedUntil, lang, { day: 'numeric', month: 'long' }) })}
        </FormMessage>
      )}

      <section className="flex flex-col gap-4 rounded-[28px] border border-line bg-surface p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex min-w-60 flex-1 flex-col gap-2">
            <span className="text-sm font-semibold">
              {t('editor.progress', {
                done: digits(completion.done, lang),
                total: digits(completion.total, lang),
              })}
            </span>
            <div
              className="h-2.5 overflow-hidden rounded-full bg-surface2"
              role="progressbar"
              aria-valuenow={completion.percent}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className="h-full rounded-full bg-gold transition-all"
                style={{ width: `${completion.percent}%` }}
              />
            </div>
          </div>
          <Button disabled={!canSubmit} loading={submit.isPending} onClick={() => submit.mutate()}>
            {biodata.status === 'rejected' ? t('editor.resubmit') : t('editor.submit')}
          </Button>
        </div>
        <StatusNote biodata={biodata} />
        {biodata.status === 'rejected' && corrections.length > 0 && (
          <CorrectionsList corrections={corrections} onOpen={openSection} />
        )}
        {!completion.complete && incomplete.length < BIODATA_SECTIONS.length && (
          <p className="text-sm text-muted">{t('editor.incomplete', { list: incomplete.join(', ') })}</p>
        )}
        <FormMessage>{submit.error && errorMessage(submit.error)}</FormMessage>
        <TutorialLink topic="createBiodata" className="self-start" />
      </section>

      <div className="flex flex-col items-start gap-6 xl:flex-row">
        <nav
          aria-label={t('editor.title')}
          className="-mx-4 flex w-[calc(100%+32px)] gap-2 overflow-x-auto px-4 xl:mx-0 xl:w-60 xl:flex-none xl:flex-col xl:overflow-visible xl:px-0"
        >
          {STEPS.map((s, i) => {
            const done = doneByKey[s.key];
            const flagged = pendingBySection.has(s.key);
            return (
              <button
                key={s.key}
                type="button"
                onClick={() => setStep(i)}
                aria-current={i === step ? 'step' : undefined}
                className={`flex min-h-11 items-center gap-2.5 whitespace-nowrap rounded-full px-4 py-2 text-left text-sm font-semibold xl:whitespace-normal ${
                  i === step ? 'bg-rose text-on-rose' : 'border border-line bg-surface hover:border-gold'
                }`}
              >
                <span
                  className={`flex size-6 flex-none items-center justify-center rounded-full text-xs ${done ? 'bg-sage text-white' : i === step ? 'bg-white/25' : 'bg-surface2'}`}
                >
                  {done ? <Icon name="check" size={14} strokeWidth={3} /> : digits(i + 1, lang)}
                </span>
                {s.title[lang]}
                {flagged && (
                  <span
                    className="ml-auto size-2.5 flex-none rounded-full bg-gold"
                    title={t('lifecycle.correctionAsk')}
                  />
                )}
              </button>
            );
          })}
        </nav>
        <div className="w-full min-w-0 flex-1">
          <SectionForm
            key={`${current.key}-${biodata.updatedAt}`}
            section={current.section}
            sections={biodata.sections ?? {}}
            corrections={
              biodata.status === 'rejected' ? corrections.filter((c) => c.section === current.key) : []
            }
            locked={!!suspendedUntil}
            isLast={step === STEPS.length - 1}
            onSaved={() => setStep((s) => Math.min(s + 1, STEPS.length - 1))}
          />
        </div>
      </div>

      <Modal
        open={submitted}
        onClose={() => setSubmitted(false)}
        title={t('lifecycle.submittedTitle')}
        footer={
          <>
            <Button variant="ghost" onClick={() => setSubmitted(false)}>
              {t('lifecycle.keepEditing')}
            </Button>
            <Button href="/dashboard">{t('lifecycle.toDashboard')}</Button>
          </>
        }
      >
        <p className="leading-relaxed text-muted">{t('editor.submitted')}</p>
        <ul className="flex flex-col gap-2 text-sm">
          {['review', 'notify'].map((k) => (
            <li key={k} className="flex gap-2.5">
              <Icon name="check" size={16} strokeWidth={2.6} className="mt-0.5 flex-none text-sage" />
              {t(`lifecycle.after.${k}`)}
            </li>
          ))}
        </ul>
      </Modal>
    </>
  );
}

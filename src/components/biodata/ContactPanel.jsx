'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useState } from 'react';
import { GUARDIAN_RELATIONS, REPORT_STATUS, optionLabel } from '@/shared';
import { Button, FormMessage, Icon, Modal, TextArea } from '@/ui';
import { TutorialLink } from '@/components/content/TutorialLink';
import { AUTH_KEY, useAuth } from '@/hooks/use-auth';
import { useErrorMessage } from '@/hooks/use-error-message';
import { biodataApi } from '@/lib/api/endpoints';
import { digits } from '@/lib/format';
import { useT } from '@/providers/PreferencesProvider';
import { useToast } from '@/ui';
import { useViewerState } from './BiodataActions.jsx';

function ContactRow({ label, value, href }) {
  if (!value) return null;
  return (
    <div className="flex flex-col gap-0.5 border-t border-line pt-3">
      <span className="text-[13px] font-semibold text-muted">{label}</span>
      {href ? (
        <a
          href={href}
          className="text-lg font-extrabold tracking-[0.02em] text-rose-text underline-offset-4 hover:underline"
        >
          {value}
        </a>
      ) : (
        <span className="text-base font-bold">{value}</span>
      )}
    </div>
  );
}

/**
 * The guardian contact panel: locked by default, unlocked with one connection.
 * Also where members send a proposal.
 */
export function ContactPanel({ biodataNo }) {
  const { t, lang } = useT();
  const toast = useToast();
  const errorMessage = useErrorMessage();
  const queryClient = useQueryClient();
  const { user, isLoading } = useAuth();
  const { data: viewer } = useViewerState(biodataNo);
  const [dialog, setDialog] = useState(null); // 'unlock' | 'buy' | 'propose'
  const [message, setMessage] = useState('');

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['viewer', biodataNo] });
    queryClient.invalidateQueries({ queryKey: AUTH_KEY });
  };

  const unlock = useMutation({
    mutationFn: () => biodataApi.unlock(biodataNo),
    onSuccess: () => {
      setDialog(null);
      refresh();
    },
    onError: (err) => {
      if (err.code === 'INSUFFICIENT_CONNECTIONS') setDialog('buy');
      else toast.error(errorMessage(err));
    },
  });

  const propose = useMutation({
    mutationFn: () => biodataApi.propose(biodataNo, message || undefined),
    onSuccess: () => {
      setDialog(null);
      setMessage('');
      toast.success(t('detail.proposalSent'));
      refresh();
    },
  });

  const balance = viewer?.balance ?? user?.connectionBalance ?? 0;
  const contact = viewer?.contact;
  const proposal = viewer?.proposal;
  const report = viewer?.report;

  if (viewer?.isOwner) {
    return (
      <section className="flex flex-col gap-3 rounded-[28px] border-[1.5px] border-gold bg-surface2 p-7">
        <h2 className="font-display text-xl font-semibold">{t('detail.ownTitle')}</h2>
        <p className="text-sm leading-relaxed text-muted">{t('detail.ownText')}</p>
        <Button href="/dashboard/biodata">{t('detail.editOwn')}</Button>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-4 rounded-[28px] border-[1.5px] border-line bg-surface p-7">
      <div className="flex items-center gap-2.5">
        <Icon name={contact ? 'unlock' : 'lock'} size={22} strokeWidth={2.2} className="text-rose-text" />
        <h2 className="font-display text-xl font-semibold">
          {contact ? t('detail.unlockedTitle') : t('detail.guardian')}
        </h2>
      </div>

      {contact ? (
        <div className="flex flex-col gap-3">
          <ContactRow label={t('detail.candidateName')} value={contact.candidateName} />
          <ContactRow
            label={t('detail.guardianName')}
            value={[contact.guardianName, optionLabel(GUARDIAN_RELATIONS, contact.guardianRelation, lang)]
              .filter(Boolean)
              .join(' · ')}
          />
          <ContactRow
            label={t('detail.guardianPhone')}
            value={contact.guardianPhone}
            href={`tel:${contact.guardianPhone}`}
          />
          <ContactRow
            label={t('detail.altPhone')}
            value={contact.alternatePhone}
            href={contact.alternatePhone && `tel:${contact.alternatePhone}`}
          />
          <ContactRow
            label={t('detail.email')}
            value={contact.contactEmail}
            href={contact.contactEmail && `mailto:${contact.contactEmail}`}
          />
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-1 rounded-2xl border border-dashed border-line bg-bg p-4">
            <span className="text-[13px] font-semibold text-muted">{t('detail.guardianPhone')}</span>
            <span className="text-[22px] font-extrabold tracking-[0.04em]" aria-hidden="true">
              01•••-••••••
            </span>
          </div>
          <p className="text-sm leading-relaxed text-muted">{t('detail.unlockNote')}</p>
          <p className="rounded-2xl bg-surface2 px-4 py-3 text-[13px] leading-relaxed">
            <b>{t('detail.cautionTitle')}</b> {t('detail.cautionText')}
          </p>
          {!isLoading && !user ? (
            <Button href={`/login?next=/biodatas/${biodataNo}`} size="lg">
              {t('detail.loginToUnlock')}
            </Button>
          ) : (
            <Button
              size="lg"
              loading={unlock.isPending}
              onClick={() => setDialog(balance > 0 ? 'unlock' : 'buy')}
            >
              {t('detail.unlock')}
            </Button>
          )}
          <TutorialLink topic="viewContact" className="self-center" />
        </>
      )}

      {viewer?.refunded && <FormMessage tone="success">{t('detail.refunded')}</FormMessage>}
      {report && (
        <p className="rounded-2xl bg-surface2 px-4 py-3 text-sm">
          {t('detail.reportStatus', { status: optionLabel(REPORT_STATUS, report.status, lang) })}
          {report.ticketId && (
            <>
              {' '}
              <Link
                href={`/dashboard/support/${report.ticketId}`}
                className="font-bold text-rose-text underline"
              >
                {t('detail.reportOpenTicket')}
              </Link>
            </>
          )}
        </p>
      )}

      {user && !proposal && (
        <Button variant="outlineRose" onClick={() => setDialog('propose')}>
          {t('detail.proposeFirst')}
        </Button>
      )}
      {proposal && (
        <p className="rounded-2xl bg-sage-bg px-4 py-3 text-sm font-semibold text-sage">
          {proposal.status === 'accepted'
            ? t('detail.proposalAccepted')
            : proposal.direction === 'sent'
              ? t('detail.proposalSent')
              : t('detail.proposalReceived')}
        </p>
      )}

      {user && (
        <div className="flex items-center justify-between border-t border-line pt-4 text-sm">
          <span className="text-muted">
            {t('detail.balance', { n: t('common.connections', { n: digits(balance, lang) }) })}
          </span>
          <Link href="/packages" className="font-bold text-rose-text">
            {t('detail.buyMore')}
          </Link>
        </div>
      )}

      <Modal
        open={dialog === 'unlock'}
        onClose={() => setDialog(null)}
        title={t('detail.confirmUnlockTitle')}
        footer={
          <>
            <Button variant="ghost" onClick={() => setDialog(null)}>
              {t('common.cancel')}
            </Button>
            <Button loading={unlock.isPending} onClick={() => unlock.mutate()}>
              {t('detail.unlock')}
            </Button>
          </>
        }
      >
        <p className="text-muted">{t('detail.confirmUnlockText', { n: digits(balance, lang) })}</p>
        <p className="rounded-2xl bg-surface2 px-4 py-3 text-sm leading-relaxed">{t('detail.cautionText')}</p>
      </Modal>

      <Modal
        open={dialog === 'buy'}
        onClose={() => setDialog(null)}
        title={t('detail.noBalanceTitle')}
        footer={<Button href="/packages">{t('detail.seePackages')}</Button>}
      >
        <p className="text-muted">{t('detail.noBalanceText')}</p>
      </Modal>

      <Modal
        open={dialog === 'propose'}
        onClose={() => setDialog(null)}
        title={t('detail.proposalTitle')}
        footer={
          <>
            <Button variant="ghost" onClick={() => setDialog(null)}>
              {t('common.cancel')}
            </Button>
            <Button loading={propose.isPending} onClick={() => propose.mutate()}>
              {t('detail.send')}
            </Button>
          </>
        }
      >
        <p className="text-muted">{t('detail.proposalText')}</p>
        <FormMessage>{propose.error && errorMessage(propose.error)}</FormMessage>
        <TextArea
          label={t('detail.proposalMsg')}
          placeholder={t('detail.proposalPh')}
          value={message}
          maxLength={1000}
          onChange={(e) => setMessage(e.target.value)}
        />
      </Modal>
    </section>
  );
}

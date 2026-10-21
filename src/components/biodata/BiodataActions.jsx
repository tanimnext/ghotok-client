'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { REPORT_REASONS } from '@/shared';
import { Button, FormMessage, Icon, Modal, SelectInput, TextArea } from '@/ui';
import { AttachmentPicker, useAttachments } from '@/components/support/Attachments';
import { useAuth } from '@/hooks/use-auth';
import { useErrorMessage } from '@/hooks/use-error-message';
import { useRequireAuth } from '@/hooks/use-require-auth';
import { biodataApi } from '@/lib/api/endpoints';
import { useT } from '@/providers/PreferencesProvider';
import { useToast } from '@/ui';

/** The signed-in member's relationship to a biodata (favorite, unlocked, proposal…). */
export function useViewerState(biodataNo) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['viewer', biodataNo, user?.id],
    queryFn: () => biodataApi.viewer(biodataNo),
    enabled: !!user,
  });
}

/** Counts one profile view per visitor per day. */
export function useRecordVisit(biodataNo) {
  useEffect(() => {
    biodataApi.visit(biodataNo).catch(() => undefined);
  }, [biodataNo]);
}

/** Favorite, Not interested and Share buttons on the profile page. */
export function BiodataActions({ biodataNo }) {
  const { t } = useT();
  const toast = useToast();
  const errorMessage = useErrorMessage();
  const requireAuth = useRequireAuth();
  const queryClient = useQueryClient();
  const { data: viewer } = useViewerState(biodataNo);
  useRecordVisit(biodataNo);

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['viewer', biodataNo] });
  const toggle = useMutation({
    mutationFn: ({ list, on }) =>
      list === 'favorite'
        ? on
          ? biodataApi.favorite(biodataNo)
          : biodataApi.unfavorite(biodataNo)
        : on
          ? biodataApi.dislike(biodataNo)
          : biodataApi.undislike(biodataNo),
    onSuccess: refresh,
    onError: (err) => toast.error(errorMessage(err)),
  });

  const share = async () => {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: `Ghotok · ${biodataNo}`, url }).catch(() => undefined);
    } else {
      await navigator.clipboard.writeText(url);
      toast.success(t('detail.shareCopied'));
    }
  };

  if (viewer?.isOwner) return null;
  const fav = !!viewer?.isFavorite;
  const dis = !!viewer?.isDisliked;
  return (
    <div className="flex flex-wrap gap-2.5">
      <Button
        variant="outline"
        size="sm"
        aria-pressed={fav}
        onClick={requireAuth(() => toggle.mutate({ list: 'favorite', on: !fav }))}
      >
        <Icon name="heart" size={18} className={fav ? 'fill-current text-rose-text' : 'text-rose-text'} />
        {fav ? t('detail.favorited') : t('detail.favorite')}
      </Button>
      <Button
        variant="outline"
        size="sm"
        aria-pressed={dis}
        onClick={requireAuth(() => toggle.mutate({ list: 'dislike', on: !dis }))}
      >
        <Icon name="eyeOff" size={18} />
        {dis ? t('detail.hidden') : t('detail.notInterested')}
      </Button>
      <Button variant="ghost" size="sm" onClick={share}>
        <Icon name="share" size={18} />
        {t('detail.share')}
      </Button>
    </div>
  );
}

/**
 * "Report this biodata" link and dialog. Each report opens a support ticket where
 * the team follows up, so the member can add evidence (screenshots, recordings).
 */
export function ReportBiodata({ biodataNo }) {
  const { t, lang } = useT();
  const toast = useToast();
  const errorMessage = useErrorMessage();
  const requireAuth = useRequireAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ reason: 'fake_info', details: '' });
  const attachments = useAttachments();
  const report = useMutation({
    mutationFn: () =>
      biodataApi.report(biodataNo, {
        ...form,
        attachments: attachments.urls.length ? attachments.urls : undefined,
      }),
    onSuccess: () => {
      setOpen(false);
      attachments.reset();
      toast.success(t('detail.reportThanks'));
      queryClient.invalidateQueries({ queryKey: ['viewer', biodataNo] });
    },
  });
  const existingTicket = report.error?.code === 'ALREADY_REPORTED' && report.error.details?.ticketId;
  return (
    <>
      <button
        type="button"
        onClick={requireAuth(() => setOpen(true))}
        className="flex min-h-11 items-center gap-2 self-start text-sm font-bold text-muted underline hover:text-rose-text"
      >
        <Icon name="flag" size={16} /> {t('detail.report')}
      </button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={t('detail.reportTitle')}
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              disabled={attachments.uploading}
              loading={report.isPending}
              onClick={() => report.mutate()}
            >
              {t('detail.reportSend')}
            </Button>
          </>
        }
      >
        <FormMessage>
          {report.error && errorMessage(report.error)}
          {existingTicket && (
            <>
              {' '}
              <Link href={`/dashboard/support/${existingTicket}`} className="underline">
                {t('detail.reportOpenTicket')}
              </Link>
            </>
          )}
        </FormMessage>
        <SelectInput
          label={t('detail.reportReason')}
          value={form.reason}
          onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
          options={REPORT_REASONS.map((r) => ({ value: r.value, label: r[lang] }))}
        />
        <TextArea
          label={t('detail.reportDetails')}
          value={form.details}
          maxLength={2000}
          onChange={(e) => setForm((f) => ({ ...f, details: e.target.value }))}
        />
        <AttachmentPicker attachments={attachments} />
      </Modal>
    </>
  );
}

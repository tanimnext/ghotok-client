import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Link } from 'react-router';
import { DISTRICTS, optionLabel } from '@/shared';
import { date } from '@/shared/format';
import { Button, FormMessage, Pill, Tabs, TextArea, useToast } from '@/ui';
import { DataCard } from '../components/DataCard.jsx';
import { PageHeader } from '../components/PageHeader.jsx';
import { UserCell } from '../components/UserCell.jsx';
import { useErrorMessage } from '../hooks/useErrorMessage.js';
import { usePageParam, useQueryParam } from '../hooks/useQueryParam.js';
import { adminApi } from '../lib/api.js';
import { useT } from '../providers/PreferencesProvider.jsx';

const TABS = ['pending', 'published', 'hidden', 'all'];
const STORY_TONE = { pending: 'warn', published: 'sage', hidden: 'muted' };
const MAX_STORY = 2000;

const biodataLink = (no) => `/biodatas?q=${encodeURIComponent(no)}&status=all`;

/** One marriage report: the couple's details, the member's story and the text to publish. */
function StoryCard({ report: r }) {
  const { t, lang } = useT();
  const toast = useToast();
  const errorMessage = useErrorMessage();
  const queryClient = useQueryClient();
  const [text, setText] = useState(r.publishedStory ?? r.story ?? '');
  const edited = text.trim() !== (r.publishedStory ?? r.story ?? '').trim();
  const update = useMutation({
    mutationFn: (body) => adminApi.updateStory(r.id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marriage-reports'] });
      toast.success(t('common.saved'));
    },
  });
  const partner = r.partner ?? {};
  const facts = [
    [t('stories.marriedOn'), r.marriedOn ? date(r.marriedOn, lang) : '—'],
    [t('stories.place'), r.place || '—'],
    [t('stories.via'), t(r.viaGhotok ? 'common.yes' : 'common.no')],
    [
      t('stories.partner'),
      [partner.name, partner.district && optionLabel(DISTRICTS, partner.district, lang), partner.profession]
        .filter(Boolean)
        .join(' · ') || '—',
    ],
  ];

  return (
    <article className="flex flex-col gap-4 rounded-3xl border border-line p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <span className="flex flex-wrap items-center gap-2">
          <Pill tone={STORY_TONE[r.storyStatus]}>{t(`stories.status.${r.storyStatus}`)}</Pill>
          <Pill tone={r.shareStory ? 'sage' : 'muted'}>
            {t(r.shareStory ? 'stories.consent' : 'stories.noConsent')}
          </Pill>
          <span className="text-sm text-muted">{date(r.createdAt, lang)}</span>
        </span>
        <span className="flex flex-wrap gap-3 text-sm font-bold">
          {r.biodataNo && (
            <Link to={biodataLink(r.biodataNo)} className="text-rose-text hover:underline">
              {r.biodataNo}
            </Link>
          )}
          {r.partnerBiodataNo && (
            <Link to={biodataLink(r.partnerBiodataNo)} className="text-rose-text hover:underline">
              ♥ {r.partnerBiodataNo}
            </Link>
          )}
        </span>
      </div>
      <UserCell user={r.user} />
      <dl className="grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
        {facts.map(([label, value]) => (
          <div key={label} className="flex justify-between gap-3 border-t border-line pt-2">
            <dt className="text-muted">{label}</dt>
            <dd className="text-right font-semibold">{value}</dd>
          </div>
        ))}
      </dl>
      {r.story ? (
        <>
          {r.publishedStory && (
            <details className="text-sm">
              <summary className="cursor-pointer font-semibold text-muted">{t('stories.original')}</summary>
              <p className="mt-2 whitespace-pre-line rounded-2xl bg-surface2 p-4">{r.story}</p>
            </details>
          )}
          <TextArea
            label={t('stories.publishedText')}
            hint={t('stories.publishedHint')}
            rows={5}
            maxLength={MAX_STORY}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        </>
      ) : (
        <p className="text-sm text-muted">{t('stories.noStory')}</p>
      )}
      <FormMessage>{update.error && errorMessage(update.error)}</FormMessage>
      {r.story && (
        <div className="flex flex-wrap justify-end gap-2">
          {edited && (
            <Button
              size="sm"
              variant="outline"
              loading={update.isPending && !update.variables?.storyStatus}
              onClick={() => update.mutate({ publishedStory: text.trim() })}
            >
              {t('stories.saveText')}
            </Button>
          )}
          {r.storyStatus !== 'hidden' && (
            <Button
              size="sm"
              variant="ghost"
              loading={update.isPending && update.variables?.storyStatus === 'hidden'}
              onClick={() => update.mutate({ storyStatus: 'hidden' })}
            >
              {t('stories.hide')}
            </Button>
          )}
          {(r.storyStatus !== 'published' || edited) && (
            <Button
              size="sm"
              disabled={!r.shareStory || !text.trim()}
              loading={update.isPending && update.variables?.storyStatus === 'published'}
              onClick={() => update.mutate({ storyStatus: 'published', publishedStory: text.trim() })}
            >
              {t(r.storyStatus === 'published' ? 'stories.republish' : 'stories.publish')}
            </Button>
          )}
        </div>
      )}
    </article>
  );
}

export function StoriesPage() {
  const { t } = useT();
  const [status, setStatus] = useQueryParam('status', 'pending');
  const [page, setPage] = usePageParam();
  const query = useQuery({
    queryKey: ['marriage-reports', status, page],
    queryFn: () => adminApi.marriageReports({ status: status === 'all' ? undefined : status, page }),
    placeholderData: keepPreviousData,
  });

  return (
    <>
      <PageHeader title={t('stories.title')} sub={t('stories.sub')} />
      <Tabs
        value={status}
        onChange={setStatus}
        items={TABS.map((v) => ({ value: v, label: t(`stories.tabs.${v}`) }))}
      />
      <DataCard query={query} page={page} onPage={setPage}>
        {(items) => (
          <div className="flex flex-col gap-4">
            {items.map((r) => (
              <StoryCard key={r.id} report={r} />
            ))}
          </div>
        )}
      </DataCard>
    </>
  );
}

'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { GUARDIAN_RELATIONS, optionLabel } from '@/shared';
import { BiodataCard } from '@/components/biodata/BiodataCard';
import { Button, EmptyState, Icon, LoadingBlock, Pagination } from '@/ui';
import { accountApi, biodataApi } from '@/lib/api/endpoints';
import { date } from '@/lib/format';
import { useT } from '@/providers/PreferencesProvider';
import { PageTitle } from './DashboardShell.jsx';

/** How each personal list is fetched and what can be done with an entry. */
const LISTS = {
  favorites: {
    fetch: accountApi.favorites,
    title: 'lists.favoritesTitle',
    empty: 'lists.favoritesEmpty',
    icon: 'heart',
    remove: biodataApi.unfavorite,
    removeLabel: 'card.removeFav',
  },
  dislikes: {
    fetch: accountApi.dislikes,
    title: 'lists.dislikesTitle',
    empty: 'lists.dislikesEmpty',
    icon: 'eyeOff',
    remove: biodataApi.undislike,
    removeLabel: 'lists.undo',
  },
  favoritedMe: {
    fetch: accountApi.favoritedMe,
    title: 'lists.favoritedMeTitle',
    empty: 'lists.favoritedMeEmpty',
    icon: 'spark',
  },
  unlocks: {
    fetch: accountApi.unlocks,
    title: 'lists.unlocksTitle',
    empty: 'lists.unlocksEmpty',
    icon: 'unlock',
  },
};

function UnavailableEntry({ entry, t }) {
  return (
    <article className="flex flex-col justify-center gap-2 rounded-[28px] border border-dashed border-line p-6 text-muted">
      <b className="text-ink">{entry.biodataNo ?? t('lists.anonymous')}</b>
      <span className="text-sm">{entry.anonymous ? t('lists.anonymous') : t('card.unavailable')}</span>
    </article>
  );
}

function ContactLines({ contact, lang }) {
  return (
    <div className="flex flex-col gap-1 rounded-2xl bg-surface2 p-4 text-sm">
      <b>{contact.candidateName}</b>
      <span className="text-muted">
        {[contact.guardianName, optionLabel(GUARDIAN_RELATIONS, contact.guardianRelation, lang)]
          .filter(Boolean)
          .join(' · ')}
      </span>
      <a href={`tel:${contact.guardianPhone}`} className="flex items-center gap-2 font-bold text-rose-text">
        <Icon name="phone" size={16} /> {contact.guardianPhone}
      </a>
      {contact.contactEmail && (
        <a href={`mailto:${contact.contactEmail}`} className="text-muted underline">
          {contact.contactEmail}
        </a>
      )}
    </div>
  );
}

/** Favorites, dislikes, who favorited me, and unlocked contacts. */
export function PersonalList({ kind }) {
  const { t, lang } = useT();
  const config = LISTS[kind];
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const { data, isLoading } = useQuery({ queryKey: ['list', kind, page], queryFn: () => config.fetch(page) });
  const remove = useMutation({
    mutationFn: (no) => config.remove(no),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['list'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  return (
    <>
      <PageTitle title={t(config.title)} />
      {isLoading || !data ? (
        <LoadingBlock label={t('common.loading')} />
      ) : data.items.length === 0 ? (
        <EmptyState icon={config.icon}>{t(config.empty)}</EmptyState>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {data.items.map((entry, i) => {
            if (entry.anonymous || (entry.unavailable && kind !== 'unlocks')) {
              return <UnavailableEntry key={entry.biodataNo ?? i} entry={entry} t={t} />;
            }
            const when = entry.unlockedAt ?? entry.addedAt;
            return (
              <BiodataCard
                key={entry.biodataNo}
                biodata={entry}
                footer={
                  <div className="flex flex-col gap-3">
                    {entry.contact && <ContactLines contact={entry.contact} lang={lang} />}
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[13px] text-muted">
                        {t(kind === 'unlocks' ? 'lists.unlockedOn' : 'lists.addedOn', {
                          date: date(when, lang),
                        })}
                      </span>
                      {config.remove && (
                        <Button
                          variant="ghost"
                          size="sm"
                          loading={remove.isPending && remove.variables === entry.biodataNo}
                          onClick={() => remove.mutate(entry.biodataNo)}
                        >
                          {t(config.removeLabel)}
                        </Button>
                      )}
                    </div>
                  </div>
                }
              />
            );
          })}
        </div>
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

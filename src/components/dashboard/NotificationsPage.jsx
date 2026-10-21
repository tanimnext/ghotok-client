'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useState } from 'react';
import { Button, EmptyState, Icon, LoadingBlock, Pagination, useToast } from '@/ui';
import { useErrorMessage } from '@/hooks/use-error-message';
import { accountApi } from '@/lib/api/endpoints';
import { date, dateTime, digits } from '@/lib/format';
import { useT } from '@/providers/PreferencesProvider';
import { PageTitle } from './DashboardShell.jsx';

/** Notification text in the reader's language, built from its type and data. */
export function useNotificationText() {
  const { t, lang } = useT();
  return (n) => {
    const d = n.data ?? {};
    const vars = {
      ...d,
      connections: digits(d.connections ?? '', lang),
      balance: digits(d.balance ?? '', lang),
      delta: d.delta > 0 ? `+${digits(d.delta, lang)}` : digits(d.delta ?? '', lang),
      from: d.fromBiodataNo ? t('notifications.fromBiodata', { biodataNo: d.fromBiodataNo }) : '',
      reason: d.reason ?? '',
      note: d.note ?? '',
      n: digits(d.n ?? '', lang),
      until: d.until ? date(d.until, lang, { day: 'numeric', month: 'long' }) : '',
    };
    const key = `notifications.types.${n.type}`;
    const text = t(key, vars);
    return text === key ? n.type : text;
  };
}

const dayKey = (d) => new Date(d).toDateString();

/** Splits notifications (newest first) into days: "Today", "Yesterday", then dates. */
function useDayGroups(items) {
  const { t, lang } = useT();
  const today = new Date();
  const yesterday = new Date(today.getTime() - 864e5);
  const groups = [];
  for (const n of items) {
    const key = dayKey(n.createdAt);
    if (groups.at(-1)?.key !== key) {
      const label =
        key === dayKey(today)
          ? t('notifications.today')
          : key === dayKey(yesterday)
            ? t('notifications.yesterday')
            : date(n.createdAt, lang, { day: 'numeric', month: 'long', year: 'numeric' });
      groups.push({ key, label, items: [] });
    }
    groups.at(-1).items.push(n);
  }
  return groups;
}

export function NotificationsPage() {
  const { t, lang } = useT();
  const toast = useToast();
  const errorMessage = useErrorMessage();
  const queryClient = useQueryClient();
  const text = useNotificationText();
  const [page, setPage] = useState(1);
  const { data, isLoading } = useQuery({
    queryKey: ['notifications', page],
    queryFn: () => accountApi.notifications(page),
  });
  const readAll = useMutation({
    mutationFn: accountApi.markAllRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });
  const remove = useMutation({
    mutationFn: (id) => accountApi.deleteNotification(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
    onError: (err) => toast.error(errorMessage(err)),
  });
  const groups = useDayGroups(data?.items ?? []);

  return (
    <>
      <PageTitle
        title={t('notifications.title')}
        action={
          data?.unread > 0 && (
            <Button variant="outline" size="sm" loading={readAll.isPending} onClick={() => readAll.mutate()}>
              {t('notifications.markAll')}
            </Button>
          )
        }
      />
      {isLoading || !data ? (
        <LoadingBlock label={t('common.loading')} />
      ) : data.items.length === 0 ? (
        <EmptyState icon="bell">{t('notifications.empty')}</EmptyState>
      ) : (
        groups.map((group) => (
          <section key={group.key} className="flex flex-col gap-2.5">
            <h2 className="text-sm font-bold text-muted">{group.label}</h2>
            <ul className="flex flex-col overflow-hidden rounded-[24px] border border-line bg-surface">
              {group.items.map((n) => {
                const body = (
                  <>
                    <span
                      className={`mt-1.5 size-2.5 flex-none rounded-full ${n.readAt ? 'bg-transparent' : 'bg-rose'}`}
                      aria-hidden="true"
                    />
                    <span className="flex flex-col gap-1">
                      <span className={`text-[15px] ${n.readAt ? '' : 'font-bold'}`}>{text(n)}</span>
                      <span className="text-[13px] text-muted">{dateTime(n.createdAt, lang)}</span>
                    </span>
                  </>
                );
                return (
                  <li key={n._id} className="flex items-center border-b border-line last:border-0">
                    {n.link ? (
                      <Link href={n.link} className="flex flex-1 gap-4 py-4 pl-6 hover:bg-surface2">
                        {body}
                      </Link>
                    ) : (
                      <div className="flex flex-1 gap-4 py-4 pl-6">{body}</div>
                    )}
                    <button
                      type="button"
                      onClick={() => remove.mutate(n._id)}
                      disabled={remove.isPending && remove.variables === n._id}
                      aria-label={t('notifications.delete')}
                      className="mx-3 flex size-11 flex-none items-center justify-center rounded-full text-muted hover:bg-surface2 hover:text-danger disabled:opacity-50"
                    >
                      <Icon name="trash" size={18} />
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        ))
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

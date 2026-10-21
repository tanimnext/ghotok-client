import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router';
import { TICKET_CATEGORIES, TICKET_PRIORITY, TICKET_STATUS, optionLabel } from '@/shared';
import { dateTime, digits } from '@/shared/format';
import { Button, Pill, STATUS_TONE, Tabs, useToast } from '@/ui';
import { DataCard } from '../components/DataCard.jsx';
import { PageHeader } from '../components/PageHeader.jsx';
import { UserCell } from '../components/UserCell.jsx';
import { useErrorMessage } from '../hooks/useErrorMessage.js';
import { usePageParam, useQueryParam } from '../hooks/useQueryParam.js';
import { adminApi } from '../lib/api.js';
import { useT } from '../providers/PreferencesProvider.jsx';

const TICKET_TABS = ['active', 'waiting', 'answered', 'closed', 'all'];
const MESSAGE_TABS = ['new', 'read', 'replied', 'archived', 'all'];

/** Support tickets from members, plus messages sent through the public contact form. */
export function TicketsPage() {
  const { t } = useT();
  const [view, setView] = useQueryParam('view', 'tickets');
  return (
    <>
      <PageHeader title={t('tickets.title')} sub={t('tickets.sub')} />
      <Tabs
        value={view}
        onChange={setView}
        items={[
          { value: 'tickets', label: t('nav.tickets') },
          { value: 'messages', label: t('tickets.messagesTab') },
        ]}
      />
      {view === 'messages' ? <ContactMessages /> : <TicketList />}
    </>
  );
}

function TicketList() {
  const { t, lang } = useT();
  const [status, setStatus] = useQueryParam('status', 'active');
  const [category, setCategory] = useQueryParam('category');
  const [q, setQ] = useQueryParam('q');
  const [page, setPage] = usePageParam();
  const query = useQuery({
    queryKey: ['tickets', status, category, q, page],
    queryFn: () => adminApi.tickets({ status: status === 'all' ? undefined : status, category, q, page }),
    placeholderData: keepPreviousData,
  });

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <Tabs
          value={status}
          onChange={setStatus}
          items={TICKET_TABS.map((v) => ({ value: v, label: t(`tickets.tabs.${v}`) }))}
        />
        <input
          type="search"
          defaultValue={q}
          placeholder={t('tickets.searchPh')}
          onKeyDown={(e) => e.key === 'Enter' && setQ(e.currentTarget.value.trim())}
          className="h-11 min-w-64 flex-1 rounded-full border border-line bg-surface px-5 text-sm"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="field-input min-h-11 w-auto py-2"
          aria-label={t('tickets.category')}
        >
          <option value="">
            {t('tickets.category')}: {t('common.all')}
          </option>
          {TICKET_CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c[lang]}
            </option>
          ))}
        </select>
      </div>
      <DataCard query={query} page={page} onPage={setPage}>
        {(items) => (
          <div className="overflow-x-auto">
            <table className="table-admin min-w-[900px]">
              <thead>
                <tr>
                  <th>{t('tickets.subject')}</th>
                  <th>{t('tickets.from')}</th>
                  <th>{t('tickets.category')}</th>
                  <th>{t('tickets.priority')}</th>
                  <th>{t('common.status')}</th>
                  <th>{t('tickets.assigned')}</th>
                  <th>{t('tickets.lastActivity')}</th>
                </tr>
              </thead>
              <tbody>
                {items.map((tk) => (
                  <tr key={tk.id}>
                    <td className="max-w-80">
                      <Link to={`/tickets/${tk.id}`} className="font-bold hover:text-rose-text">
                        {tk.subject}
                      </Link>
                      <div className="text-xs text-muted">
                        {tk.ticketNo} · {t('tickets.messageCount', { n: digits(tk.messageCount, lang) })}
                      </div>
                    </td>
                    <td>
                      <UserCell user={tk.user} />
                    </td>
                    <td>{optionLabel(TICKET_CATEGORIES, tk.category, lang)}</td>
                    <td>
                      <Pill tone={tk.priority === 'high' ? 'danger' : 'muted'}>
                        {optionLabel(TICKET_PRIORITY, tk.priority, lang)}
                      </Pill>
                    </td>
                    <td>
                      <Pill tone={STATUS_TONE[tk.status]}>{optionLabel(TICKET_STATUS, tk.status, lang)}</Pill>
                    </td>
                    <td>{tk.assignedTo ?? '—'}</td>
                    <td className="whitespace-nowrap">{dateTime(tk.lastMessageAt, lang)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </DataCard>
    </>
  );
}

function ContactMessages() {
  const { t, lang } = useT();
  const toast = useToast();
  const errorMessage = useErrorMessage();
  const queryClient = useQueryClient();
  const [status, setStatus] = useQueryParam('status', 'new');
  const [page, setPage] = usePageParam();
  const query = useQuery({
    queryKey: ['contact-messages', status, page],
    queryFn: () => adminApi.contactMessages({ status: status === 'all' ? undefined : status, page }),
    placeholderData: keepPreviousData,
  });
  const mark = useMutation({
    mutationFn: ({ id, next }) => adminApi.updateContactMessage(id, next),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-messages'] });
      queryClient.invalidateQueries({ queryKey: ['overview'] });
    },
    onError: (err) => toast.error(errorMessage(err)),
  });
  const actions = [
    ['read', 'tickets.markRead'],
    ['replied', 'tickets.markReplied'],
    ['archived', 'tickets.archive'],
  ];

  return (
    <>
      <Tabs
        value={status}
        onChange={setStatus}
        items={MESSAGE_TABS.map((v) => ({
          value: v,
          label: v === 'all' ? t('common.all') : t(`tickets.msgStatus.${v}`),
        }))}
      />
      <DataCard query={query} page={page} onPage={setPage}>
        {(items) => (
          <div className="flex flex-col gap-4">
            {items.map((m) => (
              <article key={m.id} className="flex flex-col gap-3 rounded-3xl border border-line p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex flex-col gap-0.5">
                    <b className="text-lg">{m.subject || m.name}</b>
                    <span className="text-sm text-muted">
                      {[m.name, m.email, m.phone].filter(Boolean).join(' · ')} · {dateTime(m.createdAt, lang)}
                    </span>
                  </div>
                  <Pill tone={m.status === 'new' ? 'warn' : 'muted'}>
                    {t(`tickets.msgStatus.${m.status}`)}
                  </Pill>
                </div>
                <p className="whitespace-pre-line text-[15px]">{m.message}</p>
                <div className="flex flex-wrap gap-2">
                  {m.email && (
                    <Button
                      size="sm"
                      variant="outline"
                      href={`mailto:${m.email}?subject=${encodeURIComponent(`Re: ${m.subject ?? 'Ghotok'}`)}`}
                    >
                      {t('tickets.reply')}
                    </Button>
                  )}
                  {m.phone && (
                    <Button size="sm" variant="outline" href={`tel:${m.phone}`}>
                      {t('tickets.call')}
                    </Button>
                  )}
                  {actions
                    .filter(([next]) => next !== m.status)
                    .map(([next, label]) => (
                      <Button
                        key={next}
                        size="sm"
                        variant="ghost"
                        onClick={() => mark.mutate({ id: m.id, next })}
                      >
                        {t(label)}
                      </Button>
                    ))}
                </div>
              </article>
            ))}
          </div>
        )}
      </DataCard>
    </>
  );
}

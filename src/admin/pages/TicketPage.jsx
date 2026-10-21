import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Link, useParams } from 'react-router';
import { TICKET_CATEGORIES, TICKET_PRIORITY, TICKET_STATUS, optionLabel } from '@/shared';
import { dateTime } from '@/shared/format';
import {
  Button,
  Card,
  FormMessage,
  LoadingBlock,
  Pill,
  SelectInput,
  STATUS_TONE,
  TextArea,
  useToast,
} from '@/ui';
import { AttachmentList, AttachmentPicker } from '../components/Attachments.jsx';
import { PageHeader } from '../components/PageHeader.jsx';
import { UserCell } from '../components/UserCell.jsx';
import { useErrorMessage } from '../hooks/useErrorMessage.js';
import { adminApi } from '../lib/api.js';
import { useT } from '../providers/PreferencesProvider.jsx';

export function TicketPage() {
  const { id } = useParams();
  const { t, lang } = useT();
  const toast = useToast();
  const errorMessage = useErrorMessage();
  const queryClient = useQueryClient();
  const [reply, setReply] = useState('');
  const [files, setFiles] = useState([]);
  const key = ['ticket', id];
  const query = useQuery({ queryKey: key, queryFn: () => adminApi.ticket(id) });
  const onSaved = (res) => {
    queryClient.setQueryData(key, res);
    queryClient.invalidateQueries({ queryKey: ['tickets'] });
    queryClient.invalidateQueries({ queryKey: ['overview'] });
  };
  const send = useMutation({
    mutationFn: (close) =>
      adminApi.replyToTicket(id, {
        message: reply.trim(),
        attachments: files.length ? files.map((f) => f.url) : undefined,
        close,
      }),
    onSuccess: (res) => {
      setReply('');
      setFiles([]);
      onSaved(res);
    },
  });
  const update = useMutation({
    mutationFn: (body) => adminApi.updateTicket(id, body),
    onSuccess: onSaved,
    onError: (err) => toast.error(errorMessage(err)),
  });

  if (query.isLoading) return <LoadingBlock label={t('common.loading')} />;
  if (query.error) return <FormMessage>{errorMessage(query.error)}</FormMessage>;
  const ticket = query.data.ticket;
  const closed = ticket.status === 'closed';
  const canSend = !!reply.trim() || files.length > 0;

  return (
    <>
      <PageHeader
        kicker={
          <Link to="/tickets" className="hover:underline">
            ← {t('nav.tickets')}
          </Link>
        }
        title={ticket.subject}
        sub={`${ticket.ticketNo} · ${optionLabel(TICKET_CATEGORIES, ticket.category, lang)} · ${dateTime(ticket.createdAt, lang)}`}
        actions={
          <Pill tone={STATUS_TONE[ticket.status]}>{optionLabel(TICKET_STATUS, ticket.status, lang)}</Pill>
        }
      />

      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex min-w-0 flex-col gap-4">
          {ticket.messages.map((m) => (
            <article
              key={m.id}
              className={`flex flex-col gap-2 rounded-3xl border p-5 ${m.staff ? 'ml-6 border-gold bg-surface2 sm:ml-16' : 'mr-6 border-line bg-surface sm:mr-16'}`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <b>{m.author.name}</b>
                <span className="text-muted">{dateTime(m.createdAt, lang)}</span>
              </div>
              {m.body && <p className="whitespace-pre-line text-[15px]">{m.body}</p>}
              <AttachmentList items={m.attachments} />
            </article>
          ))}

          {closed ? (
            <Card>
              <p className="text-muted">{t('tickets.closedNote')}</p>
              <Button
                variant="outline"
                className="self-start"
                loading={update.isPending}
                onClick={() => update.mutate({ status: 'open' })}
              >
                {t('tickets.reopen')}
              </Button>
            </Card>
          ) : (
            <Card
              as="form"
              title={t('tickets.reply')}
              onSubmit={(e) => {
                e.preventDefault();
                send.mutate(false);
              }}
            >
              <FormMessage>{send.error && errorMessage(send.error)}</FormMessage>
              <TextArea
                label={t('tickets.reply')}
                rows={5}
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                maxLength={20000}
              />
              <AttachmentPicker value={files} onChange={setFiles} disabled={send.isPending} />
              <div className="flex flex-wrap justify-end gap-3">
                <Button
                  variant="outline"
                  disabled={!canSend}
                  loading={send.isPending && send.variables === true}
                  onClick={() => send.mutate(true)}
                >
                  {t('tickets.replyAndClose')}
                </Button>
                <Button
                  type="submit"
                  disabled={!canSend}
                  loading={send.isPending && send.variables === false}
                >
                  {t('tickets.reply')}
                </Button>
              </div>
            </Card>
          )}
        </div>

        <aside className="flex flex-col gap-6 xl:sticky xl:top-24">
          <Card title={t('tickets.from')}>
            <UserCell user={ticket.user} />
            {ticket.biodataNo && (
              <Link
                to={`/biodatas?q=${encodeURIComponent(ticket.biodataNo)}&status=all`}
                className="text-sm font-bold text-rose-text hover:underline"
              >
                {t('tickets.aboutBiodata', { no: ticket.biodataNo })}
              </Link>
            )}
            {ticket.reportId && (
              <Link to="/reports?status=all" className="text-sm font-bold text-rose-text hover:underline">
                {t('tickets.fromReport')}
              </Link>
            )}
          </Card>
          <Card title={t('common.actions')}>
            <SelectInput
              label={t('tickets.priority')}
              value={ticket.priority}
              onChange={(e) => update.mutate({ priority: e.target.value })}
              options={TICKET_PRIORITY.map((p) => ({ value: p.value, label: p[lang] }))}
            />
            <div className="flex flex-col gap-1 text-sm">
              <span className="font-bold text-muted">{t('tickets.assigned')}</span>
              <span>{ticket.assignedTo ?? '—'}</span>
            </div>
            <Button variant="outline" onClick={() => update.mutate({ assignToMe: true })}>
              {t('tickets.assignMe')}
            </Button>
            {!closed && (
              <Button variant="ghost" onClick={() => update.mutate({ status: 'closed' })}>
                {t('tickets.closeTicket')}
              </Button>
            )}
          </Card>
        </aside>
      </div>
    </>
  );
}

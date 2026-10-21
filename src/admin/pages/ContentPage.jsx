import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import {
  Button,
  Card,
  Checkbox,
  ConfirmDialog,
  FormMessage,
  LoadingBlock,
  Modal,
  Pill,
  Tabs,
  TextArea,
  TextInput,
  useToast,
} from '@/ui';
import { PageHeader } from '../components/PageHeader.jsx';
import { useErrorMessage } from '../hooks/useErrorMessage.js';
import { useQueryParam } from '../hooks/useQueryParam.js';
import { adminApi } from '../lib/api.js';
import { useT } from '../providers/PreferencesProvider.jsx';

const SLUG = /^[a-z0-9-]{2,60}$/;
const EMPTY_PAGE = { slug: '', title: { en: '', bn: '' }, body: { en: '', bn: '' }, isPublished: true };
const EMPTY_FAQ = { question: { en: '', bn: '' }, answer: { en: '', bn: '' }, sortOrder: 0, isActive: true };

/** Shared state helpers for the English/Bangla text pairs both editors use. */
function useBilingualForm(initial) {
  const [form, setForm] = useState(initial);
  const text = (group, lang) => ({
    value: form[group][lang] ?? '',
    onChange: (e) => setForm((f) => ({ ...f, [group]: { ...f[group], [lang]: e.target.value } })),
  });
  return [form, setForm, text];
}

function PageEditor({ page, onClose }) {
  const { t } = useT();
  const toast = useToast();
  const errorMessage = useErrorMessage();
  const queryClient = useQueryClient();
  const [form, setForm, text] = useBilingualForm(page ? { ...EMPTY_PAGE, ...page } : EMPTY_PAGE);
  const validSlug = SLUG.test(form.slug);
  const save = useMutation({
    mutationFn: () =>
      adminApi.savePage(form.slug, { title: form.title, body: form.body, isPublished: form.isPublished }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pages'] });
      toast.success(t('common.saved'));
      onClose();
    },
  });

  return (
    <Modal
      open
      onClose={onClose}
      size="lg"
      title={page ? `${t('common.edit')} · /${page.slug}` : t('content.newPage')}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button
            type="submit"
            form="page-editor"
            disabled={!validSlug || !form.title.en.trim()}
            loading={save.isPending}
          >
            {t('common.save')}
          </Button>
        </>
      }
    >
      <form
        id="page-editor"
        className="flex max-h-[65vh] flex-col gap-4 overflow-y-auto pr-1"
        onSubmit={(e) => {
          e.preventDefault();
          save.mutate();
        }}
      >
        <FormMessage>{save.error && errorMessage(save.error)}</FormMessage>
        {!page && (
          <TextInput
            label={t('content.slug')}
            required
            pattern="[a-z0-9-]{2,60}"
            value={form.slug}
            onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value.toLowerCase() }))}
          />
        )}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextInput label={t('content.titleEn')} required maxLength={160} {...text('title', 'en')} />
          <TextInput label={t('content.titleBn')} maxLength={160} {...text('title', 'bn')} />
        </div>
        <p className="text-[13px] text-muted">{t('content.markdownHint')}</p>
        <TextArea label={t('content.bodyEn')} rows={10} {...text('body', 'en')} />
        <TextArea label={t('content.bodyBn')} rows={10} {...text('body', 'bn')} />
        <Checkbox
          label={t('content.published')}
          checked={form.isPublished}
          onChange={(e) => setForm((f) => ({ ...f, isPublished: e.target.checked }))}
        />
      </form>
    </Modal>
  );
}

function FaqEditor({ faq, onClose }) {
  const { t } = useT();
  const toast = useToast();
  const errorMessage = useErrorMessage();
  const queryClient = useQueryClient();
  const [form, setForm, text] = useBilingualForm(faq ? { ...EMPTY_FAQ, ...faq } : EMPTY_FAQ);
  const save = useMutation({
    mutationFn: () => {
      const body = {
        question: form.question,
        answer: form.answer,
        sortOrder: Number(form.sortOrder) || 0,
        isActive: form.isActive,
      };
      return faq ? adminApi.updateFaq(faq._id, body) : adminApi.createFaq(body);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faqs'] });
      toast.success(t('common.saved'));
      onClose();
    },
  });

  return (
    <Modal
      open
      onClose={onClose}
      size="lg"
      title={faq ? t('common.edit') : t('content.newFaq')}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button
            type="submit"
            form="faq-editor"
            disabled={!form.question.en.trim() || !form.answer.en.trim()}
            loading={save.isPending}
          >
            {t('common.save')}
          </Button>
        </>
      }
    >
      <form
        id="faq-editor"
        className="flex max-h-[65vh] flex-col gap-4 overflow-y-auto pr-1"
        onSubmit={(e) => {
          e.preventDefault();
          save.mutate();
        }}
      >
        <FormMessage>{save.error && errorMessage(save.error)}</FormMessage>
        <TextInput label={t('content.questionEn')} required maxLength={300} {...text('question', 'en')} />
        <TextInput label={t('content.questionBn')} maxLength={300} {...text('question', 'bn')} />
        <TextArea label={t('content.answerEn')} required rows={4} {...text('answer', 'en')} />
        <TextArea label={t('content.answerBn')} rows={4} {...text('answer', 'bn')} />
        <div className="grid grid-cols-1 items-end gap-4 sm:grid-cols-2">
          <TextInput
            label={t('content.order')}
            type="number"
            value={form.sortOrder}
            onChange={(e) => setForm((f) => ({ ...f, sortOrder: e.target.value }))}
          />
          <Checkbox
            label={t('content.active')}
            checked={form.isActive}
            onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
          />
        </div>
      </form>
    </Modal>
  );
}

/** Lists pages or FAQs with edit and delete. `kind` is 'pages' or 'faqs'. */
function ContentList({ kind }) {
  const { t, lang } = useT();
  const errorMessage = useErrorMessage();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(null); // an item, 'new', or null
  const [removing, setRemoving] = useState(null);
  const isPages = kind === 'pages';
  const query = useQuery({ queryKey: [kind], queryFn: isPages ? adminApi.pages : adminApi.faqs });
  const remove = useMutation({
    mutationFn: () => (isPages ? adminApi.deletePage(removing.slug) : adminApi.deleteFaq(removing._id)),
    onSuccess: () => {
      setRemoving(null);
      queryClient.invalidateQueries({ queryKey: [kind] });
    },
  });
  const titleOf = (item) =>
    (isPages ? item.title : item.question)[lang] || (isPages ? item.title : item.question).en;

  return (
    <Card
      title={t(`content.${kind}`)}
      action={
        <Button size="sm" onClick={() => setEditing('new')}>
          {t(isPages ? 'content.newPage' : 'content.newFaq')}
        </Button>
      }
    >
      {query.isLoading ? (
        <LoadingBlock label={t('common.loading')} />
      ) : (
        <ul className="flex flex-col">
          {query.data.items.map((item) => {
            const shown = isPages ? item.isPublished : item.isActive;
            return (
              <li
                key={item._id}
                className="flex flex-wrap items-center justify-between gap-3 border-t border-line py-4"
              >
                <span className="flex min-w-0 flex-col gap-0.5">
                  <b>{titleOf(item)}</b>
                  {isPages && <span className="font-mono text-xs text-muted">/{item.slug}</span>}
                </span>
                <span className="flex flex-wrap items-center gap-2">
                  {!shown && <Pill tone="muted">{t('content.hidden')}</Pill>}
                  {isPages && shown && (
                    <a
                      href={`/${item.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-2 text-sm font-semibold text-rose-text hover:underline"
                    >
                      {t('content.viewOnSite')}
                    </a>
                  )}
                  <Button size="sm" variant="outline" onClick={() => setEditing(item)}>
                    {t('common.edit')}
                  </Button>
                  <Button size="sm" variant="ghost" className="text-danger" onClick={() => setRemoving(item)}>
                    {t('common.delete')}
                  </Button>
                </span>
              </li>
            );
          })}
        </ul>
      )}
      {editing &&
        (isPages ? (
          <PageEditor
            key={editing._id ?? 'new'}
            page={editing === 'new' ? null : editing}
            onClose={() => setEditing(null)}
          />
        ) : (
          <FaqEditor
            key={editing._id ?? 'new'}
            faq={editing === 'new' ? null : editing}
            onClose={() => setEditing(null)}
          />
        ))}
      <ConfirmDialog
        open={!!removing}
        title={t('content.confirmDelete')}
        description={removing ? titleOf(removing) : ''}
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
        loading={remove.isPending}
        error={remove.error && errorMessage(remove.error)}
        onConfirm={() => remove.mutate()}
        onClose={() => {
          setRemoving(null);
          remove.reset();
        }}
      />
    </Card>
  );
}

export function ContentPage() {
  const { t } = useT();
  const [tab, setTab] = useQueryParam('tab', 'pages');
  return (
    <>
      <PageHeader title={t('content.title')} sub={t('content.sub')} />
      <Tabs
        value={tab}
        onChange={setTab}
        items={['pages', 'faqs'].map((v) => ({ value: v, label: t(`content.${v}`) }))}
      />
      <ContentList key={tab} kind={tab === 'faqs' ? 'faqs' : 'pages'} />
    </>
  );
}

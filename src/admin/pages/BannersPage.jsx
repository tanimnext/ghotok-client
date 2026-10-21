import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { digits } from '@/shared/format';
import {
  Button,
  Card,
  Checkbox,
  ConfirmDialog,
  EmptyState,
  FormMessage,
  LoadingBlock,
  Modal,
  Pill,
  TextInput,
  useToast,
} from '@/ui';
import { PageHeader } from '../components/PageHeader.jsx';
import { useErrorMessage } from '../hooks/useErrorMessage.js';
import { IMAGE_TYPES, imageProblem, uploadImage } from '@/lib/imgbb';
import { adminApi } from '../lib/api.js';
import { useT } from '../providers/PreferencesProvider.jsx';

const EMPTY = { title: { en: '', bn: '' }, sortOrder: 0, isActive: true };

/**
 * Creates or edits a banner. Its images upload from the browser to ImgBB: the
 * full-size image members download, and an optional smaller preview for the page.
 */
function BannerEditor({ banner, onClose }) {
  const { t } = useT();
  const toast = useToast();
  const errorMessage = useErrorMessage();
  const queryClient = useQueryClient();
  const [form, setForm] = useState(
    banner
      ? {
          title: { en: banner.title.en ?? '', bn: banner.title.bn ?? '' },
          sortOrder: banner.sortOrder ?? 0,
          isActive: banner.isActive,
        }
      : EMPTY,
  );
  const [preview, setPreview] = useState(null);
  const [full, setFull] = useState(null);
  const [fileError, setFileError] = useState(null);
  const set = (patch) => setForm((f) => ({ ...f, ...patch }));
  const setTitle = (lang) => (e) => setForm((f) => ({ ...f, title: { ...f.title, [lang]: e.target.value } }));

  const save = useMutation({
    mutationFn: async () => {
      const body = {
        title: { en: form.title.en.trim(), bn: form.title.bn.trim() || undefined },
        sortOrder: Number(form.sortOrder) || 0,
        isActive: form.isActive,
      };
      if (full) body.downloadUrl = (await uploadImage(full)).url;
      if (preview) body.imageUrl = (await uploadImage(preview)).url;
      else if (full) body.imageUrl = body.downloadUrl;
      return banner ? adminApi.updateBanner(banner.id, body) : adminApi.createBanner(body);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['banners'] });
      toast.success(t('common.saved'));
      onClose();
    },
  });

  /** Checks the chosen image's type and size before keeping it. */
  const choose = (keep) => (e) => {
    const file = e.target.files?.[0] ?? null;
    setFileError(null);
    if (file && imageProblem(file)) {
      e.target.value = '';
      keep(null);
      return setFileError(t('banners.badFile', { name: file.name }));
    }
    keep(file);
  };

  const ready = form.title.en.trim() && (banner || full);
  return (
    <Modal
      open
      onClose={onClose}
      size="lg"
      title={banner ? t('banners.editTitle') : t('banners.new')}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" form="banner-editor" disabled={!ready} loading={save.isPending}>
            {t('common.save')}
          </Button>
        </>
      }
    >
      <form
        id="banner-editor"
        className="flex max-h-[65vh] flex-col gap-4 overflow-y-auto pr-1"
        onSubmit={(e) => {
          e.preventDefault();
          save.mutate();
        }}
      >
        <FormMessage>{(save.error && errorMessage(save.error)) || fileError}</FormMessage>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextInput
            label={t('banners.titleEn')}
            required
            maxLength={120}
            value={form.title.en}
            onChange={setTitle('en')}
          />
          <TextInput
            label={t('banners.titleBn')}
            maxLength={120}
            value={form.title.bn}
            onChange={setTitle('bn')}
          />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextInput
            label={t('banners.image')}
            hint={banner ? t('banners.replaceHint') : t('banners.imageHint')}
            type="file"
            required={!banner}
            accept={IMAGE_TYPES.join(',')}
            onChange={choose(setFull)}
          />
          <TextInput
            label={t('banners.preview')}
            hint={t('banners.previewHint')}
            type="file"
            accept={IMAGE_TYPES.join(',')}
            onChange={choose(setPreview)}
          />
        </div>
        <TextInput
          label={t('content.order')}
          type="number"
          className="max-w-xs"
          value={form.sortOrder}
          onChange={(e) => set({ sortOrder: e.target.value })}
        />
        <Checkbox
          label={t('banners.active')}
          checked={form.isActive}
          onChange={(e) => set({ isActive: e.target.checked })}
        />
      </form>
    </Modal>
  );
}

export function BannersPage() {
  const { t, lang } = useT();
  const errorMessage = useErrorMessage();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(null); // a banner, 'new', or null
  const [removing, setRemoving] = useState(null);
  const query = useQuery({ queryKey: ['banners'], queryFn: adminApi.banners });
  const remove = useMutation({
    mutationFn: () => adminApi.deleteBanner(removing.id),
    onSuccess: () => {
      setRemoving(null);
      queryClient.invalidateQueries({ queryKey: ['banners'] });
    },
  });
  const titleOf = (b) => b.title[lang] || b.title.en;

  return (
    <>
      <PageHeader
        title={t('banners.title')}
        sub={t('banners.sub')}
        actions={<Button onClick={() => setEditing('new')}>{t('banners.new')}</Button>}
      />
      <Card>
        {query.isLoading ? (
          <LoadingBlock label={t('common.loading')} />
        ) : query.error ? (
          <FormMessage>{errorMessage(query.error)}</FormMessage>
        ) : query.data.items.length === 0 ? (
          <EmptyState>{t('banners.empty')}</EmptyState>
        ) : (
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {query.data.items.map((b) => (
              <li key={b.id} className="flex flex-col gap-3 rounded-3xl border border-line p-4">
                <img
                  src={b.imageUrl}
                  alt=""
                  className="aspect-[4/3] w-full rounded-2xl border border-line bg-surface2 object-contain"
                />
                <div className="flex items-start justify-between gap-2">
                  <b className="min-w-0">{titleOf(b)}</b>
                  {!b.isActive && <Pill tone="muted">{t('content.hidden')}</Pill>}
                </div>
                <span className="text-sm text-muted">
                  {t('banners.downloads', { n: digits(b.downloads ?? 0, lang) })}
                </span>
                <span className="mt-auto flex flex-wrap justify-end gap-2">
                  <Button size="sm" variant="outline" onClick={() => setEditing(b)}>
                    {t('common.edit')}
                  </Button>
                  <Button size="sm" variant="ghost" className="text-danger" onClick={() => setRemoving(b)}>
                    {t('common.delete')}
                  </Button>
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
      {editing && (
        <BannerEditor
          key={editing.id ?? 'new'}
          banner={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
        />
      )}
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
    </>
  );
}

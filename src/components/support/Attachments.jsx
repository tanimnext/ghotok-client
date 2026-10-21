'use client';

import { useRef, useState } from 'react';
import { Icon } from '@/ui';
import { IMAGE_TYPES, imageProblem, uploadImage } from '@/lib/imgbb';
import { useT } from '@/providers/PreferencesProvider';

export const MAX_ATTACHMENTS = 5;

/**
 * Images attached to a support message or report. Each image uploads to ImgBB as
 * soon as it is picked; `urls` are the image links to send with the message.
 */
export function useAttachments() {
  const [items, setItems] = useState([]); // { id, name, status: 'uploading'|'done'|'error', url?, error? }
  const patch = (id, change) => setItems((list) => list.map((i) => (i.id === id ? { ...i, ...change } : i)));

  const add = (files) => {
    const room = MAX_ATTACHMENTS - items.length;
    for (const file of [...files].slice(0, Math.max(room, 0))) {
      const id = crypto.randomUUID();
      const problem = imageProblem(file);
      const error = problem ? `attachments.${problem}` : null;
      setItems((list) => [...list, { id, name: file.name, status: problem ? 'error' : 'uploading', error }]);
      if (problem) continue;
      uploadImage(file)
        .then(({ url }) => patch(id, { status: 'done', url }))
        .catch(() => patch(id, { status: 'error', error: 'attachments.failed' }));
    }
  };

  return {
    items,
    add,
    remove: (id) => setItems((list) => list.filter((i) => i.id !== id)),
    reset: () => setItems([]),
    uploading: items.some((i) => i.status === 'uploading'),
    urls: items.filter((i) => i.status === 'done').map((i) => i.url),
  };
}

/** "Attach files" button with the list of picked files. */
export function AttachmentPicker({ attachments }) {
  const { t } = useT();
  const input = useRef(null);
  const full = attachments.items.length >= MAX_ATTACHMENTS;
  return (
    <div className="flex flex-col gap-2">
      <input
        ref={input}
        type="file"
        multiple
        hidden
        accept={IMAGE_TYPES.join(',')}
        onChange={(e) => {
          attachments.add(e.target.files);
          e.target.value = '';
        }}
      />
      <button
        type="button"
        disabled={full}
        onClick={() => input.current?.click()}
        className="flex min-h-11 items-center gap-2 self-start rounded-full border border-dashed border-line px-4 text-sm font-semibold hover:border-gold disabled:opacity-50"
      >
        <Icon name="upload" size={16} /> {t('attachments.add')}
      </button>
      <span className="text-[13px] text-muted">{t('attachments.hint')}</span>
      {attachments.items.length > 0 && (
        <ul className="flex flex-col gap-1.5">
          {attachments.items.map((item) => (
            <li
              key={item.id}
              className="flex items-center justify-between gap-3 rounded-xl bg-surface2 px-3 py-2 text-sm"
            >
              <span className="flex min-w-0 items-center gap-2">
                <Icon name="file" size={16} className="flex-none" />
                <span className="truncate">{item.name}</span>
                <span
                  className={`flex-none text-[13px] ${item.status === 'error' ? 'font-semibold text-danger' : 'text-muted'}`}
                >
                  {item.status === 'uploading'
                    ? t('editor.uploading')
                    : item.status === 'error'
                      ? t(item.error)
                      : t('attachments.ready')}
                </span>
              </span>
              <button
                type="button"
                onClick={() => attachments.remove(item.id)}
                aria-label={t('attachments.remove', { name: item.name })}
                className="flex size-9 flex-none items-center justify-center rounded-full hover:bg-surface"
              >
                <Icon name="close" size={16} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Images attached to a sent message, as thumbnails linking to the full image. */
export function AttachmentList({ files }) {
  const { t } = useT();
  if (!files?.length) return null;
  return (
    <div className="flex flex-wrap gap-2.5 pt-1">
      {files.map((f) => {
        // The API stores ImgBB links; older messages may carry { url, name } objects.
        const url = typeof f === 'string' ? f : f.url;
        return (
          <a key={url} href={url} target="_blank" rel="noopener noreferrer" className="block">
            {/* ImgBB serves the image; next/image would need every ImgBB host configured. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={url}
              alt={f.name ?? t('attachments.image')}
              className="h-28 w-28 rounded-xl border border-line object-cover"
            />
          </a>
        );
      })}
    </div>
  );
}

import { useState } from 'react';
import { formatNumber } from '@/shared';
import { FormMessage, Icon, Spinner } from '@/ui';
import { useErrorMessage } from '../hooks/useErrorMessage.js';
import { IMAGE_TYPES, imageProblem, uploadImage } from '@/lib/imgbb';
import { useT } from '../providers/PreferencesProvider.jsx';

const MB = 1024 * 1024;
const MAX_FILES = 5;

const sizeLabel = (bytes, lang) =>
  bytes >= MB
    ? `${formatNumber(Math.round((bytes / MB) * 10) / 10, lang)} MB`
    : `${formatNumber(Math.max(1, Math.round(bytes / 1024)), lang)} KB`;

/** The images attached to a support message, as thumbnails linking to the full image. */
export function AttachmentList({ items }) {
  const { t } = useT();
  if (!items?.length) return null;
  return (
    <ul className="flex flex-wrap gap-3" aria-label={t('tickets.attachments')}>
      {items.map((a) => {
        // The API stores ImgBB links; older messages may carry { url, name } objects.
        const url = typeof a === 'string' ? a : a.url;
        return (
          <li key={url}>
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="block rounded-2xl border border-line bg-surface p-2 hover:border-gold"
            >
              <img src={url} alt={a.name ?? ''} className="size-20 rounded-xl object-cover" />
            </a>
          </li>
        );
      })}
    </ul>
  );
}

/**
 * Uploads images to ImgBB as soon as they are chosen and keeps their links for the reply.
 * `value` is an array of { url, name, size }.
 */
export function AttachmentPicker({ value, onChange, disabled }) {
  const { t, lang } = useT();
  const errorMessage = useErrorMessage();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const full = disabled || busy || value.length >= MAX_FILES;

  const pick = async (e) => {
    const files = [...e.target.files];
    e.target.value = '';
    setError(null);
    if (value.length + files.length > MAX_FILES) return setError(t('tickets.tooManyFiles', { n: MAX_FILES }));
    const bad = files.find((f) => imageProblem(f));
    if (bad) return setError(t('tickets.badFile', { name: bad.name }));
    setBusy(true);
    try {
      const added = [];
      for (const file of files) {
        const { url } = await uploadImage(file);
        added.push({ url, name: file.name, size: file.size });
      }
      onChange([...value, ...added]);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <FormMessage>{error}</FormMessage>
      {value.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {value.map((a) => (
            <li
              key={a.url}
              className="flex items-center gap-2 rounded-full border border-line px-3 py-1 text-sm"
            >
              <span className="max-w-48 truncate">{a.name}</span>
              <span className="text-xs text-muted">{sizeLabel(a.size, lang)}</span>
              <button
                type="button"
                aria-label={t('tickets.removeFile', { name: a.name })}
                className="flex size-7 items-center justify-center rounded-full hover:bg-surface2"
                onClick={() => onChange(value.filter((x) => x.url !== a.url))}
              >
                <Icon name="close" size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <label
          className={`inline-flex min-h-10 items-center gap-2 rounded-full border-[1.5px] border-gold px-4 text-[13px] font-bold has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 ${full ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:bg-surface2'}`}
        >
          <input
            type="file"
            multiple
            className="sr-only"
            accept={IMAGE_TYPES.join(',')}
            disabled={full}
            onChange={pick}
          />
          {busy ? <Spinner size={16} /> : <Icon name="upload" size={16} />}
          {t('tickets.attach')}
        </label>
        <span className="text-xs text-muted">{t('tickets.attachHint')}</span>
      </div>
    </div>
  );
}

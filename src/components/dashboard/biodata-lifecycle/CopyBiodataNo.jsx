'use client';

import { useToast } from '@/ui';
import { useT } from '@/providers/PreferencesProvider';

/** The biodata number with a button that copies it (members share it with families). */
export function CopyBiodataNo({ biodataNo }) {
  const { t } = useT();
  const toast = useToast();
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(biodataNo);
      toast.success(t('lifecycle.copied', { no: biodataNo }));
    } catch {
      toast.error(t('common.somethingWrong'));
    }
  };
  return (
    <span className="inline-flex items-center gap-2">
      <span className="font-bold tracking-[0.02em] text-ink">{biodataNo}</span>
      <button
        type="button"
        onClick={copy}
        aria-label={t('lifecycle.copyNo')}
        className="min-h-9 rounded-full border border-line px-3 text-xs font-bold text-muted hover:border-gold hover:text-ink"
      >
        {t('common.copy')}
      </button>
    </span>
  );
}

'use client';

import { useMutation } from '@tanstack/react-query';
import Link from 'next/link';
import { useState } from 'react';
import { Icon, Pill, useToast } from '@/ui';
import { useErrorMessage } from '@/hooks/use-error-message';
import { biodataApi } from '@/lib/api/endpoints';
import { useT } from '@/providers/PreferencesProvider';
import { ArchPortrait } from './ArchPortrait.jsx';
import { cardText } from './biodata-text.js';

/** Heart button that adds a biodata to (or removes it from) the member's shortlist. */
function ShortlistButton({ biodata }) {
  const { t } = useT();
  const toast = useToast();
  const errorMessage = useErrorMessage();
  const [on, setOn] = useState(!!biodata.favorited);
  const toggle = useMutation({
    mutationFn: (next) =>
      next ? biodataApi.favorite(biodata.biodataNo) : biodataApi.unfavorite(biodata.biodataNo),
    onMutate: (next) => setOn(next),
    onSuccess: (_r, next) => toast.success(next ? t('card.favAdded') : t('card.favRemoved')),
    onError: (err, next) => {
      setOn(!next);
      toast.error(errorMessage(err));
    },
  });
  return (
    <button
      type="button"
      aria-pressed={on}
      aria-label={on ? t('card.removeFav') : t('card.addFav')}
      title={on ? t('card.removeFav') : t('card.addFav')}
      disabled={toggle.isPending}
      onClick={() => toggle.mutate(!on)}
      className={`flex size-11 items-center justify-center rounded-full border ${on ? 'border-rose bg-rose text-on-rose' : 'border-line bg-surface hover:border-gold'}`}
    >
      <Icon name="heart" size={18} />
    </button>
  );
}

/**
 * A biodata summary card (home page, search results, personal lists).
 * `footer` replaces the default "View biodata" link, e.g. with list actions.
 * With `canShortlist`, a heart button adds it to the member's shortlist.
 */
export function BiodataCard({ biodata, footer, canShortlist = false }) {
  const { t, lang } = useT();
  const text = cardText(biodata, t, lang);
  const href = `/biodatas/${biodata.biodataNo}`;
  return (
    <article className="relative flex flex-col gap-4 rounded-[28px] border border-line bg-surface p-5 pb-6 transition hover:border-gold">
      <ArchPortrait>
        {biodata.seen && (
          <span className="absolute right-3.5 top-3.5">
            <Pill tone="muted">
              <Icon name="check" size={13} strokeWidth={2.4} />
              {t('card.seen')}
            </Pill>
          </span>
        )}
      </ArchPortrait>
      <div className="flex flex-col gap-1.5 px-1.5">
        <span className="text-xs font-bold uppercase tracking-[0.1em] text-muted">{text.id}</span>
        <h3 className="font-display text-[23px] font-semibold leading-snug">
          <Link href={href} className="after:absolute after:inset-0 hover:text-rose-text">
            {text.title || biodata.biodataNo}
          </Link>
        </h3>
        <p className="text-[15px] leading-relaxed text-muted">
          {text.education && <span className="block">{text.education}</span>}
          {text.job && <span className="block">{text.job}</span>}
          {text.place && <span className="block">{text.place}</span>}
        </p>
      </div>
      <div className="relative z-10 mt-auto flex items-center justify-between gap-3 px-1.5">
        {footer ?? (
          <Link href={href} className="inline-flex items-center gap-1.5 text-[15px] font-bold text-rose-text">
            {t('card.viewBio')} <Icon name="arrowRight" size={16} />
          </Link>
        )}
        {canShortlist && !footer && <ShortlistButton biodata={biodata} />}
      </div>
    </article>
  );
}

'use client';

import { Icon } from '@/ui';
import { usePublicSettings } from '@/hooks/use-public-settings';
import { useT } from '@/providers/PreferencesProvider';

/**
 * A "Watch how to…" link to a short video set by the team in Settings → Site.
 * Renders nothing until a link is configured.
 * @param {{ topic: 'createBiodata' | 'buyConnections' | 'viewContact', className?: string }} props
 */
export function TutorialLink({ topic, className = '' }) {
  const { t } = useT();
  const { data } = usePublicSettings();
  const url = data?.site?.tutorials?.[topic];
  if (!url) return null;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex min-h-11 items-center gap-2 text-sm font-bold text-rose-text underline-offset-4 hover:underline ${className}`}
    >
      <Icon name="arrowRight" size={16} />
      {t(`tutorials.${topic}`)}
    </a>
  );
}

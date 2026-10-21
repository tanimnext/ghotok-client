'use client';

import { useMutation } from '@tanstack/react-query';
import { Button, useToast } from '@/ui';
import { useErrorMessage } from '@/hooks/use-error-message';
import { contentApi } from '@/lib/api/endpoints';
import { useT } from '@/providers/PreferencesProvider';

/** Counts the download, then opens the full-size banner image in a new tab. */
export function BannerDownload({ id, href }) {
  const { t } = useT();
  const toast = useToast();
  const errorMessage = useErrorMessage();
  const download = useMutation({
    mutationFn: () => contentApi.downloadBanner(id),
    onSuccess: (res) => window.open(res?.url ?? href, '_blank', 'noopener'),
    onError: (e) => (href ? window.open(href, '_blank', 'noopener') : toast.error(errorMessage(e))),
  });
  return (
    <Button block loading={download.isPending} onClick={() => download.mutate()}>
      {t('banners.download')}
    </Button>
  );
}

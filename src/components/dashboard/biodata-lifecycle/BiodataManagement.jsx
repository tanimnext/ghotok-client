'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { HIDE_REASONS, optionLabel } from '@/shared';
import { Button, Card } from '@/ui';
import { biodataApi } from '@/lib/api/endpoints';
import { useT } from '@/providers/PreferencesProvider';
import { MY_BIODATA_KEY } from '../biodata-editor/keys.js';
import { DeleteDialog } from './DeleteDialog.jsx';
import { VisibilitySwitch } from './HideDialog.jsx';
import { RestorePanel } from './RestorePanel.jsx';

/** Hide, delete or restore the member's biodata (Account and security page). */
export function BiodataManagement() {
  const { t, lang } = useT();
  const [deleting, setDeleting] = useState(false);
  const { data } = useQuery({ queryKey: MY_BIODATA_KEY, queryFn: biodataApi.mine });
  const biodata = data?.biodata;
  if (!biodata) return null;
  if (biodata.deletedAt) return <RestorePanel biodata={biodata} />;

  return (
    <>
      <Card title={t('settings.visibility')}>
        <div className="flex items-center justify-between gap-4">
          <span className="flex flex-col gap-1">
            <b className="text-[15px]">{t('dash.visible')}</b>
            <span className="text-sm text-muted">
              {!biodata.isHidden
                ? t('settings.hiddenNote')
                : biodata.hideReason
                  ? t('lifecycle.hiddenBecause', {
                      reason: optionLabel(HIDE_REASONS, biodata.hideReason, lang),
                    })
                  : t('dash.visOff')}
            </span>
          </span>
          <VisibilitySwitch biodata={biodata} label={t('dash.visible')} />
        </div>
      </Card>
      <Card title={t('settings.deleteTitle')} id="delete">
        <p className="text-muted">{t('settings.deleteText')}</p>
        <Button variant="outlineRose" className="self-start" onClick={() => setDeleting(true)}>
          {t('dash.delBio')}
        </Button>
      </Card>
      <DeleteDialog open={deleting} onClose={() => setDeleting(false)} />
    </>
  );
}

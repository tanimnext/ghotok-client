'use client';

import { useMutation } from '@tanstack/react-query';
import Link from 'next/link';
import { useState } from 'react';
import { Button, Card, Checkbox, FormMessage, Icon } from '@/ui';
import { TutorialLink } from '@/components/content/TutorialLink';
import { useErrorMessage } from '@/hooks/use-error-message';
import { biodataApi } from '@/lib/api/endpoints';
import { useT } from '@/providers/PreferencesProvider';
import { useBiodataUpdate } from './use-biodata-update.js';

const RULES = ['age', 'consent', 'truth', 'contact', 'review'];

/** Who may create a biodata and what they promise. Shown once, before the first section. */
export function PledgeScreen() {
  const { t } = useT();
  const errorMessage = useErrorMessage();
  const update = useBiodataUpdate();
  const [accepted, setAccepted] = useState(false);
  const start = useMutation({ mutationFn: biodataApi.create, onSuccess: update });

  return (
    <Card title={t('lifecycle.pledgeTitle')}>
      <p className="leading-relaxed text-muted">{t('lifecycle.pledgeIntro')}</p>
      <ul className="flex flex-col gap-3">
        {RULES.map((rule) => (
          <li key={rule} className="flex gap-3 text-[15px] leading-relaxed">
            <Icon name="check" size={18} strokeWidth={2.6} className="mt-1 flex-none text-sage" />
            <span>{t(`lifecycle.pledge.${rule}`)}</span>
          </li>
        ))}
      </ul>
      <p className="text-sm text-muted">
        {t('lifecycle.pledgeTerms')}{' '}
        <Link href="/terms" className="font-semibold underline">
          {t('footer.terms')}
        </Link>
        {' · '}
        <Link href="/child-safety" className="font-semibold underline">
          {t('footer.childSafety')}
        </Link>
      </p>
      <Checkbox
        label={t('lifecycle.pledgeAccept')}
        checked={accepted}
        onChange={(e) => setAccepted(e.target.checked)}
      />
      <FormMessage>{start.error && errorMessage(start.error)}</FormMessage>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
        <TutorialLink topic="createBiodata" />
        <Button disabled={!accepted} loading={start.isPending} onClick={() => start.mutate()}>
          {t('lifecycle.pledgeStart')}
        </Button>
      </div>
    </Card>
  );
}

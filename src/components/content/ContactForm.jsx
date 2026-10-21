'use client';

import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { Button, FormMessage, TextArea, TextInput } from '@/ui';
import { useErrorMessage } from '@/hooks/use-error-message';
import { supportApi } from '@/lib/api/endpoints';
import { validate } from '@/lib/validators';
import { useT } from '@/providers/PreferencesProvider';

const EMPTY = { name: '', email: '', phone: '', subject: '', message: '' };

export function ContactForm() {
  const { t } = useT();
  const errorMessage = useErrorMessage();
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const send = useMutation({ mutationFn: () => supportApi.contact(form), onSuccess: () => setForm(EMPTY) });

  const submit = (e) => {
    e.preventDefault();
    const found = validate(form, {
      name: 'name',
      email: 'optionalEmail',
      phone: 'optionalPhone',
      message: 'message',
    });
    setErrors(found);
    if (!Object.keys(found).length) send.mutate();
  };
  const field = (key) => ({
    value: form[key],
    onChange: (e) => setForm((f) => ({ ...f, [key]: e.target.value })),
    error: errors[key] && t(errors[key]),
  });

  return (
    <form
      onSubmit={submit}
      noValidate
      className="flex flex-col gap-4 rounded-[28px] border border-line bg-surface p-6 sm:p-8"
    >
      {send.isSuccess && <FormMessage tone="success">{t('pages.contactThanks')}</FormMessage>}
      <FormMessage>{send.error && errorMessage(send.error)}</FormMessage>
      <TextInput label={t('pages.contactName')} autoComplete="name" required {...field('name')} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TextInput label={t('pages.contactEmail')} type="email" autoComplete="email" {...field('email')} />
        <TextInput label={t('pages.contactPhone')} type="tel" autoComplete="tel" {...field('phone')} />
      </div>
      <TextInput label={t('pages.contactSubject')} {...field('subject')} />
      <TextArea label={t('pages.contactMessage')} rows={6} required maxLength={3000} {...field('message')} />
      <Button type="submit" size="lg" loading={send.isPending}>
        {t('pages.contactSend')}
      </Button>
    </form>
  );
}

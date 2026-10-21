'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { VALIDATION_MESSAGES, isFieldVisible, setFieldValue, validateSection } from '@/shared';
import { BiodataField, Button, Card, FormMessage } from '@/ui';
import { useErrorMessage } from '@/hooks/use-error-message';
import { biodataApi } from '@/lib/api/endpoints';
import { useT } from '@/providers/PreferencesProvider';
import { useToast } from '@/ui';
import { MY_BIODATA_KEY } from './keys.js';

const initialValues = (section, saved) => {
  const values = { ...(saved ?? {}) };
  for (const f of section.fields)
    if (values[f.key] === undefined && f.defaultValue !== undefined) values[f.key] = f.defaultValue;
  return values;
};

/** Wraps a field the reviewer asked to change, with their note underneath. */
function Flagged({ field, correction, children }) {
  const { t } = useT();
  if (!correction) return children;
  const wide = ['textarea', 'multiselect'].includes(field.type);
  return (
    <div
      className={`flex flex-col gap-2 rounded-2xl p-3 ring-2 ${correction.changed ? 'ring-sage' : 'ring-gold'} ${wide ? 'sm:col-span-2' : ''}`}
    >
      {children}
      <span className={`text-[13px] font-semibold ${correction.changed ? 'text-sage' : 'text-gold-text'}`}>
        {correction.changed ? t('lifecycle.correctionDone') : t('lifecycle.correctionAsk')}
        {correction.note ? `: ${correction.note}` : ''}
      </span>
    </div>
  );
}

/**
 * Edits one biodata section. Values are checked with the same shared validator
 * the API uses; drafts may be incomplete but never invalid. `corrections` are the
 * reviewer's requests for this section; `locked` shows the answers read-only.
 */
export function SectionForm({ section, sections, onSaved, isLast, corrections = [], locked = false }) {
  const { t, lang } = useT();
  const toast = useToast();
  const errorMessage = useErrorMessage();
  const queryClient = useQueryClient();
  const [values, setValues] = useState(() => initialValues(section, sections?.[section.key]));
  const [errors, setErrors] = useState({});
  const [action, setAction] = useState(null); // which button is saving: 'save' | 'next'

  const all = { ...sections, [section.key]: values };
  const fieldText = {
    choose: t('editor.choose'),
    selectMany: t('editor.selectMany'),
    privateNote: t('editor.privateNote'),
  };
  const message = (code) => VALIDATION_MESSAGES[code]?.[lang] ?? code;

  const save = useMutation({
    mutationFn: (data) => biodataApi.saveSection(section.key, data),
    onSuccess: (result) => {
      queryClient.setQueryData(MY_BIODATA_KEY, result);
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success(result.statusChanged ? t('editor.approvedNote') : t('common.saved'));
    },
    onError: (err) => {
      if (err.code === 'VALIDATION_ERROR') setErrors(err.fields);
      else toast.error(errorMessage(err));
      // The biodata changed elsewhere (not started yet, or editing was paused): reload it.
      if (['PLEDGE_REQUIRED', 'EDIT_SUSPENDED'].includes(err.code))
        queryClient.invalidateQueries({ queryKey: MY_BIODATA_KEY });
    },
  });

  const submit = (advance) => (e) => {
    e?.preventDefault();
    setAction(advance ? 'next' : 'save');
    const { value, errors: found } = validateSection(section.key, values, {
      biodata: sections,
      partial: true,
    });
    setErrors(found);
    if (Object.keys(found).length) return;
    save.mutate(value, { onSuccess: () => advance && onSaved() });
  };

  // Changing a division or district also clears the places that belonged to it.
  const setField = (key, value) => setValues((prev) => setFieldValue(section, prev, key, value));

  return (
    <Card as="form" onSubmit={submit(!isLast)} noValidate title={section.title[lang]}>
      {section.description && <FormMessage tone="info">{section.description[lang]}</FormMessage>}
      <fieldset disabled={locked} className="min-w-0">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {section.fields
            .filter((f) => isFieldVisible(f, all))
            .map((f) => (
              <Flagged key={f.key} field={f} correction={corrections.find((c) => c.field === f.key)}>
                <BiodataField
                  field={f}
                  lang={lang}
                  text={fieldText}
                  value={values[f.key]}
                  values={values}
                  error={errors[f.key] && message(errors[f.key])}
                  onChange={(v) => setField(f.key, v)}
                />
              </Flagged>
            ))}
        </div>
      </fieldset>
      {!locked && (
        <div className="flex flex-wrap justify-end gap-3 border-t border-line pt-5">
          <Button variant="outline" loading={save.isPending && action === 'save'} onClick={submit(false)}>
            {t('editor.saveSection')}
          </Button>
          {!isLast && (
            <Button type="submit" loading={save.isPending && action === 'next'}>
              {t('editor.saveNext')}
            </Button>
          )}
        </div>
      )}
    </Card>
  );
}

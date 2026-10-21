import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { VALIDATION_MESSAGES, isFieldVisible, setFieldValue, validateSection } from '@/shared';
import { BiodataField, Button, FormMessage, Modal, useToast } from '@/ui';
import { useErrorMessage } from '../hooks/useErrorMessage.js';
import { adminApi } from '../lib/api.js';
import { useT } from '../providers/PreferencesProvider.jsx';

/**
 * Staff correction of one biodata section, using the same field definitions and
 * validator as the member's editor. The review status does not change.
 * Mount it with a `key` per section so its state starts fresh.
 */
export function SectionEditor({ biodataId, section, sections, onClose }) {
  const { t, lang } = useT();
  const toast = useToast();
  const errorMessage = useErrorMessage();
  const queryClient = useQueryClient();
  const [values, setValues] = useState(() => ({ ...(sections?.[section.key] ?? {}) }));
  const [errors, setErrors] = useState({});
  const all = { ...sections, [section.key]: values };
  const fieldText = {
    choose: t('biodatas.choose'),
    selectMany: t('biodatas.selectMany'),
    privateNote: t('biodatas.privateField'),
  };
  const message = (code) => VALIDATION_MESSAGES[code]?.[lang] ?? code;

  const save = useMutation({
    mutationFn: (data) => adminApi.editSection(biodataId, section.key, data),
    onSuccess: (result) => {
      queryClient.setQueryData(
        ['biodata', biodataId],
        (prev) =>
          prev && { ...prev, biodata: { ...prev.biodata, ...result.biodata }, completion: result.completion },
      );
      queryClient.invalidateQueries({ queryKey: ['biodatas'] });
      toast.success(t('common.saved'));
      onClose();
    },
    onError: (err) => err.code === 'VALIDATION_ERROR' && setErrors(err.fields ?? {}),
  });

  const submit = (e) => {
    e.preventDefault();
    const { value, errors: found } = validateSection(section.key, values, {
      biodata: sections,
      partial: true,
    });
    setErrors(found);
    if (!Object.keys(found).length) save.mutate(value);
  };

  // Changing a division or district also clears the places that belonged to it.
  const setField = (key, value) => setValues((prev) => setFieldValue(section, prev, key, value));

  return (
    <Modal
      open
      onClose={onClose}
      size="lg"
      title={`${t('biodatas.editSection')} · ${section.title[lang]}`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" form="section-editor" loading={save.isPending}>
            {t('common.save')}
          </Button>
        </>
      }
    >
      <form id="section-editor" noValidate onSubmit={submit} className="flex flex-col gap-5">
        <FormMessage>
          {save.error && save.error.code !== 'VALIDATION_ERROR' && errorMessage(save.error)}
        </FormMessage>
        <div className="grid max-h-[60vh] grid-cols-1 gap-5 overflow-y-auto pr-1 sm:grid-cols-2">
          {section.fields
            .filter((f) => isFieldVisible(f, all))
            .map((f) => (
              <BiodataField
                key={f.key}
                field={f}
                lang={lang}
                text={fieldText}
                value={values[f.key]}
                values={values}
                error={errors[f.key] && message(errors[f.key])}
                onChange={(v) => setField(f.key, v)}
              />
            ))}
        </div>
      </form>
    </Modal>
  );
}

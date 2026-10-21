import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { BIODATA_SECTIONS } from '@/shared';
import { Button, FormMessage, Icon, Modal, SelectInput, TextArea, TextInput } from '@/ui';
import { useErrorMessage } from '../hooks/useErrorMessage.js';
import { adminApi } from '../lib/api.js';
import { useT } from '../providers/PreferencesProvider.jsx';

const MIN_REASON = 5;
const MAX_CORRECTIONS = 60;
const fieldsOf = (sectionKey) => BIODATA_SECTIONS.find((s) => s.key === sectionKey)?.fields ?? [];

/**
 * "Ask for changes": a message for the owner plus, optionally, the exact answers
 * to correct. The owner cannot resubmit until each flagged answer has changed.
 */
export function RejectDialog({ biodataId, biodataNo, onClose, onDone }) {
  const { t, lang } = useT();
  const errorMessage = useErrorMessage();
  const [reason, setReason] = useState('');
  const [rows, setRows] = useState([]);
  const update = (i, patch) => setRows((all) => all.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  const chosen = rows.filter((r) => r.section && r.field);
  const reject = useMutation({
    mutationFn: () =>
      adminApi.rejectBiodata(
        biodataId,
        reason.trim(),
        chosen.length
          ? chosen.map((r) => ({ section: r.section, field: r.field, note: r.note.trim() || undefined }))
          : undefined,
      ),
    onSuccess: onDone,
  });
  const taken = (i) => new Set(rows.filter((_, j) => j !== i).map((r) => `${r.section}.${r.field}`));

  return (
    <Modal
      open
      onClose={onClose}
      size="lg"
      title={t('biodatas.rejectTitle')}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button
            disabled={reason.trim().length < MIN_REASON}
            loading={reject.isPending}
            onClick={() => reject.mutate()}
          >
            {t('biodatas.reject')}
          </Button>
        </>
      }
    >
      <p className="text-muted">{biodataNo}</p>
      <div className="flex max-h-[60vh] flex-col gap-4 overflow-y-auto pr-1">
        <FormMessage>{reject.error && errorMessage(reject.error)}</FormMessage>
        <TextArea
          label={t('biodatas.rejectReason')}
          rows={3}
          required
          maxLength={1000}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        <div className="flex flex-col gap-1">
          <b>{t('biodatas.corrections.title')}</b>
          <p className="text-sm text-muted">{t('biodatas.corrections.hint')}</p>
        </div>
        {rows.map((row, i) => {
          const used = taken(i);
          return (
            <fieldset key={i} className="flex flex-col gap-3 rounded-3xl border border-line p-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <SelectInput
                  label={t('biodatas.corrections.section')}
                  value={row.section}
                  placeholder={t('biodatas.choose')}
                  onChange={(e) => update(i, { section: e.target.value, field: '' })}
                  options={BIODATA_SECTIONS.map((s) => ({ value: s.key, label: s.title[lang] }))}
                />
                <SelectInput
                  label={t('biodatas.corrections.field')}
                  value={row.field}
                  disabled={!row.section}
                  placeholder={t('biodatas.choose')}
                  onChange={(e) => update(i, { field: e.target.value })}
                  options={fieldsOf(row.section)
                    .filter((f) => !used.has(`${row.section}.${f.key}`))
                    .map((f) => ({ value: f.key, label: f.label[lang] }))}
                />
              </div>
              <TextInput
                label={t('biodatas.corrections.note')}
                maxLength={300}
                value={row.note}
                onChange={(e) => update(i, { note: e.target.value })}
              />
              <Button
                size="sm"
                variant="ghost"
                className="self-end text-danger"
                onClick={() => setRows((all) => all.filter((_, j) => j !== i))}
              >
                <Icon name="trash" size={16} /> {t('biodatas.corrections.remove')}
              </Button>
            </fieldset>
          );
        })}
        {rows.length < MAX_CORRECTIONS && (
          <Button
            size="sm"
            variant="outline"
            className="self-start"
            onClick={() => setRows((all) => [...all, { section: '', field: '', note: '' }])}
          >
            <Icon name="plus" size={16} /> {t('biodatas.corrections.add')}
          </Button>
        )}
      </div>
    </Modal>
  );
}

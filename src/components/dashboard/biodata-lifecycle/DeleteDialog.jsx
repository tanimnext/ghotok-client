'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import {
  BIODATA_TYPES,
  DELETE_REASONS,
  DISTRICTS,
  EDUCATION_LEVELS,
  PROFESSIONS,
  optionLabel,
} from '@/shared';
import { Button, Checkbox, FormMessage, Modal, SelectInput, TextArea, TextInput, useToast } from '@/ui';
import { useErrorMessage } from '@/hooks/use-error-message';
import { biodataApi } from '@/lib/api/endpoints';
import { useT } from '@/providers/PreferencesProvider';
import { useBiodataUpdate } from './use-biodata-update.js';

const MARRIED = ['married_via_ghotok', 'married_elsewhere'];
const BIODATA_NO = /^GH-\d{1,10}$/i;
const EMPTY_PARTNER = { name: '', district: '', profession: '', education: '' };
const today = () => new Date().toISOString().slice(0, 10);

/** Drops empty strings so optional fields are left out of the request. */
const compact = (obj) => {
  const out = Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== '' && v !== undefined));
  return Object.keys(out).length ? out : undefined;
};

/** Shows who a partner biodata number belongs to, so members can check they typed it right. */
function PartnerLookup({ biodataNo }) {
  const { t, lang } = useT();
  const no = biodataNo.trim().toUpperCase();
  const lookup = useQuery({
    queryKey: ['partner-lookup', no],
    queryFn: () => biodataApi.partnerLookup(no),
    enabled: BIODATA_NO.test(no),
    retry: false,
  });
  if (!BIODATA_NO.test(no) || lookup.isLoading) return null;
  if (lookup.error) return <FormMessage>{t('lifecycle.partnerNotFound')}</FormMessage>;
  const p = lookup.data?.partner;
  if (!p) return null;
  const facts = [
    optionLabel(BIODATA_TYPES, p.type, lang),
    optionLabel(DISTRICTS, p.district, lang),
    optionLabel(PROFESSIONS, p.profession, lang),
    optionLabel(EDUCATION_LEVELS, p.education, lang),
  ].filter(Boolean);
  return (
    <FormMessage tone="success">
      {p.biodataNo}
      {facts.length > 0 && ` · ${facts.join(' · ')}`}
    </FormMessage>
  );
}

/**
 * Deletes the member's biodata. When they got married, it also collects the
 * marriage details (and, with consent, a story the team may publish).
 */
export function DeleteDialog({ open, onClose }) {
  const { t, lang } = useT();
  const toast = useToast();
  const errorMessage = useErrorMessage();
  const update = useBiodataUpdate();
  const [form, setForm] = useState({ reason: '', note: '' });
  const [marriage, setMarriage] = useState({
    marriedOn: '',
    place: '',
    partnerBiodataNo: '',
    story: '',
    shareStory: false,
  });
  const [partner, setPartner] = useState(EMPTY_PARTNER);
  const married = MARRIED.includes(form.reason);
  const viaGhotok = form.reason === 'married_via_ghotok';
  const badNumber = marriage.partnerBiodataNo.trim() && !BIODATA_NO.test(marriage.partnerBiodataNo.trim());

  const remove = useMutation({
    mutationFn: () =>
      biodataApi.remove({
        reason: form.reason,
        note: form.note.trim() || undefined,
        marriage: married
          ? compact({
              marriedOn: marriage.marriedOn,
              place: marriage.place.trim(),
              partnerBiodataNo: viaGhotok ? marriage.partnerBiodataNo.trim().toUpperCase() : '',
              partner: compact(partner),
              story: marriage.story.trim(),
              shareStory: marriage.shareStory && !!marriage.story.trim() ? true : undefined,
            })
          : undefined,
      }),
    onSuccess: (result) => {
      update(result);
      toast.success(married ? t('lifecycle.congrats') : t('lifecycle.deleted'));
      onClose();
    },
  });

  const setM = (key) => (e) => setMarriage((m) => ({ ...m, [key]: e.target.value }));
  const setP = (key) => (e) => setPartner((p) => ({ ...p, [key]: e.target.value }));
  const choices = (options) => options.map((o) => ({ value: o.value, label: o[lang] }));

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={t('settings.deleteTitle')}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button
            variant="danger"
            disabled={!form.reason || badNumber}
            loading={remove.isPending}
            onClick={() => remove.mutate()}
          >
            {t('settings.deleteConfirm')}
          </Button>
        </>
      }
    >
      <p className="text-muted">{t('settings.deleteText')}</p>
      <FormMessage>{remove.error && errorMessage(remove.error)}</FormMessage>
      <SelectInput
        label={t('settings.deleteReason')}
        required
        placeholder={t('editor.choose')}
        value={form.reason}
        onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
        options={choices(DELETE_REASONS)}
      />

      {married ? (
        <fieldset className="flex flex-col gap-4 rounded-[20px] border border-gold bg-surface2 p-5">
          <legend className="px-2 font-display text-lg font-semibold">{t('lifecycle.marriageTitle')}</legend>
          <p className="text-sm text-muted">{t('lifecycle.marriageText')}</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <TextInput
              type="date"
              label={t('lifecycle.marriedOn')}
              max={today()}
              value={marriage.marriedOn}
              onChange={setM('marriedOn')}
            />
            <TextInput
              label={t('lifecycle.place')}
              maxLength={120}
              value={marriage.place}
              onChange={setM('place')}
            />
          </div>
          {viaGhotok && (
            <div className="flex flex-col gap-2">
              <TextInput
                label={t('lifecycle.partnerNo')}
                placeholder="GH-1024"
                hint={t('lifecycle.partnerNoHint')}
                error={badNumber ? t('lifecycle.partnerNoInvalid') : undefined}
                value={marriage.partnerBiodataNo}
                onChange={setM('partnerBiodataNo')}
              />
              <PartnerLookup biodataNo={marriage.partnerBiodataNo} />
            </div>
          )}
          <p className="text-[13px] font-bold text-muted">{t('lifecycle.partnerDetails')}</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <TextInput
              label={t('lifecycle.partnerName')}
              maxLength={80}
              value={partner.name}
              onChange={setP('name')}
            />
            <SelectInput
              label={t('lifecycle.partnerDistrict')}
              placeholder={t('editor.choose')}
              value={partner.district}
              onChange={setP('district')}
              options={choices(DISTRICTS)}
            />
            <SelectInput
              label={t('lifecycle.partnerProfession')}
              placeholder={t('editor.choose')}
              value={partner.profession}
              onChange={setP('profession')}
              options={choices(PROFESSIONS)}
            />
            <SelectInput
              label={t('lifecycle.partnerEducation')}
              placeholder={t('editor.choose')}
              value={partner.education}
              onChange={setP('education')}
              options={choices(EDUCATION_LEVELS)}
            />
          </div>
          <TextArea
            label={t('lifecycle.story')}
            hint={t('lifecycle.storyHint')}
            rows={4}
            maxLength={2000}
            value={marriage.story}
            onChange={setM('story')}
          />
          <Checkbox
            label={t('lifecycle.shareStory')}
            checked={marriage.shareStory}
            disabled={!marriage.story.trim()}
            onChange={(e) => setMarriage((m) => ({ ...m, shareStory: e.target.checked }))}
          />
        </fieldset>
      ) : (
        form.reason && (
          <TextArea
            label={t('settings.deleteNote')}
            rows={3}
            maxLength={500}
            value={form.note}
            onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
          />
        )
      )}
    </Modal>
  );
}

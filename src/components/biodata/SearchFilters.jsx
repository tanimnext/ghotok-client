'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  BIODATA_TYPES,
  COMPLEXIONS,
  ECONOMIC_STATUS,
  EDUCATION_LEVELS,
  EDUCATION_MEDIUMS,
  HEIGHTS,
  MARITAL_STATUS,
  PROFESSIONS,
  RELIGIONS,
  SPECIAL_CATEGORIES,
} from '@/shared';
import { Button, Checkbox, Icon } from '@/ui';
import { toQueryString } from '@/lib/search-params';
import { LocationPicker } from './LocationPicker';
import { useT } from '@/providers/PreferencesProvider';

const list = (v) => (v ? String(v).split(',').filter(Boolean) : []);

function Group({ legend, children }) {
  return (
    <fieldset className="flex flex-col gap-1">
      <legend className="mb-2 text-[13px] font-bold uppercase tracking-[0.04em] text-muted">{legend}</legend>
      {children}
    </fieldset>
  );
}

/** A collapsible group of filters, open by default. */
function Section({ title, children, open = true }) {
  return (
    <details open={open} className="group border-t border-line pt-4">
      <summary className="flex cursor-pointer list-none items-center justify-between text-[15px] font-extrabold">
        {title}
        <Icon name="chevronRight" size={18} className="transition group-open:rotate-90" />
      </summary>
      <div className="mt-4 flex flex-col gap-5">{children}</div>
    </details>
  );
}

function Select({ label, value, onChange, options, any }) {
  return (
    <label className="flex flex-col gap-2 text-[13px] font-bold uppercase tracking-[0.04em] text-muted">
      {label}
      <select
        className="field-input text-[15px] font-normal normal-case tracking-normal"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">{any}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

/**
 * The filter sidebar. Filters live in the URL; "Show results" navigates to the
 * new URL and the page re-renders on the server.
 */
export function SearchFilters({ initial }) {
  const { t, lang } = useT();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ type: 'bride', ...initial });
  const set = (key, value) => setF((prev) => ({ ...prev, [key]: value }));
  const toggle = (key, value) => {
    const values = new Set(list(f[key]));
    if (values.has(value)) values.delete(value);
    else values.add(value);
    set(key, [...values].join(','));
  };
  const opts = (options) => options.map((o) => ({ value: o.value, label: o[lang] }));
  const checks = (legend, name, options) => (
    <Group legend={legend}>
      {options.map((o) => (
        <Checkbox
          key={o.value}
          label={o[lang]}
          checked={list(f[name]).includes(o.value)}
          onChange={() => toggle(name, o.value)}
        />
      ))}
    </Group>
  );
  // The location counts reflect every other filter currently chosen.
  const { page: _p, presentDivision: _pd, ...countFilters } = f;

  const apply = (e) => {
    e?.preventDefault();
    const { page: _page, presentDivision: _presentDivision, ...rest } = f;
    router.push(`/biodatas${toQueryString(rest)}`);
    setOpen(false);
  };

  const clear = () => {
    setF({ type: f.type });
    router.push(`/biodatas?type=${f.type}`);
  };

  return (
    <div className="w-full lg:w-[290px] lg:flex-none">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex min-h-12 w-full items-center justify-center gap-2 rounded-full border border-line bg-surface font-bold lg:hidden"
      >
        <Icon name="filter" /> {t('browse.showFilters')}
      </button>
      <form
        onSubmit={apply}
        aria-label={t('browse.filters')}
        className={`${open ? 'flex' : 'hidden'} mt-4 flex-col gap-5 rounded-[28px] border border-line bg-surface p-6 lg:mt-0 lg:flex`}
      >
        <div className="flex items-center justify-between">
          <span className="text-lg font-extrabold">{t('browse.filters')}</span>
          <button type="button" onClick={clear} className="p-1.5 text-sm font-bold text-rose-text">
            {t('browse.clear')}
          </button>
        </div>

        <Section title={t('browse.sections.primary')}>
          <Group legend={t('browse.lookingFor')}>
            <div className="grid grid-cols-2 gap-2.5">
              {BIODATA_TYPES.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  aria-pressed={f.type === o.value}
                  onClick={() => set('type', o.value)}
                  className={`min-h-12 rounded-full text-sm font-bold ${f.type === o.value ? 'bg-rose text-on-rose' : 'border-[1.5px] border-line'}`}
                >
                  {o[lang]}
                </button>
              ))}
            </div>
          </Group>

          <label className="flex flex-col gap-2 text-[13px] font-bold uppercase tracking-[0.04em] text-muted">
            {t('browse.biodataNo')}
            <input
              className="field-input text-[15px] font-normal normal-case"
              placeholder={t('browse.biodataNoPh')}
              inputMode="numeric"
              value={f.q ?? ''}
              onChange={(e) => set('q', e.target.value)}
            />
          </label>

          {checks(t('browse.religion'), 'religion', RELIGIONS)}
          {checks(t('browse.marital'), 'marital', MARITAL_STATUS)}

          <Group legend={t('browse.ageRange')}>
            <div className="grid grid-cols-2 gap-2.5">
              {[
                ['ageMin', 'browse.from'],
                ['ageMax', 'browse.to'],
              ].map(([key, label]) => (
                <label key={key} className="flex flex-col gap-1 text-xs text-muted">
                  {t(label)}
                  <input
                    type="number"
                    min="18"
                    max="80"
                    inputMode="numeric"
                    className="field-input"
                    value={f[key] ?? ''}
                    onChange={(e) => set(key, e.target.value)}
                  />
                </label>
              ))}
            </div>
          </Group>
        </Section>

        <Section title={t('browse.sections.address')}>
          <Group legend={t('browse.permanent')}>
            <LocationPicker
              scope="permanent"
              filters={countFilters}
              value={{ division: f.division, district: f.district, upazila: f.upazila }}
              onChange={(v) => setF((p) => ({ ...p, ...v }))}
            />
          </Group>
          <Group legend={t('browse.present')}>
            <LocationPicker
              scope="present"
              filters={countFilters}
              value={{ division: f.presentDivision, district: f.presentDistrict, upazila: f.presentUpazila }}
              onChange={(v) =>
                setF((p) => ({
                  ...p,
                  presentDivision: v.division,
                  presentDistrict: v.district,
                  presentUpazila: v.upazila,
                }))
              }
            />
          </Group>
        </Section>

        <Section title={t('browse.sections.education')} open={false}>
          {checks(t('browse.medium'), 'medium', EDUCATION_MEDIUMS)}
          <Select
            label={t('browse.education')}
            value={f.education}
            any={t('common.any')}
            options={opts(EDUCATION_LEVELS)}
            onChange={(v) => set('education', v)}
          />
        </Section>

        <Section title={t('browse.sections.profession')} open={false}>
          {checks(t('browse.profession'), 'profession', PROFESSIONS)}
        </Section>

        <Section title={t('browse.sections.personal')} open={false}>
          <Group legend={t('browse.height')}>
            <div className="grid grid-cols-2 gap-2.5">
              {[
                ['heightMin', 'browse.from'],
                ['heightMax', 'browse.to'],
              ].map(([key, label]) => (
                <label key={key} className="flex flex-col gap-1 text-xs text-muted">
                  {t(label)}
                  <select
                    className="field-input"
                    value={f[key] ?? ''}
                    onChange={(e) => set(key, e.target.value)}
                  >
                    <option value="">{t('common.any')}</option>
                    {HEIGHTS.map((h) => (
                      <option key={h.value} value={h.value}>
                        {h[lang]}
                      </option>
                    ))}
                  </select>
                </label>
              ))}
            </div>
          </Group>
          {checks(t('browse.complexion'), 'complexion', COMPLEXIONS)}
          {checks(t('browse.economic'), 'economic', ECONOMIC_STATUS)}
        </Section>

        <Section title={t('browse.sections.others')} open={false}>
          {checks(t('browse.categories'), 'category', SPECIAL_CATEGORIES)}
        </Section>

        <Button type="submit" size="lg" block>
          {t('browse.apply')}
        </Button>
      </form>
    </div>
  );
}

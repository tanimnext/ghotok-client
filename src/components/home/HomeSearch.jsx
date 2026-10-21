'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { BIODATA_TYPES, DISTRICTS, RELIGIONS, optionLabel } from '@/shared';
import { digits } from '@/lib/format';
import { useT } from '@/providers/PreferencesProvider';

const AGE_RANGES = [
  [18, 25],
  [22, 32],
  [25, 35],
  [30, 40],
  [35, 50],
];

function Cell({ label, children }) {
  return (
    <label className="flex flex-col gap-1 rounded-[20px] bg-bg px-5 py-3.5 text-xs font-bold uppercase tracking-[0.08em] text-muted">
      {label}
      {children}
    </label>
  );
}

const selectClass =
  'border-0 bg-transparent py-1 text-[17px] font-semibold normal-case tracking-normal text-ink outline-none';

/** The quick search bar under the hero. Sends the visitor to /biodatas with filters. */
export function HomeSearch() {
  const { t, lang } = useT();
  const router = useRouter();
  const [form, setForm] = useState({ type: 'bride', religion: '', age: '1', district: '' });
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    params.set('type', form.type);
    if (form.religion) params.set('religion', form.religion);
    if (form.age !== '') {
      const [min, max] = AGE_RANGES[Number(form.age)];
      params.set('ageMin', String(min));
      params.set('ageMax', String(max));
    }
    if (form.district) params.set('district', form.district);
    router.push(`/biodatas?${params}`);
  };

  return (
    <section className="container-page relative">
      <form
        onSubmit={submit}
        role="search"
        className="grid grid-cols-1 gap-2.5 rounded-[32px] border border-line bg-surface p-3.5 shadow-card sm:grid-cols-2 lg:grid-cols-5"
      >
        <Cell label={t('home.lookingFor')}>
          <select className={selectClass} value={form.type} onChange={set('type')}>
            {BIODATA_TYPES.map((o) => (
              <option key={o.value} value={o.value}>
                {o[lang]}
              </option>
            ))}
          </select>
        </Cell>
        <Cell label={t('home.religion')}>
          <select className={selectClass} value={form.religion} onChange={set('religion')}>
            <option value="">{t('common.all')}</option>
            {RELIGIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o[lang]}
              </option>
            ))}
          </select>
        </Cell>
        <Cell label={t('home.age')}>
          <select className={selectClass} value={form.age} onChange={set('age')}>
            <option value="">{t('common.any')}</option>
            {AGE_RANGES.map(([min, max], i) => (
              <option key={min} value={i}>
                {t('common.yearsLong', { n: `${digits(min, lang)} – ${digits(max, lang)}` })}
              </option>
            ))}
          </select>
        </Cell>
        <Cell label={t('home.district')}>
          <select className={selectClass} value={form.district} onChange={set('district')}>
            <option value="">{t('home.selectDistrict')}</option>
            {DISTRICTS.map((d) => (
              <option key={d.value} value={d.value}>
                {optionLabel(DISTRICTS, d.value, lang)}
              </option>
            ))}
          </select>
        </Cell>
        <button
          type="submit"
          className="min-h-16 rounded-[20px] bg-rose px-7 text-[17px] font-bold text-on-rose hover:brightness-110"
        >
          {t('common.search')}
        </button>
      </form>
    </section>
  );
}

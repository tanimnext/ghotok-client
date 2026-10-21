'use client';

import { DISTRICTS, districtsOf, upazilasOf } from '@/shared';
import { Field } from './Field.jsx';

const DEFAULT_TEXT = { choose: 'Choose…', selectMany: 'Select all that apply', privateNote: 'Private' };

const latestBirthDate = () => {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 18);
  return d.toISOString().slice(0, 10);
};

/**
 * One biodata form field, rendered from its shared definition (shared/src/biodata.js).
 * Used by the member's biodata editor and by staff in the admin panel.
 * @param {object} props
 * @param {object} props.field the field definition
 * @param {object} props.values the section's current values (district fields depend on the division)
 * @param {'en' | 'bn'} props.lang
 * @param {{ choose: string, selectMany: string, privateNote: string }} [props.text] interface strings in `lang`
 */
export function BiodataField({ field, value, values, error, onChange, lang = 'en', text = DEFAULT_TEXT }) {
  const label = field.label[lang];
  const hint =
    [field.help?.[lang], field.private ? text.privateNote : null].filter(Boolean).join(' · ') || undefined;

  if (field.type === 'multiselect') {
    const selected = new Set(Array.isArray(value) ? value : []);
    const toggle = (v) => {
      const next = new Set(selected);
      if (next.has(v)) next.delete(v);
      else next.add(v);
      onChange([...next]);
    };
    return (
      <fieldset className="flex flex-col gap-2 sm:col-span-2">
        <legend className="mb-1 text-[13px] font-bold text-muted">
          {label} <span className="font-normal">({text.selectMany})</span>
        </legend>
        <div className="flex flex-wrap gap-2">
          {field.options.map((o) => {
            const on = selected.has(o.value);
            return (
              <button
                key={o.value}
                type="button"
                aria-pressed={on}
                onClick={() => toggle(o.value)}
                className={`min-h-11 rounded-full px-4 text-sm font-semibold ${on ? 'bg-rose text-on-rose' : 'border border-line bg-bg hover:border-gold'}`}
              >
                {o[lang]}
              </button>
            );
          })}
        </div>
        {error && <span className="text-[13px] font-semibold text-danger">{error}</span>}
      </fieldset>
    );
  }

  const wide = field.type === 'textarea';
  return (
    <Field
      label={label}
      hint={hint}
      error={error}
      required={field.required}
      className={wide ? 'sm:col-span-2' : ''}
    >
      {(a11y) => {
        const common = {
          ...a11y,
          className: 'field-input',
          value: value ?? '',
          onChange: (e) => onChange(e.target.value),
        };
        switch (field.type) {
          case 'select':
            return (
              <select {...common}>
                <option value="">{text.choose}</option>
                {field.options.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o[lang]}
                  </option>
                ))}
              </select>
            );
          case 'district': {
            const options = field.divisionField ? districtsOf(values?.[field.divisionField]) : DISTRICTS;
            return (
              <select {...common}>
                <option value="">{text.choose}</option>
                {options.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d[lang]}
                  </option>
                ))}
              </select>
            );
          }
          case 'upazila': {
            // Choose the district first; the list then shows its upazilas and city corporations.
            const options = upazilasOf(values?.[field.districtField]);
            return (
              <select {...common} disabled={!options.length}>
                <option value="">{text.choose}</option>
                {options.map((u) => (
                  <option key={u.value} value={u.value}>
                    {u[lang]}
                  </option>
                ))}
              </select>
            );
          }
          case 'textarea':
            return <textarea {...common} rows={4} maxLength={field.maxLength} />;
          case 'number':
            return <input {...common} type="number" inputMode="numeric" min={field.min} max={field.max} />;
          case 'date':
            return <input {...common} type="date" max={latestBirthDate()} />;
          case 'phone':
            return <input {...common} type="tel" inputMode="tel" placeholder="01XXXXXXXXX" />;
          case 'email':
            return <input {...common} type="email" autoComplete="email" />;
          default:
            return <input {...common} type="text" maxLength={field.maxLength} />;
        }
      }}
    </Field>
  );
}

'use client';

import { useId } from 'react';

/**
 * A labelled form control with optional hint and error text, wired up for
 * screen readers (aria-describedby / aria-invalid).
 * `children` is a render function receiving the input props.
 */
export function Field({ label, hint, error, required, className = '', children }) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label htmlFor={id} className="text-[13px] font-bold text-muted">
        {label}
        {required && <span className="text-rose-text"> *</span>}
      </label>
      {children({
        id,
        'aria-invalid': error ? true : undefined,
        'aria-describedby': [hintId, errorId].filter(Boolean).join(' ') || undefined,
      })}
      {hint && (
        <span id={hintId} className="text-[13px] text-muted">
          {hint}
        </span>
      )}
      {error && (
        <span id={errorId} className="text-[13px] font-semibold text-danger">
          {error}
        </span>
      )}
    </div>
  );
}

export function TextInput({ label, hint, error, required, className, ...input }) {
  return (
    <Field label={label} hint={hint} error={error} required={required} className={className}>
      {(a11y) => <input className="field-input" required={required} {...a11y} {...input} />}
    </Field>
  );
}

export function TextArea({ label, hint, error, required, className, rows = 4, ...input }) {
  return (
    <Field label={label} hint={hint} error={error} required={required} className={className}>
      {(a11y) => <textarea className="field-input" rows={rows} required={required} {...a11y} {...input} />}
    </Field>
  );
}

/**
 * @param {{ options: Array<{ value: string|number, label: string }>, placeholder?: string }} props
 */
export function SelectInput({ label, hint, error, required, className, options, placeholder, ...input }) {
  return (
    <Field label={label} hint={hint} error={error} required={required} className={className}>
      {(a11y) => (
        <select className="field-input" required={required} {...a11y} {...input}>
          {placeholder !== undefined && <option value="">{placeholder}</option>}
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      )}
    </Field>
  );
}

export function Checkbox({ label, className = '', ...input }) {
  return (
    <label className={`flex min-h-11 cursor-pointer items-center gap-3 text-[15px] ${className}`}>
      <input type="checkbox" className="size-[18px] accent-[var(--rose)]" {...input} />
      <span>{label}</span>
    </label>
  );
}

/** A small alert box for form-level messages. */
export function FormMessage({ tone = 'danger', children }) {
  if (!children) return null;
  const styles =
    tone === 'danger'
      ? 'bg-danger-bg text-danger'
      : tone === 'info'
        ? 'bg-surface2 text-ink'
        : 'bg-sage-bg text-sage';
  return (
    <div
      role={tone === 'danger' ? 'alert' : 'status'}
      className={`rounded-2xl px-4 py-3 text-sm font-semibold ${styles}`}
    >
      {children}
    </div>
  );
}

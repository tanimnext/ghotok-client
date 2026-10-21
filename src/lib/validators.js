import { isValidEmail, isValidPhone } from '@/shared';

// Client-side checks that mirror the API's rules, so members see translated
// messages before a request is made. The API remains the source of truth.
// Each returns a `validation.*` dictionary key, or null when valid.

export const validators = {
  required: (v) => (String(v ?? '').trim() ? null : 'validation.required'),
  name: (v) => (String(v ?? '').trim().length >= 2 ? null : 'validation.name'),
  identifier: (v) => (isValidEmail(v) || isValidPhone(v) ? null : 'validation.identifier'),
  email: (v) => (isValidEmail(v) ? null : 'validation.email'),
  optionalEmail: (v) => (!v || isValidEmail(v) ? null : 'validation.email'),
  optionalPhone: (v) => (!v || isValidPhone(v) ? null : 'validation.phone'),
  password: (v) => (String(v ?? '').length >= 8 ? null : 'validation.password'),
  code: (v) => (/^\d{6}$/.test(String(v ?? '').trim()) ? null : 'validation.code'),
  message: (v) => (String(v ?? '').trim().length >= 10 ? null : 'validation.message'),
};

/**
 * Runs a map of `{ field: validatorName }` against values.
 * @returns {Record<string, string>} field → dictionary key
 */
export function validate(values, rules) {
  const errors = {};
  for (const [field, rule] of Object.entries(rules)) {
    const key = validators[rule](values[field]);
    if (key) errors[field] = key;
  }
  return errors;
}

/** Only allows redirects to paths on this site (prevents open redirects via ?next=). */
export function safeNext(next, fallback = '/dashboard') {
  return typeof next === 'string' && next.startsWith('/') && !next.startsWith('//') ? next : fallback;
}

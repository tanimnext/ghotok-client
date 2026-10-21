const lookup = (dict, key) => key.split('.').reduce((node, part) => node?.[part], dict);

/**
 * Builds `t(key, vars)` over a dictionary of nested strings. Missing keys fall
 * back to `fallback` (usually English), then to the key itself; `{name}`
 * placeholders are filled from `vars`. Non-string values (arrays, objects) are
 * returned as they are.
 */
export function createTranslator(dict, fallback = dict) {
  return function t(key, vars) {
    const value = lookup(dict, key) ?? lookup(fallback, key) ?? key;
    if (typeof value !== 'string' || !vars) return value;
    return value.replace(/\{(\w+)\}/g, (_, name) => (vars[name] ?? '').toString());
  };
}

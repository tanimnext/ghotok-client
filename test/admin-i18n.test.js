import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import bn from '../src/admin/lib/i18n/bn.js';
import en from '../src/admin/lib/i18n/en.js';
import { createTranslator } from '../src/admin/lib/i18n/index.js';

/** Every key path in a dictionary, e.g. "nav.groups.work". */
function keyPaths(node, prefix = '') {
  if (node === null || typeof node !== 'object') return [prefix];
  return Object.entries(node).flatMap(([k, v]) => keyPaths(v, prefix ? `${prefix}.${k}` : k));
}

const lookup = (dict, path) => path.split('.').reduce((n, k) => n?.[k], dict);
const placeholders = (s) =>
  typeof s === 'string' ? [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort() : [];

function sourceFiles(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return /\.jsx?$/.test(name) ? [path] : [];
  });
}

describe('dictionaries', () => {
  it('English and Bangla have exactly the same keys', () => {
    expect(keyPaths(bn).sort()).toEqual(keyPaths(en).sort());
  });

  it('use the same {placeholders} in both languages', () => {
    for (const path of keyPaths(en))
      expect(placeholders(lookup(bn, path)), path).toEqual(placeholders(lookup(en, path)));
  });

  it('has no empty strings', () => {
    for (const dict of [en, bn]) {
      for (const path of keyPaths(dict))
        expect(String(lookup(dict, path)).trim().length, path).toBeGreaterThan(0);
    }
  });

  it('defines every key the admin dashboard uses', () => {
    const src = join(import.meta.dirname, '../src/admin');
    for (const file of sourceFiles(src)) {
      const code = readFileSync(file, 'utf8');
      // t('a.b') and the fixed prefix of t(`a.b.${x}`).
      for (const [, key] of code.matchAll(/\bt\(\s*'([\w.]+)'/g))
        expect(lookup(en, key), `${key} in ${file}`).toBeDefined();
      for (const [, prefix] of code.matchAll(/\bt\(\s*`([\w.]+)\.\$\{/g))
        expect(lookup(en, prefix), `${prefix}.* in ${file}`).toBeTypeOf('object');
    }
  });
});

describe('createTranslator', () => {
  it('fills placeholders and falls back to English, then to the key', () => {
    expect(createTranslator('en')('common.connections', { n: 3 })).toBe('3 connections');
    expect(createTranslator('bn')('nav.overview')).toBe(bn.nav.overview);
    expect(createTranslator('xx')('nav.overview')).toBe('Overview');
    expect(createTranslator('en')('does.not.exist')).toBe('does.not.exist');
  });
});

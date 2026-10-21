import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import bn from '../src/lib/i18n/bn.js';
import en from '../src/lib/i18n/en.js';
import { createTranslator } from '../src/lib/i18n/index.js';

/** Every key path in a dictionary, e.g. "home.steps.0.t". */
function keyPaths(node, prefix = '') {
  if (node === null || typeof node !== 'object') return [prefix];
  return Object.entries(node).flatMap(([k, v]) => keyPaths(v, prefix ? `${prefix}.${k}` : k));
}

const placeholders = (s) =>
  typeof s === 'string' ? [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort() : [];

describe('dictionaries', () => {
  it('English and Bangla have exactly the same keys', () => {
    expect(keyPaths(bn).sort()).toEqual(keyPaths(en).sort());
  });

  it('use the same {placeholders} in both languages', () => {
    for (const path of keyPaths(en)) {
      const get = (d) => path.split('.').reduce((n, k) => n?.[k], d);
      expect(placeholders(get(bn)), path).toEqual(placeholders(get(en)));
    }
  });

  it('has no empty strings', () => {
    for (const dict of [en, bn]) {
      for (const path of keyPaths(dict)) {
        const value = path.split('.').reduce((n, k) => n?.[k], dict);
        expect(String(value).trim().length, path).toBeGreaterThan(0);
      }
    }
  });
});

// The admin dashboard (src/admin) has its own dictionaries, checked in admin-i18n.test.js.
function sourceFiles(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return path.endsWith(join('src', 'admin')) ? [] : sourceFiles(path);
    return /\.jsx?$/.test(name) ? [path] : [];
  });
}

describe('dictionary coverage', () => {
  it('defines every key the website uses', () => {
    const lookup = (path) => path.split('.').reduce((n, k) => n?.[k], en);
    for (const file of sourceFiles(join(import.meta.dirname, '../src'))) {
      const code = readFileSync(file, 'utf8');
      for (const [, key] of code.matchAll(/\bt\(\s*'([\w.]+)'/g))
        expect(lookup(key), `${key} in ${file}`).toBeDefined();
      for (const [, prefix] of code.matchAll(/\bt\(\s*`([\w.]+)\.\$\{/g))
        expect(lookup(prefix), `${prefix}.* in ${file}`).toBeTypeOf('object');
    }
  });
});

describe('createTranslator', () => {
  it('fills placeholders and falls back to the key', () => {
    const t = createTranslator('en');
    expect(t('common.connections', { n: 5 })).toBe('5 connections');
    expect(t('does.not.exist')).toBe('does.not.exist');
    expect(createTranslator('bn')('nav.home')).toBe('হোম');
  });
});

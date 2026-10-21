// ESLint flat config.
import js from '@eslint/js';
import nextPlugin from '@next/eslint-plugin-next';
import prettier from 'eslint-config-prettier';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';

export default [
  { ignores: ['**/node_modules/**', '.next/**', 'coverage/**', 'next-env.d.ts'] },
  js.configs.recommended,
  {
    files: ['**/*.{js,mjs,jsx}'],
    languageOptions: { ecmaVersion: 'latest', sourceType: 'module' },
    rules: {
      'no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', ignoreRestSiblings: true },
      ],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      eqeqeq: ['error', 'smart'],
      'prefer-const': 'error',
      'no-var': 'error',
      'object-shorthand': 'error',
      'no-param-reassign': ['error', { props: false }],
    },
  },
  // Config files and tests run in Node.js.
  {
    files: ['*.config.{js,mjs}', 'test/**/*.js'],
    languageOptions: { globals: { ...globals.node } },
  },
  // The app: React (Next.js website, member dashboard and the admin dashboard under src/admin).
  {
    files: ['src/**/*.{js,jsx}'],
    plugins: { react, 'react-hooks': reactHooks, '@next/next': nextPlugin },
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    settings: { react: { version: 'detect' } },
    rules: {
      ...react.configs.recommended.rules,
      ...react.configs['jsx-runtime'].rules,
      'react/prop-types': 'off',
      'react/no-unescaped-entities': 'off',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs['core-web-vitals'].rules,
    },
  },
  // The admin dashboard is a client-only React Router app inside Next.js: its links
  // are router links and its images are user content, so the Next.js-specific rules
  // do not apply there.
  {
    files: ['src/admin/**/*.{js,jsx}'],
    rules: { '@next/next/no-img-element': 'off', '@next/next/no-html-link-for-pages': 'off' },
  },
  prettier,
];

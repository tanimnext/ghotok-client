import path from 'node:path';
import { defineConfig } from 'vitest/config';

// Unit tests for the website's pure logic (dictionaries, Markdown, validators).
export default defineConfig({
  resolve: { alias: { '@': path.resolve(import.meta.dirname, 'src') } },
  test: { environment: 'node', include: ['test/**/*.test.js'] },
});

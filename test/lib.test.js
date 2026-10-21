import { describe, expect, it } from 'vitest';
import { renderMarkdown } from '../src/lib/markdown.js';
import { safeNext, validate } from '../src/lib/validators.js';

describe('renderMarkdown', () => {
  it('renders headings, lists, emphasis and links', () => {
    const html = renderMarkdown(
      '## Title\n\nSome **bold** and _soft_ text.\n\n- one\n- two\n\n1. first\n\n[Guide](/guide)',
    );
    expect(html).toContain('<h2>Title</h2>');
    expect(html).toContain('<strong>bold</strong>');
    expect(html).toContain('<em>soft</em>');
    expect(html).toContain('<ul><li>one</li><li>two</li></ul>');
    expect(html).toContain('<ol><li>first</li></ol>');
    expect(html).toContain('<a href="/guide">Guide</a>');
  });

  it('escapes HTML and refuses javascript: links', () => {
    const html = renderMarkdown('<script>alert(1)</script> [x](javascript:alert(1))');
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
    expect(html).not.toContain('href="javascript');
  });

  it('understands Bangla numbered lists', () => {
    expect(renderMarkdown('১. প্রথম\n২. দ্বিতীয়')).toBe('<ol><li>প্রথম</li><li>দ্বিতীয়</li></ol>');
  });
});

describe('validators', () => {
  it('reports dictionary keys for invalid fields', () => {
    expect(
      validate({ identifier: 'nope', password: 'short' }, { identifier: 'identifier', password: 'password' }),
    ).toEqual({
      identifier: 'validation.identifier',
      password: 'validation.password',
    });
    expect(validate({ identifier: '01712345678' }, { identifier: 'identifier' })).toEqual({});
  });

  it('only allows same-site redirects', () => {
    expect(safeNext('/dashboard/biodata')).toBe('/dashboard/biodata');
    expect(safeNext('//evil.example')).toBe('/dashboard');
    expect(safeNext('https://evil.example')).toBe('/dashboard');
    expect(safeNext(undefined, '/')).toBe('/');
  });
});

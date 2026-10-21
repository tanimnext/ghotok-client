'use client';

import { useUiLink } from './UiProvider.jsx';

function pagesAround(page, pages) {
  const set = new Set([1, pages, page - 1, page, page + 1].filter((p) => p >= 1 && p <= pages));
  return [...set].sort((a, b) => a - b);
}

const base = 'flex min-h-11 min-w-11 items-center justify-center rounded-full px-4 text-[15px] font-bold';

/**
 * Page links. Pass `hrefFor(page)` for server-rendered pages (links) or
 * `onPage(page)` for client lists (buttons).
 */
export function Pagination({
  page,
  pages,
  hrefFor,
  onPage,
  labels = { previous: 'Previous', next: 'Next' },
}) {
  const Link = useUiLink();
  if (!pages || pages <= 1) return null;
  const item = (p, label, { current = false, disabled = false } = {}) => {
    const cls = `${base} ${current ? 'bg-rose text-on-rose' : 'border border-line bg-surface hover:border-gold'} ${disabled ? 'pointer-events-none opacity-40' : ''}`;
    if (current) {
      return (
        <span key={label} aria-current="page" className={cls}>
          {label}
        </span>
      );
    }
    if (hrefFor) {
      return (
        <Link key={label} href={hrefFor(p)} className={cls} aria-disabled={disabled || undefined}>
          {label}
        </Link>
      );
    }
    return (
      <button key={label} type="button" className={cls} disabled={disabled} onClick={() => onPage(p)}>
        {label}
      </button>
    );
  };
  return (
    <nav aria-label="Pagination" className="flex flex-wrap items-center justify-center gap-2 pt-4">
      {item(page - 1, labels.previous, { disabled: page <= 1 })}
      {pagesAround(page, pages).map((p) => item(p, String(p), { current: p === page }))}
      {item(page + 1, labels.next, { disabled: page >= pages })}
    </nav>
  );
}

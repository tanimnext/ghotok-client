'use client';

/**
 * A segmented tab strip for switching a list's filter.
 * @param {{ value: string, onChange: (v: string) => void, items: Array<{ value: string, label: string, count?: number }>, label?: string }} props
 */
export function Tabs({ value, onChange, items, label }) {
  return (
    <div
      role="tablist"
      aria-label={label}
      className="flex w-fit max-w-full gap-1 overflow-x-auto rounded-full border border-line bg-surface p-1"
    >
      {items.map((item) => (
        <button
          key={item.value}
          role="tab"
          type="button"
          aria-selected={value === item.value}
          onClick={() => onChange(item.value)}
          className={`flex min-h-10 items-center gap-2 whitespace-nowrap rounded-full px-5 text-sm font-bold ${
            value === item.value ? 'bg-rose text-on-rose' : 'text-muted hover:text-ink'
          }`}
        >
          {item.label}
          {item.count > 0 && (
            <span
              className={`rounded-full px-2 py-0.5 text-[11px] ${value === item.value ? 'bg-white/25' : 'bg-surface2 text-rose-text'}`}
            >
              {item.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

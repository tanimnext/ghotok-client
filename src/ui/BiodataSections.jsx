import { BIODATA_SECTIONS, formatFieldValue, isFieldVisible } from '@/shared';

/**
 * Renders biodata sections as label/value grids (read only). Private sections and
 * fields are skipped unless `includePrivate` is set (staff review, owner preview).
 * `renderAction(section)` can add a control to each section header (e.g. "Edit").
 */
export function BiodataSections({ sections, lang, includePrivate = false, renderAction, privateLabel }) {
  return BIODATA_SECTIONS.filter((s) => includePrivate || !s.private).map((section) => {
    const values = sections?.[section.key] ?? {};
    const rows = section.fields
      .filter((f) => (includePrivate || !f.private) && isFieldVisible(f, sections))
      .map((f) => ({ key: f.key, label: f.label[lang], value: formatFieldValue(f, values[f.key], lang) }))
      .filter((r) => r.value !== '');
    if (!rows.length && !renderAction) return null;
    return (
      <section
        key={section.key}
        className="flex flex-col gap-5 rounded-[28px] border border-line bg-surface p-6 sm:p-8"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-[22px] font-semibold">
            {section.title[lang]}
            {includePrivate && section.private && privateLabel && (
              <span className="ml-3 align-middle text-xs font-bold text-warn">{privateLabel}</span>
            )}
          </h2>
          {renderAction?.(section)}
        </div>
        <dl className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
          {rows.map((r) => (
            <div key={r.key} className="flex flex-col gap-1 border-b border-line pb-3">
              <dt className="text-[13px] font-semibold text-muted">{r.label}</dt>
              <dd className="whitespace-pre-line text-base font-semibold">{r.value}</dd>
            </div>
          ))}
        </dl>
      </section>
    );
  });
}

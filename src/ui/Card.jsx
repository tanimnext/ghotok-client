/** The rounded surface panel used across the site. */
export function Card({ as: Tag = 'section', title, action, className = '', children, ...rest }) {
  return (
    <Tag
      className={`flex flex-col gap-5 rounded-[28px] border border-line bg-surface p-6 sm:p-7 ${className}`}
      {...rest}
    >
      {(title || action) && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          {title && <h2 className="font-display text-2xl font-semibold leading-title">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </Tag>
  );
}

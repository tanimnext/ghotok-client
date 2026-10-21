import { Icon } from './Icon.jsx';

export function EmptyState({ icon = 'inbox', title, children, action }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-[28px] border border-dashed border-line px-6 py-12 text-center">
      <span className="flex size-14 items-center justify-center rounded-full bg-surface2 text-rose-text">
        <Icon name={icon} size={26} />
      </span>
      {title && <p className="font-display text-xl font-semibold">{title}</p>}
      {children && <p className="max-w-md text-[15px] leading-relaxed text-muted">{children}</p>}
      {action}
    </div>
  );
}

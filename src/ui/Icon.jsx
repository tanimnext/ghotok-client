import { createElement } from 'react';
import { ICONS } from '@/shared';

/**
 * A stroke icon from the shared Ghotok icon set.
 * Decorative by default; pass `title` to make it meaningful to screen readers.
 * @param {{ name: keyof typeof ICONS, size?: number, className?: string, title?: string, strokeWidth?: number }} props
 */
export function Icon({ name, size = 20, className, title, strokeWidth = 2 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      {(ICONS[name] ?? []).map(([tag, attrs], i) => createElement(tag, { key: i, ...attrs }))}
    </svg>
  );
}

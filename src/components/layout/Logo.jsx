import Link from 'next/link';

/** Two interlocking rings in gold and rose, from the Ghotok design. */
export function LogoMark({ size = 38, gold = 'var(--gold)', rose = 'var(--rose)' }) {
  return (
    <svg width={size} height={(size * 30) / 38} viewBox="0 0 38 30" fill="none" aria-hidden="true">
      <circle cx="13" cy="15" r="10" stroke={gold} strokeWidth="2.4" />
      <circle cx="25" cy="15" r="10" stroke={rose} strokeWidth="2.4" />
    </svg>
  );
}

export function Logo({ href = '/', compact = false }) {
  return (
    <Link href={href} className="flex items-center gap-3" aria-label="Ghotok home">
      <LogoMark size={compact ? 34 : 38} />
      <span className="font-display text-[24px] font-semibold tracking-[-0.01em] sm:text-[26px]">Ghotok</span>
      <span className="font-display text-[15px] text-muted sm:text-[17px]">ঘটক</span>
    </Link>
  );
}

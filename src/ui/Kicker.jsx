/** The gold-ruled eyebrow above section titles. */
export function Kicker({ children, className = '' }) {
  return <div className={`kicker ${className}`}>{children}</div>;
}

/** A section heading in the display face. */
export function Heading({ as: Tag = 'h2', children, className = '' }) {
  return (
    <Tag
      className={`font-display text-[clamp(32px,4.4vw,52px)] font-medium leading-title tracking-[-0.015em] ${className}`}
    >
      {children}
    </Tag>
  );
}

export function Spinner({ size = 20, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={`animate-spin ${className}`}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path d="M21 12a9 9 0 00-9-9" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

/** A centred loading state for a page or panel. */
export function LoadingBlock({ label }) {
  return (
    <div role="status" className="flex min-h-40 items-center justify-center gap-3 text-muted">
      <Spinner />
      <span>{label}</span>
    </div>
  );
}

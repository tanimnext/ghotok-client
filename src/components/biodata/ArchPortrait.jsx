/**
 * The arched portrait frame from the design, with a calm silhouette. Ghotok shows
 * no photos of members; the frame keeps the cards recognisable.
 */
export function ArchPortrait({ className = 'h-[200px]', children }) {
  return (
    <div
      className={`relative flex items-end justify-center overflow-hidden rounded-t-full rounded-b-[18px] border border-gold bg-surface2 ${className}`}
    >
      <svg
        width="140"
        height="150"
        viewBox="0 0 140 150"
        fill="none"
        aria-hidden="true"
        className="max-h-[75%]"
      >
        <circle cx="70" cy="62" r="30" fill="var(--bg)" stroke="var(--gold)" strokeWidth="1.5" />
        <path
          d="M12 150c3-44 30-62 58-62s55 18 58 62z"
          fill="var(--bg)"
          stroke="var(--gold)"
          strokeWidth="1.5"
        />
      </svg>
      {children}
    </div>
  );
}

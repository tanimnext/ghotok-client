const TONES = {
  rose: 'bg-surface2 text-rose-text',
  sage: 'bg-sage-bg text-sage',
  warn: 'bg-warn-bg text-warn',
  danger: 'bg-danger-bg text-danger',
  muted: 'bg-surface2 text-muted',
  gold: 'border border-gold text-gold-text',
};

export function Pill({ tone = 'rose', children, className = '' }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-bold ${TONES[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

/** Colour of each status value used by the API. */
export const STATUS_TONE = {
  approved: 'sage',
  verified: 'sage',
  accepted: 'sage',
  resolved: 'sage',
  answered: 'sage',
  pending: 'warn',
  waiting: 'warn',
  open: 'warn',
  in_review: 'warn',
  initiated: 'warn',
  draft: 'muted',
  closed: 'muted',
  withdrawn: 'muted',
  cancelled: 'muted',
  not_submitted: 'muted',
  rejected: 'danger',
  declined: 'danger',
  failed: 'danger',
  dismissed: 'muted',
  refunded: 'rose',
  active: 'sage',
  suspended: 'warn',
  banned: 'danger',
  deactivated: 'muted',
};

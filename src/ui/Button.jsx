'use client';

import { Spinner } from './Spinner.jsx';
import { useUiLink } from './UiProvider.jsx';

const VARIANTS = {
  primary: 'bg-rose text-on-rose hover:brightness-110',
  outline: 'border-[1.5px] border-gold text-ink hover:bg-surface2',
  outlineRose: 'border-[1.5px] border-rose-text text-rose-text hover:bg-surface2',
  ghost: 'text-ink hover:bg-surface2',
  gold: 'bg-panel-gold text-[#3B1624] hover:brightness-105',
  danger: 'bg-danger text-white hover:brightness-110',
};

const SIZES = {
  sm: 'min-h-10 px-4 text-[13px]',
  md: 'min-h-12 px-6 text-[15px]',
  lg: 'min-h-14 px-8 text-base',
};

/**
 * The single button style of Ghotok. Renders the app's link component (see UiProvider)
 * when `href` is given.
 * @param {{ variant?: keyof typeof VARIANTS, size?: keyof typeof SIZES, loading?: boolean, block?: boolean, href?: string }} props
 */
export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  block = false,
  href,
  className = '',
  children,
  disabled,
  ...rest
}) {
  const Link = useUiLink();
  const classes = `inline-flex items-center justify-center gap-2 rounded-full font-bold transition disabled:cursor-not-allowed disabled:opacity-60 ${
    VARIANTS[variant]
  } ${SIZES[size]} ${block ? 'w-full' : ''} ${className}`;

  if (href) {
    return (
      <Link href={href} className={classes} {...rest}>
        {children}
      </Link>
    );
  }
  return (
    <button
      type="button"
      className={classes}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading && <Spinner size={16} />}
      {children}
    </button>
  );
}

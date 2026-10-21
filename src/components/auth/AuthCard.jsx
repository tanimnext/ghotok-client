import { LogoMark } from '@/components/layout/Logo';

/** The centred card used by every sign-in page. */
export function AuthCard({ title, subtitle, children, footer }) {
  return (
    <div className="container-page flex justify-center py-12 sm:py-20">
      <div className="flex w-full max-w-[460px] flex-col gap-6 rounded-[32px] border border-line bg-surface p-7 shadow-card sm:p-10">
        <div className="flex flex-col items-center gap-3 text-center">
          <LogoMark size={52} />
          <h1 className="font-display text-[32px] font-medium leading-title">{title}</h1>
          {subtitle && <p className="text-[15px] leading-relaxed text-muted">{subtitle}</p>}
        </div>
        {children}
        {footer && <div className="border-t border-line pt-5 text-center text-sm text-muted">{footer}</div>}
      </div>
    </div>
  );
}

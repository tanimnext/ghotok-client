'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useState } from 'react';
import { Button, Card, FormMessage, Icon } from '@/ui';
import { TutorialLink } from '@/components/content/TutorialLink';
import { useAuth } from '@/hooks/use-auth';
import { useErrorMessage } from '@/hooks/use-error-message';
import { billingApi } from '@/lib/api/endpoints';
import { digits, number, taka } from '@/lib/format';
import { useT } from '@/providers/PreferencesProvider';

function Choice({ checked, onChange, name, children, disabled }) {
  return (
    <label
      className={`flex cursor-pointer flex-col gap-2 rounded-[20px] p-5 transition ${
        checked ? 'border-[2.5px] border-rose bg-surface2' : 'border-[1.5px] border-line hover:border-gold'
      } ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
    >
      <input
        type="radio"
        name={name}
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className="sr-only"
      />
      {children}
    </label>
  );
}

/** A package price, with the original struck through when the member has a discount. */
function Price({ pkg, lang, className = '' }) {
  if (!pkg.finalPrice || pkg.finalPrice === pkg.price)
    return <span className={className}>{taka(pkg.price, lang)}</span>;
  return (
    <span className={`flex flex-wrap items-baseline gap-x-3 ${className}`}>
      <span>{taka(pkg.finalPrice, lang)}</span>
      <s className="text-[0.5em] text-muted">{taka(pkg.price, lang)}</s>
    </span>
  );
}

/**
 * Buying a connection package: choose a package, then pay on SSLCommerz's page (card, bKash,
 * Nagad, Rocket or internet banking). SSLCommerz sends the member back to the receipt page,
 * and the connections are added as soon as the payment is confirmed.
 * @param {{ catalogue: object, checkoutEnabled: boolean, initialPackageId?: string, settings?: { payments?: object, site?: object } }} props
 */
export function Checkout({ catalogue: publicCatalogue, checkoutEnabled, initialPackageId, settings = {} }) {
  const { t, lang } = useT();
  const { user, isLoading } = useAuth();
  const errorMessage = useErrorMessage();
  // The server renders the guest catalogue; a signed-in member's prices may include a discount.
  const mine = useQuery({
    queryKey: ['catalogue', user?.id],
    queryFn: billingApi.catalogue,
    enabled: !!user,
    staleTime: 60_000,
  });
  const catalogue = (user && mine.data) || publicCatalogue;
  const { packages } = catalogue;
  const { approvalGift = 0, approvedDiscountPercent = 0 } = settings.payments ?? {};

  const defaultPackage =
    packages.find((p) => p.id === initialPackageId) ?? packages.find((p) => p.highlight) ?? packages[0];
  const [packageId, setPackageId] = useState(defaultPackage?.id);

  const pkg = packages.find((p) => p.id === packageId);
  const price = pkg?.finalPrice ?? pkg?.price;

  const pay = useMutation({
    mutationFn: () => billingApi.createPayment({ packageId }),
    // Off to SSLCommerz; the member comes back to /dashboard/payment/<invoice>.
    onSuccess: (result) => window.location.assign(result.redirectURL),
  });

  if (!pkg) return null;

  return (
    <div className="flex flex-col items-start gap-7 lg:flex-row">
      <div className="flex w-full min-w-0 flex-1 flex-col gap-5">
        <Card title={t('packages.step1')}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {packages.map((p) => (
              <Choice
                key={p.id}
                name="package"
                checked={p.id === packageId}
                onChange={() => setPackageId(p.id)}
              >
                <span className="flex items-center justify-between gap-2">
                  <span
                    className={`text-[15px] font-bold ${p.id === packageId ? 'text-rose-text' : 'text-muted'}`}
                  >
                    {p.name[lang] || p.name.en}
                  </span>
                  {p.highlight && (
                    <span className="rounded-full bg-panel-gold px-2.5 py-1 text-[11px] font-bold text-[#3B1624]">
                      {t('packages.popular')}
                    </span>
                  )}
                </span>
                <Price pkg={p} lang={lang} className="font-display text-[40px] font-medium leading-none" />
                {p.discountPercent > 0 && (
                  <span className="w-fit rounded-full bg-sage-bg px-2.5 py-1 text-xs font-bold text-sage">
                    {t('packages.discount', { n: digits(p.discountPercent, lang) })}
                  </span>
                )}
                <span className="text-base font-semibold">
                  {t('common.connections', { n: digits(p.connections, lang) })}
                </span>
                <span className="text-sm text-muted">
                  {t('packages.perConnection', { n: number(p.perConnection, lang) })}
                </span>
              </Choice>
            ))}
          </div>
        </Card>

        <Card title={t('packages.step2')}>
          {!checkoutEnabled ? (
            <p className="flex items-start gap-3 rounded-[20px] bg-surface2 p-5 text-[15px] leading-relaxed text-muted">
              <Icon name="card" size={20} className="mt-0.5 flex-none" />
              {t('packages.checkoutOff')}
            </p>
          ) : !isLoading && !user ? (
            <Button href="/login?next=/packages" size="lg">
              {t('packages.loginFirst')}
            </Button>
          ) : (
            <div className="flex flex-col gap-4">
              <p className="text-[15px] leading-relaxed text-muted">{t('packages.payNote')}</p>
              <FormMessage>{pay.error && errorMessage(pay.error)}</FormMessage>
              <Button size="lg" loading={pay.isPending || pay.isSuccess} onClick={() => pay.mutate()}>
                {t('packages.payWith', { amount: taka(price, lang) })}
              </Button>
              <p className="flex items-center gap-2 text-sm text-muted">
                <Icon name="shield" size={16} />
                {t('packages.secureNote')}
              </p>
            </div>
          )}
          <TutorialLink topic="buyConnections" className="self-start" />
        </Card>
      </div>

      <aside className="flex w-full flex-col gap-4 lg:sticky lg:top-28 lg:w-[360px] lg:flex-none">
        <section className="flex flex-col gap-4 rounded-[28px] bg-panel p-7 text-on-panel">
          <h2 className="font-display text-xl font-semibold">{t('packages.summary')}</h2>
          <div className="flex justify-between text-[15px] text-panel-muted">
            <span>
              {pkg.name[lang] || pkg.name.en} ·{' '}
              {t('common.connections', { n: digits(pkg.connections, lang) })}
            </span>
            <span>{taka(pkg.price, lang)}</span>
          </div>
          {price !== pkg.price && (
            <div className="flex justify-between text-[15px] text-panel-muted">
              <span>{t('packages.discount', { n: digits(pkg.discountPercent, lang) })}</span>
              <span>−{taka(pkg.price - price, lang)}</span>
            </div>
          )}
          <div className="flex justify-between text-[15px] text-panel-muted">
            <span>{t('packages.method')}</span>
            <span>SSLCommerz</span>
          </div>
          <div className="flex justify-between border-t border-panel-line pt-4 text-xl font-extrabold">
            <span>{t('packages.total')}</span>
            <span>{taka(price, lang)}</span>
          </div>
          {user && (
            <p className="text-sm text-panel-muted">
              {t('packages.after', {
                n: t('common.connections', { n: digits(user.connectionBalance + pkg.connections, lang) }),
              })}
            </p>
          )}
        </section>
        {(approvalGift > 0 || (approvedDiscountPercent > 0 && !pkg.discountPercent)) && (
          <section className="flex flex-col gap-2 rounded-[20px] border border-gold bg-surface p-6 text-sm leading-relaxed">
            <b className="text-[15px] text-gold-text">{t('packages.perksTitle')}</b>
            {approvalGift > 0 && (
              <p>
                {t('packages.approvalGift', {
                  n: t('common.connections', { n: digits(approvalGift, lang) }),
                })}
              </p>
            )}
            {approvedDiscountPercent > 0 && !pkg.discountPercent && (
              <p>{t('packages.approvedDiscount', { n: digits(approvedDiscountPercent, lang) })}</p>
            )}
          </section>
        )}
        <section className="flex flex-col gap-2 rounded-[20px] bg-sage-bg p-6">
          <b className="text-[15px] text-sage">{t('packages.refundTitle')}</b>
          <p className="text-sm leading-relaxed">
            {t('packages.refundText')}{' '}
            <Link href="/refund-policy" className="font-semibold underline">
              {t('packages.refundLink')}
            </Link>
            .
          </p>
        </section>
      </aside>
    </div>
  );
}

/** Title block at the top of each admin page. */
export function PageHeader({ kicker, title, sub, actions }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="flex flex-col gap-1.5">
        {kicker && <div className="kicker">{kicker}</div>}
        <h1 className="font-display text-[clamp(30px,3.6vw,44px)] font-medium leading-title tracking-[-0.015em]">
          {title}
        </h1>
        {sub && <p className="max-w-3xl text-[15px] text-muted">{sub}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
    </div>
  );
}

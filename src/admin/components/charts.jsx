import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { date, digits, number } from '@/shared/format';

// Chart building blocks for the analytics page. Colours come from the --chart-*
// tokens (shared/styles/tokens.css), always assigned in the same order, so a
// series keeps its colour in light and dark mode.

const AXIS = { stroke: 'var(--line)', tick: { fill: 'var(--muted)', fontSize: 12 }, tickLine: false };
const TOOLTIP = {
  contentStyle: {
    background: 'var(--surface)',
    border: '1px solid var(--line)',
    borderRadius: 14,
    color: 'var(--ink)',
    fontSize: 13,
  },
  labelStyle: { fontWeight: 700, marginBottom: 4 },
  itemStyle: { color: 'var(--ink)', padding: 0 },
};

function Frame({ height = 260, children }) {
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer>{children}</ResponsiveContainer>
    </div>
  );
}

/**
 * Daily values over time. One series renders as bars; several render as lines with a legend.
 * @param {{ data: object[], series: Array<{ key: string, label: string }>, lang: 'en' | 'bn', format?: (n: number) => string }} props
 */
export function DailyChart({ data, series, lang, format = (n) => number(n, lang), height }) {
  const tickDay = (day) => date(day, lang, { day: 'numeric', month: 'short' });
  const tooltip = {
    ...TOOLTIP,
    labelFormatter: (day) => date(day, lang),
    formatter: (value, name) => [format(value), name],
  };
  const axes = (
    <>
      <CartesianGrid vertical={false} stroke="var(--line)" />
      <XAxis dataKey="day" tickFormatter={tickDay} minTickGap={24} {...AXIS} />
      <YAxis
        allowDecimals={false}
        width={56}
        tickFormatter={(n) => digits(n, lang)}
        axisLine={false}
        {...AXIS}
      />
    </>
  );

  if (series.length === 1) {
    const [s] = series;
    return (
      <Frame height={height}>
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          {axes}
          <Tooltip {...tooltip} cursor={{ fill: 'var(--surface2)' }} />
          <Bar
            dataKey={s.key}
            name={s.label}
            fill="var(--chart-1)"
            radius={[4, 4, 0, 0]}
            maxBarSize={28}
            isAnimationActive={false}
          />
        </BarChart>
      </Frame>
    );
  }
  return (
    <Frame height={height}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        {axes}
        <Tooltip {...tooltip} cursor={{ stroke: 'var(--muted)', strokeWidth: 1 }} />
        <Legend iconType="plainline" wrapperStyle={{ fontSize: 13, color: 'var(--ink)' }} />
        {series.map((s, i) => (
          <Line
            key={s.key}
            dataKey={s.key}
            name={s.label}
            type="monotone"
            stroke={`var(--chart-${i + 1})`}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 5, stroke: 'var(--surface)', strokeWidth: 2 }}
            isAnimationActive={false}
          />
        ))}
      </LineChart>
    </Frame>
  );
}

/**
 * Counts per category as horizontal bars with the value written beside each, so
 * it reads without hover. Nominal categories share one colour.
 * @param {{ items: Array<{ key: string, label: string, count: number, note?: string }>, lang: 'en' | 'bn', empty: string }} props
 */
export function BarList({ items, lang, empty }) {
  if (!items.length) return <p className="text-sm text-muted">{empty}</p>;
  const max = Math.max(1, ...items.map((i) => i.count));
  return (
    <ul className="flex flex-col gap-3">
      {items.map((item) => (
        <li key={item.key ?? 'none'} className="flex flex-col gap-1.5">
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span>{item.label}</span>
            <span>
              <b>{digits(item.count, lang)}</b>
              {item.note && <span className="text-muted"> · {item.note}</span>}
            </span>
          </div>
          <div className="h-2 rounded-full bg-surface2">
            <div
              className="h-2 rounded-full"
              style={{ width: `${(item.count / max) * 100}%`, background: 'var(--chart-1)' }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

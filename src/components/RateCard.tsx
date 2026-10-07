import { memo, useMemo, type ReactNode } from 'react';
import { CalendarDays, MessageSquareText, Share2 } from 'lucide-react';
import type { RateRow, RateValue } from '../lib/rates';
import { highlightRanges } from '../lib/search';
import { formatAmount, periodLabel } from '../lib/format';
import { CONFIG } from '../config';
import { cn } from '../utils/cn';

interface RateCardProps {
  row: RateRow;
  tokens: string[];
  /** latest month in the file (0 = don't mark old rates) */
  latestPeriod: number;
  onShare: (row: RateRow) => void;
  index: number;
}

const TONES = {
  cash: { box: 'bg-neutral-50 ring-neutral-200/80', label: 'text-neutral-500', value: 'text-neutral-900' },
  installment: { box: 'bg-red-50 ring-red-100', label: 'text-red-600', value: 'text-red-700' },
  fix: { box: 'bg-neutral-900 ring-neutral-900', label: 'text-red-400', value: 'text-white' },
} as const;

function RateBox({
  label,
  value,
  tone,
  compact,
}: {
  label: string;
  value: RateValue;
  tone: keyof typeof TONES;
  compact: boolean;
}) {
  const t = TONES[tone];
  let content: ReactNode;

  if (typeof value === 'number') {
    const text = formatAmount(value);
    // Auto-fit the amount to the box width (container query units, falls back to 15px)
    const size = `clamp(12px, ${(100 / (0.62 * text.length + (compact ? 1 : 1.3))).toFixed(2)}cqi, ${compact ? 17 : 21}px)`;
    content = (
      <span className="flex min-w-0 items-baseline gap-[3px] overflow-hidden whitespace-nowrap">
        <span className="text-[10px] font-bold opacity-60">{CONFIG.currency}</span>
        <span className="rate-amount font-extrabold tabular-nums tracking-tight" style={{ fontSize: size }}>
          {text}
        </span>
      </span>
    );
  } else if (typeof value === 'string' && value) {
    content = <span className="block break-words text-[13px] font-bold leading-tight">{value}</span>;
  } else {
    content = <span className="block text-[15px] font-bold opacity-30">—</span>;
  }

  return (
    <div className={cn('rate-box min-w-0 rounded-xl px-2.5 py-2 ring-1 ring-inset', t.box)}>
      <p
        className={cn(
          'truncate text-[9.5px] font-extrabold uppercase',
          compact ? 'tracking-[0.06em]' : 'tracking-[0.12em]',
          t.label,
        )}
      >
        {label}
      </p>
      <div className={cn('mt-0.5 leading-tight', t.value)}>{content}</div>
    </div>
  );
}

function Highlighted({ text, ranges }: { text: string; ranges: Array<[number, number]> }) {
  if (!ranges.length) return <>{text}</>;
  const parts: ReactNode[] = [];
  let last = 0;
  ranges.forEach(([s, e], i) => {
    if (s > last) parts.push(text.slice(last, s));
    parts.push(
      <mark key={i} className="rounded-[4px] bg-red-100 text-red-700 [box-decoration-break:clone]">
        {text.slice(s, e)}
      </mark>,
    );
    last = e;
  });
  if (last < text.length) parts.push(text.slice(last));
  return <>{parts}</>;
}

export const RateCard = memo(function RateCard({ row, tokens, latestPeriod, onShare, index }: RateCardProps) {
  const title = row.model || row.product || '—';
  const ranges = useMemo(() => highlightRanges(title, tokens), [title, tokens]);
  const isOld = row.period > 0 && latestPeriod > 0 && row.period < latestPeriod;

  return (
    <article
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-neutral-200/80 bg-white p-4 shadow-[0_1px_2px_rgba(16,16,16,0.04)] transition duration-300 animate-rise hover:-translate-y-0.5 hover:border-neutral-300 hover:shadow-xl hover:shadow-neutral-900/[0.06]"
      style={{ animationDelay: `${Math.min(index % 36, 12) * 28}ms` }}
    >
      {row.hasFix && (
        <span className="pointer-events-none absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-red-600 via-red-500 to-neutral-900" />
      )}

      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
            {row.company && (
              <span
                className={cn(
                  'rounded-md px-2 py-[4px] text-[10px] font-black uppercase leading-none tracking-[0.14em] text-white',
                  row.hasFix ? 'bg-red-600' : 'bg-neutral-900',
                )}
              >
                {row.company}
              </span>
            )}
            {row.model && row.product && (
              <span className="min-w-0 truncate text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                {row.product}
              </span>
            )}
          </div>
          <h3 className="mt-2 break-words text-[17px] font-extrabold leading-snug tracking-tight text-neutral-900">
            <Highlighted text={title} ranges={ranges} />
          </h3>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-1.5">
          {row.period > 0 && (
            <span
              title={isOld ? 'Not updated in the latest rate list' : 'Rate month'}
              className={cn(
                'inline-flex items-center gap-1 whitespace-nowrap rounded-md px-1.5 py-[4px] text-[10px] font-bold uppercase leading-none tracking-wider',
                isOld ? 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200' : 'bg-neutral-100 text-neutral-600',
              )}
            >
              <CalendarDays className="h-3 w-3" />
              {periodLabel(row.period, true)}
            </span>
          )}
          <button
            type="button"
            onClick={() => onShare(row)}
            aria-label={`Share ${title} rate`}
            title="Share / copy rate"
            className="grid h-8 w-8 place-items-center rounded-lg text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-800 active:scale-90"
          >
            <Share2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className={cn('mt-3 grid gap-2', row.hasFix ? 'grid-cols-3' : 'grid-cols-2')}>
        <RateBox label="Cash" value={row.cash} tone="cash" compact={row.hasFix} />
        <RateBox label="Installment" value={row.installment} tone="installment" compact={row.hasFix} />
        {row.hasFix && <RateBox label="Fix Rate" value={row.fix} tone="fix" compact />}
      </div>

      {row.remarks && (
        <div className="mt-3 flex items-start gap-2 rounded-xl bg-neutral-50 px-3 py-2 text-[13px] leading-snug text-neutral-700 ring-1 ring-inset ring-neutral-200/80">
          <MessageSquareText className="mt-[2px] h-3.5 w-3.5 shrink-0 text-red-500" />
          <p className="min-w-0 break-words">{row.remarks}</p>
        </div>
      )}
    </article>
  );
});

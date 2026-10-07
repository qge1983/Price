import type { ReactNode } from 'react';
import { RefreshCw, SearchX, WifiOff, type LucideIcon } from 'lucide-react';
import { cn } from '../utils/cn';

export function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true" aria-label="Loading rates">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-neutral-200/80 bg-white p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 space-y-2.5">
              <div className="skeleton h-4 w-20 rounded-md" />
              <div className="skeleton h-5 w-3/4 rounded-md" />
            </div>
            <div className="skeleton h-5 w-16 rounded-md" />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <div className="skeleton h-[52px] rounded-xl" />
            <div className="skeleton h-[52px] rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function EmptyState({
  query,
  hasFilters,
  onClear,
  outsideCount,
  onSearchAll,
}: {
  query: string;
  hasFilters: boolean;
  onClear: () => void;
  outsideCount: number;
  onSearchAll: () => void;
}) {
  return (
    <div className="flex flex-col items-center rounded-3xl border border-dashed border-neutral-300 bg-white px-6 py-14 text-center animate-rise">
      <div className="grid h-14 w-14 place-items-center rounded-2xl bg-red-50 text-red-600">
        <SearchX className="h-7 w-7" />
      </div>
      <h3 className="mt-4 text-lg font-extrabold tracking-tight text-neutral-900">No rates found</h3>
      <p className="mt-1 max-w-sm text-sm leading-relaxed text-neutral-500">
        {query ? (
          <>
            Nothing matches “<b className="text-neutral-800">{query}</b>”. Try typing only part of the model number.
          </>
        ) : (
          'No models for the selected filters.'
        )}
      </p>
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        {outsideCount > 0 && (
          <button
            type="button"
            onClick={onSearchAll}
            className="h-10 rounded-xl bg-neutral-900 px-4 text-sm font-bold text-white transition hover:bg-neutral-800 active:scale-[0.98]"
          >
            Show {outsideCount} {outsideCount > 1 ? 'matches' : 'match'} in all companies
          </button>
        )}
        {hasFilters && (
          <button
            type="button"
            onClick={onClear}
            className="h-10 rounded-xl border border-neutral-200 bg-white px-4 text-sm font-bold text-neutral-700 transition hover:bg-neutral-50 active:scale-[0.98]"
          >
            Clear all filters
          </button>
        )}
      </div>
    </div>
  );
}

export function ErrorState({ message, onRetry, retrying }: { message: string; onRetry: () => void; retrying: boolean }) {
  return (
    <div className="mx-auto mt-6 flex max-w-md flex-col items-center rounded-3xl bg-white px-6 py-12 text-center shadow-sm ring-1 ring-neutral-200 animate-rise">
      <div className="grid h-14 w-14 place-items-center rounded-2xl bg-neutral-900 text-red-500">
        <WifiOff className="h-7 w-7" />
      </div>
      <h3 className="mt-4 text-lg font-extrabold tracking-tight text-neutral-900">Rates could not be loaded</h3>
      <p className="mt-1 text-sm leading-relaxed text-neutral-500">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        disabled={retrying}
        className="mt-6 inline-flex h-11 items-center gap-2 rounded-xl bg-red-600 px-5 text-sm font-bold text-white shadow-lg shadow-red-600/25 transition hover:bg-red-700 active:scale-[0.98] disabled:opacity-70"
      >
        <RefreshCw className={cn('h-4 w-4', retrying && 'animate-spin')} />
        {retrying ? 'Trying…' : 'Try again'}
      </button>
    </div>
  );
}

const BANNER_TONES = {
  warning: { box: 'bg-red-50 text-red-950 ring-red-200', icon: 'bg-red-600 text-white' },
  dark: { box: 'bg-neutral-900 text-neutral-100 ring-neutral-900', icon: 'bg-white/10 text-red-400' },
  info: { box: 'bg-white text-neutral-800 ring-neutral-200', icon: 'bg-red-50 text-red-600' },
} as const;

export function Banner({
  tone,
  icon: Icon,
  title,
  children,
  action,
}: {
  tone: keyof typeof BANNER_TONES;
  icon: LucideIcon;
  title: string;
  children?: ReactNode;
  action?: ReactNode;
}) {
  const t = BANNER_TONES[tone];
  return (
    <div className={cn('mb-3 flex flex-col gap-3 rounded-2xl p-3.5 ring-1 ring-inset animate-rise sm:flex-row sm:items-center', t.box)}>
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <span className={cn('grid h-9 w-9 shrink-0 place-items-center rounded-xl', t.icon)}>
          <Icon className="h-[18px] w-[18px]" />
        </span>
        <div className="min-w-0 text-[13px] leading-snug">
          <p className="font-extrabold">{title}</p>
          {children && <div className="mt-0.5 opacity-80">{children}</div>}
        </div>
      </div>
      {action && <div className="shrink-0 pl-12 sm:pl-0">{action}</div>}
    </div>
  );
}

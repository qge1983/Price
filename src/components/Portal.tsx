import { Fragment, useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowUp,
  ArrowUpDown,
  CalendarClock,
  CalendarDays,
  Check,
  Download,
  FileSpreadsheet,
  LoaderCircle,
  Package,
  RefreshCw,
  Sparkles,
  Tag,
  WifiOff,
} from 'lucide-react';
import { Header } from './Header';
import { SearchBar } from './SearchBar';
import { Dropdown, type DropdownOption } from './Dropdown';
import { RateCard } from './RateCard';
import { Banner, EmptyState, ErrorState, SkeletonGrid } from './States';
import { Logo } from './Logo';
import { useScrollHide } from '../hooks/useScrollHide';
import { downloadTemplate, latestOnly, loadRates, periodsOf, type RateRow, type RatesData } from '../lib/rates';
import { searchRows, tokenize, type Hit } from '../lib/search';
import { buildShareText, copyText } from '../lib/share';
import { formatDateTime, periodLabel } from '../lib/format';
import { CONFIG } from '../config';
import { cn } from '../utils/cn';

type SortKey = 'default' | 'price-asc' | 'price-desc' | 'model' | 'company';
type LoadMode = 'initial' | 'manual' | 'silent';

const PAGE = 36;
const HEADER_H = 56;
const NO_ROWS: RateRow[] = [];
const SORT_SHORT: Record<SortKey, string> = {
  default: 'Sort',
  'price-asc': 'Price ↑',
  'price-desc': 'Price ↓',
  model: 'Model A–Z',
  company: 'Company A–Z',
};

function priceOf(r: RateRow): number {
  if (typeof r.cash === 'number') return r.cash;
  if (typeof r.installment === 'number') return r.installment;
  if (typeof r.fix === 'number') return r.fix;
  return Number.NaN;
}

function sortHits(hits: Hit[], sort: SortKey): Hit[] {
  if (sort === 'default') return hits;
  const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });
  const cmp = (a: RateRow, b: RateRow): number => {
    switch (sort) {
      case 'price-asc':
      case 'price-desc': {
        const pa = priceOf(a);
        const pb = priceOf(b);
        const na = Number.isNaN(pa);
        const nb = Number.isNaN(pb);
        if (na || nb) return na === nb ? 0 : na ? 1 : -1;
        return sort === 'price-asc' ? pa - pb : pb - pa;
      }
      case 'model':
        return collator.compare(a.model || a.product, b.model || b.product);
      case 'company':
        return (
          collator.compare(a.company, b.company) ||
          collator.compare(a.product, b.product) ||
          collator.compare(a.model, b.model)
        );
      default:
        return 0;
    }
  };
  return hits.slice().sort((a, b) => Number(b.exact) - Number(a.exact) || cmp(a.row, b.row) || a.row.id - b.row.id);
}

function buildOptions(rows: RateRow[], kind: 'company' | 'product', other: string): DropdownOption[] {
  const map = new Map<string, DropdownOption>();
  for (const r of rows) {
    if (other && (kind === 'company' ? r.productKey : r.companyKey) !== other) continue;
    const key = kind === 'company' ? r.companyKey : r.productKey;
    const existing = map.get(key);
    if (existing) existing.count = (existing.count || 0) + 1;
    else map.set(key, { value: key, label: (kind === 'company' ? r.company : r.product) || 'Other', count: 1 });
  }
  return Array.from(map.values()).sort((a, b) =>
    a.label.localeCompare(b.label, undefined, { numeric: true, sensitivity: 'base' }),
  );
}

function sumCounts(options: DropdownOption[]): number {
  let n = 0;
  for (const o of options) n += o.count || 0;
  return n;
}

function sameRates(a: RatesData, b: RatesData): boolean {
  return a.source === b.source && JSON.stringify(a.raw) === JSON.stringify(b.raw);
}

export default function Portal({ onLogout }: { onLogout: () => void }) {
  const [data, setData] = useState<RatesData | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState('');
  const [company, setCompany] = useState('');
  const [product, setProduct] = useState('');
  const [period, setPeriod] = useState('latest');
  const [sort, setSort] = useState<SortKey>('default');
  const [limit, setLimit] = useState(PAGE);
  const [toast, setToast] = useState<{ id: number; text: string } | null>(null);

  const { hidden, scrolled, farDown } = useScrollHide();
  const deferredQuery = useDeferredValue(query);
  const dataRef = useRef<RatesData | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const mountedRef = useRef(false);

  useEffect(() => {
    document.body.style.backgroundColor = '#f4f4f5';
    return () => {
      document.body.style.backgroundColor = '';
    };
  }, []);

  /* ───────────── toast ───────────── */
  const showToast = useCallback((text: string) => setToast({ id: Date.now(), text }), []);
  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 2600);
    return () => window.clearTimeout(t);
  }, [toast]);

  /* ───────────── loading ───────────── */
  const load = useCallback(
    async (mode: LoadMode) => {
      if (mode === 'manual') setRefreshing(true);
      try {
        const next = await loadRates(mode !== 'initial');
        const prev = dataRef.current;
        dataRef.current = next;
        setData(next);
        setStatus('ready');
        if (mode === 'manual') {
          if (next.source === 'cache') showToast('Offline — showing saved rates');
          else if (next.source === 'sample') showToast('rates.xlsx not found — showing sample data');
          else showToast(prev && sameRates(prev, next) ? 'Rates are already up to date' : 'Latest rates loaded');
        } else if (mode === 'silent' && prev && next.source === 'remote' && !sameRates(prev, next)) {
          showToast('New rates loaded');
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Something went wrong.';
        if (!dataRef.current) {
          setErrorMsg(msg);
          setStatus('error');
        } else if (mode === 'manual') {
          showToast(msg);
        }
      } finally {
        if (mode === 'manual') setRefreshing(false);
      }
    },
    [showToast],
  );

  useEffect(() => {
    void load('initial');
  }, [load]);

  // Auto-refresh when the salesman comes back to the app / internet returns
  useEffect(() => {
    const maybeRefresh = () => {
      const d = dataRef.current;
      if (document.visibilityState !== 'visible' || !d) return;
      if (d.source === 'cache' || Date.now() - d.fetchedAt > 10 * 60 * 1000) void load('silent');
    };
    document.addEventListener('visibilitychange', maybeRefresh);
    window.addEventListener('online', maybeRefresh);
    return () => {
      document.removeEventListener('visibilitychange', maybeRefresh);
      window.removeEventListener('online', maybeRefresh);
    };
  }, [load]);

  /* ───────────── derived data ───────────── */
  const rows = data?.rows ?? NO_ROWS;
  const periods = useMemo(() => periodsOf(rows), [rows]);
  const latestPeriod = periods[0] ?? 0;

  useEffect(() => {
    if (period !== 'latest' && !periods.some((p) => String(p) === period)) setPeriod('latest');
  }, [periods, period]);

  const baseRows = useMemo(
    () => (period === 'latest' ? latestOnly(rows) : rows.filter((r) => String(r.period) === period)),
    [rows, period],
  );

  // Reset filters that don't exist in the current data/month
  useEffect(() => {
    setCompany((c) => (c && !baseRows.some((r) => r.companyKey === c) ? '' : c));
    setProduct((p) => (p && !baseRows.some((r) => r.productKey === p) ? '' : p));
  }, [baseRows]);

  const companyOptions = useMemo(() => buildOptions(baseRows, 'company', product), [baseRows, product]);
  const productOptions = useMemo(() => buildOptions(baseRows, 'product', company), [baseRows, company]);

  const filtered = useMemo(
    () =>
      baseRows.filter((r) => (!company || r.companyKey === company) && (!product || r.productKey === product)),
    [baseRows, company, product],
  );
  const tokens = useMemo(() => tokenize(deferredQuery), [deferredQuery]);
  const hits = useMemo(() => searchRows(filtered, tokens), [filtered, tokens]);
  const sorted = useMemo(() => sortHits(hits, sort), [hits, sort]);
  const exactCount = useMemo(() => {
    let n = 0;
    for (const h of sorted) if (h.exact) n++;
    return n;
  }, [sorted]);
  const outsideCount = useMemo(
    () => (sorted.length === 0 && tokens.length > 0 && (company || product) ? searchRows(baseRows, tokens).length : 0),
    [sorted.length, tokens, company, product, baseRows],
  );

  /* ───────────── progressive rendering ───────────── */
  useEffect(() => {
    setLimit(PAGE);
  }, [sorted]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || limit >= sorted.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) setLimit((l) => l + PAGE);
      },
      { rootMargin: '900px 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [limit, sorted.length]);

  // Jump back to the top of the list when filters change
  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      return;
    }
    if (window.scrollY > 160) window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [company, product, period, sort, tokens]);

  /* ───────────── actions ───────────── */
  const handleShare = useCallback(
    async (row: RateRow) => {
      const text = buildShareText(row);
      const coarse = typeof window.matchMedia === 'function' && window.matchMedia('(pointer: coarse)').matches;
      if (coarse && typeof navigator.share === 'function') {
        try {
          await navigator.share({ text });
          return;
        } catch (err) {
          if (err instanceof DOMException && err.name === 'AbortError') return;
        }
      }
      const ok = await copyText(text);
      showToast(ok ? 'Rate copied — paste in WhatsApp or SMS' : 'Could not copy on this device');
    },
    [showToast],
  );

  const hasFilters = !!(query || company || product);
  const clearAll = () => {
    setQuery('');
    setCompany('');
    setProduct('');
  };

  /* ───────────── labels ───────────── */
  const sortOptions: DropdownOption[] = [
    { value: 'default', label: tokens.length ? 'Best match' : 'Default order' },
    { value: 'price-asc', label: 'Price: Low to High' },
    { value: 'price-desc', label: 'Price: High to Low' },
    { value: 'model', label: 'Model: A to Z' },
    { value: 'company', label: 'Company: A to Z' },
  ];
  const periodOptions = useMemo<DropdownOption[]>(
    () => [
      { value: 'latest', label: latestPeriod ? `Latest — ${periodLabel(latestPeriod)}` : 'Latest rates' },
      ...periods.slice(1).map((p) => ({ value: String(p), label: periodLabel(p) })),
    ],
    [periods, latestPeriod],
  );
  const periodChipText =
    period === 'latest'
      ? latestPeriod
        ? `${periodLabel(latestPeriod)} Rates`
        : 'Latest Rates'
      : periodLabel(Number(period));

  const updatedText = data ? formatDateTime(data.lastModified) || formatDateTime(data.fetchedAt) : '';
  const fileLabel = !data
    ? '—'
    : data.source === 'sample'
      ? 'Sample data'
      : data.source === 'cache'
        ? `${data.fileName} (saved copy)`
        : data.fileName;

  const visible = sorted.slice(0, limit);
  const showDivider = tokens.length > 0 && exactCount > 0 && exactCount < sorted.length;
  const isStale = query !== deferredQuery;

  return (
    <div className="min-h-screen bg-neutral-100">
      {/* ═════════ Sticky top: header (hides on scroll) + search + filters ═════════ */}
      <div
        className="sticky top-0 z-40 transition-transform duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] will-change-transform"
        style={{ transform: hidden ? `translate3d(0,-${HEADER_H}px,0)` : 'translate3d(0,0,0)' }}
      >
        <Header
          onRefresh={() => void load('manual')}
          refreshing={refreshing}
          onLogout={onLogout}
          fileLabel={fileLabel}
          updatedText={updatedText}
        />
        <div
          className={cn(
            'border-b border-neutral-200/80 bg-white/95 backdrop-blur-md transition-shadow duration-300',
            scrolled && 'shadow-[0_10px_30px_-14px_rgba(0,0,0,0.22)]',
          )}
        >
          <div className="mx-auto max-w-6xl space-y-2 px-3 py-2.5 sm:px-4">
            <SearchBar value={query} onChange={setQuery} />
            <div className="grid grid-cols-2 gap-2">
              <Dropdown
                variant="field"
                icon={Tag}
                title="Company"
                placeholder="All Companies"
                allLabel="All Companies"
                allCount={sumCounts(companyOptions)}
                value={company}
                options={companyOptions}
                onChange={setCompany}
                align="left"
              />
              <Dropdown
                variant="field"
                icon={Package}
                title="Product"
                placeholder="All Products"
                allLabel="All Products"
                allCount={sumCounts(productOptions)}
                value={product}
                options={productOptions}
                onChange={setProduct}
                align="right"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ═════════ Content ═════════ */}
      <main className="mx-auto max-w-6xl px-3 pb-14 pt-3 sm:px-4 sm:pt-4">
        {status === 'loading' && <SkeletonGrid />}

        {status === 'error' && (
          <ErrorState message={errorMsg} onRetry={() => void load('manual')} retrying={refreshing} />
        )}

        {status === 'ready' && data && (
          <>
            {data.source === 'sample' && (
              <Banner
                tone="warning"
                icon={FileSpreadsheet}
                title="Sample data — rates.xlsx not uploaded yet"
                action={
                  <button
                    type="button"
                    onClick={() => downloadTemplate(data.raw)}
                    className="inline-flex h-9 items-center gap-2 rounded-xl bg-neutral-900 px-3.5 text-xs font-bold text-white transition hover:bg-neutral-800 active:scale-[0.98]"
                  >
                    <Download className="h-4 w-4" />
                    Download Excel template
                  </button>
                }
              >
                {data.notice ?? (
                  <>
                    Upload <b>rates.xlsx</b> to your GitHub repository (next to index.html). Real rates will then show
                    here automatically.
                  </>
                )}
              </Banner>
            )}

            {data.source === 'cache' && (
              <Banner
                tone="dark"
                icon={WifiOff}
                title="Offline — showing saved rates"
                action={
                  <button
                    type="button"
                    onClick={() => void load('manual')}
                    disabled={refreshing}
                    className="inline-flex h-9 items-center gap-2 rounded-xl bg-red-600 px-3.5 text-xs font-bold text-white transition hover:bg-red-700 active:scale-[0.98]"
                  >
                    <RefreshCw className={cn('h-4 w-4', refreshing && 'animate-spin')} />
                    Retry
                  </button>
                }
              >
                {data.notice ? `${data.notice} ` : ''}Saved on {formatDateTime(data.fetchedAt)}. Please confirm rates
                before final deal.
              </Banner>
            )}

            {period !== 'latest' && (
              <Banner
                tone="info"
                icon={CalendarClock}
                title={`Old rates — ${periodLabel(Number(period))}`}
                action={
                  <button
                    type="button"
                    onClick={() => setPeriod('latest')}
                    className="inline-flex h-9 items-center rounded-xl bg-red-600 px-3.5 text-xs font-bold text-white transition hover:bg-red-700 active:scale-[0.98]"
                  >
                    Show latest rates
                  </button>
                }
              >
                You are viewing an older rate list.
              </Banner>
            )}

            {/* Info bar */}
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              {periods.length > 1 ? (
                <Dropdown
                  variant="chip"
                  tone="dark"
                  icon={CalendarDays}
                  title="Rate month"
                  value={period}
                  options={periodOptions}
                  onChange={setPeriod}
                  display={periodChipText}
                  align="left"
                  active={period !== 'latest'}
                />
              ) : (
                <span className="inline-flex h-8 items-center gap-2 rounded-full bg-neutral-900 pl-3 pr-3.5 text-xs font-bold uppercase tracking-[0.1em] text-white">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
                  </span>
                  {periodChipText}
                </span>
              )}

              <div className="ml-auto flex items-center gap-2">
                <span className="text-xs text-neutral-500">
                  <b className="font-extrabold tabular-nums text-neutral-900">{sorted.length}</b>{' '}
                  {sorted.length === 1 ? 'model' : 'models'}
                </span>
                {hasFilters && (
                  <button
                    type="button"
                    onClick={clearAll}
                    className="h-8 rounded-full px-2 text-xs font-bold text-red-600 transition hover:bg-red-50"
                  >
                    Clear
                  </button>
                )}
                <Dropdown
                  variant="chip"
                  icon={ArrowUpDown}
                  title="Sort by"
                  value={sort}
                  options={sortOptions}
                  onChange={(v) => setSort(v as SortKey)}
                  display={SORT_SHORT[sort]}
                  align="right"
                  uppercase={false}
                  active={sort !== 'default'}
                />
              </div>
            </div>

            {tokens.length > 0 && exactCount === 0 && sorted.length > 0 && (
              <div className="mb-3 flex items-center gap-2 rounded-xl bg-white px-3 py-2.5 text-[13px] text-neutral-600 ring-1 ring-inset ring-neutral-200">
                <Sparkles className="h-4 w-4 shrink-0 text-red-500" />
                <span>
                  No exact match for “<b className="text-neutral-900">{deferredQuery.trim()}</b>” — showing similar
                  models.
                </span>
              </div>
            )}

            {sorted.length === 0 ? (
              <EmptyState
                query={deferredQuery.trim()}
                hasFilters={hasFilters}
                onClear={clearAll}
                outsideCount={outsideCount}
                onSearchAll={() => {
                  setCompany('');
                  setProduct('');
                }}
              />
            ) : (
              <>
                <div
                  className={cn(
                    'grid grid-cols-1 gap-3 transition-opacity duration-200 sm:grid-cols-2 lg:grid-cols-3',
                    isStale && 'opacity-60',
                  )}
                >
                  {visible.map((h, i) => (
                    <Fragment key={h.row.id}>
                      {showDivider && i === exactCount && (
                        <div className="col-span-full flex items-center gap-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-neutral-400">
                          <span className="h-px flex-1 bg-neutral-200" />
                          <span className="inline-flex items-center gap-1.5">
                            <Sparkles className="h-3.5 w-3.5 text-red-500" />
                            Similar models
                          </span>
                          <span className="h-px flex-1 bg-neutral-200" />
                        </div>
                      )}
                      <RateCard
                        row={h.row}
                        tokens={tokens}
                        latestPeriod={period === 'latest' ? latestPeriod : 0}
                        onShare={handleShare}
                        index={i}
                      />
                    </Fragment>
                  ))}
                </div>
                {limit < sorted.length && (
                  <div ref={sentinelRef} className="flex justify-center py-8">
                    <LoaderCircle className="h-5 w-5 animate-spin text-neutral-400" />
                  </div>
                )}
              </>
            )}
          </>
        )}
      </main>

      {/* ═════════ Footer ═════════ */}
      <footer className="border-t border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-1.5 px-4 py-6 text-center text-[11px] leading-relaxed text-neutral-400">
          <div className="flex items-center gap-2 text-neutral-600">
            <Logo size={22} />
            <span className="font-extrabold tracking-wide">{CONFIG.companyName}</span>
          </div>
          <p>Rates are for internal use of sales staff only and may change without notice.</p>
          {updatedText && <p>Rates updated: {updatedText}</p>}
          <p>© {new Date().getFullYear()} · All rights reserved</p>
        </div>
      </footer>

      {/* Back to top */}
      <button
        type="button"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        aria-label="Back to top"
        className={cn(
          'fixed bottom-[calc(1.25rem+env(safe-area-inset-bottom))] right-4 z-20 grid h-11 w-11 place-items-center rounded-full bg-red-600 text-white shadow-lg shadow-red-600/35 transition-all duration-300 hover:bg-red-700 active:scale-95',
          farDown ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-4 opacity-0',
        )}
      >
        <ArrowUp className="h-5 w-5" />
      </button>

      {/* Toast */}
      {toast && (
        <div
          key={toast.id}
          role="status"
          className="fixed bottom-[calc(1.25rem+env(safe-area-inset-bottom))] left-1/2 z-50 flex max-w-[calc(100vw-2rem)] -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-full bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white shadow-2xl shadow-black/30 animate-toast"
        >
          <Check className="h-4 w-4 shrink-0 text-red-400" />
          <span className="truncate">{toast.text}</span>
        </div>
      )}
    </div>
  );
}

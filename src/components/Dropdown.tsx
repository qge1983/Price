import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown, Search, X, type LucideIcon } from 'lucide-react';
import { usePopover } from '../hooks/usePopover';
import { norm } from '../lib/search';
import { cn } from '../utils/cn';

export interface DropdownOption {
  value: string;
  label: string;
  count?: number;
}

interface DropdownProps {
  value: string;
  options: DropdownOption[];
  onChange: (value: string) => void;
  icon: LucideIcon;
  title: string;
  placeholder?: string;
  /** adds an "All …" option with value "" */
  allLabel?: string;
  allCount?: number;
  /** override the text shown on the button */
  display?: string;
  align?: 'left' | 'right';
  variant?: 'field' | 'chip';
  tone?: 'light' | 'dark';
  uppercase?: boolean;
  active?: boolean;
}

/**
 * Custom dropdown that opens as a floating overlay panel right under its
 * button (instead of the phone's separate full-screen picker).
 */
export function Dropdown({
  value,
  options,
  onChange,
  icon: Icon,
  title,
  placeholder = 'All',
  allLabel,
  allCount,
  display,
  align = 'left',
  variant = 'field',
  tone = 'light',
  uppercase = true,
  active,
}: DropdownProps) {
  const { open, setOpen, rootRef, backdropRef } = usePopover();
  const [filter, setFilter] = useState('');
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const items = useMemo<DropdownOption[]>(
    () => (allLabel !== undefined ? [{ value: '', label: allLabel, count: allCount }, ...options] : options),
    [allLabel, allCount, options],
  );
  const selected = items.find((o) => o.value === value);
  const isActive = active ?? value !== '';
  const searchable = options.length > 8;

  const shown = useMemo(() => {
    const f = norm(filter);
    if (!f) return items;
    return items.filter((o) => o.value !== '' && norm(o.label).includes(f));
  }, [items, filter]);

  useEffect(() => {
    if (!open) {
      setFilter('');
      return;
    }
    const frame = window.requestAnimationFrame(() => {
      const list = listRef.current;
      const sel = list?.querySelector<HTMLElement>('[aria-selected="true"]');
      if (list && sel) list.scrollTop = sel.offsetTop - list.clientHeight / 2 + sel.offsetHeight / 2;
      // Only auto-focus on desktop (avoids popping the phone keyboard)
      if (window.matchMedia('(pointer: fine)').matches) {
        if (searchable) inputRef.current?.focus({ preventScroll: true });
        else sel?.focus({ preventScroll: true });
      }
    });
    return () => window.cancelAnimationFrame(frame);
  }, [open, searchable]);

  const choose = (v: string) => {
    onChange(v);
    setOpen(false);
  };

  const onPanelKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') {
      e.stopPropagation();
      setOpen(false);
      triggerRef.current?.focus();
      return;
    }
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    e.preventDefault();
    const buttons = Array.from(listRef.current?.querySelectorAll<HTMLButtonElement>('[role="option"]') ?? []);
    if (!buttons.length) return;
    const i = buttons.indexOf(document.activeElement as HTMLButtonElement);
    const next = e.key === 'ArrowDown' ? (i < 0 ? 0 : Math.min(buttons.length - 1, i + 1)) : Math.max(0, i - 1);
    buttons[next].focus();
  };

  const label = display ?? (value !== '' && selected ? selected.label : placeholder);

  return (
    <div
      ref={rootRef}
      className={cn('relative', variant === 'field' ? 'w-full' : 'inline-block max-w-full', variant === 'chip' && open && 'z-[35]')}
    >
      {variant === 'field' ? (
        <>
          <button
            ref={triggerRef}
            type="button"
            aria-haspopup="listbox"
            aria-expanded={open}
            onClick={() => setOpen((o) => !o)}
            className={cn(
              'flex h-10 w-full items-center gap-2 rounded-xl border pl-3 text-left transition',
              isActive
                ? 'border-red-500/60 bg-red-50 pr-10 text-red-700'
                : 'border-neutral-200 bg-white pr-2.5 text-neutral-800 hover:border-neutral-300',
              open && 'border-red-500 ring-4 ring-red-500/15',
            )}
          >
            <Icon className={cn('h-4 w-4 shrink-0', isActive ? 'text-red-600' : 'text-neutral-400')} />
            <span className={cn('min-w-0 flex-1 truncate text-[12.5px] font-bold', uppercase && 'uppercase tracking-wide')}>
              {label}
            </span>
            {!isActive && (
              <ChevronDown className={cn('h-4 w-4 shrink-0 text-neutral-400 transition-transform', open && 'rotate-180')} />
            )}
          </button>
          {isActive && (
            <button
              type="button"
              onClick={() => choose('')}
              aria-label={`Clear ${title}`}
              className="absolute right-1 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-red-500 transition hover:bg-red-100 active:scale-95"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </>
      ) : (
        <button
          ref={triggerRef}
          type="button"
          aria-haspopup="listbox"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
          className={cn(
            'inline-flex h-8 max-w-full items-center gap-1.5 rounded-full px-3 text-xs font-bold transition active:scale-[0.97]',
            tone === 'dark'
              ? 'bg-neutral-900 text-white hover:bg-neutral-800'
              : isActive
                ? 'bg-red-600 text-white shadow-sm shadow-red-600/30'
                : 'border border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300',
            open && tone !== 'dark' && !isActive && 'border-red-500 ring-4 ring-red-500/15',
            uppercase && 'uppercase tracking-[0.1em]',
          )}
        >
          {tone === 'dark' && !isActive ? (
            <span className="relative mr-0.5 flex h-2 w-2 shrink-0">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
            </span>
          ) : (
            <Icon className="h-3.5 w-3.5 shrink-0" />
          )}
          <span className="truncate">{label}</span>
          <ChevronDown className={cn('h-3.5 w-3.5 shrink-0 opacity-70 transition-transform', open && 'rotate-180')} />
        </button>
      )}

      {open && (
        <>
          {createPortal(
            <div
              ref={backdropRef}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-30 touch-none bg-neutral-950/25 animate-fade-in"
              aria-hidden="true"
            />,
            document.body,
          )}
          <div
            role="dialog"
            aria-label={title}
            onKeyDown={onPanelKeyDown}
            className={cn(
              'absolute top-full z-50 mt-2 overflow-hidden rounded-2xl border border-neutral-200/80 bg-white text-neutral-900 shadow-2xl shadow-neutral-950/25 animate-drop-in',
              variant === 'field' ? 'w-[max(100%,16.5rem)]' : 'w-64',
              'max-w-[calc(100vw-1.5rem)]',
              align === 'right' ? 'right-0 origin-top-right' : 'left-0 origin-top-left',
            )}
          >
            <div className="flex items-center justify-between gap-2 border-b border-neutral-100 px-4 py-2">
              <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-neutral-400">{title}</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="-mr-2 grid h-8 w-8 place-items-center rounded-lg text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {searchable && (
              <div className="border-b border-neutral-100 p-2">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                  <input
                    ref={inputRef}
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    placeholder={`Find ${title.toLowerCase()}…`}
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="none"
                    spellCheck={false}
                    className="h-10 w-full rounded-lg bg-neutral-100 pl-9 pr-3 text-base text-neutral-900 outline-none placeholder:text-neutral-400 focus:bg-white focus:ring-2 focus:ring-red-500/30 sm:text-sm"
                  />
                </div>
              </div>
            )}

            <ul
              ref={listRef}
              role="listbox"
              aria-label={title}
              className="scroll-thin relative max-h-[min(52vh,21rem)] overflow-y-auto overscroll-contain p-1.5"
            >
              {shown.map((o) => {
                const isSel = o.value === value;
                return (
                  <li key={o.value || '__all'} role="none">
                    <button
                      type="button"
                      role="option"
                      aria-selected={isSel}
                      onClick={() => choose(o.value)}
                      className={cn(
                        'flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-[13px] transition-colors focus:outline-none focus-visible:bg-neutral-100',
                        isSel
                          ? 'bg-red-50 font-bold text-red-700'
                          : 'font-semibold text-neutral-700 hover:bg-neutral-100 active:bg-neutral-100',
                      )}
                    >
                      <span
                        className={cn(
                          'min-w-0 flex-1 truncate',
                          uppercase && 'uppercase tracking-wide',
                          o.value === '' && !isSel && 'text-neutral-900',
                        )}
                      >
                        {o.label}
                      </span>
                      {o.count !== undefined && (
                        <span
                          className={cn(
                            'shrink-0 rounded-md px-1.5 py-0.5 text-[11px] font-bold tabular-nums',
                            isSel ? 'bg-red-100 text-red-700' : 'bg-neutral-100 text-neutral-500',
                          )}
                        >
                          {o.count}
                        </span>
                      )}
                      <Check className={cn('h-4 w-4 shrink-0 text-red-600', !isSel && 'invisible')} />
                    </button>
                  </li>
                );
              })}
              {!shown.length && <li className="px-3 py-8 text-center text-sm text-neutral-400">No match found</li>}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}

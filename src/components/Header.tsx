import { createPortal } from 'react-dom';
import { Clock, FileSpreadsheet, LogOut, RefreshCw, User } from 'lucide-react';
import { Logo } from './Logo';
import { usePopover } from '../hooks/usePopover';
import { CONFIG } from '../config';
import { cn } from '../utils/cn';

interface HeaderProps {
  onRefresh: () => void;
  refreshing: boolean;
  onLogout: () => void;
  fileLabel: string;
  updatedText: string;
}

export function Header({ onRefresh, refreshing, onLogout, fileLabel, updatedText }: HeaderProps) {
  return (
    <header className="relative h-14 bg-neutral-950 text-white">
      <span className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-red-600/80 to-transparent" />
      <div className="mx-auto flex h-full max-w-6xl items-center justify-between gap-3 px-3 sm:px-4">
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="flex min-w-0 items-center gap-2.5 text-left"
          aria-label="Qaiser Group of Electronics — back to top"
        >
          <Logo size={34} />
          <span className="min-w-0 leading-none">
            <span className="block truncate text-[15px] font-black tracking-tight">QAISER GROUP</span>
            <span className="mt-[5px] block truncate text-[9.5px] font-bold uppercase tracking-[0.24em] text-red-500">
              of Electronics
            </span>
          </span>
        </button>

        <div className="flex shrink-0 items-center gap-0.5">
          <span className="mr-2 hidden rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-neutral-300 sm:inline-block">
            Rate Portal
          </span>
          <button
            type="button"
            onClick={onRefresh}
            disabled={refreshing}
            aria-label="Refresh rates"
            title="Refresh rates"
            className="grid h-10 w-10 place-items-center rounded-xl text-neutral-300 transition hover:bg-white/10 hover:text-white active:scale-95 disabled:cursor-wait"
          >
            <RefreshCw className={cn('h-[18px] w-[18px]', refreshing && 'animate-spin')} />
          </button>
          <UserMenu onLogout={onLogout} fileLabel={fileLabel} updatedText={updatedText} />
        </div>
      </div>
    </header>
  );
}

function UserMenu({ onLogout, fileLabel, updatedText }: { onLogout: () => void; fileLabel: string; updatedText: string }) {
  const { open, setOpen, rootRef, backdropRef } = usePopover();

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
        className={cn(
          'ml-0.5 grid h-9 w-9 place-items-center rounded-full bg-white/10 text-white ring-1 ring-white/15 transition hover:bg-white/15 active:scale-95',
          open && 'bg-red-600 ring-red-500 hover:bg-red-600',
        )}
      >
        <User className="h-[18px] w-[18px]" />
      </button>

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
            role="menu"
            className="absolute right-0 top-full z-50 mt-2.5 w-72 max-w-[calc(100vw-1.5rem)] origin-top-right overflow-hidden rounded-2xl border border-neutral-200 bg-white text-neutral-900 shadow-2xl shadow-neutral-950/30 animate-drop-in"
          >
            <div className="flex items-center gap-3 border-b border-neutral-100 bg-neutral-50 px-4 py-3.5">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-neutral-900 text-white">
                <User className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-extrabold">Sales Team</p>
                <p className="truncate text-xs text-neutral-500">{CONFIG.companyName}</p>
              </div>
            </div>
            <div className="space-y-2.5 px-4 py-3.5 text-xs">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="h-4 w-4 shrink-0 text-neutral-400" />
                <span className="text-neutral-500">Source</span>
                <span className="ml-auto truncate pl-2 font-semibold text-neutral-800">{fileLabel}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 shrink-0 text-neutral-400" />
                <span className="text-neutral-500">Updated</span>
                <span className="ml-auto truncate pl-2 font-semibold text-neutral-800">{updatedText || '—'}</span>
              </div>
            </div>
            <div className="p-2 pt-0">
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setOpen(false);
                  onLogout();
                }}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-red-600 text-sm font-bold text-white transition hover:bg-red-700 active:scale-[0.98]"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

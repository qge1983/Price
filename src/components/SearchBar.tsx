import { useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';

export function SearchBar({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const ref = useRef<HTMLInputElement>(null);

  // Desktop shortcut: press "/" to jump to search
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (document.activeElement?.tagName || '').toLowerCase();
      if (e.key === '/' && tag !== 'input' && tag !== 'textarea') {
        e.preventDefault();
        ref.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <form
      role="search"
      className="relative"
      onSubmit={(e) => {
        e.preventDefault();
        ref.current?.blur(); // hides the phone keyboard
      }}
    >
      <Search className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-neutral-400" />
      <input
        ref={ref}
        type="search"
        inputMode="search"
        enterKeyHint="search"
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="none"
        spellCheck={false}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search model, company or product…"
        aria-label="Search rates"
        className="h-11 w-full rounded-xl border border-neutral-200 bg-neutral-50 pl-11 pr-11 text-base text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-red-500 focus:bg-white focus:ring-4 focus:ring-red-500/15"
      />
      {value && (
        <button
          type="button"
          onClick={() => {
            onChange('');
            ref.current?.focus();
          }}
          aria-label="Clear search"
          className="absolute right-1.5 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-neutral-400 transition hover:bg-neutral-200/70 hover:text-neutral-700"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </form>
  );
}

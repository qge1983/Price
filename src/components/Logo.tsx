import { cn } from '../utils/cn';

export function Logo({ size = 36, className }: { size?: number; className?: string }) {
  const small = size < 30;
  return (
    <span
      aria-hidden="true"
      className={cn(
        'relative inline-grid shrink-0 place-items-center overflow-hidden rounded-[28%] bg-gradient-to-br from-red-500 via-red-600 to-red-800 font-black leading-none text-white shadow-md shadow-red-950/40 ring-1 ring-inset ring-white/15',
        className,
      )}
      style={{ width: size, height: size, fontSize: small ? size * 0.55 : size * 0.31 }}
    >
      <span className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/25 to-transparent" />
      <span className="relative tracking-[-0.04em]">{small ? 'Q' : 'QGE'}</span>
    </span>
  );
}

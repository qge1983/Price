import { cn } from '../utils/cn';
import logoUrl from '../logo.png';

export function Logo({ size = 36, className }: { size?: number; className?: string }) {
  return (
    <img
      src={logoUrl}
      alt="Qaiser Group of Electronics logo"
      className={cn('inline-block shrink-0 object-contain', className)}
      style={{ width: size, height: size }}
    />
  );
}

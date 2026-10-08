import badge from '@/assets/verified-badge.png';
import { cn } from '@/lib/utils';

export function VerifiedBadge({ className }: { className?: string }) {
  return (
    <img
      src={badge}
      alt="Terverifikasi"
      title="Akun resmi terverifikasi"
      draggable={false}
      className={cn('inline-block w-4 h-4 shrink-0 select-none', className)}
    />
  );
}

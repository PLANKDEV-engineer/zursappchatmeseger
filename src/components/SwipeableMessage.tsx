import React, { useRef, useState } from 'react';
import { Reply } from 'lucide-react';

interface SwipeableMessageProps {
  children: React.ReactNode;
  onSwipeReply: () => void;
  isMe: boolean;
}

const DEAD_ZONE = 24;   // px of clear horizontal movement before anything moves
const TRIGGER = 70;     // px to trigger reply
const MAX = 90;

/** Swipe-right-to-reply that ignores taps, small wiggles and vertical scrolls. */
export function SwipeableMessage({ children, onSwipeReply }: SwipeableMessageProps) {
  const start = useRef<{ x: number; y: number } | null>(null);
  const mode = useRef<'idle' | 'swipe' | 'scroll'>('idle');
  const [dx, setDx] = useState(0);

  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    start.current = { x: t.clientX, y: t.clientY };
    mode.current = 'idle';
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (!start.current || mode.current === 'scroll') return;
    const t = e.touches[0];
    const mx = t.clientX - start.current.x;
    const my = t.clientY - start.current.y;
    if (mode.current === 'idle') {
      if (Math.abs(my) > 10 && Math.abs(my) > Math.abs(mx)) { mode.current = 'scroll'; return; }
      if (mx > DEAD_ZONE && mx > Math.abs(my) * 2) mode.current = 'swipe';
      else return;
    }
    setDx(Math.min(MAX, Math.max(0, mx - DEAD_ZONE)));
  };
  const onTouchEnd = () => {
    if (mode.current === 'swipe' && dx >= TRIGGER - DEAD_ZONE) onSwipeReply();
    start.current = null;
    mode.current = 'idle';
    setDx(0);
  };

  return (
    <div className="relative" onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd} onTouchCancel={onTouchEnd}>
      {dx > 0 && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2" style={{ opacity: Math.min(1, dx / 40) }}>
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
            <Reply className="w-4 h-4 text-primary" />
          </div>
        </div>
      )}
      <div
        style={{ transform: dx ? `translateX(${dx}px)` : undefined, transition: dx ? 'none' : 'transform 180ms ease-out' }}
      >
        {children}
      </div>
    </div>
  );
}

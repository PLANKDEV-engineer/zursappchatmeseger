import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface BottomNavProps {
  items: {
    icon: LucideIcon;
    label: string;
    path: string;
    badge?: number;
  }[];
  activeIndex: number;
  onNavigate: (index: number) => void;
}

export function BottomNav({ items, activeIndex, onNavigate }: BottomNavProps) {
  return (
    <nav className="bottom-nav">
      {items.map((item, index) => {
        const Icon = item.icon;
        const isActive = index === activeIndex;

        return (
          <button
            key={item.path}
            onClick={() => onNavigate(index)}
            className={`bottom-nav-item relative ${isActive ? 'active' : ''}`}
          >
            <div className="relative">
              <Icon
                className={`w-6 h-6 transition-all duration-300 nav-icon ${
                  isActive ? 'text-primary' : 'text-muted-foreground'
                }`}
              />
              {item.badge !== undefined && item.badge > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
                  {item.badge > 99 ? '99+' : item.badge}
                </span>
              )}
            </div>
            <span
              className={`text-xs transition-all duration-300 ${
                isActive ? 'text-primary font-medium' : 'text-muted-foreground'
              }`}
            >
              {item.label}
            </span>
            {isActive && (
              <motion.div
                layoutId="activeTab"
                className="absolute inset-0 bg-primary/10 rounded-xl -z-10"
                transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
              />
            )}
          </button>
        );
      })}
    </nav>
  );
}

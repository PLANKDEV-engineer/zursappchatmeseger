import React from 'react';
import { motion } from 'framer-motion';
import { User } from 'lucide-react';

interface AvatarProps {
  src?: string;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  isOnline?: boolean;
  showStatus?: boolean;
  isVerified?: boolean;
}

const sizes = {
  xs: 'w-8 h-8',
  sm: 'w-10 h-10',
  md: 'w-12 h-12',
  lg: 'w-16 h-16',
  xl: 'w-24 h-24',
};

const iconSizes = {
  xs: 'w-4 h-4',
  sm: 'w-5 h-5',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
  xl: 'w-12 h-12',
};

const statusSizes = {
  xs: 'w-2 h-2 border',
  sm: 'w-2.5 h-2.5 border-2',
  md: 'w-3 h-3 border-2',
  lg: 'w-4 h-4 border-2',
  xl: 'w-5 h-5 border-2',
};

export function Avatar({
  src,
  name,
  size = 'md',
  isOnline,
  showStatus = true,
  isVerified = false,
}: AvatarProps) {
  const initials = name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="relative inline-flex">
      <div
        className={`${sizes[size]} rounded-full overflow-hidden flex items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20 border border-border/50`}
      >
        {src ? (
          <img
            src={src}
            alt={name || 'Avatar'}
            className="w-full h-full object-cover"
          />
        ) : initials ? (
          <span className={`font-display font-semibold text-primary ${size === 'xl' ? 'text-2xl' : size === 'lg' ? 'text-xl' : 'text-sm'}`}>
            {initials}
          </span>
        ) : (
          <User className={`${iconSizes[size]} text-muted-foreground`} />
        )}
      </div>

      {showStatus && isOnline !== undefined && (
        <span
          className={`absolute bottom-0 right-0 ${statusSizes[size]} rounded-full border-background ${
            isOnline ? 'bg-success glow-success' : 'bg-offline'
          }`}
        />
      )}

      {isVerified && (
        <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-accent flex items-center justify-center">
          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      )}
    </div>
  );
}

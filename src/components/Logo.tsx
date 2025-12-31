import React from 'react';
import { motion } from 'framer-motion';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  animated?: boolean;
}

const sizes = {
  sm: 'w-8 h-8',
  md: 'w-12 h-12',
  lg: 'w-16 h-16',
  xl: 'w-24 h-24',
};

const textSizes = {
  sm: 'text-lg',
  md: 'text-2xl',
  lg: 'text-3xl',
  xl: 'text-4xl',
};

export function Logo({ size = 'md', showText = true, animated = true }: LogoProps) {
  const logoContent = (
    <div className="flex items-center gap-3">
      <div className={`${sizes[size]} relative`}>
        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary via-accent to-primary opacity-80" />
        <div className="absolute inset-[2px] rounded-xl bg-background flex items-center justify-center">
          <span className={`font-display font-bold text-gradient-primary ${size === 'xl' ? 'text-3xl' : size === 'lg' ? 'text-2xl' : size === 'md' ? 'text-xl' : 'text-base'}`}>
            Z
          </span>
        </div>
        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 animate-pulse-glow" />
      </div>
      {showText && (
        <div className="flex items-center gap-1">
          <span className={`font-display font-bold text-gradient-primary ${textSizes[size]}`}>
            ZursApp
          </span>
        </div>
      )}
    </div>
  );

  if (animated) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        {logoContent}
      </motion.div>
    );
  }

  return logoContent;
}

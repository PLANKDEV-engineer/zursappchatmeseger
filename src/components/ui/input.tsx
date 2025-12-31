import * as React from "react";

import { cn } from "@/lib/utils";

export interface InputProps extends React.ComponentProps<"input"> {
  variant?: "default" | "glass" | "glow";
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, variant = "default", ...props }, ref) => {
    const variants = {
      default: "bg-card border-border focus:border-primary focus:ring-primary/20",
      glass: "glass border-white/20 focus:border-primary/50 focus:ring-primary/20",
      glow: "bg-card border-border focus:border-primary focus:ring-2 focus:ring-primary/30 focus:shadow-[0_0_20px_hsla(187,85%,53%,0.2)]",
    };

    return (
      <input
        type={type}
        className={cn(
          "flex h-12 w-full rounded-xl border px-4 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-300 font-body",
          variants[variant],
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-md border px-2 py-0.5 text-xs font-semibold font-mono tracking-wide w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1.5 [&>svg]:pointer-events-none transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80",
        outline: "text-foreground border-border/80",
        success:
          "border-emerald-500/30 bg-emerald-500/10 text-emerald-400 shadow-sm",
        warning:
          "border-amber-500/30 bg-amber-500/10 text-amber-400 shadow-sm",
        info:
          "border-blue-500/30 bg-blue-500/10 text-blue-400 shadow-sm",
        critical:
          "border-rose-500/30 bg-rose-500/10 text-rose-400 shadow-sm",
        purple:
          "border-purple-500/30 bg-purple-500/10 text-purple-400 shadow-sm",
        cyan:
          "border-cyan-500/30 bg-cyan-500/10 text-cyan-400 shadow-sm",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };

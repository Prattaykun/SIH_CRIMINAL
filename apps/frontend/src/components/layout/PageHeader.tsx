import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { surfaceHeader } from "@/components/layout/surface";

type PageHeaderProps = {
  badge?: ReactNode;
  /** Rendered to the right of the title column (e.g. case picker). */
  leading?: ReactNode;
  title: ReactNode;
  description?: string;
  actions?: ReactNode;
  className?: string;
};

export function PageHeader({
  badge,
  leading,
  title,
  description,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn(surfaceHeader, className)}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 flex-1 flex-wrap items-start gap-3 md:gap-4">
          <div className="min-w-0 flex-1">
            {badge ? (
              typeof badge === "string" ? (
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-white/35">
                  {badge}
                </p>
              ) : (
                <div className="mb-2">{badge}</div>
              )
            ) : null}
            {typeof title === "string" ? (
              <h1 className="text-xl font-semibold tracking-tight text-white md:text-2xl">
                {title}
              </h1>
            ) : (
              title
            )}
            {description ? (
              <p className="mt-1.5 max-w-2xl text-sm text-white/45">{description}</p>
            ) : null}
          </div>
          {leading ? <div className="shrink-0 pt-0.5">{leading}</div> : null}
        </div>
        {actions ? (
          <div className="flex flex-wrap items-center gap-2">{actions}</div>
        ) : null}
      </div>
    </div>
  );
}

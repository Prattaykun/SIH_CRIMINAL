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
      <div className="flex max-h-[20vh] flex-col gap-3 overflow-y-auto sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="flex min-w-0 flex-1 items-start gap-3 md:gap-4 sm:max-w-[58%]">
          <div className="min-w-0 flex-1">
            {badge ? (
              typeof badge === "string" ? (
                <p className="mb-0.5 text-[11px] font-semibold uppercase tracking-wider text-white/35">
                  {badge}
                </p>
              ) : (
                <div className="mb-1">{badge}</div>
              )
            ) : null}
            {typeof title === "string" ? (
              <h1 className="line-clamp-2 text-lg font-semibold tracking-tight text-white md:text-xl">
                {title}
              </h1>
            ) : (
              title
            )}
            {description ? (
              <p className="mt-1 line-clamp-2 max-w-2xl text-xs text-white/45 sm:text-sm">
                {description}
              </p>
            ) : null}
          </div>
          {leading ? <div className="shrink-0 pt-0.5">{leading}</div> : null}
        </div>
        {actions ? (
          <div className="flex shrink-0 flex-wrap items-center gap-2 sm:max-w-[42%] sm:justify-end">
            {actions}
          </div>
        ) : null}
      </div>
    </div>
  );
}

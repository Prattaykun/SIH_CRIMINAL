import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { surfaceHeader } from "@/components/layout/surface";

type PageHeaderProps = {
  badge?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
};

export function PageHeader({
  badge,
  title,
  description,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn(surfaceHeader, className)}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          {badge ? (
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-white/35">
              {badge}
            </p>
          ) : null}
          <h1 className="text-xl font-semibold tracking-tight text-white md:text-2xl">
            {title}
          </h1>
          {description ? (
            <p className="mt-1.5 max-w-2xl text-sm text-white/45">{description}</p>
          ) : null}
        </div>
        {actions ? (
          <div className="flex flex-wrap items-center gap-2">{actions}</div>
        ) : null}
      </div>
    </div>
  );
}

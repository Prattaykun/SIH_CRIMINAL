'use client';

import type { ReactNode } from 'react';
import { Panel, useReactFlow, useStore, useStoreApi } from '@xyflow/react';
import { Lock, Maximize2, Unlock, ZoomIn, ZoomOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { surfaceCard } from '@/components/layout/surface';

type GraphControlsProps = {
  className?: string;
};

/**
 * Dark-theme zoom / fit / lock panel for the investigation graph.
 * Avoids default React Flow Controls (light fill + inherited white icons = blank white pill).
 */
export function GraphControls({ className }: GraphControlsProps) {
  const store = useStoreApi();
  const { zoomIn, zoomOut, fitView } = useReactFlow();
  const isInteractive = useStore(
    (s) => s.nodesDraggable && s.nodesConnectable && s.elementsSelectable
  );
  const minZoomReached = useStore((s) => s.transform[2] <= s.minZoom);
  const maxZoomReached = useStore((s) => s.transform[2] >= s.maxZoom);

  return (
    <Panel
      position="bottom-left"
      className={cn(
        surfaceCard,
        'flex flex-col overflow-hidden p-0',
        '!bottom-[calc(5.5rem+env(safe-area-inset-bottom))] !left-3 md:!bottom-4 md:!left-4',
        className
      )}
      data-testid="rf__controls"
      aria-label="Control Panel"
    >
      <ControlBtn
        label="Zoom in"
        disabled={maxZoomReached}
        onClick={() => zoomIn({ duration: 200 })}
      >
        <ZoomIn className="h-3.5 w-3.5" strokeWidth={2} />
      </ControlBtn>
      <ControlBtn
        label="Zoom out"
        disabled={minZoomReached}
        onClick={() => zoomOut({ duration: 200 })}
      >
        <ZoomOut className="h-3.5 w-3.5" strokeWidth={2} />
      </ControlBtn>
      <ControlBtn
        label="Fit view"
        onClick={() => fitView({ padding: 0.2, duration: 200 })}
      >
        <Maximize2 className="h-3.5 w-3.5" strokeWidth={2} />
      </ControlBtn>
      <ControlBtn
        label={isInteractive ? 'Lock interaction' : 'Unlock interaction'}
        onClick={() => {
          store.setState({
            nodesDraggable: !isInteractive,
            nodesConnectable: !isInteractive,
            elementsSelectable: !isInteractive,
          });
        }}
      >
        {isInteractive ? (
          <Unlock className="h-3.5 w-3.5" strokeWidth={2} />
        ) : (
          <Lock className="h-3.5 w-3.5" strokeWidth={2} />
        )}
      </ControlBtn>
    </Panel>
  );
}

function ControlBtn({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'flex h-8 w-8 items-center justify-center border-b border-white/[0.1]',
        'bg-[#0c0c0c] text-white/85 transition last:border-b-0',
        'hover:bg-white/[0.1] hover:text-white',
        'disabled:cursor-not-allowed disabled:opacity-35'
      )}
    >
      {children}
    </button>
  );
}

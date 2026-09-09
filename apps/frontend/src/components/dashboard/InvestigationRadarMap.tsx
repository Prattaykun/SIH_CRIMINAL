'use client';

import React, { useState } from 'react';
import {
  ZoomIn,
  ZoomOut,
  Crosshair,
  Compass,
  MapPin,
  Layers,
  Radio,
  Eye,
  ChevronDown,
  Navigation,
  Shield,
  Search,
  Building,
  Phone,
  Landmark,
} from 'lucide-react';

interface InvestigationRadarMapProps {
  selectedCase?: string;
}

export function InvestigationRadarMap({ selectedCase }: InvestigationRadarMapProps) {
  const [zoom, setZoom] = useState<number>(1);
  const [isSweepActive, setIsSweepActive] = useState<boolean>(true);
  const [selectedPin, setSelectedPin] = useState<string>('epicenter');

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.25, 2.5));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.25, 0.75));
  const handleReset = () => setZoom(1);

  return (
    <div className="rounded-2xl border border-[#212738] bg-[#111624] text-slate-100 flex flex-col overflow-hidden shadow-xl transition-colors">
      {/* Top Location Bar */}
      <div className="px-4 py-3 border-b border-[#1e2436] bg-[#141a2a]/70 flex items-center justify-between gap-2 text-xs font-sans">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
            <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-semibold text-slate-200">Central Surveillance Sector</span>
          </div>
        </div>

        <div className="flex items-center gap-1 text-slate-400 font-mono text-[11px] cursor-pointer hover:text-slate-200 transition-colors">
          <span className="truncate max-w-[180px] sm:max-w-[220px]">
            {selectedCase && selectedCase !== 'all' ? selectedCase : 'Logistics Hub (Sector CR-7C2)'}
          </span>
          <ChevronDown className="size-3.5 shrink-0" />
        </div>
      </div>

      {/* Map Canvas Viewport */}
      <div className="relative w-full h-[360px] sm:h-[400px] overflow-hidden select-none bg-[#0c101a]">
        {/* Map SVG Canvas */}
        <div
          className="w-full h-full transition-transform duration-300 ease-out origin-center"
          style={{ transform: `scale(${zoom})` }}
        >
          <svg
            viewBox="0 0 600 500"
            className="w-full h-full object-cover"
            preserveAspectRatio="xMidYMid slice"
          >
            <defs>
              {/* Radar sweep gradient */}
              <linearGradient id="radarSweepGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#5db329" stopOpacity="0.45" />
                <stop offset="50%" stopColor="#5db329" stopOpacity="0.1" />
                <stop offset="100%" stopColor="#5db329" stopOpacity="0" />
              </linearGradient>

              {/* Pulse ripple pattern */}
              <radialGradient id="epicenterGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#5db329" stopOpacity="0.7" />
                <stop offset="40%" stopColor="#5db329" stopOpacity="0.3" />
                <stop offset="80%" stopColor="#5db329" stopOpacity="0.1" />
                <stop offset="100%" stopColor="#5db329" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* Base Tactical Grid Background */}
            <rect width="600" height="500" fill="#0d111c" />

            {/* Tactical Grid Zones (Industrial, Cargo, River) */}
            <path
              d="M 120 180 Q 160 140 220 160 T 290 220 Q 320 300 240 330 T 140 300 Z"
              fill="#064e3b25"
              stroke="#065f4640"
              strokeWidth="1.5"
            />
            <path
              d="M 330 200 Q 390 180 430 230 T 420 310 Q 360 340 330 290 Z"
              fill="#064e3b18"
              stroke="#065f4630"
              strokeWidth="1"
            />
            <path
              d="M 90 380 Q 150 350 210 400 T 230 480 Q 130 490 80 440 Z"
              fill="#064e3b18"
              stroke="#065f4630"
              strokeWidth="1"
            />

            {/* River / Maritime Smuggling Basin */}
            <path
              d="M 335 240 Q 370 230 380 260 T 360 290 Q 330 280 335 240 Z"
              fill="#0369a128"
              stroke="#0284c740"
              strokeWidth="1"
            />

            {/* Road & Transit Grid (Tactical Coordinates) */}
            <g stroke="#1e2738" strokeWidth="2.5" fill="none" strokeLinecap="round">
              <line x1="0" y1="90" x2="600" y2="120" strokeWidth="3.5" stroke="#253248" />
              <line x1="0" y1="210" x2="600" y2="240" strokeWidth="3" stroke="#253248" />
              <line x1="0" y1="360" x2="600" y2="340" strokeWidth="3.5" stroke="#253248" />

              <line x1="90" y1="0" x2="140" y2="500" strokeWidth="3" stroke="#253248" />
              <line x1="260" y1="0" x2="280" y2="500" strokeWidth="3.5" stroke="#253248" />
              <line x1="450" y1="0" x2="430" y2="500" strokeWidth="3" stroke="#253248" />

              <path d="M 40 40 L 260 50 M 260 50 L 560 60" stroke="#182030" />
              <path d="M 20 140 L 250 150 M 290 150 L 580 170" stroke="#182030" />
              <path d="M 40 280 L 260 270 M 280 270 L 560 290" stroke="#182030" />
              <path d="M 30 420 L 250 430 M 290 430 L 570 410" stroke="#182030" />

              <path d="M 180 30 L 190 480" stroke="#182030" />
              <path d="M 350 20 L 360 480" stroke="#182030" />
              <path d="M 520 30 L 500 480" stroke="#182030" />
            </g>

            {/* Tactical Sector Labels (Criminal Intelligence Landmarks) */}
            <g fill="#475569" fontSize="8.5" fontWeight="600" fontFamily="monospace" letterSpacing="0.8">
              <text x="30" y="195">CENTRAL RAILYARD</text>
              <text x="130" y="195">CARGO DEPOT 4</text>
              <text x="130" y="275">HAWALA TRANSIT CORRIDOR</text>
              <text x="210" y="360">SAFEHOUSE ALPHA</text>
              <text x="375" y="255">MARITIME BASIN</text>
              <text x="440" y="305">SHELL SUITE 902</text>
              <text x="310" y="380">TELECOM TOWER RELAY</text>
              <text x="95" y="420">FINANCIAL DISTRICT</text>
              <text x="315" y="445">DEPOT PERIMETER</text>
              <text x="420" y="445">PORT GATEWAY</text>
            </g>

            {/* Radar Epicenter & Range Circles */}
            <g transform="translate(290, 290)">
              {/* Outer Range Ring (300m) */}
              <circle
                r="110"
                fill="none"
                stroke="#5db329"
                strokeWidth="1"
                strokeDasharray="4 4"
                opacity="0.35"
              />

              {/* Mid Range Ring (150m) */}
              <circle
                r="70"
                fill="none"
                stroke="#5db329"
                strokeWidth="1.2"
                opacity="0.5"
              />

              {/* Inner Range Ring (50m) with Translucent Fill */}
              <circle
                r="40"
                fill="url(#epicenterGlow)"
                stroke="#5db329"
                strokeWidth="1.5"
                opacity="0.85"
              />

              {/* Rotating Radar Sweep Beam */}
              {isSweepActive && (
                <g className="animate-[spin_4s_linear_infinite] origin-center">
                  <path
                    d="M 0 0 L 110 0 A 110 110 0 0 1 78 78 Z"
                    fill="url(#radarSweepGradient)"
                  />
                  <line
                    x1="0"
                    y1="0"
                    x2="110"
                    y2="0"
                    stroke="#5db329"
                    strokeWidth="1.8"
                    opacity="0.8"
                  />
                </g>
              )}

              {/* Epicenter Target Dot: Syndicate Hub */}
              <circle
                r="6"
                fill="#5db329"
                stroke="#ffffff"
                strokeWidth="2"
                className="drop-shadow-md cursor-pointer"
                onClick={() => setSelectedPin('epicenter')}
              />
              <circle
                r="12"
                fill="#5db329"
                opacity="0.3"
                className="animate-ping"
              />
            </g>

            {/* Secondary Criminal Entity Pins */}
            <g>
              {/* Telecom Tower Pin */}
              <g
                transform="translate(195, 170)"
                className="cursor-pointer"
                onClick={() => setSelectedPin('telecom')}
              >
                <circle r="4.5" fill="#3b82f6" stroke="#ffffff" strokeWidth="1.5" />
                <circle r="9" fill="#3b82f6" opacity="0.25" />
              </g>

              {/* Financial Account Node */}
              <g
                transform="translate(385, 220)"
                className="cursor-pointer"
                onClick={() => setSelectedPin('financial')}
              >
                <circle r="4.5" fill="#f59e0b" stroke="#ffffff" strokeWidth="1.5" />
                <circle r="9" fill="#f59e0b" opacity="0.25" />
              </g>

              {/* Shell Vehicle Node */}
              <g
                transform="translate(420, 360)"
                className="cursor-pointer"
                onClick={() => setSelectedPin('vehicle')}
              >
                <circle r="4.5" fill="#ef4444" stroke="#ffffff" strokeWidth="1.5" />
                <circle r="9" fill="#ef4444" opacity="0.25" />
              </g>
            </g>
          </svg>
        </div>

        {/* Floating Right Map Controls (Matching Reference Image) */}
        <div className="absolute top-3 right-3 flex flex-col gap-1.5 z-10">
          <button
            onClick={() => setIsSweepActive(!isSweepActive)}
            title="Toggle Radar Sweep"
            className="p-1.5 rounded-lg border border-[#232b3f] bg-[#151b2a] text-slate-300 hover:text-white hover:bg-slate-800 shadow-md transition-all"
          >
            <Search className="size-3.5" />
          </button>
          <button
            onClick={handleZoomIn}
            title="Zoom In"
            className="p-1.5 rounded-lg border border-[#232b3f] bg-[#151b2a] text-slate-300 hover:text-white hover:bg-slate-800 shadow-md transition-all"
          >
            <ZoomIn className="size-3.5" />
          </button>
          <button
            onClick={handleZoomOut}
            title="Zoom Out"
            className="p-1.5 rounded-lg border border-[#232b3f] bg-[#151b2a] text-slate-300 hover:text-white hover:bg-slate-800 shadow-md transition-all"
          >
            <ZoomOut className="size-3.5" />
          </button>
          <button
            onClick={handleReset}
            title="Reset Target Center"
            className="p-1.5 rounded-lg border border-[#232b3f] bg-[#151b2a] text-slate-300 hover:text-white hover:bg-slate-800 shadow-md transition-all"
          >
            <Crosshair className="size-3.5" />
          </button>
          <button
            title="Tactical Compass"
            className="p-1.5 rounded-lg border border-[#232b3f] bg-[#151b2a] text-slate-300 hover:text-white hover:bg-slate-800 shadow-md transition-all"
          >
            <Navigation className="size-3.5 text-emerald-400 transform rotate-45" />
          </button>
        </div>

        {/* Floating Telemetry Overlay (Bottom) */}
        <div className="absolute bottom-3 left-3 right-3 rounded-xl border border-[#232b3f] bg-[#111624]/95 p-2.5 backdrop-blur-md shadow-lg flex items-center justify-between text-[11px] font-sans">
          <div className="flex items-center gap-2">
            <span className="relative flex size-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#5db329] opacity-75"></span>
              <span className="relative inline-flex rounded-full size-2 bg-[#5db329]"></span>
            </span>
            <div className="truncate">
              <span className="font-bold text-white">Target Epicenter:</span>{' '}
              <span className="font-mono text-emerald-400">
                {selectedPin === 'epicenter'
                  ? 'Marcuz Kowalski Syndicate Hub'
                  : selectedPin === 'telecom'
                  ? 'CDR Telecom Relay #882'
                  : selectedPin === 'financial'
                  ? 'Hawala Shell Branch Node'
                  : 'Transit Courier Vehicle'}
              </span>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2 font-mono text-[10px] text-slate-400">
            <span>28.6139° N, 77.2090° E</span>
            <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-semibold">
              Live Neo4j Sync
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

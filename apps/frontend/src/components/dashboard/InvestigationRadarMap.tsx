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
} from 'lucide-react';

interface InvestigationRadarMapProps {
  isDark?: boolean;
  selectedCase?: string;
  onCaseChange?: (caseId: string) => void;
}

export function InvestigationRadarMap({
  isDark = false,
  selectedCase,
}: InvestigationRadarMapProps) {
  const [zoom, setZoom] = useState<number>(1);
  const [activeLayer, setActiveLayer] = useState<'all' | 'radar' | 'entities'>('all');
  const [isSweepActive, setIsSweepActive] = useState<boolean>(true);
  const [selectedPin, setSelectedPin] = useState<string | null>('epicenter');

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.25, 2.5));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.25, 0.75));
  const handleReset = () => setZoom(1);

  return (
    <div
      className={`rounded-2xl border flex flex-col overflow-hidden shadow-sm transition-colors ${
        isDark
          ? 'bg-[#111624] border-[#212738] text-slate-100'
          : 'bg-white border-slate-200/90 text-slate-800'
      }`}
    >
      {/* Top Location Bar */}
      <div
        className={`px-4 py-3 border-b flex items-center justify-between gap-2 text-xs font-sans ${
          isDark
            ? 'border-[#1e2436] bg-[#141a2a]/60'
            : 'border-slate-100 bg-slate-50/70'
        }`}
      >
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-blue-600 font-medium">
            <span className="size-2 rounded-full bg-blue-600" />
            <span className="font-semibold">East 7th Sector</span>
          </div>
        </div>

        <div className="flex items-center gap-1 text-slate-500 font-medium cursor-pointer hover:text-slate-800 transition-colors">
          <span className="truncate max-w-[170px] sm:max-w-[210px]">
            7th &amp; Comal (Segment ID: 7C2)
          </span>
          <ChevronDown className="size-3.5 shrink-0" />
        </div>
      </div>

      {/* Map Canvas Viewport */}
      <div className="relative w-full h-[380px] sm:h-[420px] overflow-hidden select-none">
        {/* Map SVG Canvas with scalable vector paths */}
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
                <stop offset="0%" stopColor="#5db329" stopOpacity="0.4" />
                <stop offset="50%" stopColor="#5db329" stopOpacity="0.08" />
                <stop offset="100%" stopColor="#5db329" stopOpacity="0" />
              </linearGradient>

              {/* Pulse ripple pattern */}
              <radialGradient id="epicenterGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#5db329" stopOpacity="0.6" />
                <stop offset="40%" stopColor="#5db329" stopOpacity="0.25" />
                <stop offset="80%" stopColor="#5db329" stopOpacity="0.1" />
                <stop offset="100%" stopColor="#5db329" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* Base Landmass Background */}
            <rect
              width="600"
              height="500"
              fill={isDark ? '#0f1422' : '#f7f9fa'}
            />

            {/* Natural Park Reservoirs & Green Areas */}
            <path
              d="M 120 180 Q 160 140 220 160 T 290 220 Q 320 300 240 330 T 140 300 Z"
              fill={isDark ? '#064e3b33' : '#e6f4ea'}
              stroke={isDark ? '#065f4655' : '#cde7d5'}
              strokeWidth="1.5"
            />
            <path
              d="M 330 200 Q 390 180 430 230 T 420 310 Q 360 340 330 290 Z"
              fill={isDark ? '#064e3b25' : '#eaf6ec'}
              stroke={isDark ? '#065f4640' : '#d2ebd7'}
              strokeWidth="1"
            />
            <path
              d="M 90 380 Q 150 350 210 400 T 230 480 Q 130 490 80 440 Z"
              fill={isDark ? '#064e3b25' : '#eaf6ec'}
              stroke={isDark ? '#065f4640' : '#d2ebd7'}
              strokeWidth="1"
            />

            {/* Water Bodies & Lake Reservoirs */}
            <path
              d="M 335 240 Q 370 230 380 260 T 360 290 Q 330 280 335 240 Z"
              fill={isDark ? '#0369a133' : '#dff0fa'}
              stroke={isDark ? '#0284c755' : '#c3e2f5'}
              strokeWidth="1"
            />

            {/* Street Grid Lines (Tactical Road Network) */}
            <g
              stroke={isDark ? '#1e293b' : '#e2e8f0'}
              strokeWidth="2.5"
              fill="none"
              strokeLinecap="round"
            >
              {/* Main Arterials */}
              <line x1="0" y1="90" x2="600" y2="120" strokeWidth="4" stroke={isDark ? '#283548' : '#cbd5e1'} />
              <line x1="0" y1="210" x2="600" y2="240" strokeWidth="3" stroke={isDark ? '#283548' : '#cbd5e1'} />
              <line x1="0" y1="360" x2="600" y2="340" strokeWidth="3.5" stroke={isDark ? '#283548' : '#cbd5e1'} />

              {/* Vertical / Diagonal Arterials */}
              <line x1="90" y1="0" x2="140" y2="500" strokeWidth="3.5" stroke={isDark ? '#283548' : '#cbd5e1'} />
              <line x1="260" y1="0" x2="280" y2="500" strokeWidth="4" stroke={isDark ? '#283548' : '#cbd5e1'} />
              <line x1="450" y1="0" x2="430" y2="500" strokeWidth="3" stroke={isDark ? '#283548' : '#cbd5e1'} />

              {/* Secondary Street Grid */}
              <path d="M 40 40 L 260 50 M 260 50 L 560 60" />
              <path d="M 20 140 L 250 150 M 290 150 L 580 170" />
              <path d="M 40 280 L 260 270 M 280 270 L 560 290" />
              <path d="M 30 420 L 250 430 M 290 430 L 570 410" />

              <path d="M 180 30 L 190 480" />
              <path d="M 350 20 L 360 480" />
              <path d="M 520 30 L 500 480" />

              {/* Curved Park / Valley Drives */}
              <path d="M 140 160 Q 220 190 280 180 T 400 210" strokeDasharray="4 3" strokeWidth="2" />
              <path d="M 160 320 Q 240 290 300 320 T 420 300" strokeDasharray="4 3" strokeWidth="2" />
            </g>

            {/* Tactical Sector Labels matching reference image */}
            <g
              fill={isDark ? '#64748b' : '#94a3b8'}
              fontSize="9"
              fontWeight="600"
              fontFamily="sans-serif"
              letterSpacing="0.8"
            >
              <text x="30" y="195">RICHMOND</text>
              <text x="130" y="195">WEST NEW BRIGHTON</text>
              <text x="130" y="275">WEST BRIGHTON</text>
              <text x="210" y="360">Clove Lakes Park</text>
              <text x="375" y="255">SILVER LAKE</text>
              <text x="440" y="305">FOX HILLS</text>
              <text x="310" y="380">EMERSON HILL</text>
              <text x="95" y="420">CASTLETON CORNERS</text>
              <text x="315" y="445">TODT HILL</text>
              <text x="420" y="445">OLD TOWN</text>
              <text x="410" y="480">DONGAN HILLS</text>
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

              {/* Epicenter Target Dot */}
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

            {/* Secondary Extracted Entity Pins */}
            {activeLayer === 'all' && (
              <g>
                {/* Pin 1: Telecom Cell Tower */}
                <g
                  transform="translate(195, 170)"
                  className="cursor-pointer"
                  onClick={() => setSelectedPin('cell-tower')}
                >
                  <circle r="4" fill="#3b82f6" stroke="#ffffff" strokeWidth="1.5" />
                  <circle r="8" fill="#3b82f6" opacity="0.2" />
                </g>

                {/* Pin 2: Financial Branch Node */}
                <g
                  transform="translate(385, 220)"
                  className="cursor-pointer"
                  onClick={() => setSelectedPin('fiu-node')}
                >
                  <circle r="4" fill="#f59e0b" stroke="#ffffff" strokeWidth="1.5" />
                  <circle r="8" fill="#f59e0b" opacity="0.2" />
                </g>

                {/* Pin 3: Vehicle Sighting Route */}
                <g
                  transform="translate(420, 360)"
                  className="cursor-pointer"
                  onClick={() => setSelectedPin('vehicle-node')}
                >
                  <circle r="4" fill="#ef4444" stroke="#ffffff" strokeWidth="1.5" />
                  <circle r="8" fill="#ef4444" opacity="0.2" />
                </g>
              </g>
            )}
          </svg>
        </div>

        {/* Floating Right Map Controls (Matching Reference Image) */}
        <div className="absolute top-3 right-3 flex flex-col gap-1 z-10">
          <button
            onClick={() => setIsSweepActive(!isSweepActive)}
            title="Toggle Radar Sweep"
            className={`p-1.5 rounded-lg border shadow-sm transition-all ${
              isDark
                ? 'bg-[#151b2a] border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800'
                : 'bg-white border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Search className="size-3.5" />
          </button>
          <button
            onClick={handleZoomIn}
            title="Zoom In"
            className={`p-1.5 rounded-lg border shadow-sm transition-all ${
              isDark
                ? 'bg-[#151b2a] border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800'
                : 'bg-white border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <ZoomIn className="size-3.5" />
          </button>
          <button
            onClick={handleZoomOut}
            title="Zoom Out"
            className={`p-1.5 rounded-lg border shadow-sm transition-all ${
              isDark
                ? 'bg-[#151b2a] border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800'
                : 'bg-white border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <ZoomOut className="size-3.5" />
          </button>
          <button
            onClick={handleReset}
            title="Reset Target Center"
            className={`p-1.5 rounded-lg border shadow-sm transition-all ${
              isDark
                ? 'bg-[#151b2a] border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800'
                : 'bg-white border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Crosshair className="size-3.5" />
          </button>
          <button
            title="Tactical Compass"
            className={`p-1.5 rounded-lg border shadow-sm transition-all ${
              isDark
                ? 'bg-[#151b2a] border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800'
                : 'bg-white border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Navigation className="size-3.5 text-blue-500 transform rotate-45" />
          </button>
        </div>

        {/* Floating Telemetry Overlay (Bottom Left) */}
        <div
          className={`absolute bottom-3 left-3 right-3 rounded-xl border p-2.5 backdrop-blur-md shadow-md flex items-center justify-between text-[11px] font-sans transition-colors ${
            isDark
              ? 'bg-[#111624]/90 border-[#232b3f] text-slate-200'
              : 'bg-white/95 border-slate-200 text-slate-700'
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="relative flex size-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#5db329] opacity-75"></span>
              <span className="relative inline-flex rounded-full size-2 bg-[#5db329]"></span>
            </span>
            <div className="truncate">
              <span className="font-bold text-slate-900 dark:text-white">Active Sector Zone:</span>{' '}
              <span className="font-mono text-slate-500 dark:text-slate-400">
                {selectedCase ? `${selectedCase} Telemetry` : 'Cargo Hub (SYN-7C2)'}
              </span>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2 font-mono text-[10px] text-slate-500">
            <span>30.2672° N, 97.7431° W</span>
            <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 font-semibold">
              Live Link
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

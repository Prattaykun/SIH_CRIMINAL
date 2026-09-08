"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showUserMenu, setShowUserMenu] = useState(false);

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "Cases", href: "/cases" },
    { name: "Graph", href: "/graph" },
    { name: "Evidence", href: "/evidence" },
    { name: "Verification", href: "/audit" },
    { name: "Settings", href: "/settings" },
  ];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/cases?search=${encodeURIComponent(searchQuery.trim())}`);
      setShowSearchModal(false);
      setSearchQuery("");
    }
  };

  return (
    <header className="h-16 bg-[#0c0f17]/90 backdrop-blur-md border-b border-[#1f2536] px-6 lg:px-8 flex items-center justify-between sticky top-0 z-40 transition-colors">
      {/* Left: Branding & Logo */}
      <div className="flex items-center gap-4 shrink-0">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/20 font-bold text-sm group-hover:scale-105 transition-transform">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-slate-100 tracking-wide text-sm font-mono">
                SIH 26189
              </span>
              <span className="text-[9px] uppercase font-mono px-1.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30 font-bold">
                Intel
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium hidden sm:block">
              Criminal Network Analysis
            </p>
          </div>
        </Link>

        <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/25 text-[10px] font-mono text-amber-400">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
          <span>SYNTHETIC DATA ONLY</span>
        </div>
      </div>

      {/* Center: Floating Pill Navigation Bar (Matching Reference Image) */}
      <nav className="flex items-center bg-[#131722] border border-[#23293a] rounded-full p-1 shadow-inner gap-1">
        {navLinks.map((link) => {
          const isActive = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
          return (
            <Link
              key={link.name}
              href={link.href}
              className={`text-xs px-3.5 py-1.5 rounded-full font-medium transition-all duration-150 ${
                isActive
                  ? "bg-[#1f2638] text-white border border-[#3b4560] shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
              }`}
            >
              {link.name}
            </Link>
          );
        })}
      </nav>

      {/* Right: Search, Notifications & User Avatar (Matching Reference Image) */}
      <div className="flex items-center gap-2.5 shrink-0">
        {/* Search Circle Trigger */}
        <button
          onClick={() => setShowSearchModal(true)}
          className="w-9 h-9 rounded-full bg-[#131722] border border-[#23293a] flex items-center justify-center text-slate-400 hover:text-white hover:border-slate-600 transition-colors shadow-sm"
          title="Search cases, suspects, phone numbers"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </button>

        {/* Notifications Circle Trigger */}
        <button
          onClick={() => router.push('/audit')}
          className="w-9 h-9 rounded-full bg-[#131722] border border-[#23293a] flex items-center justify-center text-slate-400 hover:text-white hover:border-slate-600 transition-colors shadow-sm relative"
          title="Verification Alerts"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-[#0c0f17]"></span>
        </button>

        {/* User Profile Avatar with dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-900 to-slate-800 border border-slate-700 overflow-hidden flex items-center justify-center text-xs font-bold text-slate-200 hover:ring-2 hover:ring-blue-500/50 transition shadow-sm"
          >
            {user?.username ? user.username.slice(0, 2).toUpperCase() : "IN"}
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-52 rounded-2xl bg-[#141824] border border-[#23293a] shadow-2xl py-2 z-50 text-xs animate-in fade-in zoom-in-95">
              <div className="px-4 py-2 border-b border-[#23293a]">
                <div className="font-semibold text-slate-200">{user?.username || "demo_investigator"}</div>
                <div className="text-[10px] text-blue-400 uppercase tracking-wider">{user?.role || "INVESTIGATOR"}</div>
              </div>
              <Link
                href="/cases"
                onClick={() => setShowUserMenu(false)}
                className="block px-4 py-2 text-slate-300 hover:bg-slate-800/70 hover:text-white"
              >
                Case Management
              </Link>
              <Link
                href="/audit"
                onClick={() => setShowUserMenu(false)}
                className="block px-4 py-2 text-slate-300 hover:bg-slate-800/70 hover:text-white"
              >
                Verification Log
              </Link>
              <div className="border-t border-[#23293a] my-1"></div>
              <button
                onClick={() => {
                  setShowUserMenu(false);
                  logout();
                }}
                className="w-full text-left px-4 py-2 text-red-400 hover:bg-red-500/10 transition"
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Global Quick Search Modal */}
      {showSearchModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-start justify-center pt-24 z-50 p-4">
          <div className="bg-[#121622] border border-[#262e42] rounded-2xl max-w-lg w-full p-4 shadow-2xl">
            <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 border-b border-[#23293a] pb-3">
              <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search cases, suspects, phones, accounts..."
                className="bg-transparent border-none outline-none text-slate-100 placeholder-slate-500 text-sm flex-1"
              />
              <button
                type="button"
                onClick={() => setShowSearchModal(false)}
                className="text-xs text-slate-500 hover:text-slate-300 px-2 py-1 rounded bg-slate-800"
              >
                ESC
              </button>
            </form>
            <div className="pt-3 text-[11px] text-slate-400 flex items-center justify-between">
              <span>Quick synthetic search: Press Enter to query cases</span>
              <span className="font-mono text-emerald-400">Strictly Synthetic Data</span>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

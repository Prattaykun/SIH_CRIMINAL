"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import React, { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  Briefcase,
  Ellipsis,
  FileSearch,
  FolderOpen,
  LayoutDashboard,
  LogOut,
  Network,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Settings,
  Shield,
  Users,
  Zap,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import {
  navItemActive,
  navItemBase,
  navItemIdle,
  surfaceInput,
  surfacePage,
} from "@/components/layout/surface";

const STORAGE_KEY = "sih-sidebar-collapsed";

type NavItem = {
  name: string;
  href: string;
  icon: typeof LayoutDashboard;
  group: string;
  match?: (pathname: string) => boolean;
};

type AppShellProps = {
  children: ReactNode;
};

function isNavActive(item: NavItem, pathname: string): boolean {
  if (item.match) return item.match(pathname);
  return pathname === item.href || pathname.startsWith(item.href + "/");
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname() || "/";
  const router = useRouter();
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  const pathParts = pathname.split("/");
  const currentCaseId =
    pathParts[1] === "cases" && pathParts[2] && pathParts[2] !== "new"
      ? pathParts[2]
      : null;

  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY) === "1") setCollapsed(true);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    setMoreOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!moreOpen) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!moreRef.current?.contains(event.target as Node)) {
        setMoreOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMoreOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [moreOpen]);

  const toggle = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  const navItems: NavItem[] = useMemo(
    () => [
      {
        name: "Home",
        href: "/",
        icon: LayoutDashboard,
        group: "Main",
        match: (p) => p === "/",
      },
      {
        name: "Cases",
        href: "/cases",
        icon: Briefcase,
        group: "Main",
        match: (p) =>
          p === "/cases" ||
          p === "/cases/new" ||
          /^\/cases\/[^/]+$/.test(p),
      },
      {
        name: "Graph",
        href: currentCaseId ? `/cases/${currentCaseId}/graph` : "/graph",
        icon: Network,
        group: "Investigation",
        match: (p) => p === "/graph" || p.includes("/graph"),
      },
      {
        name: "Evidence",
        href: currentCaseId ? `/cases/${currentCaseId}/evidence` : "/evidence",
        icon: FolderOpen,
        group: "Investigation",
        match: (p) => p === "/evidence" || p.includes("/evidence"),
      },
      ...(currentCaseId
        ? [
            {
              name: "Team & Tasks",
              href: `/cases/${currentCaseId}/collaboration`,
              icon: Users,
              group: "Investigation",
              match: (p: string) => p.includes("/collaboration"),
            },
          ]
        : []),
      {
        name: "Verification",
        href: "/audit",
        icon: Shield,
        group: "System",
        match: (p) => p.startsWith("/audit"),
      },
      {
        name: "Settings",
        href: "/settings",
        icon: Settings,
        group: "System",
        match: (p) => p.startsWith("/settings"),
      },
    ],
    [currentCaseId]
  );

  // Bottom bar: 4 primary destinations + More drop-up for the rest.
  const mobilePrimary = navItems.slice(0, 4);
  const mobileOverflow = navItems.slice(4);
  const moreActive = mobileOverflow.some((item) => isNavActive(item, pathname));

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/cases?search=${encodeURIComponent(searchQuery.trim())}`);
      setShowSearchModal(false);
      setSearchQuery("");
      setMoreOpen(false);
    }
  };

  let lastGroup = "";

  return (
    <div className="flex h-screen overflow-hidden bg-black text-white">
      {/* Desktop / tablet sidebar */}
      <aside
        className={cn(
          "relative hidden shrink-0 flex-col border-r border-white/[0.08] bg-[#030303] transition-[width] duration-300 md:flex",
          collapsed ? "w-[68px]" : "w-[248px]"
        )}
      >
        <div className="pointer-events-none absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-white/[0.08] to-transparent" />

        <div
          className={cn(
            "shrink-0 border-b border-white/[0.07]",
            collapsed ? "px-2 py-4" : "px-4 py-4"
          )}
        >
          <div
            className={cn(
              "flex items-center",
              collapsed ? "flex-col gap-3" : "gap-3"
            )}
          >
            <button
              type="button"
              onClick={toggle}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/[0.1] bg-white/[0.04] text-white/60 hover:bg-white/[0.08] hover:text-white"
            >
              {collapsed ? (
                <PanelLeftOpen className="h-4 w-4" />
              ) : (
                <PanelLeftClose className="h-4 w-4" />
              )}
            </button>
            {!collapsed && (
              <Link href="/" className="flex min-w-0 flex-1 items-center gap-3">
                <div className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/[0.12] bg-[#0b101e] shadow-md">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/logo.png"
                    alt="GoyendaBondhu Logo"
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">
                    GoyendaBondhu
                  </p>
                  <p className="truncate text-[11px] text-white/40">
                    Criminal Network Analysis
                  </p>
                </div>
              </Link>
            )}
          </div>
          {!collapsed && (
            <div className="mt-3 flex items-center gap-1.5 rounded-full border border-amber-500/25 bg-amber-500/10 px-2.5 py-1 text-[10px] font-mono text-amber-400">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-400" />
              <span>SYNTHETIC DATA ONLY</span>
            </div>
          )}
        </div>

        <nav className="sih-no-scrollbar min-h-0 flex-1 overflow-y-auto px-3 py-3">
          {navItems.map((item) => {
            const showGroup =
              !collapsed && item.group && item.group !== lastGroup;
            if (item.group) lastGroup = item.group;
            const active = isNavActive(item, pathname);
            const Icon = item.icon;
            return (
              <div key={`${item.group}-${item.name}`}>
                {showGroup && (
                  <p className="mb-2 mt-4 px-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/28 first:mt-0">
                    {item.group}
                  </p>
                )}
                <Link
                  href={item.href}
                  title={item.name}
                  className={cn(
                    navItemBase,
                    collapsed ? "justify-center py-2.5" : "gap-3 px-3 py-2.5",
                    active ? navItemActive : navItemIdle
                  )}
                >
                  {active && (
                    <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-blue-500" />
                  )}
                  <span
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                      active
                        ? "bg-blue-600/25 text-blue-300"
                        : "bg-white/[0.04] text-white/50 group-hover:text-white/80"
                    )}
                  >
                    <Icon className="h-4 w-4" strokeWidth={1.75} />
                  </span>
                  {!collapsed && (
                    <span className="text-sm font-medium">{item.name}</span>
                  )}
                </Link>
              </div>
            );
          })}
        </nav>

        <div
          className={cn(
            "shrink-0 space-y-1 border-t border-white/[0.07]",
            collapsed ? "p-2" : "p-3"
          )}
        >
          <button
            type="button"
            onClick={() => setShowSearchModal(true)}
            title="Search cases"
            className={cn(
              "flex w-full items-center rounded-xl text-white/55 hover:bg-white/[0.05] hover:text-white/80",
              collapsed ? "justify-center py-2.5" : "gap-3 px-3 py-2.5 text-sm"
            )}
          >
            <Search className="h-4 w-4 shrink-0" />
            {!collapsed && <span>Search</span>}
          </button>
          <Link
            href="/audit"
            title="Verification"
            className={cn(
              "flex w-full items-center rounded-xl text-white/55 hover:bg-white/[0.05] hover:text-white/80",
              collapsed ? "justify-center py-2.5" : "gap-3 px-3 py-2.5 text-sm"
            )}
          >
            <FileSearch className="h-4 w-4 shrink-0" />
            {!collapsed && <span>Alerts</span>}
          </Link>
          {!collapsed && user && (
            <div className="px-2 py-2">
              <p className="truncate text-[11px] font-medium text-white/70">
                {user.username}
              </p>
              <p className="truncate text-[10px] uppercase tracking-wider text-blue-400/80">
                {user.role}
              </p>
            </div>
          )}
          <button
            type="button"
            onClick={() => logout()}
            title="Sign out"
            className={cn(
              "flex w-full items-center rounded-xl text-white/55 hover:bg-red-500/10 hover:text-red-300",
              collapsed ? "justify-center py-2.5" : "gap-3 px-3 py-2.5 text-sm"
            )}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!collapsed && <span>Sign out</span>}
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <main
          className={cn(
            surfacePage,
            "sih-no-scrollbar min-h-0 flex-1 overflow-y-auto"
          )}
        >
          <div className="min-h-full w-full p-5 pb-[calc(5.25rem+env(safe-area-inset-bottom))] sm:p-6 md:pb-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile bottom tabs */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-white/[0.08] bg-[#030303]/95 backdrop-blur-md md:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        aria-label="Primary"
      >
        <div className="grid h-[4.25rem] grid-cols-5">
          {mobilePrimary.map((item) => {
            const active = isNavActive(item, pathname);
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "relative flex flex-col items-center justify-center gap-1 px-1 text-[10px] font-medium transition",
                  active ? "text-blue-300" : "text-white/45 hover:text-white/75"
                )}
              >
                {active && (
                  <span className="absolute inset-x-4 top-0 h-0.5 rounded-b-full bg-blue-500" />
                )}
                <span
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-xl",
                    active ? "bg-blue-600/25" : "bg-transparent"
                  )}
                >
                  <Icon className="h-[18px] w-[18px]" strokeWidth={1.85} />
                </span>
                <span className="truncate">{item.name}</span>
              </Link>
            );
          })}

          <div className="relative" ref={moreRef}>
            <button
              type="button"
              aria-label="More navigation"
              aria-expanded={moreOpen}
              aria-haspopup="menu"
              onClick={() => setMoreOpen((v) => !v)}
              className={cn(
                "relative flex h-full w-full flex-col items-center justify-center gap-1 px-1 text-[10px] font-medium transition",
                moreOpen || moreActive
                  ? "text-blue-300"
                  : "text-white/45 hover:text-white/75"
              )}
            >
              {(moreOpen || moreActive) && (
                <span className="absolute inset-x-4 top-0 h-0.5 rounded-b-full bg-blue-500" />
              )}
              <span
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-xl",
                  moreOpen || moreActive ? "bg-blue-600/25" : "bg-transparent"
                )}
              >
                <Ellipsis className="h-[18px] w-[18px]" strokeWidth={1.85} />
              </span>
              <span>More</span>
            </button>

            {moreOpen && (
              <div
                role="menu"
                className="absolute bottom-[calc(100%+0.5rem)] right-2 z-50 w-[min(18rem,calc(100vw-1.5rem))] overflow-hidden rounded-2xl border border-white/[0.1] bg-[#0a0a0a] shadow-2xl shadow-black/60"
              >
                <div className="border-b border-white/[0.07] px-3.5 py-2.5">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/35">
                    More
                  </p>
                  {user && (
                    <p className="mt-1 truncate text-xs text-white/70">
                      {user.username}
                      <span className="ml-2 font-mono text-[10px] uppercase tracking-wider text-blue-400/80">
                        {user.role}
                      </span>
                    </p>
                  )}
                </div>

                <div className="max-h-[min(60vh,22rem)] overflow-y-auto p-1.5">
                  {mobileOverflow.map((item) => {
                    const active = isNavActive(item, pathname);
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        role="menuitem"
                        onClick={() => setMoreOpen(false)}
                        className={cn(
                          "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition",
                          active
                            ? "bg-blue-600/15 text-blue-200"
                            : "text-white/75 hover:bg-white/[0.06] hover:text-white"
                        )}
                      >
                        <Icon className="h-4 w-4 shrink-0 opacity-80" />
                        <span className="font-medium">{item.name}</span>
                      </Link>
                    );
                  })}

                  <div className="my-1 border-t border-white/[0.07]" />

                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setMoreOpen(false);
                      setShowSearchModal(true);
                    }}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-white/75 transition hover:bg-white/[0.06] hover:text-white"
                  >
                    <Search className="h-4 w-4 shrink-0 opacity-80" />
                    <span className="font-medium">Search</span>
                  </button>
                  <Link
                    href="/audit"
                    role="menuitem"
                    onClick={() => setMoreOpen(false)}
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-white/75 transition hover:bg-white/[0.06] hover:text-white"
                  >
                    <FileSearch className="h-4 w-4 shrink-0 opacity-80" />
                    <span className="font-medium">Alerts</span>
                  </Link>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setMoreOpen(false);
                      logout();
                    }}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-red-300/90 transition hover:bg-red-500/10"
                  >
                    <LogOut className="h-4 w-4 shrink-0" />
                    <span className="font-medium">Sign out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>

      {showSearchModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 p-4 pt-24 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-white/[0.09] bg-[#0c0c0c] p-4 shadow-2xl">
            <form
              onSubmit={handleSearchSubmit}
              className="flex items-center gap-2 border-b border-white/[0.08] pb-3"
            >
              <Search className="h-5 w-5 text-white/40" />
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search cases, suspects, phones, accounts..."
                className={cn(
                  surfaceInput,
                  "border-0 bg-transparent shadow-none focus:ring-0"
                )}
              />
              <button
                type="button"
                onClick={() => setShowSearchModal(false)}
                className="rounded-lg bg-white/[0.06] px-2 py-1 text-xs text-white/50 hover:text-white"
              >
                ESC
              </button>
            </form>
            <div className="flex items-center justify-between pt-3 text-[11px] text-white/40">
              <span>Press Enter to query cases</span>
              <span className="font-mono text-emerald-400/80">
                Strictly Synthetic Data
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { usePathname } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { MobileSidebar } from "@/components/layout/Sidebar";
import { ConnectionStatus } from "@/components/layout/ConnectionStatus";

// ── Breadcrumb Labels ─────────────────────────────────────────────

const PAGE_LABELS: Record<string, string> = {
  "": "Dashboard",
  services: "Services",
  artifacts: "Artifacts",
  "knowledge-map": "Knowledge Map",
  timeline: "Timeline",
};

// ── Header Component ──────────────────────────────────────────────

export function Header() {
  const pathname = usePathname();

  // Generate breadcrumb segments
  const segments = pathname.split("/").filter(Boolean);

  const breadcrumbs = segments.length === 0
    ? [{ label: "Board", active: false }, { label: "Dashboard", active: true }]
    : [
        { label: "Board", active: false },
        ...segments.map((seg, i) => ({
          label: PAGE_LABELS[seg] || seg,
          active: i === segments.length - 1,
        })),
      ];

  return (
    <header className="h-14 border-b border-border bg-background flex items-center justify-between px-4 md:px-6 shrink-0 shadow-sm">
      {/* Left: Mobile Menu + Breadcrumbs */}
      <div className="flex items-center gap-3 min-w-0">
        <MobileSidebar />
        <nav
          aria-label="Breadcrumb"
          className="hidden sm:flex items-center gap-1.5 text-sm text-muted-foreground min-w-0"
        >
          {breadcrumbs.map((crumb, index) => (
            <span key={index} className="flex items-center gap-1.5 truncate">
              {index > 0 && (
                <span className="text-muted-foreground/50">/</span>
              )}
              <span
                className={
                  crumb.active
                    ? "text-foreground font-medium"
                    : "text-muted-foreground"
                }
              >
                {crumb.label}
              </span>
            </span>
          ))}
        </nav>
        {/* Mobile: show just the page title */}
        <span className="sm:hidden text-sm font-medium text-foreground truncate">
          {breadcrumbs[breadcrumbs.length - 1]?.label}
        </span>
      </div>

      {/* Right: Search + Status + Version */}
      <div className="flex items-center gap-3">
        {/* Search (desktop only) */}
        <div className="hidden md:flex items-center relative">
          <Search className="absolute left-2.5 size-4 text-muted-foreground pointer-events-none" />
          <Input
            type="search"
            placeholder="Search..."
            className="pl-8 h-8 w-48 lg:w-64 text-sm"
          />
        </div>

        {/* Mobile search icon */}
        <button
          className="md:hidden flex items-center justify-center size-8 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          aria-label="Search"
        >
          <Search className="size-4" />
        </button>

        {/* Connection Status */}
        <ConnectionStatus />

        {/* Version */}
        <span className="hidden lg:inline text-xs text-muted-foreground">
          v0.1.0
        </span>
      </div>
    </header>
  );
}

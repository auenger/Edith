"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Server,
  FolderOpen,
  Brain,
  Clock,
  ChevronsLeft,
  ChevronsRight,
  Menu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getBoardWebSocket, type WsStatus } from "@/lib/api";

// ── Navigation Items ──────────────────────────────────────────────

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/services", label: "Services", icon: Server },
  { href: "/artifacts", label: "Artifacts", icon: FolderOpen },
  { href: "/knowledge-map", label: "Knowledge Map", icon: Brain },
  { href: "/timeline", label: "Timeline", icon: Clock },
] as const;

// ── Sidebar Width Constants ───────────────────────────────────────

const SIDEBAR_EXPANDED = "w-60"; // 240px
const SIDEBAR_COLLAPSED = "w-16"; // 64px

// ── Desktop Sidebar ───────────────────────────────────────────────

interface SidebarNavProps {
  collapsed: boolean;
}

function SidebarNav({ collapsed }: SidebarNavProps) {
  const pathname = usePathname();

  return (
    <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
      {NAV_ITEMS.map((item) => {
        const isActive =
          item.href === "/"
            ? pathname === "/"
            : pathname.startsWith(item.href);
        const Icon = item.icon;

        const linkContent = (
          <Link
            href={item.href}
            className={`
              flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium
              transition-colors duration-150
              ${
                isActive
                  ? "bg-white/20 text-white"
                  : "text-slate-300 hover:bg-white/10 hover:text-white"
              }
              ${collapsed ? "justify-center px-0" : ""}
            `}
          >
            <Icon className="size-5 shrink-0" />
            {!collapsed && <span>{item.label}</span>}
          </Link>
        );

        if (collapsed) {
          return (
            <Tooltip key={item.href}>
              <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
              <TooltipContent side="right" sideOffset={8}>
                {item.label}
              </TooltipContent>
            </Tooltip>
          );
        }

        return <div key={item.href}>{linkContent}</div>;
      })}
    </nav>
  );
}

// ── WebSocket Status Indicator ────────────────────────────────────

function WsStatusIndicator({ collapsed }: { collapsed: boolean }) {
  const [wsStatus, setWsStatus] = useState<WsStatus>("disconnected");

  useEffect(() => {
    const ws = getBoardWebSocket();
    ws.connect();
    const unsub = ws.onStatusChange((status) => setWsStatus(status));
    return unsub;
  }, []);

  const statusColor =
    wsStatus === "connected"
      ? "bg-green-500"
      : wsStatus === "connecting"
        ? "bg-yellow-500"
        : wsStatus === "error"
          ? "bg-red-500"
          : "bg-slate-500";

  const statusLabel =
    wsStatus === "connected"
      ? "Live"
      : wsStatus === "connecting"
        ? "Connecting"
        : wsStatus === "error"
          ? "Error"
          : "Disconnected";

  return (
    <div className="p-3 border-t border-white/10">
      <div
        className={`flex items-center gap-2 text-xs text-slate-400 ${collapsed ? "justify-center" : ""}`}
      >
        <span
          className={`inline-block h-2 w-2 rounded-full shrink-0 ${statusColor} ${
            wsStatus === "connected" ? "status-dot-live" : ""
          }`}
        />
        {!collapsed && <span>{statusLabel}</span>}
      </div>
    </div>
  );
}

// ── Desktop Sidebar (collapsible) ─────────────────────────────────

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);

  // Auto-collapse on medium screens
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768 && window.innerWidth < 1024) {
        setCollapsed(true);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((prev) => !prev);
  }, []);

  return (
    <TooltipProvider>
      <aside
        className={`
          hidden md:flex flex-col h-screen shrink-0
          ${collapsed ? SIDEBAR_COLLAPSED : SIDEBAR_EXPANDED}
          transition-all duration-300 ease-in-out
        `}
        style={{
          background:
            "linear-gradient(180deg, var(--brand-start) 0%, var(--brand-end) 100%)",
        }}
      >
        {/* Brand */}
        <div
          className={`h-14 flex items-center border-b border-white/10 ${collapsed ? "justify-center px-2" : "px-5"}`}
        >
          {!collapsed && (
            <h1 className="text-lg font-bold text-white tracking-wide">
              EDITH Board
            </h1>
          )}
          {collapsed && (
            <span className="text-lg font-bold text-white">E</span>
          )}
        </div>

        {/* Navigation */}
        <SidebarNav collapsed={collapsed} />

        {/* Collapse Toggle */}
        <div className="px-2 py-1">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={toggleCollapsed}
            className="w-full text-slate-400 hover:text-white hover:bg-white/10"
          >
            {collapsed ? (
              <ChevronsRight className="size-4" />
            ) : (
              <ChevronsLeft className="size-4" />
            )}
          </Button>
        </div>

        {/* WebSocket Status */}
        <WsStatusIndicator collapsed={collapsed} />
      </aside>
    </TooltipProvider>
  );
}

// ── Mobile Sidebar (Sheet drawer) ─────────────────────────────────

export function MobileSidebar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close sheet on route change
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="size-5" />
          <span className="sr-only">Open navigation menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-0">
        {/* Brand */}
        <div
          className="h-14 flex items-center px-5 border-b border-white/10"
          style={{
            background:
              "linear-gradient(135deg, var(--brand-start) 0%, var(--brand-end) 100%)",
          }}
        >
          <h1 className="text-lg font-bold text-white tracking-wide">
            EDITH Board
          </h1>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-2 space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`
                  flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium
                  transition-colors duration-150
                  ${
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-foreground hover:bg-muted"
                  }
                `}
              >
                <Icon className="size-5 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* WebSocket Status */}
        <WsStatusIndicator collapsed={false} />
        <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
      </SheetContent>
    </Sheet>
  );
}

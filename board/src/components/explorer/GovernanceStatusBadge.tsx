"use client";

import { cn } from "@/lib/utils";

// ── Governance Status Config ────────────────────────────────────

type GovernanceStatus = "scaffold" | "reviewed" | "mature" | "stale" | "none" | "conflict";

const STATUS_CONFIG: Record<GovernanceStatus, { bg: string; text: string; dot: string; label: string }> = {
  scaffold: {
    bg: "bg-info-light",
    text: "text-info",
    dot: "bg-info",
    label: "Scaffold",
  },
  reviewed: {
    bg: "bg-success-light",
    text: "text-success",
    dot: "bg-success",
    label: "Reviewed",
  },
  mature: {
    bg: "bg-brand-100",
    text: "text-brand-700",
    dot: "bg-brand-500",
    label: "Mature",
  },
  stale: {
    bg: "bg-warning-light",
    text: "text-warning",
    dot: "bg-warning",
    label: "Stale",
  },
  conflict: {
    bg: "bg-danger-light",
    text: "text-danger",
    dot: "bg-danger",
    label: "Conflict",
  },
  none: {
    bg: "bg-muted",
    text: "text-muted-foreground",
    dot: "bg-muted-foreground",
    label: "No status",
  },
};

// ── GovernanceStatusBadge ───────────────────────────────────────

interface GovernanceStatusBadgeProps {
  status: GovernanceStatus | undefined;
  className?: string;
  compact?: boolean;
}

export function GovernanceStatusBadge({
  status,
  className,
  compact = false,
}: GovernanceStatusBadgeProps) {
  const config = STATUS_CONFIG[status || "none"];

  if (compact) {
    return (
      <span
        className={cn("inline-block h-2 w-2 rounded-full shrink-0", config.dot, className)}
        title={config.label}
      />
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium whitespace-nowrap",
        config.bg,
        config.text,
        className,
      )}
    >
      <span className={cn("inline-block h-1.5 w-1.5 rounded-full", config.dot)} />
      {config.label}
    </span>
  );
}

// ── Status color for Vault tree icons ───────────────────────────

export function getStatusColor(status: GovernanceStatus | undefined): string {
  const config = STATUS_CONFIG[status || "none"];
  // Return the dot color class for icon styling
  return config.dot;
}

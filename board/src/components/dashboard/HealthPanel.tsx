"use client";

import type { HealthStatus } from "@/lib/api";
import { formatTimeAgo } from "@/lib/format";
import {
  Card,
  CardHeader,
  CardTitle,
  CardAction,
  CardContent,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface HealthPanelProps {
  health: HealthStatus | null;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}

export function HealthPanel({ health, loading, error, onRetry }: HealthPanelProps) {
  return (
    <div className="bento-card bento-card-hover bento-span-2">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
          Knowledge Base Health
        </h3>
        <StatusBadge status={health?.status} loading={loading} error={error} />
      </div>

      {/* Loading State */}
      {loading && !health && (
        <div className="space-y-3">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="text-center py-4">
          <p className="text-sm text-destructive mb-3">Failed to load health data</p>
          <button
            onClick={onRetry}
            className="inline-flex items-center gap-1.5 rounded-md bg-muted px-3 py-1.5 text-xs font-medium text-foreground hover:bg-accent transition-colors"
          >
            <RetryIcon />
            Retry
          </button>
        </div>
      )}

      {/* Data State */}
      {health && !error && (
        <div className="space-y-4">
          {/* Health Status Bar */}
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="flex items-baseline justify-between mb-1.5">
                <span className="text-2xl font-bold text-foreground">
                  {health.servicesCount > 0 ? "Active" : "Idle"}
                </span>
                <span className="text-xs text-muted-foreground">
                  {health.servicesCount} service{health.servicesCount !== 1 ? "s" : ""}
                </span>
              </div>
              <HealthProgressBar health={health} />
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatItem
              label="Services"
              value={String(health.servicesCount)}
            />
            <StatItem
              label="Artifacts"
              value={String(health.artifactsCount)}
            />
            <StatItem
              label="Last Updated"
              value={formatTimeAgo(health.lastUpdated) || "Never"}
            />
            <StatItem
              label="Status"
              value={health.status.charAt(0).toUpperCase() + health.status.slice(1)}
            />
          </div>

          {/* Errors */}
          {health.errors.length > 0 && (
            <div className="rounded-md bg-warning-light border border-warning/20 p-2.5">
              <p className="text-xs text-warning">
                {health.errors[0]}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────────

function HealthProgressBar({ health }: { health: HealthStatus }) {
  const ratio = health.servicesCount > 0
    ? Math.min(1, health.artifactsCount / (health.servicesCount * 5))
    : 0;
  const percent = Math.round(ratio * 100);

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-muted-foreground">Coverage</span>
        <span className="text-xs font-medium text-foreground">{percent}%</span>
      </div>
      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${percent}%`,
            backgroundColor: getProgressColor(percent),
          }}
        />
      </div>
    </div>
  );
}

function StatusBadge({
  status,
  loading,
  error,
}: {
  status?: string;
  loading: boolean;
  error: string | null;
}) {
  if (loading) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-muted-foreground/50 animate-pulse" />
        Loading
      </span>
    );
  }

  if (error) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-danger-light px-2.5 py-0.5 text-xs font-medium text-destructive">
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-destructive" />
        Error
      </span>
    );
  }

  const config: Record<string, { bg: string; dot: string; label: string }> = {
    healthy: { bg: "bg-success-light", dot: "bg-success", label: "Healthy" },
    degraded: { bg: "bg-warning-light", dot: "bg-warning", label: "Degraded" },
    error: { bg: "bg-danger-light", dot: "bg-destructive", label: "Error" },
  };

  const c = config[status || "error"] || config.error;

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full ${c.bg} px-2.5 py-0.5 text-xs font-medium`}>
      <span className={`inline-block h-1.5 w-1.5 rounded-full ${c.dot} ${status === "healthy" ? "status-dot-live" : ""}`} />
      {c.label}
    </span>
  );
}

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-muted px-3 py-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold text-foreground truncate">{value}</p>
    </div>
  );
}

function RetryIcon() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M1 4v6h6" />
      <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
    </svg>
  );
}

// ── Helpers ─────────────────────────────────────────────────────

function getProgressColor(percent: number): string {
  if (percent >= 75) return "var(--semantic-success)";
  if (percent >= 40) return "var(--semantic-warning)";
  return "var(--semantic-danger)";
}

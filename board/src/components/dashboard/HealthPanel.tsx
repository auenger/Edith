"use client";

import type { HealthStatus } from "@/lib/api";

interface HealthPanelProps {
  health: HealthStatus | null;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}

export function HealthPanel({ health, loading, error, onRetry }: HealthPanelProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
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
          <p className="text-sm text-red-600 mb-3">Failed to load health data</p>
          <button
            onClick={onRetry}
            className="inline-flex items-center gap-1.5 rounded-md bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-200 transition-colors"
          >
            <RetryIcon />
            Retry
          </button>
        </div>
      )}

      {/* Data State */}
      {health && !error && (
        <div className="space-y-4">
          {/* Distillation Progress */}
          <div>
            <div className="flex items-baseline justify-between mb-1.5">
              <span className="text-2xl font-bold text-gray-900">
                {health.servicesCount > 0 ? "Active" : "0%"}
              </span>
              <span className="text-xs text-gray-500">
                {health.servicesCount} service{health.servicesCount !== 1 ? "s" : ""}
              </span>
            </div>
            <HealthProgressBar health={health} />
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 gap-3">
            <StatItem
              label="Artifacts"
              value={String(health.artifactsCount)}
            />
            <StatItem
              label="Last Updated"
              value={formatTimeAgo(health.lastUpdated) || "Never"}
            />
          </div>

          {/* Errors */}
          {health.errors.length > 0 && (
            <div className="rounded-md bg-yellow-50 border border-yellow-200 p-2.5">
              <p className="text-xs text-yellow-800">
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
        <span className="text-xs text-gray-500">Coverage</span>
        <span className="text-xs font-medium text-gray-700">{percent}%</span>
      </div>
      <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
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
      <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-gray-400 animate-pulse" />
        Loading
      </span>
    );
  }

  if (error) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-700">
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-red-500" />
        Error
      </span>
    );
  }

  const config: Record<string, { bg: string; dot: string; label: string }> = {
    healthy: { bg: "bg-green-50", dot: "bg-green-500", label: "Healthy" },
    degraded: { bg: "bg-yellow-50", dot: "bg-yellow-500", label: "Degraded" },
    error: { bg: "bg-red-50", dot: "bg-red-500", label: "Error" },
  };

  const c = config[status || "error"] || config.error;

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full ${c.bg} px-2.5 py-0.5 text-xs font-medium`}>
      <span className={`inline-block h-1.5 w-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
}

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-gray-50 px-3 py-2">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-sm font-semibold text-gray-900 truncate">{value}</p>
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
  if (percent >= 75) return "#16a34a";
  if (percent >= 40) return "#d97706";
  return "#dc2626";
}

function formatTimeAgo(dateStr: string | null): string | null {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-gray-100 ${className ?? ""}`} />;
}

"use client";

import type { GovernanceHealth } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";

// ── Governance Panel Props ──────────────────────────────────────

interface GovernancePanelProps {
  health: GovernanceHealth | null;
  loading: boolean;
  conflictCount: number;
  onRetry: () => void;
}

// ── Governance Panel ────────────────────────────────────────────

export function GovernancePanel({
  health,
  loading,
  conflictCount,
}: GovernancePanelProps) {
  const noData = !health || health._noData;

  return (
    <div className="bento-card bento-card-hover bento-span-2">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
          Knowledge Governance
        </h3>
        {loading && !health && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-muted-foreground/50 animate-pulse" />
            Loading
          </span>
        )}
        {!loading && !noData && (
          <HealthBadge score={health.overall} />
        )}
      </div>

      {/* Loading State */}
      {loading && !health && (
        <div className="space-y-3">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      )}

      {/* No Data State */}
      {noData && !loading && (
        <div className="text-center py-6">
          <div className="text-2xl mb-2">📊</div>
          <p className="text-sm text-muted-foreground">
            No governance data available yet
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Governance engine data will appear here once the knowledge base is processed
          </p>
        </div>
      )}

      {/* Data State */}
      {health && !noData && (
        <div className="space-y-4">
          {/* Score Cards Row */}
          <div className="grid grid-cols-4 gap-3">
            <ScoreCard
              label="Health Score"
              value={`${health.overall}`}
              max="100"
              color={getScoreColor(health.overall)}
            />
            <ScoreCard
              label="Stale"
              value={`${health.lifecycle.stale}`}
              max="items"
              color={health.lifecycle.stale > 0 ? "var(--semantic-warning)" : "var(--semantic-success)"}
            />
            <ScoreCard
              label="Pending Review"
              value={`${health.lifecycle.scaffold}`}
              max="items"
              color="var(--semantic-info)"
            />
            <ScoreCard
              label="Conflicts"
              value={`${conflictCount}`}
              max="active"
              color={conflictCount > 0 ? "var(--semantic-danger)" : "var(--semantic-success)"}
            />
          </div>

          {/* Breakdown */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              Quality Breakdown
            </p>
            <div className="space-y-2">
              <BreakdownBar label="Freshness" value={health.breakdown.freshness} />
              <BreakdownBar label="Confidence" value={health.breakdown.confidence} />
              <BreakdownBar label="Completeness" value={health.breakdown.completeness} />
              <BreakdownBar label="Human Reviewed" value={health.breakdown.humanReviewed} />
            </div>
          </div>

          {/* Lifecycle Distribution */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              Lifecycle Distribution
            </p>
            <div className="flex gap-2">
              <LifecycleChip status="scaffold" count={health.lifecycle.scaffold} />
              <LifecycleChip status="reviewed" count={health.lifecycle.reviewed} />
              <LifecycleChip status="mature" count={health.lifecycle.mature} />
              <LifecycleChip status="stale" count={health.lifecycle.stale} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────────

function HealthBadge({ score }: { score: number }) {
  const { bg, dot, label } = getHealthBadgeConfig(score);
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full ${bg} px-2.5 py-0.5 text-xs font-medium`}>
      <span className={`inline-block h-1.5 w-1.5 rounded-full ${dot}`} />
      {label}
    </span>
  );
}

function ScoreCard({
  label,
  value,
  max,
  color,
}: {
  label: string;
  value: string;
  max: string;
  color: string;
}) {
  return (
    <div className="rounded-md bg-muted px-3 py-2.5 text-center">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className="text-lg font-bold" style={{ color }}>
        {value}
      </p>
      <p className="text-[10px] text-muted-foreground">/ {max}</p>
    </div>
  );
}

function BreakdownBar({ label, value }: { label: string; value: number }) {
  const percent = Math.round(value * 100);
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-muted-foreground w-28 shrink-0">{label}</span>
      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${percent}%`,
            backgroundColor: getBarColor(percent),
          }}
        />
      </div>
      <span className="text-xs font-medium text-foreground w-10 text-right">{percent}%</span>
    </div>
  );
}

function LifecycleChip({
  status,
  count,
}: {
  status: string;
  count: number;
}) {
  const config = getLifecycleConfig(status);
  return (
    <div
      className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium ${config.bg}`}
    >
      <span className={`inline-block h-2 w-2 rounded-full ${config.dot}`} />
      <span>{config.label}: {count}</span>
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────────

function getScoreColor(score: number): string {
  if (score >= 75) return "var(--semantic-success)";
  if (score >= 50) return "var(--semantic-warning)";
  return "var(--semantic-danger)";
}

function getBarColor(percent: number): string {
  if (percent >= 75) return "var(--semantic-success)";
  if (percent >= 50) return "var(--semantic-info)";
  if (percent >= 25) return "var(--semantic-warning)";
  return "var(--semantic-danger)";
}

function getHealthBadgeConfig(score: number) {
  if (score >= 75) return { bg: "bg-success-light", dot: "bg-success", label: "Good" };
  if (score >= 50) return { bg: "bg-warning-light", dot: "bg-warning", label: "Fair" };
  return { bg: "bg-danger-light", dot: "bg-danger", label: "Needs Attention" };
}

function getLifecycleConfig(status: string) {
  const map: Record<string, { bg: string; dot: string; label: string }> = {
    scaffold: { bg: "bg-info-light", dot: "bg-info", label: "Scaffold" },
    reviewed: { bg: "bg-success-light", dot: "bg-success", label: "Reviewed" },
    mature: { bg: "bg-brand-100", dot: "bg-brand-500", label: "Mature" },
    stale: { bg: "bg-warning-light", dot: "bg-warning", label: "Stale" },
  };
  return map[status] || { bg: "bg-muted", dot: "bg-muted-foreground", label: status };
}

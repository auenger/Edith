"use client";

import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";

interface ArtifactCounts {
  routingTables: number;
  quickRefs: number;
  distillateFragments: number;
  totalServices: number;
  completeServices: number;
  partialServices: number;
  unscannedServices: number;
}

interface ArtifactStatsPanelProps {
  stats: ArtifactCounts;
  servicesCount: number;
  loading: boolean;
}

export function ArtifactStatsPanel({ stats, servicesCount, loading }: ArtifactStatsPanelProps) {
  return (
    <div className="bento-card bento-card-hover">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
          Artifact Statistics
        </h3>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-md bg-muted p-3">
              <Skeleton className="h-3 w-12 mb-2" />
              <Skeleton className="h-6 w-8" />
            </div>
          ))}
        </div>
      )}

      {/* Stats Grid */}
      {!loading && (
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            label="Routing Tables"
            value={stats.routingTables}
            icon="📋"
            color="blue"
          />
          <StatCard
            label="Quick Refs"
            value={stats.quickRefs}
            icon="⚡"
            color="yellow"
          />
          <StatCard
            label="Distillates"
            value={stats.distillateFragments}
            icon="🧪"
            color="purple"
          />
          <StatCard
            label="Total Services"
            value={servicesCount}
            icon="🏗"
            color="green"
          />
        </div>
      )}

      {/* Service Breakdown */}
      {!loading && servicesCount > 0 && (
        <div className="mt-4 pt-3 border-t border-border">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-success font-medium">{stats.completeServices} complete</span>
            <span className="text-border">|</span>
            <span className="text-warning font-medium">{stats.partialServices} partial</span>
            <span className="text-border">|</span>
            <span className="text-muted-foreground font-medium">{stats.unscannedServices} minimal</span>
          </div>

          {/* Mini progress bar */}
          <div className="mt-2 flex h-1.5 w-full rounded-full overflow-hidden bg-muted">
            {stats.completeServices > 0 && (
              <div
                className="bg-success"
                style={{ width: `${(stats.completeServices / servicesCount) * 100}%` }}
              />
            )}
            {stats.partialServices > 0 && (
              <div
                className="bg-warning"
                style={{ width: `${(stats.partialServices / servicesCount) * 100}%` }}
              />
            )}
          </div>
        </div>
      )}

      {/* Footer Link */}
      {!loading && servicesCount > 0 && (
        <div className="mt-3">
          <Link
            href="/artifacts"
            className="text-xs text-primary hover:text-primary/80 transition-colors"
          >
            Browse artifacts →
          </Link>
        </div>
      )}
    </div>
  );
}

// ── Stat Card ───────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: number;
  icon: string;
  color: "blue" | "yellow" | "purple" | "green";
}) {
  const colorMap = {
    blue: "bg-info-light text-info",
    yellow: "bg-warning-light text-warning",
    purple: "bg-chart-4/10 text-chart-4",
    green: "bg-success-light text-success",
  };

  return (
    <div className={`rounded-md p-3 ${colorMap[color]}`}>
      <div className="flex items-center gap-1.5 mb-1">
        <span className="text-sm">{icon}</span>
        <span className="text-xs font-medium opacity-70">{label}</span>
      </div>
      <p className="text-xl font-bold">{value}</p>
    </div>
  );
}

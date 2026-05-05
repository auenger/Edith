"use client";

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
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
          Artifact Statistics
        </h3>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse rounded-md bg-gray-50 p-3">
              <div className="h-3 w-12 rounded bg-gray-200 mb-2" />
              <div className="h-6 w-8 rounded bg-gray-200" />
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
            icon="\u{1F4CB}"
            color="blue"
          />
          <StatCard
            label="Quick Refs"
            value={stats.quickRefs}
            icon="\u{26A1}"
            color="yellow"
          />
          <StatCard
            label="Distillates"
            value={stats.distillateFragments}
            icon="\u{1F9EA}"
            color="purple"
          />
          <StatCard
            label="Total Services"
            value={servicesCount}
            icon="\u{1F3D7}"
            color="green"
          />
        </div>
      )}

      {/* Service Breakdown */}
      {!loading && servicesCount > 0 && (
        <div className="mt-4 pt-3 border-t border-gray-100">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-green-600 font-medium">{stats.completeServices} complete</span>
            <span className="text-gray-300">|</span>
            <span className="text-yellow-600 font-medium">{stats.partialServices} partial</span>
            <span className="text-gray-300">|</span>
            <span className="text-gray-400 font-medium">{stats.unscannedServices} minimal</span>
          </div>

          {/* Mini progress bar */}
          <div className="mt-2 flex h-1.5 w-full rounded-full overflow-hidden bg-gray-100">
            {stats.completeServices > 0 && (
              <div
                className="bg-green-500"
                style={{ width: `${(stats.completeServices / servicesCount) * 100}%` }}
              />
            )}
            {stats.partialServices > 0 && (
              <div
                className="bg-yellow-400"
                style={{ width: `${(stats.partialServices / servicesCount) * 100}%` }}
              />
            )}
          </div>
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
    blue: "bg-blue-50 text-blue-700",
    yellow: "bg-yellow-50 text-yellow-700",
    purple: "bg-purple-50 text-purple-700",
    green: "bg-green-50 text-green-700",
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

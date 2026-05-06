"use client";

import type { GovernanceConflict } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";

// ── Stale Items List Props ──────────────────────────────────────

interface StaleItemsListProps {
  conflicts: GovernanceConflict[];
  loading: boolean;
}

// ── Stale Items List ────────────────────────────────────────────

export function StaleItemsList({ conflicts, loading }: StaleItemsListProps) {
  return (
    <div className="bento-card bento-card-hover">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
          Stale &amp; Conflicts
        </h3>
        {conflicts.length > 0 && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-warning-light px-2.5 py-0.5 text-xs font-medium text-warning">
            {conflicts.length} item{conflicts.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-10 w-full rounded-md" />
          ))}
        </div>
      )}

      {/* Empty */}
      {!loading && conflicts.length === 0 && (
        <div className="text-center py-6">
          <div className="text-2xl mb-2">✅</div>
          <p className="text-sm text-muted-foreground">
            No stale items or conflicts
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            All knowledge artifacts are up to date
          </p>
        </div>
      )}

      {/* Conflict List */}
      {!loading && conflicts.length > 0 && (
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {conflicts.map((conflict, index) => (
            <div
              key={`${conflict.file}-${index}`}
              className="flex items-start gap-2 rounded-md bg-warning-light/50 border border-warning/20 px-3 py-2"
            >
              <span className="inline-block h-2 w-2 rounded-full bg-warning mt-1.5 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-foreground truncate">
                  {conflict.file}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">
                  {conflict.summary}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

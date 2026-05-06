"use client";

import type { GovernanceLifecycle } from "@/lib/api";
import { formatTimeAgo } from "@/lib/format";
import { Skeleton } from "@/components/ui/skeleton";

// ── Governance Events Props ─────────────────────────────────────

interface GovernanceEventsProps {
  lifecycle: GovernanceLifecycle | null;
  loading: boolean;
}

// ── Governance Events Panel ─────────────────────────────────────

export function GovernanceEvents({ lifecycle, loading }: GovernanceEventsProps) {
  const noData = !lifecycle || lifecycle._noData;

  return (
    <div className="bento-card bento-card-hover">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
          Governance Events
        </h3>
        {lifecycle && !noData && (
          <span className="text-[11px] text-muted-foreground">
            Updated {formatTimeAgo(lifecycle.updated_at)}
          </span>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-8 w-full rounded" />
          ))}
        </div>
      )}

      {/* No Data */}
      {noData && !loading && (
        <div className="text-center py-6">
          <div className="text-2xl mb-2">📋</div>
          <p className="text-sm text-muted-foreground">
            Awaiting governance events
          </p>
        </div>
      )}

      {/* Service Lifecycle Overview */}
      {lifecycle && !noData && (
        <div className="space-y-2 max-h-56 overflow-y-auto">
          {lifecycle.services.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No services with governance data
            </p>
          )}
          {lifecycle.services.map((svc) => (
            <div
              key={svc.name}
              className="flex items-center gap-3 rounded-md bg-muted/50 px-3 py-2"
            >
              <span className="text-xs font-medium text-foreground flex-1 truncate">
                {svc.name}
              </span>
              <div className="flex items-center gap-1.5 shrink-0">
                {svc.status_counts.scaffold > 0 && (
                  <span className="inline-flex items-center gap-1 rounded bg-info-light px-1.5 py-0.5 text-[10px] font-medium text-info">
                    S:{svc.status_counts.scaffold}
                  </span>
                )}
                {svc.status_counts.reviewed > 0 && (
                  <span className="inline-flex items-center gap-1 rounded bg-success-light px-1.5 py-0.5 text-[10px] font-medium text-success">
                    R:{svc.status_counts.reviewed}
                  </span>
                )}
                {svc.status_counts.mature > 0 && (
                  <span className="inline-flex items-center gap-1 rounded bg-brand-100 px-1.5 py-0.5 text-[10px] font-medium text-brand-600">
                    M:{svc.status_counts.mature}
                  </span>
                )}
                {svc.status_counts.stale > 0 && (
                  <span className="inline-flex items-center gap-1 rounded bg-warning-light px-1.5 py-0.5 text-[10px] font-medium text-warning">
                    D:{svc.status_counts.stale}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

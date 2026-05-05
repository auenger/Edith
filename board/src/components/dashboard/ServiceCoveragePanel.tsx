"use client";

import Link from "next/link";
import type { ServiceInfo } from "@/lib/api";
import { getServiceStatus } from "@/lib/service-status";
import { Skeleton } from "@/components/ui/skeleton";

interface ServiceCoveragePanelProps {
  services: ServiceInfo[];
  loading: boolean;
}

export function ServiceCoveragePanel({ services, loading }: ServiceCoveragePanelProps) {
  return (
    <div className="bento-card bento-card-hover">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
          Service Coverage
        </h3>
        <span className="text-xs text-muted-foreground">
          {services.length} service{services.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="space-y-2.5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-8 w-full" />
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && services.length === 0 && (
        <div className="py-6 text-center">
          <p className="text-sm text-muted-foreground">No services discovered</p>
          <p className="text-xs text-muted-foreground/70 mt-1">
            Run edith_scan to discover services
          </p>
        </div>
      )}

      {/* Service List */}
      {!loading && services.length > 0 && (
        <div className="space-y-1.5 max-h-64 overflow-y-auto">
          {services.map((svc) => (
            <ServiceRow key={svc.name} service={svc} />
          ))}
        </div>
      )}

      {/* Legend */}
      {!loading && services.length > 0 && (
        <div className="mt-4 pt-3 border-t border-border flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-full bg-success" />
            Complete
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-full bg-warning" />
            Partial
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-full bg-muted-foreground/40" />
            Minimal
          </span>
        </div>
      )}

      {/* Footer Link */}
      {!loading && services.length > 0 && (
        <div className="mt-3">
          <Link
            href="/services"
            className="text-xs text-primary hover:text-primary/80 transition-colors"
          >
            View all services →
          </Link>
        </div>
      )}
    </div>
  );
}

// ── Service Row ─────────────────────────────────────────────────

function ServiceRow({ service }: { service: ServiceInfo }) {
  const status = getServiceStatus(service);

  return (
    <div className="flex items-center gap-3 rounded-md px-3 py-2 hover:bg-accent transition-colors">
      {/* Status Indicator */}
      <span
        className={`inline-block h-2.5 w-2.5 rounded-full flex-shrink-0 ${status.dotColor}`}
        title={status.label}
      />

      {/* Service Name */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">
          {service.name}
        </p>
        <p className="text-xs text-muted-foreground truncate">
          {service.role}
        </p>
      </div>

      {/* Layer Pills */}
      <div className="hidden sm:flex items-center gap-1">
        <LayerPill present={service.layers.routingTable} label="L0" />
        <LayerPill present={service.layers.quickRef} label="L1" />
        <LayerPill present={service.layers.distillates > 0} label={`L2(${service.layers.distillates})`} />
      </div>
    </div>
  );
}

function LayerPill({ present, label }: { present: boolean; label: string }) {
  return (
    <span
      className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium ${
        present
          ? "bg-success-light text-success"
          : "bg-muted text-muted-foreground/50"
      }`}
    >
      {label}
    </span>
  );
}

"use client";

import type { ServiceInfo } from "@/lib/api";

interface ServiceCoveragePanelProps {
  services: ServiceInfo[];
  loading: boolean;
}

export function ServiceCoveragePanel({ services, loading }: ServiceCoveragePanelProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
          Service Coverage
        </h3>
        <span className="text-xs text-gray-500">
          {services.length} service{services.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="space-y-2.5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse flex items-center gap-3">
              <div className="h-8 w-full rounded bg-gray-100" />
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && services.length === 0 && (
        <div className="py-6 text-center">
          <p className="text-sm text-gray-500">No services discovered</p>
          <p className="text-xs text-gray-400 mt-1">
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
        <div className="mt-4 pt-3 border-t border-gray-100 flex items-center gap-4 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-full bg-green-500" />
            Complete
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-full bg-yellow-500" />
            Partial
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-full bg-gray-300" />
            Minimal
          </span>
        </div>
      )}
    </div>
  );
}

// ── Service Row ─────────────────────────────────────────────────

function ServiceRow({ service }: { service: ServiceInfo }) {
  const status = getServiceStatus(service);

  return (
    <div className="flex items-center gap-3 rounded-md px-3 py-2 hover:bg-gray-50 transition-colors group">
      {/* Status Indicator */}
      <span
        className={`inline-block h-2.5 w-2.5 rounded-full flex-shrink-0 ${status.dotColor}`}
        title={status.label}
      />

      {/* Service Name */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">
          {service.name}
        </p>
        <p className="text-xs text-gray-500 truncate">
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
          ? "bg-green-50 text-green-700"
          : "bg-gray-100 text-gray-400"
      }`}
    >
      {label}
    </span>
  );
}

// ── Status Logic ────────────────────────────────────────────────

type ServiceStatus = "complete" | "partial" | "minimal";

function getServiceStatus(svc: ServiceInfo): {
  status: ServiceStatus;
  label: string;
  dotColor: string;
} {
  const hasRouting = svc.layers.routingTable;
  const hasQuickRef = svc.layers.quickRef;
  const hasDistillates = svc.layers.distillates > 0;

  if (hasRouting && hasQuickRef && hasDistillates) {
    return { status: "complete", label: "Complete", dotColor: "bg-green-500" };
  }
  if (hasRouting || hasQuickRef || hasDistillates) {
    return { status: "partial", label: "Partial", dotColor: "bg-yellow-500" };
  }
  return { status: "minimal", label: "Minimal", dotColor: "bg-gray-300" };
}

"use client";

import type { ServiceInfo } from "@/lib/api";
import { getServiceStatus } from "@/lib/service-status";

interface ServiceCardProps {
  service: ServiceInfo;
  onViewDetail: () => void;
}

export function ServiceCard({ service, onViewDetail }: ServiceCardProps) {
  const status = getServiceStatus(service);

  const hasAllLayers =
    service.layers.routingTable &&
    service.layers.quickRef &&
    service.layers.distillates > 0;

  const missingL2 =
    service.layers.routingTable &&
    service.layers.quickRef &&
    service.layers.distillates === 0;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5 hover:border-gray-300 hover:shadow-sm transition-all">
      {/* Header Row */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <span
            className={`inline-block h-2.5 w-2.5 rounded-full flex-shrink-0 ${status.dotColor}`}
            title={status.label}
          />
          <h3 className="text-base font-semibold text-gray-900">
            {service.name}
          </h3>
        </div>
        <StatusBadge status={status.status} label={status.label} />
      </div>

      {/* Description */}
      <p className="text-sm text-gray-600 mb-3">{service.role}</p>

      {/* Meta Row */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 mb-3">
        {service.stack && (
          <span className="flex items-center gap-1">
            <span className="text-gray-400">Stack:</span>
            {service.stack}
          </span>
        )}
        {service.owner && (
          <span className="flex items-center gap-1">
            <span className="text-gray-400">Owner:</span>
            {service.owner}
          </span>
        )}
      </div>

      {/* Constraints */}
      {service.constraints && service.constraints.length > 0 && (
        <div className="mb-3">
          <div className="flex flex-wrap gap-1">
            {service.constraints.slice(0, 3).map((c, i) => (
              <span
                key={i}
                className="inline-flex items-center rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-600"
              >
                {c.length > 40 ? c.slice(0, 40) + "..." : c}
              </span>
            ))}
            {service.constraints.length > 3 && (
              <span className="text-[10px] text-gray-400">
                +{service.constraints.length - 3} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* Layer Status */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <div className="flex items-center gap-1.5">
          <LayerPill present={service.layers.routingTable} label="L0" />
          <LayerPill present={service.layers.quickRef} label="L1" />
          <LayerPill
            present={service.layers.distillates > 0}
            label={
              service.layers.distillates > 0
                ? `L2(${service.layers.distillates})`
                : "L2"
            }
          />
        </div>

        <div className="flex items-center gap-2">
          {missingL2 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                // Layer completion will be handled by the detail modal
                onViewDetail();
              }}
              className="inline-flex items-center rounded-md bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700 hover:bg-amber-100 transition-colors"
            >
              Complete L2
            </button>
          )}
          <button
            onClick={onViewDetail}
            className="inline-flex items-center gap-1 rounded-md bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100 transition-colors"
          >
            Detail
            <svg
              className="h-3 w-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────────

function StatusBadge({
  status,
  label,
}: {
  status: string;
  label: string;
}) {
  const styles: Record<string, string> = {
    complete: "bg-green-50 text-green-700 border-green-200",
    partial: "bg-yellow-50 text-yellow-700 border-yellow-200",
    minimal: "bg-gray-50 text-gray-500 border-gray-200",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${styles[status] || styles.minimal}`}
    >
      {status === "complete" && "✓ "}
      {status === "partial" && "⚠ "}
      {label}
    </span>
  );
}

function LayerPill({
  present,
  label,
}: {
  present: boolean;
  label: string;
}) {
  return (
    <span
      className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium ${
        present
          ? "bg-green-50 text-green-700"
          : "bg-gray-100 text-gray-400 line-through"
      }`}
    >
      {label}
    </span>
  );
}

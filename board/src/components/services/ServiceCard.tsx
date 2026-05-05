"use client";

import type { ServiceInfo } from "@/lib/api";
import { getServiceStatus } from "@/lib/service-status";
import { Badge } from "@/components/ui/badge";
import {
  CheckIcon,
  AlertTriangleIcon,
  CircleIcon,
  ChevronRightIcon,
  FileTextIcon,
} from "lucide-react";

interface ServiceCardProps {
  service: ServiceInfo;
  onViewDetail: () => void;
}

export function ServiceCard({ service, onViewDetail }: ServiceCardProps) {
  const status = getServiceStatus(service);

  const missingL2 =
    service.layers.routingTable &&
    service.layers.quickRef &&
    service.layers.distillates === 0;

  return (
    <div
      className="bento-card bento-card-hover cursor-pointer flex flex-col"
      onClick={onViewDetail}
    >
      {/* Header Row */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <StatusDot status={status.status} />
          <h3 className="text-base font-semibold text-foreground truncate">
            {service.name}
          </h3>
        </div>
        <StatusBadge status={status.status} label={status.label} />
      </div>

      {/* Description */}
      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
        {service.role}
      </p>

      {/* Meta: Tech Stack */}
      {service.stack && (
        <div className="flex flex-wrap items-center gap-1.5 mb-3">
          {service.stack.split("+").map((s, i) => {
            const trimmed = s.trim();
            if (!trimmed) return null;
            return (
              <Badge key={i} variant="secondary" className="text-[10px]">
                {trimmed}
              </Badge>
            );
          })}
        </div>
      )}

      {/* Layer Status + Action Row */}
      <div className="flex items-center justify-between pt-3 mt-auto border-t border-border">
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
            <Badge
              variant="outline"
              className="text-[10px] border-warning text-warning"
            >
              Complete L2
            </Badge>
          )}
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <FileTextIcon className="size-3" />
            <span>{service.layers.distillates}</span>
          </div>
          <ChevronRightIcon className="size-4 text-muted-foreground" />
        </div>
      </div>
    </div>
  );
}

// -- Sub-components --

function StatusDot({ status }: { status: string }) {
  const colorMap: Record<string, string> = {
    complete: "bg-success",
    partial: "bg-warning",
    minimal: "bg-muted-foreground",
  };

  return (
    <span
      className={`inline-block h-2.5 w-2.5 rounded-full flex-shrink-0 ${colorMap[status] || colorMap.minimal}`}
      aria-label={status}
    />
  );
}

function StatusBadge({
  status,
  label,
}: {
  status: string;
  label: string;
}) {
  const config: Record<string, { icon: React.ReactNode; className: string }> = {
    complete: {
      icon: <CheckIcon className="size-3" />,
      className: "bg-success-light text-success border-success/20",
    },
    partial: {
      icon: <AlertTriangleIcon className="size-3" />,
      className: "bg-warning-light text-warning border-warning/20",
    },
    minimal: {
      icon: <CircleIcon className="size-3" />,
      className: "bg-muted text-muted-foreground border-border",
    },
  };

  const { icon, className } = config[status] || config.minimal;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium ${className}`}
    >
      {icon}
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
          ? "bg-success-light text-success"
          : "bg-muted text-muted-foreground line-through"
      }`}
    >
      {label}
    </span>
  );
}

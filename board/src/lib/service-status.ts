/**
 * Service Status Utility
 *
 * Shared logic for determining a service's knowledge completeness status.
 * Used by Services page, ServiceCard, and ServiceCoveragePanel.
 */

import type { ServiceInfo } from "@/lib/api";

export type ServiceStatus = "complete" | "partial" | "minimal";

export function getServiceStatus(svc: ServiceInfo): {
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

"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { api, getBoardWebSocket, type WsStatus } from "@/lib/api";
import type { ServiceInfo } from "@/lib/api";
import { ServiceCard } from "@/components/services/ServiceCard";
import { ServiceDetailModal } from "@/components/services/ServiceDetailModal";
import { ServiceFilters } from "@/components/services/ServiceFilters";

// ── Filter Types ─────────────────────────────────────────────────

type StackFilter = "all" | string;
type StatusFilter = "all" | "complete" | "partial" | "minimal";

interface Filters {
  stack: StackFilter;
  status: StatusFilter;
  search: string;
}

// ── Services Page ────────────────────────────────────────────────

export default function ServicesPage() {
  const [services, setServices] = useState<ServiceInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [wsStatus, setWsStatus] = useState<WsStatus>("disconnected");
  const [filters, setFilters] = useState<Filters>({
    stack: "all",
    status: "all",
    search: "",
  });
  const [selectedService, setSelectedService] = useState<string | null>(null);

  // ── Data Fetching ─────────────────────────────────────────────

  const fetchServices = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await api.services();
    if (res.ok && res.data) {
      setServices(res.data);
    } else {
      setError(res.error?.message || "Failed to load services");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  // ── WebSocket ─────────────────────────────────────────────────

  useEffect(() => {
    const ws = getBoardWebSocket();
    ws.connect();

    const unsubStatus = ws.onStatusChange((status) => setWsStatus(status));
    const unsubChange = ws.on("change", () => fetchServices());

    return () => {
      unsubStatus();
      unsubChange();
    };
  }, [fetchServices]);

  // ── Derived Data ──────────────────────────────────────────────

  const availableStacks = useMemo(() => {
    const stacks = new Set<string>();
    for (const svc of services) {
      if (svc.stack) {
        // Split compound stacks like "Spring Boot + PostgreSQL"
        svc.stack.split("+").forEach((s) => {
          const trimmed = s.trim();
          if (trimmed) stacks.add(trimmed);
        });
      }
    }
    return Array.from(stacks).sort();
  }, [services]);

  const filteredServices = useMemo(() => {
    let result = services;

    // Search filter
    if (filters.search) {
      const query = filters.search.toLowerCase();
      result = result.filter(
        (svc) =>
          svc.name.toLowerCase().includes(query) ||
          svc.role.toLowerCase().includes(query) ||
          svc.owner.toLowerCase().includes(query) ||
          svc.stack.toLowerCase().includes(query),
      );
    }

    // Stack filter
    if (filters.stack !== "all") {
      result = result.filter((svc) => svc.stack.includes(filters.stack));
    }

    // Status filter
    if (filters.status !== "all") {
      result = result.filter((svc) => {
        const status = getServiceStatus(svc);
        return status.status === filters.status;
      });
    }

    return result;
  }, [services, filters]);

  // ── Empty State ───────────────────────────────────────────────

  const isEmpty = !loading && services.length === 0;

  // ── Render ────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Services</h2>
        <div className="flex items-center gap-3 text-sm text-gray-500">
          {wsStatus === "connected" && (
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2 w-2 rounded-full bg-green-500" />
              Live
            </span>
          )}
          <span>
            {services.length} service{services.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Empty State */}
      {isEmpty && (
        <div className="rounded-lg border-2 border-dashed border-gray-300 bg-white p-12 text-center">
          <div className="mx-auto max-w-md">
            <div className="text-4xl mb-4">&#x1f50d;</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No services discovered
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              Run{" "}
              <code className="rounded bg-gray-100 px-1.5 py-0.5 text-sm font-mono">
                edith_scan
              </code>{" "}
              on your project to discover and register services.
            </p>
          </div>
        </div>
      )}

      {/* Filters (only show when services exist) */}
      {!isEmpty && (
        <ServiceFilters
          stacks={availableStacks}
          filters={filters}
          onFiltersChange={setFilters}
          resultCount={filteredServices.length}
          totalCount={services.length}
        />
      )}

      {/* Error State */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-700">{error}</p>
          <button
            onClick={fetchServices}
            className="mt-2 text-sm text-red-600 underline hover:text-red-800"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && services.length === 0 && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="animate-pulse rounded-lg border border-gray-200 bg-white p-5"
            >
              <div className="h-4 w-32 rounded bg-gray-200 mb-3" />
              <div className="h-3 w-48 rounded bg-gray-100 mb-2" />
              <div className="h-3 w-24 rounded bg-gray-100" />
            </div>
          ))}
        </div>
      )}

      {/* Service Cards Grid */}
      {!isEmpty && !error && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {filteredServices.map((svc) => (
            <ServiceCard
              key={svc.name}
              service={svc}
              onViewDetail={() => setSelectedService(svc.name)}
            />
          ))}
        </div>
      )}

      {/* No Results (after filtering) */}
      {!isEmpty &&
        !loading &&
        !error &&
        filteredServices.length === 0 &&
        services.length > 0 && (
          <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
            <p className="text-sm text-gray-500">
              No services match the current filters.
            </p>
            <button
              onClick={() =>
                setFilters({ stack: "all", status: "all", search: "" })
              }
              className="mt-2 text-sm text-blue-600 underline hover:text-blue-800"
            >
              Clear filters
            </button>
          </div>
        )}

      {/* Service Detail Modal */}
      {selectedService && (
        <ServiceDetailModal
          serviceName={selectedService}
          onClose={() => setSelectedService(null)}
        />
      )}
    </div>
  );
}

// ── Status Logic (shared with ServiceCard) ──────────────────────

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

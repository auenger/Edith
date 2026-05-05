"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { api, getBoardWebSocket, type WsStatus } from "@/lib/api";
import type { ServiceInfo } from "@/lib/api";
import { getServiceStatus } from "@/lib/service-status";
import { ServiceCard } from "@/components/services/ServiceCard";
import { ServiceDetailSheet } from "@/components/services/ServiceDetailModal";
import { ServiceFilters } from "@/components/services/ServiceFilters";
import { EmptyState } from "@/components/shared/EmptyState";
import { CardGridSkeleton } from "@/components/shared/CardGridSkeleton";
import { Badge } from "@/components/ui/badge";
import { ActivityIcon } from "lucide-react";

// -- Filter Types --

type StackFilter = "all" | string;
type StatusFilter = "all" | "complete" | "partial" | "minimal";

interface Filters {
  stack: StackFilter;
  status: StatusFilter;
  search: string;
}

// -- Services Page --

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

  // -- Data Fetching --

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

  // -- WebSocket --

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

  // -- Derived Data --

  const availableStacks = useMemo(() => {
    const stacks = new Set<string>();
    for (const svc of services) {
      if (svc.stack) {
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
          svc.stack.toLowerCase().includes(query)
      );
    }

    // Stack filter
    if (filters.stack !== "all") {
      result = result.filter((svc) => svc.stack.includes(filters.stack));
    }

    // Status filter (using shared utility from service-status.ts)
    if (filters.status !== "all") {
      result = result.filter((svc) => {
        const status = getServiceStatus(svc);
        return status.status === filters.status;
      });
    }

    return result;
  }, [services, filters]);

  // -- States --

  const isEmpty = !loading && services.length === 0;
  const isFilteredEmpty =
    !isEmpty && !loading && !error && filteredServices.length === 0;

  // -- Render --

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">Services</h2>
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          {wsStatus === "connected" && (
            <span className="flex items-center gap-1.5">
              <ActivityIcon className="size-3 text-success status-dot-live" />
              Live
            </span>
          )}
          <Badge variant="secondary">
            {services.length} service{services.length !== 1 ? "s" : ""}
          </Badge>
        </div>
      </div>

      {/* Empty State */}
      {isEmpty && (
        <EmptyState
          icon={<ActivityIcon className="size-10 text-muted-foreground" />}
          title="No services discovered"
          description={
            <>
              Run{" "}
              <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">
                edith_scan
              </code>{" "}
              on your project to discover and register services.
            </>
          }
        />
      )}

      {/* Filters */}
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
        <div className="bento-card border-danger/30 bg-danger-light/30">
          <p className="text-sm text-danger">{error}</p>
          <button
            onClick={fetchServices}
            className="mt-2 text-sm text-danger underline hover:no-underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && services.length === 0 && <CardGridSkeleton count={4} />}

      {/* Service Cards Grid (Bento Grid) */}
      {!isEmpty && !error && (
        <div className="bento-grid">
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
      {isFilteredEmpty && (
        <EmptyState
          icon="\u{1F50D}"
          title="No matching services"
          description="No services match the current filters."
          action={
            <button
              onClick={() =>
                setFilters({ stack: "all", status: "all", search: "" })
              }
              className="text-sm text-primary hover:underline"
            >
              Clear filters
            </button>
          }
        />
      )}

      {/* Service Detail Sheet */}
      <ServiceDetailSheet
        serviceName={selectedService || ""}
        open={!!selectedService}
        onOpenChange={(open) => {
          if (!open) setSelectedService(null);
        }}
      />
    </div>
  );
}

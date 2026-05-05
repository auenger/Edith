"use client";

import { useEffect, useState, useCallback } from "react";
import { api, getBoardWebSocket, type WsStatus } from "@/lib/api";
import type {
  HealthStatus,
  ServiceInfo,
  TimelineEvent,
} from "@/lib/api";
import { HealthPanel } from "@/components/dashboard/HealthPanel";
import { ServiceCoveragePanel } from "@/components/dashboard/ServiceCoveragePanel";
import { RecentChangesPanel } from "@/components/dashboard/RecentChangesPanel";
import { ArtifactStatsPanel } from "@/components/dashboard/ArtifactStatsPanel";
import { QuickActionsPanel } from "@/components/dashboard/QuickActionsPanel";
import { formatTimeAgo } from "@/lib/format";
import { Skeleton } from "@/components/ui/skeleton";

// ── Dashboard Data ──────────────────────────────────────────────

interface DashboardData {
  health: HealthStatus | null;
  healthLoading: boolean;
  healthError: string | null;
  services: ServiceInfo[];
  servicesLoading: boolean;
  timeline: TimelineEvent[];
  timelineLoading: boolean;
  wsStatus: WsStatus;
  lastRefreshed: string | null;
}

// ── Dashboard Page ──────────────────────────────────────────────

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData>({
    health: null,
    healthLoading: true,
    healthError: null,
    services: [],
    servicesLoading: true,
    timeline: [],
    timelineLoading: true,
    wsStatus: "disconnected",
    lastRefreshed: null,
  });

  // ── Data Fetching ────────────────────────────────────────────

  const fetchHealth = useCallback(async () => {
    setData((prev) => ({ ...prev, healthLoading: true, healthError: null }));
    const res = await api.health();
    if (res.ok && res.data) {
      setData((prev) => ({
        ...prev,
        health: res.data!,
        healthLoading: false,
        lastRefreshed: new Date().toISOString(),
      }));
    } else {
      setData((prev) => ({
        ...prev,
        healthLoading: false,
        healthError: res.error?.message || "Failed to load health data",
      }));
    }
  }, []);

  const fetchServices = useCallback(async () => {
    setData((prev) => ({ ...prev, servicesLoading: true }));
    const res = await api.services();
    if (res.ok && res.data) {
      setData((prev) => ({
        ...prev,
        services: res.data!,
        servicesLoading: false,
      }));
    } else {
      setData((prev) => ({ ...prev, servicesLoading: false }));
    }
  }, []);

  const fetchTimeline = useCallback(async () => {
    setData((prev) => ({ ...prev, timelineLoading: true }));
    const res = await api.timeline();
    if (res.ok && res.data) {
      setData((prev) => ({
        ...prev,
        timeline: res.data!.events.slice(0, 5),
        timelineLoading: false,
      }));
    } else {
      setData((prev) => ({ ...prev, timelineLoading: false }));
    }
  }, []);

  const fetchAll = useCallback(() => {
    fetchHealth();
    fetchServices();
    fetchTimeline();
  }, [fetchHealth, fetchServices, fetchTimeline]);

  // ── Initial Load ─────────────────────────────────────────────

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // ── WebSocket ────────────────────────────────────────────────

  useEffect(() => {
    const ws = getBoardWebSocket();
    ws.connect();

    const unsubStatus = ws.onStatusChange((status) => {
      setData((prev) => ({ ...prev, wsStatus: status }));
    });

    const unsubChange = ws.on("change", () => {
      fetchAll();
    });

    return () => {
      unsubStatus();
      unsubChange();
    };
  }, [fetchAll]);

  // ── Compute Artifact Stats ───────────────────────────────────

  const artifactStats = computeArtifactStats(data.services);

  // ── Empty State ──────────────────────────────────────────────

  const isEmpty =
    !data.healthLoading &&
    data.health &&
    data.health.servicesCount === 0 &&
    !data.healthError;

  // ── Render ───────────────────────────────────────────────────

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">Dashboard</h2>
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          {data.wsStatus === "connected" && (
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2 w-2 rounded-full bg-success status-dot-live" />
              Live
            </span>
          )}
          {data.lastRefreshed && (
            <span>Updated {formatTimeAgo(data.lastRefreshed)}</span>
          )}
        </div>
      </div>

      {/* Initial Loading State */}
      {data.healthLoading && !data.health && (
        <div className="bento-grid">
          <div className="bento-card bento-span-2">
            <Skeleton className="h-5 w-40 mb-4" />
            <Skeleton className="h-10 w-full mb-3" />
            <Skeleton className="h-4 w-3/4" />
          </div>
          <div className="bento-card">
            <Skeleton className="h-5 w-32 mb-4" />
            <Skeleton className="h-20 w-full" />
          </div>
          <div className="bento-card">
            <Skeleton className="h-5 w-36 mb-4" />
            <Skeleton className="h-20 w-full" />
          </div>
          <div className="bento-card">
            <Skeleton className="h-5 w-32 mb-4" />
            <Skeleton className="h-20 w-full" />
          </div>
          <div className="bento-card">
            <Skeleton className="h-5 w-28 mb-4" />
            <Skeleton className="h-20 w-full" />
          </div>
        </div>
      )}

      {/* Empty State */}
      {isEmpty && (
        <div className="bento-card text-center py-16">
          <div className="mx-auto max-w-md">
            <div className="text-4xl mb-4">📚</div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              No knowledge base found
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              Run <code className="rounded bg-muted px-1.5 py-0.5 text-sm font-mono">edith_scan</code> on your project to start building the knowledge base.
            </p>
            <button className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
              Scan New Service
            </button>
          </div>
        </div>
      )}

      {/* Bento Grid Dashboard */}
      {!isEmpty && data.health && (
        <div className="bento-grid">
          {/* Row 1: Health Panel (span 2) + Service Coverage (span 1) */}
          <HealthPanel
            health={data.health}
            loading={data.healthLoading}
            error={data.healthError}
            onRetry={fetchHealth}
          />
          <ServiceCoveragePanel
            services={data.services}
            loading={data.servicesLoading}
          />

          {/* Row 2: Artifact Stats (span 1) + Recent Changes (span 1) */}
          <ArtifactStatsPanel
            stats={artifactStats}
            servicesCount={data.health?.servicesCount ?? 0}
            loading={data.healthLoading}
          />
          <RecentChangesPanel
            timeline={data.timeline}
            loading={data.timelineLoading}
          />

          {/* Row 3: Quick Actions (span 1) */}
          <QuickActionsPanel
            servicesCount={data.health?.servicesCount ?? 0}
            onRefresh={fetchAll}
          />
        </div>
      )}
    </div>
  );
}

// ── Artifact Stats Computation ──────────────────────────────────

interface ArtifactCounts {
  routingTables: number;
  quickRefs: number;
  distillateFragments: number;
  totalServices: number;
  completeServices: number;
  partialServices: number;
  unscannedServices: number;
}

function computeArtifactStats(services: ServiceInfo[]): ArtifactCounts {
  let routingTables = 0;
  let quickRefs = 0;
  let distillateFragments = 0;
  let complete = 0;
  let partial = 0;
  let unscanned = 0;

  for (const svc of services) {
    if (svc.layers.routingTable) routingTables++;
    if (svc.layers.quickRef) quickRefs++;
    distillateFragments += svc.layers.distillates;

    if (svc.layers.routingTable && svc.layers.quickRef && svc.layers.distillates > 0) {
      complete++;
    } else if (svc.layers.routingTable || svc.layers.quickRef || svc.layers.distillates > 0) {
      partial++;
    } else {
      unscanned++;
    }
  }

  return {
    routingTables,
    quickRefs,
    distillateFragments,
    totalServices: services.length,
    completeServices: complete,
    partialServices: partial,
    unscannedServices: unscanned,
  };
}

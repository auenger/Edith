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

// ── Time ago formatter ──────────────────────────────────────────

function formatTimeAgo(dateStr: string | null): string | null {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
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
      // Refresh all data on file change
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
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
        <div className="flex items-center gap-3 text-sm text-gray-500">
          {data.wsStatus === "connected" && (
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2 w-2 rounded-full bg-green-500" />
              Live
            </span>
          )}
          {data.lastRefreshed && (
            <span>Updated {formatTimeAgo(data.lastRefreshed)}</span>
          )}
        </div>
      </div>

      {/* Empty State */}
      {isEmpty && (
        <div className="rounded-lg border-2 border-dashed border-gray-300 bg-white p-12 text-center">
          <div className="mx-auto max-w-md">
            <div className="text-4xl mb-4">&#x1f4da;</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No knowledge base found
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              Run <code className="rounded bg-gray-100 px-1.5 py-0.5 text-sm font-mono">edith_scan</code> on your project to start building the knowledge base.
            </p>
            <button className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors">
              Scan New Service
            </button>
          </div>
        </div>
      )}

      {/* Dashboard Grid */}
      {!isEmpty && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Row 1: Health + Service Coverage */}
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

          {/* Row 2: Recent Changes (full width) */}
          <div className="lg:col-span-2">
            <RecentChangesPanel
              timeline={data.timeline}
              loading={data.timelineLoading}
            />
          </div>

          {/* Row 3: Artifact Stats + Quick Actions */}
          <ArtifactStatsPanel
            stats={artifactStats}
            servicesCount={data.health?.servicesCount ?? 0}
            loading={data.healthLoading}
          />
          <QuickActionsPanel
            servicesCount={data.health?.servicesCount ?? 0}
            onRefresh={fetchAll}
          />
        </div>
      )}

      {/* Loading State (initial) */}
      {data.healthLoading && !data.health && (
        <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
          <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
          <p className="mt-3 text-sm text-gray-500">Loading knowledge base status...</p>
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

    // Determine service status
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

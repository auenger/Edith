"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { api, getBoardWebSocket, type WsStatus } from "@/lib/api";
import type { TimelineEvent, ServiceInfo } from "@/lib/api";
import { TimelineFilters, type TimelineFilterState } from "@/components/timeline/TimelineFilters";
import { TimelineEventItem } from "@/components/timeline/TimelineEventItem";
import { MonthGroupHeader } from "@/components/timeline/MonthGroupHeader";
import { groupByMonth } from "@/components/timeline/timeline-helpers";

// ── Page State ────────────────────────────────────────────────────

const PAGE_SIZE = 20;

// ── Timeline Page ─────────────────────────────────────────────────

export default function TimelinePage() {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [totalAvailable, setTotalAvailable] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [wsStatus, setWsStatus] = useState<WsStatus>("disconnected");
  const [services, setServices] = useState<ServiceInfo[]>([]);
  const [filters, setFilters] = useState<TimelineFilterState>({
    type: "all",
    service: "all",
  });
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  // ── Data Fetching ─────────────────────────────────────────────

  const fetchTimeline = useCallback(
    async (newOffset: number, append: boolean) => {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
        setError(null);
      }

      const res = await api.timeline({
        limit: PAGE_SIZE,
        offset: newOffset,
        type: filters.type,
        service: filters.service,
      });

      if (res.ok && res.data) {
        const newEvents = res.data.events;
        setTotalAvailable(res.data.total);
        setHasMore(newOffset + newEvents.length < res.data.total);

        if (append) {
          setEvents((prev) => [...prev, ...newEvents]);
        } else {
          setEvents(newEvents);
        }
      } else {
        setError(res.error?.message || "Failed to load timeline");
      }

      setLoading(false);
      setLoadingMore(false);
    },
    [filters],
  );

  const fetchServices = useCallback(async () => {
    const res = await api.services();
    if (res.ok && res.data) {
      setServices(res.data);
    }
  }, []);

  // ── Initial Load ─────────────────────────────────────────────

  useEffect(() => {
    fetchTimeline(0, false);
    fetchServices();
  }, [fetchTimeline, fetchServices]);

  // ── Refetch when filters change ──────────────────────────────

  useEffect(() => {
    setOffset(0);
    fetchTimeline(0, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  // ── WebSocket ────────────────────────────────────────────────

  useEffect(() => {
    const ws = getBoardWebSocket();
    ws.connect();

    const unsubStatus = ws.onStatusChange((status) => setWsStatus(status));
    const unsubChange = ws.on("change", () => {
      setOffset(0);
      fetchTimeline(0, false);
    });

    return () => {
      unsubStatus();
      unsubChange();
    };
  }, [fetchTimeline]);

  // ── Load More ────────────────────────────────────────────────

  const handleLoadMore = useCallback(() => {
    const newOffset = offset + PAGE_SIZE;
    setOffset(newOffset);
    fetchTimeline(newOffset, true);
  }, [offset, fetchTimeline]);

  // ── Derived Data ─────────────────────────────────────────────

  const availableServiceNames = useMemo(
    () => services.map((s) => s.name).sort(),
    [services],
  );

  const monthlyGroups = useMemo(() => groupByMonth(events), [events]);

  const isEmpty = !loading && events.length === 0 && !error;

  // ── Render ───────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Knowledge Timeline
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Trace the evolution of organizational knowledge
          </p>
        </div>
        <div className="flex items-center gap-3 text-sm text-gray-500">
          {wsStatus === "connected" && (
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2 w-2 rounded-full bg-green-500" />
              Live
            </span>
          )}
          {!loading && totalAvailable > 0 && (
            <span>
              {events.length}/{totalAvailable} events
            </span>
          )}
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-700">{error}</p>
          <button
            onClick={() => fetchTimeline(0, false)}
            className="mt-2 text-sm text-red-600 underline hover:text-red-800"
          >
            Retry
          </button>
        </div>
      )}

      {/* Empty State */}
      {isEmpty && (
        <div className="rounded-lg border-2 border-dashed border-gray-300 bg-white p-12 text-center">
          <div className="mx-auto max-w-md">
            <div className="text-4xl mb-4">{"\u{1F4C5}"}</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No knowledge change records yet
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              Run{" "}
              <code className="rounded bg-gray-100 px-1.5 py-0.5 text-sm font-mono">
                edith_scan
              </code>{" "}
              or{" "}
              <code className="rounded bg-gray-100 px-1.5 py-0.5 text-sm font-mono">
                edith_distill
              </code>{" "}
              to start building the knowledge timeline.
            </p>
          </div>
        </div>
      )}

      {/* Filters (only show when events exist or services available) */}
      {!isEmpty && (
        <TimelineFilters
          filters={filters}
          onFiltersChange={setFilters}
          availableServices={availableServiceNames}
          resultCount={events.length}
          totalCount={totalAvailable}
        />
      )}

      {/* Loading State (initial) */}
      {loading && events.length === 0 && (
        <div className="rounded-lg border border-gray-200 bg-white p-6 space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-full bg-gray-100 animate-pulse flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-3/4 rounded bg-gray-100 animate-pulse" />
                <div className="h-3 w-1/2 rounded bg-gray-50 animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Timeline Content */}
      {!loading && !error && events.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          {Array.from(monthlyGroups.entries()).map(
            ([monthKey, monthEvents]) => (
              <div key={monthKey} className="mb-6 last:mb-0">
                <MonthGroupHeader
                  monthKey={monthKey}
                  eventCount={monthEvents.length}
                />
                <div className="ml-1 mt-2">
                  {monthEvents.map((event, idx) => (
                    <TimelineEventItem
                      key={`${event.hash}-${idx}`}
                      event={event}
                      isLast={idx === monthEvents.length - 1}
                    />
                  ))}
                </div>
              </div>
            ),
          )}

          {/* Load More */}
          {hasMore && (
            <div className="pt-4 border-t border-gray-100 text-center">
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loadingMore ? (
                  <>
                    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
                    Loading...
                  </>
                ) : (
                  <>
                    Load earlier events
                    <span className="text-gray-400">
                      ({totalAvailable - events.length} remaining)
                    </span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* All Loaded */}
          {!hasMore && totalAvailable > 0 && (
            <div className="pt-4 border-t border-gray-100 text-center text-xs text-gray-400">
              All {events.length} events loaded
            </div>
          )}
        </div>
      )}

      {/* No Results after filtering */}
      {!loading &&
        !error &&
        events.length === 0 &&
        totalAvailable === 0 &&
        (filters.type !== "all" || filters.service !== "all") && (
          <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
            <p className="text-sm text-gray-500">
              No events match the current filters.
            </p>
            <button
              onClick={() => setFilters({ type: "all", service: "all" })}
              className="mt-2 text-sm text-blue-600 underline hover:text-blue-800"
            >
              Clear filters
            </button>
          </div>
        )}
    </div>
  );
}

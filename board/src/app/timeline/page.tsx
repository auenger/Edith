"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { api, getBoardWebSocket, type WsStatus } from "@/lib/api";
import type { TimelineEvent, ServiceInfo } from "@/lib/api";
import { TimelineFilters, type TimelineFilterState } from "@/components/timeline/TimelineFilters";
import { TimelineEventItem } from "@/components/timeline/TimelineEventItem";
import { MonthGroupHeader } from "@/components/timeline/MonthGroupHeader";
import { groupByMonth } from "@/components/timeline/timeline-helpers";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, CalendarRange, ArrowDown } from "lucide-react";

// -- Page State -----------------------------------------------------------

const PAGE_SIZE = 20;

// -- Timeline Page --------------------------------------------------------

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
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // -- Data Fetching ------------------------------------------------------

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

  // -- Initial Load -------------------------------------------------------

  useEffect(() => {
    fetchTimeline(0, false);
    fetchServices();
  }, [fetchTimeline, fetchServices]);

  // -- Refetch when filters change ----------------------------------------

  useEffect(() => {
    setOffset(0);
    fetchTimeline(0, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  // -- WebSocket ----------------------------------------------------------

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

  // -- Load More ----------------------------------------------------------

  const handleLoadMore = useCallback(() => {
    const newOffset = offset + PAGE_SIZE;
    setOffset(newOffset);
    fetchTimeline(newOffset, true);
  }, [offset, fetchTimeline]);

  // -- Infinite scroll via IntersectionObserver ---------------------------

  useEffect(() => {
    if (!loadMoreRef.current || !hasMore || loading || loadingMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          handleLoadMore();
        }
      },
      { rootMargin: "200px" },
    );

    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [hasMore, loading, loadingMore, handleLoadMore]);

  // -- Derived Data -------------------------------------------------------

  const availableServiceNames = useMemo(
    () => services.map((s) => s.name).sort(),
    [services],
  );

  const monthlyGroups = useMemo(() => groupByMonth(events), [events]);

  const isEmpty = !loading && events.length === 0 && !error;

  // -- Render -------------------------------------------------------------

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            Knowledge Timeline
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Trace the evolution of organizational knowledge
          </p>
        </div>
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          {wsStatus === "connected" && (
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2 w-2 rounded-full bg-success status-dot-live" />
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

      {/* Filters */}
      {!isEmpty && (
        <TimelineFilters
          filters={filters}
          onFiltersChange={setFilters}
          availableServices={availableServiceNames}
          resultCount={events.length}
          totalCount={totalAvailable}
        />
      )}

      {/* Error State */}
      {error && (
        <Card className="border-danger/30 bg-danger-light/30">
          <CardContent className="p-4">
            <p className="text-sm text-danger">{error}</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-2 text-danger border-danger/30 hover:bg-danger-light/50"
              onClick={() => fetchTimeline(0, false)}
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {isEmpty && (
        <Card className="border-dashed border-2">
          <CardContent className="py-16 text-center">
            <div className="mx-auto max-w-md">
              <CalendarRange className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                No knowledge change records yet
              </h3>
              <p className="text-sm text-muted-foreground mb-6">
                Run{" "}
                <code className="rounded bg-muted px-1.5 py-0.5 text-sm font-mono">
                  edith_scan
                </code>{" "}
                or{" "}
                <code className="rounded bg-muted px-1.5 py-0.5 text-sm font-mono">
                  edith_distill
                </code>{" "}
                to start building the knowledge timeline.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading State (initial) */}
      {loading && events.length === 0 && (
        <div className="bento-card p-6 space-y-6">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-start gap-0">
              <div className="w-10 flex flex-col items-center">
                <Skeleton className="h-8 w-8 rounded-full" />
              </div>
              <div className="flex-1 pl-2 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Timeline Content */}
      {!loading && !error && events.length > 0 && (
        <div className="relative">
          {/* Vertical gradient timeline axis (background) */}
          <div
            className="absolute left-[19px] top-0 bottom-0 w-0.5 opacity-20"
            style={{
              background:
                "linear-gradient(to bottom, var(--brand-start), var(--brand-end))",
            }}
          />

          {/* Monthly groups */}
          {Array.from(monthlyGroups.entries()).map(
            ([monthKey, monthEvents]) => (
              <MonthGroupHeader
                key={monthKey}
                monthKey={monthKey}
                eventCount={monthEvents.length}
              >
                <div className="mt-2">
                  {monthEvents.map((event, idx) => (
                    <TimelineEventItem
                      key={`${event.hash}-${idx}`}
                      event={event}
                      isLast={idx === monthEvents.length - 1}
                    />
                  ))}
                </div>
              </MonthGroupHeader>
            ),
          )}

          {/* Load More Trigger (IntersectionObserver sentinel) */}
          {hasMore && (
            <div ref={loadMoreRef} className="pt-4 text-center">
              <Button
                variant="outline"
                size="sm"
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="gap-2"
              >
                {loadingMore ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <ArrowDown className="h-4 w-4" />
                    Load earlier events
                    <span className="text-muted-foreground">
                      ({totalAvailable - events.length} remaining)
                    </span>
                  </>
                )}
              </Button>
            </div>
          )}

          {/* All Loaded */}
          {!hasMore && totalAvailable > 0 && (
            <div className="pt-4 text-center text-xs text-muted-foreground">
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
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-sm text-muted-foreground">
                No events match the current filters.
              </p>
              <Button
                variant="link"
                size="sm"
                className="mt-2"
                onClick={() => setFilters({ type: "all", service: "all" })}
              >
                Clear filters
              </Button>
            </CardContent>
          </Card>
        )}
    </div>
  );
}

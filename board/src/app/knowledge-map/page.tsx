"use client";

import { useEffect, useState, useCallback } from "react";
import { api, getBoardWebSocket, type WsStatus } from "@/lib/api";
import type { GraphData } from "@/lib/api";
import { BentoGraph } from "@/components/knowledge-map/BentoGraph";
import { GraphControls } from "@/components/knowledge-map/GraphControls";
import { GraphLegend } from "@/components/knowledge-map/GraphLegend";
import { NodeDetailPanel } from "@/components/knowledge-map/NodeDetailPanel";
import type { ViewMode } from "@/components/knowledge-map/graphMapper";

// ── Knowledge Map Page ─────────────────────────────────────────────

export default function KnowledgeMapPage() {
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [wsStatus, setWsStatus] = useState<WsStatus>("disconnected");

  // Graph interaction state
  const [viewMode, setViewMode] = useState<ViewMode>("service");
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  // ── Data Fetching ──────────────────────────────────────────────

  const fetchGraph = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await api.graph();
    if (res.ok && res.data) {
      setGraphData(res.data);
    } else {
      setError(res.error?.message || "Failed to load graph data");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchGraph();
  }, [fetchGraph]);

  // ── WebSocket ──────────────────────────────────────────────────

  useEffect(() => {
    const ws = getBoardWebSocket();
    ws.connect();

    const unsubStatus = ws.onStatusChange((status) => setWsStatus(status));
    const unsubChange = ws.on("change", () => {
      fetchGraph();
    });

    return () => {
      unsubStatus();
      unsubChange();
    };
  }, [fetchGraph]);

  // ── Navigation ─────────────────────────────────────────────────

  const handleNavigateToService = useCallback((serviceName: string) => {
    window.location.href = `/services?name=${encodeURIComponent(serviceName)}`;
  }, []);

  const handleResetView = useCallback(() => {
    setSelectedNode(null);
  }, []);

  // ── Empty State ────────────────────────────────────────────────

  const isEmpty =
    !loading && !error && graphData && graphData.nodes.length === 0;

  // ── Render ─────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-border bg-card">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold text-foreground">Knowledge Map</h2>
          {wsStatus === "connected" && (
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="inline-block h-2 w-2 rounded-full bg-success status-dot-live" />
              Live
            </span>
          )}
        </div>

        {graphData && graphData.nodes.length > 0 && (
          <GraphControls
            viewMode={viewMode}
            onViewModeChange={(mode) => {
              setViewMode(mode);
              setSelectedNode(null);
            }}
            nodeCount={graphData.nodes.length}
            edgeCount={graphData.edges.length}
            onResetView={handleResetView}
          />
        )}
      </div>

      {/* Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Graph Area — full height */}
        <div className="flex-1 relative bg-background">
          {/* Loading State */}
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-card/80 z-10">
              <div className="text-center">
                <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-muted border-t-primary" />
                <p className="mt-3 text-sm text-muted-foreground">
                  Loading graph data...
                </p>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <div className="bento-card p-8 text-center max-w-md">
                <div className="text-3xl mb-4 text-danger">!</div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Graph data load failed
                </h3>
                <p className="text-sm text-danger mb-4">{error}</p>
                <button
                  onClick={fetchGraph}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  Retry
                </button>
              </div>
            </div>
          )}

          {/* Empty State */}
          {isEmpty && (
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <div className="bento-card !p-12 text-center max-w-md border-dashed border-2">
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  No graph data available
                </h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Run{" "}
                  <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono text-foreground">
                    edith_graphify
                  </code>{" "}
                  to generate the knowledge graph index first.
                </p>
              </div>
            </div>
          )}

          {/* BentoGraph (react-flow based) */}
          {graphData && graphData.nodes.length > 0 && (
            <BentoGraph
              data={graphData}
              viewMode={viewMode}
              selectedNode={selectedNode}
              onNodeClick={setSelectedNode}
              onNodeDoubleClick={(nodeId) => {
                const node = graphData.nodes.find((n) => n.id === nodeId);
                if (node?.type === "service") {
                  handleNavigateToService(nodeId);
                }
              }}
            />
          )}

          {/* Legend Overlay — bottom-left */}
          {graphData && graphData.nodes.length > 0 && (
            <div className="absolute bottom-16 left-4 z-20">
              <GraphLegend />
            </div>
          )}

          {/* Metadata Overlay — top-left */}
          {graphData && graphData.nodes.length > 0 && (
            <div className="absolute top-4 left-4 z-20">
              <div className="bento-card !py-1.5 !px-3 text-[10px] text-muted-foreground space-y-0.5">
                <div>
                  Generated:{" "}
                  {graphData.metadata.generatedAt
                    ? new Date(graphData.metadata.generatedAt).toLocaleString()
                    : "Unknown"}
                </div>
                {graphData.metadata.languages.length > 0 && (
                  <div>
                    Languages: {graphData.metadata.languages.join(", ")}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Detail Panel — right side */}
        {graphData && (
          <NodeDetailPanel
            nodeId={selectedNode}
            data={graphData}
            onClose={() => setSelectedNode(null)}
            onNavigateToService={handleNavigateToService}
          />
        )}
      </div>
    </div>
  );
}

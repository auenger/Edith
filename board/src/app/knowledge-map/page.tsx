"use client";

import { useEffect, useState, useCallback } from "react";
import { api, getBoardWebSocket, type WsStatus } from "@/lib/api";
import type { GraphData } from "@/lib/api";
import { ForceGraph, type ViewMode } from "@/components/knowledge-map/ForceGraph";
import { GraphControls } from "@/components/knowledge-map/GraphControls";
import { GraphLegend } from "@/components/knowledge-map/GraphLegend";
import { NodeDetailPanel } from "@/components/knowledge-map/NodeDetailPanel";

// ── Knowledge Map Page ─────────────────────────────────────────────

export default function KnowledgeMapPage() {
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [wsStatus, setWsStatus] = useState<WsStatus>("disconnected");

  // Graph interaction state
  const [viewMode, setViewMode] = useState<ViewMode>("service");
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  // ── Data Fetching ──────────────────────────────────────────────

  const fetchGraph = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await api.graph();
    if (res.ok && res.data) {
      setGraphData(res.data);
    } else {
      setError(
        res.error?.message || "Failed to load graph data",
      );
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
      // Only refetch if graph-related file changed
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

  // ── Zoom (delegated to D3) ─────────────────────────────────────

  const handleZoomIn = useCallback(() => {
    // Zoom handled by D3 zoom behavior inside ForceGraph
    // These buttons are placeholders for external control
  }, []);

  const handleZoomOut = useCallback(() => {}, []);
  const handleResetView = useCallback(() => {
    setSelectedNode(null);
    setHoveredNode(null);
  }, []);

  // ── Empty State ────────────────────────────────────────────────

  const isEmpty =
    !loading && !error && graphData && graphData.nodes.length === 0;

  // ── Render ─────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full -m-6">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold text-gray-900">Knowledge Map</h2>
          {wsStatus === "connected" && (
            <span className="flex items-center gap-1.5 text-xs text-gray-500">
              <span className="inline-block h-2 w-2 rounded-full bg-green-500" />
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
              setHoveredNode(null);
            }}
            nodeCount={graphData.nodes.length}
            edgeCount={graphData.edges.length}
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            onResetView={handleResetView}
          />
        )}
      </div>

      {/* Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Graph Area */}
        <div className="flex-1 relative bg-gray-50">
          {/* Loading State */}
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
              <div className="text-center">
                <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
                <p className="mt-3 text-sm text-gray-500">
                  Loading graph data...
                </p>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <div className="rounded-lg border border-red-200 bg-white p-8 text-center max-w-md">
                <div className="text-4xl mb-4">&#x26a0;&#xfe0f;</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Graph data load failed
                </h3>
                <p className="text-sm text-red-600 mb-4">{error}</p>
                <button
                  onClick={fetchGraph}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
                >
                  Retry
                </button>
              </div>
            </div>
          )}

          {/* Empty State */}
          {isEmpty && (
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <div className="rounded-lg border-2 border-dashed border-gray-300 bg-white p-12 text-center max-w-md">
                <div className="text-4xl mb-4">&#x1f5fa;&#xfe0f;</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No graph data available
                </h3>
                <p className="text-sm text-gray-500 mb-6">
                  Run{" "}
                  <code className="rounded bg-gray-100 px-1.5 py-0.5 text-sm font-mono">
                    edith_graphify
                  </code>{" "}
                  to generate the knowledge graph index first.
                </p>
              </div>
            </div>
          )}

          {/* Graph */}
          {graphData && graphData.nodes.length > 0 && (
            <ForceGraph
              data={graphData}
              viewMode={viewMode}
              selectedNode={selectedNode}
              onNodeClick={setSelectedNode}
              onNodeDoubleClick={(nodeId) => {
                // Double-click: navigate to service detail for service nodes
                const node = graphData.nodes.find((n) => n.id === nodeId);
                if (node?.type === "service") {
                  handleNavigateToService(nodeId);
                }
              }}
              hoveredNode={hoveredNode}
              onNodeHover={setHoveredNode}
            />
          )}

          {/* Legend Overlay */}
          {graphData && graphData.nodes.length > 0 && (
            <div className="absolute bottom-4 left-4 z-20">
              <GraphLegend />
            </div>
          )}

          {/* Metadata Overlay */}
          {graphData && graphData.nodes.length > 0 && (
            <div className="absolute top-4 left-4 z-20">
              <div className="rounded-md bg-white/80 backdrop-blur-sm border border-gray-200 px-3 py-1.5 text-[10px] text-gray-500 space-y-0.5">
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

        {/* Detail Panel */}
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

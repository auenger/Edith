"use client";

import {
  useEffect,
  useRef,
  useCallback,
  useState,
  useMemo,
} from "react";
import * as d3 from "d3";
import type { GraphData } from "@/lib/api";

// ── Types ──────────────────────────────────────────────────────────

interface GraphNode extends d3.SimulationNodeDatum {
  id: string;
  type: "service" | "concept";
  knowledgeCompleteness: number;
  endpoints?: number;
}

interface GraphEdge extends d3.SimulationLinkDatum<GraphNode> {
  source: string | GraphNode;
  target: string | GraphNode;
  label: string;
  confidence: "EXTRACTED" | "INFERRED" | "AMBIGUOUS";
  weight: number;
}

export type ViewMode = "service" | "concept";

interface ForceGraphProps {
  data: GraphData;
  viewMode: ViewMode;
  selectedNode: string | null;
  onNodeClick: (nodeId: string | null) => void;
  onNodeDoubleClick: (nodeId: string) => void;
  hoveredNode: string | null;
  onNodeHover: (nodeId: string | null) => void;
}

// ── Confidence Colors ──────────────────────────────────────────────

const CONFIDENCE_STYLES: Record<
  string,
  { color: string; dashArray: string }
> = {
  EXTRACTED: { color: "#16a34a", dashArray: "none" },
  INFERRED: { color: "#d97706", dashArray: "none" },
  AMBIGUOUS: { color: "#dc2626", dashArray: "6,3" },
};

// ── Node Radius ────────────────────────────────────────────────────

function nodeRadius(completeness: number, type: string): number {
  const base = type === "concept" ? 6 : 10;
  const scaled = base + completeness * 14;
  return Math.max(6, scaled);
}

function edgeWidth(weight: number): number {
  return Math.max(1, Math.min(6, weight * 3));
}

// ── Connected node helper ──────────────────────────────────────────

function isNodeConnected(
  nodeId: string,
  selectedId: string,
  edges: GraphEdge[],
): boolean {
  for (const e of edges) {
    const src = typeof e.source === "string" ? e.source : e.source.id;
    const tgt = typeof e.target === "string" ? e.target : e.target.id;
    if (
      (src === selectedId && tgt === nodeId) ||
      (tgt === selectedId && src === nodeId)
    ) {
      return true;
    }
  }
  return false;
}

// ── ForceGraph Component ───────────────────────────────────────────

export function ForceGraph({
  data,
  viewMode,
  selectedNode,
  onNodeClick,
  onNodeDoubleClick,
  hoveredNode,
  onNodeHover,
}: ForceGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const simulationRef = useRef<d3.Simulation<GraphNode, GraphEdge> | null>(
    null,
  );
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const lastClickRef = useRef<{ nodeId: string; time: number } | null>(null);

  // ── Filter data by view mode ────────────────────────────────────

  const { filteredNodes, filteredEdges } = useMemo(() => {
    if (viewMode === "service") {
      return {
        filteredNodes: data.nodes,
        filteredEdges: data.edges,
      };
    }

    // Concept view: show all nodes, concept-type edges prioritized
    const conceptNodeIds = new Set(
      data.nodes.filter((n) => n.type === "concept").map((n) => n.id),
    );

    const conceptEdges = data.edges.filter(
      (e) =>
        conceptNodeIds.has(e.source) ||
        conceptNodeIds.has(e.target) ||
        true,
    );

    return {
      filteredNodes: data.nodes,
      filteredEdges: conceptEdges,
    };
  }, [data, viewMode]);

  // ── Resize observer ─────────────────────────────────────────────

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          setDimensions({ width, height });
        }
      }
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // ── D3 Render ───────────────────────────────────────────────────

  const renderGraph = useCallback(() => {
    const svgEl = svgRef.current;
    if (!svgEl) return;

    const svg = d3.select<SVGSVGElement, unknown>(svgEl);
    const { width, height } = dimensions;

    // Clear previous
    svg.selectAll("*").remove();

    // Build typed arrays
    const nodes: GraphNode[] = filteredNodes.map((n) => ({
      id: n.id,
      type: n.type,
      knowledgeCompleteness: n.knowledgeCompleteness,
      endpoints: n.endpoints,
    }));

    const edges: GraphEdge[] = filteredEdges.map((e) => ({
      source: e.source,
      target: e.target,
      label: e.label,
      confidence: e.confidence,
      weight: e.weight,
    }));

    // SVG structure
    const defs = svg.append("defs");

    // Glow filter for selected nodes
    const filter = defs.append("filter").attr("id", "glow");
    filter
      .append("feGaussianBlur")
      .attr("stdDeviation", "3")
      .attr("result", "coloredBlur");
    const feMerge = filter.append("feMerge");
    feMerge.append("feMergeNode").attr("in", "coloredBlur");
    feMerge.append("feMergeNode").attr("in", "SourceGraphic");

    const g = svg
      .append("g")
      .attr("class", "graph-container")
      .attr("transform", `translate(${width / 2}, ${height / 2})`);

    // Zoom behavior
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.2, 4])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });

    svg.call(zoom as never);

    // Initial transform centered
    svg.call(
      zoom.transform as never,
      d3.zoomIdentity.translate(width / 2, height / 2),
    );

    // ── Edges ─────────────────────────────────────────────────────

    const edgeGroup = g.append("g").attr("class", "edges");

    const edgePaths = edgeGroup
      .selectAll("line")
      .data(edges)
      .join("line")
      .attr("stroke", (d) => CONFIDENCE_STYLES[d.confidence]?.color || "#999")
      .attr("stroke-width", (d) => edgeWidth(d.weight))
      .attr("stroke-dasharray", (d) => CONFIDENCE_STYLES[d.confidence]?.dashArray || "none")
      .attr("stroke-opacity", 0.6)
      .attr("class", "edge");

    // Edge labels
    const edgeLabels = edgeGroup
      .selectAll<SVGTextElement, GraphEdge>("text")
      .data(edges)
      .join("text")
      .text((d) => d.label)
      .attr("font-size", "9px")
      .attr("fill", "#9ca3af")
      .attr("text-anchor", "middle")
      .attr("dy", -4)
      .attr("class", "edge-label")
      .style("pointer-events", "none")
      .style("user-select", "none");

    // ── Nodes ─────────────────────────────────────────────────────

    const nodeGroup = g.append("g").attr("class", "nodes");

    const nodeElements = nodeGroup
      .selectAll<SVGGElement, GraphNode>("g")
      .data(nodes)
      .join("g")
      .attr("class", "node")
      .style("cursor", "pointer")
      .call(
        d3
          .drag<SVGGElement, GraphNode>()
          .on("start", (event, d) => {
            if (!event.active) simulationRef.current?.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on("drag", (event, d) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on("end", (event, d) => {
            if (!event.active) simulationRef.current?.alphaTarget(0);
            d.fx = null;
            d.fy = null;
          }) as never,
      );

    // Node circles
    nodeElements
      .append("circle")
      .attr("r", (d) => nodeRadius(d.knowledgeCompleteness, d.type))
      .attr("fill", (d) =>
        d.type === "service" ? "#3b82f6" : "#8b5cf6",
      )
      .attr("stroke", (d) => {
        if (selectedNode === d.id) return "#fbbf24";
        if (hoveredNode === d.id) return "#93c5fd";
        return "#fff";
      })
      .attr("stroke-width", (d) => {
        if (selectedNode === d.id) return 3;
        if (hoveredNode === d.id) return 2;
        return 1.5;
      })
      .attr("filter", (d) =>
        selectedNode === d.id ? "url(#glow)" : "none",
      )
      .attr("opacity", (d) => {
        if (!selectedNode) return 1;
        if (selectedNode === d.id) return 1;
        return isNodeConnected(d.id, selectedNode, edges) ? 1 : 0.25;
      });

    // Node labels
    nodeElements
      .append("text")
      .text((d) => d.id)
      .attr("font-size", (d) => (d.type === "service" ? "11px" : "9px"))
      .attr("font-weight", (d) =>
        d.type === "service" ? "600" : "400",
      )
      .attr("fill", "#374151")
      .attr("text-anchor", "middle")
      .attr("dy", (d) => nodeRadius(d.knowledgeCompleteness, d.type) + 14)
      .style("pointer-events", "none")
      .style("user-select", "none");

    // Endpoint count badge for service nodes
    nodeElements
      .filter((d) => d.type === "service" && d.endpoints !== undefined && d.endpoints > 0)
      .append("text")
      .text((d) => `${d.endpoints} EP`)
      .attr("font-size", "8px")
      .attr("fill", "#6b7280")
      .attr("text-anchor", "middle")
      .attr("dy", (d) => nodeRadius(d.knowledgeCompleteness, d.type) + 24)
      .style("pointer-events", "none")
      .style("user-select", "none");

    // ── Events ────────────────────────────────────────────────────

    nodeElements.on("click", (_event: MouseEvent, d: GraphNode) => {
      _event.stopPropagation();
      const now = Date.now();
      const last = lastClickRef.current;

      // Double-click detection
      if (last && last.nodeId === d.id && now - last.time < 350) {
        onNodeDoubleClick(d.id);
        lastClickRef.current = null;
        return;
      }

      lastClickRef.current = { nodeId: d.id, time: now };
      onNodeClick(selectedNode === d.id ? null : d.id);
    });

    nodeElements.on("mouseenter", (_event: MouseEvent, d: GraphNode) => {
      onNodeHover(d.id);
    });

    nodeElements.on("mouseleave", () => {
      onNodeHover(null);
    });

    // Click on background deselects
    svg.on("click", () => {
      onNodeClick(null);
      onNodeHover(null);
    });

    // ── Simulation ────────────────────────────────────────────────

    // Stop previous simulation
    simulationRef.current?.stop();

    const simulation = d3
      .forceSimulation<GraphNode>(nodes)
      .force(
        "link",
        d3
          .forceLink<GraphNode, GraphEdge>(edges)
          .id((d) => d.id)
          .distance(80)
          .strength(0.5),
      )
      .force("charge", d3.forceManyBody().strength(-200))
      .force("center", d3.forceCenter(0, 0))
      .force(
        "collision",
        d3.forceCollide<GraphNode>().radius((d) =>
          nodeRadius(d.knowledgeCompleteness, d.type) + 5,
        ),
      )
      .alphaDecay(0.02);

    simulation.on("tick", () => {
      edgePaths
        .attr("x1", (d) => (d.source as GraphNode).x ?? 0)
        .attr("y1", (d) => (d.source as GraphNode).y ?? 0)
        .attr("x2", (d) => (d.target as GraphNode).x ?? 0)
        .attr("y2", (d) => (d.target as GraphNode).y ?? 0);

      edgeLabels
        .attr("x", (d) => {
          const sx = (d.source as GraphNode).x ?? 0;
          const tx = (d.target as GraphNode).x ?? 0;
          return (sx + tx) / 2;
        })
        .attr("y", (d) => {
          const sy = (d.source as GraphNode).y ?? 0;
          const ty = (d.target as GraphNode).y ?? 0;
          return (sy + ty) / 2;
        });

      nodeElements.attr("transform", (d) => `translate(${d.x ?? 0}, ${d.y ?? 0})`);
    });

    simulationRef.current = simulation;

    return () => {
      simulation.stop();
    };
  }, [
    filteredNodes,
    filteredEdges,
    dimensions,
    selectedNode,
    hoveredNode,
    viewMode,
    onNodeClick,
    onNodeDoubleClick,
    onNodeHover,
  ]);

  // ── Re-render on data/state changes ────────────────────────────

  useEffect(() => {
    const cleanup = renderGraph();
    return () => {
      cleanup?.();
      simulationRef.current?.stop();
    };
  }, [renderGraph]);

  // ── Render ──────────────────────────────────────────────────────

  return (
    <div ref={containerRef} className="w-full h-full relative">
      <svg
        ref={svgRef}
        width={dimensions.width}
        height={dimensions.height}
        className="block"
      />
      {filteredNodes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-sm text-gray-400">No nodes to display</p>
        </div>
      )}
    </div>
  );
}

/**
 * Data mapping layer: GraphData → @xyflow/react Node[] + Edge[]
 *
 * Maps the backend GraphData format (from api.graph()) to react-flow
 * compatible node and edge arrays with Bento-styled visual properties.
 */

import type { Node, Edge } from "@xyflow/react";
import type { GraphData } from "@/lib/api";

// ── Confidence styling ──────────────────────────────────────────────

export const CONFIDENCE_STYLES: Record<
  string,
  { color: string; label: string; dashed: boolean }
> = {
  EXTRACTED: { color: "#16a34a", label: "Source-verified", dashed: false },
  INFERRED: { color: "#d97706", label: "Semantically derived", dashed: false },
  AMBIGUOUS: { color: "#dc2626", label: "Needs review", dashed: true },
};

// ── Node type styling ───────────────────────────────────────────────

export const NODE_TYPE_STYLES: Record<
  string,
  { color: string; bgColor: string; label: string }
> = {
  service: {
    color: "#2563eb",
    bgColor: "#eff6ff",
    label: "Service",
  },
  concept: {
    color: "#7c3aed",
    bgColor: "#f5f3ff",
    label: "Concept",
  },
};

// ── Custom node data type ───────────────────────────────────────────

export interface BentoServiceNodeData {
  label: string;
  type: "service" | "concept";
  knowledgeCompleteness: number;
  endpoints?: number;
  color: string;
  bgColor: string;
  connectionCount: number;
  [key: string]: unknown;
}

// ── Mapping functions ───────────────────────────────────────────────

/** Count connections for each node from edges */
function countConnections(data: GraphData): Map<string, number> {
  const counts = new Map<string, number>();
  for (const edge of data.edges) {
    counts.set(edge.source, (counts.get(edge.source) || 0) + 1);
    counts.set(edge.target, (counts.get(edge.target) || 0) + 1);
  }
  return counts;
}

/** Map GraphData.nodes → react-flow Node[] */
export function mapNodes(data: GraphData): Node<BentoServiceNodeData>[] {
  const connectionCounts = countConnections(data);

  return data.nodes.map((node) => {
    const typeStyle = NODE_TYPE_STYLES[node.type] || NODE_TYPE_STYLES.service;
    const connections = connectionCounts.get(node.id) || 0;

    return {
      id: node.id,
      type: "bentoService",
      position: { x: 0, y: 0 }, // Will be computed by dagre layout
      data: {
        label: node.id,
        type: node.type,
        knowledgeCompleteness: node.knowledgeCompleteness,
        endpoints: node.endpoints,
        color: typeStyle.color,
        bgColor: typeStyle.bgColor,
        connectionCount: connections,
      },
    };
  });
}

/** Map GraphData.edges → react-flow Edge[] */
export function mapEdges(data: GraphData): Edge[] {
  return data.edges.map((edge, index) => {
    const confidenceStyle =
      CONFIDENCE_STYLES[edge.confidence] || CONFIDENCE_STYLES.INFERRED;

    return {
      id: `edge-${index}`,
      source: edge.source,
      target: edge.target,
      label: edge.label,
      animated: false,
      style: {
        stroke: confidenceStyle.color,
        strokeWidth: Math.max(1, Math.min(5, edge.weight * 2.5)),
        strokeDasharray: confidenceStyle.dashed ? "6,3" : undefined,
        strokeOpacity: 0.6,
      },
      labelStyle: {
        fill: "#9ca3af",
        fontSize: 9,
        fontWeight: 400,
      },
      labelBgStyle: {
        fill: "white",
        fillOpacity: 0.8,
      },
      labelBgPadding: [4, 2] as [number, number],
      data: {
        confidence: edge.confidence,
        weight: edge.weight,
      },
    };
  });
}

// ── View mode filter ────────────────────────────────────────────────

export type ViewMode = "service" | "concept";

export function filterByViewMode(
  data: GraphData,
  viewMode: ViewMode,
): GraphData {
  if (viewMode === "service") {
    return data;
  }

  // Concept view: show all nodes, all edges
  return {
    ...data,
    nodes: data.nodes,
    edges: data.edges,
  };
}

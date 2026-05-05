"use client";

import { useCallback, useMemo, useRef } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type NodeMouseHandler,
  type OnNodesChange,
  type OnEdgesChange,
  BackgroundVariant,
} from "@xyflow/react";
import dagre from "dagre";
import "@xyflow/react/dist/style.css";

import type { GraphData } from "@/lib/api";
import {
  mapNodes,
  mapEdges,
  filterByViewMode,
  NODE_TYPE_STYLES,
  type BentoServiceNodeData,
  type ViewMode,
} from "./graphMapper";
import { BentoServiceNode } from "./BentoServiceNode";

// ── Dagre layout computation ────────────────────────────────────────

const DAGRE_CONFIG = {
  rankdir: "TB" as const,
  nodesep: 60,
  ranksep: 80,
  marginx: 40,
  marginy: 40,
};

function computeDagreLayout(
  nodes: { id: string; width?: number; height?: number }[],
  edges: { source: string; target: string }[],
): Map<string, { x: number; y: number }> {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph(DAGRE_CONFIG);

  for (const node of nodes) {
    g.setNode(node.id, {
      width: node.width || 180,
      height: node.height || 80,
    });
  }

  for (const edge of edges) {
    g.setEdge(edge.source, edge.target);
  }

  dagre.layout(g);

  const positions = new Map<string, { x: number; y: number }>();
  for (const node of nodes) {
    const pos = g.node(node.id);
    if (pos) {
      positions.set(node.id, { x: pos.x, y: pos.y });
    }
  }

  return positions;
}

// ── Node types registration ─────────────────────────────────────────

const nodeTypes = {
  bentoService: BentoServiceNode,
};

// ── BentoGraph Props ────────────────────────────────────────────────

interface BentoGraphProps {
  data: GraphData;
  viewMode: ViewMode;
  selectedNode: string | null;
  onNodeClick: (nodeId: string | null) => void;
  onNodeDoubleClick: (nodeId: string) => void;
}

// ── BentoGraph Component ────────────────────────────────────────────

export function BentoGraph({
  data,
  viewMode,
  selectedNode,
  onNodeClick,
  onNodeDoubleClick,
}: BentoGraphProps) {
  // Filter data by view mode
  const filteredData = useMemo(
    () => filterByViewMode(data, viewMode),
    [data, viewMode],
  );

  // Map to react-flow format with dagre layout positions
  const { initialNodes, initialEdges } = useMemo(() => {
    const rfNodes = mapNodes(filteredData);
    const rfEdges = mapEdges(filteredData);

    // Compute dagre layout positions
    const layoutEdges = filteredData.edges.map((e) => ({
      source: e.source,
      target: e.target,
    }));
    const positions = computeDagreLayout(
      rfNodes.map((n) => ({ id: n.id, width: 180, height: 80 })),
      layoutEdges,
    );

    // Apply layout positions
    const positioned = rfNodes.map((node) => ({
      ...node,
      position: positions.get(node.id) || { x: 0, y: 0 },
    }));

    // Dim unconnected nodes when a node is selected
    // (will be applied via style in onNodesChange)

    return { initialNodes: positioned, initialEdges: rfEdges };
  }, [filteredData]);

  const [nodes, setNodes, onNodesChange] =
    useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] =
    useEdgesState(initialEdges);

  // Update nodes/edges when data changes
  const prevDataRef = useRef(filteredData);
  if (prevDataRef.current !== filteredData) {
    prevDataRef.current = filteredData;
    setNodes(initialNodes);
    setEdges(initialEdges);
  }

  // ── Node click handler ──────────────────────────────────────────

  const handleNodeClick: NodeMouseHandler = useCallback(
    (_event, node) => {
      onNodeClick(selectedNode === node.id ? null : node.id);
    },
    [selectedNode, onNodeClick],
  );

  const handleNodeDoubleClick: NodeMouseHandler = useCallback(
    (_event, node) => {
      onNodeDoubleClick(node.id);
    },
    [onNodeDoubleClick],
  );

  // Click on pane background deselects
  const handlePaneClick = useCallback(() => {
    onNodeClick(null);
  }, [onNodeClick]);

  // ── Pro options (disable attribution) ────────────────────────────

  return (
    <div className="w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        onNodeDoubleClick={handleNodeDoubleClick}
        onPaneClick={handlePaneClick}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.1}
        maxZoom={4}
        defaultEdgeOptions={{
          type: "default",
        }}
        proOptions={{ hideAttribution: true }}
        style={{ background: "transparent" }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          color="#e2e8f0"
        />
        <Controls
          showInteractive={false}
          position="bottom-left"
          className="!border-border !bg-card !shadow-bento-sm [&>button]:!bg-card [&>button]:!border-border [&>button]:!text-foreground [&>button:hover]:!bg-accent"
        />
        <MiniMap
          position="bottom-right"
          nodeColor={(node) => {
            const data = node.data as BentoServiceNodeData | undefined;
            if (data?.color) return data.color;
            return "#94a3b8";
          }}
          maskColor="rgba(0,0,0,0.1)"
          className="!border-border !bg-card !shadow-bento-sm"
          pannable
          zoomable
        />
      </ReactFlow>
    </div>
  );
}

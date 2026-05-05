"use client";

import type { ViewMode } from "./graphMapper";

interface GraphControlsProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  nodeCount: number;
  edgeCount: number;
  onResetView: () => void;
}

/**
 * Bento-styled graph controls — view mode toggle + stats.
 * Zoom/pan/reset are handled by react-flow's built-in <Controls>.
 */
export function GraphControls({
  viewMode,
  onViewModeChange,
  nodeCount,
  edgeCount,
  onResetView,
}: GraphControlsProps) {
  return (
    <div className="flex items-center gap-4">
      {/* View Mode Switcher — Bento pill toggle */}
      <div className="flex items-center rounded-lg border border-border bg-card p-0.5">
        <button
          onClick={() => onViewModeChange("service")}
          className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
            viewMode === "service"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:bg-accent hover:text-foreground"
          }`}
        >
          Service Dependency
        </button>
        <button
          onClick={() => onViewModeChange("concept")}
          className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
            viewMode === "concept"
              ? "bg-brand-500 text-white shadow-sm"
              : "text-muted-foreground hover:bg-accent hover:text-foreground"
          }`}
        >
          Concept Topology
        </button>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span>
          {nodeCount} node{nodeCount !== 1 ? "s" : ""}
        </span>
        <span className="text-border">|</span>
        <span>
          {edgeCount} edge{edgeCount !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Reset View button */}
      <button
        onClick={onResetView}
        className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
      >
        Reset
      </button>
    </div>
  );
}

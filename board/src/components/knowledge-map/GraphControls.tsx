"use client";

import type { ViewMode } from "./ForceGraph";

interface GraphControlsProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  nodeCount: number;
  edgeCount: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetView: () => void;
}

export function GraphControls({
  viewMode,
  onViewModeChange,
  nodeCount,
  edgeCount,
  onZoomIn,
  onZoomOut,
  onResetView,
}: GraphControlsProps) {
  return (
    <div className="flex items-center gap-4">
      {/* View Mode Switcher */}
      <div className="flex items-center rounded-lg border border-gray-200 bg-white p-0.5">
        <button
          onClick={() => onViewModeChange("service")}
          className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
            viewMode === "service"
              ? "bg-blue-600 text-white"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          Service Dependency
        </button>
        <button
          onClick={() => onViewModeChange("concept")}
          className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
            viewMode === "concept"
              ? "bg-purple-600 text-white"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          Concept Topology
        </button>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-3 text-xs text-gray-500">
        <span>
          {nodeCount} node{nodeCount !== 1 ? "s" : ""}
        </span>
        <span className="text-gray-300">|</span>
        <span>
          {edgeCount} edge{edgeCount !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Zoom Controls */}
      <div className="flex items-center rounded-lg border border-gray-200 bg-white">
        <button
          onClick={onZoomIn}
          className="px-2.5 py-1.5 text-gray-600 hover:bg-gray-100 transition-colors text-sm rounded-l-lg"
          title="Zoom in"
        >
          +
        </button>
        <div className="w-px h-5 bg-gray-200" />
        <button
          onClick={onResetView}
          className="px-2.5 py-1.5 text-gray-600 hover:bg-gray-100 transition-colors text-xs"
          title="Reset view"
        >
          Reset
        </button>
        <div className="w-px h-5 bg-gray-200" />
        <button
          onClick={onZoomOut}
          className="px-2.5 py-1.5 text-gray-600 hover:bg-gray-100 transition-colors text-sm rounded-r-lg"
          title="Zoom out"
        >
          -
        </button>
      </div>
    </div>
  );
}

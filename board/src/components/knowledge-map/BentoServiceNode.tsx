"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { BentoServiceNodeData } from "./graphMapper";

// ── Bento Service Node ──────────────────────────────────────────────
// Custom react-flow node styled as a Bento Card with:
// - Service name + type badge
// - Status color bar (top)
// - Connection count badge
// - Knowledge completeness bar

function BentoServiceNodeComponent({ data, selected }: NodeProps) {
  const nodeData = data as unknown as BentoServiceNodeData;
  const completenessPercent = Math.round(
    nodeData.knowledgeCompleteness * 100,
  );

  const completenessColor =
    completenessPercent >= 80
      ? "bg-success"
      : completenessPercent >= 50
        ? "bg-warning"
        : "bg-danger";

  return (
    <>
      {/* Source Handle (incoming edges) */}
      <Handle
        type="target"
        position={Position.Top}
        className="!w-2 !h-2 !bg-border !border-2 !border-card"
      />

      {/* Node Card */}
      <div
        className={`
          relative min-w-[160px] max-w-[200px] rounded-lg border bg-card
          shadow-bento-sm transition-all duration-150
          ${selected
            ? "border-primary shadow-bento-md ring-2 ring-primary/20 scale-[1.02]"
            : "border-border hover:shadow-bento-md hover:border-primary/30"
          }
        `}
      >
        {/* Status color bar (top) */}
        <div
          className="h-1 rounded-t-lg"
          style={{ backgroundColor: nodeData.color }}
        />

        {/* Content area */}
        <div className="px-3 py-2.5 space-y-2">
          {/* Header: name + badge */}
          <div className="flex items-start justify-between gap-2">
            <span className="text-xs font-semibold text-foreground leading-tight truncate">
              {nodeData.label}
            </span>
            {nodeData.connectionCount > 0 && (
              <span
                className="inline-flex items-center justify-center flex-shrink-0
                  min-w-[20px] h-5 rounded-full text-[9px] font-bold px-1.5"
                style={{
                  backgroundColor: nodeData.bgColor,
                  color: nodeData.color,
                }}
              >
                {nodeData.connectionCount}
              </span>
            )}
          </div>

          {/* Type + Endpoints row */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className="inline-flex items-center rounded px-1.5 py-0.5 text-[9px] font-medium"
              style={{
                backgroundColor: nodeData.bgColor,
                color: nodeData.color,
              }}
            >
              {nodeData.type === "service" ? "Service" : "Concept"}
            </span>
            {nodeData.endpoints !== undefined && nodeData.endpoints > 0 && (
              <span className="inline-flex items-center rounded bg-muted px-1.5 py-0.5 text-[9px] font-medium text-muted-foreground">
                {nodeData.endpoints} EP
              </span>
            )}
          </div>

          {/* Knowledge completeness bar */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-muted-foreground">
                Completeness
              </span>
              <span
                className={`text-[9px] font-bold ${
                  completenessPercent >= 80
                    ? "text-success"
                    : completenessPercent >= 50
                      ? "text-warning"
                      : "text-danger"
                }`}
              >
                {completenessPercent}%
              </span>
            </div>
            <div className="h-1 rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${completenessColor}`}
                style={{ width: `${completenessPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Target Handle (outgoing edges) */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-2 !h-2 !bg-border !border-2 !border-card"
      />
    </>
  );
}

export const BentoServiceNode = memo(BentoServiceNodeComponent);

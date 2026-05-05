"use client";

import { CONFIDENCE_STYLES, NODE_TYPE_STYLES } from "./graphMapper";

/**
 * Bento-styled graph legend — confidence colors + node types + interactions.
 * Overlaid on bottom-left of the graph area.
 */
export function GraphLegend() {
  return (
    <div className="bento-card space-y-3 text-xs">
      {/* Confidence Legend */}
      <div>
        <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
          Confidence
        </h4>
        <div className="space-y-1.5">
          {Object.entries(CONFIDENCE_STYLES).map(([key, style]) => (
            <div key={key} className="flex items-center gap-2">
              <span
                className="inline-block w-5 h-0.5 flex-shrink-0 rounded"
                style={{
                  backgroundColor: style.color,
                  borderTop: style.dashed
                    ? `2px dashed ${style.color}`
                    : "none",
                  height: style.dashed ? 0 : 2,
                }}
              />
              <span className="text-[10px] font-medium text-foreground">
                {key}
              </span>
              <span className="text-[10px] text-muted-foreground">
                {style.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Node Type Legend */}
      <div>
        <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
          Nodes
        </h4>
        <div className="space-y-1.5">
          {Object.entries(NODE_TYPE_STYLES).map(([key, style]) => (
            <div key={key} className="flex items-center gap-2">
              <span
                className="inline-flex items-center justify-center w-4 h-4 rounded flex-shrink-0 border"
                style={{
                  backgroundColor: style.bgColor,
                  borderColor: style.color,
                }}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: style.color }}
                />
              </span>
              <span className="text-[10px] font-medium text-foreground">
                {style.label}
              </span>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-muted-foreground mt-1.5">
          Bar shows knowledge completeness
        </p>
      </div>

      {/* Interactions */}
      <div>
        <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
          Interactions
        </h4>
        <div className="space-y-1 text-[10px] text-muted-foreground">
          <p>Click node: Show details</p>
          <p>Double-click: Go to service</p>
          <p>Drag: Reposition node</p>
          <p>Scroll: Zoom in/out</p>
        </div>
      </div>
    </div>
  );
}

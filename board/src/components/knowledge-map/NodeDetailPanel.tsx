"use client";

import type { GraphData } from "@/lib/api";
import { CONFIDENCE_STYLES, NODE_TYPE_STYLES } from "./graphMapper";

interface NodeDetailPanelProps {
  nodeId: string | null;
  data: GraphData;
  onClose: () => void;
  onNavigateToService: (serviceName: string) => void;
}

/**
 * Bento Card styled side panel for node details.
 * Shows service info, connections, confidence breakdown, and related services.
 */
export function NodeDetailPanel({
  nodeId,
  data,
  onClose,
  onNavigateToService,
}: NodeDetailPanelProps) {
  if (!nodeId) return null;

  const node = data.nodes.find((n) => n.id === nodeId);
  if (!node) return null;

  const incoming = data.edges.filter((e) => e.target === nodeId);
  const outgoing = data.edges.filter((e) => e.source === nodeId);

  const confidenceCounts = {
    EXTRACTED: 0,
    INFERRED: 0,
    AMBIGUOUS: 0,
  } as Record<string, number>;
  for (const edge of [...incoming, ...outgoing]) {
    confidenceCounts[edge.confidence] =
      (confidenceCounts[edge.confidence] || 0) + 1;
  }

  const completenessPercent = Math.round(node.knowledgeCompleteness * 100);
  const typeStyle = NODE_TYPE_STYLES[node.type] || NODE_TYPE_STYLES.service;

  return (
    <div className="w-80 border-l border-border bg-card flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: typeStyle.color }}
          />
          <h3 className="text-sm font-semibold text-foreground truncate">
            {node.id}
          </h3>
        </div>
        <button
          onClick={onClose}
          className="flex-shrink-0 rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {/* Type Badge + Link */}
        <div className="flex items-center gap-2">
          <span
            className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold"
            style={{
              backgroundColor: typeStyle.bgColor,
              color: typeStyle.color,
            }}
          >
            {typeStyle.label}
          </span>
          {node.type === "service" && (
            <a
              href={`/services?name=${encodeURIComponent(node.id)}`}
              onClick={(e) => {
                e.preventDefault();
                onNavigateToService(node.id);
              }}
              className="text-[10px] text-primary hover:text-primary/80 underline underline-offset-2 transition-colors"
            >
              View in Services
            </a>
          )}
        </div>

        {/* Knowledge Completeness — Bento progress */}
        <div className="bento-card !p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              Knowledge Completeness
            </span>
            <span
              className={`text-xs font-bold ${
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
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                completenessPercent >= 80
                  ? "bg-success"
                  : completenessPercent >= 50
                    ? "bg-warning"
                    : "bg-danger"
              }`}
              style={{ width: `${completenessPercent}%` }}
            />
          </div>
        </div>

        {/* Endpoints */}
        {node.endpoints !== undefined && (
          <div className="bento-card !p-3">
            <span className="text-xs text-muted-foreground">API Endpoints</span>
            <p className="text-lg font-bold text-foreground mt-1">
              {node.endpoints}
            </p>
          </div>
        )}

        {/* Connections Summary — Bento grid */}
        <div>
          <h4 className="text-xs text-muted-foreground mb-2">Connections</h4>
          <div className="grid grid-cols-2 gap-2">
            <div className="bento-card !p-3 text-center">
              <div className="text-lg font-bold text-foreground">
                {incoming.length}
              </div>
              <div className="text-[10px] text-muted-foreground">Incoming</div>
            </div>
            <div className="bento-card !p-3 text-center">
              <div className="text-lg font-bold text-foreground">
                {outgoing.length}
              </div>
              <div className="text-[10px] text-muted-foreground">Outgoing</div>
            </div>
          </div>
        </div>

        {/* Confidence Breakdown */}
        <div>
          <h4 className="text-xs text-muted-foreground mb-2">
            Confidence Breakdown
          </h4>
          <div className="space-y-1.5">
            {Object.entries(CONFIDENCE_STYLES).map(([key, style]) => (
              <div
                key={key}
                className="flex items-center justify-between text-xs rounded-md bg-muted/50 px-2.5 py-2"
              >
                <span className="flex items-center gap-1.5">
                  <span
                    className="inline-block h-2 w-2 rounded-full"
                    style={{ backgroundColor: style.color }}
                  />
                  <span className="font-medium text-foreground">{key}</span>
                </span>
                <span className="font-bold text-foreground">
                  {confidenceCounts[key] || 0}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Incoming Relations */}
        {incoming.length > 0 && (
          <div>
            <h4 className="text-xs text-muted-foreground mb-2">Depended by</h4>
            <div className="space-y-1.5">
              {incoming.map((edge, i) => (
                <RelationItem
                  key={`in-${i}`}
                  label={edge.source}
                  relation={edge.label}
                  confidence={edge.confidence}
                  weight={edge.weight}
                  onClick={() => onNavigateToService(edge.source)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Outgoing Relations */}
        {outgoing.length > 0 && (
          <div>
            <h4 className="text-xs text-muted-foreground mb-2">Depends on</h4>
            <div className="space-y-1.5">
              {outgoing.map((edge, i) => (
                <RelationItem
                  key={`out-${i}`}
                  label={edge.target}
                  relation={edge.label}
                  confidence={edge.confidence}
                  weight={edge.weight}
                  onClick={() => onNavigateToService(edge.target)}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Sub-component ──────────────────────────────────────────────────

function RelationItem({
  label,
  relation,
  confidence,
  weight,
  onClick,
}: {
  label: string;
  relation: string;
  confidence: string;
  weight: number;
  onClick: () => void;
}) {
  const style =
    CONFIDENCE_STYLES[confidence] || CONFIDENCE_STYLES.INFERRED;

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-2 rounded-md bg-muted/50 px-2.5 py-2 hover:bg-accent transition-colors text-left"
    >
      <span
        className="inline-block h-1.5 w-1.5 rounded-full flex-shrink-0"
        style={{ backgroundColor: style.color }}
      />
      <div className="flex-1 min-w-0">
        <div className="text-xs font-medium text-foreground truncate">
          {label}
        </div>
        <div className="text-[10px] text-muted-foreground truncate">
          {relation}
        </div>
      </div>
      <span className="text-[10px] text-muted-foreground flex-shrink-0">
        w:{weight.toFixed(1)}
      </span>
    </button>
  );
}

"use client";

import type { GraphData } from "@/lib/api";

interface NodeDetailPanelProps {
  nodeId: string | null;
  data: GraphData;
  onClose: () => void;
  onNavigateToService: (serviceName: string) => void;
}

export function NodeDetailPanel({
  nodeId,
  data,
  onClose,
  onNavigateToService,
}: NodeDetailPanelProps) {
  if (!nodeId) return null;

  const node = data.nodes.find((n) => n.id === nodeId);
  if (!node) return null;

  // Find connected edges
  const incoming = data.edges.filter((e) => e.target === nodeId);
  const outgoing = data.edges.filter((e) => e.source === nodeId);

  // Confidence counts
  const confidenceCounts = {
    EXTRACTED: 0,
    INFERRED: 0,
    AMBIGUOUS: 0,
  };
  for (const edge of [...incoming, ...outgoing]) {
    confidenceCounts[edge.confidence]++;
  }

  const completenessPercent = Math.round(node.knowledgeCompleteness * 100);

  return (
    <div className="w-72 border-l border-gray-200 bg-white flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-gray-900 truncate">
          {node.id}
        </h3>
        <button
          onClick={onClose}
          className="flex-shrink-0 rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
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
        {/* Type Badge */}
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
              node.type === "service"
                ? "bg-blue-50 text-blue-700"
                : "bg-purple-50 text-purple-700"
            }`}
          >
            {node.type === "service" ? "Service" : "Concept"}
          </span>
          {node.type === "service" && (
            <a
              href={`/services?name=${encodeURIComponent(node.id)}`}
              onClick={(e) => {
                e.preventDefault();
                onNavigateToService(node.id);
              }}
              className="text-[10px] text-blue-600 hover:text-blue-800 underline"
            >
              View in Services
            </a>
          )}
        </div>

        {/* Knowledge Completeness */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-500">
              Knowledge Completeness
            </span>
            <span
              className={`text-xs font-medium ${
                completenessPercent >= 80
                  ? "text-green-600"
                  : completenessPercent >= 50
                    ? "text-yellow-600"
                    : "text-red-600"
              }`}
            >
              {completenessPercent}%
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                completenessPercent >= 80
                  ? "bg-green-500"
                  : completenessPercent >= 50
                    ? "bg-yellow-500"
                    : "bg-red-500"
              }`}
              style={{ width: `${completenessPercent}%` }}
            />
          </div>
        </div>

        {/* Endpoints */}
        {node.endpoints !== undefined && (
          <div>
            <span className="text-xs text-gray-500">API Endpoints</span>
            <p className="text-sm font-medium text-gray-900">{node.endpoints}</p>
          </div>
        )}

        {/* Connections Summary */}
        <div>
          <h4 className="text-xs text-gray-500 mb-2">Connections</h4>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-md bg-gray-50 p-2 text-center">
              <div className="text-sm font-semibold text-gray-900">
                {incoming.length}
              </div>
              <div className="text-[10px] text-gray-500">Incoming</div>
            </div>
            <div className="rounded-md bg-gray-50 p-2 text-center">
              <div className="text-sm font-semibold text-gray-900">
                {outgoing.length}
              </div>
              <div className="text-[10px] text-gray-500">Outgoing</div>
            </div>
          </div>
        </div>

        {/* Confidence Breakdown */}
        <div>
          <h4 className="text-xs text-gray-500 mb-2">
            Confidence Breakdown
          </h4>
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-2 w-2 rounded-full bg-green-600" />
                EXTRACTED
              </span>
              <span className="font-medium text-gray-700">
                {confidenceCounts.EXTRACTED}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-2 w-2 rounded-full bg-amber-600" />
                INFERRED
              </span>
              <span className="font-medium text-gray-700">
                {confidenceCounts.INFERRED}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-2 w-2 rounded-full bg-red-600" />
                AMBIGUOUS
              </span>
              <span className="font-medium text-gray-700">
                {confidenceCounts.AMBIGUOUS}
              </span>
            </div>
          </div>
        </div>

        {/* Incoming Relations */}
        {incoming.length > 0 && (
          <div>
            <h4 className="text-xs text-gray-500 mb-2">Depended by</h4>
            <div className="space-y-1.5">
              {incoming.map((edge, i) => (
                <RelationItem
                  key={`in-${i}`}
                  source={edge.source}
                  label={edge.label}
                  confidence={edge.confidence}
                  weight={edge.weight}
                />
              ))}
            </div>
          </div>
        )}

        {/* Outgoing Relations */}
        {outgoing.length > 0 && (
          <div>
            <h4 className="text-xs text-gray-500 mb-2">Depends on</h4>
            <div className="space-y-1.5">
              {outgoing.map((edge, i) => (
                <RelationItem
                  key={`out-${i}`}
                  source={edge.target}
                  label={edge.label}
                  confidence={edge.confidence}
                  weight={edge.weight}
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
  source,
  label,
  confidence,
  weight,
}: {
  source: string;
  label: string;
  confidence: string;
  weight: number;
}) {
  const dotColor: Record<string, string> = {
    EXTRACTED: "bg-green-500",
    INFERRED: "bg-amber-500",
    AMBIGUOUS: "bg-red-500",
  };

  return (
    <div className="flex items-center gap-2 rounded-md bg-gray-50 px-2.5 py-1.5">
      <span
        className={`inline-block h-1.5 w-1.5 rounded-full flex-shrink-0 ${dotColor[confidence] || "bg-gray-300"}`}
      />
      <div className="flex-1 min-w-0">
        <div className="text-xs font-medium text-gray-700 truncate">
          {source}
        </div>
        <div className="text-[10px] text-gray-400 truncate">{label}</div>
      </div>
      <span className="text-[10px] text-gray-400 flex-shrink-0">
        w:{weight.toFixed(1)}
      </span>
    </div>
  );
}

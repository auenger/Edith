"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import type { ServiceDetail, LayerStatus } from "@/lib/api";

interface ServiceDetailModalProps {
  serviceName: string;
  onClose: () => void;
}

export function ServiceDetailModal({
  serviceName,
  onClose,
}: ServiceDetailModalProps) {
  const [detail, setDetail] = useState<ServiceDetail | null>(null);
  const [layers, setLayers] = useState<LayerStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showLayerConfirm, setShowLayerConfirm] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    const [detailRes, layersRes] = await Promise.all([
      api.service(serviceName),
      api.layers(serviceName),
    ]);

    if (detailRes.ok && detailRes.data) {
      setDetail(detailRes.data);
    } else {
      setError(detailRes.error?.message || "Failed to load service detail");
    }

    if (layersRes.ok && layersRes.data) {
      setLayers(layersRes.data);
    }

    setLoading(false);
  }, [serviceName]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  // Determine missing layers for completion actions
  const missingLayers: string[] = [];
  if (layers) {
    if (!layers.layer0.exists) missingLayers.push("L0");
    if (!layers.layer1.exists) missingLayers.push("L1");
    if (!layers.layer2.exists) missingLayers.push("L2");
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-3xl max-h-[85vh] mx-4 rounded-xl bg-white shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {serviceName}
            </h2>
            {detail && (
              <p className="text-sm text-gray-500 mt-0.5">{detail.role}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            <svg
              className="h-5 w-5"
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
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
              <span className="ml-3 text-sm text-gray-500">
                Loading service detail...
              </span>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Detail Content */}
          {detail && !loading && (
            <>
              {/* Meta Information */}
              <MetaSection detail={detail} />

              {/* Layer Status */}
              {layers && (
                <LayerSection
                  layers={layers}
                  missingLayers={missingLayers}
                  onLayerComplete={(layer) => setShowLayerConfirm(layer)}
                />
              )}

              {/* API Endpoints */}
              {detail.quickRef?.apiEndpoints &&
                detail.quickRef.apiEndpoints.length > 0 && (
                  <EndpointsSection
                    endpoints={detail.quickRef.apiEndpoints}
                  />
                )}

              {/* Constraints */}
              {detail.quickRef?.constraints &&
                detail.quickRef.constraints.length > 0 && (
                  <ConstraintsSection
                    constraints={detail.quickRef.constraints}
                  />
                )}

              {/* Pitfalls */}
              {detail.quickRef?.pitfalls &&
                detail.quickRef.pitfalls.length > 0 && (
                  <PitfallsSection pitfalls={detail.quickRef.pitfalls} />
                )}

              {/* Distillates */}
              {detail.distillates && detail.distillates.length > 0 && (
                <DistillatesSection distillates={detail.distillates} />
              )}
            </>
          )}
        </div>

        {/* Layer Completion Confirmation Dialog */}
        {showLayerConfirm && (
          <LayerConfirmDialog
            layer={showLayerConfirm}
            serviceName={serviceName}
            onConfirm={() => {
              // In a real implementation, this would trigger edith_distill via Agent
              alert(
                `Triggering Agent to complete ${showLayerConfirm} for ${serviceName}. This requires EDITH Agent integration.`
              );
              setShowLayerConfirm(null);
            }}
            onCancel={() => setShowLayerConfirm(null)}
          />
        )}
      </div>
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────────

function MetaSection({ detail }: { detail: ServiceDetail }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
      <h3 className="text-sm font-semibold text-gray-900 mb-3">
        Overview
      </h3>
      <div className="grid grid-cols-2 gap-3 text-sm">
        {detail.stack && (
          <div>
            <span className="text-gray-500">Stack:</span>{" "}
            <span className="font-medium text-gray-900">{detail.stack}</span>
          </div>
        )}
        {detail.owner && (
          <div>
            <span className="text-gray-500">Owner:</span>{" "}
            <span className="font-medium text-gray-900">{detail.owner}</span>
          </div>
        )}
        {detail.quickRef?.verify && detail.quickRef.verify.length > 0 && (
          <div className="col-span-2">
            <span className="text-gray-500">Verify:</span>{" "}
            <code className="rounded bg-white px-1.5 py-0.5 text-xs font-mono">
              {detail.quickRef.verify[0]}
            </code>
          </div>
        )}
      </div>
    </div>
  );
}

function LayerSection({
  layers,
  missingLayers,
  onLayerComplete,
}: {
  layers: LayerStatus;
  missingLayers: string[];
  onLayerComplete: (layer: string) => void;
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900">
          Knowledge Layers
        </h3>
        {missingLayers.length > 0 && (
          <span className="text-xs text-amber-600">
            Missing: {missingLayers.join(", ")}
          </span>
        )}
      </div>

      <div className="space-y-2">
        <LayerRow
          label="L0 - Routing Table"
          exists={layers.layer0.exists}
          path={layers.layer0.path}
          missingAction={
            !layers.layer0.exists
              ? () => onLayerComplete("L0")
              : undefined
          }
        />
        <LayerRow
          label="L1 - Quick Ref"
          exists={layers.layer1.exists}
          path={layers.layer1.path}
          detail={
            layers.layer1.exists
              ? `${layers.layer1.sections.length} sections`
              : undefined
          }
          missingAction={
            !layers.layer1.exists
              ? () => onLayerComplete("L1")
              : undefined
          }
        />
        <LayerRow
          label="L2 - Distillates"
          exists={layers.layer2.exists}
          path={layers.layer2.path}
          detail={
            layers.layer2.exists
              ? `${layers.layer2.fragmentCount} fragments, ${layers.layer2.totalTokens.toLocaleString()} tokens`
              : undefined
          }
          missingAction={
            !layers.layer2.exists
              ? () => onLayerComplete("L2")
              : undefined
          }
        />
      </div>
    </div>
  );
}

function LayerRow({
  label,
  exists,
  path,
  detail,
  missingAction,
}: {
  label: string;
  exists: boolean;
  path: string;
  detail?: string;
  missingAction?: () => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-md px-3 py-2 hover:bg-gray-50">
      <div className="flex items-center gap-3">
        <span
          className={`inline-block h-2 w-2 rounded-full ${exists ? "bg-green-500" : "bg-gray-300"}`}
        />
        <div>
          <p className="text-sm font-medium text-gray-900">{label}</p>
          <p className="text-xs text-gray-400 font-mono">{path}</p>
          {detail && <p className="text-xs text-gray-500 mt-0.5">{detail}</p>}
        </div>
      </div>
      {!exists && missingAction && (
        <button
          onClick={missingAction}
          className="inline-flex items-center rounded-md bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700 hover:bg-amber-100 transition-colors"
        >
          Complete
        </button>
      )}
    </div>
  );
}

function EndpointsSection({ endpoints }: { endpoints: string[] }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-900 mb-2">
        API Endpoints ({endpoints.length})
      </h3>
      <div className="rounded-lg border border-gray-200 divide-y divide-gray-100">
        {endpoints.map((ep, i) => (
          <div
            key={i}
            className="flex items-center gap-2 px-3 py-2 text-sm"
          >
            <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs font-mono text-gray-700">
              {ep}
            </code>
          </div>
        ))}
      </div>
    </div>
  );
}

function ConstraintsSection({ constraints }: { constraints: string[] }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-900 mb-2">
        Key Constraints ({constraints.length})
      </h3>
      <ul className="space-y-1.5">
        {constraints.map((c, i) => (
          <li
            key={i}
            className="flex items-start gap-2 text-sm text-gray-700"
          >
            <span className="text-blue-500 mt-0.5">&#x2022;</span>
            {c}
          </li>
        ))}
      </ul>
    </div>
  );
}

function PitfallsSection({ pitfalls }: { pitfalls: string[] }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-900 mb-2">
        Common Pitfalls ({pitfalls.length})
      </h3>
      <ul className="space-y-1.5">
        {pitfalls.map((p, i) => (
          <li
            key={i}
            className="flex items-start gap-2 text-sm text-gray-700"
          >
            <span className="text-amber-500 mt-0.5">⚠</span>
            {p}
          </li>
        ))}
      </ul>
    </div>
  );
}

function DistillatesSection({
  distillates,
}: {
  distillates: Array<{ file: string; topic: string; summary: string; estimatedTokens: number }>;
}) {
  const totalTokens = distillates.reduce(
    (sum, d) => sum + d.estimatedTokens,
    0,
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-gray-900">
          Distillate Fragments ({distillates.length})
        </h3>
        <span className="text-xs text-gray-500">
          {totalTokens.toLocaleString()} estimated tokens
        </span>
      </div>
      <div className="rounded-lg border border-gray-200 divide-y divide-gray-100">
        {distillates.map((d, i) => (
          <div key={i} className="px-3 py-2.5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-900">{d.topic}</p>
              <span className="text-xs text-gray-400">
                {d.estimatedTokens.toLocaleString()} tokens
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
              {d.summary}
            </p>
            <p className="text-xs text-gray-400 font-mono mt-1">{d.file}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function LayerConfirmDialog({
  layer,
  serviceName,
  onConfirm,
  onCancel,
}: {
  layer: string;
  serviceName: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/20 rounded-b-xl">
      <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-lg mx-4 max-w-sm">
        <h3 className="text-sm font-semibold text-gray-900 mb-2">
          Complete {layer} for {serviceName}?
        </h3>
        <p className="text-xs text-gray-500 mb-4">
          This will trigger EDITH Agent to run the appropriate tool to generate
          the missing knowledge layer. The process may take a few minutes.
        </p>
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={onCancel}
            className="rounded-md px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState, useCallback } from "react";
import { api, getBoardWebSocket, type WsStatus } from "@/lib/api";
import type { FileTreeNode, ArtifactContent } from "@/lib/api";
import { FileTree } from "@/components/artifacts/FileTree";
import { ArtifactPreview } from "@/components/artifacts/ArtifactPreview";

// ── Artifacts Page ───────────────────────────────────────────────

export default function ArtifactsPage() {
  const [tree, setTree] = useState<FileTreeNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [wsStatus, setWsStatus] = useState<WsStatus>("disconnected");
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [artifactContent, setArtifactContent] = useState<ArtifactContent | null>(null);
  const [contentLoading, setContentLoading] = useState(false);
  const [contentError, setContentError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"markdown" | "raw" | "tokens">("markdown");

  // ── Fetch File Tree ───────────────────────────────────────────

  const fetchTree = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await api.artifactsTree();
    if (res.ok && res.data) {
      setTree(res.data);
    } else {
      setError(res.error?.message || "Failed to load artifacts tree");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchTree();
  }, [fetchTree]);

  // ── WebSocket ─────────────────────────────────────────────────

  useEffect(() => {
    const ws = getBoardWebSocket();
    ws.connect();

    const unsubStatus = ws.onStatusChange((status) => setWsStatus(status));
    const unsubChange = ws.on("change", () => {
      fetchTree();
      // Re-fetch artifact if one is selected
      if (selectedPath) {
        fetchArtifact(selectedPath);
      }
    });

    return () => {
      unsubStatus();
      unsubChange();
    };
  }, [fetchTree, selectedPath]);

  // ── Fetch Artifact Content ────────────────────────────────────

  const fetchArtifact = useCallback(async (path: string) => {
    setContentLoading(true);
    setContentError(null);
    const res = await api.artifact(path);
    if (res.ok && res.data) {
      setArtifactContent(res.data);
    } else {
      setArtifactContent(null);
      setContentError(res.error?.message || "File not found or may have been externally modified");
    }
    setContentLoading(false);
  }, []);

  const handleSelectFile = useCallback(
    (path: string) => {
      setSelectedPath(path);
      fetchArtifact(path);
    },
    [fetchArtifact],
  );

  // ── Empty State ───────────────────────────────────────────────

  const isEmpty = !loading && tree.length === 0;

  // ── Render ────────────────────────────────────────────────────

  return (
    <div className="space-y-4 h-full flex flex-col">
      {/* Page Header */}
      <div className="flex items-center justify-between flex-shrink-0">
        <h2 className="text-2xl font-bold text-gray-900">Artifacts</h2>
        <div className="flex items-center gap-3 text-sm text-gray-500">
          {wsStatus === "connected" && (
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2 w-2 rounded-full bg-green-500" />
              Live
            </span>
          )}
        </div>
      </div>

      {/* Empty State */}
      {isEmpty && (
        <div className="rounded-lg border-2 border-dashed border-gray-300 bg-white p-12 text-center">
          <div className="mx-auto max-w-md">
            <div className="text-4xl mb-4">&#x1f4c1;</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No artifacts found
            </h3>
            <p className="text-sm text-gray-500">
              The knowledge repository is empty. Run{" "}
              <code className="rounded bg-gray-100 px-1.5 py-0.5 text-sm font-mono">
                edith_scan
              </code>{" "}
              and{" "}
              <code className="rounded bg-gray-100 px-1.5 py-0.5 text-sm font-mono">
                edith_distill
              </code>{" "}
              to generate knowledge artifacts.
            </p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-700">{error}</p>
          <button
            onClick={fetchTree}
            className="mt-2 text-sm text-red-600 underline hover:text-red-800"
          >
            Retry
          </button>
        </div>
      )}

      {/* Main Content: File Tree + Preview */}
      {!isEmpty && !error && (
        <div className="flex-1 flex gap-4 min-h-0">
          {/* Left: File Tree */}
          <div className="w-72 flex-shrink-0 rounded-lg border border-gray-200 bg-white overflow-hidden flex flex-col">
            <div className="px-3 py-2.5 border-b border-gray-200 bg-gray-50">
              <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                File Explorer
              </h3>
            </div>

            {loading ? (
              <div className="p-3 space-y-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="animate-pulse h-4 rounded bg-gray-100"
                    style={{ width: `${60 + Math.random() * 40}%` }}
                  />
                ))}
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto p-2">
                <FileTree
                  nodes={tree}
                  selectedPath={selectedPath}
                  onSelect={handleSelectFile}
                />
              </div>
            )}
          </div>

          {/* Right: Preview */}
          <div className="flex-1 flex flex-col rounded-lg border border-gray-200 bg-white overflow-hidden">
            {/* Preview Header */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center gap-2 min-w-0">
                {selectedPath ? (
                  <>
                    <span className="text-xs text-gray-400">File:</span>
                    <span className="text-xs font-mono text-gray-700 truncate">
                      {selectedPath}
                    </span>
                  </>
                ) : (
                  <span className="text-xs text-gray-400">
                    Select a file to preview
                  </span>
                )}
              </div>

              {/* View Mode Toggle */}
              {selectedPath && (
                <div className="flex items-center gap-1 flex-shrink-0">
                  <ViewModeButton
                    active={viewMode === "markdown"}
                    onClick={() => setViewMode("markdown")}
                  >
                    Markdown
                  </ViewModeButton>
                  <ViewModeButton
                    active={viewMode === "raw"}
                    onClick={() => setViewMode("raw")}
                  >
                    Raw
                  </ViewModeButton>
                  <ViewModeButton
                    active={viewMode === "tokens"}
                    onClick={() => setViewMode("tokens")}
                  >
                    Token Count
                  </ViewModeButton>
                </div>
              )}
            </div>

            {/* Preview Content */}
            <div className="flex-1 overflow-y-auto">
              {!selectedPath && (
                <div className="flex items-center justify-center h-full text-sm text-gray-400">
                  <div className="text-center">
                    <div className="text-3xl mb-2">&#x1f4c4;</div>
                    <p>Select a file from the tree to preview</p>
                  </div>
                </div>
              )}

              {selectedPath && contentLoading && (
                <div className="flex items-center justify-center h-full">
                  <div className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
                </div>
              )}

              {selectedPath && contentError && !contentLoading && (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center p-6">
                    <div className="text-3xl mb-2">&#x26a0;&#xfe0f;</div>
                    <p className="text-sm text-red-600">{contentError}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      File may have been externally modified or deleted
                    </p>
                  </div>
                </div>
              )}

              {selectedPath && artifactContent && !contentLoading && !contentError && (
                <ArtifactPreview
                  content={artifactContent}
                  viewMode={viewMode}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── View Mode Button ────────────────────────────────────────────

function ViewModeButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
        active
          ? "bg-blue-100 text-blue-700"
          : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
      }`}
    >
      {children}
    </button>
  );
}

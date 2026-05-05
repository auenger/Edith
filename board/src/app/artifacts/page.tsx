"use client";

import { useEffect, useState, useCallback } from "react";
import { api, getBoardWebSocket, type WsStatus } from "@/lib/api";
import type { FileTreeNode, ArtifactContent } from "@/lib/api";
import { FileTree } from "@/components/artifacts/FileTree";
import { ArtifactPreview } from "@/components/artifacts/ArtifactPreview";
import { EmptyState } from "@/components/shared/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  ActivityIcon,
  FolderTreeIcon,
  FileIcon,
  AlertCircleIcon,
} from "lucide-react";

// -- Artifacts Page --

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

  // -- Fetch File Tree --

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

  // -- WebSocket --

  useEffect(() => {
    const ws = getBoardWebSocket();
    ws.connect();

    const unsubStatus = ws.onStatusChange((status) => setWsStatus(status));
    const unsubChange = ws.on("change", () => {
      fetchTree();
      if (selectedPath) {
        fetchArtifact(selectedPath);
      }
    });

    return () => {
      unsubStatus();
      unsubChange();
    };
  }, [fetchTree, selectedPath]);

  // -- Fetch Artifact Content --

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
    [fetchArtifact]
  );

  // -- Empty State --

  const isEmpty = !loading && tree.length === 0;

  // -- Render --

  return (
    <div className="p-6 space-y-4 h-full flex flex-col">
      {/* Page Header */}
      <div className="flex items-center justify-between flex-shrink-0">
        <h2 className="text-2xl font-bold text-foreground">Artifacts</h2>
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          {wsStatus === "connected" && (
            <span className="flex items-center gap-1.5">
              <ActivityIcon className="size-3 text-success status-dot-live" />
              Live
            </span>
          )}
        </div>
      </div>

      {/* Empty State */}
      {isEmpty && (
        <EmptyState
          icon={<FolderTreeIcon className="size-10 text-muted-foreground" />}
          title="No artifacts found"
          description={
            <>
              The knowledge repository is empty. Run{" "}
              <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">
                edith_scan
              </code>{" "}
              and{" "}
              <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">
                edith_distill
              </code>{" "}
              to generate knowledge artifacts.
            </>
          }
        />
      )}

      {/* Error State */}
      {error && (
        <div className="bento-card border-danger/30 bg-danger-light/30">
          <p className="text-sm text-danger">{error}</p>
          <button
            onClick={fetchTree}
            className="mt-2 text-sm text-danger underline hover:no-underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Main Content: File Tree + Preview */}
      {!isEmpty && !error && (
        <div className="flex-1 flex gap-4 min-h-0">
          {/* Left: File Tree */}
          <div className="w-72 flex-shrink-0 bento-card flex flex-col overflow-hidden p-0">
            <div className="px-3 py-2.5 border-b border-border bg-muted/30">
              <div className="flex items-center gap-2">
                <FolderTreeIcon className="size-3.5 text-muted-foreground" />
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  File Explorer
                </span>
              </div>
            </div>

            {loading ? (
              <div className="p-3 space-y-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton
                    key={i}
                    className="h-4 rounded"
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
          <div className="flex-1 flex flex-col bento-card overflow-hidden p-0">
            {!selectedPath && (
              <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                <div className="text-center">
                  <FileIcon className="size-8 mx-auto mb-2 text-muted-foreground/50" />
                  <p>Select a file from the tree to preview</p>
                </div>
              </div>
            )}

            {selectedPath && contentLoading && (
              <div className="flex items-center justify-center h-full">
                <div className="space-y-3 w-full px-6">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-4 w-2/3" />
                  <Separator className="my-4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-4/5" />
                  <Skeleton className="h-4 w-3/5" />
                </div>
              </div>
            )}

            {selectedPath && contentError && !contentLoading && (
              <div className="flex items-center justify-center h-full">
                <div className="text-center p-6">
                  <AlertCircleIcon className="size-8 mx-auto mb-2 text-warning" />
                  <p className="text-sm text-danger">{contentError}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    File may have been externally modified or deleted
                  </p>
                </div>
              </div>
            )}

            {selectedPath && artifactContent && !contentLoading && !contentError && (
              <ArtifactPreview
                content={artifactContent}
                viewMode={viewMode}
                onViewModeChange={setViewMode}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

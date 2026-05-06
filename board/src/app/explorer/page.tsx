"use client";

import { useEffect, useState, useCallback } from "react";
import { api, getBoardWebSocket, type WsStatus } from "@/lib/api";
import type {
  FileTreeNode,
  ArtifactContent,
  VaultFileNode,
  GovernanceConflict,
} from "@/lib/api";
import { FileTree } from "@/components/artifacts/FileTree";
import { ArtifactPreview } from "@/components/artifacts/ArtifactPreview";
import { VaultTree } from "@/components/explorer/VaultTree";
import { VaultFilePreview } from "@/components/explorer/VaultFilePreview";
import { GovernanceStatusBadge } from "@/components/explorer/GovernanceStatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ActivityIcon,
  FolderTreeIcon,
  FileIcon,
  VaultIcon,
  AlertCircleIcon,
} from "lucide-react";

// ── Explorer Page ───────────────────────────────────────────────

export default function ExplorerPage() {
  // Shared state
  const [activeTab, setActiveTab] = useState<string>("artifacts");
  const [wsStatus, setWsStatus] = useState<WsStatus>("disconnected");

  // Artifacts state
  const [tree, setTree] = useState<FileTreeNode[]>([]);
  const [treeLoading, setTreeLoading] = useState(true);
  const [treeError, setTreeError] = useState<string | null>(null);
  const [selectedArtifactPath, setSelectedArtifactPath] = useState<string | null>(null);
  const [artifactContent, setArtifactContent] = useState<ArtifactContent | null>(null);
  const [contentLoading, setContentLoading] = useState(false);
  const [contentError, setContentError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"markdown" | "raw" | "tokens">("markdown");

  // Vault state
  const [vaultTree, setVaultTree] = useState<VaultFileNode[]>([]);
  const [vaultLoading, setVaultLoading] = useState(true);
  const [vaultNoData, setVaultNoData] = useState(false);
  const [selectedVaultPath, setSelectedVaultPath] = useState<string | null>(null);
  const [vaultContent, setVaultContent] = useState<ArtifactContent | null>(null);
  const [vaultContentLoading, setVaultContentLoading] = useState(false);
  const [vaultContentError, setVaultContentError] = useState<string | null>(null);
  const [vaultViewMode, setVaultViewMode] = useState<"markdown" | "raw" | "tokens">("markdown");

  // Governance status map (for Vault files)
  const [vaultStatusMap, setVaultStatusMap] = useState<Map<string, string>>(new Map());

  // ── Artifacts Fetching ────────────────────────────────────────

  const fetchTree = useCallback(async () => {
    setTreeLoading(true);
    setTreeError(null);
    const res = await api.artifactsTree();
    if (res.ok && res.data) {
      setTree(res.data);
    } else {
      setTreeError(res.error?.message || "Failed to load artifacts tree");
    }
    setTreeLoading(false);
  }, []);

  const fetchArtifact = useCallback(async (path: string) => {
    setContentLoading(true);
    setContentError(null);
    const res = await api.artifact(path);
    if (res.ok && res.data) {
      setArtifactContent(res.data);
    } else {
      setArtifactContent(null);
      setContentError(res.error?.message || "File not found");
    }
    setContentLoading(false);
  }, []);

  const handleSelectArtifact = useCallback(
    (path: string) => {
      setSelectedArtifactPath(path);
      fetchArtifact(path);
    },
    [fetchArtifact],
  );

  // ── Vault Fetching ────────────────────────────────────────────

  const fetchVaultTree = useCallback(async () => {
    setVaultLoading(true);
    const res = await api.vaultTree();
    if (res.ok && res.data) {
      setVaultTree(res.data.tree || []);
      setVaultNoData(!!res.data._noData || (res.data.tree || []).length === 0);

      // Build status map from vault tree nodes
      const statusMap = new Map<string, string>();
      collectStatuses(res.data.tree || [], statusMap);
      setVaultStatusMap(statusMap);
    } else {
      setVaultTree([]);
      setVaultNoData(true);
    }
    setVaultLoading(false);
  }, []);

  const collectStatuses = (nodes: VaultFileNode[], map: Map<string, string>) => {
    for (const node of nodes) {
      if (node.governance_status && node.governance_status !== "none") {
        map.set(node.path, node.governance_status);
      }
      if (node.children) {
        collectStatuses(node.children, map);
      }
    }
  };

  const fetchVaultFile = useCallback(async (path: string) => {
    setVaultContentLoading(true);
    setVaultContentError(null);
    // Vault files are served through the same artifact API
    const res = await api.artifact(path);
    if (res.ok && res.data) {
      setVaultContent(res.data);
    } else {
      setVaultContent(null);
      setVaultContentError(res.error?.message || "File not found");
    }
    setVaultContentLoading(false);
  }, []);

  const handleSelectVaultFile = useCallback(
    (path: string) => {
      setSelectedVaultPath(path);
      fetchVaultFile(path);
    },
    [fetchVaultFile],
  );

  // ── Initial Load ──────────────────────────────────────────────

  useEffect(() => {
    fetchTree();
    fetchVaultTree();
  }, [fetchTree, fetchVaultTree]);

  // ── WebSocket ─────────────────────────────────────────────────

  useEffect(() => {
    const ws = getBoardWebSocket();
    ws.connect();

    const unsubStatus = ws.onStatusChange((status) => setWsStatus(status));
    const unsubChange = ws.on("change", () => {
      fetchTree();
      fetchVaultTree();
      if (activeTab === "artifacts" && selectedArtifactPath) {
        fetchArtifact(selectedArtifactPath);
      }
      if (activeTab === "vault" && selectedVaultPath) {
        fetchVaultFile(selectedVaultPath);
      }
    });

    // Listen for governance events to refresh vault
    const unsubGov = ws.on("governance:update", () => {
      if (activeTab === "vault") {
        fetchVaultTree();
        if (selectedVaultPath) {
          fetchVaultFile(selectedVaultPath);
        }
      }
    });

    return () => {
      unsubStatus();
      unsubChange();
      unsubGov();
    };
  }, [fetchTree, fetchVaultTree, fetchArtifact, fetchVaultFile, activeTab, selectedArtifactPath, selectedVaultPath]);

  // ── Render Helpers ────────────────────────────────────────────

  const isTreeEmpty = !treeLoading && tree.length === 0;

  return (
    <div className="p-6 space-y-4 h-full flex flex-col">
      {/* Page Header */}
      <div className="flex items-center justify-between flex-shrink-0">
        <h2 className="text-2xl font-bold text-foreground">Explorer</h2>
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          {wsStatus === "connected" && (
            <span className="flex items-center gap-1.5">
              <ActivityIcon className="size-3 text-success status-dot-live" />
              Live
            </span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
        <TabsList className="w-fit">
          <TabsTrigger value="artifacts">
            <FolderTreeIcon className="size-3.5 mr-1.5" />
            Artifacts
          </TabsTrigger>
          <TabsTrigger value="vault">
            <VaultIcon className="size-3.5 mr-1.5" />
            Vault
          </TabsTrigger>
        </TabsList>

        {/* ── Artifacts Tab ──────────────────────────────────────── */}
        <TabsContent value="artifacts" className="flex-1 min-h-0 mt-4">
          {isTreeEmpty && (
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

          {treeError && (
            <div className="bento-card border-danger/30 bg-danger-light/30">
              <p className="text-sm text-danger">{treeError}</p>
              <button
                onClick={fetchTree}
                className="mt-2 text-sm text-danger underline hover:no-underline"
              >
                Retry
              </button>
            </div>
          )}

          {!isTreeEmpty && !treeError && (
            <div className="flex gap-4 h-full min-h-0">
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

                {treeLoading ? (
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
                      selectedPath={selectedArtifactPath}
                      onSelect={handleSelectArtifact}
                    />
                  </div>
                )}
              </div>

              {/* Right: Preview */}
              <div className="flex-1 flex flex-col bento-card overflow-hidden p-0">
                {!selectedArtifactPath && (
                  <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                    <div className="text-center">
                      <FileIcon className="size-8 mx-auto mb-2 text-muted-foreground/50" />
                      <p>Select a file from the tree to preview</p>
                    </div>
                  </div>
                )}

                {selectedArtifactPath && contentLoading && (
                  <div className="flex items-center justify-center h-full">
                    <div className="space-y-3 w-full px-6">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                      <Skeleton className="h-4 w-2/3" />
                    </div>
                  </div>
                )}

                {selectedArtifactPath && contentError && !contentLoading && (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center p-6">
                      <AlertCircleIcon className="size-8 mx-auto mb-2 text-warning" />
                      <p className="text-sm text-danger">{contentError}</p>
                    </div>
                  </div>
                )}

                {selectedArtifactPath && artifactContent && !contentLoading && !contentError && (
                  <ArtifactPreview
                    content={artifactContent}
                    viewMode={viewMode}
                    onViewModeChange={setViewMode}
                  />
                )}
              </div>
            </div>
          )}
        </TabsContent>

        {/* ── Vault Tab ──────────────────────────────────────────── */}
        <TabsContent value="vault" className="flex-1 min-h-0 mt-4">
          {vaultNoData && !vaultLoading && (
            <EmptyState
              icon={<VaultIcon className="size-10 text-muted-foreground" />}
              title="Obsidian Vault not configured"
              description={
                <>
                  The Obsidian Vault has not been generated yet. Use{" "}
                  <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">
                    edith_obsidian
                  </code>{" "}
                  to map knowledge artifacts to an Obsidian Vault structure.
                </>
              }
            />
          )}

          {!vaultNoData && (
            <div className="flex gap-4 h-full min-h-0">
              {/* Left: Vault Tree */}
              <div className="w-72 flex-shrink-0 bento-card flex flex-col overflow-hidden p-0">
                <div className="px-3 py-2.5 border-b border-border bg-muted/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <VaultIcon className="size-3.5 text-muted-foreground" />
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Vault Explorer
                      </span>
                    </div>
                  </div>
                  {/* Legend */}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    <GovernanceStatusBadge status="scaffold" compact />
                    <span className="text-[10px] text-muted-foreground">Scaffold</span>
                    <GovernanceStatusBadge status="reviewed" compact />
                    <span className="text-[10px] text-muted-foreground">Reviewed</span>
                    <GovernanceStatusBadge status="mature" compact />
                    <span className="text-[10px] text-muted-foreground">Mature</span>
                    <GovernanceStatusBadge status="stale" compact />
                    <span className="text-[10px] text-muted-foreground">Stale</span>
                  </div>
                </div>

                {vaultLoading ? (
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
                    <VaultTree
                      nodes={vaultTree}
                      selectedPath={selectedVaultPath}
                      onSelect={handleSelectVaultFile}
                    />
                  </div>
                )}
              </div>

              {/* Right: Vault File Preview */}
              <div className="flex-1 flex flex-col bento-card overflow-hidden p-0">
                {!selectedVaultPath && (
                  <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                    <div className="text-center">
                      <FileIcon className="size-8 mx-auto mb-2 text-muted-foreground/50" />
                      <p>Select a Vault file to preview with governance metadata</p>
                    </div>
                  </div>
                )}

                {selectedVaultPath && vaultContentLoading && (
                  <div className="flex items-center justify-center h-full">
                    <div className="space-y-3 w-full px-6">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                      <Skeleton className="h-4 w-2/3" />
                    </div>
                  </div>
                )}

                {selectedVaultPath && vaultContentError && !vaultContentLoading && (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center p-6">
                      <AlertCircleIcon className="size-8 mx-auto mb-2 text-warning" />
                      <p className="text-sm text-danger">{vaultContentError}</p>
                    </div>
                  </div>
                )}

                {selectedVaultPath && vaultContent && !vaultContentLoading && !vaultContentError && (
                  <VaultFilePreview
                    content={vaultContent}
                    governanceStatus={vaultStatusMap.get(selectedVaultPath) as any}
                    viewMode={vaultViewMode}
                    onViewModeChange={setVaultViewMode}
                  />
                )}
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

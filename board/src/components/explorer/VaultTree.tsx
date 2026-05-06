"use client";

import { useState, useCallback } from "react";
import type { VaultFileNode } from "@/lib/api";
import { ChevronRightIcon, FolderIcon, FolderOpenIcon, FileIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { GovernanceStatusBadge } from "./GovernanceStatusBadge";

// ── Vault Tree Props ────────────────────────────────────────────

interface VaultTreeProps {
  nodes: VaultFileNode[];
  selectedPath: string | null;
  onSelect: (path: string) => void;
}

// ── Vault Tree ──────────────────────────────────────────────────

export function VaultTree({ nodes, selectedPath, onSelect }: VaultTreeProps) {
  return (
    <div className="space-y-0.5">
      {nodes.map((node) => (
        <VaultTreeNode
          key={node.path}
          node={node}
          depth={0}
          selectedPath={selectedPath}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}

// ── Vault Tree Node ─────────────────────────────────────────────

interface VaultTreeNodeProps {
  node: VaultFileNode;
  depth: number;
  selectedPath: string | null;
  onSelect: (path: string) => void;
}

function VaultTreeNode({ node, depth, selectedPath, onSelect }: VaultTreeNodeProps) {
  const [expanded, setExpanded] = useState(depth < 1);
  const isDir = node.type === "directory";
  const isSelected = selectedPath === node.path;

  const handleClick = useCallback(() => {
    if (isDir) {
      setExpanded((prev) => !prev);
    } else {
      onSelect(node.path);
    }
  }, [isDir, node.path, onSelect]);

  return (
    <div>
      <div
        onClick={handleClick}
        className={cn(
          "flex items-center gap-1.5 rounded-md px-2 py-1.5 cursor-pointer text-sm transition-colors",
          isSelected
            ? "bg-primary/10 text-primary"
            : "text-foreground hover:bg-muted"
        )}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
        title={node.path}
      >
        {/* Expand/Collapse Arrow for Directories */}
        {isDir ? (
          <ChevronRightIcon
            className={cn(
              "size-3 flex-shrink-0 transition-transform duration-150",
              expanded && "rotate-90"
            )}
          />
        ) : (
          <span className="w-3 flex-shrink-0" />
        )}

        {/* Icon */}
        {isDir ? (
          expanded ? (
            <FolderOpenIcon className="size-4 flex-shrink-0 text-warning" />
          ) : (
            <FolderIcon className="size-4 flex-shrink-0 text-warning" />
          )
        ) : (
          <FileIcon
            className={cn(
              "size-4 flex-shrink-0",
              getFileIconColor(node.name, node.governance_status)
            )}
          />
        )}

        <span className="truncate flex-1">{node.name}</span>

        {/* Governance Status Badge */}
        {!isDir && node.governance_status && node.governance_status !== "none" && (
          <GovernanceStatusBadge status={node.governance_status} compact />
        )}
      </div>

      {/* Children */}
      {isDir && expanded && node.children && (
        <div>
          {node.children.map((child) => (
            <VaultTreeNode
              key={child.path}
              node={child}
              depth={depth + 1}
              selectedPath={selectedPath}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── File Icon Color Helper ──────────────────────────────────────

function getFileIconColor(
  name: string,
  status?: string,
): string {
  // Prioritize governance status color
  if (status === "stale") return "text-warning";
  if (status === "reviewed") return "text-success";
  if (status === "mature") return "text-brand-500";
  if (status === "scaffold") return "text-info";

  // Default color by file extension
  if (name.endsWith(".md")) return "text-primary";
  if (name.endsWith(".json")) return "text-warning";
  return "text-muted-foreground";
}

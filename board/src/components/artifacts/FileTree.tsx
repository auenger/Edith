"use client";

import { useState, useCallback } from "react";
import type { FileTreeNode } from "@/lib/api";
import { ChevronRightIcon, FolderIcon, FolderOpenIcon, FileIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileTreeProps {
  nodes: FileTreeNode[];
  selectedPath: string | null;
  onSelect: (path: string) => void;
}

export function FileTree({ nodes, selectedPath, onSelect }: FileTreeProps) {
  return (
    <div className="space-y-0.5">
      {nodes.map((node) => (
        <TreeNode
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

// -- Tree Node --

interface TreeNodeProps {
  node: FileTreeNode;
  depth: number;
  selectedPath: string | null;
  onSelect: (path: string) => void;
}

function TreeNode({ node, depth, selectedPath, onSelect }: TreeNodeProps) {
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
              getFileIconColor(node.name)
            )}
          />
        )}

        <span className="truncate">{node.name}</span>
      </div>

      {/* Children */}
      {isDir && expanded && node.children && (
        <div>
          {node.children.map((child) => (
            <TreeNode
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

// -- File Icon Color Helper --

function getFileIconColor(name: string): string {
  if (name.endsWith(".md")) return "text-primary";
  if (name.endsWith(".json")) return "text-warning";
  if (name.endsWith(".yaml") || name.endsWith(".yml")) return "text-info";
  if (name.endsWith(".ts") || name.endsWith(".tsx")) return "text-primary";
  if (name.endsWith(".js") || name.endsWith(".jsx")) return "text-warning";
  if (name.endsWith(".py")) return "text-success";
  return "text-muted-foreground";
}

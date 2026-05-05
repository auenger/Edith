"use client";

import { useState, useCallback } from "react";
import type { FileTreeNode } from "@/lib/api";

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

// ── Tree Node ───────────────────────────────────────────────────

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

  // Choose icon based on file extension
  const icon = isDir
    ? expanded
      ? "📂"
      : "📁"
    : getFileIcon(node.name);

  return (
    <div>
      <div
        onClick={handleClick}
        className={`flex items-center gap-1.5 rounded-md px-2 py-1 cursor-pointer text-sm transition-colors ${
          isSelected
            ? "bg-blue-50 text-blue-700"
            : "text-gray-700 hover:bg-gray-100"
        }`}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
        title={node.path}
      >
        {/* Expand/Collapse Arrow for Directories */}
        {isDir && (
          <svg
            className={`h-3 w-3 flex-shrink-0 transition-transform ${
              expanded ? "rotate-90" : ""
            }`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
              clipRule="evenodd"
            />
          </svg>
        )}
        {!isDir && <span className="w-3 flex-shrink-0" />}

        <span className="flex-shrink-0 text-sm">{icon}</span>
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

// ── File Icon Helper ────────────────────────────────────────────

function getFileIcon(name: string): string {
  if (name.endsWith(".md")) return "📄";
  if (name.endsWith(".json")) return "📋";
  if (name.endsWith(".yaml") || name.endsWith(".yml")) return "⚙️";
  if (name.endsWith(".ts") || name.endsWith(".tsx")) return "🔷";
  if (name.endsWith(".js") || name.endsWith(".jsx")) return "🟨";
  if (name.endsWith(".py")) return "🐍";
  if (name.endsWith(".go")) return "🔵";
  if (name.endsWith(".java")) return "☕";
  return "📄";
}

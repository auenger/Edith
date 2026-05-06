"use client";

import type { ArtifactContent } from "@/lib/api";
import { GovernanceStatusBadge } from "./GovernanceStatusBadge";
import { Separator } from "@/components/ui/separator";

// ── Vault File Preview Props ────────────────────────────────────

interface VaultFilePreviewProps {
  content: ArtifactContent;
  governanceStatus?: "scaffold" | "reviewed" | "mature" | "stale" | "none";
  viewMode: "markdown" | "raw" | "tokens";
  onViewModeChange: (mode: "markdown" | "raw" | "tokens") => void;
}

// ── Vault File Preview ──────────────────────────────────────────

export function VaultFilePreview({
  content,
  governanceStatus,
  viewMode,
  onViewModeChange,
}: VaultFilePreviewProps) {
  // Extract frontmatter metadata for display
  const metadata = parseFrontmatter(content.content);

  return (
    <div className="flex flex-col h-full">
      {/* Header: file info + governance status */}
      <div className="px-4 py-3 border-b border-border flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-foreground truncate">
              {content.path}
            </h3>
            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
              <span>{(content.size / 1024).toFixed(1)} KB</span>
              <span>Modified {new Date(content.modified).toLocaleDateString()}</span>
            </div>
          </div>
          <GovernanceStatusBadge status={governanceStatus} />
        </div>

        {/* Governance metadata */}
        {metadata && (
          <div className="mt-2 flex flex-wrap gap-2">
            {metadata.lifecycle_status && (
              <span className="text-[11px] text-muted-foreground">
                Status: {metadata.lifecycle_status}
              </span>
            )}
            {metadata.confidence && (
              <span className="text-[11px] text-muted-foreground">
                Confidence: {metadata.confidence}
              </span>
            )}
            {metadata.freshness && (
              <span className="text-[11px] text-muted-foreground">
                Freshness: {(metadata.freshness * 100).toFixed(0)}%
              </span>
            )}
          </div>
        )}
      </div>

      {/* View mode tabs */}
      <div className="px-4 py-1.5 border-b border-border flex gap-1 flex-shrink-0">
        {(["markdown", "raw", "tokens"] as const).map((mode) => (
          <button
            key={mode}
            onClick={() => onViewModeChange(mode)}
            className={`
              px-2.5 py-1 text-xs font-medium rounded transition-colors
              ${viewMode === mode
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }
            `}
          >
            {mode.charAt(0).toUpperCase() + mode.slice(1)}
          </button>
        ))}
      </div>

      <Separator />

      {/* Content area */}
      <div className="flex-1 overflow-y-auto p-4">
        {viewMode === "raw" ? (
          <pre className="text-xs text-foreground font-mono whitespace-pre-wrap break-words">
            {content.content}
          </pre>
        ) : viewMode === "tokens" ? (
          <div className="space-y-3">
            <div className="rounded-md bg-muted px-3 py-2">
              <p className="text-xs text-muted-foreground">
                Estimated tokens: ~{Math.ceil(content.content.length / 3)}
              </p>
              <p className="text-xs text-muted-foreground">
                Characters: {content.content.length}
              </p>
              <p className="text-xs text-muted-foreground">
                Lines: {content.content.split("\n").length}
              </p>
            </div>
            <pre className="text-xs text-foreground font-mono whitespace-pre-wrap break-words">
              {content.content}
            </pre>
          </div>
        ) : (
          <div className="prose prose-sm max-w-none dark:prose-invert">
            {/* Simple markdown rendering */}
            {renderMarkdown(content.content)}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Frontmatter Parser ──────────────────────────────────────────

interface FrontmatterData {
  lifecycle_status?: string;
  confidence?: string;
  freshness?: number;
  [key: string]: string | number | undefined;
}

function parseFrontmatter(content: string): FrontmatterData | null {
  if (!content.startsWith("---")) return null;

  const endIndex = content.indexOf("---", 3);
  if (endIndex === -1) return null;

  const frontmatter = content.slice(3, endIndex).trim();
  const data: FrontmatterData = {};

  for (const line of frontmatter.split("\n")) {
    const colonIndex = line.indexOf(":");
    if (colonIndex === -1) continue;

    const key = line.slice(0, colonIndex).trim();
    let value: string | number = line.slice(colonIndex + 1).trim();

    // Remove quotes
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    // Parse numbers
    if (!isNaN(Number(value)) && value !== "") {
      value = Number(value);
    }

    data[key] = value;
  }

  return Object.keys(data).length > 0 ? data : null;
}

// ── Simple Markdown Renderer ────────────────────────────────────

function renderMarkdown(content: string): React.ReactNode[] {
  // Strip frontmatter
  let body = content;
  if (body.startsWith("---")) {
    const endIndex = body.indexOf("---", 3);
    if (endIndex !== -1) {
      body = body.slice(endIndex + 3).trim();
    }
  }

  const lines = body.split("\n");
  const elements: React.ReactNode[] = [];
  let key = 0;

  for (const line of lines) {
    if (line.startsWith("### ")) {
      elements.push(
        <h4 key={key++} className="text-sm font-semibold text-foreground mt-3 mb-1">
          {line.slice(4)}
        </h4>
      );
    } else if (line.startsWith("## ")) {
      elements.push(
        <h3 key={key++} className="text-base font-semibold text-foreground mt-4 mb-1">
          {line.slice(3)}
        </h3>
      );
    } else if (line.startsWith("# ")) {
      elements.push(
        <h2 key={key++} className="text-lg font-bold text-foreground mt-4 mb-2">
          {line.slice(2)}
        </h2>
      );
    } else if (line.startsWith("- ") || line.startsWith("* ")) {
      elements.push(
        <li key={key++} className="text-sm text-foreground ml-4 list-disc">
          {line.slice(2)}
        </li>
      );
    } else if (line.startsWith("|") && !line.includes("---")) {
      const cells = line.split("|").slice(1, -1).map((c) => c.trim());
      elements.push(
        <div key={key++} className="flex gap-2 text-xs text-foreground py-0.5">
          {cells.map((cell, i) => (
            <span key={i} className={i === 0 ? "font-medium w-32 shrink-0" : "flex-1"}>
              {cell}
            </span>
          ))}
        </div>
      );
    } else if (line.trim() === "") {
      elements.push(<div key={key++} className="h-2" />);
    } else {
      elements.push(
        <p key={key++} className="text-sm text-foreground">
          {line}
        </p>
      );
    }
  }

  return elements;
}

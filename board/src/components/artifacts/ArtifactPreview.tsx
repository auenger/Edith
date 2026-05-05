"use client";

import { useMemo } from "react";
import type { ArtifactContent } from "@/lib/api";

interface ArtifactPreviewProps {
  content: ArtifactContent;
  viewMode: "markdown" | "raw" | "tokens";
}

// ── Token Budget Constants ───────────────────────────────────────
const DEFAULT_TOKEN_BUDGET = 2000;

export function ArtifactPreview({ content, viewMode }: ArtifactPreviewProps) {
  if (viewMode === "raw") {
    return <RawView content={content.content} />;
  }

  if (viewMode === "tokens") {
    return <TokenCountView content={content.content} />;
  }

  return <MarkdownView content={content.content} />;
}

// ── Markdown View ────────────────────────────────────────────────

function MarkdownView({ content }: { content: string }) {
  const html = useMemo(() => renderMarkdown(content), [content]);

  return (
    <div className="p-6 prose prose-sm prose-gray max-w-none">
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}

// ── Raw View ─────────────────────────────────────────────────────

function RawView({ content }: { content: string }) {
  return (
    <div className="p-4">
      <pre className="text-xs font-mono text-gray-700 whitespace-pre-wrap break-words leading-relaxed bg-gray-50 rounded-lg p-4 border border-gray-200 overflow-x-auto">
        {content}
      </pre>
    </div>
  );
}

// ── Token Count View ─────────────────────────────────────────────

function TokenCountView({ content }: { content: string }) {
  const stats = useMemo(() => computeTokenStats(content), [content]);
  const budgetPercent = Math.min(
    (stats.estimatedTokens / DEFAULT_TOKEN_BUDGET) * 100,
    100,
  );
  const isOverBudget = stats.estimatedTokens > DEFAULT_TOKEN_BUDGET;

  return (
    <div className="p-6 space-y-6">
      {/* Summary Card */}
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
        <h4 className="text-sm font-semibold text-gray-900 mb-3">
          Token Estimation
        </h4>
        <div className="grid grid-cols-3 gap-4 text-center">
          <StatItem
            label="Estimated Tokens"
            value={stats.estimatedTokens.toLocaleString()}
            color={isOverBudget ? "text-amber-600" : "text-blue-600"}
          />
          <StatItem
            label="Token Budget"
            value={DEFAULT_TOKEN_BUDGET.toLocaleString()}
            color="text-gray-600"
          />
          <StatItem
            label="Characters"
            value={stats.chars.toLocaleString()}
            color="text-gray-600"
          />
        </div>
      </div>

      {/* Budget Progress Bar */}
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-gray-700">
            Budget Usage
          </span>
          <span
            className={`text-xs font-medium ${isOverBudget ? "text-amber-600" : "text-green-600"}`}
          >
            {budgetPercent.toFixed(1)}%
          </span>
        </div>
        <div className="h-2.5 w-full rounded-full bg-gray-100 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              isOverBudget ? "bg-amber-500" : "bg-green-500"
            }`}
            style={{ width: `${Math.min(budgetPercent, 100)}%` }}
          />
        </div>
        <div className="flex items-center justify-between mt-1.5 text-[10px] text-gray-400">
          <span>0</span>
          <span>{DEFAULT_TOKEN_BUDGET.toLocaleString()} tokens</span>
        </div>
      </div>

      {/* Detailed Stats */}
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <h4 className="text-sm font-semibold text-gray-900 mb-3">
          Content Breakdown
        </h4>
        <div className="space-y-2 text-sm">
          <DetailRow label="Lines" value={stats.lines.toLocaleString()} />
          <DetailRow label="Words" value={stats.words.toLocaleString()} />
          <DetailRow label="Characters" value={stats.chars.toLocaleString()} />
          <DetailRow label="Code Blocks" value={stats.codeBlocks.toString()} />
          <DetailRow label="Headings" value={stats.headings.toString()} />
          <DetailRow label="Links" value={stats.links.toString()} />
        </div>
      </div>
    </div>
  );
}

// ── Stat Item ────────────────────────────────────────────────────

function StatItem({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div>
      <p className={`text-lg font-bold ${color}`}>{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
    </div>
  );
}

// ── Detail Row ───────────────────────────────────────────────────

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-gray-600">{label}</span>
      <span className="font-mono text-gray-900">{value}</span>
    </div>
  );
}

// ── Markdown Renderer (lightweight, no external deps) ────────────

function renderMarkdown(md: string): string {
  let html = md;

  // Escape HTML
  html = html
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Code blocks (```...```)
  html = html.replace(
    /```(\w*)\n([\s\S]*?)```/g,
    (_match, lang, code) =>
      `<pre class="bg-gray-800 text-gray-100 rounded-lg p-4 my-3 overflow-x-auto"><code class="language-${lang || "text"}">${code.trim()}</code></pre>`,
  );

  // Inline code
  html = html.replace(
    /`([^`]+)`/g,
    '<code class="bg-gray-100 text-pink-600 rounded px-1.5 py-0.5 text-xs font-mono">$1</code>',
  );

  // Headings
  html = html.replace(/^#### (.+)$/gm, '<h4 class="text-base font-semibold mt-4 mb-2">$1</h4>');
  html = html.replace(/^### (.+)$/gm, '<h3 class="text-lg font-semibold mt-5 mb-2">$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2 class="text-xl font-bold mt-6 mb-3 pb-2 border-b border-gray-200">$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1 class="text-2xl font-bold mt-6 mb-4">$1</h1>');

  // Bold and italic
  html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*([^*]+)\*/g, "<em>$1</em>");

  // Links
  html = html.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" class="text-blue-600 hover:underline">$1</a>',
  );

  // Unordered lists
  html = html.replace(/^- (.+)$/gm, '<li class="ml-4 list-disc">$1</li>');

  // Ordered lists
  html = html.replace(/^\d+\. (.+)$/gm, '<li class="ml-4 list-decimal">$1</li>');

  // Horizontal rules
  html = html.replace(/^---$/gm, '<hr class="my-4 border-gray-200" />');

  // Paragraphs (wrap remaining lines)
  html = html.replace(/\n{2,}/g, "</p><p>");
  html = `<p>${html}</p>`;

  // Clean up empty paragraphs
  html = html.replace(/<p>\s*<\/p>/g, "");

  return html;
}

// ── Token Estimation ─────────────────────────────────────────────

// Token estimation helper


function computeTokenStats(content: string) {
  const chars = content.length;
  const lines = content.split("\n").length;
  const words = content
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0).length;

  // Rough token estimation: ~4 chars per token for English, ~2 chars per token for CJK
  const cjkChars = (content.match(/[一-鿿㐀-䶿]/g) || []).length;
  const nonCjkChars = chars - cjkChars;
  const estimatedTokens = Math.ceil(cjkChars / 2 + nonCjkChars / 4);

  // Count markdown features
  const codeBlocks = (content.match(/```[\s\S]*?```/g) || []).length;
  const headings = (content.match(/^#{1,6}\s/m) || []).length;
  const links = (content.match(/\[([^\]]+)\]\(([^)]+)\)/g) || []).length;

  return {
    chars,
    lines,
    words,
    estimatedTokens,
    codeBlocks,
    headings,
    links,
  };
}

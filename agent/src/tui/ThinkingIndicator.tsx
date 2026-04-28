import React, { useEffect, useState } from "react";
import { Box, Text } from "ink";
import type { ThinkingPhase } from "./useAgentSession.js";

const SPINNER_FRAMES = ["✶", "✵", "✺", "✹", "✸", "✷"];

interface ThinkingIndicatorProps {
  isActive: boolean;
  phase: ThinkingPhase | null;
  startedAt: number | null;
  outputChars: number;
}

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes}m ${secs}s`;
}

function formatTokenEstimate(chars: number): string {
  const tokens = Math.round(chars / 4);
  if (tokens < 1000) return `${tokens}`;
  return `${(tokens / 1000).toFixed(1)}k`;
}

function phaseLabel(phase: ThinkingPhase | null): string {
  switch (phase) {
    case "thinking": return "Thinking";
    case "tools": return "Running tools";
    case "generating": return "Generating";
    default: return "Processing";
  }
}

export function ThinkingIndicator({ isActive, phase, startedAt, outputChars }: ThinkingIndicatorProps) {
  const [frame, setFrame] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!isActive || !startedAt) return;

    const interval = setInterval(() => {
      setFrame((f) => (f + 1) % SPINNER_FRAMES.length);
      setElapsed(Date.now() - startedAt);
    }, 150);

    return () => clearInterval(interval);
  }, [isActive, startedAt]);

  if (!isActive) return null;

  const spinner = SPINNER_FRAMES[frame];
  const label = phaseLabel(phase);
  const duration = startedAt ? formatDuration(elapsed) : "";
  const tokenStr = outputChars > 0 ? `↓ ${formatTokenEstimate(outputChars)} tokens` : "";

  return (
    <Box gap={1}>
      <Text color="magenta">{spinner}</Text>
      <Text color="white">{label}…</Text>
      {duration && <Text color="gray">({duration}{tokenStr ? ` · ${tokenStr}` : ""})</Text>}
    </Box>
  );
}

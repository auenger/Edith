import React from "react";
import { Box, Text } from "ink";
import { formatTokenCount, type PressureLevel } from "../context-monitor.js";

interface StatusBarMetricsProps {
  tokens: number;
  contextWindow: number;
  percent: number;
  cacheHitRate: number;
  pressureLevel: PressureLevel;
  modelName?: string;
  isCustomProvider?: boolean;
}

function pressureColor(level: PressureLevel): string {
  switch (level) {
    case "emergency": return "red";
    case "critical": return "red";
    case "warning": return "yellow";
    default: return "green";
  }
}

function cacheColor(rate: number): string {
  if (rate > 0.5) return "green";
  if (rate > 0.2) return "cyan";
  return "gray";
}

export function StatusBarMetrics({
  tokens,
  contextWindow,
  percent,
  cacheHitRate,
  pressureLevel,
  modelName,
  isCustomProvider,
}: StatusBarMetricsProps) {
  const tokenStr = formatTokenCount(tokens);
  const windowStr = formatTokenCount(contextWindow);
  const pctStr = `${(percent * 100).toFixed(1)}%`;
  const cacheStr = `${(cacheHitRate * 100).toFixed(0)}%`;

  const color = pressureColor(pressureLevel);
  const modelColor = isCustomProvider ? "cyan" : "white";

  return (
    <Box gap={1}>
      {modelName && <Text color={modelColor}>Model: {modelName}</Text>}
      <Text color="gray">│</Text>
      <Text color={color}>CTX {tokenStr}/{windowStr} ({pctStr})</Text>
      <Text color={cacheColor(cacheHitRate)}>Cache: {cacheStr}</Text>
    </Box>
  );
}

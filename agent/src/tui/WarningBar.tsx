import React from "react";
import { Box, Text } from "ink";
import type { PressureState } from "../context-monitor.js";

interface WarningBarProps {
  pressure: PressureState;
}

function pressureColor(level: PressureState["level"]): string {
  switch (level) {
    case "emergency": return "red";
    case "critical": return "red";
    case "warning": return "yellow";
    default: return "green";
  }
}

export function WarningBar({ pressure }: WarningBarProps) {
  if (pressure.level === "normal" || !pressure.message) {
    return null;
  }

  const color = pressureColor(pressure.level);
  const bold = pressure.level === "emergency" || pressure.level === "critical";

  return (
    <Box borderStyle="single" borderColor={color} paddingX={1}>
      <Text color={color} bold={bold}>
        {pressure.message}
      </Text>
      {pressure.remainingRounds !== "N/A" && (
        <Text color="gray"> ({pressure.remainingRounds} 轮)</Text>
      )}
    </Box>
  );
}

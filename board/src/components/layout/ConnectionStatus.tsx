"use client";

import { useEffect, useState } from "react";
import { getBoardWebSocket, type WsStatus } from "@/lib/api";

// ── Connection Status Indicator ───────────────────────────────────

export function ConnectionStatus() {
  const [wsStatus, setWsStatus] = useState<WsStatus>("disconnected");

  useEffect(() => {
    const ws = getBoardWebSocket();
    ws.connect();
    const unsub = ws.onStatusChange((status) => setWsStatus(status));
    return unsub;
  }, []);

  const statusColor =
    wsStatus === "connected"
      ? "bg-green-500"
      : wsStatus === "connecting"
        ? "bg-yellow-500"
        : wsStatus === "error"
          ? "bg-red-500"
          : "bg-slate-400";

  const statusLabel =
    wsStatus === "connected"
      ? "Connected"
      : wsStatus === "connecting"
        ? "Connecting"
        : wsStatus === "error"
          ? "Error"
          : "Offline";

  return (
    <div
      className="flex items-center gap-1.5 text-xs text-muted-foreground"
      title={statusLabel}
    >
      <span
        className={`inline-block h-2 w-2 rounded-full shrink-0 ${statusColor} ${
          wsStatus === "connected" ? "status-dot-live" : ""
        }`}
      />
      <span className="hidden xl:inline">{statusLabel}</span>
    </div>
  );
}

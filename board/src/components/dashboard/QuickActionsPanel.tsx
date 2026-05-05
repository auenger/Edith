"use client";

interface QuickActionsPanelProps {
  servicesCount: number;
  onRefresh: () => void;
}

export function QuickActionsPanel({ servicesCount, onRefresh }: QuickActionsPanelProps) {
  const isEmpty = servicesCount === 0;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
          Quick Actions
        </h3>
      </div>

      <div className="space-y-2.5">
        <ActionButton
          label="Scan New Service"
          description="Discover and document a new service"
          icon={<ScanIcon />}
          primary={isEmpty}
          onClick={() => {
            // In a real implementation, this would trigger edith_scan via Agent API
            alert("This action requires EDITH Agent running. Run 'edith_scan' in your terminal.");
          }}
        />
        <ActionButton
          label="Refresh All Knowledge"
          description="Re-scan and re-distill all services"
          icon={<RefreshIcon />}
          onClick={onRefresh}
        />
        <ActionButton
          label="Export Report"
          description="Generate a summary report of all artifacts"
          icon={<ExportIcon />}
          onClick={() => {
            alert("Export functionality will be available in a future update.");
          }}
        />
        <ActionButton
          label="View Routing Table"
          description="Open the global service routing table"
          icon={<TableIcon />}
          onClick={() => {
            window.location.href = "/artifacts";
          }}
        />
      </div>
    </div>
  );
}

// ── Action Button ───────────────────────────────────────────────

function ActionButton({
  label,
  description,
  icon,
  primary = false,
  onClick,
}: {
  label: string;
  description: string;
  icon: React.ReactNode;
  primary?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 rounded-lg px-4 py-3 text-left transition-colors ${
        primary
          ? "bg-blue-600 text-white hover:bg-blue-700 border border-blue-600"
          : "bg-gray-50 text-gray-900 hover:bg-gray-100 border border-gray-200"
      }`}
    >
      <span className={`flex-shrink-0 ${primary ? "text-white" : "text-gray-500"}`}>
        {icon}
      </span>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${primary ? "text-white" : "text-gray-900"}`}>
          {label}
        </p>
        <p className={`text-xs mt-0.5 ${primary ? "text-blue-100" : "text-gray-500"}`}>
          {description}
        </p>
      </div>
    </button>
  );
}

// ── Icons ───────────────────────────────────────────────────────

function ScanIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  );
}

function ExportIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}

function TableIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  );
}

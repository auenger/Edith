"use client";

export function GraphLegend() {
  return (
    <div className="rounded-lg border border-gray-200 bg-white/90 backdrop-blur-sm p-3 space-y-3">
      {/* Confidence Legend */}
      <div>
        <h4 className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
          Confidence
        </h4>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <svg width="24" height="2" className="flex-shrink-0">
              <line
                x1="0"
                y1="1"
                x2="24"
                y2="1"
                stroke="#16a34a"
                strokeWidth="2"
              />
            </svg>
            <span className="text-[10px] text-gray-600">EXTRACTED</span>
            <span className="text-[10px] text-gray-400">Source-verified</span>
          </div>
          <div className="flex items-center gap-2">
            <svg width="24" height="2" className="flex-shrink-0">
              <line
                x1="0"
                y1="1"
                x2="24"
                y2="1"
                stroke="#d97706"
                strokeWidth="2"
              />
            </svg>
            <span className="text-[10px] text-gray-600">INFERRED</span>
            <span className="text-[10px] text-gray-400">Semantically derived</span>
          </div>
          <div className="flex items-center gap-2">
            <svg width="24" height="2" className="flex-shrink-0">
              <line
                x1="0"
                y1="1"
                x2="24"
                y2="1"
                stroke="#dc2626"
                strokeWidth="2"
                strokeDasharray="4,2"
              />
            </svg>
            <span className="text-[10px] text-gray-600">AMBIGUOUS</span>
            <span className="text-[10px] text-gray-400">Needs review</span>
          </div>
        </div>
      </div>

      {/* Node Legend */}
      <div>
        <h4 className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
          Nodes
        </h4>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <svg width="16" height="16" className="flex-shrink-0">
              <circle cx="8" cy="8" r="6" fill="#3b82f6" stroke="#fff" strokeWidth="1" />
            </svg>
            <span className="text-[10px] text-gray-600">Service</span>
          </div>
          <div className="flex items-center gap-2">
            <svg width="16" height="16" className="flex-shrink-0">
              <circle cx="8" cy="8" r="4" fill="#8b5cf6" stroke="#fff" strokeWidth="1" />
            </svg>
            <span className="text-[10px] text-gray-600">Concept</span>
          </div>
        </div>
        <p className="text-[10px] text-gray-400 mt-1.5">
          Size = Knowledge completeness
        </p>
      </div>

      {/* Interactions */}
      <div>
        <h4 className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
          Interactions
        </h4>
        <div className="space-y-1 text-[10px] text-gray-400">
          <p>Click node: Show details</p>
          <p>Double-click: Expand API list</p>
          <p>Drag: Reposition node</p>
          <p>Scroll: Zoom in/out</p>
        </div>
      </div>
    </div>
  );
}

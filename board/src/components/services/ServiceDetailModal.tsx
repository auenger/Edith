"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import type { ServiceDetail, LayerStatus } from "@/lib/api";
import { getServiceStatus } from "@/lib/service-status";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  FileTextIcon,
  LinkIcon,
  AlertTriangleIcon,
  CheckIcon,
  CircleIcon,
  LayersIcon,
  CodeIcon,
  ShieldIcon,
} from "lucide-react";

interface ServiceDetailSheetProps {
  serviceName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ServiceDetailSheet({
  serviceName,
  open,
  onOpenChange,
}: ServiceDetailSheetProps) {
  const [detail, setDetail] = useState<ServiceDetail | null>(null);
  const [layers, setLayers] = useState<LayerStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!open) return;
    setLoading(true);
    setError(null);

    const [detailRes, layersRes] = await Promise.all([
      api.service(serviceName),
      api.layers(serviceName),
    ]);

    if (detailRes.ok && detailRes.data) {
      setDetail(detailRes.data);
    } else {
      setError(detailRes.error?.message || "Failed to load service detail");
    }

    if (layersRes.ok && layersRes.data) {
      setLayers(layersRes.data);
    }

    setLoading(false);
  }, [serviceName, open]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Determine missing layers
  const missingLayers: string[] = [];
  if (layers) {
    if (!layers.layer0.exists) missingLayers.push("L0");
    if (!layers.layer1.exists) missingLayers.push("L1");
    if (!layers.layer2.exists) missingLayers.push("L2");
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-2xl overflow-y-auto"
        showCloseButton
      >
        <SheetHeader>
          <SheetTitle className="text-lg">{serviceName}</SheetTitle>
          {detail && (
            <SheetDescription className="text-sm">
              {detail.role}
            </SheetDescription>
          )}
        </SheetHeader>

        <div className="px-4 pb-6 space-y-6">
          {/* Loading */}
          {loading && (
            <div className="space-y-4">
              <Skeleton className="h-20 w-full rounded-lg" />
              <Skeleton className="h-32 w-full rounded-lg" />
              <Skeleton className="h-24 w-full rounded-lg" />
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bento-card border-danger/30 bg-danger-light/30">
              <p className="text-sm text-danger">{error}</p>
              <button
                onClick={fetchData}
                className="mt-2 text-sm text-danger underline hover:no-underline"
              >
                Retry
              </button>
            </div>
          )}

          {/* Detail Content */}
          {detail && !loading && (
            <>
              {/* Meta Section */}
              <MetaSection detail={detail} />

              {/* Layer Status */}
              {layers && (
                <LayerSection
                  layers={layers}
                  missingLayers={missingLayers}
                  detail={detail}
                />
              )}

              {/* API Endpoints */}
              {detail.quickRef?.apiEndpoints &&
                detail.quickRef.apiEndpoints.length > 0 && (
                  <SectionCard
                    icon={<CodeIcon className="size-4" />}
                    title={`API Endpoints (${detail.quickRef.apiEndpoints.length})`}
                  >
                    <div className="space-y-1.5">
                      {detail.quickRef.apiEndpoints.map((ep, i) => (
                        <code
                          key={i}
                          className="block rounded bg-muted px-2.5 py-1.5 text-xs font-mono"
                        >
                          {ep}
                        </code>
                      ))}
                    </div>
                  </SectionCard>
                )}

              {/* Constraints */}
              {detail.quickRef?.constraints &&
                detail.quickRef.constraints.length > 0 && (
                  <SectionCard
                    icon={<ShieldIcon className="size-4" />}
                    title={`Key Constraints (${detail.quickRef.constraints.length})`}
                  >
                    <ul className="space-y-1.5">
                      {detail.quickRef.constraints.map((c, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-2 text-sm text-muted-foreground"
                        >
                          <span className="text-info mt-0.5 flex-shrink-0">
                            &bull;
                          </span>
                          {c}
                        </li>
                      ))}
                    </ul>
                  </SectionCard>
                )}

              {/* Pitfalls */}
              {detail.quickRef?.pitfalls &&
                detail.quickRef.pitfalls.length > 0 && (
                  <SectionCard
                    icon={<AlertTriangleIcon className="size-4" />}
                    title={`Common Pitfalls (${detail.quickRef.pitfalls.length})`}
                  >
                    <ul className="space-y-1.5">
                      {detail.quickRef.pitfalls.map((p, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-2 text-sm text-muted-foreground"
                        >
                          <span className="text-warning mt-0.5 flex-shrink-0">
                            &bull;
                          </span>
                          {p}
                        </li>
                      ))}
                    </ul>
                  </SectionCard>
                )}

              {/* Distillates */}
              {detail.distillates && detail.distillates.length > 0 && (
                <DistillatesSection distillates={detail.distillates} />
              )}
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

// -- Sub-components --

function MetaSection({ detail }: { detail: ServiceDetail }) {
  const status = getServiceStatus(detail);

  return (
    <SectionCard icon={<LayersIcon className="size-4" />} title="Overview">
      <div className="grid grid-cols-2 gap-3 text-sm">
        {detail.stack && (
          <div>
            <span className="text-muted-foreground">Stack:</span>{" "}
            <span className="font-medium">{detail.stack}</span>
          </div>
        )}
        {detail.owner && (
          <div>
            <span className="text-muted-foreground">Owner:</span>{" "}
            <span className="font-medium">{detail.owner}</span>
          </div>
        )}
        <div>
          <span className="text-muted-foreground">Status:</span>{" "}
          <Badge
            variant="outline"
            className={`text-[10px] ${
              status.status === "complete"
                ? "border-success/30 text-success"
                : status.status === "partial"
                  ? "border-warning/30 text-warning"
                  : "border-border text-muted-foreground"
            }`}
          >
            {status.label}
          </Badge>
        </div>
        {detail.quickRef?.verify && detail.quickRef.verify.length > 0 && (
          <div className="col-span-2">
            <span className="text-muted-foreground">Verify:</span>{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">
              {detail.quickRef.verify[0]}
            </code>
          </div>
        )}
      </div>
    </SectionCard>
  );
}

function LayerSection({
  layers,
  missingLayers,
  detail,
}: {
  layers: LayerStatus;
  missingLayers: string[];
  detail: ServiceDetail;
}) {
  return (
    <SectionCard
      icon={<LayersIcon className="size-4" />}
      title="Knowledge Layers"
      extra={
        missingLayers.length > 0 && (
          <Badge variant="outline" className="text-[10px] border-warning/30 text-warning">
            Missing: {missingLayers.join(", ")}
          </Badge>
        )
      }
    >
      <div className="space-y-2">
        <LayerRow
          label="L0 - Routing Table"
          exists={layers.layer0.exists}
          path={layers.layer0.path}
        />
        <LayerRow
          label="L1 - Quick Ref"
          exists={layers.layer1.exists}
          path={layers.layer1.path}
          detail={
            layers.layer1.exists
              ? `${layers.layer1.sections.length} sections`
              : undefined
          }
        />
        <LayerRow
          label="L2 - Distillates"
          exists={layers.layer2.exists}
          path={layers.layer2.path}
          detail={
            layers.layer2.exists
              ? `${layers.layer2.fragmentCount} fragments, ${layers.layer2.totalTokens.toLocaleString()} tokens`
              : undefined
          }
        />
      </div>
    </SectionCard>
  );
}

function LayerRow({
  label,
  exists,
  path,
  detail,
}: {
  label: string;
  exists: boolean;
  path: string;
  detail?: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-md px-3 py-2 hover:bg-muted/50 transition-colors">
      <div className="flex items-center gap-3">
        <span
          className={`inline-block h-2 w-2 rounded-full ${exists ? "bg-success" : "bg-muted-foreground"}`}
        />
        <div>
          <p className="text-sm font-medium">{label}</p>
          <p className="text-xs text-muted-foreground font-mono">{path}</p>
          {detail && (
            <p className="text-xs text-muted-foreground mt-0.5">{detail}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function DistillatesSection({
  distillates,
}: {
  distillates: Array<{
    file: string;
    topic: string;
    summary: string;
    estimatedTokens: number;
  }>;
}) {
  const totalTokens = distillates.reduce(
    (sum, d) => sum + d.estimatedTokens,
    0
  );

  return (
    <SectionCard
      icon={<FileTextIcon className="size-4" />}
      title={`Distillate Fragments (${distillates.length})`}
      extra={
        <span className="text-xs text-muted-foreground">
          {totalTokens.toLocaleString()} tokens
        </span>
      }
    >
      <div className="divide-y divide-border rounded-lg border border-border">
        {distillates.map((d, i) => (
          <div key={i} className="px-3 py-2.5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">{d.topic}</p>
              <span className="text-xs text-muted-foreground">
                {d.estimatedTokens.toLocaleString()} tokens
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
              {d.summary}
            </p>
            <p className="text-xs text-muted-foreground font-mono mt-1">
              {d.file}
            </p>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

// -- Generic Section Card --

function SectionCard({
  icon,
  title,
  extra,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  extra?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">{icon}</span>
          <h3 className="text-sm font-semibold">{title}</h3>
        </div>
        {extra}
      </div>
      <div className="bento-card">{children}</div>
    </div>
  );
}

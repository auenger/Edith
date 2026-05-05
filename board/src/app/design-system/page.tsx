"use client";

/**
 * EDITH Board — Design System Preview Page
 *
 * Development-only page to verify all design tokens and shadcn/ui components.
 * This page is NOT for production use.
 */

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function DesignSystemPage() {
  return (
    <div className="space-y-8 p-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Design System Preview</h1>
        <p className="text-muted-foreground mt-1">
          EDITH Board design tokens and shadcn/ui components. Dev-only.
        </p>
      </div>

      <Separator />

      {/* ── Brand Colors ──────────────────────────────────────────── */}
      <Section title="Brand Colors" description="EDITH brand gradient: #1e40af to #7c3aed">
        <div className="flex flex-wrap gap-3">
          {[
            { name: "brand-50", var: "--brand-50" },
            { name: "brand-100", var: "--brand-100" },
            { name: "brand-200", var: "--brand-200" },
            { name: "brand-300", var: "--brand-300" },
            { name: "brand-400", var: "--brand-400" },
            { name: "brand-500", var: "--brand-500" },
            { name: "brand-600", var: "--brand-600" },
            { name: "brand-700", var: "--brand-700" },
            { name: "brand-800", var: "--brand-800" },
            { name: "brand-900", var: "--brand-900" },
            { name: "brand-950", var: "--brand-950" },
          ].map((swatch) => (
            <div key={swatch.name} className="flex flex-col items-center gap-1">
              <div
                className="w-16 h-16 rounded-lg border border-border shadow-sm"
                style={{ backgroundColor: `var(${swatch.var})` }}
              />
              <span className="text-xs text-muted-foreground">{swatch.name}</span>
            </div>
          ))}
        </div>
        <div className="mt-4">
          <div
            className="h-12 rounded-lg"
            style={{
              background: "linear-gradient(135deg, var(--brand-start) 0%, var(--brand-end) 100%)",
            }}
          />
          <p className="text-xs text-muted-foreground mt-1">Brand Gradient (sidebar)</p>
        </div>
      </Section>

      {/* ── Semantic Colors ───────────────────────────────────────── */}
      <Section title="Semantic Colors" description="Success, warning, danger, info">
        <div className="flex flex-wrap gap-3">
          {[
            { name: "success", color: "var(--semantic-success)" },
            { name: "success-light", color: "var(--semantic-success-light)" },
            { name: "warning", color: "var(--semantic-warning)" },
            { name: "warning-light", color: "var(--semantic-warning-light)" },
            { name: "danger", color: "var(--semantic-danger)" },
            { name: "danger-light", color: "var(--semantic-danger-light)" },
            { name: "info", color: "var(--semantic-info)" },
            { name: "info-light", color: "var(--semantic-info-light)" },
          ].map((swatch) => (
            <div key={swatch.name} className="flex flex-col items-center gap-1">
              <div
                className="w-16 h-16 rounded-lg border border-border shadow-sm"
                style={{ backgroundColor: swatch.color }}
              />
              <span className="text-xs text-muted-foreground">{swatch.name}</span>
            </div>
          ))}
        </div>
      </Section>

      {/* ── Bento Grid ────────────────────────────────────────────── */}
      <Section title="Bento Grid Layout" description="Responsive auto-fill grid with card tokens">
        <div className="bento-grid">
          <div className="bento-card bento-card-hover">
            <h4 className="text-sm font-semibold text-foreground">Card 1</h4>
            <p className="text-xs text-muted-foreground mt-1">Default width bento card</p>
          </div>
          <div className="bento-card bento-card-hover">
            <h4 className="text-sm font-semibold text-foreground">Card 2</h4>
            <p className="text-xs text-muted-foreground mt-1">Hover to see elevation</p>
          </div>
          <div className="bento-card bento-card-hover bento-span-2">
            <h4 className="text-sm font-semibold text-foreground">Card 3 (span-2)</h4>
            <p className="text-xs text-muted-foreground mt-1">This card spans 2 columns</p>
          </div>
          <div className="bento-card bento-card-hover">
            <h4 className="text-sm font-semibold text-foreground">Card 4</h4>
            <p className="text-xs text-muted-foreground mt-1">Another default card</p>
          </div>
        </div>
      </Section>

      {/* ── Spacing Tokens ────────────────────────────────────────── */}
      <Section title="Spacing Tokens" description="4px base unit">
        <div className="space-y-2">
          {[
            { name: "space-1", value: "var(--space-1)" },
            { name: "space-2", value: "var(--space-2)" },
            { name: "space-3", value: "var(--space-3)" },
            { name: "space-4", value: "var(--space-4)" },
            { name: "space-6", value: "var(--space-6)" },
            { name: "space-8", value: "var(--space-8)" },
            { name: "space-12", value: "var(--space-12)" },
          ].map((s) => (
            <div key={s.name} className="flex items-center gap-3">
              <span className="w-20 text-xs text-muted-foreground text-right">{s.name}</span>
              <div
                className="h-4 rounded bg-brand-500"
                style={{ width: s.value }}
              />
              <span className="text-xs text-muted-foreground">{s.value}</span>
            </div>
          ))}
        </div>
      </Section>

      {/* ── Shadow Tokens ─────────────────────────────────────────── */}
      <Section title="Shadow Tokens" description="Layered shadows for Bento Card depth">
        <div className="flex flex-wrap gap-6">
          {[
            { name: "shadow-sm", var: "--shadow-sm" },
            { name: "shadow-md", var: "--shadow-md" },
            { name: "shadow-lg", var: "--shadow-lg" },
          ].map((s) => (
            <div
              key={s.name}
              className="w-32 h-24 rounded-lg bg-card border border-border flex items-center justify-center"
              style={{ boxShadow: `var(${s.var})` }}
            >
              <span className="text-xs text-muted-foreground">{s.name}</span>
            </div>
          ))}
        </div>
      </Section>

      {/* ── shadcn/ui Components ──────────────────────────────────── */}
      <Section title="shadcn/ui Components" description="Installed components preview">
        <div className="space-y-6">
          {/* Buttons */}
          <div>
            <h4 className="text-sm font-semibold mb-3">Button Variants</h4>
            <div className="flex flex-wrap gap-3">
              <Button variant="default">Default</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="destructive">Destructive</Button>
              <Button variant="link">Link</Button>
            </div>
          </div>

          {/* Button Sizes */}
          <div>
            <h4 className="text-sm font-semibold mb-3">Button Sizes</h4>
            <div className="flex flex-wrap items-center gap-3">
              <Button size="xs">Extra Small</Button>
              <Button size="sm">Small</Button>
              <Button size="default">Default</Button>
              <Button size="lg">Large</Button>
            </div>
          </div>

          {/* Badges */}
          <div>
            <h4 className="text-sm font-semibold mb-3">Badge Variants</h4>
            <div className="flex flex-wrap gap-3">
              <Badge>Default</Badge>
              <Badge variant="secondary">Secondary</Badge>
              <Badge variant="outline">Outline</Badge>
              <Badge variant="destructive">Destructive</Badge>
            </div>
          </div>

          {/* Input */}
          <div>
            <h4 className="text-sm font-semibold mb-3">Input</h4>
            <div className="max-w-sm space-y-3">
              <Input placeholder="Type something..." />
              <Input placeholder="Disabled" disabled />
            </div>
          </div>

          {/* Select */}
          <div>
            <h4 className="text-sm font-semibold mb-3">Select</h4>
            <div className="max-w-sm">
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select an option" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="option-1">Option 1</SelectItem>
                  <SelectItem value="option-2">Option 2</SelectItem>
                  <SelectItem value="option-3">Option 3</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Card */}
          <div>
            <h4 className="text-sm font-semibold mb-3">Card (shadcn/ui)</h4>
            <div className="max-w-sm">
              <Card>
                <CardHeader>
                  <CardTitle>Card Title</CardTitle>
                  <CardDescription>Card description text</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Card content area with some example text.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Skeleton */}
          <div>
            <h4 className="text-sm font-semibold mb-3">Skeleton</h4>
            <div className="max-w-sm space-y-3">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>

          {/* Separator */}
          <div>
            <h4 className="text-sm font-semibold mb-3">Separator</h4>
            <div className="max-w-sm">
              <div className="space-y-2">
                <p className="text-sm">Above separator</p>
                <Separator />
                <p className="text-sm">Below separator</p>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* ── Radius Tokens ─────────────────────────────────────────── */}
      <Section title="Radius Tokens" description="Border radius scale">
        <div className="flex flex-wrap gap-4">
          {[
            { name: "sm (4px)", var: "--radius-sm" },
            { name: "md (8px)", var: "--radius-md" },
            { name: "lg (12px)", var: "--radius-lg" },
            { name: "xl (16px)", var: "--radius-xl" },
            { name: "2xl (20px)", var: "--radius-2xl" },
          ].map((r) => (
            <div key={r.name} className="flex flex-col items-center gap-2">
              <div
                className="w-16 h-16 bg-brand-500"
                style={{ borderRadius: `var(${r.var})` }}
              />
              <span className="text-xs text-muted-foreground">{r.name}</span>
            </div>
          ))}
        </div>
      </Section>

      {/* ── Typography ────────────────────────────────────────────── */}
      <Section title="Typography" description="Font stacks">
        <div className="space-y-2">
          <p style={{ fontFamily: "var(--font-heading)" }} className="text-lg font-bold">
            Heading: system sans-serif (bold)
          </p>
          <p style={{ fontFamily: "var(--font-body)" }} className="text-base">
            Body: system sans-serif (regular) — The quick brown fox jumps over the lazy dog.
          </p>
          <p style={{ fontFamily: "var(--font-mono)" }} className="text-sm">
            Mono: monospace — edith_scan --depth 3 --output knowledge-base/
          </p>
        </div>
      </Section>
    </div>
  );
}

/* ── Helper Component ──────────────────────────────────────────────── */

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bento-card">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {children}
    </section>
  );
}

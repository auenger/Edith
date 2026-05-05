/**
 * EDITH Health Scorer — Four-dimensional knowledge health assessment
 *
 * Evaluates knowledge base health across four dimensions:
 *   1. Freshness — based on time since last distillation
 *   2. Confidence — based on Graphify confidence levels (EXTRACTED/INFERRED/AMBIGUOUS)
 *   3. Completeness — based on three-layer coverage
 *   4. Human Reviewed — based on lifecycle status
 *
 * Produces a composite 0-100 score with breakdown.
 */

import {
  readFileSync,
  existsSync,
  readdirSync,
} from "node:fs";
import { join } from "node:path";

import { parseFrontmatter, type FrontmatterData } from "./frontmatter.js";
import {
  scanVaultLifecycles,
  computeDistribution,
  type LifecycleDistribution,
  type ArtifactLifecycleInfo,
} from "./lifecycle.js";

// ── Type Definitions ──────────────────────────────────────────────

export interface HealthBreakdown {
  /** Freshness score (0-100): how recent are the artifacts */
  freshness: number;
  /** Confidence score (0-100): how reliable is the extracted knowledge */
  confidence: number;
  /** Completeness score (0-100): how well do the three layers cover the knowledge */
  completeness: number;
  /** Human review score (0-100): how much has been reviewed by humans */
  humanReviewed: number;
}

export interface KnowledgeHealth {
  /** Overall composite score (0-100) */
  overall: number;
  /** Per-dimension breakdown */
  breakdown: HealthBreakdown;
  /** Lifecycle distribution */
  lifecycle: LifecycleDistribution;
  /** Total artifacts assessed */
  total_artifacts: number;
  /** Timestamp of assessment */
  assessed_at: string;
}

export interface ServiceHealth {
  /** Service name */
  service: string;
  /** Artifact count */
  artifacts: number;
  /** Health score */
  health: number;
  /** Average freshness */
  avg_freshness: number;
  /** Average confidence */
  avg_confidence: number;
  /** Review completion rate */
  review_rate: number;
}

// ── Scoring Constants ─────────────────────────────────────────────

/** Confidence level scores */
const CONFIDENCE_SCORES: Record<string, number> = {
  EXTRACTED: 100,
  INFERRED: 70,
  AMBIGUOUS: 40,
};

/** Lifecycle status review scores */
const REVIEW_SCORES: Record<string, number> = {
  scaffold: 30,
  reviewed: 70,
  mature: 100,
  stale: 20,
};

/** Dimension weights for overall score */
const DIMENSION_WEIGHTS = {
  freshness: 0.25,
  confidence: 0.25,
  completeness: 0.25,
  humanReviewed: 0.25,
};

// ── Freshness Scoring ─────────────────────────────────────────────

/**
 * Score freshness based on time since last distillation.
 * Full score if distilled within 24h, degrades over 7 days to 0.
 */
export function scoreFreshness(lastDistilled: string | null): number {
  if (!lastDistilled) return 0;

  try {
    const distilledAt = new Date(lastDistilled).getTime();
    const now = Date.now();
    const hoursSince = (now - distilledAt) / (1000 * 60 * 60);

    if (hoursSince <= 24) return 100;
    if (hoursSince >= 168) return 0; // 7 days

    // Linear degradation from 100 to 0 over 24h-168h
    return Math.round(100 * (1 - (hoursSince - 24) / (168 - 24)));
  } catch {
    return 0;
  }
}

/**
 * Batch score freshness for all artifacts in a vault.
 */
export function batchScoreFreshness(vaultRoot: string): number {
  const scores: number[] = [];

  function walk(dir: string): void {
    let entries;
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      if (entry.name === ".obsidian" || entry.name === ".edith") continue;

      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
        continue;
      }

      if (!entry.name.endsWith(".md")) continue;

      try {
        const content = readFileSync(fullPath, "utf-8");
        const parsed = parseFrontmatter(content);
        if (parsed.data.edith_id) {
          scores.push(scoreFreshness(parsed.data.last_distilled ?? null));
        }
      } catch {
        // Skip
      }
    }
  }

  walk(vaultRoot);
  return scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
}

// ── Confidence Scoring ────────────────────────────────────────────

/**
 * Score confidence based on GraphifyConfidence level.
 */
export function scoreConfidence(confidence: string | undefined): number {
  if (!confidence) return 50; // Unknown confidence
  return CONFIDENCE_SCORES[confidence] ?? 50;
}

/**
 * Batch score confidence for all artifacts in a vault.
 */
export function batchScoreConfidence(vaultRoot: string): number {
  const scores: number[] = [];

  function walk(dir: string): void {
    let entries;
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      if (entry.name === ".obsidian" || entry.name === ".edith") continue;

      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
        continue;
      }

      if (!entry.name.endsWith(".md")) continue;

      try {
        const content = readFileSync(fullPath, "utf-8");
        const parsed = parseFrontmatter(content);
        if (parsed.data.edith_id) {
          scores.push(scoreConfidence(parsed.data.confidence));
        }
      } catch {
        // Skip
      }
    }
  }

  walk(vaultRoot);
  return scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
}

// ── Completeness Scoring ──────────────────────────────────────────

/**
 * Score completeness based on three-layer coverage.
 * Checks if each service has routing-table, quick-ref, and distillates.
 */
export function scoreCompleteness(vaultRoot: string): number {
  if (!existsSync(vaultRoot)) return 0;

  const services = new Set<string>();
  const layerCoverage = new Map<string, Set<number>>();

  // Discover services and their layer coverage
  const servicesDir = join(vaultRoot, "01-services");
  if (existsSync(servicesDir)) {
    try {
      const entries = readdirSync(servicesDir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory() && existsSync(join(servicesDir, entry.name, "quick-ref.md"))) {
          services.add(entry.name);
          if (!layerCoverage.has(entry.name)) {
            layerCoverage.set(entry.name, new Set());
          }
          layerCoverage.get(entry.name)!.add(1); // quick-ref exists
        }
      }
    } catch {
      // Skip
    }
  }

  // Check routing-table (Layer 0)
  const routingPath = join(vaultRoot, "00-routing", "routing-table.md");
  const hasRouting = existsSync(routingPath);

  // Check distillates (Layer 2) per service
  const distillatesDir = join(vaultRoot, "02-distillates");
  if (existsSync(distillatesDir)) {
    try {
      const entries = readdirSync(distillatesDir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory() && services.has(entry.name)) {
          const serviceDistillates = readdirSync(join(distillatesDir, entry.name))
            .filter((f: string) => f.endsWith(".md"));
          if (serviceDistillates.length > 0) {
            layerCoverage.get(entry.name)?.add(2);
          }
        }
      }
    } catch {
      // Skip
    }
  }

  if (services.size === 0) return 0;

  // Score: routing-table contributes 20%, each service's coverage contributes 80%
  const routingScore = hasRouting ? 20 : 0;

  let serviceScore = 0;
  for (const service of services) {
    const coverage = layerCoverage.get(service);
    const layers = coverage?.size ?? 0;
    // Full coverage = 3 layers (0, 1, 2), but routing is global
    // Service-level: has Layer 1 = 50%, has Layer 2 = 100%
    if (layers >= 2) serviceScore += 100;
    else if (layers >= 1) serviceScore += 50;
  }
  serviceScore = Math.round(serviceScore / services.size * 0.8);

  return routingScore + serviceScore;
}

// ── Human Review Scoring ──────────────────────────────────────────

/**
 * Score human review status based on lifecycle distribution.
 */
export function scoreHumanReviewed(
  artifacts: ArtifactLifecycleInfo[],
): number {
  if (artifacts.length === 0) return 0;

  const scores = artifacts.map((a) => REVIEW_SCORES[a.status] ?? 30);
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
}

// ── Composite Health Score ────────────────────────────────────────

/**
 * Compute comprehensive knowledge health for the entire vault.
 */
export function computeKnowledgeHealth(vaultRoot: string): KnowledgeHealth {
  const artifacts = scanVaultLifecycles(vaultRoot);
  const distribution = computeDistribution(artifacts);

  const breakdown: HealthBreakdown = {
    freshness: batchScoreFreshness(vaultRoot),
    confidence: batchScoreConfidence(vaultRoot),
    completeness: scoreCompleteness(vaultRoot),
    humanReviewed: scoreHumanReviewed(artifacts),
  };

  const overall = Math.round(
    breakdown.freshness * DIMENSION_WEIGHTS.freshness +
    breakdown.confidence * DIMENSION_WEIGHTS.confidence +
    breakdown.completeness * DIMENSION_WEIGHTS.completeness +
    breakdown.humanReviewed * DIMENSION_WEIGHTS.humanReviewed,
  );

  return {
    overall,
    breakdown,
    lifecycle: distribution,
    total_artifacts: artifacts.length,
    assessed_at: new Date().toISOString(),
  };
}

// ── Per-Service Health ─────────────────────────────────────────────

/**
 * Compute health score per service.
 */
export function computeServiceHealth(vaultRoot: string): ServiceHealth[] {
  const artifacts = scanVaultLifecycles(vaultRoot);

  // Group by service (extract from edith_id)
  const serviceGroups = new Map<string, ArtifactLifecycleInfo[]>();
  for (const artifact of artifacts) {
    const parts = artifact.edith_id.split("/");
    const service = parts.length > 1 ? parts[0] : "global";
    if (!serviceGroups.has(service)) {
      serviceGroups.set(service, []);
    }
    serviceGroups.get(service)!.push(artifact);
  }

  const results: ServiceHealth[] = [];

  for (const [service, serviceArtifacts] of serviceGroups) {
    const reviewScores = serviceArtifacts.map((a) => REVIEW_SCORES[a.status] ?? 30);
    const reviewRate = reviewScores.reduce((a, b) => a + b, 0) / reviewScores.length;

    // Read freshness and confidence for this service's artifacts
    let freshnessSum = 0;
    let confidenceSum = 0;
    let count = 0;

    for (const artifact of serviceArtifacts) {
      const fullPath = join(vaultRoot, artifact.path);
      if (existsSync(fullPath)) {
        try {
          const content = readFileSync(fullPath, "utf-8");
          const parsed = parseFrontmatter(content);
          freshnessSum += scoreFreshness(parsed.data.last_distilled ?? null);
          confidenceSum += scoreConfidence(parsed.data.confidence);
          count++;
        } catch {
          // Skip
        }
      }
    }

    const avgFreshness = count > 0 ? Math.round(freshnessSum / count) : 0;
    const avgConfidence = count > 0 ? Math.round(confidenceSum / count) : 0;
    const health = Math.round((avgFreshness + avgConfidence + reviewRate) / 3);

    results.push({
      service,
      artifacts: serviceArtifacts.length,
      health,
      avg_freshness: avgFreshness,
      avg_confidence: avgConfidence,
      review_rate: Math.round(reviewRate),
    });
  }

  return results.sort((a, b) => b.health - a.health);
}

// ── Formatting ────────────────────────────────────────────────────

export function formatHealthScore(health: KnowledgeHealth): string {
  const lines = [
    "知识健康度评分",
    "",
    `  综合评分: ${health.overall}/100`,
    "",
    "  四维评分:",
    `    freshness:     ${health.breakdown.freshness}/100  (新鲜度)`,
    `    confidence:    ${health.breakdown.confidence}/100  (置信度)`,
    `    completeness:  ${health.breakdown.completeness}/100  (完整性)`,
    `    humanReviewed: ${health.breakdown.humanReviewed}/100  (人工审阅)`,
    "",
    `  生命周期分布 (${health.total_artifacts} 个片段):`,
    `    scaffold: ${health.lifecycle.scaffold}`,
    `    reviewed: ${health.lifecycle.reviewed}`,
    `    mature:   ${health.lifecycle.mature}`,
    `    stale:    ${health.lifecycle.stale}`,
    "",
    `  评估时间: ${health.assessed_at}`,
  ];

  return lines.join("\n");
}

export function formatServiceHealth(services: ServiceHealth[]): string {
  const lines = ["服务级健康度:", ""];

  for (const svc of services) {
    lines.push(
      `  ${svc.service}: ${svc.health}/100 ` +
      `(F:${svc.avg_freshness} C:${svc.avg_confidence} R:${svc.review_rate}) ` +
      `[${svc.artifacts} 片段]`,
    );
  }

  return lines.join("\n");
}

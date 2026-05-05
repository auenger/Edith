/**
 * EDITH Frontmatter — YAML frontmatter generation and parsing for Obsidian Vault
 *
 * Injects structured metadata into distillate Markdown files for:
 * - Artifact identification (edith_id, layer)
 * - Token budget tracking
 * - Human edit detection (human_edited flag)
 * - Provenance (edith_version, last_distilled)
 * - Cross-references (related wikilinks)
 */

import {
  readFileSync,
  writeFileSync,
  existsSync,
  readdirSync,
} from "node:fs";
import { join, basename } from "node:path";

// ── Type Definitions ──────────────────────────────────────────────

export interface FrontmatterData {
  /** Unique EDITH identifier (e.g., "user-service/01-api-contracts") */
  edith_id: string;
  /** Knowledge layer (0 = routing, 1 = quick-ref, 2 = distillate) */
  layer: number;
  /** Token budget for this artifact */
  token_budget?: number;
  /** Actual token count of the content */
  token_actual?: number;
  /** ISO timestamp of last distillation */
  last_distilled?: string;
  /** EDITH version that generated this artifact */
  edith_version?: string;
  /** Whether a human has edited this file since last distillation */
  human_edited: boolean;
  /** Confidence level of extracted knowledge */
  confidence?: "EXTRACTED" | "INFERRED" | "AMBIGUOUS";
  /** Related artifact wikilinks */
  related?: string[];
}

export interface ParsedFrontmatter {
  data: FrontmatterData;
  body: string;
}

// ── Constants ──────────────────────────────────────────────────────

const EDITH_VERSION = "0.1.0";

const FRONTMATTER_DELIMITER = "---";

// ── Generation ─────────────────────────────────────────────────────

/**
 * Generate YAML frontmatter string from FrontmatterData.
 * Produces clean, human-readable YAML.
 */
export function generateFrontmatter(data: FrontmatterData): string {
  const lines: string[] = [FRONTMATTER_DELIMITER];

  lines.push(`edith_id: "${data.edith_id}"`);
  lines.push(`layer: ${data.layer}`);

  if (data.token_budget !== undefined) {
    lines.push(`token_budget: ${data.token_budget}`);
  }

  if (data.token_actual !== undefined) {
    lines.push(`token_actual: ${data.token_actual}`);
  }

  if (data.last_distilled) {
    lines.push(`last_distilled: "${data.last_distilled}"`);
  }

  if (data.edith_version) {
    lines.push(`edith_version: "${data.edith_version}"`);
  }

  lines.push(`human_edited: ${data.human_edited}`);

  if (data.confidence) {
    lines.push(`confidence: ${data.confidence}`);
  }

  if (data.related && data.related.length > 0) {
    lines.push("related:");
    for (const ref of data.related) {
      lines.push(`  - "${ref}"`);
    }
  }

  lines.push(FRONTMATTER_DELIMITER);

  return lines.join("\n");
}

/**
 * Create a FrontmatterData object with sensible defaults.
 */
export function createFrontmatter(params: {
  edith_id: string;
  layer: number;
  token_budget?: number;
  token_actual?: number;
  confidence?: "EXTRACTED" | "INFERRED" | "AMBIGUOUS";
  related?: string[];
}): FrontmatterData {
  return {
    edith_id: params.edith_id,
    layer: params.layer,
    token_budget: params.token_budget,
    token_actual: params.token_actual,
    last_distilled: new Date().toISOString(),
    edith_version: EDITH_VERSION,
    human_edited: false,
    confidence: params.confidence ?? "EXTRACTED",
    related: params.related ?? [],
  };
}

// ── Parsing ────────────────────────────────────────────────────────

/**
 * Parse YAML frontmatter from a Markdown string.
 * Returns the parsed data and the body content (everything after the frontmatter).
 *
 * Returns null for the data if no valid frontmatter is found.
 */
export function parseFrontmatter(content: string): ParsedFrontmatter {
  const trimmed = content.trimStart();

  // Check if content starts with frontmatter delimiter
  if (!trimmed.startsWith(FRONTMATTER_DELIMITER)) {
    return {
      data: {
        edith_id: "",
        layer: 0,
        human_edited: false,
      },
      body: content,
    };
  }

  // Find the closing delimiter
  const afterFirstDelimiter = trimmed.slice(FRONTMATTER_DELIMITER.length);
  // Skip leading newline
  const contentAfterDelimiter = afterFirstDelimiter.startsWith("\n")
    ? afterFirstDelimiter.slice(1)
    : afterFirstDelimiter;

  const closingIndex = contentAfterDelimiter.indexOf(
    "\n" + FRONTMATTER_DELIMITER + "\n",
  );
  if (closingIndex === -1) {
    // Try end-of-file closing
    const eofClosing = contentAfterDelimiter.indexOf(
      "\n" + FRONTMATTER_DELIMITER,
    );
    if (eofClosing === -1) {
      return {
        data: {
          edith_id: "",
          layer: 0,
          human_edited: false,
        },
        body: content,
      };
    }

    const yamlStr = contentAfterDelimiter.slice(0, eofClosing);
    const bodyStart = eofClosing + FRONTMATTER_DELIMITER.length + 1;

    return {
      data: parseYamlFrontmatter(yamlStr),
      body: contentAfterDelimiter.slice(bodyStart).trimStart(),
    };
  }

  const yamlStr = contentAfterDelimiter.slice(0, closingIndex);
  const bodyStart = closingIndex + FRONTMATTER_DELIMITER.length + 1;

  return {
    data: parseYamlFrontmatter(yamlStr),
    body: contentAfterDelimiter.slice(bodyStart).trimStart(),
  };
}

/**
 * Simple YAML frontmatter parser (no external dependency).
 * Handles basic key-value pairs, booleans, numbers, and arrays.
 */
function parseYamlFrontmatter(yamlStr: string): FrontmatterData {
  const data: FrontmatterData = {
    edith_id: "",
    layer: 0,
    human_edited: false,
  };

  const lines = yamlStr.split("\n");
  let currentArrayKey: string | null = null;
  let arrayValues: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    // Array item
    if (trimmed.startsWith("- ") && currentArrayKey) {
      const value = trimmed.slice(2).trim().replace(/^["']|["']$/g, "");
      arrayValues.push(value);
      continue;
    }

    // Flush previous array
    if (currentArrayKey && arrayValues.length > 0) {
      (data as unknown as Record<string, unknown>)[currentArrayKey] = arrayValues;
      currentArrayKey = null;
      arrayValues = [];
    }

    // Key-value pair
    const colonIndex = trimmed.indexOf(":");
    if (colonIndex === -1) continue;

    const key = trimmed.slice(0, colonIndex).trim();
    const value = trimmed.slice(colonIndex + 1).trim();

    // Check if this starts an array
    if (value === "") {
      currentArrayKey = key;
      arrayValues = [];
      continue;
    }

    // Parse value
    const parsedValue = parseYamlValue(value);

    switch (key) {
      case "edith_id":
        data.edith_id = parsedValue as string;
        break;
      case "layer":
        data.layer = parsedValue as number;
        break;
      case "token_budget":
        data.token_budget = parsedValue as number;
        break;
      case "token_actual":
        data.token_actual = parsedValue as number;
        break;
      case "last_distilled":
        data.last_distilled = parsedValue as string;
        break;
      case "edith_version":
        data.edith_version = parsedValue as string;
        break;
      case "human_edited":
        data.human_edited = parsedValue as boolean;
        break;
      case "confidence":
        data.confidence = parsedValue as "EXTRACTED" | "INFERRED" | "AMBIGUOUS";
        break;
      case "related":
        // Single value on same line
        if (typeof parsedValue === "string") {
          data.related = [parsedValue];
        }
        break;
    }
  }

  // Flush last array
  if (currentArrayKey === "related" && arrayValues.length > 0) {
    data.related = arrayValues;
  }

  return data;
}

/**
 * Parse a single YAML value.
 */
function parseYamlValue(value: string): string | number | boolean {
  // Remove surrounding quotes
  const unquoted = value.replace(/^["']|["']$/g, "");

  // Boolean
  if (unquoted === "true") return true;
  if (unquoted === "false") return false;

  // Number
  const num = Number(unquoted);
  if (!isNaN(num) && unquoted !== "") return num;

  return unquoted;
}

// ── Injection ──────────────────────────────────────────────────────

/**
 * Inject or replace frontmatter in a Markdown file.
 * If the file already has frontmatter, preserves the human_edited flag.
 */
export function injectFrontmatter(
  filePath: string,
  newData: FrontmatterData,
): { written: boolean; preserved_human_edit: boolean } {
  if (!existsSync(filePath)) {
    return { written: false, preserved_human_edit: false };
  }

  const content = readFileSync(filePath, "utf-8");
  const parsed = parseFrontmatter(content);

  // Preserve human_edited flag if already set
  const preserved_human_edit = parsed.data.human_edited;
  if (preserved_human_edit) {
    newData.human_edited = true;
  }

  const frontmatter = generateFrontmatter(newData);
  const newContent = frontmatter + "\n\n" + parsed.body;

  writeFileSync(filePath, newContent, "utf-8");
  return { written: true, preserved_human_edit };
}

/**
 * Mark a file as human-edited.
 * Updates the human_edited flag in the frontmatter.
 */
export function markAsHumanEdited(filePath: string): boolean {
  if (!existsSync(filePath)) return false;

  const content = readFileSync(filePath, "utf-8");
  const parsed = parseFrontmatter(content);

  if (parsed.data.human_edited) return true; // Already marked

  parsed.data.human_edited = true;
  const frontmatter = generateFrontmatter(parsed.data);
  const newContent = frontmatter + "\n\n" + parsed.body;

  writeFileSync(filePath, newContent, "utf-8");
  return true;
}

// ── Bulk Frontmatter Injection ─────────────────────────────────────

export interface FrontmatterInjectionResult {
  files_injected: number;
  files_preserved: number;
  errors: string[];
}

/**
 * Inject frontmatter into all vault artifacts.
 */
export function injectVaultFrontmatter(
  vaultRoot: string,
  services: string[],
  tokenBudget?: { routing_table: number; quick_ref: number; distillate_per_query: number },
): FrontmatterInjectionResult {
  const result: FrontmatterInjectionResult = {
    files_injected: 0,
    files_preserved: 0,
    errors: [],
  };

  // Layer 0: routing-table
  const routingPath = join(vaultRoot, "00-routing", "routing-table.md");
  if (existsSync(routingPath)) {
    try {
      const fm = createFrontmatter({
        edith_id: "routing-table",
        layer: 0,
        token_budget: tokenBudget?.routing_table ?? 500,
        related: services.map((s) => `[[01-services/${s}/quick-ref]]`),
      });
      const injectResult = injectFrontmatter(routingPath, fm);
      if (injectResult.written) {
        result.files_injected++;
        if (injectResult.preserved_human_edit) result.files_preserved++;
      }
    } catch (err) {
      result.errors.push(`routing-table frontmatter: ${(err as Error).message}`);
    }
  }

  // Layer 1 & 2: per service
  for (const service of services) {
    // Quick-ref
    const quickRefPath = join(vaultRoot, "01-services", service, "quick-ref.md");
    if (existsSync(quickRefPath)) {
      try {
        const fm = createFrontmatter({
          edith_id: `${service}/quick-ref`,
          layer: 1,
          token_budget: tokenBudget?.quick_ref ?? 2000,
        });
        const injectResult = injectFrontmatter(quickRefPath, fm);
        if (injectResult.written) {
          result.files_injected++;
          if (injectResult.preserved_human_edit) result.files_preserved++;
        }
      } catch (err) {
        result.errors.push(`${service} quick-ref frontmatter: ${(err as Error).message}`);
      }
    }

    // Distillates
    const distillatesDir = join(vaultRoot, "02-distillates", service);
    if (existsSync(distillatesDir)) {
      try {
        const files = readdirSync(distillatesDir).filter((f: string) => f.endsWith(".md"));
        for (const file of files) {
          const distPath = join(distillatesDir, file);
          const distName = basename(file, ".md");
          try {
            const fm = createFrontmatter({
              edith_id: `${service}/${distName}`,
              layer: 2,
              token_budget: tokenBudget?.distillate_per_query ?? 6000,
              related: [
                `[[01-services/${service}/quick-ref]]`,
              ],
            });
            const injectResult = injectFrontmatter(distPath, fm);
            if (injectResult.written) {
              result.files_injected++;
              if (injectResult.preserved_human_edit) result.files_preserved++;
            }
          } catch (err) {
            result.errors.push(`${service}/${file} frontmatter: ${(err as Error).message}`);
          }
        }
      } catch (err) {
        result.errors.push(`${service} distillates scan: ${(err as Error).message}`);
      }
    }
  }

  return result;
}

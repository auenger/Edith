/**
 * EDITH Wikilinks Engine — Obsidian [[wikilink]] cross-reference generation
 *
 * Generates bidirectional Wikilinks between EDITH knowledge artifacts:
 *   routing-table -> service quick-refs
 *   quick-ref -> related distillates
 *   distillates -> related services and decisions
 *
 * Uses Obsidian-compatible [[wikilink]] syntax for Graph View visualization.
 */

import {
  readFileSync,
  writeFileSync,
  existsSync,
  readdirSync,
  statSync,
} from "node:fs";
import { resolve, join, basename, dirname, relative } from "node:path";

// ── Type Definitions ──────────────────────────────────────────────

export interface WikilinkRef {
  /** The wikilink target (e.g. "user-service/quick-ref") */
  target: string;
  /** Optional display text */
  displayText?: string;
  /** The file where this link is placed */
  sourceFile: string;
  /** Type of relationship */
  relation: "routing-to-service" | "service-to-distillate" | "distillate-to-service" | "cross-service" | "decision-to-artifact";
}

export interface WikilinkResult {
  /** Total links generated */
  linksGenerated: number;
  /** Files modified with wikilinks */
  filesModified: string[];
  /** Details of each link */
  links: WikilinkRef[];
}

// ── Wikilink Generation Helpers ────────────────────────────────────

/**
 * Create a [[wikilink]] string.
 */
export function makeWikilink(target: string, displayText?: string): string {
  if (displayText) {
    return `[[${target}|${displayText}]]`;
  }
  return `[[${target}]]`;
}

/**
 * Extract the vault-relative path for a service quick-ref.
 * e.g., "user-service" -> "01-services/user-service/quick-ref"
 */
export function serviceQuickRefPath(serviceName: string): string {
  return `01-services/${serviceName}/quick-ref`;
}

/**
 * Extract the vault-relative path for a distillate file.
 * e.g., ("user-service", "01-api-contracts.md") -> "02-distillates/user-service/01-api-contracts"
 */
export function distillatePath(serviceName: string, filename: string): string {
  const nameWithoutExt = basename(filename, ".md");
  return `02-distillates/${serviceName}/${nameWithoutExt}`;
}

// ── Routing Table Wikilinks ────────────────────────────────────────

/**
 * Inject [[wikilinks]] into routing-table.md for each service.
 * Adds links to quick-ref pages in the service map.
 */
export function injectRoutingTableLinks(
  vaultRoot: string,
  services: string[],
): { modified: boolean; links: WikilinkRef[] } {
  const routingTablePath = join(vaultRoot, "00-routing", "routing-table.md");
  const links: WikilinkRef[] = [];

  if (!existsSync(routingTablePath)) {
    return { modified: false, links };
  }

  let content = readFileSync(routingTablePath, "utf-8");
  let modified = false;

  for (const service of services) {
    const wikilink = makeWikilink(serviceQuickRefPath(service), service);

    // Replace plain service name references in the services table
    // Look for the service name in table cells and add wikilink
    const tablePattern = new RegExp(`\\| (${service}) \\|`, "g");
    if (tablePattern.test(content)) {
      content = content.replace(tablePattern, `| ${wikilink} |`);
      modified = true;
      links.push({
        target: serviceQuickRefPath(service),
        sourceFile: "00-routing/routing-table.md",
        relation: "routing-to-service",
      });
    }
  }

  // Also add a linked services section at the bottom if it doesn't exist
  if (services.length > 0 && !content.includes("## Linked Services")) {
    const linkedSection = [
      "",
      "## Linked Services",
      "",
      ...services.map((s) => `- ${makeWikilink(serviceQuickRefPath(s), s)}`),
    ].join("\n");
    content += linkedSection;
    modified = true;
  }

  if (modified) {
    writeFileSync(routingTablePath, content, "utf-8");
  }

  return { modified, links };
}

// ── Quick-Ref Wikilinks ────────────────────────────────────────────

/**
 * Inject [[wikilinks]] into quick-ref.md for each service.
 * Adds links to related distillate fragments in the Deep Dive section.
 */
export function injectQuickRefLinks(
  vaultRoot: string,
  serviceName: string,
  distillateFiles: string[],
): { modified: boolean; links: WikilinkRef[] } {
  const quickRefPath = join(vaultRoot, "01-services", serviceName, "quick-ref.md");
  const links: WikilinkRef[] = [];

  if (!existsSync(quickRefPath) || distillateFiles.length === 0) {
    return { modified: false, links };
  }

  let content = readFileSync(quickRefPath, "utf-8");
  let modified = false;

  // Replace backtick-style deep dive references with wikilinks
  for (const distFile of distillateFiles) {
    const distName = basename(distFile, ".md");
    const backtickPattern = new RegExp(
      `\\\`${serviceName}/distillates/${distFile.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\\``,
      "g",
    );
    const wikilink = makeWikilink(distillatePath(serviceName, distFile), distName);

    if (backtickPattern.test(content)) {
      content = content.replace(backtickPattern, wikilink);
      modified = true;
    }

    links.push({
      target: distillatePath(serviceName, distFile),
      displayText: distName,
      sourceFile: `01-services/${serviceName}/quick-ref.md`,
      relation: "service-to-distillate",
    });
  }

  if (modified) {
    writeFileSync(quickRefPath, content, "utf-8");
  }

  return { modified, links };
}

// ── Distillate Wikilinks ───────────────────────────────────────────

/**
 * Inject [[wikilinks]] into distillate files.
 * Adds links back to the parent service quick-ref.
 */
export function injectDistillateLinks(
  vaultRoot: string,
  serviceName: string,
  distillateFiles: string[],
  relatedServices: string[] = [],
): { modified: number; links: WikilinkRef[] } {
  const links: WikilinkRef[] = [];
  let modifiedCount = 0;

  for (const distFile of distillateFiles) {
    const distPath = join(vaultRoot, "02-distillates", serviceName, distFile);

    if (!existsSync(distPath)) continue;

    let content = readFileSync(distPath, "utf-8");
    let modified = false;

    // Add related links section at the bottom if not present
    if (!content.includes("## Related")) {
      const relatedLinks: string[] = [];

      // Link to parent service quick-ref
      relatedLinks.push(
        `- Parent: ${makeWikilink(serviceQuickRefPath(serviceName), `${serviceName} quick-ref`)}`,
      );
      links.push({
        target: serviceQuickRefPath(serviceName),
        sourceFile: `02-distillates/${serviceName}/${distFile}`,
        relation: "distillate-to-service",
      });

      // Link to sibling distillates
      for (const sibling of distillateFiles) {
        if (sibling === distFile) continue;
        const siblingName = basename(sibling, ".md");
        relatedLinks.push(
          `- See also: ${makeWikilink(distillatePath(serviceName, sibling), siblingName)}`,
        );
      }

      // Link to related services (cross-service)
      for (const related of relatedServices) {
        relatedLinks.push(
          `- Related service: ${makeWikilink(serviceQuickRefPath(related), related)}`,
        );
        links.push({
          target: serviceQuickRefPath(related),
          sourceFile: `02-distillates/${serviceName}/${distFile}`,
          relation: "cross-service",
        });
      }

      content += "\n\n## Related\n\n" + relatedLinks.join("\n") + "\n";
      modified = true;
    }

    if (modified) {
      writeFileSync(distPath, content, "utf-8");
      modifiedCount++;
    }
  }

  return { modified: modifiedCount, links };
}

// ── Main Wikilink Generation ───────────────────────────────────────

/**
 * Generate Wikilinks across the entire vault structure.
 *
 * Steps:
 * 1. Discover services from 01-services/ directory
 * 2. Inject links into routing-table (Layer 0 -> Layer 1)
 * 3. Inject links into quick-refs (Layer 1 -> Layer 2)
 * 4. Inject links into distillates (Layer 2 -> Layer 1 + cross-service)
 */
export function generateWikilinks(vaultRoot: string): WikilinkResult {
  const result: WikilinkResult = {
    linksGenerated: 0,
    filesModified: [],
    links: [],
  };

  // Step 1: Discover services
  const servicesDir = join(vaultRoot, "01-services");
  const services: string[] = [];

  if (existsSync(servicesDir)) {
    try {
      const entries = readdirSync(servicesDir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory() && existsSync(join(servicesDir, entry.name, "quick-ref.md"))) {
          services.push(entry.name);
        }
      }
    } catch {
      // No services found
    }
  }

  if (services.length === 0) {
    return result;
  }

  // Step 2: Routing table links
  const routingResult = injectRoutingTableLinks(vaultRoot, services);
  if (routingResult.modified) {
    result.filesModified.push("00-routing/routing-table.md");
    result.links.push(...routingResult.links);
  }

  // Step 3 & 4: Quick-ref and distillate links per service
  for (const service of services) {
    const distillatesDir = join(vaultRoot, "02-distillates", service);
    let distillateFiles: string[] = [];

    if (existsSync(distillatesDir)) {
      try {
        distillateFiles = readdirSync(distillatesDir)
          .filter((f) => f.endsWith(".md") && !f.startsWith("00-"))
          .sort();
      } catch {
        // No distillates
      }
    }

    // Quick-ref links
    const qrResult = injectQuickRefLinks(vaultRoot, service, distillateFiles);
    if (qrResult.modified) {
      result.filesModified.push(`01-services/${service}/quick-ref.md`);
      result.links.push(...qrResult.links);
    }

    // Distillate links (with cross-service references)
    const relatedServices = services.filter((s) => s !== service);
    const distResult = injectDistillateLinks(vaultRoot, service, distillateFiles, relatedServices);
    if (distResult.modified > 0) {
      for (const distFile of distillateFiles) {
        result.filesModified.push(`02-distillates/${service}/${distFile}`);
      }
      result.links.push(...distResult.links);
    }
  }

  result.linksGenerated = result.links.length;
  return result;
}

// ── Formatting ─────────────────────────────────────────────────────

export function formatWikilinkResult(result: WikilinkResult): string {
  const lines: string[] = [
    "Wikilinks 交叉引用生成完成",
    "",
    `  生成链接数: ${result.linksGenerated}`,
    `  修改文件数: ${result.filesModified.length}`,
  ];

  if (result.filesModified.length > 0) {
    lines.push("");
    lines.push("  修改文件:");
    for (const file of result.filesModified) {
      lines.push(`    - ${file}`);
    }
  }

  return lines.join("\n");
}

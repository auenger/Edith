/**
 * JARVIS Workspace Statistics
 *
 * Scans the workspace directory to count services and artifacts
 * for the TUI status bar display.
 */

import { existsSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

export interface WorkspaceStats {
  /** Number of services with knowledge artifacts */
  serviceCount: number;

  /** Total number of artifact files (markdown documents) */
  artifactCount: number;

  /** Workspace root path (display-friendly) */
  workspacePath: string;
}

/**
 * Count services and artifacts in the JARVIS workspace.
 *
 * A "service" is a subdirectory in the workspace root that contains
 * at least one markdown file (quick-ref.md, routing-table.md, or distillates/).
 *
 * An "artifact" is any .md file found within the service directories.
 *
 * @param workspaceRoot - Path to the workspace root directory
 * @returns Statistics for the status bar
 */
export function countWorkspaceStats(workspaceRoot: string): WorkspaceStats {
  const absPath = resolve(workspaceRoot);

  if (!existsSync(absPath)) {
    return {
      serviceCount: 0,
      artifactCount: 0,
      workspacePath: workspaceRoot,
    };
  }

  let serviceCount = 0;
  let artifactCount = 0;

  try {
    const entries = readdirSync(absPath, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;

      // Skip hidden directories and common non-service dirs
      if (entry.name.startsWith(".") || entry.name === "node_modules") continue;

      const serviceDir = join(absPath, entry.name);
      const mdFiles = countMarkdownFiles(serviceDir);

      if (mdFiles > 0) {
        serviceCount++;
        artifactCount += mdFiles;
      }
    }
  } catch {
    // Workspace may not exist yet or be unreadable
  }

  return {
    serviceCount,
    artifactCount,
    workspacePath: workspaceRoot,
  };
}

/**
 * Recursively count markdown files in a directory.
 */
function countMarkdownFiles(dir: string): number {
  let count = 0;

  try {
    const entries = readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(dir, entry.name);

      if (entry.isDirectory()) {
        count += countMarkdownFiles(fullPath);
      } else if (entry.name.endsWith(".md")) {
        count++;
      }
    }
  } catch {
    // Permission error or similar — skip
  }

  return count;
}

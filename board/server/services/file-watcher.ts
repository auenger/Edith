/**
 * EDITH Board File Watcher
 *
 * Watches the knowledge repository and .edith/ cache directory for file changes.
 * Emits change events through a callback that the WebSocket service consumes.
 *
 * Uses chokidar for cross-platform file watching.
 * Implements incremental cache updates rather than full re-reads.
 */

import { watch, type FSWatcher } from "chokidar";
import { resolve, join, extname } from "node:path";
import { existsSync } from "node:fs";
import type { ChangeEvent } from "../types/index.js";
import { invalidateCache } from "./data-reader.js";

export type WatchEventHandler = (events: ChangeEvent[]) => void;

export interface FileWatcherOptions {
  repoPath: string;
  debounceMs?: number;
  includePatterns?: string[];
  excludePatterns?: string[];
}

const DEFAULT_INCLUDE = [
  "**/*.md",
  "**/*.json",
];

const DEFAULT_EXCLUDE = [
  "node_modules/**",
  ".git/**",
  "dist/**",
  ".next/**",
];

export class FileWatcher {
  private watcher: FSWatcher | null = null;
  private handler: WatchEventHandler | null = null;
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private pendingEvents: ChangeEvent[] = [];
  private options: FileWatcherOptions & { debounceMs: number };
  private watching = false;

  constructor(options: FileWatcherOptions) {
    this.options = {
      ...options,
      debounceMs: options.debounceMs ?? 500,
    };
  }

  // ── Lifecycle ─────────────────────────────────────────────────

  start(): void {
    if (this.watching) return;

    const repoPath = resolve(this.options.repoPath);
    if (!existsSync(repoPath)) {
      console.warn(`[FileWatcher] Repository path does not exist: ${repoPath}`);
      return;
    }

    const watchPaths = [repoPath];

    // Also watch .edith/ cache if it exists
    const edithCachePath = join(repoPath, ".edith");
    if (existsSync(edithCachePath)) {
      watchPaths.push(edithCachePath);
    }

    const includePatterns = this.options.includePatterns || DEFAULT_INCLUDE;
    const excludePatterns = this.options.excludePatterns || DEFAULT_EXCLUDE;

    this.watcher = watch(watchPaths, {
      ignored: excludePatterns,
      persistent: true,
      ignoreInitial: true,
      awaitWriteFinish: {
        stabilityThreshold: 200,
        pollInterval: 100,
      },
    });

    this.watcher.on("add", (filePath) => this.handleChange("create", filePath));
    this.watcher.on("change", (filePath) => this.handleChange("update", filePath));
    this.watcher.on("unlink", (filePath) => this.handleChange("delete", filePath));

    this.watcher.on("error", (error) => {
      console.error("[FileWatcher] Error:", error);
    });

    this.watcher.on("ready", () => {
      console.log("[FileWatcher] Watching for changes...");
      this.watching = true;
    });
  }

  stop(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }

    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
    }

    this.watching = false;
    this.pendingEvents = [];
  }

  isWatching(): boolean {
    return this.watching;
  }

  // ── Event Handling ────────────────────────────────────────────

  onChange(handler: WatchEventHandler): void {
    this.handler = handler;
  }

  private handleChange(type: ChangeEvent["type"], filePath: string): void {
    const repoPath = resolve(this.options.repoPath);

    this.pendingEvents.push({
      type,
      path: filePath.startsWith(repoPath)
        ? filePath.slice(repoPath.length + 1)
        : filePath,
      timestamp: new Date().toISOString(),
    });

    this.debounceFlush();
  }

  private debounceFlush(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(() => {
      this.flush();
    }, this.options.debounceMs);
  }

  private flush(): void {
    if (this.pendingEvents.length === 0) return;

    const events = [...this.pendingEvents];
    this.pendingEvents = [];

    // Invalidate cache so next reads get fresh data
    invalidateCache();

    if (this.handler) {
      this.handler(events);
    }
  }
}

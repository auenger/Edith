/**
 * EDITH Multimodal Ingestion Tool — edith_ingest implementation
 *
 * Extends edith_scan input scope to support non-code document formats:
 * - PDF → MarkItDown + optional OCR → structured Markdown
 * - Word/Excel/PowerPoint → MarkItDown → GFM tables + bullet lists
 * - Images/Architecture diagrams → LLM Vision → semantic description text
 * - Audio → MarkItDown transcription → timestamped minutes (V2 reserved)
 *
 * Pipeline:
 *   1. Detect file format via extension
 *   2. Route to appropriate processing pipeline
 *   3. Output structured Markdown
 *   4. Markdown feeds into distillation pipeline
 *
 * Python strategy:
 *   - Check MarkItDown availability via `python3 -c "import markitdown"`
 *   - Available → enable multimodal pipeline
 *   - Not available → degrade to code-only scan, log info
 *   - Never auto-install Python deps
 */

import {
  existsSync,
  readdirSync,
  readFileSync,
  writeFileSync,
  mkdirSync,
  statSync,
} from "node:fs";
import { resolve, join, extname, relative, basename } from "node:path";
import { spawn, execSync } from "node:child_process";
import { platform } from "node:process";

import type { MultimodalConfig, IngestionConfig, VisionConfig, OcrConfig } from "../config.js";

// ── Type Definitions ──────────────────────────────────────────────

/** Supported ingestion file categories */
export type FileCategory = "pdf" | "office-word" | "office-excel" | "office-ppt" | "image" | "audio" | "unknown";

/** Result of ingesting a single file */
export interface IngestionResult {
  /** Original file path */
  sourcePath: string;
  /** Relative path from project root */
  relativePath: string;
  /** Detected file category */
  category: FileCategory;
  /** Output Markdown content */
  markdown: string;
  /** Processing method used */
  method: "markitdown" | "vision" | "ocr" | "skipped" | "error";
  /** Token estimate for the output markdown */
  tokenEstimate: number;
  /** Warning messages during processing */
  warnings: string[];
  /** Processing duration in ms */
  duration: number;
}

/** Batch ingestion result */
export interface BatchIngestionResult {
  results: IngestionResult[];
  totalFiles: number;
  processedFiles: number;
  skippedFiles: number;
  errorFiles: number;
  totalDuration: number;
}

/** Python environment status */
export interface PythonStatus {
  available: boolean;
  pythonPath: string;
  markitdownAvailable: boolean;
  version?: string;
}

// ── Constants ─────────────────────────────────────────────────────

const EXTENSION_CATEGORY_MAP: Record<string, FileCategory> = {
  ".pdf": "pdf",
  ".doc": "office-word",
  ".docx": "office-word",
  ".xls": "office-excel",
  ".xlsx": "office-excel",
  ".ppt": "office-ppt",
  ".pptx": "office-ppt",
  ".png": "image",
  ".jpg": "image",
  ".jpeg": "image",
  ".gif": "image",
  ".bmp": "image",
  ".webp": "image",
  ".svg": "image",
  ".mp3": "audio",
  ".wav": "audio",
  ".m4a": "audio",
  ".flac": "audio",
};

const IMAGE_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".gif", ".bmp", ".webp", ".svg"]);

const DEFAULT_EXCLUDE_PATTERNS = [
  "*.encrypted.*",
  "node_modules/**",
  ".git/**",
  "vendor/**",
  "__pycache__/**",
];

// ── Python Environment Detection ──────────────────────────────────

let cachedPythonStatus: PythonStatus | null = null;

/**
 * Detect Python 3 and MarkItDown availability.
 * Caches result for the session.
 */
export function detectPythonEnvironment(): PythonStatus {
  if (cachedPythonStatus) return cachedPythonStatus;

  const status: PythonStatus = {
    available: false,
    pythonPath: "",
    markitdownAvailable: false,
  };

  // Try python3 first, then python
  const pythonCommands = platform === "win32" ? ["python", "python3"] : ["python3", "python"];

  for (const cmd of pythonCommands) {
    try {
      const versionOutput = execSync(`${cmd} --version 2>&1`, {
        encoding: "utf-8",
        timeout: 5000,
      });
      if (versionOutput.includes("Python 3")) {
        status.available = true;
        status.pythonPath = cmd;
        status.version = versionOutput.trim();
        break;
      }
    } catch {
      // Python not found, try next
    }
  }

  if (status.available) {
    try {
      execSync(`${status.pythonPath} -c "import markitdown" 2>&1`, {
        encoding: "utf-8",
        timeout: 5000,
      });
      status.markitdownAvailable = true;
    } catch {
      status.markitdownAvailable = false;
    }
  }

  cachedPythonStatus = status;
  return status;
}

// ── Format Detection ──────────────────────────────────────────────

/**
 * Detect the file category from extension.
 */
export function detectFileCategory(filePath: string): FileCategory {
  const ext = extname(filePath).toLowerCase();
  return EXTENSION_CATEGORY_MAP[ext] ?? "unknown";
}

/**
 * Check if a file should be processed by the multimodal pipeline.
 */
export function isMultimodalFile(filePath: string): boolean {
  const category = detectFileCategory(filePath);
  return category !== "unknown";
}

/**
 * Check if a file is an image that requires Vision processing.
 */
export function isImageFile(filePath: string): boolean {
  return IMAGE_EXTENSIONS.has(extname(filePath).toLowerCase());
}

/**
 * Check if a path matches any exclude pattern.
 */
function isExcluded(filePath: string, excludePatterns: string[]): boolean {
  for (const pattern of excludePatterns) {
    if (pattern.startsWith("*.")) {
      // Simple extension pattern: *.encrypted.*
      const suffix = pattern.slice(1); // ".encrypted.*"
      if (filePath.endsWith(suffix.replace(".*", ""))) return true;
    } else if (pattern.endsWith("/**")) {
      // Directory pattern: node_modules/**
      const dir = pattern.slice(0, -3);
      if (filePath.includes(dir)) return true;
    } else if (filePath.includes(pattern)) {
      return true;
    }
  }
  return false;
}

// ── MarkItDown Processing ─────────────────────────────────────────

/**
 * Run MarkItDown on a single file via Python subprocess.
 * Returns the Markdown output string.
 */
function runMarkItDown(filePath: string, pythonPath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const args = ["-c", `from markitdown import MarkItDown; md = MarkItDown(); result = md.convert("${filePath.replace(/"/g, '\\"')}"); print(result.text_content)`];

    const proc = spawn(pythonPath, args, {
      timeout: 60_000,
      stdio: ["pipe", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";

    proc.stdout.on("data", (data: Buffer) => {
      stdout += data.toString("utf-8");
    });

    proc.stderr.on("data", (data: Buffer) => {
      stderr += data.toString("utf-8");
    });

    proc.on("close", (code) => {
      if (code === 0 && stdout.trim().length > 0) {
        resolve(stdout.trim());
      } else {
        reject(new Error(`MarkItDown failed (exit ${code}): ${stderr.trim() || "empty output"}`));
      }
    });

    proc.on("error", (err) => {
      reject(new Error(`MarkItDown spawn error: ${err.message}`));
    });
  });
}

// ── Vision API Processing ─────────────────────────────────────────

/**
 * Generate semantic description for an image using a multimodal LLM.
 * Supports OpenAI, Anthropic, and local providers.
 */
async function runVisionDescription(
  imagePath: string,
  visionConfig: VisionConfig,
): Promise<string> {
  const imageBuffer = readFileSync(imagePath);
  const base64Image = imageBuffer.toString("base64");
  const ext = extname(imagePath).toLowerCase().replace(".", "");
  const mimeType = ext === "jpg" ? "jpeg" : ext === "svg" ? "svg+xml" : ext;
  const dataUrl = `data:image/${mimeType};base64,${base64Image}`;

  const prompt = `请详细描述这张图片的内容。如果这是一张技术架构图、流程图或设计图，请重点说明：
1. 整体结构和布局
2. 各个组件/模块的名称和职责
3. 组件之间的连接和依赖关系
4. 关键的技术决策和约束
5. 重要的标注和说明文字

请用 Markdown 格式输出描述结果。`;

  const provider = visionConfig.provider;
  const apiKey = visionConfig.api_key || process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY;
  const baseUrl = visionConfig.base_url;

  if (provider === "local" || provider === "openai") {
    // OpenAI-compatible API (covers local Ollama/vLLM too)
    const endpoint = provider === "local"
      ? `${baseUrl || "http://localhost:11434"}/v1/chat/completions`
      : `${baseUrl || "https://api.openai.com"}/v1/chat/completions`;

    const model = visionConfig.model || (provider === "local" ? "llava" : "gpt-4o");

    const body = JSON.stringify({
      model,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: dataUrl } },
          ],
        },
      ],
      max_tokens: 2000,
    });

    const result = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
      },
      body,
    });

    if (!result.ok) {
      const errText = await result.text();
      throw new Error(`Vision API error (${result.status}): ${errText}`);
    }

    const json = await result.json() as { choices: Array<{ message: { content: string } }> };
    return json.choices?.[0]?.message?.content ?? "[Vision API 返回空内容]";
  }

  if (provider === "anthropic") {
    const endpoint = `${baseUrl || "https://api.anthropic.com"}/v1/messages`;
    const model = visionConfig.model || "claude-sonnet-4-6";

    const body = JSON.stringify({
      model,
      max_tokens: 2000,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: `image/${mimeType}`,
                data: base64Image,
              },
            },
            { type: "text", text: prompt },
          ],
        },
      ],
    });

    const result = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey || "",
        "anthropic-version": "2023-06-01",
      },
      body,
    });

    if (!result.ok) {
      const errText = await result.text();
      throw new Error(`Anthropic Vision API error (${result.status}): ${errText}`);
    }

    const json = await result.json() as { content: Array<{ type: string; text: string }> };
    const textBlock = json.content?.find((c) => c.type === "text");
    return textBlock?.text ?? "[Anthropic Vision 返回空内容]";
  }

  throw new Error(`Unsupported vision provider: ${provider}`);
}

// ── File Discovery ────────────────────────────────────────────────

export interface DiscoveredMultimodalFile {
  path: string;
  relativePath: string;
  category: FileCategory;
  size: number;
}

/**
 * Walk a directory and find all multimodal files.
 */
export function discoverMultimodalFiles(
  dirPath: string,
  supportedFormats: string[],
  excludePatterns: string[],
): DiscoveredMultimodalFile[] {
  const results: DiscoveredMultimodalFile[] = [];
  const supportedExtSet = new Set(supportedFormats.map((f) => f.startsWith(".") ? f : `.${f}`));

  function walk(dir: string): void {
    let entries;
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      const fullPath = join(dir, entry.name);

      if (entry.name.startsWith(".") && entry.name !== ".github") continue;

      const relPath = relative(dirPath, fullPath);
      if (isExcluded(relPath, excludePatterns)) continue;

      if (entry.isDirectory()) {
        if (["node_modules", ".git", "vendor", "__pycache__", "dist", "build", "target"].includes(entry.name)) continue;
        walk(fullPath);
      } else {
        const ext = extname(entry.name).toLowerCase();
        const category = EXTENSION_CATEGORY_MAP[ext];
        if (category && category !== "unknown" && supportedExtSet.has(ext)) {
          let stat;
          try { stat = statSync(fullPath); } catch { continue; }
          results.push({
            path: fullPath,
            relativePath: relPath,
            category,
            size: stat.size,
          });
        }
      }
    }
  }

  walk(dirPath);
  return results;
}

// ── Single File Ingestion ─────────────────────────────────────────

/**
 * Ingest a single multimodal file and produce Markdown.
 */
export async function ingestFile(
  filePath: string,
  projectRoot: string,
  pythonStatus: PythonStatus,
  multimodalConfig?: MultimodalConfig,
  ingestionConfig?: IngestionConfig,
): Promise<IngestionResult> {
  const startTime = Date.now();
  const warnings: string[] = [];
  const category = detectFileCategory(filePath);
  const relativePath = relative(projectRoot, filePath);

  const markitdownEnabled = ingestionConfig?.markitdown.enabled ?? true;
  const visionEnabled = ingestionConfig?.markitdown.vision ?? true;

  // Skip if category is unknown
  if (category === "unknown") {
    return {
      sourcePath: filePath,
      relativePath,
      category,
      markdown: "",
      method: "skipped",
      tokenEstimate: 0,
      warnings: ["Unknown file format, skipping"],
      duration: Date.now() - startTime,
    };
  }

  // Skip if MarkItDown is disabled in config
  if (!markitdownEnabled) {
    return {
      sourcePath: filePath,
      relativePath,
      category,
      markdown: "",
      method: "skipped",
      tokenEstimate: 0,
      warnings: ["MarkItDown disabled in config"],
      duration: Date.now() - startTime,
    };
  }

  try {
    // Image files → Vision API (if enabled)
    if (category === "image" && visionEnabled && multimodalConfig?.vision) {
      try {
        const description = await runVisionDescription(filePath, multimodalConfig.vision);
        const markdown = formatVisionOutput(relativePath, description);
        return {
          sourcePath: filePath,
          relativePath,
          category,
          markdown,
          method: "vision",
          tokenEstimate: estimateTokens(markdown),
          warnings,
          duration: Date.now() - startTime,
        };
      } catch (visionErr) {
        const msg = (visionErr as Error).message;
        warnings.push(`Vision API failed: ${msg}`);
        // Fall through to MarkItDown as fallback for images
      }
    }

    // MarkItDown processing (PDF, Office, images as fallback)
    if (pythonStatus.markitdownAvailable) {
      try {
        const md = await runMarkItDown(filePath, pythonStatus.pythonPath);
        const markdown = formatMarkItDownOutput(relativePath, md, category);
        return {
          sourcePath: filePath,
          relativePath,
          category,
          markdown,
          method: category === "image" ? "ocr" : "markitdown",
          tokenEstimate: estimateTokens(markdown),
          warnings,
          duration: Date.now() - startTime,
        };
      } catch (mdErr) {
        const msg = (mdErr as Error).message;
        warnings.push(`MarkItDown processing failed: ${msg}`);
      }
    }

    // No processing method available
    return {
      sourcePath: filePath,
      relativePath,
      category,
      markdown: "",
      method: "skipped",
      tokenEstimate: 0,
      warnings: [
        ...warnings,
        pythonStatus.available
          ? "MarkItDown not available, skipping non-code file"
          : "Python 3 not available, skipping non-code file",
      ],
      duration: Date.now() - startTime,
    };
  } catch (err) {
    const msg = (err as Error).message;
    return {
      sourcePath: filePath,
      relativePath,
      category,
      markdown: "",
      method: "error",
      tokenEstimate: 0,
      warnings: [`Processing error: ${msg}`],
      duration: Date.now() - startTime,
    };
  }
}

// ── Batch Ingestion ───────────────────────────────────────────────

/**
 * Ingest all multimodal files in a project directory.
 */
export async function ingestMultimodalFiles(
  projectPath: string,
  multimodalConfig?: MultimodalConfig,
  ingestionConfig?: IngestionConfig,
): Promise<BatchIngestionResult> {
  const startTime = Date.now();
  const pythonStatus = detectPythonEnvironment();

  const supportedFormats = ingestionConfig?.markitdown.supported_formats
    ?? ["pdf", "docx", "xlsx", "pptx", "png", "jpg", "jpeg", "gif", "bmp", "mp3", "wav"];
  const excludePatterns = ingestionConfig?.markitdown.exclude_patterns
    ?? DEFAULT_EXCLUDE_PATTERNS;

  // Discover multimodal files
  const discovered = discoverMultimodalFiles(projectPath, supportedFormats, excludePatterns);

  if (discovered.length === 0) {
    return {
      results: [],
      totalFiles: 0,
      processedFiles: 0,
      skippedFiles: 0,
      errorFiles: 0,
      totalDuration: Date.now() - startTime,
    };
  }

  // Log Python environment status
  if (!pythonStatus.markitdownAvailable) {
    console.log("[EDITH] MarkItDown not available, skipping non-code files (install: pip install markitdown)");
  }

  // Process files
  const results: IngestionResult[] = [];
  const batchSize = ingestionConfig?.markitdown.batch_size ?? 50;

  for (let i = 0; i < discovered.length; i += batchSize) {
    const batch = discovered.slice(i, i + batchSize);
    const batchPromises = batch.map((file) =>
      ingestFile(file.path, projectPath, pythonStatus, multimodalConfig, ingestionConfig),
    );
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
  }

  const processedFiles = results.filter((r) => r.method !== "skipped" && r.method !== "error").length;
  const skippedFiles = results.filter((r) => r.method === "skipped").length;
  const errorFiles = results.filter((r) => r.method === "error").length;

  return {
    results,
    totalFiles: discovered.length,
    processedFiles,
    skippedFiles,
    errorFiles,
    totalDuration: Date.now() - startTime,
  };
}

// ── Output Formatting ─────────────────────────────────────────────

function formatMarkItDownOutput(relativePath: string, content: string, category: FileCategory): string {
  const categoryLabel: Record<FileCategory, string> = {
    pdf: "PDF Document",
    "office-word": "Word Document",
    "office-excel": "Excel Spreadsheet",
    "office-ppt": "PowerPoint Presentation",
    image: "Image (OCR)",
    audio: "Audio Transcription",
    unknown: "Document",
  };

  const lines = [
    `## ${categoryLabel[category]}: ${basename(relativePath)}`,
    "",
    `> Source: \`${relativePath}\``,
    `> Processed: ${new Date().toISOString()}`,
    "",
    content,
  ];

  return lines.join("\n");
}

function formatVisionOutput(relativePath: string, description: string): string {
  const lines = [
    `## Image Description: ${basename(relativePath)}`,
    "",
    `> Source: \`${relativePath}\``,
    `> Processed: ${new Date().toISOString()} (LLM Vision)`,
    "",
    description,
  ];

  return lines.join("\n");
}

/**
 * Estimate token count for a string (rough: 1 token ~ 4 chars).
 */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

// ── Persist Ingestion Results ─────────────────────────────────────

/**
 * Save ingestion results as Markdown files in the output directory.
 * Returns list of generated file paths.
 */
export function persistIngestionResults(
  outputDir: string,
  results: IngestionResult[],
): string[] {
  mkdirSync(outputDir, { recursive: true });

  const files: string[] = [];
  const validResults = results.filter((r) => r.markdown.length > 0);

  if (validResults.length === 0) return files;

  // Create a single consolidated ingestion document
  const sections: string[] = [
    "# Multimodal Document Ingestion",
    "",
    `> Generated: ${new Date().toISOString()}`,
    `> Files processed: ${validResults.length}`,
    "",
    "---",
    "",
  ];

  for (const result of validResults) {
    sections.push(result.markdown);
    sections.push("");
    sections.push("---");
    sections.push("");
  }

  const consolidatedPath = join(outputDir, "ingested-documents.md");
  writeFileSync(consolidatedPath, sections.join("\n"), "utf-8");
  files.push("ingested-documents.md");

  return files;
}

// ── Format Summary ────────────────────────────────────────────────

export function formatIngestionSummary(batchResult: BatchIngestionResult): string {
  const lines = [
    "EDITH 多模态摄入完成",
    "",
    `  总文件数: ${batchResult.totalFiles}`,
    `  成功处理: ${batchResult.processedFiles}`,
    `  跳过: ${batchResult.skippedFiles}`,
    `  错误: ${batchResult.errorFiles}`,
    `  耗时: ${(batchResult.totalDuration / 1000).toFixed(1)}s`,
  ];

  // Category breakdown
  const categoryCounts: Record<string, number> = {};
  for (const r of batchResult.results) {
    if (r.method !== "skipped" && r.method !== "error") {
      categoryCounts[r.category] = (categoryCounts[r.category] ?? 0) + 1;
    }
  }

  if (Object.keys(categoryCounts).length > 0) {
    lines.push("", "  按类型:");
    for (const [cat, count] of Object.entries(categoryCounts)) {
      lines.push(`    ${cat}: ${count}`);
    }
  }

  // Warnings
  const allWarnings = batchResult.results.flatMap((r) => r.warnings);
  if (allWarnings.length > 0) {
    lines.push("", `  警告: ${allWarnings.length}`);
    for (const w of allWarnings.slice(0, 5)) {
      lines.push(`    - ${w}`);
    }
    if (allWarnings.length > 5) {
      lines.push(`    ... and ${allWarnings.length - 5} more`);
    }
  }

  return lines.join("\n");
}

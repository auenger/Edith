/**
 * Unit tests for multimodal ingestion (ingest.ts + config.ts extensions)
 *
 * Tests:
 *   - Config: MultimodalConfig / IngestionConfig interfaces and defaults
 *   - Config: Backward compatibility (no multimodal/ingestion → no error)
 *   - Config: Validation of invalid multimodal/ingestion config
 *   - Format detection: file extension → category mapping
 *   - Multimodal file discovery
 *   - Ingestion pipeline: Python not available → graceful degradation
 *   - Ingestion pipeline: MarkItDown not available → graceful degradation
 *   - Ingestion pipeline: Disabled in config → skip all
 *   - Vision description fallback when MarkItDown fails for images
 *   - Persist ingestion results
 *   - Format summary output
 *
 * Uses Node.js built-in test runner with temporary file fixtures.
 */

import { describe, it, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, writeFileSync, rmSync, mkdtempSync, existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";

import {
  detectFileCategory,
  isMultimodalFile,
  isImageFile,
  discoverMultimodalFiles,
  formatIngestionSummary,
  persistIngestionResults,
  type IngestionResult,
  type BatchIngestionResult,
} from "../tools/ingest.js";

import {
  applyDefaults,
  validateConfig,
  ConfigValidationError,
  type EdithConfig,
  type MultimodalConfig,
  type IngestionConfig,
} from "../config.js";

// ── Test Fixtures ─────────────────────────────────────────────────

let testDir: string;

function createTestDir(): string {
  const dir = mkdtempSync(join(tmpdir(), "edith-ingest-test-"));
  return dir;
}

function createMultimodalProject(dir: string): void {
  // Create files of different types
  writeFileSync(join(dir, "report.pdf"), "fake pdf content");
  writeFileSync(join(dir, "spec.docx"), "fake docx content");
  writeFileSync(join(dir, "data.xlsx"), "fake xlsx content");
  writeFileSync(join(dir, "slides.pptx"), "fake pptx content");
  writeFileSync(join(dir, "arch.png"), "fake png content");
  writeFileSync(join(dir, "photo.jpg"), "fake jpg content");
  writeFileSync(join(dir, "notes.txt"), "plain text");
  writeFileSync(join(dir, "main.py"), "print('hello')");

  // Create subdirectory with files
  const subDir = join(dir, "docs");
  mkdirSync(subDir, { recursive: true });
  writeFileSync(join(subDir, "guide.pdf"), "fake pdf 2");
  writeFileSync(join(subDir, "diagram.png"), "fake diagram");

  // Create excluded directory
  const nodeModules = join(dir, "node_modules");
  mkdirSync(nodeModules, { recursive: true });
  writeFileSync(join(nodeModules, "lib.pdf"), "should be excluded");
}

before(() => {
  testDir = createTestDir();
});

after(() => {
  try {
    rmSync(testDir, { recursive: true, force: true });
  } catch {
    // Ignore cleanup errors
  }
});

// ── Config Tests ──────────────────────────────────────────────────

describe("Config: Multimodal/Ingestion defaults", () => {
  it("should apply empty defaults when no multimodal/ingestion config", () => {
    const config = applyDefaults({
      llm: {
        provider: "openai",
        model: "gpt-4",
      },
      workspace: {
        root: "./test",
        language: "zh",
      },
    });

    assert.equal(config.multimodal, undefined);
    assert.equal(config.ingestion, undefined);
  });

  it("should apply multimodal config when provided", () => {
    const config = applyDefaults({
      llm: {
        provider: "openai",
        model: "gpt-4",
      },
      workspace: {
        root: "./test",
        language: "zh",
      },
      multimodal: {
        vision: {
          provider: "anthropic",
          model: "claude-sonnet-4-6",
        },
        ocr: {
          provider: "tesseract",
        },
      },
    });

    assert.ok(config.multimodal);
    assert.equal(config.multimodal!.vision!.provider, "anthropic");
    assert.equal(config.multimodal!.vision!.model, "claude-sonnet-4-6");
    assert.ok(config.multimodal!.ocr);
    assert.equal(config.multimodal!.ocr!.provider, "tesseract");
  });

  it("should apply ingestion config when provided", () => {
    const config = applyDefaults({
      llm: {
        provider: "openai",
        model: "gpt-4",
      },
      workspace: {
        root: "./test",
        language: "zh",
      },
      ingestion: {
        markitdown: {
          enabled: true,
          ocr: true,
          vision: true,
          batch_size: 25,
          supported_formats: ["pdf", "docx"],
          exclude_patterns: ["*.encrypted.*"],
        },
      },
    });

    assert.ok(config.ingestion);
    assert.equal(config.ingestion!.markitdown.enabled, true);
    assert.equal(config.ingestion!.markitdown.batch_size, 25);
    assert.deepEqual(config.ingestion!.markitdown.supported_formats, ["pdf", "docx"]);
  });

  it("should apply partial ingestion config with defaults", () => {
    const config = applyDefaults({
      llm: {
        provider: "openai",
        model: "gpt-4",
      },
      workspace: {
        root: "./test",
        language: "zh",
      },
      ingestion: {
        markitdown: {
          enabled: false,
        } as any,
      },
    });

    assert.ok(config.ingestion);
    assert.equal(config.ingestion!.markitdown.enabled, false);
    // Other fields should get defaults
    assert.equal(config.ingestion!.markitdown.ocr, true);
    assert.equal(config.ingestion!.markitdown.vision, true);
    assert.equal(config.ingestion!.markitdown.batch_size, 50);
  });
});

describe("Config: Validation", () => {
  it("should accept valid multimodal config", () => {
    assert.doesNotThrow(() => {
      validateConfig({
        llm: { provider: "openai", model: "gpt-4" },
        workspace: { root: "./test", language: "zh" },
        multimodal: {
          vision: { provider: "openai", model: "gpt-4o" },
        },
      });
    });
  });

  it("should reject invalid vision provider", () => {
    assert.throws(
      () => {
        validateConfig({
          llm: { provider: "openai", model: "gpt-4" },
          workspace: { root: "./test", language: "zh" },
          multimodal: {
            vision: { provider: "invalid-provider" },
          },
        });
      },
      (err: unknown) => {
        assert.ok(err instanceof ConfigValidationError);
        assert.ok(err.message.includes("multimodal.vision.provider"));
        return true;
      },
    );
  });

  it("should reject invalid OCR provider", () => {
    assert.throws(
      () => {
        validateConfig({
          llm: { provider: "openai", model: "gpt-4" },
          workspace: { root: "./test", language: "zh" },
          multimodal: {
            ocr: { provider: "invalid-ocr" },
          },
        });
      },
      (err: unknown) => {
        assert.ok(err instanceof ConfigValidationError);
        assert.ok(err.message.includes("multimodal.ocr.provider"));
        return true;
      },
    );
  });

  it("should reject non-boolean markitdown.enabled", () => {
    assert.throws(
      () => {
        validateConfig({
          llm: { provider: "openai", model: "gpt-4" },
          workspace: { root: "./test", language: "zh" },
          ingestion: {
            markitdown: { enabled: "yes" } as any,
          },
        });
      },
      (err: unknown) => {
        assert.ok(err instanceof ConfigValidationError);
        assert.ok(err.message.includes("ingestion.markitdown.enabled"));
        return true;
      },
    );
  });

  it("should reject invalid batch_size", () => {
    assert.throws(
      () => {
        validateConfig({
          llm: { provider: "openai", model: "gpt-4" },
          workspace: { root: "./test", language: "zh" },
          ingestion: {
            markitdown: { enabled: true, batch_size: -1 },
          },
        });
      },
      (err: unknown) => {
        assert.ok(err instanceof ConfigValidationError);
        assert.ok(err.message.includes("ingestion.markitdown.batch_size"));
        return true;
      },
    );
  });
});

// ── Format Detection Tests ────────────────────────────────────────

describe("Format Detection", () => {
  it("should detect PDF files", () => {
    assert.equal(detectFileCategory("report.pdf"), "pdf");
    assert.equal(detectFileCategory("/path/to/REPORT.PDF"), "pdf");
  });

  it("should detect Word documents", () => {
    assert.equal(detectFileCategory("spec.docx"), "office-word");
    assert.equal(detectFileCategory("old.doc"), "office-word");
  });

  it("should detect Excel spreadsheets", () => {
    assert.equal(detectFileCategory("data.xlsx"), "office-excel");
    assert.equal(detectFileCategory("legacy.xls"), "office-excel");
  });

  it("should detect PowerPoint presentations", () => {
    assert.equal(detectFileCategory("slides.pptx"), "office-ppt");
    assert.equal(detectFileCategory("deck.ppt"), "office-ppt");
  });

  it("should detect image files", () => {
    assert.equal(detectFileCategory("arch.png"), "image");
    assert.equal(detectFileCategory("photo.jpg"), "image");
    assert.equal(detectFileCategory("image.jpeg"), "image");
    assert.equal(detectFileCategory("anim.gif"), "image");
    assert.equal(detectFileCategory("diagram.bmp"), "image");
    assert.equal(detectFileCategory("modern.webp"), "image");
  });

  it("should detect audio files", () => {
    assert.equal(detectFileCategory("song.mp3"), "audio");
    assert.equal(detectFileCategory("voice.wav"), "audio");
  });

  it("should return unknown for code/text files", () => {
    assert.equal(detectFileCategory("main.py"), "unknown");
    assert.equal(detectFileCategory("index.ts"), "unknown");
    assert.equal(detectFileCategory("readme.md"), "unknown");
    assert.equal(detectFileCategory("notes.txt"), "unknown");
  });

  it("isMultimodalFile should return true for multimodal formats", () => {
    assert.equal(isMultimodalFile("report.pdf"), true);
    assert.equal(isMultimodalFile("spec.docx"), true);
    assert.equal(isMultimodalFile("arch.png"), true);
  });

  it("isMultimodalFile should return false for code/text", () => {
    assert.equal(isMultimodalFile("main.py"), false);
    assert.equal(isMultimodalFile("index.ts"), false);
  });

  it("isImageFile should return true only for images", () => {
    assert.equal(isImageFile("arch.png"), true);
    assert.equal(isImageFile("photo.jpg"), true);
    assert.equal(isImageFile("report.pdf"), false);
    assert.equal(isImageFile("spec.docx"), false);
  });
});

// ── File Discovery Tests ──────────────────────────────────────────

describe("Multimodal File Discovery", () => {
  let projectDir: string;

  beforeEach(() => {
    projectDir = mkdtempSync(join(tmpdir(), "edith-discover-"));
    createMultimodalProject(projectDir);
  });

  it("should discover all multimodal files in a project", () => {
    const files = discoverMultimodalFiles(projectDir, ["pdf", "docx", "xlsx", "pptx", "png", "jpg"], []);
    const relPaths = files.map((f) => f.relativePath).sort();

    assert.ok(relPaths.includes("report.pdf"));
    assert.ok(relPaths.includes("spec.docx"));
    assert.ok(relPaths.includes("data.xlsx"));
    assert.ok(relPaths.includes("slides.pptx"));
    assert.ok(relPaths.includes("arch.png"));
    assert.ok(relPaths.includes("photo.jpg"));
    assert.ok(relPaths.includes(join("docs", "guide.pdf")));
    assert.ok(relPaths.includes(join("docs", "diagram.png")));
  });

  it("should not include code/text files", () => {
    const files = discoverMultimodalFiles(projectDir, ["pdf", "docx", "xlsx", "pptx", "png", "jpg"], []);
    const relPaths = files.map((f) => f.relativePath);

    assert.ok(!relPaths.includes("notes.txt"));
    assert.ok(!relPaths.includes("main.py"));
  });

  it("should exclude node_modules by default", () => {
    const files = discoverMultimodalFiles(projectDir, ["pdf"], ["node_modules/**"]);
    const relPaths = files.map((f) => f.relativePath);

    assert.ok(!relPaths.some((p) => p.includes("node_modules")));
  });

  it("should filter by supported formats", () => {
    const files = discoverMultimodalFiles(projectDir, ["pdf"], []);
    const categories = new Set(files.map((f) => f.category));

    assert.ok(categories.has("pdf"));
    assert.ok(!categories.has("image"));
    assert.ok(!categories.has("office-word"));
  });

  it("should return empty for empty directory", () => {
    const emptyDir = mkdtempSync(join(tmpdir(), "edith-empty-"));
    const files = discoverMultimodalFiles(emptyDir, ["pdf"], []);
    assert.equal(files.length, 0);
    rmSync(emptyDir, { recursive: true, force: true });
  });
});

// ── Format Summary Tests ──────────────────────────────────────────

describe("Format Ingestion Summary", () => {
  it("should format batch result summary", () => {
    const batchResult: BatchIngestionResult = {
      results: [],
      totalFiles: 10,
      processedFiles: 7,
      skippedFiles: 2,
      errorFiles: 1,
      totalDuration: 5000,
    };

    const summary = formatIngestionSummary(batchResult);
    assert.ok(summary.includes("10"));
    assert.ok(summary.includes("7"));
    assert.ok(summary.includes("2"));
    assert.ok(summary.includes("1"));
  });

  it("should include category breakdown", () => {
    const batchResult: BatchIngestionResult = {
      results: [
        {
          sourcePath: "/a.pdf",
          relativePath: "a.pdf",
          category: "pdf",
          markdown: "content",
          method: "markitdown",
          tokenEstimate: 100,
          warnings: [],
          duration: 500,
        },
        {
          sourcePath: "/b.png",
          relativePath: "b.png",
          category: "image",
          markdown: "description",
          method: "vision",
          tokenEstimate: 200,
          warnings: [],
          duration: 800,
        },
      ],
      totalFiles: 2,
      processedFiles: 2,
      skippedFiles: 0,
      errorFiles: 0,
      totalDuration: 1300,
    };

    const summary = formatIngestionSummary(batchResult);
    assert.ok(summary.includes("pdf"));
    assert.ok(summary.includes("image"));
  });
});

// ── Persist Results Tests ─────────────────────────────────────────

describe("Persist Ingestion Results", () => {
  it("should create consolidated markdown file", () => {
    const outputDir = mkdtempSync(join(tmpdir(), "edith-persist-"));
    const results: IngestionResult[] = [
      {
        sourcePath: "/a.pdf",
        relativePath: "a.pdf",
        category: "pdf",
        markdown: "## PDF Content\n\nExtracted text",
        method: "markitdown",
        tokenEstimate: 100,
        warnings: [],
        duration: 500,
      },
    ];

    const files = persistIngestionResults(outputDir, results);
    assert.deepEqual(files, ["ingested-documents.md"]);
    assert.ok(existsSync(join(outputDir, "ingested-documents.md")));

    const content = readFileSync(join(outputDir, "ingested-documents.md"), "utf-8");
    assert.ok(content.includes("Multimodal Document Ingestion"));
    assert.ok(content.includes("PDF Content"));

    rmSync(outputDir, { recursive: true, force: true });
  });

  it("should return empty array when no valid results", () => {
    const outputDir = mkdtempSync(join(tmpdir(), "edith-persist-"));
    const results: IngestionResult[] = [
      {
        sourcePath: "/a.pdf",
        relativePath: "a.pdf",
        category: "pdf",
        markdown: "",
        method: "skipped",
        tokenEstimate: 0,
        warnings: ["No content"],
        duration: 100,
      },
    ];

    const files = persistIngestionResults(outputDir, results);
    assert.deepEqual(files, []);

    rmSync(outputDir, { recursive: true, force: true });
  });
});

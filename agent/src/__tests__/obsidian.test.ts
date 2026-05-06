/**
 * Unit tests for Obsidian Vault integration modules
 *
 * Tests the following modules:
 *   - vault-structure.ts: Vault directory structure generation
 *   - wikilinks.ts: Wikilink cross-reference generation
 *   - frontmatter.ts: YAML frontmatter generation and parsing
 *   - edit-detector.ts: Human edit detection via content hashing
 *
 * Uses Node.js built-in test runner with temporary file fixtures.
 */

import { describe, it, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import {
  mkdirSync,
  writeFileSync,
  rmSync,
  mkdtempSync,
  existsSync,
  readFileSync,
  readdirSync,
} from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";

// ── Modules under test ─────────────────────────────────────────────

import {
  generateVaultStructure,
  createVaultDirectories,
  writeObsidianConfig,
  formatVaultResult,
  type VaultMappingResult,
} from "../tools/vault-structure.js";

import {
  makeWikilink,
  serviceQuickRefPath,
  distillatePath,
  generateWikilinks,
  injectRoutingTableLinks,
  injectQuickRefLinks,
  type WikilinkResult,
} from "../tools/wikilinks.js";

import {
  generateFrontmatter,
  parseFrontmatter,
  createFrontmatter,
  injectFrontmatter,
  markAsHumanEdited,
  type FrontmatterData,
} from "../tools/frontmatter.js";

import {
  calculateContentHash,
  calculateFileHash,
  loadManifest,
  saveManifest,
  buildManifest,
  detectEdits,
  checkHumanEdited,
  formatEditDetectionResult,
  type HashManifest,
} from "../tools/edit-detector.js";

import type { ObsidianConfig } from "../config.js";

// ── Test Fixtures ──────────────────────────────────────────────────

let tempDir: string;
let workspaceRoot: string;
let vaultRoot: string;

const OBSIDIAN_CONFIG: ObsidianConfig = {
  enabled: true,
  vault_path: "./obsidian-vault",
  wikilinks: true,
  graph_view: true,
  frontmatter: true,
  human_edit_detection: true,
};

function setupWorkspace(): void {
  // Create workspace with knowledge artifacts
  // routing-table.md
  writeFileSync(
    join(workspaceRoot, "routing-table.md"),
    [
      "# Service Routing Table",
      "",
      "## Services",
      "",
      "| Service | Role | Stack | Owner | Key Constraints |",
      "|---------|------|-------|-------|-----------------|",
      "| user-service | User management | TypeScript | TeamA | Must validate email |",
      "| order-service | Order processing | Go | TeamB | Max 1000 orders/min |",
      "",
    ].join("\n"),
    "utf-8",
  );

  // user-service
  mkdirSync(join(workspaceRoot, "user-service"), { recursive: true });
  writeFileSync(
    join(workspaceRoot, "user-service", "quick-ref.md"),
    [
      "# user-service Quick-Ref",
      "",
      "## Verify",
      "- Build: `npm run build`",
      "",
      "## Deep Dive",
      "- Overview: `user-service/distillates/01-overview.md`",
      "- API contracts: `user-service/distillates/02-api-contracts.md`",
    ].join("\n"),
    "utf-8",
  );

  mkdirSync(join(workspaceRoot, "user-service", "distillates"), { recursive: true });
  writeFileSync(
    join(workspaceRoot, "user-service", "distillates", "01-overview.md"),
    "# user-service -- Overview\n\nUser management service built with TypeScript.",
    "utf-8",
  );
  writeFileSync(
    join(workspaceRoot, "user-service", "distillates", "02-api-contracts.md"),
    "# user-service -- API Contracts\n\nREST API with JWT authentication.",
    "utf-8",
  );

  // order-service
  mkdirSync(join(workspaceRoot, "order-service"), { recursive: true });
  writeFileSync(
    join(workspaceRoot, "order-service", "quick-ref.md"),
    "# order-service Quick-Ref\n\n## Verify\n- Build: `go build`",
    "utf-8",
  );
  mkdirSync(join(workspaceRoot, "order-service", "distillates"), { recursive: true });
  writeFileSync(
    join(workspaceRoot, "order-service", "distillates", "01-overview.md"),
    "# order-service -- Overview\n\nOrder processing service built with Go.",
    "utf-8",
  );
}

before(() => {
  tempDir = mkdtempSync(join(tmpdir(), "edith-obsidian-test-"));
  workspaceRoot = join(tempDir, "workspace");
  vaultRoot = join(tempDir, "workspace", "obsidian-vault");
  mkdirSync(workspaceRoot, { recursive: true });
  setupWorkspace();
});

after(() => {
  rmSync(tempDir, { recursive: true, force: true });
});

// ── Vault Structure Tests ──────────────────────────────────────────

describe("vault-structure", () => {
  it("should create vault directories", () => {
    const dirs = createVaultDirectories(vaultRoot);
    assert.ok(dirs.length > 0);
    assert.ok(existsSync(join(vaultRoot, "00-routing")));
    assert.ok(existsSync(join(vaultRoot, "01-services")));
    assert.ok(existsSync(join(vaultRoot, "02-distillates")));
    assert.ok(existsSync(join(vaultRoot, "03-decisions")));
    assert.ok(existsSync(join(vaultRoot, "graphify-out")));
    assert.ok(existsSync(join(vaultRoot, ".obsidian")));
  });

  it("should generate .obsidian config files", () => {
    writeObsidianConfig(vaultRoot);
    assert.ok(existsSync(join(vaultRoot, ".obsidian", "app.json")));
    assert.ok(existsSync(join(vaultRoot, ".obsidian", "appearance.json")));

    const appConfig = JSON.parse(
      readFileSync(join(vaultRoot, ".obsidian", "app.json"), "utf-8"),
    );
    assert.strictEqual(appConfig.useMarkdownLinks, false); // Use Wikilinks
  });

  it("should generate full vault structure from workspace", () => {
    // Clean vault for fresh test
    rmSync(vaultRoot, { recursive: true, force: true });

    const result = generateVaultStructure(workspaceRoot, OBSIDIAN_CONFIG);

    assert.strictEqual(result.errors.length, 0, `Errors: ${result.errors.join(", ")}`);
    assert.ok(result.files_written.length >= 5, `Expected at least 5 files, got ${result.files_written.length}`);

    // Verify Layer 0
    assert.ok(existsSync(join(vaultRoot, "00-routing", "routing-table.md")));

    // Verify Layer 1 (service-prefixed filenames)
    assert.ok(existsSync(join(vaultRoot, "01-services", "user-service", "user-service.quick-ref.md")));
    assert.ok(existsSync(join(vaultRoot, "01-services", "order-service", "order-service.quick-ref.md")));

    // Verify Layer 2 (service-prefixed filenames)
    assert.ok(existsSync(join(vaultRoot, "02-distillates", "user-service", "user-service.01-overview.md")));
    assert.ok(existsSync(join(vaultRoot, "02-distillates", "user-service", "user-service.02-api-contracts.md")));
    assert.ok(existsSync(join(vaultRoot, "02-distillates", "order-service", "order-service.01-overview.md")));

    // Verify decisions README
    assert.ok(existsSync(join(vaultRoot, "03-decisions", "README.md")));
  });

  it("should produce a formatted result string", () => {
    const result = generateVaultStructure(workspaceRoot, OBSIDIAN_CONFIG);
    const formatted = formatVaultResult(result);
    assert.ok(formatted.includes("Obsidian Vault"));
    assert.ok(formatted.includes(vaultRoot));
  });
});

// ── Wikilinks Tests ────────────────────────────────────────────────

describe("wikilinks", () => {
  beforeEach(() => {
    // Ensure vault is regenerated fresh for each wikilinks test
    rmSync(vaultRoot, { recursive: true, force: true });
    generateVaultStructure(workspaceRoot, OBSIDIAN_CONFIG);
  });

  it("should generate correct wikilink format", () => {
    assert.strictEqual(makeWikilink("target"), "[[target]]");
    assert.strictEqual(makeWikilink("target", "display"), "[[target|display]]");
  });

  it("should generate correct service paths", () => {
    assert.strictEqual(
      serviceQuickRefPath("user-service"),
      "01-services/user-service/user-service.quick-ref",
    );
    assert.strictEqual(
      distillatePath("user-service", "01-overview.md"),
      "02-distillates/user-service/user-service.01-overview",
    );
  });

  it("should inject links into routing table", () => {
    const result = injectRoutingTableLinks(vaultRoot, [
      "user-service",
      "order-service",
    ]);
    assert.ok(result.modified);
    assert.ok(result.links.length >= 2);

    // Verify routing table content
    const content = readFileSync(
      join(vaultRoot, "00-routing", "routing-table.md"),
      "utf-8",
    );
    assert.ok(content.includes("[[01-services/user-service/user-service.quick-ref"));
    assert.ok(content.includes("[[01-services/order-service/order-service.quick-ref"));
  });

  it("should inject links into quick-ref", () => {
    const result = injectQuickRefLinks(vaultRoot, "user-service", [
      "01-overview.md",
      "02-api-contracts.md",
    ]);
    assert.ok(result.modified);
    assert.ok(result.links.length >= 2);

    const content = readFileSync(
      join(vaultRoot, "01-services", "user-service", "user-service.quick-ref.md"),
      "utf-8",
    );
    assert.ok(
      content.includes("[[02-distillates/user-service/user-service.01-overview") ||
      content.includes("[[02-distillates/user-service/user-service.02-api-contracts"),
    );
  });

  it("should generate full wikilinks across vault", () => {
    const result = generateWikilinks(vaultRoot);
    assert.ok(result.linksGenerated > 0, `Expected links, got ${result.linksGenerated}`);
    assert.ok(result.filesModified.length > 0);
  });
});

// ── Frontmatter Tests ──────────────────────────────────────────────

describe("frontmatter", () => {
  it("should generate valid YAML frontmatter", () => {
    const data = createFrontmatter({
      edith_id: "user-service/01-overview",
      layer: 2,
      token_budget: 6000,
      token_actual: 3000,
      related: ["[[user-service/quick-ref]]"],
    });

    const yaml = generateFrontmatter(data);
    assert.ok(yaml.startsWith("---"));
    assert.ok(yaml.endsWith("---"));
    assert.ok(yaml.includes('edith_id: "user-service/01-overview"'));
    assert.ok(yaml.includes("layer: 2"));
    assert.ok(yaml.includes("token_budget: 6000"));
    assert.ok(yaml.includes("human_edited: false"));
    assert.ok(yaml.includes('"[[user-service/quick-ref]]"'));
  });

  it("should parse frontmatter from markdown content", () => {
    const content = [
      "---",
      'edith_id: "test"',
      "layer: 1",
      "human_edited: true",
      "---",
      "",
      "# Content here",
      "Some body text.",
    ].join("\n");

    const parsed = parseFrontmatter(content);
    assert.strictEqual(parsed.data.edith_id, "test");
    assert.strictEqual(parsed.data.layer, 1);
    assert.strictEqual(parsed.data.human_edited, true);
    assert.ok(parsed.body.includes("# Content here"));
  });

  it("should handle content without frontmatter", () => {
    const content = "# Just content\n\nNo frontmatter here.";
    const parsed = parseFrontmatter(content);
    assert.strictEqual(parsed.data.edith_id, "");
    assert.strictEqual(parsed.data.human_edited, false);
    assert.ok(parsed.body.includes("Just content"));
  });

  it("should parse arrays in frontmatter", () => {
    const content = [
      "---",
      'edith_id: "test"',
      "layer: 2",
      "human_edited: false",
      "related:",
      '  - "[[ref-1]]"',
      '  - "[[ref-2]]"',
      "---",
      "",
      "Body",
    ].join("\n");

    const parsed = parseFrontmatter(content);
    assert.ok(Array.isArray(parsed.data.related));
    assert.strictEqual(parsed.data.related!.length, 2);
    assert.strictEqual(parsed.data.related![0], "[[ref-1]]");
  });

  it("should inject frontmatter into file and preserve human_edited flag", () => {
    const testFile = join(tempDir, "test-inject.md");
    writeFileSync(testFile, "# Existing content\n\nSome text.", "utf-8");

    const fm = createFrontmatter({
      edith_id: "test/inject",
      layer: 1,
    });

    const result = injectFrontmatter(testFile, fm);
    assert.ok(result.written);
    assert.strictEqual(result.preserved_human_edit, false);

    // Read back and verify
    const content = readFileSync(testFile, "utf-8");
    assert.ok(content.startsWith("---"));
    assert.ok(content.includes("edith_id"));
    assert.ok(content.includes("# Existing content"));
  });

  it("should mark file as human-edited", () => {
    const testFile = join(tempDir, "test-mark-edited.md");
    const fm = createFrontmatter({ edith_id: "test/mark", layer: 2 });
    writeFileSync(testFile, generateFrontmatter(fm) + "\n\n# Body", "utf-8");

    const result = markAsHumanEdited(testFile);
    assert.ok(result);

    const parsed = parseFrontmatter(readFileSync(testFile, "utf-8"));
    assert.strictEqual(parsed.data.human_edited, true);
  });
});

// ── Edit Detector Tests ────────────────────────────────────────────

describe("edit-detector", () => {
  beforeEach(() => {
    rmSync(vaultRoot, { recursive: true, force: true });
    generateVaultStructure(workspaceRoot, OBSIDIAN_CONFIG);
  });

  it("should calculate consistent content hash", () => {
    const content = "Hello, World!";
    const hash1 = calculateContentHash(content);
    const hash2 = calculateContentHash(content);
    assert.strictEqual(hash1, hash2);
    assert.strictEqual(hash1.length, 64); // SHA-256 hex length
  });

  it("should detect different content", () => {
    const hash1 = calculateContentHash("Content A");
    const hash2 = calculateContentHash("Content B");
    assert.notStrictEqual(hash1, hash2);
  });

  it("should save and load manifest", () => {
    const manifest: HashManifest = {
      version: 1,
      created_at: new Date().toISOString(),
      files: {
        "test.md": {
          path: "test.md",
          hash: calculateContentHash("test content"),
          recorded_at: new Date().toISOString(),
        },
      },
    };

    saveManifest(vaultRoot, manifest);
    const loaded = loadManifest(vaultRoot);

    assert.strictEqual(loaded.version, 1);
    assert.ok(loaded.files["test.md"]);
    assert.strictEqual(loaded.files["test.md"].hash, manifest.files["test.md"].hash);
  });

  it("should build manifest from vault state", () => {
    const manifest = buildManifest(vaultRoot);
    assert.ok(Object.keys(manifest.files).length > 0);

    // Should include routing table
    const routingKey = Object.keys(manifest.files).find((k) =>
      k.includes("routing-table"),
    );
    assert.ok(routingKey, "Should find routing-table.md in manifest");
  });

  it("should detect edits between manifests", () => {
    // Save initial manifest
    const initialManifest = buildManifest(vaultRoot);
    saveManifest(vaultRoot, initialManifest);

    // Modify a file
    const routingPath = join(vaultRoot, "00-routing", "routing-table.md");
    const originalContent = readFileSync(routingPath, "utf-8");
    writeFileSync(routingPath, originalContent + "\n## Modified", "utf-8");

    // Detect edits
    const result = detectEdits(vaultRoot, initialManifest);
    assert.ok(result.modified.length > 0 || result.human_edited.length > 0);
  });

  it("should detect human-edited files", () => {
    // Create a file with human_edited frontmatter
    const testFile = join(vaultRoot, "01-services", "user-service", "user-service.quick-ref.md");
    const fm = createFrontmatter({ edith_id: "user-service/quick-ref", layer: 1 });
    fm.human_edited = true;
    writeFileSync(
      testFile,
      generateFrontmatter(fm) + "\n\n# Human edited content",
      "utf-8",
    );

    assert.ok(checkHumanEdited(testFile));
  });

  it("should return formatted result string", () => {
    const initialManifest = buildManifest(vaultRoot);
    const result = detectEdits(vaultRoot, initialManifest);
    const formatted = formatEditDetectionResult(result);
    assert.ok(formatted.includes("人工编辑检测"));
  });
});

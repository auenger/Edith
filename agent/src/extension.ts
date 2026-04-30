/**
 * EDITH Extension — Core Routing Layer
 *
 * Registers four EDITH tools (edith_scan, edith_distill, edith_route,
 * edith_query) and context-management commands (/new, /clear, /compact, /context)
 * plus status commands (edith-init, edith-status).
 *
 * Tool handlers are stubs — actual business logic comes from feat-tool-* features.
 */

import type {
  ExtensionAPI,
  ExtensionCommandContext,
  ExtensionContext,
} from "@mariozechner/pi-coding-agent";
import { Type, Static } from "@sinclair/typebox";
import { executeQuery, validateQueryParams } from "./query.js";
import { ConfigError, type EdithConfig } from "./config.js";
import { loadConfig } from "./config.js";
import { getSharedStats } from "./shared-stats.js";

import { executeScan, formatScanSummary, formatScanError } from "./tools/scan.js";
import { executeExplore, formatExploreSummary, formatExploreError } from "./tools/explore.js";
import { executeDistill, formatDistillSummary, formatDistillError } from "./tools/distill.js";
import { executeRoute, formatRouteSummary, formatRouteError } from "./tools/route.js";
import { executeIndex, formatIndexSummary, formatIndexError } from "./tools/index.js";
import { renderContextPanel, type SessionStats, type ContextUsage } from "./theme/context-panel.js";
import { detectColorSupport } from "./theme/color-engine.js";
import {
  SubAgentManager,
  formatSubAgentResult,
  formatParallelResults,
} from "./tools/subagent.js";
import { renderSubAgentPanel } from "./theme/subagent-panel.js";

// ── TypeBox Parameter Schemas ──────────────────────────────────────

const ScanParams = Type.Object({
  target: Type.String({ description: "项目名或路径" }),
  mode: Type.Optional(
    Type.String({ description: "扫描模式: full | quick", enum: ["full", "quick"] })
  ),
  depth: Type.Optional(
    Type.String({ description: "手动指定扫描深度（覆盖自动选择）: quick | deep | exhaustive", enum: ["quick", "deep", "exhaustive"] })
  ),
});

const DistillParams = Type.Object({
  target: Type.String({ description: "服务名（对应 edith.yaml repos 中的 key）" }),
});

const RouteParams = Type.Object({
  requirement: Type.String({ description: "需求描述" }),
  context: Type.Optional(Type.Array(Type.String({ description: "已加载的上下文文件路径" }), { description: "已加载的上下文文件（避免重复建议）" })),
});

const QueryParams = Type.Object({
  question: Type.String({ description: "用户的问题" }),
  services: Type.Optional(Type.Array(Type.String({ description: "限定查询的服务范围" }), { description: "限定查询的服务范围（为空时自动检测）" })),
  max_depth: Type.Optional(Type.Union([Type.Literal(0), Type.Literal(1), Type.Literal(2)], { description: "最大加载深度（0=仅路由表, 1=到quick-ref, 2=到distillates）" })),
});

const ExploreParams = Type.Object({
  target: Type.String({ description: "项目名或路径" }),
});

const IndexParams = Type.Object({
  target: Type.Optional(Type.String({ description: "知识库目录路径（默认自动发现）" })),
  output_path: Type.Optional(Type.String({ description: "索引输出文件路径（默认 {kb-dir}/{company}-knowledge-index.md）" })),
  services: Type.Optional(Type.Array(Type.String({ description: "限定索引的服务列表（为空时包含全部）" }), { description: "限定索引的服务范围" })),
});

type ScanInput = Static<typeof ScanParams>;
type DistillInput = Static<typeof DistillParams>;
type RouteInput = Static<typeof RouteParams>;
type QueryInput = Static<typeof QueryParams>;
type ExploreInput = Static<typeof ExploreParams>;
type IndexInput = Static<typeof IndexParams>;

// ── Skill Routing Map (internal, never exposed to users) ───────────

const SKILL_MAP: Record<string, string> = {
  scan: "document-project",
  distill: "distillator",
  route: "requirement-router",
  index: "knowledge-index",
  // query: loaded via three-layer strategy, no single Skill
};

/**
 * Hidden Skill loader — maps tool names to Skill directories internally.
 * Users never see Skill internal names; they see friendly prompts only.
 */
function loadSkill(toolName: string): { loaded: boolean; skillDir: string; error?: string } {
  const skillDir = SKILL_MAP[toolName];
  if (!skillDir) {
    return { loaded: false, skillDir: "", error: `No skill mapping for tool: ${toolName}` };
  }

  // Phase 1 stub: Skill directory existence check would go here.
  // Actual Skill code execution is implemented by feat-tool-* features.
  console.log(`[EDITH] Loading skill for "${toolName}"...`);
  return { loaded: true, skillDir };
}

// ── Tool Status Tracking ───────────────────────────────────────────

interface ToolStatus {
  name: string;
  registered: boolean;
  error?: string;
}

const toolRegistry: ToolStatus[] = [];

// ── Friendly User Messages (no internal names leaked) ──────────────

const FRIENDLY_ACTION: Record<string, string> = {
  edith_scan: "正在执行知识扫描...",
  edith_explore: "正在探索项目结构...",
  edith_distill: "正在蒸馏知识产物...",
  edith_route: "正在进行需求路由分析...",
  edith_query: "正在查询知识库...",
  edith_index: "正在生成知识索引...",
};

// ── Extension Entry Point ──────────────────────────────────────────

export default function edithExtension(pi: ExtensionAPI): void {

  // ═══ Tool Registration (with graceful degradation) ═════════════

  const tools: Array<{
    name: string;
    label: string;
    description: string;
    parameters: typeof ScanParams | typeof DistillParams | typeof RouteParams | typeof QueryParams | typeof ExploreParams | typeof IndexParams;
    execute: (toolCallId: string, params: any, signal: AbortSignal | undefined, onUpdate: any, ctx: ExtensionContext) => Promise<any>;
  }> = [
    {
      name: "edith_scan",
      label: "EDITH Scan",
      description: "扫描项目代码，逆向生成项目文档。支持全局扫描和模块深入两种模式。",
      parameters: ScanParams,
      execute: async (_toolCallId, params: ScanInput, _signal, _onUpdate, ctx: ExtensionContext) => {
        console.log(FRIENDLY_ACTION["edith_scan"]);
        const skill = loadSkill("scan");
        if (!skill.loaded) {
          return { content: [{ type: "text" as const, text: `[EDITH] 知识扫描暂不可用: ${skill.error}` }], isError: true };
        }

        try {
          // Load config to get repos and workspace settings
          const config = loadConfig();

          const outcome = await executeScan(
            { target: params.target, mode: params.mode as "full" | "quick" | undefined, depth: params.depth as "quick" | "deep" | "exhaustive" | undefined },
            config.repos,
            config.workspace.root,
          );

          if (outcome.ok) {
            const summary = formatScanSummary(outcome.result);
            console.log(`[EDITH] Scan completed: ${outcome.result.service} → ${outcome.result.outputDir}`);
            return {
              content: [{ type: "text" as const, text: summary }],
            };
          } else {
            const errorMsg = formatScanError(outcome.error);
            console.warn(`[EDITH] Scan failed: ${outcome.error.code} - ${outcome.error.message}`);
            return {
              content: [{ type: "text" as const, text: errorMsg }],
              isError: true,
            };
          }
        } catch (err) {
          const message = (err as Error).message ?? String(err);
          console.error(`[EDITH] Scan error: ${message}`);
          return {
            content: [{ type: "text" as const, text: `[EDITH] 扫描执行失败: ${message}` }],
            isError: true,
          };
        }
      },
    },
    {
      name: "edith_explore",
      label: "EDITH Explore",
      description: "快速浏览项目结构、技术栈、关键文件。轻量级概览，不生成文档。",
      parameters: ExploreParams,
      execute: async (_toolCallId, params: ExploreInput, _signal, _onUpdate, _ctx: ExtensionContext) => {
        console.log(FRIENDLY_ACTION["edith_explore"]);

        try {
          const config = loadConfig();

          const outcome = await executeExplore(
            { target: params.target },
            config.repos,
          );

          if (outcome.ok) {
            const summary = formatExploreSummary(outcome.result);
            console.log(`[EDITH] Explore completed: ${outcome.result.service}`);
            return {
              content: [{ type: "text" as const, text: summary }],
            };
          } else {
            const errorMsg = formatExploreError(outcome.error);
            console.warn(`[EDITH] Explore failed: ${outcome.error.code} - ${outcome.error.message}`);
            return {
              content: [{ type: "text" as const, text: errorMsg }],
              isError: true,
            };
          }
        } catch (err) {
          const message = (err as Error).message ?? String(err);
          console.error(`[EDITH] Explore error: ${message}`);
          return {
            content: [{ type: "text" as const, text: `[EDITH] 探索执行失败: ${message}` }],
            isError: true,
          };
        }
      },
    },
    {
      name: "edith_distill",
      label: "EDITH Distill",
      description: "蒸馏文档，生成三层知识产物（routing-table / quick-ref / distillates）。",
      parameters: DistillParams,
      execute: async (_toolCallId, params: DistillInput, _signal, _onUpdate, _ctx: ExtensionContext) => {
        console.log(FRIENDLY_ACTION["edith_distill"]);
        const skill = loadSkill("distill");
        if (!skill.loaded) {
          return { content: [{ type: "text" as const, text: `[EDITH] 知识蒸馏暂不可用: ${skill.error}` }], isError: true };
        }

        try {
          const config = loadConfig();

          const outcome = executeDistill(
            { target: params.target },
            config,
            config.repos,
          );

          if (outcome.ok) {
            const summary = formatDistillSummary(outcome.result);
            console.log(`[EDITH] Distill completed: ${outcome.result.service} → ${outcome.result.layers.layer0.file}`);
            return {
              content: [{ type: "text" as const, text: summary }],
            };
          } else {
            const errorMsg = formatDistillError(outcome.error);
            console.warn(`[EDITH] Distill failed: ${outcome.error.code} - ${outcome.error.message}`);
            return {
              content: [{ type: "text" as const, text: errorMsg }],
              isError: true,
            };
          }
        } catch (err) {
          const message = (err as Error).message ?? String(err);
          console.error(`[EDITH] Distill error: ${message}`);
          return {
            content: [{ type: "text" as const, text: `[EDITH] 蒸馏执行失败: ${message}` }],
            isError: true,
          };
        }
      },
    },
    {
      name: "edith_route",
      label: "EDITH Route",
      description: "需求路由分析，判断是否需要加载上下文及加载策略。",
      parameters: RouteParams,
      execute: async (_toolCallId, params: RouteInput, _signal, _onUpdate, _ctx: ExtensionContext) => {
        console.log(FRIENDLY_ACTION["edith_route"]);
        const skill = loadSkill("route");
        if (!skill.loaded) {
          return { content: [{ type: "text" as const, text: `[EDITH] 需求路由暂不可用: ${skill.error}` }], isError: true };
        }

        try {
          const config = loadConfig();

          const outcome = executeRoute(
            {
              requirement: params.requirement,
              context: params.context,
            },
            config.workspace.root,
          );

          if (outcome.ok) {
            const summary = formatRouteSummary(outcome.result);
            console.log(`[EDITH] Route decision: ${outcome.result.decision} for services: ${outcome.result.services.join(", ")}`);
            return {
              content: [{ type: "text" as const, text: summary }],
            };
          } else {
            const errorMsg = formatRouteError(outcome.error);
            console.warn(`[EDITH] Route failed: ${outcome.error.code} - ${outcome.error.message}`);
            return {
              content: [{ type: "text" as const, text: errorMsg }],
              isError: true,
            };
          }
        } catch (err) {
          const message = (err as Error).message ?? String(err);
          console.error(`[EDITH] Route error: ${message}`);
          return {
            content: [{ type: "text" as const, text: `[EDITH] 路由分析失败: ${message}` }],
            isError: true,
          };
        }
      },
    },
    {
      name: "edith_query",
      label: "EDITH Query",
      description:
        "查询 EDITH 知识库，实现三层渐进加载策略。" +
        " Layer 0 routing-table 常驻，Layer 1 quick-ref 按需，Layer 2 distillates 精准定位。",
      parameters: QueryParams,
      execute: async (_toolCallId, params: QueryInput, _signal, _onUpdate, ctx: ExtensionContext) => {
        console.log(FRIENDLY_ACTION["edith_query"]);

        // Validate parameters
        const validationError = validateQueryParams(params);
        if (validationError) {
          return {
            content: [{ type: "text" as const, text: `[EDITH] 参数错误: ${validationError}` }],
            isError: true,
          };
        }

        // Load config to get workspace root and token budgets
        let config: EdithConfig;
        try {
          config = loadConfig();
        } catch (err) {
          const msg = err instanceof ConfigError ? err.message : (err as Error).message;
          return {
            content: [{ type: "text" as const, text: `[EDITH] 配置加载失败: ${msg}` }],
            isError: true,
          };
        }

        // Execute three-layer query
        try {
          const result = executeQuery(
            {
              question: params.question,
              services: params.services,
              max_depth: params.max_depth,
            },
            config
          );

          // Format the output
          const outputParts: string[] = [];
          outputParts.push(result.answer);
          outputParts.push("");
          outputParts.push("---");
          outputParts.push("**查询元数据**:");
          outputParts.push(`- 加载层级: ${result.layersLoaded.join(", ")}`);
          outputParts.push(`- 查询服务: ${result.servicesQueried.join(", ") || "无"}`);
          outputParts.push(`- Token 消耗: ${result.tokensConsumed}`);

          if (result.sources.length > 0) {
            outputParts.push("- 来源:");
            for (const src of result.sources) {
              const sectionInfo = src.section ? ` § ${src.section}` : "";
              outputParts.push(
                `  - Layer ${src.layer}: ${src.file}${sectionInfo} (相关度: ${src.relevance})`
              );
            }
          }

          if (result.warnings.length > 0) {
            outputParts.push("- 警告:");
            for (const w of result.warnings) {
              outputParts.push(`  - [${w.code}] ${w.message}`);
            }
          }

          return {
            content: [{ type: "text" as const, text: outputParts.join("\n") }],
            isError: !!result.error,
          };
        } catch (err) {
          return {
            content: [
              {
                type: "text" as const,
                text: `[EDITH] 查询执行失败: ${(err as Error).message}`,
              },
            ],
            isError: true,
          };
        }
      },
    },
    {
      name: "edith_index",
      label: "EDITH Index",
      description:
        "将蒸馏知识库（routing-table + quick-ref + distillates）生成标准化 Markdown 索引。" +
        " 索引文件可被外部 Agent（Claude Code 等）直接加载，获得项目知识。",
      parameters: IndexParams,
      execute: async (_toolCallId, params: IndexInput, _signal, _onUpdate, _ctx: ExtensionContext) => {
        console.log(FRIENDLY_ACTION["edith_index"]);
        const skill = loadSkill("index");
        if (!skill.loaded) {
          return { content: [{ type: "text" as const, text: `[EDITH] 知识索引暂不可用: ${skill.error}` }], isError: true };
        }

        try {
          const config = loadConfig();

          const outcome = executeIndex(
            {
              target: params.target,
              output_path: params.output_path,
              services: params.services,
            },
            config.workspace.root,
          );

          if (outcome.ok) {
            const summary = formatIndexSummary(outcome.result);
            console.log(`[EDITH] Index completed: ${outcome.result.services_count} services → ${outcome.result.output_path}`);
            return {
              content: [{ type: "text" as const, text: summary }],
            };
          } else {
            const errorMsg = formatIndexError(outcome.error);
            console.warn(`[EDITH] Index failed: ${outcome.error.code} - ${outcome.error.message}`);
            return {
              content: [{ type: "text" as const, text: errorMsg }],
              isError: true,
            };
          }
        } catch (err) {
          const message = (err as Error).message ?? String(err);
          console.error(`[EDITH] Index error: ${message}`);
          return {
            content: [{ type: "text" as const, text: `[EDITH] 索引生成失败: ${message}` }],
            isError: true,
          };
        }
      },
    },
  ];

  for (const tool of tools) {
    try {
      pi.registerTool({
        name: tool.name,
        label: tool.label,
        description: tool.description,
        parameters: tool.parameters,
        execute: tool.execute,
      });
      toolRegistry.push({ name: tool.name, registered: true });
    } catch (err) {
      const errorMsg = (err as Error).message ?? String(err);
      toolRegistry.push({ name: tool.name, registered: false, error: errorMsg });
      console.error(`[EDITH] Failed to register tool "${tool.name}": ${errorMsg}`);
    }
  }

  // ═══ Event Hooks — Audit Logging ═══════════════════════════════

  pi.on("tool_execution_start", (event, _ctx) => {
    if (event.toolName.startsWith("edith_")) {
      const timestamp = new Date().toISOString();
      const paramSummary = JSON.stringify(event.args).slice(0, 200);
      // Audit log — never expose Skill internal names
      console.log(`[EDITH AUDIT] tool=${event.toolName} time=${timestamp} params=${paramSummary}`);
    }
  });

  // ═══ Command Registration ═══════════════════════════════════════

  // --- edith-init (stub) ---
  try {
    pi.registerCommand("edith-init", {
      description: "初始化 EDITH 工作区",
      handler: async (_args: string, _ctx: ExtensionCommandContext) => {
        console.log("EDITH initialization wizard (not implemented yet)");
        // Return stub message
      },
    });

  } catch (err) {
    console.error(`[EDITH] Failed to register command "edith-init": ${(err as Error).message}`);
  }

  // --- edith-status ---
  try {
    pi.registerCommand("edith-status", {
      description: "知识库状态总览",
      handler: async (_args: string, ctx: ExtensionCommandContext) => {
        const lines: string[] = [];

        lines.push("═══ EDITH Status ═══");
        lines.push("");

        // Tool status
        const registered = toolRegistry.filter((t) => t.registered);
        const unavailable = toolRegistry.filter((t) => !t.registered);
        lines.push(`Tools: ${registered.length} available, ${unavailable.length} unavailable`);
        for (const tool of toolRegistry) {
          const status = tool.registered ? "available" : `unavailable (${tool.error ?? "unknown"})`;
          lines.push(`  - ${tool.name}: ${status}`);
        }

        // Workspace info
        lines.push("");
        lines.push(`Workspace: ${ctx.cwd}`);

        // Config status — attempt to read system prompt as proxy for config load
        try {
          const systemPrompt = ctx.getSystemPrompt();
          const configLoaded = systemPrompt.length > 0;
          lines.push(`Config: ${configLoaded ? "loaded" : "not loaded"}`);
        } catch {
          lines.push("Config: unknown");
        }

        // Context usage
        lines.push("");
        const usage = ctx.getContextUsage();
        if (usage) {
          const percent = usage.percent !== null ? `${usage.percent.toFixed(1)}%` : "N/A";
          const tokens = usage.tokens !== null ? `${usage.tokens}` : "N/A";
          lines.push(`Context: ${tokens} tokens (${percent} of ${usage.contextWindow})`);
        } else {
          lines.push("Context: N/A");
        }

        lines.push("");
        lines.push("═════════════════════");

        console.log(lines.join("\n"));
      },
    });

  } catch (err) {
    console.error(`[EDITH] Failed to register command "edith-status": ${(err as Error).message}`);
  }

  // --- /new — New Session ---
  try {
    pi.registerCommand("new", {
      description: "开始新会话（清除当前上下文）",
      handler: async (_args: string, ctx: ExtensionCommandContext) => {
        // Confirmation prompt
        const confirmed = ctx.hasUI
          ? await ctx.ui.confirm(
              "New Session",
              "This will discard current context. Continue?"
            )
          : true;

        if (!confirmed) {
          console.log("[EDITH] /new cancelled.");
          return;
        }

        try {
          const result = await ctx.newSession();
          if (result.cancelled) {
            console.log("[EDITH] New session was cancelled.");
          } else {
            console.log("[EDITH] New session created. Old session preserved.");
          }
        } catch (err) {
          console.error(`[EDITH] Failed to create new session: ${(err as Error).message}`);
        }
      },
    });

  } catch (err) {
    console.error(`[EDITH] Failed to register command "new": ${(err as Error).message}`);
  }

  // --- /clear — Clear Context ---
  try {
    pi.registerCommand("clear", {
      description: "清除当前上下文（保留 system prompt）",
      handler: async (_args: string, ctx: ExtensionCommandContext) => {
        // Confirmation prompt
        const confirmed = ctx.hasUI
          ? await ctx.ui.confirm(
              "Clear Context",
              "This will discard current context. Continue?"
            )
          : true;

        if (!confirmed) {
          console.log("[EDITH] /clear cancelled.");
          return;
        }

        try {
          // Use compact with empty instructions as a clear strategy.
          // This triggers the pi SDK's built-in compaction which preserves
          // system prompt but compresses history. For a true "clear",
          // we create a new session and switch to it.
          await ctx.newSession({
            withSession: async (newCtx) => {
              // The new session is empty — equivalent to clearing context
              await newCtx.sendUserMessage("Context cleared. Ready for new conversation.", {
                deliverAs: "steer",
              });
            },
          });
          console.log("[EDITH] Context cleared.");
        } catch (err) {
          console.error(`[EDITH] Failed to clear context: ${(err as Error).message}`);
        }
      },
    });

  } catch (err) {
    console.error(`[EDITH] Failed to register command "clear": ${(err as Error).message}`);
  }

  // --- /compact — Compact Context ---
  try {
    pi.registerCommand("compact", {
      description: "压缩上下文（摘要历史，保留最近几轮对话）",
      handler: async (_args: string, ctx: ExtensionCommandContext) => {
        try {
          const usageBefore = ctx.getContextUsage();
          const tokensBefore = usageBefore?.tokens;

          // Trigger the pi SDK's built-in compaction
          ctx.compact({
            customInstructions: "保留最近 3 轮原始对话，将其余历史压缩为摘要。",
            onComplete: (result) => {
              const usageAfter = ctx.getContextUsage();
              const tokensAfter = usageAfter?.tokens;

              console.log(
                `[EDITH] Compacted: ${result.tokensBefore} → ${tokensAfter ?? "?"} tokens. ` +
                `Summary generated for messages before ${result.firstKeptEntryId}.`
              );
            },
            onError: (error) => {
              console.error(`[EDITH] Compaction failed: ${error.message}`);
            },
          });
        } catch (err) {
          console.error(`[EDITH] Failed to compact context: ${(err as Error).message}`);
        }
      },
    });

  } catch (err) {
    console.error(`[EDITH] Failed to register command "compact": ${(err as Error).message}`);
  }

  // --- /context — Context Usage Panel ---
  try {
    pi.registerCommand("context", {
      description: "显示当前 session 的上下文占用和统计信息",
      handler: async (_args: string, ctx: ExtensionCommandContext) => {
        const support = detectColorSupport();

        // Context usage: try SDK API first, fall back to shared state
        let usage: ContextUsage | undefined;
        try {
          usage = ctx.getContextUsage() as ContextUsage;
        } catch {
          // getContextUsage may not be available in all contexts
        }

        // Session stats: read from shared state (populated by TUI layer)
        const shared = getSharedStats();
        const stats = shared.stats;
        if (!usage) usage = shared.usage ?? undefined;

        if (!stats && !usage) {
          console.log("[EDITH] Context information not available yet.");
          return;
        }

        console.log(renderContextPanel(stats, usage, support));
      },
    });

  } catch (err) {
    console.error(`[EDITH] Failed to register command "context": ${(err as Error).message}`);
  }

  // --- /delegate — SubAgent Task Delegation ---
  const subAgentManager = new SubAgentManager();
  try {
    pi.registerCommand("delegate", {
      description: "委派任务给子代理执行（支持 --parallel 和 --chain 模式）",
      handler: async (args: string, _ctx: ExtensionCommandContext) => {
        if (!args.trim()) {
          console.log(
            "[EDITH] /delegate 用法:\n" +
            "  /delegate <任务描述>                      — 单任务委派\n" +
            '  /delegate --parallel "任务1" "任务2"     — 并行委派\n' +
            '  /delegate --chain "任务1" "任务2"        — 串行链式委派'
          );
          return;
        }

        const parsed = subAgentManager.parseCommand(args);
        const support = detectColorSupport();

        console.log(renderSubAgentPanel("starting", parsed.configs.length, parsed.mode, support));

        try {
          let output: string;

          switch (parsed.mode) {
            case "single": {
              const result = await subAgentManager.execute(parsed.configs[0]);
              output = formatSubAgentResult(result);
              break;
            }
            case "parallel": {
              const results = await subAgentManager.parallel(
                parsed.configs,
                (completed: number, total: number) => {
                  console.log(renderSubAgentPanel("starting", total, "parallel", support).replace("Dispatching", `Running ${completed}/${total}`));
                },
              );
              output = formatParallelResults(results);
              break;
            }
            case "chain": {
              const results = await subAgentManager.chain(parsed.configs);
              const chainOutput = results
                .map((r, i) => `[Step ${i + 1}]\n${formatSubAgentResult(r)}`)
                .join("\n\n");
              output = `Chain execution (${results.length}/${parsed.configs.length} steps completed)\n\n${chainOutput}`;
              break;
            }
          }

          console.log(renderSubAgentPanel("completed", parsed.configs.length, parsed.mode, support));
          console.log(output);
        } catch (err) {
          console.log(renderSubAgentPanel("failed", parsed.configs.length, parsed.mode, support));
          console.error(`[EDITH] SubAgent execution failed: ${(err as Error).message}`);
        }
      },
    });

  } catch (err) {
    console.error(`[EDITH] Failed to register command "delegate": ${(err as Error).message}`);
  }

  // --- /explore — Project Exploration ---
  try {
    pi.registerCommand("explore", {
      description: "快速浏览项目结构、技术栈、关键文件",
      handler: async (args: string, _ctx: ExtensionCommandContext) => {
        const target = args.trim();
        if (!target) {
          console.log(
            "[EDITH] /explore 用法:\n" +
            "  /explore <项目名或路径>  — 快速浏览项目概览\n" +
            "  示例: /explore user-service\n" +
            "        /explore /path/to/project"
          );
          return;
        }

        try {
          const config = loadConfig();
          const outcome = await executeExplore({ target }, config.repos);

          if (outcome.ok) {
            console.log(formatExploreSummary(outcome.result));
          } else {
            console.log(formatExploreError(outcome.error));
          }
        } catch (err) {
          console.error(`[EDITH] Explore failed: ${(err as Error).message}`);
        }
      },
    });

  } catch (err) {
    console.error(`[EDITH] Failed to register command "explore": ${(err as Error).message}`);
  }

  // ═══ Input Event — Unknown Command Friendly Prompt ═════════════

  pi.on("input", (event, _ctx) => {
    // Detect unknown slash commands that start with "/" but are not built-in
    const text = event.text.trim();
    if (text.startsWith("/") && text.length > 1) {
      const cmd = text.split(/\s/)[0];
      const knownCommands = ["/new", "/clear", "/compact", "/context", "/delegate", "/explore", "/help", "/reload"];
      if (!knownCommands.includes(cmd)) {
        console.log(
          `[EDITH] Unknown command: ${cmd}\n` +
          `  Available EDITH commands: /new, /clear, /compact, /context, /delegate, /explore\n` +
          `  Use /help to see all commands.`
        );
        // Return "handled" to prevent further processing
        return { action: "handled" as const };
      }
    }
    return { action: "continue" as const };
  });

  // ═══ Startup Complete ═══════════════════════════════════════════

  const registeredCount = toolRegistry.filter((t) => t.registered).length;
  const totalCount = toolRegistry.length;
}

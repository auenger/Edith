/**
 * EDITH Context Monitor — Token tracking, trend analysis, and pressure detection.
 *
 * Collects session stats and context usage after each API call,
 * maintains a sliding window of recent rounds, and provides
 * derived metrics: cache hit rate, remaining rounds estimate,
 * and pressure level.
 */

// ── Types ──────────────────────────────────────────────────────────

export interface TokenSnapshot {
  input: number;
  output: number;
  cacheRead: number;
  cacheWrite: number;
  total: number;
}

export interface ContextSnapshot {
  tokens: number;
  contextWindow: number;
  percent: number;
}

export interface RoundData {
  roundIndex: number;
  timestamp: number;
  tokens: TokenSnapshot;
  context: ContextSnapshot;
}

export type PressureLevel = "normal" | "warning" | "critical" | "emergency";

export interface PressureState {
  level: PressureLevel;
  percent: number;
  remainingRounds: string;
  message: string;
}

export interface MonitorThresholds {
  warning: number;   // default 70
  critical: number;  // default 85
  emergency: number; // default 95
}

// ── Model → Context Window Fallback Table ──────────────────────────

const MODEL_CONTEXT_WINDOWS: Record<string, number> = {
  "deepseek-v4": 1_000_000,
  "deepseek-v4-pro": 1_000_000,
  "deepseek-v3": 128_000,
  "deepseek-chat": 128_000,
  "claude-sonnet-4-6": 200_000,
  "claude-opus-4-7": 200_000,
  "claude-3.5-sonnet": 200_000,
  "claude-3-opus": 200_000,
  "gpt-4o": 128_000,
  "gpt-4-turbo": 128_000,
  "gpt-4": 8_192,
  "gpt-3.5-turbo": 16_385,
  "llama3": 8_192,
  "mistral": 32_000,
  "qwen2": 128_000,
  "mimo-v2.5-pro": 131_072,
  "mimo-v2.5": 131_072,
  "mimo-v2-pro": 131_072,
  "minimax-m2.7": 1_000_000,
  "minimax-m1": 1_000_000,
  "glm-5.1": 128_000,
  "glm-4-plus": 128_000,
  "glm-4": 128_000,
};

// ── Number Formatting ──────────────────────────────────────────────

export function formatTokenCount(n: number): string {
  if (n < 1000) return String(n);
  if (n < 1_000_000) return `${(n / 1000).toFixed(1)}K`;
  return `${(n / 1_000_000).toFixed(1)}M`;
}

// ── Context Monitor ────────────────────────────────────────────────

const SLIDING_WINDOW_SIZE = 10;

export class ContextMonitor {
  private rounds: RoundData[] = [];
  private roundCounter = 0;
  private contextWindowOverride: number | null = null;
  private modelHint: string;
  private thresholds: MonitorThresholds;

  constructor(opts?: {
    contextWindowOverride?: number;
    modelHint?: string;
    thresholds?: Partial<MonitorThresholds>;
  }) {
    this.contextWindowOverride = opts?.contextWindowOverride ?? null;
    this.modelHint = opts?.modelHint ?? "";
    this.thresholds = {
      warning: opts?.thresholds?.warning ?? 70,
      critical: opts?.thresholds?.critical ?? 85,
      emergency: opts?.thresholds?.emergency ?? 95,
    };
  }

  /** Record a new round of stats. Call after each API response. */
  record(tokens: TokenSnapshot, context: ContextSnapshot): RoundData {
    this.roundCounter++;
    const effectiveContext = {
      ...context,
      contextWindow: this.resolveContextWindow(context.contextWindow),
      percent: context.tokens / this.resolveContextWindow(context.contextWindow),
    };

    const round: RoundData = {
      roundIndex: this.roundCounter,
      timestamp: Date.now(),
      tokens,
      context: effectiveContext,
    };

    this.rounds.push(round);
    if (this.rounds.length > SLIDING_WINDOW_SIZE) {
      this.rounds.shift();
    }

    return round;
  }

  /** Resolve context window: override > API value > model lookup > fallback 128K */
  private resolveContextWindow(apiValue: number): number {
    if (this.contextWindowOverride) return this.contextWindowOverride;
    if (apiValue && apiValue > 0) return apiValue;

    const hint = this.modelHint.toLowerCase();
    for (const [key, value] of Object.entries(MODEL_CONTEXT_WINDOWS)) {
      if (hint.includes(key)) return value;
    }
    return 128_000;
  }

  /** Get the latest round data, or null if no data yet. */
  get latest(): RoundData | null {
    return this.rounds.length > 0 ? this.rounds[this.rounds.length - 1] : null;
  }

  /** Cache hit rate = cacheRead / (cacheRead + cacheWrite + input), or 0. */
  get cacheHitRate(): number {
    const snap = this.latest?.tokens;
    if (!snap) return 0;
    const total = snap.cacheRead + snap.cacheWrite + snap.input;
    if (total === 0) return 0;
    return snap.cacheRead / total;
  }

  /** Average token consumption per round in the sliding window. */
  get avgTokensPerRound(): number {
    if (this.rounds.length < 2) return 0;
    const first = this.rounds[0];
    const last = this.rounds[this.rounds.length - 1];
    const totalDelta = last.context.tokens - first.context.tokens;
    return totalDelta / (this.rounds.length - 1);
  }

  /** Estimate remaining rounds before hitting the emergency threshold. */
  get remainingRounds(): string {
    const latest = this.latest;
    if (!latest) return "N/A";
    const avg = this.avgTokensPerRound;
    if (avg <= 0) return "∞";

    const emergencyTokens = latest.context.contextWindow * (this.thresholds.emergency / 100);
    const remaining = Math.floor((emergencyTokens - latest.context.tokens) / avg);

    if (remaining <= 0) return "0";
    if (remaining <= 5) return `≈ ${remaining}`;
    return `≈ ${remaining}-${remaining + 3}`;
  }

  /** Current pressure state based on thresholds. */
  get pressure(): PressureState {
    const latest = this.latest;
    if (!latest) {
      return { level: "normal", percent: 0, remainingRounds: "N/A", message: "" };
    }

    const pct = latest.context.percent * 100;
    const remaining = this.remainingRounds;
    let level: PressureLevel;
    let message: string;

    if (pct >= this.thresholds.emergency) {
      level = "emergency";
      message = `Context ${pct.toFixed(0)}% — 即将自动 compact，关键信息可能丢失`;
    } else if (pct >= this.thresholds.critical) {
      level = "critical";
      message = `⚠ Context ${pct.toFixed(0)}% used — 建议立即 compact 或 /new`;
    } else if (pct >= this.thresholds.warning) {
      level = "warning";
      message = `⚠ Context ${pct.toFixed(0)}% used — 建议适时 compact`;
    } else {
      level = "normal";
      message = "";
    }

    return { level, percent: pct, remainingRounds: remaining, message };
  }

  /** Get all rounds in the sliding window. */
  get history(): readonly RoundData[] {
    return this.rounds;
  }

  /** Total rounds recorded (not just sliding window). */
  get totalRounds(): number {
    return this.roundCounter;
  }

  /** Reset all tracking state. */
  reset(): void {
    this.rounds = [];
    this.roundCounter = 0;
  }
}

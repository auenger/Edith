/**
 * JARVIS Extension Skeleton
 *
 * This is the minimal Extension that registers with the pi SDK.
 * Tool registration and event hooks will be added by feat-extension-core.
 *
 * Extension pattern:
 *   export default function(pi: ExtensionAPI) { ... }
 */

import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";

export default function jarvisExtension(_pi: ExtensionAPI): void {
  console.log("[JARVIS] Extension loaded successfully.");
  console.log("[JARVIS] Tools will be registered by subsequent features.");
}

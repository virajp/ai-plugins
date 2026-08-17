/**
 * The target vocabulary, previously `TargetId` in the retired `@ai-plugins/schema`
 * package. It survives the template layer only because the non-Claude install
 * paths have not been removed yet — they go with `--platform` when the CLI
 * narrows to the Claude statusline and graphify wiring, and this file goes with
 * them.
 */
export type TargetId = "claude" | "opencode" | "cursor" | "ohmypi";

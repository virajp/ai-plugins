# The Materializer

Read this only on a **first pin** — a slug with no
`.claude/stackgen/templates/` entry yet. It is the one code path that writes
to a repo, and every write it makes is consent-gated and committed once.

## Inputs

- The resolved composition — one source per component: a pack directory
  (`${CLAUDE_PLUGIN_ROOT}/stacks/<type>/<slug>/`), or the generator's
  output for that component (an in-memory pack in the same shape —
  `pack.yaml` fields including the classification, conventions prose,
  artifacts).
- The target repo root — the current repo by default; in a multi-repo
  product the caller may have named a member repo instead.

## Steps

1. **Assemble the landing set** — the whole composition lands as one set,
   structured by the bundle's kind
   (`${CLAUDE_PLUGIN_ROOT}/assets/kinds.md`), each component contributing
   the slice its type owns (`${CLAUDE_PLUGIN_ROOT}/assets/taxonomy.md`),
   closed to the output vocabulary
   (`${CLAUDE_PLUGIN_ROOT}/assets/output-tree.md`):

   - `.claude/stackgen/templates/<slug>.md` — **one entry for the bundle**:
     the payload fields (including `kind`, the `components:` refs and
     per-language `facts`) as frontmatter, the components' conventions
     prose as body.
   - `.claude/stackgen/citations/<component-slug>.yaml` — per component:
     the research sources with URLs and fetch dates (generation; a pack
     lists its provenance here).
   - `.claude/skills/<name>/…`, `.claude/agents/<name>.md`,
     `.claude/rules/<name>.md` — copied verbatim from each component's
     source.
   - `.claude/hooks/<name>.sh` — **pack-sourced scripts only**; generation
     never emits an executable.
   - The lockfile update — every path above, with its component ref,
     source and content hash. The per-component record is what lets sync
     act on one component alone.

   **Never in the set**: CLAUDE.md — that one is vwf's, out of scope
   outright.

   **`.mcp.json` is not in the set either, but for a different reason**: it
   is a **tier-2** target (`${CLAUDE_PLUGIN_ROOT}/assets/output-tree.md`),
   so a component's `mcp_servers:` entries are presented at their own
   consent line in step 3 rather than landing with the files.

   **LSP configuration is not in the set, for a third reason**: it cannot
   go in a repo at all — a language server is a plugin-manifest feature no
   project file can express. A component's `languages[].facts.lsp` still
   travels in the payload for `/vwf:doctor` to read, and what actually
   provides the server is the **generated local plugin**, a tier-3 target
   outside the repo, handled at its own consent line in step 3b.

2. **Collision check, against the lockfile.** Any target path that exists
   but is **not** in `.claude/stackgen/lock.yaml` is the repo's own — a
   conflict listed for the user to resolve, never a write. Anything not in
   the lockfile is not stackgen's to touch.

3. **The dry-run consent gate.** Present the full landing set as a plan —
   every path, created or conflicting, and (for generation) the reviewer's
   clean verdict — and ask before writing anything. The user may deselect
   artifacts; the template entry itself is not deselectable (it is what the
   pin means). Declined → nothing is written, the pin stays unresolved, and
   the caller is told so.

   **Hook wiring is its own consent line.** A hook script is a file (the
   list above); the `hooks` entry that wires it lives in
   `.claude/settings.json`, and **settings.json is never modified without
   the user's explicit consent** — present the exact entries as a separate,
   individually skippable item. Declined wiring leaves the script landed
   but inert, and the plan says so. A consented edit **merges** into
   settings.json (never rewrites it) and records the added keys under the
   lockfile's `settings_keys`.

   The entries come from the pack's `hooks/hooks.yaml`
   (`${CLAUDE_PLUGIN_ROOT}/assets/pack-format.md`), whose top-level
   `hooks:` map is **settings.json's own hook shape written as YAML** —
   event name → a list of matcher groups, each with its `matcher` and its
   `hooks:` list of `{type, command, …}` entries. Merge it **event by
   event, appending matcher groups**; never replace an event's list, and
   never merge two groups because their matchers match. Record each
   appended group under `settings_keys` as `hooks.<Event>[<matcher>]`, so
   sync and removal can find exactly the group stackgen added and leave
   the user's own groups on the same event alone.

   One spelling in a landed `command` is load-bearing: a script path is
   written **`${CLAUDE_PROJECT_DIR}/.claude/hooks/<name>.sh`**, never
   relative. A relative path resolves against whatever the hook's working
   directory happens to be, and a hook that cannot find its script fails
   the way every hook fault fails — quietly.

   **MCP wiring is its own consent line too**, on the same terms. A
   component that needs a server declares it as `mcp_servers:` in its
   `pack.yaml` (`${CLAUDE_PLUGIN_ROOT}/assets/pack-format.md`) — the
   `design-tool` packs are the case that needs it — and those entries are
   written into the **project's `.mcp.json`**, never a plugin manifest.
   Present the exact server keys as a separate, individually skippable
   item. A consented edit **merges, never owns**: only the keys stackgen
   added are written, and they are recorded under the lockfile's
   `mcp_servers` so sync and removal touch nothing else. Declined leaves
   the component's skills landed and says the tool will be unreachable —
   never a silent partial landing.

4. **The local plugin — its own gate, and a larger one.** A component that
   declares an `lsp_servers:` entry, or a `user_mcp_servers:` one, is
   served by the generated local plugin at
   `~/.claude/plugins/local/stackgen-lsp/`
   (`${CLAUDE_PLUGIN_ROOT}/assets/output-tree.md` — the fixed path, the
   manifest shape, the lockfile key). **The procedure is
   [the local plugin](local-plugin.md)**: the merge classification, the
   two file shapes, the already-registered detection, the version bump a
   re-read depends on, and removal by subtraction. This writes **outside
   the repo** and
   registers with a **user-scoped** tool, so it is gated apart from
   everything above and as **two** separately declinable items:

   - **The manifest write.** Show the exact `lspServers` and `mcpServers`
     keys being added and whether each is new or already present from
     another repo. It **merges, never owns** — existing keys the lockfile
     does not claim are left untouched, and a key another repo already
     contributed is reported, not rewritten.
   - **The registration.** Print the two commands and ask; **never run
     them unprompted**:

     ```sh
     claude plugin marketplace add ~/.claude/plugins/local/stackgen-lsp --scope user
     claude plugin install stackgen-lsp@stackgen-lsp --scope user
     ```

     Skip both when the plugin is already registered — say so instead.

   Declining either leaves everything else landed. A declined manifest write
   means the language server is simply absent, and the plan says so; a
   declined registration leaves a valid directory nobody installed, and
   reprints the two commands for later. Record the outcome under the
   lockfile's `local_plugin` block, `registered:` following the answer.

   **Say plainly that this is the developer's machine, not the repo.**
   Collaborators pulling the commit get none of it.

5. **Write and commit.** On approval: write the set, update the lockfile,
   then commit as **one commit** via the repo's git workflow (the vwf
   git-workflow skill when present; plain `git add <paths>` + a conventional
   commit otherwise — never `git add -A`). The commit is what makes the
   output repo-owned: collaborators pull files, not a plugin obligation.

   The local plugin is written and registered here too, but it is **outside
   the repo and outside the commit** — only its `local_plugin` lockfile
   block is committed, which is what makes removal able to find it.

6. **Return, and point forward.** Re-read the freshly written
   `.claude/stackgen/templates/<slug>.md` and return the payload from it —
   the same read every later fetch performs. Then recommend **`/vwf:setup`**
   as the next step: the repo's CLAUDE.md and workspace wiring are vwf's
   domain, and stackgen never edits them.

## Rules

- **Copy, never reference in place.** The repo owns its copies; the pack
  evolving does not change a repo until `/stackgen:stackgen-sync` shows the
  diff and the user takes it.
- **The lockfile is the ownership boundary** — sync diffs against it, and
  paths outside it are invisible to every stackgen write path.
- **Three targets, and nothing else.** Inside the repo, nothing lands
  outside `.claude/` except `.mcp.json` — the one project file stackgen may
  reach, and only behind its own tier-2 consent line — and inside `.claude/`
  nothing lands outside the output vocabulary. Outside the repo, the **only**
  path stackgen may write is
  `~/.claude/plugins/local/stackgen-lsp/.claude-plugin/`, behind the tier-3
  gate. **LSP server configuration never lands in the repo** whatever the
  source ships; it goes to the local plugin, and the need still travels as
  `language_facts` in the payload for `/vwf:doctor` to read.
- **The local plugin is the machine's, not the repo's.** It is user-scoped
  and uncommitted, so it is never assumed present: nothing the repo owns may
  depend on it having been registered.

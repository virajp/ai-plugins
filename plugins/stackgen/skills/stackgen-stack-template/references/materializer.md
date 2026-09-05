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
   - **The repo config files a component declares** — each component's
     `config/` tree (`${CLAUDE_PLUGIN_ROOT}/assets/pack-format.md`)
     mirrors the **repo root**, not `.claude/`, so
     `config/.config/mise/tasks/code/format` lands at
     `<repo>/.config/mise/tasks/code/format`, exactly the way `skills/`
     mirrors `.claude/skills/`. It is a **target, not a fifth artifact
     kind**: copied verbatim like every other pack file, but a **tier-2**
     one, so it is presented at its own consent line in step 3 rather
     than riding the file plan
     (`${CLAUDE_PLUGIN_ROOT}/assets/output-tree.md`).

     **Three copy rules inside that tree**, all of them assertions rather
     than preferences:

     - **`config/_<name>/` is never copied.** A leading underscore marks a
       pack-private payload a reader picks from — the licence texts under
       `config/_licenses/` are the case — so copying the directory would
       land every option instead of the one chosen. Skip it silently; it
       is not a landing set member and never appears in the plan.
     - **A root path must be on the allowlist.** Only `.gitignore`,
       `.editorconfig`, `.gitattributes`, `LICENSE`, `SECURITY.md`,
       `readme.md`, `CLAUDE.md`, `fnox.toml`, `eslint.config.mjs` and a
       language-mandated manifest or lockfile may land at the repo root
       (`${CLAUDE_PLUGIN_ROOT}/assets/output-tree.md`). Any other root
       path in a `config/` tree is a **pack authoring error**: halt the
       landing set, name the pack and the path, and write nothing. This is
       the materializer's own assertion because a pack author is the only
       one who can fix it and the plan is the last place anyone would read
       it. `readme.md` and `CLAUDE.md` are on the list because a shaped
       repo has them, not because a pack may ship them — no pack may, and
       CLAUDE.md is separately out of scope below.
     - **A `.config/pre-commit.d/<pack>.yaml` fragment lands as a file and
       stops there.** It is an ordinary landing-set member with an
       ordinary lockfile entry; merging the fragments into
       `.config/pre-commit-config.yaml` is `/vwf:init`'s work, and nothing
       in this procedure reads or rewrites that file.
   - The lockfile update — every path above, with its component ref,
     source and content hash, plus the **mode** for a `config/` file. The
     per-component record is what lets sync act on one component alone,
     and per file it is what makes `config/` precedence auditable: it
     names which component supplied the version that actually landed.

   **Composition order, and why a bug in it is silent.** More than one
   component may write into one `config/` tree — `.config/mise/tasks/` is
   the first destination that happens for. Compose by component type in
   the order `toolchain-manager`, then `toolchain-gate`, then
   `repo-hygiene`, then `package-manager` / `language`, then
   `app-framework`, then `capability-provider`; a **later component's file
   wins**, and the lockfile records per file which one that was. The
   manager is first because it ships the baseline library every overlay
   overlays; the provider is last because a secrets overlay is the most
   specific answer anything gives to `setup/secrets`. Get it backwards and
   nothing errors: a stale baseline `code/format` shadowing a language's
   would simply format less, in a repo where the task still exists and
   still exits zero.

   **The fence: stackgen writes only what a pack declares in `config/`.**
   Landing a config tree does not make stackgen the owner of a repo's
   configuration. What a pack **may** declare now includes the gate config
   files and the provider environment fragments the tier was opened for on
   2026-09-05; what stays outside is unchanged and enumerated
   (`${CLAUDE_PLUGIN_ROOT}/assets/output-tree.md`): a language manifest, a
   CI workflow, editor settings — no pack ships one, there being no editor
   setting that would point at a config under `.config/` — and
   CLAUDE.md. Charters ratchet: each file the tier absorbs makes the
   argument for the next one easier, which is why the four are restated
   here, where an implementer meets them, and not only where they were
   decided. A pack declaring one of the four is an authoring error, not a
   judgment call — treat it the way a disallowed root path is treated
   above.

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

   **A `config/` target is checked by exactly this rule, not a softer
   one.** A repo that already has `.config/mise/tasks/code/format` and no
   lockfile entry for it wrote that file itself; it is a conflict, and
   overwriting it would be the one silent write this whole design exists
   to prevent. The tier **merges, never owns**: only paths this repo's
   lockfile recorded are ever rewritten or removed.

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

   **The `config/` tree is its own consent line too**, the same tier
   (`${CLAUDE_PLUGIN_ROOT}/assets/output-tree.md`). It writes outside
   `.claude/`, into paths the repo's collaborators own and read, so it is
   presented as a separate, individually skippable item listing **every
   target path** — not folded into the file plan above. State the decline
   outcome in the plan, in these terms: **the skills stay landed and the
   tasks are simply absent** — a repo with the gate doctrine in
   `.claude/skills/` and no `mise run code:all` behind it. Say that at
   the gate, because the failure it prevents is a user discovering it a
   week later as a missing task.

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

   **Preserve the mode when writing a `config/` file, and record it.**
   Everything under `.config/mise/tasks/**` lands **executable (755)**.
   The reason is not self-evident and the failure does not read as a
   permission problem: mise runs a task file **directly**, so a file that
   lands 644 is reported as an **unknown task** — `mise run code:format`
   claims the task does not exist while the file sits right there. The
   restore is `mise run init`, which is what re-marks the task library
   executable; say so rather than leaving a user to chmod by hand. The
   mode goes into the file's lockfile entry, so sync writes it back the
   same way.

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
- **Four targets, and nothing else.** Inside `.claude/`, nothing lands
  outside the output vocabulary. Outside `.claude/` but inside the repo,
  there are exactly two: `.mcp.json`, and the repo config files a
  component declares in its `config/` tree — both tier 2, each behind its
  own consent line, and both **merging, never owning**, so only what the
  lockfile records is ever rewritten or removed. Outside the repo, the
  **only** path stackgen may write is
  `~/.claude/plugins/local/stackgen-lsp/.claude-plugin/`, behind the tier-3
  gate. **LSP server configuration never lands in the repo** whatever the
  source ships; it goes to the local plugin, and the need still travels as
  `language_facts` in the payload for `/vwf:doctor` to read.
- **The `config/` tier is what a pack declares, and no more.** A gate's own
  config file and a provider's environment fragment are inside it; the
  repo's manifests, its CI workflows, its editor settings and its CLAUDE.md
  are not (`${CLAUDE_PLUGIN_ROOT}/assets/output-tree.md`), and neither is
  any root path off the allowlist.
- **The local plugin is the machine's, not the repo's.** It is user-scoped
  and uncommitted, so it is never assumed present: nothing the repo owns may
  depend on it having been registered.

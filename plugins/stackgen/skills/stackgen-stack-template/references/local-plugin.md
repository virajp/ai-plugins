# The Local Plugin

The tier-3 target — how stackgen actually writes and registers
`~/.claude/plugins/local/stackgen-lsp/`. The **contract** (why it exists,
the consent tier, the lockfile key) is
`${CLAUDE_PLUGIN_ROOT}/assets/output-tree.md`; the host rules a declaration
must satisfy are `${CLAUDE_PLUGIN_ROOT}/assets/artifact-doctrine.md` §5.
This is the procedure both of those describe.

Read it from [the materializer](materializer.md) step 4, and from
`/stackgen:stackgen-sync` when a lockfile carries a `local_plugin` block.

**Nothing here is repo state.** Every path below is on the developer's
machine. A collaborator who pulls the commit gets the `local_plugin`
lockfile block and nothing else — say that at the gate, every time.

## What a component declares

Three sibling keys, three destinations, and a name may appear in exactly
one of them:

| Pack key            | Lands in                              | Consent |
| ------------------- | ------------------------------------- | ------- |
| `mcp_servers:`      | the repo's `.mcp.json`                | tier 2  |
| `user_mcp_servers:` | the local plugin's `mcpServers`       | tier 3  |
| `lsp_servers:`      | the local plugin's `lspServers`       | tier 3  |

`mcp_servers:` is unchanged and stays project-scoped — a server the repo
should own and collaborators should get. The other two are user-scoped:
the machine's, never the repo's. **A name appearing under both
`mcp_servers:` and `user_mcp_servers:` halts the run** rather than
landing twice — that is the two-writers fault
`artifact-doctrine.md` §5 forbids, and it is invisible once written.

Each `lsp_servers:` entry is a complete manifest entry, verbatim as it
will appear under `lspServers`:

```yaml
lsp_servers:
  <server-name>:
    command: <binary>
    args: [ … ]
    extensionToLanguage: { ".<ext>": <language id> }
    startupTimeout: <ms>
```

`command` is the binary and `args` is the list after it, verbatim — never
fold the two into one shell string. Where the binary is a tool runner,
the tool it runs is the first `args` element, not part of `command`.

**An entry with no `extensionToLanguage` map is invalid output and is
never written** — not a warning, not a default filled in. The map is the
only thing that keeps a user-scoped declaration from starting a server in
every repo on the machine, so a component that cannot supply one has not
declared a server. Halt and name the component.

Generation emits these under the same rule it emits everything else: the
component declares, the materializer writes. The generator itself never
writes a manifest (`generator.md` step 4).

## The two files

Both under `~/.claude/plugins/local/stackgen-lsp/.claude-plugin/`. The
path and both names are **fixed** — never assembled from the stack pin,
per `artifact-doctrine.md` §3.

`plugin.json` — the union across every repo that has materialized here:

```json
{
  "$schema": "https://www.schemastore.org/claude-code-plugin-manifest.json",
  "name": "stackgen-lsp",
  "version": "0.1.0",
  "description": "Language and user-scoped MCP servers materialized by stackgen. Generated — edit the pins, not this file.",
  "lspServers": {},
  "mcpServers": {}
}
```

`marketplace.json` — a single-plugin directory marketplace pointing at
its own root:

```json
{
  "$schema": "https://json.schemastore.org/claude-code-marketplace.json",
  "name": "stackgen-lsp",
  "owner": { "name": "stackgen" },
  "plugins": [
    { "name": "stackgen-lsp", "source": "./", "version": "0.1.0" }
  ]
}
```

Two spellings there are load-bearing and silent when wrong. **`source`
must be `"./"`** — it resolves against the marketplace root, which is the
directory holding `.claude-plugin/`, not `.claude-plugin/` itself. And
**the entry must state its own `version`**: omitting it does not leave
the version unset, it resolves by accident and the plugin lists as
`0.0.0`. Keep it equal to the manifest's.

**Bump both versions on every manifest change**, patch-wise. A manifest
already registered is served from what Claude read at registration time,
so a second repo's servers land in the file and never reach a session
until the marketplace is re-read. That is the failure mode this whole
target exists to avoid, arriving through the back door — so when the
manifest changed and the plugin was already registered, print:

```sh
claude plugin marketplace update stackgen-lsp
claude plugin update stackgen-lsp@stackgen-lsp
```

and ask, on the same terms as the registration pair below.

## The merge — it merges, never owns

Read the existing `plugin.json` if there is one; treat every key in it as
someone's. For each key this repo contributes, classify it, and report
the classification at the gate:

| State                   | Condition                                                     | Action                      |
| ----------------------- | ------------------------------------------------------------- | --------------------------- |
| **new**                 | the key is absent                                             | add it                      |
| **already present**     | the key exists, identical declaration                        | leave it; claim it in the lockfile |
| **ours, changed**       | the key exists and this repo's lockfile already claims it     | rewrite it                  |
| **conflict**            | the key exists with a different declaration, unclaimed by us  | **do not write**; report it |

A conflict is a real outcome, not an error to route around: another repo
pinned a different spelling of the same server name. Say which key, say
that this repo's server will be absent, and land everything else. Never
resolve it by overwriting — the other repo's lockfile claims that key and
would be silently falsified.

Missing directory, missing manifest and empty manifest are all the same
case: create what is absent, then merge into it.

## The two consent items

Gated apart from the repo landing set, and **separately declinable from
each other**. Declining either leaves everything else landed.

**1 — the manifest write.** Show the exact `lspServers` and `mcpServers`
keys, each with its state from the table above, and say plainly that this
writes outside the repo, onto this machine, at user scope, and that
collaborators get none of it. Declined → the servers are simply absent;
the plan says so and no `local_plugin` block is written.

**2 — the registration.** Print the two commands and ask. **Never run
them unprompted:**

```sh
claude plugin marketplace add ~/.claude/plugins/local/stackgen-lsp --scope user
claude plugin install stackgen-lsp@stackgen-lsp --scope user
```

Detect the already-registered case first, with the read-only
`claude plugin marketplace list` and `claude plugin list`. Registered
already → skip both and say so; the manifest write is what mattered, and
re-running them is noise. Where `claude` cannot be reached, do not guess
it is registered: print the commands, record `registered: false`, and say
the state could not be read.

Declined → a valid plugin directory nobody has installed. Reprint both
commands for later and record `registered: false`. That is a complete,
resumable state, not a partial landing.

## The lockfile block

Written only when the manifest write was consented — **absent means this
repo contributed nothing, and removal touches the machine not at all**.
The full shape is in `${CLAUDE_PLUGIN_ROOT}/assets/output-tree.md`; two
fields decide whether it is right:

- `lsp_servers:` and `mcp_servers:` list **only the keys this repo
  contributed** — new and already-present alike (an already-present key
  this repo also needs is claimed by both, which is what keeps the last
  repo standing from removing a server another still uses). A conflict
  key is claimed by neither.
- `registered:` follows the answer to item 2, never the answer to item 1.

**`local_plugin.mcp_servers` and the top-level `mcp_servers` are
different lists.** The top-level one names project-scoped keys in the
repo's own `.mcp.json`; the nested one names user-scoped keys in this
manifest. Conflating them writes a project server into the machine's
manifest, or removes a machine server when a repo file changed — both
silent.

## Removal — by subtraction

No `local_plugin` block → nothing to do. Otherwise:

1. **Subtract.** Drop from `plugin.json` only the keys this repo's
   `local_plugin.lsp_servers` and `local_plugin.mcp_servers` name. Every
   other key stays, whoever put it there.
2. **Stop unless the manifest is now empty.** A manifest still holding
   any server is another repo's working wiring. Rewrite it, drop the
   `local_plugin` block, and finish.
3. **Only when no servers remain**, print these and ask, on the same
   terms as the registration pair:

   ```sh
   claude plugin uninstall stackgen-lsp@stackgen-lsp --scope user
   claude plugin marketplace remove stackgen-lsp
   ```

   Both name the marketplace's own `name`, not the directory. On
   success the directory is stackgen's own and is deleted outright.
   Declined → leave the empty manifest and the registration in place and
   say so; an empty manifest starts nothing, so the cost of stopping
   here is zero.

The invariant, and it is the same one this toolkit's installer lives by:
**removal removes exactly what was added, and nothing another repo
contributed.**

## No registry, and the fact beside the declaration

stackgen holds **no registry of servers** — a component declares its own,
which is the whole reason the local plugin scales where a curated list
would not. There is nowhere here to look a server up, deliberately: the
pack that needs one carries it, and a server no pack declares is a server
no repo asked for.

A language component's `facts.lsp` and its `lsp_servers:` answer two
different questions and must agree. `facts.lsp` is prose for
`/vwf:doctor` — *how* a server is provided — and where the answer is this
plugin, it says so and names the server key. A pack whose `facts.lsp`
claims a server nobody declares is the dishonest-fact gap the reviewer
already fails.

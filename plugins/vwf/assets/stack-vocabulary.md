# Stack Vocabulary

The **closed language vocabulary** every stack template and every
`.config/vwf.yaml` `stack.languages` entry draws from, plus the per-language
facts `/vwf:doctor` checks against. Frameworks and dependencies are **open** —
any lowercase-kebab token is valid — because no useful check exists for them
beyond presence in a manifest. Languages are closed precisely so the LSP and
toolchain lookups below can never miss on a spelling.

## Languages

| Token        | LSP shipped here    | Manifest                            | mise tool |
| ------------ | ------------------- | ----------------------------------- | --------- |
| `typescript` | `typescript` plugin | `package.json`                      | `node`    |
| `javascript` | `typescript` plugin | `package.json`                      | `node`    |
| `dart`       | `flutter` plugin    | `pubspec.yaml`                      | `flutter` |
| `kotlin`     | `flutter` plugin    | `build.gradle` / `build.gradle.kts` | `java`    |
| `swift`      | `flutter` plugin    | `Package.swift` / `ios/Podfile`     | —         |

**The table is scoped to what this marketplace actually supports.** Every row
ships an LSP; there are no dead rows. `kotlin` and `swift` are **standalone
project languages**, not merely Flutter's `optional_languages` — a native
Android or iOS app is a `frontend` project in its own right. `swift` has no mise
tool because its toolchain comes from Xcode, which mise does not manage.

**"LSP shipped here"** names the `virajp-plugins` plugin whose `lspServers`
block covers the language — the thing `/vwf:doctor` looks for in
`claude plugin list`. A future row may carry `none`; that is **not a failure**,
and doctor reports it as *unavailable in this marketplace* rather than
*missing*, because there is no install command to suggest.

A language outside this table is recorded verbatim and reported by doctor as
**unknown** — it checks nothing for it, and says so. That fallback is what keeps
an unsupported language usable rather than blocked. Extending vwf means adding a
row here, not improvising a token per repo; the table is deliberately narrow
today and is expected to grow as templates and LSP coverage arrive.

## Template frontmatter

Every project template at `assets/stacks/<type>/<slug>.md` opens with:

```yaml
---
type: <registry type> # service | worker | packages | site | console | frontend
name: <display name> # what the menu shows
languages: [<token>] # closed vocabulary above; always at least one
optional_languages: [] # admitted by the template, not required — e.g. flutter's kotlin/swift
frameworks: [] # open, lowercase-kebab; 0..n
dependencies: [] # open, lowercase-kebab; the few that characterize the stack
---
```

Repo templates at `assets/stacks/repo/<slug>.md` use a different shape — they
describe tooling, not a project:

```yaml
---
scope: repo
name: <display name>
topologies: [monorepo, workspace] # which topologies this template suits
package_manager: <tool>
tools: [] # the tooling that defines the template
---
```

The prose below the frontmatter is the template's **conventions** — layout,
testing modes, coverage thresholds, deployment. `plan` and `execute` read it for
the selected template; nothing in `docs/blueprint/` ever does.

## Distinguishing the three open axes

The split only matters for how doctor checks a project, so keep it mechanical:

- **`frameworks`** — what the code is *written against*, and what shapes its
  file layout. Removing one means rewriting the project.
- **`dependencies`** — libraries the project *uses*. Removing one means losing a
  feature, not restructuring.
- Neither is exhaustive. Record what a new engineer needs to know before opening
  the repo; the manifest is the complete list and always wins on detail.

## What is deliberately absent

There is no "recommended" or "default" marker on any template. vwf ships a menu:
`/vwf:architecture` presents every template for a project's `type` and the user
picks, with an **other (describe)** path that records free-text axes and
`template: custom`. A repo whose stack matches nothing shipped is a normal
outcome, not a deviation — there is no `enforcement` entry for it and nothing to
justify.

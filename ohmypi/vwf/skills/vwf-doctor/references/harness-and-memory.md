# Harness, Health & Memory Config (§§6–7)

Read this before running §6. §6 produces no **blocking** finding — only drift,
recorded gaps, and degradations. §7 does: the four placement-and-secrets checks
below are blocking, because each one silently disables the memory layer or
publishes a credential into it.

## 6. Harness and health

Per `%%AI_PLUGINS_ROOT%%/assets/harness.md`, check every capability the
config's `harness:` block marks `true` still resolves — its canonical task name
exists (`mise tasks`), or the non-canonical override the config records does. A
capability marked `false` is a **recorded gap, not a finding**: `/skill:vwf-plan`
injects its bootstrap when a cycle needs it.

Then check each project's health path (`projects.<name>.harness.health`,
defaulting to `/health`) is actually registered in that project's routing. Do
this by reading the routing surface, not by making a request — doctor never
starts a server or calls a deployed environment; that is `/skill:vwf-verify`'s job.

## 7. Memory config (mempalace)

The room vocabulary is a **closed set of seven** and mempalace creates a room
implicitly on first write — so a mistyped room name never errors, it just makes
every later recall come back empty. Nothing else in vwf catches that; this
section is where it gets caught. Per `%%AI_PLUGINS_ROOT%%/assets/memory.md`,
check:

- **Exactly one `mempalace.yaml`, at the repo root.** Walk the whole product
  tree — the root, `.config/`, every submodule root — and count. Three
  **blocking** outcomes:
  - **More than one** anywhere in the tree. Two configs mean two answers to
    which rooms exist, and only the root one is ever read.
  - **One, but not at the repo root.** Mining reads the config only from the
    directory it is pointed at — there is no parent search, no `.config/`
    convention, and no flag to name one — so a config elsewhere is **silently
    inert**: the mine runs, falls back to auto-detected defaults, and files
    everything into `general`. Say that in the finding text; a config that looks
    tidy in `.config/` is indistinguishable from one that works.
  - **None at all.** Nothing is mined; the palace holds only what vwf wrote into
    it by hand.
- **The secret excludes are configured** — `exclude_patterns` carries the
  denylist from the memory asset's *Secrets* section. **Blocking**: the failure
  is a credential indexed into a store agents read back into context, deleting
  the source file does not remove the drawer, and it is unobservable from
  outside. Check only that the **patterns are present** — doctor never scans
  file contents for credentials; that belongs to a dedicated secret scanner, and
  the `devtools` plugin already ships that doctrine.
- **The wing matches `memory.wing`** in `.config/vwf.yaml` (or `product.name`
  when the key is absent). A file naming a different wing is the highest-value
  drift finding here: writes and recalls silently address different palaces, and
  nothing else would ever surface it.
- **All seven protocol rooms present** — `decisions`, `problems`, `planning`,
  `gaps`, `runs`, `doctor`, `handoff`. Report a missing one as drift; report a
  room whose name is a **near-miss** of a protocol room (`decision`, `run`,
  `handoffs`, `plans` for `planning`) as its own finding, since that is the typo
  case the closed set exists to catch — mempalace creates the mistyped room on
  first write, so it fills up while every recall against the real name returns
  empty.
- **No shadowing keyword** — routing walks path parts outermost-first and
  returns on the first match, so a room keyed on a directory that contains
  another room's path swallows it (`documentation` keyed on `docs` captures
  `docs/memory/handoff/` before `handoff` is tested). Flag every such pair.
- **No submodule path in `exclude_patterns`.** One config mines the whole
  product tree, and each submodule's own `.gitignore` is honoured on the way in,
  so an inherited exclude now drops that project from the palace entirely.
  Report as drift with the line to delete.
- **Room-name collisions across projects** where the same name means different
  things (a backend `configuration` of `deploy/` versus a frontend
  `configuration` of `config/`). One config, one wing, so those are one room
  holding two subjects. Report as drift to reconcile — not an error; merging
  `documentation` across the product is usually right.

**The markdown mirror.** Check `docs/memory/` exists with the seven room
directories, and that `.gitignore` covers `docs/memory/handoff/`,
`docs/memory/doctor/` and `docs/memory/runs/` — the developer-specific rooms. A
missing directory is fine (nothing written there yet); a **committed** handoff,
doctor or runs file is drift to report, since it puts one developer's session
state in everyone's diff.

If the mempalace server itself is unreachable, still check the **files** (they
are on disk) and report the outage as context, not as a finding.

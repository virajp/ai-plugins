# Harness, Health & Memory Config (§§6–7)

Read this before running §6. Neither section produces a **blocking** finding —
they yield drift, recorded gaps, and degradations.

## 6. Harness and health

Per `%%AI_PLUGINS_ROOT%%/assets/harness.md`, check every capability the
config's `harness:` block marks `true` still resolves — its canonical task name
exists (`mise tasks`), or the non-canonical override the config records does. A
capability marked `false` is a **recorded gap, not a finding**: `/plan`
injects its bootstrap when a cycle needs it.

Then check each project's health path (`projects.<name>.harness.health`,
defaulting to `/health`) is actually registered in that project's routing. Do
this by reading the routing surface, not by making a request — doctor never
starts a server or calls a deployed environment; that is `/verify`'s job.

## 7. Memory config (mempalace)

The room vocabulary is a **closed set of seven** and mempalace creates a room
implicitly on first write — so a mistyped room name never errors, it just makes
every later recall come back empty. Nothing else in vwf catches that; this
section is where it gets caught. Per `%%AI_PLUGINS_ROOT%%/assets/memory.md`,
check:

- **A `mempalace.yaml` at every repo root** — the parent and each submodule.
  Missing → finding; that repo's files are never mined.
- **One wing across all of them**, equal to `memory.wing` in `.config/vwf.yaml`
  (or `product.name` when the key is absent). A file naming a different wing is
  the highest-value finding here: writes and recalls silently address different
  palaces, and nothing else would ever surface it.
- **All seven protocol rooms present** in each file — `decisions`, `problems`,
  `planning`, `gaps`, `runs`, `doctor`, `handoff`. Report a missing one as
  drift; report a room whose name is a **near-miss** of a protocol room
  (`decision`, `run`, `handoffs`) as its own finding, since that is the typo
  case the closed set exists to catch.
- **No shadowing keyword** — routing walks path parts outermost-first and
  returns on the first match, so a room keyed on a directory that contains
  another room's path swallows it (`documentation` keyed on `docs` captures
  `docs/memory/handoff/` before `handoff` is tested). Flag every such pair.
- **The parent's `exclude_patterns`** covers each submodule path, or the parent
  mine double-files their contents into the shared wing.
- **Cross-repo room-name collisions** where the same name means different things
  (a backend `configuration` of `deploy/` versus a frontend `configuration` of
  `config/`). The wing is shared, so those merge into one room. Report as drift
  to reconcile — not an error; merging `documentation` is usually right.

**The markdown mirror.** Check `docs/memory/` exists with the seven room
directories, and that `.gitignore` covers `docs/memory/handoff/`,
`docs/memory/doctor/` and `docs/memory/runs/` — the developer-specific rooms. A
missing directory is fine (nothing written there yet); a **committed** handoff,
doctor or runs file is drift to report, since it puts one developer's session
state in everyone's diff.

If the mempalace server itself is unreachable, still check the **files** (they
are on disk) and report the outage as context, not as a finding.

# Secrets — the capability contract

What **any** secrets manager has to satisfy to serve a vwf product, stated
without naming one. The provider packs under `stacks/capability-provider/` say
how a particular tool satisfies it; a cloud plugin's managed flavour says the
same for its own.

**Capability tokens realized here: none today.** Like `cdn`, this category has
no vwf token (`${CLAUDE_PLUGIN_ROOT}/assets/taxonomy.md`) — components leave
`capability` unset, and nothing here mints one. Blueprint prose calls the tool
**the secrets manager**; the one place a real name belongs is `environment.md`,
where a secret's *issuer* is a fact about the world.

## The rule that outranks every other

**A secret reaches a process as an environment variable, injected at the
process boundary — never read by the application from a file.**

This is what makes the manager replaceable, and it is the decision that cannot
be undone cheaply. An application that calls a manager's SDK to fetch its own
credentials has that manager compiled into every service, plus a bootstrap
problem: the credential that reads the credentials. An application that reads
its environment is portable to the next manager, to CI, and to a local shell,
and its tests need no manager at all.

So the injector **wraps the task, not the application**. Whatever the tool, the
shape is `<injector> -- <the repo's own task>`, and everything downstream of
that boundary — the app, its tests, its tooling — knows only that the variables
are set.

## What a manager must be able to do

1. **Resolve a distinct set per environment.** `development` / `staging` /
   `production`, vwf's delivery-pipeline vocabulary, selected explicitly.
   Resolving the wrong environment's set must **fail** rather than fall back to
   a default — a silent fallback is how a staging job reaches production data.
2. **Authenticate CI non-interactively**, with a credential scoped to one
   environment, read-only where the pipeline only reads, and rotatable without
   a code change. A pipeline that needs a human to log in is a pipeline that
   does not run.
3. **Onboard and offboard a person at a stated cost.** Both directions, and
   offboarding is the one that matters: a manager must be able to make a
   departed member's access stop. Where the mechanism is re-keying rather than
   revocation, the pack states plainly that **re-keying does not un-compromise
   what that person already read** — the secrets they held are rotated, not
   merely re-encrypted.
4. **Enumerate names without printing values.** `environment.md` catalogs the
   names of every variable and secret a project needs and **never a value**;
   that stays true whichever tool is picked, so the tool has to make the
   names readable on their own.
5. **Keep values out of the terminal and the log.** Injection is the only
   read path a developer needs; a command whose normal use prints a value has
   published it into a scrollback and a CI log, which are more widely readable
   than the repo.

A clause a tool cannot satisfy is **stated as such** in its pack's contract-
satisfaction topic (`${CLAUDE_PLUGIN_ROOT}/assets/kinds.md`), never omitted. A
tool that serves only `development` is a legitimate pick with a named gap: the
product then answers clause 1 and 2 for its deployed environments somewhere
else, and the pack says where.

## The naming convention

Every manager stores values under names, and the names outlive the manager —
so the convention is the contract's, not a provider's:

- **`<REPO>_<KEY>`** for a value one repository owns, where `<REPO>` is that
  repository's own short name and `<KEY>` is what the value is.
- **`GLB_<KEY>`** for a value genuinely shared across repositories — an
  account-wide token, a shared registry credential.
- Names are upper-case, digits and underscores only. Nothing else is
  portable: this is the intersection every manager, every shell and every CI
  runner accepts, and a name that has to be quoted somewhere is a name that
  will be wrong somewhere.

The prefix is what makes a flat namespace legible. Managers differ in whether
they scope by project, by folder or not at all, and a bare `API_KEY` in a
store two repos share is unattributable the moment there are two of them.
Prefixing costs nothing and survives the migration to whichever manager comes
next, which is the same reason the injection rule above outranks everything.

**One store per repository is the default**, and one set of names in it
covers every sub-project the repository holds — a monorepo's members share
the repo's prefix rather than each minting their own, because the thing being
scoped is the repository, not the directory. A member that genuinely needs
isolation is a decision to record in `environment.md`, not a second prefix
invented at the point of use.

The **values** stay where the manager keeps them, and the **names** are
catalogued in `docs/blueprint/environment.md` — clause 4 above is what makes
that catalogue possible without printing anything.

## The encrypt-into-git allowance

Some managers store the encrypted value **in the repository** rather than
behind a service. That collides head-on with two rules this repo already
enforces — the secret scanner, and the memory palace's denylist — and both are
right to be suspicious: an encrypted secret in a tracked file is
indistinguishable, to a scanner, from the plaintext one it exists to catch.

**The mode is offered**, under four conditions. A pack that cannot meet all
four does not offer it.

1. **The scanner is allowlisted by path, never by rule.** The allowlist covers
   exactly the encrypted file the tool's config names, and nothing else. A
   rule-level exemption turns off detection for every future real instance of
   that credential type across the whole repo, and nothing reports that it
   happened.
2. **No allowlist entry may cover a decryption identity.** What makes the
   ciphertext safe to commit is that the key is not in the repo — so the
   private key, the identity file and the keyring stay fully scanned, fully
   gitignored, and are the one thing a hit on which is always real.
3. **A gate proves the committed file holds no plaintext.** Encrypt-into-git
   fails *open*: a value written to the file before it is encrypted is a real
   leak, at a path the scanner has just been told to ignore. So the pack emits
   a pre-commit check that verifies every secret in that file is ciphertext.
   Without it, condition 1 is a hole rather than an allowance.
4. **The committed file is excluded from mining.** Its path goes into
   `mempalace.yaml`'s `exclude_patterns` unconditionally — the palace is a
   published surface, a drawer outlives the file that produced it, and
   encryption is a bet on time that an index nobody re-reviews should not be
   holding. Nothing a recall needs is inside a secrets file.

Conditions 1 and 4 are **repo-wide edits the pack must emit**, not advice: the
scanner config and the memory config both live outside the pack's own tree, and
a pack that lands the tool without them leaves the repo failing its own gates
on every commit.

## What this contract does not decide

- **Which tool.** That is the user's pick from the menu — a hosted platform
  where a vendor holds the secrets, a local-first tool where you hold them, or
  a managed flavour from the project's cloud plugin. The axis that separates
  them is **where the secret lives and what onboarding a teammate costs**, and
  each pack's pick-and-trade topic is where that argument belongs.
- **Which secrets the product has.** That is `environment.md`, authored per
  project by the workflow — names and issuers, never values.
- **Whether a product must have one at all.** Mandating a secrets mechanism is
  a vwf-side statement; this contract only says what one has to do once
  selected.

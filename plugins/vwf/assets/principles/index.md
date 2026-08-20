# The Principles Catalog

The curated engineering principles vwf carries alongside the
[engineering baseline](../engineering-baseline.md). The baseline is **enforced
contract lines** — what must hold in every product. This catalog is
**judgment** — the reasoning a reviewer or generator applies when the baseline
is silent, and the reasoning stackgen instantiates when it generates
stack-specific skills for a technology no curated pack covers.

Every entry has the same fixed shape, and the shape is the point — the
**When not to apply it** section is the anti-rubber-stamp defense. A principle
recited without its limits is a slogan; an entry here is only complete when it
states where following it makes the code worse.

1. **Definition** — what the principle asserts, in one or two paragraphs.
2. **Smells** — what its violation looks like in real code.
3. **How a reviewer verifies it** — concrete checks, not vibes.
4. **Application patterns** — how to apply it when it does apply.
5. **When not to apply it** — the boundary where it stops being right.

Entries **link to** — never duplicate — the surfaces that already own a rule:
the [engineering baseline](../engineering-baseline.md) (the 15 enforced rules),
the [minimalism ladder](../minimalism.md) (what gets built at all), the
[karpathy guidelines](../../skills/karpathy-guidelines/SKILL.md) (behavioral
discipline while coding), and the
[rest-api-design skill](../../skills/rest-api-design/SKILL.md) (the API-surface
realization of several of these). Where a principle here has an enforced
counterpart, the entry says so and defers.

## The entries

| Entry                                                    | Principle                                    |
| -------------------------------------------------------- | -------------------------------------------- |
| [kiss.md](kiss.md)                                       | KISS — keep it simple                        |
| [yagni.md](yagni.md)                                     | YAGNI — build only what is needed now        |
| [dry.md](dry.md)                                         | DRY — and its limits                         |
| [single-responsibility.md](single-responsibility.md)     | SOLID: single responsibility                 |
| [open-closed.md](open-closed.md)                         | SOLID: open–closed                           |
| [liskov-substitution.md](liskov-substitution.md)         | SOLID: Liskov substitution                   |
| [interface-segregation.md](interface-segregation.md)     | SOLID: interface segregation                 |
| [dependency-inversion.md](dependency-inversion.md)       | SOLID: dependency inversion                  |
| [information-hiding.md](information-hiding.md)           | Information hiding (Parnas)                  |
| [design-by-contract.md](design-by-contract.md)           | Design by contract                           |
| [idempotency.md](idempotency.md)                         | Idempotency                                  |
| [explicit-error-semantics.md](explicit-error-semantics.md) | Explicit error semantics                   |
| [least-privilege.md](least-privilege.md)                 | Least privilege                              |

## Who reads it

- **stackgen's generator** instantiates each entry against a researched stack:
  the entry supplies the judgment, the research supplies the stack's own
  idioms, and the generated skill must cite both.
- **stackgen's reviewer gate** checks a generated skill against the entries it
  claims to instantiate — including the *when not to apply* sections, which is
  what stops a generated skill from prescribing a principle where the stack's
  own idiom already handles it.
- **vwf's execute reviewers** may cite an entry when a finding is a judgment
  call the baseline does not cover; the citation names the entry so the finding
  is contestable rather than taste.

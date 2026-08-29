# Flutter — pick & trade

## When it is the answer

**When one team must ship the same product to several surfaces.** This is the
whole case: mobile, tablet, desktop and web from one codebase, with one language
and one set of tests. The alternative is a team per platform, and the cost is
not just headcount — it is every feature being specified, built, reviewed and
debugged two or three times, drifting a little each round.

**When the UI is the product's own.** Flutter renders its own widgets rather
than mapping onto platform controls, so a designed interface looks the same
everywhere. If the design system is the product's, this is an advantage rather
than the uncanny-valley problem it would be otherwise.

**When native access is needed but not constant.** The channel boundary is real
work per API, but it is well-trodden work, and most apps need a handful of
platform capabilities rather than deep native integration throughout.

## When it stops being the answer

**When the app is mostly platform integration.** Every native API crossed costs
a channel — see [platform interop](platform-interop.md). An app that lives in
HealthKit, deep camera control, or platform-specific background execution spends
most of its effort at that boundary, and at that point the cross-platform layer
is overhead rather than leverage.

**When the interface should feel like the platform's own.** Flutter draws its
own widgets. A product whose value is being indistinguishable from a system app
is fighting the rendering model.

**When the artifact size ceiling is tight.** The engine ships with the app.
There is a floor below which a Flutter binary does not go — see
[performance & size](performance.md) — and for markets where install size is
decisive, that floor may be the deciding constraint.

**When the target is primarily the web.** Flutter builds for web, and the output
is a canvas-rendered application rather than a document: text selection, SEO and
initial load behave unlike a web framework's. For a content site this is the
wrong tool; for an app that also has a web surface it is often an acceptable
trade — and it belongs in the blueprint as a stated one.

## The trade nobody states up front

**Three toolchains, not one.** The promise is one codebase, and that is true of
the *code*. It is not true of the build: signing, entitlements, store metadata,
platform permissions and per-platform configuration remain per platform, and
they are where release-day time goes. See
[build, flavors & signing](build-flavors-signing.md).

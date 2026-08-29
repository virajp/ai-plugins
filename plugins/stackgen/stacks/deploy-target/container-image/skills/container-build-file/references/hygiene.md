# Hygiene — the ignore file is a correctness file

Treat it as load-bearing, not housekeeping. It is the only thing standing
between the build context and two failures that are both quiet.

## The two failures it prevents

**Host build state shadowing the image's own.** A dependency directory
copied in from the developer's machine overrides what the image installed —
including platform-specific binaries built for the wrong architecture. The
image builds, starts, and misbehaves in a way that reproduces on nobody's
laptop.

**A credential reaching a published layer.** A local environment file copied
into the build context is in the image, and a later stage deleting it does
not remove it from the layer that added it. Once that image is pushed, the
secret is published, and the only real remedy is rotation.

## What is always excluded

- **Installed dependency directories** and any other build output that the
  image produces for itself.
- **The version-control directory.** It is large, it is not needed at run
  time, and it carries the full history including anything ever committed by
  mistake.
- **Local environment and credential files**, by pattern rather than by
  name — the file that leaks is usually the variant nobody listed.
- **Test fixtures, editor state and local tooling caches**, which cost build
  context and reach the image for no reason.

## Deny by default where you can

Excluding everything and re-including what the build needs is stronger than
listing what to exclude, because the failure mode inverts: a new secret file
is excluded automatically, whereas a deny-list only protects against
patterns someone thought of.

The cost is that adding a source directory means remembering to allow it —
a loud, immediate build failure, which is the right trade against a silent
leak.

## Verify it rather than trusting it

The ignore file is easy to get subtly wrong and gives no feedback when it
is. Two checks worth running before an image is ever pushed: list what the
build context actually contains, and inspect the built image's layers for
anything that should not have travelled. Both are cheap, and both catch the
case where a pattern did not match what its author assumed.

**The secret scanner is not a substitute.** It scans the repository; the
build context is a different set, and a file that is correctly gitignored
can still be sitting in the working tree when the build runs.

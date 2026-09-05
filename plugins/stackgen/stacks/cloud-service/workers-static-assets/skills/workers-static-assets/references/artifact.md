# Artifact — Workers Static Assets

**The artifact is a directory of files.** Not an image, not a bundle, not
a tarball: the build output directory, uploaded as-is. `./dist` is the
default this component ships because it is what most static builders emit;
a repo whose site is a sub-project points `assets.directory` at that
project's output instead, and that is the only place the path is written
down.

## What the build must emit

- **`404.html` at the directory root**, whenever `not_found_handling` is
  `404-page`. The mode is configuration; the file is the build's, and
  nothing reports its absence — see
  [service doctrine](service-doctrine.md).
- **Fingerprinted asset filenames** wherever the framework offers them.
  This is the whole basis of the caching rule below, so a build configured
  to emit stable filenames for CSS and JavaScript has given up the only
  safe long-cache strategy available here.
- **Nothing that is not meant to be public.** Every file in the directory
  is served. Source maps, a stray environment file, a build report, an
  editor backup — the directory is the deployment, and an ignore list is a
  correctness file rather than a size optimization.

## The caching rule, and why it is the one that matters

There is no server deciding headers per request, so caching is decided
entirely by the file set and the header rules shipped alongside it — a
`_headers` file inside the asset directory, which Workers supports
natively.

**The split is the whole technique:**

- **Content-hashed assets get a long `max-age` with `immutable`.** Their
  URL changes when their content changes, so nothing is ever stale and
  nothing needs revalidating. This is what makes a repeat visit cost
  nothing.
- **The entry HTML does not.** It is the document whose URL stays the same
  across deploys, so caching it aggressively is caching the pointer to the
  old asset URLs — and every browser that already has it is on the
  previous release until the header expires, with no way to push a fix.

Getting this backwards is the single most common static-hosting failure,
and it is invisible from the deploying machine: the deploy succeeds, the
site is correct in a private window, and returning visitors see the old
one for as long as the header said.

`_redirects` ships the same way and in the same place, for paths that
moved. Both files live **inside** the asset directory, which means they
are build output — a framework that does not generate them needs the build
to copy them in, and a file left in the source tree is a file the edge
never sees.

## One deploy is distinguishable from the next

Cloudflare hashes each asset's content and uploads only what changed, so
the uploaded file set identifies the release. That is what makes the
rollback path a *version* rather than a rebuild of an old commit — see
[pipeline](pipeline.md).

The consequence worth stating as a rule: **the deployed artifact is what
the build produced, not what a later step assembled.** A pipeline that
rewrites files between the build and the upload — injecting an environment
value into HTML, patching a path — has made the tested output and the
released output different things, and the difference is exactly the part
nobody tested.

## Where this sits relative to the neutral component

The provider-neutral `deploy-target/container-image` component states the
image contract for a host that belongs to no cloud. It has **no
counterpart on this side**, because a directory of files needs no contract
to be portable — the same directory serves from any static host. That is
the one thing this artifact shape gives away nothing to get: the lock-in
here is in the routing configuration, which is small, and not in the
artifact, which is none.

## Configuration is not in the artifact

Anything environment-specific baked into the built HTML or JavaScript is
baked into every environment that serves that build. Where a value must
differ between staging and production, the honest answers are a separate
build per environment or a value fetched at runtime — not a post-build
rewrite, and not a claim that the same artifact is promoted when it is
not.

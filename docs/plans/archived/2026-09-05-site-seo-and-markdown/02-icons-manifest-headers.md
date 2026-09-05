# U2 — Icons, the web manifest, the headers file and the pre-commit exclude

- **Wave:** 1
- **Depends on:** —
- **Owns:** `.config/mise/tasks/site/icons` (new), `site/public/favicon.ico`,
  `site/public/apple-touch-icon.png`, `site/public/icon-192.png`,
  `site/public/icon-512.png`, `site/public/site.webmanifest`,
  `site/public/_headers`, `.config/pre-commit-config.yaml` (one line and its
  comment). Touch nothing outside this list.
- **Model:** inherit
- **Read first:** `site/public/brand/vwf-favicon.svg`,
  `site/src/styles/tokens.css` (the page background token), an existing task for
  the header shape and shebang (`.config/mise/tasks/site/build` and
  `.config/mise/tasks/site/version`), `.config/pre-commit-config.yaml:115-134`,
  `site/wrangler.jsonc`.
- **Lazy-load:** the Workers Static Assets headers reference through Context7
  (`resolve-library-id` "Cloudflare Workers" → `query-docs` "_headers file
  syntax for static assets"), `sharp-cli` usage (`pnpx sharp-cli@6 --help` from
  `/tmp`), `png-to-ico` usage (`pnpx png-to-ico@3 --help` from `/tmp`).

## Ruling

Decision 6: "A new mise task `site:icons` (`.config/mise/tasks/site/icons`)
rasterizes `site/public/brand/vwf-favicon.svg` with one-off `pnpx` runs of
`sharp-cli@6` and `png-to-ico@3` from a temp directory, never touching
`package.json` or `pnpm-workspace.yaml`, writing `site/public/favicon.ico` (16,
32 and 48 px layers), `site/public/apple-touch-icon.png` (180 px, rendered from
a temp copy of the SVG with `rx="14"` replaced by `rx="0"` so the tile is
full-bleed: iOS masks the corners itself and paints transparency black),
`site/public/icon-192.png` and `site/public/icon-512.png` (as drawn, transparent
corners). The outputs are committed. (User's choice.)"

Decision 7: "`site/public/site.webmanifest` (the extension keeps dprint's json
plugin off it): `name` and `short_name` `vwf`, `start_url` `/`, `display`
`browser`, `theme_color` `#1e3f8f`, `background_color` the page background
token's value read from `site/src/styles/tokens.css`, `icons` the 192 and 512
PNGs with `type: image/png` and `purpose: any`."

Decision 8: "`site/public/_headers`, two rules. `/*`:
`Strict-Transport-Security: max-age=31536000; includeSubDomains`,
`X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`,
`Referrer-Policy: strict-origin-when-cross-origin`,
`Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=()`,
`Content-Security-Policy: default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; worker-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests`.
`/_astro/*`: `Cache-Control: public, max-age=31536000, immutable`. No exception
for `/brand/social-preview.html`: it is a render source opened locally, not a
page."

Decision 13: "`.config/pre-commit-config.yaml:132`: the linter hook's exclude
segment `^site/public/brand/` becomes `^site/public/`, and the comment above it
names the new icons, manifest and `_headers` as the reason."

From "New dependencies": "None in the repo. `sharp-cli@6` and `png-to-ico@3` run
once through `pnpx` from a temp directory inside U2's `site:icons` task and are
never added to any `package.json` or to `pnpm-workspace.yaml`."

## Edits

1. **`.config/mise/tasks/site/icons`** (new, executable, same shebang and
   `#MISE` header style as `site/build`;
   `#MISE description="Rasterize the
   favicon set from public/brand/vwf-favicon.svg"`,
   `dir` the site directory like its siblings). Steps, `set -euo pipefail`:
   - `TMP=$(mktemp -d)`; `SRC=public/brand/vwf-favicon.svg`.
   - Full-bleed copy: `sed 's/rx="14"/rx="0"/' "$SRC" > "$TMP/square.svg"` (BSD
     sed; no `-i`).
   - Rasterize with sharp-cli, invoked from `$TMP` so nothing resolves against
     the workspace: `(cd "$TMP" && pnpx sharp-cli@6 ...)` for `icon-512.png`
     (512, from `$SRC` as drawn), `icon-192.png` (192, as drawn),
     `apple-touch-icon.png` (180, from `square.svg`), and three temp PNGs at 16,
     32 and 48 from `$SRC` for the ICO. Use the tool's actual flag names from
     its `--help`; sharp rasterizes SVG at the requested density so the output
     is crisp, so pass a size on both axes. Ensure the PNG keeps its alpha
     channel (no flatten).
   - `(cd "$TMP" && pnpx png-to-ico@3 icon-16.png icon-32.png icon-48.png >
     favicon.ico)`.
   - Move the four deliverables into `public/` and `rm -rf "$TMP"`.
   - Print the resulting file list with sizes. Run it once; commit nothing
     yourself (the orchestrator does), but the four binaries must be present in
     `site/public/` when the unit returns.
2. **`site/public/site.webmanifest`** (new), decision 7 verbatim. The background
   colour is the value of the page background token in `tokens.css` (the one
   `body` in `global.css` consumes; read both to name it, do not guess).
   Two-space indentation, trailing newline.
3. **`site/public/_headers`** (new), decision 8 verbatim, in the Workers Static
   Assets syntax: a path line, then each header indented by two spaces, a blank
   line between rules. Mode 644, no shebang.
4. **`.config/pre-commit-config.yaml`** — line 132 only: replace the segment
   `^site/public/brand/` with `^site/public/` in the linter hook's `exclude`. In
   the comment above (`:118-131`) amend the sentence that names
   `site/public/brand/` so it reads that `site/public/` holds SVG, PNG, ICO, the
   manifest, the headers file and the social-preview render source; keep the
   fold width of the neighbouring lines.

## Verification

- `mise run site:icons` exits 0 and leaves exactly `favicon.ico`,
  `apple-touch-icon.png`, `icon-192.png`, `icon-512.png` in `site/public/`
  beside `robots.txt`, `site.webmanifest`, `_headers` and `brand/`.
- `sips -g pixelWidth -g pixelHeight site/public/apple-touch-icon.png` reads
  180×180; `icon-192.png` 192; `icon-512.png` 512;
  `file site/public/favicon.ico` reports an MS Windows icon resource with 3
  icons.
- `sips -g hasAlpha site/public/icon-512.png` reports yes; the touch icon has no
  transparent corner (read it with the Read tool and confirm a full-bleed blue
  square).
- `mise run site:build` then
  `ls site/dist/_headers site/dist/site.webmanifest
  site/dist/favicon.ico site/dist/apple-touch-icon.png site/dist/icon-192.png
  site/dist/icon-512.png`
  all exist; `mise run site:check` green.
- `pnpm exec wrangler deploy --dry-run` from `site/` exits 0 (validates the
  assets directory, including `_headers`, without uploading).
- `git diff --stat -- package.json site/package.json pnpm-workspace.yaml
  pnpm-lock.yaml`
  is empty.
- `pre-commit run --all-files` (via `mise x -- pre-commit run --all-files`)
  green, in particular the `linter` hook with the new files present.

## Guardrails

- Do not add `sharp`, `sharp-cli`, `png-to-ico` or anything else to any
  `package.json`; do not edit `pnpm-workspace.yaml`. If `pnpx` refuses to run a
  package from `/tmp`, try `pnpm dlx` with the same spec; if both fail, return
  `UNRESOLVED:` with the error rather than adding a dependency.
- Do not rename or re-render anything under `site/public/brand/`.
- Do not touch `site/public/robots.txt`.
- `cat` is aliased to `bat` on this machine: use the Write tool for the
  manifest, the headers file and the task script, never a heredoc.
- BSD `sed`: no `-i` without a suffix, no GNU extensions.
- The `_headers` file is parsed by Workers, never served; do not add a rule for
  `/pagefind/*` and do not override any content type.

## Commit

`feat(site): ship favicon set, web manifest and security headers` — written by
the orchestrator after the wave gate, not by the unit.

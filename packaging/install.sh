#!/usr/bin/env sh
# Install @askviraj/ai-plugins as a standalone binary — no Node required.
#
#   curl -fsSL https://raw.githubusercontent.com/virajp/ai-plugins/main/packaging/install.sh | sh
#
# What it installs is an ARCHIVE, not a lone executable, and that is not an
# implementation detail: three of the five adapters register a marketplace whose
# source is a real directory under dist/, which the agent re-reads in place on
# every later session. The binary and its payload therefore have to stay
# together, so this extracts a tree into a prefix and symlinks only the
# executable onto PATH.
#
# POSIX sh on purpose — this runs before anything is installed, on whatever the
# machine happens to have.
set -eu

REPO="virajp/ai-plugins"
PREFIX="${AI_PLUGINS_PREFIX:-$HOME/.local/share/ai-plugins}"
BINDIR="${AI_PLUGINS_BINDIR:-$HOME/.local/bin}"

die() {
  echo "error: $*" >&2
  exit 1
}

need() {
  command -v "$1" >/dev/null 2>&1 || die "$1 is required but not on PATH"
}

need uname
need tar

# One of these must exist; which one decides how we fetch.
if command -v curl >/dev/null 2>&1; then
  fetch() { curl -fsSL "$1" -o "$2"; }
  fetch_stdout() { curl -fsSL "$1"; }
elif command -v wget >/dev/null 2>&1; then
  fetch() { wget -qO "$2" "$1"; }
  fetch_stdout() { wget -qO- "$1"; }
else
  die "either curl or wget is required"
fi

os="$(uname -s)"
arch="$(uname -m)"

case "$os" in
  Darwin) os=darwin ;;
  Linux) os=linux ;;
  *) die "unsupported OS: $os (Windows users: use the Scoop manifest)" ;;
esac

case "$arch" in
  arm64 | aarch64) arch=arm64 ;;
  x86_64 | amd64) arch=x64 ;;
  *) die "unsupported architecture: $arch" ;;
esac

platform="$os-$arch"

VERSION="${AI_PLUGINS_VERSION:-}"
if [ -z "$VERSION" ]; then
  echo "Resolving the latest release ..."
  # Deliberately not `jq` — this runs on machines with nothing installed.
  VERSION="$(
    fetch_stdout "https://api.github.com/repos/$REPO/releases/latest" \
      | sed -n 's/.*"tag_name" *: *"v\{0,1\}\([^"]*\)".*/\1/p' \
      | head -1
  )"
  [ -n "$VERSION" ] || die "could not resolve the latest release"
fi

archive="ai-plugins-$VERSION-$platform.tar.gz"
base="https://github.com/$REPO/releases/download/v$VERSION"

tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT INT TERM

echo "Downloading ai-plugins $VERSION for $platform ..."
fetch "$base/$archive" "$tmp/$archive" || die "no build for $platform in v$VERSION"

# Verify against the release's own checksum file. Skipped only if the machine
# has neither checksum tool, since refusing outright would be worse than the
# transport-level integrity curl/wget already gives over TLS.
if fetch "$base/checksums-$VERSION.txt" "$tmp/checksums.txt" 2>/dev/null; then
  echo "Verifying checksum ..."
  expected="$(grep " $archive\$" "$tmp/checksums.txt" | awk '{print $1}')"
  [ -n "$expected" ] || die "no checksum recorded for $archive"

  if command -v shasum >/dev/null 2>&1; then
    actual="$(shasum -a 256 "$tmp/$archive" | awk '{print $1}')"
  elif command -v sha256sum >/dev/null 2>&1; then
    actual="$(sha256sum "$tmp/$archive" | awk '{print $1}')"
  else
    actual=""
    echo "warning: no shasum/sha256sum available — skipping verification" >&2
  fi

  if [ -n "$actual" ] && [ "$actual" != "$expected" ]; then
    die "checksum mismatch for $archive (expected $expected, got $actual)"
  fi
fi

echo "Installing into $PREFIX ..."
rm -rf "$PREFIX"
mkdir -p "$PREFIX"
tar -xzf "$tmp/$archive" -C "$PREFIX" --strip-components=1

mkdir -p "$BINDIR"
ln -sf "$PREFIX/ai-plugins" "$BINDIR/ai-plugins"

echo
echo "Installed ai-plugins $VERSION to $BINDIR/ai-plugins"
case ":$PATH:" in
  *":$BINDIR:"*) ;;
  *) echo "Note: $BINDIR is not on your PATH — add it to use \`ai-plugins\`." ;;
esac
echo "Run: ai-plugins --help"

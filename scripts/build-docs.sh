#!/usr/bin/env bash
# Render the OMNI reference manual into public/docs, so it ships at /docs.
#
# The manual's source lives in fajarhide/omni beside the code it documents, which
# is the only arrangement that keeps the two from drifting. This script is what
# lets it be published from here without a second copy: fetch the source, render
# it, drop the result where Astro copies static files from.
#
# Runs during `vercel build` and on a laptop. Everything it needs is downloaded,
# so there is no toolchain to install on either.
set -euo pipefail

MDBOOK_VERSION="v0.5.4"
DOCS_REPO="${DOCS_REPO:-https://github.com/fajarhide/omni.git}"
DOCS_REF="${DOCS_REF:-main}"

here="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT

# --- the renderer ------------------------------------------------------------
# Prefer an mdbook already on PATH, which is the laptop case, so a local run
# does not download 5 MB it does not need. Vercel has none, so it fetches one.
if command -v mdbook >/dev/null 2>&1; then
  MDBOOK="$(command -v mdbook)"
  echo "docs: using $($MDBOOK --version) from PATH"
else
  case "$(uname -s)-$(uname -m)" in
    Linux-x86_64)   target="x86_64-unknown-linux-musl"  ;;
    Linux-aarch64)  target="aarch64-unknown-linux-musl" ;;
    Darwin-arm64)   target="aarch64-apple-darwin"       ;;
    Darwin-x86_64)  target="x86_64-apple-darwin"        ;;
    *) echo "docs: no mdbook build for $(uname -s)-$(uname -m)" >&2; exit 1 ;;
  esac
  url="https://github.com/rust-lang/mdBook/releases/download/${MDBOOK_VERSION}/mdbook-${MDBOOK_VERSION}-${target}.tar.gz"
  echo "docs: fetching mdbook ${MDBOOK_VERSION} for ${target}"
  curl -fsSL "$url" | tar -xz -C "$work"
  MDBOOK="$work/mdbook"
  chmod +x "$MDBOOK"
fi

# --- the source --------------------------------------------------------------
# A blob-filtered shallow clone: the manual is a handful of markdown files and
# 176 KB of fonts, and this repository has no business fetching the whole
# history of a Rust project to render them.
echo "docs: cloning ${DOCS_REF} from ${DOCS_REPO}"
git clone --quiet --depth 1 --branch "$DOCS_REF" --filter=blob:none \
  "$DOCS_REPO" "$work/omni"

book_src="$work/omni/docs/website"
[ -f "$book_src/book.toml" ] || {
  echo "docs: no book.toml at docs/website on ${DOCS_REF}" >&2
  exit 1
}

# --- render ------------------------------------------------------------------
"$MDBOOK" build "$book_src"

out="$book_src/book"
[ -f "$out/index.html" ] || { echo "docs: mdbook produced no index.html" >&2; exit 1; }

rm -rf "$here/public/docs"
mkdir -p "$here/public/docs"
cp -R "$out/." "$here/public/docs/"

# The manual is the one part of this site not written here, so say what landed
# rather than leaving a silent copy in the build log.
pages="$(find "$here/public/docs" -name '*.html' | wc -l | tr -d ' ')"
echo "docs: ${pages} pages rendered into public/docs from ${DOCS_REF}"

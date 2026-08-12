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

# --- the design system -------------------------------------------------------
# The manual and the site have to look like one product, and the only way that
# survives a style change is for both to read the same tokens. This repo already
# depends on @weekndlabs/design for its own pages, so that dependency is also the
# version the book renders against: bump it once here and /docs moves with the
# rest of the site. The book's own theme names --wl-* with the pre-system values
# as fallbacks, so `mdbook serve` upstream still renders without this overlay.
#
# src/ is the only directory mdbook copies verbatim, so the package lands there
# rather than in theme/, which mdbook filters down to the files it knows.
ds="$here/node_modules/@weekndlabs/design/dist"
[ -d "$ds" ] || {
  echo "docs: @weekndlabs/design is not installed, run npm ci first" >&2
  exit 1
}
# Read the file rather than require() the specifier: the package's exports map
# does not publish ./package.json, so require resolves to nothing.
ds_version="$(node -p "require('$here/node_modules/@weekndlabs/design/package.json').version")"
mkdir -p "$book_src/src/wl"
cp -R "$ds/tokens.css" "$ds/fonts.css" "$ds/fonts" "$book_src/src/wl/"

# head.hbs is mdbook's own hook for this, injected into every page including the
# 404, so nothing here has to rewrite rendered HTML.
cat > "$book_src/theme/head.hbs" <<'HEAD'
<link rel="stylesheet" href="{{ path_to_root }}wl/tokens.css">
<link rel="stylesheet" href="{{ path_to_root }}wl/fonts.css">
<link rel="preload" href="{{ path_to_root }}wl/fonts/inter-100-900.woff2" as="font" type="font/woff2" crossorigin>
<script>
  /* mdbook keeps the active theme in a class on <html>; the design system keys
     off data-theme. Mirroring one onto the other is what lets the theme picker
     drive both, and it runs before first paint so there is no flash. */
  (function () {
    var el = document.documentElement;
    var dark = { navy: 1, coal: 1, ayu: 1 };
    function sync() {
      var hit = Array.prototype.some.call(el.classList, function (c) { return dark[c]; });
      el.dataset.theme = hit ? 'dark' : 'light';
    }
    sync();
    new MutationObserver(sync).observe(el, { attributeFilter: ['class'] });
  })();
</script>
HEAD

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
echo "docs: ${pages} pages rendered into public/docs from ${DOCS_REF}, styled by @weekndlabs/design ${ds_version}"

# Every link mdbook writes is relative, so the book only holds together under a
# path that ends in a slash. /docs and /docs/ both return 200 on Vercel and only
# the second one resolves `css/general.css` inside the book; the first sends it
# to the origin root, which is what put 404s on omni.weekndlabs.com/*.css. The
# redirect in vercel.json is what closes that, and this is the check that it is
# still there, because nothing else in a build would notice if it were dropped.
grep -q '"/docs"' "$here/vercel.json" || {
  echo "docs: vercel.json has no /docs to /docs/ redirect, the book will load its assets from the site root" >&2
  exit 1
}

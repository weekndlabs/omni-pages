#!/usr/bin/env bash
# Regenerate src/demo/: the hero's three reels, as raw fixture and real OMNI output.
#
#     OMNI_REPO=~/path/to/omni bash scripts/make-demo.sh
#
# The hero used to show lines written by hand under a caption saying they were
# reproducible from tests/fixtures/. This runs each fixture through the installed
# `omni exec`, behind a stand-in binary that prints the fixture and exits with the
# code the real command would, so the exit code takes the same path it does live.
# Not wired into the build: Vercel has no omni binary. Rerun after a release.
set -euo pipefail

repo="${OMNI_REPO:?set OMNI_REPO to a checkout of fajarhide/omni}"
out="$(cd "$(dirname "$0")/.." && pwd)/src/demo"
bin="$(mktemp -d)"
trap 'rm -rf "$bin"' EXIT
mkdir -p "$out"

# name | fixture | exit code | command line
reels=(
  "cargo-build|cargo_build_large.txt|0|cargo build --release"
  "git-status|git_status_dirty.txt|0|git status"
  "cargo-test|cargo_test_500.txt|101|cargo test"
)

for reel in "${reels[@]}"; do
  IFS='|' read -r name fixture code cmd <<<"$reel"
  tool="${cmd%% *}"
  printf '#!/bin/sh\ncat "%s"\nexit %s\n' "$repo/tests/fixtures/$fixture" "$code" >"$bin/$tool"
  chmod +x "$bin/$tool"
  cp "$repo/tests/fixtures/$fixture" "$out/$name.raw.txt"
  # omni exec mirrors the command's exit code, which is the point of the third reel.
  PATH="$bin:$PATH" omni exec $cmd >"$out/$name.out.txt" 2>/dev/null || true
  printf '%s\t%s\t%s\n' "$name" "$code" "$cmd" >>"$bin/index"
  echo "$name: $(wc -c <"$out/$name.raw.txt") B -> $(wc -c <"$out/$name.out.txt") B (exit $code)"
done

{ echo "# name	exit	command, written by scripts/make-demo.sh with $(omni --version)"; cat "$bin/index"; } >"$out/reels.tsv"

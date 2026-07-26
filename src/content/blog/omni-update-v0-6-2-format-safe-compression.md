---
title: "Format-safe compression, and honest numbers: OMNI v0.6.2"
description: "v0.6.2 stopped OMNI corrupting JSON and YAML, made find lossless, and replaced every published number with a measured replay. 97.3% fell to 58.9%."
date: 2026-07-17
tag: Release Note
author: OMNI Core Team
---

v0.6.2 is the release where the project's numbers changed direction. Everything
below made the advertised saving **smaller**, and that is the point of it.

## Structured output was being corrupted

The pipeline had no idea what kind of text it was compressing. Collapse squashed
the repeated lines of structured output into `[N similar lines collapsed]` and
handed back a payload that no longer parsed. A JSON dashboard piped through the
hook came out carrying 14 collapse markers and failed `jq` outright, which means
every downstream `jq`, `json.load` or `kubectl apply` in the agent's plan failed
with it.

A new format sniffer (`pipeline::format`) now gates both choke points,
`hooks::post_tool` and `hooks::pipe`. **JSON, NDJSON, YAML, TSV and CSV pass
through byte for byte at zero marker cost.** Plain text still compresses exactly
as before.

## A YAML file that came back as a docker log

`sniff_yaml` judged every line of a document that had no leading `---`. A
ConfigMap carrying Vault HCL under `config.hcl: |` therefore looked like free
text, because 26 of the manifest's 608 lines were HCL rather than YAML. The
format gate stood down, collapse emitted `[8 similar lines collapsed]` markers,
and then `is_docker_logs` counted those markers as timestamp prefixes: 12
triggers against a threshold of 5.

The result: **13,463 bytes of Kubernetes config came back as `docker logs: 323
lines, no errors detected`.** OMNI's own collapse markers fabricated the evidence
that misled the next stage. A block scalar's body is now skipped rather than
judged, because the `|` that opened it is YAML's own statement that what follows
is a value.

## `find` and `grep` stopped deleting their payloads

The v0.6.1 `find` behaviour, credited with "up to 99.8% savings", reported about
99% by discarding the file paths that were the answer. It is replaced with
lossless prefix factoring: hoist the shared directory prefix into a header,
state each path once relative to it, cut at a separator so every path round-trips
byte for byte. Real saving on the same output is **about 72%, with nothing
lost**.

`grep` now hoists each path once instead of repeating it on every match, which
is **26% to 39%** and also lossless. Both hand the input back untouched when
factoring would make it larger.

## A weak filter was hiding the test distiller

`sys_build_domain` matches every `cargo` invocation but strips only
`Compiling`-style lines. It won the `find()` race, shadowed `TestDistiller`, cut
1%, and had that 1% thrown away by the `MIN_REDUCTION_PCT` guardrail. So
`cargo test` reported **0%** on output the real distiller reduces by 94%. A TOML
filter now only short-circuits the distiller if it actually beat the guardrail.
A filter that earns its match still wins, user filters included.

With the distiller reachable again, a second bug surfaced: it counted
result-line segments and reported `1 passed` for a run cargo itself called
`490 passed`, because `CollapseMode::Test` folds the 330 `... ok` lines away
before the distiller ever sees them. It now **quotes the runner's own summary
line** (cargo, pytest, jest) and only falls back to counting when no summary was
printed.

## Every published number, re-measured

The headline claims were not stale. They were untrue.

- `docs/PERFOMANCE.md` sold `docker build` as 9.2 KB to **49 bytes (99.5%)**.
  The fixture it names distils to 5,783 bytes, which is **37.2%**.
- `git diff` quoted **50.0%** on bytes (397 to 220) that compute to **44.6%**.
- The **97.3%** all-time figure traced to `find .` at minus 12.6 million tokens,
  the defect fixed above. The number was manufactured by a bug.
- `$35+ USD/month` priced a cost estimator that does not work (see below).
- `~40% faster TTFT` was never measured.
- Three testimonials in quote marks were attributed to nobody, because nobody
  said them.

They are replaced with a replay of **1,810 real execution traces** on the release
binary with a fresh `HOME` per invocation: **58.9% net, 15.0 MB down to 6.2 MB**.
Per command: `git` 91.3%, `cargo` 96.8%, `cat` 9.1%. Fixing the YAML sniffer moved
the reported saving **down**, from 65.3% to 58.9%, because six of those points
were destroyed manifests rather than removed noise. All six translated READMEs
carry the same figures.

## The dollar estimator is gone

`est_cost_usd` and `ModelPricing` are removed from `stats`, `diff` and
`guard::config`. OMNI is a hook. It never sees the API's `usage` block, so it
cannot know whether the bytes it saved were billed as fresh input or as a
roughly 10x cheaper prompt-cache read. `ModelPricing` used only `.input`, its
`_cached` and `_cache_creation` fields were dead, and the formula was duplicated
across four call sites. Every dollar figure OMNI printed was a fresh-input guess
presented as a session cost. Unknown keys in an existing `config.toml` still
parse, so nothing breaks on upgrade.

## Two costs we now document instead of hiding

**OMNI is not deterministic against a warm database.** Session history feeds the
scorer, so the same binary on the same input differed on 21 of 30 traces run to
run. One gave 1,835 bytes, then 433. Any A/B measurement has to isolate state per
invocation.

**Latency is real and it grows.** Roughly 82 ms for a 496-byte `git status`
against a fresh database, and roughly **308 ms** against a 97 MB one, per hooked
command.

## One more thing: 0.6.2 almost did not ship

`release.yml` asked `dtolnay/rust-toolchain@stable` for each matrix target, which
installs that std into *stable*. But `rust-toolchain.toml`, added this release,
makes cargo switch to the pinned 1.97.0, which has std for no target except the
runner's own. Every cross-compile died with `error[E0463]: can't find crate for
'core'` before compiling a line of OMNI, and fail-fast took the rest of the
matrix down with it, so the tag produced no binaries at all. The matrix targets
are now listed in `rust-toolchain.toml` itself. `ci.yml` stayed green throughout,
because it only builds host-native, which is why this was invisible until a tag
was pushed.

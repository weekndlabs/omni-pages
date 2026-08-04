---
title: "The test suite was reading whoever ran it: v0.6.11"
description: "OMNI_HOME was added to isolate the tests and verified by measuring writes. The code that reads filters derived ~/.omni itself, so it sat outside the override entirely."
date: 2026-08-03T11:47:32Z
tag: Release Note
author: OMNI Core Team
---

Issue #308 added an `OMNI_HOME` override so a test run would stop touching the
developer's real configuration. It was verified, it worked, and it was checked
the wrong way.

The verification measured **writes**. Nothing wrote to `~/.omni` any more, so
the override looked complete. But `toml_filter::resolve_user_signal_dir`
derived `~/.omni` on its own, which put it outside the override, and it runs on
every hooked command as a **read**.

The consequence is worse than a dirty test directory. Filters from the
developer's home still joined the `find()` race that decides which signal claims
a command, so which filter won depended on whose machine the suite ran on. A
test could pass locally and fail on CI for reasons that had nothing to do with
the change, and it did: an embedded `cargo` filter won on the Linux runner and
lost on the maintainer's laptop, which turned a real bug in the pipe's TOML
branch into a failure that looked like a platform problem.

Every path in the tree resolves through one `paths` module now.

## XDG, and the migration decision inside it

While the path resolution was being rewritten anyway, it grew the layered
lookup a Unix tool is supposed to have (#217):

```
config.toml, filters/, signals/, trusted.json
  OMNI_HOME -> OMNI_CONFIG_HOME -> an existing ~/.omni -> $XDG_CONFIG_HOME/omni -> ~/.omni

database, transcripts, caches, exports
  OMNI_HOME -> OMNI_DATA_HOME -> an existing ~/.omni -> $XDG_DATA_HOME/omni -> ~/.omni
```

Note the third rung. **An existing `~/.omni` deliberately beats XDG**, and that
is the migration decision rather than an oversight: an install that already has
a tree keeps using it, so upgrading cannot appear to lose your database.
Nothing moves on its own. With no environment set, every root is still exactly
where it was before this release.

## Two more cuts that removed the answer

- **A `grep -n` over a single file lost 7 of its 12 matches** (#316). grep only
  prefixes the filename when it was given more than one file, so a single-file
  `grep -n` prints `<lineno>:<text>` and nothing else. The detector required the
  part before the colon to look like a path, so that shape was not recognised as
  grep output at all and fell through to a generic fallback that keeps the
  segments it rates highly. On a 12-match grep over a Grafana alerting manifest
  the agent received 5 lines: four of runbook prose, one expression. The config
  lines, which were the reason to run the grep, were the ones dropped.

- **A pipeline ending in a stage that rewrites its payload is now routed to that
  stage** (#277). The exception added in #269 covered `jq` and `yq` only, so
  `kubectl get pods | cut -d' ' -f1` was still handed to the kubectl distiller,
  which then described a table the command no longer emits.

That second one is worth a note on method. The issue proposed classifying every
stage and routing to the last transformer. Measured over **4,958 recorded
pipelines**, that design is worse at both ends: routing by the last stage
regardless hands **69.1%** of pipelines to `head`, `tail` or `grep`, all of
which are verbatim passthroughs, and stops distillation on them entirely. The
measurement rejected the design the issue asked for, so we shipped the narrower
exception instead. A measurement that kills your plan is the measurement
working.

## Dead weight in the hot path

`SessionState::scoring_modifier` was consulted in two `scorer.rs` branches, one
of them **per line**, and assigned in no production path (#164). It was
permanently `None`, so both branches were pure cost on every line of every
command.

That also settles a question #164 left open. `omni goal` looked load-bearing
because the scorer read something only `omni goal` could set, and it turned out
the scorer could not read it at all. `omni goal` keeps its place through the
SessionStart injection, which is a different mechanism and one that works.

## The connection pool

r2d2 defaults `min_idle` to `max_size` and `build()` blocks until that many
connections exist, each through the pragma customizer. A hook that exits after
one payload was opening four SQLite connections before doing any work (#174).

Median of 10 opens on the release binary: **3.19 ms down to 1.26 ms** with
`min_idle(Some(1))`, against 0.81 ms for a bare connection carrying the same
pragmas. One line recovers 73% of the cost.

The pool stays. Removing it entirely is 62 call sites for the remaining
0.45 ms, and the MCP server genuinely needs it.

```bash
brew install fajarhide/tap/omni && omni init
```

---
title: "The benchmark was counting a terminal: v0.6.13"
description: "The harness behind the published headline read every trace, including 86 MB of TTY output no model ever receives. Corrected, the net figure is 43.3% rather than 58.9%. Plus an import graph that counted directories as modules."
date: 2026-08-04T09:12:00Z
tag: Release Note
author: OMNI Core Team
---

`tests/bench_replay.rs` selected `command, raw_input FROM execution_traces` with
no filter on which agent produced the row. On the reporting installation that
corpus is **68% terminal by bytes**: 888 traces carrying 86.0 MB of output a
human read in a shell and no model ever received, against 13.9 MB from Claude
Code and 25.7 MB from Aider.

Replaying the same pipeline over the same database, one run each:

| population | raw | distilled | net |
|---|---|---|---|
| everything | 126.0 MB | 26.3 MB | 79.1% |
| model-facing only | 40.1 MB | 22.7 MB | **43.3%** |

The README quoted the first number. It should have quoted the second.

We had already found this bug once. Issue #212 established it in July and fixed
it in `omni stats`, which prints "Terminal output is excluded" on its own line.
The harness that produces the number the website quotes never got the same fix.
A fix applied to one of two readers of the same table is how a correction gets
undone without anyone touching the corrected code.

The harness replays the model-facing population by default now and prints which
one it used. `OMNI_BENCH_ALL=1` asks for the wider one. Both are worth having,
because the gap between them is the mistake, and hiding one of the two is how it
comes back.

## Every published number re-measured

The README carried 58.9% net over an 1,810-trace corpus with 63.6% of calls
saving nothing. Measured now over 9,965 model-facing traces: **43.3% net, 90.0%
saving nothing, and not one call in 9,965 that made the output larger.**

The drop is not a regression. It is the correctness work of the last few
releases showing up in the accounting. `Build: ok` no longer answers for
commands that never built, and `make`, `kubectl` listings, single-file
`grep -n`, green `npm test` and reshaping pipeline tails all pass through now.
Each of those passthroughs used to be counted as a saving.

Latency moved the other way. A 496 B `git status` is **21.1 ms** on a fresh
database and **60.7 ms** on a 205 MB one, against the 82 ms and 308 ms the
README promised. A 16.5 KB `cargo test` is 24.5 ms rather than 276 ms.

## The import graph counted directories as modules

`resolve_candidate` accepted any candidate path that `exists()`. A brace-grouped
`use crate::pipeline::{CollapseMode, SegmentationMode}` leaves the extractor
holding `crate::pipeline::`, whose candidate is the directory `src/pipeline`.
Directories exist, so they won the lookup and became graph nodes.

Measured on this repository: `src` held 113 dependents and `src/pipeline` 30.
That is 143 of the graph's edges pointing at two directories, while
`src/pipeline/mod.rs`, the file all thirty of those imports actually name, had
none. `omni_context` reported that number.

One word fixes it, `is_file()` for `exists()`, because `mod.rs` and `index.*`
were already later in the candidate list.

### The graph will not be wired into the scorer

The proposal was to feed `imported_by.len()` into `scorer::score_segments`, so a
file forty others import survives a cut that a leaf file does not. It was
sampled against 2,764 recorded traces before any of it was built.

Only **127** name a file this repository's graph knows. **52** name two or more.
**26**, under 1%, name two files whose dependent counts differ, which is the
entire population a dependents signal could re-rank. Building the persistence
and mtime-invalidation layer the issue calls "the actual work" buys a tie-break
on fewer than one call in a hundred, against a `build_graph` that takes 542 ms
where the budget for the whole hook is 10 ms.

The sampling also found the graph was wrong, which is the fix above. Before it,
the same probe read 196, 95 and 47, because two directory nodes were absorbing
the edges.

## A grep at the end of a pipeline owns its output

`kubectl … logs … | grep -iE 'mcp|slack|error|warn|ready'` delivered one line of
fifteen. Routing reads a pipeline as belonging to its first stage unless the last
one reshapes the payload, and `grep` reshapes nothing, so `kubectl` kept the
buffer and its distiller kept `is_critical` lines only.

The line it kept was the `ERROR`. The fourteen it dropped included the `WARNING`
the pattern named by name, `3/3 MCP servers connected` and `Bolt app is
running!`. What arrived said the pod had failed to start. The evidence that it
had started was behind the retrieval marker.

A grep pattern **is** the caller's filter. That rule now sits at the routing
boundary: a `grep`, `rg` or `ag` tail claims the payload, and the grep path is
the only distiller allowed to touch it.

```bash
brew install fajarhide/tap/omni && omni init
```

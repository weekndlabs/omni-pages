---
title: "48 ms to compute an answer it threw away: v0.6.12"
description: "Every hooked Read walked the whole repository to produce a number used by one line, behind two gates that reject most payloads. Plus omni stats --share, and what the re-measurement found."
date: 2026-08-03T14:29:58Z
tag: Release Note
author: OMNI Core Team
---

`hooks/post_tool.rs` called `build_graph(&cwd)` unconditionally on the `Read`
arm and passed the resulting count downstream. That count has exactly one use:
a dependents advisory line in the readfile distiller.

The guard that prints it sits behind two gates that reject most payloads. The
file has to be over 2,000 estimated tokens, and the distillation has to have
actually shrunk it by a fifth. So a `Read` of any small file walked the entire
repository and threw the answer away a few lines later.

Measured on the release binary against this repository, 125 files indexed:
**116.6 ms cold, 48.0 ms median warm.** The budget in `AGENTS.md` for the whole
hook is 10 ms, and the Bash post-hook measures 18.9 ms end to end. `MAX_FILES`
is 5,000 and there is no cache, so a larger project pays more than we did.

The count is passed as `impl FnOnce() -> usize` now and consulted at the guard,
so the walk happens only when the line it feeds is about to be printed.

### Why the test asserts a negative

The regression test asserts the closure is **not called** for a file below the
threshold. That distinction matters: "it compiles with a closure" was equally
true of the version that still walked every time. A test that passes both ways
tests nothing, and this project has shipped that more than once.

### How it became reachable

This was not a long-standing miss. Issue #258 recorded the `Read` arm as
unreachable on 2026-07-29, because the `PostToolUse` matcher was registered for
`Bash` only. Issue #172 widened it to `Bash`, `Read`, `Grep` and `WebFetch` in
0.6.9. Fixing one thing made a second thing start running for the first time,
which is the ordinary way a dormant cost wakes up.

## omni stats --share

New in this release (#135): a copy-pasteable summary of your own measured
savings. It reuses `multi_period_stats`, the same aggregation the default report
reads, so the figure on the card cannot drift from the figure in the report.

Two decisions in it are arguments this project has already had with itself.

It prints the **net all-time percentage and never a per-command peak.**
`kubectl kustomize` reports 99.8% on the reporting installation, and putting
that on a share card would be the cherry-pick our changelog spends its length
arguing against.

It prints **one decimal place**, because `{:.0}` renders 99.8% as `100%`, and
100% is a figure the tool never measured.

The card also states that terminal output is excluded, which is the difference
between a real number and a headline that counts 86 MB of TTY bytes no model
ever received.

## One list instead of two

`registry::reshaped_by` and `distillers::passes_through_verbatim` are two lists
in two files that have to agree, and the only thing keeping them in step was a
comment asking the next person to keep them in step (#194, in part).

Getting the first without the second is not a style problem. On the first run of
#277 it sent `gh api … --jq '.content' | base64 -d` to the generic distiller,
and that decode produces a source file an enumeration cut would shred.

`RESHAPING_TAILS` is the list now and both sides read it. A test walking one
list against the other was written and then deleted, because once both sides
read the same constant it asserts that every member of a list is in that list,
and cannot fail. The constant is the mechanism. That is the whole point of
removing the comment.

## What the re-measurement found

Every published figure was re-measured on this binary, and most of them moved
down.

| | published before | measured on 0.6.12 |
|---|---|---|
| net bytes saved | 58.9% | **43.3%** |
| calls that saved nothing | 63.6% | **90.0%** |
| calls that grew the output | not measured | **0 of 9,965** |
| `git status`, fresh database | 82 ms | **21.1 ms** |
| `git status`, 205 MB database | 308 ms | **60.7 ms** |
| `cargo test`, fresh database | 276 ms | **24.5 ms** |

The savings fell because 0.6.10 and 0.6.11 stopped compressing six commands
where the compression was deleting the answer. Each of those used to be counted
as a saving.

The latency fell because of the three fixes in these releases: the GPT
tokenizer loaded per command for a reporting column, the 249 line-filter regexes
compiled whether or not their filter matched, and the connection pool opening
four SQLite handles in a run-once process.

There is a third correction, and it is the largest. The benchmark harness behind
our headline selected `execution_traces` with no filter on which agent the trace
belonged to, so it counted **86.0 MB of terminal output no model ever
receives**, 68% of the raw bytes on the reporting installation. Replaying the
same pipeline over the same database: everything, 126.0 MB to 26.3 MB, **79.1%**;
model-facing only, 40.1 MB to 22.7 MB, **43.3%**.

We had already found that bug once. Issue #212 established it in July and fixed
it in `omni stats`. The harness that produces the number the website quotes did
not get the same fix for three weeks. That correction landed after 0.6.12 was
tagged and ships in the next release; the figures in the table above are the
corrected ones, because publishing the old number for another week to keep a
release boundary tidy would be the wrong trade.

## The pattern

Every fix in these three releases made a published figure smaller. If that ever
reverses without an equally boring explanation attached, do not take our word
for it.

```bash
brew install fajarhide/tap/omni && omni init
omni stats --share
```

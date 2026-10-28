---
title: "OMNI v0.7.13: The Whole File"
description: "A subagent's first read of a file comes back whole, even when a sibling read it first. Worktree agents run git again, a credential set after export is hidden, and omni.db shrinks to less than half its size."
date: 2026-10-28
tag: Release Note
author: OMNI Core Team
image: /media/omni-0.7.13.png
imageAlt: "OMNI v0.7.13 release card: every subagent gets the whole file it asked for"
---

A subagent sent to read a file now gets all of it.

## A Read folds only what the same reader was shown

The ledger folds lines an agent already holds, and it used to count lines other agents in the same project had seen. Two subagents launched together each read a file a sibling had read first, and each got `⋮` in place of the lines they were sent for. A Read now draws only on what that same reader was shown. Bash output still folds across sessions, with a marker that says the lines were not shown here and a handle that brings them back. Details in [#906](https://github.com/fajarhide/omni/issues/906).

## Fixed

A Claude Code agent isolated in a git worktree can run git again. Claude Code refuses every `omni exec ... git` inside a linked worktree, so the pre-hook now leaves git unwrapped there.

A credential assigned mid-line after `export` or a shell operator, the way a crontab entry or a `sh -c` one-liner carries it, is now hidden.

## Smaller

`omni.db` stores each command once instead of on every line it showed. On a 30-day store that took the database from 615 MB to 262 MB. Rows written before the upgrade keep their text until they age out, so the saving arrives as that window turns over.

Eight fewer crates in the build, and Rust 1.99.1 is the pinned toolchain.

## Measured, then not built

0.7.12 said redacting a failed command's output was next. We measured it first: of 33,029 recorded Bash results, 1,207 failed and none carried a provider-issued token. It is not being built. The [markers page](https://omni.weekndlabs.com/docs/use/markers) now says which output OMNI cannot reach, including any output of 30 KB or more on Claude Code.

---
title: "Noise-canceling headphones for your AI agent: OMNI v0.6.1"
description: "v0.6.1 rewrote the README around terminal noise and context amnesia. It also shipped a find distiller claiming 99.8% savings, which v0.6.2 retracted."
date: 2026-06-24
tag: Release Note
author: OMNI Core Team
---

v0.6.1 is a positioning release with one code change in it, and the code change
turned out to be wrong. Both halves are worth writing down.

## Pain-first positioning

The README was rewritten around the two problems an agent actually has in a
terminal: **noise** (the 300 lines of `npm WARN` between you and the one error)
and **context amnesia** (the agent forgetting, three commands later, what it
already read). The line we landed on, and still use, is "noise-canceling
headphones for your AI agent". It says what the tool does without inventing a
product category for it.

The logo was redrawn to match: a neon "cute brain" wearing headphones, the
noise-canceling half and the memory half in one mark.

## Terminal UI polish

The `[OMNI Active]` status tag was overlapping the command output it was
supposed to sit under. Distilled payloads now carry a trailing newline, so the
tag lands on its own line.

Two housekeeping fixes went with it: a `clippy::needless_splitn` warning in the
directory classification logic, so `make ci` stays at zero warnings, and the
`insta` snapshots resynchronised against the new `find` output.

## The `find` distiller, and why we retracted it

This release rebuilt the `SystemOpsDistiller` for `find` to strip out the raw
file paths entirely and emit a key-value summary of directory distributions and
extension counts instead. The changelog entry credited it with **up to 99.8%
savings**, and at the time that read like the best number in the project.

It was the worst one. The paths *were* the answer to the question the agent
asked; deleting them and counting the deleted bytes as a saving is the exact
failure mode OMNI exists to prevent. Worse, that single number went on to
poison the published figures: the 97.3% all-time reduction we advertised traced
back to `find .` alone, at minus 12.6 million tokens of destroyed payload.

v0.6.2 replaced it with lossless prefix factoring, where the shared directory
prefix is hoisted into a header and each path is stated once relative to it, cut
at a separator so every path round-trips byte for byte. The honest saving on the
same output is about **72%**, with nothing lost. We would rather publish 72% and
mean it.

If you are reading the archive in order, read the [v0.6.2
note](/blog/omni-update-v0-6-2-format-safe-compression) next. It is the release
where we went back over every number we had published and replaced the ones we
could not reproduce.

---
title: "The work was done and thrown away: v0.7.7"
description: "One OMNI plugin spawned the hook, waited for the answer, and read a key OMNI had stopped emitting two releases earlier, so 74.7% was removed and discarded on every tool result for the whole life of that plugin. Plus a report that never read its biggest engine, a field that called an estimate an actual count on all 16,405 rows, a failing terraform validate rendered as a clean plan, and folds that can finally sit in the middle of a file."
date: 2026-08-24T05:00:00Z
tag: Release Note
author: OMNI Core Team
---

Most of this release is OMNI catching itself. Not catching bugs in other people's
tools, catching the places where it had been quietly telling you something that was
not so, or doing nothing while reporting that it had done something.

## The work was done and thrown away

The Pi plugin ran the hook on every tool result. It spawned the process, handed over
the payload, waited for the answer, and then read `hookSpecificOutput.updatedResponse`
out of the reply.

OMNI stopped emitting that key in 0.6.5. It emits `updatedToolOutput`.

So the value was always `undefined`, the handler always returned `undefined`, and Pi
received the raw output every single time. Measured on a real payload rather than
reasoned about: 29,099 bytes went in, and the answer that came back and was discarded
carried 7,365. **74.7% removed, then dropped on the floor, on every tool result for
the whole life of that plugin.**

The plugin's own type declaration named the wrong key too, which is why its
TypeScript check passed for months. The contract was wrong in the one place that
would otherwise have caught it.

This is the same mistake as an older one, and the older one's epitaph is still in the
source three lines above the fix. The Rust side has asserted since then that it
writes `updatedToolOutput`. Nothing had ever asserted that anyone reads it, and that
was always the boundary that mattered. A check now scans every plugin that spawns the
hook and fails unless it names the key OMNI actually writes.

## The report could not see its own biggest engine

OMNI removes bytes two ways. A distiller shortens one command's output. A ledger
folds away lines you have already been shown in this project, across turns, so the
second `Read` of a file is mostly markers.

`omni stats` computed everything from the distiller's table and never read the
ledger's. Over one week on the machine that found it, the distiller removed 309 KB
and the ledger 501 KB. The report showed the first number and not the second, and
showed it as 4.5%, because that percentage was the distiller's saving divided by the
15,000 calls OMNI had deliberately declined to touch.

The default view is three lines now, one per engine, each percentage against its own
base, and the calls OMNI declines are shown as a count with a zero beside them rather
than averaged into a number that reads as failure.

Two ratios from two different populations are never added. Bytes may be summed;
percentages may not.

## A field whose whole job was to qualify a number

`omni stats --json` reports `measurement_method` next to every token figure, so a
reader knows how far to trust it. It chose between `actual` and `estimated` by
testing whether a token count was above zero. That column has exactly one writer,
and the writer is an estimator, so the test was never false.

Every one of the 16,405 rows ever recorded said `actual` for bytes divided by a
constant calibrated against a vocabulary that is not even Claude's.

It says `estimated` now, and a check scans the reporting surfaces and fails on the
literal.

## Two that could have cost you an afternoon

A failing `terraform validate` came back rendered as a clean plan. The summariser
counted a created resource for any line containing "will be created", and
terraform's own error prose contains that phrase.

And twenty-three places cut text at a byte index. Any output with a multi-byte
character in the wrong position could panic the hook.

## The win

A fold can sit in the middle of a `Read` now rather than only at its edges, because
the folded view keeps the file's line count and the editor's numbering stays true. On
the corpus that measured it, that class went from 27.3% to 82.3%.

And `omni init` finally tells you what a host lets OMNI do. Configuring a host with
no hook used to print the same green tick as a host with one, and you found out from
an empty report days later.

```
brew upgrade omni
```

---
title: "Sixteen tools nobody ever called: v0.7.6"
description: "OMNI advertised 25 MCP tools to your agent on every turn and 16 of them had never been called in 229 sessions. Removing them takes 4,940 bytes off the prefix of every request. Plus a kubectl table that came back with seven pod names deleted, line numbers that lied under a fold, and a marker that claimed you had already seen bytes you had not."
date: 2026-08-17T10:00:00Z
tag: Release Note
author: OMNI Core Team
---

Most of this release is OMNI taking weight off itself, and the rest is OMNI
retracting things it had been telling your agent that were not true.

## The tool list was the biggest thing OMNI was sending

A tool definition is not like command output. Output arrives once, in the middle
of a session, and is read on the requests that follow it. A tool definition sits
in the prefix: it is sent before the first turn and re-read on every turn after,
which on this machine's median session means about 258 times.

OMNI advertised 25 MCP tools. Counting invocations across 229 recorded sessions,
16 of them had never been called once. Not rarely. Never.

They are gone, and the surface went from 7,912 bytes to 2,972.

```
mcp prefix, per request

  0.7.5   7,912 B
  0.7.6   2,972 B   4,940 B lighter
```

That is measured from the server itself rather than estimated, and it is the
release's real performance change. Nothing about it is clever. A token-efficiency
tool had been spending more of your context on describing itself than most of the
commands it was compressing ever saved.

## A kubectl table came back with the answer deleted

`kubectl get pods` on a 10 row table was arriving as three lines, reported at
73.5% saved, with seven pod names gone.

A summariser had been written for that table long ago and had been shadowed ever
since by the pattern-matching layer that ran ahead of it. Retiring that layer in
0.7.4 made it live. Nobody noticed, because from the outside a saving that large
looks like the tool working.

It is the defect this project exists to fight, in our own code: a large number
bought by deleting the thing the command was run to find out. A count of pods
cannot be turned back into a pod name. `kubectl get pods` now reads 0.0% and
keeps every row, and the saving that remains on infra output is the ledger folding
a listing your agent has already been shown.

## Line numbers under a fold were wrong

When the ledger folds a repeated run out of a `Read` result, every line below the
marker shifts up. The host numbers those lines from where the read started, so
they kept counting as though nothing had been removed, and a fold in the middle of
a file made every number under it point at the wrong line.

An agent that then edits `foo.rs:214` edits the wrong line, confidently.

The rule is deliberately narrow rather than clever. A fold is allowed only when
what survives is one block running to the end of the payload, which makes the
lines above it a plain subtraction and means nothing has to be searched for.
Everything else refuses, including shapes that could be corrected in principle,
because the alternatives all involve searching the view for the survivors' text,
and that text can match inside a marker.

A refused fold costs bytes. A wrong line number costs an edit in the wrong place.

## Markers that claimed the wrong thing

Three separate ways OMNI told your agent something it could not support:

**"From an earlier session"** appeared on content from a different project that
this session had never been shown. It reads as *you have seen this*, so an agent
would skip retrieving it. The two cases now have different wording.

**A subagent** was told the parent's bytes had already been shown to it. A freshly
dispatched subagent has an empty context and had received none of them. Scope is
now keyed per agent, not per session.

**Following a marker returned the marker.** `omni retrieve <handle>` on a folded
`Read` handed back the fold, so the one escape hatch out of a fold looped back
into it.

## What did not change

The savings percentage.

The command path measures flat against 0.7.5, and the `Read` path is 0.22 points
behind, because it now refuses the folds that renumber your lines. Correct line
numbers are worth more than four folds on a mixed corpus, and that trade was made
on purpose.

If a release note tells you a tool got 5% better, ask what they measured. This one
got 4,940 bytes lighter per request and slightly worse at one ratio, and both of
those are the same decision.

```bash
brew upgrade omni     # or: omni update
```

Everything above replays from
[the benchmark method](/docs/develop/benchmarks) on your own history.

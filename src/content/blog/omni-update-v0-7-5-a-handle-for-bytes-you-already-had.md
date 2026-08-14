---
title: "A handle for bytes you already had: v0.7.5"
description: "Four whole-output folds saved 2,680 bytes and spent four extra round trips handing back the same content, so a fold that covers everything now needs 1024 bytes. Plus an MCP call that could hang until the host gave up, a changelog entry that vanished because of its file extension, and the manual in Indonesian."
date: 2026-08-14T12:00:00Z
tag: Release Note
author: OMNI Core Team
---

A release about handles that were not worth issuing, an entry nobody counted, and
a manual that advertised seven languages and delivered one.

## The fold that saved 2,680 bytes and cost 2,999

Every floor in the ledger asked the same question: does this run of repeated lines
outgrow the marker replacing it. That is the right question when the fold is
partial, because the agent keeps the rest of the output beside the handle and can
decide for itself whether spending a retrieval is worth it.

It is the wrong question when the fold covers the whole output. Then there is
nothing beside the handle, so needing any part of the payload costs a round trip
the agent had no say in.

The corpus on this machine says exactly that. Every whole-output fold recorded
after 0.7.4 went in was under 1 KB, and four of the four were retrieved within
nine seconds, against a 0.85% retrieve rate across all 5,178 distillations in the
same store. Those folds saved 2,680 bytes, then spent 319 bytes of marker plus
four extra tool calls handing back the same 2,999.

A whole-output fold now needs 1024 bytes of input or the run passes through
verbatim. The floor is the top of the measured range rather than a knee: nothing
above it was observed going either way, so it covers what is known to lose and
leaves the rest folding. n=4, one machine, one window.

## An MCP call could hang until the host gave up

Reported from Cursor on Windows: some Git commands came back as
`MCP error -32001: Request timed out` after 120 seconds, while the same command
took 397 ms in PowerShell. Three separate defects in one spawn, and none of them
was Windows-only.

`omni_run` drained the child's stdout to EOF and only then read stderr, so a child
that fills the stderr pipe buffer before closing stdout blocks forever and takes
the reader with it. Reproduced on macOS with 200 KB of stderr; the buffer is 64 KB
there and around 4 KB on Windows, which is why Windows saw it first.

The child also inherited the server's stdin, which is the JSON-RPC pipe to the
host. One byte read from it breaks the framing for the rest of the session, so
every later call fails whatever it asks for.

And nothing bounded the child, on a blocking call sitting on a runtime worker. One
hung command took the thread serving everything else, which is the shape of a
report where three calls succeed and everything after them times out. There is a
60 second deadline now, `OMNI_RUN_TIMEOUT_SECS` raises it, the work moved off the
worker, and a timeout says which command stalled instead of returning the host's
error code.

The reporter's own `git --version` case is not explained by any of that. It writes
about 25 bytes and nothing to stderr, so that half stays open.

## Two numbers nothing was reading

`tools/list` answered 25. `CONTRIBUTING.md` said 26 tools, and both manuals
repeated it in the one paragraph whose whole point is to count rather than trust a
written number. The guard that checks documented counts against the code passed on
all six occurrences, for two reasons that are about reach: it walked the two books
and the README, so `CONTRIBUTING.md` was invisible to it, and its pattern matched
the English noun, so every count in the Indonesian manual went unchecked.

The same shape, one directory over: changelog entries are files now, and
`changelog.d/544.fixed.txt` was counted by nothing and folded by nothing, because
both the counter and the release script required a `.md` extension and so agreed
to ignore it. `omni doctor` reported no outstanding entry and the cut printed
`No fragments`. Anything in that directory that is not the README and is not
hidden is an entry now, on both sides, so there is no extension left for the two
to disagree about.

## The manual reads in Indonesian

The language switcher shipped in 0.7.3 with seven entries, every one of which left
the manual for a README on GitHub, because the manual itself was English only. It
advertised seven languages and delivered one page in each.

Twenty-seven pages are now translated and served at `/docs/id/`. The developer
pages are deliberately not: those seven change fastest and are read by people
about to send a patch, so an Indonesian copy of them would be wrong more often
than useful. One page says so and links the originals.

No second `book.toml` and no new dependency. mdBook reads its configuration from
the environment, so the build renders the same book twice with a different source,
language and output directory.

## Rows for a decision that is not being taken yet

`ledger_lines` records that a line was seen. It cannot say a marker was ever issued
against it, under which scope, or whose bytes it replaced, which means the value of
cross-agent reuse was unrecoverable from the corpus after the fact. The multiplier
that prices that case was calibrated on something else entirely.

`ledger_folds` now takes one row per marker, so the query that settles whether the
project scope stays shared is a `GROUP BY` rather than a replay. The decision
itself is deliberately not in this release. Choosing between two unmeasured options
early is the thing this project keeps refusing to do.

Full notes are in the
[0.7.5 changelog](https://github.com/fajarhide/omni/blob/main/CHANGELOG.md).

```
brew upgrade omni     # or: omni update
```

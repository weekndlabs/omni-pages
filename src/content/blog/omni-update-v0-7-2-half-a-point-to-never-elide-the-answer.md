---
title: "Half a point to never elide the answer: v0.7.2"
description: "The ledger folded a TypeError because the session had seen it before, so a re-run of a broken script arrived with no error in it. Refusing to fold the error channel costs 0.5 points of aggregate, 15.4% to 14.9%, and that is the published figure now."
date: 2026-08-12T08:45:00Z
tag: Release Note
author: OMNI Core Team
---

The release that stopped four published numbers from being wrong, and paid 0.06%
to stop the ledger claiming a sighting it never had.

## A re-run of a failing script came back with no error in it

The ledger folded a `TypeError` and its stack frame because both lines had been
shown earlier in the session, so the second run of a still-broken `bun` script
reached the model as source context and nothing else. An agent re-running a
command to check a fix reads that as the failure being gone.

It is the fabricated-success mode, reached through cross-command dedup rather
than through a distiller mislabelling its own surface, which is why it can hit
**any** command whose error text recurs. The reporter could not reproduce it
synthetically and said so rather than guessing. The real payload was still in
`execution_traces` and reproduced it exactly.

**The heuristic is sound for informational lines and wrong for the error
channel.** Repetition is the signal there: the same `TypeError` appearing again
means the bug is still there, and that is the line worth spending tokens on. The
ledger marks any line the scorer recognises as carrying a failure unfoldable, so
it survives verbatim and the run splits around it, leaving the repeated frames
either side still foldable.

That predicate is the scorer's own, exposed rather than copied. Two copies of one
rule drift, and only one of them gets reported.

**The second layer is what makes this the last time.**
`pipeline::fidelity::preserves_failures` is a post-condition. Every invariant in
this pipeline constrains what a stage is *given*, and none asked what came *out*.
If the input stated a failure and the reply no longer does, both entry points
hand the bytes back. It catches stages that do not exist yet.

**The cost is 0.5 points of aggregate, 15.4% to 14.9%**, and markers rise from
772 to 817 because runs now split around error lines. That is the trade, stated
rather than buried: half a point to never elide the answer.

## The published 15.4% did not reproduce on the shipped code

Re-replayed over the same 6,656-trace corpus, the aggregate is **14.9%**, and
every class carrying ledger folds moved with it.

| class | published | measured on 0.7.2 |
|---|---|---|
| aggregate | 15.4% | **14.9%** |
| file reads | 26.3% | 25.2% |
| git | 22.9% | 22.3% |
| search | 13.5% | 13.3% |
| build and test | 78.3% | 78.0% |
| other | 7.1% | 6.8% |

The cause is the error-channel fix above. What rules out a different corpus: the
rtk arm reproduced its published figure to the byte.

Two errors of a different kind went with it. The README named the window as
2026-08-03 to 08-10 while the corpus covers 08-04 to 08-11, so a reader taking
the window at face value could not have reproduced anything. And the derived
"12.7 points on top of our filters, 11.9 on theirs" was left behind by an earlier
recomputation. It is 12.2 and 11.4.

## A folded run was recorded as shown, so the next fold lied about it

A run replaced by a marker never reached the context, but every line of it was
written into the session scope anyway. The next occurrence in that session read
as session-origin and said `already shown` about bytes the session had only ever
seen as a pointer.

The wording is the smaller half. A project fold is charged three times the floor,
because the agent has no say in a retrieval it may have to pay for on content it
has never seen; a session fold is free. Mislabelling the second sighting dropped
the bar from 450 bytes to 150, so **the false claim made the ledger three times
more willing to fold, on a premise that had just stopped being true.**

**Telling the truth costs 0.06%, measured.** Over the corpus the ledger arm moves
from 5,502,733 to 5,506,627 bytes, with 814 session and 95 project markers where
it was 817 and 90. The aggregate still rounds to 14.9%.

## A second competitor in the benchmark

The head to head had one competitor, so it answered "which of these two" rather
than "how does this compare". Over 6,656 traces: **omni 14.9% with the ledger,
rtk 6.2%, lean-ctx 6.1%.**

**rtk and lean-ctx land a tenth of a point apart from opposite shapes**, rtk
averaging 461 bytes off each of 872 commands and lean-ctx 2,950 off each of 134,
which the aggregate hides entirely.

Two absences are printed rather than left to be inferred: no `lean-ctx + our
ledger` row, because its preview reports byte counts and never emits the
compressed text, and no headroom arm, because its equivalent is a
whole-conversation deduplicator that belongs against the ledger rather than the
filters.

## The benchmark reported a floor the code does not use

`bench_replay` printed `floor_mult=6` while the ledger applied a multiplier of 3.
The 6 was correct when it was chosen as a starting point and stayed behind when
the replay moved the arm. Not a wrong measurement, a wrong label on a real one,
on the line anyone tuning the floor reads to confirm which arm they just ran.

`OMNI_PROJECT_FLOOR_MULT` is gone with it: nothing in `src/` ever read it, only
the harness's own `println`, so setting it relabelled the output without moving
the arm.

## Every id selector in the manual's theme was dead

mdBook 0.5 prefixes its ids with `mdbook-`, and the theme targeted the old names,
so `#sidebar`, `#menu-bar`, `#searchbar`, `#searchresults`, `#theme-list` and the
three theme entries matched nothing: **8 of 8**. The palette survived because
`.light` and `.navy` are class selectors, which is exactly why it went unnoticed.

It also meant the rule hiding the three themes this design does not cover never
fired, so Coal, Rust and Ayu were live in the picker rendering in mdBook's
colours.

Separately the manual linked home from nowhere: 37 pages, zero links back to the
site serving them, so `Docs` in the site navbar was a one-way door.

## Two more that a green matrix could not see

**CI never compiled `plugins/pi`.** `make ci` is all Rust, and nothing ran `tsc`
or `npm` against the extension Pi actually loads, so a TypeScript **major** bump
merged on a green matrix. The bump was fine, and the matrix could not have said
either way.

**`omni stats --detail` named an agent it had never resolved.** On a database
whose every row was `claude_code`, 9 of the 10 rows in By Command were labelled
`Terminal`, while Agent Distribution three lines below reported
`Claude Code 100.0%`. One command contradicted itself on one screen. Two
shortenings a single column apart, 18 against 19, so every command whose prefix
ran past 18 cut at a different place on each side and the lookup missed.
`.unwrap_or("Terminal")` then reported the miss as a fact. A miss says `Unknown`
now.

## Relicensed from MIT to Apache 2.0

`LICENSE` is the verbatim Apache License 2.0, with a `NOTICE` file carrying the
copyright, since section 4(d) only has effect when one exists. Apache 2.0 adds an
explicit patent grant from contributors and requires a redistributor to state
what they changed.

It does **not** restrict copying. It is permissive in the same way MIT is, and a
fork may still close its source. That is recorded here so nobody later relies on
a protection it does not provide. Releases up to and including 0.7.2 were
published under MIT and that grant is irrevocable for the versions it covered.

```bash
brew install fajarhide/tap/omni && omni init
omni stats
```

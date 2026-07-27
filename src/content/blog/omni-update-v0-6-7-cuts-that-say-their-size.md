---
title: "Every cut now says how much it cut: v0.6.7"
description: "A truncation that hides its own size is a lie by omission. v0.6.7 makes six of them state the count, and removes three more invented verdicts."
date: 2026-07-27
tag: Release Note
author: OMNI Core Team
---

v0.6.6 was the release where we audited the distillers and found them inventing
verdicts and deleting answers. v0.6.7 goes one stage later, to what happens after
a distiller returns and something cuts the output anyway because it is still too
long.

OMNI is a lossy tool, so cutting is part of the deal. What breaks the deal is a
cut that will not say how big it was. To the agent reading it, a short
well-formed answer and a truncated one look identical.

## The cuts that would not say their size

**`ps aux` lost 416 of 556 rows behind four words.** The last stage of both hook
paths truncates at 50 KB and appended `[OMNI: output truncated]`. That marker
states *that* bytes went and never how many, so a two-line cut and a
four-hundred-line one read the same. Measured: 556 rows and 133,033 bytes came
back as 140 lines and 50,274 bytes, under a footer reporting **62.2% saved**.
That figure was 416 deleted process rows, not noise removed. The same command now
ends `[OMNI: output truncated, 192 of 535 lines kept]`, and the two copies of that
block are one function with the cap living beside the other thresholds.

**A filter's `max_lines` cut the tail with nothing at all in its place.** Twenty
five shipped TOML filters carry a line cap, and it was enforced with a bare
truncate. `ruff check .` over 200 findings came back as 50 rows ending mid-list
at `src/mod_49.py`: 150 findings gone, no marker, nothing in the output to
suggest anything was missing. It now ends
`[OMNI: 150 lines omitted by max_lines=50]`.

## Three more invented verdicts

**A `python3` script's 40 data rows became one line, booked as 95.7% saved.**
v0.6.6 routed `python`, `python3` and `ruby` to verbatim passthrough, because a
bare interpreter runs an arbitrary program whose stdout *is* the answer. A
passthrough returns its input, so it can never beat the savings guardrail, and
the hooks read that as a distiller giving up and fell back to collapse. Forty
distinct rows became
`[40 similar lines collapsed] (pattern: "row #: value=# status=active region=ap-southeast-#")`.
The `#` is where every number was. Those rows now come back at 2,133 bytes and
0.0% reduction, with `value=273` still in them.

**`sqlite3 db ".schema"` came back as `DB: ok (3 lines output)`.** The generic
database path collected only critical-tier lines, found none, and answered with a
health verdict for a question nobody asked. `ok` appears nowhere in the input. It
is invented in the success direction, and 100% of the schema was gone. It now
fails open and returns the dump byte for byte.

**A fully green `cargo test` run was reported as having failures.** cargo's
*passing* tally reads `test result: ok. 479 passed; 0 failed`, and a substring
match on "failed" matched it. In a workspace, where cargo prints one tally per
target, sixteen green tallies were filed as failure details and the output ended
`... 7 more failures` on a run that exited 0. A test *named* after failure was
caught by the same match. This is the highest severity shape we ship, because the
reader acts on it and is wrong.

Plus one that is only cosmetic until you rely on it: `omni stats` padded its
columns to widths written into the format string, and the counters outgrew them,
so every column shifted on rows with a `1,226` or a `3296x` in them. It now
measures before it pads.

## What we did not fix

Both cuts above still hand back no rewind hash, so the marker tells you how much
went and not yet how to get it back. That is the larger half of its ticket and it
stays open. The reported reduction also still counts deleted rows as a saving,
which is its own defect with its own number. This release makes the loss legible.
It does not make it smaller, and we are not going to describe it as though it did.

Upgrade with `brew upgrade fajarhide/tap/omni`, or `omni update`.

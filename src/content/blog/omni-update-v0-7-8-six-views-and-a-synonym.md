---
title: "Six views and a synonym: v0.7.8"
description: "omni stats advertised seven views and two of them were the same thing. A flag documented for a table view reached one of three. Two views had never been given the frame the others wear, and one of them dropped the period label into the middle of a sentence. Plus a new report that answers where your tokens went, from data OMNI was already recording."
date: 2026-08-26T05:00:00Z
tag: Release Note
author: OMNI Core Team
image: /media/omni-0.7.8.png
imageAlt: "OMNI v0.7.8 release card, headed Six views and a synonym, with three figures: 161 rows down to 2 for --limit 2, 7 views offered down to 6, 3 frames drawn down to 1"
---

This one came out of reading `omni stats` closely instead of running it. The report
had grown a view at a time, and nothing had ever gone back to ask whether the pieces
still agreed with each other.

## Seven views, six of them distinct

`omni stats --help` offered seven values for `--view`. Two of them, `commands` and
`detail`, produced byte-identical output: the renderer mapped both to the same arm and
nothing downstream ever read which one had been named.

The code said otherwise. A comment above the command table read "`--view commands`
keeps the ratio ordering, because there the ratio is the subject". Nothing implemented
it. An earlier release had moved that table to byte ordering, and its review had moved
the other spelling to match on the grounds that one table gets one ordering. The
comment was what got left behind, describing a distinction the code no longer made.

`commands` still works and is no longer advertised. A test now walks the values the
help offers and fails if two of them reach the same renderer.

## A flag documented for "a table view"

`--limit` is described as "Rows in a table view, default 10, 0 for all". Three views
render a table. One of them read the flag.

`omni stats --view projects --limit 2` printed 161 rows, which is exactly what it
printed with no flag at all. There is now one reader for `--limit`, `--limit 0` and
the older `--all-commands`, and all three tables use it. A table that cuts rows says
how many it hid, rather than stopping silently at ten and reading like a table with
ten rows in it.

## Five views, three frames

The default and detail views drew a rule above and below their title. `--view context`
still said "OMNI Signal Report: Context", a name the other views had stopped using.
`--view projects` and `--view rerun` drew no rule above at all, and projects folded the
period label into the middle of a sentence:

```
  OMNI Project Analytics, last 30 days Breakdown
```

One printer draws all of them now.

```
 OMNI · last 30 days
 OMNI · detail · last 30 days
 OMNI · projects · last 30 days
 OMNI · rerun · last 30 days
 OMNI · context
```

`context` carries no window because it reads the live session rather than a period,
which is also why it had been quietly ignoring `--since`. So were `--share` and
`--card`: both accepted the flag and threw it away, so `--since week --share` printed
the all-time card byte for byte. They honour it now, and the line names the window
either way, because a percentage whose population the reader cannot see is the defect
this project spends its changelog arguing against.

## Two blocks that never lined up

The default view stacks the engine rows and the heaviest command classes. Each block
sized its own columns, so the byte column of the second sat two characters off the
first. They share one geometry now. The test asserts the shared right edge rather than
any single width, and it was driven red by unpadding each of the two columns in turn.

## Where the tokens went

The larger addition is `omni context --tokens`, which breaks a context down by class
from data OMNI was already recording and never showed you. It says plainly what it
cannot answer, too: OMNI sees what passed through its hook and never sees the prompts,
the system block or the tool definitions, so it reports the share of what it touched
rather than the share of your context.

## The numbers did not move

1.4% from the filters, 5.1% with the ledger, 24.1% of the available repetition
captured, over the same 9,478 traces. Every figure is byte-identical to the 0.7.7 run:
the two benchmark artefacts differ only in the version string and in `dirty_tree`,
which was true for 0.7.7 and false here.

0.7.8 changed no distiller, so a flat result is the expected one rather than a
coincidence. The useful part is the second half: 0.7.7's figures were taken with
uncommitted changes in the tree, and this clean-tree run reproduces them exactly.

`brew upgrade omni`.

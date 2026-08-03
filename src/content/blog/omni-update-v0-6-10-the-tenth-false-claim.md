---
title: "The tenth false claim of the same shape: v0.6.10"
description: "pip list came back as Build: ok. The guard that prevents exactly this had existed for four releases and was optional, so nine distillers had quietly skipped it."
date: 2026-08-03T08:47:05Z
tag: Release Note
author: OMNI Core Team
---

`pip list` prints a table of installed packages. Through OMNI it came back as:

```
Build: ok
```

Nine bytes, reported as a 99% reduction, describing a build that never
happened. That is the tenth defect of this exact shape this project has
shipped, and 0.6.10 is mostly the work of admitting that counting them was not
fixing them.

## The guard was optional

Issue #143 added a zero-state guard in June: `require_parsed(parsed, input,
summary)` returns the raw input when a distiller recognised nothing, instead of
letting it emit a confident summary of nothing.

It was a function a distiller could choose to call. Most did not.

So the guard was correct, tested, and bypassed. `BuildDistiller` reached its
success string without ever having seen a compile step, because nothing forced
it through the check. The fix in this release is not a better guard, it is
making the guard unavoidable: `distill` returns `Option<String>` now, and a
distiller that parsed nothing returns `None`. There is no longer a code path
where a summary and an empty parse can coexist.

That is the difference between a rule and a type. A rule is followed by whoever
remembers it.

## The other things that were being deleted

Once the type was in place, the same class of bug surfaced across five more
commands, each of which had been quietly reporting a saving:

- **A green `npm test` came back as its own echo line** (#310), verdict removed.
- **A `kubectl` listing lost its whole tail**, and the marker that is supposed to
  say how much went undercounted it (#301).
- **`make` is a composite runner** and one distiller was answering for whatever
  it happened to invoke (#129).
- **The eslint distiller reported how many problems there were and never where**
  (#108). A count without a `file:line` costs a re-run, which makes it
  token-negative.
- **A background thread printed OMNI's own console text into a piped payload**
  (#312), so the bytes a caller parsed had our logging mixed into them.

And the reverse failure, which is easy to miss because it looks like nothing
happening: **a declined composite buffer was handed back byte for byte, so 25 of
45 composite runs saved exactly nothing** while being recorded as handled
(#291).

## Two things were slow for no reason

The latency work started here and it is not clever. It is deleting work that
was never needed:

1. **A GPT vocabulary was being loaded on 64% of hooked commands** to fill one
   column in a report (#283). The tokenizer is now built only when that column
   is actually printed.
2. **249 line-filter regexes were compiled on every single command** so that at
   most one filter's set could be used (#283). They compile when their filter
   matches.

## Also in 0.6.10

- **Five direct dependencies removed** that nothing in the tree references
  (#174), and **246 lines of surface** that had to be read, compiled and
  maintained without ever being called (#251).
- **The test suite stopped writing auto-learned filters into the developer's
  live `~/.omni`** (#307). A test run was mutating the machine it ran on.
- **`Cargo.toml` stopped shipping the one claim its own README argues against**
  (#252).
- **Six subcommands stopped swallowing flags they did not know** and reporting
  success (#151). `omni init --curser` used to exit 0 having installed nothing
  you asked for.
- **protobufjs DoS advisory cleared** in `plugins/pi` (#139).

## What this release cost us

Every fix above makes OMNI report a smaller number. `kubectl get pods` went from
9.3% to 0%, because a pod table is an enumeration where every row is a datum and
there is nothing in it to drop.

Losing that 9.3% was the fix. If you are comparing tools in this category, the
figure worth asking for is not the headline percentage. It is the share of
commands where the tool declined to act, and whether the vendor knows it.

```bash
brew install fajarhide/tap/omni && omni init
```

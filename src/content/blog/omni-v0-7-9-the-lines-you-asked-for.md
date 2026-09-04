---
title: "OMNI v0.7.9: The Lines You Asked For Stay On Screen"
description: "A tail -5 used to come back as a marker with none of its five lines. The line budget is read per command now, a re-run tells you the value did not change, and we corrected our own benchmark downward."
date: 2026-09-04
tag: Release Note
author: OMNI Core Team
---

If you tell a shell exactly which lines you want, those lines are the answer, not the background. OMNI did not always agree. A `tail -5` could come back as a retrieval marker with none of its five lines, and the reply that survived looked complete enough that you would not go looking for the rest.

That is fixed, and it is fixed at the level it should have been fixed at the first time.

## What you get

The line budget is read per command now, not per reply. `tail -5`, `head -20`, `sed -n 60,200p`, and the extremely common shape of a `cd` on one line and the read on the next, all keep their lines. That last case was the biggest one: agents write multi-line commands constantly, and the guard could not see past the first line.

Running the same command twice now tells you the output is unchanged, instead of putting it behind a handle and saying you have already seen it. If you are polling a value to watch it move, the fact that it did not move **is** the answer. A marker that says `identical to an earlier run` gives you that in one line. A marker that says `already shown` makes you go and fetch it.

A fold never replaces a whole reply any more, so there is always something left to read around. And switching branch or landing a commit does not reset what OMNI knows you have seen. Your prompt cache resets on both. The ledger is keyed on the repository, not the snapshot, which is one saving the cache structurally cannot make.

## We corrected our own number, downward

Our benchmark replayed a frozen corpus of 9,478 real commands through the ledger without ever telling it which command produced the output. Every rule the ledger has that reads the command was therefore switched off during measurement, while running normally for everyone using it.

So the published figure was flattering and wrong. Corrected, the ledger arm reads **3.0%** where we had published 4.9%, and file reads read 1.5% where we published 4.3%.

Nothing got slower or saved less. The measurement stopped counting folds that the shipped code refuses to make. We put the attribution on the benchmarks page: naming the source costs 1.3 points, the line budget 0.4, and every one of those points buys a fold that should not have happened.

That is the trade this project keeps making. A number you cannot reproduce is worth nothing, and a saving that deletes the answer is worth less than nothing.

```sh
brew upgrade omni
```

Every figure above replays on your own history: `make bench` over your own corpus, and the full picture including the unflattering half is on the [benchmarks page](https://omni.weekndlabs.com/docs/develop/benchmarks).

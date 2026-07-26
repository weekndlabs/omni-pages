---
title: "The release where we caught OMNI lying — v0.6.6"
description: "A self-audit found OMNI fabricating success (Build: ok, Tests: 0 passed) and dropping the answer on find, ls and git log. v0.6.6 fixes seven of these, and ships a committed benchmark so the published number can't drift again."
date: 2026-07-26
tag: Release Note
author: OMNI Core Team
---

OMNI is a lossy tool. That is the deal: it drops noise from your terminal so your
agent reads less. A lossy tool you can trust has one job it can never fail —
**it must not invent, and it must not delete the answer.** v0.6.6 is the release
where we audited OMNI against that job, found it failing in seven places, and
fixed them.

We are writing this the way we'd want a tool we depend on to write it: with the
wrong output quoted, not summarised.

### Two failure shapes

A distillation can go wrong in two ways, and we found both.

**It fabricated success.** A `python3 -c "…"` or `ruby -c …` script that printed
no error came back as `Build: ok` — a string that appears nowhere in the real
output, invented in the success direction. A test-shaped command with no test
results came back as `Tests: 0 passed, 0 failed`. On a real GitOps verification,
`Build: ok` would have reported a passing check for a broken manifest. An agent
acts on that and is wrong.

**It deleted the answer.** Run `find`, `ls`, or a verbose `git log` and every
line *is* the answer — there is no noise to drop. OMNI was "compressing" them
anyway: `find` returned 30 of 98 paths, `ls -la` replaced every filename with a
count, `git log -12` came back with 2 of 12 commits. High reduction on those
commands was never a win. It was the bug.

### What v0.6.6 fixes

- **No more invented verdicts.** `python`/`ruby` scripts and unparsed test output
  now pass through verbatim instead of `Build: ok` / `Tests: 0 passed`. A
  distiller that recognised no signal returns the raw output — it never guesses in
  the success direction.
- **Enumeration commands are left alone.** `ls`, `find`, `ps`, `wc`, `df`, `env`
  and friends are lists of data, not noise, so OMNI now hands them back
  byte-for-byte instead of truncating them to a shorter, plausible, incomplete
  list.
- **Verbose `git log` keeps every commit.** It now distils to one `hash subject`
  line per commit — the `--oneline` view — so all of them survive while the
  `Author`/`Date`/body noise goes.
- **`git log --oneline` keeps its subjects**, and the JS/TS and TOML paths stop
  dropping lines or picking a filter by accident.

Seven fixes in all, and every one of them makes the reported saving *smaller* on
the commands where the old number was a lie. We think that is the right direction
for a number to move.

### A benchmark you can run

The headline on our site — **58.9% fewer bytes across 1,810 real commands, with
63.6% of calls saving nothing at all** — used to come from a run nobody kept.
v0.6.6 ships the reproducer: a committed replay that reads real command traces,
runs each through the current pipeline, and refuses to count a failed or empty
replay as a saving. The number is now a fact about the shipped binary, not a
screenshot.

We also wrote down, in the repo, exactly where OMNI wins and where it should stay
out of the way: it earns its place on `cargo test`, `terraform plan`, `git log`,
build logs — output that is a verdict wrapped in noise. On a file listing or a
process table it now does nothing, on purpose.

### The standard

Every compressor asks you to trust that what it cut didn't matter. We hold OMNI to
the harder version of that promise: the original is always recoverable, and the
tool never lies to your agent. v0.6.6 is us checking our own work against that
promise and shipping the corrections in the open — measured evidence, the wrong
numbers we published, and the fix, for each one.

Upgrade with `brew upgrade fajarhide/tap/omni`, or `omni update`.

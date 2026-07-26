---
title: "Measuring what reduction cannot see: OMNI v0.6.4"
description: "v0.6.4 adds a re-run metric reduction cannot fake, stops omni stats counting savings the host threw away, and fixes eleven ways OMNI could invent a result."
date: 2026-07-23
tag: Release Note
author: OMNI Core Team
---

Reduction percentage counts bytes removed. A distiller that emitted an empty
string for every input would score 100%, and until this release nothing in the
pipeline penalised that. v0.6.4 is largely about building the instruments that
can see the difference, then using them.

## `omni stats --rerun`, the metric reduction cannot fake (#109)

If a distillation deletes something the agent needed, the agent runs the command
again. That repeat is the honest signal, and it is invisible to a reduction
percentage. The new mode counts it: **the same command, in the same session,
within 300 seconds of reading its distilled output.**

No new instrumentation was needed. `session_id`, `ts`, `command` and `route` are
already on every `distillations` row, so the metric answers over 28 days of
history already collected rather than starting a clock now. `route` also supplies
a control arm for free, because `Passthrough` rows are commands whose raw output
the agent read, so the two arms differ only in whether OMNI changed what was
read.

Measured on the maintainer's store, 6,682 distillations across 19 sessions:

- `npm`: **48.4% re-run rate distilled against 8.0% raw, +40.4pp.** The agent had
  to run it again on nearly half the calls OMNI touched.
- `sed`: +15.1pp.
- `grep`: +9.8pp.
- `git`: -0.4pp, which is the shape you want. OMNI changed what was read and the
  agent did not need the rest.

Two guards keep the metric from becoming the defect it hunts. **The arms are not
always the same population**: distillation only fires on large output, and
`kubectl` averages 244,606 bytes distilled against 115 bytes raw, a 2,127x skew
that compares `get -A` dumps against one-line config reads. Its +48.6pp is input
size, not lost signal, so any filter past a 3x skew limit prints `n/a` and is
listed as a caveat rather than a finding. **Pre-fix Claude Code rows are
excluded**, because on that path nothing was ever applied, so their treatment
rows are controls wearing a treatment label. That is not cosmetic: `grep` reads
+9.8pp with them excluded and +0.0pp with them included. A filter needs 8 rows on
each arm before its delta is reported at all.

The net scoring and adaptive fallback that #109 also proposed are deliberately
not shipped. Feeding a guard from a metric with known confounds is how a
measurement bug becomes a distillation bug, so the metric gets watched for a
release first.

## `omni stats` was counting savings the host threw away (#163)

Every `distillations` row written by Claude Code before the #158 fix records a
distillation that was computed, scored, routed, stored, and then dropped by the
host. The agent read the raw bytes. Those rows sat in the same sums as the
`omni exec` and pipe rows, where the same numbers are true, and nothing in a row
says which binary wrote it.

Same database, both binaries. Released 0.6.3 reports `claude_code 2550 calls,
30.2%`. This build reports **`claude_code 237 calls, 44.6%, unverified=2313`**.
`aider`, `terminal` and `codex_cli` are unchanged at `unverified=0`, so the
cutoff touches only the path that was broken.

The issue predicted the honest figure would come out lower and would need
explaining as a correction. On this data it goes **up**, 66.9% to 69.4% overall,
because the discarded rows averaged 29.2% and were dragging the mean down. What
falls is volume: 6,728 calls down to 4,415, **a 34% drop**. That is the number a
user notices, so the excluded rows are reported rather than removed. `--detail`
prints an `unverified` line under each agent and `--json` carries the field,
because a call count that shrinks without explanation reads as OMNI having
stopped working.

The gate is scoped to the byte and token sums, not applied as a row filter.
Latency, command, project and file access in those rows really happened and stay
queryable. Only the savings columns are fiction, and deleting the rows would
destroy true history to remove a false column.

## `omni doctor` now knows the difference between two questions (#137)

`doctor` checked GitHub for a newer release, which is structurally unable to
catch the case that matters: six correctness fixes merged and unshipped, where
the newest release **is** the running version. It printed `omni v0.6.2 [LATEST]`
and nothing else.

`build.rs` now counts the entries under `## [Unreleased]` in the tree the binary
is compiled from and passes it in as `OMNI_UNRELEASED_ENTRIES`. A properly cut
release reports 0 and stays silent. A build from a tree with pending work prints
`[15 UNRELEASED] changes built into this binary are in no release, cut a tag`.
The count is a compile-time fact about the source, not a network call, so it
works offline and cannot disagree with the binary it describes.

## `omni stats` gained short scopes (#154)

`-d` for today, `-w` for the last 7 days, `-m` for the last 30, and the new
`--hour` / `-H` for the last 60 minutes. There was no scope shorter than a day,
so the question you ask *during* a session had no answer. `-H` rather than `-h`
is deliberate, since `-h` is help across every OMNI subcommand and re-pointing it
in one command would break that reflex everywhere else.

## `omni --help` is written around what you want, not what things are called (#166, #152)

There were two help texts, a hand-written one for `omni help` and clap's for
`omni --help`, and they had already drifted. Six commands appeared only in
clap's, including `exec`, which is the harness every issue in the tracker asks
reporters to run and which was invisible in the help you get by typing `omni`.

Both routes now render from a single table, and the two outputs are byte
identical. The list is grouped by intent, **SET UP**, **SEE WHAT IT SAVED**,
**TUNE IT**, **MEMORY**, rather than alphabetically, and each line states the
payoff instead of restating the name. `learn` went from "Auto-generate filters
from history" to "Build filters from the noise in your own history". `diff` went
from "Compare last original input vs distilled" to "The last command's output,
before vs after".

## Three subcommands nobody has ever run (#164)

An audit of real usage, the whole shell history on the maintainer's machine plus
row counts after 6,446 distillations over a month, found `omni stats` run 131
times and `handoff`, `rewind` and `rewrite` run **zero** times each.

`handoff` (326 lines) and `rewind` (197 lines) are gone. `rewrite` lost its
subcommand but keeps its module, because `cli::rewrite::rewrite_logic` is called
from the pre-hook on every command, which is why the cut list was checked against
the call graph and not the usage numbers alone. Net **777 lines removed**.

`rewind` was not merely unused, it was inert end to end: `rewind_hash` is
hardcoded `None` on every live path, the only caller of `store_rewind` is a test,
the table held 0 rows, and the query layer filters those branches out so they
could never match. The storage layer and the `omni_handoff` MCP tool are
deliberately left in place, because the usage evidence comes from shell history,
which says nothing about what an agent calls over MCP.

## Eleven fixes to output that could not be trusted

- **`cargo tree` came back as `Build: ok` (#170).** Every `cargo` command was
  routed to `BuildDistiller` on the executable name alone. `cargo tree` prints a
  dependency tree that *is* the answer, and 21,959 bytes of it came back as nine,
  under a footer reading `100.0% reduction`. It reached users who never type
  `omni`, because the pre-hook rewrites any command starting with `cargo ` into
  `omni exec`, and redirecting to a file did not help since the rewrite wraps the
  redirect too. Cargo is now routed by **subcommand**, with everything that is not
  a build or a test passing through.
- **`CloudDistiller` reported a tool that never ran (#112).** It re-derived the
  tool identity from the output's shape, and its first test, `is_docker_logs`,
  matches any timestamped log. So a `kubectl exec` whose output began
  `ls: /data/models: No such file or directory` came back as **`docker logs: 9
  lines, no errors detected`**. Two falsehoods in fourteen words: no docker was
  involved, and the one real error was deleted and replaced with a denial that
  any error existed. The distiller now carries the resolved tool, and content
  heuristics are demoted to deciding the *format within* one tool.
- **Five more distillers could certify a result they never parsed (#143).** A
  "nothing bad found" branch that emits `no errors` or `passed` is byte identical
  to a real success, so any upstream misdetection converted silently into a
  confident false pass. `tsc`, `playwright`, `eslint`, `security` and
  `docker logs` now each require having actually parsed a signal, and return the
  input unchanged otherwise. A future misdetection degrades to passthrough rather
  than a false claim.
- **`readfile` deleted every function body without saying so (#176).** On a
  24,999-byte Python file: 3,275 bytes out, 86.9% reported as a win, and the rule
  the file was read for was gone along with every other body. There is now one
  shared marker carrying the count, used by all five language paths.
- **The distilled output never reached Claude Code at all (#158).** The hook
  wrote `hookSpecificOutput.updatedResponse`; the key the host reads is
  `updatedToolOutput`. Claude Code drops an unrecognised key silently, so the
  model received the full original stdout while OMNI recorded the event as
  `Route::Keep` and printed a savings footer for it. The sibling
  `additionalContext` *is* spelled correctly, so the footer appeared and the
  failure read as success. Confirmed from the host side: `strings` on the Claude
  Code binary finds `updatedToolOutput` 13 times and `updatedResponse` zero.
  (This fix was itself incomplete, and [v0.6.5](/blog/omni-update-v0-6-5-the-payload-that-never-landed)
  is the release that finished it.)
- **Claude Code's work was filed under `Terminal` (#160).** OMNI had three
  private ways of naming the agent, and the one that actually writes the rows
  consulted neither of the others. It guessed `aider` for anything with
  `OMNI_CMD` set, which is a variable OMNI documents for its own pipe mode, so
  3,296 rows on one machine were filed under an agent that had not run.
- **A reader that closed early made OMNI panic (#155).** Rust ignores `SIGPIPE`
  before `main`, so `println!` panics on `EPIPE`. `omni --help | head -1` printed
  a panic where `ls | head` prints nothing, and `doctor`, `stats` and `session`
  panicked too. Fixed at the entry point rather than at each writer. Separately,
  `--help` and `--version` now exit **0**, so `omni --help && echo ok` works.
- **The CLI accepted flags it did not understand (#151, partial).** Sixteen of
  eighteen subcommands take a catch-all argv and re-parse it by hand, so nothing
  could detect a value outside the valid set. `omni stats --detial` printed the
  default overview and exited 0. `omni init --curser` ran the interactive default
  and exited 0 while installing nothing you asked for. Flags are now declared
  once, and an undeclared one is an error with a suggestion. Converted so far:
  `stats`, `init`, `session`, `doctor`, `learn`.
- **`--help` printed a stub while the real help was unreachable (#151).** Twelve
  subcommands had accurate per-command help, with flags and examples, reachable
  only through the undiscoverable bare word `omni stats help`. That alone moves
  47 implemented flags from documented nowhere to documented where you look.
- **All six translated READMEs promised "up to 90%" (#132).** The English README
  now warns that "a tool that claims to save 90% of every command is telling you
  it summarises output you need", and the translations were still selling the
  claim it warns about, 2 to 5 times per file, in six languages, on a public repo.
  They now carry the measured figures. The one place "90%" survives in each file
  is the sentence warning against it.
- **`docs/` still called two deleted commands, and two shipped examples failed
  silently (#180).** `docs/autonomous-loops/shell-loop.sh` guarded its checkpoint
  with `omni handoff --json … || echo "CONTINUE"`, so once the command
  disappeared the loop kept running against a default it never computed. A
  confident value standing in for a missing one, which is the defect this project
  exists to stop. Those methods were deleted rather than stubbed, because a stub
  that reports a healthy loop from state it never read is the same bug with a
  nicer name.

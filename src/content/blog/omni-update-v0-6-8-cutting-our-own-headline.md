---
title: "We cut our own headline from 66.3% to 29.3%: v0.6.8"
description: "Nine claims OMNI could not support, fixed, and an all-time savings figure corrected downward because 73.4% of it was terminal output nobody is billed for."
date: 2026-07-29
tag: Release Note
author: OMNI Core Team
---

Every release note here has the same shape, because the failure mode never
changes. OMNI drops bytes. When it drops the wrong ones it does not go quiet. It
returns something well formed and wrong, and nothing downstream can tell the
difference.

v0.6.8 closes nine of those, corrects the number on our own front page, and
switches nothing new on.

## A search that found nothing came back with twenty hits

The question was whether a Cloudflare API token had ever been written to disk in
a project. The command was two greps in one Bash call. The first matched
nothing.

What came back was `grep: 20 matches in 10 files`.

`distill_grep_output` counted matches across the whole payload and printed one
header at position 0, so the count described output it had never looked at. The
header stood exactly where the first grep's result belonged, above the separator
and above the second grep's twenty real hits. The fabricated count said the
token was in three files. It exists nowhere in that repository.

This is the class an agent cannot catch from the inside: a non-empty result
invented for an empty command. There is no marker to detect it by and the answer
is plausible. The reporter acted on it.

The fix closes the run of match lines at every non-match line and writes each
run's count directly above its own rows. The section boundary was visible in the
output the whole time and simply was not consulted. The zero-match arm went with
it. It used to discard the body and return the string `grep: no matches`,
asserting an outcome for input it had never recognised. It now returns the
input.

Worth recording: the first regression test was toothless. Deleting the fix moved
the header to the *bottom*, which satisfied a "no count before the separator"
assertion while still being wrong. The test now asserts what the agent reads
first, and was confirmed red against the original implementation pasted back
verbatim.

## Seven more of the same shape

**A `cargo test` run that exited 101 with a failing test was reported as
`Tests: 1 passed, 0 failed`.** The pass counter tested `contains("ok")` over a
whole segment. That substring sits inside `token`, `broken`, `lookup` and
`cookie`, so a `wc -l` line naming a log file under `token-efficient/` counted
as a passing test. One phantom pass was enough to disarm the fail-open guard,
which fires only at zero. The control identifies the mechanism exactly: the same
failing run, with its log written to `/tmp/zz/x.log` where `ok` appears nowhere,
passed through verbatim. The only variable was the substring.

**A markdown document read with `cat` came back as `tree: 127 entries`.** Five
readers (`cat`, `head`, `tail`, `sed`, `awk`) were routed to the system-ops
distiller, where `is_tree_output` tested *any* line for a box-drawing character.
One such line classified the whole payload. Box-drawing characters are how every
project documents a directory layout, and 25 markdown files in that repository
contain them. The reported harm is the worst case for a shape-based fallback:
the file was a skill document being read for instructions, the dropped range
held the verification commands the reader was about to skip, and prose gives
nothing that looks incomplete. The five readers now pass through verbatim.

**`git show --stat` dropped every file row and booked it as 79.9% saved.** The
distiller never sees the subcommand, so `git show` fell to the `git log` path,
where stat rows are neither commits nor metadata and hit the rule that drops
body lines. One recognised `--oneline` subject then disarmed the
`if result.is_empty()` guard, which asks whether anything was recognised rather
than whether most of it was. The check being run was whether `git add -A` had
swept three PNGs into a commit. The answer named no files, so a four-file commit
read as single-file. Routing is now on the flag, since `--stat` and its siblings
exist only to make git print a file list.

**Fourteen issue numbers went behind one marker.** Generic collapse normalises
every digit run to `#` before grouping. That is safe where something already
established the varying token is noise, such as a crate version behind
`Compiling`. Generic mode is the fallback for commands no distiller claimed,
where nothing established anything. Rows `Now #224` through `Now #237`
normalised to one pattern and all fourteen were deleted behind
`[14 similar lines collapsed] (pattern: "now ##")`, which does not even preserve
the width of what it replaced. Generic mode now groups on the whole trimmed
line. The four specific modes keep their skeleton grouping, where the domain
knowledge that licenses it actually exists.

**`[OMNI: Passthrough (low compression)]` was printed over bytes that had already
lost lines.** The banner named a route the code had not taken. That wording is
what makes it a false claim rather than noise: it reads as "OMNI changed
nothing", so nobody re-runs the command. Measured on a 69-line payload, the four
data rows of a markdown table were gone while the header and separator survived,
so the table read as present and empty. It now takes the route it names. The gap
marker under it used to be a bare `... [omitted]`, where one dropped line and
forty read identically. It states the count now, like every other cut we ship.

**The pre-hook rewrote the caller's whole pipeline.** `bash tidy.sh 2>&1 | tail -3`
ran as `omni exec bash tidy.sh 2>&1 | tail -3`, which puts distillation upstream
of a stage the caller wrote deliberately. `tail` stopped seeing the script's last
three lines and started seeing the last three lines of OMNI's summary. The
redirect form is the same defect with a file on the end: `npm run build > build.log 2>&1`
wrote twelve lines and a reduction banner into the log, dropping the route table
that is the reason anyone keeps a build log. That makes redirect-and-inspect,
our own documented escape hatch, return *less* than the terminal did. OMNI now
declines the rewrite for any command carrying its own downstream stages,
detected by a quote-aware scan so a commit message with a pipe in it still
works.

**A section's rows were counted into the previous section's marker.** Collapse
grouped by pattern across the whole output and emitted one marker at the group's
first index, so a group reached across the literal lines standing between its
members. Section one got a marker carrying the global count, section two lost
its rows entirely. Strict contiguity is the obvious fix and it is wrong: docker
build output cycles three patterns, so no two consecutive lines match and a
contiguous-run rule collapses none of it. The invariant that holds is narrower.
No *surviving* line may lie between the first and last row of a group.

## The ninth was on our own front page

The accounting layer is the layer the README sells, and it had four defects.

**73.4% of every byte OMNI claimed to have saved all time was terminal output.**
Rows tagged `agent_id='terminal'` are `omni exec` and the shell pipe: output
goes to a terminal, no context holds it, nobody is billed for it. Compressing it
may help a human read the screen. Counting it as *tokens saved* and folding it
into one figure made the figure describe nothing. Stripping it takes the
all-time headline from 66.3% to the 29.3% Claude Code actually saw, roughly 807K
real tokens over 19 days. That is a real saving and about a twentieth of what we
had published.

**Claude Code caps a Bash result at 30,000 bytes before the hook ever sees it.**
Above roughly that size the host writes the raw output to a file, previews the
raw first 2 KB, and discards whatever the hook returns. OMNI distilled the
capped fragment anyway and measured its saving against a number the host had
already chosen. Forty three rows sit at exactly `input_bytes = 30000`, one of
them printed to the agent as `93% compression` for a distillation that appears
nowhere in the transcript.

**The banner and the stored row disagreed about the same call.** The banner ran
a bytes-per-token heuristic over the byte delta and said 6,194 tokens. The row
ran a real tokenizer over each string and said 15,774. The banner is the copy
that enters the agent's context, so it now reports the tokenizer's numbers, and
the heuristic is deleted rather than left as a second way to answer one
question.

The fourth is a `delivered_bytes` column, so the headline is computed from what
reached a model instead of from what a distiller returned. Its limit is recorded
rather than papered over: no host tells a hook whether it applied the
replacement, so this is what OMNI handed over, not an acknowledgement.

We are not republishing a benchmark on the back of this. Two known distortions
push the other way and have not been netted against each other yet. The figure
on our front page still reads 58.9% across 1,810 replayed traces on the release
binary, which measures a different thing from the 29.3% live figure and says so.
When the netting lands, the number moves again.

## One feature we measured and did not ship

`PostToolUse` is registered with the matcher `"Bash"`, so the `Read`, `Grep` and
`WebFetch` arms of the post-hook have been written, gated and tested since the
Rust rewrite and have never once executed. The gap concealed itself: the
telemetry built to surface exactly this sits downstream of the registration that
excludes everything it detects, so the unhandled-tools table held zero rows
beside 6,682 distillations.

Widening the matcher is one line. This release does not take it.

Driving the built binary with a real `Read` payload first turned up three
defects that would each have made the flip fail *silently*, all three fixed
here. Then the measurement that made it a decision rather than an obvious win.
`src/pipeline/collapse.rs`, 878 lines, comes back as 20: an import list, three
signatures, a risk heading, and `... [867 of 877 lines omitted]`. The marker is
honest and the loss is still total for anyone about to edit that file.

One number in that entry was wrong when it shipped, and it is corrected in place
rather than edited away. It called the 2,000-token floor one that "nearly every
real source file clears". Measured over 1,770 real `Read` calls taken from
session transcripts, 7.6% clear it, and `.rs` only 3.1%, 9 of 290. The floor is
also well placed: those 7.6% carry 44% of all `Read` bytes. `collapse.rs` is an
outlier, not the typical read. The conclusion does not change, and generalising
from one example is the exact class of defect this project exists to stop
emitting, so the wrong sentence stays visible with its correction attached.

## What we did not fix

Collapse still keeps a head and no tail, so a summary line following repetitive
rows is still droppable. The reported reduction still counts deleted rows as a
saving. Cuts still hand back no rewind hash, so a marker tells you how much went
and not yet how to get it back. A wrapper is still routed by the wrapper rather
than by whatever ran inside it. Each has its own ticket and its own number, and
this release closes none of them.

One more, from writing the collapse fix. The probe output was read back through
the Bash hook and appeared on screen as
`[4 similar lines collapsed] (pattern: "end")`, OMNI folding the evidence into
the exact shape under investigation. It read as a live reproduction until the
log file was opened directly.

Upgrade with `brew upgrade fajarhide/tap/omni`, or `omni update`.

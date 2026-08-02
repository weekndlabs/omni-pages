---
title: "Zero rows after 8,968 distillations: v0.6.9"
description: "OMNI's rewind archive had never stored a byte, so the reversibility we promise first was false for every distillation it ran. That, and seventeen more."
date: 2026-08-02
tag: Release Note
author: OMNI Core Team
---

Reversibility is the first thing this site promises. Everything OMNI cuts is
archived to local SQLite, keyed by SHA-256, and your agent calls it back by hash
when it wants the rest. That sentence has been on the front page, in the FAQ and
in `llms.txt` since June.

It had never been true. Not for one distillation, on any machine, in any
version.

v0.6.9 closes eighteen defects. This is the one that mattered, and the rest of
the release is mostly the same failure repeated on different surfaces: a reader
claiming output it was never handed.

## The archive that had never archived anything

The gate deciding whether to keep the raw output asked the scorer for a noise
ratio and required more than 40% noise across more than 20 segments. No real
payload has that shape. Across 8,968 distillations on the maintainer's database,
0 carried a `rewind_hash` and `rewind_store` held 0 rows, while `omni stats`
printed an archive count read from that empty table.

TTL was ruled out before anything was changed rather than assumed. `cleanup_old`
deletes from `distillations` and `rewind_store` under one 30-day threshold, so a
hash written inside the retained window would still be sitting in the column.

It was also the wrong question. A re-scored noise ratio describes what the
scorer thought of the input, not what the agent is about to lose, and the two
disagree on every path where a TOML filter or a distiller produced the output.
Both hook paths now archive on the one question that decides it, whether this
reply lost bytes.

The bound is stated rather than implied, because archiving everything is not
affordable. Inputs above `MAX_REWIND_BYTES`, 64 KB, are not archived, and the
marker says so with the size. The same 30 days of history is 13.3 MB of raw
content under that cap and 83.1 MB without one, where 53 outliers up to 5 MB
carry six times the bytes of the 3,604 rows below them.

Placement is the difference between recording a loss and inventing one. The
archive runs after the route is settled. An earlier draft archived first, and
measured on the release binary, `git log --oneline -80` archived on 15 runs out
of 15 and then handed the raw output back anyway, so every one of those writes
stored content the agent had never lost.

A cut whose marker would cost more than the cut saves now falls back to
passthrough instead of charging the agent tokens for fewer facts. A 208 byte
`git diff` used to arrive as a 110 byte summary with 50 lines silently gone. It
is handed over untouched now, because paying roughly 75 marker bytes to cut 98
is not worth altering the host's output.

Latency is unchanged. A/B on the release binary over 15 runs of the same
command: 85.5 ms on this branch against 86.5 ms on 0.6.8.

One arm of the same guarantee was still open. The `Read`, `Grep`, `WebFetch`,
`MultiEdit` and unknown-tool paths all return before the Bash pipeline reaches
the rewind block, so none of them archived or marked what they dropped.
`MultiEdit` and the unknown-tool fallback are the plainest case: they keep 30
lines of the payload and label the result with the line count of the *input*, so
`[OMNI MultiEdit: 412 lines]` sat above 30 of them. The rule lives in one
function all six paths share now, because a second copy of it drifts.

The Reversible row on our front page now names the 64 KB bound. The promise is
real as of this release, and it has an edge, and publishing the promise without
the edge is how we got here.

## The feature we measured and declined, shipped

v0.6.8 ended on one we would not take. `PostToolUse` was registered with the
matcher `"Bash"`, so the `Read`, `Grep` and `WebFetch` arms had been written,
gated and snapshot-tested since the Rust rewrite and had never once executed.
Widening it was one line, and that release did not take it.

This one does. The matcher is `Bash|Read|Grep|WebFetch`, and an existing
settings file is migrated rather than left behind, which `ensure_hook` would
have done silently by returning as soon as it recognised the command.

The blind spot concealed itself. `record_unhandled_tool` sits downstream of the
matcher that excluded everything it was built to detect, so the table held
8,968 distillations beside 0 unhandled tools, with every `filter_name` in it a
shell command rather than a tool.

What this costs is the number v0.6.8 published: `src/pipeline/collapse.rs`, 878
lines, comes back as 20 of them, an import list, three signatures and a marker.
The 0.6.9 entry explains that by calling the 2,000 token floor in `readfile.rs`
one "nearly every real source file clears". That wording was measured and
withdrawn in the 0.6.8 entry of the same file, which prints its correction in
place rather than editing it away: over 1,770 real `Read` calls taken from
session transcripts, 7.6% clear the floor, and `.rs` only 3.1%, 9 of 290. Those
7.6% carry 44% of all `Read` bytes, so the floor is well placed and
`collapse.rs` is an outlier rather than the typical read. We print the corrected
number. The trade is the same with the right one in front of it, and it was
taken deliberately.

It ships after the `.txt` fix below stopped the `readfile` path reporting a
document as a clean log, and after the rewind work above made these arms archive
and mark what they cut. In that order on purpose.

## Two ways a command reaches the wrong reader

**A chain was routed by its first executable.** `git status && echo '=== tree ===' && find . -type f`
came back as `git: on branch main | staged:0 mod:0 untracked:0`. The 40 paths
the command was run for were gone, with no marker, no count and no rewind hash,
and the ratio read as a 99% win on the bytes that held the answer. `git status`
is the worst case only because its distiller emits a fixed one-liner whatever
the input, leaving no residue to notice. The same routing claimed
`git log -12 && git status --short && ls` and dropped the `ls`.

Splitting stdout back onto the chain is not possible. It is one stream, and
nothing in it marks which program wrote which line. So the rule is the honest
one: `registry::sole_output_command` finds the single command that wrote this
output, and when several did, the distillers, the TOML filters and the collapse
fallback all stand down and the output is handed back untouched.

A leading `cd`, `export` or `source` prints nothing, so `cd /project && cargo test`
is still distilled. That builtin list is deliberately short, because leaving a
producer out of it costs a passthrough while letting one in costs the answer.
CI caught the other half: `i=0; while [ $i -lt 60 ]; do echo x; i=$((i+1)); done`
is one program whose stdout comes from `echo`, and reading its clauses as
separate producers turned every loop and every `for f in *.yaml` one-liner into
a passthrough.

The bill is measured and small. Of 5,143 distinct recorded commands, 2,928 still
route to a distiller, and quote-aware splitting is what keeps 205 of them, since
an operator inside `awk '/^kind:/{f=1} f && /^---/{f=0}'` is not a chain. Chain
commands, approximated with a `LIKE` filter over 2,295 recorded rows, had 6.25 MB
of input booked down to 4.54 MB, and 1,535 of those rows were already
passthrough.

**A pipeline was routed by its first stage.** `kubectl get pod -o json | jq -r '...'`
was handed to the cloud distiller, which kept one of four lines. The three it
dropped were the pod phase, the node and the zone, which is what the command was
run to check. The one it kept was the timestamp. Nothing chose that survivor for
being signal.

It was filed against `jq` missing from the passthrough allowlist, and that is
not what deleted the lines. Probed through `post_tool::process_payload`,
`jq -r '...' pod.json` on its own is declined and always was, `printf` of the
same 90 bytes is declined, and only the piped form comes back as
`created: 2026-08-02T03:43:16Z` plus a `[Partial signal]` marker. Most filters
select rows out of a shape they leave intact, so `kubectl get pods | head -20`
is still a pod table and still routes to `kubectl`. `jq` and `yq` rewrite the
payload into something of their own, so the output is theirs and routes to them.
Both also join `passes_through_verbatim`, which is the reporter's own
recommendation and the right one for the format-safe contract.

Routing every pipeline by its last stage was measured before being rejected. Of
those 5,143 commands, 1,035 are pipelines, and that rule would hand 871 of them
to `head`, `tail` or `sed` and stop distilling them entirely. It is filed as
its own question rather than guessed at here.

Writing the test for that found a third defect. Both hooks asked
`passes_through_verbatim` about the whole command string, so
`kubectl get pods -o json | jq -r '...'` read as `kubectl`, the gate said no,
and collapse rewrote 60 rows a later step had to parse. It reads the resolved
command now, which closes the same hole for `cd x && cat file`, where the string
reads as `cd` and a file read was collapsed.

## Four more summaries that described something else

**Nine Portainer stack paths came back as one marker, and the footer called it
93% compression.** An earlier fix took skeleton grouping out of
`CollapseMode::Generic` and left it in the other four. `Test`, `Build`, `Infra`
and `Log` kept falling through to `normalize_structural`, which rewrites every
digit run to `#`, and `cat`, `grep`, `rg`, `tail`, `head`, `curl` and any
command string containing `.log` resolve to `Log`. Reported by @keefar against
0.6.8 and reproduced: nine paths differing only in an ordinal arrived as
`[9 similar lines collapsed] (pattern: "/var/lib/docker/volumes/portainer_data/_data/compose/#/v#")`,
forty container rows as one more marker, 49 rows of data with nothing left to
answer with. A count that identifies nothing leaves re-running with distillation
bypassed as the only recovery, which is the token-negative outcome collapse
exists to avoid. All four modes group on the whole line now, so their named
special cases still fold what they were written for and everything else keeps
its identifiers. `normalize_structural`, its 2,048-entry LRU cache and
`is_git_hash_line` are deleted rather than kept warm for a rule this project has
now decided against twice.

Three standing elision reports close with it, re-verified on the release build
rather than inferred from the diff. A 51-line Deployment manifest comes back
byte-identical with its `securityContext`, `capabilities.drop`,
`envFrom.secretRef` and `SESSION_COOKIE_SECURE` intact, 28 of 28 distinct
context names are delivered, and a `grep -B2 -A1` keeps its 68-character
separator. Checked above the marker floor as well, at 5,304 bytes with 80
distinct rows, so this is not the small-payload passthrough hiding it.

**A 19 KB prose file was delivered as `Log: 0 errors, 0 warnings`.**
`distill_log_file` counts lines containing `error`, `fatal`, `panic` or `warn`
and prints the count as a finding. A notes file has none of those words, so the
document came back as 103 bytes stating that a log was clean, for something that
was never a log. That is a summary byte-identical to a real clean run, emitted
with nothing positively parsed, the same shape as `Build: ok` for a python
script and `DB: ok` for a schema dump. The corpus behind the fix is every
distinct file a `Read` call actually fetched on this machine that clears the
2,000 token floor, 133 files and 2.1 MB deduplicated by content hash, of which
28 dropped their content silently. `.txt` no longer routes to a log summariser
at all, because it is not a log format; it gets head and tail with a count, the
same as `.md`. `distill_log_file` declines when it recognised neither an error
nor a warning, since a file with no error lines is not a clean log, it is a file
that function cannot read.

**`npm run build` was delivered as `prettier --write: 2 reformatted, 0 unchanged`
over four bare timestamps.** No prettier ran and no file was rewritten, and both
facts the agent needed, whether the build passed and what it produced, were
gone. `is_prettier_write_line` asked whether *any* token on a line ended in
`ms`, so every build tool that prints a duration looked like prettier:
`astro build` emits `16:55:35 [types] Generated 25ms` and the whole log was
claimed. A fingerprint has to be something no sibling format also prints, and a
duration is the opposite of that. The detector now matches prettier's actual
line, `<path> <n>ms` with nothing after it but its own ` (unchanged)`, where the
path has an extension and is not a clock or a bracketed tag. Reproduced against
the release binary before and after, with `npm` shadowed on `PATH` so the
command name is the real one.

**A TOML filter could write an empty string over real output.**
`TomlFilter::apply` only handled an empty filtered result when the signal
declared a `fallback_message`. Without one it returned `""`, so the post-hook
wrote empty stdout over the host's real bytes and recorded the deletion as 100%
compression. The reported trigger is synthetic, since real `black --check`
output also prints a summary that survives the filter, but the mechanism was
current. Batch filtering now carries an explicit passthrough outcome, and
hook-level review caught that merely returning the input was not enough: it
failed the TOML size guard and fell through to `BuildDistiller`, turning 200
rows into a fabricated `Build: ok`.

## The accounting, and one number we computed and did not print

All five findings in the accounting audit are closed. Four by code, one by
verification.

**Every distillation was filed under a wall-clock id.** `SessionState::session_id`
came from `timestamp_millis()`, and the persisted state was global rather than
per-host-session, so rows grouped by whenever OMNI last started. On the live
database that is 17 OMNI sessions against 63 real ones, one id covering 16
project paths, and a banner reporting `-132386tok session` for a project that
contributed 11 rows. The host had been sending its own `session_id` on every
payload the whole time, and `hooks::session_start` parsed the same key and spent
it on one log line before discarding it, which is how this stayed invisible.
Existing rows are not rewritten. They keep the old grouping and remain wrong.

**15% of the history was a second copy of one command.** 1,231 of 8,272 rows.
The newest is dated 2026-07-17, the day 0.6.2 was cut, twelve days of rows since
contain none, and 1,229 of the 1,231 are `aider`, so the write that made them is
long closed and this is a history problem. A one-time migration collapses them,
keyed on every column except `id` and `latency_ms`, because latency is the only
column that ever varies inside a duplicate group. No `UNIQUE` index was added on
purpose: it would from then on reject a user who genuinely runs one command
twice inside a second with identical output, trading a closed bug for a
permanent silent under-count.

**`omni doctor` reported "Last distill: never" while distilling.** Both readings
named one table and queried another. The timestamp came from `rewind_store`,
which held 0 rows for the reason above, so the query returned `None` forever and
the line printed `never [IDLE]` two seconds after a distilled command. That is
the line someone reads while checking whether hooks fire at all. The "24
records" beside 8,260 distillations was `COUNT(*) FROM sessions`.

**A passthrough spent tokens announcing that nothing had happened.** When a
distillation saved under a tenth, the hook handed the host back the original
output prefixed with `[OMNI: Passthrough ...]`. Measured on the reporting
database, that marker added 33,762 tokens across all such calls, 604 of them in
a single day, at a modal 10 tokens each. The hook emits nothing on a passthrough
now, and the row is still recorded at its honest 0%. Removing it turned five
existing tests red, and every one of them had been asserting `is_some()` on a
payload OMNI never reduced.

**The fifth closed by verification rather than by code.** Rows labelled
`Passthrough` that recorded a large reduction no longer reproduce: the example
in the report is 34,519 bytes down to 14,105, a ratio of 0.59, which under the
current thresholds is `Soft`. A guard for the remaining band was written and
then removed, because no fixture could be built that reached it, so its test
passed with and without the change. A check that cannot fail proves nothing.

Memory reads were counted for the first time in the same pass. `retrieve_events`
had exactly one writer and 0 rows against those 8,968 distillations.
`omni_recall`, `omni_knowledge`, `omni_insight` and `omni_query` recorded
nothing, and neither did the largest memory read in the product, the
`session_start` injection that puts project knowledge into every continued
session without anyone asking for it. "Nobody reads it" and "it is read
constantly and never recorded" produced the same empty table, and no query could
tell them apart. Each of the five writes a row naming itself now, including the
calls that come back empty, because a query that found nothing is still someone
asking.

And the number we did not print. Cumulative, cache-discounted savings are
computed and tested:
`Store::token_savings_with_reuse` sums `delta x (1 + turns_after x cache_read_rate)`
over every distillation that reduced something. On the existing database it
reports 17.0M at insertion against 469.3M with re-use, a 27.6x multiplier that
comes from the wall-clock session id above rather than from re-use, because one
"session" spans 3,739 commands across 16 project paths and its first row is
credited 374 turns. The arithmetic is right and the input is not. Publishing a
bigger number that is less true is the defect this project keeps closing, so it
goes in once enough history exists under real host session ids. The cache-read
rate it assumes is 10%, named in `pipeline::CACHE_READ_RATE` with the reason it
can only ever be an assumption: a hook cannot observe whether a turn was a cache
hit.

Our front page still reads 58.9% across 1,810 replayed traces on the release
binary, parsed from the README at build time. Nothing in this release moves it.

## What we did not fix

One item leaves the list. Cuts hand back a rewind hash now, and the archive
behind it exists.

Three stay. Collapse still keeps a head and no tail, so a summary line following
repetitive rows is still droppable. The reported reduction still counts deleted
rows as a saving. A wrapper is still routed by the wrapper rather than by
whatever ran inside it, which is the same class as the two routing fixes above
and is not covered by either.

Two more join it. Routing a pipeline by its last stage is filed and unanswered.
The marker floor is half done: a cut whose marker costs more than it saves falls
back to passthrough, and the request behind that ticket was that those lines
should not have been dropped at all.

CI is unrelated to any of it and worth one line: the macOS and Windows matrix
declared `needs: ci` and waited on a job it shares nothing with, so 13 minutes
of work took 23 minutes of wall clock. It runs in parallel now, costs more
runner minutes on a red build, and answers in about half the time.

Upgrade with `brew upgrade fajarhide/tap/omni`, or `omni update`.

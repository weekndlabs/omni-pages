---
title: "A gate keyed on the command nobody runs: v0.6.14"
description: "Secret redaction lived inside the env distiller, so it only fired when the registry called a command an env command. Of 25 env-shaped payloads in the corpus, 17 carried a credential and not one came from a command named env."
date: 2026-08-07T10:40:00Z
tag: Release Note
author: OMNI Core Team
---

Gate 6 redacts secrets. It lived inside the env distiller, so it only ran when
the registry decided a command was an env command. A bare `env` passes through
verbatim and `printenv` is not recognised at all, so both delivered their values
exactly as printed.

**Measured over 5,733 recorded traces, and the measurement is the whole
argument.** 25 carry an env-shaped payload. 17 of those hold a credential that
reached the model unredacted: `DB_POSTGRESDB_PASSWORD` eight times, plus an API
key, an `SSH_PRIVATE_KEY` and an access token. **Not one of the 25 came from a
command named `env`.** They arrive from `cd … && …`, `kubectl exec`, `sed`,
`printf` and `export`.

A gate keyed on the command could only ever have covered the case nobody runs.
The redaction sits on the payload now, at the same dispatch choke point as the
JSON guard, and returns the input minus its secrets rather than continuing to a
summariser that might drop the line instead.

Known and accepted cost: `SENSITIVE_PATTERNS` matches on substrings, so a public
key and a public URL variable are redacted too, 2 of the 17 in the corpus.
Over-redaction leaves the key name visible, the line in place and the value in
the rewind archive. Under-redaction puts a password in the transcript. The
asymmetry decides it.

## The env distiller kept only the secret

It emitted per-prefix counts and no values, so a nine-variable
`kubectl exec … env` came back as `env: 9 vars | REDACTED: 1 sensitive` over
`DB(8) APP(1)` plus the password line. The DB host, port, database, user,
schema, SSL flag and driver were gone, and the one value surfaced by name was
the only one that must never be printed.

`DB(8)` answers "which DB vars are set". The question anyone runs the command
for is "set to *what*". `env` output is an enumeration, the shape passthrough
already protects for `ls` and `ps`, and the only reason to touch it is the
secret in it. So it redacts rather than summarises.

**Two guards in the hook had to go with it, and without them this would have
been a security regression rather than a fix.** Redacting makes the output
*longer* than the input, because `[REDACTED]` is wider than the secret it
replaces, so the guardrail restore handed the raw bytes back under "nothing
worth a deletion" and put the password on screen. And a distillation that saves
nothing is dropped entirely before it reaches the agent, which left the host's
own plaintext in place.

## A command naming a parseable format was still being cut

`az acr repository show-tags … --orderby time_desc --top 25 -o tsv` delivered 10
of 25 rows. `format::sniff` protects the shapes it can recognise, and a
single-column TSV has no delimiter to recognise, so nothing stopped the cloud
distiller head-sampling it.

Head-plus-marker is the worst possible cut for a time-ordered listing: the head
is what the caller already knew and the tail is the history they ran the command
for. The reported case turned on rows 18 to 20.

An explicit `-o` or `--output` naming `tsv`, `json`, `yaml`, `name`, `jsonpath`,
`go-template` or `custom-columns` now passes the payload through, because naming
one of those is a statement that something downstream parses it. The *value* is
the tell and not the flag, so `-o wide` and `-o table` render for a human and
stay compressible. Over the corpus: 48 traces carry the flag, 3 were being
visibly shortened, and the 1.4 KB that buys back was loss rather than saving.

## Four more shapes that lost the answer

**A vitest suite that never loaded was reported as four test failures.** When a
transform error stops the suite loading, vitest runs zero tests and says so.
`failed_tests` parsed as 0 and the count fell through to the length of the `❯`
list, which in that payload is the transform's stack frames, so the delivered
line read `vitest: ✓ 0/0 | ✗ 4` for a run where nothing executed. The
`[TSCONFIG_ERROR]` line, the only actionable one, was deleted. A failure counter
is the number a reader trusts without checking.

**A JSON line was not handed back whole.** Two JSON API responses printed beside
a single `pod "vmq" deleted` notice are not NDJSON, so `sniff` returned `None`,
format-safety switched off for the whole payload, and 17 bytes of a 460 byte
answer arrived. The guard sits ahead of distiller dispatch now. Both figures
from the sizing are in the source comment, because the first one would have
justified the wrong build.

**An already-aggregated histogram was routed to the pod-table distiller.**
`kubectl … logs … | awk … | sort | uniq -c` is a histogram by the time OMNI sees
it, but `uniq` was not a reshaping tail. Of 40 rows, 10 were delivered, and both
traffic spikes the query existed to find were in the 30 that went.

**A lossless regroup was reported as data loss.** The grep distiller folds a
repeated `path:` prefix into a header, so 11 matches come back as 15 lines
holding all 11. The byte ratio lands in `Soft`, so the output carried
`[Partial signal]` and `274 bytes omitted`, both telling the reader a complete
answer was incomplete. A distiller that emits more lines than it consumed
restructured rather than cut.

## Cursor's post-hook was wired to a file-edit event

`install_omni_hooks` wired `--post-hook` to `afterFileEdit`. A file write carries
no stdout, so the half of the integration that produces the savings was fed
nothing for its entire life, while the pre-hook was correct, which is what made
the wiring look plausible.

`omni doctor` reported it as installed: it grepped the whole file for
`--post-hook` and printed two fixed labels, so the check passed whatever event
the command sat under. It asserts the event per hook now and names the missing
one.

## The README stopped listing five names under one verb

It claimed OMNI "works with Claude Code, Cursor, Windsurf, Codex and Roo out of
the box", and for the product's core function that is not true on Cursor.
Cursor's only output-rewriting field is documented "For MCP tools only", and
`afterShellExecution` defines no output fields at all.

Driven through the 0.6.13 release binary with both documented Cursor payload
shapes: **zero bytes returned, zero rows recorded.** `omni init --cursor` still
installs and still does real work. What cannot happen there is distillation of
command output, and a reader was previously left to discover that by measuring.

```bash
brew install fajarhide/tap/omni && omni doctor
```

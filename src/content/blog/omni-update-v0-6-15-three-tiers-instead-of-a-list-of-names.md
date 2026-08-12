---
title: "Three tiers instead of a list of names: v0.6.15"
description: "Codex CLI and Gemini CLI reach model-facing distillation through the pre hook. Cursor gets omni_run and a rule that makes the agent use it. The host matrix is product law now, in the README and in omni doctor."
date: 2026-08-09T11:20:00Z
tag: Release Note
author: OMNI Core Team
---

The previous release established that OMNI could not distil command output on
Cursor and said so. This one is what came of asking the same question of every
other host, one at a time, against the real binaries.

The answer is three tiers, and they are product law now: in the README, in all
six translations, and printed by `omni doctor` for every host you have
installed.

**Full**, where the host applies OMNI's rewrite: Claude Code, Codex CLI, Gemini
CLI, Aider. **Handoff-first**, where it cannot, but `omni_run` distils whatever
is routed through it: Cursor, Windsurf. **MCP-only**, memory and session state
with no shell distillation and no claim of one.

The tier is a trait method defaulting to MCP-only, so a new integration has to
**claim** distillation rather than inherit the claim. That is what let three of
them ship the claim without the behaviour.

## Codex and Gemini reach Full through the pre hook

The parity path turned out to be the *pre* hook, not the post hook. Codex
documents `hookSpecificOutput.updatedInput.command` on `PreToolUse` and states
that `PostToolUse` cannot replace output at all, so wrapping the command in
`omni exec` is what changes the bytes the model reads. OMNI already emitted
exactly that reply, so Codex needed no adapter, only the config fix. A contract
test pins the shape now.

Gemini reads replacement arguments from `hookSpecificOutput.tool_input` under a
`BeforeTool` event, so the reply shape is chosen from the incoming payload's
`hook_event_name` rather than an install-time flag that could drift out of step
with the config that set it.

An earlier plan to gate this on Codex's `[features]` flag was dropped after
asking the binary: `codex features list` reports `hooks stable true`.

## Cursor gets the tool, and the rule that makes it get used

On Cursor every output-rewriting route is closed, so a command can only be
distilled there if OMNI is the tool that ran it. `omni_run` executes a command
and returns its distilled output as the MCP tool result, reusing `omni exec`'s
pipeline: the same filters, the same format gate, the same redaction, and the
same rule that a command exiting non-zero passes through verbatim rather than
being summarised into a clean-looking failure.

That tool existed and the agent still had to choose it, which is the difference
between a lever being available and being used. Printing a hint was the cheap
version and it does not work: the user has to notice it, copy it and create a
file.

`omni init` inside a repository now writes `.cursor/rules/omni.mdc`, two lines,
`alwaysApply: true`. Uninstall removes it again. Outside a repository it prints
the rule rather than writing into a home directory uninvited. Doctor treats a
missing rule as a **failure** with the reason spelled out, `the agent will keep
using the built-in shell`, because hooks green plus no rule is the same false
green this tracker keeps finding.

The rule is charged to the Rules context bucket, so a test caps it at three
lines. A rule that grows makes the bucket it exists to help worse.

## The session block that bought its cheapness by not working

`omni session --inject` is the only recovery path on Cursor. At 200 bytes it
held the task line and one error truncated mid-sentence, so a fresh chat still
had to rediscover which files were in play and what was broken.

The budget is 1000 bytes, chosen against a measurement rather than taste: the
session it was tuned on had run 667 commands producing 539,795 bytes of tool
output, so rebuilding that state by replay costs it again and this block is
0.2% of it. It carries task and domain, the last three distinct commands, five
hot files with access counts, and two distinct unresolved errors.

Two defects showed up only in the real output and not in a fixture. One recorded
heredoc filled the entire budget and the truncation then removed the hot files
and errors, so each item is capped separately. And a leading `cd` plus a run of
`VAR=value` assignments is identical across entries and ate that per-item budget
before the program appeared, so three different commands rendered as three
identical lines.

## PreCompact returned a snapshot to a field the event has no slot for

The reply carried `hookSpecificOutput.systemPromptAddition`, and Claude Code,
the only host OMNI registers this hook with, documents **no content field on
`PreCompact` at all**. Renaming would not have helped: there was no correct
field to move to, so the 6000-token snapshot was discarded whatever it was
called. The host does not reject the reply either, so nothing appeared in the
transcript and the loss left no trace.

The fix is deletion, because the replacement path was already running. This
handler writes the snapshot to `session_events` *before* compaction, and Claude
Code fires `SessionStart` afterwards, where the block is rebuilt from that row
and returned as `additionalContext`, the field that host does read.

Every test on the reply was rewritten to read the recorded snapshot back out of
the store. Asserting on the return value is what let this survive: it proved the
struct serialised, which was never in doubt, and said nothing about the host
reading it.

## Five documents describing behaviour the code no longer had

`docs/` held 11 top-level files, of which two were reachable from the README.
`TESTING.md` advertised "135+ tests" against a suite of 3,152, a binary under
5 MB against a 9.4 MB release binary, latency under 5 ms against a measured
34.3 ms, and "100% context safe", which is the kind of absolute this project
files issues about.

A document that states a behaviour the binary does not have is the same defect
as a distiller reporting a saving it did not make, and it is worse for having no
test that can fail.

Five went, along with `docs/autonomous-loops/`, whose templates had already
failed once in the way that matters: `shell-loop.sh` guarded its checkpoint with
`omni handoff --json … || echo "CONTINUE"` after `omni handoff` had been removed
as a subcommand, and kept looping against a default it never computed. The
comments were repaired then. The mechanism that broke them was not, because no
test runs either file.

```bash
brew install fajarhide/tap/omni && omni init --cursor
omni doctor
```

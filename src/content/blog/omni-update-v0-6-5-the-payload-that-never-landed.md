---
title: "The payload that never landed: OMNI v0.6.5"
description: "For two releases OMNI reported a saving Claude Code had rejected: 27 of 34 Bash calls in one session. v0.6.5 fixes the payload shape, not just the key."
date: 2026-07-24
tag: Release Note
author: OMNI Core Team
---

v0.6.5 has one entry, and it is the same bug as the one v0.6.4 already claimed
to have fixed.

## The half-fix

[v0.6.4 fixed #158](/blog/omni-update-v0-6-4-measuring-what-reduction-cannot-see):
the Claude Code hook was writing its replacement under
`hookSpecificOutput.updatedResponse`, and the key the host reads is
`updatedToolOutput`. Correcting the key was necessary and it was not sufficient,
because `updatedToolOutput` is not a free-form object.

Claude Code runs `tool.outputSchema.safeParse(value)` **keyed on the tool that
ran**. There is one shape per host tool. OMNI was sending the MCP shape,
`{status, result}`, to all of them. Bash's schema wants
`{stdout: string, stderr: string, interrupted: boolean, …}`, so every payload was
rejected, the host restored the original bytes, and the UI rendered
`PostToolUse:Bash hook warning`. Meanwhile the sibling `additionalContext` went
through and printed a saving for a distillation that had just been discarded.

The observable behaviour never changed across the fix: savings reported, nothing
applied. It survived two releases because the only thing that changed was the
field name in an error nobody was reading.

## Measured from the host, not from our own numbers

Counting rejections in the Claude Code session transcript rather than trusting
OMNI's telemetry: **27 of 34 Bash calls in a single session were rejected**, each
with `stdout: expected string, received undefined`, `stderr: …`,
`interrupted: expected boolean, received undefined`. One of them printed
`-3247tok this call | 67% compression` for 300 `npm WARN` lines the agent
received **in full**.

The 7 quiet calls are the ones where OMNI correctly emits nothing at all: a
non-zero exit, and the format-safe gate.

## Reply in the shape you were spoken to in

The fix is not a table of per-tool schemas. The reply is now **the response
object that arrived, with `stdout` swapped and every other key preserved**.
`interrupted`, `isImage`, `backgroundTaskId`, `persistedOutputPath` and
`timedOutAfterMs` are all schema members, and rebuilding a minimal object would
have failed validation exactly as the old shape did. Reading the shape off the
incoming payload keeps it correct for tools this code has never seen, and there
is no table to maintain.

`stderr` is **blanked rather than echoed**, because normalisation folds a
non-empty stderr into the text that gets distilled, so returning the original as
well would show it to the agent twice. Blanked rather than dropped, because the
schema requires the member to be a string.

Payloads that arrive without a host response object, from Codex, Pi or a generic
MCP client, keep the MCP shape deliberately. Those hosts' contracts were not
investigated, and guessing at a second one is how the first was got wrong.

Verified end to end through the built binary rather than the struct: the same
300-line payload now returns `{stdout, stderr, interrupted, isImage,
backgroundTaskId}` with no `status` or `result`, 18,490 bytes down to 1,819, and
the reported 90% matches a measured **90.2%**. A stashed baseline confirms the
distilled *text* is byte identical before and after. This change moves the
envelope only.

## The test that let both halves through

It asserted `"status":"success"`, which is the same field name it had just
serialised. That is why a wrong key and then a wrong shape both passed it. The
replacement asserts against the host's schema, and specifically that `status` and
`result` are **absent**.

## One consequence, filed rather than hidden

Making the payload actually apply means it delivers, for the first time, an
unmarked 30-line truncation in the JS/TS distiller that no agent had ever seen.
That is [fixed in v0.6.6](/blog/omni-update-v0-6-6-honest-signal), along with six
other ways OMNI could invent a result or delete the answer.

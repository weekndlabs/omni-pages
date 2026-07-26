---
title: "A failed command that read as success: OMNI v0.6.3"
description: "v0.6.3 stops OMNI distilling commands that already failed, stops distillers reading their own collapse markers as data, and fixes a corrupted exec."
date: 2026-07-21
tag: Release Note
author: OMNI Core Team
---

Six fixes, and five of them are the same shape: OMNI producing output that reads
as a clean result for a command that never produced one. A fabricated error costs
you a retry. A fabricated success ends the investigation, and the agent moves on
with a wrong answer.

## Failed commands were being distilled (#120)

The `normalize` layer parsed each agent's failure signal and then threw it away.
Codex's `exit_code` was never read into `CodexInput`, Pi's `toolResponse.isError`
sat behind `#[allow(dead_code)]`, and the MCP `result.isError` was named in a
comment and never deserialised. So a command that exited non-zero still went
through the full distiller.

A failed `docker build` at `exit_code 1` on the heavy-noise fixture came out
**9,207 bytes down to 6,090**, quietly trimmed by the same `DEBUG` and `INFO`
stripping a *successful* build gets. The case that was filed was worse: a `vault`
call that failed with `exit=2` on a network timeout, surfacing a clean, fictional
`["n8n"]`.

`NormalizedInput` now carries a `failed` flag, set from each agent's own signal,
and `post_tool::process_payload` passes a failed command through verbatim before
any distiller runs, at zero marker cost. Successful commands are untouched: the
same output at `exit_code 0` still distils to 6,090 bytes. Claude Code needed no
code change, because it already sends a failed command as a bare `tool_response`
string that cannot parse into a success summary, and a regression test locks that
in so a future, more lenient parser cannot reintroduce the fabrication.

## `omni exec` had the same hole, one layer down (#122)

`cli::exec` streamed the child's stdout straight through the distiller and only
called `child.wait()` afterwards. By the time the non-zero exit was known, the
distilled output had already been written, so a failed command run through OMNI's
own reproduction harness came out distilled.

The exit code is only knowable once stdout is fully drained, and draining before
`wait()` is also what avoids a full-pipe deadlock, so `exec` now buffers stdout,
waits, then gates. Measured on 60 identical noise lines: `exit 1` now yields 60
verbatim lines where it previously collapsed to a single
`[60 similar lines collapsed]` marker, and `exit 0` still collapses. Stream-mode
commands (`docker`, `npm`, `bun`) emit line by line before the exit code exists
and cannot be gated, so they keep streaming.

## Distillers were reading OMNI's own scaffolding as data (#116, #110)

`collapse` runs before `distill`, rewriting repeated lines into
`[N similar lines collapsed]`. A distiller that parses columns then read those
markers as rows.

A 35-row `kubectl get pods` table, 30 Running and 5 CrashLoopBackOff, came out as:

```
k8s: 2 pods | 0 running, 0 pending, 2 error / Problems: [30 (lines), [5 (lines)
```

Every "pod" in that line is OMNI's own scaffolding. The real statuses were
destroyed. It survived unseen because the broad `signals/domains/*.toml` filters
won the alphabetical `find()` race and short-circuited the distiller for cargo,
npm, docker, kubectl and terraform before it ever ran.

Two coupled fixes. The distiller now reads the tool's **raw** output, with
collapse feeding only the scorer and the fallback for commands no distiller
claims. And a TOML filter only short-circuits the distiller if it actually beat
the shared guardrail, so weak filters fall through. The same table now distils
to `k8s: 35 pods | 30 running, 0 pending, 5 error` with the five CrashLoopBackOff
pods named.

## `omni exec` ran a corrupted command (#125)

`cli::exec` set `needs_shell` whenever *any* argv element contained a shell
metacharacter, then rebuilt the command with `format!("{} {}", cmd,
cmd_args.join(" "))` and ran it under `sh -c`. For
`omni exec sh -c 'echo A; echo B'` that produced `sh -c "sh -c echo A; echo B"`.
Two shell layers, with the original quoting already flattened by `join(" ")`, so
the outer shell ran `sh -c echo A`, where A became `$0` rather than an argument,
and then `echo B`. The output was just `B`.

`omni exec` is the harness every issue in the tracker asks reporters to run, so
any reproduction of the form `omni exec sh -c '…'` was silently running the wrong
command. A shell is now used only when the command arrived as a single unsplit
string. When argv is already split, each element is passed through verbatim,
because the metacharacters belong to the inner program.

## Composite npm scripts lost four gate verdicts (#106)

A chained script such as `npm run verify`, which is
`build && tsc --noEmit && eslint && check:secrets && test`, concatenates several
tools' output into one buffer. The JS/TS dispatcher picked **one** distiller from
the first signature it saw and handed it the whole thing. `is_tsc_output` matched
the string `tsc --` inside npm's own `> build && tsc --noEmit && …` echo, so
**19.5 KB collapsed to 14 bytes of `tsc: no errors`**. That is a false success
that also erased four gate verdicts, including the secret scan's positive
control, the line that proves the scan could see inside the bundle at all.

Over-distilling a composite is token-negative in the end, because the agent
re-ran `npm test`, `check:secrets` and `lint` to recover what was dropped. No
per-tool distiller can safely own a composite, since an `&&` chain has no
delimiter between the tools' outputs, so the dispatcher now detects npm's
`> … && …` echo and declines.

## Prettier was reported as a clean eslint run (#114)

Three compounding defects in `distillers::jsts`. `is_eslint_output` matched the
bare word `eslint`, which appears as a *filename* in prettier's file list, so a
`prettier --write` that rewrote 109 paths was distilled as a clean run of a
different tool. `is_prettier_output` only matched lowercase `checking ` and
`reformatted `, while prettier actually prints `Checking formatting…` and
`[warn]`, so the detector was dead. And `distill_prettier` parsed **black**'s
summary line, which prettier never prints, so both a failing `--check` and a
successful `--write` rendered as `prettier: 0 files reformatted, 0 unchanged`.

All three are fixed against prettier's real output. eslint detection now anchors
on eslint's own line shapes rather than a substring that occurs in filenames,
`--check` surfaces the offending filenames, `--write` reports the real counts and
names the changed files, and the distiller declines rather than fabricate a count
when neither mode is recognisable.

---
title: "The wrong path scored better: v0.7.3"
description: "A tool named bash instead of Bash never reached its own distiller and reported 59.9% against the right path's 37.6%, because it was keeping the first thirty lines and discarding the rest. Two sessions minted in the same millisecond became one. And kubectl run container output was judged as kubectl output, so the eight lines the command was run for were dropped and the one kubectl prints itself survived."
date: 2026-08-12T21:15:00Z
tag: Release Note
author: OMNI Core Team
---

Three fixes about mistaken identity. A tool name, a session and a command's
output were each taken for something they were not, and in every case the
substitution was invisible from outside: the wrong path scored a *higher*
saving, two sessions merged with no error, and a probe whose answer had been
deleted read exactly like a probe that found nothing.

## A tool called `bash` never reached the distiller for `Bash`

`distil_tool_reply` matches `Bash`, `Read`, `Grep` and `WebFetch` exactly. The Pi
and OpenAI-shaped branches normalise the tool name before that check. The
ClaudeCode branch, which is the shape a third-party integrator is most likely to
send, passed the name straight through, so a payload arriving as `bash` fell to
the generic arm and reached neither the per-tool distiller nor the ledger.

What kept it alive is that the generic arm still shortens. On a real shell
corpus, `bash` reported **59.9%** and `Bash` reported **37.6%**, so the broken
path looked like the better one on every dashboard that counts bytes.

The gap is the whole point. The generic arm keeps the first thirty lines and
discards the rest, which is a large number and an arbitrary cut. The per-tool
path folds only what the agent has already been shown, which is a smaller number
and a claim that is true. A reduction percentage cannot tell those two apart, and
this is what that costs.

## Two sessions in the same millisecond were one session

The session id was `timestamp_millis()` and nothing else, and the insert is
`INSERT OR REPLACE INTO sessions`, so two sessions minted in the same millisecond
kept one of the pair and lost the other without an error. On a machine running
several agents, two `SessionStart` hooks landing together is not an edge case, it
is Tuesday.

The id is now `{millis}-{pid}-{counter}`, all standard library. The milliseconds
stay at the front because four call sites slice `session_id[..8]` to display it.

This does not make the id meaningful, and it was not meant to. It is still minted
state rather than an identity the host handed us, which is exactly why the ledger
scopes on `host_session()` instead of on this.

## `kubectl run` output was read as kubectl output

`wraps_another_command` knew about `exec` and not about `run`, so
`kubectl run --rm -i -- <cmd>` was routed to the kubectl grammar and the
container's own stdout was parsed as though kubectl had printed it. An eight-line
probe came back as `pod "omni-repro" deleted` and a marker: the one line kubectl
writes itself survived, and the eight lines the command existed to produce did
not.

The direction of that failure is the bad one. A probe that returns nothing is a
plausible result, and nothing in the delivered text separates it from an answer
that was thrown away.

**The two doors disagreed, which is why an early probe found nothing.** The same
payload through `hooks::post_tool` was never rewritten, so only `hooks::pipe`
destroyed it, and a post-hook reproduction reported no defect at all. `run` now
counts as a wrapper for `kubectl`, `docker` and `podman`, the same as `exec`.

The corpus cannot arbitrate that widening and it is worth saying so: 6,656
recorded commands hold two `podman run` and no `kubectl run`. The change to the
other two runtimes is reasoning from the shape of the command, not from measured
traffic.

Full notes are in the
[0.7.3 changelog](https://github.com/fajarhide/omni/blob/main/CHANGELOG.md).

```
brew upgrade omni     # or: omni update
```

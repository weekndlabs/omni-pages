---
title: "OMNI v0.7.11: See What Your Agent Was Billed"
description: "A stats view built from the host's own transcripts, a measured answer to whether OMNI costs prompt-cache hits, az ssh output that arrives whole, and three ways a credential reached the model, closed."
date: 2026-10-14
tag: Release Note
author: OMNI Core Team
image: /media/omni-0.7.11.png
imageAlt: "OMNI v0.7.11 release card: see what your agent was billed, from the host's own books"
---

Every report OMNI printed until now came from OMNI's own tables. That is the one place a tool cannot check itself against, so this release adds a view that reads the other side.

## The host's books

`omni stats --view bill` reads Claude Code's transcripts for a window and prints what was billed, by token class, what the context was made of, and which tools filled it:

```
From the host's transcripts: 2 sessions, 14 requests.

Billed tokens                        tokens   share
cache read                          765,189   85.4%
cache write                         129,485   14.4%
output                                1,821    0.2%
fresh input                              28    0.0%
```

A request is counted once even though the host writes its usage on every record, and subagent contexts are left out because they are billed apart. There is no dollar figure: the price depends on the model behind each request, and the transcript does not say.

## Does OMNI cost prompt-cache hits?

The objection to any tool that edits what a model reads is that it breaks the cache. OMNI rewrites only the newest tool result, so everything before it stays byte for byte. This release measures it rather than argues it: the same six-command workload, 20 pairs, once with the hook live and once with `OMNI_PASSTHROUGH=1`, on Claude Code.

```
                         with OMNI     without     delta
tool result bytes          965,414   1,585,160    -39.1%
cache-write tokens       1,014,764   1,238,503    -18.1%
output tokens               22,617      11,748    +92.5%
billed cost, USD              4.26        4.78    -11.0%
```

The output row goes against us and we are publishing it next to the others. The run measures the increase, not its cause. `python3 scripts/ab_cache.py` reruns all of it on your own machine.

## Fixed

`az ssh vm -- <command>` came back as two ssh client warnings and `[OMNI: 21 lines omitted]`, which is the answer cut and the noise kept. It is now treated like `ssh`, so the remote command's output arrives whole.

Redaction ended a value at the end of the line, so `APP_TOKEN=x ./bin/app serve &` lost its command, and it only read the first `=`, so a token behind an ordinary assignment on the same line was delivered. Both are fixed. A provider key printed with no name beside it, the way sourcing a file that holds a bare key prints one, is now hidden too.

One limit stated plainly: redaction runs on output OMNI rewrites. A command the host reports as failed, and a payload read as JSON or YAML, are still handed back untouched. That work is tracked in [#866](https://github.com/fajarhide/omni/issues/866).

```sh
brew upgrade omni
```

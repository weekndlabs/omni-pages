---
title: "The escape hatch the hook never read: v0.7.4"
description: "OMNI_PASSTHROUGH=1 is documented as raw output, every time, and did nothing on the Claude Code hook path because the hook is a separate process. Setup needed a terminal it never has. Redaction was deleting valid TSX. And the TOML filter layer, priced at 2,018 bytes over 6,656 commands, is gone."
date: 2026-08-13T10:30:00Z
tag: Release Note
author: OMNI Core Team
---

A release about claims that were not true. A documented escape hatch that did
nothing on the host it mattered on, a setup command an agent could not run, a
redaction rule that ate valid code, and a configuration layer worth 0.031% of the
corpus it slowed down.

## The escape hatch was inert on the host that carries the traffic

The manual says `OMNI_PASSTHROUGH=1 <your command>` skips the pipeline entirely,
raw output every time. It appears on four pages, including
`OMNI_PASSTHROUGH=1 kubectl get pods -o yaml`, which is exactly the case where
somebody needs the exact bytes.

It was true for `omni exec` and for the pipe, where one process both reads the
variable and does the work. It was false on the Claude Code hook path. The
`PostToolUse` hook is a process the host spawns, so it inherits the host's
environment and never sees an assignment written in front of a command. The
prefix did nothing, and nothing said so.

That is the worst shape a bug can take here: the hatch works everywhere you test
it by hand, because every hand test uses `omni exec`. The hook now parses the
leading `KEY=value` off the command string it is handed, so the documented form
behaves as documented.

## Setup needed a terminal, and the audience is agents

`omni init` with no flags opened a `dialoguer` menu, which can only fail without a
tty. It exited 1 on `IO error: not a terminal` and named no remedy. That is the
line the README, the Homebrew caption, this site and `install.sh` all print, so
the one documented instruction was the one an agent could not follow.

With no terminal it now configures the host that ran the command, read from the
environment the same way the exec and pipe paths already read it, and says which
host it picked. A host it cannot name, a plain shell included, gets an error
listing the flags rather than a guess. Falling back to `--all` was considered and
rejected: fourteen host configs and a file written into the working directory is
too large a side effect to trigger because stdin happened to be a pipe.

There is also a plugin, which makes the whole thing two lines typed inside the
session:

```
/plugin marketplace add fajarhide/omni
/plugin install omni@omni
```

It installs a skill rather than the binary, and that is the gap the MCP server
could never close. An agent with `omni_retrieve` wired still had nothing telling
it *when* to call it, or what to do when output arrives carrying a marker.

## Redaction was deleting code and calling it a credential

`key={item}` in a `.tsx` file came back as `key=[REDACTED]`. `key` is the prop
React requires on every list item, and a formatter puts it on its own line as soon
as the element has a few attributes, so it is the most common `key=` line in a
component. The redacted form is not valid TSX, so an agent that reads a file to
edit it and writes it back produces a syntax error.

The same rule was found eating this project's own test suite:
`PASS=$((PASS + 1))` in `tests/smoke_test.sh` arrived as `PASS=[REDACTED]`.

A brace expression is code, and a shell expansion names a value instead of holding
one. Both are delivered as written now. `API_KEY=sk-ant-...` and
`PASSWORD="$3cr3t!"` are still cut, and the second one is the reason the rule
checks what follows the `$` rather than the character alone.

## The filter layer is gone, and the savings did not move

Re-measured on the same 6,656-trace corpus with the loader stubbed to empty: the
aggregate is 2.7% / 14.9% with the TOML layer and 2.7% / 14.9% without it. The
whole layer was worth **2,018 bytes over 6,656 commands**, 0.031% of the corpus,
and infra output scored slightly better without it.

Priced by removal on the release binary rather than by a unit-test timer, it cost
**5 to 7 ms on every hook** against a 10 ms budget.

| | before | after |
|---|---|---|
| aggregate savings | 14.9% | **14.9%** |
| p90 per hook | 21.4 ms | **10.5 ms** |
| dependency tree | 265 crates | **237** |
| release binary | 9.93 MB | **9.17 MB** |

What replaces it is nothing. A tool that needs handling gets a Rust distiller,
which is snapshot-tested and cannot be shadowed by whichever regex matched first.
`clap` went the same way: it was 141 lines of derive deciding seven boolean flags,
in front of eighteen modules that parsed `argv` a second time anyway.

## The manual is now checked against the code

`tests/docs_match_the_code.rs` asserts that every `omni <cmd>` written inside a
shell fence in these pages is a subcommand the binary actually has, and it reads
the list from `main.rs` rather than keeping a copy. A page that documents a
command which exits 1 now fails the build instead of the reader.

Full notes are in the
[0.7.4 changelog](https://github.com/fajarhide/omni/blob/main/CHANGELOG.md).

```
brew upgrade omni     # or: omni update
```

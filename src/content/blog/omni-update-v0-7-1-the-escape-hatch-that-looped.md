---
title: "The escape hatch that looped: v0.7.1"
description: "omni retrieve exists so an agent can get the original bytes back. Its own stdout went through the post hook, so following the instruction produced another instruction. Two installer defects, both found by setting 0.7.0 up on a real machine."
date: 2026-08-11T16:05:00Z
tag: Release Note
author: OMNI Core Team
---

Two installer defects, both found by setting 0.7.0 up on a real machine rather
than by a gate, and both invisible to `omni doctor` until now.

## omni retrieve re-entered the pipeline it exists to escape

The marker tells the agent to run `omni retrieve <handle>`. That command's own
stdout went back through the Bash post-hook like any other output, so the
recovered content came back as a **fresh marker with a fresh handle**. Following
the instruction produced another instruction, and the original was unreachable
past the first hop.

Filed the day after the command was created, and worse than the defect it was
created to fix: there the escape hatch was unreachable, here it loops.

The post-hook declines any command that exists to hand archived bytes back,
`omni retrieve` and `omni diff`, and records the passthrough with its own reason.
Matched on the token after the program rather than by substring, so
`grep retrieve` and a file called `retrieve.md` keep being distilled.

**The same loop existed behind a second door, and it was not reported.** Probing
the sibling path after fixing the reported one found `omni exec omni retrieve
<handle>` doing exactly the same thing through `hooks::pipe`, which had no such
guard. It also still printed the **old** `omni_retrieve("...")` marker, the
MCP-only form the previous release was filed about, because that fix changed one
copy of the string and `pipe` carried its own.

Both are corrected, and the guard is one function shared by the two paths rather
than two copies free to drift apart the way the marker did.

## omni init registered OMNI twice when the binary moved

`ensure_hook` compared the command it was about to write against the ones already
there byte for byte, absolute path included, so reinstalling from a different
build matched nothing and appended.

A machine set up twice ran **two OMNI processes per hooked call**: the pre-hook
rewriting a command the first pass had already rewritten, the post-hook
distilling output the first pass had already distilled, and a second row recorded
for it.

Identity is the binary name plus the flag now, compared as a whole token because
`--pre-hook` ends with `-hook` and a substring test would collapse the two into
one. A match rewrites the command to the current path, which also makes an
upgrade that moves the binary a no-op rather than a duplication.

**Gemini CLI carried its own copy of the same wrong test** and nobody had
reported it, so `is_our_hook` lives in `agents/mod.rs` now and both hosts have a
test that installs from two paths and asserts one hook per event. Cursor and
Codex were already correct: both purge their own entries before writing.

Verified end to end as well as in unit tests: two binaries against one temp
`HOME`, eight events, one hook each.

## omni doctor reported [OK] for an install that ran OMNI twice

It asked whether a hook was present and never how many. It counts now and warns
per event, naming how many times that event would run OMNI. The installer no
longer creates the state; this is for the machines already in it.

## omni init --all was documented as Claude-only and configures fourteen hosts

The help listed it under `CLAUDE SPECIFIC FLAGS` as "Perform full Claude setup
(hooks + MCP)" while `init.rs` hands it the full agent list. One of those writes
lands in the working directory, because VS Code's config path is
`.vscode/mcp.json` relative to the cwd, so running it inside a repository writes
into that repository.

The behaviour is kept, since it is what someone typing `--all` wants, and the
help says both things now: the group is named for what it holds, and the flag
names the file it drops where you are standing.

## Documentation

The recovery path is named as the CLI everywhere, not as the MCP tool. The
README, the architecture doc and the Hermes integration guide had the agent
calling `omni_retrieve`, which is reachable only where MCP is wired.

`omni retrieve` and `omni dashboard` are documented in the README and all six
translations. They shipped in 0.7.0 without an entry anywhere a user reads.

```bash
brew install fajarhide/tap/omni && omni doctor
```

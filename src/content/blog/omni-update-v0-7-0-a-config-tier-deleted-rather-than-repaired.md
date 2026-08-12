---
title: "A config tier deleted rather than repaired: v0.7.0"
description: "The long-term support release. The ledger measures whether a fold pays for its own marker instead of clearing two proxies, 13.9% to 15.4%. A trust gate that let a repository edit what a visitor's agent sees is gone rather than fixed. Plus omni retrieve and omni dashboard."
date: 2026-08-11T09:30:00Z
tag: Release Note
author: OMNI Core Team
---

The long-term support release. Three things define it: the ledger stops guessing
whether a fold is worth making and measures it, the surfaces stop reporting
numbers the project had already retired, and a config tier that could let a
repository edit what a visitor's agent sees is deleted rather than repaired.

## The trust gate hashed a different file from the one it gated

`guard::trust::is_trusted` hashed `<project>/omni_config.json`, and the answer
decided whether to load `<project>/.omni/signals/*.toml`. **The hash covered a
different file from the one it gated**, so a signal added or edited after a
project was trusted loaded with the trust record untouched.

A TOML filter carries `strip_lines_matching`, which is enough to hide a failing
test or an error line from an agent. So a repository could quietly edit what its
visitors were shown.

The obvious repair is to hash the directory it actually gates. The deletion is
better and is what shipped. The tier is worth nothing measurable: disabling
**every** embedded signal moves the filter column by 804 bytes over 6,656
commands, and a project tier is a subset of that. What it costs is a supply
chain the tool does not need. 354 lines deleted against 43 added.

The integration test is inverted rather than removed: a signal placed inside a
checkout, with `omni_config.json` marking it trusted, must not load.

### OMNI reads no filter file from disk

This is the breaking change in the release. With the project tier gone,
`~/.omni/signals/` goes too. Every signal is compiled into the binary, so the
set that runs is the set the inline tests cover and no file on any machine
changes what an agent is shown.

What the external tiers cost is not a rounding error: a second dispatch path, a
cache fingerprint over files that may not exist, a load-time difference between
a developer's machine and CI, and a class of bug where a distiller is well
tested and unreachable.

Two writers had to become honest with it. `omni learn --apply` and the
`omni_learn` MCP tool both wrote a file and reported success. With nothing
reading that file, reporting success would be the fabrication class this project
exists to stop shipping, so both now say there is nowhere to apply to.

## The ledger folds when it pays for its marker

`MIN_LEDGER_RUN_LINES` and `MIN_LEDGER_RUN_BYTES` asked whether a run was big
and never whether it was worth replacing. A 3-line 150 byte run was refused,
while nothing anywhere compared a run against the size of the marker that would
replace it.

Both are gone, replaced by `MIN_LEDGER_RUN_GAIN`: fold only when the run saves
150 bytes **after** paying for its own marker, weighed against the marker
rendered rather than estimated, which is possible because a handle is always 16
characters. The marker is shorter too, 87 bytes to 65, and the two compound.

The split that decided this is worth recording. Of the repetition the ledger
declined, the 4-line bound held 266,005 bytes over 11,406 runs, which is **23
bytes per run against an 87 byte marker**. That bound was protecting the output
rather than costing anything.

Measured over 6,656 Claude Code traces from 2026-08-04 to 08-11: aggregate
**13.9% to 15.4%**, the ledger claiming 817,155 bytes over 849 folds against
720,518 over 678.

The 100 byte bar was left on the table deliberately. It is worth another 0.6
points and costs 240 more substitutions, which is the same choppiness trade the
sweep behind the old constants declined.

## omni retrieve, because a marker promised a tool half the hosts cannot call

Reported from a real session. A 50 line span of prose came back as
`[OMNI: 50 lines already shown, omni_retrieve("cd900c16a4a94eb2")]`, and
`omni_retrieve` is an MCP tool. On a host where it is not surfaced, the agent
was left with a hole in the file it had just read and no way to fill it.

Every marker names the CLI now, which exists everywhere. It accepts the handle
bare, quoted, or still wrapped in the old `omni_retrieve(...)` call, because a
model handing the marker back verbatim is the likeliest way it is called. An
unknown handle says why by naming the 30 day working tier rather than reading as
a broken archive.

## omni dashboard, on loopback, over the numbers omni stats prints

The terminal report is a snapshot and the meters are trends, which is the one
shape a table in a terminal cannot show. `std::net::TcpListener`, one thread, one
page, **no dependency added and no JavaScript**. It binds `127.0.0.1` and answers
`GET` only, because the database holds command output and none of it should
leave the machine.

Every panel reads a `Store` method the CLI already reads, so the two surfaces
cannot disagree. That constraint is the point rather than a shortcut: a dashboard
computing its own numbers would be a second source of truth, and this release
exists partly to fix one of those.

## Six adapters become a table

889 lines across `roo_code`, `opencode`, `copilot`, `antigravity`, `zed` and
`vscode` that differed in three fields: where the config lives, which JSON key
holds the server map, and what to call the host. `install`, `uninstall` and
`doctor_check` were the same code six times, so a seventh host meant a seventh
copy and the cheap path was the wrong one.

**802 lines deleted, 346 added.** Adding an MCP host is a row in
`mcp_host::HOSTS`. Zed keeps `context_servers` and VS Code keeps `servers`,
asserted by a test along with the property that no two hosts resolve to the same
file.

## Five smaller things that were reporting a state they did not have

**`omni patterns` reported 20 of 20 entries RESOLVED, five of which had fired 27
times.** `resolve_pattern` marked every unresolved pattern of a tool family at
once, so a single green `cargo test` declared five distinct failures fixed, and
nothing took the label back when they recurred. Resolved means "has not happened
since" now, which is the only reading an agent can act on.

**Every documented flag on `omni reset` was rejected before the command ran.**
`print_help` advertised thirteen and `main.rs` declared `Reset` as a bare clap
variant, so `omni reset --all` failed with "unexpected argument".

**`project_hash` had four implementations and one disagreed.** One trimmed the
trailing slash and three did not, so a project reached as `/foo/bar/` on one path
and `/foo/bar` on another had two addresses, and its knowledge, engrams and
patterns split across both while `omni_recall` found half.

**`loop_memory.ttl_days` was declared and never enforced.** The column has said
30 days since it was added while no `SELECT` filtered on it and no `DELETE` used
it, so goal memory was a permanent table wearing a retention label.

**The database wipe left `omni.db-wal` and `omni.db-shm` behind.** SQLite runs in
WAL mode, so the database is three files. 4.2 MB of `-wal` survived a wipe that
reported success, and a stale `-wal` beside a fresh database is the one way this
can corrupt rather than merely mislead.

```bash
brew install fajarhide/tap/omni && omni init
omni dashboard
```

---
title: "Contexere v0.8.0: OMNI Is Now Contexere"
description: "The binary is contexere, and omni keeps working as the same program. contexere doctor now runs each agent's hooks with a canary credential and shows which ones really fire and redact."
date: 2026-10-29
tag: Release Note
author: Contexere Core Team
image: /media/contexere-0.8.0.png
imageAlt: "Contexere v0.8.0 release card: OMNI is now Contexere, and nothing you installed breaks"
---

OMNI is now Contexere, Latin for "to weave together" and the root of "context". Nothing you installed breaks.

## One program, two names

The binary is `contexere`. `omni` stays installed as the same program, so every hook and MCP entry your agents already call keeps running, and under that name the MCP tools still answer as `omni_*`. `CONTEXERE_*` settings are read first and `OMNI_*` as the fallback, and `~/.omni` is read in place: nothing is copied or moved. `brew upgrade omni` gives you both commands.

`contexere init` now replaces a hook or MCP entry an omni install wrote on each host, instead of adding a second one beside it. A CI job installs the last omni release, upgrades it, and checks that the hook replies, `stats` and `retrieve` come back byte for byte, then downgrades again.

## Doctor runs the hook

`doctor` used to call a hook healthy when its entry existed in a config file. It now runs each registered post-hook the way the host does, with a canary credential in the payload, and reports whether it fires and redacts. A registered hook that cannot run shows up as `does not fire`. On Codex it says the hook runs and that the host does not apply rewritten output yet, rather than claiming protection it cannot give.

## Fixed

A database URL with no password, query or fragment, such as `postgres://localhost:5432/appdb`, comes through unredacted. A URL that carries credentials still does not.

A Python `key=lambda` argument is no longer redacted.

## One thing that has not changed

Output from a failing command still reaches the agent as printed, credentials included, so the agent sees the real error. The [markers page](https://omni.weekndlabs.com/docs/use/markers) lists what Contexere cannot reach.

The repository moved to [github.com/fajarhide/contexere](https://github.com/fajarhide/contexere), and the old address redirects.

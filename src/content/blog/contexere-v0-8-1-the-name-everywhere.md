---
title: "Contexere v0.8.1: The New Name, Everywhere You Look"
description: "contexere --version prints contexere, fajarhide/tap/contexere installs the same formula as fajarhide/tap/omni, and AGENTS.md tells contributors which old names stay."
date: 2026-10-29
tag: Release Note
author: Contexere Core Team
image: /media/contexere-0.8.1.png
imageAlt: "Contexere v0.8.1 release card: the new name, everywhere you look"
---

0.8.0 renamed the binary. 0.8.1 finishes the rename for everything a person reads, and leaves alone everything a machine parses.

## What now says Contexere

`contexere --version` prints `contexere 0.8.1`. Through the `omni` link it still prints `omni 0.8.1`, the same way the MCP tools answer as `omni_*` under that name.

`brew install fajarhide/tap/contexere` works and installs the same formula as `fajarhide/tap/omni`. The formula's caveats, description and homepage, the share card from `contexere stats`, the dashboard and two diagrams in the manual all say Contexere.

## What stays omni, on purpose

The `[OMNI` markers, `omni retrieve`, the `OMNI_*` settings, `~/.omni`, `omni.db` and the `omni` command keep their names, because hooks, agents and scripts already parse them. Renaming any of them would break an install that works today.

`CONTRIBUTING.md` now has a section listing every one of those names and why it stays, and a new `AGENTS.md` points coding agents at it, so a contributor's agent writes Contexere in prose and leaves the parsed names alone.

`brew upgrade omni` is all an existing install needs.

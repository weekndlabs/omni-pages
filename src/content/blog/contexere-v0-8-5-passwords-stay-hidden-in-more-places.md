---
title: "Contexere v0.8.5: Passwords Stay Hidden in More Places"
description: "Passwords and keys are now hidden in error messages, colored text and data files too, and harmless values like a package version stop vanishing. A security update, please update."
date: 2026-11-05
tag: Release Note
author: Contexere Core Team
image: /media/contexere-0.8.5.png
imageAlt: "Contexere v0.8.5 release card: passwords stay hidden in more places"
---

Passwords and keys are now hidden from your AI agent in more places, and a few harmless values that used to vanish come through again. This is a security update, so please update with `brew update && brew upgrade fajarhide/tap/contexere`.

## What changed

Contexere hides a password before your agent sees it. Until now a few routes went around that. An error message, text printed in color, a password inside a data file, or running with compression switched off could all hand a password to the agent as it was. Each of those routes now hides it the same way.

The opposite mistake is fixed too. A token limit such as `token_limit = 100000`, or a package version such as `openai==2.9.0` from `pip freeze`, was hidden as if it were a password. Both come through now. A real password under the same names stays hidden.

`contexere exec` now behaves like the command it runs: it keeps your settings, shows output live in your terminal, and ends with the same result. The installer checks that what it downloaded is the real release. Setup works from a folder with a space in its name, and an interrupted setup no longer breaks your agent's settings.

## How we checked

Every fix has a test that fails without it. On the released build we ran the two newest cases by hand: a password behind a color code stays hidden, and `openai==2.9.0` comes through whole.

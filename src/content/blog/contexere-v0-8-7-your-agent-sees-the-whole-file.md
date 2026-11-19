---
title: "Contexere v0.8.7: Your Agent Sees the Whole File"
description: "When your agent opens a code file to change it, it gets the whole file again, and passwords stay hidden in more places. This release carries security fixes, please update."
date: 2026-11-19
tag: Release Note
author: Contexere Core Team
image: /media/contexere-0.8.7.png
imageAlt: "Contexere v0.8.7 release card: your agent sees the whole file"
---

When your agent opens a code file to change it, it gets the whole file again instead of an outline, and passwords and keys stay hidden in more places. This release carries security fixes, so please update with `brew update && brew upgrade fajarhide/tap/contexere`.

## What changed

Contexere used to shorten a large code file to its outline when the agent read it whole: the imports and the names of each function, with every body left out. That saved little, because an agent reads a whole file right before it edits one. In our own recorded sessions, nearly every outline was followed by a second read of the same file. A full read of a code file now arrives as it is.

More passwords stay hidden. A spreadsheet or CSV column named `password` or `token` is now hidden in every way Contexere sees output, not only in one of them, and keys for npm, OpenAI, Stripe and Google are hidden wherever they appear.

The opposite mistake is fixed too. Code that only names a secret, a heading in a Markdown file, an SSH setting, and a simple count such as `DATABASE_URL=1` were hidden as if they were passwords. They come through now.

Your agent is no longer stopped for only mentioning a password file, for example in a note it is writing or a search it runs. At the same time, more ways of actually reading one are blocked, including through a container or a shell started inside another command.

Two smaller changes: `contexere carry list` shows what a new machine would need to run your agents, without showing any keys, and running setup again no longer adds a second copy when another tool sits in front of Contexere.

## How we checked

Every fix has a test that fails without it. On the released build we wrote a note that names a password file inside it; v0.8.5 refused that command, v0.8.7 runs it.

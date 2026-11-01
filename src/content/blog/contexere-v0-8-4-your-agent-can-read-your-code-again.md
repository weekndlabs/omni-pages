---
title: "Contexere v0.8.4: Your Agent Can Read Your Code Again"
description: "0.8.3 could hide normal output by mistake and call it secrets. This release fixes that. Please update."
date: 2026-11-01
tag: Release Note
author: Contexere Core Team
image: /media/contexere-0.8.4.png
imageAlt: "Contexere v0.8.4 release card: your agent can read your code again"
---

0.8.3 could hide normal output by mistake and call it secrets. This release fixes that. Please update with `brew upgrade fajarhide/tap/contexere`.

## What went wrong

0.8.3 learned to hide the password column of a spreadsheet. But it decided what counts as a spreadsheet too easily. If the first line of a result had a comma and a word like "password" or "secrets", it treated that line as column names and hid what came next.

So searching your code for how a password is handled could return one line and then `[REDACTED]`. Your agent could not read the answer, and it was told it had found secrets.

## What changed

Searching code that mentions a password shows the code again. A page or a tool result that mentions secrets shows all of it.

A real table still keeps its password column hidden.

## How we checked

We replayed the check over 9,478 recorded command results. 23 were hidden before, and 3 are now. Those 3 are ones we chose to leave: when it cannot tell, it hides rather than risks showing a password. The first fix was not enough, and reviewing it before release is what caught the rest.

Still open: `contexere exec` and pipe mode hand back a secret inside JSON, where the hook hides it. That is [#1021](https://github.com/fajarhide/contexere/issues/1021).

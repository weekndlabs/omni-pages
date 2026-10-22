---
title: "OMNI v0.7.12: Which Project Spent It"
description: "The bill view now prices every request by the model that served it and splits the spend by model, project and session. Query rows and failing tests arrive whole, and a token inside YAML is hidden where it stands."
date: 2026-10-22
tag: Release Note
author: OMNI Core Team
image: /media/omni-0.7.12.png
imageAlt: "OMNI v0.7.12 release card: which project spent it, and on which model"
---

0.7.11 showed what your agent was billed in tokens. This release says what that cost, and where it went.

## Spend by model, project and session

`omni stats --view bill` now prices each request from the model that served it, at API list price, and splits the total three ways:

```
At API list price (2026-10-06): $1078.32 over 7,214 requests, subagents included.

Spend by model                            requests         tokens        USD   share
claude-opus-5                                2,125    953,466,343     559.51   51.9%
claude-opus-5-5                              5,061  1,383,803,492     516.31   47.9%
claude-fable-5-1                                20      2,117,625       2.22    0.2%
claude-sonnet-5-5                                8        515,991       0.28    0.0%
```

`--by project` and `--by session` give the same table for each repository and each session. Cache writes are priced by how long they live, and a model missing from the price table shows as `unpriced` with its tokens, never as $0. The figure is what the same work costs on the API; a subscription bills differently.

## Fixed

`sqlite3`, `psql` and `mysql` output reaches your agent as printed. A query result was cut to three sample rows under a first row labelled as the column list, and a successful query whose rows contained the text `error:` was reported as a database error. The database summariser is gone.

A failing `bun test` keeps the lines that say where it failed: the `file:line`, the Expected and Received header, and the code frame.

A token inside YAML or other structured output is now hidden where it stands, and the rest of the document comes back unchanged. A comparison like `token === "py"` is no longer redacted as if it were a secret.

rustls and webpki move past six security advisories.

One limit stated plainly: a command the host reports as failed is still handed back untouched, credentials included. That is the next piece of [#866](https://github.com/fajarhide/omni/issues/866).

```sh
brew upgrade omni
```

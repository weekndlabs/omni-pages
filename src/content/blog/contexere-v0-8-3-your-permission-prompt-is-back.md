---
title: "Contexere v0.8.3: Your Permission Prompt Is Back"
description: "On Claude Code the pre-hook stops approving commands, and more ways of printing a credential are refused before they run. A security release: upgrade if you are on 0.8.2 or older."
date: 2026-11-01
tag: Release Note
author: Contexere Core Team
image: /media/contexere-0.8.3.png
imageAlt: "Contexere v0.8.3 release card: your permission prompt is back, and more credential reads refused"
---

0.8.3 is a security release. If you are on 0.8.2 or older, upgrade with `brew upgrade fajarhide/tap/contexere`.

## The pre-hook no longer approves commands on Claude Code

The pre-hook answered `allow` when it rewrote a command or attached a hint, and that answer skipped the host's permission prompt. On Claude Code 2.1.316 in default mode, `grep foo notes.txt; touch PWNED` was refused without the hook and ran with it.

It now makes no permission decision there and does not rewrite. The post-hook distills the same output. Codex and Gemini CLI still rewrite.

## More ways of printing a credential are refused

`cat<.env`, `{ cat .env; }`, `for` loops, a variable holding the path, `git show HEAD:.env`, `dd`, `jq` and a script passed to `python3 -c` are refused before they run, and so are files such as `.netrc`, `.pgpass`, `.kube/config`, `id_rsa` and `*.key`.

`contexere_run` applies the same refusal and redacts what a failed command prints. It is the only shell door on hosts with no hook, and it had neither.

Private key blocks, bearer tokens, JWTs, URL passwords and secrets in JSON or YAML are now hidden in the output, and JSON stays valid.

A hook still cannot stop a command built to evade it. Grep's `path`, `git -C repo show` and `sudo tr ... < .env` are not covered yet.

## Also in this release

`init` exits 1 when a host you asked for did not install. If you run it from a script with `set -e`, a failed host now stops that script.

The OpenClaw plugin installs from the binary instead of from `main`, and the binary builds 42 fewer crates.

Benchmarks were re-run on both corpora: on the frozen corpus the filters read 0.7% and the ledger 2.3%, and on the SWE-bench corpus 25.2% and 30.4%. `make bench` reproduces them.

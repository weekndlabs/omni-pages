---
title: "OMNI v0.7.10: We Gave Back Compression To Stop Being Wrong"
description: "This release compresses less than the last one, on purpose. Thirteen classes of false claim are closed, one of them a leak, and there is a second benchmark corpus that anyone can rebuild."
date: 2026-09-24
tag: Release Note
author: OMNI Core Team
image: /media/omni-0.7.10.png
imageAlt: "OMNI v0.7.10 release card: we gave back compression to stop being wrong"
---

The aggregate saving on our own corpus went from 3.0% to 2.4%. We are publishing that as the headline because of where the missing 0.6 points went: every one of them was being earned by handing your agent something that was not true.

## What was wrong

A `git diff` came back with its `diff --git` and `--- a/` header replaced by a bare filename, its context lines folded away because an earlier `cat` of the same file had shown them, and its `@@ -5,7 +5,7 @@` header left claiming seven lines on each side of a hunk that now showed two. `git apply --check` answered `patch fragment without header`. Worse than a broken patch, a reader taking that header at face value believes six lines of surrounding code were inspected and found unchanged.

A `grep` reply with nine of its eleven matches behind a retrieval handle read as a file with two matches. The pattern had already selected every line; folding some of them answers a different question rather than the same one shorter.

A `gh issue list --limit 20` returned twenty rows and delivered ten, under `... [10 more items, use --limit to see more]`. You had already set the limit. Raising it returns more rows from `gh` and the reply is still ten, so the only recovery the text named could not work.

And one of them was a leak. `printenv`, `set` and `export -p` delivered a password OMNI had already redacted, because the fallback path collapsed the raw output rather than the redacted one, and anything under 50 bytes skipped redaction entirely.

Thirteen classes in total, plus the output your host truncated no longer being booked as delivered, which had a later `tail` folding 90 lines the session never received.

## A second corpus, and this one you can rebuild

Every figure we have published came from one corpus, frozen on one machine, whose payloads stay local. You had to take it on trust.

Now there is a second one built from [SWE-bench Verified](https://www.swebench.com/): 40 instances across 10 public repositories, each pinned at its base commit, explored with a fixed script. No model, no API key, no container, so rebuilding costs nothing:

```sh
python3 scripts/build-swebench-corpus.py --instances 40 --stride 12
CORPUS_DIR=swebench-corpus ./scripts/bench.sh
```

The same build reads **25.2%** there against **0.8%** on our shell-heavy corpus. The difference is the workload and nothing else: the SWE-bench corpus is 85% source file reads, which is the case the ledger is built for, and our own corpus has always said it understates that case. Having both is what stops either number being quoted as OMNI's.

Two honest limits. The commands are a fixed script rather than what a model chose. And whether OMNI costs an agent its task success is a different question, one that needs a real agent scored on pass rates, and it is not answered here.

```sh
brew upgrade omni
```

The full picture, including the half that does not flatter us, is on the [benchmarks page](https://omni.weekndlabs.com/docs/develop/benchmarks).

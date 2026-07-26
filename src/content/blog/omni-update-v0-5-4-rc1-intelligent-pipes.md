---
title: "Filter Precedence & Intelligent Shells: v0.5.4-rc1"
description: "OMNI v0.5.4-rc1 introduces alphabetical filter priority, intelligent shell detection for complex pipes, and deep Terraform support with 40+ new rules."
date: 2026-03-25
tag: Release Note
author: OMNI Core Team
---

Complex bash workflows are the silent killer of AI context quality. When your infrastructure script chains together `grep | awk | sed | docker exec`, a traditional context filter has no idea which tool in the pipeline produced which output. It treats the entire concatenated stream as a single undifferentiated blob. OMNI v0.5.4-rc1 introduces an intelligent shell detection layer that can unravel even the most convoluted multi-pipe executions and apply the correct filter to each segment.

## Intelligent Shell Detection in `omni exec`

The enhanced `omni exec` command now automatically detects when a command contains pipes, redirects, or semicolons and transparently routes it through `sh -c` for proper shell interpretation. This might sound trivial, but the implementation required careful handling of several edge cases. The command's native output is seamlessly piped through OMNI's semantic engine in real-time, so distillation happens as the command runs, not after it completes. Even more importantly, native exit codes are now correctly preserved and returned to the caller, enabling proper error handling in automated pipelines that previously broke when OMNI swallowed non-zero exit statuses.

## The Filter Priority System

When multiple filters could match the same command (say a generic `npm` filter and a specialized `vitest` filter that both trigger on `npm run test`), which one wins? Before this release, the answer depended on filesystem ordering, which is nondeterministic across operating systems. We solved this with an explicit alphabetical sorting system for built-in filters. Files like `00_vitest.toml` now take guaranteed precedence over `npm.toml`, ensuring that the most specialized, highest-precision filter always activates first. This simple naming convention gives filter authors complete control over the match hierarchy without introducing complex priority metadata.

## Deep Terraform Support

Infrastructure-as-code pipelines are among the noisiest environments an AI agent can operate in. A single `terraform plan` on a moderately complex stack can produce thousands of lines of output, most of which is unchanged resource state that carries zero diagnostic value. This release ships over forty new specialized Terraform filter rules that surgically preserve only the creating, modifying, and destroying resource transitions while aggressively eliminating the repetitive "no changes" boilerplate. Combined with the existing Docker and Kubernetes filters, OMNI now provides comprehensive cloud infrastructure coverage across the entire modern DevOps stack.

## Filter Precision Refinements

The existing Vitest and Kubectl filters received targeted refactoring for higher signal-to-noise ratios. Vitest output handling was improved to better capture nested describe-block failures without trailing whitespace noise, and Kubectl filters were tuned to preserve resource state transitions while dropping the verbose metadata headers that Kubernetes appends to every API response.

## Session Tracking Stability

Under the hood, session state persistence was hardened with additional stability guarantees around rule application ordering. A subtle race condition in the session state serializer (where filter rules could occasionally be applied in a different order on replay than on initial capture) was identified and eliminated. The persistence layer now enforces strict deterministic ordering, ensuring that session replays produce bit-identical results.

## Hook Reliability Under Edge Conditions

The `PreToolUse` hook handling was refined to resolve edge cases where certain agent platforms would send malformed hook payloads during rapid command succession. Instead of crashing or silently dropping the context, OMNI now gracefully degrades to passthrough mode, logs a diagnostic warning, and recovers on the next well-formed request. Reliability under adversarial conditions is a non-negotiable requirement for infrastructure-grade software.

## Toward Deterministic Filtering

The overarching theme of this release candidate is determinism. Filter priority, session replay, hook handling: every component now guarantees reproducible behavior regardless of execution environment, filesystem ordering, or timing conditions. When your AI agent processes a command through OMNI, the result is identical whether it runs on your MacBook, a Linux CI server, or a Windows development machine. That level of consistency is what separates a tool from a platform.
---
title: "OMNI Design System: Elevating the CLI Experience in v0.4.2"
description: "OMNI v0.4.2 introduces a unified CLI design system, agent autopilot aliases for transparent interception, and fixes for the DSL engine and filters."
date: 2026-03-18
tag: Release Note
author: OMNI Core Team
---

Terminal interfaces do not have to be ugly. They do not have to be walls of misaligned text with inconsistent spacing and cryptic abbreviations. The terminal is a developer's primary workspace (often the only interface they interact with for hours at a time), and it deserves the same design attention we give to graphical user interfaces. OMNI v0.4.2 introduces the **OMNI Design System**, a shared UI architecture that brings visual consistency, precise alignment, and genuine beauty to every CLI subcommand.

## The `ui.zig` Architecture

At the core of this release is `ui.zig`, a new shared rendering module that provides perfectly aligned boxed layouts and high-resolution performance meters across all of OMNI's CLI output. Every status report, every diagnostic display, every statistics dashboard now renders through the same layout engine, guaranteeing consistent column widths, proper Unicode alignment, and beautiful box-drawing characters regardless of terminal emulator or font configuration.

The design system handles the surprisingly complex problem of terminal width calculation for mixed-width character sets. When your output contains a mix of ASCII, emoji, and CJK characters, naive string length calculations produce misaligned columns. Our renderer accounts for the actual display width of every character, producing pixel-perfect alignment even in the most linguistically diverse output environments.

## Agent Autopilot: Invisible Intelligence

One of the most architecturally ambitious features in this release is **Agent Autopilot**, a system of MCP aliases that automatically intercepts your AI agent's native tool calls and routes them through OMNI's distillation engine without any configuration changes. When your agent calls `Bash`, `run_command`, `ReadFile`, or `view_file` through the MCP protocol, Autopilot transparently intercepts the response, distills the output, and returns the clean, semantically-rich version. The agent never knows the difference. It simply receives better context, reasons more accurately, and produces higher-quality code.

This is the invisible-infrastructure philosophy in action. The best tools are the ones you forget you are using because they just make everything else work better.

## Custom DSL Rules Go Live

The custom token-reduction DSL system, which had been in experimental preview since v0.3.9, was fully activated and integrated into the main semantic engine in this release. Developers can now define precise, regex-based extraction and deletion rules in their `omni_config.json` that operate alongside the built-in filter system. This is invaluable for teams with proprietary internal tooling that produces unique noise patterns, the kind of output that no generic filter could anticipate, but that a custom three-line rule can eliminate instantly.

## Fixing the Invisible Crash

The most critical fix in this release addressed a use-after-free segmentation fault in the JSON config parser. When the engine loaded custom DSL rules from `omni_config.json`, it was storing references to string slices that pointed into a buffer that could be deallocated during a subsequent parse pass. Under specific timing conditions (typically during the first load after a config file modification), the engine would dereference freed memory and crash silently, producing no error output whatsoever. Users would see their command "hang" when in reality the process had segfaulted and the parent shell was waiting for a response from a dead process.

We fixed this by explicitly allocating owned memory for every config string slice, ensuring that the parsed configuration is self-contained and independent of the original parser buffer's lifecycle.

## Correcting the Filter Hierarchy

A related bug in the filter precedence system was also resolved. User-defined rules in `omni_config.json` were intended to take priority over built-in filters, but a sorting error in the rule application chain meant that built-in rules were evaluated first, and if a built-in rule matched, the user's custom rule was never even considered. We corrected the evaluation order to always prioritize user-defined rules, honoring the principle that developers must have ultimate control over their own distillation pipeline.

## The Small Things That Compound

We also cleaned up stray debug prints that had leaked into the production compressor pipeline. These `println!` statements (remnants of development debugging sessions) were injecting noise directly into the distilled output that OMNI was supposed to be cleaning. The irony was not lost on us. A tool designed to eliminate noise was generating noise of its own. Every debug print was removed, and we added CI lint rules to prevent `println!` statements from ever reaching the main branch again.

## Design as Engineering

This release embodies a principle we care deeply about: **design is an engineering discipline, not a cosmetic afterthought**. A well-designed CLI output is not just prettier. It communicates information faster, reduces cognitive load, and builds trust. When every column aligns perfectly and every metric is beautifully formatted, developers feel confident that the numbers they are reading are accurate. Visual precision signals computational precision. And that perception matters.
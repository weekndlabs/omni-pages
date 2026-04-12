---
title: "Magic Pipe Detection V2: OMNI v0.5.6-rc1 Delivers ROI Metrics & Custom Pricing"
description: "OMNI v0.5.6-rc1 introduces second generation pipe detection, per-token custom pricing, soft distillation routes, and built-in ROI metrics for your terminal operations."
date: 2026-04-12
tag: Release Note
author: OMNI Core Team
---

Today we are shipping the first release candidate for OMNI v0.5.6, our most significant refinement to the distillation pipeline since the pure Rust rewrite. This release focuses on transparency, control, and measurable value — finally answering the question every developer asks: *how much money am I actually saving right now?*

### Magic Pipe Detection V2

The star of this release is **Magic Pipe Detection V2**, our completely reworked heuristic engine for identifying and classifying terminal output streams. Where V1 operated purely on text signature matching, V2 understands execution context, process trees, and file descriptor relationships. The engine can now reliably detect when output is being piped between commands, even when stdio is being redirected through intermediate processes.

This isn't just an incremental improvement. Pipe detection accuracy jumps from 78% to **99.4%** across our entire test corpus. False positive filtering rates dropped by 72%. Most importantly: you will never again see OMNI accidentally activate on plain `cat` output or terminal escape sequences.

### Custom Token Pricing

Every developer pays different rates for their LLM endpoints. Up until now, OMNI used hardcoded GPT-4o pricing for all savings calculations. Starting with this release you can configure custom per-model token pricing directly in your `omni.toml`:

```toml
[pricing]
claude-opus-4-6 = { input = 15.00, output = 75.00 }
claude-sonnet-4-6 = { input = 3.00, output = 15.00 }
gpt-4o = { input = 2.50, output = 10.00 }
```

All dashboard statistics, historical reports, and ROI calculations will automatically use your actual costs. No more guesswork.

### Soft Distillation Route

We heard your feedback loud and clear: sometimes you don't want aggressive filtering. Sometimes you just want to remove noise without losing any semantic context.

This release adds the new **Soft** distillation route. Unlike the default mode which optimizes for maximum token reduction, Soft mode guarantees zero information loss while still removing redundant output, boilerplate headers, and progress bar spam. You can activate it per command with `--mode soft` or set it as your global default.

Expect 30-40% token savings with zero degradation in agent performance. Perfect for debugging sessions, log inspection, or any operation where you cannot risk dropping critical context.

### Built-In CLI ROI Metrics

The biggest addition in this release is something that has been requested more than any other feature: actual return on investment metrics.

Run `omni stats --roi` and you will now see:
- Total tokens saved since installation
- Estimated dollar value saved
- Average reduction ratio per command
- Payback time for your OMNI subscription

For the first time you can see exactly how much value OMNI is delivering for you, every single day.

### Polish & Fixes

As always this release includes dozens of under-the-hood improvements:
- TOML filter cache is now properly invalidated on config changes
- Command-first engine received major latency optimizations
- Statistics UX got a full visual polish and alignment pass
- Fixed broken telemetry flush logic on process exit
- Removed all remaining dead code paths
- Rewrote all fragile unit test assertions

### Looking Ahead

This is the first release candidate. We will be running this build internally for the next 72 hours before cutting the final stable release. If you want to help test, you can upgrade immediately with `omni upgrade --channel rc`.

v0.5.6 isn't about adding more features. It's about making OMNI work better for you. More predictable. More transparent. More honest about the value it delivers.

The pipe just got smarter.

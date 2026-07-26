---
title: "Data Driven Insights: Tracking ROI with OMNI v0.3.7"
description: "OMNI v0.3.7 introduces a local metrics system, multi-period analytics reports, per-agent filtering, and critical installer and symlink fixes."
date: 2026-03-16
tag: Release Note
author: OMNI Core Team
---

If you cannot measure it, you cannot improve it, and you definitely cannot justify it to your engineering manager. Token optimization sounds compelling in theory, but when the monthly AI bill arrives and leadership asks "what exactly are we getting for this context engine subscription?", you need concrete numbers. OMNI v0.3.7 fundamentally upgrades local operational insights to give you those numbers, automatically, with zero configuration.

## The Local Metrics System

Starting with this release, every `omni distill` invocation and every MCP tool call automatically records usage data to `~/.omni/metrics.csv`. This is a lightweight, local-first telemetry system: no data leaves your machine, no cloud analytics, no privacy concerns. Each record captures the timestamp, the command that was filtered, the input token count, the output token count, the savings percentage, and the processing time. Over days and weeks, this file builds into a comprehensive dataset that tells the complete story of OMNI's impact on your workflow.

## The Report Engine

The expanded `omni report` command transforms raw metrics data into beautiful, instantly readable analytics. Running `omni report` produces daily, weekly, and monthly breakdown tables showing total commands processed, total input tokens received, total output tokens delivered, total tokens saved, savings percentage, and cumulative processing time. The tables are formatted using OMNI's design system for perfect column alignment and professional presentation.

For teams running multiple AI agents, the `omni report --agent=claude-code` flag filters the report to show metrics for a specific agent. This per-agent view is invaluable for comparing the context efficiency of different agent platforms and optimizing your workflow based on data rather than intuition.

## Agent Tagging Infrastructure

To enable per-agent reporting, the `omni generate` command now includes `--agent=<name>` metadata in MCP configuration files. When an agent makes a tool call through the MCP protocol, the agent identifier is automatically recorded alongside the metrics data. This tagging happens transparently (no manual annotation required), and provides the foundation for increasingly sophisticated multi-agent analytics in future releases.

## Fixing the Installer Chain

Three significant bugs were fixed in the installation pipeline. First, the `install.sh` script had color formatting issues on certain terminal emulators where `%b` format specifiers were not correctly interpreted, causing ANSI escape codes to appear as raw text. We switched to POSIX-compatible escape sequences that render correctly across all major terminal emulators.

Second, the installer was not correctly passing the `-Dversion` flag during the build step, which meant that self-built binaries would report their version as an empty string or "development" even when built from a tagged release. The version is now correctly extracted from the Git tag environment and injected into the build flags.

Third, quoting issues in the installer script caused failures on systems where the installation path contained spaces. We audited every variable expansion and wrapped them in proper double quotes, resolving the silent installation failures that affected users with spaces in their usernames or custom installation directories.

## The Symlink Problem

The `omni setup` symlink creation logic was comprehensively rewritten. The previous implementation searched a single hardcoded path for the `index.js` entry point, which failed on non-standard installation locations and alternative package managers. The new implementation searches four candidate paths (covering Homebrew, npm global, yarn global, and manual installation), finds the correct entry point, removes any stale symlinks that exist from previous installations, and creates a fresh, verified symlink. This fix alone resolved the majority of "OMNI not found after installation" reports that had been accumulating in our issue tracker.

## Homebrew Sandbox Compliance

The Homebrew formula received an important structural change. Our `post_install` hook was attempting to modify files in `$HOME` (specifically creating the `~/.omni` directory and configuration files), which violates Homebrew's sandbox policy. The sandbox prevents formulae from accessing the home directory during installation for security reasons. We replaced `post_install` with `caveats` (a display-only message that instructs users to run `omni setup` after installation), bringing us into full compliance with Homebrew's security model.

## Release Script Improvements

The `omni-release.sh` script was updated to automatically bump the `build.zig.zon` and `package.json` version fields, and we removed a stale `ARCHITECTURE.md` link from `CONTRIBUTING.md` and `docs/index.html` that was pointing to a document that no longer existed. These are small housekeeping items, but broken links and outdated documentation erode trust with contributors and users alike.

## The ROI Imperative

With v0.3.7, OMNI transitions from a tool that promises value to a tool that proves it. Every token saved is recorded. Every session is measured. Every agent is tracked. When your team asks "is this worth it?", you open your terminal, run `omni report`, and let the data answer. That is the power of measurement, and it is now built into the core of OMNI's architecture.
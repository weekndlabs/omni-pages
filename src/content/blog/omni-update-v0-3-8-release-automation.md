---
title: "CI/CD Dominance: OMNI Release Automation v0.3.8"
description: "OMNI v0.3.8 achieves full version synchronization across eight files and upgrades the release automation pipeline for cross-platform reliability."
date: 2026-03-16
tag: Release Note
author: OMNI Core Team
---

Continuous delivery is easy to talk about and brutally hard to execute. It requires that every artifact in your release pipeline — binaries, packages, documentation, formulae — is built from the exact same source of truth, versioned identically, and published atomically. A single mismatched version string, a single un-updated file, and the entire chain of trust collapses. OMNI v0.3.8 is dedicated entirely to making our release pipeline bulletproof.

### The Eight-File Synchronization Challenge

OMNI is distributed across multiple ecosystems — npm, Homebrew, direct binary download, documentation sites — and each ecosystem has its own versioning convention and manifest format. In total, eight files carry version information: `package.json`, `package-lock.json`, `core/build.zig.zon`, `src/index.ts`, `src/index.js`, `scripts/omni-deploy-edge.sh`, `docs/index.html`, and `omni.rb`. Before this release, updating all eight was a manual process that relied on developer discipline and attention to detail. In practice, it meant that at least one file was wrong on nearly every release.

We rewrote `omni-release.sh` to automatically discover and update all eight version locations in a single atomic operation. The script parses each file format natively — JSON for package files, Zig build system syntax for build manifests, sed-based replacement for shell scripts — and verifies that all updates were applied correctly before committing. If any file fails to update, the entire release is aborted with a clear error message pointing to the problematic file.

### Hardened Deployment Verification

The release pipeline now includes explicit deployment verification checks that run after package publication. Instead of blindly trusting that `npm publish` and `brew push` succeeded, the automation actively queries the published packages and verifies that the expected version is available. This catch-22 verification — publishing, then verifying, then rolling back on failure — adds a few seconds to the release process but prevents the nightmare scenario of a half-published release where some users get the new version and others get a stale cache.

### The Edge Deployment Script

The `omni-deploy-edge.sh` script — used for deploying OMNI to edge computing environments and preview deployments — was updated to properly reference the docs directory and the deployment script's own version string. Previously, the script hardcoded a version number that was never updated by the release automation, causing edge deployments to always report themselves as version `0.3.5` regardless of the actual code being deployed. This silent version mismatch made debugging edge-specific issues nearly impossible.

### Why Automation Matters

This release contains zero user-facing features. No new commands, no new filters, no performance improvements. And yet, it is one of the most important releases in OMNI's history. Reliable release automation is the invisible foundation that makes every future feature possible. When we can ship with confidence — knowing that every artifact is consistent, every package is verified, every version string is correct — we can ship faster. And shipping faster means delivering more value to developers, more often, with less risk. The infrastructure of shipping is infrastructure worth investing in.
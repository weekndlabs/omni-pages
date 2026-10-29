# Contexere Site Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Re-skin omni.weekndlabs.com (home and blog) in the Contexere identity, with a mission-first hero, a woven timeline blog list and a "What you get" box on every post.

**Architecture:** Palette moves into the `:root` adapter of `src/styles/global.css`, replacing the colour mapping from `@weekndlabs/design` (fonts stay). Pure helpers for covers live in `src/lib/cover.js` with `node --test` coverage; two Astro components (`Mark`, `Cover`) render the mark and the generated covers as inline SVG. Pages consume them. `/docs` is a separate change in `fajarhide/contexere` and not part of this plan.

**Tech Stack:** Astro 6, plain CSS, `node:test`.

**Spec:** `docs/superpowers/specs/2026-10-29-contexere-site-redesign-design.md`

## Global Constraints

- Palette (dark, default): ground `#14172A`, panel `#1B1F36`, rule `#2C3150`, ink `#E6E8F2`, soft ink `#8F94B0`, threads `#5FAEF5` / `#9187F0` / `#3FD4B4`, teal is the one action accent.
- Palette (light): ground `#EEF0F6`, threads `#2F7FE0` / `#5B4FD6` / `#0E7462`; panel, rule, ink and soft ink as in the 0.8.1 card (`#E3E6F0`, `#CDD1E0`, `#14172A`, `#565B78`).
- Both themes pass WCAG AA (4.5:1 body text, 3:1 large text and UI).
- Mark geometry is `media/logo.svg` from `fajarhide/contexere`, three arcs, paths copied verbatim.
- Discord: `https://discord.gg/zHTuvZhF2M`. Install command: `brew install fajarhide/tap/contexere`.
- No percentage in the hero; every figure parsed or measured, never typed.
- Zero em dashes and en dashes in copy: `grep -rlE "$(printf '\342\200\224|\342\200\223')" dist/` must be empty after build.
- Grid tracks `minmax(0, 1fr)`; no horizontal scroll at 390px; tap targets 44px.
- Fonts: Inter and JetBrains Mono from `@weekndlabs/design`.
- Not in scope: `og:image`, domain, weekndlabs.com, `/docs`.

## Review Focus

- A post title with no version and no image (e.g. `why-your-ai-agent-is-expensive`) must get a mark-plus-title cover, not an empty or "vundefined" one. Test in Task 2.
- A release-candidate title (`v0.5.7-rc1`) must show the full `v0.5.7-rc1`, not `v0.5.7`. Test in Task 2.
- A post dated exactly 2026-10-29 belongs to the Contexere era (UTC date, no timezone slip). Test in Task 2.
- A post with no bullet list before its first `##` shows the description only; a post with no description cannot exist (schema requires it). Test in Task 2.
- At 390px the hero mark must not push the headline or cause horizontal scroll. Check in Task 4.

---

### Task 0: Tickets

- [ ] **Step 1:** Open an issue in `weekndlabs/omni-pages` titled "Redesign the site in the Contexere identity" linking the spec, and one in `fajarhide/contexere` titled "Restyle the manual theme for Contexere" (`docs/website/theme/omni.css`), English, no dashes.
- [ ] **Step 2:** Branch `redesign/contexere` off `origin/main` in omni-pages; commit the spec and this plan there first.

### Task 1: Palette and mark

**Files:**
- Modify: `src/styles/global.css` (the `:root` adapter and the light/dark theme blocks)
- Create: `src/lib/palette.js`, `src/lib/palette.test.js`
- Create: `src/components/Mark.astro`
- Modify: `public/favicon.svg` (replace with `media/logo.svg` from contexere)

**Interfaces:**
- Produces: `PALETTE = { dark: {...}, light: {...} }` with keys `ground, panel, rule, ink, inkSoft, t1, t2, t3`; `contrast(hexA, hexB) -> number`.
- Produces: `<Mark size?: number = 40, cropped?: boolean = false, class?: string />`. `cropped` renders arcs only (no rounded case), stroke colours from CSS vars `--t1/--t2/--t3`.
- Produces CSS vars on `:root`: `--paper, --paper-panel, --rule, --ink, --ink-soft, --accent` (now teal), `--t1, --t2, --t3`.

- [ ] **Step 1: Failing test** in `palette.test.js`: `contrast(PALETTE[t].ink, PALETTE[t].ground) >= 4.5`, same for `inkSoft`, and `>= 3` for each of `t1, t2, t3` on `ground`, for both `t` in `['dark','light']`. Also `contrast('#000000','#FFFFFF')` within 0.01 of 21.
- [ ] **Step 2:** `npm test` fails with module not found.
- [ ] **Step 3:** Implement `palette.js` (WCAG relative luminance). Values from Global Constraints. If a light value fails, darken it and record the new value in the spec, do not loosen the test.
- [ ] **Step 4:** Point the `:root` adapter and the theme blocks at these values; dark is the no-JS default. Keep `--wl-terminal-*` for the terminal.
- [ ] **Step 5:** `npm test` passes, `npm run build` passes.
- [ ] **Step 6:** Commit `feat: Contexere palette and mark`.

### Task 2: Cover helpers

**Files:**
- Create: `src/lib/cover.js`, `src/lib/cover.test.js`

**Interfaces:**
- Produces: `versionOf(title: string) -> string | null` using `/v\d+\.\d+\.\d+(-rc\d+)?/`.
- Produces: `eraOf(date: Date) -> 'contexere' | 'omni'`, Contexere when the UTC date is on or after `2026-10-29`.
- Produces: `glanceFor(body: string, description: string) -> { description: string, bullets: string[] }`, bullets are the first markdown list before the first `## ` line, markers stripped, inline markdown kept as text.

- [ ] **Step 1: Failing tests:**
  - `versionOf('Contexere v0.8.1: The New Name')` is `'v0.8.1'`; `versionOf('OMNI v0.5.7-rc1: Automated Tool')` is `'v0.5.7-rc1'`; `versionOf('Why your AI agent is expensive')` is `null`; `versionOf('The 6-stage pipeline')` is `null`.
  - `eraOf(new Date('2026-10-29'))` is `'contexere'`; `eraOf(new Date('2026-10-28T23:59:59Z'))` is `'omni'`.
  - `glanceFor('Intro.\n\n- one\n- two\n\n## Next\n- three', 'D')` is `{ description: 'D', bullets: ['one','two'] }`; `glanceFor('Intro only.\n\n## H\n- x', 'D').bullets` is `[]`.
  - Every file in `src/content/blog` yields a non-empty `description` from `glanceFor` (read front matter with a regex, no new dependency).
- [ ] **Step 2:** `npm test` fails.
- [ ] **Step 3:** Implement the three functions.
- [ ] **Step 4:** `npm test` passes.
- [ ] **Step 5:** Commit `feat: cover helpers for version, era and glance`.

### Task 3: Cover component

**Files:**
- Create: `src/components/Cover.astro`

**Interfaces:**
- Consumes: `versionOf` (Task 2), `<Mark cropped />` (Task 1).
- Produces: `<Cover title: string, image?: string, imageAlt?: string, size: 'row' | 'wide' />`. With `image` renders `<img>` with width/height (1200x630) and `alt`. Without, renders the navy panel, the cropped mark at the right, the version bottom left in mono when `versionOf(title)` is non-null, and the title top left only for `size='wide'` or when there is no version.

- [ ] **Step 1:** Implement. Aspect ratio 1200/630 for `row`, 1200/430 for `wide`.
- [ ] **Step 2:** `npm run build`, then open `dist/blog/index.html` and one post in a browser at 390px and 1280px: covers render, no overflow.
- [ ] **Step 3:** Commit `feat: generated post cover`.

### Task 4: Home hero and "Works today"

**Files:**
- Modify: `src/pages/index.astro` (hero section, new section after it, `<Layout title/description>`, `jsonLd` names)
- Modify: `src/styles/global.css` (hero styles)

**Interfaces:**
- Consumes: `<Mark />` (Task 1), existing reels data and terminal markup.

- [ ] **Step 1:** Replace the hero copy with, verbatim:
  - h1: `One place for the <span class="t1">skills</span>, <span class="t2">credentials</span> and <span class="t3">memory</span> of every agent you use.`
  - lede: `Because switching from Claude Code to Codex should not mean starting over.`
  - buttons: `Install` (`href="#install"`, solid teal), `Join Discord` (`https://discord.gg/zHTuvZhF2M`, ghost)
  - command: `brew install fajarhide/tap/contexere`
  - note: `Shipping today: the context and token layer. Memory and skills across agents are next.`
  - large `<Mark cropped />` on the right, cropped by the viewport edge, hidden below 720px or shrunk so the headline keeps its width.
- [ ] **Step 2:** Move the terminal figure, unchanged, into a new `<section class="band" id="today">` directly after the hero, heading `Works today`, with one sentence: `The context and token layer: repeated reads fold to one line, noisy builds keep the result, credentials are redacted before the model reads them.`
- [ ] **Step 3:** Rename the product in this page's title, description and JSON-LD from OMNI to Contexere; leave command names (`omni retrieve`, `omni init` in the install band) where they are real commands, switching `omni init` to `contexere init`.
- [ ] **Step 4:** `npm run build`; `grep -c "discord.gg/zHTuvZhF2M" dist/index.html` is at least 1; `grep -rlE "$(printf '\342\200\224|\342\200\223')" dist/` is empty; check 390px and 1280px in both themes: no horizontal scroll, buttons 44px tall.
- [ ] **Step 5:** Commit `feat: mission-first hero and works-today section`.

### Task 5: Blog list as a woven timeline

**Files:**
- Modify: `src/pages/blog/index.astro`, `src/styles/global.css`

**Interfaces:**
- Consumes: `eraOf` (Task 2), `<Cover size="row" />` (Task 3), existing `RC_SLUG` grouping.

- [ ] **Step 1:** Split non-RC posts by `eraOf(p.data.date)` into two groups headed `Contexere` and `OMNI`, newest first. Keep the featured lead and the RC group as they are now, below the timeline.
- [ ] **Step 2:** Each row: `<Cover size="row" />`, date, title, link to the post. A 3px vertical line in a `--t1 → --t2 → --t3` gradient runs down each group, one node per row.
- [ ] **Step 3:** Page title and JSON-LD names say Contexere.
- [ ] **Step 4:** `npm run build`; count rows in `dist/blog/index.html` equals non-RC posts on disk; 390px check; dash grep empty.
- [ ] **Step 5:** Commit `feat: woven timeline blog list`.

### Task 6: Post page with cover and "What you get"

**Files:**
- Modify: `src/pages/blog/[slug].astro`, `src/styles/global.css`

**Interfaces:**
- Consumes: `glanceFor` (Task 2), `<Cover size="wide" />` (Task 3).

- [ ] **Step 1:** Under the post header, render `<Cover size="wide" title image imageAlt />`, then a box headed `What you get` with `glanceFor(entry.body, entry.data.description)`: the description as the first row, then each bullet as a row, each row with a dot cycling `--t1, --t2, --t3`. The body below is unchanged.
- [ ] **Step 2:** `pageTitle` appends `, Contexere` when the title names neither OMNI nor Contexere; publisher in JSON-LD is Contexere.
- [ ] **Step 3:** `npm run build`; open `contexere-v0-8-1-the-name-everywhere`, `why-your-ai-agent-is-expensive` and one RC post at 390px and 1280px.
- [ ] **Step 4:** Commit `feat: post cover and what-you-get box`.

### Task 7: DESIGN.md and ship

**Files:**
- Modify: `DESIGN.md`

- [ ] **Step 1:** Rewrite `DESIGN.md` for the Contexere identity: palette and thread meanings, mark usage, the reversed colour source rule, hero order, timeline and glance box, keeping the content rules (no hero percentage, measured figures, lead with limits, no dashes).
- [ ] **Step 2:** `npm test && npm run build` green; dash grep on `dist/` empty.
- [ ] **Step 3:** Push the branch, open a PR in `weekndlabs/omni-pages` closing the Task 0 issue, with 390px and 1280px screenshots of home, blog list and one post in both themes. Read every review comment before merging.

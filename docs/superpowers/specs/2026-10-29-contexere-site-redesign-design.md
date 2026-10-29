# Contexere site redesign

Date: 2026-10-29. Scope: the home page, the blog (list and post) and the manual at `/docs`
on omni.weekndlabs.com.

## Why

OMNI became Contexere in 0.8.0. The site still wears OMNI's identity ("The receipt": light
paper, one animated terminal, itemized numbers) and sells token savings. Contexere's
direction is wider: one place for the skills, credentials and memory of every agent a
person uses, privacy first and self-hosted.

The owner's own trigger for the project was switching from Claude Code to Codex and
losing all context. The first screen has to give a visitor who has lived that moment an
"Aha, this is what I need" in about five seconds.

The blog is the second problem: it reads as a wall of text. 66 of 73 posts have no image.

## Goals

- First screen leads with the mission, names the switching pain right under it, and gets
  the visitor to **install first, then join Discord**.
- Say plainly what ships today (the context and token layer) and what does not yet
  (memory and skills across agents).
- Blog list and posts become visual without anyone drawing 73 images by hand.
- One identity across home, blog and `/docs`.

## Non-goals

- No new product features, no new numbers.
- No domain change. omni.weekndlabs.com stays.
- No change to weekndlabs.com.

## Anti-goals

- **Promising what does not ship.** A visitor who installs because of the switching pain
  and finds context still lost is worse than no visitor. Every forward-looking line is
  labelled as being built.
- Any figure typed rather than parsed or measured. The rule from the current `DESIGN.md`
  stays: no percentage in the hero, every number has its corpus beside it.
- Generic AI-site looks: blue-purple page gradients, glow, bento grids, a fake terminal.
  The one real terminal (from `src/demo/`) stays as evidence.
- Em dashes or en dashes anywhere in copy.

## Identity (decided)

Taken from the logo (`public/media/contexere-0.8.1.png` shows it applied):

- ground navy `#14172A`, panel `#1B1F36`, rule `#2C3150`, ink `#E6E8F2`, soft ink `#8F94B0`
- three threads: skills blue `#5FAEF5`, credentials violet `#9187F0`, memory teal
  `#3FD4B4`. Teal is the single accent for actions. The three together appear only where
  they mean the three things (the hero words, the mark, the blog thread).
- light variant: `#EEF0F6` ground, threads `#2F7FE0 / #5B4FD6 / #0E7462`. Both themes ship
  and pass AA.
- the mark drawn large and cropped by the edge is the hero art.

## Home page (decided: option B)

Hero, top to bottom:

1. "One place for the **skills**, **credentials** and **memory** of every agent you use."
   with each word in its thread colour, the large mark on the right.
2. "Because switching from Claude Code to Codex should not mean starting over."
3. Buttons: **Install** (primary, teal), **Join Discord** (secondary).
4. `brew install fajarhide/tap/contexere`
5. One honest line: the context and token layer ships today; memory and skills across
   agents are next.

Below the hero the existing sections stay as content (install band, why, what, hosts,
numbers, start), restyled. The animated terminal moves out of the hero into the "works
today" evidence. Section order and the split layouts below the hero are the builder's
call within the RHYTHM 2 rule of the current `DESIGN.md`.

## Blog list (decided: option B, woven timeline)

One vertical thread in the three thread colours runs down the page. Each post sits on it
as a row: small cover, date, title. Two eras: "Contexere" (0.8.0 onward) on top, "OMNI"
below.

Covers are generated from the release card template: version number plus the three
threads, title where it fits. A post with a real card (`image:` in front matter) uses it.
The two `Engineering` posts get a cover without a version.

## Blog post (decided: option A)

Wide cover with title and version, then a "What you get" box listing the post's release
lines with a thread-coloured dot each, then the prose. For old posts the box content comes
from the existing text (description or opening lines), moved, never rewritten.

## `/docs` (decided: restyle too)

The manual is mdBook, built by `scripts/build-docs.sh` from `docs/website` in
`fajarhide/contexere`, themed by `docs/website/theme/omni.css` there. Restyling it is a
change in the contexere repo and needs its own issue there first. Colours currently come
from `@weekndlabs/design`, which weekndlabs.com also uses, so Contexere's palette lives in
this site's own adapter (and the mdBook theme), not in that package.

## Left to the builder

- Typography: keep Inter and JetBrains Mono from `@weekndlabs/design` unless a reason is
  written down.
- How covers are generated (build-time script like `scripts/make-cards.mjs`, or SVG in
  the template).
- Mobile layout of the hero and the timeline, within the 390px and 44px tap-target rules.
- Rewriting `DESIGN.md` for the new identity as part of the work.

## Settled during the builder check

Marked as the designer's call where the owner did not decide it.

- **Mark:** the vector is `media/logo.svg` in `fajarhide/contexere`. Use it for the hero,
  covers and favicon.
- **Install and Discord:** Install anchors to the install band. Join Discord links to
  `https://discord.gg/zHTuvZhF2M`. `brew install fajarhide/tap/contexere` resolves (the tap
  carries a `contexere` alias of the `omni` formula, verified with 0.8.1).
- **Version on a cover (call):** parsed from the title with `/v\d+\.\d+\.\d+(-rc\d+)?/`.
  No match gives a cover with the mark and the title, no version. No front-matter field.
- **Eras (call):** by date. Posts dated on or after 2026-10-29 (0.8.0) are Contexere, the
  rest OMNI. Old titles keep the word OMNI; they are history.
- **"What you get" box (call):** the front-matter `description`, plus the post's first
  bullet list if it has one before the first `##`. Nothing is removed from the body. A post
  with neither shows no box.
- **Share images (call):** out of scope. `og:image` stays as today; generated covers are
  build-time SVG for the list and the post header only.
- **Palette source (call):** Contexere's palette lives in this site's `:root` adapter and
  in the mdBook theme, duplicated by hand. Fonts still come from `@weekndlabs/design`.
  Rule 4 of the old `DESIGN.md` is reversed for colour only.
- **Sequencing (call):** home and blog ship first. `/docs` follows once its issue in
  `fajarhide/contexere` lands; the mismatch in between is accepted. The docs theme keeps
  its own mdBook theme switch.
- **Works today section (call):** a new section directly under the hero holding the
  animated terminal. On a phone it comes after the hero, so the 2026-10-28 "demo before
  install" decision is superseded.

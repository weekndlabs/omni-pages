# DESIGN.md

Design direction for omni.weekndlabs.com. Transcribed on 2026-10-28 from decisions already
made in `src/styles/global.css`, the page comments, and the antislop audit in `anti-slop/`.
Nothing here is new direction except the three decisions the owner made the same day,
recorded at the end.

Dial: ENERGY 1 / RHYTHM 2 / MOTION 2

## Identity: "The receipt"

OMNI's claim is that it shows what it removed and lets you get it back. So the page is
built like a document the tool filed, not a brochure: quiet paper, one instrument (the
terminal), itemized numbers, and a receipt link beside every promise.

## Rules that hold the system together

1. **Mono means a machine emitted it. Sans means a person wrote it.** Never both inside
   one block. Commands, measurements and terminal output are mono. Labels, prose and
   headings are sans.
2. **One accent.** `--accent` (the weekndlabs blue, `--wl-ring`) marks links, the focus
   ring, the dot after the headline and the live reading in the terminal. Nothing else is
   coloured. The terminal keeps its own ramp (`--wl-terminal-*`) so it holds AA on its
   black ground in both themes. `--phosphor-hot` points at `--wl-terminal-blue`, never at
   `--accent`: under the light theme `--accent` measures 3.38:1 on the terminal ground.
3. **One row primitive.** Every list on the site is the same `dl` / `dt` / `dd` row, with
   a key column and a value column. No cards, no bento, no screenshot grid.
4. **No colour, family or measure is written in a rule.** Everything comes from
   `@weekndlabs/design` through the `:root` adapter in `global.css`. A design change is a
   version bump of that package, which also restyles `/docs`.

## Palette

Neutrals from the design system (paper, panel, ink, soft ink, rule) plus the single
accent. The terminal ground is the one dark surface on a light page. Both themes ship and
both must pass AA. Light is the no-JS default.

## Typography

Inter for display and body, JetBrains Mono for machine output, both from
`@weekndlabs/design`. They were chosen to match weekndlabs.com and the manual at `/docs`
rather than for this page alone. Labels are sentence case, with no tracked uppercase on
paper.

## Layout

- Measures: 1180 home, 900 list pages, 748 article.
- Every grid track is `minmax(0, 1fr)`. A bare `1fr` takes nowrap content as its floor and
  has overflowed the 390px layout twice.
- Tap targets are 44px minimum at every width.

## Motion

The motion budget goes to the hero terminal alone. It shows raw output, strikes the noise
line by line, collapses it, and shows what the agent received. Nothing else on the page
animates, and nothing scrolls in or reveals. With reduced motion the terminal jumps
straight to the final state.

## Content rules

- **No percentage in the hero.** The benchmark figure moves twentyfold between workloads.
  Numbers live in the Numbers section, with their corpus and caveat beside them.
- **Every figure is parsed or measured, never typed.** Corpus figures come from the
  current run in the manual (`src/lib/readme-stats.js`). The demo and the share card come
  from real `omni exec` output (`scripts/make-demo.sh`, `src/demo/`).
- **Lead with limits.** Costs and failures sit beside the claims, not below them.
- **No em dashes or en dashes in any copy.** Check `dist/` with grep after building.

## Decisions, 2026-10-28

1. **RHYTHM 2.** The row primitive stays, and two sections break the heading-plus-rows
   shape: Why and Numbers use a split layout, with the heading and prose on the left and
   the evidence on the right. Every other section keeps the standard shape.
2. **On a phone the demo comes before install.** The first screen shows the headline, the
   lede, the two buttons and then the terminal. Desktop keeps the two columns.
3. **Why carries one concrete example.** A static before and after of the `git status`
   fixture, measured from `src/demo/`. It sits on paper rather than in a second terminal,
   because the page has one instrument and that one animates.

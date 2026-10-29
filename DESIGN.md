# DESIGN.md

Design direction for omni.weekndlabs.com since the rename to Contexere (2026-10-29).
The decisions and their reasons are in
`docs/superpowers/specs/2026-10-29-contexere-site-redesign-design.md`.

Dial: ENERGY 2 / RHYTHM 2 / MOTION 2

## Identity: "The weave"

Contexere is Latin for "to weave together". The mark is three arcs, and each arc is one
thing Contexere holds for every agent: skills, credentials, memory. The page uses those
three threads as its only colour, and only where they mean those three things.

## Rules that hold the system together

1. **Mono means a machine emitted it. Sans means a person wrote it.** Never both inside
   one block. Commands, measurements and terminal output are mono.
2. **One action accent.** Teal (`--accent`, `--t3`) marks buttons, links and the focus
   ring. The three threads appear together only in the hero words, the mark, the journal
   thread and the dots of the "What you get" box.
3. **One row primitive** for lists of facts (`dl` / `dt` / `dd`). Covers are the one
   image surface; no bento, no screenshot grid.
4. **Colour lives in `global.css`, fonts and measures in `@weekndlabs/design`.** The
   palette is written once in the `:root` adapter and mirrored in `src/lib/palette.js`,
   whose test holds both themes to AA. Change both together. weekndlabs.com keeps its own
   colours because Contexere's no longer come from the package.

## Palette

| | dark (default) | light |
| --- | --- | --- |
| ground | `#14172A` | `#EEF0F6` |
| panel | `#1B1F36` | `#E3E6F0` |
| rule | `#2C3150` | `#CDD1E0` |
| ink | `#E6E8F2` | `#14172A` |
| soft ink | `#8F94B0` | `#565B78` |
| skills | `#5FAEF5` | `#2F7FE0` |
| credentials | `#9187F0` | `#5B4FD6` |
| memory, accent | `#3FD4B4` | `#138A72` |

Dark is the no-JS default; an OS that asks for light gets light; a stored toggle wins.
The terminal keeps its own `--wl-terminal-*` ramp on a black ground in both themes.

## Typography

Inter for display and body, JetBrains Mono for machine output, both from
`@weekndlabs/design`. Sentence case labels, no tracked uppercase on paper.

## Layout

- Hero: mission headline with the three thread words, the switching pain as the lede,
  Install (teal) then Join Discord, the brew command, one line on what ships today. The
  mark sits on the right, cropped by the page edge, hidden at 900px and below.
- "Works today" sits directly under the hero and holds the animated terminal.
- Journal: one thread per era (Contexere, then OMNI), a cover on every row.
- Post: wide cover, then "What you get" (description plus the post's opening list), then
  the body, unchanged.
- Every grid track is `minmax(0, 1fr)`. Tap targets are 44px minimum.

## Covers

A post with `image:` in its front matter shows that card, never cropped. Every other post
gets a drawn cover: the cropped mark, the version parsed from the title
(`src/lib/cover.js`), and the title when there is no version or the cover is wide.

## Motion

The terminal in "Works today" is the only thing that animates. With reduced motion it
jumps to the final state.

## Content rules

- **No percentage in the hero.** Numbers live in the Numbers section, with their corpus
  and caveat beside them.
- **Promise only what ships.** Anything not shipped is labelled as next, never shown as
  working.
- **Every figure is parsed or measured, never typed.** Corpus figures come from the
  manual (`src/lib/readme-stats.js`); the demo from real output (`scripts/make-demo.sh`).
- **Lead with limits.** Costs and failures sit beside the claims.
- **No em dashes or en dashes in any copy.** Grep `dist/` after building.

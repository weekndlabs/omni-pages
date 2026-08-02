/**
 * Shared blog rules, used by both astro.config.mjs and the blog pages.
 *
 * This lives in its own module rather than in astro.config.mjs, because
 * importing the config from a page pulls Astro's own internals into the bundle
 * and the build fails to resolve @astrojs/compiler-rs.
 */

/**
 * Release-candidate notes are project history worth keeping, but nobody
 * searches for "v0.5.7-rc1". Fourteen of them were indexed, near-duplicate and
 * 180 to 424 words each, diluting the handful of posts that do earn traffic.
 * They stay online and stay crawlable, they just leave the index and sitemap.
 */
export const RC_SLUG = /-rc\d/;

export const isReleaseCandidate = (idOrUrl) => RC_SLUG.test(idOrUrl);

export const wordsIn = (entry) => (entry.body || '').trim().split(/\s+/).length || 1;

/**
 * A per-version note, under either filename prefix. The repo uses both
 * `omni-update-v0-6-9-*` and `omni-v0-5-0-*`, and neither is the convention,
 * which is why this matches the version token rather than the prefix. Same test
 * `postFor` in changelog.js relies on.
 */
export const VERSION_SLUG = /v\d+-\d+-\d+/;

/**
 * Evergreen posts are the ones that answer a question someone might actually
 * search for, rather than announcing a version.
 *
 * This used to test `id.startsWith('omni-update-')`, which missed the four
 * `omni-v0-*` release notes and served them as evergreen. The effect was not
 * cosmetic: the pool was 8 rather than 4, and "Worth reading next" on the
 * v0.6.9 post pointed at three v0.4 and v0.5 release notes and no deep dive at
 * all. The whole point of the block is to point at the handful worth reading.
 *
 * Length alone does not work here: several release notes are long because they
 * embed big code blocks, and ranking by word count surfaced
 * `omni-update-v0-4-4-test-infrastructure` above every deep dive.
 */
export const isEvergreen = (id) => !RC_SLUG.test(id) && !VERSION_SLUG.test(id);

/**
 * Three evergreen posts to link from `current`, rotated by position so the
 * internal links spread across the whole evergreen set instead of every page
 * pointing at the same three. Deterministic, so builds stay reproducible.
 */
export function relatedFor(current, all, count = 3) {
	const pool = all.filter((p) => isEvergreen(p.id) && p.id !== current.id);
	if (pool.length <= count) return pool;
	const ordered = [...pool].sort((a, b) => a.id.localeCompare(b.id));
	const offset = [...all].sort((a, b) => a.id.localeCompare(b.id))
		.findIndex((p) => p.id === current.id);
	return Array.from({ length: count }, (_, k) => ordered[(offset + k) % ordered.length]);
}

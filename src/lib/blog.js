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
 * Evergreen posts are the ones that answer a question someone might actually
 * search for, rather than announcing a version. The repo names per-version
 * notes `omni-update-*`, so the slug carries the distinction already.
 *
 * Length alone does not work here: several release notes are long because they
 * embed big code blocks, and ranking by word count surfaced
 * `omni-update-v0-4-4-test-infrastructure` above every deep dive.
 */
export const isEvergreen = (id) => !RC_SLUG.test(id) && !id.startsWith('omni-update-');

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

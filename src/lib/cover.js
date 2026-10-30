/**
 * What a generated post cover and the "What you get" box need, derived from the
 * post itself so none of the 73 posts has to be tagged by hand.
 */

/** The release a title names, rc suffix kept, or null for a post that is not one. */
export const versionOf = (title) => (title.match(/v\d+\.\d+\.\d+(-rc\d+)?/) || [null])[0];

/* 0.8.0, the first release under the new name. Compared in UTC because Astro
   parses a front-matter date as UTC midnight. */
const CONTEXERE_FROM = Date.UTC(2026, 9, 29);

export const eraOf = (date) => (date.valueOf() >= CONTEXERE_FROM ? 'contexere' : 'omni');

/**
 * The box shows the description, then the post's first bullet list if it comes
 * before the first `## ` heading. Nothing is removed from the body, so the box
 * is a summary of the post, not a part of it.
 */
export function glanceFor(body, description) {
	const intro = body.split(/^## /m)[0];
	const bullets = [];
	for (const line of intro.split('\n')) {
		const m = line.match(/^\s*[-*]\s+(.*)$/);
		if (m) bullets.push(m[1].trim());
		else if (bullets.length && line.trim() === '') continue;
		else if (bullets.length) break;
	}
	return { description, bullets };
}

const versionKey = (title) =>
	(versionOf(title) || 'v0.0.0').slice(1).split(/[.-]/).map((n) => parseInt(n.replace('rc', ''), 10) || 0);

/**
 * Sort comparator for posts: newest date first, and on a shared date the higher
 * version first, compared as numbers so v0.8.10 beats v0.8.9.
 */
export function newestFirst(a, b) {
	const byDate = b.data.date.valueOf() - a.data.date.valueOf();
	if (byDate) return byDate;
	const [x, y] = [versionKey(a.data.title), versionKey(b.data.title)];
	for (let i = 0; i < Math.max(x.length, y.length); i++) {
		if ((y[i] || 0) !== (x[i] || 0)) return (y[i] || 0) - (x[i] || 0);
	}
	return b.id.localeCompare(a.id);
}

/** A title for a drawn cover: the version and the brand beside it are already on the cover. */
export const coverTitle = (title) =>
	title.replace(/\s*(?:(?:OMNI|Contexere)\s+)?v\d+\.\d+\.\d+(-rc\d+)?:?\s*/, ' ').replace(/^\s*:?\s*|\s*:?\s*$/g, '');

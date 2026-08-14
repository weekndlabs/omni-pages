/**
 * The manual's pages, as the URLs a reader actually lands on.
 *
 * mdBook writes `.html` and this site serves those extensionless, so the file
 * names on disk are not the URLs. The sitemap in astro.config.mjs and the
 * canonical tags written by scripts/docs-meta.mjs have to name the same URL as
 * each other and as the server, so this is the one place that decides which.
 *
 * The two forms are not a style choice, they are what the server answers:
 *
 *     /docs/concepts/what-it-is.html  308  /docs/concepts/what-it-is
 *     /docs/index.html                308  /docs, then 308 /docs/ (vercel.json)
 *
 * and each is also the only form whose relative assets resolve. From
 * `/docs/concepts/what-it-is`, mdBook's `../css/general.css` lands on
 * `/docs/css/general.css`; add a trailing slash and the same link asks for
 * `/docs/concepts/css/general.css`. An index page is the other way round, which
 * is what the `/docs` redirect in vercel.json exists for.
 */
import { existsSync, readdirSync } from 'node:fs';

export const SITE = 'https://omni.weekndlabs.com';

/* Rendered by mdBook, but not pages. print.html is the whole book on one URL,
   404.html is what a miss is served, and toc.html is the sidebar iframe. Each
   would be a duplicate or a dead entry in the sitemap, and none of them is a
   URL worth pointing a canonical at. */
const NOT_A_PAGE = new Set(['print.html', '404.html', 'toc.html']);

/**
 * Every rendered page as `{ file, url }`, sorted by URL. Both books: the
 * Indonesian one is rendered inside the English one at /docs/id, so walking the
 * tree finds it without knowing it exists.
 *
 * An absent root is not an error. `astro dev` runs without build-docs.sh, and a
 * missing manual should cost the dev server its /docs entries, not its start.
 */
export function docsPages(root = 'public/docs', prefix = '/docs') {
	if (!existsSync(root)) return [];
	const walk = (dir, base) =>
		readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
			if (entry.isDirectory()) return walk(`${dir}/${entry.name}`, `${base}/${entry.name}`);
			if (!entry.name.endsWith('.html') || NOT_A_PAGE.has(entry.name)) return [];
			return [{
				file: `${dir}/${entry.name}`,
				url: entry.name === 'index.html' ? `${base}/` : `${base}/${entry.name.slice(0, -'.html'.length)}`,
			}];
		});
	return walk(root, prefix).sort((a, b) => a.url.localeCompare(b.url));
}

/* The five entities mdBook writes into rendered prose. Decoded before the
   description is cut so a truncation cannot land inside one, then re-escaped
   because the result goes into an HTML attribute. */
const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', '#39': "'" };
const NAMES = { '&': 'amp', '<': 'lt', '>': 'gt', '"': 'quot' };
const decode = (s) => s.replace(/&(amp|lt|gt|quot|#39);/g, (_, name) => ENTITIES[name]);
const escape = (s) => s.replace(/[&<>"]/g, (c) => `&${NAMES[c]};`);

/**
 * A page's own description, taken from its first paragraph.
 *
 * The alternative was a hand-kept map of path to description, which is the kind
 * of thing that is right on the day it is written and wrong two chapters later.
 * The manual opens every page on a sentence that says what the page is, so the
 * first paragraph is already the description someone would have written.
 *
 * Regex rather than a parser because the input is mdBook's own output, not the
 * web: same generator, same shape on every page, and a parser would be a
 * dependency for one match. Returns null when there is no prose to take, and
 * the caller keeps whatever mdBook wrote.
 *
 * The first paragraph with words in it, not simply the first: develop/pipeline
 * opens on a diagram, and mdBook wraps an image in a `<p>` of its own.
 */
export function descriptionFrom(html, limit = 160) {
	const main = html.match(/<main[^>]*>([\s\S]*?)<\/main>/i)?.[1];
	if (!main) return null;
	for (const [, paragraph] of main.matchAll(/<p>([\s\S]*?)<\/p>/gi)) {
		const text = decode(paragraph.replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim();
		if (!text) continue;
		if (text.length <= limit) return escape(text);
		const cut = text.lastIndexOf(' ', limit - 1);
		return `${escape(text.slice(0, cut > 0 ? cut : limit - 1))}…`;
	}
	return null;
}

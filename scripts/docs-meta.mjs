#!/usr/bin/env node
/**
 * Write the three tags mdBook cannot, into the manual this repo just rendered.
 *
 * mdBook's head.hbs sees only `{{ path }}`, the *source* path
 * (`concepts/the-ledger.md`), and Handlebars there has no string helpers to
 * strip the extension. A canonical built from that names a URL that redirects,
 * which splits the signal rather than joining it, so og:url and the canonical
 * were left out of the manual on purpose (fajarhide/omni#531) and are written
 * here instead, where the built HTML and the real URL are both in hand.
 *
 * The description is the same story from the other side: book.toml holds one
 * string and mdBook repeats it on every page, so every result for the manual
 * carries the same snippet.
 *
 * Runs from scripts/build-docs.sh, after the copy into public/docs and before
 * astro build picks the directory up.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { SITE, docsPages, descriptionFrom } from '../src/lib/docs-urls.js';

const pages = docsPages();
if (pages.length === 0) {
	console.error('docs: no rendered manual under public/docs, run build-docs.sh first');
	process.exit(1);
}

let described = 0;
let stamped = 0;

for (const { file, url } of pages) {
	const html = readFileSync(file, 'utf8');
	// Re-running this by hand is the normal way to debug it, and a second pass
	// would otherwise write a second canonical into the same head.
	if (html.includes('rel="canonical"')) continue;

	const href = SITE + url;
	let out = html.replace(
		/^([ \t]*)<\/head>/m,
		(_, indent) =>
			`${indent}    <link rel="canonical" href="${href}">\n` +
			`${indent}    <meta property="og:url" content="${href}">\n` +
			`${indent}</head>`,
	);
	if (out === html) {
		console.error(`docs: ${file} has no </head>, nothing to write into`);
		process.exit(1);
	}

	const description = descriptionFrom(html);
	if (description) {
		out = out.replace(
			/<meta name="description" content="[^"]*">/,
			`<meta name="description" content="${description}">`,
		);
		described += 1;
	}

	writeFileSync(file, out);
	stamped += 1;
}

console.log(`docs: ${stamped} pages given a canonical and og:url, ${described} of them a description of their own`);

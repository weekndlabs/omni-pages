/**
 * Render public/media/og.png, the share card on every page of this site and on all
 * 64 manual pages, and the same card at the size GitHub's social preview wants.
 *
 *     node scripts/make-cards.mjs
 *
 * Run it when the card's words or the mark change. Deliberately not wired
 * into `npm run build`: the build runs on Vercel, which has no browser, and a card
 * that silently fails to regenerate in CI is how the card this replaced went weeks
 * out of date without anyone noticing, shipping 58.9% across 1,810 executions long
 * after the corpus became 6,656.
 *
 * There was a second card, perf-card.html to public/media/performance.png. It was
 * hotlinked by six translated READMEs and by nothing else, published the same stale
 * figure to them, and duplicated a table each of those files already carried.
 * Removed in fajarhide/omni#563. The loop below is kept for one card because the
 * next one is a template and an entry, not a rewrite.
 *
 * Chrome and not a rasteriser library: these are real stylesheets from
 * @weekndlabs/design with a variable font and oklch colours, and ImageMagick
 * renders that as a black rectangle.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, unlinkSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');

/* Chrome is not on PATH under any name on macOS, so `which` finds nothing. Name
   the path that was tried rather than failing with a spawn error. */
const CHROME =
	process.env.CHROME_PATH ||
	'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const CARDS = [
	{ template: 'og-card.html', out: 'public/media/og.png', size: '1200,630', scale: 2 },
	// Uploaded by hand in the repo's Settings, under Social preview. GitHub has no API for it.
	{ template: 'og-card.html', out: 'public/media/github-social-preview.png', size: '1280,640', scale: 2 },
];

for (const card of CARDS) {
	const html = readFileSync(resolve(here, card.template), 'utf8');

	/* Written beside the template so the relative hrefs to node_modules and
	   public/logo.svg still resolve. */
	const tmp = resolve(here, `.${card.template}.rendered.html`);
	writeFileSync(tmp, html);
	try {
		execFileSync(
			CHROME,
			[
				'--headless',
				'--disable-gpu',
				'--hide-scrollbars',
				`--window-size=${card.size}`,
				`--force-device-scale-factor=${card.scale}`,
				`--screenshot=${resolve(root, card.out)}`,
				`file://${tmp}`,
			],
			{ stdio: 'ignore' },
		);
	} finally {
		unlinkSync(tmp);
	}
	console.log(`${card.out}`);
}


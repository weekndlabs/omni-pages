/**
 * Render public/media/og.png, the share card on every page of this site and on all
 * 64 manual pages, from the benchmark parser.
 *
 *     node scripts/make-cards.mjs
 *
 * Run it when a benchmark figure moves or the mark changes. Deliberately not wired
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
import { getBenchmarkStats, extremes } from '../src/lib/readme-stats.js';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');

/* Chrome is not on PATH under any name on macOS, so `which` finds nothing. Name
   the path that was tried rather than failing with a spawn error. */
const CHROME =
	process.env.CHROME_PATH ||
	'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const stats = await getBenchmarkStats();
const { best } = extremes(stats.rows);
const fx = stats.fixtures['git status'];

const CARDS = [
	{
		template: 'og-card.html',
		out: 'public/media/og.png',
		size: '1200,630',
		scale: 2,
		values: {
			BEST: best.savings,
			BEST_CLASS: best.command,
			OVERALL: stats.overallSaved,
			CALLS: stats.totalCalls,
			FIXTURE_IN: fx.input,
			FIXTURE_OUT: fx.output,
			FIXTURE_SAVED: fx.savings,
		},
	},
];

for (const card of CARDS) {
	let html = readFileSync(resolve(here, card.template), 'utf8');
	for (const [k, v] of Object.entries(card.values)) {
		const token = `{{${k}}}`;
		if (!html.includes(token)) throw new Error(`${card.template} has no ${token}`);
		html = html.replaceAll(token, v);
	}

	/* A leftover placeholder renders as literal braces, which is worse than a stale
	   number because it reads as a broken deploy rather than as a wrong claim. */
	const leftover = html.match(/\{\{[A-Z_]+\}\}/g);
	if (leftover) throw new Error(`${card.template} unsubstituted: ${leftover.join(', ')}`);

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

console.log(`${stats.overallSaved} across ${stats.totalCalls}, best ${best.savings} on ${best.command}`);

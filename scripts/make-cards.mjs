/**
 * Render the two shared images from the benchmark parser.
 *
 *     node scripts/make-cards.mjs
 *
 *   public/media/og.png           the share card, on every page of this site and
 *                                 all 64 manual pages
 *   public/media/performance.png  the benchmark card, hotlinked by six translated
 *                                 READMEs in fajarhide/omni
 *
 * Run it when a benchmark figure moves or the mark changes. Deliberately not wired
 * into `npm run build`: the build runs on Vercel, which has no browser, and a card
 * that silently fails to regenerate in CI is how the last pair went weeks out of
 * date without anyone noticing. og.png shipped 58.9% across 1,810 executions after
 * the corpus became 6,656, and performance.png published the same figure to six
 * languages while README.md published 14.9% to the seventh.
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

/* "2.95 MB" and "609 KB" have to be comparable to rank the classes by size. The
   benchmark doc is decimal: 6,469,047 bytes is printed as 6.47 MB. */
const bytes = (s) => {
	const [, n, unit] = s.match(/([\d.]+)\s*(KB|MB|GB|B)/i);
	return parseFloat(n) * { b: 1, kb: 1e3, mb: 1e6, gb: 1e9 }[unit.toLowerCase()];
};

const bySavings = [...stats.rows].sort((a, b) => b.pct - a.pct);
const biggest = [...stats.rows].sort((a, b) => bytes(b.input) - bytes(a.input))[0];
const weakest = bySavings[bySavings.length - 1];

/* The card's closing line claims the largest class by bytes is also the one that
   saves least. That has been true of every corpus so far and it is the whole
   argument for where the headroom is, but it is a claim about data that moves.
   Fail here rather than publish it once it stops holding. */
if (biggest.command !== weakest.command) {
	throw new Error(
		`perf-card's closing line assumes the largest class saves least. ` +
			`Largest is ${biggest.command}, weakest is ${weakest.command}. Rewrite it.`,
	);
}

const rows = bySavings
	.map(
		(r) => `    <tr>
      <td><span class="cls">${r.command}</span><br><span class="sub">${r.calls} calls &middot; ${r.input}</span></td>
      <td class="sub">${r.filters}</td>
      <td class="bar-cell"><span class="bar"><i style="width:${r.pct}%"></i></span></td>
      <td class="pct">${r.savings}</td>
    </tr>`,
	)
	.join('\n');

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
	{
		template: 'perf-card.html',
		out: 'public/media/performance.png',
		size: '1024,1024',
		scale: 2,
		values: {
			OVERALL: stats.overallSaved,
			CALLS: stats.totalCalls,
			BYTES_IN: stats.bytesIn,
			BYTES_OUT: stats.bytesOut,
			WORST_CLASS: weakest.command,
			ROWS: rows,
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

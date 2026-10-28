/** Pure helpers for src/lib/demo.js, split out so node --test can load them without Vite. */

/* A terminal block that grows with its fixture would push the page around on
   every reel, and a 378 line test run would fill the screen. Long output keeps
   its head and its tail, the parts a reader checks, and says how much the page
   left out. The elision is the page's, never OMNI's, and is styled apart. */
export const HEAD = 6;
export const TAIL = 3;

export function shorten(text) {
	const lines = text.replace(/\n$/, '').split('\n').map((t) => ({ t }));
	if (lines.length <= HEAD + TAIL + 1) return lines;
	const skipped = lines.length - HEAD - TAIL;
	return [
		...lines.slice(0, HEAD),
		{ t: `[ ${skipped} lines shortened for this page ]`, skip: true },
		...lines.slice(-TAIL),
	];
}

export const bytes = (n) => `${n.toLocaleString('en-US')} B`;

/**
 * The hero's reels, read from src/demo/ (written by scripts/make-demo.sh).
 *
 * Byte counts are measured from the files themselves rather than quoted from the
 * manual's fixture table, which lagged the binary: it says 165 B for `git status`
 * where 0.7.13 delivers 187 B. The demo shows what the build ran, so it states
 * what the build measured.
 */
import { shorten, bytes } from './demo-format.js';

const files = import.meta.glob('../demo/*', { query: '?raw', import: 'default', eager: true });
const read = (name) => files[`../demo/${name}`];

/* Captions are the only prose a reel gets. Keyed by reel name so a new fixture
   without one still renders, with the measurement alone. */
const CAPS = {
	'cargo-build': 'a successful build is a hundred lines of Compiling. The agent gets one line and a handle for the rest.',
	'git-status': 'what changed stays, the hints git prints on every run go.',
	'cargo-test': 'ten tests failed and the command exited 101, so nothing was touched. A failure is the output the agent most needs.',
};

export function loadReels() {
	const [head, ...lines] = read('reels.tsv').trim().split('\n');
	const version = head.match(/omni (\S+)$/)?.[1] ?? '';
	const reels = lines.map((line, i, all) => {
		const [name, exit, command] = line.split('\t');
		const raw = read(`${name}.raw.txt`);
		const out = read(`${name}.out.txt`);
		const passed = raw === out;
		const inB = Buffer.byteLength(raw);
		const outB = Buffer.byteLength(out);
		const pct = ((1 - outB / inB) * 100).toFixed(1);
		return {
			name,
			command,
			exit: Number(exit),
			label: `${i + 1} of ${all.length} · ${command}`,
			passed,
			inBytes: bytes(inB),
			outBytes: bytes(outB),
			verdict: passed ? 'passed through whole, 0 B removed' : `${pct}% smaller, every cut line archived`,
			cap: `${bytes(inB)} becomes ${bytes(outB)}: ${CAPS[name] ?? ''}`.trim(),
			rawText: raw.replace(/\n$/, ''),
			outText: out.replace(/\n$/, ''),
			rawLines: [{ t: command, prompt: true }, ...shorten(raw)],
			outLines: passed ? [] : shorten(out),
		};
	});
	return { version, reels };
}

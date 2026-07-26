/**
 * The releases page, read from the OMNI CHANGELOG on `main` at build time.
 *
 * Same rule as src/lib/readme-stats.js: one source, fetched at build, so the
 * site cannot claim a release the repository does not have. A hand-kept copy
 * of the changelog would be a second source, and second sources drift.
 *
 * Each changelog entry opens with a bold one-line lead before the long
 * explanation. That lead is the summary, already written, so this file takes it
 * and leaves the essay behind on GitHub.
 */

const CHANGELOG_URL = 'https://raw.githubusercontent.com/fajarhide/omni/main/CHANGELOG.md';

/** Bullets shown per release before the page defers to the full notes. */
export const BULLET_CAP = 5;

/** Last-known-good, verified against CHANGELOG@main on 2026-07-26. */
export const FALLBACK = {
	source: 'fallback',
	releases: [
		{
			version: '0.6.6',
			date: '2026-07-26',
			bullets: [
				{ label: 'fixed', text: 'Verbose `git log` dropped most of the commits it was given' },
				{ label: 'fixed', text: 'Enumeration commands lost the items that were the answer; now they pass through verbatim' },
				{ label: 'fixed', text: 'TOML filter `priority` was parsed and never read, so which filter won was accidental' },
				{ label: 'fixed', text: '`TestDistiller` fabricated `Tests: 0 passed, 0 failed` for output that was never a test run' },
				{ label: 'fixed', text: '`python3 -c "..."` and `ruby -c ...` had their real output replaced with a fabricated `Build: ok`' },
			],
			total: 7,
		},
		{
			version: '0.6.5',
			date: '2026-07-24',
			bullets: [
				{ label: 'fixed', text: 'The distilled output still never reached the agent on Claude Code' },
			],
			total: 1,
		},
		{
			version: '0.6.4',
			date: '2026-07-23',
			bullets: [
				{ label: 'new', text: '`omni doctor` now says when the binary carries changes no release contains' },
				{ label: 'new', text: '`omni stats --rerun` measures whether a distillation cost the agent a second run' },
				{ label: 'new', text: '`omni stats` gained short scope flags and an hour window' },
				{ label: 'changed', text: '`omni --help` is one grouped list written around what a user wants' },
				{ label: 'removed', text: 'Three CLI subcommands nobody has ever invoked' },
			],
			total: 17,
		},
	],
};

/** Changelog section headings, in the shorter words the page uses. */
const LABELS = {
	added: 'new',
	fixed: 'fixed',
	changed: 'changed',
	removed: 'removed',
	improved: 'better',
	performance: 'faster',
	security: 'security',
	deprecated: 'deprecated',
};

const VERSION = /^##\s*\[(\d+\.\d+\.\d+[^\]]*)\]\s*-\s*(\d{4}-\d{2}-\d{2})/;
const SECTION = /^###\s+(.+?)\s*$/;
const BOLD_ENTRY = /^-\s+\*\*(.+?)\*\*/;
const PLAIN_ENTRY = /^-\s+(\S.*)$/;

/**
 * Trailing issue references. They belong in the repository, not in a summary
 * line someone is skimming, and every release here links to its own notes.
 */
const stripRefs = (s) => s.replace(/\s*\((?:#\d+|see [^)]+)[^)]*\)\s*$/, '').trim();

/**
 * A few leads carry a second clause behind a dash. The clause is detail, the
 * page wants the headline, and this site does not print em dashes anyway.
 */
const firstClause = (s) => s.split(/\s+[–—]\s+/)[0].trim();

/**
 * Releases up to 0.5.3 predate the bold-lead convention and are written as
 * `- Label: what it does`. The label is the summary, so take it. Without this
 * the page would quietly skip eight shipped versions.
 */
function plainLead(text) {
	const labelled = text.match(/^(.{3,90}?):\s+\S/);
	if (labelled) return labelled[1];
	const stop = text.indexOf('. ');
	const sentence = stop > 0 ? text.slice(0, stop + 1) : text;
	return sentence.length > 150 ? `${sentence.slice(0, 147).trimEnd()}...` : sentence;
}

/**
 * Returns the release list, or null when the changelog no longer looks like we
 * expect. Null is deliberate: a half-parsed release history is worse than a
 * stale one, so the caller falls back rather than publish a guess.
 */
export function parseChangelog(md) {
	const releases = [];
	let current = null;
	let label = null;

	for (const line of md.split('\n')) {
		const version = line.match(VERSION);
		if (version) {
			// Release candidates are project history, not shipped versions. The
			// journal already keeps them out of its index for the same reason.
			current = /-rc|-alpha|-beta/.test(version[1])
				? null
				: { version: version[1], date: version[2], bullets: [] };
			if (current) releases.push(current);
			label = null;
			continue;
		}
		if (!current) continue;

		const section = line.match(SECTION);
		if (section) {
			// 0.5.0 writes `### Changed — BREAKING`. The qualifier belongs in the
			// entries, not in a label that has to fit one column.
			const name = firstClause(section[1]).toLowerCase();
			label = LABELS[name] ?? name;
			continue;
		}

		const bold = line.match(BOLD_ENTRY);
		const plain = bold ? null : line.match(PLAIN_ENTRY);
		const text = bold ? bold[1] : plain && plainLead(plain[1]);
		if (text) current.bullets.push({ label, text: firstClause(stripRefs(text)) });
	}

	// A release whose changelog section is empty (0.1.1 and 0.1.2 both are) is
	// still listed. Dropping a version because nobody wrote it up would hide a
	// shipped release, which is the opposite of what this page is for.
	if (releases.length < 5) return null;

	return {
		source: 'CHANGELOG@main',
		releases: releases.map((r) => ({ ...r, total: r.bullets.length })),
	};
}

/** Build-time entry point. Never throws; the build must not die over a page. */
export async function getReleases() {
	try {
		const res = await fetch(CHANGELOG_URL);
		if (!res.ok) throw new Error(`HTTP ${res.status}`);
		const parsed = parseChangelog(await res.text());
		if (!parsed) throw new Error('CHANGELOG parsed but failed validation, shape changed?');
		console.log(`[releases] ${parsed.releases.length} releases from CHANGELOG@main`);
		return parsed;
	} catch (e) {
		console.warn(`[releases] using committed fallback: ${e.message}`);
		return FALLBACK;
	}
}

/**
 * The journal post for a release, when one was written. Anchored so `0.6.1`
 * cannot claim the `v0-6-10` post, and RC notes are excluded by the caller.
 */
export function postFor(version, posts) {
	const slug = new RegExp(`v${version.replace(/\./g, '-')}(?:-|$)`);
	return posts.find((p) => slug.test(p.id));
}

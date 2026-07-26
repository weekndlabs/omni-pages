import test from 'node:test';
import assert from 'node:assert/strict';
import { parseChangelog, postFor, FALLBACK, BULLET_CAP } from './changelog.js';

// Trimmed to the shapes the parser has to survive: an Unreleased heading with
// no date, a release candidate, inline code and issue refs in a lead, and a
// long body paragraph that must not become a bullet of its own.
const CHANGELOG = `# Changelog

## [Unreleased]

## [0.6.6] - 2026-07-26

### Fixed
- **Verbose \`git log\` dropped most of the commits it was given (#199)**: the cause
  was the #110 shadow trap, and this paragraph runs on for a very long time.
- **Enumeration commands lost the items that were the answer (#198, #200)**: more prose.

## [0.6.5] - 2026-07-24

### Fixed
- **The distilled output never reached the agent — #158 fixed the key and left the shape wrong (#187)**: prose.

## [0.6.4] - 2026-07-23

### Added
- **\`omni doctor\` now reports unreleased changes (#137)**: prose.

### Removed
- **Three CLI subcommands nobody has ever invoked (#164)**: prose.

## [0.6.3] - 2026-07-21

### Changed
- **Something changed**: prose.

## [0.6.2-rc1] - 2026-07-16

### Fixed
- **A release candidate that must not appear (#1)**: prose.

## [0.6.2] - 2026-07-17

### Improved
- **Format-safe compression**: prose.

## [0.1.2] - 2026-03-15

## [0.1.1] - 2026-03-15

### Added
- \`omni update\` command: Easily upgrade OMNI to the latest version via Homebrew.
- Initial Zig core engine implementation.
`;

test('parses each release with its date and section labels', () => {
	const { releases, source } = parseChangelog(CHANGELOG);
	assert.equal(source, 'CHANGELOG@main');
	assert.deepEqual(
		releases.map((r) => r.version),
		['0.6.6', '0.6.5', '0.6.4', '0.6.3', '0.6.2', '0.1.2', '0.1.1']
	);
	assert.equal(releases[0].date, '2026-07-26');
	assert.deepEqual(
		releases[2].bullets.map((b) => b.label),
		['new', 'removed']
	);
	assert.equal(releases[4].bullets[0].label, 'better');
});

test('takes the bold lead, not the body paragraph, and drops issue refs', () => {
	const { releases } = parseChangelog(CHANGELOG);
	assert.equal(releases[0].bullets.length, 2);
	assert.equal(
		releases[0].bullets[0].text,
		'Verbose `git log` dropped most of the commits it was given'
	);
	assert.equal(
		releases[0].bullets[1].text,
		'Enumeration commands lost the items that were the answer'
	);
	// A trailing clause behind a dash is detail, and this site prints no dashes.
	assert.equal(
		releases[1].bullets[0].text,
		'The distilled output never reached the agent'
	);
});

test('skips Unreleased and release candidates', () => {
	const versions = parseChangelog(CHANGELOG).releases.map((r) => r.version);
	assert.ok(!versions.some((v) => v.includes('rc')));
	assert.ok(!versions.includes('Unreleased'));
});

test('keeps pre-0.5.3 plain bullets, and versions written up nowhere', () => {
	const byVersion = Object.fromEntries(
		parseChangelog(CHANGELOG).releases.map((r) => [r.version, r])
	);
	// `- Label: description` predates the bold-lead convention. Take the label.
	assert.deepEqual(
		byVersion['0.1.1'].bullets.map((b) => b.text),
		['`omni update` command', 'Initial Zig core engine implementation.']
	);
	// An empty section still ships a version, so the page still lists it.
	assert.equal(byVersion['0.1.2'].bullets.length, 0);
	assert.equal(byVersion['0.1.2'].total, 0);
});

test('returns null rather than a half-parsed history', () => {
	assert.equal(parseChangelog('# Changelog\n\nNothing here.'), null);
	// Four releases is below the floor, so the caller falls back instead.
	assert.equal(
		parseChangelog(CHANGELOG.split('## [0.6.3]')[0]),
		null
	);
});

test('the committed fallback is a usable page, not a placeholder', () => {
	assert.ok(FALLBACK.releases.length >= 3);
	for (const r of FALLBACK.releases) {
		assert.match(r.version, /^\d+\.\d+\.\d+$/);
		assert.match(r.date, /^\d{4}-\d{2}-\d{2}$/);
		assert.ok(r.bullets.length > 0 && r.bullets.length <= BULLET_CAP);
		// `total` drives the "N more" line, so it can never understate the list.
		assert.ok(r.total >= r.bullets.length);
	}
});

test('a version matches its own post, not a longer one that starts the same', () => {
	const posts = [
		{ id: 'omni-update-v0-6-1-pain-first-positioning' },
		{ id: 'omni-update-v0-6-10-imaginary' },
		{ id: 'omni-v0-5-0-pure-rust-rewrite' },
	];
	assert.equal(postFor('0.6.1', posts).id, 'omni-update-v0-6-1-pain-first-positioning');
	assert.equal(postFor('0.5.0', posts).id, 'omni-v0-5-0-pure-rust-rewrite');
	assert.equal(postFor('0.4.9', posts), undefined);
});

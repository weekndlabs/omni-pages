import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { versionOf, eraOf, glanceFor, newestFirst, coverTitle } from './cover.js';

test('versionOf reads a release and keeps the rc suffix', () => {
	assert.equal(versionOf('Contexere v0.8.1: The New Name'), 'v0.8.1');
	assert.equal(versionOf('OMNI v0.5.7-rc1: Automated Tool'), 'v0.5.7-rc1');
});

test('versionOf returns null for a post that is not a release', () => {
	assert.equal(versionOf('Why your AI agent is expensive'), null);
	assert.equal(versionOf('The 6-stage pipeline'), null);
});

test('eraOf starts Contexere on the 0.8.0 date, in UTC', () => {
	assert.equal(eraOf(new Date('2026-10-29')), 'contexere');
	assert.equal(eraOf(new Date('2026-10-28T23:59:59Z')), 'omni');
});

test('glanceFor takes the first list before the first heading only', () => {
	assert.deepEqual(glanceFor('Intro.\n\n- one\n- two\n\n## Next\n- three', 'D'),
		{ description: 'D', bullets: ['one', 'two'] });
	assert.deepEqual(glanceFor('Intro only.\n\n## H\n- x', 'D').bullets, []);
});

test('every post on disk has a description for its box', () => {
	const dir = './src/content/blog';
	for (const f of readdirSync(dir).filter((n) => n.endsWith('.md'))) {
		const src = readFileSync(`${dir}/${f}`, 'utf8');
		const desc = (src.match(/^description:\s*"?(.*?)"?\s*$/m) || [])[1] || '';
		const body = src.replace(/^---[\s\S]*?\n---\n/, '');
		assert.ok(glanceFor(body, desc).description.length > 0, f);
	}
});

test('newestFirst breaks a same-day tie by version, numerically', () => {
	const d = new Date('2026-10-29');
	const post = (title, id) => ({ id, data: { title, date: d } });
	const a = post('Contexere v0.8.9: A', 'contexere-v0-8-9-a');
	const b = post('Contexere v0.8.10: B', 'contexere-v0-8-10-b');
	assert.deepEqual([a, b].sort(newestFirst).map((p) => p.id), ['contexere-v0-8-10-b', 'contexere-v0-8-9-a']);
	const older = { id: 'x', data: { title: 'Contexere v0.9.0: C', date: new Date('2026-10-01') } };
	assert.equal([older, a].sort(newestFirst)[0], a, 'date still wins over version');
});

test('coverTitle drops the version and the brand next to it, wherever they sit', () => {
	assert.equal(coverTitle('Contexere v0.8.1: The New Name, Everywhere You Look'), 'The New Name, Everywhere You Look');
	assert.equal(coverTitle('Automated Tool Distillation: OMNI v0.5.7-rc1'), 'Automated Tool Distillation');
	assert.equal(coverTitle('Six views and a synonym: v0.7.8'), 'Six views and a synonym');
	assert.equal(coverTitle('Why Your AI Agent Is Expensive'), 'Why Your AI Agent Is Expensive');
});

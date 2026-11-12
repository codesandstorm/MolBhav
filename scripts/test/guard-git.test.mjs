// Tests for scripts/guard-git.mjs: each rule triggers, and legitimate input passes.
// Run: node --test scripts/test/guard-git.test.mjs (part of npm test)
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  MAX_BYTES,
  contentProblem,
  identProblems,
  messageProblems,
  pathProblem,
  pushProblems,
  sizeProblem,
} from '../guard-git.mjs';

const GUARD = join(import.meta.dirname, '..', 'guard-git.mjs');
const localFile = Buffer.from('Q0xBVURFLm1k', 'base64').toString();
const localDir = Buffer.from('LmNsYXVkZQ==', 'base64').toString();

describe('paths (rule 3)', () => {
  const forbidden = [
    'ml/gold/data/messages.jsonl',
    'ml/gold/data/labels/labeller-a.jsonl',
    'ml/gold/data/skipped.json',
    'data/raw/rates.csv',
    'data/raw/README.md',
    'data/rates.csv',
    'data/rates.tsv',
    'data/sample.json',
    'data/sample.jsonl',
    'data/notes.txt',
    'node_modules/x/index.js',
    'apps/app/node_modules/y.js',
    'apps/app/dist/index.html',
    'apps/site/.astro/types.d.ts',
    'apps/site/.budget/run-1.json',
    'apps/app/playwright-report/index.html',
    'apps/app/test-results/a/trace.zip',
    'docs/product/reference/concept_hero.png',
    // the owner's local-only file and folder; their names stay out of the repo, so decode them
    localFile,
    `apps/app/${localFile}`,
    `${localDir}/settings.json`,
    `${localDir}/launch.json`,
    `apps/site/${localDir}/x.json`,
    '.env',
    '.env.local',
    'apps/app/.env.production',
    'deploy/server.pem',
    'id_rsa',
    'id_ed25519.pub',
    'credentials.json',
    'secrets.yaml',
    '.npmrc',
    'ml\\gold\\data\\messages.jsonl',
  ];
  for (const p of forbidden) it(`blocks ${p}`, () => assert.ok(pathProblem(p), p));

  const allowed = [
    'ml/gold/data/README.md',
    'ml/gold/GUIDELINES.md',
    'ml/gold/cards/cards.jsonl',
    'data/README.md',
    'data/checksums.txt',
    'packages/tokens/src/index.ts',
    'packages/tokens/test/tokens.test.ts',
    'apps/site/src/lib/product-shot.json',
    'apps/app/public/_headers',
    'docs/product/15_design_language.md',
    'docs/product/screens/app-ladder-360.jpg',
    'scripts/guard-git.mjs',
    'apps/site/src/lib/distance.ts',
    'packages/gold/src/keys.ts',
  ];
  for (const p of allowed) it(`allows ${p}`, () => assert.equal(pathProblem(p), null, p));
});

describe('size (rule 3)', () => {
  it('blocks a file over 5 MB', () => assert.ok(sizeProblem(MAX_BYTES + 1)));
  it('allows a file of exactly 5 MB', () => assert.equal(sizeProblem(MAX_BYTES), null));
  it('allows a small file', () => assert.equal(sizeProblem(42_228), null));
});

describe('secrets in content', () => {
  // built at run time so this file never contains a token-shaped string itself
  const fake = {
    github: 'gh' + 'p_' + 'A1b2C3d4'.repeat(5),
    pat: 'github' + '_pat_' + 'x'.repeat(60),
    key: 'sk' + '-' + 'q'.repeat(40),
    aws: 'AK' + 'IA' + 'ABCDEFGHIJKLMNOP',
    pem: '-----BEGIN ' + 'RSA PRIVATE KEY-----\nabc\n',
  };
  for (const [k, v] of Object.entries(fake)) {
    it(`blocks a ${k} token`, () => assert.ok(contentProblem(Buffer.from(`const t = "${v}";`))));
  }
  it('allows ordinary source and design tokens', () => {
    const src =
      "export const tokens = { accent: '#F7D2B0' }; // sk-ladder notes, AKIA is not a word";
    assert.equal(contentProblem(Buffer.from(src)), null);
  });
  it('skips binary content', () =>
    assert.equal(contentProblem(Buffer.from([0, 1, 2, 0x67, 0x68])), null));
});

describe('commit messages', () => {
  const bad = {
    'Co-authored-by trailer': 'Add ladder\n\nCo-authored-by: Someone <someone@example.com>\n',
    'lower-case trailer': 'Add ladder\n\nco-authored-by: Someone <someone@example.com>',
    'indented trailer': 'Add ladder\n\n  Co-Authored-By: Someone <s@example.com>',
    'Generated with footer': 'Add ladder\n\nGenerated with SomeTool\n',
    'Generated with after an emoji':
      'Add ladder\n\n\u{1F916} Generated with [SomeTool](https://example.com)\n',
  };
  for (const [k, m] of Object.entries(bad))
    it(`blocks: ${k}`, () => assert.ok(messageProblems(m).length));

  const good = [
    'Add gold-set tools, amount parser, rule baseline and reader screen',
    'Fix axe contrast race: animate rungs without fading\n\nThe Target rung faded in over 200 ms.',
    'Phase b1b fixes',
    'Regenerate cards\n\nCards generated with seed 42; authored by the owner.',
    'Document co-authoring of the guidelines (no trailer)',
  ];
  for (const m of good)
    it(`allows: ${m.split('\n')[0]}`, () => assert.deepEqual(messageProblems(m), []));

  it('local mode ignores git comment lines', () => {
    const m = 'Add guard\n# Generated with SomeTool (a git template comment)\n';
    assert.deepEqual(messageProblems(m, { local: true }), []);
    assert.ok(messageProblems(m).length, 'CI mode keeps every line');
  });
  it('blocks names from the local list, as whole words, case-insensitive', () => {
    const names = ['examplebot', 'helper ai'];
    assert.ok(messageProblems('Add parser with ExampleBot', { names }).length);
    assert.ok(messageProblems('Notes from Helper AI', { names }).length);
    assert.deepEqual(messageProblems('Add examplebots-free parser', { names }), []);
    assert.deepEqual(messageProblems('Add parser', { names }), []);
  });
  it('CI checks no names: the list exists only locally', () =>
    assert.deepEqual(messageProblems('Add parser with ExampleBot'), []));
});

describe('identities and pushes', () => {
  it('blocks a listed name in an identity', () =>
    assert.ok(identProblems('ExampleBot <bot@example.com> 1 +0000', ['examplebot']).length));
  it('allows the owner identity', () =>
    assert.deepEqual(
      identProblems('codesandstorm <owner@example.com> 1 +0000', ['examplebot']),
      [],
    ));
  const z = '0'.repeat(40);
  const a = 'a'.repeat(40);
  it('blocks a push to main', () =>
    assert.ok(pushProblems(`refs/heads/main ${a} refs/heads/main ${z}\n`).length));
  it('blocks pushing another branch onto main', () =>
    assert.ok(pushProblems(`refs/heads/phase-x ${a} refs/heads/main ${z}\n`).length));
  it('allows a phase branch', () =>
    assert.deepEqual(
      pushProblems(`refs/heads/phase-git-guard ${a} refs/heads/phase-git-guard ${z}\n`),
      [],
    ));
  it('allows an empty push', () => assert.deepEqual(pushProblems(''), []));
});

describe('ci mode on a real repository', () => {
  const repo = mkdtempSync(join(tmpdir(), 'guard-'));
  const env = {
    ...process.env,
    GIT_AUTHOR_NAME: 'Owner',
    GIT_AUTHOR_EMAIL: 'owner@example.com',
    GIT_COMMITTER_NAME: 'Owner',
    GIT_COMMITTER_EMAIL: 'owner@example.com',
  };
  const git = (...args) =>
    execFileSync('git', ['-c', 'core.autocrlf=false', '-c', 'commit.gpgsign=false', ...args], {
      cwd: repo,
      env,
    })
      .toString()
      .trim();
  const write = (p, s) => {
    mkdirSync(dirname(join(repo, p)), { recursive: true });
    writeFileSync(join(repo, p), s);
  };
  const guard = (range) =>
    spawnSync(process.execPath, [GUARD, 'ci', '--range', range], { cwd: repo, encoding: 'utf8' });

  git('init', '-q', '-b', 'main');
  write('README.md', 'hello\n');
  write('ml/gold/data/README.md', 'private data stays local\n');
  git('add', '.');
  git('commit', '-q', '--no-verify', '-m', 'Add readme');
  const base = git('rev-parse', 'HEAD');

  it('passes a clean range', () => {
    write('src/a.ts', 'export const a = 1;\n');
    git('add', 'src/a.ts');
    git('commit', '-q', '--no-verify', '-m', 'Add a');
    const r = guard(`${base}..HEAD`);
    assert.equal(r.status, 0, r.stderr);
  });
  it('fails on a trailer in the range', () => {
    git(
      'commit',
      '-q',
      '--no-verify',
      '--allow-empty',
      '-m',
      'Add b',
      '-m',
      'Co-authored-by: Someone <s@example.com>',
    );
    const r = guard(`${base}..HEAD`);
    assert.equal(r.status, 1);
    assert.match(r.stderr, /Co-authored-by/);
    git('reset', '-q', '--hard', 'HEAD~1');
  });
  it('fails on a tracked private file', () => {
    write('ml/gold/data/messages.jsonl', '{}\n');
    git('add', '-f', 'ml/gold/data/messages.jsonl');
    git('commit', '-q', '--no-verify', '-m', 'Add c');
    const r = guard(`${base}..HEAD`);
    assert.equal(r.status, 1);
    assert.match(r.stderr, /ml\/gold\/data\/messages\.jsonl/);
    git('reset', '-q', '--hard', 'HEAD~1');
  });
  it('fails on a tracked file over 5 MB', () => {
    write('big.bin', Buffer.alloc(MAX_BYTES + 1, 1));
    git('add', 'big.bin');
    git('commit', '-q', '--no-verify', '-m', 'Add d');
    const r = guard(`${base}..HEAD`);
    assert.equal(r.status, 1);
    assert.match(r.stderr, /big\.bin: file is 5\.0 MB/);
    git('reset', '-q', '--hard', 'HEAD~1');
  });
  it('a zero base (a new branch push) checks the head commit only', () => {
    const r = guard(`${'0'.repeat(40)}..HEAD`);
    assert.equal(r.status, 0, r.stderr);
  });
  it('cleans up', () => rmSync(repo, { recursive: true, force: true }));
});

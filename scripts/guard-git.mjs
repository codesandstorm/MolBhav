#!/usr/bin/env node
/**
 * Repository guard. No dependencies; Node 20+.
 *
 * Blocks, in commits and in CI:
 *   - private or generated paths (ml/gold/data/ except its README, raw datasets, build and test
 *     output, docs/product/reference/, local assistant files, .env*, keys and credentials);
 *   - files over 5 MB;
 *   - token-like secrets inside files;
 *   - Co-authored-by trailers and "Generated with" lines in commit messages.
 *
 * Modes:
 *   node scripts/guard-git.mjs ci --range <base>..<head>   CI: commits in the range, every tracked file
 *   node scripts/guard-git.mjs pre-commit [--names <file>]  hook: staged files, branch, author/committer
 *   node scripts/guard-git.mjs commit-msg <file> [--names <file>]
 *   node scripts/guard-git.mjs pre-push <remote> <url> [--names <file>]  (ref lines on stdin)
 *
 * --names points at a local, untracked list of names (one per line) that the local hooks also
 * reject in messages and identities. The list never lives in the repository or in CI.
 * Install the hooks with: node scripts/install-hooks.mjs
 */
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

export const MAX_BYTES = 5 * 1024 * 1024;

const OUTPUT_DIRS = [
  'node_modules',
  'dist',
  '.astro',
  '.budget',
  'playwright-report',
  'test-results',
];

// The owner's local-only instruction file and settings folder (kept in .git/info/exclude). Their
// names are deliberately kept out of the repository, so they are matched by the sha256 of the
// lower-cased name: one file name, one folder name.
const LOCAL_ONLY_FILES = new Set([
  'bccc86317c281a19e56f3f941077ea61b3fb37d5bd527c518b92b188c4461251',
]);
const LOCAL_ONLY_DIRS = new Set([
  'e026f56c08dcdea441a2aa620ab410ce91162062609b2430f5a13bc9b7cf93f1',
]);
const isLocalOnly = (name, set) =>
  set.has(createHash('sha256').update(name.toLowerCase()).digest('hex'));

/** Why a repository path must never be committed, or null when it may be. */
export const pathProblem = (input) => {
  const path = input.replace(/\\/g, '/').replace(/^\.\//, '');
  const parts = path.split('/');
  const base = parts.at(-1) ?? '';
  const dirs = parts.slice(0, -1);
  if (path.startsWith('ml/gold/data/') && path !== 'ml/gold/data/README.md') {
    return 'private gold-set data (only ml/gold/data/README.md may be committed)';
  }
  if (/(^|\/)data\/raw(\/|$)/.test(path)) return 'raw dataset (data/raw)';
  if (
    dirs.includes('data') &&
    /\.(csv|tsv|json|jsonl|txt)$/i.test(base) &&
    base !== 'checksums.txt'
  ) {
    return 'dataset file under data/ (only checksums.txt may be committed)';
  }
  const out = OUTPUT_DIRS.find((d) => dirs.includes(d));
  if (out) return `build or test output (${out}/)`;
  if (path.startsWith('docs/product/reference/'))
    return 'private reference material (docs/product/reference/)';
  if (isLocalOnly(base, LOCAL_ONLY_FILES) || parts.some((p) => isLocalOnly(p, LOCAL_ONLY_DIRS))) {
    return 'local-only file (listed in .git/info/exclude; never committed)';
  }
  if (/^\.env/i.test(base)) return 'environment file (.env*)';
  if (
    /\.(pem|key|p12|pfx|jks|keystore|ppk)$/i.test(base) ||
    /^id_(rsa|dsa|ecdsa|ed25519)(\.pub)?$/.test(base) ||
    /^(credentials?|secrets?)(\.[\w.]+)?$/i.test(base) ||
    /^\.(npmrc|netrc|pypirc)$/.test(base)
  ) {
    return 'key or credential file';
  }
  return null;
};

export const sizeProblem = (bytes) =>
  bytes > MAX_BYTES ? `file is ${(bytes / 1024 / 1024).toFixed(1)} MB (limit 5 MB)` : null;

const TOKEN_PATTERNS = [
  [/\bgh[pousr]_[A-Za-z0-9]{36,}/, 'GitHub token'],
  [/\bgithub_pat_[A-Za-z0-9_]{40,}/, 'GitHub token'],
  [/\bsk-[A-Za-z0-9_-]{32,}/, 'API secret key'],
  [/\bAKIA[0-9A-Z]{16}\b/, 'AWS access key'],
  [/\bxox[abprs]-[A-Za-z0-9-]{10,}/, 'Slack token'],
  [/-----BEGIN (?:[A-Z]+ )?PRIVATE KEY-----/, 'private key'],
];

/** A token-like secret inside file content, or null. Binary content is skipped. */
export const contentProblem = (buf) => {
  if (buf.length > MAX_BYTES || buf.includes(0)) return null;
  const text = buf.toString('utf8');
  const hit = TOKEN_PATTERNS.find(([re]) => re.test(text));
  return hit ? `contains what looks like a ${hit[1]}` : null;
};

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const mentions = (text, name) =>
  new RegExp(`(^|[^a-z0-9])${escapeRe(name)}([^a-z0-9]|$)`, 'i').test(text);

/** Problems with a commit message. `local` drops git's '#' comment lines first. */
export const messageProblems = (message, { names = [], local = false } = {}) => {
  const lines = message.split(/\r?\n/);
  const text = (local ? lines.filter((l) => !l.startsWith('#')) : lines).join('\n');
  const out = [];
  if (/^[ \t]*co-authored-by[ \t]*:/im.test(text)) out.push('has a Co-authored-by trailer');
  // a line that starts (after any symbols) with "Generated with": the tooling footer, not prose
  if (/^[^A-Za-z0-9\n]*generated with\b/im.test(text)) out.push('has a "Generated with" line');
  for (const n of names)
    if (mentions(text, n)) out.push(`mentions "${n}" (local blocked-name list)`);
  return out;
};

/** Problems with an author or committer identity ("Name <email> time tz"). */
export const identProblems = (ident, names = []) =>
  names
    .filter((n) => mentions(ident, n))
    .map((n) => `identity mentions "${n}" (local blocked-name list)`);

const ZERO = /^0+$/;

/** Problems with the ref lines git gives a pre-push hook: "<lref> <lsha> <rref> <rsha>". */
export const pushProblems = (stdin) =>
  stdin
    .split(/\r?\n/)
    .filter(Boolean)
    .flatMap((line) => {
      const remoteRef = line.split(' ')[2] ?? '';
      return remoteRef === 'refs/heads/main'
        ? ['pushing to main is not allowed: push a phase-* branch and open a PR']
        : [];
    });

/** Names from a local list file: one per line, '#' comments and blank lines ignored. */
export const readNames = (file) =>
  file && existsSync(file)
    ? readFileSync(file, 'utf8')
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter((l) => l && !l.startsWith('#'))
    : [];

// ---------------------------------------------------------------- command line

const git = (args, opts = {}) =>
  execFileSync('git', args, { maxBuffer: 256 * 1024 * 1024, ...opts });
const gitText = (args) => git(args).toString('utf8');
const nulList = (s) => s.split('\0').filter(Boolean);

const commitMessages = (range) => {
  const [base, head] = range.split('..');
  const args = !base || ZERO.test(base) ? ['-1', head || 'HEAD'] : [range];
  return gitText(['log', '--format=%h%x00%B%x1e', ...args])
    .split('\x1e')
    .map((r) => r.replace(/^\s+/, ''))
    .filter(Boolean)
    .map((r) => {
      const [sha, body = ''] = r.split('\0');
      return { sha, body };
    });
};

const runCi = (range) => {
  const problems = [];
  for (const { sha, body } of commitMessages(range)) {
    for (const p of messageProblems(body)) problems.push(`commit ${sha}: ${p}`);
  }
  for (const path of nulList(gitText(['ls-files', '-z']))) {
    const why = pathProblem(path);
    if (why) problems.push(`${path}: ${why}`);
    if (!existsSync(path)) continue;
    const size = sizeProblem(statSync(path).size);
    if (size) problems.push(`${path}: ${size}`);
    else {
      const secret = contentProblem(readFileSync(path));
      if (secret) problems.push(`${path}: ${secret}`);
    }
  }
  return problems;
};

const runPreCommit = (names) => {
  const problems = [];
  const branch = gitText(['symbolic-ref', '--quiet', '--short', 'HEAD']).trim();
  if (branch === 'main')
    problems.push('committing on main is not allowed: work on a phase-* branch');
  for (const v of ['GIT_AUTHOR_IDENT', 'GIT_COMMITTER_IDENT']) {
    for (const p of identProblems(gitText(['var', v]), names)) problems.push(`${v}: ${p}`);
  }
  const staged = nulList(gitText(['diff', '--cached', '--name-only', '-z', '--diff-filter=ACMR']));
  for (const path of staged) {
    const why = pathProblem(path);
    if (why) problems.push(`${path}: ${why}`);
    const bytes = Number(gitText(['cat-file', '-s', `:${path}`]).trim());
    const size = sizeProblem(bytes);
    if (size) problems.push(`${path}: ${size}`);
    else {
      const secret = contentProblem(git(['cat-file', 'blob', `:${path}`]));
      if (secret) problems.push(`${path}: ${secret}`);
    }
  }
  if (problems.length) problems.push('unstage these (git restore --staged <path>) and try again');
  return problems;
};

const runPrePush = (names) => {
  const stdin = readFileSync(0, 'utf8');
  const problems = pushProblems(stdin);
  for (const line of stdin.split(/\r?\n/).filter(Boolean)) {
    const localSha = line.split(' ')[1] ?? '';
    if (ZERO.test(localSha)) continue; // deleting a remote branch
    const shas = gitText(['rev-list', localSha, '--not', '--remotes'])
      .split(/\r?\n/)
      .filter(Boolean);
    for (const sha of shas) {
      const body = gitText(['log', '-1', '--format=%B', sha]);
      for (const p of messageProblems(body, { names }))
        problems.push(`commit ${sha.slice(0, 7)}: ${p}`);
      for (const ident of [
        gitText(['log', '-1', '--format=%an <%ae>', sha]),
        gitText(['log', '-1', '--format=%cn <%ce>', sha]),
      ]) {
        for (const p of identProblems(ident, names))
          problems.push(`commit ${sha.slice(0, 7)}: ${p}`);
      }
    }
  }
  return problems;
};

const main = (argv) => {
  const [mode, ...rest] = argv;
  const flag = (name) => {
    const i = rest.indexOf(name);
    return i >= 0 ? rest[i + 1] : undefined;
  };
  const names = readNames(flag('--names'));
  let problems;
  if (mode === 'ci') {
    const range = flag('--range');
    if (!range) throw new Error('ci needs --range <base>..<head>');
    problems = runCi(range);
  } else if (mode === 'pre-commit') problems = runPreCommit(names);
  else if (mode === 'commit-msg')
    problems = messageProblems(readFileSync(rest[0], 'utf8'), { names, local: true });
  else if (mode === 'pre-push') problems = runPrePush(names);
  else throw new Error(`unknown mode "${mode}": use ci, pre-commit, commit-msg or pre-push`);
  if (problems.length) {
    for (const p of problems) console.error(`guard: ${p}`);
    return 1;
  }
  if (mode === 'ci') console.log('guard: ok');
  return 0;
};

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  try {
    process.exitCode = main(process.argv.slice(2));
  } catch (e) {
    console.error(`guard: ${e instanceof Error ? e.message : String(e)}`);
    process.exitCode = 2;
  }
}

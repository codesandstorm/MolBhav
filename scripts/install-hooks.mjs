#!/usr/bin/env node
/**
 * Installs the local git hooks that run scripts/guard-git.mjs. Safe to re-run.
 *
 *   node scripts/install-hooks.mjs
 *
 * - pre-commit: refuses commits on main, forbidden or oversized staged files, token-like content,
 *   and author/committer names on the local blocked-name list.
 * - commit-msg: refuses Co-authored-by trailers, "Generated with" lines, and listed names.
 * - pre-push: refuses pushes to main, and pushed commits whose message or identity fails.
 *
 * Hooks live in .git/hooks (not in the repository). The blocked-name list is the local file
 * .git/hooks/guard-local-names.txt, one name per line; this script creates it empty if it is
 * missing and never overwrites it. Keep it out of the repository and out of CI.
 */
import { execFileSync } from 'node:child_process';
import { chmodSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const MARK = '# installed by scripts/install-hooks.mjs';
const top = execFileSync('git', ['rev-parse', '--show-toplevel']).toString().trim();
const hooks = resolve(
  top,
  execFileSync('git', ['rev-parse', '--git-path', 'hooks'], { cwd: top }).toString().trim(),
);
const names = join(hooks, 'guard-local-names.txt');

const hook = (mode, args) =>
  [
    '#!/bin/sh',
    MARK,
    'cd "$(git rev-parse --show-toplevel)" || exit 1',
    `exec node scripts/guard-git.mjs ${mode} ${args}--names "$(git rev-parse --git-path hooks)/guard-local-names.txt"`,
    '',
  ].join('\n');

const wanted = {
  'pre-commit': hook('pre-commit', ''),
  'commit-msg': hook('commit-msg', '"$1" '),
  'pre-push': hook('pre-push', '"$1" "$2" '),
};

let failed = false;
for (const [name, body] of Object.entries(wanted)) {
  const file = join(hooks, name);
  if (existsSync(file) && !readFileSync(file, 'utf8').includes(MARK)) {
    console.error(
      `skipped ${name}: ${file} exists and was not installed by this script; merge it by hand`,
    );
    failed = true;
    continue;
  }
  writeFileSync(file, body);
  chmodSync(file, 0o755);
  console.log(`installed ${name}`);
}
if (!existsSync(names)) {
  writeFileSync(
    names,
    '# local blocked names for the guard hooks: one per line, case-insensitive\n',
  );
  console.log(`created ${names} (empty: add names to it)`);
} else console.log(`kept ${names}`);
process.exitCode = failed ? 1 : 0;

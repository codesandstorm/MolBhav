/**
 * A local stand-in for Cloudflare Pages, for tests only: serves a built folder with the
 * headers from a Cloudflare `_headers` file, read on every request so the file in the repo
 * (public/_headers) is the single source of truth. Not a copy of Cloudflare: it implements the
 * parts of the `_headers` format this repo uses (URL patterns with `*` splats and `:name`
 * placeholders, indented `Name: value` lines, `# comments`, `! Name` to detach) and combines
 * every matching rule in file order, joining repeated header names with ", " as Pages does
 * [UNVERIFIED: checked against the Pages docs from memory, not against a live deploy].
 *
 * Usage: node scripts/pages-serve.ts --dir <built folder> --headers <_headers> --port <n> [--spa]
 * --spa: a path with no file serves index.html with 200 (Pages' default when the project has
 * no 404.html). Without it, a missing file is a 404.
 */
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { extname, join, normalize, resolve } from 'node:path';

const arg = (name: string) => {
  const i = process.argv.indexOf(`--${name}`);
  return i < 0 ? undefined : process.argv[i + 1];
};
const root = resolve(arg('dir') ?? 'dist');
const headersFile = resolve(arg('headers') ?? 'public/_headers');
const port = Number(arg('port') ?? 4180);
const spa = process.argv.includes('--spa');

const TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.json': 'application/json',
  '.webmanifest': 'application/manifest+json',
};

interface Rule {
  pattern: RegExp;
  set: [string, string][];
  detach: string[];
}

/** Parse a Cloudflare Pages `_headers` file. */
export const parseHeaders = (text: string): Rule[] => {
  const rules: Rule[] = [];
  for (const raw of text.split(/\r?\n/)) {
    if (raw.trim() === '' || raw.trim().startsWith('#')) continue;
    if (!/^\s/.test(raw)) {
      const src = raw
        .trim()
        .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
        .replace(/\*/g, '.*')
        .replace(/:[A-Za-z]\w*/g, '[^/]+');
      rules.push({ pattern: new RegExp(`^${src}$`), set: [], detach: [] });
      continue;
    }
    const rule = rules.at(-1);
    if (!rule) throw new Error(`header line before any URL pattern: ${raw}`);
    const line = raw.trim();
    if (line.startsWith('!')) rule.detach.push(line.slice(1).trim().toLowerCase());
    else {
      const i = line.indexOf(':');
      if (i < 1) throw new Error(`not a header line: ${raw}`);
      rule.set.push([line.slice(0, i).trim().toLowerCase(), line.slice(i + 1).trim()]);
    }
  }
  return rules;
};

/** The headers Pages would add for a request path. */
export const headersFor = (rules: Rule[], path: string): Record<string, string> => {
  const out: Record<string, string> = {};
  const matching = rules.filter((r) => r.pattern.test(path));
  for (const r of matching)
    for (const [k, v] of r.set) out[k] = out[k] === undefined ? v : `${out[k]}, ${v}`;
  for (const r of matching) for (const k of r.detach) delete out[k];
  return out;
};

const isMain = process.argv[1] && resolve(process.argv[1]) === resolve(import.meta.filename);
if (isMain) {
  createServer((req, res) => {
    void (async () => {
      const url = new URL(req.url ?? '/', 'http://localhost');
      const rules = parseHeaders(readFileSync(headersFile, 'utf8'));
      let path = normalize(join(root, decodeURIComponent(url.pathname)));
      if (!path.startsWith(root)) {
        res.writeHead(400).end();
        return;
      }
      if ((await stat(path).catch(() => null))?.isDirectory()) path = join(path, 'index.html');
      let status = 200;
      let body = await readFile(path).catch(() => null);
      if (body === null && spa && !extname(url.pathname)) {
        path = join(root, 'index.html');
        body = await readFile(path).catch(() => null);
      }
      if (body === null) {
        status = 404;
        body = Buffer.from('not found');
        path = 'x.txt';
      }
      res.writeHead(status, {
        'content-type': TYPES[extname(path)] ?? 'text/plain; charset=utf-8',
        ...headersFor(rules, url.pathname),
      });
      res.end(body);
    })().catch(() => res.writeHead(500).end());
  }).listen(port, '127.0.0.1', () =>
    console.log(`pages-serve ${root} with ${headersFile} on http://localhost:${port}`),
  );
}

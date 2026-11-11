# 16 · Deploying to Cloudflare Pages

Draft v0.1, 2026-11-11 (B1.1b). Tags: [EVIDENCE: path or command] · [HYPOTHESIS] · [GAP] · [UNVERIFIED]. **Nothing has been deployed.** This page prepares the two Pages projects; the owner does every account step by hand. Dashboard labels and Cloudflare behaviour described here are from Cloudflare's documentation as remembered, not re-checked against a live account [UNVERIFIED: check each label while clicking through; correct this page where it differs].

There is no deploy GitHub Action and there must not be one that needs secrets: Cloudflare builds from the repository itself after you connect it. CI keeps exactly three jobs: lint, typecheck, test [EVIDENCE: .github/workflows].

## 1. Two projects, one repository

| | App | Showcase site |
|---|---|---|
| What | `apps/app`: Vite + React PWA | `apps/site`: static Astro page |
| Project name (suggestion) | `molbhav-app` | `molbhav` |
| Framework preset | None | None (the build command below already runs Astro) |
| Root directory | *(leave empty: the repository root)* | *(leave empty: the repository root)* |
| Build command | `npm run build -w apps/app` | `npm run build -w apps/site` |
| Build output directory | `apps/app/dist` | `apps/site/dist` |
| Node version | from `.nvmrc` (24.13.1); see §3 | same |
| Headers | `apps/app/public/_headers` → copied to `dist/_headers` | `apps/site/public/_headers` → `dist/_headers` |
| Not-found paths | serve the app (SPA fallback, §4) | serve the home page (same default, §4) |
| Environment variables | none except `NODE_VERSION` if needed (§3) | same |

**Why the root directory stays empty.** This is an npm-workspaces monorepo: there is one `package-lock.json`, at the root, and the app and site import `packages/engine`, `packages/analyser` and `packages/tokens` from the workspace [EVIDENCE: package.json "workspaces"]. If the root directory were `apps/app`, Cloudflare would install from `apps/app` alone, without the lockfile or the workspace packages, and the build would fail or install unpinned versions [HYPOTHESIS: not tried]. With the root left empty, Cloudflare runs `npm ci` at the root (it sees `package-lock.json`) and the `-w` build command builds one workspace [UNVERIFIED: that Pages runs `npm ci` rather than `npm install` when a lockfile is present].

**Build watch paths** (optional, Settings → Builds): to stop a site change from rebuilding the app, set include paths per project, e.g. app: `apps/app/*`, `packages/*`, `package-lock.json`; site: `apps/site/*`, `packages/*`, `package-lock.json` [UNVERIFIED: the setting's exact syntax].

## 2. Step by step (dashboard), for each project

1. Cloudflare dashboard → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**.
2. Authorise the Cloudflare Pages GitHub app **for this one repository only** (not "All repositories").
3. Pick the repository → **Begin setup**.
4. **Project name**: as in §1. **Production branch**: `main`.
5. **Build settings**: Framework preset *None*; build command and output directory exactly as in §1; **Root directory (advanced)**: leave empty.
6. **Environment variables**: add none, unless the build log shows a Node version other than 24.13.1 (then §3).
7. **Save and Deploy**. Wait for the first build; open the `*.pages.dev` URL it gives.
8. Check the headers arrived (§5) before telling anyone the URL.
9. Repeat for the second project.

## 3. Node version

The repository pins Node 24.13.1 in `.nvmrc` at the root [EVIDENCE: .nvmrc]; npm 11 comes with it. Cloudflare's current build image reads `.nvmrc` / `.node-version` from the root directory [UNVERIFIED]. Confirm in the first build log ("Installing nodejs 24.13.1" or similar). If it shows another version, add the environment variable `NODE_VERSION` = `24.13.1` for both Production and Preview, then **Retry deployment**. This value is not a secret.

## 4. Headers, CSP and the not-found fallback

Each project's `public/_headers` is the only source of the response headers [EVIDENCE: apps/app/public/_headers; apps/site/public/_headers]:

- **Content-Security-Policy**: `default-src 'self'`, `connect-src 'self'`, `script-src 'self'`, `style-src 'self'`, `img-src 'self' data:`, `font-src 'self'`, `worker-src 'self'`, `object-src 'none'`, `frame-ancestors 'none'`, `base-uri 'self'`, `form-action 'self'` (the app adds `manifest-src 'self'`). **No `'unsafe-inline'` and no `'unsafe-eval'` in either project.**
  - The app needs nothing else: its HTML has no inline script or style, the analyser Worker and the service worker are same-origin files [EVIDENCE: apps/app/dist/index.html after `npm run build -w apps/app`].
  - The site needs three **hashes**: Astro writes its island loader script, its media-directive script and a one-line `astro-island { display: contents }` style into the page. They are allowed by their sha256, not by `'unsafe-inline'`. The poster SVG used two `style="mix-blend-mode:plus-lighter"` attributes; they are now a class (`.poster .blend-light` in `site.css`), so no style attribute needs allowing [EVIDENCE: apps/site/src/lib/poster.ts].
  - After an Astro upgrade the hashes can change. The site's CSP test then fails. Recompute from a fresh build and paste the new values into `apps/site/public/_headers`:
    ```bash
    npm run build -w apps/site && node -e "const s=require('fs').readFileSync('apps/site/dist/index.html','utf8'),c=require('crypto'),h=x=>\"'sha256-\"+c.createHash('sha256').update(x).digest('base64')+\"'\";for(const m of s.matchAll(/<(script|style)>([\s\S]*?)<\/\1>/g))console.log(m[1],h(m[2]))"
    ```
- **X-Content-Type-Options** `nosniff`, **Referrer-Policy** `no-referrer`, **Permissions-Policy** `camera=(), microphone=(), geolocation=()`.
- **Caching**: hashed build output (`/assets/*` in the app, `/_astro/*` in the site) is `public, max-age=31536000, immutable`; the HTML (`/`, `/index.html`) and, in the app, `sw.js`, `registerSW.js` and `manifest.webmanifest` are `no-cache`. The rules do not overlap, because Pages joins repeated header names from several matching rules into one value [UNVERIFIED]. Other files get Cloudflare's default caching.
- **Not-found fallback**: neither build has a `404.html`, so Pages serves `index.html` for unknown paths (its single-page-app default) [UNVERIFIED]. The app has no client-side routes, so this only means a mistyped path opens the app. No `_redirects` file is used.

**Tested locally, not on Cloudflare.** `scripts/pages-serve.ts` serves each build with the `_headers` file read from `public/` on every request. `apps/app/e2e/csp.spec.ts` proves that setup, the ladder, the reader (its Web Worker included) and delete-all work under the app's CSP with no violation, that the SPA fallback answers an unknown path, and that a deliberate `fetch` to another origin is blocked by `connect-src`. `apps/site/e2e/csp.spec.ts` proves that the page and the 3D scene after the first interaction load under the site's CSP, and that the same probe is blocked [EVIDENCE: `npm run test:e2e`]. The local server is a stand-in: whether Cloudflare applies the file identically is [UNVERIFIED] until §5 is done on the first deploy.

## 5. Check the first deploy (two minutes)

1. Open the `*.pages.dev` URL in Edge or Chrome → DevTools → **Network** → reload → click the document request → **Response headers**: the CSP, Permissions-Policy, Referrer-Policy and `cache-control: no-cache` must be there, exactly as in `_headers`.
2. Click a file under `/assets/` (or `/_astro/`): `cache-control: public, max-age=31536000, immutable`.
3. **Console**: no "Refused to …" CSP messages while you use the app (set up a deal, read a reply, delete everything) or scroll the site until the 3D scene starts.
4. Nothing else may appear in the Network list: every request is to the same `*.pages.dev` host.

If step 3 shows a CSP error, **do not** loosen the policy with `'unsafe-inline'` or `'unsafe-eval'`: roll back (§7) and fix the cause.

## 6. Preview vs production; custom domain later

- **Production** = the `main` branch, served at `<project>.pages.dev`.
- **Preview** = every other branch and pull request, at `<hash>.<project>.pages.dev` and `<branch>.<project>.pages.dev`. Preview URLs are public to anyone who has them [UNVERIFIED]. Settings → Builds → **Preview branch deployments**: choose *None* or a custom list if you do not want every branch online [HYPOTHESIS: recommended until the owner decides].
- **Custom domain (later, owner decision)**: project → **Custom domains** → **Set up a custom domain** → follow the DNS steps. The `_headers` file applies to the custom domain too. If the domain's zone is on Cloudflare, keep **Email Address Obfuscation**, **Rocket Loader** and **Web Analytics** off for it: each injects a script that the CSP blocks, and analytics is not allowed anyway (§8).

## 7. Roll back

Project → **Deployments** → find the last good production deployment → **⋯** → **Rollback to this deployment** → confirm. It is instant and changes no code; fix the cause on a branch, then merge to `main` for a new production build. To pause automatic deploys while fixing: Settings → Builds → **Configure Production deployments** → off [UNVERIFIED: label].

## 8. What NOT to do

- **No secrets in the client.** Anything in a `VITE_*` or `PUBLIC_*` variable, or in any file under `apps/*/src`, ends up in public JavaScript. The app and site need no keys; add no environment variables except `NODE_VERSION`.
- **No analytics, no tracking, no third-party scripts**: not Cloudflare Web Analytics, not a tag manager, not a font CDN. Claims C3/C4 and the privacy tests depend on every request being same-origin [EVIDENCE: docs/product/11_claims_register.md; apps/app/e2e/privacy.spec.ts].
- **No `'unsafe-inline'` / `'unsafe-eval'`**, and no CSP edits made only in the dashboard: the policy lives in `_headers` and is tested.
- **No Pages Functions / Workers** for either project (the D10a decision keeps reading on the device).
- **No deploy GitHub Action with an API token.** Cloudflare's Git integration builds without one.
- Do not ship `docs/product/reference/concept_hero.png` or anything from `ml/gold/data/`; neither is in a build output [EVIDENCE: apps/site/public, apps/app/public].

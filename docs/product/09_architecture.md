# 09 · Architecture

Draft v0.1 (solo, no fixed deadline). Tags: [EVIDENCE: path] · [HYPOTHESIS] · [GAP]. External limits were fetched from vendor pages on **2026-11-10**; library capabilities named here are from general knowledge and are [UNVERIFIED] until the first spike in Phase A.

Fixed inputs: D8 = comfortable with React, Three.js and GSAP, wants the best product; immersive showcase + calm app. D10 = on-device analysis by default. D11 = 6 learned classes + rules [EVIDENCE: 03_scope_and_cut_line.md].

## 1. Stack options
[HYPOTHESIS: trade-offs are our judgement; hosting facts are cited in §6]

| | **A. Next.js + React Three Fiber + GSAP, app in the same codebase** | **B. Astro static showcase (React islands for 3D) + separate Vite React app, one monorepo** | **C. Mobile app (Expo / React Native) + web showcase** |
|---|---|---|---|
| Showcase first paint | framework runtime ships with every page; careful splitting needed to hit ≤ 300 KB [HYPOTHESIS] | HTML + CSS with zero JS by default; 3D islands load later: easiest way to hit the budget [HYPOTHESIS] | same as B for the site |
| App | works, but SSR/server features are unused by a local-first app | plain SPA/PWA: smallest moving parts | native feel; **Android share-sheet** could receive WhatsApp text directly, a real UX win for pasting [HYPOTHESIS] |
| Keeping 3D out of the app | needs discipline (dynamic imports, route-level splitting) | structural: separate apps, separate bundles | structural |
| On-device analysis | TS in a Web Worker | TS in a Web Worker (same package) | TS runs in RN; a model needs a native runtime [GAP] |
| Solo effort | one framework | two small build configs (Astro is thin) | two UIs, store accounts, review cycles [UNVERIFIED: store fees/process not checked] |
| Hosting | best on Vercel; Hobby is "personal, non-commercial use" only (https://vercel.com/docs/plans/hobby) | any static host | stores + static host |
| Lock-in | medium | low | medium |
**Recommendation: B.** It makes the two hard rules structural instead of a matter of discipline: the showcase renders text first and the app never ships 3D code. React and R3F skills (D8) are used inside one Astro island. GSAP was in the original plan and was removed on 2026-11-11: a small, unit-tested scroll module of our own reads scroll positions instead (`apps/site/src/lib/scroll-progress.ts`), so the showcase carries one dependency fewer and no scroll-jacking library. Cost of being wrong: if the showcase and app later need shared routing or server rendering, moving the app into Next.js is a port of one SPA, not a rewrite [HYPOTHESIS]. C is the best later step if pasting turns out to be the friction point (A9) [EVIDENCE: 04_research_integrity.md §3]; a PWA **Web Share Target** may give part of that win on Android without an app [UNVERIFIED: browser support not checked] [GAP: spike 2 h].

## 2. Repository layout (option B)
```
apps/site        Astro, static; one React island: R3F scene loaded after the first interaction; build-time poster; own scroll module
apps/app         Vite + React + TypeScript PWA; IndexedDB; never imports three, @react-three/* or gsap (lint rule)
packages/engine  pure TS: price ladder, debrief (no I/O)
packages/planner pure TS: reply options (doc 18 table), template packs, number post-check (no I/O; built in C1)
packages/analyser pure TS: amount parser + rule baseline, runs in a Web Worker
packages/tokens  colours, type, spacing (shared by site and app)
workers/draft    Cloudflare Worker: POST /v1/draft (LLM proxy, key server-side)
ml/              Python: gold set tools, eval harness, B2 learned model (TF-IDF + LR → JSON) and hing-bert research comparison (existing audit scripts live here)
```
The showcase scenes import `packages/engine` so every number on the site is a real engine output for a labelled example deal [EVIDENCE: 08_experience_and_brand.md §8.2].

## 3. Where each kind of decision sits
[EVIDENCE: 02_service_catalogue.md; 03_scope_and_cut_line.md D3, D10] for the decisions; placement is [HYPOTHESIS: design]

| Decision | Kind | Where it runs | Why |
|---|---|---|---|
| Floor / target / opening, concessions, debrief | deterministic | `packages/engine`, on the device | numbers must be exact and traceable [EVIDENCE: 02_service_catalogue.md S2, S8] |
| Reply options | deterministic strategy table (18_planner_rules.md) | `packages/planner`, on the device | [EVIDENCE: 02_service_catalogue.md S5] |
| Amount, move, objection | rules (B1); on-device learned model (TF-IDF + LR, JSON weights) only if it wins (B2) | `packages/analyser` in a Web Worker on the device; server only under D10(b) after legal review | [EVIDENCE: 07_trust_safety_compliance.md §4] |
| Wording of a draft | LLM, optional | `workers/draft` → provider | the only LLM use (D3) |
| Number post-check | deterministic | `packages/planner` `checkDraft`, on the device (C1); also in the Worker when C2 is built | defence in depth |

## 4. API contracts
All local calls are typed functions; the only network API in V1 is `/v1/draft`.
```ts
// packages/engine
computeLadder(i: { quoted: Money; unit: 'fixed'|'hour'|'month'; days: number;
  monthlyNeed: Money; costs?: Money; bufferPct?: number })
  -> { floor: Money; target: Money; opening: Money; trace: TraceStep[]; label: 'CALCULATION' }
debrief(deal: Deal) -> { totalConceded: Money; conditional: Money; unconditional: Money; lesson: RuleId }

// packages/analyser (Web Worker message; as built in B1.1, 2026-11-11)
analyse(text: string, state: { quoteSent: boolean | null }) -> {
  move: Move6 | null;                 // null = no evidence → the user picks (A9)
  confidence: number;                 // margin of the top two scores, in [0, 1]
  anchorOrCounter: 'ANCHOR'|'COUNTER'|null;   // PRICE_POSITION only, from state
  objection: Objection6 | null; objectionConfidence: number;
  conditional: boolean | null;        // CONCESSION only
  amount: { rupees: bigint | null; rupeesHigh: bigint | null; unit: Unit | null;
            currency: 'INR'|'OTHER'|null; span; ambiguous: boolean; flags; candidates };
  evidence: { phrase, start, end, supports, weight, rule }[];
  source: 'rules'; version: string }
```
Money in the analyser is **bigint rupees**, never a float (the engine's no-float lint covers `amount.ts`); an amount it cannot settle exactly comes back `ambiguous` instead of guessed [EVIDENCE: packages/analyser/src/amount.ts]. The analyser never returns a floor, target or opening. The main thread imports only `@molbhav/analyser/client` (types only) and `/labels`, so the rules load in the Worker alone [EVIDENCE: packages/analyser/test/worker.test.ts]. The built worker is 27,123 bytes before compression, inside the ≤ 50 KB target [EVIDENCE: apps/app/dist/assets/analyser.worker-*.js, B1.1 build].
```ts
// packages/planner (as built in C1, 2026-11-11). All money is bigint rupees.
planReplies(i: PlanInput) -> Plan
  // PlanInput = { ladder: {unit, step, floor, target, opening, concessionRoomPct, inputs},
  //               deal: {quoteSent, currentQuote}, client: {move, objection, amount, amountUnit,
  //               amountCurrency, source: 'analyser'|'manual', confidence},
  //               prefs: {condition, advancePct: 25n|50n, reducedEffort} }
  // Plan.options[]: {id, kind, family a–f, rank, rule, reason, risk, conditional,
  //                  unconditionalConcession, figures, allowed: AllowedPrice[] (never the floor)}
draftRequest(o: PlanOption, ctx: {move, objection, lang, tone, unit}, advancePct) -> DraftRequest
  // { kind, move, objection, lang, tone, condition, unit, numbers: {slot: bigint} }
  // no field admits free text: FreeTextKeys<DraftRequest> = never (a type test)
isDraftRequest(x: unknown) -> boolean      // exact keys, enum values, bigint numbers only
fillTemplate(r: DraftRequest) -> { ok: true, templateId, text, allowed, check, needsEdit }
                              | { ok: false, error: 'invalid_request'|'missing_number'|'check_failed' }
checkDraft(text: string, allowed: AllowedNumbers) -> { ok, found: Found[], offending: Found[] }
  // fails closed: any number, number word, range, hedge, other currency or unit, other script,
  // hidden character or tax/legal term not exactly in `allowed` → ok: false, with a reason
```
The client's message never reaches the planner: `planInputFrom` builds `PlanInput` from the reader's confirmed fields only, and S6 receives only a `DraftRequest` [EVIDENCE: packages/planner/test/draft.test.ts; apps/app/test/options.test.tsx]. **Extension point (not built):** a future `/v1/draft` client would take the same `DraftRequest`, and its text would pass `checkDraft` against `allowedFor(request)` before it is shown; a failure shows the template. There is no toggle for it in C1 (apps/app/src/screens/Draft.tsx comment).
```http
POST /v1/draft            (C2, not built; only when the user has turned drafting on)
Content-Type: application/json   (max 2 KB)
{ "optionKind": "HOLD|TRADE|WALK", "deliverable": "website|app|ui_design|other",
  "numbers": { "price": 42000, "advancePct": 50 }, "lang": "en|hinglish" }
200 { "text": "...", "numbersUsed": [42000, 50], "checked": true }
422 { "error": "check_failed" }  -> client shows the template
```
Rules [HYPOTHESIS: design]: the schema has **no free-text field**, so client names and message text cannot be sent; unknown fields are rejected; request bodies are never logged; CORS limited to our origin; a per-IP rate limit [GAP: mechanism not chosen].

## 5. Data flow
```
[paste] -> Web Worker analyse() -> Analysis ──┐
[deal form] -> computeLadder() -> Ladder ─────┼-> planReplies() -> Option -> DraftRequest -> fillTemplate() -> checkDraft() -> draft
                                              │                       └-(opt-in, C2, not built)-> /v1/draft -> checkDraft() -> draft
IndexedDB: Deal, Ladder, saved reply draft, Moves, Outcome  <────┘   (never leaves the device by default)
Opt-in counts: { ladders: 3, analyses: 2, ... } -> /v1/counts [GAP: endpoint not designed; V1·D]
```
**On-device analysis (D10).** The rule baseline + parser are plain TypeScript in a Web Worker: normalise (lowercase, common Roman-Hindi spelling variants such as "kam/kum"), parse amounts (₹, rs, inr, k, L, lakh, lac, cr, and the thousand words hazaar/hajar/hazar: "30 hazaar" → ₹30,000, "1.5 hazaar" → ₹1,500), score each class by weighted patterns, confidence = margin between the top two scores; the threshold is tuned on the dev split only [EVIDENCE: 04_research_integrity.md §2]. Target bundle ≤ 50 KB [HYPOTHESIS]. **B2 learned model (2026-11-11):** the Worker also loads a JSON file with the vocabulary, idf values and logistic-regression weights (≤ 4,000 features, target ≤ 250 KB) and reproduces the Python vectoriser exactly (same lowercasing, tokeniser regex, char n-gram padding, sublinear tf, l2 norm); a parity test checks TS vs Python probabilities on the dev split to within 1e-6 [HYPOTHESIS: caps and tolerance]. hing-bert is evaluated in Python only, as a research comparison. The fine-tuned model is ~110M parameters [EVIDENCE: docs/dataset-audit/cards/hingbert_models.md], about 110 MB at 8-bit [CALCULATION: 1 byte per parameter], too large for the low-end budget, so in-browser inference (option c) would need distillation [GAP].

## 6. Hosting on free tiers (vendor pages, accessed 2026-11-10)
| Use | Provider and plan | Limits that matter | Source |
|---|---|---|---|
| Site + app (static) | **Cloudflare Pages Free** | 500 builds/month; 20,000 files/site; 25 MiB max file; bandwidth not stated on the page | https://developers.cloudflare.com/pages/platform/limits/ |
| `/v1/draft` proxy | **Cloudflare Workers Free** | 100,000 requests/day; 10 ms CPU per invocation; 128 MB memory; 64 MiB script | https://developers.cloudflare.com/workers/platform/limits/ , https://developers.cloudflare.com/workers/platform/pricing/ |
| Alternative | Vercel Hobby | 100 GB transfer, 1M function invocations, 1M CDN requests per month; **personal, non-commercial use only** | https://vercel.com/pricing , https://vercel.com/docs/plans/hobby |
| Alternative | Netlify Free | 300 credits; bandwidth costs 20 credits/GB (≈15 GB if spent only on bandwidth: CALCULATION); reset period not stated | https://www.netlify.com/pricing/ |
| Not suitable | GitHub Pages | not for sites "providing commercial software as a service (SaaS)" | https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits |
| D10(b) model, only if needed | Hugging Face Spaces CPU Basic | 2 vCPU, 16 GB RAM, free; sleeps when unused; Gradio/Docker Spaces need a paid plan to create | https://huggingface.co/docs/hub/spaces-overview |
**Deploy prep (B1.1b, 2026-11-11).** Two Cloudflare Pages projects from this repository (root directory = repo root, `npm run build -w apps/app` → `apps/app/dist`; `npm run build -w apps/site` → `apps/site/dist`), Node from `.nvmrc`; step-by-step in [16_deploy.md](16_deploy.md). Nothing is deployed. Response headers live in each project's `public/_headers` [EVIDENCE: apps/app/public/_headers, apps/site/public/_headers]:
- CSP `default-src 'self'` with `connect-src`, `script-src`, `style-src`, `font-src`, `worker-src` all `'self'`, `img-src 'self' data:`, `object-src 'none'`, `frame-ancestors 'none'`, `base-uri 'self'`, `form-action 'self'`; **no `'unsafe-inline'`, no `'unsafe-eval'`**. The site adds three sha256 hashes for Astro's inline island loader, media-directive script and `astro-island` style; the poster's two inline `style` attributes became a class so no style attribute needs allowing.
- `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer`, `Permissions-Policy: camera=(), microphone=(), geolocation=()`.
- Hashed assets (`/assets/*`, `/_astro/*`) `immutable` for a year; HTML, `sw.js`, `registerSW.js` and the manifest `no-cache`.
- Not-found paths: Pages' default single-page fallback (no `404.html`, no `_redirects`) [UNVERIFIED on Cloudflare].
- Tested by serving each build with that exact file (`scripts/pages-serve.ts`, which reads `public/_headers` on every request) in `apps/app/e2e/csp.spec.ts` and `apps/site/e2e/csp.spec.ts`: the app's setup, ladder, reader Worker and delete-all, and the site's 3D scene after the first interaction, run with no CSP violation; a `fetch` to another origin is blocked. Cloudflare's own handling of `_headers` is [UNVERIFIED] until the first deploy check (16 §5).

Cost today: **₹0** for hosting [CALCULATION: all chosen tiers are free]; the LLM is the only per-use cost and is unpriced [GAP: price per draft from the chosen provider's page, cited, in Phase C]. Unknowns: whether 10 ms CPU covers a proxy that mostly waits on the network [UNVERIFIED: test in Phase C]; Cloudflare's commercial-use terms were not read [UNVERIFIED].

## 7. Evaluation plan (links the ML and the app)
1. `ml/eval` (planned, Python) owns metrics: bootstrap CIs, per-class support, paired Δ [EVIDENCE: 04_research_integrity.md §2.2].
2. The TS baseline is scored through the **same** harness: `packages/analyser/scripts/predict` reads `test.jsonl` and writes predictions; Python computes the metrics. The test file's sha256 is checked before every run.
3. B2: the learned TF-IDF + LR model (scored from its TS implementation, after the parity test) and hing-bert (scored in Python) go through the same harness; ship rule for the learned model = lower 95% CI bound of Δ macro-F1 (model − rules) > 0; hing-bert is reported only.
4. The eval report (JSON + markdown) is versioned and shown in the app's about page with "self-authored, directional".

## 8. Testing
[HYPOTHESIS: design proposal, not built or tested; applies to every row below unless a row carries its own tag]

| Layer | Tool [UNVERIFIED: tools chosen, not yet set up] | What must pass |
|---|---|---|
| Engine | Vitest + fast-check | ≥10 hand-worked ladders exact; floor ≤ target ≤ opening; monotonic in costs; no option below floor without USER DECISION [EVIDENCE: 04_research_integrity.md §3 A2] |
| Parser | Vitest table tests | every INR format incl. hazaar/hajar/hazar; ≥95% exact on the frozen test (A4) |
| Post-check | Vitest adversarial set [EVIDENCE: C1 built: 404 cases, 0 invented numbers passed, 54/54 controls; packages/planner/test/adversarial.test.ts] | 0 invented numbers pass (A5), including numerals with k/L/lakh/cr suffixes and number words: "30 hazaar"/"hajar"/"hazar", "tees hazaar", "thirty thousand"; any number word not mapped to an engine value fails the draft |
| Privacy | Playwright with request interception | **no request body contains the pasted text**, in every flow, with all toggles off |
| `/v1/draft` | schema tests | free text and unknown fields rejected |
| Accessibility | axe-core + keyboard run | no serious violations; golden path by keyboard |
| Showcase performance | Lighthouse CI budget file on a mobile profile | ≤ 300 KB initial, LCP ≤ 2.5 s (lab) [EVIDENCE: 08_experience_and_brand.md §8.3] |
| Evidence labels | Playwright | each scene's end state: label elements visible and not covered (elementFromPoint check) |

## 9. 3D asset and performance pipeline
[HYPOTHESIS: design proposal, not built or tested; applies to every row below unless a row carries its own tag]
- **Authoring:** Blender → glTF 2.0; low-poly, matte clay/brass, baked lighting (no real-time shadows, no environment maps) [HYPOTHESIS: cheapest look that fits 08].
- **Compression:** `gltf-transform` with Meshopt (or Draco) for geometry, KTX2/Basis for textures, textures ≤ 1024²; instancing for repeated objects (weights, beads, tiles) [UNVERIFIED: tool flags to confirm in A2].
- **Loading:** a scene mounts only when within ~1 viewport of the screen (IntersectionObserver); poster image (AVIF/WebP) is the Suspense fallback; scenes dispose geometry/textures when far away.
- **Runtime:** one shared canvas where possible; R3F `frameloop="demand"`; device-pixel-ratio capped at 1.5; GPU tiering decides 3D vs poster; scroll drives one progress value per scene, read at most once per frame by our own module (`scroll-progress.ts`: `watchProgress`, `piecewise`, `follow`) and eased in the frame loop (no per-frame React re-renders, no GSAP). The poster is projected at build time from the same scene model as the live scene (`scene-model.ts`, `poster.ts`).
- **Fallback triggers:** no WebGL, Save-Data, low GPU tier, reduced motion, or measured fps < 30 for 2 s → poster + HTML.
- **Budget enforcement:** Lighthouse CI fails the build when over budget; asset sizes checked by a script against the per-scene 1.5 MB cap.

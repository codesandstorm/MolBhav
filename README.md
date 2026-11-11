# MolBhav

MolBhav helps freelancers in India prepare for a price negotiation. It works out a price ladder (floor, target, opening) from your own inputs, on your device. It does not give you a market rate. [EVIDENCE: docs/product/13_price_ladder_spec.md]

MolBhav is a solo student project in active development. Built so far: Phase A (the price ladder) and Phase A2 (the locked v1.0 design language, the redesigned app and the showcase) and its A2.1 polish (one scene model for the poster and the live hero, atmosphere, the real-app product shot, the quote track). B1.1 adds the gold-set tools, the amount parser and rule baseline, and a "Read your client's reply" screen; B1.1b approves the labelling guidelines (v0.2), shows the freelancer's quote as context in the gold tools, and prepares a Cloudflare Pages deploy (not deployed). The gold set itself is not written yet, so the rules are not scored. [EVIDENCE: docs/product/progress_log.md]

## Layout

[EVIDENCE: docs/product/09_architecture.md §2]

| Path                | What                                                                                                                                                                                                                        |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/app`          | Vite + React + TypeScript PWA. Deals are stored in IndexedDB on the device [EVIDENCE: apps/app/e2e/privacy.spec.ts].                                                                                                        |
| `apps/site`         | Astro showcase. One React Three Fiber island (the hero ladder) that replaces a static poster only after the first interaction; text and numbers are plain HTML [EVIDENCE: apps/site/e2e/hero.spec.ts].                      |
| `packages/engine`   | Price ladder engine. Exact BigInt rationals, no floating point on money [EVIDENCE: packages/engine/test/units.test.ts].                                                                                                     |
| `packages/analyser` | Message analyser (S4b): amount parser (exact bigint rupees, or marked ambiguous) and rule baseline, run in a Web Worker on the device [EVIDENCE: packages/analyser/test/worker.test.ts].                                    |
| `packages/gold`     | Gold-set toolchain (S4a): schemas, seeded prompt cards, local writing and blind-labelling tools, split-and-freeze, metrics [EVIDENCE: docs/product/04_research_integrity.md §2].                                            |
| `packages/tokens`   | Design tokens v1.0, LOCKED (colour, glass, type, spacing, motion) as TypeScript and generated CSS [EVIDENCE: docs/product/15_design_language.md].                                                                           |
| `ml/`               | Dataset audit scripts (Python). `ml/gold/` holds the labelling guidelines, schemas, prompt cards and the eval-report stub. Raw datasets are never committed; gold messages stay local (gitignored) until the owner decides. |

## Run

Requires Node 24.13.1 (see `.nvmrc`) and npm 11.

```bash
npm ci
npm run dev          # the app, at http://localhost:5173
npm run dev:site     # the showcase, at http://localhost:4321
```

The design is locked (docs/product/15_design_language.md §10). Changing `packages/tokens/src/index.ts` needs a new dated changelog row there with the new hash, a `designVersion` bump and `npm run build:css -w packages/tokens`; otherwise `npm test` fails.

## Test

```bash
npm run lint && npm run format:check && npm run typecheck
npm test             # engine, analyser, gold-tool, tokens, site and app unit tests, including property tests
npm run test:hand    # hand-verified examples (packages/engine/test/hand_verified.json)
npm run test:e2e     # Playwright: app (privacy, delete-all, keyboard, axe) then site (poster first, 3D after first interaction, fallbacks, axe, keyboard, privacy, budget)
npm run test:budget  # the site performance budget, 5 runs; min/median/max in apps/site/.budget/report.json; also reports how closely the poster matches the first live frame (report-only)
```

Locally, `test:e2e` uses the installed Microsoft Edge. In CI it uses Playwright's Chromium (`npx playwright install --with-deps chromium`). [EVIDENCE: apps/app/playwright.config.ts]

The budget check measures the built site through a gzip static server under a throttled mobile profile (360 px, 150 ms RTT, 1.6 Mbps, 4× CPU). That is a lab proxy, not a real phone. Budgets live in `apps/site/budgets.ts` [EVIDENCE: docs/product/08_experience_and_brand.md §8.3].

Review screenshots (app: welcome, setup, ladder, evidence, settings; site: hero poster, hero live, ladder story, pillars, how it works, the real app, trust band, footer, and hero before/after pairs for A2.1; 360, 768 and 1280 px) are in `docs/product/screens/`. Regenerate them with `node apps/site/scripts/screens.ts` while both previews run (add `--only app-reader` for just the reader screen; it needs only the app preview). The showcase's product shot (`apps/site/public/product/app-ladder.webp`) is a screenshot of the real app with its made-up example deal; it is not made by the build.

**Re-run `npm run shots:product` whenever the app's ladder screen changes.** It builds the app, serves it locally, retakes the shot and records which source it came from; the site's unit test fails while the shot is older than the ladder screen's source files [EVIDENCE: apps/site/test/product-shot.test.ts].

## Deploy

Not deployed. Cloudflare Pages settings, headers and the step-by-step dashboard guide are in [docs/product/16_deploy.md](docs/product/16_deploy.md). The headers live in `apps/app/public/_headers` and `apps/site/public/_headers`; `npm run test:e2e` checks both builds under them.

## Writing and labelling the gold set (Windows)

The tools run only on your own computer, at `127.0.0.1`; nothing is sent anywhere. What you write is saved in `ml/gold/data/`, which git ignores [EVIDENCE: ml/gold/data/README.md]. Read `ml/gold/GUIDELINES.md` first (v0.2).

**Write the messages, one per prompt card**

1. Open **Windows Terminal** (or PowerShell).
2. Go to the project folder, for example `cd $HOME\Desktop\Mol-Bhav`.
3. First time only: `npm ci`.
4. Start the writing tool: `npm run gold:write`.
5. Open **http://127.0.0.1:4410/** in Edge or Chrome.
6. Read the card, write the client's message in your own words, pick the language, then **Save and next (Ctrl+Enter)**. Under the card you see the one line the labeller will see about the deal ("Freelancer's quote so far: ₹…" or "No quote sent yet"); keep the message consistent with it.
   - **Skip this card** leaves a card for later.
   - **Previous card** and **Next card** let you edit a saved message until it has been labelled.
   - The timer pauses while the tab is hidden.
7. To stop, close the tab and press **Ctrl+C** in the terminal. Running `npm run gold:write` again resumes where you stopped.

**Label them blind, after writing**

1. Run `npm run gold:label` and open **http://127.0.0.1:4411/**.
2. You see the message text and one line about the freelancer's quote, shuffled. You never see the card or the intended move.
3. Choose the move, the objection, **Conditional?** (shown only for CONCESSION), the amount fields and **Unsure**, then **Save and next**.
4. At least 14 days later, run the retest pass: `npm run gold:label -- --pass v2`. It only offers messages whose first label is 14 or more days old.

**Check your work at any time**

- `npm run gold:validate` checks every file against the schema.
- `npm run gold:timing` shows your measured minutes per message next to the planning assumptions (1.5 min to write, 0.6 min to label).

**Before you start, know this:**

- Do **not** run `npm run gold:split` until pass 1 is fully labelled. It freezes the test set and records its sha256 once, and refuses to run a second time.
- `npm run gold:annotate` (the LLM second annotator) stops with a message until a provider is chosen.
- If a port is busy, add `-- --port 4420` to the command.

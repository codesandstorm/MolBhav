# MolBhav

MolBhav helps freelancers in India prepare for a price negotiation. It works out a price ladder (floor, target, opening) from your own inputs, on your device. It does not give you a market rate. [EVIDENCE: docs/product/13_price_ladder_spec.md]

MolBhav is a solo student project in active development. Built so far: Phase A (the price ladder) and Phase A2 (the locked v1.0 design language, the redesigned app and the showcase). [EVIDENCE: docs/product/progress_log.md]

## Layout

[EVIDENCE: docs/product/09_architecture.md §2]

| Path                | What                                                                                                                                                                                                   |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `apps/app`          | Vite + React + TypeScript PWA. Deals are stored in IndexedDB on the device [EVIDENCE: apps/app/e2e/privacy.spec.ts].                                                                                   |
| `apps/site`         | Astro showcase. One React Three Fiber island (the hero ladder) that replaces a static poster only after the first interaction; text and numbers are plain HTML [EVIDENCE: apps/site/e2e/hero.spec.ts]. |
| `packages/engine`   | Price ladder engine. Exact BigInt rationals, no floating point on money [EVIDENCE: packages/engine/test/units.test.ts].                                                                                |
| `packages/analyser` | Empty stub (Phase B).                                                                                                                                                                                  |
| `packages/tokens`   | Design tokens v1.0, LOCKED (colour, glass, type, spacing, motion) as TypeScript and generated CSS [EVIDENCE: docs/product/15_design_language.md].                                                      |
| `ml/`               | Dataset audit scripts (Python). Raw datasets are never committed.                                                                                                                                      |

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
npm test             # engine and app unit tests, including property tests
npm run test:hand    # hand-verified examples (packages/engine/test/hand_verified.json)
npm run test:e2e     # Playwright: app (privacy, delete-all, keyboard, axe) then site (poster first, 3D after first interaction, fallbacks, axe, keyboard, privacy, budget)
npm run test:budget  # the site performance budget, 5 runs; min/median/max in apps/site/.budget/report.json
```

Locally, `test:e2e` uses the installed Microsoft Edge. In CI it uses Playwright's Chromium (`npx playwright install --with-deps chromium`). [EVIDENCE: apps/app/playwright.config.ts]

The budget check measures the built site through a gzip static server under a throttled mobile profile (360 px, 150 ms RTT, 1.6 Mbps, 4× CPU). That is a lab proxy, not a real phone. Budgets live in `apps/site/budgets.ts` [EVIDENCE: docs/product/08_experience_and_brand.md §8.3].

Review screenshots (app: welcome, setup, ladder, evidence, settings; site: hero poster, hero live, ladder story, pillars, how it works, trust band, footer; 360, 768 and 1280 px) are in `docs/product/screens/`. Regenerate them with `node apps/site/scripts/screens.ts` while both previews run.

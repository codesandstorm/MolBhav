# MolBhav

MolBhav helps freelancers in India prepare for a price negotiation. It works out a price ladder (floor, target, opening) from your own inputs, on your device. It does not give you a market rate. [EVIDENCE: docs/product/13_price_ladder_spec.md]

MolBhav is a solo student project in active development. Phase A (the price ladder) is the only part built so far. [EVIDENCE: docs/product/progress_log.md]

## Layout

[EVIDENCE: docs/product/09_architecture.md §2]

| Path                | What                                                                                                                    |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `apps/app`          | Vite + React + TypeScript PWA. Deals are stored in IndexedDB on the device [EVIDENCE: apps/app/e2e/privacy.spec.ts].    |
| `apps/site`         | Astro showcase site (a placeholder for now).                                                                            |
| `packages/engine`   | Price ladder engine. Exact BigInt rationals, no floating point on money [EVIDENCE: packages/engine/test/units.test.ts]. |
| `packages/analyser` | Empty stub (Phase B).                                                                                                   |
| `packages/tokens`   | Design tokens (provisional).                                                                                            |
| `ml/`               | Dataset audit scripts (Python). Raw datasets are never committed.                                                       |

## Run

Requires Node 24.13.1 (see `.nvmrc`) and npm 11.

```bash
npm ci
npm run dev          # the app, at http://localhost:5173
```

## Test

```bash
npm run lint && npm run format:check && npm run typecheck
npm test             # engine and app unit tests, including property tests
npm run test:hand    # hand-verified examples (packages/engine/test/hand_verified.json)
npm run test:e2e     # Playwright: privacy, delete-all, keyboard and accessibility (builds the app first)
```

Locally, `test:e2e` uses the installed Microsoft Edge. In CI it uses Playwright's Chromium (`npx playwright install --with-deps chromium`). [EVIDENCE: apps/app/playwright.config.ts]

# Progress log (planned vs actual hours)

Solo project, no fixed deadline. "Planned" comes from [03_scope_and_cut_line.md](03_scope_and_cut_line.md) [HYPOTHESIS: estimates]. "Actual (session)" is the wall-clock time of the AI-assisted working session, measured from the shell clock. "Actual (Sandarbh)" is your own time (reviewing, hand-computing, deciding), which only you can fill in. A phase's real total is the sum of both columns.

## Phase A · Honest numbers (planned 34 h)
| Date | Task | Planned h | Actual (session) h | Actual (Sandarbh) h | Status / notes |
|---|---|---|---|---|---|
| 2026-11-11 | Step 0: pre-flight `git status` and ignore checks | 0 (not in plan) | ~0.05 (01:38 start) | — | done: nothing under `.venv/` or `data/raw/` tracked or unignored; repo has no commits yet |
| 2026-11-11 | Step 0: docs: hazaar/hajar/hazar in parser spec + post-check plan; on-device TF-IDF + LR model in B2 (02, 03, 04, 09, 10, 11) | 0 (not in plan) | (included in the 01:38–01:41 session) | — | done; B2 21 h, total 212 h |
| 2026-11-11 | Step 1: S2 price ladder spec (13) | part of S2's 8 h | (included in the 01:38–01:41 session) | — | approved 2026-11-11 |
| 2026-11-11 | Hand-verified examples (13, `packages/engine/test/hand_verified.json`) | not in plan | 0 | (yours) | written by Sandarbh; never edited by the session (sha256 910f83ae…441d before and after) |
| 2026-11-11 | Step A: spec 13 v0.2 (§3.5 concession room, §5.1 missing values, §5.2 validation order, §5.3 result shape and warnings) | part of S2's 8 h | ~0.05 (02:28–02:30) | — | done |
| 2026-11-11 | Step B: scaffold (npm workspaces, TS strict, ESLint, Prettier, Vitest + fast-check, CI `lint`/`typecheck`/`test`) | 6 | ~0.05 (02:30–02:34) | — | done; CI not yet run on GitHub (nothing pushed) |
| 2026-11-11 | Step C: engine (BigInt rationals, ladder, trace, quote, concession room, validation) + 44 tests | part of S2's 8 h | ~0.05 (02:34–02:37) | — | done; hand-verified 13/14 tests pass, HV09 needs the `warnings` key |
| 2026-11-11 | Step D: S1 setup, S2 ladder screen, S7 evidence log, S13 IndexedDB + delete-all, shell, label test, Playwright privacy + a11y | S1 5 · S2 (rest) · S7 5 · S13 4 · shell 6 | ~0.15 (02:37–02:46) | — | done locally |
| 2026-11-11 | Close-out: concession room from rounded rungs (spec 13 v0.3), exponent cap, stricter S7 label test, 08 §7 copy rows | not in plan (Phase A fixes) | ~0.05 (02:58–03:02) | — | done; checks green |
| 2026-11-11 | Repo wiring prep: git state check, ignore rules for data/, .gitattributes (LF), CI pinned to .nvmrc, lockfile Linux-binary check, README | not in plan | ~0.05 (03:04–03:07) | — | done; nothing committed or pushed |

## Phase A2 · Design language + hero scene (planned 20 h)
| Date | Task | Planned h | Actual (session) h | Actual (Sandarbh) h | Status / notes |
|---|---|---|---|---|---|
| 2026-11-11 | Read 08, 03, 09, 11, 07, 12; font ₹-glyph check | (in tokens) | ~0.05 (03:16–03:20) | — | done; branch is `main`, not `phase-a2-design` (no branch created: git writes not allowed) |
| 2026-11-11 | Step 1: packages/tokens (TS source, generated CSS, 61 tests: contrast, drift, raw-value scan) + 15_design_language.md | 5 | ~0.1 (03:20–03:24, doc 03:40–03:43) | — | done |
| 2026-11-11 | Step 2: app ladder restyle on tokens | 3 | ~0.05 (03:24–03:27) | — | done; no behaviour change, app tests green |
| 2026-11-11 | Step 3: hero page, R3F island, poster, choreography | 9 | ~0.1 (03:27–03:33) | — | done |
| 2026-11-11 | Step 4: budget, fallback, a11y, keyboard, privacy tests; CI wiring; screenshots | 3 | ~0.2 (03:33–03:40, 03:43–03:50) | — | done locally; **TBT budget fails** (269–424 ms vs 200 ms, all from the 3D start-up; 0–5 ms without 3D); awaiting a decision, budget not loosened; CI not run |
Phase A2 session total: ~0.6 h [CALCULATION: 03:16 → 03:50]. Planned: 20 h [EVIDENCE: 03_scope_and_cut_line.md].

### Phase A2 revision · reference look, app redesign, showcase, design lock
| Date | Part | Actual (session) h | Actual (Sandarbh) h | Status / notes |
|---|---|---|---|---|
| 2026-11-11 | Reference study + palette sampling (PIL, scratchpad) | ~0.05 (03:54–03:58) | — | done; the brief names `hero-concept.png`, the file is `concept_hero.png`; `docs/product/reference/` gitignored; branch is still `main` (no `phase-a2-design` exists; git writes not allowed) |
| 2026-11-11 | Part 1: tokens v1.0 (dark only, glass/glow/gradient, contrast fixes, design-lock test) | ~0.1 (03:58–04:04) | — | done; 58 token tests; lock checked by mutating a token (fails) and restoring (passes) |
| 2026-11-11 | Part 2: app redesign (8 shared components, every screen, 360 → 1280 px) | ~0.1 (04:04–04:09) | — | done; S7 labels, no-room, lint-rule, axe, keyboard, privacy, delete-all all green |
| 2026-11-11 | Decision 3: GSAP removed; own scroll-progress module + tests | ~0.05 (04:09–04:11) | — | done |
| 2026-11-11 | Part 3: showcase redesign (hero, story, example card, pillars, how it works, trust, footer; 3D after first interaction; posters) | ~0.15 (04:11–04:19) | — | done |
| 2026-11-11 | Part 4: Playwright (15 site tests), budget 5×, 36 screenshots | ~0.1 (04:19–04:24) | — | done locally; budget 5× all green (long tasks after first scroll 275 / 289 / 303 ms); CI not run |
| 2026-11-11 | Docs: 15 (LOCKED v1.0), 08, README, this log | ~0.15 (04:22–04:36) | — | done; final check run 04:31–04:36 |

Phase A2 revision session total: ~0.7 h [CALCULATION: 03:54 → 04:36]. Phase A2 including the first pass: ~1.3 h [CALCULATION: 0.6 + 0.7].

Session total so far: ~1.8 h [CALCULATION: 01:38–01:41, 02:28–02:46, 02:58–03:02 and 03:04–03:07, rounded up, 03:16–03:50 and 03:54–04:36]. Planned for Phase A: 34 h [EVIDENCE: docs/product/03_scope_and_cut_line.md]. The gap is mostly your review time, which this column does not count.

### Phase A2.1 · polish (branch `phase-a2-polish`)
| Date | Part | Actual (session) h | Actual (Sandarbh) h | Status / notes |
|---|---|---|---|---|
| 2026-11-11 | Showcase: one scene model for poster and live (camera, materials, atmosphere, motes, parallax, ribbon), hero re-composition | ~0.5 (04:45–04:53, 10:04–10:25) | — | done; tokens unchanged (lock test green); poster vs first live frame 0.977 (1280 px) / 0.978 (360 px) |
| 2026-11-11 | Product shot, pillar icon set, section rhythm, reveals, footer | (in the row above) | — | done; product shot 41 KB WebP, lazy, same-origin |
| 2026-11-11 | App: quote track labels and bracket wording; 360/768/1280 review (ladder two-column, evidence table, welcome mini ladder) | ~0.1 (10:15–10:22) | — | done; no behaviour change; S7 test green |
| 2026-11-11 | App e2e 5× on a fresh build; axe one-off | ~0.05 (10:22–10:26) | — | 20/20 pass; cause not proven (an orphaned preview server from the earlier session was being reused) |
| 2026-11-11 | Screenshots, docs 03/08/09/15, README; budget 5× | ~0.3 (10:26–11:00) | — | **TBT before interaction fails in 2 of 5 runs** (88–333 ms vs 200 ms); an interleaved A/B against the A2 build (HEAD) on the same machine gives the same result for both (TBT median 272 vs 235 ms), so the machine was loaded (CPU ≈ 60 % from other apps), not A2.1; budget not loosened. A second 5× run (10:58) passed every budget: TBT 40 / 73 / 136 ms |

Phase A2.1 session total: ~1.0 h [CALCULATION: 04:45–04:53 and 10:04–11:00, rounded up].

### Phase B1.1 · gold-set tools, parser, rule baseline, reader screen (no branch switch: see notes)
| Date | Part | Actual (session) h | Actual (Sandarbh) h | Status / notes |
|---|---|---|---|---|
| 2026-11-11 | Read the docs; Step 1: `ml/gold/GUIDELINES.md` v0.1 DRAFT | ~0.15 (11:05–11:13) | — | done; COMPETITOR proposed as the sixth objection type [HYPOTHESIS]; judgement calls J1–J13 await approval. The brief names branch `phase-b1-reader`, which does not exist locally; creating it is a git write, so the work sits uncommitted on `phase-a2-polish` |
| 2026-11-11 | Step 2: schemas + validator, card generator (seed 42, 300 cards), writing and blind-labelling tools, split-and-freeze (not run), LLM skeleton (fails closed), metrics with hand-computed tests, timing | ~0.25 (11:13–11:27) | — | done; gold package 57 tests (1 skipped until a test split is frozen); `ml/gold/data/` gitignored except its README |
| 2026-11-11 | Step 3: amount parser (`packages/analyser/src/amount.ts`) | ~0.25 (11:27–11:41) | — | done; exact bigint rupees or ambiguous; table, adversarial, all-300-cards and fast-check property tests; engine no-float lint applied to it |
| 2026-11-11 | Step 4: rule baseline, Worker boundary (`rules.ts`, `serve.ts`, `client.ts`) | ~0.15 (11:41–11:48) | — | done; written from the guidelines only (illustrative examples as fixtures, no gold exists); invariants incl. a random-text property; node worker_threads boundary test |
| 2026-11-11 | Step 5: "Read your client's reply" screen (S4b) | ~0.2 (11:48–11:59) | — | done; S7 labels, reader states, privacy (message never in any request; Worker created), axe and keyboard all green; tokens unchanged |
| 2026-11-11 | Step 6: docs 02, 04, 08, 09, README, this log; final checks | ~0.1 (11:59–12:06) | — | lint, format, typecheck clean; unit 439 passed + 1 skipped (app 20, site 43, analyser 197, engine 64, gold 57+1 skipped, tokens 58); hand-verified 14; build ok (worker 27.1 kB, 10.9 kB gzip); e2e app 7/7, site 23/23; CI not run |

Phase B1.1 session total: ~1.0 h [CALCULATION: 11:05 → 12:06]. Planned for B1 (S4a 25 h blocking + S4b 9 h): 34 h [EVIDENCE: docs/product/02_service_catalogue.md]; the 25 h of S4a are mostly the owner writing and labelling, which has not started.

### Phase B1.1b · guideline fix, quote context, reader and product-shot checks, deploy prep (branch `phase-b1-reader`)
Times are from file modification times on this machine. There was a pause of about 2.5 h between 12:38 and 15:05 (no work happening); it is not counted.

| Date | Part | Actual (session) h | Actual (Sandarbh) h | Status / notes |
|---|---|---|---|---|
| 2026-11-11 | `ml/gold/GUIDELINES.md` v0.2: owner's decisions applied | ~0.02 (12:20–12:21) | — | done; J1–J4, J6, J8–J13 and COMPETITOR APPROVED 2026-11-11; J5 and J7 changed to use the visible quote; §0 lists what the blind labeller sees; rules relying on unseen information removed |
| 2026-11-11 | Quote context: cards, tools, schema, validator, annotator, quote-aware rules | ~0.17 (12:21–12:31) | — | done; cards gain `quote_rupees`/`quote_unit` (no RNG change); 21 cards changed `quote_sent` (all ACCEPT cards and every quote-reference card now have a quote sent); labels store the context shown; rules 0.2: bare "ok" with no quote → OTHER, a number with only weak movement words and no quote → PRICE_POSITION |
| 2026-11-11 | Reader review at 360/768/1280, fixes, screenshots | ~0.08 (12:31–12:36) | — | done; fixed a 3 px horizontal overflow at 360 px and two spacing issues (CSS only); touch targets ≥ 44 px; `app-reader-{360,768,1280}.jpg` 89/101/116 KB |
| 2026-11-11 | Product shot from the current app; `npm run shots:product`; manifest check | ~0.03 (12:36–12:38) | — | done; 41.2 KB WebP; the site unit test fails when the ladder screen's source changes without a new shot |
| 2026-11-11 | Disclosure sentence (eval report, its generator, 04) and the objection-scoring note | ~0.02 (12:37–12:38, test 15:05) | — | done; a test checks the generated report carries it verbatim |
| 2026-11-11 | Cloudflare Pages prep: `_headers` ×2, `scripts/pages-serve.ts`, CSP e2e ×2, `16_deploy.md` | ~0.08 (15:05–15:10) | — | done; no `'unsafe-inline'`/`'unsafe-eval'`; the site needs 3 sha256 hashes for Astro's inline blocks; the poster's style attributes became a class; nothing deployed |
| 2026-11-11 | Docs 02, 04, 09, README, this log; final checks | (see the B1.1b report) | — | 08 not changed: no product copy changed |

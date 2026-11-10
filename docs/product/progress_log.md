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
Session total so far: ~0.5 h [CALCULATION: 01:38–01:41, 02:28–02:46, 02:58–03:02 and 03:04–03:07, rounded up]. Planned for Phase A: 34 h [EVIDENCE: docs/product/03_scope_and_cut_line.md]. The gap is mostly your review time, which this column does not count.

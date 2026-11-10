# 03 · Scope, phases and cut line

Draft v0.3 (solo, no fixed deadline; quality over speed). Hours are for one developer using AI-assisted coding [HYPOTHESIS]. Every phase is capped at ~40 h and **ends with a demo that can be shown on its own**. There is no dated progress checkpoint (D9, approved 2026-11-10).

## The full value loop (target after Phase D)
```
S1 Deal setup → S2 Price ladder (+S3 benchmark) → paste client reply → S4b Analyse
     → S5 Reply options → S6 Draft (template fallback) → S7 Evidence log visible throughout
     → user logs outcome → S8 Debrief (+S14 consented feedback)
```

## Phases
Order: A → A2 → B1 → B2 → C → D → SC → E. Stack per [09_architecture.md](09_architecture.md) (option B). Re-estimated for D8 (comfortable with React/Three.js/GSAP) on 2026-11-10; the change log is in [10_roadmap_update.md](10_roadmap_update.md) [HYPOTHESIS: all hours].

| Phase | Builds | Hours (services + UI) | Exit demo (what can be shown) | Exit criteria |
|---|---|---|---|---|
| **A · Honest numbers** | S1, S2, S7, S13 + app shell; monorepo, CI, Cloudflare Pages | 22 + 6 (shell) + 6 (repo, CI, hosting) = **34** | Enter a deal → floor/target/opening appear with formula traces and CALCULATION labels; evidence log; delete-all | price-ladder outputs match ≥10 hand-worked examples exactly; no unlabelled number can render (test) |
| **A2 · Design language + hero scene** | `packages/tokens` (colour, type, spacing), the ladder as a flat app component, the showcase hero ladder scene (real engine numbers), its poster + reduced-motion fallback | 5 (tokens) + 3 (app ladder) + 9 (hero scene) + 3 (fallback, budget check) = **20** | Scroll the hero: weights drop, the floor rung rises to the engine's value; same page with reduced motion and with WebGL off shows the static version; the app's ladder uses the same tokens | hero within budget (≤ 300 KB initial, ≤ 1.5 MB scene) on the Lighthouse mobile profile; labels are HTML and visible at the end state (test); keyboard reaches everything [EVIDENCE: 08_experience_and_brand.md §8.3] |
| **B1 · Read the message (baseline)** | S4a gold set + eval harness, S4b parser + rule baseline (on-device) | 34 + 4 = **38** | Paste an English or Hinglish message → move, objection, amount, confidence, all on-device; show the baseline's scores with 95% bootstrap CIs and per-class support on the frozen self-authored test set | test split frozen and hashed; report says "self-authored, directional"; parser ≥95% exact amount match on the test split (A4). Test-retest is **not** an exit criterion (background task, see 04 §2) |
| **B2 · Learned on-device model** | S4c: TF-IDF (word + char n-grams, capped features) + logistic regression, weights as JSON, run in the Web Worker; hing-bert fine-tune as a research comparison only; eval report. No server inference in this phase (D10(b) waits for a legal review, [07_trust_safety_compliance.md](07_trust_safety_compliance.md) §4) | 7 (learned model) + 9 (hing-bert comparison) + 3 (report) + 2 (UI) = **21** | Side-by-side on the same frozen test: rules vs learned model vs hing-bert, with paired-bootstrap differences and CIs; the learned model runs on the phone | the learned model replaces the rules only if the lower 95% CI bound of (model − rules) macro-F1 is > 0; TS predictions match the Python model on the dev split (parity test); otherwise the rules stay and the report says so. hing-bert is reported, never shipped |
| **C · Plan the reply** | S3, S5, S6 + `/v1/draft` Cloudflare Worker | 24 + 6 + 3 (Worker, schema, CPU-limit check) = **33** | The full loop up to a draft: options with reasons, conditional concession, draft text; toggle the LLM off → templates still work | 0 invented numbers pass the post-check on an adversarial prompt set (size set in Phase C) |
| **D · Debrief and polish** | S8, S14, empty/loading/error/low-confidence states, accessibility basics | 13 + 15 = **28** | End-to-end on one illustrative scenario, including the debrief | every state designed; keyboard-only run-through passes |
| **SC · Showcase** (only after D) | the four remaining scenes: message sorted (S4b), crossroads (S5), ledger (S7), abacus (S8); posters; static fallback page | 4 × 7 (scenes) + 4 (posters, fallback) + 6 (performance + accessibility pass) = **38** | Scroll the full showcase on a mid/low-end Android phone: five scenes, every number from the real engine, labels readable throughout; then "Open the app" continues the same example deal | every scene within budget; ≥ 30 fps on the low tier or it falls back; reduced-motion and no-WebGL versions complete; axe-core clean [EVIDENCE: 08_experience_and_brand.md §8.3] |
| E · V2 (only after D) | S9 role-play, S10 late-payment kit, S11 cards once verified | separate plan, ≤40 h each | n/a | n/a |

Illustrative demo scenario (self-authored, labelled as such on screen): a developer quoted ₹45,000 for a website; the client replies in Hinglish asking for ₹30,000 [HYPOTHESIS: realistic, not observed].

## Cut order inside a phase (when a phase is running past ~40 h)
| Order | Cut | Fallback | What we say if asked |
|---|---|---|---|
| Out of V1 | S9 role-play, S10 late-payment, S11 compliance cards, S12 contract flags | n/a | "Designed, deliberately not built. Compliance cards stay hidden until a primary source and a review date exist. We won't show an unverified tax number." |
| 1st | S6 LLM drafting | fixed templates per option | "Wording is the least defensible part; the numbers and the plan are the value." |
| 2nd | Phase B2 (learned model S4c + hing-bert comparison) | rule baseline + "pick one" chips | "We report baseline vs model on a frozen test set, with confidence intervals, and ship the model only if it clearly wins." |
| 3rd | S3 benchmark | hidden | "One usable India source with small n. We show nothing rather than a fake market rate." |
| 4th | S8 debrief detail | concession counter only | "The debrief rules are deterministic; richer lessons come later." |
| In A2 / SC | a 3D scene | its poster + the same HTML copy and numbers | "The static version carries the same numbers and labels; motion is the extra." |
| Never cut | S1, S2, S5, S7 | n/a | the deterministic core is the honesty guarantee |

## Scope rule
A phase's scope is fixed when the phase starts. New ideas go to a backlog for the next phase, never into the current one.

## Decisions (owner: Sandarbh)
| # | Decision | Status | Recorded outcome / recommendation | Cost of being wrong |
|---|---|---|---|---|
| D1 | First user | **APPROVED 2026-11-10** as recommended | Indian solo web/app devs + UI/UX designers with Indian clients [HYPOTHESIS] | too broad → generic scenario, thin one-author gold set |
| D2 | Role-play (S9) out of V1 | **APPROVED 2026-11-10** | out of V1 (Phase E) | in → +14 h and LLM persona risk before the number-check is proven |
| D3 | LLM in V1 for drafting only, with template fallback | **APPROVED 2026-11-10** | yes; S6 never receives client message text | LLM → privacy disclosure + cost |
| D4 | Hinglish input vs output | **APPROVED 2026-11-10** | input analysis + optional Hinglish templates; LLM Hinglish drafts later | output quality is unmeasurable alone |
| D5 | Compliance cards hidden until verified | **APPROVED 2026-11-10** | hidden | shown → looks like advice even with a badge |
| D6 | CraigslistBargain as research-use training data | **APPROVED 2026-11-10** | yes, disclosed | drop → much less PRICE/PUSHBACK training data [EVIDENCE: docs/dataset-audit/AUDIT_REPORT.md §1] |
| D7 | Final name "MolBhav" | **APPROVED 2026-11-10** | keep for now | small while there is no public launch |
| D8 | Frontend | **APPROVED 2026-11-10** | comfortable with React, Three.js and GSAP; "just want the best product". Direction: an immersive, scroll-driven 3D showcase site (inspired by studio sites such as lusion.co, principles only) plus a calm, fast, accessible working app. Stack recommended in [09_architecture.md](09_architecture.md) | a mismatched stack slows every phase |
| D9 | Dated progress checkpoint? | **APPROVED 2026-11-10: none** | phases end in demos; no dated checkpoint | none: no external date to miss |
| D10 | Where message analysis runs | **APPROVED 2026-11-10** as recommended | (a) on-device by default; (b) opt-in, in-memory, unlogged server inference only if B2's model wins under the paired-bootstrap rule. Comparison in [02_service_catalogue.md](02_service_catalogue.md) | (b) early → ops + privacy duties before the model is proven |
| D11 | Label set | **APPROVED 2026-11-10** as recommended | ~300 self-authored messages; 6 learned classes + rule-decided ANCHOR/COUNTER and conditional/unconditional (see [04_research_integrity.md](04_research_integrity.md) §2.3) | 6 classes may hide a distinction a 7th label would catch; revisit after B1 |

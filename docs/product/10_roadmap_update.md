# 10 · Roadmap update (2026-11-10)

Change log for [03_scope_and_cut_line.md](03_scope_and_cut_line.md), which stays the single source of truth for phases. Solo, no fixed deadline, no dates. Tags: [EVIDENCE: path] · [HYPOTHESIS] · [GAP]. All hours are [HYPOTHESIS] for one person; re-estimate after Phase A from logged actuals.

## 1. Phases after this update
[HYPOTHESIS: all hours, for one person; re-estimate after Phase A]

| Order | Phase | Hours before | Hours now | Why it changed |
|---|---|---|---|---|
| 1 | A · Honest numbers | 34 | **34** | shell drops 12 → 6 (D8: comfortable with React); +6 for monorepo, CI, Cloudflare Pages [EVIDENCE: 09_architecture.md §2, §6] |
| 2 | **A2 · Design language + hero scene** (new) | n/a | **20** | tokens 5, app ladder 3, hero scene 9, fallback + budget check 3 |
| 3 | B1 · Read the message (baseline) | 38 | **38** | unchanged; gold set is not stack-dependent [EVIDENCE: 04_research_integrity.md §2.1] |
| 4 | B2 · Learned on-device model | 22 | **21** | 2026-11-10: D10(b) endpoint (4 h) moved out until a legal review [EVIDENCE: 07_trust_safety_compliance.md §4]. 2026-11-11: the shipped candidate is now an on-device TF-IDF + logistic-regression model with JSON weights (7 h); hing-bert stays as a research comparison (9 h, no integration) [EVIDENCE: 03_scope_and_cut_line.md] |
| 5 | C · Plan the reply | 30 | **33** | +3 for the `/v1/draft` Worker and its schema/CPU checks [EVIDENCE: 09_architecture.md §4, §6] |
| 6 | D · Debrief and polish | 28 | **28** | unchanged |
| 7 | **SC · Showcase** (new, after D) | n/a | **38** | 4 scenes × 7, posters + fallback 4, performance + accessibility pass 6 [EVIDENCE: 08_experience_and_brand.md §8] |
| 8 | E · V2 | separate | separate | unchanged |
**Total through SC ≈ 212 h** [CALCULATION: 34 + 20 + 38 + 21 + 33 + 28 + 38]. Every phase is ≤ 40 h and ends in a demo.

Why A2 comes early but SC comes late [HYPOTHESIS]: A2 sets the design language once (so later UI isn't redone) and gives a showable hero; the rest of the showcase only makes sense once the services it shows exist, and it must never crowd out the product.

## 2. Ten weakest points of the plan (self-check)
| # | Weakness | Why it's weak | What we do about it |
|---|---|---|---|
| 1 | No user evidence, by decision | every user need is a hypothesis [EVIDENCE: 01_product_brief.md] | ₹0 core; consented post-launch metrics [EVIDENCE: 06_market_and_business.md §8] |
| 2 | Self-authored gold set | circular; ~60 test items; ±12-point CIs [EVIDENCE: 04_research_integrity.md §2.2] | state as directional; never as accuracy |
| 3 | A6, A7, A11 all failed to find sources | Hinglish, late payment and first-user choice are now unsupported as pitch claims [EVIDENCE: 06_market_and_business.md §5] | removed from claims [EVIDENCE: 11_claims_register.md] |
| 4 | No legal review | DPDP role for on-device software and for D10(b) unknown [EVIDENCE: 07_trust_safety_compliance.md §2, §4] | D10(b) blocked until reviewed |
| 5 | DPDP Rules read only via a secondary source | dates and duties UNVERIFIED [EVIDENCE: 07_trust_safety_compliance.md §1] | fetch gazette (Sandarbh, 2 h) |
| 6 | Showcase is expensive for a solo developer | 58 h of 212 h is A2 + SC [CALCULATION: 20 + 38] | SC after D; 3D is the first thing cut [EVIDENCE: 03_scope_and_cut_line.md cut order] |
| 7 | Performance budget untested on a real device | budgets are guesses [EVIDENCE: 08_experience_and_brand.md §8.3] | pick a real low-end Android phone in A2 [GAP] |
| 8 | Market sizing spans 250× | inputs are guesses [EVIDENCE: 06_market_and_business.md §4] | not used for any claim |
| 9 | LLM provider, cost and Worker CPU fit unknown | drafting cost unpriced; 10 ms CPU limit untested [EVIDENCE: 09_architecture.md §6] | templates work without it; test in C |
| 10 | Bus factor one, hours unvalidated | one person; estimates not yet checked against actuals | log Phase A actuals; re-plan [EVIDENCE: 05_judge_qa.md T23, T24] |

# 11 · Claims register

Every claim we plan to make in the showcase, app, demo or posts, its evidence, and what proves it. Solo, no user research. Tags: [EVIDENCE: path] · [HYPOTHESIS] · [GAP]. Status: **KEEP** (provable now or by a named test), **KEEP-WHEN** (true only after the named test passes; must not be said before), **REWRITE** (original was unprovable; safe version given), **REMOVE** (never say).

## 1. Product claims
| # | Claim (exact wording) | Evidence / proof | Status |
|---|---|---|---|
| C1 | "Every number shows its working." | engine trace + "no unlabelled number renders" test (Phase A exit) [EVIDENCE: 03_scope_and_cut_line.md] | KEEP-WHEN Phase A passes |
| C2 | "Your floor, target and opening are calculated from your own inputs." | engine spec + ≥10 hand-worked examples [EVIDENCE: 04_research_integrity.md §3 A2] | KEEP-WHEN Phase A passes |
| C3 | "Your client's message is read on this device. It is not sent to us or to any AI service." | Playwright request-interception test, all toggles off [EVIDENCE: 09_architecture.md §8] | KEEP-WHEN the test passes in B1 |
| C4 | "AI drafts never contain a number MolBhav didn't calculate." | post-check + adversarial set (A5) [EVIDENCE: 04_research_integrity.md §3] | KEEP-WHEN Phase C passes |
| C5 | "Works without AI." | templates path with the LLM toggled off [EVIDENCE: 03_scope_and_cut_line.md Phase C exit] | KEEP-WHEN Phase C passes |
| C6 | "Never suggests going below your floor unless you choose to." | property test [EVIDENCE: 07_trust_safety_compliance.md §8] | KEEP-WHEN Phase C passes |
| C7 | "Understands English and Hinglish messages." | — | **REWRITE** → "Accepts English and Hinglish (Roman script) messages; scores on our self-authored test set: [macro-F1, 95% CI]." [EVIDENCE: 04_research_integrity.md §5] |
| C8 | "Reads ₹ amounts like 50k, 1.5L and ₹1,20,000." | parser tests; ≥95% exact on test (A4) | KEEP-WHEN B1 passes |
| C9 | "Our model is X% accurate." | — | **REMOVE**: self-authored, directional only [EVIDENCE: 04_research_integrity.md §5] |
| C10 | "The learned model beats the rules." (the on-device TF-IDF + logistic-regression model; hing-bert is never claimed as shipped) | paired bootstrap, lower CI bound of Δ > 0 [EVIDENCE: 04_research_integrity.md §2.2] | KEEP-WHEN B2 passes; always with "on our self-authored test set" and the CI |
| C11 | "Shows what you gave away in each deal." | debrief rules + tests (Phase D) | KEEP-WHEN Phase D passes |
| C12 | "Free." | free core runs on-device; hosting ₹0 [EVIDENCE: 09_architecture.md §6] | KEEP for the core; Pro is a hypothesis [EVIDENCE: 06_market_and_business.md §3] |

## 2. Market and user claims
| # | Claim | Evidence | Status |
|---|---|---|---|
| M1 | "Freelancers told us…" / "validated with freelancers" | no research exists [EVIDENCE: 01_product_brief.md] | **REMOVE** |
| M2 | "Indian clients negotiate in Hinglish." | A6 found no citable source [EVIDENCE: 06_market_and_business.md §5] | **REMOVE** → product copy may say "accepts Hinglish" (C7) |
| M3 | "Indian freelancers are paid late." | A7: no India-freelancer source [EVIDENCE: 06_market_and_business.md §5] | **REWRITE** → "India runs a government portal for delayed payments to micro and small enterprises, with about 2.57 lakh applications filed (MSME Samadhaan, accessed 2026-11-10)." Only where S10 is discussed (V2) |
| M4 | "Web/app devs and designers are the biggest freelance group." | A11: no primary source | **REWRITE** → "We started with developers and designers because we can write realistic examples for them." |
| M5 | "India has 77 lakh gig workers, so a huge market." | secondary only; mostly not our user [EVIDENCE: 06_market_and_business.md §4] | **REMOVE** as a market claim |
| M6 | "84% of concessions are unconditional" (any version) | biased heuristic, adjacent domain [EVIDENCE: 04_research_integrity.md §3 A1] | **REMOVE** |
| M7 | "No other tool does this." | 5-product teardown only [EVIDENCE: 06_market_and_business.md §1] | **REWRITE** → "Of the tools we checked, none prepares a seller's reply privately with INR and Hinglish input." with the list |
| M8 | "Market rate for your work is ₹X." | one benchmark, small n [EVIDENCE: docs/dataset-audit/cards/so_survey_2026.md] | **REWRITE** → "Developers in India report ~₹X/yr (Stack Overflow Survey 2026, n=…), ESTIMATE", hidden if n < 30 |

## 3. Trust and compliance claims
| # | Claim | Evidence | Status |
|---|---|---|---|
| T1 | "DPDP compliant." | no legal review; Rules not read in primary [EVIDENCE: 07_trust_safety_compliance.md §1] | **REMOVE** |
| T2 | "We don't store your client's messages." | no server path stores text; on-device only by default [EVIDENCE: 07_trust_safety_compliance.md §4] | KEEP-WHEN C3's test passes |
| T3 | "TDS on professional fees is X%." | card UNVERIFIED [EVIDENCE: docs/dataset-audit/compliance/tds_professional_technical_fees.md] | **REMOVE** until the card is VERIFIED per [07_trust_safety_compliance.md](07_trust_safety_compliance.md) §7 |
| T4 | "Not legal or tax advice." | policy | KEEP |
| T5 | "Secure." | no audit | **REWRITE** → "Your deals stay on your device; there is no account to hack." (KEEP-WHEN A + C3 pass) |

## 4. Showcase claims
| # | Claim | Evidence | Status |
|---|---|---|---|
| S1 | numbers in scenes | computed by `packages/engine` for a labelled example deal [EVIDENCE: 09_architecture.md §2] | KEEP; example labelled "made up" |
| S2 | "Loads fast on any phone." | — | **REWRITE** → "Built to a budget of ≤ 300 KB before 3D, with a static version." (KEEP-WHEN the Lighthouse budget passes) |

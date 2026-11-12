# 02 · Service catalogue

Draft v0.2 (solo, no fixed deadline). Effort = hours for **one developer using AI-assisted coding**, including tests [HYPOTHESIS: estimates, not measured; re-estimate after Phase A using its actual hours]. Phases are defined in [03_scope_and_cut_line.md](03_scope_and_cut_line.md). Each phase is capped at ~40 h and ends with a showable demo.

Claim labels used by every service: **FACT** (sourced) · **CALCULATION** (engine output from user inputs) · **ESTIMATE** (benchmark with source + n) · **USER DECISION** (the user typed/confirmed it) · **RECOMMENDATION** (rule-based suggestion, with its reason).

## Services
| # | Service | User-visible outcome | Inputs | Outputs | Intelligence | Data it depends on | Guardrails | Failure behaviour (what the user sees) | Release · phase | Effort h |
|---|---|---|---|---|---|---|---|---|---|---|
| S1 | Deal setup | "My deal is written down" | client type, deliverables, timeline, payment terms, quoted price, currency/unit | Deal record | deterministic (form + validation) | none | required fields; INR default; units explicit (fixed / hour / month) | inline field errors; nothing lost on refresh | V1 · A | 5 |
| S2 | Price ladder | Floor, target and opening price, each with "how we got this" | target monthly income, billable hours, costs, days estimate, optional buffer % | 3 numbers + formula trace, labelled CALCULATION | deterministic | user inputs only | no number without a formula; min/max sanity checks; floor never shown as a "market rate"; hand-verified worked examples as tests | missing inputs → "Add hours to calculate". No guessed default | V1 · A | 8 |
| S3 | Benchmark hint | "Developers in India report ~₹X/yr (n, source)" | role, India | ESTIMATE row with source, year, n | retrieval (static table) | SO Survey 2026 [EVIDENCE: docs/dataset-audit/cards/so_survey_2026.md]. NOT the Mendeley set [EVIDENCE: cards/india_tech_career_1m.md] | label ESTIMATE; show n; annual → hourly conversion shown as CALCULATION with its assumptions | hidden if n < 30 for the segment: "No reliable benchmark" | V1 · C | 4 |
| S4a | Gold set + eval harness | A frozen, documented test set and a score report with confidence intervals | self-authored messages, guidelines | labelled JSONL (train/dev/frozen test), eval script (bootstrap CIs, per-class support), report | human (author) + disclosed LLM second annotator | own messages only [GAP: not written]; protocol and bottom-up hours in [04_research_integrity.md](04_research_integrity.md) §2 | test split hashed and frozen before any training; never trained on; results reported as directional | n/a | V1 · B1 | 25 (blocking; +3 h test-retest in the background) |
| S4b | Message analyser: parser + rule baseline (on-device; amount formats incl. ₹/rs/inr, k, L/lakh/lac, cr, and the thousand words hazaar/hajar/hazar, e.g. "30 hazaar" = ₹30,000) | Paste the client message → "PUSHBACK · BUDGET objection · ₹30,000 fixed" + confidence | message text (English/Hinglish, Roman script) | move (6 learned classes + rule-decided ANCHOR/COUNTER and conditional/unconditional; D11 approved), objection (6), amount/currency/unit, confidence | rule baseline + rule-based amount parser, **runs on the device; message text does not leave it** | auxiliary: CraigslistBargain, CaSiNo [EVIDENCE: docs/dataset-audit/AUDIT_REPORT.md §2, label_mapping.csv] | low confidence → "Not sure: pick one" chips (USER DECISION); manual move picker always available | low confidence → user picks; parse failure → "Couldn't find an amount: type it" | V1 · B1 | 9 (parser 5, baseline 4) |
| S4c | Message analyser: learned model (on-device) | same as S4b, better scores if it wins | message text | same as S4b | a learned on-device classifier: TF-IDF over word 1–2-grams + char 2–4-grams, vocabulary capped (≤ 4,000 features), multinomial logistic regression trained in Python, weights + vocabulary + idf exported as JSON (target ≤ 250 KB), inference in the same Web Worker as S4b; hing-bert fine-tune kept as a **research comparison only** (reported, not shipped) [EVIDENCE: cards/hingbert_models.md] [HYPOTHESIS: sizes and caps] | as S4b | replaces the rule baseline only if the paired-bootstrap rule in 04 §2 says it wins; message text never leaves the device. A server path (D10(b)) is not needed for this model and stays blocked until a legal review | weights fail to load → rule baseline, with a "basic analysis" badge | V1 · B2 | 16 (learned model 7: train 2, JSON export 1, TS inference + Python parity test 3, wiring 1; hing-bert research comparison 9) |
| S5 | Response planner | 2–3 options: "Hold price, add value", "Concede ₹X **if** 50% upfront", "Walk away politely" | deal record, S2 numbers, S4b result | options with reason (RECOMMENDATION); numbers (CALCULATION) | deterministic strategy table (move × objection → tactics); concession sizes from S2 | S2, S4b | never below the floor without a USER DECISION; ≥1 conditional option; no unconditional concession as the default | S4b unknown → generic options + "tell us what they said" | V1 · C | 10 |
| S6 | Draft wording | Editable reply text (English, optionally Hinglish; see D4) | chosen option + engine numbers + deliverable type. **Never the client's message text** | draft text | LLM, slot-filled; fixed templates as fallback | S5 | numbers injected from the engine; post-check rejects any number/₹ not from the engine; no legal/tax claims; we never send | LLM off/down or check failed → template text | V1 · C | 10 |
| S7 | Evidence log | Side panel listing every claim with its label and source | outputs of S2–S6 | labelled claims | deterministic | all above | anything unlabelled cannot render | n/a | V1 · A | 5 |
| S8 | Debrief | "You conceded ₹8,000 (2 unconditional, 1 conditional). Next time: ask for upfront first." | final price, moves logged in the session | concession summary + 1 lesson (RECOMMENDATION) | deterministic | session log | lesson from a fixed rule set, not invented | no outcome → "Log how it ended to see your debrief" | V1 · D | 7 |
| S13 | Storage & privacy | "Your deals stay on your device" + delete-all | n/a | local storage | deterministic | none | **client message text never leaves the device by default** (S4b is on-device). Two disclosed, opt-in exceptions: (1) if B2's model wins (D10) and the user turns on "better analysis", the text goes to our inference endpoint, processed in memory, not logged or stored; (2) S6 sends only the option + engine numbers to the LLM provider, never message text | n/a | V1 · A | 4 |
| S14 | Consented feedback & outcome logging | "Was this label right?" and "How did it end?" (opt-in) | user corrections, outcome | counts only; message text never collected without a separate explicit consent | deterministic | none | off by default; anonymised aggregates; delete on request | n/a | V1 · D | 6 |
| S9 | Practice client (role-play) | Rehearse against a simulated client | self-authored scenarios | simulated turns | LLM with scripted persona + S4b | self-authored scenarios [GAP] | can't produce figures outside the scenario; marked "simulation" | scripted fallback turns | V2 · E | 14 |
| S10 | Late-payment kit | Reminder ladder (day 0 / 7 / 15 / 30), polite → firm | invoice date, amount, terms | dated reminders | deterministic + templates | MSME claims depend on UNVERIFIED cards [EVIDENCE: docs/dataset-audit/compliance/msme_45_day_payment.md] | no legal-threat language; MSME line only when the card is VERIFIED | card unverified → line omitted | V2 · E | 8 |
| S11 | Compliance reference cards | "TDS on professional fees: X% (s.…, effective…, source, reviewed on…)" | none | card | retrieval of reviewed text | 3 cards, all UNVERIFIED [EVIDENCE: docs/dataset-audit/compliance/] | shown only if VERIFIED + reviewer + review date; "not advice" banner | hidden; settings lists "pending verification" | V2 · E (only once verified) | 3 + verification time [GAP] |
| S12 | Contract clause flags | Highlight risky clauses | contract text | flags | ML/retrieval | US contract sets only (CUAD) [EVIDENCE: cards/contract_datasets.md] | "not legal advice" | n/a | research only, not planned | n/a |

**Build status, B1.1 (2026-11-11).**
- **S4a**: the toolchain is built: guidelines v0.2 (owner-approved 2026-11-11, B1.1b), schemas and validator, the seeded card generator, local writing and blind-labelling tools, the split-and-freeze script (not run), an LLM second-annotator skeleton (provider not chosen) and unit-tested metrics [EVIDENCE: docs/product/04_research_integrity.md §2 "Tooling status"].
  - The gold set itself is not written: 0 of 300 messages [GAP].
  - B1.1b: both tools show one neutral quote line from the card ("Freelancer's quote so far: ₹X" / "No quote sent yet"), and each label stores it; the quote-dependent rules (J5, J7) read the same fact from the deal state [EVIDENCE: ml/gold/GUIDELINES.md §0; packages/analyser/src/rules.ts].
- **S4b**: the amount parser and the rule baseline are built in `packages/analyser`, running in a Web Worker [EVIDENCE: packages/analyser/src/amount.ts, rules.ts, serve.ts].
  - The parser returns exact bigint rupees or marks the amount ambiguous.
  - The "Read your client's reply" screen is in the app, reached from Welcome and from the ladder [EVIDENCE: apps/app/src/screens/Reader.tsx].
  - The screen has the manual picker, the low-confidence and no-amount states, and every output is an ESTIMATE with its confidence and "read by rules on your device; may be wrong".
  - The extended privacy test passes: the pasted text appears in no request, and a Worker is created [EVIDENCE: apps/app/e2e/privacy.spec.ts].
  - **Not scored**: there is no gold test set yet, so the screen shows no accuracy figure.
  - The confidence threshold (0.5) and the rule weights are first guesses [HYPOTHESIS], to be tuned on dev only.
- Hours were not timed, so the effort column is unchanged.

**Build status, C1 (2026-11-11).** C1 is the on-device half of Phase C: S5 and S6 with templates only, no LLM.
- **S5**: `packages/planner` turns the ladder, the deal state and the reader's confirmed move into ranked options from the decision table in [18_planner_rules.md](18_planner_rules.md) [EVIDENCE: packages/planner/src/plan.ts].
  - Every option shows its figures (CALCULATION), the reason (RECOMMENDATION), the risk, and what it asks back.
  - No suggested price is below the floor; the floor is shown to the user only and never enters a draft. Property tests check this over 2,500 random plans per rule [EVIDENCE: packages/planner/test/properties.test.ts].
  - The "Your options" screen is reached from the reader [EVIDENCE: apps/app/src/screens/Options.tsx].
- **S6**: fixed templates in English and Roman Hinglish, polite and firm (44 templates), filled only with engine numbers [EVIDENCE: packages/planner/src/templates.ts].
  - S6 receives a `DraftRequest` with no free-text field; the client's message never reaches it (a type test and a unit test) [EVIDENCE: packages/planner/test/draft.test.ts].
  - The user can edit the draft. `checkDraft` re-checks every edit and fails closed; "All numbers in this draft come from your ladder" shows only when the check passed [EVIDENCE: apps/app/src/screens/Draft.tsx].
  - The adversarial set: 404 cases, 0 invented numbers passed (04 §3, A5).
  - The LLM path is **not built**: no toggle, only a documented extension point (09 §4). It is C2.
  - The saved draft is kept in IndexedDB with the deal and removed by delete-all; the client's message is never stored [EVIDENCE: apps/app/e2e/privacy.spec.ts].
- All template and option wording is [HYPOTHESIS], listed for review in [17_c1_review_checklist.md](17_c1_review_checklist.md).

**V1 total ≈ 109 h of services** across Phases A–D (A 22 · B1 34 · B2 16 · C 24 · D 13; 2026-11-11: B2 now = on-device learned model + hing-bert research comparison), plus UI/demo polish per phase (see 03) [HYPOTHESIS].

## Where does message analysis run? (D10, APPROVED 2026-11-10: option (a) by default, (b) opt-in only if B2 wins)
| | (a) On-device rule baseline only | (b) Server inference, in memory, no logging, disclosed |
|---|---|---|
| Privacy | message text never leaves the device | text leaves the device on opt-in; we become a processor of possibly personal data (DPDP duties: notice, consent, purpose limit; detail in 07) [HYPOTHESIS: to check against the Act text] |
| Quality | rules, or the on-device learned model (S4c) if it wins; hing-bert stays research (2026-11-11) | hing-bert could reach users, if it wins |
| Engineering (solo) | no server, no ops | a hosted endpoint, log hygiene (request bodies excluded from logs), rate limits, uptime: +4 h build + ongoing ops [HYPOTHESIS] |
| Cost | ₹0 | hosting cost [GAP: not priced] |
| Failure mode | none new | endpoint down → silent fallback to (a) |
| Third option, noted | (c) run a quantised hing-bert in the browser: privacy of (a) with the quality of (b), but feasibility, size and speed are untested [GAP]. Superseded 2026-11-11: the shipped learned model is the small TF-IDF + logistic-regression classifier (S4c), which runs on-device; hing-bert stays a research comparison | |

**Recommendation:** start with **(a)** as the default in V1. Switch on (b) as an opt-in only if, at the end of B2, the model beats the baseline under the paired-bootstrap rule (04 §2). If it doesn't, (b) adds risk for no gain. Cost of being wrong: choosing (b) early adds ops and privacy duties before we know the model helps; choosing (a) forever leaves the model unused even if it wins.

## We will NOT provide
| Not provided | Why |
|---|---|
| Auto-negotiation or sending messages on the user's behalf | principle: prep/practice/debrief only; liability; trust |
| Legal advice, contract drafting, enforcement steps | not qualified; high harm if wrong |
| Tax computation, filing, GST registration guidance | rules unverified [EVIDENCE: docs/dataset-audit/compliance/]; not qualified |
| "Market rate" as FACT | one usable benchmark, small India-freelance n [EVIDENCE: cards/so_survey_2026.md] |
| Synthetic or scraped salary data | Mendeley set is synthetic; Kaggle/Upwork terms risk [EVIDENCE: cards/india_tech_career_1m.md, cards/kaggle_upwork.md] |
| Debt collection or threatening messages | escalation and legal risk |
| High-risk domains: employment salary, rent, medical, legal disputes | out of scope by principle |
| Automatic reading of WhatsApp/email | privacy; DPDP consent burden [HYPOTHESIS: detailed later in 07_trust_safety_compliance.md] |
| Storing or logging client message text on our servers; sending client message text to an LLM provider | message text stays on-device by default; the only server path is the opt-in, in-memory analyser (D10(b)), and S6 never receives message text |
| Manipulation tactics (fake deadlines, invented competing offers) | ethics; would teach dishonesty |
| Any claim that "users told us" or that the product is validated with freelancers | no user research exists or will be gathered [EVIDENCE: 04_research_integrity.md] |

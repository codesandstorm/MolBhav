# 04 · Research integrity (solo, no user research)

Draft v0.2. Tags: [EVIDENCE: path] · [HYPOTHESIS] · [GAP]. External facts need URL + access date or are marked UNVERIFIED.

**Ground truth about our evidence:** there are no interviews, surveys, personas, usability tests or real client messages, and none will be gathered before launch [EVIDENCE: repo contents; project brief of 2026-11-10]. Everything about users is a HYPOTHESIS until post-launch consented data exists.

## 1. Evidence we CAN gather alone
| Kind | What | Status |
|---|---|---|
| Audit data (measured) | licences, counts, label mappings, synthetic-data detection for 17 public datasets | [EVIDENCE: docs/dataset-audit/AUDIT_REPORT.md, catalogue.csv] |
| Behaviour in adjacent domains | **weak support in an adjacent domain only**: a keyword heuristic on CraigslistBargain counts 3,295 "unconditional" vs 627 "conditional" price moves. The split is **biased upward by construction** (see A1) | [EVIDENCE: docs/dataset-audit/cards/craigslist_bargains.md]. US marketplace goods, not Indian freelancers. Not for any pitch |
| Benchmarks | India developer compensation, SO Survey 2026 (ESTIMATE, India-freelance INR n=73) | [EVIDENCE: cards/so_survey_2026.md] |
| Published reports | Indian freelancing reports, payment-delay statistics, Hinglish usage studies: to be searched and cited with URL + date | [GAP]: none fetched yet; none may be quoted until fetched |
| Primary legal text | TDS / GST-LUT / MSME sections | [GAP]: all UNVERIFIED [EVIDENCE: docs/dataset-audit/compliance/] |
| Hand-verified calculations | price-ladder worked examples done by hand (spreadsheet) and compared to engine output. Later, compliance-card examples against official worked examples, once the sources are fetched | [GAP]: to build in Phase A |
| Engineering evidence | unit/property tests, eval reports, the adversarial LLM number-check set | [GAP]: built per phase |

## 2. Gold-set plan for one author
**Principle:** every message is **self-authored by the developer, flagged `source: self_authored`, and never presented as a real client message.** Public datasets are training-only and never enter the test split [EVIDENCE: docs/dataset-audit/AUDIT_REPORT.md].

| Step | Protocol | Output |
|---|---|---|
| 1 Guidelines | write labelling guidelines for the move labels (7, or 6 + rules per D11), 6 objection types and the amount/currency/unit fields, with 2 examples per label and tie-break rules | `ml/gold/GUIDELINES.md` (v-numbered) |
| 2 Prompt cards | a seeded script (seed 42) generates cards: scenario × intended move × objection × language (English / Roman Hinglish) × amount format (₹45,000 / 45k / 45 hazaar (also hajar, hazar) / 1.5L / per hour / none) | cards file; the coverage grid is visible |
| 3 Writing | write one message per card in your own words, including deliberately ambiguous ones (≈15%). Target ≈300 messages (§2.3) [HYPOTHESIS: size; revisit after the first 60]; cards stratified so every learned class has ≥10 test items | messages JSONL with `source: self_authored`, `card_id` |
| 4 Blind label pass 1 | label in shuffled order **without seeing the card**, so labels reflect the text and not the intent | labels v1 |
| 5 Split and freeze | stratified split (seed 42): train 60% / dev 20% / **test 20% (≈60 at 300 messages)**. Hash the test file (sha256) and record it **before any model training**. The test set is never used for training or for tuning thresholds | `test.jsonl` + hash in the eval report |
| 6 Test-retest (**background task**) | relabel everything after a gap of ≥14 days, shuffled, blind to pass 1. It runs whenever the gap has passed and **never blocks a phase exit**; κ is added to the report when it exists | intra-rater Cohen's κ per field |
| 7 LLM second annotator (disclosed) | one named model, version, date, temperature 0, guidelines only (no cards, no pass-1 labels), prompt stored with its hash | author–LLM Cohen's κ per field; confusion matrix |
| 8 Adjudication | the author resolves disagreements; every change is logged with a reason; the final label = adjudicated label | adjudication log |
| 9 Card-vs-label check | rate of label ≠ intended move | a measure of how ambiguous the writing is |

**Tooling status (B1.1, 2026-11-11).** The tools for every step above exist; no gold message has been written, labelled, split or scored [GAP: writing not started]. Code in `packages/gold`, data in `ml/gold/` [EVIDENCE: packages/gold/, ml/gold/]:

| Step | Tool | Status |
|---|---|---|
| 1 | `ml/gold/GUIDELINES.md` | **v0.1 DRAFT**: awaiting the owner's approval of judgement calls J1–J13 and of COMPETITOR as the sixth objection type [HYPOTHESIS] |
| 2 | `npm run gold:cards` → `ml/gold/cards/cards.jsonl` (300 cards, seed 42) + `COVERAGE.md` | built; a test checks it is deterministic and that every learned class gets ≥ 10 expected test items |
| 3 | `npm run gold:write` (local page on 127.0.0.1:4410) → `ml/gold/data/messages.jsonl` | built, not used yet; records writing seconds per message |
| 4, 6 | `npm run gold:label` (127.0.0.1:4411; `-- --pass v2` for the retest, offered only ≥ 14 days after v1) | built, not used yet; shows the text only, shuffled; records labelling seconds |
| 5 | `npm run gold:split` (stratified 60/20/20, seed 42; writes the test sha256 to `ml/gold/eval/frozen.json` and `EVAL_REPORT.md`) | built, **not run**; refuses to run twice; a test fails if `test.jsonl` no longer matches the hash |
| 7 | `npm run gold:annotate` | skeleton only: the provider is not chosen, so it fails closed before reading anything [GAP: provider decision] |
| 2.2 metrics | `packages/gold/src/metrics.ts` (κ per field, confusion, macro-F1, accuracy, support with "too few to score", Wilson interval, bootstrap and paired bootstrap, 2,000 resamples, seed 42) | unit-tested against hand-computed values |
| checks | `npm run gold:validate` (schema, `source: "self_authored"` only, duplicate ids) | built; a test rejects any `fixture` row under `ml/gold/` |

The S4b rule baseline and amount parser were written from the guidelines and the card formats only, before any gold message existed [EVIDENCE: packages/analyser/src/rules.ts, packages/analyser/src/amount.ts]. Their weights may later be tuned on the dev split only, never on test.

### 2.1 Bottom-up hours for S4a [HYPOTHESIS: per-item times are guesses; re-measure on the first 60 messages]
Assumed rates: writing 1.5 min/message (Hinglish and ambiguous ones included in the average), blind labelling 0.6 min/message per pass, ~25% author–LLM disagreements at 2 min each.
| Task | 240 msgs | 300 msgs | 400 msgs |
|---|---|---|---|
| Guidelines v1 + revisions | 4 | 4 | 4 |
| Card generator script (seeded, coverage grid) | 2 | 2 | 2 |
| Writing messages | 6.0 | 7.5 | 10.0 |
| Blind label pass 1 | 2.4 | 3.0 | 4.0 |
| LLM second-annotator pass (script, run, store prompt hash) | 2 | 2 | 2 |
| Adjudication | 2.0 | 2.5 | 3.3 |
| Split, freeze + hash, eval harness with bootstrap | 4 | 4 | 4 |
| **Blocking total** | **22.4** | **25.0** | **29.3** |
| Test-retest pass 2 (background, non-blocking) | 2.4 | 3.0 | 4.0 |

The rows "Guidelines", "Card generator", "Split, freeze + hash, eval harness" and the LLM script are now built (B1.1); their hours were not timed. The writing and labelling hours are **re-estimated only from the tools' own timing logs** (`npm run gold:timing` compares measured minutes per message with the 1.5 and 0.6 assumed here), never re-guessed. No timing exists yet [GAP: first 60 messages].

### 2.2 Evaluation protocol (results are directional)
- Report **per-class support** (test count per label) next to every per-class score; any class with < 10 test items is flagged "too few to score".
- Metrics: macro-F1 and accuracy for moves and objections; exact-match rate for amounts (with a Wilson 95% interval); confusion matrices.
- **Bootstrap CIs**: 2,000 resamples of the test set (seed 42), 95% percentile intervals for every headline metric.
- **Decision rule (replaces the 5-point rule)**: paired bootstrap on the same resamples, Δ = macro-F1(model) − macro-F1(baseline). The model ships only if the lower bound of the 95% CI of Δ is > 0. Otherwise the baseline ships and the report says "no demonstrated improvement".
- Wording: every result is stated as "on N self-authored test messages, directional". Never "accuracy" without that qualifier.
- Scale check [HYPOTHESIS: normal approximation, accuracy ≈ 0.7]: the 95% half-width is ≈ ±13 points at n=48, ±12 at n=60, ±10 at n=80. That is why the earlier 5-point rule was too noisy.

### 2.3 Larger gold set vs smaller label set (D11, APPROVED 2026-11-10: option S)
| | L: ~400 messages, 7 learned move labels | S: ~300 messages, 6 learned classes + 2 rule-decided splits |
|---|---|---|
| Learned classes | ANCHOR, COND_CONCESSION, UNCOND_CONCESSION, REJECT_OR_COUNTER, INFO_REQUEST, ACCEPT, OTHER | PRICE_POSITION (a number stated or asked), PUSHBACK (rejects/objects, no new number), CONCESSION, INFO_REQUEST, ACCEPT, OTHER |
| Rule-decided | none | ANCHOR vs COUNTER from deal state (has a quote been sent?); conditional vs unconditional from clause rules ("if/agar…toh", "provided", "in exchange"), evaluated separately on the CONCESSION subset |
| Test items per class | ≈80 / 7 ≈ 11 | ≈60 / 6 = 10 |
| 95% half-width (accuracy) | ≈ ±10 pts | ≈ ±12 pts |
| Blocking hours (§2.1) | 29.3 | 25.0 |
| Validity | asks one message to settle context-dependent distinctions | removes two distinctions a single message often cannot settle |

**Recommendation: S.** At similar per-class support it costs ~4 h less, and it moves two judgements to transparent rules that can be unit-tested. Cost of being wrong: S's conditional-concession rules may miss phrasings, which the separate CONCESSION-subset score will show; L buys slightly tighter intervals but keeps labels a single message often can't support. The mapping in `docs/dataset-audit/label_mapping.csv` maps onto S by merging columns [HYPOTHESIS: to re-run in B1].

**What this proves**
- The label scheme can be applied consistently by its author over time (test-retest κ).
- How far a disclosed LLM, given only the guidelines, agrees with the author (author–LLM κ).
- How well the model reproduces the author's labels on held-out, author-written text, compared with a rule baseline.

**What it does not prove**
- Accuracy on real client messages, or on other people's writing styles and Hinglish varieties.
- That the label scheme matches how freelancers or clients think.
- Human inter-annotator agreement (there is only one human).
- Absence of author bias: the same person writes, labels and designs the model (circularity, reduced but not removed by blind labelling).

## 3. Assumption register (kill-tests need no interviews)
| # | Assumption | Kill-test (no interviews) | Kill condition → action | Status |
|---|---|---|---|---|
| A1 | Under pressure, price concessions are mostly unconditional | keyword heuristic on CraigslistBargain (adjacent domain) | conditional ≥ unconditional even under the biased heuristic → drop the "trade, don't cave" framing | **weak support in an adjacent domain** [EVIDENCE: cards/craigslist_bargains.md]. Bias: a move counts as conditional only if a short English keyword list matches ("if you", "in exchange"…), so bundled or differently phrased trades count as unconditional, which inflates the unconditional share by construction. One-shot goods, not services. Indian freelance [HYPOTHESIS]. Never a pitch claim |
| A2 | A deterministic price ladder is computed correctly | ≥10 hand-worked examples + property tests (floor ≤ target ≤ opening; monotonic in costs) | any mismatch → block the phase demo | [GAP] Phase A |
| A3 | The model beats the rule baseline on the frozen test | paired bootstrap of Δ macro-F1 (model − baseline), 2,000 resamples, same frozen split (§2.2) | lower 95% CI bound of Δ ≤ 0 → ship the baseline; results stated as directional | [GAP] Phase B2 |
| A4 | INR shorthand (k, L, lakh, hazaar/hajar/hazar) can be parsed reliably | parser unit tests on every format in the cards + the test split | < 95% exact amount match on the test split → amounts become a USER DECISION field | [GAP] Phase B1 |
| A5 | LLM drafts can be stopped from inventing numbers | adversarial prompt set (injection, "round it", "add GST", numbers written as words such as "30 hazaar", "tees hazaar", "thirty thousand") through the post-check; any number word the checker cannot map to an engine value fails the draft (fail closed) | any invented number passes → S6 stays template-only | [GAP] Phase C |
| A6 | Indian business chat uses Hinglish in price talk | find a published, citable source (URL + date) | no citable source → Hinglish is a "supported input", not a selling point | [GAP]: unsearched |
| A7 | Indian freelancers face payment delays often enough to matter | find official/published data (URL + date) | none found → keep S10 in V2 and remove it from the pitch | [GAP] |
| A8 | The SO benchmark is usable for the first user | after outlier filtering, n ≥ 30 for the segment | n < 30 → hide S3 | India-freelance INR n=73 before filtering [EVIDENCE: cards/so_survey_2026.md] |
| A9 | People will paste client messages (privacy acceptable) | **no pre-launch test possible**. The product must work without pasting (manual move picker) | post-launch paste rate < 20% [HYPOTHESIS: threshold] → rethink S4b's prominence | [HYPOTHESIS] |
| A10 | People want prep, not auto-reply | **no pre-launch test possible** | post-launch: draft-copy rate vs plan-view rate | [HYPOTHESIS] |
| A11 | Web/app devs and designers are the right first user | find published data on Indian freelance categories (URL + date) | no source → state it as a convenience choice, not a market choice | [GAP] |

## 4. Validation built into the product (after launch, consented)
| Mechanism | Collected | Consent / privacy |
|---|---|---|
| "Was this right?" on analyser output | label correction counts per class | opt-in; no message text |
| Outcome self-report | deal closed y/n, final price vs target (as a ratio), concessions count | opt-in; ratios only, no client identity |
| Anonymised usage metrics | funnel counts (setup → ladder → analyse → plan → debrief), LLM fallback rate, low-confidence rate | aggregate only; documented in the privacy notice |
| Message donation | de-identified messages for a future gold set | separate explicit consent per message, revocable; DPDP duties detailed later in 06 [HYPOTHESIS: to be checked against the Act text] |
| Deletion | delete-all on device; deletion request for any donated data | always available |

## 5. Claims we can never make
- "Users told us…", "freelancers want…", "validated with freelancers", "based on interviews/research".
- Inter-annotator agreement between humans.
- Real-world accuracy, or accuracy on real client messages.
- "84% of concessions are unconditional", or any version of the CraigslistBargain heuristic figure, as evidence about freelancers or in a pitch.
- A score without "self-authored, directional" and its confidence interval.
- "Trained on Indian negotiation data" (none exists publicly [EVIDENCE: docs/dataset-audit/AUDIT_REPORT.md]; ours is self-authored).
- "Market rate", "you are underpaid", or any India-freelancer statistic without a fetched, cited source.
- "Tax/legal compliant" or any compliance figure while its card is UNVERIFIED.
- "AI negotiates for you"; "proven to increase earnings".
- The self-authored demo scenario presented as a real case.

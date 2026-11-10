# 01 · Product brief: MolBhav

Status: draft v0.2 (solo project by Sandarbh, no fixed deadline). Tags: [EVIDENCE: path] = backed by a repo file · [HYPOTHESIS] = belief, untested · [GAP] = missing. External facts carry URL + date or are marked UNVERIFIED.

> **Research status, said plainly:** there are no freelancer interviews, surveys, personas or usability tests, and none will be gathered [EVIDENCE: repo contains none; decision in the 2026-11-10 brief]. Every statement about users below is a HYPOTHESIS. It is tested only by the no-interview kill-tests and the post-launch, consented in-product validation in [04_research_integrity.md](04_research_integrity.md). The gold set will be self-authored by the developer, not real client messages [GAP: not written yet].

## 1. First user (narrow on purpose)
| | Choice | Tag |
|---|---|---|
| Who | Solo Indian freelancers in **web/app development and UI/UX design**, roughly 0–5 years freelancing | [HYPOTHESIS]. Chosen because the developer knows this kind of work well enough to write realistic test messages and price examples; not because anyone was asked |
| Clients | Indian startups, SMBs and agencies, briefed over WhatsApp/email, paid in INR | [HYPOTHESIS] |
| Where | Tier-1 metros first (Bengaluru, Pune, Delhi NCR, Mumbai), online so city-agnostic | [HYPOTHESIS] |
| Not first | Writers, marketplace-only (Upwork/Fiverr) sellers, international-client-only freelancers, agencies | [HYPOTHESIS]: different pricing dynamics; later |

D1 APPROVED 2026-11-10: this first user. The alternative was "any Indian freelancer"; a broad user would make the demo scenario generic and spread a one-author gold set too thin.

## 2. The painful moment
The client replies to a quote with *"thoda kam kar do, budget tight hai"* or *"can you do it for 30k?"*. The freelancer has minutes to answer, no written walk-away number, and drops the price unconditionally to avoid losing the client [HYPOTHESIS].
Second moment: the invoice is 30+ days late and the freelancer doesn't know how firm they can be [HYPOTHESIS].

**What they do today** [HYPOTHESIS; no interviews will verify this. See the kill-tests in 04_research_integrity.md]: ask a friend, ask ChatGPT for a "polite reply", accept the cut, or go silent.
**Why that fails** [HYPOTHESIS]: the decision is made under time pressure with no floor price. Concessions are given without asking for anything back (scope, upfront payment, timeline). Nobody tracks what was conceded, so the next deal repeats the mistake.

## 3. Promise
**MolBhav helps Indian freelancers walk into every price conversation with a calculated floor, a planned counter, and a reason, and walk out knowing what they gave away.**

**MolBhav is not:**
- an AI that negotiates or messages clients for you
- a place your client chats get uploaded to: pasted message text is analysed on your device by default. The only exception is an opt-in, in-memory server analysis that is not logged (D10, approved 2026-11-10; see [02_service_catalogue.md](02_service_catalogue.md)). Drafting never sends the client's message text to an LLM [HYPOTHESIS: design, not built]
- a legal, tax or accounting advisor (it shows sourced, dated reference cards only, and only once they are verified)
- a marketplace, invoicing tool or payment collector
- a "market rate oracle". Benchmarks are labelled ESTIMATE with source and sample size
- for high-stakes domains (employment contracts, rent, legal disputes, debt recovery)

## 4. Jobs-to-be-done (with a measurable "after")
| # | When I… | I want to… | After state (measurable) | Tag |
|---|---|---|---|---|
| J1 | send a quote | know my floor, target and opening price | the user has 3 numbers, each labelled CALCULATION, saved before sending, in < 3 min | [HYPOTHESIS]; target untested |
| J2 | get a discount/objection message (English or Hinglish) | understand what kind of move it is | the move + objection type + any amount are shown, with confidence, in < 5 s | [HYPOTHESIS]; model accuracy [GAP] |
| J3 | have to reply | choose a counter that trades, not caves | ≥ 1 conditional option ("if X, then Y") offered and the walk-away never breached without an explicit USER DECISION | [HYPOTHESIS] |
| J4 | finish a deal | see what I conceded | debrief shows the final price vs target, the number of unconditional concessions, and one lesson | [HYPOTHESIS] |
| J5 | face late payment | send a firm but polite reminder | a reminder ladder with dates; legal/tax claims only from verified cards | V2; cards are UNVERIFIED [EVIDENCE: docs/dataset-audit/compliance/] |

## 5. Why India-specific
| Point | Why it matters | Tag |
|---|---|---|
| INR amount formats ("50k", "1.5L", "₹1,20,000", "per month/hour") | public negotiation data is USD-only, so extraction rules must be ours | [EVIDENCE: docs/dataset-audit/cards/craigslist_bargains.md] (USD only); Indian formats in client chats [HYPOTHESIS] |
| Hinglish messages | public negotiation corpora are English-only; Hinglish corpora are not negotiation | [EVIDENCE: docs/dataset-audit/AUDIT_REPORT.md §1–2, cards/cmu_hinglish_dog.md]; that our users write Hinglish [HYPOTHESIS] |
| TDS / GST-LUT / MSME 45-day rules | they change take-home pay and payment-term leverage | relevance [HYPOTHESIS]; the rules themselves are UNVERIFIED [EVIDENCE: docs/dataset-audit/compliance/*.md] |
| UPI / advance-payment norms | "50% upfront via UPI" is a realistic conditional ask | [HYPOTHESIS] |
| Client behaviours: price anchoring low, scope creep, delayed payment | drive which objections we classify | [HYPOTHESIS]; objection labels exist in no public dataset [EVIDENCE: docs/dataset-audit/AUDIT_REPORT.md §1] |
| India rate benchmarks | only SO Survey 2026 is usable (ESTIMATE, India freelancer n=73 INR); the "1M India jobs" set is synthetic | [EVIDENCE: cards/so_survey_2026.md, cards/india_tech_career_1m.md] |

## 6. Why not ChatGPT / Notion / a template?
Honest answer: a careful ChatGPT user can get good *wording*. We do not beat it on prose [HYPOTHESIS]. What a general chatbot does not do by default:
| MolBhav does | General chatbot | Tag |
|---|---|---|
| Computes floor/target/opening with a deterministic engine; every number shown is traceable to user inputs | can invent or mis-add numbers; no audit trail | [HYPOTHESIS]; engine not built [GAP] |
| Rejects any LLM draft that contains a number the engine did not produce | no such check | [HYPOTHESIS]; design only [GAP] |
| Keeps deal state: walk-away, concessions given, what was asked in return | each chat starts fresh unless the user re-explains | [HYPOTHESIS] |
| Labels every claim FACT / CALCULATION / ESTIMATE / USER DECISION / RECOMMENDATION with a source | claims are unlabelled | [HYPOTHESIS] |
| Classifies Hinglish negotiation moves with a reported score on a frozen, self-authored test set (not real-world accuracy) | unmeasured for this task | [GAP]: gold set not written yet |
| Debrief: counts unconditional concessions across deals | no | [HYPOTHESIS] |
Notion/templates: static. They don't read the client's message or check numbers [HYPOTHESIS].
Moat (honest): little today. Possible over time: a labelled Indian freelance negotiation corpus (none exists publicly [EVIDENCE: docs/dataset-audit/AUDIT_REPORT.md]), and user deal history [HYPOTHESIS].

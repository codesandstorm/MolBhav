# Gold-set labelling guidelines

**Version 0.1 · DRAFT for the owner's approval** (2026-11-11). Nothing here is approved yet. Change the version number on every edit and add a row to §9.

Tags: [EVIDENCE: path] · [HYPOTHESIS] · [GAP]. **JUDGEMENT CALL** marks a choice that could reasonably go the other way; each one is listed again in §8 so it can be approved or changed in one place.

Sources: label set and rule-decided splits from D11 option S [EVIDENCE: docs/product/04_research_integrity.md §2.3; docs/product/03_scope_and_cut_line.md D11]; protocol from 04 §2; objection types from docs/dataset-audit/AUDIT_REPORT.md §1 (five) plus one proposed here (§3).

> **About the examples.** Every example in this file is **ILLUSTRATIVE**: written to explain a label, **not gold**, and never used for training, tuning or testing. Gold messages are written only by the author, one per prompt card, with the writing tool (`ml/gold/data/README.md`).

## 0. What is being labelled
- **One message**, sent by a **client** to the freelancer (our user), in English or Roman-script Hinglish.
- Label **only what the text says**. In the blind pass you do not see the card, the intended move or the deal; do not guess them. If the text doesn't settle a field, use the tie-break rules, then tick **unsure**.
- Fields per message: `move` (one of 6), `objection` (one of 6, or NONE), `conditional` (CONCESSION only), the amount fields (§4), and `unsure`.

## 1. Moves: the 6 learned classes
Order of the tie-break ladder (used when two classes fit equally well, after the specific rules below): **ACCEPT > CONCESSION > PRICE_POSITION > PUSHBACK > INFO_REQUEST > OTHER**. JUDGEMENT CALL (J1): ACCEPT and CONCESSION carry the most consequence for the user's next step, so they win ties.

### PRICE_POSITION: the client states a price, or asks for one
- **Definition.** The message puts a specific price on the table (their offer, their budget as a number, a range), or asks the freelancer for a price or a final number ("what's your best price?").
- ILLUSTRATIVE: "Can you do it for 28k? That's what we planned."
- ILLUSTRATIVE: "Final rate kya hoga aapka is project ka?"
- Tie-breaks:
  - A number **plus** a complaint ("too high, can you do 30k?"): PRICE_POSITION, because a new number is on the table. JUDGEMENT CALL (J2): a complaint with a number is a counter-offer, not pushback.
  - A number that only **repeats the freelancer's quote** ("you said 45k, right?"): not a price position. It is INFO_REQUEST if it asks something, otherwise OTHER.
  - Asking for a price **for a different, new item** ("how much for a logo too?") is still PRICE_POSITION. JUDGEMENT CALL (J3).
- Rule-decided split (not labelled, §5.1): **ANCHOR** if no quote has been sent yet, **COUNTER** if one has.

### PUSHBACK: rejects or objects, with no new number
- **Definition.** The client resists the price or the terms ("too expensive", "not possible", "others charge less") **without** proposing a number of their own.
- ILLUSTRATIVE: "That's way more than we expected for a simple site."
- ILLUSTRATIVE: "Bhai itna zyada? Thoda kam karo."
- Tie-breaks:
  - "Thoda kam karo" / "reduce it a bit" with no number: PUSHBACK (they ask for movement but don't name a price).
  - Pushback **plus** a question ("why so high?"): PUSHBACK if the question is rhetorical or about the price; INFO_REQUEST if it asks for facts about the work ("what's included at that price?"). JUDGEMENT CALL (J4).

### CONCESSION: the client moves towards the freelancer
- **Definition.** The client gives ground from their own earlier position: raises their offer, drops a demand, relaxes a deadline, or agrees to better payment terms. The text must signal **movement** ("ok, I can go up to…", "chalo, X de denge", "we can skip the blog part", "fine, you can take two more days").
- ILLUSTRATIVE: "Okay, I can stretch to 38k if the site is live by the 20th."
- ILLUSTRATIVE: "Theek hai, advance 50% de dete hain."
- Tie-breaks:
  - A number with a movement word ("ok, 38k then"): CONCESSION. A number with no movement word: PRICE_POSITION. JUDGEMENT CALL (J5): a single message usually can't show the client's earlier number, so only the wording decides.
  - A concession that **closes** the deal ("ok 40k, done, let's start"): ACCEPT if they agree to the freelancer's terms as they stand; CONCESSION if they still name their own new terms.
- Also labelled: **conditional** yes/no (§5.2), only for CONCESSION.

### INFO_REQUEST: asks for facts, not a price
- **Definition.** A question about the work, process, timeline, terms, portfolio or the freelancer, where the question is not "what's the price".
- ILLUSTRATIVE: "How many revisions are included, and do you handle hosting?"
- ILLUSTRATIVE: "Kitne din lagenge poora karne mein?"
- Tie-breaks: a question that is really a demand ("can you do it by Friday?") is still INFO_REQUEST unless it attaches a price or a rejection. JUDGEMENT CALL (J6).

### ACCEPT: agrees to the deal or to the freelancer's latest terms
- **Definition.** The client agrees: says yes, confirms, asks to start or for the invoice, without new conditions.
- ILLUSTRATIVE: "Sounds good, let's go ahead. Send me the invoice."
- ILLUSTRATIVE: "Done hai, kal se start karo."
- Tie-breaks: "OK" alone in reply to a price is ACCEPT only if nothing else is in the message; "ok, but…" is decided by what follows "but". JUDGEMENT CALL (J7).

### OTHER: none of the above
- **Definition.** Greetings, thanks, small talk, delays ("will get back to you"), statements of fact with no ask, and anything off-topic.
- ILLUSTRATIVE: "Thanks for the quote, will discuss with my partner and revert."
- ILLUSTRATIVE: "Hi, kal baat karte hain, abhi meeting mein hoon."
- Tie-breaks: a postponement that hints at pushback ("let me think, it's a bit much") is PUSHBACK, because the hint is an objection to the price.

## 2. Unsure
Tick **unsure** when you had to use a tie-break rule, or when two readings feel equally likely. It is recorded, not used to drop items. About 15% of cards are written to be ambiguous on purpose [EVIDENCE: 04 §2 step 3].

## 3. Objection types (one per message, or NONE)
Five types come from the audit [EVIDENCE: docs/dataset-audit/AUDIT_REPORT.md §1: "BUDGET, SCOPE, TIMELINE, PAYMENT_TERMS, TRUST"]. The sixth, **COMPETITOR**, is proposed here [HYPOTHESIS: owner to approve; the audit lists five, the plan asks for six]. Pick the **main** reason the client gives. Tie-break order when two are equally strong: **BUDGET > COMPETITOR > SCOPE > TIMELINE > PAYMENT_TERMS > TRUST** (J8).

| Type | Definition | ILLUSTRATIVE (not gold) |
|---|---|---|
| BUDGET | the client cites their own money limit or says the price is high | "Our budget is small this quarter." · "Itna budget nahi hai abhi." |
| SCOPE | the client argues the work is smaller, or wants more work for the same price | "It's just a basic landing page." · "Logo ke saath business card bhi daal do usi mein." |
| TIMELINE | dates and speed: urgency, deadlines, delays | "We need this live before Diwali." · "Itna time kyun lagega?" |
| PAYMENT_TERMS | how and when money moves: advance, milestones, after delivery, invoices, instalments | "We only pay after delivery." · "Advance nahi dete hum, kaam ke baad payment." |
| TRUST | doubts about the freelancer: proof, portfolio, guarantee, risk | "How do I know you'll finish on time?" · "Pehle kuch sample dikhao." |
| COMPETITOR [HYPOTHESIS] | another person, agency, platform or quote is cited as cheaper or better | "Someone on Fiverr quoted half of this." · "Dusra banda 20 mein kar raha hai." |
| NONE | no objection given | "Sounds good, let's go ahead." |

Notes:
- An objection can appear with **any** move (an ACCEPT with "but pay after delivery" is ACCEPT + PAYMENT_TERMS). JUDGEMENT CALL (J9).
- A percentage about payment ("50% advance") is PAYMENT_TERMS, not a price (§4).

## 4. Amount fields
Label the amount **the client puts forward as their price** (offer, budget, range, or a price asked about by number). Leave everything empty when there is none.

| Field | Values | Rule |
|---|---|---|
| `rupees` | whole rupees as digits, e.g. `45000`, or empty | the client's own price. "45k" → `45000`; "1.5L" / "1.5 lakh" / "dedh lakh" → `150000`; "45 hazaar" / "hajar" / "hazar" → `45000`; "tees hazaar" → `30000`; "₹4,50,000" → `450000` |
| `rupees_high` | digits or empty | the upper end of a range: "40-45k" → `rupees` 40000, `rupees_high` 45000. JUDGEMENT CALL (J10): ranges keep both ends; the scorer compares both |
| `unit` | `fixed` · `hour` · `day` · `month` · `unspecified` | from words in the message ("per hour", "/hr", "ghante ka", "per day", "monthly", "har mahine"). **No unit word → `unspecified`**, even if the context suggests one. JUDGEMENT CALL (J11) |
| `currency` | `INR` · `OTHER` | ₹, Rs, INR, rupees, or no currency mark → INR; $, USD, € → OTHER |
| `ambiguous` | yes / no | yes when a careful reader could not settle the exact rupees: two competing client prices, "around 30-ish", paise ("₹45,000.50"), a number that may not be a price |

Which number, when there are several:
1. The client's own new price wins over a reference to the freelancer's quote ("you quoted 45k, we can do 32k" → 32000).
2. Not prices: counts ("2 pages", "3 revisions"), durations ("5 days", "2 weeks"), percentages ("18% GST", "50% advance"), dates, times, phone numbers, years.
3. Still two candidate client prices → fill the first, tick **ambiguous**.

## 5. Rule-decided parts (not labelled by the learned model)
These follow D11 option S [EVIDENCE: 04 §2.3]: transparent rules, unit-tested, and scored separately.

### 5.1 ANCHOR vs COUNTER (PRICE_POSITION only)
- From **deal state**, not from the text: has the freelancer already sent a quote?
  - no quote sent → **ANCHOR** (the client names the first number);
  - quote sent → **COUNTER**.
- In the app, deal state comes from the user's deal (a quote entered) or from a yes/no the user answers on the screen (USER DECISION). In the gold set it comes from the card (`quote_sent`), which the blind labeller never sees.
- Nothing to label by hand. Scored as a check that the rule is applied, since the state is given.

### 5.2 Conditional vs unconditional (CONCESSION only)
- **Conditional**: the concession is tied to something in return, in the same message. Clause cues (English and Roman Hinglish): "if", "only if", "provided (that)", "as long as", "on condition", "in exchange", "in return", "agar … toh", "tabhi", "toh hi", "tab hi", "bas … chahiye", "but then", "lekin phir". JUDGEMENT CALL (J12): "bas … chahiye" and "but then" are included because they commonly introduce the return demand; the owner may drop them.
- **Unconditional**: movement with nothing asked in return.
- **Labelled by hand** (`conditional` yes/no) on every CONCESSION message, so the rules can be scored on the CONCESSION subset. Leave it empty for other moves.
- ILLUSTRATIVE conditional: "Agar 15 tak de do toh 40 kar denge."
- ILLUSTRATIVE unconditional: "Fine, we'll pay 40k."

## 6. Language
- `en`: English only. `hinglish`: Roman-script Hindi mixed with English (any amount of mixing). JUDGEMENT CALL (J13): one Hindi word ("bhai") makes it `hinglish`.
- Devanagari is out of scope for V1 [EVIDENCE: 05_judge_qa.md E9]; do not write gold messages in it.

## 7. Process reminders
- Blind pass: shuffled order, no card, no intended move (labelling tool).
- Never edit a message after it has been labelled; write a new one instead (the old id stays, marked `retired` in a later version of the schema if needed [GAP]).
- The test split is frozen and hashed before any training (`npm run gold:split`); it is never used for tuning. Rule weights and thresholds may be tuned on **dev only** [EVIDENCE: 04 §2 step 5].

## 8. Judgement calls for the owner
| # | Call | Alternative |
|---|---|---|
| J1 | tie-break ladder ACCEPT > CONCESSION > PRICE_POSITION > PUSHBACK > INFO_REQUEST > OTHER | put PUSHBACK above PRICE_POSITION |
| J2 | complaint + number = PRICE_POSITION | PUSHBACK whenever a complaint is present |
| J3 | price asked for a new item = PRICE_POSITION | INFO_REQUEST |
| J4 | "why so high?" = PUSHBACK; "what's included?" = INFO_REQUEST | all questions are INFO_REQUEST |
| J5 | movement wording decides CONCESSION vs PRICE_POSITION | use deal state |
| J6 | "can you do it by Friday?" = INFO_REQUEST | TIMELINE PUSHBACK |
| J7 | bare "ok" = ACCEPT | OTHER |
| J8 | objection tie-break order BUDGET > COMPETITOR > SCOPE > TIMELINE > PAYMENT_TERMS > TRUST | allow two objections |
| J9 | objections can attach to any move | only PUSHBACK and PRICE_POSITION carry objections |
| J10 | ranges keep both ends | label the lower end only |
| J11 | no unit word → `unspecified` | infer the unit from context |
| J12 | conditional cue list includes "bas … chahiye", "but then", "lekin phir" | the brief's list only |
| J13 | one Hindi word makes a message `hinglish` | a share threshold |
| — | COMPETITOR as the sixth objection type [HYPOTHESIS] | NONE counts as the sixth; or split BUDGET into "price high" and "no money" |

## 9. Change log
| Version | Date | Change |
|---|---|---|
| 0.1 | 2026-11-11 | First draft (B1.1), for approval. |

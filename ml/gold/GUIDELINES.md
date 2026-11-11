# Gold-set labelling guidelines

**Version 0.2** (2026-11-11). The owner's decisions on v0.1 are applied: J1–J4, J6, J8–J13 and COMPETITOR are **APPROVED 2026-11-11** as written; J5 and J7 are **CHANGED and APPROVED 2026-11-11** (§8). Change the version number on every edit and add a row to §9.

Tags: [EVIDENCE: path] · [HYPOTHESIS] · [GAP]. **JUDGEMENT CALL** marks a choice that could reasonably go the other way; each one is listed again in §8 with its status.

Sources: label set and rule-decided splits from D11 option S [EVIDENCE: docs/product/04_research_integrity.md §2.3; docs/product/03_scope_and_cut_line.md D11]; protocol from 04 §2; objection types from docs/dataset-audit/AUDIT_REPORT.md §1 (five) plus COMPETITOR (§3, approved by the owner).

> **About the examples.** Every example in this file is **ILLUSTRATIVE**: written to explain a label, **not gold**, and never used for training, tuning or testing. Gold messages are written only by the author, one per prompt card, with the writing tool (`ml/gold/data/README.md`). The examples and the prompt cards were drafted with AI assistance; the gold messages are written and labelled by the author.

## 0. What is being labelled, and what you can see
- **One message**, sent by a **client** to the freelancer (our user), in English or Roman-script Hinglish.
- **What the blind labeller sees, exactly** (labelling tool, pass v1 and v2):
  1. the message text;
  2. **one context line** taken from the card's scenario facts: either **"Freelancer's quote so far: ₹X"** (with "per hour" or "per month" when the quote is an hourly or monthly rate) or **"No quote sent yet"**.
- **What the labeller does not see**: the card, the intended move, the intended objection, the language, the amount format, the scenario's work description, whether the card was written to be ambiguous, and any earlier label.
- Label only from the text and that context line. **Every rule below uses only these two things**; if a rule seems to need anything else (the client's earlier messages, the freelancer's costs, the deal's history), it does not apply. If the text and the context line don't settle a field, use the tie-break rules, then tick **unsure**.
- Fields per message: `move` (one of 6), `objection` (one of 6, or NONE), `conditional` (CONCESSION only), the amount fields (§4), and `unsure`.

## 1. Moves: the 6 learned classes
Order of the tie-break ladder (used when two classes fit equally well, after the specific rules below): **ACCEPT > CONCESSION > PRICE_POSITION > PUSHBACK > INFO_REQUEST > OTHER**. JUDGEMENT CALL (J1, APPROVED 2026-11-11): ACCEPT and CONCESSION carry the most consequence for the user's next step, so they win ties.

### PRICE_POSITION: the client states a price, or asks for one
- **Definition.** The message puts a specific price on the table (their offer, their budget as a number, a range), or asks the freelancer for a price or a final number ("what's your best price?").
- ILLUSTRATIVE: "Can you do it for 28k? That's what we planned."
- ILLUSTRATIVE: "Final rate kya hoga aapka is project ka?"
- Tie-breaks:
  - A number **plus** a complaint ("too high, can you do 30k?"): PRICE_POSITION, because a new number is on the table. JUDGEMENT CALL (J2, APPROVED 2026-11-11): a complaint with a number is a counter-offer, not pushback.
  - A number that only **repeats the quote in the context line** ("you said 45k, right?" when the line says ₹45,000): not a price position. It is INFO_REQUEST if it asks something, otherwise OTHER. (When the line says "No quote sent yet", a number is the client's own.)
  - Asking for a price **for a different, new item** ("how much for a logo too?") is still PRICE_POSITION. JUDGEMENT CALL (J3, APPROVED 2026-11-11).
- Rule-decided split (not labelled, §5.1): **ANCHOR** if no quote has been sent yet, **COUNTER** if one has.

### PUSHBACK: rejects or objects, with no new number
- **Definition.** The client resists the price or the terms ("too expensive", "not possible", "others charge less") **without** proposing a number of their own.
- ILLUSTRATIVE: "That's way more than we expected for a simple site."
- ILLUSTRATIVE: "Bhai itna zyada? Thoda kam karo."
- Tie-breaks:
  - "Thoda kam karo" / "reduce it a bit" with no number: PUSHBACK (they ask for movement but don't name a price).
  - Pushback **plus** a question ("why so high?"): PUSHBACK if the question is rhetorical or about the price; INFO_REQUEST if it asks for facts about the work ("what's included at that price?"). JUDGEMENT CALL (J4, APPROVED 2026-11-11).

### CONCESSION: the client moves towards the freelancer
- **Definition.** The text signals that the client is giving ground: raising an offer, dropping a demand, relaxing a deadline, or agreeing to better payment terms. Movement must be **in the words** ("ok, I can go up to…", "chalo, X de denge", "we can skip the blog part", "fine, you can take two more days"); do not infer it from positions you cannot see.
- ILLUSTRATIVE: "Okay, I can stretch to 38k if the site is live by the 20th."
- ILLUSTRATIVE: "Theek hai, advance 50% de dete hain."
- Tie-breaks:
  - JUDGEMENT CALL (J5, CHANGED and APPROVED 2026-11-11): the **wording** decides CONCESSION vs PRICE_POSITION, and you may use the quote in the context line:
    - a number **below the visible quote** with a movement word ("ok, 38k then" when the quote is ₹45,000) → CONCESSION;
    - a number with **no movement word** → PRICE_POSITION, whatever its size;
    - a movement word with a number when the line says "No quote sent yet" → CONCESSION only if the words themselves say they are moving ("we can go up to 38k"); otherwise PRICE_POSITION and tick unsure.
  - A concession that **closes** the deal ("ok 40k, done, let's start"): ACCEPT if the number equals the visible quote (they take the freelancer's terms as they stand); CONCESSION if they name their own, different terms.
- Also labelled: **conditional** yes/no (§5.2), only for CONCESSION.

### INFO_REQUEST: asks for facts, not a price
- **Definition.** A question about the work, process, timeline, terms, portfolio or the freelancer, where the question is not "what's the price".
- ILLUSTRATIVE: "How many revisions are included, and do you handle hosting?"
- ILLUSTRATIVE: "Kitne din lagenge poora karne mein?"
- Tie-breaks: a question that is really a demand ("can you do it by Friday?") is still INFO_REQUEST unless it attaches a price or a rejection. JUDGEMENT CALL (J6, APPROVED 2026-11-11).

### ACCEPT: agrees to the deal or to the freelancer's terms
- **Definition.** The client agrees: says yes, confirms, asks to start or for the invoice, without new conditions.
- ILLUSTRATIVE: "Sounds good, let's go ahead. Send me the invoice."
- ILLUSTRATIVE: "Done hai, kal se start karo."
- Tie-breaks: JUDGEMENT CALL (J7, CHANGED and APPROVED 2026-11-11), using the context line:
  - "ok" / "theek hai" / "done" **alone**, when the line shows a quote → **ACCEPT** (agreeing to the quote);
  - the same alone when the line says **"No quote sent yet"** → **OTHER**, and tick **unsure** (there is nothing yet to accept);
  - "ok, but…" is decided by what follows "but".

### OTHER: none of the above
- **Definition.** Greetings, thanks, small talk, delays ("will get back to you"), statements of fact with no ask, and anything off-topic.
- ILLUSTRATIVE: "Thanks for the quote, will discuss with my partner and revert."
- ILLUSTRATIVE: "Hi, kal baat karte hain, abhi meeting mein hoon."
- Tie-breaks: a postponement that hints at pushback ("let me think, it's a bit much") is PUSHBACK, because the hint is an objection to the price.

## 2. Unsure
Tick **unsure** when you had to use a tie-break rule, or when two readings feel equally likely. It is recorded, not used to drop items. About 15% of cards are written to be ambiguous on purpose [EVIDENCE: 04 §2 step 3]; you are not told which.

## 3. Objection types (one per message, or NONE)
Five types come from the audit [EVIDENCE: docs/dataset-audit/AUDIT_REPORT.md §1: "BUDGET, SCOPE, TIMELINE, PAYMENT_TERMS, TRUST"]. The sixth, **COMPETITOR**, was proposed in v0.1 and is **APPROVED 2026-11-11**. Pick the **main** reason the client gives. Tie-break order when two are equally strong: **BUDGET > COMPETITOR > SCOPE > TIMELINE > PAYMENT_TERMS > TRUST** (J8, APPROVED 2026-11-11).

| Type | Definition | ILLUSTRATIVE (not gold) |
|---|---|---|
| BUDGET | the client cites their own money limit or says the price is high | "Our budget is small this quarter." · "Itna budget nahi hai abhi." |
| SCOPE | the client argues the work is smaller, or wants more work for the same price | "It's just a basic landing page." · "Logo ke saath business card bhi daal do usi mein." |
| TIMELINE | dates and speed: urgency, deadlines, delays | "We need this live before Diwali." · "Itna time kyun lagega?" |
| PAYMENT_TERMS | how and when money moves: advance, milestones, after delivery, invoices, instalments | "We only pay after delivery." · "Advance nahi dete hum, kaam ke baad payment." |
| TRUST | doubts about the freelancer: proof, portfolio, guarantee, risk | "How do I know you'll finish on time?" · "Pehle kuch sample dikhao." |
| COMPETITOR | another person, agency, platform or quote is cited as cheaper or better | "Someone on Fiverr quoted half of this." · "Dusra banda 20 mein kar raha hai." |
| NONE | no objection given | "Sounds good, let's go ahead." |

Notes:
- An objection can appear with **any** move (an ACCEPT with "but pay after delivery" is ACCEPT + PAYMENT_TERMS). JUDGEMENT CALL (J9, APPROVED 2026-11-11).
- A percentage about payment ("50% advance") is PAYMENT_TERMS, not a price (§4).
- Objection types are scored for the rules only and reported as "too few to score" unless the test split has ≥ 10 items per type [EVIDENCE: 04 §2.2].

## 4. Amount fields
Label the amount **the client puts forward as their price** (offer, budget, range, or a price asked about by number). Leave everything empty when there is none.

| Field | Values | Rule |
|---|---|---|
| `rupees` | whole rupees as digits, e.g. `45000`, or empty | the client's own price. "45k" → `45000`; "1.5L" / "1.5 lakh" / "dedh lakh" → `150000`; "45 hazaar" / "hajar" / "hazar" → `45000`; "tees hazaar" → `30000`; "₹4,50,000" → `450000` |
| `rupees_high` | digits or empty | the upper end of a range: "40-45k" → `rupees` 40000, `rupees_high` 45000. JUDGEMENT CALL (J10, APPROVED 2026-11-11): ranges keep both ends; the scorer compares both |
| `unit` | `fixed` · `hour` · `day` · `month` · `unspecified` | from words **in the message** ("per hour", "/hr", "ghante ka", "per day", "monthly", "har mahine"). **No unit word → `unspecified`**, even if the context line's quote is per hour or per month. JUDGEMENT CALL (J11, APPROVED 2026-11-11) |
| `currency` | `INR` · `OTHER` | ₹, Rs, INR, rupees, or no currency mark → INR; $, USD, € → OTHER |
| `ambiguous` | yes / no | yes when a careful reader could not settle the exact rupees: two competing client prices, "around 30-ish", paise ("₹45,000.50"), a number that may not be a price |

Which number, when there are several:
1. The client's own new price wins over a reference to the freelancer's quote ("you quoted 45k, we can do 32k" → 32000). A number that matches the quote in the context line and is introduced as the freelancer's ("you said", "aapne bola") is a reference, not the client's price.
2. Not prices: counts ("2 pages", "3 revisions"), durations ("5 days", "2 weeks"), percentages ("18% GST", "50% advance"), dates, times, phone numbers, years.
3. Still two candidate client prices → fill the first, tick **ambiguous**.

## 5. Rule-decided parts (not labelled by the learned model)
These follow D11 option S [EVIDENCE: 04 §2.3]: transparent rules, unit-tested, and scored separately.

### 5.1 ANCHOR vs COUNTER (PRICE_POSITION only)
- From **deal state**, not from the text: has the freelancer already sent a quote?
  - no quote sent → **ANCHOR** (the client names the first number);
  - quote sent → **COUNTER**.
- In the app, deal state comes from the user's deal (a quote entered) or from a yes/no the user answers on the screen (USER DECISION). In the gold set it comes from the card (`quote_sent`, `quote_rupees`), which is the same fact the labeller sees in the context line.
- Nothing to label by hand. Scored as a check that the rule is applied, since the state is given.

### 5.2 Conditional vs unconditional (CONCESSION only)
- **Conditional**: the concession is tied to something in return, in the same message. Clause cues (English and Roman Hinglish): "if", "only if", "provided (that)", "as long as", "on condition", "in exchange", "in return", "agar … toh", "tabhi", "toh hi", "tab hi", "bas … chahiye", "but then", "lekin phir". JUDGEMENT CALL (J12, APPROVED 2026-11-11): "bas … chahiye" and "but then" are included because they commonly introduce the return demand.
- **Unconditional**: movement with nothing asked in return.
- **Labelled by hand** (`conditional` yes/no) on every CONCESSION message, so the rules can be scored on the CONCESSION subset. Leave it empty for other moves.
- ILLUSTRATIVE conditional: "Agar 15 tak de do toh 40 kar denge."
- ILLUSTRATIVE unconditional: "Fine, we'll pay 40k."

## 6. Language
- Recorded by the **writer** (the writing tool), not by the blind labeller.
- `en`: English only. `hinglish`: Roman-script Hindi mixed with English (any amount of mixing). JUDGEMENT CALL (J13, APPROVED 2026-11-11): one Hindi word ("bhai") makes it `hinglish`.
- Devanagari is out of scope for V1 [EVIDENCE: 05_judge_qa.md E9]; do not write gold messages in it.

## 7. Process reminders
- Writing: the writing tool shows the same quote fact as the labelling tool, so the message is consistent with it.
- Blind pass: shuffled order; only the message and the one context line (§0).
- Never edit a message after it has been labelled; write a new one instead (the old id stays, marked `retired` in a later version of the schema if needed [GAP]).
- The test split is frozen and hashed before any training (`npm run gold:split`); it is never used for tuning. Rule weights and thresholds may be tuned on **dev only** [EVIDENCE: 04 §2 step 5].

## 8. Judgement calls
| # | Call | Status |
|---|---|---|
| J1 | tie-break ladder ACCEPT > CONCESSION > PRICE_POSITION > PUSHBACK > INFO_REQUEST > OTHER | APPROVED 2026-11-11 |
| J2 | complaint + number = PRICE_POSITION | APPROVED 2026-11-11 |
| J3 | price asked for a new item = PRICE_POSITION | APPROVED 2026-11-11 |
| J4 | "why so high?" = PUSHBACK; "what's included?" = INFO_REQUEST | APPROVED 2026-11-11 |
| J5 | wording decides CONCESSION vs PRICE_POSITION; the labeller may use the visible quote (a number below it with a movement word = CONCESSION; a number with no movement word = PRICE_POSITION) | CHANGED and APPROVED 2026-11-11 (v0.1: wording only, no quote) |
| J6 | "can you do it by Friday?" = INFO_REQUEST | APPROVED 2026-11-11 |
| J7 | bare "ok" after a visible quote = ACCEPT; with "No quote sent yet" = OTHER + unsure | CHANGED and APPROVED 2026-11-11 (v0.1: bare "ok" = ACCEPT always) |
| J8 | objection tie-break order BUDGET > COMPETITOR > SCOPE > TIMELINE > PAYMENT_TERMS > TRUST | APPROVED 2026-11-11 |
| J9 | objections can attach to any move | APPROVED 2026-11-11 |
| J10 | ranges keep both ends | APPROVED 2026-11-11 |
| J11 | no unit word → `unspecified` | APPROVED 2026-11-11 |
| J12 | conditional cue list includes "bas … chahiye", "but then", "lekin phir" | APPROVED 2026-11-11 |
| J13 | one Hindi word makes a message `hinglish` | APPROVED 2026-11-11 |
| — | COMPETITOR as the sixth objection type | APPROVED 2026-11-11 |

## 9. Change log
| Version | Date | Change |
|---|---|---|
| 0.1 | 2026-11-11 | First draft (B1.1), for approval. |
| 0.2 | 2026-11-11 | Owner's decisions applied: J1–J4, J6, J8–J13 and COMPETITOR approved; J5 and J7 changed to use the visible quote. §0 now lists exactly what the blind labeller sees (the message and one quote context line). Removed rules that relied on unseen information (the client's "earlier position" in CONCESSION; "the labeller never sees quote_sent" in §5.1). Language is recorded by the writer. AI-assistance disclosure added to the examples note. |

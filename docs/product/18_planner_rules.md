# 18 · Planner rules (S5): the decision table

Version 0.1, 2026-11-11 (Phase C1). Code: `packages/planner/src/plan.ts` and `steps.ts`. Tests: `packages/planner/test/rules.test.ts` (one test per row below, by id) and `properties.test.ts`. Every rule is [HYPOTHESIS: a design choice by the developer, pending the owner's review in [17_c1_review_checklist.md](17_c1_review_checklist.md)]. No rule claims that trading works better than conceding. The planner offers options with reasons, not instructions, and the user decides.

**Symbols.** `F`, `T`, `O`: the engine's floor, target and opening (rounded rungs, [13_price_ladder_spec.md](13_price_ladder_spec.md) §3). `s`: the ladder step (₹100, or ₹10 per hour). `P`: your price, the price the options start from. `A`: the client's amount as the user confirmed it on the reader screen (USER DECISION). `ceil_s(x)`: `x` rounded up to a multiple of `s`, as the engine rounds. All arithmetic is exact bigint; there are no floats anywhere.

## 1. Inputs and output
| Input | From | Label |
|---|---|---|
| `F`, `T`, `O`, `s`, unit, the engine's inputs | `computeLadder` (packages/engine) | CALCULATION |
| quote sent, current quote | the deal form (S1) and the reader's "Have you sent them a quote yet?" | USER DECISION |
| move, objection | the analyser, or the user's own pick | ESTIMATE, or USER DECISION when picked |
| `A`, its unit and currency | the reader's amount field | USER DECISION (the user confirms or corrects it) |
| trade return, advance share, smaller effort | the options screen | USER DECISION |

Output: 2 to 4 options, ranked. Each has an id (its kind), a family (a–f in the brief), the rule that produced it, a reason (RECOMMENDATION), a one-line risk, the exact figures (CALCULATION) and a floor reminder for the user, the numbers a draft may use, and the slots its templates need.

## 2. Your price (P)
| Id | When | P | Note |
|---|---|---|---|
| P-1 | a current quote is set and `quote ≥ F` | the quote | — |
| P-2 | a current quote is set and `quote < F` | `T` | `quote_below_floor`: "Your quote is below your floor. The options start from your target instead; you decide whether to re-quote." |
| P-3 | no current quote | `O` | — |

## 3. The client's amount
| Id | When | A used by the plan | Note |
|---|---|---|---|
| U-0 | no amount, or not a positive whole number | none | `no_amount` |
| C-1 | the currency is not rupees | none | `not_inr` |
| U-1 | the unit is missing or "not stated" | the amount, read in the ladder's unit | `unit_assumed` |
| U-2 | the unit matches the ladder (fixed, hour, month) | the amount | — |
| U-3 | the unit differs from the ladder (e.g. per day against a fixed price) | none | `unit_mismatch` |

**Position of A** (checked in this order): `below_floor` (`A < F`) · `at_or_above_price` (`A ≥ P`) · `floor_to_target` (`A < T`) · `target_to_price` (otherwise) · `none` (no usable amount).

## 4. Rows: which options, in which order
| Id | When | Options, in rank order (before §5 modifiers) |
|---|---|---|
| L-1 | the move came from the analyser and is missing, or its confidence is below `LOW_CONFIDENCE` (0.5) | TRADE, HOLD, ASK. The amount is ignored (shown, never met or declined). Note `low_confidence` or `no_move`: "We are not sure what their reply means, so these are general, safe options…" |
| M-1 | a price move (PRICE_POSITION, PUSHBACK, CONCESSION, or ACCEPT with a lower amount) and `A ≥ P` | CONFIRM (at `A`), CLARIFY |
| M-2 | price move, `T ≤ A < P` | TRADE, HOLD, MEET or STEP |
| M-3 | price move, `F ≤ A < T` | TRADE, HOLD, SCOPE, STEP |
| M-4 | price move, `A < F` | DECLINE, SCOPE, TRADE |
| M-5 | price move, no usable amount | TRADE, HOLD, ASK |
| M-6 | INFO_REQUEST | ANSWER, ANSWER_HOLD |
| M-7 | ACCEPT with no amount, or `A ≥ P` | CONFIRM (at `A` when `A ≥ P`, else at `P`), CLARIFY |
| M-8 | OTHER | CLARIFY, HOLD |

ACCEPT with `A < P` is treated as a counter offer (rows M-2 to M-4), with note `accept_with_lower_amount`.

## 5. Objection modifiers
| Id | When | Change |
|---|---|---|
| O-1 | objection SCOPE or COMPETITOR, rows L-1, M-2, M-3, M-5 | HOLD moves to the top. Reason for SCOPE: "They think it is a lot of work…"; for COMPETITOR: "You cannot see the other quote…" (no matching of an unseen price, no invented competing offers) |
| O-2 | objection BUDGET | M-3 order becomes TRADE, SCOPE, HOLD, STEP; M-5 adds SCOPE last |
| O-3 | the user has not picked a return for TRADE | recommended return: PAYMENT_TERMS or TRUST → payment in milestones; SCOPE → a smaller scope; anything else → part of the payment in advance. The user can change it (USER DECISION) |

## 6. Options and their figures
| Id | Option (family) | Figures | Available when |
|---|---|---|---|
| A-1 | HOLD (a) | `P` | always, except F-2 |
| S-2 | TRADE (b) | `counter = ceil_s((3P + T) / 4)`, i.e. a quarter of the way from `P` to `T`; or `A` itself when `ceil_s(...) ≤ A < P`. Conditional: offered only with the return the user chose; the draft also restates `P` | `counter < P`, and `counter > F` unless it is `A` |
| S-1 | STEP (c) | `counter = ceil_s((P + T) / 2)`, the midpoint, rounded up, so never below `T` | `counter < P`, `counter > F`, and MEET does not apply |
| S-4 | MEET (c) | `A` | `T ≤ A < P` and (no step exists or `A ≥` the step's counter) |
| D-1 | SCOPE (d) | the engine's `computeLadder` re-run with the smaller effort the user typed (everything else unchanged): its floor `F'`, target `T'`, opening `O'`. Price: `A` if `T' ≤ A ≤ O'`, else `T'`, else `O'`; never `≤ F'` unless it is `A` | the ladder is per project or per month (per hour: a smaller job does not change the rate, so SCOPE is not offered); without a typed effort the option asks for one (`needs_effort`); an effort that is not smaller than the original, not a number, or rejected by the engine shows an error and no price |
| E-1 | DECLINE (e) | `A` (their own number); the floor is never stated | `A` is usable |
| Q-0 | ASK, CLARIFY, ANSWER (f) | none | always |
| Q-1 | ANSWER_HOLD (f) | `P` | always, except F-2 |
| Q-2 | CONFIRM (f) | the agreed price (row M-1 or M-7) | the agreed price is not the floor, unless it is `A` or your sent quote |

**Step sequence (S-3).** Repeating S-1 from `P` gives `P > c₁ > c₂ > … ≥ T`, and the sequence stops when the midpoint rounds back up to the current price. When `P` is a multiple of `s` (always true for `O` and `T`), each step down is no larger than the one before. When `P` is not (a quote typed by hand, e.g. ₹52,450), the first step also brings the price onto the step grid, so it can be smaller than the second; from `c₁` on, each step is again no larger than the one before. The planner offers only the first step. Tested for 2,000+ random ladders and prices (`steps.test.ts`). Example [CALCULATION]: `P` = ₹52,500, `T` = ₹45,600, `s` = ₹100 → ₹49,100, ₹47,400, ₹46,500, ₹46,100, ₹45,900, ₹45,800, ₹45,700.

## 7. Guards (apply to every plan)
| Id | Guard | Test |
|---|---|---|
| F-1 | No suggested price is below the floor of the scope it prices: every price an option offers or restates is `≥ F` (SCOPE: `≥ F'`, the floor of the smaller job, which the option also shows). The only number below the floor a draft can contain is the client's own, quoted back by DECLINE to turn it down. | property, 2,000+ runs, with client amounts below, at and above the floor, above the opening, and absent |
| F-2 | No client-facing figure equals the floor (the user's walk-away number), unless it is the client's own number or the user's own sent quote. When `P` would equal `F` for another reason (target or opening equal to the floor), the options that state `P` are dropped. The floor is never a template slot. | property + table rows |
| G-1 | The first option is never a price cut with nothing asked back (STEP, MEET). At least one option is conditional or keeps the price, whenever price is discussed. | property |
| N-1 | Always 2 to 4 options: if fewer than 2 survive, ASK, then CLARIFY, are added. | property |
| R-1 | Same input, same output (no clock, no randomness). | property |
| R-2 | Every number in an option comes from the allowed set: `F`, `T`, `O`, `P`, `A`, the S-1/S-2 counters, the D-1 re-priced ladder, and the advance share the user picked from a fixed list (25% or 50%). | property |

## 8. What the planner never does
- Suggest a price below the floor, or reveal the floor to the client.
- Invent a number: no market rate, no competitor price, no "round" figure, no tax.
- Use manipulation: no fake deadlines, no invented competing offers, no pressure wording ([05_judge_qa.md](05_judge_qa.md) E5).
- Claim that a trade, a step or a hold will work. Reasons say what an option does, not what it achieves.
- Give legal, tax or financial advice.

## 9. Extension point
The LLM path (Phase C2, `/v1/draft`) takes the same `DraftRequest` (enumerated fields and these numbers only, never the client's message) and its output must pass the same `checkDraft` ([09_architecture.md](09_architecture.md) §4); a failure falls back to the template.

## 10. The number post-check (A5)
`checkDraft(text, allowed)` ([packages/planner/src/check.ts](../../packages/planner/src/check.ts)) runs on every draft: on the filled template, and again on every edit the user makes. It **fails closed**: the draft fails if anything numeric in it cannot be mapped to an exact allowed value. The allowed set is the option's prices (each with its unit) and the advance share the user picked; the floor is never in it (F-2).
- It reads: digits with western (45,600) or Indian (1,05,000) grouping; ₹, Rs, Rs., INR, rupees; k, L, lakh, lac, cr shorthand (52.5k); hazaar/hajar/hazar; English number words ("fifty two thousand five hundred"); Roman Hindi number words; percent written as `%`, "percent" or "pratishat".
- It rejects, with a reason: a value not allowed (`not_allowed`); another currency (`currency`); a per-hour figure in a fixed-price deal and the like (`unit_swap`); a hedge such as "around", "or so", "thereabouts", "ke aas paas", "ya usse kam" (`approximate`); a range (`range`); decimals and bad grouping; digits from other scripts, look-alike letters (O for 0, l for 1), hidden characters, Roman numerals; number words split by `- _ . · *` (`split_number`); quantity and ordinal words (`number_word`); tax and legal terms such as GST or TDS (`tax_legal`).
- A second reader: the analyser's amount parser runs over the same text, and any amount it finds that the checker did not approve fails the draft (`analyser_disagrees`).
- The app shows "All numbers in this draft come from your ladder" (CALCULATION) only when the check passed; otherwise it lists each offending item with its reason in plain words.
- Measured on the adversarial set: 404 cases, 0 invented numbers passed, 54 of 54 correct drafts accepted ([04_research_integrity.md](04_research_integrity.md) §3, A5).

**Limits (known, documented, not fixed in C1)** [HYPOTHESIS: low risk, because templates never produce them]:
- The bare Hindi words "ek" (one) and "do" (two, also the English verb) alone are not read as numbers, so "do" in "can you do it" passes. Next to a number context ("do hazaar", "do lakh") they are read.
- A unit word that is not next to the number ("₹45,000, and that is for the month") is not tied to the number, so a unit swap written that way passes as the bare price.
- Hindi ordinals (pehla, doosra, teesra) are not covered.
- Failing closed also rejects some harmless text: "O.K." before a price is read as a stray `K`. The user sees the reason and can reword.
- The set is self-written: it tests the attacks we thought of. It has not been run on LLM output (C2).

## 11. Templates
44 templates ([packages/planner/src/templates.ts](../../packages/planner/src/templates.ts)): one per option kind (11), language (English; Hinglish in Roman script only) and tone (polite, firm). A trade's condition is a fixed phrase per language (`CONDITION_TEXT`). Template ids are `T-<KIND>-<EN|HI>-<P|F>`. A template holds no digit, ₹ or %: every number is a slot filled from the `DraftRequest`, and each filled template must pass its own `checkDraft` for every condition (tested). A slot that would need the user's own words (for example the scope of the smaller job) is marked `[your edit: …]`, and the draft screen asks the user to replace it before copying. All wording is [HYPOTHESIS] and listed in [17_c1_review_checklist.md](17_c1_review_checklist.md).

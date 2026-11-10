# 13 · Price ladder spec (S2): the correctness core

Draft v0.3, 2026-11-11 (solo, no fixed deadline). Status: **approved 2026-11-11** (D-L1…D-L7 as recommended); §3.5 and §5.1–5.3 added after approval; v0.3 computes §3.5 from the rounded rungs. Tags: [EVIDENCE: path] · [HYPOTHESIS] · [GAP]. Every product choice inside a formula is marked **DECISION NEEDED** with a recommendation and the alternative.
The engine (`packages/engine`) implements exactly this document. The hand-verified examples in `packages/engine/test/hand_verified.json` are computed by Sandarbh **independently** from this spec. The engine author never generates or reads expected values before the engine is written [EVIDENCE: Phase A kickoff instruction, 2026-11-11].

## 1. The three numbers in plain words
| Number | Plain words | Label |
|---|---|---|
| **Floor** | The lowest price at which this work still pays you your monthly need for the time it takes, plus its direct costs. Below it, you are earning less than you need. It is your walk-away number. | CALCULATION |
| **Target** | What you aim to settle at: the floor plus a margin. | CALCULATION (margin = USER DECISION or RECOMMENDATION, §4) |
| **Opening** | Where you start: the target plus room to make one or two concessions and still land on target. | CALCULATION (anchor = USER DECISION or RECOMMENDATION, §4) |
The ladder never claims to be a market rate [EVIDENCE: 02_service_catalogue.md S2 guardrails].

## 2. Inputs
| Symbol | Field (UI wording) | Type and unit | Allowed range | Required? |
|---|---|---|---|---|
| `u` | "Per project, hour or month?" | enum `fixed` · `hour` · `month` | n/a | yes |
| `eu` | "Count work in days or hours?" | enum `day` · `hour` (forced to `hour` when `u = hour`) | n/a | yes |
| `e` | `fixed`: "How long will this project take?" · `month`: "How much of each month does this client take?" · `hour`: "Roughly how many hours in total?" | decimal in `eu`, ≤ 2 decimal places | > 0 and ≤ 10,000; for `month`: ≤ `K` | yes for `fixed`/`month`; for `hour` only when `C > 0` |
| `K` | "How many days (hours) can you bill in a month?" | decimal in `eu`, ≤ 2 decimal places | days: ≥ 1 and ≤ 31 · hours: ≥ 1 and ≤ 744 | yes (DECISION NEEDED D-L1) |
| `M` | "What do you need to earn in a month?" | whole rupees | ≥ 1 and ≤ ₹10,00,00,000 | yes |
| `C` | "Direct costs for this work" (tools, fonts, stock, subcontracting; for `month`: per month) | whole rupees | ≥ 0 and ≤ ₹10,00,00,000 | no; empty = 0, shown as USER DECISION "No costs" |
| `b` | "Buffer for revisions and unbilled time" | whole percent | 0–100 | no; empty = 0 |
| `t` | "Target margin above floor" | whole percent | 0–300 | DECISION NEEDED D-L2 |
| `a` | "Opening room above target" | whole percent | 0–300 | DECISION NEEDED D-L2 |
| `Q` | "What did you quote?" (optional) | whole rupees, same unit as `u` | ≥ 1 and ≤ ₹10,00,00,000 | no; used only for a marker (§3.4) |
Monthly need `M` means: what you want to earn in a month from client work, **before income tax**. All ladder values **exclude GST**. TDS a client may deduct is a tax credit, not a cost, so it is **not** in the formula (DECISION NEEDED D-L5) [HYPOTHESIS: tax treatment not verified; compliance cards are UNVERIFIED, EVIDENCE: docs/dataset-audit/compliance/].

## 3. Formulas
All arithmetic is **exact** (rational numbers; no floating point) until the final rounding step.

### 3.1 Floor
```
buffered effort      E  = e × (1 + b/100)
labour value         L  = M × E / K
total floor (exact)  F_total* = L + C
per-unit floor       F* = F_total*        when u = fixed   (₹ for the whole project)
                     F* = F_total*        when u = month   (₹ per month; e and C are per month)
                     F* = F_total* / e    when u = hour    (₹ per hour)
hour with no e:      F* = M × (1 + b/100) / K   (only allowed when C = 0)
```
Note the hourly case reduces to `F* = M × (1 + b/100) / K + C / e`: the buffer raises the rate for unbilled hours, and costs are spread over the estimated hours.

### 3.2 Target and opening
```
T* = F* × (1 + t/100)
O* = T* × (1 + a/100)
```
`T*` uses the **exact** `F*`, not the rounded floor (DECISION NEEDED D-L4).

### 3.3 Rounding
```
step s = ₹100 when u ∈ {fixed, month};  s = ₹10 when u = hour        (DECISION NEEDED D-L3)
ceil_s(x) = s × ⌈x / s⌉                                              (exact on rationals)
Floor   F = ceil_s(F*)
Target  T = ceil_s(T*)
Opening O = ceil_s(O*)
```
All three round **up** (DECISION NEEDED D-L3). Because `F* ≤ T* ≤ O*` and `ceil_s` never decreases, `F ≤ T ≤ O` always holds with no extra clamping.

### 3.4 Quote marker (does not change the ladder)
If `Q` is given, the ladder shows where it sits: `below floor` (Q < F) · `floor to target` (F ≤ Q < T) · `target to opening` (T ≤ Q < O) · `at or above opening` (Q ≥ O). Only this position and the difference `Q − F` (₹, CALCULATION) are shown. The client's counter offer later uses the same marker logic (Phase C) [EVIDENCE: 12_demo_script.md wow moment].

### 3.5 Concession room (added 2026-11-11, changed in v0.3)
How far you can come down from the opening you show and still be at the target you show, as a share of that opening. It uses the **rounded** rungs `T` and `O` (bigint), not `a`, so it matches the prices on screen: `concessionRoomPct = ⌊100 × (O − T) / O⌋`. Label: CALCULATION. Rounded down, so the line never overstates the room the displayed rungs give. Copy: "You can come down up to X% from your opening and still reach your target." If `O = T` the result is `0` and the UI does not show "0%"; it says "No room at this price: your opening and target are the same." Examples [CALCULATION]: the §3.6 illustration, `T` = 45,600 and `O` = 52,500 → 690,000 / 52,500 = 13.14… → **13%**; `hour` with an exact floor of ₹11 → rungs 20 / 20 / 20 → **0** ("no room at this price"). v0.2 used `⌊100a/(100 + a)⌋`, which ignores rounding and could promise room the rounded prices do not have (the ₹11/hour case: v0.2 says 13%, the rungs give 0). Rounding down is a spec choice made here, not in the approved D-L list [HYPOTHESIS: flag for review].

### 3.6 Trace (what "how we got this" shows)
Each step is one line with its inputs and result, e.g. for `fixed`, days:
```
Buffered days   = 7 × (1 + 0%)                = 7
Labour          = ₹90,000 × 7 ÷ 18            = ₹35,000
Floor (exact)   = ₹35,000 + ₹3,000 costs      = ₹38,000
Floor           = rounded up to ₹100          = ₹38,000
Target (exact)  = ₹38,000 × (1 + 20%)         = ₹45,600   → ₹45,600
Opening (exact) = ₹45,600 × (1 + 15%)         = ₹52,440   → ₹52,500
```
This illustration is the one already in [08_experience_and_brand.md](08_experience_and_brand.md) §7, worked by hand here; the 20% / 15% are the recommended defaults from D-L2 [HYPOTHESIS]. Exact intermediate values are shown with up to 2 decimals (rounded half-up for **display only**; the engine keeps them exact).

## 4. Decisions needed (recommendation first)
| # | Decision | Recommendation | Alternative | Cost of being wrong |
|---|---|---|---|---|
| D-L1 | Billable days/hours per month `K` | **required input**, no default; the first run gets a 5th field (08 §2 then needs a 1-line update) | prefilled "20 days" shown as a USER DECISION chip the user must confirm | default → a silent guess that moves every number (02 says "no guessed default") |
| D-L2 | Target margin `t` and opening room `a` | defaults **t = 20%, a = 15%**, shown as RECOMMENDATION chips with their reason, editable; once edited they become USER DECISION | no defaults: the user types target and opening, the engine only checks the order | defaults look authoritative though they are our guess [HYPOTHESIS]; no defaults slow the first run |
| D-L3 | Rounding | **round all three up** to ₹100 (`fixed`/`month`) or ₹10 (`hour`) | half-up for target and opening, up for floor; or "nice" steps of ₹500/₹1,000 | rounding down could put the floor under true cost; big steps add up to ₹999 of unexplained gap |
| D-L4 | Target from exact or rounded floor | **exact** `F*` | rounded `F` | rounded makes the trace easier to follow by hand but compounds rounding (target can rise by up to s × (1 + t)) |
| D-L5 | Taxes | ladder **excludes GST**; TDS not modelled; `M` is before income tax | include an "after-tax" mode | tax modelling needs verified cards (all UNVERIFIED today) |
| D-L6 | Buffer applies to | **effort only** (labour), not to costs | buffer on the whole floor (labour + costs) | costs are known amounts; buffering them overstates the floor |
| D-L7 | Hourly costs with no total hours | **error**: "Add total hours to spread your costs" | ignore costs for hourly | ignoring costs silently understates the floor |

## 5. Validation and edge cases
Validation runs **before** any arithmetic; an invalid input produces a field error and **no ladder** (no partial numbers).

### 5.1 Missing values (added 2026-11-11)
A field is **missing** when its key is absent **or** its value is `null` (so `"e": null` means "e is missing"). An empty string from a form field is converted to missing before validation. For optional fields, missing means the default in §2 (`C` = 0, `b` = 0); for `t` and `a`, missing means the recommended default (20 and 15, D-L2 approved).

### 5.2 Validation order (added 2026-11-11)
Exactly **one** error code is returned: the first failing check in this order. Checks 1–9 follow the form order, one field at a time; within a field, the type check comes before the range check. Cross-field checks (10–11) run only when every single-field check has passed.
| Order | Check | Code |
|---|---|---|
| 1 | `u` is one of `fixed`, `hour`, `month` | `u_invalid` |
| 2 | `eu` is `day` or `hour`; and `eu = hour` when `u = hour` | `eu_invalid` |
| 3 | `e` present when `u` is `fixed` or `month` | `e_missing` |
| 4 | `e`, if present: a finite number, > 0, ≤ 10,000, ≤ 2 decimal places | `e_out_of_range` |
| 5 | `K`: present, finite, ≤ 2 decimal places, 1–31 (days) or 1–744 (hours) | `K_out_of_range` |
| 6 | `M`: present and a whole number of rupees, then 1 to 10,00,00,000 | `not_whole_rupees`, then `M_out_of_range` |
| 7 | `C`, if present: whole rupees, then 0 to 10,00,00,000 | `not_whole_rupees`, then `C_out_of_range` |
| 8 | `b`, if present: whole number 0–100 | `b_out_of_range` |
| 9 | `t`, then `a`, if present: whole numbers 0–300 | `t_out_of_range`, then `a_out_of_range` |
| 10 | `u = month` and `e > K` | `e_exceeds_K` |
| 11 | `u = hour`, `e` missing and `C > 0` | `hour_costs_need_e` |
`M` that is missing returns `M_out_of_range`. A value that is not a number at all (text, `NaN`, `Infinity`) fails the range check of its field (for rupee fields: `not_whole_rupees`). The quote `Q` is **not** part of this order: an invalid `Q` never blocks the ladder and is reported separately as `quote.error` = `Q_out_of_range` or `not_whole_rupees` (§5.3). One test per ordering rule: each pair of adjacent checks gets an input that fails both and must return the earlier code [EVIDENCE: packages/engine/test/validation-order.test.ts, once written].

### 5.3 Result shape and warnings (added 2026-11-11)
A valid result: `{ ok: true, floor, target, opening, concessionRoomPct, unit, step, trace, label: "CALCULATION", warnings, quote }`. An invalid one: `{ ok: false, error: <code> }`.
- `warnings` is always an array of strings; empty when there is nothing to warn about.
- The only warning in Phase A is `"unusually_large"`, added when the **rounded** floor `F` is **strictly greater than ₹1,00,00,000**, for any unit. Its text: "Unusually large: check your inputs".
- `quote` is `null` when `Q` is missing, `{ position, differenceFromFloor }` when valid, and `{ error }` when invalid.
- `concessionRoomPct` (§3.5) is a whole percent from the rounded rungs; `0` when `O = T`.

### 5.4 Edge-case table
| Case | Behaviour | Message (field) |
|---|---|---|
| `e` = 0, negative, or missing (`fixed`/`month`) | error | "Add how long this takes" |
| `e` missing for `hour` with `C > 0` | error (D-L7) | "Add total hours to spread your costs" |
| `e` > 10,000, or more than 2 decimal places | error | "Check this number" |
| `month` and `e > K` | error | "This client takes more than you can bill in a month" |
| `K` < 1, or > 31 (days) / > 744 (hours) | error | "A month has at most 31 days (744 hours)" |
| `M` < 1 or > ₹10,00,00,000 | error | "Add what you need to earn in a month" / "Check this number" |
| `C` < 0 or > ₹10,00,00,000 | error | "Costs can't be negative" / "Check this number" |
| `b` outside 0–100, `t` or `a` outside 0–300, or not whole numbers | error | "Use a whole percent between 0 and …" |
| Rupee fields with paise, text, `NaN`, `Infinity`, empty required field | error | "Use whole rupees" / field-specific |
| `Q` ≤ 0 | error on the quote field only; ladder still shown | "Check your quote" |
| Very large but valid results (e.g. floor > ₹1,00,00,000) | computed exactly; a warning line "Unusually large: check your inputs" (still CALCULATION) | n/a |
| `t = 0` or `a = 0` | valid; `T = F` or `O = T` | n/a |
| Outputs | never negative, never zero (because `M ≥ 1`, `e > 0`), always a multiple of `s` | n/a |

## 6. Currency formatting
- `₹` + Indian digit grouping, no decimals: last three digits, then groups of two: `₹999`, `₹1,000`, `₹38,000`, `₹1,20,000`, `₹12,34,56,700`.
- Optional short form, **display only**, for values ≥ ₹1,00,000: lakh (1,00,000) and crore (1,00,00,000), two decimals at most, trailing zeros removed, rounded half-up: `₹1,25,000` → "₹1.25 lakh"; `₹2,40,00,000` → "₹2.4 crore". Short forms never feed calculations.
- Unit suffix: `/hour`, `/month`, none for `fixed`.
- Screen readers: "Floor, 38,000 rupees, calculation" [EVIDENCE: 08_experience_and_brand.md §6].
- Inputs accept digits with or without commas in either grouping (`120000`, `1,20,000`, `120,000`); shorthand like `45k`, `1.5L` or `30 hazaar` in **form fields** is **not** parsed in Phase A (the amount parser belongs to S4b, Phase B1) [EVIDENCE: 03_scope_and_cut_line.md].

## 7. Properties the engine must satisfy (become fast-check tests)
1. `F ≤ T ≤ O` for every valid input.
2. Monotonic: increasing `M`, `C`, `b`, `t` (for `T`, `O`) or `a` (for `O`) never lowers any output; increasing `K` never raises any output. Increasing `e` never lowers any output for `fixed` and `month`; for `hour` it never **raises** any output (costs are spread over more hours).
3. No negative or zero output; every output is a multiple of `s`.
4. Rounding is stable: `ceil_s(ceil_s(x)) = ceil_s(x)`; an exact value already on a step boundary is unchanged.
5. `F ≥ F*`, `T ≥ T*`, `O ≥ O*`, and each is less than its exact value plus `s`.
6. Invalid input → an error object and no numbers.
7. Every returned number carries the label CALCULATION and a trace.

## 8. Hand-verified examples: format and guidance for the spreadsheet
File: `packages/engine/test/hand_verified.json`, written by Sandarbh only:
```json
[
  { "id": "HV01", "note": "fixed, days, no buffer",
    "input": { "u": "fixed", "eu": "day", "e": 7, "K": 18, "M": 90000, "C": 3000, "b": 0, "t": 20, "a": 15 },
    "expected": { "floor": 0, "target": 0, "opening": 0 } },
  { "id": "HV09", "note": "should be rejected",
    "input": { "u": "month", "eu": "day", "e": 25, "K": 20, "M": 90000, "C": 0, "b": 0, "t": 20, "a": 15 },
    "expected": { "error": "e_exceeds_K" } }
]
```
(The zeros are placeholders for your own values.) A warning is written in `expected` with the **same key and value shape as the engine result**: `"warnings": ["unusually_large"]`. When `expected` has no `warnings` key, the engine must return an empty `warnings` array. `"e": null` in `input` means `e` is missing (§5.1). Error codes: `u_invalid`, `eu_invalid`, `e_missing`, `e_out_of_range`, `e_exceeds_K`, `K_out_of_range`, `M_out_of_range`, `C_out_of_range`, `b_out_of_range`, `t_out_of_range`, `a_out_of_range`, `not_whole_rupees`, `hour_costs_need_e` (order in §5.2); quote-only: `Q_out_of_range`.
Suggested coverage for your ≥ 10 examples [HYPOTHESIS]: each unit (`fixed` days, `fixed` hours, `hour` with and without `e`, `month`), a buffer > 0, `t = 0` and `a = 0`, a value that lands **exactly** on a step boundary, a value just above a boundary, a large valid value, and at least two errors.
**Spreadsheet trap:** spreadsheets use floating point, so an exact ₹38,000 can be stored as 38000.0000001 and `CEILING` then gives ₹38,100. Use `=CEILING(ROUND(x, 6), 100)` (or `, 10` for hourly). The engine uses exact arithmetic, so any mismatch on a boundary is a spreadsheet artefact to check first.

## 9. Out of scope for S2 in Phase A
Market benchmarks (S3, Phase C) · concession sizes (S5) · tax computation · currency other than INR · parsing shorthand in form fields.

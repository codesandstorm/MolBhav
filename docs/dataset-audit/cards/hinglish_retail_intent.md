# Hari5115/hinglish-retail-intent-dataset
Verdict: USE-WITH-CONDITIONS  | Role: ROBUSTNESS TEST

Tier 3. Small (≈97 KB [COMPUTED]), so it was downloaded and profiled by `audit_hinglish_extra.py`.

## Access and legal
- HF revision `3b4ab333bfeab463c9407911e958a5e6af6199ac` [VERIFIED]. Licence `license: mit` [VERIFIED].
- Provenance: "converted to natural Hinglish using the Anthropic Claude API … 10% of examples were manually spot-checked" [VERIFIED card]. Synthetic; `source` = synthetic for all 2,865 rows [COMPUTED].
- PII: 0 hits [COMPUTED].

## Integrity
- Rows train 2,292 / validation 286 / test 287 = 2,865 [COMPUTED] vs documented "~3,000 … ~2,400 / ~300 / ~300" [VERIFIED card]. Within the stated approximation, but about 135 fewer than 3,000.
- Exact dup 8.24%, normalised 9.53% [COMPUTED]. **36 test texts appear exactly in train** [COMPUTED]. The dataset's own test split leaks.

## Schema and labels
- Columns `text, label, source, split` [VERIFIED]. 13 intents, near-balanced (192–229 each) [COMPUTED]. `discount_query` 229 rows is the only price-adjacent label [COMPUTED].
- Mapping to T1: not a negotiation act set. discount_query → INFO_REQUEST/REJECT (low). Everything else is OTHER.

## Task-specific (T2)
- Devanagari 0%; Roman with a Hindi function word 98.53%; negotiation keywords 10.33% [COMPUTED]. Short: mean 12.17 words [COMPUTED].

## Recommended use
- Role: ROBUSTNESS TEST (Hinglish customer-service register; checks that the T1 model does not fire ANCHOR/REJECT on ordinary complaints, and the discount_query subset probes BUDGET-objection recall).
- Effort about 1 h. Risk: synthetic LLM text plus internal test leakage. Dedupe before use.

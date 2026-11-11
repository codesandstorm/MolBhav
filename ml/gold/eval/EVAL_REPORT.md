# Evaluation report (S4a / S4b)

**Status: stub. No gold messages exist yet; the test split is not frozen; nothing has been scored.** [GAP]

When `npm run gold:split` runs (after blind label pass 1), it rewrites this file with the test split's sha256, the split seed, the guidelines version and per-class counts, before any training [EVIDENCE: docs/product/04_research_integrity.md §2 step 5].

Every result added later is stated as "on N self-authored test messages, directional", with a 95% bootstrap interval (2,000 resamples, seed 42) and per-class support; any class with fewer than 10 test items is marked "too few to score" [EVIDENCE: 04 §2.2].

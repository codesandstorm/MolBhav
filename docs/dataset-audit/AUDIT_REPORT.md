# MolBhav public-dataset audit: roll-up

Audit date 2026-11-10. Deadline 2026-11-15. Every number carries a tag: [VERIFIED] read in the source this session, [COMPUTED] measured by `ml/scripts/audit/*.py` (seed 42), [UNVERIFIED] reported but not checked. Per-dataset detail lives in `cards/`; machine-readable versions are `catalogue.csv` and `label_mapping.csv`. Regenerate everything with `sh ml/scripts/audit/run_all.sh`.

Ground rule restated: no public dataset contains Indian freelancer–client negotiations. Public data is auxiliary only. Our own 30 scenarios plus the annotated gold set are the only real test set. Overlap between public data and repo files is 0 shared 8-grams today [COMPUTED], but no gold/scenario files exist in the repo yet. Re-run `audit_dialogues.py` (it checks docs/ and data/) once they are added in a private location.

## 1. Decision table

| # | dataset | verdict | role | licence | measured size | mapped-label coverage (any / non-OTHER) | domain fit 1-5 | effort h | blockers |
|---|---|---|---|---|---|---|---|---|---|
| 1 | CaSiNo | USE-WITH-CONDITIONS | AUXILIARY TRAIN | CC-BY-4.0 [VERIFIED] | 1,030 dlg, 4,615 annotated utts [COMPUTED] | 100% / 25.87% [COMPUTED] | 2 | 3 | drop `participant_info` |
| 2 | Language of Bargaining | RESEARCH-ONLY | AUXILIARY TRAIN (after access) | CC-BY-NC-SA-4.0 + DLA [VERIFIED tag] | not measurable (HTTP 401) [COMPUTED] | UNVERIFIED | 4 [UNVERIFIED] | 4 | **HF gate + DLA (you must accept)** |
| 3 | Persuasion for Good | USE-WITH-CONDITIONS | AUGMENT | Apache-2.0 (original) [VERIFIED] | 1,017 conv, 20,932 utts, 6,136 labelled [COMPUTED] | 100% / 42.54% [COMPUTED] | 2 | 2 | drop MTurk worker IDs + demographics |
| 4 | Deal or No Deal | RESEARCH-ONLY | SKIP | CC-BY-NC-4.0 (LICENSE file) [VERIFIED] | 5,207/562/545 unique dlg [COMPUTED] | 0% (no labels) [COMPUTED] | 2 | 3 | NC; unlabelled |
| 5 | HingBERT family | USE-WITH-CONDITIONS | PRETRAIN (backbone) | CC-BY-4.0 model [VERIFIED]; corpus CC-BY-NC-SA [VERIFIED] | hing-bert 109.5M, hing-roberta 278.3M params [COMPUTED] | n/a | 4 | 2 | RoBERTa needs Colab [ESTIMATE] |
| 6 | CraigslistBargain | RESEARCH-ONLY | AUXILIARY TRAIN | unknown [VERIFIED] | 5,247/597/838 dlg [COMPUTED] | 75.56% / 58.52% [COMPUTED] | 3 | 4 | licence unknown |
| 7 | CMU Hinglish DoG | USE-WITH-CONDITIONS | ROBUSTNESS TEST | CC-BY-SA-3.0 + GFDL tags [VERIFIED] | 8,060/942/960 rows [COMPUTED] | n/a (no labels) | 1 (T1) / 3 (T2) | 1 | share-alike |
| 8 | SO Developer Survey 2026 | USE-WITH-CONDITIONS | BENCHMARK EVIDENCE | ODbL 1.0 / DbCL 1.0 [VERIFIED] | 30,903 × 212; India 1,309 [COMPUTED] | n/a | 3 | 2 | India-freelance INR n=73 [COMPUTED] |
| 9 | India Tech Career Intelligence [1M] | **DO-NOT-USE** | SKIP | CC BY 4.0 [VERIFIED] | **100,000 rows (not 1M)** [COMPUTED] | n/a | 0 | 0 | synthetic data [COMPUTED] |
| 10 | HinGE | RESEARCH-ONLY | SKIP | UNVERIFIED | not downloaded | n/a | 2 | 2 | download location unknown |
| 11 | IND (IIT Patna) | RESEARCH-ONLY | SKIP | UNVERIFIED | not downloaded | UNVERIFIED | UNVERIFIED | n/a | signed agreement (you) |
| 12a | gooftagoo | USE-WITH-CONDITIONS | PRETRAIN | Apache-2.0 [VERIFIED] | 16,207 conv / 106,834 turns [COMPUTED] | n/a | 2 | 1 | LLM-generated |
| 12b | hinglish-retail-intent | USE-WITH-CONDITIONS | ROBUSTNESS TEST | MIT [VERIFIED] | 2,865 rows [COMPUTED] | n/a | 2 | 1 | 36 test texts in train [COMPUTED] |
| 13 | CUAD / ContractNLI / LEDGAR | USE-W-C / RESEARCH-ONLY / USE-W-C | SKIP (T5 later) | CC-BY-4.0 / CC-BY-NC-SA-4.0 (mirror) / CC-BY-4.0 tags [VERIFIED] | not downloaded | n/a | 1 | 6 | T5 is optional |
| 14 | Kaggle Upwork (3) | DO-NOT-USE | SKIP | ODC-By for the 50K set [VERIFIED]; others UNVERIFIED | not downloaded | n/a | 2 | 0 | platform terms; 2 of 3 not found |

Verdict count over the 17 catalogue rows [COMPUTED from catalogue.csv]: USE 0; USE-WITH-CONDITIONS 9 (CaSiNo, P4G, HingBERT, Hinglish DoG, SO Survey, gooftagoo, retail-intent, CUAD, LEDGAR); RESEARCH-ONLY 6 (LoB, DND, CraigslistBargain, HinGE, IND, ContractNLI); DO-NOT-USE 2 (India Tech Career, Kaggle Upwork).

### Label coverage per our T1 label (annotated utterances, [COMPUTED])

| our label [COMPUTED] | CaSiNo (4,615) | CraigslistBargain (38,791) | P4G (6,136) |
|---|---|---|---|
| ANCHOR | 0 (+1,181 Submit-Deal actions, low) | 4,517 | 613 (low/medium) [COMPUTED] |
| COND_CONCESSION | 560 (low) | 627 derived (low) | 0 [COMPUTED] |
| UNCOND_CONCESSION | 169 (low) | 3,295 derived (low) | 0 [COMPUTED] |
| REJECT_OR_COUNTER | 131 | 11,051 | 250 [COMPUTED] |
| INFO_REQUEST | 334 | 5,205 | 1,565 [COMPUTED] |
| ACCEPT | 0 (+1,005 Accept-Deal actions) | 1,929 (+5,025 accept actions) | 182 [COMPUTED] |
| OTHER | 3,421 | 6,610 | 3,526 [COMPUTED] |
| UNMAPPABLE | 0 | 9,479 | 0 [COMPUTED] |

COND vs UNCOND concession is **not annotated in any accessible dataset**. It only appears as low-confidence proxies (CaSiNo promote-coordination/no-need) or as a price-movement heuristic (CraigslistBargain). Language of Bargaining's "allowance" label is the only explicit concession act, and it is gated. **Objection types (BUDGET, SCOPE, TIMELINE, PAYMENT_TERMS, TRUST) are annotated nowhere.** They must come from our own labelling.

## 2. Ranked shortlist for the next 5 days
1. **CraigslistBargain → AUXILIARY TRAIN** (about 4 h). Best accessible buyer/seller price data. 24.57% of utterances carry an amount [COMPUTED]. Use it for ANCHOR / REJECT_OR_COUNTER / ACCEPT / INFO_REQUEST and "$" amount extraction. Drop `unknown`. Mark it research-only in the report.
2. **HingBERT (hing-bert) → backbone** (about 2 h). Fine-tune locally with fp16, max_len 128 [ESTIMATE]. Try hing-roberta on Colab if time allows.
3. **CaSiNo → AUXILIARY TRAIN** (about 3 h). Expert labels for INFO_REQUEST / REJECT plus deal actions. Concession proxies at low weight only.
4. **SO Survey 2026 → Evidence Log (ESTIMATE)** (about 2 h). India INR annual comp, median Rs 10,00,000 (n=658 before filtering) [COMPUTED]. Filter outliers and recompute before quoting.
5. **Hinglish robustness pack** (about 2 h): CMU Hinglish DoG (negative/OOD) + hinglish-retail-intent (deduped). Our own Hinglish paraphrases of the 30 scenarios remain the real T2 test.
6. Language of Bargaining, **only if** you accept the gate today and the DLA allows the project use (about 4 h).
7. P4G as a small AUGMENT set for refusals and BUDGET-objection phrasing (about 2 h), if time remains.
Skip: Mendeley (synthetic), Kaggle Upwork, DND, HinGE, IND, contract sets.

## 3. Everything marked UNVERIFIED
- Language of Bargaining: all data-level facts (counts, labels, IAA, PII), the DLA terms, collection method.
- CaSiNo: inter-annotator agreement values (paper Table 2 not read).
- P4G: IAA; whether ConvoKit's MIT-style licence is meant to cover the corpus.
- DND: crowd-worker platform.
- CraigslistBargain: whether the phone-pattern hits are real phone numbers.
- CMU Hinglish DoG: how the Hinglish side was produced (human vs MT).
- HingBERT: GPU fit is an ESTIMATE (not benchmarked); whether NC-SA of HingCorpus binds the weights.
- India Tech Career: salary unit (annual?).
- HinGE: download location, dataset licence; the 4,803 / 3,952 counts [VERIFIED, caveat] come from a flattened table.
- IND: everything (name, paper, size, licence, access procedure).
- gooftagoo: generator model; OpenHermes sample terms.
- ContractNLI official licence; LEDGAR original licence; CUAD size/labels.
- Kaggle: "freelance contracts 1.3M" [UNVERIFIED] and kanchana1990 datasets (not found); the 50K set's columns; Upwork's anti-scraping clause.
- **All three compliance items (TDS s.393(1), GST export/LUT, MSME 45-day/43B(h))**: primary sources unreachable by automated fetch. See `compliance/`.

## 4. Discrepancies: documented vs measured
| dataset | documented | measured | difference |
|---|---|---|---|
| India Tech Career Intelligence | 1,000,000 rows [VERIFIED] | 100,000 rows [COMPUTED] | −900,000 (−90%) |
| Deal or No Deal | 10,095 / 1,087 / 1,052 "examples" [VERIFIED] | 5,207 / 562 / 545 unique dialogues [COMPUTED] | every dialogue stored twice (one per perspective) |
| Deal or No Deal licence | HF tag cc-by-4.0 [VERIFIED] | LICENSE file CC BY-NC 4.0 [VERIFIED] | tag is wrong |
| Persuasion for Good | 300 annotated dialogs [VERIFIED] | 300 with labels, but `is_annotated`=true on 217 [COMPUTED] | 83 conversations flagged wrongly |
| P4G licence (brief) | "ConvoKit copy Apache-2.0" | ConvoKit LICENSE is MIT-style [VERIFIED]; original GitLab is Apache-2.0 [VERIFIED] | brief conflated the two |
| CraigslistBargain (brief) | "dialogue_acts looked empty" | 38,791 intents in train+val; empty only in test [COMPUTED] | test-only, as the card documents |
| CMU Hinglish DoG (brief) | "no known licence" | HF tags cc-by-sa-3.0 + gfdl [VERIFIED] | card text is blank, tags exist |
| hinglish-retail-intent | ~3,000 (~2,400/~300/~300) [VERIFIED] | 2,865 (2,292/286/287) [COMPUTED] | −135 vs the round figure |
| HinGE (paper itself) | 1,978 pairs (text) [VERIFIED] | 1,976 pairs (Table 1) [VERIFIED] | internal inconsistency of 2 |
| Kaggle (brief) | "all jobs on Upwork 200k+" | closest found is a 50K-record set [VERIFIED] | probably a different dataset |
| P4G download (brief) | `persuasionforgood-corpus.zip` | HTTP 404; real file `persuasionforgood.zip` [COMPUTED] | URL |
| HF ids (brief) | `deal_or_no_dialog`, `craigslist_bargains`, `cmu_hinglish_dog` | redirect to `mikelewis0/…`, `stanfordnlp/…`, `festvox/…` [VERIFIED] | moved namespaces |
| SO Survey (brief) | "latest year" | 2026 available [VERIFIED] | n/a |
| Matches | CaSiNo 1,030/396/4,615; CraigslistBargain 5,247/597/838; Hinglish DoG 8,060/942/960; P4G 1,017 conv / 1,285 users; SO 30,903 rows; Mendeley sha256 | identical [COMPUTED] | none |

## 5. Environment notes
- Windows Application Control blocked DLLs from pandas 3.1.1 and pyarrow 26 [COMPUTED]. pandas 2.2.3 and pyarrow 17.0.0 work and are pinned in `ml/scripts/audit/requirements-audit.txt`. The `datasets` library is installed but unused (it now needs pyarrow ≥ 24). The security policy was not changed.
- The folder was not a git repository. `git init` was run (no commits) so `git check-ignore` could verify `data/raw/` is ignored.

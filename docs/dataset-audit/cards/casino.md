# CaSiNo (Campsite Negotiation Dialogues)
Verdict: USE-WITH-CONDITIONS  | Role: AUXILIARY TRAIN

Audited 2026-11-10. Tags: [VERIFIED] read in source this session, [COMPUTED] measured by `ml/scripts/audit/audit_dialogues.py`, [UNVERIFIED] reported but not checked.

## Access and legal
- Official: HF `kchawla123/casino`, revision `290898d2d08b6591db17005504e40ce00ac1028e` [VERIFIED], https://huggingface.co/datasets/kchawla123/casino ; GitHub https://github.com/kushalchawla/CaSiNo (branch `main`, files `data/casino.json`, `data/split/casino_{train,valid,test}.json`) [VERIFIED]. No gate (`gated: false`) [VERIFIED].
- Licence: CC-BY-4.0. HF metadata `license: cc-by-4.0`; card text "The project is licensed under CC-by-4.0" [VERIFIED, HF README]. GitHub `LICENSE` first line "Attribution 4.0 International" [VERIFIED]. No conflict between sources. Not non-commercial, not share-alike. Attribution: cite Chawla et al., NAACL 2021 (bibtex in the HF card).
- Provenance: "The dialogues were crowdsourced on Amazon Mechanical Turk. The strategy annotations were performed by expert annotators (first three authors of the paper)." [VERIFIED, HF README]. Low platform risk.
- PII: the card says "All personally identifiable information about the participants such as MTurk Ids or HIT Ids was removed" [VERIFIED]. Regex full pass over 11,919 text utterances [COMPUTED]: email 0, phone 0, url 0, handle 0, long_id 1. BUT each dialogue carries `participant_info` (demographics + personality survey) [VERIFIED in casino.json], and utterances contain voluntary health/family self-disclosures (seen in 3 of 50 sampled utterances [COMPUTED]).
- Verdict reasoning: clean permissive licence and expert labels. Conditions: drop `participant_info`, keep the attribution, and never quote self-disclosures.

## Integrity
- Files [COMPUTED, sha256 in data/checksums.txt]: `train.parquet` 1,247,368 B (HF); `casino.json` 4,300,019 B; `split_train.json` 3,763,692 B; `split_valid.json` 112,116 B; `split_test.json` 424,211 B.
- Dialogues: 1,030 measured [COMPUTED] = 1,030 documented [VERIFIED, HF card table]. Annotated dialogues: 396 measured = 396 documented. Annotated utterances: 4,615 measured = 4,615 documented [VERIFIED, quote "396 dialogues containing 4615 utterances"].
- HF has a single `train` split with all 1,030 [VERIFIED]. GitHub split: train 900 / valid 30 / test 100 dialogues [COMPUTED].
- Utterances: 14,297 chat-log entries [COMPUTED] = 11,919 text + 2,378 deal-action tokens (Submit-Deal 1,181, Accept-Deal 1,005, Reject-Deal 167, Walk-Away 25) [COMPUTED].
- Duplicates (text utterances): exact 302 (2.53%), normalised 631 (5.29%) [COMPUTED]; empty 0; encoding problems 0 [COMPUTED]. ≤2-word utterances 454 [COMPUTED].

## Schema and labels
- Fields [VERIFIED in casino.json]: `dialogue_id` (int), `chat_logs` (list of {text: str, task_data: dict, id: "mturk_agent_1|2"}), `participant_info` (per-agent value2issue, value2reason, outcomes, demographics, personality), `annotations` (list of [utterance_text, "comma,separated,labels"]).
- Labels: 10 strategy labels, multi-label (968 of 4,615 annotated utterances have >1 label [COMPUTED]). Provenance: expert (3 authors) [VERIFIED]. IAA: Krippendorff's alpha reported in paper Table 2 [VERIFIED that it exists; values UNVERIFIED, Table 2 not read].
- Distribution (label occurrences, n=5,858) [COMPUTED]: non-strategic 1,455 (24.84%), small-talk 1,054 (17.99%), self-need 964 (16.46%), promote-coordination 579 (9.88%), vouch-fair 439 (7.49%), other-need 409 (6.98%), elicit-pref 377 (6.44%), showing-empathy 254 (4.34%), no-need 196 (3.35%), uv-part 131 (2.24%).
- Mapping to T1 (full table in `label_mapping.csv`). Utterance label = highest priority (ACCEPT > REJECT_OR_COUNTER > ANCHOR > COND > UNCOND > INFO_REQUEST > OTHER). Over 4,615 annotated utterances [COMPUTED]: OTHER 3,421 (74.13%), COND_CONCESSION 560 (12.13%, low confidence, from promote-coordination), INFO_REQUEST 334 (7.24%), UNCOND_CONCESSION 169 (3.66%, low confidence, from no-need), REJECT_OR_COUNTER 131 (2.84%). Mapped at all: 100%; mapped to a non-OTHER move: 25.87% [COMPUTED].
- Deal actions map cleanly [COMPUTED]: ACCEPT 1,005, REJECT_OR_COUNTER 167, ANCHOR (Submit-Deal, low) 1,181.
- Concession flag: COND vs UNCOND concession is NOT annotated. Both mapped counts are proxies. Explicit "If you want X then I…" utterances exist but are unlabelled (sample #9). ANCHOR in the money sense does not exist (no prices).
- Objection types: none annotated. self-need/other-need are rationales, the nearest thing to objections.

## Domain fit
50 utterances sampled (seed 42) and read [COMPUTED: sample file `_out/samples_casino.json`, gitignored].
- Domain: splitting 3 camping items (food/water/firewood) between two campers. Roles: symmetric peers (mturk_agent_1/2), no buyer/seller or freelancer/client.
- Explicit money amount: 0/50 in sample, 0.01% full pass [COMPUTED]. Digits (item counts): 16/50 sample, 32.26% full pass [COMPUTED].
- Firm wording 0.65%, soft wording 24.89% full pass (regex lexicon) [COMPUTED]. Register: informal, friendly, emoji, English only.
- Main mismatch: no price, no rate unit, no money. Moves are package trades with long personal-need stories. Good for move structure and concession phrasing, useless for amount extraction.
- Good examples (short, de-identified): "How's this... one of us gets 2 waters,1 firewood and 2 foods, the other 1 water, 2 firewoods and 1 food." (package offer); "If you want two firewood then I would like to request 3 water and 2 food then." (conditional concession); "Which supplies do you need?" (INFO_REQUEST).
- Worst examples: an utterance disclosing a pregnancy-related health need (not quoted, sensitive); "for my additional package I select my priorities and package" (meaningless); "me also good dear friend, how is yours," (noise).

## Task-specific checks
- T1: numeric offers (money) ≈0% [COMPUTED]. Item-count offers are common but not money. Turn length: mean 19.19 words, p50 16, p90 36, p99 65, max 150 [COMPUTED].
- T2: English only, not Hinglish.

## Risks and leakage
- Cross-dataset: exact normalised utterances (≥6 words) shared with CraigslistBargain 25, P4G 26, DND 11; 8-gram shingles 77/37/65 [COMPUTED]. These are generic greetings. Negligible.
- Overlap with our repo files: 0 shared 8-grams. No scenario/gold files exist in the repo yet [COMPUTED: `repo_files_checked: []`]. Re-run once the gold set is added (privately).
- Own test split (GitHub `casino_test.json`, 100 dialogues) exists: keep it untouched if you report CaSiNo numbers. 7 test utterances (≥6 words) also appear in train/valid [COMPUTED].

## Recommended use
- Role: AUXILIARY TRAIN (multi-task head for INFO_REQUEST / REJECT_OR_COUNTER / ACCEPT, plus weak-label concession phrasing).
- Expected benefit: medium for move structure, none for amounts. Effort: about 3 h (flatten, map, drop participant_info).
- Main risk: the low-confidence COND/UNCOND proxies teach the wrong concession boundary. Down-weight them or exclude them from concession training.

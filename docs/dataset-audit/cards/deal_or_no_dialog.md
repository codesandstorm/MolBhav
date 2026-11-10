# Deal or No Deal (Lewis et al. 2017)
Verdict: RESEARCH-ONLY  | Role: SKIP

Audited 2026-11-10.

## Access and legal
- HF id `deal_or_no_dialog` now redirects (HTTP 307) to `mikelewis0/deal_or_no_dialog`, revision `de8a685ff1624e1d7f57f6cb3b635518fe7b8113` [VERIFIED]. The HF repo has only a loading script (`deal_or_no_dialog.py`) that pulls raw files from GitHub `facebookresearch/end-to-end-negotiator` `src/data/negotiate/{train,val,test,selfplay}.txt` [VERIFIED, script lines 39-42]. Raw files downloaded from that official repo. No gate.
- **Licence conflict, confirmed**:
  - HF metadata `license: cc-by-4.0` [VERIFIED].
  - HF card text "The project is licenced under CC-by-NC" [VERIFIED].
  - Loading script `_LICENSE = "The project is licenced under CC-by-NC"` [VERIFIED].
  - GitHub README "This project is licenced under CC-by-NC, see the LICENSE file for details." [VERIFIED].
  - GitHub `LICENSE` first line "Attribution-NonCommercial 4.0 International" [VERIFIED].
  - Resolution: treat as **CC BY-NC 4.0** (the original repo's LICENSE file). The HF tag is wrong. NC yes, SA no.
- Provenance: crowdsourced (AMT) multi-issue item negotiation [UNVERIFIED: worker platform not re-read]. PII regex full pass (31,359 utts) [COMPUTED]: 0 hits in every category.

## Integrity
- Files [COMPUTED]: train.txt 4,325,861 B; val.txt 468,508 B; test.txt 444,703 B; selfplay.txt 98,304 B.
- Lines measured train 10,095 / val 1,087 / test 1,052 / selfplay 8,172 [COMPUTED] = HF `num_examples` 10,095 / 1,087 / 1,052 / 8,172 [VERIFIED].
- **Discrepancy**: each dialogue is stored twice (once per perspective, YOU/THEM swapped). Unique dialogues are train 5,207 / val 562 / test 545 [COMPUTED]. "selfplay" contains only `<input>` contexts, no dialogue [COMPUTED].
- Utterances (deduped dialogues): 37,673 incl. 6,314 `<selection>` markers; 31,359 text [COMPUTED]. Duplicate texts: exact 29.78%, normalised 32.99% (very short formulaic turns) [COMPUTED]. ≤2-word turns 5,789 [COMPUTED].

## Schema and labels
- Line format [VERIFIED]: `<input> counts/values </input> <dialogue> YOU: … <eos> THEM: … <selection> </dialogue> <output> item0=… </output> <partner_input> … </partner_input>`. All text is lowercased and tokenised.
- Labels: **no utterance-level labels** [COMPUTED: 0 labelled]. Only outcome/selection. Mapping: 0% mappable (`<selection>` = UNMAPPABLE). COND/UNCOND concession not recoverable without our own labelling.

## Domain fit
50 sampled (seed 42), read [COMPUTED].
- Domain: dividing books/hats/balls. Roles YOU/THEM, symmetric. Money 0/50 (0.0% full pass); digits 8/50 (item counts) [COMPUTED]. Firm 0.63%, soft 8.39% [COMPUTED]. Register: terse, lowercase, typos.
- Mismatch: no money, no roles, no labels.
- Good: "i will let you have the hats if i can have both balls" (COND_CONCESSION); "you can have both , i don't need them" (UNCOND_CONCESSION); "what about 1 basketball and 1 hat ?" (counter).
- Worst: "looks we headed to a no dela"; "sorry i am worng"; a fabricated sympathy story used as leverage.

## Task-specific checks
- T1: numeric money offers 0% [COMPUTED]. Turn length mean 8.88 words, p50 8, p90 17, max 70 [COMPUTED].

## Risks and leakage
- 279 test utterances (≥6 words) also occur in train/val [COMPUTED]. These are formulaic phrases; any DND benchmark is optimistic.
- Cross-dataset overlap tiny [COMPUTED]. Repo overlap 0 [COMPUTED].

## Recommended use
- Role: SKIP for the 5-day window. Possible later use: weak-label "if … then" conditional concessions for augmentation.
- Effort if used: about 3 h. Main risk: NC licence plus tokenised lowercase text that does not match real chat.

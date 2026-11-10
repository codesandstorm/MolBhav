# CMU Hinglish DoG (Document-Grounded Conversations, Hinglish)
Verdict: USE-WITH-CONDITIONS  | Role: ROBUSTNESS TEST

Audited 2026-11-10.

## Access and legal
- HF id `cmu_hinglish_dog` redirects (HTTP 307) to `festvox/cmu_hinglish_dog`, revision `19796c6fb32020154cb2745d48704fa73e29b17d` [VERIFIED]. Parquet files `data/{train,validation,test}-00000-of-00001.parquet` downloaded [COMPUTED]. No gate.
- Licence: HF metadata tags `license: cc-by-sa-3.0` and `license: gfdl` [VERIFIED]. Card "Licensing Information: [More Information Needed]" [VERIFIED]. **Conflict with the brief** ("no known licence"): the metadata does declare CC-BY-SA-3.0/GFDL (Wikipedia-style). The card text gives no licence. Treat as CC BY-SA 3.0: attribution plus share-alike on derived data.
- Provenance: Hinglish versions of CMU DoG movie conversations (card: "text conversations in Hinglish … and their corresponding English versions") [VERIFIED]. How the Hinglish was produced (human vs MT) [UNVERIFIED]. 4.49% of rows contain schwa-retaining forms typical of machine transliteration ("karata", "aapako", "vah") [COMPUTED].
- PII regex full pass (9,962) [COMPUTED]: email/phone/url/handle 0, long_id 9. Columns `uid`, `user2_id` (e.g. "USR…") are pseudonymous IDs [VERIFIED]. Drop them.

## Integrity
- Files [COMPUTED]: train 843,924 B, validation 96,336 B, test 99,568 B.
- Rows train 8,060 / validation 942 / test 960 [COMPUTED] = documented train 8,060, validation 942, test 960 [VERIFIED HF `num_examples`]. Match. (The brief's 8,060/942/960 matches.)
- Conversations by (uid1LogInTime, user2_id): 205 / 27 / 27 [COMPUTED, heuristic grouping; there is no conversation id].
- Duplicates exact 8.23%, normalised 9.85% [COMPUTED]. Empty 0; encoding issues 0.

## Schema and labels
- Columns [VERIFIED]: date, docIdx, translation{en, hi_en}, uid, utcTimestamp, rating, status, uid1LogInTime, uid1LogOutTime, uid1response, uid2response, user2_id, whoSawDoc, wikiDocumentIdx.
- Labels: none (translation pairs only) [COMPUTED]. Mapping: UNMAPPABLE.

## Domain fit
50 sampled (seed 42), read [COMPUTED].
- Domain: chatting about movies. Roles user1/user2. No negotiation: negotiation-keyword rows 112 (1.12%), mostly "rating"/"deal" false positives [COMPUTED + read].
- Script: Roman only 99.94% (6 Devanagari rows) [COMPUTED]. Rows with ≥1 Hindi function word 87.37% [COMPUTED]. English-token share (tokens also in the parallel English sentence), sample of 500: mean 0.254, median 0.238 [COMPUTED]. So it is Hindi-dominant Hinglish.
- Good (natural Hinglish): "Main isse se agree krta huin." ; "lekin isey rotten tomatoes par 86% mila" ; "hello, plot ke baare mein kuch bol sakthe?"
- Worst: machine-transliterated formal Hindi ("vah isalie nahin kyonki vah … pyaar karata hai"); garbled "moonstone yis nav ke liye dilchusp nam lega"; one-word "Haan".

## Task-specific checks
- T2: Roman script, code-mixed, informal. Spelling variants (krta/karta, achha/accha) [read]. Turn length mean 11.68 words, p50 9, max 341 [COMPUTED].

## Risks and leakage
- 0 overlap with the other datasets [COMPUTED]. Repo overlap 0. Test split exists (960 rows); test utterances also in other splits: 0 [COMPUTED].

## Recommended use
- Role: ROBUSTNESS TEST. Use it as a negative/OOD set: the T1 classifier should predict OTHER/NONE on Hinglish small talk (false-positive rate), and it checks tokenizer/LID behaviour on Roman Hinglish.
- Benefit: medium for T2. Effort: about 1 h. Main risk: share-alike plus machine-transliterated rows inflate "Hinglish" difficulty. Filter on the marker list.

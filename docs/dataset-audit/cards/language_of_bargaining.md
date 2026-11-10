# Language of Bargaining (ChicagoHAI)
Verdict: RESEARCH-ONLY (BLOCKED: gated, data not inspected)  | Role: AUXILIARY TRAIN (only after access)

Audited 2026-11-10. Only the public card was readable. Every data-level number below is [UNVERIFIED].

## Access and legal
- Official: HF `ChicagoHAI/language-of-bargaining`, revision `557477102c9b2130acf56905db6d1eb2e0136ff0` [VERIFIED]. Files: `README.md`, `negotiations-data.zip` [VERIFIED, HF API siblings]. Gate: `gated: auto` [VERIFIED]. Downloading the zip without accepting returned HTTP 401 [COMPUTED].
- Licence: HF metadata `license: cc-by-nc-sa-4.0` [VERIFIED]. Card gate text: "All the data within this repo are under this [Data License Agreement](https://drive.google.com/file/d/1VXLYPIgd8rm6SoLXaH97KeDqwYmEmFc5/view?usp=share_link)." [VERIFIED, HF README front-matter]. The agreement document was NOT read; its terms are [UNVERIFIED]. NC: yes. SA: yes. Possible extra DLA restrictions: unknown.
- Gate form fields [VERIFIED]: First Name, Last Name, Email, Affiliation, Job Title, plus the checkbox "By clicking Submit below I acknowledge that I have read the data license agreement, understand it, and agree to be bound by its terms and conditions". **Not clicked. You must do this yourself (see OPEN_QUESTIONS.md).**
- Provenance: paper https://aclanthology.org/2023.acl-long.735 [VERIFIED link in card]. Collection method (lab participants, spoken negotiation over a house price, transcribed) [UNVERIFIED].
- PII: card says "We replaced all occurences of participant names with the token `[PERSON]`." [VERIFIED]. Regex pass not possible [UNVERIFIED].

## Integrity
- Documented: 230 AO files (`ao/*.jsonl`) and 178 NL files (`nl/*.json`) [VERIFIED, card text]. Measured: not possible (gated) [UNVERIFIED]. No checksums.

## Schema and labels
- From the card [VERIFIED]: NL turns are word-level rows with `ID, Role (seller|buyer), Word, Span, Spoken Numeric, Numeric, Category, Firm or Soft, External Incentive`. Category codes: `n` numeric offer, `p` push, `a` allowance, `c` comparison, `r` repetition, `e` end/acceptance. Firm/soft codes `s`/`f`.
- Label provenance: human annotators following the instructions in the card [VERIFIED that instructions exist]. Annotator type and IAA [UNVERIFIED].
- Proposed mapping (card-based, all [UNVERIFIED] until data is read): n→ANCHOR (medium; may also be a counter), p→REJECT_OR_COUNTER, a→UNCOND_CONCESSION (COND_CONCESSION if External Incentive = y, low), c→OTHER (comparison justification), r→REJECT_OR_COUNTER (low), e→ACCEPT. This is the only audited dataset that explicitly labels **firm vs soft numbers** and **allowance (concession without a number)**, both directly relevant to MolBhav.

## Domain fit
- Not sampled (gated). From the card: buyer/seller bargaining over a numeric price, with numbers spoken aloud ("234,000" thousands flag), so likely high amount density [UNVERIFIED].

## Task-specific checks
- T1: Numeric field and span labels exist per the schema [VERIFIED]. Counts [UNVERIFIED].

## Risks and leakage
- NC-SA plus DLA: derived data/models may need to stay non-commercial and share-alike. Keep the raw data out of git (already enforced by .gitignore).
- No documented train/test split [VERIFIED: none in card].

## Recommended use
- Role: AUXILIARY TRAIN for ANCHOR / REJECT_OR_COUNTER / UNCOND_CONCESSION plus firm/soft, once access is granted.
- Expected benefit: potentially high (best-labelled price negotiation). Effort: about 4 h (word rows → utterances).
- Main risk: the DLA may forbid redistribution of derived annotations or use in an app demo. Read it before training.

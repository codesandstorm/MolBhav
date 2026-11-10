# HinGE (Srivastava & Singh, Eval4NLP 2021)
Verdict: RESEARCH-ONLY (data location and licence not found)  | Role: SKIP

Tier 3, metadata only. Pages were read this session by a web-fetch helper. Quotes come from its report and are tagged [VERIFIED] only where it returned a verbatim quote plus URL.

## Access and legal
- Paper: https://aclanthology.org/2021.eval4nlp-1.20/ and https://arxiv.org/abs/2107.03760 (both HTTP 200) [VERIFIED].
- Download location: **not found**. Neither page links a data repo. https://github.com/vivek-srivastava/HinGE returned 404. A GitHub repo search for "HinGE hinglish" returned no matching repo [COMPUTED]. The real download is [UNVERIFIED].
- Licence of the dataset: not found [UNVERIFIED]. The arXiv paper itself is "License: CC BY 4.0" [VERIFIED, arxiv.org/html/2107.03760v1]. That licenses the paper, not necessarily the data.

## Integrity (documented only)
- "We obtain 1,978 sentence pairs with two or more unique Hinglish sentences." [VERIFIED, arXiv HTML]. Table 1 shows 1,976 pairs [VERIFIED, flattened table]. **Internal discrepancy: 1,978 vs 1,976.** The brief's 1,976 matches the table.
- Human-generated Hinglish sentences: 4,803 (Table 1, HGHS column; flattened-table reading) [VERIFIED with caveat]. Machine-generated: 3,952 [VERIFIED with caveat].
- Production: "we employ five human annotators" plus two rule-based generators (WAC, PAC) [VERIFIED]. Source: IIT-B English-Hindi parallel corpus [VERIFIED].
- Measured counts: none (not downloaded).

## Domain fit / tasks
- General-domain parallel sentences (IIT-B corpus), not negotiation. Possible T2 use: human Hinglish rewrites as a robustness/paraphrase source.

## Recommended use
- Role: SKIP in the 5-day window. Find the data via the authors (see OPEN_QUESTIONS.md). Effort if found: about 2 h.

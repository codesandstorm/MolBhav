# Tensoic/gooftagoo
Verdict: USE-WITH-CONDITIONS  | Role: PRETRAIN

Tier 3. The file is small (24.9 MB [COMPUTED]), so it was downloaded after Tier 1-2 finished. Profiled by `audit_hinglish_extra.py`.

## Access and legal
- HF `Tensoic/gooftagoo`, revision `7b3d6d0e34c8c7c16a25ae02ef75956953417fec`, file `data.csv` 24,882,592 B [VERIFIED/COMPUTED]. No gate.
- Licence: `license: apache-2.0` [VERIFIED card]. Card: "This dataset was generated, please note that some content may not be entirely precise" [VERIFIED]. It also includes "about 1k samples from Openhermes 2.5" [VERIFIED], and OpenHermes has its own terms [UNVERIFIED]. Generator model not named [UNVERIFIED].
- PII regex (106,834 turns) [COMPUTED]: email 1, phone 5, url 9, handle 5, long_id 2. Not individually reviewed.

## Integrity
- 16,207 conversations, 0 unparsable; 106,834 user/assistant turns [COMPUTED]. Exact dup 0.96%, normalised 1.05%, empty 5 [COMPUTED].
- No splits.

## Task-specific (T2)
- Devanagari turns 3.37%; Roman turns with a Hindi function word 96.6% [COMPUTED]. Negotiation keywords 6.66%; amount pattern 0.04% [COMPUTED].
- Long assistant-style turns: mean 36.69 words, p50 28 [COMPUTED]. That is a chatbot register, not chat between people.

## Recommended use
- Role: PRETRAIN (optional domain-adaptive MLM on Roman Hinglish). Low priority. Effort about 1 h. Risk: LLM-generated text is not real user Hinglish.

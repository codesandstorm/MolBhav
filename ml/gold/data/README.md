# ml/gold/data/ (local, not committed)

Everything in this folder except this README is gitignored (root `.gitignore`), until the owner decides to commit it. Nothing here is ever sent anywhere: the tools run on 127.0.0.1 only.

| File | Written by | Contents |
|---|---|---|
| `messages.jsonl` | writing tool (`npm run gold:write`) | one self-authored client message per card: `id`, `text`, `source: "self_authored"`, `card_id`, `language`, `labels` (null until adjudication), `meta` (writing time) |
| `skipped.json` | writing tool | card ids you skipped |
| `labels_v1.jsonl` | blind labelling, pass 1 (`npm run gold:label`) | labels v1, with labelling time |
| `labels_v2.jsonl` | test-retest pass (`npm run gold:label -- --pass v2`, ≥ 14 days later) | labels v2 |
| `labels_llm.jsonl`, `llm_run.json` | LLM second annotator (`npm run gold:annotate`; no provider chosen yet) | LLM labels; the prompt, its sha256, model, version, date |
| `adjudication.jsonl` | the owner | every resolved disagreement with its reason |
| `splits/` | `npm run gold:split` (once, after pass 1) | train / dev / test; the test hash is recorded in `ml/gold/eval/frozen.json` |

Rules [EVIDENCE: docs/product/04_research_integrity.md §2]:
- Every message is written by the author, one per card, and never presented as a real client message.
- Never put test fixtures here; a test fails if any row's `source` is not `self_authored`.
- Check the files at any time with `npm run gold:validate`; see measured times with `npm run gold:timing`.
- **If you commit this folder after freezing**, commit `splits/test.jsonl` with `ml/gold/eval/frozen.json`, so the hash test can run in CI.

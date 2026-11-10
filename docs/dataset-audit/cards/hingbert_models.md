# L3Cube HingBERT family (models, `l3cube-pune`)
Verdict: USE-WITH-CONDITIONS  | Role: PRETRAIN (backbone for T1/T2 fine-tuning)

Audited 2026-11-10 by `ml/scripts/audit/audit_models.py` (config/tokenizer/README only, no weights downloaded).

## Access and legal
| model | revision | licence tag | card line | params (≈, from weight file) | max positions | tokenizer | vocab |
|---|---|---|---|---|---|---|---|
| l3cube-pune/hing-bert | `62cf31a13d65` [VERIFIED] | cc-by-4.0 [VERIFIED] | "license: cc-by-4.0" [VERIFIED] | 109.5M [COMPUTED] | 512 [VERIFIED config] | BertTokenizer | 30,522 |
| l3cube-pune/hing-roberta | `f714c4bdce6b` [VERIFIED] | cc-by-4.0 [VERIFIED] | "license: cc-by-4.0" [VERIFIED] | 278.3M [COMPUTED] | 514 | XLMRobertaTokenizer | 250,002 |
| l3cube-pune/hing-mbert | `8de0a17b6cda` [VERIFIED] | cc-by-4.0 [VERIFIED] | "license: cc-by-4.0" [VERIFIED] | 178.0M [COMPUTED] | 512 | BertTokenizer | 119,547 |
| l3cube-pune/hing-roberta-mixed | `52fe19a4ed44` [VERIFIED] | cc-by-4.0 [VERIFIED] | "license: cc-by-4.0" [VERIFIED] | 278.3M [COMPUTED] | 514 | XLMRobertaTokenizer | 250,002 |
| l3cube-pune/hing-bert-lid | `e92bc7378faf` [VERIFIED] | cc-by-4.0 [VERIFIED] | "license: cc-by-4.0" [VERIFIED] | 108.9M [COMPUTED] | 512 | BertTokenizer | 30,522 |

- All are ungated [VERIFIED]. Paper: https://arxiv.org/abs/2204.08398 [VERIFIED link in card].
- **Licence inheritance risk**: hing-bert card says it is "fine-tuned on L3Cube-HingCorpus" [VERIFIED]. The corpus repo (https://github.com/l3cube-pune/code-mixed-nlp) says "L3Cube-HingCorpus, and L3Cube-HingLID is licensed under a … Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License" and the corpus was "scraped from Twitter" [VERIFIED, repo README]. Model CC-BY-4.0 vs training data CC-BY-NC-SA: whether NC/SA flows to weights is legally unsettled. Treat as safe for a non-commercial student project; flag before any commercial use.
- PII: not applicable to weights; the pretraining data are tweets [VERIFIED].

## Integrity
- Weight file sizes [VERIFIED from HF API]: hing-bert model.safetensors 438,085,080 B; hing-roberta pytorch_model.bin 1,113,264,555 B (no safetensors); hing-mbert 711,926,000 B; hing-roberta-mixed 1,113,209,296 B.

## Task-specific checks (RTX 3050 4 GB)
- hing-bert / hing-bert-lid (≈110M params): fp32 weights ≈0.44 GB [COMPUTED]. Full fine-tune with AdamW fp32 ≈1.75 GB for weights + gradients + optimiser states [COMPUTED estimate = 4 × weights], plus activations. **ESTIMATE: fits on 4 GB with fp16 mixed precision, max_len 128, batch 16.** Not benchmarked.
- hing-roberta (≈278M): fp32 weights 1.11 GB; ×4 ≈4.45 GB [COMPUTED estimate] before activations. **ESTIMATE: needs Colab (T4 16 GB)**, or LoRA/8-bit on the 3050.
- hing-mbert (≈178M): ≈2.85 GB ×4 [COMPUTED estimate], borderline. Use Colab.
- Messages are short (most negotiation turns <64 words in every corpus audited), so max_len 128 is enough [COMPUTED from length stats].

## Recommended use
- Role: PRETRAIN backbone. Start with hing-bert locally; try hing-roberta on Colab if time allows.
- Effort: about 2 h to wire up. Main risk: the NC-SA question on the training corpus. Cite both the model and HingCorpus.

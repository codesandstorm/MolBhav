"""Write docs/dataset-audit/catalogue.csv (one row per dataset).

Usage: .venv/Scripts/python -I ml/scripts/audit/build_catalogue.py
Numeric cells marked [COMPUTED] are pulled from _out/*.json so they stay in sync with the audit scripts.
"""
from __future__ import annotations

import csv
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from common import REPO, load_json  # noqa: E402

D = load_json("dialogues_stats")
T = load_json("tabular_stats")
H = load_json("hinglish_extra_stats")
M = load_json("models_stats")


def c(x):
    return f"{x} [COMPUTED]"


def prof(ds, key):
    return c(D[ds]["profile"][key])


COLS = ["dataset", "tier", "task", "official_url", "revision", "access", "gate", "licence", "licence_conflict",
        "non_commercial", "share_alike", "provenance", "pii_findings", "verdict", "role", "documented_size",
        "measured_size", "size_discrepancy", "label_provenance", "mapped_any_pct", "mapped_non_other_pct",
        "concession_recoverable", "amount_pattern_pct", "firm_pct", "soft_pct", "language_script",
        "domain_fit_1to5", "own_test_split", "effort_hours", "main_risk", "card"]

cas, cb, p4g, dnd, hd = (D[k] for k in ("casino", "craigslist_bargains", "persuasionforgood", "deal_or_no_dialog", "cmu_hinglish_dog"))
so, mi = T["so_survey_2026"], T["india_tech_career_1m"]
go, rt = H["gooftagoo"], H["hinglish_retail_intent"]

ROWS = [
    ["casino", 1, "T1", "https://huggingface.co/datasets/kchawla123/casino", "290898d2d08b", "HF + GitHub", "none",
     "CC-BY-4.0 [VERIFIED]", "none", "no", "no", "MTurk crowd; expert labels [VERIFIED]",
     "regex: 1 long_id; participant_info demographics; health self-disclosures in text", "USE-WITH-CONDITIONS", "AUXILIARY TRAIN",
     "1030 dlg / 396 ann dlg / 4615 ann utts [VERIFIED]",
     c(f"{cas['meta']['dialogues']} / {cas['meta']['annotated_dialogues']} / {cas['labelled_utterances']}"), "none",
     "expert (3 authors)", c(cas["mapped_any_pct"]), c(cas["mapped_non_other_pct"]), "proxy only (low)",
     prof("casino", "amount_pattern_pct"), prof("casino", "firm_pct"), prof("casino", "soft_pct"), "English", 2,
     "yes (GitHub test, 100 dlg)", 3, "low-confidence concession proxies", "cards/casino.md"],
    ["language_of_bargaining", 1, "T1", "https://huggingface.co/datasets/ChicagoHAI/language-of-bargaining", "557477102c9b",
     "HF gated", "accept DLA form", "CC-BY-NC-SA-4.0 + DLA [VERIFIED tag; DLA unread]", "DLA terms unknown", "yes", "yes",
     "UNVERIFIED", "names replaced by [PERSON] [VERIFIED card]", "RESEARCH-ONLY", "AUXILIARY TRAIN (after access)",
     "230 AO + 178 NL [VERIFIED card]", "BLOCKED: HTTP 401 [COMPUTED]", "not measurable", "human (type UNVERIFIED)",
     "UNVERIFIED", "UNVERIFIED", "allowance label exists (UNVERIFIED)", "UNVERIFIED", "UNVERIFIED", "UNVERIFIED",
     "English (transcribed)", "4 (UNVERIFIED)", "none documented", 4, "DLA may restrict use", "cards/language_of_bargaining.md"],
    ["persuasionforgood", 1, "T1", "https://gitlab.com/ucdavisnlp/persuasionforgood (ConvoKit zip)", "ConvoKit zip 2019-10-18",
     "ConvoKit zip", "none", "Apache-2.0 original GitLab [VERIFIED]; ConvoKit code MIT-style [VERIFIED]",
     "brief said ConvoKit Apache-2.0; ConvoKit LICENSE is MIT-style", "no", "no", "MTurk crowd [VERIFIED]",
     "1284/1285 MTurk-style worker IDs [COMPUTED]; demographics; text: 1 email,1 phone,9 url,11 long_id", "USE-WITH-CONDITIONS",
     "AUGMENT", "1017 conv / 300 ann [VERIFIED]",
     c(f"{p4g['meta']['conversations']} conv / 300 labelled (is_annotated flag {p4g['meta']['annotated_conversations']}) / {p4g['utterances_total']} utts"),
     "is_annotated flag 217 vs 300 labelled", "human", c(p4g["mapped_any_pct"]), c(p4g["mapped_non_other_pct"]), "no",
     prof("persuasionforgood", "amount_pattern_pct"), prof("persuasionforgood", "firm_pct"), prof("persuasionforgood", "soft_pct"),
     "English", 2, "none", 2, "worker IDs; donation vocabulary", "cards/persuasionforgood.md"],
    ["deal_or_no_dialog", 1, "T1", "https://github.com/facebookresearch/end-to-end-negotiator", "HF de8a685ff162", "GitHub raw", "none",
     "CC-BY-NC-4.0 (LICENSE file) [VERIFIED]", "HF tag cc-by-4.0 vs card/LICENSE CC-by-NC", "yes", "no", "crowd (UNVERIFIED)",
     "0 regex hits [COMPUTED]", "RESEARCH-ONLY", "SKIP", "10095/1087/1052/8172 lines [VERIFIED]",
     c(f"same lines; {dnd['meta']['train_unique_dialogues']}/{dnd['meta']['val_unique_dialogues']}/{dnd['meta']['test_unique_dialogues']} unique dialogues"),
     "each dialogue stored twice", "none (unlabelled)", c(0.0), c(0.0), "no", prof("deal_or_no_dialog", "amount_pattern_pct"),
     prof("deal_or_no_dialog", "firm_pct"), prof("deal_or_no_dialog", "soft_pct"), "English lowercased", 2, "yes", 3,
     "NC; no labels", "cards/deal_or_no_dialog.md"],
    ["hingbert_models", 1, "T2", "https://huggingface.co/l3cube-pune", M["l3cube-pune/hing-bert"]["sha"][:12], "HF", "none",
     "CC-BY-4.0 [VERIFIED]", "trained on HingCorpus CC-BY-NC-SA, Twitter-scraped [VERIFIED]", "model no / data yes",
     "model no / data yes", "Twitter-scraped pretraining corpus [VERIFIED]", "n/a", "USE-WITH-CONDITIONS", "PRETRAIN", "n/a",
     c(f"hing-bert {M['l3cube-pune/hing-bert']['approx_params_M']}M; hing-roberta {M['l3cube-pune/hing-roberta']['approx_params_M']}M params"),
     "n/a", "n/a", "n/a", "n/a", "n/a", "n/a", "n/a", "n/a", "Roman Hinglish", 4, "n/a", 2,
     "NC-SA inheritance; RoBERTa needs Colab (ESTIMATE)", "cards/hingbert_models.md"],
    ["craigslist_bargains", 2, "T1", "https://huggingface.co/datasets/stanfordnlp/craigslist_bargains (CodaLab)", "cfb6992c5ca9",
     "CodaLab", "none", "unknown [VERIFIED]; cocoa code MIT", "none (licence simply unknown)", "unknown", "unknown",
     "Craigslist-scraped listings + AMT dialogues [VERIFIED]", "15 phone-pattern, 3 url, 1 handle (unreviewed) [COMPUTED]",
     "RESEARCH-ONLY", "AUXILIARY TRAIN", "5247/597/838 [VERIFIED]",
     c(f"{cb['meta']['train_dialogues']}/{cb['meta']['validation_dialogues']}/{cb['meta']['test_dialogues']}"),
     "none; dialogue_acts empty only in test", "rule-based", c(cb["mapped_any_pct"]), c(cb["mapped_non_other_pct"]),
     c(f"derived: {cb['derived_concessions']}"), prof("craigslist_bargains", "amount_pattern_pct"),
     prof("craigslist_bargains", "firm_pct"), prof("craigslist_bargains", "soft_pct"), "English, USD", 3,
     "yes (838, no labels)", 4, "unknown licence; noisy rule labels", "cards/craigslist_bargains.md"],
    ["cmu_hinglish_dog", 2, "T2", "https://huggingface.co/datasets/festvox/cmu_hinglish_dog", "19796c6fb320", "HF", "none",
     "cc-by-sa-3.0 + gfdl tags [VERIFIED]; card text none", "brief said no licence; tags exist", "no", "yes",
     "CMU DoG movie chats, Hinglish (method UNVERIFIED)", "pseudonymous uid/user2_id; 9 long_id [COMPUTED]",
     "USE-WITH-CONDITIONS", "ROBUSTNESS TEST", "8060/942/960 [VERIFIED]",
     c(f"{hd['meta']['train_rows']}/{hd['meta']['validation_rows']}/{hd['meta']['test_rows']}"), "none", "none", "n/a", "n/a",
     "no", prof("cmu_hinglish_dog", "amount_pattern_pct"), prof("cmu_hinglish_dog", "firm_pct"), prof("cmu_hinglish_dog", "soft_pct"),
     c(f"Roman {hd['hinglish']['roman_only_pct']}%; Hindi fn word {hd['hinglish']['rows_with_hindi_function_word_pct']}%"),
     "1 (T1) / 3 (T2)", "yes (960)", 1, c(f"machine-transliteration markers {hd['hinglish']['machine_transliteration_marker_pct']}%"),
     "cards/cmu_hinglish_dog.md"],
    ["so_survey_2026", 2, "T3", "https://survey.stackoverflow.co/2026", "GitHub main (pushed 2026-11-01)", "GitHub LFS", "none",
     "ODbL 1.0 data / DbCL 1.0 contents [VERIFIED]", "repo code Apache-2.0", "no", "yes (ODbL derived DB)",
     "self-reported survey", "0 regex hits [COMPUTED]", "USE-WITH-CONDITIONS", "BENCHMARK EVIDENCE",
     "30903 responses [VERIFIED schema]", c(f"{so['rows']} x {so['cols']}; India {so['india_rows']}; India freelance {so['india_freelance_rows']}"),
     "none", "n/a", "n/a", "n/a", "n/a", "n/a", "n/a", "n/a", "n/a", 3, "n/a", 2,
     c(f"India-freelance INR n={so['india_freelance_inr_comp_quantiles']['n']}"), "cards/so_survey_2026.md"],
    ["india_tech_career_1m", 2, "T3", "https://data.mendeley.com/datasets/h2rmbfr68t/1", "v1 (sha256 f69a8de1, matches)", "Mendeley",
     "none", "CC BY 4.0 [VERIFIED]", "none", "no", "no", "claims aggregated public sources; synthetic signs [COMPUTED]",
     "0 hits [COMPUTED]", "DO-NOT-USE", "SKIP", "1,000,000 rows, 33 fields [VERIFIED]", c(f"{mi['rows']} rows, {mi['cols']} fields"),
     c(f"{mi['rows'] - 1000000} rows"), "n/a", "n/a", "n/a", "n/a", "n/a", "n/a", "n/a", "n/a", 0, "n/a", 0,
     "synthetic salaries", "cards/india_tech_career_1m.md"],
    ["hinge", 3, "T2", "https://aclanthology.org/2021.eval4nlp-1.20/", "n/a", "not found", "unknown", "UNVERIFIED (paper CC BY 4.0)",
     "n/a", "UNVERIFIED", "UNVERIFIED", "human + rule-based Hinglish from IIT-B corpus [VERIFIED]", "UNVERIFIED", "RESEARCH-ONLY",
     "SKIP", "1976 pairs (table) / 1978 (text); 4803 human sents [VERIFIED]", "not downloaded", "1976 vs 1978 inside paper",
     "human + rule", "n/a", "n/a", "n/a", "n/a", "n/a", "n/a", "Roman Hinglish", 2, "UNVERIFIED", 2, "data location unknown",
     "cards/hinge.md"],
    ["ind_iitp", 3, "T1", "https://www.iitp.ac.in/~ai-nlp-ml/resources.html", "n/a", "signed agreement (UNVERIFIED)", "agreement",
     "UNVERIFIED", "n/a", "UNVERIFIED", "UNVERIFIED", "UNVERIFIED", "UNVERIFIED", "RESEARCH-ONLY", "SKIP", "UNVERIFIED",
     "not downloaded", "n/a", "UNVERIFIED", "n/a", "n/a", "n/a", "n/a", "n/a", "n/a", "UNVERIFIED", "UNVERIFIED", "UNVERIFIED", "n/a",
     "access lead time", "cards/ind_iitp.md"],
    ["gooftagoo", 3, "T2", "https://huggingface.co/datasets/Tensoic/gooftagoo", "7b3d6d0e34c8", "HF", "none", "Apache-2.0 [VERIFIED]",
     "includes OpenHermes samples (terms UNVERIFIED)", "no", "no", "LLM-generated [VERIFIED card]",
     c(f"{go['profile']['pii_hits']} (unreviewed)"), "USE-WITH-CONDITIONS", "PRETRAIN", "not stated",
     c(f"{go['conversations']} conv / {go['turns']} turns"), "n/a", "n/a", "n/a", "n/a", "n/a",
     c(go["profile"]["amount_pattern_pct"]), c(go["profile"]["firm_pct"]), c(go["profile"]["soft_pct"]),
     c(f"Roman+Hindi fn word {go['script']['roman_with_hindi_function_word_pct']}%; Devanagari {go['script']['devanagari_pct']}%"),
     2, "none", 1, "synthetic register", "cards/gooftagoo.md"],
    ["hinglish_retail_intent", 3, "T2", "https://huggingface.co/datasets/Hari5115/hinglish-retail-intent-dataset", "3b4ab333bfea",
     "HF", "none", "MIT [VERIFIED]", "none", "no", "no", "Claude-API generated [VERIFIED card]", "0 hits [COMPUTED]",
     "USE-WITH-CONDITIONS", "ROBUSTNESS TEST", "~3000 (~2400/~300/~300) [VERIFIED]", c(f"{rt['rows']} {rt['rows_per_split']}"),
     c(f"{rt['rows'] - 3000} vs ~3000"), "LLM + 10% manual spot-check", "n/a", "n/a", "n/a",
     c(rt["profile"]["amount_pattern_pct"]), c(rt["profile"]["firm_pct"]), c(rt["profile"]["soft_pct"]),
     c(f"Roman+Hindi fn word {rt['script']['roman_with_hindi_function_word_pct']}%"), 2,
     c(f"yes, but {rt['test_texts_exactly_in_train']} test texts in train"), 1, "test leakage; synthetic", "cards/hinglish_retail_intent.md"],
    ["cuad", 3, "T5", "https://huggingface.co/datasets/theatticusproject/cuad", "a3c393f5d103", "HF", "none", "CC-BY-4.0 tag [VERIFIED]",
     "n/a", "no", "no", "SEC EDGAR contracts [VERIFIED file names]", "n/a", "USE-WITH-CONDITIONS", "SKIP", "UNVERIFIED",
     "not downloaded", "n/a", "UNVERIFIED", "n/a", "n/a", "n/a", "n/a", "n/a", "n/a", "English legal", 1, "UNVERIFIED", 6,
     "US contracts", "cards/contract_datasets.md"],
    ["contractnli", 3, "T5", "https://stanfordnlp.github.io/contract-nli/", "HF mirror 059927b911", "HF mirror", "none",
     "mirror tag CC-BY-NC-SA-4.0 [VERIFIED]; official UNVERIFIED", "mirror vs official unknown", "yes (mirror)", "yes (mirror)",
     "NDAs", "n/a", "RESEARCH-ONLY", "SKIP", "UNVERIFIED", "not downloaded", "n/a", "UNVERIFIED", "n/a", "n/a", "n/a", "n/a",
     "n/a", "n/a", "English legal", 1, "UNVERIFIED", 6, "licence unclear", "cards/contract_datasets.md"],
    ["ledgar", 3, "T5", "https://huggingface.co/datasets/coastalcph/lex_glue (config ledgar)", "c23fdff1a6", "HF", "none",
     "LexGLUE CC-BY-4.0 tag [VERIFIED]", "LEDGAR original licence UNVERIFIED", "no", "no", "SEC filings [VERIFIED card]", "n/a",
     "USE-WITH-CONDITIONS", "SKIP", "UNVERIFIED", "not downloaded", "n/a", "UNVERIFIED", "n/a", "n/a", "n/a", "n/a", "n/a", "n/a",
     "English legal", 1, "yes (UNVERIFIED)", 6, "US contracts", "cards/contract_datasets.md"],
    ["kaggle_upwork (3 datasets)", 3, "T3", "https://www.kaggle.com/datasets/asaniczka/upwork-job-postings-dataset-2024-50k-records",
     "v1 2024-02-24", "Kaggle (login for download)", "Kaggle account", "ODC-By for the 50K set [VERIFIED API]; others UNVERIFIED",
     "uploader licence vs Upwork terms", "no", "no", "Upwork postings, collection method unstated [VERIFIED]", "UNVERIFIED",
     "DO-NOT-USE", "SKIP", "brief: 1.3M / 200k+ / unknown [UNVERIFIED]", "50K set found; other two not found",
     "200k+ vs 50K", "n/a", "n/a", "n/a", "n/a", "n/a", "n/a", "n/a", "n/a", 2, "n/a", 0, "platform-terms risk",
     "cards/kaggle_upwork.md"],
]

if __name__ == "__main__":
    assert all(len(r) == len(COLS) for r in ROWS), [len(r) for r in ROWS]
    with open(REPO / "docs" / "dataset-audit" / "catalogue.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(COLS)
        w.writerows(ROWS)
    print(f"wrote {len(ROWS)} rows")

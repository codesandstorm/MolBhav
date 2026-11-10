# data/: inventory (no data in git)

Raw downloads live in `data/raw/<name>/`, which is **gitignored** (verified with `git check-ignore`). Interview data and personal data never enter this repo. Re-download with `.venv/Scripts/python -I ml/scripts/audit/download.py [name]`. SHA-256 for every file is in `data/checksums.txt` (regenerate: `ml/scripts/audit/checksums.py`). Details are in `docs/dataset-audit/`.

| name | URL | licence | size on disk | role | owner | private copy |
|---|---|---|---|---|---|---|
| casino | https://huggingface.co/datasets/kchawla123/casino | CC-BY-4.0 | 9.5 MB [COMPUTED] | AUXILIARY TRAIN | TBD | data/raw/casino/ (local) |
| language_of_bargaining | https://huggingface.co/datasets/ChicagoHAI/language-of-bargaining | CC-BY-NC-SA-4.0 + DLA (gated) | not downloaded | AUXILIARY TRAIN after access | TBD | none yet |
| persuasionforgood | https://zissou.infosci.cornell.edu/convokit/datasets/persuasionforgood-corpus/ | Apache-2.0 (original GitLab) | 21 MB (zip + extracted) [COMPUTED] | AUGMENT | TBD | data/raw/persuasionforgood/ |
| deal_or_no_dialog | https://github.com/facebookresearch/end-to-end-negotiator | CC-BY-NC-4.0 | 5.2 MB [COMPUTED] | SKIP | TBD | data/raw/deal_or_no_dialog/ |
| craigslist_bargains | https://huggingface.co/datasets/stanfordnlp/craigslist_bargains (CodaLab) | unknown (research only) | 25 MB [COMPUTED] | AUXILIARY TRAIN | TBD | data/raw/craigslist_bargains/ |
| cmu_hinglish_dog | https://huggingface.co/datasets/festvox/cmu_hinglish_dog | CC-BY-SA-3.0 / GFDL (tags) | 1.1 MB [COMPUTED] | ROBUSTNESS TEST | TBD | data/raw/cmu_hinglish_dog/ |
| so_survey_2026 | https://survey.stackoverflow.co/2026 | ODbL 1.0 / DbCL 1.0 | 122 MB [COMPUTED] | BENCHMARK EVIDENCE | TBD | data/raw/so_survey_2026/ |
| india_tech_career_1m | https://data.mendeley.com/datasets/h2rmbfr68t/1 | CC BY 4.0 | 59 MB [COMPUTED] | SKIP (synthetic) | TBD | data/raw/india_tech_career_1m/ (can delete) |
| gooftagoo | https://huggingface.co/datasets/Tensoic/gooftagoo | Apache-2.0 | 25 MB [COMPUTED] | PRETRAIN (optional) | TBD | data/raw/gooftagoo/ |
| hinglish_retail_intent | https://huggingface.co/datasets/Hari5115/hinglish-retail-intent-dataset | MIT | 0.1 MB [COMPUTED] | ROBUSTNESS TEST | TBD | data/raw/hinglish_retail_intent/ |
| models_meta (HingBERT READMEs only) | https://huggingface.co/l3cube-pune | CC-BY-4.0 | <0.1 MB [COMPUTED] | PRETRAIN backbone | TBD | data/raw/models_meta/ |
| hinge, ind_iitp, cuad, contractnli, ledgar, kaggle_upwork | see docs/dataset-audit/catalogue.csv | various | not downloaded | SKIP | TBD | none |

Sizes are from `du -sh` on 2026-11-10 [COMPUTED]. Owner and shared-drive location are TBD (see docs/dataset-audit/OPEN_QUESTIONS.md).

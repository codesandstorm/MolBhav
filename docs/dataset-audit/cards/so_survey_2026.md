# Stack Overflow Developer Survey 2026
Verdict: USE-WITH-CONDITIONS  | Role: BENCHMARK EVIDENCE

Audited 2026-11-10 by `ml/scripts/audit/audit_tabular.py`.

## Access and legal
- Latest year available: **2026** [VERIFIED: https://survey.stackoverflow.co/ lists "Stack Overflow Developer Survey 2026" with contentUrl `…/packages/archive/2026/survey_results_public.csv`]. Repo https://github.com/StackExchange/Survey (last push 2026-11-01) [VERIFIED]. The CSV is Git LFS; downloaded from media.githubusercontent.com. sha256 matches the LFS oid `ad520b4d…` [COMPUTED].
- Licence: survey site footer "Survey data licensed under … ODbL 1.0, contents under … DbCL 1.0" [VERIFIED, survey.stackoverflow.co HTML]. The GitHub repo licence is Apache-2.0 for code [VERIFIED, GitHub API]. ODbL: attribution plus share-alike for a derived *database* that is publicly used. Not NC.
- Provenance: self-reported online survey respondents. No scraping.
- PII: `ResponseId` is "Sequential public respondent identifier; not the internal Qualtrics ID." [VERIFIED, schema]. Regex pass over 67 free-text-like columns: 0 hits in every category [COMPUTED].

## Integrity
- Files [COMPUTED]: survey_results_public.csv 122,407,316 B; survey_results_schema.csv 93,937 B.
- Rows 30,903 measured [COMPUTED] = 30,903 documented (schema `nonmissing` for ResponseId) [VERIFIED]. 212 columns [COMPUTED]. Duplicate rows (excluding ResponseId) 1,055 [COMPUTED]. These are likely sparse, mostly-empty responses; not removed.
- Missing [COMPUTED]: Country 30.85%, Currency 32.2%, Compensation 53.25%, ConvertedCompYearly 56.29%, WorkExp 20.37%.

## Schema (T3 fields)
- `Compensation` [VERIFIED schema]: "current total annual compensation (salary, bonuses, and perks, before taxes …) … If you are paid hourly, please estimate an equivalent yearly salary." Unit: **year**, local currency.
- `Currency` (day-to-day currency), `Country`, `Employment`, `WorkExp`, `ConvertedCompYearly` ("converted to USD using the saved compensation workflow") [VERIFIED].
- No role/skill column named DevType in 2026; role-like columns are `CodeMain`, `ICorPM` [COMPUTED column list]. Date range: survey year 2026 only.

## Task-specific checks (T3)
- Employment [COMPUTED]: Employed 20,259; "Independent contractor, freelancer, or self-employed" 4,607; Student 3,139.
- India rows 1,309 [COMPUTED]; India currency INR 1,207, USD 43 [COMPUTED]. India freelancers 163, of which 79 gave compensation (73 in INR) [COMPUTED].
- India INR annual compensation, n=658 [COMPUTED]: p10 0, p25 120,250, median 1,000,000, p75 2,900,000, p90 5,000,000, max 1,000,000,000,000. 88 zeros; 136 < Rs 10,000/yr; 2 > Rs 5 cr/yr [COMPUTED]. Rows in a plausible Rs 1 lakh–10 cr band: 502 [COMPUTED].
- India freelancer INR (n=73): median 1,000,000, p25 100,000, p75 2,400,000 [COMPUTED]. Tiny sample.
- India USD-converted (n=552): median 16,713, p25 6,267, p75 34,534 [COMPUTED].
- Round numbers: 70.0% divisible by 1,00,000; 85.26% by 10,000 [COMPUTED]. Last digit 0 in 619 of 658 [COMPUTED]. This is human heaping, the opposite of synthetic. No synthetic-generation signs.

## Domain fit
- Developers (global), including 4,607 freelancers [COMPUTED]. Annual figures, not per-project or hourly rates. India freelance n is small.

## Risks and leakage
- No text; no leakage risk to the gold set. Outliers must be filtered (≥ Rs 1 lakh and ≤ Rs 10 cr suggested).

## Recommended use
- Role: BENCHMARK EVIDENCE. Evidence Log rows labelled **ESTIMATE** (self-reported, annual, small India-freelance n), e.g. "India developers, INR annual total comp, median Rs 10 L (n=658 after filtering; SO Survey 2026, ODbL)". Recompute after filtering before quoting. Never FACT.
- Effort: about 2 h. Main risk: converting annual comp to hourly/project rates adds assumptions. Label them explicitly.

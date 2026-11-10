# India Tech Career Intelligence [1M] (Mendeley Data 10.17632/h2rmbfr68t.1)
Verdict: DO-NOT-USE  | Role: SKIP

Audited 2026-11-10 by `ml/scripts/audit/audit_tabular.py`.

## Access and legal
- DOI 10.17632/h2rmbfr68t.1 → https://data.mendeley.com/datasets/h2rmbfr68t/1 [VERIFIED redirect]. Downloaded via the Mendeley public file URL; sha256 `f69a8de1…` **matches** the hash Mendeley publishes [COMPUTED]. Published 2026-06-22, single contributor [VERIFIED, public API].
- Licence: "CC BY 4.0", description "You can share, copy and modify this dataset so long as you give appropriate credit…" [VERIFIED, Mendeley public API `data_licence`]. Licence claim confirmed.
- Provenance: "Data is aggregated from publicly available sources and standardized for educational and analytical use." [VERIFIED]. `source_platform` values are Naukri.com, Glassdoor, LinkedIn, AmbitionBox, Indeed (≈20% each) [COMPUTED]. If real, that would imply scraping job boards (terms risk). The data look synthetic (below), so the provenance statement itself is doubtful.
- PII in job_description: 0 hits [COMPUTED]. company_name holds real company names (12 unique) [COMPUTED].

## Integrity
- File: indian_tech_career_intelligence_2026.csv, 59,347,309 B [COMPUTED].
- **Rows: 100,000 measured (100,001 lines incl. header) vs 1,000,000 documented** ("1,000,000 Records" [VERIFIED]). Difference: −900,000 (−90%). Columns 33 measured = 33 documented [COMPUTED/VERIFIED].
- Missing: only probation_period (33.5%) [COMPUTED]. Duplicate rows 0 [COMPUTED].

## Evidence of synthetic generation [all COMPUTED]
- Only 24 job titles, 12 companies, 8 cities, 6 skill lists, and **24 job descriptions**. After masking title/company/numbers there is **1 description template**. [COMPUTED]
- salary_minimum is uniform on [300,004, 599,999]: last-digit χ² vs uniform 7.3 (df 9, consistent with uniform). Kurtosis −1.169 and skew 0.014 for the top title (uniform ≈ −1.2 / 0). Decile bin counts are flat (533–589). Only 0.11% of values are divisible by 1,000 (real salaries heap on round numbers; compare SO Survey 91.4%). [COMPUTED]
- salary_maximum uniform-like on [700,013, 1,799,996]; stipend uniform on [15,000, 44,999]. [COMPUTED]
- Median salary_minimum is identical across experience levels (Freshers 449,082 vs Mid-Senior 450,216) and company types (≈449.5–450.0k). Real data would differ. [COMPUTED]
- Employment/contract/experience are perfectly collinear: Full-time = Permanent = Mid-Senior = 59,871; Internship = Contractual = Freshers = 40,129. [COMPUTED]
- Contradictions: 15,387 "…Intern" titles are Full-time + Permanent + Mid-Senior; 74,467 non-intern rows have a stipend > 0. [COMPUTED]
- application_deadline − posted_date = 30 days for all 100,000 rows. Posted dates are 2026-01-01..2026-05-30. [COMPUTED]

## Schema and labels
- 33 fields [VERIFIED]: job_title, job_category, company_name, company_size, industry, company_type, location_city/state/country, work_mode, salary_minimum, salary_maximum, salary_currency (all INR), stipend_amount, experience_level, experience_required, education_required, employment_type, contract_type, skills_extracted, skill_count, job_description, posted_date, application_deadline, source_platform, applicant_count, job_benefits, technical_domain, interview_difficulty, probation_period, shift_type, is_active, career_growth_index. Unit of salary: unstated (looks annual INR) [UNVERIFIED].

## Domain fit / Task-specific (T3)
- India rows 100% [COMPUTED]. But the numbers are not usable as an Evidence Log row under any label (not FACT, not ESTIMATE).

## Risks and leakage
- Using it would put fabricated salary "evidence" in front of users. That is a product-integrity risk.

## Recommended use
- Role: SKIP. Effort 0 h. If cited at all, cite it as an example of a synthetic dataset rejected during the audit.

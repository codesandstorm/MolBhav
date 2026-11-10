"""Audit T3 rate/salary sources: Stack Overflow Developer Survey 2026 and India Tech Career Intelligence [1M].

Usage: .venv/Scripts/python -I ml/scripts/audit/audit_tabular.py
Writes ml/scripts/audit/_out/tabular_stats.json (aggregates only).
"""
from __future__ import annotations

import re
import sys
from pathlib import Path

import numpy as np
import pandas as pd

sys.path.insert(0, str(Path(__file__).resolve().parent))
from common import RAW, SEED, pii_counts, save_json  # noqa: E402


def q(s, ps=(0.01, 0.1, 0.25, 0.5, 0.75, 0.9, 0.99)):
    s = pd.to_numeric(s, errors="coerce").dropna()
    return {f"p{int(p*100)}": float(s.quantile(p)) for p in ps} | {"n": int(len(s)), "min": float(s.min()) if len(s) else None,
                                                                   "max": float(s.max()) if len(s) else None}


def roundness(s):
    s = pd.to_numeric(s, errors="coerce").dropna()
    s = s[s > 0]
    n = max(1, len(s))
    return {"div_1000_pct": round(100 * (s % 1000 == 0).sum() / n, 2), "div_10000_pct": round(100 * (s % 10000 == 0).sum() / n, 2),
            "div_100000_pct": round(100 * (s % 100000 == 0).sum() / n, 2)}


def last_digit_chi2(s):
    """Natural salary reports are heaped on 0/5; uniform last digits suggest random generation."""
    s = pd.to_numeric(s, errors="coerce").dropna().astype("int64")
    d = (s % 10).value_counts().reindex(range(10), fill_value=0)
    exp = len(s) / 10
    return {"chi2_vs_uniform": round(float(((d - exp) ** 2 / exp).sum()), 1), "digit_counts": d.astype(int).tolist()}


def so_survey():
    f = RAW / "so_survey_2026" / "survey_results_public.csv"
    df = pd.read_csv(f, low_memory=False)
    out = {"rows": len(df), "cols": df.shape[1], "dup_rows_excl_id": int(df.drop(columns=["ResponseId"]).duplicated().sum())}
    out["missing_pct_key_cols"] = {c: round(100 * df[c].isna().mean(), 2) for c in
                                   ["Country", "Currency", "Compensation", "ConvertedCompYearly", "Employment", "WorkExp", "WorkSetting"]}
    out["employment_values"] = df["Employment"].value_counts().head(12).to_dict()
    ind = df[df["Country"] == "India"]
    out["india_rows"] = len(ind)
    out["india_currency"] = ind["Currency"].value_counts().head(5).to_dict()
    free_rx = re.compile(r"freelanc|independent contractor|self-employed", re.I)
    ind_free = ind[ind["Employment"].fillna("").str.contains(free_rx)]
    out["india_freelance_rows"] = len(ind_free)
    out["india_freelance_with_comp"] = int(ind_free["Compensation"].notna().sum())
    inr = ind[ind["Currency"].fillna("").str.contains("INR")]
    comp = pd.to_numeric(inr["Compensation"], errors="coerce")
    out["india_inr_comp_quantiles"] = q(comp)
    out["india_inr_comp_roundness"] = roundness(comp)
    out["india_inr_comp_implausible"] = {"lt_10000_INR_per_year": int((comp < 10000).sum()), "gt_5cr_INR_per_year": int((comp > 5e7).sum())}
    fcomp = pd.to_numeric(ind_free[ind_free["Currency"].fillna("").str.contains("INR")]["Compensation"], errors="coerce")
    out["india_freelance_inr_comp_quantiles"] = q(fcomp)
    out["india_usd_converted_quantiles"] = q(ind["ConvertedCompYearly"])
    out["global_freelance_usd_quantiles"] = q(df[df["Employment"].fillna("").str.contains(free_rx)]["ConvertedCompYearly"])
    out["india_workexp_quantiles"] = q(ind["WorkExp"])
    out["last_digit_india_inr"] = last_digit_chi2(comp)
    out["pii_free_text_cols"] = {c: pii_counts(df[c].dropna().astype(str)) for c in df.columns if df[c].dtype == object
                                 and df[c].dropna().astype(str).str.len().mean() > 40}
    out["date_range"] = "survey year 2026 (no per-row date column)"
    return out


def mendeley():
    f = RAW / "india_tech_career_1m" / "indian_tech_career_intelligence_2026.csv"
    df = pd.read_csv(f, low_memory=False)
    out = {"rows": len(df), "cols": df.shape[1], "columns": list(df.columns),
           "missing_pct": {c: round(100 * v, 3) for c, v in df.isna().mean().items() if v > 0},
           "dup_rows": int(df.duplicated().sum()),
           "dup_rows_excl_desc_dates": int(df.drop(columns=["job_description", "posted_date", "application_deadline"]).duplicated().sum())}
    for c in ["salary_currency", "location_country", "source_platform", "employment_type", "contract_type", "experience_level",
              "company_type", "work_mode"]:
        out[f"values_{c}"] = df[c].value_counts().head(10).to_dict()
    out["n_unique"] = {c: int(df[c].nunique()) for c in ["job_title", "company_name", "location_city", "job_description", "skills_extracted"]}
    # description templating: strip the job title and see how many distinct templates remain
    tmpl = df.apply(lambda r: str(r["job_description"]).replace(str(r["job_title"]), "<T>").replace(str(r["company_name"]), "<C>"), axis=1)
    tmpl = tmpl.str.replace(r"\d+", "<N>", regex=True)
    out["description_templates_after_title_company_number_masking"] = int(tmpl.nunique())
    smin, smax, stip = df["salary_minimum"], df["salary_maximum"], df["stipend_amount"]
    out["salary_min_quantiles"] = q(smin)
    out["salary_max_quantiles"] = q(smax)
    out["stipend_quantiles"] = q(stip)
    out["salary_min_gt_max"] = int((smin > smax).sum())
    out["salary_min_eq_0"] = int((smin == 0).sum())
    out["salary_roundness"] = roundness(smin)
    out["last_digit_salary_min"] = last_digit_chi2(smin)
    intern = df["job_title"].str.contains("intern", case=False, na=False)
    out["intern_rows"] = int(intern.sum())
    out["intern_and_fulltime_permanent"] = int((intern & (df["employment_type"] == "Full-time") & (df["contract_type"] == "Permanent")).sum())
    out["intern_and_mid_senior_or_above"] = int((intern & df["experience_level"].str.contains("Senior|Lead|Director", na=False)).sum())
    out["nonintern_with_stipend_gt0"] = int((~intern & (stip > 0)).sum())
    # smoothness: within one title, are min-salaries uniform? (uniform -> kurtosis ~ -1.2; real salaries are right-skewed, kurtosis > 0)
    top = df["job_title"].value_counts().index[0]
    s = df.loc[df["job_title"] == top, "salary_minimum"].astype(float)
    out["top_title"] = top
    out["top_title_salary_min_skew"] = round(float(s.skew()), 3)
    out["top_title_salary_min_kurtosis"] = round(float(s.kurt()), 3)
    hist = np.histogram(s, bins=10)[0]
    out["top_title_salary_min_decile_bin_counts"] = hist.tolist()
    out["salary_by_experience_median"] = df.groupby("experience_level")["salary_minimum"].median().to_dict()
    out["salary_by_company_type_median"] = df.groupby("company_type")["salary_minimum"].median().to_dict()
    dates = pd.to_datetime(df["posted_date"], format="%d-%m-%Y", errors="coerce")
    out["posted_date_range"] = [str(dates.min().date()), str(dates.max().date())]
    out["posted_date_unparsed"] = int(dates.isna().sum())
    dl = pd.to_datetime(df["application_deadline"], format="%d-%m-%Y", errors="coerce")
    out["deadline_minus_posted_days_values"] = (dl - dates).dt.days.value_counts().head(8).to_dict()
    out["applicant_count_quantiles"] = q(df["applicant_count"])
    out["pii_hits_job_description"] = pii_counts(df["job_description"].astype(str))
    out["sample_seed42_titles"] = df.sample(5, random_state=SEED)[["job_title", "experience_level", "salary_minimum", "salary_maximum",
                                                                   "stipend_amount", "employment_type"]].to_dict("records")
    return out


def main():
    res = {"so_survey_2026": so_survey(), "india_tech_career_1m": mendeley()}
    save_json("tabular_stats", res)
    import json
    print(json.dumps(res, indent=1, default=str)[:12000])


if __name__ == "__main__":
    main()

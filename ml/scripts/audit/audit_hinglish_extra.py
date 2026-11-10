"""Profile the two small synthetic Hinglish sets (gooftagoo, hinglish-retail-intent).

Usage: .venv/Scripts/python -I ml/scripts/audit/audit_hinglish_extra.py
Writes ml/scripts/audit/_out/hinglish_extra_stats.json
"""
from __future__ import annotations

import ast
import collections as C
import random
import re
import sys
from pathlib import Path

import pandas as pd

sys.path.insert(0, str(Path(__file__).resolve().parent))
from common import OUT, RAW, SEED, save_json, scrub, text_profile  # noqa: E402

DEV = re.compile(r"[ऀ-ॿ]")
HI = set("hai hain ka ki ke ko se mein me nahi nhi kya toh to bhi tha thi ho kar karo yeh ye woh wo aap tum main mujhe "
         "bahut accha acha kuch aur lekin par jo kaise kyun kyu haan han ek".split())
NEGO = re.compile(r"\b(price|budget|kam|discount|paise|paisa|rupees?|rs|deal|offer|sasta|mehenga|rate|coupon)\b", re.I)


def script_profile(texts):
    n = max(1, len(texts))
    dev = sum(1 for t in texts if DEV.search(t))
    roman_hi = sum(1 for t in texts if not DEV.search(t) and any(w in HI for w in re.findall(r"[a-z']+", t.lower())))
    return {"n": len(texts), "devanagari_pct": round(100 * dev / n, 2), "roman_with_hindi_function_word_pct": round(100 * roman_hi / n, 2),
            "negotiation_keyword_pct": round(100 * sum(1 for t in texts if NEGO.search(t)) / n, 2)}


def main():
    out = {}
    g = pd.read_csv(RAW / "gooftagoo" / "data.csv")
    turns, bad = [], 0
    for c in g["conversation"]:
        try:
            for t in ast.literal_eval(c):
                turns += [t.get("user", ""), t.get("assistant", "")]
        except Exception:
            bad += 1
    turns = [t for t in turns if isinstance(t, str)]
    out["gooftagoo"] = {"conversations": len(g), "unparsable_conversations": bad, "turns": len(turns),
                        "script": script_profile(turns), "profile": text_profile(turns)}
    r = pd.concat([pd.read_parquet(RAW / "hinglish_retail_intent" / f"{s}.parquet") for s in ("train", "validation", "test")])
    out["hinglish_retail_intent"] = {"rows_per_split": r["split"].value_counts().to_dict(), "rows": len(r),
                                     "labels": r["label"].value_counts().to_dict(), "source": r["source"].value_counts().to_dict(),
                                     "script": script_profile(r["text"].tolist()), "profile": text_profile(r["text"].tolist()),
                                     "discount_query_rows": int((r["label"] == "discount_query").sum()),
                                     "test_texts_exactly_in_train": int(r[r["split"] == "test"]["text"].str.lower().str.strip().isin(
                                         set(r[r["split"] == "train"]["text"].str.lower().str.strip())).sum())}
    rng = random.Random(SEED)
    for name, texts in (("gooftagoo", turns), ("hinglish_retail_intent", r["text"].tolist())):
        (OUT / f"samples_{name}.json").write_text(
            pd.Series([scrub(t, 200) for t in rng.sample(texts, 50)]).to_json(force_ascii=False, indent=1), encoding="utf-8")
    save_json("hinglish_extra_stats", out)
    import json
    print(json.dumps(out, indent=1, ensure_ascii=False)[:4000])


if __name__ == "__main__":
    main()

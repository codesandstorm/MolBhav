"""Download Tier 1-2 datasets from their official sources into data/raw/<name>/.

Usage:  .venv/Scripts/python -I ml/scripts/audit/download.py [name ...]
Never accepts licences or logs in. Gated files are recorded as BLOCKED.
"""
from __future__ import annotations

import sys
from pathlib import Path

import requests

sys.path.insert(0, str(Path(__file__).resolve().parent))
from common import RAW, UA, save_json, write_checksums  # noqa: E402

HF = "https://huggingface.co/datasets"
SOURCES = {
    "casino": [
        (f"{HF}/kchawla123/casino/resolve/290898d2d08b6591db17005504e40ce00ac1028e/README.md", "README.md"),
        (f"{HF}/kchawla123/casino/resolve/290898d2d08b6591db17005504e40ce00ac1028e/data/train-00000-of-00001.parquet", "train.parquet"),
        ("https://raw.githubusercontent.com/kushalchawla/CaSiNo/main/README.md", "github_README.md"),
        ("https://raw.githubusercontent.com/kushalchawla/CaSiNo/main/LICENSE", "github_LICENSE"),
        ("https://raw.githubusercontent.com/kushalchawla/CaSiNo/main/data/casino.json", "casino.json"),
        ("https://raw.githubusercontent.com/kushalchawla/CaSiNo/main/data/README.md", "github_data_README.md"),
    ] + [(f"https://raw.githubusercontent.com/kushalchawla/CaSiNo/main/data/split/casino_{s}.json", f"split_{s}.json") for s in ("train", "valid", "test")] + [
    ],
    "language_of_bargaining": [
        (f"{HF}/ChicagoHAI/language-of-bargaining/resolve/557477102c9b2130acf56905db6d1eb2e0136ff0/README.md", "README.md"),
        (f"{HF}/ChicagoHAI/language-of-bargaining/resolve/557477102c9b2130acf56905db6d1eb2e0136ff0/negotiations-data.zip", "negotiations-data.zip"),
    ],
    "persuasionforgood": [
        ("https://zissou.infosci.cornell.edu/convokit/datasets/persuasionforgood-corpus/persuasionforgood.zip", "persuasionforgood.zip"),
        ("https://gitlab.com/ucdavisnlp/persuasionforgood/-/raw/master/README.md", "gitlab_README.md"),
        ("https://raw.githubusercontent.com/CornellNLP/ConvoKit/master/LICENSE.md", "convokit_LICENSE.md"),
        ("https://gitlab.com/ucdavisnlp/persuasionforgood/-/raw/master/LICENSE", "gitlab_LICENSE"),
    ],
    "deal_or_no_dialog": [
        (f"{HF}/mikelewis0/deal_or_no_dialog/resolve/de8a685ff1624e1d7f57f6cb3b635518fe7b8113/README.md", "README.md"),
        (f"{HF}/mikelewis0/deal_or_no_dialog/resolve/de8a685ff1624e1d7f57f6cb3b635518fe7b8113/deal_or_no_dialog.py", "deal_or_no_dialog.py.txt"),
        ("https://raw.githubusercontent.com/facebookresearch/end-to-end-negotiator/master/LICENSE", "github_LICENSE"),
        ("https://raw.githubusercontent.com/facebookresearch/end-to-end-negotiator/master/README.md", "github_README.md"),
    ] + [(f"https://raw.githubusercontent.com/facebookresearch/end-to-end-negotiator/master/src/data/negotiate/{s}.txt", f"{s}.txt")
         for s in ("train", "val", "test", "selfplay")],
    "craigslist_bargains": [
        (f"{HF}/stanfordnlp/craigslist_bargains/resolve/cfb6992c5ca9bad209323ed8e42e0cfc7e4178cf/README.md", "README.md"),
        (f"{HF}/stanfordnlp/craigslist_bargains/resolve/cfb6992c5ca9bad209323ed8e42e0cfc7e4178cf/craigslist_bargains.py", "craigslist_bargains.py.txt"),
        ("https://worksheets.codalab.org/rest/bundles/0xd34bbbc5fb3b4fccbd19e10756ca8dd7/contents/blob/parsed.json", "train.json"),
        ("https://worksheets.codalab.org/rest/bundles/0x15c4160b43d44ee3a8386cca98da138c/contents/blob/parsed.json", "validation.json"),
        ("https://worksheets.codalab.org/rest/bundles/0x54d325bbcfb2463583995725ed8ca42b/contents/blob/", "test.json"),
        ("https://raw.githubusercontent.com/stanfordnlp/cocoa/master/LICENSE.md", "github_cocoa_LICENSE"),
    ],
    "cmu_hinglish_dog": [
        (f"{HF}/festvox/cmu_hinglish_dog/resolve/19796c6fb32020154cb2745d48704fa73e29b17d/README.md", "README.md"),
    ] + [(f"{HF}/festvox/cmu_hinglish_dog/resolve/19796c6fb32020154cb2745d48704fa73e29b17d/data/{s}-00000-of-00001.parquet", f"{s}.parquet")
         for s in ("train", "validation", "test")],
    "gooftagoo": [
        (f"{HF}/Tensoic/gooftagoo/resolve/7b3d6d0e34c8c7c16a25ae02ef75956953417fec/README.md", "README.md"),
        (f"{HF}/Tensoic/gooftagoo/resolve/7b3d6d0e34c8c7c16a25ae02ef75956953417fec/data.csv", "data.csv"),
    ],
    "hinglish_retail_intent": [
        (f"{HF}/Hari5115/hinglish-retail-intent-dataset/resolve/3b4ab333bfeab463c9407911e958a5e6af6199ac/README.md", "README.md"),
    ] + [(f"{HF}/Hari5115/hinglish-retail-intent-dataset/resolve/3b4ab333bfeab463c9407911e958a5e6af6199ac/data/{s}-00000-of-00001.parquet", f"{s}.parquet")
         for s in ("train", "validation", "test")],
    "so_survey_2026": [
        ("https://media.githubusercontent.com/media/StackExchange/Survey/main/packages/archive/2026/survey_results_public.csv", "survey_results_public.csv"),
        ("https://media.githubusercontent.com/media/StackExchange/Survey/main/packages/archive/2026/survey_results_schema.csv", "survey_results_schema.csv"),
        ("https://raw.githubusercontent.com/StackExchange/Survey/main/packages/archive/2026/README.md", "README.md"),
        ("https://survey.stackoverflow.co/", "survey_landing.html"),
    ],
    "india_tech_career_1m": [
        ("https://data.mendeley.com/public-api/datasets/h2rmbfr68t", "mendeley_metadata.json"),
        ("https://data.mendeley.com/public-files/datasets/h2rmbfr68t/files/bc81d141-52c8-45d0-ab0f-aef078e35dd0/file_downloaded",
         "indian_tech_career_intelligence_2026.csv"),
    ],
}
# sha256 published by the source, checked after download
EXPECTED_SHA256 = {
    "india_tech_career_1m/indian_tech_career_intelligence_2026.csv": "f69a8de12e0d379419e7f9767c74a366366fabab864d20eb6f414bba21ad403c",
    "so_survey_2026/survey_results_public.csv": "ad520b4d5d71f240141e63f0d6f81a3b1898cbdc69efe9ea985496533b15fc2c",  # git-lfs oid
}


def fetch(url: str, dest: Path) -> dict:
    if dest.exists() and dest.stat().st_size > 0:
        return {"url": url, "file": dest.name, "status": "cached", "bytes": dest.stat().st_size}
    try:
        with requests.get(url, headers=UA, stream=True, timeout=120, allow_redirects=True) as r:
            if r.status_code != 200:
                return {"url": url, "file": dest.name, "status": f"HTTP {r.status_code}", "bytes": 0}
            dest.parent.mkdir(parents=True, exist_ok=True)
            with open(dest, "wb") as f:
                for chunk in r.iter_content(1 << 20):
                    f.write(chunk)
        return {"url": url, "file": dest.name, "status": "ok", "bytes": dest.stat().st_size}
    except Exception as e:  # network errors are recorded, never guessed around
        return {"url": url, "file": dest.name, "status": f"ERROR {type(e).__name__}: {e}"[:200], "bytes": 0}


def main(names):
    log = {}
    for name in names or SOURCES:
        log[name] = [fetch(u, RAW / name / fn) for u, fn in SOURCES[name]]
        for row in log[name]:
            print(f"{name:24s} {row['status']:12s} {row['bytes']:>12} {row['file']}")
    from common import sha256
    for rel, exp in EXPECTED_SHA256.items():
        f = RAW / rel
        if f.exists():
            got = sha256(f)
            print(f"sha256 check {rel}: {'MATCH' if got == exp else 'MISMATCH ' + got}")
            log.setdefault("_sha_checks", {})[rel] = {"expected": exp, "got": got, "match": got == exp}
    save_json("download_log", log)
    write_checksums()


if __name__ == "__main__":
    main(sys.argv[1:])

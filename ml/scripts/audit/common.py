"""Shared helpers for the MolBhav dataset audit scripts.

All raw files live under data/raw/<dataset>/ (gitignored). Outputs that may
contain sampled text go to ml/scripts/audit/_out/ (gitignored). Only aggregate
numbers are written into docs/.
"""
from __future__ import annotations

import hashlib
import json
import re
import unicodedata
from pathlib import Path

REPO = Path(__file__).resolve().parents[3]
RAW = REPO / "data" / "raw"
OUT = REPO / "ml" / "scripts" / "audit" / "_out"
CHECKSUMS = REPO / "data" / "checksums.txt"
SEED = 42
UA = {"User-Agent": "molbhav-dataset-audit/0.1 (student project)"}

OUT.mkdir(parents=True, exist_ok=True)


def sha256(path: Path) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def write_checksums() -> None:
    """Regenerate data/checksums.txt from every file under data/raw/."""
    lines = []
    for p in sorted(RAW.rglob("*")):
        if p.is_file() and ".cache" not in p.parts:
            rel = p.relative_to(REPO).as_posix()
            lines.append(f"{sha256(p)}  {p.stat().st_size:>12}  {rel}")
    CHECKSUMS.write_text("# sha256  bytes  path (regenerate: python -I ml/scripts/audit/checksums.py)\n"
                         + "\n".join(lines) + "\n", encoding="utf-8")


def save_json(name: str, obj) -> Path:
    p = OUT / f"{name}.json"
    p.write_text(json.dumps(obj, indent=2, ensure_ascii=False, default=str), encoding="utf-8")
    return p


def load_json(name: str):
    return json.loads((OUT / f"{name}.json").read_text(encoding="utf-8"))


# ---------- text helpers ----------
def norm(t: str) -> str:
    t = unicodedata.normalize("NFKC", t or "").lower()
    t = re.sub(r"[^\w\s]", " ", t)
    return re.sub(r"\s+", " ", t).strip()


PII_PATTERNS = {
    "email": re.compile(r"[\w.+-]+@[\w-]+\.[\w.-]+"),
    "phone": re.compile(r"(?<!\d)(?:\+?\d[\d\s-]{8,}\d)(?!\d)"),
    "url": re.compile(r"https?://\S+|www\.\S+"),
    "handle": re.compile(r"(?<![\w.])@\w{3,}"),
    "long_id": re.compile(r"\b[A-Z0-9]{12,}\b"),
}


def pii_counts(texts) -> dict:
    c = {k: 0 for k in PII_PATTERNS}
    for t in texts:
        if not t:
            continue
        for k, rx in PII_PATTERNS.items():
            if rx.search(t):
                c[k] += 1
    return c


# amounts: $, Rs, INR, rupees, k/L/lakh, plain numbers in price context
AMOUNT_RX = re.compile(
    r"(?:[$₹]|\brs\.?|\binr\b|\busd\b)\s?\d[\d,]*(?:\.\d+)?\s?(?:k|l|lakh|lac|cr)?\b"
    r"|\b\d[\d,]*(?:\.\d+)?\s?(?:k|l|lakh|lac|cr|dollars?|bucks|rupees?)\b",
    re.I,
)
ANY_NUMBER_RX = re.compile(r"\d")
FIRM_RX = re.compile(r"\b(final|firm|lowest|best i can|non[- ]negotiable|take it or leave|won't go|can't go|cannot go|no less|minimum)\b", re.I)
SOFT_RX = re.compile(r"\b(maybe|perhaps|could|would you|how about|possible|flexible|consider|if you|i think|kinda|kind of)\b", re.I)


def dup_stats(texts) -> dict:
    texts = [t for t in texts if t is not None]
    exact = len(texts) - len(set(texts))
    n = [norm(t) for t in texts]
    normed = len(n) - len(set(n))
    empty = sum(1 for t in texts if not t.strip())
    return {"n": len(texts), "exact_dup": exact, "norm_dup": normed, "empty": empty,
            "exact_dup_pct": round(100 * exact / max(1, len(texts)), 2),
            "norm_dup_pct": round(100 * normed / max(1, len(texts)), 2)}


def length_stats(texts) -> dict:
    import statistics as st
    L = sorted(len(t.split()) for t in texts if t)
    if not L:
        return {}
    q = lambda p: L[min(len(L) - 1, int(p * len(L)))]
    return {"n": len(L), "mean_words": round(st.mean(L), 2), "p50": q(.5), "p90": q(.9), "p99": q(.99), "max": L[-1],
            "le_2_words": sum(1 for x in L if x <= 2)}


def bad_encoding(texts) -> int:
    rx = re.compile(r"�|Ã.|â€")
    return sum(1 for t in texts if t and rx.search(t))


def text_profile(texts) -> dict:
    texts = [t for t in texts if t is not None]
    n = max(1, len(texts))
    amt = sum(1 for t in texts if AMOUNT_RX.search(t))
    num = sum(1 for t in texts if ANY_NUMBER_RX.search(t))
    return {"dups": dup_stats(texts), "length": length_stats(texts), "pii_hits": pii_counts(texts),
            "bad_encoding": bad_encoding(texts),
            "amount_pattern_pct": round(100 * amt / n, 2), "any_digit_pct": round(100 * num / n, 2),
            "firm_pct": round(100 * sum(1 for t in texts if FIRM_RX.search(t)) / n, 2),
            "soft_pct": round(100 * sum(1 for t in texts if SOFT_RX.search(t)) / n, 2)}


def scrub(t: str, maxlen: int = 140) -> str:
    """Short, de-identified quote for reports."""
    for rx in PII_PATTERNS.values():
        t = rx.sub("[X]", t)
    t = re.sub(r"\s+", " ", t).strip()
    return t if len(t) <= maxlen else t[: maxlen - 1] + "…"

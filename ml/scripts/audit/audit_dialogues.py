"""Audit the dialogue datasets (Tier 1-2) and regenerate every number in the cards.

Usage:  .venv/Scripts/python -I ml/scripts/audit/audit_dialogues.py
Writes:  ml/scripts/audit/_out/dialogues_stats.json   (aggregates only)
         ml/scripts/audit/_out/samples_<ds>.json      (50 sampled utterances, gitignored)
         docs/dataset-audit/label_mapping.csv
"""
from __future__ import annotations

import collections as C
import csv
import json
import random
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from common import OUT, RAW, REPO, SEED, AMOUNT_RX, norm, save_json, scrub, text_profile  # noqa: E402

# ---------------------------------------------------------------- loaders
# Each loader returns a list of utterance dicts:
#   {ds, split, dlg, spk, text, labels:list[str], price:float|None}


def load_casino():
    rows, split_of = [], {}
    for s in ("train", "valid", "test"):
        for d in json.load(open(RAW / "casino" / f"split_{s}.json", encoding="utf-8")):
            split_of[d["dialogue_id"]] = s
    full = json.load(open(RAW / "casino" / "casino.json", encoding="utf-8"))
    for d in full:
        ann = {}
        for i, a in enumerate(d.get("annotations") or []):
            ann.setdefault(a[0], []).append([x for x in a[1].split(",") if x])
        seen = C.Counter()
        for u in d["chat_logs"]:
            t = u["text"]
            labels = None
            if t in ("Submit-Deal", "Accept-Deal", "Reject-Deal", "Walk-Away"):
                labels = [t]
            elif t in ann:
                k = seen[t]
                labels = ann[t][min(k, len(ann[t]) - 1)]
                seen[t] += 1
            rows.append({"ds": "casino", "split": split_of.get(d["dialogue_id"], "unsplit"), "dlg": d["dialogue_id"],
                         "spk": u["id"], "text": t, "labels": labels, "price": None,
                         "is_action": t in ("Submit-Deal", "Accept-Deal", "Reject-Deal", "Walk-Away"),
                         "annotated_dialogue": bool(d.get("annotations"))})
    return rows, {"dialogues": len(full), "annotated_dialogues": sum(1 for d in full if d.get("annotations")),
                  "annotation_rows": sum(len(d.get("annotations") or []) for d in full),
                  "split_dialogues": dict(C.Counter(split_of.values()))}


DND_RX = re.compile(r"<dialogue>(.*?)</dialogue>")


def load_dnd():
    rows, meta = [], {}
    for s in ("train", "val", "test", "selfplay"):
        lines = (RAW / "deal_or_no_dialog" / f"{s}.txt").read_text(encoding="utf-8").splitlines()
        meta[f"{s}_lines"] = len(lines)
        if s == "selfplay":
            continue  # selfplay holds only <input> contexts, no dialogue
        uniq = set()
        for i, ln in enumerate(lines):
            m = DND_RX.search(ln)
            if not m:
                continue
            turns = [t.strip() for t in m.group(1).split("<eos>") if t.strip()]
            # every dialogue is stored twice (once per perspective); canonicalise
            canon = tuple(t.split(":", 1)[1].strip() for t in turns)
            if canon in uniq:
                continue
            uniq.add(canon)
            for t in turns:
                spk, txt = t.split(":", 1)
                txt = txt.strip()
                rows.append({"ds": "deal_or_no_dialog", "split": s, "dlg": f"{s}-{i}", "spk": spk.strip(),
                             "text": txt, "labels": ["<selection>"] if txt == "<selection>" else None,
                             "price": None, "is_action": txt == "<selection>"})
        meta[f"{s}_unique_dialogues"] = len(uniq)
    return rows, meta


def load_cb():
    rows, meta = [], {}
    for s in ("train", "validation", "test"):
        d = json.load(open(RAW / "craigslist_bargains" / f"{s}.json", encoding="utf-8"))
        meta[f"{s}_dialogues"] = len(d)
        for e in d:
            kb = e["scenario"]["kbs"]
            roles = {i: kb[i]["personal"]["Role"] for i in range(2)}
            for ev in e["events"]:
                md = ev.get("metadata") or {}
                if ev["action"] == "message":
                    text, labels = ev["data"], ([md["intent"]] if md.get("intent") else None)
                    price = md.get("price")
                else:
                    text, labels = f"<{ev['action']}>", [f"ACTION:{ev['action']}"]
                    price = (ev.get("data") or {}).get("price") if isinstance(ev.get("data"), dict) else None
                rows.append({"ds": "craigslist_bargains", "split": s, "dlg": e["uuid"], "spk": roles[int(ev["agent"])],
                             "text": text or "", "labels": labels, "price": price,
                             "is_action": ev["action"] != "message",
                             "category": e["scenario"]["category"], "list_price": kb[0]["item"]["Price"]})
    return rows, meta


def load_p4g():
    base = RAW / "persuasionforgood" / "extracted" / "persuasionforgood-corpus"
    conv = json.load(open(base / "conversations.json", encoding="utf-8"))
    rows = []
    for ln in open(base / "utterances.jsonl", encoding="utf-8"):
        x = json.loads(ln)
        m = x["meta"]
        l1 = m.get("label_1") if isinstance(m.get("label_1"), list) else []
        l2 = m.get("label_2") if isinstance(m.get("label_2"), list) else []
        labs = sorted({v for v in l1 + l2 if isinstance(v, str)})
        rows.append({"ds": "persuasionforgood", "split": "all", "dlg": x["root"],
                     "spk": "persuader" if m.get("role") == 0 else "persuadee", "text": x["text"],
                     "labels": labs or None, "price": None, "is_action": False,
                     "annotated_dialogue": conv.get(x["root"], {}).get("is_annotated", False)})
    users = json.load(open(base / "users.json", encoding="utf-8"))
    return rows, {"conversations": len(conv), "annotated_conversations": sum(1 for c in conv.values() if c.get("is_annotated")),
                  "users": len(users), "user_fields": sorted(next(iter(users.values())).keys()),
                  "utterances": len(rows)}


def load_hdog():
    import pandas as pd
    rows, meta = [], {}
    for s in ("train", "validation", "test"):
        df = pd.read_parquet(RAW / "cmu_hinglish_dog" / f"{s}.parquet")
        meta[f"{s}_rows"] = len(df)
        meta["columns"] = list(df.columns)
        for r in df.itertuples():
            rows.append({"ds": "cmu_hinglish_dog", "split": s, "dlg": f"{r.uid1LogInTime}|{r.user2_id}", "spk": r.uid,
                         "text": r.translation.get("hi_en") or "", "en": r.translation.get("en") or "",
                         "labels": None, "price": None, "is_action": False})
    return rows, meta


LOADERS = {"casino": load_casino, "deal_or_no_dialog": load_dnd, "craigslist_bargains": load_cb,
           "persuasionforgood": load_p4g, "cmu_hinglish_dog": load_hdog}

# ---------------------------------------------------------------- label mapping
# (source label) -> (our T1 label | UNMAPPABLE, confidence, note)
MAP = {
    "casino": {
        "Submit-Deal": ("ANCHOR", "low", "formal deal proposal button; may be first offer or counter"),
        "Accept-Deal": ("ACCEPT", "high", "accept button"),
        "Reject-Deal": ("REJECT_OR_COUNTER", "high", "reject button"),
        "Walk-Away": ("OTHER", "medium", "walk-away; no T1 label for BATNA exit"),
        "elicit-pref": ("INFO_REQUEST", "high", "asks partner's preferences"),
        "uv-part": ("REJECT_OR_COUNTER", "medium", "undermines partner's need; pushback"),
        "no-need": ("UNCOND_CONCESSION", "low", "signals an item is not needed; concession only implied"),
        "promote-coordination": ("COND_CONCESSION", "low", "mutual-benefit framing; conditionality not annotated"),
        "self-need": ("OTHER", "medium", "own-need justification; closer to objection rationale than a move"),
        "other-need": ("OTHER", "medium", "third-party need justification"),
        "vouch-fair": ("OTHER", "medium", "fairness appeal"),
        "small-talk": ("OTHER", "high", "rapport"),
        "showing-empathy": ("OTHER", "high", "rapport"),
        "non-strategic": ("OTHER", "high", "no strategy"),
    },
    "craigslist_bargains": {
        "init-price": ("ANCHOR", "high", "rule-based first price mention"),
        "counter-price": ("REJECT_OR_COUNTER", "high", "rule-based new price after opponent price"),
        "insist": ("REJECT_OR_COUNTER", "medium", "repeats own price"),
        "vague-price": ("REJECT_OR_COUNTER", "low", "push without number"),
        "inquiry": ("INFO_REQUEST", "high", "question"),
        "inform": ("OTHER", "medium", "answers/informs"),
        "agree": ("ACCEPT", "medium", "verbal agreement; may be partial"),
        "disagree": ("REJECT_OR_COUNTER", "medium", "verbal disagreement"),
        "intro": ("OTHER", "high", "greeting"),
        "unknown": ("UNMAPPABLE", "-", "parser could not classify"),
        "ACTION:offer": ("ANCHOR", "low", "formal final-offer submission (may be counter)"),
        "ACTION:accept": ("ACCEPT", "high", "accept button"),
        "ACTION:reject": ("REJECT_OR_COUNTER", "high", "reject button"),
        "ACTION:quit": ("OTHER", "medium", "walk-away"),
    },
    "persuasionforgood": {
        # persuader strategies
        "logical-appeal": ("OTHER", "medium", "persuasion strategy, not a bargaining move"),
        "emotion-appeal": ("OTHER", "medium", "persuasion strategy"),
        "credibility-appeal": ("OTHER", "medium", "persuasion strategy"),
        "foot-in-the-door": ("ANCHOR", "low", "asks for a small amount first; reverse anchoring"),
        "self-modeling": ("OTHER", "medium", "persuasion strategy"),
        "personal-story": ("OTHER", "medium", "persuasion strategy"),
        "donation-information": ("OTHER", "medium", "informs about donation procedure"),
        "source-related-inquiry": ("INFO_REQUEST", "high", "question"),
        "task-related-inquiry": ("INFO_REQUEST", "high", "question"),
        "personal-related-inquiry": ("INFO_REQUEST", "high", "question"),
        "proposition-of-donation": ("ANCHOR", "low", "asks for donation; amount often absent"),
        "comment-partner": ("OTHER", "high", ""),
        "thank": ("OTHER", "high", ""),
        "you-are-welcome": ("OTHER", "high", ""),
        "ask-donate-more": ("REJECT_OR_COUNTER", "low", "pushes for higher amount"),
        "confirm-donation": ("INFO_REQUEST", "medium", "confirms amount"),
        "ask-not-donate-reason": ("INFO_REQUEST", "high", "question"),
        "praise-user": ("OTHER", "high", ""),
        "closing": ("OTHER", "high", ""),
        "greeting": ("OTHER", "high", ""),
        "acknowledgement": ("OTHER", "high", ""),
        # persuadee
        "agree-donation": ("ACCEPT", "high", "agrees to donate"),
        "disagree-donation": ("REJECT_OR_COUNTER", "high", "refuses"),
        "disagree-donation-more": ("REJECT_OR_COUNTER", "high", "refuses to increase"),
        "provide-donation-amount": ("ANCHOR", "medium", "states an amount"),
        "negative-reaction-to-donation": ("REJECT_OR_COUNTER", "medium", ""),
        "positive-reaction-to-donation": ("OTHER", "medium", ""),
        "ask-org-info": ("INFO_REQUEST", "high", "question"),
        "ask-donation-procedure": ("INFO_REQUEST", "high", "question"),
        "ask-persuader-donation-intention": ("INFO_REQUEST", "high", "question"),
        "ask-question": ("INFO_REQUEST", "high", "question"),
        "personal-related-inquiry_ee": ("INFO_REQUEST", "high", "question"),
        "positive-to-inquiry": ("OTHER", "high", "answer"),
        "negative-to-inquiry": ("OTHER", "high", "answer"),
        "neutral-to-inquiry": ("OTHER", "high", "answer"),
        "other": ("OTHER", "high", ""),
        "off-task": ("OTHER", "high", ""),
        "neutral-reaction-to-donation": ("OTHER", "medium", ""),
        "ask-donation-amount": ("INFO_REQUEST", "high", "asks how much"),
        "non-personal-Task-related-inquiry": ("INFO_REQUEST", "high", "question"),
    },
    "deal_or_no_dialog": {
        "<selection>": ("UNMAPPABLE", "-", "end-of-dialogue marker; no utterance labels exist"),
    },
}
PRIORITY = ["ACCEPT", "REJECT_OR_COUNTER", "ANCHOR", "COND_CONCESSION", "UNCOND_CONCESSION", "INFO_REQUEST", "OTHER"]
COND_RX = re.compile(r"\b(if you|if i|provided|as long as|in exchange|in return|only if|on condition)\b", re.I)


def map_utt(ds, labels):
    """Return (our_label | 'UNMAPPABLE', [unmapped source labels])."""
    m = MAP.get(ds, {})
    ours, unknown = [], []
    for lab in labels:
        if lab in m:
            ours.append(m[lab][0])
        else:
            unknown.append(lab)
    good = [o for o in ours if o != "UNMAPPABLE"]
    if not good:
        return "UNMAPPABLE", unknown
    return min(good, key=PRIORITY.index), unknown


def cb_price_concessions(rows):
    """Heuristic: a message whose price moves toward the opponent's last price is a concession.
    Conditional if it also matches COND_RX. Derived, low confidence."""
    out = C.Counter()
    by = C.defaultdict(list)
    for r in rows:
        if r["split"] != "test" and not r["is_action"]:
            by[r["dlg"]].append(r)
    for utts in by.values():
        last = {}
        for r in utts:
            p = r["price"]
            if p is None or p <= 0:
                continue
            me = r["spk"]
            other = "seller" if me == "buyer" else "buyer"
            if me in last and other in last:
                prev, opp = last[me], last[other]
                if abs(p - opp) < abs(prev - opp) and p != prev:
                    out["COND_CONCESSION" if COND_RX.search(r["text"]) else "UNCOND_CONCESSION"] += 1
                    r["derived"] = "concession"
            last[me] = p
    return dict(out)


def hinglish_profile(rows):
    hi_words = set("hai hain ka ki ke ko se mein me nahi nhi kya toh to bhi tha thi ho kar karo yeh ye woh wo aap tum main mujhe "
                   "bahut accha acha kuch aur lekin par jo kaise kyun kyu haan han ek dekha dekhi movie".split())
    hi_words.discard("movie")
    dev = re.compile(r"[ऀ-ॿ]")
    nego = re.compile(r"\b(price|budget|kam|discount|paise|paisa|rupees?|rs|deal|offer|sasta|mehenga|negotiat\w*|rate)\b", re.I)
    n = len(rows)
    has_dev = sum(1 for r in rows if dev.search(r["text"]))
    hinglish, ratios = 0, []
    rng = random.Random(SEED)
    for r in rows:
        toks = re.findall(r"[a-z']+", r["text"].lower())
        if any(t in hi_words for t in toks):
            hinglish += 1
    sample = rng.sample(rows, min(500, n))
    for r in sample:
        toks = re.findall(r"[a-z']+", r["text"].lower())
        en = set(re.findall(r"[a-z']+", r["en"].lower()))
        if toks:
            ratios.append(sum(1 for t in toks if t in en) / len(toks))
    ratios.sort()
    nego_hits = [r for r in rows if nego.search(r["text"])]
    # schwa-retaining forms typical of machine transliteration of formal Hindi (e.g. "karata", "aapako")
    mt = re.compile(r"\b(karata|lagata|sakata|aapako|hamen|kyonki|isalie|vah)\b", re.I)
    mt_n = sum(1 for r in rows if mt.search(r["text"]))
    return {"n": n, "devanagari_rows": has_dev, "roman_only_pct": round(100 * (n - has_dev) / n, 2),
            "rows_with_hindi_function_word_pct": round(100 * hinglish / n, 2),
            "english_token_share_sample500": {"mean": round(sum(ratios) / len(ratios), 3), "p50": round(ratios[len(ratios) // 2], 3)},
            "machine_transliteration_marker_pct": round(100 * mt_n / n, 2),
            "negotiation_keyword_rows": len(nego_hits), "negotiation_keyword_pct": round(100 * len(nego_hits) / n, 2)}


# ---------------------------------------------------------------- overlap
def shingles(t, k=8):
    w = norm(t).split()
    return {" ".join(w[i:i + k]) for i in range(len(w) - k + 1)}


def overlaps(all_rows):
    by_ds = C.defaultdict(list)
    for r in all_rows:
        if not r["is_action"] and len(r["text"].split()) >= 6:
            by_ds[r["ds"]].append(norm(r["text"]))
    sets = {d: set(v) for d, v in by_ds.items()}
    sh = {d: set().union(*(shingles(t) for t in v)) if v else set() for d, v in by_ds.items()}
    res = {}
    ds = sorted(sets)
    for i, a in enumerate(ds):
        for b in ds[i + 1:]:
            res[f"{a}|{b}"] = {"exact_norm_utts_ge6w": len(sets[a] & sets[b]), "shared_8gram_shingles": len(sh[a] & sh[b])}
    # repo files (our scenarios / gold set) vs public data
    repo_files = [p for p in list((REPO / "docs").rglob("*")) + list((REPO / "data").rglob("*"))
                  if p.is_file() and p.suffix in {".md", ".txt", ".json", ".jsonl", ".csv"}
                  and "raw" not in p.parts and "dataset-audit" not in p.parts and p.name not in {"README.md", "checksums.txt"}]
    repo_sh = set()
    for p in repo_files:
        repo_sh |= shingles(p.read_text(encoding="utf-8", errors="ignore"))
    res["repo_files_checked"] = [p.relative_to(REPO).as_posix() for p in repo_files]
    res["repo_vs_public_shared_8gram"] = {d: len(repo_sh & s) for d, s in sh.items()}
    # within-dataset cross-split leakage
    for d in ds:
        sp = C.defaultdict(set)
        for r in all_rows:
            if r["ds"] == d and not r["is_action"] and len(r["text"].split()) >= 6:
                sp[r["split"]].add(norm(r["text"]))
        if "test" in sp:
            res[f"{d}:test_utts_also_in_other_splits"] = len(sp["test"] & set().union(*(v for k, v in sp.items() if k != "test")))
    return res


# ---------------------------------------------------------------- main
def main():
    stats, all_rows, mapping_rows = {}, [], []
    for name, fn in LOADERS.items():
        rows, meta = fn()
        all_rows += rows
        texts = [r["text"] for r in rows if not r["is_action"]]
        s = {"meta": meta, "utterances_total": len(rows), "text_utterances": len(texts),
             "per_split_utterances": dict(C.Counter(r["split"] for r in rows)),
             "per_split_dialogues": {k: len(v) for k, v in _group(rows, "split").items()},
             "profile": text_profile(texts),
             "speakers": dict(C.Counter(r["spk"] for r in rows).most_common(5)) if name != "persuasionforgood" else
             dict(C.Counter(r["spk"] for r in rows))}
        if name == "craigslist_bargains":
            s["categories"] = dict(C.Counter(r["category"] for r in rows if r["is_action"] is False))
            s["price_metadata_pct_nontest"] = round(100 * sum(1 for r in rows if r["split"] != "test" and not r["is_action"] and r["price"]) /
                                                     max(1, sum(1 for r in rows if r["split"] != "test" and not r["is_action"])), 2)
            s["test_intent_present"] = sum(1 for r in rows if r["split"] == "test" and r["labels"] and not r["is_action"])
            s["derived_concessions"] = cb_price_concessions(rows)
        if name == "cmu_hinglish_dog":
            s["hinglish"] = hinglish_profile(rows)
        # labels
        labelled = [r for r in rows if r["labels"] and not r["is_action"]]
        acts = C.Counter(l for r in rows if r["is_action"] and r["labels"] for l in r["labels"])
        s["action_events"] = dict(acts)
        for lab, v in acts.items():
            o = MAP.get(name, {}).get(lab, ("UNMAPPABLE",))[0]
            s.setdefault("action_mapped", C.Counter())[o] += v
        dist = C.Counter(l for r in labelled for l in r["labels"])
        s["labelled_utterances"] = len(labelled)
        s["label_distribution"] = {k: {"n": v, "pct": round(100 * v / max(1, sum(dist.values())), 2)} for k, v in dist.most_common()}
        s["multi_label_utterances"] = sum(1 for r in labelled if len(r["labels"]) > 1)
        if name in MAP:
            ours, unk = C.Counter(), C.Counter()
            for r in labelled:
                o, u = map_utt(name, r["labels"])
                ours[o] += 1
                unk.update(u)
            nl = max(1, len(labelled))
            s["mapped"] = {k: {"n": v, "pct": round(100 * v / nl, 2)} for k, v in ours.most_common()}
            s["mapped_any_pct"] = round(100 * (nl - ours["UNMAPPABLE"]) / nl, 2) if labelled else 0.0
            s["mapped_non_other_pct"] = round(100 * (nl - ours["UNMAPPABLE"] - ours["OTHER"]) / nl, 2) if labelled else 0.0
            s["source_labels_without_mapping"] = dict(unk)
            for lab, (o, c, note) in MAP[name].items():
                mapping_rows.append([name, lab, o, c, note, dist.get(lab, 0) or acts.get(lab, 0)])
            for lab in unk:
                mapping_rows.append([name, lab, "UNMAPPABLE", "-", "label seen in data but not in mapping table", unk[lab]])
        # samples (seed 42), text-only utterances
        rng = random.Random(SEED)
        pool = [r for r in rows if not r["is_action"] and r["text"].strip()]
        samp = rng.sample(pool, min(50, len(pool)))
        (OUT / f"samples_{name}.json").write_text(json.dumps(
            [{"split": r["split"], "spk": r["spk"], "labels": r["labels"], "price": r["price"], "text": scrub(r["text"], 220)}
             for r in samp], indent=1, ensure_ascii=False), encoding="utf-8")
        s["sample50"] = {"amount_pattern": sum(1 for r in samp if AMOUNT_RX.search(r["text"])),
                         "any_digit": sum(1 for r in samp if re.search(r"\d", r["text"]))}
        stats[name] = s
        print(f"{name:22s} utts={len(rows):7d} labelled={len(labelled):6d} mapped_any={s.get('mapped_any_pct')}")
    # language of bargaining: gated
    stats["language_of_bargaining"] = {"status": "BLOCKED: HF gate (HTTP 401 on negotiations-data.zip)"}
    stats["overlaps"] = overlaps(all_rows)
    # mapping summary rows added for unlabelled datasets
    mapping_rows.append(["cmu_hinglish_dog", "(no labels)", "UNMAPPABLE", "-", "translation pairs only; no dialogue acts", 0])
    mapping_rows.append(["language_of_bargaining", "n (numeric offer)", "ANCHOR", "medium", "UNVERIFIED: from card text only; data gated; new number = anchor or counter", ""])
    mapping_rows.append(["language_of_bargaining", "p (push)", "REJECT_OR_COUNTER", "medium", "UNVERIFIED: card text only", ""])
    mapping_rows.append(["language_of_bargaining", "a (allowance)", "UNCOND_CONCESSION", "medium", "UNVERIFIED: card text only; move toward other without number; conditionality via 'External Incentive'=y -> COND_CONCESSION (low)", ""])
    mapping_rows.append(["language_of_bargaining", "c (comparison)", "OTHER", "medium", "UNVERIFIED: card text only; external price reference = justification", ""])
    mapping_rows.append(["language_of_bargaining", "r (repetition)", "REJECT_OR_COUNTER", "low", "UNVERIFIED: card text only; repeat of own offer = insist", ""])
    mapping_rows.append(["language_of_bargaining", "e (end/accept)", "ACCEPT", "high", "UNVERIFIED: card text only", ""])
    mapping_rows.append(["craigslist_bargains", "(derived) price moves toward opponent", "UNCOND_CONCESSION / COND_CONCESSION", "low",
                         "COMPUTED heuristic over metadata.price; COND if 'if you/in exchange' etc.", ""])
    with open(REPO / "docs" / "dataset-audit" / "label_mapping.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["source_dataset", "source_label", "our_label", "confidence", "notes", "source_label_count_COMPUTED"])
        w.writerows(mapping_rows)
    save_json("dialogues_stats", stats)
    print("overlaps:", json.dumps(stats["overlaps"], indent=0)[:1500])


def _group(rows, key):
    g = C.defaultdict(set)
    for r in rows:
        g[r[key]].add(r["dlg"])
    return g


if __name__ == "__main__":
    main()

"""Metadata audit of L3Cube Hinglish models (no weight download).

Usage: .venv/Scripts/python -I ml/scripts/audit/audit_models.py
Reads the HF API + config.json/tokenizer_config.json + README for each model.
VRAM estimate = fp32 params*4 bytes (inference); fine-tune ~ 4x that with Adam (rule of thumb, labelled ESTIMATE).
"""
from __future__ import annotations

import re
import sys
from pathlib import Path

import requests

sys.path.insert(0, str(Path(__file__).resolve().parent))
from common import RAW, UA, save_json  # noqa: E402

MODELS = ["l3cube-pune/hing-bert", "l3cube-pune/hing-roberta", "l3cube-pune/hing-mbert",
          "l3cube-pune/hing-roberta-mixed", "l3cube-pune/hing-bert-lid"]


def get(url):
    r = requests.get(url, headers=UA, timeout=60)
    return r


def main():
    out = {}
    for m in MODELS:
        info = get(f"https://huggingface.co/api/models/{m}?blobs=true").json()
        sha = info.get("sha")
        files = {s["rfilename"]: s.get("size") for s in info.get("siblings", [])}
        cfg = get(f"https://huggingface.co/{m}/resolve/{sha}/config.json").json()
        tok = get(f"https://huggingface.co/{m}/resolve/{sha}/tokenizer_config.json")
        tok = tok.json() if tok.status_code == 200 else {}
        readme = get(f"https://huggingface.co/{m}/resolve/{sha}/README.md").text
        d = RAW / "models_meta" / m.replace("/", "__")
        d.mkdir(parents=True, exist_ok=True)
        (d / "README.md").write_text(readme, encoding="utf-8")
        weights = {k: v for k, v in files.items() if re.search(r"\.(bin|safetensors)$", k)}
        wbytes = max(weights.values()) if weights else None
        lic_lines = [ln.strip() for ln in readme.splitlines() if re.search(r"licen", ln, re.I)][:5]
        out[m] = {
            "sha": sha, "gated": info.get("gated"), "license_tags": [t for t in info.get("tags", []) if t.startswith("license:")],
            "card_license_lines": lic_lines, "pipeline_tag": info.get("pipeline_tag"),
            "architecture": cfg.get("architectures"), "model_type": cfg.get("model_type"),
            "hidden": cfg.get("hidden_size"), "layers": cfg.get("num_hidden_layers"), "vocab": cfg.get("vocab_size"),
            "max_position_embeddings": cfg.get("max_position_embeddings"),
            "tokenizer_class": tok.get("tokenizer_class"), "model_max_length": tok.get("model_max_length"),
            "weight_files": weights, "approx_params_M": round(wbytes / 4 / 1e6, 1) if wbytes else None,
            "fp32_inference_GB": round(wbytes / 1e9, 2) if wbytes else None,
            "finetune_adam_fp32_GB_estimate": round(4 * wbytes / 1e9, 2) if wbytes else None,
        }
        print(m, out[m]["license_tags"], out[m]["approx_params_M"], out[m]["max_position_embeddings"], out[m]["tokenizer_class"])
    save_json("models_stats", out)


if __name__ == "__main__":
    main()

"""Regenerate data/checksums.txt (sha256 + bytes of every file under data/raw/).

Usage: .venv/Scripts/python -I ml/scripts/audit/checksums.py
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from common import CHECKSUMS, write_checksums  # noqa: E402

if __name__ == "__main__":
    write_checksums()
    print(CHECKSUMS.read_text(encoding="utf-8"))

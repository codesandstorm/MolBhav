#!/usr/bin/env sh
# Regenerate every audit number. Run from the repo root:  sh ml/scripts/audit/run_all.sh
# Python deps: pip install -r ml/scripts/audit/requirements-audit.txt
# (pandas 2.2.3 / pyarrow 17 pinned: newer wheels were blocked by Windows Application Control on the dev laptop)
set -e
PY=${PY:-.venv/Scripts/python}
[ -x "$PY" ] || PY=.venv/bin/python
"$PY" -I -X utf8 ml/scripts/audit/download.py
"$PY" -I -X utf8 ml/scripts/audit/audit_dialogues.py > ml/scripts/audit/_out/run_dialogues.log
"$PY" -I -X utf8 ml/scripts/audit/audit_tabular.py > ml/scripts/audit/_out/run_tabular.log
"$PY" -I -X utf8 ml/scripts/audit/audit_hinglish_extra.py > ml/scripts/audit/_out/run_hinglish_extra.log
"$PY" -I -X utf8 ml/scripts/audit/audit_models.py > ml/scripts/audit/_out/run_models.log
"$PY" -I -X utf8 ml/scripts/audit/checksums.py > /dev/null
"$PY" -I -X utf8 ml/scripts/audit/build_catalogue.py
echo "done: see ml/scripts/audit/_out/*.json, data/checksums.txt, docs/dataset-audit/catalogue.csv"

#!/usr/bin/env bash
# One-time setup. Run from this folder, logged in as the repo owner:  gh auth login
# Usage: bash setup_github.sh <your-github-username> <vinay-user> <pavitra-user> <tanishka-user>
set -euo pipefail
OWNER="${1:?your github username}"; VINAY="${2:?}"; PAVITRA="${3:?}"; TANISHKA="${4:?}"
REPO="$OWNER/MolBhav"

git init -b main
git add .
git commit -m "chore: initial project structure, templates and CI"
gh repo create "$REPO" --private --source=. --remote=origin --push

# Branch protection BEFORE any real code (needs checks to have run once to be selectable, names are set here)
gh api -X PUT "repos/$REPO/branches/main/protection" --input - <<JSON
{
  "required_status_checks": {"strict": true, "contexts": ["backend-ml", "frontend"]},
  "enforce_admins": false,
  "required_pull_request_reviews": {"required_approving_review_count": 1, "dismiss_stale_reviews": true},
  "restrictions": null
}
JSON

for u in "$VINAY" "$PAVITRA" "$TANISHKA"; do
  gh api -X PUT "repos/$REPO/collaborators/$u" -f permission=push
done
echo "Done. Teammates must accept the invite emails, then each pushes task/<ID>-hello and opens a PR."

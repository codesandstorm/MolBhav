# MolBhav

India-first negotiation-preparation platform for freelancers. Skill project, deadline **15 Nov 2026**.

| Folder | What lives here | Owner |
|---|---|---|
| `frontend/` | Web app (PWA) | Vinay, Tanishka (UI) |
| `backend/` | API, database, auth | Sandarbh |
| `ml/` | Models, training, evaluation | Sandarbh, Pavitra |
| `data/` | README + links only. No raw data in git | Tanishka, Vinay |
| `results/` | Metrics tables, figures, evaluation outputs | Sandarbh, Pavitra |
| `docs/` | Briefs, decisions, design notes | everyone |
| `tracker/` | Exports/notes from the Google Sheet tracker | Sandarbh |

## Workflow (read this once)
1. Pick a task from the tracker. Note its Task ID (e.g. `ML-03`).
2. Branch from `main`: `git checkout -b task/ML-03-short-name`
3. Commit with [Conventional Commits](https://www.conventionalcommits.org): `feat(ml): add baseline classifier`
4. Push and open a PR. Fill in the PR template. Put the PR link in the tracker (column V) and set Status = In Review.
5. The reviewer named on the task approves the PR and sets Review result = Approved in the tracker.
6. Merge only after: 1 approval + passing checks. Never push directly to `main`.

## Never commit
API keys, `.env` files, raw interview data, anything with personal details, large datasets or model binaries.
Use `.env.example` for variable names and `data/README.md` for dataset links.

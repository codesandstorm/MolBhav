# Contract-clause datasets for T5: CUAD, ContractNLI, LEDGAR
Verdict: CUAD USE-WITH-CONDITIONS; ContractNLI RESEARCH-ONLY; LEDGAR USE-WITH-CONDITIONS  | Role: SKIP (T5 is optional/later)

Tier 3, metadata only (HF API; nothing downloaded).

| | CUAD | ContractNLI | LEDGAR |
|---|---|---|---|
| Source checked | HF `theatticusproject/cuad` rev `a3c393f5d103` [VERIFIED] | HF mirror `kiddothe2b/contract-nli` rev `059927b911` [VERIFIED]; official site https://stanfordnlp.github.io/contract-nli/ (licence line not found in fetched HTML) | HF `coastalcph/lex_glue` config `ledgar`, rev `c23fdff1a6` [VERIFIED] |
| Licence | `license:cc-by-4.0` [VERIFIED tag] | mirror `license:cc-by-nc-sa-4.0` [VERIFIED tag]; official licence [UNVERIFIED] | LexGLUE `license:cc-by-4.0` [VERIFIED tag]; LEDGAR's original licence [UNVERIFIED] |
| Provenance | US contracts from SEC EDGAR (file names like `…_10-Q_EX-10.27_…`) [VERIFIED file list] | NDAs (per mirror files `contract_nli.zip`) [VERIFIED names only] | "contract provisions come from contracts obtained from the US Securities and Exchange Commission (SEC) filings" [VERIFIED LexGLUE card] |
| Size | CUAD_v1.json 40,128,638 B plus PDFs [VERIFIED API] | zips 723,022 B and 1,868,251 B [VERIFIED API] | parquet splits (sizes in API) |

- Domain fit: US corporate contracts, not Indian freelance agreements. Useful later only for generic clause types (payment terms, termination, IP assignment, non-compete).
- Recommended: SKIP until after 15 Nov. If T5 starts, CUAD first (CC-BY-4.0, clause-level labels). Effort about 6 h.

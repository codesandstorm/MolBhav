# Open questions: things only you can do

Nothing below has been clicked, signed, requested or logged into.

## A. Accept / request access
1. **Language of Bargaining (HF gate).** First read the Data License Agreement: https://drive.google.com/file/d/1VXLYPIgd8rm6SoLXaH97KeDqwYmEmFc5/view?usp=share_link . Then, logged into your own HF account, open https://huggingface.co/datasets/ChicagoHAI/language-of-bargaining , fill First Name, Last Name, Email, Affiliation, Job Title, tick "By clicking Submit below I acknowledge that I have read the data license agreement…", and press **Submit**. Afterwards run `huggingface-cli login` locally (your token, not shared) and `.venv/Scripts/python -I ml/scripts/audit/download.py language_of_bargaining`. Before using it, check whether the DLA permits a graded project/demo.
2. **IND (IIT Patna).** Open https://www.iitp.ac.in/~ai-nlp-ml/resources.html in a normal browser (the list is script-rendered and was empty for the fetcher). Find the price-negotiation dataset entry and its request form/email and agreement. Decide whether the turnaround fits 15 Nov. Do not expect it in time.
3. **HinGE.** No public repo found (github.com/vivek-srivastava/HinGE is 404). If wanted, email the authors listed on https://aclanthology.org/2021.eval4nlp-1.20/ asking for the data link and licence.

## B. Fetch blocked primary sources (compliance, T4)
All three compliance cards are UNVERIFIED because automated fetches got 403/404/TLS errors. In a browser, save the page/PDF and send me the file, or paste the section text:
4. Income-tax Act, 2025, s.393(1) table rows for professional/technical fees: egazette.gov.in or incometax.gov.in → "Income-tax Act, 2025". Need rate, threshold, commencement.
5. IGST Act s.2(6), s.16 and CGST Rules r.96A (LUT, RFD-11): https://cbic-gst.gov.in/gst-acts.html → IGST Act / CGST Rules.
6. MSMED Act 2006 s.2(b), s.15, s.16 and Income-tax Act 1961 s.43B(h) (and its 2025-Act successor): https://www.indiacode.nic.in/ .
Each card names a reviewer role. A CA should sign off before the app displays any figure.

## C. Kaggle / Upwork (only if you still want them)
7. Confirm the real slugs of asaniczka "freelance contracts 1.3M" and kanchana1990 "data science freelancer listings" from Kaggle in your browser. The guessed URLs gave 404.
8. Read Upwork's Terms of Use (https://www.upwork.com/legal returned 403 to the fetcher) for any clause on scraping/automated collection before using any Upwork-derived dataset.

## D. Decisions for the team
9. Accept CraigslistBargain's unknown licence as "research use in a student project", or drop it? (Recommended: keep it, state it in the report.)
10. Who owns each dataset (the `owner` column in data/README.md is TBD)?
11. Where does the shared private copy live (team drive?). Raw data must never enter git.
12. Gold set: put the 30 scenarios + annotations somewhere outside git (or encrypted), then re-run `audit_dialogues.py` to re-check 8-gram overlap with public data.

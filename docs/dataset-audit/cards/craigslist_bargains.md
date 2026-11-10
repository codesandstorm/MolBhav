# CraigslistBargain (He et al. 2018)
Verdict: RESEARCH-ONLY  | Role: AUXILIARY TRAIN

Audited 2026-11-10.

## Access and legal
- HF id `craigslist_bargains` redirects (HTTP 307) to `stanfordnlp/craigslist_bargains`, revision `cfb6992c5ca9bad209323ed8e42e0cfc7e4178cf` [VERIFIED]. The HF repo holds only a loading script. Data were downloaded from the official CodaLab bundles named in the script (train `0xd34bbbc5…/parsed.json`, validation `0x15c4160b…/parsed.json`, test `0x54d325bb…/`) [VERIFIED, script lines 47-49]. No gate.
- Licence: HF metadata `license: unknown`; card "Licensing Information: [More Information Needed]"; script `_LICENSE = ""` [VERIFIED]. The `stanfordnlp/cocoa` code repo is MIT ("MIT License / Copyright (c) 2022 Stanford NLP") [VERIFIED], but that covers code, not the dialogues. **Data licence: unknown → research-only.**
- Provenance: listings "scraped postings on sfbay.craigslist.org"; dialogues collected on "AMT" [VERIFIED, HF card quoting the paper]. Risk: Craigslist listing titles/descriptions in `scenario.kbs` are third-party scraped content. The dialogue text itself is worker-written.
- PII regex full pass (49,362 text utterances) [COMPUTED]: email 0, phone 15, url 3, handle 1, long_id 0. Phone hits are mostly prices/numbers matched by the loose pattern; not individually reviewed [UNVERIFIED that any is a real phone].

## Integrity
- Files [COMPUTED]: train.json 20,148,723 B; validation.json 2,287,054 B; test.json 2,937,841 B.
- Dialogues: train 5,247 / validation 597 / test 838 [COMPUTED] = documented 5,247 / 597 / 838 [VERIFIED, HF `num_examples` and card table]. Match.
- Events 61,209 = 49,362 messages + 11,847 actions (offer 5,760, accept 5,025, quit 598, reject 464) [COMPUTED]. Per split events: train 47,986, validation 5,475, test 7,748 [COMPUTED].
- Duplicates: exact 8.69%, normalised 12.32% [COMPUTED]. Empty 0; encoding issues 0 [COMPUTED].

## Schema and labels
- Per dialogue [VERIFIED]: `uuid, scenario{category, kbs[2]{personal{Role, Target, Bottomline}, item{Title, Category, Price, Description, Images}}}, agents, outcome{reward, offer{price}}, events[{agent, action, data, time, metadata{intent, price}}]`.
- Labels: `metadata.intent` per message, **rule-based** (card: "generated via a rules-based system", `parse_dialogue.py`) [VERIFIED]. Single-label.
- **Correction to the brief**: `dialogue_acts` is not empty in train/validation. 38,791 non-test messages have an intent [COMPUTED]. It is empty only in test (0 intents in 7,748 test events [COMPUTED]), which the card documents: "`test` is not provided with `dialogue_acts`" [VERIFIED].
- Distribution (38,791) [COMPUTED]: unknown 9,479 (24.44%), counter-price 8,066 (20.79%), inquiry 5,205 (13.42%), init-price 4,517 (11.64%), intro 4,162 (10.73%), inform 2,448 (6.31%), disagree 2,126 (5.48%), agree 1,929 (4.97%), insist 447 (1.15%), vague-price 412 (1.06%).
- Mapped [COMPUTED]: REJECT_OR_COUNTER 11,051 (28.49%), UNMAPPABLE (unknown) 9,479 (24.44%), OTHER 6,610 (17.04%), INFO_REQUEST 5,205 (13.42%), ANCHOR 4,517 (11.64%), ACCEPT 1,929 (4.97%). Mapped at all 75.56%; to a non-OTHER move 58.52%. Actions: ANCHOR (offer, low) 5,760, ACCEPT 5,025, REJECT 464, OTHER 598 [COMPUTED].
- Concessions are not labelled, but they can be **derived**: a message whose `metadata.price` moves toward the opponent's last price gives 3,295 UNCOND + 627 COND (has "if you / in exchange…") [COMPUTED heuristic, low confidence]. Price metadata present on 31.5% of non-test messages [COMPUTED].
- Label quality from sample reading: noisy. "ok ill take it" → unknown; "I can do 13000 and can pick it up…" → agree (actually a counter); "Sure will, about 7." → counter-price with price null.

## Domain fit
50 sampled (seed 42), read [COMPUTED].
- Domain: second-hand goods and rentals (categories by utterance [COMPUTED]: furniture 12,315, housing 10,602, bike 8,471, car 7,034, electronics 6,128, phone 4,812). Roles: buyer/seller with private target prices, the closest audited analogue to client/freelancer.
- Amount pattern 13/50 sample, 24.57% full pass; any digit 42.2% [COMPUTED]. Firm 2.69%, soft 20.01% [COMPUTED]. Register: casual US English, USD only.
- Mismatch: goods, not services; one-shot price, no scope/timeline/payment terms; USD, no "k/L" notation.
- Good: "…if I keep shopping around I can find it for around 2200, how close can you get to that price?" (counter + comparison); "I'm sorry, but I can't go that low. I'm willing to do $2236, however." (counter/concession); "The asking price is $2295 but I can come down a bit." (soft anchor).
- Worst: "ok ill take it" (mislabelled unknown); "I can do 13000…" (mislabelled agree); "No, you got put in the wrong area. I just sold the …" (off-task).

## Task-specific checks
- T1: numeric offers 24.57% [COMPUTED]. Turn length mean 13.33 words, p50 11, p90 27, max 121 [COMPUTED]. Roles buyer 30,823 / seller 30,386 events [COMPUTED].

## Risks and leakage
- Cross-dataset exact overlap: CaSiNo 25, P4G 26, DND 11 utterances (≥6 words) [COMPUTED]. Generic. Repo overlap 0 [COMPUTED].
- Test split exists (838 dialogues, no intents). 104 test utterances (≥6 words) also appear in train/validation [COMPUTED]. Keep the test split untouched.

## Recommended use
- Role: AUXILIARY TRAIN (ANCHOR / REJECT_OR_COUNTER / ACCEPT / INFO_REQUEST plus amount extraction for "$" amounts; derived concessions at low weight).
- Benefit: highest of the accessible sets. Effort: about 4 h (flatten, map, drop `unknown`, derive concessions, relabel a 200-utterance check sample).
- Main risk: unknown licence, plus rule-based labels with about 24% unknown [COMPUTED] and visible errors (seen in the 50-utterance sample). Report as research use; never redistribute.

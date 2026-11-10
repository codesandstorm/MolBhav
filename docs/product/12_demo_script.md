# 12 · Demo script

Draft v0.1 (solo, no fixed deadline). Tags: [EVIDENCE: path] · [HYPOTHESIS] · [GAP]. The full script needs Phases A–D and SC; each phase demo in [03_scope_and_cut_line.md](03_scope_and_cut_line.md) is a subset. Every line said aloud must be a KEEP claim in [11_claims_register.md](11_claims_register.md).

**Example deal** (self-authored, shown as "Example deal (made up)"): a developer quoted ₹45,000 for a website; the client replies "Bhai budget tight hai, 30k mein ho jayega?" [EVIDENCE: 03_scope_and_cut_line.md illustrative scenario; HYPOTHESIS: realistic, not observed].

## 1. Golden path
1. Showcase hero: the ladder rises to floor/target/opening for the example deal.
2. Scroll: message sorted → crossroads → ledger → abacus.
3. "Open the app" → the same example deal opens in the app.
4. Ladder screen: tap the floor → trace.
5. Paste the client reply → move, reason, ₹30,000, confidence; "Stays on this device".
6. Options: Hold · Trade (₹42,000 if 50% advance) · Walk away. Choose Trade.
7. Draft: template, then AI draft with "numbers checked" (if on).
8. Log outcome ₹42,000 with advance → debrief: conditional vs unconditional.
9. Evidence panel: every number with its label.

**The wow moment** [HYPOTHESIS]: in the app, the user types "30k" and the **same ladder** from the showcase hero appears flat on screen with the client's offer marked as a line *below the floor*, then the Trade option lands exactly on a rung. The showcase metaphor becomes the working tool in one cut.

## 2. Five-minute demo
[HYPOTHESIS: script, not rehearsed]; every spoken line maps to a claim ID in 11_claims_register.md

| Time | Show | Say (KEEP claims only) |
|---|---|---|
| 0:00–0:30 | problem slide: the example message | "A client asks for a third off. You have minutes to answer and no written walk-away number. That's the moment MolBhav is for. Everything about users here is a hypothesis; we did no user research." |
| 0:30–1:30 | showcase: hero ladder, then the four scenes at reading pace | "Know your floor before they name their price. Every number in these scenes comes from the real engine." |
| 1:30–2:15 | app: example deal, ladder, tap the trace | "Every number shows its working." (C1) |
| 2:15–3:00 | paste the message; result chips; device lock | "The message is read on this device. It is not sent to us or any AI service." (C3) |
| 3:00–3:45 | options → Trade → draft; toggle AI off → template | "Don't cave. Trade. And it works without AI." (C5) |
| 3:45–4:20 | log outcome → debrief → evidence panel | "Shows what you gave away." (C11) |
| 4:20–5:00 | eval slide: baseline (and model if it won) with 95% CIs, "self-authored, directional"; limits slide | "This is measured on messages I wrote myself, so it's directional, not real-world accuracy." [EVIDENCE: 04_research_integrity.md §5] |

## 3. Ninety-second demo
[HYPOTHESIS: script, not rehearsed]; same claim rule as §2

| Time | Show | Say |
|---|---|---|
| 0–15 s | hero ladder rising | "Know your floor before they name their price." |
| 15–30 s | open app → example ladder → trace | "Every number shows its working." |
| 30–55 s | paste message → chips → lock icon | "Read on this device. Not sent anywhere." |
| 55–80 s | Trade option → draft → debrief | "Trade, don't cave, and see what you gave away." |
| 80–90 s | one slide: limits | "No user research; scores are on self-authored data, with confidence intervals." |

## 4. Fallbacks for each live dependency
| Dependency | Failure | Fallback (rehearsed) | Tag |
|---|---|---|---|
| Internet / Wi-Fi | down | site and app installed as PWA and cached; a local `vite preview` build on the laptop; recorded video of the full run as last resort | [HYPOTHESIS]; recording [GAP: make after SC] |
| WebGL / GPU on the demo machine | scene fails or stutters | static fallback is automatic; say "this is the static version every low-end phone gets" | [EVIDENCE: 08_experience_and_brand.md §8.3] |
| LLM provider / `/v1/draft` Worker | error, slow or over limit | toggle AI off → template; already part of the script (C5) | [EVIDENCE: 02_service_catalogue.md S6] |
| Analyser gives a wrong or low-confidence result | wrong chip | show "pick one" chips on purpose; correct it; plan updates | [EVIDENCE: 05_judge_qa.md T28] |
| IndexedDB empty / cleared | example deal missing | "Try an example deal" button recreates it from code | [HYPOTHESIS] |
| Projector colour / size | labels hard to read | high-contrast theme toggle; browser zoom 125% tested in advance | [GAP: theme not designed] |
| Laptop | dies | the same build on a phone (PWA) | [HYPOTHESIS] |

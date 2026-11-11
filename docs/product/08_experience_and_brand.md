# 08 · Experience and brand

Draft v0.1 (solo, no fixed deadline, no user research). Tags: [EVIDENCE: path] · [HYPOTHESIS] · [GAP]. Nothing here has been tested with users; all experience targets are [HYPOTHESIS] until measured in-product with consent ([04_research_integrity.md](04_research_integrity.md) §4).

Two surfaces, two moods (D8 [EVIDENCE: 03_scope_and_cut_line.md]):
- **Showcase** (public site): immersive, scroll-driven 3D that explains each service. Allowed to be expressive [HYPOTHESIS: design].
- **App** (the working tool): calm, fast, accessible. No 3D, no scroll effects, no sound. Motion only to show cause and effect (≤200 ms) [HYPOTHESIS: budget].

## 1. Tone of voice
| Principle | Do | Don't | Tag |
|---|---|---|---|
| Calm, like a senior friend | "You can hold ₹45,000 and offer a smaller first milestone." | "Crush your negotiation!" | [HYPOTHESIS] |
| Numbers with their source | "Floor ₹38,000 · calculated from your costs and hours" | "Your market rate is ₹40k" | [EVIDENCE: 02_service_catalogue.md claim labels] |
| Options, not orders | "Three ways to reply" | "You should say…" | [EVIDENCE: 02_service_catalogue.md S5] |
| Honest about uncertainty | "Not sure what they mean. Pick one:" | "AI detected…" | [HYPOTHESIS] |
| Respectful of the client | "Ask what's fixed in their budget." | anything that mocks or tricks the client | [EVIDENCE: 02_service_catalogue.md "We will NOT provide"] |

**Hinglish** (draft templates only, opt-in, D4 [EVIDENCE: 03_scope_and_cut_line.md]): Roman script, "aap", polite and plain, English for numbers and terms like "milestone" and "advance" [HYPOTHESIS: register chosen by the developer, not tested]. Example template (self-authored): "Budget tight hai, samajh aata hai. ₹45,000 mein poora scope rahega. Agar 50% advance mil jaye to ₹42,000 kar sakte hain." Numbers are always slot-filled from the engine.
UI microcopy stays in English in V1 [HYPOTHESIS: a Hinglish UI is not planned until users ask via consented feedback].

## 2. First run under 60 seconds
| Second | Screen | User action | Tag |
|---|---|---|---|
| 0–5 | Welcome: one line + two buttons, "Try an example deal" / "Start my deal"; 18+ line | tap | [HYPOTHESIS] |
| 5–35 | Deal setup (4 fields only): quoted price, unit (fixed/hour/month), days of work, monthly income you need | type 4 numbers | [HYPOTHESIS] |
| 35–45 | Price ladder appears: floor / target / opening, each with "how we got this" | read | [EVIDENCE: 02_service_catalogue.md S2] |
| 45–60 | "Got a reply from your client? Paste it." with the on-device line | paste or skip | [EVIDENCE: 07_trust_safety_compliance.md §5] |
Costs, buffer and timeline are asked later, with defaults shown as USER DECISION, never silently assumed [EVIDENCE: 02_service_catalogue.md S2 "no guessed default"]. Measured target: median first-ladder time < 60 s from opt-in counts [HYPOTHESIS: not measurable without consent].

## 3. Screen inventory (app)
[HYPOTHESIS: design proposal, not built or tested; applies to every row below unless a row carries its own tag]

| # | Screen | Service | Key elements |
|---|---|---|---|
| 1 | Welcome / first run | n/a | 2 buttons, 18+ line, privacy line |
| 2 | Deals list | S1 | deal cards: client label, quoted ₹, status |
| 3 | Deal setup | S1 | 4 required fields, "add more detail" |
| 4 | Price ladder | S2, S3, S7 | 3 rungs, trace expanders, optional benchmark (ESTIMATE, n) |
| 5 | Client reply | S4b | paste box, on-device line, result chips, manual picker |
| 6 | Reply options | S5 | 2–3 option cards with reason and numbers |
| 7 | Draft | S6 | editable text, "copy", template/AI badge |
| 8 | Evidence panel | S7 | side sheet: every claim with label + source |
| 9 | Log outcome | S8 | final price, what you got in return |
| 10 | Debrief | S8 | concessions: conditional vs unconditional, one lesson |
| 11 | Settings & privacy | S13, S14 | toggles (all off by default), delete everything, contact |

## 4. States
[HYPOTHESIS: design proposal, not built or tested; applies to every row below unless a row carries its own tag]

| Screen | Empty | Loading | Error | Low confidence |
|---|---|---|---|---|
| Deals list | "No deals yet. Start with the one you're quoting now." | n/a (local) | "Couldn't read saved deals on this device. Export what's left?" | n/a |
| Price ladder | "Add days of work to calculate." (names the missing field) | none: instant, deterministic | "These numbers don't add up: target is below floor. Check costs." | n/a |
| Client reply | paste box with example placeholder | "Reading on this device…" (< 1 s target [HYPOTHESIS]) | "Couldn't find an amount. Type it:" | "Not sure what they mean. Pick one:" + 3 chips + "something else" |
| Reply options | "Tell us what they said to see options" | n/a | generic options + reason | options shown with "based on your pick" |
| Draft | template shown instantly | "Writing a draft…" with "use the template" button | "AI draft unavailable. Here's the template." | n/a |
| Debrief | "Log how it ended to see your debrief" | n/a | n/a | n/a |

## 5. Trust cues
[HYPOTHESIS: design proposal, not built or tested; applies to every row below unless a row carries its own tag]
- A label chip on **every** number: CALCULATION / ESTIMATE / USER DECISION / FACT / RECOMMENDATION; tapping it opens the trace [EVIDENCE: 02_service_catalogue.md S7].
- A persistent "on this device" lock icon on the paste screen; it changes to "sent to server" only if an opt-in server path is on [EVIDENCE: 07_trust_safety_compliance.md §5].
- Draft badge: "Template" or "AI draft · numbers checked".
- Self-authored examples say so: "Example deal (made up)".
- Scores in the about page always carry "self-authored, directional" and the CI [EVIDENCE: 04_research_integrity.md §5].

## 6. Accessibility (app and showcase)
Target WCAG 2.2 AA [HYPOTHESIS: standard chosen, not audited]. Rules: full keyboard path through the golden flow; visible focus; labels never by colour alone (rungs carry text "Floor/Target/Opening"); numbers read as words by screen readers with their label ("Floor, 38,000 rupees, calculation"); touch targets ≥ 44 px; `prefers-reduced-motion` respected everywhere; text resizable to 200% without loss. Test: axe-core in CI + one keyboard-only run per phase demo [EVIDENCE: 03_scope_and_cut_line.md Phase D exit].

## 7. Copy deck (key screens)
[HYPOTHESIS: draft copy, untested with users; every ₹ figure is a made-up example]

| Screen | Element | Copy |
|---|---|---|
| Welcome | headline | "Walk into the price talk with a number you can defend." |
| Welcome | sub | "Calculate your floor, read your client's reply, and choose a counter that trades instead of caves." |
| Welcome | buttons | "Try an example deal" · "Start my deal" |
| Setup | field hints | "What did you quote?" · "Per project, hour or month?" · "How many working days?" · "What do you need to earn in a month?" |
| Setup | monthly need hint | "Before income tax. Prices here exclude GST." [EVIDENCE: docs/product/13_price_ladder_spec.md §2, D-L5; apps/app/src/copy.ts] |
| Setup | billable capacity helper | "Count only days you can charge for: leave out admin, learning, holidays and slow weeks." (hours version: "Count only hours you can charge for: leave out admin, learning, holidays and slow weeks.") [EVIDENCE: docs/product/13_price_ladder_spec.md §2, D-L1; apps/app/src/copy.ts] |
| Ladder | rung labels | "Floor: don't go below this" · "Target: what you aim for" · "Opening: where you start" |
| Ladder | trace | "₹38,000 = (₹90,000 monthly need ÷ 18 working days) × 7 days + ₹3,000 costs" (example; real formula in Phase A spec [GAP]) |
| Reply | box placeholder | "Paste what your client said" |
| Reply | privacy line | "Stays on this device. Not sent to us or to any AI service." |
| Reply | result | "Asking for a lower price · Reason: budget · Mentions ₹30,000 (fixed)" |
| Reply (S4b, as built in B1.1) | title · lede | "Read your client’s reply" · "Paste their message. MolBhav sorts out what they are doing, why, and any amount they mention. You can correct every part." [HYPOTHESIS: untested with users] [EVIDENCE: apps/app/src/copy.ts `reader`] |
| Reply (S4b) | entry points | Welcome: "Read a client’s reply" · Ladder: "Got a reply from your client? Paste it." + "Read their reply" [HYPOTHESIS] |
| Reply (S4b) | privacy line (C3) | "**Stays on this device.** MolBhav reads your client’s message on your phone or laptop. It is not sent to us or to any AI service." (07 §5; shown while the privacy test passes) [HYPOTHESIS: wording] |
| Reply (S4b) | deal state (USER DECISION) | "Have you sent them a quote yet?" Yes · Not yet · Not sure (drives ANCHOR vs COUNTER) [HYPOTHESIS] |
| Reply (S4b) | every output | value + `ESTIMATE` chip + "confidence N% · read by rules on your device; may be wrong" (no accuracy figure until the frozen test set is scored) [HYPOTHESIS: wording] |
| Reply (S4b) | move names | "Names a price or asks for one" · "Pushes back on the price" · "Moves towards you" · "Asks for information" · "Agrees" · "Something else"; sub-lines "Their first number: an anchor" / "A counter to your quote"; "With a condition attached" / "With nothing asked in return" [HYPOTHESIS] |
| Reply (S4b) | objection names | "Budget" · "Amount of work" · "Timeline" · "Payment terms" · "Trust in you" · "Another quote or freelancer" · "No reason given" [HYPOTHESIS] |
| Reply (S4b) | low confidence · no evidence | "Not sure what they mean. Pick one:" · "Couldn’t tell what they are doing. Pick one:"; when confident: "Not right? Pick it yourself" (picker always shown, A9) [HYPOTHESIS] |
| Reply (S4b) | amount | "Amount they mention" (ESTIMATE until edited, then USER DECISION) · none found: "Couldn’t find an amount. Type it:" · unclear: e.g. "two different prices: check which one they mean" [HYPOTHESIS] |
| Reply (S4b) | footer | "These rules have not been scored on a test set yet." [HYPOTHESIS] |
| Options | titles | "Hold the price, add something small" · "Trade: lower price if 50% advance" · "Walk away politely" |
| Options | floor guard | "This is below your floor of ₹38,000. Go ahead anyway?" (USER DECISION) |
| Draft | badges | "Template" · "AI draft · numbers checked" |
| Debrief | summary | "You gave ₹5,000 in total: ₹3,000 in exchange for an advance, ₹2,000 for nothing." |
| Debrief | lesson | "Next time, ask for something back before lowering the price." |
| Settings | delete | "Delete everything on this device" → "This can't be undone." |
| Showcase hero | eyebrow · headline (italic emphasis) · promise · CTAs | "Price-talk prep for freelancers in India" · "Know your floor *before they name their price.*" · "Your floor, target and opening are calculated from your own inputs. Every number shows its working." (C1, C2) · "Try the price ladder" · "See how it works" [HYPOTHESIS: CTA wording, A2 revision] |
| Showcase nav | links | "How it works" · "Privacy" · "Try it" (only sections that exist) [HYPOTHESIS: A2 revision] |
| Showcase example card | label · room line | "A price ladder" · "Example (made up)" · "From the opening you can come down up to {room} and still reach the target." (S1; values from packages/engine at build time) |
| Showcase story | rung captions | Floor (Stone) "Don’t go below this. The lowest price that still pays what you need to earn for the days this work takes, plus its costs. It is heavy on purpose: you stand on it." · Target (Glass) "What you aim for. Your floor plus a margin. This is the price you hope to settle at, and you can see straight through to how it was made." · Opening (Light) "Where you start. Your target plus room for one or two concessions that still land on target. Say this number first." [HYPOTHESIS: the material sentences are new in the A2 revision] |
| Showcase "Why MolBhav" | heading · line · four pillars | "Why *MolBhav*" · "Built to be checked, not trusted on faith." · **Exact numbers**: "Money is worked in whole rupees with exact arithmetic, by an engine checked against hand-worked examples." [EVIDENCE: packages/engine BigInt/Rational; packages/engine/test hand_verified.json] · **Every claim labelled**: "Every number shows its working and a label: a calculation, your own decision, or a suggestion you can change." (C1) · **Private on your device**: "Your deals stay on this device. Nothing you type is sent to us." [EVIDENCE: apps/app/e2e/privacy.spec.ts] · **Practise before the call** `Planned`: "Rehearse the price talk against a client who pushes back, before the real one." [HYPOTHESIS: all wording new in the A2 revision] |
| Showcase "How it works" | three steps | **Prepare**: "Enter the days the work takes, what you need to earn and your costs. Get your floor, target and opening, with the working shown." · **Practise** `Planned`: "Paste your client’s reply and rehearse a counter that trades instead of caves." · **Debrief** `Planned`: "After the deal, see what you gave away and what you got for it." (C11 is KEEP-WHEN Phase D, hence Planned) [HYPOTHESIS: wording new in the A2 revision] |
| Showcase trust band | heading · three cards | "Private *by default*" · "Stays on your device: the deals you save, in your browser’s own storage, and the app itself." · "Never leaves it: anything you type: names, prices, costs, quotes, and the ladders made from them." · "Delete everything: one button in Settings and privacy removes every deal from this device. It can’t be undone, so the app asks first." [EVIDENCE: apps/app/src/storage.ts; apps/app/e2e/privacy.spec.ts "delete everything"] [HYPOTHESIS: wording] |
| Showcase honesty lines | example and footer | "Example (made up)" · "Calculated from made-up inputs. This is not a market rate." · "Not legal or tax advice." (T4) · "A solo student project in active development." |
| Showcase real-app section (A2.1) | kicker · heading · lede · CTA · caption | "The app" · "The same ladder, *in your hands*" · "Enter your own days, needs and costs. The app works out your floor, target and opening, and shows the working behind each one." · "Try the price ladder" · "The real app (example data, made up)" (image alt: "The MolBhav app’s price ladder screen, filled in with its made-up example deal: opening, target and floor, each with its calculation label.") [HYPOTHESIS: A2.1] |
| Showcase section kickers and footer (A2.1) | kickers · headings · footer line | "Principles" · "The flow" · "Privacy"; "How it *works*" (emphasis only); footer "Know your floor *before they name their price.*" [HYPOTHESIS: A2.1] |
| Showcase scene text alternative (A2.1) | addition | "…above a few dark stones lit from behind in copper, with a ribbon of glass curving around it and dust drifting in the light." [HYPOTHESIS: A2.1] |
| Ladder quote (A2.1) | bracket after the position | "(₹4,000 above your floor)" · "(₹2,000 below your floor)" · "(₹1,500 above your opening)" · "(exactly your floor)" / "(exactly your opening)"; amounts are examples, worked in BigInt, CALCULATION chip [EVIDENCE: apps/app/src/copy.ts `quoteDiff`] [HYPOTHESIS: A2.1 wording] |
| Ladder quote track (A2.1) | tick labels · screen-reader sentence | "Floor" · "Target" · "Opening"; "Where your quote sits on a line from your floor to your opening. {position}." [HYPOTHESIS: A2.1] |
| App welcome / setup / settings (A2 revision) | new lines | eyebrow "Price-talk prep for freelancers" · setup lede "A few answers give you a ladder. Everything stays on this device." · group titles "The work" / "The money" · settings "What stays on this device" ("The deals you save, in this browser’s own storage." · "The app itself, cached so it opens without a connection.") · "What never leaves it" ("Anything you type: names, prices, costs, quotes." · "Your ladders and the working behind them.") · "Delete everything" [HYPOTHESIS: wording new in the A2 revision; storage facts from apps/app/src/storage.ts and the PWA config in apps/app/vite.config.ts] |

## 8. Showcase direction

### 8.1 Study of lusion.co (view only)
[EVIDENCE: direct observation, listed below] Viewed **https://lusion.co/** on **2026-11-10** in an in-app browser, home page only, no assets downloaded, no code copied. Observations [EVIDENCE: observation notes in this file; not a benchmark, the pane is not a controlled device]:
- A full-screen **preloader gate** with a numeric counter before any content; in our pane it ran for roughly 20 s.
- One large **hero scene** of physically lit 3D objects filling a rounded frame, with a "scroll to explore" cue; 3 `<canvas>` elements on the page.
- ~104 network resources at load, including 20 `.buf` geometry files, 38 `.webp` images, 16 `.ogg` audio files, 4 `.mp4` videos and 1 `.exr` environment map (resource-timing count; sizes were hidden cross-origin).
- Large type; per-letter animated titles; project list with discipline tags; "keep scrolling … next page" that turns the page end into a transition.
- No `prefers-reduced-motion` rule found in the stylesheets we could read (cross-origin sheets unreadable, so not conclusive).

Principles we take (ideas, not form) [HYPOTHESIS]:
1. **One object per idea**: each service is a single, physical metaphor you can watch work.
2. **Scroll is the timeline**: scroll position drives the story of one scene; no autoplay.
3. **Motion has weight**: easing that feels physical, slow in and settle.
4. **Few words, large**: one sentence per scene.
5. **Continuity**: the end of one scene becomes the start of the next.

What we deliberately do differently [HYPOTHESIS]: **no preloader gate** (text and a static poster render first; 3D loads after); **no audio**; reduced-motion and static fallbacks; a hard performance budget for mid/low-end Android; evidence labels in HTML above the canvas, never inside it. We never reuse their layouts, assets, copy or code.

### 8.2 Original showcase: one scene per service
[HYPOTHESIS: design proposal, not built or tested; applies to every row below unless a row carries its own tag]
**Superseded in the A2 revision:** the palette and materials are now the locked v1.0 language in [15_design_language.md](15_design_language.md): dark, cream, peach-copper, and a ladder of stone (floor), glass (target) and light (opening). The paper/ink/brass description below is kept as history.

Visual language [HYPOTHESIS: original choices]: warm paper background, ink-blue + turmeric + terracotta accents; materials are matte clay and brass (cheap to render, no reflections or env maps); motifs from Indian everyday trade: the **bahi-khata** (red cloth ledger), brass weights and a balance, an abacus.

| # | Scene | Metaphor and motion | One line of copy | Real data? |
|---|---|---|---|---|
| Hero / S2 | **The ladder** (signature) | three brass rungs on a single upright; as you scroll, small weights labelled "rent", "tools", "days" drop into a tray and the **floor** rung rises to match; then target and opening slide up to their heights. Heights are exact ratios from a sample deal computed by the real engine | "Know your floor before they name their price." | yes: engine output for a labelled example deal |
| S4b | **The message, sorted** | a chat bubble (self-authored Hinglish, labelled "example") breaks into word tiles; tiles fall into three trays: *move*, *reason*, *₹ amount*; "30k" settles as "₹30,000". A glass outline of a phone encloses the trays: it stays on the device | "Read what they really asked for, on your own phone." | yes: rule baseline output |
| S5 | **The crossroads** | from the bubble, three paths unroll; the middle one carries a balance: a lower price on one pan, "50% advance" on the other, and it levels | "Don't cave. Trade." | yes: planner output |
| S7 | **The ledger** | a bahi-khata opens; every number from earlier scenes flies in and lands on a line with its label stamped beside it: CALCULATION, ESTIMATE, USER DECISION | "Every number shows its working." | yes |
| S8 | **The abacus** | beads slide for each concession: turmeric beads (got something back) and grey beads (gave it away); the frame tallies them | "See what you gave away, and what you got." | yes: debrief on the example |

**Signature visual: the ladder.** Three horizontal rungs on one upright, always in the same order bottom-up (Floor · Target · Opening), with proportional spacing and the ₹ value in HTML beside each rung. It is used in the showcase hero, the app's ladder screen (flat 2D version), the favicon (three bars) and demo slides. One shape, every surface [HYPOTHESIS].

### 8.3 Constraints (written down before building)
| Constraint | Budget / rule | Tag |
|---|---|---|
| Device target | a mid/low-end Android phone on a throttled mobile connection (lab profile, e.g. Lighthouse mobile) [HYPOTHESIS: device class; no specific device tested yet] | [GAP: pick a real test device] |
| Initial page weight | ≤ 300 KB compressed before any 3D (HTML, CSS, fonts, JS) | [HYPOTHESIS: our budget] |
| 3D per scene | ≤ 1.5 MB compressed (geometry + textures), loaded only when the scene approaches the viewport | [HYPOTHESIS] |
| Load | readable text + poster image in ≤ 2.5 s (LCP) on the lab profile; Google's "good" LCP threshold is 2.5 s [UNVERIFIED: threshold not fetched this session] | [HYPOTHESIS] |
| Frame rate | ≥ 30 fps on the low tier, 60 fps target on mid tier; if the measured average drops below 30 fps for 2 s, swap to the static poster | [HYPOTHESIS] |
| Static fallback | every scene has a poster image + the same copy + the same numbers in HTML; served when WebGL is missing, Save-Data is on, the GPU tier is low, or reduced motion is set | [HYPOTHESIS] |
| Reduced motion | `prefers-reduced-motion: reduce` → no scroll-linked animation; scenes show their end state | [HYPOTHESIS] |
| Keyboard | every scene reachable and its content readable by Tab; no scroll-jacking; a "skip to app" link first in the tab order | [HYPOTHESIS] |
| Evidence labels | labels and ₹ values are **HTML text above the canvas**, never baked into textures, never covered by animation; a test checks they are visible at each scene's end state | [HYPOTHESIS: rule] |
| No preloader gate, no audio | content first; sound never plays | [HYPOTHESIS] |
| Separation | showcase and app share the engine and tokens only; the app never imports 3D code | [EVIDENCE: 09_architecture.md §2] |
| Originality | all models, textures, copy and code made for MolBhav; asset licences recorded | [EVIDENCE: asset and licence register in 15_design_language.md §11; GSAP removed in the A2 revision] |
| HTML + CSS | ≤ 50 KB compressed for the document and its CSS | approved by the owner (A2 revision) [EVIDENCE: apps/site/budgets.ts] |
| Hero 3D code | ≤ 350 KB gzip of JavaScript for the hero scene (three, R3F, scene), counted inside the 1.5 MB scene budget | approved by the owner (A2 revision) |
| Total before interaction (derived) | ≤ initial 300 KB + one scene 1.5 MB | [CALCULATION: sum of the two rows above it in this table] |
| 3D loading | the 3D chunk downloads only after the first scroll, wheel, touch, pointer press or key press; until then the poster is the picture | owner decision (A2 revision) [EVIDENCE: apps/site/e2e/hero.spec.ts] |
| CLS | ≤ 0.1, before and after the scene takes over | approved by the owner (A2 revision) |
| TBT | ≤ 200 ms in the window before the first interaction, on the lab mobile profile | owner decision (A2 revision) |
| Long tasks after the first scroll | total long-task time in the 3 s after the first scroll, same profile: **≤ 500 ms proposed** (lab, 5 runs on 2026-11-11: min 275 / median 289 / max 303 ms; A2.1, same day on a busier machine: 562 / 756 / 843 ms, and the A2 build measured alongside it 537 / 864 / 1014 ms, so the 500 ms does not hold on that machine for either build; the 500 ms leaves headroom for slower real phones) | [HYPOTHESIS: proposed from measurements, needs the owner’s approval] |
| Poster vs first live frame (A2.1) | similarity of the poster and the first live frame, same viewport and scroll position (1 − mean absolute RGB difference over lit pixels): **≥ 0.95 proposed**, report-only until approved (lab, 5 runs on 2026-11-11: 1280 px 0.977 / 0.977 / 0.977, 360 px 0.978 / 0.978 / 0.979 as min / median / max) | [HYPOTHESIS: proposed from measurements, needs the owner’s approval] |
| Lab profile (A2) | Playwright + headless Chromium: 360×740, RTT 150 ms, 1.6 Mbps down, CPU 4× slowdown; encoded in apps/site/budgets.ts and e2e/budget.spec.ts | [GAP: not a real low-end Android phone] |

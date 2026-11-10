# 06 · Market and business

Draft v0.1 (solo project by Sandarbh, no fixed deadline, no user research). Tags: [EVIDENCE: path] · [HYPOTHESIS] · [GAP]. External facts carry URL + access date (all accessed **2026-11-10**) or are marked UNVERIFIED. "Vendor-stated" = what a company says about itself, not independently checked.

> Bottom line [HYPOTHESIS]: there is no defensible market number for this product today. The useful targets are the first 100 users and a ₹0-marginal-cost core. Everything below is built so it can be wrong cheaply.

## 1. Competitor teardown
[EVIDENCE: the vendor pages cited per row, accessed 2026-11-10; vendor-stated facts are not independently checked]

| Product | What it does (as stated by the source) | Price (as stated) | Negotiation / counter-offers? | India features | Source |
|---|---|---|---|---|---|
| Refrens | accounting and invoicing for Indian businesses: GST invoices, e-invoices, e-way bills, GSTR reports; targets freelancers, SMBs, CAs. Vendor-stated "300,000+ businesses" | free plan: 15 documents; paid tier price not in fetched text [GAP] | none found; it has a quotation *approval* workflow, not negotiation | GST yes; TDS not mentioned in fetched text | https://www.refrens.com/ , https://www.refrens.com/pricing |
| Bonsai | all-in-one client, proposal, contract, invoicing and bookkeeping platform | $15/$25/$39/$59 per user per month (or $9/$19/$29/$49 billed annually); 7-day trial | none mentioned | no INR/GST/TDS mentioned; "Multi-currency Billing" | https://www.hellobonsai.com/pricing |
| Negoti8 | upload a quote you *received*, benchmark line items against market prices, get a counter-offer email (buyer side) | conflicting: directory says €0 first quote then €2 each; vendor site says every quote is free [UNVERIFIED which is current] | yes (buyer side) | none found; euro examples | https://www.stork.ai/en/negoti8 , https://www.negoti8.app/en |
| DealFlow | shareable "deal room": seller sets a private minimum and ideal price, client counters in rounds; AI counter suggestions on Pro | free 3 deal rooms/month; Pro $29/month (vendor blog, 2026-04-17) | yes (seller side, client-facing) | none found | https://dealflow-sigma.vercel.app/blog/dealflow-vs-honeybook-vs-bonsai-which-negotiation-tool-is-right-for-freelancers (vendor-authored) |
| Vendr | AI pricing intelligence and negotiation for enterprise software purchasing; "now part of Vertice" | not checked | yes (enterprise buyers) | n/a | https://www.vendr.com/ |
| General chatbots (e.g. ChatGPT) | general-purpose assistant | pricing page returned 403: UNVERIFIED | can draft replies on request | no structured INR/deal state [HYPOTHESIS] | https://openai.com/chatgpt/pricing/ (fetch failed) |
| Zoho Invoice (India) | not checked: pricing URL returned 404 [GAP] | UNVERIFIED | UNVERIFIED | UNVERIFIED | https://www.zoho.com/in/invoice/pricing.html (404) |

What the teardown shows (every bullet is [HYPOTHESIS], drawn from the table above):
- Indian freelancer tools found are **invoicing/accounting** (Refrens); global freelancer suites are **admin** (Bonsai). Neither, in what we fetched, prepares the reply to a discount request.
- Negotiation tools found are either **buyer-side** (Negoti8, Vendr) or **client-facing deal rooms** (DealFlow). None found is private, seller-side prep with Hinglish/INR input [HYPOTHESIS: based on 5 products, not a complete search].
- Gap in our search [GAP]: no systematic search of app stores, Product Hunt or Indian startup lists; competitors we did not find may exist. Fix: a 2 h app-store and Product Hunt sweep before any public pitch.

## 2. Positioning
**For** solo Indian web/app developers and UI/UX designers (D1 [EVIDENCE: 03_scope_and_cut_line.md]) **who** get "thoda kam kar do" after sending a quote, **MolBhav is** a private prep tool **that** computes a floor/target/opening, reads the client's reply on the device, and offers trades instead of discounts. **Unlike** chatbots, every number comes from a deterministic engine with a visible trace; **unlike** invoicing suites, it works *before* the deal is closed; **unlike** deal rooms, the client never sees it [HYPOTHESIS: positioning, untested with anyone].

Claims we can and cannot make are in [11_claims_register.md](11_claims_register.md).

## 3. Pricing hypotheses (all HYPOTHESIS; no willingness-to-pay data exists)
| Tier | What | Price | Why this shape | Tag |
|---|---|---|---|---|
| Free, forever | S1, S2, S4b (on-device), S5, templates, S7, S8, local storage | ₹0 | the core costs us ~₹0 per user because it runs in the browser [EVIDENCE: 09_architecture.md §6]; free removes the trust barrier for a tool that sees deal data | [HYPOTHESIS] |
| Pro (only if drafting proves useful) | LLM drafting (S6), deal history export, later role-play (S9) | ₹99–199/month [HYPOTHESIS: placeholder range, chosen to sit well below Bonsai's lowest stated $9/user/month annual tier] | pays only for features with a per-use cost | [HYPOTHESIS] |
| Not planned | ads, selling data, client-side tracking | n/a | conflicts with the privacy promise [EVIDENCE: 02_service_catalogue.md "We will NOT provide"] | decision |
Kill-test: if fewer than 3% of active users [HYPOTHESIS: threshold] turn on Pro within a post-launch window, drop Pro and keep the project free. Payment collection is not designed [GAP] and would add legal/tax work (GST registration questions are out of scope until a CA is consulted) [GAP].

## 4. Bottom-up market sizing (every input visible)
The only population anchor found is NITI Aayog's gig-economy report: ~77 lakh gig workers in 2020-21, projected 2.35 crore by 2029-30, as reported by secondary sources (e.g. https://thewire.in/labour/indias-gig-workforce-to-touch-2-35-crore-by-2029-30-niti-aayog-study). The primary PDF returned 403: **UNVERIFIED against the primary**. That figure includes platform delivery and non-platform casual work, so most of it is not our user [HYPOTHESIS].

| Step | Input | Low | High | Tag |
|---|---|---|---|---|
| N0 | gig workers in India, 2020-21 | 77,00,000 | 77,00,000 | UNVERIFIED (secondary) |
| s1 | share doing skilled digital freelance work | 1% | 5% | [HYPOTHESIS: no source found] |
| s2 | share of those in web/app dev or UI/UX | 20% | 40% | [HYPOTHESIS: no source found; see A11 below] |
| N1 = N0·s1·s2 | first-user pool | 15,400 | 1,54,000 | CALCULATION on hypotheses |
| s3 | share reachable by a solo developer's channels in year 1 | 1% | 5% | [HYPOTHESIS] |
| N2 = N1·s3 | reachable | 154 | 7,700 | CALCULATION |
| s4 | share paying for Pro (if it exists) | 2% | 5% | [HYPOTHESIS] |
| ₹/yr | Pro price × 12 | ₹1,188 | ₹2,388 | [HYPOTHESIS] |
| Revenue = N2·s4·₹/yr | year-1 revenue | ≈ ₹3,700 | ≈ ₹9.2 lakh | CALCULATION |
Reading [HYPOTHESIS]: a 250× spread from guessed inputs means the sizing does not support any business claim. It does support the decision already made: build a ₹0-cost free core, aim for 100 users, and learn s3 and s4 after launch. **Never quote N1 or revenue as a market size** [EVIDENCE: 11_claims_register.md].

## 5. Closing gaps A6, A7, A11 ([04_research_integrity.md](04_research_integrity.md) §3)
| # | Assumption | What was searched (2026-11-10) | Result | Kill condition applied |
|---|---|---|---|---|
| A6 | Indian business chat uses Hinglish in price talk | web search for studies of Hinglish in business/customer chat; Sengupta et al. 2024, *Humanities & Social Sciences Communications* (https://www.nature.com/articles/s41599-024-03058-6) appeared in search but the fetch redirected to a login, so not read: UNVERIFIED. Vendor blogs (gnani.ai, rotavision) give code-mixing percentages without naming their studies: rejected as uncitable | **No citable source for Hinglish in business price talk** | yes: Hinglish is a **supported input**, not a selling point. Removed from pitch claims [EVIDENCE: 11_claims_register.md] |
| A7 | Indian freelancers face payment delays often enough to matter | MSME Samadhaan (https://samadhaan.msme.gov.in/) shows **2,56,892 delayed-payment applications filed by MSEs** (no as-of date on the page). Bonsai: "29% of invoices were paid at least a day late" (vendor data, global, https://www.hellobonsai.com/blog/late-freelance-payment). IPSE (UK): 35% of freelancers had a delayed payment in the last 12 months (https://www.ipse.co.uk/policy/research/financial-wellbeing/late-payment-within-the-self-employed-sector.html) | **No India-freelancer source.** The MSE figure is enterprises, not freelancers; whether freelancers file there depends on Udyam registration [UNVERIFIED] | yes: S10 stays V2 and out of the pitch. Allowed statement: "India runs a government portal for delayed MSE payments with ~2.57 lakh applications (source, date)", nothing more |
| A11 | Web/app devs and designers are the right first user | searches for Indian freelance category data: Indeed 2021 coverage (creative, tech, sales and recruitment = 55% of freelance postings on Indeed; PHP developer among top titles) via secondary press (https://www.peoplematters.in/amp/news/recruiting-and-onboarding/freelance-jobs-rose-by-22-from-jan-2019-to-jan-2021-indeed-28745), not the primary; qz.com article on popular gig jobs returned 403 | **No primary source** on category shares | yes: D1 is stated as a **convenience choice** (the developer can write realistic messages for it), not a market choice |

## 6. Go-to-market: first 100 users (solo, ₹0 budget)
| Step | What | Rule | Tag |
|---|---|---|---|
| 1 | Showcase site doubles as the landing page; one scene per service ([08_experience_and_brand.md](08_experience_and_brand.md)) | must pass the performance budget; never claims results | [HYPOTHESIS] |
| 2 | Build in public: one post per phase demo (LinkedIn, X, dev.to) showing the actual demo, the eval report with CIs, and what failed | no "users love it"; show the trace, not testimonials | [HYPOTHESIS] |
| 3 | Share in Indian developer/designer communities where self-promotion rules allow it (check each community's rules first) | no cold DMs, no scraping, no buying lists | [HYPOTHESIS]; community names not verified [GAP] |
| 4 | Product Hunt launch after Phase D | only when the full loop works offline | [HYPOTHESIS] |
| 5 | Personal network: freelancers the developer already knows, invited to *use* it (not interviewed) | consented in-product metrics only ([04_research_integrity.md](04_research_integrity.md) §4) | [HYPOTHESIS] |
Count "user" = a device that computed one ladder and opted in to anonymous counts [HYPOTHESIS: definition]. Without opt-in we cannot count users, and we accept that [EVIDENCE: 07_trust_safety_compliance.md].

## 7. Risks
| Risk | Likelihood / impact | Mitigation | Tag |
|---|---|---|---|
| Nobody wants structured prep (A10) | unknown / high | ₹0 core, small scope, post-launch funnel tells us | [HYPOTHESIS] |
| Users won't paste client messages (A9) | unknown / medium | manual move picker; analyser optional | [HYPOTHESIS] |
| A chatbot is "good enough" | plausible / high | compete on traceable numbers and deal state, not prose | [HYPOTHESIS] |
| Showcase effort crowds out the product | real for a solo dev / medium | showcase phase only after Phase D; A2 capped at ~20 h ([03_scope_and_cut_line.md](03_scope_and_cut_line.md)) | [HYPOTHESIS] |
| A bad number harms a user | low with tests / high | deterministic engine, property tests, floor guard | [EVIDENCE: 04_research_integrity.md §3 A2] |
| Privacy incident | low by design / high | no message text on servers by default | [EVIDENCE: 07_trust_safety_compliance.md] |
| Free-tier hosting terms change | possible / low | static hosting is portable | [EVIDENCE: 09_architecture.md §6] |

## 8. Metrics (all counted on the device; reported only with opt-in, anonymised)
**North star** [HYPOTHESIS]: **prepared replies per week**: count of replies to a client counter where a floor was saved *before* the reply option was chosen. It measures the core promise (walk in with a floor) without tracking revenue.

| Type | Metric | Target / alarm | Tag |
|---|---|---|---|
| Funnel | showcase visit → app open → deal created → ladder computed → reply analysed or move picked → option chosen → draft copied → outcome logged | measured, no targets until data exists | [HYPOTHESIS] |
| Quality (offline) | parser exact amount match on frozen test; baseline/model macro-F1 with 95% CI | ≥95% parser (A4); model ships only if Δ lower CI bound > 0 (A3) | [EVIDENCE: 04_research_integrity.md §2.2] |
| Quality (live, opt-in) | low-confidence rate; user-correction rate on analyser output | alarm if correction rate rises [HYPOTHESIS: no threshold yet] | [HYPOTHESIS] |
| Safety | invented numbers passing the post-check; options below floor without USER DECISION; client message bytes sent to any server by default; unverified compliance cards shown | **all must be 0**, enforced by tests | [EVIDENCE: 09_architecture.md §8] |

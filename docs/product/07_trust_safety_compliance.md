# 07 · Trust, safety and compliance

Draft v0.1 (solo, no fixed deadline). Tags: [EVIDENCE: path] · [HYPOTHESIS] · [GAP]. External facts carry URL + access date (2026-11-10) or are marked UNVERIFIED. **This is not legal advice. Nothing here has been reviewed by a lawyer** [GAP]. Fix: a one-time review by a privacy lawyer before D10(b) or any server-side personal data path is switched on.

## 1. Sources and how they were read
| Source | Status | Notes |
|---|---|---|
| Digital Personal Data Protection Act, 2023 (No. 22 of 2023), Gazette of India Extraordinary, CG-DL-E-12082023-248045 | **primary text read**, via the Gazette copy hosted by PRS India: https://prsindia.org/files/bills_acts/acts_parliament/2023/Digital_Personal_Data_Protection_Act,_2023.pdf (accessed 2026-11-10). MeitY (https://www.meity.gov.in/data-protection-framework) and India Code returned 403 or a cookie wall to our fetches | text extracted locally from the PDF; quotes below are from it |
| DPDP Rules, 2025, G.S.R. 846(E), 13 Nov 2025 | **secondary only**: SCC Online summary https://www.scconline.com/blog/post/2025/11/14/meity-notified-digital-personal-data-protection-rules-2025/ . The gazette text was not reachable (egazette.gov.in TLS error; MeitY 403) | everything below about the Rules is UNVERIFIED against the primary |
| Commencement dates | **secondary**: SCC Online (above); Wikipedia's Act page (https://en.wikipedia.org/wiki/Digital_Personal_Data_Protection_Act,_2023) | UNVERIFIED against the commencement notification |
Fix [GAP]: Sandarbh to download the Rules gazette (G.S.R. 846(E)) and the commencement notification in a browser and drop them outside git; then re-check §2 and §3 (≈2 h).

## 2. What the Act says that matters to us (primary text)
[EVIDENCE: Act text from the Gazette copy in §1 for the middle column; the right column is HYPOTHESIS, our reading, not legal advice]

| Provision | What it says (short quote or paraphrase) | Why it matters to MolBhav |
|---|---|---|
| s.2(t) personal data | "any data about an individual who is identifiable by or in relation to such data" | a pasted client message often contains the client's name, number or details → personal data of a **third party** (the client) [HYPOTHESIS: typical content] |
| s.2(i) Data Fiduciary | one who "determines the purpose and means of processing" | we are a fiduciary for anything **we** process on our servers; whether we are one for code that runs only on the user's device is **UNVERIFIED** (legal question) |
| s.2(k) Data Processor | processes "on behalf of a Data Fiduciary" | an LLM or hosting provider handling our server data would be our processor |
| s.3(a), (b) application | applies to digital personal data processed in India, and outside India when tied to offering goods/services in India | applies to any server path we run [EVIDENCE: Act s.3] |
| s.3(c)(i) exemption | Act does not apply to data "processed by an individual for any personal or domestic purpose" | a freelancer handling client messages is doing **business**, so this exemption likely does not cover the freelancer [HYPOTHESIS: legal reading needed] |
| s.4 grounds | process only for a lawful purpose with consent or for a "legitimate use" (s.7) | every server path needs a ground |
| s.5(1) notice | consent request must come with a notice of (i) the data and purpose, (ii) how to withdraw consent and use s.13, (iii) how to complain to the Board | our disclosure copy (§5) must include all three |
| s.6(1) consent | "free, specific, informed, unconditional and unambiguous with a clear affirmative action", limited to what is necessary | opt-in toggles, unticked by default, one purpose each |
| s.6(4) withdrawal | withdraw "at any time", as easily as consent was given | toggle off = withdrawn; same screen |
| s.7(a) legitimate use | data "voluntarily provided" by the Data Principal for a specified purpose | covers **the user's own** data they give us; does **not** obviously cover the *client's* data that the client gave to the user [HYPOTHESIS] |
| s.8(5) security | "reasonable security safeguards to prevent personal data breach" | Schedule: penalty "may extend to two hundred and fifty crore rupees" |
| s.8(6) breach | intimate the Board and each affected Data Principal "in such form and manner as may be prescribed" | Schedule: up to ₹200 crore |
| s.8(7) erasure | erase on withdrawal or once the purpose "is no longer being served", unless law requires retention | our default: never store; for any stored item, delete on request |
| s.8(9), (10) contact + grievance | publish a contact who can answer questions; "an effective mechanism to redress the grievances" | a contact email on the privacy page [GAP: not created] |
| s.9 children | verifiable parental consent for children's data | we are not for under-18s; say so [HYPOTHESIS: age gate wording in 08] |
| s.11–13 rights | access summary; correction/erasure; grievance redressal | met trivially for on-device data (user holds it); for server data, a request email |
| s.17(3) startups | Government may notify classes of fiduciaries "including startups" exempt from s.5, s.8(3), s.8(7), s.10, s.11 | we are not a recognised startup and no such notification for us is known: **do not rely on it** [GAP] |
| Schedule | other penalties up to ₹200 crore (children), ₹150 crore (significant fiduciary), ₹50 crore (any other breach) | the stakes justify keeping server data at zero by default |

## 3. Rules and commencement (secondary only, UNVERIFIED)
Per SCC Online (accessed 2026-11-10): Rules 1, 2, 17–21 from 13-11-2025; Rule 4 (consent managers) from 13-11-2026; Rules 3, 5–16, 22–23 from **13-05-2027**. Per the same source: Rule 3 notices must be "clear, independent, and accessible"; Rule 6 lists encryption/masking, access control, logging and monitoring, backups and one-year log retention; breach: notify affected people promptly and the Board with a detailed report within 72 hours; erasure with 48 hours' prior notice to the person; grievances answered within 90 days.
What this means for us [HYPOTHESIS]: most fiduciary duties bite from 13-05-2027 (secondary). We design to them **now** because the on-device default makes compliance cheap, and because a later server path should not need a redesign. The one-year **log retention** item in Rule 6 (secondary) may conflict with "unlogged" server analysis; if it applies to us, D10(b) must log *metadata only* (time, status, size, never text) [GAP: confirm against the Rules text].

## 4. What applies to us, path by path
[HYPOTHESIS: our reading of the Act for each path; legal review pending [GAP]]

| Data path | Personal data involved? | Our role (Act) | Ground + duties | Status |
|---|---|---|---|---|
| Deal records, ladder, concessions on the device (S1, S2, S8, S13) | the user's own business data; client name if typed | none for us if nothing reaches our servers [UNVERIFIED: whether a software provider is a fiduciary for purely local processing] | user controls it; delete-all | design [EVIDENCE: 02_service_catalogue.md S13] |
| Pasted client message, analysed on-device (S4b) | yes, third-party (client) data, on the user's device | as above | message text never sent | design; enforced by a network test [EVIDENCE: 09_architecture.md §8] |
| Drafting (S6): option + engine numbers + deliverable type to our Worker → LLM provider | **no**, if the payload contains no names or message text | fiduciary only if personal data slips in | payload schema allows only enumerated fields + numbers; free text is rejected | design [EVIDENCE: 09_architecture.md §4] |
| Opt-in server analysis (D10(b)), only if B2's model wins | **yes**, client's message text | we become a **fiduciary** (or processor for the user) [UNVERIFIED: role] | needs a ground for the *client's* data, which the client never gave us; s.7(a) does not obviously apply [HYPOTHESIS] | **blocked until legal review** + on-device redaction of phone numbers, emails and names [GAP] |
| Opt-in anonymous counts (S14) | no, if aggregated counts only with no identifiers | none if not identifiable [HYPOTHESIS] | consent toggle anyway (trust) | design |
| Opt-in message donation (post-launch only) | yes | fiduciary | s.5 notice + s.6 consent from the **user**, plus redaction; client consent impossible → donation limited to text the user wrote **themselves** [HYPOTHESIS: safest rule] | not planned for V1 |

## 5. Consent and disclosure copy (draft; the copy deck lives in 08)
Paste screen, always visible under the text box:
> **Stays on this device.** MolBhav reads your client's message on your phone or laptop. It is not sent to us or to any AI service.

Drafting toggle (off until the user turns it on):
> **Write drafts with AI** (optional). We send only the option you chose, the numbers MolBhav calculated and the type of work (for example "website"). Never your client's message, names or contact details. Turn it off any time here.
> Who processes it: our server and [LLM provider, named when chosen] [GAP]. Questions or complaints: [contact email] [GAP]. You can also complain to the Data Protection Board of India.

Server analysis toggle (exists only if D10(b) ships after legal review):
> **Better message analysis** (optional, off by default). Your client's message is sent to our server, analysed in memory and deleted immediately. We do not store or log the text. Before sending, MolBhav removes phone numbers and email addresses. Your client did not agree to this, so please remove their name first. Turn it off any time; analysis falls back to this device.

Anonymous counts toggle:
> **Help improve MolBhav** (optional). Sends counts like "3 ladders calculated this week". No text, no amounts, no names.

Age line (first run): "MolBhav is for freelancers aged 18 or over."

## 6. Deletion
[HYPOTHESIS: design proposal, not built or tested; applies to every row below unless a row carries its own tag]

| What | How | When |
|---|---|---|
| All on-device data | Settings → "Delete everything on this device" → confirm → IndexedDB and caches cleared | immediately [EVIDENCE: 02_service_catalogue.md S13] |
| One deal | swipe/delete on the deal | immediately |
| Server analysis text | never stored; request bodies excluded from logs | at request end [GAP: verified by a log-inspection test in Phase B2] |
| Anonymous counts | not linkable to a person, so not deletable per person; disclosed in the toggle copy | n/a [HYPOTHESIS] |
| Donated text (post-launch) | revocable; deleted within a stated period [GAP: period not set] | n/a |

## 7. Compliance-card policy (S11)
[HYPOTHESIS: design proposal, not built or tested; applies to every row below unless a row carries its own tag]
A card is **shown** only when every field is filled; otherwise it is hidden and Settings lists it as "pending verification" [EVIDENCE: 03_scope_and_cut_line.md D5].
| Field | Rule |
|---|---|
| Statement | one rule, no advice ("TDS on … is X% under s. …") |
| Primary source | official URL (gazette, CBIC, India Code, incometax.gov.in) + section + short quote |
| Effective date | from the source |
| Reviewer | name + role (a CA for tax; a lawyer for MSMED) |
| Review date / next review | next review ≤ 12 months, and after every Finance Act |
| Auto-hide | the card hides itself when "next review" passes |
| Banner | "Reference only, not tax or legal advice" |
Current state: all three cards UNVERIFIED [EVIDENCE: docs/dataset-audit/compliance/]. Note: the TDS card refers to the Income-tax Act, 2025 [EVIDENCE: docs/dataset-audit/OPEN_QUESTIONS.md B4], which must be re-checked against the primary text.

## 8. Failure modes
| Failure | Effect on user | Detection | Response | Tag |
|---|---|---|---|---|
| Message text leaks to a server by default (bug) | third-party data exposed | e2e network test: no request body contains the pasted text | block release; fix | [EVIDENCE: 09_architecture.md §8] |
| LLM draft invents a number | wrong price sent to a client | post-check rejects any number not from the engine | fall back to template | [EVIDENCE: 02_service_catalogue.md S6] |
| Prompt injection inside a client message | none: S6 never receives message text | schema test on the S6 payload | n/a | [EVIDENCE: 02_service_catalogue.md S6] |
| Draft payload contains a name typed in "deliverable" | personal data reaches LLM | deliverable type is an enum, not free text | reject | [EVIDENCE: 09_architecture.md §4] |
| Analyser misreads the move | wrong options suggested | confidence threshold; user correction | "pick one" chips | [EVIDENCE: 02_service_catalogue.md S4b] |
| Amount parsed wrongly ("1.5L" as ₹1.5) | wrong ladder comparison | parser tests; amount shown for confirmation | user edits the amount | [EVIDENCE: 04_research_integrity.md §3 A4] |
| Unverified compliance card shown | user relies on a wrong tax figure | test: no card renders without all fields | hide | [EVIDENCE: §7] |
| Floor breached by an option | user underprices | property test | block without USER DECISION | [EVIDENCE: 02_service_catalogue.md S5] |
| Device lost or shared | another person sees deals | none (local data) | optional app lock [GAP: not designed] | [HYPOTHESIS] |
| Browser clears storage | deals lost | none | export/import JSON [GAP: not in V1 scope] | [HYPOTHESIS] |
| Server breach (D10(b) only) | none stored, but in-flight exposure possible | provider alerts | Act s.8(6) intimation; Rules timeline UNVERIFIED | [GAP] |

## 9. Answers to judge questions E2 and E3 ([05_judge_qa.md](05_judge_qa.md))
[EVIDENCE: §1–§4 of this file]; each answer is our honest position today, with its gaps stated
**E2: DPDP Act 2023, what are your obligations?** (replaces the earlier answer)
- A: We read the Act's text (Gazette copy). For the default product, no client message text and no personal data reach our servers, so our duties are small; whether a provider of purely on-device software is a Data Fiduciary is a legal question we've flagged, not answered. For any server path we design to s.5 notice, s.6 consent (opt-in, withdrawable), s.8 security, erasure and grievance contact. The Rules' main duties start 13 May 2027 per a secondary source; we haven't read the Rules' gazette text yet.
- [EVIDENCE: docs/product/07_trust_safety_compliance.md §2–4] · [GAP]: Rules primary text; legal review · Fix: fetch Rules (2 h); lawyer review before D10(b) (cost unknown [GAP]) · Don't say: "We're DPDP compliant."

**E3: You store your users' clients' messages. They never consented.**
- A: We don't store them, and by default we never receive them: analysis runs on the user's device, and drafting receives only an option, numbers and an enumerated work type. The one path that would send message text (opt-in server analysis) is blocked until a legal review, because the client never consented to us, and the Act's "voluntarily provided" legitimate use doesn't obviously cover data the client gave to someone else.
- [EVIDENCE: docs/product/07_trust_safety_compliance.md §4; 02_service_catalogue.md S13] · [GAP]: legal reading of fiduciary role for on-device software · Fix: lawyer review (cost unknown) · Don't say: "No personal data is involved."

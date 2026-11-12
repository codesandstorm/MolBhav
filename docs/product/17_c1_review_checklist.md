# 17 · C1 review checklist (owner)

Version 0.1, 2026-11-11 (Phase C1). Every wording below is [HYPOTHESIS]: written by the developer, not tested with users, and waiting for the owner’s review. Generated from the code by `node apps/app/scripts/review-checklist.ts`; `apps/app/test/review-checklist.test.ts` fails if an id or its text is missing or out of date.

**How to review.** Tick a row when the wording is acceptable. For a change, write the new wording in the Notes column; the developer changes the code and regenerates this file. Check each row against the C1 rules:
- no legal, tax or financial advice; no promise that an option will work; no "win"; no market-rate claim; no claim that trading beats conceding;
- no number in the wording itself: every figure comes from the engine, in a slot such as `{your_price}`;
- Hinglish in Roman script only;
- the floor never appears in client-facing text (templates and trade conditions).

198 items in 9 groups. Slots in templates: `{your_price}`, `{counter_price}`, `{client_price}`, `{scope_price}`, `{agreed_price}`, `{advance_pct}`, `{condition}`. Parts marked `[your edit: …]` are for the user to fill in before sending.

## Templates

| OK | Id | Text | Notes |
|---|---|---|---|
| [ ] | `T-HOLD-EN-P` | Thanks for getting back to me. My price for this work is {your_price}, and it covers [your edit: what is included]. Happy to walk you through any part of it. | |
| [ ] | `T-HOLD-EN-F` | Thanks for your reply. My price for this work stays at {your_price}. It covers [your edit: what is included]. Let me know if you would like to go ahead. | |
| [ ] | `T-TRADE-EN-P` | Thanks for being open about the budget. I can do {counter_price} if we agree on {condition}. Without that, my price stays at {your_price}. Would that work for you? | |
| [ ] | `T-TRADE-EN-F` | I can come to {counter_price} on the condition of {condition}. Otherwise my price remains {your_price}. | |
| [ ] | `T-STEP-EN-P` | Thanks for your reply. I can come down to {counter_price} for the same scope. I hope that works for you. | |
| [ ] | `T-STEP-EN-F` | I can offer {counter_price} for this scope. | |
| [ ] | `T-MEET-EN-P` | Thanks. {client_price} works for me for this scope. Shall we confirm the details and get started? | |
| [ ] | `T-MEET-EN-F` | Agreed at {client_price} for this scope. Please confirm, and I will share the next steps. | |
| [ ] | `T-SCOPE-EN-P` | I understand the budget is fixed. For {scope_price}, I can do a smaller version: [your edit: what is included and what we leave out]. The full scope stays at {your_price}. Shall I send the updated scope? | |
| [ ] | `T-SCOPE-EN-F` | At {scope_price}, the scope would be: [your edit: what is included]. The full scope stays at {your_price}. | |
| [ ] | `T-DECLINE-EN-P` | Thank you for the offer. I am not able to do this work at {client_price}. If your budget changes, or you would like to look at a smaller scope, I would be glad to talk again. | |
| [ ] | `T-DECLINE-EN-F` | Thanks, but {client_price} does not work for this scope. If anything changes on your side, let me know. | |
| [ ] | `T-ASK-EN-P` | Thanks for your reply. Before we settle the price, could you tell me what matters most to you here: the budget, the timeline or the scope? That will help me suggest the right option. | |
| [ ] | `T-ASK-EN-F` | To give you a price that fits, I need to know what is fixed on your side: the budget, the timeline or the scope? | |
| [ ] | `T-ANSWER-EN-P` | Thanks for asking. [your edit: your answer]. Happy to clarify anything else. | |
| [ ] | `T-ANSWER-EN-F` | [your edit: your answer]. Let me know if you need anything else to decide. | |
| [ ] | `T-ANSWER_HOLD-EN-P` | Thanks for asking. [your edit: your answer]. The price for the full scope is {your_price}. | |
| [ ] | `T-ANSWER_HOLD-EN-F` | [your edit: your answer]. The price for this scope stays at {your_price}. | |
| [ ] | `T-CONFIRM-EN-P` | Great, thank you! To confirm: {agreed_price} for [your edit: the scope], with payment [your edit: payment terms] and delivery by [your edit: date]. Could you reply to confirm, so we are both on the same page? | |
| [ ] | `T-CONFIRM-EN-F` | Confirming: {agreed_price} for [your edit: the scope], payment [your edit: payment terms], delivery by [your edit: date]. Please reply to confirm before I start. | |
| [ ] | `T-CLARIFY-EN-P` | Thanks for your message. Just to be sure I understand: [your edit: your question]? | |
| [ ] | `T-CLARIFY-EN-F` | Could you clarify [your edit: what you need to know] before we go further? | |
| [ ] | `T-HOLD-HI-P` | Reply ke liye thanks. Is kaam ke liye mera price {your_price} hai, aur ismein [your edit: kya kya included hai] shaamil hai. Kisi bhi part par baat karni ho to bataiye. | |
| [ ] | `T-HOLD-HI-F` | Thanks. Is kaam ke liye mera price {your_price} hi rahega. Ismein [your edit: kya kya included hai] shaamil hai. Aage badhna ho to bataiye. | |
| [ ] | `T-TRADE-HI-P` | Budget ki baat batane ke liye thanks. Agar {condition} ho jaye, to {counter_price} ho sakta hai. Iske bina price {your_price} hi rahega. Aapko theek lagega? | |
| [ ] | `T-TRADE-HI-F` | {counter_price} tabhi possible hai jab {condition} ho. Warna price {your_price} hi rahega. | |
| [ ] | `T-STEP-HI-P` | Reply ke liye thanks. Isi scope ke liye {counter_price} kar sakte hain. Umeed hai yeh theek rahega. | |
| [ ] | `T-STEP-HI-F` | Is scope ke liye {counter_price} kar sakte hain. | |
| [ ] | `T-MEET-HI-P` | Thanks. Is scope ke liye {client_price} theek hai. Details confirm karke shuru karein? | |
| [ ] | `T-MEET-HI-F` | Is scope ke liye {client_price} par done. Confirm kar dijiye, phir next steps share karenge. | |
| [ ] | `T-SCOPE-HI-P` | Samajh sakte hain ki budget fixed hai. {scope_price} mein chhota version ho sakta hai: [your edit: kya rahega aur kya hatega]. Poora scope {your_price} ka hi hai. Updated scope bhej dein? | |
| [ ] | `T-SCOPE-HI-F` | {scope_price} mein scope yeh rahega: [your edit: kya included hai]. Poora scope {your_price} ka hi hai. | |
| [ ] | `T-DECLINE-HI-P` | Offer ke liye thanks. {client_price} mein yeh kaam karna possible nahi hoga. Agar budget badle, ya chhote scope par baat karni ho, to zaroor bataiye. | |
| [ ] | `T-DECLINE-HI-F` | Thanks, lekin is scope ke liye {client_price} possible nahi hai. Aapki taraf se kuch badle to bataiye. | |
| [ ] | `T-ASK-HI-P` | Reply ke liye thanks. Price final karne se pehle bataiye, aapke liye sabse zaroori kya hai: budget, timeline ya scope? Usse sahi option suggest karna aasaan hoga. | |
| [ ] | `T-ASK-HI-F` | Sahi price dene ke liye jaanna hoga ki aapki taraf se kya fixed hai: budget, timeline ya scope? | |
| [ ] | `T-ANSWER-HI-P` | Poochhne ke liye thanks. [your edit: aapka jawab]. Aur kuch jaanna ho to bataiye. | |
| [ ] | `T-ANSWER-HI-F` | [your edit: aapka jawab]. Decide karne ke liye aur kuch chahiye to bataiye. | |
| [ ] | `T-ANSWER_HOLD-HI-P` | Poochhne ke liye thanks. [your edit: aapka jawab]. Poore scope ka price {your_price} hai. | |
| [ ] | `T-ANSWER_HOLD-HI-F` | [your edit: aapka jawab]. Is scope ka price {your_price} hi hai. | |
| [ ] | `T-CONFIRM-HI-P` | Bahut badhiya, thanks! Confirm kar dete hain: {agreed_price} mein [your edit: scope], payment [your edit: payment terms], aur delivery [your edit: date] tak. Reply karke confirm kar dijiye. | |
| [ ] | `T-CONFIRM-HI-F` | Confirm: {agreed_price} mein [your edit: scope], payment [your edit: payment terms], delivery [your edit: date] tak. Kaam shuru karne se pehle reply karke confirm kijiye. | |
| [ ] | `T-CLARIFY-HI-P` | Message ke liye thanks. Bas confirm karna tha: [your edit: aapka sawaal]? | |
| [ ] | `T-CLARIFY-HI-F` | Aage badhne se pehle bata dijiye: [your edit: aapka sawaal]? | |

## Trade conditions in drafts

| OK | Id | Text | Notes |
|---|---|---|---|
| [ ] | `CT-ADVANCE-EN` | {advance_pct}% of the payment in advance | |
| [ ] | `CT-MILESTONES-EN` | payment in milestones as the work is delivered | |
| [ ] | `CT-SCOPE_REDUCE-EN` | a smaller scope ([your edit: what we leave out]) | |
| [ ] | `CT-TIMELINE-EN` | a longer timeline ([your edit: the new date]) | |
| [ ] | `CT-PORTFOLIO-EN` | permission to show this work in my portfolio, with a short testimonial | |
| [ ] | `CT-REFERRAL-EN` | an introduction to someone else who needs similar work | |
| [ ] | `CT-ADVANCE-HI` | {advance_pct}% advance payment | |
| [ ] | `CT-MILESTONES-HI` | har milestone par payment | |
| [ ] | `CT-SCOPE_REDUCE-HI` | thoda kam scope ([your edit: kya hatayenge]) | |
| [ ] | `CT-TIMELINE-HI` | thoda lamba timeline ([your edit: nayi date]) | |
| [ ] | `CT-PORTFOLIO-HI` | portfolio mein kaam dikhane ki permission aur chhota sa testimonial | |
| [ ] | `CT-REFERRAL-HI` | kisi aur client se introduction jinhe aisa kaam chahiye | |

## Option names and meanings

| OK | Id | Text | Notes |
|---|---|---|---|
| [ ] | `O-HOLD-name` | Hold your price | |
| [ ] | `O-HOLD-meaning` | Keep your price and remind them what it covers. No new number. | |
| [ ] | `O-TRADE-name` | Trade: a smaller step, for something back | |
| [ ] | `O-TRADE-meaning` | Offer a little less, but only if they agree to the return you choose. Without it, your price stays. | |
| [ ] | `O-STEP-name` | Come down a step | |
| [ ] | `O-STEP-meaning` | Offer a lower price with nothing asked in return. It stays at or above your target. | |
| [ ] | `O-MEET-name` | Agree to their number | |
| [ ] | `O-MEET-meaning` | Accept the price they offered. It is at or above your target. | |
| [ ] | `O-SCOPE-name` | Cut the scope to fit their budget | |
| [ ] | `O-SCOPE-meaning` | Do less for less. Type how long the smaller job takes; your ladder works out its price. | |
| [ ] | `O-DECLINE-name` | Say no politely, keep the door open | |
| [ ] | `O-DECLINE-meaning` | Turn down their number without lowering yours, and invite them back. | |
| [ ] | `O-ASK-name` | Ask what matters most to them | |
| [ ] | `O-ASK-meaning` | Ask what is fixed on their side before you move. No number. | |
| [ ] | `O-ANSWER-name` | Answer their question | |
| [ ] | `O-ANSWER-meaning` | Reply to what they asked. You add the details. The price does not change. | |
| [ ] | `O-ANSWER_HOLD-name` | Answer, and restate your price | |
| [ ] | `O-ANSWER_HOLD-meaning` | Reply to what they asked, then repeat your price for the full scope. | |
| [ ] | `O-CONFIRM-name` | Confirm the deal in writing | |
| [ ] | `O-CONFIRM-meaning` | Agree, and write down the price, scope, payment and delivery so you both agree. | |
| [ ] | `O-CLARIFY-name` | Ask what they mean | |
| [ ] | `O-CLARIFY-meaning` | Their reply is not clear. Ask a short question before you talk about price. | |

## Reasons (RECOMMENDATION)

| OK | Id | Text | Notes |
|---|---|---|---|
| [ ] | `reason.HOLD.default` | Your price is inside your own ladder. Restating what it covers keeps the talk on the work, not on a discount. | |
| [ ] | `reason.HOLD.scope` | They think it is a lot of work. Spelling out what is included answers that without moving the price. | |
| [ ] | `reason.HOLD.competitor` | You cannot see the other quote. Comparing what each one covers is fairer than matching a number. | |
| [ ] | `reason.HOLD.other` | If their reply was not about price, your price has no reason to move. | |
| [ ] | `reason.TRADE` | Any price you give up comes with something you chose in return, and it stays above your target. | |
| [ ] | `reason.STEP` | A step from your price towards your target, rounded up to your ladder step. It stays inside your concession room. | |
| [ ] | `reason.MEET` | Their number is between your target and your price, so agreeing still lands at or above your target. | |
| [ ] | `reason.SCOPE` | The price for the smaller job comes from the same formula as your ladder, so the rate behind it does not drop. | |
| [ ] | `reason.DECLINE` | Their number is below your floor: at that price this work pays less than you need for the time it takes. | |
| [ ] | `reason.ASK` | You do not have a clear number from them yet. A question costs nothing and shows what you could trade. | |
| [ ] | `reason.ANSWER` | They asked about the work, not the price. Answering keeps the talk going. | |
| [ ] | `reason.ANSWER_HOLD` | Answering and restating the price keeps the number you already gave on the table. | |
| [ ] | `reason.CONFIRM` | They agreed. Writing the terms down now means you both agree to the same thing. | |
| [ ] | `reason.CLARIFY` | A short question now avoids answering something they did not ask. | |

## Risks

| OK | Id | Text | Notes |
|---|---|---|---|
| [ ] | `risk.HOLD` | They may still say no, or come back with the same number. | |
| [ ] | `risk.TRADE` | They may want the lower price without the condition. | |
| [ ] | `risk.STEP` | With nothing asked back, they may ask for another step. | |
| [ ] | `risk.MEET` | You give up the gap between their number and your price. | |
| [ ] | `risk.SCOPE` | You need to agree exactly what is left out, in writing. | |
| [ ] | `risk.DECLINE` | They may go to someone else. | |
| [ ] | `risk.ASK` | It adds a round before you reach a price. | |
| [ ] | `risk.ANSWER` | They may raise the price question again later. | |
| [ ] | `risk.ANSWER_HOLD` | They may push back on the price again. | |
| [ ] | `risk.CONFIRM` | Check that the terms match what you quoted before you send. | |
| [ ] | `risk.CLARIFY` | It adds a round before you reach a price. | |

## Trade conditions on screen (USER DECISION)

| OK | Id | Text | Notes |
|---|---|---|---|
| [ ] | `C-ADVANCE` | Part of the payment in advance | |
| [ ] | `C-MILESTONES` | Payment in milestones as work is delivered | |
| [ ] | `C-SCOPE_REDUCE` | A smaller scope | |
| [ ] | `C-TIMELINE` | A longer timeline | |
| [ ] | `C-PORTFOLIO` | Permission to show the work, with a short testimonial | |
| [ ] | `C-REFERRAL` | An introduction to someone who needs similar work | |

## Plan notes

| OK | Id | Text | Notes |
|---|---|---|---|
| [ ] | `N-low_confidence` | We are not sure what their reply means, so these are general, safe options. Go back and pick what they meant to see options for it. | |
| [ ] | `N-no_move` | We could not tell what their reply is doing, so these are general, safe options. Go back and pick what they meant. | |
| [ ] | `N-no_amount` | They did not name an amount, so no option uses one. | |
| [ ] | `N-unit_assumed` | Their amount had no unit, so it is read in the same unit as your ladder. | |
| [ ] | `N-unit_mismatch` | Their amount is in a different unit from your ladder, so the options do not compare it. | |
| [ ] | `N-not_inr` | Their amount is not in rupees, so the options do not compare it. | |
| [ ] | `N-quote_below_floor` | Your quote is below your floor. The options start from your target instead; you decide whether to re-quote. | |
| [ ] | `N-no_room` | Your price is at or just above your target, or below it, so no option lowers it. | |
| [ ] | `N-accept_with_lower_amount` | They say yes but name a lower number than yours, so the options treat it as a counter offer. | |

## Screen copy: Your options (S5)

| OK | Id | Text | Notes |
|---|---|---|---|
| [ ] | `UI-O-entry` | See your options for this reply | |
| [ ] | `UI-O-needLadder` | Options start from your price ladder. Set up your deal first. | |
| [ ] | `UI-O-needLadderStart` | Set up my deal | |
| [ ] | `UI-O-needLadderExample` | Use the example deal | |
| [ ] | `UI-O-title` | Your options | |
| [ ] | `UI-O-lede` | Ways to answer, worked out from your ladder. Each says what it does and its risk. You choose. | |
| [ ] | `UI-O-theirMove` | What they are doing | |
| [ ] | `UI-O-theirAmount` | Their number | |
| [ ] | `UI-O-noAmount` | No amount | |
| [ ] | `UI-O-yourPrice` | Your price | |
| [ ] | `UI-O-fromQuote` | your quote | |
| [ ] | `UI-O-fromOpening` | your opening | |
| [ ] | `UI-O-fromTarget` | your target | |
| [ ] | `UI-O-counter` | You offer | |
| [ ] | `UI-O-stepDown` | {amount} less than your price | |
| [ ] | `UI-O-clientPrice` | Their number | |
| [ ] | `UI-O-agreed` | Agreed price | |
| [ ] | `UI-O-floor` | Your floor, for you only | |
| [ ] | `UI-O-floorNote` | never put in a draft | |
| [ ] | `UI-O-why` | Why | |
| [ ] | `UI-O-risk` | Risk | |
| [ ] | `UI-O-asksBack` | Asks back | |
| [ ] | `UI-O-scopeEffort` | How many days would the smaller job take? | |
| [ ] | `UI-O-scopeHint` | Fewer than the full job. Your ladder prices the smaller job. | |
| [ ] | `UI-O-scopeNeeds` | Type the smaller effort to see its price. | |
| [ ] | `UI-O-scopeErrors-not_a_number` | Use a number, like the one in your deal | |
| [ ] | `UI-O-scopeErrors-not_smaller` | Make it smaller than the full job | |
| [ ] | `UI-O-scopeErrors-engine_rejected` | Check this number | |
| [ ] | `UI-O-scopePrice` | Price for the smaller job | |
| [ ] | `UI-O-scopeFloor` | Floor for the smaller job, for you only | |
| [ ] | `UI-O-draft` | Draft this reply | |
| [ ] | `UI-O-draftNeedsEffort` | Type the smaller effort first | |
| [ ] | `UI-O-own` | None of these? Write your own reply | |
| [ ] | `UI-O-back` | Back to their reply | |
| [ ] | `UI-O-recommended` | Suggested first | |

## Screen copy: Draft your reply (S6)

| OK | Id | Text | Notes |
|---|---|---|---|
| [ ] | `UI-D-title` | Draft your reply | |
| [ ] | `UI-D-lede` | A starting draft in your words to edit. Nothing is sent anywhere; you send it yourself. | |
| [ ] | `UI-D-sentNote` | Nothing is sent anywhere; you send it yourself. | |
| [ ] | `UI-D-option` | Your choice | |
| [ ] | `UI-D-own` | Your own reply | |
| [ ] | `UI-D-lang` | Language | |
| [ ] | `UI-D-langs-en` | English | |
| [ ] | `UI-D-langs-hinglish` | Hinglish (Roman script) | |
| [ ] | `UI-D-tone` | Tone | |
| [ ] | `UI-D-tones-polite` | Polite | |
| [ ] | `UI-D-tones-firm` | Firm | |
| [ ] | `UI-D-condition` | What you ask back | |
| [ ] | `UI-D-advance` | How much in advance | |
| [ ] | `UI-D-box` | Your draft | |
| [ ] | `UI-D-boxHint` | Edit it freely. Fill in the parts marked [your edit: …] before you send it. | |
| [ ] | `UI-D-needsEdit` | This draft has parts marked [your edit: …] for you to fill in. | |
| [ ] | `UI-D-rebuild` | Rebuild the draft with these choices | |
| [ ] | `UI-D-rebuildNote` | You have edited the draft, so it was not changed. Rebuild it to use these choices. | |
| [ ] | `UI-D-copy` | Copy the draft | |
| [ ] | `UI-D-copied` | Copied. Paste it into your message to the client. | |
| [ ] | `UI-D-copyFailed` | Couldn’t copy here. Select the text and copy it yourself. | |
| [ ] | `UI-D-checkOk` | All numbers in this draft come from your ladder | |
| [ ] | `UI-D-checkFail` | Check these before you send: they are not numbers from your ladder or this option | |
| [ ] | `UI-D-checkEmpty` | Write a reply to check its numbers. | |
| [ ] | `UI-D-reasons-not_allowed` | not from your ladder or this option | |
| [ ] | `UI-D-reasons-currency` | not in rupees | |
| [ ] | `UI-D-reasons-unit_swap` | a different unit from your ladder | |
| [ ] | `UI-D-reasons-approximate` | made approximate | |
| [ ] | `UI-D-reasons-range` | written as a range | |
| [ ] | `UI-D-reasons-inexact` | not a whole number | |
| [ ] | `UI-D-reasons-decimal` | has a decimal point | |
| [ ] | `UI-D-reasons-bad_grouping` | the commas look odd | |
| [ ] | `UI-D-reasons-non_ascii_digit` | digits we do not read here | |
| [ ] | `UI-D-reasons-hidden_char` | a hidden character | |
| [ ] | `UI-D-reasons-other_script` | letters we do not check: use Roman script | |
| [ ] | `UI-D-reasons-lookalike` | a letter that looks like a digit | |
| [ ] | `UI-D-reasons-roman_numeral` | a Roman numeral | |
| [ ] | `UI-D-reasons-number_word` | a word that means a number | |
| [ ] | `UI-D-reasons-split_number` | a number word split up | |
| [ ] | `UI-D-reasons-tax_legal` | tax or legal wording: MolBhav does not give tax or legal advice | |
| [ ] | `UI-D-reasons-analyser_disagrees` | a number we could not match | |
| [ ] | `UI-D-back` | Back to your options | |
| [ ] | `UI-D-backLadder` | Back to your ladder | |
| [ ] | `UI-D-saved` | Your saved draft | |
| [ ] | `UI-D-savedOpen` | Open your draft | |

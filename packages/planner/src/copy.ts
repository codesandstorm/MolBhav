/**
 * Option wording shown to the user (UI, English). Every entry is [HYPOTHESIS] pending the owner's
 * review: docs/product/17_c1_review_checklist.md lists each id. No entry contains a digit: the
 * figures are shown separately, each with its CALCULATION chip.
 */
import type { ConditionId, OptionKind, PlanNote } from './types.ts';

export const OPTION_COPY: Record<OptionKind, { name: string; meaning: string }> = {
  HOLD: {
    name: 'Hold your price',
    meaning: 'Keep your price and remind them what it covers. No new number.',
  },
  TRADE: {
    name: 'Trade: a smaller step, for something back',
    meaning:
      'Offer a little less, but only if they agree to the return you choose. Without it, your price stays.',
  },
  STEP: {
    name: 'Come down a step',
    meaning: 'Offer a lower price with nothing asked in return. It stays at or above your target.',
  },
  MEET: {
    name: 'Agree to their number',
    meaning: 'Accept the price they offered. It is at or above your target.',
  },
  SCOPE: {
    name: 'Cut the scope to fit their budget',
    meaning:
      'Do less for less. Type how long the smaller job takes; your ladder works out its price.',
  },
  DECLINE: {
    name: 'Say no politely, keep the door open',
    meaning: 'Turn down their number without lowering yours, and invite them back.',
  },
  ASK: {
    name: 'Ask what matters most to them',
    meaning: 'Ask what is fixed on their side before you move. No number.',
  },
  ANSWER: {
    name: 'Answer their question',
    meaning: 'Reply to what they asked. You add the details. The price does not change.',
  },
  ANSWER_HOLD: {
    name: 'Answer, and restate your price',
    meaning: 'Reply to what they asked, then repeat your price for the full scope.',
  },
  CONFIRM: {
    name: 'Confirm the deal in writing',
    meaning: 'Agree, and write down the price, scope, payment and delivery so you both agree.',
  },
  CLARIFY: {
    name: 'Ask what they mean',
    meaning: 'Their reply is not clear. Ask a short question before you talk about price.',
  },
};

/** reasons (RECOMMENDATION) and risks; ids are the planner's `reason` and `risk` fields */
export const REASONS: Record<string, string> = {
  'reason.HOLD.default':
    'Your price is inside your own ladder. Restating what it covers keeps the talk on the work, not on a discount.',
  'reason.HOLD.scope':
    'They think it is a lot of work. Spelling out what is included answers that without moving the price.',
  'reason.HOLD.competitor':
    'You cannot see the other quote. Comparing what each one covers is fairer than matching a number.',
  'reason.HOLD.other': 'If their reply was not about price, your price has no reason to move.',
  'reason.TRADE':
    'Any price you give up comes with something you chose in return, and it stays above your target.',
  'reason.STEP':
    'A step from your price towards your target, rounded up to your ladder step. It stays inside your concession room.',
  'reason.MEET':
    'Their number is between your target and your price, so agreeing still lands at or above your target.',
  'reason.SCOPE':
    'The price for the smaller job comes from the same formula as your ladder, so the rate behind it does not drop.',
  'reason.DECLINE':
    'Their number is below your floor: at that price this work pays less than you need for the time it takes.',
  'reason.ASK':
    'You do not have a clear number from them yet. A question costs nothing and shows what you could trade.',
  'reason.ANSWER': 'They asked about the work, not the price. Answering keeps the talk going.',
  'reason.ANSWER_HOLD':
    'Answering and restating the price keeps the number you already gave on the table.',
  'reason.CONFIRM':
    'They agreed. Writing the terms down now means you both agree to the same thing.',
  'reason.CLARIFY': 'A short question now avoids answering something they did not ask.',
  'risk.HOLD': 'They may still say no, or come back with the same number.',
  'risk.TRADE': 'They may want the lower price without the condition.',
  'risk.STEP': 'With nothing asked back, they may ask for another step.',
  'risk.MEET': 'You give up the gap between their number and your price.',
  'risk.SCOPE': 'You need to agree exactly what is left out, in writing.',
  'risk.DECLINE': 'They may go to someone else.',
  'risk.ASK': 'It adds a round before you reach a price.',
  'risk.ANSWER': 'They may raise the price question again later.',
  'risk.ANSWER_HOLD': 'They may push back on the price again.',
  'risk.CONFIRM': 'Check that the terms match what you quoted before you send.',
  'risk.CLARIFY': 'It adds a round before you reach a price.',
};

/** the fixed, editable list of returns for a trade (USER DECISION), as the user sees them */
export const CONDITION_COPY: Record<ConditionId, string> = {
  ADVANCE: 'Part of the payment in advance',
  MILESTONES: 'Payment in milestones as work is delivered',
  SCOPE_REDUCE: 'A smaller scope',
  TIMELINE: 'A longer timeline',
  PORTFOLIO: 'Permission to show the work, with a short testimonial',
  REFERRAL: 'An introduction to someone who needs similar work',
};

export const NOTE_COPY: Record<PlanNote, string> = {
  low_confidence:
    'We are not sure what their reply means, so these are general, safe options. Go back and pick what they meant to see options for it.',
  no_move:
    'We could not tell what their reply is doing, so these are general, safe options. Go back and pick what they meant.',
  no_amount: 'They did not name an amount, so no option uses one.',
  unit_assumed: 'Their amount had no unit, so it is read in the same unit as your ladder.',
  unit_mismatch:
    'Their amount is in a different unit from your ladder, so the options do not compare it.',
  not_inr: 'Their amount is not in rupees, so the options do not compare it.',
  quote_below_floor:
    'Your quote is below your floor. The options start from your target instead; you decide whether to re-quote.',
  no_room: 'Your price is at or just above your target, or below it, so no option lowers it.',
  accept_with_lower_amount:
    'They say yes but name a lower number than yours, so the options treat it as a counter offer.',
};

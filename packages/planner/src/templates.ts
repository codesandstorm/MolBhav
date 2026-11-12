/**
 * S6 fallback: fixed reply templates, English and Roman-script Hinglish, polite and firm, one per
 * option kind. Every template is [HYPOTHESIS] pending the owner's review; the ids are listed in
 * docs/product/17_c1_review_checklist.md. Slots are filled only from the planner's allowed
 * values (draft.ts); no template contains a digit or a number word of its own. "[your edit: …]"
 * marks a place the user must fill in themselves.
 */
import type { ConditionId, OptionKind } from './types.ts';

export const LANGS = ['en', 'hinglish'] as const;
export type Lang = (typeof LANGS)[number];
export const TONES = ['polite', 'firm'] as const;
export type Tone = (typeof TONES)[number];

export interface Template {
  id: string;
  kind: OptionKind;
  lang: Lang;
  tone: Tone;
  text: string;
}

export const EDIT_MARK = '[your edit:';

type Pack = Record<OptionKind, Record<Tone, string>>;

const EN: Pack = {
  HOLD: {
    polite:
      'Thanks for getting back to me. My price for this work is {your_price}, and it covers [your edit: what is included]. Happy to walk you through any part of it.',
    firm: 'Thanks for your reply. My price for this work stays at {your_price}. It covers [your edit: what is included]. Let me know if you would like to go ahead.',
  },
  TRADE: {
    polite:
      'Thanks for being open about the budget. I can do {counter_price} if we agree on {condition}. Without that, my price stays at {your_price}. Would that work for you?',
    firm: 'I can come to {counter_price} on the condition of {condition}. Otherwise my price remains {your_price}.',
  },
  STEP: {
    polite:
      'Thanks for your reply. I can come down to {counter_price} for the same scope. I hope that works for you.',
    firm: 'I can offer {counter_price} for this scope.',
  },
  MEET: {
    polite:
      'Thanks. {client_price} works for me for this scope. Shall we confirm the details and get started?',
    firm: 'Agreed at {client_price} for this scope. Please confirm, and I will share the next steps.',
  },
  SCOPE: {
    polite:
      'I understand the budget is fixed. For {scope_price}, I can do a smaller version: [your edit: what is included and what we leave out]. The full scope stays at {your_price}. Shall I send the updated scope?',
    firm: 'At {scope_price}, the scope would be: [your edit: what is included]. The full scope stays at {your_price}.',
  },
  DECLINE: {
    polite:
      'Thank you for the offer. I am not able to do this work at {client_price}. If your budget changes, or you would like to look at a smaller scope, I would be glad to talk again.',
    firm: 'Thanks, but {client_price} does not work for this scope. If anything changes on your side, let me know.',
  },
  ASK: {
    polite:
      'Thanks for your reply. Before we settle the price, could you tell me what matters most to you here: the budget, the timeline or the scope? That will help me suggest the right option.',
    firm: 'To give you a price that fits, I need to know what is fixed on your side: the budget, the timeline or the scope?',
  },
  ANSWER: {
    polite: 'Thanks for asking. [your edit: your answer]. Happy to clarify anything else.',
    firm: '[your edit: your answer]. Let me know if you need anything else to decide.',
  },
  ANSWER_HOLD: {
    polite:
      'Thanks for asking. [your edit: your answer]. The price for the full scope is {your_price}.',
    firm: '[your edit: your answer]. The price for this scope stays at {your_price}.',
  },
  CONFIRM: {
    polite:
      'Great, thank you! To confirm: {agreed_price} for [your edit: the scope], with payment [your edit: payment terms] and delivery by [your edit: date]. Could you reply to confirm, so we are both on the same page?',
    firm: 'Confirming: {agreed_price} for [your edit: the scope], payment [your edit: payment terms], delivery by [your edit: date]. Please reply to confirm before I start.',
  },
  CLARIFY: {
    polite: 'Thanks for your message. Just to be sure I understand: [your edit: your question]?',
    firm: 'Could you clarify [your edit: what you need to know] before we go further?',
  },
};

const HI: Pack = {
  HOLD: {
    polite:
      'Reply ke liye thanks. Is kaam ke liye mera price {your_price} hai, aur ismein [your edit: kya kya included hai] shaamil hai. Kisi bhi part par baat karni ho to bataiye.',
    firm: 'Thanks. Is kaam ke liye mera price {your_price} hi rahega. Ismein [your edit: kya kya included hai] shaamil hai. Aage badhna ho to bataiye.',
  },
  TRADE: {
    polite:
      'Budget ki baat batane ke liye thanks. Agar {condition} ho jaye, to {counter_price} ho sakta hai. Iske bina price {your_price} hi rahega. Aapko theek lagega?',
    firm: '{counter_price} tabhi possible hai jab {condition} ho. Warna price {your_price} hi rahega.',
  },
  STEP: {
    polite:
      'Reply ke liye thanks. Isi scope ke liye {counter_price} kar sakte hain. Umeed hai yeh theek rahega.',
    firm: 'Is scope ke liye {counter_price} kar sakte hain.',
  },
  MEET: {
    polite:
      'Thanks. Is scope ke liye {client_price} theek hai. Details confirm karke shuru karein?',
    firm: 'Is scope ke liye {client_price} par done. Confirm kar dijiye, phir next steps share karenge.',
  },
  SCOPE: {
    polite:
      'Samajh sakte hain ki budget fixed hai. {scope_price} mein chhota version ho sakta hai: [your edit: kya rahega aur kya hatega]. Poora scope {your_price} ka hi hai. Updated scope bhej dein?',
    firm: '{scope_price} mein scope yeh rahega: [your edit: kya included hai]. Poora scope {your_price} ka hi hai.',
  },
  DECLINE: {
    polite:
      'Offer ke liye thanks. {client_price} mein yeh kaam karna possible nahi hoga. Agar budget badle, ya chhote scope par baat karni ho, to zaroor bataiye.',
    firm: 'Thanks, lekin is scope ke liye {client_price} possible nahi hai. Aapki taraf se kuch badle to bataiye.',
  },
  ASK: {
    polite:
      'Reply ke liye thanks. Price final karne se pehle bataiye, aapke liye sabse zaroori kya hai: budget, timeline ya scope? Usse sahi option suggest karna aasaan hoga.',
    firm: 'Sahi price dene ke liye jaanna hoga ki aapki taraf se kya fixed hai: budget, timeline ya scope?',
  },
  ANSWER: {
    polite: 'Poochhne ke liye thanks. [your edit: aapka jawab]. Aur kuch jaanna ho to bataiye.',
    firm: '[your edit: aapka jawab]. Decide karne ke liye aur kuch chahiye to bataiye.',
  },
  ANSWER_HOLD: {
    polite:
      'Poochhne ke liye thanks. [your edit: aapka jawab]. Poore scope ka price {your_price} hai.',
    firm: '[your edit: aapka jawab]. Is scope ka price {your_price} hi hai.',
  },
  CONFIRM: {
    polite:
      'Bahut badhiya, thanks! Confirm kar dete hain: {agreed_price} mein [your edit: scope], payment [your edit: payment terms], aur delivery [your edit: date] tak. Reply karke confirm kar dijiye.',
    firm: 'Confirm: {agreed_price} mein [your edit: scope], payment [your edit: payment terms], delivery [your edit: date] tak. Kaam shuru karne se pehle reply karke confirm kijiye.',
  },
  CLARIFY: {
    polite: 'Message ke liye thanks. Bas confirm karna tha: [your edit: aapka sawaal]?',
    firm: 'Aage badhne se pehle bata dijiye: [your edit: aapka sawaal]?',
  },
};

/** the return asked for in a trade, as a phrase that fits the TRADE templates */
export const CONDITION_TEXT: Record<Lang, Record<ConditionId, string>> = {
  en: {
    ADVANCE: '{advance_pct}% of the payment in advance',
    MILESTONES: 'payment in milestones as the work is delivered',
    SCOPE_REDUCE: 'a smaller scope ([your edit: what we leave out])',
    TIMELINE: 'a longer timeline ([your edit: the new date])',
    PORTFOLIO: 'permission to show this work in my portfolio, with a short testimonial',
    REFERRAL: 'an introduction to someone else who needs similar work',
  },
  hinglish: {
    ADVANCE: '{advance_pct}% advance payment',
    MILESTONES: 'har milestone par payment',
    SCOPE_REDUCE: 'thoda kam scope ([your edit: kya hatayenge])',
    TIMELINE: 'thoda lamba timeline ([your edit: nayi date])',
    PORTFOLIO: 'portfolio mein kaam dikhane ki permission aur chhota sa testimonial',
    REFERRAL: 'kisi aur client se introduction jinhe aisa kaam chahiye',
  },
};

export const TEMPLATES: Template[] = (
  [
    ['en', EN],
    ['hinglish', HI],
  ] as const
).flatMap(([lang, pack]) =>
  (Object.keys(pack) as OptionKind[]).flatMap((kind) =>
    (['polite', 'firm'] as const).map((tone) => ({
      id: `T-${kind}-${lang === 'en' ? 'EN' : 'HI'}-${tone === 'polite' ? 'P' : 'F'}`,
      kind,
      lang,
      tone,
      text: pack[kind][tone],
    })),
  ),
);

export const templateFor = (kind: OptionKind, lang: Lang, tone: Tone): Template =>
  TEMPLATES.find((t) => t.kind === kind && t.lang === lang && t.tone === tone)!;

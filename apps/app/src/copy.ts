/**
 * UI copy. Sources: docs/product/08_experience_and_brand.md §7 (copy deck) and
 * docs/product/13_price_ladder_spec.md §2, §3.5, §5.4 (field wording, errors).
 */
import type { ErrorCode } from '@molbhav/engine';

export const copy = {
  welcome: {
    eyebrow: 'Price-talk prep for freelancers',
    // 08 §7 headline, split so the emphasis can be set in italic
    headlineLead: 'Walk into the price talk with',
    headlineEmphasis: 'a number you can defend.',
    sub: 'Calculate your floor, read your client’s reply, and choose a counter that trades instead of caves.',
    example: 'Try an example deal',
    start: 'Start my deal',
    ageLine: 'MolBhav is for freelancers aged 18 or over.',
    privacy: 'Your deals stay on this device. Nothing you type is sent to us.',
  },
  setup: {
    title: 'Your deal',
    lede: 'A few answers give you a ladder. Everything stays on this device.',
    groupWork: 'The work',
    groupMoney: 'The money',
    name: 'Deal name (optional)',
    nameHint: 'Only you see this. For example “Website for a bakery”.',
    unit: 'Per project, hour or month?',
    unitOptions: { fixed: 'Per project', hour: 'Per hour', month: 'Per month' },
    effortUnit: 'Count work in days or hours?',
    effortUnitOptions: { day: 'Days', hour: 'Hours' },
    effort: {
      fixed: 'How long will this project take?',
      month: 'How much of each month does this client take?',
      hour: 'Roughly how many hours in total? (optional)',
    },
    capacity: 'How many days can you bill in a month?',
    capacityHours: 'How many hours can you bill in a month?',
    // spec 13 §2 + D-L1: required, no default
    capacityHint:
      'Count only days you can charge for: leave out admin, learning, holidays and slow weeks.',
    capacityHintHours:
      'Count only hours you can charge for: leave out admin, learning, holidays and slow weeks.',
    need: 'What do you need to earn in a month?',
    // spec 13 §2, D-L5
    needHint: 'Before income tax. Prices here exclude GST.',
    costs: 'Direct costs for this work',
    costsHint: 'Tools, fonts, stock, subcontracting. Leave empty for no costs.',
    costsMonthHint: 'Per month. Tools, fonts, stock, subcontracting. Leave empty for no costs.',
    more: 'Add more detail',
    buffer: 'Buffer for revisions and unbilled time (%)',
    margin: 'Target margin above floor (%)',
    room: 'Opening room above target (%)',
    recommendedHint: 'Suggested. Change it if you like.',
    quote: 'What did you quote? (optional)',
    submit: 'Calculate my ladder',
  },
  ladder: {
    title: 'Your price ladder',
    floor: 'Floor: don’t go below this',
    target: 'Target: what you aim for',
    opening: 'Opening: where you start',
    how: 'How we got this',
    // spec 13 v0.3 §3.5
    room: (pct: string) =>
      `You can come down up to ${pct} from your opening and still reach your target.`,
    noRoom: 'No room at this price: your opening and target are the same.',
    unusuallyLarge: 'Unusually large: check your inputs',
    notMarket: 'Calculated from your own inputs. This is not a market rate.',
    example: 'Example deal (made up)',
    quotePositions: {
      below_floor: 'Your quote is below your floor',
      floor_to_target: 'Your quote is between your floor and target',
      target_to_opening: 'Your quote is between your target and opening',
      at_or_above_opening: 'Your quote is at or above your opening',
    },
    edit: 'Change inputs',
    evidence: 'Evidence log',
    save: 'Saved on this device',
  },
  evidence: {
    title: 'Evidence log',
    intro: 'Every number on the ladder, with what kind of claim it is and where it comes from.',
    close: 'Back to the ladder',
  },
  settings: {
    title: 'Settings and privacy',
    storage:
      'Your deals are stored only in this browser on this device. MolBhav makes no network requests with your data.',
    delete: 'Delete everything on this device',
    confirm: 'This can’t be undone. Delete all deals?',
    confirmYes: 'Yes, delete everything',
    confirmNo: 'Cancel',
    deleted: 'Everything on this device was deleted.',
    staysTitle: 'What stays on this device',
    stays: [
      'The deals you save, in this browser’s own storage.',
      'The app itself, cached so it opens without a connection.',
    ],
    neverTitle: 'What never leaves it',
    never: [
      'Anything you type: names, prices, costs, quotes.',
      'Your ladders and the working behind them.',
    ],
    deleteTitle: 'Delete everything',
  },
  deals: { title: 'Your deals', open: 'Open', untitled: 'Untitled deal' },
  nav: { home: 'Home', settings: 'Settings and privacy' },
} as const;

/** spec 13 §5.4 messages, keyed by the field that shows them. */
export const errorMessage: Record<ErrorCode, { field: string; text: string }> = {
  u_invalid: { field: 'u', text: 'Choose per project, hour or month' },
  eu_invalid: { field: 'eu', text: 'Choose days or hours' },
  e_missing: { field: 'e', text: 'Add how long this takes' },
  e_out_of_range: { field: 'e', text: 'Check this number' },
  K_out_of_range: { field: 'K', text: 'A month has at most 31 days (744 hours)' },
  M_out_of_range: { field: 'M', text: 'Add what you need to earn in a month' },
  C_out_of_range: { field: 'C', text: 'Costs can’t be negative' },
  b_out_of_range: { field: 'b', text: 'Use a whole percent between 0 and 100' },
  t_out_of_range: { field: 't', text: 'Use a whole percent between 0 and 300' },
  a_out_of_range: { field: 'a', text: 'Use a whole percent between 0 and 300' },
  not_whole_rupees: { field: 'M', text: 'Use whole rupees' },
  e_exceeds_K: { field: 'e', text: 'This client takes more than you can bill in a month' },
  hour_costs_need_e: { field: 'e', text: 'Add total hours to spread your costs' },
};

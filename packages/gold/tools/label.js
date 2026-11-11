// Local blind-labelling tool (packages/gold/src/tool-server.ts). Plain browser JavaScript;
// every piece of text is inserted with textContent. It talks only to its own origin.
'use strict';
(() => {
  const MOVES = ['PRICE_POSITION', 'PUSHBACK', 'CONCESSION', 'INFO_REQUEST', 'ACCEPT', 'OTHER'];
  const OBJECTIONS = [
    'NONE',
    'BUDGET',
    'SCOPE',
    'TIMELINE',
    'PAYMENT_TERMS',
    'TRUST',
    'COMPETITOR',
  ];
  const $ = (id) => document.getElementById(id);
  let state = null;
  let shownAt = 0;
  let hiddenFor = 0;
  let hiddenAt = 0;

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) hiddenAt = performance.now();
    else if (hiddenAt) {
      hiddenFor += performance.now() - hiddenAt;
      hiddenAt = 0;
    }
  });
  const seconds = () => Math.max(0, (performance.now() - shownAt - hiddenFor) / 1000);

  const radios = (box, name, values) =>
    $(box).replaceChildren(
      ...values.map((v) => {
        const l = document.createElement('label');
        const i = document.createElement('input');
        i.type = 'radio';
        i.name = name;
        i.value = v;
        l.append(i, ` ${v}`);
        return l;
      }),
    );
  radios('moves', 'move', MOVES);
  radios('objections', 'objection', OBJECTIONS);

  const picked = (name) => document.querySelector(`input[name=${name}]:checked`)?.value ?? null;
  $('moves').addEventListener('change', () => {
    $('conditional-box').hidden = picked('move') !== 'CONCESSION';
  });

  const load = async () => {
    const r = await fetch('/api/state');
    state = await r.json();
  };

  const show = () => {
    $('pass').textContent = state.pass;
    const wait = state.waiting_for_retest_gap
      ? ` · ${state.waiting_for_retest_gap} waiting for the ${state.retest_days}-day gap`
      : '';
    $('progress').textContent = `${state.done} of ${state.total} labelled${wait}`;
    const item = state.queue[0];
    $('finished').hidden = Boolean(item);
    $('form').hidden = !item;
    if (!item) return;
    $('message').textContent = item.text;
    $('form').reset();
    $('conditional-box').hidden = true;
    $('error').textContent = '';
    shownAt = performance.now();
    hiddenFor = 0;
    document.querySelector('input[name=move]').focus();
  };

  $('form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const item = state.queue[0];
    const move = picked('move');
    const objection = picked('objection');
    if (!move || !objection) {
      $('error').textContent = 'Choose a move and an objection (NONE if there is none).';
      return;
    }
    const rupees = $('rupees').value.trim();
    const high = $('high').value.trim();
    const cond = picked('conditional');
    const body = {
      message_id: item.id,
      move,
      objection,
      conditional: move === 'CONCESSION' ? (cond === null ? null : cond === 'true') : null,
      amount: rupees
        ? {
            rupees,
            rupees_high: high || null,
            unit: $('unit').value,
            currency: $('currency').value,
            ambiguous: $('ambiguous').checked,
          }
        : {
            rupees: null,
            rupees_high: null,
            unit: null,
            currency: null,
            ambiguous: $('ambiguous').checked,
          },
      unsure: $('unsure').checked,
      seconds: seconds(),
    };
    const r = await fetch('/api/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const out = await r.json();
    if (!r.ok) {
      $('error').textContent = out.error || 'could not save';
      return;
    }
    await load();
    show();
  });

  void load().then(show);
})();

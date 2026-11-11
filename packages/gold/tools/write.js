// Local writing tool (packages/gold/src/tool-server.ts). Plain browser JavaScript; every piece
// of text is inserted with textContent. It talks only to its own origin (127.0.0.1).
'use strict';
(() => {
  const $ = (id) => document.getElementById(id);
  let state = null;
  let index = 0;
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

  const messageFor = (cardId) => state.messages.find((m) => m.card_id === cardId);
  const firstOpen = () => {
    const i = state.cards.findIndex(
      (c) => !messageFor(c.card_id) && !state.skipped.includes(c.card_id),
    );
    return i < 0 ? state.cards.length - 1 : i;
  };

  const load = async () => {
    const r = await fetch('/api/state');
    state = await r.json();
  };

  const show = () => {
    const card = state.cards[index];
    const msg = messageFor(card.card_id);
    const median = state.median_seconds == null ? '–' : `${Math.round(state.median_seconds)} s`;
    $('progress').textContent =
      `Card ${index + 1} of ${state.cards.length} (${card.card_id}) · written ` +
      `${state.messages.length} · skipped ${state.skipped.length} · median writing time ${median}`;
    $('card').replaceChildren(
      ...card.lines.map((l) => {
        const p = document.createElement('p');
        p.textContent = l;
        return p;
      }),
    );
    $('context').textContent = card.context;
    $('text').value = msg ? msg.text : '';
    $('text').readOnly = Boolean(msg && msg.labelled);
    const lang = msg ? msg.language : card.language;
    for (const r of document.querySelectorAll('input[name=language]')) r.checked = r.value === lang;
    $('status').textContent = msg
      ? msg.labelled
        ? `Saved as ${msg.id}. Already labelled, so it can't be edited: write a new message instead.`
        : `Saved as ${msg.id}. Editing adds to its writing time.`
      : state.skipped.includes(card.card_id)
        ? 'You skipped this card earlier.'
        : '';
    $('error').textContent = '';
    shownAt = performance.now();
    hiddenFor = 0;
    $('text').focus();
  };

  const post = async (path, body) => {
    const r = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const out = await r.json();
    if (!r.ok) throw new Error(out.error || 'could not save');
    return out;
  };

  const save = async () => {
    const card = state.cards[index];
    const msg = messageFor(card.card_id);
    if (msg && msg.labelled) return;
    const text = $('text').value;
    if (!text.trim()) {
      $('error').textContent = 'Write the message first, or skip the card.';
      return;
    }
    const lang = document.querySelector('input[name=language]:checked');
    try {
      await post('/api/save', {
        id: msg ? msg.id : undefined,
        card_id: card.card_id,
        text,
        language: lang ? lang.value : card.language,
        seconds: seconds(),
      });
      await load();
      index = firstOpen();
      show();
    } catch (e) {
      $('error').textContent = e.message;
    }
  };

  $('form').addEventListener('submit', (e) => {
    e.preventDefault();
    void save();
  });
  $('text').addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      void save();
    }
  });
  $('skip').addEventListener('click', async () => {
    try {
      await post('/api/skip', { card_id: state.cards[index].card_id });
      await load();
      index = firstOpen();
      show();
    } catch (e) {
      $('error').textContent = e.message;
    }
  });
  $('prev').addEventListener('click', () => {
    index = Math.max(0, index - 1);
    show();
  });
  $('next').addEventListener('click', () => {
    index = Math.min(state.cards.length - 1, index + 1);
    show();
  });
  $('resume').addEventListener('click', () => {
    index = firstOpen();
    show();
  });

  void load().then(() => {
    index = firstOpen();
    show();
  });
})();

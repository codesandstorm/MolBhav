import { useCallback, useEffect, useMemo, useState } from 'react';
import { computeLadder, type LadderOk } from '@molbhav/engine';
import {
  allowedFor,
  draftRequest,
  planReplies,
  type AllowedNumbers,
  type DraftRequest,
  type OptionKind,
  type PlanOption,
} from '@molbhav/planner';
import { copy } from './copy.ts';
import { emptyForm, errorField, exampleForm, toLadderInput, type DealForm } from './form.ts';
import { Setup } from './screens/Setup.tsx';
import { Ladder } from './screens/Ladder.tsx';
import { Evidence, Settings, Welcome } from './screens/Other.tsx';
import { emptyReader, Reader, type ReaderState } from './screens/Reader.tsx';
import { Options, type TheirSide } from './screens/Options.tsx';
import { Draft, type DraftChoices } from './screens/Draft.tsx';
import { TopBar } from './components/ui.tsx';
import { claimsFor } from './claims.ts';
import {
  deleteEverything,
  getDeal,
  listDeals,
  newId,
  saveDeal,
  type StoredDeal,
} from './storage.ts';
import {
  allowedForPlan,
  emptyPrefs,
  ladderKey,
  planInputFrom,
  templateText,
  withChoices,
  type ReplyPrefs,
  type StoredReply,
} from './reply.ts';

type Screen =
  'welcome' | 'setup' | 'ladder' | 'evidence' | 'settings' | 'reader' | 'options' | 'draft';

/** S6 in memory: the option's numbers (base), the user's choices and their draft */
interface DraftSession {
  kind: OptionKind | null;
  /** the request the option produced; null when the user writes their own reply */
  base: DraftRequest | null;
  /** the numbers a reply the user writes may use */
  ownAllowed: AllowedNumbers;
  choices: DraftChoices;
  text: string;
  edited: boolean;
  stale: boolean;
  from: 'options' | 'ladder';
}

const requestOf = (s: DraftSession): DraftRequest | null =>
  s.base === null ? null : withChoices(s.base, s.choices);

export function App() {
  const [screen, setScreen] = useState<Screen>('welcome');
  const [form, setForm] = useState<DealForm>(emptyForm);
  const [deal, setDeal] = useState<StoredDeal | null>(null);
  const [result, setResult] = useState<LadderOk | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [deals, setDeals] = useState<StoredDeal[]>([]);
  // the reader's message and results live in memory only, never in storage
  const [reader, setReader] = useState<ReaderState>(emptyReader);
  const [readerFrom, setReaderFrom] = useState<Screen>('welcome');
  const [prefs, setPrefsState] = useState<ReplyPrefs>(emptyPrefs);
  const [draft, setDraft] = useState<DraftSession | null>(null);
  const patchReader = useCallback(
    (patch: Partial<ReaderState>) => setReader((r) => ({ ...r, ...patch })),
    [],
  );
  const setPrefs = (p: Partial<ReplyPrefs>) => setPrefsState((x) => ({ ...x, ...p }));
  const openReader = (from: Screen) => {
    setReaderFrom(from);
    setScreen('reader');
  };

  const refresh = useCallback(() => {
    listDeals()
      .then(setDeals)
      .catch(() => setDeals([]));
  }, []);
  useEffect(refresh, [refresh]);

  const calculate = async (f: DealForm, id: string | null, next: Screen = 'ladder') => {
    setForm(f);
    const r = computeLadder(toLadderInput(f));
    const errs: Record<string, string> = {};
    if (!r.ok) {
      const { field, text } = errorField(r.error, f);
      errs[field] = text;
      setErrors(errs);
      setResult(null);
      setScreen('setup');
      return;
    }
    if (r.quote && 'error' in r.quote) errs.Q = 'Check your quote';
    // a draft in progress, and the smaller effort typed for it, belong to this ladder only
    if (!(result !== null && ladderKey(result) === ladderKey(r))) {
      setDraft(null);
      setPrefs({ reducedEffort: null });
    }
    setErrors(errs);
    setResult(r);
    const now = Date.now();
    const old = id === null ? undefined : await getDeal(id).catch(() => undefined);
    // a saved reply belongs to the ladder it was drafted from: dropped when that changes
    const reply = old?.reply?.ladderKey === ladderKey(r) ? old.reply : undefined;
    const d: StoredDeal = {
      id: id ?? newId(),
      createdAt: old?.createdAt ?? now,
      updatedAt: now,
      form: f,
      ...(reply ? { reply } : {}),
    };
    setDeal(d);
    try {
      await saveDeal(d);
    } catch {
      /* storage unavailable: the ladder still works, nothing is lost but persistence */
    }
    refresh();
    setScreen(next);
  };

  // S5: the plan, from the ladder and the reader's results (never the message itself)
  const hasRead = reader.status === 'done' || reader.status === 'error';
  const planInput = useMemo(
    () => (result && hasRead ? planInputFrom(reader, result, prefs) : null),
    [result, hasRead, reader, prefs],
  );
  const plan = useMemo(() => (planInput ? planReplies(planInput) : null), [planInput]);
  const their: TheirSide | null = planInput && {
    move: planInput.client.move,
    moveLabel: reader.moveOverride !== null ? 'USER DECISION' : 'ESTIMATE',
    amount: planInput.client.amount,
    amountLabel: reader.amountText !== null ? 'USER DECISION' : 'ESTIMATE',
  };

  // S6: save the reply with the deal on every change (IndexedDB, this device only)
  useEffect(() => {
    if (!draft || !deal || !result) return;
    const request = requestOf(draft);
    const reply: StoredReply = {
      ladderKey: ladderKey(result),
      request,
      allowed: request ? allowedFor(request) : draft.ownAllowed,
      prefs,
      text: draft.text,
      edited: draft.edited,
      savedAt: Date.now(),
    };
    const d = { ...deal, reply, updatedAt: reply.savedAt };
    saveDeal(d)
      .then(() => setDeal(d))
      .catch(() => {
        /* storage unavailable: the draft stays on screen */
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- save when the draft changes
  }, [draft]);

  const choicesFor = (kind: OptionKind | null, condition: DraftChoices['condition']) => ({
    lang: draft?.choices.lang ?? 'en',
    tone: draft?.choices.tone ?? 'polite',
    condition: kind === 'TRADE' ? condition : null,
    advancePct: prefs.advancePct,
  });

  const startDraft = (o: PlanOption) => {
    if (!planInput || !result) return;
    const choices = choicesFor(o.kind, o.condition);
    const base = draftRequest(
      o,
      {
        move: planInput.client.move,
        objection: planInput.client.objection,
        lang: choices.lang,
        tone: choices.tone,
        unit: result.unit,
      },
      prefs.advancePct,
    );
    const session: DraftSession = {
      kind: o.kind,
      base,
      ownAllowed: { prices: [], percents: [] },
      choices,
      text: '',
      edited: false,
      stale: false,
      from: 'options',
    };
    setDraft({ ...session, text: templateText(withChoices(base, choices)) });
    setScreen('draft');
  };

  const startOwn = () => {
    if (!plan) return;
    setDraft({
      kind: null,
      base: null,
      ownAllowed: allowedForPlan(plan, prefs),
      choices: choicesFor(null, null),
      text: '',
      edited: true,
      stale: false,
      from: 'options',
    });
    setScreen('draft');
  };

  const openSaved = () => {
    const r = deal?.reply;
    if (!r) return;
    setPrefsState(r.prefs);
    setDraft({
      kind: r.request?.kind ?? null,
      base: r.request,
      ownAllowed: r.allowed,
      choices: {
        lang: r.request?.lang ?? 'en',
        tone: r.request?.tone ?? 'polite',
        condition: r.request?.condition ?? null,
        advancePct: r.request?.numbers.advance_pct === 25n ? 25n : r.prefs.advancePct,
      },
      text: r.text,
      edited: r.edited,
      stale: false,
      from: 'ladder',
    });
    setScreen('draft');
  };

  const setChoices = (c: Partial<DraftChoices>) => {
    if (!draft) return;
    const choices = { ...draft.choices, ...c };
    if (draft.kind === 'TRADE')
      setPrefs({ condition: choices.condition, advancePct: choices.advancePct });
    const next = { ...draft, choices };
    const request = requestOf(next);
    if (draft.edited || request === null) setDraft({ ...next, stale: request !== null });
    else setDraft({ ...next, text: templateText(request) });
  };

  const rebuild = () => {
    if (!draft) return;
    const request = requestOf(draft);
    if (request) setDraft({ ...draft, text: templateText(request), edited: false, stale: false });
  };

  const draftAllowed = useMemo(() => {
    if (!draft) return null;
    const r = requestOf(draft);
    return r ? allowedFor(r) : draft.ownAllowed;
  }, [draft]);

  const savedReply =
    deal?.reply && result && deal.reply.ladderKey === ladderKey(result) ? deal.reply : null;

  return (
    <>
      <TopBar
        onHome={() => setScreen('welcome')}
        onSettings={() => setScreen('settings')}
        settingsLabel={copy.nav.settings}
        current={screen === 'settings' ? 'settings' : 'other'}
      />
      <main className="main" data-screen={screen}>
        {screen === 'welcome' && (
          <Welcome
            deals={deals}
            onStart={() => {
              setForm(emptyForm);
              setDeal(null);
              setErrors({});
              setScreen('setup');
            }}
            onExample={() => void calculate(exampleForm, null)}
            onOpen={(d) => void calculate(d.form, d.id)}
            onReader={() => openReader('welcome')}
          />
        )}
        {screen === 'setup' && (
          <Setup
            key={JSON.stringify(errors) + (deal?.id ?? '')}
            initial={form}
            errors={errors}
            onSubmit={(f) => void calculate(f, deal?.id ?? null)}
          />
        )}
        {screen === 'ladder' && result && (
          <Ladder
            result={result}
            isExample={form.name === exampleForm.name}
            onEdit={() => setScreen('setup')}
            onEvidence={() => setScreen('evidence')}
            onReader={() => openReader('ladder')}
            saved={savedReply ? (savedReply.request?.kind ?? null) : undefined}
            onSaved={openSaved}
          />
        )}
        {screen === 'evidence' && result && (
          <Evidence claims={claimsFor(form, result)} onClose={() => setScreen('ladder')} />
        )}
        {screen === 'reader' && (
          <Reader
            state={reader}
            set={patchReader}
            onBack={() => setScreen(readerFrom === 'ladder' && result ? 'ladder' : 'welcome')}
            hasLadder={result !== null}
            onOptions={() => setScreen('options')}
            onSetup={() => {
              setForm(emptyForm);
              setDeal(null);
              setErrors({});
              setScreen('setup');
            }}
            onExample={() => void calculate(exampleForm, null, 'options')}
          />
        )}
        {screen === 'options' && plan && result && their && (
          <Options
            plan={plan}
            ladder={result}
            their={their}
            moveName={their.move === null ? null : copy.reader.moves[their.move]}
            prefs={prefs}
            setPrefs={setPrefs}
            onDraft={startDraft}
            onOwn={startOwn}
            onBack={() => setScreen('reader')}
          />
        )}
        {screen === 'draft' && draft && draftAllowed && (
          <Draft
            kind={draft.kind}
            choices={draft.choices}
            setChoices={setChoices}
            text={draft.text}
            setText={(text) => setDraft({ ...draft, text, edited: true })}
            stale={draft.stale}
            onRebuild={rebuild}
            allowed={draftAllowed}
            onBack={() =>
              setScreen(
                draft.from === 'options' && plan ? 'options' : result ? 'ladder' : 'welcome',
              )
            }
            backLabel={draft.from === 'options' && plan ? copy.draft.back : copy.draft.backLadder}
          />
        )}
        {screen === 'settings' && (
          <Settings
            onDeleted={async () => {
              await deleteEverything();
              setDeals([]);
              setResult(null);
              setForm(emptyForm);
              setDeal(null);
              setReader(emptyReader);
              setPrefsState(emptyPrefs);
              setDraft(null);
            }}
          />
        )}
      </main>
    </>
  );
}

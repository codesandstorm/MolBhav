import { useCallback, useEffect, useState } from 'react';
import { computeLadder, type LadderOk } from '@molbhav/engine';
import { copy } from './copy.ts';
import { emptyForm, errorField, exampleForm, toLadderInput, type DealForm } from './form.ts';
import { Setup } from './screens/Setup.tsx';
import { Ladder } from './screens/Ladder.tsx';
import { Evidence, Settings, Welcome } from './screens/Other.tsx';
import { emptyReader, Reader, type ReaderState } from './screens/Reader.tsx';
import { TopBar } from './components/ui.tsx';
import { claimsFor } from './claims.ts';
import { deleteEverything, listDeals, newId, saveDeal, type StoredDeal } from './storage.ts';

type Screen = 'welcome' | 'setup' | 'ladder' | 'evidence' | 'settings' | 'reader';

export function App() {
  const [screen, setScreen] = useState<Screen>('welcome');
  const [form, setForm] = useState<DealForm>(emptyForm);
  const [dealId, setDealId] = useState<string | null>(null);
  const [result, setResult] = useState<LadderOk | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [deals, setDeals] = useState<StoredDeal[]>([]);
  // the reader's message and results live in memory only, never in storage
  const [reader, setReader] = useState<ReaderState>(emptyReader);
  const [readerFrom, setReaderFrom] = useState<Screen>('welcome');
  const patchReader = useCallback(
    (patch: Partial<ReaderState>) => setReader((r) => ({ ...r, ...patch })),
    [],
  );
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

  const calculate = async (f: DealForm, id: string | null) => {
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
    setErrors(errs);
    setResult(r);
    const now = Date.now();
    const deal: StoredDeal = { id: id ?? newId(), createdAt: now, updatedAt: now, form: f };
    setDealId(deal.id);
    try {
      await saveDeal(deal);
    } catch {
      /* storage unavailable: the ladder still works, nothing is lost but persistence */
    }
    refresh();
    setScreen('ladder');
  };

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
              setDealId(null);
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
            key={JSON.stringify(errors) + (dealId ?? '')}
            initial={form}
            errors={errors}
            onSubmit={(f) => void calculate(f, dealId)}
          />
        )}
        {screen === 'ladder' && result && (
          <Ladder
            result={result}
            isExample={form.name === exampleForm.name}
            onEdit={() => setScreen('setup')}
            onEvidence={() => setScreen('evidence')}
            onReader={() => openReader('ladder')}
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
          />
        )}
        {screen === 'settings' && (
          <Settings
            onDeleted={async () => {
              await deleteEverything();
              setDeals([]);
              setResult(null);
              setForm(emptyForm);
              setDealId(null);
              setReader(emptyReader);
            }}
          />
        )}
      </main>
    </>
  );
}

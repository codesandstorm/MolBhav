import { useCallback, useEffect, useState } from 'react';
import { computeLadder, type LadderOk } from '@molbhav/engine';
import { copy } from './copy.ts';
import { emptyForm, errorField, exampleForm, toLadderInput, type DealForm } from './form.ts';
import { Setup } from './screens/Setup.tsx';
import { Ladder } from './screens/Ladder.tsx';
import { Evidence, Settings, Welcome } from './screens/Other.tsx';
import { TopBar } from './components/ui.tsx';
import { claimsFor } from './claims.ts';
import { deleteEverything, listDeals, newId, saveDeal, type StoredDeal } from './storage.ts';

type Screen = 'welcome' | 'setup' | 'ladder' | 'evidence' | 'settings';

export function App() {
  const [screen, setScreen] = useState<Screen>('welcome');
  const [form, setForm] = useState<DealForm>(emptyForm);
  const [dealId, setDealId] = useState<string | null>(null);
  const [result, setResult] = useState<LadderOk | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [deals, setDeals] = useState<StoredDeal[]>([]);

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
          />
        )}
        {screen === 'evidence' && result && (
          <Evidence claims={claimsFor(form, result)} onClose={() => setScreen('ladder')} />
        )}
        {screen === 'settings' && (
          <Settings
            onDeleted={async () => {
              await deleteEverything();
              setDeals([]);
              setResult(null);
              setForm(emptyForm);
              setDealId(null);
            }}
          />
        )}
      </main>
    </>
  );
}
